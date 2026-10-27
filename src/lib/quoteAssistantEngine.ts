// src/lib/quoteAssistantEngine.ts
import fs from 'node:fs';
import path from 'node:path';

// Known one-way distances from Chennai
export const KNOWN_ONE_WAY_KM: Record<string, number> = {
  pondicherry: 151,
  puducherry: 151,
  auroville: 150,
  tirupati: 135,
  tirumala: 155,
  vellore: 137,
  kanchipuram: 75,
  mahabalipuram: 56,
  pichavaram: 225,
  chidambaram: 215,
  kumbakonam: 298,
  thanjavur: 342,
  trichy: 332,
  madurai: 462,
  coimbatore: 505,
  salem: 340,
  tiruvannamalai: 195,
  bangalore: 346,
  bengaluru: 346,
  mysore: 480,
  ooty: 555,
  kodaikanal: 530,
  rameshwaram: 575,
  kanyakumari: 708
};

// AC fuel mileage (km / litre)
export const VEHICLE_MILEAGE: Record<string, number> = {
  'Swift Dzire': 16.5,
  'Toyota Etios': 16.0,
  'Maruti Ertiga': 14.0,
  'Innova': 11.5,
  'Innova Crysta': 11.0,
  'Tempo Traveller': 7.5,
  '12-Seater': 7.5,
  '17-Seater': 7.0
};

export const DIESEL_PRICE_PER_LITRE = 93.5;

export function getApiKey(): string | null {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const m = fs.readFileSync(envPath, 'utf8').match(/GEMINI_API_KEY\s*=\s*(.+)/);
        if (m) apiKey = m[1].trim();
      }
    } catch (_) {}
  }
  return apiKey || null;
}

export function loadTariffConfig() {
  try {
    const tariffPath = path.resolve(process.cwd(), 'src/data/tariff_config.json');
    if (fs.existsSync(tariffPath)) {
      return JSON.parse(fs.readFileSync(tariffPath, 'utf8'));
    }
  } catch (_) {}
  return {
    vehicles: {
      'Swift Dzire': { round_trip_rate: 14, one_way_rate: 15, driver_bata: 500, min_km_per_day: 250 },
      'Toyota Etios': { round_trip_rate: 14, one_way_rate: 15, driver_bata: 500, min_km_per_day: 250 },
      'Maruti Ertiga': { round_trip_rate: 18, one_way_rate: 19, driver_bata: 500, min_km_per_day: 250 },
      'Innova': { round_trip_rate: 20, one_way_rate: 22, driver_bata: 600, min_km_per_day: 300 },
      'Innova Crysta': { round_trip_rate: 24, one_way_rate: 26, driver_bata: 700, min_km_per_day: 300 },
      'Tempo Traveller': { round_trip_rate: 26, one_way_rate: 28, driver_bata: 800, min_km_per_day: 300 }
    }
  };
}

