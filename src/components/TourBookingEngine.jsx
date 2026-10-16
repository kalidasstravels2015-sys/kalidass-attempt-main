import React, { useState, useId, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Car, 
  MapPin, 
  Calendar, 
  Users, 
  Phone, 
  Navigation,
  CheckCircle2,
  X,
  Building2,
  FileText,
  Printer,
  Download,
  AlertCircle,
  User,
  ChevronDown,
  ChevronRight,
  Info,
  Clock,
  Receipt
} from 'lucide-react';
import LocationPicker from './LocationPicker';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { trackEvent } from '../lib/analytics';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import { printInvoiceLetterhead, getEstimateRefNo, downloadEstimateDocument } from '../utils/invoiceLetterhead';
import { TOUR_CONFIGS } from '../data/tourBookingConfigs.js';

import WhatsAppIcon from './react/WhatsAppIcon.jsx';

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

const PASSENGER_OPTIONS = [
  { value: '1', label: '1 Passenger' },
  { value: '2', label: '2 Passengers' },
  { value: '3', label: '3 Passengers' },
  { value: '4', label: '4 Passengers (Sedan / SUV)' },
  { value: '5', label: '5 Passengers' },
  { value: '6', label: '6 Passengers (Ertiga / SUV)' },
  { value: '7', label: '7 Passengers (Innova / Crysta)' },
  { value: '8', label: '8 Passengers' },
  { value: '9', label: '9 Passengers' },
  { value: '10', label: '10 Passengers' },
  { value: '11', label: '11 Passengers' },
  { value: '12', label: '12 Passengers (Tempo)' },
  { value: '13', label: '13+ Passengers (Tempo 17)' }
];

