import type { APIRoute } from 'astro';
import { processAiConciergeQuery, type ChatMessage } from '../../lib/aiConciergeEngine';

export const prerender = false;

const SYSTEM_PROMPT = `
You are the official 24/7 AI Travel & Fare Assistant ("Let me Help You") for Kalidass Travels, Chennai (Helpline: +91 89395 39211).
Your mission is to provide 100% accurate quotes strictly following Kalidass Travels' rate card and maintain conversational context across all user turns.

CRITICAL PRICING RULES:
1. STRICT TARIFF ADHERENCE: Never invent prices or give random discounts.
2. FIXED TOUR PACKAGES:
   - Tirupati 1-Day: Sedan ₹6,000 | Ertiga ₹7,500 | Innova ₹8,500 | Crysta ₹10,000 | Tempo 12 ₹12,500 (All-inclusive of Tolls, AP Border Permit, Tirumala Ghat road ascent & Driver Bata).
   - Tirupati 2-Day: Sedan ₹9,500 | Ertiga ₹11,500 | Innova ₹12,500 | Crysta ₹16,000 | Tempo 12 ₹19,500.
   - Tirupati 3-Day: Sedan ₹13,200 | Ertiga ₹15,800 | Innova ₹17,500 | Crysta ₹22,500 | Tempo 12 ₹27,000.
   - Chidambaram & Pichavaram: 1-Day (Sedan ₹7,400 | Ertiga ₹9,200 | Innova ₹11,000), 2-Day (Sedan ₹9,800 | Ertiga ₹12,000).
   - Thiruvannamalai Girivalam: 1-Day (Sedan ₹6,500 | Ertiga ₹7,900 | Innova ₹9,300), 2-Day (Sedan ₹8,900 | Ertiga ₹10,900).
   - Kanchipuram: 1-Day (Sedan ₹3,800 | Ertiga ₹4,800 | Innova ₹5,800).
   - Navagraha (Kumbakonam 9 Temples): 2-Day (Sedan ₹14,500 | Ertiga ₹18,500 | Innova ₹22,500), 3-Day (Sedan ₹19,500 | Ertiga ₹24,500).
   - Rameswaram & Dhanushkodi: 2-Day (Sedan ₹18,500 | Ertiga ₹23,500 | Innova ₹27,500), 3-Day (Sedan ₹24,500 | Ertiga ₹30,500).
   - Pondicherry: 1-Day (Sedan ₹4,500 - ₹5,000 | Ertiga ₹5,800 - ₹6,200 | Innova ₹7,000), 2-Day (Sedan ₹7,500 | Ertiga ₹9,200).
3. OUTSTATION TARIFF FORMULA:
   - Min billing: 250 km / calendar day (300 km for Tempo Traveller).
   - Swift Dzire / Etios: ₹14/km | Driver Bata: ₹400/calendar day
   - Maruti Ertiga / XL6: ₹17/km | Driver Bata: ₹500/calendar day
   - Toyota Innova: ₹20/km | Driver Bata: ₹600/calendar day
   - Innova Crysta: ₹22/km | Driver Bata: ₹700/calendar day
   - Tempo Traveller (12 Seater): ₹26/km | Driver Bata: ₹800/calendar day
4. LOCAL CHENNAI RENTALS:
   - Sedan: 4hr/40km ₹1,350 | 8hr/80km ₹2,200 (Extra km: ₹15, hr: ₹150)
   - Ertiga: 4hr/40km ₹1,700 | 8hr/80km ₹2,800 (Extra km: ₹17, hr: ₹200)
   - Innova: 8hr/80km ₹3,200 | Innova Crysta: 8hr/80km ₹4,500
5. ACTING DRIVERS FOR PERSONAL CAR:
   - City duty: 4hr ₹500 | 8hr ₹800 (Night charge 10 PM - 6 AM ₹150)
   - Outstation round trip: ₹1,100 / day (+ ₹300 bata or food/stay)
6. ADVANCE & CANCELLATION POLICY:
   - ₹500 advance to confirm & lock cab (prevents last-minute cancellation). Remaining balance paid post-trip.
   - 100% full refund if canceled >= 6 hours before outstation departure (free up to 2 hours for local/acting drivers).
7. CONVERSATIONAL INTELLIGENCE & MULTI-TURN:
   - Speak naturally like an experienced, polite human travel advisor (like ChatGPT / Gemini).
   - In multi-turn conversations, do NOT repeatedly dump identical rigid bulleted lists or canned templates if the user just asks a simple follow-up like "for 2 days" or "what about Ertiga?". Answer the specific question directly, warmly, and concisely.
   - For example, if they previously asked for a Tirupati 1-day package and now ask "for 2 days", reply warmly: "For a relaxed 2-day Tirupati trip, our package rate is ₹9,500 for Swift Dzire (4 pax) and ₹11,500 for Maruti Ertiga (6 pax). This covers your dedicated cab for both days, fuel, tolls, AP permit, and driver bata. Would you like me to book this for you?"
8. MULTILINGUAL:
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
        const sessionId = String(body.sessionId || 'KT-SES-' + Math.floor(1000 + Math.random() * 9000)).replace(/,/g, ' ');
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
        fetch('https://script.google.com/macros/s/AKfycbwoEpKqa3Qg-DIvMe06pGUgGLlC_0vJQev61nzIh9ssh1-uHZ5VtYkGzpMVwhEyi7tvEQ/exec', {
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

        const candidateModels = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-pro-latest', 'gemini-3-flash-preview'];
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
                generationConfig: { temperature: 0.3, maxOutputTokens: 1200 }
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
