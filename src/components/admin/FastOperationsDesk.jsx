import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  Calculator,
  Plus,
  Bot,
  MoreHorizontal,
  Users,
  IndianRupee,
  Settings,
  RefreshCw,
  Lock,
  Delete,
  X,
  Copy,
  Send,
  ArrowUpRight,
  Phone,
  MessageCircle,
  Edit3,
  Trash2,
  ArrowLeftRight,
  CheckCircle2,
  Car
} from 'lucide-react';
import MobileDispatchCopilot from './MobileDispatchCopilot.jsx';
import DirectBookingIntakeForm from './DirectBookingIntakeForm.jsx';
import ContactPickerControl from './ContactPickerControl.jsx';
import tariffConfig from '../../data/tariff_config.json' with { type: 'json' };
import { DRIVER_LEADS_WEBHOOK_URL } from '../../config/googleSheets.js';
import { getFormattedDateCode, getNextDriverRosterId, formatWhatsAppRefId, peekNextQuotationId } from '../../utils/sequenceGenerator.js';
import { loadImportedContacts, buildUnifiedContactsList } from '../../utils/contactBookHelper.js';
import {
  resolveExactRouteDistance,
  computeRoundTripPackageKm,
  estimateRouteToll
} from '../../utils/routeDistanceAndToll.js';
import {
  encodeTripForSheet,
  decodeTripFromSheet,
  getCleanNotes,
  buildCompactTermsSummary,
  formatShortDate,
  toIsoDate,
  getTodayIsoIST,
  computeTripDays,
  isTripActiveOnDate,
  buildWhatsAppUrl,
  formatPhoneForDisplay,
  buildCustomerBookingSummaryWA,
  buildCustomerConfirmationWA,
  buildEnhancedDriverDutySlipWA,
  buildTripScheduleLine,
  formatPickupAddress,
  formatDropAddress,
  formatLocationWithMapsLink,
  buildFollowUpReminderWA,
  normalizeManifestStatus,
  parseTripPickupTimestampIST,
  shouldAutoMoveToOnTrip,
  isOverdueWithoutDriver,
  parseWhatsAppBookingText,
  normalizePhoneNumber,
  normalizeUnifiedTripId
} from '../../utils/adminBookingHelper.js';
import {
  VEHICLE_CATEGORIES,
  ALL_STANDARDIZED_MODELS,
  CHENNAI_ZONES,
  ALL_CHENNAI_LOCALITIES,
  formatIndianPlateNumber,
  inferZoneFromAddress,
  normalizeVehicleCategory
} from '../../data/chennaiFleetStandards.js';

// Configuration keys
const PIN_KEY = 'kt_admin_pin_verified';
const PIN_REMEMBER_UNTIL_KEY = 'kt_admin_pin_verified_until';
const PIN_REMEMBER_DAYS = 30;
const GOOGLE_SHEET_URL_KEY = 'kt_admin_google_sheet_webhook_v1';
const LOCAL_BACKUP_KEY = 'kt_admin_offline_trips_backup_v2';
const DRIVERS_STORAGE_KEY = 'kt_admin_drivers_roster_v2';
const LEGACY_STORAGE_KEYS = ['kt_admin_offline_trips_backup_v1', 'kt_admin_drivers_roster_v1'];
const GOOGLE_REVIEW_URL = 'https://share.google/1IOq41QwMkhDJvrLY';
const DRIVER_LANGUAGES = ['Tamil', 'English', 'Telugu', 'Kannada', 'Malayalam', 'Hindi'];

// Exclude legacy/auto-logged website WhatsApp click leads from Live Dispatch Unassigned.
// Never hides trips that already have a driver assigned or are On Trip / Completed.
function isAutoWebsiteLead(trip) {
  if (!trip) return false;
  const status = normalizeManifestStatus(trip.manifestStatus);
  if (status === 'On Trip' || status === 'Completed') return false;
  if (String(trip.driverName || '').trim()) return false;

  const name = String(trip.customerName || '').trim().toLowerCase();
  const notes = String(trip.notes || '').trim().toLowerCase();
  const cat = String(trip.tripCategory || '').trim().toLowerCase();
  const phone = String(trip.phone || '').trim();

  return (
    name === 'website whatsapp lead' ||
    name === 'direct whatsapp guest' ||
    name === 'acting driver whatsapp lead' ||
    name === 'vehicle relocation whatsapp lead' ||
    notes.startsWith('website whatsapp click:') ||
    notes === 'booked via website whatsapp engine' ||
    notes === 'booked via website whatsapp' ||
    (cat === 'website lead' && !phone)
  );
}

function normalizeLanguages(val, fallback = []) {
  if (Array.isArray(val)) {
    const cleaned = val.map(v => String(v || '').trim()).filter(Boolean);
    return cleaned.length > 0 ? [...new Set(cleaned)] : fallback;
  }
  if (typeof val === 'string' && val.trim()) {
    const cleaned = val.split(',').map(v => v.trim()).filter(Boolean);
    return cleaned.length > 0 ? [...new Set(cleaned)] : fallback;
  }
  return fallback;
}

// Unified Google Apps Script template (v3: 2-way sync for Trips with Multi-Day/Guest/Terms + Drivers)
const APPS_SCRIPT_TEMPLATE = `// KALIDASS TRAVELS — GOOGLE SHEETS LIVE 2-WAY DATABASE (v3: TRIPS + MULTI-DAY/TERMS + DRIVERS)
// Paste this in Extensions -> Apps Script in your Google Sheet, then click 'Deploy -> Manage deployments -> Edit -> New version -> Deploy'
// (Or 'Deploy -> New deployment -> Web app', Execute as: Me, Who has access: Anyone).

var TRIP_HEADERS = [
  "id", "customerName", "phone", "tripCategory", "vehicle", "route",
  "pickupDate", "pickupTime", "pickupLocation", "dropLocation",
  "agreedRate", "advance", "balance", "driverName", "driverPhone",
  "vehicleNumber", "manifestStatus", "notes", "createdAt", "updatedAt",
  "returnDate", "days", "guestName", "guestPhone", "paxCount", "quoteRef", "billingTerms", "dayPlanJson"
];

var DRIVER_HEADERS = [
  "id", "name", "phone", "category", "vehicle", "plate", "zone", "area",
  "languages", "boardType", "carrier", "partnerType", "notes", "createdAt", "updatedAt"
];

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readSheetObjects(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var items = [];
  var tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[0] && !row[1]) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val instanceof Date) {
        if (headers[j] === "pickupDate" || headers[j] === "returnDate") {
          val = Utilities.formatDate(val, tz, "yyyy-MM-dd");
        } else if (headers[j] === "pickupTime") {
          val = Utilities.formatDate(val, tz, "hh:mm a");
        }
      }
      obj[headers[j]] = val;
    }
    items.push(obj);
  }
  return items;
}

function upsertRowById(sheet, headers, record) {
  var rows = sheet.getDataRange().getValues();
  var sheetHeaders = rows.length > 0 ? rows[0] : headers;
  var idIndex = sheetHeaders.indexOf("id");
  if (idIndex < 0) idIndex = 0;

  var foundRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idIndex]) === String(record.id)) {
      foundRow = i + 1;
      break;
    }
  }
  var rowData = [];
  for (var j = 0; j < sheetHeaders.length; j++) {
    var key = sheetHeaders[j];
    var val = record[key];
    if (Array.isArray(val)) val = val.join(", ");
    rowData.push(val !== undefined && val !== null ? val : "");
  }
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function deleteRowById(sheet, id) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return;
  var idIndex = rows[0].indexOf("id");
  if (idIndex < 0) idIndex = 0;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tripsSheet = ss.getSheets()[0];
  if (tripsSheet.getLastRow() === 0) {
    tripsSheet.appendRow(TRIP_HEADERS);
  }

  // Atomic Daily Sequential Quote Ref Coordinator (v4: KT/DDMMM/01, 02, 03...)
  var action = (e && e.parameter && e.parameter.action) || "";
  if (action === "next_quote_id" || action === "quote_id") {
    var lock = LockService.getScriptLock();
    var gotLock = lock.tryLock(5000);
    try {
      var dateCode = (e && e.parameter && e.parameter.dateCode) || Utilities.formatDate(new Date(), "Asia/Kolkata", "ddMMyy");
      var props = PropertiesService.getScriptProperties();
      var propKey = "quote_seq_" + dateCode;
      var currentSeq = parseInt(props.getProperty(propKey) || "0", 10) || 0;

      // Cross-check Trips sheet for any Q-DDMMYY-N or KT/DDMMM/NN saved today
      var monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      var ddStr = dateCode.slice(0, 2);
      var mmIdx = Math.max(0, Math.min(11, parseInt(dateCode.slice(2, 4), 10) - 1));
      var ktPrefix = "KT\\/" + ddStr + (monthNames[mmIdx] || "NOV") + "\\/";
      var qRegex = new RegExp("Q-" + dateCode + "-(\\d+)", "gi");
      var ktRegex = new RegExp(ktPrefix + "0*(\\d+)", "gi");

      var tripRows = tripsSheet.getDataRange().getValues();
      for (var r = 1; r < tripRows.length; r++) {
        var rowText = String(tripRows[r][0] || "") + " " + String(tripRows[r][17] || "") + " " + String(tripRows[r][25] || "");
        var m;
        qRegex.lastIndex = 0;
        while ((m = qRegex.exec(rowText)) !== null) {
          var v1 = parseInt(m[1], 10);
          if (!isNaN(v1) && v1 > currentSeq) currentSeq = v1;
        }
        ktRegex.lastIndex = 0;
        while ((m = ktRegex.exec(rowText)) !== null) {
          var v2 = parseInt(m[1], 10);
          if (!isNaN(v2) && v2 > currentSeq) currentSeq = v2;
        }
      }

      var shouldClaim = Boolean(e && e.parameter && (e.parameter.claim === "true" || e.parameter.advance === "true"));
      var nextSeq = currentSeq + 1;
      if (shouldClaim) {
        props.setProperty(propKey, String(nextSeq));
      }
      var assignedId = "Q-" + dateCode + "-" + nextSeq;
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        dateCode: dateCode,
        currentSeq: shouldClaim ? nextSeq : currentSeq,
        nextSeq: nextSeq,
        quoteId: assignedId,
        claimed: shouldClaim
      })).setMimeType(ContentService.MimeType.JSON);
    } finally {
      if (gotLock) lock.releaseLock();
    }
  }

  var driversSheet = getOrCreateSheet(ss, "Drivers", DRIVER_HEADERS);
  var trips = readSheetObjects(tripsSheet);
  var drivers = readSheetObjects(driversSheet);
  return ContentService.createTextOutput(JSON.stringify({
    schemaVersion: 4,
    trips: trips,
    drivers: drivers
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tripsSheet = ss.getSheets()[0];
  if (tripsSheet.getLastRow() === 0) {
    tripsSheet.appendRow(TRIP_HEADERS);
  }
  var driversSheet = getOrCreateSheet(ss, "Drivers", DRIVER_HEADERS);

  var contents = e.postData ? e.postData.contents : "{}";
  var data = JSON.parse(contents);

  // 1. Driver Roster Operations
  if (data.action === "SAVE_DRIVER" && data.driver) {
    upsertRowById(driversSheet, DRIVER_HEADERS, data.driver);
    return ContentService.createTextOutput(JSON.stringify({ success: true, id: data.driver.id })).setMimeType(ContentService.MimeType.JSON);
  }
  if (data.action === "DELETE_DRIVER" && data.id) {
    deleteRowById(driversSheet, data.id);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Trip / Booking Operations
  var trip = data.trip;
  if (!trip && (data.bookingId || data.type === 'booking')) {
    var rawPhone = data.phone || (data.guestNamePhone ? String(data.guestNamePhone).replace(/[^0-9]/g, '').slice(-10) : '');
    var rawBid = String(data.bookingId || "").trim().replace(/^#+/, "");
    var qm = rawBid.match(/^Q-(\d{2})(\d{2})\d{2}-(\d+)$/i);
    if (qm) {
      var mArr = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      var mIdx = Math.max(0, Math.min(11, parseInt(qm[2], 10) - 1));
      var seqPad = String(parseInt(qm[3], 10));
      if (seqPad.length < 2) seqPad = "0" + seqPad;
      rawBid = "KT/" + qm[1] + (mArr[mIdx] || "NOV") + "/" + seqPad;
    }
    var finalWebId = rawBid || ("KT-WEB-" + Date.now());
    trip = {
      id: finalWebId,
      quoteRef: finalWebId,
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
    upsertRowById(tripsSheet, TRIP_HEADERS, trip);
    return ContentService.createTextOutput(JSON.stringify({ success: true, id: trip.id })).setMimeType(ContentService.MimeType.JSON);
  }
  if (data.action === "DELETE_TRIP" && data.id) {
    deleteRowById(tripsSheet, data.id);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ error: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);
}`;

const DEFAULT_GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzyfKwbaG83dNG3EAWf719-UWbWxWpEoBQoRoRbJsHjD-Bx8uKUfytP5Eb2RXaJfgDz/exec';

