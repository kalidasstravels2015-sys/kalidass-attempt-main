import React, { useState, useEffect, useMemo } from 'react';
import MobileDispatchCopilot from './MobileDispatchCopilot.jsx';
import tariffConfig from '../../data/tariff_config.json' with { type: 'json' };
import driversRosterData from '../../data/drivers_roster.json' with { type: 'json' };
import { getFormattedDateCode, getNextDriverRosterId } from '../../utils/sequenceGenerator.js';
import {
  VEHICLE_CATEGORIES,
  CHENNAI_ZONES,
  formatIndianPlateNumber,
  inferZoneFromAddress,
  normalizeVehicleCategory
} from '../../data/chennaiFleetStandards.js';

// Configuration keys
const PIN_KEY = 'kt_admin_pin_verified';
const GOOGLE_SHEET_URL_KEY = 'kt_admin_google_sheet_webhook_v1';
const LOCAL_BACKUP_KEY = 'kt_admin_offline_trips_backup_v1';
const DRIVERS_STORAGE_KEY = 'kt_admin_drivers_roster_v1';
const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJ8_e8xR1kUjoRh2-wL0T6j9M';

// Sample Google Apps Script template for 1-click copy
const APPS_SCRIPT_TEMPLATE = `// KALIDASS TRAVELS — GOOGLE SHEETS LIVE 2-WAY DATABASE
// Paste this in Extensions -> Apps Script in your Google Sheet, then click 'Deploy -> New deployment -> Web app'
// Set 'Execute as: Me' and 'Who has access: Anyone'. Copy the Web app URL and paste into your Dispatch Desk!

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ trips: [] })).setMimeType(ContentService.MimeType.JSON);
  }
  var headers = rows[0];
  var trips = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var trip = {};
    for (var j = 0; j < headers.length; j++) {
      trip[headers[j]] = row[j];
    }
    trips.push(trip);
  }
  return ContentService.createTextOutput(JSON.stringify({ trips: trips })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "id", "customerName", "phone", "tripCategory", "vehicle", "route",
      "pickupDate", "pickupTime", "pickupLocation", "dropLocation",
      "agreedRate", "advance", "balance", "driverName", "driverPhone",
      "vehicleNumber", "manifestStatus", "notes", "createdAt", "updatedAt"
    ]);
  }
  
  var contents = e.postData.contents;
  var data = JSON.parse(contents);
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idIndex = headers.indexOf("id");
  
  // Parse incoming payload
  var trip = data.trip;
  if (!trip && (data.bookingId || data.type === 'booking')) {
    var rawPhone = data.phone || (data.guestNamePhone ? String(data.guestNamePhone).replace(/[^0-9]/g, '').slice(-10) : '');
    trip = {
      id: data.bookingId || ("KT-WEB-" + Date.now()),
      customerName: data.name || (data.guestNamePhone ? String(data.guestNamePhone).split('(')[0].trim() : 'Website Guest'),
      phone: rawPhone,
      tripCategory: data.package || data.tripCategory || 'Website Lead',
      vehicle: data.vehicle || data.vehicleCategory || 'Sedan',
      route: data.route || data.pickupAddress || '',
      pickupDate: data.pickupDate || data.travelDateTime || '',
      pickupTime: data.pickupTime || '',
      pickupLocation: data.pickup || (data.pickupAddress ? String(data.pickupAddress).split('➔')[0].trim() : ''),
      dropLocation: data.drop || (data.pickupAddress && String(data.pickupAddress).indexOf('➔') > -1 ? String(data.pickupAddress).split('➔')[1].trim() : ''),
      agreedRate: data.fare || data.terminalFare || 0,
      advance: data.advance || data.advancePaid || 0,
      balance: (Number(data.fare || data.terminalFare || 0)) - (Number(data.advance || data.advancePaid || 0)),
      driverName: data.assignedChauffeur || '',
      driverPhone: '',
      vehicleNumber: '',
      manifestStatus: data.manifestStatus || 'Unassigned',
      notes: data.notes || data.metadata || 'Booked via Website Engine',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  if (trip) {
    var foundRow = -1;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][idIndex]) === String(trip.id)) {
        foundRow = i + 1;
        break;
      }
    }
    var rowData = [];
    for (var j = 0; j < headers.length; j++) {
      rowData.push(trip[headers[j]] !== undefined ? trip[headers[j]] : "");
    }
    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, id: trip.id })).setMimeType(ContentService.MimeType.JSON);
  } else if (data.action === "DELETE_TRIP") {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][idIndex]) === String(data.id)) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ error: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);
}`;

const DEFAULT_GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzpTM1pLXWLF-E80-HAXjj2ghAC_0tvFW1blTJC7rJojqUhTcKIwQz0t-NQMCScN2VA/exec';

