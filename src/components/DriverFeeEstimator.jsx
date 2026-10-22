import React, { useState, useEffect, useRef } from 'react';
import {
  Car, MapPin, Calendar, Calculator, ArrowRight, Check,
  ChevronDown, Info, User, Navigation, X,
  ShieldCheck, CheckCircle2, Clock, AlertCircle, Phone
} from 'lucide-react';
import LocationPicker from './LocationPicker';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { buildWhatsAppUrl, buildMapsLinks } from '../utils/whatsapp';
import tnBusFares from '../data/tnBusFares.json';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import { trackCalculatorQuote, markQuoteConverted, trackEvent } from '../lib/analytics';
import { getNextQuotationId, peekNextQuotationId } from '../utils/sequenceGenerator';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';

// ── Calibrated highway distances from Chennai (km) ────────────────────────
const COMMON_DISTANCES = {
  'pondicherry': 151, 'puducherry': 151, 'bangalore': 346,
  'bengaluru': 346, 'tirupati': 135, 'tirupathi': 135, 'vellore': 137, 'kanchipuram': 75,
  'mahabalipuram': 56, 'mamallapuram': 56, 'trichy': 332, 'tiruchirappalli': 332, 'madurai': 462,
  'coimbatore': 505, 'salem': 340, 'thanjavur': 342, 'tirunelveli': 624,
  'kanyakumari': 708, 'nagercoil': 690, 'rameshwaram': 575, 'rameswaram': 575, 'kodaikanal': 530, 'ooty': 555,
  'udhagamandalam': 555, 'munnar': 580, 'mysore': 480, 'mysuru': 480, 'tiruvannamalai': 195,
  'thiruvannamalai': 195, 'chidambaram': 215, 'kumbakonam': 298, 'nagapattinam': 315, 'velankanni': 325,
  'mayiladuthurai': 280, 'thiruvarur': 310, 'yelagiri': 230, 'yercaud': 365, 'hosur': 305,
  'krishnagiri': 260, 'dharmapuri': 300, 'erode': 395, 'tirupur': 460, 'namakkal': 380,
  'dindigul': 420, 'palani': 485, 'theni': 500, 'karur': 375, 'cuddalore': 180,
  'villupuram': 165, 'kallakurichi': 240, 'perambalur': 275, 'ariyalur': 295, 'pudukkottai': 390,
  'karaikudi': 425, 'sivaganga': 450, 'ramanathapuram': 515, 'virudhunagar': 510, 'thoothukudi': 605,
  'tuticorin': 605, 'tenkasi': 615, 'pollachi': 545, 'valparai': 600, 'ranipet': 115,
  'tirupattur': 225, 'chengalpattu': 55, 'sriperumbudur': 45, 'tiruttani': 85, 'arakkonam': 75,
  'srikalahasti': 115, 'nellore': 175, 'vijayawada': 450, 'hyderabad': 630, 'kochi': 690,
  'cochin': 690, 'trivandrum': 750, 'thiruvananthapuram': 750, 'sabarimala': 650, 'guruvayur': 635,
};

