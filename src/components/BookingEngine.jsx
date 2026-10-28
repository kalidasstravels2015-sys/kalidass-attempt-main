import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Car, 
  Clock, 
  Plane, 
  MapPin, 
  Calendar, 
  Users, 
  Luggage, 
  Phone, 
  CheckCircle2, 
  Info, 
  ShieldCheck, 
  ArrowRight,
  Edit2,
  ChevronDown,
  Receipt,
  CreditCard
} from 'lucide-react';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import { buildWhatsAppUrl, WHATSAPP_CONFIG } from '../utils/whatsapp';
import tariffConfig from '../data/tariff_config.json';
import { peekNextQuotationId } from '../utils/sequenceGenerator';
import { loadGoogleMaps } from '../lib/googleMapsLoader';

// Known destinations with round-trip km, one-way km, and state codes
const KNOWN_DESTINATIONS = {
  'tirupati': { name: 'Tirupati Balaji', roundTripKm: 320, oneWayKm: 135, stateCode: 'AP', duration: '3.5–4 hrs' },
  'tirumala': { name: 'Tirumala Hills', roundTripKm: 340, oneWayKm: 155, stateCode: 'AP', duration: '4 hrs' },
  'pondicherry': { name: 'Pondicherry & Auroville', roundTripKm: 310, oneWayKm: 151, stateCode: 'PY', duration: '2.5–3 hrs' },
  'puducherry': { name: 'Pondicherry & Auroville', roundTripKm: 310, oneWayKm: 151, stateCode: 'PY', duration: '2.5–3 hrs' },
  'thiruvannamalai': { name: 'Thiruvannamalai Girivalam', roundTripKm: 390, oneWayKm: 195, stateCode: 'TN', duration: '4 hrs' },
  'tiruvannamalai': { name: 'Thiruvannamalai Girivalam', roundTripKm: 390, oneWayKm: 195, stateCode: 'TN', duration: '4 hrs' },
  'kanchipuram': { name: 'Kanchipuram Temples', roundTripKm: 150, oneWayKm: 75, stateCode: 'TN', duration: '1.5–2 hrs' },
  'vellore': { name: 'Vellore Golden Temple & CMC', roundTripKm: 280, oneWayKm: 140, stateCode: 'TN', duration: '2.5–3 hrs' },
  'mahabalipuram': { name: 'Mahabalipuram Shore', roundTripKm: 120, oneWayKm: 55, stateCode: 'TN', duration: '1–1.5 hrs' },
  'mamallapuram': { name: 'Mahabalipuram Shore', roundTripKm: 120, oneWayKm: 55, stateCode: 'TN', duration: '1–1.5 hrs' },
  'chidambaram': { name: 'Chidambaram Natarajar', roundTripKm: 450, oneWayKm: 230, stateCode: 'TN', duration: '4.5–5 hrs' },
  'kumbakonam': { name: 'Kumbakonam Navagraha', roundTripKm: 650, oneWayKm: 310, stateCode: 'TN', duration: '6 hrs' },
  'navagraha': { name: 'Kumbakonam Navagraha', roundTripKm: 650, oneWayKm: 310, stateCode: 'TN', duration: '6 hrs' },
  'rameswaram': { name: 'Rameswaram Jyotirlinga', roundTripKm: 1100, oneWayKm: 550, stateCode: 'TN', duration: '9–10 hrs' },
  'sabarimala': { name: 'Sabarimala Pilgrimage', roundTripKm: 1300, oneWayKm: 650, stateCode: 'KL', duration: '12 hrs' },
  'tiruchendur': { name: 'Tiruchendur Murugan', roundTripKm: 1250, oneWayKm: 625, stateCode: 'TN', duration: '10 hrs' },
  'bangalore': { name: 'Bangalore / Bengaluru', roundTripKm: 700, oneWayKm: 350, stateCode: 'KA', duration: '5.5–6 hrs' },
  'bengaluru': { name: 'Bangalore / Bengaluru', roundTripKm: 700, oneWayKm: 350, stateCode: 'KA', duration: '5.5–6 hrs' }
};