export default function TourBookingEngine({
  serviceSlug = 'tirupati-package',
  serviceTitle,
  customConfig = null
}) {
  const config = customConfig || TOUR_CONFIGS[serviceSlug] || TOUR_CONFIGS['tirupati-package'];
  const effectiveServiceTitle = serviceTitle || config.serviceTitle;
  const isTirupati = serviceSlug === 'tirupati-package' || config.slug === 'tirupati-package';
  const isPondicherry = serviceSlug === 'pondicherry-one-day-trip' || config.slug === 'pondicherry-one-day-trip';
  const isSabarimala = serviceSlug === 'sabarimala-pilgrimage' || config.slug === 'sabarimala-pilgrimage';

  const pickupId = useId();
  const dropId = useId();
  const pickupDateTimeId = useId();
  const returnDateTimeId = useId();
  const passengersId = useId();
  const vehicleId = useId();

  // State — all fields start empty per user choice (Option A3)
  const [pickup, setPickup] = useState('');
  const [dropDestination, setDropDestination] = useState(config.destination?.editable ? (config.destination.defaultDrop || '') : '');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [pickerField, setPickerField] = useState('pickup');
  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const autocompleteInitializedRef = useRef(false);
  const dropAutocompleteInitializedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handlePinClick = (field = 'pickup') => {
    loadGoogleMaps().catch(() => {});
    setPickerField(field);
    setLocationPickerOpen(true);
    trackEvent('location_map_opened', { field, context: 'tour_engine' });
  };

  const handleLocationConfirm = (address) => {
    const cleanAddr = address ? address.trim() : '';
    if (pickerField === 'pickup') {
      setPickup(cleanAddr);
      if (validationError) setValidationError('');
      if (cleanAddr) {
        setShowResult(true);
      }
    } else {
      setDropDestination(cleanAddr);
      if (validationError) setValidationError('');
      if (cleanAddr && pickup.trim()) {
        setShowResult(true);
      }
    }
    setLocationPickerOpen(false);
    trackEvent('location_pin_used', { field: pickerField, method: 'map_picker', success: true });
  };

  // Initialize Google Places Autocomplete on pickup and drop inputs
  useEffect(() => {
    let checkTimer = null;

    const initAutocomplete = () => {
      if (!window.google?.maps?.places) return;

      // Pickup Autocomplete
      if (!autocompleteInitializedRef.current && pickupInputRef.current) {
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
            if (!isMountedRef.current) return;
            const place = autocomplete.getPlace();
            const addr = place?.formatted_address || place?.name;
            if (addr) {
              setPickup(addr);
              setValidationError('');
              setShowResult(true);
            }
          });

          autocompleteInitializedRef.current = true;
        } catch (err) {
          console.error('Google Autocomplete initialization error (pickup):', err);
        }
      }

      // Drop Destination Autocomplete (for editable tours like Pondicherry)
      if (config.destination?.editable && !dropAutocompleteInitializedRef.current && dropInputRef.current) {
        try {
          const dropOptions = {
            componentRestrictions: { country: 'in' },
            fields: ['formatted_address', 'name', 'geometry'],
          };
          const dropAutocomplete = new window.google.maps.places.Autocomplete(dropInputRef.current, dropOptions);
          dropAutocomplete.addListener('place_changed', () => {
            if (!isMountedRef.current) return;
            const place = dropAutocomplete.getPlace();
            const addr = place?.formatted_address || place?.name;
            if (addr) {
              setDropDestination(addr);
              setValidationError('');
              if (pickup.trim()) {
                setShowResult(true);
              }
            }
          });
          dropAutocompleteInitializedRef.current = true;
        } catch (err) {
          console.error('Google Autocomplete initialization error (drop):', err);
        }
      }
    };

    loadGoogleMaps()
      .then(() => {
        if (isMountedRef.current) initAutocomplete();
      })
      .catch(() => {});

    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      window.addEventListener('google-maps-loaded', initAutocomplete);
      checkTimer = setInterval(() => {
        if (window.google?.maps?.places) {
          initAutocomplete();
          const fullyReady = autocompleteInitializedRef.current && (!config.destination?.editable || dropAutocompleteInitializedRef.current);
          if (fullyReady && checkTimer) clearInterval(checkTimer);
        }
      }, 500);
    }

    return () => {
      window.removeEventListener('google-maps-loaded', initAutocomplete);
      if (checkTimer) clearInterval(checkTimer);
    };
  }, []);

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
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (window.google?.maps?.Geocoder) {
          try {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
              setGettingLocation(false);
              if (status === 'OK' && results?.[0]) {
                setPickup(results[0].formatted_address);
                if (validationError) setValidationError('');
              } else {
                fallbackNominatim(latitude, longitude);
              }
            });
            return;
          } catch (_) {}
        }
        fallbackNominatim(latitude, longitude);
      },
      () => {
        setGettingLocation(false);
        alert('Unable to retrieve your location. Please enter pickup area manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const getMinDateTime = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getMinReturnDateTime = (pickupVal, minHours) => {
    if (!pickupVal) return getMinDateTime();
    const d = new Date(pickupVal);
    if (isNaN(d.getTime())) return getMinDateTime();
    d.setHours(d.getHours() + (minHours || config.minRealisticHours));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Default departure & return generators for instant live quote (Next Day Morning 06:00 AM)
  const getDefaultPickupTime = () => {
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

  const getDefaultReturnTime = () => {
    const dep = getDefaultPickupTime();
    return getMinReturnDateTime(dep, config.minRealisticHours);
  };

  // Date and Time calculation invariants - always autoselect pickup date next day morning
  const [pickupDateTime, setPickupDateTime] = useState(() => getDefaultPickupTime());
  const [returnDateTime, setReturnDateTime] = useState(() => {
    const dep = getDefaultPickupTime();
    return getMinReturnDateTime(dep, config.minRealisticHours);
  });

  const calculateDuration = (pickupVal, returnVal) => {
    if (!pickupVal || !returnVal) {
      return { 
        days: 1, 
        hours: 0, 
        label: '', 
        isSameDate: true, 
        hasDates: false, 
        isProRata: false, 
        isCapped: false, 
        extraHours: 0, 
        baseDays: 1, 
        cappedDays: 2, 
        isTooShort: false 
      };
    }

    const start = new Date(pickupVal);
    const end = new Date(returnVal);
    const diffMs = end - start;
    if (diffMs <= 0) {
      return { 
        days: 1, 
        hours: 0, 
        label: '1 Day Package', 
        isSameDate: true, 
        hasDates: true, 
        isProRata: false, 
        isCapped: false, 
        extraHours: 0, 
        baseDays: 1, 
        cappedDays: 2, 
        isTooShort: false 
      };
    }

    const hours = Math.round(diffMs / (1000 * 60 * 60));
    const isTooShort = hours < config.minRealisticHours;
    const isSameDate = (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate()
    );

    // Rule: Up to 24 hours = 1 Day
    if (hours <= 24) {
      return {
        days: 1,
        hours,
        label: isSameDate ? '1 Day Package' : '1 Day (24 hrs)',
        subText: isSameDate ? 'Same Day' : '1 Night Stay',
        isSameDate,
        hasDates: true,
        isProRata: false,
        isCapped: false,
        extraHours: 0,
        baseDays: 1,
        cappedDays: 1,
        isTooShort
      };
    }

    // Tier 2: 25 to 47 hours (1 Day + 1 hr to 1 Day + 23 hrs)
    if (hours < 48) {
      const extraHours = Math.min(23, Math.max(1, Math.round(hours - 24)));
      return {
        days: 1,
        hours,
        label: `1 Day + ${extraHours} hr${extraHours > 1 ? 's' : ''}`,
        subText: '1 Night Stay',
        isSameDate: false,
        hasDates: true,
        isProRata: true,
        isCapped: false,
        extraHours,
        baseDays: 1,
        cappedDays: 2,
        isTooShort
      };
    }

    // Exactly 48 hours = 2 Days Package
    if (hours === 48) {
      return {
        days: 2,
        hours,
        label: '2 Days Package',
        subText: '1 Night Stay',
        isSameDate: false,
        hasDates: true,
        isProRata: false,
        isCapped: false,
        extraHours: 0,
        baseDays: 2,
        cappedDays: 2,
        isTooShort
      };
    }

    // Tier 3: 49 to 71 hours (2 Days + 1 hr to 2 Days + 23 hrs)
    if (hours < 72) {
      const extraHours = Math.min(23, Math.max(1, Math.round(hours - 48)));
      return {
        days: 2,
        hours,
        label: `2 Days + ${extraHours} hr${extraHours > 1 ? 's' : ''}`,
        subText: '2 Nights Stay',
        isSameDate: false,
        hasDates: true,
        isProRata: true,
        isCapped: false,
        extraHours,
        baseDays: 2,
        cappedDays: 3,
        isTooShort
      };
    }

    // Tier 3 Exact: 72 hours = 3 Days Package
    if (hours === 72) {
      return {
        days: 3,
        hours,
        label: '3 Days Package',
        subText: '2 Nights Stay',
        isSameDate: false,
        hasDates: true,
        isProRata: false,
        isCapped: false,
        extraHours: 0,
        baseDays: 3,
        cappedDays: 3,
        isTooShort
      };
    }

    // Tier 4: > 72 hours (Multi-Day Package)
    const fullDays = Math.ceil(hours / 24);
    return {
      days: fullDays,
      hours,
      label: `${fullDays} Days Package`,
      subText: `${fullDays - 1} Nights Stay`,
      isSameDate: false,
      hasDates: true,
      isProRata: false,
      isCapped: false,
      extraHours: 0,
      baseDays: fullDays,
      cappedDays: fullDays,
      isTooShort
    };
  };

  const durationInfo = calculateDuration(pickupDateTime, returnDateTime);
  const { days, hours: durationHours, label: durationLabel, subText: durationSubText } = durationInfo;

  // Driver Night Allowance (₹400) for same-day returns between 11 PM and 4 AM (with 1-hr grace up to 11 PM)
  const returnHour = returnDateTime ? new Date(returnDateTime).getHours() : null;
  const isNightBatta = days === 1 && durationInfo.isSameDate && returnHour !== null && (returnHour >= 23 || returnHour < 4);

  const formatTime12 = (dtStr) => {
    if (!dtStr) return '';
    try {
      const dt = new Date(dtStr);
      if (isNaN(dt.getTime())) return '';
      return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const isAM = (dtStr) => {
    if (!dtStr) return true;
    try {
      const dt = new Date(dtStr);
      if (isNaN(dt.getTime())) return true;
      return dt.getHours() < 12;
    } catch {
      return true;
    }
  };

  const setDateTimePeriod = (currentDtStr, targetPeriod) => {
    if (!currentDtStr || !currentDtStr.includes('T')) return currentDtStr;
    try {
      const [datePart, timePart] = currentDtStr.split('T');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (isNaN(hours)) return currentDtStr;
      if (isNaN(minutes)) minutes = 0;
      const isCurrentlyPm = hours >= 12;
      if (targetPeriod === 'PM' && !isCurrentlyPm) {
        hours = (hours + 12) % 24;
      } else if (targetPeriod === 'AM' && isCurrentlyPm) {
        hours = (hours - 12 + 24) % 24;
      }
      return `${datePart}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch {
      return currentDtStr;
    }
  };

  const formatDT = (dt) => {
    if (!dt) return '';
    try {
      const dateObj = new Date(dt);
      if (isNaN(dateObj.getTime())) return '';
      const dateStr = dateObj.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      const time12 = dateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      const time24 = dateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: false
      });
      return `${dateStr}, ${time12} (${time24} hrs)`;
    } catch {
      return '';
    }
  };

  const handlePickupDateTimeChange = (e) => {
    const val = e.target.value;
    setPickupDateTime(val);
    if (validationError) setValidationError('');
    if (val) {
      // Auto-select the first eligible return date and time based on realistic minimum duration
      const minReturnStr = getMinReturnDateTime(val, config.minRealisticHours);
      setReturnDateTime(minReturnStr);
    } else {
      setReturnDateTime('');
    }
  };

  // Passenger & Vehicle Selection — do not show price until pickup location is entered
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef(null);
  const [passengers, setPassengers] = useState('4');
  const [vehicleIdState, setVehicleIdState] = useState(config.vehicles?.[0]?.id || 'dzire');
  const [showPopup, setShowPopup] = useState(false);
  const [downloadToast, setDownloadToast] = useState(false);

  // Corporate GST Billing mode
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

  // External vehicle selection event listener
  useEffect(() => {
    const handleExternalVehicleSelect = (e) => {
      const { vehicleId: vId, passengers: pax } = e.detail || {};
      if (vId) {
        if (pax) setPassengers(String(pax));
        setVehicleIdState(vId);
        if (pickup.trim()) {
          setShowResult(true);
          if (resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        if (validationError) setValidationError('');
      }
    };

    window.addEventListener(`select-${serviceSlug}-vehicle`, handleExternalVehicleSelect);
    if (isTirupati) window.addEventListener('select-tirupati-vehicle', handleExternalVehicleSelect);
    window.addEventListener('select-tour-vehicle', handleExternalVehicleSelect);

    return () => {
      window.removeEventListener(`select-${serviceSlug}-vehicle`, handleExternalVehicleSelect);
      if (isTirupati) window.removeEventListener('select-tirupati-vehicle', handleExternalVehicleSelect);
      window.removeEventListener('select-tour-vehicle', handleExternalVehicleSelect);
    };
  }, [validationError, serviceSlug, isTirupati, pickup]);

  // Deep-linking URL search parameters handler (e.g. ?days=5&vehicle=ertiga&pickup=Chennai)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlDays = parseInt(searchParams.get('days') || '', 10);
      const urlVehicle = searchParams.get('vehicle');
      const urlPickup = searchParams.get('pickup');
      const urlDrop = searchParams.get('drop');
      const urlPax = searchParams.get('passengers') || searchParams.get('pax');
      const hasEngineParams = searchParams.has('days') || searchParams.has('vehicle') || searchParams.get('calc') === '1';

      if (urlDays && urlDays > 0) {
        const dep = getDefaultPickupTime();
        setPickupDateTime(dep);
        if (urlDays === 1) {
          setReturnDateTime(getMinReturnDateTime(dep, config.minRealisticHours));
        } else {
          const d = new Date(dep);
          d.setHours(d.getHours() + (urlDays * 24));
          const yr = d.getFullYear();
          const mo = String(d.getMonth() + 1).padStart(2, '0');
          const dy = String(d.getDate()).padStart(2, '0');
          const hr = String(d.getHours()).padStart(2, '0');
          const mn = String(d.getMinutes()).padStart(2, '0');
          setReturnDateTime(`${yr}-${mo}-${dy}T${hr}:${mn}`);
        }
      }

      if (urlVehicle) {
        const vLower = urlVehicle.toLowerCase();
        const matched = config.vehicles?.find(v => 
          v.id.toLowerCase() === vLower || 
          v.name.toLowerCase().includes(vLower) || 
          v.shortName.toLowerCase().includes(vLower)
        );
        if (matched) {
          setVehicleIdState(matched.id);
          if (matched.capacity) setPassengers(String(matched.capacity));
        }
      }

      if (urlPax) {
        setPassengers(String(urlPax));
      }

      if (urlPickup) {
        setPickup(urlPickup);
      } else if (hasEngineParams && !pickup.trim()) {
        setPickup('Chennai (Doorstep Pickup)');
      }

      if (urlDrop && config.destination?.editable) {
        setDropDestination(urlDrop);
      }

      if (hasEngineParams) {
        setShowResult(true);
        setTimeout(() => {
          if (resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 250);
      }
    } catch (e) {
      console.warn('Error reading URL search params:', e);
    }
  }, []);

  const availableVehicles = passengers 
    ? config.vehicles.filter(v => v.capacity >= parseInt(passengers, 10)) 
    : config.vehicles;
  const activeVehicle = availableVehicles.find(v => v.id === vehicleIdState) || availableVehicles[0] || null;

  const handlePassengerChange = (newPaxCount) => {
    setPassengers(newPaxCount);
    if (validationError) setValidationError('');
    if (!newPaxCount) {
      return;
    }
    const paxNum = parseInt(newPaxCount, 10);
    const curVehicleObj = config.vehicles.find(v => v.id === vehicleIdState);
    if (!curVehicleObj || curVehicleObj.capacity < paxNum) {
      const eligible = config.vehicles.find(v => v.capacity >= paxNum);
      if (eligible) {
        setVehicleIdState(eligible.id);
      }
    }
  };

  // Statutory Fair Outstation Fare Calculation
  const calculateVehicleFare = (veh, durInfo) => {
    if (!veh || !durInfo || !durInfo.hasDates) return null;

    const { days: numDays, isProRata, extraHours, baseDays, cappedDays, hours } = durInfo;
    const isAfter24Hours = (hours > 24) || (numDays > 1) || isProRata;

    // Up to 24 Hours (1 Day Package)
    if (!isAfter24Hours) {
      const packageRate = veh.rates[1] || veh.rates[Object.keys(veh.rates)[0]];
      const vehicleHireFare = veh.vehicleHire[1] || Math.round(packageRate * 0.82);
      const driverBata = veh.driverBata[1] || (packageRate - vehicleHireFare);

      return {
        totalFare: packageRate,
        packageType: 'standard_1day',
        vehicleHireFare,
        driverBata,
        baseFare: packageRate,
        packageDays: 1,
        extraHoursFare: 0,
        extraHours: 0,
        isProRata: false,
        isCapped: false,
        maxCapFare: packageRate,
        savings: 0,
        pricingModel: '1-Day Approved All-Inclusive Package',
        isAfter24Hours: false
      };
    }

    // After 24 Hours (Multi-Day / Pro-Rata)
    if (isProRata) {
      const basePackageRate = veh.rates[baseDays] || veh.rates[1];
      const capPackageRate = veh.rates[cappedDays] || veh.rates[2] || (basePackageRate * 1.5);
      const packageDelta = capPackageRate - basePackageRate;
      const unitHourlyRate = Math.round(packageDelta / 24);

      const rawExtra = (extraHours * packageDelta) / 24;
      const hourlyExtraFare = Math.round(rawExtra / 50) * 50;
      const totalFare = basePackageRate + hourlyExtraFare;

      const baseVehicleHire = veh.vehicleHire[baseDays] || Math.round(basePackageRate * 0.82);
      const capVehicleHire = veh.vehicleHire[cappedDays] || Math.round(capPackageRate * 0.82);
      const vehDelta = capVehicleHire - baseVehicleHire;
      const rawVehExtra = (extraHours * vehDelta) / 24;
      const vehExtra = Math.round(rawVehExtra / 50) * 50;
      const vehicleHireFare = baseVehicleHire + vehExtra;
      const driverBata = totalFare - vehicleHireFare;
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
        pricingModel: `${baseDays} Day + ${extraHours} hr Multi-Day Tariff`,
        isAfter24Hours: true
      };
    }

    // Standard Multi-Day (2 or 3 Days)
    if (numDays <= 3) {
      const totalFare = veh.rates[numDays] || (veh.rates[1] * numDays);
      const vehicleHireFare = veh.vehicleHire[numDays] || Math.round(totalFare * 0.8);
      const driverBata = veh.driverBata[numDays] || (totalFare - vehicleHireFare);

      return {
        totalFare,
        packageType: 'multi_day',
        vehicleHireFare,
        driverBata,
        baseFare: totalFare,
        packageDays: numDays,
        extraHoursFare: 0,
        extraHours: 0,
        isProRata: false,
        isCapped: false,
        maxCapFare: totalFare,
        savings: 0,
        pricingModel: `${numDays}-Day Multi-Day Tariff`,
        isAfter24Hours: true
      };
    }

    // 4+ Days Package
    const extraDays = numDays - 3;
    const day2 = veh.rates[2] || veh.rates[1];
    const day1 = veh.rates[1];
    const extraPerDay = day2 - day1;
    const base3 = veh.rates[3] || (day1 * 3);
    const totalFare = base3 + (extraDays * extraPerDay);
    const vehicleHireFare = Math.round(totalFare * 0.8);
    const driverBata = totalFare - vehicleHireFare;

    return {
      totalFare,
      packageType: 'multi_day',
      vehicleHireFare,
      driverBata,
      baseFare: totalFare,
      packageDays: numDays,
      extraHoursFare: 0,
      extraHours: 0,
      isProRata: false,
      isCapped: false,
      maxCapFare: totalFare,
      savings: 0,
      pricingModel: `${numDays}-Day Multi-Day Tariff`,
      isAfter24Hours: true
    };
  };

  const fareBreakdown = activeVehicle && durationInfo.hasDates 
    ? calculateVehicleFare(activeVehicle, durationInfo) 
    : null;
  const currentFare = fareBreakdown ? fareBreakdown.totalFare : 0;
  const isAfter24Hours = fareBreakdown ? fareBreakdown.isAfter24Hours : false;

  // GST & ITC Calculations (Section 7, 8, 9 of IGST Act 2017)
  const cleanedGst = customerGst.trim().toUpperCase();
  const rawStateCode = cleanedGst.length >= 2 ? cleanedGst.substring(0, 2) : '';
  const isIntraState = !cleanedGst || rawStateCode === '33';
  const recipientStateName = GST_STATE_MAP[rawStateCode] || (cleanedGst ? 'Unknown State' : 'Tamil Nadu (Default)');
  const placeOfSupply = `${rawStateCode || '33'} - ${recipientStateName}`;

  const taxableAmount = currentFare;
  const gstRate = 0.05;
  const totalGst = needGst ? Math.round(taxableAmount * gstRate) : 0;
  const cgst = needGst && isIntraState ? Math.round(totalGst / 2) : 0;
  const sgst = needGst && isIntraState ? Math.round(totalGst / 2) : 0;
  const igst = needGst && !isIntraState ? totalGst : 0;

  const finalNetPayable = taxableAmount + totalGst;
  const advanceDeposit = 500;
  const balancePayable = Math.max(0, finalNetPayable - advanceDeposit);
  const formattedFare = currentFare ? `₹${currentFare.toLocaleString('en-IN')}` : null;
  const formattedBalancePayable = currentFare ? `₹${balancePayable.toLocaleString('en-IN')}` : null;
  const activePayableFare = needGst ? (finalNetPayable ? `₹${finalNetPayable.toLocaleString('en-IN')}` : null) : formattedFare;
  const grandTotalInWords = numberToWordsINR(finalNetPayable);

  const [invoiceRefNo, setInvoiceRefNo] = useState('');
  useEffect(() => {
    setInvoiceRefNo(getEstimateRefNo(pickupDateTime));
  }, [pickupDateTime]);

  const effectiveInvoiceRefNo = invoiceRefNo || getEstimateRefNo(pickupDateTime);

  const destinationDisplay = config.destination?.editable 
    ? (dropDestination.trim() || config.destination.defaultDrop || 'Pondicherry French Town')
    : (config.destination?.name || 'Selected Destination');

  // Broadcast current calculation for AI Fare Concierge contextual awareness
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__KT_CURRENT_CALCULATION = {
        engine: 'TourBookingEngine',
        serviceSlug,
        serviceTitle: effectiveServiceTitle,
        destination: destinationDisplay,
        pickup: pickup.trim(),
        pickupDateTime,
        returnDateTime,
        pickupFormatted: formatDT(pickupDateTime),
        returnFormatted: formatDT(returnDateTime),
        durationHours: durationInfo?.hours || 0,
        durationDays: durationInfo?.days || 1,
        durationLabel: durationInfo?.label || '',
        durationSubText: durationInfo?.subText || '',
        isProRata: !!durationInfo?.isProRata,
        extraHours: durationInfo?.extraHours || 0,
        vehicleId: activeVehicle?.id,
        vehicleName: activeVehicle?.name,
        passengers,
        totalFare: currentFare,
        formattedFare,
        pricingModel: fareBreakdown?.pricingModel || '',
        savings: fareBreakdown?.savings || 0,
        maxCapFare: fareBreakdown?.maxCapFare || currentFare,
        allVehicleQuotes: (availableVehicles || []).map(v => {
          const fb = calculateVehicleFare(v, durationInfo);
          return {
            id: v.id,
            name: v.name,
            capacity: v.capacity,
            totalFare: fb ? fb.totalFare : 0
          };
        }),
        timestamp: Date.now()
      };
      window.dispatchEvent(new CustomEvent('kt_calculation_updated', { detail: window.__KT_CURRENT_CALCULATION }));
    }
  }, [
    serviceSlug,
    effectiveServiceTitle,
    destinationDisplay,
    pickup,
    pickupDateTime,
    returnDateTime,
    durationInfo,
    activeVehicle,
    passengers,
    currentFare,
    formattedFare,
    fareBreakdown,
    availableVehicles
  ]);

  const whatsAppMessage = needGst ? `Hi Kalidass Travels, I'd like to book with GST Invoice:
• *Service:* ${effectiveServiceTitle}
• *Pickup:* ${pickup.trim() || 'Chennai'}
• Destination: ${destinationDisplay}
• *Date & Time:* ${formatDT(pickupDateTime)}${returnDateTime ? ` (Return: ${formatDT(returnDateTime)})` : ''}
• *Vehicle:* ${activeVehicle ? activeVehicle.name : 'AC Cab'} (${passengers} Pax)
• *Fare:* ₹${taxableAmount?.toLocaleString('en-IN') || '0'} + 5% GST (₹${totalGst?.toLocaleString('en-IN') || '0'}) = *₹${finalNetPayable?.toLocaleString('en-IN') || '0'} Total*
• *Payment:* ₹500 Adv | ${formattedBalancePayable || 'Remaining'} Bal
${fareBreakdown?.isAfter24Hours ? '• *Payable at Actuals:* FASTag Tolls & Parking paid directly as per actual receipts\n' : ''}• *Ref:* ${effectiveInvoiceRefNo}
${companyName.trim() ? `• *Devotee/Company:* ${companyName.trim()}\n` : ''}${cleanedGst ? `• *GSTIN:* ${cleanedGst} (${recipientStateName})\n` : ''}${customerPhone.trim() ? `• *Contact:* ${customerPhone.trim()}\n` : ''}
Please confirm booking & issue GST proforma estimate!`
: `Hi Kalidass Travels, I'd like to book:
• *Service:* ${effectiveServiceTitle}
• *Pickup:* ${pickup.trim() || 'Chennai'}
• Destination: ${destinationDisplay}
• *Date & Time:* ${formatDT(pickupDateTime)}${returnDateTime ? ` (Return: ${formatDT(returnDateTime)})` : ''}
• *Vehicle:* ${activeVehicle ? activeVehicle.name : 'AC Cab'} (${passengers} Pax)
• *Fare:* ${formattedFare || 'TBD'} (${fareBreakdown?.isAfter24Hours ? 'Multi-Day Tariff' : 'All-inclusive'} | ₹500 Adv / ${formattedBalancePayable || 'Remaining'} Bal)
${fareBreakdown?.isAfter24Hours ? '• *Payable at Actuals:* FASTag Tolls & Parking paid directly as per actual receipts\n' : ''}• *Ref:* ${effectiveInvoiceRefNo}${companyName.trim() ? ` (${companyName.trim()}${customerPhone.trim() ? ` • ${customerPhone.trim()}` : ''})` : (customerPhone.trim() ? ` (${customerPhone.trim()})` : '')}

Please confirm booking!`;

  const whatsAppUrl = buildWhatsAppUrl(whatsAppMessage);

  const handleInputFocus = (e) => {
    setTimeout(() => {
      if (e?.target) {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  const handleViewInstantFare = () => {
    const effectivePickup = pickup.trim();
    if (!effectivePickup) {
      setValidationError('Please enter your pickup location in Chennai.');
      if (pickupInputRef.current) {
        pickupInputRef.current.focus();
      }
      return;
    }
    if (config.destination?.editable && !dropDestination.trim()) {
      setValidationError('Please enter your drop destination.');
      if (dropInputRef.current) {
        dropInputRef.current.focus();
      }
      return;
    }
    if (!pickupDateTime) {
      const dep = getDefaultPickupTime();
      setPickupDateTime(dep);
      setReturnDateTime(getMinReturnDateTime(dep, config.minRealisticHours));
    }
    setValidationError('');
    setShowResult(true);
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  const handleViewCabs = handleViewInstantFare;

  const validateCardInputs = () => {
    if (!pickup.trim()) {
      setValidationError('Please enter your pickup location in Chennai.');
      if (pickupInputRef.current) pickupInputRef.current.focus();
      return false;
    }
    if (config.destination?.editable && !dropDestination.trim()) {
      setValidationError('Please enter your drop destination.');
      if (dropInputRef.current) dropInputRef.current.focus();
      return false;
    }
    if (!pickupDateTime || !returnDateTime) {
      const dep = pickupDateTime || getDefaultPickupTime();
      const ret = returnDateTime || getMinReturnDateTime(dep, config.minRealisticHours);
      setPickupDateTime(dep);
      setReturnDateTime(ret);
    }
    if (!passengers) {
      setValidationError('Please select number of passengers.');
      const el = document.getElementById(passengersId);
      if (el) el.focus();
      return false;
    }
    if (!vehicleIdState) {
      setValidationError('Please select a vehicle model.');
      const el = document.getElementById(vehicleId);
      if (el) el.focus();
      return false;
    }
    setValidationError('');
    return true;
  };

  const validateModalInputs = () => {
    if (!companyName.trim()) {
      setModalValidationError('Please enter Devotee / Company Name before proceeding.');
      setModalHighlightedField('company');
      if (companyNameInputRef.current) companyNameInputRef.current.focus();
      return false;
    }
    if (!customerPhone.trim()) {
      setModalValidationError('Please enter Contact Phone Number before proceeding.');
      setModalHighlightedField('phone');
      if (customerPhoneInputRef.current) customerPhoneInputRef.current.focus();
      return false;
    }
    if (customerGst.trim() && customerGst.trim().length !== 15) {
      setModalValidationError('Recipient GSTIN must be exactly 15 characters, or leave blank.');
      setModalHighlightedField('gstin');
      if (customerGstInputRef.current) customerGstInputRef.current.focus();
      return false;
    }
    setModalValidationError('');
    setModalHighlightedField('');
    return true;
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
      isActualsMode: isAfter24Hours,
      cgst,
      sgst,
      igst,
      totalGst,
      finalNetPayable: finalNetPayable || taxableAmount,
      advanceDeposit,
      balancePayable: balancePayable || (finalNetPayable || taxableAmount) - advanceDeposit,
      grandTotalInWords
    });
  };

  const handleBookWhatsApp = () => {
    if (!pickup.trim() || !pickupDateTime || !returnDateTime || !passengers || !vehicleIdState || !currentFare || currentFare <= 0) {
      return;
    }

    const bookingPayload = {
      service: effectiveServiceTitle,
      vehicle: activeVehicle ? activeVehicle.name : 'none',
      passengers,
      days,
      fare: currentFare,
      pickup: pickup.trim() || 'Chennai',
      quote_id: invoiceRefNo,
      is_qualified_estimate: true
    };

    trackEvent(`${config.eventPrefix}_booked`, bookingPayload);

    if (typeof window !== 'undefined' && typeof window.reportGoogleAdsConversion === 'function') {
      window.reportGoogleAdsConversion('qualified_booking', {
        value: currentFare,
        fare: currentFare,
        currency: 'INR',
        transaction_id: invoiceRefNo,
        quoteId: invoiceRefNo,
        event_label: `${config.destination?.name || 'Tour'} ${activeVehicle?.name || 'Cab'} - ₹${currentFare}`,
        service: effectiveServiceTitle,
        vehicle: activeVehicle?.name,
        is_qualified_estimate: true
      });
    }

    try {
      const leadPayload = {
        leadType: 'whatsapp',
        status: 'WhatsApp Estimate Booked',
        calculatorEngine: `${config.destination?.name || 'Tour'} Engine`,
        tripType: `${days || 1} Day Package`,
        sourcePage: window.location.pathname || `/services/${serviceSlug}/`,
        pickup: pickup.trim(),
        drop: destinationDisplay,
        vehicle: activeVehicle?.name || 'Cab',
        estimatedFare: currentFare,
        distanceKm: `${config.destination?.roundTripKm || 320} km return`,
        quoteId: invoiceRefNo,
        metadata: `Pax: ${passengers} | Fare: ₹${currentFare}`
      };
      if (navigator.sendBeacon) {
        navigator.sendBeacon(window.location.origin + '/api/record-calculation', new Blob([JSON.stringify(leadPayload)], { type: 'application/json' }));
      } else {
        fetch('/api/record-calculation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leadPayload), keepalive: true }).catch(() => {});
      }
    } catch (_) {}

    setShowPopup(false);
  };

  const handleDirectWhatsAppClick = (e) => {
    if (!validateCardInputs()) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }

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
          isActualsMode: isAfter24Hours,
          cgst,
          sgst,
          igst,
          totalGst,
          finalNetPayable: finalNetPayable || taxableAmount,
          advanceDeposit,
          balancePayable: balancePayable || (finalNetPayable || taxableAmount) - advanceDeposit,
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
    trackEvent(`${config.eventPrefix}_call_clicked`, {
      vehicle: activeVehicle ? activeVehicle.name : 'none',
      passengers,
      days
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showPopup) setShowPopup(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPopup]);

  return (
    <>
      <section 
        aria-label={`${config.destination?.name || 'Tour'} Pilgrimage Booking Engine`}
        className="w-full max-w-2xl mx-auto bg-white rounded-m3-2xl shadow-m3-1 sm:shadow-m3-2 border border-m3-outline-variant overflow-hidden font-sans booking-engine"
      >
        {/* Title Header — Material 3 Standard Elevation */}
        <div className="py-3 px-4 sm:px-5 border-b border-m3-outline-variant/60 flex flex-col items-center justify-center text-center bg-m3-surface">
          <div className="w-full text-center">
            <h2 className="text-lg sm:text-xl font-bold text-m3-on-surface font-heading leading-tight text-center">
              {config.engineTitle}
            </h2>
            <p className="text-xs text-m3-on-surface-variant mt-1 font-medium text-center">
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Form Body — Material 3 Standard Spacing */}
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-3.5">
          
          {/* 1. Pickup Input Field (M3 Outlined Text Field) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={pickupId} className="text-xs sm:text-sm font-bold text-m3-on-surface flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
                <span>Pickup Location in Chennai</span>
              </label>
              <span className="text-[11px] text-m3-on-surface-variant font-medium">Doorstep Pickup Included</span>
            </div>
            <div className="relative flex items-center">
              <input
                id={pickupId}
                ref={pickupInputRef}
                type="text"
                autoComplete="street-address"
                autoCorrect="off"
                inputMode="text"
                enterKeyHint="next"
                value={pickup}
                onChange={(e) => {
                  const val = e.target.value;
                  setPickup(val);
                  if (validationError) setValidationError('');
                  if (!val.trim()) {
                    setShowResult(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const pac = typeof document !== 'undefined' ? document.querySelector('.pac-container') : null;
                    const isPacVisible = pac && window.getComputedStyle(pac).display !== 'none';
                    if (!isPacVisible) {
                      e.preventDefault();
                      handleViewCabs();
                    }
                  }
                }}
                onFocus={(e) => {
                  loadGoogleMaps().catch(() => {});
                  handleInputFocus(e);
                }}
                placeholder="e.g. T. Nagar, Central Station, Airport, Velachery"
                className={`w-full min-h-[48px] bg-white border border-m3-outline-variant hover:border-m3-outline focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 rounded-m3-lg px-3.5 py-3 text-sm sm:text-sm ${pickup ? 'text-m3-on-surface font-semibold' : 'text-m3-on-surface font-normal'} placeholder:text-sm placeholder:text-m3-on-surface-variant/75 placeholder:font-normal outline-none transition-all pr-20 shadow-2xs scroll-mt-28 scroll-mb-64`}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {pickup && (
                  <button
                    type="button"
                    onClick={() => {
                      setPickup('');
                      setShowResult(false);
                      if (validationError) setValidationError('');
                      pickupInputRef.current?.focus();
                    }}
                    aria-label="Clear pickup location"
                    title="Clear pickup location"
                    className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full hover:bg-m3-surface-container active:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handlePinClick('pickup')}
                  aria-label="Pinpoint pickup on map"
                  title="Pinpoint pickup on map"
                  className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-m3-md hover:bg-m3-surface-container active:scale-95 active:bg-m3-surface-container-high text-m3-primary hover:bg-m3-primary/10 transition-all cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-m3-primary" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Destination Notice (Fixed or Editable if configured) */}
          {config.destination?.editable ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={dropId} className="text-xs sm:text-sm font-bold text-m3-on-surface flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
                  <span>Destination / Drop in {config.destination.name.split('&')[0].trim()}</span>
                </label>
                <span className="text-[11px] font-semibold text-m3-on-surface-variant bg-white px-2 py-0.5 rounded border border-m3-outline-variant/50">
                  ~{config.destination.roundTripKm} km {config.destination?.isCircuit ? 'Circuit' : 'Round Trip'}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id={dropId}
                  ref={dropInputRef}
                  type="text"
                  value={dropDestination}
                  onChange={(e) => {
                    setDropDestination(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const pac = typeof document !== 'undefined' ? document.querySelector('.pac-container') : null;
                      const isPacVisible = pac && window.getComputedStyle(pac).display !== 'none';
                      if (!isPacVisible) {
                        e.preventDefault();
                        handleViewCabs();
                      }
                    }
                  }}
                  onFocus={handleInputFocus}
                  placeholder={config.destination.dropPlaceholder || 'Enter drop location or hotel'}
                  className="w-full min-h-[48px] bg-white border border-m3-outline-variant hover:border-m3-outline focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 rounded-m3-lg px-3.5 py-3 text-sm sm:text-sm text-m3-on-surface font-semibold placeholder:text-sm placeholder:text-m3-on-surface-variant/60 placeholder:font-normal outline-none transition-all pr-20 shadow-2xs scroll-mt-28 scroll-mb-64"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {dropDestination && (
                    <button
                      type="button"
                      onClick={() => setDropDestination('')}
                      aria-label="Clear destination"
                      title="Clear destination"
                      className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-m3-surface-container active:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handlePinClick('drop')}
                    aria-label="Pinpoint destination on map"
                    title="Pinpoint destination on map"
                    className="w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-m3-md hover:bg-m3-surface-container active:scale-95 active:bg-m3-surface-container-high text-m3-primary hover:bg-m3-primary/10 transition-all cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-m3-primary" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-[42px] py-2 px-3 rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/60 flex items-center justify-between gap-2 text-xs text-m3-on-surface">
              <div className="flex items-center gap-1.5 min-w-0">
                <Navigation className="w-3.5 h-3.5 text-m3-primary shrink-0" />
                <span className="text-xs truncate">
                  <strong className="text-m3-on-surface font-bold">Fixed Destination:</strong> <span className="font-semibold text-m3-on-surface-variant">{config.destination?.name}</span>
                </span>
              </div>
              <div className="flex items-center shrink-0 ml-auto">
                <span className="text-[11px] font-semibold text-m3-on-surface-variant bg-white px-2 py-0.5 rounded border border-m3-outline-variant/50 whitespace-nowrap">
                  ~{config.destination?.roundTripKm} km {config.destination?.isCircuit ? 'Circuit' : 'Round Trip'}
                </span>
              </div>
            </div>
          )}

          {/* 3. Dual Date Pickers (Twin Interactive Tile Cards) */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Pickup Date Tile */}
              <div className="group relative rounded-xl border border-m3-outline-variant bg-slate-50/70 hover:bg-slate-50 hover:border-m3-outline focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label 
                    htmlFor={pickupDateTimeId} 
                    className="text-[11px] sm:text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 cursor-pointer truncate"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                    <span className="truncate">Pickup Date &amp; Time</span>
                  </label>
                </div>
                <input
                  id={pickupDateTimeId}
                  type="datetime-local"
                  value={pickupDateTime}
                  min={getMinDateTime()}
                  onChange={handlePickupDateTimeChange}
                  onInput={handlePickupDateTimeChange}
                  onFocus={handleInputFocus}
                  className={`w-full bg-transparent text-xs sm:text-sm ${pickupDateTime ? 'text-m3-on-surface font-semibold' : 'text-m3-on-surface-variant/60 font-normal'} outline-none cursor-pointer p-0 scroll-mt-28 scroll-mb-64`}
                />
              </div>

              {/* Return Date Tile */}
              <div className={`group relative rounded-xl border transition-all p-2 sm:p-2.5 shadow-2xs ${
                !pickupDateTime 
                  ? 'bg-m3-surface-container-low border-m3-outline-variant/60 opacity-60 cursor-not-allowed' 
                  : 'bg-slate-50/70 hover:bg-slate-50 border-m3-outline-variant hover:border-m3-outline focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/20 cursor-pointer'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label 
                    htmlFor={returnDateTimeId} 
                    className="text-[11px] sm:text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 cursor-pointer truncate"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                    <span className="truncate">Return Date &amp; Time</span>
                  </label>
                </div>
                <input
                  id={returnDateTimeId}
                  type="datetime-local"
                  value={returnDateTime}
                  disabled={!pickupDateTime}
                  min={pickupDateTime ? getMinReturnDateTime(pickupDateTime, config.minRealisticHours) : getMinDateTime()}
                  onChange={(e) => {
                    setReturnDateTime(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  onFocus={handleInputFocus}
                  className={`w-full bg-transparent text-xs sm:text-sm outline-none cursor-pointer p-0 scroll-mt-28 scroll-mb-64 ${
                    !pickupDateTime
                      ? 'text-m3-on-surface-variant/60 font-normal cursor-not-allowed'
                      : !returnDateTime
                        ? 'text-m3-on-surface-variant/60 font-normal'
                        : 'text-m3-on-surface font-semibold'
                  }`}
                />
              </div>
            </div>

            {/* Smart Helper: When return time is early AM (00:00 to 04:59) on next day */}
            {returnDateTime && isAM(returnDateTime) && returnHour !== null && returnHour >= 0 && returnHour <= 4 && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant/60 text-xs text-m3-on-surface animate-in fade-in">
                <span>
                  Return is set to <strong>{formatTime12(returnDateTime)}</strong> (Early Morning / Night). Did you mean afternoon?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const pmVal = setDateTimePeriod(returnDateTime, 'PM');
                    setReturnDateTime(pmVal);
                  }}
                  className="px-2.5 py-1 bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface rounded text-[11px] font-bold shrink-0 transition-colors cursor-pointer border border-m3-outline-variant/60"
                >
                  Switch to PM
                </button>
              </div>
            )}

            {/* Clean Result Banner directly attached after dates */}
            {durationInfo.hasDates ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-m3-surface-container-low border border-m3-outline-variant/60 rounded-m3-md text-xs sm:text-sm animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-m3-on-surface whitespace-nowrap text-xs sm:text-sm">
                    {durationLabel}
                  </span>
                  <span className="text-xs text-m3-on-surface-variant font-medium whitespace-nowrap">
                    ({durationHours} hrs)
                  </span>
                  {durationSubText && (
                    <span className="text-xs font-semibold text-m3-on-surface bg-white px-2 py-0.5 rounded-full border border-m3-outline-variant/50 shrink-0 whitespace-nowrap">
                      {durationSubText}
                    </span>
                  )}
                </div>
                <span className="text-xs text-m3-on-surface-variant font-medium whitespace-nowrap shrink-0">
                  ~{config.destination?.roundTripKm} km circuit
                </span>
              </div>
            ) : null}

            {/* Realistic Duration Advisory banner if duration is tight */}
            {durationInfo.isTooShort && (
              <p className="text-xs sm:text-sm text-m3-on-surface bg-m3-surface-container-low border border-m3-outline-variant/60 rounded-m3-md px-3 py-2 leading-snug flex items-start gap-1.5 font-medium animate-in fade-in duration-150">
                <Info className="w-4 h-4 text-m3-on-surface-variant shrink-0 mt-0.5" />
                <span>
                  <strong>Realistic Travel Advisory:</strong> {config.advisoryText}
                </span>
              </p>
            )}

            {/* Late night driving allowance alert */}
            {isNightBatta && (
              <p className="text-xs sm:text-sm text-m3-on-surface bg-m3-surface-container-low border border-m3-outline-variant/60 rounded-m3-md px-3 py-2 leading-snug flex items-center gap-1.5 font-medium">
                <Info className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
                <span>Return after 11 PM: Standard ₹400 driver night allowance applies (1-hr traffic grace until 11 PM included)</span>
              </p>
            )}
          </div>

          {/* 4. Passengers & Vehicle Selection Tiles — Outstation Standard Layout */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Passenger Tile */}
            <div className="group relative rounded-xl border border-m3-outline-variant bg-slate-50/70 hover:bg-slate-50 hover:border-m3-outline focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
              <div className="flex items-center justify-between gap-1 mb-1">
                <label 
                  htmlFor={passengersId} 
                  className="text-[11px] sm:text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 cursor-pointer truncate"
                >
                  <Users className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                  <span className="truncate">Passengers</span>
                </label>
              </div>
              <div className="relative">
                <select
                  id={passengersId}
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
                  htmlFor={vehicleId} 
                  className="text-[11px] sm:text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 cursor-pointer truncate"
                >
                  <Car className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                  <span className="truncate">Vehicle Model</span>
                </label>
              </div>
              <div className="relative">
                <select
                  id={vehicleId}
                  value={vehicleIdState}
                  onChange={(e) => {
                    setVehicleIdState(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="w-full bg-transparent appearance-none outline-none cursor-pointer pr-5 text-xs sm:text-sm font-semibold text-m3-on-surface truncate p-0"
                >
                  {config.vehicles.map(veh => {
                    const pax = parseInt(passengers, 10);
                    const disabled = veh.capacity < pax;
                    return (
                      <option key={veh.id} value={veh.id} disabled={disabled} className="text-m3-on-surface font-semibold">
                        {veh.name} ({veh.capacity} Pax)
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 shrink-0" />
              </div>
            </div>
          </div>

          {/* Validation Feedback Text */}
          {validationError && (
            <p 
              role="alert"
              className="text-xs sm:text-sm text-m3-error font-medium text-center flex items-center justify-center gap-1.5 animate-in fade-in duration-150 py-1"
            >
              <Info className="w-4 h-4 text-m3-error shrink-0" />
              <span>{validationError}</span>
            </p>
          )}

          {/* PRIMARY CTA BUTTON (Compact & Centered Google Blue Button — Outstation Standard) */}
          <div className="pt-2.5 space-y-1.5 flex flex-col items-center justify-center">
            <button
              id="btn-calculate-fare"
              type="button"
              onClick={handleViewInstantFare}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[40px] bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <span>View Instant Fare</span>
            </button>
            <p className="text-[11px] text-m3-on-surface-variant/80 text-center font-medium max-w-sm">
              ✓ No phone number required to check fare
            </p>
          </div>

          {/* Dynamic Fare Result & Actions Area — Rate Summary with Complete Itemized Breakdown */}
          {showResult && Boolean(pickup.trim()) && (
            <div ref={resultRef} className="pt-3 border-t border-m3-outline-variant/60 space-y-3 animate-in fade-in duration-200">
              {/* Rate Summary Card — Restaurant Bill Style */}
              <div className="bg-white border border-m3-outline-variant/80 rounded-xl p-3.5 space-y-3 shadow-2xs">
                {/* Header: Vehicle Name, Pax & Total Fare */}
                <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-m3-outline-variant/60">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base font-extrabold text-m3-on-surface">
                        {activeVehicle?.name || 'AC Cab'}
                      </span>
                      <span className="text-[10px] font-bold bg-[#1a73e8]/10 text-[#1a73e8] px-2 py-0.5 rounded-full">
                        {activeVehicle?.capacity || passengers} Pax
                      </span>
                    </div>
                    <div className="text-[11px] text-m3-on-surface-variant font-medium mt-0.5">
                      ~{config.destination?.roundTripKm || 320} km Round Trip · {durationInfo?.label || (isAfter24Hours ? `${days || 1} Days Package` : '1 Day Package (12 hrs)')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-m3-on-surface-variant font-medium">Total Fare</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-m3-on-surface font-heading leading-tight">
                      {activePayableFare}
                    </div>
                  </div>
                </div>

                {/* Itemized Bill Lines */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Cab Hire ({activeVehicle?.name} • Fuel included):</span>
                    <span className="font-bold text-m3-on-surface">₹{Number(fareBreakdown?.vehicleHireFare || taxableAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Driver Allowance ({fareBreakdown?.packageDays || (days || 1)} {(fareBreakdown?.packageDays || (days || 1)) > 1 ? 'Days' : 'Day'}):</span>
                    <span className="font-bold text-m3-on-surface">₹{Number(fareBreakdown?.driverBata || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {isNightBatta && (
                    <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                      <span>Night Driver Allowance (11 PM - 4 AM):</span>
                      <span className="font-bold text-m3-on-surface">₹400</span>
                    </div>
                  )}

                  {/* GST line if needGst */}
                  {needGst && (
                    <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                      <span>GST (5%):</span>
                      <span className="font-bold text-m3-on-surface">+₹{Number(totalGst).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {isAfter24Hours && (
                    <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                      <span>Tolls, Parking &amp; Permits:</span>
                      <span className="font-bold text-m3-on-surface">Extra (At Actuals)</span>
                    </div>
                  )}
                </div>

                {/* Bill Payment Split */}
                <div className="pt-2 border-t-2 border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between items-center py-1 sm:py-1.5 border-b border-slate-200/80 mb-1">
                    <span className="text-base sm:text-lg font-black text-m3-on-surface tracking-tight">Total Bill:</span>
                    <span className="text-xl sm:text-2xl font-black text-m3-primary tracking-tight font-heading">
                      {activePayableFare}{isAfter24Hours ? ' + Extra' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface-variant">
                    <span>Advance to Pay:</span>
                    <span className="font-bold text-emerald-700">₹500</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-m3-on-surface">
                    <span className="font-medium">Balance to Pay Driver:</span>
                    <span className="font-bold text-m3-on-surface">{formattedBalancePayable}{isAfter24Hours ? ' + Extra' : ''} <span className="text-[11px] font-normal text-m3-on-surface-variant">(After trip)</span></span>
                  </div>
                </div>

                {/* Cut and Dried Notes */}
                {isAfter24Hours ? (
                  <div className="pt-2.5 border-t border-dashed border-m3-outline-variant/80 text-[11px] text-m3-on-surface-variant space-y-1.5">
                    {/* Inclusions Line */}
                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Included in Fare:</strong> Dedicated Cab Hire, Fuel &amp; Driver Allowance{isTirupati ? ', Tirumala Hill Climb' : ''}.
                      </span>
                    </div>

                    {/* Package Duration & Limits */}
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Trip Duration: {durationLabel || `${days || 1} Days`} (~{config.destination?.roundTripKm || 320} km circuit). Extra hours: ₹{activeVehicle?.extraHourRate || 200}/hr.</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-dashed border-m3-outline-variant/80 text-[11px] text-m3-on-surface-variant space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Included in Fare:</strong> {isTirupati 
                          ? 'Fuel, Tolls, AP State Permit, Hill Climb & Parking. No hidden charges.' 
                          : `${config.inclusions?.standard || 'Fuel, Tolls, Permit & Driver Allowance'}. No hidden charges.`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Trip Limit: Up to ~{config.destination?.roundTripKm || 320} km / {durationHours || 12} hrs (Extra: ₹{activeVehicle?.extraHourRate || 200}/hr).</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Passenger / Devotee Name (Compact & Non-blocking) */}
              {!needGst && (
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-bold text-m3-on-surface flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-m3-on-surface-variant shrink-0" />
                      <span>Passenger / Devotee Name</span>
                    </span>
                    <span className="text-xs text-m3-on-surface-variant font-normal">Optional</span>
                  </label>
                  <input
                    ref={companyNameInputRef}
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    onFocus={handleInputFocus}
                    enterKeyHint="done"
                    placeholder="e.g. Saravanan K (or confirm on WhatsApp)"
                    className={`w-full min-h-[44px] h-11 bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-lg px-3.5 py-2 text-sm ${companyName ? 'text-m3-on-surface font-semibold' : 'text-m3-on-surface font-normal'} placeholder:text-sm placeholder:text-m3-on-surface-variant/60 placeholder:font-normal focus:outline-none focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20 shadow-2xs scroll-mt-28 scroll-mb-64`}
                  />
                </div>
              )}

              {/* Primary M3 Action Buttons (Full-Width WhatsApp + Secondary Call) */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
                <WhatsAppButton 
                  href={whatsAppUrl}
                  onClick={handleDirectWhatsAppClick}
                  variant="filled"
                  size="md"
                  data-direct-whatsapp="true"
                  className="flex-1 px-5 py-3.5 min-h-[48px] text-sm font-bold shadow-m3-1 justify-center active:scale-[0.99]"
                  text={`Book on WhatsApp (${activePayableFare})`}
                />

                <a
                  href="tel:+918939539211"
                  onClick={handleCall}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] bg-white hover:bg-m3-surface-container active:scale-[0.99] text-m3-on-surface font-semibold text-sm rounded-m3-full border border-m3-outline-variant shadow-2xs transition-colors shrink-0 cursor-pointer"
                  aria-label="Call +91 89395 39211"
                >
                  <Phone className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
                  <span>{isPondicherry ? 'Call Dispatch' : 'Call: +91 89395 39211'}</span>
                </a>
              </div>

              {/* Progressive Disclosure: Corporate GST & Official Estimate */}
              <div className="pt-2 border-t border-m3-outline-variant/40 space-y-2.5">
                <label className="w-full min-h-[44px] px-3.5 py-2 rounded-m3-lg border border-m3-outline-variant/50 hover:bg-m3-surface-container-low active:bg-m3-surface-container flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-m3-on-surface hover:text-m3-success transition-colors">
                  <input
                    type="checkbox"
                    checked={needGst}
                    onChange={(e) => {
                      setNeedGst(e.target.checked);
                      if (!e.target.checked) {
                        setModalValidationError('');
                        setModalHighlightedField('');
                      }
                    }}
                    className="w-4 h-4 rounded border-m3-outline text-m3-success focus:ring-m3-success cursor-pointer shrink-0"
                  />
                  <span className="leading-snug">
                    Need GST Tax Invoice for Corporate (+5% ITC)
                  </span>
                </label>

                {/* Expanded Corporate GST Input Box */}
                {needGst && (
                  <div className="p-3 bg-m3-success-container/30 border border-m3-success/30 rounded-m3-lg space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-m3-on-success-container">
                        <Building2 className="w-4 h-4 text-m3-success" />
                        <span>Corporate GST Details</span>
                      </div>
                      <span className="text-xs text-m3-on-success-container font-semibold bg-white px-2 py-0.5 rounded border border-m3-success/30">
                        SAC: 9966 • {placeOfSupply}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-m3-on-surface-variant mb-0.5">Devotee / Company Name *</label>
                        <input
                          ref={companyNameInputRef}
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Infosys BPM Ltd / Devotee"
                          className="w-full h-10 bg-white border border-m3-outline-variant rounded-m3-md px-2.5 py-1.5 text-xs font-semibold text-m3-on-surface placeholder:text-m3-on-surface-variant/50 focus:outline-none focus:border-m3-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-m3-on-surface-variant mb-0.5">GSTIN (15 Digits) Optional</label>
                        <input
                          ref={customerGstInputRef}
                          type="text"
                          maxLength={15}
                          value={customerGst}
                          onChange={(e) => setCustomerGst(e.target.value.toUpperCase())}
                          placeholder="33AAAAA0000A1Z5"
                          className="w-full h-10 bg-white border border-m3-outline-variant rounded-m3-md px-2.5 py-1.5 text-xs font-mono font-semibold uppercase text-m3-on-surface placeholder:text-m3-on-surface-variant/50 focus:outline-none focus:border-m3-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-m3-on-surface-variant mb-0.5">Contact Phone *</label>
                        <input
                          ref={customerPhoneInputRef}
                          type="tel"
                          maxLength={10}
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="e.g. 98400 12345"
                          className="w-full h-10 bg-white border border-m3-outline-variant rounded-m3-md px-2.5 py-1.5 text-xs font-semibold text-m3-on-surface placeholder:text-m3-on-surface-variant/50 focus:outline-none focus:border-m3-primary"
                        />
                      </div>
                    </div>

                    {/* Dynamic Recipient Detection & ITC Status */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1.5 text-m3-on-surface-variant min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-m3-success shrink-0" />
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
                      <span className="text-xs font-bold bg-m3-success-container/50 text-m3-on-success-container px-2 py-0.5 rounded border border-m3-success/30 shrink-0">
                        ✓ ITC Claimable
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* POP-UP MODAL — OFFICIAL GST PROFORMA TAX INVOICE & TRIP ESTIMATE */}
      {showPopup && typeof document !== 'undefined' && createPortal(
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Tax Invoice Proforma Preview"
          data-hide-contact-dock
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-m3-inverse-surface/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setShowPopup(false)}
        >
          <div 
            ref={modalScrollRef}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-m3-outline-variant overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 bg-m3-inverse-surface text-m3-inverse-on-surface flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-m3-success" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-heading">
                    {needGst ? 'PROFORMA TAX INVOICE & ESTIMATE' : 'TRIP FARE ESTIMATE & LETTERHEAD'}
                  </h3>
                  <p className="text-[10.5px] text-m3-inverse-on-surface/80">
                    Ref: {invoiceRefNo} • Kalidass Travels Official Quote
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-m3-inverse-on-surface/80 hover:text-m3-inverse-on-surface transition cursor-pointer"
                aria-label="Close invoice preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-m3-on-surface-variant">
              {/* Devotee / Recipient Info Fields */}
              <div className="p-3 bg-m3-surface-container-low border border-m3-outline-variant rounded-lg space-y-2">
                <span className="font-bold text-m3-on-surface block text-xs">Customer / Devotee Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-m3-on-surface-variant mb-0.5">Name *</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Devotee / Passenger Name"
                      className="w-full h-8 px-2 border border-m3-outline-variant rounded text-xs bg-white text-m3-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-m3-on-surface-variant mb-0.5">Contact Phone *</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone number"
                      className="w-full h-8 px-2 border border-m3-outline-variant rounded text-xs bg-white text-m3-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-m3-on-surface-variant mb-0.5">GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={customerGst}
                      onChange={(e) => setCustomerGst(e.target.value.toUpperCase())}
                      placeholder="15-digit GSTIN"
                      className="w-full h-8 px-2 border border-m3-outline-variant rounded text-xs bg-white text-m3-on-surface uppercase font-mono"
                    />
                  </div>
                </div>
                {modalValidationError && (
                  <p className="text-[11px] text-m3-error font-medium">{modalValidationError}</p>
                )}
              </div>

              {/* Trip Key Details Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-m3-surface-container-low p-2 rounded border border-m3-outline-variant">
                  <span className="text-m3-on-surface-variant/70 block text-[9.5px] uppercase font-bold">Vehicle</span>
                  <strong className="text-m3-on-surface truncate block">{activeVehicle?.name || 'Selected Cab'}</strong>
                </div>
                <div className="bg-m3-surface-container-low p-2 rounded border border-m3-outline-variant">
                  <span className="text-m3-on-surface-variant/70 block text-[9.5px] uppercase font-bold">Pickup</span>
                  <strong className="text-m3-on-surface truncate block">{pickup.trim() || 'Chennai'}</strong>
                </div>
                <div className="bg-m3-surface-container-low p-2 rounded border border-m3-outline-variant">
                  <span className="text-m3-on-surface-variant/70 block text-[9.5px] uppercase font-bold">Duration</span>
                  <strong className="text-m3-on-surface truncate block">{durationLabel || '1 Day'}</strong>
                </div>
                <div className="bg-m3-surface-container-low p-2 rounded border border-m3-outline-variant">
                  <span className="text-m3-on-surface-variant/70 block text-[9.5px] uppercase font-bold">Passengers</span>
                  <strong className="text-m3-on-surface truncate block">{passengers} Pax</strong>
                </div>
              </div>

              {/* Trip Manifest Summary */}
              <div className="border border-m3-outline-variant rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px] sm:text-xs">
                  <thead className="bg-m3-surface-container text-m3-on-surface font-bold border-b border-m3-outline-variant">
                    <tr>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-m3-outline-variant/40">
                    <tr>
                      <td className="p-2">Dedicated Vehicle Hire ({activeVehicle?.name}):</td>
                      <td className="p-2 text-right font-semibold">₹{Number(fareBreakdown?.vehicleHireFare || taxableAmount).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-2">Chauffeur Duty &amp; Halting Batta:</td>
                      <td className="p-2 text-right font-semibold">₹{Number(fareBreakdown?.driverBata || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    {isAfter24Hours ? (
                      <tr className="bg-amber-50/70 text-amber-950">
                        <td className="p-2 font-medium">
                          <strong className="text-amber-900">Statutory FASTag Tolls &amp; Parking:</strong><br/>
                          <span className="text-[10px] text-amber-800">Payable extra directly by passenger on road as per actual receipts</span>
                        </td>
                        <td className="p-2 text-right font-bold text-amber-800">AT ACTUALS</td>
                      </tr>
                    ) : (
                      <tr className="bg-emerald-50/70 text-emerald-950">
                        <td className="p-2 font-medium">
                          <strong className="text-emerald-900">Highway Tolls, Permits &amp; Parking:</strong><br/>
                          <span className="text-[10px] text-emerald-800">100% all-inclusive pure agent service</span>
                        </td>
                        <td className="p-2 text-right font-bold text-emerald-700">INCLUDED</td>
                      </tr>
                    )}
                    <tr className="bg-m3-surface-container-low/50">
                      <td className="p-2 font-semibold">Total Taxable Value:</td>
                      <td className="p-2 text-right font-bold text-m3-on-surface">₹{Number(taxableAmount).toLocaleString('en-IN')}</td>
                    </tr>
                    {needGst && (
                      <tr>
                        <td className="p-2">GST Tax (5%):</td>
                        <td className="p-2 text-right font-semibold">+₹{Number(totalGst).toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    <tr className="bg-m3-surface-container-low font-bold text-m3-on-surface">
                      <td className="p-2">Total Estimated Net:</td>
                      <td className="p-2 text-right text-m3-success text-sm">{activePayableFare}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 sm:p-4 bg-m3-surface-container-low border-t border-m3-outline-variant flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDirectPrintLetterhead}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-m3-outline-variant hover:bg-m3-surface-container text-m3-on-surface text-xs font-bold transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>

              <WhatsAppButton
                href={whatsAppUrl}
                onClick={handleDirectWhatsAppClick}
                variant="filled"
                size="md"
                data-direct-whatsapp="true"
                className="px-4 py-2 text-xs font-bold"
                text="Book on WhatsApp"
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {locationPickerOpen && (
        <LocationPicker
          isOpen={locationPickerOpen}
          onClose={() => setLocationPickerOpen(false)}
          onConfirm={handleLocationConfirm}
          type={pickerField}
          initialAddress={pickerField === 'pickup' ? pickup : dropDestination}
        />
      )}
    </>
  );
}
