/**
 * Lazy Google Maps Places API Loader
 * Loads Google Maps on-demand (e.g. when user focuses address inputs) to avoid blocking initial page load.
 */

/**
 * Lazy Google Maps Places API Loader
 * Loads Google Maps on-demand (e.g. when user focuses address inputs) to avoid blocking initial page load.
 */

let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_GOOGLE_MAPS_API_KEY) || 'AIzaSyBPpRgTPIkv20IMdaBqqdlz0S0FEGU5400'): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  (window as any).loadGoogleMaps = loadGoogleMaps;

  // If already available with Autocomplete, resolve immediately
  if ((window as any).google?.maps?.places?.Autocomplete) {
    return Promise.resolve();
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    // Check if script already in document
    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
      if ((window as any).google?.maps?.places?.Autocomplete) {
        resolve();
        return;
      }
      const onLoaded = () => {
        window.removeEventListener('google-maps-loaded', onLoaded);
        resolve();
      };
      window.addEventListener('google-maps-loaded', onLoaded);
      const poll = setInterval(async () => {
        if ((window as any).google?.maps?.places?.Autocomplete) {
          clearInterval(poll);
          window.removeEventListener('google-maps-loaded', onLoaded);
          resolve();
        } else if ((window as any).google?.maps?.importLibrary) {
          try {
            await (window as any).google.maps.importLibrary('places');
            if ((window as any).google?.maps?.places?.Autocomplete) {
              clearInterval(poll);
              window.removeEventListener('google-maps-loaded', onLoaded);
              resolve();
            }
          } catch (_) {}
        }
      }, 50);
      return;
    }

    // Suppress Google Maps Autocomplete deprecation warning if logged
    if (typeof console !== 'undefined' && console.warn && !(console.warn as any).__gmPatched) {
      const origWarn = console.warn;
      const patchedWarn = function (...args: any[]) {
        if (typeof args[0] === 'string' && (args[0].includes('google.maps.places.Autocomplete') || args[0].includes('PlaceAutocompleteElement'))) {
          return;
        }
        origWarn.apply(console, args);
      };
      (patchedWarn as any).__gmPatched = true;
      console.warn = patchedWarn;
    }

    const callbackName = '__initGoogleMapsLazy';
    (window as any)[callbackName] = async () => {
      try {
        if ((window as any).google?.maps?.importLibrary) {
          await (window as any).google.maps.importLibrary('places');
        }
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('google-maps-loaded'));
      resolve();
      try {
        delete (window as any)[callbackName];
      } catch (_) {}
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = (err) => {
      loadPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

if (typeof window !== 'undefined') {
  (window as any).loadGoogleMaps = loadGoogleMaps;
}
