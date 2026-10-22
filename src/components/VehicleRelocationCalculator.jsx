import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Calculator,
  ArrowRight,
  Info,
  Car,
  AlertCircle,
  X
} from 'lucide-react';
import LocationPicker from './LocationPicker';
import tnBusFares from '../data/tnBusFares.json';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import { trackCalculatorQuote, markQuoteConverted } from '../lib/analytics';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { buildWhatsAppUrl, buildMapsLinks } from '../utils/whatsapp';

const COMMON_DISTANCES = {
  'pondicherry': 151, 'puducherry': 151, 'karaikal': 295, 'thiruvettakudy': 285, 'nitpy': 285, 'thirunallar': 295, 'bangalore': 346,
  'bengaluru': 346, 'tirupati': 135, 'vellore': 137, 'kanchipuram': 75,
  'mahabalipuram': 56, 'mamallapuram': 56, 'trichy': 332, 'tiruchirappalli': 332, 'madurai': 462,
  'coimbatore': 505, 'salem': 340, 'thanjavur': 342, 'tanjore': 342, 'tirunelveli': 624,
  'kanyakumari': 708, 'rameshwaram': 575, 'rameswaram': 575, 'kodaikanal': 530, 'ooty': 555,
  'udhagamandalam': 555, 'munnar': 580, 'mysore': 480, 'mysuru': 480, 'tiruvannamalai': 195,
  'thiruvannamalai': 195, 'chidambaram': 215, 'kumbakonam': 298, 'nagapattinam': 315,
  'velankanni': 325, 'yelagiri': 230, 'yercaud': 365, 'hosur': 305, 'krishnagiri': 260,
  'erode': 395, 'tirupur': 460, 'tiruppur': 460, 'dindigul': 420, 'karur': 375,
  'cuddalore': 180, 'villupuram': 165, 'chengalpattu': 55, 'sriperumbudur': 45,
  'nellore': 175, 'vijayawada': 450, 'hyderabad': 630, 'kochi': 690, 'cochin': 690,
  'trivandrum': 770, 'thiruvananthapuram': 770, 'palani': 485, 'tuticorin': 605,
  'thoothukudi': 605, 'nagercoil': 690, 'tenkasi': 610, 'karaikudi': 415,
  'pollachi': 535, 'coonoor': 540, 'valparai': 585, 'namakkal': 380,
};

const CITY_COORDS = {
  'chennai': [13.0827, 80.2707],
  'pondicherry': [11.9416, 79.8083],
  'puducherry': [11.9416, 79.8083],
  'bangalore': [12.9716, 77.5946],
  'bengaluru': [12.9716, 77.5946],
  'tirupati': [13.6288, 79.4192],
  'vellore': [12.9165, 79.1325],
  'kanchipuram': [12.8342, 79.7036],
  'mahabalipuram': [12.6208, 80.1945],
  'mamallapuram': [12.6208, 80.1945],
  'trichy': [10.7905, 78.7047],
  'tiruchirappalli': [10.7905, 78.7047],
  'madurai': [9.9252, 78.1198],
  'coimbatore': [11.0168, 76.9558],
  'salem': [11.6643, 78.1460],
  'thanjavur': [10.7870, 79.1378],
  'tanjore': [10.7870, 79.1378],
  'tirunelveli': [8.7139, 77.7567],
  'kanyakumari': [8.0883, 77.5385],
  'rameshwaram': [9.2876, 79.3129],
  'rameswaram': [9.2876, 79.3129],
  'kodaikanal': [10.2381, 77.4892],
  'ooty': [11.4102, 76.6950],
  'udhagamandalam': [11.4102, 76.6950],
  'munnar': [10.0889, 77.0595],
  'mysore': [12.2958, 76.6394],
  'mysuru': [12.2958, 76.6394],
  'tiruvannamalai': [12.2253, 79.0747],
  'thiruvannamalai': [12.2253, 79.0747],
  'chidambaram': [11.3992, 79.6939],
  'kumbakonam': [10.9602, 79.3845],
  'nagapattinam': [10.7672, 79.8449],
  'velankanni': [10.6819, 79.8437],
  'yelagiri': [12.5794, 78.6398],
  'yercaud': [11.7753, 78.2093],
  'hosur': [12.7409, 77.8253],
  'krishnagiri': [12.5186, 78.2137],
  'erode': [11.3410, 77.7172],
  'tirupur': [11.1085, 77.3411],
  'tiruppur': [11.1085, 77.3411],
  'dindigul': [10.3624, 77.9695],
  'karur': [10.9601, 78.0766],
  'cuddalore': [11.7480, 79.7714],
  'villupuram': [11.9401, 79.4861],
  'chengalpattu': [12.6819, 79.9888],
  'sriperumbudur': [12.9675, 79.9419],
  'nellore': [14.4426, 79.9865],
  'vijayawada': [16.5062, 80.6480],
  'hyderabad': [17.3850, 78.4867],
  'kochi': [9.9312, 76.2673],
  'cochin': [9.9312, 76.2673],
  'trivandrum': [8.5241, 76.9366],
  'thiruvananthapuram': [8.5241, 76.9366],
  'palani': [10.4500, 77.5161],
  'tuticorin': [8.7642, 78.1348],
  'thoothukudi': [8.7642, 78.1348],
  'nagercoil': [8.1833, 77.4119],
  'tenkasi': [8.9594, 77.3161],
  'karaikudi': [10.0735, 78.7732],
  'pollachi': [10.6609, 77.0048],
  'coonoor': [11.3530, 76.7959],
  'valparai': [10.3270, 76.9554],
  'namakkal': [11.2189, 78.1674],
};

