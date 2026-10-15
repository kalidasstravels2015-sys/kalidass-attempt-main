import type { APIRoute } from 'astro';

export const prerender = false;

// Pre-compiled distance & package lookup from Chennai
const ROUTE_DISTANCES: Record<string, { oneWayKm: number; name: string; fixedSedan?: number; fixedErtiga?: number; fixedCrysta?: number; fixedTempo?: number }> = {
  'tirupati': { oneWayKm: 135, name: 'Chennai ➔ Tirupati', fixedSedan: 6000, fixedErtiga: 7500, fixedCrysta: 10000, fixedTempo: 12500 },
  'pondicherry': { oneWayKm: 155, name: 'Chennai ➔ Pondicherry', fixedSedan: 4500, fixedErtiga: 5500, fixedCrysta: 7500, fixedTempo: 9500 },
  'pondy': { oneWayKm: 155, name: 'Chennai ➔ Pondicherry', fixedSedan: 4500, fixedErtiga: 5500, fixedCrysta: 7500, fixedTempo: 9500 },
  'madurai': { oneWayKm: 460, name: 'Chennai ➔ Madurai', fixedSedan: 13500, fixedErtiga: 16500, fixedCrysta: 21500, fixedTempo: 26000 },
  'bangalore': { oneWayKm: 345, name: 'Chennai ➔ Bangalore' },
  'bengaluru': { oneWayKm: 345, name: 'Chennai ➔ Bangalore' },
  'velankanni': { oneWayKm: 310, name: 'Chennai ➔ Velankanni' },
  'thiruvannamalai': { oneWayKm: 195, name: 'Chennai ➔ Thiruvannamalai', fixedSedan: 5200, fixedErtiga: 6500, fixedCrysta: 8500, fixedTempo: 10500 },
  'tiruvannamalai': { oneWayKm: 195, name: 'Chennai ➔ Thiruvannamalai', fixedSedan: 5200, fixedErtiga: 6500, fixedCrysta: 8500, fixedTempo: 10500 },
  'kanchipuram': { oneWayKm: 75, name: 'Chennai ➔ Kanchipuram', fixedSedan: 3200, fixedErtiga: 4200, fixedCrysta: 5500, fixedTempo: 7000 },
  'vellore': { oneWayKm: 140, name: 'Chennai ➔ Vellore (Golden Temple)', fixedSedan: 4400, fixedErtiga: 5400, fixedCrysta: 7200, fixedTempo: 9000 },
  'kumbakonam': { oneWayKm: 290, name: 'Chennai ➔ Kumbakonam (Navagraha)' },
  'rameswaram': { oneWayKm: 560, name: 'Chennai ➔ Rameswaram' },
  'coimbatore': { oneWayKm: 510, name: 'Chennai ➔ Coimbatore' },
  'trichy': { oneWayKm: 330, name: 'Chennai ➔ Trichy' },
  'ooty': { oneWayKm: 540, name: 'Chennai ➔ Ooty' },
  'kodaikanal': { oneWayKm: 520, name: 'Chennai ➔ Kodaikanal' },
  'airport': { oneWayKm: 25, name: 'Chennai Airport Transfer', fixedSedan: 750, fixedErtiga: 1200, fixedCrysta: 1800, fixedTempo: 2500 }
};

interface ParsedResult {
  guestName: string;
  phone: string;
  pickup: string;
  drop: string;
  travelDate: string;
  pickupTime: string;
  vehicleCategory: string;
  partySize: string;
  tripType: string;
  distanceKm: number;
  estimatedFare: number;
  chauffeurPayout: number;
  companyMargin: number;
  advanceSuggested: number;
  whatsAppQuote: string;
  confidence: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const rawText = String(body.text || '').trim();

