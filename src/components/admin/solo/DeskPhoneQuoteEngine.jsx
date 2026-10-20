import React, { useState, useMemo } from 'react';
import tariffConfig from '../../../data/tariff_config.json';
import tnBusFares from '../../../data/tnBusFares.json';
import { buildWhatsAppUrl, buildMapsBlock } from '../../../utils/whatsapp';

// Preset high-ticket highway outstation and airport routes targeting Google Ads & Outstation callers
const POPULAR_CALL_ROUTES = [
  { label: 'Tirupati Balaji Darshan', destination: 'Tirupati', distanceKm: 135, defaultType: 'Round Trip' },
  { label: 'Vellore CMC / Golden Temple', destination: 'Vellore', distanceKm: 138, defaultType: 'One Way Drop' },
  { label: 'Pondicherry / Auroville (ECR)', destination: 'Pondicherry', distanceKm: 151, defaultType: 'Round Trip' },
  { label: 'Tiruvannamalai Girivalam', destination: 'Tiruvannamalai', distanceKm: 195, defaultType: 'Round Trip' },
  { label: 'Kumbakonam Navagraha', destination: 'Kumbakonam', distanceKm: 295, defaultType: 'Round Trip' },
  { label: 'Bangalore / Bengaluru (NH48)', destination: 'Bangalore', distanceKm: 346, defaultType: 'One Way Drop' },
  { label: 'Trichy / Srirangam Temple', destination: 'Trichy', distanceKm: 332, defaultType: 'Round Trip' },
  { label: 'Kanchipuram Silk & Temples', destination: 'Kanchipuram', distanceKm: 75, defaultType: 'Round Trip' },
  { label: 'Mahabalipuram Beach & Shore', destination: 'Mahabalipuram', distanceKm: 58, defaultType: 'Round Trip' },
  { label: 'Madurai Meenakshi Amman', destination: 'Madurai', distanceKm: 462, defaultType: 'Round Trip' },
  { label: 'Rameswaram Dham Pilgrimage', destination: 'Rameswaram', distanceKm: 559, defaultType: 'Round Trip' },
  { label: 'Kodaikanal Hill Station', destination: 'Kodaikanal', distanceKm: 528, defaultType: 'Round Trip' }
];

const PICKUP_HUBS = [
  'Chennai International Airport (MAA)',
  'Chennai Central (MAS) / Egmore Railway Station',
  'Medavakkam (Office / South Chennai)',
  'Velachery / OMR IT Corridor',
  'Tambaram / Chromepet',
  'Anna Nagar / Koyambedu CMBT',
  'T. Nagar / Kodambakkam'
];

const ENQUIRY_SOURCES = [
  { id: 'Google Ads Call', label: 'Google Ads (Call Campaign)', icon: 'campaign', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'Old / Repeat Customer', label: 'Old / Repeat Customer', icon: 'verified_user', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'Website Phone Call', label: 'Website Direct Call', icon: 'call', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'WhatsApp Direct', label: 'WhatsApp Inquiry', icon: 'chat', color: 'bg-green-100 text-green-800 border-green-300' }
];

const VEHICLE_KEYS = [
  { key: 'Swift Dzire', name: 'Sedan (Dzire / Etios)', pax: '4 Pax', bags: '2 Bags' },
  { key: 'Maruti Ertiga', name: 'SUV (Ertiga 6+1)', pax: '6 Pax', bags: '3 Bags' },
  { key: 'Innova Crysta', name: 'Innova Crysta (7+1)', pax: '7 Pax', bags: '4 Bags' },
  { key: 'Tempo Traveller', name: 'Tempo Traveller (12+1)', pax: '12 Pax', bags: '8 Bags' }
];

