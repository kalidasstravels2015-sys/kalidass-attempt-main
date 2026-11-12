/**
 * Centralized Vehicle Metadata Helper
 *
 * Provides single source of truth for:
 * - Fleet image paths
 * - Passenger seat capacities (with automatic parser from tariff config `seats` like '12+1')
 * - Badges and category labels
 * - Smart category-aware fallbacks (never falling back to a sedan for tempos/coaches)
 * - Tariff deduplication and anchor aliases
 */

export interface VehicleMeta {
  name: string;
  image: string;
  capacity: string;
  seatCount: number;
  badge: string;
  category: string;
  luggage: string;
  acType: string;
  aliases?: string[];
}

export const KNOWN_VEHICLE_METADATA: Record<string, VehicleMeta> = {
  "Swift Dzire": {
    name: "Swift Dzire",
    image: "/images/fleet/swift-dzire.webp",
    capacity: "4 Seats",
    seatCount: 4,
    badge: "Best Value Sedan",
    category: "Sedan",
    luggage: "2 Bags",
    acType: "Dual Zone AC"
  },
  "Toyota Etios": {
    name: "Toyota Etios",
    image: "/images/fleet/toyoto-etios.webp",
    capacity: "4 Seats",
    seatCount: 4,
    badge: "Comfort Sedan",
    category: "Sedan",
    luggage: "2 Bags",
    acType: "Standard AC"
  },
  "Maruti Ertiga": {
    name: "Maruti Ertiga",
    image: "/images/fleet/maruti-ertiga.webp",
    capacity: "6 Seats",
    seatCount: 6,
    badge: "Popular 7-Seater MPV",
    category: "Family MPV",
    luggage: "3 Bags",
    acType: "Dual AC with Rear Vents"
  },
  "Innova": {
    name: "Toyota Innova",
    image: "/images/fleet/toyota-innova.webp",
    capacity: "7 Seats",
    seatCount: 7,
    badge: "Legendary Comfort MUV",
    category: "Comfort MUV",
    luggage: "4 Bags",
    acType: "Dual AC with Roof Louvers"
  },
  "Innova Crysta": {
    name: "Toyota Innova Crysta",
    image: "/images/fleet/innova-crysta.webp",
    capacity: "7 Seats",
    seatCount: 7,
    badge: "VIP Executive Luxury",
    category: "Luxury MPV",
    luggage: "5 Large Bags",
    acType: "Automatic Multi-Zone Climate Control"
  },
  "Tempo Traveller": {
    name: "Tempo Traveller",
    image: "/images/fleet/tempo-12.webp",
    capacity: "12 Seats",
    seatCount: 12,
    badge: "Group Travel Special",
    category: "Tempo Traveller",
    luggage: "8–10 Bags",
    acType: "High-Capacity Dual Commercial AC"
  },
  "12-Seater Luxury Force Tempo": {
    name: "12-Seater Luxury Force Tempo",
    image: "/images/fleet/tempo-12.webp",
    capacity: "12 Seats",
    seatCount: 12,
    badge: "Most Popular For Families",
    category: "Tempo Traveller",
    luggage: "3–4 Medium Trolleys + 8–10 Backpacks",
    acType: "Dual Commercial Compressors + Row Louvers",
    aliases: ["tempo-traveller", "tempo-12"]
  },
  "14-Seater Executive Force Tempo": {
    name: "14-Seater Executive Force Tempo",
    image: "/images/fleet/tempo-12.webp",
    capacity: "14 Seats",
    seatCount: 14,
    badge: "Extra Boot Space & Legroom",
    category: "Tempo Traveller",
    luggage: "5–6 Medium Trolleys + 10–12 Backpacks",
    acType: "Dual Commercial Compressors + Row Louvers",
    aliases: ["tempo-14"]
  },
  "17-Seater Executive Force Tempo": {
    name: "17-Seater Executive Force Tempo",
    image: "/images/fleet/tempo-17.webp",
    capacity: "17 Seats",
    seatCount: 17,
    badge: "Best Value For Large Groups",
    category: "Tempo Traveller",
    luggage: "6–7 Medium Trolleys + 14–16 Backpacks",
    acType: "Heavy-Duty Twin Commercial AC",
    aliases: ["tempo-17"]
  },
  "20-Seater Grand Force Tempo": {
    name: "20-Seater Grand Force Tempo",
    image: "/images/fleet/tempo-17.webp",
    capacity: "20 Seats",
    seatCount: 20,
    badge: "Extended Family & Weddings",
    category: "Tempo Traveller",
    luggage: "7–8 Medium Trolleys + 16–20 Backpacks",
    acType: "Twin High-CFM Dual AC Compressors",
    aliases: ["tempo-20"]
  },
  "26-Seater Mini Bus / Force Tempo": {
    name: "26-Seater Mini Bus / Force Tempo",
    image: "/images/fleet/tempo.webp",
    capacity: "26 Seats",
    seatCount: 26,
    badge: "Large Delegations & Bus Charter",
    category: "Mini Bus Coach",
    luggage: "10–12 Large Suitcases + 20+ Backpacks",
    acType: "Roof-Mounted Heavy-Duty Commercial Bus AC",
    aliases: ["tempo-26", "mini-bus"]
  },
  "Force Urbania": {
    name: "Force Urbania",
    image: "/images/fleet/force-urbania.webp",
    capacity: "12–16 Seats",
    seatCount: 16,
    badge: "Super Luxury VIP Van",
    category: "VIP Luxury Van",
    luggage: "12 Bags",
    acType: "Triple-Zone Automatic Climate Control"
  },
  "Force Urbania VIP Luxury": {
    name: "Force Urbania VIP Luxury",
    image: "/images/fleet/force-urbania.webp",
    capacity: "12–16 Seats",
    seatCount: 16,
    badge: "Super Luxury VIP Van",
    category: "VIP Luxury Van",
    luggage: "6–8 Executive Suitcases + Overhead Bins",
    acType: "Triple-Zone Automatic Climate Control",
    aliases: ["force-urbania", "urbania-vip"]
  }
};

