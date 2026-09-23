import React, { useState, useEffect, useRef } from 'react';
import { Car, MapPin, Calendar, Calculator, Send, ArrowRight, Repeat, Users, User, AlertCircle, Navigation, ShieldCheck, Clock, X, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import LocationPicker from './LocationPicker';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import siteContent from '../data/siteContent.json';

import tariffConfig from '../data/tariff_config.json';
import tnBusFares from '../data/tnBusFares.json';
import tripsData from '../data/trips.json';

const vehicles = tariffConfig.vehicles;
const vehicleOptions = Object.keys(vehicles);

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
  const isOChennai = o.includes('chennai') || o.includes('airport') || o.includes('central') || o.includes('tambaram') || o.includes('guindy') || o.includes('koyambedu') || o.includes('egmore');
  const isDChennai = d.includes('chennai') || d.includes('airport') || d.includes('central') || d.includes('tambaram') || d.includes('guindy') || d.includes('koyambedu') || d.includes('egmore');

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



export default function QuotationEngine({ currentLang = 'en', showAirportTab = true, showBookingButton = true, title = '', variant = "default" }) {
  const isTa = currentLang === 'ta';
  const labels = siteContent.ui_labels;
  const displayTitle = title || (isTa ? labels.book_your_ride_ta : labels.book_your_ride);

  const { scrollInputAboveKeyboard } = useVirtualKeyboard();

  const [activeTab, setActiveTab] = useState('oneway');
  const [localPackage, setLocalPackage] = useState('8hr80km');
  const [vehicle, setVehicle] = useState('Swift Dzire');
  const [passengers, setPassengers] = useState('4');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [estimate, setEstimate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(1);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  const [showFullBreakdown, setShowFullBreakdown] = useState(false);

  // Customer Details & Validation
  const [date, setDate] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [errors, setErrors] = useState({});
  const [botField, setBotField] = useState(''); // Honeypot
  const [gettingLocation, setGettingLocation] = useState(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [pickerField, setPickerField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [requestedDriver, setRequestedDriver] = useState('');
  const stableFormId = "booking-form-v1"; // Using stable ID for hydration safety

  useEffect(() => {
    setMounted(true);
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

  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const pickupValueRef = useRef('');
  const dropValueRef = useRef('');
  const autocompleteInitializedRef = useRef(false);

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

  // Handle passengers change
  useEffect(() => {
    const pax = parseInt(passengers);
    // Auto-set vehicle ONLY IF it hasn't been manually changed or if it's too small for pax
    if (pax <= 4) setVehicle('Swift Dzire');
    else if (pax <= 6) setVehicle('Innova');
    else if (pax <= 7) setVehicle('Innova Crysta');
    else setVehicle('Tempo Traveller');
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
      return;
    }

    const o = (pickup || pickupValueRef.current || '').trim();
    const d = (drop || dropValueRef.current || '').trim();

    if (!o || !d) {
      setErrors(prev => ({
        ...prev,
        global: isTa ? 'பிக்கப் மற்றும் டிராப் இடங்களை உள்ளிடவும்' : 'Please enter both Pickup and Drop locations'
      }));
      return;
    }

    calculateDistance(o, d);
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
    const isPickupValid = pickup.length > 0;
    const isDropValid = drop.length > 0;

    if (!isDateValid || !isPickupValid || !isDropValid) {
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
      travelDate: date
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
Date: ${date ? new Date(date).toLocaleString() : 'Not Specified'}
Distance: ${distance ? distance.toFixed(1) : 'N/A'} km ${activeTab === 'round' ? `(Round Trip: ${(distance * 2).toFixed(1)} km)` : ''}
Duration: ${duration || 'N/A'}
${activeTab === 'round' ? `Days: ${days}` : ''}
Est. Cost: Rs. ${estimate}

Inclusions: Fuel, Driver Bata (Incl. Food/Stay), GST
Exclusions: Tolls, Parking, State Permit (if any)

Please confirm availability.`;

    trackEvent('booking_conversion_whatsapp', {
      estimate,
      trip_type: activeTab,
      vehicle
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/916381939769?text=${encodedMessage}`, '_blank');
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
          <h3 className="text-lg sm:text-xl font-bold text-m3-on-surface font-heading">{displayTitle}</h3>
          {requestedDriver && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-m3-surface-container-high border border-m3-outline-variant rounded-m3-full px-3 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-m3-primary shrink-0" />
              <span className="text-xs font-bold text-m3-primary">Booking for: {requestedDriver}</span>
            </div>
          )}
        </div>

        <div className="px-3 sm:px-6 mb-3">
          <div role="tablist" aria-label={isTa ? 'பயண வகை' : 'Trip Type'} className="bg-m3-surface-container-high p-1 rounded-m3-full flex gap-1 overflow-x-auto whitespace-nowrap hide-scrollbar border border-m3-outline-variant">
            {['oneway', 'round', 'local'].map(tab => (
              (tab !== 'local' || showAirportTab) && (
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
              )
            ))}
          </div>
        </div>

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
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor={`${stableFormId}-${type.toLowerCase()}`}
                      className="block text-badge font-bold text-m3-on-surface-variant uppercase tracking-wide"
                    >
                      {type === 'Pickup' ? (isTa ? 'பிக்கப் இடம்' : 'Pickup Location') : (isTa ? 'டிராப் இடம்' : 'Drop Location')}
                    </label>
                    {type === 'Pickup' && (
                      <button
                        type="button"
                        onClick={() => getCurrentLocation('pickup')}
                        disabled={gettingLocation === 'pickup'}
                        className="inline-flex items-center gap-1 text-badge font-bold text-m3-primary hover:text-m3-on-surface transition-colors cursor-pointer py-0.5 px-1 rounded-m3-xs hover:bg-m3-primary-container/30"
                        title="Detect current location"
                      >
                        <Navigation className={`w-3 h-3 ${gettingLocation === 'pickup' ? 'animate-spin' : ''}`} />
                        <span>{gettingLocation === 'pickup' ? (isTa ? 'கண்டறிகிறது...' : 'Locating...') : (isTa ? 'என் இருப்பிடம்' : 'Use Current Location')}</span>
                      </button>
                    )}
                  </div>

                  <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-m3-md px-3 py-2 sm:py-2.5 min-h-[44px] sm:min-h-[48px] focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition-all">
                    {/* Visual Route Indicator: Traffic Green dot for Pickup (Start/Go), Brand Red square for Drop (Destination/Stop) */}
                    {type === 'Pickup' ? (
                      <span className="w-2.5 h-2.5 rounded-m3-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0 mr-2.5" title="Pickup Origin (Start)" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-m3-xs bg-logo-red ring-4 ring-logo-red/20 shrink-0 mr-2.5" title="Drop Destination (Stop)" />
                    )}

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
                          return next;
                        });
                      }}
                      placeholder={isTa ? 'நகரம் / பகுதியை உள்ளிடவும்' : `Enter ${type} City / Area`}
                      className="bg-transparent w-full outline-none text-sm font-semibold text-m3-on-surface pr-16 placeholder:text-m3-on-surface-variant placeholder:text-xs placeholder:font-normal"
                    />

                    {/* Right side controls: Clear Button + Map Picker Trigger */}
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
                        onClick={() => handlePinClick(type.toLowerCase())}
                        className="w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-sm transition-colors text-m3-on-surface-variant hover:text-m3-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary"
                        title="Pick location on map"
                        aria-label={`Pick ${type.toLowerCase()} location on map`}
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
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
                      {vehicleOptions.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Days Input if Round Trip */}
                {activeTab === 'round' && (
                  <div className="relative group col-span-2">
                    <label htmlFor={`${stableFormId}-days`} className="block text-badge font-bold text-m3-on-surface-variant uppercase tracking-wide mb-1">
                      {isTa ? 'பயண நாட்கள்' : 'Number of Days'}
                    </label>
                    <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-m3-md px-3 py-2 min-h-[44px] sm:min-h-[48px] focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary transition-all">
                      <Calendar className="text-m3-primary mr-2.5 w-4 h-4 shrink-0" aria-hidden="true" />
                      <input
                        id={`${stableFormId}-days`}
                        type="text"
                        inputMode="numeric"
                        value={days || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d+$/.test(val)) {
                            setDays(val === '' ? '' : parseInt(val));
                          }
                          setShowResult(false);
                        }}
                        onBlur={() => {
                          if (!days) setDays(1);
                        }}
                        placeholder="1"
                        className="bg-transparent w-full outline-none text-sm text-m3-on-surface font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleCalculateCost}
              className="w-full bg-m3-primary hover:bg-slate-900 text-m3-on-primary font-bold py-3 rounded-m3-full transition-all flex items-center justify-center gap-2 shadow-m3-1 hover:shadow-m3-2 text-sm sm:text-base min-h-[46px] sm:min-h-[50px] cursor-pointer active:scale-[0.98] disabled:opacity-75 border border-white/10 group"
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

            {/* Results Section */}
            {showResult && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                {(distance || activeTab === 'local') && (
                  <div className="bg-m3-surface-container-low p-3.5 rounded-m3-lg border border-m3-outline-variant space-y-2">
                    <div className="flex justify-between text-xs text-m3-on-surface-variant">
                      {activeTab === 'local' ? (
                        <>
                          <div><span className="block text-micro uppercase font-bold text-m3-on-surface-variant">{isTa ? 'பேக்கேஜ்' : 'Package'}</span><strong className="text-m3-on-surface">{localPackage === '8hr80km' ? '8 Hours / 80 Kms' : '12 Hours / 120 Kms'}</strong></div>
                          <div><span className="block text-micro uppercase font-bold text-m3-on-surface-variant">{isTa ? 'லிமிட்' : 'Limit'}</span><strong className="text-m3-on-surface">{isTa ? 'சென்னையினுள்' : 'Within City'}</strong></div>
                        </>
                      ) : (
                        <>
                          <div><span className="block text-micro uppercase font-bold text-m3-on-surface-variant">{isTa ? 'மொத்த தூரம்' : 'Total Distance'}</span><strong className="text-m3-on-surface">{activeTab === 'round' ? (distance * 2).toFixed(1) : distance.toFixed(1)} km</strong></div>
                          <div><span className="block text-micro uppercase font-bold text-m3-on-surface-variant">{isTa ? 'மதிப்பீட்டு நேரம்' : 'Est. Time'}</span><strong className="text-m3-on-surface">{activeTab === 'round' ? `${isTa ? 'சுமார்' : 'Approx.'} ${duration} (${isTa ? 'ஒரு வழி' : 'One Way'})` : duration}</strong></div>
                        </>
                      )}
                    </div>
                    <p className="text-micro text-m3-on-surface-variant font-medium italic">*{activeTab === 'local' ? (isTa ? 'கூடுதல் கி.மீ மற்றும் மணிநேரம் கூடுதல் சார்ஜ் உண்டு' : 'Extra Km and Hours will be charged extra.') : (isTa ? 'டோல் கட்டணம் மற்றும் பார்க்கிங் கட்டணம் கூடுதல்.' : 'Toll charges and parking fees are additional.')}</p>
                  </div>
                )}

                {estimate > 0 && (
                  <div className="bg-m3-surface-container-low rounded-m3-xl p-4 sm:p-5 border border-m3-outline-variant shadow-m3-1 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-m3-full bg-m3-surface-container-high border border-m3-outline-variant text-m3-on-surface text-[10px] font-bold uppercase tracking-wide mb-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-m3-primary" />
                          <span>{isTa ? 'வெளிப்படையான மதிப்பீடு' : 'Transparent Estimate'}</span>
                        </div>
                        <p className="text-3xl sm:text-4xl font-black text-m3-on-surface tracking-tight font-heading">
                          ₹ {estimate.toLocaleString('en-IN')}
                        </p>
                        <p className="text-micro text-m3-on-surface-variant font-medium mt-0.5">
                          {isTa ? 'டிரைவர் பேட்டா & ஜிஎஸ்டி சேர்க்கப்பட்டுள்ளது • மறைமுக கட்டணங்கள் இல்லை' : 'Incl. Driver Bata & Fuel • Zero Hidden Surcharges'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-m3-surface rounded-m3-md border border-m3-outline-variant text-xs font-bold text-m3-on-surface shadow-m3-1">
                          <span className="text-m3-on-surface-variant font-normal">{isTa ? 'கட்டணம்' : 'Rate'}:</span>
                          <span className="text-m3-on-surface font-black">₹{activeTab === 'round' ? vehicles[vehicle].round_trip_rate : vehicles[vehicle].one_way_rate}/km</span>
                        </div>
                        <div className="mt-1 text-micro text-m3-on-surface-variant font-semibold">
                          {vehicle}
                        </div>
                      </div>
                    </div>

                    {/* Prominent Transparent Breakdown Button */}
                    <button
                      type="button"
                      onClick={() => setShowFullBreakdown(true)}
                      className="w-full py-2.5 px-4 bg-m3-surface hover:bg-m3-surface-container-high text-m3-on-surface font-bold text-xs sm:text-sm rounded-m3-full border border-m3-outline-variant shadow-m3-1 flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <span className="inline-flex items-center gap-2 text-m3-on-surface font-bold">
                        <Calculator className="w-4 h-4 text-m3-primary" />
                        <span>{isTa ? 'கட்டண கணக்கீடு விவரம் (Detailed Breakdown)' : 'View Transparent Fare Breakdown'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-micro text-m3-on-surface-variant group-hover:text-m3-on-surface font-semibold">
                        <span>{isTa ? 'விவரம் பார்க்க' : 'See Itemized Math'}</span>
                        <ChevronRight className="w-4 h-4 text-m3-on-surface-variant transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>

                    {/* Transparency Badges */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {[
                        { icon: ShieldCheck, text: isTa ? 'சரிபார்க்கப்பட்ட ஓட்டுநர்கள்' : 'Verified Drivers' },
                        { icon: CheckCircle2, text: isTa ? 'மறைமுக கட்டணங்கள் இல்லை' : 'No Hidden Costs' },
                        { icon: Clock, text: isTa ? '24/7 ஆதரவு' : '24/7 Live Support' },
                        { icon: Navigation, text: isTa ? 'நேரத்திற்கு பிக்கப்' : 'On-Time Pickup' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-m3-md bg-m3-surface border border-m3-outline-variant/60">
                          <item.icon className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="text-[9px] font-bold uppercase tracking-tight text-m3-on-surface">{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Date/Time */}
                    <div className="relative group pt-1">
                      <label htmlFor={`${stableFormId}-date-result`} className="block text-xs font-bold text-m3-on-surface-variant uppercase mb-1.5">{isTa ? 'பயண தேதி' : 'Travel Date'}</label>
                      <div className="flex items-center bg-m3-surface border border-m3-outline-variant rounded-m3-md px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary">
                        <Calendar className="text-m3-on-surface-variant mr-2.5 w-4 h-4" aria-hidden="true" />
                        <input
                          id={`${stableFormId}-date-result`}
                          type="datetime-local"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="bg-transparent w-full outline-none text-xs sm:text-sm text-m3-on-surface font-medium cursor-pointer"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleWhatsApp}
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1EBE5D] text-white rounded-m3-full font-bold flex items-center justify-center gap-2.5 shadow-m3-2 hover:shadow-m3-3 transition-all active:scale-[0.98] cursor-pointer text-sm sm:text-base border border-emerald-400/40"
                    >
                      <WhatsAppIcon className="w-5 h-5" variant="two-tone" />
                      <span>{isTa ? 'வாட்ஸ்அப்பில் முன்பதிவு செய்ய' : 'Book on WhatsApp'}</span>
                    </button>
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
      <div className="flex border-b border-m3-outline-variant">
        {['oneway', 'round', 'local'].map(tab => (
          (tab !== 'local' || showAirportTab) && (
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
          )
        ))}
      </div>

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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor={`${stableFormId}-mobile-${type}`} className="text-xs font-bold text-m3-on-surface-variant uppercase tracking-wide block">
                  {isTa ? (type === 'Pickup' ? 'பிக்கப் இடம்' : 'டிராப் இடம்') : `${type} Location`}
                </label>
                {type === 'Pickup' && (
                  <button
                    type="button"
                    onClick={() => getCurrentLocation('pickup')}
                    disabled={gettingLocation === 'pickup'}
                    className="inline-flex items-center gap-1 text-badge font-bold text-m3-primary hover:text-m3-on-surface transition-colors cursor-pointer py-0.5 px-1 rounded-m3-xs hover:bg-m3-primary-container/30"
                    title="Use GPS location"
                  >
                    <Navigation className={`w-3 h-3 ${gettingLocation === 'pickup' ? 'animate-spin' : ''}`} />
                    <span>{gettingLocation === 'pickup' ? (isTa ? 'கண்டறிகிறது...' : 'Locating...') : (isTa ? 'இருப்பிடம்' : 'GPS Location')}</span>
                  </button>
                )}
              </div>

              <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-m3-md px-3 py-2 min-h-[44px] focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition">
                {/* Visual Route Indicator */}
                {type === 'Pickup' ? (
                  <span className="w-2.5 h-2.5 rounded-m3-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0 mr-2" title="Pickup Origin (Start)" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-m3-xs bg-logo-red ring-4 ring-logo-red/20 shrink-0 mr-2" title="Drop Destination (Stop)" />
                )}

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
                    onClick={() => handlePinClick(type.toLowerCase())}
                    className="w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-sm transition-colors text-m3-on-surface-variant hover:text-m3-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary"
                    title="Pick on map"
                    aria-label={`Pick ${type.toLowerCase()} location on map`}
                  >
                    <MapPin className="w-4 h-4" />
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
                {vehicleOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {activeTab === 'round' && (
            <div className="col-span-2">
              <label htmlFor={`${stableFormId}-mobile-days`} className="text-badge font-bold text-m3-on-surface-variant uppercase mb-1 block">
                {isTa ? 'நாட்கள்' : 'Days'}
              </label>
              <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-m3-md px-3 py-2 min-h-[44px] focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition">
                <Calendar className="text-m3-primary mr-2 w-4 h-4 shrink-0" />
                <input
                  id={`${stableFormId}-mobile-days`}
                  type="number"
                  min="1"
                  value={days}
                  onChange={(e) => { setDays(e.target.value); setShowResult(false); }}
                  className="w-full bg-transparent text-sm text-m3-on-surface font-semibold outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-3">
          {!showResult ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleCalculateCost}
              className="w-full bg-m3-primary hover:bg-slate-900 text-m3-on-primary font-bold py-3.5 rounded-m3-full transition-all flex items-center justify-center gap-2 shadow-m3-1 active:scale-[0.98] min-h-[52px] cursor-pointer disabled:opacity-75 border border-white/10 group"
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
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {distance && (
                <div className="bg-m3-surface-container-low p-3 rounded-m3-lg border border-m3-outline-variant space-y-2">
                  <div className="flex justify-between text-micro text-m3-on-surface-variant">
                    <div><span className="block text-[8px] uppercase font-bold text-m3-on-surface-variant">{isTa ? 'மொத்த தூரம்' : 'Total Distance'}</span><strong className="text-m3-on-surface">{activeTab === 'round' ? (distance * 2).toFixed(1) : distance.toFixed(1)} km</strong></div>
                    <div><span className="block text-[8px] uppercase font-bold text-m3-on-surface-variant">{isTa ? 'மதிப்பீட்டு நேரம்' : 'Est. Time'}</span><strong className="text-m3-on-surface">{duration}</strong></div>
                  </div>
                </div>
              )}

              <div className="bg-m3-surface-container-low rounded-m3-xl p-4 border border-m3-outline-variant shadow-m3-1 space-y-3.5">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-m3-full bg-m3-surface-container-high border border-m3-outline-variant text-m3-on-surface text-[10px] font-bold uppercase tracking-wide mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-m3-primary" />
                      <span>{isTa ? 'வெளிப்படையான மதிப்பீடு' : 'Transparent Estimate'}</span>
                    </div>
                    <p className="text-3xl font-black text-m3-on-surface tracking-tight font-heading">₹ {estimate > 0 ? estimate.toLocaleString('en-IN') : '0'}</p>
                    <p className="text-micro text-m3-on-surface-variant font-medium mt-0.5">
                      {isTa ? 'டிரைவர் பேட்டா & குறைந்தபட்ச கிமீ சேர்க்கப்பட்டுள்ளது' : 'Incl. Driver Bata & Fuel • Zero Hidden Surcharges'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-m3-surface rounded-m3-md border border-m3-outline-variant text-micro font-bold text-m3-on-surface shadow-m3-1">
                      <span className="text-m3-on-surface-variant font-normal">{isTa ? 'கட்டணம்' : 'Rate'}:</span>
                      <span className="text-m3-on-surface font-black">₹{activeTab === 'round' ? vehicles[vehicle].round_trip_rate : vehicles[vehicle].one_way_rate}/km</span>
                    </div>
                    <div className="mt-1 text-[10px] text-m3-on-surface-variant font-semibold">
                      {vehicle}
                    </div>
                  </div>
                </div>

                {/* Prominent Transparent Breakdown Button */}
                <button
                  type="button"
                  onClick={() => setShowFullBreakdown(true)}
                  className="w-full py-2 px-3.5 bg-m3-surface hover:bg-m3-surface-container-high text-m3-on-surface font-semibold text-m3-label-l rounded-m3-full border border-m3-outline-variant shadow-m3-1 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <span className="inline-flex items-center gap-1.5 text-m3-on-surface font-semibold">
                    <Calculator className="w-3.5 h-3.5 text-m3-primary" />
                    <span>{isTa ? 'கட்டண கணக்கீடு விவரம் (Breakdown)' : 'View Fare Breakdown'}</span>
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-m3-label-s text-m3-on-surface-variant group-hover:text-m3-on-surface font-semibold">
                    <span>{isTa ? 'விவரம்' : 'Math'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-m3-on-surface-variant transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>

                {/* Transparency Badges */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {[
                    { icon: ShieldCheck, text: isTa ? 'சரிபார்க்கப்பட்ட ஓட்டுநர்கள்' : 'Verified Drivers' },
                    { icon: CheckCircle2, text: isTa ? 'மறைமுக கட்டணங்கள் இல்லை' : 'No Hidden Costs' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-m3-md bg-m3-surface border border-m3-outline-variant/60">
                      <item.icon className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="text-m3-label-s font-semibold text-m3-on-surface">{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Mobile Date Picker inside Result */}
                <div className="pt-0.5">
                  <label htmlFor={`${stableFormId}-mobile-date-result`} className="text-m3-label-s font-semibold text-m3-on-surface-variant uppercase mb-1 block">{isTa ? 'பயண தேதி' : 'Travel Date'}</label>
                  <input
                    id={`${stableFormId}-mobile-date-result`}
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-m3-surface border border-m3-outline-variant rounded-m3-md px-3 py-2 text-m3-body-m text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary/20 focus:border-m3-primary min-h-[40px]"
                  />
                </div>
                <button
                  onClick={handleWhatsApp}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1EBE5D] text-white rounded-m3-full font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-m3-2 hover:shadow-m3-3 transition-all active:scale-[0.98] cursor-pointer border border-emerald-400/40"
                >
                  <WhatsAppIcon className="w-5 h-5" variant="two-tone" />
                  <span>{isTa ? 'வாட்ஸ்அப்பில் முன்பதிவு செய்ய' : 'Book on WhatsApp'}</span>
                </button>
              </div>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-m3-scrim/60 backdrop-blur-sm p-3 sm:p-4">
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
              <p className="text-m3-title-m font-bold text-m3-on-surface font-heading">{activeTab === 'local' ? (localPackage === '8hr80km' ? '80 KM' : '120 KM') : `${breakdown.actual_km.toFixed(1)} KM`}</p>
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
          <button 
            onClick={() => {
              setShowFullBreakdown(false);
              handleWhatsApp();
            }}
            className="flex-[2] py-2.5 px-4 bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1EBE5D] text-white font-bold text-sm rounded-m3-full flex items-center justify-center gap-2 shadow-m3-1 hover:shadow-m3-2 active:scale-[0.98] transition-all cursor-pointer border border-emerald-400/30"
          >
            <WhatsAppIcon className="w-4 h-4" variant="two-tone" />
            <span>{isTa ? 'வாட்ஸ்அப் முன்பதிவு' : 'Confirm on WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
