import React, { useState, useEffect, useRef } from 'react';
import { getNextEnquiryId, getNextBookingId } from '../../../utils/sequenceGenerator';
import { cleanLocationName } from '../../../utils/dateFormatter';
import { loadGoogleMaps } from '../../../lib/googleMapsLoader';

const QUICK_PICKUPS = [
  'Medavakkam, Chennai',
  'Pallikaranai, Chennai',
  'Chennai Airport (MAA)',
  'Chennai Central',
  'Tambaram',
  'OMR / Sholinganallur'
];

const QUICK_DROPS = [
  { label: 'Tirupati', km: 135 },
  { label: 'Pondicherry', km: 155 },
  { label: 'Tiruvannamalai', km: 195 },
  { label: 'Bangalore', km: 346 },
  { label: 'Kumbakonam', km: 295 },
  { label: 'Vellore', km: 140 },
  { label: 'Madurai', km: 462 },
  { label: 'Rameswaram', km: 559 },
  { label: 'Goa', km: 910 }
];

const TRIP_TYPES = [
  { id: 'Round Trip', label: '🔄 Round Trip' },
  { id: 'One Way Drop', label: '➡️ One Way Drop' },
  { id: 'Local Package', label: '🏙️ Local Package' },
  { id: 'Airport Transfer', label: '✈️ Airport' },
  { id: 'Acting Driver', label: '👨‍✈️ Acting Driver' }
];

const VEHICLES = [
  { id: 'Sedan (Dzire / Etios)', short: 'Sedan (Dzire)', seats: '4 Seats', rateKm: 14, bata: 400 },
  { id: 'SUV (Ertiga 6+1)', short: 'SUV Ertiga', seats: '6 Seats', rateKm: 18, bata: 500 },
  { id: 'Toyota Innova (7+1)', short: 'Toyota Innova', seats: '7 Seats', rateKm: 20, bata: 600 },
  { id: 'Innova Crysta (7+1)', short: 'Innova Crysta', seats: '7 Seats', rateKm: 23, bata: 700 },
  { id: 'Tempo Traveller (12+1)', short: 'Tempo Traveller', seats: '12 Seats', rateKm: 28, bata: 800 },
  { id: 'Force Urbania', short: 'Force Urbania', seats: '16 Seats', rateKm: 36, bata: 1100 },
  { id: 'Acting Driver (Customer Car)', short: 'Acting Driver', seats: 'Chauffeur', rateKm: 0, bata: 1200 }
];

