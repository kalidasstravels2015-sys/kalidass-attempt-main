// Cloudflare Pages Function: /api/next-quote-id
// Centralized atomic daily quotation sequence coordinator for Kalidass Travels.
// Synchronizes with Google Sheets Trips database and maintains edge cache.

const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzyfKwbaG83dNG3EAWf719-UWbWxWpEoBQoRoRbJsHjD-Bx8uKUfytP5Eb2RXaJfgDz/exec';

let edgeDateCode = '';
let edgeSeq = 0;

function sanitizeTripsWebhookUrl(rawUrl) {
  const clean = (rawUrl || '').trim();
  if (!clean || !clean.startsWith('http') || clean.includes('AKfycbzjPh0a2ju')) {
    return DEFAULT_WEBHOOK_URL;
  }
  return clean;
}

// Format 6-digit date string DDMMYY in Asia/Kolkata
function getKolkataDateCode() {
  const d = new Date();
  const options = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(d);
  const dd = parts.find(p => p.type === 'day')?.value || '11';
  const mm = parts.find(p => p.type === 'month')?.value || '11';
  const yy = parts.find(p => p.type === 'year')?.value || '26';
  return `${dd}${mm}${yy}`;
}

const MONTH_SHORT_UPPER = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function getRefPrefixFromDateCode(dateCode) {
  const dd = dateCode.slice(0, 2);
  const mmIdx = Math.max(0, Math.min(11, parseInt(dateCode.slice(2, 4), 10) - 1));
  return `KT/${dd}${MONTH_SHORT_UPPER[mmIdx] || 'NOV'}/`;
}

function extractMaxSeqFromTrips(trips, dateCode) {
  if (!Array.isArray(trips)) return 0;
  let maxSeq = 0;
  const qRegex = new RegExp(`Q-${dateCode}-(\\d+)`, 'gi');
  const refPrefix = getRefPrefixFromDateCode(dateCode).replace('/', '\\/').replace('/', '\\/');
  const ktRegex = new RegExp(`${refPrefix}0*(\\d+)`, 'gi');
  for (const row of trips) {
    const searchStr = `${row?.id || ''} ${row?.quoteRef || ''} ${row?.notes || ''}`;
    let m;
    qRegex.lastIndex = 0;
    while ((m = qRegex.exec(searchStr)) !== null) {
      const val = parseInt(m[1], 10);
      if (!isNaN(val) && val > maxSeq) maxSeq = val;
    }
    ktRegex.lastIndex = 0;
    while ((m = ktRegex.exec(searchStr)) !== null) {
      const val = parseInt(m[1], 10);
      if (!isNaN(val) && val > maxSeq) maxSeq = val;
    }
  }
  return maxSeq;
}

async function fetchFromGoogleSheets(webhookUrl, dateCode, claim = false) {
  const cleanUrl = sanitizeTripsWebhookUrl(webhookUrl);
  if (!cleanUrl) return null;
  const target = `${cleanUrl}?action=next_quote_id&dateCode=${dateCode}${claim ? '&claim=true' : ''}`;
  const res = await fetch(target, {
    method: 'GET',
    redirect: 'follow',
    headers: { 'Accept': 'application/json' },
    cf: { cacheTtl: 0 }
  });
  if (res.ok) {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data && data.success && data.quoteId) {
        return data;
      }
      if (data && Array.isArray(data.trips)) {
        const maxSheetSeq = extractMaxSeqFromTrips(data.trips, dateCode);
        const baseSeq = Math.max(maxSheetSeq, edgeSeq);
        const nextSeq = baseSeq + 1;
        if (claim) {
          edgeSeq = nextSeq;
        }
        return {
          success: true,
          currentSeq: baseSeq,
          nextSeq,
          quoteId: `Q-${dateCode}-${nextSeq}`,
          claimed: claim
        };
      }
    } catch (_) {}
  }
  return null;
}

