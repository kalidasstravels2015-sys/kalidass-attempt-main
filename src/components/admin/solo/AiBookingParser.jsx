import React, { useState } from 'react';
import { validateCustomerContact } from '../../../utils/bookingContactValidator';
import { getNextEnquiryId } from '../../../utils/sequenceGenerator';

// In-browser Instant Parser (0ms latency fallback)
function parseBookingInquiryClient(rawText, phoneInput = '', guestNameInput = '') {
  const text = String(rawText || '').trim();
  const lower = text.toLowerCase();

  // 1. Phone Extraction
  let phone = (phoneInput || '').replace(/[^0-9]/g, '');
  if (phone.length >= 10) {
    phone = phone.startsWith('91') && phone.length === 12 ? `+${phone}` : `+91 ${phone.slice(-10)}`;
  } else {
    const phoneMatch = text.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
    if (phoneMatch) {
      const clean = phoneMatch[0].replace(/[\s\-]/g, '');
      phone = clean.startsWith('+91') ? clean : (clean.startsWith('91') && clean.length === 12 ? `+${clean}` : `+91 ${clean.slice(-10)}`);
    } else {
      phone = phoneInput ? phoneInput.trim() : '';
    }
  }

  // 2. Quote Ref Extraction
  let quoteRefId = '';
  const quoteRefMatch = text.match(/(?:Quote Ref:?\s*\*?)(#[A-Za-z0-9\-]+)/i);
  if (quoteRefMatch) {
    quoteRefId = quoteRefMatch[1].trim();
  } else {
    const altQuoteMatch = text.match(/\((#[A-Za-z0-9\-]+)\)/);
    if (altQuoteMatch) {
      quoteRefId = altQuoteMatch[1].trim();
    } else {
      quoteRefId = getNextEnquiryId([], '#ENQ-');
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
  const tripMatch = text.match(/(?:Trip|Transfer Type):\s*\*?([^\n\r•]+)/i);
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

  const routeMatch = text.match(/Route:\s*\*?([^\n\r]+?)\s*(?:->|➔|to)\s*([^\n\r]+?)(?:\s*\((?:~)?(\d+)\s*km\))?$/im);
  if (routeMatch) {
    pickup = routeMatch[1].trim().replace(/^[-•*]\s*/, '').replace(/\*+/g, '');
    drop = routeMatch[2].trim().replace(/\*+/g, '');
    if (routeMatch[3]) distanceKm = parseInt(routeMatch[3], 10);
  } else {
    const fromMatch = text.match(/(?:From|Pickup):\s*\*?([^\n\r]+)/i);
    const toMatch = text.match(/(?:To|Drop):\s*\*?([^\n\r]+)/i);
    if (fromMatch) pickup = fromMatch[1].trim().replace(/^[-•*]\s*/, '').replace(/\*+/g, '');
    if (toMatch) drop = toMatch[1].trim().replace(/^[-•*]\s*/, '').replace(/\*+/g, '');

    const distMatch = text.match(/(?:Distance|Est\.?\s*Distance):\s*\*?~?(\d+)\s*km/i);
    if (distMatch) distanceKm = parseInt(distMatch[1], 10);
  }

  // 6. Fare Extraction
  let estimatedFare = 0;
  const farePatterns = [
    /(?:Est\.?\s*Total|Total Fare|Quoted Fare|Quoted Package Fare|Package Fare|Total):\s*\*?₹?\s*\*?([\d,]+)/i,
    /(?:Fare|Rate|Amount|Cost):\s*\*?₹?\s*\*?([\d,]+)/i
  ];
  for (const pat of farePatterns) {
    const fm = text.match(pat);
    if (fm && fm[1]) {
      estimatedFare = parseInt(fm[1].replace(/,/g, ''), 10);
      break;
    }
  }

  // 7. Schedule (Date & Time) Extraction
  let travelDate = 'Tomorrow';
  let pickupTime = '05:00 AM';
  const schedMatch = text.match(/(?:Travel Date & Time|Pickup Date & Time|Pickup Schedule|Pickup Date|Travel Date):\s*\*?([^\n\r]+)/i);
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
  const vehMatch = text.match(/(?:Vehicle Type|Vehicle|Selected Vehicle):\s*\*?([^\n\r]+)/i);
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

  const gearMatch = text.match(/(?:Transmission \/ Gear|Transmission|Gear):\s*\*?([^\n\r]+)/i);
  if (gearMatch) {
    vehicleCategory += ` (${gearMatch[1].trim().replace(/\*+/g, '')})`;
  }

  // 9. Party Size
  let partySize = '4 Pax';
  const paxMatch = text.match(/(\d+)\s*(?:pax|people|persons?|passengers?|members?)/i);
  if (paxMatch) {
    partySize = `${paxMatch[1]} Pax`;
  } else if (serviceCategory === 'Acting Driver') {
    partySize = 'Car Owner Vehicle';
  }

  // 10. Guest Name
  let guestName = guestNameInput.trim() || 'Guest';
  if (guestName === 'Guest') {
    const nameMatch = text.match(/(?:Name|Guest|Customer):\s*([^\n\r]+)/i);
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
    estimatedFare = 0;
    chauffeurPayout = 0;
    companyMargin = 0;
  }

  const whatsAppReply =
    `🚕 *KALIDASS TRAVELS — TRIP QUOTE*\n\n` +
    `Namaskaram ${guestName}!\n` +
    `📍 *Route:* ${pickup} ➔ ${drop}\n` +
    `🚗 *Car:* ${vehicleCategory}\n` +
    `💰 *All-Inclusive Fare:* ₹${estimatedFare.toLocaleString('en-IN')}\n` +
    `*(Includes Toll, Driver Beta & Fuel. No hidden charges)*\n\n` +
    `🔒 *To Confirm Booking:*\n` +
    `Pay *₹500 Advance* via UPI: *8939539211@okbizaxis* (Kalidass Travels)\n` +
    `Vehicle & driver allocated instantly upon payment.\n\n` +
    `📞 24/7 Helpline: +91 89395 39211`;

  return {
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
}

export default function AiBookingParser({ onBookingCreated, onLeadCreated, showToast, onClose }) {
  const [inputText, setInputText] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleParse = async (overrideText, overridePhone) => {
    const text = overrideText !== undefined ? overrideText : inputText;
    const phone = overridePhone !== undefined ? overridePhone : customerPhone;
    if (!text.trim() && !phone.trim()) {
      showToast?.('Please paste a WhatsApp message or enter phone number', 'error');
      return;
    }

    setParsing(true);
    setCopied(false);

    // Try backend API first, fallback immediately to client-side parser
    try {
      const res = await fetch('/api/admin/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, phone, guestName: customerName })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.parsed) {
          setParsedData(data.parsed);
          showToast?.(`Extracted Quote ${data.parsed.quoteRefId}!`, 'success');
          setParsing(false);
          return;
        }
      }
    } catch (_) {}

    // Instant Client-side Fallback
    const local = parseBookingInquiryClient(text, phone, customerName);
    setParsedData(local);
    showToast?.(`Extracted Quote ${local.quoteRefId} locally!`, 'success');
    setParsing(false);
  };

  const handleCopyQuote = () => {
    if (!parsedData?.whatsAppQuote) return;
    navigator.clipboard.writeText(parsedData.whatsAppQuote);
    setCopied(true);
    showToast?.('Quotation copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    if (!parsedData) return;
    const cleanPhone = (parsedData.phone || customerPhone || '').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(parsedData.whatsAppQuote);
    const url = cleanPhone.length >= 10
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Action 1: Save as Active Lead / Enquiry in Stage 1
  const handleSaveAsLead = () => {
    if (!parsedData) return;
    const newLead = {
      quoteId: parsedData.quoteRefId,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      guestName: parsedData.guestName || customerName || 'WhatsApp Customer',
      sourcePage: parsedData.phone ? `${parsedData.serviceCategory} (${parsedData.phone})` : parsedData.serviceCategory,
      calculatorEngine: parsedData.serviceCategory,
      tripType: parsedData.tripType,
      pickup: parsedData.pickup,
      drop: parsedData.drop,
      vehicle: parsedData.vehicleCategory,
      estimatedFare: parsedData.estimatedFare,
      travelDate: `${parsedData.travelDate} @ ${parsedData.pickupTime}`,
      status: 'Quote Locked (24-Hr)'
    };

    if (onLeadCreated) {
      onLeadCreated(newLead);
    } else {
      showToast?.(`Quote ${newLead.quoteId} added to Stage 1!`, 'success');
    }
    setParsedData(null);
    setInputText('');
    setCustomerPhone('');
    onClose?.();
  };

  // Action 2: Save as Confirmed Booking in Stage 2 (Need Driver)
  const handleSaveAsBooking = async () => {
    if (!parsedData) return;
    const name = parsedData.guestName || customerName || '';
    const phone = parsedData.phone || customerPhone || '';
    const validation = validateCustomerContact(name, phone);
    if (!validation.isValid) {
      showToast?.(validation.error || 'Customer Name and a valid 10-digit Mobile Number are required before saving as Active Booking.', 'error');
      return;
    }

    const cleanPhone = validation.cleanPhone;
    const adv = parsedData.advanceSuggested || 0;
    const fare = parsedData.estimatedFare || 0;
    const driverPayout = parsedData.chauffeurPayout || Math.round(fare * 0.82);

    const payload = {
      name: validation.cleanName,
      phone: cleanPhone,
      pickupDate: parsedData.travelDate,
      pickupTime: parsedData.pickupTime,
      pickupAddress: `${parsedData.pickup} ➔ ${parsedData.drop}`,
      vehicleCategory: parsedData.vehicleCategory,
      partySize: parsedData.partySize,
      terminalFare: fare,
      chauffeurPayout: driverPayout,
      manifestStatus: 'Need Driver',
      financialClosure: 'Unreconciled'
    };

    try {
      fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (_) {}

    if (onBookingCreated) {
      onBookingCreated({
        bookingId: parsedData.quoteRefId,
        guestNamePhone: `${payload.name} (+91 ${cleanPhone})`,
        travelDateTime: `${payload.pickupDate} @ ${payload.pickupTime}`,
        pickupAddress: payload.pickupAddress,
        vehicleCategory: payload.vehicleCategory,
        partySize: payload.partySize,
        kycStatus: adv > 0 ? 'Advance Paid' : '₹500 Advance Pending',
        darshanStatus: parsedData.serviceCategory,
        assignedChauffeur: 'Unassigned',
        manifestStatus: 'Need Driver',
        terminalFare: fare,
        chauffeurPayout: driverPayout,
        companyMargin: fare - driverPayout,
        advancePaid: adv,
        balanceDue: Math.max(0, fare - adv),
        financialClosure: 'Unreconciled',
        reviewStatus: 'Pending'
      });
    }

    showToast?.(`Booking ${parsedData.quoteRefId} created in Stage 2 (Need Driver)!`, 'success');
    setParsedData(null);
    setInputText('');
    setCustomerPhone('');
    onClose?.();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-m3-outline-variant overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-m3-primary to-m3-primary px-4 py-3.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase">WhatsApp Enquiry & Booking Copilot</h2>
            <p className="text-[11px] text-white/80">Paste any booking engine WhatsApp message to extract quote instantly</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors"
              title="Close Parser"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Customer Phone & Name Input Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="ai-cust-phone" className="block text-xs font-bold text-m3-on-surface-variant mb-1">
              Customer WhatsApp Number (from chat header):
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined text-[18px] text-m3-outline absolute left-3 pointer-events-none">call</span>
              <input
                id="ai-cust-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9677980938 or +91 96779 80938"
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-m3-outline-variant bg-m3-surface-container-low focus:outline-none focus:ring-2 focus:ring-m3-primary font-mono-code"
              />
            </div>
          </div>
          <div>
            <label htmlFor="ai-cust-name" className="block text-xs font-bold text-m3-on-surface-variant mb-1">
              Customer Name (Optional):
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined text-[18px] text-m3-outline absolute left-3 pointer-events-none">person</span>
              <input
                id="ai-cust-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-m3-outline-variant bg-m3-surface-container-low focus:outline-none focus:ring-2 focus:ring-m3-primary"
              />
            </div>
          </div>
        </div>

        {/* Message Input Box */}
        <div>
          <label htmlFor="ai-inquiry-input" className="block text-xs font-bold text-m3-on-surface-variant mb-1">
            Paste WhatsApp Enquiry Message from Booking Engine:
          </label>
          <div className="relative">
            <textarea
              id="ai-inquiry-input"
              rows={4}
              className="w-full text-xs rounded-xl border border-m3-outline-variant p-3 pr-24 focus:outline-none focus:ring-2 focus:ring-m3-primary resize-none bg-m3-surface-container-low placeholder-slate-400 font-mono-code"
              placeholder={`Paste message, e.g.:
Hi Kalidass Travels, I need an Outstation Acting Driver:
📌 Quote Ref: #ENQ-101
Route: Chetpet, Chennai -> Rasipuram (~367 km)
Est. Total: ₹2,970`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              type="button"
              onClick={() => handleParse()}
              disabled={parsing || (!inputText.trim() && !customerPhone.trim())}
              className="absolute right-2 bottom-3 px-3.5 py-1.5 bg-m3-primary hover:bg-m3-primary/90 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              {parsing ? (
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
              )}
              <span>{parsing ? 'Parsing...' : 'AI Extract Quote'}</span>
            </button>
          </div>
        </div>

        {/* Extracted Result Card */}
        {parsedData && (
          <div className="p-4 rounded-m3-xl bg-m3-surface-container-low border border-m3-outline-variant/80 animate-fadeIn space-y-3">
            <div className="flex items-center justify-between border-b border-m3-outline-variant/50 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary">verified</span>
                <div>
                  <span className="text-xs font-bold text-m3-primary font-mono-code uppercase">{parsedData.quoteRefId}</span>
                  <span className="text-xs text-m3-on-surface-variant ml-2">• {parsedData.serviceCategory}</span>
                </div>
              </div>
              <span className="text-sm bg-m3-secondary-container text-m3-on-secondary-container font-bold px-3 py-0.5 rounded-full">
                ₹{parsedData.estimatedFare.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-m3-md bg-m3-surface-container-lowest border border-m3-outline-variant/60">
                <span className="text-m3-on-surface-variant block text-[10px] uppercase font-semibold">Customer</span>
                <span className="font-bold text-m3-on-surface block truncate">{parsedData.guestName}</span>
                <span className="text-m3-primary text-[11px] font-mono-code font-bold block">{parsedData.phone || 'No phone'}</span>
              </div>
              <div className="p-2.5 rounded-m3-md bg-m3-surface-container-lowest border border-m3-outline-variant/60">
                <span className="text-m3-on-surface-variant block text-[10px] uppercase font-semibold">Route & Type</span>
                <span className="font-bold text-m3-on-surface block truncate" title={`${parsedData.pickup} ➔ ${parsedData.drop}`}>
                  {parsedData.pickup} ➔ {parsedData.drop}
                </span>
                <span className="text-m3-on-surface-variant text-[11px] block">{parsedData.tripType}</span>
              </div>
              <div className="p-2.5 rounded-m3-md bg-m3-surface-container-lowest border border-m3-outline-variant/60">
                <span className="text-m3-on-surface-variant block text-[10px] uppercase font-semibold">Date & Time</span>
                <span className="font-bold text-m3-on-surface block">{parsedData.travelDate}</span>
                <span className="text-m3-primary text-[11px] font-bold block">{parsedData.pickupTime}</span>
              </div>
              <div className="p-2.5 rounded-m3-md bg-m3-surface-container-lowest border border-m3-outline-variant/60">
                <span className="text-m3-on-surface-variant block text-[10px] uppercase font-semibold">Vehicle & Pax</span>
                <span className="font-bold text-m3-on-surface block truncate">{parsedData.vehicleCategory}</span>
                <span className="text-m3-on-surface-variant text-[11px] block">{parsedData.partySize}</span>
              </div>
            </div>

            {/* Financial Split Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-m3-md bg-m3-surface-container-lowest border border-m3-outline-variant/70 text-xs">
              <span className="text-m3-on-surface-variant">Driver Net: <strong className="text-m3-on-surface font-mono-code">₹{parsedData.chauffeurPayout.toLocaleString('en-IN')}</strong></span>
              <span className="text-m3-on-surface-variant">Profit Margin: <strong className="text-m3-primary font-mono-code font-bold">+₹{parsedData.companyMargin.toLocaleString('en-IN')}</strong></span>
              <span className="text-m3-on-surface-variant">Advance Due: <strong className="text-m3-primary font-mono-code font-bold">₹{parsedData.advanceSuggested}</strong></span>
            </div>

            {/* 3 Direct Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveAsLead}
                className="flex-1 sm:flex-none px-4 py-2 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                title="Save into Stage 1 Quotes list"
              >
                <span className="material-symbols-outlined text-base">forum</span>
                <span>1. Save as Quote (Stage 1)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAsBooking}
                className="flex-1 sm:flex-none px-4 py-2 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-m3-1 transition-all"
                title="Confirm booking and move to Need Driver"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>2. Confirm Booking (Need Driver)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="px-3.5 py-2 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                title="Send confirmation reply to customer on WhatsApp"
              >
                <span className="material-symbols-outlined text-base">send</span>
                <span>Reply on WA</span>
              </button>

              <button
                type="button"
                onClick={handleCopyQuote}
                className="px-3 py-2 bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface border border-m3-outline-variant rounded-full text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'done' : 'content_copy'}</span>
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="px-2 py-2 text-m3-on-surface-variant hover:text-m3-on-surface text-xs ml-auto"
                title="Clear"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
