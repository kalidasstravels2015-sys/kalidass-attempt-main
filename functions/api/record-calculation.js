// Cloudflare Pages Function: /api/record-calculation
// Handles POST requests on production without 405 Method Not Allowed
export async function onRequestPost({ request }) {
  try {
    let data = {};
    try {
      data = await request.json();
    } catch (_) {
      try {
        const text = await request.text();
        data = JSON.parse(text);
      } catch (e) {}
    }

    const quoteId = data.quoteId || `#LEAD-${Date.now().toString().slice(-4)}`;

    // Asynchronously forward to Google Apps Script Webhook backup
    try {
      fetch('https://script.google.com/macros/s/AKfycbwoEpKqa3Qg-DIvMe06pGUgGLlC_0vJQev61nzIh9ssh1-uHZ5VtYkGzpMVwhEyi7tvEQ/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          type: 'calculator_activity',
          quoteId: quoteId,
          date: data.timestamp || new Date().toLocaleString(),
          sourcePage: data.sourcePage || '/admin',
          calculatorEngine: data.calculatorEngine || 'Office Phone Desk Log',
          tripType: data.tripType || 'Inbound Lead',
          pickup: data.pickup || '',
          drop: data.drop || '',
          vehicle: data.vehicle || '',
          estimate: data.estimatedFare || data.quotedFare || 0,
          status: data.status || 'Active Enquiry',
          metadata: data.metadata || ''
        })
      }).catch(() => {});
    } catch (_) {}

    return new Response(JSON.stringify({ success: true, quoteId }), {
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
