// Cloudflare Pages Function: /api/admin/chat-logs
const SEED_CHAT_QUERIES = [
  {
    queryId: '#CHAT-101',
    timestamp: '16-Oct-2026, 09:15 am',
    sessionId: 'KT-SES-8821',
    sourcePage: '/services/tirupati-package/',
    userQuery: 'How much for Ertiga to Tirupati 1-day package?',
    aiResponse: 'Here are our official Chennai ⇄ Tirupati / Tirumala 1-Day Package rates: Ertiga / XL6: ₹7,500 all-inclusive of Tolls, AP Border Permit & Driver Bata. ₹500 advance to confirm.',
    detectedIntent: 'Tirupati Package',
    customerContact: 'None',
    sourceEngine: 'Rule Engine'
  },
  {
    queryId: '#CHAT-102',
    timestamp: '16-Oct-2026, 09:42 am',
    sessionId: 'KT-SES-9043',
    sourcePage: '/tariff/',
    userQuery: 'What is outstation per km rate for Innova Crysta?',
    aiResponse: 'Outstation rate for Toyota Innova Crysta is ₹22/km (min 250 km/day) + Driver Bata ₹700/calendar day. Tolls and state permits at actuals.',
    detectedIntent: 'Outstation Tariff',
    customerContact: 'None',
    sourceEngine: 'Gemini 2.5 Flash'
  }
];

export async function onRequestGet() {
  return new Response(JSON.stringify({ success: true, count: SEED_CHAT_QUERIES.length, queries: SEED_CHAT_QUERIES }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
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
