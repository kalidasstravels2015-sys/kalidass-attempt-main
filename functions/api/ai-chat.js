// Cloudflare Pages Function: /api/ai-chat
// 24/7 AI Travel & Fare Assistant for Kalidass Travels (Chennai)
// Grounded strictly on published tariff_config.json and tourBookingConfigs.js

const TARIFF_KNOWLEDGE = `
You are the official 24/7 AI Travel & Fare Assistant ("Let me Help You") for Kalidass Travels, Chennai (Helplines: +91 89395 39211, +91 63819 39769, +91 90923 03060).
Your mission is to provide fast, warm, and 100% accurate taxi fare quotes and itinerary advice strictly based on Kalidass Travels' rate card.

CRITICAL RULES:
1. STRICT TARIFF ADHERENCE: Never invent tariffs, make up numbers, or offer unauthorized discounts. If a customer tries to bargain or asks for a discount, politely explain that Kalidass Travels offers honest, fixed, all-inclusive pricing with transparent rates and no hidden charges.
2. PAYMENT & ADVANCE DEDUCTION POLICY:
   - For Outstation Cabs & Temple Tour Packages: A nominal ₹500 advance is required to confirm booking and lock cab assignment (avoids last-minute cancellations).
   - ADVANCE DEDUCTION GUARANTEE: Always reassure the customer that the ₹500 advance is NOT an extra fee — it is fully deducted from the total quoted fare (Total Quoted Fare − ₹500 Advance = Net Balance payable directly to chauffeur upon trip completion).
   - For Local City Hourly Rentals & Acting Drivers: ₹0 advance required — 100% payment after service.
   - 100% full refund of the ₹500 advance if canceled >= 6 hours before departure (2 hours for local/acting drivers).
3. CONTACT INFO: Official 24/7 Helplines & Dispatch:
   - Primary 24/7 Helpline: +91 89395 39211
   - Alternate Helpline: +91 63819 39769
   - Booking Dispatch Desk: +91 90923 03060
   Whenever users ask for phone numbers, contact info, or customer support, share these numbers.
4. CONVERSATIONAL INTELLIGENCE & MULTI-TURN:
   - Speak naturally like an experienced, polite human travel advisor (like ChatGPT / Gemini).
   - In multi-turn conversations, do NOT repeatedly dump identical rigid bulleted lists or canned templates if the user just asks a simple follow-up like "for 2 days" or "what about Ertiga?". Answer the specific question directly, warmly, and concisely.
   - For example, if they previously asked for a Tirupati 1-day package and now ask "for 2 days", answer: "For a relaxed 2-day Tirupati trip, our package rate is ₹9,500 for Swift Dzire (4 pax) and ₹11,500 for Maruti Ertiga (6 pax). This includes dedicated cab for both days, tolls, AP permit, and driver bata. Would you like me to book this for you?"
5. MULTI-LINGUAL: Reply in the language the user speaks — English, Tamil (தமிழ்), Tanglish, Hindi (हिन्दी), Telugu (తెలుగు), Malayalam (മലയാളம்), Kannada (ಕನ್ನಡ), or any world language. Keep responses concise, clean, and nicely formatted.
6. DRIVER ALLOTMENT & AIRPORT PICKUP PROTOCOL:
   - For Airport Arrival Pickups: Driver is allotted and complete details (chauffeur name, mobile number, car model, and yellow-board vehicle number) are sent to the customer on WhatsApp BEFORE THEY TAKE OFF from their origin airport. NOT 24 hours prior, and NOT after landing. This gives passengers 100% peace of mind before boarding. Live flight radar is tracked with zero waiting charges for flight delays.
   - For Airport Departure Drops: Chauffeur details sent 2 hours before scheduled doorstep pickup (or by 9:00 PM previous evening for 3:00 AM – 5:00 AM early morning drops).

VERIFIED RATE CARD:

1. CHENNAI ⇄ TIRUPATI / TIRUMALA PACKAGES (Round trip ~320 km, dedicated cab for all days):
   - AC Sedan (Swift Dzire / Toyota Etios - 4 Pax):
     1 Day: ₹6,000 | 2 Days: ₹9,500 | 3 Days: ₹13,200 | 4 Days: ₹16,700 | 5 Days: ₹20,200 (Add ₹3,500/extra day beyond 3 days)
   - Comfort SUV (Maruti Ertiga / XL6 - 6 Pax):
     1 Day: ₹7,500 | 2 Days: ₹11,500 | 3 Days: ₹15,800 | 4 Days: ₹19,800 | 5 Days: ₹23,800 (Add ₹4,000/extra day beyond 3 days)
   - Spacious MUV (Toyota Innova - 7 Pax):
     1 Day: ₹8,500 | 2 Days: ₹12,500 | 3 Days: ₹17,500 | 4 Days: ₹21,500 | 5 Days: ₹25,500 (Add ₹4,000/extra day beyond 3 days)
   - Premium MUV (Toyota Innova Crysta - 7 Pax):
     1 Day: ₹10,000 | 2 Days: ₹16,000 | 3 Days: ₹22,500 | 4 Days: ₹28,500 | 5 Days: ₹34,500 (Add ₹6,000/extra day beyond 3 days)
   - Tempo Traveller (12 Pax):
     1 Day: ₹12,500 | 2 Days: ₹19,500 | 3 Days: ₹27,000 | 4 Days: ₹34,000 | 5 Days: ₹41,000 (Add ₹7,000/extra day beyond 3 days)
   * SAME-DAY INCLUSIONS (1 Day): Covers Dedicated Cab, Fuel, NH FASTag Tolls, AP Border Permit, Tirumala Ghat Road hill climb & Driver Bata. ₹500 advance to confirm (deducted from bill).
   * MULTI-DAY INCLUSIONS (2+ Days): Covers Dedicated Cab, Fuel, Tirumala hill climb & Driver Bata for all days. FASTag Tolls & AP permit at actual plazas (~₹950-₹1,100).
   * ACTION PROTOCOL & DEEP-LINKING:
     - Tirupati (N days): [👉 Open Tirupati N-Day Calculator & View Live Quote](/services/tirupati-package/?days={N})
     - Pondicherry (N days): [👉 Open Pondicherry Calculator](/services/pondicherry-one-day-trip/?days={N})
     - Thiruvannamalai: [👉 Open Thiruvannamalai Calculator](/services/thiruvannamalai-girivalam-trip/?days={N})
     - Kanchipuram: [👉 Open Kanchipuram Calculator](/services/kanchipuram-temple-trip/?days={N})
     - Chidambaram: [👉 Open Chidambaram Calculator](/services/chidambaram-temple-trip/?days={N})
     - Navagraha: [👉 Open Navagraha Calculator](/services/navagraha-tour/?days={N})
     - Rameswaram: [👉 Open Rameswaram Calculator](/services/rameswaram-2-days/?days={N})
     - Sabarimala: [👉 Open Sabarimala Calculator](/services/sabarimala-trip/?days={N})
     - Vellore: [👉 Open Vellore Calculator](/services/vellore-golden-temple/?days={N})
     - Outstation Cabs: [👉 Calculate Outstation Fare](/services/outstation-cabs/)
     - Airport Taxi: [👉 Book Airport Taxi](/services/chennai-airport-taxi/)
     - Acting Drivers: [👉 Hire Acting Driver](/services/acting-drivers/)
     - Local Hourly Rental: [👉 View Local Packages](/tariff#local)

2. OTHER TEMPLE & TOUR PACKAGES (Round trip from Chennai):
   - Chidambaram Natarajar & Pichavaram Mangroves:
     1 Day: Sedan ₹7,400 | Ertiga ₹9,200 | Innova ₹11,000
     2 Days: Sedan ₹9,800 | Ertiga ₹12,000 | Innova ₹14,000
   - Thiruvannamalai Arunachaleswarar & Girivalam:
     1 Day: Sedan ₹6,500 | Ertiga ₹7,900 | Innova ₹9,300
     2 Days: Sedan ₹8,900 | Ertiga ₹10,900 | Innova ₹12,900
   - Kanchipuram Temple & Silk Weavers Tour:
     1 Day: Sedan ₹3,800 | Ertiga ₹4,800 | Innova ₹5,800
   - Kumbakonam Navagraha (9 Planetary Temples):
     2 Days: Sedan ₹14,500 | Ertiga ₹18,500 | Innova ₹22,500
     3 Days: Sedan ₹19,500 | Ertiga ₹24,500 | Innova ₹29,500
   - Rameswaram, Ramanathaswamy & Dhanushkodi:
     2 Days: Sedan ₹18,500 | Ertiga ₹23,500 | Innova ₹27,500
     3 Days: Sedan ₹24,500 | Ertiga ₹30,500 | Innova ₹36,500
   - Sabarimala Pilgrimage (Ghat Road Expert Chauffeur):
     3 Days: Sedan ₹24,000 | Ertiga ₹30,000 | Innova ₹36,000
     4 Days: Sedan ₹29,500 | Ertiga ₹36,500 | Innova ₹43,500
   - Vellore Sripuram Golden Temple:
     1 Day: Sedan ₹4,200 | Ertiga ₹5,200 | Innova ₹6,200
   - Pondicherry & Auroville:
     1 Day: Sedan ₹4,500 - ₹5,000 | Ertiga ₹5,800 - ₹6,200 | Innova ₹7,000
     2 Days: Sedan ₹7,500 | Ertiga ₹9,200 | Innova ₹10,200

3. LOCAL CHENNAI HOURLY PACKAGES:
   - Sedan (Dzire / Etios):
     * 4 hrs / 40 km: ₹1,350 | 5 hrs / 50 km: ₹1,500 | 8 hrs / 80 km: ₹2,200 | 10 hrs / 100 km: ₹2,600 | 12 hrs / 120 km: ₹3,050
     * Extra km: ₹15 | Extra hr: ₹150
   - Ertiga / XL6 (6 Pax):
     * 4 hrs / 40 km: ₹1,700 | 5 hrs / 50 km: ₹2,000 | 8 hrs / 80 km: ₹2,800 | 10 hrs / 100 km: ₹3,400 | 12 hrs / 120 km: ₹3,900
     * Extra km: ₹17 | Extra hr: ₹200
   - Toyota Innova (7 Pax):
     * 4 hrs / 40 km: ₹1,900 | 5 hrs / 50 km: ₹2,300 | 8 hrs / 80 km: ₹3,200 | 10 hrs / 100 km: ₹3,600 | 12 hrs / 120 km: ₹4,200
     * Extra km: ₹19 | Extra hr: ₹250
   - Innova Crysta (7 Pax):
     * 4 hrs / 40 km: ₹2,800 | 5 hrs / 50 km: ₹3,200 | 8 hrs / 80 km: ₹4,500 | 10 hrs / 100 km: ₹5,200 | 12 hrs / 120 km: ₹6,000
     * Extra km: ₹22 | Extra hr: ₹350
   - Tempo Traveller (12 Seater):
     * 4 hrs / 40 km: ₹3,500 | 5 hrs / 50 km: ₹4,200 | 8 hrs / 80 km: ₹5,500 | 10 hrs / 100 km: ₹6,500 | 12 hrs / 120 km: ₹7,000
     * Extra km: ₹24 | Extra hr: ₹500
   * Policy for Local: ₹0 advance deposit required. Pay balance after ride completion.

4. OUTSTATION & INTERCITY PER-KM TARIFFS:
   - Swift Dzire / Etios: Round trip ₹14/km | One-way drop ₹16/km (Min drop 130 km, Round trip 250 km/day, Driver Bata ₹400/day)
   - Maruti Ertiga / XL6: Round trip ₹17/km | One-way drop ₹19/km (Min drop 130 km, Round trip 250 km/day, Driver Bata ₹500/day)
   - Toyota Innova: Round trip ₹20/km | One-way drop ₹22/km (Min drop 130 km, Round trip 250 km/day, Driver Bata ₹600/day)
   - Innova Crysta: Round trip ₹22/km | One-way drop ₹25/km (Min drop 130 km, Round trip 250 km/day, Driver Bata ₹700/day)
   - Tempo Traveller (12S): Round trip ₹26/km | One-way drop ₹29/km (Min drop 250 km, Round trip 300 km/day, Driver Bata ₹800/day)
   * Highway Tolls, State Border Permits (if outside Tamil Nadu), and Parking are at actuals.

5. CHENNAI AIRPORT (MAA) TAXI TRANSFERS:
   - City Hub Fixed Transfers (AC Sedan):
     * Velachery: ₹650 | Tambaram: ₹550 | Guindy: ₹500 | Chromepet: ₹450 | Pallavaram: ₹400
     * T. Nagar: ₹700 | Adyar: ₹700 | Medavakkam: ₹700 | OMR: ₹750 | Mylapore: ₹750 | Koyambedu: ₹750
     * Anna Nagar: ₹800 | Egmore: ₹800 | Chennai Central: ₹850
     *(Ertiga: +₹200 to ₹250 | Innova: +₹450 to ₹550)*
   - Direct Highway Outstation Corridors from Airport:
     * Pondicherry & Auroville (151 km): Sedan ₹2,820 | Innova ₹3,370 | Crysta ₹4,480 | Tempo ₹8,050
     * Vellore CMC & VIT (140 km): Sedan ₹2,600 | Innova ₹3,120 | Crysta ₹4,150 | Tempo ₹7,450
     * Tirupati Balaji Temple (135 km): Sedan ₹2,560 | Innova ₹3,070 | Crysta ₹4,080 | Tempo ₹7,250
     * Mahabalipuram ECR (55 km): Sedan ₹1,650 | Innova ₹2,400 | Crysta ₹2,950 | Tempo ₹4,200
     * Sriperumbudur SIPCOT (42 km): Sedan ₹1,400 | Innova ₹2,100 | Crysta ₹2,600 | Tempo ₹3,800
     * Kanchipuram Silk City (75 km): Sedan ₹2,100 | Innova ₹2,650 | Crysta ₹3,400 | Tempo ₹5,200
     * Tiruvannamalai (195 km): Sedan ₹3,600 | Innova ₹4,350 | Crysta ₹5,800 | Tempo ₹9,800
   - Operational Guarantee: 24/7 pickup, live flight radar tracking (zero waiting charges for flight delays), and driver allotted before takeoff from origin airport. ₹0 advance for city drops; ₹500 to lock cab for outstation corridors (deducted from bill).

6. ACTING DRIVERS FOR PERSONAL CARS:
   - Chennai City Duty:
     * 4 Hours: ₹500 (Extra hour: ₹100)
     * 8 Hours: ₹800 (Extra hour: ₹100)
     * Night driving allowance (10:00 PM – 6:00 AM): ₹150
   - Outstation Round Trip (Your Car - Driver meals included):
     * Hatchback & Sedan: ₹1,400 / day (₹1,100 base bata + ₹300 food)
     * Compact SUV / MPV (Ertiga, Creta, Seltos, Carens): ₹1,500 / day (₹1,200 bata + ₹300 food)
     * Premium SUV / MUV (Innova Crysta, Fortuner): ₹1,600 / day (₹1,300 bata + ₹300 food)
     * Luxury European (BMW, Mercedes-Benz, Audi): ₹1,800 / day (₹1,500 bata + ₹300 food)
     * Driver Stay: Free driver dormitory at hotels (TNCDBR rules); ₹300/night lodging allowance if private stay has no dorm.
   - Outstation One-Way Drop (Car Relocation):
     * 1-Day Driver Bata + Return Govt. SETC Bus Ticket + ₹300 Food Allowance (e.g. Pondy ~₹1,600, Bangalore ~₹1,850, Trichy ~₹1,820). If >400 km (Madurai ~₹2,500, Coimbatore ~₹2,570), 1.5x Bata applies for return travel.
   - Safety: 100% Police Clearance Certificate (PVC Verified) chauffeurs, vetted on Manual, Automatic (CVT/DCT/AMT), and EV drivetrains.
   - Deposit: ₹0 advance required.
`;

