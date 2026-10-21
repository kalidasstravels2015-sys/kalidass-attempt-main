// Cloudflare Pages Function: /api/record-booking
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

    const bookingId = data.bookingId || `#KT-BK-${Date.now().toString().slice(-4)}`;

    // Asynchronously forward to Google Apps Script Webhook backup
    const webhookUrl = data.webhookUrl || (env && (env.GOOGLE_SHEET_WEBHOOK_URL || env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL));
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'booking_activity',
            bookingId,
            date: new Date().toLocaleString(),
            ...data
          })
        });
      } catch (_) {}
    }

    return new Response(JSON.stringify({ success: true, bookingId }), {
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
