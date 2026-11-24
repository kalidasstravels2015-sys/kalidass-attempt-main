const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzjPh0a2ju-Xv9KRFQ5gCg9s5Y4P8QR9C2rkO4nh4XYBBO5QD-tbKIXWcDav2ydgaUW/exec';

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
    let webhookUrl = data.webhookUrl || (env && (env.DRIVER_LEADS_WEBHOOK_URL || env.GOOGLE_SHEET_WEBHOOK_URL)) || DEFAULT_WEBHOOK_URL;
    // Guard: Never post driver leads to Trips sheet
    if (typeof webhookUrl === 'string' && webhookUrl.includes('AKfycbzyf')) {
      webhookUrl = DEFAULT_WEBHOOK_URL;
    }
    let driveFolderUrl = '';
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        const gRes = await fetch(webhookUrl, {
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
            notes: data.notes || '',
            dlFile: data.dlFile || null,
            rcFile: data.rcFile || null,
            carFile: data.carFile || null
          })
        });
        if (gRes.ok) {
          try {
            const gData = await gRes.json();
            if (gData && gData.driveFolderUrl) {
              driveFolderUrl = gData.driveFolderUrl;
            }
          } catch (_) {}
        }
      } catch (_) {}
    }

    return new Response(JSON.stringify({ success: true, leadId, timestamp, driveFolderUrl }), {
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

export async function onRequestGet({ request, env }) {
  try {
    const webhookUrl = (env && (env.DRIVER_LEADS_WEBHOOK_URL || env.GOOGLE_SHEET_WEBHOOK_URL)) || DEFAULT_WEBHOOK_URL;
    const res = await fetch(webhookUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      redirect: 'follow'
    });
    if (res.ok) {
      const data = await res.json();
      return new Response(JSON.stringify({
        success: true,
        leads: data.leads || data.driverLeads || []
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message, leads: [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  return new Response(JSON.stringify({ success: true, leads: [] }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPatch({ request }) {
  try {
    const body = await request.json().catch(() => ({}));
    return new Response(JSON.stringify({ success: true, updated: body }), {
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
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
