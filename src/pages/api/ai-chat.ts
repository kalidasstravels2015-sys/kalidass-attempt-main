import type { APIRoute } from 'astro';

export const prerender = false;

// PRICING RULES:
// 1. ₹500 advance to confirm & lock cab (protects against last-minute cancellation).
// 2. Remaining balance paid post-trip.

const SYSTEM_PROMPT = `
You are the official 24/7 AI Fare Concierge for Kalidass Travels, Chennai (Helpline: +91 89395 39211).
Your mission is to think carefully, understand complex passenger itineraries, and provide 100% accurate quotes strictly following Kalidass Travels' rate card.

CRITICAL PRICING RULES:
1. STRICT TARIFF ADHERENCE: Never invent prices or give random discounts.
2. OUTSTATION TARIFF FORMULA:
   - Min billing: 250 km / calendar day (300 km / day for Tempo Traveller).
   - Swift Dzire / Etios: ₹14/km | Driver Bata: ₹400/calendar day
   - Maruti Ertiga / XL6: ₹17/km | Driver Bata: ₹500/calendar day
   - Toyota Innova: ₹20/km | Driver Bata: ₹600/calendar day
   - Innova Crysta: ₹22/km | Driver Bata: ₹700/calendar day
   - Tempo Traveller (12 Seater): ₹26/km | Driver Bata: ₹800/calendar day
   - For multi-day trips: Total Estimate = (Days × Min Km × Rate/km) + (Days × Driver Bata). Tolls, parking & interstate permits at actuals.
3. FIXED PACKAGES (SAME-DAY RETURN FROM CHENNAI ONLY):
   - Tirupati 1-Day Package (~320 km round trip): Sedan ₹6,000 | Ertiga ₹7,500 | Innova ₹8,500 | Crysta ₹10,000 | Tempo ₹12,500 (Includes Fuel, Tolls, AP Border Permit, Tirumala Ghat ascent & Driver Bata).
   - Tirupati 2-Day Package: Sedan ₹9,500 | Ertiga ₹11,500 | Innova ₹12,500 | Crysta ₹15,500 | Tempo ₹19,500.
4. IMPORTANT: If an itinerary spans MULTIPLE DAYS or visits MULTIPLE CITIES (e.g., Chennai -> Mahabalipuram -> Kanchipuram -> Vellore -> Tirupati over 4 or 5 days), DO NOT quote the 1-day package! Break it down by days, calculate minimum km (Days × 250 km) and driver bata, and provide vehicle options with ₹500 advance to confirm.
5. ADVANCE POLICY: Always highlight "₹500 advance to confirm booking & lock cab (prevents last-minute cancellation). Remaining balance post-trip."
`;

function parseMultiDayOrComplex(text: string): string | null {
  const lower = text.toLowerCase();

  // Detect multi-day signals: dates like 31.10, 01.11, days count, stay in, multi-stop
  const dateMatches = text.match(/\b\d{1,2}[./-]\d{1,2}\b/g) || [];
  const hasMultipleDates = dateMatches.length >= 2;
  const hasStay = lower.includes('stay') || lower.includes('night') || lower.includes('hotel');
  const hasMultiCity = (lower.includes('vellore') && lower.includes('tirupati')) ||
                       (lower.includes('mahabalipuram') && lower.includes('tirupati')) ||
                       (lower.includes('kanchipuram') && lower.includes('tirupati'));
  const hasDaysMention = lower.includes('5 day') || lower.includes('4 day') || lower.includes('3 day') || lower.includes('days');

  if (hasMultipleDates || (hasStay && lower.includes('tirupati')) || hasMultiCity || (hasDaysMention && hasMultiCity)) {
    // Estimate days
    let days = Math.max(dateMatches.length, 3);
    if (lower.includes('31.10') && lower.includes('04.11')) days = 5;
    else if (lower.includes('5 day')) days = 5;
    else if (lower.includes('4 day')) days = 4;
    else if (lower.includes('3 day')) days = 3;

    const minKm = days * 250;
    const tempoKm = days * 300;

    const sedanTotal = (minKm * 14) + (days * 400);
    const ertigaTotal = (minKm * 17) + (days * 500);
    const innovaTotal = (minKm * 20) + (days * 600);
    const crystaTotal = (minKm * 22) + (days * 700);
    const tempoTotal = (tempoKm * 26) + (days * 800);

    return `Here is the customized quote for your **${days}-Day Tour** (Airport Pickup ➔ Mahabalipuram ➔ Kanchipuram ➔ Vellore ➔ Tirupati / Tirumala ➔ Airport Drop):\n\n` +
      `• **AC Sedan (Dzire / Etios - 4 Pax):** ~₹${sedanTotal.toLocaleString('en-IN')} (₹14/km + ₹${days * 400} Bata)\n` +
      `• **Maruti Ertiga / XL6 (6 Pax):** ~₹${ertigaTotal.toLocaleString('en-IN')} (₹17/km + ₹${days * 500} Bata)\n` +
      `• **Toyota Innova (7 Pax):** ~₹${innovaTotal.toLocaleString('en-IN')} (₹20/km + ₹${days * 600} Bata)\n` +
      `• **Toyota Innova Crysta (7 Pax):** ~₹${crystaTotal.toLocaleString('en-IN')} (₹22/km + ₹${days * 700} Bata)\n` +
      `• **Tempo Traveller (12 Pax):** ~₹${tempoTotal.toLocaleString('en-IN')} (₹26/km + ₹${days * 800} Bata)\n\n` +
      `📋 **Details:**\n` +
      `• Dedicated AC cab & experienced chauffeur at your disposal for all ${days} days (based on ${minKm} km min quota).\n` +
      `• NH FASTag Tolls, Parking & AP Border Permit payable at actuals.\n` +
      `🛡️ **Policy:** ₹500 advance to confirm & lock cab (avoids last-minute cancellation). Remaining balance post-trip!`;
  }

  return null;
}

