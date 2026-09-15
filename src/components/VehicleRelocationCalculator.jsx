import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Calculator,
  ArrowRight,
  Info,
  Car
} from 'lucide-react';
import tnBusFares from '../data/tnBusFares.json';

export default function VehicleRelocationCalculator({ currentLang = 'en' }) {
  // Calculator State
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const pickupRef = useRef(null);
  const dropRef = useRef(null);

  // Google Maps Init
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
          strictBounds: false,
        };

        if (pickupRef.current) {
            const autocompletePickup = new window.google.maps.places.Autocomplete(pickupRef.current, options);
            autocompletePickup.addListener('place_changed', () => {
                const place = autocompletePickup.getPlace();
                if (place.name) setPickup(place.name);
            });
        }
        if (dropRef.current) {
            const autocompleteDrop = new window.google.maps.places.Autocomplete(dropRef.current, options);
            autocompleteDrop.addListener('place_changed', () => {
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
    const BATA_PER_DAY = 1000;
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

    // 1. Local Lookup
    const p = pickup.toLowerCase();
    const d = drop.toLowerCase();
    const route = tnBusFares.find(r => 
      (p.includes(r.source) && d.includes(r.destination)) ||
      (p.includes(r.destination) && d.includes(r.source))
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

    // 2. API Lookup
    if (window.google && window.google.maps) {
      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [pickup],
          destinations: [drop],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
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
          const realDist = Math.round(distanceInMeters / 1000);
          const durationText = element.duration.text;
          const calculatedFare = Math.round(realDist * 1.2); // Fallback fare

          finalizeCalculation(realDist, durationText, calculatedFare);
        }
      );
    } else {
      alert("Google Maps API not loaded");
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-m3-surface rounded-m3-xl shadow-m3-2 border border-m3-outline-variant overflow-hidden max-w-md mx-auto font-sans p-6 text-m3-on-surface">
       <div className="flex flex-col items-center text-center gap-2 mb-6">
         <div className="w-12 h-12 rounded-m3-full bg-m3-surface-container-high border border-m3-outline-variant flex items-center justify-center text-m3-primary">
           <Car className="w-6 h-6 text-m3-primary" />
         </div>
         <div>
           <h3 className="font-bold text-m3-on-surface text-xl font-heading">
             Vehicle Relocation Quote
           </h3>
           <p className="text-xs text-m3-on-surface-variant font-normal">
             Estimate your relocation cost
           </p>
         </div>
       </div>
       
       <div className="space-y-4">
         <div>
           <label className="block text-badge font-bold text-m3-on-surface-variant uppercase mb-1.5">
             Pickup City
           </label>
           <div className="relative">
             <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-m3-on-surface-variant" />
              <input 
                ref={pickupRef}
                type="text" 
                placeholder="e.g. Coimbatore"
                className="w-full pl-10 pr-4 py-3 bg-m3-surface border border-m3-outline rounded-m3-md focus:border-m3-primary focus:ring-2 focus:ring-m3-primary outline-none text-sm font-medium text-m3-on-surface transition-all"
                onChange={(e) => setPickup(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-badge font-bold text-m3-on-surface-variant uppercase mb-1.5">
              Drop City
            </label>
            <div className="relative">
              <Navigation className="absolute left-3.5 top-3.5 w-4 h-4 text-m3-on-surface-variant" />
              <input 
                ref={dropRef}
                type="text" 
                placeholder="e.g. Chennai"
                className="w-full pl-10 pr-4 py-3 bg-m3-surface border border-m3-outline rounded-m3-md focus:border-m3-primary focus:ring-2 focus:ring-m3-primary outline-none text-sm font-medium text-m3-on-surface transition-all"
                onChange={(e) => setDrop(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={calculateCost}
            disabled={loading}
            className="w-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary font-bold py-3.5 rounded-m3-full transition-all flex items-center justify-center shadow-m3-2 hover:shadow-m3-3 disabled:opacity-70 active:scale-[0.98] cursor-pointer text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary focus-visible:ring-offset-2"
          >
            {loading ? (
              <span>Calculating...</span>
            ) : (
              <span className="flex items-center">
                <span>Calculate Cost</span>
                <ArrowRight className="w-4 h-4 ml-2 text-white" />
              </span>
            )}
          </button>

          <div className="mt-3 p-3.5 bg-m3-surface-container-low border border-m3-outline-variant rounded-m3-md flex gap-2.5 items-start">
            <Info className="w-4 h-4 text-m3-primary shrink-0 mt-0.5" />
            <p className="text-xs text-m3-on-surface-variant leading-relaxed font-medium font-sans">
              <span className="font-bold">Note:</span> Fuel & Tolls are extra. Driver travel cost is reimbursed at actuals (Bus/Train).
            </p>
          </div>
       </div>

       {result && (
         <div className="mt-6 pt-6 border-t border-m3-outline-variant/50 animate-in fade-in slide-in-from-top-2">
           <div className="flex justify-between items-end mb-4">
             <div>
               <p className="text-micro font-bold text-m3-on-surface-variant uppercase mb-1">
                 Estimated Total
               </p>
               <p className="text-3xl font-extrabold text-m3-on-surface tracking-tight font-heading">₹{result.total}</p>
             </div>
             <div className="text-right">
               <p className="text-sm font-bold text-m3-on-surface font-heading">{result.dist} km</p>
               <p className="text-xs text-m3-on-surface-variant">{result.duration}</p>
             </div>
           </div>

           <div className="space-y-2 text-sm bg-m3-surface-container-low p-3.5 rounded-m3-md border border-m3-outline-variant/60 font-sans">
             <div className="flex justify-between">
               <span className="text-m3-on-surface-variant">
                 Driver Bata
               </span>
               <span className="font-bold text-m3-on-surface">₹{result.breakdown.bata}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-m3-on-surface-variant">
                 Food Allowance
               </span>
               <span className="font-bold text-m3-on-surface">₹{result.breakdown.food}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-m3-on-surface-variant">
                 Return Travel (Est)
               </span>
               <span className="font-bold text-m3-on-surface">₹{result.breakdown.bus}</span>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
