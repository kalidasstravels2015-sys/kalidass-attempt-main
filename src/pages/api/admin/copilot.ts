import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import driversRoster from '../../../data/drivers_roster.json' with { type: 'json' };
import tariffConfig from '../../../data/tariff_config.json' with { type: 'json' };
import { cleanWhatsAppText } from '../../../utils/cleanWhatsAppText.js';
import { getFormattedDateCode } from '../../../utils/sequenceGenerator.js';

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

function buildMasterTariffReference(): string {
  const vehicleLines = Object.entries(tariffConfig.vehicles || {}).map(([name, v]: [string, any]) => {
    return `• ${name} (${v.seats} AC, category: ${v.category}):
  - Round-Trip Rate: ₹${v.round_trip_rate}/km (Min ${v.min_km_per_day} km/day) + Driver Bata ₹${v.driver_bata}/day
  - One-Way Drop Rate: ₹${v.one_way_rate}/km (Min ${v.min_drop_km} km) + Driver Bata ₹${v.driver_bata}
  - Extra KM Rate: ₹${v.extra_km_rate}/km | Extra Hour Rate: ₹${v.extra_hr_rate}/hr
  - Local Chennai Packages: 4hr/40km ₹${v.local_4hr_pkg} | 5hr/50km ₹${v.local_5hr_pkg} | 8hr/80km ₹${v.local_8hr_pkg} | 10hr/100km ₹${v.local_10hr_pkg} | 12hr/120km ₹${v.local_12hr_pkg}`;
  }).join('\n');

  const permitLines = Object.entries(tariffConfig.state_permits || {}).map(([code, p]: [string, any]) => {
    const r = p.rates || {};
    const kw = Array.isArray(p.keywords) && p.keywords.length > 0 ? ` [Destinations: ${p.keywords.join(', ')}]` : '';
    return `• ${p.stateName} (${code}): sedan ₹${r.sedan} | suv (Ertiga) ₹${r.suv} | muv (Innova/Crysta) ₹${r.muv} | tempo (12-Seater & 14-Seater) ₹${r.tempo} | coach (17-Seater, 20-Seater, 26-Seater, Force Urbania) ₹${r.coach} (${p.statutoryBasis})${kw}`;
  }).join('\n');

  const tourLines = Object.entries(tariffConfig.tour_packages || {}).map(([_slug, pkg]: [string, any]) => {
    const vRates = Object.entries(pkg.vehicles || {}).map(([vk, vd]: [string, any]) => {
      return `${vk}: 1D ₹${vd.rates?.['1'] || '-'}, 2D ₹${vd.rates?.['2'] || '-'}, 3D ₹${vd.rates?.['3'] || '-'}`;
    }).join(' | ');
    return `• ${pkg.name} (${pkg.roundTripKm} km RT, State: ${pkg.stateCode}): ${vRates}`;
  }).join('\n');

  return `======================================================================
OFFICIAL KALIDASS TRAVELS MASTER TARIFF (100% SOURCE OF TRUTH):
======================================================================
A. COMPLETE VEHICLE FLEET & PER-KM / LOCAL PACKAGE TARIFF:
${vehicleLines}

B. PARIVAHAN STATUTORY INTERSTATE BORDER ENTRY PERMITS (BY VEHICLE CATEGORY):
${permitLines}
* Crucial Border Note: Kona Falls (Kailasakona / Kone Waterfalls), Nagalapuram, Pichatur, Puttur, Narayanavanam, Surutapalli, Tada, Srikalahasti, Tirupati, and Kanipakam are across the Andhra Pradesh (AP) border! Always apply the AP State Permit (e.g. ₹3,100 for 12-Seater & 14-Seater Tempo; ₹4,300 for 17/20/26-Seater & Urbania; ₹1,900 for Innova/Crysta; ₹850 for Ertiga; ₹500 for Sedan).

C. FIXED TOUR PACKAGES:
${tourLines}`;
}

