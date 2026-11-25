import { getVehiclePermitCategory } from './masterTariff.js';
import nhaiTollData from '../data/nhaiTollPlazas.json' with { type: 'json' };

const PLAZA_BY_ID = new Map((nhaiTollData?.plazas || []).map((p) => [p.id, p]));

function resolvePlazasByIds(ids) {
  if (!Array.isArray(ids)) return null;
  const resolved = ids.map((id) => PLAZA_BY_ID.get(id)).filter(Boolean);
  return resolved.length === ids.length ? resolved : null;
}

/**
 * Master database of known outstation destinations from Chennai.
 * Distances are verified driving km (one-way) and highway round-trip km.
 */
export const KNOWN_DESTINATIONS = {
  // Pilgrimage & Nearby TN / AP / PY
  tirupati: { name: 'Tirupati Balaji', oneWayKm: 135, roundTripKm: 270, stateCode: 'AP', defaultDays: 1, corridor: 'nh16_tirupati' },
  tirumala: { name: 'Tirumala Hills', oneWayKm: 155, roundTripKm: 310, stateCode: 'AP', defaultDays: 1, corridor: 'nh16_tirupati' },
  srikalahasti: { name: 'Srikalahasti Temple', oneWayKm: 115, roundTripKm: 230, stateCode: 'AP', defaultDays: 1, corridor: 'nh16_tirupati' },
  kanipakam: { name: 'Kanipakam Vinayaka', oneWayKm: 165, roundTripKm: 330, stateCode: 'AP', defaultDays: 1, corridor: 'nh48_vellore' },
  pondicherry: { name: 'Pondicherry & Auroville', oneWayKm: 151, roundTripKm: 302, stateCode: 'PY', defaultDays: 1, corridor: 'ecr_coastal', plazaIds: ['akkarai-ecr'] },
  puducherry: { name: 'Pondicherry & Auroville', oneWayKm: 151, roundTripKm: 302, stateCode: 'PY', defaultDays: 1, corridor: 'ecr_coastal', plazaIds: ['akkarai-ecr'] },
  auroville: { name: 'Auroville & Pondicherry', oneWayKm: 145, roundTripKm: 290, stateCode: 'PY', defaultDays: 1, corridor: 'ecr_coastal', plazaIds: ['akkarai-ecr'] },
  thiruvannamalai: { name: 'Thiruvannamalai Girivalam', oneWayKm: 195, roundTripKm: 390, stateCode: 'TN', defaultDays: 1, corridor: 'nh32_tindivanam', plazaIds: ['paranur', 'athur'] },
  tiruvannamalai: { name: 'Thiruvannamalai Girivalam', oneWayKm: 195, roundTripKm: 390, stateCode: 'TN', defaultDays: 1, corridor: 'nh32_tindivanam', plazaIds: ['paranur', 'athur'] },
  kanchipuram: { name: 'Kanchipuram Temples', oneWayKm: 75, roundTripKm: 150, stateCode: 'TN', defaultDays: 1, corridor: 'nh48_kanchi', plazaIds: ['nemili-sriperumbudur'] },
  kancheepuram: { name: 'Kanchipuram Temples', oneWayKm: 75, roundTripKm: 150, stateCode: 'TN', defaultDays: 1, corridor: 'nh48_kanchi', plazaIds: ['nemili-sriperumbudur'] },
  kanchi: { name: 'Kanchipuram Temples', oneWayKm: 75, roundTripKm: 150, stateCode: 'TN', defaultDays: 1, corridor: 'nh48_kanchi', plazaIds: ['nemili-sriperumbudur'] },
  kanchepuram: { name: 'Kanchipuram Temples', oneWayKm: 75, roundTripKm: 150, stateCode: 'TN', defaultDays: 1, corridor: 'nh48_kanchi', plazaIds: ['nemili-sriperumbudur'] },
  kanjipuram: { name: 'Kanchipuram Temples', oneWayKm: 75, roundTripKm: 150, stateCode: 'TN', defaultDays: 1, corridor: 'nh48_kanchi', plazaIds: ['nemili-sriperumbudur'] },
  kanhipuram: { name: 'Kanchipuram Temples', oneWayKm: 75, roundTripKm: 150, stateCode: 'TN', defaultDays: 1, corridor: 'nh48_kanchi', plazaIds: ['nemili-sriperumbudur'] },
  vellore: { name: 'Vellore Golden Temple & CMC', oneWayKm: 140, roundTripKm: 280, stateCode: 'TN', defaultDays: 1, corridor: 'nh48_vellore', plazaIds: ['nemili-sriperumbudur', 'chennasamudram'] },
  sholingur: { name: 'Sholingur Narasimhar', oneWayKm: 110, roundTripKm: 220, stateCode: 'TN', defaultDays: 1, corridor: 'nh48_kanchi', plazaIds: ['nemili-sriperumbudur'] },
  mahabalipuram: { name: 'Mahabalipuram Shore', oneWayKm: 55, roundTripKm: 110, stateCode: 'TN', defaultDays: 1, corridor: 'ecr_short', plazaIds: ['akkarai-ecr'] },
  mamallapuram: { name: 'Mahabalipuram Shore', oneWayKm: 55, roundTripKm: 110, stateCode: 'TN', defaultDays: 1, corridor: 'ecr_short', plazaIds: ['akkarai-ecr'] },

  // Dharmapuri / Krishnagiri / Hogenakkal / Salem / Hills
  hogenakkal: { name: 'Hogenakkal Water Falls', oneWayKm: 327, roundTripKm: 654, stateCode: 'TN', defaultDays: 1, corridor: 'nh48_dharmapuri', plazaIds: ['nemili-sriperumbudur', 'chennasamudram', 'pallikonda', 'vaniyambadi', 'krishnagiri'] },
  dharmapuri: { name: 'Dharmapuri', oneWayKm: 295, roundTripKm: 590, stateCode: 'TN', defaultDays: 2, corridor: 'nh48_dharmapuri', plazaIds: ['nemili-sriperumbudur', 'chennasamudram', 'pallikonda', 'vaniyambadi', 'krishnagiri'] },
  krishnagiri: { name: 'Krishnagiri', oneWayKm: 255, roundTripKm: 510, stateCode: 'TN', defaultDays: 2, corridor: 'nh48_dharmapuri', plazaIds: ['nemili-sriperumbudur', 'chennasamudram', 'pallikonda', 'vaniyambadi', 'krishnagiri'] },
  hosur: { name: 'Hosur', oneWayKm: 305, roundTripKm: 610, stateCode: 'TN', defaultDays: 2, corridor: 'nh48_dharmapuri', plazaIds: ['nemili-sriperumbudur', 'chennasamudram', 'pallikonda', 'vaniyambadi', 'krishnagiri'] },
  yelagiri: { name: 'Yelagiri Hills', oneWayKm: 230, roundTripKm: 460, stateCode: 'TN', defaultDays: 2, corridor: 'nh48_vellore', plazaIds: ['nemili-sriperumbudur', 'chennasamudram', 'pallikonda'] },
  yercaud: { name: 'Yercaud Hills', oneWayKm: 365, roundTripKm: 730, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_salem', plazaIds: ['paranur', 'athur', 'vikravandi', 'sengurichi'] },
  salem: { name: 'Salem', oneWayKm: 340, roundTripKm: 680, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_salem', plazaIds: ['paranur', 'athur', 'vikravandi', 'sengurichi'] },
  'kolli hills': { name: 'Kolli Hills', oneWayKm: 375, roundTripKm: 750, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_salem' },

  // Delta / Trichy / South TN
  chidambaram: { name: 'Chidambaram Natarajar', oneWayKm: 230, roundTripKm: 460, stateCode: 'TN', defaultDays: 1, corridor: 'ecr_coastal' },
  kumbakonam: { name: 'Kumbakonam Navagraha', oneWayKm: 310, roundTripKm: 620, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_trichy' },
  navagraha: { name: 'Kumbakonam Navagraha', oneWayKm: 310, roundTripKm: 620, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_trichy' },
  thanjavur: { name: 'Thanjavur Brihadeeswarar', oneWayKm: 345, roundTripKm: 690, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_trichy' },
  tanjore: { name: 'Thanjavur Brihadeeswarar', oneWayKm: 345, roundTripKm: 690, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_trichy' },
  velankanni: { name: 'Velankanni Shrine', oneWayKm: 340, roundTripKm: 680, stateCode: 'TN', defaultDays: 2, corridor: 'ecr_coastal' },
  nagapattinam: { name: 'Nagapattinam', oneWayKm: 325, roundTripKm: 650, stateCode: 'TN', defaultDays: 2, corridor: 'ecr_coastal' },
  karaikal: { name: 'Karaikal', oneWayKm: 305, roundTripKm: 610, stateCode: 'PY', defaultDays: 2, corridor: 'ecr_coastal' },
  trichy: { name: 'Trichy Srirangam', oneWayKm: 332, roundTripKm: 664, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_trichy' },
  tiruchirappalli: { name: 'Trichy Srirangam', oneWayKm: 332, roundTripKm: 664, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_trichy' },
  madurai: { name: 'Madurai Meenakshi', oneWayKm: 462, roundTripKm: 924, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_madurai' },
  dindigul: { name: 'Dindigul', oneWayKm: 425, roundTripKm: 850, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_madurai' },
  palani: { name: 'Palani Murugan', oneWayKm: 485, roundTripKm: 970, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_madurai' },
  rameswaram: { name: 'Rameswaram Jyotirlinga', oneWayKm: 559, roundTripKm: 1118, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_madurai' },
  kanyakumari: { name: 'Kanyakumari', oneWayKm: 705, roundTripKm: 1410, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_kanyakumari' },
  tirunelveli: { name: 'Tirunelveli', oneWayKm: 625, roundTripKm: 1250, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_kanyakumari' },
  tiruchendur: { name: 'Tiruchendur Murugan', oneWayKm: 625, roundTripKm: 1250, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_kanyakumari' },
  nagercoil: { name: 'Nagercoil', oneWayKm: 690, roundTripKm: 1380, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_kanyakumari' },
  thoothukudi: { name: 'Thoothukudi (Tuticorin)', oneWayKm: 605, roundTripKm: 1210, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_kanyakumari' },
  tuticorin: { name: 'Thoothukudi (Tuticorin)', oneWayKm: 605, roundTripKm: 1210, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_kanyakumari' },
  courtallam: { name: 'Courtallam Waterfalls', oneWayKm: 605, roundTripKm: 1210, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_kanyakumari' },
  kutralam: { name: 'Courtallam Waterfalls', oneWayKm: 605, roundTripKm: 1210, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_kanyakumari' },
  karaikudi: { name: 'Karaikudi Chettinad', oneWayKm: 415, roundTripKm: 830, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_madurai' },

  // West TN & Hill Stations
  coimbatore: { name: 'Coimbatore Isha Yoga', oneWayKm: 505, roundTripKm: 1010, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_coimbatore' },
  erode: { name: 'Erode', oneWayKm: 405, roundTripKm: 810, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_salem' },
  tirupur: { name: 'Tiruppur', oneWayKm: 455, roundTripKm: 910, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_coimbatore' },
  karur: { name: 'Karur', oneWayKm: 390, roundTripKm: 780, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_trichy' },
  pollachi: { name: 'Pollachi & Topslip', oneWayKm: 540, roundTripKm: 1080, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_coimbatore' },
  valparai: { name: 'Valparai Hills', oneWayKm: 600, roundTripKm: 1200, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_coimbatore' },
  ooty: { name: 'Ooty Nilgiris', oneWayKm: 555, roundTripKm: 1110, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_coimbatore' },
  coonoor: { name: 'Coonoor Nilgiris', oneWayKm: 535, roundTripKm: 1070, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_coimbatore' },
  kodaikanal: { name: 'Kodaikanal Hills', oneWayKm: 528, roundTripKm: 1056, stateCode: 'TN', defaultDays: 3, corridor: 'nh32_madurai' },
  theni: { name: 'Theni', oneWayKm: 510, roundTripKm: 1020, stateCode: 'TN', defaultDays: 2, corridor: 'nh32_madurai' },

  // Interstate: Karnataka, Kerala, Telangana/AP
  bangalore: { name: 'Bangalore / Bengaluru', oneWayKm: 346, roundTripKm: 692, stateCode: 'KA', defaultDays: 2, corridor: 'nh48_dharmapuri' },
  bengaluru: { name: 'Bangalore / Bengaluru', oneWayKm: 346, roundTripKm: 692, stateCode: 'KA', defaultDays: 2, corridor: 'nh48_dharmapuri' },
  mysore: { name: 'Mysore Palace', oneWayKm: 480, roundTripKm: 960, stateCode: 'KA', defaultDays: 3, corridor: 'nh48_dharmapuri' },
  mysuru: { name: 'Mysore Palace', oneWayKm: 480, roundTripKm: 960, stateCode: 'KA', defaultDays: 3, corridor: 'nh48_dharmapuri' },
  coorg: { name: 'Coorg (Madikeri)', oneWayKm: 590, roundTripKm: 1180, stateCode: 'KA', defaultDays: 3, corridor: 'nh48_dharmapuri' },
  munnar: { name: 'Munnar Tea Hills', oneWayKm: 590, roundTripKm: 1180, stateCode: 'KL', defaultDays: 3, corridor: 'nh32_madurai' },
  thekkady: { name: 'Thekkady Periyar', oneWayKm: 595, roundTripKm: 1190, stateCode: 'KL', defaultDays: 3, corridor: 'nh32_madurai' },
  kochi: { name: 'Kochi / Ernakulam', oneWayKm: 690, roundTripKm: 1380, stateCode: 'KL', defaultDays: 3, corridor: 'nh32_coimbatore' },
  cochin: { name: 'Kochi / Ernakulam', oneWayKm: 690, roundTripKm: 1380, stateCode: 'KL', defaultDays: 3, corridor: 'nh32_coimbatore' },
  wayanad: { name: 'Wayanad Hills', oneWayKm: 625, roundTripKm: 1250, stateCode: 'KL', defaultDays: 3, corridor: 'nh48_dharmapuri' },
  alleppey: { name: 'Alleppey Backwaters', oneWayKm: 740, roundTripKm: 1480, stateCode: 'KL', defaultDays: 4, corridor: 'nh32_coimbatore' },
  sabarimala: { name: 'Sabarimala Pilgrimage', oneWayKm: 650, roundTripKm: 1300, stateCode: 'KL', defaultDays: 3, corridor: 'nh32_madurai' },
  nilakkal: { name: 'Sabarimala (Nilakkal)', oneWayKm: 650, roundTripKm: 1300, stateCode: 'KL', defaultDays: 3, corridor: 'nh32_madurai' },
  pamba: { name: 'Sabarimala (Pamba)', oneWayKm: 650, roundTripKm: 1300, stateCode: 'KL', defaultDays: 3, corridor: 'nh32_madurai' },
  nellore: { name: 'Nellore', oneWayKm: 175, roundTripKm: 350, stateCode: 'AP', defaultDays: 1, corridor: 'nh16_tirupati' },
  vijayawada: { name: 'Vijayawada', oneWayKm: 455, roundTripKm: 910, stateCode: 'AP', defaultDays: 2, corridor: 'nh16_tirupati' },
  hyderabad: { name: 'Hyderabad', oneWayKm: 630, roundTripKm: 1260, stateCode: 'TS', defaultDays: 3, corridor: 'nh16_tirupati' },
};

export const ROUTE_REALISTIC_HOURS = {
  tirupati: 12,
  tirumala: 12,
  srikalahasti: 10,
  kanipakam: 12,
  thiruvannamalai: 14,
  tiruvannamalai: 14,
  pondicherry: 11,
  puducherry: 11,
  auroville: 11,
  kanchipuram: 8,
  kancheepuram: 8,
  kanchi: 8,
  kanchepuram: 8,
  kanjipuram: 8,
  kanhipuram: 8,
  vellore: 10,
  sholingur: 9,
  mahabalipuram: 8,
  mamallapuram: 8,
  chidambaram: 14,
  yelagiri: 14,
  hogenakkal: 24,
  dharmapuri: 24,
  krishnagiri: 24,
  hosur: 24,
  yercaud: 24,
  kumbakonam: 36,
  navagraha: 36,
  thanjavur: 24,
  tanjore: 24,
  velankanni: 24,
  nagapattinam: 24,
  rameswaram: 48,
  sabarimala: 48,
  nilakkal: 48,
  pamba: 48,
  tiruchendur: 36,
  kanyakumari: 48,
  tirunelveli: 48,
  nagercoil: 48,
  bangalore: 24,
  bengaluru: 24,
  mysore: 36,
  mysuru: 36,
  coimbatore: 24,
  madurai: 24,
  trichy: 24,
  tiruchirappalli: 24,
  salem: 24,
  ooty: 48,
  kodaikanal: 48,
  munnar: 48,
};

const CHENNAI_AREA_KEYWORDS = [
  'chennai', 'kumananchavadi', 'poonamallee', 'porur', 'pallavaram', 'tambaram',
  'chromepet', 'guindy', 'velachery', 't. nagar', 't nagar', 'anna nagar',
  'adyar', 'ambattur', 'avadi', 'koyambedu', 'central', 'egmore', 'madhavaram',
  'meenambakkam', 'sholinganallur', 'thoraipakkam', 'perungudi', 'alandur',
  'mylapore', 'nungambakkam', 'vadapalani', 'kodambakkam', 'madipakkam',
  'medavakkam', 'perungalathur', 'vandalur', 'guduvanchery', 'urapakkam',
  'red hills', 'redhills', 'kolathur', 'mogappair', 'thiruvanmiyur', 'airport', 'maa'
];

export function isChennaiOrigin(originText = '') {
  const raw = String(originText || '').toLowerCase().trim();
  if (!raw) return true;
  return CHENNAI_AREA_KEYWORDS.some((kw) => raw.includes(kw));
}

export function matchKnownDestination(destinationText = '') {
  const raw = String(destinationText || '').toLowerCase().trim();
  if (!raw) return null;

  // Prefer longer keyword matches first (e.g. "thiruvannamalai" before "tiruvannamalai")
  const keys = Object.keys(KNOWN_DESTINATIONS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (raw.includes(key)) {
      return { key, ...KNOWN_DESTINATIONS[key] };
    }
  }
  return null;
}

/**
 * Computes Round-Trip package km from exact highway round-trip distance,
 * respecting minimum daily km without adding upfront local buffers that overcharge.
 */
export function computeRoundTripPackageKm(oneWayKm, minDailyKm = 250, days = 1) {
  const safeOneWay = Math.max(0, Number(oneWayKm) || 0);
  const safeDays = Math.max(1, Number(days) || 1);
  const minPackageKm = (Number(minDailyKm) || 250) * safeDays;

  if (safeOneWay <= 0) {
    return {
      highwayRoundTripKm: minPackageKm,
      localBufferKm: 0,
      suggestedRoundTripKm: minPackageKm,
      minPackageKm,
      billedKm: minPackageKm,
    };
  }

  const highwayRoundTripKm = Math.round(safeOneWay * 2);
  const suggestedRoundTripKm = highwayRoundTripKm;
  const billedKm = Math.max(minPackageKm, highwayRoundTripKm);

  return {
    highwayRoundTripKm,
    localBufferKm: 0,
    suggestedRoundTripKm,
    minPackageKm,
    billedKm,
  };
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateRoadKmFromCoords(originCoords, destCoords) {
  if (
    !originCoords || !destCoords ||
    !Number.isFinite(originCoords.lat) || !Number.isFinite(originCoords.lng) ||
    !Number.isFinite(destCoords.lat) || !Number.isFinite(destCoords.lng)
  ) {
    return null;
  }
  const straightKm = haversineKm(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
  return Math.max(10, Math.round(straightKm * 1.28));
}

// ── In-memory + sessionStorage cache for free routing responses ──
const routeMemoryCache = new Map();
const CACHE_PREFIX = 'kt_route_km_v1:';

function readCachedRoute(cacheKey) {
  if (routeMemoryCache.has(cacheKey)) return routeMemoryCache.get(cacheKey);
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(CACHE_PREFIX + cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Number(parsed.oneWayKm) > 0) {
          routeMemoryCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch (_) {}
  }
  return null;
}

function writeCachedRoute(cacheKey, value) {
  routeMemoryCache.set(cacheKey, value);
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(value));
    } catch (_) {}
  }
}

/**
 * Resolves exact one-way driving km with zero paid API calls:
 * 1. KNOWN_DESTINATIONS (for Chennai-area origins)
 * 2. sessionStorage / memory cache
 * 3. /api/route-distance (free OSRM / optional free ORS)
 * 4. Haversine × 1.28 fallback when coordinates exist
 */
export async function resolveExactRouteDistance({
  originText = 'Chennai',
  destText = '',
  originCoords = null,
  destCoords = null,
} = {}) {
  const cleanDest = String(destText || '').trim();
  const cleanOrigin = String(originText || 'Chennai').trim() || 'Chennai';

  const matched = matchKnownDestination(cleanDest);
  if (matched && isChennaiOrigin(cleanOrigin)) {
    const knownPlazas = resolvePlazasByIds(matched.plazaIds);
    return {
      oneWayKm: matched.oneWayKm,
      plazas: knownPlazas || [],
      verified: Boolean(knownPlazas),
      source: 'known',
      matchedDest: matched,
    };
  }

  if (!cleanDest && !(originCoords && destCoords)) {
    return { oneWayKm: null, plazas: [], verified: false, source: 'none', matchedDest: null };
  }

  const coordKey = originCoords && destCoords
    ? `${originCoords.lat.toFixed(3)},${originCoords.lng.toFixed(3)}|${destCoords.lat.toFixed(3)},${destCoords.lng.toFixed(3)}`
    : `${cleanOrigin.toLowerCase()}|${cleanDest.toLowerCase()}`;

  const cached = readCachedRoute(coordKey);
  if (cached) {
    return { ...cached, source: 'cache', matchedDest: matched };
  }

  if (typeof fetch === 'function') {
    try {
      const params = new URLSearchParams();
      if (originCoords && destCoords) {
        params.set('originLat', String(originCoords.lat));
        params.set('originLng', String(originCoords.lng));
        params.set('destLat', String(destCoords.lat));
        params.set('destLng', String(destCoords.lng));
      } else {
        params.set('originText', cleanOrigin);
        params.set('destText', cleanDest);
      }

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 4500) : null;

      const res = await fetch(`/api/route-distance?${params.toString()}`, {
        signal: controller?.signal,
      });
      if (timer) clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data && Number(data.oneWayKm) > 0) {
          const result = {
            oneWayKm: Math.round(Number(data.oneWayKm)),
            durationMinutes: data.durationMinutes || null,
            plazas: Array.isArray(data.plazas) ? data.plazas : [],
            verified: Boolean(data.verified),
            source: data.source || 'osrm',
          };
          writeCachedRoute(coordKey, result);
          return { ...result, matchedDest: matched };
        }
      }
    } catch (_) {
      // Fall through to coordinate/known fallback
    }
  }

  const haversineEst = estimateRoadKmFromCoords(originCoords, destCoords);
  if (haversineEst) {
    return { oneWayKm: haversineEst, source: 'haversine', matchedDest: matched };
  }

  if (matched) {
    return { oneWayKm: matched.oneWayKm, source: 'known', matchedDest: matched };
  }

  return { oneWayKm: null, source: 'fallback', matchedDest: null };
}

// ── NHAI FASTag Vehicle-Class Toll Estimator (Zero API Billing) ──
// Single-way toll estimates by corridor (based on NHAI plaza classes)
const CORRIDOR_TOLL_PROFILES = {
  ecr_short: { plazas: 1, car: 55, lcv: 90, bus: 185 },
  ecr_coastal: { plazas: 2, car: 120, lcv: 195, bus: 410 },
  nh48_kanchi: { plazas: 1, car: 65, lcv: 105, bus: 220 },
  nh48_vellore: { plazas: 3, car: 195, lcv: 320, bus: 670 },
  nh48_dharmapuri: { plazas: 6, car: 410, lcv: 670, bus: 1410 },
  nh16_tirupati: { plazas: 2, car: 150, lcv: 245, bus: 510 },
  nh32_tindivanam: { plazas: 2, car: 140, lcv: 230, bus: 480 },
  nh32_trichy: { plazas: 5, car: 360, lcv: 590, bus: 1240 },
  nh32_salem: { plazas: 5, car: 375, lcv: 615, bus: 1290 },
  nh32_madurai: { plazas: 7, car: 510, lcv: 835, bus: 1750 },
  nh32_coimbatore: { plazas: 7, car: 525, lcv: 860, bus: 1800 },
  nh32_kanyakumari: { plazas: 10, car: 720, lcv: 1180, bus: 2480 },
};

export function getNhaiTollClass(vehicleNameOrId = '') {
  const v = String(vehicleNameOrId || '').toLowerCase();
  if (
    v.includes('26-seater') || v.includes('26 seater') ||
    v.includes('21') || v.includes('25') ||
    v.includes('mini bus') || v.includes('minibus') || v.includes('bus')
  ) {
    return { key: 'bus', label: 'Bus / Coach (Class 3)' };
  }

  const cat = getVehiclePermitCategory(vehicleNameOrId);
  if (cat === 'tempo' || cat === 'coach') {
    return { key: 'lcv', label: 'Tempo / LCV (Class 2)' };
  }
  return { key: 'car', label: 'Car / SUV / MUV (Class 1)' };
}

/**
 * Estimates NHAI FASTag toll charges for a given vehicle & route.
 * Factors in:
 * - Vehicle toll class (Car vs LCV/Tempo vs Bus)
 * - Corridor toll plazas (or highway-km fallback ~1 plaza per 65 km)
 * - Return-journey discount (~1.5x for <= 1 day / 24h return, 2.0x for >= 2 days)
 */
/**
 * Calculates EXACT NHAI FASTag toll charges from verified plaza geometry.
 * Safe Strict Mode: returns verified: false (exactToll: 0) whenever plazas
 * cannot be 100% verified, so callers fall back to "Toll & Parking Extra".
 */
export function calculateExactRouteToll({
  plazas = null,
  verified = false,
  destinationText = '',
  originText = 'Chennai',
  vehicleNameOrId = '',
  tripType = 'round',
  durationHours = 0,
  days = 1,
} = {}) {
  const tollClass = getNhaiTollClass(vehicleNameOrId);
  const isRound = String(tripType || '').toLowerCase().includes('round');
  const safeDays = Math.max(1, Number(days) || 1);
  const within24h = isRound && (Number(durationHours) > 0 ? Number(durationHours) <= 24 : safeDays <= 1);

  let resolvedPlazas = Array.isArray(plazas) && verified ? plazas : null;

  // Synchronous fallback for verified Chennai-area KNOWN_DESTINATIONS
  if (!resolvedPlazas && isChennaiOrigin(originText) && destinationText) {
    const matched = matchKnownDestination(destinationText);
    if (matched?.plazaIds) {
      resolvedPlazas = resolvePlazasByIds(matched.plazaIds);
    }
  }

  if (!resolvedPlazas) {
    return {
      verified: false,
      exactToll: 0,
      singleWayToll: 0,
      plazaCount: 0,
      plazaNames: [],
      tollClass: tollClass.key,
      tollClassLabel: tollClass.label,
      returnRule: 'Unverified route — pay as per slip',
    };
  }

  let singleWayToll = 0;
  let exactToll = 0;

  for (const plaza of resolvedPlazas) {
    const rateObj = plaza?.rates?.[tollClass.key] || plaza?.rates?.car;
    if (!rateObj) continue;
    const s = Number(rateObj.single) || 0;
    const r24 = Number(rateObj.return24h) || Math.round((s * 1.5) / 5) * 5;
    singleWayToll += s;

    if (!isRound) {
      exactToll += s;
    } else if (within24h) {
      exactToll += r24;
    } else {
      exactToll += s * 2;
    }
  }

  const returnRule = !isRound
    ? 'One-Way FASTag'
    : within24h
      ? '24h Return FASTag'
      : `${safeDays}-Day Both-Way FASTag`;

  return {
    verified: true,
    exactToll,
    singleWayToll,
    plazaCount: resolvedPlazas.length,
    plazaNames: resolvedPlazas.map((p) => p.name),
    tollClass: tollClass.key,
    tollClassLabel: tollClass.label,
    returnRule,
  };
}

/**
 * Legacy wrapper preserved for callers migrating to calculateExactRouteToll.
 * Returns verified exactToll in estimatedToll when verified, or 0 when unverified.
 */
export function estimateRouteToll(opts = {}) {
  const res = calculateExactRouteToll(opts);
  return {
    ...res,
    estimatedToll: res.verified ? res.exactToll : 0,
    isEstimated: !res.verified,
  };
}
