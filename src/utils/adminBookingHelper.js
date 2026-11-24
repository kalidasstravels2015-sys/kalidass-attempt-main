// Shared utilities for Kalidass Travels Admin Booking Flow
// Handles WhatsApp quote/chat parsing, international phones, multi-day ranges,
// zero-breaking-change Google Sheet metadata encoding, and WA message builders.

export const TRIP_CATEGORIES = [
  'Local Chennai Rental',
  'Outstation Round Trip',
  'Outstation One-Way Drop',
  'Multi-Day Custom Itinerary',
  'Tour Package',
  'Airport Transfer'
];

export const LOCAL_PACKAGES = [
  { id: '4hr_40km', key: 'local_4hr_pkg', label: '4 Hr / 40 Km', hrs: 4, km: 40 },
  { id: '5hr_50km', key: 'local_5hr_pkg', label: '5 Hr / 50 Km', hrs: 5, km: 50 },
  { id: '8hr_80km', key: 'local_8hr_pkg', label: '8 Hr / 80 Km', hrs: 8, km: 80 },
  { id: '10hr_100km', key: 'local_10hr_pkg', label: '10 Hr / 100 Km', hrs: 10, km: 100 },
  { id: '12hr_120km', key: 'local_12hr_pkg', label: '12 Hr / 120 Km', hrs: 12, km: 120 },
  { id: 'custom', key: '', label: 'Custom Package', hrs: 0, km: 0 }
];

const META_PREFIX = '[[KT_META:';
const META_SUFFIX = ']]';

const MONTH_MAP = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12
};

// ==========================================
// PHONE & WHATSAPP HELPERS (INTERNATIONAL SAFE)
// ==========================================

const MONTH_SHORT_UPPER = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Normalizes any quotation/booking reference into the single unified KT/DDMMM/NN format
 * (e.g. "Q-221126-7" -> "KT/22NOV/07", "#kt/22nov/07" -> "KT/22NOV/07").
 */
export function normalizeUnifiedTripId(rawId = '') {
  const s = String(rawId || '').trim().replace(/^#+/, '').trim();
  if (!s) return '';
  const qMatch = s.match(/^Q-(\d{2})(\d{2})\d{2}-(\d+)$/i);
  if (qMatch) {
    const dd = qMatch[1];
    const mmIdx = Math.max(0, Math.min(11, parseInt(qMatch[2], 10) - 1));
    const seq = String(parseInt(qMatch[3], 10)).padStart(2, '0');
    return `KT/${dd}${MONTH_SHORT_UPPER[mmIdx] || 'NOV'}/${seq}`;
  }
  const ktMatch = s.match(/^KT\/(\d{1,2})([A-Za-z]{3})\/0*(\d+)(.*)$/i);
  if (ktMatch) {
    const dd = ktMatch[1].padStart(2, '0');
    const mon = ktMatch[2].toUpperCase();
    const seq = String(parseInt(ktMatch[3], 10)).padStart(2, '0');
    const suffix = (ktMatch[4] || '').trim();
    return `KT/${dd}${mon}/${seq}${suffix}`;
  }
  return s.toUpperCase();
}

export function normalizePhoneNumber(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (s.startsWith('+')) {
    return '+' + s.slice(1).replace(/[^\d\s-]/g, '').replace(/\s+/g, ' ').trim();
  }
  const digits = s.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return digits;
  }
  if (digits.length > 10) {
    return '+' + digits;
  }
  return s;
}

export function getWhatsAppDigits(rawPhone) {
  const s = String(rawPhone || '').trim();
  if (!s) return '';
  const digits = s.replace(/\D/g, '');
  if (!digits) return '';
  // Bare 10-digit Indian mobile number -> prepend 91
  if (digits.length === 10 && /^[6-9]/.test(digits) && !s.startsWith('+')) {
    return '91' + digits;
  }
  // International or already prefixed with country code (e.g. 91..., 1..., 880..., 60...)
  return digits;
}

