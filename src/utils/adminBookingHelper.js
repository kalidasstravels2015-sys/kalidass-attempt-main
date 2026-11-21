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

export function buildWhatsAppUrl(phone, text = '') {
  const digits = getWhatsAppDigits(phone);
  const encoded = encodeURIComponent(text || '');
  if (digits) {
    return `https://wa.me/${digits}${encoded ? `?text=${encoded}` : ''}`;
  }
  return `https://wa.me/${encoded ? `?text=${encoded}` : ''}`;
}

export function formatPhoneForDisplay(rawPhone) {
  const s = String(rawPhone || '').trim();
  if (!s) return '';
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

function parseNaturalDate(text, fallbackYear) {
  const yearNow = fallbackYear || new Date().getFullYear();
  const s = String(text || '').trim();

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    const yyyy = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // "23 Nov 2026" or "26th Nov" or "17 Dec"
  const dMon = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})(?:[\s,]+(\d{4}))?/i);
  if (dMon) {
    const mon = MONTH_MAP[dMon[2].toLowerCase()];
    if (mon) {
      const dd = dMon[1].padStart(2, '0');
      const mm = String(mon).padStart(2, '0');
      const yyyy = dMon[3] || String(yearNow);
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
  const text = String(rawText || '').trim();
  if (!text) return { parsed: {}, highlights: [] };

  const lower = text.toLowerCase();
  const parsed = {};
  const highlights = [];
  const defaultYear = (text.match(/\b(202\d)\b/) || [])[1] ? Number(text.match(/\b(202\d)\b/)[1]) : new Date().getFullYear();

  // 1. Quote Ref (e.g., Ref: Q-141126-4, Ref: KT/19NOV/02, Quote Ref: #...)
  const refMatch = text.match(/(?:Quote\s*Ref|Ref)\s*[:#-]?\s*([A-Za-z0-9#/_-]{4,})/i);
  if (refMatch) {
    parsed.quoteRef = refMatch[1].replace(/[)*.]+$/, '').trim();
    highlights.push(`Ref: ${parsed.quoteRef}`);
  }

  // 2. Phone numbers (preserve international & alternate contacts)
  const phoneMatches = [...text.matchAll(/(?:\+\d{1,3}[\s-]?\d[\d\s-]{7,13}|\b[6-9]\d{9}\b)/g)]
    .map(m => m[0].trim())
    // Filter out our own office numbers
    .filter(p => {
      const d = p.replace(/\D/g, '');
      return !d.endsWith('8939539211') && !d.endsWith('9092303060');
    });
  if (phoneMatches.length > 0) {
    const uniquePhones = [...new Set(phoneMatches.map(normalizePhoneNumber))];
    // Check if text explicitly marks an alternate contact ("My dad will contact you. 9382155220")
    const altMatch = text.match(/(?:dad|father|brother|guest|passenger|alternate|contact\s+you)[^\n\r\d]{0,30}(\+?\d[\d\s-]{8,14})/i);
    if (altMatch && uniquePhones.length >= 2) {
      parsed.guestPhone = normalizePhoneNumber(altMatch[1]);
      parsed.phone = uniquePhones.find(p => p !== parsed.guestPhone) || uniquePhones[0];
    } else if (altMatch && uniquePhones.length === 1) {
      parsed.guestPhone = normalizePhoneNumber(altMatch[1]);
    } else {
      parsed.phone = uniquePhones[0];
      if (uniquePhones[1]) parsed.guestPhone = uniquePhones[1];
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

  // 5. Multi-Day Custom Day-by-Day Itinerary detection (Vivek USA style)
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
      if (rangeNat1) {
        const yr = rangeNat1[5] ? Number(rangeNat1[5]) : defaultYear;
        parsed.pickupDate = parseNaturalDate(`${rangeNat1[1]} ${rangeNat1[2]} ${yr}`, yr);
        parsed.returnDate = parseNaturalDate(`${rangeNat1[3]} ${rangeNat1[4]} ${yr}`, yr);
      } else if (rangeNat2) {
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
  if (!parsed.pickupTime) {
    const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (timeMatch) parsed.pickupTime = timeMatch[1].toUpperCase();
  }
  if (parsed.pickupDate && parsed.returnDate) {
    parsed.days = computeTripDays(parsed.pickupDate, parsed.returnDate);
  } else {
    const daysMatch = text.match(/(\d+)\s*[-]?\s*days?/i);
    if (daysMatch && !parsed.days) {
      parsed.days = Number(daysMatch[1]);
      if (parsed.pickupDate && parsed.days > 1) {
        parsed.returnDate = addDaysToIsoDate(parsed.pickupDate, parsed.days - 1);
      }
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
      parsed.dropLocation = arrowLine[2].trim();
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
    parsed.bookingStatus = 'Follow-up';
    highlights.push('Suggested: Pending / Follow-up');
  }

  return { parsed, highlights };
}

// ==========================================
// WHATSAPP MESSAGE BUILDERS (ICON-FREE)
// ==========================================

export function buildCustomerBookingSummaryWA(trip) {
  const dateLine = trip.returnDate && trip.returnDate !== trip.pickupDate
    ? `${formatShortDate(trip.pickupDate, true)} to ${formatShortDate(trip.returnDate, true)} (${trip.days || computeTripDays(trip.pickupDate, trip.returnDate)} Days)`
    : `${formatShortDate(trip.pickupDate, true) || trip.pickupDate}${trip.pickupTime ? ` @ ${trip.pickupTime}` : ''}`;

  const lines = [
    `*KALIDASS TRAVELS — BOOKING SUMMARY*`,
    `Booking ID: *#${trip.id}*${trip.quoteRef ? ` (Ref: ${trip.quoteRef})` : ''}`,
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
  lines.push(`*Schedule:* ${dateLine}${trip.returnDate && trip.pickupTime ? ` | Pickup: ${trip.pickupTime}` : ''}`);
  if (trip.flightNumber || trip.terminal) {
    lines.push(`*Flight / Terminal:* ${[trip.terminal, trip.flightNumber].filter(Boolean).join(' - ')}`);
  }
  if (trip.hotelName) lines.push(`*Hotel:* ${trip.hotelName}`);
  lines.push(`*Pickup:* ${trip.pickupLocation || 'Chennai'}`);
  if (trip.dropLocation && trip.tripCategory !== 'Multi-Day Custom Itinerary') {
    lines.push(`*Route / Drop:* ${trip.dropLocation}`);
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

export function buildEnhancedDriverDutySlipWA(trip) {
  const dateLine = trip.returnDate && trip.returnDate !== trip.pickupDate
    ? `${formatShortDate(trip.pickupDate, true)} to ${formatShortDate(trip.returnDate, true)} (${trip.days || computeTripDays(trip.pickupDate, trip.returnDate)} Days) @ ${trip.pickupTime || 'ASAP'}`
    : `${formatShortDate(trip.pickupDate, true) || trip.pickupDate} @ ${trip.pickupTime || 'ASAP'}`;

  const lines = [
    `*DUTY SLIP — KALIDASS TRAVELS*`,
    `Trip ID: #${trip.id}${trip.quoteRef ? ` | Ref: ${trip.quoteRef}` : ''}`,
    ``,
    `*Pickup:* ${dateLine}`,
  ];

  if (trip.dropLocation && trip.tripCategory !== 'Multi-Day Custom Itinerary') {
    lines.push(`*Route:* ${trip.dropLocation || trip.route}`);
  }
  lines.push(`*Vehicle:* ${trip.vehicle}${trip.vehicleNumber ? ` - ${trip.vehicleNumber}` : ''}`);
  lines.push(``);
  lines.push(`*Customer:* ${trip.customerName}`);
  if (trip.phone) lines.push(`*Mobile:* ${formatPhoneForDisplay(trip.phone)}`);

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
  lines.push(`*Pickup Address:* ${trip.pickupLocation || 'Chennai'}`);

  if (Array.isArray(trip.dayPlan) && trip.dayPlan.length > 0) {
    lines.push(``);
    lines.push(`*DAY-BY-DAY SCHEDULE:*`);
    trip.dayPlan.forEach((d, idx) => {
      const dLabel = d.date ? `${formatShortDate(d.date)} (D${d.day || idx + 1})` : `Day ${d.day || idx + 1}`;
      lines.push(`- ${dLabel}: ${d.pkg ? `[${d.pkg}] ` : ''}${d.duty}`);
    });
  }

  const terms = buildCompactTermsSummary(trip);
  lines.push(``);
  lines.push(`*Amount to Collect:* *₹${Number(trip.balance || 0).toLocaleString('en-IN')}${trip.tollPolicy === 'All-Inclusive' ? ' (All-Inclusive - NO toll/permit collection)' : ' + Toll & Parking (Actuals)'}*`);
  if (terms) lines.push(`_(${terms})_`);

  const cleanNote = getCleanNotes(trip.notes);
  if (cleanNote) lines.push(`*Note:* ${cleanNote}`);

  lines.push(``);
  lines.push(`*Instructions:*`);
  lines.push(`- Report 15 mins early in clean AC cab`);
  lines.push(`- Take Starting & Closing KM photo`);
  lines.push(`- Keep Toll, Parking & Permit slips`);
  lines.push(`*Dispatch Desk:* +91 89395 39211`);

  return lines.join('\n');
}

export function buildFollowUpReminderWA(trip) {
  return `Vanakkam ${trip.customerName} Sir/Mam,

Following up on your enquiry with *Kalidass Travels* for *${trip.vehicle}* (${trip.dropLocation || trip.route || trip.tripCategory})${trip.pickupDate ? ` on ${formatShortDate(trip.pickupDate, true)}` : ''}.

Have your travel plans been finalized? Please let us know if you would like us to reserve the vehicle for your dates.

*Kalidass Travels, Chennai:* +91 89395 39211`;
}