export default function QuickBookingModal({
  isOpen,
  onClose,
  onSaveLead,
  onConfirmBooking,
  existingLeads = [],
  existingBookings = [],
  initialMode = 'booking', // 'booking' | 'enquiry'
  initialDate = '',
  showToast
}) {
  const pickupRef = useRef(null);
  const dropRef = useRef(null);
  const phoneRef = useRef(null);

  const getTodayIso = () => new Date().toISOString().split('T')[0];
  const getTomorrowIso = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [phone, setPhone] = useState('');
  const [guestName, setGuestName] = useState('');
  const [pickup, setPickup] = useState('Chennai');
  const [drop, setDrop] = useState('');
  const [tripType, setTripType] = useState('Round Trip');
  const [startDate, setStartDate] = useState(initialDate || getTomorrowIso());
  const [returnDate, setReturnDate] = useState('');
  const [pickupTime, setPickupTime] = useState('06:00 AM');
  const [customDateText, setCustomDateText] = useState('');
  const [vehicle, setVehicle] = useState('Sedan (Dzire / Etios)');
  const [fare, setFare] = useState('');
  const [advance, setAdvance] = useState('500');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (initialDate) {
        setStartDate(initialDate);
      }
      setTimeout(() => {
        phoneRef.current?.focus();
      }, 80);
    }
  }, [isOpen, initialDate]);

  // Attach Google Places Autocomplete when modal is open
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    loadGoogleMaps()
      .then(() => {
        if (!mounted || typeof window === 'undefined' || !window.google?.maps?.places) return;
        const opts = {
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'name']
        };
        if (pickupRef.current && !pickupRef.current._hasPac) {
          const pAuto = new window.google.maps.places.Autocomplete(pickupRef.current, opts);
          pickupRef.current._hasPac = true;
          pAuto.addListener('place_changed', () => {
            const pl = pAuto.getPlace();
            const addr = cleanLocationName(pl?.formatted_address || pl?.name || '');
            if (addr) setPickup(addr);
          });
        }
        if (dropRef.current && !dropRef.current._hasPac) {
          const dAuto = new window.google.maps.places.Autocomplete(dropRef.current, opts);
          dropRef.current._hasPac = true;
          dAuto.addListener('place_changed', () => {
            const pl = dAuto.getPlace();
            const addr = cleanLocationName(pl?.formatted_address || pl?.name || '');
            if (addr) setDrop(addr);
          });
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Format human-readable travel schedule string
  const buildTravelDateString = () => {
    if (customDateText.trim()) {
      return customDateText.trim();
    }
    const fmtDate = (iso) => {
      if (!iso) return '';
      try {
        const d = new Date(`${iso}T00:00:00`);
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (_) {
        return iso;
      }
    };
    const startStr = fmtDate(startDate) || 'Tomorrow';
    const endStr = returnDate && tripType === 'Round Trip' ? fmtDate(returnDate) : '';
    const dateRange = endStr && endStr !== startStr ? `${startStr} to ${endStr}` : startStr;
    return pickupTime ? `${dateRange} @ ${pickupTime}` : dateRange;
  };

  // Calculate number of days from startDate & returnDate
  const getDurationDays = () => {
    if (!startDate || !returnDate || tripType !== 'Round Trip') return 1;
    try {
      const s = new Date(`${startDate}T00:00:00`);
      const e = new Date(`${returnDate}T00:00:00`);
      const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 1;
    } catch (_) {
      return 1;
    }
  };

  // Auto-estimate fare helper when clicking a quick destination or vehicle
  const autoSuggestFare = (targetDrop, targetVehicle, targetTripType, sDate, rDate) => {
    const dStr = String(targetDrop || '').toLowerCase();
    const matchedDrop = QUICK_DROPS.find(q => dStr.includes(q.label.toLowerCase()));
    if (!matchedDrop) return;

    const vObj = VEHICLES.find(v => v.id === targetVehicle) || VEHICLES[0];
    if (vObj.id.includes('Acting Driver')) {
      setFare('1500');
      return;
    }

    let days = 1;
    if (sDate && rDate && targetTripType === 'Round Trip') {
      const s = new Date(`${sDate}T00:00:00`);
      const e = new Date(`${rDate}T00:00:00`);
      const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) days = diff;
    }

    const oneWayKm = matchedDrop.km;
    if (targetTripType === 'One Way Drop') {
      const billKm = Math.max(130, oneWayKm);
      const est = Math.ceil(((billKm * (vObj.rateKm + 2)) + vObj.bata) / 50) * 50;
      setFare(String(est));
    } else {
      const totalKm = Math.max(250 * days, oneWayKm * 2);
      const est = Math.ceil(((totalKm * vObj.rateKm) + (vObj.bata * days)) / 50) * 50;
      setFare(String(est));
    }
  };

  const getCleanPhone = () => phone.replace(/[^0-9]/g, '').slice(-10);

  // Action 1 & 2: Save as Enquiry (with optional WhatsApp Quote)
  const handleSaveEnquiry = (sendWhatsApp = false) => {
    setErrorMsg('');
    const cleanPhone = getCleanPhone();
    if (!cleanPhone && !guestName.trim()) {
      const msg = 'Please enter Customer Mobile Number or Name.';
      setErrorMsg(msg);
      showToast?.(msg, 'error');
      phoneRef.current?.focus();
      return;
    }

    const nameVal = guestName.trim() || 'Customer';
    const pickupVal = pickup.trim() || 'Chennai';
    const dropVal = drop.trim() || 'Outstation';
    const fareNum = Number(fare) || 0;
    const scheduleStr = buildTravelDateString();
    const days = getDurationDays();
    const tripLabel = tripType === 'Round Trip' && days > 1 ? `Round Trip (${days} Days)` : tripType;

    const newLead = {
      quoteId: getNextEnquiryId(existingLeads),
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      guestName: nameVal,
      phone: cleanPhone,
      sourcePage: cleanPhone ? `Direct Call (+91 ${cleanPhone})` : 'Direct Call',
      calculatorEngine: 'Admin Quick Desk',
      tripType: tripLabel,
      pickup: pickupVal,
      drop: dropVal,
      vehicle: vehicle || 'Sedan (Dzire / Etios)',
      estimatedFare: fareNum,
      travelDate: scheduleStr,
      notes: notes.trim(),
      status: sendWhatsApp ? 'Quote Sent - Waiting Advance' : 'Follow-Up Scheduled'
    };

    onSaveLead?.(newLead);

    if (sendWhatsApp) {
      const advNum = Number(advance) || 500;
      const msg =
        `🚕 *KALIDASS TRAVELS — TRIP QUOTE*\n\n` +
        `• Customer: ${nameVal}\n` +
        `• Trip: ${tripLabel}\n` +
        `• Route: ${pickupVal} ➔ ${dropVal}\n` +
        `• Dates: ${scheduleStr}\n` +
        `• Vehicle: ${newLead.vehicle}\n` +
        (fareNum > 0 ? `• Estimate Fare: ₹${fareNum.toLocaleString('en-IN')}\n` : '') +
        (notes.trim() ? `• Rate Details: ${notes.trim()}\n` : '') +
        `\n🔒 *To Confirm Booking:*\n` +
        `• Advance to book: *₹${advNum.toLocaleString('en-IN')}* via UPI: *8939539211@okbizaxis* (Kalidass Travels)\n` +
        `📞 24/7 Helpline: +91 89395 39211`;
      window.open(
        cleanPhone.length === 10
          ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
          : `https://wa.me/?text=${encodeURIComponent(msg)}`,
        '_blank'
      );
    }

    onClose?.();
  };

  // Action 3: Confirm Booking Directly (Move to Step 2 Active Trips & Calendar)
  const handleConfirmDirectBooking = () => {
    setErrorMsg('');
    const cleanPhone = getCleanPhone();
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      const msg = 'Please enter a valid 10-digit Mobile Number (e.g. 9944649858) to confirm booking.';
      setErrorMsg(msg);
      showToast?.(msg, 'error');
      phoneRef.current?.focus();
      return;
    }

    const nameVal = guestName.trim() || 'Customer';
    const pickupVal = pickup.trim() || 'Chennai';
    const dropVal = drop.trim() || 'Outstation';
    const fareNum = Number(fare) || 0;
    const advNum = Number(advance) || 0;
    const driverShare = Math.round(fareNum * 0.82);
    const scheduleStr = buildTravelDateString();
    const days = getDurationDays();
    const tripLabel = tripType === 'Round Trip' && days > 1 ? `Round Trip (${days} Days)` : tripType;
    const vObj = VEHICLES.find(v => v.id === vehicle);

    const newBooking = {
      bookingId: getNextBookingId(existingBookings),
      guestNamePhone: `${nameVal} (+91 ${cleanPhone})`,
      travelDateTime: scheduleStr,
      pickupAddress: `${pickupVal} ➔ ${dropVal}`,
      vehicleCategory: vehicle || 'Sedan (Dzire / Etios)',
      partySize: vObj?.seats || '4 Seats',
      kycStatus: advNum > 0 ? `Advance Paid: ₹${advNum}` : 'Confirmed',
      darshanStatus: tripLabel,
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Need Driver',
      terminalFare: fareNum,
      chauffeurPayout: driverShare,
      companyMargin: Math.max(0, fareNum - driverShare),
      advancePaid: advNum,
      balanceDue: Math.max(0, fareNum - advNum),
      financialClosure: 'Unreconciled',
      reviewStatus: 'Pending',
      notes: notes.trim()
    };

    onConfirmBooking?.(newBooking);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-400 text-[22px]">bolt</span>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight">
                Quick Add Booking / Enquiry (1-Minute Form)
              </h3>
              <p className="text-[11px] text-slate-300">
                Phone ➔ Name ➔ From & To ➔ Date & Trip Type ➔ Vehicle ➔ Fare
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body (Compact, Zero-Clutter 5-Step Layout) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 font-bold text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Phone & Customer Name (Right at the Top!) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                1. Customer Mobile Number <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">+91</span>
                <input
                  ref={phoneRef}
                  type="tel"
                  placeholder="99446 49858"
                  value={phone}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const digits = raw.replace(/[^0-9]/g, '');
                    const clean10 = digits.length > 10 && digits.startsWith('91') ? digits.slice(2, 12) : digits.slice(0, 10);
                    setPhone(clean10);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-11 pr-3 py-2 rounded-lg border border-slate-300 bg-white font-mono-code font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                2. Customer Name <span className="text-[10px] font-normal text-slate-500">(Optional - defaults to Customer)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh / Sir"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* STEP 2: From (Pickup) & To (Drop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                3. Pickup Location (From)
              </label>
              <input
                ref={pickupRef}
                type="text"
                placeholder="e.g. Purvankara Pallikaranai, Chennai"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {QUICK_PICKUPS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPickup(p)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                      pickup === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {p.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                4. Drop Destination (To)
              </label>
              <input
                ref={dropRef}
                type="text"
                placeholder="e.g. Goa / Tirupati / Pondicherry"
                value={drop}
                onChange={(e) => {
                  setDrop(e.target.value);
                  autoSuggestFare(e.target.value, vehicle, tripType, startDate, returnDate);
                }}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {QUICK_DROPS.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => {
                      setDrop(d.label);
                      autoSuggestFare(d.label, vehicle, tripType, startDate, returnDate);
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                      drop.toLowerCase() === d.label.toLowerCase()
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 3: Trip Type & Travel Date */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                5. Trip Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TRIP_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTripType(t.id);
                      if (t.id === 'Acting Driver') {
                        setVehicle('Acting Driver (Customer Car)');
                      }
                      autoSuggestFare(drop, vehicle, t.id, startDate, returnDate);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      tripType === t.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">Departure Date</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { setStartDate(getTodayIso()); setCustomDateText(''); }}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Today
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => { setStartDate(getTomorrowIso()); setCustomDateText(''); }}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCustomDateText('');
                    autoSuggestFare(drop, vehicle, tripType, e.target.value, returnDate);
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold text-xs text-slate-900"
                />
              </div>

              {tripType === 'Round Trip' && (
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Return Date <span className="text-[10px] font-normal text-slate-500">(Multi-day)</span>
                  </label>
                  <input
                    type="date"
                    min={startDate}
                    value={returnDate}
                    onChange={(e) => {
                      setReturnDate(e.target.value);
                      setCustomDateText('');
                      autoSuggestFare(drop, vehicle, tripType, startDate, e.target.value);
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold text-xs text-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Pickup Time
                </label>
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold text-xs text-slate-900"
                >
                  {[
                    '04:00 AM', '04:30 AM', '05:00 AM', '05:30 AM', '06:00 AM', '06:30 AM',
                    '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '12:00 PM', '02:00 PM',
                    '04:00 PM', '06:00 PM', '08:00 PM', '10:00 PM'
                  ].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* STEP 4: Select Vehicle */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              6. Select Vehicle (என்ன வண்டி)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {VEHICLES.map((v) => {
                const isSelected = vehicle === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVehicle(v.id);
                      autoSuggestFare(drop, v.id, tripType, startDate, returnDate);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 font-semibold'
                    }`}
                  >
                    <div className="text-xs leading-tight">{v.short}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      {v.seats} {v.rateKm > 0 ? `• ₹${v.rateKm}/km` : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 5: Fare, Advance & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Total / Est. Fare (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 77500"
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono-code font-black text-sm text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Advance Paid (₹)
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="500"
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono-code font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="flex gap-1 mt-1">
                {['0', '500', '1000', '2000', '5000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAdvance(amt)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      advance === amt
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Notes / Per-KM Details
              </label>
              <input
                type="text"
                placeholder="e.g. ₹36/km + ₹1100 bata, tolls extra"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer Buttons */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSaveEnquiry(false)}
            className="h-10 px-4 rounded-xl bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">bookmark_add</span>
            <span>1. Save as Enquiry</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveEnquiry(true)}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">chat</span>
              <span>2. Save & Send WA Quote</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmDirectBooking}
              className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>3. Confirm Booking (Active Trips)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
