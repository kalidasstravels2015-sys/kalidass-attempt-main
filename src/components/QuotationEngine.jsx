import React, { useState, useEffect, useRef } from 'react';
import { Car, Calendar, Send, ArrowRight, Repeat, Users, User, AlertCircle, Info, Navigation, ShieldCheck, Clock, X, ChevronDown, ChevronRight, CheckCircle2, Plane, ArrowUpDown, MapPin, Phone, Receipt, Edit2 } from 'lucide-react';
import { trackEvent, trackCalculatorQuote, markQuoteConverted } from '../lib/analytics';
import LocationPicker from './LocationPicker';
import WhatsAppIcon from './react/WhatsAppIcon.jsx';
import WhatsAppButton from './react/WhatsAppButton.jsx';
import { buildWhatsAppUrl, buildMapsLinks } from '../utils/whatsapp';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import { loadGoogleMaps } from '../lib/googleMapsLoader';
import { getActiveGoogleSheetUrl } from '../config/googleSheets';
import { getNextQuotationId, peekNextQuotationId } from '../utils/sequenceGenerator';
import siteContent from '../data/siteContent.json';

import tariffConfig from '../data/tariff_config.json';
import tnBusFares from '../data/tnBusFares.json';
import tripsData from '../data/trips.json';

const vehicles = tariffConfig.vehicles;
const vehicleOptions = Object.keys(vehicles);

// ─── Dedicated Tempo Traveller Fleet for tempo-only mode ───────────────────
const TEMPO_VEHICLES = {
  '12-Seater Luxury Force Tempo': {
    name: '12-Seater Luxury Force Tempo',
    shortName: '12-Seater',
    round_trip_rate: 24,
    one_way_rate: 26,
    min_km_per_day: 300,
    driver_bata: 800,
    min_drop_km: 250,
    local_4hr_pkg: 3500,
    local_5hr_pkg: 3800,
    local_8hr_pkg: 5500,
    local_10hr_pkg: 6500,
    local_12hr_pkg: 7000,
    extra_km_rate: 24,
    extra_hr_rate: 350,
  },
  '14-Seater Executive Force Tempo': {
    name: '14-Seater Executive Force Tempo',
    shortName: '14-Seater',
    round_trip_rate: 25,
    one_way_rate: 27,
    min_km_per_day: 300,
    driver_bata: 800,
    min_drop_km: 250,
    local_4hr_pkg: 3800,
    local_5hr_pkg: 4200,
    local_8hr_pkg: 5800,
    local_10hr_pkg: 6800,
    local_12hr_pkg: 7500,
    extra_km_rate: 25,
    extra_hr_rate: 400,
  },
  '17-Seater Executive Force Tempo': {
    name: '17-Seater Executive Force Tempo',
    shortName: '17-Seater',
    round_trip_rate: 26,
    one_way_rate: 29,
    min_km_per_day: 300,
    driver_bata: 800,
    min_drop_km: 250,
    local_4hr_pkg: 4200,
    local_5hr_pkg: 4500,
    local_8hr_pkg: 6200,
    local_10hr_pkg: 7200,
    local_12hr_pkg: 8000,
    extra_km_rate: 26,
    extra_hr_rate: 400,
  },
  '20-Seater Grand Force Tempo': {
    name: '20-Seater Grand Force Tempo',
    shortName: '20-Seater',
    round_trip_rate: 30,
    one_way_rate: 33,
    min_km_per_day: 300,
    driver_bata: 900,
    min_drop_km: 250,
    local_4hr_pkg: 4800,
    local_5hr_pkg: 5500,
    local_8hr_pkg: 7500,
    local_10hr_pkg: 8500,
    local_12hr_pkg: 9500,
    extra_km_rate: 30,
    extra_hr_rate: 500,
  },
  '26-Seater Mini Bus / Force Tempo': {
    name: '26-Seater Mini Bus / Force Tempo',
    shortName: '26-Seater Mini Bus',
    round_trip_rate: 36,
    one_way_rate: 40,
    min_km_per_day: 350,
    driver_bata: 1000,
    min_drop_km: 300,
    local_4hr_pkg: 6000,
    local_5hr_pkg: 7000,
    local_8hr_pkg: 9000,
    local_10hr_pkg: 10500,
    local_12hr_pkg: 12000,
    extra_km_rate: 36,
    extra_hr_rate: 600,
  },
  'Force Urbania VIP Luxury': {
    name: 'Force Urbania VIP Luxury Van',
    shortName: 'Urbania VIP',
    round_trip_rate: 38,
    one_way_rate: 42,
    min_km_per_day: 300,
    driver_bata: 1100,
    min_drop_km: 250,
    local_4hr_pkg: 5000,
    local_5hr_pkg: 6000,
    local_8hr_pkg: 9500,
    local_10hr_pkg: 11000,
    local_12hr_pkg: 13000,
    extra_km_rate: 38,
    extra_hr_rate: 600,
  }
};

const TEMPO_VEHICLE_CAPACITY = {
  '12-Seater Luxury Force Tempo': 12,
  '14-Seater Executive Force Tempo': 14,
  '17-Seater Executive Force Tempo': 17,
  '20-Seater Grand Force Tempo': 20,
  '26-Seater Mini Bus / Force Tempo': 26,
  'Force Urbania VIP Luxury': 12,
};

const TEMPO_COMPARISON_VEHICLES = [
  {
    key: '12-Seater Luxury Force Tempo',
    name: '12-Seater',
    models: '12S Force Tempo',
    pax: '12 Pax',
    maxPax: 12,
    bags: '3–4 Trolleys',
    tag: 'Most Popular'
  },
  {
    key: '14-Seater Executive Force Tempo',
    name: '14-Seater',
    models: '14S Medium WB',
    pax: '14 Pax',
    maxPax: 14,
    bags: '5–6 Trolleys',
    tag: 'Extra Boot'
  },
  {
    key: '17-Seater Executive Force Tempo',
    name: '17-Seater',
    models: '17S 4020 WB',
    pax: '17 Pax',
    maxPax: 17,
    bags: '6–7 Trolleys',
    tag: 'Pilgrims & Teams'
  },
  {
    key: '20-Seater Grand Force Tempo',
    name: '20-Seater',
    models: '20S High Roof',
    pax: '20 Pax',
    maxPax: 20,
    bags: '7–8 Trolleys',
    tag: 'Family Marriages'
  },
  {
    key: '26-Seater Mini Bus / Force Tempo',
    name: '26-Seater',
    models: '26S Mini Bus',
    pax: '26 Pax',
    maxPax: 26,
    bags: '10–12 Bags',
    tag: 'Large Delegations'
  },
  {
    key: 'Force Urbania VIP Luxury',
    name: 'Urbania VIP',
    models: 'Force Urbania',
    pax: '12 Pax',
    maxPax: 12,
    bags: '6–8 Trolleys',
    tag: 'VIP Luxury'
  }
];

const TEMPO_PASSENGER_OPTIONS = [
  { value: '8', label: '8 Passengers' },
  { value: '9', label: '9 Passengers' },
  { value: '10', label: '10 Passengers' },
  { value: '11', label: '11 Passengers' },
  { value: '12', label: '12 Passengers (12-Seater / Urbania)' },
  { value: '13', label: '13 Passengers' },
  { value: '14', label: '14 Passengers (14-Seater)' },
  { value: '15', label: '15 Passengers' },
  { value: '16', label: '16 Passengers' },
  { value: '17', label: '17 Passengers (17-Seater)' },
  { value: '18', label: '18 Passengers' },
  { value: '20', label: '20 Passengers (20-Seater)' },
  { value: '25', label: '25 Passengers (26-Seater Mini Bus)' },
  { value: '26', label: '26+ Passengers' }
];

// ─── Passenger ↔ Vehicle capacity rules ───────────────────────────────────
// max passengers (excluding driver) each vehicle can carry
const VEHICLE_CAPACITY = {
  'Swift Dzire':     4,
  'Toyota Etios':    4,
  'Maruti Ertiga':   6,
  'Innova':          6,
  'Innova Crysta':   7,
  'Tempo Traveller': 12,
};

// Multi-cab comparison options inspired by Savaari/Uber for 1-tap route comparisons
const COMPARISON_VEHICLES = [
  {
    key: 'Swift Dzire',
    name: 'Sedan',
    models: 'Dzire / Etios',
    pax: '4 Pax',
    maxPax: 4,
    bags: '2 Bags',
    tag: 'Best Value'
  },
  {
    key: 'Maruti Ertiga',
    name: 'Ertiga',
    models: 'Ertiga AC',
    pax: '6 Pax',
    maxPax: 6,
    bags: '3 Bags',
    tag: 'Most Popular'
  },
  {
    key: 'Innova Crysta',
    name: 'Innova',
    models: 'Innova Crysta',
    pax: '7 Pax',
    maxPax: 7,
    bags: '4 Bags',
    tag: 'Premium'
  },
  {
    key: 'Tempo Traveller',
    name: 'Tempo',
    models: 'Tempo 12-Seater',
    pax: '12 Pax',
    maxPax: 12,
    bags: '8 Bags',
    tag: 'Group'
  }
];

// Individual Passenger Options (1 Passenger, 2 Passengers, etc.)
const PASSENGER_OPTIONS = [
  { value: '1', label: '1 Passenger' },
  { value: '2', label: '2 Passengers' },
  { value: '3', label: '3 Passengers' },
  { value: '4', label: '4 Passengers (Sedan)' },
  { value: '5', label: '5 Passengers' },
  { value: '6', label: '6 Passengers (Ertiga)' },
  { value: '7', label: '7 Passengers (Innova)' },
  { value: '8', label: '8 Passengers' },
  { value: '9', label: '9 Passengers' },
  { value: '10', label: '10 Passengers' },
  { value: '11', label: '11 Passengers' },
  { value: '12', label: '12 Passengers (Tempo)' },
  { value: '13', label: '13+ Passengers' }
];

// Tab configuration: Round Trip, One Way, and Local Package
const TAB_CONFIG = {
  round: {
    titleEn: 'Round Trip',
    titleTa: 'இரு வழி',
    subEn: 'Return With Same Cab',
    subTa: 'அதே வண்டியில் திரும்புதல்',
  },
  oneway: {
    titleEn: 'One Way',
    titleTa: 'ஒரு வழி',
    subEn: 'Point to Point Drop',
    subTa: 'ஒரு வழி பயணம்',
  },
  local: {
    titleEn: 'Local Package',
    titleTa: 'லோக்கல் பேக்கேஜ்',
    subEn: 'Hourly Rental',
    subTa: 'மணிநேர வாடகை',
  }
};

