import baseTariffConfig from '../data/tariff_config.json' with { type: 'json' };

export const MASTER_TARIFF_STORAGE_KEY = 'kt_master_tariff_override_v1';

/**
 * Returns the active Single Master Tariff configuration.
 * On the browser, merges any live operator overrides from localStorage.
 */
export function getMasterTariff() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(MASTER_TARIFF_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.vehicles && parsed.state_permits) {
          return {
            ...baseTariffConfig,
            ...parsed,
            vehicles: { ...baseTariffConfig.vehicles, ...(parsed.vehicles || {}) },
            tempo_fleet: { ...baseTariffConfig.tempo_fleet, ...(parsed.tempo_fleet || {}) },
            state_permits: { ...baseTariffConfig.state_permits, ...(parsed.state_permits || {}) },
            airport_tariffs: { ...baseTariffConfig.airport_tariffs, ...(parsed.airport_tariffs || {}) },
            acting_drivers: { ...baseTariffConfig.acting_drivers, ...(parsed.acting_drivers || {}) },
            tour_packages: { ...baseTariffConfig.tour_packages, ...(parsed.tour_packages || {}) }
          };
        }
      }
    } catch (_) {
      // Fall back to base config if storage is malformed
    }
  }
  return baseTariffConfig;
}

/**
 * Saves live Master Tariff edits in localStorage and broadcasts a global update event.
 */
export function saveMasterTariffOverride(newConfig) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(MASTER_TARIFF_STORAGE_KEY, JSON.stringify(newConfig));
      window.dispatchEvent(new CustomEvent('kt_master_tariff_updated', { detail: newConfig }));
    } catch (_) {}
  }
}

/**
 * Clears local Master Tariff overrides so defaults from tariff_config.json are restored.
 */
export function clearMasterTariffOverride() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(MASTER_TARIFF_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('kt_master_tariff_updated', { detail: baseTariffConfig }));
    } catch (_) {}
  }
}

/**
 * Maps any vehicle key, ID, or label to its statutory Parivahan Checkpost Tax class:
 * - 'sedan' (4+1 Motor Cab: Swift Dzire, Toyota Etios)
 * - 'suv'   (6+1 Motor/Maxi Cab: Maruti Ertiga, XL6)
 * - 'muv'   (7+1 Maxi Cab: Toyota Innova, Innova Crysta)
 * - 'tempo' (12+1 to 14+1 Maxi Cab: 12-Seater / 14-Seater Tempo Traveller)
 * - 'coach' (16+1 to 26+1 Large Coach / Van: 17S, 20S, 26S Tempo / Mini Bus, Force Urbania)
 */
export function getVehiclePermitCategory(vehicleNameOrId = '') {
  const v = String(vehicleNameOrId || '').toLowerCase().trim();
  if (!v) return 'sedan';

  if (
    v.includes('urbania') ||
    v.includes('tempo17') ||
    v.includes('17-seater') ||
    v.includes('17 seater') ||
    v.includes('20-seater') ||
    v.includes('20 seater') ||
    v.includes('26-seater') ||
    v.includes('26 seater') ||
    v.includes('mini bus') ||
    v.includes('coach')
  ) {
    return 'coach';
  }

  if (
    v.includes('tempo') ||
    v.includes('12-seater') ||
    v.includes('12 seater') ||
    v.includes('14-seater') ||
    v.includes('14 seater')
  ) {
    return 'tempo';
  }

  if (v.includes('innova') || v.includes('crysta') || v.includes('muv') || v.includes('hycross')) {
    return 'muv';
  }

  if (v.includes('ertiga') || v.includes('xl6') || v.includes('suv') || v.includes('carens') || v.includes('marazzo')) {
    return 'suv';
  }

  return 'sedan';
}

/**
 * Detects the destination state code ('TN', 'PY', 'AP', 'KA', 'KL') from a route text or explicit state code.
 */
export function detectDestinationStateCode(routeTextOrCode = '', tariffOverride = null) {
  const raw = String(routeTextOrCode || '').trim();
  if (!raw) return 'TN';

  const upper = raw.toUpperCase();
  if (['TN', 'PY', 'AP', 'KA', 'KL'].includes(upper)) {
    return upper;
  }

  const lower = raw.toLowerCase();
  const master = tariffOverride || getMasterTariff();
  const permits = master.state_permits || baseTariffConfig.state_permits;

  // Check interstate codes in priority order
  for (const code of ['AP', 'KA', 'PY', 'KL']) {
    const stateEntry = permits[code];
    if (!stateEntry) continue;
    const keywords = stateEntry.keywords || [];
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return code;
    }
  }

  return 'TN';
}

