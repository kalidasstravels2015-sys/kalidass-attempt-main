import type { APIRoute } from 'astro';

export const prerender = false;

let aiParseSeq = 101;

export const POST: APIRoute = async ({ request }) => {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (_) {
      try {
        const text = await request.text();
        body = JSON.parse(text);
      } catch (e) {}
    }

    const rawText = String(body.text || '').trim();
    const phoneInput = String(body.phone || '').trim();
    const guestNameInput = String(body.guestName || '').trim();

    if (!rawText && !phoneInput) {
      return new Response(JSON.stringify({ error: 'No text or phone provided to parse' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const lower = rawText.toLowerCase();

    // 1. Phone Extraction
    let phone = phoneInput.replace(/[^0-9]/g, '');
    if (phone.length >= 10) {
      phone = phone.startsWith('91') && phone.length === 12 ? `+${phone}` : `+91 ${phone.slice(-10)}`;
    } else {
      const phoneMatch = rawText.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
      if (phoneMatch) {
        const clean = phoneMatch[0].replace(/[\s\-]/g, '');
        phone = clean.startsWith('+91') ? clean : (clean.startsWith('91') && clean.length === 12 ? `+${clean}` : `+91 ${clean.slice(-10)}`);
      } else {
        phone = phoneInput ? phoneInput.trim() : '';
      }
    }

    // 2. Quote Ref Extraction
    let quoteRefId = '';
    const quoteRefMatch = rawText.match(/(?:Quote Ref:?\s*\*?)(#[A-Za-z0-9\-]+)/i);
    if (quoteRefMatch) {
      quoteRefId = quoteRefMatch[1].trim();
    } else {
      const altQuoteMatch = rawText.match(/\((#[A-Za-z0-9\-]+)\)/);
      if (altQuoteMatch) {
        quoteRefId = altQuoteMatch[1].trim();
      } else {
        quoteRefId = `#ENQ-${aiParseSeq++}`;
      }
    }

    // 3. Service Type Detection
    let serviceCategory = 'Cab Booking';
    if (/acting driver/i.test(lower)) {
      serviceCategory = 'Acting Driver';
    } else if (/airport/i.test(lower)) {
      serviceCategory = 'Airport Taxi';
    } else if (/temple|darshan|tour/i.test(lower)) {
      serviceCategory = 'Temple Tour';
    } else if (/outstation/i.test(lower)) {
      serviceCategory = 'Outstation Cab';
    }

    // 4. Trip Type Extraction
    let tripType = 'Round Trip';
    const tripMatch = rawText.match(/(?:Trip|Transfer Type):\s*\*?([^\n\r•]+)/i);
    if (tripMatch) {
      tripType = tripMatch[1].trim().replace(/\*+/g, '');
    } else if (/one[\s\-]?way|drop only/i.test(lower)) {
      tripType = 'One Way Drop';
    } else if (/airport pickup/i.test(lower)) {
      tripType = 'Airport Pickup';
    } else if (/airport drop/i.test(lower)) {
      tripType = 'Airport Drop';
    } else if (/local package|local sightseeing/i.test(lower)) {
      tripType = 'Local Package';
    }

    // 5. Route Extraction (Pickup -> Drop)
    let pickup = 'Chennai';
    let drop = 'Outstation';
    let distanceKm = 0;

    const routeMatch = rawText.match(/Route:\s*\*?([^\n\r]+?)\s*(?:->|➔|to)\s*([^\n\r]+?)(?:\s*\((?:~)?(\d+)\s*km\))?$/im);
    if (routeMatch) {
      pickup = routeMatch[1].trim().replace(/^[-•*]\s*/, '').replace(/\*+/g, '');
      drop = routeMatch[2].trim().replace(/\*+/g, '');
      if (routeMatch[3]) distanceKm = parseInt(routeMatch[3], 10);
    } else {
      const fromMatch = rawText.match(/(?:From|Pickup):\s*\*?([^\n\r]+)/i);
      const toMatch = rawText.match(/(?:To|Drop):\s*\*?([^\n\r]+)/i);
      if (fromMatch) pickup = fromMatch[1].trim().replace(/^[-•*]\s*/, '').replace(/\*+/g, '');
      if (toMatch) drop = toMatch[1].trim().replace(/^[-•*]\s*/, '').replace(/\*+/g, '');

      const distMatch = rawText.match(/(?:Distance|Est\.?\s*Distance):\s*\*?~?(\d+)\s*km/i);
      if (distMatch) distanceKm = parseInt(distMatch[1], 10);
    }

    // 6. Fare Extraction
    let estimatedFare = 0;
    const farePatterns = [
      /(?:Est\.?\s*Total|Total Fare|Quoted Fare|Quoted Package Fare|Package Fare|Total):\s*\*?₹?\s*\*?([\d,]+)/i,
      /(?:Fare|Rate|Amount|Cost):\s*\*?₹?\s*\*?([\d,]+)/i
    ];
    for (const pat of farePatterns) {
      const fm = rawText.match(pat);
      if (fm && fm[1]) {
        estimatedFare = parseInt(fm[1].replace(/,/g, ''), 10);
        break;
      }
    }

    // 7. Schedule (Date & Time) Extraction
    let travelDate = 'Tomorrow';
    let pickupTime = '05:00 AM';
    const schedMatch = rawText.match(/(?:Travel Date & Time|Pickup Date & Time|Pickup Schedule|Pickup Date|Travel Date):\s*\*?([^\n\r]+)/i);
    if (schedMatch) {
      let rawSched = schedMatch[1].trim().replace(/^[-•*]\s*/, '').replace(/\*+/g, '');
      if (rawSched.includes('@')) {
        const parts = rawSched.split('@');
        travelDate = parts[0].trim();
        pickupTime = parts[1].trim();
      } else if (rawSched.includes(' ')) {
        const tm = rawSched.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i);
        if (tm) {
          pickupTime = tm[1].toUpperCase();
          travelDate = rawSched.replace(tm[0], '').trim();
        } else {
          travelDate = rawSched;
        }
      } else {
        travelDate = rawSched;
      }
    }

    // 8. Vehicle & Gear Extraction
    let vehicleCategory = 'Sedan (Dzire / Etios)';
    const vehMatch = rawText.match(/(?:Vehicle Type|Vehicle|Selected Vehicle):\s*\*?([^\n\r]+)/i);
    if (vehMatch) {
      vehicleCategory = vehMatch[1].trim().replace(/\*+/g, '');
    } else if (/crysta/i.test(lower)) {
      vehicleCategory = 'Innova Crysta';
    } else if (/innova/i.test(lower)) {
      vehicleCategory = 'Toyota Innova';
    } else if (/ertiga|xl6/i.test(lower)) {
      vehicleCategory = 'Ertiga (6 Pax)';
    } else if (/tempo|traveller/i.test(lower)) {
      vehicleCategory = 'Tempo Traveller';
    } else if (/compact suv|suv/i.test(lower)) {
      vehicleCategory = 'Compact SUV / MPV';
    }

    const gearMatch = rawText.match(/(?:Transmission \/ Gear|Transmission|Gear):\s*\*?([^\n\r]+)/i);
    if (gearMatch) {
      vehicleCategory += ` (${gearMatch[1].trim().replace(/\*+/g, '')})`;
    }

    // 9. Party Size
    let partySize = '4 Pax';
    const paxMatch = rawText.match(/(\d+)\s*(?:pax|people|persons?|passengers?|members?)/i);
    if (paxMatch) {
      partySize = `${paxMatch[1]} Pax`;
    } else if (serviceCategory === 'Acting Driver') {
      partySize = 'Car Owner Vehicle';
    }

    // 10. Guest Name
    let guestName = guestNameInput.trim() || 'Guest';
    if (guestName === 'Guest') {
      const nameMatch = rawText.match(/(?:Name|Guest|Customer):\s*([^\n\r]+)/i);
      if (nameMatch) {
        guestName = nameMatch[1].trim();
      } else if (phone) {
        guestName = `Customer (${phone.slice(-4)})`;
      }
    }

    // 11. Financial Calculations
    let chauffeurPayout = 0;
    let companyMargin = 0;
    let advanceSuggested = 500;

    if (estimatedFare > 0) {
      if (serviceCategory === 'Acting Driver') {
        chauffeurPayout = Math.round((estimatedFare * 0.82) / 50) * 50;
        companyMargin = estimatedFare - chauffeurPayout;
        advanceSuggested = 500;
      } else {
        chauffeurPayout = Math.round((estimatedFare * 0.80) / 50) * 50;
        companyMargin = estimatedFare - chauffeurPayout;
        advanceSuggested = 500;
      }
    } else {
      estimatedFare = 6000;
      chauffeurPayout = 4900;
      companyMargin = 1100;
    }

    // 12. Pre-formatted WhatsApp Confirmation Reply
    const whatsAppReply =
      `Namaskaram ${guestName} ji! 🙏 Thank you for contacting Kalidass Travels.\n\n` +
      `📌 *Quote Ref:* ${quoteRefId} (24-Hr Rate Lock)\n` +
      `🚗 *Service:* ${serviceCategory}\n` +
      `📍 *Route:* ${pickup} ➔ ${drop}\n` +
      `🗓 *Schedule:* ${travelDate} @ ${pickupTime}\n` +
      `🚙 *Vehicle:* ${vehicleCategory}\n` +
      `💰 *Fare:* Rs.${estimatedFare.toLocaleString('en-IN')}\n\n` +
      `✅ Availability confirmed.\n🔒 To confirm booking & lock cab, kindly pay *Rs.500 Advance* (100% deducted from bill) via UPI to *8939539211@okbizaxis* (Kalidass Travels) and share receipt. Pay remaining balance directly to chauffeur after trip completion.`;

    const parsed = {
      quoteRefId,
      guestName,
      phone,
      serviceCategory,
      tripType,
      pickup,
      drop,
      distanceKm,
      estimatedFare,
      chauffeurPayout,
      companyMargin,
      advanceSuggested,
      travelDate,
      pickupTime,
      vehicleCategory,
      partySize,
      whatsAppQuote: whatsAppReply
    };

    return new Response(JSON.stringify({ success: true, parsed }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'AI Parse failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
};
