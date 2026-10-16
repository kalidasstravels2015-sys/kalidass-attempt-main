import React, { useState, useEffect, useRef } from 'react';
import { Car, LocateFixed, Calendar, Calculator, Send, ArrowRight, Repeat, Users, User, AlertCircle, Navigation, ShieldCheck, Clock, X, ChevronDown, ChevronRight, CheckCircle2, Plane, ArrowUpDown, MapPin, Phone, Receipt, Edit2 } from 'lucide-react';
import { trackEvent, trackCalculatorQuote, markQuoteConverted } from '../lib/analytics';
import LocationPicker from './LocationPicker';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import siteContent from '../data/siteContent.json';

import tariffConfig from '../data/tariff_config.json';
import tnBusFares from '../data/tnBusFares.json';
import tripsData from '../data/trips.json';

const vehicles = tariffConfig.vehicles;
const vehicleOptions = Object.keys(vehicles);

// ─── Passenger ↔ Vehicle capacity rules ───────────────────────────────────
// max passengers (excluding driver) each vehicle can carry
const VEHICLE_CAPACITY = {
  'Swift Dzire':     4,
  'Toyota Etios':    4,
  'Maruti Ertiga':   6,
  'Innova':          6,
  'Innova Crysta':   7,
  'Tempo Traveller': 12,
};

// Multi-cab comparison options inspired by Savaari/Uber for 1-tap route comparisons
const COMPARISON_VEHICLES = [
  {
    key: 'Swift Dzire',
    name: 'Sedan',
    models: 'Dzire / Etios',
    pax: '4 Pax',
    maxPax: 4,
    bags: '2 Bags',
    tag: 'Best Value'
  },
  {
    key: 'Maruti Ertiga',
    name: 'Ertiga',
    models: 'Ertiga AC',
    pax: '6 Pax',
    maxPax: 6,
    bags: '3 Bags',
    tag: 'Most Popular'
  },
  {
    key: 'Innova Crysta',
    name: 'Innova',
    models: 'Innova Crysta',
    pax: '7 Pax',
    maxPax: 7,
    bags: '4 Bags',
    tag: 'Premium'
  },
  {
    key: 'Tempo Traveller',
    name: 'Tempo',
    models: 'Tempo 12-Seater',
    pax: '12 Pax',
    maxPax: 12,
    bags: '8 Bags',
    tag: 'Group'
  }
];

// Individual Passenger Options (1 Passenger, 2 Passengers, etc.)
const PASSENGER_OPTIONS = [
  { value: '1', label: '1 Passenger' },
  { value: '2', label: '2 Passengers' },
  { value: '3', label: '3 Passengers' },
  { value: '4', label: '4 Passengers (Sedan)' },
  { value: '5', label: '5 Passengers' },
  { value: '6', label: '6 Passengers (Ertiga)' },
  { value: '7', label: '7 Passengers (Innova)' },
  { value: '8', label: '8 Passengers' },
  { value: '9', label: '9 Passengers' },
  { value: '10', label: '10 Passengers' },
  { value: '11', label: '11 Passengers' },
  { value: '12', label: '12 Passengers (Tempo)' },
  { value: '13', label: '13+ Passengers' }
];

// Tab configuration: Round Trip, One Way, and Local Package
const TAB_CONFIG = {
  round: {
    titleEn: 'Round Trip',
    titleTa: 'இரு வழி',
    subEn: 'Return With Same Cab',
    subTa: 'அதே வண்டியில் திரும்புதல்',
  },
  oneway: {
    titleEn: 'One Way',
    titleTa: 'ஒரு வழி',
    subEn: 'Point to Point Drop',
    subTa: 'ஒரு வழி பயணம்',
  },
  local: {
    titleEn: 'Local Package',
    titleTa: 'லோக்கல் பேக்கேஜ்',
    subEn: 'Hourly Rental',
    subTa: 'மணிநேர வாடகை',
  }
};