const CHENNAI_FORMS = [
  'chennai', 'airport', 'tambaram', 'guindy', 'koyambedu', 'egmore', 'central',
  'pallavaram', 'velachery', 'porur', 'annanagar', 'anna nagar', 't nagar', 't. nagar',
  'sholinganallur', 'omr', 'ecr', 'perungudi', 'thiruvanmiyur', 'adyar', 'mylapore',
  'chromepet', 'medavakkam', 'madipakkam', 'alandur', 'vadapalani', 'ambattur', 'avadi',
  'poonamallee', 'kolathur', 'redhills', 'kilpauk', 'nungambakkam', 'triplicane', 'royapettah',
  'perambur', 'kodambakkam', 'saidapet', 'ashok nagar', 'kk nagar', 'nanganallur', 'meenambakkam',
  'gst road', 'kelambakkam', 'siruseri', 'navalur', 'thoraipakkam', 'pallikaranai', 'urapakkam',
  'guduvancheri', 'maraimalai nagar', 'potheri', 'padappai', 'oragadam', 'enathur'
];

const estimateReturnBusFare = (distanceKm) => {
  return Math.max(150, Math.round((distanceKm * 1.1) / 10) * 10);
};

const getOneWayTier = (distKm) => {
  if (distKm > 650) {
    return { bataMultiplier: 2.5, foodMultiplier: 2.0, bataDaysLabel: '2.5 Days', tierNote: '>650 km Extreme Drop' };
  }
  if (distKm > 450) {
    return { bataMultiplier: 2.0, foodMultiplier: 1.5, bataDaysLabel: '2 Days', tierNote: '451–650 km Overnight Return' };
  }
  if (distKm > 250) {
    return { bataMultiplier: 1.5, foodMultiplier: 1.0, bataDaysLabel: '1.5 Days', tierNote: '251–450 km Medium-Long Drop' };
  }
  return { bataMultiplier: 1.0, foodMultiplier: 1.0, bataDaysLabel: '1 Day', tierNote: '' };
};

const calcRoadDistanceKm = (coordA, coordB) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(coordB[0] - coordA[0]);
  const dLon = toRad(coordB[1] - coordA[1]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coordA[0])) * Math.cos(toRad(coordB[0])) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightKm = R * c;
  return Math.max(35, Math.round(straightKm * 1.26));
};