/**
 * Smart helper to extract seat label from config string like "12+1" or "4+1"
 */
export function formatSeatCapacity(seatsRaw?: string, fallbackSeats: number = 4): { capacity: string; seatCount: number } {
  if (!seatsRaw) {
    return { capacity: `${fallbackSeats} Seats`, seatCount: fallbackSeats };
  }
  const match = seatsRaw.match(/^(\d+)(?:\+\d+)?/);
  if (match) {
    const count = parseInt(match[1], 10);
    return { capacity: `${count} Seats`, seatCount: count };
  }
  return { capacity: `${seatsRaw} Seats`, seatCount: fallbackSeats };
}

/**
 * Resolve full vehicle metadata with intelligent fallback logic based on vehicle name and category
 */
export function getVehicleMetadata(vehicleName: string, rawConfig?: { seats?: string; category?: string }): VehicleMeta {
  const cleanName = (vehicleName || '').trim();
  const known = KNOWN_VEHICLE_METADATA[cleanName];

  if (known) {
    return known;
  }

  // Attempt fuzzy match
  const lower = cleanName.toLowerCase();
  for (const [key, meta] of Object.entries(KNOWN_VEHICLE_METADATA)) {
    if (lower === key.toLowerCase() || (meta.aliases && meta.aliases.some(a => lower.includes(a)))) {
      return meta;
    }
  }

  // Category & name aware fallbacks - NEVER fall back to a sedan for tempos/coaches/vans!
  const category = (rawConfig?.category || '').toLowerCase();
  const isTempoOrCoach = category.includes('tempo') || category.includes('coach') || lower.includes('tempo') || lower.includes('urbania') || lower.includes('bus');
  const isSuvOrMuv = category.includes('suv') || category.includes('muv') || category.includes('mpv') || lower.includes('ertiga') || lower.includes('innova');

  const { capacity, seatCount } = formatSeatCapacity(rawConfig?.seats, isTempoOrCoach ? 12 : isSuvOrMuv ? 7 : 4);

  let image = "/images/fleet/swift-dzire.webp";
  let badge = "Comfort Cab";
  let vehicleCategory = "Car Rental";

  if (isTempoOrCoach) {
    if (lower.includes('urbania')) {
      image = "/images/fleet/force-urbania.webp";
      badge = "Super Luxury VIP Van";
      vehicleCategory = "VIP Luxury Van";
    } else if (seatCount >= 26 || lower.includes('bus')) {
      image = "/images/fleet/tempo.webp";
      badge = "Large Delegations & Bus Charter";
      vehicleCategory = "Mini Bus Coach";
    } else if (seatCount >= 17) {
      image = "/images/fleet/tempo-17.webp";
      badge = "Best Value For Large Groups";
      vehicleCategory = "Tempo Traveller";
    } else {
      image = "/images/fleet/tempo-12.webp";
      badge = "Group Travel Special";
      vehicleCategory = "Tempo Traveller";
    }
  } else if (isSuvOrMuv) {
    if (lower.includes('crysta')) {
      image = "/images/fleet/innova-crysta.webp";
      badge = "VIP Executive Luxury";
      vehicleCategory = "Luxury MPV";
    } else if (lower.includes('innova')) {
      image = "/images/fleet/toyota-innova.webp";
      badge = "Legendary Comfort MUV";
      vehicleCategory = "Comfort MUV";
    } else {
      image = "/images/fleet/maruti-ertiga.webp";
      badge = "Popular 7-Seater MPV";
      vehicleCategory = "Family MPV";
    }
  } else {
    if (lower.includes('etios')) {
      image = "/images/fleet/toyoto-etios.webp";
      badge = "Comfort Sedan";
      vehicleCategory = "Sedan";
    } else {
      image = "/images/fleet/swift-dzire.webp";
      badge = "Best Value Sedan";
      vehicleCategory = "Sedan";
    }
  }

  return {
    name: cleanName,
    image,
    capacity,
    seatCount,
    badge,
    category: vehicleCategory,
    luggage: isTempoOrCoach ? "8–10 Bags" : isSuvOrMuv ? "4 Bags" : "2 Bags",
    acType: isTempoOrCoach ? "Commercial High-Output AC" : "AC"
  };
}