// 5 Standard city packages
const LOCAL_PACKAGES = [
  { key: 'local_4hr_pkg', hours: 4, km: 40, label: '4 Hrs / 40 KM' },
  { key: 'local_5hr_pkg', hours: 5, km: 50, label: '5 Hrs / 50 KM (Half Day)' },
  { key: 'local_8hr_pkg', hours: 8, km: 80, label: '8 Hrs / 80 KM (Full Day)' },
  { key: 'local_10hr_pkg', hours: 10, km: 100, label: '10 Hrs / 100 KM' },
  { key: 'local_12hr_pkg', hours: 12, km: 120, label: '12 Hrs / 120 KM (Extended Day)' }
];

// Chennai Airport Zones
const AIRPORT_ZONES = [
  { key: 'south', label: 'South Chennai (Medavakkam, Tambaram, Guindy, Velachery)', sedan: 650, km: 15 },
  { key: 'central', label: 'Central Chennai (T. Nagar, Anna Nagar, Egmore, Adyar)', sedan: 950, km: 22 },
  { key: 'north_west', label: 'North / West Chennai (Ambattur, Avadi, Madhavaram)', sedan: 1150, km: 32 },
  { key: 'omr', label: 'OMR IT Corridor (Perungudi, Thoraipakkam, Siruseri)', sedan: 1250, km: 30 },
  { key: 'ecr', label: 'ECR Coastal (Akkarai, Injambakkam, Mahabalipuram)', sedan: 1400, km: 40 }
];

// Comparison vehicles for horizontal 1-tap switcher strip
const VEHICLE_SWITCHER_LIST = [
  {
    key: 'Swift Dzire',
    name: 'Sedan',
    fullName: 'Swift Dzire / Toyota Etios',
    seats: 4,
    paxLabel: '4 Seats',
    image: '/images/fleet/swift-dzire.webp',
    category: 'sedan',
    airportMultiplier: 1.0
  },
  {
    key: 'Maruti Ertiga',
    name: 'Ertiga',
    fullName: 'Maruti Ertiga / XL6',
    seats: 6,
    paxLabel: '6 Seats',
    image: '/images/fleet/maruti-ertiga.webp',
    category: 'suv',
    airportMultiplier: 1.5
  },
  {
    key: 'Innova',
    name: 'Innova',
    fullName: 'Toyota Innova (7+1)',
    seats: 7,
    paxLabel: '6-7 Seats',
    image: '/images/fleet/suv.webp',
    category: 'muv',
    airportMultiplier: 1.8
  },
  {
    key: 'Innova Crysta',
    name: 'Crysta',
    fullName: 'Toyota Innova Crysta',
    seats: 7,
    paxLabel: '7 Seats',
    image: '/images/fleet/suv.webp',
    category: 'muv',
    airportMultiplier: 2.0
  },
  {
    key: 'Tempo Traveller',
    name: 'Tempo',
    fullName: 'Force Tempo Traveller (12+1)',
    seats: 12,
    paxLabel: '12 Seats',
    image: '/images/fleet/tempo-12.webp',
    category: 'tempo',
    airportMultiplier: 2.8,
    airportMinFare: 2400
  }
];