export function stripWhatsAppIcons(text = '') {
  return String(text || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0E}\u{FE0F}\u{200D}]/gu, '')
    .replace(/^[ \t]+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildWhatsAppUrl(phone, text = '') {
  const digits = getWhatsAppDigits(phone);
  const cleanText = stripWhatsAppIcons(text);
  const encoded = encodeURIComponent(cleanText);
  if (digits) {
    return `https://wa.me/${digits}${encoded ? `?text=${encoded}` : ''}`;
  }
  return `https://wa.me/${encoded ? `?text=${encoded}` : ''}`;
}

export function formatPhoneForDisplay(rawPhone) {
  const s = String(rawPhone || '').trim();
  if (!s || s.includes('#ERROR') || s.includes('ERROR')) return '';
  if (s.startsWith('+')) return s;
  const digits = s.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91 ${digits}`;
  }
  return s;
}

// ==========================================
// DATE & MULTI-DAY HELPERS
// ==========================================

export function toIsoDate(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (s.includes('T')) {
    try {
      const dt = new Date(s);
      if (!isNaN(dt.getTime())) {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(dt);
      }
    } catch (_) {}
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    const yyyy = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return '';
}

export function addDaysToIsoDate(isoDate, offsetDays) {
  const base = toIsoDate(isoDate);
  if (!base) return '';
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + (Number(offsetDays) || 0)));
  return dt.toISOString().split('T')[0];
}

export function computeTripDays(pickupDate, returnDate) {
  const p = toIsoDate(pickupDate);
  const r = toIsoDate(returnDate);
  if (!p || !r) return 1;
  const [py, pm, pd] = p.split('-').map(Number);
  const [ry, rm, rd] = r.split('-').map(Number);
  const diffMs = Date.UTC(ry, rm - 1, rd) - Date.UTC(py, pm - 1, pd);
  const diffDays = Math.round(diffMs / 86400000) + 1;
  return diffDays >= 1 ? diffDays : 1;
}

export function formatShortDate(isoDate, includeYear = false) {
  const iso = toIsoDate(isoDate);
  if (!iso) return String(isoDate || '');
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mon = months[m - 1] || '';
  return includeYear ? `${d} ${mon} ${y}` : `${d} ${mon}`;
}

export function isTripActiveOnDate(trip, targetIsoDate) {
  const target = toIsoDate(targetIsoDate);
  if (!target) return false;
  const start = toIsoDate(trip?.pickupDate);
  if (!start) {
    return String(trip?.pickupDate || '').includes(target);
  }
  const end = toIsoDate(trip?.returnDate) || start;
  return target >= start && target <= end;
}

// ==========================================
// 4-STAGE PIPELINE STATUS & IST AUTO-START
// ==========================================

export const PIPELINE_STAGES = ['Quotation', 'Confirmed', 'On Trip', 'Completed'];

export function normalizeManifestStatus(rawStatus) {
  const s = String(rawStatus || '').trim().toLowerCase();
  if (!s || s === 'quotation' || s === 'follow-up' || s === 'followup' || s === 'enquiry' || s === 'inquiry' || s === 'lead') {
    return 'Quotation';
  }
  if (s === 'confirmed' || s === 'unassigned' || s === 'need driver' || s === 'needs driver' || s === 'booked') {
    return 'Confirmed';
  }
  if (s === 'on trip' || s === 'ontrip' || s === 'active' || s === 'running' || s === 'on road') {
    return 'On Trip';
  }
  if (s === 'completed' || s === 'settled' || s === 'closed' || s === 'finished') {
    return 'Completed';
  }
  return 'Confirmed';
}

export function parseTripPickupTimestampIST(pickupDate, pickupTime) {
  const iso = toIsoDate(pickupDate);
  if (!iso) return null;

  let hours = 0;
  let minutes = 0;
  const rawTime = String(pickupTime || '').trim();
  if (rawTime) {
    const ampm = rawTime.match(/(\d{1,2})\s*[:.]\s*(\d{2})\s*(AM|PM)/i);
    const h24 = rawTime.match(/\b(\d{1,2})\s*[:.]\s*(\d{2})\b/);
    if (ampm) {
      hours = parseInt(ampm[1], 10);
      minutes = parseInt(ampm[2], 10);
      const meridiem = ampm[3].toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
    } else if (h24) {
      hours = Math.min(23, parseInt(h24[1], 10));
      minutes = Math.min(59, parseInt(h24[2], 10));
    }
  }

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ts = Date.parse(`${iso}T${hh}:${mm}:00+05:30`);
  return Number.isNaN(ts) ? null : ts;
}

export function shouldAutoMoveToOnTrip(trip, nowMs = Date.now()) {
  if (!trip) return false;
  if (normalizeManifestStatus(trip.manifestStatus) !== 'Confirmed') return false;
  const hasDriver = Boolean(String(trip.driverName || '').trim());
  if (!hasDriver) return false;
  const pickupMs = parseTripPickupTimestampIST(trip.pickupDate, trip.pickupTime);
  if (pickupMs === null) return false;
  return nowMs >= pickupMs;
}

export function isOverdueWithoutDriver(trip, nowMs = Date.now()) {
  if (!trip) return false;
  if (normalizeManifestStatus(trip.manifestStatus) !== 'Confirmed') return false;
  const hasDriver = Boolean(String(trip.driverName || '').trim());
  if (hasDriver) return false;
  const pickupMs = parseTripPickupTimestampIST(trip.pickupDate, trip.pickupTime);
  if (pickupMs === null) return false;
  return nowMs >= pickupMs;
}

function parseNaturalDate(text, fallbackYear) {
  const now = new Date();
  const yearNow = fallbackYear || now.getFullYear();
  const s = String(text || '').trim();

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (dmy) {
    const ddNum = parseInt(dmy[1], 10);
    const mmNum = parseInt(dmy[2], 10);
    if (ddNum >= 1 && ddNum <= 31 && mmNum >= 1 && mmNum <= 12) {
      const dd = String(ddNum).padStart(2, '0');
      const mm = String(mmNum).padStart(2, '0');
      const yyyy = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // Scan ALL occurrences of "26 Nov", "23 Nov 2026", "26th Nov" so non-months like "3 Days" are skipped!
  const dMonRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})(?:[\s,]+(20\d{2}))?\b/gi;
  for (const m of s.matchAll(dMonRegex)) {
    const mon = MONTH_MAP[m[2].toLowerCase()];
    const dayNum = parseInt(m[1], 10);
    if (mon && dayNum >= 1 && dayNum <= 31) {
      const dd = String(dayNum).padStart(2, '0');
      const mm = String(mon).padStart(2, '0');
      let yyyy = m[3] ? Number(m[3]) : yearNow;
      // Smart year rollover if no explicit year and month is >2 months behind today (e.g. quoting in Dec for Jan)
      if (!m[3] && !fallbackYear) {
        const currentMonth = now.getMonth() + 1;
        if (mon < currentMonth - 2) {
          yyyy = yearNow + 1;
        }
      }
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // Also support "Nov 26" or "Nov 26, 2026"
  const monDRegex = /\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?(?:[\s,]+(20\d{2}))?\b/gi;
  for (const m of s.matchAll(monDRegex)) {
    const mon = MONTH_MAP[m[1].toLowerCase()];
    const dayNum = parseInt(m[2], 10);
    if (mon && dayNum >= 1 && dayNum <= 31) {
      const dd = String(dayNum).padStart(2, '0');
      const mm = String(mon).padStart(2, '0');
      let yyyy = m[3] ? Number(m[3]) : yearNow;
      if (!m[3] && !fallbackYear) {
        const currentMonth = now.getMonth() + 1;
        if (mon < currentMonth - 2) {
          yyyy = yearNow + 1;
        }
      }
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return '';
}

// ==========================================
// ZERO-BREAKING-CHANGE GOOGLE SHEET METADATA CODEC
// ==========================================

export function getCleanNotes(rawNotes) {
  const s = String(rawNotes || '');
  const idx = s.indexOf(META_PREFIX);
  if (idx === -1) return s.trim();
  return s.slice(0, idx).trim();
}

export function extractMetaFromNotes(rawNotes) {
  const s = String(rawNotes || '');
  const start = s.indexOf(META_PREFIX);
  if (start === -1) return null;
  const end = s.lastIndexOf(META_SUFFIX);
  if (end <= start) return null;
  try {
    const jsonStr = s.slice(start + META_PREFIX.length, end);
    return JSON.parse(jsonStr);
  } catch (_) {
    return null;
  }
}

export function encodeTripForSheet(trip) {
  const cleanNotes = getCleanNotes(trip.notes);
  const meta = {};
  if (trip.returnDate && trip.returnDate !== trip.pickupDate) meta.returnDate = trip.returnDate;
  if (Number(trip.days) > 1) meta.days = Number(trip.days);
  if (trip.paxCount) meta.paxCount = String(trip.paxCount).trim();
  if (trip.guestName) meta.guestName = String(trip.guestName).trim();
  if (trip.guestPhone) meta.guestPhone = String(trip.guestPhone).trim();
  if (trip.quoteRef) meta.quoteRef = String(trip.quoteRef).trim();
  if (trip.hotelName) meta.hotelName = String(trip.hotelName).trim();
  if (trip.flightNumber) meta.flightNumber = String(trip.flightNumber).trim();
  if (trip.terminal) meta.terminal = String(trip.terminal).trim();
  if (trip.airportDirection) meta.airportDirection = String(trip.airportDirection).trim();
  if (trip.packageLabel) meta.packageLabel = String(trip.packageLabel).trim();
  if (Number(trip.includedKm) > 0) meta.includedKm = Number(trip.includedKm);
  if (Number(trip.includedHrs) > 0) meta.includedHrs = Number(trip.includedHrs);
  if (Number(trip.extraKmRate) > 0) meta.extraKmRate = Number(trip.extraKmRate);
  if (Number(trip.extraHrRate) > 0) meta.extraHrRate = Number(trip.extraHrRate);
  if (Number(trip.nightStayCharge) > 0) meta.nightStayCharge = Number(trip.nightStayCharge);
  if (trip.tollPolicy) meta.tollPolicy = String(trip.tollPolicy).trim();
  if (Number(trip.statePermit) > 0) meta.statePermit = Number(trip.statePermit);
  if (Number(trip.driverBata) > 0) meta.driverBata = Number(trip.driverBata);
  if (Number(trip.quotedFare) > 0 && Number(trip.quotedFare) !== Number(trip.agreedRate)) {
    meta.quotedFare = Number(trip.quotedFare);
  }
  if (trip.tourKey) meta.tourKey = String(trip.tourKey).trim();
  if (trip.commissionPct !== undefined && trip.commissionPct !== null && trip.commissionPct !== '') {
    meta.commissionPct = Number(trip.commissionPct);
  }
  if (Number(trip.extraCharges) > 0) meta.extraCharges = Number(trip.extraCharges);
  if (trip.extraChargesNote) meta.extraChargesNote = String(trip.extraChargesNote).trim();
  if (trip.finalCollected !== undefined && trip.finalCollected !== null && trip.finalCollected !== '') {
    meta.finalCollected = Number(trip.finalCollected);
  }
  if (trip.paymentCollector) meta.paymentCollector = String(trip.paymentCollector).trim();
  if (trip.commissionSettled) meta.commissionSettled = true;
  if (trip.commissionSettledAt) meta.commissionSettledAt = String(trip.commissionSettledAt);
  if (trip.reviewSent) meta.reviewSent = true;
  if (trip.reviewSentAt) meta.reviewSentAt = String(trip.reviewSentAt);
  if (trip.startedAt) meta.startedAt = String(trip.startedAt);
  if (trip.completedAt) meta.completedAt = String(trip.completedAt);
  if (Array.isArray(trip.dayPlan) && trip.dayPlan.length > 0) {
    meta.dayPlan = trip.dayPlan.map((d, i) => ({
      day: d.day || i + 1,
      date: d.date || '',
      pkg: d.pkg || '',
      duty: d.duty || '',
      rate: Number(d.rate) || 0
    }));
  }

  const hasMeta = Object.keys(meta).length > 0;
  const serializedNotes = hasMeta
    ? `${cleanNotes ? `${cleanNotes}\n` : ''}${META_PREFIX}${JSON.stringify(meta)}${META_SUFFIX}`
    : cleanNotes;

  return {
    ...trip,
    notes: serializedNotes,
    // Also include top-level v3 column values for sheets upgraded to v3 Apps Script
    returnDate: trip.returnDate || '',
    days: Number(trip.days) || 1,
    guestName: trip.guestName || '',
    guestPhone: trip.guestPhone || '',
    paxCount: trip.paxCount || '',
    quoteRef: trip.quoteRef || '',
    billingTerms: buildCompactTermsSummary(trip),
    dayPlanJson: Array.isArray(trip.dayPlan) && trip.dayPlan.length > 0 ? JSON.stringify(trip.dayPlan) : ''
  };
}

export function decodeTripFromSheet(row) {
  const meta = extractMetaFromNotes(row.notes) || {};
  let dayPlan = Array.isArray(meta.dayPlan) ? meta.dayPlan : [];
  if (dayPlan.length === 0 && row.dayPlanJson) {
    try {
      const parsed = JSON.parse(row.dayPlanJson);
      if (Array.isArray(parsed)) dayPlan = parsed;
    } catch (_) {}
  }

  const pickupDate = toIsoDate(row.pickupDate) || String(row.pickupDate || '');
  const returnDate = toIsoDate(row.returnDate || meta.returnDate) || '';
  const days = Number(row.days || meta.days) || (returnDate ? computeTripDays(pickupDate, returnDate) : 1);

  return {
    ...row,
    pickupDate,
    returnDate,
    days,
    paxCount: String(row.paxCount || meta.paxCount || ''),
    guestName: String(row.guestName || meta.guestName || ''),
    guestPhone: String(row.guestPhone || meta.guestPhone || ''),
    quoteRef: String(row.quoteRef || meta.quoteRef || ''),
    hotelName: String(meta.hotelName || ''),
    flightNumber: String(meta.flightNumber || ''),
    terminal: String(meta.terminal || ''),
    airportDirection: String(meta.airportDirection || ''),
    packageLabel: String(meta.packageLabel || ''),
    includedKm: Number(meta.includedKm) || 0,
    includedHrs: Number(meta.includedHrs) || 0,
    extraKmRate: Number(meta.extraKmRate) || 0,
    extraHrRate: Number(meta.extraHrRate) || 0,
    nightStayCharge: Number(meta.nightStayCharge) || 0,
    tollPolicy: String(meta.tollPolicy || ''),
    statePermit: Number(meta.statePermit) || 0,
    driverBata: Number(meta.driverBata) || 0,
    quotedFare: Number(meta.quotedFare) || 0,
    tourKey: String(meta.tourKey || ''),
    commissionPct: meta.commissionPct !== undefined ? Number(meta.commissionPct) : (row.commissionPct !== undefined ? Number(row.commissionPct) : 10),
    extraCharges: Number(meta.extraCharges || row.extraCharges || 0),
    extraChargesNote: String(meta.extraChargesNote || row.extraChargesNote || ''),
    finalCollected: meta.finalCollected !== undefined ? Number(meta.finalCollected) : (row.finalCollected !== undefined ? Number(row.finalCollected) : undefined),
    paymentCollector: String(meta.paymentCollector || row.paymentCollector || 'Driver'),
    commissionSettled: Boolean(meta.commissionSettled || row.commissionSettled),
    commissionSettledAt: String(meta.commissionSettledAt || row.commissionSettledAt || ''),
    reviewSent: Boolean(meta.reviewSent || row.reviewSent),
    reviewSentAt: String(meta.reviewSentAt || row.reviewSentAt || ''),
    startedAt: String(meta.startedAt || row.startedAt || ''),
    completedAt: String(meta.completedAt || row.completedAt || ''),
    manifestStatus: normalizeManifestStatus(row.manifestStatus),
    dayPlan,
    notes: getCleanNotes(row.notes)
  };
}

export function buildCompactTermsSummary(trip) {
  const parts = [];
  if (trip.packageLabel) parts.push(trip.packageLabel);
  else if (Number(trip.includedHrs) > 0 && Number(trip.includedKm) > 0) {
    parts.push(`${trip.includedHrs}Hr/${trip.includedKm}Km`);
  } else if (Number(trip.includedKm) > 0) {
    parts.push(`${trip.includedKm} Km incl.`);
  }
  if (trip.tollPolicy === 'All-Inclusive') parts.push('All-Inclusive');
  else if (trip.tollPolicy === 'Extra at Actuals') parts.push('Toll & Parking Extra');
  if (Number(trip.statePermit) > 0) parts.push(`Permit ₹${Number(trip.statePermit).toLocaleString('en-IN')}`);
  if (Number(trip.extraKmRate) > 0) parts.push(`ExKm ₹${trip.extraKmRate}`);
  if (Number(trip.extraHrRate) > 0) parts.push(`ExHr ₹${trip.extraHrRate}`);
  if (Number(trip.nightStayCharge) > 0) parts.push(`Night ₹${trip.nightStayCharge}`);
  return parts.join(' • ');
}

// ==========================================
// SMART WHATSAPP QUOTE & CHAT PARSER
// ==========================================

function detectVehicleFromText(text, tariffConfig) {
  const lower = String(text || '').toLowerCase();
  const keys = Object.keys(tariffConfig?.vehicles || {});
  if (/17[\s-]*seater/i.test(lower)) return keys.find(k => k.includes('17-Seater')) || '17-Seater Executive Force Tempo';
  if (/20[\s-]*seater/i.test(lower)) return keys.find(k => k.includes('20-Seater')) || '20-Seater Grand Force Tempo';
  if (/26[\s-]*seater|mini\s*bus/i.test(lower)) return keys.find(k => k.includes('26-Seater')) || '26-Seater Mini Bus / Force Tempo';
  if (/14[\s-]*seater/i.test(lower)) return keys.find(k => k.includes('14-Seater')) || '14-Seater Executive Force Tempo';
  if (/12[\s-]*seater/i.test(lower)) return keys.find(k => k.includes('12-Seater')) || '12-Seater Luxury Force Tempo';
  if (/urbania/i.test(lower)) return keys.find(k => k.includes('Urbania')) || 'Force Urbania';
  if (/tempo|traveller/i.test(lower)) return keys.find(k => k.includes('Tempo')) || 'Tempo Traveller';
  if (/crysta/i.test(lower)) return 'Innova Crysta';
  if (/innova/i.test(lower)) return 'Innova';
  if (/ertiga|xl6|suv|mpv/i.test(lower)) return 'Maruti Ertiga';
  if (/etios/i.test(lower) && !/dzire/i.test(lower)) return 'Toyota Etios';
  if (/dzire|sedan/i.test(lower)) return 'Swift Dzire';
  return '';
}

export function parseWhatsAppBookingText(rawText, tariffConfig = {}) {
  const text = String(rawText || '')
    // Strip invisible Unicode directional/zero-width marks injected by WhatsApp Web/Mobile
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
    // Normalize non-breaking / narrow spaces (e.g. "06:00\u202FAM") to regular spaces
    .replace(/[\u00A0\u202F]/g, ' ')
    // Strip WhatsApp bold/italic formatting markers (*text*, _text_) without breaking bullets
    .replace(/\*([^*\n\r]+)\*/g, '$1')
    .replace(/\b_([^_\n\r]+)_\b/g, '$1')
    .trim();
  if (!text) return { parsed: {}, highlights: [] };

  const lower = text.toLowerCase();
  const parsed = {};
  const highlights = [];
  const defaultYear = (text.match(/\b(202\d)\b/) || [])[1] ? Number(text.match(/\b(202\d)\b/)[1]) : new Date().getFullYear();

  // 1. Quote Ref (e.g., Ref: Q-141126-4, Ref: KT/19NOV/02, Quote Ref: #...)
  const refMatch = text.match(/(?:Quote\s*Ref|Ref)\s*[:#-]?\s*([A-Za-z0-9#/_-]{4,})/i);
  if (refMatch) {
    parsed.quoteRef = normalizeUnifiedTripId(refMatch[1].replace(/[)*.]+$/, '').trim());
    highlights.push(`Ref: ${parsed.quoteRef}`);
  }

  // 2. Phone numbers & WhatsApp copy-paste chat headers (preserve international & alternate contacts)
  // e.g. "[12:26 pm, 22/11/2026] +91 98765 43210:" or "[22/11/26, 12:26:00 PM] Customer Name:"
  const waHeaderMatches = [...text.matchAll(/^\[[^\]]+\]\s*([^:\n\r]{2,50}):/gm)];
  for (const hm of waHeaderMatches) {
    const sender = hm[1].trim();
    const senderDigits = sender.replace(/\D/g, '');
    if (senderDigits.endsWith('8939539211') || senderDigits.endsWith('9092303060') || /^kalidass/i.test(sender)) {
      continue;
    }
    if (/^\+?\d[\d\s-]{8,15}$/.test(sender)) {
      if (!parsed.phone) parsed.phone = normalizePhoneNumber(sender);
    } else if (!parsed.customerName) {
      parsed.customerName = sender;
      highlights.push(`Sender: ${sender}`);
    }
  }

  const phoneMatches = [...text.matchAll(/(?:\+\d{1,3}[\s-]?\d[\d\s-]{7,13}|\b[6-9]\d{9}\b)/g)]
    .map(m => m[0].trim())
    // Filter out our own office numbers
    .filter(p => {
      const d = p.replace(/\D/g, '');
      return !d.endsWith('8939539211') && !d.endsWith('9092303060');
    });
  if (phoneMatches.length > 0) {
    const uniquePhones = [...new Set(phoneMatches.map(normalizePhoneNumber))];
    // Check if text explicitly marks an alternate contact ("My dad will contact you. 9876543210")
    const altMatch = text.match(/(?:dad|father|brother|guest|passenger|alternate|contact\s+you)[^\n\r\d]{0,30}(\+?\d[\d\s-]{8,14})/i);
    if (altMatch && uniquePhones.length >= 2) {
      parsed.guestPhone = normalizePhoneNumber(altMatch[1]);
      parsed.phone = parsed.phone || uniquePhones.find(p => p !== parsed.guestPhone) || uniquePhones[0];
    } else if (altMatch && uniquePhones.length === 1) {
      parsed.guestPhone = normalizePhoneNumber(altMatch[1]);
    } else {
      parsed.phone = parsed.phone || uniquePhones[0];
      const otherPhone = uniquePhones.find(p => p !== parsed.phone);
      if (otherPhone && !parsed.guestPhone) parsed.guestPhone = otherPhone;
    }
  }

  // 3. Guest Name, Pax Count, Hotel
  const guestMatch = text.match(/(?:Guest|Passenger|Customer|Name)\s*:\s*([^\n\r]+)/i);
  if (guestMatch) {
    let rawGuest = guestMatch[1].trim();
    const paxInGuest = rawGuest.match(/\(?\s*(\d+\s*(?:pax|adults?|people|persons?|members?)(?:\s*\+\s*\d+\s*kids?)?)\s*\)?/i);
    if (paxInGuest) {
      parsed.paxCount = paxInGuest[1].trim();
      rawGuest = rawGuest.replace(paxInGuest[0], '').replace(/\(\s*\)/g, '').trim();
    }
    parsed.guestName = rawGuest;
    parsed.customerName = rawGuest;
    highlights.push(`Guest: ${rawGuest}${parsed.paxCount ? ` (${parsed.paxCount})` : ''}`);
  }
  if (!parsed.paxCount) {
    const paxMatch = text.match(/\b(\d+)\s*(?:pax|passengers?|persons?|people|adults?)\b/i);
    if (paxMatch) parsed.paxCount = `${paxMatch[1]} Pax`;
  }
  const hotelMatch = text.match(/Hotel\s*:\s*([^\n\r]+)/i);
  if (hotelMatch) {
    parsed.hotelName = hotelMatch[1].trim();
    parsed.pickupLocation = parsed.hotelName;
  }

  // 4. Vehicle detection
  const veh = detectVehicleFromText(text, tariffConfig);
  if (veh) {
    parsed.vehicle = veh;
    highlights.push(veh);
  }

  // 5. Multi-Day Custom Day-by-Day Itinerary detection
  // Matches: "23 Nov (Day 1): 8 Hrs / 80 Kms\nAirport T1 Pickup (11:20 AM) + Chennai Local\nRate: ₹3,000"
  const dayBlockRegex = /(?:(\d{1,2}\s+[A-Za-z]{3,9}(?:\s+\d{4})?)\s*\(\s*Day\s*(\d+)\s*\)|Day\s*(\d+)\s*(?:\(([^)]+)\))?)\s*[:\-–]\s*([^\n\r]+)(?:\r?\n([^\n\r]+))?(?:\r?\n([^\n\r]+))?/gi;
  const dayRows = [];
  let dm;
  while ((dm = dayBlockRegex.exec(text)) !== null) {
    const dateStr = dm[1] || dm[4] || '';
    const dayNum = Number(dm[2] || dm[3] || dayRows.length + 1);
    const line1 = (dm[5] || '').trim();
    const line2 = (dm[6] || '').trim();
    const line3 = (dm[7] || '').trim();

    const combined = [line1, line2, line3].filter(Boolean).join(' | ');
    const rateMatch = combined.match(/(?:Rate|Fare|Amount)\s*:\s*₹?\s*([\d,]+)/i);
    const rate = rateMatch ? Number(rateMatch[1].replace(/,/g, '')) : 0;

    // Separate package label (e.g. "8 Hrs / 80 Kms") vs duty description
    const pkgMatch = line1.match(/(\d+\s*Hrs?\s*\/\s*\d+\s*Kms?)/i);
    const pkg = pkgMatch ? pkgMatch[1] : '';
    let duty = line2 && !/^Rate\s*:/i.test(line2) ? line2 : line1.replace(pkg, '').trim();
    if (line3 && !/^Rate\s*:/i.test(line3) && !/^(?:Total|Includes|Excludes|Please)/i.test(line3)) {
      duty = duty ? `${duty} — ${line3}` : line3;
    }

    dayRows.push({
      day: dayNum,
      date: parseNaturalDate(dateStr, defaultYear) || '',
      pkg,
      duty: duty || line1,
      rate
    });
  }

  if (dayRows.length >= 2) {
    parsed.tripCategory = 'Multi-Day Custom Itinerary';
    parsed.dayPlan = dayRows;
    parsed.days = dayRows.length;
    if (dayRows[0].date) parsed.pickupDate = dayRows[0].date;
    if (dayRows[dayRows.length - 1].date) parsed.returnDate = dayRows[dayRows.length - 1].date;
    // Extract first time mentioned in Day 1
    const t1 = dayRows[0].duty.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (t1) parsed.pickupTime = t1[1].toUpperCase();
    if (!parsed.pickupLocation && /airport\s*t\d/i.test(dayRows[0].duty)) {
      parsed.pickupLocation = (dayRows[0].duty.match(/airport\s*t\d/i) || ['Chennai Airport'])[0];
    }
    parsed.dropLocation = dayRows.map(d => `D${d.day}: ${d.duty}`).join(' | ').slice(0, 140);
    highlights.push(`Multi-Day Custom (${dayRows.length} Days)`);
  }

  // 6. Dates & Times (if not already populated by Day-by-Day)
  if (!parsed.pickupDate) {
    // Pattern 0: Explicit "Pickup: Thu, 26 Nov, 06:00 AM" and "Return: Sat, 28 Nov, 09:00 PM" lines
    const pickupLineMatch = text.match(/^(?:[-•*]\s*)?(?:Pickup|Pick[\s-]?up|Start|Departure)\s*[:\-]\s*([^\n\r]+)/im);
    const returnLineMatch = text.match(/^(?:[-•*]\s*)?(?:Return|Drop[\s-]?off|End|Drop\s*Date)\s*[:\-]\s*([^\n\r]+)/im);

    if (pickupLineMatch) {
      const pDate = parseNaturalDate(pickupLineMatch[1], defaultYear);
      if (pDate) parsed.pickupDate = pDate;
      const pTime = pickupLineMatch[1].match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
      if (pTime) parsed.pickupTime = pTime[1].toUpperCase();
    }
    if (returnLineMatch) {
      const rDate = parseNaturalDate(returnLineMatch[1], defaultYear);
      if (rDate) parsed.returnDate = rDate;
    }

    if (!parsed.pickupDate) {
      // Pattern A: "21-11-2026 06:00 AM – 23-11-2026 09:00 AM"
      const rangeDmy = text.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})(?:\s+(\d{1,2}:\d{2}\s*(?:AM|PM)))?\s*[–—\-to]+\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
      if (rangeDmy) {
        parsed.pickupDate = parseNaturalDate(rangeDmy[1], defaultYear);
        parsed.returnDate = parseNaturalDate(rangeDmy[3], defaultYear);
        if (rangeDmy[2]) parsed.pickupTime = rangeDmy[2].toUpperCase();
      } else {
        // Pattern B: "23 Nov - 25 Nov 2026" or "26th to 29th Nov"
        const rangeNat1 = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s*(?:[-–—]|to)\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?/i);
        const rangeNat2 = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(?:[-–—]|to)\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?/i);
        if (rangeNat1 && MONTH_MAP[rangeNat1[2].toLowerCase()] && MONTH_MAP[rangeNat1[4].toLowerCase()]) {
          const yr = rangeNat1[5] ? Number(rangeNat1[5]) : defaultYear;
          parsed.pickupDate = parseNaturalDate(`${rangeNat1[1]} ${rangeNat1[2]} ${yr}`, yr);
          parsed.returnDate = parseNaturalDate(`${rangeNat1[3]} ${rangeNat1[4]} ${yr}`, yr);
        } else if (rangeNat2 && MONTH_MAP[rangeNat2[3].toLowerCase()]) {
          const yr = rangeNat2[4] ? Number(rangeNat2[4]) : defaultYear;
          parsed.pickupDate = parseNaturalDate(`${rangeNat2[1]} ${rangeNat2[3]} ${yr}`, yr);
          parsed.returnDate = parseNaturalDate(`${rangeNat2[2]} ${rangeNat2[3]} ${yr}`, yr);
        } else {
          // Single date: "Pickup: Thu, 17 Dec, 06:00 AM" or "26th Nov"
          const singleDate = parseNaturalDate(text, defaultYear);
          if (singleDate) parsed.pickupDate = singleDate;
        }
      }
    }
  }
  if (!parsed.pickupTime) {
    const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (timeMatch) parsed.pickupTime = timeMatch[1].toUpperCase();
  }
  if (parsed.pickupDate && parsed.returnDate) {
    parsed.days = computeTripDays(parsed.pickupDate, parsed.returnDate);
    highlights.push(`${formatShortDate(parsed.pickupDate)} – ${formatShortDate(parsed.returnDate)} (${parsed.days}D)`);
  } else {
    const daysMatch = text.match(/(\d+)\s*[-]?\s*days?/i);
    if (daysMatch && !parsed.days) {
      parsed.days = Number(daysMatch[1]);
      if (parsed.pickupDate && parsed.days > 1) {
        parsed.returnDate = addDaysToIsoDate(parsed.pickupDate, parsed.days - 1);
      }
    }
    if (parsed.pickupDate && parsed.returnDate) {
      highlights.push(`${formatShortDate(parsed.pickupDate)} – ${formatShortDate(parsed.returnDate)} (${parsed.days}D)`);
    } else if (parsed.pickupDate) {
      highlights.push(`Date: ${formatShortDate(parsed.pickupDate)}`);
    }
  }

  // 7. Trip Category detection (if not Multi-Day Custom)
  if (!parsed.tripCategory) {
    if (/tirupati|kanchipuram|navagraha|rameswaram|sabarimala|temple\s*trip|tour\s*package/i.test(lower)) {
      parsed.tripCategory = 'Tour Package';
      if (/tirupati/i.test(lower)) parsed.tourKey = 'tirupati-package';
      else if (/kanchipuram/i.test(lower)) parsed.tourKey = 'kanchipuram-temple-trip';
      else if (/pondicherry|puducherry/i.test(lower)) parsed.tourKey = 'pondicherry-tour';
      else if (/rameswaram/i.test(lower)) parsed.tourKey = 'rameswaram-tour';
      else if (/navagraha/i.test(lower)) parsed.tourKey = 'navagraha-temple-tour';
    } else if (/chennai\s*local|local\s*(?:rental|package)|\b(?:4|5|8|10|12)\s*hrs?\s*(?:\/|&)\s*(?:40|50|80|100|120)\s*kms?\b/i.test(lower)) {
      parsed.tripCategory = 'Local Chennai Rental';
    } else if (/one[\s-]?way|drop\s*only/i.test(lower)) {
      parsed.tripCategory = 'Outstation One-Way Drop';
    } else if (/airport\s*(?:pickup|drop|transfer)/i.test(lower) && (!parsed.days || parsed.days === 1) && !/pondicherry|puducherry|madurai|tirupati/i.test(lower)) {
      parsed.tripCategory = 'Airport Transfer';
    } else if (/round\s*trip|outstation|driver\s*bata|state\s*permit/i.test(lower) || (parsed.days && parsed.days > 1)) {
      parsed.tripCategory = 'Outstation Round Trip';
    }
  }

  // 8. Route / Pickup & Drop extraction
  if (!parsed.dropLocation) {
    // e.g. "Chennai ⇄ Madurai..." or "Chennai Airport – Puducherry – Pichavaram – Chennai Airport"
    const arrowLine = text.match(/([^\n\r•]+?)\s*(?:⇄|↔|➔|->)\s*([^\n\r•]+)/);
    if (arrowLine) {
      parsed.pickupLocation = parsed.pickupLocation || arrowLine[1].replace(/^[*-]\s*/, '').trim();
      parsed.dropLocation = arrowLine[2].replace(/\s*\(\s*\d+\s*Days?\s*\)\s*$/i, '').trim();
    } else {
      const parenRoute = text.match(/:\s*(Chennai[^)\n\r]+(?:–|-|to)[^)\n\r]+)/i);
      if (parenRoute) {
        const parts = parenRoute[1].split(/\s*[–-]\s*/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          parsed.pickupLocation = parsed.pickupLocation || parts[0];
          parsed.dropLocation = parts.slice(1).join(' → ');
        }
      } else if (parsed.tripCategory === 'Tour Package') {
        if (/tirupati/i.test(lower)) {
          parsed.pickupLocation = parsed.pickupLocation || 'Chennai';
          parsed.dropLocation = 'Tirupati Balaji Temple';
        } else if (/kanchipuram/i.test(lower)) {
          parsed.pickupLocation = parsed.pickupLocation || 'Chennai';
          parsed.dropLocation = 'Kanchipuram Temples';
        }
      } else if (parsed.tripCategory === 'Local Chennai Rental') {
        parsed.pickupLocation = parsed.pickupLocation || 'Chennai';
        parsed.dropLocation = 'Chennai Local';
      }
    }
  }

  // 9. Local Package / Included Km / Hrs / Bata / Permit
  const localPkgMatch = text.match(/\b(\d{1,2})\s*Hrs?\s*(?:\/|&)\s*(\d{2,3})\s*Kms?\b/i);
  if (localPkgMatch) {
    parsed.includedHrs = Number(localPkgMatch[1]);
    parsed.includedKm = Number(localPkgMatch[2]);
    parsed.packageLabel = `${parsed.includedHrs} Hr / ${parsed.includedKm} Km`;
  }
  if (!parsed.includedKm) {
    const kmIncMatch = text.match(/(?:Includes|covers\s*up\s*to|minimum\s*billed[^=\n\r]*=|BILLING\s*\()\s*[^0-9\n\r]{0,15}([\d,]+)\s*km/i);
    if (kmIncMatch) parsed.includedKm = Number(kmIncMatch[1].replace(/,/g, ''));
  }

  const bataMatch = text.match(/Driver\s*Bata[^\n\r]*=\s*₹?\s*([\d,]+)/i);
  if (bataMatch) parsed.driverBata = Number(bataMatch[1].replace(/,/g, ''));

  const permitMatch = text.match(/State\s*Permit\s*[:=]\s*₹?\s*([\d,]+)/i);
  if (permitMatch) parsed.statePermit = Number(permitMatch[1].replace(/,/g, ''));

  // 10. Fares: Quoted Base vs Final Negotiated, Advance, Over-limit, Toll Policy
  const fareCandidates = [];
  const farePatterns = [
    /(?:Total\s*Amount|Estimated\s*Fare|Estimated\s*Base\s*Total|Package\s*=|Flat)\s*[:=]?\s*₹?\s*([\d,]+)/i,
    /best\s*quote\s*(?:is|:)\s*₹?\s*([\d,]+)/i
  ];
  const baseFareMatch = text.match(farePatterns[0]);
  if (baseFareMatch) fareCandidates.push(Number(baseFareMatch[1].replace(/,/g, '')));
  const negotiatedMatch = text.match(farePatterns[1]);
  if (negotiatedMatch) {
    const neg = Number(negotiatedMatch[1].replace(/,/g, ''));
    if (fareCandidates.length > 0 && neg !== fareCandidates[0]) {
      parsed.quotedFare = fareCandidates[0];
    }
    parsed.agreedRate = neg;
    highlights.push(`Negotiated: ₹${neg.toLocaleString('en-IN')}`);
  } else if (fareCandidates.length > 0) {
    parsed.agreedRate = fareCandidates[0];
    highlights.push(`Fare: ₹${parsed.agreedRate.toLocaleString('en-IN')}`);
  } else if (dayRows.length >= 2) {
    const sum = dayRows.reduce((acc, d) => acc + (Number(d.rate) || 0), 0);
    if (sum > 0) {
      parsed.agreedRate = sum;
      highlights.push(`Fare: ₹${sum.toLocaleString('en-IN')}`);
    }
  }

  // Advance amount (e.g. "advance ( 500 INR )", "₹2,000 advance", "Advance now: ₹500")
  const advMatch =
    text.match(/Advance(?:\s*now)?\s*[:(]\s*₹?\s*([\d,]+)/i) ||
    text.match(/₹\s*([\d,]+)\s*advance/i);
  if (advMatch) {
    parsed.suggestedAdvance = Number(advMatch[1].replace(/,/g, ''));
  }

  // Over-limit rates
  const exKmMatch =
    text.match(/Extra\s*(?:km|running)[^₹\n\r]*₹\s*([\d,]+)\s*\/\s*km/i) ||
    text.match(/₹\s*([\d,]+)\s*\/\s*Km/i);
  if (exKmMatch) parsed.extraKmRate = Number(exKmMatch[1].replace(/,/g, ''));

  const exHrMatch =
    text.match(/Extra\s*hr[^₹\n\r]*₹\s*([\d,]+)\s*\/\s*hr/i) ||
    text.match(/₹\s*([\d,]+)\s*\/\s*Hr/i);
  if (exHrMatch) parsed.extraHrRate = Number(exHrMatch[1].replace(/,/g, ''));

  const nightMatch = text.match(/Night\s*(?:stay|drive)[^₹\n\r]*₹\s*([\d,]+)/i);
  if (nightMatch) parsed.nightStayCharge = Number(nightMatch[1].replace(/,/g, ''));

  if (/all[-\s]?inclusive/i.test(lower)) {
    parsed.tollPolicy = 'All-Inclusive';
  } else if (/toll|parking/i.test(lower)) {
    parsed.tollPolicy = 'Extra at Actuals';
  }

  // 11. Detect if it looks like an unconfirmed / deferred inquiry
  if (/not\s*available|plan\s*changed|inform\s*you\s*later|please\s*share\s*(?:vehicle\s*)?availability|do\s*you\s*have\s*any\s*tour/i.test(lower)) {
    parsed.bookingStatus = 'Quotation';
    highlights.push('Suggested: Quotation / Enquiry');
  }

  return { parsed, highlights };
}

// ==========================================
// WHATSAPP MESSAGE BUILDERS (ICON-FREE)
// ==========================================

export function formatLocationWithMapsLink(rawLoc, defaultCity = 'Chennai') {
  const loc = String(rawLoc || '').trim();
  if (!loc) return defaultCity;
  const plusMatch = loc.match(/\b([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4})\b/i);
  if (plusMatch) {
    const code = plusMatch[1].toUpperCase();
    const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(code + ' Tamil Nadu')}`;
    if (loc === plusMatch[1]) {
      return `${code} (📍 Google Maps: ${mapUrl})`;
    }
    return `${loc} (📍 Maps: ${mapUrl})`;
  }
  return loc;
}

