import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Car, 
  Clock, 
  Plane, 
  MapPin, 
  Calendar, 
  Users, 
  Phone, 
  CheckCircle2, 
  Info, 
  ShieldCheck, 
  ArrowRight,
  Edit2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Navigation
} from 'lucide-react';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import { buildWhatsAppUrl, WHATSAPP_CONFIG } from '../utils/whatsapp';
import tariffConfig from '../data/tariff_config.json';
import { peekNextQuotationId } from '../utils/sequenceGenerator';
import { loadGoogleMaps } from '../lib/googleMapsLoader';

// ── Master database of known outstation destinations from Chennai ──────────
const KNOWN_DESTINATIONS = {
  'tirupati': { name: 'Tirupati Balaji', roundTripKm: 320, oneWayKm: 135, stateCode: 'AP', defaultDays: 1 },
  'tirumala': { name: 'Tirumala Hills', roundTripKm: 340, oneWayKm: 155, stateCode: 'AP', defaultDays: 1 },
  'pondicherry': { name: 'Pondicherry & Auroville', roundTripKm: 310, oneWayKm: 151, stateCode: 'PY', defaultDays: 1 },
  'puducherry': { name: 'Pondicherry & Auroville', roundTripKm: 310, oneWayKm: 151, stateCode: 'PY', defaultDays: 1 },
  'thiruvannamalai': { name: 'Thiruvannamalai Girivalam', roundTripKm: 390, oneWayKm: 195, stateCode: 'TN', defaultDays: 1 },
  'tiruvannamalai': { name: 'Thiruvannamalai Girivalam', roundTripKm: 390, oneWayKm: 195, stateCode: 'TN', defaultDays: 1 },
  'kanchipuram': { name: 'Kanchipuram Temples', roundTripKm: 150, oneWayKm: 75, stateCode: 'TN', defaultDays: 1 },
  'vellore': { name: 'Vellore Golden Temple & CMC', roundTripKm: 280, oneWayKm: 140, stateCode: 'TN', defaultDays: 1 },
  'mahabalipuram': { name: 'Mahabalipuram Shore', roundTripKm: 120, oneWayKm: 55, stateCode: 'TN', defaultDays: 1 },
  'mamallapuram': { name: 'Mahabalipuram Shore', roundTripKm: 120, oneWayKm: 55, stateCode: 'TN', defaultDays: 1 },
  'chidambaram': { name: 'Chidambaram Natarajar', roundTripKm: 450, oneWayKm: 230, stateCode: 'TN', defaultDays: 1 },
  'kumbakonam': { name: 'Kumbakonam Navagraha', roundTripKm: 650, oneWayKm: 310, stateCode: 'TN', defaultDays: 2 },
  'navagraha': { name: 'Kumbakonam Navagraha', roundTripKm: 650, oneWayKm: 310, stateCode: 'TN', defaultDays: 2 },
  'rameswaram': { name: 'Rameswaram Jyotirlinga', roundTripKm: 1100, oneWayKm: 550, stateCode: 'TN', defaultDays: 3 },
  'sabarimala': { name: 'Sabarimala Pilgrimage', roundTripKm: 1300, oneWayKm: 650, stateCode: 'KL', defaultDays: 3 },
  'tiruchendur': { name: 'Tiruchendur Murugan', roundTripKm: 1250, oneWayKm: 625, stateCode: 'TN', defaultDays: 2 },
  'bangalore': { name: 'Bangalore / Bengaluru', roundTripKm: 700, oneWayKm: 350, stateCode: 'KA', defaultDays: 2 },
  'bengaluru': { name: 'Bangalore / Bengaluru', roundTripKm: 700, oneWayKm: 350, stateCode: 'KA', defaultDays: 2 },
  'mysore': { name: 'Mysore Palace', roundTripKm: 960, oneWayKm: 480, stateCode: 'KA', defaultDays: 3 },
  'coimbatore': { name: 'Coimbatore Isha Yoga', roundTripKm: 1010, oneWayKm: 505, stateCode: 'TN', defaultDays: 2 },
  'madurai': { name: 'Madurai Meenakshi', roundTripKm: 924, oneWayKm: 462, stateCode: 'TN', defaultDays: 2 },
  'trichy': { name: 'Trichy Srirangam', roundTripKm: 664, oneWayKm: 332, stateCode: 'TN', defaultDays: 2 },
  'salem': { name: 'Salem', roundTripKm: 680, oneWayKm: 340, stateCode: 'TN', defaultDays: 2 },
  'ooty': { name: 'Ooty Nilgiris', roundTripKm: 1110, oneWayKm: 555, stateCode: 'TN', defaultDays: 3 },
  'kodaikanal': { name: 'Kodaikanal Hills', roundTripKm: 1060, oneWayKm: 530, stateCode: 'TN', defaultDays: 3 },
  'munnar': { name: 'Munnar Tea Hills', roundTripKm: 1180, oneWayKm: 590, stateCode: 'KL', defaultDays: 3 }
};

// Route-specific minimum realistic round-trip hours
const ROUTE_REALISTIC_HOURS = {
  'tirupati': 12,
  'tirumala': 12,
  'thiruvannamalai': 14,
  'tiruvannamalai': 14,
  'pondicherry': 11,
  'puducherry': 11,
  'kanchipuram': 8,
  'vellore': 10,
  'mahabalipuram': 8,
  'mamallapuram': 8,
  'chidambaram': 14,
  'kumbakonam': 36,
  'navagraha': 36,
  'rameswaram': 48,
  'sabarimala': 48,
  'tiruchendur': 36,
  'bangalore': 24,
  'bengaluru': 24,
  'mysore': 36,
  'coimbatore': 24,
  'madurai': 24,
  'trichy': 24,
  'salem': 24,
  'ooty': 48,
  'kodaikanal': 48,
  'munnar': 48
};

function getMinReturnDateTime(pickupIso, destKeyOrName, roundTripKm) {
  if (!pickupIso) return '';
  const d = new Date(pickupIso);
  if (isNaN(d.getTime())) return '';
  
  const key = (destKeyOrName || '').toLowerCase().trim();
  let minHours = 8;
  for (const [k, hrs] of Object.entries(ROUTE_REALISTIC_HOURS)) {
    if (key.includes(k)) {
      minHours = hrs;
      break;
    }
  }
  if (minHours === 8 && roundTripKm) {
    minHours = Math.max(8, Math.round(roundTripKm / 35));
  }
  
  const minDate = new Date(d.getTime() + minHours * 60 * 60 * 1000);
  const yyyy = minDate.getFullYear();
  const mm = String(minDate.getMonth() + 1).padStart(2, '0');
  const dd = String(minDate.getDate()).padStart(2, '0');
  const hh = String(minDate.getHours()).padStart(2, '0');
  const min = String(minDate.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

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
  },
  {
    key: 'Force Urbania VIP Luxury',
    altKeys: ['Force Urbania', 'urbania', 'Urbania VIP', 'Urbania', 'Force Urbania VIP Luxury Chauffeur Van'],
    name: 'Urbania',
    fullName: 'Force Urbania VIP Luxury Van (12+1)',
    seats: 12,
    paxLabel: '12 Seats VIP',
    image: '/images/fleet/force-urbania.webp',
    category: 'coach',
    airportMultiplier: 4.5,
    airportMinFare: 4500
  }
];

