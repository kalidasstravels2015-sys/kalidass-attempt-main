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

// Vehicle data and all-inclusive round-trip package rates for Rameswaram & Dhanushkodi Tour
const VEHICLES = [
  {
    id: 'dzire',
    name: 'Swift Dzire / Toyota Etios',
    shortName: 'AC Sedan',
    capacity: 4,
    luggage: '2 Bags',
    tag: 'Best Value',
    rates: { 1: 9800, 2: 15500, 3: 21000 },
    vehicleHire: { 1: 7800, 2: 12500, 3: 16800 },
    driverBata: { 1: 2000, 2: 3000, 3: 4200 },
    extraHourRate: 150
  },
  {
    id: 'ertiga',
    name: 'Maruti Ertiga / XL6',
    shortName: 'Comfort SUV',
    capacity: 6,
    luggage: '3 Bags',
    tag: 'Family Favorite',
    rates: { 1: 12000, 2: 18500, 3: 25000 },
    vehicleHire: { 1: 9600, 2: 14900, 3: 20000 },
    driverBata: { 1: 2400, 2: 3600, 3: 5000 },
    extraHourRate: 200
  },
  {
    id: 'innova',
    name: 'Toyota Innova',
    shortName: 'Spacious MUV',
    capacity: 7,
    luggage: '4 Bags',
    tag: 'Elders Choice',
    rates: { 1: 14500, 2: 22000, 3: 29800 },
    vehicleHire: { 1: 11700, 2: 17800, 3: 24000 },
    driverBata: { 1: 2800, 2: 4200, 3: 5800 },
    extraHourRate: 200
  },
  {
    id: 'crysta',
    name: 'Toyota Innova Crysta',
    shortName: 'Luxury MUV',
    capacity: 7,
    luggage: '4 Bags',
    tag: 'VIP Luxury',
    rates: { 1: 17000, 2: 26000, 3: 35000 },
    vehicleHire: { 1: 13800, 2: 21200, 3: 28400 },
    driverBata: { 1: 3200, 2: 4800, 3: 6600 },
    extraHourRate: 250
  },
  {
    id: 'tempo12',
    name: '12-Seater Tempo Traveller',
    shortName: 'Mini Coach',
    capacity: 12,
    luggage: '8 Bags',
    tag: 'Group Darshan',
    rates: { 1: 20500, 2: 31000, 3: 42000 },
    vehicleHire: { 1: 16500, 2: 25000, 3: 33800 },
    driverBata: { 1: 4000, 2: 6000, 3: 8200 },
    extraHourRate: 300
  },
  {
    id: 'tempo17',
    name: '17-Seater Tempo Traveller',
    shortName: 'Executive Coach',
    capacity: 17,
    luggage: '12 Bags',
    tag: 'Large Group',
    rates: { 1: 25000, 2: 38000, 3: 51000 },
    vehicleHire: { 1: 20200, 2: 30800, 3: 41200 },
    driverBata: { 1: 4800, 2: 7200, 3: 9800 },
    extraHourRate: 400
  }
];

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

