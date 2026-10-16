// Cloudflare Pages Function: /api/ai-chat
// 24/7 AI Fare Concierge for Kalidass Travels (Chennai)
// Grounded strictly on published tariff_config.json and tourBookingConfigs.js

const TARIFF_KNOWLEDGE = `
You are the official 24/7 AI Fare Concierge for Kalidass Travels, Chennai (Helpline: +91 89395 39211).
Your mission is to provide fast, warm, and 100% accurate taxi fare quotes and itinerary advice strictly based on Kalidass Travels' rate card.

CRITICAL RULES:
1. STRICT TARIFF ADHERENCE: Never invent tariffs, make up numbers, or offer unauthorized discounts. If a customer tries to bargain or asks for a discount, politely explain that Kalidass Travels offers honest, fixed, all-inclusive pricing with transparent rates and no hidden charges.
2. PAYMENT POLICY: Always highlight: "₹500 advance is required to confirm booking and lock cab assignment (avoids last-minute cancellations). The remaining balance is paid directly to the driver upon trip completion."
3. CONTACT INFO: Official Helpline & 24/7 Dispatch: +91 89395 39211.
4. MULTI-LINGUAL: Reply in the language the user speaks — English, Tamil, or Tanglish (Tamil written in English script). Keep responses concise, clean, and nicely formatted with bullet points.

VERIFIED RATE CARD:

1. CHENNAI ⇄ TIRUPATI / TIRUMALA 1-DAY & MULTI-DAY PACKAGES (Round trip ~320 km, 14-16 hours):
   - AC Sedan (Swift Dzire / Toyota Etios - 4 Pax): ₹6,000 (1 Day) | ₹9,500 (2 Days)
   - Comfort SUV (Maruti Ertiga / XL6 - 6 Pax): ₹7,500 (1 Day) | ₹11,500 (2 Days)
   - Spacious MUV (Toyota Innova - 7 Pax): ₹8,500 (1 Day) | ₹12,500 (2 Days)
   - Premium MUV (Toyota Innova Crysta - 7 Pax): ₹10,000 (1 Day) | ₹15,500 (2 Days)
   - Tempo Traveller (12 Pax): ₹12,500 (1 Day) | ₹19,500 (2 Days)
   * SAME-DAY INCLUSIONS: Covers Cab, Fuel, NH FASTag Tolls, AP State Border Permit, Tirumala Ghat Road hill climb & Driver Bata. ₹500 advance to confirm booking.
   * NOTE ON DARSHAN: Kalidass Travels provides dedicated cab transportation only. Darshan tickets must be arranged via TTD.

2. LOCAL CHENNAI HOURLY PACKAGES:
   - Sedan (Dzire/Etios):
     * 4 hrs / 40 km: ₹1,350
     * 5 hrs / 50 km: ₹1,500
     * 8 hrs / 80 km: ₹2,200
     * 10 hrs / 100 km: ₹2,600
     * 12 hrs / 120 km: ₹3,050
     * Extra km: ₹15 | Extra hr: ₹150
   - Ertiga / XL6:
     * 4 hrs / 40 km: ₹1,700
     * 5 hrs / 50 km: ₹2,000
     * 8 hrs / 80 km: ₹2,800
     * 10 hrs / 100 km: ₹3,400
     * 12 hrs / 120 km: ₹3,900
     * Extra km: ₹17 | Extra hr: ₹200
   - Toyota Innova:
     * 4 hrs / 40 km: ₹1,900
     * 5 hrs / 50 km: ₹2,300
     * 8 hrs / 80 km: ₹3,200
     * 10 hrs / 100 km: ₹3,600
     * 12 hrs / 120 km: ₹4,200
     * Extra km: ₹19 | Extra hr: ₹250
   - Innova Crysta:
     * 4 hrs / 40 km: ₹2,800 | 5 hrs / 50 km: ₹3,200 | 8 hrs / 80 km: ₹4,500 | 10 hrs / 100 km: ₹5,200 | 12 hrs / 120 km: ₹6,000
     * Extra km: ₹22 | Extra hr: ₹350
   - Tempo Traveller (12 Seater):
     * 4 hrs / 40 km: ₹3,500 | 5 hrs / 50 km: ₹4,200 | 8 hrs / 80 km: ₹5,500 | 10 hrs / 100 km: ₹6,500 | 12 hrs / 120 km: ₹7,000
     * Extra km: ₹24 | Extra hr: ₹500

3. OUTSTATION & INTERCITY PER-KM TARIFFS (Round trip / Drop):
   - Swift Dzire / Etios: ₹14 / km (Min 250 km/day, Driver Bata ₹400/calendar day)
   - Maruti Ertiga: ₹17 / km (Min 250 km/day, Driver Bata ₹500/calendar day)
   - Toyota Innova: ₹20 / km (Min 250 km/day, Driver Bata ₹600/calendar day)
   - Innova Crysta: ₹22 / km (Min 250 km/day, Driver Bata ₹700/calendar day)
   - Tempo Traveller: ₹26 / km (Min 300 km/day, Driver Bata ₹800/calendar day)
   * General outstation note: Highway Tolls, State Border Permits (if outside Tamil Nadu), and Parking are at actuals.

4. POPULAR ROUND TRIPS FROM CHENNAI:
   - Mahabalipuram (Same Day): Sedan ₹2,600 - ₹3,000 | Ertiga ₹3,500 - ₹3,900
   - Pondicherry (Same Day): Sedan ₹4,500 - ₹5,000 | Ertiga ₹5,800 - ₹6,200
   - Kanchipuram Temple Tour: Sedan ₹3,000 - ₹3,400 | Ertiga ₹4,000 - ₹4,400
   - Vellore Golden Temple: Sedan ₹4,200 - ₹4,600 | Ertiga ₹5,200 - ₹5,800
`;

