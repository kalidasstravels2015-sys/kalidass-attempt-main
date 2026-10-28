import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Navigation, 
  Clock, 
  Calculator, 
  Receipt, 
  ChevronDown, 
  ShieldCheck, 
  Phone, 
  Car, 
  AlertCircle, 
  Info,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import LocationPicker from './LocationPicker';
import { buildWhatsAppUrl, buildMapsLinks } from '../utils/whatsapp';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { trackEvent, trackCalculatorQuote, markQuoteConverted } from '../lib/analytics';
import { getNextQuotationId, peekNextQuotationId } from '../utils/sequenceGenerator';
import tnBusFares from '../data/tnBusFares.json';
import tripsData from '../data/trips.json';
import tariffConfig from '../data/tariff_config.json';
import { estimateRoadExtrasFromMaster } from '../utils/masterTariff';

// Distance lookup table for South India routes from Chennai
const COMMON_DISTANCES_FROM_CHENNAI = {
  'chennai': 0,
  'pondicherry': 151,
  'puducherry': 151,
  'karaikal': 295,
  'thiruvettakudy': 285,
  'nitpy': 285,
  'thirunallar': 295,
  'mayiladuthurai': 255,
  'sirkazhi': 235,
  'tharangambadi': 285,
  'nagore': 305,
  'auroville': 150,
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

  const isKaraikalEnclave = (str) => {
    return str.includes('karaikal') || 
           str.includes('thiruvettakudy') || 
           str.includes('thirunallar') || 
           str.includes('nitpy') || 
           str.includes('nedungadu') || 
           str.includes('kottucherry') || 
           str.includes('neravy') || 
           str.includes('tr pattinam') ||
           /609\d{3}/.test(str);
  };

  const isOChennai = CHENNAI_FORMS.some(k => o.includes(k));
  const isDChennai = CHENNAI_FORMS.some(k => d.includes(k));

  if (isOChennai || isDChennai) {
    const target = isOChennai ? d : o;
    if (isKaraikalEnclave(target)) {
      return {
        distance: 285,
        duration: '5.5 - 6 hrs (Est)'
      };
    }
    if (target.includes('yanam') || target.includes('mahe')) {
      return {
        distance: 650,
        duration: '12 - 14 hrs (Est)'
      };
    }
  }

  // 1. Check tnBusFares table
  const matches = tnBusFares.filter(r => 
    (o.includes(r.source) && d.includes(r.destination)) ||
    (o.includes(r.destination) && d.includes(r.source))
  );

  if (matches.length > 0) {
    const target = isOChennai ? d : (isDChennai ? o : d);
    let best = matches[0];
    if (isKaraikalEnclave(target)) {
      const kMatch = matches.find(m => m.destination === 'karaikal' || m.destination === 'thiruvettakudy' || m.destination === 'nitpy');
      best = kMatch || { distanceKm: 285, destination: 'karaikal' };
    } else {
      best = matches.reduce((longest, curr) => 
        (curr.destination.length > longest.destination.length ? curr : longest), matches[0]
      );
    }

    const km = best.distanceKm;
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
  if (isOChennai || isDChennai) {
    const other = isOChennai ? d : o;
    if (isKaraikalEnclave(other)) {
      return {
        distance: 285,
        duration: '5.5 - 6 hrs (Est)'
      };
    }
    for (const [city, km] of Object.entries(COMMON_DISTANCES_FROM_CHENNAI)) {
      if (other.includes(city)) {
        if ((city === 'pondicherry' || city === 'puducherry') && isKaraikalEnclave(other)) {
          continue;
        }
        return {
          distance: km,
          duration: `${Math.max(1, Math.round(km / 50))} hrs (Est)`
        };
      }
    }
  }

  return null;
};

const estimateRoadExtras = (pickup, drop, distanceKm, days, isRoundTrip, vehicle) => {
  return estimateRoadExtrasFromMaster(pickup, drop, distanceKm, days, isRoundTrip, vehicle);
};

// Calculate billing days from pickup and return strings
// Standard Rule: Up to 24 hours = 1 Day (250 km standard coverage).
// If duration exceeds 24 hours, duration above 24 hours is billed extra.
const calculateCalendarDays = (pickupStr, returnStr) => {
  if (!pickupStr || !returnStr) return 1;
  const p = new Date(pickupStr);
  const r = new Date(returnStr);
  if (isNaN(p.getTime()) || isNaN(r.getTime())) return 1;
  if (r <= p) return 1;
  const diffHours = (r.getTime() - p.getTime()) / (1000 * 60 * 60);
  if (diffHours <= 24) return 1;
  return Math.max(1, Math.ceil(diffHours / 24));
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

// Min selectable datetime (current time)
const getMinDateTime = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
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
    capacity: '6 Seats + 3 Bags',
    roundTripRate: 17,
    oneWayRate: 19,
    minKm: 250,
    bata: 500
  });

  const [tripType, setTripType] = useState('round'); // 'round' | 'oneway'
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [date, setDate] = useState(() => getDefaultDepartureTime());
  const [returnDate, setReturnDate] = useState('');
  const [days, setDays] = useState(1);

  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [estimate, setEstimate] = useState(0);
  const [breakdown, setBreakdown] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [errors, setErrors] = useState({});
  const [bookingId, setBookingId] = useState(() => (typeof window !== 'undefined' ? peekNextQuotationId([], '#KT-OUT-') : '#KT-OUT-101'));
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [pickerField, setPickerField] = useState('pickup');

  const handlePinClick = (field = 'pickup') => {
    loadGoogleMaps().catch(() => {});
    setPickerField(field);
    setLocationPickerOpen(true);
    trackEvent('location_map_opened', { field, context: 'outstation_modal' });
  };

  const handleLocationConfirm = (address) => {
    const clean = address ? address.trim() : '';
    if (pickerField === 'pickup') {
      setPickup(clean);
      if (errors.pickup) setErrors(prev => ({ ...prev, pickup: undefined }));
      if (drop) resolveDistance(clean, drop);
    } else {
      setDrop(clean);
      if (errors.drop) setErrors(prev => ({ ...prev, drop: undefined }));
      if (pickup) resolveDistance(pickup, clean);
    }
    setLocationPickerOpen(false);
    trackEvent('location_pin_used', { field: pickerField, method: 'map_picker', success: true });
  };

  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const autocompleteInitialized = useRef(false);

  const effDist = distance || 0;
  const tripReq = getTripDrivingRequirements(effDist, tripType === 'round', duration);

  let scheduleAdvisory = null;
  if (tripType === 'round' && distance && date && returnDate) {
    const diffHours = (new Date(returnDate) - new Date(date)) / (1000 * 60 * 60);
    const roundKm = (distance * 2).toFixed(0);
    if (diffHours < tripReq.totalDrivingHours) {
      scheduleAdvisory = `Round trip covers ~${roundKm} km (~${Math.round(tripReq.totalDrivingHours)} hrs driving). Selected schedule window (${Math.max(1, Math.round(diffHours))} hrs) is less than round-trip driving time. Minimum ${tripReq.minDays} calendar days required for highway safety.`;
    } else if (diffHours < tripReq.minRealisticHours) {
      scheduleAdvisory = `Round trip covers ~${roundKm} km (~${Math.round(tripReq.totalDrivingHours)} hrs driving). Minimum realistic window is ${tripReq.minRealisticHours} hours for safe travel.`;
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

  // Recalculate cost when tripType, vehicle, distance, or days change
  useEffect(() => {
    if (!distance) {
      setEstimate(0);
      setBreakdown(null);
      return;
    }

    const effDistance = distance;
    const rate = tripType === 'round' ? vehicle.roundTripRate : vehicle.oneWayRate;
    const bata = vehicle.bata;

    let totalCost = 0;
    let bObj = {};

    if (tripType === 'round') {
      const minKm = (days || 1) * (vehicle.minKm || 250);
      const actualRoundTripKm = effDistance * 2;
      const chargeableKm = Math.max(minKm, actualRoundTripKm);
      const freeBufferKm = Math.max(0, chargeableKm - actualRoundTripKm);
      const bataTotal = (days || 1) * bata;
      const kmCost = chargeableKm * rate;
      const extras = estimateRoadExtras(pickup, drop, effDistance, days, true, vehicle.key || vehicle.name);
      const permitAmount = extras?.statePermitEst || 0;
      totalCost = kmCost + bataTotal + permitAmount;

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
        road_extras_est: extras.roadExtrasEst
      };
    } else {
      // One-Way Drop
      const vehStr = `${vehicle.key || ''} ${vehicle.vehicle || ''} ${vehicle.shortName || ''}`;
      const minDropKm = vehStr.includes('Tempo') || vehStr.includes('Urbania') ? 250 : 130;
      const chargeableKm = Math.max(minDropKm, effDistance);
      const kmCost = chargeableKm * rate;
      const extras = estimateRoadExtras(pickup, drop, effDistance, 1, false, vehicle.key || vehicle.name);
      const permitAmount = extras?.statePermitEst || 0;
      totalCost = kmCost + bata + permitAmount;

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
      const minReturn = getMinReturnDateTime(date || getDefaultDepartureTime(), req.minRealisticHours);
      if (returnDate && returnDate < minReturn) {
        setReturnDate(minReturn);
        const computed = calculateCalendarDays(date || getDefaultDepartureTime(), minReturn);
        setDays(Math.max(req.minDays, computed));
      }
    }
    setLoading(false);
  };

  // Calculate distance between pickup and drop
  const resolveDistance = async (origin, destination) => {
    const o = (origin || pickup || '').trim();
    const d = (destination || drop || '').trim();
    if (!o || !d) return;

    setLoading(true);
    setErrors({});

    // Ensure Google Maps is loaded
    if (typeof window !== 'undefined' && (!window.google || !window.google.maps || !window.google.maps.DistanceMatrixService)) {
      try {
        await Promise.race([
          loadGoogleMaps(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Maps timeout')), 2500))
        ]);
      } catch (_) {}
    }

    const fallbackToKnown = () => {
      const known = findKnownDistance(o, d);
      if (known) {
        applyResolvedDistance(known.distance, known.duration);
        return;
      }
      const fallbackKm = tripType === 'round' ? 250 : 150;
      applyResolvedDistance(fallbackKm, tripType === 'round' ? 'Full Day' : '3-4 hrs (Est)');
    };

    // Google Maps Distance Matrix API (Primary)
    let resolved = false;
    const fallbackTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        fallbackToKnown();
      }
    }, 3500);

    if (window.google && window.google.maps && window.google.maps.DistanceMatrixService) {
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
            fallbackToKnown();
          }
        );
      } catch (e) {
        if (!resolved) {
          resolved = true;
          clearTimeout(fallbackTimer);
          fallbackToKnown();
        }
      }
    } else {
      if (!resolved) {
        resolved = true;
        clearTimeout(fallbackTimer);
        fallbackToKnown();
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
        capacity: data.capacity || '6 Seats + 3 Bags',
        roundTripRate: data.roundTripRate || 17,
        oneWayRate: data.oneWayRate || 19,
        minKm: data.minKm || 250,
        bata: data.bata || 500
      });
      setBookingId(getNextQuotationId([], '#KT-OUT-'));
      const defaultDep = getDefaultDepartureTime();
      if (!date) {
        setDate(defaultDep);
      }
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

    markQuoteConverted(bookingId, {
      calculatorId: 'outstation_modal',
      tripType: tripType === 'round' ? 'Round Trip' : 'One Way Drop',
      pickup,
      drop,
      vehicle: vehicle.name,
      estimate: finalEstimate
    });

    trackEvent('booking_conversion_whatsapp', {
      engine: 'outstation_quotation_modal',
      trip_type: tripType,
      vehicle: vehicle.name,
      fare: finalEstimate,
      quote_id: bookingId
    });

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

    // Google Maps navigation links
    const { pickupPin: omPickupPin, directions: omDirections } = buildMapsLinks(pickup, drop, tripType);
    const omMapsBlock = (omPickupPin || omDirections)
      ? `\n\n🗺️ NAVIGATION LINKS:\n` +
        (omPickupPin  ? `• 📍 Pickup Pin: ${omPickupPin}\n`  : '') +
        (omDirections ? `• 🧭 Route Map: ${omDirections}`    : '')
      : '';

    // Build complete WhatsApp message
    const message = 