// ── Coordinates for inter-city routes when neither origin nor dest is Chennai ──
const CITY_COORDS = {
  'chennai': [13.0827, 80.2707], 'pondicherry': [11.9416, 79.8083], 'puducherry': [11.9416, 79.8083],
  'bangalore': [12.9716, 77.5946], 'bengaluru': [12.9716, 77.5946], 'tirupati': [13.6288, 79.4192],
  'tirupathi': [13.6288, 79.4192], 'vellore': [12.9165, 79.1325], 'kanchipuram': [12.8342, 79.7036],
  'mahabalipuram': [12.6208, 80.1945], 'trichy': [10.7905, 78.7047], 'tiruchirappalli': [10.7905, 78.7047],
  'madurai': [9.9252, 78.1198], 'coimbatore': [11.0168, 76.9558], 'salem': [11.6643, 78.1460],
  'thanjavur': [10.7870, 79.1378], 'tirunelveli': [8.7139, 77.7567], 'kanyakumari': [8.0883, 77.5385],
  'nagercoil': [8.1833, 77.4119], 'rameshwaram': [9.2876, 79.3129], 'rameswaram': [9.2876, 79.3129],
  'kodaikanal': [10.2381, 77.4892], 'ooty': [11.4102, 76.6950], 'udhagamandalam': [11.4102, 76.6950],
  'munnar': [10.0889, 77.0595], 'mysore': [12.2958, 76.6394], 'mysuru': [12.2958, 76.6394],
  'tiruvannamalai': [12.2253, 79.0747], 'thiruvannamalai': [12.2253, 79.0747], 'chidambaram': [11.3992, 79.6933],
  'kumbakonam': [10.9602, 79.3845], 'nagapattinam': [10.7672, 79.8449], 'velankanni': [10.6819, 79.8437],
  'mayiladuthurai': [11.1018, 79.6522], 'yelagiri': [12.5794, 78.6395], 'yercaud': [11.7753, 78.2093],
  'hosur': [12.7409, 77.8253], 'krishnagiri': [12.5186, 78.2137], 'dharmapuri': [12.1211, 78.1582],
  'erode': [11.3410, 77.7172], 'tirupur': [11.1085, 77.3411], 'namakkal': [11.2189, 78.1674],
  'dindigul': [10.3624, 77.9695], 'palani': [10.4500, 77.5167], 'theni': [10.0104, 77.4768],
  'karur': [10.9601, 78.0766], 'cuddalore': [11.7480, 79.7714], 'villupuram': [11.9401, 79.4861],
  'pudukkottai': [10.3833, 78.8001], 'karaikudi': [10.0735, 78.7732], 'thoothukudi': [8.7642, 78.1348],
  'tuticorin': [8.7642, 78.1348], 'tenkasi': [8.9594, 77.3161], 'pollachi': [10.6609, 77.0048],
  'nellore': [14.4426, 79.9865], 'vijayawada': [16.5062, 80.6480], 'hyderabad': [17.3850, 78.4867],
  'kochi': [9.9312, 76.2673], 'cochin': [9.9312, 76.2673], 'trivandrum': [8.5241, 76.9366],
};

const calcRoadDistanceKm = ([lat1, lon1], [lat2, lon2]) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(25, Math.round(R * c * 1.25));
};

const CHENNAI_FORMS = [
  'chennai', 'airport', 'tambaram', 'guindy', 'koyambedu', 'egmore', 'central',
  'pallavaram', 'velachery', 'porur', 'annanagar', 'anna nagar', 't nagar', 't. nagar',
  'sholinganallur', 'omr', 'ecr', 'perungudi', 'thiruvanmiyur', 'adyar', 'mylapore',
  'chromepet', 'medavakkam', 'madipakkam', 'alandur', 'vadapalani', 'ambattur', 'avadi',
  'poonamallee', 'kolathur', 'redhills', 'kilpauk', 'nungambakkam', 'triplicane', 'royapettah',
  'pallikaranai', 'vandalur', 'guduvanchery', 'siruseri', 'navalur', 'meenambakkam'
];

const estimateReturnBusFare = (km) => Math.max(150, Math.round((km * 1.1) / 10) * 10);

const getOneWayTier = (distKm) => {
  const km = distKm || 150;
  if (km > 650) {
    return { bataMultiplier: 2.5, foodMultiplier: 2, bataDaysLabel: '2.5 Days', tierNote: '>650 km Ultra-Long Return' };
  }
  if (km > 450) {
    return { bataMultiplier: 2, foodMultiplier: 1.5, bataDaysLabel: '2 Days', tierNote: '451–650 km Long-Haul Return' };
  }
  if (km > 250) {
    return { bataMultiplier: 1.5, foodMultiplier: 1, bataDaysLabel: '1.5 Days', tierNote: '251–450 km Intercity Return' };
  }
  return { bataMultiplier: 1, foodMultiplier: 1, bataDaysLabel: '1 Day', tierNote: '' };
};

