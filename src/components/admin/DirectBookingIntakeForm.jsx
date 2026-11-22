import React, { useState, useEffect, useMemo, useRef } from 'react';
import ContactPickerControl from './ContactPickerControl.jsx';
import {
  TRIP_CATEGORIES,
  LOCAL_PACKAGES,
  parseWhatsAppBookingText,
  addDaysToIsoDate,
  computeTripDays,
  formatShortDate,
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
  // WhatsApp-First Paste State
  const [waPasteText, setWaPasteText] = useState('');
  const [hasParsedQuote, setHasParsedQuote] = useState(false);
  const [parseHighlights, setParseHighlights] = useState([]);
  const [suggestedAdvance, setSuggestedAdvance] = useState(0);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const customerNameRef = useRef(null);
  const phoneRef = useRef(null);
  const pickupLocRef = useRef(null);

  // Booking Status: 'Confirmed' (Advance Paid -> Stage 2) | 'Quotation' (Stage 1 Enquiry)
  const [bookingStatus, setBookingStatus] = useState('Confirmed');
  const [tripCategory, setTripCategory] = useState('Outstation Round Trip');

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
  const [packageLabel, setPackageLabel] = useState('');
  const [includedHrs, setIncludedHrs] = useState(0);
  const [includedKm, setIncludedKm] = useState(0);

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
  const [extraKmRate, setExtraKmRate] = useState(0);
  const [extraHrRate, setExtraHrRate] = useState(0);
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
    setShowFullDetails(true);
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
      setNightStayCharge(0);
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

  // Core WhatsApp Parser — cleanly resets stale trip fields before applying newly pasted quote
  const parseAndApplyWhatsAppText = (rawInput, { silent = false } = {}) => {
    const text = String(rawInput || '').trim();
    if (!text) {
      if (!silent) showToast?.('Paste a WhatsApp quote or chat message first', 'error');
      return;
    }

    const { parsed, highlights } = parseWhatsAppBookingText(text, tariffConfig);
    setHasParsedQuote(true);

    // Cleanly reset quote-derived trip fields so previous paste / default values never leak in
    setReturnDate('');
    setPickupTime('');
    setPickupLocation('');
    setDropLocation('');
    setQuoteRef('');
    setPackageLabel('');
    setIncludedKm(0);
    setIncludedHrs(0);
    setDriverBata(0);
    setStatePermit(0);
    setQuotedFare('');
    setAgreedRate('');
    setExtraKmRate(0);
    setExtraHrRate(0);
    setNightStayCharge(0);
    setTollPolicy('Extra at Actuals');

    const effectiveStatus = parsed.bookingStatus || bookingStatus;
    if (parsed.bookingStatus) setBookingStatus(parsed.bookingStatus);
    if (parsed.tripCategory) setTripCategory(parsed.tripCategory);
    if (parsed.vehicle) setVehicle(parsed.vehicle);
    if (parsed.quoteRef) setQuoteRef(parsed.quoteRef);
    if (parsed.customerName) setCustomerName(parsed.customerName);
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
    if (parsed.quotedFare) {
      setQuotedFare(parsed.quotedFare);
    } else if (parsed.agreedRate) {
      // Preserve original pasted quote as Quoted Base so any negotiation/discount is tracked automatically
      setQuotedFare(parsed.agreedRate);
    }
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
      } else {
        setAdvance(0);
      }
    } else {
      setSuggestedAdvance(0);
      setAdvance(0);
    }
    setParseHighlights(nextHighlights);

    // Keep full details collapsed when WhatsApp quote parsed cleanly so user focuses on Customer + Pickup + Save
    if (parsed.agreedRate && parsed.pickupDate) {
      setShowFullDetails(false);
    }

    if (!silent) {
      showToast?.(
        nextHighlights.length > 0
          ? `Auto-filled from WhatsApp (${nextHighlights.slice(0, 4).join(' • ')})`
          : 'Parsed WhatsApp text — review details below!'
      );
    }
  };

  // 1-Click Paste from Clipboard button
  const handleClipboardPaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText || !clipText.trim()) {
        showToast?.('Clipboard is empty — copy a WhatsApp quotation first!', 'error');
        return;
      }
      setWaPasteText(clipText);
      parseAndApplyWhatsAppText(clipText);
    } catch (_) {
      showToast?.('Tap inside the green box and press Ctrl+V / Paste', 'error');
    }
  };

  const resetForm = () => {
    setWaPasteText('');
    setHasParsedQuote(false);
    setParseHighlights([]);
    setSuggestedAdvance(0);
    setBookingStatus('Confirmed');
    setCustomerName('');
    setPhone('');
    setQuoteRef('');
    setGuestName('');
    setGuestPhone('');
    setPaxCount('');
    setHotelName('');
    setShowGuestFields(false);
    setPickupDate(getTodayIso());
    setPickupTime('');
    setPickupLocation('');
    setDropLocation('');
    setReturnDate('');
    setIncludedKm(0);
    setIncludedHrs(0);
    setDriverBata(0);
    setStatePermit(0);
    setQuotedFare('');
    setAgreedRate('');
    setAdvance(0);
    setExtraKmRate(0);
    setExtraHrRate(0);
    setNightStayCharge(0);
    setNotes('');
    setFlightNumber('');
  };

  const submitBooking = (e, { sendWhatsApp = false } = {}) => {
    if (e) e.preventDefault();
    if (!customerName.trim()) {
      showToast?.('Please enter Customer / Booker Name', 'error');
      customerNameRef.current?.focus();
      return;
    }
    if (!phone.trim()) {
      showToast?.('Please enter Mobile / WhatsApp Number', 'error');
      phoneRef.current?.focus();
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

  // Identify what's still missing after WhatsApp paste so operator can complete it in seconds
  const missingItems = useMemo(() => {
    const items = [];
    if (!customerName.trim()) items.push({ label: 'Customer Name', ref: customerNameRef });
    if (!phone.trim()) items.push({ label: 'Mobile Number', ref: phoneRef });
    if (!pickupLocation.trim() || /^chennai$/i.test(pickupLocation.trim())) {
      items.push({ label: 'Exact Pickup Address', ref: pickupLocRef, optional: true });
    }
    return items;
  }, [customerName, phone, pickupLocation]);

  const scheduleSummary = useMemo(() => {
    const startStr = formatShortDate(pickupDate, true);
    if (returnDate && returnDate !== pickupDate) {
      return `${formatShortDate(pickupDate)} – ${formatShortDate(returnDate, true)} (${computedDays}D)`;
    }
    return startStr || pickupDate;
  }, [pickupDate, returnDate, computedDays]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 animate-fadeIn max-w-4xl mx-auto space-y-5">
      {/* HEADER + STAGE TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">content_paste_go</span>
            <span>WhatsApp-First New Booking</span>
          </h3>
          <p className="text-xs text-slate-500">
            Paste any WhatsApp quotation below — auto-parses instantly. Just add Customer &amp; Pickup, then Save!
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
            <span>1. Quotation</span>
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
            <span>2. Confirmed</span>
          </button>
        </div>
      </div>

      {/* STEP 1: HERO WHATSAPP QUOTE PASTE ZONE (INSTANT AUTO-PARSE ON PASTE) */}
      <div className="rounded-2xl border-2 border-emerald-300/80 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center">
              1
            </span>
            <div>
              <div className="text-xs font-extrabold text-emerald-950">
                Paste WhatsApp Quotation (Auto-Fills Instantly)
              </div>
              <div className="text-[11px] text-emerald-700/80">
                Copy any Kalidass quote from WhatsApp Web or Mobile and paste here — no extra click needed.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClipboardPaste}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-sm">content_paste</span>
              <span>Paste from Clipboard</span>
            </button>
            {waPasteText && (
              <button
                type="button"
                onClick={resetForm}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <textarea
          rows={hasParsedQuote ? 2 : 4}
          value={waPasteText}
          onChange={(e) => setWaPasteText(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData?.getData('text');
            if (pasted && pasted.trim()) {
              e.preventDefault();
              setWaPasteText(pasted);
              parseAndApplyWhatsAppText(pasted);
            }
          }}
          placeholder="Paste WhatsApp quotation here (Ctrl+V)...&#10;Example: KALIDASS TRAVELS - Chennai ⇄ HVXP+RRW (3 Days), Pickup: Thu, 26 Nov, 06:00 AM, Return: Sat, 28 Nov, 09:00 PM..."
          className="w-full text-xs bg-white border border-emerald-200 rounded-xl p-3 text-slate-800 font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 resize-y transition-all"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {parseHighlights.map((h, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-bold"
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

          <div className="flex items-center gap-2 ml-auto">
            {waPasteText.trim() && (
              <button
                type="button"
                onClick={() => parseAndApplyWhatsAppText(waPasteText)}
                className="px-3 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center gap-1 transition"
              >
                <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                <span>Re-Parse</span>
              </button>
            )}
            {!hasParsedQuote && (
              <button
                type="button"
                onClick={() => setShowFullDetails(v => !v)}
                className="text-[11px] font-bold text-slate-500 hover:text-blue-600 underline"
              >
                {showFullDetails ? 'Hide Manual Form' : 'Enter Manually (No Paste)'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PARSED QUOTE LIVE SUMMARY CARD (Instant visual confirmation of everything extracted) */}
      {(hasParsedQuote || Number(agreedRate) > 0) && (
        <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-4 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                  {tripCategory}
                </span>
                {quoteRef && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-mono font-bold">
                    {quoteRef}
                  </span>
                )}
              </div>
              <div className="text-base font-extrabold text-white">
                {pickupLocation || 'Chennai'} <span className="text-emerald-400">→</span> {dropLocation || 'Destination'}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-emerald-400">calendar_month</span>
                  <strong>{scheduleSummary}</strong>
                  {pickupTime ? ` @ ${pickupTime}` : ''}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-blue-400">directions_car</span>
                  <strong>{vehicle}</strong>
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Agreed / Balance
                {negotiatedDiff > 0 && (
                  <span className="ml-1.5 text-amber-300">(-₹{negotiatedDiff.toLocaleString('en-IN')} disc.)</span>
                )}
              </div>
              <div className="text-xl font-extrabold font-mono text-emerald-400">
                ₹{(Number(agreedRate) || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] font-mono text-slate-300">
                {Number(advance) > 0
                  ? <>Adv ₹{Number(advance).toLocaleString('en-IN')} • Bal <strong className="text-white">₹{balanceAmt.toLocaleString('en-IN')}</strong></>
                  : <>No Adv • Full <strong className="text-white">₹{balanceAmt.toLocaleString('en-IN')}</strong> to Driver</>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800 text-[11px] text-slate-300">
            <div className="flex flex-wrap items-center gap-2 font-mono">
              {Number(includedKm) > 0 && <span className="px-2 py-0.5 rounded bg-slate-800">{includedKm} km pkg</span>}
              {Number(driverBata) > 0 && <span className="px-2 py-0.5 rounded bg-slate-800">Bata ₹{driverBata}</span>}
              {Number(statePermit) > 0 && <span className="px-2 py-0.5 rounded bg-slate-800">Permit ₹{statePermit}</span>}
              {Number(extraKmRate) > 0 && <span className="px-2 py-0.5 rounded bg-slate-800">ExKm ₹{extraKmRate}</span>}
              {Number(nightStayCharge) > 0 && <span className="px-2 py-0.5 rounded bg-slate-800">Night ₹{nightStayCharge}</span>}
              <span className="px-2 py-0.5 rounded bg-slate-800 font-sans">{tollPolicy}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowFullDetails(v => !v)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-[11px] flex items-center gap-1 transition"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>{showFullDetails ? 'Hide Trip Details' : 'Edit Dates / Vehicle / Terms'}</span>
            </button>
          </div>

          {/* Missing items nudge */}
          {missingItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase text-amber-300">Next to fill:</span>
              {missingItems.map((m, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => m.ref?.current?.focus()}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition ${
                    m.optional
                      ? 'bg-slate-800 text-amber-200 border border-amber-400/30 hover:bg-slate-700'
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  }`}
                >
                  + {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={(e) => submitBooking(e, { sendWhatsApp: false })} className="space-y-5">
        {/* STEP 2: CUSTOMER, PICKUP & ADVANCE (ALWAYS IN VIEW — ZERO SCROLLING!) */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center">
                2
              </span>
              <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                Customer, Exact Pickup &amp; Payment
              </h4>
            </div>
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
                <span>{showGuestFields ? 'Hide Guest / Pax' : '+ Alt Guest / Pax'}</span>
              </button>
            </div>
          </div>

          {/* Row 1: Customer Name, Mobile, Quote Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Booker / Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={customerNameRef}
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Riddhi Gandhi / Vivek USA"
                className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp / Mobile <span className="text-red-500">*</span>
              </label>
              <input
                ref={phoneRef}
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9840100000 or +1 / +44..."
                className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quote Ref <span className="text-slate-400 font-normal">(Auto-filled)</span>
              </label>
              <input
                type="text"
                value={quoteRef}
                onChange={(e) => setQuoteRef(e.target.value)}
                placeholder="e.g. KT/22NOV/07"
                className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Exact Pickup Address & Destination */}
          {tripCategory !== 'Multi-Day Custom Itinerary' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Exact Pickup Address / Landmark
                </label>
                <input
                  ref={pickupLocRef}
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. New Avadi Rd, Kilpauk / Airport T2"
                  className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination / Route</label>
                <input
                  type="text"
                  value={dropLocation}
                  onChange={(e) => setDropLocation(e.target.value)}
                  placeholder="e.g. Tirupati / HVXP+RRW / Madurai"
                  className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Row 3: Financials + Quick Negotiation & Advance Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Agreed Fare (₹) <span className="text-red-500">*</span>
                </label>
                {Number(agreedRate) > 0 && (
                  <div className="flex items-center gap-1">
                    {[200, 500, 1000].map(disc => (
                      <button
                        key={disc}
                        type="button"
                        onClick={() => {
                          if (!quotedFare) setQuotedFare(Number(agreedRate));
                          setAgreedRate(Math.max(0, Number(agreedRate) - disc));
                        }}
                        title={`Negotiate -₹${disc}`}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                      >
                        -{disc}
                      </button>
                    ))}
                    {negotiatedDiff !== 0 && Number(quotedFare) > 0 && (
                      <button
                        type="button"
                        onClick={() => setAgreedRate(Number(quotedFare))}
                        title="Reset to original quoted fare"
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                )}
              </div>
              <input
                type="number"
                required
                value={agreedRate}
                onChange={(e) => setAgreedRate(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 23100"
                className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
              />
              {negotiatedDiff > 0 && (
                <div className="mt-1 text-[11px] font-bold text-emerald-700">
                  Quoted ₹{Number(quotedFare).toLocaleString('en-IN')} → Negotiated -₹{negotiatedDiff.toLocaleString('en-IN')}
                </div>
              )}
              {negotiatedDiff < 0 && Number(quotedFare) > 0 && (
                <div className="mt-1 text-[11px] font-bold text-blue-700">
                  Quoted ₹{Number(quotedFare).toLocaleString('en-IN')} → +₹{Math.abs(negotiatedDiff).toLocaleString('en-IN')} added
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Advance (₹)</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAdvance(0)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                      Number(advance) === 0
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    No Adv
                  </button>
                  {[500, 1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdvance(amt)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                        Number(advance) === amt
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                  {Number(agreedRate) > 0 && (
                    <button
                      type="button"
                      onClick={() => setAdvance(Number(agreedRate))}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                        Number(advance) === Number(agreedRate)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      Full
                    </button>
                  )}
                </div>
              </div>
              <input
                type="number"
                value={advance}
                onChange={(e) => setAdvance(Number(e.target.value) || 0)}
                className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Balance To Driver</label>
              <div className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-extrabold flex items-center justify-between">
                <span>₹{balanceAmt.toLocaleString('en-IN')}</span>
                <span className="text-[10px] font-sans font-semibold text-slate-400">
                  {Number(advance) === 0 ? 'Full to Driver' : (tollPolicy === 'All-Inclusive' ? 'All-Incl.' : '+ Tolls')}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Alt Guest / Pax Drawer */}
          {showGuestFields && (
            <div className="space-y-2.5 bg-white border border-slate-200 rounded-xl p-3.5 animate-fadeIn">
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
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Alt / Passenger Phone</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="e.g. 9382155220"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pax Count</label>
                  <input
                    type="text"
                    value={paxCount}
                    onChange={(e) => setPaxCount(e.target.value)}
                    placeholder="e.g. 10 Pax"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Hotel / Stay Landmark</label>
                  <input
                    type="text"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    placeholder="e.g. GT Grande, T. Nagar"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Special Instructions / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Needs Hindi-speaking driver, luggage carrier, waiting at gate..."
              className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* STEP 3: COLLAPSIBLE FULL TRIP, DATES, VEHICLE & BILLING TERMS */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowFullDetails(v => !v)}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between gap-2 transition text-left"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center justify-center">
                3
              </span>
              <div>
                <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                  Trip Type, Dates, Vehicle &amp; Billing Terms
                </span>
                <span className="block text-[11px] text-slate-500">
                  {vehicle} • {scheduleSummary}{pickupTime ? ` @ ${pickupTime}` : ''}
                  {Number(includedKm) > 0 ? ` • ${includedKm} km` : ''}
                  {Number(driverBata) > 0 ? ` • Bata ₹${driverBata}` : ''}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 flex items-center gap-1 shrink-0">
              <span>{showFullDetails ? 'Hide' : 'Edit'}</span>
              <span className="material-symbols-outlined text-base">
                {showFullDetails ? 'expand_less' : 'expand_more'}
              </span>
            </span>
          </button>

          {showFullDetails && (
            <div className="p-4 space-y-5 bg-white border-t border-slate-100 animate-fadeIn">
              {/* Trip Type Pills */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Booking Type
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

              {/* Vehicle + Dates */}
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

              {/* OUTSTATION EXTRA PARAMETERS */}
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
                      placeholder="e.g. 2400"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">State Permit (₹)</label>
                    <input
                      type="number"
                      value={statePermit}
                      onChange={(e) => setStatePermit(Number(e.target.value) || 0)}
                      placeholder="e.g. 0"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* MULTI-DAY CUSTOM ITINERARY BUILDER */}
              {tripCategory === 'Multi-Day Custom Itinerary' && (
                <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-indigo-950">Day-by-Day Itinerary &amp; Rate Breakdown</div>
                      <div className="text-[11px] text-indigo-700">Daily rates automatically sum into Total Agreed Fare.</div>
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
                            placeholder="e.g. Airport T1 Pickup + Chennai Local"
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
                </div>
              )}

              {/* Billing Terms & Quoted Base */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Quoted Base (₹)</label>
                  <input
                    type="number"
                    value={quotedFare}
                    onChange={(e) => setQuotedFare(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Opt."
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Toll &amp; Parking</label>
                  <select
                    value={tollPolicy}
                    onChange={(e) => setTollPolicy(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-semibold text-slate-800"
                  >
                    <option value="Extra at Actuals">Extra at Actuals</option>
                    <option value="All-Inclusive">All-Inclusive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Extra Km (₹/km)</label>
                  <input
                    type="number"
                    value={extraKmRate}
                    onChange={(e) => setExtraKmRate(Number(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Extra Hr (₹/hr)</label>
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

              {negotiatedDiff > 0 && (
                <div className="text-xs font-bold text-emerald-700">
                  Negotiated Discount: -₹{negotiatedDiff.toLocaleString('en-IN')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
              {bookingStatus === 'Quotation' ? 'Save to 1. Quotation' : 'Save to 2. Confirmed'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
