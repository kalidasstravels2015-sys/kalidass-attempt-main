// Cloudflare Pages Function: /api/admin/bookings
// Connects Confirmed Bookings with Google Sheets 2-Way Sync

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const customWebhook = url.searchParams.get('webhook') || (env && env.GOOGLE_SHEET_WEBHOOK_URL);

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
            if (data && data.success && Array.isArray(data.bookings)) {
              return new Response(JSON.stringify({
                success: true,
                count: data.bookings.length,
                bookings: data.bookings,
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
        console.warn('Google Sheet Sync bookings notice:', fetchErr.message);
      }
    }

    return new Response(JSON.stringify({ success: true, count: 0, bookings: [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message, bookings: [] }), {
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
    const customWebhook = url.searchParams.get('webhook') || (env && env.GOOGLE_SHEET_WEBHOOK_URL);

    if (customWebhook && customWebhook.startsWith('http')) {
      try {
        fetch(customWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'admin_booking_sync',
            date: new Date().toLocaleString('en-IN'),
            ...body
          })
        }).catch(() => {});
      } catch (_) {}
    }

    return new Response(JSON.stringify({ success: true, booking: body }), {
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
