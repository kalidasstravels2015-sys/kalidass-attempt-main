import React, { useState, useEffect, useMemo } from 'react';
import ContactPickerControl from './ContactPickerControl.jsx';
import {
  TRIP_CATEGORIES,
  LOCAL_PACKAGES,
  parseWhatsAppBookingText,
  addDaysToIsoDate,
  computeTripDays,
  normalizePhoneNumber
} from '../../utils/adminBookingHelper.js';

const TRIP_TYPE_META = [
  { id: 'Local Chennai Rental', short: 'Local Package', icon: 'schedule', hint: '4/8/10/12 Hr Chennai' },
  { id: 'Outstation Round Trip', short: 'Outstation Round', icon: 'sync_alt', hint: 'Multi-day / Km pkg' },
  { id: 'Outstation One-Way Drop', short: 'One-Way Drop', icon: 'trending_flat', hint: 'Point-to-point drop' },
  { id: 'Multi-Day Custom Itinerary', short: 'Multi-Day Custom', icon: 'calendar_month', hint: 'Day 1 / 2 / 3 plan' },
  { id: 'Tour Package', short: 'Tour Package', icon: 'temple_hindu', hint: 'Tirupati, Kanchi...' },
  { id: 'Airport Transfer', short: 'Airport Transfer', icon: 'flight', hint: 'T1 / T2 / T4 flight' }
];

const TOUR_VEHICLE_MAP = {
  'Swift Dzire': 'dzire',
  'Toyota Etios': 'dzire',
  'Maruti Ertiga': 'ertiga',
  'Innova': 'innova',
  'Innova Crysta': 'crysta',
  'Tempo Traveller': 'tempo12',
  '12-Seater Luxury Force Tempo': 'tempo12',
  '14-Seater Executive Force Tempo': 'tempo12',
  '17-Seater Executive Force Tempo': 'tempo17'
};

function getTodayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function DirectBookingIntakeForm({
  tariffConfig,
  prefill = null,
  savedContacts = [],
  onImportedContactsChange,
  onSaveBooking,
  onCancel,
  showToast
}) {
  // Quick Paste WhatsApp Box
  const [waPasteText, setWaPasteText] = useState('');
  const [parseHighlights, setParseHighlights] = useState([]);
  const [suggestedAdvance, setSuggestedAdvance] = useState(0);
  const [showPasteBox, setShowPasteBox] = useState(true);

  // Booking Status: 'Confirmed' (Advance Paid -> Stage 2) | 'Quotation' (Stage 1 Enquiry)
  const [bookingStatus, setBookingStatus] = useState('Confirmed');
  const [tripCategory, setTripCategory] = useState('Local Chennai Rental');

  // Section 1: Booker, Guest & Quote Ref
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [quoteRef, setQuoteRef] = useState('');
  const [showGuestFields, setShowGuestFields] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paxCount, setPaxCount] = useState('');
  const [hotelName, setHotelName] = useState('');

  // Section 2: Vehicle, Dates & Itinerary
  const [vehicle, setVehicle] = useState('Swift Dzire');
  const [pickupDate, setPickupDate] = useState(getTodayIso);
  const [returnDate, setReturnDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');

  // Local Package
  const [localPkgId, setLocalPkgId] = useState('8hr_80km');
  const [packageLabel, setPackageLabel] = useState('8 Hr / 80 Km');
  const [includedHrs, setIncludedHrs] = useState(8);
  const [includedKm, setIncludedKm] = useState(80);

  // Outstation & Tour
  const [driverBata, setDriverBata] = useState(0);
  const [statePermit, setStatePermit] = useState(0);
  const [tourKey, setTourKey] = useState('tirupati-package');
  const [tourDays, setTourDays] = useState(1);

  // Airport
  const [airportDirection, setAirportDirection] = useState('Pickup');
  const [terminal, setTerminal] = useState('T1 Domestic');
  const [flightNumber, setFlightNumber] = useState('');

  // Multi-Day Custom Itinerary rows
  const [dayPlan, setDayPlan] = useState(() => [
    { day: 1, date: getTodayIso(), pkg: '8 Hr / 80 Km', duty: '', rate: 0 },
    { day: 2, date: addDaysToIsoDate(getTodayIso(), 1), pkg: '8 Hr / 80 Km', duty: '', rate: 0 }
  ]);

  // Section 3: Fare & Billing Terms
  const [quotedFare, setQuotedFare] = useState('');
  const [agreedRate, setAgreedRate] = useState('');
  const [advance, setAdvance] = useState(0);
  const [tollPolicy, setTollPolicy] = useState('Extra at Actuals');
  const [extraKmRate, setExtraKmRate] = useState(15);
  const [extraHrRate, setExtraHrRate] = useState(150);
  const [nightStayCharge, setNightStayCharge] = useState(0);
  const [notes, setNotes] = useState('');

  const vehicleInfo = useMemo(
    () => tariffConfig?.vehicles?.[vehicle] || tariffConfig?.vehicles?.['Swift Dzire'] || {},
    [tariffConfig, vehicle]
  );

  const computedDays = useMemo(() => {
    if (tripCategory === 'Multi-Day Custom Itinerary') {
      return Math.max(1, dayPlan.length);
    }
    if (tripCategory === 'Tour Package') {
      return Math.max(1, Number(tourDays) || 1);
    }
    if (returnDate && pickupDate) {
      return computeTripDays(pickupDate, returnDate);
    }
    return 1;
  }, [tripCategory, dayPlan.length, tourDays, pickupDate, returnDate]);

  // Hydrate when pushed from Rate & Quote Generator or Mobile Co-Pilot
  useEffect(() => {
    if (!prefill) return;
    if (prefill.customerName) setCustomerName(prefill.customerName);
    if (prefill.phone) setPhone(prefill.phone);
    if (prefill.vehicle && tariffConfig?.vehicles?.[prefill.vehicle]) setVehicle(prefill.vehicle);
    if (prefill.tripCategory && TRIP_CATEGORIES.includes(prefill.tripCategory)) {
      setTripCategory(prefill.tripCategory);
    }
    if (prefill.pickupDate) setPickupDate(prefill.pickupDate);
    if (prefill.returnDate) setReturnDate(prefill.returnDate);
    if (prefill.pickupTime) setPickupTime(prefill.pickupTime);
    if (prefill.pickupLocation) setPickupLocation(prefill.pickupLocation);
    if (prefill.dropLocation) setDropLocation(prefill.dropLocation);
    if (prefill.agreedRate !== undefined && prefill.agreedRate !== '') setAgreedRate(Number(prefill.agreedRate) || 0);
    if (prefill.advance !== undefined) setAdvance(Number(prefill.advance) || 0);
    if (prefill.notes) setNotes(prefill.notes);
    if (prefill.quoteRef) setQuoteRef(prefill.quoteRef);
    if (prefill.includedKm) setIncludedKm(Number(prefill.includedKm) || 0);
    if (prefill.statePermit) setStatePermit(Number(prefill.statePermit) || 0);
    if (prefill.driverBata) setDriverBata(Number(prefill.driverBata) || 0);
    if (prefill.manifestStatus) setBookingStatus(prefill.manifestStatus);
  }, [prefill]);

  // Helper: apply vehicle defaults for Local Package
  const applyLocalPackagePreset = (pkgId, targetVehicle = vehicle) => {
    setLocalPkgId(pkgId);
    const pkg = LOCAL_PACKAGES.find(p => p.id === pkgId);
    const v = tariffConfig?.vehicles?.[targetVehicle] || vehicleInfo;
    if (!pkg || pkgId === 'custom') {
      setPackageLabel('Custom Local');
      return;
    }
    setPackageLabel(pkg.label);
    setIncludedHrs(pkg.hrs);
    setIncludedKm(pkg.km);
    if (v[pkg.key]) setAgreedRate(v[pkg.key]);
    if (v.extra_km_rate) setExtraKmRate(v.extra_km_rate);
    if (v.extra_hr_rate) setExtraHrRate(v.extra_hr_rate);
  };

  // Helper: apply Tour Package preset fare
  const applyTourPreset = (tKey, daysCount = tourDays, targetVehicle = vehicle) => {
    setTourKey(tKey);
    setTourDays(daysCount);
    const pkg = tariffConfig?.tour_packages?.[tKey];
    if (!pkg) return;
    setDropLocation(pkg.name || '');
    setPickupLocation(prev => prev || 'Chennai');
    if (pickupDate && daysCount > 1) {
      setReturnDate(addDaysToIsoDate(pickupDate, daysCount - 1));
    } else {
      setReturnDate('');
    }
    const vKey = TOUR_VEHICLE_MAP[targetVehicle] || 'dzire';
    const vPkg = pkg.vehicles?.[vKey] || pkg.vehicles?.dzire;
    const rate = vPkg?.rates?.[String(daysCount)] || vPkg?.rates?.['1'] || 0;
    if (rate > 0) setAgreedRate(rate);
    if (pkg.roundTripKm) setIncludedKm(pkg.roundTripKm);
    // Tirupati package is commonly all-inclusive
    if (tKey === 'tirupati-package') {
      setTollPolicy('All-Inclusive');
    }
    setPackageLabel(`${pkg.name} (${daysCount}D)`);
  };

  // Handle Trip Category switch with smart defaults
  const handleSelectTripCategory = (newCat) => {
    setTripCategory(newCat);
    const v = vehicleInfo;
    if (newCat === 'Local Chennai Rental') {
      setReturnDate('');
      setNightStayCharge(0);
      setTollPolicy('Extra at Actuals');
      applyLocalPackagePreset(localPkgId || '8hr_80km', vehicle);
    } else if (newCat === 'Outstation Round Trip') {
      const days = returnDate ? computeTripDays(pickupDate, returnDate) : 2;
      if (!returnDate) setReturnDate(addDaysToIsoDate(pickupDate, days - 1));
      setIncludedKm((v.min_km_per_day || 250) * days);
      setIncludedHrs(0);
      setDriverBata((v.driver_bata || 500) * days);
      setExtraKmRate(v.round_trip_rate || v.extra_km_rate || 14);
      setExtraHrRate(0);
      setNightStayCharge(350);
      setTollPolicy('Extra at Actuals');
      setPackageLabel(`${(v.min_km_per_day || 250) * days} Km Round Trip`);
    } else if (newCat === 'Outstation One-Way Drop') {
      setReturnDate('');
      setIncludedKm(v.min_drop_km || 130);
      setIncludedHrs(0);
      setDriverBata(v.driver_bata || 500);
      setExtraKmRate(v.one_way_rate || 16);
      setExtraHrRate(0);
      setNightStayCharge(0);
      setTollPolicy('Extra at Actuals');
      setPackageLabel('One-Way Drop');
    } else if (newCat === 'Multi-Day Custom Itinerary') {
      setTollPolicy('Extra at Actuals');
      setExtraKmRate(v.extra_km_rate || 15);
      setExtraHrRate(v.extra_hr_rate || 250);
      setPackageLabel(`Custom ${dayPlan.length}-Day Plan`);
      if (dayPlan.length > 0) {
        if (dayPlan[0].date) setPickupDate(dayPlan[0].date);
        if (dayPlan[dayPlan.length - 1].date) setReturnDate(dayPlan[dayPlan.length - 1].date);
      }
    } else if (newCat === 'Tour Package') {
      applyTourPreset(tourKey || 'tirupati-package', tourDays || 1, vehicle);
    } else if (newCat === 'Airport Transfer') {
      setReturnDate('');
      setIncludedKm(0);
      setIncludedHrs(0);
      setExtraKmRate(v.extra_km_rate || 15);
      setExtraHrRate(v.extra_hr_rate || 150);
      setNightStayCharge(0);
      setTollPolicy('Extra at Actuals');
      setPackageLabel(`Airport ${airportDirection}`);
      if (airportDirection === 'Pickup' && !pickupLocation) {
        setPickupLocation(`Chennai Airport (${terminal})`);
      }
    }
  };

  // Handle Vehicle change -> refresh over-limit defaults
  const handleVehicleChange = (newVeh) => {
    setVehicle(newVeh);
    const v = tariffConfig?.vehicles?.[newVeh];
    if (!v) return;
    setExtraKmRate(v.extra_km_rate || v.round_trip_rate || 15);
    if (tripCategory === 'Local Chennai Rental') {
      setExtraHrRate(v.extra_hr_rate || 150);
      if (localPkgId !== 'custom') applyLocalPackagePreset(localPkgId, newVeh);
    } else if (tripCategory === 'Tour Package') {
      applyTourPreset(tourKey, tourDays, newVeh);
    } else if (tripCategory === 'Outstation Round Trip') {
      setExtraKmRate(v.round_trip_rate || 14);
      setDriverBata((v.driver_bata || 500) * computedDays);
      setIncludedKm((v.min_km_per_day || 250) * computedDays);
    }
  };

  // Multi-Day Custom Itinerary row helpers
  const updateDayRow = (idx, field, value) => {
    setDayPlan(prev => {
      const next = prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row));
      if (field === 'rate') {
        const sum = next.reduce((acc, r) => acc + (Number(r.rate) || 0), 0);
        if (sum > 0) setAgreedRate(sum);
      }
      if (field === 'date') {
        if (idx === 0 && value) setPickupDate(value);
        if (idx === next.length - 1 && value) setReturnDate(value);
      }
      return next;
    });
  };

  const addDayRow = () => {
    setDayPlan(prev => {
      const last = prev[prev.length - 1];
      const nextDate = last?.date ? addDaysToIsoDate(last.date, 1) : addDaysToIsoDate(pickupDate, prev.length);
      const next = [
        ...prev,
        { day: prev.length + 1, date: nextDate, pkg: last?.pkg || '8 Hr / 80 Km', duty: '', rate: 0 }
      ];
      setReturnDate(nextDate);
      setPackageLabel(`Custom ${next.length}-Day Plan`);
      return next;
    });
  };

  const removeDayRow = (idx) => {
    setDayPlan(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, day: i + 1 }));
      const sum = next.reduce((acc, r) => acc + (Number(r.rate) || 0), 0);
      if (sum > 0) setAgreedRate(sum);
      if (next[0]?.date) setPickupDate(next[0].date);
      if (next[next.length - 1]?.date) setReturnDate(next[next.length - 1].date);
      setPackageLabel(`Custom ${next.length}-Day Plan`);
      return next;
    });
  };

  // Smart WhatsApp Paste Parser Handler
  const handleSmartParseWhatsApp = () => {
    if (!waPasteText.trim()) {
      showToast?.('Paste a WhatsApp quote or chat message first', 'error');
      return;
    }
    const { parsed, highlights } = parseWhatsAppBookingText(waPasteText, tariffConfig);
    setParseHighlights(highlights);

    const effectiveStatus = parsed.bookingStatus || bookingStatus;
    if (parsed.bookingStatus) setBookingStatus(parsed.bookingStatus);
    if (parsed.tripCategory) setTripCategory(parsed.tripCategory);
    if (parsed.vehicle) setVehicle(parsed.vehicle);
    if (parsed.quoteRef) setQuoteRef(parsed.quoteRef);
    if (parsed.customerName && !customerName) setCustomerName(parsed.customerName);
    if (parsed.phone) setPhone(parsed.phone);

    if (parsed.guestName || parsed.guestPhone || parsed.paxCount || parsed.hotelName) {
      setShowGuestFields(true);
      if (parsed.guestName) setGuestName(parsed.guestName);
      if (parsed.guestPhone) setGuestPhone(parsed.guestPhone);
      if (parsed.paxCount) setPaxCount(parsed.paxCount);
      if (parsed.hotelName) setHotelName(parsed.hotelName);
    }

    if (parsed.pickupDate) setPickupDate(parsed.pickupDate);
    if (parsed.returnDate) setReturnDate(parsed.returnDate);
    if (parsed.pickupTime) setPickupTime(parsed.pickupTime);
    if (parsed.pickupLocation) setPickupLocation(parsed.pickupLocation);
    if (parsed.dropLocation) setDropLocation(parsed.dropLocation);

    if (Array.isArray(parsed.dayPlan) && parsed.dayPlan.length > 0) {
      setDayPlan(parsed.dayPlan);
      setPackageLabel(`Custom ${parsed.dayPlan.length}-Day Plan`);
    }
    if (parsed.tourKey) {
      setTourKey(parsed.tourKey);
      if (parsed.days) setTourDays(parsed.days);
    }
    if (parsed.packageLabel) {
      setPackageLabel(parsed.packageLabel);
      const matchLocal = LOCAL_PACKAGES.find(p => p.hrs === parsed.includedHrs && p.km === parsed.includedKm);
      if (matchLocal) setLocalPkgId(matchLocal.id);
      else if (parsed.tripCategory === 'Local Chennai Rental') setLocalPkgId('custom');
    }
    if (parsed.includedKm) setIncludedKm(parsed.includedKm);
    if (parsed.includedHrs) setIncludedHrs(parsed.includedHrs);
    if (parsed.driverBata) setDriverBata(parsed.driverBata);
    if (parsed.statePermit) setStatePermit(parsed.statePermit);
    if (parsed.quotedFare) setQuotedFare(parsed.quotedFare);
    if (parsed.agreedRate) setAgreedRate(parsed.agreedRate);
    if (parsed.extraKmRate) setExtraKmRate(parsed.extraKmRate);
    if (parsed.extraHrRate) setExtraHrRate(parsed.extraHrRate);
    if (parsed.nightStayCharge) setNightStayCharge(parsed.nightStayCharge);
    if (parsed.tollPolicy) setTollPolicy(parsed.tollPolicy);

    const nextHighlights = [...highlights];
    if (parsed.suggestedAdvance > 0) {
      setSuggestedAdvance(parsed.suggestedAdvance);
      if (effectiveStatus === 'Confirmed') {
        setAdvance(parsed.suggestedAdvance);
        nextHighlights.push(`Adv: ₹${parsed.suggestedAdvance.toLocaleString('en-IN')}`);
      }
    } else {
      setSuggestedAdvance(0);
    }
    setParseHighlights(nextHighlights);

    showToast?.(
      nextHighlights.length > 0
        ? `Auto-filled from WhatsApp (${nextHighlights.slice(0, 4).join(' • ')})`
        : 'Parsed WhatsApp text — review fields below!'
    );
  };

  const resetForm = () => {
    setWaPasteText('');
    setParseHighlights([]);
    setBookingStatus('Confirmed');
    setCustomerName('');
    setPhone('');
    setQuoteRef('');
    setGuestName('');
    setGuestPhone('');
    setPaxCount('');
    setHotelName('');
    setShowGuestFields(false);
    setPickupTime('');
    setPickupLocation('');
    setDropLocation('');
    setReturnDate('');
    setQuotedFare('');
    setAgreedRate('');
    setAdvance(0);
    setNotes('');
    setFlightNumber('');
  };

  const submitBooking = (e, { sendWhatsApp = false } = {}) => {
    if (e) e.preventDefault();
    if (!customerName.trim()) {
      showToast?.('Please enter Customer / Booker Name', 'error');
      return;
    }
    if (!phone.trim()) {
      showToast?.('Please enter Mobile / WhatsApp Number', 'error');
      return;
    }

    const finalAgreed = Number(agreedRate) || 0;
    const finalAdvance = Number(advance) || 0;
    const cleanPhone = normalizePhoneNumber(phone);
    const cleanGuestPhone = normalizePhoneNumber(guestPhone);

    const activeDayPlan =
      tripCategory === 'Multi-Day Custom Itinerary'
        ? dayPlan.filter(d => d.duty.trim() || Number(d.rate) > 0 || d.pkg.trim())
        : [];

    const effectivePickupLoc =
      pickupLocation.trim() ||
      hotelName.trim() ||
      (tripCategory === 'Airport Transfer' && airportDirection === 'Pickup' ? `Chennai Airport (${terminal})` : 'Chennai');

    const effectiveDropLoc =
      tripCategory === 'Multi-Day Custom Itinerary'
        ? activeDayPlan.map(d => `D${d.day}: ${d.duty || d.pkg}`).join(' | ')
        : dropLocation.trim() ||
          (tripCategory === 'Airport Transfer' && airportDirection === 'Drop' ? `Chennai Airport (${terminal})` : 'Chennai Local');

    const payload = {
      customerName: customerName.trim(),
      phone: cleanPhone,
      quoteRef: quoteRef.trim(),
      guestName: guestName.trim(),
      guestPhone: cleanGuestPhone,
      paxCount: paxCount.trim(),
      hotelName: hotelName.trim(),
      tripCategory,
      vehicle,
      pickupDate,
      returnDate: returnDate || (activeDayPlan.length > 1 ? activeDayPlan[activeDayPlan.length - 1].date : ''),
      days: computedDays,
      pickupTime: pickupTime.trim(),
      pickupLocation: effectivePickupLoc,
      dropLocation: effectiveDropLoc,
      route: `${effectivePickupLoc} -> ${effectiveDropLoc}`,
      flightNumber: tripCategory === 'Airport Transfer' ? flightNumber.trim() : '',
      terminal: tripCategory === 'Airport Transfer' ? terminal : '',
      airportDirection: tripCategory === 'Airport Transfer' ? airportDirection : '',
      packageLabel: packageLabel.trim(),
      includedKm: Number(includedKm) || 0,
      includedHrs: Number(includedHrs) || 0,
      driverBata: Number(driverBata) || 0,
      statePermit: Number(statePermit) || 0,
      tourKey: tripCategory === 'Tour Package' ? tourKey : '',
      dayPlan: activeDayPlan,
      quotedFare: Number(quotedFare) || 0,
      agreedRate: finalAgreed,
      advance: finalAdvance,
      balance: Math.max(0, finalAgreed - finalAdvance),
      tollPolicy,
      extraKmRate: Number(extraKmRate) || 0,
      extraHrRate: Number(extraHrRate) || 0,
      nightStayCharge: Number(nightStayCharge) || 0,
      manifestStatus: bookingStatus,
      notes: notes.trim()
    };

    onSaveBooking(payload, { sendWhatsApp });
    resetForm();
  };

  const balanceAmt = Math.max(0, (Number(agreedRate) || 0) - (Number(advance) || 0));
  const negotiatedDiff = Number(quotedFare) > 0 && Number(agreedRate) > 0 ? Number(quotedFare) - Number(agreedRate) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 animate-fadeIn max-w-4xl mx-auto space-y-6">
      {/* Header + Booking Status Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Direct Booking Intake</h3>
          <p className="text-xs text-slate-500">
            Paste a WhatsApp quote to auto-fill, or pick a trip type below — syncs live to Google Sheets.
          </p>
        </div>

        {/* Stage 1 Quotation vs Stage 2 Confirmed Toggle */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setBookingStatus('Quotation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              bookingStatus === 'Quotation'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-sm">request_quote</span>
            <span>1. Quotation / Enquiry</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setBookingStatus('Confirmed');
              if (Number(advance) === 0 && suggestedAdvance > 0) {
                setAdvance(suggestedAdvance);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              bookingStatus === 'Confirmed'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>2. Confirmed (Advance Paid)</span>
          </button>
        </div>
      </div>

      {/* QUICK PASTE WHATSAPP QUOTE / CHAT AUTO-FILL */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowPasteBox(v => !v)}
            className="flex items-center gap-2 text-xs font-bold text-emerald-900"
          >
            <span className="material-symbols-outlined text-base text-emerald-600">content_paste_go</span>
            <span>Quick Paste WhatsApp Quote / Chat (Auto-Fill)</span>
            <span className="material-symbols-outlined text-sm text-emerald-600">
              {showPasteBox ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {waPasteText && (
            <button
              type="button"
              onClick={() => {
                setWaPasteText('');
                setParseHighlights([]);
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        {showPasteBox && (
          <div className="space-y-2">
            <textarea
              rows={3}
              value={waPasteText}
              onChange={(e) => setWaPasteText(e.target.value)}
              placeholder="Paste any Kalidass Travels WhatsApp quote (Multi-Day Revised Tariff, Outstation Q-Ref, 10Hr/100Km Local, Tirupati Tour, or Customer Chat)..."
              className="w-full text-xs bg-white border border-emerald-200 rounded-xl p-3 text-slate-800 font-mono focus:outline-none focus:border-emerald-500 resize-y"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {parseHighlights.map((h, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold"
                  >
                    ✓ {h}
                  </span>
                ))}
                {suggestedAdvance > 0 && Number(advance) === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdvance(suggestedAdvance);
                      showToast?.(`Applied ₹${suggestedAdvance.toLocaleString('en-IN')} advance`);
                    }}
                    className="px-2.5 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-bold transition"
                  >
                    + Apply ₹{suggestedAdvance.toLocaleString('en-IN')} Advance
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleSmartParseWhatsApp}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
              >
                <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                <span>Smart Parse &amp; Auto-Fill</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TRIP TYPE SELECTOR PILLS */}
      <div>
        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2.5">
          Select Booking Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {TRIP_TYPE_META.map(t => {
            const active = tripCategory === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTripCategory(t.id)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-base ${active ? 'text-white' : 'text-blue-600'}`}>
                    {t.icon}
                  </span>
                  <span className="text-xs font-bold leading-tight truncate">{t.short}</span>
                </div>
                <span className={`text-[10px] leading-tight truncate ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                  {t.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={(e) => submitBooking(e, { sendWhatsApp: false })} className="space-y-6">
        {/* SECTION 1: BOOKER & PASSENGER INFORMATION */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              1. Booker &amp; Passenger Details
            </h4>
            <div className="flex items-center gap-2">
              <ContactPickerControl
                contacts={savedContacts}
                onImportedContactsChange={onImportedContactsChange}
                showToast={showToast}
                defaultFilter="All"
                buttonLabel="Phonebook"
                compact
                onSelect={({ name, phone: pickedPhone }) => {
                  if (name) setCustomerName(name);
                  if (pickedPhone) setPhone(pickedPhone);
                }}
              />
              <button
                type="button"
                onClick={() => setShowGuestFields(v => !v)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">
                  {showGuestFields ? 'remove_circle_outline' : 'person_add'}
                </span>
                <span>{showGuestFields ? 'Hide Guest / Alt Contact' : '+ Different Guest / Alt Phone / Pax'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Booker / Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Vivek USA / Aarti"
                className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp / Mobile <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9840100000 or +1 / +880..."
                className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Existing Quote Ref <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={quoteRef}
                onChange={(e) => setQuoteRef(e.target.value)}
                placeholder="e.g. Q-141126-4 / KT/19NOV/02"
                className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {showGuestFields && (
            <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500">On-Ground Guest / Alternate Contact</span>
                <ContactPickerControl
                  contacts={savedContacts}
                  onImportedContactsChange={onImportedContactsChange}
                  showToast={showToast}
                  defaultFilter="All"
                  buttonLabel="Pick Guest"
                  compact
                  onSelect={({ name, phone: pickedPhone }) => {
                    if (name) setGuestName(name);
                    if (pickedPhone) setGuestPhone(pickedPhone);
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">On-Ground Guest Name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Mr. Ved Parkash"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Alt / Passenger Phone</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="e.g. 9382155220"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Pax Count</label>
                <input
                  type="text"
                  value={paxCount}
                  onChange={(e) => setPaxCount(e.target.value)}
                  placeholder="e.g. 3 Pax / 6+2 kids"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Hotel / Stay Landmark</label>
                <input
                  type="text"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  placeholder="e.g. GT Grande, T. Nagar"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: VEHICLE, SCHEDULE & TYPE-ADAPTIVE ITINERARY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              2. Vehicle &amp; {tripCategory} Details
            </h4>
            {computedDays > 1 && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                {computedDays} Days Trip
              </span>
            )}
          </div>

          {/* Vehicle + Local/Tour/Airport Specific Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
              <select
                value={vehicle}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
              >
                {Object.keys(tariffConfig?.vehicles || {}).map(vKey => (
                  <option key={vKey} value={vKey}>{vKey}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Date</label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => {
                  setPickupDate(e.target.value);
                  if (tripCategory === 'Tour Package' && tourDays > 1) {
                    setReturnDate(addDaysToIsoDate(e.target.value, tourDays - 1));
                  }
                }}
                className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            {['Outstation Round Trip', 'Tour Package', 'Multi-Day Custom Itinerary'].includes(tripCategory) ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Return / End Date <span className="text-slate-400 font-normal">({computedDays}D)</span>
                </label>
                <input
                  type="date"
                  value={returnDate}
                  min={pickupDate}
                  onChange={(e) => {
                    const newRet = e.target.value;
                    setReturnDate(newRet);
                    if (tripCategory === 'Outstation Round Trip' && newRet && pickupDate) {
                      const d = computeTripDays(pickupDate, newRet);
                      setIncludedKm((vehicleInfo.min_km_per_day || 250) * d);
                      setDriverBata((vehicleInfo.driver_bata || 500) * d);
                    }
                  }}
                  className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Time</label>
                <input
                  type="text"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  placeholder="e.g. 06:00 AM"
                  className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* LOCAL CHENNAI RENTAL PRESETS */}
          {tripCategory === 'Local Chennai Rental' && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 space-y-2.5">
              <div className="text-xs font-bold text-blue-900">Select Local Package (Auto-fills Fare &amp; Over-Limit)</div>
              <div className="flex flex-wrap gap-2">
                {LOCAL_PACKAGES.map(pkg => {
                  const active = localPkgId === pkg.id;
                  const price = pkg.key ? vehicleInfo[pkg.key] : null;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => applyLocalPackagePreset(pkg.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {pkg.label}{price ? ` • ₹${price.toLocaleString('en-IN')}` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TOUR PACKAGE PRESETS */}
          {tripCategory === 'Tour Package' && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Tour Package Preset</label>
                <select
                  value={tourKey}
                  onChange={(e) => applyTourPreset(e.target.value, tourDays, vehicle)}
                  className="w-full text-xs bg-white border border-amber-200 rounded-lg px-3 py-2 font-semibold text-slate-800"
                >
                  {Object.entries(tariffConfig?.tour_packages || {}).map(([key, pkg]) => (
                    <option key={key} value={key}>{pkg.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Package Duration</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => applyTourPreset(tourKey, d, vehicle)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                        tourDays === d
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      {d} Day{d > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Pickup Time</label>
                <input
                  type="text"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  placeholder="e.g. 05:00 AM"
                  className="w-full text-xs bg-white border border-amber-200 rounded-lg px-3 py-2 font-medium text-slate-800"
                />
              </div>
            </div>
          )}

          {/* AIRPORT TRANSFER FIELDS */}
          {tripCategory === 'Airport Transfer' && (
            <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-sky-900 mb-1">Transfer Direction</label>
                <div className="flex gap-1.5">
                  {['Pickup', 'Drop'].map(dir => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => {
                        setAirportDirection(dir);
                        setPackageLabel(`Airport ${dir}`);
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                        airportDirection === dir
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-white text-slate-700 border-sky-200'
                      }`}
                    >
                      {dir === 'Pickup' ? '🛬 Arrival Pickup' : '🛫 Departure Drop'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-sky-900 mb-1">Terminal</label>
                <select
                  value={terminal}
                  onChange={(e) => setTerminal(e.target.value)}
                  className="w-full text-xs bg-white border border-sky-200 rounded-lg px-3 py-2 font-semibold text-slate-800"
                >
                  <option value="T1 Domestic">T1 Domestic</option>
                  <option value="T2 International">T2 International</option>
                  <option value="T4 Domestic">T4 Domestic</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-sky-900 mb-1">Flight Number</label>
                <input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  placeholder="e.g. 6E-243 / EK-544"
                  className="w-full text-xs bg-white border border-sky-200 rounded-lg px-3 py-2 font-mono font-bold uppercase text-slate-800"
                />
              </div>
            </div>
          )}

          {/* OUTSTATION EXTRA PARAMETERS (Km, Bata, Permit, Pickup Time) */}
          {(tripCategory === 'Outstation Round Trip' || tripCategory === 'Outstation One-Way Drop') && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tripCategory === 'Outstation Round Trip' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pickup Time</label>
                  <input
                    type="text"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    placeholder="e.g. 06:00 AM"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-medium"
                  />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Included Km</label>
                <input
                  type="number"
                  value={includedKm}
                  onChange={(e) => setIncludedKm(Number(e.target.value) || 0)}
                  placeholder="e.g. 900"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Driver Bata (₹)</label>
                <input
                  type="number"
                  value={driverBata}
                  onChange={(e) => setDriverBata(Number(e.target.value) || 0)}
                  placeholder="e.g. 2000"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">State Permit (₹)</label>
                <input
                  type="number"
                  value={statePermit}
                  onChange={(e) => setStatePermit(Number(e.target.value) || 0)}
                  placeholder="e.g. 500"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-mono"
                />
              </div>
            </div>
          )}

          {/* MULTI-DAY CUSTOM ITINERARY BUILDER (Vivek USA style) */}
          {tripCategory === 'Multi-Day Custom Itinerary' && (
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-indigo-950">Day-by-Day Itinerary &amp; Rate Breakdown</div>
                  <div className="text-[11px] text-indigo-700">
                    Daily rates automatically sum into Total Agreed Fare.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addDayRow}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Add Day</span>
                </button>
              </div>

              <div className="space-y-2">
                {dayPlan.map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white border border-indigo-100 rounded-xl p-2.5"
                  >
                    <div className="sm:col-span-2 flex items-center gap-1.5">
                      <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-extrabold shrink-0">
                        D{idx + 1}
                      </span>
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateDayRow(idx, 'date', e.target.value)}
                        className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-medium"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={row.pkg}
                        onChange={(e) => updateDayRow(idx, 'pkg', e.target.value)}
                        placeholder="8 Hr / 80 Km"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={row.duty}
                        onChange={(e) => updateDayRow(idx, 'duty', e.target.value)}
                        placeholder="e.g. Airport T1 Pickup (11:20 AM) + Chennai Local"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        value={row.rate || ''}
                        onChange={(e) => updateDayRow(idx, 'rate', Number(e.target.value) || 0)}
                        placeholder="₹ Rate"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeDayRow(idx)}
                        disabled={dayPlan.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 rounded-lg"
                        title="Remove day"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">Day 1 Pickup Time</label>
                  <input
                    type="text"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    placeholder="e.g. 11:20 AM"
                    className="w-full text-xs bg-white border border-indigo-200 rounded-lg px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">Primary Pickup / Hotel</label>
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="e.g. Airport T1 / GT Grande Hotel, T. Nagar"
                    className="w-full text-xs bg-white border border-indigo-200 rounded-lg px-3 py-2 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STANDARD PICKUP & DROP ADDRESSES (for non-Custom Day-by-Day) */}
          {tripCategory !== 'Multi-Day Custom Itinerary' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Address / Landmark</label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Airport T2 Arrival / Anna Nagar East"
                  className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination / Route</label>
                <input
                  type="text"
                  value={dropLocation}
                  onChange={(e) => setDropLocation(e.target.value)}
                  placeholder="e.g. Puducherry → Pichavaram → Chennai Airport"
                  className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: FARE, BILLING TERMS & FINANCIALS */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              3. Fare, Billing Terms &amp; Financials
            </h4>
            {negotiatedDiff > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                Negotiated Discount: -₹{negotiatedDiff.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Agreed Rate (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={agreedRate}
                onChange={(e) => setAgreedRate(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 8000"
                className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Quoted Base (₹) <span className="text-[10px] font-normal">(Opt.)</span>
              </label>
              <input
                type="number"
                value={quotedFare}
                onChange={(e) => setQuotedFare(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Before discount"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Advance Received (₹)</label>
              <input
                type="number"
                value={advance}
                onChange={(e) => setAdvance(Number(e.target.value) || 0)}
                className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Balance To Collect</label>
              <div className="w-full text-sm bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-extrabold">
                ₹{balanceAmt.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Compact Billing Terms Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Toll &amp; Parking Policy</label>
              <select
                value={tollPolicy}
                onChange={(e) => setTollPolicy(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-semibold text-slate-800"
              >
                <option value="Extra at Actuals">Extra at Actuals</option>
                <option value="All-Inclusive">All-Inclusive (Included)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Extra Km Rate (₹/km)</label>
              <input
                type="number"
                value={extraKmRate}
                onChange={(e) => setExtraKmRate(Number(e.target.value) || 0)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Extra Hr Rate (₹/hr)</label>
              <input
                type="number"
                value={extraHrRate}
                onChange={(e) => setExtraHrRate(Number(e.target.value) || 0)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Night Stay (₹)</label>
              <input
                type="number"
                value={nightStayCharge}
                onChange={(e) => setNightStayCharge(Number(e.target.value) || 0)}
                placeholder="e.g. 350"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-mono font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Special Instructions / Passenger Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Needs Hindi-speaking driver, baby seat, waiting at US Consulate, darshan pending till Feb..."
              className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 resize-y"
            />
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={(e) => submitBooking(e, { sendWhatsApp: true })}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">send</span>
            <span>Save &amp; Send WA Summary</span>
          </button>

          <button
            type="submit"
            className={`py-3 px-7 font-bold text-sm rounded-xl transition shadow-lg flex items-center gap-2 ${
              bookingStatus === 'Quotation'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {bookingStatus === 'Quotation' ? 'request_quote' : 'verified'}
            </span>
            <span>
              {bookingStatus === 'Quotation' ? 'Save to 1. Quotation / Enquiry' : 'Save to 2. Confirmed'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