export async function processQuoteAssistant(body: any) {
  const mode = body.mode || 'ai'; // 'ai' | 'calc' | 'adjust'
  const rawText = String(body.text || '').trim();
  const audioBase64 = body.audioBase64 || null;
  const audioMimeType = body.audioMimeType || 'audio/mp3';
  const apiKey = getApiKey();

  // Mode: Interactive AI Adjustment of Existing Quotation
  if (mode === 'adjust') {
    const currentQuote = String(body.currentQuote || '').trim();
    const instruction = String(body.instruction || '').trim();
    if (!instruction) {
      return { success: false, error: 'No adjustment instruction provided' };
    }

    if (apiKey) {
      try {
        const adjustPrompt = `You are the lead travel quote dispatcher for Kalidass Travels (Chennai).
Your job is to update an existing WhatsApp customer fare quotation based on the business operator's adjustment or correction instruction.

OPERATOR'S CORRECTION / INSTRUCTION:
"${instruction}"

CURRENT WHATSAPP QUOTATION:
"""
${currentQuote}
"""

RULES:
1. Apply the correction precisely:
   - If they ask for a discount (e.g. "₹300 discount", "give 5% off"), adjust the total estimate price clearly and mention the discount.
   - If they ask to add tolls/permits (e.g. "Add Tirumala permit ₹500", "Add AP border tax"), add it cleanly to EXTRA CHARGES or the fare breakdown.
   - If they specify pickup time or location (e.g. "Pickup at 4:30 AM Chennai Airport T2"), update the TRIP DETAILS section.
   - If they ask to change vehicle options or focus (e.g. "Only Dzire and Innova", "Remove tempo"), modify the VEHICLE FARE OPTIONS section accordingly.
   - If they ask for a night stay charge, add driver night accommodation (₹350/night).
   - If they ask for Tamil greeting or friendly local touch, add appropriate greetings (e.g. "வணக்கம் / Hello").
   - If they ask to make it shorter/punchier, condense bullet points while retaining rates, vehicle, and booking terms.
2. Maintain standard WhatsApp formatting:
   - Use emojis, clean bullet points (•), and bolding (*like this*).
   - Retain Kalidass Travels booking terms: ₹500 advance deposit to confirm (UPI: 8939539211@okbizaxis), 50% on boarding, balance at drop.
3. Return ONLY the finalized, ready-to-send WhatsApp quotation text.
   Do NOT output markdown code blocks (no \`\`\` or \`\`\`whatsapp), and do NOT include any introductory or concluding chat remarks like "Here is your updated quote:". Just the message itself.`;

        const geminiModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-pro-latest'];
        for (const model of geminiModels) {
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: adjustPrompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 2000 }
              })
            });

            if (res.ok) {
              const data = await res.json();
              let textPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text && !p.thought)?.text || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              textPart = textPart.replace(/^```(?:whatsapp|markdown|text)?\n?/i, '').replace(/\n?```$/i, '').trim();
              if (textPart && textPart.length > 50) {
                return {
                  success: true,
                  updatedQuote: textPart,
                  instructionApplied: instruction,
                  method: 'ai'
                };
              }
            }
          } catch (_) {}
        }
      } catch (_) {}
    }

    // Smart Fallback Rule Engine if API is unavailable
    let fallbackText = currentQuote;
    const lowerInst = instruction.toLowerCase();

    // Check discount
    const discMatch = lowerInst.match(/(?:discount|reduce|less|off|minus)\s*(?:by|of)?\s*(?:rs\.?|₹)?\s*(\d+)/i) ||
                      lowerInst.match(/(\d+)\s*(?:rs|₹)?\s*(?:discount|off|less|reduce)/i);
    if (discMatch) {
      const disc = parseInt(discMatch[1], 10);
      fallbackText = fallbackText.replace(/(👉\s*TOTAL ESTIMATE\s*:\s*₹?)([0-9,]+)/g, (_, prefix, val) => {
        const orig = parseInt(val.replace(/,/g, ''), 10);
        const updated = Math.max(0, orig - disc);
        return `${prefix}${updated.toLocaleString('en-IN')} *(Special Owner Discount applied: -₹${disc})*`;
      });
    }

    // Check pickup time
    const timeMatch = instruction.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.))/i);
    if (timeMatch && fallbackText.includes('Dates:')) {
      fallbackText = fallbackText.replace(/(Dates:[^\n]+)/, `$1\n• Reporting Time: ${timeMatch[1].toUpperCase()} sharp`);
    }

    // Check night stay
    if (lowerInst.includes('night stay') || lowerInst.includes('lodging') || lowerInst.includes('driver stay')) {
      if (!fallbackText.includes('Driver Night Stay: ₹350')) {
        fallbackText = fallbackText.replace(/EXTRA CHARGES/i, 'EXTRA CHARGES\n• Driver Night Stay: ₹350 per night (payable to driver)');
      }
    }

    // Check Tamil greeting
    if (lowerInst.includes('tamil') || lowerInst.includes('vanakkam')) {
      fallbackText = fallbackText.replace(/Hello [^,]+,/i, 'வணக்கம் / Hello Sir/Madam,');
    }

    return {
      success: true,
      updatedQuote: fallbackText,
      instructionApplied: instruction,
      method: 'heuristic'
    };
  }

  let extracted = {
    customerName: body.customerName || 'Guest',
    customerPhone: body.customerPhone || '',
    pickup: body.pickup || 'Chennai',
    destination: body.destination || 'Puducherry',
    travelDates: body.travelDates || 'Upcoming',
    days: Number(body.days) || 1,
    paxCount: Number(body.paxCount) || 4,
    vehicleKey: body.vehicleKey || 'Swift Dzire',
    tripType: body.tripType || 'Round Trip',
    estimatedKmOneWay: Number(body.estimatedKmOneWay) || 150,
    notes: body.notes || ''
  };

  // AI Extraction if requested
  if (mode === 'ai' && (rawText || audioBase64)) {
    if (apiKey) {
      try {
        const systemPrompt = `You are the lead travel dispatcher for Kalidass Travels, Chennai.
Analyze the customer's text message or spoken call recording.
Extract the trip details accurately into JSON.

Rules:
1. customerName: Name if mentioned (e.g. Hari, Suresh), else "Guest"
2. customerPhone: 10-digit Indian phone number if present in text, else ""
3. pickup: Pickup city/locality (default: "Chennai")
4. destination: Main destination or tour route (e.g. "Puducherry / Pondy")
5. travelDates: e.g. "21st Nov 8:00 AM to 22nd Nov 8:00 PM"
6. days: Total calendar days the vehicle is needed (e.g. 21st to 22nd Nov is 2 days). Minimum is 1.
7. paxCount: Number of passengers / members traveling (e.g. "7 members" -> 7, "2 people" -> 2). Default 4.
8. vehicleKey: Choose the best vehicle for the passenger count:
   - If paxCount >= 7: "Innova" or "Innova Crysta" or "Tempo Traveller"
   - If paxCount 5 or 6: "Maruti Ertiga" or "Innova"
   - If paxCount <= 4: "Swift Dzire"
9. tripType: "Round Trip", "One Way Drop", or "Local Package"
10. estimatedKmOneWay: Approximate one-way distance in km from Chennai (Pondicherry is 151, Pichavaram is 225, Tirupati is 135, Bangalore is 346, Kumbakonam is 298).
11. notes: Any special notes.

Return ONLY raw JSON matching this schema, no markdown code fence, no commentary:
{
  "customerName": "Hari",
  "customerPhone": "...",
  "pickup": "Chennai",
  "destination": "Pondicherry",
  "travelDates": "21 Nov to 22 Nov",
  "days": 2,
  "paxCount": 7,
  "vehicleKey": "Innova",
  "tripType": "Round Trip",
  "estimatedKmOneWay": 151,
  "notes": "..."
}`;

        const parts: any[] = [];
        if (rawText) {
          parts.push({ text: `Customer Message / Enquiry:\n${rawText}` });
        }
        if (audioBase64) {
          parts.push({
            inlineData: {
              mimeType: audioMimeType,
              data: audioBase64
            }
          });
          parts.push({ text: 'Please transcribe the spoken audio (Tamil/English) and extract the trip parameters.' });
        }

        const geminiModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-pro-latest'];
        for (const model of geminiModels) {
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
              })
            });

            if (res.ok) {
              const data = await res.json();
              const textPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text && !p.thought)?.text || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              const jsonMatch = textPart.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const pax = Number(parsed.paxCount) || 4;
                let autoVehicle = parsed.vehicleKey;
                if (!autoVehicle || autoVehicle === 'Swift Dzire') {
                  if (pax >= 7) autoVehicle = 'Innova';
                  else if (pax >= 5) autoVehicle = 'Maruti Ertiga';
                }
                extracted = {
                  ...extracted,
                  ...parsed,
                  paxCount: pax,
                  vehicleKey: autoVehicle || extracted.vehicleKey,
                  days: Math.max(1, Number(parsed.days) || 1),
                  estimatedKmOneWay: Number(parsed.estimatedKmOneWay) || extracted.estimatedKmOneWay
                };
                break;
              }
            }
          } catch (_) {}
        }
      } catch (_) {}
    }
  }

  // Auto-detect distance if not provided or 0
  if (!extracted.estimatedKmOneWay || extracted.estimatedKmOneWay === 0) {
    const lowerDest = String(extracted.destination || '').toLowerCase();
    for (const [place, km] of Object.entries(KNOWN_ONE_WAY_KM)) {
      if (lowerDest.includes(place)) {
        extracted.estimatedKmOneWay = km;
        break;
      }
    }
    if (!extracted.estimatedKmOneWay) extracted.estimatedKmOneWay = 150;
  }

  // Tariff calculation & Zero-Loss Margin Guard
  const tariff = loadTariffConfig();
  const days = Math.max(1, Number(extracted.days) || 1);
  const isRoundTrip = extracted.tripType === 'Round Trip';
  const baseDistanceKm = isRoundTrip ? extracted.estimatedKmOneWay * 2 : extracted.estimatedKmOneWay;
  const localSightseeingBufferKm = isRoundTrip && days > 1 ? (days - 1) * 40 : 20;
  const actualTotalEstimatedRunKm = baseDistanceKm + localSightseeingBufferKm;

  // Helper to calculate single vehicle fare
  const calcFareForVehicle = (vKey: string) => {
    const vConf = (tariff.vehicles as any)[vKey] || (tariff.vehicles as any)['Swift Dzire'];
    const minKm = days * (vConf.min_km_per_day || 250);
    const billable = Math.max(minKm, actualTotalEstimatedRunKm);
    const rate = extracted.tripType === 'One Way Drop' ? vConf.one_way_rate : vConf.round_trip_rate;
    const bataTotal = days * (vConf.driver_bata || 400);
    const carHire = billable * rate;
    const total = carHire + bataTotal;
    return { vConf, minKm, billable, rate, bataTotal, carHire, total, dailyBata: vConf.driver_bata || 400 };
  };

  const primaryCalc = calcFareForVehicle(extracted.vehicleKey);
  const billableKm = primaryCalc.billable;
  const ratePerKm = primaryCalc.rate;
  const carAndFuelCharge = primaryCalc.carHire;
  const dailyBata = primaryCalc.dailyBata;
  const driverBataTotal = primaryCalc.bataTotal;
  const totalQuoteFare = primaryCalc.total;

  // Internal Cost & Zero-Loss Calculation (Internal Operator Eyes Only)
  const mileage = VEHICLE_MILEAGE[extracted.vehicleKey] || 15.0;
  const estimatedLitres = actualTotalEstimatedRunKm / mileage;
  const realFuelCost = Math.round(estimatedLitres * DIESEL_PRICE_PER_LITRE);
  const realDriverPayout = driverBataTotal;
  const hardOutOfPocketCost = realFuelCost + realDriverPayout;
  const netOwnerProfit = totalQuoteFare - hardOutOfPocketCost;
  const profitMarginPercent = Math.round((netOwnerProfit / totalQuoteFare) * 100);
  const isSafe = netOwnerProfit >= (days * 1200);

  // Road toll estimates based on route
  let estimatedTollsText = 'approx ₹600 - ₹700 via Fastag actuals';
  let tollsAmount = 700;
  const destLower = String(extracted.destination).toLowerCase();
  if (destLower.includes('tirupati')) {
    estimatedTollsText = 'approx ₹400 Fastag + ₹500 AP Permit';
    tollsAmount = 900;
  } else if (destLower.includes('bangalore') || destLower.includes('bengaluru')) {
    estimatedTollsText = 'approx ₹450 Fastag + ₹700 KA Permit';
    tollsAmount = 1150;
  } else if (destLower.includes('pondicherry') || destLower.includes('puducherry') || destLower.includes('pondi')) {
    estimatedTollsText = 'approx ₹200 Fastag + approx ₹500 Puducherry Permit (at actuals)';
    tollsAmount = 700;
  }

  // Determine appropriate multi-options based on passenger count
  let optionKeys = ['Swift Dzire', 'Maruti Ertiga', 'Innova'];
  if (extracted.paxCount >= 7) {
    optionKeys = ['Innova', 'Innova Crysta', 'Tempo Traveller'];
  } else if (extracted.paxCount >= 5) {
    optionKeys = ['Maruti Ertiga', 'Innova', 'Innova Crysta'];
  }

  const multiVehicleLines = optionKeys.map((key, idx) => {
    const c = calcFareForVehicle(key);
    let tag = '';
    let label = key;
    if (key === 'Swift Dzire') label = 'SWIFT DZIRE (Sedan AC)';
    else if (key === 'Maruti Ertiga') label = 'MARUTI ERTIGA (6+1 Seater AC)';
    else if (key === 'Innova') {
      label = 'TOYOTA INNOVA (7+1 Seater AC)';
      tag = extracted.paxCount >= 7 ? '\n*(Best value for 7 members with soft luggage)*' : '';
    } else if (key === 'Innova Crysta') {
      label = 'INNOVA CRYSTA (7+1 Seater AC)';
      tag = '\n*(Superior comfort & smooth highway ride)*';
    } else if (key === 'Tempo Traveller') {
      label = 'TEMPO TRAVELLER (12-Seater AC)';
      tag = '\n*(Pushback bucket seats, high roof, ample space for 7+ pax & large luggage)*';
    }
    const numEmoji = idx === 0 ? '1️⃣' : idx === 1 ? '2️⃣' : '3️⃣';
    return `${numEmoji} ${label}
• ${c.billable.toLocaleString('en-IN')} km @ ₹${c.rate}/km : ₹${c.carHire.toLocaleString('en-IN')}
• Driver Allowance (${days} Days @ ₹${c.dailyBata}) : ₹${c.bataTotal.toLocaleString('en-IN')}
👉 TOTAL ESTIMATE : ₹${c.total.toLocaleString('en-IN')}${tag}`;
  }).join('\n\n');

  // Customer Name greeting
  const custGreeting = extracted.customerName && extracted.customerName !== 'Guest' ? `${extracted.customerName} sir` : 'Sir/Madam';

  // Multi-Option High-Converting WhatsApp Bill
  const whatsappMultiBill = `Hello ${custGreeting}, greetings from Kalidass Travels! 🙏

Here is the customized fare quotation for your ${days}-Day ${extracted.destination} trip:

📋 TRIP DETAILS:
• Pickup: ${extracted.pickup}
• Destination: ${extracted.destination} (${extracted.tripType})
• Dates: ${extracted.travelDates} (${days} ${days === 1 ? 'Day' : 'Days'})
• Passengers: ${extracted.paxCount} Members
• Package Allowance: ${billableKm.toLocaleString('en-IN')} km included (Covers round trip + local sightseeing)

------------------------------------------
VEHICLE FARE OPTIONS (${days} ${days === 1 ? 'DAY' : 'DAYS'})
------------------------------------------

${multiVehicleLines}

------------------------------------------
WHAT IS INCLUDED:
------------------------------------------
✅ Dedicated AC vehicle for all ${days} ${days === 1 ? 'day' : 'days'} (Doorstep pickup to drop)
✅ Fuel charges up to package km (${billableKm.toLocaleString('en-IN')} km run)
✅ Driver allowance for all ${days} ${days === 1 ? 'day' : 'days'}
✅ Local sightseeing along the route

EXTRA CHARGES (Actuals):
• Highway Tolls & Parking (${estimatedTollsText})
• Driver night stay: ₹350 (only if accommodation is not provided by your hotel)
• Extra km beyond package (billed at standard per km vehicle rate)

------------------------------------------
PAYMENT TERMS:
------------------------------------------
1. Booking Advance: ₹500 to confirm & lock your vehicle and chauffeur
   (UPI: 8939539211@okbizaxis - Kalidass Travels)
2. At Trip Start: 50% upon boarding
3. At Trip End: Remaining balance settled at final drop

Please let us know your preferred vehicle choice to confirm your booking! 🚖`;

  // Fallback single-vehicle bill
  const whatsappSingleBill = `KALIDASS TRAVELS - TRIP QUOTATION

Customer: ${extracted.customerName}
Trip: ${extracted.pickup} to ${extracted.destination}
Car: ${extracted.vehicleKey} AC
Dates: ${extracted.travelDates} (${days} ${days === 1 ? 'Day' : 'Days'})
Passengers: ${extracted.paxCount} Members

------------------------------------------
BILL BREAKUP
------------------------------------------
1. Car and Fuel (${billableKm.toLocaleString('en-IN')} km @ ₹${ratePerKm}/km) : ₹${carAndFuelCharge.toLocaleString('en-IN')}
2. Driver Allowance (${days} ${days === 1 ? 'Day' : 'Days'} @ ₹${dailyBata}/day) : ₹${driverBataTotal.toLocaleString('en-IN')}
------------------------------------------
TOTAL ESTIMATE : ₹${totalQuoteFare.toLocaleString('en-IN')}
------------------------------------------

What is included:
- AC ${extracted.vehicleKey} for all ${days} ${days === 1 ? 'day' : 'days'}
- Fuel charges for ${billableKm.toLocaleString('en-IN')} km run
- Driver allowance for all ${days} ${days === 1 ? 'day' : 'days'}

Extra charges (pay on actual bill):
- Highway tolls and parking (${estimatedTollsText})
- Driver night stay (₹350 per night, only if hotel has no driver room)
- Extra run above ${billableKm.toLocaleString('en-IN')} km (₹${ratePerKm} per km)

Payment Terms:
1. Booking Advance: ₹500 to lock vehicle and chauffeur (UPI: 8939539211@okbizaxis)
2. At Trip Start: 50% upon boarding
3. At Trip End: Remaining balance settled at final drop

To book: Please confirm your vehicle choice with Kalidass Travels!`;

  return {
    success: true,
    extracted,
    calculation: {
      days,
      ratePerKm,
      minRunKm: primaryCalc.minKm,
      actualTotalEstimatedRunKm,
      billableKm,
      carAndFuelCharge,
      dailyBata,
      driverBataTotal,
      totalQuoteFare,
      realFuelCost,
      realDriverPayout,
      hardOutOfPocketCost,
      netOwnerProfit,
      profitMarginPercent,
      isSafe,
      estimatedTollsText,
      tollsAmount
    },
    whatsappBill: whatsappMultiBill,
    whatsappSingleBill
  };
}
