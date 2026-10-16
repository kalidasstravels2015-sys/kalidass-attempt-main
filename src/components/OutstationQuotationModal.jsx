import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Navigation, 
  LocateFixed, 
  Clock, 
  Calculator, 
  Receipt, 
  ChevronDown, 
  CheckCircle2, 
  Phone, 
  Car, 
  AlertCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { trackEvent, trackCalculatorQuote, markQuoteConverted } from '../lib/analytics';
import tnBusFares from '../data/tnBusFares.json';
import tripsData from '../data/trips.json';
import tariffConfig from '../data/tariff_config.json';

// Distance lookup table for South India routes from Chennai
const COMMON_DISTANCES_FROM_CHENNAI = {
  'chennai': 0,
  'pondicherry': 151,
  'puducherry': 151,
  'bangalore': 346,
  'bengaluru': 346,
  'tirupati': 135,
  'tirumala': 155,
  'vellore': 137,
  'kanchipuram': 75,
  'mahabalipuram': 56,
  'mamallapuram': 56,
  'trichy': 332,
  'tiruchirappalli': 332,
  'madurai': 462,
  'coimbatore': 505,
  'salem': 340,
  'thanjavur': 342,
  'tirunelveli': 624,
  'kanyakumari': 708,
  'rameshwaram': 575,
  'kodaikanal': 530,
  'ooty': 555,
  'munnar': 580,
  'mysore': 480,
  'mysuru': 480,
  'tiruvannamalai': 195,
  'thiruvannamalai': 195,
  'chidambaram': 215,
  'kumbakonam': 298,
  'nagapattinam': 315,
  'velankanni': 325,
  'yelagiri': 230,
  'yercaud': 365,
  'hosur': 305,
  'krishnagiri': 260,
  'dharmapuri': 300,
  'erode': 395,
  'tirupur': 460,
  'dindigul': 420,
  'karur': 375,
  'neyveli': 215,
  'cuddalore': 180,
  'villupuram': 165,
  'chengalpattu': 55,
  'tambaram': 30,
  'sriperumbudur': 45,
  'arakkonam': 70,
  'tiruttani': 85,
  'srikalahasti': 115,
  'vijayawada': 450,
  'nellore': 175,
  'hyderabad': 630
};

const CHENNAI_FORMS = [
  'chennai', 'airport', 'tambaram', 'guindy', 'koyambedu', 'egmore', 'central',
  'pallavaram', 'velachery', 'porur', 'annanagar', 'anna nagar', 't nagar', 't. nagar',
  'sholinganallur', 'omr', 'ecr', 'perungudi', 'thiruvanmiyur', 'adyar', 'mylapore',
  'chromepet', 'medavakkam', 'madipakkam', 'alandur', 'vadapalani', 'ambattur', 'avadi',
  'poonamallee', 'kolathur', 'redhills', 'kilpauk', 'nungambakkam', 'triplicane', 'royapettah'
];

const POPULAR_DESTINATIONS = [
  { name: 'Pondicherry', km: 151 },
  { name: 'Bangalore', km: 346 },
  { name: 'Tirupati', km: 135 },
  { name: 'Vellore', km: 137 },
  { name: 'Coimbatore', km: 505 },
  { name: 'Madurai', km: 462 },
  { name: 'Kumbakonam', km: 298 }
];

const findKnownDistance = (origin, destination) => {
  const o = (origin || '').toLowerCase().trim();
  const d = (destination || '').toLowerCase().trim();
  if (!o || !d) return null;

  // 1. Check tnBusFares table
  const busRoute = tnBusFares.find(r => 
    (o.includes(r.source) && d.includes(r.destination)) ||
    (o.includes(r.destination) && d.includes(r.source))
  );
  if (busRoute) {
    const km = busRoute.distanceKm;
    return {
      distance: km,
      duration: `${Math.max(1, Math.round(km / 50))} hrs (Est)`
    };
  }

  // 2. Check trips.json
  const trip = tripsData.find(t => {
    const key = t.title.toLowerCase().split(' ')[0];
    return o.includes(key) || d.includes(key);
  });
  if (trip && trip.kmOneWay) {
    return {
      distance: trip.kmOneWay,
      duration: trip.duration || `${Math.max(1, Math.round(trip.kmOneWay / 50))} hrs`
    };
  }

  // 3. Check COMMON_DISTANCES_FROM_CHENNAI
  const isOChennai = CHENNAI_FORMS.some(k => o.includes(k));
  const isDChennai = CHENNAI_FORMS.some(k => d.includes(k));

  if (isOChennai || isDChennai) {
    const other = isOChennai ? d : o;
    for (const [city, km] of Object.entries(COMMON_DISTANCES_FROM_CHENNAI)) {
      if (other.includes(city)) {
        return {
          distance: km,
          duration: `${Math.max(1, Math.round(km / 50))} hrs (Est)`
        };
      }
    }
  }

  return null;
};