/**
 * Computes the official Parivahan State Entry Permit and estimated highway tolls
 * for a given destination/route and vehicle.
 * Supports both positional args and an options object:
 *   getStatePermitForRoute(routeTextOrStateCode, vehicleNameOrId, isRoundTrip, distanceKm, tariffOverride)
 *   getStatePermitForRoute({ destinationText, stateCode, vehicleIdOrName, is1DayFixedTourPackage, isRoundTrip, distanceKm, tariff })
 */
export function getStatePermitForRoute(
  arg1 = '',
  vehicleNameOrId = 'Swift Dzire',
  isRoundTrip = true,
  distanceKm = 0,
  tariffOverride = null
) {
  let routeTextOrStateCode = arg1;
  let vName = vehicleNameOrId;
  let roundTrip = isRoundTrip;
  let distKm = distanceKm;
  let customTariff = tariffOverride;
  let is1DayFixedTourPackage = false;

  if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
    routeTextOrStateCode = arg1.stateCode || arg1.destinationText || arg1.routeText || '';
    vName = arg1.vehicleIdOrName || arg1.vehicleNameOrId || arg1.vehicle || 'Swift Dzire';
    roundTrip = arg1.isRoundTrip !== undefined ? arg1.isRoundTrip : true;
    distKm = arg1.distanceKm || 0;
    customTariff = arg1.tariff || arg1.tariffOverride || null;
    is1DayFixedTourPackage = Boolean(arg1.is1DayFixedTourPackage);
  }

  const master = customTariff || getMasterTariff();
  const permits = master.state_permits || baseTariffConfig.state_permits;
  const stateCode = detectDestinationStateCode(routeTextOrStateCode, master);
  const stateEntry = permits[stateCode] || permits.TN;
  const vehicleCategory = getVehiclePermitCategory(vName);

  const rawPermitCost = Number(stateEntry?.rates?.[vehicleCategory] ?? 0);
  const permitCost = is1DayFixedTourPackage ? 0 : rawPermitCost;
  const totalKm = roundTrip ? (Number(distKm) || 0) * 2 : (Number(distKm) || 0);

  let tollsEst = 0;
  if (stateCode === 'TN') {
    const factor = stateEntry?.tolls_est?.per_km_factor || 0.85;
    const minToll = stateEntry?.tolls_est?.min_toll || 80;
    tollsEst = Math.round((totalKm * factor) / 10) * 10;
    if (tollsEst < minToll && totalKm >= 50) tollsEst = minToll;
  } else {
    tollsEst = roundTrip
      ? Number(stateEntry?.tolls_est?.round_trip || 400)
      : Number(stateEntry?.tolls_est?.one_way || 220);
  }

  return {
    stateCode,
    stateName: stateEntry?.stateName || 'Tamil Nadu',
    vehicleCategory,
    permitCost,
    amount: permitCost,
    statePermitEst: permitCost,
    rawStatutoryPermitCost: rawPermitCost,
    is1DayFixedTourPackage,
    tollsOneWay: Number(stateEntry?.tolls_est?.one_way || 0),
    tollsRoundTrip: Number(stateEntry?.tolls_est?.round_trip || 0),
    tollsEst,
    authority: stateEntry?.authority || '',
    statutoryBasis: stateEntry?.statutoryBasis || '',
    validity: stateEntry?.validity || '7 Days Short-Term Entry Tax',
    portalUrl: stateEntry?.portalUrl || 'https://checkpost.parivahan.gov.in/'
  };
}

/**
 * Unified replacement for estimateRoadExtras across QuotationEngine, OutstationQuotationModal, and AirportBookingEngine.
 */