const findKnownDistance = (origin, dest) => {
  const o = (origin || '').toLowerCase().trim();
  const d = (dest || '').toLowerCase().trim();
  if (!o && !d) return null;

  const isOChennai = CHENNAI_FORMS.some(k => o.includes(k));
  const isDChennai = CHENNAI_FORMS.some(k => d.includes(k));

  // Normalize Chennai suburban names so tnBusFares matches e.g. "Pallavaram" -> "chennai"
  const oNorm = isOChennai ? `${o} chennai` : o;
  const dNorm = isDChennai ? `${d} chennai` : d;

  // 1. tnBusFares table lookup (only when one side is Chennai and the other is outstation)
  if (o && d && !(isOChennai && isDChennai)) {
    const busRoute = tnBusFares.find(r =>
      (oNorm.includes(r.source) && dNorm.includes(r.destination)) ||
      (oNorm.includes(r.destination) && dNorm.includes(r.source))
    );
    if (busRoute) return { distance: busRoute.distanceKm, setcFare: busRoute.setcFare };
  }

  // 2. Check if one side is in Chennai Metro and the other is a known city from Chennai
  if ((isOChennai || isDChennai) && !(isOChennai && isDChennai)) {
    const other = isOChennai ? d : o;
    for (const [city, km] of Object.entries(COMMON_DISTANCES)) {
      if (other && other.includes(city)) {
        return { distance: km, setcFare: estimateReturnBusFare(km) };
      }
    }
  }

  // 3. Inter-city lookup when neither origin nor destination is in Chennai (e.g. Coimbatore -> Madurai, Coimbatore -> Tirupati)
  if (o && d && !isOChennai && !isDChennai) {
    let coordO = null, coordD = null, cityO = null, cityD = null;
    for (const [city, coords] of Object.entries(CITY_COORDS)) {
      if (!coordO && o.includes(city)) { coordO = coords; cityO = city; }
      if (!coordD && d.includes(city)) { coordD = coords; cityD = city; }
    }
    if (coordO && coordD && cityO !== cityD) {
      const km = calcRoadDistanceKm(coordO, coordD);
      return { distance: km, setcFare: estimateReturnBusFare(km) };
    }
  }

  // 4. Both inside Chennai Metro (e.g. Anna Nagar -> Tambaram)
  if (isOChennai && isDChennai) {
    return { distance: 35, setcFare: 150 };
  }

  return null;
};

// ── Vehicle data (2026 Chennai & Tamil Nadu Chauffeur Standards w/ Outsource Margin) ──
const VEHICLES = [
  { key: 'hatchback', label: 'Hatchback & Sedan',  models: 'Dzire, Etios, Honda City, Verna', bata: 1400 },
  { key: 'suv',       label: 'Compact SUV / MPV',   models: 'Ertiga, Creta, Seltos, Carens',  bata: 1500 },
  { key: 'premium',   label: 'Premium SUV / MUV',   models: 'Innova Crysta, Fortuner, Safari', bata: 1600 },
  { key: 'luxury',    label: 'Luxury European',      models: 'BMW, Mercedes-Benz, Audi',        bata: 1900 },
];

const FOOD_PER_DAY   = 300; // 2 meals @ ₹150
const STAY_PER_NIGHT = 300; // Dormitory allowance

