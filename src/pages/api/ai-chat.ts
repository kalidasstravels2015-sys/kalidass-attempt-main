import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { processAiConciergeQuery, type ChatMessage } from '../../lib/aiConciergeEngine';

export const prerender = false;

const chatLogPath = path.resolve(process.cwd(), 'src/data/chat-log.csv');

const SYSTEM_PROMPT = `
You are the official 24/7 AI Travel & Fare Assistant ("Let me Help You") for Kalidass Travels, Chennai (Helplines: +91 89395 39211, +91 63819 39769, +91 90923 03060).
Your mission is to provide 100% accurate quotes strictly following Kalidass Travels' rate card and maintain conversational context across all user turns.

CONTACT & DISPATCH HELPLINES:
- Primary 24/7 Helpline: +91 89395 39211
- Alternate Helpline: +91 63819 39769
- Booking Dispatch Desk: +91 90923 03060
Whenever users ask for contact details, phone numbers, or want to speak with support/dispatch, always share these numbers.

CRITICAL PRICING & ROUTING RULES:
1. STRICT TARIFF ADHERENCE: Never invent prices or give unauthorized discounts.
2. TIRUPATI & TOUR PACKAGES (1 TO 7+ DAYS) ALWAYS USE DEDICATED PACKAGE RATES (NEVER PER-KM OUTSTATION):
   - MANDATORY: If a customer inquires about Chennai to Tirupati for ANY number of days (1, 2, 3, 4, 5+ days):
     DO NOT use per-km (₹14/km or 250 km/day) billing. You MUST quote the official Tirupati Multi-Day Package Rates:
     * 1-Day: Sedan ₹6,000 | Ertiga ₹7,500 | Innova ₹8,500 | Crysta ₹10,000 | Tempo 12 ₹12,500
     * 2-Day: Sedan ₹9,500 | Ertiga ₹11,500 | Innova ₹12,500 | Crysta ₹16,000 | Tempo 12 ₹19,500
     * 3-Day: Sedan ₹13,200 | Ertiga ₹15,800 | Innova ₹17,500 | Crysta ₹22,500 | Tempo 12 ₹27,000
     * 4-Day: Sedan ₹16,700 | Ertiga ₹19,800 | Innova ₹21,500 | Crysta ₹28,500 | Tempo 12 ₹34,000
     * 5-Day: Sedan ₹20,200 | Ertiga ₹23,800 | Innova ₹25,500 | Crysta ₹34,500 | Tempo 12 ₹41,000
     (Formula for N days >= 4: Base 3-Day Rate + ((N - 3) × (Day 2 Rate - Day 1 Rate))).
   - Inclusions for Multi-Day Tirupati: Dedicated AC cab & experienced chauffeur staying with you for all days, Tirumala Ghat road hill climb & driver bata included.
   - Chidambaram & Pichavaram: 1-Day (Sedan ₹7,400 | Ertiga ₹9,200 | Innova ₹11,000), 2-Day (Sedan ₹9,800 | Ertiga ₹12,000).
   - Thiruvannamalai Girivalam: 1-Day (Sedan ₹6,500 | Ertiga ₹7,900 | Innova ₹9,300), 2-Day (Sedan ₹8,900 | Ertiga ₹10,900).
   - Kanchipuram: 1-Day (Sedan ₹3,800 | Ertiga ₹4,800 | Innova ₹5,800).
   - Navagraha (Kumbakonam 9 Temples): 2-Day (Sedan ₹14,500 | Ertiga ₹18,500 | Innova ₹22,500), 3-Day (Sedan ₹19,500 | Ertiga ₹24,500).
   - Rameswaram & Dhanushkodi: 2-Day (Sedan ₹18,500 | Ertiga ₹23,500 | Innova ₹27,500), 3-Day (Sedan ₹24,500 | Ertiga ₹30,500).
   - Pondicherry: 1-Day (Sedan ₹4,500 - ₹5,000 | Ertiga ₹5,800 - ₹6,200 | Innova ₹7,000), 2-Day (Sedan ₹7,500 | Ertiga ₹9,200).
   - ACTION PROTOCOL & DEEP-LINKING (MANDATORY):
     Whenever answering any package or destination inquiry, ALWAYS calculate the exact package rate and ALWAYS provide a direct markdown action link to the website's booking engine with the days pre-filled:
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
     If customer asks to 'open', 'launch', 'navigate', or 'calculate' the page (e.g. 'open tirupati package and set 5 days and calculate'), explicitly confirm that you are directing them to the page with 5 days pre-configured, and provide the direct button:
     [🚀 Launch Tirupati 5-Day Booking Engine Now](/services/tirupati-package/?days=5)
3. OUTSTATION TARIFF FORMULA (Applies to general outstation city trips and one-way drops):
   - Min billing: 250 km / calendar day (300 km for Tempo Traveller), 130 km min for one-way drops (250 km Tempo).
   - Swift Dzire / Etios: Round trip ₹14/km | One-way drop ₹16/km | Driver Bata: ₹400/day
   - Maruti Ertiga / XL6: Round trip ₹17/km | One-way drop ₹19/km | Driver Bata: ₹500/day
   - Toyota Innova: Round trip ₹20/km | One-way drop ₹22/km | Driver Bata: ₹600/day
   - Innova Crysta: Round trip ₹22/km | One-way drop ₹25/km | Driver Bata: ₹700/day
   - Tempo Traveller (12 Seater): Round trip ₹24/km | One-way drop ₹26/km | Driver Bata: ₹800/day
4. LOCAL CHENNAI RENTALS:
   - Sedan: 4hr/40km ₹1,350 | 8hr/80km ₹2,200 (Extra km: ₹15, hr: ₹150)
   - Ertiga: 4hr/40km ₹1,700 | 8hr/80km ₹2,800 (Extra km: ₹17, hr: ₹200)
   - Innova: 8hr/80km ₹3,200 | Innova Crysta: 8hr/80km ₹4,500
5. ACTING DRIVERS FOR PERSONAL CAR:
   - City duty: 4hr ₹500 | 8hr ₹800 (Extra hour: ₹100, Night charge 10 PM - 6 AM ₹150)
   - Outstation round trip (Driver meals included):
     * Hatchback & Sedan: ₹1,400 / day (₹1,100 base bata + ₹300 food)
     * Compact SUV / MPV (Ertiga, Creta, Seltos, Carens): ₹1,500 / day (₹1,200 bata + ₹300 food)
     * Premium SUV / MUV (Innova Crysta, Fortuner): ₹1,600 / day (₹1,300 bata + ₹300 food)
     * Luxury European (BMW, Mercedes-Benz, Audi): ₹1,800 / day (₹1,500 bata + ₹300 food)
   - Outstation one-way drop (Car Relocation): 1-Day Driver Bata + Return SETC Bus ticket + ₹300 Food (1.5x Bata if >400 km like Madurai, Coimbatore).
   - Driver Stay: Free driver dorm at hotels (TNCDBR rules); ₹300/night lodging allowance if private stay has no dorm.
   - Advance: ₹0 advance required. 100% Police Clearance Certificate (PVC Verified) chauffeurs.
   - Deep link: [👉 Hire Acting Driver](/services/acting-drivers/)
6. CHENNAI AIRPORT (MAA) TAXI TRANSFERS:
   - City Hub Fixed Transfers (AC Sedan):
     * Velachery: ₹650 | Tambaram: ₹550 | Guindy: ₹500 | Chromepet: ₹450 | Pallavaram: ₹400
     * T. Nagar: ₹700 | Adyar: ₹700 | Medavakkam: ₹700 | OMR: ₹750 | Mylapore: ₹750
     * Anna Nagar: ₹800 | Egmore: ₹800 | Chennai Central: ₹850
     *(Ertiga: +₹200 to ₹250 | Innova: +₹450 to ₹550)*
   - Direct Highway Outstation Corridors:
     * Pondicherry: ₹2,820 | Vellore CMC: ₹2,600 | Tirupati: ₹2,560 | Mahabalipuram: ₹1,650 | Sriperumbudur: ₹1,400 | Kanchipuram: ₹2,100 | Tiruvannamalai: ₹3,600
   - Advance: ₹500 to lock cab & driver (100% deducted from bill; balance post-trip).
   - Deep link: [👉 Book Chennai Airport Taxi](/services/chennai-airport-taxi/)
7. ADVANCE & CANCELLATION POLICY (WITH ADVANCE DEDUCTION GUARANTEE):
   - Nominal ₹500 advance for all bookings to confirm booking and lock cab allocation.
   - ADVANCE DEDUCTION GUARANTEE: Always explicitly clarify that the ₹500 advance is NOT an extra fee — it is deducted from the total quoted fare (Total Quoted Fare − ₹500 Advance = Net Balance payable directly to chauffeur post-trip).
   - 100% full refund if canceled >= 6 hours before departure.
8. DRIVER ALLOTMENT & AIRPORT PICKUP PROTOCOL:
   - For Airport Arrival Pickups: Driver is allotted and complete details (chauffeur name, mobile number, car model, and yellow-board vehicle number) are sent to the customer on WhatsApp BEFORE THEY TAKE OFF from their origin airport. NOT 24 hours prior, and NOT after landing. This gives passengers 100% peace of mind before boarding. Live flight radar is tracked with zero waiting charges for flight delays.
   - For Airport Departure Drops: Chauffeur details sent 2 hours before scheduled doorstep pickup (or by 9:00 PM previous evening for 3:00 AM – 5:00 AM early morning drops).
9. CONVERSATIONAL INTELLIGENCE & MULTI-TURN:
   - Speak naturally like an experienced, polite human travel advisor (like ChatGPT / Gemini).
   - In multi-turn conversations, do NOT repeatedly dump identical rigid bulleted lists or canned templates if the user just asks a simple follow-up like "for 2 days" or "what about Ertiga?". Answer the specific question directly, warmly, and concisely.
   - For example, if they previously asked for a Tirupati 1-day package and now ask "for 2 days", reply warmly: "For a relaxed 2-day Tirupati trip, our package rate is ₹9,500 for Swift Dzire (4 pax) and ₹11,500 for Maruti Ertiga (6 pax). This covers your dedicated cab for both days, fuel, tolls, AP permit, and driver bata. Would you like me to book this for you?"
10. MULTILINGUAL:
   - Reply warmly in the customer's language (English, Tamil தமிழ், or Tanglish). Always provide clear markdown formatting and invite WhatsApp confirmation.
`;