// Min selectable datetime (current time)
const getMinDateTime = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Default departure time (next day morning 6:00 AM)
const getDefaultDepartureTime = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(6, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Default return time (tomorrow 9:00 PM for standard same-day return = 1 day)
const getDefaultReturnTime = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(21, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Calculate billing days from pickup and return strings
// Standard Rule: Up to 24 hours = 1 Day (250 km standard coverage).
// If duration exceeds 24 hours, duration above 24 hours is billed extra.
const calculateCalendarDays = (pickupStr, returnStr) => {
  if (!pickupStr || !returnStr) return 1;
  const p = new Date(pickupStr);
  const r = new Date(returnStr);
  if (isNaN(p.getTime()) || isNaN(r.getTime())) return 1;
  if (r <= p) return 1;
  const diffHours = (r.getTime() - p.getTime()) / (1000 * 60 * 60);
  if (diffHours <= 24) return 1;
  return Math.max(1, Math.ceil(diffHours / 24));
};

// Parse driving duration in hours from duration string or distance km
const parseDrivingHours = (durationStr, distanceKm) => {
  if (durationStr && typeof durationStr === 'string') {
    const hourMatch = durationStr.match(/(\d+(\.\d+)?)\s*(?:hour|hr|h)/i);
    const minMatch = durationStr.match(/(\d+)\s*(?:minute|min|m)/i);
    if (hourMatch) {
      const hrs = parseFloat(hourMatch[1]);
      const mins = minMatch ? parseInt(minMatch[1], 10) / 60 : 0;
      return hrs + mins;
    }
  }
  if (distanceKm && distanceKm > 0) {
    // Average South India highway speed ~52 km/h accounting for tolls & city transit
    return Math.max(1, Math.round((distanceKm / 52) * 10) / 10);
  }
  return 1;
};

// Calculate minimum realistic duration, days, and safety feasibility for outstation trips
const getTripDrivingRequirements = (oneWayKm, isRoundTrip, durationStr) => {
  if (!oneWayKm || oneWayKm <= 0) {
    return {
      oneWayHours: 1,
      totalDrivingHours: 1,
      minRealisticHours: 4,
      minDays: 1,
      isSameDayFeasible: true,
      recommendedDays: 1,
      drivingText: ''
    };
  }

  const oneWayHours = parseDrivingHours(durationStr, oneWayKm);
  const totalDrivingHours = isRoundTrip ? Math.round(oneWayHours * 2 * 10) / 10 : oneWayHours;
  const totalKm = isRoundTrip ? oneWayKm * 2 : oneWayKm;

  if (!isRoundTrip) {
    return {
      oneWayHours,
      totalDrivingHours: oneWayHours,
      minRealisticHours: Math.ceil(oneWayHours),
      minDays: 1,
      isSameDayFeasible: true,
      recommendedDays: 1,
      drivingText: `~${Math.round(oneWayHours)} hrs drive`
    };
  }

  // Round Trip Commercial Driving Rules:
  // Same-day return is feasible ONLY IF round trip <= 380 km AND driving <= 9.5 hrs.
  // Beyond that, highway fatigue and commercial safety require 2+ calendar days.
  const isSameDayFeasible = totalDrivingHours <= 9.5 && totalKm <= 380;

  // Minimum calendar days:
  let minDays = 1;
  if (totalKm > 1000 || totalDrivingHours > 20) {
    minDays = 3; // e.g. Kanyakumari (1,416 km), Munnar (1,160 km), Ooty (1,110 km)
  } else if (!isSameDayFeasible || totalKm > 360 || totalDrivingHours > 9.5) {
    minDays = 2; // e.g. Madurai (924 km), Trichy (664 km), Coimbatore (1,010 km), Bangalore (692 km)
  } else {
    minDays = 1; // e.g. Pondicherry (302 km), Tirupati (270 km), Vellore (274 km), Kanchipuram (150 km)
  }

  // Realistic hours window: driving time + essential halts/visit buffer (min 3-10 hrs)
  let minRealisticHours = isSameDayFeasible 
    ? Math.max(8, Math.ceil(totalDrivingHours + 3))
    : Math.max(24, Math.ceil(totalDrivingHours + 10));

  if (minDays > 1) {
    minRealisticHours = Math.max(minRealisticHours, (minDays - 1) * 24 + Math.ceil(oneWayHours));
  }

  const recommendedDays = Math.max(minDays, Math.ceil(totalKm / 300));
  const drivingText = `~${Math.round(totalDrivingHours)} hrs driving (~${Math.round(oneWayHours)} hrs/way)`;

  return {
    oneWayHours,
    totalDrivingHours,
    minRealisticHours,
    minDays,
    isSameDayFeasible,
    recommendedDays,
    drivingText
  };
};

const getMinReturnDateTime = (pickupVal, minHours) => {
  if (!pickupVal) return '';
  const d = new Date(pickupVal);
  if (isNaN(d.getTime())) return '';
  const totalMinutes = Math.round((minHours || 4) * 60);
  d.setMinutes(d.getMinutes() + totalMinutes);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatScheduleDateTime = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getEstimatedArrival = (pickupVal, drivingHours) => {
  if (!pickupVal) return '';
  const d = new Date(pickupVal);
  if (isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() + Math.round(drivingHours * 60));
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};


// South India distance lookup table for fast reliable fallback
const COMMON_DISTANCES_FROM_CHENNAI = {
  'chennai': 0,
  'pondicherry': 151,
  'puducherry': 151,
  'karaikal': 295,
  'thiruvettakudy': 285,
  'nitpy': 285,
  'thirunallar': 295,
  'mayiladuthurai': 255,
  'sirkazhi': 235,
  'tharangambadi': 285,
  'nagore': 305,
  'auroville': 150,
  'bangalore': 346,
  'bengaluru': 346,
  'tirupati': 135,
  'vellore': 137,
  'kanchipuram': 75,
  'mahabalipuram': 56,
  'mamallapuram': 56,
  'trichy': 332,
  'tiruchirappalli': 332,
  'madurai': 462,
  'coimbatore': 505,
  'salem': 340,
  'thanjavur': 342,
  'tirunelveli': 624,
  'kanyakumari': 708,
  'rameshwaram': 575,
  'kodaikanal': 530,
  'ooty': 555,
  'munnar': 580,
  'mysore': 480,
  'mysuru': 480,
  'tiruvannamalai': 195,
  'thiruvannamalai': 195,
  'chidambaram': 215,
  'kumbakonam': 298,
  'nagapattinam': 315,
  'velankanni': 325,
  'yelagiri': 230,
  'yercaud': 365,
  'hosur': 305,
  'krishnagiri': 260,
  'dharmapuri': 300,
  'erode': 395,
  'tirupur': 460,
  'dindigul': 420,
  'karur': 375,
  'neyveli': 215,
  'cuddalore': 180,
  'villupuram': 165,
  'chengalpattu': 55,
  'tambaram': 30,
  'sriperumbudur': 45,
  'arakkonam': 70,
  'tiruttani': 85,
  'srikalahasti': 115,
  'vijayawada': 450,
  'nellore': 175,
  'hyderabad': 630
};

const CHENNAI_FORMS = [
  'chennai', 'airport', 'tambaram', 'guindy', 'koyambedu', 'egmore', 'central',
  'pallavaram', 'velachery', 'porur', 'annanagar', 'anna nagar', 't nagar', 't. nagar',
  'sholinganallur', 'omr', 'ecr', 'perungudi', 'thiruvanmiyur', 'adyar', 'mylapore',
  'chromepet', 'medavakkam', 'madipakkam', 'alandur', 'vadapalani', 'ambattur', 'avadi',
  'poonamallee', 'kolathur', 'redhills', 'kilpauk', 'nungambakkam', 'triplicane', 'royapettah',
  'besant nagar', 'besantnagar', 'siruseri', 'navalur'
];

const findKnownDistance = (origin, destination) => {
  const o = (origin || '').toLowerCase().trim();
  const d = (destination || '').toLowerCase().trim();
  if (!o || !d) return null;

  // Puducherry UT contains 4 disconnected enclaves:
  // 1) Puducherry town (~151 km)
  // 2) Karaikal enclave (Thiruvettakudy, NITPY, Thirunallar, pincode 609xxx) -> ~280-295 km!
  // 3) Yanam (~650 km), 4) Mahe (~650 km)
  const isKaraikalEnclave = (str) => {
    return str.includes('karaikal') || 
           str.includes('thiruvettakudy') || 
           str.includes('thirunallar') || 
           str.includes('nitpy') || 
           str.includes('nedungadu') || 
           str.includes('kottucherry') || 
           str.includes('neravy') || 
           str.includes('tr pattinam') ||
           /609\d{3}/.test(str);
  };

  const isOChennai = CHENNAI_FORMS.some(k => o.includes(k));
  const isDChennai = CHENNAI_FORMS.some(k => d.includes(k));

  // Both pickup and drop are within Chennai (intra-city)
  if (isOChennai && isDChennai) {
    return {
      distance: 19,
      duration: '45 mins (Est)'
    };
  }

  if (isOChennai || isDChennai) {
    const target = isOChennai ? d : o;
    if (isKaraikalEnclave(target)) {
      return {
        distance: 285,
        duration: '5.5 - 6 hrs (Est)'
      };
    }
    if (target.includes('yanam') || target.includes('mahe')) {
      return {
        distance: 650,
        duration: '12 - 14 hrs (Est)'
      };
    }
  }

  // 1. Check tnBusFares table
  const matches = tnBusFares.filter(r => 
    (o.includes(r.source) && d.includes(r.destination)) ||
    (o.includes(r.destination) && d.includes(r.source))
  );

  if (matches.length > 0) {
    const target = isOChennai ? d : (isDChennai ? o : d);
    let best = matches[0];
    if (isKaraikalEnclave(target)) {
      const kMatch = matches.find(m => m.destination === 'karaikal' || m.destination === 'thiruvettakudy' || m.destination === 'nitpy');
      best = kMatch || { distanceKm: 285, destination: 'karaikal' };
    } else {
      // Prioritize most specific destination (avoid matching broad 'puducherry' if target is another town)
      best = matches.reduce((longest, curr) => 
        (curr.destination.length > longest.destination.length ? curr : longest), matches[0]
      );
    }

    const km = best.distanceKm;
    return {
      distance: km,
      duration: `${Math.max(1, Math.round(km / 50))} hrs (Est)`
    };
  }

  // 2. Check trips.json
  const trip = tripsData.find(t => {
    const key = t.title.toLowerCase().split(' ')[0];
    return o.includes(key) || d.includes(key);
  });
  if (trip && trip.kmOneWay) {
    return {
      distance: trip.kmOneWay,
      duration: trip.duration || `${Math.max(1, Math.round(trip.kmOneWay / 50))} hrs`
    };
  }

  // 3. Check COMMON_DISTANCES_FROM_CHENNAI
  if (isOChennai || isDChennai) {
    const other = isOChennai ? d : o;
    if (isKaraikalEnclave(other)) {
      return {
        distance: 285,
        duration: '5.5 - 6 hrs (Est)'
      };
    }
    for (const [city, km] of Object.entries(COMMON_DISTANCES_FROM_CHENNAI)) {
      if (other.includes(city)) {
        if ((city === 'pondicherry' || city === 'puducherry') && isKaraikalEnclave(other)) {
          continue;
        }
        return {
          distance: km,
          duration: `${Math.max(1, Math.round(km / 50))} hrs (Est)`
        };
      }
    }
  }

  return null;
};

// Intelligent estimation of road tolls, interstate border permits, and driver night stay
const estimateRoadExtras = (pickup, drop, distanceKm, days, isRoundTrip) => {
  const p = (pickup || '').toLowerCase();
  const d = (drop || '').toLowerCase();
  const text = `${p} ${d}`;
  const totalKm = isRoundTrip ? (distanceKm || 0) * 2 : (distanceKm || 0);
  const nights = isRoundTrip ? Math.max(0, (days || 1) - 1) : 0;
  
  let stateName = 'Tamil Nadu';
  let statePermitEst = 0;
  let tollsEst = 0;

  // Detect interstate routes
  if (text.includes('tirupati') || text.includes('tirumala') || text.includes('andhra') || text.includes('kalahasti') || text.includes('nellore') || text.includes('vijayawada') || text.includes('chittoor') || text.includes('renigunta')) {
    stateName = 'Andhra Pradesh';
    statePermitEst = 500;
    tollsEst = isRoundTrip ? 400 : 220;
  } else if (text.includes('bangalore') || text.includes('bengaluru') || text.includes('karnataka') || text.includes('mysore') || text.includes('mysuru') || text.includes('hosur')) {
    stateName = 'Karnataka';
    statePermitEst = 700;
    tollsEst = isRoundTrip ? 450 : 250;
  } else if (text.includes('pondicherry') || text.includes('puducherry') || text.includes('auroville')) {
    stateName = 'Puducherry (UT)';
    statePermitEst = 0; // No border tax for Puducherry commercial cabs from TN
    tollsEst = isRoundTrip ? 250 : 130;
  } else if (text.includes('kerala') || text.includes('munnar') || text.includes('cochin') || text.includes('kochi') || text.includes('sabarimala') || text.includes('wayanad')) {
    stateName = 'Kerala';
    statePermitEst = 800;
    tollsEst = isRoundTrip ? 650 : 350;
  } else {
    // Within Tamil Nadu (Madurai, Trichy, Coimbatore, Salem, Ooty, Kodaikanal, etc.)
    stateName = 'Tamil Nadu';
    statePermitEst = 0;
    tollsEst = Math.round((totalKm * 0.85) / 10) * 10;
    if (tollsEst < 80 && totalKm >= 50) tollsEst = 80;
  }

  // Driver Night Stay Allowance (~₹450/night for driver room/dinner, waived if guest provides room)
  const driverNightStayEst = nights * 450;
  const roadExtrasEst = tollsEst + statePermitEst + driverNightStayEst;

  return {
    stateName,
    statePermitEst,
    tollsEst,
    nights,
    driverNightStayEst,
    roadExtrasEst
  };
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Remove potential XSS characters while keeping normal address characters
  return input.replace(/[<>"'`]/g, "").trim().slice(0, 100);
};

const ERROR_MSGS = {
  active: { en: "Too many attempts. Try again later.", ta: "அதிக முயற்சிகள். பின்னர் முயற்சிக்கவும்." },
  name: { en: "Name: 2-50 letters only", ta: "பெயர்: 2-50 எழுத்துக்கள் மட்டும்" },
  phone: { en: "Invalid Indian mobile number", ta: "தவறான மொபைல் எண்" },
  locations: { en: "Enter valid pickup & drop locations", ta: "சரியான இடங்களை உள்ளிடவும்" },
  date: { en: "Date must be in future", ta: "தேதி எதிர்காலத்தில் இருக்க வேண்டும்" },
};
// Helper to detect if a route involves Chennai Airport
const isAirportRoute = (orig, dest) => {
  const o = (orig || '').toLowerCase();
  const d = (dest || '').toLowerCase();
  const kw = ['airport', 'terminal', 'maa', 'meenambakkam', 'chennai airport', 'kamraj domestic', 'anna international'];
  return kw.some(k => o.includes(k) || d.includes(k));
};

// Fixed flat tariff benchmark for Chennai Airport Transfers
const getAirportTransferEstimate = (locText, vehKey = '') => {
  const t = (locText || '').toLowerCase();
  let baseSedan = 650;
  if (t.includes('omr') || t.includes('sholinganallur') || t.includes('siruseri') || t.includes('navalur')) {
    baseSedan = 1250;
  } else if (t.includes('ecr') || t.includes('mahabalipuram') || t.includes('kovalam') || t.includes('thiruvanmiyur')) {
    baseSedan = 1650;
  } else if (t.includes('central') || t.includes('t nagar') || t.includes('t. nagar') || t.includes('anna nagar') || t.includes('egmore') || t.includes('mylapore') || t.includes('besant nagar')) {
    baseSedan = 950;
  } else if (t.includes('ambattur') || t.includes('avadi') || t.includes('madhavaram')) {
    baseSedan = 1150;
  }
  
  const v = vehKey || '';
  if (v.includes('Ertiga')) return Math.round(baseSedan * 1.5 / 50) * 50;
  if (v.includes('Innova Crysta')) return Math.round(baseSedan * 2.0 / 50) * 50;
  if (v.includes('Innova')) return Math.round(baseSedan * 1.8 / 50) * 50;
  if (v.includes('Tempo') || v.includes('Urbania')) return Math.max(2400, Math.round(baseSedan * 2.8 / 50) * 50);
  return baseSedan;
};

/**
 * @param {Object} props
 * @param {string} [props.currentLang]
 * @param {boolean} [props.showAirportTab]
 * @param {boolean} [props.showBookingButton]
 * @param {boolean} [props.showHeader]
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @param {any} [props.headerIcon]
 * @param {string} [props.variant]
 * @param {string} [props.initialTab]
 * @param {any} [props.allowedTabs]
 * @param {string} [props.initialPickup]
 * @param {string} [props.initialDrop]
 * @param {boolean} [props.autoCalculate]
 */
export default function QuotationEngine({ 
  currentLang = 'en', 
  showAirportTab = true, 
  showBookingButton = true, 
  showHeader = true,
  title = '', 
  subtitle = '',
  headerIcon = null,
  variant = "default",
  initialTab = 'round',
  allowedTabs = null,
  initialPickup = '',
  initialDrop = '',
  initialReturnDate = '',
  autoCalculate = false,
  isOperatorMode = false,
  operatorCallerPhone = '',
  operatorCallerName = '',
  onQuoteCalculated = null,
  tempoOnly = false,
  initialVehicle = '',
  initialPassengers = ''
}) {
  const isTa = currentLang === 'ta';
  const labels = siteContent.ui_labels;
  const displayTitle = title || (tempoOnly ? (isTa ? 'டெம்போ டிராவலர் வாடகை முன்பதிவு' : 'Tempo Traveller Rental Quotation') : (isTa ? labels.book_your_ride_ta : labels.book_your_ride));
  const displaySubtitle = subtitle || (tempoOnly ? (isTa ? '12 முதல் 26 இருக்கை மற்றும் அர்பானியா சொகுசு வேன்கள்' : 'Instant Outstation & Local Estimates • 12 to 26-Seater Force AC & Urbania') : '');

  const activeVehicles = tempoOnly ? TEMPO_VEHICLES : vehicles;
  const activeVehicleOptions = Object.keys(activeVehicles);
  const activeVehicleCapacity = tempoOnly ? TEMPO_VEHICLE_CAPACITY : VEHICLE_CAPACITY;
  const activeComparisonVehicles = tempoOnly ? TEMPO_COMPARISON_VEHICLES : COMPARISON_VEHICLES;
  const activePassengerOptions = tempoOnly ? TEMPO_PASSENGER_OPTIONS : PASSENGER_OPTIONS;

  const defaultVehicle = initialVehicle || (tempoOnly ? '12-Seater Luxury Force Tempo' : 'Swift Dzire');
  const defaultPax = initialPassengers || (tempoOnly ? '12' : '4');

  const { scrollInputAboveKeyboard } = useVirtualKeyboard();

  const visibleTabs = allowedTabs && allowedTabs.length > 0
    ? allowedTabs
    : ['round', 'local'];

  const safeInitialTab = visibleTabs.includes(initialTab) ? initialTab : (visibleTabs[0] || 'round');
  const [activeTab, setActiveTab] = useState(safeInitialTab);
  const [localPackage, setLocalPackage] = useState(tempoOnly ? '10hr100km' : '8hr80km');
  const [vehicle, setVehicle] = useState(defaultVehicle);
  const [passengers, setPassengers] = useState(defaultPax);
  const [pickup, setPickup] = useState(() => initialPickup || '');
  const [drop, setDrop] = useState(() => initialDrop || (safeInitialTab === 'local' ? 'Local Sightseeing (Chennai City)' : ''));
  
  const destLower = (drop || initialDrop || '').toLowerCase();
  const origLower = (pickup || initialPickup || '').toLowerCase();
  const isAuto = Boolean(autoCalculate);

  const [distance, setDistance] = useState(() => {
    if (initialPickup && initialDrop) {
      const known = findKnownDistance(initialPickup, initialDrop);
      if (known) return known.distance;
    }
    if (autoCalculate) return 135;
    return null;
  });
  const [duration, setDuration] = useState(() => {
    if (initialPickup && initialDrop) {
      const known = findKnownDistance(initialPickup, initialDrop);
      if (known) return known.duration;
    }
    if (autoCalculate) return '3.5 - 4 hrs';
    return null;
  });
  const [estimate, setEstimate] = useState(0);

  const [airportDetected, setAirportDetected] = useState(false);
  const [cityAutoRouted, setCityAutoRouted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(1);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdown, setBreakdown] = useState(null);

  // Customer Details & Validation
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [date, setDate] = useState(() => getDefaultDepartureTime());
  const [returnDate, setReturnDate] = useState(() => initialReturnDate || '');
  const [returnClampedNotice, setReturnClampedNotice] = useState(false);
  const [showResult, setShowResult] = useState(() => {
    return Boolean(autoCalculate || (initialPickup && initialDrop));
  });
  const [errors, setErrors] = useState({});
  const [botField, setBotField] = useState(''); // Honeypot
  const [gettingLocation, setGettingLocation] = useState(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [pickerField, setPickerField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [requestedDriver, setRequestedDriver] = useState('');
  const [quoteRefId, setQuoteRefId] = useState(() => (typeof window !== 'undefined' ? peekNextQuotationId() : '#QT-101'));
  const [vehicleHighlighted, setVehicleHighlighted] = useState(false);
  const stableFormId = "booking-form-v1"; // Using stable ID for hydration safety
  const hasCalculatedResult = Boolean(showResult && estimate > 0 && pickup && (drop || activeTab === 'local'));

  // Handle external vehicle selection from URL query parameters and custom events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const matchVehicle = (query) => {
      if (!query) return null;
      const q = String(query).toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const opt of activeVehicleOptions) {
        const cleanOpt = opt.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanOpt === q || cleanOpt.includes(q) || q.includes(cleanOpt)) {
          return opt;
        }
      }
      if (q.includes('dzire') || q.includes('sedan') || q.includes('etios')) {
        return activeVehicleOptions.find(o => /dzire|etios|sedan/i.test(o)) || activeVehicleOptions[0];
      }
      if (q.includes('ertiga')) {
        return activeVehicleOptions.find(o => /ertiga/i.test(o)) || null;
      }
      if (q.includes('crysta')) {
        return activeVehicleOptions.find(o => /crysta/i.test(o)) || null;
      }
      if (q.includes('innova')) {
        return activeVehicleOptions.find(o => /innova/i.test(o)) || null;
      }
      if (q.includes('tempo') || q.includes('traveller')) {
        return activeVehicleOptions.find(o => /tempo|traveller/i.test(o)) || null;
      }
      if (q.includes('urbania')) {
        return activeVehicleOptions.find(o => /urbania/i.test(o)) || null;
      }
      return null;
    };

    const applySelection = (vehQuery, tabQuery) => {
      if (vehQuery) {
        const matched = matchVehicle(vehQuery);
        if (matched) {
          setVehicle(matched);
          const cap = activeVehicleCapacity[matched] || 4;
          setPassengers(String(cap));
          setVehicleHighlighted(true);
          setTimeout(() => setVehicleHighlighted(false), 2000);
        }
      }
      if (tabQuery && visibleTabs.includes(tabQuery)) {
        setActiveTab(tabQuery);
      }
    };

    // 1. Initial URL Params check
    try {
      const params = new URLSearchParams(window.location.search);
      const vParam = params.get('vehicle');
      const tabParam = params.get('tab');
      if (vParam || tabParam) {
        applySelection(vParam, tabParam);
      }
      const pickupParam = params.get('pickup');
      if (pickupParam) setPickup(pickupParam);
      const dropParam = params.get('drop');
      if (dropParam) setDrop(dropParam);
    } catch (_) {}

    // 2. Custom Events from external card buttons
    const handleSelectVehicle = (e) => {
      if (e?.detail?.vehicle) {
        applySelection(e.detail.vehicle, e.detail.tab);
      }
    };

    const handleSelectPackage = (e) => {
      if (e?.detail) {
        if (e.detail.vehicle) applySelection(e.detail.vehicle, e.detail.tab || 'round');
        if (e.detail.destination) setDrop(e.detail.destination);
        if (e.detail.days) setDays(parseInt(e.detail.days, 10) || 1);
      }
    };

    window.addEventListener('select-quote-vehicle', handleSelectVehicle);
    window.addEventListener('select-quote-package', handleSelectPackage);
    return () => {
      window.removeEventListener('select-quote-vehicle', handleSelectVehicle);
      window.removeEventListener('select-quote-package', handleSelectPackage);
    };
  }, [activeVehicleOptions, activeVehicleCapacity, visibleTabs]);

  const effDist = distance || 0;
  const tripReq = getTripDrivingRequirements(effDist, activeTab === 'round', duration);
  const minReturnDateTime = (activeTab === 'round' && date)
    ? getMinReturnDateTime(date, tripReq.minRealisticHours)
    : (date || getMinDateTime());

  // Highway / Outstation Route Detection to prevent cannibalizing outstation trips with local packages
  const isDropOutstation = (locText) => {
    if (!locText) return false;
    const lower = locText.toLowerCase();
    const outstationKeywords = [
      'mahabalipuram', 'mamallapuram', 'pondicherry', 'puducherry', 'tirupati',
      'kanchipuram', 'chengalpattu', 'chengalpet', 'sriperumbudur', 'vellore',
      'tiruvallur', 'thiruvallur', 'arakkonam', 'thiruthani', 'tiruttani',
      'gummidipoondi', 'tada', 'sri city', 'sricity', 'melmaruvathur',
      'ranipet', 'walajapet', 'arcot', 'chittoor', 'kumbakonam', 'thanjavur',
      'trichy', 'madurai', 'coimbatore', 'salem', 'bangalore', 'bengaluru',
      'yercaud', 'yelagiri', 'mysore'
    ];
    return outstationKeywords.some(kw => lower.includes(kw));
  };

  const isHighwayOrOutstation = isDropOutstation(drop) || isDropOutstation(pickup) || (distance && distance >= 45);
  const isMahabalipuramTour = Boolean(
    /mahabalipuram|mamallapuram/i.test(drop || '') || /mahabalipuram|mamallapuram/i.test(pickup || '')
  );

  // Short City Round Trip Detection & Alternative Local Package Suggestion
  // Strictly for genuine intra-city trips within Chennai limits (NOT outstation / highway routes)
  const roundTripKm = distance ? Math.round(distance * 2) : 0;
  const isShortCityRoundTrip = activeTab === 'round' && !airportDetected && !cityAutoRouted && Boolean(distance && roundTripKm <= 120 && !isHighwayOrOutstation);

  const recLocalPkgKey = roundTripKm <= 50 ? '5hr50km' : roundTripKm <= 80 ? '8hr80km' : '12hr120km';
  const recLocalPkgLabel = roundTripKm <= 50 ? '5 Hrs / 50 Km' : roundTripKm <= 80 ? '8 Hrs / 80 Km' : '12 Hrs / 120 Km';
  const recLocalPkgCost = (
    recLocalPkgKey === '5hr50km' ? activeVehicles[vehicle]?.local_5hr_pkg
    : recLocalPkgKey === '8hr80km' ? activeVehicles[vehicle]?.local_8hr_pkg
    : activeVehicles[vehicle]?.local_12hr_pkg
  ) || (recLocalPkgKey === '5hr50km' ? (tempoOnly ? 4200 : 1500) : recLocalPkgKey === '8hr80km' ? (tempoOnly ? 5500 : 2200) : (tempoOnly ? 7000 : 3050));

  const localSavings = Math.max(0, (estimate || 3900) - recLocalPkgCost);

  const handleSwitchToLocalPackage = () => {
    setActiveTab('local');
    setLocalPackage(recLocalPkgKey);
    setDrop('Local Sightseeing (Chennai City)');
    setShowResult(true);
    trackEvent('switch_to_local_package_clicked', {
      origin: 'quotation_engine',
      roundTripKm,
      recommendedPackage: recLocalPkgKey,
      savings: localSavings
    });
  };

  // Compute Realistic Travel Advisory for driver safety
  let scheduleAdvisory = null;
  if (returnClampedNotice && minReturnDateTime) {
    scheduleAdvisory = isTa
      ? `நெடுஞ்சாலை ஓட்டுநர் பாதுகாப்பு விதிகளின்படி (~${Math.round(tripReq.totalDrivingHours)} மணிநேரப் பயணம்), குறைந்தபட்சம் ${formatScheduleDateTime(minReturnDateTime)}-க்கு முன் திரும்ப முடியாது. நேரம் தானாக மாற்றப்பட்டது.`
      : `Earlier return blocked: Highway safety requires ~${Math.round(tripReq.totalDrivingHours)} hrs driving. Return locked to earliest safe return: ${formatScheduleDateTime(minReturnDateTime)}.`;
  } else if (activeTab === 'round' && distance && date && returnDate) {
    const diffHours = (new Date(returnDate) - new Date(date)) / (1000 * 60 * 60);
    const roundKm = (distance * 2).toFixed(0);
    if (!tripReq.isSameDayFeasible) {
      scheduleAdvisory = isTa
        ? `சுற்றுப்பயணம் ~${roundKm} கிமீ (~${Math.round(tripReq.totalDrivingHours)} மணிநேரப் பயணம்). ஓட்டுநர் பாதுகாப்பு விதிகளின்படி குறைந்தபட்சம் ${tripReq.minDays} நாட்கள் தேவை.`
        : `Round trip covers ~${roundKm} km (~${Math.round(tripReq.totalDrivingHours)} hrs driving). Highway safety rules require minimum ${tripReq.minDays} calendar days.`;
    } else {
      scheduleAdvisory = isTa
        ? `சுற்றுப்பயணம் ~${roundKm} கிமீ (~${Math.round(tripReq.totalDrivingHours)} மணிநேர நெடுஞ்சாலைப் பயணம்). குறைந்தபட்ச பாதுகாப்பான கால அவகாசம் ${tripReq.minRealisticHours} மணிநேரம் நடைமுறைப்படுத்தப்பட்டுள்ளது.`
        : `Round trip covers ~${roundKm} km (~${Math.round(tripReq.totalDrivingHours)} hrs driving). Safe travel schedule window applied (${Math.max(1, Math.round(diffHours))} hrs selected, min ${tripReq.minRealisticHours} hrs required).`;
    }
  }

  // Auto-sync days count from Pickup & Return dates for round trips with minDays enforcement
  useEffect(() => {
    if (activeTab === 'round') {
      if (!returnDate) {
        setDays(tripReq.minDays || 1);
        return;
      }
      const computed = calculateCalendarDays(date, returnDate);
      setDays(Math.max(tripReq.minDays, computed));
    } else {
      setDays(1);
    }
  }, [activeTab, date, returnDate, distance, duration, tripReq.minDays]);

  // Reactive Safety Enforcement: Strictly block returnDate < minReturnDateTime if returnDate is set
  useEffect(() => {
    if (activeTab === 'round' && minReturnDateTime && returnDate) {
      if (returnDate < minReturnDateTime) {
        setReturnDate(minReturnDateTime);
      }
    }
  }, [activeTab, minReturnDateTime, returnDate]);

  const handlePickupDateChange = (val) => {
    setDate(val);
    setErrors(prev => {
      const next = { ...prev };
      delete next.date;
      return next;
    });
    if (!val) return;
    if (activeTab === 'round') {
      // User must manually select the return date when changing pickup date (no pre-selection)
      setReturnDate('');
      setErrors(prev => {
        const next = { ...prev };
        delete next.returnDate;
        return next;
      });
    }
  };

  const handleReturnDateChange = (val) => {
    if (!val) {
      setReturnDate('');
      return;
    }
    if (activeTab === 'round' && minReturnDateTime && val < minReturnDateTime) {
      // STRICT BLOCK: Earlier return date & time physically blocked and clamped!
      setReturnDate(minReturnDateTime);
      setReturnClampedNotice(true);
      setTimeout(() => setReturnClampedNotice(false), 3500);
      setErrors(prev => {
        const next = { ...prev };
        delete next.returnDate;
        if (next.global && next.global.includes('return date')) delete next.global;
        return next;
      });
      return;
    }
    setReturnDate(val);
    setErrors(prev => {
      const next = { ...prev };
      delete next.returnDate;
      if (next.global && next.global.includes('return date')) delete next.global;
      return next;
    });
  };

  const handlePassengerChange = (newVal) => {
    setPassengers(newVal);
    const pCount = parseInt(newVal, 10);
    const currentCapacity = activeVehicleCapacity[vehicle] ?? (tempoOnly ? 12 : 4);
    if (currentCapacity < pCount) {
      const nextVeh = activeVehicleOptions.find(v => (activeVehicleCapacity[v] ?? 0) >= pCount);
      if (nextVeh) setVehicle(nextVeh);
    }
  };


  // Dedicated helper to ensure the entire result card and Book button are visible in viewport
  const scrollToResult = () => {
    setTimeout(() => {
      if (typeof window === 'undefined') return;
      const containerEl = document.querySelector('.booking-engine') || resultRef.current;
      if (!containerEl) return;
      const rect = containerEl.getBoundingClientRect();
      if (rect.top < 0 || rect.top > 120) {
        const targetY = window.pageYOffset + rect.top - 16;
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      }
    }, 80);
  };

  // Savaari-style 1-tap location swap
  const handleSwapLocations = () => {
    const currentPickup = pickup;
    const currentDrop = drop;
    setPickup(currentDrop);
    setDrop(currentPickup);
    pickupValueRef.current = currentDrop;
    dropValueRef.current = currentPickup;
    setShowResult(false);
    if (currentPickup && currentDrop) {
      calculateDistance(currentDrop, currentPickup);
    }
    trackEvent('locations_swapped', { pickup: currentDrop, drop: currentPickup });
  };

  // Calculate fare across multiple vehicles for instant side-by-side comparison
  const getEstimatedFareFor = (vehKey) => {
    const vData = activeVehicles[vehKey];
    if (!vData) return 0;
    if (activeTab === 'local') {
      const pkgCost = (
        localPackage === '5hr50km' ? vData.local_5hr_pkg
        : localPackage === '8hr80km' ? vData.local_8hr_pkg
        : localPackage === '10hr100km' ? vData.local_10hr_pkg
        : vData.local_12hr_pkg
      ) || (tempoOnly ? 6500 : 2000);
      return pkgCost;
    }
    if (!distance) return 0;
    const rate = activeTab === 'round' ? vData.round_trip_rate : vData.one_way_rate;
    const bata = vData.driver_bata;
    if (activeTab === 'round') {
      const minKm = (days || 1) * vData.min_km_per_day;
      const actualRoundTripKm = distance * 2;
      const chargeableKm = Math.max(minKm, actualRoundTripKm);
      return Math.round((chargeableKm * rate + (days || 1) * bata) / 10) * 10;
    } else {
      const isOutstationDrop = distance >= 50;
      const minDropKm = vData.min_drop_km || (tempoOnly ? 250 : 130);
      const chargeableKm = Math.max(minDropKm, distance);
      return Math.round((chargeableKm * rate + bata) / 10) * 10;
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const driver = params.get('driver');
      if (driver) setRequestedDriver(decodeURIComponent(driver));

      let vehParam = params.get('vehicle');
      if (!vehParam && window.location.hash.includes('vehicle=')) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          vehParam = new URLSearchParams(hashQuery).get('vehicle');
        }
      }
      if (vehParam) {
        const decoded = decodeURIComponent(vehParam).trim();
        const matched = activeVehicleOptions.find(
          opt => opt.toLowerCase() === decoded.toLowerCase() ||
                 opt.toLowerCase().includes(decoded.toLowerCase()) ||
                 decoded.toLowerCase().includes(opt.toLowerCase())
        );
        if (matched) {
          setVehicle(matched);
          const maxCap = activeVehicleCapacity[matched] || (tempoOnly ? 12 : 4);
          setPassengers(p => (parseInt(p, 10) > maxCap ? String(maxCap) : p));
          setVehicleHighlighted(true);
          setTimeout(() => setVehicleHighlighted(false), 2500);
        }
      }
    }

    const handleExternalVehicleSelect = (e) => {
      const v = e?.detail?.vehicle;
      if (!v) return;
      const cleanV = String(v).trim();
      const matched = activeVehicleOptions.find(
        opt => opt.toLowerCase() === cleanV.toLowerCase() ||
               opt.toLowerCase().includes(cleanV.toLowerCase()) ||
               cleanV.toLowerCase().includes(opt.toLowerCase())
      );
      if (matched) {
        setVehicle(matched);
        const maxCap = activeVehicleCapacity[matched] || (tempoOnly ? 12 : 4);
        setPassengers(p => (parseInt(p, 10) > maxCap ? String(maxCap) : p));
        setVehicleHighlighted(true);
        setTimeout(() => setVehicleHighlighted(false), 2500);
      }
    };

    const handleExternalPackageSelect = (e) => {
      const { destination: dest, days: pkgDays, vehicle: v, tab } = e?.detail || {};
      if (tab) {
        setActiveTab(tab);
      } else {
        setActiveTab('round');
      }
      if (v) {
        const cleanV = String(v).trim();
        const matched = activeVehicleOptions.find(
          opt => opt.toLowerCase() === cleanV.toLowerCase() ||
                 opt.toLowerCase().includes(cleanV.toLowerCase()) ||
                 cleanV.toLowerCase().includes(opt.toLowerCase())
        );
        if (matched) {
          setVehicle(matched);
          const maxCap = activeVehicleCapacity[matched] || (tempoOnly ? 12 : 4);
          setPassengers(p => (parseInt(p, 10) > maxCap ? String(maxCap) : p));
        }
      }
      const p = pickup || pickupValueRef.current || 'Chennai, Tamil Nadu';
      if (!pickup) {
        setPickup(p);
        if (pickupValueRef) pickupValueRef.current = p;
      }
      if (dest) {
        setDrop(dest);
        if (dropValueRef) dropValueRef.current = dest;
        if (dropInputRef?.current) dropInputRef.current.value = dest;
        calculateDistance(p, dest);
      }
      if (pkgDays) {
        setDays(Number(pkgDays));
      }
      setVehicleHighlighted(true);
      setTimeout(() => setVehicleHighlighted(false), 2500);
    };

    window.addEventListener('select-quote-vehicle', handleExternalVehicleSelect);
    window.addEventListener('select-quote-package', handleExternalPackageSelect);
    return () => {
      window.removeEventListener('select-quote-vehicle', handleExternalVehicleSelect);
      window.removeEventListener('select-quote-package', handleExternalPackageSelect);
    };
  }, []);

  // Analytics Hooks
  useEffect(() => {
    trackEvent('booking_component_viewed', { variant });
  }, []);

  useEffect(() => {
    trackEvent('trip_type_selected', { trip_type: activeTab });
  }, [activeTab]);

  useEffect(() => {
    if (estimate > 0 && showResult) {
      trackEvent('estimate_calculated', { vehicle, trip_type: activeTab, estimate, distance });
      const rawId = trackCalculatorQuote({
        calculatorId: activeTab === 'local' ? 'local_rental' : 'outstation_cab',
        calculatorEngine: activeTab === 'local' ? 'Local Rental Package' : 'Outstation Cab Estimator',
        tripType: activeTab === 'local' ? `Local Package (${localPackage})` : activeTab === 'round' ? 'Round Trip' : 'One Way',
        pickup: pickup || 'Chennai',
        drop: drop || (activeTab === 'local' ? 'Chennai Local Tour' : 'N/A'),
        vehicle,
        distanceKm: distance ? Number(distance.toFixed(1)) : (activeTab === 'local' ? localPackage : ''),
        estimatedFare: estimate,
        meta: {
          days: activeTab === 'round' ? days : 1,
          travelDate: date || '',
          localPackage: activeTab === 'local' ? localPackage : undefined,
        }
      });
      const formattedRef = (rawId && (String(rawId).startsWith('#QT-') || String(rawId).startsWith('#KT-'))) 
        ? String(rawId) 
        : getNextQuotationId();
      setQuoteRefId(formattedRef);

      if (typeof window !== 'undefined') {
        window.__KT_CURRENT_CALCULATION = {
          engine: 'QuotationEngine',
          quoteRefId: formattedRef,
          serviceTitle: activeTab === 'local' ? 'Chennai Local Rental' : `Chennai to ${drop || 'Outstation'} (${activeTab === 'round' ? 'Round Trip' : 'One Way'})`,
          activeTab,
          pickup: pickup || 'Chennai',
          destination: drop || (activeTab === 'local' ? 'Chennai City' : ''),
          pickupDateTime: date,
          returnDateTime: activeTab === 'round' ? (returnDate ? (minReturnDateTime && returnDate < minReturnDateTime ? minReturnDateTime : returnDate) : '') : '',
          durationDays: activeTab === 'round' ? days : 1,
          vehicleName: vehicle,
          passengers,
          distanceKm: distance ? Number(distance.toFixed(1)) : 0,
          totalFare: estimate,
          formattedFare: `₹${estimate.toLocaleString('en-IN')}`,
          localPackage: activeTab === 'local' ? localPackage : null,
          timestamp: Date.now()
        };
        window.dispatchEvent(new CustomEvent('kt_calculation_updated', { detail: window.__KT_CURRENT_CALCULATION }));
        onQuoteCalculated?.(window.__KT_CURRENT_CALCULATION);
      }
    }
  }, [estimate, showResult, vehicle, activeTab, pickup, drop, date, returnDate, days, passengers, distance, localPackage]);

  // Live capture when visitor enters 10-digit mobile number to save/lock quote
  useEffect(() => {
    const clean = (guestPhone || '').replace(/[^0-9]/g, '');
    if (clean.length === 10 && estimate > 0 && showResult) {
      trackCalculatorQuote({
        quoteId: quoteRefId,
        calculatorId: activeTab === 'local' ? 'local_rental' : 'outstation_cab',
        calculatorEngine: activeTab === 'local' ? 'Local Rental Package' : 'Outstation Cab Estimator',
        tripType: activeTab === 'local' ? `Local Package (${localPackage})` : activeTab === 'round' ? 'Round Trip' : 'One Way',
        guestName: guestName.trim() || `Customer (+91 ${clean})`,
        phone: `+91 ${clean}`,
        pickup: pickup || 'Chennai',
        drop: drop || (activeTab === 'local' ? 'Chennai Local Tour' : 'N/A'),
        vehicle,
        distanceKm: distance ? Number(distance.toFixed(1)) : (activeTab === 'local' ? localPackage : ''),
        estimatedFare: estimate,
        status: 'Phone Entered (Quote Locked)',
        meta: {
          days: activeTab === 'round' ? days : 1,
          travelDate: date || '',
          localPackage: activeTab === 'local' ? localPackage : undefined,
        }
      });
    }
  }, [guestPhone]);
  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const pickupValueRef = useRef(initialPickup || '');
  const dropValueRef = useRef(initialDrop || (initialTab === 'local' ? 'Local Sightseeing (Chennai City)' : ''));
  const pickupPlaceRef = useRef(null);
  const dropPlaceRef = useRef(null);
  const autocompleteInitializedRef = useRef(false);
  const isFirstPaxMountRef = useRef(true);
  const resultRef = useRef(null);

  // Synchronize location refs
  useEffect(() => {
    pickupValueRef.current = pickup;
  }, [pickup]);

  useEffect(() => {
    dropValueRef.current = drop;
  }, [drop]);

  // Rate Limiter
  const checkRateLimit = () => {
    try {
      const attempts = JSON.parse(localStorage.getItem('booking_attempts') || '[]');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const recent = attempts.filter(time => now - time < oneHour);

      if (recent.length >= 25) {
        setErrors(prev => ({ ...prev, global: ERROR_MSGS.active.en }));
        return false;
      }

      recent.push(now);
      localStorage.setItem('booking_attempts', JSON.stringify(recent));
      return true;
    } catch (e) {
      return true; // Fallback if local storage fails
    }
  };

  // Validation Logic
  const validateField = (field, value) => {
    let error = null;
    const sanitized = sanitizeInput(value);

    switch (field) {

      case 'date':
        if (value && new Date(value) < new Date()) {
          error = ERROR_MSGS.date.en;
        }
        break;
      case 'location':
        // Alphanumeric, comma, space, hyphen, dot, slash, parentheses, ampersand, apostrophe
        if (sanitized.length > 0 && !/^[a-zA-Z0-9\s,.\-/#&'()+@]+$/.test(sanitized)) {
          error = "Invalid characters in location";
        }
        break;
    }
    return error;
  };

  const activeValidate = (field, value) => {
    const error = validateField(field, value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[field] = error;
      else delete newErrors[field];
      return newErrors;
    });
    return !error;
  };

  // Handle passengers change — auto-upgrade vehicle if current one is too small
  useEffect(() => {
    if (isFirstPaxMountRef.current) {
      isFirstPaxMountRef.current = false;
      return;
    }
    const pax = parseInt(passengers);
    const currentCapacity = activeVehicleCapacity[vehicle] ?? (tempoOnly ? 12 : 4);
    if (currentCapacity < pax) {
      // Pick the smallest vehicle that fits the group
      const nextVehicle = activeVehicleOptions.find(v => (activeVehicleCapacity[v] ?? 0) >= pax);
      if (nextVehicle) setVehicle(nextVehicle);
    }
    if (!isAuto) {
      setShowResult(false);
    }
  }, [passengers]);

  // Google Maps Autocomplete initialized once
  useEffect(() => {
    let checkTimer = null;
    const initAutocomplete = () => {
      if (autocompleteInitializedRef.current) return;
      if (!window.google || !window.google.maps || !window.google.maps.places) return;

      const options = {
        componentRestrictions: { country: 'in' },
        fields: ['place_id', 'geometry', 'name', 'formatted_address'],
      };

      if (pickupInputRef.current) {
        const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, options);
        pickupAutocomplete.addListener('place_changed', () => {
          const place = pickupAutocomplete.getPlace();
          pickupPlaceRef.current = place;
          const addr = place.formatted_address || place.name;
          if (addr) {
            const sanitized = sanitizeInput(addr);
            setPickup(sanitized);
            pickupValueRef.current = sanitized;
            setDistance(null);
            setShowResult(false);
            if (dropValueRef.current) {
              calculateDistance(sanitized, dropValueRef.current);
            }
          }
        });
      }

      if (dropInputRef.current) {
        const dropAutocomplete = new window.google.maps.places.Autocomplete(dropInputRef.current, options);
        dropAutocomplete.addListener('place_changed', () => {
          const place = dropAutocomplete.getPlace();
          dropPlaceRef.current = place;
          const addr = place.formatted_address || place.name;
          if (addr) {
            const sanitized = sanitizeInput(addr);
            setDrop(sanitized);
            dropValueRef.current = sanitized;
            setDistance(null);
            setShowResult(false);
            if (pickupValueRef.current) {
              calculateDistance(pickupValueRef.current, sanitized);
            }
          }
        });
      }

      autocompleteInitializedRef.current = true;
    };

    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete();
    } else {
      window.addEventListener('google-maps-loaded', initAutocomplete);
      checkTimer = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          initAutocomplete();
          if (autocompleteInitializedRef.current && checkTimer) clearInterval(checkTimer);
        }
      }, 500);
    }

    return () => {
      window.removeEventListener('google-maps-loaded', initAutocomplete);
      if (checkTimer) clearInterval(checkTimer);
    };
  }, []);

  const applyResolvedDistance = (distKm, durStr) => {
    setDistance(distKm);
    setDuration(durStr);

    const o = (pickup || pickupValueRef.current || '').trim();
    const d = (drop || dropValueRef.current || '').trim();

    // 1. Airport Route Detection: route to airport transfer mode
    if (activeTab === 'round' && isAirportRoute(o, d)) {
      setAirportDetected(true);
      setCityAutoRouted(false);
      setLoading(false);
      setShowResult(true);
      return;
    }

    // 2. Intra-City Route Detection: Auto-switch to Local Package directly (no 3900 outstation quote!)
    const isHwy = isDropOutstation(d) || isDropOutstation(o) || (distKm && distKm >= 45);
    const isCity = activeTab === 'round' && distKm && (distKm * 2 <= 100) && !isHwy;
    if (isCity) {
      setAirportDetected(false);
      setCityAutoRouted(true);
      setActiveTab('local');
      const recPkg = distKm * 2 <= 50 ? '5hr50km' : distKm * 2 <= 80 ? '8hr80km' : '12hr120km';
      setLocalPackage(recPkg);
      setLoading(false);
      setShowResult(true);
      return;
    }

    setAirportDetected(false);
    setCityAutoRouted(false);

    if (activeTab === 'round' && distKm) {
      const req = getTripDrivingRequirements(distKm, true, durStr);
      const minReturn = getMinReturnDateTime(date || getDefaultDepartureTime(), req.minRealisticHours);
      if (returnDate && returnDate < minReturn) {
        setReturnDate(minReturn);
        const computed = calculateCalendarDays(date || getDefaultDepartureTime(), minReturn);
        setDays(Math.max(req.minDays, computed));
      }
    }
    setLoading(false);
    setShowResult(true);
  };

  const resolveFallbackDistance = (o, d) => {
    const fallback = findKnownDistance(o, d);
    if (fallback) {
      applyResolvedDistance(fallback.distance, fallback.duration);
      return;
    }

    const destL = (d || '').toLowerCase();
    const origL = (o || '').toLowerCase();
    const isTirup = destL.includes('tirupati') || destL.includes('tirumala') || origL.includes('tirupati') || origL.includes('tirumala');
    if (isTirup) {
      applyResolvedDistance(135, '3.5 - 4 hrs (Est)');
      return;
    }

    // Conservative estimate for outstation trip when distance API is unreachable
    const fallbackKm = activeTab === 'round' ? 250 : 130;
    applyResolvedDistance(fallbackKm, activeTab === 'round' ? 'Full Day' : '3-4 hrs (Est)');
  };

  const calculateDistance = async (origin, destination) => {
    const o = (origin || pickup || pickupValueRef.current || pickupInputRef.current?.value || '').trim();
    const d = (destination || drop || dropValueRef.current || dropInputRef.current?.value || '').trim();
    if (!o || !d) {
      setErrors(prev => ({
        ...prev,
        global: isTa ? 'பிக்கப் மற்றும் டிராப் இடங்களை உள்ளிடவும்' : 'Please enter valid pickup & drop locations'
      }));
      return;
    }

    if (o && o !== pickup) {
      setPickup(o);
      pickupValueRef.current = o;
    }
    if (d && d !== drop) {
      setDrop(d);
      dropValueRef.current = d;
    }

    setLoading(true);
    setErrors(prev => {
      const next = { ...prev };
      delete next.global;
      delete next.location;
      return next;
    });

    // 1. Ensure Google Maps API is loaded (or fallback immediately for known city pairs)
    if (typeof window !== 'undefined' && (!window.google || !window.google.maps || !window.google.maps.DistanceMatrixService)) {
      const known = findKnownDistance(o, d);
      if (known) {
        resolveFallbackDistance(o, d);
        return;
      }
      try {
        await Promise.race([
          loadGoogleMaps(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Maps load timeout')), 2500))
        ]);
      } catch (_) {}
    }

    // Use LatLng from place autocomplete if available, else exact address strings
    const originParam = (pickupPlaceRef.current?.formatted_address === o && pickupPlaceRef.current?.geometry?.location)
      ? pickupPlaceRef.current.geometry.location
      : o;
    const destParam = (dropPlaceRef.current?.formatted_address === d && dropPlaceRef.current?.geometry?.location)
      ? dropPlaceRef.current.geometry.location
      : d;

    let resolved = false;
    const fallbackTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolveFallbackDistance(o, d);
      }
    }, 3500);

    // 2. PRIMARY: Real-time route distance via Google Maps Distance Matrix
    if (window.google && window.google.maps && window.google.maps.DistanceMatrixService) {
      try {
        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [originParam],
            destinations: [destParam],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(fallbackTimer);
            if (status === 'OK' && response?.rows?.[0]?.elements?.[0]?.status === 'OK') {
              const element = response.rows[0].elements[0];
              const distValue = Math.round((element.distance.value / 1000) * 10) / 10;
              const durText = element.duration.text;
              applyResolvedDistance(distValue, durText);
              return;
            }
            resolveFallbackDistance(o, d);
          }
        );
        return;
      } catch (err) {
        console.warn('Google Maps Distance Matrix failed, using local fallback:', err);
        if (!resolved) {
          resolved = true;
          clearTimeout(fallbackTimer);
          resolveFallbackDistance(o, d);
        }
      }
    } else {
      if (!resolved) {
        resolved = true;
        clearTimeout(fallbackTimer);
        resolveFallbackDistance(o, d);
      }
    }
  };

  const handleCalculateCost = () => {
    if (activeTab === 'local') {
      setShowResult(true);
      scrollToResult();
      return;
    }

    const o = (pickup || pickupValueRef.current || pickupInputRef.current?.value || '').trim();
    const d = (drop || dropValueRef.current || dropInputRef.current?.value || '').trim();

    if (!o || !d) {
      setErrors(prev => ({
        ...prev,
        global: isTa ? 'பிக்கப் மற்றும் டிராப் இடங்களை உள்ளிடவும்' : 'Please enter both Pickup and Drop locations',
        pickup: !o ? (isTa ? 'பிக்கப் இடத்தை உள்ளிடவும்' : 'Please enter pickup location') : undefined,
        drop: !d ? (isTa ? 'டிராப் இடத்தை உள்ளிடவும்' : 'Please enter drop location') : undefined,
      }));
      return;
    }

    if (o !== pickup) {
      setPickup(o);
      pickupValueRef.current = o;
    }
    if (d !== drop) {
      setDrop(d);
      dropValueRef.current = d;
    }

    if (activeTab === 'round' && isAirportRoute(o, d)) {
      setAirportDetected(true);
      setCityAutoRouted(false);
      setShowResult(true);
      scrollToResult();
      return;
    }

    // Intra-city route: auto-route directly to local package without demanding outstation return date
    const knownCity = findKnownDistance(o, d);
    const isHwy = isDropOutstation(d) || isDropOutstation(o) || (knownCity?.distance && knownCity.distance >= 45);
    const isCity = activeTab === 'round' && knownCity?.distance && (knownCity.distance * 2 <= 100) && !isHwy;
    if (isCity) {
      applyResolvedDistance(knownCity.distance, knownCity.duration);
      scrollToResult();
      return;
    }

    if (activeTab === 'round' && !returnDate) {
      setErrors(prev => ({
        ...prev,
        returnDate: isTa ? 'திரும்பும் தேதியைத் தேர்ந்தெடுக்கவும்' : 'Please select return date & time',
        global: isTa ? 'சுற்றுப்பயணத்திற்கு திரும்பும் தேதியைத் தேர்ந்தெடுக்கவும்' : 'Please select return date & time for round trip'
      }));
      const returnEl = document.getElementById(`${stableFormId}-return-date-main`);
      if (returnEl) returnEl.focus();
      return;
    }

    if (activeTab === 'round' && returnDate && minReturnDateTime && returnDate < minReturnDateTime) {
      setReturnDate(minReturnDateTime);
    }

    // Eagerly trigger Google Maps if needed
    loadGoogleMaps().catch(() => {});
    calculateDistance(o, d);
    scrollToResult();
  };

  // Handle Pin Click - Opens Map Modal
  const handlePinClick = (field) => {
    loadGoogleMaps().catch(() => {});
    setPickerField(field);
    setLocationPickerOpen(true);
    trackEvent('location_map_opened', { field });
  };

  // Scroll input so the autocomplete dropdown and field stay clearly visible above the keyboard
  const handleLocationFocus = (e) => {
    loadGoogleMaps().catch(() => {});
    const inputEl = e.currentTarget;
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      scrollInputAboveKeyboard(inputEl, 220);
    }
  };

  // Handle Location Selection from Map Modal
  const handleLocationConfirm = (address) => {
    const cleanAddr = sanitizeInput(address);
    if (pickerField === 'pickup') {
      setPickup(cleanAddr);
      pickupValueRef.current = cleanAddr;
      setErrors(prev => {
        const next = { ...prev };
        delete next.global;
        delete next.location;
        delete next.pickup;
        return next;
      });
      if (dropValueRef.current) calculateDistance(cleanAddr, dropValueRef.current);
    } else if (pickerField === 'drop') {
      setDrop(cleanAddr);
      dropValueRef.current = cleanAddr;
      setErrors(prev => {
        const next = { ...prev };
        delete next.global;
        delete next.location;
        delete next.drop;
        return next;
      });
      if (pickupValueRef.current) calculateDistance(pickupValueRef.current, cleanAddr);
    }
    setLocationPickerOpen(false);
    trackEvent('location_pin_used', { field: pickerField, method: 'map_picker', success: true });
  };

  // Get Current Location using Geolocation API
  const getCurrentLocation = async (field) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(field);
    try {
      await loadGoogleMaps();
    } catch (_) {}

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Check if Google Maps is loaded
        if (!window.google || !window.google.maps) {
          setGettingLocation(null);
          alert('Google Maps not loaded. Please wait a moment and try again.');
          return;
        }

        // Try Geocoding first (best option)
        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };

        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            // SUCCESS - Use Geocoding result
            const address = results[0].formatted_address;

            if (field === 'pickup') {
              setPickup(sanitizeInput(address));
              if (drop) calculateDistance(address, drop);
            } else {
              setDrop(sanitizeInput(address));
              if (pickup) calculateDistance(pickup, address);
            }

            setGettingLocation(null);
            setShowResult(false);
            trackEvent('location_pin_used', { field, method: 'geocoding', success: true });

          } else {
            // FALLBACK - Use Places Nearby Search
            const map = new window.google.maps.Map(document.createElement('div'));
            const service = new window.google.maps.places.PlacesService(map);

            const request = {
              location: latlng,
              rankBy: window.google.maps.places.RankBy.DISTANCE,
              type: ['establishment', 'point_of_interest']
            };

            service.nearbySearch(request, (places, placesStatus) => {
              setGettingLocation(null);

              if (placesStatus === 'OK' && places && places.length > 0) {
                // SUCCESS - Use nearest place
                const nearestPlace = places[0];
                const placeName = nearestPlace.name;
                // Use vicinity if available for context
                const vicinity = nearestPlace.vicinity || 'Chennai';
                const placeAddress = `${placeName}, ${vicinity}`;

                if (field === 'pickup') {
                  setPickup(sanitizeInput(placeAddress));
                } else {
                  setDrop(sanitizeInput(placeAddress));
                }

                setShowResult(false);
                alert('Using nearby location. Please refine if needed.');
                trackEvent('location_pin_used', { field, method: 'places', success: true });

              } else {
                // FINAL FALLBACK - Use city name with coordinates
                const fallbackAddress = `Chennai (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

                if (field === 'pickup') {
                  setPickup(fallbackAddress);
                } else {
                  setDrop(fallbackAddress);
                }

                alert('Could not find nearby location. Using coordinates. Please enter address manually.');
                trackEvent('location_pin_used', { field, method: 'coordinates', success: false });
              }
            });
          }
        });
      },
      (error) => {
        setGettingLocation(null);
        // Geolocation error handled via UI state

        let errorMsg = 'Unable to get location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out';
            break;
        }

        alert(errorMsg);
        trackEvent('location_pin_error', { field, error: error.code });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };


  useEffect(() => {
    const vehicleData = activeVehicles[vehicle];
    if (!vehicleData) return;

    // 1. LOCAL PACKAGE: Flat package rate independent of distance!
    if (activeTab === 'local') {
      const pkgCost = (
        localPackage === '5hr50km' ? vehicleData.local_5hr_pkg
        : localPackage === '8hr80km' ? vehicleData.local_8hr_pkg
        : localPackage === '10hr100km' ? vehicleData.local_10hr_pkg
        : vehicleData.local_12hr_pkg
      ) || 2000;

      setEstimate(pkgCost);
      setBreakdown({
        is_local_pkg: true,
        package: localPackage,
        package_cost: pkgCost,
        driver_bata: 0,
        driver_bata_text: 'Included',
        extra_km_rate: vehicleData.extra_km_rate || 15,
        extra_hr_rate: vehicleData.extra_hr_rate || 150,
        inclusions: [
          localPackage === '5hr50km' ? '50 Km Limit' : localPackage === '8hr80km' ? '80 Km Limit' : localPackage === '10hr100km' ? '100 Km Limit' : '120 Km Limit',
          localPackage === '5hr50km' ? '5 Hours Limit' : localPackage === '8hr80km' ? '8 Hours Limit' : localPackage === '10hr100km' ? '10 Hours Limit' : '12 Hours Limit',
          'AC Vehicle & Fuel Included',
          'Chauffeur Duty Included'
        ]
      });
      if (isAuto) {
        setShowResult(true);
      }
      return;
    }

    // If airport route is detected while on round, do NOT compute 3900 outstation minimum!
    if (activeTab === 'round' && isAirportRoute(pickup, drop)) {
      setAirportDetected(true);
      return;
    }

    // 2. OUTSTATION / POINT-TO-POINT: Round Trip & One Way
    if ((distance || autoCalculate) && vehicleData) {
      const effDistance = distance || 130;
      let totalCost = 0;
      const rate = activeTab === 'round' ? vehicleData.round_trip_rate : vehicleData.one_way_rate;
      const bata = vehicleData.driver_bata;
      let breakdownObj = {};

      if (activeTab === 'round') {
        const minKm = (days || 1) * (vehicleData.min_km_per_day || 250);
        const actualRoundTripKm = effDistance * 2;
        const chargeableKm = Math.max(minKm, actualRoundTripKm);
        const freeBufferKm = Math.max(0, chargeableKm - actualRoundTripKm);
        const bataTotal = (days || 1) * bata;
        const kmCost = chargeableKm * rate;
        totalCost = kmCost + bataTotal;

        const extras = estimateRoadExtras(pickup, drop, effDistance, days, true);

        breakdownObj = {
          base_km: minKm,
          actual_km: actualRoundTripKm,
          chargeable_km: chargeableKm,
          free_buffer_km: freeBufferKm,
          rate_per_km: rate,
          km_cost: kmCost,
          driver_bata: bataTotal,
          daily_bata: bata,
          days: days || 1,
          nights: extras.nights,
          state_name: extras.stateName,
          state_permit_est: extras.statePermitEst,
          tolls_est: extras.tollsEst,
          driver_night_stay_est: extras.driverNightStayEst,
          road_extras_est: extras.roadExtrasEst,
          is_city: false
        };
      } else {
        // One Way Drop Trip
        const isOutstationDrop = effDistance >= 50;
        let chargeableKm, kmCost;
        if (isOutstationDrop) {
          const minDropKm = vehicleData.min_drop_km || 130;
          chargeableKm = Math.max(minDropKm, effDistance);
          kmCost = chargeableKm * rate;
          totalCost = kmCost + bata;
          const extras = estimateRoadExtras(pickup, drop, effDistance, 1, false);

          breakdownObj = {
            base_km: minDropKm,
            actual_km: effDistance,
            chargeable_km: chargeableKm,
            free_buffer_km: Math.max(0, chargeableKm - effDistance),
            rate_per_km: rate,
            km_cost: kmCost,
            driver_bata: bata,
            daily_bata: bata,
            days: 1,
            nights: 0,
            state_name: extras.stateName,
            state_permit_est: extras.statePermitEst,
            tolls_est: extras.tollsEst,
            driver_night_stay_est: 0,
            road_extras_est: extras.roadExtrasEst,
            is_city: false,
            is_oneway: true
          };
        } else {
          // City / Airport transfer (<50 km) — no outstation minimum, no driver bata
          chargeableKm = effDistance;
          kmCost = chargeableKm * rate;
          totalCost = kmCost;
          breakdownObj = {
            base_km: 0,
            actual_km: effDistance,
            chargeable_km: chargeableKm,
            free_buffer_km: 0,
            rate_per_km: rate,
            km_cost: kmCost,
            driver_bata: 0,
            daily_bata: 0,
            days: 1,
            nights: 0,
            state_name: 'Tamil Nadu',
            state_permit_est: 0,
            tolls_est: 0,
            driver_night_stay_est: 0,
            road_extras_est: 0,
            is_city: true,
            is_oneway: true
          };
        }
      }
      // Round to nearest 10 for cleaner pricing
      setEstimate(Math.round(totalCost / 10) * 10);
      setBreakdown(breakdownObj);
      if (isAuto || distance) {
        setShowResult(true);
      }
    } else {
      setEstimate(0);
      setBreakdown(null);
    }
  }, [distance, vehicle, activeTab, days, localPackage, pickup, drop, autoCalculate]);

  useEffect(() => {
    if (activeTab === 'local') {
      if (!cityAutoRouted) {
        setDrop('Local Sightseeing (Chennai City)');
      }
      if (pickup === 'Chennai International Airport (MAA)') setPickup('');
    } else if (drop === 'Local Sightseeing (Chennai City)') {
      setDrop('');
      setDistance(null);
    }
  }, [activeTab, cityAutoRouted]);

  const handleWhatsAppAirport = () => {
    if (!checkRateLimit()) return;
    const pLoc = sanitizeInput(pickup || 'Chennai Airport (MAA)');
    const dLoc = sanitizeInput(drop || 'Chennai City');
    const airportEst = getAirportTransferEstimate(drop || pickup, vehicle);
    const cleanGuestPhone = (guestPhone || '').replace(/[^0-9]/g, '').slice(-10);
    const guestLabel = (guestName || '').trim() || (cleanGuestPhone ? `Customer (${cleanGuestPhone})` : 'Website Visitor');

    const msg = `*Kalidass Travels — Chennai Airport Transfer Quotation (${quoteRefId})*
• *Customer:* ${guestLabel}
• *Transfer Type:* Chennai Airport Transfer (MAA)
• *Pickup:* ${pLoc}
• *Drop:* ${dLoc}
• *Pickup Schedule:* ${date ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Immediate / Today'}
• *Vehicle:* ${vehicle} (${passengers} Pax)
• *Estimated Flat Fare:* ~₹${airportEst.toLocaleString('en-IN')} (Fuel, AC & Doorstep Chauffeur Included)
• *Airport Inclusions:* 60 Min Free Waiting Buffer on Flight Delay • Zero Surge Pricing • Dedicated Boot Space

Please confirm driver & vehicle availability for this airport transfer (${quoteRefId}).`;

    trackEvent('booking_conversion_whatsapp', {
      quote_id: quoteRefId,
      estimate: airportEst,
      trip_type: 'airport',
      vehicle
    });

    window.open(`https://wa.me/918939539211?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsApp = async () => {
    // 1. Honeypot Check
    if (botField) {
      return;
    }

    // 2. Validate Fields per Trip Type
    const isDateValid = date ? activeValidate('date', date) : true;
    const isReturnDateValid = (activeTab === 'round') ? Boolean(returnDate && activeValidate('date', returnDate)) : true;
    const isPickupValid = pickup.trim().length > 0;
    const isDropValid = activeTab === 'local' || drop.trim().length > 0;

    if (!isPickupValid || !isDropValid || !isDateValid || !isReturnDateValid) {
      setErrors(prev => ({
        ...prev,
        global: activeTab === 'local' 
          ? (isTa ? 'சென்னையில் பிக்கப் இடத்தை உள்ளிடவும்' : 'Please enter pickup location in Chennai')
          : !isReturnDateValid
            ? (isTa ? 'திரும்பும் தேதியைத் தேர்ந்தெடுக்கவும்' : 'Please select return date & time')
            : (isTa ? 'பிக்கப் மற்றும் டிராப் இடங்களை உள்ளிடவும்' : 'Please enter both Pickup and Drop locations'),
        pickup: !isPickupValid ? (isTa ? 'பிக்கப் இடத்தை உள்ளிடவும்' : 'Please enter pickup location') : undefined,
        drop: !isDropValid ? (isTa ? 'டிராப் இடத்தை உள்ளிடவும்' : 'Please enter drop location') : undefined,
        returnDate: !isReturnDateValid ? (isTa ? 'திரும்பும் தேதியைத் தேர்ந்தெடுக்கவும்' : 'Please select return date & time') : undefined,
      }));
      if (!isPickupValid && pickupInputRef.current) {
        pickupInputRef.current.focus();
      } else if (!isDropValid && dropInputRef.current) {
        dropInputRef.current.focus();
      } else if (!isReturnDateValid) {
        const returnEl = document.getElementById(`${stableFormId}-return-date-main`);
        if (returnEl) returnEl.focus();
      }
      trackEvent('booking_validation_error', { trip_type: activeTab });
      return;
    }

    // 3. Rate Limit
    if (!checkRateLimit()) return;

    // 4. Eager Distance Resolution if needed
    let currentDist = distance;
    let currentEst = estimate;

    if (activeTab !== 'local' && !currentDist) {
      const known = findKnownDistance(pickup, drop);
      const destL = (drop || '').toLowerCase();
      const origL = (pickup || '').toLowerCase();
      const isTirup = destL.includes('tirupati') || destL.includes('tirumala') || origL.includes('tirupati') || origL.includes('tirumala');
      currentDist = known ? known.distance : isTirup ? 135 : (activeTab === 'round' ? 250 : 130);
      setDistance(currentDist);

      if (activeTab === 'round' && currentDist) {
        const req = getTripDrivingRequirements(currentDist, true);
        const minReturn = getMinReturnDateTime(date || getDefaultDepartureTime(), req.minRealisticHours);
        if (returnDate && returnDate < minReturn) {
          setReturnDate(minReturn);
          const computed = calculateCalendarDays(date || getDefaultDepartureTime(), minReturn);
          setDays(Math.max(req.minDays, computed));
        }
      }

      const vData = vehicles[vehicle];
      if (vData) {
        const rate = activeTab === 'round' ? vData.round_trip_rate : vData.one_way_rate;
        const bata = vData.driver_bata;
        if (activeTab === 'round') {
          const minKm = (days || 1) * vData.min_km_per_day;
          const actKm = currentDist * 2;
          const chgKm = Math.max(minKm, actKm);
          currentEst = Math.round((chgKm * rate + (days || 1) * bata) / 10) * 10;
        } else {
          const minDrop = vData.min_drop_km || 130;
          const chgKm = currentDist >= 50 ? Math.max(minDrop, currentDist) : currentDist;
          const bCost = currentDist >= 50 ? bata : 0;
          currentEst = Math.round((chgKm * rate + bCost) / 10) * 10;
        }
        setEstimate(currentEst);
      }
    }

    const finalEstimate = currentEst || estimate;
    const cleanGuestPhone = (guestPhone || '').replace(/[^0-9]/g, '').slice(-10);
    const guestLabel = (guestName || '').trim() || (cleanGuestPhone ? `Customer (${cleanGuestPhone})` : 'Website Visitor');
    const sourceWithPhone = cleanGuestPhone 
      ? `Website Booking Engine (+91 ${cleanGuestPhone})` 
      : 'Website Booking Engine';

    markQuoteConverted(quoteRefId, {
      quoteId: quoteRefId,
      guestName: guestLabel,
      phone: cleanGuestPhone ? `+91 ${cleanGuestPhone}` : '',
      sourcePage: sourceWithPhone,
      calculatorEngine: 'Outstation Fare Engine',
      tripType: activeTab === 'local' ? `Local Package (${localPackage})` : activeTab === 'oneway' ? 'One Way Drop' : `Round Trip (${days} Days)`,
      pickup: sanitizeInput(pickup),
      drop: sanitizeInput(drop || 'Local Sightseeing'),
      vehicle,
      estimatedFare: finalEstimate,
      distanceKm: currentDist ? (activeTab === 'round' ? currentDist * 2 : currentDist) : '',
      travelDate: date ? `${date}` : '',
      status: 'WhatsApp Clicked'
    });

    // 5. Send Data to Google Sheet Webhook if configured
    const activeSheetUrl = getActiveGoogleSheetUrl();
    const safeReturnDate = (activeTab === 'round' && returnDate && minReturnDateTime && returnDate < minReturnDateTime)
      ? minReturnDateTime
      : returnDate;

    const bookingData = {
      type: 'calculator_activity',
      quoteId: quoteRefId,
      date: new Date().toLocaleString('en-IN'),
      tripType: activeTab === 'local' ? `Local Package (${localPackage})` : activeTab === 'oneway' ? 'One Way Drop' : 'Round Trip',
      guestName: guestLabel,
      phone: cleanGuestPhone ? `+91 ${cleanGuestPhone}` : '',
      pickup: sanitizeInput(pickup),
      drop: sanitizeInput(drop || 'Local Sightseeing (Chennai City)'),
      vehicle,
      passengers,
      distance: currentDist ? (activeTab === 'round' ? (currentDist * 2).toFixed(1) : currentDist.toFixed(1)) : (activeTab === 'local' ? localPackage : ''),
      estimate: finalEstimate,
      travelDate: date,
      returnDate: activeTab === 'round' ? safeReturnDate : '',
      days: activeTab === 'round' ? days : 1,
      sourcePage: sourceWithPhone,
      status: 'WhatsApp Clicked'
    };

    if (activeSheetUrl && activeSheetUrl.startsWith('http')) {
      try {
        fetch(activeSheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(bookingData)
        }).catch(() => {});
      } catch (e) {}
    }

    // 6. Build Crisp Official WhatsApp Quotation Message (Single Selected Vehicle + Approx Tolls/Permit + Quote Ref)
    const isTempoBooking = tempoOnly || (vehicle && (vehicle.toLowerCase().includes('tempo') || vehicle.toLowerCase().includes('urbania')));
    const is50PercentPayment = isTempoBooking || activeTab !== 'local';
    const currentVehData = activeVehicles[vehicle] || (tempoOnly ? TEMPO_VEHICLES['12-Seater Luxury Force Tempo'] : vehicles['Swift Dzire']);
    const extraKmPrice = currentVehData?.extra_km_rate || currentVehData?.round_trip_rate || (tempoOnly ? 24 : 14);
    const extraHrPrice = currentVehData?.extra_hr_rate || (tempoOnly ? 350 : 150);
    const advanceAmount = is50PercentPayment ? Math.round(finalEstimate * 0.5) : 500;
    const balanceAmount = Math.max(0, finalEstimate - advanceAmount);
    const advanceLabel = is50PercentPayment 
      ? `50% (₹${advanceAmount.toLocaleString('en-IN')}) on cab arrival`
      : `₹500 advance to confirm`;

    const localPkgName = localPackage === '5hr50km' ? '5 Hours / 50 Km' : localPackage === '8hr80km' ? '8 Hours / 80 Km' : localPackage === '10hr100km' ? '10 Hours / 100 Km' : '12 Hours / 120 Km';

    const driverLine = requestedDriver ? `• *Requested Chauffeur:* ${requestedDriver}\n` : '';
    const customerLine = (guestName.trim() || cleanGuestPhone)
      ? `• *Customer:* ${guestName.trim() || 'Guest'}${cleanGuestPhone ? ` (+91 ${cleanGuestPhone})` : ''}\n`
      : '';
    const tripTypeTitle = activeTab === 'local' 
      ? `Local Package (${localPkgName})`
      : activeTab === 'oneway' ? 'One Way Drop' : `Round Trip (${days} ${days > 1 ? 'Days' : 'Day'})`;

    const statePermitText = breakdown?.state_permit_est > 0
      ? `₹${breakdown.state_permit_est.toLocaleString('en-IN')}`
      : '₹0';

    const breakdownDetails = activeTab === 'local' ? `
*FARE SUMMARY*
• *Quoted Package Fare:* *₹${finalEstimate.toLocaleString('en-IN')}* (${localPkgName} — AC Vehicle + Fuel + Driver Included)
• *Included Limits:* ${localPkgName}
• *Extra Usage (if exceeded):* ₹${extraKmPrice}/km • ₹${extraHrPrice}/hr
• *Advance Payment:* ${advanceLabel}
• *Balance to Pay:* ₹${balanceAmount.toLocaleString('en-IN')} (Pay driver after trip completion)
• *Terms:* Zero shed charges (meter starts at your pickup location) • Tolls & parking extra at actuals.`
    : (breakdown && !breakdown.is_city) ? `
*FARE SUMMARY*
• *Total Fare:* *₹${finalEstimate.toLocaleString('en-IN')} + Extra* (${breakdown.chargeable_km} km @ ₹${breakdown.rate_per_km}/km + Driver Allowance ₹${breakdown.driver_bata})
• *Included Distance:* ${breakdown.chargeable_km} km (Extra: ₹${extraKmPrice}/km)
${breakdown.free_buffer_km > 0 ? `• *Free Sightseeing Buffer:* +${breakdown.free_buffer_km.toFixed(0)} km (₹0)\n` : ''}• *State Permit:* ${statePermitText}
• *Tolls & Parking:* Extra at actuals
• *Advance Payment:* ${advanceLabel}
• *Balance to Pay Driver:* ₹${balanceAmount.toLocaleString('en-IN')} + Extra
• *Terms:* Zero shed charges • Balance after trip completion.`
    : `
*FARE SUMMARY*
• *Quoted Fare:* *₹${finalEstimate.toLocaleString('en-IN')}* (AC Cab + Fuel + Driver Included)
• *Included Usage:* Extra ₹${extraKmPrice}/km if exceeded
• *Advance Payment:* ${advanceLabel}
• *Balance to Pay Driver:* ₹${balanceAmount.toLocaleString('en-IN')}
• *Terms:* Zero shed charges • Balance after trip completion.`;

    // Google Maps navigation links
    const { pickupPin: mapsPickupPin, directions: mapsDirections } = buildMapsLinks(
      sanitizeInput(pickup),
      activeTab === 'local' ? '' : sanitizeInput(drop),
      activeTab
    );
    const mapsBlock = (mapsPickupPin || mapsDirections)
      ? `\n\n🗺️ NAVIGATION LINKS:\n` +
        (mapsPickupPin  ? `• 📍 Pickup Pin: ${mapsPickupPin}\n`  : '') +
        (mapsDirections ? `• 🧭 Route Map: ${mapsDirections}`    : '')
      : '';

    const message = `🚖 *KALIDASS TRAVELS — VERIFIED ONLINE BOOKING (${quoteRefId})*
${customerLine}${driverLine}• *Trip:* ${tripTypeTitle}
• *Pickup:* ${sanitizeInput(pickup)}
• *Drop:* ${activeTab === 'local' ? 'Local Sightseeing (Chennai City Limits)' : sanitizeInput(drop)}
${activeTab !== 'local' ? `• *Distance:* ~${currentDist ? (activeTab === 'round' ? (currentDist * 2).toFixed(0) : currentDist.toFixed(0)) : 'N/A'} km (${tripReq.drivingText || duration || 'Highway Route'})\n` : ''}• *Pickup Schedule:* ${date ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not Specified'}
${activeTab === 'round' ? `• *Return Schedule:* ${safeReturnDate ? new Date(safeReturnDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not Specified'}\n` : ''}• *Selected Vehicle:* ${vehicle} (${passengers} Pax)
${breakdownDetails}

Please confirm cab availability and lock this quotation (${quoteRefId}).` + mapsBlock;

    trackEvent('booking_conversion_whatsapp', {
      quote_id: quoteRefId,
      estimate: finalEstimate,
      trip_type: activeTab,
      vehicle
    });

    const targetPhone = isOperatorMode && operatorCallerPhone ? operatorCallerPhone : undefined;
    window.open(buildWhatsAppUrl(message, targetPhone), '_blank');
  };

  // Helper for Input Classes
  const getInputClass = (field) => {
    return `flex items-center bg-m3-surface-container-low border rounded-m3-md px-4 py-3 transition-all ${errors[field]
      ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/20'
      : 'border-m3-outline-variant focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary'
      }`;
  };

  return (
    <section 
      aria-label={isTa ? 'பயண முன்பதிவு கால்குலேட்டர்' : 'Cab Booking & Fare Estimator'}
      className="w-full max-w-2xl mx-auto bg-white rounded-m3-2xl shadow-m3-1 sm:shadow-m3-2 border border-m3-outline-variant overflow-hidden font-sans booking-engine"
    >
      {/* Hidden Honeypot */}
      <input
        type="text"
        name="website_url"
        style={{ display: 'none' }}
        value={botField}
        onChange={(e) => setBotField(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Title Header — Material 3 Standard Elevation */}
      {showHeader ? (
        <div className="py-3 px-4 sm:px-5 border-b border-m3-outline-variant/60 flex flex-col items-center justify-center text-center bg-m3-surface">
          <div className="flex items-center justify-center gap-2 max-w-full">
            {headerIcon && (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-m3-full bg-m3-primary-container flex items-center justify-center shrink-0">
                {headerIcon === 'car' ? (
                  <Car className="w-4 h-4 text-m3-primary" />
                ) : headerIcon === 'clock' ? (
                  <Clock className="w-4 h-4 text-m3-primary" />
                ) : (
                  headerIcon
                )}
              </div>
            )}
            <h2 className="text-lg sm:text-xl font-bold text-m3-on-surface font-heading leading-tight text-center">
              {displayTitle}
            </h2>
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-1 font-medium text-center">
            {subtitle || (activeTab === 'local' 
              ? (isTa ? 'சென்னைக்குள் வாடகை கார் • எரிபொருள் & டிரைவர் உட்பட' : 'Hourly car rental within Chennai • Fuel & Chauffeur included')
              : (isTa ? 'வெளிப்படையான கட்டணங்கள் • சரிபார்க்கப்பட்ட ஓட்டுநர்கள்' : 'Transparent pricing • Verified chauffeurs'))}
          </p>
        </div>
      ) : (
        <div className="pt-3.5 sm:pt-4 pb-1 text-center px-4">
          <h2 className="text-base sm:text-lg font-bold text-m3-on-surface font-heading tracking-tight">
            {isTa ? 'உங்கள் பயணத்தை பதிவு செய்யுங்கள்' : 'Book Your Trip'}
          </h2>
        </div>
      )}

      {requestedDriver && (
        <div className="px-4 sm:px-5 pt-2.5">
          <div className="inline-flex items-center gap-1.5 bg-m3-surface-container-high border border-m3-outline-variant rounded-m3-full px-3 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-m3-primary shrink-0" />
            <span className="text-xs font-bold text-m3-primary">Booking for: {requestedDriver}</span>
          </div>
        </div>
      )}

      {/* Tabs (Trip Type) — Hidden when quotation result is active */}
      {visibleTabs.length > 1 && !showResult && (
        <div className={`px-4 sm:px-5 ${showHeader ? 'pt-3.5' : 'pt-4 sm:pt-5'} pb-1`}>
          <div role="tablist" aria-label={isTa ? 'பயண வகை' : 'Trip Type'} className="bg-m3-surface-container-high p-1 rounded-m3-full flex gap-1 overflow-x-auto whitespace-nowrap hide-scrollbar border border-m3-outline-variant">
            {visibleTabs.map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => { 
                  setActiveTab(tab); 
                  if (!date) {
                    setDate(getDefaultDepartureTime());
                  }
                  if (tab === 'round') {
                    const minReturn = getMinReturnDateTime(date || getDefaultDepartureTime(), tripReq.minRealisticHours);
                    if (returnDate && returnDate < minReturn) {
                      setReturnDate(minReturn);
                    }
                  }
                  if (tab === 'local') {
                    if (autoCalculate) {
                      setShowResult(true);
                    } else {
                      setShowResult(false);
                    }
                  } else if (pickup && drop && distance) {
                    setShowResult(true);
                  } else {
                    setShowResult(false);
                  }
                }}
                className={`flex-1 py-2 px-2.5 sm:px-4 text-xs font-bold rounded-m3-full transition-all flex items-center justify-center gap-1 min-h-[38px] sm:min-h-[42px] cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary ${
                  activeTab === tab 
                    ? 'bg-m3-primary text-m3-on-primary shadow-m3-1' 
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest'
                }`}
              >
                <span className="capitalize">{tab === 'local' ? (isTa ? 'லோக்கல் பேக்கேஜ்' : 'Local Package') : (isTa ? 'சுற்றுப்பயணம் (இரு வழி)' : 'Outstation (Round Trip)')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Body — Material 3 Standard Spacing */}
      <div className={`p-3 sm:p-4 space-y-2.5 sm:space-y-3`}>
        {errors.global && (
          <p role="alert" className="text-xs sm:text-sm text-m3-error bg-m3-error-container/30 border border-m3-error/30 rounded-m3-md px-3 py-2 leading-snug flex items-center gap-1.5 font-medium animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-m3-error shrink-0" />
            <span>{errors.global}</span>
          </p>
        )}

        {/* 1-Line Trip Summary Bar (When Quote is Displayed) — MakeMyTrip / Savaari Pattern for Zero-Scroll Initial View */}
        {showResult && (airportDetected || estimate > 0) && (
          <div className="space-y-2">
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-2xs">
              <div className="min-w-0 pr-1">
                <div className="font-bold text-slate-900 text-xs sm:text-sm truncate flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                  <span className="truncate">{pickup ? pickup.split(',')[0] : 'Chennai'}</span>
                  <span className="text-slate-400">➔</span>
                  <span className="truncate">{drop ? drop.split(',')[0] : (activeTab === 'local' ? (isTa ? 'லோக்கல் டூர்' : 'Local Tour') : (isTa ? 'சேருமிடம்' : 'Destination'))}</span>
                </div>
                <div className="text-slate-500 text-[11px] font-medium mt-0.5 truncate flex items-center gap-2">
                  <span>{date ? date.replace('T', ' ') : ''}</span>
                  <span>•</span>
                  <span className="capitalize">{airportDetected ? (isTa ? 'ஏர்போர்ட் பயணம்' : 'Airport Transfer') : activeTab === 'local' ? (localPackage === '5hr50km' ? '5 Hr/50 Km' : localPackage === '8hr80km' ? '8 Hr/80 Km' : localPackage === '10hr100km' ? '10 Hr/100 Km' : '12 Hr/120 Km') : activeTab === 'round' ? `${days || 1} Day${(days || 1) > 1 ? 's' : ''}` : (isTa ? 'சுற்றுப்பயணம்' : 'Round Trip')}</span>
                  {distance > 0 && <span>• ~{distance.toFixed(0)} km</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowResult(false);
                  setTimeout(() => {
                    const pEl = document.getElementById(`${stableFormId}-pickup`);
                    if (pEl) pEl.focus();
                  }, 100);
                }}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-blue-600 font-bold text-xs shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer hover:border-blue-400 transition-colors"
                title={isTa ? 'பயண விவரங்களை மாற்ற' : 'Edit pickup, drop or dates'}
              >
                <Edit2 className="w-3 h-3" />
                <span>{isTa ? 'மாற்று' : 'Edit'}</span>
              </button>
            </div>

            {/* Quick Package Switcher Pills inside Quote View for 1-Tap Switching */}
            {activeTab === 'local' && (
              <div className="flex justify-center pb-0.5">
                <div className="bg-m3-surface-container-high p-1 rounded-m3-lg flex text-[11px] sm:text-xs font-bold w-full border border-m3-outline-variant gap-1">
                  {['5hr50km', '8hr80km', '10hr100km', '12hr120km'].map(pkg => (
                    <button
                      key={`quote-${pkg}`}
                      type="button"
                      onClick={() => setLocalPackage(pkg)}
                      className={`flex-1 px-1.5 py-1.5 rounded-m3-md transition-all min-h-[34px] font-bold ${localPackage === pkg ? 'bg-white text-m3-primary shadow-m3-1 border border-m3-outline-variant/60' : 'text-m3-on-surface-variant hover:text-m3-on-surface'}`}
                    >
                      {pkg === '5hr50km' ? (isTa ? '5 மணி/50 கிமீ' : '5h / 50km') : pkg === '8hr80km' ? (isTa ? '8 மணி/80 கிமீ' : '8h / 80km') : pkg === '10hr100km' ? (isTa ? '10 மணி/100 கிமீ' : '10h / 100km') : (isTa ? '12 மணி/120 கிமீ' : '12h / 120km')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Inputs & Calculate CTA — Hidden when Quote is displayed, keeping DOM nodes/IDs intact */}
        <div className={showResult && (airportDetected || estimate > 0) ? 'hidden' : 'space-y-3 sm:space-y-3.5'}>

        {/* Local Package Selection */}
            {activeTab === 'local' && (
              <div className="flex justify-center pb-0.5">
                <div className="bg-m3-surface-container-high p-1 rounded-m3-lg flex text-[11px] sm:text-xs font-bold w-full border border-m3-outline-variant gap-1">
                  {['5hr50km', '8hr80km', '10hr100km', '12hr120km'].map(pkg => (
                    <button
                      key={pkg}
                      type="button"
                      onClick={() => setLocalPackage(pkg)}
                      className={`flex-1 px-1.5 py-2 rounded-m3-md transition-all min-h-[36px] font-bold ${localPackage === pkg ? 'bg-white text-m3-primary shadow-m3-1 border border-m3-outline-variant/60' : 'text-m3-on-surface-variant hover:text-m3-on-surface'}`}
                    >
                      {pkg === '5hr50km' ? (isTa ? '5 மணி / 50 கிமீ' : '5h / 50km') : pkg === '8hr80km' ? (isTa ? '8 மணி / 80 கிமீ' : '8h / 80km') : pkg === '10hr100km' ? (isTa ? '10 மணி / 100 கிமீ' : '10h / 100km') : (isTa ? '12 மணி / 120 கிமீ' : '12h / 120km')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Pickup Location Input Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={activeTab === 'local' ? 'local-pickup-input' : 'pickup-input'} className="text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
                  <span>{isTa ? 'சென்னையில் பிக்கப் இடம்' : 'Pickup Location in Chennai'}</span>
                </label>
                <span className="text-xs text-slate-500 font-normal hidden sm:inline">
                  {isTa ? 'வீட்டு வாசலில் பிக்கப் சேர்க்கப்பட்டுள்ளது' : 'Doorstep Pickup Included'}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id={activeTab === 'local' ? 'local-pickup-input' : 'pickup-input'}
                  ref={pickupInputRef}
                  type="text"
                  autoComplete="street-address"
                  autoCorrect="off"
                  inputMode="text"
                  enterKeyHint="next"
                  aria-label={isTa ? 'சென்னையில் பிக்கப் இடம்' : 'Pickup Location in Chennai'}
                  value={pickup}
                  onChange={(e) => {
                    const val = e.target.value;
                    pickupPlaceRef.current = null;
                    setPickup(val);
                    pickupValueRef.current = val;
                    setDistance(null);
                    setShowResult(false);
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.global;
                      delete next.location;
                      delete next.pickup;
                      return next;
                    });
                  }}
                  onFocus={handleLocationFocus}
                  placeholder={isTa ? 'எ.கா: தி.நகர், ஏர்போர்ட், சென்ட்ரல்' : 'e.g. T. Nagar, Central, Airport, OMR'}
                  className={`w-full min-h-[48px] bg-slate-50/50 hover:bg-white focus:bg-white border rounded-m3-lg px-3.5 py-3 text-sm ${
                    errors.pickup 
                      ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/10' 
                      : 'border-slate-200/90 hover:border-slate-300 focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15'
                  } ${pickup ? 'text-m3-on-surface font-semibold' : 'text-m3-on-surface font-normal'} placeholder:text-sm placeholder:text-m3-on-surface-variant/75 placeholder:font-normal outline-none transition-all pr-20 shadow-2xs`}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  {pickup && (
                    <button
                      type="button"
                      onClick={() => {
                        pickupPlaceRef.current = null;
                        setPickup('');
                        pickupValueRef.current = '';
                        setDistance(null);
                        setShowResult(false);
                      }}
                      aria-label="Clear pickup location"
                      title="Clear pickup location"
                      className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full hover:bg-m3-surface-container active:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handlePinClick('pickup')}
                    aria-label={isTa ? "வரைபடத்தில் பிக்-அப் இடத்தை குறிக்கவும்" : "Pinpoint pickup on map"}
                    title={isTa ? "வரைபடத்தில் பிக்-அப் இடத்தை குறிக்கவும்" : "Pinpoint pickup on map"}
                    className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-m3-md hover:bg-m3-surface-container active:scale-95 active:bg-m3-surface-container-high text-m3-primary hover:bg-m3-primary/10 transition-all cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-m3-primary" />
                  </button>
                </div>
              </div>

              {errors.pickup && (
                <p className="text-xs text-m3-error font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.pickup}</span>
                </p>
              )}
            </div>

            {/* 2. Drop Location Field */}
            <div className={activeTab === 'local' ? 'hidden' : 'space-y-1.5'}>
              <div className="flex items-center justify-between">
                <label htmlFor="drop-input" className="text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-m3-on-surface-variant shrink-0" />
                  <span>{isTa ? 'டிராப் இடம் / சேருமிடம்' : 'Drop Location / City'}</span>
                </label>
                {distance ? (
                  <span className="text-xs font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-m3-outline-variant/50">
                    ~{activeTab === 'round' ? (distance * 2).toFixed(0) : distance.toFixed(0)} km {activeTab === 'round' ? 'Round Trip' : 'One Way'} • {tripReq.drivingText}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-normal hidden sm:inline">
                    {isTa ? 'தென்னிந்தியா முழுவதும் சேவை' : 'Anywhere in South India'}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  id="drop-input"
                  ref={dropInputRef}
                  type="text"
                  autoComplete="street-address"
                  autoCorrect="off"
                  inputMode="text"
                  enterKeyHint="next"
                  aria-label={isTa ? 'டிராப் இடம் / சேருமிடம்' : 'Drop Location / City'}
                  value={drop}
                  onChange={(e) => {
                    const val = e.target.value;
                    dropPlaceRef.current = null;
                    setDrop(val);
                    dropValueRef.current = val;
                    setDistance(null);
                    setShowResult(false);
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.global;
                      delete next.location;
                      delete next.drop;
                      return next;
                    });
                  }}
                  onFocus={handleLocationFocus}
                  placeholder={isTa ? 'எ.கா: பாண்டிச்சேரி, திருப்பதி' : 'e.g. Pondicherry, Tirupati, Bangalore'}
                  className={`w-full min-h-[48px] bg-slate-50/50 hover:bg-white focus:bg-white border rounded-m3-lg px-3.5 py-3 text-sm ${
                    errors.drop 
                      ? 'border-m3-error ring-1 ring-m3-error bg-m3-error-container/10' 
                      : 'border-slate-200/90 hover:border-slate-300 focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15'
                  } ${drop ? 'text-m3-on-surface font-semibold' : 'text-m3-on-surface font-normal'} placeholder:text-sm placeholder:text-m3-on-surface-variant/75 placeholder:font-normal outline-none transition-all pr-20 shadow-2xs`}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  {drop && (
                    <button
                      type="button"
                      onClick={() => {
                        dropPlaceRef.current = null;
                        setDrop('');
                        dropValueRef.current = '';
                        setDistance(null);
                        setShowResult(false);
                      }}
                      aria-label="Clear drop location"
                      title="Clear drop location"
                      className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full hover:bg-m3-surface-container active:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handlePinClick('drop')}
                    aria-label={isTa ? "வரைபடத்தில் சேருமிடத்தை குறிக்கவும்" : "Pinpoint drop on map"}
                    title={isTa ? "வரைபடத்தில் சேருமிடத்தை குறிக்கவும்" : "Pinpoint drop on map"}
                    className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-m3-md hover:bg-m3-surface-container active:scale-95 active:bg-m3-surface-container-high text-m3-primary hover:bg-m3-primary/10 transition-all cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-m3-primary" />
                  </button>
                </div>
              </div>
              {errors.drop && (
                <p className="text-xs text-m3-error font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.drop}</span>
                </p>
              )}

              {/* Popular Outstation Route Quick Chips (when drop is empty) */}
              {!drop && activeTab !== 'local' && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isTa ? 'பிரபலமான வழிகள்:' : 'Popular:'}
                  </span>
                  {[
                    { label: 'Tirupati', val: 'Tirupati, Andhra Pradesh' },
                    { label: 'Pondicherry', val: 'Pondicherry, Tamil Nadu' },
                    { label: 'Mahabalipuram', val: 'Mahabalipuram, Tamil Nadu' },
                    { label: 'Kumbakonam', val: 'Kumbakonam, Tamil Nadu' },
                    { label: 'Bangalore', val: 'Bangalore, Karnataka' }
                  ].map(city => (
                    <button
                      key={city.label}
                      type="button"
                      onClick={() => {
                        setDrop(city.val);
                        dropValueRef.current = city.val;
                        const known = findKnownDistance(pickup || 'Chennai', city.val);
                        if (known) {
                          applyResolvedDistance(known.distance, known.duration);
                        } else {
                          calculateDistance(pickup || 'Chennai', city.val);
                        }
                      }}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#1a73e8]/10 hover:border-[#1a73e8]/40 hover:text-[#0b57d0] text-slate-700 font-semibold border border-slate-200/80 transition-all cursor-pointer text-xs shadow-2xs active:scale-95"
                    >
                      {city.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Multi-Stop / Many Places Helper Tile (4th-grade English) */}
            {activeTab !== 'local' && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/90 text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base shrink-0">🗺️</span>
                    <span className="font-bold text-slate-800 text-xs sm:text-[13px]">
                      {isTa ? 'ஒன்றுக்கும் மேற்பட்ட இடங்கள் அல்லது கோயில் பயணமா?' : 'Going to more than 1 place or temple?'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          if (window.openAiFareModal) window.openAiFareModal('multiple places');
                          else if (window.toggleAiFareModal) window.toggleAiFareModal();
                        }
                      }}
                      className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-[11px] sm:text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{isTa ? 'சுற்றுலா திட்டம்' : 'Plan My Trip'}</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {isTa 
                    ? 'எங்கள் ஓட்டுநர்கள் பல இடங்கள், கோயில்கள் மற்றும் சுற்றிப் பார்க்கும் இடங்களுக்கு மகிழ்ச்சியுடன் அழைத்துச் செல்வார்கள். முழுக் கட்டணத்தை அறிய கிளிக் செய்யவும்.'
                    : 'Visiting 2 or more towns, temples, or sightseeing spots? Get a package quote or send your places on WhatsApp!'}
                </p>
              </div>
            )}

            {/* Contextual Airport Shortcut Prompt */}
            {showAirportTab && (origLower.includes('airport') || destLower.includes('airport') || origLower.includes('maa') || destLower.includes('maa')) && (
              <div className="p-2.5 rounded-m3-lg bg-blue-50/90 border border-blue-200 flex items-center justify-between gap-2 animate-in fade-in text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Plane className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-blue-900 font-medium truncate">
                    {isTa ? 'ஏர்போர்ட் பயணம்? நிலையான கட்டணங்களை பாருங்கள்' : 'Airport trip? Check flat zone fares from ₹650'}
                  </span>
                </div>
                <a
                  href="/services/chennai-airport-taxi/"
                  className="font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2 shrink-0 flex items-center gap-0.5 text-xs"
                >
                  <span>{isTa ? 'ஏர்போர்ட் பக்கம்' : 'Airport Page'}</span>
                  <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Alternative Suggestion: Local City Package (Short Distance Round Trip) */}
            {isShortCityRoundTrip && (
              <div className="p-3 bg-amber-50/90 border border-amber-300/80 rounded-xl space-y-2 text-xs animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-800 font-bold mt-0.5">
                    💡
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-amber-950 text-xs sm:text-sm">
                      {isTa ? 'உள்ளூர் பயணத்திற்கு சிறந்த மாற்று திட்டம் உள்ளது!' : 'Short City Route Detected — Better Value with Local Package!'}
                    </div>
                    <p className="text-amber-900/90 mt-0.5 leading-relaxed text-xs">
                      {isTa 
                        ? `இந்த பயணம் ~${roundTripKm} கிமீ மட்டுமே. அவுட்ஸ்டேஷன் சுற்றுப்பயணம் குறைந்தபட்சம் 250 கிமீ/நாள் கணக்கிடும். சென்னைக்குள் பயணிக்க எங்கள் மணிநேர லோக்கல் பேக்கேஜ் தேர்வு செய்து ₹${localSavings.toLocaleString('en-IN')} வரை சேமிக்கலாம்!`
                        : `This trip is ~${roundTripKm} km round trip. Outstation cabs carry a mandatory 250 km/day interstate minimum. For travel within Chennai and suburbs, save ₹${localSavings.toLocaleString('en-IN')} with our Local Hourly Package (${recLocalPkgLabel} at ₹${recLocalPkgCost.toLocaleString('en-IN')})!`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/80 flex-wrap">
                  <div className="text-xs font-semibold text-amber-950">
                    <span>{isTa ? 'மாற்றுத் திட்டம்:' : 'Alternative:'} </span>
                    <strong className="text-emerald-800 font-bold">{recLocalPkgLabel} (₹{recLocalPkgCost.toLocaleString('en-IN')})</strong>
                    {localSavings > 0 && <span className="ml-1 text-emerald-700 font-bold">• {isTa ? `₹${localSavings.toLocaleString('en-IN')} சேமிப்பு` : `Save ₹${localSavings.toLocaleString('en-IN')}`}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={handleSwitchToLocalPackage}
                    className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <span>{isTa ? 'லோக்கல் பேக்கேஜிற்கு மாறவும்' : 'Switch to Local Package'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Dedicated Mahabalipuram ECR Tour Package Suggestion */}
            {isMahabalipuramTour && activeTab === 'round' && (
              <div className="p-3 bg-blue-50/95 border border-blue-200 rounded-xl space-y-2 text-xs animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-800 font-bold mt-0.5">
                    🏛️
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-blue-950 text-xs sm:text-sm">
                      {isTa ? 'மாமல்லபுரம் 1-நாள் சிறப்பு சுற்றுலா பேக்கேஜ்!' : 'Looking for a Mahabalipuram Day Tour?'}
                    </div>
                    <p className="text-blue-900/90 mt-0.5 leading-relaxed text-xs">
                      {isTa 
                        ? 'கடற்கரை கோவில், பஞ்ச ரதங்கள், வெண்ணெய் உருண்டைக்கல் மற்றும் கோவளம் கடற்கரையை சுற்றிப்பார்க்க எங்கள் 8 மணிநேரம் / 120 கிமீ சிறப்பு சுற்றுலா திட்டத்தை தேர்வு செய்யவும்.'
                        : 'Visiting Shore Temple, Five Rathas, Arjuna’s Penance & Kovalam Beach? Book our dedicated 8-Hr / 120-Km Day Tour package with curated photo stops & verified drivers!'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-blue-200/80 flex-wrap">
                  <div className="text-xs font-semibold text-blue-950">
                    <span>{isTa ? 'சுற்றுலா கட்டணம்:' : 'Day Tour Package:'} </span>
                    <strong className="text-blue-900 font-bold">8 Hrs / 120 Km (From ₹3,500 Sedan)</strong>
                  </div>
                  <a
                    href="/services/mahabalipuram-ecr-temple-route/"
                    className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <span>{isTa ? 'சுற்றுலா திட்டம் பார்க்க' : 'View Mahabalipuram Package'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Local Package Coverage Banner */}
            {activeTab === 'local' && (
              <div className="min-h-[44px] py-2.5 px-3.5 rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/60 flex items-center justify-between gap-2 text-xs text-m3-on-surface">
                <div className="flex items-center gap-2 min-w-0">
                  <Navigation className="w-3.5 h-3.5 text-m3-primary shrink-0" />
                  <span className="truncate">
                    <strong className="text-m3-on-surface font-bold">{isTa ? 'பேக்கேஜ் எல்லை:' : 'Coverage:'}</strong>{' '}
                    <span className="font-semibold text-m3-on-surface-variant">Chennai City Limits ({localPackage === '5hr50km' ? '5 Hrs / 50 Km' : localPackage === '8hr80km' ? '8 Hrs / 80 Km' : localPackage === '10hr100km' ? '10 Hrs / 100 Km' : '12 Hrs / 120 Km'})</span>
                  </span>
                </div>
                <span className="text-xs font-semibold text-m3-on-surface-variant bg-m3-surface-container-high px-2 py-0.5 rounded border border-m3-outline-variant/60 shrink-0">
                  City Sightseeing
                </span>
              </div>
            )}

            {/* 3. Dual Date Pickers (Twin Interactive Tile Cards) */}
            <div className="space-y-2">
              <div className={`grid ${activeTab === 'round' ? 'grid-cols-2' : 'grid-cols-1'} gap-2 sm:gap-3`}>
                {/* Pickup Date Tile */}
                <div className="group relative rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/15 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label 
                      htmlFor={`${stableFormId}-pickup-date-main`} 
                      className="text-xs font-medium text-slate-600 flex items-center gap-1.5 cursor-pointer truncate"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                      <span className="truncate">{isTa ? 'புறப்படும் தேதி & நேரம்' : 'Pickup Date & Time'}</span>
                    </label>
                  </div>
                  <input
                    id={`${stableFormId}-pickup-date-main`}
                    type="datetime-local"
                    value={date}
                    min={getMinDateTime()}
                    onChange={(e) => handlePickupDateChange(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-m3-on-surface outline-none cursor-pointer p-0"
                  />
                  {activeTab === 'oneway' && distance && date && (
                    <div className="mt-1 pt-1 border-t border-m3-outline-variant/40 flex items-center justify-between text-xs text-m3-on-surface-variant font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#1a73e8]" />
                        <span>{isTa ? 'சேருமிடம் நேரம்:' : 'Est. Arrival:'}</span>
                      </span>
                      <span className="font-bold text-m3-on-surface">
                        {getEstimatedArrival(date, tripReq.oneWayHours)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Return Date Tile (for Round Trip) */}
                {activeTab === 'round' && (
                  <div className={`group relative rounded-xl border transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer ${
                    errors.returnDate
                      ? 'border-m3-error bg-m3-error-container/20 ring-1 ring-m3-error'
                      : returnClampedNotice 
                        ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-400/30' 
                        : 'border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/15'
                  }`}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <label 
                        htmlFor={`${stableFormId}-return-date-main`} 
                        className="text-xs font-medium text-slate-600 flex items-center gap-1.5 cursor-pointer truncate"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                        <span className="truncate">{isTa ? 'திரும்பும் தேதி' : 'Return Date'}</span>
                      </label>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        returnDate 
                          ? 'text-[#0b57d0] bg-[#1a73e8]/10' 
                          : 'text-amber-800 bg-amber-100/80 border border-amber-300/60'
                      }`}>
                        {returnDate 
                          ? `${days} ${days > 1 ? (isTa ? 'நாட்கள்' : 'Days') : (isTa ? 'நாள்' : 'Day')}` 
                          : (isTa ? 'தேர்வு செய்க' : 'Select')}
                      </span>
                    </div>
                    <input
                      id={`${stableFormId}-return-date-main`}
                      type="datetime-local"
                      value={returnDate}
                      min={minReturnDateTime}
                      onChange={(e) => handleReturnDateChange(e.target.value)}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val && minReturnDateTime && val < minReturnDateTime) {
                          setReturnDate(minReturnDateTime);
                          setReturnClampedNotice(true);
                          setTimeout(() => setReturnClampedNotice(false), 3500);
                        }
                      }}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-m3-on-surface outline-none cursor-pointer p-0"
                    />
                    {errors.returnDate && (
                      <div className="mt-1 pt-1 border-t border-m3-error/30 flex items-center gap-1 text-xs text-m3-error font-semibold">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.returnDate}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {scheduleAdvisory && (
                <div className={`p-2 sm:p-2.5 rounded-m3-lg border text-xs flex items-start gap-2 animate-in fade-in ${
                  returnClampedNotice 
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs' 
                    : 'bg-m3-surface-container-low border-m3-outline-variant/60 text-m3-on-surface'
                }`}>
                  {returnClampedNotice ? (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-m3-on-surface-variant shrink-0 mt-0.5" />
                  )}
                  <div className="leading-snug">
                    <strong className="font-bold">
                      {returnClampedNotice 
                        ? (isTa ? 'நேரம் சரிசெய்யப்பட்டது:' : 'Schedule Locked:') 
                        : (isTa ? 'நடைமுறை பயண ஆலோசனை:' : 'Realistic Travel Advisory:')
                      }
                    </strong>{' '}
                    {scheduleAdvisory}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Passengers & Vehicle Selection Tiles (Omitted in tempoOnly mode for seamless MakeMyTrip / Uber 1-step search) */}
            {!tempoOnly && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Passenger Tile */}
                <div className="group relative rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/15 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label 
                      htmlFor={`${stableFormId}-passengers`} 
                      className="text-xs font-medium text-slate-600 flex items-center gap-1.5 cursor-pointer truncate"
                    >
                      <Users className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                      <span className="truncate">{isTa ? 'பயணிகள்' : 'Passengers'}</span>
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      id={`${stableFormId}-passengers`}
                      value={passengers}
                      onChange={(e) => handlePassengerChange(e.target.value)}
                      className="w-full bg-transparent appearance-none outline-none cursor-pointer pr-5 text-xs sm:text-sm font-semibold text-m3-on-surface truncate p-0"
                    >
                      {activePassengerOptions.map(opt => (
                        <option key={opt.value} value={opt.value} className="text-m3-on-surface font-semibold">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 shrink-0" />
                  </div>
                </div>

                {/* Vehicle Model Tile */}
                <div className="group relative rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 focus-within:border-[#1a73e8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/15 transition-all p-2 sm:p-2.5 shadow-2xs cursor-pointer">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label 
                      htmlFor={`${stableFormId}-vehicle`} 
                      className="text-xs font-medium text-slate-600 flex items-center gap-1.5 cursor-pointer truncate"
                    >
                      <Car className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                      <span className="truncate">{isTa ? 'வாகனம்' : (tempoOnly ? 'Force Tempo / Urbania' : 'Vehicle Model')}</span>
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      id={`${stableFormId}-vehicle`}
                      value={vehicle}
                      onChange={(e) => {
                        setVehicle(e.target.value);
                        if (!isAuto) setShowResult(false);
                      }}
                      className="w-full bg-transparent appearance-none outline-none cursor-pointer pr-5 text-xs sm:text-sm font-semibold text-m3-on-surface truncate p-0"
                    >
                      {activeVehicleOptions.map(opt => (
                        <option key={opt} value={opt} className="text-m3-on-surface font-semibold">
                          {activeVehicles[opt]?.name || opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-m3-on-surface-variant pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 shrink-0" />
                  </div>
                </div>
              </div>
            )}

            {/* PRIMARY CTA BUTTON (Compact & Centered Google Blue Button) */}
            <div className="pt-1.5 space-y-1.5 flex flex-col items-center justify-center">
              <button
                id="btn-calculate-fare"
                type="button"
                disabled={loading}
                onClick={handleCalculateCost}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isTa ? 'கணக்கிடுகிறது...' : 'Calculating Fare...'}</span>
                  </>
                ) : (
                  <span>{isTa ? 'கட்டணம் பார்க்கவும்' : 'View Instant Fare'}</span>
                )}
              </button>
              <p className="text-xs text-m3-on-surface-variant/80 text-center font-medium max-w-sm">
                {isTa ? 'கட்டணம் பார்க்க தொலைபேசி எண் தேவையில்லை' : 'No phone number required to check fare'}
              </p>

              {/* Smart Airport Quick-Access Callout */}
              {showAirportTab && !showResult && (
                <div className="w-full pt-1.5">
                  <a
                    href="/services/chennai-airport-taxi/"
                    className="flex items-center justify-between p-2.5 px-3.5 bg-m3-surface-container-high hover:bg-m3-surface-container-highest border border-m3-outline-variant hover:border-m3-primary/40 rounded-m3-xl transition-all text-xs group cursor-pointer"
                    title={isTa ? 'சென்னை ஏர்போர்ட் டாக்ஸி முன்பதிவு' : 'Chennai Airport Taxi Transfers'}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1 sm:p-1.5 bg-m3-primary/10 text-m3-primary rounded-m3-full shrink-0 group-hover:scale-110 transition-transform">
                        <Plane className="w-3.5 h-3.5" />
                      </span>
                      <div className="truncate text-left">
                        <span className="font-bold text-m3-on-surface">
                          {isTa ? 'சென்னை ஏர்போர்ட் டாக்ஸியா?' : 'Need Chennai Airport Pickup / Drop?'}
                        </span>
                        <span className="hidden sm:inline text-m3-on-surface-variant ml-1.5 text-xs">
                          {isTa ? 'நிலையான கட்டணம் ₹650 முதல்' : 'Flat rates from ₹650 • Flight delay tracking'}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-m3-primary shrink-0 group-hover:translate-x-0.5 transition-transform">
                      {isTa ? 'கட்டணங்கள்' : 'Airport Cabs'} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </a>
                </div>
              )}
            </div>
        </div>

        {/* Dynamic Fare Result & Actions Area — Rate Summary with Complete Itemized Breakdown */}
        {showResult && (airportDetected || estimate > 0) && (
          <div ref={resultRef} id="quotation-fare-result-card" className="space-y-2.5 animate-in fade-in duration-200">
            
            {/* Airport Transfer Result Card */}
            {airportDetected ? (
              <div className="bg-white border border-blue-200 rounded-2xl p-3 sm:p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-blue-100 text-xs flex-wrap">
                  <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                    {isTa ? `மேற்கோள் எண்: ${quoteRefId}` : `Quote Ref: ${quoteRefId}`}
                  </span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{isTa ? 'நிலையான கட்டணம் • உயர்வு இல்லை' : 'Fixed Flat Fare • Zero Surge'}</span>
                  </span>
                </div>

                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-blue-950 text-sm">
                        {isTa ? 'சென்னை ஏர்போர்ட் டாக்ஸி முன்பதிவு' : 'Chennai Airport Transfer (MAA)'}
                      </div>
                      <p className="text-blue-900/90 text-xs mt-0.5 leading-relaxed">
                        {isTa
                          ? 'சென்னை ஏர்போர்ட் பிக்கப் மற்றும் டிராப்பிற்கு நிலையான கட்டணங்கள் (ரூ. 650 முதல்). விமான கண்காணிப்பு மற்றும் 60 நிமிட இலவச காத்திருப்பு நேரம் சேர்க்கப்பட்டுள்ளது.'
                          : 'Guaranteed flat airport fares from ₹650. Live flight radar tracking, zero delay waiting charges & doorstep pickup included.'}
                      </p>
                    </div>
                  </div>

                  {/* Airport Vehicle Price Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { name: 'Sedan (4 Pax)', fare: getAirportTransferEstimate(drop || pickup, 'Swift Dzire') },
                      { name: 'Ertiga (6 Pax)', fare: getAirportTransferEstimate(drop || pickup, 'Maruti Ertiga') },
                      { name: 'Innova (7 Pax)', fare: getAirportTransferEstimate(drop || pickup, 'Innova') },
                      { name: 'Tempo (12 Pax)', fare: getAirportTransferEstimate(drop || pickup, 'Tempo Traveller') }
                    ].map(item => (
                      <div key={item.name} className="p-2 bg-white rounded-lg border border-blue-200 text-center shadow-2xs">
                        <div className="text-[11px] font-semibold text-slate-600 truncate">{item.name}</div>
                        <div className="text-sm font-extrabold text-blue-900 mt-0.5">₹{item.fare.toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Airport Action Buttons */}
                <div className="pt-1 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href="/services/chennai-airport-taxi/"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer min-h-[42px]"
                    >
                      <span>{isTa ? 'முழுமையான ஏர்போர்ட் கட்டணங்களை பார்க்க' : 'View Airport Transfers & Book (From ₹650)'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={handleWhatsAppAirport}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer min-h-[42px]"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      <span>{isTa ? 'வாட்ஸ்அப்' : 'WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Rate Summary Card: Standard Layout matching Airport & Outstation Engines */
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-sm">
                
                {/* 1. Official Quote Reference & 24-Hr Rate Lock Guaranteed Header */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs text-slate-500 font-medium">
                  <span className="font-mono font-bold text-slate-700">
                    {isTa ? `மேற்கோள்: ${quoteRefId}` : `Quote Ref: ${quoteRefId}`}
                  </span>
                  <span className="flex items-center gap-1 text-slate-600 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{isTa ? '24 மணிநேர கட்டண உத்தரவாதம்' : 'Rate Locked for 24 Hrs'}</span>
                  </span>
                </div>

                {/* City Auto-Routed Notice (if automatically routed from intra-city route) */}
                {cityAutoRouted && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-blue-950 font-medium">
                      <span className="text-base shrink-0">💡</span>
                      <span className="leading-snug">
                        {isTa 
                          ? `உள்ளூர் பயணம் கண்டறியப்பட்டது: எங்கள் ${recLocalPkgLabel} லோக்கல் பேக்கேஜ் (₹${estimate.toLocaleString('en-IN')}) தேர்வு செய்யப்பட்டுள்ளது. ஏசி வாகனம் மற்றும் ஓட்டுநர் சேவை உட்பட.`
                          : `Intra-city route detected: Showing our ${recLocalPkgLabel} Local City Package (₹${estimate.toLocaleString('en-IN')}) with private AC car & dedicated chauffeur.`}
                      </span>
                    </div>
                  </div>
                )}

                  {/* 2. Sleek Segmented Vehicle Tabs (Savaari Style - Clean, No Price Duplication) */}
                  <div className="pb-2 border-b border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      <span>{isTa ? 'வாகனத்தை தேர்வு செய்யவும்:' : 'Select Vehicle:'}</span>
                      <span className="text-[11px] font-normal text-slate-400 capitalize">
                        {isTa ? '1-தட்டலில் மாற்றலாம்' : 'Tap to switch'}
                      </span>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      {activeComparisonVehicles.map((v) => {
                        const isSelected = vehicle === v.key;
                        return (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => {
                              setVehicle(v.key);
                              setPassengers(String(v.maxPax));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#1a73e8] text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{v.name}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>({v.maxPax}p)</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Local Package Alternative Banner (if short city ride) */}
                  {isShortCityRoundTrip && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-amber-950 flex items-center gap-1.5">
                          <span>💡</span>
                          <span>{isTa ? 'மாற்றுத் திட்டம்: உள்ளூர் பேக்கேஜ்' : 'Better Alternative: Local City Package'}</span>
                        </span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {isTa ? `₹${localSavings.toLocaleString('en-IN')} சேமிக்கலாம்` : `Save ₹${localSavings.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <p className="text-amber-900 text-xs leading-snug">
                        {isTa 
                          ? `இது ~${roundTripKm} கிமீ உள்ளூர் பயணம். 250 கிமீ அவுட்ஸ்டேஷன் மினிமம் கட்டணம் (₹${estimate.toLocaleString('en-IN')}) செலுத்துவதற்கு பதில், எங்கள் ${recLocalPkgLabel} பேக்கேஜ் (₹${recLocalPkgCost.toLocaleString('en-IN')}) தேர்வு செய்யலாம்.`
                          : `This is a ~${roundTripKm} km city ride. Instead of paying the outstation minimum (₹${estimate.toLocaleString('en-IN')}), our ${recLocalPkgLabel} package is just ₹${recLocalPkgCost.toLocaleString('en-IN')}.`}
                      </p>
                      <button
                        type="button"
                        onClick={handleSwitchToLocalPackage}
                        className="mt-1 px-3 py-1 bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{isTa ? `லோக்கல் பேக்கேஜிற்கு மாறு (₹${recLocalPkgCost.toLocaleString('en-IN')})` : `Switch to Local Package (₹${recLocalPkgCost.toLocaleString('en-IN')})`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* 3. MakeMyTrip / Savaari Style Fare Card with 3-Stage Payment Timeline */}
                  {(() => {
                    const isTempoBooking = tempoOnly || (vehicle && (vehicle.toLowerCase().includes('tempo') || vehicle.toLowerCase().includes('urbania')));
                    const is50PercentPayment = isTempoBooking || activeTab !== 'local';
                    const advanceAmount = is50PercentPayment ? Math.round(estimate * 0.5) : 500;
                    const balanceAmount = Math.max(0, estimate - advanceAmount);
                    
                    const currentVehData = activeVehicles[vehicle] || (tempoOnly ? TEMPO_VEHICLES['12-Seater Luxury Force Tempo'] : vehicles['Swift Dzire']);
                    const extraKmPrice = currentVehData?.extra_km_rate || currentVehData?.round_trip_rate || (tempoOnly ? 24 : 14);
                    const extraHrPrice = currentVehData?.extra_hr_rate || (tempoOnly ? 350 : 150);
                    
                    const coveredKm = Math.round(
                      activeTab === 'local'
                        ? (localPackage === '10hr100km' ? 100 : localPackage === '12hr120km' ? 120 : localPackage === '8hr80km' ? 80 : localPackage === '4hr40km' ? 40 : 50)
                        : (breakdown?.chargeable_km || ((days || 1) * (currentVehData?.min_km_per_day || (tempoOnly ? 300 : 250))))
                    );
                    const packageDaysCount = days || 1;

                    const kmRate = breakdown?.rate_per_km || (activeTab === 'round' ? currentVehData?.round_trip_rate : currentVehData?.one_way_rate) || (tempoOnly ? 25 : 14);
                    const driverBataTotal = breakdown?.driver_bata !== undefined ? breakdown.driver_bata : (activeTab === 'local' ? 0 : (packageDaysCount * (currentVehData?.driver_bata || (tempoOnly ? 800 : 400))));
                    const kmCostTotal = breakdown?.km_cost || Math.max(0, estimate - driverBataTotal);

                    const localPkgLabel = localPackage === '5hr50km' 
                      ? (isTa ? '5 மணி/50 கிமீ' : '5 Hr / 50 Km')
                      : localPackage === '8hr80km'
                        ? (isTa ? '8 மணி/80 கிமீ' : '8 Hr / 80 Km')
                        : localPackage === '10hr100km'
                          ? (isTa ? '10 மணி/100 கிமீ' : '10 Hr / 100 Km')
                          : (isTa ? '12 மணி/120 கிமீ' : '12 Hr / 120 Km');

                    return (
                      <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-3 sm:p-4 text-left space-y-3">
                        {/* 1. Hero Header: Vehicle & Clean Total Fare */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-2.5 border-b border-slate-200">
                          <div>
                            <span className="text-base font-extrabold text-slate-900 block">
                              {vehicle}
                            </span>
                            <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                              {tempoOnly ? (isTa ? 'ஏசி • சொகுசு புஷ்பேக் இருக்கைகள் • மியூசிக் சிஸ்டம்' : 'AC • Luxury Pushback Seats • Sound System') : (isTa ? 'ஏசி • தொழில்முறை ஓட்டுநர் • சுத்தமான கேப்' : 'AC • Professional Chauffeur • Clean Cab')}
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-start sm:items-end shrink-0">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              {isTa ? 'மொத்த பயணக் கட்டணம்' : 'Total Fare'}
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-heading leading-tight block">
                              ₹{estimate.toLocaleString('en-IN')}
                            </span>
                            
                            {/* Immediate Tolls & Parking Qualification (Outstation / One-Way) */}
                            {activeTab !== 'local' && (
                              <span className="text-xs font-semibold text-amber-800/90 mt-0.5 block">
                                {isTa ? '+ டோல் & பார்க்கிங் தனி (ரசீதுப்படி)' : '+ Tolls & parking extra (as per actual receipts)'}
                              </span>
                            )}

                            {/* Clear Package Limit & Overage Info (Clean Savaari Typography) */}
                            <span className="text-xs font-semibold text-slate-700 mt-1 block">
                              {activeTab === 'local' ? (
                                isTa 
                                  ? `${localPkgLabel} அடங்கும் • கூடுதல்: ₹${extraKmPrice}/கிமீ | ₹${extraHrPrice}/மணி` 
                                  : `Includes ${localPkgLabel} • Extra: ₹${extraKmPrice}/km | ₹${extraHrPrice}/hr`
                              ) : (
                                isTa
                                  ? `${coveredKm} கிமீ அடங்கும் (${packageDaysCount} ${packageDaysCount > 1 ? 'நாட்கள்' : 'நாள்'}) • கூடுதல்: ₹${extraKmPrice}/கிமீ`
                                  : `Includes ${coveredKm} km (${packageDaysCount} ${packageDaysCount > 1 ? 'Days' : 'Day'}) • Extra: ₹${extraKmPrice}/km`
                              )}
                            </span>
                          </div>
                        </div>

                        {/* 2. Reassuring 1-Line Payment Schedule (Savaari Style - Zero Duplicate Numbers) */}
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="text-base shrink-0">💳</span>
                            <span className="font-semibold text-slate-800">
                              {is50PercentPayment 
                                ? (isTa ? 'கட்டணம்: வாகனம் வந்ததும் 50%, மீதி பயணம் முடிந்ததும்' : 'Payment: Pay 50% on cab arrival, balance after trip ends')
                                : (isTa ? 'கட்டணம்: முன்பணம் ₹500, மீதி பயணம் முடிந்ததும்' : 'Payment: ₹500 advance to confirm, balance after trip ends')}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                            {isTa ? 'பாதுகாப்பானது' : 'Transparent'}
                          </span>
                        </div>

                          {/* Subtle Expandable Fare Breakup Button */}
                          <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => setShowBreakdown(prev => !prev)}
                              className="w-full px-3 py-1.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 cursor-pointer transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <Receipt className="w-3.5 h-3.5 text-slate-400" />
                                <span>{isTa ? 'கட்டண கணக்கீடு விவரம் (Fare Details)' : 'View Complete Fare Breakup'}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#1a73e8] font-bold">
                                <span>{showBreakdown ? (isTa ? 'மறைக்க' : 'Hide') : (isTa ? 'பார்க்க' : 'View')}</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showBreakdown ? 'rotate-180' : ''}`} />
                              </span>
                            </button>

                            {showBreakdown && (
                              <div className="p-3 bg-white space-y-1.5 text-xs text-slate-700 border-t border-slate-100 animate-in fade-in duration-150">
                                <div className="flex justify-between items-center py-0.5">
                                  <span className="text-slate-600">
                                    {activeTab === 'local' 
                                      ? (isTa ? `உள்ளூர் பேக்கேஜ் (${localPkgLabel} • எரிபொருள் உட்பட):` : `Local Package Base Hire (${localPkgLabel} • Fuel included):`)
                                      : (isTa ? `வாகன வாடகை (${coveredKm} கிமீ @ ₹${kmRate}/கிமீ • எரிபொருள் உட்பட):` : `Base Cab Hire (${coveredKm} km @ ₹${kmRate}/km • Fuel included):`)}
                                  </span>
                                  <span className="font-bold text-slate-900 shrink-0 ml-2">₹{kmCostTotal.toLocaleString('en-IN')}</span>
                                </div>

                                <div className="flex justify-between items-center py-0.5">
                                  <span className="text-slate-600">
                                    {activeTab === 'local'
                                      ? (isTa ? 'ஓட்டுநர் படி:' : 'Driver Allowance:')
                                      : (isTa ? `ஓட்டுநர் படி (${packageDaysCount} ${packageDaysCount > 1 ? 'நாட்கள்' : 'நாள்'}):` : `Driver Allowance (${packageDaysCount} ${packageDaysCount > 1 ? 'Days' : 'Day'}):`)}
                                  </span>
                                  <span className="font-bold text-slate-900 shrink-0 ml-2">
                                    {activeTab === 'local'
                                      ? (isTa ? '₹0 (பேக்கேஜில் அடங்கும்)' : '₹0 (Included)')
                                      : (driverBataTotal > 0 ? `₹${driverBataTotal.toLocaleString('en-IN')}` : (isTa ? '₹0 (இலவசம்)' : '₹0 (Free / Included)'))}
                                  </span>
                                </div>

                                {breakdown?.free_buffer_km > 0 && (
                                  <div className="flex justify-between items-center py-0.5 text-slate-700">
                                    <span className="text-slate-600">
                                      {isTa ? `இலவச சுற்றிப்பார்த்தல் (+${breakdown.free_buffer_km.toFixed(0)} கிமீ):` : `Free Local Sightseeing (+${breakdown.free_buffer_km.toFixed(0)} km):`}
                                    </span>
                                    <span className="font-bold text-emerald-700 shrink-0 ml-2">₹0</span>
                                  </div>
                                )}

                                {activeTab !== 'local' && (
                                  <>
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="text-slate-600">{isTa ? 'மாநில அனுமதி வரி:' : 'State Permit:'}</span>
                                      <span className="font-bold text-slate-900 shrink-0 ml-2">
                                        {breakdown?.state_permit_est > 0 ? `₹${breakdown.state_permit_est.toLocaleString('en-IN')}` : (isTa ? '₹0 (அடங்கும்)' : '₹0 (Included / Free)')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="text-slate-600">{isTa ? 'டோல் கேட் & பார்க்கிங்:' : 'Highway Tolls & Parking:'}</span>
                                      <span className="font-medium text-slate-600 shrink-0 ml-2">{isTa ? 'ரசீதுப்படி கூடுதல்' : 'Extra (Pay at actuals)'}</span>
                                    </div>
                                  </>
                                )}

                                <div className="pt-1.5 mt-1 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
                                  <span>{isTa ? 'மொத்தக் கட்டணம்:' : 'Total Calculated Fare:'}</span>
                                  <span>₹{estimate.toLocaleString('en-IN')}{activeTab !== 'local' ? (isTa ? ' + கூடுதல்' : ' + Extra') : ''}</span>
                                </div>

                                {/* Standard Inclusions & Doorstep Policy */}
                                <div className="pt-2 mt-1.5 border-t border-slate-100 space-y-1 text-[11px]">
                                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>{isTa ? '100% எரிபொருள், ஏசி & ஓட்டுநர் படி அடங்கும்' : '100% Fuel, AC & Chauffeur allowance included'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>{isTa ? 'ஷெட் கட்டணம் இல்லை (பிக்கப் இடத்திலிருந்து கணக்கீடு)' : 'Zero garage charges (Billing begins from your pickup point)'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                  {/* 5. Direct 1-Tap Booking Actions: WhatsApp & Call Desk */}
                  <div className="pt-1.5 space-y-1.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        id="book-cab-whatsapp-btn"
                        onClick={handleWhatsApp}
                        data-direct-whatsapp="true"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer min-h-[44px]"
                      >
                        <WhatsAppIcon className="w-4 h-4 shrink-0" />
                        <span>{isTa ? 'வாட்ஸ்அப்பில் முன்பதிவு செய்க' : 'Book on WhatsApp'}</span>
                      </button>

                      <a
                        href="tel:+918939539211"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer shrink-0 min-h-[44px]"
                        aria-label="Call Passenger Booking Desk +91 89395 39211"
                      >
                        <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{isTa ? 'அழைக்க' : 'Call Booking Desk'}</span>
                      </a>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center font-medium">
                      {isTa ? '24/7 முன்பதிவு உதவி: +91 89395 39211 • ₹500 முன்பணம் செலுத்தி உறுதி செய்யவும்' : '24/7 Passenger Helpline: +91 89395 39211 • Confirm ride with ₹500 advance'}
                    </p>
                  </div>
              </div>
            )}
          </div>
        )}
      </div>


      {mounted && (
        <LocationPicker
          isOpen={locationPickerOpen}
          onClose={() => setLocationPickerOpen(false)}
          onConfirm={handleLocationConfirm}
          type={pickerField}
          initialAddress={pickerField === 'pickup' ? pickup : drop}
          isTa={isTa}
        />
      )}
    </section>
  );
}

