import tariffConfig from '../data/tariff_config.json';
import { buildWhatsAppUrl } from './whatsapp';

export interface QuoteRequest {
  service?: 'outstation' | 'local' | 'airport' | 'acting-drivers' | 'corporate' | string;
  vehicle?: string;
  dest?: string;
  destination?: string;
  pickup?: string;
  days?: number | string;
  type?: 'round' | 'oneway' | string;
  tripType?: 'round' | 'oneway' | string;
  pkg?: string;
  package?: string;
  airportDirection?: 'to_airport' | 'from_airport';
  airportAddress?: string;
  driverType?: 'city_4hr' | 'city_8hr' | 'outstation' | 'oneway_drop';
  corporatePkg?: string;
  needGst?: boolean;
}

export interface LineItem {
  label: string;
  amount: string;
}

export interface QuoteBreakdown {
  service: string;
  vehicle: {
    key: string;
    name: string;
    fullName: string;
    category: string;
    seats: number | string;
    isLarge: boolean;
  };
  tripDetails: {
    origin: string;
    destination: string;
    tripType: string;
    days: number;
    hours?: number;
    packageLabel?: string;
  };
  billedKm: number;
  ratePerKm?: number;
  kmCost: number;
  driverBata: number;
  isInterstate: boolean;
  stateCode?: string;
  statePermit: number;
  extraKmRate?: number;
  extraHrRate?: number;
  baseSubtotal: number;
  taxableAmount: number;
  gstAmount: number;
  totalFare: number;
  advance: number;
  netBalance: number;
  lineItems: LineItem[];
  paymentRules: string[];
  restaurantBill: string;
  deepLinkUrl: string;
  bookingWhatsAppUrl: string;
}

// Master lookup of known outstation destinations from Chennai (Zero API cost)
export const KNOWN_DESTINATIONS: Record<string, { name: string; roundTripKm: number; oneWayKm: number; stateCode: string; defaultDays: number }> = {
  'tirupati': { name: 'Tirupati Balaji', roundTripKm: 320, oneWayKm: 135, stateCode: 'AP', defaultDays: 1 },
  'tirumala': { name: 'Tirumala Hills', roundTripKm: 340, oneWayKm: 155, stateCode: 'AP', defaultDays: 1 },
  'pondicherry': { name: 'Pondicherry & Auroville', roundTripKm: 310, oneWayKm: 151, stateCode: 'PY', defaultDays: 1 },
  'puducherry': { name: 'Pondicherry & Auroville', roundTripKm: 310, oneWayKm: 151, stateCode: 'PY', defaultDays: 1 },
  'thiruvannamalai': { name: 'Thiruvannamalai Girivalam', roundTripKm: 390, oneWayKm: 195, stateCode: 'TN', defaultDays: 1 },
  'tiruvannamalai': { name: 'Thiruvannamalai Girivalam', roundTripKm: 390, oneWayKm: 195, stateCode: 'TN', defaultDays: 1 },
  'kanchipuram': { name: 'Kanchipuram Temples', roundTripKm: 150, oneWayKm: 75, stateCode: 'TN', defaultDays: 1 },
  'kancheepuram': { name: 'Kanchipuram Temples', roundTripKm: 150, oneWayKm: 75, stateCode: 'TN', defaultDays: 1 },
  'kanchi': { name: 'Kanchipuram Temples', roundTripKm: 150, oneWayKm: 75, stateCode: 'TN', defaultDays: 1 },
  'kanchepuram': { name: 'Kanchipuram Temples', roundTripKm: 150, oneWayKm: 75, stateCode: 'TN', defaultDays: 1 },
  'kanjipuram': { name: 'Kanchipuram Temples', roundTripKm: 150, oneWayKm: 75, stateCode: 'TN', defaultDays: 1 },
  'kanhipuram': { name: 'Kanchipuram Temples', roundTripKm: 150, oneWayKm: 75, stateCode: 'TN', defaultDays: 1 },
  'vellore': { name: 'Vellore Golden Temple & CMC', roundTripKm: 280, oneWayKm: 140, stateCode: 'TN', defaultDays: 1 },
  'mahabalipuram': { name: 'Mahabalipuram Shore', roundTripKm: 120, oneWayKm: 55, stateCode: 'TN', defaultDays: 1 },
  'mamallapuram': { name: 'Mahabalipuram Shore', roundTripKm: 120, oneWayKm: 55, stateCode: 'TN', defaultDays: 1 },
  'chidambaram': { name: 'Chidambaram Natarajar', roundTripKm: 450, oneWayKm: 230, stateCode: 'TN', defaultDays: 1 },
  'kumbakonam': { name: 'Kumbakonam Navagraha', roundTripKm: 650, oneWayKm: 310, stateCode: 'TN', defaultDays: 2 },
  'navagraha': { name: 'Kumbakonam Navagraha', roundTripKm: 650, oneWayKm: 310, stateCode: 'TN', defaultDays: 2 },
  'rameswaram': { name: 'Rameswaram Jyotirlinga', roundTripKm: 1100, oneWayKm: 550, stateCode: 'TN', defaultDays: 3 },
  'rameshwaram': { name: 'Rameswaram Jyotirlinga', roundTripKm: 1100, oneWayKm: 550, stateCode: 'TN', defaultDays: 3 },
  'sabarimala': { name: 'Sabarimala Pilgrimage', roundTripKm: 1300, oneWayKm: 650, stateCode: 'KL', defaultDays: 3 },
  'nilakkal': { name: 'Sabarimala (Nilakkal)', roundTripKm: 1300, oneWayKm: 650, stateCode: 'KL', defaultDays: 3 },
  'pamba': { name: 'Sabarimala (Pamba)', roundTripKm: 1300, oneWayKm: 650, stateCode: 'KL', defaultDays: 3 },
  'tiruchendur': { name: 'Tiruchendur Murugan', roundTripKm: 1250, oneWayKm: 625, stateCode: 'TN', defaultDays: 2 },
  'bangalore': { name: 'Bangalore / Bengaluru', roundTripKm: 700, oneWayKm: 350, stateCode: 'KA', defaultDays: 2 },
  'bengaluru': { name: 'Bangalore / Bengaluru', roundTripKm: 700, oneWayKm: 350, stateCode: 'KA', defaultDays: 2 },
  'mysore': { name: 'Mysore Palace', roundTripKm: 960, oneWayKm: 480, stateCode: 'KA', defaultDays: 3 },
  'mysuru': { name: 'Mysore Palace', roundTripKm: 960, oneWayKm: 480, stateCode: 'KA', defaultDays: 3 },
  'coimbatore': { name: 'Coimbatore Isha Yoga', roundTripKm: 1010, oneWayKm: 505, stateCode: 'TN', defaultDays: 2 },
  'madurai': { name: 'Madurai Meenakshi', roundTripKm: 924, oneWayKm: 462, stateCode: 'TN', defaultDays: 2 },
  'trichy': { name: 'Trichy Srirangam', roundTripKm: 664, oneWayKm: 332, stateCode: 'TN', defaultDays: 2 },
  'salem': { name: 'Salem', roundTripKm: 680, oneWayKm: 340, stateCode: 'TN', defaultDays: 2 },
  'ooty': { name: 'Ooty Nilgiris', roundTripKm: 1110, oneWayKm: 555, stateCode: 'TN', defaultDays: 3 },
  'kodaikanal': { name: 'Kodaikanal Hills', roundTripKm: 1060, oneWayKm: 530, stateCode: 'TN', defaultDays: 3 },
  'munnar': { name: 'Munnar Tea Hills', roundTripKm: 1180, oneWayKm: 590, stateCode: 'KL', defaultDays: 3 },
  'yelagiri': { name: 'Yelagiri Hills', roundTripKm: 460, oneWayKm: 230, stateCode: 'TN', defaultDays: 2 },
  'yercaud': { name: 'Yercaud Hills', roundTripKm: 740, oneWayKm: 370, stateCode: 'TN', defaultDays: 2 }
};

