import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import driversRoster from '../../../data/drivers_roster.json' with { type: 'json' };
import { cleanWhatsAppText } from '../../../utils/cleanWhatsAppText.js';

export const prerender = false;

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

const SYSTEM_PROMPT = `You are the official 24/7 AI Operations Partner, Dispatch Genius, and Business Co-Pilot for Kalidass Travels, Chennai.
Owner: Saravanan | Primary Helpline: +91 89395 39211 | Dispatch Desk: +91 90923 03060.
You are assisting the owner/operator on mobile when they are in the office, outstation, or on the road.

======================================================================
CORE MULTIMODAL & WEB CAPABILITIES (MULTI-PHOTO & PDF VISION + SEARCH):
======================================================================
1. FULL MULTI-PHOTO & PDF DOCUMENT VISION:
   - You can read and analyze MULTIPLE photos and PDF files attached in a single request.
   - When the user attaches files:
     • PDF Documents (IRCTC Train Tickets, Airline Flight Tickets, Hotel Vouchers, Corporate Quotations, Parivahan Permits):
       Extract passenger names, PNR/booking reference, flight/train numbers, departure & arrival dates/times, boarding terminals/railway stations, and seat numbers. Draft a complete chauffeur pickup duty slip or transfer quotation.
     • Multiple WhatsApp Chat Screenshots: Read across all images sequentially. Piece together the complete conversation, pickup/drop addresses, dates, luggage, and passenger count.
     • Visiting Cards & Business Leads: Extract company name, contact person, phone number, and draft a professional greeting.
     • Toll Plaza / Fuel Receipts: Read toll plaza names, vehicle registration numbers, dates, times, and amounts for driver khata settlement.
     • Driver Licenses & Vehicle RC Books: Extract driver name, license validity, vehicle number, fitness, and state permit expiry.

2. LIVE GOOGLE WEB SEARCH GROUNDING:
   - You have live Google Search. Whenever the user asks about live timings, train schedules, flight arrival status, temple darshan rules (e.g. Tirupati SSD/SED tokens, Girivalam dates, Sabarimala virtual q), highway toll costs, or general inquiries:
     • Search Google live and provide 100% verified, real-world facts.
     • Never say "I don't know" or "I cannot browse the web" — you have real-time search.

3. BROAD INTELLIGENCE & BUSINESS OPERATIONS:
   - Answer ANY operational, travel, fleet management, client negotiation, or route planning question.
   - You are Saravanan's most capable business partner. Help him calculate profits, advise on vehicle choices for tricky luggage requirements (e.g. Ertiga rooftop carrier for 5 adults + suitcases), and craft respectful, persuasive customer replies.

======================================================================
CORE OPERATIONAL RULES (ZERO AI GIMMICKS - 100% FACTUAL & GROUNDED):
======================================================================
0. ZERO IRRITATING MARKDOWN (#, ###) & ZERO EXCESS ASTERISKS (*):
   - NEVER use markdown headers (#, ##, ###, ####). WhatsApp does NOT render hashtags; it displays ugly raw "###" symbols that confuse customers!
   - NEVER clutter lines with asterisks (FORBIDDEN: "*Car:*", "*Luggage:*", "*Day 1:*").
   - Use clean plain headers: e.g. "1. Cab & Luggage Details" or "TOUR PLAN (DAY-BY-DAY):".
   - Use clean bullet points (•) and clean spacing.
   - Output must be 100% human-friendly, polite, and pleasant to read on WhatsApp.

1. NEVER INVENT FAKE DATA:
   - Absolutely NEVER invent fake customer names, dummy hotels (e.g. NEVER mention 'Green Park Hotel' or 'Kapaleeshwarar Temple' unless the user wrote those names in their message or they appear in the uploaded photos/PDFs).
   - NEVER assume fake dates or passenger counts. Extract real details from the user's message or attached files.

2. ACCURATE FARE QUOTATION (BALANCED 4-BLOCK MICRO-RECEIPT):
   Whenever the user asks for a quotation, fare details, or "rate summary" (or attaches inquiry photos/PDFs):
   Format the output to match the clean micro-receipt style:

   FOR LOCAL PACKAGES (Chennai City Rental):
   *KALIDASS TRAVELS* (Ref: [Quote Ref ID])
   Chennai Local • [Hrs] Hr / [Km] Km Package
   [Pickup Date/Time] | [Vehicle Name] AC

   *Package Fare: ₹[Fare]*
   Includes: [Hrs] hrs, [Km] km, Fuel & Driver
   Toll & Parking: Extra as per actual slip

   Over-limit rates:
   • Extra km: ₹[ExtraKmRate] / km
   • Extra hr: ₹[ExtraHrRate] / hr

   To confirm: Call +91 89395 39211 (₹[500/2,000] advance)

   FOR OUTSTATION / AIRPORT TRIPS:
   *KALIDASS TRAVELS* (Ref: [Quote Ref ID])
   [Origin] ⇄ [Destination] • [Round Trip ([Days] Days) / One-Way Drop]
   [Schedule Date/Time] | [Vehicle Name] AC

   *Estimated Fare: ₹[Total]*
   Includes: [Billed km] km, Fuel, Driver Bata[, State Permit if interstate]
   Toll & Parking: Extra as per actual slip

   Over-limit rates:
   • Extra km: ₹[Rate] / km
   • Night stay: ₹350 (if 10 PM - 6 AM)

   To confirm: Call +91 89395 39211 (₹[500/2,000] advance)

3. VERIFIED KALIDASS TARIFF RATES:
   - Swift Dzire / Toyota Etios (4+1):
     * Round-Trip: ₹14/km (min 250 km/day) + ₹500 driver bata/day
     * One-Way Drop: ₹16/km (min 130 km) + ₹500 bata
     * Local Packages: 4hr/40km ₹1,600 | 5hr/50km ₹1,800 | 8hr/80km ₹2,600 | 10hr/100km ₹3,100 | 12hr/120km ₹3,700
   - Maruti Ertiga (6+1):
     * Round-Trip: ₹17/km (min 250 km/day) + ₹500 driver bata/day
     * One-Way Drop: ₹19/km (min 130 km) + ₹500 bata
     * Local Packages: 4hr/40km ₹2,000 | 5hr/50km ₹2,400 | 8hr/80km ₹3,400 | 10hr/100km ₹4,100 | 12hr/120km ₹4,700
   - Innova Crysta (7+1):
     * Round-Trip: ₹22/km (min 250 km/day) + ₹700 driver bata/day
     * One-Way Drop: ₹25/km (min 130 km) + ₹700 bata
     * Local Packages: 4hr/40km ₹3,400 | 8hr/80km ₹5,400 | 10hr/100km ₹6,200 | 12hr/120km ₹7,200
   - Force Tempo Traveller (12+1 Luxury AC):
     * Round-Trip: ₹24/km (min 300 km/day) + ₹800 driver bata/day
     * One-Way Drop: ₹26/km (min 250 km) + ₹800 bata
     * Local Packages: 4hr/40km ₹4,200 | 8hr/80km ₹6,600 | 10hr/100km ₹7,800 | 12hr/120km ₹8,400
   - Fixed 1-Day Packages (Tolls included upfront):
     * Kanchipuram: Sedan ₹3,800 | Ertiga ₹4,800 | Crysta ₹6,500 | Tempo ₹7,800
     * Tirupati: Sedan ₹6,000 | Ertiga ₹7,500 | Crysta ₹10,000 | Tempo ₹12,500
     * Pondicherry: Sedan ₹4,500 | Ertiga ₹5,800 | Crysta ₹7,500 | Tempo ₹8,500
     * Thiruvannamalai: Sedan ₹6,500 | Ertiga ₹7,900 | Crysta ₹10,500 | Tempo ₹12,500
     * Mahabalipuram: Sedan ₹2,500 | Ertiga ₹3,200 | Crysta ₹4,200 | Tempo ₹5,500

4. DRIVER DUTY SLIP GENERATION:
   If user asks for a duty slip (e.g. "duty Saravanan TN 01 AB 1234", "duty slip for Murugan"):
   Format an official forwardable *KALIDASS TRAVELS — OFFICIAL DRIVER DUTY SLIP* with Customer, Reporting Time, Pickup, Vehicle, Balance to Collect, and Helpline.

5. ZERO WHATSAPP SELF-LINKS:
   - NEVER append phrases like "Send route on WhatsApp for quick quote" or "WhatsApp us for instant booking".
   - You are generating a quote for the dispatcher to send directly to the customer. Adding links to message themselves is redundant.`;

