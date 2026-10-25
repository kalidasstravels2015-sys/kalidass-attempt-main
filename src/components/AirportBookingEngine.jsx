import React, { useState, useEffect, useRef } from 'react';
import {
  Plane, Car, Users, User, Calculator, MapPin, X,
  ChevronDown, ShieldCheck, CheckCircle2,
  Calendar, Phone, ArrowRight, Clock, AlertCircle
} from 'lucide-react';
import LocationPicker from './LocationPicker';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import { trackCalculatorQuote, trackEvent, markQuoteConverted } from '../lib/analytics';
import { buildMapsLinks } from '../utils/whatsapp';
import { getActiveGoogleSheetUrl } from '../config/googleSheets';
import { getNextQuotationId, peekNextQuotationId } from '../utils/sequenceGenerator';
import tariffConfig from '../data/tariff_config.json';
import tnBusFares from '../data/tnBusFares.json';

const vehicles = tariffConfig.vehicles;
const vehicleOptions = Object.keys(vehicles);

const AIRPORT_COMPARISON_VEHICLES = [
  { key: 'Swift Dzire', shortLabel: 'Sedan (4p)' },
  { key: 'Maruti Ertiga', shortLabel: 'Ertiga SUV (6p)' },
  { key: 'Innova', shortLabel: 'Innova (6p)' },
  { key: 'Innova Crysta', shortLabel: 'Crysta (7p)' },
];

const estimateAirportRoadExtras = (locText, effKm, isOutstation) => {
  if (!isOutstation) {
    return { stateName: 'Tamil Nadu', statePermitEst: 0, tollsEst: 0 };
  }
  const text = (locText || '').toLowerCase();
  let stateName = 'Tamil Nadu';
  let statePermitEst = 0;
  let tollsEst = 0;

  if (text.includes('tirupati') || text.includes('tirumala') || text.includes('andhra') || text.includes('kalahasti') || text.includes('nellore') || text.includes('chittoor') || text.includes('renigunta')) {
    stateName = 'Andhra Pradesh';
    statePermitEst = 500;
    tollsEst = 220;
  } else if (text.includes('bangalore') || text.includes('bengaluru') || text.includes('karnataka') || text.includes('mysore') || text.includes('mysuru') || text.includes('hosur')) {
    stateName = 'Karnataka';
    statePermitEst = 700;
    tollsEst = 250;
  } else if (text.includes('pondicherry') || text.includes('puducherry') || text.includes('auroville')) {
    stateName = 'Puducherry (UT)';
    statePermitEst = 0;
    tollsEst = 130;
  } else if (text.includes('kerala') || text.includes('munnar') || text.includes('cochin') || text.includes('kochi')) {
    stateName = 'Kerala';
    statePermitEst = 800;
    tollsEst = 350;
  } else {
    stateName = 'Tamil Nadu';
    statePermitEst = 0;
    tollsEst = Math.max(80, Math.round((effKm * 0.85) / 10) * 10);
  }

  return { stateName, statePermitEst, tollsEst };
};

const VEHICLE_CAPACITY = {
  'Swift Dzire':     4,
  'Toyota Etios':    4,
  'Maruti Ertiga':   6,
  'Innova':          6,
  'Innova Crysta':   7,
  'Tempo Traveller': 12,
};

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

const AIRPORT_HUB = 'Chennai International Airport (MAA)';

const COMMON_DISTANCES_FROM_CHENNAI = {
  'chennai': 0,
  'pondicherry': 151,
  'puducherry': 151,
  'auroville': 148,
  'bangalore': 346,
  'bengaluru': 346,
  'tirupati': 135,
  'tirumala': 155,
  'vellore': 140,
  'kanchipuram': 75,
  'mahabalipuram': 55,
  'mamallapuram': 55,
  'sriperumbudur': 42,
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
  'pondy bazaar': 14,
  't. nagar': 15,
  't nagar': 15,
  'guindy': 10,
  'omr': 18,
  'tambaram': 12,
  'velachery': 14,
  'anna nagar': 20,
  'central': 22,
  'egmore': 20
};

const CHENNAI_FORMS = [
  'chennai', 'airport', 'tambaram', 'guindy', 'koyambedu', 'egmore', 'central',
  'pallavaram', 'velachery', 'porur', 'annanagar', 'anna nagar', 't nagar', 't. nagar',
  'sholinganallur', 'omr', 'ecr', 'perungudi', 'thiruvanmiyur', 'adyar', 'mylapore',
  'chromepet', 'medavakkam', 'madipakkam', 'alandur', 'vadapalani', 'ambattur', 'avadi'
];

const findKnownDistance = (origin, destination) => {
  const o = (origin || '').toLowerCase().trim();
  const d = (destination || '').toLowerCase().trim();
  if (!o || !d) return null;

  const isOChennai = CHENNAI_FORMS.some(k => o.includes(k));
  const isDChennai = CHENNAI_FORMS.some(k => d.includes(k));

  if (isOChennai || isDChennai) {
    const other = isOChennai ? d : o;
    for (const [city, km] of Object.entries(COMMON_DISTANCES_FROM_CHENNAI)) {
      if (other.includes(city)) {
        let duration;
        if (km <= 30) {
          duration = `~${Math.max(15, Math.round(km * 2.2))} mins`;
        } else {
          const hrs = (km / 45).toFixed(1).replace('.0', '');
          duration = `~${hrs} hrs drive`;
        }
        return {
          distance: km,
          duration
        };
      }
    }
  }

  const busRoute = tnBusFares.find(r =>
    (o.includes(r.source) && d.includes(r.destination)) ||
    (o.includes(r.destination) && d.includes(r.source))
  );
  if (busRoute) {
    const hrs = (busRoute.distanceKm / 45).toFixed(1).replace('.0', '');
    return {
      distance: busRoute.distanceKm,
      duration: `~${hrs} hrs drive`
    };
  }

  return null;
};