// 5 Standard city packages
export const LOCAL_PACKAGES: Record<string, { hours: number; km: number; label: string; configKey: string }> = {
  'local_4hr_pkg': { hours: 4, km: 40, label: '4 Hrs / 40 KM', configKey: 'local_4hr_pkg' },
  '4hr': { hours: 4, km: 40, label: '4 Hrs / 40 KM', configKey: 'local_4hr_pkg' },
  '4': { hours: 4, km: 40, label: '4 Hrs / 40 KM', configKey: 'local_4hr_pkg' },
  'local_5hr_pkg': { hours: 5, km: 50, label: '5 Hrs / 50 KM (Half Day)', configKey: 'local_5hr_pkg' },
  '5hr': { hours: 5, km: 50, label: '5 Hrs / 50 KM (Half Day)', configKey: 'local_5hr_pkg' },
  '5': { hours: 5, km: 50, label: '5 Hrs / 50 KM (Half Day)', configKey: 'local_5hr_pkg' },
  'local_8hr_pkg': { hours: 8, km: 80, label: '8 Hrs / 80 KM (Full Day)', configKey: 'local_8hr_pkg' },
  '8hr': { hours: 8, km: 80, label: '8 Hrs / 80 KM (Full Day)', configKey: 'local_8hr_pkg' },
  '8': { hours: 8, km: 80, label: '8 Hrs / 80 KM (Full Day)', configKey: 'local_8hr_pkg' },
  'local_10hr_pkg': { hours: 10, km: 100, label: '10 Hrs / 100 KM', configKey: 'local_10hr_pkg' },
  '10hr': { hours: 10, km: 100, label: '10 Hrs / 100 KM', configKey: 'local_10hr_pkg' },
  '10': { hours: 10, km: 100, label: '10 Hrs / 100 KM', configKey: 'local_10hr_pkg' },
  'local_12hr_pkg': { hours: 12, km: 120, label: '12 Hrs / 120 KM (Extended Day)', configKey: 'local_12hr_pkg' },
  '12hr': { hours: 12, km: 120, label: '12 Hrs / 120 KM (Extended Day)', configKey: 'local_12hr_pkg' },
  '12': { hours: 12, km: 120, label: '12 Hrs / 120 KM (Extended Day)', configKey: 'local_12hr_pkg' }
};

// Chennai Airport Zones
export const AIRPORT_ZONES = [
  { key: 'south', label: 'South Chennai (Medavakkam, Tambaram, Guindy, Velachery)', sedan: 650, km: 15 },
  { key: 'central', label: 'Central Chennai (T. Nagar, Anna Nagar, Egmore, Adyar)', sedan: 950, km: 22 },
  { key: 'north_west', label: 'North / West Chennai (Ambattur, Avadi, Madhavaram)', sedan: 1150, km: 32 },
  { key: 'omr', label: 'OMR IT Corridor (Perungudi, Thoraipakkam, Siruseri)', sedan: 1250, km: 30 },
  { key: 'ecr', label: 'ECR Coastal (Akkarai, Injambakkam, Mahabalipuram)', sedan: 1400, km: 40 }
];

