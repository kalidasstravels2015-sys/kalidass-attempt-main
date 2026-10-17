// Cloudflare Pages Function: /api/ai-chat
// 24/7 AI Travel & Fare Assistant for Kalidass Travels (Chennai)
// Grounded strictly on published tariff_config.json and tourBookingConfigs.js

const TARIFF_KNOWLEDGE = `
You are the official 24/7 AI Travel & Fare Assistant ("Let me Help You") for Kalidass Travels, Chennai (Helplines: +91 89395 39211, +91 63819 39769, +91 90923 03060).
Your mission is to provide fast, warm, and 100% accurate taxi fare quotes and itinerary advice strictly based on Kalidass Travels' rate card.

CRITICAL RULES:
1. STRICT TARIFF ADHERENCE: Never invent tariffs, make up numbers, or offer unauthorized discounts. If a customer tries to bargain or asks for a discount, politely explain that Kalidass Travels offers honest, fixed, all-inclusive pricing with transparent rates and no hidden charges.
2. PAYMENT POLICY: Always highlight: "₹500 advance is required to confirm booking and lock cab assignment (avoids last-minute cancellations). The remaining balance is paid directly to the driver upon trip completion."
3. CONTACT INFO: Official 24/7 Helplines & Dispatch:
   - Primary 24/7 Helpline: +91 89395 39211
   - Alternate Helpline: +91 63819 39769
   - Booking Dispatch Desk: +91 90923 03060
   Whenever users ask for phone numbers, contact info, or customer support, share these numbers.
4. CONVERSATIONAL INTELLIGENCE & MULTI-TURN:
   - Speak naturally like an experienced, polite human travel advisor (like ChatGPT / Gemini).
   - In multi-turn conversations, do NOT repeatedly dump identical rigid bulleted lists or canned templates if the user just asks a simple follow-up like "for 2 days" or "what about Ertiga?". Answer the specific question directly, warmly, and concisely.
   - For example, if they previously asked for a Tirupati 1-day package and now ask "for 2 days", answer: "For a relaxed 2-day Tirupati trip, our package rate is ₹9,500 for Swift Dzire (4 pax) and ₹11,500 for Maruti Ertiga (6 pax). This includes dedicated cab for both days, tolls, AP permit, and driver bata. Would you like me to book this for you?"
5. MULTI-LINGUAL: Reply in the language the user speaks — English, Tamil (தமிழ்), Tanglish, Hindi (हिन्दी), Telugu (తెలుగు), Malayalam (മലയാളம்), Kannada (ಕನ್ನಡ), or any world language. Keep responses concise, clean, and nicely formatted.

VERIFIED RATE CARD:

1. CHENNAI ⇄ TIRUPATI / TIRUMALA PACKAGES (Round trip ~320 km, dedicated cab for all days):
   - AC Sedan (Swift Dzire / Toyota Etios - 4 Pax):
     1 Day: ₹6,000 | 2 Days: ₹9,500 | 3 Days: ₹13,200 | 4 Days: ₹16,700 | 5 Days: ₹20,200 (Add ₹3,500/extra day beyond 3 days)
   - Comfort SUV (Maruti Ertiga / XL6 - 6 Pax):
     1 Day: ₹7,500 | 2 Days: ₹11,500 | 3 Days: ₹15,800 | 4 Days: ₹19,800 | 5 Days: ₹23,800 (Add ₹4,000/extra day beyond 3 days)
   - Spacious MUV (Toyota Innova - 7 Pax):
     1 Day: ₹8,500 | 2 Days: ₹12,500 | 3 Days: ₹17,500 | 4 Days: ₹21,500 | 5 Days: ₹25,500 (Add ₹4,000/extra day beyond 3 days)
   - Premium MUV (Toyota Innova Crysta - 7 Pax):
     1 Day: ₹10,000 | 2 Days: ₹16,000 | 3 Days: ₹22,500 | 4 Days: ₹28,500 | 5 Days: ₹34,500 (Add ₹6,000/extra day beyond 3 days)
   - Tempo Traveller (12 Pax):
     1 Day: ₹12,500 | 2 Days: ₹19,500 | 3 Days: ₹27,000 | 4 Days: ₹34,000 | 5 Days: ₹41,000 (Add ₹7,000/extra day beyond 3 days)
   * SAME-DAY INCLUSIONS (1 Day): Covers Dedicated Cab, Fuel, NH FASTag Tolls, AP Border Permit, Tirumala Ghat Road hill climb & Driver Bata. ₹500 advance to confirm.
   * MULTI-DAY INCLUSIONS (2+ Days): Covers Dedicated Cab, Fuel, Tirumala hill climb & Driver Bata for all days. FASTag Tolls & AP permit at actual plazas.
   * WEBSITE ACTION PROTOCOL & DEEP-LINKING: Whenever answering any package or destination inquiry, ALWAYS provide a direct markdown action link to the website's booking engine with the days pre-filled:
     - Tirupati (N days): [👉 Open Tirupati N-Day Calculator & View Live Quote](/services/tirupati-package/?days={N})
     - Pondicherry (N days): [👉 Open Pondicherry Calculator](/services/pondicherry-one-day-trip/?days={N})
     - Thiruvannamalai: [👉 Open Thiruvannamalai Calculator](/services/thiruvannamalai-girivalam-trip/?days={N})
     - Kanchipuram: [👉 Open Kanchipuram Calculator](/services/kanchipuram-temple-trip/?days={N})
     - Chidambaram: [👉 Open Chidambaram Calculator](/services/chidambaram-temple-trip/?days={N})
     - Navagraha: [👉 Open Navagraha Calculator](/services/navagraha-tour/?days={N})
     - Rameswaram: [👉 Open Rameswaram Calculator](/services/rameswaram-2-days/?days={N})
     - Sabarimala: [👉 Open Sabarimala Calculator](/services/sabarimala-trip/?days={N})
     - Vellore: [👉 Open Vellore Calculator](/services/vellore-golden-temple/?days={N})
     - Outstation Cabs: [👉 Calculate Outstation Fare](/services/outstation-cabs/)
     - Airport Taxi: [👉 Book Airport Taxi](/services/chennai-airport-taxi/)
     - Local Hourly Rental: [👉 View Local Packages](/tariff#local)
   * If customer asks to 'open', 'launch', 'navigate', or 'calculate' the page (e.g. 'open tirupati package and set 5 days and calculate'), explicitly confirm that you are directing them to the page with 5 days pre-configured, and provide the direct button:
     [🚀 Launch Tirupati 5-Day Booking Engine Now](/services/tirupati-package/?days=5)

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

3. OUTSTATION & INTERCITY PER-KM TARIFFS (Applies to general city trips like Bangalore, Coimbatore, Trichy, Salem, Madurai, and point-to-point airport drops):
   - Swift Dzire / Etios: Round trip ₹14/km | One-way drop ₹16/km (Min drop 130 km, Round trip 250 km/day, Driver Bata ₹400/day)
   - Maruti Ertiga / XL6: Round trip ₹17/km | One-way drop ₹19/km (Min drop 130 km, Round trip 250 km/day, Driver Bata ₹500/day)
   - Toyota Innova: Round trip ₹20/km | One-way drop ₹22/km (Min drop 130 km, Round trip 250 km/day, Driver Bata ₹600/day)
   - Innova Crysta: Round trip ₹22/km | One-way drop ₹25/km (Min drop 130 km, Round trip 250 km/day, Driver Bata ₹700/day)
   - Tempo Traveller (12S): Round trip ₹26/km | One-way drop ₹29/km (Min drop 250 km, Round trip 300 km/day, Driver Bata ₹800/day)
   * General outstation note: Highway Tolls, State Border Permits (if outside Tamil Nadu), and Parking are at actuals.

4. POPULAR ROUND TRIPS FROM CHENNAI:
   - Mahabalipuram (Same Day): Sedan ₹2,600 - ₹3,000 | Ertiga ₹3,500 - ₹3,900
   - Pondicherry (Same Day): Sedan ₹4,500 - ₹5,000 | Ertiga ₹5,800 - ₹6,200
   - Kanchipuram Temple Tour: Sedan ₹3,000 - ₹3,400 | Ertiga ₹4,000 - ₹4,400
   - Vellore Golden Temple: Sedan ₹4,200 - ₹4,600 | Ertiga ₹5,200 - ₹5,800
`;