export function formatPickupAddress(rawPickup) {
  const loc = String(rawPickup || '').trim();
  if (!loc || /^chennai$/i.test(loc)) {
    return 'Chennai (⚠️ Exact pickup address / landmark to be shared by guest)';
  }
  return formatLocationWithMapsLink(loc, 'Chennai');
}

export function formatDropAddress(rawDrop, route = '') {
  const drop = String(rawDrop || route || '').trim();
  if (!drop) return 'As directed by guest';
  return formatLocationWithMapsLink(drop, 'Destination');
}

export function buildTripScheduleLine(trip) {
  const pickup = toIsoDate(trip?.pickupDate) || trip?.pickupDate || '';
  const ret = toIsoDate(trip?.returnDate) || trip?.returnDate || '';
  const hasReturn = ret && ret !== pickup;
  const days = trip?.days || (hasReturn ? computeTripDays(pickup, ret) : 1);
  const time = trip?.pickupTime ? ` @ ${trip.pickupTime}` : '';

  if (hasReturn) {
    return `${formatShortDate(pickup, true)} to ${formatShortDate(ret, true)} (${days} Days)${time}`;
  }
  return `${formatShortDate(pickup, true)}${time}`;
}

export function buildCustomerConfirmationWA(trip) {
  const unifiedId = normalizeUnifiedTripId(trip.id || trip.quoteRef) || trip.id;
  const schedLine = buildTripScheduleLine(trip);
  const pickupAddr = formatPickupAddress(trip.pickupLocation);
  const dropAddr = formatDropAddress(trip.dropLocation, trip.route);
  const greetingTarget = trip.guestName || trip.customerName || 'Guest';

  const lines = [
    `*KALIDASS TRAVELS — TRIP CONFIRMATION*`,
    `Ref: *${unifiedId}*`,
    ``,
    `Dear ${greetingTarget}, your booking is confirmed.`,
    ``,
    `*Trip Schedule:* ${schedLine}`,
    `*Pickup Location:* ${pickupAddr}`,
    `*Drop / Destination:* ${dropAddr}`,
    ``,
    `*Vehicle:* ${trip.vehicle}${trip.vehicleNumber ? ` (${trip.vehicleNumber})` : ' (Confirmed)'}`,
  ];

  if (trip.driverName) {
    lines.push(`*Chauffeur:* ${trip.driverName}`);
    if (trip.driverPhone) {
      lines.push(`*Chauffeur Contact:* ${formatPhoneForDisplay(trip.driverPhone)}`);
    }
  } else {
    lines.push(`*Chauffeur:* Designated professional chauffeur (details shared before pickup)`);
  }

  if (trip.flightNumber || trip.terminal) {
    lines.push(`*Flight / Terminal:* ${[trip.terminal, trip.flightNumber].filter(Boolean).join(' - ')}`);
  }
  if (trip.hotelName) {
    lines.push(`*Hotel:* ${trip.hotelName}`);
  }

  if (Array.isArray(trip.dayPlan) && trip.dayPlan.length > 0) {
    lines.push(``);
    lines.push(`*DAY-BY-DAY ITINERARY:*`);
    trip.dayPlan.forEach((d, idx) => {
      const dLabel = d.date ? `${formatShortDate(d.date)} (Day ${d.day || idx + 1})` : `Day ${d.day || idx + 1}`;
      const pkgStr = d.pkg ? ` [${d.pkg}]` : '';
      const rateStr = Number(d.rate) > 0 ? ` — ₹${Number(d.rate).toLocaleString('en-IN')}` : '';
      lines.push(`- *${dLabel}:*${pkgStr} ${d.duty}${rateStr}`);
    });
  }

  const terms = buildCompactTermsSummary(trip);
  lines.push(``);
  if (Number(trip.agreedRate) > 0) {
    lines.push(`*Agreed Total Fare:* ₹${Number(trip.agreedRate).toLocaleString('en-IN')}`);
    if (Number(trip.advance) > 0) {
      lines.push(`*Advance Received:* ₹${Number(trip.advance).toLocaleString('en-IN')}`);
    }
    const bal = Math.max(0, (Number(trip.agreedRate) || 0) - (Number(trip.advance) || 0));
    lines.push(`*Balance to Chauffeur:* *₹${bal.toLocaleString('en-IN')}${trip.tollPolicy === 'All-Inclusive' ? ' (All-Inclusive)' : ' + Toll & Parking (Actuals)'}*`);
  }
  if (terms) lines.push(`_(${terms})_`);

  const cleanNote = getCleanNotes(trip.notes);
  if (cleanNote) lines.push(`*Note:* ${cleanNote}`);

  lines.push(``);
  lines.push(`Our chauffeur will report on time and assist with your luggage. Have a comfortable and pleasant journey.`);
  lines.push(`*24/7 Dispatch Desk:* +91 89395 39211`);

  return lines.join('\n');
}