function deterministicFallback(userText) {
  const query = (userText || '').toLowerCase();

  if (query.includes('tirupati') || query.includes('tirumala') || query.includes('balaji')) {
    return {
      reply: `Here are our official **Chennai ⇄ Tirupati / Tirumala 1-Day Package** rates (same-day return ~320 km):\n\n` +
        `• **AC Sedan (Dzire / Etios - 4 Pax):** ₹6,000\n` +
        `• **Maruti Ertiga / XL6 (6 Pax):** ₹7,500\n` +
        `• **Toyota Innova (7 Pax):** ₹8,500\n` +
        `• **Toyota Innova Crysta:** ₹10,000\n` +
        `• **Tempo Traveller (12 Pax):** ₹12,500\n\n` +
        `✅ **Included in 1-Day Package:** Fuel, NH FASTag Tolls, AP Border Permit, Tirumala Ghat Road ascent, and Driver Bata.\n` +
        `🛡️ **Policy:** ₹500 advance to confirm & lock cab (avoids last-minute cancellation). Balance post-trip.\n\n` +
        `Would you like to confirm a booking or check availability for a specific date?`,
      actionSuggestion: {
        type: 'tirupati_package',
        label: 'Book Tirupati Package on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I want to book a Chennai to Tirupati 1-Day Package.'
      }
    };
  }

  if (query.includes('local') || query.includes('hourly') || query.includes('city') || query.includes('4hr') || query.includes('8hr')) {
    return {
      reply: `Here are our **Chennai City Local Rental Packages**:\n\n` +
        `• **AC Sedan (Dzire / Etios):**\n` +
        `  - 4 hrs / 40 km: ₹1,350\n` +
        `  - 8 hrs / 80 km: ₹2,200 (Popular)\n` +
        `  - Extra km: ₹15 | Extra hr: ₹150\n\n` +
        `• **Maruti Ertiga (6 Seater):**\n` +
        `  - 4 hrs / 40 km: ₹1,700\n` +
        `  - 8 hrs / 80 km: ₹2,800\n` +
        `  - Extra km: ₹17 | Extra hr: ₹200\n\n` +
        `• **Toyota Innova (7 Seater):**\n` +
        `  - 8 hrs / 80 km: ₹3,200\n\n` +
        `🛡️ **Policy:** ₹500 advance to confirm & lock cab (avoids last-minute cancellation). Balance post-trip.`,
      actionSuggestion: {
        type: 'local_package',
        label: 'Book Local Rental on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I want to book a Local Chennai Cab package.'
      }
    };
  }

  if (query.includes('pondy') || query.includes('pondicherry')) {
    return {
      reply: `For **Chennai ⇄ Pondicherry (Same Day Return)**:\n\n` +
        `• **AC Sedan (4 Pax):** ~₹4,500 - ₹5,000 (Based on ~320 km round trip at ₹14/km + driver bata ₹400)\n` +
        `• **Maruti Ertiga (6 Pax):** ~₹5,800 - ₹6,200 (At ₹17/km + driver bata ₹500)\n` +
        `• **Toyota Innova (7 Pax):** ~₹7,000 (At ₹20/km + driver bata ₹600)\n\n` +
        `*Tolls are payable at actual FASTag plazas. ₹500 advance to confirm booking.*`,
      actionSuggestion: {
        type: 'pondicherry_package',
        label: 'Book Pondicherry Cab on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I need a Chennai to Pondicherry cab quote.'
      }
    };
  }

  if (query.includes('outstation') || query.includes('drop') || query.includes('per km') || query.includes('rate') || query.includes('tariff')) {
    return {
      reply: `Here are our **Outstation & Intercity Tariff Rates**:\n\n` +
        `• **Swift Dzire / Etios:** ₹14 / km (Min 250 km/day, Driver Bata ₹400/day)\n` +
        `• **Maruti Ertiga (6 Seater):** ₹17 / km (Min 250 km/day, Driver Bata ₹500/day)\n` +
        `• **Toyota Innova (7 Seater):** ₹20 / km (Min 250 km/day, Driver Bata ₹600/day)\n` +
        `• **Toyota Innova Crysta:** ₹22 / km (Min 250 km/day, Driver Bata ₹700/day)\n` +
        `• **Tempo Traveller (12 Seater):** ₹26 / km (Min 300 km/day, Driver Bata ₹800/day)\n\n` +
        `🛡️ **Guarantee:** ₹500 advance to confirm & lock cab (avoids last-minute cancellation). Balance post-trip.`,
      actionSuggestion: {
        type: 'outstation_inquiry',
        label: 'Get Exact Route Quote on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I would like an outstation cab quote.'
      }
    };
  }

  return {
    reply: `Hello! I am your **Kalidass Travels AI Fare Assistant** 🚕\n\n` +
      `I can instantly help you with:\n` +
      `• 🕉️ **Tirupati Balaji 1-Day Packages** (Sedan ₹6,000 | Ertiga ₹7,500 all-inclusive)\n` +
      `• ⏱️ **Local Chennai Hourly Packages** (4hr, 8hr, 12hr rentals)\n` +
      `• 🛣️ **Outstation Cabs** (Sedan ₹14/km, Ertiga ₹17/km, Innova ₹20/km)\n` +
      `• ✈️ **Airport Pickup & Drops**\n\n` +
      `Please tell me your destination, travel date, or preferred car!`,
    actionSuggestion: null
  };
}