    if (!rawText) {
      return new Response(JSON.stringify({ error: 'No text provided to parse' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const lower = rawText.toLowerCase();

    // 1. Extract Phone Number (10 digits, optionally with +91 or 0)
    let phone = '';
    const phoneMatch = rawText.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
    if (phoneMatch) {
      phone = phoneMatch[0].replace(/[\s\-]/g, '');
      if (!phone.startsWith('+91')) {
        phone = phone.startsWith('91') && phone.length === 12 ? `+${phone}` : `+91 ${phone.slice(-10)}`;
      }
    }

    // 2. Extract Guest Name (e.g., "from Rajesh", "name: Kumar", "Hi I am Suresh", or first capital word)
    let guestName = 'Guest';
    const namePatterns = [
      /(?:name\s*[:=\-]\s*|i am\s+|this is\s+|mr\.?\s+|mrs\.?\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /(?:from\s+)([A-Z][a-z]+)/
    ];
    for (const pat of namePatterns) {
      const match = rawText.match(pat);
      if (match && match[1]) {
        guestName = match[1].trim();
        break;
      }
    }

    // 3. Extract Vehicle Type
    let vehicleCategory = 'Sedan (Dzire / Etios)';
    if (/crysta|innova crysta/i.test(lower)) {
      vehicleCategory = 'Innova Crysta';
    } else if (/innova/i.test(lower)) {
      vehicleCategory = 'Toyota Innova';
    } else if (/ertiga|maruti ertiga|xl6/i.test(lower)) {
      vehicleCategory = 'Ertiga (6 Pax)';
    } else if (/tempo|traveller|12 seater|14 seater|16 seater|bus/i.test(lower)) {
      vehicleCategory = 'Tempo Traveller';
    } else if (/sedan|dzire|etios|car/i.test(lower)) {
      vehicleCategory = 'Sedan (Dzire / Etios)';
    }

    // 4. Extract Passenger Count
    let partySize = '4 Pax';
    const paxMatch = rawText.match(/(\d+)\s*(?:pax|people|persons?|passengers?|members?|adults?)/i);
    if (paxMatch) {
      const num = parseInt(paxMatch[1], 10);
      partySize = `${num} Pax`;
      // Auto-escalate vehicle if passenger count exceeds capacity
      if (num > 4 && vehicleCategory.startsWith('Sedan')) {
        vehicleCategory = num <= 6 ? 'Ertiga (6 Pax)' : 'Innova Crysta';
      }
      if (num > 7) {
        vehicleCategory = 'Tempo Traveller';
      }
    }

    // 5. Extract Date
    let travelDate = 'Tomorrow';
    const today = new Date();
    if (/today/i.test(lower)) {
      travelDate = 'Today';
    } else if (/day after tomorrow|day after/i.test(lower)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 2);
      travelDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } else if (/tomorrow/i.test(lower)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      travelDate = `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} (Tomorrow)`;
    } else {
      // Look for dates like 19-Oct, Oct 19, 19/10, etc.
      const dateMatch = rawText.match(/(\d{1,2}(?:st|nd|rd|th)?[\s\/\-\.](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2})(?:[\s\/\-\.]\d{2,4})?)/i);
      if (dateMatch) {
        travelDate = dateMatch[1];
      }
    }

    // 6. Extract Time
    let pickupTime = '05:00 AM';
    const timeMatch = rawText.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs|hours?))/i);
    if (timeMatch) {
      pickupTime = timeMatch[1].toUpperCase();
    } else {
      const rawHourMatch = rawText.match(/(?:at|around|morning|night|evening)\s*(\d{1,2})(?!\d)/i);
      if (rawHourMatch) {
        const hr = parseInt(rawHourMatch[1], 10);
        pickupTime = hr < 12 ? `${hr}:00 AM` : `${hr}:00 PM`;
      }
    }

    // 7. Extract Destination & Origin
    let pickup = 'Chennai (Medavakkam / City)';
    let drop = 'Tirupati';
    let matchedRouteKey = 'tirupati';