export default function DeskPhoneQuoteEngine({
  isOpen = true,
  isPageMode = false,
  onClose,
  onSaveLead,
  onConfirmBooking,
  showToast
}) {
  const [callerPhone, setCallerPhone] = useState('');
  const [callerName, setCallerName] = useState('');
  const [source, setSource] = useState('Google Ads Call');
  const [pickupHub, setPickupHub] = useState('Chennai International Airport (MAA)');
  const [customPickup, setCustomPickup] = useState('');
  const [useCustomPickup, setUseCustomPickup] = useState(false);

  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [customDrop, setCustomDrop] = useState('');
  const [useCustomDrop, setUseCustomDrop] = useState(false);
  const [customDistanceKm, setCustomDistanceKm] = useState(150);

  const [tripType, setTripType] = useState('Round Trip');
  const [travelDays, setTravelDays] = useState(1);
  const [travelDateTime, setTravelDateTime] = useState('');

  const [selectedVehicle, setSelectedVehicle] = useState('Swift Dzire');
  const [overrideFare, setOverrideFare] = useState('');
  const [copied, setCopied] = useState(false);

  // Derive active route & distance
  const activePickup = useCustomPickup ? (customPickup.trim() || 'Chennai') : pickupHub;
  const activeDrop = useCustomDrop
    ? (customDrop.trim() || 'Outstation')
    : (POPULAR_CALL_ROUTES[selectedRouteIdx]?.destination || 'Tirupati');

  const distanceKmOneWay = useMemo(() => {
    if (useCustomDrop) {
      return Number(customDistanceKm) || 150;
    }
    const matched = POPULAR_CALL_ROUTES[selectedRouteIdx];
    return matched ? matched.distanceKm : 150;
  }, [useCustomDrop, customDistanceKm, selectedRouteIdx]);

  // Automated Tariff Calculation Engine
  const rates = useMemo(() => {
    const vConfig = tariffConfig.vehicles;
    const result = {};

    VEHICLE_KEYS.forEach(({ key }) => {
      const v = vConfig[key] || vConfig['Swift Dzire'];
      let calculated = 0;
      let minKm = v.min_km_per_day * travelDays;
      let driverBataTotal = v.driver_bata * travelDays;

      if (tripType === 'Round Trip') {
        const totalKm = distanceKmOneWay * 2;
        const billableKm = Math.max(minKm, totalKm);
        calculated = (billableKm * v.round_trip_rate) + driverBataTotal;
      } else if (tripType === 'One Way Drop') {
        const billableKm = Math.max(v.min_drop_km || 130, distanceKmOneWay);
        // Standard one-way formula: km * one_way_rate + 1 day bata
        calculated = (billableKm * v.one_way_rate) + v.driver_bata;
      } else if (tripType === 'Airport Transfer') {
        // MAA Airport flat or KM rate
        const billableKm = Math.max(130, distanceKmOneWay);
        calculated = (billableKm * v.one_way_rate) + 300; // Airport parking/bata
      } else {
        // Local 8hr / 80km package
        calculated = v.local_8hr_pkg || 2200;
      }

      // Round to nearest 50
      const finalFare = Math.round(calculated / 50) * 50;
      const driverShare = Math.round((finalFare * 0.82) / 50) * 50;
      const companyMargin = finalFare - driverShare;

      result[key] = {
        totalFare: finalFare,
        driverShare,
        companyMargin,
        advance: 500,
        balanceDue: Math.max(0, finalFare - 500),
        ratePerKm: tripType === 'One Way Drop' ? v.one_way_rate : v.round_trip_rate
      };
    });

    return result;
  }, [distanceKmOneWay, tripType, travelDays]);

  // Active vehicle final fare (with operator override capability)
  const currentVehicleRate = rates[selectedVehicle] || rates['Swift Dzire'];
  const effectiveFare = Number(overrideFare) > 0 ? Number(overrideFare) : currentVehicleRate.totalFare;
  const effectiveDriverShare = Math.round((effectiveFare * 0.82) / 50) * 50;
  const effectiveProfit = effectiveFare - effectiveDriverShare;
  const effectiveAdvance = 500;
  const effectiveBalance = Math.max(0, effectiveFare - effectiveAdvance);

  const [showQrModal, setShowQrModal] = useState(false);
  const [smsCopied, setSmsCopied] = useState(false);

  // Auto-generate professional Quote ID
  const quoteId = useMemo(() => `#QT-${Date.now().toString().slice(-4)}`, []);

  // UPI QR Code URL for ₹500 advance
  const upiQrUrl = useMemo(() => {
    const upiStr = `upi://pay?pa=8939539211@okbizaxis&pn=Kalidass%20Travels&am=500&cu=INR&tn=${encodeURIComponent(`Advance ${quoteId}`)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(upiStr)}`;
  }, [quoteId]);

  // Normal SMS text template (when customer asks for SMS instead of WhatsApp)
  const smsMessage = useMemo(() => {
    return (
      `Kalidass Travels Quote ${quoteId}: ` +
      `${activePickup} to ${activeDrop} | ${selectedVehicle} (${tripType}) | ` +
      `Fare: Rs.${effectiveFare.toLocaleString('en-IN')}. ` +
      `To lock cab, GPay/PhonePe Rs.500 advance to UPI: 8939539211@okbizaxis & share screenshot on WA/SMS. ` +
      `Ph: 8939539211`
    );
  }, [quoteId, activePickup, activeDrop, selectedVehicle, tripType, effectiveFare]);

  // Professional WhatsApp Quotation Template
  const whatsAppMessage = useMemo(() => {
    const custLabel = callerName.trim() ? callerName.trim() : 'Sir/Madam';
    const mapsBlock = buildMapsBlock(activePickup, activeDrop, tripType);

    return (
      `*KALIDASS TRAVELS CHENNAI — OFFICIAL QUOTATION*\n` +
      `📌 *Quote Ref:* ${quoteId} (Rate Locked)\n\n` +
      `Namaskaram ${custLabel}! 🙏 Thank you for calling Kalidass Travels.\n\n` +
      `📍 *Route:* ${activePickup} ➔ ${activeDrop}\n` +
      `🚗 *Vehicle:* ${selectedVehicle} (${tripType})\n` +
      `🗓 *Schedule:* ${travelDateTime}\n` +
      `🛣️ *Distance:* ~${distanceKmOneWay * (tripType === 'Round Trip' ? 2 : 1)} km (Highway Route)\n\n` +
      `💰 *All-Inclusive Fare:* *Rs.${effectiveFare.toLocaleString('en-IN')}*\n` +
      `   • Includes Cab, Fuel & Driver Allowance (Bata)\n` +
      `   • Zero Surge Pricing | Clean AC Cab | Verified Chauffeur\n\n` +
      `🔒 *To Lock Your Cab & Confirm Duty:*\n` +
      `Kindly pay *Rs.500 Advance* via Google Pay / PhonePe to:\n` +
      `UPI ID: *8939539211@okbizaxis* (Kalidass Travels)\n` +
      `and share the screenshot here. Balance *Rs.${effectiveBalance.toLocaleString('en-IN')}* payable to driver directly.` +
      mapsBlock
    );
  }, [quoteId, callerName, activePickup, activeDrop, selectedVehicle, tripType, travelDateTime, distanceKmOneWay, effectiveFare, effectiveBalance]);

  const handleOpenWhatsApp = () => {
    const clean = callerPhone.replace(/[^0-9]/g, '').slice(-10);
    const encoded = encodeURIComponent(whatsAppMessage);
    if (clean.length === 10) {
      window.open(`https://wa.me/91${clean}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
    showToast?.(`WhatsApp quote opened for ${clean ? '+91 ' + clean : 'Customer'}!`, 'success');
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setCopied(true);
    showToast?.('Quotation message copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySms = () => {
    navigator.clipboard.writeText(smsMessage);
    setSmsCopied(true);
    showToast?.('SMS quotation copied to clipboard!', 'success');
    setTimeout(() => setSmsCopied(false), 2500);
  };

  const handleSaveToStage1Lead = () => {
    const clean = callerPhone.replace(/[^0-9]/g, '').slice(-10);
    const newLead = {
      quoteId,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      guestName: callerName.trim() || (clean ? `Caller (${clean})` : 'Phone Caller'),
      sourcePage: clean ? `${source} (+91 ${clean})` : source,
      calculatorEngine: `Desk Rate Calculator (${source})`,
      tripType,
      pickup: activePickup,
      drop: activeDrop,
      vehicle: selectedVehicle,
      distanceKm: String(distanceKmOneWay * (tripType === 'Round Trip' ? 2 : 1)),
      estimatedFare: effectiveFare,
      travelDate: travelDateTime,
      status: 'Quote Sent - Waiting Advance',
      metadata: `Source: ${source} | Fare: ₹${effectiveFare} | Margin: +₹${effectiveProfit}`
    };

    onSaveLead?.(newLead);
    showToast?.(`Enquiry ${quoteId} saved into Stage 1 Quotes!`, 'success');
    onClose?.();
  };

  const handleConfirmAdvancePaid = () => {
    const clean = callerPhone.replace(/[^0-9]/g, '').slice(-10) || '9840100000';
    const newBooking = {
      bookingId: quoteId.replace('#QT-', '#KT-'),
      guestNamePhone: `${callerName.trim() || 'Customer'} (+91 ${clean})`,
      travelDateTime,
      pickupAddress: `${activePickup} ➔ ${activeDrop}`,
      vehicleCategory: selectedVehicle,
      partySize: selectedVehicle.includes('Tempo') ? '12 Pax' : selectedVehicle.includes('Crysta') ? '7 Pax' : selectedVehicle.includes('Ertiga') ? '6 Pax' : '4 Pax',
      kycStatus: 'Advance Paid',
      darshanStatus: source,
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Need Driver',
      terminalFare: effectiveFare,
      chauffeurPayout: effectiveDriverShare,
      companyMargin: effectiveProfit,
      advancePaid: effectiveAdvance,
      balanceDue: effectiveBalance,
      financialClosure: 'Unreconciled',
      reviewStatus: 'Pending'
    };

    onConfirmBooking?.(newBooking);
    showToast?.(`Booking ${newBooking.bookingId} confirmed with ₹500 advance! Ready for Driver Assignment.`, 'success');
    onClose?.();
  };

  if (!isOpen && !isPageMode) return null;

  const cardContent = (
    <div className={`bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-2xl shadow-m3-2 w-full ${isPageMode ? '' : 'max-w-4xl max-h-[92vh]'} overflow-hidden flex flex-col font-sans`}>
        {/* Header */}
        <div className="p-4 border-b border-m3-outline-variant bg-gradient-to-r from-m3-primary to-m3-primary/95 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]">calculate</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-m3-title-m font-bold tracking-tight">Phone Call & Instant Rate Calculator</h3>
                <span className="text-[11px] font-mono-code font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  {quoteId}
                </span>
              </div>
              <p className="text-white/80 text-xs mt-0.5">
                Official Kalidass Tariff Engine • Instant quote calculation for Inbound Callers & WhatsApp leads
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/calculator/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
              title="Open customer-facing booking engine"
            >
              <span>Public Engine</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* 1. Caller Phone, Name & Source Row */}
          <div className="bg-m3-surface-container-low p-3.5 rounded-m3-xl border border-m3-outline-variant/60 space-y-3">
            <div className="text-m3-label-m font-bold text-m3-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-m3-primary text-[18px]">person_add</span>
              <span>1. Caller Details & Channel</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-m3-on-surface-variant mb-1">
                  Customer Mobile Number (10 Digits) *
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined text-[18px] text-m3-outline absolute left-3 pointer-events-none">call</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="98401 23456"
                    value={callerPhone}
                    onChange={(e) => setCallerPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest focus:ring-2 focus:ring-m3-primary font-mono-code"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-m3-on-surface-variant mb-1">
                  Customer Name (Optional)
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined text-[18px] text-m3-outline absolute left-3 pointer-events-none">person</span>
                  <input
                    type="text"
                    placeholder="e.g. Senthil Kumar"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest focus:ring-2 focus:ring-m3-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-m3-on-surface-variant mb-1">
                  Enquiry Channel / Source *
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full p-2 text-xs font-bold rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest text-m3-on-surface"
                >
                  {ENQUIRY_SOURCES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Route & Trip Parameters */}
          <div className="bg-m3-surface-container-low p-3.5 rounded-m3-xl border border-m3-outline-variant/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-m3-label-m font-bold text-m3-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-m3-primary text-[18px]">route</span>
                <span>2. Route & Trip Type</span>
              </span>
              <div className="flex items-center gap-1">
                {['Round Trip', 'One Way Drop', 'Airport Transfer', 'Local Package'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTripType(t)}
                    className={`h-7 px-2.5 rounded-m3-full text-[11px] font-bold border transition-colors ${
                      tripType === t
                        ? 'bg-m3-primary text-white border-m3-primary shadow-xs'
                        : 'bg-m3-surface text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Pickup Location */}
              <div>
                <label className="block text-xs font-semibold text-m3-on-surface-variant mb-1">
                  Pickup Location
                </label>
                {useCustomPickup ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Custom pickup area..."
                      value={customPickup}
                      onChange={(e) => setCustomPickup(e.target.value)}
                      className="w-full p-2 text-xs rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest"
                    />
                    <button
                      type="button"
                      onClick={() => setUseCustomPickup(false)}
                      className="text-xs text-m3-primary font-bold px-1"
                      title="Select standard hub"
                    >
                      Hubs
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <select
                      value={pickupHub}
                      onChange={(e) => setPickupHub(e.target.value)}
                      className="w-full p-2 text-xs font-semibold rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest"
                    >
                      {PICKUP_HUBS.map((h, i) => (
                        <option key={i} value={h}>{h}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setUseCustomPickup(true)}
                      className="text-xs text-m3-primary font-bold px-1 whitespace-nowrap"
                      title="Type custom address"
                    >
                      + Custom
                    </button>
                  </div>
                )}
              </div>

              {/* Destination Route */}
              <div>
                <label className="block text-xs font-semibold text-m3-on-surface-variant mb-1">
                  Destination Route & KM
                </label>
                {useCustomDrop ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Destination city..."
                        value={customDrop}
                        onChange={(e) => setCustomDrop(e.target.value)}
                        className="w-full p-2 text-xs rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest"
                      />
                      <button
                        type="button"
                        onClick={() => setUseCustomDrop(false)}
                        className="text-xs text-m3-primary font-bold px-1"
                        title="Back to popular routes"
                      >
                        List
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-m3-on-surface-variant text-[11px]">One-Way KM:</span>
                      <input
                        type="number"
                        value={customDistanceKm}
                        onChange={(e) => setCustomDistanceKm(e.target.value)}
                        className="w-20 p-1 text-xs font-bold rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest font-mono-code"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <select
                      value={selectedRouteIdx}
                      onChange={(e) => setSelectedRouteIdx(Number(e.target.value))}
                      className="w-full p-2 text-xs font-semibold rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest"
                    >
                      {POPULAR_CALL_ROUTES.map((r, i) => (
                        <option key={i} value={i}>
                          {r.label} (~{r.distanceKm} km)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setUseCustomDrop(true)}
                      className="text-xs text-m3-primary font-bold px-1 whitespace-nowrap"
                      title="Custom destination"
                    >
                      + Custom
                    </button>
                  </div>
                )}
              </div>

              {/* Travel Date & Time */}
              <div>
                <label className="block text-xs font-semibold text-m3-on-surface-variant mb-1">
                  Pickup Schedule
                </label>
                <input
                  type="text"
                  value={travelDateTime}
                  onChange={(e) => setTravelDateTime(e.target.value)}
                  placeholder="Tomorrow @ 05:00 AM"
                  className="w-full p-2 text-xs font-semibold rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest"
                />
              </div>

              {/* Number of Days (for Round Trip) */}
              <div>
                <label className="block text-xs font-semibold text-m3-on-surface-variant mb-1">
                  Trip Duration (Days)
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTravelDays(d)}
                      className={`flex-1 h-8 rounded-m3-sm text-xs font-bold border transition-colors ${
                        travelDays === d
                          ? 'bg-m3-primary-container text-m3-on-primary-container border-m3-primary'
                          : 'bg-m3-surface-container-lowest text-m3-on-surface-variant border-m3-outline-variant'
                      }`}
                    >
                      {d} {d === 1 ? 'Day' : 'Days'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Live Vehicle Rate Cards (1-Tap Selection) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-m3-label-m font-bold text-m3-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-m3-primary text-[18px]">directions_car</span>
                <span>3. Live Cabs & Auto-Calculated Fares (Click to select)</span>
              </span>
              <span className="text-xs text-m3-on-surface-variant">
                Distance: <strong>~{distanceKmOneWay * (tripType === 'Round Trip' ? 2 : 1)} km</strong> • All-inclusive
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {VEHICLE_KEYS.map((v) => {
                const isSelected = selectedVehicle === v.key;
                const vRate = rates[v.key];

                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => {
                      setSelectedVehicle(v.key);
                      setOverrideFare('');
                    }}
                    className={`p-3 rounded-m3-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-m3-primary-container/40 border-2 border-m3-primary shadow-m3-1'
                        : 'bg-m3-surface-container-lowest border-m3-outline-variant/70 hover:bg-m3-surface-container-low'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-m3-primary text-white flex items-center justify-center text-[13px]">
                        ✓
                      </span>
                    )}
                    <div className="font-bold text-sm text-m3-on-surface truncate pr-6">{v.name}</div>
                    <div className="text-[11px] text-m3-on-surface-variant mb-2">
                      {v.pax} • {v.bags}
                    </div>

                    <div className="text-xl font-black text-m3-primary">
                      Rs.{vRate.totalFare.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-m3-on-surface-variant mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Advance:</span>
                        <span className="font-bold text-m3-on-surface">Rs.{vRate.advance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Driver Net:</span>
                        <span className="font-semibold text-m3-success">Rs.{vRate.driverShare.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Margin:</span>
                        <span className="font-bold text-m3-primary">+Rs.{vRate.companyMargin.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Negotiation Override & Financial Split Box */}
          <div className="p-3.5 rounded-m3-xl bg-m3-surface-container-low border border-m3-outline-variant/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-m3-on-surface">Negotiated Fare Override (if customer bargained on call):</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 font-bold text-m3-on-surface-variant">₹</span>
                <input
                  type="number"
                  placeholder={String(currentVehicleRate.totalFare)}
                  value={overrideFare}
                  onChange={(e) => setOverrideFare(e.target.value)}
                  className="pl-6 pr-2 py-1 w-28 font-mono-code font-bold text-sm rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest text-m3-primary"
                />
              </div>
              {overrideFare && (
                <button
                  type="button"
                  onClick={() => setOverrideFare('')}
                  className="text-xs text-m3-error font-semibold hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 font-semibold">
              <span>Selected Fare: <strong className="text-sm font-bold text-m3-on-surface">Rs.{effectiveFare.toLocaleString('en-IN')}</strong></span>
              <span>Driver Share (82%): <strong className="text-m3-success font-bold">Rs.{effectiveDriverShare.toLocaleString('en-IN')}</strong></span>
              <span>Your Profit (18%): <strong className="text-m3-primary font-bold">+Rs.{effectiveProfit.toLocaleString('en-IN')}</strong></span>
              <span>Advance to Lock: <strong className="text-m3-on-surface font-bold">Rs.{effectiveAdvance}</strong></span>
            </div>
          </div>

          {/* 5. Live WhatsApp & SMS Quote Preview + QR Code */}
          <div className="border border-m3-outline-variant/70 rounded-m3-xl p-3.5 bg-m3-surface-container-lowest space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-m3-label-m font-bold text-m3-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-green-600 text-[18px]">chat</span>
                <span>WhatsApp & SMS Quotation Text</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(!showQrModal)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-m3-full border flex items-center gap-1 transition-colors ${
                    showQrModal
                      ? 'bg-m3-primary text-white border-m3-primary'
                      : 'bg-m3-surface-container-low text-m3-on-surface border-m3-outline-variant hover:bg-m3-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
                  <span>{showQrModal ? 'Hide QR' : 'Show ₹500 QR Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopySms}
                  className="text-xs font-semibold text-m3-on-surface-variant hover:text-m3-on-surface flex items-center gap-1 border border-m3-outline-variant px-2 py-0.5 rounded-m3-sm"
                  title="Copy short text for normal SMS"
                >
                  <span className="material-symbols-outlined text-[14px]">sms</span>
                  <span>{smsCopied ? 'SMS Copied!' : 'Copy SMS'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyQuote}
                  className="text-xs font-semibold text-m3-on-surface-variant hover:text-m3-on-surface flex items-center gap-1 border border-m3-outline-variant px-2 py-0.5 rounded-m3-sm"
                  title="Copy full WhatsApp quotation"
                >
                  <span className="material-symbols-outlined text-[14px]">{copied ? 'done' : 'content_copy'}</span>
                  <span>{copied ? 'WA Copied!' : 'Copy WA'}</span>
                </button>
              </div>
            </div>

            {/* UPI QR Code Preview Card */}
            {showQrModal && (
              <div className="p-3.5 rounded-m3-lg bg-emerald-50/80 border border-emerald-300 text-xs flex flex-col sm:flex-row items-center gap-4 animate-fadeIn">
                <div className="bg-white p-2 rounded-xl shadow-xs border border-emerald-200 shrink-0">
                  <img
                    src={upiQrUrl}
                    alt="Kalidass Travels ₹500 Advance UPI QR Code"
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold text-emerald-900 text-sm">
                    <span className="material-symbols-outlined text-emerald-700 text-[18px]">verified</span>
                    <span>Kalidass Travels UPI QR Code (₹500 Advance)</span>
                  </div>
                  <div className="text-emerald-950 font-mono-code font-bold">
                    UPI ID: <span className="bg-white px-2 py-0.5 rounded border border-emerald-300">8939539211@okbizaxis</span>
                  </div>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    Share this QR code image with the customer on WhatsApp. Customer can scan with <strong>Google Pay, PhonePe, or Paytm</strong> to pay the ₹500 advance. Once received, click <strong>"₹500 Advance Paid"</strong> below.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <a
                      href={upiQrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-900 font-bold rounded-m3-full border border-emerald-400 text-[11px] flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      <span>Download / Full Image</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            <pre className="text-[11px] font-mono-code p-2.5 rounded-m3-md bg-m3-surface-container-low text-m3-on-surface whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto border border-m3-outline-variant/40">
              {whatsAppMessage}
            </pre>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-3.5 border-t border-m3-outline-variant bg-m3-surface-container-low flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-m3-on-surface-variant">
            {callerPhone ? (
              <span>Customer: <strong className="text-m3-on-surface">+91 {callerPhone.replace(/[^0-9]/g, '').slice(-10)}</strong></span>
            ) : (
              <span className="text-amber-700 font-medium">⚠️ Enter 10-digit mobile number above to send WhatsApp quote directly</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-m3-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>1. Send Quote on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="h-10 px-3.5 bg-white border border-m3-outline-variant hover:bg-m3-surface-container-high text-m3-on-surface rounded-m3-full text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Show QR Code to share with customer on WhatsApp"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-700">qr_code_2</span>
              <span>QR Code (₹500)</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToStage1Lead}
              className="h-10 px-4 bg-m3-secondary-container hover:bg-m3-surface-container-high text-m3-on-secondary-container rounded-m3-full text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
              <span>2. Save to Stage 1 Quotes</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmAdvancePaid}
              className="h-10 px-4 bg-m3-primary hover:bg-m3-primary/90 text-white rounded-m3-full text-xs font-bold flex items-center gap-1.5 shadow-m3-1 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>3. ₹500 Advance Paid (Confirm Duty)</span>
            </button>
          </div>
        </div>
      </div>
    );

  if (isPageMode) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {cardContent}
    </div>
  );
}
