import fs from 'node:fs';
import path from 'node:path';
import tariffConfig from '../data/tariff_config.json' with { type: 'json' };
import siteContent from '../data/siteContent.json' with { type: 'json' };

// Rolling conversation context per sender JID (up to 10 turns)
const conversationHistories = new Map();

function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const match = fs.readFileSync(envPath, 'utf8').match(/GEMINI_API_KEY\s*=\s*(.+)/);
      if (match) return match[1].replace(/["']/g, '').trim();
    }
  } catch (_) {}
  return null;
}

// Log calculation into runtime CSV log
function logCalculationToCsv(data) {
  try {
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Calculations_Log_2026.csv');
    let rowCount = 1;
    if (fs.existsSync(csvPath)) {
      rowCount = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/).filter(Boolean).length;
    }
    const seqQuoteId = data.quoteId || `#WA-${rowCount}`;
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const row = `"${timestamp}","${seqQuoteId}","${data.customerName || 'WhatsApp Customer'}","${data.phone || ''}","${data.vehicle || 'Multi-Fleet'}","${data.route || ''}","${data.rate || 0}","WhatsApp AI Co-Pilot"\n`;
    fs.appendFileSync(csvPath, row, 'utf8');
  } catch (_) {}
}

// Record duty slip in data store
function recordDutySlip(slipData) {
  try {
    const slipsPath = path.resolve(process.cwd(), 'data/active_duty_slips.json');
    let existing = [];
    if (fs.existsSync(slipsPath)) {
      try { existing = JSON.parse(fs.readFileSync(slipsPath, 'utf8')); } catch (_) {}
    }
    existing.unshift({
      ...slipData,
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(slipsPath, JSON.stringify(existing.slice(0, 50), null, 2), 'utf8');
  } catch (_) {}
}

function buildWhatsAppMasterTariff() {
  const vehicleLines = Object.entries(tariffConfig.vehicles || {}).map(([name, v]) => {
    return `• ${name} (${v.seats} AC, category: ${v.category}):
  - Round-Trip: ₹${v.round_trip_rate}/km (Min ${v.min_km_per_day} km/day) + Bata ₹${v.driver_bata}/day
  - One-Way: ₹${v.one_way_rate}/km (Min ${v.min_drop_km} km) + Bata ₹${v.driver_bata}
  - Extra KM: ₹${v.extra_km_rate}/km | Extra Hr: ₹${v.extra_hr_rate}/hr
  - Local Packages: 4hr/40km ₹${v.local_4hr_pkg} | 5hr/50km ₹${v.local_5hr_pkg} | 8hr/80km ₹${v.local_8hr_pkg} | 10hr/100km ₹${v.local_10hr_pkg} | 12hr/120km ₹${v.local_12hr_pkg}`;
  }).join('\n');

  const permitLines = Object.entries(tariffConfig.state_permits || {}).map(([code, p]) => {
    const r = p.rates || {};
    const kw = Array.isArray(p.keywords) && p.keywords.length > 0 ? ` [Destinations: ${p.keywords.join(', ')}]` : '';
    return `• ${p.stateName} (${code}): sedan ₹${r.sedan} | suv (Ertiga) ₹${r.suv} | muv (Innova/Crysta) ₹${r.muv} | tempo (12-Seater & 14-Seater) ₹${r.tempo} | coach (17/20/26-Seater & Urbania) ₹${r.coach}${kw}`;
  }).join('\n');

  return `======================================================================
OFFICIAL KALIDASS TRAVELS MASTER TARIFF (100% SOURCE OF TRUTH):
======================================================================
A. COMPLETE VEHICLE FLEET:
${vehicleLines}

B. PARIVAHAN STATUTORY STATE BORDER PERMITS:
${permitLines}
* Note: Kona Falls (Kailasakona), Nagalapuram, Puttur, Pichatur, Narayanavanam, Tada, Srikalahasti, and Tirupati are in Andhra Pradesh (AP) — always include the AP State Permit (e.g. ₹3,100 for 12-Seater & 14-Seater Tempo).`;
}

const SYSTEM_INSTRUCTION = `You are the official 24/7 AI Operations Co-Pilot & Dispatch Partner for Kalidass Travels, Chennai.
Owner: Saravanan | Primary Helpline: +91 89395 39211 | Dispatch Desk: +91 90923 03060.
You are chatting with the agency owner directly on WhatsApp (in 'Message yourself' or private dispatch group).

${buildWhatsAppMasterTariff()}

======================================================================
CORE OPERATIONAL RULES (ZERO AI GIMMICKS - 100% FACTUAL & GROUNDED):
======================================================================
1. NEVER INVENT FAKE DATA:
   - Absolutely NEVER invent fake customer names, dummy hotels, or fake dates.

2. DUAL-OPTION WHATSAPP QUOTATION (OPTION 1 MICRO-RECEIPT + OPTION 2 DETAILED QUOTE):
   Whenever the user asks for a quotation, fare details, or updates an active quote (e.g. "guindy to kona falls 14 seater tempo", "one day one pickup in guindy at 6 am and return at 10 pm"):
   Always provide BOTH ready-to-forward options clearly separated:

   --- OPTION 1: COMPACT MICRO-RECEIPT ---
   *KALIDASS TRAVELS* (Ref: [Quote Ref ID])
   [Origin] ⇄ [Destination] • [1-Day Round Trip / X-Day Round Trip / One-Way Drop]
   [Timing / Pickup details if specified]
   [Exact Vehicle Name] ([Seats] AC)

   *Estimated Fare: ₹[TotalWithPermit]*
   Includes: [Billed km] km (₹[KmFare]), Fuel, Driver Bata (₹[Bata])[, [State] State Permit (₹[Permit])]
   Toll & Parking: Extra as per actual slip

   Over-limit rates:
   • Extra km (beyond [Billed km] km): ₹[ExtraKmRate] / km
   • Night Bata (after 10:00 PM): ₹350

   To confirm: Call +91 89395 39211 (₹[500/2,000] advance)

   --- OPTION 2: DETAILED ITEMIZED QUOTE ---
   *KALIDASS TRAVELS — OFFICIAL QUOTATION* (Ref: [Quote Ref ID])
   Hello! Greetings from Kalidass Travels, Chennai!

   🚖 *Vehicle:* [Exact Vehicle Name] ([Seats] A/C)
   📍 *Route:* [Origin] to [Destination] & Return
   ⏰ *Timing:* [Days] Day ([Timing details if provided])

   💰 *Fare Breakdown:*
   • [Billed km] Kms ([Days]-Day Min) @ ₹[Rate]/km = ₹[KmFare]
   • Driver Bata: ₹[Bata]
   -------------------------------------
   *BASE FARE: ₹[BaseTotal]*
   [If Interstate: • [State] State Border Permit (Actuals): ₹[Permit]
   -------------------------------------
   *TOTAL ESTIMATED FARE (WITH PERMIT): ₹[TotalWithPermit]*]

   Over-limit rates:
   • Extra km (beyond [Billed km] km): ₹[ExtraKmRate] / km
   • Late Night Bata (past 10:00 PM): ₹350

   ✅ *Included:* [Exact Vehicle Name], Fuel (up to [Billed km] km), Driver Bata
   ❌ *Excluded:* Highway Toll, Checkpost & Parking (as per actuals)

   📞 *To Confirm:* Call/WhatsApp +91 89395 39211 (₹[500/2,000] Advance)
   🌐 *Website:* https://kalidasstravels.in

3. MULTI-TURN FOLLOW-UPS & ALTERATIONS:
   If the user follows up with timing details ("one day one pickup in guindy at 6 am and return at 10 pm"), rate changes ("make it 11000"), or asks "give me rate summary", apply it directly to the active route and vehicle in the conversation history!

4. GREETINGS & STATUS:
   If user says "hi", "hello", "vanakkam", or asks for help:
   Greet politely: "வணக்கம் Saravanan! Kalidass AI Ops Desk is live and connected."
   Provide a concise 3-item bullet list showing:
   1️⃣ Fare Quotes (e.g. 'guindy to kona falls 14 seater tempo', 'pondicherry 2 days crysta')
   2️⃣ Alter Quotes (e.g. 'one pickup at 6 am return 10 pm', 'give ₹500 discount')
   3️⃣ Driver Duty Slips (e.g. 'duty Saravanan TN 01 AB 1234')

5. DRIVER DUTY SLIP GENERATION:
   If user asks for a duty slip (e.g. "duty Saravanan TN 01 AB 1234", "duty slip for Murugan"):
   - Extract the driver name and vehicle registration number.
   - Use the active customer & trip details from the recent conversation.
   - Output an official, forwardable *KALIDASS TRAVELS — OFFICIAL DRIVER DUTY SLIP*.`;

export async function processWhatsAppMessage(incomingText = '', audioBuffer = null, senderJid = '') {
  let promptText = (incomingText || '').trim();
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return '⚠️ GEMINI_API_KEY is not configured in .env. Please check configuration.';
  }

  // Get or initialize conversation history for this sender
  const historyKey = senderJid || 'owner_chat';
  if (!conversationHistories.has(historyKey)) {
    conversationHistories.set(historyKey, []);
  }
  const history = conversationHistories.get(historyKey);

  // Prepare contents payload
  const contents = [];

  // Add past conversation turns (up to 8 turns for context)
  for (const turn of history.slice(-8)) {
    contents.push(turn);
  }

  // If audio voice note received, send inline audio to Gemini 3.8 Flash
  if (audioBuffer) {
    const base64Audio = audioBuffer.toString('base64');
    contents.push({
      role: 'user',
      parts: [
        {
          text: promptText
            ? `Audio voice note received with caption: "${promptText}". Transcribe and execute the travel quotation, driver assignment, or query.`
            : 'Audio voice note received from Kalidass Travels owner/operator. Transcribe and execute the quotation, alteration, or driver duty slip requested.'
        },
        {
          inlineData: {
            mimeType: 'audio/ogg; codecs=opus',
            data: base64Audio
          }
        }
      ]
    });
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: promptText }]
    });
  }

  try {
    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000
          }
        })
      }
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('Gemini API Error:', aiRes.status, errText);
      return `⚠️ AI Service Error (${aiRes.status}). Please try again.`;
    }

    const aiData = await aiRes.json();
    const reply = aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!reply) {
      return '⚠️ No response generated. Please retry.';
    }

    // Save to conversation history
    history.push({ role: 'user', parts: [{ text: promptText || '[Voice Note]' }] });
    history.push({ role: 'model', parts: [{ text: reply }] });
    if (history.length > 16) {
      history.splice(0, history.length - 16);
    }

    // Log calculation if quote was requested
    if (reply.includes('QUOTATION') || reply.includes('₹')) {
      logCalculationToCsv({
        customerName: 'WhatsApp Inquiry',
        route: promptText.slice(0, 50),
        rate: 0
      });
    }

    // Record duty slip if generated
    if (reply.includes('DUTY SLIP')) {
      recordDutySlip({
        text: reply,
        query: promptText
      });
    }

    return reply;
  } catch (err) {
    console.error('Error in processWhatsAppMessage:', err);
    return `⚠️ Bot processing error: ${err.message || 'Unknown error'}`;
  }
}
