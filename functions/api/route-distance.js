import nhaiTollData from '../../src/data/nhaiTollPlazas.json' with { type: 'json' };

/**
 * Free-tier driving distance & exact NHAI plaza matching endpoint (Zero API Billing).
 * Uses free OSRM (router.project-osrm.org) route geometry to find exact toll plazas
 * crossed along the driving route.
 */

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Minimum distance (km) from a point (pLat, pLng) to a segment (a -> b).
 * GeoJSON coordinates are [lng, lat].
 */
function pointToSegmentKm(pLat, pLng, a, b) {
  const [aLng, aLat] = a;
  const [bLng, bLat] = b;
  const dx = bLng - aLng;
  const dy = bLat - aLat;
  if (dx === 0 && dy === 0) return haversineKm(pLat, pLng, aLat, aLng);

  const t = Math.max(0, Math.min(1, ((pLng - aLng) * dx + (pLat - aLat) * dy) / (dx * dx + dy * dy)));
  const projLng = aLng + t * dx;
  const projLat = aLat + t * dy;
  return haversineKm(pLat, pLng, projLat, projLng);
}

/**
 * Matches NHAI toll plazas within 0.6 km (600 m) of the OSRM route polyline.
 */
function matchPlazasOnPolyline(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return [];
  const plazas = nhaiTollData?.plazas || [];
  const matched = [];

  for (const plaza of plazas) {
    let minKm = Infinity;
    let firstIdx = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
      const d = pointToSegmentKm(plaza.lat, plaza.lng, coords[i], coords[i + 1]);
      if (d < minKm) {
        minKm = d;
        firstIdx = i;
      }
      if (minKm <= 0.15) break;
    }
    if (minKm <= 0.6) {
      matched.push({ ...plaza, _order: firstIdx });
    }
  }

  matched.sort((a, b) => a._order - b._order);
  return matched.map(({ _order, ...rest }) => rest);
}

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

export async function onRequestGet({ request }) {
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

    // Free public OSRM routing with simplified GeoJSON geometry for plaza matching
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=simplified&geometries=geojson`;
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

    const polyCoords = route.geometry?.coordinates || [];
    const plazas = matchPlazasOnPolyline(polyCoords);

    return new Response(
      JSON.stringify({
        oneWayKm: Math.round(route.distance / 1000),
        durationMinutes: Math.round((route.duration || 0) / 60),
        plazas,
        verified: polyCoords.length >= 2,
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
