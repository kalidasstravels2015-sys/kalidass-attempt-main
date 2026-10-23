import React, { useState, useMemo, useRef, useEffect } from 'react';
import { buildMapsBlock } from '../../../utils/whatsapp';
import { validateCustomerContact, extractValidMobile, isPlaceholderCustomerName, isActionableLead, deduplicateCalculatorQuotes } from '../../../utils/bookingContactValidator';
import { getNextEnquiryId, getOrderedEnquiryId, getNextBookingId, isSequentialId } from '../../../utils/sequenceGenerator';
import { formatCleanDateTime, formatFriendlyTravelDateTime, cleanLocationName } from '../../../utils/dateFormatter';
import { buildGoogleCalendarUrl, parseTravelDateToDate } from '../../../utils/googleCalendarHelper';
import { loadGoogleMaps } from '../../../lib/googleMapsLoader';

// Popular Chennai Pickup Hubs (1-tap chips for fast dispatch entry)
const POPULAR_PICKUP_HUBS = [
  { label: 'Medavakkam (Office)', val: 'Medavakkam, Chennai' },
  { label: '✈️ Airport (MAA)', val: 'Chennai International Airport (MAA)' },
  { label: '🚉 Central (MAS)', val: 'Chennai Central Railway Station (MAS)' },
  { label: '🚉 Egmore', val: 'Chennai Egmore Railway Station' },
  { label: 'Tambaram', val: 'Tambaram, Chennai' },
  { label: 'SIT College / Chromepet', val: 'SIT College, Chromepet, Chennai' },
  { label: 'OMR / Sholinganallur', val: 'Sholinganallur, OMR, Chennai' },
  { label: 'Koyambedu CMBT', val: 'Koyambedu CMBT, Chennai' }
];

// Popular Intercity & Pilgrimage Destinations (1-tap chips with benchmark tariffs)
const POPULAR_DROP_HUBS = [
  { label: '🛕 Tirupati', val: 'Tirupati', defaultType: 'Tirupati Balaji Darshan (1 Day)', fareSedan: 5800, fareSuv: 7200, fareCrysta: 8800 },
  { label: '🌊 Pondicherry', val: 'Pondicherry', defaultType: 'Round Trip (Same Day Return)', fareSedan: 4800, fareSuv: 6200, fareCrysta: 7800 },
  { label: '🕉️ Tiruvannamalai', val: 'Tiruvannamalai', defaultType: 'Thiruvannamalai Girivalam (1 Day)', fareSedan: 5800, fareSuv: 7200, fareCrysta: 8800 },
  { label: '📍 Trichy', val: 'Tiruchirappalli (Trichy)', defaultType: 'One Way Drop (Highway Drop)', fareSedan: 6200, fareSuv: 7500, fareCrysta: 9200 },
  { label: '🏛️ Kanchipuram', val: 'Kanchipuram', defaultType: 'Kanchipuram Silk & Temples (1 Day)', fareSedan: 3500, fareSuv: 4500, fareCrysta: 5500 },
  { label: '✨ Vellore', val: 'Vellore', defaultType: 'One Way Drop (Highway Drop)', fareSedan: 3200, fareSuv: 4000, fareCrysta: 5200 },
  { label: '🪐 Kumbakonam', val: 'Kumbakonam', defaultType: 'Kumbakonam Navagraha (2 Days)', fareSedan: 11000, fareSuv: 13500, fareCrysta: 16500 },
  { label: '🏢 Bangalore', val: 'Bangalore', defaultType: 'One Way Drop (Highway Drop)', fareSedan: 6500, fareSuv: 8200, fareCrysta: 10500 },
  { label: '🏖️ Rameswaram', val: 'Rameswaram', defaultType: 'Rameswaram Dham Pilgrimage (3 Days)', fareSedan: 17500, fareSuv: 21500, fareCrysta: 26500 },
  { label: '🛕 Madurai', val: 'Madurai', defaultType: 'One Way Drop (Highway Drop)', fareSedan: 8500, fareSuv: 10500, fareCrysta: 13500 }
];

// All trip types aligned with all website engines & TN intercity cab standards
const TRIP_TYPE_CATEGORIES = [
  {
    group: '🚕 Outstation Highway Trips (Most Common)',
    options: [
      { value: 'Round Trip (Same Day Return)', label: 'Round Trip (1 Day - Same Day Return)' },
      { value: 'Round Trip (2 Days / 1 Night)', label: 'Round Trip (2 Days - Weekend / 1 Night)' },
      { value: 'One Way Drop (Highway Drop)', label: 'One Way Drop (Highway Drop)' },
      { value: 'Round Trip (3 Days / 2 Nights)', label: 'Round Trip (3 Days / 2 Nights)' },
      { value: 'Round Trip (4+ Days Tour)', label: 'Round Trip (4+ Days Tour)' }
    ]
  },
  {
    group: '🛕 Dedicated Pilgrimage & Tour Packages (From Website Engines)',
    options: [
      { value: 'Tirupati Balaji Darshan (1 Day)', label: 'Tirupati Balaji Darshan (1 Day)' },
      { value: 'Tirupati + Kalahasti (2 Days)', label: 'Tirupati + Kalahasti (2 Days)' },
      { value: 'Pondicherry & Auroville (1 Day)', label: 'Pondicherry & Auroville (1 Day)' },
      { value: 'Pondicherry Weekend (2 Days)', label: 'Pondicherry Weekend (2 Days)' },
      { value: 'Thiruvannamalai Girivalam (1 Day)', label: 'Thiruvannamalai Girivalam (1 Day)' },
      { value: 'Kumbakonam Navagraha (2 Days)', label: 'Kumbakonam Navagraha (2 Days)' },
      { value: 'Kumbakonam Navagraha (3 Days)', label: 'Kumbakonam Navagraha (3 Days)' },
      { value: 'Kanchipuram Silk & Temples (1 Day)', label: 'Kanchipuram Silk & Temples (1 Day)' },
      { value: 'Vellore Golden Temple & CMC (1 Day)', label: 'Vellore Golden Temple & CMC (1 Day)' },
      { value: 'Chidambaram Natarajar (1 Day / 2 Days)', label: 'Chidambaram Natarajar (1 Day / 2 Days)' },
      { value: 'Rameswaram Dham Pilgrimage (3 Days)', label: 'Rameswaram Dham Pilgrimage (3 Days)' },
      { value: 'Sabarimala Mandalam Tour (3+ Days)', label: 'Sabarimala Mandalam Tour (3+ Days)' }
    ]
  },
  {
    group: '🏙️ Local Chennai City Rental & Airport Transfers',
    options: [
      { value: 'Local 4 Hours / 40 Kms', label: 'Local 4 Hours / 40 Kms' },
      { value: 'Local 8 Hours / 80 Kms (Full Day)', label: 'Local 8 Hours / 80 Kms (Full Day)' },
      { value: 'Local 12 Hours / 120 Kms', label: 'Local 12 Hours / 120 Kms' },
      { value: 'Airport Drop (Departure)', label: 'Airport Drop (Departure)' },
      { value: 'Airport Pickup (Arrival)', label: 'Airport Pickup (Arrival)' }
    ]
  },
  {
    group: '👨‍✈️ Acting Driver Duty',
    options: [
      { value: 'Acting Driver (Local City)', label: 'Acting Driver (Local City)' },
      { value: 'Acting Driver (Outstation)', label: 'Acting Driver (Outstation)' }
    ]
  }
];

// Intercity Highway Distances from Chennai (Standard Tamil Nadu Travels Matrix)
const ROUTE_DISTANCES = {
  'tirupati': 135,
  'pondicherry': 155,
  'puducherry': 155,
  'tiruvannamalai': 195,
  'thiruvannamalai': 195,
  'trichy': 332,
  'tiruchirappalli': 332,
  'kanchipuram': 75,
  'vellore': 140,
  'kumbakonam': 295,
  'bangalore': 346,
  'bengaluru': 346,
  'rameswaram': 559,
  'madurai': 462,
  'mahabalipuram': 58,
  'kodaikanal': 528,
  'ooty': 555,
  'salem': 345,
  'coimbatore': 510
};

function getEstimatedDistance(dropText) {
  if (!dropText) return 150;
  const lower = String(dropText).toLowerCase();
  for (const [city, dist] of Object.entries(ROUTE_DISTANCES)) {
    if (lower.includes(city)) return dist;
  }
  return 150;
}

/**
 * 6-Engine Quotation Tariff Calculator
 * Directly mirrors the 6 live quotation engines on the Kalidass Travels website:
 * 1. Outstation Cabs (QuotationEngine)
 * 2. Local City Rental (LocalRentalBookingEngine)
 * 3. Airport Taxi (AirportBookingEngine)
 * 4. Pilgrimage & Tour Packages (TourBookingEngine)
 * 5. Acting Drivers (DriverFeeEstimator)
 * 6. Vehicle Relocation (VehicleRelocationCalculator)
 */
const DESK_QUOTATION_ENGINES = [
  { id: 'OUTSTATION', label: 'Outstation Cabs', sub: 'One-Way & Round Trip', icon: 'directions_car' },
  { id: 'LOCAL_RENTAL', label: 'Local City Rental', sub: '4h / 5h / 8h / 10h / 12h', icon: 'schedule' },
  { id: 'AIRPORT_TAXI', label: 'Airport Taxi', sub: 'Drop / Pickup & Zones', icon: 'flight_takeoff' },
  { id: 'PILGRIMAGE_TOUR', label: 'Tour Packages', sub: '8 Darshan Circuits', icon: 'temple_hindu' },
  { id: 'ACTING_DRIVER', label: 'Acting Drivers', sub: 'In Customer Car', icon: 'person' },
  { id: 'VEHICLE_RELOCATION', label: 'Car Relocation', sub: 'Intercity Driveaway', icon: 'local_shipping' }
];

