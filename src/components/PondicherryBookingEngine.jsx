import React, { useState, useId, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Car, 
  MapPin, 
  Calendar, 
  Users, 
  Phone, 
  Sparkles, 
  Navigation,
  Calculator,
  ArrowRight,
  ShieldCheck,
  LocateFixed,
  Info,
  ChevronDown,
  ChevronRight,
  X,
  Building2,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Receipt,
  AlertCircle,
  User
} from 'lucide-react';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { trackEvent } from '../lib/analytics';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import { printInvoiceLetterhead, getEstimateRefNo, downloadEstimateDocument } from '../utils/invoiceLetterhead';

// Indian GST State Code Mapping (Rules 46 & 48 of CGST Rules, 2017)
const GST_STATE_MAP = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory'
};

// Convert Indian Rupee numbers to formal currency words for official tax invoices
function numberToWordsINR(num) {
  if (!num || isNaN(num)) return '';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const inWords = (n) => {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '') + ' ';
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + (n % 100 ? inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 ? inWords(n % 10000000) : '');
  };

  const words = inWords(Math.round(num)).trim();
  return words ? `INR ${words} Only` : '';
}

// Transparent Outstation Tariff — Chennai ⇄ Pondicherry (via ECR)
// Pricing Model: Per-KM vehicle hire (min 300 km/day) + daily driver bata SEPARATELY quoted.
// Tolls, Puducherry UT entry permit, and parking are ALWAYS billed at government/actual rates.
// This is NOT a temple package — passengers cross toll plazas multiple times and park at multiple spots.
// Market rates verified against Tamil Nadu outstation cab market (no state fare cap for private taxis).
const VEHICLES = [
  {
    id: 'dzire',
    name: 'Swift Dzire / Toyota Etios',
    shortName: 'AC Sedan',
    capacity: 4,
    luggage: '2 Bags',
    tag: 'Best Value',
    perKmRate: 14,        // ₹14/km — standard Sedan outstation market rate 2026
    minKmPerDay: 300,     // outstation minimum 300 km/day billing (industry standard)
    // 1-day RT ≈ 320 km actual, billed at max(320, 300) = 320 km × ₹14 = ₹4,480 → rounded ₹4,500
    vehicleHire: { 1: 4500, 2: 8500, 3: 12500 },
    driverBata: { 1: 400, 2: 800, 3: 1200 },  // ₹400/day market standard for Sedan
    extraHourRate: 150    // ₹150/hr for time beyond scheduled return
  },
  {
    id: 'ertiga',
    name: 'Maruti Ertiga / XL6',
    shortName: 'Comfort SUV',
    capacity: 6,
    luggage: '3 Bags',
    tag: 'Family Favorite',
    perKmRate: 17,        // ₹17/km — Ertiga/XL6 outstation market rate
    minKmPerDay: 300,
    vehicleHire: { 1: 5500, 2: 10500, 3: 15500 },
    driverBata: { 1: 500, 2: 1000, 3: 1500 },
    extraHourRate: 200
  },
  {
    id: 'innova',
    name: 'Toyota Innova (7 Seater)',
    shortName: 'Spacious MUV',
    capacity: 7,
    luggage: '4 Bags',
    tag: 'Elders Choice',
    perKmRate: 20,        // ₹20/km — Innova outstation market rate
    minKmPerDay: 300,
    vehicleHire: { 1: 6500, 2: 12500, 3: 18500 },
    driverBata: { 1: 600, 2: 1200, 3: 1800 },
    extraHourRate: 200
  },
  {
    id: 'crysta',
    name: 'Toyota Innova Crysta (Luxury)',
    shortName: 'Luxury MUV',
    capacity: 7,
    luggage: '4 Bags',
    tag: 'VIP Luxury',
    perKmRate: 22,        // ₹22/km — Crysta/premium outstation market rate
    minKmPerDay: 300,
    vehicleHire: { 1: 7500, 2: 14500, 3: 21500 },
    driverBata: { 1: 700, 2: 1400, 3: 2100 },
    extraHourRate: 250
  },
  {
    id: 'tempo12',
    name: '12-Seater Tempo Traveller',
    shortName: 'Mini Coach',
    capacity: 12,
    luggage: '8 Bags',
    tag: 'Group Tour',
    perKmRate: 26,
    minKmPerDay: 300,
    vehicleHire: { 1: 9500, 2: 18500, 3: 27500 },
    driverBata: { 1: 1000, 2: 2000, 3: 3000 },
    extraHourRate: 300
  },
  {
    id: 'tempo17',
    name: '17-Seater Tempo Traveller',
    shortName: 'Executive Coach',
    capacity: 17,
    luggage: '12 Bags',
    tag: 'Large Group',
    perKmRate: 29,
    minKmPerDay: 300,
    vehicleHire: { 1: 12000, 2: 23000, 3: 34000 },
    driverBata: { 1: 1500, 2: 2500, 3: 3500 },
    extraHourRate: 400
  }
];

// Actuals charges — billed at government/plaza rates, NOT pre-included:
// ECR FASTag tolls (Uthandi + Kovalam plazas): ~₹100–₹170 one-way, ~₹200–₹340 round trip
// Puducherry UT commercial vehicle entry permit (Parivahan checkpost): ~₹500–₹1,000 per trip
// Parking: Auroville Visitors Centre ₹100/car, White Town on-street restricted (weekends 2PM–10PM)
const ACTUALS_NOTICE = {
  tollEstimate: '₹200–₹340',   // round-trip ECR tolls estimate
  permitEstimate: '~₹500',      // Puducherry UT entry permit
  parkingNote: 'Varies by spot' // Auroville ₹100, White Town restricted on weekends
};

const PASSENGER_OPTIONS = [
  { value: 1, label: '1 Passenger' },
  { value: 2, label: '2 Passengers' },
  { value: 3, label: '3 Passengers' },
  { value: 4, label: '4 Passengers' },
  { value: 5, label: '5 Passengers' },
  { value: 6, label: '6 Passengers' },
  { value: 7, label: '7 Passengers' },
  { value: 8, label: '8 Passengers' },
  { value: 9, label: '9 Passengers' },
  { value: 10, label: '10 Passengers' },
  { value: 11, label: '11 Passengers' },
  { value: 12, label: '12 Passengers' },
  { value: 14, label: '13–14 Passengers' },
  { value: 17, label: '15–17 Passengers' }
];

