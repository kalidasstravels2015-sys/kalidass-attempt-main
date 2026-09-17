/**
 * Lazy Google Maps Places API Loader
 * Loads Google Maps on-demand (e.g. when user focuses address inputs) to avoid blocking initial page load.
 */

let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey = 'AIzaSyBPpRgTPIkv20IMdaBqqdlz0S0FEGU5400'): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  // If already available, resolve immediately
  if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
    return Promise.resolve();
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    // Check if script already in document
    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
        resolve();
        return;
      }
    }

    const callbackName = '__initGoogleMapsLazy';
    (window as any)[callbackName] = () => {
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