// 3. Outstation Pricing Engine (matching QuotationEngine / Outstation Cabs)
const calculateOutstationAirportFare = (distKm, selectedVeh, locText = '') => {
  const vData = vehicles[selectedVeh] || vehicles['Swift Dzire'];
  const rate = vData.one_way_rate || 16;
  const bata = vData.driver_bata || 400;
  const minDropKm = vData.min_drop_km || (selectedVeh.includes('Tempo') ? 250 : 130);
  const effKm = distKm && distKm > 0 ? distKm : minDropKm;
  const isOutstation = effKm >= 50;

  let chargeableKm, kmCost, driverBata, totalFare, advanceToPay, balanceToPay;

  if (isOutstation) {
    chargeableKm = Math.max(minDropKm, effKm);
    kmCost = chargeableKm * rate;
    driverBata = bata;
    totalFare = Math.round((kmCost + driverBata) / 10) * 10;
    advanceToPay = 500;
    balanceToPay = Math.max(0, totalFare - advanceToPay);
  } else {
    chargeableKm = effKm;
    kmCost = Math.round((chargeableKm * rate) / 10) * 10;
    driverBata = 0;
    totalFare = kmCost;
    advanceToPay = 500;
    balanceToPay = Math.max(0, totalFare - advanceToPay);
  }

  const extras = estimateAirportRoadExtras(locText, effKm, isOutstation);

  return {
    actual_km: effKm,
    chargeable_km: chargeableKm,
    rate_per_km: rate,
    km_cost: kmCost,
    driver_bata: driverBata,
    total_fare: totalFare,
    advance_to_pay: advanceToPay,
    balance_to_pay: balanceToPay,
    is_outstation: isOutstation,
    state_name: extras.stateName,
    state_permit_est: extras.statePermitEst,
    tolls_est: extras.tollsEst
  };
};

const getMinDateTime = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
};

const getDefaultDateTime = () => {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
};

