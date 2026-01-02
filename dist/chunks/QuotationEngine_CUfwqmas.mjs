import { jsx, jsxs } from 'react/jsx-runtime';
import { useRef, useState, useEffect } from 'react';
import { X, MapPin, Navigation, Car, ArrowRight, Repeat, AlertCircle, Users, User, Phone, Calendar, Send, Plane } from 'lucide-react';
import 'web-vitals';
import { u as useLanguage, s as siteContent } from './Layout_DqQjb86R.mjs';

const trackEvent = (eventName, params = {}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  } else {
    console.log("[Analytics] Event:", eventName, params);
  }
};

const LocationPicker = ({ isOpen, onClose, onConfirm, type }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  useRef(null);
  const [address, setAddress] = useState("Locating...");
  const [isDragging, setIsDragging] = useState(false);
  const defaultCenter = { lat: 13.0827, lng: 80.2707 };
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      initMap();
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen]);
  const initMap = () => {
    if (!mapRef.current || !window.google) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(pos);
          }
        },
        () => {
        }
      );
    }
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy"
      // Better mobile touch handling
    });
    mapInstanceRef.current = map;
    map.addListener("dragstart", () => {
      setIsDragging(true);
      setAddress("Moving...");
    });
    map.addListener("idle", () => {
      setIsDragging(false);
      const center = map.getCenter();
      geocodePosition(center);
    });
    geocodePosition(defaultCenter);
  };
  const geocodePosition = (latlng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === "OK" && results[0]) {
        const bestResult = results[0];
        setAddress(bestResult.formatted_address);
      } else {
        setAddress("Unknown location");
      }
    });
  };
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        mapInstanceRef.current.setCenter(pos);
        mapInstanceRef.current.setZoom(17);
      });
    }
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh] animate-in fade-in zoom-in duration-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-b flex items-center justify-between bg-white z-10", children: [
      /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-slate-800", children: [
        "Set ",
        type,
        " Location"
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-2 hover:bg-slate-100 rounded-full transition-colors", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5 text-slate-500" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative flex-1 bg-slate-100", children: [
      /* @__PURE__ */ jsx("div", { ref: mapRef, className: "w-full h-full" }),
      /* @__PURE__ */ jsxs("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center", children: [
        /* @__PURE__ */ jsx("div", { className: `transition-transform duration-200 ${isDragging ? "-translate-y-2" : ""}`, children: /* @__PURE__ */ jsx(MapPin, { className: "w-8 h-8 text-black fill-black drop-shadow-md" }) }),
        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-black/20 rounded-full blur-[1px] mt-[-2px]" })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleCurrentLocation,
          className: "absolute bottom-6 right-4 bg-white p-3 rounded-full shadow-lg hover:bg-slate-50 active:scale-95 transition-all",
          title: "Go to current location",
          children: /* @__PURE__ */ jsx(Navigation, { className: "w-5 h-5 text-indigo-600 fill-indigo-100" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-5 bg-white border-t space-y-4 z-10", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Selected Location" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-800 line-clamp-2 min-h-[2.5em]", children: address })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onConfirm(address),
          disabled: isDragging || address === "Locating..." || address === "Unknown location",
          className: "w-full bg-black text-white py-3.5 rounded-xl font-bold text-sm tracking-wide hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20",
          children: "CONFIRM LOCATION"
        }
      )
    ] })
  ] }) });
};

