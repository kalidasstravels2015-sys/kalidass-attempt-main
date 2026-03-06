import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useRef, useEffect } from 'react';
import { Car, MapPin, Navigation, ArrowRight, Info } from 'lucide-react';
import { t as tnBusFares } from './tnBusFares_B5zzAJts.mjs';

function VehicleRelocationCalculator() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const pickupRef = useRef(null);
  const dropRef = useRef(null);
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50;
    const intervalId = setInterval(() => {
      attempts++;
      if (window.google && window.google.maps && window.google.maps.places) {
        clearInterval(intervalId);
        const options = {
          componentRestrictions: { country: "in" },
          fields: ["geometry", "name"],
          strictBounds: false
        };
        if (pickupRef.current) {
          const autocompletePickup = new window.google.maps.places.Autocomplete(pickupRef.current, options);
          autocompletePickup.addListener("place_changed", () => {
            const place = autocompletePickup.getPlace();
            if (place.name) setPickup(place.name);
          });
        }
        if (dropRef.current) {
          const autocompleteDrop = new window.google.maps.places.Autocomplete(dropRef.current, options);
          autocompleteDrop.addListener("place_changed", () => {
            const place = autocompleteDrop.getPlace();
            if (place.name) setDrop(place.name);
          });
        }
      } else if (attempts >= maxAttempts) {
        clearInterval(intervalId);
      }
    }, 100);
    return () => clearInterval(intervalId);
  }, []);
  const finalizeCalculation = (dist, duration, busFare) => {
    const BATA_PER_DAY = 1e3;
    const FOOD_PER_DAY = 300;
    const total = BATA_PER_DAY + FOOD_PER_DAY + busFare;
    setResult({
      total,
      dist,
      duration,
      breakdown: {
        bata: BATA_PER_DAY,
        food: FOOD_PER_DAY,
        bus: busFare
      }
    });
    setLoading(false);
  };
  const calculateCost = () => {
    if (!pickup || !drop) {
      alert("Please enter both locations");
      return;
    }
    setLoading(true);
    setResult(null);
    const p = pickup.toLowerCase();
    const d = drop.toLowerCase();
    const route = tnBusFares.find(
      (r) => p.includes(r.source) && d.includes(r.destination) || p.includes(r.destination) && d.includes(r.source)
    );
    if (route) {
      setTimeout(() => {
        const realDist = route.distanceKm;
        const durationText = Math.round(realDist / 50) + " hrs (Est)";
        const busFare = route.setcFare;
        finalizeCalculation(realDist, durationText, busFare);
      }, 600);
      return;
    }
    if (window.google && window.google.maps) {
      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [pickup],
          destinations: [drop],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC
        },
        (response, status) => {
          if (status !== "OK") {
            alert("Error with distance service");
            setLoading(false);
            return;
          }
          const row = response.rows[0];
          if (!row) {
            setLoading(false);
            return;
          }
          const element = row.elements[0];
          if (element.status !== "OK") {
            alert("Could not calculate distance.");
            setLoading(false);
            return;
          }
          const distanceInMeters = element.distance.value;
          const realDist = Math.round(distanceInMeters / 1e3);
          const durationText = element.duration.text;
          const calculatedFare = Math.round(realDist * 1.2);
          finalizeCalculation(realDist, durationText, calculatedFare);
        }
      );
    } else {
      alert("Google Maps API not loaded");
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-w-md mx-auto font-sans p-6 text-slate-900", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-2 mb-6", children: [
      /* @__PURE__ */ jsx(Car, { className: "w-10 h-10 text-green-600" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-900 text-xl", children: [
          /* @__PURE__ */ jsx("span", { className: "lang-en", children: "Vehicle Relocation Quote" }),
          /* @__PURE__ */ jsx("span", { className: "lang-ta", children: "வாகன இடமாற்ற மதிப்பீடு" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
          /* @__PURE__ */ jsx("span", { className: "lang-en", children: "Estimate your relocation cost" }),
          /* @__PURE__ */ jsx("span", { className: "lang-ta", children: "உங்கள் இடமாற்ற செலவை மதிப்பிடுங்கள்" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-[10px] font-bold text-slate-400 uppercase mb-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "lang-en", children: "Pickup City" }),
          /* @__PURE__ */ jsx("span", { className: "lang-ta", children: "புறப்படும் நகரம்" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-3 w-4 h-4 text-slate-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: pickupRef,
              type: "text",
              placeholder: "e.g. Coimbatore",
              className: "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium",
              onChange: (e) => setPickup(e.target.value)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-[10px] font-bold text-slate-400 uppercase mb-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "lang-en", children: "Drop City" }),
          /* @__PURE__ */ jsx("span", { className: "lang-ta", children: "சேரும் நகரம்" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Navigation, { className: "absolute left-3 top-3 w-4 h-4 text-slate-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: dropRef,
              type: "text",
              placeholder: "e.g. Chennai",
              className: "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium",
              onChange: (e) => setDrop(e.target.value)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: calculateCost,
          disabled: loading,
          className: "w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center shadow-lg disabled:opacity-70",
          children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "lang-en", children: "Calculating..." }),
            /* @__PURE__ */ jsx("span", { className: "lang-ta", children: "கணக்கிடுகிறது..." })
          ] }) : /* @__PURE__ */ jsxs("span", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx("span", { className: "lang-en", children: "Calculate Cost" }),
            /* @__PURE__ */ jsx("span", { className: "lang-ta", children: "செலவை கணக்கிடு" }),
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
          ] })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-2 items-start", children: [
        /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 text-yellow-600 shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-yellow-800 leading-relaxed font-medium", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
            /* @__PURE__ */ jsx("span", { className: "lang-en", children: "Note:" }),
            /* @__PURE__ */ jsx("span", { className: "lang-ta", children: "குறிப்பு:" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "lang-en", children: " Fuel & Tolls are extra. Driver travel cost is reimbursed at actuals (Bus/Train)." }),
          /* @__PURE__ */ jsx("span", { className: "lang-ta", children: " எரிபொருள் & சுங்கச்சாவடி கட்டணம் தனி. ஓட்டுநர் பயண செலவு (பேருந்து/ரயில்) திரும்ப வழங்கப்படும்." })
        ] })
      ] })
    ] }),
    result && /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end mb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold text-slate-400 uppercase mb-1", children: [
            /* @__PURE__ */ jsx("span", { className: "lang-en", children: "Estimated Total" }),
            /* @__PURE__ */ jsx("span", { className: "lang-ta", children: "மொத்த மதிப்பீடு" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-3xl font-extrabold text-slate-900 tracking-tight", children: [
            "₹",
            result.total
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-slate-600", children: [
            result.dist,
            " km"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: result.duration })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm bg-slate-50 p-3 rounded-lg", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-slate-600", children: [
            /* @__PURE__ */ jsx("span", { className: "lang-en", children: "Driver Bata" }),
            /* @__PURE__ */ jsx("span", { className: "lang-ta", children: "ஓட்டுநர் பேட்டா" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-900", children: [
            "₹",
            result.breakdown.bata
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-slate-600", children: [
            /* @__PURE__ */ jsx("span", { className: "lang-en", children: "Food Allowance" }),
            /* @__PURE__ */ jsx("span", { className: "lang-ta", children: "உணவு படி" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-900", children: [
            "₹",
            result.breakdown.food
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-slate-600", children: [
            /* @__PURE__ */ jsx("span", { className: "lang-en", children: "Return Travel (Est)" }),
            /* @__PURE__ */ jsx("span", { className: "lang-ta", children: "திரும்பும் பயணம் (மதிப்பீடு)" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-900", children: [
            "₹",
            result.breakdown.bus
          ] })
        ] })
      ] })
    ] })
  ] });
}

export { VehicleRelocationCalculator as V };