export function estimateRoadExtrasFromMaster(
  pickup = '',
  drop = '',
  distanceKm = 0,
  days = 1,
  isRoundTrip = true,
  vehicle = 'Swift Dzire',
  tariffOverride = null
) {
  const master = tariffOverride || getMasterTariff();
  const text = `${pickup || ''} ${drop || ''}`.trim();
  const nights = isRoundTrip ? Math.max(0, (Number(days) || 1) - 1) : 0;

  const permitInfo = getStatePermitForRoute(text, vehicle, isRoundTrip, distanceKm, master);
  const statePermitEst = permitInfo.permitCost;
  const tollsEst = permitInfo.tollsEst;
  const nightStayRate = Number(master?.acting_drivers?.outstation_cab_driver_night_stay || 450);
  const driverNightStayEst = nights * nightStayRate;
  const roadExtrasEst = tollsEst + statePermitEst + driverNightStayEst;

  return {
    stateCode: permitInfo.stateCode,
    stateName: permitInfo.stateName,
    vehicleCategory: permitInfo.vehicleCategory,
    statePermitEst,
    tollsEst,
    nights,
    driverNightStayEst,
    roadExtrasEst
  };
}

/**
 * Computes the flat Chennai city airport transfer fare from the Single Master Tariff.
 */
export function getCityAirportFlatFareFromMaster(locText = '', selectedVeh = 'Swift Dzire', tariffOverride = null) {
  const master = tariffOverride || getMasterTariff();
  const airportConfig = master.airport_tariffs || baseTariffConfig.airport_tariffs;
  const zones = airportConfig?.city_zones || {};
  const mults = airportConfig?.vehicle_multipliers || {
    sedan: 1.0,
    ertiga: 1.5,
    innova: 1.8,
    crysta: 2.0,
    tempo: 2.8,
    tempo_min_fare: 2400
  };

  const t = (locText || '').toLowerCase();
  let baseSedan = zones.south?.sedan_base || 650;

  if (
    t.includes('omr') ||
    t.includes('sholinganallur') ||
    t.includes('siruseri') ||
    t.includes('navalur') ||
    t.includes('perungudi') ||
    t.includes('thoraipakkam') ||
    t.includes('kelambakkam')
  ) {
    baseSedan = zones.omr?.sedan_base || 1250;
  } else if (
    t.includes('ecr') ||
    t.includes('kovalam') ||
    t.includes('muttukadu') ||
    t.includes('kanathur') ||
    t.includes('akkarai')
  ) {
    baseSedan = zones.ecr?.sedan_base || 1400;
  } else if (
    t.includes('central') ||
    t.includes('t nagar') ||
    t.includes('t. nagar') ||
    t.includes('anna nagar') ||
    t.includes('egmore') ||
    t.includes('mylapore') ||
    t.includes('besant nagar') ||
    t.includes('adyar') ||
    t.includes('triplicane') ||
    t.includes('marina') ||
    t.includes('nungambakkam') ||
    t.includes('vadapalani') ||
    t.includes('koyambedu') ||
    t.includes('kilpauk') ||
    t.includes('royapettah') ||
    t.includes('tiruvalluvar nagar') ||
    t.includes('thiruvanmiyur')
  ) {
    baseSedan = zones.central?.sedan_base || 950;
  } else if (
    t.includes('ambattur') ||
    t.includes('avadi') ||
    t.includes('madhavaram') ||
    t.includes('redhills') ||
    t.includes('red hills') ||
    t.includes('kolathur')
  ) {
    baseSedan = zones.north_west?.sedan_base || 1150;
  } else if (
    t.includes('tambaram') ||
    t.includes('guindy') ||
    t.includes('pallavaram') ||
    t.includes('chromepet') ||
    t.includes('alandur') ||
    t.includes('velachery') ||
    t.includes('medavakkam') ||
    t.includes('madipakkam') ||
    t.includes('porur') ||
    t.includes('poonamallee')
  ) {
    baseSedan = zones.south?.sedan_base || 650;
  } else {
    baseSedan = zones.central?.sedan_base || 950;
  }

  const v = String(selectedVeh || '');
  if (v.includes('Ertiga')) return Math.round((baseSedan * (mults.ertiga || 1.5)) / 50) * 50;
  if (v.includes('Innova Crysta')) return Math.round((baseSedan * (mults.crysta || 2.0)) / 50) * 50;
  if (v.includes('Innova')) return Math.round((baseSedan * (mults.innova || 1.8)) / 50) * 50;
  if (v.includes('Tempo') || v.includes('Urbania')) {
    return Math.max(mults.tempo_min_fare || 2400, Math.round((baseSedan * (mults.tempo || 2.8)) / 50) * 50);
  }
  return baseSedan;
}
