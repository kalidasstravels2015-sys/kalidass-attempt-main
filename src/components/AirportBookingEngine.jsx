import React, { useState, useEffect, useRef } from 'react';
import {
  Plane, Car, Users, User, Calculator, LocateFixed, X,
  ChevronDown, CheckCircle2, ShieldCheck, Navigation,
  Calendar, Phone, ArrowRight, Clock, AlertCircle, MessageSquare
} from 'lucide-react';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import { trackCalculatorQuote, markQuoteConverted } from '../lib/analytics';

// ── Zone data ─────────────────────────────────────────────────────────────
const AIRPORT_ZONES = [
  {
    name: 'South Chennai & Airport Vicinity',
    keywords: ['guindy','tambaram','pallavaram','velachery','chromepet','medavakkam',
      'porur','alandur','st. thomas mount','meenambakkam','nanmangalam','perungalathur',
      'keelkattalai','madipakkam'],
    distanceKm: 12, duration: '15–25 mins',
    rates: { 'Swift Dzire': 650, 'Maruti Ertiga': 1150, 'Innova Crysta': 1500, 'Tempo Traveller': 2400 }
  },
  {
    name: 'Central Chennai & Downtown',
    keywords: ['t. nagar','t nagar','us consulate','anna nagar','nungambakkam','egmore',
      'central','mylapore','alwarpet','kodambakkam','vadapalani','chetpet','kilpauk',
      'royapettah','triplicane','mount road','teynampet','gopalapuram','thousand lights'],
    distanceKm: 22, duration: '30–45 mins',
    rates: { 'Swift Dzire': 950, 'Maruti Ertiga': 1550, 'Innova Crysta': 1950, 'Tempo Traveller': 2900 }
  },
  {
    name: 'OMR & IT Corridor (SIPCOT)',
    keywords: ['omr','perungudi','thoraipakkam','sholinganallur','navalur','siruseri',
      'sipcot','elcot','kelambakkam','padur','karapakkam','semmancheri'],
    distanceKm: 18, duration: '25–40 mins',
    rates: { 'Swift Dzire': 1250, 'Maruti Ertiga': 1850, 'Innova Crysta': 2300, 'Tempo Traveller': 3400 }
  },
  {
    name: 'North Chennai & Port Industrial',
    keywords: ['parrys','broadway','madhavaram','ambattur','ennore','tondiarpet',
      'tiruvottiyur','avadi','red hills','manali','kolathur','perambur','villivakkam'],
    distanceKm: 30, duration: '45–60 mins',
    rates: { 'Swift Dzire': 1350, 'Maruti Ertiga': 1950, 'Innova Crysta': 2450, 'Tempo Traveller': 3600 }
  },
  {
    name: 'ECR Coastal & Beach Resorts',
    keywords: ['ecr','mahabalipuram','mamallapuram','kovalam','nemmeli','muttukadu',
      'intercontinental','radisson','taj fisherman','sheraton'],
    distanceKm: 45, duration: '45–60 mins',
    rates: { 'Swift Dzire': 1650, 'Maruti Ertiga': 2400, 'Innova Crysta': 2950, 'Tempo Traveller': 4200 }
  },
  {
    name: 'Pondicherry & Auroville Direct',
    keywords: ['pondicherry','pondy','auroville','puducherry','white town','promenade'],
    distanceKm: 145, duration: '2.5–3 hrs',
    rates: { 'Swift Dzire': 3900, 'Maruti Ertiga': 5600, 'Innova Crysta': 6800, 'Tempo Traveller': 8900 }
  },
  {
    name: 'Vellore CMC & Tirupati Direct',
    keywords: ['vellore','cmc','tirupati','vit','chittoor','ranipet'],
    distanceKm: 135, duration: '3–3.5 hrs',
    rates: { 'Swift Dzire': 4200, 'Maruti Ertiga': 6200, 'Innova Crysta': 7400, 'Tempo Traveller': 9800 }
  },
];

const VEHICLE_SPECS = {
  'Swift Dzire':     { tag: 'Sedan',        caps: '4 Pax + 2 Bags', pax: '4' },
  'Maruti Ertiga':   { tag: 'SUV',          caps: '6 Pax + 3 Bags', pax: '6' },
  'Innova Crysta':   { tag: 'Executive MPV',caps: '7 Pax + 5 Bags', pax: '7' },
  'Tempo Traveller': { tag: 'Group Minibus',caps: '12 Pax + Bags',   pax: '12' },
};

// Max passengers each vehicle can carry (excluding driver)
const VEHICLE_CAPACITY = {
  'Swift Dzire':     4,
  'Maruti Ertiga':   6,
  'Innova Crysta':   7,
  'Tempo Traveller': 12,
};

