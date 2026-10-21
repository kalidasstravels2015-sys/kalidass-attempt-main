// Cloudflare Pages Function: /api/admin/sheet-config
// Serves and caches Google Sheet Webhook URL for clients

let inMemoryWebhookUrl = '';

export async function onRequestGet({ env }) {
  const url = inMemoryWebhookUrl || (env && (env.GOOGLE_SHEET_WEBHOOK_URL || env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL)) || '';
  return new Response(JSON.stringify({
    success: true,
    webhookUrl: url
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    inMemoryWebhookUrl = (data.webhookUrl || '').trim();
    return new Response(JSON.stringify({
      success: true,
      webhookUrl: inMemoryWebhookUrl
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