export async function onRequestGet({ request, env }) {
  try {
    const dateCode = getKolkataDateCode();
    if (edgeDateCode !== dateCode) {
      edgeDateCode = dateCode;
      edgeSeq = 0;
    }

    const url = new URL(request.url);
    const claim = url.searchParams.get('claim') === 'true' || url.searchParams.get('advance') === 'true';
    const webhookUrl = url.searchParams.get('webhook') || (env && (env.GOOGLE_SHEET_WEBHOOK_URL || env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL)) || DEFAULT_WEBHOOK_URL;

    // 1. Try atomic fetch from Google Sheets
    try {
      const gData = await fetchFromGoogleSheets(webhookUrl, dateCode, claim);
      if (gData && gData.quoteId) {
        const committedSeq = claim
          ? Number(gData.nextSeq || gData.currentSeq || 0)
          : Number(gData.currentSeq || 0);
        if (committedSeq > edgeSeq) edgeSeq = committedSeq;
        return new Response(JSON.stringify({
          success: true,
          dateCode,
          currentSeq: gData.currentSeq,
          nextSeq: gData.nextSeq,
          quoteId: gData.quoteId,
          claimed: Boolean(gData.claimed ?? claim),
          source: 'GoogleSheet'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }
    } catch (gErr) {
      console.warn('[next-quote-id] Google sheet sync warning:', gErr.message);
    }

    // 2. Resilient Edge Memory Fallback (GET without claim is strictly read-only peek!)
    const nextSeq = edgeSeq + 1;
    if (claim) {
      edgeSeq = nextSeq;
    }
    const quoteId = `Q-${dateCode}-${nextSeq}`;

    return new Response(JSON.stringify({
      success: true,
      dateCode,
      currentSeq: claim ? nextSeq : edgeSeq,
      nextSeq,
      quoteId,
      claimed: claim,
      source: 'EdgeMemory'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (err) {
    const dateCode = getKolkataDateCode();
    edgeSeq += 1;
    return new Response(JSON.stringify({
      success: true,
      dateCode,
      currentSeq: edgeSeq,
      quoteId: `Q-${dateCode}-${edgeSeq}`,
      source: 'EmergencyFallback'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const dateCode = getKolkataDateCode();
    if (edgeDateCode !== dateCode) {
      edgeDateCode = dateCode;
      edgeSeq = 0;
    }

    const url = new URL(request.url);
    const webhookUrl = url.searchParams.get('webhook') || (env && (env.GOOGLE_SHEET_WEBHOOK_URL || env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL)) || DEFAULT_WEBHOOK_URL;

    // Advance on Google Sheets
    try {
      const gData = await fetchFromGoogleSheets(webhookUrl, dateCode, true);
      if (gData && gData.quoteId) {
        const remoteSeq = Number(gData.nextSeq || gData.currentSeq || 0);
        if (remoteSeq > edgeSeq) edgeSeq = remoteSeq;
        return new Response(JSON.stringify({
          success: true,
          dateCode,
          seq: remoteSeq,
          quoteId: gData.quoteId,
          nextQuoteId: `Q-${dateCode}-${remoteSeq + 1}`,
          source: 'GoogleSheet'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }
    } catch (_) {}

    edgeSeq += 1;
    return new Response(JSON.stringify({
      success: true,
      dateCode,
      seq: edgeSeq,
      quoteId: `Q-${dateCode}-${edgeSeq}`,
      nextQuoteId: `Q-${dateCode}-${edgeSeq + 1}`,
      source: 'EdgeMemory'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (err) {
    const dateCode = getKolkataDateCode();
    edgeSeq += 1;
    return new Response(JSON.stringify({
      success: true,
      dateCode,
      seq: edgeSeq,
      quoteId: `Q-${dateCode}-${edgeSeq}`,
      nextQuoteId: `Q-${dateCode}-${edgeSeq + 1}`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

