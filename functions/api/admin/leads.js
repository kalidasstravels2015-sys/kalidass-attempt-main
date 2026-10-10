// Cloudflare Pages Function: /api/admin/leads
const SEED_LEADS = [
  {
    quoteId: '#WA-98803',
    timestamp: '09-Oct-2026, 11:29 am',
    sourcePage: 'WhatsApp (+91 98803 09619)',
    calculatorEngine: 'WhatsApp Direct Chat',
    tripType: 'One Day Round Trip (19-Oct)',
    pickup: 'Chennai (Oct 19th - 4 Pax)',
    drop: 'Tirupati Balaji Darshan (4 Pax)',
    vehicle: 'Sedan (Dzire / Etios)',
    distanceKm: '300',
    estimatedFare: 6000,
    status: 'Active Enquiry',
    metadata: 'WhatsApp Lead: +91 98803 09619 | 4 Pax | Travel Date: Oct 19th | Inquiry: Balaji Darshan'
  },
  {
    quoteId: '#WA-73038',
    timestamp: '09-Oct-2026, 10:49 am',
    sourcePage: 'WhatsApp (+91 73038 09755)',
    calculatorEngine: 'WhatsApp Direct Chat',
    tripType: 'One Day Round Trip',
    pickup: 'Chennai',
    drop: 'Tirumala 1-Day Trip',
    vehicle: 'Sedan (Dzire / Etios)',
    distanceKm: '320',
    estimatedFare: 6000,
    status: 'Rates Quoted',
    metadata: 'WhatsApp Lead: +91 73038 09755 | Inquiry: Chennai to Tirumala 1-Day Trip Sedan Rs.6000'
  }
];

export async function onRequestGet() {
  return new Response(JSON.stringify({ success: true, count: SEED_LEADS.length, leads: SEED_LEADS }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPost({ request }) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}

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
