import React, { useState, useEffect, useRef } from 'react';
import {
  Car, MapPin, Calendar, Calculator, ArrowRight, Check,
  ChevronDown, Info, User, Navigation, X,
  ShieldCheck, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import tnBusFares from '../data/tnBusFares.json';

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

const findKnownDistance = (origin, dest) => {
  const o = (origin || '').toLowerCase().trim();
  const d = (dest || '').toLowerCase().trim();
  if (!o) return null;

  // 1. tnBusFares table
  const busRoute = tnBusFares.find(r =>
    (o.includes(r.source) && d.includes(r.destination)) ||
    (o.includes(r.destination) && d.includes(r.source))
  );
  if (busRoute) return { distance: busRoute.distanceKm, setcFare: busRoute.setcFare };

  // 2. Common distances from Chennai
  const chennaiForms = ['chennai','airport','tambaram','guindy','koyambedu','egmore','central'];
  const isOChennai = chennaiForms.some(k => o.includes(k));
  const isDChennai = chennaiForms.some(k => d.includes(k));
  if (isOChennai || isDChennai) {
    const other = isOChennai ? d : o;
    for (const [city, km] of Object.entries(COMMON_DISTANCES)) {
      if (other.includes(city)) return { distance: km, setcFare: Math.round(km * 1.2) };
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
  const [activeTab,     setActiveTab]     = useState('round');
  const [vehicleKey,    setVehicleKey]    = useState('hatchback');
  const [pickup,        setPickup]        = useState('');
  const [drop,          setDrop]          = useState('');
  const [days,          setDays]          = useState(2);
  const [stayProvided,  setStayProvided]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [showResult,    setShowResult]    = useState(false);
  const [result,        setResult]        = useState(null);
  const [error,         setError]         = useState('');

  const pickupRef       = useRef(null);
  const dropRef         = useRef(null);
  const autocompleteRef = useRef(false);

  const vehicle = VEHICLES.find(v => v.key === vehicleKey) || VEHICLES[0];

  // ── Google Maps Autocomplete ───────────────────────────────────────────
  useEffect(() => {
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
        });
      }
      if (dropRef.current) {
        const ac = new window.google.maps.places.Autocomplete(dropRef.current, opts);
        ac.addListener('place_changed', () => {
          const p = ac.getPlace();
          setDrop(p.formatted_address || p.name || '');
          setShowResult(false);
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
    if (!pickup.trim()) { setError('Please enter a destination city / area.'); return; }
    if (activeTab === 'oneway' && !drop.trim()) { setError('Please enter the drop location for a One Way trip.'); return; }
    setLoading(true);

    const doCalc = (distKm, setcFare) => {
      const d = Math.max(1, parseInt(days) || 1);
      const nights = Math.max(0, d - 1);

      if (activeTab === 'round') {
        const totalBata = vehicle.bata * d;
        const totalFood = FOOD_PER_DAY * d;
        const totalStay = stayProvided ? 0 : STAY_PER_NIGHT * nights;
        const total = totalBata + totalFood + totalStay;
        setResult({
          type: 'round',
          distKm: distKm ? distKm * 2 : null,
          bata: vehicle.bata, totalBata, totalFood, totalStay,
          stayProvided, nights, days: d, total,
          whatsapp: buildWhatsApp('round', total, d, distKm),
        });
      } else {
        const totalBata = vehicle.bata;
        const totalFood = FOOD_PER_DAY;
        const busFare   = setcFare || (distKm ? Math.round(distKm * 1.2) : 250);
        const total = totalBata + totalFood + busFare;
        setResult({
          type: 'oneway',
          distKm,
          bata: vehicle.bata, totalBata, totalFood, busFare, total,
          whatsapp: buildWhatsApp('oneway', total, 1, distKm),
        });
      }

      setShowResult(true);
      setLoading(false);
    };

    // 1. Local fast lookup
    const known = findKnownDistance(pickup, drop || pickup);
    if (known) { setTimeout(() => doCalc(known.distance, known.setcFare), 300); return; }

    // 2. Google Distance Matrix
    if (window.google?.maps && drop.trim()) {
      const svc = new window.google.maps.DistanceMatrixService();
      svc.getDistanceMatrix(
        { origins: [pickup], destinations: [drop], travelMode: 'DRIVING', unitSystem: 0 },
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

    // 3. Time-based fallback (round trip, no drop)
    doCalc(null, null);
  };

  const buildWhatsApp = (type, total, days, distKm) => {
    const route = drop.trim() ? `${pickup} → ${drop}` : pickup;
    const distStr = distKm ? ` (~${type === 'round' ? distKm * 2 : distKm} km)` : '';
    return encodeURIComponent(
      `Hi Kalidass Travels, I need an Outstation Acting Driver:\n` +
      `• Trip: ${type === 'round' ? 'Round Trip' : 'One Way Drop'}\n` +
      `• Vehicle: ${vehicle.label}\n` +
      `• Route: ${route}${distStr}\n` +
      `• Duration: ${days} Day${days > 1 ? 's' : ''}\n` +
      `• Est. Total: ₹${total.toLocaleString('en-IN')}\n` +
      `Please confirm driver availability.`
    );
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
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => { setActiveTab(tab.key); setShowResult(false); setError(''); }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-m3-full transition-all min-h-[38px] cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary ${
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
                <option key={v.key} value={v.key}>{v.label} — {fmtRs(v.bata)}/day</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-m3-on-surface-variant pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <p className="text-micro text-m3-on-surface-variant mt-1">{vehicle.models}</p>
        </div>

        {/* ── Pickup / Destination ── */}
        <div>
          <label className={labelCls}>
            {activeTab === 'round' ? 'Destination City' : 'Pickup Location'}
          </label>
          <div className={inputWrap}>
            <MapPin className="w-4 h-4 text-m3-on-surface-variant mr-2 shrink-0" />
            <input
              ref={pickupRef}
              type="text"
              value={pickup}
              onChange={e => { setPickup(e.target.value); setShowResult(false); }}
              placeholder={activeTab === 'round' ? 'e.g. Madurai, Tirupati, Ooty' : 'e.g. Pallavaram, Chennai'}
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
          {activeTab === 'round' && (
            <p className="text-micro text-m3-on-surface-variant mt-1">
              ℹ️ Round trip cost is time-based — no return km charge.
            </p>
          )}
        </div>

        {/* ── Drop (One Way only) ── */}
        {activeTab === 'oneway' && (
          <div>
            <label className={labelCls}>Drop Location</label>
            <div className={inputWrap}>
              <Navigation className="w-4 h-4 text-m3-on-surface-variant mr-2 shrink-0" />
              <input
                ref={dropRef}
                type="text"
                value={drop}
                onChange={e => { setDrop(e.target.value); setShowResult(false); }}
                placeholder="e.g. Tirupati, Madurai"
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
          </div>
        )}

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

            <label className="flex items-start gap-3 p-3.5 border border-m3-outline-variant rounded-m3-md cursor-pointer hover:border-m3-primary/50 transition-colors bg-m3-surface-container-low">
              <div className="relative flex items-center mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={stayProvided}
                  onChange={e => { setStayProvided(e.target.checked); setShowResult(false); }}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-sm border border-m3-outline checked:border-m3-primary checked:bg-m3-primary focus-visible:ring-2 focus-visible:ring-m3-primary transition-all"
                />
                <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-m3-on-primary opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-m3-on-surface">I will provide Driver Stay</span>
                <span className="block text-xs text-m3-on-surface-variant mt-0.5">
                  Saves {fmtRs(STAY_PER_NIGHT)}/night — tick if hotel provides driver dormitory.
                </span>
              </div>
            </label>
          </>
        )}

        {/* ── Calculate Button — exact match to QuotationEngine ── */}
        <button
          type="button"
          disabled={loading}
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

        {/* ── Results — exact match to QuotationEngine result card ── */}
        {showResult && result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">

            {/* Trip meta row */}
            {result.distKm && (
              <div className="bg-m3-surface-container-low p-3.5 rounded-m3-lg border border-m3-outline-variant">
                <div className="flex justify-between text-xs text-m3-on-surface-variant">
                  <div>
                    <span className="block text-micro uppercase font-bold text-m3-on-surface-variant">Total Distance</span>
                    <strong className="text-m3-on-surface">{result.distKm} km</strong>
                  </div>
                  <div className="text-right">
                    <span className="block text-micro uppercase font-bold text-m3-on-surface-variant">Vehicle</span>
                    <strong className="text-m3-on-surface">{vehicle.label}</strong>
                  </div>
                </div>
                <p className="text-micro text-m3-on-surface-variant font-medium italic mt-2">*Toll and parking charges are additional.</p>
              </div>
            )}

            {/* Main estimate card */}
            <div className="bg-m3-surface-container-low rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">

              {/* Price hero */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-m3-full bg-m3-surface-container-high border border-m3-outline-variant text-[10px] font-bold uppercase tracking-wide mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-m3-primary" />
                    <span>Transparent Estimate</span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-m3-on-surface tracking-tight font-heading">
                    {fmtRs(result.total)}
                  </p>
                  <p className="text-micro text-m3-on-surface-variant font-medium mt-0.5">
                    Driver Bata + Meals
                    {result.type === 'round' && result.nights > 0 && !result.stayProvided ? ' + Stay' : ''}
                    {' '}• Zero Hidden Charges
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-m3-surface rounded-m3-md border border-m3-outline-variant text-xs font-bold shadow-m3-1">
                    <span className="text-m3-on-surface-variant font-normal">Bata:</span>
                    <span className="font-black">{fmtRs(vehicle.bata)}/day</span>
                  </div>
                  <div className="mt-1 text-micro text-m3-on-surface-variant font-semibold">{vehicle.label}</div>
                </div>
              </div>

              {/* Itemized breakdown */}
              <div className="space-y-1.5 pt-1 border-t border-m3-outline-variant/40 text-xs sm:text-sm">
                {result.type === 'round' ? (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-m3-outline-variant/30">
                      <span className="text-m3-on-surface-variant">
                        Driver Bata ({result.days} day{result.days > 1 ? 's' : ''} × {fmtRs(result.bata)})
                      </span>
                      <span className="font-bold">{fmtRs(result.totalBata)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-m3-outline-variant/30">
                      <span className="text-m3-on-surface-variant">Food Allowance ({result.days} day{result.days > 1 ? 's' : ''})</span>
                      <span className="font-bold">{fmtRs(result.totalFood)}</span>
                    </div>
                    {result.nights > 0 && (
                      <div className={`flex justify-between py-1.5 ${result.stayProvided ? 'opacity-50 line-through' : ''}`}>
                        <span className="text-m3-on-surface-variant">Night Stay ({result.nights} night{result.nights > 1 ? 's' : ''})</span>
                        <span className="font-bold">{result.stayProvided ? 'Provided by You' : fmtRs(result.totalStay)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-m3-outline-variant/30">
                      <span className="text-m3-on-surface-variant">Driver Bata (1 Day)</span>
                      <span className="font-bold">{fmtRs(result.totalBata)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-m3-outline-variant/30">
                      <span className="text-m3-on-surface-variant">Food Allowance</span>
                      <span className="font-bold">{fmtRs(result.totalFood)}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-m3-on-surface-variant">Return Bus Ticket (SETC / Actuals)</span>
                      <span className="font-bold">{fmtRs(result.busFare)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Trust badges grid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { icon: ShieldCheck,  text: 'Police Verified'   },
                  { icon: CheckCircle2, text: 'No Hidden Costs'   },
                  { icon: Clock,        text: '30–60 Min Arrival' },
                  { icon: Info,         text: 'Pay After Trip'    },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-m3-md bg-m3-surface border border-m3-outline-variant/60">
                    <item.icon className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-tight text-m3-on-surface">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* WhatsApp CTA — exact match to QuotationEngine */}
              <a
                href={`https://wa.me/918939539211?text=${result.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1EBE5D] text-white rounded-m3-full font-bold flex items-center justify-center gap-2.5 shadow-m3-2 hover:shadow-m3-3 transition-all active:scale-[0.98] cursor-pointer text-sm sm:text-base border border-emerald-400/40"
              >
                <WhatsAppIcon className="w-5 h-5" variant="two-tone" />
                <span>Book Driver on WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