// Default departure time (tomorrow 6:00 AM)
const getDefaultDepartureTime = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(6, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Default return time (tomorrow 9:00 PM for standard same-day return = 1 day)
const getDefaultReturnTime = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(21, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Calculate calendar billing days from pickup and return strings (Tamil Nadu commercial taxi standard)
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
    // Average South India highway speed ~52 km/h accounting for tolls & city transit
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

  // Round Trip Commercial Driving Rules:
  // Same-day return is feasible ONLY IF round trip <= 380 km AND driving <= 9.5 hrs.
  // Beyond that, highway fatigue and commercial safety require 2+ calendar days.
  const isSameDayFeasible = totalDrivingHours <= 9.5 && totalKm <= 380;

  // Minimum calendar days:
  let minDays = 1;
  if (totalKm > 1000 || totalDrivingHours > 20) {
    minDays = 3; // e.g. Kanyakumari (1,416 km), Munnar (1,160 km), Ooty (1,110 km)
  } else if (!isSameDayFeasible || totalKm > 360 || totalDrivingHours > 9.5) {
    minDays = 2; // e.g. Madurai (924 km), Trichy (664 km), Coimbatore (1,010 km), Bangalore (692 km)
  } else {
    minDays = 1; // e.g. Pondicherry (302 km), Tirupati (270 km), Vellore (274 km), Kanchipuram (150 km)
  }

  // Realistic hours window: driving time + essential halts/visit buffer (min 3-10 hrs)
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


// South India distance lookup table for fast reliable fallback
const COMMON_DISTANCES_FROM_CHENNAI = {
  'chennai': 0,
  'pondicherry': 151,
  'puducherry': 151,
  'bangalore': 346,
  'bengaluru': 346,
  'tirupati': 135,
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

// Comprehensive Chennai localities & transit hubs for resilient local fallback
const CHENNAI_FORMS = [
  'chennai', 'airport', 'tambaram', 'guindy', 'koyambedu', 'egmore', 'central',
  'pallavaram', 'velachery', 'porur', 'annanagar', 'anna nagar', 't nagar', 't. nagar',
  'sholinganallur', 'omr', 'ecr', 'perungudi', 'thiruvanmiyur', 'adyar', 'mylapore',
  'chromepet', 'medavakkam', 'madipakkam', 'alandur', 'vadapalani', 'ambattur', 'avadi',
  'poonamallee', 'kolathur', 'redhills', 'kilpauk', 'nungambakkam', 'triplicane', 'royapettah'
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

// Intelligent estimation of road tolls, interstate border permits, and driver night stay
const estimateRoadExtras = (pickup, drop, distanceKm, days, isRoundTrip) => {
  const p = (pickup || '').toLowerCase();
  const d = (drop || '').toLowerCase();
  const text = `${p} ${d}`;
  const totalKm = isRoundTrip ? (distanceKm || 0) * 2 : (distanceKm || 0);
  const nights = isRoundTrip ? Math.max(0, (days || 1) - 1) : 0;
  
  let stateName = 'Tamil Nadu';
  let statePermitEst = 0;
  let tollsEst = 0;

  // Detect interstate routes
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
    statePermitEst = 0; // No border tax for Puducherry commercial cabs from TN
    tollsEst = isRoundTrip ? 250 : 130;
  } else if (text.includes('kerala') || text.includes('munnar') || text.includes('cochin') || text.includes('kochi') || text.includes('sabarimala') || text.includes('wayanad')) {
    stateName = 'Kerala';
    statePermitEst = 800;
    tollsEst = isRoundTrip ? 650 : 350;
  } else {
    // Within Tamil Nadu (Madurai, Trichy, Coimbatore, Salem, Ooty, Kodaikanal, etc.)
    stateName = 'Tamil Nadu';
    statePermitEst = 0;
    tollsEst = Math.round((totalKm * 0.85) / 10) * 10;
    if (tollsEst < 80 && totalKm >= 50) tollsEst = 80;
  }

  // Driver Night Stay Allowance (~₹450/night for driver room/dinner, waived if guest provides room)
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

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Remove potential XSS characters while keeping normal address characters
  return input.replace(/[<>"'`]/g, "").trim().slice(0, 100);
};

const ERROR_MSGS = {
  active: { en: "Too many attempts. Try again later.", ta: "அதிக முயற்சிகள். பின்னர் முயற்சிக்கவும்." },
  name: { en: "Name: 2-50 letters only", ta: "பெயர்: 2-50 எழுத்துக்கள் மட்டும்" },
  phone: { en: "Invalid Indian mobile number", ta: "தவறான மொபைல் எண்" },
  locations: { en: "Enter valid pickup & drop locations", ta: "சரியான இடங்களை உள்ளிடவும்" },
  date: { en: "Date must be in future", ta: "தேதி எதிர்காலத்தில் இருக்க வேண்டும்" },
};



/**
 * @param {Object} props
 * @param {string} [props.currentLang]
 * @param {boolean} [props.showAirportTab]
 * @param {boolean} [props.showBookingButton]
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @param {any} [props.headerIcon]
 * @param {string} [props.variant]
 * @param {string} [props.initialTab]
 * @param {any} [props.allowedTabs]
 * @param {string} [props.initialPickup]
 * @param {string} [props.initialDrop]
 * @param {boolean} [props.autoCalculate]
 */
export default function QuotationEngine({ 
  currentLang = 'en', 
  showAirportTab = true, 
  showBookingButton = true, 
  title = '', 
  subtitle = '',
  headerIcon = null,
  variant = "default",
  initialTab = 'round',
  allowedTabs = null,
  initialPickup = '',
  initialDrop = '',
  autoCalculate = false
}) {
  const isTa = currentLang === 'ta';
  const labels = siteContent.ui_labels;
  const displayTitle = title || (isTa ? labels.book_your_ride_ta : labels.book_your_ride);

  const { scrollInputAboveKeyboard } = useVirtualKeyboard();

  const [activeTab, setActiveTab] = useState(initialTab || 'round');
  const [localPackage, setLocalPackage] = useState('8hr80km');
  const [vehicle, setVehicle] = useState('Swift Dzire');
  const [passengers, setPassengers] = useState('4');
  const [pickup, setPickup] = useState(() => initialPickup || '');
  const [drop, setDrop] = useState(() => initialDrop || (initialTab === 'local' ? 'Local Sightseeing (Chennai City)' : ''));
  
  const destLower = (drop || initialDrop || '').toLowerCase();
  const origLower = (pickup || initialPickup || '').toLowerCase();
  const isTirupatiTrip = destLower.includes('tirupati') || destLower.includes('tirumala') || origLower.includes('tirupati') || origLower.includes('tirumala');
  const isAuto = Boolean(autoCalculate || isTirupatiTrip);

  const [distance, setDistance] = useState(() => {
    if (initialPickup && initialDrop) {
      const known = findKnownDistance(initialPickup, initialDrop);
      if (known) return known.distance;
      const dL = initialDrop.toLowerCase();
      const pL = initialPickup.toLowerCase();
      if (dL.includes('tirupati') || pL.includes('tirupati') || dL.includes('tirumala') || pL.includes('tirumala')) return 135;
    }
    if (autoCalculate) return 135;
    return null;
  });
  const [duration, setDuration] = useState(() => {
    if (initialPickup && initialDrop) {
      const known = findKnownDistance(initialPickup, initialDrop);
      if (known) return known.duration;
      const dL = initialDrop.toLowerCase();
      const pL = initialPickup.toLowerCase();
      if (dL.includes('tirupati') || pL.includes('tirupati') || dL.includes('tirumala') || pL.includes('tirumala')) return '3.5 - 4 hrs';
    }
    if (autoCalculate) return '3.5 - 4 hrs';
    return null;
  });
  const [estimate, setEstimate] = useState(0);

  const visibleTabs = allowedTabs && allowedTabs.length > 0
    ? allowedTabs
    : ['oneway', 'round', 'local'].filter(tab => tab !== 'local' || showAirportTab);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(1);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  const [showFullBreakdown, setShowFullBreakdown] = useState(false);

  // Customer Details & Validation
  const [date, setDate] = useState(() => getDefaultDepartureTime());
  const [returnDate, setReturnDate] = useState(() => getDefaultReturnTime());
  const [showResult, setShowResult] = useState(() => {
    return Boolean(autoCalculate || (initialPickup && initialDrop));
  });
  const [errors, setErrors] = useState({});
  const [botField, setBotField] = useState(''); // Honeypot
  const [gettingLocation, setGettingLocation] = useState(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [pickerField, setPickerField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [requestedDriver, setRequestedDriver] = useState('');
  const stableFormId = "booking-form-v1"; // Using stable ID for hydration safety
  const hasCalculatedResult = Boolean(showResult && estimate > 0 && pickup && (drop || activeTab === 'local'));

  const effDist = distance || (isTirupatiTrip ? 135 : 0);
  const tripReq = getTripDrivingRequirements(effDist, activeTab === 'round', duration);

  // Compute Schedule Advisory for driver safety
  let scheduleAdvisory = null;
  if (activeTab === 'round' && distance && date && returnDate) {
    const diffHours = (new Date(returnDate) - new Date(date)) / (1000 * 60 * 60);
    const roundKm = (distance * 2).toFixed(0);
    if (diffHours < tripReq.totalDrivingHours) {
      scheduleAdvisory = isTa
        ? `சுற்றுப்பயணம் ~${roundKm} கிமீ (~${Math.round(tripReq.totalDrivingHours)} மணிநேர நெடுஞ்சாலைப் பயணம்). நீங்கள் தேர்ந்தெடுத்த பயண நேரம் (${Math.max(1, Math.round(diffHours))} மணி) போதுமானதாக இல்லை. குறைந்தபட்சம் ${tripReq.minDays} நாட்கள் தேவை.`
        : `Round trip covers ~${roundKm} km (~${Math.round(tripReq.totalDrivingHours)} hrs highway driving). Selected schedule window (${Math.max(1, Math.round(diffHours))} hrs) is less than round-trip driving time. Minimum ${tripReq.minDays} calendar days required for highway safety.`;
    } else if (!tripReq.isSameDayFeasible && days === 1) {
      scheduleAdvisory = isTa
        ? `சுற்றுப்பயணம் ~${roundKm} கிமீ. ஓட்டுநர் பாதுகாப்பு விதிகளின்படி ஒரே நாளில் திரும்ப முடியாது. குறைந்தபட்சம் ${tripReq.minDays} நாட்கள் தேவை.`
        : `Round trip covers ~${roundKm} km (~${Math.round(tripReq.totalDrivingHours)} hrs driving). Same-day return is not feasible for highway safety. Minimum ${tripReq.minDays} calendar days applies.`;
    }
  }

  // Auto-sync days count from Pickup & Return dates for round trips with minDays enforcement
  useEffect(() => {
    if (activeTab === 'round') {
      const computed = calculateCalendarDays(date, returnDate);
      setDays(Math.max(tripReq.minDays, computed));
    } else {
      setDays(1);
    }
  }, [activeTab, date, returnDate, distance, duration, tripReq.minDays]);

  const handlePickupDateChange = (val) => {
    setDate(val);
    if (!val) return;
    if (activeTab === 'round') {
      const minDaysToAdd = Math.max(1, tripReq.minDays) - 1;
      const p = new Date(val);
      const targetReturn = new Date(p);
      targetReturn.setDate(targetReturn.getDate() + minDaysToAdd);
      targetReturn.setHours(21, 0, 0, 0);

      if (!returnDate || new Date(returnDate) < targetReturn) {
        const year = targetReturn.getFullYear();
        const month = String(targetReturn.getMonth() + 1).padStart(2, '0');
        const day = String(targetReturn.getDate()).padStart(2, '0');
        setReturnDate(`${year}-${month}-${day}T21:00`);
      }
    }
  };

  const handleReturnDateChange = (val) => {
    setReturnDate(val);
  };

  const handlePassengerChange = (newVal) => {
    setPassengers(newVal);
    const pCount = parseInt(newVal, 10);
    const currentCapacity = VEHICLE_CAPACITY[vehicle] ?? 4;
    if (currentCapacity < pCount) {
      const nextVeh = vehicleOptions.find(v => (VEHICLE_CAPACITY[v] ?? 0) >= pCount);
      if (nextVeh) setVehicle(nextVeh);
    }
  };


  // Dedicated helper to ensure the entire result card and Book button are visible in viewport
  const scrollToResult = () => {
    setTimeout(() => {
      if (!resultRef.current || typeof window === 'undefined') return;
      const rect = resultRef.current.getBoundingClientRect();
      const targetY = window.pageYOffset + rect.bottom - window.innerHeight + 36;
      if (rect.bottom > window.innerHeight - 20 || rect.top < 20) {
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      }
    }, 120);
  };

  // Savaari-style 1-tap location swap
  const handleSwapLocations = () => {
    const currentPickup = pickup;
    const currentDrop = drop;
    setPickup(currentDrop);
    setDrop(currentPickup);
    pickupValueRef.current = currentDrop;
    dropValueRef.current = currentPickup;
    setShowResult(false);
    if (currentPickup && currentDrop) {
      calculateDistance(currentDrop, currentPickup);
    }
    trackEvent('locations_swapped', { pickup: currentDrop, drop: currentPickup });
  };

  // Calculate fare across multiple vehicles for instant side-by-side comparison
  const getEstimatedFareFor = (vehKey) => {
    const vData = vehicles[vehKey];
    if (!vData) return 0;
    if (activeTab === 'local') {
      const pkgCost = (
        localPackage === '5hr50km' ? vData.local_5hr_pkg
        : localPackage === '8hr80km' ? vData.local_8hr_pkg
        : vData.local_12hr_pkg
      ) || 2000;
      return pkgCost;
    }
    const destLower = (drop || '').toLowerCase();
    const origLower = (pickup || '').toLowerCase();
    const isTirupatiTrip = destLower.includes('tirupati') || destLower.includes('tirumala') || origLower.includes('tirupati') || origLower.includes('tirumala');
    if (activeTab === 'round' && isTirupatiTrip) {
      const tirupatiRates = {
        'Swift Dzire':     { 1: 6000, 2: 9500, 3: 13200, extra: 3500 },
        'Toyota Etios':    { 1: 6000, 2: 9500, 3: 13200, extra: 3500 },
        'Maruti Ertiga':   { 1: 7500, 2: 11500, 3: 15800, extra: 4300 },
        'Innova':          { 1: 8500, 2: 12500, 3: 17500, extra: 5000 },
        'Innova Crysta':   { 1: 10000, 2: 16000, 3: 22500, extra: 6500 },
        'Tempo Traveller': { 1: 12500, 2: 19500, 3: 27000, extra: 7500 },
      };
      const vRates = tirupatiRates[vehKey] || tirupatiRates['Swift Dzire'];
      const tripDays = Math.max(1, days || 1);
      return tripDays === 1 ? vRates[1] 
           : tripDays === 2 ? vRates[2] 
           : tripDays === 3 ? vRates[3] 
           : vRates[3] + (tripDays - 3) * vRates.extra;
    }
    if (!distance) return 0;
    const rate = activeTab === 'round' ? vData.round_trip_rate : vData.one_way_rate;
    const bata = vData.driver_bata;
    if (activeTab === 'round') {
      const minKm = (days || 1) * vData.min_km_per_day;
      const actualRoundTripKm = distance * 2;
      const chargeableKm = Math.max(minKm, actualRoundTripKm);
      return Math.round((chargeableKm * rate + (days || 1) * bata) / 10) * 10;
    } else {
      const isOutstationDrop = distance >= 50;
      if (isOutstationDrop) {
        const minDropKm = vData.min_drop_km || 130;
        const chargeableKm = Math.max(minDropKm, distance);
        return Math.round((chargeableKm * rate + bata) / 10) * 10;
      } else {
        return Math.round((distance * rate) / 10) * 10;
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    // Eagerly load Google Maps Places for autocomplete and distance calculations
    loadGoogleMaps().catch(() => {});
    // Read ?driver= param set by the driver profile "Book" button
    const params = new URLSearchParams(window.location.search);
    const driver = params.get('driver');
    if (driver) setRequestedDriver(decodeURIComponent(driver));
  }, []);

  // Analytics Hooks
  useEffect(() => {
    trackEvent('booking_component_viewed', { variant });
  }, []);

  useEffect(() => {
    trackEvent('trip_type_selected', { trip_type: activeTab });
  }, [activeTab]);

  useEffect(() => {
    if (estimate > 0 && showResult) {
      trackEvent('estimate_calculated', { vehicle, trip_type: activeTab, estimate, distance });
      trackCalculatorQuote({
        calculatorId: activeTab === 'local' ? 'local_rental' : 'outstation_cab',
        calculatorEngine: activeTab === 'local' ? 'Local Rental Package' : 'Outstation Cab Estimator',
        tripType: activeTab === 'local' ? `Local Package (${localPackage})` : activeTab === 'round' ? 'Round Trip' : 'One Way',
        pickup: pickup || 'Chennai',
        drop: drop || (activeTab === 'local' ? 'Chennai Local Tour' : 'N/A'),
        vehicle,
        distanceKm: distance ? Number(distance.toFixed(1)) : (activeTab === 'local' ? localPackage : ''),
        estimatedFare: estimate,
        meta: {
          days: activeTab === 'round' ? days : 1,
          travelDate: date || '',
          localPackage: activeTab === 'local' ? localPackage : undefined,
        }
      });
    }
  }, [estimate, showResult, vehicle, activeTab]);


  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const pickupValueRef = useRef(initialPickup || '');
  const dropValueRef = useRef(initialDrop || (initialTab === 'local' ? 'Local Sightseeing (Chennai City)' : ''));
  const autocompleteInitializedRef = useRef(false);
  const resultRef = useRef(null);
  const isFirstPaxMountRef = useRef(true);

  // Synchronize location refs
  useEffect(() => {
    pickupValueRef.current = pickup;
  }, [pickup]);

  useEffect(() => {
    dropValueRef.current = drop;
  }, [drop]);

  // Rate Limiter
  const checkRateLimit = () => {
    try {
      const attempts = JSON.parse(localStorage.getItem('booking_attempts') || '[]');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const recent = attempts.filter(time => now - time < oneHour);

      if (recent.length >= 25) {
        setErrors(prev => ({ ...prev, global: ERROR_MSGS.active.en }));
        return false;
      }

      recent.push(now);
      localStorage.setItem('booking_attempts', JSON.stringify(recent));
      return true;
    } catch (e) {
      return true; // Fallback if local storage fails
    }
  };

  // Validation Logic
  const validateField = (field, value) => {
    let error = null;
    const sanitized = sanitizeInput(value);

    switch (field) {

      case 'date':
        if (value && new Date(value) < new Date()) {
          error = ERROR_MSGS.date.en;
        }
        break;
      case 'location':
        // Alphanumeric, comma, space, hyphen, dot, slash, parentheses, ampersand, apostrophe
        if (sanitized.length > 0 && !/^[a-zA-Z0-9\s,.\-/#&'()+@]+$/.test(sanitized)) {
          error = "Invalid characters in location";
        }
        break;
    }
    return error;
  };

  const activeValidate = (field, value) => {
    const error = validateField(field, value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[field] = error;
      else delete newErrors[field];
      return newErrors;
    });
    return !error;
  };

  // Handle passengers change — auto-upgrade vehicle if current one is too small
  useEffect(() => {
    if (isFirstPaxMountRef.current) {
      isFirstPaxMountRef.current = false;
      return;
    }
    const pax = parseInt(passengers);
    const currentCapacity = VEHICLE_CAPACITY[vehicle] ?? 4;
    if (currentCapacity < pax) {
      // Pick the smallest vehicle that fits the group
      const nextVehicle = vehicleOptions.find(v => (VEHICLE_CAPACITY[v] ?? 0) >= pax);
      if (nextVehicle) setVehicle(nextVehicle);
    }
    if (!isAuto) {
      setShowResult(false);
    }
  }, [passengers]);

  // Google Maps Autocomplete initialized once
  useEffect(() => {
    let checkTimer = null;
    const initAutocomplete = () => {
      if (autocompleteInitializedRef.current) return;
      if (!window.google || !window.google.maps || !window.google.maps.places) return;

      const options = {
        componentRestrictions: { country: 'in' },
        fields: ['place_id', 'geometry', 'name', 'formatted_address'],
      };

      if (pickupInputRef.current) {
        const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, options);
        pickupAutocomplete.addListener('place_changed', () => {
          const place = pickupAutocomplete.getPlace();
          const addr = place.formatted_address || place.name;
          if (addr) {
            const sanitized = sanitizeInput(addr);
            setPickup(sanitized);
            pickupValueRef.current = sanitized;
            setDistance(null);
            setShowResult(false);
            if (dropValueRef.current) {
              calculateDistance(sanitized, dropValueRef.current);
            }
          }
        });
      }

      if (dropInputRef.current) {
        const dropAutocomplete = new window.google.maps.places.Autocomplete(dropInputRef.current, options);
        dropAutocomplete.addListener('place_changed', () => {
          const place = dropAutocomplete.getPlace();
          const addr = place.formatted_address || place.name;
          if (addr) {
            const sanitized = sanitizeInput(addr);
            setDrop(sanitized);
            dropValueRef.current = sanitized;
            setDistance(null);
            setShowResult(false);
            if (pickupValueRef.current) {
              calculateDistance(pickupValueRef.current, sanitized);
            }
          }
        });
      }

      autocompleteInitializedRef.current = true;
    };

    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete();
    } else {
      window.addEventListener('google-maps-loaded', initAutocomplete);
      checkTimer = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          initAutocomplete();
          if (autocompleteInitializedRef.current && checkTimer) clearInterval(checkTimer);
        }
      }, 500);
    }

    return () => {
      window.removeEventListener('google-maps-loaded', initAutocomplete);
      if (checkTimer) clearInterval(checkTimer);
    };
  }, []);

  const applyResolvedDistance = (distKm, durStr) => {
    setDistance(distKm);
    setDuration(durStr);

    if (activeTab === 'round' && distKm) {
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
    setShowResult(true);
  };

  const resolveFallbackDistance = (o, d) => {
    const fallback = findKnownDistance(o, d);
    if (fallback) {
      applyResolvedDistance(fallback.distance, fallback.duration);
    } else {
      // Conservative estimate for outstation trip when distance API is unreachable
      const fallbackKm = activeTab === 'round' ? 250 : 130;
      applyResolvedDistance(fallbackKm, activeTab === 'round' ? 'Full Day' : '3-4 hrs (Est)');
    }
  };

  const calculateDistance = (origin, destination) => {
    const o = (origin || pickup || pickupValueRef.current || '').trim();
    const d = (destination || drop || dropValueRef.current || '').trim();
    if (!o || !d) {
      setErrors(prev => ({
        ...prev,
        global: isTa ? 'பிக்கப் மற்றும் டிராப் இடங்களை உள்ளிடவும்' : 'Please enter valid pickup & drop locations'
      }));
      return;
    }

    setLoading(true);
    setErrors(prev => {
      const next = { ...prev };
      delete next.global;
      delete next.location;
      return next;
    });

    // 1. FAST LOCAL RESOLUTION: Check known distances / Tirupati first
    const known = findKnownDistance(o, d);
    const destL = d.toLowerCase();
    const origL = o.toLowerCase();
    const isTirup = destL.includes('tirupati') || destL.includes('tirumala') || origL.includes('tirupati') || origL.includes('tirumala');

    if (known) {
      applyResolvedDistance(known.distance, known.duration);
      return;
    }

    if (isTirup) {
      applyResolvedDistance(135, '3.5 - 4 hrs (Est)');
      return;
    }

    // 2. Google Maps Distance Matrix with 2-second fallback timeout
    let resolved = false;
    const fallbackTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolveFallbackDistance(o, d);
      }
    }, 2000);

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
            if (status === 'OK' && response?.rows?.[0]?.elements?.[0]?.status === 'OK') {
              const element = response.rows[0].elements[0];
              const distValue = Math.round((element.distance.value / 1000) * 10) / 10;
              const durText = element.duration.text;
              applyResolvedDistance(distValue, durText);
              return;
            }
            resolveFallbackDistance(o, d);
          }
        );
        return;
      } catch (err) {
        console.warn('Google Maps Distance Matrix failed, using local fallback:', err);
        if (!resolved) {
          resolved = true;
          clearTimeout(fallbackTimer);
          resolveFallbackDistance(o, d);
        }
      }
    } else {
      if (!resolved) {
        resolved = true;
        clearTimeout(fallbackTimer);
        resolveFallbackDistance(o, d);
      }
    }
  };

  const handleCalculateCost = () => {
    if (activeTab === 'local') {
      setShowResult(true);
      scrollToResult();
      return;
    }

    const o = (pickup || pickupValueRef.current || '').trim();
    const d = (drop || dropValueRef.current || '').trim();

    if (!o || !d) {
      setErrors(prev => ({
        ...prev,
        global: isTa ? 'பிக்கப் மற்றும் டிராப் இடங்களை உள்ளிடவும்' : 'Please enter both Pickup and Drop locations',
        pickup: !o ? (isTa ? 'பிக்கப் இடத்தை உள்ளிடவும்' : 'Please enter pickup location') : undefined,
        drop: !d ? (isTa ? 'டிராப் இடத்தை உள்ளிடவும்' : 'Please enter drop location') : undefined,
      }));
      return;
    }

    // Eagerly trigger Google Maps if needed
    loadGoogleMaps().catch(() => {});
    calculateDistance(o, d);
    scrollToResult();
  };

  // Handle Pin Click - Opens Map Modal
  const handlePinClick = (field) => {
    loadGoogleMaps().catch(() => {});
    setPickerField(field);
    setLocationPickerOpen(true);
    trackEvent('location_map_opened', { field });
  };

  // Scroll input so the autocomplete dropdown and field stay clearly visible above the keyboard
  const handleLocationFocus = (e) => {
    loadGoogleMaps().catch(() => {});
    const inputEl = e.currentTarget;
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      scrollInputAboveKeyboard(inputEl, 240);
      // Fallback smooth center adjustment once virtual keyboard is open
      setTimeout(() => {
        if (inputEl) {
          inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
    }
  };

  // Handle Location Selection from Map Modal
  const handleLocationConfirm = (address) => {
    if (pickerField === 'pickup') {
      setPickup(sanitizeInput(address));
      if (drop) calculateDistance(address, drop);
    } else if (pickerField === 'drop') {
      setDrop(sanitizeInput(address));
      if (pickup) calculateDistance(pickup, address);
    }
    setLocationPickerOpen(false);
    trackEvent('location_pin_used', { field: pickerField, method: 'map_picker', success: true });
  };

  // Get Current Location using Geolocation API
  const getCurrentLocation = async (field) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(field);
    try {
      await loadGoogleMaps();
    } catch (_) {}

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Check if Google Maps is loaded
        if (!window.google || !window.google.maps) {
          setGettingLocation(null);
          alert('Google Maps not loaded. Please wait a moment and try again.');
          return;
        }

        // Try Geocoding first (best option)
        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };

        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            // SUCCESS - Use Geocoding result
            const address = results[0].formatted_address;

            if (field === 'pickup') {
              setPickup(sanitizeInput(address));
              if (drop) calculateDistance(address, drop);
            } else {
              setDrop(sanitizeInput(address));
              if (pickup) calculateDistance(pickup, address);
            }

            setGettingLocation(null);
            setShowResult(false);
            trackEvent('location_pin_used', { field, method: 'geocoding', success: true });

          } else {
            // FALLBACK - Use Places Nearby Search
            const map = new window.google.maps.Map(document.createElement('div'));
            const service = new window.google.maps.places.PlacesService(map);

            const request = {
              location: latlng,
              rankBy: window.google.maps.places.RankBy.DISTANCE,
              type: ['establishment', 'point_of_interest']
            };

            service.nearbySearch(request, (places, placesStatus) => {
              setGettingLocation(null);

              if (placesStatus === 'OK' && places && places.length > 0) {
                // SUCCESS - Use nearest place
                const nearestPlace = places[0];
                const placeName = nearestPlace.name;
                // Use vicinity if available for context
                const vicinity = nearestPlace.vicinity || 'Chennai';
                const placeAddress = `${placeName}, ${vicinity}`;

                if (field === 'pickup') {
                  setPickup(sanitizeInput(placeAddress));
                } else {
                  setDrop(sanitizeInput(placeAddress));
                }

                setShowResult(false);
                alert('Using nearby location. Please refine if needed.');
                trackEvent('location_pin_used', { field, method: 'places', success: true });

              } else {
                // FINAL FALLBACK - Use city name with coordinates
                const fallbackAddress = `Chennai (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

                if (field === 'pickup') {
                  setPickup(fallbackAddress);
                } else {
                  setDrop(fallbackAddress);
                }

                alert('Could not find nearby location. Using coordinates. Please enter address manually.');
                trackEvent('location_pin_used', { field, method: 'coordinates', success: false });
              }
            });
          }
        });
      },
      (error) => {
        setGettingLocation(null);
        console.error('❌ Geolocation error:', error);

        let errorMsg = 'Unable to get location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out';
            break;
        }

        alert(errorMsg);
        trackEvent('location_pin_error', { field, error: error.code });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };


  useEffect(() => {
    const vehicleData = vehicles[vehicle];
    if (!vehicleData) return;

    // 1. LOCAL PACKAGE: Flat package rate independent of distance!
    if (activeTab === 'local') {
      const pkgCost = (
        localPackage === '5hr50km' ? vehicleData.local_5hr_pkg
        : localPackage === '8hr80km' ? vehicleData.local_8hr_pkg
        : vehicleData.local_12hr_pkg
      ) || 2000;

      setEstimate(pkgCost);
      setBreakdown({
        is_local_pkg: true,
        package: localPackage,
        package_cost: pkgCost,
        driver_bata: 0,
        driver_bata_text: 'Included',
        extra_km_rate: vehicleData.extra_km_rate || 15,
        extra_hr_rate: vehicleData.extra_hr_rate || 150,
        inclusions: [
          localPackage === '5hr50km' ? '50 Km Limit' : localPackage === '8hr80km' ? '80 Km Limit' : '120 Km Limit',
          localPackage === '5hr50km' ? '5 Hours Limit' : localPackage === '8hr80km' ? '8 Hours Limit' : '12 Hours Limit',
          'AC Vehicle & Fuel Included',
          'Chauffeur Duty Included'
        ]
      });
      setShowResult(true);
      return;
    }

    // 2. OUTSTATION / POINT-TO-POINT: Round Trip & One Way
    const destLower = (drop || '').toLowerCase();
    const origLower = (pickup || '').toLowerCase();
    const isTirupatiTrip = destLower.includes('tirupati') || destLower.includes('tirumala') || origLower.includes('tirupati') || origLower.includes('tirumala');

    if ((distance || isTirupatiTrip || autoCalculate) && vehicleData) {
      const effDistance = distance || (isTirupatiTrip ? 135 : 130);
      let totalCost = 0;
      const rate = activeTab === 'round' ? vehicleData.round_trip_rate : vehicleData.one_way_rate;
      const bata = vehicleData.driver_bata;
      let breakdownObj = {};

      if (activeTab === 'round') {
        if (isTirupatiTrip) {
          // Official Kalidass Travels Chennai-Tirupati All-Inclusive Fixed Package
          const tirupatiRates = {
            'Swift Dzire':     { 1: 6000, 2: 9500, 3: 13200, extra: 3500 },
            'Toyota Etios':    { 1: 6000, 2: 9500, 3: 13200, extra: 3500 },
            'Maruti Ertiga':   { 1: 7500, 2: 11500, 3: 15800, extra: 4300 },
            'Innova':          { 1: 8500, 2: 12500, 3: 17500, extra: 5000 },
            'Innova Crysta':   { 1: 10000, 2: 16000, 3: 22500, extra: 6500 },
            'Tempo Traveller': { 1: 12500, 2: 19500, 3: 27000, extra: 7500 },
          };
          const vRates = tirupatiRates[vehicle] || tirupatiRates['Swift Dzire'];
          const tripDays = Math.max(1, days || 1);
          const pkgCost = tripDays === 1 ? vRates[1] 
                        : tripDays === 2 ? vRates[2] 
                        : tripDays === 3 ? vRates[3] 
                        : vRates[3] + (tripDays - 3) * vRates.extra;
          
          totalCost = pkgCost;
          breakdownObj = {
            base_km: tripDays * (vehicleData.min_km_per_day || 250),
            actual_km: 320,
            chargeable_km: 320,
            free_buffer_km: 0,
            rate_per_km: rate,
            km_cost: pkgCost,
            driver_bata: tripDays * bata,
            daily_bata: bata,
            days: tripDays,
            nights: Math.max(0, tripDays - 1),
            state_name: 'Andhra Pradesh',
            state_permit_est: 0,
            tolls_est: 0,
            driver_night_stay_est: 0,
            road_extras_est: 0,
            all_inclusive_est: pkgCost,
            is_city: false,
            is_tirupati_pkg: true
          };
        } else {
          const minKm = (days || 1) * vehicleData.min_km_per_day;
          const actualRoundTripKm = effDistance * 2;
          const chargeableKm = Math.max(minKm, actualRoundTripKm);
          const freeBufferKm = Math.max(0, chargeableKm - actualRoundTripKm);
          const bataTotal = (days || 1) * bata;
          const kmCost = chargeableKm * rate;
          totalCost = kmCost + bataTotal;

          const extras = estimateRoadExtras(pickup, drop, effDistance, days, true);

          breakdownObj = {
            base_km: minKm,
            actual_km: actualRoundTripKm,
            chargeable_km: chargeableKm,
            free_buffer_km: freeBufferKm,
            rate_per_km: rate,
            km_cost: kmCost,
            driver_bata: bataTotal,
            daily_bata: bata,
            days: days || 1,
            nights: extras.nights,
            state_name: extras.stateName,
            state_permit_est: extras.statePermitEst,
            tolls_est: extras.tollsEst,
            driver_night_stay_est: extras.driverNightStayEst,
            road_extras_est: extras.roadExtrasEst,
            all_inclusive_est: Math.round((totalCost + extras.roadExtrasEst) / 10) * 10,
            is_city: false
          };
        }
      } else {
        // One Way Drop Trip
        const isOutstationDrop = effDistance >= 50;
        let chargeableKm, kmCost;
        if (isOutstationDrop) {
          const minDropKm = vehicleData.min_drop_km || 130;
          chargeableKm = Math.max(minDropKm, effDistance);
          kmCost = chargeableKm * rate;
          totalCost = kmCost + bata;
          const extras = estimateRoadExtras(pickup, drop, effDistance, 1, false);

          breakdownObj = {
            base_km: minDropKm,
            actual_km: effDistance,
            chargeable_km: chargeableKm,
            free_buffer_km: Math.max(0, chargeableKm - effDistance),
            rate_per_km: rate,
            km_cost: kmCost,
            driver_bata: bata,
            daily_bata: bata,
            days: 1,
            nights: 0,
            state_name: extras.stateName,
            state_permit_est: extras.statePermitEst,
            tolls_est: extras.tollsEst,
            driver_night_stay_est: 0,
            road_extras_est: extras.roadExtrasEst,
            all_inclusive_est: Math.round((totalCost + extras.roadExtrasEst) / 10) * 10,
            is_city: false,
            is_oneway: true
          };
        } else {
          // City / Airport transfer (<50 km) — no outstation minimum, no driver bata
          chargeableKm = effDistance;
          kmCost = chargeableKm * rate;
          totalCost = kmCost;
          breakdownObj = {
            base_km: 0,
            actual_km: effDistance,
            chargeable_km: chargeableKm,
            free_buffer_km: 0,
            rate_per_km: rate,
            km_cost: kmCost,
            driver_bata: 0,
            daily_bata: 0,
            days: 1,
            nights: 0,
            state_name: 'Tamil Nadu',
            state_permit_est: 0,
            tolls_est: 0,
            driver_night_stay_est: 0,
            road_extras_est: 0,
            all_inclusive_est: Math.round(totalCost / 10) * 10,
            is_city: true,
            is_oneway: true
          };
        }
      }
      // Round to nearest 10 for cleaner pricing
      setEstimate(Math.round(totalCost / 10) * 10);
      setBreakdown(breakdownObj);
      if (isAuto || distance) {
        setShowResult(true);
      }
    } else {
      setEstimate(0);
      setBreakdown(null);
    }
  }, [distance, vehicle, activeTab, days, localPackage, pickup, drop, autoCalculate]);

  useEffect(() => {
    if (activeTab === 'local') {
      setDrop('Local Sightseeing (Chennai City)');
      if (pickup === 'Chennai International Airport (MAA)') setPickup('');
    } else if (drop === 'Local Sightseeing (Chennai City)') {
      setDrop('');
      setDistance(null);
    }
  }, [activeTab]);

  const handleWhatsApp = async () => {
    // 1. Honeypot Check
    if (botField) {
      console.warn("Bot detected");
      return;
    }

    // 2. Validate Fields per Trip Type
    const isDateValid = date ? activeValidate('date', date) : true;
    const isReturnDateValid = (activeTab === 'round' && returnDate) ? activeValidate('date', returnDate) : true;
    const isPickupValid = pickup.trim().length > 0;
    const isDropValid = activeTab === 'local' || drop.trim().length > 0;

    if (!isPickupValid || !isDropValid || !isDateValid || !isReturnDateValid) {
      setErrors(prev => ({
        ...prev,
        global: activeTab === 'local' 
          ? (isTa ? 'சென்னையில் பிக்கப் இடத்தை உள்ளிடவும்' : 'Please enter pickup location in Chennai')
          : (isTa ? 'பிக்கப் மற்றும் டிராப் இடங்களை உள்ளிடவும்' : 'Please enter both Pickup and Drop locations'),
        pickup: !isPickupValid ? (isTa ? 'பிக்கப் இடத்தை உள்ளிடவும்' : 'Please enter pickup location') : undefined,
        drop: !isDropValid ? (isTa ? 'டிராப் இடத்தை உள்ளிடவும்' : 'Please enter drop location') : undefined,
      }));
      if (!isPickupValid && pickupInputRef.current) {
        pickupInputRef.current.focus();
      } else if (!isDropValid && dropInputRef.current) {
        dropInputRef.current.focus();
      }
      trackEvent('booking_validation_error', { trip_type: activeTab });
      return;
    }

    // 3. Rate Limit
    if (!checkRateLimit()) return;

    // 4. Eager Distance Resolution if needed
    let currentDist = distance;
    let currentEst = estimate;

    if (activeTab !== 'local' && !currentDist) {
      const known = findKnownDistance(pickup, drop);
      const destL = (drop || '').toLowerCase();
      const origL = (pickup || '').toLowerCase();
      const isTirup = destL.includes('tirupati') || destL.includes('tirumala') || origL.includes('tirupati') || origL.includes('tirumala');
      currentDist = known ? known.distance : isTirup ? 135 : (activeTab === 'round' ? 250 : 130);
      setDistance(currentDist);

      const vData = vehicles[vehicle];
      if (vData) {
        const rate = activeTab === 'round' ? vData.round_trip_rate : vData.one_way_rate;
        const bata = vData.driver_bata;
        if (activeTab === 'round') {
          const minKm = (days || 1) * vData.min_km_per_day;
          const actKm = currentDist * 2;
          const chgKm = Math.max(minKm, actKm);
          currentEst = Math.round((chgKm * rate + (days || 1) * bata) / 10) * 10;
        } else {
          const minDrop = vData.min_drop_km || 130;
          const chgKm = currentDist >= 50 ? Math.max(minDrop, currentDist) : currentDist;
          const bCost = currentDist >= 50 ? bata : 0;
          currentEst = Math.round((chgKm * rate + bCost) / 10) * 10;
        }
        setEstimate(currentEst);
      }
    }

    const finalEstimate = currentEst || estimate;

    trackEvent('booking_submit_attempt', { trip_type: activeTab, vehicle, estimate: finalEstimate });
    markQuoteConverted(null, { vehicle, tripType: activeTab, estimate: finalEstimate });

    // 5. Send Data to Sheet
    const bookingData = {
      date: new Date().toLocaleString(),
      tripType: activeTab === 'local' ? `Local Package (${localPackage})` : activeTab === 'oneway' ? 'One Way Drop' : 'Round Trip',
      name: 'Not Provided',
      phone: 'Not Provided',
      pickup: sanitizeInput(pickup),
      drop: sanitizeInput(drop || 'Local Sightseeing (Chennai City)'),
      vehicle,
      passengers,
      distance: currentDist ? currentDist.toFixed(1) : (activeTab === 'local' ? localPackage : ''),
      estimate: finalEstimate,
      travelDate: date,
      returnDate: activeTab === 'round' ? returnDate : '',
      days: activeTab === 'round' ? days : 1
    };

    try {
      await fetch('https://script.google.com/macros/s/AKfycbwoEpKqa3Qg-DIvMe06pGUgGLlC_0vJQev61nzIh9ssh1-uHZ5VtYkGzpMVwhEyi7tvEQ/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(bookingData)
      });
    } catch (e) {
      console.log("Logging simplified");
    }

    // 6. Build WhatsApp Message
    const driverLine = requestedDriver ? `• Requested Driver: *${requestedDriver}*\n` : '';
    const tripTypeTitle = activeTab === 'local' 
      ? `Local Package (${localPackage === '5hr50km' ? '5 Hours / 50 Km' : localPackage === '8hr80km' ? '8 Hours / 80 Km' : '12 Hours / 120 Km'})`
      : activeTab === 'oneway' ? 'One Way Drop' : 'Round Trip';

    const breakdownDetails = breakdown?.is_tirupati_pkg ? `
• Total All-Inclusive Package Fare: ₹${finalEstimate.toLocaleString('en-IN')}
• Trip Duration: ${days} ${days > 1 ? 'Days' : 'Day'}
• Inclusions: 100% Fuel + FASTag Tolls + AP Interstate Border Permit + Tirumala Hill Climb + Driver Bata Included
• Advance to Confirm Booking: ₹500 Token Deposit
• Balance on Completion: ₹${Math.max(0, finalEstimate - 500).toLocaleString('en-IN')} (Payable to Chauffeur)
• Payment Terms: ₹500 Advance to Confirm Booking • Balance Payable After Darshan / Return.`
    : activeTab === 'local' ? `
*LOCAL PACKAGE FARE DETAILS*
• Package Fare: ₹${finalEstimate.toLocaleString('en-IN')} (Flat Package)
• Package Tier: ${localPackage === '5hr50km' ? '5 Hours / 50 Km' : localPackage === '8hr80km' ? '8 Hours / 80 Km' : '12 Hours / 120 Km'}
• Extra Charges (if exceeded): ₹${vehicles[vehicle]?.extra_km_rate || 15}/km • ₹${vehicles[vehicle]?.extra_hr_rate || 150}/hr
• Inclusions: Dedicated AC Car + Fuel + Chauffeur Duty Included
• Payment Terms: ₹0 Advance Required • Pay after trip completion.`
    : (breakdown && !breakdown.is_city) ? `
*AMOUNT & FARE BREAKDOWN*
• Base Fare: ₹${finalEstimate.toLocaleString('en-IN')} (${breakdown.chargeable_km} km @ ₹${breakdown.rate_per_km}/km + Driver Day Bata ₹${breakdown.driver_bata})
${breakdown.free_buffer_km > 0 ? `• Sightseeing Buffer: +${breakdown.free_buffer_km.toFixed(0)} km (Included at ₹0)\n` : ''}• Est. FASTag Tolls: ~₹${breakdown.tolls_est.toLocaleString('en-IN')}
${breakdown.state_permit_est > 0 ? `• Est. ${breakdown.state_name} Permit: ~₹${breakdown.state_permit_est.toLocaleString('en-IN')}\n` : ''}${breakdown.nights > 0 ? `• Driver Night Stay (${breakdown.nights} Nights): ~₹${breakdown.driver_night_stay_est.toLocaleString('en-IN')}\n` : ''}• All-Inclusive Package Est: ~₹${breakdown.all_inclusive_est.toLocaleString('en-IN')} (100% Cashless on road)
• Advance to Confirm Booking: ₹500 Token Deposit
• Balance on Completion: ₹${Math.max(0, finalEstimate - 500).toLocaleString('en-IN')} (Payable to Chauffeur)
• Payment Terms: ₹500 Advance to Confirm Booking • Balance Payable After Trip Completion.`
    : `
*AMOUNT & FARE ESTIMATE*
• Est. Cost: ₹${finalEstimate.toLocaleString('en-IN')}
• Inclusions: Fuel, Driver Bata, GST
• Payment Terms: ₹0 Advance Required • Pay after trip completion.`;

    const message = `*Kalidass Travels - Booking Request*
${driverLine}
*LOCATION & PACKAGE*
• Pickup: ${sanitizeInput(pickup)}
• Drop: ${activeTab === 'local' ? 'Local Sightseeing (Chennai City Limits)' : sanitizeInput(drop)}
${activeTab !== 'local' ? `• Distance: ${currentDist ? (activeTab === 'round' ? (currentDist * 2).toFixed(0) : currentDist.toFixed(0)) : 'N/A'} km ${activeTab === 'round' ? `(Round Trip • ${tripReq.drivingText})` : `(One-Way Drop • ${tripReq.drivingText})`}\n` : ''}
*PICKUP & SCHEDULE*
• Trip Type: ${tripTypeTitle}
• Pickup Date & Time: ${date ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not Specified'}
${activeTab === 'round' ? `• Return Date & Time: ${returnDate ? new Date(returnDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not Specified'}\n• Trip Duration: ${days} ${days > 1 ? 'Days' : 'Day'}\n` : ''}• Estimated Driving Time: ${activeTab === 'local' ? (localPackage === '5hr50km' ? '5 Hours' : localPackage === '8hr80km' ? '8 Hours' : '12 Hours') : (tripReq.drivingText || duration || 'N/A')}

*TRAVEL & VEHICLE*
• Selected Vehicle: ${vehicle}
• Passengers: ${passengers}
${breakdownDetails}

Please confirm availability and share quote.`;

    trackEvent('booking_conversion_whatsapp', {
      estimate: finalEstimate,
      trip_type: activeTab,
      vehicle
    });

    window.open(buildWhatsAppUrl(message), '_blank');
  };

  // Helper for Input Classes
  const getInputClass = (field) => {
    return `flex items-center bg-m3-surface-container-low border rounded-m3-md px-4 py-3 transition-all ${errors[field]
      ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/20'
      : 'border-m3-outline-variant focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary'
      }`;
  };

  return (
    <section 
      aria-label={isTa ? 'பயண முன்பதிவு கால்குலேட்டர்' : 'Cab Booking & Fare Estimator'}
      className="w-full max-w-2xl mx-auto bg-white rounded-m3-2xl shadow-m3-1 sm:shadow-m3-2 border border-m3-outline-variant overflow-hidden font-sans booking-engine"
    >
      {/* Hidden Honeypot */}
      <input
        type="text"
        name="website_url"
        style={{ display: 'none' }}
        value={botField}
        onChange={(e) => setBotField(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Title Header — Material 3 Standard Elevation */}
      <div className="py-3 px-4 sm:px-5 border-b border-m3-outline-variant/60 flex items-center bg-m3-surface">
        <div className="flex items-center gap-2.5 min-w-0">
          {headerIcon && (
            <div className="w-9 h-9 rounded-m3-full bg-m3-primary-container flex items-center justify-center shrink-0">
              {headerIcon === 'car' ? (
                <Car className="w-4 h-4 text-m3-primary" />
              ) : headerIcon === 'clock' ? (
                <Clock className="w-4 h-4 text-m3-primary" />
              ) : (
                headerIcon
              )}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-m3-on-surface font-heading leading-tight truncate">
              {displayTitle}
            </h2>
            <p className="text-xs text-m3-on-surface-variant mt-0.5 font-medium truncate">
              {subtitle || (activeTab === 'local' 
                ? (isTa ? 'சென்னைக்குள் வாடகை கார் • எரிபொருள் & டிரைவர் உட்பட' : 'Hourly car rental within Chennai • Fuel & Chauffeur included')
                : (isTa ? 'நிலையான வெளிப்படையான கட்டணங்கள் • சரிபார்க்கப்பட்ட ஓட்டுநர்கள் • ஜீரோ சர்ஜ்' : 'Instant transparent pricing • Verified chauffeurs • Zero surge'))}
            </p>
          </div>
        </div>
      </div>

      {requestedDriver && (
        <div className="px-4 sm:px-5 pt-2.5">
          <div className="inline-flex items-center gap-1.5 bg-m3-surface-container-high border border-m3-outline-variant rounded-m3-full px-3 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-m3-primary shrink-0" />
            <span className="text-xs font-bold text-m3-primary">Booking for: {requestedDriver}</span>
          </div>
        </div>
      )}

      {/* Tabs (Trip Type) */}
      {visibleTabs.length > 1 && (
        <div className="px-4 sm:px-5 pt-3.5 pb-1">
          <div role="tablist" aria-label={isTa ? 'பயண வகை' : 'Trip Type'} className="bg-m3-surface-container-low p-1 rounded-m3-full flex gap-1 overflow-x-auto whitespace-nowrap hide-scrollbar border border-m3-outline-variant/60">
            {visibleTabs.map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => { 
                  setActiveTab(tab); 
                  if (tab === 'local') {
                    if (pickup) setShowResult(true);
                  } else if (pickup && drop && (distance || isTirupatiTrip)) {
                    setShowResult(true);
                  } else {
                    setShowResult(false);
                  }
                }}
                className={`flex-1 py-2 px-2.5 sm:px-4 text-xs font-bold rounded-m3-full transition-all flex items-center justify-center gap-1 min-h-[38px] sm:min-h-[42px] cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B57D0] ${
                  activeTab === tab ? 'bg-white text-m3-on-surface shadow-xs border border-m3-outline-variant/70' : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                }`}
              >
                <span className="capitalize">{tab === 'local' ? (isTa ? 'லோக்கல் பேக்கேஜ்' : 'Local Package') : tab === 'oneway' ? (isTa ? 'ஒரு வழி' : 'One Way') : (isTa ? 'இரு வழி' : 'Round Trip')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Body — Material 3 Standard Spacing */}
      <div className="p-4 sm:p-5 space-y-3 sm:space-y-3.5">
        {errors.global && (
          <p role="alert" className="text-xs sm:text-sm text-m3-error bg-m3-error-container/30 border border-m3-error/30 rounded-m3-md px-3 py-2 leading-snug flex items-center gap-1.5 font-medium animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-m3-error shrink-0" />
            <span>{errors.global}</span>
          </p>
        )}

        {/* Local Package Selection */}
            {activeTab === 'local' && (
              <div className="flex justify-center pb-0.5">
                <div className="bg-m3-surface-container-high p-1 rounded-m3-lg flex text-xs font-bold w-full border border-m3-outline-variant">
                  {['5hr50km', '8hr80km', '12hr120km'].map(pkg => (
                    <button
                      key={pkg}
                      type="button"
                      onClick={() => setLocalPackage(pkg)}
                      className={`flex-1 px-2 py-2 rounded-m3-md transition-all min-h-[36px] font-bold ${localPackage === pkg ? 'bg-white text-m3-primary shadow-m3-1 border border-m3-outline-variant/60' : 'text-m3-on-surface-variant hover:text-m3-on-surface'}`}
                    >
                      {pkg === '5hr50km' ? (isTa ? '5 மணி / 50 கிமீ' : '5Hrs / 50Kms') : pkg === '8hr80km' ? (isTa ? '8 மணி / 80 கிமீ' : '8Hrs / 80Kms') : (isTa ? '12 மணி / 120 கிமீ' : '12Hrs / 120Kms')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Pickup Location Input Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={activeTab === 'local' ? 'local-pickup-input' : 'pickup-input'} className="text-xs sm:text-sm font-bold text-m3-on-surface flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
                  <span>{isTa ? 'சென்னையில் பிக்கப் இடம்' : 'Pickup Location in Chennai'}</span>
                </label>
                <span className="text-[11px] text-m3-on-surface-variant font-medium hidden sm:inline">
                  {isTa ? 'வீட்டு வாசலில் பிக்கப் சேர்க்கப்பட்டுள்ளது' : 'Doorstep Pickup Included'}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id={activeTab === 'local' ? 'local-pickup-input' : 'pickup-input'}
                  ref={pickupInputRef}
                  type="text"
                  autoComplete="street-address"
                  autoCorrect="off"
                  inputMode="text"
                  enterKeyHint="next"
                  aria-label={isTa ? 'சென்னையில் பிக்கப் இடம்' : 'Pickup Location in Chennai'}
                  value={pickup}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPickup(val);
                    pickupValueRef.current = val;
                    setDistance(null);
                    setShowResult(false);
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.global;
                      delete next.location;
                      delete next.pickup;
                      return next;
                    });
                  }}
                  onFocus={handleLocationFocus}
                  placeholder={isTa ? 'எ.கா: தி.நகர், ஏர்போர்ட், சென்ட்ரல்' : 'e.g. T. Nagar, Central, Airport, OMR'}
                  className={`w-full min-h-[48px] bg-white border rounded-m3-lg px-3.5 py-3 text-sm ${
                    errors.pickup 
                      ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/10' 
                      : 'border-m3-outline-variant hover:border-m3-outline focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20'
                  } ${pickup ? 'text-m3-on-surface font-semibold' : 'text-m3-on-surface font-normal'} placeholder:text-sm placeholder:text-m3-on-surface-variant/75 placeholder:font-normal outline-none transition-all pr-20 shadow-2xs`}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {pickup && (
                    <button
                      type="button"
                      onClick={() => {
                        setPickup('');
                        pickupValueRef.current = '';
                        setDistance(null);
                        setShowResult(false);
                      }}
                      aria-label="Clear pickup location"
                      title="Clear pickup location"
                      className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-m3-surface-container active:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => getCurrentLocation('pickup')}
                    disabled={gettingLocation === 'pickup'}
                    aria-label="Use current location"
                    title="Use current location"
                    className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-m3-md hover:bg-m3-surface-container active:scale-95 active:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-primary transition-all cursor-pointer disabled:opacity-50"
                  >
                    <LocateFixed className={`w-4 h-4 ${gettingLocation === 'pickup' ? 'animate-spin text-m3-primary' : ''}`} />
                  </button>
                </div>
              </div>
              {errors.pickup && (
                <p className="text-xs text-m3-error font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.pickup}</span>
                </p>
              )}
            </div>

            {/* 2. Drop Location Field */}
            <div className={activeTab === 'local' ? 'hidden' : 'space-y-1.5'}>
              <div className="flex items-center justify-between">
                <label htmlFor="drop-input" className="text-xs sm:text-sm font-bold text-m3-on-surface flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
                  <span>{isTa ? 'டிராப் இடம் / சேருமிடம்' : 'Drop Location / City'}</span>
                </label>
                {distance ? (
                  <span className="text-[11px] font-semibold text-m3-on-surface-variant bg-white px-2 py-0.5 rounded border border-m3-outline-variant/50">
                    ~{activeTab === 'round' ? (distance * 2).toFixed(0) : distance.toFixed(0)} km {activeTab === 'round' ? 'Round Trip' : 'One Way'} • {tripReq.drivingText}
                  </span>
                ) : (
                  <span className="text-[11px] text-m3-on-surface-variant font-medium hidden sm:inline">
                    {isTa ? 'தென்னிந்தியா முழுவதும் சேவை' : 'Anywhere in South India'}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  id="drop-input"
                  ref={dropInputRef}
                  type="text"
                  autoComplete="street-address"
                  autoCorrect="off"
                  inputMode="text"
                  enterKeyHint="next"
                  aria-label={isTa ? 'டிராப் இடம் / சேருமிடம்' : 'Drop Location / City'}
                  value={drop}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDrop(val);
                    dropValueRef.current = val;
                    setDistance(null);
                    setShowResult(false);
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.global;
                      delete next.location;
                      delete next.drop;
                      return next;
                    });
                  }}
                  onFocus={handleLocationFocus}
                  placeholder={isTa ? 'எ.கா: பாண்டிச்சேரி, பெங்களூரு, திருப்பதி' : 'e.g. Pondicherry, Bangalore, Tirupati, Vellore'}
                  className={`w-full min-h-[48px] bg-white border rounded-m3-lg px-3.5 py-3 text-sm ${
                    errors.drop 
                      ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/10' 
                      : 'border-m3-outline-variant hover:border-m3-outline focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20'
                  } ${drop ? 'text-m3-on-surface font-semibold' : 'text-m3-on-surface font-normal'} placeholder:text-sm placeholder:text-m3-on-surface-variant/75 placeholder:font-normal outline-none transition-all pr-20 shadow-2xs`}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {drop && (
                    <button
                      type="button"
                      onClick={() => {
                        setDrop('');
                        dropValueRef.current = '';
                        setDistance(null);
                        setShowResult(false);
                      }}
                      aria-label="Clear drop location"
                      title="Clear drop location"
                      className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-m3-surface-container active:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => getCurrentLocation('drop')}
                    disabled={gettingLocation === 'drop'}
                    aria-label="Use current location"
                    title="Use current location"
                    className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-m3-md hover:bg-m3-surface-container active:scale-95 active:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-primary transition-all cursor-pointer disabled:opacity-50"
                  >
                    <LocateFixed className={`w-4 h-4 ${gettingLocation === 'drop' ? 'animate-spin text-m3-primary' : ''}`} />
                  </button>
                </div>
              </div>
              {errors.drop && (
                <p className="text-xs text-m3-error font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.drop}</span>
                </p>
              )}
            </div>

            {/* Local Package Coverage Banner */}
            {activeTab === 'local' && (
              <div className="min-h-[44px] py-2.5 px-3.5 rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/60 flex items-center justify-between gap-2 text-xs text-m3-on-surface">
                <div className="flex items-center gap-2 min-w-0">
                  <Navigation className="w-3.5 h-3.5 text-m3-primary shrink-0" />
                  <span className="truncate">
                    <strong className="text-m3-on-surface font-bold">{isTa ? 'பேக்கேஜ் எல்லை:' : 'Coverage:'}</strong>{' '}
                    <span className="font-semibold text-m3-on-surface-variant">Chennai City Limits ({localPackage === '5hr50km' ? '5 Hrs / 50 Km' : localPackage === '8hr80km' ? '8 Hrs / 80 Km' : '12 Hrs / 120 Km'})</span>
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-m3-on-surface-variant bg-m3-surface-container-high px-2 py-0.5 rounded border border-m3-outline-variant/60 shrink-0">
                  City Sightseeing
                </span>
              </div>
            )}

            {/* 3. Dual Date Pickers (Twin Interactive Tile Cards) */}
            <div className="space-y-2">
              <div className={`grid ${activeTab === 'round' ? 'grid-cols-2' : 'grid-cols-1'} gap-2 sm:gap-3`}>
                {/* Pickup Date Tile */}
                <div className="group relative rounded-xl border border-m3-outline-variant bg-slate-50/70 hover:bg-slate-50 hover:border-m3-outline focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label 
                      htmlFor={`${stableFormId}-pickup-date-main`} 
                      className="text-[11px] sm:text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 cursor-pointer truncate"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                      <span className="truncate">{isTa ? 'புறப்படும் தேதி & நேரம்' : 'Pickup Date & Time'}</span>
                    </label>
                  </div>
                  <input
                    id={`${stableFormId}-pickup-date-main`}
                    type="datetime-local"
                    value={date}
                    onChange={(e) => handlePickupDateChange(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-m3-on-surface outline-none cursor-pointer p-0"
                  />
                  {activeTab === 'oneway' && distance && date && (
                    <div className="mt-1 pt-1 border-t border-m3-outline-variant/40 flex items-center justify-between text-[10px] text-m3-on-surface-variant font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#1a73e8]" />
                        <span>{isTa ? 'சேருமிடம் நேரம்:' : 'Est. Arrival:'}</span>
                      </span>
                      <span className="font-bold text-m3-on-surface">
                        {getEstimatedArrival(date, tripReq.oneWayHours)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Return Date Tile (for Round Trip) */}
                {activeTab === 'round' && (
                  <div className="group relative rounded-xl border border-m3-outline-variant bg-slate-50/70 hover:bg-slate-50 hover:border-m3-outline focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <label 
                        htmlFor={`${stableFormId}-return-date-main`} 
                        className="text-[11px] sm:text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 cursor-pointer truncate"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                        <span className="truncate">{isTa ? 'திரும்பும் தேதி' : 'Return Date'}</span>
                      </label>
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#1a73e8] bg-[#1a73e8]/10 px-1.5 py-0.5 rounded-full shrink-0">
                        {days} {days > 1 ? (isTa ? 'நாட்கள்' : 'Days') : (isTa ? 'நாள்' : 'Day')}
                      </span>
                    </div>
                    <input
                      id={`${stableFormId}-return-date-main`}
                      type="datetime-local"
                      value={returnDate}
                      min={date ? getMinReturnDateTime(date, tripReq.minRealisticHours) : date}
                      onChange={(e) => handleReturnDateChange(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-m3-on-surface outline-none cursor-pointer p-0"
                    />
                  </div>
                )}
              </div>

              {scheduleAdvisory && (
                <div className="p-2 sm:p-2.5 rounded-m3-lg bg-amber-50 border border-amber-300/80 text-[11px] sm:text-xs text-amber-900 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="font-bold">{isTa ? 'பயண நேர ஆலோசனை:' : 'Schedule Advisory:'}</strong> {scheduleAdvisory}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Passengers & Vehicle Selection Tiles */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Passenger Tile */}
              <div className="group relative rounded-xl border border-m3-outline-variant bg-slate-50/70 hover:bg-slate-50 hover:border-m3-outline focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label 
                    htmlFor={`${stableFormId}-passengers`} 
                    className="text-[11px] sm:text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 cursor-pointer truncate"
                  >
                    <Users className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                    <span className="truncate">{isTa ? 'பயணிகள்' : 'Passengers'}</span>
                  </label>
                </div>
                <div className="relative">
                  <select
                    id={`${stableFormId}-passengers`}
                    value={passengers}
                    onChange={(e) => handlePassengerChange(e.target.value)}
                    className="w-full bg-transparent appearance-none outline-none cursor-pointer pr-5 text-xs sm:text-sm font-semibold text-m3-on-surface truncate p-0"
                  >
                    {PASSENGER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} className="text-m3-on-surface font-semibold">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 shrink-0" />
                </div>
              </div>

              {/* Vehicle Model Tile */}
              <div className="group relative rounded-xl border border-m3-outline-variant bg-slate-50/70 hover:bg-slate-50 hover:border-m3-outline focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label 
                    htmlFor={`${stableFormId}-vehicle`} 
                    className="text-[11px] sm:text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 cursor-pointer truncate"
                  >
                    <Car className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                    <span className="truncate">{isTa ? 'வாகனம்' : 'Vehicle Model'}</span>
                  </label>
                </div>
                <div className="relative">
                  <select
                    id={`${stableFormId}-vehicle`}
                    value={vehicle}
                    onChange={(e) => { setVehicle(e.target.value); }}
                    className="w-full bg-transparent appearance-none outline-none cursor-pointer pr-5 text-xs sm:text-sm font-semibold text-m3-on-surface truncate p-0"
                  >
                    {vehicleOptions.map(v => {
                      const cap = VEHICLE_CAPACITY[v] ?? 4;
                      const pax = parseInt(passengers);
                      const disabled = cap < pax;
                      return (
                        <option key={v} value={v} disabled={disabled} className="text-m3-on-surface font-semibold">
                          {v} ({cap} Pax)
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 shrink-0" />
                </div>
              </div>
            </div>

            {/* PRIMARY CTA BUTTON (Compact & Centered Google Blue Button) */}
            <div className="pt-2.5 space-y-1.5 flex flex-col items-center justify-center">
              <button
                id="btn-calculate-fare"
                type="button"
                disabled={loading}
                onClick={handleCalculateCost}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[40px] bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isTa ? 'கணக்கிடுகிறது...' : 'Calculating Fare...'}</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 text-white shrink-0" />
                    <span>{isTa ? 'கட்டணம் பார்க்கவும் →' : 'View Instant Fare →'}</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-m3-on-surface-variant/80 text-center font-medium max-w-sm">
                ✓ {isTa ? 'கட்டணம் கணக்கிட தொலைபேசி எண் தேவையில்லை • வெளிப்படையான கட்டணங்கள்' : 'Instant calculation • No phone number required • Zero surge'}
              </p>
            </div>

            {/* Dynamic Fare Result & Actions Area — Rate Summary with Complete Itemized Breakdown */}
            {showResult && estimate > 0 && (
              <div ref={resultRef} className="pt-3 border-t border-m3-outline-variant/60 space-y-3 animate-in fade-in duration-200">
                
                {/* Rate Summary Card with Itemized Breakdown */}
                <div className="bg-slate-50 border border-m3-outline-variant/80 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base font-extrabold text-m3-on-surface">
                          {vehicle}
                        </span>
                        <span className="text-[10px] font-bold bg-[#1a73e8]/10 text-[#1a73e8] px-2 py-0.5 rounded-full">
                          {passengers} Pax
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Transparent Estimate
                        </span>
                      </div>
                      <p className="text-xs text-m3-on-surface-variant font-medium mt-1 leading-snug">
                        {breakdown?.is_tirupati_pkg 
                          ? (isTa ? '100% எரிபொருள் + டோல்கள் + ஆந்திரா அனுமதி வரி + திருமலை மலைப்பாதை + டிரைவர் பேட்டா உட்பட' : '100% Fuel + Tolls + AP Permit + Hill Climb + Driver Bata Included')
                          : activeTab === 'local' 
                            ? (isTa ? 'எரிபொருள் மற்றும் டிரைவர் பேட்டா உட்பட' : 'Fuel & Chauffeur Duty Included')
                            : `₹${activeTab === 'round' ? vehicles[vehicle]?.round_trip_rate : vehicles[vehicle]?.one_way_rate}/km · Fuel & Chauffeur Duty Included${breakdown?.free_buffer_km > 0 ? ` · +${breakdown.free_buffer_km.toFixed(0)} km free buffer` : ''}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface font-heading leading-tight">
                        ₹{estimate.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-m3-on-surface-variant font-semibold mt-0.5">
                        {activeTab === 'round' 
                          ? `~${(distance * 2).toFixed(0)} km Round Trip · ~${Math.round(tripReq.totalDrivingHours)} hrs driving` 
                          : activeTab === 'oneway' 
                            ? `~${distance?.toFixed(0)} km Drop · ~${Math.round(tripReq.oneWayHours)} hrs driving` 
                            : 'City Rental'}
                      </div>
                    </div>
                  </div>

                  {/* Itemized Fare Breakdown */}
                  <div className="pt-2 border-t border-m3-outline-variant/60 text-xs space-y-1.5">
                    <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                      <span>Dedicated AC Cab ({vehicle}):</span>
                      <span className="font-bold text-m3-on-surface">₹{(breakdown?.km_cost || estimate).toLocaleString('en-IN')}</span>
                    </div>
                    {breakdown?.driver_bata > 0 && (
                      <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                        <span>Chauffeur Duty &amp; Bata ({days} {days > 1 ? 'Days' : 'Day'}):</span>
                        <span className="font-bold text-m3-on-surface">₹{breakdown.driver_bata.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {breakdown?.free_buffer_km > 0 && (
                      <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                        <span>Sightseeing Buffer (+{breakdown.free_buffer_km.toFixed(0)} km):</span>
                        <span className="font-bold text-emerald-700">INCLUDED (₹0)</span>
                      </div>
                    )}
                    {breakdown?.is_tirupati_pkg && (
                      <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                        <span>Tolls, AP State Tax &amp; Tirumala Ghat:</span>
                        <span className="font-bold text-emerald-700">INCLUDED (₹0)</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1.5 border-t border-m3-outline-variant/40 font-bold text-xs sm:text-sm text-m3-on-surface">
                      <span>Net Base Fare:</span>
                      <span>₹{estimate.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Extras at Actuals (Road Expenses) */}
                    {!breakdown?.is_tirupati_pkg && activeTab !== 'local' && (
                      <div className="pt-2 border-t border-dashed border-m3-outline-variant/80 space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-amber-900 bg-amber-50/90 px-2 py-1 rounded border border-amber-200/80">
                          <span className="flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>Extras at Actuals (Paid on Route):</span>
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">
                            At Actuals
                          </span>
                        </div>
                        <div className="space-y-1 text-xs px-0.5 text-m3-on-surface-variant">
                          <div className="flex justify-between items-center py-0.5">
                            <span>• NH Highway FASTag Tolls:</span>
                            <span className="font-semibold text-m3-on-surface">
                              {breakdown?.tolls_est > 0 ? `At Actuals (~₹${breakdown.tolls_est.toLocaleString('en-IN')} est.)` : 'At Actuals (As per FASTag scan)'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-0.5">
                            <span>• Interstate Border Permit:</span>
                            <span className="font-semibold text-m3-on-surface">
                              {breakdown?.state_permit_est > 0 
                                ? `${breakdown.state_name || 'Interstate'} Checkpost (~₹${breakdown.state_permit_est.toLocaleString('en-IN')})` 
                                : 'Within Tamil Nadu: ₹0 (No Permit)'}
                            </span>
                          </div>
                          {breakdown?.nights > 0 && (
                            <div className="flex justify-between items-center py-0.5">
                              <span>• Driver Night Stay ({breakdown.nights} Night{breakdown.nights > 1 ? 's' : ''}):</span>
                              <span className="font-semibold text-m3-on-surface">~₹{breakdown.driver_night_stay_est} (Waived if lodging provided)</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center py-0.5">
                            <span>• Parking &amp; Airport Entry:</span>
                            <span className="font-semibold text-m3-on-surface">At Actuals (As per ticket)</span>
                          </div>
                        </div>

                        {breakdown?.all_inclusive_est > 0 && (
                          <div className="mt-1.5 p-2 bg-emerald-50 rounded-lg border border-emerald-200/70 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-emerald-950 block">Option B: 100% Cashless All-Inclusive</span>
                              <span className="text-[10.5px] text-emerald-800">Covers Cab, Driver Bata, FASTag Tolls &amp; State Permit</span>
                            </div>
                            <span className="text-sm font-extrabold text-emerald-900 font-heading shrink-0 ml-2">
                              ~₹{breakdown.all_inclusive_est.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-m3-outline-variant/40 text-[11px] text-m3-on-surface-variant font-medium">
                      <span>Advance to Confirm &amp; Lock Cab:</span>
                      <span className="font-bold text-emerald-700">₹500 to Confirm Booking</span>
                    </div>
                    <div className="flex justify-between items-center pt-0.5 text-[11px] text-m3-on-surface-variant">
                      <span>Balance on Completion:</span>
                      <span className="font-semibold text-m3-on-surface">
                        ₹{Math.max(0, estimate - 500).toLocaleString('en-IN')} Base Fare {!breakdown?.is_tirupati_pkg && activeTab !== 'local' ? '+ Extras at Actuals' : ''} (Payable to Chauffeur)
                      </span>
                    </div>

                    <div className="pt-2 text-right">
                      <button
                        type="button"
                        onClick={() => setShowFullBreakdown(true)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#1a73e8] hover:text-[#1557b0] hover:underline cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>{isTa ? '100% முழு விவர பாப்-அப்' : 'View Complete Itemized Breakdown Modal'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct Booking Actions */}
                <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
                  <WhatsAppButton 
                    onClick={handleWhatsApp}
                    variant="filled"
                    size="md"
                    data-direct-whatsapp="true"
                    className="flex-1 px-5 py-3.5 min-h-[46px] text-sm font-bold shadow-m3-1 justify-center active:scale-[0.99]"
                    text={isTa ? `வாட்ஸ்அப்பில் முன்பதிவு செய்ய (₹${estimate.toLocaleString('en-IN')})` : `Book ${vehicle} on WhatsApp (₹${estimate.toLocaleString('en-IN')})`}
                  />

                  <a
                    href="tel:+918939539211"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] bg-white hover:bg-slate-50 active:scale-[0.99] text-m3-on-surface font-semibold text-sm rounded-full border border-m3-outline-variant shadow-2xs transition-colors shrink-0 cursor-pointer"
                    aria-label="Call +91 89395 39211"
                  >
                    <Phone className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
                    <span>Call Desk</span>
                  </a>
                </div>

                {/* Smart Airport Quick-Access Callout */}
                {showAirportTab && (
                  <div className="pt-1">
                    <a
                      href="/services/chennai-airport-taxi/"
                      className="flex items-center justify-between p-2.5 px-3.5 bg-m3-surface-container-high hover:bg-m3-surface-container-highest border border-m3-outline-variant hover:border-m3-primary/40 rounded-m3-xl transition-all text-xs group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="p-1 sm:p-1.5 bg-m3-primary/10 text-m3-primary rounded-m3-full shrink-0 group-hover:scale-110 transition-transform">
                          <Plane className="w-3.5 h-3.5" />
                        </span>
                        <div className="truncate text-left">
                          <span className="font-bold text-m3-on-surface">
                            {isTa ? 'சென்னை ஏர்போர்ட் டாக்ஸியா?' : 'Chennai Airport Pickup / Drop?'}
                          </span>
                          <span className="hidden sm:inline text-m3-on-surface-variant ml-1.5 text-[11px]">
                            {isTa ? 'நிலையான கட்டணம் ₹650 முதல் • ஜீரோ சர்ஜ்' : 'Flat rates from ₹650 • Zero surge'}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-m3-primary shrink-0 group-hover:translate-x-0.5 transition-transform">
                        {isTa ? 'கட்டணங்கள்' : 'Flat Rates'} <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </a>
                  </div>
                )}
              </div>
            )}
      </div>

      {mounted && (
        <LocationPicker
          isOpen={locationPickerOpen}
          onClose={() => setLocationPickerOpen(false)}
          onConfirm={handleLocationConfirm}
          type={pickerField}
        />
      )}
      {showFullBreakdown && breakdown && (
        <FullBreakdownModal 
          isTa={isTa} 
          vehicle={vehicle} 
          activeTab={activeTab} 
          localPackage={localPackage} 
          breakdown={breakdown} 
          estimate={estimate} 
          setShowFullBreakdown={setShowFullBreakdown} 
          handleWhatsApp={handleWhatsApp} 
        />
      )}
    </section>
  );
}

// Sub-component for clarity and reuse
function FullBreakdownModal({ isTa, vehicle, activeTab, localPackage, breakdown, estimate, setShowFullBreakdown, handleWhatsApp }) {
  const isTirupati = !!breakdown?.is_tirupati_pkg;
  const isOutstation = activeTab !== 'local' && !breakdown?.is_city && !isTirupati;

  return (
    <div data-hide-contact-dock role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-m3-scrim/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-m3-surface w-full max-w-lg rounded-m3-2xl overflow-hidden shadow-m3-3 border border-m3-outline-variant flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-m3-outline-variant/60 flex items-center justify-between bg-m3-surface-container-low">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-m3-success-container text-m3-on-success-container text-[10px] font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3 h-3 text-m3-success" />
              <span>{isTa ? '100% வெளிப்படையான கட்டணம்' : '100% Transparent Price Breakdown'}</span>
            </div>
            <h3 className="font-bold text-m3-title-m text-m3-on-surface">
              {isTa ? 'முழுமையான கட்டண விவரம்' : 'Complete Fare Breakdown'}
            </h3>
            <p className="text-m3-body-s text-m3-on-surface-variant font-medium mt-0.5">
              {vehicle} • {isTirupati ? (isTa ? `${breakdown.days || 1} நாட்கள் திருப்பதி பேக்கேஜ்` : `${breakdown.days || 1} Days Tirupati Package`) : activeTab === 'local' ? (isTa ? 'லோக்கல் பேக்கேஜ்' : 'Local Package') : activeTab === 'round' ? (isTa ? `${breakdown.days || 1} நாட்கள் இரு வழி பயணம்` : `${breakdown.days || 1} Days Round Trip`) : (isTa ? 'ஒரு வழி டிராப்' : 'One Way Drop')}
            </p>
          </div>
          <button 
            onClick={() => setShowFullBreakdown(false)} 
            className="w-8 h-8 flex items-center justify-center hover:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface rounded-m3-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 text-m3-body-m">
          {isTirupati && (
            <div className="space-y-2">
              <div className="p-3 bg-m3-surface-container-low rounded-xl border border-dashed border-m3-outline-variant font-mono text-xs space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-dashed border-m3-outline-variant">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase text-[11px]">
                    {isTa ? 'நிலையான பேக்கேஜ்' : 'Fixed Package Fare'}
                  </span>
                  <span className="font-extrabold text-sm text-m3-success">₹{estimate.toLocaleString('en-IN')}</span>
                </div>
                
                {/* Compact Inclusions */}
                <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                  <div className="flex justify-between items-center">
                    <span>✓ {isTa ? 'தேசிய நெடுஞ்சாலை டோல்கள் (FASTag)' : 'NH FASTag Highway Tolls'}</span>
                    <span className="text-[10px] font-bold text-m3-success">INCL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>✓ {isTa ? 'ஆந்திரா மாநில எல்லை அனுமதி வரி' : 'AP Interstate Border State Tax'}</span>
                    <span className="text-[10px] font-bold text-m3-success">INCL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>✓ {isTa ? 'திருமலை மலைப்பாதை ஏறுதல்' : 'Tirumala Ghat Hill Ascent'}</span>
                    <span className="text-[10px] font-bold text-m3-success">INCL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>✓ {isTa ? 'ஓட்டுநர் பேட்டா & தங்குமிடம்' : 'Chauffeur Duty & Day/Night Bata'}</span>
                    <span className="text-[10px] font-bold text-m3-success">INCL</span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-dashed border-m3-outline-variant flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-sans">{isTa ? (isOutstation || isTirupati ? 'முன்பதிவு முன்பணம்' : 'முன்பணம் தேவையில்லை') : (isOutstation || isTirupati ? 'Advance to Confirm Booking' : 'Advance Due (Pay After Trip)')}</span>
                  <span className="font-bold text-m3-success font-mono">{(isOutstation || isTirupati) ? '₹500 (TOKEN)' : '₹0 (ZERO)'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Trip Distance & Commercial Coverage Intelligence */}
          {isOutstation && (
            <div className="bg-m3-surface-container-low rounded-m3-xl p-3 border border-m3-outline-variant/70 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-m3-surface rounded-m3-lg p-2.5 border border-m3-outline-variant/50">
                  <span className="text-[10px] uppercase font-bold text-m3-on-surface-variant block">
                    {isTa ? 'நேரடி பயண தூரம்' : 'Direct Driving Distance'}
                  </span>
                  <p className="text-base font-bold text-m3-on-surface font-heading mt-0.5">
                    {breakdown?.actual_km ? breakdown.actual_km.toFixed(1) : '0.0'} KM
                  </p>
                  <span className="text-[10px] text-m3-on-surface-variant">
                    {activeTab === 'round' ? `${((breakdown?.actual_km || 0) / 2).toFixed(1)} km each way` : 'One-way drop run'}
                  </span>
                </div>
                <div className="bg-m3-surface rounded-m3-lg p-2.5 border border-m3-outline-variant/50">
                  <span className="text-[10px] uppercase font-bold text-m3-on-surface-variant block">
                    {isTa ? 'குறைந்தபட்ச கட்டண தூரம்' : 'Contracted Coverage'}
                  </span>
                  <p className="text-base font-bold text-m3-primary font-heading mt-0.5">
                    {breakdown?.chargeable_km || 0} KM
                  </p>
                  <span className="text-[10px] text-m3-on-surface-variant">
                    {activeTab === 'round' ? `${breakdown?.days || 1} Days × ${vehicles[vehicle]?.min_km_per_day || 250} km/day` : `${breakdown?.base_km || 130} km min outstation`}
                  </span>
                </div>
              </div>

              {(breakdown?.free_buffer_km || 0) > 0 && (
                <div className="p-2.5 rounded-m3-lg bg-m3-success-container/30 border border-m3-success/30 text-xs flex items-start gap-2">
                  <span className="text-base leading-none">🎉</span>
                  <div className="text-[11px] text-m3-on-success-container leading-snug">
                    <strong className="font-bold">+{(breakdown.free_buffer_km || 0).toFixed(0)} KM Extra Sightseeing Buffer Included!</strong>
                    <p className="text-m3-success mt-0.5">
                      You have {(breakdown.free_buffer_km || 0).toFixed(0)} pre-contracted km already included for local temple visits, hilltop climbs, and sightseeing at ₹0 extra km charges.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 1: Contracted Base Vehicle Fare */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <h4 className="text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider">
                {isTa ? 'பகுதி 1: வாகன அடிப்படை கட்டணம் (டாக்ஸிக்கு செலுத்த வேண்டியது)' : 'Part 1: Contracted Base Fare (Payable to Cab)'}
              </h4>
            </div>

            <div className="bg-m3-surface rounded-m3-lg border border-m3-outline-variant/70 overflow-hidden text-xs">
              <div className="divide-y divide-m3-outline-variant/50">
                {activeTab === 'local' ? (
                  <>
                    <div className="py-2.5 px-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-m3-on-surface">{isTa ? 'பேக்கேஜ் கட்டணம்' : 'Local Package Fare'}</p>
                        <p className="text-[11px] text-m3-on-surface-variant">{localPackage === '5hr50km' ? '5H / 50 KM' : localPackage === '8hr80km' ? '8H / 80 KM' : '12H / 120 KM'}</p>
                      </div>
                      <span className="font-bold text-m3-on-surface text-sm">₹{(breakdown?.package_cost || estimate).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="py-2 px-3 flex justify-between items-center bg-m3-surface-container-low">
                      <div>
                        <p className="font-semibold text-m3-on-surface">{isTa ? 'ஓட்டுநர் பேட்டா & எரிபொருள்' : 'Chauffeur Duty & Fuel'}</p>
                        <p className="text-[11px] text-m3-success font-medium">{isTa ? 'கட்டணத்தில் அடங்கும்' : 'Included in hourly package'}</p>
                      </div>
                      <span className="font-bold text-m3-success text-xs">INCLUDED</span>
                    </div>
                    <div className="py-2 px-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-m3-on-surface">{isTa ? 'கூடுதல் கிமீ / மணி கட்டணம்' : 'Extra Km / Hour Rates'}</p>
                        <p className="text-[11px] text-m3-on-surface-variant">{isTa ? 'பேக்கேஜ் கடந்தால் மட்டும்' : 'Only if package limits are exceeded'}</p>
                      </div>
                      <span className="font-semibold text-m3-on-surface text-xs">₹{breakdown?.extra_km_rate || 15}/km • ₹{breakdown?.extra_hr_rate || 150}/hr</span>
                    </div>
                  </>
                ) : breakdown?.is_city ? (
                  <>
                    <div className="py-2.5 px-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-m3-on-surface">{isTa ? 'நகர கைமாற்ற தூரம்' : 'City / Airport Transfer Distance'}</p>
                        <p className="text-[11px] text-m3-on-surface-variant">Direct distance • No outstation minimum</p>
                      </div>
                      <span className="font-bold text-m3-on-surface text-sm">{breakdown?.actual_km ? breakdown.actual_km.toFixed(1) : '0.0'} KM</span>
                    </div>
                    <div className="py-2.5 px-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-m3-on-surface">{isTa ? 'கிமீ கட்டணம்' : 'Distance Charges'}</p>
                        <p className="text-[11px] text-m3-on-surface-variant">{(breakdown?.chargeable_km || 0).toFixed(1)} KM × ₹{breakdown?.rate_per_km || 14}/KM</p>
                      </div>
                      <span className="font-bold text-m3-on-surface text-sm">₹{(breakdown?.km_cost || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="py-2.5 px-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-m3-on-surface">{isTa ? 'வாகன தூரக் கட்டணம்' : 'Distance Running Charge'}</p>
                        <p className="text-[11px] text-m3-on-surface-variant">
                          {breakdown?.chargeable_km || 0} KM × ₹{breakdown?.rate_per_km || 14}/KM (Includes AC Car & Fuel)
                        </p>
                      </div>
                      <span className="font-bold text-m3-on-surface text-sm">₹{(breakdown?.km_cost || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="py-2.5 px-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-m3-on-surface">{isTa ? 'ஓட்டுநர் தினசரி பேட்டா' : 'Driver Daily Batta'}</p>
                        <p className="text-[11px] text-m3-on-surface-variant">
                          {breakdown?.days || 1} Calendar Days × ₹{vehicles[vehicle]?.driver_bata || 400}/day (Food & daily duty)
                        </p>
                      </div>
                      <span className="font-bold text-m3-on-surface text-sm">₹{(breakdown?.driver_bata || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Subtotal Part 1 */}
              <div className="py-2.5 px-3 bg-m3-surface-container-high border-t border-m3-outline-variant flex justify-between items-center font-semibold">
                <div>
                  <span className="text-xs uppercase text-m3-on-surface-variant block font-bold">
                    {isTa ? 'அடிப்படை கட்டண மொத்தம்' : 'Part 1 Base Total'}
                  </span>
                  <span className="text-[10px] text-m3-secondary font-medium">Fuel, Car & Driver Day Bata Included</span>
                </div>
                <span className="text-base font-bold text-m3-on-surface font-heading">₹{estimate.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Estimated On-Road Actuals */}
          {isOutstation && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <h4 className="text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider">
                  {isTa ? 'பகுதி 2: சாலை செலவுகள் (நேரடியாக செலுத்த வேண்டியவை)' : 'Part 2: Estimated On-Road Actuals (Paid during Journey)'}
                </h4>
              </div>

              <div className="bg-m3-surface rounded-m3-lg border border-m3-outline-variant/70 overflow-hidden text-xs">
                <div className="divide-y divide-m3-outline-variant/50">
                  <div className="py-2.5 px-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-m3-on-surface">{isTa ? 'தேசிய நெடுஞ்சாலை டோல் கட்டணம்' : 'FASTag Highway Tolls (Est)'}</p>
                      <p className="text-[11px] text-m3-on-surface-variant">Round-trip NH toll plazas as per FASTag scan</p>
                    </div>
                    <span className="font-bold text-m3-on-surface text-sm">~₹{(breakdown?.tolls_est || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="py-2.5 px-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-m3-on-surface">{isTa ? 'மாநில எல்லை வரி / அனுமதி' : 'Interstate State Border Tax (Est)'}</p>
                      <p className="text-[11px] text-m3-on-surface-variant">
                        {(breakdown?.state_permit_est || 0) > 0 ? `${breakdown?.state_name} Commercial Entry Permit (Checkpost receipt)` : 'Within Tamil Nadu • Zero border tax'}
                      </p>
                    </div>
                    <span className="font-bold text-m3-on-surface text-sm">
                      {(breakdown?.state_permit_est || 0) > 0 ? `~₹${(breakdown.state_permit_est || 0).toLocaleString('en-IN')}` : '₹0'}
                    </span>
                  </div>

                  {(breakdown?.nights || 0) > 0 && (
                    <div className="py-2.5 px-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-m3-on-surface">{isTa ? 'ஓட்டுநர் இரவு தங்குமிடம்' : 'Driver Night Stay Allowance'}</p>
                        <p className="text-[11px] text-m3-on-surface-variant">
                          {breakdown.nights} Nights in outstation (Waived if lodging is provided by guest)
                        </p>
                      </div>
                      <span className="font-bold text-m3-on-surface text-sm">~₹{(breakdown?.driver_night_stay_est || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {/* Subtotal Part 2 */}
                <div className="py-2 px-3 bg-m3-surface-container-low border-t border-m3-outline-variant flex justify-between items-center text-xs">
                  <span className="font-semibold text-m3-on-surface-variant">
                    {isTa ? 'சுமார் சாலை செலவுகள் மொத்தம்:' : 'Total Estimated Road Extras:'}
                  </span>
                  <span className="font-bold text-m3-on-surface text-sm">~₹{(breakdown?.road_extras_est || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Two Clear Billing Options */}
          {isOutstation ? (
            <div className="space-y-1.5 pt-1">
              <h4 className="text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider px-0.5">
                {isTa ? 'உங்கள் விருப்பத்தை தேர்ந்தெடுக்கவும்' : 'Choose Your Preferred Billing Option'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Option A */}
                <div className="p-3 rounded-m3-xl bg-m3-surface-container-low border border-m3-outline-variant hover:border-m3-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-m3-on-surface text-xs uppercase">Option A: Base Fare</span>
                    <span className="font-extrabold text-sm text-m3-on-surface font-heading">₹{estimate.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[11px] text-m3-on-surface-variant leading-snug">
                    Pay ₹{estimate.toLocaleString('en-IN')} to taxi. Tolls, state permits & driver night room paid directly by you at actuals during the journey.
                  </p>
                </div>

                {/* Option B */}
                <div className="p-3 rounded-m3-xl bg-primary-50/50 dark:bg-primary-950/20 border-2 border-m3-primary/60 shadow-xs relative">
                  <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full bg-m3-primary text-white text-[9px] font-bold uppercase tracking-wider">
                    Most Popular
                  </span>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-m3-primary text-xs uppercase">Option B: All-Inclusive</span>
                    <span className="font-extrabold text-sm text-m3-primary font-heading">~₹{(breakdown?.all_inclusive_est || estimate).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[11px] text-m3-on-surface-variant leading-snug">
                    100% Cashless journey. Chauffeur pays all highway FASTag tolls, AP/interstate permits, and handles stay. Zero road surprise expenses!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-m3-on-surface block uppercase">Total Estimated Fare</span>
                <span className="text-[11px] text-m3-on-surface-variant">Includes fuel & driver duty</span>
              </div>
              <span className="text-lg font-bold text-m3-on-surface font-heading">₹{estimate.toLocaleString('en-IN')}</span>
            </div>
          )}

          {/* Advance Reassurance Banner */}
          <div className="p-2.5 bg-m3-success-container/30 rounded-m3-lg border border-m3-success/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-m3-on-success-container">
              <ShieldCheck className="w-4 h-4 text-m3-success shrink-0" />
              <span>{(isOutstation || isTirupati) ? (isTa ? '₹500 முன்பணம் • மீதம் பயண முடிவில்' : '₹500 Advance to Confirm • Balance After Trip') : (isTa ? 'முன்பணம் தேவையில்லை • ₹0 Advance' : '₹0 Advance Required • Pay After Trip')}</span>
            </div>
            <span className="text-[10px] font-semibold text-m3-on-success-container bg-m3-success-container/60 px-2 py-0.5 rounded-full">
              Zero Surge
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-m3-outline-variant/60 bg-m3-surface-container-low flex gap-2 items-center">
          <button 
            onClick={() => setShowFullBreakdown(false)} 
            className="flex-1 py-2 px-3 bg-m3-surface border border-m3-outline-variant text-m3-on-surface font-semibold text-xs sm:text-sm rounded-m3-full hover:bg-m3-surface-container transition-colors cursor-pointer"
          >
            {isTa ? 'மூடு' : 'Close'}
          </button>
          <WhatsAppButton 
            onClick={() => {
              setShowFullBreakdown(false);
              handleWhatsApp();
            }}
            variant="filled"
            size="md"
            className="flex-[2]"
            text={isTa ? 'வாட்ஸ்அப் முன்பதிவு' : 'Reserve on WhatsApp'}
          />
        </div>
      </div>
    </div>
  );
}