const findKnownRelocationDistance = (origin, dest) => {
  const o = (origin || '').toLowerCase().trim();
  const d = (dest || '').toLowerCase().trim();
  if (!o && !d) return null;

  const isOChennai = CHENNAI_FORMS.some(k => o.includes(k));
  const isDChennai = CHENNAI_FORMS.some(k => d.includes(k));

  if (isOChennai && isDChennai) {
    return { distance: 35, setcFare: 150 };
  }

  const isKaraikalEnclave = (str) => {
    return str.includes('karaikal') || 
           str.includes('thiruvettakudy') || 
           str.includes('thirunallar') || 
           str.includes('nitpy') || 
           str.includes('nedungadu') || 
           str.includes('kottucherry') || 
           str.includes('neravy') || 
           str.includes('tr pattinam') ||
           /609\d{3}/.test(str);
  };

  if (isOChennai || isDChennai) {
    const target = isOChennai ? d : o;
    if (isKaraikalEnclave(target)) {
      return { distance: 285, setcFare: 330 };
    }
  }

  // 1. Check tnBusFares table (matching Chennai metro aliases to 'chennai')
  if (o && d) {
    const matches = tnBusFares.filter(r => {
      const matchSrcO = o.includes(r.source) || (r.source === 'chennai' && isOChennai);
      const matchDstD = d.includes(r.destination) || (r.destination === 'chennai' && isDChennai);
      const matchSrcD = d.includes(r.source) || (r.source === 'chennai' && isDChennai);
      const matchDstO = o.includes(r.destination) || (r.destination === 'chennai' && isOChennai);
      return (matchSrcO && matchDstD) || (matchSrcD && matchDstO);
    });
    if (matches.length > 0) {
      const target = isOChennai ? d : (isDChennai ? o : d);
      let best = matches[0];
      if (isKaraikalEnclave(target)) {
        const kMatch = matches.find(m => m.destination === 'karaikal' || m.destination === 'thiruvettakudy' || m.destination === 'nitpy');
        best = kMatch || { distanceKm: 285, setcFare: 330 };
      } else {
        best = matches.reduce((longest, curr) => 
          (curr.destination.length > longest.destination.length ? curr : longest), matches[0]
        );
      }
      return { distance: best.distanceKm, setcFare: best.setcFare };
    }
  }

  // 2. Chennai metro to/from known city
  if (isOChennai || isDChennai) {
    const other = isOChennai ? d : o;
    if (isKaraikalEnclave(other)) {
      return { distance: 285, setcFare: 330 };
    }
    for (const [city, km] of Object.entries(COMMON_DISTANCES)) {
      if (other && other.includes(city)) {
        if ((city === 'pondicherry' || city === 'puducherry') && isKaraikalEnclave(other)) {
          continue;
        }
        return { distance: km, setcFare: estimateReturnBusFare(km) };
      }
    }
  }

  // 3. Non-Chennai to Non-Chennai intercity lookup via CITY_COORDS
  if (o && d && !isOChennai && !isDChennai) {
    let coordO = null;
    let coordD = null;
    let cityO = null;
    let cityD = null;
    for (const [city, coords] of Object.entries(CITY_COORDS)) {
      if (!coordO && o.includes(city)) { coordO = coords; cityO = city; }
      if (!coordD && d.includes(city)) { coordD = coords; cityD = city; }
    }
    if (coordO && coordD) {
      if (cityO === cityD) return { distance: 35, setcFare: 300 };
      const roadKm = calcRoadDistanceKm(coordO, coordD);
      return { distance: roadKm, setcFare: estimateReturnBusFare(roadKm) };
    }
  }

  // 4. Single-input fallback when only one field has a known city
  if (!o || !d) {
    const candidate = d || o;
    for (const [city, km] of Object.entries(COMMON_DISTANCES)) {
      if (candidate && candidate.includes(city)) {
        return { distance: km, setcFare: estimateReturnBusFare(km) };
      }
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
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [pickerField, setPickerField] = useState('pickup');

  const handlePinClick = (field = 'pickup') => {
    loadGoogleMaps().catch(() => {});
    setPickerField(field);
    setLocationPickerOpen(true);
  };

  const handleLocationConfirm = (address) => {
    const clean = address ? address.trim() : '';
    if (pickerField === 'pickup') {
      setPickup(clean);
      setFieldErrors(prev => ({ ...prev, pickup: undefined }));
    } else {
      setDrop(clean);
      setFieldErrors(prev => ({ ...prev, drop: undefined }));
    }
    setResult(null);
    setLocationPickerOpen(false);
  };
  
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
    const BATA_PER_DAY = 1400;
    const FOOD_PER_DAY = 300;
    const tier = getOneWayTier(dist);
    const totalBata = Math.round(BATA_PER_DAY * tier.bataMultiplier);
    const totalFood = Math.round(FOOD_PER_DAY * tier.foodMultiplier);
    const total = totalBata + totalFood + busFare;

    setResult({
      total,
      dist,
      duration,
      bataDaysLabel: tier.bataDaysLabel,
      foodMultiplier: tier.foodMultiplier,
      breakdown: {
        bata: totalBata,
        food: totalFood,
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
        driverBata: totalBata,
        bataDaysLabel: tier.bataDaysLabel,
        foodAllowance: totalFood,
        returnBusFare: busFare
      }
    });
  };

  const calculateCost = async () => {
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

    // Ensure Google Maps is loaded
    if (typeof window !== 'undefined' && (!window.google || !window.google.maps || !window.google.maps.DistanceMatrixService)) {
      try {
        await Promise.race([
          loadGoogleMaps(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
        ]);
      } catch (_) {}
    }

    const fallbackCalculation = () => {
      const known = findKnownRelocationDistance(pickup, drop);
      if (known) {
        const realDist = known.distance;
        const durationText = Math.max(1, Math.round(realDist / 50)) + " hrs (Est)";
        const busFare = known.setcFare || estimateReturnBusFare(realDist);
        finalizeCalculation(realDist, durationText, busFare);
        return;
      }
      finalizeCalculation(300, '6 hrs (Est)', estimateReturnBusFare(300));
    };

    let resolved = false;
    const fallbackTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        fallbackCalculation();
      }
    }, 3500);

    // 1. Google Distance Matrix API (Primary)
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
          if (resolved) return;
          resolved = true;
          clearTimeout(fallbackTimer);
          if (status === "OK" && response?.rows?.[0]?.elements?.[0]?.status === "OK") {
            const element = response.rows[0].elements[0];
            const distanceInMeters = element.distance.value;
            const realDist = Math.round(distanceInMeters / 1000);
            const durationText = element.duration.text;
            const known = findKnownRelocationDistance(pickup, drop);
            const calculatedFare = known?.setcFare || estimateReturnBusFare(realDist);
            finalizeCalculation(realDist, durationText, calculatedFare);
            return;
          }
          fallbackCalculation();
        }
      );
      return;
    } else {
      if (!resolved) {
        resolved = true;
        clearTimeout(fallbackTimer);
        fallbackCalculation();
      }
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
              data-autocomplete-input="true"
              value={pickup}
              placeholder="e.g. Coimbatore"
              className={`w-full pl-10 pr-16 py-3 bg-m3-surface border rounded-m3-md outline-none text-sm font-medium text-m3-on-surface transition-all scroll-mt-20 sm:scroll-mt-24 ${
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
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {pickup && (
                <button type="button" onClick={() => { setPickup(''); setResult(null); }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-full text-m3-on-surface-variant">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handlePinClick('pickup')}
                className="w-7 h-7 flex items-center justify-center rounded-m3-sm hover:bg-m3-surface-container text-m3-primary hover:bg-m3-primary/10 transition-colors cursor-pointer"
                title="Pinpoint pickup on map"
                aria-label="Pinpoint pickup on map"
              >
                <MapPin className="w-4 h-4 text-m3-primary" />
              </button>
            </div>
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
              data-autocomplete-input="true"
              value={drop}
              placeholder="e.g. Chennai"
              className={`w-full pl-10 pr-16 py-3 bg-m3-surface border rounded-m3-md outline-none text-sm font-medium text-m3-on-surface transition-all scroll-mt-20 sm:scroll-mt-24 ${
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
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {drop && (
                <button type="button" onClick={() => { setDrop(''); setResult(null); }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-m3-surface-container-high rounded-m3-full text-m3-on-surface-variant">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handlePinClick('drop')}
                className="w-7 h-7 flex items-center justify-center rounded-m3-sm hover:bg-m3-surface-container text-m3-primary hover:bg-m3-primary/10 transition-colors cursor-pointer"
                title="Pinpoint destination on map"
                aria-label="Pinpoint destination on map"
              >
                <MapPin className="w-4 h-4 text-m3-primary" />
              </button>
            </div>
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
          className="w-full !bg-[#0B57D0] hover:!bg-[#0842A0] active:!bg-[#0842A0] active:scale-[0.98] !text-white font-bold py-3.5 rounded-m3-full transition-all flex items-center justify-center shadow-m3-2 hover:shadow-m3-3 disabled:opacity-70 cursor-pointer text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B57D0]"
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
              <p className="text-3xl font-extrabold text-m3-on-surface tracking-tight font-heading">
                ₹{result.total.toLocaleString('en-IN')} <span className="text-xs sm:text-sm font-semibold text-m3-on-surface-variant">+ Extra</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-m3-on-surface font-heading">{result.dist} km</p>
              <p className="text-xs text-m3-on-surface-variant">{result.duration}</p>
            </div>
          </div>

          <div className="space-y-1.5 text-[13px] sm:text-sm bg-slate-100 p-3.5 rounded-m3-md border border-slate-200 font-sans">
            <div className="flex justify-between">
              <span className="text-m3-on-surface-variant">
                Driver Bata ({result.bataDaysLabel || '1 Day'})
              </span>
              <span className="font-bold text-m3-on-surface">₹{result.breakdown.bata.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-m3-on-surface-variant">
                Food Allowance{result.foodMultiplier > 1 ? ` (${result.foodMultiplier} Days)` : ''}
              </span>
              <span className="font-bold text-m3-on-surface">₹{result.breakdown.food.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-m3-on-surface-variant">
                Return Travel (Est)
              </span>
              <span className="font-bold text-m3-on-surface">₹{result.breakdown.bus.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-m3-on-surface-variant">
                State Permit
              </span>
              <span className="font-bold text-m3-on-surface">₹0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-m3-on-surface-variant">
                Tolls
              </span>
              <span className="font-bold text-m3-on-surface">Extra</span>
            </div>
            <div className="flex justify-between">
              <span className="text-m3-on-surface-variant">
                Fuel
              </span>
              <span className="font-bold text-m3-on-surface">Extra</span>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="mt-4 flex justify-center">
            <WhatsAppButton
              href={buildWhatsAppUrl((() => {
                const { pickupPin, directions } = buildMapsLinks(pickup, drop, 'oneway');
                const mapsBlock = (pickupPin || directions)
                  ? `\n\n🗺️ NAVIGATION LINKS:\n` +
                    (pickupPin  ? `• 📍 Pickup Pin: ${pickupPin}\n`  : '') +
                    (directions ? `• 🧭 Route Map: ${directions}`    : '')
                  : '';
                return `Hi Kalidass Travels, I need Vehicle Relocation:\n\n• Pickup: ${pickup}\n• Drop: ${drop}\n• Distance: ~${result.dist} km\n• Est. Total: ₹${result.total.toLocaleString('en-IN')}\n\nPlease confirm chauffeur availability.` + mapsBlock;
              })())}
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

      {locationPickerOpen && (
        <LocationPicker
          isOpen={locationPickerOpen}
          onClose={() => setLocationPickerOpen(false)}
          onConfirm={handleLocationConfirm}
          type={pickerField}
          initialAddress={pickerField === 'pickup' ? pickup : drop}
        />
      )}
    </div>
  );
}
