import React, { useState, useEffect, useRef } from 'react';
import { Plane, Car, Users, Calculator, LocateFixed, X, ChevronDown, CheckCircle2, ShieldCheck, Navigation, Calendar, Phone } from 'lucide-react';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import { loadGoogleMaps } from '../lib/googleMapsLoader';

// Fixed Zone Tariff Table for Chennai Airport (MAA)
const AIRPORT_ZONES = [
  {
    name: "South Chennai & Airport Vicinity",
    keywords: ["guindy", "tambaram", "pallavaram", "velachery", "chromepet", "medavakkam", "porur", "alandur", "st. thomas mount", "meenambakkam", "nanmangalam", "perungalathur", "keelkattalai", "madipakkam"],
    distanceKm: 12,
    duration: "15–25 mins",
    rates: {
      "Swift Dzire": 650,
      "Maruti Ertiga": 1150,
      "Innova Crysta": 1500,
      "Tempo Traveller": 2400
    }
  },
  {
    name: "Central Chennai & Downtown",
    keywords: ["t. nagar", "t nagar", "us consulate", "anna nagar", "nungambakkam", "egmore", "central", "mylapore", "alwarpet", "kodambakkam", "vadapalani", "chetpet", "kilpauk", "royapettah", "triplicane", "mount road", "teynampet", "gopalapuram", "thousand lights"],
    distanceKm: 22,
    duration: "30–45 mins",
    rates: {
      "Swift Dzire": 950,
      "Maruti Ertiga": 1550,
      "Innova Crysta": 1950,
      "Tempo Traveller": 2900
    }
  },
  {
    name: "OMR & IT Corridor (SIPCOT)",
    keywords: ["omr", "perungudi", "thoraipakkam", "sholinganallur", "navalur", "siruseri", "sipcot", "elcot", "kelambakkam", "padur", "karapakkam", "semmancheri"],
    distanceKm: 18,
    duration: "25–40 mins",
    rates: {
      "Swift Dzire": 1250,
      "Maruti Ertiga": 1850,
      "Innova Crysta": 2300,
      "Tempo Traveller": 3400
    }
  },
  {
    name: "North Chennai & Port Industrial",
    keywords: ["parrys", "broadway", "madhavaram", "ambattur", "ennore", "tondiarpet", "tiruvottiyur", "avadi", "red hills", "manali", "kolathur", "perambur", "villivakkam"],
    distanceKm: 30,
    duration: "45–60 mins",
    rates: {
      "Swift Dzire": 1350,
      "Maruti Ertiga": 1950,
      "Innova Crysta": 2450,
      "Tempo Traveller": 3600
    }
  },
  {
    name: "ECR Coastal & Beach Resorts",
    keywords: ["ecr", "mahabalipuram", "mamallapuram", "kovalam", "nemmeli", "muttukadu", "intercontinental", "radisson", "taj fisherman", "sheraton"],
    distanceKm: 45,
    duration: "45–60 mins",
    rates: {
      "Swift Dzire": 1650,
      "Maruti Ertiga": 2400,
      "Innova Crysta": 2950,
      "Tempo Traveller": 4200
    }
  },
  {
    name: "Pondicherry & Auroville Direct",
    keywords: ["pondicherry", "pondy", "auroville", "puducherry", "white town", "promenade"],
    distanceKm: 145,
    duration: "2.5–3 hrs",
    rates: {
      "Swift Dzire": 3900,
      "Maruti Ertiga": 5600,
      "Innova Crysta": 6800,
      "Tempo Traveller": 8900
    }
  },
  {
    name: "Vellore CMC & Tirupati Direct",
    keywords: ["vellore", "cmc", "tirupati", "vit", "chittoor", "ranipet"],
    distanceKm: 135,
    duration: "3–3.5 hrs",
    rates: {
      "Swift Dzire": 4200,
      "Maruti Ertiga": 6200,
      "Innova Crysta": 7400,
      "Tempo Traveller": 9800
    }
  }
];

const VEHICLE_SPECS = {
  "Swift Dzire": { name: "Swift Dzire / Etios", tag: "Sedan", caps: "4 Pax + 2 Bags", baseRate: 650 },
  "Maruti Ertiga": { name: "Maruti Ertiga / XL6", tag: "SUV", caps: "6 Pax + 3 Bags", baseRate: 1150 },
  "Innova Crysta": { name: "Innova Crysta (VIP)", tag: "Executive MPV", caps: "7 Pax + 5 Bags", baseRate: 1500 },
  "Tempo Traveller": { name: "Tempo Traveller (12S)", tag: "Group Minibus", caps: "12 Pax + Coach Bags", baseRate: 2400 }
};