// Dedicated 1-tap switcher list for Tempo Traveller fleet in seat order (12 to 26 seats & Urbania)
const TEMPO_SWITCHER_LIST = [
  {
    key: '12-Seater Luxury Force Tempo',
    altKeys: ['12-Seater', '12', 'tempo-12', 'tempo 12', 'Tempo Traveller', '12-Seater Luxury Force Tempo'],
    name: '12-Seater',
    fullName: '12-Seater Luxury Force Tempo (12+1)',
    seats: 12,
    paxLabel: '12 Seats',
    image: '/images/fleet/tempo-12.webp',
    category: 'tempo',
    airportMultiplier: 2.8,
    airportMinFare: 2400
  },
  {
    key: 'Force Urbania VIP Luxury',
    altKeys: ['Force Urbania', 'urbania', 'Urbania VIP', 'Urbania', 'Force Urbania VIP Luxury Chauffeur Van'],
    name: 'Force Urbania',
    fullName: 'Force Urbania VIP Luxury Van (12+1)',
    seats: 12,
    paxLabel: '12 Seats VIP',
    image: '/images/fleet/force-urbania.webp',
    category: 'coach',
    airportMultiplier: 4.5,
    airportMinFare: 4500
  },
  {
    key: '14-Seater Executive Force Tempo',
    altKeys: ['14-Seater', '14', 'tempo-14', 'tempo 14', '14-Seater Executive Force Tempo'],
    name: '14-Seater',
    fullName: '14-Seater Executive Force Tempo (14+1)',
    seats: 14,
    paxLabel: '14 Seats',
    image: '/images/fleet/tempo-12.webp',
    category: 'tempo',
    airportMultiplier: 3.0,
    airportMinFare: 2600
  },
  {
    key: '17-Seater Executive Force Tempo',
    altKeys: ['17-Seater', '17', 'tempo-17', 'tempo 17', '17-Seater Executive Force Tempo', '17-Seater Executive Force Tempo (4020 WB)'],
    name: '17-Seater',
    fullName: '17-Seater Executive Force Tempo (17+1)',
    seats: 17,
    paxLabel: '17 Seats',
    image: '/images/fleet/tempo-17.webp',
    category: 'coach',
    airportMultiplier: 3.2,
    airportMinFare: 2800
  },
  {
    key: '20-Seater Grand Force Tempo',
    altKeys: ['20-Seater', '20', 'tempo-20', 'tempo 20', '20-Seater Grand Force Tempo', '20-Seater Grand Force Tempo (High Roof)'],
    name: '20-Seater',
    fullName: '20-Seater Grand Force Tempo (20+1)',
    seats: 20,
    paxLabel: '20 Seats',
    image: '/images/fleet/tempo-17.webp',
    category: 'coach',
    airportMultiplier: 3.6,
    airportMinFare: 3200
  },
  {
    key: '26-Seater Mini Bus / Force Tempo',
    altKeys: ['26-Seater', '26', 'tempo-26', 'tempo 26', '26-Seater Mini Bus', 'mini bus', '26-Seater Force Mini Bus Coach'],
    name: '26-Seater',
    fullName: '26-Seater Force Mini Bus Coach (26+1)',
    seats: 26,
    paxLabel: '26 Seats',
    image: '/images/fleet/tempo.webp',
    category: 'coach',
    airportMultiplier: 4.2,
    airportMinFare: 4000
  }
];

// Helper to resolve destination from slug, title, or initialDrop
function resolveInitialDestination(drop, prefillDest, slug, sTitle) {
  if (drop && typeof drop === 'string' && drop.trim()) return drop.trim();
  if (prefillDest && typeof prefillDest === 'string' && prefillDest.trim()) return prefillDest.trim();
  
  const text = `${slug || ''} ${sTitle || ''}`.toLowerCase();
  if (text.includes('tirupati') || text.includes('balaji')) return 'Tirupati';
  if (text.includes('tirumala')) return 'Tirumala';
  if (text.includes('pondicherry') || text.includes('puducherry') || text.includes('auroville')) return 'Pondicherry';
  if (text.includes('thiruvannamalai') || text.includes('tiruvannamalai') || text.includes('girivalam')) return 'Thiruvannamalai';
  if (text.includes('kanchipuram') || text.includes('kanchi')) return 'Kanchipuram';
  if (text.includes('vellore')) return 'Vellore';
  if (text.includes('mahabalipuram') || text.includes('mamallapuram')) return 'Mahabalipuram';
  if (text.includes('chidambaram')) return 'Chidambaram';
  if (text.includes('kumbakonam') || text.includes('navagraha')) return 'Kumbakonam';
  if (text.includes('rameswaram') || text.includes('rameshwaram')) return 'Rameswaram';
  if (text.includes('sabarimala')) return 'Sabarimala';
  if (text.includes('tiruchendur')) return 'Tiruchendur';
  if (text.includes('bangalore') || text.includes('bengaluru')) return 'Bangalore';
  if (text.includes('mysore') || text.includes('mysuru')) return 'Mysore';
  if (text.includes('coimbatore')) return 'Coimbatore';
  if (text.includes('madurai')) return 'Madurai';
  if (text.includes('trichy') || text.includes('tiruchirappalli')) return 'Trichy';
  if (text.includes('salem')) return 'Salem';
  if (text.includes('ooty') || text.includes('udhagamandalam')) return 'Ooty';
  if (text.includes('kodaikanal')) return 'Kodaikanal';
  if (text.includes('munnar')) return 'Munnar';
  return '';
}

