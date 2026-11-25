/**
 * Free-tier driving distance endpoint (Zero API Billing).
 * Uses OpenRouteService (if ORS_API_KEY is configured, 2,000 req/day free)
 * or public OSRM (router.project-osrm.org, no API key required).
 */

async function geocodePlace(text) {
  const q = String(text || '').trim();
  if (!q) return null;

  const query = q.toLowerCase().includes('india') ? q : `${q}, India`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'KalidassTravels/1.0 (https://kalidasstravels.in)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    let originLat = parseFloat(url.searchParams.get('originLat') || '');
    let originLng = parseFloat(url.searchParams.get('originLng') || '');
    let destLat = parseFloat(url.searchParams.get('destLat') || '');
    let destLng = parseFloat(url.searchParams.get('destLng') || '');

    if (!Number.isFinite(originLat) || !Number.isFinite(originLng)) {
      const originText = url.searchParams.get('originText') || 'Chennai';
      const geoOrigin = await geocodePlace(originText);
      if (geoOrigin) {
        originLat = geoOrigin.lat;
        originLng = geoOrigin.lng;
      }
    }

    if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) {
      const destText = url.searchParams.get('destText') || '';
      const geoDest = await geocodePlace(destText);
      if (geoDest) {
        destLat = geoDest.lat;
        destLng = geoDest.lng;
      }
    }

    if (
      !Number.isFinite(originLat) || !Number.isFinite(originLng) ||
      !Number.isFinite(destLat) || !Number.isFinite(destLng)
    ) {
      return new Response(JSON.stringify({ error: 'Unable to resolve coordinates' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Try OpenRouteService if a free API key is configured
    if (env && env.ORS_API_KEY) {
      try {
        const orsRes = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
          method: 'POST',
          headers: {
            Authorization: env.ORS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: [
              [originLng, originLat],
              [destLng, destLat],
            ],
          }),
        });
        if (orsRes.ok) {
          const orsData = await orsRes.json();
          const summary = orsData?.routes?.[0]?.summary;
          if (summary && summary.distance > 0) {
            return new Response(
              JSON.stringify({
                oneWayKm: Math.round(summary.distance / 1000),
                durationMinutes: Math.round((summary.duration || 0) / 60),
                source: 'ors',
              }),
              {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'public, max-age=86400',
                },
              }
            );
          }
        }
      } catch (_) {
        // Fall through to OSRM
      }
    }

    // 2. Free public OSRM routing
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
    const osrmRes = await fetch(osrmUrl, {
      headers: { 'User-Agent': 'KalidassTravels/1.0' },
    });

    if (!osrmRes.ok) {
      return new Response(JSON.stringify({ error: 'Routing service unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const osrmData = await osrmRes.json();
    const route = osrmData?.routes?.[0];
    if (!route || !(route.distance > 0)) {
      return new Response(JSON.stringify({ error: 'No driving route found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        oneWayKm: Math.round(route.distance / 1000),
        durationMinutes: Math.round((route.duration || 0) / 60),
        source: 'osrm',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400',
        },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || 'Route distance error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