export function buildCustomerBookingSummaryWA(trip) {
  const schedLine = buildTripScheduleLine(trip);
  const pickupAddr = formatPickupAddress(trip.pickupLocation);
  const dropAddr = formatDropAddress(trip.dropLocation, trip.route);
  const unifiedId = normalizeUnifiedTripId(trip.id || trip.quoteRef) || trip.id;
  const lines = [
    `*KALIDASS TRAVELS — BOOKING SUMMARY*`,
    `Ref: *${unifiedId}*`,
    ``,
    `*Booker:* ${trip.customerName}`,
  ];

  if (trip.guestName && trip.guestName !== trip.customerName) {
    lines.push(`*Passenger:* ${trip.guestName}${trip.guestPhone ? ` (${formatPhoneForDisplay(trip.guestPhone)})` : ''}`);
  } else if (trip.guestPhone) {
    lines.push(`*Alt Contact:* ${formatPhoneForDisplay(trip.guestPhone)}`);
  }
  if (trip.paxCount) lines.push(`*Passengers:* ${trip.paxCount}`);
  lines.push(`*Vehicle:* ${trip.vehicle} (${trip.tripCategory})`);
  lines.push(`*Schedule:* ${schedLine}`);
  if (trip.flightNumber || trip.terminal) {
    lines.push(`*Flight / Terminal:* ${[trip.terminal, trip.flightNumber].filter(Boolean).join(' - ')}`);
  }
  if (trip.hotelName) lines.push(`*Hotel:* ${trip.hotelName}`);
  lines.push(`*Pickup Location:* ${pickupAddr}`);
  if (trip.dropLocation && trip.tripCategory !== 'Multi-Day Custom Itinerary') {
    lines.push(`*Drop / Destination:* ${dropAddr}`);
  }

  if (Array.isArray(trip.dayPlan) && trip.dayPlan.length > 0) {
    lines.push(``);
    lines.push(`*DAY-BY-DAY ITINERARY:*`);
    trip.dayPlan.forEach((d, idx) => {
      const dLabel = d.date ? `${formatShortDate(d.date)} (Day ${d.day || idx + 1})` : `Day ${d.day || idx + 1}`;
      const pkgStr = d.pkg ? ` [${d.pkg}]` : '';
      const rateStr = Number(d.rate) > 0 ? ` — ₹${Number(d.rate).toLocaleString('en-IN')}` : '';
      lines.push(`- *${dLabel}:*${pkgStr} ${d.duty}${rateStr}`);
    });
  }

  const terms = buildCompactTermsSummary(trip);
  lines.push(``);
  lines.push(`*Agreed Total:* ₹${Number(trip.agreedRate || 0).toLocaleString('en-IN')}`);
  lines.push(`*Advance Paid:* ₹${Number(trip.advance || 0).toLocaleString('en-IN')}`);
  lines.push(`*Balance to Driver:* ₹${Number(trip.balance || 0).toLocaleString('en-IN')}${trip.tollPolicy === 'All-Inclusive' ? ' (All-Inclusive)' : ' (+ Tolls & Parking actuals)'}`);
  if (terms) lines.push(`*Terms:* ${terms}`);

  const cleanNote = getCleanNotes(trip.notes);
  if (cleanNote) lines.push(`*Note:* ${cleanNote}`);

  lines.push(``);
  lines.push(`Thank you for choosing Kalidass Travels, Chennai.`);
  lines.push(`*24/7 Dispatch Desk:* +91 89395 39211`);

  return lines.join('\n');
}