export async function onRequestPost({ request, env }) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      try {
        const text = await request.text();
        body = JSON.parse(text);
      } catch (e) {}
    }

    const messages = body.messages || [];
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    // Check for Gemini API Key in Cloudflare env or process.env
    const apiKey = (env && env.GEMINI_API_KEY) || (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY);

    if (!apiKey) {
      // Deterministic instant response fallback
      const fallbackResult = deterministicFallback(lastUserMessage);
      return new Response(JSON.stringify({
        success: true,
        reply: fallbackResult.reply,
        actionSuggestion: fallbackResult.actionSuggestion,
        source: 'local_deterministic'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Call Google Gemini 2.5 Flash API
    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: TARIFF_KNOWLEDGE }]
      },
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
      }
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    if (!geminiRes.ok) {
      // Graceful fallback to deterministic engine on API error
      const fallbackResult = deterministicFallback(lastUserMessage);
      return new Response(JSON.stringify({
        success: true,
        reply: fallbackResult.reply,
        actionSuggestion: fallbackResult.actionSuggestion,
        source: 'local_fallback'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const geminiData = await geminiRes.json();
    const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    const reply = candidateText || deterministicFallback(lastUserMessage).reply;

    return new Response(JSON.stringify({
      success: true,
      reply,
      source: 'gemini'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      reply: deterministicFallback('').reply,
      error: err.message
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
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
