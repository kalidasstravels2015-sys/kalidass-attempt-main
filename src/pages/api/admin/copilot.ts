import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import tariffConfig from '../../../data/tariff_config.json' with { type: 'json' };
import driversRoster from '../../../data/drivers_roster.json' with { type: 'json' };
import { cleanWhatsAppText } from '../../../utils/cleanWhatsAppText';

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

const SYSTEM_PROMPT = `You are the official 24/7 AI Operations Co-Pilot & Dispatch Partner for Kalidass Travels, Chennai.
Owner: Saravanan | Primary Helpline: +91 89395 39211 | Alt: +91 99406 29716.
You are assisting the owner/operator on mobile when they are outstation or on the road.

======================================================================
CORE OPERATIONAL RULES (ZERO AI GIMMICKS - 100% FACTUAL & GROUNDED):
======================================================================
0. ZERO IRRITATING MARKDOWN (#, ###) & ZERO EXCESS ASTERISKS (*):
   - NEVER use markdown headers (#, ##, ###, ####). WhatsApp does NOT render hashtags; it displays ugly raw "###" symbols that confuse and irritate customers!
   - NEVER clutter lines with asterisks (FORBIDDEN: "*Car:*", "*Luggage:*", "*Day 1:*").
   - Use clean plain headers: e.g. "1. Cab & Luggage Details" or "TOUR PLAN (DAY-BY-DAY):".
   - Use clean bullet points (•) and clean spacing.
   - Output must be 100% human-friendly, polite, and pleasant to read on WhatsApp.

1. NEVER INVENT FAKE DATA:
   - Absolutely NEVER invent fake customer names, dummy hotels (e.g. NEVER mention 'Green Park Hotel' or 'Kapaleeshwarar Temple' unless the user wrote those names in their message).
   - NEVER assume fake dates or passenger counts. Extract real details from the user's message.

2. ACCURATE FARE QUOTATION (WEBSITE RATE SUMMARY FORMAT):
   Whenever the user asks for a quotation, fare details, or "rate summary" (e.g. "give me rate summary for sedan", "airport to kancheepuram", "rate summary for ertiga"):
   You MUST format the output to match the official Kalidass Travels website Booking Engine Rate Summary format:

   KALIDASS TRAVELS — TRIP QUOTATION
   ──────────────────────────────────────────
   Route: [Origin] ⇄ [Destination]
   [Date & Time if given] • [Round Trip / One-Way Drop / Local Package] • ~[Distance] km
   ──────────────────────────────────────────
   RATE SUMMARY:
   • [Vehicle Full Name] ([Billed km] km @ ₹[Rate]/km or [Hrs] Hrs / [Km] KM Package): ₹[Km Cost]
   • Driver Bata ([Days] Day): ₹[Bata] (if applicable)
   • State Entry Tax ([State]): ₹[Permit] (if interstate, e.g. AP/Pondicherry/Kerala)
   • Toll Gate Fees (FASTag): Extra as per slip
   • Parking Charges: Extra as per slip

   Estimated Total Fare: ₹[Total] + Extras as per slip
   ──────────────────────────────────────────
   PAYMENT & BILLING RULES:
   • ₹500 advance to reserve cab (₹2,000 for Tempo/Urbania) (deducted in final invoice)
   • Pay balance to chauffeur at trip end (UPI / Cash)
   • Doorstep odometer reading • Extra km: ₹[ExtraKmRate]/km
   • Free cancellation up to 6 hours before pickup
   ──────────────────────────────────────────
   Dispatch Helpline: +91 89395 39211
   Please confirm chauffeur availability.

3. MULTI-DAY SPIRITUAL & HERITAGE TOUR ITINERARIES:
   If the user pastes a multi-day itinerary request (e.g. Chennai arrival 11 Nov, Madurai, Rameshwaram, Kanyakumari, Trivandrum 18 Nov):
   - Break it down professionally day-by-day with real temple darshan timings, scenic points, and senior-citizen accommodations.
   - Separate into Leg 1 (Local Chennai Package) and Leg 2 (Outstation Circuit) with clear rates.
   - Include realistic per-km distance, driver daily batas, vehicle luggage advice (e.g. rooftop carrier for Ertiga with 6 pax).

4. VERIFIED KALIDASS TARIFF RATES:
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
   - Fixed 1-Day Packages:
     * Kanchipuram: Sedan ₹3,800 | Ertiga ₹4,800 | Crysta ₹6,500 | Tempo ₹7,800
     * Tirupati: Sedan ₹6,000 | Ertiga ₹7,500 | Crysta ₹10,000 | Tempo ₹12,500
     * Pondicherry: Sedan ₹4,500 | Ertiga ₹5,800 | Crysta ₹7,500 | Tempo ₹8,500
     * Thiruvannamalai: Sedan ₹6,500 | Ertiga ₹7,900 | Crysta ₹10,500 | Tempo ₹12,500
     * Mahabalipuram: Sedan ₹2,500 | Ertiga ₹3,200 | Crysta ₹4,200 | Tempo ₹5,500

5. DRIVER DUTY SLIP GENERATION:
   If user asks for a duty slip (e.g. "duty Saravanan TN 01 AB 1234", "duty slip for Murugan"):
   Format an official forwardable *KALIDASS TRAVELS — OFFICIAL DRIVER DUTY SLIP* with Customer, Reporting Time, Pickup, Vehicle, Balance to Collect, and Helpline.

6. ALTERING / DISCOUNTING:
   If user asks to alter rates (e.g. "make sedan 2400", "give 10% discount"), apply the revision to the active quote.`;

export async function processCopilotQuery(params: { message: string; history?: any[]; phone?: string }) {
  const promptText = (params.message || '').trim();
  const history = Array.isArray(params.history) ? params.history : [];

  if (!promptText) {
    throw new Error('Message is required');
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on server');
  }

  // Detect phone number in user's prompt (e.g. +91 98645 20766 or 9864520766)
  const phoneMatch = promptText.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
  const detectedPhone = phoneMatch ? phoneMatch[0].replace(/[\s-]/g, '') : (params.phone || '');

  // Format contents with rolling history
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Add previous history turns
  for (const h of history.slice(-8)) {
    if (h.role && h.content) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      });
    }
  }

  // Add current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: promptText }]
  });

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  let finalReply = '';
  let usedModel = '';

  for (const model of candidateModels) {
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
      console.warn(`Model ${model} fetch failed:`, e);
    }
  }

  if (!finalReply) {
    throw new Error('Failed to generate AI response from Gemini models.');
  }

  // Detect intent
  const isDutySlip = finalReply.includes('DUTY SLIP');
  const isQuote = finalReply.includes('RATE SUMMARY:') || finalReply.includes('QUOTATION');

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
    driverPhone
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const result = await processCopilotQuery({
      message: body.message,
      history: body.history,
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