const AIRPORT_HUB_NAME = "Chennai International Airport (MAA)";

const getDefaultDateTime = () => {
  const d = new Date();
  d.setHours(d.getHours() + 2);
  d.setMinutes(0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function AirportBookingEngine() {
  const [direction, setDirection] = useState('drop'); // 'drop' (To MAA) | 'pickup' (From MAA)
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState(AIRPORT_HUB_NAME);
  const [passengers, setPassengers] = useState('4');
  const [vehicle, setVehicle] = useState('Swift Dzire');
  const [dateTime, setDateTime] = useState(getDefaultDateTime);
  const [flightNo, setFlightNo] = useState('');
  
  const [matchedZone, setMatchedZone] = useState(null);
  const [estimate, setEstimate] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [duration, setDuration] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const destinationInputRef = useRef(null);
  const resultRef = useRef(null);

  // Sync Locations when Direction Toggle changes
  const handleDirectionChange = (newDir) => {
    if (newDir === direction) return;
    setDirection(newDir);
    setShowResult(false);
    setErrorMsg('');

    if (newDir === 'pickup') {
      const userLoc = pickup === AIRPORT_HUB_NAME ? '' : pickup;
      setPickup(AIRPORT_HUB_NAME);
      setDrop(userLoc);
    } else {
      const userLoc = drop === AIRPORT_HUB_NAME ? '' : drop;
      setPickup(userLoc);
      setDrop(AIRPORT_HUB_NAME);
    }
  };

  // Google Maps Places Autocomplete attachment on the destination input
  useEffect(() => {
    let autocomplete = null;
    let isMounted = true;

    loadGoogleMaps()
      .then(() => {
        if (!isMounted || !destinationInputRef.current || !window.google?.maps?.places) return;

        autocomplete = new window.google.maps.places.Autocomplete(destinationInputRef.current, {
          componentRestrictions: { country: 'in' },
          fields: ['name', 'formatted_address', 'geometry']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const addr = place.formatted_address || place.name;
          if (!addr) return;

          if (direction === 'pickup') {
            setDrop(addr);
          } else {
            setPickup(addr);
          }
          setShowResult(false);
          setErrorMsg('');

          // Calculate road km from Airport (12.9941, 80.1709)
          if (place.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const rad = (x) => (x * Math.PI) / 180;
            const R = 6371;
            const dLat = rad(lat - 12.9941);
            const dLong = rad(lng - 80.1709);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(rad(12.9941)) * Math.cos(rad(lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const straightKm = R * c;
            const roadKm = Math.round(straightKm * 1.35); // 1.35 road winding factor

            // Find matching zone or bracket
            let zone = null;
            if (roadKm <= 15) zone = AIRPORT_ZONES[0];
            else if (roadKm <= 28) zone = AIRPORT_ZONES[1];
            else if (roadKm <= 40) zone = AIRPORT_ZONES[2];
            else if (roadKm <= 60) zone = AIRPORT_ZONES[4];
            else if (roadKm <= 150) zone = AIRPORT_ZONES[5];
            else zone = AIRPORT_ZONES[1];

            setMatchedZone(zone);
            setDistanceKm(roadKm);
            setDuration(`${Math.max(15, Math.round(roadKm * 1.8))} mins`);
          }
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [direction]);

  // Handle GPS location for user doorstep
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGettingLocation(false);
        const { latitude, longitude } = pos.coords;
        if (window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const formatted = results[0].formatted_address;
              if (direction === 'pickup') setDrop(formatted);
              else setPickup(formatted);
              setShowResult(false);
            }
          });
        } else {
          const fallback = `Current Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
          if (direction === 'pickup') setDrop(fallback);
          else setPickup(fallback);
          setShowResult(false);
        }
      },
      () => {
        setGettingLocation(false);
        alert("Unable to retrieve location. Please type your area or address.");
      }
    );
  };

  // Calculate Cost
  const handleCalculateCost = () => {
    const userLocation = direction === 'pickup' ? drop.trim() : pickup.trim();

    if (!userLocation || userLocation === AIRPORT_HUB_NAME) {
      setErrorMsg(direction === 'pickup' 
        ? "Please enter your drop location / hotel in Chennai" 
        : "Please enter your pickup doorstep / area in Chennai");
      if (destinationInputRef.current) {
        destinationInputRef.current.focus();
        destinationInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      const q = userLocation.toLowerCase();
      // Match against zone keywords
      let foundZone = AIRPORT_ZONES.find((z) => z.keywords.some((kw) => q.includes(kw)));
      if (!foundZone) {
        // Fallback default to Central Chennai zone
        foundZone = AIRPORT_ZONES[1];
      }

      setMatchedZone(foundZone);
      const fare = foundZone.rates[vehicle] || VEHICLE_SPECS[vehicle].baseRate;
      setEstimate(fare);
      setDistanceKm(foundZone.distanceKm);
      setDuration(foundZone.duration);
      setLoading(false);
      setShowResult(true);

      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }, 280);
  };

  // WhatsApp Booking
  const handleWhatsAppBooking = () => {
    const userLoc = direction === 'pickup' ? drop : pickup;
    const isPickup = direction === 'pickup';
    const chosenSpec = VEHICLE_SPECS[vehicle];

    const message = [
      `*Chennai Airport Cab Reservation Request*`,
      `• *Type:* ${isPickup ? 'Airport PICKUP (Meet & Greet at MAA)' : 'Airport DROP (To Departure Terminal)'}`,
      `• *Route:* ${pickup} ➔ ${drop}`,
      `• *Vehicle:* ${vehicle} (${chosenSpec.caps})`,
      `• *Fare:* ₹${estimate.toLocaleString('en-IN')} (Fixed Zone Rate, Zero Advance)`,
      `• *Pickup Date & Time:* ${dateTime.replace('T', ' ')}`,
      flightNo ? `• *Flight No / Airline:* ${flightNo}` : null,
      `• *Notes:* Chauffeur meets with Name Placard • Delay waiting free of charge`,
      ``,
      `Please confirm my airport taxi booking. Thank you!`
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/916381939769?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-m3-surface rounded-xl shadow-m3-1 border border-m3-outline-variant overflow-hidden font-sans">
      
      {/* Airport Drop / Pickup Segmented Pill Toggle (Exact Style from Home Screen, Compact) */}
      <div className="px-3 pt-2.5 mb-1.5">
        <div 
          role="tablist" 
          aria-label="Airport Transfer Direction" 
          className="bg-m3-surface-container-high p-0.5 rounded-full flex gap-1 border border-m3-outline-variant select-none"
        >
          <button
            type="button"
            role="tab"
            aria-selected={direction === 'drop'}
            onClick={() => handleDirectionChange('drop')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-full transition-all flex items-center justify-center min-h-[32px] cursor-pointer active:scale-[0.98] ${
              direction === 'drop' 
                ? 'bg-m3-primary text-m3-on-primary shadow-sm' 
                : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest'
            }`}
          >
            <span>Airport Drop</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={direction === 'pickup'}
            onClick={() => handleDirectionChange('pickup')}
            className={`flex-1 py-1.5 px-3 text-xs sm:text-sm font-bold rounded-full transition-all flex items-center justify-center min-h-[34px] sm:min-h-[38px] cursor-pointer active:scale-[0.98] ${
              direction === 'pickup' 
                ? 'bg-m3-primary text-m3-on-primary shadow-sm' 
                : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest'
            }`}
          >
            <span>Airport Pickup</span>
          </button>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="px-3 pb-3 space-y-1.5">
        
        {/* Error Notification */}
        {errorMsg && (
          <div className="p-2 bg-m3-error-container/40 text-m3-error text-xs font-bold rounded-md flex items-center gap-1.5 border border-m3-error/20 animate-in fade-in duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-m3-error shrink-0"></span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Route Fields Container */}
        <div className="space-y-1.5 relative">
          
          {/* 1. PICKUP LOCATION */}
          <div className="relative">

            <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-lg px-2.5 min-h-[38px] focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition-all">
              <span className="text-[9px] font-extrabold text-m3-on-surface-variant uppercase tracking-wider shrink-0 mr-2 border-r border-m3-outline-variant pr-2">FROM</span>
              <input
                ref={direction === 'drop' ? destinationInputRef : null}
                type="text"
                value={pickup}
                readOnly={direction === 'pickup'}
                onChange={(e) => {
                  if (direction === 'drop') {
                    setPickup(e.target.value);
                    setShowResult(false);
                    setErrorMsg('');
                  }
                }}
                placeholder={direction === 'pickup' ? AIRPORT_HUB_NAME : "Enter Pickup City / Doorstep / Area"}
                className={`bg-transparent w-full outline-none text-xs font-semibold text-m3-on-surface pr-12 placeholder:text-m3-on-surface-variant placeholder:font-normal ${
                  direction === 'pickup' ? 'cursor-default select-none' : 'cursor-text'
                }`}
              />

              {/* Right Side Icons */}
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {direction === 'drop' && pickup && (
                  <button
                    type="button"
                    onClick={() => {
                      setPickup('');
                      setShowResult(false);
                    }}
                    className="w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center hover:bg-m3-surface-container-high rounded-full transition-colors text-m3-on-surface-variant hover:text-m3-on-surface cursor-pointer"
                    title="Clear text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {direction === 'drop' && (
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center hover:bg-m3-surface-container-high rounded transition-colors text-m3-on-surface-variant hover:text-m3-primary cursor-pointer"
                    title="Use Current GPS Location"
                  >
                    <LocateFixed className={`w-3.5 h-3.5 ${gettingLocation ? 'animate-spin text-m3-primary' : ''}`} />
                  </button>
                )}

                {direction === 'pickup' && (
                  <span className="p-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. DROP LOCATION */}
          <div className="relative">

            <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-lg px-2.5 min-h-[38px] focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition-all">
              <span className="text-[9px] font-extrabold text-m3-on-surface-variant uppercase tracking-wider shrink-0 mr-2 border-r border-m3-outline-variant pr-2">TO</span>
              <input
                ref={direction === 'pickup' ? destinationInputRef : null}
                type="text"
                value={drop}
                readOnly={direction === 'drop'}
                onChange={(e) => {
                  if (direction === 'pickup') {
                    setDrop(e.target.value);
                    setShowResult(false);
                    setErrorMsg('');
                  }
                }}
                placeholder={direction === 'drop' ? AIRPORT_HUB_NAME : "Enter Drop City / Hotel / Area / Address"}
                className={`bg-transparent w-full outline-none text-xs font-semibold text-m3-on-surface pr-12 placeholder:text-m3-on-surface-variant placeholder:font-normal ${
                  direction === 'drop' ? 'cursor-default select-none' : 'cursor-text'
                }`}
              />

              {/* Right Side Icons */}
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {direction === 'pickup' && drop && (
                  <button
                    type="button"
                    onClick={() => {
                      setDrop('');
                      setShowResult(false);
                    }}
                    className="w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center hover:bg-m3-surface-container-high rounded-full transition-colors text-m3-on-surface-variant hover:text-m3-on-surface cursor-pointer"
                    title="Clear text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {direction === 'pickup' && (
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center hover:bg-m3-surface-container-high rounded transition-colors text-m3-on-surface-variant hover:text-m3-primary cursor-pointer"
                    title="Use Current GPS Location"
                  >
                    <LocateFixed className={`w-3.5 h-3.5 ${gettingLocation ? 'animate-spin text-m3-primary' : ''}`} />
                  </button>
                )}

                {direction === 'drop' && (
                  <span className="p-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. PASSENGERS & VEHICLE — no labels */}
          <div className="grid grid-cols-2 gap-1.5">
            
            {/* Passengers Dropdown */}
            <div className="relative">
              <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-lg px-2 min-h-[36px] focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary transition-all cursor-pointer">
                <Users className="w-3.5 h-3.5 text-m3-on-surface-variant mr-1 shrink-0 pointer-events-none" />
                <select
                  id="airport-passengers-select"
                  value={passengers}
                  onChange={(e) => {
                    const p = e.target.value;
                    setPassengers(p);
                    if (p === '4') setVehicle('Swift Dzire');
                    else if (p === '6') setVehicle('Maruti Ertiga');
                    else if (p === '7') setVehicle('Innova Crysta');
                    else if (p === '12') setVehicle('Tempo Traveller');
                    setShowResult(false);
                  }}
                  className="bg-transparent w-full outline-none text-xs text-m3-on-surface font-semibold appearance-none cursor-pointer pr-5"
                >
                  <option value="4">4 Pax + Driver</option>
                  <option value="6">6 Pax + Driver</option>
                  <option value="7">7 Pax + Driver</option>
                  <option value="12">12 Pax + Driver</option>
                </select>
                <ChevronDown className="w-3 h-3 text-m3-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Vehicle Dropdown */}
            <div className="relative">
              <div className="relative flex items-center bg-m3-surface-container-low hover:bg-m3-surface-container border border-m3-outline-variant rounded-lg px-2 min-h-[36px] focus-within:ring-2 focus-within:ring-m3-primary/20 focus-within:border-m3-primary transition-all cursor-pointer">
                <Car className="w-3.5 h-3.5 text-m3-on-surface-variant mr-1 shrink-0 pointer-events-none" />
                <select
                  id="airport-vehicle-select"
                  value={vehicle}
                  onChange={(e) => {
                    const v = e.target.value;
                    setVehicle(v);
                    if (v === 'Swift Dzire') setPassengers('4');
                    else if (v === 'Maruti Ertiga') setPassengers('6');
                    else if (v === 'Innova Crysta') setPassengers('7');
                    else if (v === 'Tempo Traveller') setPassengers('12');
                    setShowResult(false);
                  }}
                  className="bg-transparent w-full outline-none text-xs text-m3-on-surface font-semibold appearance-none cursor-pointer pr-5"
                >
                  <option value="Swift Dzire">Swift Dzire</option>
                  <option value="Maruti Ertiga">Maruti Ertiga</option>
                  <option value="Innova Crysta">Innova Crysta</option>
                  <option value="Tempo Traveller">Tempo Traveller</option>
                </select>
                <ChevronDown className="w-3 h-3 text-m3-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
              </div>
            </div>

          </div>

        </div>

        {/* 4. CALCULATE COST BUTTON */}
        <button
          type="button"
          disabled={loading}
          onClick={handleCalculateCost}
          className="w-full max-w-[200px] mx-auto bg-m3-primary hover:bg-slate-900 text-m3-on-primary font-bold py-2 rounded-full transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md text-xs min-h-[38px] cursor-pointer active:scale-[0.98] disabled:opacity-75 border border-white/10"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculate Cost</span>
            </>
          )}
        </button>

        {/* 5. RESULT & BOOKING QUOTE CARD */}
        {showResult && (
          <div ref={resultRef} className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
            
            {/* Fare Summary Card */}
            <div className="bg-m3-surface-container-low rounded-xl p-3 sm:p-3.5 border border-m3-outline-variant shadow-sm space-y-2.5">
              
              {/* Header: Price + Route Badge */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-bold uppercase tracking-wide mb-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Fixed Airport Flat Rate</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-m3-on-surface tracking-tight font-heading">
                    ₹ {estimate.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-m3-on-surface-variant font-medium mt-0.5">Zero Surge • Pay After Trip</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-m3-surface rounded-md border border-m3-outline-variant text-[11px] font-bold text-m3-on-surface shadow-2xs">
                    <span>{distanceKm} km</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600">{duration}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-m3-on-surface-variant font-semibold">{vehicle}</div>
                  <div className="text-[9px] text-m3-on-surface-variant">{VEHICLE_SPECS[vehicle].caps}</div>
                </div>
              </div>

              {/* Matched Zone */}
              {matchedZone && (
                <div className="py-1.5 px-2.5 rounded-md bg-m3-surface border border-m3-outline-variant/80 text-[11px] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <strong className="block text-slate-900 font-bold truncate">{matchedZone.name}</strong>
                    <span className="block text-[10px] text-slate-500 truncate">{direction === 'pickup' ? drop : pickup}</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    Direct Transfer
                  </span>
                </div>
              )}

              {/* ─── RESTAURANT BILL STYLE FARE BREAKDOWN ─── */}
              <div className="rounded-lg border border-m3-outline-variant overflow-hidden">
                {/* Bill Header */}
                <div className="bg-m3-surface-container-high px-3 py-1.5 border-b border-m3-outline-variant flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-m3-on-surface-variant">Itemized Fare</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-m3-on-surface-variant">Amount</span>
                </div>

                {/* Line items */}
                <div className="divide-y divide-m3-outline-variant/50 bg-m3-surface">
                  {/* Base Fare / Zone Fare */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-m3-on-surface">Zone Flat Fare</p>
                      <p className="text-[10px] text-m3-on-surface-variant">
                        {matchedZone?.name} • {distanceKm} km
                      </p>
                    </div>
                    <span className="text-xs font-bold text-m3-on-surface shrink-0">₹{estimate.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Vehicle & Capacity */}
                  <div className="flex items-center justify-between px-3 py-2 bg-m3-surface-container-low/40">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-m3-on-surface">Vehicle Charge</p>
                      <p className="text-[10px] text-m3-on-surface-variant">{vehicle} • {VEHICLE_SPECS[vehicle].caps}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 shrink-0">INC</span>
                  </div>

                  {/* Fuel */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-m3-on-surface">Fuel Charges</p>
                      <p className="text-[10px] text-m3-on-surface-variant">Full route coverage</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 shrink-0">INC</span>
                  </div>

                  {/* Driver Allowance */}
                  <div className="flex items-center justify-between px-3 py-2 bg-m3-surface-container-low/40">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-m3-on-surface">Driver Allowance (Bata)</p>
                      <p className="text-[10px] text-m3-on-surface-variant">Food & stay for driver</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 shrink-0">INC</span>
                  </div>

                  {/* GST */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-m3-on-surface">GST & All Taxes</p>
                      <p className="text-[10px] text-m3-on-surface-variant">GST Invoice available</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 shrink-0">INC</span>
                  </div>

                  {/* Tolls note */}
                  <div className="flex items-center justify-between px-3 py-2 bg-m3-surface-container-low/40">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-m3-on-surface">Tolls & Parking</p>
                      <p className="text-[10px] text-m3-on-surface-variant">Billed at exact actuals</p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 shrink-0">Extra</span>
                  </div>
                </div>

                {/* Total Row */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-m3-surface-container-highest border-t border-m3-outline-variant">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-m3-on-surface-variant block">TOTAL PAYABLE</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Pay After Trip • Zero Advance</span>
                  </div>
                  <span className="text-base font-black text-m3-on-surface font-heading">₹{estimate.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Date/Time & Flight No — larger, more prominent */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="relative">
                  <label htmlFor="airport-booking-datetime" className="block text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-wide mb-1">
                    Date &amp; Time
                  </label>
                  <div className="flex items-center bg-m3-surface border border-m3-outline-variant rounded-md px-2.5 py-2 min-h-[40px] focus-within:ring-2 focus-within:ring-m3-primary/30 focus-within:border-m3-primary transition-all">
                    <Calendar className="text-m3-primary mr-1.5 w-4 h-4 shrink-0" />
                    <input
                      id="airport-booking-datetime"
                      type="datetime-local"
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                      className="bg-transparent w-full outline-none text-[11px] text-m3-on-surface font-semibold cursor-pointer"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label htmlFor="airport-booking-flight" className="block text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-wide mb-1">
                    Flight No <span className="font-normal normal-case">(Optional)</span>
                  </label>
                  <div className="flex items-center bg-m3-surface border border-m3-outline-variant rounded-md px-2.5 py-2 min-h-[40px] focus-within:ring-2 focus-within:ring-m3-primary/30 focus-within:border-m3-primary transition-all">
                    <Plane className="text-m3-primary mr-1.5 w-4 h-4 shrink-0" />
                    <input
                      id="airport-booking-flight"
                      type="text"
                      placeholder="e.g. 6E 204 / AI 542"
                      value={flightNo}
                      onChange={(e) => setFlightNo(e.target.value.toUpperCase())}
                      className="bg-transparent w-full outline-none text-[11px] text-m3-on-surface font-semibold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-m3-on-surface-variant"
                    />
                  </div>
                </div>
              </div>

              {/* CTA Buttons — temple-tours tonal style */}
              <div className="space-y-1.5 pt-0.5">
                {/* Primary WhatsApp — tonal emerald (temple-tours style) */}
                <button
                  type="button"
                  onClick={handleWhatsAppBooking}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-950 border border-emerald-300/80 shadow-sm font-bold text-xs sm:text-sm transition-all active:scale-[0.98] cursor-pointer select-none"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" variant="brand" />
                  <span>Reserve via WhatsApp (Pay After Trip)</span>
                </button>

                {/* Secondary Call */}
                <a
                  href="tel:+916381939769"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-m3-surface-container hover:bg-blue-50 active:bg-blue-100 text-m3-on-surface hover:text-[#1A73E8] border border-m3-outline-variant hover:border-blue-300 font-bold text-xs transition-all select-none"
                >
                  <Phone className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
                  <span>Call 24/7 Operations Desk (+91 63819 39769)</span>
                </a>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
