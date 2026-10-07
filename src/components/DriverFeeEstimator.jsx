import React, { useState, useEffect, useRef } from 'react';
import {
  Car, MapPin, Calendar, Calculator, ArrowRight, Check,
  ChevronDown, Info, User, Navigation, X,
  ShieldCheck, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import tnBusFares from '../data/tnBusFares.json';
import { loadGoogleMaps } from '../lib/googleMapsLoader';

// ── Shared distance lookup (same as QuotationEngine) ──────────────────────
const COMMON_DISTANCES = {
  'chennai': 0, 'pondicherry': 151, 'puducherry': 151, 'bangalore': 346,
  'bengaluru': 346, 'tirupati': 135, 'vellore': 137, 'kanchipuram': 75,
  'mahabalipuram': 56, 'trichy': 332, 'tiruchirappalli': 332, 'madurai': 462,
  'coimbatore': 505, 'salem': 340, 'thanjavur': 342, 'tirunelveli': 624,
  'kanyakumari': 708, 'rameshwaram': 575, 'kodaikanal': 530, 'ooty': 555,
  'munnar': 580, 'mysore': 480, 'tiruvannamalai': 195, 'chidambaram': 215,
  'kumbakonam': 298, 'nagapattinam': 315, 'velankanni': 325, 'yelagiri': 230,
  'yercaud': 365, 'hosur': 305, 'krishnagiri': 260, 'erode': 395,
  'tirupur': 460, 'dindigul': 420, 'karur': 375, 'cuddalore': 180,
  'villupuram': 165, 'chengalpattu': 55, 'tambaram': 30, 'sriperumbudur': 45,
  'nellore': 175, 'vijayawada': 450, 'hyderabad': 630,
};

const CHENNAI_FORMS = [
  'chennai', 'airport', 'tambaram', 'guindy', 'koyambedu', 'egmore', 'central',
  'pallavaram', 'velachery', 'porur', 'annanagar', 'anna nagar', 't nagar', 't. nagar',
  'sholinganallur', 'omr', 'ecr', 'perungudi', 'thiruvanmiyur', 'adyar', 'mylapore',
  'chromepet', 'medavakkam', 'madipakkam', 'alandur', 'vadapalani', 'ambattur', 'avadi',
  'poonamallee', 'kolathur', 'redhills', 'kilpauk', 'nungambakkam', 'triplicane', 'royapettah'
];

const findKnownDistance = (origin, dest) => {
  const o = (origin || '').toLowerCase().trim();
  const d = (dest || '').toLowerCase().trim();
  if (!o && !d) return null;

  // 1. tnBusFares table lookup
  if (o && d) {
    const busRoute = tnBusFares.find(r =>
      (o.includes(r.source) && d.includes(r.destination)) ||
      (o.includes(r.destination) && d.includes(r.source))
    );
    if (busRoute) return { distance: busRoute.distanceKm, setcFare: busRoute.setcFare };
  }

  // 2. Check if either origin or destination is in Chennai metropolitan area
  const isOChennai = CHENNAI_FORMS.some(k => o.includes(k));
  const isDChennai = CHENNAI_FORMS.some(k => d.includes(k));

  if (isOChennai || isDChennai) {
    const other = isOChennai ? d : o;
    for (const [city, km] of Object.entries(COMMON_DISTANCES)) {
      if (other && other.includes(city)) return { distance: km, setcFare: Math.round(km * 1.2) };
    }
  }

  // 3. Fallback: single known city from Chennai
  const candidate = d || o;
  for (const [city, km] of Object.entries(COMMON_DISTANCES)) {
    if (candidate && candidate.includes(city)) {
      return { distance: km, setcFare: Math.round(km * 1.2) };
    }
  }

  return null;
};

// ── Vehicle data (updated Chennai market rates) ────────────────────────────
const VEHICLES = [
  { key: 'hatchback', label: 'Hatchback & Sedan',  models: 'Dzire, Etios, Honda City, Verna', bata: 1100 },
  { key: 'suv',       label: 'Compact SUV / MPV',   models: 'Ertiga, Creta, Seltos, Carens',  bata: 1200 },
  { key: 'premium',   label: 'Premium SUV / MUV',   models: 'Innova Crysta, Fortuner, Safari', bata: 1300 },
  { key: 'luxury',    label: 'Luxury European',      models: 'BMW, Mercedes-Benz, Audi',        bata: 1500 },
];

const FOOD_PER_DAY   = 300; // 2 meals @ ₹150
const STAY_PER_NIGHT = 300; // Dormitory allowance

export default function DriverFeeEstimator({
  title    = 'Outstation Driver Estimator',
  subtitle = 'Calculate exact Bata, Stay & Transit',
  embedded = false,
}) {
  const [activeTab,     setActiveTab]     = useState('oneway');
  const [vehicleKey,    setVehicleKey]    = useState('hatchback');
  const [gear,          setGear]          = useState('manual');
  const [carModel,      setCarModel]      = useState('');
  const [travelDate,    setTravelDate]    = useState('');
  const [reportingTime, setReportingTime] = useState('');
  const [pickup,        setPickup]        = useState('');
  const [drop,          setDrop]          = useState('');
  const [days,          setDays]          = useState(2);
  const [foodProvided,  setFoodProvided]  = useState(false);
  const [stayProvided,  setStayProvided]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [showResult,    setShowResult]    = useState(false);
  const [result,        setResult]        = useState(null);
  const [error,         setError]         = useState('');
  const [fieldErrors,   setFieldErrors]   = useState({});

  const pickupRef       = useRef(null);
  const dropRef         = useRef(null);
  const autocompleteRef = useRef(false);
  const resultRef       = useRef(null);

  const vehicle = VEHICLES.find(v => v.key === vehicleKey) || VEHICLES[0];

  // ── Google Maps Autocomplete ───────────────────────────────────────────
  useEffect(() => {
    // Eagerly trigger Google Maps loading
    loadGoogleMaps().catch(() => {});
    const init = () => {
      if (autocompleteRef.current) return;
      if (!window.google?.maps?.places) return;
      const opts = { componentRestrictions: { country: 'in' }, fields: ['name', 'formatted_address'] };
      if (pickupRef.current) {
        const ac = new window.google.maps.places.Autocomplete(pickupRef.current, opts);
        ac.addListener('place_changed', () => {
          const p = ac.getPlace();
          setPickup(p.formatted_address || p.name || '');
          setShowResult(false);
          setFieldErrors(prev => ({ ...prev, pickup: undefined }));
        });
      }
      if (dropRef.current) {
        const ac = new window.google.maps.places.Autocomplete(dropRef.current, opts);
        ac.addListener('place_changed', () => {
          const p = ac.getPlace();
          setDrop(p.formatted_address || p.name || '');
          setShowResult(false);
          setFieldErrors(prev => ({ ...prev, drop: undefined }));
        });
      }
      autocompleteRef.current = true;
    };
    window.addEventListener('google-maps-loaded', init);
    const id = setInterval(() => {
      if (window.google?.maps?.places) { init(); clearInterval(id); }
    }, 300);
    return () => { window.removeEventListener('google-maps-loaded', init); clearInterval(id); };
  }, []);

  // ── Calculation Logic ─────────────────────────────────────────────────
  const handleCalculate = () => {
    setError('');
    const newFieldErrors = {};
    if (!pickup.trim()) {
      newFieldErrors.pickup = 'Please enter your pickup location.';
    }
    if (activeTab === 'oneway' && !drop.trim()) {
      newFieldErrors.drop = 'Please enter the drop location for One Way trip.';
    }
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError('Please fill in required location fields.');
      return;
    }
    setFieldErrors({});
    loadGoogleMaps().catch(() => {});
    setLoading(true);

    const doCalc = (distKm, setcFare) => {
      const d = Math.max(1, parseInt(days) || 1);
      const nights = Math.max(0, d - 1);

      if (activeTab === 'round') {
        const totalBata = vehicle.bata * d;
        const totalFood = foodProvided ? 0 : FOOD_PER_DAY * d;
        const totalStay = stayProvided ? 0 : STAY_PER_NIGHT * nights;
        const total = totalBata + totalFood + totalStay;
        setResult({
          type: 'round',
          distKm: distKm ? distKm * 2 : null,
          bata: vehicle.bata, totalBata, totalFood, totalStay,
          foodProvided, stayProvided, nights, days: d, total,
          whatsapp: buildWhatsApp('round', total, d, distKm),
        });
      } else {
        const isLongDistance = Boolean(distKm && distKm > 400);
        const bataMultiplier = isLongDistance ? 1.5 : 1;
        const totalBata = Math.round(vehicle.bata * bataMultiplier);
        const totalFood = FOOD_PER_DAY;
        const busFare   = setcFare || (distKm ? Math.round(distKm * 1.2) : 250);
        const total = totalBata + totalFood + busFare;
        setResult({
          type: 'oneway',
          distKm,
          isLongDistance,
          bataMultiplier,
          bata: vehicle.bata, totalBata, totalFood, busFare, total,
          whatsapp: buildWhatsApp('oneway', total, 1, distKm, isLongDistance),
        });
      }

      setShowResult(true);
      setLoading(false);
      setTimeout(() => {
        if (resultRef.current && typeof window !== 'undefined') {
          const yOffset = -70;
          const y = resultRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }, 60);
    };

    // 1. Local fast lookup
    const known = findKnownDistance(pickup, drop);
    if (known) { setTimeout(() => doCalc(known.distance, known.setcFare), 200); return; }

    // 2. Google Distance Matrix
    if (window.google?.maps && drop.trim() && pickup.trim()) {
      const svc = new window.google.maps.DistanceMatrixService();
      svc.getDistanceMatrix(
        { origins: [pickup.trim()], destinations: [drop.trim()], travelMode: 'DRIVING', unitSystem: 0 },
        (res, status) => {
          if (status === 'OK' && res.rows[0]?.elements[0]?.status === 'OK') {
            doCalc(Math.round(res.rows[0].elements[0].distance.value / 1000), null);
          } else {
            doCalc(null, null);
          }
        }
      );
      return;
    }

    // 3. Time-based fallback (round trip, no drop or offline)
    doCalc(null, null);
  };

  const buildWhatsApp = (type, total, days, distKm, isLongDistance = false) => {
    const route = drop.trim() ? `${pickup} → ${drop}` : pickup;
    const distStr = distKm ? ` (~${type === 'round' ? distKm * 2 : distKm} km)` : '';
    const longDistNote = isLongDistance ? ' (Includes 1.5x Bata for >400 km return transit)' : '';
    const gearLabel = gear === 'automatic' ? 'Automatic (AT / DCT / EV)' : 'Manual (MT)';
    const carLabel = carModel.trim() ? `${carModel.trim()} (${vehicle.label})` : vehicle.label;
    const schedStr = travelDate ? `${travelDate}${reportingTime ? ` @ ${reportingTime}` : ''}` : (reportingTime ? `@ ${reportingTime}` : '');

    const msg = 
      `Hi Kalidass Travels, I need an Outstation Acting Driver:\n\n` +
      `📋 BOOKING DETAILS:\n` +
      `• Trip: ${type === 'round' ? 'Round Trip' : 'One Way Drop'}${longDistNote}\n` +
      `• Route: ${route}${distStr}\n` +
      `• Duration: ${days} Day${days > 1 ? 's' : ''}\n` +
      `• Est. Total: ₹${total.toLocaleString('en-IN')}\n\n` +
      `🚗 VEHICLE DETAILS:\n` +
      `• Car Model: ${carLabel}\n` +
      `• Transmission / Gear: ${gearLabel}\n` +
      (schedStr ? `\n📅 SCHEDULE:\n• Travel Date & Time: ${schedStr}\n` : '') +
      `\nPlease assign a verified chauffeur and confirm driver availability.`;
    return buildWhatsAppUrl(msg);
  };

  const fmtRs = n => `₹${Number(n).toLocaleString('en-IN')}`;

  // ── Shared class helpers (mirrors QuotationEngine exactly) ─────────────
  const inputWrap  = 'relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-m3-md px-3 py-2 sm:py-2.5 min-h-[44px] sm:min-h-[48px] focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition-all';
  const inputField = 'bg-transparent w-full outline-none text-sm font-semibold text-m3-on-surface pr-8 placeholder:text-m3-on-surface-variant placeholder:text-xs placeholder:font-normal';
  const labelCls   = 'block text-badge font-bold text-m3-on-surface-variant uppercase tracking-wide mb-1';

  const outerCls = embedded
    ? 'w-full font-sans'
    : 'w-full max-w-2xl mx-auto bg-m3-surface rounded-m3-xl shadow-m3-2 border border-m3-outline-variant overflow-hidden font-sans';

  return (
    <div className={outerCls}>

      {/* ── Header (hidden when embedded) ── */}
      {!embedded && (
        <div className="p-4 pb-1 text-center">
          <div className="w-10 h-10 rounded-m3-full bg-m3-primary-container flex items-center justify-center mx-auto mb-2">
            <User className="w-5 h-5 text-m3-primary" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-m3-on-surface font-heading">{title}</h3>
          <p className="text-xs text-m3-on-surface-variant mt-0.5">{subtitle}</p>
        </div>
      )}

      {/* ── Tab Pills ── */}
      <div className={embedded ? 'px-3 sm:px-6 pt-5 mb-4' : 'px-3 sm:px-6 my-4'}>
        <div role="tablist" aria-label="Trip Type" className="bg-m3-surface-container-high p-1 rounded-m3-full flex gap-1 border border-m3-outline-variant">
          {[
            { key: 'oneway', label: 'One Way Drop' },
            { key: 'round',  label: 'Round Trip'   },
          ].map(tab => (
            <button
              key={tab.key}
              id={`acting-driver-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => { setActiveTab(tab.key); setShowResult(false); setError(''); }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-m3-full transition-all min-h-[40px] cursor-pointer active:scale-[0.98] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary ${
                activeTab === tab.key
                  ? 'bg-m3-primary text-m3-on-primary shadow-m3-1'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`px-3 sm:px-6 pb-6 space-y-3 ${embedded ? '' : ''}`}>

        {/* ── Error Banner ── */}
        {error && (
          <div className="p-2.5 bg-m3-error-container/40 text-m3-error text-xs font-bold rounded-m3-md flex items-center gap-2 border border-m3-error/20">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* ── Vehicle Selector ── */}
        <div>
          <label className={labelCls}>Vehicle Type</label>
          <div className={`${inputWrap} cursor-pointer`}>
            <Car className="w-4 h-4 text-m3-on-surface-variant mr-2 shrink-0" />
            <select
              value={vehicleKey}
              onChange={e => { setVehicleKey(e.target.value); setShowResult(false); }}
              className="bg-transparent w-full outline-none text-sm font-semibold text-m3-on-surface appearance-none cursor-pointer pr-6"
            >
              {VEHICLES.map(v => (
                <option key={v.key} value={v.key}>{v.label}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-m3-on-surface-variant pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <p className="text-micro text-m3-on-surface-variant mt-1">{vehicle.models}</p>
        </div>

        {/* ── Car Model & Transmission (Gear) Intake ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className={labelCls}>Car Model / Name</label>
            <div className={inputWrap}>
              <Car className="w-4 h-4 text-m3-on-surface-variant mr-2 shrink-0" />
              <input
                type="text"
                value={carModel}
                onChange={e => { setCarModel(e.target.value); setShowResult(false); }}
                placeholder="e.g. Swift, Creta, Innova, City..."
                className={inputField}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Transmission (Gear)</label>
            <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-m3-surface-container-low border border-m3-outline-variant rounded-m3-md min-h-[44px] sm:min-h-[48px] items-center">
              <button
                type="button"
                onClick={() => { setGear('manual'); setShowResult(false); }}
                className={`py-2 px-2 text-xs font-bold rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  gear === 'manual'
                    ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                    : 'text-m3-on-surface hover:bg-m3-surface-container'
                }`}
              >
                <span>⚙️ Manual</span>
              </button>
              <button
                type="button"
                onClick={() => { setGear('automatic'); setShowResult(false); }}
                className={`py-2 px-2 text-xs font-bold rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  gear === 'automatic'
                    ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                    : 'text-m3-on-surface hover:bg-m3-surface-container'
                }`}
              >
                <span>🕹️ Automatic</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Pickup Location (both tabs) ── */}
        <div>
          <label className={labelCls}>Pickup Location</label>
          <div className={`${inputWrap} ${fieldErrors.pickup ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/20' : ''}`}>
            <MapPin className="w-4 h-4 text-m3-on-surface-variant mr-2 shrink-0" />
            <input
              id="acting-driver-pickup-input"
              ref={pickupRef}
              type="text"
              value={pickup}
              onChange={e => {
                setPickup(e.target.value);
                setShowResult(false);
                setFieldErrors(prev => ({ ...prev, pickup: undefined }));
              }}
              onFocus={() => loadGoogleMaps().catch(() => {})}
              placeholder="e.g. Pallavaram, Chennai"
              autoComplete="off"
              className={inputField}
            />
            {pickup && (
              <button type="button" onClick={() => { setPickup(''); setShowResult(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-full text-m3-on-surface-variant">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {fieldErrors.pickup && (
            <p className="mt-1 text-xs text-m3-error font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors.pickup}</span>
            </p>
          )}
        </div>

        {/* ── Drop / Destination Location ── */}
        <div>
          <label className={labelCls}>
            {activeTab === 'round' ? (
              <span>Destination City / Outstation Route <span className="normal-case font-normal text-m3-on-surface-variant text-[11px]">(optional for round trip)</span></span>
            ) : (
              'Drop Location'
            )}
          </label>
          <div className={`${inputWrap} ${fieldErrors.drop ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/20' : ''}`}>
            <Navigation className="w-4 h-4 text-m3-on-surface-variant mr-2 shrink-0" />
            <input
              id="acting-driver-drop-input"
              ref={dropRef}
              type="text"
              value={drop}
              onChange={e => {
                setDrop(e.target.value);
                setShowResult(false);
                setFieldErrors(prev => ({ ...prev, drop: undefined }));
              }}
              onFocus={() => loadGoogleMaps().catch(() => {})}
              placeholder={activeTab === 'round' ? 'e.g. Tirupati, Madurai, Ooty' : 'e.g. Tirupati, Madurai'}
              autoComplete="off"
              className={inputField}
            />
            {drop && (
              <button type="button" onClick={() => { setDrop(''); setShowResult(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-full text-m3-on-surface-variant">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {fieldErrors.drop && (
            <p className="mt-1 text-xs text-m3-error font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors.drop}</span>
            </p>
          )}
          {activeTab === 'round' && (
            <p className="text-micro text-m3-on-surface-variant mt-1">
              ℹ️ Round trip returns to pickup — cost is time-based (days × bata) with zero return km fee.
            </p>
          )}
        </div>

        {/* ── Travel Date & Pickup Time ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className={labelCls}>Travel Date</label>
            <div className={inputWrap}>
              <Calendar className="w-4 h-4 text-m3-on-surface-variant mr-2 shrink-0" />
              <input
                type="date"
                value={travelDate}
                onChange={e => { setTravelDate(e.target.value); setShowResult(false); }}
                className={`${inputField} cursor-pointer`}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Reporting Time</label>
            <div className={inputWrap}>
              <Clock className="w-4 h-4 text-m3-on-surface-variant mr-2 shrink-0" />
              <input
                type="text"
                value={reportingTime}
                onChange={e => { setReportingTime(e.target.value); setShowResult(false); }}
                placeholder="e.g. 06:00 AM"
                className={inputField}
              />
            </div>
          </div>
        </div>

        {/* ── Round Trip Extra Fields ── */}
        {activeTab === 'round' && (
          <>
            <div>
              <label className={labelCls}>Total Duration (Days)</label>
              <div className={inputWrap}>
                <Calendar className="w-4 h-4 text-m3-primary mr-2 shrink-0" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={days}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '' || /^\d+$/.test(v)) setDays(v === '' ? '' : parseInt(v));
                    setShowResult(false);
                  }}
                  onBlur={() => { if (!days) setDays(1); }}
                  placeholder="2"
                  className={inputField}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-start gap-3 p-3 border border-m3-outline-variant rounded-m3-md cursor-pointer hover:border-m3-primary/50 transition-colors bg-m3-surface-container-low">
                <div className="relative flex items-center mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={foodProvided}
                    onChange={e => { setFoodProvided(e.target.checked); setShowResult(false); }}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-m3-outline checked:border-m3-primary checked:bg-m3-primary focus-visible:ring-2 focus-visible:ring-m3-primary transition-all"
                  />
                  <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-m3-on-primary opacity-0 peer-checked:opacity-100 pointer-events-none" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-m3-on-surface">I will provide Driver Food</span>
                  <span className="block text-[11px] text-m3-on-surface-variant mt-0.5">
                    Saves {fmtRs(FOOD_PER_DAY)}/day — invite driver at halts.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-m3-outline-variant rounded-m3-md cursor-pointer hover:border-m3-primary/50 transition-colors bg-m3-surface-container-low">
                <div className="relative flex items-center mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={stayProvided}
                    onChange={e => { setStayProvided(e.target.checked); setShowResult(false); }}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-m3-outline checked:border-m3-primary checked:bg-m3-primary focus-visible:ring-2 focus-visible:ring-m3-primary transition-all"
                  />
                  <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-m3-on-primary opacity-0 peer-checked:opacity-100 pointer-events-none" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-m3-on-surface">I will provide Driver Stay</span>
                  <span className="block text-[11px] text-m3-on-surface-variant mt-0.5">
                    Saves {fmtRs(STAY_PER_NIGHT)}/night — hotel driver dorm.
                  </span>
                </div>
              </label>
            </div>
          </>
        )}

        {/* ── Calculate Button — exact match to QuotationEngine ── */}
        <button
          id="acting-driver-calc-btn"
          type="button"
          disabled={loading}
          onPointerDown={() => {
            if (typeof document !== 'undefined' && document.activeElement && typeof document.activeElement.blur === 'function') {
              document.activeElement.blur();
            }
          }}
          onClick={handleCalculate}
          className="w-full max-w-[260px] sm:max-w-[280px] mx-auto bg-m3-primary hover:bg-slate-900 text-m3-on-primary font-bold py-3 rounded-m3-full transition-all flex items-center justify-center gap-2 shadow-m3-1 hover:shadow-m3-2 text-sm sm:text-base min-h-[46px] sm:min-h-[50px] cursor-pointer active:scale-[0.98] disabled:opacity-75 border border-white/10"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4" />
              <span>Calculate Cost</span>
            </>
          )}
        </button>

        {/* ── Results — Compact Space-Saving Single Card ── */}
        {showResult && result && (
          <div
            id="acting-driver-result-card"
            ref={resultRef}
            className="bg-m3-surface-container-low rounded-m3-xl p-3.5 sm:p-4 border border-m3-outline-variant shadow-m3-1 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            {/* Header: Transparent Badge + Route/Distance Meta */}
            <div className="flex items-center justify-between gap-2 border-b border-m3-outline-variant/30 pb-2">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-m3-full bg-m3-surface-container-high border border-m3-outline-variant text-[10px] font-bold uppercase tracking-wide text-m3-on-surface">
                <ShieldCheck className="w-3.5 h-3.5 text-m3-primary" />
                <span>Transparent Estimate</span>
              </div>
              <div className="text-right text-[11px] font-medium text-m3-on-surface-variant flex items-center gap-1.5 flex-wrap justify-end">
                {result.distKm && (
                  <span className="font-bold text-m3-on-surface">{result.distKm} km</span>
                )}
                {result.distKm && <span className="opacity-40">•</span>}
                <span className="font-semibold text-m3-on-surface">{vehicle.label}</span>
              </div>
            </div>

            {/* Price Hero Row: Total Amount + Bata Tag */}
            <div className="flex justify-between items-center gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg sm:text-xl font-bold text-m3-on-surface tracking-tight font-heading">
                    {fmtRs(result.total)}
                  </span>
                  <span className="text-micro text-m3-on-surface-variant font-medium">
                    (Zero Hidden Charges)
                  </span>
                </div>
                <p className="text-[10px] text-m3-on-surface-variant font-medium mt-0.5">
                  Driver Bata + Meals{result.type === 'round' && result.nights > 0 && !result.stayProvided ? ' + Stay' : ''} • <span className="italic">Tolls & parking extra</span>
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-m3-surface rounded-m3-md border border-m3-outline-variant text-xs font-bold shadow-m3-1">
                  <span className="text-m3-on-surface-variant font-normal text-[11px]">Bata:</span>
                  <span className="font-bold text-m3-on-surface">{fmtRs(vehicle.bata)}/day</span>
                </div>
              </div>
            </div>

            {/* Compact Itemized Breakdown Box */}
            <div className="bg-m3-surface rounded-m3-md p-2.5 border border-m3-outline-variant/50 text-xs divide-y divide-m3-outline-variant/20 space-y-1">
              {result.type === 'round' ? (
                <>
                  <div className="flex justify-between items-center pt-0.5 first:pt-0">
                    <span className="text-m3-on-surface-variant">
                      Driver Bata ({result.days} day{result.days > 1 ? 's' : ''} × {fmtRs(result.bata)})
                    </span>
                    <span className="font-bold text-m3-on-surface">{fmtRs(result.totalBata)}</span>
                  </div>
                  <div className={`flex justify-between items-center pt-1 ${result.foodProvided ? 'text-emerald-700 dark:text-emerald-400 font-medium' : ''}`}>
                    <span className="text-m3-on-surface-variant">Food Allowance ({result.days} day{result.days > 1 ? 's' : ''})</span>
                    <span className="font-bold">{result.foodProvided ? 'Provided with Family (₹0)' : fmtRs(result.totalFood)}</span>
                  </div>
                  {result.nights > 0 && (
                    <div className={`flex justify-between items-center pt-1 ${result.stayProvided ? 'text-emerald-700 dark:text-emerald-400 font-medium' : ''}`}>
                      <span className="text-m3-on-surface-variant">Night Stay ({result.nights} night{result.nights > 1 ? 's' : ''})</span>
                      <span className="font-bold">{result.stayProvided ? 'Hotel Dormitory (₹0)' : fmtRs(result.totalStay)}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center pt-0.5 first:pt-0">
                    <span className="text-m3-on-surface-variant flex items-center gap-1.5 flex-wrap">
                      <span>Driver Bata ({result.isLongDistance ? '1.5 Days' : '1 Day'})</span>
                      {result.isLongDistance && (
                        <span className="text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-m3-full border border-amber-500/20">
                          &gt;400 km Return Day
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-m3-on-surface">{fmtRs(result.totalBata)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-m3-on-surface-variant">Food Allowance</span>
                    <span className="font-bold text-m3-on-surface">{fmtRs(result.totalFood)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-m3-on-surface-variant">Return Bus Ticket (SETC / Actuals)</span>
                    <span className="font-bold text-m3-on-surface">{fmtRs(result.busFare)}</span>
                  </div>
                </>
              )}
            </div>

            {/* WhatsApp CTA */}
            <WhatsAppButton
              href={result.whatsapp}
              fullWidth
              variant="filled"
              size="md"
              text="Book Driver on WhatsApp"
            />
          </div>
        )}
      </div>
    </div>
  );
}