export default function BookingEngine({
  initialTab = 'outstation',
  allowedTabs = ['outstation', 'local', 'airport'],
  prefill = {},
  serviceSlug = '',
  serviceTitle = '',
  autoCalculate = false,
  showHeader = true,
  title = '',
  subtitle = '',
  variant = 'card'
}) {
  // 1. Tab & Edit Mode State
  const [activeTab, setActiveTab] = useState(initialTab);
  const hasInitialDestination = Boolean(prefill.destination || serviceSlug || autoCalculate);
  const [showResults, setShowResults] = useState(hasInitialDestination);
  const [showEditForm, setShowEditForm] = useState(!hasInitialDestination);

  // 2. Outstation Form State
  const [outstationTripType, setOutstationTripType] = useState(prefill.tripType || 'round'); // 'round' | 'oneway'
  const [outstationPickup, setOutstationPickup] = useState(prefill.pickup || 'Chennai, Tamil Nadu');
  const [outstationDrop, setOutstationDrop] = useState(prefill.destination || (hasInitialDestination ? 'Pondicherry' : ''));
  const [outstationDays, setOutstationDays] = useState(prefill.days || 1);
  const [travelDate, setTravelDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [travelTime, setTravelTime] = useState('06:00 AM');

  // 3. Local Rental Form State
  const [localPackageKey, setLocalPackageKey] = useState(prefill.package || 'local_8hr_pkg');
  const [localPickup, setLocalPickup] = useState('Chennai City Area');

  // 4. Airport Form State
  const [airportDirection, setAirportDirection] = useState('pickup'); // 'pickup' | 'drop' | 'outstation'
  const [airportZoneKey, setAirportZoneKey] = useState('south');
  const [airportOutstationDrop, setAirportOutstationDrop] = useState('Pondicherry');

  // 5. Selected Vehicle
  const [selectedVehicleKey, setSelectedVehicleKey] = useState('Swift Dzire');

  // Google Places Autocomplete
  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);

  useEffect(() => {
    let checkTimer = null;
    const initAutocomplete = () => {
      if (!window.google?.maps?.places) return;

      const options = {
        componentRestrictions: { country: 'in' },
        fields: ['name', 'formatted_address', 'geometry'],
      };

      if (pickupInputRef.current && !pickupInputRef.current.dataset.googleAttached) {
        try {
          const ac = new window.google.maps.places.Autocomplete(pickupInputRef.current, options);
          ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            const addr = place?.formatted_address || place?.name;
            if (addr) setOutstationPickup(addr);
          });
          pickupInputRef.current.dataset.googleAttached = 'true';
        } catch (_) {}
      }

      if (dropInputRef.current && !dropInputRef.current.dataset.googleAttached) {
        try {
          const ac = new window.google.maps.places.Autocomplete(dropInputRef.current, options);
          ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            const addr = place?.formatted_address || place?.name;
            if (addr) setOutstationDrop(addr);
          });
          dropInputRef.current.dataset.googleAttached = 'true';
        } catch (_) {}
      }
    };

    loadGoogleMaps()
      .then(() => initAutocomplete())
      .catch(() => {});

    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      window.addEventListener('google-maps-loaded', initAutocomplete);
      checkTimer = setInterval(() => {
        if (window.google?.maps?.places) {
          initAutocomplete();
          if (pickupInputRef.current?.dataset?.googleAttached && checkTimer) clearInterval(checkTimer);
        }
      }, 300);
    }

    return () => {
      window.removeEventListener('google-maps-loaded', initAutocomplete);
      if (checkTimer) clearInterval(checkTimer);
    };
  }, [showEditForm, activeTab]);

  // Quote Reference ID (Sequential fallback)
  const [quoteRefId, setQuoteRefId] = useState('#QT-101');
  useEffect(() => {
    try {
      const nextId = peekNextQuotationId?.();
      if (nextId) setQuoteRefId(nextId);
    } catch (_) {}
  }, []);

  // Resolve destination details
  const resolvedDestination = useMemo(() => {
    const raw = (outstationDrop || '').toLowerCase().trim();
    for (const [key, dest] of Object.entries(KNOWN_DESTINATIONS)) {
      if (raw.includes(key)) return dest;
    }
    return {
      name: outstationDrop || 'Outstation Trip',
      roundTripKm: outstationDays * 250,
      oneWayKm: 130,
      stateCode: 'TN',
      duration: `${outstationDays * 4} hrs`
    };
  }, [outstationDrop, outstationDays]);

  // Selected vehicle object & pricing calculations
  const selectedVehicle = useMemo(() => {
    return VEHICLE_SWITCHER_LIST.find(v => v.key === selectedVehicleKey) || VEHICLE_SWITCHER_LIST[0];
  }, [selectedVehicleKey]);

  // Calculate detailed breakdown for the currently selected vehicle
  const currentBreakdown = useMemo(() => {
    const vConfig = tariffConfig.vehicles[selectedVehicle.key] || {};
    const statePermits = tariffConfig.state_permits || {};

    if (activeTab === 'outstation') {
      const isRound = outstationTripType === 'round';
      const minDailyKm = vConfig.min_km_per_day || 250;
      const ratePerKm = isRound ? (vConfig.round_trip_rate || 14) : (vConfig.one_way_rate || 16);
      const bataPerDay = vConfig.driver_bata || 500;

      if (isRound) {
        const totalMinKm = outstationDays * minDailyKm;
        const estimatedKm = resolvedDestination.roundTripKm || totalMinKm;
        const billedKm = Math.max(estimatedKm, totalMinKm);
        const kmCost = billedKm * ratePerKm;
        const totalBata = outstationDays * bataPerDay;
        
        const stateCode = resolvedDestination.stateCode;
        const isInterstate = stateCode && stateCode !== 'TN';

        const totalFare = kmCost + totalBata;
        const advance = 500;
        const balance = Math.max(0, totalFare - advance);

        return {
          billedKm,
          ratePerKm,
          extraKmRate: ratePerKm,
          kmCost,
          driverBata: totalBata,
          isInterstate,
          stateCode,
          totalFare,
          advance,
          balance,
          routeSummary: `${outstationPickup.split(',')[0]} ⇄ ${resolvedDestination.name || outstationDrop || 'Outstation'}`,
          tripSubtext: `Includes ${billedKm} km (${outstationDays} Day${outstationDays > 1 ? 's' : ''}) • Extra: ₹${ratePerKm}/km`,
          metaDateStr: `${travelDate} ${travelTime} • Round Trip • ~${billedKm} km • ${selectedVehicle.seats} Seats`
        };
      } else {
        // One-Way Drop
        const minDropKm = vConfig.min_drop_km || (selectedVehicle.category === 'tempo' ? 250 : 130);
        const estimatedKm = resolvedDestination.oneWayKm || minDropKm;
        const billedKm = Math.max(estimatedKm, minDropKm);
        const kmCost = billedKm * ratePerKm;
        const totalBata = bataPerDay;

        const stateCode = resolvedDestination.stateCode;
        const isInterstate = stateCode && stateCode !== 'TN';

        const totalFare = kmCost + totalBata;
        const advance = 500;
        const balance = Math.max(0, totalFare - advance);

        return {
          billedKm,
          ratePerKm,
          extraKmRate: ratePerKm,
          kmCost,
          driverBata: totalBata,
          isInterstate,
          stateCode,
          totalFare,
          advance,
          balance,
          routeSummary: `${outstationPickup.split(',')[0]} ➔ ${resolvedDestination.name || outstationDrop || 'Outstation'}`,
          tripSubtext: `Includes ${billedKm} km One-Way Drop • Extra: ₹${ratePerKm}/km`,
          metaDateStr: `${travelDate} ${travelTime} • One-Way Drop • ~${billedKm} km • ${selectedVehicle.seats} Seats`
        };
      }
    } else if (activeTab === 'local') {
      const pkg = LOCAL_PACKAGES.find(p => p.key === localPackageKey) || LOCAL_PACKAGES[2];
      const baseFare = vConfig[pkg.key] || 2200;
      const extraKmRate = vConfig.extra_km_rate || 15;
      const extraHrRate = vConfig.extra_hr_rate || 150;
      const advance = 500;
      const balance = Math.max(0, baseFare - advance);

      return {
        billedKm: pkg.km,
        packageHours: pkg.hours,
        kmCost: baseFare,
        driverBata: 0,
        extraKmRate,
        extraHrRate,
        totalFare: baseFare,
        advance,
        balance,
        routeSummary: `Chennai Local (${pkg.label})`,
        tripSubtext: `Includes ${pkg.hours} Hrs / ${pkg.km} KM • Extra: ₹${extraKmRate}/km, ₹${extraHrRate}/hr`,
        metaDateStr: `${travelDate} ${travelTime} • City Rental • ${pkg.label} • ${selectedVehicle.seats} Seats`
      };
    } else {
      // Airport
      if (airportDirection === 'outstation') {
        const dest = KNOWN_DESTINATIONS[airportOutstationDrop.toLowerCase()] || { oneWayKm: 151, name: airportOutstationDrop, duration: '2.5–3 hrs', stateCode: 'PY' };
        const minDropKm = vConfig.min_drop_km || (selectedVehicle.category === 'tempo' ? 250 : 130);
        const billedKm = Math.max(dest.oneWayKm, minDropKm);
        const ratePerKm = vConfig.one_way_rate || 16;
        const kmCost = billedKm * ratePerKm;
        const driverBata = vConfig.driver_bata || 500;

        const isInterstate = dest.stateCode && dest.stateCode !== 'TN';
        const totalFare = kmCost + driverBata;
        const advance = 500;
        const balance = Math.max(0, totalFare - advance);

        return {
          billedKm,
          ratePerKm,
          extraKmRate: ratePerKm,
          kmCost,
          driverBata,
          isInterstate,
          stateCode: dest.stateCode,
          totalFare,
          advance,
          balance,
          routeSummary: `Chennai Airport (MAA) ➔ ${dest.name}`,
          tripSubtext: `Includes ${billedKm} km Airport Drop • Extra: ₹${ratePerKm}/km`,
          metaDateStr: `${travelDate} ${travelTime} • Airport Pickup • ~${billedKm} km • ${selectedVehicle.seats} Seats`
        };
      } else {
        const zone = AIRPORT_ZONES.find(z => z.key === airportZoneKey) || AIRPORT_ZONES[0];
        let fare = Math.round(zone.sedan * selectedVehicle.airportMultiplier);
        if (selectedVehicle.airportMinFare && fare < selectedVehicle.airportMinFare) {
          fare = selectedVehicle.airportMinFare;
        }
        const advance = 500;
        const balance = Math.max(0, fare - advance);

        return {
          billedKm: zone.km,
          kmCost: fare,
          driverBata: 0,
          totalFare: fare,
          advance,
          balance,
          routeSummary: airportDirection === 'pickup' 
            ? `Chennai Airport (MAA) ➔ ${zone.label.split('(')[0].trim()}`
            : `${zone.label.split('(')[0].trim()} ➔ Chennai Airport (MAA)`,
          tripSubtext: `Fixed Zone Flat Fare · Free Flight Delay Buffer`,
          metaDateStr: `${travelDate} ${travelTime} • Airport Transfer • ${selectedVehicle.seats} Seats`
        };
      }
    }
  }, [activeTab, outstationTripType, outstationDays, resolvedDestination, localPackageKey, airportDirection, airportZoneKey, airportOutstationDrop, selectedVehicle, outstationPickup, travelDate, travelTime]);

  // Log calculation event silently for lead capture
  const logCalculationEvent = (vehicleName, fare) => {
    try {
      const payload = {
        calculatorEngine: 'Kalidass Unified Booking Engine',
        tripType: activeTab === 'outstation' ? (outstationTripType === 'round' ? 'Outstation Round Trip' : 'One-Way Drop') : activeTab,
        pickup: outstationPickup,
        drop: outstationDrop || 'Outstation',
        vehicle: vehicleName,
        distanceKm: currentBreakdown.billedKm || 'N/A',
        estimatedFare: fare,
        meta: { quoteRefId, tab: activeTab, days: outstationDays }
      };
      navigator.sendBeacon?.('/api/record-calculation', JSON.stringify(payload));
    } catch (_) {}
  };

  // WhatsApp Message
  const getWhatsAppMessage = () => {
    return `*KALIDASS TRAVELS — TRIP QUOTATION REQUEST*
---------------------------------
• Ref: ${quoteRefId}
• Route: ${currentBreakdown.routeSummary}
• Vehicle: ${selectedVehicle.fullName} (${selectedVehicle.paxLabel})
• Date & Time: ${travelDate} @ ${travelTime}
• Estimate: ₹${currentBreakdown.totalFare.toLocaleString('en-IN')} (Includes ${currentBreakdown.billedKm} KM)
---------------------------------
• Advance to Lock Cab: ₹${currentBreakdown.advance}
• Balance to Pay Chauffeur: ₹${currentBreakdown.balance.toLocaleString('en-IN')}
• Tolls, State Tax & Parking: Extra as per actual government receipts
---------------------------------
Dispatch Helpline: +91 89395 39211
Please confirm chauffeur availability.`;
  };

  const handleCalculateClick = () => {
    if (!outstationDrop && activeTab === 'outstation') {
      setOutstationDrop('Pondicherry');
    }
    setShowResults(true);
    setShowEditForm(false);
  };

  const waHref = buildWhatsAppUrl(getWhatsAppMessage());

  return (
    <div className={`w-full max-w-2xl mx-auto ${variant === 'card' ? 'bg-white dark:bg-m3-surface rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/80 dark:border-m3-outline-variant/60 overflow-hidden' : ''}`}>
      {/* 1. Header with Mode Selector (Hidden when showing results on mobile to fit in 1 screen) */}
      {showHeader && (!showResults || showEditForm) && (
        <div className="p-3.5 sm:p-5 border-b border-gray-100 dark:border-m3-outline-variant/40 bg-gray-50/50 dark:bg-m3-surface-container-lowest">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-blue-600 block">
                Instant Cab Estimator · Kalidass Transparent Tariff
              </span>
              <h3 className="text-base sm:text-xl font-black text-gray-900 dark:text-white font-heading mt-0.5">
                {title || serviceTitle || "Plan Your Journey & Calculate Fare"}
              </h3>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero Surge Pricing</span>
            </div>
          </div>

          {/* 3-Tab Selector Pills */}
          {allowedTabs.length > 1 && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-200/70 dark:bg-m3-surface-container-high rounded-full mt-3">
              {allowedTabs.includes('outstation') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('outstation'); if (!hasInitialDestination) { setShowResults(false); setShowEditForm(true); } }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                    activeTab === 'outstation' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Outstation</span>
                </button>
              )}

              {allowedTabs.includes('local') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('local'); if (!hasInitialDestination) { setShowResults(false); setShowEditForm(true); } }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                    activeTab === 'local' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Local Rental</span>
                </button>
              )}

              {allowedTabs.includes('airport') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('airport'); if (!hasInitialDestination) { setShowResults(false); setShowEditForm(true); } }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                    activeTab === 'airport' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>Airport Taxi</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Input Form (Shown if showEditForm is true, or user clicked Edit) */}
      {showEditForm && (
        <div className="p-4 sm:p-5 bg-white dark:bg-m3-surface space-y-3.5">
          {activeTab === 'outstation' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOutstationTripType('round')}
                  className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    outstationTripType === 'round'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  🔄 Round Trip (Min 250 km/day)
                </button>
                <button
                  type="button"
                  onClick={() => setOutstationTripType('oneway')}
                  className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    outstationTripType === 'oneway'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  ➡️ Airport Highway Drop (One-Way)
                </button>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label htmlFor="pickup-input" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Pickup Location in Chennai
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="pickup-input"
                      ref={pickupInputRef}
                      type="text"
                      data-autocomplete-input="true"
                      autoComplete="off"
                      value={outstationPickup}
                      onChange={(e) => setOutstationPickup(e.target.value)}
                      placeholder="Enter pickup address in Chennai"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-m3-surface-container-low border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="drop-input" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Drop Location / City
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="drop-input"
                      ref={dropInputRef}
                      type="text"
                      data-autocomplete-input="true"
                      autoComplete="off"
                      value={outstationDrop}
                      onChange={(e) => setOutstationDrop(e.target.value)}
                      placeholder="e.g. Pondicherry, Tirupati, Bangalore"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-m3-surface-container-low border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">
                  Popular:
                </span>
                {['Tirupati', 'Pondicherry', 'Thiruvannamalai', 'Mahabalipuram', 'Vellore', 'Bangalore'].map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setOutstationDrop(city)}
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                      outstationDrop.toLowerCase().includes(city.toLowerCase())
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-gray-100 dark:bg-m3-surface-container border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>

              {/* Dates & Duration */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label htmlFor="outstation-date-input" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Pickup Date
                  </label>
                  <input
                    id="outstation-date-input"
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-m3-surface-container-low border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="outstation-time-select" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Pickup Time
                  </label>
                  <select
                    id="outstation-time-select"
                    value={travelTime}
                    onChange={(e) => setTravelTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-m3-surface-container-low border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium cursor-pointer"
                  >
                    {['04:00 AM', '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '02:00 PM', '06:00 PM', '10:00 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {outstationTripType === 'round' && (
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="outstation-duration-select" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Stay Duration
                    </label>
                    <select
                      id="outstation-duration-select"
                      value={outstationDays}
                      onChange={(e) => setOutstationDays(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-m3-surface-container-low border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-bold cursor-pointer"
                    >
                      <option value={1}>1 Day (Same Day)</option>
                      <option value={2}>2 Days (1 Night)</option>
                      <option value={3}>3 Days (2 Nights)</option>
                      <option value={4}>4 Days (3 Nights)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'local' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="local-package-select" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Select City Hourly Package
                </label>
                <select
                  id="local-package-select"
                  value={localPackageKey}
                  onChange={(e) => setLocalPackageKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-m3-surface-container-low border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold cursor-pointer"
                >
                  {LOCAL_PACKAGES.map(pkg => (
                    <option key={pkg.key} value={pkg.key}>{pkg.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="local-pickup-input" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Pickup Area in Chennai
                </label>
                <input
                  id="local-pickup-input"
                  type="text"
                  value={localPickup}
                  onChange={(e) => setLocalPickup(e.target.value)}
                  placeholder="e.g. Medavakkam, T. Nagar, Velachery"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-m3-surface-container-low border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="local-date-input" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Pickup Date
                  </label>
                  <input
                    id="local-date-input"
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-m3-surface-container-low border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label htmlFor="local-time-select" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Reporting Time
                  </label>
                  <select
                    id="local-time-select"
                    value={travelTime}
                    onChange={(e) => setTravelTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-m3-surface-container-low border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium cursor-pointer"
                  >
                    {['07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'airport' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-m3-surface-container-high rounded-lg text-xs font-bold text-center">
                <button
                  type="button"
                  onClick={() => setAirportDirection('pickup')}
                  className={`py-1.5 px-2 rounded-md transition-all cursor-pointer ${airportDirection === 'pickup' ? 'bg-white dark:bg-m3-surface text-blue-600 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  🛬 Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setAirportDirection('drop')}
                  className={`py-1.5 px-2 rounded-md transition-all cursor-pointer ${airportDirection === 'drop' ? 'bg-white dark:bg-m3-surface text-blue-600 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  🛫 Drop
                </button>
                <button
                  type="button"
                  onClick={() => setAirportDirection('outstation')}
                  className={`py-1.5 px-2 rounded-md transition-all cursor-pointer ${airportDirection === 'outstation' ? 'bg-white dark:bg-m3-surface text-blue-600 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  🛣️ Outstation
                </button>
              </div>

              {airportDirection !== 'outstation' ? (
                <div>
                  <label htmlFor="airport-zone-select" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Select Chennai City Zone
                  </label>
                  <select
                    id="airport-zone-select"
                    value={airportZoneKey}
                    onChange={(e) => setAirportZoneKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-m3-surface-container-low border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold cursor-pointer"
                  >
                    {AIRPORT_ZONES.map(z => (
                      <option key={z.key} value={z.key}>{z.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="airport-dest-select" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Outstation Highway Drop Destination
                  </label>
                  <select
                    id="airport-dest-select"
                    value={airportOutstationDrop}
                    onChange={(e) => setAirportOutstationDrop(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-m3-surface-container-low border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold cursor-pointer"
                  >
                    {['Pondicherry', 'Vellore Golden Temple & CMC', 'Tirupati Balaji', 'Thiruvannamalai', 'Mahabalipuram', 'Bangalore'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              type="button"
              id="view-fare-btn"
              onClick={handleCalculateClick}
              className="w-full py-3.5 px-6 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm sm:text-base tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View Instant Fare</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-gray-400 mt-2">
              No phone number required to check fare • Instant transparent rates
            </p>
          </div>
        </div>
      )}

      {/* 3. The Clear, Trust-First Rate Summary (Compact View that fits within 1 mobile screen) */}
      {showResults && (
        <div 
          id="fare-result-summary-card" 
          className="bg-white dark:bg-m3-surface border-t border-gray-200 dark:border-m3-outline-variant/60 p-3 sm:p-5 space-y-2.5 sm:space-y-4 animate-fadeIn"
        >
          {/* Top Route Bar with [ Edit ] Button */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-gray-700">
            <div>
              <div className="flex items-center gap-1.5">
                {activeTab === 'airport' ? (
                  <Plane className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : activeTab === 'local' ? (
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : (
                  <Car className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
                <span className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-white font-heading">
                  {currentBreakdown.routeSummary}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">
                {currentBreakdown.metaDateStr}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowEditForm(!showEditForm)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-full hover:bg-blue-100 transition-all cursor-pointer shrink-0"
            >
              <Edit2 className="w-3 h-3" />
              <span>{showEditForm ? 'Close' : 'Edit'}</span>
            </button>
          </div>

          {/* STEP 1: 1-Tap Horizontal Vehicle Switcher on TOP */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1">
                <Car className="w-3 h-3 text-blue-600" />
                <span>Select Vehicle:</span>
              </span>
              <span className="text-[10px] font-normal text-slate-400 capitalize">
                Tap to switch
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
              {VEHICLE_SWITCHER_LIST.map((item) => {
                const isSelected = selectedVehicleKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSelectedVehicleKey(item.key);
                    }}
                    className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-xl border shrink-0 transition-all cursor-pointer min-h-[42px] sm:min-h-[48px] ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/90 dark:bg-blue-950/60 shadow-xs ring-1 ring-blue-600/30'
                        : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-m3-surface hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 sm:w-13 h-6 sm:h-8 object-contain shrink-0 transition-transform group-hover:scale-105"
                      loading="lazy"
                      width="44"
                      height="28"
                    />
                    <div className="text-left leading-tight pr-0.5">
                      <div className={`text-[11px] sm:text-xs font-bold whitespace-nowrap ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-gray-200'}`}>
                        {item.name}
                      </div>
                      <div className={`text-[9px] sm:text-[10px] ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-500 dark:text-gray-400'}`}>
                        {item.paxLabel}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Bill Receipt (Blinkit / Zepto cut-and-dried style) */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-gray-700 space-y-2 bg-white dark:bg-m3-surface-container-low">
            <div className="space-y-1 text-xs sm:text-sm text-slate-700 dark:text-gray-300">
              <div className="flex justify-between items-center py-0.5">
                <span>Cab Hire ({currentBreakdown.billedKm ? `${Math.round(currentBreakdown.billedKm)} km @ ₹${currentBreakdown.ratePerKm || 14}/km` : selectedVehicle.fullName})</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ₹{currentBreakdown.kmCost?.toLocaleString('en-IN')}
                </span>
              </div>

              {currentBreakdown.driverBata > 0 && (
                <div className="flex justify-between items-center py-0.5">
                  <span>Driver Bata ({outstationDays} Day{outstationDays > 1 ? 's' : ''})</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{currentBreakdown.driverBata?.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-0.5 text-slate-500 dark:text-gray-400">
                <span>Toll Gate Fees (FASTag)</span>
                <span className="font-medium text-slate-700 dark:text-gray-300">Extra as per slip</span>
              </div>

              <div className="flex justify-between items-center py-0.5 text-slate-500 dark:text-gray-400">
                <span>Parking Charges</span>
                <span className="font-medium text-slate-700 dark:text-gray-300">Extra as per slip</span>
              </div>

              {currentBreakdown.isInterstate && (
                <div className="flex justify-between items-center py-0.5 text-slate-500 dark:text-gray-400">
                  <span>State Entry Tax ({currentBreakdown.stateCode})</span>
                  <span className="font-medium text-slate-700 dark:text-gray-300">Extra as per slip</span>
                </div>
              )}

              {/* Solid Total Line */}
              <div className="pt-2 border-t border-slate-200 dark:border-gray-600 flex justify-between items-baseline">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    Estimated Fare ({currentBreakdown.billedKm ? `${Math.round(currentBreakdown.billedKm)} km` : 'Standard'})
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-gray-400">
                    Base fare includes 5% GST
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-heading block">
                    ₹{currentBreakdown.totalFare.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-gray-400">
                    + Extras as per slip
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Combined Terms & Rules (Single compact card to fit in 1 mobile view) */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-m3-surface-container-low border border-slate-200 dark:border-gray-700 text-[11px] sm:text-xs">
            <div className="font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wider text-[10px] mb-1">
              Payment &amp; Billing Rules
            </div>
            <div className="space-y-0.5 text-slate-700 dark:text-gray-300">
              <div>• ₹{currentBreakdown.advance} advance to reserve cab (fully adjusted in final bill)</div>
              <div>• Settle balance with driver at trip end (UPI / Cash)</div>
              <div>• Doorstep odometer reading • Extra km: ₹{currentBreakdown.extraKmRate || 14}/km</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                • Free cancellation up to 6 hours before pickup
              </div>
            </div>
          </div>

          {/* STEP 4: Big Thumb-Friendly Action CTAs */}
          <div className="pt-0.5 space-y-1.5">
            <div className="flex gap-2">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={() => logCalculationEvent(selectedVehicle.fullName, currentBreakdown.totalFare)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full bg-m3-primary hover:bg-m3-primary/90 active:bg-m3-primary/80 text-m3-on-primary font-bold text-xs sm:text-sm shadow-m3-1 hover:shadow-m3-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <WhatsAppIcon variant="white" className="w-4 h-4 shrink-0" />
                <span>Book {selectedVehicle.name} on WhatsApp</span>
              </a>

              <a
                href={`tel:${WHATSAPP_CONFIG.phone}`}
                onClick={() => logCalculationEvent(selectedVehicle.fullName, currentBreakdown.totalFare)}
                className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-full border border-m3-outline hover:bg-m3-primary/10 active:bg-m3-primary/20 text-m3-primary font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                <Phone className="w-3.5 h-3.5 text-m3-primary" />
                <span>Call Us</span>
              </a>
            </div>

            <p className="text-[10px] text-slate-400 text-center font-medium">
              24/7 Helpline: +91 89395 39211
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