const AIRPORT_HUB = 'Chennai International Airport (MAA)';

// ── Multi-currency support for international travelers ────────────────────
const CURRENCY_RATES = {
  INR: { symbol: '₹', rate: 1, label: 'INR (₹)' },
  USD: { symbol: '$', rate: 86.5, label: 'USD ($)' },
  CAD: { symbol: 'C$', rate: 62.5, label: 'CAD (C$)' },
  EUR: { symbol: '€', rate: 93.5, label: 'EUR (€)' },
  RUB: { symbol: '₽', rate: 0.92, label: 'RUB (₽)' },
  GBP: { symbol: '£', rate: 111.0, label: 'GBP (£)' },
};

const convertRate = (inr, curr) => {
  if (!inr) return '₹0';
  if (curr === 'INR' || !CURRENCY_RATES[curr]) return `₹${Number(inr).toLocaleString('en-IN')}`;
  const { symbol, rate } = CURRENCY_RATES[curr];
  const converted = Math.round(inr / rate);
  if (curr === 'RUB') {
    return `${converted.toLocaleString('en-US')} ₽`;
  }
  return `${symbol}${converted.toLocaleString('en-US')}`;
};

const getDefaultDateTime = () => {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:00`;
};

export default function AirportBookingEngine({ showHeader = true, enableStickyBar = false }) {
  const [direction,   setDirection]   = useState('drop'); // 'drop' | 'pickup'
  const [pickup,      setPickup]      = useState('');
  const [drop,        setDrop]        = useState(AIRPORT_HUB);
  const [vehicle,     setVehicle]     = useState('Swift Dzire');
  const [passengers,  setPassengers]  = useState('4');
  const [dateTime,    setDateTime]    = useState(getDefaultDateTime);
  const [flightNo,    setFlightNo]    = useState('');
  const [name,        setName]        = useState('');
  const [phone,       setPhone]       = useState('');
  const [countryCode, setCountryCode] = useState('+91');

  const [matchedZone, setMatchedZone] = useState(null);
  const [estimate,    setEstimate]    = useState(0);
  const [distanceKm,  setDistanceKm]  = useState(0);
  const [duration,    setDuration]    = useState('');
  const [showResult,  setShowResult]  = useState(false);
  const [error,       setError]       = useState('');
  const [loading,       setLoading]       = useState(false);
  const [gettingLoc,    setGettingLoc]    = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [modalErrors, setModalErrors] = useState({});

  const destInputRef  = useRef(null);
  const cardRef       = useRef(null);
  const nameInputRef  = useRef(null);
  const phoneInputRef = useRef(null);

  // ── Listen for external vehicle selection (e.g. from Fleet section) ───────
  useEffect(() => {
    const onSetVehicle = (e) => {
      const v = e.detail?.vehicle;
      if (v && VEHICLE_SPECS[v]) {
        setVehicle(v);
        setPassengers(VEHICLE_SPECS[v].pax);
        setShowResult(false);
      }
    };
    window.addEventListener('airport-set-vehicle', onSetVehicle);
    return () => window.removeEventListener('airport-set-vehicle', onSetVehicle);
  }, []);

  // ── Sticky bar ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enableStickyBar || !cardRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        const isPast = e.boundingClientRect.top < 0 && !e.isIntersecting;
        setShowStickyBar(isPast);
      },
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' }
    );
    obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, [enableStickyBar]);

  // ── Direction swap ──────────────────────────────────────────────────────
  const handleDirectionChange = (dir) => {
    if (dir === direction) return;
    setDirection(dir);
    setShowResult(false);
    setError('');
    if (dir === 'pickup') {
      const loc = pickup === AIRPORT_HUB ? '' : pickup;
      setPickup(AIRPORT_HUB);
      setDrop(loc);
    } else {
      const loc = drop === AIRPORT_HUB ? '' : drop;
      setPickup(loc);
      setDrop(AIRPORT_HUB);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('airport-direction-change', { detail: { direction: dir } }));
    }
  };

  // ── Google Maps autocomplete ────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      loadGoogleMaps().then(() => {
        if (!isMounted || !destInputRef.current || !window.google?.maps?.places) return;
        const ac = new window.google.maps.places.Autocomplete(destInputRef.current, {
          componentRestrictions: { country: 'in' },
          fields: ['name', 'formatted_address', 'geometry'],
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const addr = place.formatted_address || place.name;
          if (!addr) return;
          direction === 'pickup' ? setDrop(addr) : setPickup(addr);
          setShowResult(false);
          setError('');
          if (place.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const rad = x => (x * Math.PI) / 180;
            const R = 6371;
            const dLat = rad(lat - 12.9941);
            const dLng = rad(lng - 80.1709);
            const a = Math.sin(dLat/2)**2 + Math.cos(rad(12.9941))*Math.cos(rad(lat))*Math.sin(dLng/2)**2;
            const roadKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.35);
            const zone =
              roadKm <= 15 ? AIRPORT_ZONES[0] :
              roadKm <= 28 ? AIRPORT_ZONES[1] :
              roadKm <= 40 ? AIRPORT_ZONES[2] :
              roadKm <= 55 ? AIRPORT_ZONES[3] :
              roadKm <= 80 ? AIRPORT_ZONES[4] :
              roadKm <= 150? AIRPORT_ZONES[5] : AIRPORT_ZONES[6];
            setMatchedZone(zone);
            setDistanceKm(roadKm);
            setDuration(`~${Math.max(15, Math.round(roadKm * 1.8))} mins`);
          }
        });
      }).catch(() => {});
    }, 50);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [direction]);

  // ── GPS ─────────────────────────────────────────────────────────────────
  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setGettingLoc(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setGettingLoc(false);
        if (window.google?.maps?.Geocoder) {
          new window.google.maps.Geocoder().geocode(
            { location: { lat, lng } },
            (res, status) => {
              if (status === 'OK' && res[0]) {
                direction === 'pickup' ? setDrop(res[0].formatted_address) : setPickup(res[0].formatted_address);
                setShowResult(false);
              }
            }
          );
        } else {
          const fb = `Current Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
          direction === 'pickup' ? setDrop(fb) : setPickup(fb);
          setShowResult(false);
        }
      },
      () => { setGettingLoc(false); alert('Unable to retrieve location. Please type your area.'); }
    );
  };

  // ── Modal scroll-lock + ESC ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowBookingModal(false); };
    if (showBookingModal) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [showBookingModal]);

  const handleCalculate = () => {
    const userLoc = (direction === 'pickup' ? drop : pickup).trim();
    if (!userLoc || userLoc === AIRPORT_HUB) {
      setError(direction === 'pickup'
        ? 'Please enter your drop location / hotel in Chennai'
        : 'Please enter your pickup doorstep / area in Chennai');
      destInputRef.current?.focus();
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      const q = userLoc.toLowerCase();
      let zone = matchedZone;
      if (!zone || !zone.keywords?.some(kw => q.includes(kw))) {
        zone = AIRPORT_ZONES.find(z => z.keywords.some(kw => q.includes(kw))) || AIRPORT_ZONES[1];
      }
      const finalRate = zone.rates[vehicle] || 650;
      setMatchedZone(zone);
      setEstimate(finalRate);
      setDistanceKm(zone.distanceKm);
      setDuration(zone.duration);
      setLoading(false);
      setModalErrors({});
      setShowBookingModal(true); // open modal with result + booking form

      trackCalculatorQuote({
        calculatorId: 'airport_taxi',
        calculatorEngine: 'Chennai Airport Taxi Estimator',
        tripType: direction === 'pickup' ? 'Airport Pickup (To City)' : 'Airport Drop (To Airport)',
        pickup: direction === 'pickup' ? AIRPORT_HUB : userLoc,
        drop: direction === 'pickup' ? userLoc : AIRPORT_HUB,
        vehicle,
        distanceKm: zone.distanceKm,
        estimatedFare: finalRate,
        meta: {
          direction,
          zone: zone.name,
          flightNo: flightNo || undefined,
          duration: zone.duration
        }
      });
    }, 280);
  };

  // ── Lead Logging to Google Sheets ────────────────────────────────────────
  const logBookingLead = (isPickup, fullPhone) => {
    markQuoteConverted(null, {
      calculatorId: 'airport_taxi',
      name: name.trim(),
      phone: fullPhone,
      vehicle,
      estimate
    });

    try {
      fetch('https://script.google.com/macros/s/AKfycbwoEpKqa3Qg-DIvMe06pGUgGLlC_0vJQev61nzIh9ssh1-uHZ5VtYkGzpMVwhEyi7tvEQ/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          date: new Date().toLocaleString(),
          tripType: isPickup ? 'Airport Pickup' : 'Airport Drop',
          name: name.trim(),
          phone: fullPhone,
          pickup,
          drop,
          vehicle,
          passengers,
          distance: distanceKm,
          estimate,
          travelDate: dateTime,
          flightNo
        })
      }).catch(() => {});
    } catch (_) {}
  };

  // ── WhatsApp ────────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Please enter your name';
    if (!phone.trim()) errs.phone = 'Please enter your mobile / WhatsApp number';
    if (Object.keys(errs).length > 0) {
      setModalErrors(errs);
      if (errs.name) nameInputRef.current?.focus();
      else if (errs.phone) phoneInputRef.current?.focus();
      return;
    }
    setModalErrors({});

    const isPickup = direction === 'pickup';
    const currNote = currency !== 'INR' ? ` (approx. ${convertRate(estimate, currency)})` : '';
    const fullPhone = `${countryCode} ${phone.trim()}`;
    logBookingLead(isPickup, fullPhone);

    const msg = [
      `*Chennai Airport Cab Reservation — Kalidass Travels*`,
      `• *Passenger:* ${name.trim()} | ${fullPhone}`,
      `• *Type:* ${isPickup ? 'Airport PICKUP (Meet & Greet at MAA)' : 'Airport DROP (To Departure Terminal)'}`,
      `• *Route:* ${pickup} ➔ ${drop}`,
      `• *Vehicle:* ${vehicle} (${VEHICLE_SPECS[vehicle].caps})`,
      `• *Fare:* ₹${estimate.toLocaleString('en-IN')}${currNote} — All-Inclusive Package`,
      `• *Includes:* Fuel, Tolls, Airport Parking & GST Invoice`,
      `• *Date & Time:* ${dateTime.replace('T', ' ')}`,
      flightNo ? `• *Flight No:* ${flightNo}` : null,
      `• *Payment:* Pay After Trip — Zero Advance`,
      ``,
      `Please confirm my airport taxi booking. Thank you!`,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/918939539211?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ── Native SMS / iMessage fallback (USA, Canada, Russia, etc. without WhatsApp) ──
  const handleSMS = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Please enter your name';
    if (!phone.trim()) errs.phone = 'Please enter your mobile / WhatsApp number';
    if (Object.keys(errs).length > 0) {
      setModalErrors(errs);
      if (errs.name) nameInputRef.current?.focus();
      else if (errs.phone) phoneInputRef.current?.focus();
      return;
    }
    setModalErrors({});

    const isPickup = direction === 'pickup';
    const currNote = currency !== 'INR' ? ` (approx. ${convertRate(estimate, currency)})` : '';
    const fullPhone = `${countryCode} ${phone.trim()}`;
    logBookingLead(isPickup, fullPhone);

    const msg = [
      `Chennai Airport Taxi Booking — Kalidass Travels`,
      `Passenger: ${name.trim()} (${fullPhone})`,
      `Transfer: ${isPickup ? 'Airport Pickup (MAA Arrival)' : 'Airport Drop (MAA Departure)'}`,
      `Route: ${pickup} to ${drop}`,
      `Vehicle: ${vehicle} (${VEHICLE_SPECS[vehicle].caps})`,
      `Fare: Rs. ${estimate.toLocaleString('en-IN')}${currNote} (All-Inclusive)`,
      `Pickup Date/Time: ${dateTime.replace('T', ' ')}`,
      flightNo ? `Flight No: ${flightNo}` : null,
      `Payment: Pay after trip (Zero advance)`,
    ].filter(Boolean).join('\n');

    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const sep = isIOS ? '&' : '?';
    window.location.href = `sms:+918939539211${sep}body=${encodeURIComponent(msg)}`;
  };

  const handleStickyWhatsApp = () => {
    const fare = showResult && estimate ? ` • ₹${estimate.toLocaleString('en-IN')}` : '';
    const msg = `*Airport Cab Enquiry — Kalidass Travels*\n• Trip: ${direction === 'pickup' ? 'Airport PICKUP' : 'Airport DROP'}\n• Route: ${pickup} ➔ ${drop}\n• Vehicle: ${vehicle}${fare}\nPlease confirm availability.`;
    window.open(`https://wa.me/918939539211?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const fmtRs = n => `₹${Number(n).toLocaleString('en-IN')}`;

  // ── Shared class tokens (unified with QuotationEngine) ──────────────────
  const inputWrap  = 'relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-m3-md px-3 py-2 sm:py-2.5 min-h-[44px] sm:min-h-[48px] focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition-all';
  const inputField = 'bg-transparent w-full outline-none text-sm font-semibold text-m3-on-surface pr-16 placeholder:text-m3-on-surface-variant placeholder:text-xs placeholder:font-normal';
  const labelCls   = 'block text-badge font-bold text-m3-on-surface-variant uppercase tracking-wide mb-1';
  const stickyFrom = direction === 'pickup' ? 'MAA Airport' : (pickup?.split(',')[0] || 'Pickup');
  const stickyTo   = direction === 'pickup' ? (drop?.split(',')[0] || 'Drop') : 'MAA Airport';

  return (
    <>
      {/* ── Sticky summary bar ─────────────────────────────────────────── */}
      {enableStickyBar && (
        <div
          role="banner"
          aria-label="Booking summary"
          className={`fixed top-0 left-0 right-0 z-[100] transition-transform duration-300 ease-in-out ${showStickyBar ? 'translate-y-0' : '-translate-y-full'}`}
        >
          <div className="bg-m3-surface/95 backdrop-blur-md border-b border-m3-outline-variant shadow-m3-1">
            <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-2">
              <span className={`shrink-0 text-[10px] font-extrabold px-2.5 py-1 rounded-m3-full border ${direction === 'pickup' ? 'bg-sky-100 text-sky-800 border-sky-200' : 'bg-m3-primary-container text-m3-primary border-m3-primary/20'}`}>
                ✈ {direction === 'pickup' ? 'PICKUP' : 'DROP'}
              </span>
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-xs font-bold text-m3-on-surface truncate">{stickyFrom}</span>
                <ArrowRight className="w-3 h-3 text-m3-on-surface-variant shrink-0" />
                <span className="text-xs font-bold text-m3-on-surface truncate">{stickyTo}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span className="text-xs text-m3-on-surface-variant font-semibold">{vehicle}</span>
                {showResult && estimate > 0 && (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-m3-full">
                    {fmtRs(estimate)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleStickyWhatsApp}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-m3-full bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-950 border border-emerald-300/80 font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" variant="brand" />
                <span className="hidden xs:inline">Book</span>
              </button>
              <button
                type="button"
                onClick={() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="shrink-0 text-[10px] font-semibold text-m3-on-surface-variant hover:text-m3-on-surface underline underline-offset-2 cursor-pointer"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main booking card (unified design) ────────────────────────── */}
      <div
        ref={cardRef}
        id="airport-fare-finder"
        data-testid="airport-fare-finder"
        className="w-full max-w-2xl mx-auto bg-m3-surface rounded-m3-xl shadow-m3-2 border border-m3-outline-variant overflow-hidden font-sans"
      >
        {/* Header */}
        {showHeader && (
          <div className="p-4 pb-1 text-center">
            <div className="w-10 h-10 rounded-m3-full bg-m3-primary-container flex items-center justify-center mx-auto mb-2">
              <Plane className="w-5 h-5 text-m3-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-m3-on-surface font-heading">Chennai Airport Taxi</h3>
            <p className="text-xs text-m3-on-surface-variant mt-0.5">Flat Zone Fares • Tolls & Parking Included • Pay After Trip</p>
          </div>
        )}

        {/* Tab Pills — identical to QuotationEngine */}
        <div className="px-3 sm:px-6 my-4">
          <div role="tablist" aria-label="Transfer Direction" className="bg-m3-surface-container-high p-1 rounded-m3-full flex gap-1 border border-m3-outline-variant">
            {[
              { key: 'drop',   label: 'Airport Drop',   testId: 'tab-drop' },
              { key: 'pickup', label: 'Airport Pickup', testId: 'tab-pickup' },
            ].map(tab => (
              <button
                key={tab.key}
                role="tab"
                data-testid={tab.testId}
                aria-selected={direction === tab.key}
                onClick={() => handleDirectionChange(tab.key)}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-m3-full transition-all min-h-[38px] sm:min-h-[42px] cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary inline-flex items-center justify-center gap-1.5 ${
                  direction === tab.key
                    ? 'bg-m3-primary text-m3-on-primary shadow-m3-1'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest'
                }`}
              >
                <Plane className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); handleCalculate(); }} className="px-3 sm:px-6 pb-5 space-y-3">

          {/* Error */}
          {error && (
            <div className="p-2.5 bg-m3-error-container/40 text-m3-error text-xs font-bold rounded-m3-md flex items-center gap-2 border border-m3-error/20">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* FROM field */}
          <div>
            <label className={labelCls}>
              {direction === 'pickup' ? 'From (Airport)' : 'From (Your Doorstep)'}
            </label>
            <div className={inputWrap}>
              <input
                id="airport-from-input"
                data-testid="airport-from-input"
                ref={direction === 'drop' ? destInputRef : null}
                type="text"
                value={pickup}
                readOnly={direction === 'pickup'}
                onChange={e => { if (direction === 'drop') { setPickup(e.target.value); setShowResult(false); setError(''); } }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCalculate(); } }}
                placeholder={direction === 'pickup' ? AIRPORT_HUB : 'Enter your area / doorstep address'}
                className={`${inputField} ${direction === 'pickup' ? 'cursor-default text-m3-primary font-bold' : ''}`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {direction === 'drop' && pickup && (
                  <button type="button" onClick={() => { setPickup(''); setShowResult(false); }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-full text-m3-on-surface-variant">
                    <X className="w-4 h-4" />
                  </button>
                )}
                {direction === 'drop' && (
                  <button type="button" onClick={handleGPS} disabled={gettingLoc}
                    className="w-7 h-7 flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-sm text-m3-on-surface-variant hover:text-m3-primary transition-colors"
                    title="Use current location">
                    <LocateFixed className={`w-4 h-4 ${gettingLoc ? 'animate-spin text-m3-primary' : ''}`} />
                  </button>
                )}
                {direction === 'pickup' && (
                  <span className="w-7 h-7 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* TO field */}
          <div>
            <label className={labelCls}>
              {direction === 'pickup' ? 'To (Your Destination)' : 'To (Airport)'}
            </label>
            <div className={inputWrap}>
              <input
                id="airport-to-input"
                data-testid="airport-to-input"
                ref={direction === 'pickup' ? destInputRef : null}
                type="text"
                value={drop}
                readOnly={direction === 'drop'}
                onChange={e => { if (direction === 'pickup') { setDrop(e.target.value); setShowResult(false); setError(''); } }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCalculate(); } }}
                placeholder={direction === 'drop' ? AIRPORT_HUB : 'Enter hotel / area / address'}
                className={`${inputField} ${direction === 'drop' ? 'cursor-default text-m3-primary font-bold' : ''}`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {direction === 'pickup' && drop && (
                  <button type="button" onClick={() => { setDrop(''); setShowResult(false); }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-full text-m3-on-surface-variant">
                    <X className="w-4 h-4" />
                  </button>
                )}
                {direction === 'pickup' && (
                  <button type="button" onClick={handleGPS} disabled={gettingLoc}
                    className="w-7 h-7 flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-sm text-m3-on-surface-variant hover:text-m3-primary transition-colors"
                    title="Use current location">
                    <LocateFixed className={`w-4 h-4 ${gettingLoc ? 'animate-spin text-m3-primary' : ''}`} />
                  </button>
                )}
                {direction === 'drop' && (
                  <span className="w-7 h-7 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Passengers + Vehicle row — single col on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label htmlFor="airport-passengers" className={labelCls}>Passengers</label>
              <div className={`${inputWrap} cursor-pointer`}>
                <Users className="w-4 h-4 text-m3-on-surface-variant mr-2 shrink-0" />
                <select
                  id="airport-passengers"
                  value={passengers}
                  onChange={e => {
                    const p = e.target.value;
                    setPassengers(p);
                    // Auto-upgrade: pick smallest vehicle that fits
                    const paxNum = parseInt(p);
                    const currentCap = VEHICLE_CAPACITY[vehicle] ?? 4;
                    if (currentCap < paxNum) {
                      const nextVehicle = Object.keys(VEHICLE_CAPACITY).find(v => VEHICLE_CAPACITY[v] >= paxNum);
                      if (nextVehicle) setVehicle(nextVehicle);
                    }
                    setShowResult(false);
                  }}
                  className="bg-transparent w-full outline-none text-sm font-semibold text-m3-on-surface appearance-none cursor-pointer pr-8"
                >
                  <option value="4">4 Passengers</option>
                  <option value="6">6 Passengers</option>
                  <option value="7">7 Passengers</option>
                  <option value="12">12 Passengers</option>
                </select>
                <ChevronDown className="w-4 h-4 text-m3-on-surface-variant pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label htmlFor="airport-vehicle" className={labelCls}>Vehicle</label>
              <div className={`${inputWrap} cursor-pointer`}>
                <Car className="w-4 h-4 text-m3-on-surface-variant mr-2 shrink-0" />
                <select
                  id="airport-vehicle"
                  value={vehicle}
                  onChange={e => {
                    const v = e.target.value;
                    setVehicle(v);
                    setPassengers(VEHICLE_SPECS[v].pax);
                    setShowResult(false);
                  }}
                  className="bg-transparent w-full outline-none text-sm font-semibold text-m3-on-surface appearance-none cursor-pointer pr-8"
                >
                  {Object.keys(VEHICLE_SPECS).map(v => {
                    const cap = VEHICLE_CAPACITY[v] ?? 4;
                    const paxNum = parseInt(passengers);
                    const disabled = cap < paxNum;
                    const spec = VEHICLE_SPECS[v];
                    const label = `${spec.tag} — ${v.replace('Swift ', '').replace('Maruti ', '')}${disabled ? ` (max ${cap} pax)` : ''}`;
                    return (
                      <option key={v} value={v} disabled={disabled}>{label}</option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-m3-on-surface-variant pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Passenger-Vehicle capacity warning */}
          {(() => {
            const cap = VEHICLE_CAPACITY[vehicle] ?? 4;
            const paxNum = parseInt(passengers);
            if (cap < paxNum) {
              return (
                <div className="flex items-start gap-2 px-3 py-2 rounded-m3-md bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>{vehicle} seats max {cap} passengers. Please select a larger vehicle for {paxNum} pax.</span>
                </div>
              );
            }
            return null;
          })()}

          {/* Calculate button — exact QuotationEngine style */}
          <button
            type="submit"
            id="get-flat-fare-btn"
            data-testid="get-flat-fare-btn"
            disabled={loading}
            className="w-full max-w-[260px] sm:max-w-[280px] mx-auto bg-m3-primary hover:bg-slate-900 text-m3-on-primary font-bold py-3 rounded-m3-full transition-all flex items-center justify-center gap-2 shadow-m3-1 hover:shadow-m3-2 text-sm sm:text-base min-h-[46px] sm:min-h-[50px] cursor-pointer active:scale-[0.98] disabled:opacity-75 border border-white/10"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Calculating...</span></>
            ) : (
              <><Calculator className="w-4 h-4" /><span>Get Flat Fare</span></>
            )}
          </button>

        </form>
      </div>

      {/* ── Result + Booking Modal ────────────────────────────────────── */}
      {/* Portaled to <body> so z-[200/201] escape the page's `relative z-20` stacking
          context; data-hide-contact-dock hides the global sticky Call/WhatsApp dock
          (see docs/03_RULES.md §8.4). Only opens after a click, so no SSR mismatch. */}
      {showBookingModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBookingModal(false)}
            aria-hidden="true"
          />

          {/* Bottom-sheet on mobile, centered dialog on desktop */}
          <div
            id="airport-booking-modal"
            data-testid="airport-booking-modal"
            data-hide-contact-dock
            role="dialog"
            aria-modal="true"
            aria-label="Airport fare and booking"
            className="fixed z-[201] inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full sm:max-w-md bg-m3-surface rounded-t-m3-2xl sm:rounded-m3-2xl shadow-m3-3 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

              {/* Drag handle (mobile only) */}
              <div className="flex justify-center pt-2.5 sm:hidden shrink-0">
                <div className="w-10 h-1 rounded-full bg-m3-outline-variant" />
              </div>

              {/* Modal header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-m3-outline-variant/60 shrink-0">
                <span className="text-sm font-bold text-m3-on-surface">Trip Summary & Booking</span>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-m3-full hover:bg-m3-surface-container-high transition-colors text-m3-on-surface-variant hover:text-m3-on-surface cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body: clean, fits without scrolling */}
              <form onSubmit={e => { e.preventDefault(); handleWhatsApp(); }} className="px-4 py-3 space-y-3">

                {/* Unified Fare & Trip Card — stable layout with no jitter when currency changes */}
                <div className="bg-m3-surface-container-low p-3 rounded-m3-lg border border-m3-outline-variant space-y-1.5">
                  {/* Row 1: Destination + Distance/Time */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-m3-on-surface truncate">
                      {matchedZone?.name || (direction === 'pickup' ? drop : pickup)}
                    </span>
                    <span className="text-[11px] text-m3-on-surface-variant shrink-0 font-medium whitespace-nowrap">
                      {distanceKm} km · {duration}
                    </span>
                  </div>

                  {/* Row 2: Vehicle spec on left, Stable Price & Currency on right */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-xs text-m3-on-surface-variant font-medium">
                      {vehicle} ({VEHICLE_SPECS[vehicle].caps.split('+')[0].trim()})
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-lg sm:text-xl font-bold text-m3-on-surface tracking-tight font-heading tabular-nums">
                        {convertRate(estimate, currency)}
                      </span>
                      <select
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        aria-label="Select currency"
                        className="text-[10px] font-bold bg-m3-surface border border-m3-outline-variant rounded px-1.5 py-0.5 text-m3-primary cursor-pointer hover:bg-m3-surface-container outline-none"
                      >
                        <option value="INR">₹ INR</option>
                        <option value="USD">$ USD</option>
                        <option value="CAD">C$ CAD</option>
                        <option value="EUR">€ EUR</option>
                        <option value="RUB">₽ RUB</option>
                        <option value="GBP">£ GBP</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Inclusions */}
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 rounded-m3-md font-medium">
                    <span>Includes tolls, parking, fuel & GST</span>
                    <span className="font-semibold text-emerald-700">Pay after trip</span>
                  </div>
                </div>

                {/* Booking Inputs — each in a separate row */}
                <div className="space-y-2">
                  {/* 1. Date & Time */}
                  <div>
                    <label htmlFor="modal-datetime" className={labelCls}>Pickup Date & Time</label>
                    <div className={inputWrap}>
                      <input
                        id="modal-datetime"
                        type="datetime-local"
                        value={dateTime}
                        onChange={e => setDateTime(e.target.value)}
                        className="bg-transparent w-full outline-none text-sm text-m3-on-surface font-semibold cursor-pointer min-w-0"
                      />
                    </div>
                  </div>

                  {/* 2. Name in separate row */}
                  <div>
                    <label htmlFor="modal-name" className={labelCls}>Your Name</label>
                    <div className={`${inputWrap} ${modalErrors.name ? '!border-red-500 !ring-1 !ring-red-500' : ''}`}>
                      <input
                        id="modal-name"
                        ref={nameInputRef}
                        type="text"
                        placeholder="Full name"
                        value={name}
                        onChange={e => { setName(e.target.value); setModalErrors(prev => ({ ...prev, name: '' })); }}
                        className="bg-transparent w-full outline-none text-sm font-semibold text-m3-on-surface placeholder:text-m3-on-surface-variant/40 placeholder:text-xs placeholder:font-normal"
                      />
                    </div>
                    {modalErrors.name && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{modalErrors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* 3. Mobile Number with Country Code Dropdown */}
                  <div>
                    <label htmlFor="modal-phone" className={labelCls}>Mobile / WhatsApp</label>
                    <div className={`${inputWrap} !p-0 overflow-hidden ${modalErrors.phone ? '!border-red-500 !ring-1 !ring-red-500' : ''}`}>
                      <select
                        value={countryCode}
                        onChange={e => setCountryCode(e.target.value)}
                        aria-label="Country Code"
                        className="h-[44px] bg-m3-surface-container-high/70 hover:bg-m3-surface-container-high border-r border-m3-outline-variant px-2.5 text-xs font-bold text-m3-on-surface outline-none cursor-pointer shrink-0"
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+1">🇨🇦 +1</option>
                        <option value="+7">🇷🇺 +7</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+65">🇸🇬 +65</option>
                        <option value="+60">🇲🇾 +60</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+94">🇱🇰 +94</option>
                      </select>
                      <input
                        id="modal-phone"
                        ref={phoneInputRef}
                        type="tel"
                        placeholder="Mobile number"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setModalErrors(prev => ({ ...prev, phone: '' })); }}
                        className="bg-transparent flex-1 px-3 outline-none text-sm font-semibold text-m3-on-surface placeholder:text-m3-on-surface-variant/40 placeholder:text-xs placeholder:font-normal"
                      />
                    </div>
                    {modalErrors.phone && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{modalErrors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* 4. Flight No in separate row */}
                  <div>
                    <label htmlFor="modal-flight" className={labelCls}>
                      Flight No <span className="font-normal normal-case text-m3-on-surface-variant/70">(optional)</span>
                    </label>
                    <div className={inputWrap}>
                      <input
                        id="modal-flight"
                        type="text"
                        placeholder="e.g. 6E 204"
                        value={flightNo}
                        onChange={e => setFlightNo(e.target.value.toUpperCase())}
                        className="bg-transparent w-full outline-none text-sm font-semibold text-m3-on-surface uppercase placeholder:normal-case placeholder:text-m3-on-surface-variant/40 placeholder:text-xs placeholder:font-normal"
                      />
                    </div>
                  </div>
                </div>

                {/* Inline Error summary */}
                {(modalErrors.name || modalErrors.phone) && (
                  <div className="p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-m3-md flex items-center gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{modalErrors.name || modalErrors.phone}</span>
                  </div>
                )}

                {/* Footer CTAs — unified with WhatsAppButton.astro design system */}
                <div className="pt-2 border-t border-m3-outline-variant/60 space-y-2">

                  {/* Primary: WhatsApp Enquiry */}
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-950 border border-emerald-300/80 rounded-m3-full font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer text-sm select-none"
                  >
                    <WhatsAppIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" variant="brand" />
                    <span>Send Booking Enquiry</span>
                  </button>

                  {/* UX hint */}
                  <p className="text-center text-[11px] text-m3-on-surface-variant leading-snug">
                    Opens WhatsApp with your trip details already filled in
                  </p>

                  {/* Secondary: Call + SMS / iMessage fallback */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="tel:+918939539211"
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-m3-full bg-m3-surface-container hover:bg-blue-50 active:bg-blue-100 text-m3-on-surface hover:text-[#1A73E8] border border-m3-outline-variant hover:border-blue-300 text-xs font-bold transition-all select-none"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
                      <span>Call 24/7 Desk</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleSMS}
                      title="No WhatsApp? Send booking via native SMS or iMessage"
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-m3-full bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant text-xs font-bold text-m3-on-surface transition-all active:scale-[0.98] cursor-pointer select-none"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>No WhatsApp? SMS</span>
                    </button>
                  </div>
                </div>

              </form>

            </div>
          </div>
        </>
      )}

    </>
  );
}
