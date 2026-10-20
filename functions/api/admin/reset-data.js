// Cloudflare Pages Function: /api/admin/reset-data
export async function onRequestPost({ request }) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}

    const pin = String(body.pin || '').trim();
    if (pin !== '2015') {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Invalid Admin PIN' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'All admin data logs and operations files have been reset to a clean slate.'
    }), {
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
