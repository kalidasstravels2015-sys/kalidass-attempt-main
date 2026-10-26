import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Search, X, MapPin, Navigation, LocateFixed,
  Plane, Building2, ChevronRight, Loader2, Sparkles, Clock
} from 'lucide-react';
import { loadGoogleMaps } from '../lib/googleMapsLoader';

const DEFAULT_POPULAR_HUBS = [
  { name: 'Besant Nagar', tag: "Elliot's Beach / ECR", group: 'city' },
  { name: 'T. Nagar', tag: 'Shopping & Hotels (15 km)', group: 'city' },
  { name: 'OMR / Sholinganallur', tag: 'IT Corridor (18 km)', group: 'city' },
  { name: 'Chennai Central (MAS)', tag: 'Railway Station (22 km)', group: 'city' },
  { name: 'Anna Nagar', tag: 'Roundtana & Kilpauk (20 km)', group: 'city' },
  { name: 'Velachery', tag: 'Phoenix Mall & 100 Ft Rd (14 km)', group: 'city' },
  { name: 'Tambaram', tag: 'Sanatorium & GST Rd (12 km)', group: 'city' },
  { name: 'Guindy', tag: 'Industrial Estate / Kathipara (10 km)', group: 'city' },
  { name: 'Pondicherry', tag: 'Direct Highway Corridor (₹2,820)', group: 'outstation' },
  { name: 'Tirupati Balaji', tag: 'Alipiri / Balaji Darshan (₹2,560)', group: 'outstation' },
  { name: 'Vellore CMC Hospital', tag: 'Medical Transfer Corridor (₹2,600)', group: 'outstation' },
  { name: 'Mahabalipuram', tag: 'ECR Heritage Beach Hub (₹1,500)', group: 'outstation' },
];