export function resolveVehicle(vName?: string) {
  const norm = (vName || '').toLowerCase().trim();
  if (norm.includes('urbania')) {
    return {
      key: 'Force Urbania VIP Luxury',
      name: 'Urbania',
      fullName: 'Force Urbania VIP Luxury Van (12+1)',
      category: 'coach',
      seats: 12,
      isLarge: true,
      airportMultiplier: 4.5,
      airportMinFare: 4500
    };
  }
  if (norm.includes('26') || norm.includes('mini bus')) {
    return {
      key: '26-Seater Mini Bus / Force Tempo',
      name: '26-Seater',
      fullName: '26-Seater Force Mini Bus Coach (26+1)',
      category: 'coach',
      seats: 26,
      isLarge: true,
      airportMultiplier: 4.2,
      airportMinFare: 4000
    };
  }
  if (norm.includes('20')) {
    return {
      key: '20-Seater Grand Force Tempo',
      name: '20-Seater',
      fullName: '20-Seater Grand Force Tempo (20+1)',
      category: 'coach',
      seats: 20,
      isLarge: true,
      airportMultiplier: 3.6,
      airportMinFare: 3200
    };
  }
  if (norm.includes('17')) {
    return {
      key: '17-Seater Executive Force Tempo',
      name: '17-Seater',
      fullName: '17-Seater Executive Force Tempo (17+1)',
      category: 'coach',
      seats: 17,
      isLarge: true,
      airportMultiplier: 3.2,
      airportMinFare: 2800
    };
  }
  if (norm.includes('14')) {
    return {
      key: '14-Seater Executive Force Tempo',
      name: '14-Seater',
      fullName: '14-Seater Executive Force Tempo (14+1)',
      category: 'tempo',
      seats: 14,
      isLarge: true,
      airportMultiplier: 3.0,
      airportMinFare: 2600
    };
  }
  if (norm.includes('tempo') || norm.includes('12-seater') || norm.includes('traveller')) {
    return {
      key: '12-Seater Luxury Force Tempo',
      name: '12-Seater',
      fullName: 'Force Tempo Traveller (12+1)',
      category: 'tempo',
      seats: 12,
      isLarge: true,
      airportMultiplier: 2.8,
      airportMinFare: 2400
    };
  }
  if (norm.includes('crysta')) {
    return {
      key: 'Innova Crysta',
      name: 'Crysta',
      fullName: 'Toyota Innova Crysta (7+1)',
      category: 'muv',
      seats: 7,
      isLarge: false,
      airportMultiplier: 2.0,
      airportMinFare: 1800
    };
  }
  if (norm.includes('innova')) {
    return {
      key: 'Innova',
      name: 'Innova',
      fullName: 'Toyota Innova (7+1)',
      category: 'muv',
      seats: 7,
      isLarge: false,
      airportMultiplier: 1.8,
      airportMinFare: 1600
    };
  }
  if (norm.includes('ertiga') || norm.includes('xl6')) {
    return {
      key: 'Maruti Ertiga',
      name: 'Ertiga',
      fullName: 'Maruti Ertiga / XL6 (6+1)',
      category: 'suv',
      seats: 6,
      isLarge: false,
      airportMultiplier: 1.5,
      airportMinFare: 1400
    };
  }
  // Default to Sedan
  return {
    key: 'Swift Dzire',
    name: 'Sedan',
    fullName: 'Swift Dzire / Toyota Etios (4+1)',
    category: 'sedan',
    seats: 4,
    isLarge: false,
    airportMultiplier: 1.0,
    airportMinFare: 650
  };
}

export function getVehicleConfig(vehicleKey: string) {
  const cfg = tariffConfig as any;
  return cfg.tempo_fleet?.[vehicleKey] ||
    cfg.vehicles?.[vehicleKey] ||
    cfg.vehicles?.['Swift Dzire'] ||
    {};
}

/**
 * Single Master Calculation Engine
 * Matches BookingEngine.jsx 100% to the rupee.
 */
