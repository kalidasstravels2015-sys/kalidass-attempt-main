// Cloudflare Pages Function: /api/next-quote-id
// Centralized atomic daily quotation sequence coordinator for Kalidass Travels.
// Synchronizes with Google Sheets Trips database and maintains edge cache.

const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzpTM1pLXWLF-E80-HAXjj2ghAC_0tvFW1blTJC7rJojqUhTcKIwQz0t-NQMCScN2VA/exec';

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

function extractMaxSeqFromTrips(trips, dateCode) {
  if (!Array.isArray(trips)) return 0;
  let maxSeq = 0;
  const regex = new RegExp(`Q-${dateCode}-(\\d+)`, 'gi');
  for (const row of trips) {
    const searchStr = `${row?.id || ''} ${row?.notes || ''}`;
    let m;
    regex.lastIndex = 0;
    while ((m = regex.exec(searchStr)) !== null) {
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
          quoteId: `Q-${dateCode}-${nextSeq}`
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
        const remoteSeq = Number(gData.nextSeq || gData.currentSeq || 0);
        if (remoteSeq > edgeSeq) edgeSeq = remoteSeq;
        return new Response(JSON.stringify({
          success: true,
          dateCode,
          currentSeq: gData.currentSeq,
          nextSeq: gData.nextSeq,
          quoteId: gData.quoteId,
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

    // 2. Resilient Edge Memory Fallback
    if (claim || edgeSeq === 0) {
      edgeSeq += 1;
    }
    const quoteId = `Q-${dateCode}-${edgeSeq}`;

    return new Response(JSON.stringify({
      success: true,
      dateCode,
      currentSeq: edgeSeq,
      nextSeq: edgeSeq + 1,
      quoteId,
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