export default function M3MobileSearchView({
  isOpen = false,
  onClose,
  onSelect,
  initialValue = '',
  placeholder = 'Search hotel, area, or destination...',
  title = 'Select Destination',
  popularHubs = DEFAULT_POPULAR_HUBS,
  onPinClick = null
}) {
  const [query, setQuery] = useState(initialValue || '');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'city' | 'outstation'
  const inputRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Initialize query on open & manage body scroll lock
  useEffect(() => {
    if (isOpen) {
      setQuery(initialValue || '');
      setPredictions([]);
      setLoading(false);

      // Lock body scroll to prevent background scroll jumping
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      document.body.style.overflow = 'hidden';

      // Auto-focus input after smooth slide-in
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (initialValue) {
            inputRef.current.select();
          }
        }
      }, 120);

      // Pre-load Google Maps
      loadGoogleMaps().then(() => {
        if (window.google?.maps?.places) {
          if (!autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          }
          if (!placesServiceRef.current) {
            const dummyDiv = document.createElement('div');
            placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
          }
        }
      }).catch(() => {});

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
      };
    }
  }, [isOpen, initialValue]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced Place Prediction Fetching
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setLoading(true);

    debounceTimerRef.current = setTimeout(() => {
      loadGoogleMaps().then(() => {
        if (!window.google?.maps?.places) {
          setLoading(false);
          return;
        }

        if (!autocompleteServiceRef.current) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }

        // Bias predictions towards Chennai / Tamil Nadu
        const chennaiCenter = new window.google.maps.LatLng(12.9941, 80.1709);

        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: trimmed,
            componentRestrictions: { country: 'in' },
            location: chennaiCenter,
            radius: 50000, // 50km bias
          },
          (results, status) => {
            setLoading(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              setPredictions(results);
            } else {
              setPredictions([]);
            }
          }
        );
      }).catch(() => {
        setLoading(false);
      });
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Resolve place details and trigger selection
  const handleSelectPrediction = (item) => {
    if (!item) return;

    const mainText = item.structured_formatting?.main_text || '';
    const secondaryText = item.structured_formatting?.secondary_text || '';
    const fullAddress = item.description || (mainText + (secondaryText ? `, ${secondaryText}` : ''));

    // Try fetching full details if places service is ready
    if (placesServiceRef.current && item.place_id) {
      try {
        placesServiceRef.current.getDetails(
          {
            placeId: item.place_id,
            fields: ['name', 'formatted_address', 'geometry', 'address_components']
          },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
              const resolvedAddr = place.formatted_address || place.name || fullAddress;
              onSelect?.(resolvedAddr, place);
            } else {
              onSelect?.(fullAddress, null);
            }
            onClose?.();
          }
        );
        return;
      } catch (_) {}
    }

    onSelect?.(fullAddress, null);
    onClose?.();
  };

  const handleSelectPopularHub = (hubName) => {
    onSelect?.(hubName, null);
    onClose?.();
  };

  // GPS Current Location Detection
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        loadGoogleMaps().then(() => {
          if (window.google?.maps?.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              setGeoLoading(false);
              if (status === 'OK' && results?.[0]) {
                const addr = results[0].formatted_address;
                onSelect?.(addr, results[0]);
                onClose?.();
              } else {
                onSelect?.(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, null);
                onClose?.();
              }
            });
          } else {
            setGeoLoading(false);
            onSelect?.(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, null);
            onClose?.();
          }
        }).catch(() => {
          setGeoLoading(false);
          onSelect?.(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, null);
          onClose?.();
        });
      },
      (err) => {
        setGeoLoading(false);
        alert('Could not access current location. Please grant permission or type your area.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  if (!isOpen) return null;

  const filteredHubs = popularHubs.filter(h => {
    if (activeTab === 'city') return h.group === 'city';
    if (activeTab === 'outstation') return h.group === 'outstation';
    return true;
  });

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[999999] bg-white flex flex-col font-sans transition-all duration-200 select-none"
      style={{
        height: '100dvh',
        maxHeight: '100dvh'
      }}
    >
      {/* ── 1. M3 TOP APP BAR & SEARCH FIELD ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-2.5 pt-2 pb-2.5 shadow-2xs shrink-0">
        <div className="flex items-center gap-2">
          {/* Back Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back and close search"
            className="w-10 h-10 min-w-[40px] flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>

          {/* Search Box Pill */}
          <div className="flex-1 flex items-center bg-slate-100/90 hover:bg-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8] border border-slate-200 rounded-full px-3.5 py-1.5 transition-all shadow-xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0 me-2" />
            <input
              ref={inputRef}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none"
            />
            {loading ? (
              <Loader2 className="w-4 h-4 text-[#1a73e8] animate-spin shrink-0 ms-1" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setPredictions([]);
                  inputRef.current?.focus();
                }}
                aria-label="Clear search input"
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ms-1 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Quick Context Pill */}
        <div className="flex items-center justify-between px-2 pt-1.5 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#1a73e8]" />
            <span>{title}</span>
          </span>
          <span className="text-slate-400">Google Places Verified</span>
        </div>
      </header>

      {/* ── 2. SCROLLABLE RESULTS / POPULAR HUBS (Fills all space above keyboard) ── */}
      <main
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 space-y-4"
        style={{
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 24px)'
        }}
      >
        {/* If user is typing and predictions exist */}
        {query.trim().length > 0 ? (
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Search Predictions
            </div>

            {loading && predictions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#1a73e8]" />
                <span className="text-xs">Finding matching places in Chennai...</span>
              </div>
            ) : predictions.length > 0 ? (
              <ul className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {predictions.map((item) => {
                  const mainText = item.structured_formatting?.main_text || item.description;
                  const secondaryText = item.structured_formatting?.secondary_text || '';

                  return (
                    <li key={item.place_id || item.description}>
                      <button
                        type="button"
                        onClick={() => handleSelectPrediction(item)}
                        className="w-full text-left px-3.5 py-3 flex items-start gap-3 hover:bg-blue-50/50 active:bg-blue-100/50 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-600 group-hover:text-[#1a73e8] shrink-0 mt-0.5 transition-colors">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-[#1a73e8] truncate">
                            {mainText}
                          </div>
                          {secondaryText && (
                            <div className="text-xs text-slate-500 truncate mt-0.5">
                              {secondaryText}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1a73e8] shrink-0 mt-2 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : !loading ? (
              <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200 mt-2">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-700">No matching places found</div>
                <div className="text-xs text-slate-500 mt-1">
                  Try typing the main neighborhood name (e.g. "Besant Nagar", "Guindy", "OMR")
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectPopularHub(query.trim())}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1a73e8] text-white text-xs font-bold shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
                >
                  <span>Use "{query.trim()}" As Custom Destination</span>
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          /* ── ZERO-STATE: QUICK ACTIONS & POPULAR HUBS ── */
          <div className="space-y-4">
            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={geoLoading}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 active:bg-blue-100 text-[#1a73e8] text-left transition-all cursor-pointer"
              >
                {geoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <LocateFixed className="w-4 h-4 text-[#1a73e8] shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1a73e8] leading-tight">Current GPS</div>
                  <div className="text-[10px] text-blue-600/80 truncate">Auto-detect area</div>
                </div>
              </button>

              {onPinClick ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose?.();
                    onPinClick();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 text-left transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 leading-tight">Pinpoint Map</div>
                    <div className="text-[10px] text-slate-500 truncate">Choose on map</div>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelectPopularHub('Chennai International Airport (MAA)')}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 text-left transition-all cursor-pointer"
                >
                  <Plane className="w-4 h-4 text-[#1a73e8] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 leading-tight">Chennai Airport</div>
                    <div className="text-[10px] text-slate-500 truncate">MAA Terminals 1,2,4</div>
                  </div>
                </button>
              )}
            </div>

            {/* Hub Category Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Hubs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('city')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'city' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Chennai City
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('outstation')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'outstation' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Direct Highways
              </button>
            </div>

            {/* Popular Hubs List */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1.5">
                <span>Popular Airport Hubs</span>
                <span className="text-emerald-600 font-semibold lowercase">tap for instant fare</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredHubs.map((hub) => (
                  <button
                    key={hub.name}
                    type="button"
                    onClick={() => handleSelectPopularHub(hub.name)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200/80 bg-white hover:border-[#1a73e8] hover:bg-blue-50/40 active:bg-blue-100/50 flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-600 group-hover:text-[#1a73e8] shrink-0 transition-colors">
                        {hub.group === 'outstation' ? (
                          <Navigation className="w-3.5 h-3.5" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-[#1a73e8] truncate">
                          {hub.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {hub.tag}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#1a73e8] shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>,
    document.body
  );
}