`*Kalidass Travels — Outstation Cab Booking Quote* 🚕
━━━━━━━━━━━━━━━━━━━━
📌 *Ref ID:* ${bookingId} (24-Hr Rate Lock)
🚗 *Vehicle:* ${vehicle.name} (${vehicle.capacity})
🔄 *Trip Type:* ${tripType === 'round' ? 'Round Trip (Same Cab Return)' : 'One-Way Drop Taxi'}
📍 *Pickup in Chennai:* ${pickup}
🏁 *Destination:* ${drop}
📅 *Pickup Date & Time:* ${formattedPickupDate}${tripType === 'round' ? `\n📅 *Return Date & Time:* ${formattedReturnDate} (${days} ${days > 1 ? 'Days' : 'Day'})` : ''}
📏 *Distance & Driving Time:* ~${roundKm.toFixed(0)} km ${tripType === 'round' ? 'Round Trip' : 'One-Way'}${tripReq.drivingText ? ` (${tripReq.drivingText})` : (duration ? ` (${duration})` : '')}

━━━━━━━━━━━━━━━━━━━━
💰 *ESTIMATED FARE & TERMS:*
• Base Vehicle Meter Fare: ₹${(breakdown?.km_cost || finalEstimate).toLocaleString('en-IN')} (${breakdown?.chargeable_km || roundKm} km @ ₹${breakdown?.rate_per_km || (tripType === 'round' ? vehicle.roundTripRate : vehicle.oneWayRate)}/km)
• Chauffeur Duty & Day Bata: ₹${(breakdown?.driver_bata || vehicle.bata * days).toLocaleString('en-IN')} (${days} ${days > 1 ? 'Days' : 'Day'})
${breakdown?.state_permit_est > 0 ? `• State Entry Permit (${breakdown.state_name}): ₹${breakdown.state_permit_est.toLocaleString('en-IN')}\n` : ''}• Quoted Total Fare: *₹${finalEstimate.toLocaleString('en-IN')} + Tolls/Parking Extra*
• Highway FASTag Tolls: ${breakdown?.tolls_est > 0 ? `Approx. ~₹${breakdown.tolls_est} (Pay at Actuals as per FASTag receipts)` : 'Pay at Actuals as per FASTag receipts'}
• Parking Charges: Pay at Actuals as per receipts
• Payment Policy: Pay 50% (₹${Math.round(finalEstimate * 0.5).toLocaleString('en-IN')}) on cab arrival, balance 50% after trip completion
• Booking Advance: ₹0 (Zero advance to confirm booking)
• Duration Standard: 1 Day = up to 24 hrs / 250 km. Duration above 24 hrs billed extra.

━━━━━━━━━━━━━━━━━━━━
✅ *Inclusions:* Dedicated AC Vehicle, Fuel, Chauffeur Day Bata${breakdown?.state_permit_est > 0 ? ` & ${breakdown.state_name || ''} State Entry Permit` : ''} Included
ℹ️ *Terms:* Zero shed charges (billing from pickup point) • Only tolls and parking payable as per actual receipts.

Please save my quote & confirm live cab availability.` + omMapsBlock;

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
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="text-[10px] font-bold text-m3-on-primary-container bg-m3-primary-container px-2 py-0.5 rounded-full inline-block">
                  Ref: {bookingId}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Rate Locked 24 Hrs • Send to WhatsApp to Save</span>
                </span>
              </div>
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
          
          {/* 1. Locked Vehicle Banner (Pre-selected, no vehicle dropdown, no seats selector) */}
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
              <span className="flex items-center gap-1 text-m3-primary font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-m3-primary shrink-0" />
                Vehicle Pre-Selected • Zero Passenger Filter Delay
              </span>
              <span>Fuel &amp; Chauffeur Included</span>
            </div>
          </div>

          {/* 2. Trip Type Indicator (Outstation Round Trip) */}
          <div>
            <label className="block text-xs font-bold text-m3-on-surface mb-1">
              Trip Type:
            </label>
            <div className="flex items-center justify-between p-2.5 bg-m3-surface-container rounded-m3-xl border border-m3-outline-variant/60 text-xs">
              <span className="font-bold text-m3-primary flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Round Trip (இரு வழி)</span>
              </span>
              <span className="text-[11px] font-semibold text-m3-on-surface-variant bg-white px-2 py-0.5 rounded-full border border-slate-200">
                Min 250 km/day
              </span>
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
                    onClick={() => handlePinClick('pickup')}
                    className="w-7 h-7 flex items-center justify-center rounded-m3-sm hover:bg-m3-surface-container text-m3-primary hover:bg-m3-primary/10 transition-colors cursor-pointer"
                    title="Pinpoint pickup on map"
                    aria-label="Pinpoint pickup on map"
                  >
                    <MapPin className="w-3.5 h-3.5 text-m3-primary" />
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
              {distance && (
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
                className="w-full bg-transparent py-2.5 pl-3 pr-16 text-xs sm:text-sm font-semibold text-m3-on-surface placeholder:text-m3-on-surface-variant/60 outline-none"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {drop && (
                  <button
                    type="button"
                    onClick={() => {
                      setDrop('');
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
                  onClick={() => handlePinClick('drop')}
                  className="w-7 h-7 flex items-center justify-center rounded-m3-sm hover:bg-m3-surface-container text-m3-primary hover:bg-m3-primary/10 transition-colors cursor-pointer"
                  title="Pinpoint destination on map"
                  aria-label="Pinpoint destination on map"
                >
                  <MapPin className="w-3.5 h-3.5 text-m3-primary" />
                </button>
              </div>
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
                  min={getMinDateTime()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDate(val);
                    if (val && tripType === 'round') {
                      const minReturn = getMinReturnDateTime(val, tripReq.minRealisticHours);
                      if (returnDate && returnDate < minReturn) {
                        setReturnDate(minReturn);
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
                      {returnDate ? `${days} ${days > 1 ? 'Days' : 'Day'}` : 'Select'}
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

            {/* Realistic Travel Advisory */}
            {scheduleAdvisory && (
              <div className="p-2.5 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant/60 text-m3-on-surface text-[11px] leading-relaxed flex items-start gap-2 animate-in fade-in">
                <Info className="w-4 h-4 text-m3-on-surface-variant shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold">Realistic Travel Advisory:</strong> {scheduleAdvisory}
                </span>
              </div>
            )}
          </div>

          {/* Calculate Button (If distance is not yet resolved) */}
          {!distance && (
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
              
              {/* Short City Trip Alert & Alternative Suggestion (Only for genuine intra-city rides) */}
              {(() => {
                const isOutstationKw = (txt) => {
                  if (!txt) return false;
                  const l = txt.toLowerCase();
                  return ['mahabalipuram', 'mamallapuram', 'pondicherry', 'puducherry', 'tirupati', 'kanchipuram', 'chengalpattu', 'sriperumbudur', 'vellore', 'tiruvallur', 'thiruvallur', 'arakkonam', 'thiruthani', 'gummidipoondi', 'sri city'].some(k => l.includes(k));
                };
                const isHwy = isOutstationKw(drop) || isOutstationKw(pickup) || effDist >= 45;
                const isMahabs = /mahabalipuram|mamallapuram/i.test(drop || '') || /mahabalipuram|mamallapuram/i.test(pickup || '');

                if (isMahabs && tripType === 'round') {
                  return (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-800 font-bold mt-0.5">
                          🏛️
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-blue-950 text-xs sm:text-sm">
                            Mahabalipuram 1-Day ECR Tour Package Available
                          </div>
                          <p className="text-blue-900/90 mt-0.5 leading-relaxed text-[11.5px]">
                            Visiting Shore Temple, Five Rathas &amp; Kovalam Beach? Book our dedicated <strong>8-Hr / 120-Km Day Tour package</strong> starting from ₹3,500 (Sedan) / ₹4,500 (Ertiga) with flexible photo stops!
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-blue-200/80 flex-wrap">
                        <span className="text-[11px] font-semibold text-blue-950">
                          Fixed Day Tour • 8 Hours / 120 Km
                        </span>
                        <a
                          href="/services/mahabalipuram-ecr-temple-route/"
                          className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <span>View Mahabalipuram Tour</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                }

                if (tripType === 'round' && (effDist * 2) <= 120 && !isHwy) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-300/80 rounded-xl space-y-2 text-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-800 font-bold mt-0.5">
                          💡
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-amber-950 text-xs sm:text-sm">
                            Short City Route Detected (~{(effDist * 2).toFixed(0)} km Round Trip)
                          </div>
                          <p className="text-amber-900/90 mt-0.5 leading-relaxed text-[11.5px]">
                            Outstation round trips carry a mandatory 250 km/day interstate minimum (₹{estimate.toLocaleString('en-IN')}). For city travel &amp; round trips within Chennai, our <strong>Local City Packages</strong> (e.g. 5 Hrs / 50 Km at ₹1,500 or 8 Hrs / 80 Km at ₹2,200) are much more economical!
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/80 flex-wrap">
                        <span className="text-[11px] font-semibold text-amber-950">
                          Save up to ₹{Math.max(0, estimate - 2200).toLocaleString('en-IN')} with our Local Hourly Rental!
                        </span>
                        <a
                          href="/#booking"
                          onClick={() => onClose()}
                          className="px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <span>View Local Packages</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Fare Result Card — Savaari Clean Standard */}
              <div className="border border-slate-200 rounded-m3-xl p-3.5 sm:p-4 bg-slate-100 shadow-xs text-xs sm:text-sm space-y-3">
                {/* Header: Vehicle & Total Fare */}
                <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-200">
                  <div>
                    <span className="font-extrabold text-sm sm:text-base text-m3-on-surface">{vehicle.name}</span>
                    <div className="text-xs text-m3-on-surface-variant font-medium mt-0.5">
                      ~{(distance * (tripType === 'round' ? 2 : 1)).toFixed(0)} km {tripType === 'round' ? 'Round Trip' : 'Drop'}{tripReq.drivingText ? ` · ${tripReq.drivingText}` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-m3-on-surface-variant font-medium">Total Fare</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface font-heading leading-tight">
                      ₹{estimate.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                      + Tolls &amp; parking extra (as per actual receipts)
                    </div>
                  </div>
                </div>

                {/* 1-Line Payment Reassurance */}
                <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Pay 50% on cab arrival, balance after trip ends</span>
                </div>

                {/* Expandable Complete Fare Breakup */}
                <div className="pt-1 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <span>View Complete Fare Breakup &amp; Inclusions</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showBreakdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showBreakdown && (
                    <div className="pt-2 pb-1 space-y-2 text-xs border-t border-slate-200/60 animate-in fade-in duration-150">
                      <div className="space-y-1.5 text-m3-on-surface-variant">
                        <div className="flex justify-between items-center py-0.5">
                          <span>Cab Hire ({breakdown?.chargeable_km && breakdown?.rate_per_km ? `${breakdown.chargeable_km} km @ ₹${breakdown.rate_per_km}/km` : vehicle.name}):</span>
                          <span className="font-bold text-m3-on-surface">₹{(breakdown?.km_cost || estimate).toLocaleString('en-IN')}</span>
                        </div>
                        {breakdown?.driver_bata > 0 && (
                          <div className="flex justify-between items-center py-0.5">
                            <span>Driver Allowance ({days} {days > 1 ? 'Days' : 'Day'}):</span>
                            <span className="font-bold text-m3-on-surface">₹{breakdown.driver_bata.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {breakdown?.state_permit_est > 0 && (
                          <div className="flex justify-between items-center py-0.5">
                            <span>State Entry Permit:</span>
                            <span className="font-bold text-m3-on-surface">
                              ₹{breakdown.state_permit_est.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-0.5">
                          <span>Highway Tolls:</span>
                          <span className="font-bold text-m3-on-surface">(Pay at actuals) Extra</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                          <span>Parking Charges:</span>
                          <span className="font-bold text-m3-on-surface">(Pay at actuals) Extra</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-dashed border-slate-200 text-xs text-m3-on-surface-variant space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>100% Fuel, Chauffeur & AC Included. Zero garage charges.</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>1 Day = Up to 24 hrs / 250 km. Duration or km beyond package is billed extra.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Action Buttons (WhatsApp Book & Call Now) */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
                <WhatsAppButton
                  onClick={handleWhatsApp}
                  variant="filled"
                  size="md"
                  data-direct-whatsapp="true"
                  className="flex-1 px-4 py-3 min-h-[46px] text-xs sm:text-sm font-bold shadow-m3-1 justify-center active:scale-[0.99]"
                  text="Book on WhatsApp"
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

              <p className="text-center text-[10.5px] text-m3-on-surface-variant/90 font-medium pt-0.5">
                ✓ Rate locked for 24 hours ({bookingId})
              </p>
            </div>
          )}

        </div>
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