export default function FastOperationsDesk() {
  // Security PIN (Owner PIN: 2015) — supports 30-day "Remember this phone" on Pixel/mobile
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const until = Number(window.localStorage?.getItem(PIN_REMEMBER_UNTIL_KEY) || 0);
        if (until > Date.now()) return true;
        if (window.sessionStorage?.getItem(PIN_KEY) === 'true') return true;
      } catch (_) {}
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

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
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  // Mobile single-stage tab state for Live Dispatch Desk (eliminates vertical scroll traps)
  const [mobileStage, setMobileStage] = useState('confirmed'); // 'quotation' | 'confirmed' | 'active' | 'completed'

  // Sync activeNav with URL Hash
  const navigateTo = (view) => {
    setActiveNav(view);
    setIsMobileMenuOpen(false);
    setIsMobileMoreOpen(false);
    if (typeof window !== 'undefined') {
      window.location.hash = view;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Google Sheets Config
  const sanitizeSheetUrl = (rawUrl) => {
    const clean = (rawUrl || '').trim();
    if (!clean || !clean.startsWith('https://script.google.com/') || clean.includes('AKfycbzjPh0a2ju') || clean.includes('AKfycbzpTM1pLXWLF')) {
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
          if (Array.isArray(parsed)) return parsed.map(decodeTripFromSheet);
        }
      } catch (_) {}
    }
    return [];
  });

  // Drivers Fleet Roster State (clean slate — never seeds dummy drivers)
  const [drivers, setDrivers] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Purge legacy v1 dummy-seeded cache once
        LEGACY_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
        const raw = localStorage.getItem(DRIVERS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed.map((d) => ({
              ...d,
              languages: normalizeLanguages(d.languages, ['Tamil'])
            }));
          }
        }
      } catch (_) {}
    }
    return [];
  });
  const [driverSyncSupported, setDriverSyncSupported] = useState(null); // null | true | false

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
          return toIsoDate(d);
        };
        const cleanTime = (t) => {
          if (!t) return '';
          const s = String(t).trim();
          if (s.includes('T')) {
            try {
              const dt = new Date(s);
              if (!isNaN(dt.getTime())) {
                return dt.toLocaleTimeString('en-US', {
                  timeZone: 'Asia/Kolkata',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                });
              }
            } catch (_) {}
          }
          return s;
        };

        const formatted = data.trips.map((row, idx) => {
          const agreed = Number(row.agreedRate) || 0;
          const adv = Number(row.advance) || 0;
          const status = normalizeManifestStatus(row.manifestStatus);
          return decodeTripFromSheet({
            ...row,
            id: row.id || `KT-BK-${Date.now()}-${idx}`,
            customerName: row.customerName || 'Customer',
            phone: String(row.phone || ''),
            tripCategory: row.tripCategory || 'Outstation',
            vehicle: row.vehicle || 'Sedan',
            route: row.route || `${row.pickupLocation || ''} -> ${row.dropLocation || ''}`,
            pickupDate: cleanDate(row.pickupDate),
            pickupTime: cleanTime(row.pickupTime),
            pickupLocation: row.pickupLocation || '',
            dropLocation: row.dropLocation || '',
            agreedRate: agreed,
            advance: adv,
            balance: status === 'Completed' ? 0 : Math.max(0, agreed - adv),
            driverName: row.driverName || '',
            driverPhone: String(row.driverPhone || ''),
            vehicleNumber: row.vehicleNumber || '',
            manifestStatus: row.manifestStatus || 'Unassigned',
            notes: row.notes || '',
            createdAt: row.createdAt || new Date().toISOString(),
            updatedAt: row.updatedAt || new Date().toISOString()
          });
        }).filter(trip => !isAutoWebsiteLead(trip)).reverse();
        setTrips(formatted);

        // 2-way Drivers sync (when Apps Script v2 is deployed)
        if (Array.isArray(data.drivers)) {
          const formattedDrivers = data.drivers
            .filter(row => row && (row.name || row.phone))
            .map((row, idx) => ({
              id: row.id || `DRV-${idx + 1}`,
              name: String(row.name || '').trim(),
              phone: String(row.phone || '').replace(/\D/g, '').slice(-10),
              category: row.category || normalizeVehicleCategory(row.vehicle || ''),
              vehicle: String(row.vehicle || '').trim() || 'Swift Dzire',
              plate: row.plate ? formatIndianPlateNumber(String(row.plate)) : '',
              zone: row.zone || inferZoneFromAddress(row.area || '') || 'South & OMR',
              area: String(row.area || '').trim(),
              languages: normalizeLanguages(row.languages, ['Tamil']),
              boardType: row.boardType || 'Yellow Board',
              carrier: row.carrier || 'With Carrier',
              partnerType: row.partnerType || 'Owner-Driver',
              notes: String(row.notes || '').trim(),
              createdAt: row.createdAt || '',
              updatedAt: row.updatedAt || ''
            }))
            .reverse();
          setDrivers(formattedDrivers);
          setDriverSyncSupported(true);
          setSyncStatus('synced');
          setSyncMessage(`Synced ${formatted.length} trips & ${formattedDrivers.length} drivers live from Google Sheet`);
        } else {
          setDriverSyncSupported(false);
          setSyncStatus('synced');
          setSyncMessage(`Synced ${formatted.length} trips from Google Sheet (update Apps Script in Settings to sync Drivers too)`);
        }
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
      const encodedTrip = encodeTripForSheet(trip);
      await fetch(googleSheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'SAVE_TRIP', trip: encodedTrip })
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

  const saveDriverToGoogleSheet = async (driver) => {
    if (!googleSheetUrl || !googleSheetUrl.startsWith('https://script.google.com/')) return;
    try {
      setSyncStatus('syncing');
      await fetch(googleSheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'SAVE_DRIVER',
          driver: {
            ...driver,
            languages: normalizeLanguages(driver.languages, ['Tamil']).join(', '),
            updatedAt: new Date().toISOString()
          }
        })
      });
      setSyncStatus('synced');
      setSyncMessage('Driver synced live to Google Sheet');
    } catch (err) {
      console.warn('Google Sheet driver save warning:', err);
      setSyncStatus('error');
      setSyncMessage('Driver saved locally; check Google Sheet connection');
    }
  };

  const deleteDriverFromGoogleSheet = async (id) => {
    if (!googleSheetUrl || !googleSheetUrl.startsWith('https://script.google.com/')) return;
    try {
      setSyncStatus('syncing');
      await fetch(googleSheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'DELETE_DRIVER', id })
      });
      setSyncStatus('synced');
      setSyncMessage('Driver removed from Google Sheet');
    } catch (err) {
      console.warn('Google Sheet driver delete warning:', err);
    }
  };

  // ==========================================
  // VIEW 1: RATE CALCULATOR & QUOTE GENERATOR
  // ==========================================
  const [calcTripType, setCalcTripType] = useState('outstation_round');
  const [calcVehicle, setCalcVehicle] = useState('Swift Dzire');
  const [calcLocalPkg, setCalcLocalPkg] = useState('4hr_40km');
  const [calcTourKey, setCalcTourKey] = useState('tirupati-package');
  const [calcRoute, setCalcRoute] = useState('');
  const [calcTimingNote, setCalcTimingNote] = useState('');
  const [calcStateOverride, setCalcStateOverride] = useState('AUTO');
  const [calcDays, setCalcDays] = useState(1);
  const [calcDistanceKm, setCalcDistanceKm] = useState(250);
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

  // Auto-resolve exact route km & verified NHAI plazas from KNOWN_DESTINATIONS / free OSRM when calcRoute changes
  const [calcRoutePlazas, setCalcRoutePlazas] = useState([]);
  const [calcTollVerified, setCalcTollVerified] = useState(false);
  const [calcIncludeToll, setCalcIncludeToll] = useState(true);

  useEffect(() => {
    const raw = String(calcRoute || '').trim();
    if (!raw || (calcTripType !== 'outstation_round' && calcTripType !== 'outstation_oneway')) {
      setCalcRoutePlazas([]);
      setCalcTollVerified(false);
      return;
    }

    const parts = raw.split(/\s*(?:⇄|➔|->|to)\s*/i).map(s => s.trim()).filter(Boolean);
    const originText = parts.length >= 2 ? parts[0] : 'Chennai';
    const destText = parts.length >= 2 ? parts[parts.length - 1] : raw;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await resolveExactRouteDistance({ originText, destText });
      if (cancelled || !res?.oneWayKm) return;
      setCalcRoutePlazas(Array.isArray(res.plazas) ? res.plazas : []);
      setCalcTollVerified(Boolean(res.verified));
      const v = tariffConfig.vehicles[calcVehicle] || tariffConfig.vehicles['Swift Dzire'];
      if (calcTripType === 'outstation_round') {
        const pkg = computeRoundTripPackageKm(res.oneWayKm, v.min_km_per_day || 250, calcDays);
        setCalcDistanceKm(pkg.suggestedRoundTripKm);
      } else {
        setCalcDistanceKm(res.oneWayKm);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [calcRoute, calcTripType, calcDays, calcVehicle]);

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

    const parts = String(calcRoute || '').split(/\s*(?:⇄|➔|->|to)\s*/i).map(s => s.trim()).filter(Boolean);
    const originText = parts.length >= 2 ? parts[0] : 'Chennai';
    const destText = parts.length >= 2 ? parts[parts.length - 1] : calcRoute;
    const autoToll = (calcTripType === 'outstation_round' || calcTripType === 'outstation_oneway')
      ? estimateRouteToll({
          plazas: calcRoutePlazas,
          verified: calcTollVerified,
          destinationText: destText,
          originText,
          vehicleNameOrId: calcVehicle,
          tripType: calcTripType === 'outstation_round' ? 'round' : 'oneway',
          days: calcDays,
        })
      : null;
    const includedExactToll = (calcIncludeToll && autoToll?.verified && tollEstimate === 0) ? autoToll.exactToll : 0;

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

    const total = baseTotal + statePermitAmt + tollEstimate + includedExactToll;
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
      advanceAmt: 500,
      tollEstimate,
      includedExactToll,
      autoToll,
      total,
      breakdownLines
    };
  }, [calcTripType, calcVehicle, calcLocalPkg, calcTourKey, calcDays, calcDistanceKm, calcTollParking, calcExtraHours, calcExtraKm, detectedStateCode, calcRoute, calcRoutePlazas, calcTollVerified, calcIncludeToll]);

  // Unified Contact Book (Past Customers + Drivers + Imported Phonebook .vcf/.csv)
  const [importedContacts, setImportedContacts] = useState(() => loadImportedContacts());
  const savedContacts = useMemo(
    () => buildUnifiedContactsList(trips, drivers, importedContacts),
    [trips, drivers, importedContacts]
  );

  // Live Sequential Quotation Ref (read-only peek until user actually Copies/Sends/Pushes)
  const [calcQuoteId, setCalcQuoteId] = useState(() => {
    try {
      return peekNextQuotationId?.() || `Q-${getFormattedDateCode()}-1`;
    } catch (_) {
      return `Q-${getFormattedDateCode()}-1`;
    }
  });

  useEffect(() => {
    if (activeNav !== 'quotes' || typeof fetch !== 'function') return;
    const webhookParam = googleSheetUrl ? `?webhook=${encodeURIComponent(googleSheetUrl)}` : '';
    fetch(`/api/next-quote-id${webhookParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.quoteId) {
          setCalcQuoteId(data.quoteId);
        }
      })
      .catch(() => {});
  }, [activeNav, googleSheetUrl]);

  const claimAtomicQuoteRef = async () => {
    const todayPrefix = formatWhatsAppRefId(`Q-${getFormattedDateCode()}-1`).replace(/\/\d+$/, '/');
    let maxTodaySeq = 0;
    const seqRegex = new RegExp(`^${todayPrefix.replace(/\//g, '\\/')}0*(\\d+)$`, 'i');
    for (const t of trips) {
      for (const candidate of [t.id, t.quoteRef]) {
        const m = String(candidate || '').trim().match(seqRegex);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!Number.isNaN(n) && n > maxTodaySeq) maxTodaySeq = n;
        }
      }
    }
    const peeked = formatWhatsAppRefId(calcQuoteId);
    const peekMatch = peeked.match(seqRegex);
    const peekSeq = peekMatch ? parseInt(peekMatch[1], 10) : 0;
    const fallbackSeq = Math.max(maxTodaySeq + 1, peekSeq || 1);
    const fallbackRef = `${todayPrefix}${String(fallbackSeq).padStart(2, '0')}`;

    if (typeof fetch !== 'function') return fallbackRef;
    try {
      const webhookParam = googleSheetUrl ? `?webhook=${encodeURIComponent(googleSheetUrl)}` : '';
      const res = await fetch(`/api/next-quote-id${webhookParam}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.quoteId) {
          const claimedRef = formatWhatsAppRefId(data.quoteId);
          if (data.nextQuoteId) setCalcQuoteId(data.nextQuoteId);
          return claimedRef;
        }
      }
    } catch (_) {}
    return fallbackRef;
  };

  useEffect(() => {
    const cleanRef = formatWhatsAppRefId(calcQuoteId);
    let tripTitle = '';
    if (calcTripType === 'outstation_round') tripTitle = `${calcDays} Day${calcDays > 1 ? 's' : ''}`;
    else if (calcTripType === 'outstation_oneway') tripTitle = 'One-Way Drop';
    else if (calcTripType === 'local_package') tripTitle = `Local (${calcLocalPkg.replace('_', ' ')})`;
    else if (calcTripType === 'tour_package') tripTitle = tariffConfig.tour_packages?.[calcTourKey]?.name || 'Temple Tour';

    const permitLine = calculatedFare.statePermitAmt > 0
      ? `\n• ${calculatedFare.stateCode} Permit = ₹${calculatedFare.statePermitAmt.toLocaleString('en-IN')}`
      : '';
    const balanceAmt = Math.max(0, calculatedFare.total - calculatedFare.advanceAmt);

    const tollIncluded = Boolean(calculatedFare.includedExactToll > 0 && calculatedFare.autoToll?.verified);
    const tollBillingLine = tollIncluded
      ? `\n• FASTag Tolls (${calculatedFare.autoToll.plazaCount} Plazas) = ₹${calculatedFare.includedExactToll.toLocaleString('en-IN')}`
      : '';
    const extraLabel = tollIncluded ? 'Parking Extra' : 'Extra';
    const extraSlipLine = tollIncluded ? '• Parking' : '• Toll & Parking';

    // Option 1: Auditor Short-Line WhatsApp Quote
    const opt1 = `*KALIDASS TRAVELS*
${calcRoute || 'Chennai Outstation'} (${tripTitle})${calcTimingNote ? `\nPickup: ${calcTimingNote}` : ''}
Vehicle: ${calcVehicle} AC

*BILLING (${calculatedFare.chargeableKm} KM PACKAGE)*
• ${calculatedFare.chargeableKm} km × ₹${calculatedFare.kmRate}/km = ₹${calculatedFare.base.toLocaleString('en-IN')}
• Driver Bata (${calcDays} Day${calcDays > 1 ? 's' : ''}) = ₹${calculatedFare.driverBata.toLocaleString('en-IN')}${tollBillingLine}${permitLine}
*Estimated Fare: ₹${calculatedFare.total.toLocaleString('en-IN')} + ${extraLabel}*
(Pickup to drop + local visits)

*Extra (Pay as per slip):*
${extraSlipLine}

*Over-limit (Only if > ${calculatedFare.chargeableKm} km):*
• Extra km: ₹${calculatedFare.extraKmRate} / km

*To Confirm:*
• Advance now: ₹${calculatedFare.advanceAmt.toLocaleString('en-IN')}
• Balance to driver: ₹${balanceAmt.toLocaleString('en-IN')} + ${extraLabel}
Call: +91 89395 39211
Ref: ${cleanRef}`;

    // Option 2: Ultra-Short 'Cab Available + ₹500 QR' Reply
    const opt2 = `Yes Sir/Mam, vehicle is available.

To confirm booking:
1. Share *Pickup Address*
2. Pay *₹${calculatedFare.advanceAmt.toLocaleString('en-IN')} advance* via attached QR
   UPI: saravn.appu@okhdfcbank (Saravanan K)`;

    setCalcOption1Text(opt1);
    setCalcQuoteText(opt2);
  }, [calculatedFare, calcVehicle, calcRoute, calcTimingNote, calcCustName, calcTripType, calcDays, calcLocalPkg, calcTourKey, calcQuoteId]);

  const handleSendWhatsAppQuote = async (textToUse = calcQuoteText, shouldClaimRef = false) => {
    let finalText = textToUse;
    if (shouldClaimRef && /Ref:\s*KT\/\S+/i.test(textToUse)) {
      const claimedRef = await claimAtomicQuoteRef();
      finalText = textToUse.replace(/Ref:\s*KT\/\S+/i, `Ref: ${claimedRef}`);
    }
    window.open(buildWhatsAppUrl(calcCustPhone, finalText), '_blank');
  };

  const handleCopyQuote = async (textToUse = calcQuoteText, label = 'Quote', shouldClaimRef = false) => {
    let finalText = textToUse;
    let claimedRef = '';
    if (shouldClaimRef && /Ref:\s*KT\/\S+/i.test(textToUse)) {
      claimedRef = await claimAtomicQuoteRef();
      finalText = textToUse.replace(/Ref:\s*KT\/\S+/i, `Ref: ${claimedRef}`);
    }
    navigator.clipboard.writeText(finalText);
    showToast(claimedRef ? `${label} copied! (${claimedRef})` : `${label} copied to clipboard!`);
  };

  const [bookingPrefill, setBookingPrefill] = useState(null);

  const handleTransferToBooking = async (overrideFare = null) => {
    let tripCat = 'Tour Package';
    if (calcTripType === 'outstation_round') tripCat = 'Outstation Round Trip';
    else if (calcTripType === 'outstation_oneway') tripCat = 'Outstation One-Way Drop';
    else if (calcTripType === 'local_package') tripCat = 'Local Chennai Rental';

    const claimedRef = await claimAtomicQuoteRef();

    setBookingPrefill({
      _nonce: Date.now(),
      customerName: calcCustName || '',
      phone: calcCustPhone || '',
      quoteRef: claimedRef,
      vehicle: calcVehicle,
      agreedRate: overrideFare !== null ? overrideFare : calculatedFare.total,
      advance: 0,
      dropLocation: calcRoute,
      notes: calcTimingNote || '',
      tripCategory: tripCat,
      includedKm: calculatedFare.chargeableKm || 0,
      statePermit: calculatedFare.statePermitAmt || 0,
      driverBata: calculatedFare.driverBata || 0
    });
    navigateTo('new-booking');
    showToast(`Quote ${claimedRef} populated into Booking Form!`);
  };

  const handlePushFromCopilot = (meta) => {
    if (!meta) return;
    setBookingPrefill({
      _nonce: Date.now(),
      vehicle: meta.vehicle && tariffConfig.vehicles[meta.vehicle] ? meta.vehicle : 'Swift Dzire',
      tripCategory: meta.tripCategory || 'Outstation Round Trip',
      pickupLocation: meta.pickupLocation || '',
      dropLocation: meta.dropLocation || meta.route || '',
      pickupTime: meta.pickupTime || '',
      agreedRate: meta.agreedRate ? Number(meta.agreedRate) : '',
      notes: meta.notes || '',
      advance: 0
    });
    navigateTo('new-booking');
    showToast(`Pushed ${meta.vehicle || 'Trip'} (₹${Number(meta.agreedRate || 0).toLocaleString('en-IN')}) to Booking Form!`);
  };

  // ==========================================
  // VIEW 2: DIRECT BOOKING INTAKE FORM & EDIT
  // ==========================================
  // Edit Booking Modal State
  const [editingTrip, setEditingTrip] = useState(null);

  const handleOpenEditTrip = (trip) => {
    setEditingTrip({
      ...trip,
      agreedRate: trip.agreedRate ?? '',
      advance: trip.advance ?? 0,
      notes: getCleanNotes(trip.notes)
    });
  };

  const handleSaveEditedTrip = (e) => {
    e.preventDefault();
    if (!editingTrip) return;
    const agreed = Number(editingTrip.agreedRate) || 0;
    const adv = Number(editingTrip.advance) || 0;
    const extras = Number(editingTrip.extraCharges) || 0;
    const commPct = editingTrip.commissionPct !== undefined && editingTrip.commissionPct !== '' ? Number(editingTrip.commissionPct) : 10;
    const collector = editingTrip.paymentCollector || 'Driver';
    const nextStatus = normalizeManifestStatus(editingTrip.manifestStatus);
    const pickupLoc = String(editingTrip.pickupLocation || '').trim();
    const dropLoc = String(editingTrip.dropLocation || '').trim();
    const days = editingTrip.returnDate && editingTrip.pickupDate
      ? computeTripDays(editingTrip.pickupDate, editingTrip.returnDate)
      : (Number(editingTrip.days) || 1);
    const nowIso = new Date().toISOString();
    const math = computeSettlementMath(
      { ...editingTrip, agreedRate: agreed, advance: adv, extraCharges: extras, paymentCollector: collector },
      commPct
    );
    const baseBal = Math.max(0, agreed - adv);

    const updatedTrip = {
      ...editingTrip,
      manifestStatus: nextStatus,
      customerName: String(editingTrip.customerName || '').trim() || 'Customer',
      phone: normalizePhoneNumber(editingTrip.phone) || String(editingTrip.phone || '').trim(),
      guestName: String(editingTrip.guestName || '').trim(),
      guestPhone: normalizePhoneNumber(editingTrip.guestPhone) || String(editingTrip.guestPhone || '').trim(),
      paxCount: String(editingTrip.paxCount || '').trim(),
      quoteRef: String(editingTrip.quoteRef || '').trim(),
      pickupLocation: pickupLoc,
      dropLocation: dropLoc,
      days,
      route: pickupLoc || dropLoc ? `${pickupLoc || 'Chennai'} -> ${dropLoc || 'Destination'}` : (editingTrip.route || ''),
      agreedRate: agreed,
      advance: adv,
      extraCharges: extras,
      extraChargesNote: String(editingTrip.extraChargesNote || '').trim(),
      paymentCollector: collector,
      commissionPct: math.pct,
      commissionAmount: math.commissionAmt,
      driverNetShare: math.driverNetShare,
      settlementDirection: math.settlementDirection,
      settlementAmount: math.settlementAmount,
      balance: nextStatus === 'Completed' ? 0 : baseBal,
      ...(nextStatus === 'Completed'
        ? { finalCollected: baseBal + extras, completedAt: editingTrip.completedAt || nowIso }
        : {}),
      ...(nextStatus === 'On Trip' && !editingTrip.startedAt ? { startedAt: nowIso } : {}),
      notes: getCleanNotes(editingTrip.notes),
      updatedAt: nowIso
    };
    setTrips(prev => prev.map(t => (t.id === updatedTrip.id ? updatedTrip : t)));
    saveTripToGoogleSheet(updatedTrip);
    setEditingTrip(null);
    showToast(`Booking #${updatedTrip.id} updated & synced!`);
  };

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

  const handleSaveNewBooking = async (payload, { sendWhatsApp = false } = {}) => {
    const providedRef = normalizeUnifiedTripId(payload.quoteRef || '');
    const unifiedId = providedRef || (await claimAtomicQuoteRef());
    const nowIso = new Date().toISOString();

    const existingTrip = trips.find(
      t =>
        String(t.id || '').trim().toLowerCase() === unifiedId.toLowerCase() ||
        (t.quoteRef && String(t.quoteRef).trim().toLowerCase() === unifiedId.toLowerCase())
    );

    const savedTrip = existingTrip
      ? {
          ...existingTrip,
          ...payload,
          id: unifiedId,
          quoteRef: unifiedId,
          driverName: existingTrip.driverName || '',
          driverPhone: existingTrip.driverPhone || '',
          vehicleNumber: existingTrip.vehicleNumber || '',
          createdAt: existingTrip.createdAt || nowIso,
          updatedAt: nowIso
        }
      : {
          ...payload,
          id: unifiedId,
          quoteRef: unifiedId,
          driverName: '',
          driverPhone: '',
          vehicleNumber: '',
          createdAt: nowIso,
          updatedAt: nowIso
        };

    setTrips(prev => {
      const exists = prev.some(t => t.id === savedTrip.id);
      return exists ? prev.map(t => (t.id === savedTrip.id ? savedTrip : t)) : [savedTrip, ...prev];
    });
    saveTripToGoogleSheet(savedTrip);
    setBookingPrefill(null);

    if (sendWhatsApp) {
      const waText = buildCustomerBookingSummaryWA(savedTrip);
      window.open(buildWhatsAppUrl(savedTrip.phone, waText), '_blank');
    }

    const stageLabel =
      normalizeManifestStatus(savedTrip.manifestStatus) === 'Quotation'
        ? '1. Quotation / Enquiry'
        : '2. Confirmed';
    showToast(
      existingTrip
        ? `${unifiedId} updated & promoted to ${stageLabel}!`
        : `${unifiedId} saved to ${stageLabel}!`
    );
    navigateTo('dispatch');
  };

  // ==========================================
  // STAGE 1 -> STAGE 2: CONFIRM QUOTATION MODAL
  // ==========================================
  const [confirmingTrip, setConfirmingTrip] = useState(null);
  const [confirmWaPaste, setConfirmWaPaste] = useState('');

  const handleOpenConfirmModal = (trip) => {
    const isPlaceholderName = /website\s*whatsapp\s*lead|^guest\b/i.test(String(trip.customerName || '').trim());
    setConfirmingTrip({
      ...trip,
      customerName: isPlaceholderName ? '' : (trip.customerName || ''),
      phone: trip.phone || '',
      pickupDate: trip.pickupDate || getTodayIsoIST(),
      pickupTime: trip.pickupTime || '06:00 AM',
      pickupLocation: trip.pickupLocation || '',
      dropLocation: trip.dropLocation || '',
      vehicle: trip.vehicle || 'Swift Dzire',
      agreedRate: Number(trip.agreedRate) || '',
      advance: Number(trip.advance) > 0 ? Number(trip.advance) : 500,
      notes: getCleanNotes(trip.notes)
    });
    setConfirmWaPaste('');
  };

  const handleParseConfirmWhatsApp = () => {
    if (!confirmingTrip || !confirmWaPaste.trim()) {
      showToast('Paste the customer WhatsApp quote first', 'error');
      return;
    }
    const { parsed, highlights } = parseWhatsAppBookingText(confirmWaPaste, tariffConfig);
    setConfirmingTrip(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        customerName: parsed.customerName || prev.customerName,
        phone: parsed.phone || prev.phone,
        quoteRef: parsed.quoteRef || prev.quoteRef,
        vehicle: parsed.vehicle || prev.vehicle,
        tripCategory: parsed.tripCategory || prev.tripCategory,
        pickupDate: parsed.pickupDate || prev.pickupDate,
        returnDate: parsed.returnDate || prev.returnDate,
        pickupTime: parsed.pickupTime || prev.pickupTime,
        pickupLocation: parsed.pickupLocation || prev.pickupLocation,
        dropLocation: parsed.dropLocation || prev.dropLocation,
        agreedRate: parsed.agreedRate || prev.agreedRate,
        advance: parsed.suggestedAdvance || prev.advance,
        paxCount: parsed.paxCount || prev.paxCount,
        guestName: parsed.guestName || prev.guestName,
        guestPhone: parsed.guestPhone || prev.guestPhone,
        hotelName: parsed.hotelName || prev.hotelName,
        tollPolicy: parsed.tollPolicy || prev.tollPolicy,
        extraKmRate: parsed.extraKmRate || prev.extraKmRate,
        extraHrRate: parsed.extraHrRate || prev.extraHrRate,
        nightStayCharge: parsed.nightStayCharge || prev.nightStayCharge,
        dayPlan: Array.isArray(parsed.dayPlan) && parsed.dayPlan.length > 0 ? parsed.dayPlan : prev.dayPlan
      };
    });
    showToast(
      highlights.length > 0
        ? `Auto-filled from WhatsApp (${highlights.slice(0, 3).join(' • ')})`
        : 'Parsed WhatsApp quote — verify Name, Phone & Advance!'
    );
  };

  const handleSubmitConfirmQuotation = (e, { sendWhatsApp = false } = {}) => {
    if (e) e.preventDefault();
    if (!confirmingTrip) return;
    const cleanName = String(confirmingTrip.customerName || '').trim();
    const cleanPhone = normalizePhoneNumber(confirmingTrip.phone);
    if (!cleanName) {
      showToast('Please enter Customer Name', 'error');
      return;
    }
    if (!cleanPhone) {
      showToast('Please enter Customer Phone Number', 'error');
      return;
    }

    const agreed = Number(confirmingTrip.agreedRate) || 0;
    const adv = Number(confirmingTrip.advance) || 0;
    const pickupLoc = String(confirmingTrip.pickupLocation || '').trim() || 'Chennai';
    const dropLoc = String(confirmingTrip.dropLocation || '').trim();
    const updatedTrip = {
      ...confirmingTrip,
      customerName: cleanName,
      phone: cleanPhone,
      pickupLocation: pickupLoc,
      dropLocation: dropLoc,
      route: dropLoc ? `${pickupLoc} -> ${dropLoc}` : (confirmingTrip.route || pickupLoc),
      agreedRate: agreed,
      advance: adv,
      balance: Math.max(0, agreed - adv),
      manifestStatus: 'Confirmed',
      notes: getCleanNotes(confirmingTrip.notes),
      updatedAt: new Date().toISOString()
    };

    setTrips(prev => prev.map(t => (t.id === updatedTrip.id ? updatedTrip : t)));
    saveTripToGoogleSheet(updatedTrip);
    setConfirmingTrip(null);
    setConfirmWaPaste('');

    if (sendWhatsApp) {
      const waText = buildCustomerBookingSummaryWA(updatedTrip);
      window.open(buildWhatsAppUrl(updatedTrip.phone, waText), '_blank');
    }

    showToast(`Confirmed #${updatedTrip.id} (Adv ₹${adv.toLocaleString('en-IN')}) → Moved to 2. Confirmed!`);
  };

  const handleSendFollowUpWA = (trip) => {
    const text = buildFollowUpReminderWA(trip);
    window.open(buildWhatsAppUrl(trip.phone, text), '_blank');
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
  const [assignLanguageFilter, setAssignLanguageFilter] = useState('ALL');
  const [assignSearchQuery, setAssignSearchQuery] = useState('');

  // Compute commission & settlement math for a trip
  const computeSettlementMath = (trip, commPct = 10, overrides = {}) => {
    const baseFare = Number(trip?.agreedRate || 0);
    const extras = Number(overrides.extraCharges ?? trip?.extraCharges ?? 0);
    const fare = baseFare + extras;
    const adv = Number(trip?.advance || 0);
    const pct = Math.max(0, Math.min(50, Number(commPct) || 0));
    const commissionAmt = Math.round((fare * pct) / 100);
    const driverNetShare = Math.max(0, fare - commissionAmt);
    const collector = overrides.paymentCollector ?? trip?.paymentCollector ?? 'Driver';
    const customerBalanceToDriver = Math.max(0, fare - adv);
    // If Driver collects balance: netDiff = collectedByDriver - driverNetShare = commissionAmt - adv
    // If Office collects balance: driver collected ₹0, so Office owes Driver full driverNetShare
    const netDiff = collector === 'Office' ? -driverNetShare : (customerBalanceToDriver - driverNetShare);
    return {
      fare,
      baseFare,
      extras,
      adv,
      pct,
      commissionAmt,
      driverNetShare,
      customerBalanceToDriver,
      collector,
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
    setAssignLanguageFilter('ALL');
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
    const balanceToCollect = Number(trip.balance ?? Math.max(0, (Number(trip.agreedRate) || 0) - (Number(trip.advance) || 0)));
    const text = `*KALIDASS TRAVELS — DUTY AVAILABILITY CHECK*
Namaskaram *${driver.name}* (${driver.vehicle} - ${driver.plate}),
Are you available for this upcoming trip?

*Date & Time:* ${trip.pickupDate || 'Today'} @ ${trip.pickupTime || 'ASAP'}
*Pickup Area:* ${trip.pickupLocation || 'Chennai'}
*Route / Drop:* ${trip.dropLocation || trip.route}
*Required Cab:* ${trip.vehicle} (${trip.tripCategory})

*Amount to Collect:* *₹${balanceToCollect.toLocaleString('en-IN')}${trip.tollPolicy === 'All-Inclusive' ? ' (All-Inclusive)' : ' + Toll & Parking (Actuals)'}*

*Reply YES immediately to lock this duty & receive Passenger Contact Slip.*`;

    window.open(buildWhatsAppUrl(driver.phone, text), '_blank');
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
    const pickupMs = parseTripPickupTimestampIST(assigningTrip.pickupDate, assigningTrip.pickupTime);
    const isAlreadyOnTrip = normalizeManifestStatus(assigningTrip.manifestStatus) === 'On Trip';
    const shouldStartNow = isAlreadyOnTrip || (pickupMs !== null && Date.now() >= pickupMs);

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
      manifestStatus: shouldStartNow ? 'On Trip' : 'Confirmed',
      ...(shouldStartNow && !assigningTrip.startedAt ? { startedAt: new Date().toISOString() } : {}),
      updatedAt: new Date().toISOString()
    };

    const updatedList = trips.map(t => (t.id === assigningTrip.id ? updatedTrip : t));
    setTrips(updatedList);
    saveTripToGoogleSheet(updatedTrip);
    setAssigningTrip(null);
    showToast(
      shouldStartNow
        ? `Assigned ${dName} (${updatedTrip.vehicleNumber}) — Pickup time reached, moved to 3. On Trip!`
        : `Assigned ${dName} (${updatedTrip.vehicleNumber})! Ready in 2. Confirmed (auto-moves to On Trip at pickup time).`
    );
  };

  // Manual override: Start Trip Now (Stage 2 -> Stage 3)
  const handleStartTripNow = (trip) => {
    const updatedTrip = {
      ...trip,
      manifestStatus: 'On Trip',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTrips(prev => prev.map(t => (t.id === trip.id ? updatedTrip : t)));
    saveTripToGoogleSheet(updatedTrip);
    showToast(`Trip #${trip.id} started & moved to 3. On Trip!`);
  };

  const handleSendDriverDutySlip = (trip) => {
    if (!trip) return;
    if (!trip.driverPhone || String(trip.driverPhone).includes('ERROR')) {
      showToast('⚠️ Chauffeur phone is missing or invalid. Please edit trip to assign a chauffeur phone.', 'error');
      setEditingTrip(trip);
      return;
    }
    const math = computeSettlementMath(trip, trip.commissionPct ?? 10);
    const text = buildEnhancedDriverDutySlipWA(trip, math);
    window.open(buildWhatsAppUrl(trip.driverPhone, text), '_blank');
  };

  const handleSendCustomerConfirmation = (trip) => {
    if (!trip) return;
    if (!trip.phone || String(trip.phone).includes('ERROR')) {
      showToast('⚠️ Customer phone number has an error (#ERROR!). Please edit the trip to enter a valid phone number.', 'error');
      setEditingTrip(trip);
      return;
    }
    const text = buildCustomerConfirmationWA(trip);
    window.open(buildWhatsAppUrl(trip.phone, text), '_blank');
  };

  // ==========================================
  // STAGE 3 -> STAGE 4: END TRIP & COLLECT PAYMENT MODAL
  // ==========================================
  const [completingTrip, setCompletingTrip] = useState(null);
  const [hideClosedTrips, setHideClosedTrips] = useState(false);

  const handleOpenCompleteModal = (trip) => {
    const baseBal = Math.max(0, (Number(trip.agreedRate) || 0) - (Number(trip.advance) || 0));
    setCompletingTrip({
      ...trip,
      extraCharges: Number(trip.extraCharges) || 0,
      extraChargesNote: trip.extraChargesNote || '',
      paymentCollector: trip.paymentCollector || 'Driver',
      commissionSettled: Boolean(trip.commissionSettled),
      baseBalance: baseBal
    });
  };

  const handleSubmitCompleteTrip = (e) => {
    if (e) e.preventDefault();
    if (!completingTrip) return;
    const extras = Number(completingTrip.extraCharges) || 0;
    const baseBal = Math.max(0, (Number(completingTrip.agreedRate) || 0) - (Number(completingTrip.advance) || 0));
    const totalCollectedAtEnd = baseBal + extras;
    const collector = completingTrip.paymentCollector || 'Driver';
    const commPct = completingTrip.commissionPct !== undefined ? Number(completingTrip.commissionPct) : 10;
    const math = computeSettlementMath(completingTrip, commPct, {
      extraCharges: extras,
      paymentCollector: collector
    });
    const nowIso = new Date().toISOString();

    const updatedTrip = {
      ...completingTrip,
      manifestStatus: 'Completed',
      extraCharges: extras,
      extraChargesNote: String(completingTrip.extraChargesNote || '').trim(),
      finalCollected: totalCollectedAtEnd,
      paymentCollector: collector,
      commissionPct: math.pct,
      commissionAmount: math.commissionAmt,
      driverNetShare: math.driverNetShare,
      settlementDirection: math.settlementDirection,
      settlementAmount: math.settlementAmount,
      commissionSettled: Boolean(completingTrip.commissionSettled),
      commissionSettledAt: completingTrip.commissionSettled ? (completingTrip.commissionSettledAt || nowIso) : '',
      balance: 0,
      completedAt: nowIso,
      updatedAt: nowIso
    };
    delete updatedTrip.baseBalance;

    setTrips(prev => prev.map(t => (t.id === updatedTrip.id ? updatedTrip : t)));
    saveTripToGoogleSheet(updatedTrip);
    setCompletingTrip(null);
    showToast(`Trip #${updatedTrip.id} completed (₹${totalCollectedAtEnd.toLocaleString('en-IN')} collected by ${updatedTrip.paymentCollector}) → Send Review Link!`);
  };

  const handleToggleCommissionSettled = (trip) => {
    const nextVal = !trip.commissionSettled;
    const updatedTrip = {
      ...trip,
      commissionSettled: nextVal,
      commissionSettledAt: nextVal ? new Date().toISOString() : '',
      updatedAt: new Date().toISOString()
    };
    setTrips(prev => prev.map(t => (t.id === trip.id ? updatedTrip : t)));
    saveTripToGoogleSheet(updatedTrip);
    showToast(nextVal ? `Commission settled for #${trip.id}!` : `Marked commission pending for #${trip.id}`);
  };

  const handleSendGoogleReviewRequest = (trip) => {
    const text = `Dear ${trip.customerName},
Thank you for travelling with Kalidass Travels.

We hope you had a peaceful and smooth journey with chauffeur ${trip.driverName || 'our driver'}.

Could you please take 30 seconds to share your experience on Google? Your review means the world to our family-run team:
${GOOGLE_REVIEW_URL}

We look forward to serving you and your family again.
Warm regards,
*Kalidass Travels, Chennai*`;

    window.open(buildWhatsAppUrl(trip.phone, text), '_blank');

    const updatedTrip = {
      ...trip,
      reviewSent: true,
      reviewSentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTrips(prev => prev.map(t => (t.id === trip.id ? updatedTrip : t)));
    saveTripToGoogleSheet(updatedTrip);
    showToast(`Review link opened on WhatsApp & marked Sent for #${trip.id}!`);
  };

  // ==========================================
  // AUTO-MOVE ENGINE: CONFIRMED -> ON TRIP AT IST PICKUP TIME
  // ==========================================
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dueTrips = trips.filter(t => shouldAutoMoveToOnTrip(t, nowTick));
    if (dueTrips.length === 0) return;

    const nowIso = new Date().toISOString();
    const dueIds = new Set(dueTrips.map(t => t.id));
    const promoted = [];

    setTrips(prev =>
      prev.map(t => {
        if (!dueIds.has(t.id)) return t;
        const nextTrip = {
          ...t,
          manifestStatus: 'On Trip',
          startedAt: t.startedAt || nowIso,
          updatedAt: nowIso
        };
        promoted.push(nextTrip);
        return nextTrip;
      })
    );

    dueTrips.forEach(t => {
      saveTripToGoogleSheet({
        ...t,
        manifestStatus: 'On Trip',
        startedAt: t.startedAt || nowIso,
        updatedAt: nowIso
      });
    });

    showToast(
      dueTrips.length === 1
        ? `Auto-moved #${dueTrips[0].id} (${dueTrips[0].customerName}) to 3. On Trip!`
        : `Auto-moved ${dueTrips.length} trips to 3. On Trip!`
    );
  }, [trips, nowTick]);

  const handleDeleteTrip = (id) => {
    if (window.confirm('Are you sure you want to delete this trip record?')) {
      const updatedList = trips.filter(t => t.id !== id);
      setTrips(updatedList);
      if (editingTrip?.id === id) setEditingTrip(null);
      deleteTripFromGoogleSheet(id);
      showToast('Trip record deleted.');
      return true;
    }
    return false;
  };

  // Filtered Trips for Dispatch Desk (Multi-Day Aware, IST)
  const filteredTrips = useMemo(() => {
    const todayIso = getTodayIsoIST(0);
    const tomorrowIso = getTodayIsoIST(1);

    return trips.filter(trip => {
      if (isAutoWebsiteLead(trip)) return false;
      if (dateFilter === 'today' && !isTripActiveOnDate(trip, todayIso)) return false;
      if (dateFilter === 'tomorrow' && !isTripActiveOnDate(trip, tomorrowIso)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (trip.customerName || '').toLowerCase().includes(q) ||
          (trip.guestName || '').toLowerCase().includes(q) ||
          (trip.phone || '').includes(q) ||
          (trip.guestPhone || '').includes(q) ||
          (trip.id || '').toLowerCase().includes(q) ||
          (trip.quoteRef || '').toLowerCase().includes(q) ||
          (trip.driverName || '').toLowerCase().includes(q) ||
          (trip.vehicleNumber || '').toLowerCase().includes(q) ||
          (trip.route || '').toLowerCase().includes(q) ||
          (trip.hotelName || '').toLowerCase().includes(q) ||
          (trip.notes || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [trips, searchQuery, dateFilter]);

  const quotationTrips = useMemo(() => filteredTrips.filter(t => normalizeManifestStatus(t.manifestStatus) === 'Quotation'), [filteredTrips]);
  const confirmedTrips = useMemo(() => filteredTrips.filter(t => normalizeManifestStatus(t.manifestStatus) === 'Confirmed'), [filteredTrips]);
  const activeTrips = useMemo(() => filteredTrips.filter(t => normalizeManifestStatus(t.manifestStatus) === 'On Trip'), [filteredTrips]);
  const settledTrips = useMemo(() => filteredTrips.filter(t => normalizeManifestStatus(t.manifestStatus) === 'Completed'), [filteredTrips]);
  const needsDriverCount = useMemo(() => confirmedTrips.filter(t => !String(t.driverName || '').trim()).length, [confirmedTrips]);
  const closedCompletedCount = useMemo(() => settledTrips.filter(t => t.commissionSettled && t.reviewSent).length, [settledTrips]);
  const visibleCompletedTrips = useMemo(
    () => (hideClosedTrips ? settledTrips.filter(t => !(t.commissionSettled && t.reviewSent)) : settledTrips),
    [settledTrips, hideClosedTrips]
  );

  // ==========================================
  // VIEW 4: DRIVERS FLEET ROSTER MANAGEMENT
  // ==========================================
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverCategory, setNewDriverCategory] = useState('Sedan');
  const [newDriverVehicle, setNewDriverVehicle] = useState('');
  const [newDriverPlate, setNewDriverPlate] = useState('');
  const [newDriverZone, setNewDriverZone] = useState('');
  const [newDriverArea, setNewDriverArea] = useState('');
  const [newDriverLanguages, setNewDriverLanguages] = useState(['Tamil']);
  const [newDriverBoard, setNewDriverBoard] = useState('Yellow Board');
  const [newDriverCarrier, setNewDriverCarrier] = useState('With Carrier');
  const [newDriverPartnerType, setNewDriverPartnerType] = useState('Owner-Driver');
  const [newDriverNotes, setNewDriverNotes] = useState('');
  const [showMoreDriverFields, setShowMoreDriverFields] = useState(false);

  // Edit Driver Modal State
  const [editingDriver, setEditingDriver] = useState(null);

  // Roster Filters
  const [rosterVehicleFilter, setRosterVehicleFilter] = useState('ALL');
  const [rosterZoneFilter, setRosterZoneFilter] = useState('ALL');
  const [rosterLanguageFilter, setRosterLanguageFilter] = useState('ALL');
  const [rosterBoardFilter, setRosterBoardFilter] = useState('ALL');
  const [rosterSearchQuery, setRosterSearchQuery] = useState('');

  const toggleLanguageInList = (list, lang) => {
    const arr = normalizeLanguages(list, []);
    if (arr.includes(lang)) {
      return arr.length > 1 ? arr.filter(l => l !== lang) : arr;
    }
    return [...arr, lang];
  };

  // Pending Applications from /attach-cab/
  const [pendingLeads, setPendingLeads] = useState([]);
  const [pendingFilterTab, setPendingFilterTab] = useState('verified'); // 'verified' | 'test'
  const [isPendingSectionOpen, setIsPendingSectionOpen] = useState(true);
  const [dismissedLeadIds, setDismissedLeadIds] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return JSON.parse(localStorage.getItem('kt_dismissed_leads_v1') || '[]');
      } catch (_) {
        return [];
      }
    }
    return [];
  });
  const [waPasteModalOpen, setWaPasteModalOpen] = useState(false);
  const [waPasteText, setWaPasteText] = useState('');

  const parseLeadTimestamp = (ts) => {
    if (!ts) return 0;
    const iso = Date.parse(ts);
    if (!isNaN(iso)) return iso;
    const m = String(ts).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      const year = parseInt(m[3], 10);
      const timeMatch = String(ts).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
      let hours = 12;
      let mins = 0;
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        mins = parseInt(timeMatch[2], 10);
        const ampm = (timeMatch[4] || '').toLowerCase();
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
      }
      return new Date(year, month, day, hours, mins).getTime();
    }
    return 0;
  };

  const fetchPendingDriverLeads = async () => {
    try {
      let leads = [];
      try {
        const res = await fetch('/api/record-driver-lead');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.leads) && data.leads.length > 0) {
            leads = data.leads;
          }
        }
      } catch (_) {}

      // Robust fallback: If /api/record-driver-lead returned empty or failed, fetch directly from DRIVER_LEADS_WEBHOOK_URL
      if (leads.length === 0 && DRIVER_LEADS_WEBHOOK_URL) {
        try {
          const gRes = await fetch(DRIVER_LEADS_WEBHOOK_URL, { redirect: 'follow' });
          if (gRes.ok) {
            const gData = await gRes.json();
            if (gData && Array.isArray(gData.leads)) {
              leads = gData.leads;
            }
          }
        } catch (_) {}
      }

      if (leads.length > 0) {
        // Read persisted dismissed IDs
        let currentDismissed = [];
        try {
          currentDismissed = JSON.parse(localStorage.getItem('kt_dismissed_leads_v1') || '[]');
        } catch (_) {}

        // 1. Separate verified genuine leads vs test / incomplete drafts
        const verifiedGroups = new Map();
        const testEntries = [];

        leads.forEach((l) => {
          const cleanPhone = String(l.phone || '').replace(/\D/g, '').slice(-10);
          const rawId = String(l.leadId || l.id || '');
          if (currentDismissed.includes(rawId) || l.status === 'Approved' || l.status === 'Dismissed') {
            return;
          }

          const isTest =
            !cleanPhone ||
            cleanPhone.length !== 10 ||
            cleanPhone === '9999999999' ||
            cleanPhone.startsWith('00000') ||
            (/test|verify|applicant|visitor/i.test(l.name) && cleanPhone.length !== 10) ||
            rawId.includes('TEST') ||
            String(l.notes || '').includes('Testing automated');

          let vehicles = Array.isArray(l.vehicles) ? l.vehicles : [];
          if (vehicles.length === 0 && (l.category === 'Attach Car' || (l.details && l.details.includes('Car')))) {
            const modelMatch = (l.details || l.notes || '').match(/\(([^)]+)\)/);
            const rawModel = modelMatch ? modelMatch[1].trim() : '';
            const model = rawModel && rawModel !== '()' ? rawModel : (l.cars || 'Maruti Ertiga');
            const plateMatch = (l.details || l.notes || '').match(/Plate:\s*([^|•\n]+)/i);
            const plate = l.plate || (plateMatch ? plateMatch[1].trim() : '');
            vehicles = [{
              model: model || 'Maruti Ertiga',
              plate: plate || 'Plate TBD',
              boardType: (l.plateType || l.details || '').includes('White') ? 'White Board' : 'Yellow Board',
              carrier: (l.notes || '').includes('No Carrier') ? 'No Carrier' : 'With Carrier'
            }];
          }

          const parsedTime = parseLeadTimestamp(l.timestamp || l.date);
          const directDrive = l.driveFolderUrl || (l.folderUrl && String(l.folderUrl).startsWith('http') ? l.folderUrl : '');
          const driveSearch = `https://drive.google.com/drive/search?q=${encodeURIComponent(cleanPhone || l.name || '')}`;
          const masterDrive = 'https://drive.google.com/drive/search?q=' + encodeURIComponent('Kalidass Driver & Cab Attachments');

          const normalizedItem = {
            ...l,
            leadId: rawId || `KT-DRV-${Date.now()}`,
            name: l.name || l.applicantName || 'Partner Driver',
            phone: cleanPhone,
            area: l.area || l.city || 'Medavakkam',
            zone: l.zone || inferZoneFromAddress(l.city || l.area || '') || 'South & OMR',
            category: l.category || 'Attach Car',
            partnerType: l.partnerType || (vehicles.length > 1 ? 'Fleet Partner' : l.category === 'Attach Car' ? 'Owner-Driver' : 'Acting Driver'),
            vehicles,
            parsedTime,
            displayDate: l.timestamp || l.date || 'Recent',
            driveFolderUrl: directDrive,
            applicantDriveSearchUrl: driveSearch,
            masterDriveFolderUrl: masterDrive,
            isTest
          };

          if (isTest) {
            testEntries.push(normalizedItem);
          } else {
            if (!verifiedGroups.has(cleanPhone)) {
              verifiedGroups.set(cleanPhone, []);
            }
            verifiedGroups.get(cleanPhone).push(normalizedItem);
          }
        });

        // 2. Deduplicate verified leads (merge duplicates, prefer entry with vehicle details)
        const deduplicatedVerified = [];
        verifiedGroups.forEach((group, phone) => {
          group.sort((a, b) => {
            const aHasCar = a.details && a.details.includes('Car (') && !a.details.includes('Car ()');
            const bHasCar = b.details && b.details.includes('Car (') && !b.details.includes('Car ()');
            if (aHasCar && !bHasCar) return -1;
            if (!aHasCar && bHasCar) return 1;
            return b.parsedTime - a.parsedTime;
          });
          const best = group[0];
          const hasDirectDrive = group.find(g => g.driveFolderUrl)?.driveFolderUrl || best.driveFolderUrl;
          const mergedNotes = group.map(g => g.notes).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' | ');

          deduplicatedVerified.push({
            ...best,
            driveFolderUrl: hasDirectDrive,
            notes: mergedNotes || best.notes,
            submissionCount: group.length,
            allSubmissions: group
          });
        });

        // 3. Sort verified leads chronologically (earliest to latest) to assign strict continuous follow-up serial IDs (#KT-DRV-101, #KT-DRV-102...)
        deduplicatedVerified.sort((a, b) => a.parsedTime - b.parsedTime);
        const sequencedVerified = deduplicatedVerified.map((lead, idx) => ({
          ...lead,
          serialId: `#KT-DRV-${101 + idx}`,
          serialSeq: 101 + idx
        }));

        // Deduplicate identical test entries
        const uniqueTestEntries = [];
        const seenTestKeys = new Set();
        testEntries.forEach((t) => {
          const key = `${t.name}_${t.city}_${t.area}`;
          if (!seenTestKeys.has(key)) {
            seenTestKeys.add(key);
            uniqueTestEntries.push({
              ...t,
              serialId: t.leadId.startsWith('#') ? t.leadId : `#${t.leadId}`,
              submissionCount: 1
            });
          }
        });

        setPendingLeads([...sequencedVerified, ...uniqueTestEntries]);
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

    setDrivers(prev => [...newCards.map(c => ({ ...c, languages: normalizeLanguages(c.languages, ['Tamil']), createdAt: new Date().toISOString() })), ...prev]);
    newCards.forEach(c => saveDriverToGoogleSheet({ ...c, languages: normalizeLanguages(c.languages, ['Tamil']), createdAt: new Date().toISOString() }));

    try {
      await fetch('/api/record-driver-lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.leadId, status: 'Approved' })
      });
    } catch (_) {}

    // Persist to dismissed in localStorage so it stays removed from queue
    setDismissedLeadIds(prev => {
      const next = Array.from(new Set([...prev, lead.leadId, lead.serialId]));
      try { localStorage.setItem('kt_dismissed_leads_v1', JSON.stringify(next)); } catch (_) {}
      return next;
    });

    setPendingLeads(prev => prev.filter(item => item.leadId !== lead.leadId && item.serialId !== lead.serialId));
    showToast(`Approved ${lead.name} (${lead.serialId})! Added ${newCards.length} vehicle card(s) to Active Roster.`);
  };

  const handleDismissLead = async (leadOrId) => {
    const leadId = typeof leadOrId === 'string' ? leadOrId : (leadOrId?.leadId || leadOrId?.serialId);
    try {
      await fetch('/api/record-driver-lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status: 'Dismissed' })
      });
    } catch (_) {}

    setDismissedLeadIds(prev => {
      const next = Array.from(new Set([...prev, leadId]));
      try { localStorage.setItem('kt_dismissed_leads_v1', JSON.stringify(next)); } catch (_) {}
      return next;
    });

    setPendingLeads(prev => prev.filter(item => item.leadId !== leadId && item.serialId !== leadId));
    showToast('Application dismissed.');
  };

  const handleDismissAllTestLeads = () => {
    const testIds = pendingLeads.filter(l => l.isTest).map(l => l.leadId);
    setDismissedLeadIds(prev => {
      const next = Array.from(new Set([...prev, ...testIds]));
      try { localStorage.setItem('kt_dismissed_leads_v1', JSON.stringify(next)); } catch (_) {}
      return next;
    });
    setPendingLeads(prev => prev.filter(l => !l.isTest));
    setPendingFilterTab('verified');
    showToast(`Cleaned and dismissed ${testIds.length} test / draft submission(s)!`);
  };

  const handleRepairAndCleanSheet = async () => {
    try {
      showToast('Repairing Google Sheet & purging dummy leads...');
      if (DRIVER_LEADS_WEBHOOK_URL) {
        await fetch(DRIVER_LEADS_WEBHOOK_URL + '?action=clean', { redirect: 'follow' }).catch(() => {});
      }
      handleDismissAllTestLeads();
      await fetchPendingDriverLeads();
      showToast('Driver leads sheet cleaned and resequenced!');
    } catch (_) {
      showToast('Leads cleaned in local operations view.');
    }
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

    const createdWithLangs = created.map(c => ({ ...c, languages: ['Tamil'], createdAt: new Date().toISOString() }));
    setDrivers(prev => [...createdWithLangs, ...prev]);
    createdWithLangs.forEach(c => saveDriverToGoogleSheet(c));
    setWaPasteText('');
    setWaPasteModalOpen(false);
    showToast(`Imported ${createdWithLangs.length} card(s) for ${name} into Roster!`);
  };

  const handleAddDriver = (e) => {
    e.preventDefault();
    if (!newDriverName.trim() || !newDriverPhone.trim()) {
      showToast('Enter driver name and 10-digit phone number', 'error');
      return;
    }
    const isActing = newDriverPartnerType === 'Acting Driver';
    const rawVehicle = newDriverVehicle.trim();
    const resolvedVehicle = isActing ? 'Acting Driver (Chauffeur)' : (rawVehicle || 'Swift Dzire');
    const resolvedCategory = isActing ? 'Acting Driver' : (rawVehicle ? normalizeVehicleCategory(rawVehicle) : newDriverCategory);
    const resolvedArea = newDriverArea.trim() || 'Chennai';
    const resolvedZone = newDriverZone || inferZoneFromAddress(resolvedArea) || 'South & OMR';
    const formattedPlate = isActing
      ? 'ACTING-DRV'
      : (newDriverPlate.trim() ? formatIndianPlateNumber(newDriverPlate) : '');
    const resolvedLangs = normalizeLanguages(newDriverLanguages, ['Tamil']);

    const newEntry = {
      id: getNextDriverRosterId(drivers, 0),
      name: newDriverName.trim(),
      phone: newDriverPhone.replace(/\D/g, '').slice(-10),
      category: resolvedCategory,
      vehicle: resolvedVehicle,
      plate: formattedPlate,
      zone: resolvedZone,
      area: resolvedArea,
      languages: resolvedLangs,
      boardType: isActing ? 'Acting Driver' : newDriverBoard,
      carrier: isActing ? 'No Carrier' : newDriverCarrier,
      partnerType: newDriverPartnerType,
      notes: newDriverNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setDrivers([newEntry, ...drivers]);
    saveDriverToGoogleSheet(newEntry);

    // Reset quick-add fields
    setNewDriverName('');
    setNewDriverPhone('');
    setNewDriverVehicle('');
    setNewDriverPlate('');
    setNewDriverArea('');
    setNewDriverZone('');
    setNewDriverLanguages(['Tamil']);
    setNewDriverNotes('');
    setShowMoreDriverFields(false);
    showToast(`${newEntry.name} (${newEntry.vehicle}) added & synced!`);
  };

  const handleOpenEditDriver = (driver) => {
    setEditingDriver({
      ...driver,
      languages: normalizeLanguages(driver.languages, ['Tamil']),
      notes: driver.notes || ''
    });
  };

  const handleSaveEditedDriver = (e) => {
    e.preventDefault();
    if (!editingDriver || !editingDriver.name?.trim() || !editingDriver.phone?.trim()) {
      showToast('Driver name and phone are required', 'error');
      return;
    }
    const isActing = editingDriver.partnerType === 'Acting Driver';
    const rawVehicle = String(editingDriver.vehicle || '').trim();
    const resolvedVehicle = isActing ? 'Acting Driver (Chauffeur)' : (rawVehicle || 'Swift Dzire');
    const resolvedCategory = isActing ? 'Acting Driver' : normalizeVehicleCategory(resolvedVehicle);
    const resolvedArea = String(editingDriver.area || '').trim() || 'Chennai';
    const resolvedZone = editingDriver.zone || inferZoneFromAddress(resolvedArea) || 'South & OMR';
    const updatedDriver = {
      ...editingDriver,
      name: editingDriver.name.trim(),
      phone: String(editingDriver.phone).replace(/\D/g, '').slice(-10),
      category: resolvedCategory,
      vehicle: resolvedVehicle,
      plate: isActing ? 'ACTING-DRV' : (editingDriver.plate ? formatIndianPlateNumber(editingDriver.plate) : ''),
      area: resolvedArea,
      zone: resolvedZone,
      languages: normalizeLanguages(editingDriver.languages, ['Tamil']),
      notes: String(editingDriver.notes || '').trim(),
      updatedAt: new Date().toISOString()
    };
    setDrivers(prev => prev.map(d => (d.id === updatedDriver.id ? updatedDriver : d)));
    saveDriverToGoogleSheet(updatedDriver);
    setEditingDriver(null);
    showToast(`Updated ${updatedDriver.name} & synced to Google Sheet!`);
  };

  // Filtered Roster Drivers for VIEW 4
  const filteredRosterDrivers = useMemo(() => {
    return drivers.filter(d => {
      const cat = d.category || normalizeVehicleCategory(d.vehicle);
      if (rosterVehicleFilter !== 'ALL' && cat !== rosterVehicleFilter) return false;
      if (rosterZoneFilter !== 'ALL' && (d.zone || 'South & OMR') !== rosterZoneFilter) return false;
      if (rosterLanguageFilter !== 'ALL') {
        const langs = normalizeLanguages(d.languages, []);
        if (!langs.some(l => l.toLowerCase() === rosterLanguageFilter.toLowerCase())) return false;
      }
      if (rosterBoardFilter === 'Yellow Board' && (d.boardType || 'Yellow Board') !== 'Yellow Board') return false;
      if (rosterBoardFilter === 'White Board' && d.boardType !== 'White Board') return false;
      if (rosterBoardFilter === 'With Carrier' && d.carrier !== 'With Carrier') return false;

      if (rosterSearchQuery.trim()) {
        const q = rosterSearchQuery.toLowerCase();
        const langsStr = normalizeLanguages(d.languages, []).join(' ');
        const hay = `${d.name || ''} ${d.phone || ''} ${d.vehicle || ''} ${d.plate || ''} ${d.zone || ''} ${d.area || ''} ${d.partnerType || ''} ${langsStr} ${d.notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [drivers, rosterVehicleFilter, rosterZoneFilter, rosterLanguageFilter, rosterBoardFilter, rosterSearchQuery]);

  // Filtered Roster Drivers inside Assign Modal
  const filteredAssignDrivers = useMemo(() => {
    return drivers.filter(d => {
      const cat = d.category || normalizeVehicleCategory(d.vehicle);
      if (assignVehicleFilter !== 'ALL' && cat !== assignVehicleFilter) return false;
      if (assignZoneFilter !== 'ALL' && (d.zone || 'South & OMR') !== assignZoneFilter) return false;
      if (assignLanguageFilter !== 'ALL') {
        const langs = normalizeLanguages(d.languages, []);
        if (!langs.some(l => l.toLowerCase() === assignLanguageFilter.toLowerCase())) return false;
      }
      if (assignSearchQuery.trim()) {
        const q = assignSearchQuery.toLowerCase();
        const langsStr = normalizeLanguages(d.languages, []).join(' ');
        const hay = `${d.name || ''} ${d.phone || ''} ${d.vehicle || ''} ${d.plate || ''} ${d.zone || ''} ${d.area || ''} ${langsStr}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [drivers, assignVehicleFilter, assignZoneFilter, assignLanguageFilter, assignSearchQuery]);

  const handleDeleteDriver = (id) => {
    if (window.confirm('Remove driver/vehicle from roster?')) {
      setDrivers(drivers.filter(d => d.id !== id));
      deleteDriverFromGoogleSheet(id);
      showToast('Removed from roster & synced.');
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
      'Pickup Date', 'Return Date', 'Days', 'Pickup Time',
      'Agreed Rate', 'Advance', 'Extra Charges', 'Final Collected', 'Balance',
      'Payment Collector', 'Commission %', 'Commission Settled', 'Review Sent',
      'Driver Name', 'Driver Phone', 'Vehicle Plate', 'Status', 'Notes'
    ];
    const rows = trips.map(t => [
      t.id, t.customerName, t.phone, t.tripCategory, t.vehicle, t.route,
      t.pickupDate, t.returnDate || '', t.days || 1, t.pickupTime,
      t.agreedRate, t.advance, t.extraCharges || 0, t.finalCollected ?? '', t.balance,
      t.paymentCollector || 'Driver', t.commissionPct ?? 10, t.commissionSettled ? 'Yes' : 'No', t.reviewSent ? 'Yes' : 'No',
      t.driverName, t.driverPhone, t.vehicleNumber, t.manifestStatus, t.notes
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kalidass_Trips_Export_${getTodayIsoIST()}.csv`;
    a.click();
    showToast('CSV Export downloaded!');
  };

  // Owner PIN Authentication (supports 4-digit auto-unlock + 30-day device remember)
  const verifyPinCode = (code) => {
    if (String(code).trim() === '2015') {
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage?.setItem(PIN_KEY, 'true');
          if (rememberDevice) {
            const expiry = Date.now() + PIN_REMEMBER_DAYS * 24 * 60 * 60 * 1000;
            window.localStorage?.setItem(PIN_REMEMBER_UNTIL_KEY, String(expiry));
          } else {
            window.localStorage?.removeItem(PIN_REMEMBER_UNTIL_KEY);
          }
        } catch (_) {}
      }
      return true;
    }
    setPinError(true);
    setTimeout(() => {
      setPinInput('');
    }, 450);
    return false;
  };

  const handleUnlockPin = (e) => {
    e.preventDefault();
    verifyPinCode(pinInput);
  };

  const handlePinDigit = (digit) => {
    if (pinInput.length >= 4) return;
    const next = pinInput + String(digit);
    setPinError(false);
    setPinInput(next);
    if (next.length === 4) {
      verifyPinCode(next);
    }
  };

  const handlePinBackspace = () => {
    setPinError(false);
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleLockConsole = () => {
    setIsUnlocked(false);
    setPinInput('');
    setIsMobileMoreOpen(false);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage?.removeItem(PIN_KEY);
        window.localStorage?.removeItem(PIN_REMEMBER_UNTIL_KEY);
      } catch (_) {}
    }
  };

  // Allow desktop keyboard typing on PIN screen without opening mobile virtual keyboard
  useEffect(() => {
    if (isUnlocked) return;
    const onKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePinDigit(e.key);
      } else if (e.key === 'Backspace') {
        handlePinBackspace();
      } else if (e.key === 'Escape') {
        setPinInput('');
        setPinError(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isUnlocked, pinInput, rememberDevice]);

  // Navigation Items Config
  const NAV_ITEMS = [
    { id: 'dispatch', label: 'Live Dispatch Desk', icon: 'view_kanban', badge: quotationTrips.length + needsDriverCount },
    { id: 'copilot', label: '24/7 Mobile AI Co-Pilot', icon: 'smart_toy' },
    { id: 'quotes', label: 'Rate & Quote Generator', icon: 'calculate' },
    { id: 'new-booking', label: 'New Booking Entry', icon: 'add_circle' },
    { id: 'drivers', label: 'Drivers & Fleet Roster', icon: 'badge', badge: drivers.length },
    { id: 'settlements', label: 'Settlements & Reviews', icon: 'payments', badge: settledTrips.length - closedCompletedCount },
    { id: 'settings', label: 'Cloud Sheet & Settings', icon: 'settings' }
  ];

  // PIN PROTECTION SCREEN (Tactile 1-Handed Number Pad for Pixel / Mobile)
  if (!isUnlocked) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 flex items-center justify-center p-4 pb-safe">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-400">
            <Car className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-white mb-0.5">KT Ops Console</h2>
          <p className="text-xs text-slate-400 mb-5">Tap 4-digit Owner PIN to unlock</p>

          {/* 4-Dot Visual PIN Indicator */}
          <div className="flex items-center justify-center gap-3.5 mb-3">
            {[0, 1, 2, 3].map((idx) => {
              const filled = idx < pinInput.length;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    pinError
                      ? 'bg-rose-500 border-rose-400 scale-110'
                      : filled
                      ? 'bg-blue-500 border-blue-400 scale-110 shadow-md shadow-blue-500/40'
                      : 'bg-slate-800 border-slate-600'
                  }`}
                />
              );
            })}
          </div>
          <div className="h-5 mb-3">
            {pinError && <p className="text-rose-400 text-xs font-semibold">Incorrect PIN. Try again.</p>}
          </div>

          {/* Tactile 3x4 Number Pad (Auto-unlocks on 4th digit) */}
          <div className="grid grid-cols-3 gap-2.5 mb-5 select-none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePinDigit(num)}
                className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 active:bg-blue-600 text-white text-2xl font-bold font-mono transition border border-slate-700/70 shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPinInput('');
                setPinError(false);
              }}
              className="h-14 rounded-2xl bg-slate-800/50 hover:bg-slate-800 active:scale-95 text-slate-400 text-xs font-bold uppercase tracking-wider transition border border-slate-800"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handlePinDigit(0)}
              className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 active:bg-blue-600 text-white text-2xl font-bold font-mono transition border border-slate-700/70 shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handlePinBackspace}
              aria-label="Backspace"
              className="h-14 rounded-2xl bg-slate-800/50 hover:bg-slate-800 active:scale-95 text-slate-300 flex items-center justify-center transition border border-slate-800"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* 30-Day Remember Phone Toggle */}
          <label className="flex items-center justify-center gap-2.5 text-xs text-slate-300 cursor-pointer py-2 px-3 rounded-xl bg-slate-800/60 border border-slate-800">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span>Keep unlocked on this phone ({PIN_REMEMBER_DAYS} days)</span>
          </label>
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
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="lg:hidden w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-extrabold text-white text-xs shadow-sm shrink-0">
              KT
            </div>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                {NAV_ITEMS.find(n => n.id === activeNav)?.label || 'Operations Desk'}
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                Kalidass Travels Chennai Operational Command Center
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {googleSheetUrl && (
              <button
                onClick={() => fetchTripsFromGoogleSheet()}
                className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                title="Fetch latest trips from Google Sheet"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin text-blue-600' : ''}`} />
                <span className="hidden md:inline">Sync Live</span>
              </button>
            )}

            <button
              onClick={() => navigateTo('new-booking')}
              className="hidden lg:flex px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/30 items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Booking</span>
            </button>

            <button
              onClick={handleLockConsole}
              className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl sm:rounded-lg flex items-center justify-center transition"
              title="Lock Console"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MAIN BODY AREA (ONE FOCUSED VIEW AT A TIME) */}
        <main className={`p-3 sm:p-6 max-w-7xl w-full mx-auto flex-1 space-y-5 lg:pb-6 ${activeNav === 'quotes' ? 'pb-40' : 'pb-24'}`}>

          {/* ========================================================= */}
          {/* VIEW 0: 24/7 MOBILE AI CO-PILOT                           */}
          {/* ========================================================= */}
          {activeNav === 'copilot' && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl max-w-4xl mx-auto h-[calc(100dvh-10.5rem)] lg:h-[85vh] animate-fadeIn">
              <MobileDispatchCopilot onPushToDispatch={handlePushFromCopilot} />
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 1: LIVE DISPATCH DESK (4-STAGE PIPELINE)             */}
          {/* ========================================================= */}
          {activeNav === 'dispatch' && (
            <div className="space-y-4 sm:space-y-5 animate-fadeIn">
              {/* Metric Counters Banner (4 Stages — Tappable on Mobile to jump straight to stage) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setMobileStage('quotation')}
                  className={`text-left bg-white p-3 sm:p-3.5 rounded-2xl border shadow-xs transition ${
                    mobileStage === 'quotation' ? 'border-amber-500 ring-2 ring-amber-200 md:ring-0 md:border-amber-200' : 'border-amber-200'
                  }`}
                >
                  <div className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    1. Quotations
                  </div>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <div className="text-2xl font-extrabold text-amber-600 font-mono">{quotationTrips.length}</div>
                    <span className="text-[10px] font-semibold text-slate-500">Speak &amp; Adv</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStage('confirmed')}
                  className={`text-left bg-white p-3 sm:p-3.5 rounded-2xl border shadow-xs transition ${
                    mobileStage === 'confirmed' ? 'border-indigo-500 ring-2 ring-indigo-200 md:ring-0 md:border-indigo-200' : 'border-indigo-200'
                  }`}
                >
                  <div className="text-[11px] font-bold text-indigo-700 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    2. Confirmed
                  </div>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <div className="text-2xl font-extrabold text-indigo-600 font-mono">{confirmedTrips.length}</div>
                    <span className={`text-[10px] font-bold ${needsDriverCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {needsDriverCount > 0 ? `${needsDriverCount} Need Cab` : 'All Ready'}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStage('active')}
                  className={`text-left bg-white p-3 sm:p-3.5 rounded-2xl border shadow-xs transition ${
                    mobileStage === 'active' ? 'border-emerald-500 ring-2 ring-emerald-200 md:ring-0 md:border-emerald-200' : 'border-emerald-200'
                  }`}
                >
                  <div className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    3. On Trip
                  </div>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <div className="text-2xl font-extrabold text-emerald-600 font-mono">{activeTrips.length}</div>
                    <span className="text-[10px] font-semibold text-slate-500">Live Now</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStage('completed')}
                  className={`text-left bg-white p-3 sm:p-3.5 rounded-2xl border shadow-xs transition ${
                    mobileStage === 'completed' ? 'border-blue-500 ring-2 ring-blue-200 md:ring-0 md:border-blue-200' : 'border-blue-200'
                  }`}
                >
                  <div className="text-[11px] font-bold text-blue-700 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    4. Pay &amp; Review
                  </div>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <div className="text-2xl font-extrabold text-blue-600 font-mono">{settledTrips.length}</div>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {settledTrips.length - closedCompletedCount} Pending
                    </span>
                  </div>
                </button>
              </div>

              {/* Search & Date Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex-1 relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, phone, ID, driver, plate..."
                    className="w-full pl-9 pr-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 hidden sm:inline">Filter:</span>
                  {[
                    { id: 'all', label: 'All Dates' },
                    { id: 'today', label: 'Today' },
                    { id: 'tomorrow', label: 'Tomorrow' },
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDateFilter(d.id)}
                      className={`flex-1 sm:flex-none min-h-[40px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg text-xs font-semibold border transition ${
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

              {/* MOBILE STICKY STAGE TABS (< md) — Eliminates 4-column vertical scroll traps */}
              <div className="md:hidden sticky top-14 z-20 -mx-3 px-3 py-2 bg-slate-100/95 backdrop-blur-md border-b border-slate-200/80">
                <div className="grid grid-cols-4 gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
                  {[
                    { id: 'quotation', label: 'Quotes', count: quotationTrips.length, activeCls: 'bg-amber-500 text-slate-950 shadow-sm' },
                    { id: 'confirmed', label: 'Confirm', count: confirmedTrips.length, activeCls: 'bg-indigo-600 text-white shadow-sm' },
                    { id: 'active', label: 'Live', count: activeTrips.length, activeCls: 'bg-emerald-600 text-white shadow-sm' },
                    { id: 'completed', label: 'Pay', count: visibleCompletedTrips.length, activeCls: 'bg-blue-600 text-white shadow-sm' },
                  ].map((tab) => {
                    const active = mobileStage === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setMobileStage(tab.id)}
                        className={`min-h-[40px] px-1.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                          active ? tab.activeCls : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold leading-none ${
                          active ? 'bg-black/15 text-current' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4-Column Operations Pipeline (Single-stage on Mobile, 2/4-Column Grid on Tablet/Desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* STAGE 1: QUOTATION / ENQUIRY */}
                <div className={`${mobileStage === 'quotation' ? 'flex' : 'hidden md:flex'} bg-slate-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex-col md:min-h-[520px]`}>
                  <div className="flex items-center justify-between pb-3 border-b border-amber-200/70 mb-3 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                      <h3 className="font-bold text-xs text-slate-800 tracking-wide truncate">1. QUOTATION</h3>
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 rounded-full shrink-0">
                        {quotationTrips.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingPrefill({ _nonce: Date.now(), manifestStatus: 'Quotation' });
                        navigateTo('new-booking');
                      }}
                      className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg transition shrink-0"
                      title="Paste a new WhatsApp quotation"
                    >
                      + Paste Quote
                    </button>
                  </div>

                  <div className="space-y-3 flex-1 md:overflow-y-auto md:max-h-[720px] md:pr-1">
                    {quotationTrips.length === 0 ? (
                      <div className="h-44 border border-dashed border-amber-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5 text-center px-3">
                        <span className="material-symbols-outlined text-2xl text-amber-300">request_quote</span>
                        <span>Website &amp; WhatsApp enquiries appear here</span>
                      </div>
                    ) : (
                      quotationTrips.map(trip => {
                        const cleanNote = getCleanNotes(trip.notes);
                        return (
                          <div
                            key={trip.id}
                            className="bg-white border border-amber-100 hover:border-amber-300 rounded-xl p-3 shadow-xs space-y-2 transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-xs text-slate-900 truncate">{trip.customerName}</h4>
                                  <span className="text-[10px] font-mono font-bold text-slate-500">{trip.id}</span>
                                </div>
                                {trip.phone ? (
                                  <a
                                    href={`tel:${trip.phone}`}
                                    className="text-[11px] text-blue-600 hover:underline font-mono inline-flex items-center gap-0.5 mt-0.5"
                                  >
                                    <span className="material-symbols-outlined text-xs">call</span>
                                    <span>{formatPhoneForDisplay(trip.phone)}</span>
                                  </a>
                                ) : (
                                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                    Phone on WhatsApp
                                  </span>
                                )}
                              </div>
                              {Number(trip.agreedRate) > 0 && (
                                <span className="font-mono font-bold text-xs text-slate-900 shrink-0">
                                  ₹{Number(trip.agreedRate).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div className="font-semibold text-slate-800 truncate">
                                {trip.vehicle} • {trip.tripCategory}
                              </div>
                              <div className="flex items-center gap-1 text-slate-600">
                                <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
                                <span className="truncate">
                                  {trip.pickupDate ? formatShortDate(trip.pickupDate, true) : 'Date TBD'}
                                  {trip.pickupTime ? ` @ ${trip.pickupTime}` : ''}
                                </span>
                              </div>
                              <div className="flex items-start gap-1">
                                <span className="material-symbols-outlined text-xs text-slate-400 mt-0.5">location_on</span>
                                <span className="line-clamp-2">{trip.dropLocation || trip.route || trip.pickupLocation || 'Route TBD'}</span>
                              </div>
                              {cleanNote && (
                                <div className="text-[10px] text-amber-700 italic border-t border-slate-200/60 pt-1 line-clamp-2">
                                  {cleanNote}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 sm:gap-1.5 pt-1 sm:pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleOpenConfirmModal(trip)}
                                className="flex-1 min-h-[44px] sm:min-h-0 py-2.5 sm:py-2 px-3 sm:px-2 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-[11px] rounded-xl sm:rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                <CheckCircle2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                <span>Collect Adv &amp; Confirm</span>
                              </button>
                              {trip.phone && (
                                <button
                                  type="button"
                                  onClick={() => handleSendFollowUpWA(trip)}
                                  className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl sm:rounded-lg text-xs sm:text-[11px] font-bold flex items-center justify-center"
                                  title="Send WhatsApp Follow-up"
                                >
                                  WA
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEditTrip(trip)}
                                className="min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl sm:rounded-lg flex items-center justify-center"
                                title="Edit quotation"
                              >
                                <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTrip(trip.id)}
                                className="min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl sm:rounded-lg flex items-center justify-center"
                                title="Delete quotation"
                              >
                                <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* STAGE 2: CONFIRMED (ADVANCE PAID) */}
                <div className={`${mobileStage === 'confirmed' ? 'flex' : 'hidden md:flex'} bg-slate-50/80 border border-indigo-200/80 rounded-2xl p-3.5 flex-col md:min-h-[520px]`}>
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-200/70 mb-3 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
                      <h3 className="font-bold text-xs text-slate-800 tracking-wide truncate">2. CONFIRMED</h3>
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-100 text-indigo-800 rounded-full shrink-0">
                        {confirmedTrips.length}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-700 shrink-0">Advance Paid</span>
                  </div>

                  <div className="space-y-3 flex-1 md:overflow-y-auto md:max-h-[720px] md:pr-1">
                    {confirmedTrips.length === 0 ? (
                      <div className="h-44 border border-dashed border-indigo-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5 text-center px-3">
                        <span className="material-symbols-outlined text-2xl text-indigo-300">event_available</span>
                        <span>Confirmed upcoming bookings appear here</span>
                      </div>
                    ) : (
                      confirmedTrips.map(trip => {
                        const termsSummary = buildCompactTermsSummary(trip);
                        const cleanNote = getCleanNotes(trip.notes);
                        const isMultiDay = trip.returnDate && trip.returnDate !== trip.pickupDate;
                        const hasDriver = Boolean(String(trip.driverName || '').trim());
                        const overdueNoDriver = isOverdueWithoutDriver(trip, nowTick);
                        const math = computeSettlementMath(trip, trip.commissionPct ?? 10);
                        return (
                          <div
                            key={trip.id}
                            className={`bg-white rounded-xl p-3 shadow-xs space-y-2 transition border ${
                              overdueNoDriver
                                ? 'border-rose-400 ring-1 ring-rose-200'
                                : hasDriver
                                ? 'border-indigo-200 hover:border-indigo-400'
                                : 'border-amber-200 hover:border-amber-400'
                            }`}
                          >
                            {/* Driver Readiness Status Pill */}
                            <div className="flex items-center justify-between gap-1.5">
                              {overdueNoDriver ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold flex items-center gap-1 animate-pulse">
                                  <span className="material-symbols-outlined text-xs">warning</span>
                                  Needs Driver Urgently!
                                </span>
                              ) : hasDriver ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">check_circle</span>
                                  Driver Ready • Auto-starts at Pickup
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  Needs Driver Assignment
                                </span>
                              )}
                              <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">{trip.id}</span>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 truncate">{trip.customerName}</h4>
                                {formatPhoneForDisplay(trip.phone) ? (
                                  <a
                                    href={`tel:${trip.phone}`}
                                    className="text-[11px] text-blue-600 hover:underline font-mono inline-flex items-center gap-0.5"
                                  >
                                    <span className="material-symbols-outlined text-xs">call</span>
                                    <span>{formatPhoneForDisplay(trip.phone)}</span>
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setEditingTrip(trip)}
                                    className="text-[10px] text-amber-700 bg-amber-50 border border-amber-300 rounded px-1.5 py-0.5 font-bold inline-flex items-center gap-1"
                                    title="Click to fix phone number"
                                  >
                                    <span className="material-symbols-outlined text-xs text-amber-600">error</span>
                                    <span>Fix Phone</span>
                                  </button>
                                )}
                                {(trip.guestName || trip.guestPhone) && (
                                  <div className="text-[10px] text-indigo-700 font-medium mt-0.5 truncate">
                                    Guest: {trip.guestName || 'Alt'}{trip.guestPhone ? ` (${formatPhoneForDisplay(trip.guestPhone)})` : ''}
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-xs text-slate-900">
                                  Bal: ₹{Number(trip.balance).toLocaleString('en-IN')}
                                </span>
                                <div className="text-[10px] text-emerald-700 font-mono font-semibold">
                                  Adv: ₹{Number(trip.advance).toLocaleString('en-IN')} / ₹{Number(trip.agreedRate).toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div className="flex items-center justify-between gap-1 font-semibold text-slate-800">
                                <span className="truncate">{trip.vehicle} • {trip.tripCategory}</span>
                                {isMultiDay && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-extrabold shrink-0">
                                    {trip.days || computeTripDays(trip.pickupDate, trip.returnDate)}D
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
                                <span>
                                  {isMultiDay
                                    ? `${formatShortDate(trip.pickupDate)}${trip.pickupTime ? ` @ ${trip.pickupTime}` : ''} → ${formatShortDate(trip.returnDate)}`
                                    : `${formatShortDate(trip.pickupDate, true) || trip.pickupDate}${trip.pickupTime ? ` @ ${trip.pickupTime}` : ''}`}
                                </span>
                              </div>
                              <div className="flex items-start gap-1">
                                <span className="material-symbols-outlined text-xs text-slate-400 mt-0.5">location_on</span>
                                <div className="min-w-0 flex-1">
                                  <div className="line-clamp-2">
                                    <span className={!trip.pickupLocation || /^chennai$/i.test(trip.pickupLocation.trim()) ? 'text-amber-800 font-semibold' : ''}>
                                      {trip.pickupLocation || 'Chennai'}
                                    </span>
                                    {' → '}
                                    <span className="font-medium">{trip.dropLocation || trip.route}</span>
                                  </div>
                                  {(!trip.pickupLocation || /^chennai$/i.test(trip.pickupLocation.trim())) && (
                                    <div className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5 mt-0.5">
                                      <span>⚠️ Exact pickup address pending</span>
                                    </div>
                                  )}
                                  {/\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4}\b/i.test(trip.dropLocation || '') && (
                                    <div className="text-[10px] text-blue-700 font-bold flex items-center gap-0.5 mt-0.5">
                                      <span>📍 Plus Code Pin (Maps Linked)</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {hasDriver && (
                                <div className="pt-1 mt-1 border-t border-slate-200/70 space-y-0.5">
                                  <div className="flex items-center justify-between text-slate-800 font-semibold">
                                    <span className="truncate">Chauffeur: {trip.driverName}</span>
                                    <span className="font-mono text-[10px] text-emerald-700 shrink-0">{trip.vehicleNumber || 'Cab'}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                                    <span>Comm ({math.pct}%): ₹{math.commissionAmt.toLocaleString('en-IN')}</span>
                                    <a href={`tel:${trip.driverPhone}`} className="text-blue-600 font-mono hover:underline">
                                      {trip.driverPhone}
                                    </a>
                                  </div>
                                </div>
                              )}
                              {termsSummary && (
                                <div className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200/80 rounded px-1.5 py-0.5">
                                  {termsSummary}
                                </div>
                              )}
                              {cleanNote && (
                                <div className="text-[10px] text-amber-700 italic border-t border-slate-200/60 pt-1 line-clamp-2">
                                  Note: {cleanNote}
                                </div>
                              )}
                            </div>

                            {hasDriver ? (
                              <div className="space-y-2 sm:space-y-1.5 pt-1 sm:pt-0.5">
                                <div className="grid grid-cols-2 gap-2 sm:gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSendDriverDutySlip(trip)}
                                    className="min-h-[42px] sm:min-h-0 py-2 sm:py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] text-emerald-800 border border-emerald-300 rounded-xl sm:rounded-lg text-xs sm:text-[10px] font-bold flex items-center justify-center gap-1.5 transition"
                                  >
                                    <Send className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                    <span>Duty Slip</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSendCustomerConfirmation(trip)}
                                    className="min-h-[42px] sm:min-h-0 py-2 sm:py-1.5 px-2 bg-blue-50 hover:bg-blue-100 active:scale-[0.98] text-blue-800 border border-blue-300 rounded-xl sm:rounded-lg text-xs sm:text-[10px] font-bold flex items-center justify-center gap-1.5 transition"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                    <span>Guest Info</span>
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartTripNow(trip)}
                                    className="flex-1 min-h-[44px] sm:min-h-0 py-2.5 sm:py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-xs sm:text-[11px] rounded-xl sm:rounded-lg transition flex items-center justify-center gap-1 shadow-xs"
                                    title="Manually move to On Trip right now"
                                  >
                                    <ArrowUpRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                    <span>Start Trip</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAssignModal(trip)}
                                    className="min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl sm:rounded-lg flex items-center justify-center transition"
                                    title="Change driver"
                                  >
                                    <ArrowLeftRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditTrip(trip)}
                                    className="min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl sm:rounded-lg flex items-center justify-center transition"
                                    title="Edit booking"
                                  >
                                    <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTrip(trip.id)}
                                    className="min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl sm:rounded-lg flex items-center justify-center transition"
                                    title="Delete booking"
                                  >
                                    <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 sm:gap-1.5 pt-1 sm:pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignModal(trip)}
                                  className={`flex-1 min-h-[44px] sm:min-h-0 py-2.5 sm:py-2 font-bold text-xs sm:text-[11px] rounded-xl sm:rounded-lg active:scale-[0.98] transition flex items-center justify-center gap-1.5 shadow-xs ${
                                    overdueNoDriver
                                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                  }`}
                                >
                                  <Users className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                  <span>Assign Driver &amp; Cab</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTrip(trip)}
                                  className="min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl sm:rounded-lg flex items-center justify-center transition"
                                  title="Edit booking"
                                >
                                  <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTrip(trip.id)}
                                  className="min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl sm:rounded-lg flex items-center justify-center transition"
                                  title="Delete booking"
                                >
                                  <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* STAGE 3: ON TRIP (LIVE — AUTO AT PICKUP TIME) */}
                <div className={`${mobileStage === 'active' ? 'flex' : 'hidden md:flex'} bg-slate-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex-col md:min-h-[520px]`}>
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-200/70 mb-3 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                      <h3 className="font-bold text-xs text-slate-800 tracking-wide truncate">3. ON TRIP</h3>
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-full shrink-0">
                        {activeTrips.length}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 shrink-0">On Road</span>
                  </div>

                  <div className="space-y-3 flex-1 md:overflow-y-auto md:max-h-[720px] md:pr-1">
                    {activeTrips.length === 0 ? (
                      <div className="h-44 border border-dashed border-emerald-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5 text-center px-3">
                        <span className="material-symbols-outlined text-2xl text-emerald-300">no_crash</span>
                        <span>Assigned trips auto-move here at pickup time</span>
                      </div>
                    ) : (
                      activeTrips.map(trip => {
                        const math = computeSettlementMath(trip, trip.commissionPct ?? 10);
                        return (
                          <div
                            key={trip.id}
                            className="bg-white border border-emerald-200 hover:border-emerald-400 rounded-xl p-3 shadow-xs space-y-2 transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 truncate">{trip.customerName}</h4>
                                <div className="text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-xs">local_taxi</span>
                                  <span className="truncate">{trip.vehicleNumber || 'Cab Assigned'}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-xs text-slate-900">
                                  Bal: ₹{Number(trip.balance).toLocaleString('en-IN')}
                                </span>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Total: ₹{Number(trip.agreedRate).toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>

                            <div className="text-[11px] bg-slate-50 p-2 rounded-lg space-y-1 border border-slate-100">
                              <div className="flex items-center justify-between font-medium text-slate-800 gap-1">
                                <span className="truncate">Chauffeur: {trip.driverName || 'Assigned'}</span>
                                <a href={`tel:${trip.driverPhone}`} className="text-blue-600 font-mono hover:underline shrink-0">
                                  {trip.driverPhone}
                                </a>
                              </div>
                              <div className="text-slate-600 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
                                <span className="truncate">
                                  {trip.returnDate && trip.returnDate !== trip.pickupDate
                                    ? `${formatShortDate(trip.pickupDate)}${trip.pickupTime ? ` @ ${trip.pickupTime}` : ''} → ${formatShortDate(trip.returnDate)} (${trip.days || computeTripDays(trip.pickupDate, trip.returnDate)}D)`
                                    : `${formatShortDate(trip.pickupDate, true) || trip.pickupDate}${trip.pickupTime ? ` @ ${trip.pickupTime}` : ''}`}
                                </span>
                              </div>
                              <div className="text-slate-600 flex items-start gap-1">
                                <span className="material-symbols-outlined text-xs text-slate-400 mt-0.5">location_on</span>
                                <div className="min-w-0 flex-1">
                                  <div className="line-clamp-2">
                                    <span className={!trip.pickupLocation || /^chennai$/i.test(trip.pickupLocation.trim()) ? 'text-amber-800 font-semibold' : ''}>
                                      {trip.pickupLocation || 'Chennai'}
                                    </span>
                                    {' → '}
                                    <span className="font-medium">{trip.dropLocation || trip.route}</span>
                                  </div>
                                  {(!trip.pickupLocation || /^chennai$/i.test(trip.pickupLocation.trim())) && (
                                    <div className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5 mt-0.5">
                                      <span>⚠️ Exact pickup address pending</span>
                                    </div>
                                  )}
                                  {/\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4}\b/i.test(trip.dropLocation || '') && (
                                    <div className="text-[10px] text-blue-700 font-bold flex items-center gap-0.5 mt-0.5">
                                      <span>📍 Plus Code Pin (Maps Linked)</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="pt-1 mt-1 border-t border-slate-200/70 flex items-center justify-between text-[10px] gap-1">
                                <span className="text-slate-500 font-medium">
                                  Comm ({math.pct}%): <strong className="text-slate-800">₹{math.commissionAmt.toLocaleString('en-IN')}</strong>
                                </span>
                                <span className={`px-1.5 py-0.5 rounded font-bold font-mono shrink-0 ${
                                  math.settlementDirection === 'DRIVER_PAYS_OFFICE'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-purple-100 text-purple-900'
                                }`}>
                                  {math.settlementDirection === 'DRIVER_PAYS_OFFICE'
                                    ? `Drv→Off ₹${math.settlementAmount.toLocaleString('en-IN')}`
                                    : `Off→Drv ₹${math.settlementAmount.toLocaleString('en-IN')}`}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSendDriverDutySlip(trip)}
                                className="min-h-[42px] sm:min-h-0 py-2 sm:py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] text-emerald-800 border border-emerald-300 rounded-xl sm:rounded-lg text-xs sm:text-[10px] font-bold flex items-center justify-center gap-1.5 transition"
                              >
                                <Send className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                <span>Duty Slip</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendCustomerConfirmation(trip)}
                                className="min-h-[42px] sm:min-h-0 py-2 sm:py-1.5 px-2 bg-blue-50 hover:bg-blue-100 active:scale-[0.98] text-blue-800 border border-blue-300 rounded-xl sm:rounded-lg text-xs sm:text-[10px] font-bold flex items-center justify-center gap-1.5 transition"
                              >
                                <MessageCircle className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                <span>Guest Info</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-1.5 pt-1 sm:pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleOpenCompleteModal(trip)}
                                className="flex-1 min-h-[44px] sm:min-h-0 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs sm:text-[11px] rounded-xl sm:rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                <IndianRupee className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                <span>End Trip &amp; Collect Payment</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(trip)}
                                className="min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl sm:rounded-lg flex items-center justify-center transition"
                                title="Change driver"
                              >
                                <ArrowLeftRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditTrip(trip)}
                                className="min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl sm:rounded-lg flex items-center justify-center transition"
                                title="Edit booking"
                              >
                                <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTrip(trip.id)}
                                className="min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl sm:rounded-lg flex items-center justify-center transition"
                                title="Delete booking"
                              >
                                <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* STAGE 4: PAYMENT & REVIEW */}
                <div className={`${mobileStage === 'completed' ? 'flex' : 'hidden md:flex'} bg-slate-50/80 border border-blue-200/80 rounded-2xl p-3.5 flex-col md:min-h-[520px]`}>
                  <div className="flex items-center justify-between pb-3 border-b border-blue-200/70 mb-3 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                      <h3 className="font-bold text-xs text-slate-800 tracking-wide truncate">4. PAYMENT &amp; REVIEW</h3>
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-800 rounded-full shrink-0">
                        {visibleCompletedTrips.length}
                      </span>
                    </div>
                    {closedCompletedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setHideClosedTrips(v => !v)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition shrink-0 ${
                          hideClosedTrips
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Toggle fully closed trips (Commission Settled + Review Sent)"
                      >
                        {hideClosedTrips ? `Show Closed (${closedCompletedCount})` : `Hide Closed (${closedCompletedCount})`}
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 flex-1 md:overflow-y-auto md:max-h-[720px] md:pr-1">
                    {visibleCompletedTrips.length === 0 ? (
                      <div className="h-44 border border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5 text-center px-3">
                        <span className="material-symbols-outlined text-2xl text-blue-300">verified</span>
                        <span>
                          {hideClosedTrips && closedCompletedCount > 0
                            ? `All ${closedCompletedCount} completed trips are fully closed!`
                            : 'Completed trips awaiting commission & review appear here'}
                        </span>
                      </div>
                    ) : (
                      visibleCompletedTrips.map(trip => {
                        const math = computeSettlementMath(trip, trip.commissionPct ?? 10);
                        const totalPaid = (Number(trip.agreedRate) || 0) + (Number(trip.extraCharges) || 0);
                        const isFullyClosed = Boolean(trip.commissionSettled && trip.reviewSent);
                        return (
                          <div
                            key={trip.id}
                            className={`bg-white rounded-xl p-3 shadow-xs space-y-2 border transition ${
                              isFullyClosed ? 'border-emerald-200 bg-emerald-50/20' : 'border-blue-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 truncate">{trip.customerName}</h4>
                                <span className="text-[10px] text-slate-500 font-mono">{trip.id} • {trip.vehicle}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded font-mono">
                                  Paid ₹{totalPaid.toLocaleString('en-IN')}
                                </span>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  By {trip.paymentCollector || 'Driver'}
                                </div>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg space-y-1 border border-slate-100">
                              <div className="truncate font-medium text-slate-800">
                                {trip.driverName || 'Chauffeur'} ({trip.vehicleNumber || 'Cab'})
                              </div>
                              <div className="line-clamp-1 text-slate-500">{trip.route}</div>
                              {Number(trip.extraCharges) > 0 && (
                                <div className="text-[10px] text-amber-800 font-semibold">
                                  Extras: +₹{Number(trip.extraCharges).toLocaleString('en-IN')}
                                  {trip.extraChargesNote ? ` (${trip.extraChargesNote})` : ''}
                                </div>
                              )}
                              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60">
                                <span className="text-slate-500">
                                  {math.settlementDirection === 'DRIVER_PAYS_OFFICE'
                                    ? `Drv→Off: ₹${math.settlementAmount.toLocaleString('en-IN')}`
                                    : `Off→Drv: ₹${math.settlementAmount.toLocaleString('en-IN')}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCommissionSettled(trip)}
                                  className={`px-2 py-0.5 rounded font-bold transition ${
                                    trip.commissionSettled
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                  }`}
                                >
                                  {trip.commissionSettled ? 'Comm. Settled ✓' : 'Mark Comm. Settled'}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-1.5 pt-1 sm:pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleSendGoogleReviewRequest(trip)}
                                className={`flex-1 min-h-[44px] sm:min-h-0 py-2.5 sm:py-2 font-bold text-xs sm:text-[11px] rounded-xl sm:rounded-lg active:scale-[0.98] transition flex items-center justify-center gap-1.5 shadow-xs ${
                                  trip.reviewSent
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                <span>{trip.reviewSent ? 'Review Sent ✓ (Resend)' : 'Send Review Link'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditTrip(trip)}
                                className="min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl sm:rounded-lg flex items-center justify-center transition"
                                title="Edit completed trip"
                              >
                                <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteTrip(trip.id)}
                                className="min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl sm:rounded-lg flex items-center justify-center transition"
                                title="Delete / Archive"
                              >
                                <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
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
                        placeholder="Enter route or destinations (e.g. Chennai to Pondicherry & Return)"
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
                        placeholder="e.g. 06:00 AM Pickup – 10:00 PM Return"
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

                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Customer Details (Optional)</span>
                      <ContactPickerControl
                        contacts={savedContacts}
                        onImportedContactsChange={setImportedContacts}
                        showToast={showToast}
                        defaultFilter="Customer"
                        buttonLabel="Phonebook"
                        compact
                        onSelect={({ name, phone: pickedPhone }) => {
                          if (name) setCalcCustName(name);
                          if (pickedPhone) setCalcCustPhone(pickedPhone);
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name (Optional)</label>
                        <input
                          type="text"
                          value={calcCustName}
                          onChange={(e) => setCalcCustName(e.target.value)}
                          placeholder="Customer Name"
                          className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Customer WhatsApp (Optional)</label>
                        <input
                          type="tel"
                          value={calcCustPhone}
                          onChange={(e) => setCalcCustPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800"
                        />
                      </div>
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
                            onClick={() => handleCopyQuote(calcOption1Text, 'Option 1 Micro-Receipt', true)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-white border border-slate-700 cursor-pointer"
                          >
                            📋 Copy Opt 1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppQuote(calcOption1Text, true)}
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
          {/* VIEW 3: NEW BOOKING ENTRY FORM (TYPE-ADAPTIVE + WA PASTE) */}
          {/* ========================================================= */}
          {activeNav === 'new-booking' && (
            <DirectBookingIntakeForm
              tariffConfig={tariffConfig}
              prefill={bookingPrefill}
              savedContacts={savedContacts}
              onImportedContactsChange={setImportedContacts}
              onSaveBooking={handleSaveNewBooking}
              onCancel={() => navigateTo('dispatch')}
              showToast={showToast}
            />
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
              {pendingLeads.length > 0 && (() => {
                const verifiedList = pendingLeads.filter(l => !l.isTest);
                const testList = pendingLeads.filter(l => l.isTest);
                const activeTab = pendingFilterTab === 'test' && testList.length > 0 ? 'test' : 'verified';
                const displayedLeads = activeTab === 'test' ? testList : verifiedList;

                if (!isPendingSectionOpen) {
                  return (
                    <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 px-4 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                        <span className="text-xs font-bold text-amber-950">
                          {verifiedList.length} Partner Driver Application(s) Pending Review
                        </span>
                        <span className="text-[11px] text-amber-800 hidden sm:inline">
                          ({verifiedList.map(v => v.name).join(', ')})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPendingSectionOpen(true)}
                          className="px-3 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-2xs"
                        >
                          <span>Review {verifiedList.length} Drivers</span>
                          <span className="material-symbols-outlined text-xs">expand_more</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 space-y-4 shadow-xs">
                    {/* Header with Verified vs Test Toggles & Clean Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/70 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                        <h4 className="text-sm font-bold text-amber-950">
                          Pending Partner Applications ({displayedLeads.length})
                        </h4>

                        <div className="inline-flex items-center gap-1 bg-amber-200/50 p-1 rounded-xl border border-amber-300/60 ml-1">
                          <button
                            type="button"
                            onClick={() => setPendingFilterTab('verified')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'verified' ? 'bg-white text-amber-950 shadow-xs' : 'text-amber-800 hover:text-amber-950'}`}
                          >
                            <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
                            <span>Verified Applications ({verifiedList.length})</span>
                          </button>
                          {testList.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setPendingFilterTab('test')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'test' ? 'bg-white text-amber-950 shadow-xs' : 'text-amber-800 hover:text-amber-950'}`}
                            >
                              <span className="material-symbols-outlined text-xs text-slate-400">help</span>
                              <span>Test / Incomplete ({testList.length})</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRepairAndCleanSheet}
                          className="px-2.5 py-1 bg-amber-200/70 hover:bg-amber-300 text-amber-950 border border-amber-300 text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-2xs"
                          title="Purge dummy/test rows and renumber sequentially"
                        >
                          <span className="material-symbols-outlined text-xs">cleaning_services</span>
                          <span>Purge Test Leads</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPendingSectionOpen(false)}
                          className="p-1 text-amber-800 hover:text-amber-950 hover:bg-amber-200/60 rounded-lg transition"
                          title="Collapse pending applications panel"
                        >
                          <span className="material-symbols-outlined text-sm">expand_less</span>
                        </button>
                      </div>
                    </div>

                    {displayedLeads.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-xl border border-amber-200 text-amber-900 text-xs">
                        No pending applications in this tab.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {displayedLeads.map((lead) => {
                          const waFollowupText = `Hello ${lead.name}, Kalidass Travels Chennai Dispatch Desk here regarding your attached cab application (${lead.serialId}). We have received your uploaded documents. Are you available for a quick verification call?`;
                          const waFollowupUrl = lead.phone ? `https://wa.me/91${lead.phone}?text=${encodeURIComponent(waFollowupText)}` : '';

                          return (
                            <div key={lead.leadId || lead.serialId} className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between gap-3">
                              <div className="space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-mono font-extrabold text-xs border border-amber-300 shadow-2xs">
                                        {lead.serialId}
                                      </span>
                                      <span className="font-bold text-sm text-slate-900">{lead.name}</span>
                                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                        {lead.partnerType || 'Partner'}
                                      </span>
                                      {lead.submissionCount > 1 && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                                          ✓ {lead.submissionCount} Submissions Merged
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs font-mono text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-slate-800">
                                        {lead.phone ? `+91 ${lead.phone}` : 'No Phone Provided'}
                                      </span>
                                      <span>•</span>
                                      <span className="text-[11px] text-slate-400">Date: {lead.displayDate}</span>
                                    </div>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold shrink-0">
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
                                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                                    <div className="font-semibold text-slate-900">
                                      Chauffeur Job Application • {lead.details || 'Acting Driver'}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      Duty: <strong>{lead.preferredDuty || 'Outstation & Local'}</strong> • Exp: <strong>{lead.experience || '3+ Years'}</strong>
                                    </div>
                                  </div>
                                )}

                                {/* Uploaded Documents & Google Drive Verification Box */}
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-xs text-emerald-600 font-bold">verified</span>
                                      <span>Uploaded Documents on File</span>
                                    </span>
                                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">
                                      Cloud Verified
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                                      ✓ Driving License (DL)
                                    </span>
                                    {lead.category !== 'Driver Job Only' && (
                                      <>
                                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                                          ✓ Vehicle RC Book
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                                          ✓ Car Front View
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {/* Direct Cloud Drive Access */}
                                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 text-xs">
                                    <a
                                      href={lead.driveFolderUrl || lead.applicantDriveSearchUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-2xs"
                                      title="Open applicant's dedicated folder in Google Drive"
                                    >
                                      <span className="material-symbols-outlined text-xs">folder_open</span>
                                      <span>{lead.driveFolderUrl ? 'Open Google Drive Folder' : 'Open Uploads in Google Drive'}</span>
                                    </a>
                                    <a
                                      href={lead.masterDriveFolderUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 underline font-medium"
                                      title="Open Master Folder: Kalidass Driver & Cab Attachments"
                                    >
                                      <span>All Cab Attachments Drive</span>
                                      <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                                    </a>
                                  </div>
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
                                {lead.phone && (
                                  <>
                                    <a
                                      href={`tel:${lead.phone}`}
                                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition flex items-center gap-1"
                                      title="Call driver directly"
                                    >
                                      <span className="material-symbols-outlined text-xs">call</span>
                                      <span>Call</span>
                                    </a>
                                    <a
                                      href={waFollowupUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-lg transition flex items-center gap-1"
                                      title="Open WhatsApp chat with pre-filled verification message"
                                    >
                                      <span className="material-symbols-outlined text-xs">chat</span>
                                      <span>WhatsApp</span>
                                    </a>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDismissLead(lead)}
                                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition"
                                  title="Dismiss application"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Cloud Driver Sync Upgrade Notice (shown only if connected Apps Script is older v1) */}
              {driverSyncSupported === false && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 text-blue-950">
                    <span className="material-symbols-outlined text-blue-600 text-lg shrink-0 mt-0.5">cloud_sync</span>
                    <div>
                      <strong className="block">Enable 2-Way Google Sheet Sync for Drivers</strong>
                      <span className="text-blue-800">
                        Your current Google Sheet script only syncs Trips. Copy &amp; update the new script in Settings once so Drivers sync across phone &amp; PC automatically.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('settings')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shrink-0 transition"
                  >
                    Open Sheet Settings
                  </button>
                </div>
              )}

              {/* Fast Quick-Add Vehicle / Driver Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                      Quick Add Driver / Vehicle
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Just enter Name, Phone, Vehicle, Area &amp; Languages — extra details are optional.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ContactPickerControl
                      contacts={savedContacts}
                      onImportedContactsChange={setImportedContacts}
                      showToast={showToast}
                      defaultFilter="Phonebook"
                      buttonLabel="Pick from Phonebook"
                      compact
                      onSelect={({ name, phone: pickedPhone }) => {
                        if (name) setNewDriverName(name);
                        if (pickedPhone) {
                          const digits = String(pickedPhone).replace(/\D/g, '');
                          setNewDriverPhone(digits.length >= 10 ? digits.slice(-10) : digits);
                        }
                      }}
                    />
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

                <form onSubmit={handleAddDriver} className="space-y-3.5">
                  <datalist id="kt-vehicle-models-list">
                    {ALL_STANDARDIZED_MODELS.map((m) => (
                      <option key={m.model} value={m.model} />
                    ))}
                  </datalist>
                  <datalist id="kt-chennai-areas-list">
                    {ALL_CHENNAI_LOCALITIES.map((loc) => (
                      <option key={`${loc.name}-${loc.pincode}`} value={loc.name} />
                    ))}
                  </datalist>

                  {/* Primary 4 Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Driver Name *</label>
                      <input
                        type="text"
                        required
                        value={newDriverName}
                        onChange={(e) => setNewDriverName(e.target.value)}
                        placeholder="Driver Full Name"
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
                        placeholder="10-digit mobile"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-mono font-semibold"
                      />
                    </div>
                    {newDriverPartnerType !== 'Acting Driver' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Vehicle / Model</label>
                        <input
                          type="text"
                          list="kt-vehicle-models-list"
                          value={newDriverVehicle}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewDriverVehicle(val);
                            if (val.trim()) setNewDriverCategory(normalizeVehicleCategory(val));
                          }}
                          placeholder="e.g. Swift Dzire, Innova Crysta..."
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Base Area</label>
                      <input
                        type="text"
                        list="kt-chennai-areas-list"
                        value={newDriverArea}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewDriverArea(val);
                          const inferred = inferZoneFromAddress(val);
                          if (inferred) setNewDriverZone(inferred);
                        }}
                        placeholder="e.g. Medavakkam, Tambaram..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Languages Spoken (1-Tap Toggles) + Submit */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-600 mr-1">Languages Spoken:</span>
                      {DRIVER_LANGUAGES.map((lang) => {
                        const active = newDriverLanguages.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setNewDriverLanguages(toggleLanguageInList(newDriverLanguages, lang))}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border transition ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowMoreDriverFields(!showMoreDriverFields)}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showMoreDriverFields ? 'expand_less' : 'tune'}
                        </span>
                        <span>{showMoreDriverFields ? 'Hide Details' : 'Plate / More'}</span>
                      </button>
                      <button
                        type="submit"
                        className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>Add Driver</span>
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Optional Details */}
                  {showMoreDriverFields && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 animate-fadeIn">
                      {newDriverPartnerType !== 'Acting Driver' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Plate Number (Optional)</label>
                          <input
                            type="text"
                            value={newDriverPlate}
                            maxLength={13}
                            onChange={(e) => setNewDriverPlate(formatIndianPlateNumber(e.target.value))}
                            placeholder="e.g. TN 01 AB 1234"
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 uppercase font-mono font-bold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Chennai Zone (Auto)</label>
                        <select
                          value={newDriverZone}
                          onChange={(e) => setNewDriverZone(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-semibold"
                        >
                          <option value="">Auto-detect from Area</option>
                          {CHENNAI_ZONES.map(z => (
                            <option key={z.id} value={z.id}>{z.label}</option>
                          ))}
                        </select>
                      </div>
                      {newDriverPartnerType !== 'Acting Driver' && (
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
                      )}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Notes (Optional)</label>
                        <input
                          type="text"
                          value={newDriverNotes}
                          onChange={(e) => setNewDriverNotes(e.target.value)}
                          placeholder="e.g. Good for Sabarimala / night trips"
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium"
                        />
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Compact Filter Bar: Search, Vehicle, Zone & Language */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="relative sm:col-span-5">
                    <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-base">search</span>
                    <input
                      type="text"
                      value={rosterSearchQuery}
                      onChange={(e) => setRosterSearchQuery(e.target.value)}
                      placeholder="Search name, phone, area, vehicle, plate, language..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={rosterVehicleFilter}
                    onChange={(e) => setRosterVehicleFilter(e.target.value)}
                    className="sm:col-span-3 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Vehicles</option>
                    <option value="Sedan">Sedan (4+1)</option>
                    <option value="SUV / Ertiga">Ertiga / SUV</option>
                    <option value="Innova Crysta">Innova Crysta</option>
                    <option value="Tempo Traveller">Tempo / Van</option>
                    <option value="Acting Driver">Acting Drivers</option>
                  </select>
                  <select
                    value={rosterZoneFilter}
                    onChange={(e) => setRosterZoneFilter(e.target.value)}
                    className="sm:col-span-2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Zones</option>
                    {CHENNAI_ZONES.map(z => (
                      <option key={z.id} value={z.id}>{z.label}</option>
                    ))}
                  </select>
                  <select
                    value={rosterBoardFilter}
                    onChange={(e) => setRosterBoardFilter(e.target.value)}
                    className="sm:col-span-2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Specs</option>
                    <option value="Yellow Board">Yellow Board</option>
                    <option value="White Board">White Board</option>
                    <option value="With Carrier">With Carrier</option>
                  </select>
                </div>

                {/* Language Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Language:</span>
                  <button
                    type="button"
                    onClick={() => setRosterLanguageFilter('ALL')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                      rosterLanguageFilter === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    All Languages
                  </button>
                  {DRIVER_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setRosterLanguageFilter(lang)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                        rosterLanguageFilter === lang
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drivers Grid / Clean Empty State */}
              {drivers.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-2xl">badge</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Your Fleet Roster is Clean &amp; Empty</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Add your first real driver using the Quick Add form above — it will automatically save to your Google Sheet and sync across your phone &amp; PC.
                  </p>
                </div>
              ) : filteredRosterDrivers.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-xs space-y-2">
                  <p>No drivers match the selected search or filter.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setRosterVehicleFilter('ALL');
                      setRosterZoneFilter('ALL');
                      setRosterLanguageFilter('ALL');
                      setRosterBoardFilter('ALL');
                      setRosterSearchQuery('');
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRosterDrivers.map(driver => {
                    const activeDuty = activeTrips.find(
                      t => (t.driverPhone && driver.phone && t.driverPhone.includes(driver.phone.slice(-10))) ||
                           (t.vehicleNumber && driver.plate && t.vehicleNumber === driver.plate)
                    );
                    const driverLangs = normalizeLanguages(driver.languages, []);
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
                                  <span>📍 {driver.area || 'Chennai'}</span>
                                  {driver.zone && (
                                    <>
                                      <span className="text-slate-400">•</span>
                                      <span className="text-slate-500">{driver.zone}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            {driver.plate && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-xs rounded border border-slate-200 font-bold shrink-0">
                                {driver.plate}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2">
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

                            {/* Languages Spoken Chips */}
                            {driverLangs.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-200/60">
                                <span className="material-symbols-outlined text-[13px] text-indigo-500">translate</span>
                                {driverLangs.map((lang) => (
                                  <span
                                    key={lang}
                                    className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold"
                                  >
                                    {lang}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                              <div className="flex items-center gap-1.5 flex-wrap">
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

                            {driver.notes && (
                              <div className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-200/60">
                                {driver.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                          <a
                            href={`tel:${driver.phone}`}
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-xs">call</span>
                            <span>Call</span>
                          </a>
                          <a
                            href={buildWhatsAppUrl(driver.phone, `Namaskaram ${driver.name} (${driver.vehicle}${driver.plate ? ` - ${driver.plate}` : ''}), checking your availability for a Kalidass Travels trip near ${driver.area || 'Chennai'}.`)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                          >
                            <span className="material-symbols-outlined text-xs">chat</span>
                            <span>WhatsApp</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleOpenEditDriver(driver)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Driver"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDriver(driver.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
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

              {/* Quick Paste WhatsApp Registration Modal (Bottom Sheet on Mobile) */}
              {waPasteModalOpen && (
                <div
                  className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                  onClick={() => setWaPasteModalOpen(false)}
                >
                  <div
                    className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 p-5 sm:p-6 pb-safe max-w-md w-full shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-sm text-slate-900">Import Partner from WhatsApp Message</h4>
                      <button
                        type="button"
                        onClick={() => setWaPasteModalOpen(false)}
                        className="w-9 h-9 rounded-full bg-slate-100 sm:bg-transparent text-slate-500 hover:text-slate-700 flex items-center justify-center"
                        aria-label="Close modal"
                      >
                        <X className="w-4 h-4" />
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
                <>
                  {/* MOBILE SETTLEMENT CARDS (< md) — Zero Horizontal Scrolling */}
                  <div className="md:hidden space-y-3">
                    {settledTrips.map(trip => {
                      const totalPaid = (Number(trip.agreedRate) || 0) + (Number(trip.extraCharges) || 0);
                      const math = computeSettlementMath(trip, trip.commissionPct ?? 10);
                      return (
                        <div
                          key={trip.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-[11px] text-slate-500">#{trip.id}</span>
                                <h4 className="font-bold text-sm text-slate-900 truncate">{trip.customerName}</h4>
                              </div>
                              {trip.phone && (
                                <a
                                  href={`tel:${trip.phone}`}
                                  className="inline-flex items-center gap-1 text-xs font-mono text-blue-600 mt-0.5 py-0.5"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>{formatPhoneForDisplay(trip.phone)}</span>
                                </a>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-mono font-extrabold text-base text-emerald-600">
                                ₹{totalPaid.toLocaleString('en-IN')}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                By {trip.paymentCollector || 'Driver'}
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-700 space-y-1">
                            <div className="font-semibold text-slate-900">
                              {trip.vehicle} • {trip.driverName || 'Verified'} ({trip.vehicleNumber || 'Cab'})
                            </div>
                            <div className="text-slate-600 line-clamp-2">{trip.route}</div>
                            {Number(trip.extraCharges) > 0 && (
                              <div className="text-[11px] text-amber-700 font-semibold">
                                +₹{Number(trip.extraCharges).toLocaleString('en-IN')} extras
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleCommissionSettled(trip)}
                              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border active:scale-[0.98] transition ${
                                trip.commissionSettled
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-900 border-amber-300'
                              }`}
                            >
                              {trip.commissionSettled
                                ? 'Comm. Settled ✓'
                                : `${math.settlementDirection === 'DRIVER_PAYS_OFFICE' ? 'Drv→Off' : 'Off→Drv'} ₹${math.settlementAmount.toLocaleString('en-IN')}`}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendGoogleReviewRequest(trip)}
                              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border active:scale-[0.98] transition flex items-center justify-center gap-1.5 ${
                                trip.reviewSent
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-blue-600 text-white border-blue-600'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{trip.reviewSent ? 'Review Sent ✓' : 'Send Review'}</span>
                            </button>
                          </div>

                          <div className="flex justify-end pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="min-h-[36px] px-2.5 text-xs font-semibold text-slate-400 hover:text-red-600 flex items-center gap-1 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Record</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP SETTLEMENT TABLE (md+) */}
                  <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Trip ID</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Vehicle & Route</th>
                          <th className="py-3 px-4">Chauffeur</th>
                          <th className="py-3 px-4 text-right">Total Paid</th>
                          <th className="py-3 px-4 text-center">Commission</th>
                          <th className="py-3 px-4 text-center">Google Review</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {settledTrips.map(trip => {
                          const totalPaid = (Number(trip.agreedRate) || 0) + (Number(trip.extraCharges) || 0);
                          const math = computeSettlementMath(trip, trip.commissionPct ?? 10);
                          return (
                          <tr key={trip.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">#{trip.id}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{trip.customerName}</div>
                              <div className="text-slate-500 font-mono text-[11px]">{formatPhoneForDisplay(trip.phone)}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800">{trip.vehicle}</div>
                              <div className="text-slate-500 line-clamp-1 text-[11px]">{trip.route}</div>
                              {Number(trip.extraCharges) > 0 && (
                                <div className="text-[10px] text-amber-700 font-semibold">
                                  +₹{Number(trip.extraCharges).toLocaleString('en-IN')} extras
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700">
                              <div>{trip.driverName || 'Verified'} ({trip.vehicleNumber || 'Cab'})</div>
                              <div className="text-[10px] text-slate-500">Collected by {trip.paymentCollector || 'Driver'}</div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                              ₹{totalPaid.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleCommissionSettled(trip)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                                  trip.commissionSettled
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                {trip.commissionSettled
                                  ? 'Settled ✓'
                                  : `${math.settlementDirection === 'DRIVER_PAYS_OFFICE' ? 'Drv→Off' : 'Off→Drv'} ₹${math.settlementAmount.toLocaleString('en-IN')}`}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleSendGoogleReviewRequest(trip)}
                                className={`px-3 py-1.5 font-bold rounded-lg border inline-flex items-center gap-1 transition ${
                                  trip.reviewSent
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                }`}
                              >
                                <span className={`material-symbols-outlined text-xs ${trip.reviewSent ? 'text-emerald-600' : 'text-yellow-500'}`}>
                                  {trip.reviewSent ? 'task_alt' : 'star'}
                                </span>
                                <span>{trip.reviewSent ? 'Review Sent ✓' : 'Send Review Link'}</span>
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                </>
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
                  Save this URL once. Every phone or PC opening <code>/admin</code> will automatically sync both <strong>Trips</strong> and <strong>Drivers Roster</strong> (including languages spoken) live with your Google Sheet.
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
                    <span className="font-bold block">Manual Booking Intake Mode:</span>
                    Website WhatsApp quotations are <strong>not</strong> auto-added to Live Dispatch. Paste confirmed WhatsApp quotations in <strong>"New Booking Entry"</strong> to log them into this Google Sheet and dispatch queue.
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
          if (assignLanguageFilter !== 'ALL') {
            const langs = normalizeLanguages(d.languages, []);
            if (!langs.some(l => l.toLowerCase() === assignLanguageFilter.toLowerCase())) return false;
          }
          if (assignSearchQuery.trim()) {
            const q = assignSearchQuery.toLowerCase();
            const langsStr = normalizeLanguages(d.languages, []).join(' ');
            const hay = `${d.name || ''} ${d.phone || ''} ${d.plate || ''} ${d.vehicle || ''} ${d.area || ''} ${d.zone || ''} ${langsStr}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
            onClick={() => setAssigningTrip(null)}
          >
            <div
              className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 pb-safe max-w-2xl w-full shadow-2xl space-y-4 animate-fadeIn sm:my-auto max-h-[92dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />
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
                  type="button"
                  onClick={() => setAssigningTrip(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 sm:bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
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
                      setAssignLanguageFilter('ALL');
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
                        {z.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">3. Filter by Language Spoken:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAssignLanguageFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        assignLanguageFilter === 'ALL'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Any Language
                    </button>
                    {DRIVER_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setAssignLanguageFilter(lang)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          assignLanguageFilter === lang
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lang}
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
                      const dPlateNorm = formatIndianPlateNumber(d.plate || '');
                      const dPhone10 = String(d.phone || '').replace(/\D/g, '').slice(-10);
                      const targetStart = toIsoDate(assigningTrip.pickupDate);
                      const targetEnd = toIsoDate(assigningTrip.returnDate) || targetStart;
                      const activeDuty = trips.find((t) => {
                        if (t.id === assigningTrip.id) return false;
                        const st = normalizeManifestStatus(t.manifestStatus);
                        if (st !== 'On Trip' && st !== 'Confirmed') return false;
                        const tPhone10 = String(t.driverPhone || '').replace(/\D/g, '').slice(-10);
                        const tPlateNorm = formatIndianPlateNumber(t.vehicleNumber || '');
                        const sameDriver =
                          (tPhone10 && dPhone10 && tPhone10 === dPhone10) ||
                          (tPlateNorm && dPlateNorm && tPlateNorm === dPlateNorm);
                        if (!sameDriver) return false;
                        if (st === 'On Trip') return true;
                        const tStart = toIsoDate(t.pickupDate);
                        const tEnd = toIsoDate(t.returnDate) || tStart;
                        if (!targetStart || !tStart) return true;
                        return tStart <= targetEnd && targetStart <= tEnd;
                      });
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
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  normalizeManifestStatus(activeDuty.manifestStatus) === 'On Trip'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {normalizeManifestStatus(activeDuty.manifestStatus) === 'On Trip'
                                    ? `On Trip #${activeDuty.id}`
                                    : `Confirmed #${activeDuty.id} (${formatShortDate(activeDuty.pickupDate)})`}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span>📍 <strong>{d.area || 'Chennai'}</strong> ({d.zone || 'South & OMR'})</span>
                              {normalizeLanguages(d.languages, []).length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-indigo-700 font-semibold">
                                    🗣️ {normalizeLanguages(d.languages, []).join(', ')}
                                  </span>
                                </>
                              )}
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400">
                    Or Type / Edit Driver Details Manually Before Confirming:
                  </span>
                  <ContactPickerControl
                    contacts={savedContacts}
                    onImportedContactsChange={setImportedContacts}
                    showToast={showToast}
                    defaultFilter="Driver"
                    buttonLabel="Phonebook"
                    compact
                    onSelect={({ name, phone: pickedPhone }) => {
                      if (name) setCustomDriverName(name);
                      if (pickedPhone) {
                        const digits = String(pickedPhone).replace(/\D/g, '');
                        setCustomDriverPhone(digits.length >= 10 ? digits.slice(-10) : digits);
                      }
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Driver Full Name</label>
                    <input
                      type="text"
                      required
                      value={customDriverName}
                      onChange={(e) => setCustomDriverName(e.target.value)}
                      placeholder="Driver Full Name"
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Driver Phone</label>
                    <input
                      type="tel"
                      value={customDriverPhone}
                      onChange={(e) => setCustomDriverPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Vehicle Plate No.</label>
                    <input
                      type="text"
                      value={customVehicleNumber}
                      onChange={(e) => setCustomVehicleNumber(formatIndianPlateNumber(e.target.value))}
                      placeholder="e.g. TN 01 AB 1234"
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

      {/* EDIT DRIVER MODAL (Bottom Sheet on Mobile) */}
      {editingDriver && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          onClick={() => setEditingDriver(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-safe max-w-lg w-full shadow-2xl space-y-4 animate-fadeIn sm:my-auto max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Driver / Vehicle</h3>
                <p className="text-[11px] text-slate-500">Updates immediately sync to your Google Sheet.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDriver(null)}
                className="w-9 h-9 rounded-full bg-slate-100 sm:bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedDriver} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Driver Name *</label>
                  <input
                    type="text"
                    required
                    value={editingDriver.name || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editingDriver.phone || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Vehicle / Model</label>
                  <input
                    type="text"
                    list="kt-vehicle-models-list"
                    value={editingDriver.vehicle || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, vehicle: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Plate Number</label>
                  <input
                    type="text"
                    maxLength={13}
                    value={editingDriver.plate || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, plate: formatIndianPlateNumber(e.target.value) })}
                    placeholder="e.g. TN 01 AB 1234"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 uppercase font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Base Area</label>
                  <input
                    type="text"
                    list="kt-chennai-areas-list"
                    value={editingDriver.area || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const inferred = inferZoneFromAddress(val);
                      setEditingDriver({ ...editingDriver, area: val, ...(inferred ? { zone: inferred } : {}) });
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Partner Type</label>
                  <select
                    value={editingDriver.partnerType || 'Owner-Driver'}
                    onChange={(e) => setEditingDriver({ ...editingDriver, partnerType: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Owner-Driver">Owner-Driver</option>
                    <option value="Fleet Partner">Fleet Partner</option>
                    <option value="Acting Driver">Acting Driver</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Languages Spoken</label>
                <div className="flex flex-wrap gap-1.5">
                  {DRIVER_LANGUAGES.map((lang) => {
                    const active = normalizeLanguages(editingDriver.languages, []).includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() =>
                          setEditingDriver({
                            ...editingDriver,
                            languages: toggleLanguageInList(editingDriver.languages, lang)
                          })
                        }
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border transition ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Board Type</label>
                  <select
                    value={editingDriver.boardType || 'Yellow Board'}
                    onChange={(e) => setEditingDriver({ ...editingDriver, boardType: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="Yellow Board">Yellow Board</option>
                    <option value="White Board">White Board</option>
                    <option value="Acting Driver">Acting Driver</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Roof Carrier</label>
                  <select
                    value={editingDriver.carrier || 'With Carrier'}
                    onChange={(e) => setEditingDriver({ ...editingDriver, carrier: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="With Carrier">With Carrier</option>
                    <option value="No Carrier">No Carrier</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={editingDriver.notes || ''}
                  onChange={(e) => setEditingDriver({ ...editingDriver, notes: e.target.value })}
                  placeholder="Optional notes..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL (Bottom Sheet on Mobile) */}
      {editingTrip && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          onClick={() => setEditingTrip(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-safe max-w-lg w-full shadow-2xl space-y-4 animate-fadeIn sm:my-auto max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Booking #{editingTrip.id}</h3>
                <p className="text-[11px] text-slate-500">Fix fare, advance, schedule, or passenger details — syncs live to Google Sheet.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTrip(null)}
                className="w-9 h-9 rounded-full bg-slate-100 sm:bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTrip} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editingTrip.customerName || ''}
                    onChange={(e) => setEditingTrip({ ...editingTrip, customerName: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer Phone</label>
                  <input
                    type="tel"
                    required
                    value={editingTrip.phone || ''}
                    onChange={(e) => setEditingTrip({ ...editingTrip, phone: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pickup Date</label>
                  <input
                    type="date"
                    value={editingTrip.pickupDate || ''}
                    onChange={(e) => setEditingTrip({ ...editingTrip, pickupDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Return Date (Multi-Day)</label>
                  <input
                    type="date"
                    value={editingTrip.returnDate || ''}
                    onChange={(e) => setEditingTrip({ ...editingTrip, returnDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pickup Time</label>
                  <input
                    type="text"
                    value={editingTrip.pickupTime || ''}
                    onChange={(e) => setEditingTrip({ ...editingTrip, pickupTime: e.target.value })}
                    placeholder="e.g. 06:00 AM"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Booking Status</label>
                  <select
                    value={normalizeManifestStatus(editingTrip.manifestStatus)}
                    onChange={(e) => setEditingTrip({ ...editingTrip, manifestStatus: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold"
                  >
                    <option value="Quotation">1. Quotation / Enquiry</option>
                    <option value="Confirmed">2. Confirmed (Advance Paid)</option>
                    <option value="On Trip">3. On Trip (Live)</option>
                    <option value="Completed">4. Payment &amp; Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Alt Guest Name</label>
                  <input
                    type="text"
                    value={editingTrip.guestName || ''}
                    onChange={(e) => setEditingTrip({ ...editingTrip, guestName: e.target.value })}
                    placeholder="Optional on-ground guest"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Alt Phone / Pax</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="tel"
                      value={editingTrip.guestPhone || ''}
                      onChange={(e) => setEditingTrip({ ...editingTrip, guestPhone: e.target.value })}
                      placeholder="Alt phone"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 font-mono"
                    />
                    <input
                      type="text"
                      value={editingTrip.paxCount || ''}
                      onChange={(e) => setEditingTrip({ ...editingTrip, paxCount: e.target.value })}
                      placeholder="3 Pax"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Pickup Location / Reporting Address
                  </label>
                  <input
                    type="text"
                    value={editingTrip.pickupLocation || ''}
                    onChange={(e) => setEditingTrip({ ...editingTrip, pickupLocation: e.target.value })}
                    placeholder="Exact Chennai address, street, landmark or airport terminal"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                  />
                  {(!editingTrip.pickupLocation || /^chennai$/i.test(editingTrip.pickupLocation.trim())) && (
                    <span className="text-[10px] text-amber-600 font-semibold mt-1 block">
                      ⚠️ Please specify exact pickup landmark/street so chauffeur knows where to report
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Drop / Destination
                  </label>
                  <input
                    type="text"
                    value={editingTrip.dropLocation || ''}
                    onChange={(e) => setEditingTrip({ ...editingTrip, dropLocation: e.target.value })}
                    placeholder="e.g. Thirukadaiyur / HVXP+RRW / Tirupati Balaji"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                  />
                  {/\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4}\b/i.test(editingTrip.dropLocation || '') && (
                    <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
                      📍 Plus Code detected: clickable Google Maps link will be attached for chauffeur
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Vehicle</label>
                  <select
                    value={editingTrip.vehicle || 'Swift Dzire'}
                    onChange={(e) => setEditingTrip({ ...editingTrip, vehicle: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold"
                  >
                    {Object.keys(tariffConfig.vehicles).map(vKey => (
                      <option key={vKey} value={vKey}>{vKey}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Agreed Fare (₹)</label>
                    <input
                      type="number"
                      value={editingTrip.agreedRate}
                      onChange={(e) => setEditingTrip({ ...editingTrip, agreedRate: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Advance (₹)</label>
                    <input
                      type="number"
                      value={editingTrip.advance}
                      onChange={(e) => setEditingTrip({ ...editingTrip, advance: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Extra Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingTrip.extraCharges ?? 0}
                    onChange={(e) => setEditingTrip({ ...editingTrip, extraCharges: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Comm %</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={editingTrip.commissionPct ?? 10}
                      onChange={(e) => setEditingTrip({ ...editingTrip, commissionPct: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Collected By</label>
                    <select
                      value={editingTrip.paymentCollector || 'Driver'}
                      onChange={(e) => setEditingTrip({ ...editingTrip, paymentCollector: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 font-semibold"
                    >
                      <option value="Driver">Driver</option>
                      <option value="Office">Office</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={editingTrip.notes || ''}
                  onChange={(e) => setEditingTrip({ ...editingTrip, notes: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteTrip(editingTrip.id)}
                  className="py-2 px-3 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200/80 flex items-center gap-1 transition"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Delete</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTrip(null)}
                    className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    <span>Save Booking</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAGE 1 -> STAGE 2: COLLECT ADVANCE & CONFIRM QUOTATION MODAL (Bottom Sheet on Mobile) */}
      {confirmingTrip && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          onClick={() => setConfirmingTrip(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-safe max-w-lg w-full shadow-2xl space-y-4 animate-fadeIn sm:my-auto max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Collect Advance &amp; Confirm #{confirmingTrip.id}</h3>
                <p className="text-[11px] text-slate-500">Paste customer&apos;s WhatsApp quote or enter Name, Phone &amp; Advance to confirm booking.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingTrip(null)}
                className="w-9 h-9 rounded-full bg-slate-100 sm:bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Paste Customer WhatsApp Quote Auto-Fill */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-emerald-600">content_paste_go</span>
                  Paste WhatsApp Quote (Optional Auto-Fill)
                </span>
                <button
                  type="button"
                  onClick={handleParseConfirmWhatsApp}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition"
                >
                  Auto-Fill Fields
                </button>
              </div>
              <textarea
                rows={2}
                value={confirmWaPaste}
                onChange={(e) => setConfirmWaPaste(e.target.value)}
                placeholder="Paste the quotation message the customer sent on WhatsApp..."
                className="w-full text-xs bg-white border border-emerald-200 rounded-lg p-2 font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <form onSubmit={(e) => handleSubmitConfirmQuotation(e, { sendWhatsApp: false })} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={confirmingTrip.customerName || ''}
                    onChange={(e) => setConfirmingTrip({ ...confirmingTrip, customerName: e.target.value })}
                    placeholder="Customer Name"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Phone *</label>
                  <input
                    type="tel"
                    required
                    value={confirmingTrip.phone || ''}
                    onChange={(e) => setConfirmingTrip({ ...confirmingTrip, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Pickup Date</label>
                  <input
                    type="date"
                    value={confirmingTrip.pickupDate || ''}
                    onChange={(e) => setConfirmingTrip({ ...confirmingTrip, pickupDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Pickup Time</label>
                  <input
                    type="text"
                    value={confirmingTrip.pickupTime || ''}
                    onChange={(e) => setConfirmingTrip({ ...confirmingTrip, pickupTime: e.target.value })}
                    placeholder="e.g. 06:00 AM"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pickup Location / Reporting Address
                  </label>
                  <input
                    type="text"
                    value={confirmingTrip.pickupLocation || ''}
                    onChange={(e) => setConfirmingTrip({ ...confirmingTrip, pickupLocation: e.target.value })}
                    placeholder="Exact Chennai pickup address / landmark"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                  />
                  {(!confirmingTrip.pickupLocation || /^chennai$/i.test(confirmingTrip.pickupLocation.trim())) && (
                    <span className="text-[10px] text-amber-600 font-semibold mt-1 block">
                      ⚠️ Please specify exact pickup landmark/street so chauffeur knows where to report
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Drop / Destination
                  </label>
                  <input
                    type="text"
                    value={confirmingTrip.dropLocation || ''}
                    onChange={(e) => setConfirmingTrip({ ...confirmingTrip, dropLocation: e.target.value })}
                    placeholder="e.g. Tirupati Balaji / HVXP+RRW / Thirukadaiyur"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                  />
                  {/\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4}\b/i.test(confirmingTrip.dropLocation || '') && (
                    <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
                      📍 Plus Code detected: clickable Google Maps link will be attached for chauffeur
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Agreed Fare (₹)</label>
                  <input
                    type="number"
                    value={confirmingTrip.agreedRate}
                    onChange={(e) => setConfirmingTrip({ ...confirmingTrip, agreedRate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 mb-1">Advance Collected (₹)</label>
                  <input
                    type="number"
                    value={confirmingTrip.advance}
                    onChange={(e) => setConfirmingTrip({ ...confirmingTrip, advance: e.target.value })}
                    className="w-full text-xs bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 font-mono font-bold text-emerald-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                <span className="font-semibold text-slate-600">Balance to Collect by Driver:</span>
                <span className="font-mono font-extrabold text-slate-900">
                  ₹{Math.max(0, (Number(confirmingTrip.agreedRate) || 0) - (Number(confirmingTrip.advance) || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmingTrip(null)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmitConfirmQuotation(e, { sendWhatsApp: true })}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>Confirm &amp; Send WA</span>
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>Confirm Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAGE 3 -> STAGE 4: END TRIP & COLLECT PAYMENT MODAL */}
      {completingTrip && (() => {
        const math = computeSettlementMath(completingTrip, completingTrip.commissionPct ?? 10, {
          extraCharges: Number(completingTrip.extraCharges) || 0,
          paymentCollector: completingTrip.paymentCollector || 'Driver'
        });
        const totalEndCollection = math.customerBalanceToDriver;
        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
            onClick={() => setCompletingTrip(null)}
          >
            <div
              className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-safe max-w-md w-full shadow-2xl space-y-4 animate-fadeIn sm:my-auto max-h-[92dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">End Trip &amp; Record Payment</h3>
                  <p className="text-[11px] text-slate-500">
                    #{completingTrip.id} • {completingTrip.customerName} • {completingTrip.driverName || 'Driver'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCompletingTrip(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 sm:bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitCompleteTrip} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">Agreed Fare</span>
                    <span className="font-mono font-bold text-slate-900">₹{Number(completingTrip.agreedRate || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">Advance Paid</span>
                    <span className="font-mono font-bold text-emerald-700">₹{Number(completingTrip.advance || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Extra Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={completingTrip.extraCharges}
                      onChange={(e) => setCompletingTrip({ ...completingTrip, extraCharges: e.target.value })}
                      placeholder="0"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Extras Note (Optional)</label>
                    <input
                      type="text"
                      value={completingTrip.extraChargesNote || ''}
                      onChange={(e) => setCompletingTrip({ ...completingTrip, extraChargesNote: e.target.value })}
                      placeholder="e.g. +20km, 1hr wait"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Payment Collected By</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Driver', label: 'Driver (Cash / UPI)' },
                      { id: 'Office', label: 'Office (UPI / Bank)' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCompletingTrip({ ...completingTrip, paymentCollector: opt.id })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          (completingTrip.paymentCollector || 'Driver') === opt.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-900">Final Balance Collected:</span>
                    <span className="font-mono font-extrabold text-base text-emerald-800">
                      ₹{totalEndCollection.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-emerald-200/70 pt-1.5">
                    <span>Office Commission ({math.pct}%): ₹{math.commissionAmt.toLocaleString('en-IN')}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {math.settlementDirection === 'DRIVER_PAYS_OFFICE'
                        ? `Driver Pays Office: ₹${math.settlementAmount.toLocaleString('en-IN')}`
                        : `Office Pays Driver: ₹${math.settlementAmount.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(completingTrip.commissionSettled)}
                    onChange={(e) => setCompletingTrip({ ...completingTrip, commissionSettled: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Driver–Office Commission Already Settled
                  </span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCompletingTrip(null)}
                    className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">done_all</span>
                    <span>Complete &amp; Move to Review</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* MOBILE STICKY LIVE FARE & QUICK-SEND BAR (QUOTES VIEW)    */}
      {/* ========================================================= */}
      {activeNav === 'quotes' && (
        <div className="lg:hidden fixed left-0 right-0 bottom-nav-offset z-30 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-700/80 px-3 py-2.5 shadow-2xl">
          <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                {calculatedFare.statePermitAmt > 0 ? `Total + ${calculatedFare.stateCode} Permit` : 'Total Fare'}
              </div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono leading-tight">
                ₹{calculatedFare.total.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyQuote(calcOption1Text, 'Option 1 Micro-Receipt', true)}
                className="min-h-[42px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold border border-slate-700 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendWhatsAppQuote(calcOption1Text, true)}
                className="min-h-[42px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WA</span>
              </button>
              <button
                type="button"
                onClick={() => handleTransferToBooking(calculatedFare.total)}
                className="min-h-[42px] px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Push</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE "MORE" BOTTOM SHEET (DRIVERS / SETTLEMENTS / SYNC) */}
      {/* ========================================================= */}
      {isMobileMoreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end"
          onClick={() => setIsMobileMoreOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-4 pb-safe shadow-2xl border-t border-slate-200 animate-fadeIn space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-1" />
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-extrabold text-slate-900">More Operations</h3>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => navigateTo('drivers')}
                className={`min-h-[52px] px-4 py-3 rounded-2xl border flex items-center justify-between text-left transition ${
                  activeNav === 'drivers'
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-800 font-semibold'
                }`}
              >
                <span className="flex items-center gap-3 text-sm">
                  <Users className="w-5 h-5 text-blue-600" />
                  Drivers &amp; Fleet Roster
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700">
                  {drivers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('settlements')}
                className={`min-h-[52px] px-4 py-3 rounded-2xl border flex items-center justify-between text-left transition ${
                  activeNav === 'settlements'
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-800 font-semibold'
                }`}
              >
                <span className="flex items-center gap-3 text-sm">
                  <IndianRupee className="w-5 h-5 text-emerald-600" />
                  Settlements &amp; Reviews
                </span>
                {settledTrips.length - closedCompletedCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                    {settledTrips.length - closedCompletedCount} pending
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigateTo('settings')}
                className={`min-h-[52px] px-4 py-3 rounded-2xl border flex items-center justify-between text-left transition ${
                  activeNav === 'settings'
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-800 font-semibold'
                }`}
              >
                <span className="flex items-center gap-3 text-sm">
                  <Settings className="w-5 h-5 text-slate-600" />
                  Cloud Sheet &amp; Settings
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${googleSheetUrl && syncStatus !== 'error' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 pb-2">
              {googleSheetUrl && (
                <button
                  type="button"
                  onClick={() => {
                    fetchTripsFromGoogleSheet();
                    setIsMobileMoreOpen(false);
                  }}
                  className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Sync Sheet</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleLockConsole}
                className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Console</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE MATERIAL-3 THUMB-ZONE BOTTOM NAVIGATION BAR        */}
      {/* ========================================================= */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgba(15,23,42,0.08)]"
      >
        <div className="grid grid-cols-5 items-center h-[4.25rem] px-1 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => navigateTo('dispatch')}
            className={`relative flex flex-col items-center justify-center gap-0.5 h-full rounded-xl transition ${
              activeNav === 'dispatch' ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <span className={`px-3 py-1 rounded-full transition ${activeNav === 'dispatch' ? 'bg-blue-100/90' : ''}`}>
              <LayoutGrid className="w-5 h-5" />
            </span>
            <span className="text-[10px] leading-none">Dispatch</span>
            {quotationTrips.length + needsDriverCount > 0 && (
              <span className="absolute top-1.5 right-3 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center">
                {quotationTrips.length + needsDriverCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('quotes')}
            className={`flex flex-col items-center justify-center gap-0.5 h-full rounded-xl transition ${
              activeNav === 'quotes' ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <span className={`px-3 py-1 rounded-full transition ${activeNav === 'quotes' ? 'bg-blue-100/90' : ''}`}>
              <Calculator className="w-5 h-5" />
            </span>
            <span className="text-[10px] leading-none">Quote</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('new-booking')}
            className="flex flex-col items-center justify-center -mt-4"
            aria-label="New Booking"
          >
            <span
              className={`rounded-2xl flex items-center justify-center shadow-lg transition active:scale-95 ${
                activeNav === 'new-booking'
                  ? 'bg-slate-900 text-white ring-4 ring-blue-100'
                  : 'bg-blue-600 text-white shadow-blue-600/40'
              }`}
              style={{ width: '52px', height: '52px' }}
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </span>
            <span className={`text-[10px] mt-1 leading-none font-bold ${activeNav === 'new-booking' ? 'text-blue-700' : 'text-slate-700'}`}>
              New
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('copilot')}
            className={`flex flex-col items-center justify-center gap-0.5 h-full rounded-xl transition ${
              activeNav === 'copilot' ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <span className={`px-3 py-1 rounded-full transition ${activeNav === 'copilot' ? 'bg-blue-100/90' : ''}`}>
              <Bot className="w-5 h-5" />
            </span>
            <span className="text-[10px] leading-none">Co-Pilot</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMoreOpen(true)}
            className={`relative flex flex-col items-center justify-center gap-0.5 h-full rounded-xl transition ${
              ['drivers', 'settlements', 'settings'].includes(activeNav) || isMobileMoreOpen
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 font-medium'
            }`}
          >
            <span
              className={`px-3 py-1 rounded-full transition ${
                ['drivers', 'settlements', 'settings'].includes(activeNav) || isMobileMoreOpen ? 'bg-blue-100/90' : ''
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
            </span>
            <span className="text-[10px] leading-none">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