const estimateRoadExtras = (pickup, drop, distanceKm, days, isRoundTrip) => {
  const p = (pickup || '').toLowerCase();
  const d = (drop || '').toLowerCase();
  const text = `${p} ${d}`;
  const totalKm = isRoundTrip ? (distanceKm || 0) * 2 : (distanceKm || 0);
  const nights = isRoundTrip ? Math.max(0, (days || 1) - 1) : 0;
  
  let stateName = 'Tamil Nadu';
  let statePermitEst = 0;
  let tollsEst = 0;

  if (text.includes('tirupati') || text.includes('tirumala') || text.includes('andhra') || text.includes('kalahasti') || text.includes('nellore') || text.includes('vijayawada') || text.includes('chittoor') || text.includes('renigunta')) {
    stateName = 'Andhra Pradesh';
    statePermitEst = 500;
    tollsEst = isRoundTrip ? 400 : 220;
  } else if (text.includes('bangalore') || text.includes('bengaluru') || text.includes('karnataka') || text.includes('mysore') || text.includes('mysuru') || text.includes('hosur')) {
    stateName = 'Karnataka';
    statePermitEst = 700;
    tollsEst = isRoundTrip ? 450 : 250;
  } else if (text.includes('pondicherry') || text.includes('puducherry') || text.includes('auroville')) {
    stateName = 'Puducherry (UT)';
    statePermitEst = 0;
    tollsEst = isRoundTrip ? 250 : 130;
  } else if (text.includes('kerala') || text.includes('munnar') || text.includes('cochin') || text.includes('kochi') || text.includes('sabarimala') || text.includes('wayanad')) {
    stateName = 'Kerala';
    statePermitEst = 800;
    tollsEst = isRoundTrip ? 650 : 350;
  } else {
    stateName = 'Tamil Nadu';
    statePermitEst = 0;
    tollsEst = Math.round((totalKm * 0.85) / 10) * 10;
    if (tollsEst < 80 && totalKm >= 50) tollsEst = 80;
  }

  const driverNightStayEst = nights * 450;
  const roadExtrasEst = tollsEst + statePermitEst + driverNightStayEst;

  return {
    stateName,
    statePermitEst,
    tollsEst,
    nights,
    driverNightStayEst,
    roadExtrasEst
  };
};