// Minimum datetime string for 'min' attribute (current local time)
const getMinDateTime = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export default function PondicherryBookingEngine({
  serviceTitle = 'Chennai to Pondicherry One Day Trip Cab & Taxi Package (ECR Route)'
}) {
  const pickupId = useId();
  const dropId = useId();
  const pickupDateTimeId = useId();
  const returnDateTimeId = useId();
  const passengersId = useId();
  const vehicleId = useId();

  // State — all fields start empty; user must choose
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [validationError, setValidationError] = useState('');
  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const autocompleteInitializedRef = useRef(false);

  // Initialize Google Places Autocomplete on pickup input
  useEffect(() => {
    let checkTimer = null;
    let isMounted = true;

    const initAutocomplete = () => {
      if (autocompleteInitializedRef.current) return;
      if (!pickupInputRef.current) return;
      if (!window.google?.maps?.places) return;

      try {
        if (pickupInputRef.current) {
          const options = {
            componentRestrictions: { country: 'in' },
            bounds: new window.google.maps.LatLngBounds(
              new window.google.maps.LatLng(12.7, 79.8), // Chennai SW
              new window.google.maps.LatLng(13.4, 80.4)  // Chennai NE
            ),
            fields: ['formatted_address', 'name', 'geometry'],
            strictBounds: false
          };

          const autocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, options);
          autocomplete.addListener('place_changed', () => {
            if (!isMounted) return;
            const place = autocomplete.getPlace();
            const addr = place?.formatted_address || place?.name;
            if (addr) {
              setPickup(addr);
              if (validationError) setValidationError('');
            }
          });
        }

        if (dropInputRef.current) {
          const dropOptions = {
            componentRestrictions: { country: 'in' },
            bounds: new window.google.maps.LatLngBounds(
              new window.google.maps.LatLng(11.8, 79.7), // Pondicherry SW
              new window.google.maps.LatLng(12.1, 80.0)  // Pondicherry NE
            ),
            fields: ['formatted_address', 'name', 'geometry'],
            strictBounds: false
          };

          const dropAutocomplete = new window.google.maps.places.Autocomplete(dropInputRef.current, dropOptions);
          dropAutocomplete.addListener('place_changed', () => {
            if (!isMounted) return;
            const place = dropAutocomplete.getPlace();
            const addr = place?.formatted_address || place?.name;
            if (addr) {
              setDrop(addr);
              if (validationError) setValidationError('');
            }
          });
        }

        autocompleteInitializedRef.current = true;
      } catch (err) {
        console.error('Google Autocomplete initialization error:', err);
      }
    };

    // Eagerly request Google Maps Places API script
    loadGoogleMaps()
      .then(() => {
        if (isMounted) initAutocomplete();
      })
      .catch(() => {});

    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      window.addEventListener('google-maps-loaded', initAutocomplete);
      checkTimer = setInterval(() => {
        if (window.google?.maps?.places) {
          initAutocomplete();
          if (autocompleteInitializedRef.current && checkTimer) clearInterval(checkTimer);
        }
      }, 500);
    }

    return () => {
      isMounted = false;
      window.removeEventListener('google-maps-loaded', initAutocomplete);
      if (checkTimer) clearInterval(checkTimer);
    };
  }, [validationError]);

  const fallbackNominatim = (lat, lng) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        setGettingLocation(false);
        const addr = data.display_name || `Chennai (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setPickup(addr);
        if (validationError) setValidationError('');
      })
      .catch(() => {
        setGettingLocation(false);
        setPickup(`Chennai (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        if (validationError) setValidationError('');
      });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);

    loadGoogleMaps().catch(() => {});

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              setGettingLocation(false);
              setPickup(results[0].formatted_address);
              if (validationError) setValidationError('');
              trackEvent('pondy_engine_gps_used', { success: true });
            } else {
              fallbackNominatim(latitude, longitude);
            }
          });
        } else {
          fallbackNominatim(latitude, longitude);
        }
      },
      (error) => {
        setGettingLocation(false);
        let errorMsg = 'Unable to get location.';
        if (error.code === 1) errorMsg = 'Location permission denied. Please enter address manually.';
        else if (error.code === 3) errorMsg = 'Location request timed out. Please try again.';
        alert(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fixedDrop = 'Pondicherry (Auroville, White Town & Promenade Beach), Puducherry';

  const [pickupDateTime, setPickupDateTime] = useState('');
  const [returnDateTime, setReturnDateTime] = useState('');

  // Auto-calculate trip duration using 24-hour block cycle with fair pro-rata hourly overage
  const calculateDuration = (startStr, endStr) => {
    if (!startStr || !endStr) {
      return { 
        hasDates: false,
        days: null, 
        hours: 0, 
        label: null, 
        subText: null, 
        isProRata: false, 
        extraHours: 0, 
        baseDays: 0, 
        cappedDays: 0,
        isOvernight: false, 
        isSameDate: true 
      };
    }
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start) || isNaN(end) || end < start) {
      return { 
        hasDates: false,
        days: null, 
        hours: 0, 
        label: null, 
        subText: null, 
        isProRata: false, 
        extraHours: 0, 
        baseDays: 0, 
        cappedDays: 0,
        isOvernight: false, 
        isSameDate: true 
      };
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const roundedHours = Math.round(diffHours * 10) / 10;
    const isSameDate = start.toDateString() === end.toDateString();
    const isOvernight = !isSameDate;

    // Tier 1: <= 24 hrs
    if (diffHours <= 24) {
      const subText = isSameDate ? 'Same Day' : '1 Night Stay';
      const label = '1 Day Package';
      return {
        hasDates: true,
        days: 1,
        hours: roundedHours,
        label,
        subText,
        isProRata: false,
        extraHours: 0,
        baseDays: 1,
        cappedDays: 1,
        isOvernight,
        isSameDate
      };
    }

    // Tier 2: 25 to 47 hrs (1 Day + 1 hr to 1 Day + 23 hrs)
    if (diffHours < 48) {
      const extraHours = Math.min(23, Math.max(1, Math.round(diffHours - 24)));
      return {
        hasDates: true,
        days: 1,
        hours: roundedHours,
        label: `1 Day + ${extraHours} hr${extraHours > 1 ? 's' : ''}`,
        subText: isOvernight ? '1 Night Stay' : 'Extra Hours',
        isProRata: true,
        extraHours,
        baseDays: 1,
        cappedDays: 2,
        isOvernight: true,
        isSameDate: false
      };
    }

    // Tier 2 Exact: 48 hrs (2 Days Package)
    if (diffHours <= 48.5) {
      return {
        hasDates: true,
        days: 2,
        hours: roundedHours,
        label: '2 Days Package',
        subText: '1 Night Stay',
        isProRata: false,
        extraHours: 0,
        baseDays: 2,
        cappedDays: 2,
        isOvernight: true,
        isSameDate: false
      };
    }

    // Tier 3: 49 to 71 hrs (2 Days + 1 hr to 2 Days + 23 hrs)
    if (diffHours < 72) {
      const extraHours = Math.min(23, Math.max(1, Math.round(diffHours - 48)));
      return {
        hasDates: true,
        days: 2,
        hours: roundedHours,
        label: `2 Days + ${extraHours} hr${extraHours > 1 ? 's' : ''}`,
        subText: '2 Nights Stay',
        isProRata: true,
        extraHours,
        baseDays: 2,
        cappedDays: 3,
        isOvernight: true,
        isSameDate: false
      };
    }

    // Tier 3 Exact: 72 hrs (3 Days Package)
    if (diffHours <= 72.5) {
      return {
        hasDates: true,
        days: 3,
        hours: roundedHours,
        label: '3 Days Package',
        subText: '2 Nights Stay',
        isProRata: false,
        extraHours: 0,
        baseDays: 3,
        cappedDays: 3,
        isOvernight: true,
        isSameDate: false
      };
    }

    // Tier 4: > 72.5 hrs (Multi-Day Package)
    const totalDays = Math.ceil(diffHours / 24);
    return {
      hasDates: true,
      days: totalDays,
      hours: roundedHours,
      label: `${totalDays} Days Package`,
      subText: `${totalDays - 1} Nights Stay`,
      isProRata: false,
      extraHours: 0,
      baseDays: totalDays,
      cappedDays: totalDays,
      isOvernight: true,
      isSameDate: false
    };
  };

  const durationInfo = calculateDuration(pickupDateTime, returnDateTime);
  const { days, hours: durationHours, label: durationLabel, subText: durationSubText } = durationInfo;

  // Government & Union Standard Practice:
  // Grace period: Return up to 11:00 PM has ₹0 surcharge (1-hr highway traffic grace window).
  // Driver Night Allowance (₹400): Applies only to same-day trips returning between 11:00 PM and 4:00 AM.
  // Overnight trips cover driver lodging through the night stay allowance.
  const returnHour = returnDateTime ? new Date(returnDateTime).getHours() : null;
  const isNightBatta = days === 1 && durationInfo.isSameDate && returnHour !== null && (returnHour >= 23 || returnHour < 4);
  const nightBattaAmount = isNightBatta ? 400 : 0;

  // Format datetime for WhatsApp message
  const formatDT = (dt) => {
    if (!dt) return '';
    return new Date(dt).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const handlePickupDateTimeChange = (e) => {
    const val = e.target.value;
    setPickupDateTime(val);
    if (validationError) setValidationError('');
    if (returnDateTime && returnDateTime < val) {
      setReturnDateTime(val);
    }
  };

  // Passenger & Vehicle Selection — no presets
  const [passengers, setPassengers] = useState('');
  const [vehicleIdState, setVehicleIdState] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [downloadToast, setDownloadToast] = useState(false);

  // GST Billing & Corporate ITC Claims (Default false for standard cash retail package, toggleable)
  const [needGst, setNeedGst] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [customerGst, setCustomerGst] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [modalValidationError, setModalValidationError] = useState('');
  const [modalHighlightedField, setModalHighlightedField] = useState('');
  const modalScrollRef = useRef(null);
  const companyNameInputRef = useRef(null);
  const customerGstInputRef = useRef(null);
  const customerPhoneInputRef = useRef(null);

  // Add body class when invoice modal is open to ensure clean @media print behavior
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (showPopup) {
      document.body.classList.add('modal-invoice-open');
    } else {
      document.body.classList.remove('modal-invoice-open');
    }
    return () => {
      document.body.classList.remove('modal-invoice-open');
    };
  }, [showPopup]);

  // Listen for vehicle selection from external Horizontal Fleet Carousel
  useEffect(() => {
    const handleExternalVehicleSelect = (e) => {
      const { vehicleId, passengers: pax } = e.detail || {};
      if (vehicleId) {
        if (pax) {
          setPassengers(String(pax));
        }
        const mappedId = vehicleId === 'sedan' ? 'dzire' : vehicleId === 'tempo' ? 'tempo12' : vehicleId;
        setVehicleIdState(mappedId);
        if (validationError) setValidationError('');
        const bookingEl = document.getElementById('booking');
        if (bookingEl) {
          bookingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    window.addEventListener('select-pondicherry-vehicle', handleExternalVehicleSelect);
    return () => window.removeEventListener('select-pondicherry-vehicle', handleExternalVehicleSelect);
  }, [validationError]);

  const availableVehicles = passengers ? VEHICLES.filter(v => v.capacity >= parseInt(passengers, 10)) : VEHICLES;
  const activeVehicle = availableVehicles.find(v => v.id === vehicleIdState) || null;

  const handlePassengerChange = (newPaxCount) => {
    setPassengers(newPaxCount);
    if (validationError) setValidationError('');
    if (!newPaxCount) {
      setVehicleIdState('');
      return;
    }
    const paxNum = parseInt(newPaxCount, 10);
    const curVehicleObj = VEHICLES.find(v => v.id === vehicleIdState);
    if (!curVehicleObj || curVehicleObj.capacity < paxNum) {
      // Auto-upgrade to first eligible vehicle, but don't pre-select — clear to force user choice
      setVehicleIdState('');
    }
  };

  // Transparent Outstation Fare Calculation — Correct Market Model:
  // Vehicle Hire = per-km rate × max(actual km, min km/day) per day
  // Driver Bata = fixed daily allowance (separate line item — not bundled)
  // ECR Tolls, Pondicherry UT permit, and parking = ALWAYS at actuals (NOT pre-quoted)
  // Night return surcharge (after 11 PM same day) = ₹400 extra driver duty allowance
  const calculateVehicleFare = (veh, durInfo) => {
    if (!veh || !durInfo || !durInfo.hasDates) return null;

    const { days: numDays, isProRata, extraHours, baseDays, cappedDays } = durInfo;

    // Pro-rata intermediate duration (e.g. 1 Day + a few hours beyond)
    if (isProRata) {
      const baseVehicleHire = veh.vehicleHire[baseDays];
      const capVehicleHire = veh.vehicleHire[cappedDays];
      const baseDriverBata = veh.driverBata[baseDays];
      const capDriverBata = veh.driverBata[cappedDays];

      const vehDelta = capVehicleHire - baseVehicleHire;
      const rawVehExtra = (extraHours * vehDelta) / 24;
      const vehicleHireFare = baseVehicleHire + Math.round(rawVehExtra / 50) * 50;

      const bataDelta = capDriverBata - baseDriverBata;
      const rawBataExtra = (extraHours * bataDelta) / 24;
      const driverBata = baseDriverBata + Math.round(rawBataExtra / 50) * 50;

      const totalFare = vehicleHireFare + driverBata;

      return {
        totalFare,
        packageType: 'pro_rata',
        vehicleHireFare,
        driverBata,
        baseFare: baseVehicleHire + baseDriverBata,
        packageDays: baseDays,
        baseDays,
        cappedDays,
        extraHoursFare: Math.round(rawVehExtra / 50) * 50,
        extraHours,
        hourlyRate: Math.round(vehDelta / 24),
        isProRata: true,
        isCapped: false,
        pricingModel: `${baseDays} Day + ${extraHours} hr (Pro-Rata)`
      };
    }

    // Standard 1, 2, or 3-Day billing
    const safeDay = Math.min(numDays, 3);
    const extraDays = numDays > 3 ? numDays - 3 : 0;
    const vehicleHireFare = veh.vehicleHire[safeDay] + (extraDays * (veh.vehicleHire[2] - veh.vehicleHire[1]));
    const driverBata = veh.driverBata[safeDay] + (extraDays * (veh.driverBata[2] - veh.driverBata[1]));
    const totalFare = vehicleHireFare + driverBata;

    return {
      totalFare,
      packageType: numDays === 1 ? 'standard_1day' : 'multi_day',
      vehicleHireFare,
      driverBata,
      baseFare: totalFare,
      packageDays: numDays,
      extraHoursFare: 0,
      extraHours: 0,
      isProRata: false,
      isCapped: false,
      pricingModel: `${numDays}-Day Outstation Tariff (${veh.perKmRate || '—'}/km)`
    };
  };

  const fareBreakdown = (activeVehicle && durationInfo.hasDates) ? calculateVehicleFare(activeVehicle, durationInfo) : null;
  const currentFare = fareBreakdown != null ? fareBreakdown.totalFare + nightBattaAmount : null;
  const formattedFare = currentFare != null ? `₹ ${currentFare.toLocaleString('en-IN')}` : null;

  // Indian GST Rule Compliance (SAC 9966 Rent-a-Cab Passenger Transport):
  // Supplier State: 33 (Tamil Nadu)
  // Recipient State: extracted from first 2 characters of recipient GSTIN
  const cleanedGst = customerGst.trim().toUpperCase();
  const rawStateCode = cleanedGst.length >= 2 ? cleanedGst.slice(0, 2) : '';
  const recipientStateName = rawStateCode ? (GST_STATE_MAP[rawStateCode] || `State (${rawStateCode})`) : 'Tamil Nadu';
  
  // Intra-State: Supplier (33) to Recipient (33 or default/unregistered) -> CGST 2.5% + SGST 2.5%
  // Inter-State: Supplier (33) to Recipient (any other state, e.g. 29 Karnataka, 34 Puducherry, 36 Telangana) -> IGST 5.0%
  const isIntraState = !rawStateCode || rawStateCode === '33';
  const placeOfSupply = needGst && rawStateCode && !isIntraState 
    ? `${rawStateCode} - ${recipientStateName}` 
    : '33 - Tamil Nadu';

  const taxableAmount = currentFare || 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let totalGst = 0;

  if (needGst && taxableAmount > 0) {
    if (isIntraState) {
      cgst = Math.round(taxableAmount * 0.025);
      sgst = Math.round(taxableAmount * 0.025);
      totalGst = cgst + sgst;
    } else {
      igst = Math.round(taxableAmount * 0.05);
      totalGst = igst;
    }
  }

  const finalNetPayable = currentFare != null ? (needGst ? taxableAmount + totalGst : taxableAmount) : null;
  const formattedFinalFare = finalNetPayable != null ? `₹ ${finalNetPayable.toLocaleString('en-IN')}` : null;
  const grandTotalInWords = finalNetPayable ? numberToWordsINR(finalNetPayable) : '';

  const gstEstimatedTotal = currentFare != null ? currentFare + Math.round(currentFare * 0.05) : null;
  const formattedGstEstimatedTotal = gstEstimatedTotal != null ? `₹ ${gstEstimatedTotal.toLocaleString('en-IN')}` : null;
  const activePayableFare = needGst ? formattedFinalFare : formattedFare;

  // All required fields filled?
  const isComplete = pickup.trim() && pickupDateTime && returnDateTime && passengers && vehicleIdState;

  // Pricing note for WhatsApp
  let pricingNote = '';
  if (fareBreakdown) {
    if (fareBreakdown.isProRata) {
      pricingNote = ` (Pro-Rata: ₹${fareBreakdown.vehicleHireFare.toLocaleString('en-IN')} vehicle hire + ₹${fareBreakdown.driverBata.toLocaleString('en-IN')} driver bata)`;
    } else if (isNightBatta) {
      pricingNote = ' (includes ₹400 Late Night Driver Duty Allowance after 11 PM)';
    }
  }

  // Estimate Reference Number
  const invoiceRefNo = getEstimateRefNo(pickupDateTime);

  // WhatsApp Message — transparent outstation billing model
  const whatsAppMessage = needGst ? `*Kalidass Travels - Chennai to Pondicherry Outstation Cab (Proforma Estimate)*
• Service: ${serviceTitle}
• Estimate Ref: ${invoiceRefNo}
• Supplier GSTIN: 33COVPM0531D1Z4 (SAC: 9966 Rent-a-Cab)
• Supplier State: 33 - Tamil Nadu
• Place of Supply: ${placeOfSupply}
${companyName.trim() ? `• Recipient / Firm: ${companyName.trim()}\n` : ''}${cleanedGst ? `• Recipient GSTIN: ${cleanedGst} (${recipientStateName})\n` : ''}${customerPhone.trim() ? `• Contact Mobile: ${customerPhone.trim()}\n` : ''}• Trip Type: Outstation Round Trip${durationLabel ? ` (${durationLabel}, ${durationHours} hrs)` : ''}
• Pickup: ${formatDT(pickupDateTime)}
• Return: ${formatDT(returnDateTime)}${isNightBatta ? ' (Late Night Return after 11 PM)' : ''}
• Pickup Location: ${pickup.trim() || 'Chennai (Doorstep Pickup)'}
• Destination: ${drop.trim() || fixedDrop}
• Route: Scenic East Coast Road (ECR) via Mahabalipuram
• Sightseeing Stops: Auroville, French White Town, Sri Aurobindo Ashram & Promenade Beach
• Passengers: ${passengers} Passenger${parseInt(passengers, 10) > 1 ? 's' : ''}
• Selected Vehicle: ${activeVehicle ? `${activeVehicle.name} (${activeVehicle.shortName}, ${activeVehicle.perKmRate}/km)` : 'Not selected'}

*QUOTED FARE BREAKDOWN (Vehicle Hire + Driver Bata):*
• AC Vehicle Hire & Fuel: ₹${fareBreakdown?.vehicleHireFare?.toLocaleString('en-IN') || '—'}
• Chauffeur Duty Allowance (Driver Bata): ₹${((fareBreakdown?.driverBata || 0) + nightBattaAmount).toLocaleString('en-IN')}
• Taxable Supply Subtotal: ₹${taxableAmount.toLocaleString('en-IN')}
${isIntraState 
  ? `• CGST (2.5%): ₹${cgst.toLocaleString('en-IN')}\n• SGST (2.5%): ₹${sgst.toLocaleString('en-IN')}` 
  : `• IGST (5.0% - Inter-State): ₹${igst.toLocaleString('en-IN')}`}
• Total GST (5%): ₹${totalGst.toLocaleString('en-IN')}
• Total Quoted (Vehicle + Bata + GST): ₹${finalNetPayable?.toLocaleString('en-IN')}${grandTotalInWords ? ` (${grandTotalInWords})` : ''}

*AT-ACTUALS CHARGES (Billed Separately at Government/Plaza Rates):*
• ECR FASTag Tolls (Uthandi + Kovalam plazas, round-trip): ~₹200–₹340 actuals
• Puducherry UT Commercial Vehicle Entry Permit (Parivahan): ~₹500 actuals
• Parking (Auroville Visitors Centre: ₹100/car; White Town: varies): at actuals
• Any extra km beyond scheduled route: ₹${activeVehicle?.perKmRate || '—'}/km actuals

• Advance Required: ₹0 — Pay chauffeur on trip completion
• ITC Status: 100% Eligible for Corporate ITC Claim (Sec 16/17(5) CGST Act)

Please confirm cab allocation and issue formal GST trip estimate.`
: `*Kalidass Travels - Chennai to Pondicherry Outstation Cab Booking*
• Service: ${serviceTitle}
• Estimate Ref: ${invoiceRefNo}
${companyName.trim() ? `• Passenger Name: ${companyName.trim()}\n` : ''}${customerPhone.trim() ? `• Contact Mobile: ${customerPhone.trim()}\n` : ''}• Trip Type: Outstation Round Trip${durationLabel ? ` (${durationLabel}, ${durationHours} hrs)` : ''}
• Pickup: ${formatDT(pickupDateTime)}
• Return: ${formatDT(returnDateTime)}${isNightBatta ? ' (Late Night Return after 11 PM)' : ''}
• Pickup Location: ${pickup.trim() || 'Chennai (Doorstep Pickup)'}
• Destination: ${drop.trim() || fixedDrop}
• Route: East Coast Road (ECR) via Mahabalipuram
• Sightseeing: Auroville, French White Town & Promenade Beach
• Passengers: ${passengers} Passenger${parseInt(passengers, 10) > 1 ? 's' : ''}
• Selected Vehicle: ${activeVehicle ? `${activeVehicle.name} (${activeVehicle.shortName})` : 'Not selected'}

*QUOTED (Vehicle Hire + Driver Bata):*
• Vehicle Hire & Fuel: ₹${fareBreakdown?.vehicleHireFare?.toLocaleString('en-IN') || '—'} (${activeVehicle?.perKmRate}/km × min 300 km/day)
• Driver Bata (Allowance): ₹${((fareBreakdown?.driverBata || 0) + nightBattaAmount).toLocaleString('en-IN')}/day
• Total Quoted Fare: ${formattedFare || 'TBD'}${pricingNote}

*EXTRA AT ACTUALS (Government/Plaza Rates — Not Pre-Included):*
• ECR FASTag Tolls (round-trip, Uthandi & Kovalam): ~₹200–₹340
• Puducherry UT Entry Permit (commercial vehicle): ~₹500
• Parking (Auroville ₹100/car, White Town varies by spot/time)
• Waiting beyond schedule or extra km: billed at actuals

• Payment: ₹0 Advance — Pay chauffeur after trip completion
• Driver stays in vehicle/dormitory (no hotel room from guest for 1-day trip)

Please confirm chauffeur & availability for my Pondicherry trip.`;

  const whatsAppUrl = buildWhatsAppUrl(whatsAppMessage);

  const validateCardInputs = () => {
    if (needGst) {
      if (!companyName.trim()) {
        setValidationError('Please enter Company / Firm Name for GST Tax Invoice.');
        if (companyNameInputRef.current) {
          companyNameInputRef.current.focus();
          companyNameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }
      if (!customerPhone.trim()) {
        setValidationError('Please enter Contact Mobile Number for GST Tax Invoice.');
        if (customerPhoneInputRef.current) {
          customerPhoneInputRef.current.focus();
          customerPhoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }
      if (customerGst.trim() && customerGst.trim().length !== 15) {
        setValidationError('Recipient GSTIN must be exactly 15 characters, or leave blank.');
        if (customerGstInputRef.current) {
          customerGstInputRef.current.focus();
          customerGstInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }
    }
    setValidationError('');
    return true;
  };

  const validateModalInputs = () => {
    if (!companyName.trim()) {
      setModalValidationError('Please enter Guest / Company Name before proceeding.');
      setModalHighlightedField('company');
      if (companyNameInputRef.current) {
        companyNameInputRef.current.focus();
      }
      return false;
    }
    if (!customerPhone.trim()) {
      setModalValidationError('Please enter Contact Phone Number before proceeding.');
      setModalHighlightedField('phone');
      if (customerPhoneInputRef.current) {
        customerPhoneInputRef.current.focus();
      }
      return false;
    }
    if (customerGst.trim() && customerGst.trim().length !== 15) {
      setModalValidationError('Recipient GSTIN must be exactly 15 characters, or leave blank.');
      setModalHighlightedField('gstin');
      if (customerGstInputRef.current) {
        customerGstInputRef.current.focus();
      }
      return false;
    }
    setModalValidationError('');
    setModalHighlightedField('');
    return true;
  };

  const handlePrintLetterhead = () => {
    if (!validateModalInputs()) {
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    printInvoiceLetterhead({
      needGst,
      invoiceRefNo,
      issueDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      placeOfSupply,
      companyName: companyName.trim(),
      customerGst: cleanedGst,
      customerPhone: customerPhone.trim(),
      recipientStateName,
      rawStateCode,
      isIntraState,
      pickup: pickup.trim(),
      pickupDateTime: pickupDateTime ? formatDT(pickupDateTime) : 'Confirmed upon booking',
      returnDateTime: returnDateTime ? formatDT(returnDateTime) : 'Same-day return',
      vehicleName: activeVehicle?.name || 'Selected Cab',
      passengers: passengers || 4,
      durationLabel: durationLabel || '1 Day',
      taxableAmount,
      vehicleHireFare: fareBreakdown?.vehicleHireFare || taxableAmount,
      driverBata: fareBreakdown?.driverBata || 0,
      isNightBatta,
      cgst,
      sgst,
      igst,
      totalGst,
      finalNetPayable: finalNetPayable || taxableAmount,
      grandTotalInWords,
      tourRoute: 'Chennai ⇄ Pondicherry Coastal Tour (via ECR)',
      serviceDescription: 'Doorstep Pickup Chennai ➔ East Coast Road ➔ Auroville ➔ French White Town ➔ Promenade Beach ➔ Return'
    });
  };

  const handleDirectPrintLetterhead = () => {
    if (!validateCardInputs()) return;
    printInvoiceLetterhead({
      needGst,
      invoiceRefNo,
      issueDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      placeOfSupply,
      companyName: companyName.trim(),
      customerGst: cleanedGst,
      customerPhone: customerPhone.trim(),
      recipientStateName,
      rawStateCode,
      isIntraState,
      pickup: pickup.trim(),
      pickupDateTime: pickupDateTime ? formatDT(pickupDateTime) : 'Confirmed upon booking',
      returnDateTime: returnDateTime ? formatDT(returnDateTime) : 'Same-day return',
      vehicleName: activeVehicle?.name || 'Selected Cab',
      passengers: passengers || 4,
      durationLabel: durationLabel || '1 Day',
      taxableAmount,
      vehicleHireFare: fareBreakdown?.vehicleHireFare || taxableAmount,
      driverBata: fareBreakdown?.driverBata || 0,
      isNightBatta,
      cgst,
      sgst,
      igst,
      totalGst,
      finalNetPayable: finalNetPayable || taxableAmount,
      grandTotalInWords,
      tourRoute: 'Chennai ⇄ Pondicherry Coastal Tour (via ECR)',
      serviceDescription: 'Doorstep Pickup Chennai ➔ East Coast Road ➔ Auroville ➔ French White Town ➔ Promenade Beach ➔ Return'
    });
  };

  const handleModalWhatsAppClick = (e) => {
    if (!validateModalInputs()) {
      if (e) e.preventDefault();
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    handleBookWhatsApp();
  };

  const handleViewEstimateClick = () => {
    if (!pickup.trim()) {
      setValidationError('Please enter pickup location in Chennai.');
      if (pickupInputRef.current) {
        pickupInputRef.current.focus();
      }
      return;
    }
    if (!pickupDateTime || !returnDateTime) {
      setValidationError('Please select Pickup and Return Date & Time.');
      const el = document.getElementById(pickupDateTimeId);
      if (el) el.focus();
      return;
    }
    if (!passengers) {
      setValidationError('Please select number of passengers.');
      const el = document.getElementById(passengersId);
      if (el) el.focus();
      return;
    }
    if (!vehicleIdState) {
      setValidationError('Please select a vehicle model.');
      const el = document.getElementById(vehicleId);
      if (el) el.focus();
      return;
    }
    setValidationError('');
    setModalValidationError('');
    setModalHighlightedField('');
    setShowPopup(true);
    trackEvent('pondy_engine_estimate_popup_opened', { vehicle: activeVehicle?.name });
  };

  const handleDownloadEstimate = () => {
    if (!validateModalInputs()) {
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    downloadEstimateDocument({
      needGst,
      invoiceRefNo,
      issueDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      placeOfSupply,
      companyName: companyName.trim(),
      customerGst: cleanedGst,
      customerPhone: customerPhone.trim(),
      recipientStateName,
      rawStateCode,
      isIntraState,
      pickup: pickup.trim(),
      pickupDateTime: pickupDateTime ? formatDT(pickupDateTime) : 'Confirmed upon booking',
      returnDateTime: returnDateTime ? formatDT(returnDateTime) : 'Same-day return',
      vehicleName: activeVehicle?.name || 'Selected Cab',
      passengers: passengers || 4,
      durationLabel: durationLabel || '1 Day',
      taxableAmount,
      vehicleHireFare: fareBreakdown?.vehicleHireFare || taxableAmount,
      driverBata: fareBreakdown?.driverBata || 0,
      isNightBatta,
      cgst,
      sgst,
      igst,
      totalGst,
      finalNetPayable: finalNetPayable || taxableAmount,
      grandTotalInWords,
      tourRoute: 'Chennai ⇄ Pondicherry Coastal Tour (via ECR)',
      serviceDescription: 'Doorstep Pickup Chennai ➔ East Coast Road ➔ Auroville ➔ French White Town ➔ Promenade Beach ➔ Return'
    });

    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 3500);
    trackEvent('pondy_engine_estimate_downloaded', { needGst });
  };

  const handleBookWhatsApp = () => {
    if (!validateCardInputs()) return;
    trackEvent('pondy_engine_whatsapp_booked', {
      vehicle: activeVehicle?.name,
      fare: currentFare,
      needGst,
      duration: durationLabel
    });
    window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCall = () => {
    trackEvent('pondy_engine_call_clicked', {
      vehicle: activeVehicle ? activeVehicle.name : 'none',
      passengers,
      days
    });
  };

  const hasVehicle = !!activeVehicle;

  return (
    <div className="bg-m3-surface text-m3-on-surface rounded-m3-2xl border border-m3-outline-variant shadow-m3-1 p-4 sm:p-5 lg:p-6 booking-engine">
      
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-m3-outline-variant/60">
        <div>
          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-m3-on-surface font-heading leading-tight flex items-center gap-1.5">
            <Car className="w-4 h-4 text-m3-primary shrink-0" />
            <span>Book Chennai to Pondicherry</span>
          </h2>
          <p className="text-micro text-m3-on-surface-variant mt-0.5">
            ECR Scenic Highway • Auroville • French White Town • ₹0 Advance
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-m3-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>Transparent Outstation Rate</span>
          </span>
        </div>
      </div>

      {/* Booking Form Surface */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
        
        {/* ROW 1: Pickup Location */}
        <div>
          <label htmlFor={pickupId} className="block text-xs font-semibold text-m3-on-surface-variant mb-1">
            Pickup Location in Chennai <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 text-m3-on-surface-variant absolute left-3 pointer-events-none shrink-0" />
            <input
              id={pickupId}
              ref={pickupInputRef}
              type="text"
              value={pickup}
              onChange={(e) => {
                setPickup(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="Enter your Chennai pickup address, area, or landmark"
              className="w-full bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-lg pl-9 pr-24 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-m3-on-surface placeholder:text-m3-outline focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 transition-colors shadow-2xs outline-none"
            />
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={gettingLocation}
              title="Detect current location"
              aria-label="Use current location"
              className="absolute right-2 px-2 py-1 rounded-m3-md bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-primary text-micro font-bold flex items-center gap-1 border border-m3-outline-variant transition-colors cursor-pointer disabled:opacity-60"
            >
              <LocateFixed className={`w-3 h-3 ${gettingLocation ? 'animate-spin' : ''}`} />
              <span className="hidden min-[420px]:inline">{gettingLocation ? 'Locating...' : 'GPS'}</span>
            </button>
          </div>
        </div>

        {/* Drop Location in Pondicherry */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor={dropId} className="block text-xs font-semibold text-m3-on-surface-variant">
              Drop Location in Pondicherry
            </label>
            <span className="text-micro font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-m3-full border border-emerald-200">
              ECR Route
            </span>
          </div>
          <div className="relative flex items-center">
            <Navigation className="w-4 h-4 text-m3-on-surface-variant absolute left-3 pointer-events-none shrink-0" />
            <input
              id={dropId}
              ref={dropInputRef}
              type="text"
              value={drop}
              onChange={(e) => {
                setDrop(e.target.value);
                if (validationError) setValidationError('');
              }}
              onFocus={() => {
                loadGoogleMaps().catch(() => {});
              }}
              placeholder="Enter drop hotel, resort, White Town, or Auroville"
              className="w-full bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-lg pl-9 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-m3-on-surface placeholder:text-m3-outline focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 transition-colors shadow-2xs outline-none"
            />
            {drop && (
              <button
                type="button"
                onClick={() => setDrop('')}
                aria-label="Clear drop location"
                title="Clear drop location"
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-m3-surface-container text-m3-on-surface-variant hover:text-m3-on-surface absolute right-2.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Pickup Date & Return Date (Side-by-Side Pairing) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div>
            <label htmlFor={pickupDateTimeId} className="block text-xs font-semibold text-m3-on-surface-variant mb-1">
              Pickup Date &amp; Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-m3-on-surface-variant absolute left-2.5 pointer-events-none shrink-0" />
              <input
                id={pickupDateTimeId}
                type="datetime-local"
                min={getMinDateTime()}
                value={pickupDateTime}
                onChange={handlePickupDateTimeChange}
                className="w-full bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-lg pl-8 pr-2 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-m3-on-surface focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 transition-colors shadow-2xs outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor={returnDateTimeId} className="block text-xs font-semibold text-m3-on-surface-variant mb-1">
              Return Date &amp; Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-m3-on-surface-variant absolute left-2.5 pointer-events-none shrink-0" />
              <input
                id={returnDateTimeId}
                type="datetime-local"
                min={pickupDateTime || getMinDateTime()}
                value={returnDateTime}
                onChange={(e) => {
                  setReturnDateTime(e.target.value);
                  if (validationError) setValidationError('');
                }}
                className="w-full bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-lg pl-8 pr-2 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-m3-on-surface focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 transition-colors shadow-2xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Trip Duration & Pro-Rata Badge */}
        {durationInfo.hasDates && (
          <div className="p-2 sm:p-2.5 rounded-m3-lg bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs text-amber-950 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="font-semibold">Calculated Trip Duration:</span>
              <strong className="text-m3-primary font-bold">{durationLabel}</strong>
              <span className="text-micro text-amber-800 hidden sm:inline">({durationHours} hrs total)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-m3-full bg-white text-amber-900 border border-amber-300 text-micro font-bold">
                {durationSubText}
              </span>
              {durationInfo.isProRata && (
                <button
                  type="button"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="text-micro text-m3-primary font-bold hover:underline ml-1"
                >
                  {showBreakdown ? 'Hide Why' : 'Why?'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pro-Rata Hourly Fairness Explanation Box */}
        {showBreakdown && durationInfo.isProRata && (
          <div className="p-2.5 rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/60 text-[11px] text-m3-on-surface-variant space-y-1">
            <div className="font-bold text-m3-on-surface flex items-center gap-1">
              <Info className="w-3 h-3 text-m3-primary" />
              <span>Consumer Protection Fair Hourly Pricing</span>
            </div>
            <p>
              Your trip exceeds 24 hours by <strong>{durationInfo.extraHours} billable extra hour{durationInfo.extraHours > 1 ? 's' : ''}</strong>. 
              Instead of forcing a flat 2-day jump, we apply our statutory pro-rata tariff capped safely below the full 2-day ceiling.
            </p>
          </div>
        )}

        {/* ROW 3: Passengers & Vehicle Model (Side-by-Side Pairing, M3 Container) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          
          {/* Passengers Selector */}
          <div>
            <label htmlFor={passengersId} className="block text-xs font-semibold text-m3-on-surface-variant mb-1">
              Passengers <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-lg transition-colors focus-within:border-m3-primary focus-within:ring-2 focus-within:ring-m3-primary/20 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-m3-on-surface-variant absolute left-2.5 pointer-events-none shrink-0" />
              <select
                id={passengersId}
                value={passengers}
                onChange={(e) => handlePassengerChange(e.target.value)}
                className="w-full appearance-none bg-transparent outline-none cursor-pointer pl-8 pr-8 sm:pr-9 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-m3-on-surface"
              >
                <option value="">Select Pax</option>
                {PASSENGER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-m3-on-surface-variant absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* Vehicle Model Selector */}
          <div>
            <label htmlFor={vehicleId} className="block text-xs font-semibold text-m3-on-surface-variant mb-1">
              Vehicle Model <span className="text-rose-500">*</span>
            </label>
            <div className={`relative flex items-center rounded-m3-lg transition-colors shadow-2xs ${
              !passengers 
                ? 'bg-m3-surface-container-low border border-m3-outline-variant/60 opacity-60 cursor-not-allowed' 
                : 'bg-white border border-m3-outline-variant hover:border-m3-outline focus-within:border-m3-primary focus-within:ring-2 focus-within:ring-m3-primary/20'
            }`}>
              <Car className="w-3.5 h-3.5 text-m3-on-surface-variant absolute left-2.5 pointer-events-none shrink-0" />
              <select
                id={vehicleId}
                disabled={!passengers}
                value={vehicleIdState}
                onChange={(e) => {
                  setVehicleIdState(e.target.value);
                  if (validationError) setValidationError('');
                }}
                className="w-full appearance-none bg-transparent outline-none cursor-pointer disabled:cursor-not-allowed pl-8 pr-8 sm:pr-9 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-m3-on-surface"
              >
                <option value="">{passengers ? 'Choose Vehicle' : 'Pick Pax First'}</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.shortName} ({v.capacity} Pax)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-m3-on-surface-variant absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            </div>
          </div>

        </div>

        {/* GST Billing Toggle (Corporate / Tax Invoice Option) */}
        <div className="pt-1">
          <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/60">
            <div className="flex items-center gap-2">
              <Receipt className="w-3.5 h-3.5 text-m3-primary shrink-0" />
              <label htmlFor="need-gst-toggle" className="text-xs font-semibold text-m3-on-surface cursor-pointer select-none">
                Need Official GST Tax Invoice? (Corporate ITC Claim)
              </label>
            </div>
            <input
              id="need-gst-toggle"
              type="checkbox"
              checked={needGst}
              onChange={(e) => setNeedGst(e.target.checked)}
              className="w-4 h-4 text-m3-primary rounded-m3-xs border-m3-outline-variant focus:ring-m3-primary/30 cursor-pointer"
            />
          </div>

          {needGst && (
            <div className="mt-2 p-3 rounded-m3-xl bg-white border border-m3-outline-variant space-y-2.5 animate-in fade-in duration-200 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-0.5">
                    Company / Firm Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={companyNameInputRef}
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="E.g. Cognizant / TCS / Private Ltd"
                    className="w-full bg-white border border-m3-outline-variant rounded-m3-md px-2.5 py-1.5 text-xs font-medium text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-0.5">
                    Contact Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={customerPhoneInputRef}
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-white border border-m3-outline-variant rounded-m3-md px-2.5 py-1.5 text-xs font-medium text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-0.5">
                  Recipient GSTIN (Optional - Leave blank for unregistered B2C)
                </label>
                <input
                  ref={customerGstInputRef}
                  type="text"
                  maxLength={15}
                  value={customerGst}
                  onChange={(e) => setCustomerGst(e.target.value.toUpperCase())}
                  placeholder="33AAAAA0000A1Z5 (15 characters)"
                  className="w-full bg-white border border-m3-outline-variant rounded-m3-md px-2.5 py-1.5 text-xs font-mono font-medium text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-m3-on-surface-variant pt-1 border-t border-m3-outline-variant/40">
                <span>Supply Place: <strong>{placeOfSupply}</strong></span>
                <span className="text-emerald-700 font-semibold">{isIntraState ? 'CGST 2.5% + SGST 2.5%' : 'IGST 5.0%'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-2.5 rounded-m3-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* FARE SUMMARY STRIP (Appears as soon as user configures) */}
        {currentFare != null && (
          <div className="p-3 sm:p-4 rounded-m3-xl bg-m3-surface border border-m3-outline-variant shadow-2xs space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <span className="text-micro font-bold uppercase tracking-wider text-m3-on-surface-variant block">
                  Quoted Fare (Vehicle + Driver Bata) {needGst ? '+ 5% GST' : ''}
                </span>
                <span className="text-xs text-m3-on-surface-variant">
                  {activeVehicle?.name} • {activeVehicle?.perKmRate}/km • {durationLabel}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-extrabold text-m3-on-surface font-heading leading-none block">
                  {activePayableFare}
                </span>
                <span className="text-[11px] font-bold text-emerald-700">
                  ₹0 Advance Required
                </span>
              </div>
            </div>

            {/* Two-tier breakdown: Quoted vs At-Actuals */}
            <div className="pt-2 border-t border-m3-outline-variant/50 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-m3-on-surface-variant font-medium">
                <span className="flex items-center gap-1"><span className="text-emerald-600 font-bold">✓</span> Vehicle Hire & Fuel</span>
                <span className="flex items-center gap-1"><span className="text-emerald-600 font-bold">✓</span> Driver Bata Included</span>
                <span className="flex items-center gap-1"><span className="text-emerald-600 font-bold">✓</span> Doorstep Chennai Pickup</span>
                <span className="flex items-center gap-1"><span className="text-emerald-600 font-bold">✓</span> ₹0 Advance Policy</span>
              </div>
              <div className="pt-1.5 border-t border-m3-outline-variant/40 text-[11px] text-amber-800 bg-amber-50/60 rounded-m3-md px-2 py-1.5 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>At Actuals (billed separately):</strong> ECR FASTag tolls (~₹200–340 RT) • Puducherry UT permit (~₹500) • Parking (varies by spot)</span>
              </div>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS (M3 Standard Layout) */}
        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
          
          {/* Primary Action: WhatsApp Booking */}
          <WhatsAppButton
            href={whatsAppUrl}
            text={hasVehicle && currentFare ? "Book via WhatsApp (₹0 Adv)" : "Check Cab Availability"}
            size="md"
            variant="filled"
            className="flex-1 px-5 py-3 text-xs sm:text-sm font-bold shadow-xs justify-center"
            data-direct-whatsapp="true"
            onClick={handleBookWhatsApp}
          />

          {/* Secondary Action: Call Dispatch */}
          <a
            href="tel:+918939539211"
            onClick={handleCall}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white hover:bg-m3-surface-container text-m3-on-surface font-bold text-xs sm:text-sm rounded-m3-full border border-m3-outline-variant shadow-xs transition-colors shrink-0 cursor-pointer"
            aria-label="Call +91 89395 39211"
          >
            <Phone className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
            <span>Call Dispatch</span>
          </a>

        </div>

      </form>

      {/* TRIP ESTIMATE & OFFICIAL GST PROFORMA POPUP MODAL (Portal for clean viewport placement) */}
      {showPopup && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Trip Fare Estimate and GST Proforma"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div 
            ref={modalScrollRef}
            className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-m3-2xl shadow-m3-3 border border-slate-300 p-4 sm:p-6 space-y-4 text-m3-on-surface"
          >
            
            {/* Modal Header Bar */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-m3-outline-variant">
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-m3-full bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 mb-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Official Verified Estimate</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading leading-tight">
                  Trip Fare Estimate &amp; Proforma Invoice
                </h3>
                <p className="text-micro text-slate-500 font-mono mt-0.5">
                  Ref No: {invoiceRefNo} • SAC: 9966 Rent-a-Cab
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                aria-label="Close estimate modal"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Validation Warning */}
            {modalValidationError && (
              <div className="p-2.5 rounded-m3-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalValidationError}</span>
              </div>
            )}

            {/* Guest / Firm Contact Details Block in Modal */}
            <div className="p-3 rounded-m3-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <span className="font-bold text-slate-800 block text-micro uppercase tracking-wider">
                Guest / Firm Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-micro font-semibold text-slate-600 mb-0.5">
                    Guest / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter full name or firm"
                    className="w-full bg-white border border-slate-300 rounded-m3-md px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:border-m3-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-micro font-semibold text-slate-600 mb-0.5">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-white border border-slate-300 rounded-m3-md px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:border-m3-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Itemized Fare Schedule Table */}
            <div className="rounded-m3-xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-600 text-micro uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2 sm:p-2.5">Particulars</th>
                    <th className="p-2 sm:p-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-2 sm:p-2.5 font-medium">
                      AC Vehicle Hire &amp; Fuel ({activeVehicle?.name})<br />
                      <span className="text-micro text-slate-500">
                        {durationLabel} • Doorstep Pickup ➔ Pondicherry ➔ Return
                      </span>
                    </td>
                    <td className="p-2 sm:p-2.5 text-right font-mono font-bold">
                      ₹{fareBreakdown?.vehicleHireFare?.toLocaleString('en-IN') || taxableAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 sm:p-2.5 font-medium">
                      Chauffeur Duty &amp; Allowance (Driver Bata)<br />
                      <span className="text-micro text-slate-500">
                        {isNightBatta ? 'Includes ₹400 late night duty allowance' : 'All-inclusive driver charges'}
                      </span>
                    </td>
                    <td className="p-2 sm:p-2.5 text-right font-mono font-bold">
                      ₹{((fareBreakdown?.driverBata || 0) + nightBattaAmount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="bg-amber-50/40">
                    <td className="p-2 sm:p-2.5 font-medium">
                      ECR FASTag Tolls (Uthandi + Kovalam plazas)<br />
                      <span className="text-micro text-slate-500">Estimated ~₹200–₹340 round-trip • billed at actual plaza deduction</span>
                    </td>
                    <td className="p-2 sm:p-2.5 text-right font-mono text-amber-700 font-bold text-[11px]">
                      At Actuals
                    </td>
                  </tr>
                  <tr className="bg-amber-50/40">
                    <td className="p-2 sm:p-2.5 font-medium">
                      Puducherry UT Commercial Vehicle Entry Permit<br />
                      <span className="text-micro text-slate-500">Parivahan checkpost — ~₹500 per trip (government regulated)</span>
                    </td>
                    <td className="p-2 sm:p-2.5 text-right font-mono text-amber-700 font-bold text-[11px]">
                      At Actuals
                    </td>
                  </tr>
                  <tr className="bg-amber-50/40">
                    <td className="p-2 sm:p-2.5 font-medium">
                      Parking Fees<br />
                      <span className="text-micro text-slate-500">Auroville Visitors Centre: ₹100/car • White Town: varies (restricted Sat–Sun 2–10 PM)</span>
                    </td>
                    <td className="p-2 sm:p-2.5 text-right font-mono text-amber-700 font-bold text-[11px]">
                      At Actuals
                    </td>
                  </tr>
                  {needGst && (
                    <>
                      <tr className="bg-slate-50/70">
                        <td className="p-2 sm:p-2.5 font-medium">Taxable Supply Subtotal</td>
                        <td className="p-2 sm:p-2.5 text-right font-mono font-bold">
                          ₹{taxableAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                      {isIntraState ? (
                        <>
                          <tr>
                            <td className="p-2 sm:p-2.5 text-slate-600">CGST (2.5%)</td>
                            <td className="p-2 sm:p-2.5 text-right font-mono">₹{cgst.toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td className="p-2 sm:p-2.5 text-slate-600">SGST (2.5%)</td>
                            <td className="p-2 sm:p-2.5 text-right font-mono">₹{sgst.toLocaleString('en-IN')}</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td className="p-2 sm:p-2.5 text-slate-600">IGST (5.0% - Inter-State)</td>
                          <td className="p-2 sm:p-2.5 text-right font-mono">₹{igst.toLocaleString('en-IN')}</td>
                        </tr>
                      )}
                    </>
                  )}
                  <tr className="bg-emerald-50/80 text-emerald-950 font-bold text-sm">
                    <td className="p-2.5 sm:p-3">Total Estimated Amount</td>
                    <td className="p-2.5 sm:p-3 text-right font-mono text-base font-extrabold text-emerald-900">
                      {activePayableFare}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Terms Notice */}
            <div className="p-2.5 rounded-m3-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] space-y-0.5">
              <strong className="block font-bold">Zero Advance Payment Policy:</strong>
              <p>No card or bank advance needed. Pay 100% of the fare directly to the chauffeur after reaching destination / completing your trip.</p>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintLetterhead}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-m3-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Letterhead</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadEstimate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-m3-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
              </div>

              <WhatsAppButton
                href={whatsAppUrl}
                text="Confirm via WhatsApp"
                size="md"
                variant="filled"
                onClick={handleModalWhatsAppClick}
              />
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Download Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-[10000] px-4 py-3 rounded-m3-xl bg-slate-900 text-white text-xs font-bold shadow-m3-3 border border-slate-700 flex items-center gap-2 animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Estimate document downloaded successfully.</span>
        </div>
      )}

    </div>
  );
}
