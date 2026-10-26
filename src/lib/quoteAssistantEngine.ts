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
      'Swift Dzire': { round_trip_rate: 14, one_way_rate: 15, driver_bata: 400, min_km_per_day: 250 },
      'Toyota Etios': { round_trip_rate: 14, one_way_rate: 15, driver_bata: 400, min_km_per_day: 250 },
      'Maruti Ertiga': { round_trip_rate: 18, one_way_rate: 19, driver_bata: 500, min_km_per_day: 250 },
      'Innova': { round_trip_rate: 20, one_way_rate: 22, driver_bata: 600, min_km_per_day: 300 },
      'Innova Crysta': { round_trip_rate: 24, one_way_rate: 26, driver_bata: 700, min_km_per_day: 300 },
      'Tempo Traveller': { round_trip_rate: 26, one_way_rate: 28, driver_bata: 800, min_km_per_day: 300 }
    }
  };
}

export async function processQuoteAssistant(body: any) {
  const mode = body.mode || 'ai'; // 'ai' | 'calc'
  const rawText = String(body.text || '').trim();
  const audioBase64 = body.audioBase64 || null;
  const audioMimeType = body.audioMimeType || 'audio/mp3';
  const apiKey = getApiKey();

  let extracted = {
    customerName: body.customerName || 'Guest',
    customerPhone: body.customerPhone || '',
    pickup: body.pickup || 'Chennai Airport',
    destination: body.destination || 'Puducherry',
    travelDates: body.travelDates || 'Upcoming',
    days: Number(body.days) || 1,
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
1. customerName: Name if mentioned, else "Guest"
2. customerPhone: 10-digit Indian phone number if mentioned, else ""
3. pickup: Pickup location/city (default: "Chennai Airport" if airport mentioned, else "Chennai")
4. destination: Main destination or tour route (e.g. "Puducherry & Pichavaram")
5. travelDates: e.g. "26 Nov to 29 Nov"
6. days: Total calendar days the vehicle is needed (e.g. 26 to 29 Nov is 4 days). Minimum is 1.
7. vehicleKey: Must be one of:
   - "Swift Dzire" (for sedan, dzire, etios, aura)
   - "Toyota Etios"
   - "Maruti Ertiga" (for ertiga, 6 seater, 7 seater)
   - "Innova"
   - "Innova Crysta"
   - "Tempo Traveller" (for tempo, van, 12 seater, 17 seater)
8. tripType: "Round Trip", "One Way Drop", or "Local Package"
9. estimatedKmOneWay: Approximate one-way distance in km from Chennai (e.g. Pondicherry is 151, Pichavaram is 225, Tirupati is 135, Bangalore is 346).
10. notes: Any special notes like flight timings, pickup time, luggage, etc.

Return ONLY raw JSON matching this schema, no markdown code fence, no commentary:
{
  "customerName": "...",
  "customerPhone": "...",
  "pickup": "...",
  "destination": "...",
  "travelDates": "...",
  "days": 4,
  "vehicleKey": "Swift Dzire",
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

        const geminiModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
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
                extracted = {
                  ...extracted,
                  ...parsed,
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
  const vConfig = (tariff.vehicles as any)[extracted.vehicleKey] || (tariff.vehicles as any)['Swift Dzire'];
  const days = Math.max(1, Number(extracted.days) || 1);
  const minKmPerDay = vConfig.min_km_per_day || 250;
  const minRunKm = days * minKmPerDay;
  const ratePerKm = extracted.tripType === 'One Way Drop' ? vConfig.one_way_rate : vConfig.round_trip_rate;
  const dailyBata = vConfig.driver_bata || 400;

  // Actual travel estimation
  const isRoundTrip = extracted.tripType === 'Round Trip';
  const baseDistanceKm = isRoundTrip ? extracted.estimatedKmOneWay * 2 : extracted.estimatedKmOneWay;
  const localSightseeingBufferKm = isRoundTrip && days > 1 ? (days - 1) * 40 : 20;
  const actualTotalEstimatedRunKm = baseDistanceKm + localSightseeingBufferKm;

  // Billable KM
  const billableKm = Math.max(minRunKm, actualTotalEstimatedRunKm);
  const carAndFuelCharge = billableKm * ratePerKm;
  const driverBataTotal = days * dailyBata;
  const totalQuoteFare = carAndFuelCharge + driverBataTotal;

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
  let estimatedTollsText = 'approx Rs 700 total';
  let tollsAmount = 700;
  const destLower = String(extracted.destination).toLowerCase();
  if (destLower.includes('tirupati')) {
    estimatedTollsText = 'approx Rs 400 + Rs 500 AP Permit';
    tollsAmount = 900;
  } else if (destLower.includes('bangalore') || destLower.includes('bengaluru')) {
    estimatedTollsText = 'approx Rs 450 + Rs 700 KA Permit';
    tollsAmount = 1150;
  } else if (destLower.includes('pondicherry') || destLower.includes('puducherry')) {
    estimatedTollsText = 'approx Rs 700 total';
    tollsAmount = 700;
  }

  // Restaurant-Bill Style WhatsApp Quote (No Icons, 4th Grade English)
  const whatsappBill = `KALIDASS TRAVELS - TRIP QUOTATION

Customer: ${extracted.customerName}
Trip: ${extracted.pickup} to ${extracted.destination}
Car: ${extracted.vehicleKey} AC
Dates: ${extracted.travelDates} (${days} ${days === 1 ? 'Day' : 'Days'})

------------------------------------------
BILL BREAKUP
------------------------------------------
1. Car and Fuel (${billableKm.toLocaleString('en-IN')} km @ Rs ${ratePerKm}/km) : Rs ${carAndFuelCharge.toLocaleString('en-IN')}
2. Driver Allowance (${days} ${days === 1 ? 'Day' : 'Days'} @ Rs ${dailyBata}/day) : Rs ${driverBataTotal.toLocaleString('en-IN')}
------------------------------------------
TOTAL ESTIMATE : Rs ${totalQuoteFare.toLocaleString('en-IN')}
------------------------------------------

What is included:
- AC ${extracted.vehicleKey} for all ${days} ${days === 1 ? 'day' : 'days'}
- Complete fuel for ${billableKm.toLocaleString('en-IN')} km run
- Driver allowance for all ${days} ${days === 1 ? 'day' : 'days'}

Extra charges (pay on actual bill):
- Highway tolls and parking (${estimatedTollsText})
- Driver night stay (approx Rs 350 per night, only if your hotel has no free driver stay)
- Extra run above ${billableKm.toLocaleString('en-IN')} km (Rs ${ratePerKm} per km)

GST Bill:
- If you need a GST tax invoice, 5% GST bill can be provided.

To book:
- Advance payment is Rs 500. Balance you can pay to the driver during the trip.`;

  return {
    success: true,
    extracted,
    calculation: {
      days,
      ratePerKm,
      minRunKm,
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
    whatsappBill
  };
}