function deterministicFallback(userText, pageContext) {
  const query = (userText || '').toLowerCase();

  // On-screen context awareness (Pro-Rata / Quoted rates)
  if (pageContext && pageContext.totalFare) {
    const asksFor2Days = query.includes('2 day') || query.includes('two day') || query.includes('2-day') || query.includes('2 நாள்') || query.includes('2 நாட்கள்');
    const asksPrice = query.includes('price') || query.includes('cost') || query.includes('fare') || query.includes('rate') || query.includes('how much') || query.includes('quote') || query.includes('evlo') || query.includes('kattanam') || query.includes('tariff');
    const asksExplain = query.includes('explain') || query.includes('why') || query.includes('breakup') || query.includes('breakdown') || query.includes('details') || query.includes('screen') || query.includes('quote');

    if (asksFor2Days || asksPrice || asksExplain || query.includes('this trip') || query.includes('my trip') || query.includes('selected')) {
      const destName = pageContext.destination || (pageContext.serviceTitle ? pageContext.serviceTitle.replace(/Chennai to /i, '') : 'your trip');
      const vehName = pageContext.vehicleName || 'Swift Dzire / Etios';
      const fareFormatted = pageContext.formattedFare || `₹${pageContext.totalFare?.toLocaleString('en-IN')}`;
      const durLabel = pageContext.durationLabel || `${pageContext.durationHours || 24} hrs`;
      const subText = pageContext.durationSubText || (pageContext.isProRata ? '1 Night Stay' : '');

      if (pageContext.isProRata) {
        const hrs = pageContext.durationHours || 36;
        const extraHrs = pageContext.extraHours || (hrs - 24);
        const savings = pageContext.savings ? `₹${pageContext.savings.toLocaleString('en-IN')}` : '₹1,750';

        return {
          reply: `I see your selected schedule on screen is **${durLabel}** (${hrs} hours${subText ? ` / ${subText}` : ''}) for **${destName}**:\n\n` +
            `• **Your On-Screen Pro-Rata Fare:** **${fareFormatted}** for **${vehName}**\n` +
            `  Because your trip duration is **${hrs} hours** (rather than the full 48 hours), our transparent tariff charges you pro-rata for 1 Day + ${extraHrs} hrs, **saving you ${savings}** compared to the full 2-day package!\n\n` +
            `• **Full 48-Hour 2-Day Package Rates:**\n` +
            `  If you require the cab for the complete 48 hours (e.g. 2 full calendar days or returning late night on Day 2):\n` +
            `  - **Swift Dzire / Etios (4 Pax):** ₹9,500\n` +
            `  - **Maruti Ertiga / XL6 (6 Pax):** ₹11,500\n` +
            `  - **Toyota Innova (7 Pax):** ₹12,500\n` +
            `  - **Toyota Innova Crysta (7 Pax):** ₹16,000\n` +
            `  - **Tempo Traveller (12 Pax):** ₹19,500\n\n` +
            `✅ **Inclusions:** Dedicated AC Cab & Experienced Chauffeur, Fuel, AP State Border Permit, Tirumala Ghat Road ascent, and Driver Bata.\n` +
            `🛡️ **Policy:** Nominal **₹500 advance** to confirm & lock cab (avoids last-minute cancellation). Remaining balance paid post-trip!`,
          actionSuggestion: {
            type: 'tirupati_package',
            label: `Book ${vehName} (${fareFormatted}) on WhatsApp`,
            whatsappText: `Hi Kalidass Travels, I want to confirm my ${durLabel} trip to ${destName} (${fareFormatted} for ${vehName}).`
          }
        };
      }
    }
  }

  if (query.includes('tirupati') || query.includes('tirumala') || query.includes('balaji')) {
    let days = 1;
    const dMatch = query.match(/(\d+)\s*(?:days?|day|நாட்கள்|நாள்)/i);
    if (dMatch) days = parseInt(dMatch[1], 10);
    else if (query.includes('2-day') || query.includes('2 day') || query.includes('two day')) days = 2;
    else if (query.includes('3-day') || query.includes('3 day') || query.includes('three day')) days = 3;
    else if (query.includes('4-day') || query.includes('4 day') || query.includes('four day')) days = 4;
    else if (query.includes('5-day') || query.includes('5 day') || query.includes('five day')) days = 5;

    const calc = (base3, extraPerDay, d1, d2) => {
      if (days === 1) return d1;
      if (days === 2) return d2;
      if (days === 3) return base3;
      return base3 + ((days - 3) * extraPerDay);
    };

    const sedanRate = calc(13200, 3500, 6000, 9500);
    const ertigaRate = calc(15800, 4000, 7500, 11500);
    const innovaRate = calc(17500, 4000, 8500, 12500);
    const crystaRate = calc(22500, 6000, 10000, 16000);
    const tempoRate = calc(27000, 7000, 12500, 19500);

    const durText = days === 1 ? '1-Day' : `${days}-Day`;
    const incl = days === 1 
      ? 'Dedicated Cab, Fuel, NH FASTag Tolls, AP Border Permit, Tirumala Ghat Road ascent, and Driver Bata.' 
      : `Dedicated AC cab & experienced chauffeur staying with you for all ${days} days, Tirumala Ghat Road hill climb & Driver Bata.`;

    const pageLink = `/services/tirupati-package/?days=${days}`;

    return {
      reply: `Here are our official **Chennai ⇄ Tirupati ${durText} Package** rates:\n\n` +
        `• **AC Sedan (Dzire / Etios - 4 Pax):** ₹${sedanRate.toLocaleString('en-IN')}\n` +
        `• **Maruti Ertiga / XL6 (6 Pax):** ₹${ertigaRate.toLocaleString('en-IN')}\n` +
        `• **Toyota Innova (7 Pax):** ₹${innovaRate.toLocaleString('en-IN')}\n` +
        `• **Toyota Innova Crysta:** ₹${crystaRate.toLocaleString('en-IN')}\n` +
        `• **Tempo Traveller (12 Pax):** ₹${tempoRate.toLocaleString('en-IN')}\n\n` +
        `✅ **Included in ${durText} Package:** ${incl}\n` +
        `🛡️ **Policy:** Nominal ₹500 advance to confirm & lock cab (avoids last-minute cancellation). Balance post-trip.\n\n` +
        `[👉 Open Tirupati ${durText} Calculator & View Live Quote](${pageLink})`,
      actionSuggestion: {
        type: 'tirupati_package',
        label: `Book Tirupati ${durText} on WhatsApp`,
        whatsappText: `Hi Kalidass Travels, I want to book a Chennai to Tirupati ${durText} Package.`
      }
    };
  }

  if (query.includes('acting') || query.includes('call driver') || query.includes('personal car') || query.includes('driver for my car') || query.includes('ஆக்டிங்')) {
    return {
      reply: `Here are our official **Acting Driver Services** for your personal car (MT / AT / EV):\n\n` +
        `• **Chennai City Duty:**\n` +
        `  - 4 Hours: ₹500 (Extra hour: ₹100)\n` +
        `  - 8 Hours: ₹800 *(Full Day Duty)*\n` +
        `  - Night driving charge (10:00 PM – 6:00 AM): ₹150\n\n` +
        `• **Outstation Round Trip (Your Car - Driver meals included):**\n` +
        `  - Hatchback / Sedan: ₹1,400 / day (₹1,100 bata + ₹300 food)\n` +
        `  - Compact SUV / MPV (Ertiga, Creta, Seltos): ₹1,500 / day (₹1,200 bata + ₹300 food)\n` +
        `  - Premium SUV / MUV (Innova Crysta, Fortuner): ₹1,600 / day (₹1,300 bata + ₹300 food)\n` +
        `  - Luxury European (BMW, Mercedes-Benz, Audi): ₹1,800 / day (₹1,500 bata + ₹300 food)\n\n` +
        `• **Outstation One-Way Drop:** 1-Day Driver Bata + Return SETC Bus Ticket + ₹300 Food (1.5x Bata if >400 km).\n\n` +
        `👮 **Safety:** 100% Police Clearance Certificate (PVC) verified, 5+ years experience.\n` +
        `🛡️ **Policy:** **₹0 advance deposit** required — pay after trip completion!\n\n` +
        `[👉 Hire Acting Driver](/services/acting-drivers/)`,
      actionSuggestion: {
        type: 'acting_driver',
        label: 'Book Acting Driver on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I want to book an Acting Driver for my car.'
      }
    };
  }

  if (query.includes('airport') || query.includes('flight') || query.includes('terminal') || query.includes('ஏர்போர்ட்')) {
    return {
      reply: `Here are our **Chennai Airport (MAA) Taxi Transfer Rates**:\n\n` +
        `• **City Hub Drops / Pickups (AC Sedan):**\n` +
        `  - Velachery: ₹650 | Tambaram: ₹550 | Guindy: ₹500 | Chromepet: ₹450\n` +
        `  - T. Nagar: ₹700 | Adyar: ₹700 | Medavakkam: ₹700 | OMR: ₹750\n` +
        `  - Anna Nagar: ₹800 | Egmore: ₹800 | Chennai Central: ₹850\n` +
        `  *(Ertiga: +₹200 to ₹250 | Innova: +₹450 to ₹550)*\n\n` +
        `• **Direct Highway Outstation Corridors (Sedan):**\n` +
        `  - Pondicherry: ₹2,820 | Vellore CMC: ₹2,600 | Tirupati: ₹2,560\n` +
        `  - Mahabalipuram: ₹1,650 | Sriperumbudur: ₹1,400 | Kanchipuram: ₹2,100\n\n` +
        `✈️ **Airport Guarantees:**\n` +
        `• Live flight radar tracking with **zero waiting charges for delayed flights**.\n` +
        `• Chauffeur details allotted and sent on WhatsApp **before your flight takes off** from your origin airport!\n` +
        `• ₹0 advance for city drops. Outstation: ₹500 to lock cab (deducted from bill).\n\n` +
        `[👉 Book Chennai Airport Taxi](/services/chennai-airport-taxi/)`,
      actionSuggestion: {
        type: 'airport_booking',
        label: 'Book Airport Taxi on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I need a Chennai Airport taxi transfer.'
      }
    };
  }

  if ((query.includes('local') || query.includes('hourly') || query.includes('city') || query.includes('4hr') || query.includes('8hr')) && !query.includes('acting') && !query.includes('call driver')) {
    return {
      reply: `Here are our **Chennai City Local Rental Packages**:\n\n` +
        `• **AC Sedan (Dzire / Etios):**\n` +
        `  - 4 hrs / 40 km: ₹1,350\n` +
        `  - 8 hrs / 80 km: ₹2,200 (Popular)\n` +
        `  - Extra km: ₹15 | Extra hr: ₹150\n\n` +
        `• **Maruti Ertiga (6 Seater):**\n` +
        `  - 4 hrs / 40 km: ₹1,700\n` +
        `  - 8 hrs / 80 km: ₹2,800\n` +
        `  - Extra km: ₹17 | Extra hr: ₹200\n\n` +
        `• **Toyota Innova (7 Seater):**\n` +
        `  - 8 hrs / 80 km: ₹3,200\n\n` +
        `🛡️ **Policy:** ₹0 advance deposit required for local city rentals — pay balance after trip completion!`,
      actionSuggestion: {
        type: 'local_package',
        label: 'Book Local Rental on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I want to book a Local Chennai Cab package.'
      }
    };
  }

  if (query.includes('pondy') || query.includes('pondicherry')) {
    return {
      reply: `For **Chennai ⇄ Pondicherry (Same Day Return)**:\n\n` +
        `• **AC Sedan (4 Pax):** ~₹4,500 - ₹5,000 (Based on ~320 km round trip at ₹14/km + driver bata ₹400)\n` +
        `• **Maruti Ertiga (6 Pax):** ~₹5,800 - ₹6,200 (At ₹17/km + driver bata ₹500)\n` +
        `• **Toyota Innova (7 Pax):** ~₹7,000 (At ₹20/km + driver bata ₹600)\n\n` +
        `*Tolls are payable at actual FASTag plazas. ₹500 advance to confirm booking (deducted from bill).*`,
      actionSuggestion: {
        type: 'pondicherry_package',
        label: 'Book Pondicherry Cab on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I need a Chennai to Pondicherry cab quote.'
      }
    };
  }

  if (query.includes('advance') || query.includes('deposit') || query.includes('lock cab') || query.includes('முன்பணம்')) {
    return {
      reply: `🛡️ **Kalidass Travels Advance Payment & Deduction Policy:**\n\n` +
        `• **Nominal ₹500 Advance:** For outstation trips and tour packages, we collect only **₹500 advance** to confirm booking and lock cab allocation.\n` +
        `• **100% Deducted from Bill:** The ₹500 is NOT an extra fee — it is deducted from your quoted total (e.g. Total ₹6,000 − ₹500 Advance = ₹5,500 Net Balance paid directly to chauffeur post-trip).\n` +
        `• **Local City & Acting Drivers:** **₹0 advance deposit required** — pay 100% after trip completion!\n` +
        `• **100% Refund Guarantee:** Fully refundable if canceled up to 6 hours before departure.\n\n` +
        `[👉 Pay ₹500 Advance & Lock Cab on WhatsApp](https://wa.me/918939539211?text=Hi%20Kalidass%20Travels%2C%20I%20want%20to%20confirm%20my%20booking%20and%20pay%20advance)`,
      actionSuggestion: {
        type: 'advance_policy',
        label: 'Confirm on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I want to confirm my booking and pay ₹500 advance.'
      }
    };
  }

  if (query.includes('chidambaram') || query.includes('pichavaram')) {
    return {
      reply: `Here are our **Chennai ⇄ Chidambaram & Pichavaram Tour Package** rates:\n\n` +
        `• **1-Day Package (All-Inclusive):**\n` +
        `  - AC Sedan: ₹7,400 | Maruti Ertiga: ₹9,200 | Toyota Innova: ₹11,000\n` +
        `• **2-Day Package:**\n` +
        `  - AC Sedan: ₹9,800 | Maruti Ertiga: ₹12,000 | Toyota Innova: ₹14,000\n\n` +
        `✅ Covers dedicated AC cab, fuel, ECR highway tolls, Pichavaram mangrove stop & driver bata.\n` +
        `🛡️ ₹500 advance to lock cab (deducted from bill); balance paid post-trip!\n\n` +
        `[👉 Open Chidambaram Calculator](/services/chidambaram-temple-trip/)`,
      actionSuggestion: {
        type: 'tour_quote',
        label: 'Book Chidambaram on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I want to book Chennai to Chidambaram tour.'
      }
    };
  }

  if (query.includes('thiruvannamalai') || query.includes('tiruvannamalai') || query.includes('girivalam')) {
    return {
      reply: `Here are our **Chennai ⇄ Thiruvannamalai Arunachaleswarar Girivalam Package** rates:\n\n` +
        `• **1-Day Package:** AC Sedan: ₹6,500 | Maruti Ertiga: ₹7,900 | Toyota Innova: ₹9,300\n` +
        `• **2-Day Package:** AC Sedan: ₹8,900 | Maruti Ertiga: ₹10,900 | Toyota Innova: ₹12,900\n\n` +
        `✅ Covers dedicated cab, fuel, NH tolls, Girivalam coordination & driver bata.\n` +
        `🛡️ ₹500 advance to lock cab (deducted from bill); balance paid post-trip!\n\n` +
        `[👉 Open Thiruvannamalai Calculator](/services/thiruvannamalai-girivalam-trip/)`,
      actionSuggestion: {
        type: 'tour_quote',
        label: 'Book Thiruvannamalai on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I want to book Chennai to Thiruvannamalai Girivalam tour.'
      }
    };
  }

  if (query.includes('navagraha') || query.includes('kumbakonam')) {
    return {
      reply: `Here are our **Kumbakonam Navagraha (9 Planetary Temples) Tour Package** rates:\n\n` +
        `• **2-Day Package:** AC Sedan: ₹14,500 | Maruti Ertiga: ₹18,500 | Toyota Innova: ₹22,500\n` +
        `• **3-Day Package:** AC Sedan: ₹19,500 | Maruti Ertiga: ₹24,500 | Toyota Innova: ₹29,500\n\n` +
        `✅ Dedicated AC cab staying with you for all 9 temples, experienced temple route chauffeur.\n` +
        `🛡️ ₹500 advance to lock cab (deducted from bill); balance paid post-trip!\n\n` +
        `[👉 Open Navagraha Calculator](/services/navagraha-tour/)`,
      actionSuggestion: {
        type: 'tour_quote',
        label: 'Book Navagraha Tour on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I want to book Kumbakonam Navagraha Tour.'
      }
    };
  }

  if (query.includes('rameswaram') || query.includes('rameshwaram') || query.includes('dhanushkodi')) {
    return {
      reply: `Here are our **Chennai ⇄ Rameswaram & Dhanushkodi Tour Package** rates:\n\n` +
        `• **2-Day Package:** AC Sedan: ₹18,500 | Maruti Ertiga: ₹23,500 | Toyota Innova: ₹27,500\n` +
        `• **3-Day Package:** AC Sedan: ₹24,500 | Maruti Ertiga: ₹30,500 | Toyota Innova: ₹36,500\n\n` +
        `✅ Covers Pamban Bridge, Ramanathaswamy Temple, 22 Kundas bath, and Dhanushkodi.\n` +
        `🛡️ ₹500 advance to lock cab (deducted from bill); balance paid post-trip!\n\n` +
        `[👉 Open Rameswaram Calculator](/services/rameswaram-2-days/)`,
      actionSuggestion: {
        type: 'tour_quote',
        label: 'Book Rameswaram on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I want to book Chennai to Rameswaram package.'
      }
    };
  }

  if (query.includes('kanchipuram') || query.includes('kanchi')) {
    return {
      reply: `Here are our **Chennai ⇄ Kanchipuram Temple & Silk Tour** rates:\n\n` +
        `• **Same-Day Return:** AC Sedan: ₹3,800 | Maruti Ertiga: ₹4,800 | Toyota Innova: ₹5,800\n\n` +
        `✅ Covers Kamakshi Amman, Ekambareswarar, Varadharaja Perumal & handloom weaver centers.\n` +
        `🛡️ ₹500 advance to lock cab (deducted from bill); balance paid post-trip!\n\n` +
        `[👉 Open Kanchipuram Calculator](/services/kanchipuram-temple-trip/)`,
      actionSuggestion: {
        type: 'tour_quote',
        label: 'Book Kanchipuram on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I want to book Kanchipuram Tour.'
      }
    };
  }

  if (query.includes('vellore') || query.includes('golden temple')) {
    return {
      reply: `Here are our **Chennai ⇄ Vellore Sripuram Golden Temple Tour** rates:\n\n` +
        `• **Same-Day Return:** AC Sedan: ₹4,200 | Maruti Ertiga: ₹5,200 | Toyota Innova: ₹6,200\n\n` +
        `✅ Covers dedicated AC cab, NH toll plazas, and driver bata.\n` +
        `🛡️ ₹500 advance to lock cab (deducted from bill); balance paid post-trip!\n\n` +
        `[👉 Open Vellore Calculator](/services/vellore-golden-temple/)`,
      actionSuggestion: {
        type: 'tour_quote',
        label: 'Book Vellore on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I want to book Vellore Golden Temple Tour.'
      }
    };
  }

  if (query.includes('sabarimala') || query.includes('pamba')) {
    return {
      reply: `Here are our **Chennai ⇄ Sabarimala Mandala Pooja Tour Package** rates:\n\n` +
        `• **3-Day Package:** AC Sedan: ₹24,000 | Maruti Ertiga: ₹30,000 | Toyota Innova: ₹36,000\n` +
        `• **4-Day Package:** AC Sedan: ₹29,500 | Maruti Ertiga: ₹36,500 | Toyota Innova: ₹43,500\n\n` +
        `✅ Specialized ghat-road senior chauffeurs, Nilakkal / Pamba transit coordination.\n` +
        `🛡️ ₹500 advance to lock cab (deducted from bill); balance paid post-trip!\n\n` +
        `[👉 Open Sabarimala Calculator](/services/sabarimala-trip/)`,
      actionSuggestion: {
        type: 'tour_quote',
        label: 'Book Sabarimala on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I want to book Sabarimala package.'
      }
    };
  }

  if (query.includes('outstation') || query.includes('drop') || query.includes('per km') || query.includes('rate') || query.includes('tariff')) {
    return {
      reply: `Here are our **Outstation & Intercity Tariff Rates**:\n\n` +
        `• **Swift Dzire / Etios:** ₹14 / km (Min 250 km/day, Driver Bata ₹400/day)\n` +
        `• **Maruti Ertiga (6 Seater):** ₹17 / km (Min 250 km/day, Driver Bata ₹500/day)\n` +
        `• **Toyota Innova (7 Seater):** ₹20 / km (Min 250 km/day, Driver Bata ₹600/day)\n` +
        `• **Toyota Innova Crysta:** ₹22 / km (Min 250 km/day, Driver Bata ₹700/day)\n` +
        `• **Tempo Traveller (12 Seater):** ₹26 / km (Min 300 km/day, Driver Bata ₹800/day)\n\n` +
        `🛡️ **Policy:** ₹500 advance to confirm & lock cab (deducted from bill). Balance post-trip!`,
      actionSuggestion: {
        type: 'outstation_inquiry',
        label: 'Get Exact Route Quote on WhatsApp',
        whatsappText: 'Hi Kalidass Travels, I would like an outstation cab quote.'
      }
    };
  }

  return {
    reply: `Hello! I am your **Kalidass Travels AI Fare Assistant** 🚕\n\n` +
      `I can instantly help you with:\n` +
      `• 🕉️ **Tirupati Balaji & Temple Packages** (Tirupati 1-Day Sedan ₹6,000 | Ertiga ₹7,500 all-inclusive)\n` +
      `• ✈️ **Chennai Airport Taxi Transfers** (City hubs from ₹550 | 24/7 flight tracking)\n` +
      `• 👮 **Acting Drivers for Personal Car** (City 4hr ₹500, 8hr ₹800 | Outstation ₹1,400/day)\n` +
      `• ⏱️ **Local Chennai Hourly Packages** (4hr, 8hr, 12hr rentals)\n` +
      `• 🛣️ **Outstation Cabs** (Sedan ₹14/km, Ertiga ₹17/km, Innova ₹20/km)\n\n` +
      `Please tell me your destination, travel date, or preferred car!`,
    actionSuggestion: null
  };
}

