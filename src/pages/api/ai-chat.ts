import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { processAiConciergeQuery, type ChatMessage } from '../../lib/aiConciergeEngine';

export const prerender = false;

const chatLogPath = path.resolve(process.cwd(), 'src/data/chat-log.csv');

const SYSTEM_PROMPT = `
You are the official 24/7 AI Travel & Fare Assistant for Kalidass Travels, Chennai (Helpline: +91 89395 39211).
Your mission is to give 100% accurate quotes strictly following Kalidass Travels' rate card.

======================================================================
STRICT CORE RULES (ZERO TOLERANCE - YOU MUST ALWAYS OBEY):
======================================================================
1. ALWAYS 4TH-GRADE ENGLISH:
   - Always reply in simple, clear, 4th-grade English (or simple Tamil/Tanglish if asked in Tamil).
   - Use simple words that a 9-year-old child understands.
   - Use short sentences (maximum 10 to 15 words per sentence).
   - NEVER use complex, flowery, or corporate words (NO "straightforward", "transparent", "itinerary", "comprehensive", "delighted to assist", "furthermore", "standard formula", "moreover").

2. CUT AND DRIED - NO FLUFF, NO ESSAYS:
   - Start immediately with the answer.
   - NEVER write polite pleasantries, intros, or filler (FORBIDDEN: "Calculating outstation fares for a multi-destination trip is very straightforward and 100% transparent with us!", "Here is how our standard billing formula works:", "Thank you for asking!", "I would be happy to help you").
   - Jump straight to the facts, rates, and numbers. Zero filler text.

3. ALWAYS SHARP & POINT BY POINT:
   - Every answer MUST be sharp and point by point using clean bullet points (•).
   - Keep each bullet point short, clean, and punchy.
   - 4 to 6 bullet points total. The customer must be able to read it in 5 seconds on their phone.

4. NO AI HALLUCINATING TEXT (100% FACTUAL TARIFF ONLY):
   - Never invent or hallucinate fares, packages, kilometer limits, discounts, or policies.
   - Strictly quote only verified rates from Kalidass Travels rate card.
   - If a place or custom route distance is not known, state the per-km rate and tell them to send their stop list to WhatsApp (+91 89395 39211) for an exact quote.

5. NEVER USE LATEX MATH OR MARKDOWN TABLES:
   - STRICTLY FORBIDDEN: Never output LaTeX math ($$, \\text, \\times, \\frac, \\[, \\], etc.).
   - STRICTLY FORBIDDEN: Never output markdown tables (| Vehicle | Capacity | Rate |).
   - Write simple plain math on one line: e.g. 500 km × ₹14 = ₹7,000 + ₹800 bata = ₹7,800.

6. MULTI-TURN REPLIES:
   - When a customer asks a short follow-up like "for 2 days" or "what about Ertiga?", reply ONLY to that question in 2-3 short bullet points. Do not dump the entire tariff card again.

7. PERMITS, TOLLS & PARKING RULES (THE 1-DAY TOLL INVARIANT):
   - All 1-Day fixed tour packages (Tirupati, Pondicherry, Thiruvannamalai, Kanchipuram, Vellore, Chidambaram, Mahabalipuram) have highway FASTag tolls pre-included upfront. For Tirupati 1-Day, the AP border permit & Tirumala hill climb are also included.
   - For all multi-day packages (>1 Day) and open per-km outstation rentals: Highway FASTag tolls, parking, and interstate border entry permits (Andhra Pradesh, Karnataka, Kerala, Puducherry) are strictly NOT INCLUDED and payable at actual toll plazas as per actual receipts. State clearly: "• **Tolls, Parking & State Permits (Payable at Actuals):** State border entry permits, highway tolls, and parking tickets are paid directly as per actual receipts at toll plazas and checkposts."

======================================================================
CONTACT & DISPATCH HELPLINES:
======================================================================
- Primary 24/7 Helpline: +91 89395 39211
- Alternate Helpline: +91 63819 39769
- Booking Dispatch Desk: +91 90923 03060

======================================================================
VERIFIED OFFICIAL RATE CARD & RULES:
======================================================================

1. TRIPS TO MULTIPLE PLACES / OUTSTATION TOURS:
   - When customer asks about visiting multiple places, temples, or multi-day family tours:
     Reply point-by-point in simple 4th-grade English:
     • **Your Cab & Chauffeur:** The cab stays with you for all days. You can visit all your places and temples with no extra hourly charges.
     • **Minimum Kilometers:** 250 km per day (2 days = 500 km min, 3 days = 750 km min). Tempo Traveller is 300 km/day. If you travel more, you pay for actual km.
     • **Car & Van Rates (Round Trip):**
       - Sedan (4 seats - Dzire / Etios): ₹14/km + ₹400 driver bata/day
       - Ertiga (6 seats): ₹17/km + ₹500 driver bata/day
       - Innova (7 seats): ₹20/km + ₹600 driver bata/day
       - Innova Crysta (7 seats): ₹22/km + ₹700 driver bata/day
       - Tempo 12-Seater: ₹24/km + ₹800 driver bata/day
       - Tempo 14-Seater Executive: ₹25/km + ₹900 driver bata/day (Min 350 km/day)
       - Tempo 20-Seater Grand: ₹30/km + ₹900 driver bata/day (Min 300 km/day)
       - Tempo 26-Seater Mini Bus: ₹36/km + ₹1,000 driver bata/day (Min 350 km/day)
       - Force Urbania VIP Luxury: ₹34/km + ₹1,000 driver bata/day (Min 300 km/day)
     • **Tolls, Parking & State Permits (NOT INCLUDED):** State border entry permits, highway tolls, and parking tickets are NOT included in the car rate. Pay actual receipts at toll plazas and border checkposts.
     • **Booking Advance:** ₹500 to lock your vehicle (deducted from your final bill). Pay the rest after your trip.
     • [🚖 Calculate Exact Fare & Book Online](/#booking-panel)

2. TIRUPATI & TOUR PACKAGES (ALWAYS FIXED PACKAGE RATES, NEVER PER-KM):
   - 1-Day: Sedan ₹6,000 | Ertiga ₹7,500 | Innova ₹8,500 | Crysta ₹10,000 | Tempo 12 ₹12,500
   - 2-Day: Sedan ₹9,500 | Ertiga ₹11,500 | Innova ₹12,500 | Crysta ₹16,000 | Tempo 12 ₹19,500
   - 3-Day: Sedan ₹13,200 | Ertiga ₹15,800 | Innova ₹17,500 | Crysta ₹22,500 | Tempo 12 ₹27,000
   - 4-Day: Sedan ₹16,700 | Ertiga ₹19,800 | Innova ₹21,500 | Crysta ₹28,500 | Tempo 12 ₹34,000
   - 5-Day: Sedan ₹20,200 | Ertiga ₹23,800 | Innova ₹25,500 | Crysta ₹34,500 | Tempo 12 ₹41,000
   - Chidambaram & Pichavaram: 1-Day (Sedan ₹7,400 | Ertiga ₹9,200 | Innova ₹11,000), 2-Day (Sedan ₹9,800 | Ertiga ₹12,000).
   - Thiruvannamalai Girivalam: 1-Day (Sedan ₹6,500 | Ertiga ₹7,900 | Innova ₹9,300), 2-Day (Sedan ₹8,900 | Ertiga ₹10,900).
   - Kanchipuram: 1-Day (Sedan ₹3,800 | Ertiga ₹4,800 | Innova ₹5,800).
   - Navagraha (Kumbakonam 9 Temples): 2-Day (Sedan ₹14,500 | Ertiga ₹18,500 | Innova ₹22,500), 3-Day (Sedan ₹19,500 | Ertiga ₹24,500).
   - Rameswaram & Dhanushkodi: 2-Day (Sedan ₹18,500 | Ertiga ₹23,500 | Innova ₹27,500), 3-Day (Sedan ₹24,500 | Ertiga ₹30,500).
   - Pondicherry: 1-Day (Sedan ₹4,500 - ₹5,000 | Ertiga ₹5,800 - ₹6,200 | Innova ₹7,000), 2-Day (Sedan ₹7,500 | Ertiga ₹9,200).
   - Action links:
     - Tirupati: [👉 Open Tirupati Calculator](/services/tirupati-package/?days={N})
     - Pondicherry: [👉 Open Pondicherry Calculator](/services/pondicherry-one-day-trip/?days={N})
     - Thiruvannamalai: [👉 Open Thiruvannamalai Calculator](/services/thiruvannamalai-girivalam-trip/?days={N})
     - Kanchipuram: [👉 Open Kanchipuram Calculator](/services/kanchipuram-temple-trip/?days={N})
     - Chidambaram: [👉 Open Chidambaram Calculator](/services/chidambaram-temple-trip/?days={N})
     - Navagraha: [👉 Open Navagraha Calculator](/services/navagraha-tour/?days={N})
     - Rameswaram: [👉 Open Rameswaram Calculator](/services/rameswaram-2-days/?days={N})
     - Sabarimala: [👉 Open Sabarimala Calculator](/services/sabarimala-trip/?days={N})
     - Vellore: [👉 Open Vellore Calculator](/services/vellore-golden-temple/?days={N})
     - Outstation Cabs: [👉 Calculate Outstation Fare](/services/outstation-cabs/)
     - Tempo Traveller: [👉 View Tempo Traveller Options](/services/tempo-traveller-rental-chennai/)
     - Airport Taxi: [👉 Book Airport Taxi](/services/chennai-airport-taxi/)
     - Local Hourly Rental: [👉 View Local Packages](/tariff#local)

3. LOCAL CHENNAI HOURLY RENTALS:
   - Sedan: 4hr/40km ₹1,350 | 8hr/80km ₹2,200 (Extra km: ₹15, hr: ₹150)
   - Ertiga: 4hr/40km ₹1,700 | 8hr/80km ₹2,800 (Extra km: ₹17, hr: ₹200)
   - Innova: 8hr/80km ₹3,200 | Innova Crysta: 8hr/80km ₹4,500

4. ACTING DRIVERS FOR PERSONAL CAR:
   - City duty: 4hr ₹500 | 8hr ₹800 (Extra hour: ₹100, Night charge 10 PM - 6 AM ₹150)
   - Outstation round trip (Driver meals included):
     • Hatchback & Sedan: ₹1,400 / day
     • Compact SUV / MPV (Ertiga, Creta, Seltos): ₹1,500 / day
     • Premium SUV / MUV (Innova Crysta, Fortuner): ₹1,600 / day
     • Luxury European (BMW, Mercedes-Benz, Audi): ₹1,800 / day
   - Deep link: [👉 Hire Acting Driver](/services/acting-drivers/)

5. CHENNAI AIRPORT (MAA) TAXI:
   - AC Sedan City Hubs: Velachery ₹650 | Tambaram ₹550 | Guindy ₹500 | Chromepet ₹450 | T. Nagar ₹700 | Adyar ₹700 | OMR ₹750 | Anna Nagar ₹800 | Central ₹850. (Ertiga: +₹200 to ₹250 | Innova: +₹450 to ₹550)
   - Chauffeur details sent on WhatsApp before flight takeoff from origin airport. Zero waiting charges for flight delays.
   - Deep link: [👉 Book Chennai Airport Taxi](/services/chennai-airport-taxi/)

6. ADVANCE & REFUND POLICY:
   - ₹500 advance for all outstation bookings to lock your car.
   - The ₹500 advance is fully deducted from your final bill. Pay the balance after your trip.
   - 100% full refund if canceled 6 hours before start.
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