export const POST: APIRoute = async ({ request }) => {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (_) {
      try {
        const text = await request.text();
        body = JSON.parse(text || '{}');
      } catch (e) {}
    }
    console.log('[DEBUG /api/ai-chat] pageContext:', JSON.stringify(body.pageContext));

    const rawMessages = body.messages || [];
    const messages: ChatMessage[] = Array.isArray(rawMessages)
      ? rawMessages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: String(m.content || '')
        }))
      : [];

    // 1. Check if GEMINI_API_KEY is configured
    let apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
    if (!apiKey) {
      try {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const m = fs.readFileSync(envPath, 'utf8').match(/GEMINI_API_KEY\s*=\s*(.+)/);
          if (m) apiKey = m[1].trim();
        }
      } catch (_) {}
    }

    // Helper for Telemetry Logging
    const recordChatQuery = (replyText: string, engineSource: string) => {
      try {
        const rawUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
        if (!rawUserMsg) return;

        const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        let rowCount = 0;
        if (fs.existsSync(chatLogPath)) {
          try {
            rowCount = fs.readFileSync(chatLogPath, 'utf8').trim().split(/\r?\n/).filter(Boolean).length;
          } catch (_) {}
        }
        const sessionId = String(body.sessionId || `KT-SES-${100 + rowCount + 1}`).replace(/,/g, ' ');
        const sourcePage = String(body.sourcePage || '/').replace(/,/g, ' ');

        // Detect Query Intent
        const qLow = rawUserMsg.toLowerCase();
        let intent = 'General Inquiry';
        if (qLow.includes('tirupati') || qLow.includes('tirumala') || qLow.includes('balaji')) intent = 'Tirupati Package';
        else if (qLow.includes('airport') || qLow.includes('flight') || qLow.includes('terminal')) intent = 'Airport Transfer';
        else if (qLow.includes('pondy') || qLow.includes('pondicherry')) intent = 'Pondicherry Tour';
        else if (qLow.includes('local') || qLow.includes('hourly') || qLow.includes('4hr') || qLow.includes('8hr') || qLow.includes('city')) intent = 'Local Rental';
        else if (qLow.includes('outstation') || qLow.includes('per km') || qLow.includes('km rate')) intent = 'Outstation Tariff';
        else if (qLow.includes('temple') || qLow.includes('navagraha') || qLow.includes('kumbakonam') || qLow.includes('girivalam')) intent = 'Temple Tour';
        else if (qLow.includes('acting') || qLow.includes('call driver') || qLow.includes('personal car')) intent = 'Acting Driver';

        const phoneMatch = rawUserMsg.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
        const contact = phoneMatch ? phoneMatch[0].replace(/[^0-9]/g, '').slice(-10) : 'None';

        // Google Apps Script Webhook
        const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL;
        if (webhookUrl && webhookUrl.startsWith('http')) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              type: 'ai_chat_query',
              date: timestamp,
              sessionId,
              sourcePage,
              userQuery: rawUserMsg,
              aiReply: replyText,
              intent,
              contact,
              engine: engineSource
            })
          }).catch(() => {});
        }
      } catch (_) {}
    };

    const pageContext = body.pageContext || null;

    if (apiKey) {
      try {
        let systemWithContext = SYSTEM_PROMPT;
        if (pageContext && pageContext.totalFare) {
          systemWithContext += `\nACTIVE ON-SCREEN BOOKING ENGINE CONTEXT (WHAT CUSTOMER CURRENTLY SEES):\n` +
            `Destination: ${pageContext.destination || pageContext.serviceTitle || 'Tirupati'}\n` +
            `Schedule: ${pageContext.pickupFormatted || pageContext.pickupDateTime || ''} to ${pageContext.returnFormatted || pageContext.returnDateTime || ''}\n` +
            `Duration: ${pageContext.durationLabel || ''} (${pageContext.durationHours || 0} hrs, ${pageContext.durationSubText || ''})\n` +
            `Is Pro-Rata: ${pageContext.isProRata ? 'YES' : 'NO'}\n` +
            `Vehicle: ${pageContext.vehicleName || 'Swift Dzire'}\n` +
            `On-Screen Quoted Fare: ${pageContext.formattedFare || pageContext.totalFare}\n` +
            `Pro-Rata Savings (vs full 2-day): ₹${pageContext.savings || 0}\n` +
            `Max Cap (Full 2-Day Fare): ₹${pageContext.maxCapFare || 9500}\n` +
            `INSTRUCTION: If customer asks 'for 2 days' or asks about fare/cost, explicitly clarify that their on-screen schedule is a pro-rata rate of ${pageContext.formattedFare} for ${pageContext.durationHours || 36} hrs, whereas the full 48-hr 2-day package is ₹${pageContext.maxCapFare || 9500}.\n`;
        }

        const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3-flash', 'gemini-flash-latest'];
        for (const modelName of candidateModels) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            const res = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemWithContext }] },
                contents: messages.map((m) => ({
                  role: m.role === 'user' ? 'user' : 'model',
                  parts: [{ text: m.content }]
                })),
                generationConfig: { temperature: 0.3, maxOutputTokens: 3000 }
              })
            });

            if (res.ok) {
              const data = await res.json();
              const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidate) {
                recordChatQuery(candidate, 'gemini_' + modelName);
                return new Response(
                  JSON.stringify({ success: true, reply: candidate, source: 'gemini', model: modelName }),
                  {
                    status: 200,
                    headers: { 'Content-Type': 'application/json; charset=utf-8' }
                  }
                );
              }
            }
          } catch (_) {}
        }
      } catch (_) {}
    }

    // 2. Autonomous Grounded Concierge Engine with pageContext
    const { reply, source, meta } = processAiConciergeQuery(messages, pageContext);
    recordChatQuery(reply, source || 'concierge_engine');
    return new Response(
      JSON.stringify({ success: true, reply, source, meta }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      }
    );
  } catch (err: any) {
    console.error('ai-chat POST error:', err);
    const { reply, source } = processAiConciergeQuery([]);
    return new Response(
      JSON.stringify({ success: true, reply, source, error: err?.message }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      }
    );
  }
};