    // Scan for destinations
    for (const key of Object.keys(ROUTE_DISTANCES)) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(lower)) {
        matchedRouteKey = key;
        drop = ROUTE_DISTANCES[key].name.replace('Chennai ➔ ', '');
        break;
      }
    }

    // Scan for specific pickup localities in Chennai
    const chennaiAreas = ['medavakkam', 'velachery', 't nagar', 't. nagar', 'anna nagar', 'adyar', 'tambaram', 'omr', 'sholinganallur', 'porur', 'guindy', 'mylapore', 'thoraipakkam', 'perungudi', 'chromepet', 'airport'];
    for (const area of chennaiAreas) {
      if (lower.includes(area)) {
        pickup = area.charAt(0).toUpperCase() + area.slice(1) + ', Chennai';
        break;
      }
    }

    // 8. Trip Type
    let tripType = 'Round Trip';
    if (/one way|drop only|drop\b/i.test(lower) && !/round\s*trip/i.test(lower)) {
      tripType = 'One-Way Drop';
    } else if (/airport/i.test(lower) || matchedRouteKey === 'airport') {
      tripType = 'Airport Transfer';
    }

    // 9. Calculate Distance & Estimated Fare
    const routeInfo = ROUTE_DISTANCES[matchedRouteKey] || { oneWayKm: 150, name: `Chennai ➔ ${drop}` };
    const isRound = tripType === 'Round Trip';
    const distanceKm = isRound ? Math.max(250, routeInfo.oneWayKm * 2) : Math.max(130, routeInfo.oneWayKm);

    let estimatedFare = 6000;

    // Check fixed package pricing first
    if (isRound && routeInfo.fixedSedan) {
      if (vehicleCategory.startsWith('Sedan')) estimatedFare = routeInfo.fixedSedan;
      else if (vehicleCategory.includes('Ertiga')) estimatedFare = routeInfo.fixedErtiga || Math.round(routeInfo.fixedSedan * 1.25);
      else if (vehicleCategory.includes('Crysta')) estimatedFare = routeInfo.fixedCrysta || Math.round(routeInfo.fixedSedan * 1.6);
      else if (vehicleCategory.includes('Tempo')) estimatedFare = routeInfo.fixedTempo || Math.round(routeInfo.fixedSedan * 2.0);
      else estimatedFare = Math.round(routeInfo.fixedSedan * 1.4);
    } else {
      // Dynamic calculation
      let perKm = 14;
      let bata = 400;
      if (vehicleCategory.includes('Ertiga')) { perKm = 17; bata = 500; }
      else if (vehicleCategory.includes('Crysta')) { perKm = 22; bata = 700; }
      else if (vehicleCategory.includes('Innova')) { perKm = 20; bata = 600; }
      else if (vehicleCategory.includes('Tempo')) { perKm = 26; bata = 800; }

      estimatedFare = (distanceKm * perKm) + (isRound ? bata : 0);
      // Round to nearest 50
      estimatedFare = Math.round(estimatedFare / 50) * 50;
    }

    // Chauffeur payout (typically 80% of fare)
    const chauffeurPayout = Math.round((estimatedFare * 0.8) / 50) * 50;
    const companyMargin = estimatedFare - chauffeurPayout;
    const advanceSuggested = 500;

    // 10. Generate WhatsApp Click-Ready Quote
    const whatsAppQuote = `*KALIDASS TRAVELS CHENNAI — TRIP QUOTATION*\n\n` +
      `Hello ${guestName} ji, thank you for contacting Kalidass Travels!\n\n` +
      `📍 *Route:* ${pickup} ➔ ${drop} (${tripType})\n` +
      `🗓 *Date & Time:* ${travelDate} @ ${pickupTime}\n` +
      `🚗 *Vehicle:* ${vehicleCategory} (${partySize})\n` +
      `📏 *Est. Distance:* ~${distanceKm} km\n` +
      `💰 *Estimated All-Inclusive Fare:* Rs.${estimatedFare.toLocaleString('en-IN')}\n` +
      `_(Includes Car, Chauffeur Bata & Fuel. Tolls & Parking as per actuals)_\n\n` +
      `🔒 *To Confirm Your Booking:* Kindly pay a token advance of *Rs.${advanceSuggested}* via UPI to *8939539211@okbizaxis* (Kalidass Travels) to lock your vehicle.\n\n` +
      `Chauffeur and car details will be sent 4 hours prior to departure.\n` +
      `Have a safe journey! 🌟`;

    const result: ParsedResult = {
      guestName,
      phone,
      pickup,
      drop,
      travelDate,
      pickupTime,
      vehicleCategory,
      partySize,
      tripType,
      distanceKm,
      estimatedFare,
      chauffeurPayout,
      companyMargin,
      advanceSuggested,
      whatsAppQuote,
      confidence: 0.95
    };

    return new Response(JSON.stringify({ success: true, parsed: result }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'AI Parse failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
};