export function buildEnhancedDriverDutySlipWA(trip, math = null) {
  const unifiedId = normalizeUnifiedTripId(trip.id || trip.quoteRef) || trip.id;
  const schedLine = buildTripScheduleLine(trip);
  const pickupAddr = formatPickupAddress(trip.pickupLocation);
  const dropAddr = formatDropAddress(trip.dropLocation, trip.route);

  const lines = [
    `*DUTY SLIP — KALIDASS TRAVELS*`,
    `Ref: *${unifiedId}*`,
    ``,
    `*Trip Schedule:* ${schedLine}`,
    `*Vehicle Assigned:* ${trip.vehicle}${trip.vehicleNumber ? ` (${trip.vehicleNumber})` : ''}`,
  ];

  if (trip.driverName) {
    lines.push(`*Chauffeur:* ${trip.driverName}${trip.driverPhone ? ` (${formatPhoneForDisplay(trip.driverPhone)})` : ''}`);
  }

  lines.push(``);
  lines.push(`*Pickup Location:* ${pickupAddr}`);
  lines.push(`*Drop / Destination:* ${dropAddr}`);
  lines.push(``);

  lines.push(`*Customer:* ${trip.customerName}`);
  if (trip.phone) lines.push(`*Customer Mobile:* ${formatPhoneForDisplay(trip.phone)}`);

  if (trip.guestName && trip.guestName !== trip.customerName) {
    lines.push(`*Passenger:* ${trip.guestName}${trip.guestPhone ? ` (${formatPhoneForDisplay(trip.guestPhone)})` : ''}`);
  } else if (trip.guestPhone) {
    lines.push(`*Alt Mobile:* ${formatPhoneForDisplay(trip.guestPhone)}`);
  }
  if (trip.paxCount) lines.push(`*Pax:* ${trip.paxCount}`);
  if (trip.flightNumber || trip.terminal) {
    lines.push(`*Flight / Terminal:* ${[trip.terminal, trip.flightNumber].filter(Boolean).join(' - ')}`);
  }
  if (trip.hotelName) lines.push(`*Hotel:* ${trip.hotelName}`);

  if (Array.isArray(trip.dayPlan) && trip.dayPlan.length > 0) {
    lines.push(``);
    lines.push(`*DAY-BY-DAY SCHEDULE:*`);
    trip.dayPlan.forEach((d, idx) => {
      const dLabel = d.date ? `${formatShortDate(d.date)} (D${d.day || idx + 1})` : `Day ${d.day || idx + 1}`;
      lines.push(`- ${dLabel}: ${d.pkg ? `[${d.pkg}] ` : ''}${d.duty}`);
    });
  }

  const terms = buildCompactTermsSummary(trip);
  const bal = Math.max(0, (Number(trip.agreedRate) || 0) - (Number(trip.advance) || 0));
  lines.push(``);
  lines.push(`*Amount to Collect from Guest:* *₹${bal.toLocaleString('en-IN')}${trip.tollPolicy === 'All-Inclusive' ? ' (All-Inclusive - NO toll/permit collection)' : ' + Toll & Parking (Actuals)'}*`);
  if (terms) lines.push(`_(${terms})_`);

  if (math && math.commissionAmt !== undefined) {
    lines.push(`*Commission (${math.pct}%):* ₹${math.commissionAmt.toLocaleString('en-IN')}`);
  }

  const cleanNote = getCleanNotes(trip.notes);
  if (cleanNote) lines.push(`*Note:* ${cleanNote}`);

  lines.push(``);
  lines.push(`*Chauffeur Instructions:*`);
  lines.push(`- Report 15 mins early in clean, sanitized AC cab`);
  lines.push(`- Take Starting KM & Ending KM odometer photos`);
  lines.push(`- Keep Toll, Parking & Permit receipts`);
  lines.push(`*Dispatch Desk:* +91 89395 39211`);

  return lines.join('\n');
}

export function buildFollowUpReminderWA(trip) {
  const unifiedId = normalizeUnifiedTripId(trip.id || trip.quoteRef) || trip.id;
  return `Vanakkam ${trip.customerName} Sir/Mam,

Following up on your enquiry${unifiedId ? ` (Ref: *${unifiedId}*)` : ''} with *Kalidass Travels* for *${trip.vehicle}* (${trip.dropLocation || trip.route || trip.tripCategory})${trip.pickupDate ? ` on ${formatShortDate(trip.pickupDate, true)}` : ''}.

Have your travel plans been finalized? Please let us know if you would like us to reserve the vehicle for your dates.

*Kalidass Travels, Chennai:* +91 89395 39211`;
}
