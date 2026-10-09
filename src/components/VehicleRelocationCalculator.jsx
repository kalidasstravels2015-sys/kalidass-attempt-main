import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Calculator,
  ArrowRight,
  Info,
  Car,
  AlertCircle
} from 'lucide-react';
import tnBusFares from '../data/tnBusFares.json';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import { trackCalculatorQuote, markQuoteConverted } from '../lib/analytics';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { buildWhatsAppUrl } from '../utils/whatsapp';

const COMMON_DISTANCES = {
  'chennai': 0, 'pondicherry': 151, 'puducherry': 151, 'bangalore': 346,
  'bengaluru': 346, 'tirupati': 135, 'vellore': 137, 'kanchipuram': 75,
  'mahabalipuram': 56, 'trichy': 332, 'tiruchirappalli': 332, 'madurai': 462,
  'coimbatore': 505, 'salem': 340, 'thanjavur': 342, 'tirunelveli': 624,
  'kanyakumari': 708, 'rameshwaram': 575, 'kodaikanal': 530, 'ooty': 555,
  'munnar': 580, 'mysore': 480, 'tiruvannamalai': 195, 'chidambaram': 215,
  'kumbakonam': 298, 'nagapattinam': 315, 'velankanni': 325, 'yelagiri': 230,
  'yercaud': 365, 'hosur': 305, 'krishnagiri': 260, 'erode': 395,
  'tirupur': 460, 'dindigul': 420, 'karur': 375, 'cuddalore': 180,
  'villupuram': 165, 'chengalpattu': 55, 'tambaram': 30, 'sriperumbudur': 45,
  'nellore': 175, 'vijayawada': 450, 'hyderabad': 630,
};

const CHENNAI_FORMS = [
  'chennai', 'airport', 'tambaram', 'guindy', 'koyambedu', 'egmore', 'central',
  'pallavaram', 'velachery', 'porur', 'annanagar', 'anna nagar', 't nagar', 't. nagar',
  'sholinganallur', 'omr', 'ecr', 'perungudi', 'thiruvanmiyur', 'adyar', 'mylapore',
  'chromepet', 'medavakkam', 'madipakkam', 'alandur', 'vadapalani', 'ambattur', 'avadi',
  'poonamallee', 'kolathur', 'redhills', 'kilpauk', 'nungambakkam', 'triplicane', 'royapettah'
];

const findKnownRelocationDistance = (origin, dest) => {
  const o = (origin || '').toLowerCase().trim();
  const d = (dest || '').toLowerCase().trim();
  if (!o && !d) return null;

  // 1. Check tnBusFares table
  if (o && d) {
    const busRoute = tnBusFares.find(r =>
      (o.includes(r.source) && d.includes(r.destination)) ||
      (o.includes(r.destination) && d.includes(r.source))
    );
    if (busRoute) return { distance: busRoute.distanceKm, setcFare: busRoute.setcFare };
  }

  // 2. Chennai metro check
  const isOChennai = CHENNAI_FORMS.some(k => o.includes(k));
  const isDChennai = CHENNAI_FORMS.some(k => d.includes(k));

  if (isOChennai || isDChennai) {
    const other = isOChennai ? d : o;
    for (const [city, km] of Object.entries(COMMON_DISTANCES)) {
      if (other && other.includes(city)) return { distance: km, setcFare: Math.round(km * 1.2) };
    }
  }

  const candidate = d || o;
  for (const [city, km] of Object.entries(COMMON_DISTANCES)) {
    if (candidate && candidate.includes(city)) {
      return { distance: km, setcFare: Math.round(km * 1.2) };
    }
  }

  return null;
};