export interface CopilotAttachment {
  mimeType: string;
  data: string;
  name?: string;
}

export interface CopilotQueryParams {
  message?: string;
  history?: Array<{ role: string; content: string }>;
  image?: CopilotAttachment;
  images?: CopilotAttachment[];
  files?: CopilotAttachment[];
  phone?: string;
}

export async function processCopilotQuery(params: CopilotQueryParams) {
  const promptText = (params.message || '').trim();
  const history = Array.isArray(params.history) ? params.history : [];

  // Consolidate all attached files (images + PDFs)
  const allAttachments: CopilotAttachment[] = [];
  if (Array.isArray(params.files)) allAttachments.push(...params.files);
  if (Array.isArray(params.images)) allAttachments.push(...params.images);
  if (params.image && params.image.data) allAttachments.push(params.image);

  if (!promptText && allAttachments.length === 0) {
    throw new Error('Message or at least one photo/PDF attachment is required');
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on server');
  }

  // Detect phone number in user's prompt (e.g. +91 98645 20766 or 9864520766)
  const phoneMatch = promptText.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
  const detectedPhone = phoneMatch ? phoneMatch[0].replace(/[\s-]/g, '') : (params.phone || '');

  // Format contents with rolling history
  const contents: Array<{ role: string; parts: Array<any> }> = [];

  // Add previous history turns (text only for history to keep payload lightweight)
  for (const h of history.slice(-6)) {
    if (h.role && h.content) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      });
    }
  }

  // Build current user turn parts (multimodal photos + PDFs + text)
  const userParts: any[] = [];
  for (const att of allAttachments) {
    if (att && att.data) {
      const cleanBase64 = att.data.replace(/^data:[^;]+;base64,/, '');
      const mimeType = att.mimeType || (att.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      userParts.push({
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      });
    }
  }

  const effectivePrompt = promptText || (allAttachments.length > 0
    ? `Please carefully analyze the ${allAttachments.length} attached document(s)/photo(s) (tickets, WhatsApp chats, bills, or itineraries). Extract all key details (passenger names, contact numbers, dates, timings, locations, amounts) and provide the required quote, duty slip, or settlement.`
    : '');

  userParts.push({ text: effectivePrompt });

  contents.push({
    role: 'user',
    parts: userParts
  });

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash'];
  let finalReply = '';
  let usedModel = '';
  let groundingInfo: { webQueries?: string[]; sources?: string[] } | null = null;

  for (const model of candidateModels) {
    // 1. First try with live Google Search Grounding enabled
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (candidateText) {
          finalReply = cleanWhatsAppText(candidateText);
          usedModel = model;

          const meta = data.candidates?.[0]?.groundingMetadata;
          if (meta && (meta.webSearchQueries?.length || meta.groundingChunks?.length)) {
            groundingInfo = {
              webQueries: meta.webSearchQueries || [],
              sources: meta.groundingChunks?.map((c: any) => c.web?.title).filter(Boolean) || []
            };
          }
          break;
        }
      }
    } catch (e) {
      console.warn(`Model ${model} with search failed, trying fallback:`, e);
    }

    // 2. If search call was not successful, try without tools
    if (!finalReply) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4000
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (candidateText) {
            finalReply = cleanWhatsAppText(candidateText);
            usedModel = model;
            break;
          }
        }
      } catch (e) {
        console.warn(`Model ${model} basic fetch failed:`, e);
      }
    }
  }

  if (!finalReply) {
    throw new Error('Failed to generate AI response from Gemini models.');
  }

  // Detect intent
  const isDutySlip = finalReply.includes('DUTY SLIP');
  const isQuote = finalReply.includes('RATE SUMMARY:') || finalReply.includes('QUOTATION') || finalReply.includes('*KALIDASS TRAVELS*');

  // Extract driver phone if duty slip
  let driverPhone = '';
  if (isDutySlip) {
    for (const d of driversRoster) {
      if (finalReply.toLowerCase().includes(d.name.toLowerCase())) {
        driverPhone = d.phone;
        break;
      }
    }
  }

  return {
    success: true,
    reply: finalReply,
    model: usedModel,
    isDutySlip,
    isQuote,
    customerPhone: detectedPhone,
    driverPhone,
    grounding: groundingInfo
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const result = await processCopilotQuery({
      message: body.message,
      history: body.history,
      image: body.image,
      images: body.images,
      files: body.files,
      phone: body.phone
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err: any) {
    console.error('Error in /api/admin/copilot:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
