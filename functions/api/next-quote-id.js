// Cloudflare Pages Function: /api/next-quote-id
// Centralized atomic daily quotation sequence coordinator for Kalidass Travels.
// Synchronizes with Google Sheets ScriptProperties and maintains edge cache.

const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzjPh0a2ju-Xv9KRFQ5gCg9s5Y4P8QR9C2rkO4nh4XYBBO5QD-tbKIXWcDav2ydgaUW/exec';

let edgeDateCode = '';
let edgeSeq = 0;

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

async function fetchFromGoogleSheets(webhookUrl, dateCode, claim = false) {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return null;
  const target = `${webhookUrl}?action=next_quote_id&dateCode=${dateCode}${claim ? '&claim=true' : ''}`;
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