export default function VehicleRelocationCalculator({ currentLang = 'en' }) {
  // Calculator State
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  
  const pickupRef = useRef(null);
  const dropRef = useRef(null);

  // Google Maps Init
  useEffect(() => {
    loadGoogleMaps().catch(() => {});
    const initPlaces = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) return;
      
      const options = {
        componentRestrictions: { country: "in" },
        fields: ["geometry", "name", "formatted_address"],
        strictBounds: false,
      };

      if (pickupRef.current && !pickupRef.current.dataset.googleAttached) {
        const autocompletePickup = new window.google.maps.places.Autocomplete(pickupRef.current, options);
        autocompletePickup.addListener('place_changed', () => {
          const place = autocompletePickup.getPlace();
          const addr = place.formatted_address || place.name;
          if (addr) {
            setPickup(addr);
            setFieldErrors(prev => ({ ...prev, pickup: undefined }));
            setResult(null);
          }
        });
        pickupRef.current.dataset.googleAttached = "true";
      }
      if (dropRef.current && !dropRef.current.dataset.googleAttached) {
        const autocompleteDrop = new window.google.maps.places.Autocomplete(dropRef.current, options);
        autocompleteDrop.addListener('place_changed', () => {
          const place = autocompleteDrop.getPlace();
          const addr = place.formatted_address || place.name;
          if (addr) {
            setDrop(addr);
            setFieldErrors(prev => ({ ...prev, drop: undefined }));
            setResult(null);
          }
        });
        dropRef.current.dataset.googleAttached = "true";
      }
    };

    if (window.google && window.google.maps && window.google.maps.places) {
      initPlaces();
    } else {
      window.addEventListener('google-maps-loaded', initPlaces);
      const timer = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          initPlaces();
          clearInterval(timer);
        }
      }, 400);
      return () => {
        window.removeEventListener('google-maps-loaded', initPlaces);
        clearInterval(timer);
      };
    }
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

    trackCalculatorQuote({
      calculatorId: 'vehicle_relocation',
      calculatorEngine: 'Intercity Vehicle Relocation Estimator',
      tripType: 'Vehicle Relocation',
      pickup: pickup || 'Chennai',
      drop: drop || 'N/A',
      vehicle: 'Relocation Chauffeur',
      distanceKm: dist,
      estimatedFare: total,
      meta: {
        duration,
        driverBata: BATA_PER_DAY,
        foodAllowance: FOOD_PER_DAY,
        returnBusFare: busFare
      }
    });
  };

  const calculateCost = () => {
    setError('');
    const newFieldErrors = {};
    if (!pickup.trim()) newFieldErrors.pickup = 'Please enter pickup city.';
    if (!drop.trim()) newFieldErrors.drop = 'Please enter drop city.';

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError('Please enter both pickup and destination cities.');
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setResult(null);
    loadGoogleMaps().catch(() => {});

    // 1. Local Lookup
    const known = findKnownRelocationDistance(pickup, drop);
    if (known) {
      setTimeout(() => {
        const realDist = known.distance;
        const durationText = Math.max(1, Math.round(realDist / 50)) + " hrs (Est)";
        const busFare = known.setcFare || Math.round(realDist * 1.2);
        finalizeCalculation(realDist, durationText, busFare);
      }, 150);
      return;
    }

    // 2. Google Distance Matrix API
    if (window.google && window.google.maps && window.google.maps.DistanceMatrixService) {
      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [pickup],
          destinations: [drop],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status === "OK" && response?.rows?.[0]?.elements?.[0]?.status === "OK") {
            const element = response.rows[0].elements[0];
            const distanceInMeters = element.distance.value;
            const realDist = Math.round(distanceInMeters / 1000);
            const durationText = element.duration.text;
            const calculatedFare = Math.round(realDist * 1.2);
            finalizeCalculation(realDist, durationText, calculatedFare);
            return;
          }
          // Fallback if Google Maps fails to find exact route
          finalizeCalculation(300, '6 hrs (Est)', 360);
        }
      );
      return;
    }

    // 3. Fallback when offline or distance matrix unavailable
    finalizeCalculation(300, '6 hrs (Est)', 360);
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

      {error && (
        <div className="mb-4 p-2.5 bg-m3-error-container/40 text-m3-error text-xs font-bold rounded-m3-md flex items-center gap-2 border border-m3-error/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
       
      <div className="space-y-4">
        <div>
          <label className="block text-badge font-bold text-m3-on-surface-variant uppercase mb-1.5">
            Pickup City
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-m3-on-surface-variant" />
            <input 
              id="vr-pickup-input"
              ref={pickupRef}
              type="text" 
              value={pickup}
              placeholder="e.g. Coimbatore"
              className={`w-full pl-10 pr-4 py-3 bg-m3-surface border rounded-m3-md outline-none text-sm font-medium text-m3-on-surface transition-all ${
                fieldErrors.pickup 
                  ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/20' 
                  : 'border-m3-outline focus:border-m3-primary focus:ring-2 focus:ring-m3-primary'
              }`}
              onFocus={() => loadGoogleMaps().catch(() => {})}
              onChange={(e) => {
                setPickup(e.target.value);
                setFieldErrors(prev => ({ ...prev, pickup: undefined }));
                setError('');
              }}
            />
          </div>
          {fieldErrors.pickup && (
            <p className="mt-1 text-xs text-m3-error font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors.pickup}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-badge font-bold text-m3-on-surface-variant uppercase mb-1.5">
            Drop City
          </label>
          <div className="relative">
            <Navigation className="absolute left-3.5 top-3.5 w-4 h-4 text-m3-on-surface-variant" />
            <input 
              id="vr-drop-input"
              ref={dropRef}
              type="text" 
              value={drop}
              placeholder="e.g. Chennai"
              className={`w-full pl-10 pr-4 py-3 bg-m3-surface border rounded-m3-md outline-none text-sm font-medium text-m3-on-surface transition-all ${
                fieldErrors.drop 
                  ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/20' 
                  : 'border-m3-outline focus:border-m3-primary focus:ring-2 focus:ring-m3-primary'
              }`}
              onFocus={() => loadGoogleMaps().catch(() => {})}
              onChange={(e) => {
                setDrop(e.target.value);
                setFieldErrors(prev => ({ ...prev, drop: undefined }));
                setError('');
              }}
            />
          </div>
          {fieldErrors.drop && (
            <p className="mt-1 text-xs text-m3-error font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors.drop}</span>
            </p>
          )}
        </div>

        <button 
          id="vr-calc-btn"
          type="button"
          onPointerDown={() => {
            if (typeof document !== 'undefined' && document.activeElement && typeof document.activeElement.blur === 'function') {
              document.activeElement.blur();
            }
          }}
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

          {/* WhatsApp CTA */}
          <div className="mt-4 flex justify-center">
            <WhatsAppButton
              href={buildWhatsAppUrl(
                `Hi Kalidass Travels, I need Vehicle Relocation:\n\n• Pickup: ${pickup}\n• Drop: ${drop}\n• Distance: ~${result.dist} km\n• Est. Total: ₹${result.total.toLocaleString('en-IN')}\n\nPlease confirm chauffeur availability.`
              )}
              onClick={() => {
                markQuoteConverted(null, {
                  calculatorId: 'vehicle_relocation',
                  tripType: 'Vehicle Relocation',
                  pickup,
                  drop,
                  estimate: result.total
                });
              }}
              variant="filled"
              size="md"
              text="Book Relocation on WhatsApp"
            />
          </div>
        </div>
      )}
    </div>
  );
}
