import React, { useState, useEffect, useRef } from 'react';
import {
  Car, MapPin, Calendar, Calculator, ArrowRight, Check,
  ChevronDown, Info, User, Navigation, X,
  ShieldCheck, CheckCircle2, Clock, AlertCircle, Phone
} from 'lucide-react';
import LocationPicker from './LocationPicker';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import tnBusFares from '../data/tnBusFares.json';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import { trackCalculatorQuote, markQuoteConverted } from '../lib/analytics';

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
  const [travelDate,    setTravelDate]    = useState('');
  const [reportingTime, setReportingTime] = useState('06:00');
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
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [pickerField, setPickerField] = useState('pickup');

  const handlePinClick = (field = 'pickup') => {
    loadGoogleMaps().catch(() => {});
    setPickerField(field);
    setLocationPickerOpen(true);
  };

  const handleLocationConfirm = (address) => {
    const clean = address ? address.trim() : '';
    if (pickerField === 'pickup') {
      setPickup(clean);
      setFieldErrors(prev => ({ ...prev, pickup: undefined }));
    } else {
      setDrop(clean);
      setFieldErrors(prev => ({ ...prev, drop: undefined }));
    }
    setShowResult(false);
    setLocationPickerOpen(false);
  };

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
          whatsapp: buildWhatsApp('round', total, d, distKm, false, foodProvided, stayProvided),
        });
      } else {
        const isLongDistance = Boolean(distKm && distKm > 400);
        const bataMultiplier = isLongDistance ? 1.5 : 1;
        const totalBata = Math.round(vehicle.bata * bataMultiplier);
        const totalFood = foodProvided ? 0 : FOOD_PER_DAY;
        const busFare   = setcFare || (distKm ? Math.round(distKm * 1.2) : 250);
        const total = totalBata + totalFood + busFare;
        setResult({
          type: 'oneway',
          distKm,
          isLongDistance,
          bataMultiplier,
          bata: vehicle.bata, totalBata, totalFood, busFare, total,
          foodProvided,
          whatsapp: buildWhatsApp('oneway', total, 1, distKm, isLongDistance, foodProvided, false),
        });
      }

      const calculatedFare = activeTab === 'round'
        ? (vehicle.bata * d) + (foodProvided ? 0 : FOOD_PER_DAY * d) + (stayProvided ? 0 : STAY_PER_NIGHT * nights)
        : Math.round(vehicle.bata * (distKm && distKm > 400 ? 1.5 : 1)) + (foodProvided ? 0 : FOOD_PER_DAY) + (setcFare || (distKm ? Math.round(distKm * 1.2) : 250));

      trackCalculatorQuote({
        calculatorId: 'acting_driver',
        calculatorEngine: 'Acting Driver Cost Calculator',
        tripType: activeTab === 'round' ? `Round Trip (${d} Days)` : 'One Way Drop',
        pickup: pickup || 'Chennai',
        drop: drop || 'N/A',
        vehicle: vehicle.label,
        distanceKm: distKm ? (activeTab === 'round' ? distKm * 2 : distKm) : '',
        estimatedFare: calculatedFare,
        meta: {
          gear,
          days: d,
          nights,
          stayProvided,
          foodProvided
        }
      });

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

  const formatTime12h = (timeVal) => {
    if (!timeVal) return '';
    if (timeVal.includes('AM') || timeVal.includes('PM')) return timeVal;
    const parts = timeVal.split(':');
    if (parts.length < 2) return timeVal;
    const hours = parseInt(parts[0], 10);
    const mins = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${String(formattedHours).padStart(2, '0')}:${mins} ${ampm}`;
  };

  const buildWhatsApp = (type, total, days, distKm, isLongDistance = false, foodProv = false, stayProv = false) => {
    const route = drop.trim() ? `${pickup} → ${drop}` : pickup;
    const distStr = distKm ? ` (~${type === 'round' ? distKm * 2 : distKm} km)` : '';
    const longDistNote = isLongDistance ? ' (Includes 1.5x Bata for >400 km return transit)' : '';
    const gearLabel = gear === 'automatic' ? 'Automatic (AT / DCT / EV)' : 'Manual (MT)';
    const formattedTime = formatTime12h(reportingTime);
    const schedStr = travelDate ? `${travelDate}${formattedTime ? ` @ ${formattedTime}` : ''}` : (formattedTime ? `@ ${formattedTime}` : '');

    const foodNote = foodProv 
      ? 'Customer provides driver meals at halts (₹0 allowance)' 
      : 'Included in total (Driver self-manages meals — zero food requests to customer)';
    
    const stayNote = type === 'round' && days > 1
      ? (stayProv 
          ? 'Hotel driver dormitory provided by customer (₹0)' 
          : 'Included in total (₹300/night lodging allowance)')
      : null;

    const msg = 
      `Hi Kalidass Travels, I need an Outstation Acting Driver:\n\n` +
      `📋 BOOKING DETAILS:\n` +
      `• Trip: ${type === 'round' ? 'Round Trip' : 'One Way Drop'}${longDistNote}\n` +
      `• Route: ${route}${distStr}\n` +
      `• Duration: ${days} Day${days > 1 ? 's' : ''}\n` +
      `• Est. Total: ₹${total.toLocaleString('en-IN')}\n\n` +
      `🚗 VEHICLE DETAILS:\n` +
      `• Vehicle Type: ${vehicle.label}\n` +
      `• Transmission / Gear: ${gearLabel}\n` +
      (schedStr ? `\n📅 SCHEDULE:\n• Travel Date & Time: ${schedStr}\n` : '') +
      `\n🍽️ MEALS & STAY POLICY:\n` +
      `• Driver Meals: ${foodNote}\n` +
      (stayNote ? `• Driver Stay: ${stayNote}\n` : '') +
      `\nPlease assign a verified chauffeur and confirm driver availability.`;
    return buildWhatsAppUrl(msg);
  };

  const fmtRs = n => `₹${Number(n).toLocaleString('en-IN')}`;

  // ── Shared class helpers (mirrors QuotationEngine exactly) ─────────────
  const inputWrap  = 'relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-m3-md px-3 py-2 sm:py-2.5 min-h-[44px] sm:min-h-[48px] focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition-all';
  const inputField = 'bg-transparent w-full outline-none text-sm font-semibold text-m3-on-surface pr-8 placeholder:text-m3-on-surface-variant placeholder:text-xs placeholder:font-normal';
  const labelCls   = 'block text-m3-label-m font-semibold text-m3-on-surface-variant uppercase tracking-wider mb-1';

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

        {/* ── Vehicle Type & Transmission (Single Row) ── */}
        <div>
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {/* Column 1: Vehicle Type */}
            <div>
              <div className="flex items-center mb-1">
                <label className={`${labelCls} !mb-0 truncate`}>Vehicle Type</label>
              </div>
              <div className={`${inputWrap} cursor-pointer px-2.5 sm:px-3`}>
                <Car className="w-4 h-4 text-m3-on-surface-variant mr-1.5 sm:mr-2 shrink-0" />
                <select
                  value={vehicleKey}
                  onChange={e => { setVehicleKey(e.target.value); setShowResult(false); }}
                  className="bg-transparent w-full outline-none text-xs sm:text-sm font-semibold text-m3-on-surface appearance-none cursor-pointer pr-4 sm:pr-6 truncate"
                >
                  {VEHICLES.map(v => (
                    <option key={v.key} value={v.key}>{v.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-m3-on-surface-variant pointer-events-none absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 shrink-0" />
              </div>
            </div>

            {/* Column 2: Transmission (Gear) */}
            <div>
              <div className="flex items-center mb-1">
                <label className={`${labelCls} !mb-0 truncate`}>Transmission</label>
              </div>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-m3-surface-container-low border border-m3-outline-variant rounded-m3-md min-h-[44px] sm:min-h-[48px] items-center">
                <button
                  type="button"
                  onClick={() => { setGear('manual'); setShowResult(false); }}
                  className={`py-1.5 sm:py-2 px-1 sm:px-2 text-[11px] sm:text-xs font-bold rounded-m3-sm transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[36px] sm:min-h-[38px] ${
                    gear === 'manual'
                      ? 'bg-m3-primary text-m3-on-primary shadow-m3-1'
                      : 'text-m3-on-surface hover:bg-m3-surface-container'
                  }`}
                >
                  <span className="truncate">⚙️ Manual</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setGear('automatic'); setShowResult(false); }}
                  className={`py-1.5 sm:py-2 px-1 sm:px-2 text-[11px] sm:text-xs font-bold rounded-m3-sm transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[36px] sm:min-h-[38px] ${
                    gear === 'automatic'
                      ? 'bg-m3-primary text-m3-on-primary shadow-m3-1'
                      : 'text-m3-on-surface hover:bg-m3-surface-container'
                  }`}
                >
                  <span className="truncate">🕹️ Auto<span className="hidden sm:inline">matic</span></span>
                </button>
              </div>
            </div>
          </div>
          <p className="text-m3-body-s text-m3-on-surface-variant mt-1.5 flex items-center gap-1">
            <span className="font-semibold text-m3-on-surface shrink-0">Models:</span>
            <span className="truncate">{vehicle.models}</span>
          </p>
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
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {pickup && (
                <button type="button" onClick={() => { setPickup(''); setShowResult(false); }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-full text-m3-on-surface-variant">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handlePinClick('pickup')}
                className="w-7 h-7 flex items-center justify-center rounded-m3-sm hover:bg-m3-surface-container text-m3-primary hover:bg-m3-primary/10 transition-colors cursor-pointer"
                title="Pinpoint pickup on map"
                aria-label="Pinpoint pickup on map"
              >
                <MapPin className="w-4 h-4 text-m3-primary" />
              </button>
            </div>
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
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {drop && (
                <button type="button" onClick={() => { setDrop(''); setShowResult(false); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-full text-m3-on-surface-variant">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handlePinClick('drop')}
                className="w-7 h-7 flex items-center justify-center rounded-m3-sm hover:bg-m3-surface-container text-m3-primary hover:bg-m3-primary/10 transition-colors cursor-pointer"
                title="Pinpoint destination on map"
                aria-label="Pinpoint destination on map"
              >
                <MapPin className="w-4 h-4 text-m3-primary" />
              </button>
            </div>
          </div>
          {fieldErrors.drop && (
            <p className="mt-1 text-xs text-m3-error font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors.drop}</span>
            </p>
          )}
          {activeTab === 'round' && (
            <p className="text-m3-body-s text-m3-on-surface-variant mt-1">
              ℹ️ Round trip returns to pickup — cost is time-based (days × bata) with zero return km fee.
            </p>
          )}
        </div>

        {/* ── Travel Date & Pickup Time (Single Row) ── */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          <div>
            <div className="flex items-center mb-1">
              <label className={`${labelCls} !mb-0 truncate`}>Travel Date</label>
            </div>
            <div className={`${inputWrap} px-2.5 sm:px-3`}>
              <Calendar className="w-4 h-4 text-m3-on-surface-variant mr-1.5 sm:mr-2 shrink-0" />
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={travelDate}
                onChange={e => { setTravelDate(e.target.value); setShowResult(false); }}
                className={`${inputField} !pr-0 text-xs sm:text-sm cursor-pointer`}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`${labelCls} !mb-0 truncate`}>Reporting Time</label>
              {reportingTime && (
                <span className="hidden sm:inline text-m3-label-s font-bold text-m3-primary shrink-0 ml-1">
                  {formatTime12h(reportingTime)}
                </span>
              )}
            </div>
            <div className={`${inputWrap} px-2.5 sm:px-3`}>
              <Clock className="w-4 h-4 text-m3-on-surface-variant mr-1.5 sm:mr-2 shrink-0" />
              <input
                id="acting-driver-time-picker"
                type="time"
                value={reportingTime}
                onChange={e => { setReportingTime(e.target.value); setShowResult(false); }}
                className={`${inputField} !pr-0 text-xs sm:text-sm cursor-pointer`}
              />
            </div>
          </div>
        </div>

        {/* ── Round Trip Extra Duration ── */}
        {activeTab === 'round' && (
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
        )}

        {/* ── Food & Stay Options (Always transparent) ── */}
        <div className={`grid grid-cols-1 ${activeTab === 'round' ? 'sm:grid-cols-2' : ''} gap-2.5`}>
          <label className="flex items-start gap-3 p-3 border border-m3-outline-variant rounded-m3-md cursor-pointer hover:border-m3-primary/50 transition-colors bg-m3-surface-container-low">
            <div className="relative flex items-center mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={foodProvided}
                onChange={e => { setFoodProvided(e.target.checked); setShowResult(false); }}
                className="peer h-4 w-4 cursor-pointer appearance-none rounded-m3-xs border border-m3-outline checked:border-m3-primary checked:bg-m3-primary focus-visible:ring-2 focus-visible:ring-m3-primary transition-all"
              />
              <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-m3-on-primary opacity-0 peer-checked:opacity-100 pointer-events-none" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-m3-on-surface">I will provide Driver Food</span>
              <span className="block text-[11px] text-m3-on-surface-variant mt-0.5">
                {activeTab === 'round' 
                  ? `Saves ${fmtRs(FOOD_PER_DAY)}/day — invite driver at halts.`
                  : `Saves ${fmtRs(FOOD_PER_DAY)} — invite driver at halts.`}
              </span>
            </div>
          </label>

          {activeTab === 'round' && (
            <label className="flex items-start gap-3 p-3 border border-m3-outline-variant rounded-m3-md cursor-pointer hover:border-m3-primary/50 transition-colors bg-m3-surface-container-low">
              <div className="relative flex items-center mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={stayProvided}
                  onChange={e => { setStayProvided(e.target.checked); setShowResult(false); }}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded-m3-xs border border-m3-outline checked:border-m3-primary checked:bg-m3-primary focus-visible:ring-2 focus-visible:ring-m3-primary transition-all"
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
          )}
        </div>

        {/* ── Calculate Button — M3 Primary Action Button ── */}
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
          className="w-full max-w-[260px] sm:max-w-[280px] mx-auto bg-m3-primary hover:bg-m3-primary/90 active:bg-m3-primary/80 active:scale-[0.98] text-m3-on-primary font-bold py-3.5 rounded-m3-full transition-all flex items-center justify-center gap-2 shadow-m3-2 hover:shadow-m3-3 text-sm sm:text-base min-h-[46px] sm:min-h-[50px] cursor-pointer disabled:opacity-75"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4 text-white" />
              <span>Calculate Cost</span>
            </>
          )}
        </button>

        {/* ── Results — Outstation Rate Summary Format ── */}
        {showResult && result && (
          <div
            id="acting-driver-result-card"
            ref={resultRef}
            className="border border-slate-200 rounded-m3-xl p-3.5 sm:p-4 bg-slate-100 shadow-xs text-xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            {/* Header: Vehicle & Total Fare */}
            <div className="flex justify-between items-start gap-2 pb-2.5 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-extrabold text-m3-on-surface leading-snug">
                    {vehicle.label}
                  </span>
                  <span className="text-[10px] font-bold bg-[#1a73e8]/10 text-[#0b57d0] px-2 py-0.5 rounded-full shrink-0">
                    {gear === 'automatic' ? 'Automatic' : 'Manual'}
                  </span>
                </div>
                <div className="text-[11px] text-m3-on-surface-variant font-medium mt-0.5">
                  {result.type === 'round'
                    ? `~${result.distKm ? `${result.distKm} km Round Trip` : 'Round Trip'} • ${result.days} Day${result.days > 1 ? 's' : ''} • Transparent Estimate`
                    : `~${result.distKm ? `${result.distKm} km Drop` : 'One Way Drop'} • ~${result.distKm ? Math.round(result.distKm / 50) : 3} hrs driving • Transparent Estimate`}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] text-m3-on-surface-variant font-medium">Total Fare</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface font-heading leading-tight">
                  ₹{result.total.toLocaleString('en-IN')} <span className="text-xs sm:text-sm font-semibold text-m3-on-surface-variant ml-0.5">+ Extra</span>
                </div>
              </div>
            </div>

            {/* Itemized Bill Lines */}
            <div className="space-y-1.5 text-xs">
              {result.type === 'round' ? (
                <>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Driver Bata ({result.days} {result.days > 1 ? 'Days' : 'Day'} • ₹{result.bata.toLocaleString('en-IN')}/day):</span>
                    <span className="font-bold text-m3-on-surface">₹{result.totalBata.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Food Allowance ({result.days} {result.days > 1 ? 'Days' : 'Day'}):</span>
                    <span className={`font-bold ${result.foodProvided ? 'text-emerald-700' : 'text-m3-on-surface'}`}>
                      {result.foodProvided ? 'Waived (₹0)' : `₹${result.totalFood.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  {result.nights > 0 && (
                    <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                      <span>Night Stay ({result.nights} {result.nights > 1 ? 'Nights' : 'Night'}):</span>
                      <span className={`font-bold ${result.stayProvided ? 'text-emerald-700' : 'text-m3-on-surface'}`}>
                        {result.stayProvided ? 'Free Dorm (₹0)' : `₹${result.totalStay.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Tolls:</span>
                    <span className="font-bold text-m3-on-surface">Extra (At Actuals)</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Parking:</span>
                    <span className="font-bold text-m3-on-surface">Extra (At Actuals)</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>State Permit:</span>
                    <span className="font-bold text-m3-on-surface">Extra (At Actuals)</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Driver Bata ({result.isLongDistance ? '1.5 Days' : '1 Day'}{result.isLongDistance ? ' • >400 km Return' : ''}):</span>
                    <span className="font-bold text-m3-on-surface">₹{result.totalBata.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Food Allowance:</span>
                    <span className={`font-bold ${result.foodProvided ? 'text-emerald-700' : 'text-m3-on-surface'}`}>
                      {result.foodProvided ? 'Waived (₹0)' : `₹${result.totalFood.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Return Bus Ticket (Govt SETC / Bus):</span>
                    <span className="font-bold text-m3-on-surface">₹{result.busFare.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Tolls:</span>
                    <span className="font-bold text-m3-on-surface">Extra (At Actuals)</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Parking:</span>
                    <span className="font-bold text-m3-on-surface">Extra (At Actuals)</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>State Permit:</span>
                    <span className="font-bold text-m3-on-surface">Extra (At Actuals)</span>
                  </div>
                </>
              )}
            </div>

            {/* Bill Payment Split */}
            <div className="pt-2 border-t border-slate-200/80 space-y-1 text-xs">
              <div className="flex justify-between items-center py-0.5 text-m3-on-surface font-medium">
                <span>Pay at Drop:</span>
                <span className="font-bold text-m3-on-surface">
                  ₹{result.total.toLocaleString('en-IN')} + Extra <span className="text-[10px] font-normal text-m3-on-surface-variant">(Zero Advance Required)</span>
                </span>
              </div>
            </div>

            {/* Cut and Dried Notes */}
            <div className="pt-2.5 border-t border-dashed border-slate-200 text-[11px] text-m3-on-surface-variant space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Included in Fare:</strong> Dedicated Chauffeur Duty, Food Allowance{result.type === 'oneway' ? ' & Return Bus Fare' : ''}.
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {result.type === 'round'
                    ? '1 Day = Up to 12 hrs duty. Duration or hours above package is billed extra.'
                    : 'Tolls, Parking & FASTag are paid directly by the car owner as per actual slips.'}
                </span>
              </div>
            </div>

            {/* Direct Booking Actions */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
              <WhatsAppButton
                href={result.whatsapp}
                onClick={() => {
                  markQuoteConverted(null, {
                    calculatorId: 'acting_driver',
                    tripType: result.type,
                    vehicle: vehicle.label,
                    estimate: result.total
                  });
                }}
                variant="filled"
                size="md"
                data-direct-whatsapp="true"
                className="w-full sm:flex-1 px-5 py-3.5 min-h-[46px] text-sm font-bold shadow-m3-1 justify-center active:scale-[0.99]"
                text={`Book Driver on WhatsApp (₹${result.total.toLocaleString('en-IN')})`}
              />

              <a
                href="tel:+918939539211"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] bg-white hover:bg-slate-50 active:scale-[0.99] text-m3-on-surface font-semibold text-sm rounded-full border border-m3-outline-variant shadow-2xs transition-colors shrink-0 cursor-pointer"
                aria-label="Call +91 89395 39211"
              >
                <Phone className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
                <span>Call Desk</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {locationPickerOpen && (
        <LocationPicker
          isOpen={locationPickerOpen}
          onClose={() => setLocationPickerOpen(false)}
          onConfirm={handleLocationConfirm}
          type={pickerField}
          initialAddress={pickerField === 'pickup' ? pickup : drop}
        />
      )}
    </div>
  );
}
