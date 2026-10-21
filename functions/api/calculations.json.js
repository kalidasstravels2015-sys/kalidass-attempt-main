// Cloudflare Pages Function: /api/calculations.json
// Serves live stream of calculated quotes for Website Calc Radar

import { getRecentQuotes } from './_quotesBuffer.js';

export async function onRequestGet() {
  const calculations = getRecentQuotes();

  return new Response(JSON.stringify({
    success: true,
    count: calculations.length,
    calculations: calculations
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