function calculateAllVehicleFares(optsOrMode, dropText, days = null, localPkg = '', tourPkg = '') {
  let opts = {};
  if (typeof optsOrMode === 'object' && optsOrMode !== null) {
    opts = optsOrMode;
  } else {
    opts = {
      mode: optsOrMode,
      dropText,
      days,
      localPkg,
      tourPkg
    };
  }

  const {
    mode,
    outstationSubtype = 'ROUND',
    dropText: destDrop = '',
    days: durationDays = null,
    localPkg: lPkg = '',
    tourPkg: tPkg = '',
    airportZone = '',
    airportTransferType = 'DROP',
    driverDutyType = 'CITY_HOURLY',
    driverCarType = 'Manual Sedan / Hatch',
    driverHours = 8,
    driverDays = 1,
    driverNightDuty = false,
    driverOneWayDest = 'Pondicherry',
    relocationDest = '',
    relocationCarType = 'Hatchback / Sedan'
  } = opts;

  if (!mode) {
    return {
      type: 'cab',
      sedan: null,
      suv: null,
      crysta: null,
      tempo: null,
      note: 'Select one of the 6 quotation engines above to calculate live tariffs'
    };
  }

  // 1. OUTSTATION CABS (One-Way Drop & Round Trip)
  if (mode === 'OUTSTATION' || mode === 'OUTSTATION_ROUND' || mode === 'OUTSTATION_ONEWAY') {
    const isOneWay = mode === 'OUTSTATION_ONEWAY' || outstationSubtype === 'ONEWAY';
    const targetDrop = destDrop || dropText || '';

    if (isOneWay) {
      if (!targetDrop) {
        return {
          type: 'cab',
          sedan: null,
          suv: null,
          crysta: null,
          tempo: null,
          note: 'Enter Destination city above to calculate one-way drop fare'
        };
      }
      const oneWayDist = getEstimatedDistance(targetDrop);
      const billKm = Math.max(130, oneWayDist);
      const sedan = Math.round((billKm * 16) + 400 + Math.min(600, billKm * 1.2));
      const suv = Math.round((billKm * 19) + 500 + Math.min(700, billKm * 1.3));
      const crysta = Math.round((billKm * 25) + 700 + Math.min(800, billKm * 1.4));
      const tempo = Math.round((Math.max(250, billKm) * 29) + 800 + Math.min(1000, billKm * 1.6));

      return {
        type: 'cab',
        sedan: Math.ceil(sedan / 50) * 50,
        suv: Math.ceil(suv / 50) * 50,
        crysta: Math.ceil(crysta / 50) * 50,
        tempo: Math.ceil(tempo / 50) * 50,
        note: `Point-to-point drop (~${oneWayDist} km). All-inclusive of fuel, driver bata & return toll.`
      };
    }

    // Round Trip
    if (!targetDrop) {
      return {
        type: 'cab',
        sedan: null,
        suv: null,
        crysta: null,
        tempo: null,
        note: 'Enter Destination city above to calculate round-trip fare'
      };
    }
    const oneWayDist = getEstimatedDistance(targetDrop);
    const totalKm = oneWayDist * 2;
    const d = Math.max(1, Number(durationDays ?? days) || 1);
    const minKm = 250 * d;
    const billKm = Math.max(minKm, totalKm);
    const tollEst = Math.min(1200, Math.round(billKm * 1.1));

    const sedan = Math.round((billKm * 14) + (400 * d) + tollEst);
    const suv = Math.round((billKm * 17) + (500 * d) + (tollEst * 1.1));
    const crysta = Math.round((billKm * 22) + (700 * d) + (tollEst * 1.2));
    const tempoBillKm = Math.max(300 * d, totalKm);
    const tempo = Math.round((tempoBillKm * 26) + (800 * d) + (tollEst * 1.3));

    return {
      type: 'cab',
      sedan: Math.ceil(sedan / 50) * 50,
      suv: Math.ceil(suv / 50) * 50,
      crysta: Math.ceil(crysta / 50) * 50,
      tempo: Math.ceil(tempo / 50) * 50,
      note: `Round trip (~${totalKm} km, min ${billKm} km). All-inclusive of fuel, ${d}-day driver bata & toll.`
    };
  }

  // 2. LOCAL CITY RENTAL (4h, 5h, 8h, 10h, 12h)
  if (mode === 'LOCAL_RENTAL' || mode === 'LOCAL_HOURLY') {
    const pkg = lPkg || localPkg || '';
    if (!pkg) {
      return {
        type: 'cab',
        sedan: null,
        suv: null,
        crysta: null,
        tempo: null,
        note: 'Choose 4h, 5h, 8h, 10h, or 12h local city package'
      };
    }
    if (pkg.includes('4')) {
      return { type: 'cab', sedan: 1350, suv: 1700, crysta: 2800, tempo: 3500, note: '4 Hrs / 40 Kms City Package (Toll & Parking extra)' };
    }
    if (pkg.includes('5')) {
      return { type: 'cab', sedan: 1500, suv: 2000, crysta: 3200, tempo: 4200, note: '5 Hrs / 50 Kms City Package (Toll & Parking extra)' };
    }
    if (pkg.includes('10')) {
      return { type: 'cab', sedan: 2600, suv: 3400, crysta: 5200, tempo: 6200, note: '10 Hrs / 100 Kms Extended Package (Toll & Parking extra)' };
    }
    if (pkg.includes('12')) {
      return { type: 'cab', sedan: 3050, suv: 3900, crysta: 6000, tempo: 7000, note: '12 Hrs / 120 Kms Extended Package (Toll & Parking extra)' };
    }
    return { type: 'cab', sedan: 2200, suv: 2800, crysta: 4500, tempo: 5500, note: '8 Hrs / 80 Kms Full Day Package (Toll & Parking extra)' };
  }

  // 3. AIRPORT TAXI (Fixed Flat Zone Tariff)
  if (mode === 'AIRPORT_TAXI' || mode === 'AIRPORT_TRANSFER') {
    const z = (airportZone || '').toLowerCase();
    const dir = airportTransferType === 'PICKUP' ? 'Arrival pickup' : 'Departure drop';
    if (!airportZone) {
      return {
        type: 'cab',
        sedan: null,
        suv: null,
        crysta: null,
        tempo: null,
        note: 'Select Chennai neighborhood zone for flat airport tariff'
      };
    }
    if (z.includes('south')) {
      return { type: 'cab', sedan: 650, suv: 1150, crysta: 1500, tempo: 2400, note: `South Chennai (Guindy/Tambaram/Medavakkam) ${dir}. Zero surge, 60m free wait.` };
    }
    if (z.includes('central')) {
      return { type: 'cab', sedan: 950, suv: 1450, crysta: 1900, tempo: 2900, note: `Central Chennai (T. Nagar/Anna Nagar/Egmore) ${dir}. Zero surge, 60m free wait.` };
    }
    if (z.includes('omr')) {
      return { type: 'cab', sedan: 1250, suv: 1750, crysta: 2200, tempo: 3400, note: `OMR IT Corridor (Velachery/Sholinganallur) ${dir}. Zero surge, 60m free wait.` };
    }
    if (z.includes('ecr')) {
      return { type: 'cab', sedan: 1650, suv: 2250, crysta: 2800, tempo: 3900, note: `ECR & Mahabalipuram ${dir}. Zero surge, 60m free wait.` };
    }
    return { type: 'cab', sedan: 1400, suv: 1950, crysta: 2500, tempo: 3600, note: `North Chennai (Parrys/Ambattur/Avadi) ${dir}. Zero surge, 60m free wait.` };
  }

  // 4. PILGRIMAGE & TOUR PACKAGES
  if (mode === 'PILGRIMAGE_TOUR') {
    const pkg = tPkg || tourPkg || '';
    if (!pkg) {
      return {
        type: 'cab',
        sedan: null,
        suv: null,
        crysta: null,
        tempo: null,
        note: 'Select a Pilgrimage / Tour package from the circuits'
      };
    }
    const pkgLower = pkg.toLowerCase();
    if (pkgLower.includes('tirupati') && pkgLower.includes('2')) {
      return { type: 'cab', sedan: 7800, suv: 9800, crysta: 12500, tempo: 15500, note: '2 Days Tirupati + Kalahasti (Fuel, 2-day driver bata, hill permit & toll inc.)' };
    }
    if (pkgLower.includes('tirupati')) {
      return { type: 'cab', sedan: 5800, suv: 7200, crysta: 8800, tempo: 11500, note: '1 Day Balaji Darshan (Fuel, driver bata, hill permit & toll inc.)' };
    }
    if (pkgLower.includes('pondi') && pkgLower.includes('2')) {
      return { type: 'cab', sedan: 7500, suv: 9500, crysta: 12000, tempo: 15000, note: '2 Days Pondicherry Weekend (Fuel, 2-day driver bata, ECR toll inc.)' };
    }
    if (pkgLower.includes('pondi')) {
      return { type: 'cab', sedan: 4800, suv: 6200, crysta: 7800, tempo: 9800, note: '1 Day Pondy Day Tour (Fuel, driver bata & ECR toll inc.)' };
    }
    if (pkgLower.includes('thiruvanna') || pkgLower.includes('girivalam')) {
      return { type: 'cab', sedan: 5800, suv: 7200, crysta: 8800, tempo: 11500, note: '1 Day Girivalam Darshan (Fuel, driver bata & highway toll inc.)' };
    }
    if (pkgLower.includes('navagraha') && pkgLower.includes('3')) {
      return { type: 'cab', sedan: 14500, suv: 17500, crysta: 21500, tempo: 26500, note: '3 Days Kumbakonam 9 Temples (Fuel, 3-day driver bata & toll inc.)' };
    }
    if (pkgLower.includes('navagraha')) {
      return { type: 'cab', sedan: 11000, suv: 13500, crysta: 16500, tempo: 20500, note: '2 Days Kumbakonam Temples (Fuel, 2-day driver bata & toll inc.)' };
    }
    if (pkgLower.includes('kanchi')) {
      return { type: 'cab', sedan: 3500, suv: 4500, crysta: 5500, tempo: 7500, note: '1 Day Kanchi Silk & Temples (Fuel, driver bata & toll inc.)' };
    }
    if (pkgLower.includes('vellore')) {
      return { type: 'cab', sedan: 4500, suv: 5800, crysta: 7200, tempo: 9200, note: '1 Day Golden Temple & CMC (Fuel, driver bata & toll inc.)' };
    }
    if (pkgLower.includes('rameswaram') && pkgLower.includes('2')) {
      return { type: 'cab', sedan: 13500, suv: 16500, crysta: 21000, tempo: 26000, note: '2 Days Rameswaram Fast (Fuel, 2-day driver bata & toll inc.)' };
    }
    if (pkgLower.includes('rameswaram')) {
      return { type: 'cab', sedan: 17500, suv: 21500, crysta: 26500, tempo: 32500, note: '3 Days Rameswaram Dham (Fuel, 3-day driver bata & toll inc.)' };
    }
    if (pkgLower.includes('sabarimala')) {
      return { type: 'cab', sedan: 24000, suv: 28500, crysta: 36000, tempo: 44000, note: '3+ Days Sabarimala Tour (Fuel, interstate permit, driver bata & toll inc.)' };
    }
    return { type: 'cab', sedan: 4500, suv: 5800, crysta: 7200, tempo: 9200, note: 'Pilgrimage package all-inclusive of fuel, bata & toll.' };
  }

  // 5. ACTING DRIVERS (Personal Car Driver)
  if (mode === 'ACTING_DRIVER') {
    const isAutoOrLuxury = (driverCarType || '').includes('Automatic') || (driverCarType || '').includes('Luxury');
    let totalDutyFare = 0;
    let breakdownNote = '';

    if (driverDutyType === 'CITY_HOURLY') {
      const base = (driverHours || 8) <= 4 ? (isAutoOrLuxury ? 950 : 750) : (isAutoOrLuxury ? 1400 : 1200);
      const night = driverNightDuty ? 150 : 0;
      totalDutyFare = base + night;
      breakdownNote = `${driverHours || 8}h City Duty in customer's ${driverCarType || 'car'}. Base: ₹${base}${night ? ' + ₹150 night allowance' : ''}.`;
    } else if (driverDutyType === 'OUTSTATION_BATA') {
      const d = Math.max(1, Number(driverDays) || 1);
      const dailyRate = isAutoOrLuxury ? 1900 : 1700; // includes bata + 300 food
      totalDutyFare = dailyRate * d;
      breakdownNote = `${d}-Day Outstation in customer's ${driverCarType || 'car'}. Daily bata ₹${dailyRate - 300}/d + ₹300/d food.`;
    } else {
      // One-Way Drop in customer car
      const dest = (driverOneWayDest || destDrop || '').toLowerCase();
      let tierFare = 2050; // default Tier 1 (Pondy/Vellore)
      if (dest.includes('bangalore') || dest.includes('bengaluru') || dest.includes('madurai') || dest.includes('coimbatore')) {
        tierFare = 4050; // Tier 3
      } else if (dest.includes('trichy') || dest.includes('salem') || dest.includes('kumbakonam')) {
        tierFare = 3000; // Tier 2
      } else if (dest.includes('rameswaram') || dest.includes('kanyakumari') || dest.includes('trivandrum')) {
        tierFare = 5100; // Tier 4
      }
      if (isAutoOrLuxury) tierFare += 300;
      totalDutyFare = tierFare;
      breakdownNote = `One-way drop to ${driverOneWayDest || 'destination'} in customer car. Includes driver duty, food & return bus ticket.`;
    }

    return {
      type: 'driver',
      driverFare: totalDutyFare,
      driverDutyFare: totalDutyFare,
      dutyLabel: `${driverHours || 8}h City Duty`,
      note: breakdownNote
    };
  }

  // 6. VEHICLE RELOCATION (Intercity Driveaway)
  if (mode === 'VEHICLE_RELOCATION') {
    const dest = (relocationDest || destDrop || '').toLowerCase();
    const isSUV = (relocationCarType || '').includes('SUV');
    const isLuxury = (relocationCarType || '').includes('Luxury');

    let baseReloc = 4800; // default Bangalore
    let kmEst = 350;
    if (dest.includes('hyderabad')) {
      baseReloc = 7500; kmEst = 630;
    } else if (dest.includes('coimbatore')) {
      baseReloc = 6500; kmEst = 510;
    } else if (dest.includes('madurai')) {
      baseReloc = 5900; kmEst = 460;
    } else if (dest.includes('kochi') || dest.includes('trivandrum') || dest.includes('kerala')) {
      baseReloc = 8500; kmEst = 700;
    } else if (dest.includes('bangalore') || dest.includes('bengaluru')) {
      baseReloc = 4800; kmEst = 350;
    } else if (destDrop) {
      const dKm = getEstimatedDistance(destDrop);
      kmEst = dKm;
      baseReloc = Math.max(3500, Math.round(dKm * 14));
    }

    if (isLuxury) baseReloc = Math.round(baseReloc * 1.4);
    else if (isSUV) baseReloc = Math.round(baseReloc * 1.18);

    const roundedReloc = Math.ceil(baseReloc / 100) * 100;

    return {
      type: 'relocation',
      relocationFare: roundedReloc,
      distanceKm: kmEst,
      note: `Intercity relocation (${kmEst} km). Includes senior highway chauffeur & return transport.`
    };
  }

  return {
    type: 'cab',
    sedan: null,
    suv: null,
    crysta: null,
    tempo: null,
    note: 'Select a quotation engine above'
  };
}

/**
 * EnquiriesView - Step 1: Inbound Customer Calls & Quotes
 * Dedicated view for non-technical office staff:
 * Only manages new inquiries, sending quotes on WhatsApp, follow-ups, and collecting ₹500 advance.
 */
