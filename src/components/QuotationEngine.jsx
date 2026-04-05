import React, { useState, useEffect, useRef } from 'react';
import { Car, MapPin, Calendar, Calculator, Send, ArrowRight, Repeat, Users, User, AlertCircle, Navigation, ShieldCheck, Clock, X } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import LocationPicker from './LocationPicker';
import { useLanguage } from '../hooks/useLanguage';
import siteContent from '../data/siteContent.json';

import tariffConfig from '../data/tariff_config.json';

const vehicles = tariffConfig.vehicles;
const vehicleOptions = Object.keys(vehicles);

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Remove potential XSS characters
  return input.replace(/[<>"'/`]/g, "").trim().slice(0, 100);
};

const ERROR_MSGS = {
  active: { en: "Too many attempts. Try again later.", ta: "அதிக முயற்சிகள். பின்னர் முயற்சிக்கவும்." },
  name: { en: "Name: 2-50 letters only", ta: "பெயர்: 2-50 எழுத்துக்கள் மட்டும்" },
  phone: { en: "Invalid Indian mobile number", ta: "தவறான மொபைல் எண்" },
  locations: { en: "Enter valid pickup & drop locations", ta: "சரியான இடங்களை உள்ளிடவும்" },
  date: { en: "Date must be in future", ta: "தேதி எதிர்காலத்தில் இருக்க வேண்டும்" },
};



export default function QuotationEngine({ currentLang = 'en', showAirportTab = true, showBookingButton = true, title = '', variant = "default" }) {
  const lang = useLanguage(currentLang);
  const isTa = lang === 'ta';
  const labels = siteContent.ui_labels;
  const displayTitle = title || (isTa ? labels.book_your_ride_ta : labels.book_your_ride);

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
  const stableFormId = "booking-form-v1"; // Using stable ID for hydration safety

  useEffect(() => {
    setMounted(true);
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

  // Rate Limiter
  const checkRateLimit = () => {
    try {
      const attempts = JSON.parse(localStorage.getItem('booking_attempts') || '[]');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const recent = attempts.filter(time => now - time < oneHour);

      if (recent.length >= 5) {
        setErrors(prev => ({ ...prev, global: ERROR_MSGS.active.en + " / " + ERROR_MSGS.active.ta }));
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
          error = `${ERROR_MSGS.date.en} | ${ERROR_MSGS.date.ta}`;
        }
        break;
      case 'location':
        // Alphanumeric, comma, space, hyphen, dot
        if (sanitized.length > 0 && !/^[a-zA-Z0-9\s,.-]+$/.test(sanitized)) {
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

  // Google Maps Autocomplete
  useEffect(() => {
    const initAutocomplete = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) return;

      const options = {
        componentRestrictions: { country: 'in' },
        fields: ['place_id', 'geometry', 'name', 'formatted_address'],
      };

      if (pickupInputRef.current) {
        const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, options);
        pickupAutocomplete.addListener('place_changed', () => {
          const place = pickupAutocomplete.getPlace();
          if (place.formatted_address) {
            setPickup(sanitizeInput(place.formatted_address));
            activeValidate('location', place.formatted_address);
            calculateDistance(place.formatted_address, drop);
            setShowResult(false);
          }
        });
      }

      if (dropInputRef.current) {
        const dropAutocomplete = new window.google.maps.places.Autocomplete(dropInputRef.current, options);
        dropAutocomplete.addListener('place_changed', () => {
          const place = dropAutocomplete.getPlace();
          if (place.formatted_address) {
            setDrop(sanitizeInput(place.formatted_address));
            activeValidate('location', place.formatted_address);
            calculateDistance(pickup, place.formatted_address);
            setShowResult(false);
          }
        });
      }
    };

    if (window.google && window.google.maps) {
      initAutocomplete();
    } else {
      window.addEventListener('google-maps-loaded', initAutocomplete);
      return () => window.removeEventListener('google-maps-loaded', initAutocomplete);
    }
  }, [pickup, drop, activeTab, localPackage]);

  const calculateDistance = (origin, destination) => {
    if (!origin || !destination || !window.google) return;

    // Quick validation before API call
    if (activeValidate('location', origin) && activeValidate('location', destination)) {
      setLoading(true);
      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
          setLoading(false);
          if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
            const distValue = response.rows[0].elements[0].distance.value / 1000;
            const durText = response.rows[0].elements[0].duration.text;
            setDistance(distValue);
            setDuration(durText);
          } else {
            console.error('Distance calculation failed:', status);
          }
        }
      );
    }
  };

  // Handle Pin Click - Opens Map Modal
  const handlePinClick = (field) => {
    setPickerField(field);
    setLocationPickerOpen(true);
    trackEvent('location_map_opened', { field });
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
  const getCurrentLocation = (field) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(field);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 GPS Coordinates:', { latitude, longitude });

        // Check if Google Maps is loaded
        if (!window.google || !window.google.maps) {
          setGettingLocation(null);
          console.error('❌ Google Maps not loaded');
          alert('Google Maps not loaded. Please wait a moment and try again.');
          return;
        }

        // Try Geocoding first (best option)
        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };

        console.log('🔄 Trying Geocoding API...');

        geocoder.geocode({ location: latlng }, (results, status) => {
          console.log('📊 Geocoding Status:', status);

          if (status === 'OK' && results && results.length > 0) {
            // SUCCESS - Use Geocoding result
            const address = results[0].formatted_address;
            console.log('✅ Geocoding success:', address);

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
            console.log('🔄 Geocoding failed, trying Places API...');
            console.log('⚠️ Geocoding status:', status);

            const map = new window.google.maps.Map(document.createElement('div'));
            const service = new window.google.maps.places.PlacesService(map);

            const request = {
              location: latlng,
              rankBy: window.google.maps.places.RankBy.DISTANCE,
              type: ['establishment', 'point_of_interest']
            };

            service.nearbySearch(request, (places, placesStatus) => {
              console.log('📊 Places API Status:', placesStatus);

              setGettingLocation(null);

              if (placesStatus === 'OK' && places && places.length > 0) {
                // SUCCESS - Use nearest place
                const nearestPlace = places[0];
                const placeName = nearestPlace.name;
                // Use vicinity if available for context
                const vicinity = nearestPlace.vicinity || 'Chennai';
                const placeAddress = `${placeName}, ${vicinity}`;

                console.log('✅ Places API success:', placeAddress);

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
                console.error('❌ Both Geocoding and Places failed');
                const fallbackAddress = `Chennai (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

                if (field === 'pickup') {
                  setPickup(fallbackAddress);
                } else {
                  setDrop(fallbackAddress);
                }

                console.log('🔄 Using coordinate fallback:', fallbackAddress);
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
        const minDropKm = vehicleData.min_drop_km || 130;
        const chargeableKm = Math.max(minDropKm, distance);
        const kmCost = chargeableKm * rate;
        totalCost = kmCost + bata;

        breakdownObj = {
          base_km: minDropKm,
          actual_km: distance,
          chargeable_km: chargeableKm,
          rate_per_km: rate,
          km_cost: kmCost,
          driver_bata: bata,
          days: 1
        };
      }
      // Round to nearest 10 for cleaner pricing
      setEstimate(Math.round(totalCost / 10) * 10);
      setBreakdown(breakdownObj);
    } else if (activeTab === 'local' && vehicleData) {
      // Fixed rates for local packages
      const localRates = {
        "Swift Dzire": { "8hr80km": 1800, "12hr120km": 2600 },
        "Toyota Etios": { "8hr80km": 1800, "12hr120km": 2600 },
        "Innova": { "8hr80km": 2500, "12hr120km": 3500 },
        "Innova Crysta": { "8hr80km": 3000, "12hr120km": 4200 },
        "Tempo Traveller": { "8hr80km": 4500, "12hr120km": 6000 }
      };
      
      const pkgCost = localRates[vehicle]?.[localPackage] || 2000;
      setEstimate(pkgCost);
      setBreakdown({
        package: localPackage,
        package_cost: pkgCost,
        driver_bata: 'Included',
        inclusions: ['80/120km Limit', 'Fuel', 'Driver Service']
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
        global: "Please fix errors above / மேலே உள்ள பிழைகளை சரிசெய்யவும்"
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
    const message = `*New Booking Request*
    
*Trip Details:*
🚗 Type: ${activeTab === 'local' ? `Local Package (${localPackage})` : activeTab === 'round' ? 'Round Trip' : 'One Way'}
🚙 Vehicle: ${vehicle}
👥 Passengers: ${passengers}
📍 Pickup: ${sanitizeInput(pickup)}
📍 Drop: ${sanitizeInput(drop)}
📅 Date: ${date ? new Date(date).toLocaleString() : 'Not Specified'}
📏 Distance: ${distance ? distance.toFixed(1) : 'N/A'} km ${activeTab === 'round' ? `(Round Trip: ${(distance * 2).toFixed(1)} km)` : ''}
202: ⏱️ Duration: ${duration || 'N/A'}
${activeTab === 'round' ? `📅 Days: ${days}` : ''}
💰 Est. Cost: ₹${estimate}

*Inclusions:* Fuel, Driver Bata (Incl. Food/Stay), GST
*Exclusions:* Tolls, Parking, State Permit (if any)

_Please confirm availability._`;

    trackEvent('booking_conversion_whatsapp', {
      estimate,
      trip_type: activeTab,
      vehicle
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/919092303060?text=${encodedMessage}`, '_blank');
  };

  // Helper for Input Classes
  const getInputClass = (field) => {
    return `flex items-center bg-slate-50 border rounded-xl px-4 py-3 transition-all ${errors[field]
      ? 'border-red-500 ring-1 ring-red-500 bg-red-50'
      : 'border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20'
      }`;
  };

  if (variant === 'card') {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans">
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

        <div className="p-6 pb-2 text-center">
          <h2 className="text-2xl font-bold text-slate-900">{displayTitle}</h2>
        </div>

        <div className="px-6 mb-6">
          <div className="bg-slate-100 p-1 rounded-xl flex overflow-x-auto whitespace-nowrap hide-scrollbar">
            {['oneway', 'round', 'local'].map(tab => (
              (tab !== 'local' || showAirportTab) && (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setShowResult(false); }}
                  className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  aria-current={activeTab === tab ? 'page' : undefined}
                >

                  <span className="capitalize">{tab === 'local' ? (isTa ? 'லோக்கல் பேக்கேஜ்' : 'Local Package') : tab === 'oneway' ? (isTa ? 'ஒரு வழி' : 'One Way') : (isTa ? 'இரு வழி' : 'Round Trip')}</span>
                </button>
              )
            ))}
          </div>
        </div>

        <div className="px-6 pb-8 space-y-5">
          {errors.global && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errors.global}
            </div>
          )}

            {/* Locations */}
            <div className="space-y-4">
              {activeTab === 'local' && (
                <div className="flex justify-center mb-2">
                  <div className="bg-slate-100 p-1 rounded-lg flex text-[11px] font-bold w-full">
                    {['8hr80km', '12hr120km'].map(pkg => (
                      <button
                        key={pkg}
                        onClick={() => setLocalPackage(pkg)}
                        className={`flex-1 px-4 py-2 rounded-md transition-all ${localPackage === pkg ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}
                      >
                        {pkg === '8hr80km' ? (isTa ? '8 மணி / 80 கிமீ' : '8Hrs / 80Kms') : (isTa ? '12 மணி / 120 கிமீ' : '12Hrs / 120Kms')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {['Pickup', 'Drop'].map((type) => (
                (type === 'Pickup' || activeTab !== 'local') && (
                <div key={type} className="relative group">
                  <label
                    htmlFor={`${stableFormId}-${type.toLowerCase()}`}
                    className="block text-xs font-bold text-slate-700 uppercase mb-1.5"
                  >
                    {type === 'Pickup' ? (isTa ? 'பிக்கப்' : 'Pickup') : (isTa ? 'டிராப்' : 'Drop')} {isTa ? 'இடம்' : 'Location'}
                  </label>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/20">
                    <button
                      type="button"
                      onClick={() => handlePinClick(type.toLowerCase())}
                      disabled={gettingLocation === type.toLowerCase()}
                      className="pr-2 transition-colors disabled:opacity-50"
                      title="Use current location"
                      aria-label={`Use current location for ${type.toLowerCase()}`}
                    >
                      <MapPin
                        className={`w-5 h-5 ${gettingLocation === type.toLowerCase() ? 'text-red-600 animate-pulse' : 'text-red-500'}`}
                        fill={gettingLocation === type.toLowerCase() ? 'currentColor' : 'none'}
                      />
                    </button>
                    <input
                      id={`${stableFormId}-${type.toLowerCase()}`}
                      ref={type === 'Pickup' ? pickupInputRef : dropInputRef}
                      type="text"
                      value={type === 'Pickup' ? pickup : drop}
                      onChange={(e) => {
                        const val = e.target.value;
                        type === 'Pickup' ? setPickup(val) : setDrop(val);
                        setShowResult(false);
                      }}
                      placeholder={isTa ? 'நகரம் / பகுதியை உள்ளிடவும்' : `Enter ${type} City / Area`}
                      className="bg-transparent w-full outline-none text-sm text-slate-800 font-bold pr-8 placeholder:text-slate-600"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {(type === 'Pickup' ? pickup : drop) && (
                        <button
                          type="button"
                          onClick={() => {
                            type === 'Pickup' ? setPickup('') : setDrop('');
                            setShowResult(false);
                          }}
                          className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-600 hover:text-red-700"
                          title="Clear"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                )
              ))}

              <div className="grid grid-cols-2 gap-4">
              {/* Passengers */}
              <div className="relative group">
                <label htmlFor={`${stableFormId}-passengers`} className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{isTa ? 'பயணிகள்' : 'Passengers'}</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/20">
                  <select
                    id={`${stableFormId}-passengers`}
                    value={passengers}
                    onChange={(e) => { setPassengers(e.target.value); setShowResult(false); }}
                    className="bg-transparent w-full outline-none text-sm text-slate-700 font-medium appearance-none"
                  >
                    {['4', '6', '7', '12'].map(n => <option key={n} value={n}>{n} {isTa ? 'பயணிகள்' : 'Pax'} + {isTa ? 'டிரைவர்' : 'Driver'}</option>)}
                  </select>
                </div>
              </div>

              {/* Vehicle */}
              <div className="relative group">
                <label htmlFor={`${stableFormId}-vehicle`} className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{isTa ? 'வாகனம்' : 'Vehicle'}</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/20">
                  <select
                    id={`${stableFormId}-vehicle`}
                    value={vehicle}
                    onChange={(e) => { setVehicle(e.target.value); setShowResult(false); }}
                    className="bg-transparent w-full outline-none text-sm text-slate-700 font-medium appearance-none cursor-pointer"
                  >
                    {vehicleOptions.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>



              {/* Days Input if Round Trip */}
              {activeTab === 'round' && (
                <div className="relative group">
                  <label htmlFor={`${stableFormId}-days`} className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{isTa ? 'நாட்கள்' : 'Days'}</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/20">
                    <Calendar className="text-indigo-500 mr-3 w-5 h-5" aria-hidden="true" />
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
                      className="bg-transparent w-full outline-none text-sm text-slate-700 font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center shadow-lg"
              onClick={() => {
                setShowResult(true);
                setShowBreakdown(true);
              }}
            >
              {isTa ? 'செலவைக் கணக்கிடுங்கள்' : 'Calculate Cost'}
            </button>

            {/* Results Section */}
            {showResult && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                {(distance || activeTab === 'local') && (
                  <div className="bg-slate-50 p-3 rounded-xl border space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      {activeTab === 'local' ? (
                        <>
                          <div><span className="block text-[10px] uppercase font-bold text-slate-600">{isTa ? 'பேக்கேஜ்' : 'Package'}</span><strong>{localPackage === '8hr80km' ? '8 Hours / 80 Kms' : '12 Hours / 120 Kms'}</strong></div>
                          <div><span className="block text-[10px] uppercase font-bold text-slate-600">{isTa ? 'லிமிட்' : 'Limit'}</span><strong>{isTa ? 'சென்னையினுள்' : 'Within City'}</strong></div>
                        </>
                      ) : (
                        <>
                          <div><span className="block text-[10px] uppercase font-bold text-slate-600">{isTa ? 'மொத்த தூரம்' : 'Total Distance'}</span><strong>{activeTab === 'round' ? (distance * 2).toFixed(1) : distance.toFixed(1)} km</strong></div>
                          <div><span className="block text-[10px] uppercase font-bold text-slate-600">{isTa ? 'மதிப்பீட்டு நேரம்' : 'Est. Time'}</span><strong>{activeTab === 'round' ? `${isTa ? 'சுமார்' : 'Approx.'} ${duration} (${isTa ? 'ஒரு வழி' : 'One Way'})` : duration}</strong></div>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 font-medium italic">*{activeTab === 'local' ? (isTa ? 'கூடுதல் கி.மீ மற்றும் மணிநேரம் கூடுதல் சார்ஜ் உண்டு' : 'Extra Km and Hours will be charged extra.') : (isTa ? 'டோல் கட்டணம் மற்றும் பார்க்கிங் கட்டணம் கூடுதல்.' : 'Toll charges and parking fees are additional.')}</p>
                  </div>
                )}

                {estimate > 0 && (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-xs text-emerald-700 font-bold uppercase">{isTa ? 'மொத்த மதிப்பீடு' : 'Total Estimate'}</p>
                        <p className="text-3xl font-black text-slate-800">₹ {estimate.toLocaleString('en-IN')}</p>
                        <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">
                          {isTa ? 'டிரைவர் பேட்டா மற்றும் குறைந்தபட்ச கிமீ சேர்க்கப்பட்டுள்ளது' : 'Incl. Driver Bata & Minimum KM'}
                        </p>
                      </div>
                      <div className="text-[10px] text-slate-500 text-right">
                        <button
                          onClick={() => setShowFullBreakdown(true)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition-colors mb-2 inline-flex items-center gap-1 border border-indigo-100"
                        >
                          <Calculator className="w-3 h-3" />
                          {isTa ? 'முழு விவரம்' : 'Full Breakdown'}
                        </button>
                        <div className="mt-1">
                          {isTa ? 'கட்டணம்' : 'Rate'}: ₹{activeTab === 'round' ? vehicles[vehicle].round_trip_rate : vehicles[vehicle].one_way_rate}/km
                        </div>
                      </div>
                    </div>

                    {showBreakdown && breakdown && (
                      <div className="mb-4 p-3 bg-white/50 rounded-xl border border-emerald-100 text-[11px] space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                        {activeTab === 'local' ? (
                          <>
                            <div className="flex justify-between text-slate-600">
                              <span>{isTa ? 'பேக்கேஜ் வகை' : 'Package Type'}</span>
                              <span className="font-bold">{localPackage === '8hr80km' ? '8H / 80KM' : '12H / 120KM'}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>{isTa ? 'அடிப்படை கட்டணம்' : 'Base Fare'}</span>
                              <span className="font-bold">₹{breakdown.package_cost.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-slate-900 pt-1 border-t border-emerald-100/50">
                              <span>{isTa ? 'ஓட்டுநர் பேட்டா' : 'Driver Bata'}</span>
                              <span className="font-bold">{isTa ? 'சேர்க்கப்பட்டுள்ளது' : 'Included'}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between text-slate-600">
                              <span>{isTa ? 'குறைந்தபட்ச கிமீ' : 'Minimum KM'} ({activeTab === 'round' ? `${breakdown.days} ${isTa ? 'நாட்கள்' : 'days'}` : (isTa ? 'ஒரு வழி' : 'One Way')})</span>
                              <span className="font-bold">{breakdown.base_km} km</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>{isTa ? 'உண்மையான தூரம்' : 'Estimated Distance'}</span>
                              <span className="font-bold">{breakdown.actual_km.toFixed(1)} km</span>
                            </div>
                            <div className="flex justify-between text-slate-900 pt-1 border-t border-emerald-100/50">
                              <span>{isTa ? 'கட்டணம் கிமீ' : 'Chargeable KM'} x ₹{breakdown.rate_per_km}</span>
                              <span className="font-bold">₹{breakdown.km_cost.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-slate-900 border-t border-emerald-100/50 pt-1.5">
                              <span>{isTa ? 'டிரைவர் பேட்டா (உணவு மற்றும் தங்குமிடம் உட்பட)' : 'Driver Bata (Incl. food & stay)'}</span>
                              <span className="font-bold">₹{breakdown.driver_bata.toLocaleString('en-IN')}</span>
                            </div>
                          </>
                        )}
                        <div className="pt-2 mt-2 border-t border-emerald-200 grid grid-cols-2 gap-2 text-[10px]">
                          <div className="text-slate-700">
                            <strong>{isTa ? 'உள்ளடக்கியவை' : 'Inclusions'}:</strong>
                            <ul className="list-disc ml-3 mt-0.5">
                              <li>{isTa ? 'எரிபொருள் (Fuel)' : 'Fuel Charges'}</li>
                              <li>{isTa ? 'டிரைவர் பேட்டா' : 'Driver Service'}</li>
                              <li>{isTa ? 'ஜிஎஸ்டி (GST)' : 'GST'}</li>
                            </ul>
                          </div>
                          <div className="text-slate-700 text-right">
                            <strong>{isTa ? 'தவிர்க்கப்பட்டவை' : 'Exclusions'}:</strong>
                            <ul className="list-disc list-inside mt-0.5">
                              <li>{isTa ? 'டோல்' : 'Tolls'}</li>
                              <li>{isTa ? 'பார்க்கிங்' : 'Parking'}</li>
                              <li>{isTa ? 'மாநில வரி' : 'State Tax'}*</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transparency Badges */}
                    <div className="mb-4 grid grid-cols-2 gap-2 mt-4">
                      {[
                        { icon: ShieldCheck, text: isTa ? 'சரிபார்க்கப்பட்ட ஓட்டுநர்கள்' : 'Verified Drivers', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { icon: Calculator, text: isTa ? 'மறைமுக கட்டணங்கள் இல்லை' : 'No Hidden Costs', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { icon: Clock, text: isTa ? '24/7 ஆதரவு' : '24/7 Support', color: 'text-amber-600', bg: 'bg-amber-50' },
                        { icon: Navigation, text: isTa ? 'நேரத்திற்கு பிக்கப்' : 'On-Time Pickup', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      ].map((item, idx) => (
                        <div key={idx} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${item.bg}`}>
                          <item.icon className={`w-3 h-3 ${item.color}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-tight ${item.color}`}>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Date/Time moved here */}
                    <div className="mb-4 relative group">
                      <label htmlFor={`${stableFormId}-date-result`} className="block text-xs font-bold text-slate-700 uppercase mb-1.5">{isTa ? 'பயண தேதி' : 'Travel Date'}</label>
                      <div className="flex items-center bg-white border border-emerald-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-emerald-500/20">
                        <Calendar className="text-emerald-500 mr-3 w-5 h-5" aria-hidden="true" />
                        <input
                          id={`${stableFormId}-date-result`}
                          type="datetime-local"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="bg-transparent w-full outline-none text-sm text-slate-700 font-medium cursor-pointer"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleWhatsApp}
                      className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                      <Send className="w-4 h-4" /> {isTa ? 'வாட்ஸ்அப்பில் முன்பதிவு செய்ய' : 'Book on WhatsApp'}
                    </button>
                  </div>
                )}
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

  // Mobile / Default Variant
  return (
    <div className="bg-white rounded-xl shadow-xl border-t-4 border-red-700 overflow-hidden">
      {/* Hidden Honeypot */}
      <input
        type="text"
        name="website_url"
        style={{ display: 'none' }}
        value={botField}
        onChange={(e) => setBotField(e.target.value)}
        tabIndex={-1}
      />

      <h2 className="text-lg font-bold text-center text-gray-800 py-4 border-b border-gray-100">
        {displayTitle}
      </h2>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {['oneway', 'round', 'local'].map(tab => (
          (tab !== 'local' || showAirportTab) && (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs text-center font-bold uppercase flex items-center justify-center gap-1 ${activeTab === tab ? 'text-red-700 border-b-2 border-red-700 bg-red-50' : 'text-gray-700'
                }`}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {tab === 'local' ? <Clock className="w-3 h-3" /> : tab === 'round' ? <Repeat className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              <span>{tab === 'local' ? (isTa ? 'லோக்கல்' : 'Local') : tab === 'round' ? (isTa ? 'இரு வழி' : 'Round Trip') : (isTa ? 'ஒரு வழி' : 'One Way')}</span>
            </button>
          )
        ))}
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 'local' && (
          <div className="flex justify-center mb-2">
            <div className="bg-gray-100 p-1 rounded-lg flex text-[10px] font-bold">
              {['8hr80km', '12hr120km'].map(pkg => (
                <button
                  key={pkg}
                  onClick={() => setLocalPackage(pkg)}
                  className={`px-4 py-1.5 rounded-md transition-all ${localPackage === pkg ? 'bg-white text-red-700 shadow-sm' : 'text-gray-700'}`}
                  aria-pressed={localPackage === pkg}
                >
                  {pkg === '8hr80km' ? (isTa ? '8 மணி / 80 கிமீ' : '8Hrs / 80Kms') : (isTa ? '12 மணி / 120 கிமீ' : '12Hrs / 120Kms')}
                </button>
              ))}
            </div>
          </div>
        )}

        {errors.global && (
          <div className="p-2 bg-red-50 text-red-600 text-[10px] font-bold rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.global}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {['Pickup', 'Drop'].map((type) => (
            (type === 'Pickup' || activeTab !== 'local') && (
            <div key={type} className="col-span-2 relative group">
              <label htmlFor={`${stableFormId}-mobile-${type}`} className="text-[10px] font-bold text-gray-800 uppercase mb-0.5 block">
                {isTa ? (type === 'Pickup' ? 'பிக்கப்' : 'டிராப்') : type}
              </label>
              <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-red-500 transition">
                <button
                  type="button"
                  onClick={() => handlePinClick(type.toLowerCase())}
                  disabled={gettingLocation === type.toLowerCase()}
                  className="pr-2 transition-colors disabled:opacity-50"
                  title="Use location"
                  aria-label={`Use current location for ${type.toLowerCase()}`}
                >
                  <MapPin
                    className={`w-5 h-5 ${gettingLocation === type.toLowerCase() ? 'text-red-600 animate-pulse' : 'text-red-500'}`}
                    fill={gettingLocation === type.toLowerCase() ? 'currentColor' : 'none'}
                  />
                </button>
                <input
                  id={`${stableFormId}-mobile-${type}`}
                  ref={type === 'Pickup' ? pickupInputRef : dropInputRef}
                  value={type === 'Pickup' ? pickup : drop}
                  onChange={(e) => {
                    const val = e.target.value;
                    type === 'Pickup' ? setPickup(val) : setDrop(val);
                    setShowResult(false);
                  }}
                  placeholder={isTa ? 'இடத்தை உள்ளிடவும்' : `Enter ${type} Location`}
                  className="bg-transparent w-full outline-none text-sm text-slate-800 font-bold py-1 pr-8 placeholder:text-slate-600"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {(type === 'Pickup' ? pickup : drop) && (
                    <button
                      type="button"
                      onClick={() => {
                        type === 'Pickup' ? setPickup('') : setDrop('');
                        setShowResult(false);
                      }}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 hover:text-red-500"
                      aria-label="Clear input"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            )
          ))}




          <div className="col-span-1">
            <label htmlFor={`${stableFormId}-mobile-pax`} className="text-[10px] font-bold text-gray-800 uppercase mb-0.5 block">{isTa ? 'பயணிகள்' : 'Passengers'}</label>
            <select
              id={`${stableFormId}-mobile-pax`}
              value={passengers}
              onChange={(e) => { setPassengers(e.target.value); setShowResult(false); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-700 min-h-[48px] appearance-none"
            >
              <option value="4">4 {isTa ? 'பேர்' : 'Pax'}</option>
              <option value="6">6 {isTa ? 'பேர்' : 'Pax'}</option>
              <option value="7">7 {isTa ? 'பேர்' : 'Pax'}</option>
              <option value="12">12 {isTa ? 'பேர்' : 'Pax'}</option>
            </select>
          </div>

          <div className="col-span-1">
            <label htmlFor={`${stableFormId}-mobile-veh`} className="text-[10px] font-bold text-gray-800 uppercase mb-0.5 block">{isTa ? 'வாகனம்' : 'Vehicle'}</label>
            <select
              id={`${stableFormId}-mobile-veh`}
              value={vehicle}
              onChange={(e) => { setVehicle(e.target.value); setShowResult(false); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-700 min-h-[48px] appearance-none"
            >
              {vehicleOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {activeTab === 'round' && (
            <div className="col-span-2">
              <label htmlFor={`${stableFormId}-mobile-days`} className="text-[10px] font-bold text-gray-800 uppercase mb-0.5 block">{isTa ? 'நாட்கள்' : 'Days'}</label>
              <input
                id={`${stableFormId}-mobile-days`}
                type="number"
                min="1"
                value={days}
                onChange={(e) => { setDays(e.target.value); setShowResult(false); }}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-700 min-h-[48px]"
              />
            </div>
          )}
        </div>

        <div className="pt-4">
          {!showResult ? (
            <button
              onClick={() => {
                setShowResult(true);
                setShowBreakdown(true);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center shadow-lg active:scale-95 min-h-[56px]"
            >
              {isTa ? 'செலவைக் கணக்கிடுங்கள்' : 'Calculate Cost'} <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {distance && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <div><span className="block text-[8px] uppercase font-bold text-slate-600">{isTa ? 'மொத்த தூரம்' : 'Total Distance'}</span><strong>{activeTab === 'round' ? (distance * 2).toFixed(1) : distance.toFixed(1)} km</strong></div>
                    <div><span className="block text-[8px] uppercase font-bold text-slate-600">{isTa ? 'மதிப்பீட்டு நேரம்' : 'Est. Time'}</span><strong>{duration}</strong></div>
                  </div>
                </div>
              )}

              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-[10px] text-emerald-700 font-bold uppercase">{isTa ? 'மொத்த மதிப்பீடு' : 'Total Estimate'}</p>
                    <p className="text-3xl font-black text-slate-800">₹ {estimate > 0 ? estimate.toLocaleString('en-IN') : '0'}</p>
                    <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">
                      {isTa ? 'டிரைவர் பேட்டா மற்றும் குறைந்தபட்ச கிமீ சேர்க்கப்பட்டுள்ளது' : 'Incl. Driver Bata & Minimum KM'}
                    </p>
                  </div>
                  <div className="text-[9px] text-slate-500 text-right">
                    <button
                      onClick={() => setShowFullBreakdown(true)}
                      className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-bold hover:bg-indigo-100 transition-colors mb-1.5 inline-flex items-center gap-1 border border-indigo-100"
                    >
                      <Calculator className="w-2.5 h-2.5" />
                      {isTa ? 'முழு விவரம்' : 'Full Breakdown'}
                    </button>
                    <div>
                      ₹{activeTab === 'round' ? vehicles[vehicle].round_trip_rate : vehicles[vehicle].one_way_rate}/km
                    </div>
                  </div>
                </div>

                {showBreakdown && breakdown && (
                  <div className="mb-4 p-3 bg-white/50 rounded-xl border border-emerald-100 text-[11px] space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {activeTab === 'local' ? (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>{isTa ? 'பேக்கேஜ் வகை' : 'Package Type'}</span>
                          <span className="font-bold">{localPackage === '8hr80km' ? '8H / 80KM' : '12H / 120KM'}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>{isTa ? 'அடிப்படை கட்டணம்' : 'Base Fare'}</span>
                          <span className="font-bold">₹{breakdown.package_cost.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 pt-1 border-t border-emerald-100/50">
                          <span>{isTa ? 'ஓட்டுநர் பேட்டா' : 'Driver Bata'}</span>
                          <span className="font-bold">{isTa ? 'சேர்க்கப்பட்டுள்ளது' : 'Included'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>{isTa ? 'குறைந்தபட்ச கிமீ' : 'Minimum KM'} ({activeTab === 'round' ? `${breakdown.days} ${isTa ? 'நாட்கள்' : 'days'}` : (isTa ? 'ஒரு வழி' : 'One Way')})</span>
                          <span className="font-bold">{breakdown.base_km} km</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>{isTa ? 'உண்மையான தூரம்' : 'Estimated Distance'}</span>
                          <span className="font-bold">{breakdown.actual_km.toFixed(1)} km</span>
                        </div>
                        <div className="flex justify-between text-slate-900 pt-1 border-t border-emerald-100/50">
                          <span>{isTa ? 'கட்டணம் கிமீ' : 'Chargeable KM'} x ₹{breakdown.rate_per_km}</span>
                          <span className="font-bold">₹{breakdown.km_cost.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 border-t border-emerald-100/50 pt-1.5">
                          <span>{isTa ? 'டிரைவர் பேட்டா (உணவு மற்றும் தங்குமிடம் உட்பட)' : 'Driver Bata (Incl. food & stay)'}</span>
                          <span className="font-bold">₹{breakdown.driver_bata.toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}
                    <div className="pt-2 mt-2 border-t border-emerald-200 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="text-slate-500">
                        <strong>{isTa ? 'உள்ளடக்கியவை' : 'Inclusions'}:</strong>
                        <ul className="list-disc ml-3 mt-0.5">
                          <li>{isTa ? 'எரிபொருள் (Fuel)' : 'Fuel Charges'}</li>
                          <li>{isTa ? 'டிரைவர் பேட்டா' : 'Driver Service'}</li>
                          <li>{isTa ? 'ஜிஎஸ்டி (GST)' : 'GST'}</li>
                        </ul>
                      </div>
                      <div className="text-slate-500 text-right">
                        <strong>{isTa ? 'தவிர்க்கப்பட்டவை' : 'Exclusions'}:</strong>
                        <ul className="list-disc list-inside mt-0.5">
                          <li>{isTa ? 'டோல்' : 'Tolls'}</li>
                          <li>{isTa ? 'பார்க்கிங்' : 'Parking'}</li>
                          <li>{isTa ? 'மாநில வரி' : 'State Tax'}*</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Date Picker inside Result */}
                <div className="mb-3">
                  <label htmlFor={`${stableFormId}-mobile-date-result`} className="text-[10px] font-bold text-emerald-700 uppercase mb-1 block">{isTa ? 'பயண தேதி' : 'Travel Date'}</label>
                  <input
                    id={`${stableFormId}-mobile-date-result`}
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[48px]"
                  />
                </div>
                <button
                  onClick={handleWhatsApp}
                  disabled={estimate === 0}
                  className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 min-h-[56px]"
                >
                  <Send className="w-4 h-4" /> {isTa ? 'வாட்ஸ்அப்பில் முன்பதிவு செய்ய' : 'Book on WhatsApp'}
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">{isTa ? 'விலைப்பட்டியல் விவரம்' : 'Detailed Fare Breakdown'}</h3>
            <p className="text-xs text-slate-700 font-bold mt-0.5">{vehicle} • {activeTab === 'local' ? (isTa ? 'லோக்கல் பேக்கேஜ்' : 'Local Package') : activeTab === 'round' ? (isTa ? 'இரு வழி பயணம்' : 'Round Trip') : (isTa ? 'ஒரு வழி பயணம்' : 'One Way Drop')}</p>
          </div>
          <button 
            onClick={() => setShowFullBreakdown(false)} 
            className="p-2.5 hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-full transition-all border border-slate-200 bg-white shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Trip Summary */}
          <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{isTa ? 'பயண தூரம்' : 'Trip Distance'}</span>
              <p className="text-2xl font-black text-slate-800">{activeTab === 'local' ? (localPackage === '8hr80km' ? '80 KM Limit' : '120 KM Limit') : `${breakdown.actual_km.toFixed(1)} KM`}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{isTa ? 'மதிப்பீடு' : 'Total Estimate'}</span>
              <p className="text-2xl font-black text-indigo-700">₹{estimate.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest px-1">{isTa ? 'கட்டண விவரங்கள்' : 'Cost Breakdown'}</h4>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {activeTab === 'local' ? (
                  <>
                    <div className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                          <Clock className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">{isTa ? 'பேக்கேஜ் வகை' : 'Package fare'}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{localPackage === '8hr80km' ? '8 Hours / 80 KM' : '12 Hours / 120 KM'}</p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">₹{breakdown.package_cost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-4 flex justify-between items-center bg-emerald-50/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                          <User className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">{isTa ? 'ஓட்டுநர் பேட்டா' : 'Driver Bata'}</p>
                            <p className="text-[10px] text-emerald-600 font-medium">{isTa ? 'கட்டணத்தில் அடங்கும்' : 'Included in fare'}</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600">{isTa ? 'இலவசம்' : 'INC'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                          <Navigation className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">{isTa ? 'குறைந்தபட்ச கிமீ' : 'Minimum Chargeable KM'}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{activeTab === 'round' ? `${breakdown.days} Days x ${vehicles[vehicle].min_km_per_day} KM` : `${vehicles[vehicle].min_drop_km || 130} KM Minimum`}</p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">{breakdown.base_km} KM</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                          <Calculator className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">{isTa ? 'கிமீ கட்டணம்' : 'KM Charges'}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{breakdown.chargeable_km} KM x ₹{breakdown.rate_per_km}/KM</p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">₹{breakdown.km_cost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                          <User className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">{isTa ? 'ஓட்டுநர் பேட்டா' : 'Driver Bata'}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{isTa ? 'உணவு மற்றும் தங்குமிடம் உட்பட' : 'Includes food & stay'}</p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">₹{breakdown.driver_bata.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="p-4 bg-slate-900 flex justify-between items-center">
                <span className="text-white font-bold">{isTa ? 'மொத்த தொகை' : 'Grand Total'}</span>
                <span className="text-white font-black text-xl">₹{estimate.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">{isTa ? 'உள்ளடக்கியவை' : 'Inclusions'}</h4>
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col gap-2">
                {[isTa ? 'எரிபொருள்' : 'Fuel Charges', isTa ? 'டிரைவர் பேட்டா' : 'Driver Service', isTa ? 'ஜிஎஸ்டி' : 'All Taxes (GST)'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] font-bold text-emerald-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest px-1">{isTa ? 'தவிர்க்கப்பட்டவை' : 'Exclusions'}</h4>
              <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex flex-col gap-2">
                {[isTa ? 'டோல் பிளாசா' : 'Toll Plaza', isTa ? 'பார்க்கிங்' : 'Parking Fees', isTa ? 'மாநில வரி' : 'Interstate Permit'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    <span className="text-[11px] font-bold text-red-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                <strong>{isTa ? 'குறிப்பு' : 'Note'}:</strong> {isTa ? 'இது ஒரு தோராயமான மதிப்பீடு மட்டுமே. உண்மையான கிமீ மற்றும் நேரம் பயணத்தின் இறுதியில் கணக்கிடப்படும். டோல் மற்றும் பார்க்கிங் கட்டணங்கள் ஸ்லிப் படி கூடுதல்.' : 'This is an estimated fare based on the inputs provided. Actual KM and Time will be calculated at the end of the trip. Toll and Parking fees as per actual receipts.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50 flex gap-3">
          <button 
            onClick={() => setShowFullBreakdown(false)}
            className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]"
          >
            {isTa ? 'மூடு' : 'Close Details'}
          </button>
          <button 
            onClick={() => {
              setShowFullBreakdown(false);
              handleWhatsApp();
            }}
            className="flex-[2] py-3.5 bg-[#25D366] text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-[#20bd5a] transition-all active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            {isTa ? 'இப்போதே முன் பதிவு செய்' : 'BOOK NOW'}
          </button>
        </div>
      </div>
    </div>
  );
}

