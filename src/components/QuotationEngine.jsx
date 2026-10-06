import React, { useState, useEffect, useRef } from 'react';
import { Car, LocateFixed, Calendar, Calculator, Send, ArrowRight, Repeat, Users, User, AlertCircle, Navigation, ShieldCheck, Clock, X, ChevronDown, ChevronRight, CheckCircle2, Plane, ArrowUpDown } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
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
    name: 'Family SUV',
    models: 'Ertiga AC',
    pax: '6 Pax',
    maxPax: 6,
    bags: '3 Bags',
    tag: 'Most Popular'
  },
  {
    key: 'Innova Crysta',
    name: 'Executive MPV',
    models: 'Innova Crysta',
    pax: '7 Pax',
    maxPax: 7,
    bags: '4 Bags',
    tag: 'Premium'
  },
  {
    key: 'Tempo Traveller',
    name: 'Minibus',
    models: 'Tempo 12-Seater',
    pax: '12 Pax',
    maxPax: 12,
    bags: '8 Bags',
    tag: 'Group'
  }
];

// Tab configuration with Savaari-style explanatory subtext to eliminate customer doubt
const TAB_CONFIG = {
  oneway: {
    titleEn: 'One Way',
    titleTa: 'ஒரு வழி',
    subEn: 'Drop-off Only',
    subTa: 'டிராப் மட்டும்',
  },
  round: {
    titleEn: 'Round Trip',
    titleTa: 'இரு வழி',
    subEn: 'Return With Same Cab',
    subTa: 'அதே வண்டியில் திரும்புதல்',
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



export default function QuotationEngine({ 
  currentLang = 'en', 
  showAirportTab = true, 
  showBookingButton = true, 
  title = '', 
  subtitle = '',
  headerIcon = null,
  variant = "default",
  initialTab = 'oneway',
  allowedTabs = null
}) {
  const isTa = currentLang === 'ta';
  const labels = siteContent.ui_labels;
  const displayTitle = title || (isTa ? labels.book_your_ride_ta : labels.book_your_ride);

  const { scrollInputAboveKeyboard } = useVirtualKeyboard();

  const [activeTab, setActiveTab] = useState(initialTab || 'oneway');
  const [localPackage, setLocalPackage] = useState('8hr80km');
  const [vehicle, setVehicle] = useState('Swift Dzire');
  const [passengers, setPassengers] = useState('4');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState(() => (initialTab === 'local' ? 'Local Sightseeing (Chennai City)' : ''));
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
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
  const [showResult, setShowResult] = useState(false);
  const [errors, setErrors] = useState({});
  const [botField, setBotField] = useState(''); // Honeypot
  const [gettingLocation, setGettingLocation] = useState(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [pickerField, setPickerField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [requestedDriver, setRequestedDriver] = useState('');
  const stableFormId = "booking-form-v1"; // Using stable ID for hydration safety

  // Auto-sync days count from Pickup & Return dates for round trips
  useEffect(() => {
    if (activeTab === 'round') {
      const computed = calculateCalendarDays(date, returnDate);
      setDays(computed);
    } else {
      setDays(1);
    }
  }, [activeTab, date, returnDate]);

  const handlePickupDateChange = (val) => {
    setDate(val);
    // If round trip and returnDate is earlier than new pickup date, advance returnDate
    if (activeTab === 'round' && returnDate && new Date(returnDate) < new Date(val)) {
      const p = new Date(val);
      p.setHours(21, 0, 0, 0);
      const year = p.getFullYear();
      const month = String(p.getMonth() + 1).padStart(2, '0');
      const day = String(p.getDate()).padStart(2, '0');
      setReturnDate(`${year}-${month}-${day}T21:00`);
    }
  };

  const handleReturnDateChange = (val) => {
    setReturnDate(val);
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
    if (estimate > 0) {
      trackEvent('estimate_calculated', { vehicle, trip_type: activeTab, estimate, distance });
    }
  }, [estimate]);

  // Auto-scroll to result panel when estimate appears
  useEffect(() => {
    if (showResult && resultRef.current) {
      scrollToResult();
    }
  }, [showResult, estimate]);

  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const pickupValueRef = useRef('');
  const dropValueRef = useRef('');
  const autocompleteInitializedRef = useRef(false);
  const resultRef = useRef(null);

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
    const pax = parseInt(passengers);
    const currentCapacity = VEHICLE_CAPACITY[vehicle] ?? 4;
    if (currentCapacity < pax) {
      // Pick the smallest vehicle that fits the group
      const nextVehicle = vehicleOptions.find(v => (VEHICLE_CAPACITY[v] ?? 0) >= pax);
      if (nextVehicle) setVehicle(nextVehicle);
    }
    setShowResult(false);
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

  const resolveFallbackDistance = (o, d) => {
    const fallback = findKnownDistance(o, d);
    if (fallback) {
      setDistance(fallback.distance);
      setDuration(fallback.duration);
    } else {
      // Conservative estimate for outstation trip when distance API is unreachable
      const fallbackKm = activeTab === 'round' ? 250 : 130;
      setDistance(fallbackKm);
      setDuration(activeTab === 'round' ? 'Full Day' : '3-4 hrs (Est)');
    }
    setLoading(false);
    setShowResult(true);
    setShowBreakdown(true);
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
            if (status === 'OK' && response?.rows?.[0]?.elements?.[0]?.status === 'OK') {
              const element = response.rows[0].elements[0];
              const distValue = Math.round((element.distance.value / 1000) * 10) / 10;
              const durText = element.duration.text;
              setDistance(distValue);
              setDuration(durText);
              setLoading(false);
              setShowResult(true);
              setShowBreakdown(true);
              return;
            }
            resolveFallbackDistance(o, d);
          }
        );
        return;
      } catch (err) {
        console.warn('Google Maps Distance Matrix failed, using local fallback:', err);
      }
    }

    resolveFallbackDistance(o, d);
  };

  const handleCalculateCost = () => {
    if (activeTab === 'local') {
      setShowResult(true);
      setShowBreakdown(true);
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
    if (distance && vehicleData) {
      let totalCost = 0;
      const rate = activeTab === 'round' ? vehicleData.round_trip_rate : vehicleData.one_way_rate;
      const bata = vehicleData.driver_bata;
      let breakdownObj = {};

      if (activeTab === 'round') {
        const minKm = (days || 1) * vehicleData.min_km_per_day;
        const actualRoundTripKm = distance * 2;
        const chargeableKm = Math.max(minKm, actualRoundTripKm);
        const bataTotal = (days || 1) * bata;
        const kmCost = chargeableKm * rate;
        totalCost = kmCost + bataTotal;

        breakdownObj = {
          base_km: minKm,
          actual_km: actualRoundTripKm,
          chargeable_km: chargeableKm,
          rate_per_km: rate,
          km_cost: kmCost,
          driver_bata: bataTotal,
          days: days || 1
        };
      } else {
        // One Way / Drop Trip / Airport
        // INTELLIGENT CITY TRANSFER: Trips < 50 km are within-city/airport transfers.
        // Applying outstation 130 km minimum would grossly overcharge (e.g. ₹2,380 for a ₹950 airport ride).
        // For short city/airport hops, charge actual distance * rate with no outstation minimum.
        const isOutstationDrop = distance >= 50;
        let chargeableKm, kmCost;
        if (isOutstationDrop) {
          const minDropKm = vehicleData.min_drop_km || 130;
          chargeableKm = Math.max(minDropKm, distance);
          kmCost = chargeableKm * rate;
          totalCost = kmCost + bata;
          breakdownObj = {
            base_km: minDropKm,
            actual_km: distance,
            chargeable_km: chargeableKm,
            rate_per_km: rate,
            km_cost: kmCost,
            driver_bata: bata,
            days: 1,
            is_city: false
          };
        } else {
          // City / Airport transfer — no outstation minimum, no driver bata
          chargeableKm = distance;
          kmCost = chargeableKm * rate;
          totalCost = kmCost;
          breakdownObj = {
            base_km: 0,
            actual_km: distance,
            chargeable_km: chargeableKm,
            rate_per_km: rate,
            km_cost: kmCost,
            driver_bata: 0,
            days: 1,
            is_city: true
          };
        }
      }
      // Round to nearest 10 for cleaner pricing
      setEstimate(Math.round(totalCost / 10) * 10);
      setBreakdown(breakdownObj);
    } else if (activeTab === 'local' && vehicleData) {
      // Fixed rates for local packages
      const pkgCost = (
        localPackage === '5hr50km' ? vehicles[vehicle]?.local_5hr_pkg
        : localPackage === '8hr80km' ? vehicles[vehicle]?.local_8hr_pkg
        : vehicles[vehicle]?.local_12hr_pkg
      ) || 2000;
      setEstimate(pkgCost);
      setBreakdown({
        package: localPackage,
        package_cost: pkgCost,
        driver_bata: 'Included',
        inclusions: [localPackage === '5hr50km' ? '50km Limit' : localPackage === '8hr80km' ? '80km Limit' : '120km Limit', 'Fuel', 'Driver Service']
      });
    } else {
      setEstimate(0);
      setBreakdown(null);
    }
  }, [distance, vehicle, activeTab, days, localPackage]);

  useEffect(() => {
    if (activeTab === 'local') {
      setDrop('Local Sightseeing (Chennai City)');
      if (pickup === 'Chennai International Airport (MAA)') setPickup('');
    }
  }, [activeTab, localPackage]);

  const handleWhatsApp = async () => {
    // 1. Honeypot Check
    if (botField) {
      console.warn("Bot detected");
      return;
    }

    // 2. Validate All Fields
    const isDateValid = date ? activeValidate('date', date) : true;
    const isReturnDateValid = (activeTab === 'round' && returnDate) ? activeValidate('date', returnDate) : true;
    const isPickupValid = pickup.length > 0;
    const isDropValid = drop.length > 0;

    if (!isDateValid || !isReturnDateValid || !isPickupValid || !isDropValid) {
      setErrors(prev => ({
        ...prev,
        global: "Please fix errors above"
      }));
      trackEvent('booking_validation_error', {
        trip_type: activeTab
      });
      return;
    }

    // 3. Rate Limit
    if (!checkRateLimit()) return;

    trackEvent('booking_submit_attempt', { trip_type: activeTab, vehicle, estimate });

    // 4. Send Data to Sheet
    const bookingData = {
      date: new Date().toLocaleString(),
      tripType: activeTab,
      name: 'Not Provided',
      phone: 'Not Provided',
      pickup: sanitizeInput(pickup),
      drop: sanitizeInput(drop),
      vehicle,
      passengers,
      distance: distance ? distance.toFixed(1) : '',
      estimate,
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

    // 5. Open WhatsApp
    const driverLine = requestedDriver ? `Requested Driver: *${requestedDriver}*\n` : '';
    const message = `New Booking Request

Trip Details:
${driverLine}Type: ${activeTab === 'local' ? `Local Package (${localPackage})` : activeTab === 'round' ? 'Round Trip' : 'One Way'}
Vehicle: ${vehicle}
Passengers: ${passengers}
Pickup: ${sanitizeInput(pickup)}
Drop: ${sanitizeInput(drop)}
Pickup Date & Time: ${date ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not Specified'}
${activeTab === 'round' ? `Return Date & Time: ${returnDate ? new Date(returnDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not Specified'}\nTrip Duration: ${days} ${days > 1 ? 'Days' : 'Day'}` : ''}
Distance: ${distance ? distance.toFixed(1) : 'N/A'} km ${activeTab === 'round' ? `(Round Trip: ${(distance * 2).toFixed(1)} km)` : ''}
Duration: ${duration || 'N/A'}
Est. Cost: Rs. ${estimate}

Inclusions: Fuel, Driver Bata (Incl. Food/Stay), GST
Exclusions: Tolls, Parking, State Permit (if any)

Please confirm availability.`;

    trackEvent('booking_conversion_whatsapp', {
      estimate,
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

  if (variant === 'card') {
    return (
      <div className="w-full max-w-2xl mx-auto bg-m3-surface rounded-m3-xl shadow-m3-2 border border-m3-outline-variant overflow-hidden font-sans">
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

        <div className="p-4 pb-1 text-center">
          {headerIcon && (
            <div className="w-10 h-10 rounded-m3-full bg-m3-primary-container flex items-center justify-center mx-auto mb-2">
              {headerIcon === 'car' ? (
                <Car className="w-5 h-5 text-m3-primary" />
              ) : headerIcon === 'clock' ? (
                <Clock className="w-5 h-5 text-m3-primary" />
              ) : (
                headerIcon
              )}
            </div>
          )}
          <h3 className="text-lg sm:text-xl font-bold text-m3-on-surface font-heading">{displayTitle}</h3>
          {subtitle && (
            <p className="text-xs text-m3-on-surface-variant mt-0.5 font-normal">
              {subtitle}
            </p>
          )}
          {requestedDriver && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-m3-surface-container-high border border-m3-outline-variant rounded-m3-full px-3 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-m3-primary shrink-0" />
              <span className="text-xs font-bold text-m3-primary">Booking for: {requestedDriver}</span>
            </div>
          )}
        </div>

        {visibleTabs.length > 1 && (
          <div className="px-3 sm:px-6 mb-3">
            <div role="tablist" aria-label={isTa ? 'பயண வகை' : 'Trip Type'} className="bg-m3-surface-container-high p-1 rounded-m3-full flex gap-1 overflow-x-auto whitespace-nowrap hide-scrollbar border border-m3-outline-variant">
              {visibleTabs.map(tab => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => { setActiveTab(tab); setShowResult(false); }}
                  className={`flex-1 py-2 px-2.5 sm:px-4 text-xs font-bold rounded-m3-full transition-all flex items-center justify-center gap-1 min-h-[38px] sm:min-h-[42px] cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary ${activeTab === tab ? 'bg-m3-primary text-m3-on-primary shadow-m3-1' : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest'
                    }`}
                >
                  <span className="capitalize">{tab === 'local' ? (isTa ? 'லோக்கல் பேக்கேஜ்' : 'Local Package') : tab === 'oneway' ? (isTa ? 'ஒரு வழி' : 'One Way') : (isTa ? 'இரு வழி' : 'Round Trip')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-3 sm:px-6 pb-5 space-y-3">
          {errors.global && (
            <div className="p-2.5 bg-m3-error-container/40 text-m3-error text-xs font-bold rounded-m3-md flex items-center gap-2 border border-m3-error/20">
              <AlertCircle className="w-4 h-4" /> {errors.global}
            </div>
          )}

            {/* Locations */}
            <div className="space-y-2.5">
              {activeTab === 'local' && (
                <div className="flex justify-center mb-1">
                  <div className="bg-m3-surface-container-high p-1 rounded-m3-lg flex text-xs font-bold w-full border border-m3-outline-variant">
                    {['5hr50km', '8hr80km', '12hr120km'].map(pkg => (
                      <button
                        key={pkg}
                        onClick={() => setLocalPackage(pkg)}
                        className={`flex-1 px-2 py-2 rounded-m3-md transition-all min-h-[36px] font-bold ${localPackage === pkg ? 'bg-m3-surface text-m3-primary shadow-m3-1' : 'text-m3-on-surface-variant hover:text-m3-on-surface'}`}
                      >
                        {pkg === '5hr50km' ? (isTa ? '5 மணி / 50 கிமீ' : '5Hrs / 50Kms') : pkg === '8hr80km' ? (isTa ? '8 மணி / 80 கிமீ' : '8Hrs / 80Kms') : (isTa ? '12 மணி / 120 கிமீ' : '12Hrs / 120Kms')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {['Pickup', 'Drop'].map((type) => (
                (type === 'Pickup' || activeTab !== 'local') && (
                <div key={type} className="relative group">
                  <div className="mb-1">
                    <label
                      htmlFor={`${stableFormId}-${type.toLowerCase()}`}
                      className="block text-badge font-bold text-m3-on-surface-variant uppercase tracking-wide"
                    >
                      {type === 'Pickup' ? (isTa ? 'பிக்கப் இடம்' : 'Pickup Location') : (isTa ? 'டிராப் இடம்' : 'Drop Location')}
                    </label>
                  </div>

                  <div className={`relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border rounded-m3-md px-3 py-2 sm:py-2.5 min-h-[44px] sm:min-h-[48px] transition-all ${
                    errors[type.toLowerCase()]
                      ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/20'
                      : 'border-m3-outline-variant focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary'
                  }`}>
                    <input
                      id={`${stableFormId}-${type.toLowerCase()}`}
                      ref={type === 'Pickup' ? pickupInputRef : dropInputRef}
                      type="text"
                      value={type === 'Pickup' ? pickup : drop}
                      onFocus={handleLocationFocus}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (type === 'Pickup') {
                          setPickup(val);
                          pickupValueRef.current = val;
                        } else {
                          setDrop(val);
                          dropValueRef.current = val;
                        }
                        setDistance(null);
                        setShowResult(false);
                        setErrors(prev => {
                          const next = { ...prev };
                          delete next.global;
                          delete next.location;
                          delete next[type.toLowerCase()];
                          return next;
                        });
                      }}
                      id={activeTab === 'local' ? (type === 'Pickup' ? 'local-pickup-input' : 'local-drop-input') : (type === 'Pickup' ? 'pickup-input' : 'drop-input')}
                      placeholder={isTa ? 'நகரம் / பகுதியை உள்ளிடவும்' : `Enter ${type} City / Area`}
                      className="bg-transparent w-full outline-none text-sm font-semibold text-m3-on-surface pr-16 placeholder:text-m3-on-surface-variant placeholder:text-xs placeholder:font-normal"
                    />

                    {/* Right side controls: Clear Button + Current Location (GPS) */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {(type === 'Pickup' ? pickup : drop) && (
                        <button
                          type="button"
                          onClick={() => {
                            type === 'Pickup' ? setPickup('') : setDrop('');
                            setShowResult(false);
                          }}
                          className="w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-full transition-colors text-m3-on-surface-variant hover:text-m3-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary"
                          title="Clear text"
                          aria-label="Clear text"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => getCurrentLocation(type.toLowerCase())}
                        disabled={gettingLocation === type.toLowerCase()}
                        className="w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-sm transition-colors text-m3-on-surface-variant hover:text-m3-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary"
                        title={isTa ? 'தற்போதைய இருப்பிடத்தைப் பயன்படுத்தவும்' : 'Use current location'}
                        aria-label={isTa ? 'தற்போதைய இருப்பிடத்தைப் பயன்படுத்தவும்' : `Use current location for ${type.toLowerCase()}`}
                      >
                        <LocateFixed className={`w-4 h-4 ${gettingLocation === type.toLowerCase() ? 'animate-spin text-m3-primary' : ''}`} />
                      </button>
                    </div>
                  </div>
                  {errors[type.toLowerCase()] && (
                    <p className="mt-1 text-xs text-m3-error font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors[type.toLowerCase()]}</span>
                    </p>
                  )}
                </div>
                )
              ))}

              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-0.5">
                {/* Passengers Selection */}
                <div className="relative group">
                  <label htmlFor={`${stableFormId}-passengers`} className="block text-badge font-bold text-m3-on-surface-variant uppercase tracking-wide mb-1 truncate">
                    {isTa ? 'பயணிகள்' : 'Passengers'}
                  </label>
                  <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-m3-md px-2.5 py-2 min-h-[44px] sm:min-h-[48px] focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary transition-all cursor-pointer">
                    <Users className="w-3.5 h-3.5 text-m3-on-surface-variant mr-1.5 shrink-0 pointer-events-none" />
                    <select
                      id={`${stableFormId}-passengers`}
                      value={passengers}
                      onChange={(e) => { setPassengers(e.target.value); setShowResult(false); }}
                      className="bg-transparent w-full outline-none text-xs sm:text-sm text-m3-on-surface font-semibold appearance-none cursor-pointer pr-5 py-0.5 truncate"
                    >
                      {['4', '6', '7', '12'].map(n => (
                        <option key={n} value={n}>
                          {n} {isTa ? 'பயணிகள்' : 'Pax'} + {isTa ? 'டிரைவர்' : 'Driver'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Vehicle Selection */}
                <div className="relative group">
                  <label htmlFor={`${stableFormId}-vehicle`} className="block text-badge font-bold text-m3-on-surface-variant uppercase tracking-wide mb-1 truncate">
                    {isTa ? 'வாகனம்' : 'Vehicle'}
                  </label>
                  <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-m3-md px-2.5 py-2 min-h-[44px] sm:min-h-[48px] focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary transition-all cursor-pointer">
                    <Car className="w-3.5 h-3.5 text-m3-on-surface-variant mr-1.5 shrink-0 pointer-events-none" />
                    <select
                      id={`${stableFormId}-vehicle`}
                      value={vehicle}
                      onChange={(e) => { setVehicle(e.target.value); setShowResult(false); }}
                      className="bg-transparent w-full outline-none text-xs sm:text-sm text-m3-on-surface font-semibold appearance-none cursor-pointer pr-5 py-0.5 truncate"
                    >
                      {vehicleOptions.map(v => {
                        const cap = VEHICLE_CAPACITY[v] ?? 4;
                        const pax = parseInt(passengers);
                        const disabled = cap < pax;
                        return (
                          <option key={v} value={v} disabled={disabled}>
                            {v}{disabled ? ` (max ${cap} pax)` : ''}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

              </div>
            </div>

            {/* Passenger-Vehicle capacity warning (desktop) */}
            {(() => {
              const cap = VEHICLE_CAPACITY[vehicle] ?? 4;
              const pax = parseInt(passengers);
              if (cap < pax) {
                return (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-m3-md bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <span>{vehicle} seats max {cap} passengers. Please select a larger vehicle for {pax} pax.</span>
                  </div>
                );
              }
              return null;
            })()}

            <button
              type="button"
              disabled={loading}
              onPointerDown={() => {
                if (typeof document !== 'undefined') {
                  if (document.activeElement && typeof document.activeElement.blur === 'function') {
                    document.activeElement.blur();
                  }
                  const pacs = document.querySelectorAll('.pac-container');
                  pacs.forEach(p => { p.style.display = 'none'; });
                }
              }}
              onClick={handleCalculateCost}
              className="w-full max-w-[260px] sm:max-w-[280px] mx-auto bg-m3-primary hover:bg-slate-900 text-m3-on-primary font-bold py-3 rounded-m3-full transition-all flex items-center justify-center gap-2 shadow-m3-1 hover:shadow-m3-2 text-sm sm:text-base min-h-[46px] sm:min-h-[50px] cursor-pointer active:scale-[0.98] disabled:opacity-75 border border-white/10 group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isTa ? 'கணக்கிடுகிறது...' : 'Calculating Fare...'}</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>{isTa ? 'செலவைக் கணக்கிடுங்கள்' : 'Calculate Cost'}</span>
                </>
              )}
            </button>

            {/* Smart Airport Quick-Access Callout (Below Calculate Cost) */}
            {showAirportTab && !showResult && (
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

            {/* Results Section — Simple, Cut and Dried */}
            {showResult && estimate > 0 && (
              <div ref={resultRef} className="bg-m3-surface-container-low rounded-m3-xl p-3.5 sm:p-4 border border-m3-outline-variant shadow-m3-1 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* 1. Trip Route Meta & Vehicle */}
                <div className="flex items-center justify-between gap-2 border-b border-m3-outline-variant/40 pb-2">
                  <div className="text-xs sm:text-sm font-semibold text-m3-on-surface flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Transparent Estimate
                    </span>
                    {activeTab === 'local' ? (
                      <span>{localPackage === '5hr50km' ? '5h / 50 km' : localPackage === '8hr80km' ? '8h / 80 km' : '12h / 120 km'}</span>
                    ) : distance ? (
                      <span>{activeTab === 'round' ? (distance * 2).toFixed(1) : distance.toFixed(1)} km</span>
                    ) : null}
                    {duration && <span className="text-m3-outline-variant">•</span>}
                    {duration && <span className="text-m3-on-surface-variant font-normal">{duration}</span>}
                  </div>
                  <span className="text-xs font-bold text-m3-primary bg-m3-surface-container px-2.5 py-0.5 rounded-m3-full border border-m3-outline-variant/80">
                    {vehicle}
                  </span>
                </div>

                {/* 2. Total Fare & Rate summary + Breakdown Link */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-m3-on-surface tracking-tight font-heading leading-none">
                      ₹ {estimate.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[11px] sm:text-xs text-m3-on-surface-variant font-medium mt-1 leading-relaxed">
                      <span className="text-m3-on-surface font-semibold">
                        ₹{activeTab === 'round' ? vehicles[vehicle].round_trip_rate : vehicles[vehicle].one_way_rate}/km
                      </span>
                      {' · '}
                      <span>{isTa ? 'டிரைவர் பேட்டா & எரிபொருள் சேர்க்கப்பட்டுள்ளது' : 'Incl. Driver Bata & Fuel'}</span>
                      {' · '}
                      <span className="opacity-80">{isTa ? 'டோல் தனி' : 'Tolls extra'}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFullBreakdown(true)}
                    className="inline-flex items-center gap-0.5 text-[11px] sm:text-xs font-bold text-m3-primary hover:text-m3-primary/80 transition-colors cursor-pointer shrink-0 mt-0.5 bg-m3-surface px-2 py-1 rounded-m3-md border border-m3-outline-variant"
                  >
                    <span>{isTa ? 'கட்டண விவரம்' : 'Fare Breakdown'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Short local distance guidance */}
                {distance && distance < 45 && activeTab !== 'local' && (
                  <div className="p-2.5 rounded-m3-lg bg-amber-500/10 border border-amber-500/30 text-xs flex items-center justify-between gap-2">
                    <span className="text-amber-800 dark:text-amber-300 font-medium text-[11px] leading-snug">
                      Travelling within Chennai ({distance.toFixed(1)} km)? Local Hourly Packages (from ₹1,350) or Airport flat tariffs offer better fixed pricing.
                    </span>
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent('switch-calculator-tab', { detail: 'local' }))}
                      className="shrink-0 px-2.5 py-1 rounded-m3-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-micro transition-all cursor-pointer"
                    >
                      Local Packages
                    </button>
                  </div>
                )}

                {/* 3. Date & Time Selection */}
                {activeTab === 'round' ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider">
                      <span>{isTa ? 'பயண தேதிகள்' : 'Trip Schedule'}</span>
                      <span className="text-m3-primary normal-case font-semibold bg-m3-primary/10 px-2 py-0.5 rounded-m3-full text-[10px] sm:text-[11px]">
                        {days} {days > 1 ? (isTa ? 'நாட்கள்' : 'Days') : (isTa ? 'நாள்' : 'Day')} ({days * (vehicles[vehicle]?.min_km_per_day || 250)} km min)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label htmlFor={`${stableFormId}-pickup-date`} className="block text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-wider mb-0.5">
                          {isTa ? 'புறப்படும் தேதி & நேரம்' : 'Pickup Date & Time'}
                        </label>
                        <div className="flex items-center bg-m3-surface border border-m3-outline-variant rounded-m3-md px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary transition-all">
                          <Calendar className="text-m3-primary mr-1.5 w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <input
                            id={`${stableFormId}-pickup-date`}
                            type="datetime-local"
                            value={date}
                            onChange={(e) => handlePickupDateChange(e.target.value)}
                            className="bg-transparent w-full outline-none text-xs text-m3-on-surface font-semibold cursor-pointer"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor={`${stableFormId}-return-date`} className="block text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-wider mb-0.5">
                          {isTa ? 'திரும்பும் தேதி & நேரம்' : 'Return Date & Time'}
                        </label>
                        <div className="flex items-center bg-m3-surface border border-m3-outline-variant rounded-m3-md px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary transition-all">
                          <Calendar className="text-m3-primary mr-1.5 w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <input
                            id={`${stableFormId}-return-date`}
                            type="datetime-local"
                            value={returnDate}
                            min={date}
                            onChange={(e) => handleReturnDateChange(e.target.value)}
                            className="bg-transparent w-full outline-none text-xs text-m3-on-surface font-semibold cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label htmlFor={`${stableFormId}-date-result`} className="block text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider">
                      {isTa ? 'பயண தேதி & நேரம்' : 'Pickup Date & Time'}
                    </label>
                    <div className="flex items-center bg-m3-surface border border-m3-outline-variant rounded-m3-md px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary transition-all">
                      <Calendar className="text-m3-primary mr-2 w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <input
                        id={`${stableFormId}-date-result`}
                        type="datetime-local"
                        value={date}
                        onChange={(e) => handlePickupDateChange(e.target.value)}
                        className="bg-transparent w-full outline-none text-xs sm:text-sm text-m3-on-surface font-semibold cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Booking Action */}
                <WhatsAppButton
                  onClick={handleWhatsApp}
                  fullWidth
                  variant="filled"
                  size="md"
                  text={isTa ? 'வாட்ஸ்அப்பில் முன்பதிவு செய்ய' : 'Book on WhatsApp'}
                />
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
      </div>
    );
  }

  // Mobile / Default Variant
  return (
    <div className="bg-m3-surface rounded-m3-xl shadow-m3-2 border border-m3-outline-variant overflow-hidden font-sans">
      {/* Hidden Honeypot */}
      <input
        type="text"
        name="website_url"
        style={{ display: 'none' }}
        value={botField}
        onChange={(e) => setBotField(e.target.value)}
        tabIndex={-1}
      />

      <h3 className="text-lg font-bold text-center text-m3-on-surface pt-4 px-4 border-b border-m3-outline-variant font-heading">
        {displayTitle}
        {requestedDriver && (
          <div className="mt-2 mb-3 inline-flex items-center gap-2 bg-m3-surface-container-high border border-m3-outline-variant rounded-m3-full px-3 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-m3-primary shrink-0" />
            <span className="text-xs font-bold text-m3-primary">Booking for: {requestedDriver}</span>
          </div>
        )}
      </h3>

      {/* Tabs */}
      {visibleTabs.length > 1 && (
        <div className="flex border-b border-m3-outline-variant">
          {visibleTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs text-center font-bold uppercase flex items-center justify-center gap-1 transition-all ${activeTab === tab ? 'text-m3-primary border-b-2 border-m3-primary bg-m3-primary-container/30' : 'text-m3-on-surface-variant hover:text-m3-on-surface'
                }`}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {tab === 'local' ? <Clock className="w-3.5 h-3.5" /> : tab === 'round' ? <Repeat className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5 text-yellow-400" />}
              <span>{tab === 'local' ? (isTa ? 'லோக்கல்' : 'Local') : tab === 'round' ? (isTa ? 'இரு வழி' : 'Round Trip') : (isTa ? 'ஒரு வழி' : 'One Way')}</span>
            </button>
          ))}
        </div>
      )}

      <div className="p-4 space-y-3">
        {activeTab === 'local' && (
          <div className="flex justify-center mb-2">
            <div className="bg-m3-surface-container-high p-1 rounded-m3-lg flex text-micro font-bold border border-m3-outline-variant">
              {['5hr50km', '8hr80km', '12hr120km'].map(pkg => (
                <button
                  key={pkg}
                  onClick={() => setLocalPackage(pkg)}
                  className={`px-2 py-1.5 rounded-m3-md transition-all ${localPackage === pkg ? 'bg-m3-surface text-m3-primary font-bold shadow-m3-1' : 'text-m3-on-surface-variant hover:text-m3-on-surface'}`}
                  aria-pressed={localPackage === pkg}
                >
                  {pkg === '5hr50km' ? (isTa ? '5 மணி / 50 கிமீ' : '5Hrs / 50Kms') : pkg === '8hr80km' ? (isTa ? '8 மணி / 80 கிமீ' : '8Hrs / 80Kms') : (isTa ? '12 மணி / 120 கிமீ' : '12Hrs / 120Kms')}
                </button>
              ))}
            </div>
          </div>
        )}

        {errors.global && (
          <div className="p-2 bg-m3-error-container/40 text-m3-error text-micro font-bold rounded-m3-md flex items-center gap-1 border border-m3-error/20">
            <AlertCircle className="w-3 h-3" /> {errors.global}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {['Pickup', 'Drop'].map((type) => (
            (type === 'Pickup' || activeTab !== 'local') && (
            <div key={type} className="col-span-2 relative group">
              <div className="mb-1">
                <label htmlFor={`${stableFormId}-mobile-${type}`} className="text-xs font-bold text-m3-on-surface-variant uppercase tracking-wide block">
                  {isTa ? (type === 'Pickup' ? 'பிக்கப் இடம்' : 'டிராப் இடம்') : `${type} Location`}
                </label>
              </div>

              <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-m3-md px-3 py-2 min-h-[44px] focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition">
                <input
                  id={`${stableFormId}-mobile-${type}`}
                  ref={type === 'Pickup' ? pickupInputRef : dropInputRef}
                  value={type === 'Pickup' ? pickup : drop}
                  onFocus={handleLocationFocus}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (type === 'Pickup') {
                      setPickup(val);
                      pickupValueRef.current = val;
                    } else {
                      setDrop(val);
                      dropValueRef.current = val;
                    }
                    setDistance(null);
                    setShowResult(false);
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.global;
                      delete next.location;
                      return next;
                    });
                  }}
                  placeholder={isTa ? 'இடத்தை உள்ளிடவும்' : `Enter ${type} City / Area`}
                  className="bg-transparent w-full outline-none text-sm font-semibold text-m3-on-surface pr-16 placeholder:text-m3-on-surface-variant placeholder:text-xs placeholder:font-normal"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {(type === 'Pickup' ? pickup : drop) && (
                    <button
                      type="button"
                      onClick={() => {
                        type === 'Pickup' ? setPickup('') : setDrop('');
                        setShowResult(false);
                      }}
                      className="w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-full transition-colors text-m3-on-surface-variant hover:text-m3-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary"
                      aria-label="Clear input"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => getCurrentLocation(type.toLowerCase())}
                    disabled={gettingLocation === type.toLowerCase()}
                    className="w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-sm transition-colors text-m3-on-surface-variant hover:text-m3-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary"
                    title={isTa ? 'தற்போதைய இருப்பிடம்' : 'Use Current Location'}
                    aria-label={isTa ? 'தற்போதைய இருப்பிடம்' : `Use current location for ${type.toLowerCase()}`}
                  >
                    <LocateFixed className={`w-4 h-4 ${gettingLocation === type.toLowerCase() ? 'animate-spin text-m3-primary' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
            )
          ))}

          <div className="col-span-1">
            <label htmlFor={`${stableFormId}-mobile-pax`} className="text-badge font-bold text-m3-on-surface-variant uppercase mb-1 block truncate">
              {isTa ? 'பயணிகள்' : 'Passengers'}
            </label>
            <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-m3-md px-2.5 py-2 min-h-[44px] focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition cursor-pointer">
              <Users className="w-3.5 h-3.5 text-m3-on-surface-variant mr-1.5 shrink-0 pointer-events-none" />
              <select
                id={`${stableFormId}-mobile-pax`}
                value={passengers}
                onChange={(e) => { setPassengers(e.target.value); setShowResult(false); }}
                className="w-full bg-transparent text-xs sm:text-sm text-m3-on-surface font-semibold outline-none appearance-none cursor-pointer pr-5 truncate"
              >
                <option value="4">4 {isTa ? 'பேர்' : 'Pax'}</option>
                <option value="6">6 {isTa ? 'பேர்' : 'Pax'}</option>
                <option value="7">7 {isTa ? 'பேர்' : 'Pax'}</option>
                <option value="12">12 {isTa ? 'பேர்' : 'Pax'}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="col-span-1">
            <label htmlFor={`${stableFormId}-mobile-veh`} className="text-badge font-bold text-m3-on-surface-variant uppercase mb-1 block truncate">
              {isTa ? 'வாகனம்' : 'Vehicle'}
            </label>
            <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-m3-md px-2.5 py-2 min-h-[44px] focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition cursor-pointer">
              <Car className="w-3.5 h-3.5 text-m3-on-surface-variant mr-1.5 shrink-0 pointer-events-none" />
              <select
                id={`${stableFormId}-mobile-veh`}
                value={vehicle}
                onChange={(e) => { setVehicle(e.target.value); setShowResult(false); }}
                className="w-full bg-transparent text-xs sm:text-sm text-m3-on-surface font-semibold outline-none appearance-none cursor-pointer pr-5 truncate"
              >
                {vehicleOptions.map(v => {
                  const cap = VEHICLE_CAPACITY[v] ?? 4;
                  const pax = parseInt(passengers);
                  const disabled = cap < pax;
                  return (
                    <option key={v} value={v} disabled={disabled}>
                      {v}{disabled ? ` (max ${cap} pax)` : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>

        </div>

        {/* Passenger-Vehicle capacity warning (mobile) */}
        {(() => {
          const cap = VEHICLE_CAPACITY[vehicle] ?? 4;
          const pax = parseInt(passengers);
          if (cap < pax) {
            return (
              <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-m3-md bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <span>{vehicle} seats max {cap} passengers. Please choose a larger vehicle for {pax} pax.</span>
              </div>
            );
          }
          return null;
        })()}

        <div className="pt-3">
          {!showResult ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleCalculateCost}
              className="w-full max-w-[260px] mx-auto bg-m3-primary hover:bg-slate-900 text-m3-on-primary font-bold py-3.5 rounded-m3-full transition-all flex items-center justify-center gap-2 shadow-m3-1 active:scale-[0.98] min-h-[52px] cursor-pointer disabled:opacity-75 border border-white/10 group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isTa ? 'கணக்கிடுகிறது...' : 'Calculating Fare...'}</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>{isTa ? 'செலவைக் கணக்கிடுங்கள்' : 'Calculate Cost'}</span>
                  <ArrowRight className="w-4 h-4 text-yellow-400 transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          ) : null}

          {showAirportTab && !showResult && (
            <div className="pt-2">
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

          {/* Mobile Results Section — Simple, Cut and Dried */}
          {showResult && estimate > 0 && (
            <div ref={resultRef} className="bg-m3-surface-container-low rounded-m3-xl p-3.5 sm:p-4 border border-m3-outline-variant shadow-m3-1 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* 1. Trip Route Meta & Vehicle */}
              <div className="flex items-center justify-between gap-2 border-b border-m3-outline-variant/40 pb-2">
                <div className="text-xs font-semibold text-m3-on-surface flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Transparent Estimate
                  </span>
                  {distance && (
                    <span>{activeTab === 'round' ? (distance * 2).toFixed(1) : distance.toFixed(1)} km</span>
                  )}
                  {duration && <span className="text-m3-outline-variant">•</span>}
                  {duration && <span className="text-m3-on-surface-variant font-normal">{duration}</span>}
                </div>
                <span className="text-xs font-bold text-m3-primary bg-m3-surface-container px-2 py-0.5 rounded-m3-full border border-m3-outline-variant/80">
                  {vehicle}
                </span>
              </div>

              {/* 2. Total Fare & Rate summary + Breakdown Link */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-m3-on-surface tracking-tight font-heading leading-none">
                    ₹ {estimate.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] sm:text-xs text-m3-on-surface-variant font-medium mt-1 leading-relaxed">
                    <span className="text-m3-on-surface font-semibold">
                      ₹{activeTab === 'round' ? vehicles[vehicle].round_trip_rate : vehicles[vehicle].one_way_rate}/km
                    </span>
                    {' · '}
                    <span>{isTa ? 'டிரைவர் பேட்டா & எரிபொருள் சேர்க்கப்பட்டுள்ளது' : 'Incl. Driver Bata & Fuel'}</span>
                    {' · '}
                    <span className="opacity-80">{isTa ? 'டோல் தனி' : 'Tolls extra'}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullBreakdown(true)}
                  className="inline-flex items-center gap-0.5 text-[11px] sm:text-xs font-bold text-m3-primary hover:text-m3-primary/80 transition-colors cursor-pointer shrink-0 mt-0.5 bg-m3-surface px-2 py-1 rounded-m3-md border border-m3-outline-variant"
                >
                  <span>{isTa ? 'கட்டண விவரம்' : 'Fare Breakdown'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Short local distance guidance */}
              {distance && distance < 45 && activeTab !== 'local' && (
                <div className="p-2.5 rounded-m3-lg bg-amber-500/10 border border-amber-500/30 text-xs flex items-center justify-between gap-2">
                  <span className="text-amber-800 dark:text-amber-300 font-medium text-[11px] leading-snug">
                    Travelling within Chennai ({distance.toFixed(1)} km)? Local Hourly Packages (from ₹1,350) or Airport flat tariffs offer better fixed pricing.
                  </span>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('switch-calculator-tab', { detail: 'local' }))}
                    className="shrink-0 px-2.5 py-1 rounded-m3-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-micro transition-all cursor-pointer"
                  >
                    Local Packages
                  </button>
                </div>
              )}

              {/* 3. Date & Time Selection */}
              {activeTab === 'round' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider">
                    <span>{isTa ? 'பயண தேதிகள்' : 'Trip Schedule'}</span>
                    <span className="text-m3-primary normal-case font-semibold bg-m3-primary/10 px-2 py-0.5 rounded-m3-full text-[10px] sm:text-[11px]">
                      {days} {days > 1 ? (isTa ? 'நாட்கள்' : 'Days') : (isTa ? 'நாள்' : 'Day')} ({days * (vehicles[vehicle]?.min_km_per_day || 250)} km min)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={`${stableFormId}-mobile-pickup-date`} className="block text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-wider mb-0.5">
                        {isTa ? 'புறப்படும் தேதி & நேரம்' : 'Pickup Date & Time'}
                      </label>
                      <div className="flex items-center bg-m3-surface border border-m3-outline-variant rounded-m3-md px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary transition-all">
                        <Calendar className="text-m3-primary mr-1.5 w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <input
                          id={`${stableFormId}-mobile-pickup-date`}
                          type="datetime-local"
                          value={date}
                          onChange={(e) => handlePickupDateChange(e.target.value)}
                          className="bg-transparent w-full outline-none text-xs text-m3-on-surface font-semibold cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`${stableFormId}-mobile-return-date`} className="block text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-wider mb-0.5">
                        {isTa ? 'திரும்பும் தேதி & நேரம்' : 'Return Date & Time'}
                      </label>
                      <div className="flex items-center bg-m3-surface border border-m3-outline-variant rounded-m3-md px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary transition-all">
                        <Calendar className="text-m3-primary mr-1.5 w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <input
                          id={`${stableFormId}-mobile-return-date`}
                          type="datetime-local"
                          value={returnDate}
                          min={date}
                          onChange={(e) => handleReturnDateChange(e.target.value)}
                          className="bg-transparent w-full outline-none text-xs text-m3-on-surface font-semibold cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label htmlFor={`${stableFormId}-mobile-date-result`} className="block text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider">
                    {isTa ? 'பயண தேதி & நேரம்' : 'Pickup Date & Time'}
                  </label>
                  <div className="flex items-center bg-m3-surface border border-m3-outline-variant rounded-m3-md px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary transition-all">
                    <Calendar className="text-m3-primary mr-2 w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <input
                      id={`${stableFormId}-mobile-date-result`}
                      type="datetime-local"
                      value={date}
                      onChange={(e) => handlePickupDateChange(e.target.value)}
                      className="bg-transparent w-full outline-none text-xs text-m3-on-surface font-semibold cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* 4. Booking Action */}
              <WhatsAppButton
                onClick={handleWhatsApp}
                fullWidth
                variant="filled"
                size="md"
                text={isTa ? 'வாட்ஸ்அப் முன்பதிவு' : 'Reserve on WhatsApp'}
              />
            </div>
          )}
        </div>
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
    </div>
  );
}

// Sub-component for clarity and reuse
function FullBreakdownModal({ isTa, vehicle, activeTab, localPackage, breakdown, estimate, setShowFullBreakdown, handleWhatsApp }) {
  return (
    <div data-hide-contact-dock role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-m3-scrim/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-m3-surface w-full max-w-md rounded-m3-2xl overflow-hidden shadow-m3-3 border border-m3-outline-variant flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-m3-outline-variant/60 flex items-center justify-between bg-m3-surface-container-low">
          <div>
            <h3 className="font-bold text-m3-title-m text-m3-on-surface">{isTa ? 'கட்டண விவரம்' : 'Fare Breakdown'}</h3>
            <p className="text-m3-body-s text-m3-on-surface-variant font-medium mt-0.5">{vehicle} • {activeTab === 'local' ? (isTa ? 'லோக்கல் பேக்கேஜ்' : 'Local Package') : activeTab === 'round' ? (isTa ? 'இரு வழி' : 'Round Trip') : (isTa ? 'ஒரு வழி' : 'One Way')}</p>
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
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3">
          {/* Trip Summary */}
          <div className="bg-m3-surface-container-low rounded-m3-lg px-3.5 py-2.5 border border-m3-outline-variant/70 flex justify-between items-center">
            <div>
              <span className="text-m3-label-s font-semibold text-m3-on-surface-variant uppercase">{isTa ? 'பயண தூரம்' : 'Distance'}</span>
              <p className="text-m3-title-m font-bold text-m3-on-surface font-heading">{activeTab === 'local' ? (localPackage === '5hr50km' ? '50 KM' : localPackage === '8hr80km' ? '80 KM' : '120 KM') : `${breakdown.actual_km.toFixed(1)} KM`}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-m3-full bg-m3-surface-container-high border border-m3-outline-variant text-m3-on-surface text-m3-label-s font-bold uppercase">
                <ShieldCheck className="w-3 h-3 text-m3-primary" />
                <span>{isTa ? 'மதிப்பீடு' : 'Total Fare'}</span>
              </div>
              <p className="text-m3-title-l font-bold text-m3-on-surface font-heading">₹{estimate.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="space-y-1.5">
            <h4 className="text-m3-label-s font-bold text-m3-on-surface-variant uppercase tracking-wide px-0.5">{isTa ? 'கட்டண விவரங்கள்' : 'Itemized Cost'}</h4>
            <div className="bg-m3-surface rounded-m3-lg border border-m3-outline-variant/60 overflow-hidden text-m3-body-m">
              <div className="divide-y divide-m3-outline-variant/50">
                {activeTab === 'local' ? (
                  <>
                    <div className="py-2 px-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-m3-on-surface text-m3-body-m">{isTa ? 'பேக்கேஜ் வகை' : 'Package fare'}</p>
                        <p className="text-m3-body-s text-m3-on-surface-variant">{localPackage === '5hr50km' ? '5H / 50 KM' : localPackage === '8hr80km' ? '8H / 80 KM' : '12H / 120 KM'}</p>
                      </div>
                      <span className="font-bold text-m3-on-surface text-m3-title-s">₹{breakdown.package_cost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="py-2 px-3 flex justify-between items-center bg-m3-surface-container-low">
                      <div>
                        <p className="font-medium text-m3-on-surface text-m3-body-m">{isTa ? 'ஓட்டுநர் பேட்டா' : 'Driver Bata'}</p>
                        <p className="text-m3-body-s text-m3-secondary">{isTa ? 'கட்டணத்தில் அடங்கும்' : 'Included in fare'}</p>
                      </div>
                      <span className="font-bold text-emerald-600 text-m3-label-m">{isTa ? 'இலவசம்' : 'INC'}</span>
                    </div>
                  </>
                  ) : breakdown?.is_city ? (
                    // City / Airport transfer — actual km only, no outstation minimum
                    <>
                      <div className="py-2 px-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-m3-on-surface text-m3-body-m">{isTa ? 'எடைத் தூரம்' : 'City Transfer Distance'}</p>
                          <p className="text-m3-body-s text-m3-on-surface-variant">{isTa ? 'நகர/விமான நிலைய கைமாற்றம் — குறைந்தபட்ச கிமீ இல்லை' : 'City/Airport hop — no outstation minimum'}</p>
                        </div>
                        <span className="font-semibold text-m3-on-surface text-m3-title-s">{breakdown.actual_km.toFixed(1)} KM</span>
                      </div>
                      <div className="py-2 px-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-m3-on-surface text-m3-body-m">{isTa ? 'கிமீ கட்டணம்' : 'KM Charges'}</p>
                          <p className="text-m3-body-s text-m3-on-surface-variant">{breakdown.chargeable_km.toFixed(1)} KM x ₹{breakdown.rate_per_km}/KM</p>
                        </div>
                        <span className="font-bold text-m3-on-surface text-m3-title-s">₹{breakdown.km_cost.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="py-2 px-3 flex justify-between items-center bg-m3-surface-container-low">
                        <div>
                          <p className="font-medium text-m3-on-surface text-m3-body-m">{isTa ? 'ஓட்டுநர் பேட்டா' : 'Driver Bata'}</p>
                          <p className="text-m3-body-s text-emerald-600">{isTa ? 'நகர கைமாற்றத்திற்கு இல்லை' : 'Not charged for city transfers'}</p>
                        </div>
                        <span className="font-bold text-emerald-600 text-m3-label-m">{isTa ? 'இலவசம்' : 'NIL'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="py-2 px-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-m3-on-surface text-m3-body-m">{isTa ? 'குறைந்தபட்ச கிமீ' : 'Minimum Chargeable'}</p>
                          <p className="text-m3-body-s text-m3-on-surface-variant">{activeTab === 'round' ? `${breakdown.days} Days x ${vehicles[vehicle].min_km_per_day} KM` : `${vehicles[vehicle].min_drop_km || 130} KM Minimum`}</p>
                        </div>
                        <span className="font-semibold text-m3-on-surface text-m3-title-s">{breakdown.base_km} KM</span>
                      </div>
                      <div className="py-2 px-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-m3-on-surface text-m3-body-m">{isTa ? 'கிமீ கட்டணம்' : 'KM Charges'}</p>
                          <p className="text-m3-body-s text-m3-on-surface-variant">{breakdown.chargeable_km} KM x ₹{breakdown.rate_per_km}/KM</p>
                        </div>
                        <span className="font-bold text-m3-on-surface text-m3-title-s">₹{breakdown.km_cost.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="py-2 px-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-m3-on-surface text-m3-body-m">{isTa ? 'ஓட்டுநர் பேட்டா' : 'Driver Bata'}</p>
                          <p className="text-m3-body-s text-m3-on-surface-variant">{isTa ? 'உணவு மற்றும் தங்குமிடம் உட்பட' : 'Food & stay included'}</p>
                        </div>
                        <span className="font-bold text-m3-on-surface text-m3-title-s">₹{breakdown.driver_bata.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}

              </div>
              <div className="py-2.5 px-3.5 bg-m3-surface-container-highest text-m3-on-surface border-t border-m3-outline-variant flex justify-between items-center">
                <div>
                  <span className="text-m3-label-s uppercase font-semibold text-m3-on-surface-variant block">{isTa ? 'மொத்த தொகை' : 'Estimated Total'}</span>
                  <span className="text-[10px] text-m3-secondary font-medium">{isTa ? 'எரிபொருள் & டிரைவர் உட்பட' : 'Fuel, GST & Bata Included'}</span>
                </div>
                <span className="text-m3-title-l font-black text-m3-on-surface font-heading">₹{estimate.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Zero Advance Reassurance Banner */}
          <div className="p-2 bg-emerald-500/10 rounded-m3-md border border-emerald-500/30 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-950">{isTa ? 'முன்பணம் தேவையில்லை' : 'Zero Advance Required'}</span>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">{isTa ? 'பயண முடிவில் செலுத்துங்கள்' : 'Pay After Trip'}</span>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="grid grid-cols-2 gap-2 text-m3-body-s">
            <div className="bg-m3-surface-container-low rounded-m3-md p-2.5 border border-m3-outline-variant/60 space-y-1">
              <span className="text-m3-label-s font-bold text-m3-on-surface uppercase block">{isTa ? 'உள்ளடக்கியவை' : 'Inclusions'}</span>
              {[isTa ? 'எரிபொருள்' : 'Fuel Charges', isTa ? 'டிரைவர் பேட்டா' : 'Driver Service', isTa ? 'ஜிஎஸ்டி' : 'All Taxes (GST)'].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-m3-label-s text-m3-on-surface">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="bg-m3-surface-container-low rounded-m3-md p-2.5 border border-m3-outline-variant/60 space-y-1">
              <span className="text-m3-label-s font-semibold text-m3-on-surface-variant uppercase block">{isTa ? 'தவிர்க்கப்பட்டவை' : 'Exclusions'}</span>
              {[isTa ? 'டோல் பிளாசா' : 'Tolls (at actuals)', isTa ? 'பார்க்கிங்' : 'Parking (at actuals)', isTa ? 'மாநில வரி' : 'State Tax (if any)'].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-m3-label-s text-m3-on-surface-variant">
                  <span className="w-1 h-1 bg-m3-on-surface-variant/70 rounded-m3-full shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="p-2 bg-m3-surface-container-low rounded-m3-md border border-m3-outline-variant flex items-start gap-1.5 text-m3-on-surface">
            <AlertCircle className="w-3.5 h-3.5 text-m3-primary shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight font-medium">
              {isTa ? 'கட்டணம் தோராயமானது. டோல் & பார்க்கிங் ரசீதுப்படி செலுத்த வேண்டும்.' : 'Estimated fare. Tolls and parking are as per actual toll booth receipts.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-m3-outline-variant/60 bg-m3-surface-container-low flex gap-2 items-center">
          <button 
            onClick={() => setShowFullBreakdown(false)} 
            className="flex-1 py-2 px-3 bg-m3-surface border border-m3-outline-variant text-m3-on-surface-variant font-semibold text-m3-label-l rounded-m3-full hover:bg-m3-surface-container transition-colors cursor-pointer"
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
            text={isTa ? 'வாட்ஸ்அப் முன்பதிவு (முன்பணம் இல்லை)' : 'Reserve (Pay ₹0 Today)'}
          />
        </div>
      </div>
    </div>
  );
}