export default function RameswaramBookingEngine({
  serviceTitle = 'Chennai to Rameswaram & Dhanushkodi Cab Package (2 Days / 1 Night)'
}) {
  const pickupId = useId();
  const pickupDateTimeId = useId();
  const returnDateTimeId = useId();
  const passengersId = useId();
  const vehicleId = useId();

  // State — all fields start empty; user must choose
  const [pickup, setPickup] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [validationError, setValidationError] = useState('');
  const pickupInputRef = useRef(null);
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
              trackEvent('rameswaram_engine_gps_used', { success: true });
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

  const fixedDrop = 'Ramanathaswamy Temple, Dhanushkodi & Pamban Bridge, Tamil Nadu';

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
        setVehicleIdState(vehicleId);
        if (validationError) setValidationError('');
        const bookingEl = document.getElementById('booking');
        if (bookingEl) {
          bookingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    window.addEventListener('select-rameswaram-vehicle', handleExternalVehicleSelect);
    return () => window.removeEventListener('select-rameswaram-vehicle', handleExternalVehicleSelect);
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

  // Fair Outstation Fare Calculation strictly compliant with Government & Transport Department rules:
  // 1. Fixed route packages (1-Day / 2-Day / 3-Day) cover vehicle hire, fuel, NH FASTag tolls, AP border permit, and Tirumala ghat ascent.
  // 2. Chauffeur outstation duty & halting bata is bundled as standard market tariff (driver stays in vehicle/dormitory, no hotel room required from guest).
  // 3. Extra running hours for intermediate durations (pro-rata) are protected and capped at the official multi-day package tariff.
  const calculateVehicleFare = (veh, durInfo) => {
    if (!veh || !durInfo || !durInfo.hasDates) return null;

    const { days: numDays, isProRata, extraHours, baseDays, cappedDays } = durInfo;

    // Pro-rata intermediate duration (Day + Hour, e.g. 1 Day + 1 hr to 1 Day + 23 hrs)
    if (isProRata) {
      const basePackageRate = veh.rates[baseDays]; // e.g. 1-day base ₹6,000
      const capPackageRate = veh.rates[cappedDays]; // e.g. 2-day ceiling ₹9,500
      const baseVehicleHire = veh.vehicleHire[baseDays];
      const capVehicleHire = veh.vehicleHire[cappedDays];
      const baseDriverBata = veh.driverBata[baseDays];
      const capDriverBata = veh.driverBata[cappedDays];

      // Package Delta across the 24 hours between baseDays and cappedDays
      const packageDelta = capPackageRate - basePackageRate;
      const unitHourlyRate = Math.round(packageDelta / 24);

      // Model 2: Exact linear scaling matching (basePackageRate + extra hours) to (capPackageRate - remaining hours)
      // At extraHours = 1: base + 1 hr
      // At extraHours = 23: cap - 1 hr (exact match!)
      const rawExtra = (extraHours * packageDelta) / 24;
      const hourlyExtraFare = Math.round(rawExtra / 50) * 50;
      const totalFare = basePackageRate + hourlyExtraFare;

      // Proportional split between vehicle hire and driver bata
      const vehDelta = capVehicleHire - baseVehicleHire;
      const rawVehExtra = (extraHours * vehDelta) / 24;
      const vehExtra = Math.round(rawVehExtra / 50) * 50;
      const vehicleHireFare = baseVehicleHire + vehExtra;
      const driverBata = totalFare - vehicleHireFare; // Exactly adds up to totalFare

      const savings = Math.max(0, capPackageRate - totalFare);

      return {
        totalFare,
        packageType: 'pro_rata',
        vehicleHireFare,
        driverBata,
        baseFare: basePackageRate,
        packageDays: baseDays,
        baseDays,
        cappedDays,
        extraHoursFare: hourlyExtraFare,
        extraHours,
        hourlyRate: unitHourlyRate,
        isProRata: true,
        isCapped: false,
        maxCapFare: capPackageRate,
        savings,
        pricingModel: `${baseDays} Day + ${extraHours} hr Tariff`
      };
    }

    // Standard 1, 2, or 3-Day Package
    if (numDays <= 3) {
      const packageRate = veh.rates[numDays];
      const vehicleHireFare = veh.vehicleHire[numDays];
      const driverBata = veh.driverBata[numDays];

      return {
        totalFare: packageRate,
        packageType: numDays === 1 ? 'standard_1day' : 'multi_day',
        vehicleHireFare,
        driverBata,
        baseFare: packageRate,
        packageDays: numDays,
        extraHoursFare: 0,
        extraHours: 0,
        isProRata: false,
        isCapped: false,
        maxCapFare: packageRate,
        savings: 0,
        pricingModel: `${numDays}-Day Approved Package Tariff`
      };
    }

    // 4+ Days Package
    const extraDays = numDays - 3;
    const extraPerDay = veh.rates[2] - veh.rates[1];
    const extraVehPerDay = veh.vehicleHire[2] - veh.vehicleHire[1];
    const extraBataPerDay = veh.driverBata[2] - veh.driverBata[1];

    const packageRate = veh.rates[3] + (extraDays * extraPerDay);
    const vehicleHireFare = veh.vehicleHire[3] + (extraDays * extraVehPerDay);
    const driverBata = veh.driverBata[3] + (extraDays * extraBataPerDay);

    return {
      totalFare: packageRate,
      packageType: 'multi_day',
      vehicleHireFare,
      driverBata,
      baseFare: packageRate,
      packageDays: numDays,
      extraHoursFare: 0,
      extraHours: 0,
      isProRata: false,
      isCapped: false,
      maxCapFare: packageRate,
      savings: 0,
      pricingModel: `${numDays}-Day Approved Package Tariff`
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
  // Inter-State: Supplier (33) to Recipient (any other state, e.g. 29 Karnataka, 36 Telangana, 37 AP) -> IGST 5.0%
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

  // Detailed pricing note for WhatsApp
  let pricingNote = '';
  if (fareBreakdown) {
    if (fareBreakdown.isProRata && !fareBreakdown.isCapped) {
      pricingNote = ` (Fair Pro-Rata: ₹${fareBreakdown.vehicleHireFare.toLocaleString('en-IN')} Hire + ₹${fareBreakdown.driverBata.toLocaleString('en-IN')} Bata + ${fareBreakdown.extraHours} hrs @ ₹${activeVehicle?.extraHourRate}/hr)`;
    } else if (isNightBatta) {
      pricingNote = ' (Includes ₹400 Driver Night Duty Allowance)';
    }
  }

  // Estimate Reference Number: CT/EST/MMYY/101 (Chennai to Tirupati / Estimate / MonthYear / Starting serial 101)
  const invoiceRefNo = getEstimateRefNo(pickupDateTime);

  // WhatsApp Message Manifest
  const whatsAppMessage = needGst ? `*Kalidass Travels - Rameswaram & Dhanushkodi Cab Booking (Official Proforma Trip Estimate)*
• Service: ${serviceTitle}
• Estimate Ref: ${invoiceRefNo}
• Supplier GSTIN: 33COVPM0531D1Z4 (SAC: 9966 Rent-a-Cab)
• Supplier State: 33 - Tamil Nadu
• Place of Supply: ${placeOfSupply}
${companyName.trim() ? `• Recipient / Firm: ${companyName.trim()}\n` : ''}${cleanedGst ? `• Recipient GSTIN: ${cleanedGst} (${recipientStateName})\n` : ''}${customerPhone.trim() ? `• Contact Mobile: ${customerPhone.trim()}\n` : ''}• Trip Type: Round Trip${durationLabel ? ` (${durationLabel}, ${durationHours} hrs)` : ''}
• Pickup: ${formatDT(pickupDateTime)}
• Return: ${formatDT(returnDateTime)}${isNightBatta ? ' (Late Night Return after 11 PM)' : ''}
• Pickup Location: ${pickup.trim() || 'Chennai (Doorstep Pickup Included)'}
• Destination: ${fixedDrop}
• Darshan Ticket: Not included (Cab service only)
• Passengers: ${passengers} Devotee${parseInt(passengers, 10) > 1 ? 's' : ''}
• Selected Vehicle: ${activeVehicle ? `${activeVehicle.name} (${activeVehicle.shortName})` : 'Not selected'}
• Taxable Package Value: ₹${taxableAmount.toLocaleString('en-IN')}
${isIntraState 
  ? `• CGST (2.5%): ₹${cgst.toLocaleString('en-IN')}\n• SGST (2.5%): ₹${sgst.toLocaleString('en-IN')}` 
  : `• IGST (5.0% - Inter-State): ₹${igst.toLocaleString('en-IN')}`}
• Total GST Tax (5%): ₹${totalGst.toLocaleString('en-IN')}
• Total Estimate Payable: ₹${finalNetPayable?.toLocaleString('en-IN')}${grandTotalInWords ? ` (${grandTotalInWords})` : ''}
• Advance Required: ₹0 (Pay chauffeur after trip completion)
• ITC Status: 100% Eligible for Corporate ITC Claim (Sec 16/17(5) CGST Act)

Please confirm cab allocation and issue formal GST trip estimate.`
: `*Kalidass Travels - Rameswaram & Dhanushkodi Cab Booking*
• Service: ${serviceTitle}
• Estimate Ref: ${invoiceRefNo}
${companyName.trim() ? `• Devotee / Passenger: ${companyName.trim()}\n` : ''}${customerPhone.trim() ? `• Contact Mobile: ${customerPhone.trim()}\n` : ''}• Trip Type: Round Trip${durationLabel ? ` (${durationLabel}, ${durationHours} hrs)` : ''}
• Pickup (Date & Time): ${formatDT(pickupDateTime)}
• Return (Date & Time): ${formatDT(returnDateTime)}${isNightBatta ? ' (Late Night Return after 11 PM)' : ''}
• Pickup Location: ${pickup.trim() || 'Chennai (Doorstep Pickup Included)'}
• Destination: ${fixedDrop}
• Inclusions: 100% Fuel + 1,200 km Coverage + NH Tolls + 22 Theerthams & Dhanushkodi + Driver Bata Included
• Driver Lodging: Chauffeur rests in vehicle / pilgrim dormitories (No hotel room required from guest)
• Passengers: ${passengers} Devotee${parseInt(passengers, 10) > 1 ? 's' : ''}
• Selected Vehicle: ${activeVehicle ? `${activeVehicle.name} (${activeVehicle.shortName})` : 'Not selected'}
• Total All-Inclusive Fare: ${formattedFare || 'TBD'}${pricingNote}
• Payment Terms: ₹0 Advance Required • Pay Chauffeur After Trip Completion

Please confirm chauffeur allocation for my Rameswaram & Dhanushkodi pilgrimage yatra.`;

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
      setModalValidationError('Please enter Devotee / Company Name before proceeding.');
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
      grandTotalInWords
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
      grandTotalInWords
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
    trackEvent('rameswaram_engine_estimate_opened', {
      vehicle: activeVehicle?.name,
      fare: currentFare,
      passengers,
      pickup: pickup.trim() || 'Chennai'
    });
  };

  const handleBookWhatsApp = () => {
    trackEvent('rameswaram_engine_booked', {
      vehicle: activeVehicle ? activeVehicle.name : 'none',
      passengers,
      days,
      fare: currentFare,
      pickup: pickup.trim() || 'Chennai'
    });
    setShowPopup(false);
  };

  const handleDirectWhatsAppClick = (e) => {
    if (!validateCardInputs()) {
      if (e) e.preventDefault();
      return;
    }

    // Auto-download standalone estimate letterhead document only if GST / corporate mode is active
    if (needGst) {
      try {
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
          pickup: pickup.trim() || 'Chennai',
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
          grandTotalInWords
        });
        setDownloadToast(true);
        setTimeout(() => setDownloadToast(false), 9000);
      } catch (err) {
        console.warn('Could not auto-download estimate document:', err);
      }
    }

    setValidationError('');
    handleBookWhatsApp();
  };

  const handleCall = () => {
    trackEvent('rameswaram_engine_call_clicked', {
      vehicle: activeVehicle ? activeVehicle.name : 'none',
      passengers,
      days
    });
  };

  // Close popup on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPopup) {
        setShowPopup(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPopup]);

  return (
    <>
      <section 
        aria-label="Rameswaram Pilgrimage Booking Engine"
        className="w-full max-w-2xl mx-auto bg-m3-surface rounded-m3-2xl shadow-m3-2 border border-m3-outline-variant overflow-hidden font-sans"
      >
        {/* Title Header */}
        <div className="py-2.5 px-4 sm:px-5 text-center border-b border-m3-outline-variant/60 bg-m3-surface">
          <h2 className="text-lg sm:text-xl font-bold text-m3-on-surface font-heading">
            Book Chennai to Rameswaram
          </h2>
          <p className="text-[11px] sm:text-xs text-m3-on-surface-variant mt-0.5">
            Round trip private AC cab package • Fixed tariff with ₹0 advance
          </p>
        </div>

        {/* Form Body */}
        <div className="p-3.5 sm:p-5 space-y-2.5">
          
          {/* 1. Pickup Input Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor={pickupId} className="text-xs font-bold text-m3-on-surface flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-m3-on-surface-variant shrink-0" />
                <span>Pickup Location in Chennai</span>
              </label>
              <span className="text-[10px] text-m3-on-surface-variant">Doorstep Pickup Included</span>
            </div>
            <div className="relative">
              <input
                id={pickupId}
                ref={pickupInputRef}
                type="text"
                autoComplete="off"
                value={pickup}
                onChange={(e) => {
                  setPickup(e.target.value);
                  if (validationError) setValidationError('');
                }}
                onFocus={() => {
                  loadGoogleMaps().catch(() => {});
                }}
                placeholder="Enter pickup address in Chennai"
                className="w-full bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-lg px-3 py-2 text-xs sm:text-sm text-m3-on-surface placeholder-m3-on-surface-variant/60 focus:outline-none focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 transition-all pr-16 shadow-2xs"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {pickup && (
                  <button
                    type="button"
                    onClick={() => setPickup('')}
                    aria-label="Clear pickup location"
                    title="Clear pickup location"
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-m3-surface-container text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={gettingLocation}
                  aria-label="Use current location"
                  title="Use current location"
                  className="w-7 h-7 flex items-center justify-center rounded-m3-sm hover:bg-m3-surface-container text-m3-on-surface-variant hover:text-m3-primary transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LocateFixed className={`w-4 h-4 ${gettingLocation ? 'animate-spin text-m3-primary' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Fixed Drop Notice (Subtle, Clean & Neutral) */}
          <div className="py-1.5 px-2.5 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant/60 flex items-center justify-between text-[11px] text-m3-on-surface">
            <div className="flex items-center gap-1.5 min-w-0">
              <Navigation className="w-3 h-3 text-m3-on-surface-variant shrink-0" />
              <span className="truncate">
                <strong className="text-m3-on-surface">Fixed Destination:</strong> Ramanathaswamy Temple &amp; Dhanushkodi
              </span>
            </div>
            <span className="text-[9.5px] font-semibold text-m3-on-surface-variant bg-m3-surface-container px-1.5 py-0.5 rounded-m3-sm shrink-0 border border-m3-outline-variant/50">1,200 km &amp; Tolls Paid</span>
          </div>

          {/* 3. Pickup DateTime & Return DateTime */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="space-y-1">
                <label htmlFor={pickupDateTimeId} className="text-[11px] sm:text-xs font-bold text-m3-on-surface flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-m3-on-surface-variant shrink-0" />
                  <span className="truncate">Pickup Date &amp; Time</span>
                </label>
                <input
                  id={pickupDateTimeId}
                  type="datetime-local"
                  value={pickupDateTime}
                  min={getMinDateTime()}
                  onChange={handlePickupDateTimeChange}
                  className="w-full bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-lg px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm text-m3-on-surface focus:outline-none focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor={returnDateTimeId} className="text-[11px] sm:text-xs font-bold text-m3-on-surface flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-m3-on-surface-variant shrink-0" />
                  <span className="truncate">Return Date &amp; Time</span>
                </label>
                <input
                  id={returnDateTimeId}
                  type="datetime-local"
                  value={returnDateTime}
                  min={pickupDateTime || getMinDateTime()}
                  onChange={(e) => {
                    setReturnDateTime(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="w-full bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-lg px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm text-m3-on-surface focus:outline-none focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Clean Result Banner directly attached after dates with Why? detail toggle */}
            {durationInfo.hasDates ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50/90 border border-emerald-200/90 rounded-m3-md text-xs animate-in fade-in duration-150">
                <span className="font-bold text-emerald-950 whitespace-nowrap text-[11px]">
                  {durationLabel}
                </span>
                <span className="text-[10px] text-emerald-800/80 font-medium whitespace-nowrap">
                  ({durationHours} hrs)
                </span>
                {durationSubText && (
                  <span className="text-[10px] font-semibold text-emerald-800 bg-white/90 px-1.5 py-0.5 rounded-full border border-emerald-200/80 shrink-0 whitespace-nowrap">
                    {durationSubText}
                  </span>
                )}
              </div>
            ) : null}

            {/* Late night driving allowance alert (only after 11 PM grace window) */}
            {isNightBatta && (
              <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-m3-md px-2.5 py-1.5 leading-snug flex items-center gap-1.5 font-medium">
                <span>⚠ Return after 11 PM: Standard ₹400 driver night allowance applies (1-hr traffic grace until 11 PM included)</span>
              </p>
            )}
          </div>

          {/* 4. Passenger selection & Vehicle selection in SAME ROW with auto-filtering */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-0.5">
            {/* Passenger selection */}
            <div className="space-y-1">
              <label htmlFor={passengersId} className="text-[11px] sm:text-xs font-bold text-m3-on-surface flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-m3-on-surface-variant shrink-0" />
                  <span>Passengers</span>
                </span>
                <span className="text-[9.5px] text-m3-on-surface-variant hidden sm:inline">Auto-filters</span>
              </label>
              <div className="relative flex items-center bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-lg transition-colors focus-within:border-m3-primary focus-within:ring-2 focus-within:ring-m3-primary/20 shadow-2xs">
                <select
                  id={passengersId}
                  value={passengers}
                  onChange={(e) => handlePassengerChange(e.target.value)}
                  className="w-full bg-transparent appearance-none outline-none cursor-pointer px-2.5 py-1.5 sm:py-2 pr-7 text-xs sm:text-sm font-semibold text-m3-on-surface"
                >
                  <option value="" disabled>Select passengers...</option>
                  {PASSENGER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 shrink-0" />
              </div>
            </div>

            {/* Vehicle selection */}
            <div className="space-y-1">
              <label htmlFor={vehicleId} className="text-[11px] sm:text-xs font-bold text-m3-on-surface flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-m3-on-surface-variant shrink-0" />
                  <span>Vehicle Model</span>
                </span>
                <span className="text-[9.5px] text-m3-on-surface-variant font-medium hidden sm:inline">
                  {availableVehicles.length} eligible
                </span>
              </label>
              <div className={`relative flex items-center border rounded-m3-lg transition-colors shadow-2xs ${!passengers ? 'bg-m3-surface-container-low border-m3-outline-variant/60 opacity-60 cursor-not-allowed' : 'bg-white border-m3-outline-variant hover:border-m3-outline focus-within:border-m3-primary focus-within:ring-2 focus-within:ring-m3-primary/20'}`}>
                <select
                  id={vehicleId}
                  value={vehicleIdState}
                  onChange={(e) => {
                    setVehicleIdState(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  disabled={!passengers}
                  className="w-full bg-transparent appearance-none outline-none cursor-pointer px-2.5 py-1.5 sm:py-2 pr-7 text-xs sm:text-sm font-semibold text-m3-on-surface disabled:cursor-not-allowed truncate"
                >
                  <option value="" disabled>{passengers ? 'Choose vehicle...' : 'Select passengers first'}</option>
                  {availableVehicles.map(veh => (
                    <option key={veh.id} value={veh.id}>
                      {veh.name} ({veh.capacity} Pax)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 shrink-0" />
              </div>
            </div>
          </div>



          {/* Validation Feedback Text */}
          {validationError && (
            <p 
              role="alert"
              className="text-xs text-rose-600 font-medium text-center flex items-center justify-center gap-1.5 animate-in fade-in duration-150 py-0.5"
            >
              <Info className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </p>
          )}

          {/* UNIFIED FARE SUMMARY & BOOKING ACTION — Option A Progressive Disclosure */}
          {formattedFare ? (
            <div className="pt-2.5 border-t border-m3-outline-variant/60 space-y-2.5 animate-in fade-in duration-200">
              
              {/* 1. Hero Price & Guarantee */}
              <div className="pt-0.5">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl sm:text-4xl font-extrabold text-m3-on-surface font-heading tracking-tight leading-none">
                    {activePayableFare}
                  </div>
                  <span className="text-[11px] sm:text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-m3-sm border border-emerald-200">
                    {needGst ? '✓ All-Inclusive GST Fare (+5% ITC)' : '✓ All-Inclusive Fixed Fare'}
                  </span>
                </div>
              </div>

              {/* 2. Package Status & Inclusions */}
              <div>
                <p className="text-xs text-m3-on-surface-variant font-medium leading-relaxed">
                  {needGst 
                    ? 'Covers 1,200 km + NH FASTag Tolls + Driver Bata + 5% GST' 
                    : 'Covers 1,200 km + NH FASTag Tolls + Driver Bata'}
                </p>
              </div>

              {/* 3. Collapsible Fare Breakdown & Line Items */}
              <div className="border border-m3-outline-variant/80 rounded-m3-xl overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-m3-on-surface hover:bg-m3-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>
                      {showBreakdown 
                        ? (needGst ? 'Hide GST Itemized Fare Breakdown' : 'Hide Itemized Fare Breakdown')
                        : (needGst ? 'View GST Itemized Fare Breakdown & Inclusions' : 'View Itemized Fare Breakdown & Inclusions')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-m3-on-surface-variant font-semibold">
                    <span>{showBreakdown ? 'Collapse' : 'Expand'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showBreakdown ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {showBreakdown && (
                  <div className="p-3 border-t border-m3-outline-variant/60 bg-m3-surface-container-lowest text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="space-y-1.5 divide-y divide-m3-outline-variant/40 text-[11.5px]">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-m3-on-surface-variant">Dedicated AC Vehicle Hire &amp; Fuel ({activeVehicle?.name}):</span>
                        <span className="font-bold text-m3-on-surface">₹{Number(fareBreakdown?.vehicleHireFare || taxableAmount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-m3-on-surface-variant">Chauffeur Duty &amp; Halting Batta:</span>
                        <span className="font-bold text-m3-on-surface">₹{Number(fareBreakdown?.driverBata || 0).toLocaleString('en-IN')}</span>
                      </div>
                      {isNightBatta && (
                        <div className="flex justify-between items-center py-1 text-amber-900">
                          <span>Late Night Shift Driving Allowance (11 PM - 4 AM):</span>
                          <span className="font-bold">₹400</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-m3-on-surface-variant">NH 38 &amp; NH 87 FASTag Tolls:</span>
                        <span className="font-bold text-emerald-700">INCLUDED (₹0)</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-m3-on-surface-variant">Dhanushkodi &amp; Pamban Bridge Route:</span>
                        <span className="font-bold text-emerald-700">INCLUDED (₹0)</span>
                      </div>

                      {needGst ? (
                        <>
                          <div className="flex justify-between items-center py-1 text-slate-700 font-medium">
                            <span>Subtotal Taxable Base Value:</span>
                            <span className="font-bold">₹{Number(taxableAmount).toLocaleString('en-IN')}</span>
                          </div>
                          {isIntraState ? (
                            <>
                              <div className="flex justify-between items-center py-0.5 text-emerald-900">
                                <span className="pl-2 text-m3-on-surface-variant">CGST @ 2.5% (SAC 9966):</span>
                                <span className="font-bold">+₹{Number(cgst).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between items-center py-0.5 text-emerald-900">
                                <span className="pl-2 text-m3-on-surface-variant">SGST @ 2.5% (SAC 9966):</span>
                                <span className="font-bold">+₹{Number(sgst).toLocaleString('en-IN')}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-center py-0.5 text-emerald-900">
                              <span className="pl-2 text-m3-on-surface-variant">IGST @ 5.0% (SAC 9966):</span>
                              <span className="font-bold">+₹{Number(igst).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center py-1 text-emerald-800 font-semibold bg-emerald-50/70 -mx-1 px-1 rounded">
                            <span>Total GST Tax Added (5%):</span>
                            <span className="font-bold">+₹{Number(totalGst).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 text-emerald-800 font-semibold">
                            <span>Corporate ITC Benefit:</span>
                            <span className="font-bold text-emerald-700">100% Claimable (-₹{Number(totalGst).toLocaleString('en-IN')})</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center py-1 text-slate-600">
                          <span>GST Tax:</span>
                          <span>₹0 (Cash Package Retail Fare)</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 font-bold text-xs text-m3-on-surface">
                        <span>Net Package Total:</span>
                        <span className="text-sm font-extrabold text-emerald-900">{activePayableFare}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 text-[11px] text-emerald-800">
                        <span>Advance Token Payment:</span>
                        <span className="font-bold">₹0 (Zero Advance Required)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Optional Passenger / Devotee Name (Compact & Non-blocking) */}
              {!needGst && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-m3-on-surface-variant flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Passenger / Devotee Name</span>
                    </span>
                    <span className="text-[10px] text-m3-on-surface-variant/70">Optional</span>
                  </label>
                  <input
                    ref={companyNameInputRef}
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder="e.g. Saravanan K (or confirm on WhatsApp)"
                    className="w-full bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-md px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-m3-on-surface placeholder-m3-on-surface-variant/60 focus:outline-none focus:border-m3-primary focus:ring-1 focus:ring-m3-primary shadow-2xs"
                  />
                </div>
              )}

              {/* 5. Primary 1-Tap Booking CTAs (Instant Conversion) */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
                <WhatsAppButton 
                  href={whatsAppUrl}
                  onClick={handleDirectWhatsAppClick}
                  variant="filled"
                  size="md"
                  className="flex-1 px-5 py-3 text-xs sm:text-sm font-bold shadow-xs justify-center"
                  text="Book on WhatsApp"
                />

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

              {/* 6. Progressive Disclosure: Corporate GST & Official Estimate (Discreet Opt-In) */}
              <div className="pt-2 border-t border-m3-outline-variant/40 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-m3-on-surface hover:text-emerald-800 transition-colors min-w-0">
                    <input
                      type="checkbox"
                      checked={needGst}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNeedGst(checked);
                        if (checked) setShowBreakdown(true);
                        if (validationError) setValidationError('');
                      }}
                      className="w-4 h-4 rounded text-emerald-700 border-m3-outline-variant focus:ring-emerald-500 cursor-pointer accent-emerald-700 shrink-0"
                    />
                    <span className="truncate">Need GST Tax Invoice for Corporate (+5% ITC)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleDirectPrintLetterhead}
                    title="Print or Save Official Trip Estimate Letterhead PDF"
                    className="text-[11px] font-semibold text-m3-on-surface-variant hover:text-m3-primary transition-colors cursor-pointer inline-flex items-center gap-1 shrink-0 whitespace-nowrap px-1.5 py-0.5 rounded hover:bg-m3-surface-container-low"
                  >
                    <Printer className="w-3.5 h-3.5 text-m3-on-surface-variant shrink-0" />
                    <span>Save PDF</span>
                  </button>
                </div>

                {needGst && (
                  <div className="p-2.5 sm:p-3 bg-m3-surface-container-low rounded-m3-xl border border-emerald-200 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Corporate Billing &amp; ITC Recipient Details</span>
                      </span>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        100% Tax Deductible
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-m3-on-surface flex items-center gap-1">
                          <span>Company Name <span className="text-red-500">*</span></span>
                        </label>
                        <input
                          ref={companyNameInputRef}
                          type="text"
                          value={companyName}
                          onChange={(e) => {
                            setCompanyName(e.target.value);
                            if (validationError) setValidationError('');
                          }}
                          placeholder="e.g. Infosys BPM Ltd"
                          className="w-full bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-md px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm text-m3-on-surface placeholder-m3-on-surface-variant/60 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-m3-on-surface flex items-center gap-1">
                          <span>Client GSTIN <span className="text-[10px] text-m3-on-surface-variant font-normal">(Optional)</span></span>
                        </label>
                        <input
                          ref={customerGstInputRef}
                          type="text"
                          maxLength={15}
                          value={customerGst}
                          onChange={(e) => {
                            setCustomerGst(e.target.value.toUpperCase());
                            if (validationError) setValidationError('');
                          }}
                          placeholder="e.g. 33AAAAA0000A1Z5"
                          className="w-full bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-md px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm text-m3-on-surface placeholder-m3-on-surface-variant/60 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs font-mono uppercase"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-m3-on-surface flex items-center gap-1">
                          <span>Contact Mobile <span className="text-red-500">*</span></span>
                        </label>
                        <input
                          ref={customerPhoneInputRef}
                          type="tel"
                          maxLength={15}
                          value={customerPhone}
                          onChange={(e) => {
                            setCustomerPhone(e.target.value);
                            if (validationError) setValidationError('');
                          }}
                          placeholder="e.g. 98400 12345"
                          className="w-full bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-md px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm text-m3-on-surface placeholder-m3-on-surface-variant/60 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Dynamic State Detection Tag */}
                    <div className="bg-white px-2.5 py-1.5 rounded-m3-md border border-emerald-200 flex items-center justify-between text-[11px] text-emerald-950">
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {rawStateCode ? (
                            isIntraState ? (
                              <span><strong>Intra-State ({rawStateCode} - TN):</strong> CGST @ 2.5% + SGST @ 2.5%</span>
                            ) : (
                              <span><strong>Inter-State ({rawStateCode} - {recipientStateName}):</strong> IGST @ 5.0%</span>
                            )
                          ) : (
                            <span><strong>Tamil Nadu Intra-State:</strong> 2.5% CGST + 2.5% SGST</span>
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                        ✓ ITC Claimable
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 7. Download Toast Notification (Only shown if GST mode downloaded) */}
              {downloadToast && (
                <div className="p-3 bg-emerald-900 text-white rounded-m3-lg text-xs flex items-center justify-between gap-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Trip Estimate Saved!</strong> In WhatsApp, tap the <strong>📎 (attach)</strong> icon to send the estimate to our dispatch team.
                    </span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setDownloadToast(false)} 
                    className="p-1 hover:bg-emerald-800 rounded transition text-emerald-200 cursor-pointer"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Initial State (Before Dates & Vehicle are selected) */
            <div className="pt-3 border-t border-m3-outline-variant/60 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleViewEstimateClick}
                aria-label="View Trip Estimate"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-xs sm:text-sm rounded-m3-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary shadow-m3-1 hover:shadow-m3-2 transition-all cursor-pointer group"
              >
                <Calculator className="w-4 h-4 shrink-0 text-m3-on-primary" />
                <span>View Trip Estimate</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <a
                href="tel:+918939539211"
                onClick={handleCall}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-m3-surface hover:bg-m3-surface-container text-m3-on-surface font-bold text-xs sm:text-sm rounded-m3-full border border-m3-outline-variant shadow-xs transition-all"
              >
                <Phone className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
                <span>Call: +91 89395 39211</span>
              </a>
            </div>
          )}

          {/* Subtle disclaimer below CTA buttons */}
          <p className="text-center text-xs text-m3-on-surface-variant font-medium pt-2 pb-1">
            Cab service only, Darshan Ticket Not Included.
          </p>

        </div>
      </section>

      {/* POP-UP MODAL — OFFICIAL GST.GOV.IN PROFORMA TAX INVOICE & TRIP ESTIMATE */}
      {showPopup && typeof document !== 'undefined' && createPortal(
        <div 
          id="gst-invoice-portal-root"
          data-printable-invoice-portal="true"
          data-hide-contact-dock
          role="dialog" 
          aria-modal="true" 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowPopup(false)}
        >
          <div 
            className="bg-white w-full max-w-full sm:max-w-[560px] md:max-w-[620px] rounded-2xl shadow-2xl border border-slate-300 flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200 text-slate-900 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Official Estimate Header Bar */}
            <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight font-heading leading-tight">
                    PROFORMA TRIP ESTIMATE &amp; GST BREAKDOWN
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    SAC: 9966 Passenger Road Transport • Official Proforma Quotation
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrintLetterhead}
                  title="Print / Save Official PDF Letterhead"
                  className="p-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-semibold no-print"
                >
                  <Printer className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowPopup(false)} 
                  className="p-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 transition cursor-pointer no-print"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Modal Scrollable Body */}
            <div ref={modalScrollRef} className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 text-xs">
              {modalValidationError && (
                <div role="alert" className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <Info className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{modalValidationError}</span>
                </div>
              )}

              {/* Supplier & Supply Metadata 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                {/* Left: Supplier Details */}
                <div className="p-2.5 sm:p-3 border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50/50">
                  <div className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider mb-0.5">
                    SUPPLIER / SERVICE PROVIDER
                  </div>
                  <div className="font-black text-slate-900 text-sm">KALIDASS TRAVELS</div>
                  <div className="font-mono text-[11px] font-bold text-blue-900 mt-0.5">
                    GSTIN: 33COVPM0531D1Z4
                  </div>
                  <div className="text-[11px] text-slate-700 mt-0.5">
                    State: <strong className="text-slate-900">Tamil Nadu (State Code: 33)</strong>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-snug mt-1">
                    No. 12, Pammal Main Road, Pallavaram, Chennai - 600075<br />
                    Ph: +91 89395 39211 • info@kalidasstravels.com
                  </div>
                </div>

                {/* Right: Invoice & Supply Metadata */}
                <div className="p-2.5 sm:p-3 bg-white flex flex-col justify-between text-[11px]">
                  <div className="space-y-1">
                    <div className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider mb-0.5">
                      PROFORMA ESTIMATION DETAILS
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10.5px]">Estimate Ref:</span>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">{invoiceRefNo}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10.5px]">Issue Date:</span>
                      <span className="font-medium text-slate-800">
                        {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10.5px]">Place of Supply:</span>
                      <span className="font-bold text-emerald-800">{placeOfSupply}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10.5px]">Reverse Charge:</span>
                      <span className="font-medium text-slate-700">No (Forward Charge)</span>
                    </div>
                  </div>
                  <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-500">Trip Route:</span>
                    <span className="font-bold text-slate-900">Chennai ⇄ Rameswaram & Dhanushkodi Tour</span>
                  </div>
                </div>
              </div>

              {/* Recipient Details & Input Box */}
              <div className="border border-slate-300 rounded-xl bg-slate-50/70 p-3 space-y-2.5 shadow-2xs">
                
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 text-xs">Recipient &amp; Invoice Billing Details</span>
                      <span className="text-[10px] text-slate-500 block">
                        B2B Official GST Tax Invoice (Claim 100% Corporate ITC)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recipient Input Fields */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">
                        Billed To / Company Name:
                      </label>
                      <input
                        ref={companyNameInputRef}
                        type="text"
                        placeholder="e.g. Acme Corp Pvt Ltd"
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          if (modalValidationError) setModalValidationError('');
                        }}
                        className={`w-full bg-white border ${modalHighlightedField === 'company' ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-md px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800`}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">
                        Recipient GSTIN (15 Digits):
                      </label>
                      <input
                        ref={customerGstInputRef}
                        type="text"
                        maxLength={15}
                        placeholder="e.g. 33AAAAA0000A1Z5"
                        value={customerGst}
                        onChange={(e) => {
                          setCustomerGst(e.target.value.toUpperCase());
                          if (modalValidationError) setModalValidationError('');
                        }}
                        className={`w-full bg-white border ${modalHighlightedField === 'gstin' ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-md px-2.5 py-1.5 text-xs font-mono uppercase text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800`}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">
                        Contact Phone Number:
                      </label>
                      <input
                        ref={customerPhoneInputRef}
                        type="tel"
                        maxLength={15}
                        placeholder="e.g. 98400 12345"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          if (modalValidationError) setModalValidationError('');
                        }}
                        className={`w-full bg-white border ${modalHighlightedField === 'phone' ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800`}
                      />
                    </div>
                  </div>

                  {/* Dynamic Real-time State & Tax Detection Banner */}
                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {rawStateCode ? (
                          isIntraState ? (
                            <span>
                              <strong>Intra-State Supply ({rawStateCode} - Tamil Nadu):</strong> CGST @ 2.5% + SGST @ 2.5%
                            </span>
                          ) : (
                            <span>
                              <strong>Inter-State Supply ({rawStateCode} - {recipientStateName}):</strong> IGST @ 5.0%
                            </span>
                          )
                        ) : (
                          <span>
                            <strong>Default (33 - Tamil Nadu):</strong> CGST @ 2.5% + SGST @ 2.5% • Enter client GSTIN above to calibrate
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      100% ITC Eligible
                    </span>
                  </div>
                </div>

                {/* Trip Itinerary Metadata Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10.5px] pt-1">
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Vehicle</span>
                    <strong className="text-slate-900 truncate block">{activeVehicle?.name || 'Selected Cab'}</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Duration</span>
                    <strong className="text-slate-900">{durationLabel || `${durationHours}h`}</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Passengers</span>
                    <strong className="text-slate-900">{passengers ? `${passengers} Pax` : 'Round Trip'}</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Pickup Area</span>
                    <strong className="text-slate-900 truncate block">{pickup.trim() || 'Chennai (Doorstep)'}</strong>
                  </div>
                </div>

              </div>

              {/* 4. Tabular Schedule of Services (SAC 9966) */}
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 pb-1 flex items-center justify-between">
                  <span>ANNEXURE A: SCHEDULE OF SERVICES (SAC CODE: 9966)</span>
                  <span>ALL VALUES IN INR (₹)</span>
                </div>
                <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[10px] sm:text-[10.5px] uppercase">
                        <th className="p-2 border-r border-slate-300 w-7 text-center">#</th>
                        <th className="p-2 border-r border-slate-300">Description of Service &amp; Particulars</th>
                        <th className="p-2 border-r border-slate-300 text-center w-14 sm:w-16">SAC</th>
                        <th className="p-2 border-r border-slate-300 text-center w-16 sm:w-20">Duration</th>
                        <th className="p-2 text-right w-20 sm:w-24">Taxable Amt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px] sm:text-xs">
                      {/* Item 1: Vehicle Hire & 100% Fuel */}
                      <tr className="hover:bg-slate-50/60">
                        <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-400">1</td>
                        <td className="p-2 border-r border-slate-200 text-slate-800">
                          <span className="font-semibold block text-slate-900">
                            Dedicated AC Vehicle Hire &amp; 100% Fuel ({activeVehicle?.name || 'Cab'})
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Chennai ⇄ Rameswaram & Dhanushkodi Tour Round-Trip ({fareBreakdown?.isProRata ? `${fareBreakdown.baseDays} Day + ${fareBreakdown.extraHours} hr${fareBreakdown.extraHours > 1 ? 's' : ''}` : `${fareBreakdown?.packageDays} Day${fareBreakdown?.packageDays > 1 ? 's' : ''}`})
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-medium text-slate-600">9966</td>
                        <td className="p-2 border-r border-slate-200 text-center text-slate-700">
                          {durationLabel || '1 Day'}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          ₹{fareBreakdown?.vehicleHireFare?.toLocaleString('en-IN')}
                        </td>
                      </tr>

                      {/* Item 2: Chauffeur Duty & Halting Bata */}
                      <tr className="hover:bg-slate-50/60">
                        <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-400">2</td>
                        <td className="p-2 border-r border-slate-200 text-slate-800">
                          <span className="font-semibold block text-slate-900">
                            Chauffeur Outstation Duty Allowance &amp; Halting Batta
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Chauffeur rests in vehicle / pilgrim dormitories (No hotel room required from guest)
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-medium text-slate-600">9966</td>
                        <td className="p-2 border-r border-slate-200 text-center text-slate-700">
                          {durationLabel || '1 Day'}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          ₹{fareBreakdown?.driverBata?.toLocaleString('en-IN')}
                        </td>
                      </tr>

                      {/* Item 3: Late Night Shift Driver Duty Allowance (if applicable) */}
                      {isNightBatta && (
                        <tr className="bg-amber-50/40 hover:bg-amber-50/70">
                          <td className="p-2 border-r border-slate-200 text-center font-bold text-amber-700">3</td>
                          <td className="p-2 border-r border-slate-200 text-amber-950">
                            <span className="font-semibold block">Night Driving Chauffeur Shift Allowance</span>
                            <span className="text-[10px] text-amber-800">
                              Applies for same-day returns completed between 11:00 PM and 4:00 AM
                            </span>
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono font-medium text-amber-800">9966</td>
                          <td className="p-2 border-r border-slate-200 text-center text-amber-800">1 Shift</td>
                          <td className="p-2 text-right font-bold text-amber-950">₹400</td>
                        </tr>
                      )}

                      {/* Item 4: Statutory Levies (Tolls & State Border Tax) */}
                      <tr className="hover:bg-slate-50/60 bg-slate-50/30">
                        <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-400">{isNightBatta ? '4' : '3'}</td>
                        <td className="p-2 border-r border-slate-200 text-slate-800">
                          <span className="font-semibold block text-slate-900">
                            NH 87 FASTag Highway Tolls &amp; Coastal Bridge Route
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Round-trip National Highway toll plazas &amp; complete 1,200 km Rameswaram circuit coverage
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-medium text-slate-600">9966</td>
                        <td className="p-2 border-r border-slate-200 text-center text-slate-700">Round Trip</td>
                        <td className="p-2 text-right font-bold text-emerald-800 text-[11px]">
                          INCLUDED
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Official GST Tax Computation Table (Standard GST Portal format) */}
              {needGst && (
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 pb-1 flex items-center justify-between">
                    <span>ANNEXURE B: GST TAX COMPUTATION BREAKDOWN</span>
                    <span>SECTION 9 / SECTION 5 IGST</span>
                  </div>
                  <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-center border-collapse text-[10px] sm:text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[9.5px] sm:text-[10px] uppercase">
                          <th className="p-1.5 border-r border-slate-300" rowSpan={2}>SAC</th>
                          <th className="p-1.5 border-r border-slate-300" rowSpan={2}>Taxable Amt (₹)</th>
                          <th className="p-1 border-r border-slate-300" colSpan={2}>Central Tax (CGST)</th>
                          <th className="p-1 border-r border-slate-300" colSpan={2}>State Tax (SGST)</th>
                          <th className="p-1 border-r border-slate-300" colSpan={2}>Integrated Tax (IGST)</th>
                          <th className="p-1.5" rowSpan={2}>Total GST (₹)</th>
                        </tr>
                        <tr className="bg-slate-50 text-slate-600 text-[9px] sm:text-[9.5px] border-b border-slate-300 font-semibold">
                          <th className="p-1 border-r border-slate-300">Rate</th>
                          <th className="p-1 border-r border-slate-300">Amt (₹)</th>
                          <th className="p-1 border-r border-slate-300">Rate</th>
                          <th className="p-1 border-r border-slate-300">Amt (₹)</th>
                          <th className="p-1 border-r border-slate-300">Rate</th>
                          <th className="p-1 border-r border-slate-300">Amt (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white">
                          <td className="p-1.5 sm:p-2 border-r border-slate-300 font-mono font-bold text-slate-800">9966</td>
                          <td className="p-1.5 sm:p-2 border-r border-slate-300 font-bold text-slate-900">
                            ₹{taxableAmount?.toLocaleString('en-IN')}
                          </td>
                          <td className="p-1.5 sm:p-2 border-r border-slate-300 text-slate-700">
                            {isIntraState ? '2.5%' : '-'}
                          </td>
                          <td className="p-1.5 sm:p-2 border-r border-slate-300 font-semibold text-slate-900">
                            {isIntraState ? `₹${cgst.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="p-1.5 sm:p-2 border-r border-slate-300 text-slate-700">
                            {isIntraState ? '2.5%' : '-'}
                          </td>
                          <td className="p-1.5 sm:p-2 border-r border-slate-300 font-semibold text-slate-900">
                            {isIntraState ? `₹${sgst.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="p-1.5 sm:p-2 border-r border-slate-300 text-slate-700">
                            {!isIntraState ? '5.0%' : '-'}
                          </td>
                          <td className="p-1.5 sm:p-2 border-r border-slate-300 font-semibold text-slate-900">
                            {!isIntraState ? `₹${igst.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="p-1.5 sm:p-2 font-black text-blue-900">
                            ₹{totalGst.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 6. Grand Invoice Summary & Value in Words */}
              <div className="border border-slate-300 rounded-xl bg-slate-50/80 p-3 sm:p-4 space-y-2 shadow-2xs">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>TOTAL TAXABLE VALUE:</span>
                  <span className="font-bold text-slate-900 text-sm">₹{taxableAmount?.toLocaleString('en-IN')}</span>
                </div>
                {needGst && (
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>
                      TOTAL GST TAX ({isIntraState ? '2.5% CGST + 2.5% SGST' : '5.0% IGST'}):
                    </span>
                    <span className="font-bold text-blue-900 text-sm">+₹{totalGst?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>ADVANCE DEPOSIT REQUIRED:</span>
                  <span className="font-bold text-emerald-800 text-sm">₹0 (ZERO)</span>
                </div>

                <div className="border-t-2 border-slate-300 pt-2.5 mt-1 flex justify-between items-baseline">
                  <div>
                    <span className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-tight block">
                      NET ESTIMATE PAYABLE:
                    </span>
                    <span className="text-[10px] text-slate-500">
                      * Pay driver after successful completion of round-trip
                    </span>
                  </div>
                  <span className="font-black text-xl sm:text-2xl text-emerald-800 font-heading tracking-tight">
                    {formattedFinalFare}
                  </span>
                </div>

                {grandTotalInWords && (
                  <div className="pt-1.5 border-t border-dashed border-slate-200 text-[11px] text-slate-700 font-medium">
                    <span className="font-bold uppercase text-[10px] text-slate-400 block">Total Estimate Value (in words):</span>
                    <span className="italic">{grandTotalInWords}</span>
                  </div>
                )}
              </div>

              {/* 7. Statutory Compliance Declarations & Authorized Seal */}
              <div className="border border-slate-200 rounded-lg p-2.5 bg-white text-[10.5px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 uppercase text-[10px]">
                  Statutory Declarations &amp; Terms:
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <span>Certified that the particulars given above are true and correct in terms of Section 31 of CGST Act.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <span>100% Eligible for Input Tax Credit (ITC) for business travel under Section 16 &amp; 17(5) of the CGST Act.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-slate-700 font-bold shrink-0">•</span>
                  <span>Darshan Ticket: Not Included (Devotees to book tickets directly via official TTD portal).</span>
                </div>
                <div className="pt-1 mt-1 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                  <span>System-Generated Estimate • Kalidass Travels Chennai</span>
                  <span className="font-semibold text-slate-700">Authorized Signatory</span>
                </div>
              </div>

            </div>

            {/* 8. Modal Actions Bar */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap sm:flex-nowrap gap-2 items-center no-print">
              <button 
                type="button"
                onClick={() => setShowPopup(false)} 
                className="py-2.5 px-4 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintLetterhead}
                className="inline-flex items-center gap-1.5 py-2.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Print / Save Official PDF Letterhead"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print / Save PDF</span>
              </button>
              <WhatsAppButton 
                href={whatsAppUrl}
                onClick={handleModalWhatsAppClick}
                variant="filled"
                size="md"
                className="flex-1 py-2 text-xs sm:text-sm font-bold justify-center"
                text="Book on WhatsApp"
              />
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}