/**
 * Filter and deduplicate tariff entries so the user gets the clean, distinct fleet:
 * Dzire, Etios, Ertiga, Innova, Crysta, 12-Seater, 14-Seater, 17-Seater, 20-Seater, 26-Seater, Force Urbania VIP
 * 
 * Redundant generic entries ('Tempo Traveller' which is 12-seater duplicate and 'Force Urbania' which is VIP duplicate)
 * are excluded from direct listing while their anchor aliases remain supported.
 */
export function getDeduplicatedTariffVehicles(allVehicles: Record<string, any>): Array<[string, any, VehicleMeta]> {
  // Ordered preferred keys
  const preferredKeys = [
    "Swift Dzire",
    "Toyota Etios",
    "Maruti Ertiga",
    "Innova",
    "Innova Crysta",
    "12-Seater Luxury Force Tempo",
    "14-Seater Executive Force Tempo",
    "17-Seater Executive Force Tempo",
    "20-Seater Grand Force Tempo",
    "26-Seater Mini Bus / Force Tempo",
    "Force Urbania VIP Luxury"
  ];

  const result: Array<[string, any, VehicleMeta]> = [];

  for (const key of preferredKeys) {
    const config = allVehicles[key];
    if (config) {
      result.push([key, config, getVehicleMetadata(key, config)]);
    }
  }

  // Fallback in case config has custom keys not in preferred list
  for (const [key, config] of Object.entries(allVehicles)) {
    if (
      !preferredKeys.includes(key) &&
      key !== "Tempo Traveller" && // generic duplicate of 12-Seater
      key !== "Force Urbania"      // generic duplicate of Force Urbania VIP Luxury
    ) {
      result.push([key, config, getVehicleMetadata(key, config)]);
    }
  }

  return result;
}

/**
 * Returns any backward compatibility alias IDs for a vehicle slug
 */
export function getSlugAliases(vehicleName: string): string[] {
  const slug = (vehicleName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (slug === '12-seater-luxury-force-tempo') {
    return ['tempo-traveller', 'tempo-12'];
  }
  if (slug === 'force-urbania-vip-luxury') {
    return ['force-urbania'];
  }
  if (slug === '14-seater-executive-force-tempo') {
    return ['tempo-14'];
  }
  if (slug === '17-seater-executive-force-tempo') {
    return ['tempo-17'];
  }
  if (slug === '20-seater-grand-force-tempo') {
    return ['tempo-20'];
  }
  if (slug === '26-seater-mini-bus-force-tempo') {
    return ['tempo-26', 'mini-bus'];
  }
  return [];
}

/**
 * Natural dimensions of fleet images in /images/fleet/*.webp
 * Used to compute exact intrinsic aspect-ratio width/height attributes for Lighthouse Best Practices.
 */
export const FLEET_IMAGE_NATURAL_DIMS: Record<string, { width: number; height: number }> = {
  "swift-dzire.webp": { width: 478, height: 236 },
  "toyoto-etios.webp": { width: 600, height: 399 },
  "maruti-ertiga.webp": { width: 600, height: 298 },
  "toyota-innova.webp": { width: 600, height: 287 },
  "innova-crysta.webp": { width: 475, height: 207 },
  "tempo-12.webp": { width: 1161, height: 658 },
  "tempo-17.webp": { width: 1169, height: 647 },
  "tempo.webp": { width: 442, height: 253 },
  "force-urbania.webp": { width: 677, height: 405 },
};

export function getFleetImageDimensions(imagePath: string, targetWidth: number = 128): { width: number; height: number } {
  const filename = (imagePath || "").split("/").pop()?.split("?")[0] || "";
  const dims = FLEET_IMAGE_NATURAL_DIMS[filename];
  if (!dims) {
    return { width: targetWidth, height: Math.round(targetWidth * 0.5) };
  }
  return {
    width: targetWidth,
    height: Math.round(targetWidth * (dims.height / dims.width)),
  };
}