export default function BookingEngine({
  initialTab = 'outstation',
  allowedTabs = ['outstation', 'local', 'airport'],
  prefill = {},
  serviceSlug = '',
  serviceTitle = '',
  initialDrop = '',
  initialPickup = '',
  initialVehicle = '',
  autoCalculate = false,
  showHeader = true,
  title = '',
  subtitle = '',
  variant = 'card',
  fleetType = '',
  customVehicles = null
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Detect if this is a dedicated Tempo Traveller context
  const isTempoOnly = useMemo(() => {
    if (fleetType === 'tempo') return true;
    const slug = (serviceSlug || '').toLowerCase();
    const title = (serviceTitle || '').toLowerCase();
    return slug.includes('tempo-traveller') || slug.includes('tempo') || title.includes('tempo traveller');
  }, [fleetType, serviceSlug, serviceTitle]);

  // Active Vehicle Switcher List (Tempos only for Tempo services; Standard fleet for car services)
  const activeVehicleList = useMemo(() => {
    if (customVehicles && Array.isArray(customVehicles) && customVehicles.length > 0) {
      return customVehicles;
    }
    return isTempoOnly ? TEMPO_SWITCHER_LIST : VEHICLE_SWITCHER_LIST;
  }, [isTempoOnly, customVehicles]);

  const findVehicleMeta = useCallback((vKey) => {
    if (!vKey) return activeVehicleList[0];
    const norm = String(vKey).toLowerCase().trim();
    return activeVehicleList.find(v => {
      if (v.key.toLowerCase() === norm) return true;
      if (v.name.toLowerCase() === norm) return true;
      if (v.fullName && v.fullName.toLowerCase() === norm) return true;
      if (v.altKeys && v.altKeys.some(k => k.toLowerCase() === norm || norm.includes(k.toLowerCase()))) return true;
      return false;
    }) || activeVehicleList[0];
  }, [activeVehicleList]);

  // 1. Normalize Initial Tab & Allowed Tabs
  const normalizedInitialTab = useMemo(() => {
    if (initialTab === 'round' || initialTab === 'oneway') return 'outstation';
    if (['outstation', 'local', 'airport'].includes(initialTab)) return initialTab;
    return 'outstation';
  }, [initialTab]);

  const normalizedAllowedTabs = useMemo(() => {
    const list = (allowedTabs || ['outstation', 'local', 'airport']).map(t => 
      (t === 'round' || t === 'oneway') ? 'outstation' : t
    );
    const valid = list.filter(t => ['outstation', 'local', 'airport'].includes(t));
    return Array.from(new Set(valid.length > 0 ? valid : ['outstation']));
  }, [allowedTabs]);

  const [activeTab, setActiveTab] = useState(normalizedInitialTab);

  // 2. Resolve default destination
  const detectedDestination = useMemo(() => {
    return resolveInitialDestination(initialDrop, prefill.destination, serviceSlug, serviceTitle);
  }, [initialDrop, prefill.destination, serviceSlug, serviceTitle]);

  // Strictly either 'form' or 'results' — In-place swap!
  const [viewMode, setViewMode] = useState('form');

  // 3. Form State: Outstation & General
  const defaultTripType = (initialTab === 'oneway' || prefill.tripType === 'oneway') ? 'oneway' : 'round';
  const [outstationTripType, setOutstationTripType] = useState(defaultTripType);
  const [outstationPickup, setOutstationPickup] = useState(initialPickup || prefill.pickup || 'Chennai, Tamil Nadu');
  const [outstationDrop, setOutstationDrop] = useState(detectedDestination || '');
  
  // Resolve default days based on destination
  const defaultDaysForDest = useMemo(() => {
    const destObj = KNOWN_DESTINATIONS[(detectedDestination || '').toLowerCase()];
    return destObj?.defaultDays || (prefill.days ? Number(prefill.days) : 1);
  }, [detectedDestination, prefill.days]);

  const [outstationDays, setOutstationDays] = useState(defaultDaysForDest);

  // Pickup & Return Date Times
  const [pickupDateTime, setPickupDateTime] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T06:00`;
  });

  const [returnDateTime, setReturnDateTime] = useState('');

  // 4. Form State: Local Rental
  const [localPackageKey, setLocalPackageKey] = useState(prefill.package || 'local_8hr_pkg');

  // 5. Form State: Airport
  const [airportDirection, setAirportDirection] = useState('pickup'); // 'pickup' | 'drop'
  const [airportDropAddress, setAirportDropAddress] = useState('');
  const [flightNumber, setFlightNumber] = useState('');

  // 6. Selected Vehicle
  const defaultVehicleKey = useMemo(() => {
    const v = (initialVehicle || prefill.vehicle || '').toLowerCase();
    if (isTempoOnly) {
      if (v.includes('urbania')) return 'Force Urbania VIP Luxury';
      if (v.includes('14')) return '14-Seater Executive Force Tempo';
      if (v.includes('17')) return '17-Seater Executive Force Tempo';
      if (v.includes('20')) return '20-Seater Grand Force Tempo';
      if (v.includes('26') || v.includes('bus')) return '26-Seater Mini Bus / Force Tempo';
      return '12-Seater Luxury Force Tempo';
    }
    const slug = (serviceSlug || '').toLowerCase();
    if (v.includes('urbania') || slug.includes('urbania')) return 'Force Urbania VIP Luxury';
    if (v.includes('tempo') || slug.includes('tempo')) return 'Tempo Traveller';
    if (v.includes('ertiga') || slug.includes('ertiga')) return 'Maruti Ertiga';
    if (v.includes('crysta') || slug.includes('crysta')) return 'Innova Crysta';
    if (v.includes('innova') || slug.includes('innova')) return 'Innova';
    return 'Swift Dzire';
  }, [initialVehicle, prefill.vehicle, serviceSlug, isTempoOnly]);

  const [selectedVehicleKey, setSelectedVehicleKey] = useState(defaultVehicleKey);

  // 7. GST Invoice Preference
  const [needGst, setNeedGst] = useState(false);
  const [companyGstin, setCompanyGstin] = useState('');

  useEffect(() => {
    setSelectedVehicleKey(defaultVehicleKey);
  }, [defaultVehicleKey]);

  // Listen to custom booking events from vehicle showcase cards or package cards
  useEffect(() => {
    const handleSelectVehicle = (e) => {
      const v = e?.detail?.vehicle;
      if (v) {
        const found = findVehicleMeta(v);
        if (found) {
          setSelectedVehicleKey(found.key);
        }
      }
    };

    const handleSelectPackage = (e) => {
      const { destination, days, vehicle, tab } = e?.detail || {};
      if (destination) setOutstationDrop(destination);
      if (days) setOutstationDays(Number(days) || 1);
      if (tab === 'round' || tab === 'oneway') {
        setActiveTab('outstation');
        setOutstationTripType(tab);
      }
      if (vehicle) {
        const found = findVehicleMeta(vehicle);
        if (found) setSelectedVehicleKey(found.key);
      }
      setViewMode('results');
    };

    window.addEventListener('select-quote-vehicle', handleSelectVehicle);
    window.addEventListener('select-quote-package', handleSelectPackage);
    return () => {
      window.removeEventListener('select-quote-vehicle', handleSelectVehicle);
      window.removeEventListener('select-quote-package', handleSelectPackage);
    };
  }, [findVehicleMeta]);

  // Google Places Autocomplete
  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const returnInputRef = useRef(null);
  const vehicleScrollerRef = useRef(null);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (viewMode !== 'form') return;
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

    let mapsLoading = false;
    const ensureGoogleMaps = () => {
      if (window.google?.maps?.places) {
        initAutocomplete();
        return;
      }
      if (mapsLoading) return;
      mapsLoading = true;
      loadGoogleMaps()
        .then(() => initAutocomplete())
        .catch(() => {});
    };

    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      window.addEventListener('google-maps-loaded', initAutocomplete);

      const container = document.getElementById('fare-calculator') || document.getElementById('booking-panel');
      const triggers = ['focusin', 'pointerdown', 'touchstart'];
      const onInteraction = () => {
        triggers.forEach((evt) => container?.removeEventListener(evt, onInteraction));
        ensureGoogleMaps();
      };
      if (container) {
        triggers.forEach((evt) => container.addEventListener(evt, onInteraction, { once: true, passive: true }));
      }
    }

    return () => {
      window.removeEventListener('google-maps-loaded', initAutocomplete);
      if (checkTimer) clearInterval(checkTimer);
    };
  }, [viewMode, activeTab]);

  // Quote Reference ID (Sequential fallback)
  const [quoteRefId, setQuoteRefId] = useState('#QT-101');
  useEffect(() => {
    try {
      const nextId = peekNextQuotationId?.();
      if (nextId) setQuoteRefId(nextId);
    } catch (_) {}
  }, []);

  // Formatted date string for summary
  const formattedPickupDate = useMemo(() => {
    if (!pickupDateTime) return 'Tomorrow 06:00 AM';
    try {
      const d = new Date(pickupDateTime);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hr12 = hours % 12 || 12;
      return `${day}-${month}-${year} ${String(hr12).padStart(2, '0')}:${minutes} ${ampm}`;
    } catch (_) {
      return pickupDateTime;
    }
  }, [pickupDateTime]);

  // Resolve current destination object
  const resolvedDestination = useMemo(() => {
    const raw = (outstationDrop || '').toLowerCase().trim();
    for (const [key, dest] of Object.entries(KNOWN_DESTINATIONS)) {
      if (raw.includes(key)) return dest;
    }
    // Also check state_permits keywords
    let detectedState = 'TN';
    for (const [code, entry] of Object.entries(tariffConfig.state_permits || {})) {
      if (code === 'TN') continue;
      if (entry.keywords?.some(kw => raw.includes(kw.toLowerCase()))) {
        detectedState = code;
        break;
      }
    }
    return {
      name: outstationDrop || 'Outstation Trip',
      roundTripKm: outstationDays * 250,
      oneWayKm: 130,
      stateCode: detectedState,
      defaultDays: outstationDays
    };
  }, [outstationDrop, outstationDays]);

  // Minimum realistic return date/time for outstation
  const minReturnDateTime = useMemo(() => {
    if (!pickupDateTime) return '';
    return getMinReturnDateTime(
      pickupDateTime,
      resolvedDestination.name || outstationDrop,
      resolvedDestination.roundTripKm
    );
  }, [pickupDateTime, resolvedDestination, outstationDrop]);

  // Handle pickup change and auto-validate return schedule
  const handlePickupChange = (val) => {
    setPickupDateTime(val);
    setValidationError('');
    if (val && returnDateTime) {
      const minReturn = getMinReturnDateTime(val, resolvedDestination.name || outstationDrop, resolvedDestination.roundTripKm);
      if (returnDateTime < minReturn) {
        setReturnDateTime('');
        setOutstationDays(resolvedDestination.defaultDays || 1);
      } else {
        const pDate = new Date(val);
        const rDate = new Date(returnDateTime);
        const diffDays = Math.max(1, Math.ceil((rDate - pDate) / (1000 * 60 * 60 * 24)));
        setOutstationDays(diffDays);
      }
    }
  };

  // Handle return change and calculate duration
  const handleReturnChange = (val) => {
    setReturnDateTime(val);
    setValidationError('');
    if (val && pickupDateTime) {
      const pDate = new Date(pickupDateTime);
      const rDate = new Date(val);
      const diffDays = Math.max(1, Math.ceil((rDate - pDate) / (1000 * 60 * 60 * 24)));
      setOutstationDays(diffDays);
    } else {
      setOutstationDays(resolvedDestination.defaultDays || 1);
    }
  };

  // Pricing calculation engine per vehicle
  const calculateVehiclePricing = (vKey) => {
    const vehicleMeta = findVehicleMeta(vKey);
    const resolvedKey = vehicleMeta.key;
    const vConfig = tariffConfig.tempo_fleet?.[resolvedKey] ||
      tariffConfig.vehicles?.[resolvedKey] ||
      tariffConfig.tempo_fleet?.[vKey] ||
      tariffConfig.vehicles?.[vKey] ||
      (isTempoOnly ? (tariffConfig.tempo_fleet?.['12-Seater Luxury Force Tempo'] || tariffConfig.vehicles?.['Tempo Traveller']) : tariffConfig.vehicles?.['Swift Dzire']) ||
      {};

    const isTempoOrLarge = Boolean(
      isTempoOnly ||
      (vehicleMeta.seats && vehicleMeta.seats >= 12) ||
      vehicleMeta.category === 'tempo' ||
      vehicleMeta.category === 'coach'
    );
    const advance = isTempoOrLarge ? 2000 : 500;

    if (activeTab === 'outstation') {
      const isRound = outstationTripType === 'round';
      const minDailyKm = vConfig.min_km_per_day || (vehicleMeta.category === 'tempo' ? 300 : 250);
      const ratePerKm = isRound ? (vConfig.round_trip_rate || 14) : (vConfig.one_way_rate || 16);
      const bataPerDay = vConfig.driver_bata || 500;

      if (isRound) {
        const totalMinKm = outstationDays * minDailyKm;
        const estimatedKm = resolvedDestination.roundTripKm || totalMinKm;
        const billedKm = Math.max(estimatedKm, totalMinKm);
        const kmCost = billedKm * ratePerKm;
        const totalBata = outstationDays * bataPerDay;
        
        const stateCode = resolvedDestination.stateCode;
        const isInterstate = Boolean(stateCode && stateCode !== 'TN');
        const vehicleCategory = vehicleMeta.category || 'sedan';
        const statePermit = isInterstate ? (tariffConfig.state_permits?.[stateCode]?.rates?.[vehicleCategory] || 0) : 0;
        const baseSubtotal = kmCost + totalBata + statePermit;
        const taxableAmount = kmCost + totalBata;
        const gstAmount = needGst ? Math.round(taxableAmount * 0.05) : 0;
        const totalFare = baseSubtotal + gstAmount;

        return {
          billedKm,
          ratePerKm,
          extraKmRate: ratePerKm,
          kmCost,
          driverBata: totalBata,
          isInterstate,
          stateCode,
          statePermit,
          baseSubtotal,
          taxableAmount,
          gstAmount,
          totalFare,
          advance,
          routeSummary: `${outstationPickup.split(',')[0]} ⇄ ${resolvedDestination.name || outstationDrop || 'Outstation'}`,
          tripSubtext: `Includes ${billedKm} km (${outstationDays} Day${outstationDays > 1 ? 's' : ''}) • Extra: ₹${ratePerKm}/km`,
          metaDateStr: `${formattedPickupDate} • Round Trip • ~${billedKm} km • ${vehicleMeta.seats} Seats`
        };
      } else {
        // One-Way Drop
        const minDropKm = vConfig.min_drop_km || (vehicleMeta.category === 'tempo' ? 250 : 130);
        const estimatedKm = resolvedDestination.oneWayKm || minDropKm;
        const billedKm = Math.max(estimatedKm, minDropKm);
        const kmCost = billedKm * ratePerKm;
        const totalBata = bataPerDay;
        const stateCode = resolvedDestination.stateCode;
        const isInterstate = Boolean(stateCode && stateCode !== 'TN');
        const vehicleCategory = vehicleMeta.category || 'sedan';
        const statePermit = isInterstate ? (tariffConfig.state_permits?.[stateCode]?.rates?.[vehicleCategory] || 0) : 0;
        const baseSubtotal = kmCost + totalBata + statePermit;
        const taxableAmount = kmCost + totalBata;
        const gstAmount = needGst ? Math.round(taxableAmount * 0.05) : 0;
        const totalFare = baseSubtotal + gstAmount;

        return {
          billedKm,
          ratePerKm,
          extraKmRate: ratePerKm,
          kmCost,
          driverBata: totalBata,
          isInterstate,
          stateCode,
          statePermit,
          baseSubtotal,
          taxableAmount,
          gstAmount,
          totalFare,
          advance,
          routeSummary: `${outstationPickup.split(',')[0]} ➔ ${resolvedDestination.name || outstationDrop || 'Outstation'}`,
          tripSubtext: `Includes ${billedKm} km One-Way Drop • Extra: ₹${ratePerKm}/km`,
          metaDateStr: `${formattedPickupDate} • One-Way Drop • ~${billedKm} km • ${vehicleMeta.seats} Seats`
        };
      }
    } else if (activeTab === 'local') {
      const pkg = LOCAL_PACKAGES.find(p => p.key === localPackageKey) || LOCAL_PACKAGES[2];
      const baseFare = vConfig[pkg.key] || 2200;
      const extraKmRate = vConfig.extra_km_rate || 15;
      const extraHrRate = vConfig.extra_hr_rate || 150;
      const baseSubtotal = baseFare;
      const taxableAmount = baseFare;
      const gstAmount = needGst ? Math.round(taxableAmount * 0.05) : 0;
      const totalFare = baseSubtotal + gstAmount;

      return {
        billedKm: pkg.km,
        packageHours: pkg.hours,
        kmCost: baseFare,
        driverBata: 0,
        extraKmRate,
        extraHrRate,
        isInterstate: false,
        stateCode: 'TN',
        statePermit: 0,
        baseSubtotal,
        taxableAmount,
        gstAmount,
        totalFare,
        advance,
        routeSummary: `Chennai Local (${pkg.label})`,
        tripSubtext: `Includes ${pkg.hours} Hrs / ${pkg.km} KM • Extra: ₹${extraKmRate}/km, ₹${extraHrRate}/hr`,
        metaDateStr: `${formattedPickupDate} • City Rental • ${pkg.label} • ${vehicleMeta.seats} Seats`
      };
    } else {
      // Airport Tab
      const rawDest = (airportDropAddress || '').toLowerCase();
      const matchedOutstation = Object.keys(KNOWN_DESTINATIONS).find(k => rawDest.includes(k));
      
      if (matchedOutstation) {
        const dest = KNOWN_DESTINATIONS[matchedOutstation];
        const minDropKm = vConfig.min_drop_km || (vehicleMeta.category === 'tempo' ? 250 : 130);
        const billedKm = Math.max(dest.oneWayKm, minDropKm);
        const ratePerKm = vConfig.one_way_rate || 16;
        const kmCost = billedKm * ratePerKm;
        const driverBata = vConfig.driver_bata || 500;
        const isInterstate = Boolean(dest.stateCode && dest.stateCode !== 'TN');
        const vehicleCategory = vehicleMeta.category || 'sedan';
        const statePermit = isInterstate ? (tariffConfig.state_permits?.[dest.stateCode]?.rates?.[vehicleCategory] || 0) : 0;
        const baseSubtotal = kmCost + driverBata + statePermit;
        const taxableAmount = kmCost + driverBata;
        const gstAmount = needGst ? Math.round(taxableAmount * 0.05) : 0;
        const totalFare = baseSubtotal + gstAmount;

        return {
          billedKm,
          ratePerKm,
          extraKmRate: ratePerKm,
          kmCost,
          driverBata,
          isInterstate,
          stateCode: dest.stateCode,
          statePermit,
          baseSubtotal,
          taxableAmount,
          gstAmount,
          totalFare,
          advance,
          routeSummary: `Chennai Airport (MAA) ➔ ${dest.name}`,
          tripSubtext: `Includes ${billedKm} km Airport Drop • Extra: ₹${ratePerKm}/km`,
          metaDateStr: `${formattedPickupDate} • Airport Drop • ~${billedKm} km • ${vehicleMeta.seats} Seats`
        };
      } else {
        // City Airport Flat Zone Transfer
        const zone = AIRPORT_ZONES[0];
        let fare = Math.round(zone.sedan * vehicleMeta.airportMultiplier);
        if (vehicleMeta.airportMinFare && fare < vehicleMeta.airportMinFare) {
          fare = vehicleMeta.airportMinFare;
        }
        const baseSubtotal = fare;
        const taxableAmount = fare;
        const gstAmount = needGst ? Math.round(taxableAmount * 0.05) : 0;
        const totalFare = baseSubtotal + gstAmount;

        return {
          billedKm: zone.km,
          kmCost: fare,
          driverBata: 0,
          isInterstate: false,
          stateCode: 'TN',
          statePermit: 0,
          baseSubtotal,
          taxableAmount,
          gstAmount,
          totalFare,
          advance,
          routeSummary: airportDirection === 'pickup' 
            ? `Chennai Airport (MAA) ➔ ${airportDropAddress || 'Chennai City Area'}`
            : `${airportDropAddress || 'Chennai City Area'} ➔ Chennai Airport (MAA)`,
          tripSubtext: `Fixed Flat Fare · Free Flight Delay Buffer`,
          metaDateStr: `${formattedPickupDate} • Airport Transfer • ${vehicleMeta.seats} Seats`
        };
      }
    }
  };

  // Selected vehicle object & pricing breakdown
  const selectedVehicle = useMemo(() => {
    return findVehicleMeta(selectedVehicleKey);
  }, [selectedVehicleKey, findVehicleMeta]);

  const currentBreakdown = useMemo(() => {
    return calculateVehiclePricing(selectedVehicleKey);
  }, [selectedVehicleKey, activeTab, outstationTripType, outstationDays, resolvedDestination, localPackageKey, airportDirection, airportDropAddress, outstationPickup, formattedPickupDate, needGst]);

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
        meta: { quoteRefId, tab: activeTab, days: outstationDays, needGst }
      };
      navigator.sendBeacon?.('/api/record-calculation', JSON.stringify(payload));
    } catch (_) {}
  };

  // WhatsApp Message (100% mirrors the on-screen Rate Summary & Payment Rules)
  const getWhatsAppMessage = () => {
    const isLocal = activeTab === 'local';

    // 1. Vehicle line with km & rate
    const vehicleHireLine = isLocal
      ? `• ${selectedVehicle.fullName} (${currentBreakdown.packageHours} Hrs / ${currentBreakdown.billedKm} KM Package): ₹${currentBreakdown.kmCost?.toLocaleString('en-IN')}`
      : `• ${selectedVehicle.fullName} (${currentBreakdown.billedKm ? `${Math.round(currentBreakdown.billedKm)} km @ ₹${currentBreakdown.ratePerKm || 14}/km` : 'Hire'}): ₹${currentBreakdown.kmCost?.toLocaleString('en-IN')}`;

    // 2. Driver Bata (if applicable)
    const driverBataLine = currentBreakdown.driverBata > 0
      ? `\n• Driver Bata (${outstationDays} Day${outstationDays > 1 ? 's' : ''}): ₹${currentBreakdown.driverBata?.toLocaleString('en-IN')}`
      : '';

    // 3. State Entry Tax (if interstate)
    const permitLine = currentBreakdown.isInterstate && currentBreakdown.statePermit > 0
      ? `\n• State Entry Tax (${currentBreakdown.stateCode}): ₹${currentBreakdown.statePermit?.toLocaleString('en-IN')}`
      : '';

    // 4. GST Tax (if selected)
    const gstLine = needGst && currentBreakdown.gstAmount > 0
      ? `\n• GST Tax (5% ITC Invoice): +₹${currentBreakdown.gstAmount?.toLocaleString('en-IN')}`
      : '';

    const kmLabel = currentBreakdown.billedKm
      ? `${Math.round(currentBreakdown.billedKm)} km`
      : (isLocal ? `${currentBreakdown.packageHours} Hrs / ${currentBreakdown.billedKm} KM` : 'Standard');

    const totalFareText = needGst
      ? `Estimated Total Fare (${kmLabel}): ₹${currentBreakdown.totalFare.toLocaleString('en-IN')} (Includes 5% GST) + Extras as per slip${companyGstin.trim() ? `\n• GSTIN / Company: ${companyGstin.trim()}` : ''}`
      : `Estimated Total Fare (${kmLabel}): ₹${currentBreakdown.totalFare.toLocaleString('en-IN')} + Extras as per slip`;

    // Extra KM / Extra Hr subtext for payment rules
    const extraChargeRule = isLocal
      ? `• Extra km: ₹${currentBreakdown.extraKmRate}/km • Extra hr: ₹${currentBreakdown.extraHrRate}/hr`
      : `• Doorstep odometer reading • Extra km: ₹${currentBreakdown.extraKmRate || 14}/km`;

    return `KALIDASS TRAVELS — TRIP QUOTATION REQUEST
──────────────────────────────────────────
Ref: ${quoteRefId}
Route: ${currentBreakdown.routeSummary}
${currentBreakdown.metaDateStr}
──────────────────────────────────────────
RATE SUMMARY:
${vehicleHireLine}${driverBataLine}${permitLine}${gstLine}
• Toll Gate Fees (FASTag): Extra as per slip
• Parking Charges: Extra as per slip

${totalFareText}
──────────────────────────────────────────
PAYMENT & BILLING RULES:
• ₹${currentBreakdown.advance} advance to reserve cab (deducted in final invoice)
• Pay balance to chauffeur at trip end (UPI / Cash)
${extraChargeRule}
• Free cancellation up to 6 hours before pickup
──────────────────────────────────────────
Dispatch Helpline: +91 89395 39211
Please confirm chauffeur availability.`;
  };

  const handleCalculateClick = () => {
    // Validate required fields before proceeding
    if (activeTab === 'outstation') {
      if (!pickupDateTime) {
        setValidationError('Please select pickup date & time to view fare');
        return;
      }
      if (outstationTripType === 'round' && !returnDateTime) {
        setValidationError('Please select your return date & time to calculate round-trip fare');
        if (returnInputRef.current) {
          returnInputRef.current.focus();
          try {
            returnInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (_) {}
        }
        return;
      }
      if (!outstationDrop) {
        setOutstationDrop('Pondicherry');
      }
    } else if (activeTab === 'local') {
      if (!pickupDateTime) {
        setValidationError('Please select pickup date & time');
        return;
      }
    } else if (activeTab === 'airport') {
      if (!pickupDateTime) {
        setValidationError('Please select pickup date & time');
        return;
      }
    }

    setValidationError('');
    setViewMode('results');
    setTimeout(() => {
      const el = document.getElementById('fare-calculator');
      if (el) {
        const yOffset = -70;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 60);
  };

  const handleEditClick = () => {
    setViewMode('form');
    setTimeout(() => {
      const el = document.getElementById('fare-calculator');
      if (el) {
        const yOffset = -70;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 60);
  };

  const waHref = buildWhatsAppUrl(getWhatsAppMessage());

  return (
    <div id="fare-calculator" data-hydrated={mounted ? "true" : undefined} className={`w-full max-w-2xl mx-auto transition-all duration-200 ${variant === 'card' ? 'bg-white dark:bg-m3-surface rounded-m3-2xl shadow-m3-2 border border-m3-outline-variant/70 dark:border-m3-outline-variant/40 overflow-hidden' : ''}`}>
      
      {/* ─────────────────────────────────────────────────────────────
          MODE A: THE SELECTION INTERFACE (M3-Compliant Selection Form)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'form' && (
        <div className="p-4 sm:p-6 space-y-4 bg-white dark:bg-m3-surface transition-opacity duration-200 ease-out">
          {/* Centered Heading (M3 Title Large) */}
          <div className="text-center pb-0.5">
            <h3 className="text-lg sm:text-xl font-bold font-heading text-m3-on-surface dark:text-white tracking-tight">
              Book Your Trip
            </h3>
          </div>

          {/* 1. M3 Segmented Button / Tab Switcher */}
          {activeTab !== 'airport' ? (
            <div className="grid grid-cols-2 p-1 bg-m3-surface-container-high dark:bg-m3-surface-container-high rounded-m3-full min-h-[44px]">
              <button
                type="button"
                onClick={() => setActiveTab('outstation')}
                className={`py-2 px-3 rounded-m3-full text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  activeTab === 'outstation'
                    ? 'bg-blue-600 text-white shadow-m3-1'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Outstation (Round Trip)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('local')}
                className={`py-2 px-3 rounded-m3-full text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  activeTab === 'local'
                    ? 'bg-blue-600 text-white shadow-m3-1'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Local Package
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 p-1 bg-m3-surface-container-high dark:bg-m3-surface-container-high rounded-m3-full min-h-[44px]">
              <button
                type="button"
                onClick={() => setAirportDirection('pickup')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-m3-full text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  airportDirection === 'pickup'
                    ? 'bg-blue-600 text-white shadow-m3-1'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Airport Pickup</span>
              </button>
              <button
                type="button"
                onClick={() => setAirportDirection('drop')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-m3-full text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  airportDirection === 'drop'
                    ? 'bg-blue-600 text-white shadow-m3-1'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Plane className="w-3.5 h-3.5 rotate-45" />
                <span>Airport Drop</span>
              </button>
            </div>
          )}

          {/* 2. Outstation Form Fields */}
          {activeTab === 'outstation' && (
            <div className="space-y-3.5">
              {/* Pickup Location */}
              <div>
                <label htmlFor="pickup-input" className="flex items-center gap-1.5 text-xs font-semibold text-m3-on-surface-variant dark:text-slate-300 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pickup Location in Chennai</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="pickup-input"
                    ref={pickupInputRef}
                    type="text"
                    data-autocomplete-input="true"
                    autoComplete="off"
                    value={outstationPickup}
                    onFocus={() => loadGoogleMaps().catch(() => {})}
                    onChange={(e) => setOutstationPickup(e.target.value)}
                    placeholder="e.g. T. Nagar, Central, Airport, OMR"
                    className="w-full pl-3.5 pr-20 min-h-[48px] sm:min-h-[50px] text-xs sm:text-sm bg-m3-surface-container-low dark:bg-m3-surface-container-low border border-m3-outline-variant/80 dark:border-m3-outline-variant/60 rounded-m3-sm text-m3-on-surface dark:text-white placeholder-slate-400 focus:outline-none focus:border-2 focus:border-blue-600 focus:bg-white dark:focus:bg-m3-surface transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    {outstationPickup && (
                      <button
                        type="button"
                        onClick={() => setOutstationPickup('')}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white active:scale-90 transition-transform cursor-pointer text-xs"
                        aria-label="Clear pickup"
                      >
                        ✕
                      </button>
                    )}
                    <div className="w-8 h-8 flex items-center justify-center pointer-events-none">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Drop Location */}
              <div>
                <label htmlFor="drop-input" className="flex items-center gap-1.5 text-xs font-semibold text-m3-on-surface-variant dark:text-slate-300 mb-1">
                  <Navigation className="w-3.5 h-3.5 text-slate-500 rotate-45" />
                  <span>Drop Location / City</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="drop-input"
                    ref={dropInputRef}
                    type="text"
                    data-autocomplete-input="true"
                    autoComplete="off"
                    value={outstationDrop}
                    onFocus={() => loadGoogleMaps().catch(() => {})}
                    onChange={(e) => setOutstationDrop(e.target.value)}
                    placeholder="e.g. Pondicherry, Tirupati, Bangalore"
                    className="w-full pl-3.5 pr-10 min-h-[48px] sm:min-h-[50px] text-xs sm:text-sm bg-m3-surface-container-low dark:bg-m3-surface-container-low border border-m3-outline-variant/80 dark:border-m3-outline-variant/60 rounded-m3-sm text-m3-on-surface dark:text-white placeholder-slate-400 font-medium focus:outline-none focus:border-2 focus:border-blue-600 focus:bg-white dark:focus:bg-m3-surface transition-all"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Popular Chips (M3 Filter / Assist Chips with 40dp ergonomics) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mr-0.5">
                  POPULAR:
                </span>
                {['Tirupati', 'Pondicherry', 'Mahabalipuram', 'Kumbakonam', 'Bangalore'].map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setOutstationDrop(city)}
                    className={`min-h-[34px] px-3.5 py-1 text-xs font-medium rounded-m3-full border transition-all duration-150 cursor-pointer active:scale-95 inline-flex items-center justify-center ${
                      outstationDrop.toLowerCase().includes(city.toLowerCase())
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold shadow-m3-0'
                        : 'bg-white dark:bg-m3-surface border-m3-outline-variant/80 dark:border-m3-outline-variant/60 text-m3-on-surface dark:text-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>

              {/* 2-Column Date & Time */}
              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                <div>
                  <label htmlFor="pickup-datetime-input" className="flex items-center gap-1 text-[11px] font-semibold text-m3-on-surface-variant dark:text-slate-300 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pickup Date &amp; Time</span>
                  </label>
                  <input
                    id="pickup-datetime-input"
                    type="datetime-local"
                    value={pickupDateTime}
                    onChange={(e) => handlePickupChange(e.target.value)}
                    className="w-full px-2.5 min-h-[46px] sm:min-h-[48px] text-xs sm:text-sm bg-m3-surface-container-low dark:bg-m3-surface-container-low border border-m3-outline-variant/80 dark:border-m3-outline-variant/60 rounded-m3-sm text-m3-on-surface dark:text-white font-medium focus:outline-none focus:border-2 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="return-datetime-input" className="flex items-center gap-1 text-[11px] font-semibold text-m3-on-surface-variant dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Return Date</span>
                    </label>
                    {returnDateTime ? (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-m3-full">
                        {outstationDays === 1 ? '1 Day (Same Day)' : `${outstationDays} Days (${outstationDays - 1}N)`}
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-m3-full">
                        Required
                      </span>
                    )}
                  </div>
                  <input
                    ref={returnInputRef}
                    id="return-datetime-input"
                    type="datetime-local"
                    value={returnDateTime}
                    min={minReturnDateTime}
                    disabled={!pickupDateTime}
                    onChange={(e) => handleReturnChange(e.target.value)}
                    className={`w-full px-2.5 min-h-[46px] sm:min-h-[48px] text-xs sm:text-sm bg-m3-surface-container-low dark:bg-m3-surface-container-low border rounded-m3-sm text-m3-on-surface dark:text-white font-medium focus:outline-none focus:border-2 focus:border-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      validationError && !returnDateTime
                        ? 'border-2 border-amber-500 ring-2 ring-amber-400/40 animate-pulse bg-amber-50/40 dark:bg-amber-950/30'
                        : 'border-m3-outline-variant/80 dark:border-m3-outline-variant/60'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Local Rental Form Fields */}
          {activeTab === 'local' && (
            <div className="space-y-3.5">
              <div>
                <label htmlFor="local-package-select" className="block text-xs font-semibold text-m3-on-surface-variant dark:text-slate-300 mb-1">
                  Select City Hourly Package
                </label>
                <select
                  id="local-package-select"
                  value={localPackageKey}
                  onChange={(e) => setLocalPackageKey(e.target.value)}
                  className="w-full px-3 min-h-[48px] sm:min-h-[50px] text-xs sm:text-sm bg-m3-surface-container-low dark:bg-m3-surface-container-low border border-m3-outline-variant/80 dark:border-m3-outline-variant/60 rounded-m3-sm text-m3-on-surface dark:text-white font-bold cursor-pointer focus:outline-none focus:border-2 focus:border-blue-600 transition-all"
                >
                  {LOCAL_PACKAGES.map(pkg => (
                    <option key={pkg.key} value={pkg.key}>{pkg.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="local-pickup-input" className="block text-xs font-semibold text-m3-on-surface-variant dark:text-slate-300 mb-1">
                  Pickup Area in Chennai
                </label>
                <input
                  id="local-pickup-input"
                  type="text"
                  value={outstationPickup}
                  onChange={(e) => setOutstationPickup(e.target.value)}
                  placeholder="e.g. Medavakkam, T. Nagar, Velachery"
                  className="w-full px-3.5 min-h-[48px] sm:min-h-[50px] text-xs sm:text-sm bg-m3-surface-container-low dark:bg-m3-surface-container-low border border-m3-outline-variant/80 dark:border-m3-outline-variant/60 rounded-m3-sm text-m3-on-surface dark:text-white focus:outline-none focus:border-2 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label htmlFor="local-datetime-input" className="flex items-center gap-1 text-[11px] font-semibold text-m3-on-surface-variant dark:text-slate-300 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pickup Date &amp; Time</span>
                </label>
                <input
                  id="local-datetime-input"
                  type="datetime-local"
                  value={pickupDateTime}
                  onChange={(e) => setPickupDateTime(e.target.value)}
                  className="w-full px-2.5 min-h-[46px] sm:min-h-[48px] text-xs sm:text-sm bg-m3-surface-container-low dark:bg-m3-surface-container-low border border-m3-outline-variant/80 dark:border-m3-outline-variant/60 rounded-m3-sm text-m3-on-surface dark:text-white font-medium focus:outline-none focus:border-2 focus:border-blue-600 transition-all"
                />
              </div>
            </div>
          )}

          {/* 4. Airport Form Fields */}
          {activeTab === 'airport' && (
            <div className="space-y-3.5">
              {/* Airport Origin */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-m3-on-surface-variant dark:text-slate-300 mb-1">
                  <Plane className="w-3.5 h-3.5 text-blue-600" />
                  <span>From (Airport Pickup Hub)</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={airportDirection === 'pickup' ? "Chennai International Airport (MAA)" : (airportDropAddress || "Chennai City Area")}
                  className="w-full px-3.5 min-h-[48px] sm:min-h-[50px] text-xs sm:text-sm bg-slate-50 dark:bg-m3-surface-container-low border border-m3-outline-variant/60 rounded-m3-sm text-m3-on-surface dark:text-white font-medium cursor-not-allowed opacity-90"
                />
              </div>

              {/* Airport Destination */}
              <div>
                <label htmlFor="airport-dest-input" className="flex items-center gap-1.5 text-xs font-semibold text-m3-on-surface-variant dark:text-slate-300 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>To (Your Destination / Hotel / City)</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="airport-dest-input"
                    type="text"
                    value={airportDropAddress}
                    onChange={(e) => setAirportDropAddress(e.target.value)}
                    placeholder="Enter hotel / area / destination city"
                    className="w-full pl-3.5 pr-10 min-h-[48px] sm:min-h-[50px] text-xs sm:text-sm bg-m3-surface-container-low dark:bg-m3-surface-container-low border border-m3-outline-variant/80 dark:border-m3-outline-variant/60 rounded-m3-sm text-m3-on-surface dark:text-white placeholder-slate-400 font-medium focus:outline-none focus:border-2 focus:border-blue-600 focus:bg-white dark:focus:bg-m3-surface transition-all"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* 2-Column Date & Flight Info */}
              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                <div>
                  <label htmlFor="airport-pickup-datetime" className="flex items-center gap-1 text-[11px] font-semibold text-m3-on-surface-variant dark:text-slate-300 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pickup Date &amp; Time</span>
                  </label>
                  <input
                    id="airport-pickup-datetime"
                    type="datetime-local"
                    value={pickupDateTime}
                    onChange={(e) => setPickupDateTime(e.target.value)}
                    className="w-full px-2.5 min-h-[46px] sm:min-h-[48px] text-xs sm:text-sm bg-m3-surface-container-low dark:bg-m3-surface-container-low border border-m3-outline-variant/80 dark:border-m3-outline-variant/60 rounded-m3-sm text-m3-on-surface dark:text-white font-medium focus:outline-none focus:border-2 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="flight-no-input" className="flex items-center gap-1 text-[11px] font-semibold text-m3-on-surface-variant dark:text-slate-300">
                      <Plane className="w-3.5 h-3.5 text-blue-600" />
                      <span>Flight No. / Time</span>
                    </label>
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-m3-full">
                      Live Radar
                    </span>
                  </div>
                  <input
                    id="flight-no-input"
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="e.g. 6E-241 @ 14:30"
                    className="w-full px-2.5 min-h-[46px] sm:min-h-[48px] text-xs sm:text-sm bg-m3-surface-container-low dark:bg-m3-surface-container-low border border-m3-outline-variant/80 dark:border-m3-outline-variant/60 rounded-m3-sm text-m3-on-surface dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:border-2 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Primary View Instant Fare Button (M3 High-Emphasis Filled Button with 48+dp touch target) */}
          <div className="pt-2 text-center space-y-2">
            {validationError && (
              <div
                id="booking-validation-alert"
                role="alert"
                className="p-2.5 rounded-m3-md bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-center gap-1.5 font-semibold animate-fadeIn"
              >
                <span>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            <button
              type="button"
              id={activeTab === 'airport' ? 'get-flat-fare-btn' : (serviceSlug ? 'btn-calculate-fare' : 'view-fare-btn')}
              onClick={handleCalculateClick}
              className="w-full min-h-[50px] sm:min-h-[52px] px-6 rounded-m3-full font-bold text-sm sm:text-base tracking-wide transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-m3-1 hover:shadow-m3-2 cursor-pointer"
            >
              {activeTab === 'airport' && <Receipt className="w-4 h-4" />}
              <span>View Instant Fare</span>
            </button>
            <p className="text-xs text-m3-on-surface-variant dark:text-slate-400">
              No phone number required to check fare
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE B: THE RATE SUMMARY CARD (Approved, Preserved, In-place)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'results' && (
        <div 
          id="fare-result-summary-card" 
          className="bg-white dark:bg-m3-surface p-4 sm:p-6 space-y-3.5 animate-fadeIn transition-opacity duration-200 ease-out"
        >
          {/* Top Route Bar with [ Edit ] Button */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-m3-outline-variant/60 dark:border-m3-outline-variant/40">
            <div>
              <div className="flex items-center gap-1.5">
                {activeTab === 'airport' ? (
                  <Plane className="w-4 h-4 text-blue-600 shrink-0" />
                ) : activeTab === 'local' ? (
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <Car className="w-4 h-4 text-blue-600 shrink-0" />
                )}
                <span className="font-extrabold text-sm sm:text-base text-m3-on-surface dark:text-white font-heading">
                  {currentBreakdown.routeSummary}
                </span>
              </div>
              <div className="text-[11px] text-m3-on-surface-variant dark:text-gray-400 font-medium mt-0.5">
                {currentBreakdown.metaDateStr}
              </div>
            </div>

            <button
              type="button"
              onClick={handleEditClick}
              className="inline-flex items-center gap-1 min-h-[34px] px-3.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-m3-full hover:bg-blue-100 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          {/* STEP 1: 1-Tap Horizontal Vehicle Switcher on TOP */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-m3-on-surface-variant dark:text-gray-400 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1">
                {isTempoOnly ? <Users className="w-3.5 h-3.5 text-blue-600" /> : <Car className="w-3.5 h-3.5 text-blue-600" />}
                <span>{isTempoOnly ? 'Select Tempo Traveller / Van:' : 'Select Vehicle:'}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-normal text-slate-400 hidden xs:inline">
                  Tap to switch rates
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (vehicleScrollerRef.current) {
                        vehicleScrollerRef.current.scrollBy({ left: -140, behavior: 'smooth' });
                      }
                    }}
                    aria-label="Scroll left"
                    className="w-5 h-5 rounded-full border border-m3-outline-variant/80 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 bg-white dark:bg-m3-surface transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (vehicleScrollerRef.current) {
                        vehicleScrollerRef.current.scrollBy({ left: 140, behavior: 'smooth' });
                      }
                    }}
                    aria-label="Scroll right"
                    className="w-5 h-5 rounded-full border border-m3-outline-variant/80 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 bg-white dark:bg-m3-surface transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div 
              ref={vehicleScrollerRef}
              className="flex gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth"
            >
              {activeVehicleList.map((item) => {
                const isSelected = selectedVehicleKey === item.key;
                const vPricing = calculateVehiclePricing(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedVehicleKey(item.key)}
                    className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-m3-md border shrink-0 transition-all cursor-pointer min-h-[48px] sm:min-h-[52px] active:scale-95 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/90 dark:bg-blue-950/60 shadow-m3-0 ring-1 ring-blue-600/30'
                        : 'border-m3-outline-variant/80 dark:border-m3-outline-variant/50 bg-white dark:bg-m3-surface hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 sm:w-11 h-6 sm:h-7 object-contain shrink-0 transition-transform group-hover:scale-105"
                      loading="lazy"
                      width="44"
                      height="28"
                    />
                    <div className="text-left leading-tight pr-0.5">
                      <div className={`text-xs font-bold whitespace-nowrap ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-gray-200'}`}>
                        {item.name}
                      </div>
                      <div className="text-[10px] font-bold text-slate-900 dark:text-white mt-0.5">
                        ₹{vPricing.totalFare.toLocaleString('en-IN')}
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

          {/* STEP 2: Bill Receipt (Zepto / Blinkit cut-and-dried style in M3 Outlined Container) */}
          <div className="p-3.5 rounded-m3-lg border border-m3-outline-variant/80 dark:border-m3-outline-variant/60 space-y-2 bg-white dark:bg-m3-surface-container-low shadow-m3-0">
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-gray-300">
              <div className="flex justify-between items-center py-0.5">
                <span>{selectedVehicle.fullName} ({currentBreakdown.billedKm ? `${Math.round(currentBreakdown.billedKm)} km @ ₹${currentBreakdown.ratePerKm || 14}/km` : 'Hire'})</span>
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

              {currentBreakdown.isInterstate && currentBreakdown.statePermit > 0 && (
                <div className="flex justify-between items-center py-0.5">
                  <span>State Entry Tax ({currentBreakdown.stateCode})</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{currentBreakdown.statePermit?.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {needGst && currentBreakdown.gstAmount > 0 && (
                <div className="flex justify-between items-center py-0.5 text-blue-700 dark:text-blue-400 font-medium">
                  <span>GST Tax (5% ITC Invoice)</span>
                  <span className="font-bold">
                    +₹{currentBreakdown.gstAmount?.toLocaleString('en-IN')}
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

              {/* GST Tax Invoice Option Toggle */}
              <div className="pt-2 pb-1 border-t border-dashed border-m3-outline-variant/70 dark:border-m3-outline-variant/50">
                <label className="flex items-start justify-between gap-2.5 cursor-pointer group select-none">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={needGst}
                      onChange={(e) => setNeedGst(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-m3-surface cursor-pointer"
                    />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
                        Need GST Tax Invoice? (+5%)
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-gray-400">
                        100% corporate Input Tax Credit (ITC) compliant
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 shrink-0">
                    5% GST
                  </span>
                </label>

                {needGst && (
                  <div className="mt-2 pl-6.5 pr-0.5 animate-fadeIn">
                    <input
                      type="text"
                      value={companyGstin}
                      onChange={(e) => setCompanyGstin(e.target.value)}
                      placeholder="Company Name / GSTIN (Optional)"
                      className="w-full text-xs px-2.5 py-1.5 rounded-m3-md border border-m3-outline-variant/80 dark:border-m3-outline-variant/50 bg-slate-50 dark:bg-m3-surface text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Solid Total Line */}
              <div className="pt-2.5 border-t border-m3-outline-variant/80 dark:border-m3-outline-variant/60 flex justify-between items-baseline">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    Estimated Total Fare ({currentBreakdown.billedKm ? `${Math.round(currentBreakdown.billedKm)} km` : 'Standard'})
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-gray-400">
                    {needGst ? 'Includes 5% GST (Tax invoice provided)' : 'Base fare (Excludes GST • Available on request)'}
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

          {/* STEP 3: Payment & Billing Rules */}
          <div className="p-3 rounded-m3-lg bg-slate-50 dark:bg-m3-surface-container-low border border-m3-outline-variant/70 dark:border-m3-outline-variant/50 text-[11px] sm:text-xs">
            <div className="font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wider text-[10px] mb-1">
              Payment &amp; Billing Rules
            </div>
            <div className="space-y-0.5 text-slate-700 dark:text-gray-300">
              <div>• ₹{currentBreakdown.advance} advance to reserve cab (deducted in final invoice)</div>
              <div>• Pay balance to chauffeur at trip end (UPI / Cash)</div>
              <div>• Doorstep odometer reading • Extra km: ₹{currentBreakdown.extraKmRate || 14}/km</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                • Free cancellation up to 6 hours before pickup
              </div>
            </div>
          </div>

          {/* STEP 4: Action CTAs (M3 Full Pills with 48+dp touch targets) */}
          <div className="pt-0.5 space-y-1.5">
            <div className="flex gap-2">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer nofollow"
                data-direct-whatsapp="true"
                onClick={() => logCalculationEvent(selectedVehicle.fullName, currentBreakdown.totalFare)}
                className="flex-1 min-h-[48px] sm:min-h-[50px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-m3-full bg-[#075E54] hover:bg-[#054c44] active:bg-[#043e37] text-white font-bold text-xs sm:text-sm shadow-m3-1 hover:shadow-m3-2 hover:-translate-y-0.5 transition-all active:scale-[0.98] cursor-pointer border border-[#054c44]/30"
              >
                <WhatsAppIcon variant="white" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>Book {selectedVehicle.name} on WhatsApp</span>
              </a>

              <a
                href={`tel:${WHATSAPP_CONFIG.phone}`}
                onClick={() => logCalculationEvent(selectedVehicle.fullName, currentBreakdown.totalFare)}
                className="min-h-[48px] sm:min-h-[50px] inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-m3-full border border-m3-outline hover:bg-m3-primary/10 active:bg-m3-primary/20 text-m3-primary font-bold text-xs transition-colors cursor-pointer shrink-0 active:scale-95"
              >
                <Phone className="w-3.5 h-3.5 text-m3-primary" />
                <span>Call Us</span>
              </a>
            </div>

            <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center font-medium">
              24/7 Helpline: +91 89395 39211
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
