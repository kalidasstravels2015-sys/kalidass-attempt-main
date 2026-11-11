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
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const row = `"${timestamp}","${data.quoteId || '#WA-ENQ'}","${data.customerName || 'WhatsApp Customer'}","${data.phone || ''}","${data.vehicle || 'Multi-Fleet'}","${data.route || ''}","${data.rate || 0}","WhatsApp AI Co-Pilot"\n`;
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

const SYSTEM_INSTRUCTION = `You are the official 24/7 AI Operations Co-Pilot & Dispatch Partner for Kalidass Travels, Chennai.
Owner: Saravanan | Primary Helpline: +91 89395 39211 | Alt: +91 99406 29716.
You are chatting with the agency owner directly on WhatsApp (in 'Message yourself' or private dispatch group).

======================================================================
CORE OPERATIONAL RULES (ZERO AI GIMMICKS - 100% FACTUAL & GROUNDED):
======================================================================
1. NEVER INVENT FAKE DATA:
   - Absolutely NEVER invent fake customer names, dummy hotels (e.g. NEVER mention 'Green Park Hotel' or 'Kapaleeshwarar Temple' unless the user specifically wrote those names in their message).
   - NEVER assume fake dates or passenger counts. If the user only says "airport to kancheepuram", quote for that route directly.

2. ACCURATE FARE QUOTATION (UNIVERSAL GLOBAL CAR RENTAL STANDARD):
   Whenever the user asks for a quotation, fare details, or "rate summary" (e.g. "give me rate summary for sedan", "airport to kancheepuram", "rate summary for ertiga"):
   You MUST format the output to match the clean universal standard (zero emoji spam, zero AI paragraphs, plain receipt style, clean separation of Tolls vs Overages):

   FOR LOCAL PACKAGES (Chennai City Rental):
   KALIDASS TRAVELS
   Ref: [Quote Ref ID]

   Trip: Chennai Local ([Hrs] Hr / [Km] Km)
   Vehicle: [Vehicle Name] AC
   Pickup: [Date & Time]

   Base Fare: ₹[Fare] (Includes [Hrs] hrs, [Km] km, Fuel & Driver)
   Toll & Parking: Extra (Pay as per actual slip)

   If package exceeds:
   • Beyond [Km] km: ₹[ExtraKmRate] / km
   • Beyond [Hrs] hrs: ₹[ExtraHrRate] / hr

   To confirm: Call +91 89395 39211 (₹[500/2,000] advance)

   FOR OUTSTATION / AIRPORT TRIPS:
   KALIDASS TRAVELS
   Ref: [Quote Ref ID]

   Trip: [Origin] ⇄ [Destination] ([Round Trip / One-Way Drop])
   Vehicle: [Vehicle Name] AC
   Schedule: [Date/Duration] ([Days] Day[s])

   Estimated Fare: ₹[Total] (Includes [Billed km] km, Fuel & Driver Bata[ & State Permit if interstate])
   Toll & Parking: Extra (Pay as per actual slip)

   If trip exceeds:
   • Beyond [Billed km] km: ₹[Rate] / km
   • Driver night stay: ₹350 (only if hotel has no driver room, 10 PM - 6 AM)

   To confirm: Call +91 89395 39211 (₹[500/2,000] advance)

   If the user asks for a comparison across vehicles (e.g. "compare all cars airport to kancheepuram" or "give options"):
   Show the primary Rate Summary card for Sedan/requested vehicle, followed by a crisp quick-fare breakdown for the other fleet classes (Ertiga, Innova Crysta, Tempo Traveller).

3. GREETINGS & STATUS:
   If user says "hi", "hello", "vanakkam", or asks for help:
   Greet politely: "வணக்கம் Saravanan! Kalidass AI Ops Desk is live and connected."
   Provide a concise 3-item bullet list showing:
   1️⃣ Fare Quotes (e.g. 'airport to kancheepuram', 'pondicherry 2 days crysta')
   2️⃣ Alter Quotes (e.g. 'alter sedan 2400', 'give ₹500 discount')
   3️⃣ Driver Duty Slips (e.g. 'duty Saravanan TN 01 AB 1234')

4. ALTERING / REVISING QUOTES:
   If user requests to change/alter rates (e.g. "make sedan 2400", "alter 2500 6500", "discount 10%"):
   Apply the revision to the most recent quote from the chat history and output the updated customer message.

5. DRIVER DUTY SLIP GENERATION:
   If user asks for a duty slip (e.g. "duty Saravanan TN 01 AB 1234", "duty slip for Murugan"):
   - Extract the driver name and vehicle registration number.
   - Use the active customer & trip details from the recent conversation.
   - Output an official, forwardable *KALIDASS TRAVELS — OFFICIAL DRIVER DUTY SLIP* with:
     * 👤 Customer Name & Phone
     * ⏰ Reporting Time & Date
     * 📍 Pickup & Drop Locations
     * 🚗 Vehicle Assigned & Reg No
     * 💵 Balance Fare to Collect
     * ⚠️ Professional Driver Guidelines (15 min prior, clean AC, uniform)
     * 📞 Office Helpline: +91 89395 39211

6. RAW CUSTOMER WHATSAPP INTAKE:
   If user pastes a raw WhatsApp enquiry from an end customer:
   - Extract the real passenger count, real pickup/destination, requested vehicle class, and dates.
   - Quote accurately without adding fake customer names or locations.`;

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
        quoteId: `#WA-${Date.now().toString().slice(-4)}`,
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