export default function EnquiriesView({
  leads = [],
  calculatorQuotes = [],
  onNavigateToRadar,
  onAddManualLead,
  onConvertToConfirmed,
  onDeleteLead,
  onUpdateLead,
  onOpenPhoneQuoteEngine,
  onOpenAiParser,
  showToast
}) {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [showVeteranGuide, setShowVeteranGuide] = useState(false);

  // Autocomplete DOM input refs
  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);

  // Date and Time Helper Functions
  const getTodayIso = () => new Date().toISOString().split('T')[0];
  const getTomorrowIso = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const getDayAfterIso = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  const [dateSelection, setDateSelection] = useState('');
  const [timeSelection, setTimeSelection] = useState('');
  const [showCustomDateTimeInput, setShowCustomDateTimeInput] = useState(false);

  // Modal State: Convert Enquiry to Active Trip when Name/Phone missing
  const [convertModalLead, setConvertModalLead] = useState(null);
  const [convertForm, setConvertForm] = useState({
    guestName: '',
    phone: '',
    travelDateTime: '',
    advancePaid: '500'
  });
  const [convertError, setConvertError] = useState('');

  // Modal State: Quick Edit Follow-Up / Schedule for existing enquiry
  const [editModalLead, setEditModalLead] = useState(null);
  const [editForm, setEditForm] = useState({
    followUpTime: '',
    travelDate: '',
    tripType: '',
    estimatedFare: '',
    notes: ''
  });

  const [newCall, setNewCall] = useState({
    guestName: '',
    phone: '',
    source: '',
    travelDate: '',
    tripType: '',
    pickup: '',
    drop: '',
    vehicle: '',
    fare: '',
    advance: '500',
    followUpTime: '',
    notes: '',
    _autoFare: false
  });

  // Reset form completely so no mode, vehicle, route, date, or source is preselected
  const resetCallForm = () => {
    setDateSelection('');
    setTimeSelection('');
    setCallTripMode('');
    setOutstationSubtype('ROUND');
    setRoundTripDays(null);
    setSelectedLocalPackage('');
    setSelectedTourPackage('');
    setAirportZone('');
    setAirportTransferType('');
    setAirportTerminal('');
    setFlightNumber('');
    setDriverDutyType('CITY_HOURLY');
    setDriverCarType('Manual Sedan / Hatch');
    setDriverHours(8);
    setDriverDays(1);
    setDriverNightDuty(false);
    setDriverOneWayDest('');
    setRelocationDest('');
    setRelocationCarType('Hatchback / Sedan');
    setShowCustomDateTimeInput(false);
    setNewCall({
      guestName: '',
      phone: '',
      source: '',
      travelDate: '',
      tripType: '',
      pickup: '',
      drop: '',
      vehicle: '',
      fare: '',
      advance: '500',
      followUpTime: '',
      notes: '',
      _autoFare: false
    });
  };

  // Synchronize travel date & time into friendly string
  const handleUpdateTravelDateTime = (newDate, newTime) => {
    const curDate = newDate !== undefined ? newDate : dateSelection;
    const curTime = newTime !== undefined ? newTime : timeSelection;
    if (newDate !== undefined) setDateSelection(newDate);
    if (newTime !== undefined) setTimeSelection(curTime);

    if (!curDate && !curTime) {
      setNewCall(prev => ({ ...prev, travelDate: '' }));
      return;
    }

    const today = getTodayIso();
    const tomorrow = getTomorrowIso();
    const dayAfter = getDayAfterIso();

    let prefix = '';
    if (curDate) {
      try {
        const dObj = new Date(`${curDate}T00:00:00`);
        const dayNum = dObj.getDate();
        const monthName = dObj.toLocaleString('en-US', { month: 'short' });

        if (curDate === today) prefix = `Today (${dayNum} ${monthName})`;
        else if (curDate === tomorrow) prefix = `Tomorrow (${dayNum} ${monthName})`;
        else if (curDate === dayAfter) prefix = `Day After (${dayNum} ${monthName})`;
        else prefix = `${dayNum} ${monthName} ${dObj.getFullYear()}`;
      } catch (_) {
        prefix = curDate;
      }
    }

    let formattedTime = '';
    if (curTime) {
      const [hStr, mStr] = curTime.split(':');
      let h = parseInt(hStr || '0', 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      formattedTime = `${String(h).padStart(2, '0')}:${mStr || '00'} ${ampm}`;
    }

    let combined = '';
    if (prefix && formattedTime) {
      combined = `${prefix} @ ${formattedTime}`;
    } else if (prefix) {
      combined = prefix;
    } else if (formattedTime) {
      combined = formattedTime;
    }

    setNewCall(prev => ({ ...prev, travelDate: combined }));
  };

  // Google Places Autocomplete Initialization
  useEffect(() => {
    if (!showNewCallModal) return;

    let isMounted = true;
    loadGoogleMaps()
      .then(() => {
        if (!isMounted) return;
        if (typeof window === 'undefined' || !window.google?.maps?.places) return;

        const options = {
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'name', 'geometry']
        };

        if (pickupInputRef.current && !pickupInputRef.current._hasGooglePlaces) {
          const pAuto = new window.google.maps.places.Autocomplete(pickupInputRef.current, options);
          pickupInputRef.current._hasGooglePlaces = true;
          pAuto.addListener('place_changed', () => {
            const place = pAuto.getPlace();
            const addr = cleanLocationName(place.formatted_address || place.name || '');
            if (addr) {
              setNewCall(prev => ({ ...prev, pickup: addr }));
            }
          });
        }

        if (dropInputRef.current && !dropInputRef.current._hasGooglePlaces) {
          const dAuto = new window.google.maps.places.Autocomplete(dropInputRef.current, options);
          dropInputRef.current._hasGooglePlaces = true;
          dAuto.addListener('place_changed', () => {
            const place = dAuto.getPlace();
            const addr = cleanLocationName(place.formatted_address || place.name || '');
            if (addr) {
              setNewCall(prev => ({ ...prev, drop: addr }));
            }
          });
        }
      })
      .catch((err) => {
        console.warn('Google Maps Autocomplete notice:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [showNewCallModal]);

  // Fast Track / 6 Quotation Engines Architecture
  const [callTripMode, setCallTripMode] = useState('');
  const [outstationSubtype, setOutstationSubtype] = useState('ROUND');
  const [roundTripDays, setRoundTripDays] = useState(null);
  const [selectedLocalPackage, setSelectedLocalPackage] = useState('');
  const [selectedTourPackage, setSelectedTourPackage] = useState('');
  const [airportZone, setAirportZone] = useState('');
  const [airportTransferType, setAirportTransferType] = useState('');
  const [airportTerminal, setAirportTerminal] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [driverDutyType, setDriverDutyType] = useState('CITY_HOURLY');
  const [driverCarType, setDriverCarType] = useState('Manual Sedan / Hatch');
  const [driverHours, setDriverHours] = useState(8);
  const [driverDays, setDriverDays] = useState(1);
  const [driverNightDuty, setDriverNightDuty] = useState(false);
  const [driverOneWayDest, setDriverOneWayDest] = useState('');
  const [relocationDest, setRelocationDest] = useState('');
  const [relocationCarType, setRelocationCarType] = useState('Hatchback / Sedan');

  // Compute live tariffs dynamically across all 6 engines
  const liveVehicleTariffs = useMemo(() => {
    return calculateAllVehicleFares({
      mode: callTripMode,
      outstationSubtype,
      dropText: newCall.drop,
      days: roundTripDays,
      localPkg: selectedLocalPackage,
      tourPkg: selectedTourPackage,
      airportZone,
      airportTransferType,
      driverDutyType,
      driverCarType,
      driverHours,
      driverDays,
      driverNightDuty,
      driverOneWayDest,
      relocationDest: relocationDest || newCall.drop,
      relocationCarType
    });
  }, [
    callTripMode,
    outstationSubtype,
    newCall.drop,
    roundTripDays,
    selectedLocalPackage,
    selectedTourPackage,
    airportZone,
    airportTransferType,
    driverDutyType,
    driverCarType,
    driverHours,
    driverDays,
    driverNightDuty,
    driverOneWayDest,
    relocationDest,
    relocationCarType
  ]);

  // Trip Mode Switcher (Does NOT prefill or overwrite user fields needlessly)
  const handleSelectTripMode = (mode) => {
    setCallTripMode(mode);
    if (mode === 'OUTSTATION') {
      const isOneWay = outstationSubtype === 'ONEWAY';
      const days = roundTripDays || 1;
      setNewCall(prev => ({
        ...prev,
        tripType: isOneWay ? 'Outstation One-Way Drop' : (days === 1 ? 'Round Trip (1 Day - Same Day Return)' : `Round Trip (${days} Days Package)`)
      }));
    } else if (mode === 'LOCAL_RENTAL') {
      const lp = selectedLocalPackage || '8 Hours / 80 Kms';
      setSelectedLocalPackage(lp);
      setNewCall(prev => ({
        ...prev,
        tripType: `Local Hourly Rental (${lp})`,
        drop: prev.drop || 'Chennai City Local'
      }));
    } else if (mode === 'AIRPORT_TAXI') {
      const apType = airportTransferType || 'DROP';
      setAirportTransferType(apType);
      const zoneStr = airportZone ? ` - ${airportZone} Zone` : '';
      setNewCall(prev => ({
        ...prev,
        tripType: apType === 'DROP' ? `Airport Drop (Departure)${zoneStr}` : `Airport Pickup (Arrival)${zoneStr}`,
        drop: apType === 'DROP' ? (prev.drop || 'Chennai International Airport (MAA)') : prev.drop,
        pickup: apType === 'PICKUP' ? (prev.pickup || 'Chennai International Airport (MAA)') : prev.pickup
      }));
    } else if (mode === 'PILGRIMAGE_TOUR') {
      const pkg = selectedTourPackage || 'Tirupati Balaji Darshan (1 Day)';
      setSelectedTourPackage(pkg);
      setNewCall(prev => ({
        ...prev,
        tripType: pkg,
        drop: prev.drop || 'Tirupati Balaji Darshan'
      }));
    } else if (mode === 'ACTING_DRIVER') {
      const dutyStr = driverDutyType === 'CITY_HOURLY' ? `Acting Driver (${driverHours}h City)` : (driverDutyType === 'OUTSTATION_BATA' ? `Acting Driver (${driverDays}d Outstation)` : 'Acting Driver (One-Way Drop)');
      setNewCall(prev => ({
        ...prev,
        tripType: dutyStr,
        vehicle: '',
        fare: ''
      }));
    } else if (mode === 'VEHICLE_RELOCATION') {
      const dest = relocationDest || newCall.drop || 'Bangalore';
      setRelocationDest(dest);
      setNewCall(prev => ({
        ...prev,
        tripType: `Vehicle Relocation (${relocationCarType})`,
        vehicle: '',
        fare: '',
        drop: prev.drop || dest
      }));
    }
  };

  const handleUpdateOutstationSubtype = (sub) => {
    setOutstationSubtype(sub);
    if (sub === 'ONEWAY') {
      setNewCall(prev => ({ ...prev, tripType: 'Outstation One-Way Drop' }));
    } else {
      const days = roundTripDays || 1;
      setRoundTripDays(days);
      const typeStr = days === 1 ? 'Round Trip (1 Day - Same Day Return)' : `Round Trip (${days} Days Package)`;
      setNewCall(prev => ({ ...prev, tripType: typeStr }));
    }
  };

  const handleUpdateRoundTripDays = (days) => {
    setRoundTripDays(days);
    const typeStr = days === 1 ? 'Round Trip (1 Day - Same Day Return)' : `Round Trip (${days} Days Package)`;
    setNewCall(prev => ({ ...prev, tripType: typeStr }));
  };

  const handleUpdateTourPackage = (pkg) => {
    setSelectedTourPackage(pkg);
    setNewCall(prev => ({
      ...prev,
      tripType: pkg,
      drop: pkg.split('(')[0].trim()
    }));
  };

  const handleUpdateLocalPackage = (pkg) => {
    setSelectedLocalPackage(pkg);
    setNewCall(prev => ({ ...prev, tripType: `Local Hourly Rental (${pkg})` }));
  };

  const handleUpdateAirportTransfer = (type) => {
    setAirportTransferType(type);
    const zoneStr = airportZone ? ` - ${airportZone} Zone` : '';
    setNewCall(prev => ({
      ...prev,
      tripType: type === 'DROP' ? `Airport Drop (Departure)${zoneStr}` : `Airport Pickup (Arrival)${zoneStr}`,
      drop: type === 'DROP' ? (prev.drop || 'Chennai International Airport (MAA)') : prev.drop,
      pickup: type === 'PICKUP' ? (prev.pickup || 'Chennai International Airport (MAA)') : prev.pickup
    }));
  };

  const handleUpdateAirportZone = (zone) => {
    setAirportZone(zone);
    const apType = airportTransferType || 'DROP';
    setNewCall(prev => ({
      ...prev,
      tripType: apType === 'DROP' ? `Airport Drop (${zone} Zone)` : `Airport Pickup (${zone} Zone)`
    }));
  };

  // Sync default vehicle fare ONLY when an actual vehicle is selected
  useEffect(() => {
    if (!liveVehicleTariffs || !newCall.vehicle) return;
    let autoFare = null;
    if (liveVehicleTariffs.type === 'driver') {
      autoFare = liveVehicleTariffs.driverFare;
    } else if (liveVehicleTariffs.type === 'relocation') {
      autoFare = liveVehicleTariffs.relocationFare;
    } else {
      if (newCall.vehicle.includes('Ertiga') || newCall.vehicle.includes('SUV')) {
        autoFare = liveVehicleTariffs.suv;
      } else if (newCall.vehicle.includes('Crysta')) {
        autoFare = liveVehicleTariffs.crysta;
      } else if (newCall.vehicle.includes('Tempo')) {
        autoFare = liveVehicleTariffs.tempo;
      } else if (newCall.vehicle.includes('Sedan') || newCall.vehicle.includes('Dzire')) {
        autoFare = liveVehicleTariffs.sedan;
      }
    }

    if (autoFare && (!newCall.fare || newCall._autoFare)) {
      setNewCall(prev => ({
        ...prev,
        fare: String(autoFare),
        _autoFare: true
      }));
    }
  }, [liveVehicleTariffs, newCall.vehicle]);

  const extractPhone = (item) => {
    const combined = `${item.phone || ''} ${item.sourcePage || ''} ${item.pickup || ''} ${item.guestName || ''} ${item.metadata || ''}`;
    const match = combined.match(/[6-9]\d{9}/);
    return match ? match[0] : '';
  };

  const validLeads = useMemo(
    () => leads.filter(isActionableLead),
    [leads]
  );

  const isFollowUpDueToday = (lead) => {
    if (!lead) return false;
    const combined = `${lead.followUpTime || ''} ${lead.followUpDate || ''} ${lead.notes || ''}`.toLowerCase();
    if (combined.includes('today')) return true;
    if (lead.followUpTime) {
      try {
        const d = parseTravelDateToDate(lead.followUpTime);
        const now = new Date();
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } catch (_) {}
    }
    return false;
  };

  const todayFollowUpCount = useMemo(() => {
    return validLeads.filter(isFollowUpDueToday).length;
  }, [validLeads]);

  const validVisitorQuotes = useMemo(
    () => deduplicateCalculatorQuotes(calculatorQuotes),
    [calculatorQuotes]
  );

  const baseList = useMemo(() => {
    if (sourceFilter === 'VISITORS') {
      return validVisitorQuotes;
    }
    return validLeads;
  }, [sourceFilter, validVisitorQuotes, validLeads]);

  const filteredLeads = useMemo(() => {
    return baseList.filter(l => {
      const q = search.toLowerCase().trim();
      const combined = `${l.guestName || ''} ${l.pickup || ''} ${l.drop || ''} ${l.vehicle || ''} ${l.quoteId || ''} ${l.sourcePage || ''} ${l.calculatorEngine || ''} ${l.tripType || ''} ${l.followUpTime || ''} ${l.notes || ''}`.toLowerCase();
      if (q && !combined.includes(q)) return false;

      if (sourceFilter === 'FOLLOW_UP_TODAY') {
        return isFollowUpDueToday(l);
      }
      if (sourceFilter === 'GOOGLE_ADS') {
        return combined.includes('google ads') || combined.includes('call campaign');
      }
      if (sourceFilter === 'WHATSAPP') {
        return (l.quoteId || '').startsWith('#WA') || (l.status || '').toLowerCase().includes('whatsapp') || combined.includes('whatsapp');
      }
      if (sourceFilter === 'PHONE') {
        return combined.includes('phone') || combined.includes('call') || combined.includes('direct');
      }
      return true;
    });
  }, [baseList, search, sourceFilter]);

  // Send WhatsApp Quote (Cut-and-dried bulleted format, Zero fluff, Rupee symbol)
  const handleSendQuoteWA = (lead) => {
    const cleanPhone = extractPhone(lead);
    const fare = Number(lead.estimatedFare) || 0;
    const pkg = lead.tripType || 'Cab Booking';
    const pickup = cleanLocationName(lead.pickup) || 'Chennai';
    const drop = cleanLocationName(lead.drop) || 'Destination';
    const guestName = lead.guestName && !isPlaceholderCustomerName(lead.guestName) ? lead.guestName.split('(')[0].trim() : 'Customer';
    const vehicle = lead.vehicle || 'AC Cab';
    const travelDate = lead.travelDate && lead.travelDate !== 'Departure date pending' ? lead.travelDate : 'As per schedule';

    let msg = '';
    if ((lead.tripType || '').includes('Acting Driver') || (lead.vehicle || '').includes('Acting Driver')) {
      msg =
        `👨‍✈️ *KALIDASS TRAVELS — ACTING DRIVER QUOTE*\n\n` +
        `• Customer: ${guestName}\n` +
        `• Service: Acting Driver (In Customer Car)\n` +
        `• Duty: ${pkg}\n` +
        `• Reporting: ${pickup}\n` +
        `• Vehicle: ${vehicle}\n` +
        `• Driver Fee: ₹${fare.toLocaleString('en-IN')}\n` +
        `• Date: ${travelDate}\n` +
        `• Terms: Driver Bata & food included as per duty. Overtime ₹100/hr.\n\n` +
        `🔒 *To Confirm Booking:*\n` +
        `• Pay *₹500 Advance* via UPI: *8939539211@okbizaxis* (Kalidass Travels)\n` +
        `• Verified chauffeur assigned immediately upon payment.\n\n` +
        `📞 24/7 Helpline: +91 89395 39211`;
    } else if ((lead.tripType || '').includes('Relocation') || (lead.vehicle || '').includes('Relocation')) {
      msg =
        `🚚 *KALIDASS TRAVELS — CAR RELOCATION QUOTE*\n\n` +
        `• Customer: ${guestName}\n` +
        `• Service: Intercity Vehicle Relocation (Driveaway)\n` +
        `• Route: ${pickup} ➔ ${drop}\n` +
        `• Vehicle: ${vehicle}\n` +
        `• All-Inclusive Quote: ₹${fare.toLocaleString('en-IN')}\n` +
        `• Inclusions: Senior Highway Chauffeur & Return Transit\n` +
        `• Date: ${travelDate}\n\n` +
        `🔒 *To Confirm Booking:*\n` +
        `• Pay *₹500 Advance* via UPI: *8939539211@okbizaxis* (Kalidass Travels)\n` +
        `• Driver allocated with vehicle condition checklist.\n\n` +
        `📞 24/7 Helpline: +91 89395 39211`;
    } else {
      msg =
        `🚕 *KALIDASS TRAVELS — TRIP QUOTE*\n\n` +
        `• Customer: ${guestName}\n` +
        `• Trip: ${pkg}\n` +
        `• Route: ${pickup} ➔ ${drop}\n` +
        `• Vehicle: ${vehicle}\n` +
        `• All-Inclusive Fare: ₹${fare.toLocaleString('en-IN')}\n` +
        `• Inclusions: Fuel, Driver Bata & Highway Toll (No Hidden Charges)\n` +
        `• Departure: ${travelDate}\n\n` +
        `🔒 *To Confirm Booking:*\n` +
        `• Pay *₹500 Advance* via UPI: *8939539211@okbizaxis* (Kalidass Travels)\n` +
        `• Car & Chauffeur allocated instantly upon payment.\n\n` +
        `📞 24/7 Helpline: +91 89395 39211`;
    }

    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.(`WhatsApp quote opened for ${guestName}!`, 'success');
  };

  // Follow-up ping (Clean, polite, Rupee symbol)
  const handleSendFollowUpWA = (lead) => {
    const cleanPhone = extractPhone(lead);
    const guestName = lead.guestName && !isPlaceholderCustomerName(lead.guestName) ? lead.guestName.split('(')[0].trim() : 'Sir/Madam';
    const fare = Number(lead.estimatedFare) || 0;
    const route = `${cleanLocationName(lead.pickup)} ➔ ${cleanLocationName(lead.drop)}`;
    const pkg = lead.tripType || 'Outstation Trip';
    const msg =
      `Namaskaram ${guestName} ji! 🙏\n\n` +
      `Following up from *Kalidass Travels Chennai* regarding your cab enquiry:\n` +
      `📍 *Route:* ${route}\n` +
      `🚗 *Car:* ${lead.vehicle || 'AC Cab'}${pkg ? ` (${pkg})` : ''}\n` +
      (fare > 0 ? `💰 *All-Inclusive Fare:* ₹${fare.toLocaleString('en-IN')}\n\n` : `\n`) +
      `Shall we block your vehicle? 🚕\n` +
      `Kindly transfer *₹500 Advance* via UPI to *8939539211@okbizaxis* (Kalidass Travels) to lock your cab & driver.\n\n` +
      `📞 24/7 Helpline: +91 89395 39211. Thank you!`;
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.(`Follow-up reminder sent to ${guestName}!`, 'success');
  };

  // Advance Received ➔ Move to Active Trips (Requires Valid Name & 10-digit Phone)
  const handleLockLeadWithAdvance = (lead) => {
    const cleanPhone = extractValidMobile(lead);
    const guestLabel = lead.guestName && !isPlaceholderCustomerName(lead.guestName)
      ? lead.guestName.split('(')[0].trim()
      : (lead.pickup && lead.pickup.includes('+91') ? lead.pickup.split('(')[0].trim() : '');

    const validation = validateCustomerContact(guestLabel, cleanPhone);

    // If either name or phone is missing/invalid, open modal so operator can enter them
    if (!validation.isValid) {
      setConvertModalLead(lead);
      setConvertForm({
        guestName: validation.cleanName || '',
        phone: validation.cleanPhone || '',
        travelDateTime: formatFriendlyTravelDateTime(lead.travelDate),
        advancePaid: '500'
      });
      setConvertError(validation.error);
      return;
    }

    const fare = Number(lead.estimatedFare) || 6000;
    const driverShare = Math.round(fare * 0.82);
    const cleanFrom = cleanLocationName(lead.pickup);
    const cleanTo = cleanLocationName(lead.drop);
    const routeLabel = lead.pickup.includes('+91') ? cleanTo : `${cleanFrom} ➔ ${cleanTo}`;

    const confirmed = {
      bookingId: (lead.quoteId && isSequentialId(lead.quoteId)) ? lead.quoteId.replace('#ENQ-', '#KT-').replace('#QT-', '#KT-') : getNextBookingId(),
      guestNamePhone: validation.formattedGuestNamePhone,
      travelDateTime: formatFriendlyTravelDateTime(lead.travelDate),
      pickupAddress: routeLabel,
      vehicleCategory: lead.vehicle || 'Sedan (Dzire / Etios)',
      partySize: '4 Pax',
      kycStatus: 'Advance Paid',
      darshanStatus: lead.sourcePage || lead.calculatorEngine || 'Direct Call',
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Need Driver',
      terminalFare: fare,
      chauffeurPayout: driverShare,
      companyMargin: fare - driverShare,
      advancePaid: 500,
      balanceDue: Math.max(0, fare - 500),
      financialClosure: 'Unreconciled',
      reviewStatus: 'Pending'
    };

    onConvertToConfirmed?.(confirmed, lead.quoteId);
    showToast?.(`✅ ₹500 Advance Received! Booking ${confirmed.bookingId} moved to Active Trips.`, 'success');
  };

  // Submit modal when entering missing customer name & phone for an enquiry
  const handleConfirmLeadConvert = (e) => {
    e?.preventDefault?.();
    if (!convertModalLead) return;

    const validation = validateCustomerContact(convertForm.guestName, convertForm.phone);
    if (!validation.isValid) {
      setConvertError(validation.error);
      showToast?.(validation.error, 'error');
      return;
    }

    const fare = Number(convertModalLead.estimatedFare) || 6000;
    const driverShare = Math.round(fare * 0.82);
    const cleanFrom = cleanLocationName(convertModalLead.pickup);
    const cleanTo = cleanLocationName(convertModalLead.drop);
    const routeLabel = convertModalLead.pickup.includes('+91') ? cleanTo : `${cleanFrom} ➔ ${cleanTo}`;

    const confirmed = {
      bookingId: (convertModalLead.quoteId && isSequentialId(convertModalLead.quoteId)) ? convertModalLead.quoteId.replace('#ENQ-', '#KT-').replace('#QT-', '#KT-') : getNextBookingId(),
      guestNamePhone: validation.formattedGuestNamePhone,
      travelDateTime: convertForm.travelDateTime.trim() || 'Tomorrow @ 05:00 AM',
      pickupAddress: routeLabel,
      vehicleCategory: convertModalLead.vehicle || 'Sedan (Dzire / Etios)',
      partySize: '4 Pax',
      kycStatus: 'Advance Paid',
      darshanStatus: convertModalLead.sourcePage || convertModalLead.calculatorEngine || 'Direct Call',
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Need Driver',
      terminalFare: fare,
      chauffeurPayout: driverShare,
      companyMargin: fare - driverShare,
      advancePaid: adv,
      balanceDue: Math.max(0, fare - adv),
      financialClosure: 'Unreconciled',
      reviewStatus: 'Pending'
    };

    onConvertToConfirmed?.(confirmed, convertModalLead.quoteId);
    showToast?.(`✅ ₹${adv} Advance Received! Booking ${confirmed.bookingId} confirmed for ${validation.cleanName}.`, 'success');
    setConvertModalLead(null);
  };

  // Fast Phone Call Saver: Supports quiet save (follow-up scheduled) OR save & send WhatsApp quote
  const handleSaveCallLead = (openWhatsAppQuote = false) => {
    if (!newCall.phone.trim() && !newCall.guestName.trim()) {
      showToast?.('Please enter Customer Name or Mobile Number', 'error');
      return;
    }
    const cleanPhone = newCall.phone.replace(/[^0-9]/g, '').slice(-10);
    const fareNum = Number(newCall.fare) || 0;
    const pkg = newCall.tripType || (callTripMode ? 'Outstation Trip' : 'Customer Enquiry');
    const followUp = newCall.followUpTime?.trim() || '';
    const noteText = newCall.notes?.trim() || (followUp ? `Customer will confirm ${followUp}` : '');

    const newLead = {
      quoteId: getNextEnquiryId(leads),
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      guestName: newCall.guestName.trim() || (cleanPhone ? `Customer (${cleanPhone})` : 'Phone Caller'),
      sourcePage: cleanPhone ? `${newCall.source || 'Phone Call'} (+91 ${cleanPhone})` : (newCall.source || 'Phone Call'),
      calculatorEngine: newCall.source || 'Direct Phone Call',
      tripType: pkg,
      pickup: newCall.pickup.trim() || 'Chennai',
      drop: newCall.drop.trim() || 'Outstation',
      vehicle: newCall.vehicle || 'Sedan (Dzire / Etios)',
      estimatedFare: fareNum,
      travelDate: newCall.travelDate || 'Departure date pending',
      followUpTime: followUp,
      notes: noteText,
      status: openWhatsAppQuote ? 'Quote Sent - Waiting Advance' : 'Follow-Up Scheduled'
    };

    onAddManualLead?.(newLead);
    if (openWhatsAppQuote && cleanPhone) {
      handleSendQuoteWA(newLead);
    }
    resetCallForm();
    setShowNewCallModal(false);
    showToast?.(
      openWhatsAppQuote
        ? `Enquiry ${newLead.quoteId} recorded & WhatsApp quote opened!`
        : `✅ Enquiry ${newLead.quoteId} saved! Follow-up set for ${newLead.followUpTime || 'Today'}.`,
      'success'
    );
  };

  // Open Edit Follow-Up / Schedule Modal
  const handleOpenEditFollowUp = (lead) => {
    setEditModalLead(lead);
    setEditForm({
      followUpTime: lead.followUpTime || 'Today Evening @ 05:00 PM',
      travelDate: lead.travelDate || 'Tomorrow @ 06:00 AM',
      tripType: lead.tripType || '2 Days Outstation Package',
      estimatedFare: lead.estimatedFare || '',
      notes: lead.notes || ''
    });
  };

  const handleSaveEditFollowUp = (e) => {
    e?.preventDefault?.();
    if (!editModalLead) return;
    const updated = {
      ...editModalLead,
      followUpTime: editForm.followUpTime,
      travelDate: editForm.travelDate,
      tripType: editForm.tripType,
      estimatedFare: Number(editForm.estimatedFare) || editModalLead.estimatedFare,
      notes: editForm.notes
    };
    onUpdateLead?.(updated);
    setEditModalLead(null);
    showToast?.(`Follow-up schedule updated for ${editModalLead.guestName || 'Enquiry'}!`, 'success');
  };

  // Direct Advance Received & Confirm (Strict: Requires BOTH Customer Name & valid 10-digit Phone)
  const handleQuickConfirmBooking = () => {
    const validation = validateCustomerContact(newCall.guestName, newCall.phone);
    if (!validation.isValid) {
      showToast?.(validation.error || 'Please enter Customer Name and a valid 10-digit Mobile Number before moving to Active Trips.', 'error');
      return;
    }
    const fareNum = Number(newCall.fare) || 0;
    const advNum = Number(newCall.advance) || 500;
    const driverShare = Math.round(fareNum * 0.82);

    const newBooking = {
      bookingId: getNextBookingId(),
      guestNamePhone: validation.formattedGuestNamePhone,
      travelDateTime: newCall.travelDate || 'Departure date pending',
      pickupAddress: `${newCall.pickup.trim() || 'Chennai'} ➔ ${newCall.drop.trim() || 'Outstation'}`,
      vehicleCategory: newCall.vehicle || 'Sedan (Dzire / Etios)',
      partySize: '4 Pax',
      kycStatus: 'Advance Paid',
      darshanStatus: `${newCall.source || 'Direct Call'} (${newCall.tripType || 'Trip'})`,
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Need Driver',
      terminalFare: fareNum,
      chauffeurPayout: driverShare,
      companyMargin: fareNum - driverShare,
      advancePaid: advNum,
      balanceDue: Math.max(0, fareNum - advNum),
      financialClosure: 'Unreconciled',
      reviewStatus: 'Pending',
      notes: newCall.notes
    };

    onConvertToConfirmed?.(newBooking);
    resetCallForm();
    setShowNewCallModal(false);
    showToast?.(`✅ Booking ${newBooking.bookingId} confirmed! Check Active Trips.`, 'success');
  };

  return (
    <>
      <div className="space-y-4 animate-fadeIn">
      {/* Page Header Bar */}
      <div className="bg-m3-surface-container-lowest p-4 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-m3-primary"></span>
            <h2 className="text-m3-title-m font-bold text-m3-on-surface">
              1. Customer Enquiries & Quotes
            </h2>
            <span className="text-xs font-semibold bg-m3-primary-container text-m3-on-primary-container px-2.5 py-0.5 rounded-full">
              {validLeads.length} Inquiries
            </span>
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-0.5">
            Incoming calls from Google Ads, phone calls & WhatsApp. Send quotes and collect ₹500 advance.
          </p>
        </div>

        {/* Primary Action Button (Rate Calc & Paste WA are in the top app bar) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resetCallForm();
              setShowNewCallModal(true);
            }}
            className="h-10 px-5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-xs font-semibold flex items-center gap-2 shadow-m3-1 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_call</span>
            <span>+ New Customer Call</span>
          </button>
        </div>
      </div>

      {/* Website Visitor Live Radar Quick Access Callout */}
      {validVisitorQuotes.length > 0 && sourceFilter !== 'VISITORS' && (
        <div className="bg-m3-surface-container-low border border-m3-outline-variant/70 p-3 rounded-m3-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-m3-primary text-[20px]">radar</span>
            <span className="text-m3-on-surface">
              <strong>{validVisitorQuotes.length} Website Visitors</strong> recently calculated cab fares on your website!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSourceFilter('VISITORS')}
              className="px-3 py-1 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-full text-xs font-bold transition-all"
            >
              Show Here ({validVisitorQuotes.length})
            </button>
            {onNavigateToRadar && (
              <button
                type="button"
                onClick={onNavigateToRadar}
                className="px-3 py-1 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-full text-xs font-bold transition-all"
              >
                Open Live Radar ➔
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-1">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2 text-m3-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, or route..."
            className="w-full pl-9 pr-8 h-9 text-xs font-medium rounded-m3-full border border-m3-outline-variant/80 bg-m3-surface-container-low focus:bg-m3-surface-container-lowest focus:border-m3-primary text-m3-on-surface transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-m3-on-surface-variant text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: `All Calls (${validLeads.length})` },
            {
              id: 'FOLLOW_UP_TODAY',
              label: `⏰ Follow-up Today (${todayFollowUpCount})`,
              highlight: todayFollowUpCount > 0
            },
            { id: 'VISITORS', label: `🌐 Website Visitors (${validVisitorQuotes.length})` },
            { id: 'GOOGLE_ADS', label: 'Google Ads' },
            { id: 'WHATSAPP', label: 'WhatsApp' },
            { id: 'PHONE', label: 'Direct Calls' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSourceFilter(f.id)}
              className={`h-8 px-3 rounded-m3-sm text-xs font-semibold transition-colors ${
                sourceFilter === f.id
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container border-0'
                  : f.highlight
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/40 hover:bg-amber-500/25 font-bold'
                  : 'bg-m3-surface-container-lowest text-m3-on-surface-variant border border-m3-outline-variant hover:bg-m3-surface-container-high'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries List */}
      {filteredLeads.length === 0 ? (
        <div className="p-10 text-center bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-m3-surface-container-high text-m3-on-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">phone_in_talk</span>
          </div>
          <h3 className="text-sm font-bold text-m3-on-surface">No Pending Enquiries</h3>
          <p className="text-xs text-m3-on-surface-variant max-w-md mx-auto">
            When a customer calls or inquires from Google Ads or your website, record them here to send an instant quote and follow up for ₹500 advance.
          </p>
          <button
            type="button"
            onClick={() => {
              resetCallForm();
              setShowNewCallModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-m3-full text-xs font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add_call</span>
            <span>Record Customer Call</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredLeads.map((lead, idx) => {
            const phone = extractPhone(lead);
            const isGoogleAds = (lead.sourcePage || '').toLowerCase().includes('google ads') || (lead.calculatorEngine || '').toLowerCase().includes('google ads');
            const isWhatsApp = (lead.quoteId || '').startsWith('#WA') || (lead.sourcePage || '').toLowerCase().includes('whatsapp');
            const isDueToday = isFollowUpDueToday(lead);

            return (
              <div
                key={lead.quoteId || idx}
                className={`p-4 rounded-m3-xl bg-m3-surface-container-lowest border shadow-m3-1 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3.5 hover:border-m3-outline transition-all ${
                  isDueToday ? 'border-amber-500/70 ring-1 ring-amber-500/20' : 'border-m3-outline-variant/80'
                }`}
              >
                {/* Top / Left: Lead Details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-code text-xs font-bold bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant/70 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      {getOrderedEnquiryId(lead, idx, filteredLeads.length)}
                    </span>

                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-m3-secondary-container text-m3-on-secondary-container whitespace-nowrap shrink-0">
                      <span className="material-symbols-outlined text-[13px]">
                        {isGoogleAds ? 'campaign' : isWhatsApp ? 'chat' : (lead.calculatorEngine || (lead.guestName || '').includes('Visitor')) ? 'radar' : 'call'}
                      </span>
                      <span>
                        {isGoogleAds ? 'Google Ads Call' : isWhatsApp ? 'WhatsApp' : (lead.calculatorEngine || (lead.guestName || '').includes('Visitor') ? (lead.calculatorEngine || 'Website Visitor') : 'Phone Call')}
                      </span>
                    </span>

                    <span className="text-xs font-bold text-m3-on-surface whitespace-nowrap">
                      👤 {lead.guestName || 'Customer'}
                    </span>

                    {phone && (
                      <a
                        href={`tel:+91${phone}`}
                        className="text-xs font-mono-code font-bold text-m3-primary hover:underline bg-m3-secondary-container/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <span className="material-symbols-outlined text-[13px]">call</span>
                        <span>+91 {phone}</span>
                      </a>
                    )}

                    {lead.timestamp && (
                      <span className="text-[11px] font-semibold text-m3-outline font-mono-code bg-m3-surface-container-low px-2 py-0.5 rounded-full border border-m3-outline-variant/40 flex items-center gap-1 whitespace-nowrap shrink-0 sm:ml-auto">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        <span>{formatCleanDateTime(lead.timestamp)}</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const targetId = lead.quoteId || getOrderedEnquiryId(lead, idx, filteredLeads.length);
                        if (window.confirm(`Are you sure you want to delete enquiry ${targetId}?`)) {
                          onDeleteLead?.(targetId);
                        }
                      }}
                      className="text-[11px] font-bold text-m3-error hover:bg-m3-error-container/40 px-2 py-0.5 rounded transition-colors flex items-center gap-0.5 whitespace-nowrap shrink-0"
                      title="Delete / Dismiss enquiry"
                    >
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                      <span>Delete</span>
                    </button>
                  </div>

                  <div className="text-sm font-bold text-m3-on-surface break-words flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-m3-primary text-[17px] shrink-0">near_me</span>
                    <span>{cleanLocationName(lead.pickup)} ➔ {cleanLocationName(lead.drop)}</span>
                  </div>

                  <div className="text-xs text-m3-on-surface-variant flex flex-wrap items-center gap-2 font-medium">
                    <span className="whitespace-nowrap">🚗 {lead.vehicle}</span>
                    <span>•</span>
                    <span className="font-semibold text-m3-on-surface bg-m3-surface-container-high px-2 py-0.5 rounded-full border border-m3-outline-variant/50 whitespace-nowrap">
                      🎒 {lead.tripType || 'Round Trip'}
                    </span>
                    {lead.travelDate && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-m3-on-surface bg-m3-surface-container-low px-2 py-0.5 rounded-full border border-m3-outline-variant/40 whitespace-nowrap">
                          🗓️ Travel: {formatFriendlyTravelDateTime(lead.travelDate)}
                        </span>
                      </>
                    )}
                    {lead.followUpTime && (
                      <>
                        <span>•</span>
                        <span className={`font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap ${
                          isDueToday
                            ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/50'
                            : 'bg-m3-surface-container-high text-m3-on-surface-variant border border-m3-outline-variant/40'
                        }`}>
                          <span className="material-symbols-outlined text-[13px] text-amber-600">alarm</span>
                          <span>Follow-up: {lead.followUpTime}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {lead.notes && (
                    <div className="text-xs text-m3-on-surface-variant font-medium bg-m3-surface-container-low px-2.5 py-1 rounded-m3-md border border-m3-outline-variant/40 flex items-center gap-1.5 mt-1">
                      <span className="material-symbols-outlined text-[14px] text-amber-600 shrink-0">edit_note</span>
                      <span className="break-words">{lead.notes}</span>
                    </div>
                  )}
                </div>

                {/* Bottom / Right: Price & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between 2xl:justify-end gap-2.5 pt-3 2xl:pt-0 border-t 2xl:border-t-0 border-m3-outline-variant/50">
                  <div className="text-left 2xl:text-right mr-2 shrink-0">
                    <span className="text-base font-bold text-m3-on-surface block leading-tight">
                      ₹{Number(lead.estimatedFare || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-m3-on-surface-variant font-medium">Quoted Fare</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendQuoteWA(lead)}
                      className="h-9 px-3 bg-m3-surface-container-low hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      title="Send initial quote on WhatsApp"
                    >
                      <span className="material-symbols-outlined text-[15px]">chat</span>
                      <span>Send Quote</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendFollowUpWA(lead)}
                      className="h-9 px-3 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-m3-full text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      title="Send follow-up reminder to confirm cab"
                    >
                      <span className="material-symbols-outlined text-[15px]">ring_volume</span>
                      <span>Follow-up</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditFollowUp(lead)}
                      className="h-9 px-2.5 bg-m3-surface-container-low hover:bg-m3-surface-container-high text-amber-800 dark:text-amber-200 border border-amber-500/40 rounded-m3-full text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
                      title="Edit follow-up time, package, or call notes"
                    >
                      <span className="material-symbols-outlined text-[15px] text-amber-600">edit_calendar</span>
                      <span>Edit Time</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const url = buildGoogleCalendarUrl({
                          ...lead,
                          bookingId: lead.quoteId,
                          isFollowUp: Boolean(lead.followUpTime),
                          followUpTime: lead.followUpTime,
                          notes: lead.notes || (lead.followUpTime ? `Customer confirmation call: ${lead.followUpTime}` : 'Customer enquiry follow-up: pending ₹500 advance confirmation')
                        });
                        window.open(url, '_blank');
                        showToast?.('Follow-up reminder opened in Google Calendar!', 'success');
                      }}
                      className="h-9 px-2.5 bg-m3-surface-container-low hover:bg-m3-surface-container-high text-m3-primary border border-m3-outline-variant rounded-m3-full text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
                      title="Set Google Calendar follow-up reminder"
                    >
                      <span className="material-symbols-outlined text-[15px]">event</span>
                      <span>Cal Reminder</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLockLeadWithAdvance(lead)}
                      className="h-9 px-4 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-xs font-semibold flex items-center gap-1.5 shadow-m3-1 transition-all whitespace-nowrap"
                      title="Customer paid ₹500 advance. Move to Step 2: Active Trips"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>Got ₹500 Adv (Confirm)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetId = lead.quoteId || getOrderedEnquiryId(lead, idx, filteredLeads.length);
                        if (window.confirm(`Are you sure you want to delete enquiry ${targetId}?`)) {
                          onDeleteLead?.(targetId);
                        }
                      }}
                      className="h-9 px-2.5 text-m3-error hover:bg-m3-error-container/30 border border-m3-error/30 hover:border-m3-error/60 rounded-m3-full text-xs font-semibold flex items-center justify-center transition-colors shrink-0"
                      title="Delete / Dismiss this enquiry"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* New Inbound Call CAD Modal (20-Year Travel Desk / Fast Track Console) */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-2xl shadow-m3-4 w-full max-w-3xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-m3-outline-variant/70 bg-m3-surface-container-low flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">add_call</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-m3-on-surface flex items-center gap-2">
                    <span>Record Inbound Customer Call</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">Fast Track CAD Desk</span>
                  </h3>
                  <p className="text-[11px] text-m3-on-surface-variant">Live tariff calculation, WhatsApp quote & 1-tap confirmation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCallModal(false)}
                className="w-8 h-8 rounded-full hover:bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface-variant font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <form
              id="new-call-cad-form"
              onSubmit={(e) => { e.preventDefault(); handleSaveCallLead(false); }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* Scrollable Body */}
              <div className="p-4 sm:p-5 overflow-y-auto min-h-0 space-y-4 text-xs flex-1">
                {/* 1. 6 Quotation Engines Selector (Direct match to Website Engines) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-m3-on-surface text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-m3-primary">alt_route</span>
                      <span>1. Quotation Engine (Website Live Mirror)</span>
                    </label>
                    <span className="text-[11px] text-m3-on-surface-variant font-medium">Select to open tailored booking inputs & live tariff dock</span>
                  </div>

                  {/* 6 Engine Buttons Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                    {DESK_QUOTATION_ENGINES.map((engine) => {
                      const isSelected = Boolean(callTripMode) && callTripMode === engine.id;
                      return (
                        <button
                          key={engine.id}
                          type="button"
                          onClick={() => handleSelectTripMode(engine.id)}
                          className={`p-2 rounded-m3-md border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-m3-primary text-white border-m3-primary shadow-xs font-bold ring-2 ring-m3-primary/30'
                              : 'bg-m3-surface-container-low text-m3-on-surface border-m3-outline-variant hover:bg-m3-surface-container-high font-semibold'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{engine.icon}</span>
                          <span className="text-[11px] leading-tight font-bold">{engine.label}</span>
                          <span className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-m3-on-surface-variant'}`}>{engine.sub}</span>
                        </button>
                      );
                    })}
                  </div>

                  {!callTripMode && (
                    <div className="p-3 bg-m3-surface-container-low border border-dashed border-m3-outline-variant rounded-m3-lg text-center text-xs text-m3-on-surface-variant flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-m3-primary">touch_app</span>
                      <span>Select one of the <strong>6 quotation engines</strong> above to load its booking parameters & live tariffs.</span>
                    </div>
                  )}

                  {/* Engine 1: Outstation Cabs Sub-Controls */}
                  {callTripMode === 'OUTSTATION' && (
                    <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-m3-md space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">directions_car</span>
                          <span>Outstation Trip Type:</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateOutstationSubtype('ROUND')}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              outstationSubtype === 'ROUND'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800'
                            }`}
                          >
                            🔄 Round Trip (Min 250 km/day)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateOutstationSubtype('ONEWAY')}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              outstationSubtype === 'ONEWAY'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800'
                            }`}
                          >
                            ➡️ One-Way Drop (Highway Drop)
                          </button>
                        </div>
                      </div>

                      {outstationSubtype === 'ROUND' && (
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-blue-200/60 dark:border-blue-900/60">
                          <span className="text-[10px] font-semibold text-blue-900 dark:text-blue-300">Package Duration:</span>
                          <div className="flex flex-wrap items-center gap-1">
                            {[
                              { days: 1, label: '1 Day (Same Day Return)' },
                              { days: 2, label: '2 Days / 1 Night' },
                              { days: 3, label: '3 Days / 2 Nights' },
                              { days: 4, label: '4 Days' },
                              { days: 5, label: '5+ Days' }
                            ].map((d) => (
                              <button
                                key={d.days}
                                type="button"
                                onClick={() => handleUpdateRoundTripDays(d.days)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                                  roundTripDays !== null && roundTripDays === d.days
                                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                                    : 'bg-white dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800 hover:bg-blue-100'
                                }`}
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Engine 2: Local Rental Sub-Controls */}
                  {callTripMode === 'LOCAL_RENTAL' && (
                    <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-m3-md flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">schedule</span>
                        <span>Chennai Local Hourly Package:</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {[
                          { pkg: '4 Hours / 40 Kms', label: '4h / 40km' },
                          { pkg: '5 Hours / 50 Kms', label: '5h / 50km' },
                          { pkg: '8 Hours / 80 Kms', label: '8h / 80km (Full Day)' },
                          { pkg: '10 Hours / 100 Kms', label: '10h / 100km' },
                          { pkg: '12 Hours / 120 Kms', label: '12h / 120km' }
                        ].map((lp) => (
                          <button
                            key={lp.pkg}
                            type="button"
                            onClick={() => handleUpdateLocalPackage(lp.pkg)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              Boolean(selectedLocalPackage) && selectedLocalPackage === lp.pkg
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {lp.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Engine 3: Airport Taxi Sub-Controls */}
                  {callTripMode === 'AIRPORT_TAXI' && (
                    <div className="p-2.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-m3-md space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">flight</span>
                          <span>Airport Transfer Direction:</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateAirportTransfer('DROP')}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              airportTransferType === 'DROP'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-white dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800'
                            }`}
                          >
                            🛫 Drop to Chennai Airport (Departure)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateAirportTransfer('PICKUP')}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              airportTransferType === 'PICKUP'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-white dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800'
                            }`}
                          >
                            🛬 Pickup from Chennai Airport (Arrival)
                          </button>
                        </div>
                      </div>

                      {/* Airport Chennai Zones */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-purple-200/60 dark:border-purple-900/60">
                        <span className="text-[10px] font-semibold text-purple-900 dark:text-purple-300">Chennai Zone:</span>
                        <div className="flex flex-wrap items-center gap-1">
                          {[
                            { zone: 'South', label: 'South (₹650)', sub: 'Tambaram / Velachery' },
                            { zone: 'Central', label: 'Central (₹950)', sub: 'T-Nagar / Guindy' },
                            { zone: 'OMR', label: 'OMR (₹1,250)', sub: 'Perungudi / Siruseri' },
                            { zone: 'North', label: 'North (₹1,400)', sub: 'Parrys / Madhavaram' },
                            { zone: 'ECR', label: 'ECR (₹1,650)', sub: 'Palavakkam / Akkarai' }
                          ].map((z) => (
                            <button
                              key={z.zone}
                              type="button"
                              onClick={() => handleUpdateAirportZone(z.zone)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                airportZone === z.zone
                                  ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                                  : 'bg-white dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800 hover:bg-purple-100'
                              }`}
                              title={z.sub}
                            >
                              {z.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Engine 4: Pilgrimage & Tour Packages Sub-Controls */}
                  {callTripMode === 'PILGRIMAGE_TOUR' && (
                    <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-m3-md space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">temple_hindu</span>
                          <span>Select Pilgrimage / Tour Package Circuit:</span>
                        </span>
                        <span className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">Includes hill permit & darshan schedule</span>
                      </div>
                      <select
                        value={selectedTourPackage}
                        onChange={(e) => handleUpdateTourPackage(e.target.value)}
                        className="w-full p-2 rounded-m3-md border border-amber-300 dark:border-amber-800 bg-white dark:bg-neutral-900 font-bold text-xs text-m3-on-surface focus:border-amber-600"
                      >
                        <option value="" disabled>-- Select Pilgrimage / Tour Circuit --</option>
                        <option value="Tirupati Balaji Darshan (1 Day)">🛕 Tirupati Balaji Darshan (1 Day Same-Day Return)</option>
                        <option value="Tirupati + Kalahasti (2 Days)">🛕 Tirupati + Sri Kalahasti Rahu Ketu (2 Days)</option>
                        <option value="Pondicherry French Colony (1-2 Days)">🏖️ Pondicherry & Auroville Beach Tour (1 Day)</option>
                        <option value="Pondicherry Weekend (2 Days)">🏖️ Pondicherry Weekend Leisure (2 Days / 1 Night)</option>
                        <option value="Thiruvannamalai Girivalam (1 Day)">🕉️ Thiruvannamalai Arunachaleswarar & Girivalam (1 Day)</option>
                        <option value="Kumbakonam Navagraha (2 Days)">🪐 Kumbakonam Navagraha Temples (2 Days Fast Tour)</option>
                        <option value="Kumbakonam Navagraha (3 Days)">🪐 Kumbakonam 9 Navagraha Sthalams (3 Days Relaxed)</option>
                        <option value="Kanchipuram Silk & Temples (1 Day)">🏛️ Kanchipuram Kamakshi & Silk Sarees (1 Day)</option>
                        <option value="Vellore Golden Temple & CMC (1 Day)">✨ Vellore Sripuram Golden Temple (1 Day)</option>
                        <option value="Rameswaram Dham Pilgrimage (3 Days)">🌊 Rameswaram Dham & Dhanushkodi (3 Days)</option>
                        <option value="Sabarimala Mandalam Tour (3+ Days)">🙏 Sabarimala Ayyappan Mandalam Season Tour (3+ Days)</option>
                      </select>
                    </div>
                  )}

                  {/* Engine 5: Acting Drivers Sub-Controls */}
                  {callTripMode === 'ACTING_DRIVER' && (
                    <div className="p-2.5 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-m3-md space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-orange-950 dark:text-orange-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">person</span>
                          <span>Chauffeur Duty Type:</span>
                        </span>
                        <div className="flex items-center gap-1">
                          {[
                            { id: 'CITY_HOURLY', label: '🏙️ City Hourly' },
                            { id: 'OUTSTATION_BATA', label: '🛣️ Outstation Daily' },
                            { id: 'ONEWAY_DROP', label: '🎯 One-Way Drop' }
                          ].map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setDriverDutyType(d.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                driverDutyType === d.id
                                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                                  : 'bg-white dark:bg-orange-900/40 text-orange-950 dark:text-orange-200 border-orange-300 dark:border-orange-800'
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-orange-200/60 dark:border-orange-900/60">
                        {/* Vehicle Transmission */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-semibold text-orange-900 dark:text-orange-300">Vehicle:</span>
                          {['Manual Sedan / Hatch', 'Manual SUV', 'Automatic / Luxury'].map((cType) => (
                            <button
                              key={cType}
                              type="button"
                              onClick={() => setDriverCarType(cType)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                driverCarType === cType
                                  ? 'bg-orange-700 text-white border-orange-700'
                                  : 'bg-white dark:bg-orange-900/30 text-orange-900 dark:text-orange-200 border-orange-300'
                              }`}
                            >
                              {cType.split('/')[0]}
                            </button>
                          ))}
                        </div>

                        {/* Hours or Days */}
                        {driverDutyType === 'CITY_HOURLY' ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold text-orange-900 dark:text-orange-300">Duration:</span>
                            {[4, 8].map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => setDriverHours(h)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  driverHours === h
                                    ? 'bg-orange-700 text-white border-orange-700'
                                    : 'bg-white dark:bg-orange-900/30 text-orange-900 dark:text-orange-200 border-orange-300'
                                }`}
                              >
                                {h} Hours
                              </button>
                            ))}
                          </div>
                        ) : driverDutyType === 'OUTSTATION_BATA' ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold text-orange-900 dark:text-orange-300">Days:</span>
                            {[1, 2, 3, 4, 5].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setDriverDays(d)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  driverDays === d
                                    ? 'bg-orange-700 text-white border-orange-700'
                                    : 'bg-white dark:bg-orange-900/30 text-orange-900 dark:text-orange-200 border-orange-300'
                                }`}
                              >
                                {d}d
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold text-orange-900 dark:text-orange-300">Drop:</span>
                            {['Pondicherry (Tier 1)', 'Bangalore (Tier 2)', 'Coimbatore (Tier 3)'].map((dest) => (
                              <button
                                key={dest}
                                type="button"
                                onClick={() => setDriverOneWayDest(dest)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  driverOneWayDest === dest
                                    ? 'bg-orange-700 text-white border-orange-700'
                                    : 'bg-white dark:bg-orange-900/30 text-orange-900 dark:text-orange-200 border-orange-300'
                                }`}
                              >
                                {dest.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Night Duty Toggle */}
                        <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-orange-950 dark:text-orange-200">
                          <input
                            type="checkbox"
                            checked={driverNightDuty}
                            onChange={(e) => setDriverNightDuty(e.target.checked)}
                            className="rounded text-orange-600 focus:ring-0"
                          />
                          <span>🌙 Night Duty (+₹150)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Engine 6: Vehicle Relocation Sub-Controls */}
                  {callTripMode === 'VEHICLE_RELOCATION' && (
                    <div className="p-2.5 bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900 rounded-m3-md space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-cyan-950 dark:text-cyan-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">local_shipping</span>
                          <span>Intercity Relocation Destination:</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          {[
                            { dest: 'Bangalore', km: '350 km', fare: '₹4,800' },
                            { dest: 'Hyderabad', km: '630 km', fare: '₹7,500' },
                            { dest: 'Coimbatore', km: '510 km', fare: '₹6,500' },
                            { dest: 'Madurai', km: '460 km', fare: '₹5,900' },
                            { dest: 'Kochi / Kerala', km: '700 km', fare: '₹8,500' }
                          ].map((item) => (
                            <button
                              key={item.dest}
                              type="button"
                              onClick={() => {
                                setRelocationDest(item.dest);
                                setNewCall(prev => ({ ...prev, drop: item.dest }));
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                (relocationDest === item.dest || newCall.drop === item.dest)
                                  ? 'bg-cyan-700 text-white border-cyan-700 shadow-xs'
                                  : 'bg-white dark:bg-cyan-900/40 text-cyan-950 dark:text-cyan-200 border-cyan-300 dark:border-cyan-800'
                              }`}
                            >
                              {item.dest} ({item.fare})
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-cyan-200/60 dark:border-cyan-900/60">
                        <span className="text-[10px] font-semibold text-cyan-900 dark:text-cyan-300">Car Category:</span>
                        <div className="flex items-center gap-1.5">
                          {[
                            { type: 'Hatchback / Sedan', label: 'Hatch / Sedan' },
                            { type: 'SUV', label: 'SUV (+18%)' },
                            { type: 'Luxury / Automatic', label: 'Luxury / Auto (+40%)' }
                          ].map((c) => (
                            <button
                              key={c.type}
                              type="button"
                              onClick={() => setRelocationCarType(c.type)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                relocationCarType === c.type
                                  ? 'bg-cyan-800 text-white border-cyan-800'
                                  : 'bg-white dark:bg-cyan-900/30 text-cyan-900 dark:text-cyan-200 border-cyan-300'
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Dynamic Route Inputs Tailored by Quotation Engine */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Left Column: Pickup / Reporting / Handover Location */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-m3-on-surface">
                        {callTripMode === 'ACTING_DRIVER'
                          ? 'Reporting Address (Chauffeur Duty in Chennai)'
                          : callTripMode === 'VEHICLE_RELOCATION'
                          ? 'Pickup Address in Chennai (Car Handover)'
                          : callTripMode === 'AIRPORT_TAXI' && airportTransferType === 'PICKUP'
                          ? 'Airport Pickup Point'
                          : 'Pickup Location (in Chennai)'}
                      </label>
                      <span className="text-[10px] text-m3-primary font-semibold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">location_on</span>
                        <span>Google Autocomplete</span>
                      </span>
                    </div>
                    <input
                      ref={pickupInputRef}
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Search street, college, landmark, or airport..."
                      value={newCall.pickup}
                      onChange={(e) => setNewCall({ ...newCall, pickup: e.target.value })}
                      className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-semibold text-xs text-m3-on-surface focus:border-m3-primary focus:bg-white"
                    />

                    {/* Quick Hub Chips */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-m3-on-surface-variant font-medium shrink-0">Quick Hubs:</span>
                      {[
                        { label: '✈️ Airport (MAA)', val: 'Chennai International Airport (MAA)' },
                        { label: '🚉 Central (MAS)', val: 'Chennai Central Railway Station (MAS)' },
                        { label: '📍 Medavakkam (Office)', val: 'Medavakkam, Chennai' }
                      ].map((hub) => {
                        const isSelected = Boolean(newCall.pickup) && (newCall.pickup === hub.val || newCall.pickup.includes(hub.val));
                        return (
                          <button
                            key={hub.label}
                            type="button"
                            onClick={() => setNewCall(prev => ({ ...prev, pickup: hub.val }))}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all truncate ${
                              isSelected
                                ? 'bg-m3-primary-container text-m3-on-primary-container border-m3-primary'
                                : 'bg-m3-surface-container-high/60 text-m3-on-surface-variant border-transparent hover:bg-m3-surface-container-highest'
                            }`}
                          >
                            {hub.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Drop Destination / City Coverage Tailored by Engine */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-m3-on-surface">
                        {callTripMode === 'LOCAL_RENTAL'
                          ? 'Local Sightseeing Area / Stops (Within Chennai)'
                          : callTripMode === 'ACTING_DRIVER'
                          ? 'Duty Destination / Coverage Area'
                          : callTripMode === 'VEHICLE_RELOCATION'
                          ? 'Delivery Address in Destination City'
                          : callTripMode === 'AIRPORT_TAXI' && airportTransferType === 'DROP'
                          ? 'Airport Terminal Drop'
                          : 'Drop Destination'}
                      </label>
                      <span className="text-[10px] text-m3-primary font-semibold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">near_me</span>
                        <span>Google Autocomplete</span>
                      </span>
                    </div>
                    <input
                      ref={dropInputRef}
                      type="text"
                      required
                      autoComplete="off"
                      placeholder={
                        callTripMode === 'LOCAL_RENTAL'
                          ? 'e.g. City Sightseeing, T-Nagar Shopping, OMR...'
                          : callTripMode === 'AIRPORT_TAXI'
                          ? 'e.g. Chennai Airport Terminal 1 / 4 Domestic'
                          : 'Search destination city, temple, town...'
                      }
                      value={newCall.drop}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewCall(prev => ({ ...prev, drop: val }));
                      }}
                      className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-semibold text-xs text-m3-on-surface focus:border-m3-primary focus:bg-white"
                    />

                    {/* Context-Aware Destination Chips Tailored per Engine */}
                    <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
                      <span className="text-[10px] text-m3-on-surface-variant font-medium shrink-0">
                        {callTripMode === 'LOCAL_RENTAL' ? 'Top Areas:' : 'Top Destinations:'}
                      </span>
                      {(callTripMode === 'AIRPORT_TAXI'
                        ? [
                            { label: '✈️ Terminal 1 / 4 (Domestic)', val: 'Chennai Airport Terminal 1/4 (Domestic)' },
                            { label: '✈️ Terminal 2 (Intl)', val: 'Chennai Airport Terminal 2 (International)' }
                          ]
                        : callTripMode === 'LOCAL_RENTAL'
                        ? [
                            { label: '🏙️ City Sightseeing', val: 'Chennai City Local Sightseeing' },
                            { label: '🏛️ OMR IT Corridor', val: 'OMR & Sholinganallur IT Park' },
                            { label: '🛍️ T-Nagar Shopping', val: 'T-Nagar & Pondy Bazaar, Chennai' }
                          ]
                        : callTripMode === 'PILGRIMAGE_TOUR'
                        ? [
                            { label: '🛕 Tirupati', val: 'Tirupati Balaji Darshan' },
                            { label: '🏖️ Pondicherry', val: 'Pondicherry French Colony' },
                            { label: '🕉️ Tiruvannamalai', val: 'Thiruvannamalai Girivalam' },
                            { label: '🪐 Kumbakonam', val: 'Kumbakonam Navagraha Temples' }
                          ]
                        : callTripMode === 'VEHICLE_RELOCATION'
                        ? [
                            { label: '🏢 Bangalore', val: 'Bangalore' },
                            { label: '🏛️ Hyderabad', val: 'Hyderabad' },
                            { label: '🏭 Coimbatore', val: 'Coimbatore' },
                            { label: '🛕 Madurai', val: 'Madurai' }
                          ]
                        : [
                            { label: '🛕 Tirupati', val: 'Tirupati' },
                            { label: '🌊 Pondicherry', val: 'Pondicherry' },
                            { label: '🏢 Bangalore', val: 'Bangalore' },
                            { label: '🕉️ Tiruvannamalai', val: 'Tiruvannamalai' }
                          ]
                      ).map((dest) => {
                        const isSelected = Boolean(newCall.drop) && (newCall.drop === dest.val || newCall.drop.includes(dest.val));
                        return (
                          <button
                            key={dest.label}
                            type="button"
                            onClick={() => setNewCall(prev => ({ ...prev, drop: dest.val }))}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all truncate ${
                              isSelected
                                ? 'bg-m3-primary-container text-m3-on-primary-container border-m3-primary'
                                : 'bg-m3-surface-container-high/60 text-m3-on-surface-variant border-transparent hover:bg-m3-surface-container-highest'
                            }`}
                          >
                            {dest.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Actual Travel Date & Doorstep Pickup Time */}
                <div className="p-3.5 bg-m3-surface-container-low rounded-m3-lg border border-m3-outline-variant/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-m3-on-surface font-bold text-xs">
                      <span className="material-symbols-outlined text-[17px] text-m3-primary">event_upcoming</span>
                      <span>Departure Date & Doorstep Pickup Time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono-code ${
                        newCall.travelDate
                          ? 'bg-m3-primary-container text-m3-on-primary-container'
                          : 'bg-m3-surface-container-high text-m3-on-surface-variant'
                      }`}>
                        📅 {newCall.travelDate || 'Departure date pending'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCustomDateTimeInput(!showCustomDateTimeInput)}
                        className="text-[10px] text-m3-primary hover:underline font-semibold"
                      >
                        {showCustomDateTimeInput ? 'Hide custom text' : 'Edit text'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Departure Date: Top Presets + Native Date Picker */}
                    <div>
                      <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-1">
                        1. Departure Date
                      </label>
                      <div className="flex items-center gap-1 mb-1.5">
                        {[
                          { label: 'Today', val: getTodayIso() },
                          { label: 'Tomorrow', val: getTomorrowIso() },
                          { label: 'Day After', val: getDayAfterIso() }
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleUpdateTravelDateTime(preset.val, undefined)}
                            className={`flex-1 py-1 rounded-m3-sm text-[11px] font-bold border transition-all ${
                              Boolean(dateSelection) && dateSelection === preset.val
                                ? 'bg-m3-primary text-white border-m3-primary shadow-xs'
                                : 'bg-white dark:bg-black/40 text-m3-on-surface border-m3-outline-variant hover:bg-m3-surface-container-high'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="date"
                        min={getTodayIso()}
                        value={dateSelection}
                        onChange={(e) => handleUpdateTravelDateTime(e.target.value, undefined)}
                        className="w-full p-2 rounded-m3-sm border border-m3-outline-variant bg-white dark:bg-black/40 font-semibold text-xs text-m3-on-surface"
                      />
                    </div>

                    {/* Doorstep Pickup Time: Top Slots + Native Time Picker */}
                    <div>
                      <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-1">
                        2. Pickup Time (Doorstep Arrival)
                      </label>
                      <div className="flex items-center gap-1 mb-1.5">
                        {[
                          { label: '05:00 AM', val: '05:00' },
                          { label: '06:00 AM', val: '06:00' },
                          { label: '07:00 AM', val: '07:00' },
                          { label: '02:00 PM', val: '14:00' },
                          { label: '08:00 PM', val: '20:00' }
                        ].map((slot) => (
                          <button
                            key={slot.label}
                            type="button"
                            onClick={() => handleUpdateTravelDateTime(undefined, slot.val)}
                            className={`flex-1 py-1 rounded-m3-sm text-[10px] font-bold border transition-all ${
                              Boolean(timeSelection) && timeSelection === slot.val
                                ? 'bg-m3-primary text-white border-m3-primary shadow-xs'
                                : 'bg-white dark:bg-black/40 text-m3-on-surface border-m3-outline-variant hover:bg-m3-surface-container-high'
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="time"
                        value={timeSelection}
                        onChange={(e) => handleUpdateTravelDateTime(undefined, e.target.value)}
                        className="w-full p-2 rounded-m3-sm border border-m3-outline-variant bg-white dark:bg-black/40 font-semibold text-xs text-m3-on-surface font-mono-code"
                      />
                    </div>
                  </div>

                  {showCustomDateTimeInput && (
                    <div className="pt-2 border-t border-m3-outline-variant/50">
                      <label className="block text-[10px] font-medium text-m3-on-surface-variant mb-1">
                        Direct text override (sent in customer WhatsApp quote):
                      </label>
                      <input
                        type="text"
                        value={newCall.travelDate}
                        onChange={(e) => setNewCall({ ...newCall, travelDate: e.target.value })}
                        className="w-full p-2 rounded-m3-md border border-m3-outline-variant bg-white dark:bg-black/40 font-semibold text-xs text-m3-on-surface"
                        placeholder="e.g. Tomorrow @ 06:00 AM"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Adaptive Pricing Dock: 4-Vehicle Fleet (Cabs) OR Chauffeur Duty Card OR Relocation Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-m3-on-surface text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-m3-primary">
                        {callTripMode === 'ACTING_DRIVER' ? 'person' : callTripMode === 'VEHICLE_RELOCATION' ? 'local_shipping' : 'directions_car'}
                      </span>
                      <span>
                        {callTripMode === 'ACTING_DRIVER'
                          ? 'Acting Driver Tariff (Customer Car)'
                          : callTripMode === 'VEHICLE_RELOCATION'
                          ? 'Vehicle Relocation Tariff (Intercity Driveaway)'
                          : 'Select Vehicle (1-Tap All-Inclusive Comparison)'}
                      </span>
                    </label>
                    <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                      {liveVehicleTariffs?.note || 'Fuel, driver bata & toll included'}
                    </span>
                  </div>

                  {/* Adaptive Dock: Acting Driver Duty Card */}
                  {callTripMode === 'ACTING_DRIVER' ? (
                    <div className="p-3.5 bg-m3-surface-container-low rounded-m3-lg border border-orange-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[24px] text-orange-600">person_pin_circle</span>
                          <div>
                            <div className="text-xs font-bold text-m3-on-surface">
                              Professional Chauffeur Duty
                            </div>
                            <div className="text-[11px] text-m3-on-surface-variant font-medium">
                              {liveVehicleTariffs?.dutyLabel || 'Acting Driver Duty'} • {driverCarType}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                          {liveVehicleTariffs?.note}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-xl font-black font-mono-code text-m3-primary">
                            ₹{Number(liveVehicleTariffs?.driverFare || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="block text-[10px] text-m3-on-surface-variant">Estimated Driver Fee</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCall(prev => ({
                              ...prev,
                              vehicle: `Acting Driver (${driverCarType})`,
                              fare: String(liveVehicleTariffs?.driverFare || 0),
                              _autoFare: true
                            }));
                          }}
                          className={`px-3.5 py-2 rounded-m3-md font-bold text-xs transition-all ${
                            newCall.vehicle.includes('Acting Driver')
                              ? 'bg-m3-primary text-white shadow-xs'
                              : 'bg-m3-surface-container-high text-m3-on-surface hover:bg-m3-primary hover:text-white'
                          }`}
                        >
                          {newCall.vehicle.includes('Acting Driver') ? '✓ Rate Selected' : '1-Tap Select Rate'}
                        </button>
                      </div>
                    </div>
                  ) : callTripMode === 'VEHICLE_RELOCATION' ? (
                    /* Adaptive Dock: Vehicle Relocation Card */
                    <div className="p-3.5 bg-m3-surface-container-low rounded-m3-lg border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[24px] text-cyan-600">local_shipping</span>
                          <div>
                            <div className="text-xs font-bold text-m3-on-surface">
                              Intercity Vehicle Driveaway Transit
                            </div>
                            <div className="text-[11px] text-m3-on-surface-variant font-medium">
                              {newCall.drop || relocationDest || 'Destination'} ({liveVehicleTariffs?.distanceKm || 350} km) • {relocationCarType}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                          {liveVehicleTariffs?.note}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-xl font-black font-mono-code text-m3-primary">
                            ₹{Number(liveVehicleTariffs?.relocationFare || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="block text-[10px] text-m3-on-surface-variant">All-Inclusive Relocation Fare</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCall(prev => ({
                              ...prev,
                              vehicle: `Car Relocation (${relocationCarType})`,
                              fare: String(liveVehicleTariffs?.relocationFare || 0),
                              _autoFare: true
                            }));
                          }}
                          className={`px-3.5 py-2 rounded-m3-md font-bold text-xs transition-all ${
                            newCall.vehicle.includes('Car Relocation')
                              ? 'bg-m3-primary text-white shadow-xs'
                              : 'bg-m3-surface-container-high text-m3-on-surface hover:bg-m3-primary hover:text-white'
                          }`}
                        >
                          {newCall.vehicle.includes('Car Relocation') ? '✓ Rate Selected' : '1-Tap Select Rate'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Adaptive Dock: 4 Comparative Fleet Cards for Cabs */
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        {
                          key: 'sedan',
                          name: 'Sedan (Dzire / Etios)',
                          short: 'Sedan',
                          model: 'Swift Dzire / Etios',
                          capacity: '4 Pax • 2 Bags',
                          icon: 'directions_car',
                          fare: liveVehicleTariffs?.sedan,
                          badge: 'Most Popular'
                        },
                        {
                          key: 'suv',
                          name: 'SUV (Ertiga 6+1)',
                          short: 'SUV Ertiga',
                          model: 'Maruti Ertiga',
                          capacity: '6 Pax • 3 Bags',
                          icon: 'airport_shuttle',
                          fare: liveVehicleTariffs?.suv,
                          badge: 'Family Pick'
                        },
                        {
                          key: 'crysta',
                          name: 'Innova Crysta (7+1)',
                          short: 'Innova Crysta',
                          model: 'Toyota Crysta',
                          capacity: '7 Pax • Captain Seats',
                          icon: 'minor_crash',
                          fare: liveVehicleTariffs?.crysta,
                          badge: 'VIP Comfort'
                        },
                        {
                          key: 'tempo',
                          name: 'Tempo Traveller',
                          short: 'Tempo Traveller',
                          model: '12-Seater AC Force',
                          capacity: '12 Pax • AC Highway',
                          icon: 'directions_bus',
                          fare: liveVehicleTariffs?.tempo,
                          badge: 'Group Tour'
                        }
                      ].map((card) => {
                        const isSelected = Boolean(newCall.vehicle) && (newCall.vehicle.includes(card.short) || newCall.vehicle === card.name);
                        return (
                          <div
                            key={card.key}
                            onClick={() => {
                              setNewCall(prev => ({
                                ...prev,
                                vehicle: card.name,
                                fare: card.fare ? String(card.fare) : prev.fare,
                                _autoFare: true
                              }));
                            }}
                            className={`p-2.5 rounded-m3-lg border cursor-pointer transition-all relative flex flex-col justify-between ${
                              isSelected
                                ? 'bg-m3-primary/10 border-m3-primary shadow-xs ring-2 ring-m3-primary/30'
                                : 'bg-m3-surface-container-low border-m3-outline-variant hover:bg-m3-surface-container-high/80'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="material-symbols-outlined text-[20px] text-m3-primary">{card.icon}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isSelected ? 'bg-m3-primary text-white' : 'bg-m3-surface-container-high text-m3-on-surface-variant'
                                }`}>
                                  {card.badge}
                                </span>
                              </div>
                              <div className="font-bold text-xs text-m3-on-surface leading-tight">{card.short}</div>
                              <div className="text-[10px] text-m3-on-surface-variant">{card.capacity}</div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-m3-outline-variant/60 flex items-center justify-between">
                              <span className="text-[13px] font-black font-mono-code text-m3-primary">
                                {card.fare ? `₹${card.fare.toLocaleString('en-IN')}` : '---'}
                              </span>
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-m3-primary text-white flex items-center justify-center text-[10px]">
                                  ✓
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Quoted Fare Input & Full Calculator Link */}
                  <div className="p-2.5 bg-m3-surface-container-low rounded-m3-md border border-m3-outline-variant/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="flex-1 flex items-center gap-2">
                      <label className="font-bold text-m3-on-surface shrink-0">
                        Final Quoted Fare (₹):
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 5800"
                        value={newCall.fare}
                        onChange={(e) => setNewCall({ ...newCall, fare: e.target.value, _autoFare: false })}
                        className="w-36 p-1.5 px-2.5 rounded-m3-sm border border-m3-outline-variant bg-white dark:bg-black/40 font-mono-code font-black text-sm text-m3-primary focus:border-m3-primary"
                      />
                      <span className="text-[10px] text-m3-on-surface-variant font-medium hidden sm:inline">
                        (Editable if customer negotiates)
                      </span>
                    </div>

                    {onOpenPhoneQuoteEngine && (
                      <button
                        type="button"
                        onClick={onOpenPhoneQuoteEngine}
                        className="text-[11px] text-m3-primary hover:underline font-bold flex items-center gap-1 shrink-0 self-end sm:self-center"
                        title="Open detailed multi-city tariff & route engine"
                      >
                        <span className="material-symbols-outlined text-[15px]">calculate</span>
                        <span>Open Full Tariff Engine</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 5. Customer Contact & Lead Source */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-m3-on-surface mb-1">Customer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dhanalakshmi / Ramesh"
                      value={newCall.guestName}
                      onChange={(e) => setNewCall({ ...newCall, guestName: e.target.value })}
                      className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-semibold text-xs text-m3-on-surface"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-m3-on-surface mb-1">Mobile Number (10 Digits)</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 99406 29716"
                      value={newCall.phone}
                      onChange={(e) => setNewCall({ ...newCall, phone: e.target.value })}
                      className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-mono-code font-bold text-xs text-m3-on-surface"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-m3-on-surface mb-1">Enquiry Source</label>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { id: 'Google Ads Call', label: 'Google Ads' },
                        { id: 'Direct Phone Call', label: 'Direct Call' },
                        { id: 'WhatsApp Inquiry', label: 'WhatsApp' },
                        { id: 'Old / Repeat Customer', label: 'Old Client' }
                      ].map((s) => {
                        const isSelected = Boolean(newCall.source) && newCall.source === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setNewCall({ ...newCall, source: s.id })}
                            className={`p-1.5 rounded-m3-sm border text-center font-semibold text-[10px] transition-colors truncate ${
                              isSelected
                                ? 'bg-m3-secondary-container text-m3-on-secondary-container border-m3-secondary font-bold'
                                : 'bg-m3-surface-container-low text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 6. Senior Dispatcher Playbook & Follow-Up Section */}
                <div className="border border-blue-500/30 bg-blue-50/60 dark:bg-blue-950/30 rounded-m3-lg p-2.5">
                  <button
                    type="button"
                    onClick={() => setShowVeteranGuide(!showVeteranGuide)}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-blue-900 dark:text-blue-200"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-blue-600">psychology</span>
                      <span>20-Year Senior Dispatcher Playbook (How to attend & win the customer)</span>
                    </div>
                    <span className="text-[11px] text-blue-700 dark:text-blue-300">
                      {showVeteranGuide ? '▲ Hide Playbook' : '▼ View 5-Step Call Script'}
                    </span>
                  </button>

                  {showVeteranGuide && (
                    <div className="mt-2 pt-2 border-t border-blue-500/20 text-[11px] text-blue-950 dark:text-blue-200 space-y-1.5 leading-relaxed">
                      <p><b>1. Greet with Energy:</b> <i>"Namaskaram sir, Kalidass Travels! Where is your pickup in Chennai and when are you planning to travel?"</i></p>
                      <p><b>2. Drop vs Return:</b> <i>"Sir, is this a one-way highway drop, or will you return with the same cab? If returning, same day or staying overnight?"</i> (This decides if it is One Way vs Round Trip 1-day vs 2-day package).</p>
                      <p><b>3. Recommend Car:</b> <i>"How many pax & bags? 4 pax = Dzire (comfort), 5-6 pax = Ertiga, 7 pax = Innova Crysta."</i></p>
                      <p><b>4. Quote All-Inclusive:</b> <i>"Quote includes fuel, driver bata & highway toll. No hidden surprises or extra demands at the end."</i></p>
                      <p><b>5. Lock the Booking:</b> <i>"Sir, I have sent the quote to your WhatsApp. Kindly pay ₹500 advance via GPay to 8939539211 to lock the car & assign the driver."</i></p>
                    </div>
                  )}
                </div>

                {/* Follow-Up Schedule & Call Remarks */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-m3-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold text-xs">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">alarm</span>
                      <span>Follow-Up Schedule (When to Call Back)</span>
                    </div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">Customer confirmation time</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: 'Today Evening @ 05:00 PM', val: 'Today Evening @ 05:00 PM' },
                      { label: 'Today Night @ 08:00 PM', val: 'Today Night @ 08:00 PM' },
                      { label: 'Tomorrow Morning @ 10:00 AM', val: 'Tomorrow Morning @ 10:00 AM' },
                      { label: 'No Follow-up', val: '' }
                    ].map((preset) => {
                      const isSelected = Boolean(newCall.followUpTime) && newCall.followUpTime === preset.val;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setNewCall(prev => ({
                              ...prev,
                              followUpTime: preset.val,
                              notes: preset.val ? (prev.notes || `Customer will confirm ${preset.val}`) : prev.notes
                            }));
                          }}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                              : 'bg-white/80 dark:bg-black/30 text-amber-900 dark:text-amber-200 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200 mb-0.5">Follow-Up Schedule</label>
                      <input
                        type="text"
                        placeholder="e.g. Today Evening @ 05:00 PM"
                        value={newCall.followUpTime}
                        onChange={(e) => setNewCall({ ...newCall, followUpTime: e.target.value })}
                        className="w-full p-2 rounded-m3-md border border-amber-500/40 bg-white dark:bg-black/40 font-semibold text-xs text-m3-on-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200 mb-0.5">Call Notes / Remarks</label>
                      <input
                        type="text"
                        placeholder="e.g. Quoted ₹5,800 for Balaji Darshan. Will confirm after talking to family."
                        value={newCall.notes}
                        onChange={(e) => setNewCall({ ...newCall, notes: e.target.value })}
                        className="w-full p-2 rounded-m3-md border border-amber-500/40 bg-white dark:bg-black/40 font-semibold text-xs text-m3-on-surface"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pinned Sticky Action Footer (Outside Scroll Container!) */}
              <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-m3-outline-variant/70 bg-m3-surface-container-low flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                <div className="text-[11px] text-m3-on-surface-variant font-medium hidden sm:block">
                  💡 <span className="text-emerald-700 dark:text-emerald-300 font-semibold">1. Save</span> for follow-up, or <span className="text-m3-primary font-semibold">3. Got ₹500 Adv</span> to confirm trip.
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="submit"
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-m3-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    title="Save enquiry and schedule follow-up without opening WhatsApp"
                  >
                    <span className="material-symbols-outlined text-[17px]">bookmark_added</span>
                    <span>1. Save (Follow-Up Scheduled)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCallLead(true)}
                    className="h-10 px-3.5 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-m3-full font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    title="Save enquiry and open WhatsApp to send formal quote"
                  >
                    <span className="material-symbols-outlined text-[17px]">send</span>
                    <span>2. Save & Send WA Quote</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickConfirmBooking}
                    className="h-10 px-4 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-m3-1 transition-all"
                    title="Move immediately to Step 2 Active Trips"
                  >
                    <span className="material-symbols-outlined text-[17px]">verified</span>
                    <span>3. Got ₹500 Adv (Confirm)</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Customer Contact Required to Move Enquiry to Active Trips */}
      {convertModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-2xl shadow-m3-4 w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-m3-outline-variant/70 bg-m3-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">person_check</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-m3-on-surface">Customer Contact Details Required</h3>
                  <p className="text-xs text-m3-on-surface-variant">Name and 10-digit mobile number are required before moving to Active Trips</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalLead(null)}
                className="w-8 h-8 rounded-full hover:bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface-variant font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmLeadConvert} className="p-5 overflow-y-auto space-y-4">
              {/* Lead Summary */}
              <div className="p-3 bg-m3-surface-container-low rounded-m3-lg border border-m3-outline-variant/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono-code font-bold bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant px-2 py-0.5 rounded-full">
                    {convertModalLead.quoteId}
                  </span>
                  <div className="text-xs font-bold text-m3-on-surface mt-1">
                    {convertModalLead.pickup} ➔ {convertModalLead.drop}
                  </div>
                  <div className="text-[11px] text-m3-on-surface-variant">
                    🚗 {convertModalLead.vehicle}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-m3-on-surface font-mono-code">
                    ₹{Number(convertModalLead.estimatedFare || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-m3-on-surface-variant font-semibold">Total Fare</span>
                </div>
              </div>

              {convertError && (
                <div className="p-2.5 bg-m3-error-container text-m3-on-error-container border border-m3-error/20 rounded-m3-md text-xs font-bold flex items-center gap-1.5 animate-shake">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{convertError}</span>
                </div>
              )}

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-m3-on-surface mb-1 flex items-center justify-between">
                  <span>Customer Name <span className="text-m3-error">*</span></span>
                  <span className="text-[10px] text-m3-on-surface-variant font-normal">Real passenger name</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Ramesh Kumar"
                  value={convertForm.guestName}
                  onChange={(e) => {
                    setConvertForm({ ...convertForm, guestName: e.target.value });
                    if (convertError) setConvertError('');
                  }}
                  className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low text-xs font-bold text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                />
              </div>

              {/* 10-digit Phone */}
              <div>
                <label className="block text-xs font-bold text-m3-on-surface mb-1 flex items-center justify-between">
                  <span>Mobile Number <span className="text-m3-error">*</span></span>
                  <span className="text-[10px] text-m3-on-surface-variant font-normal">10 digits starting with 6-9</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-m3-on-surface-variant">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98401 23456"
                    value={convertForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setConvertForm({ ...convertForm, phone: val });
                      if (convertError) setConvertError('');
                    }}
                    className="w-full pl-12 pr-3 py-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low text-xs font-bold text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary font-mono-code"
                  />
                </div>
              </div>

              {/* Schedule & Advance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-m3-on-surface mb-1">
                    Pickup Schedule
                  </label>
                  <input
                    type="text"
                    value={convertForm.travelDateTime}
                    onChange={(e) => setConvertForm({ ...convertForm, travelDateTime: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-white text-xs font-medium text-m3-on-surface"
                    placeholder="e.g. Tomorrow @ 05:00 AM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-m3-on-surface mb-1">
                    Advance Paid (₹)
                  </label>
                  <input
                    type="number"
                    value={convertForm.advancePaid}
                    onChange={(e) => setConvertForm({ ...convertForm, advancePaid: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-white text-xs font-bold text-m3-on-surface font-mono-code"
                    placeholder="500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-m3-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setConvertModalLead(null)}
                  className="px-4 py-2 rounded-full border border-m3-outline-variant text-xs font-bold text-m3-on-surface-variant hover:bg-m3-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-m3-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs font-semibold shadow-m3-1 flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Confirm & Move to Active Trips (Step 2)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Follow-Up / Schedule for Existing Enquiry */}
      {editModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-2xl shadow-m3-4 w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-m3-outline-variant/70 bg-m3-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-m3-on-surface">
                    Edit Follow-Up: {editModalLead.guestName || 'Customer'}
                  </h3>
                  <p className="text-xs text-m3-on-surface-variant">Update call schedule, package duration, or notes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalLead(null)}
                className="w-8 h-8 rounded-full hover:bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface-variant font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditFollowUp} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Lead Summary Info */}
              <div className="p-2.5 rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-m3-on-surface text-xs">
                    📍 {cleanLocationName(editModalLead.pickup)} ➔ {cleanLocationName(editModalLead.drop)}
                  </div>
                  <div className="text-[11px] text-m3-on-surface-variant">
                    🚗 {editModalLead.vehicle}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono-code font-bold text-xs text-m3-on-surface">
                    ₹{Number(editForm.estimatedFare || editModalLead.estimatedFare || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-m3-on-surface-variant">Quoted Fare</span>
                </div>
              </div>

              {/* Package & Fare */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Package / Trip Type</label>
                  <select
                    value={editForm.tripType}
                    onChange={(e) => setEditForm({ ...editForm, tripType: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-bold text-xs text-m3-on-surface focus:border-m3-primary"
                  >
                    {TRIP_TYPE_CATEGORIES.map((cat) => (
                      <optgroup key={cat.group} label={cat.group}>
                        {cat.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Quoted Fare (₹)</label>
                  <input
                    type="number"
                    value={editForm.estimatedFare}
                    onChange={(e) => setEditForm({ ...editForm, estimatedFare: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-bold text-xs text-m3-on-surface font-mono-code"
                  />
                </div>
              </div>

              {/* Travel Date */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-m3-on-surface">Actual Travel Date & Time</label>
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'Today @ 06 PM', val: 'Today @ 06:00 PM' },
                      { label: 'Tomorrow @ 05 AM', val: 'Tomorrow @ 05:00 AM' },
                      { label: 'Tomorrow @ 06 AM', val: 'Tomorrow @ 06:00 AM' }
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, travelDate: p.val })}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface-variant border border-m3-outline-variant/50"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Tomorrow @ 06:00 AM"
                  value={editForm.travelDate}
                  onChange={(e) => setEditForm({ ...editForm, travelDate: e.target.value })}
                  className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-semibold text-xs text-m3-on-surface"
                />
              </div>

              {/* Follow-Up Schedule & Presets */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-m3-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-200 font-bold text-xs">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">alarm</span>
                    <span>Follow-Up Reminder Time</span>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">When to call</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: 'Today Evening @ 05:00 PM', val: 'Today Evening @ 05:00 PM' },
                    { label: 'Today Night @ 08:00 PM', val: 'Today Night @ 08:00 PM' },
                    { label: 'Tomorrow Morning @ 10:00 AM', val: 'Tomorrow Morning @ 10:00 AM' },
                    { label: 'Clear / None', val: '' }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, followUpTime: preset.val })}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                        editForm.followUpTime === preset.val
                          ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                          : 'bg-white/80 dark:bg-black/30 text-amber-900 dark:text-amber-200 border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="e.g. Today Evening @ 05:00 PM"
                    value={editForm.followUpTime}
                    onChange={(e) => setEditForm({ ...editForm, followUpTime: e.target.value })}
                    className="w-full p-2 rounded-m3-md border border-amber-500/40 bg-white dark:bg-black/40 font-semibold text-xs text-m3-on-surface"
                  />
                </div>
              </div>

              {/* Call Notes / Remarks */}
              <div>
                <label className="block font-bold text-m3-on-surface mb-1">Call Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Customer will confirm in evening. Prefers AC sedan with polite driver."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low text-xs text-m3-on-surface font-medium resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-m3-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setEditModalLead(null)}
                  className="px-4 py-2 rounded-full border border-m3-outline-variant text-xs font-bold text-m3-on-surface-variant hover:bg-m3-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-m3-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs font-bold shadow-m3-1 flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Update Enquiry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