function deterministicFallback(userText, pageContext) {
  const query = (userText || '').toLowerCase();

  // On-screen context awareness (Pro-Rata / Quoted rates)
  if (pageContext && pageContext.totalFare) {
    const asksFor2Days = query.includes('2 day') || query.includes('two day') || query.includes('2-day') || query.includes('2 நாள்') || query.includes('2 நாட்கள்');
    const asksPrice = query.includes('price') || query.includes('cost') || query.includes('fare') || query.includes('rate') || query.includes('how much') || query.includes('quote') || query.includes('evlo') || query.includes('kattanam') || query.includes('tariff');
    const asksExplain = query.includes('explain') || query.includes('why') || query.includes('breakup') || query.includes('breakdown') || query.includes('details') || query.includes('screen') || query.includes('quote');

    if (asksFor2Days || asksPrice || asksExplain || query.includes('this trip') || query.includes('my trip') || query.includes('selected')) {
      const destName = pageContext.destination || (pageContext.serviceTitle ? pageContext.serviceTitle.replace(/Chennai to /i, '') : 'your trip');
      const vehName = pageContext.vehicleName || 'Swift Dzire / Etios';
      const fareFormatted = pageContext.formattedFare || `₹${pageContext.totalFare?.toLocaleString('en-IN')}`;
      const durLabel = pageContext.durationLabel || `${pageContext.durationHours || 24} hrs`;
      const subText = pageContext.durationSubText || (pageContext.isProRata ? '1 Night Stay' : '');

      if (pageContext.isProRata) {
        const hrs = pageContext.durationHours || 36;
        const extraHrs = pageContext.extraHours || (hrs - 24);
        const savings = pageContext.savings ? `₹${pageContext.savings.toLocaleString('en-IN')}` : '₹1,750';

        return {
          reply: `I see your selected schedule on screen is **${durLabel}** (${hrs} hours${subText ? ` / ${subText}` : ''}) for **${destName}**:\n\n` +
            `• **Your On-Screen Pro-Rata Fare:** **${fareFormatted}** for **${vehName}**\n` +
            `  Because your trip duration is **${hrs} hours** (rather than the full 48 hours), our transparent tariff charges you pro-rata for 1 Day + ${extraHrs} hrs, **saving you ${savings}** compared to the full 2-day package!\n\n` +
            `• **Full 48-Hour 2-Day Package Rates:**\n` +
            `  If you require the cab for the complete 48 hours (e.g. 2 full calendar days or returning late night on Day 2):\n` +
            `  - **Swift Dzire / Etios (4 Pax):** ₹9,500\n` +
            `  - **Maruti Ertiga / XL6 (6 Pax):** ₹11,500\n` +
            `  - **Toyota Innova (7 Pax):** ₹12,500\n` +
            `  - **Toyota Innova Crysta (7 Pax):** ₹16,000\n` +
            `  - **Tempo Traveller (12 Pax):** ₹19,500\n\n` +
            `✅ **Inclusions:** Dedicated AC Cab & Experienced Chauffeur, Fuel, AP State Border Permit, Tirumala Ghat Road ascent, and Driver Bata.\n` +
            `🛡️ **Policy:** Nominal **₹500 advance** to confirm & lock cab (avoids last-minute cancellation). Remaining balance paid post-trip!`,
          actionSuggestion: {
            type: 'tirupati_package',
            label: `Book ${vehName} (${fareFormatted}) on WhatsApp`,
            whatsappText: `Hi Kalidass Travels, I want to confirm my ${durLabel} trip to ${destName} (${fareFormatted} for ${vehName}).`
          }
        };
      }
    }
  }

  if (query.includes('tirupati') || query.includes('tirumala') || query.includes('balaji')) {
    let days = 1;
    const dMatch = query.match(/(\d+)\s*(?:days?|day|நாட்கள்|நாள்)/i);
    if (dMatch) days = parseInt(dMatch[1], 10);
    else if (query.includes('2-day') || query.includes('2 day') || query.includes('two day')) days = 2;
    else if (query.includes('3-day') || query.includes('3 day') || query.includes('three day')) days = 3;
    else if (query.includes('4-day') || query.includes('4 day') || query.includes('four day')) days = 4;
    else if (query.includes('5-day') || query.includes('5 day') || query.includes('five day')) days = 5;

    const calc = (base3, extraPerDay, d1, d2) => {
      if (days === 1) return d1;
      if (days === 2) return d2;
      if (days === 3) return base3;
      return base3 + ((days - 3) * extraPerDay);
    };

    const sedanRate = calc(13200, 3500, 6000, 9500);
    const ertigaRate = calc(15800, 4000, 7500, 11500);
    const innovaRate = calc(17500, 4000, 8500, 12500);
    const crystaRate = calc(22500, 6000, 10000, 16000);
    const tempoRate = calc(27000, 7000, 12500, 19500);

    const durText = days === 1 ? '1-Day' : `${days}-Day`;
    const incl = days === 1 
      ? 'Dedicated Cab, Fuel, NH FASTag Tolls, AP Border Permit, Tirumala Ghat Road ascent, and Driver Bata.' 
      : `Dedicated AC cab & experienced chauffeur staying with you for all ${days} days, Tirumala Ghat Road hill climb & Driver Bata.`;

    const pageLink = `/services/tirupati-package/?days=${days}`;

    return {
      reply: `Here are our official **Chennai ⇄ Tirupati ${durText} Package** rates:\n\n` +
        `• **AC Sedan (Dzire / Etios - 4 Pax):** ₹${sedanRate.toLocaleString('en-IN')}\n` +
        `• **Maruti Ertiga / XL6 (6 Pax):** ₹${ertigaRate.toLocaleString('en-IN')}\n` +
        `• **Toyota Innova (7 Pax):** ₹${innovaRate.toLocaleString('en-IN')}\n` +
        `• **Toyota Innova Crysta:** ₹${crystaRate.toLocaleString('en-IN')}\n` +
        `• **Tempo Traveller (12 Pax):** ₹${tempoRate.toLocaleString('en-IN')}\n\n` +
        `✅ **Included in ${durText} Package:** ${incl}\n` +
        `🛡️ **Policy:** Nominal ₹500 advance to confirm & lock cab (avoids last-minute cancellation). Balance post-trip.\n\n` +
        `[👉 Open Tirupati ${durText} Calculator & View Live Quote](${pageLink})`,
      actionSuggestion: {
        type: 'tirupati_package',
        label: `Book Tirupati ${durText} on WhatsApp`,
        whatsappText: `Hi Kalidass Travels, I want to book a Chennai to Tirupati ${durText} Package.`
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

    // Asynchronously log to Google Apps Script Webhook
    const logToWebhook = (replyText, engineSource) => {
      try {
        if (!lastUserMessage) return;
        const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        const sessionId = String(body.sessionId || 'KT-SES-' + Math.floor(1000 + Math.random() * 9000)).replace(/,/g, ' ');
        const sourcePage = String(body.sourcePage || '/').replace(/,/g, ' ');

        const qLow = lastUserMessage.toLowerCase();
        let intent = 'General Inquiry';
        if (qLow.includes('tirupati') || qLow.includes('tirumala') || qLow.includes('balaji')) intent = 'Tirupati Package';
        else if (qLow.includes('airport') || qLow.includes('flight') || qLow.includes('terminal')) intent = 'Airport Transfer';
        else if (qLow.includes('pondy') || qLow.includes('pondicherry')) intent = 'Pondicherry Tour';
        else if (qLow.includes('local') || qLow.includes('hourly') || qLow.includes('4hr') || qLow.includes('8hr') || qLow.includes('city')) intent = 'Local Rental';
        else if (qLow.includes('outstation') || qLow.includes('per km') || qLow.includes('km rate')) intent = 'Outstation Tariff';
        else if (qLow.includes('temple') || qLow.includes('navagraha') || qLow.includes('kumbakonam') || qLow.includes('girivalam')) intent = 'Temple Tour';
        else if (qLow.includes('acting') || qLow.includes('call driver') || qLow.includes('personal car')) intent = 'Acting Driver';

        const phoneMatch = lastUserMessage.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
        const contact = phoneMatch ? phoneMatch[0].replace(/[^0-9]/g, '').slice(-10) : 'None';

        fetch('https://script.google.com/macros/s/AKfycbwoEpKqa3Qg-DIvMe06pGUgGLlC_0vJQev61nzIh9ssh1-uHZ5VtYkGzpMVwhEyi7tvEQ/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'ai_chat_query',
            date: timestamp,
            sessionId,
            sourcePage,
            userQuery: lastUserMessage,
            aiReply: replyText,
            intent,
            contact,
            engine: engineSource
          })
        }).catch(() => {});
      } catch (_) {}
    };

    const pageContext = body.pageContext || null;

    // Check for Gemini API Key in Cloudflare env or process.env
    const apiKey = (env && env.GEMINI_API_KEY) || (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY);

    if (!apiKey) {
      // Deterministic instant response fallback with pageContext
      const fallbackResult = deterministicFallback(lastUserMessage, pageContext);
      logToWebhook(fallbackResult.reply, 'cloudflare_deterministic');
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

    // Call Google Gemini API (gemini-3.8-flash with gemini-3.5-flash-lite fallback)
    let systemText = TARIFF_KNOWLEDGE;
    if (pageContext && pageContext.totalFare) {
      systemText += `\nACTIVE ON-SCREEN BOOKING ENGINE SELECTION: Destination: ${pageContext.destination || ''}, Vehicle: ${pageContext.vehicleName || ''}, Schedule: ${pageContext.pickupFormatted || ''} to ${pageContext.returnFormatted || ''}, Duration: ${pageContext.durationLabel || ''} (${pageContext.durationHours || 0} hrs), Fare: ${pageContext.formattedFare || ''}, Pro-Rata: ${pageContext.isProRata ? 'YES' : 'NO'}. If customer asks 'for 2 days' or about price, explicitly clarify that their on-screen quote is pro-rata for ${pageContext.durationHours} hrs (saving them ₹${pageContext.savings || 1750} vs full 2-day package).`;
    }

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemText }]
      },
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 3000,
      }
    };

    let candidateText = '';
    for (const model of ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3-flash', 'gemini-flash-latest']) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload)
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) break;
        }
      } catch (_) {}
    }

    if (!candidateText) {
      // Graceful fallback to deterministic engine on API error
      const fallbackResult = deterministicFallback(lastUserMessage, pageContext);
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

    const reply = candidateText || deterministicFallback(lastUserMessage, pageContext).reply;
    logToWebhook(reply, candidateText ? 'gemini' : 'gemini_fallback');

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