const rates = {
  "Swift Dzire": 11,
  "Toyota Etios": 12,
  "Innova": 15,
  "Innova Crysta": 18,
  "Tempo Traveller": 21
};
const vehicleOptions = Object.keys(rates);
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input.replace(/[<>"'/`]/g, "").trim().slice(0, 100);
};
const ERROR_MSGS = {
  active: { en: "Too many attempts. Try again later.", ta: "அதிக முயற்சிகள். பின்னர் முயற்சிக்கவும்." },
  name: { en: "Name: 2-50 letters only", ta: "பெயர்: 2-50 எழுத்துக்கள் மட்டும்" },
  phone: { en: "Invalid Indian mobile number", ta: "தவறான மொபைல் எண்" },
  locations: { en: "Enter valid pickup & drop locations", ta: "சரியான இடங்களை உள்ளிடவும்" },
  date: { en: "Date must be in future", ta: "தேதி எதிர்காலத்தில் இருக்க வேண்டும்" }
};
function QuotationEngine({ currentLang = "en", showAirportTab = true, showBookingButton = true, title = null, variant = "default" }) {
  const lang = useLanguage(currentLang);
  const isTa = lang === "ta";
  const labels = siteContent.ui_labels;
  const displayTitle = title || (isTa ? labels.book_your_ride_ta : labels.book_your_ride);
  const [activeTab, setActiveTab] = useState("oneway");
  const [airportMode, setAirportMode] = useState("drop");
  const [vehicle, setVehicle] = useState("Swift Dzire");
  const [passengers, setPassengers] = useState("4");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [estimate, setEstimate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [errors, setErrors] = useState({});
  const [botField, setBotField] = useState("");
  const [gettingLocation, setGettingLocation] = useState(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [pickerField, setPickerField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const stableFormId = "booking-form-v1";
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    trackEvent("booking_component_viewed", { variant });
  }, []);
  useEffect(() => {
    trackEvent("trip_type_selected", { trip_type: activeTab });
  }, [activeTab]);
  useEffect(() => {
    if (estimate > 0) {
      trackEvent("estimate_calculated", { vehicle, trip_type: activeTab, estimate, distance });
    }
  }, [estimate]);
  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const checkRateLimit = () => {
    try {
      const attempts = JSON.parse(localStorage.getItem("booking_attempts") || "[]");
      const now = Date.now();
      const oneHour = 60 * 60 * 1e3;
      const recent = attempts.filter((time) => now - time < oneHour);
      if (recent.length >= 5) {
        setErrors((prev) => ({ ...prev, global: ERROR_MSGS.active.en + " / " + ERROR_MSGS.active.ta }));
        return false;
      }
      recent.push(now);
      localStorage.setItem("booking_attempts", JSON.stringify(recent));
      return true;
    } catch (e) {
      return true;
    }
  };
  const validateField = (field, value) => {
    let error = null;
    const sanitized = sanitizeInput(value);
    switch (field) {
      case "name":
        if (!/^[a-zA-Z\s\.]{2,50}$/.test(sanitized)) {
          error = `${ERROR_MSGS.name.en} | ${ERROR_MSGS.name.ta}`;
        }
        break;
      case "phone":
        if (!/^[6-9]\d{9}$/.test(sanitized)) {
          error = `${ERROR_MSGS.phone.en} | ${ERROR_MSGS.phone.ta}`;
        }
        break;
      case "date":
        if (value && new Date(value) < /* @__PURE__ */ new Date()) {
          error = `${ERROR_MSGS.date.en} | ${ERROR_MSGS.date.ta}`;
        }
        break;
      case "location":
        if (sanitized.length > 0 && !/^[a-zA-Z0-9\s,.-]+$/.test(sanitized)) {
          error = "Invalid characters in location";
        }
        break;
    }
    return error;
  };
  const activeValidate = (field, value) => {
    const error = validateField(field, value);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) newErrors[field] = error;
      else delete newErrors[field];
      return newErrors;
    });
    return !error;
  };
  useEffect(() => {
    const pax = parseInt(passengers);
    if (pax <= 4) setVehicle("Swift Dzire");
    else if (pax <= 6) setVehicle("Innova");
    else if (pax <= 7) setVehicle("Innova Crysta");
    else setVehicle("Tempo Traveller");
    setShowResult(false);
  }, [passengers]);
  useEffect(() => {
    const initAutocomplete = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) return;
      const options = {
        componentRestrictions: { country: "in" },
        fields: ["place_id", "geometry", "name", "formatted_address"]
      };
      if (pickupInputRef.current) {
        const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, options);
        pickupAutocomplete.addListener("place_changed", () => {
          const place = pickupAutocomplete.getPlace();
          if (place.formatted_address) {
            setPickup(sanitizeInput(place.formatted_address));
            activeValidate("location", place.formatted_address);
            calculateDistance(place.formatted_address, drop);
            setShowResult(false);
          }
        });
      }
      if (dropInputRef.current) {
        const dropAutocomplete = new window.google.maps.places.Autocomplete(dropInputRef.current, options);
        dropAutocomplete.addListener("place_changed", () => {
          const place = dropAutocomplete.getPlace();
          if (place.formatted_address) {
            setDrop(sanitizeInput(place.formatted_address));
            activeValidate("location", place.formatted_address);
            calculateDistance(pickup, place.formatted_address);
            setShowResult(false);
          }
        });
      }
    };
    if (window.google && window.google.maps) {
      initAutocomplete();
    } else {
      window.addEventListener("google-maps-loaded", initAutocomplete);
      return () => window.removeEventListener("google-maps-loaded", initAutocomplete);
    }
  }, [pickup, drop, activeTab, airportMode]);
  const calculateDistance = (origin, destination) => {
    if (!origin || !destination || !window.google) return;
    if (activeValidate("location", origin) && activeValidate("location", destination)) {
      setLoading(true);
      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (response, status) => {
          setLoading(false);
          if (status === "OK" && response.rows[0].elements[0].status === "OK") {
            const distValue = response.rows[0].elements[0].distance.value / 1e3;
            const durText = response.rows[0].elements[0].duration.text;
            setDistance(distValue);
            setDuration(durText);
          } else {
            console.error("Distance calculation failed:", status);
          }
        }
      );
    }
  };
  const handlePinClick = (field) => {
    setPickerField(field);
    setLocationPickerOpen(true);
    trackEvent("location_map_opened", { field });
  };
  const handleLocationConfirm = (address) => {
    if (pickerField === "pickup") {
      setPickup(sanitizeInput(address));
      if (drop) calculateDistance(address, drop);
    } else if (pickerField === "drop") {
      setDrop(sanitizeInput(address));
      if (pickup) calculateDistance(pickup, address);
    }
    setLocationPickerOpen(false);
    trackEvent("location_pin_used", { field: pickerField, method: "map_picker", success: true });
  };
  useEffect(() => {
    if (distance && rates[vehicle]) {
      let rate = rates[vehicle];
      let totalCost = 0;
      if (activeTab === "round") {
        const minKm = days * 250;
        const actualRoundTripKm = distance * 2;
        const chargeableKm = Math.max(minKm, actualRoundTripKm);
        const baseFare = chargeableKm * rate;
        const driverBata = (days || 1) * 300;
        totalCost = baseFare + driverBata;
      } else {
        totalCost = distance * rate;
      }
      setEstimate(Math.round(totalCost / 10) * 10);
    } else {
      setEstimate(0);
    }
  }, [distance, vehicle, activeTab, days]);
  useEffect(() => {
    if (activeTab === "airport") {
      if (airportMode === "drop") {
        setDrop("Chennai International Airport (MAA)");
        if (pickup.includes("Airport")) setPickup("");
      } else {
        setPickup("Chennai International Airport (MAA)");
        if (drop.includes("Airport")) setDrop("");
      }
    }
  }, [activeTab, airportMode]);
  const handleWhatsApp = async () => {
    if (botField) {
      console.warn("Bot detected");
      return;
    }
    const isNameValid = activeValidate("name", name);
    const isPhoneValid = activeValidate("phone", phone);
    const isDateValid = date ? activeValidate("date", date) : true;
    const isPickupValid = pickup.length > 0;
    const isDropValid = drop.length > 0;
    if (!isNameValid || !isPhoneValid || !isDateValid || !isPickupValid || !isDropValid) {
      setErrors((prev) => ({
        ...prev,
        global: "Please fix errors above / மேலே உள்ள பிழைகளை சரிசெய்யவும்"
      }));
      trackEvent("booking_validation_error", {
        trip_type: activeTab
      });
      return;
    }
    if (!checkRateLimit()) return;
    trackEvent("booking_submit_attempt", { trip_type: activeTab, vehicle, estimate });
    const bookingData = {
      date: (/* @__PURE__ */ new Date()).toLocaleString(),
      tripType: activeTab,
      name: sanitizeInput(name),
      phone: sanitizeInput(phone),
      pickup: sanitizeInput(pickup),
      drop: sanitizeInput(drop),
      vehicle,
      passengers,
      distance: distance ? distance.toFixed(1) : "",
      estimate,
      travelDate: date
    };
    try {
      await fetch("https://script.google.com/macros/s/AKfycbwoEpKqa3Qg-DIvMe06pGUgGLlC_0vJQev61nzIh9ssh1-uHZ5VtYkGzpMVwhEyi7tvEQ/exec", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(bookingData)
      });
    } catch (e) {
      console.log("Logging simplified");
    }
    const message = `*New Booking Request*
    
*Customer:* ${sanitizeInput(name)}
*Phone:* ${sanitizeInput(phone)}
*Trip Details:*
🚗 Type: ${activeTab === "airport" ? "Airport Transfer" : activeTab === "round" ? "Round Trip" : "One Way"}
🚙 Vehicle: ${vehicle}
👥 Passengers: ${passengers}
📍 Pickup: ${sanitizeInput(pickup)}
📍 Drop: ${sanitizeInput(drop)}
📅 Date: ${date ? new Date(date).toLocaleString() : "Not Specified"}
📏 Distance: ${distance ? distance.toFixed(1) : "N/A"} km ${activeTab === "round" ? `(Round Trip: ${(distance * 2).toFixed(1)} km)` : ""}
202: ⏱️ Duration: ${duration || "N/A"}
${activeTab === "round" ? `📅 Days: ${days}` : ""}
💰 Est. Cost: ₹${estimate}

_Please confirm availability._`;
    trackEvent("booking_conversion_whatsapp", {
      estimate,
      trip_type: activeTab,
      vehicle
    });
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/919092303060?text=${encodedMessage}`, "_blank");
  };
  const getInputClass = (field) => {
    return `flex items-center bg-slate-50 border rounded-xl px-4 py-3 transition-all ${errors[field] ? "border-red-500 ring-1 ring-red-500 bg-red-50" : "border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20"}`;
  };
  if (variant === "card") {
    return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          name: "website_url",
          style: { display: "none" },
          value: botField,
          onChange: (e) => setBotField(e.target.value),
          tabIndex: -1,
          autoComplete: "off"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "p-6 pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-2 mb-1", children: [
        /* @__PURE__ */ jsx(Car, { className: "w-10 h-10 text-indigo-600" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-900", children: displayTitle }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: isTa ? "உடனடி விலை மதிப்பீடு" : "Get Instant Quote" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "px-6 mb-6", children: /* @__PURE__ */ jsx("div", { className: "bg-slate-100 p-1 rounded-xl flex", children: ["oneway", "round"].map((tab) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            setActiveTab(tab);
            setShowResult(false);
          },
          className: `flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`,
          "aria-current": activeTab === tab ? "page" : void 0,
          children: [
            tab === "oneway" ? /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Repeat, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsx("span", { className: "capitalize", children: tab === "oneway" ? isTa ? "ஒரு வழி" : "One Way" : isTa ? "இரு வழி" : "Round Trip" })
          ]
        },
        tab
      )) }) }),
      /* @__PURE__ */ jsxs("div", { className: "px-6 pb-8 space-y-5", children: [
        errors.global && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4" }),
          " ",
          errors.global
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          ["Pickup", "Drop"].map((type) => /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
            /* @__PURE__ */ jsxs(
              "label",
              {
                htmlFor: `${formId}-${type.toLowerCase()}`,
                className: "block text-xs font-bold text-slate-600 uppercase mb-1.5",
                children: [
                  type === "Pickup" ? isTa ? "பிக்கப்" : "Pickup" : isTa ? "டிராப்" : "Drop",
                  " ",
                  isTa ? "இடம்" : "Location"
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/20", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: `${formId}-${type.toLowerCase()}`,
                  ref: type === "Pickup" ? pickupInputRef : dropInputRef,
                  type: "text",
                  value: type === "Pickup" ? pickup : drop,
                  onChange: (e) => {
                    const val = e.target.value;
                    type === "Pickup" ? setPickup(val) : setDrop(val);
                    setShowResult(false);
                  },
                  placeholder: isTa ? "நகரம் / பகுதியை உள்ளிடவும்" : `Enter ${type} City / Area`,
                  className: "bg-transparent w-full outline-none text-sm text-slate-700 font-medium px-3 pr-20"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1", children: [
                (type === "Pickup" ? pickup : drop) && /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      type === "Pickup" ? setPickup("") : setDrop("");
                      setShowResult(false);
                    },
                    className: "p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-red-500",
                    title: "Clear",
                    children: /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 rotate-45 transform" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handlePinClick(type.toLowerCase()),
                    disabled: gettingLocation === type.toLowerCase(),
                    className: "p-1.5 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50",
                    title: "Use my current location",
                    "aria-label": `Use current location for ${type.toLowerCase()}`,
                    children: /* @__PURE__ */ jsx(
                      MapPin,
                      {
                        className: `w-5 h-5 ${gettingLocation === type.toLowerCase() ? "text-red-600 animate-pulse" : "text-red-500"}`,
                        fill: gettingLocation === type.toLowerCase() ? "currentColor" : "none"
                      }
                    )
                  }
                )
              ] })
            ] })
          ] }, type)),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: `${formId}-passengers`, className: "block text-xs font-bold text-slate-600 uppercase mb-1.5", children: isTa ? "பயணிகள்" : "Passengers" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/20", children: [
                /* @__PURE__ */ jsx(Users, { className: "text-indigo-500 mr-3 w-5 h-5", "aria-hidden": "true" }),
                /* @__PURE__ */ jsx(
                  "select",
                  {
                    id: `${formId}-passengers`,
                    value: passengers,
                    onChange: (e) => {
                      setPassengers(e.target.value);
                      setShowResult(false);
                    },
                    className: "bg-transparent w-full outline-none text-sm text-slate-700 font-medium appearance-none",
                    children: ["4", "6", "7", "12"].map((n) => /* @__PURE__ */ jsxs("option", { value: n, children: [
                      n,
                      " ",
                      isTa ? "பயணிகள்" : "Pax",
                      " + ",
                      isTa ? "டிரைவர்" : "Driver"
                    ] }, n))
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: `${formId}-vehicle`, className: "block text-xs font-bold text-slate-600 uppercase mb-1.5", children: isTa ? "வாகனம்" : "Vehicle" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/20", children: [
                vehicle.includes("Tempo") ? /* @__PURE__ */ jsx(Navigation, { className: "text-indigo-500 mr-3 w-5 h-5", "aria-hidden": "true" }) : /* @__PURE__ */ jsx(Car, { className: "text-indigo-500 mr-3 w-5 h-5", "aria-hidden": "true" }),
                /* @__PURE__ */ jsx(
                  "select",
                  {
                    id: `${formId}-vehicle`,
                    value: vehicle,
                    onChange: (e) => {
                      setVehicle(e.target.value);
                      setShowResult(false);
                    },
                    className: "bg-transparent w-full outline-none text-sm text-slate-700 font-medium appearance-none cursor-pointer",
                    children: vehicleOptions.map((v) => /* @__PURE__ */ jsx("option", { value: v, children: v }, v))
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative group col-span-2 md:col-span-1", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: `${formId}-name`, className: "block text-xs font-bold text-slate-600 uppercase mb-1.5", children: isTa ? "பெயர்" : "Name" }),
              /* @__PURE__ */ jsxs("div", { className: getInputClass("name"), children: [
                /* @__PURE__ */ jsx(User, { className: "text-slate-400 mr-3 w-5 h-5", "aria-hidden": "true" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: `${formId}-name`,
                    type: "text",
                    value: name,
                    onChange: (e) => {
                      setName(e.target.value);
                      activeValidate("name", e.target.value);
                    },
                    placeholder: isTa ? "உங்கள் பெயர்" : "Your Name",
                    className: "bg-transparent w-full outline-none text-sm text-slate-700 font-medium"
                  }
                )
              ] }),
              errors.name && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-red-500 mt-1", role: "alert", children: errors.name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative group col-span-2 md:col-span-1", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: `${formId}-phone`, className: "block text-xs font-bold text-slate-600 uppercase mb-1.5", children: isTa ? "தொலைபேசி" : "Phone" }),
              /* @__PURE__ */ jsxs("div", { className: getInputClass("phone"), children: [
                /* @__PURE__ */ jsx(Phone, { className: "text-slate-400 mr-3 w-5 h-5", "aria-hidden": "true" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: `${formId}-phone`,
                    type: "tel",
                    value: phone,
                    onChange: (e) => {
                      setPhone(e.target.value);
                      activeValidate("phone", e.target.value);
                    },
                    placeholder: isTa ? "மொபைல் எண்" : "Mobile Number",
                    className: "bg-transparent w-full outline-none text-sm text-slate-700 font-medium"
                  }
                )
              ] }),
              errors.phone && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-red-500 mt-1", role: "alert", children: errors.phone })
            ] }),
            activeTab === "round" && /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: `${formId}-days`, className: "block text-xs font-bold text-slate-600 uppercase mb-1.5", children: isTa ? "நாட்கள்" : "Days" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/20", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "text-indigo-500 mr-3 w-5 h-5", "aria-hidden": "true" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: `${formId}-days`,
                    type: "text",
                    inputMode: "numeric",
                    value: days || "",
                    onChange: (e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d+$/.test(val)) {
                        setDays(val === "" ? "" : parseInt(val));
                      }
                      setShowResult(false);
                    },
                    onBlur: () => {
                      if (!days) setDays(1);
                    },
                    className: "bg-transparent w-full outline-none text-sm text-slate-700 font-medium"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: "w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center shadow-lg",
              onClick: () => setShowResult(true),
              children: [
                isTa ? "செலவைக் கணக்கிடுங்கள்" : "Calculate Cost",
                " ",
                /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
              ]
            }
          ),
          showResult && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-top-4 duration-300", children: [
            distance && /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-3 rounded-xl border space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-slate-600", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-[10px] uppercase font-bold text-slate-400", children: isTa ? "மொத்த தூரம்" : "Total Distance" }),
                  /* @__PURE__ */ jsxs("strong", { children: [
                    activeTab === "round" ? (distance * 2).toFixed(1) : distance.toFixed(1),
                    " km"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-[10px] uppercase font-bold text-slate-400", children: isTa ? "மதிப்பீட்டு நேரம்" : "Est. Time" }),
                  /* @__PURE__ */ jsx("strong", { children: activeTab === "round" ? `${isTa ? "சுமார்" : "Approx."} ${duration} (${isTa ? "ஒரு வழி" : "One Way"})` : duration })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-500 italic", children: [
                "*",
                isTa ? "டோல் கட்டணம் மற்றும் பார்க்கிங் கட்டணம் கூடுதல்." : "Toll charges and parking fees are additional."
              ] })
            ] }),
            estimate > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 rounded-2xl p-4 border border-emerald-100", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end mb-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-emerald-700 font-bold uppercase", children: isTa ? "மொத்த மதிப்பீடு" : "Total Estimate" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-3xl font-black text-slate-800", children: [
                    "₹ ",
                    estimate.toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-slate-500 text-right", children: [
                  isTa ? "கட்டணம்" : "Rate",
                  ": ₹",
                  rates[vehicle],
                  "/km"
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleWhatsApp,
                  className: "w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95",
                  children: [
                    /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }),
                    " ",
                    isTa ? "வாட்ஸ்அப்பில் முன்பதிவு செய்ய" : "Book on WhatsApp"
                  ]
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-xl border-t-4 border-red-600 overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        name: "website_url",
        style: { display: "none" },
        value: botField,
        onChange: (e) => setBotField(e.target.value),
        tabIndex: -1
      }
    ),
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-center text-gray-800 py-4 border-b border-gray-100", children: displayTitle }),
    /* @__PURE__ */ jsx("div", { className: "flex border-b border-gray-100", children: ["oneway", "round", "airport"].map((tab) => (tab !== "airport" || showAirportTab) && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setActiveTab(tab),
        className: `flex-1 py-2 text-xs text-center font-bold uppercase flex items-center justify-center gap-1 ${activeTab === tab ? "text-red-600 border-b-2 border-red-600 bg-red-50" : "text-gray-600"}`,
        "aria-current": activeTab === tab ? "page" : void 0,
        children: [
          tab === "airport" ? /* @__PURE__ */ jsx(Plane, { className: "w-3 h-3" }) : tab === "round" ? /* @__PURE__ */ jsx(Repeat, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" }),
          /* @__PURE__ */ jsx("span", { children: tab === "airport" ? isTa ? "ஏர்போர்ட்" : "Airport" : tab === "round" ? isTa ? "இரு வழி" : "Round Trip" : isTa ? "ஒரு வழி" : "One Way" })
        ]
      },
      tab
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-3", children: [
      activeTab === "airport" && /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-2", children: /* @__PURE__ */ jsx("div", { className: "bg-gray-100 p-1 rounded-lg flex text-[10px] font-bold", children: ["drop", "pickup"].map((mode) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setAirportMode(mode),
          className: `px-4 py-1.5 rounded-md transition-all ${airportMode === mode ? "bg-white text-red-600 shadow-sm" : "text-gray-600"}`,
          "aria-pressed": airportMode === mode,
          children: mode === "drop" ? isTa ? "ஏர்போர்ட் செல்ல" : "To Airport" : isTa ? "ஏர்போர்ட்டிலிருந்து வர" : "From Airport"
        },
        mode
      )) }) }),
      errors.global && /* @__PURE__ */ jsxs("div", { className: "p-2 bg-red-50 text-red-600 text-[10px] font-bold rounded flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
        " ",
        errors.global
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        ["Pickup", "Drop"].map((type) => /* @__PURE__ */ jsxs("div", { className: "col-span-2 relative group", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: `${stableFormId}-mobile-${type}`, className: "text-[10px] font-bold text-gray-700 uppercase mb-0.5 block", children: isTa ? type === "Pickup" ? "பிக்கப்" : "டிராப்" : type }),
          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-red-500 transition", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                id: `${stableFormId}-mobile-${type}`,
                ref: type === "Pickup" ? pickupInputRef : dropInputRef,
                value: type === "Pickup" ? pickup : drop,
                onChange: (e) => {
                  const val = e.target.value;
                  type === "Pickup" ? setPickup(val) : setDrop(val);
                  setShowResult(false);
                },
                placeholder: isTa ? "இடத்தை உள்ளிடவும்" : `Enter ${type} Location`,
                className: "bg-transparent w-full outline-none text-sm text-gray-700 pr-16 py-1"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1", children: [
              (type === "Pickup" ? pickup : drop) && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    type === "Pickup" ? setPickup("") : setDrop("");
                    setShowResult(false);
                  },
                  className: "p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400",
                  "aria-label": "Clear input",
                  children: /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 rotate-45 transform" })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handlePinClick(type.toLowerCase()),
                  disabled: gettingLocation === type.toLowerCase(),
                  className: "p-2 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50",
                  title: "Use location",
                  "aria-label": `Use current location for ${type.toLowerCase()}`,
                  children: /* @__PURE__ */ jsx(
                    MapPin,
                    {
                      className: `w-5 h-5 ${gettingLocation === type.toLowerCase() ? "text-red-600 animate-pulse" : "text-red-500"}`,
                      fill: gettingLocation === type.toLowerCase() ? "currentColor" : "none"
                    }
                  )
                }
              )
            ] })
          ] })
        ] }, type)),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: `${stableFormId}-mobile-name`, className: "text-[10px] font-bold text-gray-700 uppercase mb-0.5 block", children: isTa ? "பெயர்" : "Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: `${stableFormId}-mobile-name`,
              value: name,
              onChange: (e) => {
                setName(e.target.value);
                activeValidate("name", e.target.value);
              },
              placeholder: isTa ? "பெயர்" : "Name",
              className: `w-full bg-gray-50 border rounded-lg px-3 py-3 text-sm outline-none min-h-[48px] ${errors.name ? "border-red-500" : "border-gray-200 focus:ring-1 focus:ring-red-500"}`
            }
          ),
          errors.name && /* @__PURE__ */ jsx("p", { className: "text-[8px] text-red-500", role: "alert", children: errors.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: `${stableFormId}-mobile-phone`, className: "text-[10px] font-bold text-gray-700 uppercase mb-0.5 block", children: isTa ? "தொலைபேசி" : "Phone" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: `${stableFormId}-mobile-phone`,
              value: phone,
              onChange: (e) => {
                setPhone(e.target.value);
                activeValidate("phone", e.target.value);
              },
              placeholder: isTa ? "எண்" : "Mobile",
              className: `w-full bg-gray-50 border rounded-lg px-3 py-3 text-sm outline-none min-h-[48px] ${errors.phone ? "border-red-500" : "border-gray-200 focus:ring-1 focus:ring-red-500"}`
            }
          ),
          errors.phone && /* @__PURE__ */ jsx("p", { className: "text-[8px] text-red-500", role: "alert", children: errors.phone })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: `${stableFormId}-mobile-date`, className: "text-[10px] font-bold text-gray-700 uppercase mb-0.5 block", children: isTa ? "தேதி" : "Date" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: `${stableFormId}-mobile-date`,
              type: "datetime-local",
              value: date,
              onChange: (e) => setDate(e.target.value),
              className: "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[48px]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: `${stableFormId}-mobile-pax`, className: "text-[10px] font-bold text-gray-700 uppercase mb-0.5 block", children: isTa ? "பயணிகள்" : "Passengers" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              id: `${stableFormId}-mobile-pax`,
              value: passengers,
              onChange: (e) => {
                setPassengers(e.target.value);
                setShowResult(false);
              },
              className: "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[48px] appearance-none",
              children: [
                /* @__PURE__ */ jsxs("option", { value: "4", children: [
                  "4 ",
                  isTa ? "பேர்" : "Pax"
                ] }),
                /* @__PURE__ */ jsxs("option", { value: "6", children: [
                  "6 ",
                  isTa ? "பேர்" : "Pax"
                ] }),
                /* @__PURE__ */ jsxs("option", { value: "7", children: [
                  "7 ",
                  isTa ? "பேர்" : "Pax"
                ] }),
                /* @__PURE__ */ jsxs("option", { value: "12", children: [
                  "12 ",
                  isTa ? "பேர்" : "Pax"
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: `${stableFormId}-mobile-veh`, className: "text-[10px] font-bold text-gray-700 uppercase mb-0.5 block", children: isTa ? "வாகனம்" : "Vehicle" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              id: `${stableFormId}-mobile-veh`,
              value: vehicle,
              onChange: (e) => {
                setVehicle(e.target.value);
                setShowResult(false);
              },
              className: "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[48px] appearance-none",
              children: vehicleOptions.map((v) => /* @__PURE__ */ jsx("option", { value: v, children: v }, v))
            }
          )
        ] }),
        activeTab === "round" && /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: `${stableFormId}-mobile-days`, className: "text-[10px] font-bold text-gray-700 uppercase mb-0.5 block", children: isTa ? "நாட்கள்" : "Days" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: `${stableFormId}-mobile-days`,
              type: "number",
              min: "1",
              value: days,
              onChange: (e) => {
                setDays(e.target.value);
                setShowResult(false);
              },
              className: "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[48px]"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "pt-4", children: !showResult ? /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setShowResult(true),
          className: "w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center shadow-lg active:scale-95 min-h-[56px]",
          children: [
            isTa ? "செலவைக் கணக்கிடுங்கள்" : "Calculate Cost",
            " ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
          ]
        }
      ) : /* @__PURE__ */ jsx("div", { className: "space-y-4 animate-in fade-in slide-in-from-top-2 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 rounded-xl p-4 border border-emerald-100", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-emerald-700 font-bold uppercase", children: isTa ? "மொத்த மதிப்பீடு" : "Total Estimate" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black text-slate-800", children: [
              "₹ ",
              estimate > 0 ? estimate.toLocaleString() : "0"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-500 text-right", children: distance ? `${distance.toFixed(1)} km` : "" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleWhatsApp,
            disabled: estimate === 0,
            className: "w-full mt-3 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 min-h-[56px]",
            children: [
              /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }),
              " ",
              isTa ? "வாட்ஸ்அப்பில் முன்பதிவு செய்ய" : "Book on WhatsApp"
            ]
          }
        )
      ] }) }) })
    ] }),
    mounted && /* @__PURE__ */ jsx(
      LocationPicker,
      {
        isOpen: locationPickerOpen,
        onClose: () => setLocationPickerOpen(false),
        onConfirm: handleLocationConfirm,
        type: pickerField
      }
    )
  ] });
}

export { QuotationEngine as Q, trackEvent as t };