export default function FastOperationsDesk() {
  // Security PIN (Owner PIN: 2015)
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(PIN_KEY) === 'true';
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active View / Navigation State
  // Valid views: 'dispatch' | 'copilot' | 'quotes' | 'new-booking' | 'drivers' | 'settlements' | 'settings'
  const [activeNav, setActiveNav] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['dispatch', 'copilot', 'quotes', 'new-booking', 'drivers', 'settlements', 'settings'].includes(hash)) {
        return hash;
      }
    }
    return 'dispatch';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync activeNav with URL Hash
  const navigateTo = (view) => {
    setActiveNav(view);
    setIsMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.location.hash = view;
    }
  };

  // Google Sheets Config
  const sanitizeSheetUrl = (rawUrl) => {
    const clean = (rawUrl || '').trim();
    if (!clean || !clean.startsWith('https://script.google.com/') || clean.includes('AKfycbzjPh0a2ju')) {
      return DEFAULT_GOOGLE_SHEET_URL;
    }
    return clean;
  };

  const [googleSheetUrl, setGoogleSheetUrl] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(GOOGLE_SHEET_URL_KEY);
      if (stored) {
        const validUrl = sanitizeSheetUrl(stored);
        if (validUrl !== stored) {
          localStorage.setItem(GOOGLE_SHEET_URL_KEY, validUrl);
        }
        return validUrl;
      }
    }
    return DEFAULT_GOOGLE_SHEET_URL;
  });
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [syncMessage, setSyncMessage] = useState('');
  const [toast, setToast] = useState(null);

  // Core Trips State
  const [trips, setTrips] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });

  // Drivers Fleet Roster State
  const [drivers, setDrivers] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(DRIVERS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return driversRosterData;
  });

  // Search & Filter State in Dispatch Board
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'tomorrow'

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Persist backup locally whenever trips change
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(trips));
    }
  }, [trips]);

  // Persist drivers roster
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(drivers));
    }
  }, [drivers]);

  // ==========================================
  // GOOGLE SHEETS LIVE 2-WAY SYNC
  // ==========================================
  const fetchTripsFromGoogleSheet = async (urlToUse) => {
    const url = sanitizeSheetUrl(urlToUse || googleSheetUrl);
    if (!url || !url.startsWith('https://script.google.com/')) return;
    setSyncStatus('syncing');
    setSyncMessage('Connecting to Google Sheet...');
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && Array.isArray(data.trips)) {
        const cleanDate = (d) => {
          if (!d) return '';
          const s = String(d).trim();
          if (s.includes('T')) return s.split('T')[0];
          return s;
        };
        const cleanTime = (t) => {
          if (!t) return '';
          const s = String(t).trim();
          if (s.includes('T')) {
            try {
              const dt = new Date(s);
              return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            } catch (_) {}
          }
          return s;
        };

        const formatted = data.trips.map(row => ({
          id: row.id || `KT-BK-${Date.now()}`,
          customerName: row.customerName || 'Customer',
          phone: String(row.phone || ''),
          tripCategory: row.tripCategory || 'Outstation',
          vehicle: row.vehicle || 'Sedan',
          route: row.route || `${row.pickupLocation || ''} -> ${row.dropLocation || ''}`,
          pickupDate: cleanDate(row.pickupDate),
          pickupTime: cleanTime(row.pickupTime),
          pickupLocation: row.pickupLocation || '',
          dropLocation: row.dropLocation || '',
          agreedRate: Number(row.agreedRate) || 0,
          advance: Number(row.advance) || 0,
          balance: (Number(row.agreedRate) || 0) - (Number(row.advance) || 0),
          driverName: row.driverName || '',
          driverPhone: String(row.driverPhone || ''),
          vehicleNumber: row.vehicleNumber || '',
          manifestStatus: row.manifestStatus || 'Unassigned',
          notes: row.notes || '',
          createdAt: row.createdAt || new Date().toISOString(),
          updatedAt: row.updatedAt || new Date().toISOString()
        })).reverse();
        setTrips(formatted);
        setSyncStatus('synced');
        setSyncMessage(`Synced ${formatted.length} trips live from Google Sheet`);
      } else if (url !== DEFAULT_GOOGLE_SHEET_URL) {
        // Self-heal if pointed to a non-trips sheet (e.g. Driver Leads sheet)
        setGoogleSheetUrl(DEFAULT_GOOGLE_SHEET_URL);
        setSheetInputUrl(DEFAULT_GOOGLE_SHEET_URL);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(GOOGLE_SHEET_URL_KEY, DEFAULT_GOOGLE_SHEET_URL);
        }
        return fetchTripsFromGoogleSheet(DEFAULT_GOOGLE_SHEET_URL);
      } else {
        setSyncStatus('synced');
        setSyncMessage('Google Sheet connected (0 trips currently logged)');
      }
    } catch (err) {
      console.error('Google Sheet fetch error:', err);
      setSyncStatus('error');
      setSyncMessage('Failed to fetch from Google Sheet. Check URL permissions.');
    }
  };

  useEffect(() => {
    // 1. Fetch server-configured sheet URL from .env if available
    fetch('/api/admin/sheet-config')
      .then(res => res.json())
      .then(data => {
        if (data && data.webhookUrl) {
          const serverUrl = sanitizeSheetUrl(data.webhookUrl);
          if (serverUrl && (!googleSheetUrl || googleSheetUrl !== serverUrl)) {
            setGoogleSheetUrl(serverUrl);
            setSheetInputUrl(serverUrl);
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(GOOGLE_SHEET_URL_KEY, serverUrl);
            }
            fetchTripsFromGoogleSheet(serverUrl);
            return;
          }
        }
        if (googleSheetUrl) {
          fetchTripsFromGoogleSheet(googleSheetUrl);
        }
      })
      .catch(() => {
        if (googleSheetUrl) {
          fetchTripsFromGoogleSheet(googleSheetUrl);
        }
      });
  }, []);

  const saveTripToGoogleSheet = async (trip) => {
    if (!googleSheetUrl || !googleSheetUrl.startsWith('https://script.google.com/')) return;
    try {
      setSyncStatus('syncing');
      await fetch(googleSheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'SAVE_TRIP', trip })
      });
      setSyncStatus('synced');
      setSyncMessage('Saved live to Google Sheet');
    } catch (err) {
      console.warn('Google Sheet background save warning:', err);
      setSyncStatus('error');
      setSyncMessage('Could not save to Google Sheet in real-time');
    }
  };

  const deleteTripFromGoogleSheet = async (id) => {
    if (!googleSheetUrl || !googleSheetUrl.startsWith('https://script.google.com/')) return;
    try {
      setSyncStatus('syncing');
      await fetch(googleSheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'DELETE_TRIP', id })
      });
      setSyncStatus('synced');
      setSyncMessage('Trip removed from Google Sheet');
    } catch (err) {
      console.warn('Google Sheet background delete warning:', err);
    }
  };

  // ==========================================
  // VIEW 1: RATE CALCULATOR & QUOTE GENERATOR
  // ==========================================
  const [calcTripType, setCalcTripType] = useState('outstation_round');
  const [calcVehicle, setCalcVehicle] = useState('14-Seater Executive Force Tempo');
  const [calcLocalPkg, setCalcLocalPkg] = useState('4hr_40km');
  const [calcTourKey, setCalcTourKey] = useState('tirupati-package');
  const [calcRoute, setCalcRoute] = useState('Guindy to Kona Falls & Return');
  const [calcTimingNote, setCalcTimingNote] = useState('6:00 AM Pickup – 10:00 PM Return');
  const [calcStateOverride, setCalcStateOverride] = useState('AUTO');
  const [calcDays, setCalcDays] = useState(1);
  const [calcDistanceKm, setCalcDistanceKm] = useState(220);
  const [calcTollParking, setCalcTollParking] = useState(0);
  const [calcExtraHours, setCalcExtraHours] = useState(0);
  const [calcExtraKm, setCalcExtraKm] = useState(0);
  const [calcCustName, setCalcCustName] = useState('');
  const [calcCustPhone, setCalcCustPhone] = useState('');
  const [calcQuoteText, setCalcQuoteText] = useState('');
  const [calcOption1Text, setCalcOption1Text] = useState('');

  // Auto-detect state permit code from route text
  const detectedStateCode = useMemo(() => {
    if (calcStateOverride && calcStateOverride !== 'AUTO') return calcStateOverride;
    const lowerRoute = String(calcRoute || '').toLowerCase();
    for (const [code, p] of Object.entries(tariffConfig.state_permits || {})) {
      if (code === 'TN') continue;
      if (Array.isArray(p.keywords) && p.keywords.some(kw => lowerRoute.includes(kw.toLowerCase()))) {
        return code;
      }
    }
    return 'TN';
  }, [calcRoute, calcStateOverride]);

  const calculatedFare = useMemo(() => {
    const v = tariffConfig.vehicles[calcVehicle] || tariffConfig.vehicles['Swift Dzire'];
    const vehCat = v.category || 'sedan';
    let base = 0;
    let driverBataTotal = 0;
    let statePermitAmt = 0;
    let chargeableKm = 0;
    let kmRate = v.round_trip_rate || 14;
    let tollEstimate = Number(calcTollParking) || 0;
    let breakdownLines = [];

    if (calcTripType === 'outstation_round') {
      const minKmPerDay = v.min_km_per_day || 250;
      const minRequiredKm = minKmPerDay * Math.max(1, Number(calcDays));
      chargeableKm = Math.max(minRequiredKm, Number(calcDistanceKm) || 0);
      kmRate = v.round_trip_rate || 14;
      base = chargeableKm * kmRate;
      driverBataTotal = (v.driver_bata || 500) * Math.max(1, Number(calcDays));
      statePermitAmt = tariffConfig.state_permits?.[detectedStateCode]?.rates?.[vehCat] || 0;
      breakdownLines.push(`${chargeableKm} Kms @ ₹${kmRate}/km = ₹${base.toLocaleString('en-IN')}`);
      breakdownLines.push(`Driver Bata (${calcDays} day${calcDays > 1 ? 's' : ''}): ₹${driverBataTotal.toLocaleString('en-IN')}`);
    } else if (calcTripType === 'outstation_oneway') {
      const minDropKm = v.min_drop_km || 130;
      chargeableKm = Math.max(minDropKm, Number(calcDistanceKm) || 0);
      kmRate = v.one_way_rate || 16;
      base = chargeableKm * kmRate;
      driverBataTotal = (v.driver_bata || 500);
      statePermitAmt = tariffConfig.state_permits?.[detectedStateCode]?.rates?.[vehCat] || 0;
      breakdownLines.push(`${chargeableKm} Kms @ ₹${kmRate}/km (One-Way Drop) = ₹${base.toLocaleString('en-IN')}`);
      breakdownLines.push(`Driver Bata: ₹${driverBataTotal.toLocaleString('en-IN')}`);
    } else if (calcTripType === 'local_package') {
      const pkgKeyMap = {
        '4hr_40km': { key: 'local_4hr_pkg', label: '4 Hr / 40 Km', km: 40, hr: 4 },
        '5hr_50km': { key: 'local_5hr_pkg', label: '5 Hr / 50 Km', km: 50, hr: 5 },
        '8hr_80km': { key: 'local_8hr_pkg', label: '8 Hr / 80 Km', km: 80, hr: 8 },
        '10hr_100km': { key: 'local_10hr_pkg', label: '10 Hr / 100 Km', km: 100, hr: 10 },
        '12hr_120km': { key: 'local_12hr_pkg', label: '12 Hr / 120 Km', km: 120, hr: 12 },
      };
      const sel = pkgKeyMap[calcLocalPkg] || pkgKeyMap['4hr_40km'];
      chargeableKm = sel.km;
      base = v[sel.key] || 1600;
      breakdownLines.push(`Base Rental (${sel.label}): ₹${base.toLocaleString('en-IN')}`);
      if (Number(calcExtraHours) > 0) {
        const extraHrCost = Number(calcExtraHours) * (v.extra_hr_rate || 150);
        base += extraHrCost;
        breakdownLines.push(`Extra Hours (${calcExtraHours} hr @ ₹${v.extra_hr_rate}/hr): ₹${extraHrCost.toLocaleString('en-IN')}`);
      }
      if (Number(calcExtraKm) > 0) {
        const extraKmCost = Number(calcExtraKm) * (v.extra_km_rate || 15);
        base += extraKmCost;
        breakdownLines.push(`Extra Distance (${calcExtraKm} km @ ₹${v.extra_km_rate}/km): ₹${extraKmCost.toLocaleString('en-IN')}`);
      }
    } else if (calcTripType === 'tour_package') {
      const pkg = tariffConfig.tour_packages?.[calcTourKey];
      if (pkg) {
        const vMap = {
          'Swift Dzire': 'dzire',
          'Toyota Etios': 'dzire',
          'Maruti Ertiga': 'ertiga',
          'Innova': 'innova',
          'Innova Crysta': 'crysta',
          'Tempo Traveller': 'tempo12',
          '12-Seater Luxury Force Tempo': 'tempo12',
          '14-Seater Executive Force Tempo': 'tempo12',
          '17-Seater Executive Force Tempo': 'tempo17'
        };
        const tKey = vMap[calcVehicle] || 'dzire';
        const vPkg = pkg.vehicles?.[tKey] || pkg.vehicles?.dzire;
        chargeableKm = pkg.roundTripKm || 300;
        base = vPkg?.rates?.[String(calcDays)] || vPkg?.rates?.['1'] || 4500;
        breakdownLines.push(`${pkg.name} (${calcVehicle}, ${calcDays}D): ₹${base.toLocaleString('en-IN')}`);
      }
    }

    const baseTotal = base + driverBataTotal;
    if (statePermitAmt > 0) {
      breakdownLines.push(`${detectedStateCode} State Permit (Statutory): ₹${statePermitAmt.toLocaleString('en-IN')}`);
    }
    if (tollEstimate > 0) {
      breakdownLines.push(`Toll & Parking (Est.): ₹${tollEstimate.toLocaleString('en-IN')}`);
    }

    const total = baseTotal + statePermitAmt + tollEstimate;
    return {
      base,
      driverBata: driverBataTotal,
      baseTotal,
      stateCode: detectedStateCode,
      statePermitAmt,
      chargeableKm,
      kmRate,
      extraKmRate: v.extra_km_rate || kmRate,
      seats: v.seats || 'AC',
      advanceAmt: (v.category === 'tempo' || v.category === 'coach') ? 2000 : 500,
      tollEstimate,
      total,
      breakdownLines
    };
  }, [calcTripType, calcVehicle, calcLocalPkg, calcTourKey, calcDays, calcDistanceKm, calcTollParking, calcExtraHours, calcExtraKm, detectedStateCode]);

  useEffect(() => {
    const quoteRef = `Q-${getFormattedDateCode()}-1`;
    const greeting = calcCustName ? `Dear *${calcCustName.trim()}*,` : 'Hello!';
    let tripTitle = '';
    if (calcTripType === 'outstation_round') tripTitle = `${calcDays}-Day Round Trip`;
    else if (calcTripType === 'outstation_oneway') tripTitle = 'One-Way Drop';
    else if (calcTripType === 'local_package') tripTitle = `Local Chennai Rental (${calcLocalPkg.replace('_', ' ')})`;
    else if (calcTripType === 'tour_package') tripTitle = tariffConfig.tour_packages?.[calcTourKey]?.name || 'Temple Tour';

    const permitSnippet = calculatedFare.statePermitAmt > 0
      ? `, ${calculatedFare.stateCode} State Permit (₹${calculatedFare.statePermitAmt.toLocaleString('en-IN')})`
      : '';

    // Option 1: Compact WhatsApp Micro-Receipt
    const opt1 = `*KALIDASS TRAVELS* (Ref: ${quoteRef})
${calcRoute || 'Chennai Outstation'} • ${tripTitle}${calcTimingNote ? `\n${calcTimingNote}` : ''}
${calcVehicle} (${calculatedFare.seats} AC)

*Estimated Fare: ₹${calculatedFare.total.toLocaleString('en-IN')}*
Includes: ${calculatedFare.chargeableKm} km (₹${calculatedFare.base.toLocaleString('en-IN')}), Fuel, Driver Bata (₹${calculatedFare.driverBata.toLocaleString('en-IN')})${permitSnippet}
Toll & Parking: Extra as per actual slip

Over-limit rates:
• Extra km (beyond ${calculatedFare.chargeableKm} km): ₹${calculatedFare.extraKmRate} / km
• Night Bata (after 10:00 PM): ₹350

To confirm: Call +91 89395 39211 (₹${calculatedFare.advanceAmt.toLocaleString('en-IN')} advance)`;

    // Option 2: Detailed Itemized WhatsApp Quote
    const opt2 = `*KALIDASS TRAVELS — OFFICIAL QUOTATION* (Ref: ${quoteRef})
${greeting} Greetings from Kalidass Travels, Chennai!

🚖 *Vehicle:* ${calcVehicle} (${calculatedFare.seats} A/C)
📍 *Route:* ${calcRoute || 'As requested'}
⏰ *Timing:* ${tripTitle}${calcTimingNote ? ` (${calcTimingNote})` : ''}

💰 *Fare Breakdown:*
• ${calculatedFare.chargeableKm} Kms (${calcDays}-Day Min) @ ₹${calculatedFare.kmRate}/km = ₹${calculatedFare.base.toLocaleString('en-IN')}
• Driver Bata (${calcTimingNote || `${calcDays} day`}): ₹${calculatedFare.driverBata.toLocaleString('en-IN')}
-------------------------------------
*BASE FARE: ₹${calculatedFare.baseTotal.toLocaleString('en-IN')}*${
      calculatedFare.statePermitAmt > 0
        ? `\n• ${calculatedFare.stateCode} State Border Permit (Actuals): ₹${calculatedFare.statePermitAmt.toLocaleString('en-IN')}\n-------------------------------------\n*TOTAL ESTIMATED FARE (WITH PERMIT): ₹${calculatedFare.total.toLocaleString('en-IN')}*`
        : ''
    }

Over-limit rates:
• Extra km (beyond ${calculatedFare.chargeableKm} km): ₹${calculatedFare.extraKmRate} / km
• Late Night Bata (if trip extends past 10:00 PM): ₹350

✅ *Included:* ${calcVehicle}, Fuel (up to ${calculatedFare.chargeableKm} km), Driver Bata
❌ *Excluded:* Highway Toll, Checkpost & Parking (as per actuals)

📞 *To Confirm:* Call/WhatsApp +91 89395 39211 (₹${calculatedFare.advanceAmt.toLocaleString('en-IN')} Advance)
🌐 *Website:* https://kalidasstravels.in`;

    setCalcOption1Text(opt1);
    setCalcQuoteText(opt2);
  }, [calculatedFare, calcVehicle, calcRoute, calcTimingNote, calcCustName, calcTripType, calcDays, calcLocalPkg, calcTourKey]);

  const handleSendWhatsAppQuote = (textToUse = calcQuoteText) => {
    let phone = calcCustPhone.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(textToUse)}`
      : `https://wa.me/?text=${encodeURIComponent(textToUse)}`;
    window.open(url, '_blank');
  };

  const handleCopyQuote = (textToUse = calcQuoteText, label = 'Quote') => {
    navigator.clipboard.writeText(textToUse);
    showToast(`${label} copied to clipboard!`);
  };

  const handleTransferToBooking = (overrideFare = null) => {
    setFormCustName(calcCustName || '');
    setFormCustPhone(calcCustPhone || '');
    setFormVehicle(calcVehicle);
    setFormAgreedRate(overrideFare !== null ? overrideFare : calculatedFare.total);
    setFormAdvance(0);
    setFormDropLocation(calcRoute);
    if (calcTimingNote) setFormNotes(calcTimingNote);
    if (calcTripType === 'outstation_round') setFormTripCategory('Outstation Round Trip');
    else if (calcTripType === 'outstation_oneway') setFormTripCategory('Outstation One-Way Drop');
    else if (calcTripType === 'local_package') setFormTripCategory('Local Chennai Rental');
    else setFormTripCategory('Tour Package');

    navigateTo('new-booking');
    showToast('Quote details populated into Booking Form!');
  };

  const handlePushFromCopilot = (meta) => {
    if (!meta) return;
    if (meta.vehicle && tariffConfig.vehicles[meta.vehicle]) {
      setFormVehicle(meta.vehicle);
    }
    if (meta.tripCategory) setFormTripCategory(meta.tripCategory);
    if (meta.pickupLocation) setFormPickupLocation(meta.pickupLocation);
    if (meta.dropLocation) setFormDropLocation(meta.dropLocation);
    else if (meta.route) setFormDropLocation(meta.route);
    if (meta.pickupTime) setFormPickupTime(meta.pickupTime);
    if (meta.agreedRate) setFormAgreedRate(Number(meta.agreedRate));
    if (meta.notes) setFormNotes(meta.notes);
    setFormAdvance(0);
    navigateTo('new-booking');
    showToast(`Pushed ${meta.vehicle || 'Trip'} (₹${Number(meta.agreedRate || 0).toLocaleString('en-IN')}) to Booking Form!`);
  };

  // ==========================================
  // VIEW 2: DIRECT BOOKING INTAKE FORM
  // ==========================================
  const [formCustName, setFormCustName] = useState('');
  const [formCustPhone, setFormCustPhone] = useState('');
  const [formVehicle, setFormVehicle] = useState('Swift Dzire');
  const [formTripCategory, setFormTripCategory] = useState('Outstation Round Trip');
  const [formPickupDate, setFormPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formPickupTime, setFormPickupTime] = useState('06:00 AM');
  const [formPickupLocation, setFormPickupLocation] = useState('');
  const [formDropLocation, setFormDropLocation] = useState('');
  const [formAgreedRate, setFormAgreedRate] = useState(4000);
  const [formAdvance, setFormAdvance] = useState(0);
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const raw = window.sessionStorage.getItem('kt_copilot_pushed_booking');
        if (raw) {
          window.sessionStorage.removeItem('kt_copilot_pushed_booking');
          const parsed = JSON.parse(raw);
          handlePushFromCopilot(parsed);
        }
      } catch (_) {}
    }
  }, []);

  const handleCreateBooking = (e) => {
    e.preventDefault();
    if (!formCustName.trim()) {
      showToast('Please enter customer name', 'error');
      return;
    }
    if (!formCustPhone.trim()) {
      showToast('Please enter customer phone number', 'error');
      return;
    }

    const newId = `KT-${getFormattedDateCode()}-${String(trips.length + 101).slice(-3)}`;
    const agreed = Number(formAgreedRate) || 0;
    const adv = Number(formAdvance) || 0;

    const newTrip = {
      id: newId,
      customerName: formCustName.trim(),
      phone: formCustPhone.trim(),
      tripCategory: formTripCategory,
      vehicle: formVehicle,
      route: `${formPickupLocation || 'Chennai'} -> ${formDropLocation || 'Destination'}`,
      pickupDate: formPickupDate,
      pickupTime: formPickupTime,
      pickupLocation: formPickupLocation.trim(),
      dropLocation: formDropLocation.trim(),
      agreedRate: agreed,
      advance: adv,
      balance: Math.max(0, agreed - adv),
      driverName: '',
      driverPhone: '',
      vehicleNumber: '',
      manifestStatus: 'Unassigned',
      notes: formNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newTrip, ...trips];
    setTrips(updated);
    saveTripToGoogleSheet(newTrip);

    // Reset Form
    setFormCustName('');
    setFormCustPhone('');
    setFormPickupLocation('');
    setFormDropLocation('');
    setFormNotes('');
    setFormAdvance(0);

    showToast(`Booking ${newId} created in Unassigned queue!`);
    navigateTo('dispatch');
  };

  // ==========================================
  // VIEW 3: DISPATCH BOARD ACTIONS & PIPELINES
  // ==========================================
  const [assigningTrip, setAssigningTrip] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [customDriverName, setCustomDriverName] = useState('');
  const [customDriverPhone, setCustomDriverPhone] = useState('');
  const [customVehicleNumber, setCustomVehicleNumber] = useState('');
  const [assignCommissionPct, setAssignCommissionPct] = useState(10);
  const [assignVehicleFilter, setAssignVehicleFilter] = useState('ALL');
  const [assignZoneFilter, setAssignZoneFilter] = useState('ALL');
  const [assignSearchQuery, setAssignSearchQuery] = useState('');

  // Compute commission & settlement math for a trip
  const computeSettlementMath = (trip, commPct = 10) => {
    const fare = Number(trip?.agreedRate || 0);
    const adv = Number(trip?.advance || 0);
    const pct = Math.max(0, Math.min(50, Number(commPct) || 0));
    const commissionAmt = Math.round((fare * pct) / 100);
    const driverNetShare = Math.max(0, fare - commissionAmt);
    const customerBalanceToDriver = Math.max(0, fare - adv);
    // Difference between what driver collects from customer vs driver's net share
    const netDiff = customerBalanceToDriver - driverNetShare; // = commissionAmt - adv
    return {
      fare,
      adv,
      pct,
      commissionAmt,
      driverNetShare,
      customerBalanceToDriver,
      settlementDirection: netDiff >= 0 ? 'DRIVER_PAYS_OFFICE' : 'OFFICE_PAYS_DRIVER',
      settlementAmount: Math.abs(netDiff)
    };
  };

  const handleOpenAssignModal = (trip) => {
    setAssigningTrip(trip);
    setSelectedDriverId('');
    setCustomDriverName(trip.driverName || '');
    setCustomDriverPhone(trip.driverPhone || '');
    setCustomVehicleNumber(trip.vehicleNumber || '');
    setAssignCommissionPct(trip.commissionPct !== undefined ? Number(trip.commissionPct) : 10);
    // Auto-select matching Vehicle Category & Pickup Zone
    const detectedVehCat = normalizeVehicleCategory(trip.vehicle || '');
    setAssignVehicleFilter(detectedVehCat || 'ALL');
    const detectedZone = inferZoneFromAddress(trip.pickupLocation || trip.route || '');
    setAssignZoneFilter(detectedZone || 'ALL');
    setAssignSearchQuery('');
  };

  const handleSelectRosterDriver = (driverId) => {
    setSelectedDriverId(driverId);
    const d = drivers.find(item => item.id === driverId);
    if (d) {
      setCustomDriverName(d.name);
      setCustomDriverPhone(d.phone);
      setCustomVehicleNumber(d.plate);
    }
  };

  // Send WA Duty Offer WITHOUT revealing customer phone number (before assignment)
  const handleSendDriverDutyOffer = (driver, trip) => {
    const math = computeSettlementMath(trip, assignCommissionPct);
    const text = `*KALIDASS TRAVELS — DUTY AVAILABILITY CHECK*
Namaskaram *${driver.name}* (${driver.vehicle} • ${driver.plate}),
Are you available for this upcoming trip?

📅 *Date & Time:* ${trip.pickupDate || 'Today'} @ ${trip.pickupTime || 'ASAP'}
📍 *Pickup Area:* ${trip.pickupLocation || 'Chennai'}
🏁 *Route / Drop:* ${trip.dropLocation || trip.route}
🚖 *Required Cab:* ${trip.vehicle} (${trip.tripCategory})

💰 *Total Trip Fare:* ₹${math.fare.toLocaleString('en-IN')}
🏢 *Agency Commission (${math.pct}%):* ₹${math.commissionAmt.toLocaleString('en-IN')}
💵 *Your Net Share (90%):* ₹${math.driverNetShare.toLocaleString('en-IN')} (+ Tolls/Parking actuals)
${
  math.settlementDirection === 'DRIVER_PAYS_OFFICE'
    ? `📲 *Customer Balance You Collect:* ₹${math.customerBalanceToDriver.toLocaleString('en-IN')} (Settle ₹${math.settlementAmount.toLocaleString('en-IN')} to Office)`
    : `📲 *Customer Balance You Collect:* ₹${math.customerBalanceToDriver.toLocaleString('en-IN')} (Office pays you ₹${math.settlementAmount.toLocaleString('en-IN')})`
}

*Reply YES immediately to lock this duty & receive Passenger Contact Slip!*`;

    let phone = (driver.phone || '').replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleConfirmAssignment = (overrideDriver = null) => {
    if (!assigningTrip) return;
    const dName = overrideDriver ? overrideDriver.name : customDriverName.trim();
    const dPhone = overrideDriver ? overrideDriver.phone : customDriverPhone.trim();
    const dPlate = overrideDriver ? overrideDriver.plate : customVehicleNumber.trim();

    if (!dName) {
      showToast('Please specify driver name', 'error');
      return;
    }

    const math = computeSettlementMath(assigningTrip, assignCommissionPct);

    const updatedTrip = {
      ...assigningTrip,
      driverName: dName,
      driverPhone: dPhone,
      vehicleNumber: formatIndianPlateNumber(dPlate) || dPlate,
      commissionPct: math.pct,
      commissionAmount: math.commissionAmt,
      driverNetShare: math.driverNetShare,
      settlementDirection: math.settlementDirection,
      settlementAmount: math.settlementAmount,
      manifestStatus: 'Active',
      updatedAt: new Date().toISOString()
    };

    const updatedList = trips.map(t => (t.id === assigningTrip.id ? updatedTrip : t));
    setTrips(updatedList);
    saveTripToGoogleSheet(updatedTrip);
    setAssigningTrip(null);
    showToast(`Assigned to ${dName} (${updatedTrip.vehicleNumber})! Moved #${updatedTrip.id} to Active Trips`);
  };

  const handleSendDriverDutySlip = (trip) => {
    const math = computeSettlementMath(trip, trip.commissionPct ?? 10);
    const settlementLine =
      math.settlementDirection === 'DRIVER_PAYS_OFFICE'
        ? `🔄 *Settlement:* Driver pays Office ₹${math.settlementAmount.toLocaleString('en-IN')} (Commission: ₹${math.commissionAmt.toLocaleString('en-IN')} | Net Driver Share: ₹${math.driverNetShare.toLocaleString('en-IN')})`
        : `🔄 *Settlement:* Office pays Driver ₹${math.settlementAmount.toLocaleString('en-IN')} (Commission: ₹${math.commissionAmt.toLocaleString('en-IN')} | Net Driver Share: ₹${math.driverNetShare.toLocaleString('en-IN')})`;

    const text = `*KALIDASS TRAVELS — OFFICIAL DRIVER DUTY SLIP*
Trip ID: #${trip.id}

👤 *Passenger:* ${trip.customerName}
📞 *Passenger Mobile:* ${trip.phone}
🚖 *Assigned Cab:* ${trip.vehicle} (${trip.vehicleNumber || 'Plate TBD'})
📅 *Pickup Date/Time:* ${trip.pickupDate} @ ${trip.pickupTime}
📍 *Pickup Location:* ${trip.pickupLocation || 'Chennai'}
🏁 *Destination / Route:* ${trip.dropLocation || trip.route}

💰 *Total Trip Fare:* ₹${Number(trip.agreedRate).toLocaleString('en-IN')}
💵 *Advance Paid to Office:* ₹${Number(trip.advance).toLocaleString('en-IN')}
📲 *Collect Balance from Guest:* ₹${Number(trip.balance).toLocaleString('en-IN')} (+ Extra KM / Tolls / Parking)
${settlementLine}
${trip.notes ? `📝 *Special Notes:* ${trip.notes}\n` : ''}
_Report 15 mins early in clean uniform & AC cab._
*Dispatch Desk:* +91 89395 39211 / +91 90923 03060`;

    let phone = (trip.driverPhone || '').replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSendCustomerConfirmation = (trip) => {
    const text = `*KALIDASS TRAVELS — TRIP CONFIRMATION*
Dear ${trip.customerName}, your booking is confirmed!

🚖 *Vehicle:* ${trip.vehicle} (${trip.vehicleNumber || 'Confirmed'})
👨‍✈️ *Driver Name:* ${trip.driverName || 'Designated Chauffeur'}
📞 *Driver Contact:* ${trip.driverPhone ? `+91 ${trip.driverPhone}` : 'Will call you before arrival'}
📅 *Pickup Date/Time:* ${trip.pickupDate} @ ${trip.pickupTime}
📍 *Pickup Address:* ${trip.pickupLocation || 'Chennai'}
🏁 *Route:* ${trip.dropLocation || trip.route}

Our chauffeur will report on time and assist with your luggage. Have a comfortable and pleasant journey!
*For any queries/changes:* +91 89395 39211`;

    let phone = (trip.phone || '').replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCompleteTrip = (trip) => {
    const updatedTrip = {
      ...trip,
      manifestStatus: 'Settled',
      balance: 0,
      updatedAt: new Date().toISOString()
    };
    const updatedList = trips.map(t => (t.id === trip.id ? updatedTrip : t));
    setTrips(updatedList);
    saveTripToGoogleSheet(updatedTrip);
    showToast(`Trip #${trip.id} completed & moved to Settlements!`);
  };

  const handleSendGoogleReviewRequest = (trip) => {
    const text = `Dear ${trip.customerName},
Thank you for travelling with Kalidass Travels!

We hope you had a peaceful and smooth journey with chauffeur ${trip.driverName || 'our driver'}.

Could you please take 30 seconds to share your experience on Google? Your review means the world to our family-run team:
⭐️ ${GOOGLE_REVIEW_URL}

We look forward to serving you and your family again!
Warm regards,
*Kalidass Travels, Chennai*`;

    let phone = (trip.phone || '').replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDeleteTrip = (id) => {
    if (window.confirm('Are you sure you want to delete this trip record?')) {
      const updatedList = trips.filter(t => t.id !== id);
      setTrips(updatedList);
      deleteTripFromGoogleSheet(id);
      showToast('Trip record deleted.');
    }
  };

  // Filtered Trips for Dispatch Desk
  const filteredTrips = useMemo(() => {
    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];
    const todayDmy = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().split('T')[0];
    const tomorrowDmy = `${String(tomorrow.getDate()).padStart(2, '0')}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${tomorrow.getFullYear()}`;

    const matchesDate = (rawDate, isoTarget, dmyTarget) => {
      const s = String(rawDate || '');
      return s.includes(isoTarget) || s.includes(dmyTarget);
    };

    return trips.filter(trip => {
      if (dateFilter === 'today' && !matchesDate(trip.pickupDate, todayIso, todayDmy)) return false;
      if (dateFilter === 'tomorrow' && !matchesDate(trip.pickupDate, tomorrowIso, tomorrowDmy)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (trip.customerName || '').toLowerCase().includes(q) ||
          (trip.phone || '').includes(q) ||
          (trip.id || '').toLowerCase().includes(q) ||
          (trip.driverName || '').toLowerCase().includes(q) ||
          (trip.vehicleNumber || '').toLowerCase().includes(q) ||
          (trip.route || '').toLowerCase().includes(q) ||
          (trip.notes || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [trips, searchQuery, dateFilter]);

  const unassignedTrips = useMemo(() => filteredTrips.filter(t => !t.manifestStatus || t.manifestStatus === 'Unassigned' || t.manifestStatus === 'Need Driver'), [filteredTrips]);
  const activeTrips = useMemo(() => filteredTrips.filter(t => t.manifestStatus === 'Active'), [filteredTrips]);
  const settledTrips = useMemo(() => filteredTrips.filter(t => t.manifestStatus === 'Settled'), [filteredTrips]);

  // ==========================================
  // VIEW 4: DRIVERS FLEET ROSTER MANAGEMENT
  // ==========================================
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverCategory, setNewDriverCategory] = useState('Sedan');
  const [newDriverVehicle, setNewDriverVehicle] = useState('Swift Dzire');
  const [newDriverPlate, setNewDriverPlate] = useState('');
  const [newDriverZone, setNewDriverZone] = useState('South & OMR');
  const [newDriverArea, setNewDriverArea] = useState('Medavakkam');
  const [newDriverBoard, setNewDriverBoard] = useState('Yellow Board');
  const [newDriverCarrier, setNewDriverCarrier] = useState('With Carrier');
  const [newDriverPartnerType, setNewDriverPartnerType] = useState('Owner-Driver');

  // Roster Filters
  const [rosterVehicleFilter, setRosterVehicleFilter] = useState('ALL');
  const [rosterZoneFilter, setRosterZoneFilter] = useState('ALL');
  const [rosterBoardFilter, setRosterBoardFilter] = useState('ALL');
  const [rosterSearchQuery, setRosterSearchQuery] = useState('');

  // Pending Applications from /attach-cab/
  const [pendingLeads, setPendingLeads] = useState([]);
  const [waPasteModalOpen, setWaPasteModalOpen] = useState(false);
  const [waPasteText, setWaPasteText] = useState('');

  const fetchPendingDriverLeads = async () => {
    try {
      const res = await fetch('/api/record-driver-lead');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.leads)) {
          setPendingLeads(data.leads.filter(l => l.status !== 'Approved' && l.status !== 'Dismissed'));
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchPendingDriverLeads();
    }
  }, [isUnlocked, activeNav]);

  // Approve a pending /attach-cab/ lead into the Active Roster (creates 1 card per registered car!)
  const handleApproveLeadToRoster = async (lead) => {
    const newCards = [];
    const vehiclesList = Array.isArray(lead.vehicles) && lead.vehicles.length > 0 ? lead.vehicles : [];

    if (lead.category === 'Driver Job Only' || vehiclesList.length === 0) {
      newCards.push({
        id: getNextDriverRosterId(drivers, 0),
        name: lead.name,
        phone: String(lead.phone || '').replace(/\D/g, '').slice(-10),
        category: 'Acting Driver',
        vehicle: `Acting Driver (${lead.licenseType || 'Badge'})`,
        plate: 'ACTING-DRV',
        zone: lead.zone || 'South & OMR',
        area: lead.area || 'Medavakkam',
        boardType: 'Acting Driver',
        carrier: 'No Carrier',
        partnerType: 'Acting Driver',
        dlUrl: lead.dlLocalUrl || ''
      });
    } else {
      const isFleet = vehiclesList.length > 1;
      vehiclesList.forEach((v, idx) => {
        newCards.push({
          id: getNextDriverRosterId(drivers, idx),
          name: lead.name,
          phone: String(lead.phone || '').replace(/\D/g, '').slice(-10),
          category: v.category || normalizeVehicleCategory(v.model),
          vehicle: v.model || 'Swift Dzire',
          plate: formatIndianPlateNumber(v.plate) || 'Plate TBD',
          zone: lead.zone || 'South & OMR',
          area: lead.area || 'Medavakkam',
          boardType: v.boardType || 'Yellow Board',
          carrier: v.carrier || 'With Carrier',
          partnerType: isFleet ? 'Fleet Partner' : 'Owner-Driver',
          dlUrl: lead.dlLocalUrl || '',
          rcUrl: v.rcUrl || '',
          carUrl: v.carUrl || ''
        });
      });
    }

    setDrivers(prev => [...newCards, ...prev]);

    try {
      await fetch('/api/record-driver-lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.leadId, status: 'Approved' })
      });
    } catch (_) {}

    setPendingLeads(prev => prev.filter(item => item.leadId !== lead.leadId));
    showToast(`Approved ${lead.name}! Added ${newCards.length} vehicle card(s) to Active Roster.`);
  };

  const handleDismissLead = async (leadId) => {
    try {
      await fetch('/api/record-driver-lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status: 'Dismissed' })
      });
    } catch (_) {}
    setPendingLeads(prev => prev.filter(item => item.leadId !== leadId));
    showToast('Application dismissed.');
  };

  // Parse structured WhatsApp registration text into Roster Cards
  const handleImportFromWhatsAppText = () => {
    const raw = waPasteText.trim();
    if (!raw) return;

    const getField = (label) => {
      const m = raw.match(new RegExp(`${label}:\\s*(.+)`, 'i'));
      return m ? m[1].trim() : '';
    };

    const name = getField('Name') || 'Partner Driver';
    const phone = (getField('Phone') || raw).replace(/\D/g, '').slice(-10);
    const zone = getField('Base Zone') || 'South & OMR';
    const area = getField('Base Area') || 'Medavakkam';
    const partnerType = getField('Type') || 'Owner-Driver';

    const vehicleMatches = [...raw.matchAll(/Vehicle\s*#\d+:\s*([^|]+)\|\s*Plate:\s*([^|]+)\|\s*([^|]+)\|\s*(.+)/gi)];
    const created = [];

    if (vehicleMatches.length > 0) {
      vehicleMatches.forEach((m, i) => {
        const model = m[1].trim();
        const plate = formatIndianPlateNumber(m[2].trim());
        const boardType = m[3].trim();
        const carrier = m[4].trim();
        created.push({
          id: getNextDriverRosterId(drivers, i),
          name,
          phone,
          category: normalizeVehicleCategory(model),
          vehicle: model,
          plate,
          zone,
          area,
          boardType,
          carrier,
          partnerType: vehicleMatches.length > 1 ? 'Fleet Partner' : partnerType
        });
      });
    } else {
      created.push({
        id: getNextDriverRosterId(drivers, 0),
        name,
        phone,
        category: 'Acting Driver',
        vehicle: 'Acting Driver',
        plate: 'ACTING-DRV',
        zone,
        area,
        boardType: 'Acting Driver',
        carrier: 'No Carrier',
        partnerType: 'Acting Driver'
      });
    }

    setDrivers(prev => [...created, ...prev]);
    setWaPasteText('');
    setWaPasteModalOpen(false);
    showToast(`Imported ${created.length} card(s) for ${name} into Roster!`);
  };

  const handleAddDriver = (e) => {
    e.preventDefault();
    if (!newDriverName.trim() || !newDriverPhone.trim()) {
      showToast('Enter driver name and phone', 'error');
      return;
    }
    const formattedPlate =
      newDriverPartnerType === 'Acting Driver'
        ? 'ACTING-DRV'
        : formatIndianPlateNumber(newDriverPlate) || 'Plate TBD';

    const newEntry = {
      id: getNextDriverRosterId(drivers, 0),
      name: newDriverName.trim(),
      phone: newDriverPhone.replace(/\D/g, '').slice(-10),
      category: newDriverPartnerType === 'Acting Driver' ? 'Acting Driver' : newDriverCategory,
      vehicle: newDriverPartnerType === 'Acting Driver' ? 'Acting Driver (Chauffeur)' : newDriverVehicle,
      plate: formattedPlate,
      zone: newDriverZone,
      area: newDriverArea,
      boardType: newDriverPartnerType === 'Acting Driver' ? 'Acting Driver' : newDriverBoard,
      carrier: newDriverPartnerType === 'Acting Driver' ? 'No Carrier' : newDriverCarrier,
      partnerType: newDriverPartnerType
    };
    setDrivers([newEntry, ...drivers]);
    setNewDriverName('');
    setNewDriverPhone('');
    setNewDriverPlate('');
    showToast(`${newEntry.name} (${newEntry.vehicle} • ${newEntry.area}) added to roster!`);
  };

  // Filtered Roster Drivers for VIEW 4
  const filteredRosterDrivers = useMemo(() => {
    return drivers.filter(d => {
      const cat = d.category || normalizeVehicleCategory(d.vehicle);
      if (rosterVehicleFilter !== 'ALL' && cat !== rosterVehicleFilter) return false;
      if (rosterZoneFilter !== 'ALL' && (d.zone || 'South & OMR') !== rosterZoneFilter) return false;
      if (rosterBoardFilter === 'Yellow Board' && (d.boardType || 'Yellow Board') !== 'Yellow Board') return false;
      if (rosterBoardFilter === 'White Board' && d.boardType !== 'White Board') return false;
      if (rosterBoardFilter === 'With Carrier' && d.carrier !== 'With Carrier') return false;

      if (rosterSearchQuery.trim()) {
        const q = rosterSearchQuery.toLowerCase();
        const hay = `${d.name || ''} ${d.phone || ''} ${d.vehicle || ''} ${d.plate || ''} ${d.zone || ''} ${d.area || ''} ${d.partnerType || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [drivers, rosterVehicleFilter, rosterZoneFilter, rosterBoardFilter, rosterSearchQuery]);

  // Filtered Roster Drivers inside Assign Modal
  const filteredAssignDrivers = useMemo(() => {
    return drivers.filter(d => {
      const cat = d.category || normalizeVehicleCategory(d.vehicle);
      if (assignVehicleFilter !== 'ALL' && cat !== assignVehicleFilter) return false;
      if (assignZoneFilter !== 'ALL' && (d.zone || 'South & OMR') !== assignZoneFilter) return false;
      if (assignSearchQuery.trim()) {
        const q = assignSearchQuery.toLowerCase();
        const hay = `${d.name || ''} ${d.phone || ''} ${d.vehicle || ''} ${d.plate || ''} ${d.zone || ''} ${d.area || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [drivers, assignVehicleFilter, assignZoneFilter, assignSearchQuery]);

  const handleDeleteDriver = (id) => {
    if (window.confirm('Remove driver/vehicle from roster?')) {
      setDrivers(drivers.filter(d => d.id !== id));
      showToast('Removed from roster.');
    }
  };

  // ==========================================
  // VIEW 6: GOOGLE SHEETS SETTINGS
  // ==========================================
  const [sheetInputUrl, setSheetInputUrl] = useState(() => googleSheetUrl || DEFAULT_GOOGLE_SHEET_URL);

  const handleSaveSheetUrl = async () => {
    const clean = sheetInputUrl.trim();
    setGoogleSheetUrl(clean);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(GOOGLE_SHEET_URL_KEY, clean);
    }

    // Persist to server (.env) so website booking forms automatically share this sheet
    try {
      await fetch('/api/admin/sheet-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: clean })
      });
    } catch (_) {}

    if (clean) {
      fetchTripsFromGoogleSheet(clean);
      showToast('Google Sheet connected! Synced to website booking engines and .env');
    } else {
      showToast('Google Sheet Webhook disconnected.');
    }
  };

  const handleCopyScriptTemplate = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    showToast('Apps Script code copied! Paste in Extensions -> Apps Script.');
  };

  // Export Trips as CSV
  const handleExportCSV = () => {
    if (trips.length === 0) {
      showToast('No trips to export', 'error');
      return;
    }
    const headers = [
      'Trip ID', 'Customer Name', 'Phone', 'Category', 'Vehicle', 'Route',
      'Pickup Date', 'Pickup Time', 'Agreed Rate', 'Advance', 'Balance',
      'Driver Name', 'Driver Phone', 'Vehicle Plate', 'Status', 'Notes'
    ];
    const rows = trips.map(t => [
      t.id, t.customerName, t.phone, t.tripCategory, t.vehicle, t.route,
      t.pickupDate, t.pickupTime, t.agreedRate, t.advance, t.balance,
      t.driverName, t.driverPhone, t.vehicleNumber, t.manifestStatus, t.notes
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kalidass_Trips_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('CSV Export downloaded!');
  };

  // Owner PIN Authentication
  const handleUnlockPin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === '2015') {
      setIsUnlocked(true);
      setPinError(false);
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(PIN_KEY, 'true');
      }
    } else {
      setPinError(true);
    }
  };

  const handleLockConsole = () => {
    setIsUnlocked(false);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(PIN_KEY);
    }
  };

  // Navigation Items Config
  const NAV_ITEMS = [
    { id: 'dispatch', label: 'Live Dispatch Desk', icon: 'view_kanban', badge: unassignedTrips.length },
    { id: 'copilot', label: '24/7 Mobile AI Co-Pilot', icon: 'smart_toy' },
    { id: 'quotes', label: 'Rate & Quote Generator', icon: 'calculate' },
    { id: 'new-booking', label: 'New Booking Entry', icon: 'add_circle' },
    { id: 'drivers', label: 'Drivers & Fleet Roster', icon: 'badge', badge: drivers.length },
    { id: 'settlements', label: 'Settlements & Reviews', icon: 'payments', badge: settledTrips.length },
    { id: 'settings', label: 'Cloud Sheet & Settings', icon: 'settings' }
  ];

  // PIN PROTECTION SCREEN
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
            <span className="material-symbols-outlined text-3xl">local_taxi</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Kalidass Travels</h2>
          <p className="text-xs text-slate-400 mb-6">Operations & Dispatch Console</p>
          <form onSubmit={handleUnlockPin} className="space-y-4">
            <div>
              <input
                id="admin-owner-pin"
                name="pin"
                aria-label="Enter Owner PIN"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Owner PIN (2015)"
                className="w-full text-center tracking-widest text-2xl font-mono py-3 px-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              {pinError && <p className="text-red-400 text-xs mt-2">Incorrect PIN. Try again.</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition duration-150 shadow-lg shadow-blue-600/30"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 text-sm animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (COLLAPSIBLE, INDUSTRY STANDARD) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white flex flex-col transition-all duration-200 border-r border-slate-800 lg:static ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-extrabold text-white text-base shadow-md shadow-blue-600/40 shrink-0">
              KT
            </div>
            {!isSidebarCollapsed && (
              <div className="leading-tight truncate">
                <span className="font-extrabold text-sm tracking-wide block truncate">KALIDASS</span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">Operations Hub</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <span className="material-symbols-outlined text-sm">
              {isSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition relative group ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <span className={`material-symbols-outlined text-lg shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                  {item.icon}
                </span>

                {!isSidebarCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      isActive ? 'bg-white text-blue-700' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Cloud Sync Status Footer */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => navigateTo('settings')}
            className={`w-full p-2.5 rounded-xl text-left text-xs transition border flex items-center gap-2.5 ${
              googleSheetUrl
                ? syncStatus === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            } ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              googleSheetUrl
                ? syncStatus === 'error'
                  ? 'bg-rose-400'
                  : 'bg-emerald-400 animate-pulse'
                : 'bg-slate-500'
            }`} />
            {!isSidebarCollapsed && (
              <div className="truncate">
                <div className="font-bold truncate">
                  {googleSheetUrl ? (syncStatus === 'syncing' ? 'Syncing...' : 'Sheet Connected') : 'Cloud Disconnected'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {googleSheetUrl ? 'Google 2-Way Sync' : 'Click to configure'}
                </div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP HEADER BAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>

            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {NAV_ITEMS.find(n => n.id === activeNav)?.label || 'Operations Desk'}
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                Kalidass Travels Chennai Operational Command Center
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {googleSheetUrl && (
              <button
                onClick={() => fetchTripsFromGoogleSheet()}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                title="Fetch latest trips from Google Sheet"
              >
                <span className={`material-symbols-outlined text-sm ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span className="hidden md:inline">Sync Live</span>
              </button>
            )}

            <button
              onClick={() => navigateTo('new-booking')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>New Booking</span>
            </button>

            <button
              onClick={handleLockConsole}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Lock Console"
            >
              <span className="material-symbols-outlined text-lg">lock</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY AREA (ONE FOCUSED VIEW AT A TIME) */}
        <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto flex-1 space-y-6">

          {/* ========================================================= */}
          {/* VIEW 0: 24/7 MOBILE AI CO-PILOT                           */}
          {/* ========================================================= */}
          {activeNav === 'copilot' && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl max-w-4xl mx-auto h-[85vh] animate-fadeIn">
              <MobileDispatchCopilot onPushToDispatch={handlePushFromCopilot} />
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 1: LIVE DISPATCH DESK                                */}
          {/* ========================================================= */}
          {activeNav === 'dispatch' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Metric Counters Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Total Trips</div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">{trips.length}</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs">
                  <div className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Needs Driver
                  </div>
                  <div className="text-2xl font-extrabold text-amber-600 font-mono mt-0.5">{unassignedTrips.length}</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    On Road / Running
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5">{activeTrips.length}</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-xs">
                  <div className="text-[11px] font-bold text-blue-700 uppercase">Settled / Closed</div>
                  <div className="text-2xl font-extrabold text-blue-600 font-mono mt-0.5">{settledTrips.length}</div>
                </div>
              </div>

              {/* Search & Date Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex-1 relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by passenger name, phone, booking ID, driver, or vehicle plate..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Filter:</span>
                  {[
                    { id: 'all', label: 'All Dates' },
                    { id: 'today', label: 'Today' },
                    { id: 'tomorrow', label: 'Tomorrow' },
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDateFilter(d.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        dateFilter === d.id
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3-Column Kanban Board */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. UNASSIGNED */}
                <div className="bg-slate-50/80 border border-amber-200/70 rounded-2xl p-4 flex flex-col min-h-[500px]">
                  <div className="flex items-center justify-between pb-3 border-b border-amber-200/70 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <h3 className="font-bold text-sm text-slate-800 tracking-wide">1. UNASSIGNED</h3>
                      <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                        {unassignedTrips.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700">Needs Cab</span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-1">
                    {unassignedTrips.length === 0 ? (
                      <div className="h-44 border border-dashed border-amber-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
                        <span className="material-symbols-outlined text-2xl text-amber-300">task_alt</span>
                        <span>No unassigned trips pending</span>
                      </div>
                    ) : (
                      unassignedTrips.map(trip => (
                        <div
                          key={trip.id}
                          className="bg-white border border-amber-100 hover:border-amber-300 rounded-xl p-3.5 shadow-xs space-y-2.5 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-900">{trip.customerName}</h4>
                                <span className="text-[10px] font-mono text-slate-400">#{trip.id}</span>
                              </div>
                              <a
                                href={`tel:${trip.phone}`}
                                className="text-xs text-blue-600 hover:underline font-mono inline-flex items-center gap-1 mt-0.5"
                              >
                                <span className="material-symbols-outlined text-xs">call</span>
                                <span>{trip.phone}</span>
                              </a>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-slate-900">
                                ₹{Number(trip.agreedRate).toLocaleString('en-IN')}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Adv: ₹{Number(trip.advance).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <span className="material-symbols-outlined text-xs text-blue-600">directions_car</span>
                              <span>{trip.vehicle} • {trip.tripCategory}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
                              <span>{trip.pickupDate} @ {trip.pickupTime}</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="material-symbols-outlined text-xs text-slate-400 mt-0.5">location_on</span>
                              <span className="line-clamp-2">{trip.pickupLocation || 'Chennai'} → {trip.dropLocation || trip.route}</span>
                            </div>
                            {trip.notes && (
                              <div className="text-[11px] text-amber-700 italic border-t border-slate-200/60 pt-1 mt-1">
                                Note: {trip.notes}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(trip)}
                              className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-sm">badge</span>
                              <span>Assign Driver & Cab</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Delete booking"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. ACTIVE / ON TRIP */}
                <div className="bg-slate-50/80 border border-emerald-200/70 rounded-2xl p-4 flex flex-col min-h-[500px]">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-200/70 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h3 className="font-bold text-sm text-slate-800 tracking-wide">2. ACTIVE / ON TRIP</h3>
                      <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                        {activeTrips.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700">On Duty</span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-1">
                    {activeTrips.length === 0 ? (
                      <div className="h-44 border border-dashed border-emerald-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
                        <span className="material-symbols-outlined text-2xl text-emerald-300">no_crash</span>
                        <span>No active trips on road right now</span>
                      </div>
                    ) : (
                      activeTrips.map(trip => (
                        <div
                          key={trip.id}
                          className="bg-white border border-emerald-100 hover:border-emerald-300 rounded-xl p-3.5 shadow-xs space-y-2.5 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{trip.customerName}</h4>
                              <div className="text-xs font-mono text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-xs">local_taxi</span>
                                <span>{trip.vehicleNumber || 'Cab Assigned'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-slate-900">
                                Bal: ₹{Number(trip.balance).toLocaleString('en-IN')}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Total: ₹{Number(trip.agreedRate).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs bg-slate-50 p-2.5 rounded-lg space-y-1.5 border border-slate-100">
                            <div className="flex items-center justify-between font-medium text-slate-800">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-blue-600">person</span>
                                <span>Chauffeur: {trip.driverName}</span>
                              </span>
                              <a href={`tel:${trip.driverPhone}`} className="text-blue-600 font-mono hover:underline">
                                {trip.driverPhone}
                              </a>
                            </div>
                            <div className="text-slate-600 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
                              <span>{trip.pickupDate} @ {trip.pickupTime}</span>
                            </div>
                            <div className="text-slate-600 flex items-start gap-1.5">
                              <span className="material-symbols-outlined text-xs text-slate-400 mt-0.5">location_on</span>
                              <span className="line-clamp-2">{trip.route}</span>
                            </div>
                            {(() => {
                              const math = computeSettlementMath(trip, trip.commissionPct ?? 10);
                              return (
                                <div className="pt-1.5 mt-1 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500 font-medium">
                                    Comm ({math.pct}%): <strong className="text-slate-800">₹{math.commissionAmt.toLocaleString('en-IN')}</strong>
                                  </span>
                                  <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                                    math.settlementDirection === 'DRIVER_PAYS_OFFICE'
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-purple-100 text-purple-900'
                                  }`}>
                                    {math.settlementDirection === 'DRIVER_PAYS_OFFICE'
                                      ? `Driver Pays Office: ₹${math.settlementAmount.toLocaleString('en-IN')}`
                                      : `Office Pays Driver: ₹${math.settlementAmount.toLocaleString('en-IN')}`}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleSendDriverDutySlip(trip)}
                              className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                            >
                              <span className="material-symbols-outlined text-xs">send</span>
                              <span>Duty Slip (WA)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendCustomerConfirmation(trip)}
                              className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                            >
                              <span className="material-symbols-outlined text-xs">chat</span>
                              <span>Guest Info (WA)</span>
                            </button>
                          </div>

                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => handleCompleteTrip(trip)}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-sm">done_all</span>
                              <span>Mark Trip Completed & Settle</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. SETTLEMENT & REVIEW */}
                <div className="bg-slate-50/80 border border-blue-200/70 rounded-2xl p-4 flex flex-col min-h-[500px]">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-200/70 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <h3 className="font-bold text-sm text-slate-800 tracking-wide">3. SETTLEMENT & REVIEW</h3>
                      <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
                        {settledTrips.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700">Finished</span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-1">
                    {settledTrips.length === 0 ? (
                      <div className="h-44 border border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
                        <span className="material-symbols-outlined text-2xl text-blue-300">verified</span>
                        <span>Completed trips will appear here</span>
                      </div>
                    ) : (
                      settledTrips.map(trip => (
                        <div
                          key={trip.id}
                          className="bg-white border border-blue-100 rounded-xl p-3.5 shadow-xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{trip.customerName}</h4>
                              <span className="text-xs text-slate-500 font-mono">#{trip.id} • {trip.vehicle}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded font-mono">
                              Paid ₹{Number(trip.agreedRate).toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                            <div>Chauffeur: {trip.driverName || 'Chauffeur'} ({trip.vehicleNumber || 'Cab'})</div>
                            <div className="line-clamp-1 mt-0.5 text-slate-500">{trip.route}</div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSendGoogleReviewRequest(trip)}
                              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-sm text-yellow-300">star</span>
                              <span>Send Review Link</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition"
                              title="Archive / Remove"
                            >
                              <span className="material-symbols-outlined text-sm">archive</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: RATE & QUOTE GENERATOR                             */}
          {/* ========================================================= */}
          {activeNav === 'quotes' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fadeIn space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Rate Deciding & WhatsApp Quotation Generator</h3>
                <p className="text-xs text-slate-500">Calculates deterministic tariffs from master rates with ₹0 API costs.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Inputs Left */}
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      Trip Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'outstation_round', label: 'Outstation Round', icon: 'sync_alt' },
                        { id: 'outstation_oneway', label: 'One-Way Drop', icon: 'trending_flat' },
                        { id: 'local_package', label: 'Local Rental', icon: 'schedule' },
                        { id: 'tour_package', label: 'Tour Package', icon: 'temple_hindu' },
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setCalcTripType(t.id)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            calcTripType === t.id
                              ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">{t.icon}</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Fleet</label>
                      <select
                        value={calcVehicle}
                        onChange={(e) => setCalcVehicle(e.target.value)}
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      >
                        {Object.keys(tariffConfig.vehicles).map(vKey => (
                          <option key={vKey} value={vKey}>
                            {vKey} ({tariffConfig.vehicles[vKey].seats || 'AC'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {calcTripType === 'local_package' ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Package Slab</label>
                        <select
                          value={calcLocalPkg}
                          onChange={(e) => setCalcLocalPkg(e.target.value)}
                          className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                        >
                          <option value="4hr_40km">4 Hours / 40 Kms</option>
                          <option value="5hr_50km">5 Hours / 50 Kms</option>
                          <option value="8hr_80km">8 Hours / 80 Kms</option>
                          <option value="10hr_100km">10 Hours / 100 Kms</option>
                          <option value="12hr_120km">12 Hours / 120 Kms</option>
                        </select>
                      </div>
                    ) : calcTripType === 'tour_package' ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Predefined Tour</label>
                        <select
                          value={calcTourKey}
                          onChange={(e) => setCalcTourKey(e.target.value)}
                          className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                        >
                          {Object.keys(tariffConfig.tour_packages || {}).map(pkgKey => (
                            <option key={pkgKey} value={pkgKey}>
                              {tariffConfig.tour_packages[pkgKey].name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Days</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={calcDays}
                          onChange={(e) => setCalcDays(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Route / Itinerary</label>
                      <input
                        type="text"
                        value={calcRoute}
                        onChange={(e) => setCalcRoute(e.target.value)}
                        placeholder="e.g. Guindy to Kona Falls & Return"
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {(calcTripType === 'outstation_round' || calcTripType === 'outstation_oneway') && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Estimated Distance (Km)
                          <span className="text-[11px] font-normal text-slate-500 ml-1">
                            (Min {calcDays * (tariffConfig.vehicles[calcVehicle]?.min_km_per_day || 250)} km applies)
                          </span>
                        </label>
                        <input
                          type="number"
                          step="10"
                          value={calcDistanceKm}
                          onChange={(e) => setCalcDistanceKm(Number(e.target.value) || 0)}
                          className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    {calcTripType === 'local_package' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Extra Hours</label>
                          <input
                            type="number"
                            min="0"
                            value={calcExtraHours}
                            onChange={(e) => setCalcExtraHours(Number(e.target.value) || 0)}
                            className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Extra Km</label>
                          <input
                            type="number"
                            min="0"
                            value={calcExtraKm}
                            onChange={(e) => setCalcExtraKm(Number(e.target.value) || 0)}
                            className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Pickup & Return Timing Note
                      </label>
                      <input
                        type="text"
                        value={calcTimingNote}
                        onChange={(e) => setCalcTimingNote(e.target.value)}
                        placeholder="e.g. 6:00 AM Pickup – 10:00 PM Return (Single Pickup)"
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        State Border Permit ({calculatedFare.stateCode} — ₹{calculatedFare.statePermitAmt.toLocaleString('en-IN')})
                      </label>
                      <select
                        value={calcStateOverride}
                        onChange={(e) => setCalcStateOverride(e.target.value)}
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      >
                        <option value="AUTO">Auto-Detect from Route ({calculatedFare.stateCode})</option>
                        <option value="TN">Tamil Nadu (TN — ₹0 Home State)</option>
                        <option value="AP">Andhra Pradesh (AP — Kona Falls / Tirupati)</option>
                        <option value="PY">Puducherry (PY — Pondicherry)</option>
                        <option value="KA">Karnataka (KA — Bangalore / Mysore)</option>
                        <option value="KL">Kerala (KL — Sabarimala / Munnar)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name (Optional)</label>
                      <input
                        type="text"
                        value={calcCustName}
                        onChange={(e) => setCalcCustName(e.target.value)}
                        placeholder="e.g. Ramesh"
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Customer WhatsApp (Optional)</label>
                      <input
                        type="tel"
                        value={calcCustPhone}
                        onChange={(e) => setCalcCustPhone(e.target.value)}
                        placeholder="e.g. 9840100000"
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary & Dual Quote Output Right */}
                <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between shadow-inner space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
                          Base Fare: ₹{calculatedFare.baseTotal.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {calculatedFare.statePermitAmt > 0
                            ? `+ ${calculatedFare.stateCode} Permit ₹${calculatedFare.statePermitAmt.toLocaleString('en-IN')}`
                            : 'TN Home State (₹0 Permit)'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">Total w/ Permit</span>
                        <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                          ₹{calculatedFare.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="py-2.5 space-y-1 text-xs text-slate-300 font-mono border-b border-slate-800">
                      {calculatedFare.breakdownLines.map((line, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>• {line}</span>
                        </div>
                      ))}
                    </div>

                    {/* Option 1 Card */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase">
                          Option 1: Compact Micro-Receipt
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyQuote(calcOption1Text, 'Option 1 Micro-Receipt')}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-white border border-slate-700 cursor-pointer"
                          >
                            📋 Copy Opt 1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppQuote(calcOption1Text)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white cursor-pointer"
                          >
                            📲 WA
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransferToBooking(calculatedFare.total)}
                            className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white cursor-pointer"
                          >
                            🚀 Push
                          </button>
                        </div>
                      </div>
                      <textarea
                        readOnly
                        rows={6}
                        value={calcOption1Text}
                        className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none resize-none"
                      />
                    </div>

                    {/* Option 2 Card */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-400 uppercase">
                          Option 2: Detailed Itemized Quote
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyQuote(calcQuoteText, 'Option 2 Detailed Quote')}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-white border border-slate-700 cursor-pointer"
                          >
                            📋 Copy Opt 2
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppQuote(calcQuoteText)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white cursor-pointer"
                          >
                            📲 WA
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransferToBooking(calculatedFare.baseTotal)}
                            className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white cursor-pointer"
                            title="Push Base Fare to Dispatch Desk"
                          >
                            🚀 Push
                          </button>
                        </div>
                      </div>
                      <textarea
                        readOnly
                        rows={7}
                        value={calcQuoteText}
                        className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: NEW BOOKING ENTRY FORM                            */}
          {/* ========================================================= */}
          {activeNav === 'new-booking' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 animate-fadeIn max-w-4xl mx-auto space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">Direct Booking Intake Form</h3>
                <p className="text-xs text-slate-500">Record a confirmed trip into operations and sync directly to Google Sheets.</p>
              </div>

              <form onSubmit={handleCreateBooking} className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">1. Passenger Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Customer Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formCustName}
                        onChange={(e) => setFormCustName(e.target.value)}
                        placeholder="e.g. Aarti Venkatesh"
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mobile Number / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formCustPhone}
                        onChange={(e) => setFormCustPhone(e.target.value)}
                        placeholder="e.g. 9840100000"
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">2. Vehicle & Itinerary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Type</label>
                      <select
                        value={formVehicle}
                        onChange={(e) => setFormVehicle(e.target.value)}
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      >
                        {Object.keys(tariffConfig.vehicles).map(vKey => (
                          <option key={vKey} value={vKey}>{vKey}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Trip Category</label>
                      <select
                        value={formTripCategory}
                        onChange={(e) => setFormTripCategory(e.target.value)}
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      >
                        <option value="Outstation Round Trip">Outstation Round Trip</option>
                        <option value="Outstation One-Way Drop">Outstation One-Way Drop</option>
                        <option value="Local Chennai Rental">Local Chennai Rental</option>
                        <option value="Airport Transfer">Airport Transfer</option>
                        <option value="Tour Package">Tour Package</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Pickup Date</label>
                      <input
                        type="date"
                        value={formPickupDate}
                        onChange={(e) => setFormPickupDate(e.target.value)}
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Pickup Time</label>
                      <input
                        type="text"
                        value={formPickupTime}
                        onChange={(e) => setFormPickupTime(e.target.value)}
                        placeholder="e.g. 06:00 AM"
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Pickup Address / Land Mark</label>
                      <input
                        type="text"
                        value={formPickupLocation}
                        onChange={(e) => setFormPickupLocation(e.target.value)}
                        placeholder="e.g. Airport T2 Arrival / Anna Nagar East"
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Destination / Route</label>
                      <input
                        type="text"
                        value={formDropLocation}
                        onChange={(e) => setFormDropLocation(e.target.value)}
                        placeholder="e.g. Green Park Hotel / Pondicherry"
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">3. Fare & Financials</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Agreed Rate (₹)</label>
                      <input
                        type="number"
                        required
                        value={formAgreedRate}
                        onChange={(e) => setFormAgreedRate(Number(e.target.value) || 0)}
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Advance Received (₹)</label>
                      <input
                        type="number"
                        value={formAdvance}
                        onChange={(e) => setFormAdvance(Number(e.target.value) || 0)}
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Balance To Collect (₹)</label>
                      <div className="w-full text-sm bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-bold">
                        ₹{Math.max(0, (Number(formAgreedRate) || 0) - (Number(formAdvance) || 0)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Special Instructions / Passenger Notes</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. 6 adults + 2 kids, flight 6E-243 arriving 8:05am"
                    className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => navigateTo('dispatch')}
                    className="py-2.5 px-5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">check</span>
                    <span>Save & Add to Dispatch Desk</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 4: DRIVERS & FLEET ROSTER                            */}
          {/* ========================================================= */}
          {activeNav === 'drivers' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Attached Fleet & Chauffeur Roster</h3>
                  <p className="text-xs text-slate-500">
                    Standardized vehicle models, Chennai base zones, plate numbers, and 1-tap approval from <code>/attach-cab/</code>.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWaPasteModalOpen(true)}
                    className="text-xs font-bold px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition"
                  >
                    <span className="material-symbols-outlined text-sm">content_paste</span>
                    <span>Quick Paste WA Registration</span>
                  </button>
                  <div className="text-xs font-bold px-3.5 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                    {drivers.length} Active Vehicles / Drivers
                  </div>
                </div>
              </div>

              {/* Pending Applications Queue from /attach-cab/ */}
              {pendingLeads.length > 0 && (
                <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                      <h4 className="text-sm font-bold text-amber-950">
                        Pending Partner Applications from /attach-cab/ ({pendingLeads.length})
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-800">
                      Review uploaded docs &amp; click Approve to create Roster Card(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pendingLeads.map((lead) => (
                      <div key={lead.leadId} className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{lead.name}</span>
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                  {lead.partnerType || 'Partner'}
                                </span>
                              </div>
                              <div className="text-xs font-mono text-slate-500 mt-0.5">
                                +91 {lead.phone} • {lead.leadId}
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold">
                              📍 {lead.area} ({lead.zone})
                            </span>
                          </div>

                          {/* Vehicles list or Acting Driver details */}
                          {Array.isArray(lead.vehicles) && lead.vehicles.length > 0 ? (
                            <div className="space-y-1.5">
                              {lead.vehicles.map((v, i) => (
                                <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                                  <div>
                                    <span className="font-bold text-slate-900">#{i + 1}: {v.model}</span>
                                    <span className="text-slate-500 ml-1.5">({v.boardType} • {v.carrier})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                                      {v.plate}
                                    </span>
                                    {v.rcUrl && (
                                      <a href={v.rcUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 font-bold hover:underline">
                                        RC
                                      </a>
                                    )}
                                    {v.carUrl && (
                                      <a href={v.carUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 font-bold hover:underline">
                                        Car
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                              Chauffeur: <strong>{lead.licenseType}</strong> • Exp: <strong>{lead.experience}</strong> • Duty: <strong>{lead.preferredDuty}</strong>
                            </div>
                          )}

                          {/* Document Links */}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1">
                            {lead.dlLocalUrl && (
                              <a href={lead.dlLocalUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">badge</span>
                                <span>View Driving License</span>
                              </a>
                            )}
                            {lead.driveFolderUrl && (
                              <a href={lead.driveFolderUrl} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">folder</span>
                                <span>Google Drive Folder</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleApproveLeadToRoster(lead)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition"
                          >
                            <span className="material-symbols-outlined text-sm">verified</span>
                            <span>Approve to Active Roster ({lead.vehicles?.length || 1} Card)</span>
                          </button>
                          <a
                            href={`tel:${lead.phone}`}
                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition"
                          >
                            Call
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDismissLead(lead.leadId)}
                            className="p-2 text-slate-400 hover:text-red-500 rounded-lg"
                            title="Dismiss application"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Standardized Vehicle / Driver Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Add Standardized Vehicle / Chauffeur to Roster
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {['Owner-Driver', 'Fleet Partner', 'Acting Driver'].map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setNewDriverPartnerType(pt)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                          newDriverPartnerType === pt
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddDriver} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Driver / Owner Name *</label>
                      <input
                        type="text"
                        required
                        value={newDriverName}
                        onChange={(e) => setNewDriverName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={newDriverPhone}
                        onChange={(e) => setNewDriverPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="e.g. 9840123456"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Chennai Base Zone *</label>
                      <select
                        value={newDriverZone}
                        onChange={(e) => {
                          const zId = e.target.value;
                          setNewDriverZone(zId);
                          const zObj = CHENNAI_ZONES.find(z => z.id === zId);
                          if (zObj && zObj.areas[0]) setNewDriverArea(zObj.areas[0].name);
                        }}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-semibold"
                      >
                        {CHENNAI_ZONES.map(z => (
                          <option key={z.id} value={z.id}>{z.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Base Area (Standardized) *</label>
                      <select
                        value={newDriverArea}
                        onChange={(e) => setNewDriverArea(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-semibold"
                      >
                        {(CHENNAI_ZONES.find(z => z.id === newDriverZone)?.areas || []).map(a => (
                          <option key={a.name} value={a.name}>{a.name} ({a.pincode})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {newDriverPartnerType !== 'Acting Driver' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Vehicle Class</label>
                        <select
                          value={newDriverCategory}
                          onChange={(e) => {
                            const catId = e.target.value;
                            setNewDriverCategory(catId);
                            const catObj = VEHICLE_CATEGORIES.find(c => c.id === catId);
                            if (catObj && catObj.models[0]) setNewDriverVehicle(catObj.models[0]);
                          }}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-semibold"
                        >
                          {VEHICLE_CATEGORIES.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Exact Model (No Typos)</label>
                        <select
                          value={newDriverVehicle}
                          onChange={(e) => setNewDriverVehicle(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-semibold"
                        >
                          {(VEHICLE_CATEGORIES.find(c => c.id === newDriverCategory)?.models || []).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Plate Number</label>
                        <input
                          type="text"
                          value={newDriverPlate}
                          maxLength={13}
                          onChange={(e) => setNewDriverPlate(formatIndianPlateNumber(e.target.value))}
                          placeholder="TN 14 AK 2026"
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 uppercase font-mono font-bold focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Board &amp; Carrier</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <select
                            value={newDriverBoard}
                            onChange={(e) => setNewDriverBoard(e.target.value)}
                            className="text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 font-semibold"
                          >
                            <option value="Yellow Board">Yellow</option>
                            <option value="White Board">White</option>
                          </select>
                          <select
                            value={newDriverCarrier}
                            onChange={(e) => setNewDriverCarrier(e.target.value)}
                            className="text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 font-semibold"
                          >
                            <option value="With Carrier">Carrier</option>
                            <option value="No Carrier">No Carrier</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                          <span>Add to Roster</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {newDriverPartnerType === 'Acting Driver' && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>Add Acting Driver to Roster</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Multi-Filter Bar: Sort by Vehicle Class, Chennai Hub Zone, Board/Carrier & Search */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Vehicle Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Vehicle:</span>
                    {[
                      { id: 'ALL', label: 'All Vehicles' },
                      { id: 'Sedan', label: 'Sedan (4+1)' },
                      { id: 'SUV / Ertiga', label: 'Ertiga / SUV' },
                      { id: 'Innova Crysta', label: 'Innova Crysta' },
                      { id: 'Tempo Traveller', label: 'Tempo / Van' },
                      { id: 'Acting Driver', label: 'Acting Drivers' }
                    ].map(vTab => (
                      <button
                        key={vTab.id}
                        type="button"
                        onClick={() => setRosterVehicleFilter(vTab.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                          rosterVehicleFilter === vTab.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {vTab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative sm:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-base">search</span>
                    <input
                      type="text"
                      value={rosterSearchQuery}
                      onChange={(e) => setRosterSearchQuery(e.target.value)}
                      placeholder="Search area, name, plate, phone..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Zone Filter Pills + Board/Carrier Filter */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Zone:</span>
                    <button
                      type="button"
                      onClick={() => setRosterZoneFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                        rosterZoneFilter === 'ALL'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      All Zones
                    </button>
                    {CHENNAI_ZONES.map(z => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setRosterZoneFilter(z.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          rosterZoneFilter === z.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {z.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {['ALL', 'Yellow Board', 'White Board', 'With Carrier'].map(bf => (
                      <button
                        key={bf}
                        type="button"
                        onClick={() => setRosterBoardFilter(bf)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                          rosterBoardFilter === bf
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {bf === 'ALL' ? 'All Specs' : bf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drivers Grid */}
              {filteredRosterDrivers.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-xs">
                  No attached vehicles or drivers match the selected Vehicle / Zone filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRosterDrivers.map(driver => {
                    const activeDuty = activeTrips.find(
                      t => (t.driverPhone && driver.phone && t.driverPhone.includes(driver.phone.slice(-10))) ||
                           (t.vehicleNumber && driver.plate && t.vehicleNumber === driver.plate)
                    );
                    return (
                      <div key={driver.id} className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 transition">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100 shrink-0">
                                {(driver.name || 'D').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-sm text-slate-900">{driver.name}</h4>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    driver.partnerType === 'Fleet Partner'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : driver.partnerType === 'Acting Driver'
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}>
                                    {driver.partnerType || 'Owner-Driver'}
                                  </span>
                                </div>
                                <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                                  <span>📍 {driver.area || 'Medavakkam'}</span>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-slate-500">{driver.zone || 'South & OMR'}</span>
                                </div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-xs rounded border border-slate-200 font-bold shrink-0">
                              {driver.plate}
                            </span>
                          </div>

                          <div className="mt-3 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-xs text-blue-600">directions_car</span>
                                <span>{driver.vehicle}</span>
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                activeDuty ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {activeDuty ? `On Trip #${activeDuty.id}` : 'Available'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                              <div className="flex items-center gap-1.5">
                                {driver.boardType && driver.boardType !== 'Acting Driver' && (
                                  <span className={`px-1.5 py-0.5 rounded font-semibold ${
                                    driver.boardType === 'Yellow Board'
                                      ? 'bg-yellow-100 text-yellow-900'
                                      : 'bg-white border border-slate-200 text-slate-700'
                                  }`}>
                                    {driver.boardType}
                                  </span>
                                )}
                                {driver.carrier && driver.carrier !== 'No Carrier' && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                                    Roof Carrier
                                  </span>
                                )}
                              </div>
                              <a href={`tel:${driver.phone}`} className="text-blue-600 font-mono font-bold hover:underline">
                                {driver.phone}
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <a
                            href={`tel:${driver.phone}`}
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-xs">call</span>
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/91${driver.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Namaskaram ${driver.name} (${driver.vehicle} • ${driver.plate}), checking your availability for a Kalidass Travels trip near ${driver.area || 'Chennai'}.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                          >
                            <span className="material-symbols-outlined text-xs">chat</span>
                            <span>WhatsApp</span>
                          </a>
                          <button
                            onClick={() => handleDeleteDriver(driver.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                            title="Delete Vehicle / Driver"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Paste WhatsApp Registration Modal */}
              {waPasteModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-sm text-slate-900">Import Partner from WhatsApp Message</h4>
                      <button onClick={() => setWaPasteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Paste the registration message sent by a driver from <code>/attach-cab/</code>. Multi-vehicle messages automatically create separate cards per vehicle.
                    </p>
                    <textarea
                      rows={6}
                      value={waPasteText}
                      onChange={(e) => setWaPasteText(e.target.value)}
                      placeholder="Paste WhatsApp registration text here..."
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setWaPasteModalOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleImportFromWhatsAppText}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                      >
                        Import to Active Roster
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 5: SETTLEMENTS & REVIEWS                             */}
          {/* ========================================================= */}
          {activeNav === 'settlements' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Settlements & Customer Reviews</h3>
                  <p className="text-xs text-slate-500">Track completed trips, payments collected, and 5-star Google review submissions.</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Export CSV Ledger</span>
                </button>
              </div>

              {settledTrips.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                  <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
                  <div className="font-bold text-slate-600">No settled trips recorded yet</div>
                  <p className="text-xs">Trips marked completed in the Live Dispatch Desk will appear here.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Trip ID</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Vehicle & Route</th>
                          <th className="py-3 px-4">Chauffeur</th>
                          <th className="py-3 px-4 text-right">Amount Settled</th>
                          <th className="py-3 px-4 text-center">Google Review Action</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {settledTrips.map(trip => (
                          <tr key={trip.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">#{trip.id}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{trip.customerName}</div>
                              <div className="text-slate-500 font-mono text-[11px]">{trip.phone}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800">{trip.vehicle}</div>
                              <div className="text-slate-500 line-clamp-1 text-[11px]">{trip.route}</div>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700">
                              {trip.driverName || 'Verified'} ({trip.vehicleNumber || 'Cab'})
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                              ₹{Number(trip.agreedRate).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleSendGoogleReviewRequest(trip)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 inline-flex items-center gap-1 transition"
                              >
                                <span className="material-symbols-outlined text-xs text-yellow-500">star</span>
                                <span>Send WhatsApp Review Link</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleDeleteTrip(trip.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                                title="Delete Record"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 6: CLOUD SHEET & SETTINGS                            */}
          {/* ========================================================= */}
          {activeNav === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 animate-fadeIn max-w-3xl mx-auto space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">table_view</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Google Sheet Cloud Database (₹0 Cost)</h3>
                    <p className="text-xs text-slate-500">Enables real-time multi-device sync across every phone, laptop, and PC.</p>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Connection Status:</span>
                  <span className={`font-mono font-bold px-2.5 py-1 rounded-full text-[11px] ${
                    syncStatus === 'synced'
                      ? 'bg-emerald-100 text-emerald-800'
                      : syncStatus === 'error'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {syncStatus.toUpperCase()}
                  </span>
                </div>
                {syncMessage && <p className="text-slate-600 italic">{syncMessage}</p>}
              </div>

              {/* Input for Web App URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Google Apps Script Web App URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetInputUrl}
                    onChange={(e) => setSheetInputUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 text-xs font-mono bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSaveSheetUrl}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition shrink-0"
                  >
                    Save & Connect
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Save this URL once. Every computer or phone opening this desk will automatically load and save live trips from your Google Sheet.
                </p>
              </div>

              {/* 3-Step Setup Instructions */}
              <div className="bg-blue-50/70 border border-blue-200/70 rounded-2xl p-5 text-xs text-slate-700 space-y-4">
                <div className="font-bold text-blue-950 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm">Foolproof 1-Minute Setup Guide:</span>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-700 border border-blue-300 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      <span>1. Open Blank Google Sheet</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyScriptTemplate}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      <span>2. Copy Apps Script Code</span>
                    </button>
                  </div>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-700 text-xs leading-relaxed bg-white/70 p-3.5 rounded-xl border border-blue-100">
                  <li>Click <strong>"1. Open Blank Google Sheet"</strong> above (creates a new spreadsheet in your Google account).</li>
                  <li>In your Google Sheet's top menu bar, click <strong>Extensions</strong> → <strong>Apps Script</strong>.</li>
                  <li>Select all code in the editor, delete it, and paste the code you copied with the blue button above.</li>
                  <li>In the top right corner of Apps Script, click <strong>Deploy</strong> → <strong>New deployment</strong>.</li>
                  <li>Click the gear icon ⚙️ next to "Select type", choose <strong>Web app</strong>.</li>
                  <li>Set <em>Execute as: <strong>Me</strong></em> and <em>Who has access: <strong>Anyone</strong></em>, then click <strong>Deploy</strong>.</li>
                  <li>Copy the generated <strong>Web app URL</strong> (starts with <code>https://script.google.com/macros/s/...</code>), paste it in the box above, and click <strong>Save & Connect</strong>!</li>
                </ol>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">auto_awesome</span>
                  <div>
                    <span className="font-bold block">Automatic Website Lead Integration:</span>
                    Once connected, all quotation requests and bookings submitted on your public website (via BookingEngine or tour calculators) will automatically log into this Google Sheet and appear live in your <strong>"1. UNASSIGNED"</strong> dispatch queue!
                  </div>
                </div>
              </div>

              {/* Data Backup Card */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Local Data Export</h4>
                  <p className="text-[11px] text-slate-500">Download a full CSV copy of all operational trips anytime.</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
                >
                  Download CSV
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SMART DRIVER OUTSOURCE & ASSIGNMENT MODAL */}
      {assigningTrip && (() => {
        const math = computeSettlementMath(assigningTrip, assignCommissionPct);
        const modalDrivers = drivers.filter((d) => {
          const dCat = d.category || normalizeVehicleCategory(d.vehicle);
          if (assignVehicleFilter !== 'ALL' && dCat !== assignVehicleFilter) return false;
          if (assignZoneFilter !== 'ALL' && (d.zone || 'South & OMR') !== assignZoneFilter) return false;
          if (assignSearchQuery.trim()) {
            const q = assignSearchQuery.toLowerCase();
            const hay = `${d.name || ''} ${d.phone || ''} ${d.plate || ''} ${d.vehicle || ''} ${d.area || ''} ${d.zone || ''}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-fadeIn my-auto max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      #{assigningTrip.id}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">Outsource & Assign Vehicle / Driver</h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    <strong>{assigningTrip.customerName}</strong> • Required: <strong className="text-blue-700">{assigningTrip.vehicle}</strong> • Pickup: <strong>{assigningTrip.pickupLocation || assigningTrip.route}</strong> ({assigningTrip.pickupDate} @ {assigningTrip.pickupTime})
                  </p>
                </div>
                <button
                  onClick={() => setAssigningTrip(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* 10% Agency Commission & Live Settlement Calculator */}
              <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-base">payments</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Outsourced Trip Settlement Math</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    <label className="text-[11px] text-slate-300 font-semibold">Agency Commission %:</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={assignCommissionPct}
                      onChange={(e) => setAssignCommissionPct(Number(e.target.value) || 0)}
                      className="w-12 bg-slate-950 text-amber-300 font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-slate-700 text-center focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-800/90 p-2 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 block">Agreed Trip Fare</span>
                    <span className="font-mono font-bold text-white text-sm">₹{math.fare.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 block">Adv Paid: ₹{math.adv.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-800/90 p-2 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 block">Office Comm ({math.pct}%)</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">₹{math.commissionAmt.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 block">Kalidass Margin</span>
                  </div>
                  <div className="bg-slate-800/90 p-2 rounded-lg border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 block">Driver Net ({100 - math.pct}%)</span>
                    <span className="font-mono font-bold text-emerald-300 text-sm">₹{math.driverNetShare.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 block">Cust Bal: ₹{math.customerBalanceToDriver.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${
                    math.settlementDirection === 'DRIVER_PAYS_OFFICE'
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                      : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                  }`}>
                    <span className="text-[10px] font-bold uppercase block">
                      {math.settlementDirection === 'DRIVER_PAYS_OFFICE' ? 'Driver Pays Office' : 'Office Pays Driver'}
                    </span>
                    <span className="font-mono font-extrabold text-sm block">
                      ₹{math.settlementAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] opacity-85 block">After customer balance</span>
                  </div>
                </div>
              </div>

              {/* Filter Bar Inside Assign Modal */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase text-slate-500">1. Filter by Vehicle Class:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignVehicleFilter('ALL');
                      setAssignZoneFilter('ALL');
                      setAssignSearchQuery('');
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Show All ({drivers.length})
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['ALL', 'Sedan', 'SUV / Ertiga', 'Innova Crysta', 'Tempo Traveller', 'Acting Driver'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAssignVehicleFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        assignVehicleFilter === cat
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat === 'ALL' ? 'All Classes' : cat}
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">2. Filter by Pickup / Hub Zone:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAssignZoneFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        assignZoneFilter === 'ALL'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      All Zones
                    </button>
                    {CHENNAI_ZONES.map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setAssignZoneFilter(z.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          assignZoneFilter === z.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {z.shortLabel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <input
                    type="text"
                    value={assignSearchQuery}
                    onChange={(e) => setAssignSearchQuery(e.target.value)}
                    placeholder="Search by area (e.g. Medavakkam, Tambaram), driver name, or plate..."
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Matching Drivers List with 1-Click Call / WA Duty Offer / Assign */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Matching Attached Vehicles & Drivers ({modalDrivers.length})
                  </label>
                  <span className="text-[11px] text-slate-500">WA Offer hides customer phone until assigned</span>
                </div>

                {modalDrivers.length === 0 ? (
                  <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    No drivers match this exact filter. Click <strong>"All Zones"</strong> or <strong>"All Classes"</strong> above to widen your search.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {modalDrivers.map((d) => {
                      const activeDuty = trips.find(
                        (t) =>
                          t.manifestStatus === 'Active' &&
                          t.id !== assigningTrip.id &&
                          ((t.driverPhone && d.phone && t.driverPhone.slice(-10) === d.phone.slice(-10)) ||
                            (t.vehicleNumber && d.plate && t.vehicleNumber === d.plate))
                      );
                      return (
                        <div
                          key={d.id}
                          onClick={() => handleSelectRosterDriver(d.id)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                            selectedDriverId === d.id
                              ? 'bg-blue-50/90 border-blue-500 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900">{d.name}</span>
                              <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                                {d.plate}
                              </span>
                              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                {d.vehicle}
                              </span>
                              {activeDuty && (
                                <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                                  On Trip #{activeDuty.id}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span>📍 <strong>{d.area || 'Chennai'}</strong> ({d.zone || 'South & OMR'})</span>
                              <span>•</span>
                              <span>{d.boardType || 'Yellow Board'}</span>
                              <span>•</span>
                              <span>{d.carrier || 'With Carrier'}</span>
                              <span>•</span>
                              <span className="font-mono">{d.phone}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {d.phone && (
                              <a
                                href={`tel:${d.phone}`}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1"
                                title="Call Driver"
                              >
                                <span className="material-symbols-outlined text-xs">call</span>
                                <span>Call</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSendDriverDutyOffer(d, assigningTrip)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1"
                              title="Send WhatsApp Duty Offer (Customer Phone Hidden)"
                            >
                              <span className="material-symbols-outlined text-xs">chat</span>
                              <span>WA Offer</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmAssignment(d)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-xs">check</span>
                              <span>Assign</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Manual Override / Custom Driver Fields */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">
                  Or Type / Edit Driver Details Manually Before Confirming:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Driver Full Name</label>
                    <input
                      type="text"
                      required
                      value={customDriverName}
                      onChange={(e) => setCustomDriverName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Driver Phone</label>
                    <input
                      type="tel"
                      value={customDriverPhone}
                      onChange={(e) => setCustomDriverPhone(e.target.value)}
                      placeholder="e.g. 9840123456"
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Vehicle Plate No.</label>
                    <input
                      type="text"
                      value={customVehicleNumber}
                      onChange={(e) => setCustomVehicleNumber(formatIndianPlateNumber(e.target.value))}
                      placeholder="e.g. TN 14 AK 2026"
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningTrip(null)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmAssignment()}
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>Confirm & Dispatch</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
