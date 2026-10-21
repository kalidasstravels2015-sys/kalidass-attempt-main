import { getRecentQuotes } from '../_quotesBuffer.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const customWebhook = url.searchParams.get('webhook') || (env && (env.GOOGLE_SHEET_WEBHOOK_URL || env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL));

    if (customWebhook && customWebhook.startsWith('http')) {
      try {
        const response = await fetch(customWebhook, {
          method: 'GET',
          redirect: 'follow',
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            if (data && data.success) {
              const sheetQuotes = data.calculatorQuotes || data.leads || [];
              const bufferQuotes = getRecentQuotes();
              const quoteMap = new Map();
              bufferQuotes.forEach(q => { if (q && q.quoteId) quoteMap.set(q.quoteId, q); });
              sheetQuotes.forEach(q => { if (q && q.quoteId) quoteMap.set(q.quoteId, q); });

              return new Response(JSON.stringify({
                success: true,
                count: (data.leads || []).length,
                leads: data.leads || [],
                calculatorQuotes: Array.from(quoteMap.values()),
                syncedFrom: 'GoogleSheet'
              }), {
                status: 200,
                headers: {
                  'Content-Type': 'application/json; charset=utf-8',
                  'Access-Control-Allow-Origin': '*',
                  'Cache-Control': 'no-store, max-age=0'
                }
              });
            }
          } catch (jsonErr) {}
        }
      } catch (fetchErr) {
        console.warn('Google Sheet Sync fetch notice:', fetchErr.message);
      }
    }

    const localBufferQuotes = getRecentQuotes();
    return new Response(JSON.stringify({ success: true, count: 0, leads: [], calculatorQuotes: localBufferQuotes }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message, leads: [] }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}

    const url = new URL(request.url);
    const customWebhook = url.searchParams.get('webhook') || (env && (env.GOOGLE_SHEET_WEBHOOK_URL || env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL));

    if (customWebhook && customWebhook.startsWith('http')) {
      fetch(customWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(body)
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true, lead: body }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
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