export default function DriverFeeEstimator({
  title    = 'Outstation Driver Estimator',
  subtitle = 'Calculate exact Bata, Stay & Transit',
  embedded = false,
  isOperatorMode = false,
  operatorCallerPhone = '',
  operatorCallerName = '',
  onQuoteCalculated = null,
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
  const [quoteRefId, setQuoteRefId] = useState('#QT-101');

  useEffect(() => {
    setQuoteRefId(peekNextQuotationId());
  }, []);

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

  const { scrollInputAboveKeyboard } = useVirtualKeyboard();

  const handleLocationFocus = (e) => {
    loadGoogleMaps().catch(() => {});
    const inputEl = e.currentTarget;
    if (typeof window !== 'undefined' && (window.innerWidth <= 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      scrollInputAboveKeyboard(inputEl, 250);
    }
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
      const minDaysForDist = activeTab === 'round' && distKm ? (distKm > 520 ? 3 : distKm > 220 ? 2 : 1) : 1;
      const rawDays = Math.max(1, parseInt(days) || 1);
      const d = activeTab === 'round' ? Math.max(rawDays, minDaysForDist) : 1;
      const autoAdjustedDays = activeTab === 'round' && d > rawDays;
      if (autoAdjustedDays) setDays(d);

      const nights = Math.max(0, d - 1);
      const generatedQuoteRef = getNextQuotationId();
      setQuoteRefId(generatedQuoteRef);

      let calculatedFare = 0;

      if (activeTab === 'round') {
        const totalBata = vehicle.bata * d;
        const totalFood = foodProvided ? 0 : FOOD_PER_DAY * d;
        const totalStay = stayProvided ? 0 : STAY_PER_NIGHT * nights;
        const total = totalBata + totalFood + totalStay;
        calculatedFare = total;
        setResult({
          type: 'round',
          distKm: distKm || null,
          minRecommendedDays: minDaysForDist,
          bata: vehicle.bata, totalBata, totalFood, totalStay,
          foodProvided, stayProvided, nights, days: d, autoAdjustedDays, total,
          whatsapp: buildWhatsApp('round', total, d, distKm, null, foodProvided, stayProvided, generatedQuoteRef),
        });
      } else {
        const tier = getOneWayTier(distKm);
        const totalBata = Math.round(vehicle.bata * tier.bataMultiplier);
        const totalFood = foodProvided ? 0 : Math.round(FOOD_PER_DAY * tier.foodMultiplier);
        const busFare   = setcFare || (distKm ? estimateReturnBusFare(distKm) : 200);
        const total = totalBata + totalFood + busFare;
        calculatedFare = total;
        setResult({
          type: 'oneway',
          distKm,
          isLongDistance: tier.bataMultiplier > 1,
          bataMultiplier: tier.bataMultiplier,
          bataDaysLabel: tier.bataDaysLabel,
          tierNote: tier.tierNote,
          foodMultiplier: tier.foodMultiplier,
          bata: vehicle.bata, totalBata, totalFood, busFare, total,
          foodProvided,
          whatsapp: buildWhatsApp('oneway', total, 1, distKm, tier, foodProvided, false, generatedQuoteRef),
        });
      }

      const calcData = {
        quoteRefId: generatedQuoteRef,
        serviceTitle: `Acting Driver (${activeTab === 'round' ? 'Round Trip' : 'One Way Drop'})`,
        activeTab: 'driver',
        pickup: pickup || 'Chennai',
        destination: drop || 'Outstation',
        pickupDateTime: travelDate ? `${travelDate} ${reportingTime}` : '',
        returnDateTime: '',
        durationDays: d,
        vehicleName: vehicle.label,
        passengers: 'Acting Driver',
        distanceKm: distKm ? (activeTab === 'round' ? distKm * 2 : distKm) : 0,
        totalFare: calculatedFare,
        formattedFare: `₹${calculatedFare.toLocaleString('en-IN')}`,
        gear,
        timestamp: Date.now()
      };
      window.__KT_CURRENT_CALCULATION = calcData;
      window.dispatchEvent(new CustomEvent('kt_calculation_updated', { detail: calcData }));
      onQuoteCalculated?.(calcData);

      trackCalculatorQuote({
        quoteId: generatedQuoteRef,
        calculatorId: 'acting_driver',
        calculatorEngine: 'Acting Driver Cost Calculator',
        sourcePage: '/services/acting-drivers/',
        tripType: activeTab === 'round' ? `Round Trip (${d} Days)` : 'One Way Drop',
        pickup: pickup || 'Chennai',
        drop: drop || 'N/A',
        vehicle: `${vehicle.label} (${gear === 'automatic' ? 'Automatic' : 'Manual'})`,
        distanceKm: distKm ? (activeTab === 'round' ? distKm * 2 : distKm) : '',
        estimatedFare: calculatedFare,
        status: 'Rate Locked',
        meta: {
          quoteRefId: generatedQuoteRef,
          gear,
          days: d,
          nights,
          stayProvided,
          foodProvided,
          travelSchedule: travelDate ? `${travelDate}${reportingTime ? ' @ ' + reportingTime : ''}` : ''
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

  const buildWhatsApp = (type, total, days, distKm, tier = null, foodProv = false, stayProv = false, refId = quoteRefId) => {
    const route = drop.trim() ? `${pickup} → ${drop}` : pickup;
    const distStr = distKm ? ` (~${type === 'round' ? distKm * 2 : distKm} km)` : '';
    const longDistNote = tier && tier.bataMultiplier > 1 ? ` (Includes ${tier.bataDaysLabel} Bata for ${tier.tierNote})` : '';
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

    // Google Maps navigation links
    const { pickupPin, directions } = buildMapsLinks(pickup.trim(), drop.trim(), type);
    const mapsBlock = (pickupPin || directions)
      ? `\n\n🗺️ NAVIGATION LINKS:\n` +
        (pickupPin  ? `• 📍 Pickup Pin: ${pickupPin}\n`  : '') +
        (directions ? `• 🧭 Route Map: ${directions}`    : '')
      : '';

    const msg = 
      `Hi Kalidass Travels, I need an Outstation Acting Driver:\n\n` +
      `📌 *Quote Ref:* ${refId} (24-Hr Rate Lock)\n` +
      `📋 BOOKING DETAILS:\n` +
      `• Trip: ${type === 'round' ? 'Round Trip' : 'One Way Drop'}${longDistNote}\n` +
      `• Route: ${route}${distStr}\n` +
      `• Est. Total: ₹${total.toLocaleString('en-IN')}\n` +
      `• Advance to Lock Chauffeur: ₹500 (Deducted from bill)\n` +
      `• Balance Payable at Drop: ₹${Math.max(0, total - 500).toLocaleString('en-IN')} (Pay after trip)\n\n` +
      `🚗 VEHICLE DETAILS:\n` +
      `• Vehicle Type: ${vehicle.label}\n` +
      `• Transmission / Gear: ${gearLabel}\n` +
      (schedStr ? `\n📅 SCHEDULE:\n• Travel Date & Time: ${schedStr}\n` : '') +
      `\n🍽️ MEALS & STAY POLICY:\n` +
      `• Driver Meals: ${foodNote}\n` +
      (stayNote ? `• Driver Stay: ${stayNote}\n` : '') +
      `\nPlease save my quote & confirm verified chauffeur availability.` +
      mapsBlock;
    return buildWhatsAppUrl(msg, isOperatorMode && operatorCallerPhone ? operatorCallerPhone : undefined);
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
              data-autocomplete-input="true"
              value={pickup}
              onChange={e => {
                const val = e.target.value;
                setPickup(val);
                setShowResult(false);
                setFieldErrors(prev => ({ ...prev, pickup: undefined }));
              }}
              onFocus={handleLocationFocus}
              placeholder="e.g. Pallavaram, Chennai"
              autoComplete="off"
              className={`${inputField} scroll-mt-20 sm:scroll-mt-24`}
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
              data-autocomplete-input="true"
              value={drop}
              onChange={e => {
                const val = e.target.value;
                setDrop(val);
                setShowResult(false);
                setFieldErrors(prev => ({ ...prev, drop: undefined }));
              }}
              onFocus={handleLocationFocus}
              placeholder={activeTab === 'round' ? 'e.g. Tirupati, Madurai, Ooty' : 'e.g. Tirupati, Madurai'}
              autoComplete="off"
              className={`${inputField} scroll-mt-20 sm:scroll-mt-24`}
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
            {/* Official Quote Ref & 24-Hr Price Lock Header */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0b57d0] bg-[#1a73e8]/10 px-2.5 py-0.5 rounded-full">
                <span>Official Quote Ref: {quoteRefId}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Rate Locked 24 Hrs • Send to WhatsApp to Save</span>
              </span>
            </div>

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
                    ? `~${result.distKm ? `${result.distKm} km one-way (${result.distKm * 2} km Round Trip)` : 'Round Trip'} • ${result.days} Day${result.days > 1 ? 's' : ''}${result.autoAdjustedDays ? ` (Min ${result.minRecommendedDays}d for distance)` : ''} • Transparent Estimate`
                    : `~${result.distKm ? `${result.distKm} km Drop` : 'One Way Drop'} • ~${result.distKm ? Math.max(1, Math.round(result.distKm / 50)) : 3} hrs driving • Transparent Estimate`}
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
            <div className="space-y-1.5 text-[13px] sm:text-sm">
              {result.type === 'round' ? (
                <>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Driver Bata ({result.days} {result.days > 1 ? 'Days' : 'Day'} • ₹{result.bata.toLocaleString('en-IN')}/day):</span>
                    <span className="font-bold text-m3-on-surface">₹{result.totalBata.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Food Allowance ({result.days} {result.days > 1 ? 'Days' : 'Day'}):</span>
                    <span className={`font-bold ${result.foodProvided ? 'text-emerald-700' : 'text-m3-on-surface'}`}>
                      {result.foodProvided ? '₹0' : `₹${result.totalFood.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  {result.nights > 0 && (
                    <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                      <span>Night Stay ({result.nights} {result.nights > 1 ? 'Nights' : 'Night'}):</span>
                      <span className={`font-bold ${result.stayProvided ? 'text-emerald-700' : 'text-m3-on-surface'}`}>
                        {result.stayProvided ? '₹0' : `₹${result.totalStay.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>State Permit:</span>
                    <span className="font-bold text-m3-on-surface">₹0</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Tolls:</span>
                    <span className="font-bold text-m3-on-surface">Extra</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Parking:</span>
                    <span className="font-bold text-m3-on-surface">Extra</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Driver Bata ({result.bataDaysLabel || '1 Day'}{result.tierNote ? ` • ${result.tierNote}` : ''}):</span>
                    <span className="font-bold text-m3-on-surface">₹{result.totalBata.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Food Allowance{result.foodMultiplier > 1 ? ` (${result.foodMultiplier} Days)` : ''}:</span>
                    <span className={`font-bold ${result.foodProvided ? 'text-emerald-700' : 'text-m3-on-surface'}`}>
                      {result.foodProvided ? '₹0' : `₹${result.totalFood.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Return Bus Ticket (Govt SETC / Bus):</span>
                    <span className="font-bold text-m3-on-surface">₹{result.busFare.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>State Permit:</span>
                    <span className="font-bold text-m3-on-surface">₹0</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Tolls:</span>
                    <span className="font-bold text-m3-on-surface">Extra</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Parking:</span>
                    <span className="font-bold text-m3-on-surface">Extra</span>
                  </div>
                </>
              )}
            </div>

            {/* Bill Payment Split */}
            <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[13px] sm:text-sm">
              <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                <span>Total Fare:</span>
                <span className="font-bold text-m3-on-surface">₹{result.total.toLocaleString('en-IN')} + Extra</span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-emerald-700 font-medium">
                <span>Advance to Pay:</span>
                <span className="font-bold">-₹500</span>
              </div>
              <div className="flex justify-between items-center py-1 text-m3-on-surface border-t border-slate-200/80">
                <span className="text-sm sm:text-base font-extrabold text-m3-on-surface tracking-tight">
                  Balance at Drop <span className="text-xs font-medium text-m3-on-surface-variant">(After trip)</span>:
                </span>
                <span className="text-lg sm:text-xl font-black text-[#1a73e8] tracking-tight font-heading shrink-0">
                  ₹{Math.max(0, result.total - 500).toLocaleString('en-IN')} + Extra
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
            <div className="pt-1 space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
                <WhatsAppButton
                  href={result.whatsapp}
                  onClick={() => {
                    markQuoteConverted(quoteRefId, {
                      quoteId: quoteRefId,
                      sourcePage: '/services/acting-drivers/',
                      calculatorEngine: 'Acting Driver Cost Calculator',
                      tripType: result.type === 'round' ? `Round Trip (${days} Days)` : 'One Way Drop',
                      pickup: pickup.trim(),
                      drop: drop.trim(),
                      distanceKm: result.distKm ? (result.type === 'round' ? result.distKm * 2 : result.distKm) : '',
                      vehicle: `${vehicle.label} (${gear === 'automatic' ? 'Automatic' : 'Manual'})`,
                      estimatedFare: result.total,
                      travelDate: travelDate ? `${travelDate}${reportingTime ? ' @ ' + reportingTime : ''}` : '',
                      status: 'WhatsApp Clicked'
                    });
                    trackEvent('booking_conversion_whatsapp', {
                      engine: 'acting_driver_estimator',
                      trip_type: result.type,
                      vehicle: vehicle.label,
                      fare: result.total,
                      quote_id: quoteRefId
                    });
                  }}
                  variant="filled"
                  size="md"
                  data-direct-whatsapp="true"
                  className="w-full sm:flex-1 px-5 py-3.5 min-h-[46px] text-sm font-bold shadow-m3-1 justify-center active:scale-[0.99]"
                  text={`Send Quote & Book Driver on WhatsApp (₹${result.total.toLocaleString('en-IN')})`}
                />

                <a
                  href="tel:+918939539211"
                  onClick={() => {
                    markQuoteConverted(quoteRefId, {
                      quoteId: quoteRefId,
                      sourcePage: '/services/acting-drivers/',
                      calculatorEngine: 'Acting Driver Cost Calculator',
                      tripType: result.type === 'round' ? `Round Trip (${days} Days)` : 'One Way Drop',
                      pickup: pickup.trim(),
                      drop: drop.trim(),
                      distanceKm: result.distKm ? (result.type === 'round' ? result.distKm * 2 : result.distKm) : '',
                      vehicle: `${vehicle.label} (${gear === 'automatic' ? 'Automatic' : 'Manual'})`,
                      estimatedFare: result.total,
                      travelDate: travelDate ? `${travelDate}${reportingTime ? ' @ ' + reportingTime : ''}` : '',
                      status: 'Call Desk Clicked'
                    });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] bg-white hover:bg-slate-50 active:scale-[0.99] text-m3-on-surface font-semibold text-sm rounded-full border border-m3-outline-variant shadow-2xs transition-colors shrink-0 cursor-pointer"
                  aria-label="Call +91 89395 39211"
                >
                  <Phone className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
                  <span>Call Desk</span>
                </a>
              </div>
              <p className="text-[11px] text-m3-on-surface-variant text-center font-medium">
                ✓ Lock Rate 24 Hrs ({quoteRefId}) • ✓ Check Live Chauffeur Availability • ✓ ₹500 Advance to Lock (Deducted from Fare)
              </p>
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