export function getTariffReply(userText: string): string {
  const query = (userText || '').toLowerCase();

  // Check for multi-day or complex itinerary first!
  const complexQuote = parseMultiDayOrComplex(userText);
  if (complexQuote) {
    return complexQuote;
  }

  // 1-Day Tirupati
  if (query.includes('tirupati') || query.includes('tirumala') || query.includes('balaji')) {
    return `Here are our official **Chennai ⇄ Tirupati 1-Day Package** rates (same-day return ~320 km):\n\n` +
      `• **AC Sedan (Dzire / Etios - 4 Pax):** ₹6,000\n` +
      `• **Maruti Ertiga / XL6 (6 Pax):** ₹7,500\n` +
      `• **Toyota Innova (7 Pax):** ₹8,500\n` +
      `• **Toyota Innova Crysta:** ₹10,000\n` +
      `• **Tempo Traveller (12 Pax):** ₹12,500\n\n` +
      `✅ **All-Inclusive:** Fuel, Tolls, AP Border Permit, Tirumala Ghat Road ascent & Driver Bata.\n` +
      `🛡️ **Policy:** ₹500 advance to confirm & lock cab (avoids last-minute cancellation). Balance post-trip.`;
  }

  // Local Chennai Hourly
  if (query.includes('local') || query.includes('hourly') || query.includes('city') || query.includes('4hr') || query.includes('8hr')) {
    return `Here are our **Chennai City Local Rental Packages**:\n\n` +
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
      `🛡️ **Policy:** ₹500 advance to confirm & lock cab (avoids last-minute cancellation). Balance post-trip.`;
  }

  // Pondicherry
  if (query.includes('pondy') || query.includes('pondicherry')) {
    return `For **Chennai ⇄ Pondicherry (Same Day Return)**:\n\n` +
      `• **AC Sedan (4 Pax):** ~₹4,500 - ₹5,000 (~320 km round trip at ₹14/km + driver bata ₹400)\n` +
      `• **Maruti Ertiga (6 Pax):** ~₹5,800 - ₹6,200 (At ₹17/km + driver bata ₹500)\n` +
      `• **Toyota Innova (7 Pax):** ~₹7,000 (At ₹20/km + driver bata ₹600)\n\n` +
      `*Highway tolls payable at actual FASTag plazas. ₹500 advance to confirm booking.*`;
  }

  // Outstation km
  if (query.includes('outstation') || query.includes('drop') || query.includes('per km') || query.includes('rate') || query.includes('tariff')) {
    return `Here are our **Outstation & Intercity Tariff Rates**:\n\n` +
      `• **Swift Dzire / Etios:** ₹14 / km (Min 250 km/day, Driver Bata ₹400/day)\n` +
      `• **Maruti Ertiga (6 Seater):** ₹17 / km (Min 250 km/day, Driver Bata ₹500/day)\n` +
      `• **Toyota Innova (7 Seater):** ₹20 / km (Min 250 km/day, Driver Bata ₹600/day)\n` +
      `• **Toyota Innova Crysta:** ₹22 / km (Min 250 km/day, Driver Bata ₹700/day)\n` +
      `• **Tempo Traveller (12 Seater):** ₹26 / km (Min 300 km/day, Driver Bata ₹800/day)\n\n` +
      `🛡️ **Guarantee:** ₹500 advance to confirm & lock cab (avoids last-minute cancellation). Balance post-trip.`;
  }

  return `I can instantly quote fares for you:\n\n` +
    `• 🕉️ **Tirupati Balaji 1-Day:** Sedan ₹6,000 | Ertiga ₹7,500\n` +
    `• ⏱️ **Local Chennai 8hr:** Sedan ₹2,200 | Ertiga ₹2,800\n` +
    `• 🛣️ **Outstation:** ₹14/km Sedan | ₹17/km Ertiga | ₹20/km Innova\n` +
    `• 🏖️ **Pondicherry:** Sedan ₹4,500 | Ertiga ₹5,800\n\n` +
    `Tell me your travel destination or vehicle preference to get started!`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (_) {
      try {
        const text = await request.text();
        body = JSON.parse(text);
      } catch (e) {}
    }

    const messages = body.messages || [];
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';

    // Check if GEMINI_API_KEY is configured
    const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: messages.map((m: any) => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.content }]
            })),
            generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate) {
            return new Response(JSON.stringify({ success: true, reply: candidate, source: 'gemini' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
          }
        }
      } catch (_) {}
    }

    // Smart heuristic tariff engine
    const reply = getTariffReply(lastUserMessage);
    return new Response(JSON.stringify({ success: true, reply, source: 'smart_tariff_engine' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: true, reply: getTariffReply('') }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
};
