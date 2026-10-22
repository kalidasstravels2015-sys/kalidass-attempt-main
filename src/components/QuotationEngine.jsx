import React, { useState, useEffect, useRef } from 'react';
import { Car, Calendar, Send, ArrowRight, Repeat, Users, User, AlertCircle, Info, Navigation, ShieldCheck, Clock, X, ChevronDown, ChevronRight, CheckCircle2, Plane, ArrowUpDown, MapPin, Phone, Receipt, Edit2 } from 'lucide-react';
import { trackEvent, trackCalculatorQuote, markQuoteConverted } from '../lib/analytics';
import LocationPicker from './LocationPicker';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { buildWhatsAppUrl, buildMapsLinks } from '../utils/whatsapp';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import { getActiveGoogleSheetUrl } from '../config/googleSheets';
import { getNextQuotationId, peekNextQuotationId } from '../utils/sequenceGenerator';
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

// Default departure time (next day morning 6:00 AM)
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
  showHeader = true,
  title = '', 
  subtitle = '',
  headerIcon = null,
  variant = "default",
  initialTab = 'round',
  allowedTabs = null,
  initialPickup = '',
  initialDrop = '',
  autoCalculate = false,
  isOperatorMode = false,
  operatorCallerPhone = '',
  operatorCallerName = '',
  onQuoteCalculated = null
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
  const isAuto = Boolean(autoCalculate);

  const [distance, setDistance] = useState(() => {
    if (initialPickup && initialDrop) {
      const known = findKnownDistance(initialPickup, initialDrop);
      if (known) return known.distance;
    }
    if (autoCalculate) return 135;
    return null;
  });
  const [duration, setDuration] = useState(() => {
    if (initialPickup && initialDrop) {
      const known = findKnownDistance(initialPickup, initialDrop);
      if (known) return known.duration;
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

  // Customer Details & Validation
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [date, setDate] = useState(() => getDefaultDepartureTime());
  const [returnDate, setReturnDate] = useState(() => {
    const defaultDep = getDefaultDepartureTime();
    const effD = initialDrop ? (findKnownDistance(initialPickup, initialDrop)?.distance || 0) : 0;
    const req = getTripDrivingRequirements(effD, initialTab === 'round', null);
    return getMinReturnDateTime(defaultDep, req.minRealisticHours);
  });
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
  const [quoteRefId, setQuoteRefId] = useState(() => (typeof window !== 'undefined' ? peekNextQuotationId() : '#QT-101'));
  const [showStickyQuoteBar, setShowStickyQuoteBar] = useState(false);
  const [vehicleHighlighted, setVehicleHighlighted] = useState(false);
  const stableFormId = "booking-form-v1"; // Using stable ID for hydration safety
  const hasCalculatedResult = Boolean(showResult && estimate > 0 && pickup && (drop || activeTab === 'local'));

  const effDist = distance || 0;
  const tripReq = getTripDrivingRequirements(effDist, activeTab === 'round', duration);

  // Short City Round Trip Detection & Alternative Local Package Suggestion
  const roundTripKm = distance ? Math.round(distance * 2) : 0;
  const isShortCityRoundTrip = activeTab === 'round' && Boolean(distance && roundTripKm <= 120);

  const recLocalPkgKey = roundTripKm <= 50 ? '5hr50km' : roundTripKm <= 80 ? '8hr80km' : '12hr120km';
  const recLocalPkgLabel = roundTripKm <= 50 ? '5 Hrs / 50 Km' : roundTripKm <= 80 ? '8 Hrs / 80 Km' : '12 Hrs / 120 Km';
  const recLocalPkgCost = (
    recLocalPkgKey === '5hr50km' ? vehicles[vehicle]?.local_5hr_pkg
    : recLocalPkgKey === '8hr80km' ? vehicles[vehicle]?.local_8hr_pkg
    : vehicles[vehicle]?.local_12hr_pkg
  ) || (recLocalPkgKey === '5hr50km' ? 1500 : recLocalPkgKey === '8hr80km' ? 2200 : 3050);

  const localSavings = Math.max(0, (estimate || 3900) - recLocalPkgCost);

  const handleSwitchToLocalPackage = () => {
    setActiveTab('local');
    setLocalPackage(recLocalPkgKey);
    setDrop('Local Sightseeing (Chennai City)');
    setShowResult(true);
    trackEvent('switch_to_local_package_clicked', {
      origin: 'quotation_engine',
      roundTripKm,
      recommendedPackage: recLocalPkgKey,
      savings: localSavings
    });
  };

  // Compute Realistic Travel Advisory for driver safety
  let scheduleAdvisory = null;
  if (activeTab === 'round' && distance && date && returnDate) {
    const diffHours = (new Date(returnDate) - new Date(date)) / (1000 * 60 * 60);
    const roundKm = (distance * 2).toFixed(0);
    if (diffHours < tripReq.totalDrivingHours) {
      scheduleAdvisory = isTa
        ? `சுற்றுப்பயணம் ~${roundKm} கிமீ (~${Math.round(tripReq.totalDrivingHours)} மணிநேர நெடுஞ்சாலைப் பயணம்). நீங்கள் தேர்ந்தெடுத்த பயண நேரம் (${Math.max(1, Math.round(diffHours))} மணி) போதுமானதாக இல்லை. குறைந்தபட்சம் ${tripReq.minDays} நாட்கள் தேவை.`
        : `Round trip covers ~${roundKm} km (~${Math.round(tripReq.totalDrivingHours)} hrs highway driving). Selected schedule window (${Math.max(1, Math.round(diffHours))} hrs) is less than round-trip driving time. Minimum ${tripReq.minDays} calendar days required for highway safety.`;
    } else if (diffHours < tripReq.minRealisticHours) {
      scheduleAdvisory = isTa
        ? `சுற்றுப்பயணம் ~${roundKm} கிமீ (~${Math.round(tripReq.totalDrivingHours)} மணிநேரப் பயணம்). நடைமுறை பயண நேரம் குறைந்தபட்சம் ${tripReq.minRealisticHours} மணிநேரம் ஆகும்.`
        : `Round trip covers ~${roundKm} km (~${Math.round(tripReq.totalDrivingHours)} hrs driving). Minimum realistic window is ${tripReq.minRealisticHours} hours for safe travel and sightseeing.`;
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
      const minReturn = getMinReturnDateTime(val, tripReq.minRealisticHours);
      if (!returnDate || returnDate < minReturn) {
        setReturnDate(minReturn);
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const driver = params.get('driver');
      if (driver) setRequestedDriver(decodeURIComponent(driver));

      let vehParam = params.get('vehicle');
      if (!vehParam && window.location.hash.includes('vehicle=')) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          vehParam = new URLSearchParams(hashQuery).get('vehicle');
        }
      }
      if (vehParam) {
        const decoded = decodeURIComponent(vehParam).trim();
        const matched = vehicleOptions.find(
          opt => opt.toLowerCase() === decoded.toLowerCase() ||
                 opt.toLowerCase().includes(decoded.toLowerCase()) ||
                 decoded.toLowerCase().includes(opt.toLowerCase())
        );
        if (matched) {
          setVehicle(matched);
          const maxCap = VEHICLE_CAPACITY[matched] || 4;
          setPassengers(p => (parseInt(p, 10) > maxCap ? String(maxCap) : p));
          setVehicleHighlighted(true);
          setTimeout(() => setVehicleHighlighted(false), 2500);
        }
      }
    }

    const handleExternalVehicleSelect = (e) => {
      const v = e?.detail?.vehicle;
      if (!v) return;
      const cleanV = String(v).trim();
      const matched = vehicleOptions.find(
        opt => opt.toLowerCase() === cleanV.toLowerCase() ||
               opt.toLowerCase().includes(cleanV.toLowerCase()) ||
               cleanV.toLowerCase().includes(opt.toLowerCase())
      );
      if (matched) {
        setVehicle(matched);
        const maxCap = VEHICLE_CAPACITY[matched] || 4;
        setPassengers(p => (parseInt(p, 10) > maxCap ? String(maxCap) : p));
        setVehicleHighlighted(true);
        setTimeout(() => setVehicleHighlighted(false), 2500);
      }
    };

    window.addEventListener('select-quote-vehicle', handleExternalVehicleSelect);
    return () => window.removeEventListener('select-quote-vehicle', handleExternalVehicleSelect);
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
      const rawId = trackCalculatorQuote({
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
      const formattedRef = (rawId && (String(rawId).startsWith('#QT-') || String(rawId).startsWith('#KT-'))) 
        ? String(rawId) 
        : getNextQuotationId();
      setQuoteRefId(formattedRef);

      if (typeof window !== 'undefined') {
        window.__KT_CURRENT_CALCULATION = {
          engine: 'QuotationEngine',
          quoteRefId: formattedRef,
          serviceTitle: activeTab === 'local' ? 'Chennai Local Rental' : `Chennai to ${drop || 'Outstation'} (${activeTab === 'round' ? 'Round Trip' : 'One Way'})`,
          activeTab,
          pickup: pickup || 'Chennai',
          destination: drop || (activeTab === 'local' ? 'Chennai City' : ''),
          pickupDateTime: date,
          returnDateTime: activeTab === 'round' ? returnDate : '',
          durationDays: activeTab === 'round' ? days : 1,
          vehicleName: vehicle,
          passengers,
          distanceKm: distance ? Number(distance.toFixed(1)) : 0,
          totalFare: estimate,
          formattedFare: `₹${estimate.toLocaleString('en-IN')}`,
          localPackage: activeTab === 'local' ? localPackage : null,
          timestamp: Date.now()
        };
        window.dispatchEvent(new CustomEvent('kt_calculation_updated', { detail: window.__KT_CURRENT_CALCULATION }));
        onQuoteCalculated?.(window.__KT_CURRENT_CALCULATION);
      }
    }
  }, [estimate, showResult, vehicle, activeTab, pickup, drop, date, returnDate, days, passengers, distance, localPackage]);

  // Sticky Mobile Quote Bar observer when user scrolls past the calculated result card
  useEffect(() => {
    if (!showResult || !estimate || estimate <= 0 || !resultRef.current || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setShowStickyQuoteBar(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isScrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setShowStickyQuoteBar(isScrolledPast);
      },
      { threshold: 0.1 }
    );
    observer.observe(resultRef.current);
    return () => observer.disconnect();
  }, [showResult, estimate]);


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
      const minReturn = getMinReturnDateTime(date || getDefaultDepartureTime(), req.minRealisticHours);
      if (!returnDate || returnDate < minReturn) {
        setReturnDate(minReturn);
        const computed = calculateCalendarDays(date || getDefaultDepartureTime(), minReturn);
        setDays(Math.max(req.minDays, computed));
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
    const o = (origin || pickup || pickupValueRef.current || pickupInputRef.current?.value || '').trim();
    const d = (destination || drop || dropValueRef.current || dropInputRef.current?.value || '').trim();
    if (!o || !d) {
      setErrors(prev => ({
        ...prev,
        global: isTa ? 'பிக்கப் மற்றும் டிராப் இடங்களை உள்ளிடவும்' : 'Please enter valid pickup & drop locations'
      }));
      return;
    }

    if (o && o !== pickup) {
      setPickup(o);
      pickupValueRef.current = o;
    }
    if (d && d !== drop) {
      setDrop(d);
      dropValueRef.current = d;
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

    const o = (pickup || pickupValueRef.current || pickupInputRef.current?.value || '').trim();
    const d = (drop || dropValueRef.current || dropInputRef.current?.value || '').trim();

    if (!o || !d) {
      setErrors(prev => ({
        ...prev,
        global: isTa ? 'பிக்கப் மற்றும் டிராப் இடங்களை உள்ளிடவும்' : 'Please enter both Pickup and Drop locations',
        pickup: !o ? (isTa ? 'பிக்கப் இடத்தை உள்ளிடவும்' : 'Please enter pickup location') : undefined,
        drop: !d ? (isTa ? 'டிராப் இடத்தை உள்ளிடவும்' : 'Please enter drop location') : undefined,
      }));
      return;
    }

    if (o !== pickup) {
      setPickup(o);
      pickupValueRef.current = o;
    }
    if (d !== drop) {
      setDrop(d);
      dropValueRef.current = d;
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
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      scrollInputAboveKeyboard(inputEl, 220);
    }
  };

  // Handle Location Selection from Map Modal
  const handleLocationConfirm = (address) => {
    const cleanAddr = sanitizeInput(address);
    if (pickerField === 'pickup') {
      setPickup(cleanAddr);
      pickupValueRef.current = cleanAddr;
      setErrors(prev => {
        const next = { ...prev };
        delete next.global;
        delete next.location;
        delete next.pickup;
        return next;
      });
      if (dropValueRef.current) calculateDistance(cleanAddr, dropValueRef.current);
    } else if (pickerField === 'drop') {
      setDrop(cleanAddr);
      dropValueRef.current = cleanAddr;
      setErrors(prev => {
        const next = { ...prev };
        delete next.global;
        delete next.location;
        delete next.drop;
        return next;
      });
      if (pickupValueRef.current) calculateDistance(pickupValueRef.current, cleanAddr);
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
    if ((distance || autoCalculate) && vehicleData) {
      const effDistance = distance || 130;
      let totalCost = 0;
      const rate = activeTab === 'round' ? vehicleData.round_trip_rate : vehicleData.one_way_rate;
      const bata = vehicleData.driver_bata;
      let breakdownObj = {};

      if (activeTab === 'round') {
        const minKm = (days || 1) * (vehicleData.min_km_per_day || 250);
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
          is_city: false
        };
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
    const cleanGuestPhone = (guestPhone || '').replace(/[^0-9]/g, '').slice(-10);
    const guestLabel = (guestName || '').trim() || (cleanGuestPhone ? `Customer (${cleanGuestPhone})` : 'Website Visitor');
    const sourceWithPhone = cleanGuestPhone 
      ? `Website Booking Engine (+91 ${cleanGuestPhone})` 
      : 'Website Booking Engine';

    markQuoteConverted(quoteRefId, {
      quoteId: quoteRefId,
      guestName: guestLabel,
      phone: cleanGuestPhone ? `+91 ${cleanGuestPhone}` : '',
      sourcePage: sourceWithPhone,
      calculatorEngine: 'Outstation Fare Engine',
      tripType: activeTab === 'local' ? `Local Package (${localPackage})` : activeTab === 'oneway' ? 'One Way Drop' : `Round Trip (${days} Days)`,
      pickup: sanitizeInput(pickup),
      drop: sanitizeInput(drop || 'Local Sightseeing'),
      vehicle,
      estimatedFare: finalEstimate,
      distanceKm: currentDist ? (activeTab === 'round' ? currentDist * 2 : currentDist) : '',
      travelDate: date ? `${date}` : '',
      status: 'WhatsApp Clicked'
    });

    // 5. Send Data to Google Sheet Webhook if configured
    const activeSheetUrl = getActiveGoogleSheetUrl();
    const bookingData = {
      type: 'calculator_activity',
      quoteId: quoteRefId,
      date: new Date().toLocaleString('en-IN'),
      tripType: activeTab === 'local' ? `Local Package (${localPackage})` : activeTab === 'oneway' ? 'One Way Drop' : 'Round Trip',
      guestName: guestLabel,
      phone: cleanGuestPhone ? `+91 ${cleanGuestPhone}` : '',
      pickup: sanitizeInput(pickup),
      drop: sanitizeInput(drop || 'Local Sightseeing (Chennai City)'),
      vehicle,
      passengers,
      distance: currentDist ? (activeTab === 'round' ? (currentDist * 2).toFixed(1) : currentDist.toFixed(1)) : (activeTab === 'local' ? localPackage : ''),
      estimate: finalEstimate,
      travelDate: date,
      returnDate: activeTab === 'round' ? returnDate : '',
      days: activeTab === 'round' ? days : 1,
      sourcePage: sourceWithPhone,
      status: 'WhatsApp Clicked'
    };

    if (activeSheetUrl && activeSheetUrl.startsWith('http')) {
      try {
        fetch(activeSheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(bookingData)
        }).catch(() => {});
      } catch (e) {}
    }

    // 6. Build Crisp Official WhatsApp Quotation Message (Single Selected Vehicle + Approx Tolls/Permit + Quote Ref)
    const driverLine = requestedDriver ? `• *Requested Chauffeur:* ${requestedDriver}\n` : '';
    const customerLine = (guestName.trim() || cleanGuestPhone)
      ? `• *Customer:* ${guestName.trim() || 'Guest'}${cleanGuestPhone ? ` (+91 ${cleanGuestPhone})` : ''}\n`
      : '';
    const tripTypeTitle = activeTab === 'local' 
      ? `Local Package (${localPackage === '5hr50km' ? '5 Hours / 50 Km' : localPackage === '8hr80km' ? '8 Hours / 80 Km' : '12 Hours / 120 Km'})`
      : activeTab === 'oneway' ? 'One Way Drop' : `Round Trip (${days} ${days > 1 ? 'Days' : 'Day'})`;

    const statePermitText = breakdown?.state_permit_est > 0
      ? `₹${breakdown.state_permit_est.toLocaleString('en-IN')}`
      : '₹0';

    const breakdownDetails = activeTab === 'local' ? `
*FARE SUMMARY*
• *Quoted Package Fare:* *₹${finalEstimate.toLocaleString('en-IN')}* (${localPackage === '5hr50km' ? '5 Hrs / 50 Km' : localPackage === '8hr80km' ? '8 Hrs / 80 Km' : '12 Hrs / 120 Km'} — AC Car + Fuel + Chauffeur Included)
• *Extra Usage (if exceeded):* ₹${vehicles[vehicle]?.extra_km_rate || 15}/km • ₹${vehicles[vehicle]?.extra_hr_rate || 150}/hr
• *Advance to Pay:* -₹500
• *Balance to Pay Driver (After trip):* ₹${Math.max(0, finalEstimate - 500).toLocaleString('en-IN')}
• *Payment Terms:* ₹500 Advance to Confirm (Deducted from Bill) • Balance after trip completion.`
    : (breakdown && !breakdown.is_city) ? `
*FARE SUMMARY*
• *Total Fare:* *₹${finalEstimate.toLocaleString('en-IN')} + Extra* (${breakdown.chargeable_km} km @ ₹${breakdown.rate_per_km}/km + Driver Allowance ₹${breakdown.driver_bata})
${breakdown.free_buffer_km > 0 ? `• *Free Sightseeing Buffer:* +${breakdown.free_buffer_km.toFixed(0)} km (₹0)\n` : ''}• *State Permit:* ${statePermitText}
• *Tolls & Parking:* Extra
• *Advance to Pay:* -₹500
• *Balance to Pay Driver (After trip):* ₹${Math.max(0, finalEstimate - 500).toLocaleString('en-IN')} + Extra
• *Payment Terms:* ₹500 Advance to Confirm (Deducted from Bill) • Balance after trip completion.`
    : `
*FARE SUMMARY*
• *Quoted Fare:* *₹${finalEstimate.toLocaleString('en-IN')}* (AC Cab + Fuel + Driver Included)
• *Advance to Pay:* -₹500
• *Balance to Pay Driver (After trip):* ₹${Math.max(0, finalEstimate - 500).toLocaleString('en-IN')}
• *Payment Terms:* ₹500 Advance to Confirm (Deducted from Bill) • Balance after trip completion.`;

    // Google Maps navigation links
    const { pickupPin: mapsPickupPin, directions: mapsDirections } = buildMapsLinks(
      sanitizeInput(pickup),
      activeTab === 'local' ? '' : sanitizeInput(drop),
      activeTab
    );
    const mapsBlock = (mapsPickupPin || mapsDirections)
      ? `\n\n🗺️ NAVIGATION LINKS:\n` +
        (mapsPickupPin  ? `• 📍 Pickup Pin: ${mapsPickupPin}\n`  : '') +
        (mapsDirections ? `• 🧭 Route Map: ${mapsDirections}`    : '')
      : '';

    const message = `*Kalidass Travels — Official Quotation (${quoteRefId})*
${customerLine}${driverLine}• *Trip:* ${tripTypeTitle}
• *Pickup:* ${sanitizeInput(pickup)}
• *Drop:* ${activeTab === 'local' ? 'Local Sightseeing (Chennai City Limits)' : sanitizeInput(drop)}
${activeTab !== 'local' ? `• *Distance:* ~${currentDist ? (activeTab === 'round' ? (currentDist * 2).toFixed(0) : currentDist.toFixed(0)) : 'N/A'} km (${tripReq.drivingText || duration || 'Highway Route'})\n` : ''}• *Pickup Schedule:* ${date ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not Specified'}
${activeTab === 'round' ? `• *Return Schedule:* ${returnDate ? new Date(returnDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not Specified'}\n` : ''}• *Selected Vehicle:* ${vehicle} (${passengers} Pax)
${breakdownDetails}

Please confirm cab availability and lock this quotation (${quoteRefId}).` + mapsBlock;

    trackEvent('booking_conversion_whatsapp', {
      quote_id: quoteRefId,
      estimate: finalEstimate,
      trip_type: activeTab,
      vehicle
    });

    const targetPhone = isOperatorMode && operatorCallerPhone ? operatorCallerPhone : undefined;
    window.open(buildWhatsAppUrl(message, targetPhone), '_blank');
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
      {showHeader && (
        <div className="py-3 px-4 sm:px-5 border-b border-m3-outline-variant/60 flex flex-col items-center justify-center text-center bg-m3-surface">
          <div className="flex items-center justify-center gap-2 max-w-full">
            {headerIcon && (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-m3-full bg-m3-primary-container flex items-center justify-center shrink-0">
                {headerIcon === 'car' ? (
                  <Car className="w-4 h-4 text-m3-primary" />
                ) : headerIcon === 'clock' ? (
                  <Clock className="w-4 h-4 text-m3-primary" />
                ) : (
                  headerIcon
                )}
              </div>
            )}
            <h2 className="text-lg sm:text-xl font-bold text-m3-on-surface font-heading leading-tight text-center">
              {displayTitle}
            </h2>
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-1 font-medium text-center">
            {subtitle || (activeTab === 'local' 
              ? (isTa ? 'சென்னைக்குள் வாடகை கார் • எரிபொருள் & டிரைவர் உட்பட' : 'Hourly car rental within Chennai • Fuel & Chauffeur included')
              : (isTa ? 'வெளிப்படையான கட்டணங்கள் • சரிபார்க்கப்பட்ட ஓட்டுநர்கள்' : 'Transparent pricing • Verified chauffeurs'))}
          </p>
        </div>
      )}

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
        <div className={`px-4 sm:px-5 ${showHeader ? 'pt-3.5' : 'pt-4 sm:pt-5'} pb-1`}>
          <div role="tablist" aria-label={isTa ? 'பயண வகை' : 'Trip Type'} className="bg-m3-surface-container-high p-1 rounded-m3-full flex gap-1 overflow-x-auto whitespace-nowrap hide-scrollbar border border-m3-outline-variant">
            {visibleTabs.map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => { 
                  setActiveTab(tab); 
                  if (!date) {
                    setDate(getDefaultDepartureTime());
                  }
                  if (tab === 'round') {
                    const minReturn = getMinReturnDateTime(date || getDefaultDepartureTime(), tripReq.minRealisticHours);
                    if (!returnDate || returnDate < minReturn) {
                      setReturnDate(minReturn);
                    }
                  }
                  if (tab === 'local') {
                    if (pickup) setShowResult(true);
                  } else if (pickup && drop && distance) {
                    setShowResult(true);
                  } else {
                    setShowResult(false);
                  }
                }}
                className={`flex-1 py-2 px-2.5 sm:px-4 text-xs font-bold rounded-m3-full transition-all flex items-center justify-center gap-1 min-h-[38px] sm:min-h-[42px] cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary ${
                  activeTab === tab 
                    ? 'bg-m3-primary text-m3-on-primary shadow-m3-1' 
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest'
                }`}
              >
                <span className="capitalize">{tab === 'local' ? (isTa ? 'லோக்கல் பேக்கேஜ்' : 'Local Package') : tab === 'oneway' ? (isTa ? 'ஒரு வழி' : 'One Way') : (isTa ? 'இரு வழி' : 'Round Trip')}</span>
              </button>
            ))}
            {showAirportTab && (
              <a
                href="/services/chennai-airport-taxi/"
                className="flex-1 py-2 px-2.5 sm:px-4 text-xs font-bold rounded-m3-full transition-all flex items-center justify-center gap-1.5 min-h-[38px] sm:min-h-[42px] cursor-pointer active:scale-[0.98] text-m3-on-surface-variant hover:text-m3-primary hover:bg-m3-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary group"
                title={isTa ? 'சென்னை ஏர்போர்ட் டாக்ஸி முன்பதிவு' : 'Chennai Airport Taxi Transfers (Fixed Fares from ₹650)'}
              >
                <Plane className="w-3.5 h-3.5 text-m3-primary shrink-0 transition-transform group-hover:scale-110" />
                <span>{isTa ? 'ஏர்போர்ட்' : 'Airport Transfer'}</span>
              </a>
            )}
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
                  className={`w-full min-h-[48px] bg-slate-50/50 hover:bg-white focus:bg-white border rounded-m3-lg px-3.5 py-3 text-sm ${
                    errors.pickup 
                      ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/10' 
                      : 'border-slate-200/90 hover:border-slate-300 focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15'
                  } ${pickup ? 'text-m3-on-surface font-semibold' : 'text-m3-on-surface font-normal'} placeholder:text-sm placeholder:text-m3-on-surface-variant/75 placeholder:font-normal outline-none transition-all pr-20 shadow-2xs`}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
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
                      className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full hover:bg-m3-surface-container active:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handlePinClick('pickup')}
                    aria-label={isTa ? "வரைபடத்தில் பிக்-அப் இடத்தை குறிக்கவும்" : "Pinpoint pickup on map"}
                    title={isTa ? "வரைபடத்தில் பிக்-அப் இடத்தை குறிக்கவும்" : "Pinpoint pickup on map"}
                    className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-m3-md hover:bg-m3-surface-container active:scale-95 active:bg-m3-surface-container-high text-m3-primary hover:bg-m3-primary/10 transition-all cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-m3-primary" />
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
                  className={`w-full min-h-[48px] bg-slate-50/50 hover:bg-white focus:bg-white border rounded-m3-lg px-3.5 py-3 text-sm ${
                    errors.drop 
                      ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/10' 
                      : 'border-slate-200/90 hover:border-slate-300 focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15'
                  } ${drop ? 'text-m3-on-surface font-semibold' : 'text-m3-on-surface font-normal'} placeholder:text-sm placeholder:text-m3-on-surface-variant/75 placeholder:font-normal outline-none transition-all pr-20 shadow-2xs`}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
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
                      className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full hover:bg-m3-surface-container active:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handlePinClick('drop')}
                    aria-label={isTa ? "வரைபடத்தில் சேருமிடத்தை குறிக்கவும்" : "Pinpoint drop on map"}
                    title={isTa ? "வரைபடத்தில் சேருமிடத்தை குறிக்கவும்" : "Pinpoint drop on map"}
                    className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-m3-md hover:bg-m3-surface-container active:scale-95 active:bg-m3-surface-container-high text-m3-primary hover:bg-m3-primary/10 transition-all cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-m3-primary" />
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

            {/* Contextual Airport Shortcut Prompt */}
            {showAirportTab && (origLower.includes('airport') || destLower.includes('airport') || origLower.includes('maa') || destLower.includes('maa')) && (
              <div className="p-2.5 rounded-m3-lg bg-blue-50/90 border border-blue-200 flex items-center justify-between gap-2 animate-in fade-in text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Plane className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-blue-900 font-medium truncate">
                    {isTa ? 'ஏர்போர்ட் பயணம்? நிலையான கட்டணங்களை பாருங்கள்' : 'Airport trip? Check flat zone fares from ₹650'}
                  </span>
                </div>
                <a
                  href="/services/chennai-airport-taxi/"
                  className="font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2 shrink-0 flex items-center gap-0.5 text-[11px]"
                >
                  <span>{isTa ? 'ஏர்போர்ட் பக்கம்' : 'Airport Page'}</span>
                  <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Alternative Suggestion: Local City Package (Short Distance Round Trip) */}
            {isShortCityRoundTrip && (
              <div className="p-3 bg-amber-50/90 border border-amber-300/80 rounded-xl space-y-2 text-xs animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-800 font-bold mt-0.5">
                    💡
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-amber-950 text-xs sm:text-sm">
                      {isTa ? 'உள்ளூர் பயணத்திற்கு சிறந்த மாற்று திட்டம் உள்ளது!' : 'Short City Route Detected — Better Value with Local Package!'}
                    </div>
                    <p className="text-amber-900/90 mt-0.5 leading-relaxed text-[11.5px]">
                      {isTa 
                        ? `இந்த பயணம் ~${roundTripKm} கிமீ மட்டுமே. அவுட்ஸ்டேஷன் சுற்றுப்பயணம் குறைந்தபட்சம் 250 கிமீ/நாள் கணக்கிடும். சென்னைக்குள் பயணிக்க எங்கள் மணிநேர லோக்கல் பேக்கேஜ் தேர்வு செய்து ₹${localSavings.toLocaleString('en-IN')} வரை சேமிக்கலாம்!`
                        : `This trip is ~${roundTripKm} km round trip. Outstation cabs carry a mandatory 250 km/day interstate minimum. For travel within Chennai and suburbs, save ₹${localSavings.toLocaleString('en-IN')} with our Local Hourly Package (${recLocalPkgLabel} at ₹${recLocalPkgCost.toLocaleString('en-IN')})!`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/80 flex-wrap">
                  <div className="text-[11px] font-semibold text-amber-950">
                    <span>{isTa ? 'மாற்றுத் திட்டம்:' : 'Alternative:'} </span>
                    <strong className="text-emerald-800 font-bold">{recLocalPkgLabel} (₹{recLocalPkgCost.toLocaleString('en-IN')})</strong>
                    {localSavings > 0 && <span className="ml-1 text-emerald-700 font-bold">• {isTa ? `₹${localSavings.toLocaleString('en-IN')} சேமிப்பு` : `Save ₹${localSavings.toLocaleString('en-IN')}`}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={handleSwitchToLocalPackage}
                    className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <span>{isTa ? 'லோக்கல் பேக்கேஜிற்கு மாறவும்' : 'Switch to Local Package'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

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
                <div className="group relative rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/15 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
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
                    min={getMinDateTime()}
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
                  <div className="group relative rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/15 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <label 
                        htmlFor={`${stableFormId}-return-date-main`} 
                        className="text-[11px] sm:text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 cursor-pointer truncate"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                        <span className="truncate">{isTa ? 'திரும்பும் தேதி' : 'Return Date'}</span>
                      </label>
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#0b57d0] bg-[#1a73e8]/10 px-1.5 py-0.5 rounded-full shrink-0">
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
                <div className="p-2 sm:p-2.5 rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/60 text-[11px] sm:text-xs text-m3-on-surface flex items-start gap-2 animate-in fade-in">
                  <Info className="w-4 h-4 text-m3-on-surface-variant shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="font-bold">{isTa ? 'நடைமுறை பயண ஆலோசனை:' : 'Realistic Travel Advisory:'}</strong> {scheduleAdvisory}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Passengers & Vehicle Selection Tiles */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Passenger Tile */}
              <div className="group relative rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/15 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
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
              <div className={`group relative rounded-xl border transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer ${
                vehicleHighlighted
                  ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/30 bg-blue-50/80 shadow-md'
                  : 'border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/15'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label 
                    htmlFor={`${stableFormId}-vehicle`} 
                    className="text-[11px] sm:text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 cursor-pointer truncate"
                  >
                    <Car className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                    <span className="truncate">{isTa ? 'வாகனம்' : 'Vehicle Model'}</span>
                  </label>
                  {vehicleHighlighted && (
                    <span className="text-[10px] font-bold text-[#1a73e8] bg-white px-1.5 py-0.5 rounded-full border border-[#1a73e8]/30 animate-pulse shrink-0">
                      {isTa ? 'தேர்ந்தெடுக்கப்பட்டது' : 'Selected'}
                    </span>
                  )}
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
                  <span>{isTa ? 'கட்டணம் பார்க்கவும்' : 'View Instant Fare'}</span>
                )}
              </button>
              <p className="text-[11px] text-m3-on-surface-variant/80 text-center font-medium max-w-sm">
                {isTa ? 'கட்டணம் பார்க்க தொலைபேசி எண் தேவையில்லை' : 'No phone number required to check fare'}
              </p>

              {/* Smart Airport Quick-Access Callout */}
              {showAirportTab && !showResult && (
                <div className="w-full pt-1.5">
                  <a
                    href="/services/chennai-airport-taxi/"
                    className="flex items-center justify-between p-2.5 px-3.5 bg-m3-surface-container-high hover:bg-m3-surface-container-highest border border-m3-outline-variant hover:border-m3-primary/40 rounded-m3-xl transition-all text-xs group cursor-pointer"
                    title={isTa ? 'சென்னை ஏர்போர்ட் டாக்ஸி முன்பதிவு' : 'Chennai Airport Taxi Transfers'}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1 sm:p-1.5 bg-m3-primary/10 text-m3-primary rounded-m3-full shrink-0 group-hover:scale-110 transition-transform">
                        <Plane className="w-3.5 h-3.5" />
                      </span>
                      <div className="truncate text-left">
                        <span className="font-bold text-m3-on-surface">
                          {isTa ? 'சென்னை ஏர்போர்ட் டாக்ஸியா?' : 'Need Chennai Airport Pickup / Drop?'}
                        </span>
                        <span className="hidden sm:inline text-m3-on-surface-variant ml-1.5 text-[11px]">
                          {isTa ? 'நிலையான கட்டணம் ₹650 முதல்' : 'Flat rates from ₹650 • Flight delay tracking'}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-m3-primary shrink-0 group-hover:translate-x-0.5 transition-transform">
                      {isTa ? 'கட்டணங்கள்' : 'Airport Cabs'} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </a>
                </div>
              )}
            </div>

            {/* Dynamic Fare Result & Actions Area — Rate Summary with Complete Itemized Breakdown */}
            {showResult && estimate > 0 && (
              <div ref={resultRef} className="pt-3 border-t border-m3-outline-variant/60 space-y-3 animate-in fade-in duration-200">
                
                {/* Rate Summary Card with Itemized Breakdown */}
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-xs">
                  {/* Official Quote Reference & 24-Hr Price Lock Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 text-[11px] flex-wrap">
                    <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {isTa ? `மேற்கோள் எண்: ${quoteRefId}` : `Quote Ref: ${quoteRefId}`}
                    </span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{isTa ? '24 மணிநேர கட்டணப் பாதுகாப்பு • வாட்ஸ்அப்பில் பெறுக' : 'Rate Locked 24 Hrs • Send to WhatsApp to Save'}</span>
                    </span>
                  </div>

                  {/* 1-Tap Vehicle Price Comparison Strip */}
                  <div className="space-y-1">
                    <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>{isTa ? 'வாகன ஒப்பீடு (1-தட்டலில் மாற்றவும்):' : 'Compare Vehicles (Tap to Switch):'}</span>
                      <span className="text-[10px] font-semibold text-m3-primary normal-case">
                        {activeTab === 'local' ? 'Flat Package' : `₹${breakdown?.rate_per_km || vehicles[vehicle]?.round_trip_rate || 14}/km · Fuel & Chauffeur Duty Included`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {COMPARISON_VEHICLES.map((v) => {
                        const vFare = getEstimatedFareFor(v.key);
                        const isSelected = vehicle === v.key;
                        const isDisabled = v.maxPax < parseInt(passengers, 10);
                        return (
                          <button
                            key={v.key}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setVehicle(v.key)}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1a73e8]/10 border-[#1a73e8] ring-1 ring-[#1a73e8] shadow-2xs'
                                : isDisabled
                                  ? 'bg-slate-100/60 border-slate-200/60 opacity-45 cursor-not-allowed'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[10.5px] font-bold truncate ${isSelected ? 'text-[#0b57d0]' : 'text-slate-600'}`}>
                                {v.name} ({v.pax})
                              </span>
                            </div>
                            <div className={`text-xs sm:text-sm font-extrabold mt-0.5 ${isSelected ? 'text-[#0b57d0]' : 'text-slate-900'}`}>
                              ₹{vFare.toLocaleString('en-IN')}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Local Package Alternative Banner inside Result Card */}
                  {isShortCityRoundTrip && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300/80 rounded-lg text-xs space-y-1.5 mb-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-amber-950 flex items-center gap-1.5">
                          <span>💡</span>
                          <span>{isTa ? 'மாற்றுத் திட்டம்: உள்ளூர் பேக்கேஜ்' : 'Better Alternative: Local City Package'}</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {isTa ? `₹${localSavings.toLocaleString('en-IN')} சேமிக்கலாம்` : `Save ₹${localSavings.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <p className="text-amber-900 text-[11px] leading-snug">
                        {isTa 
                          ? `இது ~${roundTripKm} கிமீ உள்ளூர் பயணம். 250 கிமீ அவுட்ஸ்டேஷன் மினிமம் கட்டணம் (₹${estimate.toLocaleString('en-IN')}) செலுத்துவதற்கு பதில், எங்கள் ${recLocalPkgLabel} பேக்கேஜ் (₹${recLocalPkgCost.toLocaleString('en-IN')}) தேர்வு செய்யலாம்.`
                          : `This is a ~${roundTripKm} km city ride. Instead of paying the 250 km outstation minimum (₹${estimate.toLocaleString('en-IN')}), our ${recLocalPkgLabel} package is just ₹${recLocalPkgCost.toLocaleString('en-IN')}.`}
                      </p>
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={handleSwitchToLocalPackage}
                          className="px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>{isTa ? `லோக்கல் பேக்கேஜிற்கு மாறு (₹${recLocalPkgCost.toLocaleString('en-IN')})` : `Switch to Local Package (₹${recLocalPkgCost.toLocaleString('en-IN')})`}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Header: Vehicle Name, Pax & Total Fare */}
                  <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base font-extrabold text-m3-on-surface">
                          {vehicle}
                        </span>
                        <span className="text-[10px] font-bold bg-[#1a73e8]/10 text-[#0b57d0] px-2 py-0.5 rounded-full">
                          {passengers} Pax
                        </span>
                      </div>
                      <div className="text-[11px] text-m3-on-surface-variant font-medium mt-0.5">
                        {activeTab === 'round' 
                          ? `~${(distance * 2).toFixed(0)} km Round Trip · ~${Math.round(tripReq.totalDrivingHours)} hrs driving` 
                          : activeTab === 'oneway' 
                            ? `~${distance?.toFixed(0)} km Drop · ~${Math.round(tripReq.oneWayHours)} hrs driving` 
                            : (isTa ? 'உள்ளூர் வாடகை' : 'City Rental')}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-m3-on-surface-variant font-medium">{isTa ? 'மொத்த கட்டணம்' : 'Total Fare'}</div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface font-heading leading-tight">
                        ₹{estimate.toLocaleString('en-IN')}{activeTab !== 'local' && <span className="text-xs sm:text-sm font-semibold text-m3-on-surface-variant ml-1">{isTa ? '+ கூடுதல்' : '+ Extra'}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Itemized Bill Lines */}
                  <div className="space-y-1.5 text-[13px] sm:text-sm">
                    <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                      <span>
                        {activeTab !== 'local' && breakdown?.chargeable_km && breakdown?.rate_per_km
                          ? (isTa ? `வாகன கட்டணம் (${Math.round(breakdown.chargeable_km)} கிமீ @ ₹${breakdown.rate_per_km}/கிமீ):` : `Cab Hire (${Math.round(breakdown.chargeable_km)} km @ ₹${breakdown.rate_per_km}/km):`)
                          : (isTa ? `வாகன கட்டணம் (${vehicle} • எரிபொருள் உட்பட):` : `Cab Hire (${vehicle} • Fuel included):`)}
                      </span>
                      <span className="font-bold text-m3-on-surface">₹{(breakdown?.km_cost || estimate).toLocaleString('en-IN')}</span>
                    </div>
                    {breakdown?.driver_bata > 0 && (
                      <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                        <span>{isTa ? `டிரைவர் பேட்டா (${days} ${days > 1 ? 'நாட்கள்' : 'நாள்'}):` : `Driver Allowance (${days} ${days > 1 ? 'Days' : 'Day'}):`}</span>
                        <span className="font-bold text-m3-on-surface">₹{breakdown.driver_bata.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {breakdown?.free_buffer_km > 0 && (
                      <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                        <span>{isTa ? `இலவச சுற்றிப்பார்த்தல் (+${breakdown.free_buffer_km.toFixed(0)} கிமீ):` : `Free Local Sightseeing (+${breakdown.free_buffer_km.toFixed(0)} km):`}</span>
                        <span className="font-bold text-emerald-700">₹0</span>
                      </div>
                    )}
                    {activeTab !== 'local' && (
                      <>
                        <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                          <span>{isTa ? 'மாநில அனுமதி வரி:' : 'State Permit:'}</span>
                          <span className="font-bold text-m3-on-surface">
                            {breakdown?.state_permit_est > 0
                              ? `₹${breakdown.state_permit_est.toLocaleString('en-IN')}`
                              : '₹0'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                          <span>{isTa ? 'டோல் கட்டணம்:' : 'Tolls:'}</span>
                          <span className="font-bold text-m3-on-surface">
                            {isTa ? 'கூடுதல்' : 'Extra'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                          <span>{isTa ? 'பார்க்கிங்:' : 'Parking:'}</span>
                          <span className="font-bold text-m3-on-surface">{isTa ? 'கூடுதல்' : 'Extra'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Bill Payment Split */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[13px] sm:text-sm">
                    <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                      <span>{isTa ? 'மொத்த கட்டணம்:' : 'Total Fare:'}</span>
                      <span className="font-bold text-m3-on-surface">
                        ₹{estimate.toLocaleString('en-IN')}{activeTab !== 'local' ? (isTa ? ' + கூடுதல்' : ' + Extra') : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 text-emerald-700 font-medium">
                      <span>{isTa ? 'முன்பணம்:' : 'Advance to Pay:'}</span>
                      <span className="font-bold">
                        -₹500
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-200/80">
                      <span className="text-sm sm:text-base font-extrabold text-m3-on-surface tracking-tight">
                        {isTa ? 'மீதி கட்டணம்' : 'Balance to Pay Driver'} <span className="text-xs font-medium text-m3-on-surface-variant">({isTa ? 'பயண முடிவில்' : 'After trip'})</span>:
                      </span>
                      <span className="text-lg sm:text-xl font-black text-[#1a73e8] tracking-tight font-heading shrink-0">
                        ₹{Math.max(0, estimate - 500).toLocaleString('en-IN')}{activeTab !== 'local' ? (isTa ? ' + கூடுதல்' : ' + Extra') : ''}
                      </span>
                    </div>
                  </div>

                  {/* Cut and Dried Notes */}
                  <div className="pt-2.5 border-t border-dashed border-slate-200 text-[11px] text-m3-on-surface-variant space-y-1.5">
                    {activeTab !== 'local' ? (
                      <>
                        <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                          <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            <strong>{isTa ? 'சேர்க்கப்பட்டுள்ளவை:' : 'Included in Fare:'}</strong> {isTa ? 'AC கார், 100% எரிபொருள் மற்றும் ஓட்டுநர் பேட்டா.' : 'Dedicated AC Cab, 100% Fuel & Driver Allowance.'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {isTa 
                              ? '1 நாள் = அதிகபட்சம் 24 மணிநேரம் / 250 கிமீ. கூடுதல் பயன்பாடு தனி கட்டணம்.'
                              : '1 Day = Up to 24 hrs / 250 km. Duration or km above package is billed extra.'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                          <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            <strong>{isTa ? 'சேர்க்கப்பட்டுள்ளவை:' : 'Included in Fare:'}</strong> {isTa ? 'AC கார், எரிபொருள் மற்றும் ஓட்டுநர் பேட்டா (சென்னை நகருக்குள்).' : 'Dedicated AC Cab, Fuel & Driver Allowance within Chennai.'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {isTa 
                              ? `கூடுதல் பயன்பாடு: ₹${vehicles[vehicle]?.extra_km_rate || 15}/கிமீ • ₹${vehicles[vehicle]?.extra_hr_rate || 150}/மணி.`
                              : `Extra usage beyond package: ₹${vehicles[vehicle]?.extra_km_rate || 15}/km • ₹${vehicles[vehicle]?.extra_hr_rate || 150}/hr.`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Optional Customer Contact for Faster Dispatch */}
                <div className="bg-m3-surface-container-low border border-m3-outline-variant/60 rounded-m3-lg p-2.5 sm:p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-m3-on-surface flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-m3-on-surface-variant" />
                      <span>{isTa ? 'உங்கள் பெயர் & மொபைல் எண் (விருப்பத்தேர்வு)' : 'Your Name & Mobile Number (Optional)'}</span>
                    </span>
                    <span className="text-[10px] text-m3-on-surface-variant font-medium bg-m3-surface px-2 py-0.5 rounded border border-m3-outline-variant/40">
                      {isTa ? 'விருப்பத்தேர்வு' : 'Faster Coordination'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder={isTa ? "பெயர் (எ.கா: குமார்)" : "Your Name (e.g. Kumar)"}
                      className="w-full h-9 bg-m3-surface border border-m3-outline-variant rounded-m3-md px-2.5 text-xs text-m3-on-surface placeholder:text-m3-on-surface-variant/50 focus:outline-none focus:border-m3-primary"
                    />
                    <input
                      type="tel"
                      maxLength={10}
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder={isTa ? "10 இலக்க மொபைல் எண்" : "10-Digit Mobile Number"}
                      className="w-full h-9 bg-m3-surface border border-m3-outline-variant rounded-m3-md px-2.5 text-xs font-mono text-m3-on-surface placeholder:text-m3-on-surface-variant/50 focus:outline-none focus:border-m3-primary"
                    />
                  </div>
                </div>

                {/* Direct Booking & Official WhatsApp Quotation Actions */}
                <div className="pt-1 space-y-1.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
                    <WhatsAppButton 
                      onClick={handleWhatsApp}
                      variant="filled"
                      size="md"
                      data-direct-whatsapp="true"
                      className="flex-1 px-5 py-3.5 min-h-[46px] text-sm font-bold shadow-m3-1 justify-center active:scale-[0.99]"
                      text={isTa ? `வாட்ஸ்அப்பில் மேற்கோள் & முன்பதிவு (₹${estimate.toLocaleString('en-IN')})` : `Send Quote & Book ${vehicle} on WhatsApp (₹${estimate.toLocaleString('en-IN')})`}
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
                  <p className="text-[11px] text-emerald-800 font-semibold text-center bg-emerald-50/80 border border-emerald-200/70 rounded-lg py-1 px-2.5">
                    {isTa
                      ? `✓ வாட்ஸ்அப்பில் மேற்கோள் (${quoteRefId}) • ✓ வண்டி & ஓட்டுநர் ஒதுக்கீடு • ✓ முன்பதிவு செய்ய ₹500 முன்பணம் மட்டும்`
                      : `✓ Lock Rate 24 Hrs (${quoteRefId}) • ✓ Reserve Cab & Driver • ✓ Advance ₹500 Only After Confirmation`}
                  </p>
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
                            {isTa ? 'நிலையான கட்டணம் ₹650 முதல்' : 'Flat rates from ₹650'}
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

      {/* Sticky Mobile Quote Bar when user scrolls past the calculated result */}
      {showResult && estimate > 0 && showStickyQuoteBar && (
        <div
          role="region"
          aria-label="Sticky Quotation Summary"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_20px_-4px_rgba(0,0,0,0.12)] px-3 py-2.5 sm:px-5 animate-in slide-in-from-bottom-4 duration-200"
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-2.5 pr-20 sm:pr-24">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  {quoteRefId}
                </span>
                <span className="text-xs font-extrabold text-slate-900 truncate">
                  {vehicle}
                </span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-[#0b57d0] leading-tight">
                ₹{estimate.toLocaleString('en-IN')}
                <span className="text-[10px] font-medium text-slate-500 ml-1">
                  {activeTab !== 'local' ? (isTa ? '+ கூடுதல்' : '+ Extra') : 'All-Inclusive'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>{isTa ? 'மேற்கோள் பெறுக' : 'Send Quote'}</span>
            </button>
          </div>
        </div>
      )}

      {mounted && (
        <LocationPicker
          isOpen={locationPickerOpen}
          onClose={() => setLocationPickerOpen(false)}
          onConfirm={handleLocationConfirm}
          type={pickerField}
          initialAddress={pickerField === 'pickup' ? pickup : drop}
          isTa={isTa}
        />
      )}
    </section>
  );
}

