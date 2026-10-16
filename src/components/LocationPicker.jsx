import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Navigation, Search, AlertCircle, Check, LocateFixed } from 'lucide-react';
import { loadGoogleMaps } from '../lib/googleMapsLoader';

const LocationPicker = ({
  isOpen,
  onClose,
  onConfirm,
  type = 'pickup',
  initialAddress = '',
  isTa = false,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const geocodeTimeoutRef = useRef(null);

  const [address, setAddress] = useState('');
  const [primaryName, setPrimaryName] = useState('');
  const [secondaryAddress, setSecondaryAddress] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Default coordinate center (Chennai Central)
  const defaultCenter = { lat: 13.0827, lng: 80.2707 };

  // Parse formatted address into distinct primary (spot/street) and secondary (area/city)
  const parseAddressComponents = (fullAddr) => {
    if (!fullAddr || fullAddr === 'Locating address...' || fullAddr === 'Unknown location') {
      return { primary: fullAddr, secondary: '' };
    }
    const parts = fullAddr.split(',').map((p) => p.trim());
    if (parts.length <= 1) {
      return { primary: fullAddr, secondary: '' };
    }
    const primary = parts[0];
    const secondary = parts.slice(1).join(', ');
    return { primary, secondary };
  };

  const updateResolvedAddress = useCallback((rawAddress) => {
    setAddress(rawAddress);
    const { primary, secondary } = parseAddressComponents(rawAddress);
    setPrimaryName(primary);
    setSecondaryAddress(secondary);
  }, []);

  const geocodePosition = useCallback((latlng) => {
    if (!window.google?.maps?.Geocoder) return;
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        updateResolvedAddress(results[0].formatted_address);
      } else {
        updateResolvedAddress('Selected location on map');
      }
    });
  }, [updateResolvedAddress]);

  const tryGeolocation = useCallback((map) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (map) {
            map.setCenter(pos);
            map.setZoom(16);
            geocodePosition(pos);
          }
        },
        () => {
          geocodePosition(defaultCenter);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      geocodePosition(defaultCenter);
    }
  }, [defaultCenter, geocodePosition]);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) return;

    // Initial map instance setup
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy', // Seamless touch gestures on mobile
      clickableIcons: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;
    setIsLoading(false);

    // Centering strategy:
    // 1. If an initialAddress is supplied, geocode & pan to it
    // 2. Otherwise try browser geolocation
    // 3. Fallback to default Chennai center
    const addrToSearch = initialAddress ? initialAddress.trim() : '';
    if (addrToSearch.length > 2) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: addrToSearch, componentRestrictions: { country: 'in' } }, (results, status) => {
        if (status === 'OK' && results && results[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          map.setCenter(loc);
          map.setZoom(16);
          updateResolvedAddress(results[0].formatted_address);
        } else {
          tryGeolocation(map);
        }
      });
    } else {
      tryGeolocation(map);
    }

    // Initialize in-modal search autocomplete
    if (searchInputRef.current && window.google.maps.places?.Autocomplete) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        componentRestrictions: { country: 'in' },
        fields: ['geometry', 'name', 'formatted_address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          map.panTo(place.geometry.location);
          map.setZoom(16);
          const resolved = place.formatted_address || place.name || '';
          if (resolved) {
            updateResolvedAddress(resolved);
            setSearchQuery(place.name || resolved);
          }
        }
      });

      autocompleteRef.current = autocomplete;
    }

    // Map drag and movement event listeners
    map.addListener('dragstart', () => {
      setIsDragging(true);
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    });

    map.addListener('idle', () => {
      setIsDragging(false);
      setIsLoading(false);
      const center = map.getCenter();
      if (center) {
        if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
        geocodeTimeoutRef.current = setTimeout(() => {
          geocodePosition(center);
        }, 150);
      }
    });
  }, [defaultCenter, geocodePosition, initialAddress, tryGeolocation, updateResolvedAddress]);

  // Re-center directly to user's device GPS
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(isTa ? 'உங்கள் உலாவியில் ஜிபிஎஸ் ஆதரிக்கப்படவில்லை.' : 'Geolocation is not supported by your browser.');
      return;
    }

    setIsDragging(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(pos);
          mapInstanceRef.current.setZoom(17);
        }
        setIsDragging(false);
      },
      (err) => {
        setIsDragging(false);
        alert(isTa ? 'தற்போதைய இருப்பிடத்தை பெற முடியவில்லை. அனுமதியை சரிபார்க்கவும்.' : 'Unable to fetch current location. Please verify location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Modal Lifecycle & Google Maps Loader
  useEffect(() => {
    if (!isOpen) {
      mapInstanceRef.current = null;
      return;
    }

    let isCancelled = false;
    const originalOverflow = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }

    setIsLoading(true);
    setLoadError(false);
    updateResolvedAddress(
      initialAddress || (isTa ? 'முகவரி கண்டறியப்படுகிறது...' : 'Locating address...')
    );

    loadGoogleMaps()
      .then(() => {
        if (!isCancelled) {
          setTimeout(() => {
            if (!isCancelled) {
              initMap();
            }
          }, 80);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setIsLoading(false);
          setLoadError(true);
        }
      });

    // Close on ESC key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isCancelled = true;
      if (typeof document !== 'undefined') {
        document.body.style.overflow = originalOverflow;
      }
      window.removeEventListener('keydown', handleKeyDown);
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isPickup = type === 'pickup';
  const modalTitle = isTa
    ? (isPickup ? 'பயணம் தொடங்கும் இடம் (Pick-up)' : 'சேருமிடம் (Drop Location)')
    : (isPickup ? 'Set Pickup Location' : 'Set Drop Location');

  const modalSubtitle = isTa
    ? 'வரைபடத்தை நகர்த்தி துல்லியமான வாசற்படி அல்லது சந்திப்பை தேர்வு செய்யவும்'
    : 'Drag map to position pin at your exact door or landmark';

  const confirmBtnText = isTa
    ? (isPickup ? 'பிக்-அப் இடத்தை உறுதி செய்' : 'டிராப் இடத்தை உறுதி செய்')
    : (isPickup ? 'Confirm Pickup Location' : 'Confirm Drop Location');

  const modalContent = (
    <div
      data-hide-contact-dock
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-picker-heading"
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-m3-scrim/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-m3-surface w-full max-w-xl rounded-2xl sm:rounded-m3-xl overflow-hidden shadow-2xl border border-m3-outline-variant flex flex-col h-[85vh] sm:h-[80vh] max-h-[750px] animate-in zoom-in-95 duration-200">
        
        {/* 1. Modal Header Strip */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-m3-outline-variant/60 flex items-center justify-between bg-m3-surface z-20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPickup ? 'bg-m3-primary/10 text-m3-primary' : 'bg-m3-secondary/10 text-m3-secondary'}`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="map-picker-heading" className="font-bold text-sm sm:text-base text-m3-on-surface truncate">
                {modalTitle}
              </h2>
              <p className="text-[11px] text-m3-on-surface-variant hidden sm:block truncate">
                {modalSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close map"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-m3-surface-container active:scale-95 text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Interactive Map Container with Floating Search & Precision Controls */}
        <div className="relative flex-1 bg-m3-surface-container overflow-hidden">
          
          {/* Floating Search Bar */}
          <div className="absolute top-3 inset-x-3 sm:inset-x-6 z-20 pointer-events-auto">
            <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-m3-outline-variant/70 px-3.5 py-2">
              <Search className="w-4 h-4 text-m3-primary shrink-0 mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isTa ? 'இடம், தெரு அல்லது அடையாளத்தைத் தேடுக...' : 'Search area, street, or landmark...'}
                className="w-full bg-transparent text-xs sm:text-sm text-m3-on-surface placeholder:text-m3-on-surface-variant/70 outline-none pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant hover:text-m3-on-surface p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Loading / Error States */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-m3-surface/80 backdrop-blur-xs">
              <div className="w-8 h-8 border-3 border-m3-primary/20 border-t-m3-primary rounded-full animate-spin mb-2" />
              <p className="text-xs font-medium text-m3-on-surface-variant">
                {isTa ? 'வரைபடம் ஏற்றப்படுகிறது...' : 'Loading Google Maps...'}
              </p>
            </div>
          )}

          {loadError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-m3-surface p-6 text-center">
              <AlertCircle className="w-10 h-10 text-m3-error mb-2" />
              <p className="text-sm font-semibold text-m3-on-surface mb-1">
                {isTa ? 'வரைபடத்தை ஏற்ற முடியவில்லை' : 'Unable to load map'}
              </p>
              <p className="text-xs text-m3-on-surface-variant max-w-xs mb-4">
                {isTa ? 'இணைய இணைப்பை சரிபார்க்கவும் அல்லது முகவரியை நேரடியாக தட்டச்சு செய்யவும்.' : 'Please check your connection or enter your location manually in the booking box.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-m3-primary text-m3-on-primary text-xs font-bold rounded-full"
              >
                {isTa ? 'பின் செல்ல' : 'Return to Form'}
              </button>
            </div>
          )}

          {/* Map Canvas */}
          <div ref={mapRef} className="w-full h-full" />

          {/* Centered Interactive Target Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
            {/* Animated Pin Marker */}
            <div
              className={`transition-all duration-200 ease-out origin-bottom ${
                isDragging
                  ? '-translate-y-5 scale-110 drop-shadow-2xl'
                  : 'translate-y-0 scale-100 drop-shadow-md'
              }`}
            >
              <div className={`p-1.5 rounded-full ${isPickup ? 'bg-m3-primary text-white' : 'bg-m3-secondary text-white'} shadow-md border-2 border-white flex items-center justify-center`}>
                <MapPin className="w-5 h-5 fill-current" />
              </div>
            </div>

            {/* Ground Shadow & Reticle Pulse */}
            <div
              className={`transition-all duration-200 ease-out rounded-full bg-black/30 blur-[1.5px] mt-0.5 ${
                isDragging ? 'w-3 h-1.5 opacity-40 scale-75' : 'w-4 h-2 opacity-80 scale-100'
              }`}
            />
          </div>

          {/* Floating 'Locate Me' GPS FAB */}
          <button
            type="button"
            onClick={handleCurrentLocation}
            className="absolute bottom-4 right-4 z-20 bg-white p-3 rounded-full shadow-lg hover:bg-m3-surface-container active:scale-95 transition-all border border-m3-outline-variant/60 text-m3-primary cursor-pointer flex items-center justify-center"
            title={isTa ? 'என் தற்போதைய இடம்' : 'Go to my current location'}
            aria-label={isTa ? 'என் தற்போதைய இடம்' : 'Go to my current location'}
          >
            <LocateFixed className="w-5 h-5" />
          </button>
        </div>

        {/* 3. Bottom Location Details & Confirmation Strip */}
        <div className="p-4 sm:p-5 bg-m3-surface border-t border-m3-outline-variant/60 space-y-3 z-20 shrink-0 shadow-inner">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 text-m3-primary shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider">
                {isTa ? 'தேர்ந்தெடுக்கப்பட்ட இடம்' : 'Selected Pinpoint Location'}
              </p>
              <p className="text-xs sm:text-sm font-bold text-m3-on-surface truncate">
                {primaryName || (isTa ? 'இடத்தைத் தேர்ந்தெடுக்கவும்' : 'Move map to select location')}
              </p>
              {secondaryAddress && (
                <p className="text-[11px] sm:text-xs text-m3-on-surface-variant truncate">
                  {secondaryAddress}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onConfirm(address)}
            disabled={isDragging || isLoading || !address || address === 'Locating address...' || address === 'Unknown location'}
            className="w-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary py-3 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{confirmBtnText}</span>
          </button>
        </div>

      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

export default LocationPicker;