const calculateCalendarDays = (pickupStr, returnStr) => {
  if (!pickupStr || !returnStr) return 1;
  const p = new Date(pickupStr);
  const r = new Date(returnStr);
  if (isNaN(p.getTime()) || isNaN(r.getTime())) return 1;
  if (r < p) return 1;
  const pCal = new Date(p.getFullYear(), p.getMonth(), p.getDate());
  const rCal = new Date(r.getFullYear(), r.getMonth(), r.getDate());
  const diffDays = Math.round((rCal - pCal) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
};

// Parse driving duration in hours from duration string or distance km
const parseDrivingHours = (durationStr, distanceKm) => {
  if (durationStr && typeof durationStr === 'string') {
    const hourMatch = durationStr.match(/(\d+(\.\d+)?)\s*(?:hour|hr|h)/i);
    const minMatch = durationStr.match(/(\d+)\s*(?:minute|min|m)/i);
    if (hourMatch) {
      const hrs = parseFloat(hourMatch[1]);
      const mins = minMatch ? parseInt(minMatch[1], 10) / 60 : 0;
      return hrs + mins;
    }
  }
  if (distanceKm && distanceKm > 0) {
    return Math.max(1, Math.round((distanceKm / 52) * 10) / 10);
  }
  return 1;
};

// Calculate minimum realistic duration, days, and safety feasibility for outstation trips
const getTripDrivingRequirements = (oneWayKm, isRoundTrip, durationStr) => {
  if (!oneWayKm || oneWayKm <= 0) {
    return {
      oneWayHours: 1,
      totalDrivingHours: 1,
      minRealisticHours: 4,
      minDays: 1,
      isSameDayFeasible: true,
      recommendedDays: 1,
      drivingText: ''
    };
  }

  const oneWayHours = parseDrivingHours(durationStr, oneWayKm);
  const totalDrivingHours = isRoundTrip ? Math.round(oneWayHours * 2 * 10) / 10 : oneWayHours;
  const totalKm = isRoundTrip ? oneWayKm * 2 : oneWayKm;

  if (!isRoundTrip) {
    return {
      oneWayHours,
      totalDrivingHours: oneWayHours,
      minRealisticHours: Math.ceil(oneWayHours),
      minDays: 1,
      isSameDayFeasible: true,
      recommendedDays: 1,
      drivingText: `~${Math.round(oneWayHours)} hrs drive`
    };
  }

  const isSameDayFeasible = totalDrivingHours <= 9.5 && totalKm <= 380;

  let minDays = 1;
  if (totalKm > 1000 || totalDrivingHours > 20) {
    minDays = 3;
  } else if (!isSameDayFeasible || totalKm > 360 || totalDrivingHours > 9.5) {
    minDays = 2;
  } else {
    minDays = 1;
  }

  const minRealisticHours = isSameDayFeasible 
    ? Math.max(8, Math.ceil(totalDrivingHours + 3))
    : Math.max(24, Math.ceil(totalDrivingHours + 10));

  const recommendedDays = Math.max(minDays, Math.ceil(totalKm / 300));
  const drivingText = `~${Math.round(totalDrivingHours)} hrs driving (~${Math.round(oneWayHours)} hrs/way)`;

  return {
    oneWayHours,
    totalDrivingHours,
    minRealisticHours,
    minDays,
    isSameDayFeasible,
    recommendedDays,
    drivingText
  };
};

const getMinReturnDateTime = (pickupVal, minHours) => {
  if (!pickupVal) return '';
  const d = new Date(pickupVal);
  if (isNaN(d.getTime())) return '';
  d.setHours(d.getHours() + Math.ceil(minHours || 4));
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getEstimatedArrival = (pickupVal, drivingHours) => {
  if (!pickupVal) return '';
  const d = new Date(pickupVal);
  if (isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() + Math.round(drivingHours * 60));
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getDefaultDepartureTime = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(6, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T06:00`;
};

const getDefaultReturnTime = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(21, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T21:00`;
};

export default function OutstationQuotationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [vehicle, setVehicle] = useState({
    key: 'Maruti Ertiga',
    name: 'Maruti Ertiga / XL6',
    badge: 'Family Favorite',
    image: '/images/fleet/maruti-ertiga.webp',
    capacity: '6 Pax + 3 Bags',
    roundTripRate: 17,
    oneWayRate: 19,
    minKm: 250,
    bata: 500
  });

  const [tripType, setTripType] = useState('round'); // 'round' | 'oneway'
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [date, setDate] = useState(() => getDefaultDepartureTime());
  const [returnDate, setReturnDate] = useState(() => getDefaultReturnTime());
  const [days, setDays] = useState(1);

  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [estimate, setEstimate] = useState(0);
  const [breakdown, setBreakdown] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [errors, setErrors] = useState({});
  const [bookingId, setBookingId] = useState('#KT-OUT-101');

  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const autocompleteInitialized = useRef(false);

  const effDist = distance || (isTirupatiTrip(drop) ? 135 : 0);
  const tripReq = getTripDrivingRequirements(effDist, tripType === 'round', duration);

  let scheduleAdvisory = null;
  if (tripType === 'round' && distance && date && returnDate) {
    const diffHours = (new Date(returnDate) - new Date(date)) / (1000 * 60 * 60);
    const roundKm = (distance * 2).toFixed(0);
    if (diffHours < tripReq.totalDrivingHours) {
      scheduleAdvisory = `Round trip covers ~${roundKm} km (~${Math.round(tripReq.totalDrivingHours)} hrs driving). Selected schedule window (${Math.max(1, Math.round(diffHours))} hrs) is less than round-trip driving time. Minimum ${tripReq.minDays} calendar days required for highway safety.`;
    } else if (!tripReq.isSameDayFeasible && days === 1) {
      scheduleAdvisory = `Round trip covers ~${roundKm} km (~${Math.round(tripReq.totalDrivingHours)} hrs driving). Same-day return is not feasible for highway safety. Minimum ${tripReq.minDays} calendar days applies.`;
    }
  }

  // Synchronize days count for Round Trip with minDays enforcement
  useEffect(() => {
    if (tripType === 'round') {
      const computed = calculateCalendarDays(date, returnDate);
      setDays(Math.max(tripReq.minDays, computed));
    } else {
      setDays(1);
    }
  }, [tripType, date, returnDate, distance, duration, tripReq.minDays]);

  function isTirupatiTrip(dest) {
    const d = (dest || '').toLowerCase();
    return d.includes('tirupati') || d.includes('tirumala');
  }

  // Recalculate cost when tripType, vehicle, distance, or days change
  useEffect(() => {
    if (!distance && !isTirupatiTrip(drop)) {
      setEstimate(0);
      setBreakdown(null);
      return;
    }

    const effDistance = distance || 135;
    const rate = tripType === 'round' ? vehicle.roundTripRate : vehicle.oneWayRate;
    const bata = vehicle.bata;
    const isTirupati = isTirupatiTrip(drop);

    let totalCost = 0;
    let bObj = {};

    if (tripType === 'round') {
      if (isTirupati) {
        // Tirupati package rates
        const tirupatiRates = {
          'Swift Dzire':     { 1: 6000, 2: 9500, 3: 13200, extra: 3500 },
          'Toyota Etios':    { 1: 6000, 2: 9500, 3: 13200, extra: 3500 },
          'Maruti Ertiga':   { 1: 7500, 2: 11500, 3: 15800, extra: 4300 },
          'Toyota Innova':   { 1: 8500, 2: 12500, 3: 17500, extra: 5000 },
          'Innova':          { 1: 8500, 2: 12500, 3: 17500, extra: 5000 },
          'Innova Crysta':   { 1: 10000, 2: 16000, 3: 22500, extra: 6500 },
          'Tempo Traveller': { 1: 12500, 2: 19500, 3: 27000, extra: 7500 },
        };
        const vRates = tirupatiRates[vehicle.key] || tirupatiRates['Maruti Ertiga'];
        const tripDays = Math.max(1, days || 1);
        const pkgCost = tripDays === 1 ? vRates[1] 
                      : tripDays === 2 ? vRates[2] 
                      : tripDays === 3 ? vRates[3] 
                      : vRates[3] + (tripDays - 3) * vRates.extra;
        
        totalCost = pkgCost;
        bObj = {
          base_km: tripDays * (vehicle.minKm || 250),
          actual_km: 320,
          chargeable_km: 320,
          free_buffer_km: 0,
          rate_per_km: rate,
          km_cost: pkgCost,
          driver_bata: tripDays * bata,
          daily_bata: bata,
          days: tripDays,
          is_tirupati_pkg: true,
          all_inclusive_est: pkgCost,
          tolls_est: 0,
          state_permit_est: 0
        };
      } else {
        const minKm = (days || 1) * (vehicle.minKm || 250);
        const actualRoundTripKm = effDistance * 2;
        const chargeableKm = Math.max(minKm, actualRoundTripKm);
        const freeBufferKm = Math.max(0, chargeableKm - actualRoundTripKm);
        const bataTotal = (days || 1) * bata;
        const kmCost = chargeableKm * rate;
        totalCost = kmCost + bataTotal;

        const extras = estimateRoadExtras(pickup, drop, effDistance, days, true);

        bObj = {
          base_km: minKm,
          actual_km: actualRoundTripKm,
          chargeable_km: chargeableKm,
          free_buffer_km: freeBufferKm,
          rate_per_km: rate,
          km_cost: kmCost,
          driver_bata: bataTotal,
          daily_bata: bata,
          days: days || 1,
          state_name: extras.stateName,
          state_permit_est: extras.statePermitEst,
          tolls_est: extras.tollsEst,
          driver_night_stay_est: extras.driverNightStayEst,
          road_extras_est: extras.roadExtrasEst,
          all_inclusive_est: Math.round((totalCost + extras.roadExtrasEst) / 10) * 10
        };
      }
    } else {
      // One-Way Drop
      const minDropKm = vehicle.key.includes('Tempo') ? 250 : 130;
      const chargeableKm = Math.max(minDropKm, effDistance);
      const kmCost = chargeableKm * rate;
      totalCost = kmCost + bata;
      const extras = estimateRoadExtras(pickup, drop, effDistance, 1, false);

      bObj = {
        base_km: minDropKm,
        actual_km: effDistance,
        chargeable_km: chargeableKm,
        free_buffer_km: Math.max(0, chargeableKm - effDistance),
        rate_per_km: rate,
        km_cost: kmCost,
        driver_bata: bata,
        daily_bata: bata,
        days: 1,
        state_name: extras.stateName,
        state_permit_est: extras.statePermitEst,
        tolls_est: extras.tollsEst,
        road_extras_est: extras.roadExtrasEst,
        all_inclusive_est: Math.round((totalCost + extras.roadExtrasEst) / 10) * 10,
        is_oneway: true
      };
    }

    setEstimate(Math.round(totalCost / 10) * 10);
    setBreakdown(bObj);
  }, [distance, tripType, vehicle, days, drop, pickup]);

  const applyResolvedDistance = (distKm, durStr) => {
    setDistance(distKm);
    setDuration(durStr);

    if (tripType === 'round' && distKm) {
      const req = getTripDrivingRequirements(distKm, true, durStr);
      if (req.minDays > 1) {
        const curDays = calculateCalendarDays(date, returnDate);
        if (curDays < req.minDays) {
          const p = new Date(date || getDefaultDepartureTime());
          p.setDate(p.getDate() + (req.minDays - 1));
          p.setHours(21, 0, 0, 0);
          const year = p.getFullYear();
          const month = String(p.getMonth() + 1).padStart(2, '0');
          const day = String(p.getDate()).padStart(2, '0');
          setReturnDate(`${year}-${month}-${day}T21:00`);
          setDays(req.minDays);
        }
      }
    }
    setLoading(false);
  };

  // Calculate distance between pickup and drop
  const resolveDistance = (origin, destination) => {
    const o = (origin || pickup || '').trim();
    const d = (destination || drop || '').trim();
    if (!o || !d) return;

    setLoading(true);
    setErrors({});

    // 1. Fast local resolution
    const known = findKnownDistance(o, d);
    if (known) {
      applyResolvedDistance(known.distance, known.duration);
      return;
    }

    if (isTirupatiTrip(d)) {
      applyResolvedDistance(135, '3.5 - 4 hrs');
      return;
    }

    // 2. Google Maps Distance Matrix API
    let resolved = false;
    const fallbackTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        const fallbackKm = tripType === 'round' ? 250 : 150;
        applyResolvedDistance(fallbackKm, tripType === 'round' ? 'Full Day' : '3-4 hrs (Est)');
      }
    }, 3000);

    if (window.google && window.google.maps) {
      try {
        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [o],
            destinations: [d],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(fallbackTimer);
            if (
              status === 'OK' &&
              response &&
              response.rows[0] &&
              response.rows[0].elements[0] &&
              response.rows[0].elements[0].status === 'OK'
            ) {
              const element = response.rows[0].elements[0];
              const distValue = Math.round((element.distance.value / 1000) * 10) / 10;
              const durText = element.duration.text;
              applyResolvedDistance(distValue, durText);
              return;
            }
            // Fallback
            const fallbackKm = tripType === 'round' ? 250 : 150;
            applyResolvedDistance(fallbackKm, tripType === 'round' ? 'Full Day' : '3-4 hrs (Est)');
          }
        );
      } catch (e) {
        if (!resolved) {
          resolved = true;
          clearTimeout(fallbackTimer);
          const fallbackKm = tripType === 'round' ? 250 : 150;
          applyResolvedDistance(fallbackKm, tripType === 'round' ? 'Full Day' : '3-4 hrs (Est)');
        }
      }
    } else {
      if (!resolved) {
        resolved = true;
        clearTimeout(fallbackTimer);
        const fallbackKm = tripType === 'round' ? 250 : 150;
        applyResolvedDistance(fallbackKm, tripType === 'round' ? 'Full Day' : '3-4 hrs (Est)');
      }
    }
  };

  // Google Places Autocomplete on modal open
  useEffect(() => {
    if (!isOpen) return;

    loadGoogleMaps().then(() => {
      if (autocompleteInitialized.current) return;
      if (!window.google || !window.google.maps || !window.google.maps.places) return;

      const options = {
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'name', 'geometry'],
      };

      if (pickupInputRef.current) {
        const pAuto = new window.google.maps.places.Autocomplete(pickupInputRef.current, options);
        pAuto.addListener('place_changed', () => {
          const place = pAuto.getPlace();
          const addr = place.formatted_address || place.name;
          if (addr) {
            setPickup(addr);
            if (drop) resolveDistance(addr, drop);
          }
        });
      }

      if (dropInputRef.current) {
        const dAuto = new window.google.maps.places.Autocomplete(dropInputRef.current, options);
        dAuto.addListener('place_changed', () => {
          const place = dAuto.getPlace();
          const addr = place.formatted_address || place.name;
          if (addr) {
            setDrop(addr);
            if (pickup) resolveDistance(pickup, addr);
          }
        });
      }

      autocompleteInitialized.current = true;
    }).catch(() => {});
  }, [isOpen, drop, pickup]);

  // Current Geolocation for Pickup
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (window.google && window.google.maps && window.google.maps.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (res, status) => {
            setGettingLocation(false);
            if (status === 'OK' && res && res[0]) {
              const addr = res[0].formatted_address;
              setPickup(addr);
              if (drop) resolveDistance(addr, drop);
            } else {
              setPickup(`Chennai (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
            }
          });
        } else {
          setGettingLocation(false);
          setPickup(`Chennai (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
        }
      },
      (err) => {
        setGettingLocation(false);
        alert('Unable to fetch GPS location. Please enter manually.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Listen to open modal events
  useEffect(() => {
    const handleOpen = (e) => {
      const data = e.detail || {};
      setVehicle({
        key: data.vehicleKey || 'Maruti Ertiga',
        name: data.vehicleName || 'Maruti Ertiga / XL6',
        badge: data.badge || 'Family Favorite',
        image: data.image || '/images/fleet/maruti-ertiga.webp',
        capacity: data.capacity || '6 Pax + 3 Bags',
        roundTripRate: data.roundTripRate || 17,
        oneWayRate: data.oneWayRate || 19,
        minKm: data.minKm || 250,
        bata: data.bata || 500
      });
      setBookingId('#KT-OUT-' + Math.floor(100 + Math.random() * 900));
      setIsOpen(true);
      document.body.style.overflow = 'hidden';

      // Load Google Maps in background
      loadGoogleMaps().catch(() => {});
    };

    window.addEventListener('open-outstation-calculator', handleOpen);
    window.openOutstationCalculator = (vehData) => {
      window.dispatchEvent(new CustomEvent('open-outstation-calculator', { detail: vehData }));
    };

    return () => {
      window.removeEventListener('open-outstation-calculator', handleOpen);
    };
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && isOpen) closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Handle WhatsApp Book
  const handleWhatsApp = async () => {
    if (!pickup.trim() || !drop.trim()) {
      setErrors({
        pickup: !pickup.trim() ? 'Please enter pickup location in Chennai' : undefined,
        drop: !drop.trim() ? 'Please enter drop location / destination' : undefined,
      });
      if (!pickup.trim() && pickupInputRef.current) pickupInputRef.current.focus();
      else if (!drop.trim() && dropInputRef.current) dropInputRef.current.focus();
      return;
    }

    if (!distance) {
      resolveDistance(pickup, drop);
    }

    const finalEstimate = estimate || 0;
    const effDistance = distance || (tripType === 'round' ? 250 : 130);
    const roundKm = tripType === 'round' ? effDistance * 2 : effDistance;
    const formattedPickupDate = new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const formattedReturnDate = tripType === 'round' ? new Date(returnDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

    // Record booking in operations system
    try {
      fetch('/api/record-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId,
          name: 'Direct WhatsApp Guest',
          phone: '',
          pickupAddress: pickup,
          vehicle: vehicle.name,
          passengers: vehicle.capacity,
          package: `Outstation Cab (${tripType === 'round' ? 'Round Trip' : 'One Way'})`,
          days: days,
          pickupDate: formattedPickupDate,
          pickupTime: '',
          returnDate: formattedReturnDate,
          fare: `₹${finalEstimate.toLocaleString('en-IN')}`,
          slug: 'outstation-cabs',
          route: `${pickup} ➔ ${drop}`
        })
      });
    } catch (e) {}

    // Build complete WhatsApp message
    const message = 
`*Kalidass Travels — Outstation Cab Booking Quote* 🚕
━━━━━━━━━━━━━━━━━━━━
📌 *Ref ID:* ${bookingId}
🚗 *Vehicle:* ${vehicle.name} (${vehicle.capacity})
🔄 *Trip Type:* ${tripType === 'round' ? 'Round Trip (Same Cab Return)' : 'One-Way Drop Taxi'}
📍 *Pickup in Chennai:* ${pickup}
🏁 *Destination:* ${drop}
📅 *Pickup Date & Time:* ${formattedPickupDate}${tripType === 'round' ? `\n📅 *Return Date & Time:* ${formattedReturnDate} (${days} ${days > 1 ? 'Days' : 'Day'})` : ''}
📏 *Distance & Driving Time:* ~${roundKm.toFixed(0)} km ${tripType === 'round' ? 'Round Trip' : 'One-Way'}${tripReq.drivingText ? ` (${tripReq.drivingText})` : (duration ? ` (${duration})` : '')}

━━━━━━━━━━━━━━━━━━━━
💰 *ESTIMATED FARE BREAKDOWN:*
• Base Vehicle Meter Fare: ₹${(breakdown?.km_cost || finalEstimate).toLocaleString('en-IN')} (${breakdown?.chargeable_km || roundKm} km @ ₹${breakdown?.rate_per_km || (tripType === 'round' ? vehicle.roundTripRate : vehicle.oneWayRate)}/km)
• Chauffeur Duty & Day Bata: ₹${(breakdown?.driver_bata || vehicle.bata * days).toLocaleString('en-IN')} (${days} ${days > 1 ? 'Days' : 'Day'})
${breakdown?.free_buffer_km > 0 ? `• Sightseeing Buffer: +${breakdown.free_buffer_km.toFixed(0)} km (Included ₹0)\n` : ''}• Net Estimated Total: *₹${finalEstimate.toLocaleString('en-IN')}*
• Advance Token to Confirm: *₹500*
• Balance on Completion: *₹${Math.max(0, finalEstimate - 500).toLocaleString('en-IN')}* (Pay driver after trip)

━━━━━━━━━━━━━━━━━━━━
✅ *Inclusions:* Dedicated AC Vehicle, Fuel & Chauffeur Day Bata Included
ℹ️ *Note:* Highway FASTag tolls and interstate border permits charged at actuals with zero markup.

Please confirm vehicle availability and driver allocation.`;

    window.open(buildWhatsAppUrl(message), '_blank');
  };

  if (!isOpen) return null;

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="outstation-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={closeModal} />

      {/* Main Sheet Container */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full sm:max-w-xl bg-m3-surface text-m3-on-surface rounded-t-3xl sm:rounded-m3-2xl border border-m3-outline-variant shadow-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-slideUp sm:animate-scaleUp z-10"
      >
        {/* Header */}
        <header className="px-5 pt-3.5 pb-3 bg-m3-surface-container-low border-b border-m3-outline-variant/50 relative shrink-0">
          <div className="w-10 h-1 rounded-full bg-m3-outline-variant/80 mx-auto mb-2.5 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-m3-primary animate-pulse" />
                <h2 id="outstation-modal-title" className="text-sm sm:text-base font-extrabold text-m3-on-surface font-heading leading-tight">
                  Outstation Fare Calculator &amp; Booking
                </h2>
              </div>
              <span className="text-[10px] font-bold text-m3-on-primary-container bg-m3-primary-container px-2 py-0.5 rounded-full inline-block mt-0.5">
                Ref: {bookingId}
              </span>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close calculator"
              className="shrink-0 p-1.5 rounded-m3-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs sm:text-sm">
          
          {/* 1. Locked Vehicle Banner (Pre-selected, no vehicle dropdown, no pax selector) */}
          <div className="p-3 sm:p-3.5 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/60">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-16 h-10 shrink-0 bg-white rounded-m3-md p-1 border border-m3-outline-variant/40 flex items-center justify-center">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    width="60"
                    height="36"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-m3-primary bg-m3-primary/10 px-1.5 py-0.5 rounded-m3-xs border border-m3-primary/20">
                      {vehicle.badge}
                    </span>
                    <span className="text-[10px] font-semibold text-m3-on-surface-variant">
                      {vehicle.capacity}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-m3-on-surface font-heading truncate mt-0.5">
                    {vehicle.name}
                  </h3>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-m3-primary font-heading block leading-tight">
                  ₹{tripType === 'round' ? vehicle.roundTripRate : vehicle.oneWayRate} / km
                </span>
                <span className="text-[9px] text-m3-on-surface-variant block font-medium">
                  {tripType === 'round' ? 'Round-Trip Rate' : 'One-Way Drop Rate'}
                </span>
                <span className="text-[9px] text-m3-on-surface-variant font-medium">
                  Min {vehicle.minKm} km/day • Bata ₹{vehicle.bata}/day
                </span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-m3-outline-variant/40 flex items-center justify-between text-[10px] text-m3-on-surface-variant font-medium">
              <span className="flex items-center gap-1 text-m3-success font-semibold">
                <CheckCircle2 className="w-3 h-3 text-m3-success" />
                Vehicle Pre-Selected • Zero Passenger Filter Delay
              </span>
              <span>Fuel &amp; Chauffeur Included</span>
            </div>
          </div>

          {/* 2. Trip Type Switcher (Round Trip vs One Way Drop) */}
          <div>
            <label className="block text-xs font-bold text-m3-on-surface mb-1">
              Select Trip Type:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-m3-surface-container rounded-m3-xl border border-m3-outline-variant/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTripType('round')}
                className={`py-2 px-3 rounded-m3-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tripType === 'round'
                    ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                }`}
              >
                <span>Round Trip (இரு வழி)</span>
              </button>
              <button
                type="button"
                onClick={() => setTripType('oneway')}
                className={`py-2 px-3 rounded-m3-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tripType === 'oneway'
                    ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                }`}
              >
                <span>One Way Drop (ஒரு வழி)</span>
              </button>
            </div>
          </div>

          {/* 3. Pickup Location in Chennai (GPS & Autocomplete) */}
          <div>
            <label htmlFor="modal-pickup-location" className="block text-xs font-bold text-m3-on-surface mb-1">
              1. Pickup Location in Chennai *
            </label>
            <div className="relative flex items-center bg-white border border-m3-outline-variant focus-within:border-m3-primary focus-within:ring-1 focus-within:ring-m3-primary rounded-m3-lg transition-all shadow-2xs">
              <input
                id="modal-pickup-location"
                ref={pickupInputRef}
                type="text"
                autoComplete="street-address"
                placeholder="e.g. Anna Nagar, Medavakkam, Airport, T. Nagar"
                value={pickup}
                onChange={(e) => {
                  const val = e.target.value;
                  setPickup(val);
                  if (errors.pickup) setErrors(prev => ({ ...prev, pickup: undefined }));
                  if (val && drop) {
                    const known = findKnownDistance(val, drop);
                    if (known) {
                      setDistance(known.distance);
                      setDuration(known.duration);
                    }
                  }
                }}
                onBlur={() => {
                  if (pickup && drop) resolveDistance(pickup, drop);
                }}
                className="w-full bg-transparent py-2.5 pl-3 pr-16 text-xs sm:text-sm font-semibold text-m3-on-surface placeholder:text-m3-on-surface-variant/60 outline-none"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {pickup && (
                  <button
                    type="button"
                    onClick={() => {
                      setPickup('');
                      setDistance(null);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-m3-surface-container text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer"
                    title="Clear text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="w-7 h-7 flex items-center justify-center rounded-m3-sm hover:bg-m3-surface-container text-m3-on-surface-variant hover:text-m3-primary transition-colors cursor-pointer disabled:opacity-50"
                  title="Use current GPS location"
                >
                  <LocateFixed className={`w-4 h-4 ${gettingLocation ? 'animate-spin text-m3-primary' : ''}`} />
                </button>
              </div>
            </div>
            {errors.pickup && (
              <p className="text-[11px] text-m3-error font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.pickup}</span>
              </p>
            )}
          </div>

          {/* 4. Drop Location / Destination City */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="modal-drop-location" className="block text-xs font-bold text-m3-on-surface">
                2. Destination / Drop City *
              </label>
              {(distance || isTirupatiTrip(drop)) && (
                <span className="text-[10px] font-semibold text-m3-primary bg-m3-primary/10 px-2 py-0.5 rounded-m3-xs border border-m3-primary/20">
                  ~{tripType === 'round' ? (effDist * 2).toFixed(0) : effDist.toFixed(0)} km {tripType === 'round' ? 'Round Trip' : 'Drop'}
                  {tripReq.drivingText ? ` • ${tripReq.drivingText}` : ''}
                </span>
              )}
            </div>
            <div className="relative flex items-center bg-white border border-m3-outline-variant focus-within:border-m3-primary focus-within:ring-1 focus-within:ring-m3-primary rounded-m3-lg transition-all shadow-2xs">
              <input
                id="modal-drop-location"
                ref={dropInputRef}
                type="text"
                autoComplete="street-address"
                placeholder="e.g. Pondicherry, Bangalore, Tirupati, Vellore, Trichy"
                value={drop}
                onChange={(e) => {
                  const val = e.target.value;
                  setDrop(val);
                  if (errors.drop) setErrors(prev => ({ ...prev, drop: undefined }));
                  if (val && pickup) {
                    const known = findKnownDistance(pickup, val);
                    if (known) {
                      applyResolvedDistance(known.distance, known.duration);
                    }
                  }
                }}
                onBlur={() => {
                  if (pickup && drop) resolveDistance(pickup, drop);
                }}
                className="w-full bg-transparent py-2.5 pl-3 pr-10 text-xs sm:text-sm font-semibold text-m3-on-surface placeholder:text-m3-on-surface-variant/60 outline-none"
              />
              {drop && (
                <button
                  type="button"
                  onClick={() => {
                    setDrop('');
                    setDistance(null);
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-m3-surface-container text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer"
                  title="Clear text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {errors.drop && (
              <p className="text-[11px] text-m3-error font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.drop}</span>
              </p>
            )}

            {/* Quick Destination Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
              <span className="text-[10px] font-bold text-m3-on-surface-variant shrink-0 uppercase tracking-wider">
                Quick:
              </span>
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  key={dest.name}
                  type="button"
                  onClick={() => {
                    setDrop(dest.name);
                    if (pickup) {
                      resolveDistance(pickup, dest.name);
                    } else {
                      applyResolvedDistance(dest.km, `${Math.round(dest.km / 52)} hrs`);
                    }
                  }}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                    drop === dest.name
                      ? 'bg-m3-primary text-m3-on-primary border-m3-primary shadow-xs'
                      : 'bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface border-m3-outline-variant/60'
                  }`}
                >
                  {dest.name}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Pickup & Return Dates */}
          <div className="space-y-1.5">
            <div className={`grid ${tripType === 'round' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-2 sm:gap-3`}>
              {/* Pickup Date & Time */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-m3-on-surface flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-m3-on-surface-variant shrink-0" />
                  <span>Pickup Date &amp; Time *</span>
                </label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDate(val);
                    if (tripType === 'round') {
                      const minDays = tripReq.minDays || 1;
                      const p = new Date(val);
                      p.setDate(p.getDate() + (minDays - 1));
                      p.setHours(21, 0, 0, 0);
                      const curR = new Date(returnDate);
                      if (isNaN(curR.getTime()) || curR < p) {
                        const year = p.getFullYear();
                        const month = String(p.getMonth() + 1).padStart(2, '0');
                        const day = String(p.getDate()).padStart(2, '0');
                        setReturnDate(`${year}-${month}-${day}T21:00`);
                      }
                    }
                  }}
                  className="w-full bg-white border border-m3-outline-variant focus:border-m3-primary focus:ring-1 focus:ring-m3-primary rounded-m3-lg py-2 px-2.5 text-xs font-semibold text-m3-on-surface outline-none transition-all shadow-2xs"
                />
                {tripType === 'oneway' && effDist > 0 && date && (
                  <p className="text-[10px] text-m3-on-surface-variant flex items-center gap-1 mt-0.5 font-medium">
                    <Clock className="w-3 h-3 text-m3-primary shrink-0" />
                    <span>Est. Arrival: <strong>{getEstimatedArrival(date, tripReq.oneWayHours)}</strong> (~{Math.round(tripReq.oneWayHours)} hrs drive)</span>
                  </p>
                )}
              </div>

              {/* Return Date & Time (Round Trip Only) */}
              {tripType === 'round' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-m3-on-surface flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-m3-on-surface-variant shrink-0" />
                      <span>Return Date &amp; Time *</span>
                    </label>
                    <span className="text-[10px] font-bold text-m3-primary bg-m3-primary/10 px-1.5 py-0.5 rounded-m3-xs">
                      {days} {days > 1 ? 'Days' : 'Day'}
                    </span>
                  </div>
                  <input
                    type="datetime-local"
                    value={returnDate}
                    min={tripReq.minRealisticHours ? getMinReturnDateTime(date, tripReq.minRealisticHours) : date}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-white border border-m3-outline-variant focus:border-m3-primary focus:ring-1 focus:ring-m3-primary rounded-m3-lg py-2 px-2.5 text-xs font-semibold text-m3-on-surface outline-none transition-all shadow-2xs"
                  />
                </div>
              )}
            </div>

            {/* Highway Safety & Duration Advisory */}
            {scheduleAdvisory && (
              <div className="p-2.5 rounded-m3-md bg-amber-500/10 border border-amber-500/30 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{scheduleAdvisory}</span>
              </div>
            )}
          </div>

          {/* Calculate Button (If distance is not yet resolved) */}
          {(!distance && !isTirupatiTrip(drop)) && (
            <div className="pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  if (!pickup.trim() || !drop.trim()) {
                    setErrors({
                      pickup: !pickup.trim() ? 'Please enter pickup location' : undefined,
                      drop: !drop.trim() ? 'Please enter drop location' : undefined,
                    });
                    return;
                  }
                  resolveDistance(pickup, drop);
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-m3-full !bg-[#0B57D0] hover:!bg-[#0842A0] active:!bg-[#0842A0] !text-white font-bold text-xs sm:text-sm shadow-m3-1 hover:shadow-m3-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Calculating Distance &amp; Cost...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 text-white" />
                    <span>Calculate Trip Cost &amp; View Breakdown</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 6. Dynamic Fare Result & Itemized Breakdown */}
          {estimate > 0 && (
            <div className="pt-2 border-t border-m3-outline-variant/60 space-y-3 animate-in fade-in duration-200">
              
              {/* Hero Price & Inclusions Card */}
              <div className="p-3 sm:p-4 rounded-m3-xl bg-m3-surface-container-low border border-m3-outline-variant/60">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface font-heading leading-none">
                      ₹{estimate.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-bold text-m3-on-surface bg-m3-surface-container-high px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Transparent Estimate
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-m3-on-surface-variant">
                    ~{tripType === 'round' ? (effDist * 2).toFixed(0) : effDist.toFixed(0)} km {tripType === 'round' ? 'Round Trip' : 'Drop'}{tripReq.drivingText ? ` · ${tripReq.drivingText}` : ''}
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-m3-on-surface-variant font-medium leading-relaxed">
                  {breakdown?.is_tirupati_pkg
                    ? '100% Fuel + Tolls + AP Interstate Permit + Hill Climb + Driver Bata Included'
                    : `₹${breakdown?.rate_per_km || (tripType === 'round' ? vehicle.roundTripRate : vehicle.oneWayRate)}/km · Fuel & Chauffeur Day Bata Included${breakdown?.free_buffer_km > 0 ? ` · +${breakdown.free_buffer_km.toFixed(0)} km free buffer` : ''}`}
                </p>

                {!breakdown?.is_tirupati_pkg && breakdown?.road_extras_est > 0 && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-m3-on-surface-variant font-medium flex-wrap">
                    <span>Est. Tolls &amp; Permits: <strong className="text-m3-on-surface">~₹{breakdown.road_extras_est.toLocaleString('en-IN')}</strong></span>
                    <span>•</span>
                    <span>All-Inclusive Total: <strong className="text-m3-on-surface font-bold">~₹{breakdown.all_inclusive_est.toLocaleString('en-IN')}</strong></span>
                  </div>
                )}
              </div>

              {/* Itemized Fare Breakdown Section */}
              <div className="border border-m3-outline-variant/80 rounded-m3-xl overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  aria-expanded={showBreakdown}
                  className="w-full px-3.5 py-2.5 min-h-[44px] flex items-center justify-between text-xs font-bold text-m3-on-surface hover:bg-m3-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-m3-on-surface-variant shrink-0" />
                    <span>{showBreakdown ? 'Hide Itemized Fare Breakdown' : 'View Itemized Fare Breakdown'}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-m3-on-surface-variant transition-transform duration-200 ${showBreakdown ? 'rotate-180' : ''}`} />
                </button>

                {showBreakdown && (
                  <div className="p-3 border-t border-m3-outline-variant/60 bg-m3-surface-container-lowest text-xs space-y-1.5 divide-y divide-m3-outline-variant/40">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-m3-on-surface-variant">Dedicated AC Vehicle ({vehicle.name}):</span>
                      <span className="font-bold text-m3-on-surface">₹{(breakdown?.km_cost || estimate).toLocaleString('en-IN')}</span>
                    </div>

                    {breakdown?.driver_bata > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-m3-on-surface-variant">Chauffeur Duty &amp; Bata ({days} {days > 1 ? 'Days' : 'Day'}):</span>
                        <span className="font-bold text-m3-on-surface">₹{breakdown.driver_bata.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {breakdown?.free_buffer_km > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-m3-on-surface-variant">Sightseeing Buffer (+{breakdown.free_buffer_km.toFixed(0)} km):</span>
                        <span className="font-bold text-m3-success">INCLUDED (₹0)</span>
                      </div>
                    )}

                    {breakdown?.is_tirupati_pkg && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-m3-on-surface-variant">FASTag Tolls, AP State Tax &amp; Tirumala Ghat:</span>
                        <span className="font-bold text-m3-success">INCLUDED (₹0)</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 font-bold text-xs sm:text-sm text-m3-on-surface">
                      <span>Net Estimated Total:</span>
                      <span className="text-sm sm:text-base font-extrabold text-m3-on-surface">₹{estimate.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[11px] text-m3-on-surface-variant font-medium">
                      <span>Advance Booking Token:</span>
                      <span className="font-bold text-m3-on-surface">₹500 to Confirm Booking</span>
                    </div>

                    <div className="flex justify-between items-center pt-0.5 text-[11px] text-m3-on-surface-variant">
                      <span>Balance on Completion:</span>
                      <span className="font-semibold text-m3-on-surface">₹{Math.max(0, estimate - 500).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 7. Action Buttons (WhatsApp Book & Call Now) */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
                <WhatsAppButton
                  onClick={handleWhatsApp}
                  variant="filled"
                  size="md"
                  data-direct-whatsapp="true"
                  className="flex-1 px-4 py-3 min-h-[46px] text-xs sm:text-sm font-bold shadow-m3-1 justify-center active:scale-[0.99]"
                  text={`Book on WhatsApp (₹${estimate.toLocaleString('en-IN')})`}
                />

                <a
                  href="tel:+918939539211"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 min-h-[46px] bg-white hover:bg-m3-surface-container active:scale-[0.99] text-m3-on-surface font-semibold text-xs sm:text-sm rounded-m3-full border border-m3-outline-variant shadow-2xs transition-colors shrink-0 cursor-pointer"
                  aria-label="Call +91 89395 39211"
                >
                  <Phone className="w-3.5 h-3.5 text-m3-on-surface-variant shrink-0" />
                  <span>Call: +91 89395 39211</span>
                </a>
              </div>

              <p className="text-center text-[10.5px] text-m3-on-surface-variant/80 font-medium pt-0.5">
                ✓ Pay ₹500 token to lock your chauffeur • Remaining balance paid to driver after trip
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