export function calculateQuote(req: QuoteRequest): QuoteBreakdown {
  const service = (req.service || 'outstation').toLowerCase();
  const vehicle = resolveVehicle(req.vehicle);
  const vConfig = getVehicleConfig(vehicle.key);
  const needGst = req.needGst === true;
  const advance = vehicle.isLarge ? 2000 : 500;

  // ═════════════════════════════════════════════════════════════════════════
  // 1. LOCAL HOURLY PACKAGES
  // ═════════════════════════════════════════════════════════════════════════
  if (service === 'local' || service === 'local-hourly-cabs') {
    const rawPkg = req.pkg || req.package || 'local_4hr_pkg';
    const pkg = LOCAL_PACKAGES[rawPkg] || LOCAL_PACKAGES['local_4hr_pkg'];
    const baseFare = vConfig[pkg.configKey] || 1600;
    const extraKmRate = vConfig.extra_km_rate || 15;
    const extraHrRate = vConfig.extra_hr_rate || 150;
    const taxableAmount = baseFare;
    const gstAmount = needGst ? Math.round(taxableAmount * 0.05) : 0;
    const totalFare = baseFare + gstAmount;
    const netBalance = totalFare - advance;

    const lineItems: LineItem[] = [
      { label: `Base Package Fare (${pkg.label})`, amount: `₹${baseFare.toLocaleString('en-IN')}` }
    ];
    if (needGst) {
      lineItems.push({ label: 'GST (5% ITC Tax Invoice)', amount: `₹${gstAmount.toLocaleString('en-IN')}` });
    }
    lineItems.push({ label: 'Toll Gate Fees / Parking Charges', amount: 'Extra as per slip' });

    const paymentRules = [
      `₹${advance.toLocaleString('en-IN')} advance to reserve cab (deducted in final invoice)`,
      'Pay balance to chauffeur at trip end (UPI / Cash)',
      `Doorstep garage-to-garage timing • Extra km: ₹${extraKmRate}/km • Extra hr: ₹${extraHrRate}/hr`,
      'Free cancellation up to 6 hours before pickup'
    ];

    const restaurantBill = [
      `Chennai Local Hourly Rental`,
      `Package: ${pkg.label} • ${vehicle.fullName}`,
      `------------------------------------------------------------`,
      `Base Package Fare (${pkg.label}):`.padEnd(52) + `₹${baseFare.toLocaleString('en-IN')}`,
      needGst ? `GST Tax (5% ITC Invoice):`.padEnd(52) + `₹${gstAmount.toLocaleString('en-IN')}` : null,
      `Toll Gate Fees / Parking:`.padEnd(52) + `Extra as per slip`,
      `------------------------------------------------------------`,
      `Estimated Total Fare:`.padEnd(52) + `₹${totalFare.toLocaleString('en-IN')}`,
      `Advance to Reserve (deducted in final invoice):`.padEnd(52) + `₹${advance.toLocaleString('en-IN')}`,
      `Net Balance Payable to Chauffeur:`.padEnd(52) + `₹${netBalance.toLocaleString('en-IN')}`,
      `------------------------------------------------------------`,
      `PAYMENT & BILLING RULES:`,
      `• ₹${advance.toLocaleString('en-IN')} advance to reserve cab (deducted in final invoice)`,
      `• Pay balance to chauffeur at trip end (UPI / Cash)`,
      `• Doorstep garage-to-garage timing • Extra km: ₹${extraKmRate}/km • Extra hr: ₹${extraHrRate}/hr`,
      `• Free cancellation up to 6 hours before pickup`
    ].filter(Boolean).join('\n');

    const deepLinkUrl = `https://kalidasstravels.in/services/local-hourly-cabs/?vehicle=${encodeURIComponent(vehicle.name)}&pkg=${pkg.configKey}`;

    return {
      service: 'local',
      vehicle,
      tripDetails: {
        origin: 'Chennai City',
        destination: pkg.label,
        tripType: `Local Rental (${pkg.hours} Hrs / ${pkg.km} Km)`,
        days: 1,
        hours: pkg.hours,
        packageLabel: pkg.label
      },
      billedKm: pkg.km,
      kmCost: baseFare,
      driverBata: 0,
      isInterstate: false,
      stateCode: 'TN',
      statePermit: 0,
      extraKmRate,
      extraHrRate,
      baseSubtotal: baseFare,
      taxableAmount,
      gstAmount,
      totalFare,
      advance,
      netBalance,
      lineItems,
      paymentRules,
      restaurantBill,
      deepLinkUrl,
      bookingWhatsAppUrl: buildWhatsAppUrl(`Hi Kalidass Travels, I want to book a Local Hourly Cab in Chennai (${vehicle.fullName}, ${pkg.label}). Please confirm availability.`)
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. AIRPORT TRANSFERS
  // ═════════════════════════════════════════════════════════════════════════
  if (service === 'airport' || service === 'chennai-airport-taxi') {
    const rawDest = (req.dest || req.destination || req.airportAddress || 'Central Chennai').toLowerCase();
    const matchedOutstation = Object.keys(KNOWN_DESTINATIONS).find(k => rawDest.includes(k));

    if (matchedOutstation) {
      const dest = KNOWN_DESTINATIONS[matchedOutstation];
      const minDropKm = vConfig.min_drop_km || (vehicle.category === 'tempo' || vehicle.category === 'coach' ? 250 : 130);
      const billedKm = Math.max(dest.oneWayKm, minDropKm);
      const ratePerKm = vConfig.one_way_rate || (vConfig.round_trip_rate ? vConfig.round_trip_rate + 2 : 16);
      const kmCost = billedKm * ratePerKm;
      const driverBata = vConfig.driver_bata || 500;
      const stateCode = dest.stateCode;
      const isInterstate = Boolean(stateCode && stateCode !== 'TN');
      const statePermit = isInterstate ? ((tariffConfig as any).state_permits?.[stateCode]?.rates?.[vehicle.category] || 0) : 0;
      const baseSubtotal = kmCost + driverBata + statePermit;
      const taxableAmount = kmCost + driverBata;
      const gstAmount = needGst ? Math.round(taxableAmount * 0.05) : 0;
      const totalFare = baseSubtotal + gstAmount;
      const netBalance = totalFare - advance;

      const lineItems: LineItem[] = [
        { label: `${vehicle.fullName} (${billedKm} km @ ₹${ratePerKm}/km)`, amount: `₹${kmCost.toLocaleString('en-IN')}` },
        { label: 'Driver Bata', amount: `₹${driverBata.toLocaleString('en-IN')}` }
      ];
      if (statePermit > 0) {
        lineItems.push({ label: `State Entry Tax (${stateCode})`, amount: `₹${statePermit.toLocaleString('en-IN')}` });
      }
      lineItems.push({ label: 'Toll Gate Fees (FASTag)', amount: 'Extra as per slip' });
      lineItems.push({ label: 'Airport Parking Charges', amount: 'Extra as per slip' });

      const restaurantBill = [
        `Chennai Airport ➔ ${dest.name}`,
        `Outstation Airport Drop • ~${billedKm} km`,
        `------------------------------------------------------------`,
        `${vehicle.fullName} (${billedKm} km @ ₹${ratePerKm}/km):`.padEnd(52) + `₹${kmCost.toLocaleString('en-IN')}`,
        `Driver Bata:`.padEnd(52) + `₹${driverBata.toLocaleString('en-IN')}`,
        statePermit > 0 ? `State Entry Tax (${stateCode}):`.padEnd(52) + `₹${statePermit.toLocaleString('en-IN')}` : null,
        `Toll Gate Fees (FASTag):`.padEnd(52) + `Extra as per slip`,
        `Airport Parking:`.padEnd(52) + `Extra as per slip`,
        `------------------------------------------------------------`,
        `Estimated Total Fare:`.padEnd(52) + `₹${totalFare.toLocaleString('en-IN')}`,
        `Advance to Reserve:`.padEnd(52) + `₹${advance.toLocaleString('en-IN')}`,
        `Net Balance to Chauffeur:`.padEnd(52) + `₹${netBalance.toLocaleString('en-IN')}`
      ].filter(Boolean).join('\n');

      const deepLinkUrl = `https://kalidasstravels.in/services/chennai-airport-taxi/?dest=${encodeURIComponent(dest.name)}&vehicle=${encodeURIComponent(vehicle.name)}`;

      return {
        service: 'airport',
        vehicle,
        tripDetails: {
          origin: 'Chennai Airport (MAA)',
          destination: dest.name,
          tripType: 'Outstation Airport Drop',
          days: 1
        },
        billedKm,
        ratePerKm,
        kmCost,
        driverBata,
        isInterstate,
        stateCode,
        statePermit,
        baseSubtotal,
        taxableAmount,
        gstAmount,
        totalFare,
        advance,
        netBalance,
        lineItems,
        paymentRules: [
          `₹${advance.toLocaleString('en-IN')} advance to reserve cab (deducted in final invoice)`,
          'Pay balance to chauffeur at trip end (UPI / Cash)',
          'Free flight tracking & flight delay buffer included'
        ],
        restaurantBill,
        deepLinkUrl,
        bookingWhatsAppUrl: buildWhatsAppUrl(`Hi Kalidass Travels, I want to book an Airport Outstation Taxi from Chennai Airport to ${dest.name} (${vehicle.fullName}). Please confirm.`)
      };
    }

    // Chennai City Zone Flat Fare
    let matchedZone = AIRPORT_ZONES[0];
    if (rawDest.includes('central') || rawDest.includes('t nagar') || rawDest.includes('anna nagar') || rawDest.includes('egmore') || rawDest.includes('adyar')) {
      matchedZone = AIRPORT_ZONES[1];
    } else if (rawDest.includes('ambattur') || rawDest.includes('avadi') || rawDest.includes('madhavaram')) {
      matchedZone = AIRPORT_ZONES[2];
    } else if (rawDest.includes('omr') || rawDest.includes('perungudi') || rawDest.includes('thoraipakkam') || rawDest.includes('siruseri')) {
      matchedZone = AIRPORT_ZONES[3];
    } else if (rawDest.includes('ecr') || rawDest.includes('injambakkam') || rawDest.includes('mahabalipuram')) {
      matchedZone = AIRPORT_ZONES[4];
    }

    let fare = Math.round(matchedZone.sedan * vehicle.airportMultiplier);
    if (vehicle.airportMinFare && fare < vehicle.airportMinFare) {
      fare = vehicle.airportMinFare;
    }
    const gstAmount = needGst ? Math.round(fare * 0.05) : 0;
    const totalFare = fare + gstAmount;
    const netBalance = totalFare - advance;

    const lineItems: LineItem[] = [
      { label: `Flat Zone Transfer (${matchedZone.label.split('(')[0].trim()})`, amount: `₹${fare.toLocaleString('en-IN')}` }
    ];
    if (needGst) lineItems.push({ label: 'GST (5% ITC Invoice)', amount: `₹${gstAmount.toLocaleString('en-IN')}` });
    lineItems.push({ label: 'Airport Parking / Toll Plaza', amount: 'Extra as per slip' });

    const restaurantBill = [
      `Chennai Airport Transfer (${matchedZone.label.split('(')[0].trim()})`,
      `${vehicle.fullName}`,
      `------------------------------------------------------------`,
      `Zone Transfer Fare:`.padEnd(52) + `₹${fare.toLocaleString('en-IN')}`,
      needGst ? `GST (5%):`.padEnd(52) + `₹${gstAmount.toLocaleString('en-IN')}` : null,
      `Airport Parking Fees:`.padEnd(52) + `Extra as per slip`,
      `------------------------------------------------------------`,
      `Estimated Total Fare:`.padEnd(52) + `₹${totalFare.toLocaleString('en-IN')}`,
      `Advance to Reserve:`.padEnd(52) + `₹${advance.toLocaleString('en-IN')}`,
      `Net Balance to Chauffeur:`.padEnd(52) + `₹${netBalance.toLocaleString('en-IN')}`
    ].filter(Boolean).join('\n');

    const deepLinkUrl = `https://kalidasstravels.in/services/chennai-airport-taxi/?zone=${matchedZone.key}&vehicle=${encodeURIComponent(vehicle.name)}`;

    return {
      service: 'airport',
      vehicle,
      tripDetails: {
        origin: 'Chennai Airport (MAA)',
        destination: matchedZone.label,
        tripType: 'City Airport Transfer',
        days: 1
      },
      billedKm: matchedZone.km,
      kmCost: fare,
      driverBata: 0,
      isInterstate: false,
      stateCode: 'TN',
      statePermit: 0,
      baseSubtotal: fare,
      taxableAmount: fare,
      gstAmount,
      totalFare,
      advance,
      netBalance,
      lineItems,
      paymentRules: [
        `₹${advance.toLocaleString('en-IN')} advance to reserve cab (deducted in final invoice)`,
        'Pay balance to chauffeur at trip end (UPI / Cash)',
        'Free 45-minute flight delay buffer included'
      ],
      restaurantBill,
      deepLinkUrl,
      bookingWhatsAppUrl: buildWhatsAppUrl(`Hi Kalidass Travels, I want to book an Airport Taxi in Chennai (${matchedZone.label}, ${vehicle.fullName}). Please confirm.`)
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. ACTING DRIVERS
  // ═════════════════════════════════════════════════════════════════════════
  if (service === 'acting-drivers' || service === 'acting_drivers') {
    const rawDest = (req.dest || req.destination || '').toLowerCase();
    const days = Math.max(1, parseInt(String(req.days || 1), 10) || 1);

    // City Short Duty vs Full Day vs Outstation
    if (rawDest.includes('4hr') || req.driverType === 'city_4hr') {
      const fare = 750;
      const deepLinkUrl = `https://kalidasstravels.in/services/acting-drivers/#tariff`;
      return {
        service: 'acting-drivers',
        vehicle: { key: 'acting-driver', name: 'Chauffeur', fullName: 'Professional Personal Car Acting Driver (MT/AT/EV)', category: 'driver', seats: 'N/A', isLarge: false },
        tripDetails: { origin: 'Chennai City', destination: 'City Short Duty (4 Hours)', tripType: 'Hourly Acting Driver', days: 1, hours: 4 },
        billedKm: 0,
        kmCost: fare,
        driverBata: 0,
        isInterstate: false,
        statePermit: 0,
        extraHrRate: 120,
        baseSubtotal: fare,
        taxableAmount: fare,
        gstAmount: 0,
        totalFare: fare,
        advance: 500,
        netBalance: fare - 500,
        lineItems: [
          { label: 'City Short Duty (4 Hours Continuous)', amount: '₹750' },
          { label: 'Extra Duty Hours', amount: '₹120 / extra hour' }
        ],
        paymentRules: ['₹500 advance to confirm driver', 'Pay balance ₹250 to driver at end of duty', 'Fuel, FASTag tolls & parking paid by owner'],
        restaurantBill: `Acting Driver Duty: City Short Duty (4 Hours)\nRate: ₹750 (Extra: ₹120/hr)\nAdvance: ₹500 • Balance: ₹250`,
        deepLinkUrl,
        bookingWhatsAppUrl: buildWhatsAppUrl(`Hi Kalidass Travels, I want to book a 4-Hour City Acting Driver (₹750) in Chennai.`)
      };
    }

    if (rawDest.includes('8hr') || req.driverType === 'city_8hr') {
      const fare = 1200;
      const deepLinkUrl = `https://kalidasstravels.in/services/acting-drivers/#tariff`;
      return {
        service: 'acting-drivers',
        vehicle: { key: 'acting-driver', name: 'Chauffeur', fullName: 'Professional Personal Car Acting Driver (MT/AT/EV)', category: 'driver', seats: 'N/A', isLarge: false },
        tripDetails: { origin: 'Chennai City', destination: 'City Full Day Duty (8 Hours)', tripType: 'Full Day Acting Driver', days: 1, hours: 8 },
        billedKm: 0,
        kmCost: fare,
        driverBata: 0,
        isInterstate: false,
        statePermit: 0,
        extraHrRate: 120,
        baseSubtotal: fare,
        taxableAmount: fare,
        gstAmount: 0,
        totalFare: fare,
        advance: 500,
        netBalance: fare - 500,
        lineItems: [
          { label: 'City Full Day Duty (8 Hours Continuous)', amount: '₹1,200' },
          { label: 'Extra Duty Hours', amount: '₹120 / extra hour' }
        ],
        paymentRules: ['₹500 advance to confirm driver', 'Pay balance ₹700 to driver at end of duty', 'Fuel, FASTag tolls & parking paid by owner'],
        restaurantBill: `Acting Driver Duty: City Full Day Duty (8 Hours)\nRate: ₹1,200 (Extra: ₹120/hr)\nAdvance: ₹500 • Balance: ₹700`,
        deepLinkUrl,
        bookingWhatsAppUrl: buildWhatsAppUrl(`Hi Kalidass Travels, I want to book an 8-Hour Full Day City Acting Driver (₹1,200) in Chennai.`)
      };
    }

    // Outstation Acting Driver (Default ₹1,700/day for sedan with driver food included)
    const dailyRate = 1700;
    const totalFare = dailyRate * days;
    const deepLinkUrl = `https://kalidasstravels.in/services/acting-drivers/#tariff`;
    return {
      service: 'acting-drivers',
      vehicle: { key: 'acting-driver', name: 'Chauffeur', fullName: 'Outstation Personal Car Acting Driver (Food Included)', category: 'driver', seats: 'N/A', isLarge: false },
      tripDetails: { origin: 'Chennai', destination: rawDest || 'Outstation Tamil Nadu', tripType: `Outstation Duty (${days} Day${days > 1 ? 's' : ''})`, days },
      billedKm: 0,
      kmCost: totalFare,
      driverBata: totalFare,
      isInterstate: false,
      statePermit: 0,
      baseSubtotal: totalFare,
      taxableAmount: totalFare,
      gstAmount: 0,
      totalFare,
      advance: 500,
      netBalance: totalFare - 500,
      lineItems: [
        { label: `Outstation Acting Driver (${days} Day${days > 1 ? 's' : ''} @ ₹1,700/day)`, amount: `₹${totalFare.toLocaleString('en-IN')}` },
        { label: 'Driver Food Allowance', amount: 'Included (Driver manages own food)' },
        { label: 'Night Stay Lodging', amount: 'Free Hotel Dorm (or ₹300/night if Airbnb)' }
      ],
      paymentRules: [
        '₹500 advance to confirm driver assignment',
        `Pay balance ₹${(totalFare - 500).toLocaleString('en-IN')} to driver at end of duty`,
        'Driver never asks customer for food money (food allowance included)'
      ],
      restaurantBill: `Outstation Acting Driver (${days} Day${days > 1 ? 's' : ''}): ₹${totalFare.toLocaleString('en-IN')}\nIncludes driver food allowance • Advance: ₹500 • Balance: ₹${(totalFare - 500).toLocaleString('en-IN')}`,
      deepLinkUrl,
      bookingWhatsAppUrl: buildWhatsAppUrl(`Hi Kalidass Travels, I need an Outstation Acting Driver for ${days} Days (₹${totalFare.toLocaleString('en-IN')}). Please confirm.`)
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. CORPORATE MONTHLY RETAINERS
  // ═════════════════════════════════════════════════════════════════════════
  if (service === 'corporate' || service === 'corporate-mobility') {
    const rawPkg = (req.corporatePkg || req.pkg || 'pkg-1500').toLowerCase();
    let monthlyRate = 42000;
    let slabLabel = '1,500 Km / 260 Hrs (26 Days)';
    if (rawPkg.includes('1000')) {
      monthlyRate = vehicle.name === 'Crysta' ? 55000 : vehicle.name === 'Ertiga' ? 44000 : 36000;
      slabLabel = '1,000 Km / 200 Hrs (25 Days)';
    } else if (rawPkg.includes('1200')) {
      monthlyRate = vehicle.name === 'Crysta' ? 58000 : vehicle.name === 'Ertiga' ? 46500 : 38000;
      slabLabel = '1,200 Km / 208 Hrs (26 Days)';
    } else if (rawPkg.includes('2000')) {
      monthlyRate = vehicle.name === 'Crysta' ? 72000 : vehicle.name === 'Ertiga' ? 57000 : 46000;
      slabLabel = '2,000 Km / 260 Hrs (26 Days)';
    } else {
      monthlyRate = vehicle.name === 'Crysta' ? 65000 : vehicle.name === 'Ertiga' ? 52000 : 42000;
      slabLabel = '1,500 Km / 260 Hrs (26 Days)';
    }

    const gstAmount = Math.round(monthlyRate * 0.05);
    const totalFare = monthlyRate + gstAmount;

    return {
      service: 'corporate',
      vehicle,
      tripDetails: { origin: 'Chennai Corporate Office', destination: slabLabel, tripType: 'Monthly Dedicated Retainer', days: 26 },
      billedKm: parseInt(slabLabel.replace(',', ''), 10) || 1500,
      kmCost: monthlyRate,
      driverBata: 0,
      isInterstate: false,
      statePermit: 0,
      baseSubtotal: monthlyRate,
      taxableAmount: monthlyRate,
      gstAmount,
      totalFare,
      advance: 0,
      netBalance: totalFare,
      lineItems: [
        { label: `Monthly Retainer (${slabLabel} • ${vehicle.fullName})`, amount: `₹${monthlyRate.toLocaleString('en-IN')}` },
        { label: 'GST (5% ITC Compliant Invoice)', amount: `₹${gstAmount.toLocaleString('en-IN')}` }
      ],
      paymentRules: [
        'Dedicated liveried chauffeur with police clearance',
        '30-day post-paid corporate billing credit upon MSME onboarding',
        '100% GST ITC compliant tax invoice provided monthly'
      ],
      restaurantBill: `Corporate Retainer: ${slabLabel} • ${vehicle.fullName}\nBase Monthly Fee: ₹${monthlyRate.toLocaleString('en-IN')}\nGST (5% ITC): ₹${gstAmount.toLocaleString('en-IN')}\nTotal: ₹${totalFare.toLocaleString('en-IN')}/month`,
      deepLinkUrl: `https://kalidasstravels.in/services/corporate/#gem-standards`,
      bookingWhatsAppUrl: buildWhatsAppUrl(`Hi Kalidass Travels, We want to hire a monthly corporate car retainer (${slabLabel}, ${vehicle.fullName}). Please share commercial proposal.`)
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. OUTSTATION HIGHWAY TRIPS (Round-Trip or One-Way Drop)
  // ═════════════════════════════════════════════════════════════════════════
  const destInput = (req.dest || req.destination || 'pondicherry').toLowerCase().trim();
  let dest = KNOWN_DESTINATIONS[destInput];
  if (!dest) {
    const matchedKey = Object.keys(KNOWN_DESTINATIONS).find(k => destInput.includes(k) || k.includes(destInput));
    dest = matchedKey ? KNOWN_DESTINATIONS[matchedKey] : KNOWN_DESTINATIONS['pondicherry'];
  }

  const rawDays = req.days;
  const parsedDays = typeof rawDays === 'number' ? rawDays : parseInt(String(rawDays || '1'), 10);
  const days = Math.max(1, isNaN(parsedDays) ? (dest.defaultDays || 1) : parsedDays);
  const tripType = (req.type || req.tripType || 'round').toLowerCase();
  const isRound = tripType === 'round';

  const minDailyKm = vConfig.min_km_per_day || (vehicle.category === 'tempo' || vehicle.category === 'coach' ? 300 : 250);
  const ratePerKm = isRound ? (vConfig.round_trip_rate || 14) : (vConfig.one_way_rate || (vConfig.round_trip_rate ? vConfig.round_trip_rate + 2 : 16));
  const bataPerDay = vConfig.driver_bata || 500;

  let billedKm = 0;
  let kmCost = 0;
  let totalBata = 0;

  if (isRound) {
    const totalMinKm = days * minDailyKm;
    billedKm = Math.max(dest.roundTripKm, totalMinKm);
    kmCost = billedKm * ratePerKm;
    totalBata = days * bataPerDay;
  } else {
    const minDropKm = vConfig.min_drop_km || (vehicle.category === 'tempo' || vehicle.category === 'coach' ? 250 : 130);
    billedKm = Math.max(dest.oneWayKm, minDropKm);
    kmCost = billedKm * ratePerKm;
    totalBata = bataPerDay;
  }

  const stateCode = dest.stateCode;
  const isInterstate = Boolean(stateCode && stateCode !== 'TN');
  const statePermit = isInterstate ? ((tariffConfig as any).state_permits?.[stateCode]?.rates?.[vehicle.category] || 0) : 0;

  const baseSubtotal = kmCost + totalBata + statePermit;
  const taxableAmount = kmCost + totalBata;
  const gstAmount = needGst ? Math.round(taxableAmount * 0.05) : 0;
  const totalFare = baseSubtotal + gstAmount;
  const netBalance = totalFare - advance;

  const lineItems: LineItem[] = [
    { label: `${vehicle.fullName} (${Math.round(billedKm)} km @ ₹${ratePerKm}/km)`, amount: `₹${kmCost.toLocaleString('en-IN')}` }
  ];
  if (totalBata > 0) {
    lineItems.push({ label: `Driver Bata (${days} Day${days > 1 ? 's' : ''})`, amount: `₹${totalBata.toLocaleString('en-IN')}` });
  }
  if (statePermit > 0) {
    lineItems.push({ label: `State Entry Tax (${stateCode})`, amount: `₹${statePermit.toLocaleString('en-IN')}` });
  }
  lineItems.push({ label: 'Toll Gate Fees (FASTag)', amount: 'Extra as per slip' });
  lineItems.push({ label: 'Parking Charges', amount: 'Extra as per slip' });
  if (needGst) {
    lineItems.push({ label: 'GST Tax (5% ITC Invoice)', amount: `₹${gstAmount.toLocaleString('en-IN')}` });
  }

  const paymentRules = [
    `₹${advance.toLocaleString('en-IN')} advance to reserve cab (deducted in final invoice)`,
    'Pay balance to chauffeur at trip end (UPI / Cash)',
    `Doorstep odometer reading • Extra km: ₹${ratePerKm}/km`,
    'Free cancellation up to 6 hours before pickup'
  ];

  const tripSummaryTitle = isRound ? `Chennai ⇄ ${dest.name}` : `Chennai ➔ ${dest.name}`;
  const tripTypeSubtitle = isRound ? `Round Trip (${days} Day${days > 1 ? 's' : ''}) • ~${billedKm} km` : `One-Way Drop • ~${billedKm} km`;

  const restaurantBill = [
    `${tripSummaryTitle}`,
    `${tripTypeSubtitle}`,
    `------------------------------------------------------------`,
    `${vehicle.fullName} (${billedKm} km @ ₹${ratePerKm}/km):`.padEnd(52) + `₹${kmCost.toLocaleString('en-IN')}`,
    `Driver Bata (${days} Day${days > 1 ? 's' : ''}):`.padEnd(52) + `₹${totalBata.toLocaleString('en-IN')}`,
    statePermit > 0 ? `State Entry Tax (${stateCode}):`.padEnd(52) + `₹${statePermit.toLocaleString('en-IN')}` : null,
    `Toll Gate Fees (FASTag):`.padEnd(52) + `Extra as per slip`,
    `Parking Charges:`.padEnd(52) + `Extra as per slip`,
    needGst ? `GST Tax (5% ITC Invoice):`.padEnd(52) + `₹${gstAmount.toLocaleString('en-IN')}` : null,
    `------------------------------------------------------------`,
    `Estimated Total Fare (${billedKm} km):`.padEnd(52) + `₹${totalFare.toLocaleString('en-IN')}`,
    `Advance to Reserve Cab (deducted in final invoice):`.padEnd(52) + `₹${advance.toLocaleString('en-IN')}`,
    `Net Balance Payable to Chauffeur at Trip End:`.padEnd(52) + `₹${netBalance.toLocaleString('en-IN')}`,
    `------------------------------------------------------------`,
    `PAYMENT & BILLING RULES:`,
    `• ₹${advance.toLocaleString('en-IN')} advance to reserve cab (deducted in final invoice)`,
    `• Pay balance to chauffeur at trip end (UPI / Cash)`,
    `• Doorstep odometer reading • Extra km: ₹${ratePerKm}/km`,
    `• Free cancellation up to 6 hours before pickup`
  ].filter(Boolean).join('\n');

  // Deep Link URL for direct one-tap booking
  const deepLinkUrl = `https://kalidasstravels.in/?tab=outstation&dest=${encodeURIComponent(destInput)}&vehicle=${encodeURIComponent(vehicle.name)}&days=${days}&type=${tripType}`;

  return {
    service: 'outstation',
    vehicle,
    tripDetails: {
      origin: 'Chennai',
      destination: dest.name,
      tripType: isRound ? `Round Trip (${days} Day${days > 1 ? 's' : ''})` : 'One-Way Drop',
      days
    },
    billedKm,
    ratePerKm,
    kmCost,
    driverBata: totalBata,
    isInterstate,
    stateCode,
    statePermit,
    baseSubtotal,
    taxableAmount,
    gstAmount,
    totalFare,
    advance,
    netBalance,
    lineItems,
    paymentRules,
    restaurantBill,
    deepLinkUrl,
    bookingWhatsAppUrl: buildWhatsAppUrl(`Hi Kalidass Travels, I need a quotation for Chennai to ${dest.name} (${vehicle.fullName}, ${days} Days, ${isRound ? 'Round Trip' : 'One-Way'}). Please confirm booking.`)
  };
}

