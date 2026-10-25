let edgeDriverSeq = 101;

// Cloudflare Pages Function: /api/record-driver-lead
export async function onRequestPost({ request, env }) {
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

    const leadId = data.leadId || `#KT-DRV-${edgeDriverSeq++}`;
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Asynchronously forward to Google Apps Script Webhook backup if configured
    const webhookUrl = data.webhookUrl || (env && (env.GOOGLE_SHEET_WEBHOOK_URL || env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL));
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'driver_lead',
            leadId,
            date: timestamp,
            name: data.name || '',
            phone: data.phone || '',
            category: data.category || 'Attach Car',
            carCount: data.carCount || '1 Car',
            cars: data.cars || '',
            licenseType: data.licenseType || '',
            experience: data.experience || '',
            city: data.city || '',
            hasDlPhoto: Boolean(data.hasDlPhoto),
            hasRcPhoto: Boolean(data.hasRcPhoto),
            notes: data.notes || ''
          })
        });
      } catch (_) {}
    }

    return new Response(JSON.stringify({ success: true, leadId, timestamp }), {
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