function buildSystemPrompt(): string {
  const dateCode = getFormattedDateCode();
  const defaultQuoteRef = `Q-${dateCode}-1`;
  const masterTariff = buildMasterTariffReference();

  return `You are the official 24/7 AI Operations Partner, Dispatch Genius, and Business Co-Pilot for Kalidass Travels, Chennai.
Owner: Saravanan | Primary Helpline: +91 89395 39211 | Alternate: +91 63819 39769 | Dispatch Desk: +91 90923 03060.
Today's Default Quote Reference ID: ${defaultQuoteRef}

${masterTariff}

======================================================================
MANDATORY DUAL-QUOTE OUTPUT FORMAT FOR ALL TRIP QUOTATIONS:
======================================================================
Whenever the user asks for a quote, route fare, rate summary for a trip, or updates an active quote (e.g. "guindy to kona falls in 14 seater tempo", "one day one pickup in guindy at 6 am and return to guindy at 10 pm", "make it 2 days", "give ₹400 discount"):

You MUST ALWAYS respond with this exact 4-part structure so the Admin UI renders two 1-click copyable WhatsApp quote cards + internal math summary + Push-to-Dispatch button:

1. ROUTE & BILLING NOTE (1-2 concise sentences):
State the estimated round-trip distance vs the daily minimum billing km (e.g. "Guindy ⇄ Kona Falls is ~210–220 km round trip, so it is billed at the standard 300 km/day minimum for Tempo Travellers. Since Kona Falls is across the Andhra Pradesh border, both the All-Inclusive Permit version and Base + Actuals version are provided below.")

2. OPTION 1 — COMPACT WHATSAPP MICRO-RECEIPT (Wrap inside :::QUOTE_OPTION_1::: and :::END_QUOTE_1:::):
:::QUOTE_OPTION_1:::
*KALIDASS TRAVELS* (Ref: ${defaultQuoteRef})
[Origin] ⇄ [Destination] • [1-Day Round Trip / X-Day Round Trip / One-Way Drop]
[If timing/pickup specified, add line: e.g. 6:00 AM Pickup – 10:00 PM Drop (Single Pickup/Drop @ Guindy)]
[Exact Vehicle Name from Master Tariff] ([Seats] AC)

*Estimated Fare: ₹[TotalWithPermitFormatted]*
Includes: [BilledKm] km (₹[KmChargeFormatted]), Fuel, Driver Bata (₹[BataFormatted])[, [State] State Permit (₹[PermitFormatted])]
Toll & Parking: Extra as per actual slip

Over-limit rates:
• Extra km (beyond [BilledKm] km): ₹[ExtraKmRate] / km
• Night Bata (after 10:00 PM): ₹350

To confirm: Call +91 89395 39211 (₹[500 for Sedan/SUV/MUV or 2,000 for Tempo/Coach] advance)
:::END_QUOTE_1:::

3. OPTION 2 — DETAILED ITEMIZED WHATSAPP QUOTE (Wrap inside :::QUOTE_OPTION_2::: and :::END_QUOTE_2:::):
:::QUOTE_OPTION_2:::
*KALIDASS TRAVELS — OFFICIAL QUOTATION* (Ref: ${defaultQuoteRef})
Hello! Greetings from Kalidass Travels, Chennai!

🚖 *Vehicle:* [Exact Vehicle Name] ([Seats] A/C)
📍 *Route:* [Origin] to [Destination] & Return [include (Single Point Pickup & Drop) if requested]
⏰ *Timing:* [Days] Day ([Include exact pickup & return times if provided, e.g. 6:00 AM Pickup – 10:00 PM Return])

💰 *Fare Breakdown:*
• [BilledKm] Kms ([Days]-Day Min) @ ₹[PerKmRate]/km = ₹[KmChargeFormatted]
• Driver Bata ([Timing or Days]): ₹[BataFormatted]
-------------------------------------
*BASE FARE: ₹[BaseTotalFormatted]*
• [State] State Border Permit (Actuals): ₹[PermitFormatted]
-------------------------------------
*TOTAL ESTIMATED FARE (WITH PERMIT): ₹[TotalWithPermitFormatted]*

Over-limit rates:
• Extra km (beyond [BilledKm] km): ₹[ExtraKmRate] / km
• Late Night Bata (if trip extends past 10:00 PM): ₹350

✅ *Included:* [Exact Vehicle Name], Fuel (up to [BilledKm] km), Driver Bata
❌ *Excluded:* Highway Toll, Checkpost & Parking (as per actuals)

📞 *To Confirm:* Call/WhatsApp +91 89395 39211 (₹[500/2,000] Advance)
🌐 *Website:* https://kalidasstravels.in
:::END_QUOTE_2:::
*(Note: If the trip is strictly within Tamil Nadu where State Permit is ₹0, omit the State Border Permit line and show TOTAL ESTIMATED FARE: ₹[BaseTotalFormatted] + Toll & Parking at actuals).*

4. QUICK RATE SUMMARY (INTERNAL DISPATCHER REFERENCE):
Provide 4–6 clean bullet lines showing:
• Base KM Charge: [BilledKm] km × ₹[PerKmRate]/km = ₹[KmChargeFormatted]
• Driver Bata: [Days] Day × ₹[DailyBata]/day = ₹[BataFormatted]
• Base Total (Excl. Permit/Toll): ₹[BaseTotalFormatted]
• [State] State Permit: ₹[PermitFormatted] (if interstate)
• Total with Permit: ₹[TotalWithPermitFormatted]
• 2-Day Round Trip (if overnight): [2DayKm] km × ₹[PerKmRate] + ₹[2DayBata] Bata = ₹[2DayBase] (Base) / ₹[2DayWithPermit] (with Permit)

5. STRUCTURED BOOKING METADATA TAG (MANDATORY AT VERY END OF EVERY QUOTE RESPONSE):
Always append this exact block at the very end so the dispatcher can push Option 1 or Option 2 to the Dispatch Desk in 1 click:
:::BOOKING_META:::
{"vehicle":"[Exact Key from Master Tariff, e.g. 14-Seater Executive Force Tempo]","tripCategory":"Outstation Round Trip","pickupLocation":"[Origin]","dropLocation":"[Destination]","route":"[Origin] ⇄ [Destination]","pickupTime":"[e.g. 06:00 AM]","days":1,"option1Fare":[TotalWithPermitNumber],"option2Fare":[BaseTotalNumber],"notes":"[Short summary e.g. 1-Day RT 300km min, 6AM-10PM, AP Permit ₹3,100]"}
:::END_BOOKING_META:::

======================================================================
CRITICAL MULTI-TURN & FOLLOW-UP RULES:
======================================================================
1. NEVER FORGET THE ACTIVE TRIP ON FOLLOW-UPS:
   - If the user previously asked "guindy to kona falls in 14 seater tempo" and then follows up with:
     • "one day one pickup in guindy at 6 am and return to guindy at 10 pm"
     • "give me rate summary"
     • "what about 17 seater?"
     • "make it 2 days" or "give ₹500 discount"
   - You MUST apply that follow-up directly to the ACTIVE trip (Guindy ⇄ Kona Falls) and output the updated Option 1 + Option 2 + Quick Rate Summary + BOOKING_META!
   - NEVER dump a generic company-wide tariff sheet when there is an active route in the conversation!
2. EXACT VEHICLE MATCHING:
   - "12 seater tempo" -> 12-Seater Luxury Force Tempo (₹24/km, ₹800 bata, 300 km/day min)
   - "14 seater tempo" -> 14-Seater Executive Force Tempo (₹25/km, ₹800 bata, 300 km/day min)
   - "17 seater tempo" -> 17-Seater Executive Force Tempo (₹26/km, ₹800 bata, 300 km/day min, coach permit)
   - "20 seater tempo" -> 20-Seater Grand Force Tempo (₹30/km, ₹900 bata, 300 km/day min, coach permit)
   - "26 seater" / "mini bus" -> 26-Seater Mini Bus / Force Tempo (₹36/km, ₹1,000 bata, 350 km/day min, coach permit)
   - "urbania" -> Force Urbania VIP Luxury (₹38/km, ₹1,100 bata, 300 km/day min, coach permit)
3. MULTI-PHOTO & PDF VISION + LIVE SEARCH:
   - When photos/PDFs (IRCTC tickets, flight tickets, WhatsApp screenshots) are attached, extract all real details and generate the exact Dual-Quote or Driver Duty Slip requested.`;
}


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

  // Format contents with rolling history (avoid duplicating current user turn)
  const contents: Array<{ role: string; parts: Array<any> }> = [];
  const priorHistory = history.slice(0, 12);
  // If the client appended the current user message to history array before sending, pop it so we don't send it twice
  if (
    priorHistory.length > 0 &&
    priorHistory[priorHistory.length - 1]?.role === 'user' &&
    priorHistory[priorHistory.length - 1]?.content?.trim() === promptText
  ) {
    priorHistory.pop();
  }

  // Add previous history turns (text only for history to keep payload lightweight)
  for (const h of priorHistory.slice(-8)) {
    if (h.role && h.content) {
      const mappedRole = h.role === 'user' ? 'user' : 'model';
      const prev = contents[contents.length - 1];
      if (prev && prev.role === mappedRole) {
        prev.parts.push({ text: h.content });
      } else {
        contents.push({
          role: mappedRole,
          parts: [{ text: h.content }]
        });
      }
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
    ? `Please carefully analyze the ${allAttachments.length} attached document(s)/photo(s) (tickets, WhatsApp chats, bills, or itineraries). Extract all key details (passenger names, contact numbers, dates, timings, locations, amounts) and provide the required Dual-Quote (Option 1 Micro-Receipt + Option 2 Detailed Itemized Quote), duty slip, or settlement.`
    : '');

  userParts.push({ text: effectivePrompt });

  const lastTurn = contents[contents.length - 1];
  if (lastTurn && lastTurn.role === 'user') {
    lastTurn.parts.push(...userParts);
  } else {
    contents.push({
      role: 'user',
      parts: userParts
    });
  }

  const systemPrompt = buildSystemPrompt();
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
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.15,
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
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: {
              temperature: 0.15,
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

  // Extract structured bookingMeta if present
  let bookingMeta: any = null;
  const metaMatch = finalReply.match(/:::BOOKING_META:::\s*([\s\S]*?)\s*(?::::END_BOOKING_META:::|$)/i);
  if (metaMatch && metaMatch[1]) {
    try {
      bookingMeta = JSON.parse(metaMatch[1].trim());
    } catch (_) {}
  }

  // Detect intent
  const isDutySlip = finalReply.includes('DUTY SLIP');
  const isQuote = finalReply.includes('QUOTE_OPTION_1') || finalReply.includes('RATE SUMMARY:') || finalReply.includes('QUOTATION') || finalReply.includes('*KALIDASS TRAVELS*');

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
    bookingMeta,
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