export default function AirportBookingEngine({
  showHeader = true,
  enableStickyBar = false,
  isOperatorMode = false,
  operatorCallerPhone = '',
  operatorCallerName = '',
  onQuoteCalculated = null
}) {
  // 1. Primary Toggles & 2. Default Direction (Airport Pickup as Default)
  const [direction, setDirection] = useState('pickup'); // 'pickup' | 'drop'
  const [pickup, setPickup] = useState(AIRPORT_HUB);
  const [drop, setDrop] = useState('');

  // 4. Date Inputs (Single DateTime + Flight Landing/Departure Time)
  const [dateTime, setDateTime] = useState(getDefaultDateTime);
  const [flightDetails, setFlightDetails] = useState('');
  const [guestName, setGuestName] = useState(() => operatorCallerName || '');
  const [guestPhone, setGuestPhone] = useState(() => operatorCallerPhone || '');

  // Passengers & Vehicle
  const [passengers, setPassengers] = useState('4');
  const [vehicle, setVehicle] = useState('Swift Dzire');

  // Calculation & Results
  const [distanceKm, setDistanceKm] = useState(0);
  const [duration, setDuration] = useState('');
  const [estimate, setEstimate] = useState(0);
  const [breakdown, setBreakdown] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UI state
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [quoteRefId, setQuoteRefId] = useState('#QT-101');

  const destInputRef = useRef(null);
  const cardRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    setQuoteRefId(peekNextQuotationId());
  }, []);

  useEffect(() => {
    if (showResult && distanceKm > 0) {
      const userLoc = (direction === 'pickup' ? drop : pickup).trim();
      const b = calculateOutstationAirportFare(distanceKm, vehicle, userLoc);
      setBreakdown(b);
      setEstimate(b.total_fare);
    }
  }, [vehicle]);

  const handlePassengerChange = (newVal) => {
    setPassengers(newVal);
    const pCount = parseInt(newVal, 10);
    const currentCap = VEHICLE_CAPACITY[vehicle] ?? 4;
    if (currentCap < pCount) {
      const nextVeh = vehicleOptions.find(v => (VEHICLE_CAPACITY[v] ?? 0) >= pCount);
      if (nextVeh) setVehicle(nextVeh);
    }
    setShowResult(false);
  };

  const handleDirectionChange = (newDir) => {
    if (newDir === direction) return;
    setDirection(newDir);
    setShowResult(false);
    setError('');

    if (newDir === 'pickup') {
      const userLoc = pickup === AIRPORT_HUB ? '' : pickup;
      setPickup(AIRPORT_HUB);
      setDrop(userLoc);
      if (userLoc) resolveTripDistance(userLoc, 'pickup');
    } else {
      const userLoc = drop === AIRPORT_HUB ? '' : drop;
      setPickup(userLoc);
      setDrop(AIRPORT_HUB);
      if (userLoc) resolveTripDistance(userLoc, 'drop');
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('airport-direction-change', { detail: { direction: newDir } }));
    }
  };

  const resolveTripDistance = (addr, dir = direction) => {
    const clean = (addr || '').trim();
    if (!clean || clean === AIRPORT_HUB) return;

    const known = findKnownDistance(AIRPORT_HUB, clean);
    if (known) {
      setDistanceKm(known.distance);
      setDuration(known.duration);
      return;
    }

    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.DistanceMatrixService) {
      try {
        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [dir === 'pickup' ? AIRPORT_HUB : clean],
            destinations: [dir === 'pickup' ? clean : AIRPORT_HUB],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            if (status === 'OK' && response && response.rows && response.rows[0] && response.rows[0].elements && response.rows[0].elements[0] && response.rows[0].elements[0].status === 'OK') {
              const el = response.rows[0].elements[0];
              const dist = Math.round((el.distance.value / 1000) * 10) / 10;
              setDistanceKm(dist);
              setDuration(el.duration.text);
            }
          }
        );
      } catch (_) {}
    }
  };

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      loadGoogleMaps().then(() => {
        if (!isMounted || !destInputRef.current || !window.google || !window.google.maps || !window.google.maps.places) return;
        const ac = new window.google.maps.places.Autocomplete(destInputRef.current, {
          componentRestrictions: { country: 'in' },
          fields: ['name', 'formatted_address', 'geometry'],
        });

        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const addr = place.formatted_address || place.name;
          if (!addr) return;

          if (direction === 'pickup') {
            setDrop(addr);
          } else {
            setPickup(addr);
          }
          setShowResult(false);
          setError('');

          const known = findKnownDistance(AIRPORT_HUB, addr);
          if (known) {
            setDistanceKm(known.distance);
            setDuration(known.duration);
            return;
          }

          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const rad = x => (x * Math.PI) / 180;
            const R = 6371;
            const dLat = rad(lat - 12.9941);
            const dLng = rad(lng - 80.1709);
            const a = Math.sin(dLat/2)**2 + Math.cos(rad(12.9941))*Math.cos(rad(lat))*Math.sin(dLng/2)**2;
            const roadKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.35);
            setDistanceKm(roadKm);
            if (roadKm <= 45) {
              setDuration('~' + Math.max(15, Math.round(roadKm * 2)) + ' mins');
            } else {
              const hrs = Math.max(1, Math.round((roadKm / 55) * 10) / 10);
              setDuration('~' + Math.round(hrs) + ' hrs drive');
            }
          }

          resolveTripDistance(addr);
        });
      }).catch(() => {});
    }, 50);

    return () => { isMounted = false; clearTimeout(timer); };
  }, [direction]);

  useEffect(() => {
    const onSetVehicle = (e) => {
      const v = e.detail && e.detail.vehicle;
      if (v && vehicles[v]) {
        setVehicle(v);
        setShowResult(false);
      }
    };

    const onSetLocation = (e) => {
      const loc = e.detail && e.detail.location;
      const targetVehicle = e.detail && e.detail.vehicle;
      const autoCalc = e.detail && e.detail.autoCalculate !== false;
      const targetPax = e.detail && e.detail.passengers;
      const fixedFare = e.detail && e.detail.fixedFare;
      const explicitKm = e.detail && e.detail.distanceKm;
      const explicitDuration = e.detail && e.detail.duration;

      if (targetVehicle && vehicles[targetVehicle]) {
        setVehicle(targetVehicle);
      }
      if (targetPax) {
        setPassengers(String(targetPax));
      } else if (targetVehicle && VEHICLE_CAPACITY[targetVehicle]) {
        setPassengers(String(VEHICLE_CAPACITY[targetVehicle]));
      }
      if (explicitKm) {
        setDistanceKm(typeof explicitKm === 'number' ? explicitKm : parseInt(explicitKm, 10));
      }
      if (explicitDuration) {
        setDuration(explicitDuration);
      }
      if (loc) {
        if (direction === 'pickup') {
          setDrop(loc);
          setPickup(AIRPORT_HUB);
        } else {
          setPickup(loc);
          setDrop(AIRPORT_HUB);
        }
        setShowResult(false);
        setError('');
        if (!explicitKm) {
          resolveTripDistance(loc);
        }
        if (autoCalc) {
          setTimeout(() => {
            handleCalculateCost(loc, targetVehicle, fixedFare, explicitKm, explicitDuration);
          }, 100);
        }
      }
    };

    window.addEventListener('airport-set-vehicle', onSetVehicle);
    window.addEventListener('airport-set-location', onSetLocation);
    return () => {
      window.removeEventListener('airport-set-vehicle', onSetVehicle);
      window.removeEventListener('airport-set-location', onSetLocation);
    };
  }, [direction, pickup, drop, vehicle, distanceKm]);

  useEffect(() => {
    if (!enableStickyBar || !cardRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        const isPast = e.boundingClientRect.top < 0 && !e.isIntersecting;
        setShowStickyBar(isPast);
      },
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' }
    );
    obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, [enableStickyBar]);

  const scrollToResult = () => {
    setTimeout(() => {
      if (!resultRef.current || typeof window === 'undefined') return;
      resultRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 120);
  };

  const handleCalculateCost = (overrideLoc, overrideVehicle, overrideFare, overrideKm, overrideDuration) => {
    const userLoc = (overrideLoc || (direction === 'pickup' ? drop : pickup)).trim();
    const activeVeh = overrideVehicle || vehicle;

    if (!userLoc || userLoc === AIRPORT_HUB) {
      setError(direction === 'pickup'
        ? 'Please enter your drop location / hotel in Chennai or Outstation'
        : 'Please enter your pickup doorstep / area in Chennai or Outstation');
      if (destInputRef.current) destInputRef.current.focus();
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      let effKm = overrideKm || distanceKm;
      const known = findKnownDistance(AIRPORT_HUB, userLoc);
      if (overrideKm) {
        effKm = typeof overrideKm === 'number' ? overrideKm : parseInt(overrideKm, 10);
        setDistanceKm(effKm);
      } else if (known) {
        effKm = known.distance;
        setDistanceKm(known.distance);
        setDuration(known.duration);
      } else if (!effKm) {
        effKm = 130;
        setDistanceKm(130);
        setDuration('~2.5 hrs driving');
      }

      if (overrideDuration) {
        setDuration(overrideDuration);
      }

      let result;
      if (overrideFare && typeof overrideFare === 'number' && overrideFare > 0) {
        const vData = vehicles[activeVeh] || vehicles['Swift Dzire'];
        const bata = vData.driver_bata || 400;
        const advanceToPay = 500;
        const kmCost = Math.max(0, overrideFare - bata);
        const extras = estimateAirportRoadExtras(userLoc, effKm, true);
        result = {
          actual_km: effKm,
          chargeable_km: effKm,
          rate_per_km: vData.one_way_rate || 16,
          km_cost: kmCost,
          driver_bata: bata,
          total_fare: overrideFare,
          advance_to_pay: advanceToPay,
          balance_to_pay: Math.max(0, overrideFare - advanceToPay),
          is_outstation: true,
          state_name: extras.stateName,
          state_permit_est: extras.statePermitEst,
          tolls_est: extras.tollsEst
        };
      } else {
        result = calculateOutstationAirportFare(effKm, activeVeh, userLoc);
      }

      const generatedQuoteRef = getNextQuotationId();
      setQuoteRefId(generatedQuoteRef);
      setBreakdown(result);
      setEstimate(result.total_fare);
      setLoading(false);
      setShowResult(true);
      scrollToResult();

      const calcData = {
        quoteRefId: generatedQuoteRef,
        serviceTitle: `Chennai Airport Taxi (${direction === 'pickup' ? 'MAA Arrival Pickup' : 'MAA Departure Drop'})`,
        activeTab: 'airport',
        pickup: direction === 'pickup' ? AIRPORT_HUB : userLoc,
        destination: direction === 'pickup' ? userLoc : AIRPORT_HUB,
        pickupDateTime: dateTime,
        returnDateTime: '',
        durationDays: 1,
        vehicleName: activeVeh,
        passengers,
        distanceKm: result.actual_km,
        totalFare: result.total_fare,
        formattedFare: `₹${result.total_fare.toLocaleString('en-IN')}`,
        flightDetails: flightDetails || '',
        timestamp: Date.now()
      };
      window.__KT_CURRENT_CALCULATION = calcData;
      window.dispatchEvent(new CustomEvent('kt_calculation_updated', { detail: calcData }));
      onQuoteCalculated?.(calcData);

      trackCalculatorQuote({
        calculatorId: 'airport_taxi',
        calculatorEngine: 'Chennai Airport Taxi Outstation Engine',
        tripType: direction === 'pickup' ? 'Airport Pickup (MAA Arrival)' : 'Airport Drop (MAA Departure)',
        pickup: direction === 'pickup' ? AIRPORT_HUB : userLoc,
        drop: direction === 'pickup' ? userLoc : AIRPORT_HUB,
        vehicle: activeVeh,
        distanceKm: result.actual_km,
        estimatedFare: result.total_fare,
        meta: {
          quoteRefId: generatedQuoteRef,
          direction,
          isOutstation: result.is_outstation,
          flightDetails: flightDetails || undefined,
          chargeableKm: result.chargeable_km,
          ratePerKm: result.rate_per_km,
          driverBata: result.driver_bata
        }
      });
    }, 250);
  };

  const handleWhatsAppBooking = () => {
    const isPickup = direction === 'pickup';

    const cleanGuestPhone = (guestPhone || '').replace(/[^0-9]/g, '').slice(-10);
    const guestLabel = (guestName || '').trim() || (cleanGuestPhone ? `Customer (${cleanGuestPhone})` : 'Airport Visitor');
    const sourceWithPhone = cleanGuestPhone
      ? `/services/chennai-airport-taxi/ (+91 ${cleanGuestPhone})`
      : '/services/chennai-airport-taxi/';

    markQuoteConverted(quoteRefId, {
      quoteId: quoteRefId,
      guestName: guestLabel,
      phone: cleanGuestPhone ? `+91 ${cleanGuestPhone}` : '',
      sourcePage: sourceWithPhone,
      calculatorEngine: 'Chennai Airport Taxi Engine',
      calculatorId: 'airport_taxi',
      tripType: isPickup ? 'Airport Pickup (MAA Arrival)' : 'Airport Drop (MAA Departure)',
      pickup,
      drop,
      vehicle,
      estimatedFare: estimate,
      distanceKm: breakdown ? breakdown.actual_km : distanceKm,
      travelDate: dateTime ? dateTime.replace('T', ' ') : '',
      status: 'WhatsApp Clicked'
    });

    trackEvent('booking_conversion_whatsapp', {
      engine: 'airport_booking_engine',
      trip_type: isPickup ? 'Airport Pickup' : 'Airport Drop',
      vehicle,
      fare: estimate,
      quote_id: quoteRefId
    });

    // 1. Post to internal /api/record-calculation
    try {
      fetch('/api/record-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quoteRefId,
          timestamp: new Date().toLocaleString('en-IN'),
          guestName: guestLabel,
          phone: cleanGuestPhone ? `+91 ${cleanGuestPhone}` : '',
          sourcePage: sourceWithPhone,
          calculatorEngine: 'Chennai Airport Taxi Engine',
          tripType: isPickup ? 'Airport Pickup' : 'Airport Drop',
          pickup,
          drop,
          vehicle,
          estimatedFare: estimate,
          distanceKm: breakdown ? `${breakdown.actual_km} km` : `${distanceKm} km`,
          status: 'WhatsApp Clicked',
          metadata: flightDetails ? `Flight: ${flightDetails}` : ''
        })
      }).catch(() => {});
    } catch (_) {}

    // 2. Post to Google Sheet Webhook if configured
    const activeSheetUrl = getActiveGoogleSheetUrl();
    if (activeSheetUrl && activeSheetUrl.startsWith('http')) {
      try {
        fetch(activeSheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'calculator_activity',
            date: new Date().toLocaleString('en-IN'),
            quoteId: quoteRefId,
            tripType: isPickup ? 'Airport Pickup' : 'Airport Drop',
            guestName: guestLabel,
            phone: cleanGuestPhone ? `+91 ${cleanGuestPhone}` : '',
            pickup,
            drop,
            vehicle,
            passengers,
            distance: breakdown ? breakdown.actual_km : distanceKm,
            estimate,
            travelDate: dateTime,
            flightDetails,
            isOutstation: breakdown ? breakdown.is_outstation : true,
            sourcePage: sourceWithPhone,
            status: 'WhatsApp Clicked'
          })
        }).catch(() => {});
      } catch (_) {}
    }

    const customerLine = (guestName.trim() || cleanGuestPhone)
      ? ('• Customer: ' + (guestName.trim() || 'Customer') + (cleanGuestPhone ? ' (+91 ' + cleanGuestPhone + ')' : ''))
      : null;

    const msg = [
      '*Kalidass Travels — Chennai Airport Taxi Transfer*',
      '📌 *Quote Ref:* ' + quoteRefId + ' (24-Hr Rate Lock)',
      customerLine,
      '• Transfer Type: ' + (isPickup ? 'Airport Pickup (MAA Arrival)' : 'Airport Drop (MAA Departure)'),
      '• From: ' + pickup,
      '• To: ' + drop,
      flightDetails ? ('• Flight No / Time: ' + flightDetails) : null,
      '• Pickup Date & Time: ' + dateTime.replace('T', ' '),
      '• Vehicle: ' + vehicle + ' (' + passengers + ' Pax)',
      '• Distance: ~' + (breakdown ? breakdown.actual_km : distanceKm) + ' km (' + (duration || 'Direct Highway') + ')',
      '• Total Fare: ₹' + estimate.toLocaleString('en-IN') + ' + Extra',
      '• State Permit: ' + ((breakdown && breakdown.is_outstation && breakdown.state_permit_est > 0) ? ('₹' + breakdown.state_permit_est.toLocaleString('en-IN')) : '₹0'),
      '• Tolls & Parking: Extra',
      '• Advance to Pay: -₹' + (breakdown ? breakdown.advance_to_pay : 500),
      '• Balance to Pay Driver (After trip): ₹' + (breakdown ? breakdown.balance_to_pay : Math.max(0, estimate - 500)) + ' + Extra',
      '• Payment Terms: ₹500 Advance to Confirm (Deducted from Fare) • Balance after trip',
      '',
      'Please save my quote & confirm live cab availability.',
      (() => {
        const { pickupPin, directions } = buildMapsLinks(pickup, drop, 'oneway');
        return (pickupPin || directions)
          ? '\n🗺️ NAVIGATION LINKS:\n' +
            (pickupPin  ? '• 📍 Pickup Pin: ' + pickupPin + '\n'  : '') +
            (directions ? '• 🧭 Route Map: ' + directions          : '')
          : null;
      })()
    ].filter(Boolean).join('\n');

    const cleanTargetPhone = isOperatorMode && operatorCallerPhone ? operatorCallerPhone.replace(/[^0-9]/g, '').slice(-10) : '';
    if (cleanTargetPhone.length === 10) {
      window.open('https://wa.me/91' + cleanTargetPhone + '?text=' + encodeURIComponent(msg), '_blank');
    } else {
      window.open('https://wa.me/918939539211?text=' + encodeURIComponent(msg), '_blank');
    }
  };

  const handlePinClick = () => {
    loadGoogleMaps().catch(() => {});
    setLocationPickerOpen(true);
  };

  const handleLocationConfirm = (address) => {
    const clean = address ? address.trim() : '';
    if (direction === 'pickup') {
      setDrop(clean);
    } else {
      setPickup(clean);
    }
    setLocationPickerOpen(false);
    setError('');
    setShowResult(false);
    if (clean) resolveTripDistance(clean);
  };

  const inputWrap  = 'relative flex items-center bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px] focus-within:ring-2 focus-within:ring-[#1a73e8] focus-within:border-[#1a73e8] transition-all';
  const inputField = 'bg-transparent w-full outline-none text-sm font-semibold text-slate-800 pr-16 placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal';
  const labelCls   = 'block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1';

  return (
    <>
      {enableStickyBar && (
        <div
          role="banner"
          aria-label="Booking summary"
          className={'fixed top-0 left-0 right-0 z-[100] transition-transform duration-300 ease-in-out ' + (showStickyBar ? 'translate-y-0' : '-translate-y-full')}
        >
          <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-2">
              <span className={'shrink-0 text-xs font-extrabold px-2.5 py-1 rounded-full border ' + (direction === 'pickup' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200')}>
                ✈ {direction === 'pickup' ? 'PICKUP' : 'DROP'}
              </span>
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 truncate">{direction === 'pickup' ? 'MAA Airport' : (pickup.split(',')[0] || 'Pickup')}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">{direction === 'pickup' ? (drop.split(',')[0] || 'Drop') : 'MAA Airport'}</span>
              </div>
              <button
                type="button"
                onClick={() => { if (cardRef.current) cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
                className="shrink-0 text-xs font-bold text-[#1a73e8] hover:underline"
              >
                View Fare
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Booking Card (QuotationEngine Inspired Material 3 Design) */}
      <div
        ref={cardRef}
        id="airport-fare-finder"
        data-testid="airport-fare-finder"
        className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden font-sans"
      >
        {showHeader && (
          <div className="p-4 pb-1 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1a73e8] flex items-center justify-center mx-auto mb-2">
              <Plane className="w-5 h-5 text-[#1a73e8]" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">Chennai Airport Taxi &amp; Cab Booking</h3>
            <p className="text-xs text-slate-500 mt-0.5">Transparent Fares • Free Flight Delay Waiting • Pay at Drop</p>
          </div>
        )}

        {/* 1. Primary Toggles: Airport Pickup (FIRST/LEFT) & Airport Drop (SECOND/RIGHT) */}
        <div className="px-3 sm:px-5 pt-3 pb-2">
          <div role="tablist" aria-label="Transfer Direction" className="bg-slate-100 p-1 rounded-full flex gap-1 border border-slate-200">
            <button
              type="button"
              role="tab"
              data-testid="tab-pickup"
              aria-selected={direction === 'pickup'}
              onClick={() => handleDirectionChange('pickup')}
              className={'flex-1 py-2 px-3 text-xs font-bold rounded-full transition-all min-h-[38px] cursor-pointer active:scale-[0.98] inline-flex items-center justify-center gap-1.5 ' + (
                direction === 'pickup'
                  ? 'bg-[#1a73e8] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              )}
            >
              <Plane className="w-3.5 h-3.5 shrink-0" />
              <span>Airport Pickup</span>
            </button>

            <button
              type="button"
              role="tab"
              data-testid="tab-drop"
              aria-selected={direction === 'drop'}
              onClick={() => handleDirectionChange('drop')}
              className={'flex-1 py-2 px-3 text-xs font-bold rounded-full transition-all min-h-[38px] cursor-pointer active:scale-[0.98] inline-flex items-center justify-center gap-1.5 ' + (
                direction === 'drop'
                  ? 'bg-[#1a73e8] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              )}
            >
              <Plane className="w-3.5 h-3.5 shrink-0 rotate-45" />
              <span>Airport Drop</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={e => { e.preventDefault(); handleCalculateCost(); }} className="px-3 sm:px-5 pb-4 space-y-3">
          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 2. Direction Fields: From (Pickup) & To (Drop) */}
          {/* FROM FIELD */}
          <div>
            <label htmlFor="airport-from-input" className={labelCls}>
              {direction === 'pickup' ? 'From (Airport Pickup Hub)' : 'From (Your Doorstep / Area)'}
            </label>
            <div className={inputWrap}>
              <input
                id="airport-from-input"
                data-testid="airport-from-input"
                data-autocomplete-input="true"
                ref={direction === 'drop' ? destInputRef : null}
                type="text"
                value={pickup}
                readOnly={direction === 'pickup'}
                onChange={e => {
                  if (direction === 'drop') {
                    setPickup(e.target.value);
                    setShowResult(false);
                    setError('');
                  }
                }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCalculateCost(); } }}
                placeholder={direction === 'pickup' ? AIRPORT_HUB : 'Enter your area / doorstep address'}
                className={inputField + ' scroll-mt-20 sm:scroll-mt-24' + (direction === 'pickup' ? ' cursor-default text-[#1a73e8] font-bold' : '')}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {direction === 'drop' && pickup && (
                  <button
                    type="button"
                    onClick={() => { setPickup(''); setShowResult(false); }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded-full text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {direction === 'drop' && (
                  <button
                    type="button"
                    onClick={handlePinClick}
                    className="w-7 h-7 flex items-center justify-center hover:bg-blue-50 rounded text-[#1a73e8] transition-colors cursor-pointer"
                    title="Pinpoint on map"
                    aria-label="Pinpoint on map"
                  >
                    <MapPin className="w-4 h-4 text-[#1a73e8]" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* TO FIELD */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="airport-to-input" className={labelCls}>
                {direction === 'pickup' ? 'To (Your Destination / Hotel / City)' : 'To (Airport Drop)'}
              </label>
              {distanceKm > 0 && (
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  ~{distanceKm} km · {duration || 'Direct Route'}
                </span>
              )}
            </div>
            <div className={inputWrap}>
              <input
                id="airport-to-input"
                data-testid="airport-to-input"
                data-autocomplete-input="true"
                ref={direction === 'pickup' ? destInputRef : null}
                type="text"
                value={drop}
                readOnly={direction === 'drop'}
                onChange={e => {
                  if (direction === 'pickup') {
                    setDrop(e.target.value);
                    setShowResult(false);
                    setError('');
                  }
                }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCalculateCost(); } }}
                placeholder={direction === 'drop' ? AIRPORT_HUB : 'Enter hotel / area / destination city'}
                className={inputField + ' scroll-mt-20 sm:scroll-mt-24' + (direction === 'drop' ? ' cursor-default text-[#1a73e8] font-bold' : '')}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {direction === 'pickup' && drop && (
                  <button
                    type="button"
                    onClick={() => { setDrop(''); setShowResult(false); }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 rounded-full text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {direction === 'pickup' && (
                  <button
                    type="button"
                    onClick={handlePinClick}
                    className="w-7 h-7 flex items-center justify-center hover:bg-blue-50 rounded text-[#1a73e8] transition-colors cursor-pointer"
                    title="Pinpoint on map"
                    aria-label="Pinpoint on map"
                  >
                    <MapPin className="w-4 h-4 text-[#1a73e8]" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. Date Inputs: Single DateTime + Flight Landing/Departure Time in Same Row */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Pickup Date & Time */}
            <div className="min-w-0 group relative rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-300 focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
              <div className="flex items-center justify-between gap-1 mb-1">
                <label 
                  htmlFor="airport-pickup-datetime" 
                  className="text-xs font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer truncate min-w-0"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                  <span className="truncate">Pickup Date &amp; Time</span>
                </label>
              </div>
              <input
                id="airport-pickup-datetime"
                type="datetime-local"
                value={dateTime}
                min={getMinDateTime()}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full min-w-0 bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none cursor-pointer p-0"
              />
            </div>

            {/* Flight Landing Time / Flight Number */}
            <div className="min-w-0 group relative rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-300 focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
              <div className="flex items-center justify-between gap-1 mb-1">
                <label 
                  htmlFor="airport-flight-details" 
                  className="text-xs font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer truncate min-w-0"
                >
                  <Plane className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                  <span className="truncate">
                    <span className="hidden sm:inline">{direction === 'pickup' ? 'Flight Landing Time / No.' : 'Flight Departure Time / No.'}</span>
                    <span className="sm:hidden">{direction === 'pickup' ? 'Flight No. / Time' : 'Flight No. / Time'}</span>
                  </span>
                </label>
                <span className="text-xs font-bold text-[#0b57d0] bg-[#1a73e8]/10 px-2 py-0.5 rounded-full shrink-0">
                  <span className="hidden min-[380px]:inline">Live </span>Radar
                </span>
              </div>
              <input
                id="airport-flight-details"
                type="text"
                value={flightDetails}
                onChange={(e) => setFlightDetails(e.target.value)}
                placeholder={direction === 'pickup' ? 'e.g. 6E-241 @ 14:30' : 'e.g. AI-428 @ 18:00'}
                className="w-full min-w-0 bg-transparent text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal outline-none p-0"
              />
            </div>
          </div>

          {/* Primary View Instant Fare Button */}
          <div className="pt-1.5 flex flex-col items-center justify-center">
            <button
              id="get-flat-fare-btn"
              data-testid="get-flat-fare-btn"
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[42px] bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-75"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Calculating Fare...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 text-white" />
                  <span>View Instant Fare</span>
                </>
              )}
            </button>
            <div className="text-xs text-slate-500 font-medium text-center mt-1">
              No phone number required to check fare
            </div>
          </div>

          {/* 6. Inline Result Card Breakdown (Directly below button, matching Outstation Cabs screenshot!) */}
          {showResult && breakdown && (
            <div
              id="airport-fare-result-card"
              data-testid="airport-fare-result-card"
              ref={resultRef}
              className="mt-3 p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-100 shadow-xs space-y-3 animate-in fade-in duration-200"
            >
              {/* Backward-compatibility alias for test assertions */}
              <div id="airport-booking-modal" className="sr-only">
                {vehicle} {direction === 'pickup' ? drop : pickup} ₹{estimate}
              </div>

              {/* Official Quote Ref & 24-Hr Price Lock Header */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0b57d0] bg-[#1a73e8]/10 px-2.5 py-0.5 rounded-full">
                  <span>Official Quote Ref: {quoteRefId}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Rate Locked 24 Hrs • Send to WhatsApp to Save</span>
                </span>
              </div>

              {/* Header: Vehicle Name, Pax & Total Fare */}
              <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-base font-extrabold text-slate-900">
                      {vehicle}
                    </span>
                    <span className="text-xs font-bold bg-[#1a73e8]/10 text-[#0b57d0] px-2 py-0.5 rounded-full">
                      {passengers} Pax
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    ~{breakdown.actual_km} km {direction === 'pickup' ? 'Airport Pickup' : 'Airport Drop'} · {duration || ('~' + Math.max(1, Math.round(breakdown.actual_km / 50)) + ' hrs driving')}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500 font-medium">Total Fare</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading leading-tight">
                    ₹{estimate.toLocaleString('en-IN')}<span className="text-xs sm:text-sm font-semibold text-slate-500 ml-1">+ Extra</span>
                  </div>
                </div>
              </div>

              {/* 1-Tap Vehicle Price Comparison Strip */}
              <div className="pb-2 border-b border-slate-200/80">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Select Vehicle (1-Tap Instant Comparison):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {AIRPORT_COMPARISON_VEHICLES.map((item) => {
                    const cap = VEHICLE_CAPACITY[item.key] ?? 4;
                    const isSelected = vehicle === item.key;
                    const userLoc = (direction === 'pickup' ? drop : pickup).trim();
                    const cmpFareObj = calculateOutstationAirportFare(breakdown.actual_km || distanceKm || 130, item.key, userLoc);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setVehicle(item.key);
                          setPassengers(String(cap));
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-blue-50/90 border-[#1a73e8] ring-2 ring-[#1a73e8]/30 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#0b57d0]' : 'text-slate-800'}`}>
                            {item.shortLabel}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                          {cap} Pax
                        </div>
                        <div className={`text-xs sm:text-sm font-extrabold mt-1 ${isSelected ? 'text-[#0b57d0]' : 'text-slate-900'}`}>
                          ₹{cmpFareObj.total_fare.toLocaleString('en-IN')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Itemized Bill Lines */}
              <div className="space-y-1.5 text-[13px] sm:text-sm">
                <div className="flex justify-between items-center py-0.5 text-slate-700">
                  <span>Cab Hire ({breakdown?.chargeable_km && breakdown?.rate_per_km ? `${Math.round(breakdown.chargeable_km)} km @ ₹${breakdown.rate_per_km}/km` : `${vehicle} • Fuel included`}):</span>
                  <span className="font-bold text-slate-900">₹{breakdown.km_cost.toLocaleString('en-IN')}</span>
                </div>
                {breakdown.driver_bata > 0 && (
                  <div className="flex justify-between items-center py-0.5 text-slate-700">
                    <span>Driver Allowance (1 Day):</span>
                    <span className="font-bold text-slate-900">₹{breakdown.driver_bata.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-0.5 text-slate-700">
                  <span>State Permit:</span>
                  <span className="font-bold text-slate-900">
                    {breakdown.is_outstation && breakdown.state_permit_est > 0
                      ? `₹${breakdown.state_permit_est.toLocaleString('en-IN')}`
                      : '₹0'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 text-slate-700">
                  <span>Tolls:</span>
                  <span className="font-bold text-slate-900">Extra</span>
                </div>
                <div className="flex justify-between items-center py-0.5 text-slate-700">
                  <span>Parking:</span>
                  <span className="font-bold text-slate-900">Extra</span>
                </div>
              </div>

              {/* Bill Payment Split */}
              <div className="pt-2 border-t-2 border-slate-200 space-y-1 text-[13px] sm:text-sm">
                <div className="flex justify-between items-center py-0.5 text-slate-700">
                  <span>Total Fare:</span>
                  <span className="font-bold text-slate-900">
                    ₹{estimate.toLocaleString('en-IN')} + Extra
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 text-emerald-700 font-medium">
                  <span>Advance to Pay:</span>
                  <span className="font-bold">
                    -₹{(breakdown.advance_to_pay || 500).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-1.5 border-t border-slate-200/80 mb-0.5">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Balance to Pay Driver <span className="text-xs font-medium text-slate-500">(After trip)</span>:
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#1a73e8] tracking-tight font-heading shrink-0">
                    ₹{Math.max(0, estimate - (breakdown.advance_to_pay || 500)).toLocaleString('en-IN')} + Extra
                  </span>
                </div>
              </div>

              {/* Inclusions & Highlights */}
              <div className="pt-2.5 border-t border-dashed border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                  <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Included in Fare:</strong> Dedicated AC Cab, 100% Fuel &amp; Driver Allowance.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                  <span>
                    {direction === 'pickup'
                      ? 'Chauffeur allotted before take-off. Personalized name placard & free live flight tracking at arrival exit.'
                      : 'Guaranteed punctual doorstep arrival with verified commercial yellow-board chauffeur.'}
                  </span>
                </div>
              </div>

              {/* Optional Customer Contact for Faster Dispatch */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 space-y-1.5 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Your Name &amp; Mobile Number (Optional)</span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                    Faster Coordination
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your Name (e.g. Kumar)"
                    className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-m3-primary"
                  />
                  <input
                    type="tel"
                    maxLength={10}
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="10-Digit Mobile Number"
                    className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-m3-primary"
                  />
                </div>
              </div>

              {/* Action Buttons: WhatsApp & Call Desk */}
              <div className="pt-2 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    id="book-airport-whatsapp-btn"
                    onClick={handleWhatsAppBooking}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>Book on WhatsApp</span>
                  </button>

                  <a
                    href="tel:+918939539211"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
                  >
                    <Phone className="w-4 h-4 text-slate-600" />
                    <span>Call Desk</span>
                  </a>
                </div>
                <p className="text-xs text-slate-600 text-center font-medium">
                  ✓ Lock Rate 24 Hrs ({quoteRefId}) • ✓ Reserve Cab & Driver • ✓ Advance ₹500 Only After Confirmation
                </p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Location Picker Modal */}
      {locationPickerOpen && (
        <LocationPicker
          isOpen={locationPickerOpen}
          onClose={() => setLocationPickerOpen(false)}
          onConfirm={handleLocationConfirm}
          type={direction === 'pickup' ? 'drop' : 'pickup'}
          initialAddress={direction === 'pickup' ? drop : pickup}
        />
      )}
    </>
  );
}