export async function onRequestPost({ request, env }) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      try {
        const text = await request.text();
        body = JSON.parse(text);
      } catch (e) {}
    }

    const messages = body.messages || [];
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    // Asynchronously log to Google Apps Script Webhook
    const logToWebhook = (replyText, engineSource) => {
      try {
        if (!lastUserMessage) return;
        const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        const sessionId = String(body.sessionId || 'KT-SES-' + Math.floor(1000 + Math.random() * 9000)).replace(/,/g, ' ');
        const sourcePage = String(body.sourcePage || '/').replace(/,/g, ' ');

        const qLow = lastUserMessage.toLowerCase();
        let intent = 'General Inquiry';
        if (qLow.includes('tirupati') || qLow.includes('tirumala') || qLow.includes('balaji')) intent = 'Tirupati Package';
        else if (qLow.includes('airport') || qLow.includes('flight') || qLow.includes('terminal')) intent = 'Airport Transfer';
        else if (qLow.includes('pondy') || qLow.includes('pondicherry')) intent = 'Pondicherry Tour';
        else if (qLow.includes('local') || qLow.includes('hourly') || qLow.includes('4hr') || qLow.includes('8hr') || qLow.includes('city')) intent = 'Local Rental';
        else if (qLow.includes('outstation') || qLow.includes('per km') || qLow.includes('km rate')) intent = 'Outstation Tariff';
        else if (qLow.includes('temple') || qLow.includes('navagraha') || qLow.includes('kumbakonam') || qLow.includes('girivalam')) intent = 'Temple Tour';
        else if (qLow.includes('acting') || qLow.includes('call driver') || qLow.includes('personal car')) intent = 'Acting Driver';

        const phoneMatch = lastUserMessage.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
        const contact = phoneMatch ? phoneMatch[0].replace(/[^0-9]/g, '').slice(-10) : 'None';

        const webhookUrl = env && (env.GOOGLE_SHEET_WEBHOOK_URL || env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL);
        if (webhookUrl && webhookUrl.startsWith('http')) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              type: 'ai_chat_query',
              date: timestamp,
              sessionId,
              sourcePage,
              userQuery: lastUserMessage,
              aiReply: replyText,
              intent,
              contact,
              engine: engineSource
            })
          }).catch(() => {});
        }
      } catch (_) {}
    };

    const pageContext = body.pageContext || null;

    // Check for Gemini API Key in Cloudflare env or process.env
    const apiKey = (env && env.GEMINI_API_KEY) || (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY);

    if (!apiKey) {
      // Deterministic instant response fallback with pageContext
      const fallbackResult = deterministicFallback(lastUserMessage, pageContext);
      logToWebhook(fallbackResult.reply, 'cloudflare_deterministic');
      return new Response(JSON.stringify({
        success: true,
        reply: fallbackResult.reply,
        actionSuggestion: fallbackResult.actionSuggestion,
        source: 'local_deterministic'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Call Google Gemini API (gemini-3.8-flash with gemini-3.5-flash-lite fallback)
    let systemText = TARIFF_KNOWLEDGE;
    if (pageContext && pageContext.totalFare) {
      systemText += `\nACTIVE ON-SCREEN BOOKING ENGINE SELECTION: Destination: ${pageContext.destination || ''}, Vehicle: ${pageContext.vehicleName || ''}, Schedule: ${pageContext.pickupFormatted || ''} to ${pageContext.returnFormatted || ''}, Duration: ${pageContext.durationLabel || ''} (${pageContext.durationHours || 0} hrs), Fare: ${pageContext.formattedFare || ''}, Pro-Rata: ${pageContext.isProRata ? 'YES' : 'NO'}. If customer asks 'for 2 days' or about price, explicitly clarify that their on-screen quote is pro-rata for ${pageContext.durationHours} hrs (saving them ₹${pageContext.savings || 1750} vs full 2-day package).`;
    }

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemText }]
      },
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 3000,
      }
    };

    let candidateText = '';
    for (const model of ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3-flash', 'gemini-flash-latest']) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload)
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) break;
        }
      } catch (_) {}
    }

    if (!candidateText) {
      // Graceful fallback to deterministic engine on API error
      const fallbackResult = deterministicFallback(lastUserMessage, pageContext);
      return new Response(JSON.stringify({
        success: true,
        reply: fallbackResult.reply,
        actionSuggestion: fallbackResult.actionSuggestion,
        source: 'local_fallback'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const reply = candidateText || deterministicFallback(lastUserMessage, pageContext).reply;
    logToWebhook(reply, candidateText ? 'gemini' : 'gemini_fallback');

    return new Response(JSON.stringify({
      success: true,
      reply,
      source: 'gemini'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      reply: deterministicFallback('').reply,
      error: err.message
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
