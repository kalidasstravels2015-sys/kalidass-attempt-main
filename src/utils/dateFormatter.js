/**
 * Shared Date, Time & Metadata Formatting Utilities for Kalidass Travels
 * Ensures consistent, clean, human-readable data with 12-hour AM/PM time format.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a Date object or hours/minutes into 12-hour AM/PM string, e.g. "07:12 PM"
 */
export function formatAmPmTime(dateObj) {
  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }
  let h = dateObj.getHours();
  const m = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

/**
 * Clean & format any date/time string into a clear 12-hour AM/PM format.
 * Examples:
 * - "Thu Oct 22 2026 19:12:00 GMT+0530 (India Standard Time)" -> "22 Oct 2026, 07:12 PM"
 * - "2026-10-24T13:00" -> "24 Oct 2026, 01:00 PM"
 * - "20 Oct 2026, 2:09 pm" -> "20 Oct 2026, 02:09 PM"
 * - "Tomorrow @ 05:00 AM" -> "Tomorrow @ 05:00 AM"
 */
export function formatCleanDateTime(raw, options = {}) {
  if (!raw) return '';
  const str = String(raw).trim();
  if (!str || str === 'None' || str === 'null') return '';

  // Already friendly string like "Tomorrow @ 05:00 AM" or "Today @ 06:00 AM"
  if (/@\s*\d{1,2}:\d{2}\s*(?:AM|PM)/i.test(str)) {
    return str;
  }

  // Pure 24-hr time string like "13:00" or "19:12:00"
  const timeOnly = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeOnly) {
    let h = parseInt(timeOnly[1], 10);
    const m = timeOnly[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  }

  // Attempt Standard Date Parsing
  let d = new Date(str);
  if (isNaN(d.getTime())) {
    d = new Date(str.replace(/"/g, ''));
  }

  if (!isNaN(d.getTime())) {
    const day = d.getDate();
    const mon = MONTHS[d.getMonth()];
    const yr = d.getFullYear();
    const timeStr = formatAmPmTime(d);
    if (options.hideYear) {
      return `${day} ${mon}, ${timeStr}`;
    }
    return `${day} ${mon} ${yr}, ${timeStr}`;
  }

  // Fallback ISO regex replacement for strings like "2026-10-24T13:00"
  return str.replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?/, (_, y, m, d2, h, min) => {
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    const mon = MONTHS[parseInt(m, 10) - 1] || m;
    const timePart = `${String(hour).padStart(2, '0')}:${min} ${ampm}`;
    return options.hideYear ? `${parseInt(d2, 10)} ${mon}, ${timePart}` : `${parseInt(d2, 10)} ${mon} ${y}, ${timePart}`;
  });
}

/**
 * Format travel date & time into a friendly dispatch schedule
 * e.g. "2026-10-24T13:00" -> "24 Oct 2026 @ 01:00 PM"
 */
export function formatFriendlyTravelDateTime(raw) {
  if (!raw) return 'Tomorrow @ 05:00 AM';
  const str = String(raw).trim();
  if (/@\s*\d{1,2}:\d{2}\s*(?:AM|PM)/i.test(str)) {
    return str;
  }
  const clean = formatCleanDateTime(str);
  if (clean && clean.includes(',')) {
    return clean.replace(',', ' @');
  }
  return clean || str;
}

/**
 * Clean up location names by removing redundant administrative suffixes
 * e.g. "Chennai, Tamil Nadu, India" -> "Chennai"
 *      "Pallavaram  Chennai" -> "Pallavaram, Chennai"
 */
export function cleanLocationName(location) {
  if (!location) return '';
  let str = String(location)
    .replace(/,\s*Tamil Nadu,\s*India/gi, '')
    .replace(/,\s*Tamil Nadu/gi, '')
    .replace(/,\s*Andhra Pradesh,\s*India/gi, '')
    .replace(/,\s*Andhra Pradesh/gi, '')
    .replace(/,\s*Karnataka,\s*India/gi, '')
    .replace(/,\s*Karnataka/gi, '')
    .replace(/,\s*Kerala,\s*India/gi, '')
    .replace(/,\s*Kerala/gi, '')
    .replace(/,\s*Pondicherry,\s*India/gi, '')
    .replace(/,\s*India\b/gi, '')
    .replace(/\s+India\b/gi, '')
    .replace(/\s+Tamil Nadu\b/gi, '')
    .replace(/\s+Andhra Pradesh\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // If location has "Pallavaram Chennai", convert to "Pallavaram, Chennai"
  if (/^[A-Za-z]+\s+(Chennai|Bangalore|Coimbatore|Madurai|Trichy)$/i.test(str)) {
    str = str.replace(/\s+/, ', ');
  }
  return str;
}

/**
 * Robust parser for metadata in JSON, semicolon-delimited, or comma-delimited strings
 */
export function parseMetadata(metadata) {
  if (!metadata || metadata === 'None' || metadata === 'null' || metadata === '{}') {
    return {};
  }
  if (typeof metadata === 'object') {
    return metadata;
  }
  const trimmed = String(metadata).trim();

  // Try standard JSON.parse
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch (_) {}
  }

  // Parse key-value strings e.g. "{days:2;travelDate:2026-10-24T13:00}" or "days:2,travelDate:..."
  const cleanStr = trimmed.replace(/^\{/, '').replace(/\}$/, '').trim();
  const pairs = cleanStr.split(/[;,]/);
  const result = {};

  pairs.forEach(pair => {
    const idx = pair.indexOf(':');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim().replace(/^['"]|['"]$/g, '');
      let val = pair.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && val !== undefined && val !== '') {
        if (val === 'true') result[key] = true;
        else if (val === 'false') result[key] = false;
        else if (!isNaN(Number(val)) && val !== '') result[key] = Number(val);
        else result[key] = val;
      }
    }
  });

  return result;
}

/**
 * Formats metadata into human-readable chips with AM/PM time and clear badges.
 * Never outputs raw JSON or unparsed key-value dumps.
 */
export function getMetadataBadges(metadata) {
  const p = parseMetadata(metadata);
  const badges = [];

  // Travel Date / Schedule in clean AM/PM format
  if (p.travelDate) {
    badges.push(`📅 Travel: ${formatCleanDateTime(p.travelDate, { hideYear: true })}`);
  }

  // Vehicle Transmission
  if (p.gear) {
    const gearStr = String(p.gear).toLowerCase();
    badges.push(gearStr === 'manual' ? '🕹️ Manual Gear' : '🕹️ Auto Gear');
  }

  // Duration / Days
  if (p.days && p.nights) {
    badges.push(`⏳ ${p.days} Days / ${p.nights} Nights`);
  } else if (p.days && p.days > 1) {
    badges.push(`⏳ ${p.days} Days`);
  }

  // Local Package
  if (p.localPackage) {
    const pkg = String(p.localPackage).replace(/hr/i, ' Hrs / ').replace(/km/i, ' Km');
    badges.push(`⏱️ ${pkg}`);
  }

  // Trip Specs
  if (p.chargeableKm) badges.push(`📏 ${p.chargeableKm} km`);
  if (p.ratePerKm) badges.push(`🏷️ ₹${p.ratePerKm}/km`);
  if (p.driverBata || p.driverBeta) badges.push(`☕ Driver Bata ₹${p.driverBata || p.driverBeta}`);

  // Direction / Type
  if (p.direction === 'pickup') badges.push(`🛬 Airport Arrival`);
  if (p.direction === 'drop') badges.push(`🛫 Airport Departure`);
  if (p.isOutstation) badges.push(`🛣️ Outstation`);
  if (p.duration) badges.push(`⏱️ ${p.duration}`);
  if (p.flightDetails) badges.push(`✈️ ${p.flightDetails}`);

  // Driver Allowances / Boarding
  if (p.stayProvided === true) badges.push(`🏨 Guest Provides Stay`);
  if (p.foodProvided === true) badges.push(`🍱 Guest Provides Food`);
  if (p.foodAllowance) badges.push(`🍱 Food ₹${p.foodAllowance}`);
  if (p.returnBusFare) badges.push(`🚌 Return Bus ₹${p.returnBusFare}`);

  return badges;
}

/**
 * Cleans calculator engine name into a clear, user-friendly title
 */
export function cleanEngineName(engine, sourcePage) {
  const eng = String(engine || '').trim();
  const src = String(sourcePage || '').trim().toLowerCase();

  if (eng && eng !== '/' && eng !== 'Booking Engine' && eng !== 'Fare Calculator' && eng !== 'None') {
    return eng;
  }

  if (src.includes('acting-driver')) return 'Acting Driver Calculator';
  if (src.includes('airport')) return 'Airport Taxi Engine';
  if (src.includes('outstation')) return 'Outstation Cab Engine';
  if (src.includes('local') || src.includes('hourly') || src.includes('rental')) return 'Hourly Rental Package';
  if (src.includes('tour') || src.includes('package')) return 'Tour Packages';
  if (src.includes('calculator')) return 'Fare Calculator';
  if (src === '/' || !src) return 'Outstation Cab Estimator';

  return 'Website Estimator';
}

/**
 * Clean up sourcePage into a readable "via ..." badge
 */
export function cleanSourcePage(sourcePage) {
  const src = String(sourcePage || '').trim();
  if (!src || src === '/' || src === 'None') return 'via Homepage';

  const clean = src.replace(/^\/|\/$/g, '');
  if (!clean) return 'via Homepage';

  const lastPart = clean.split('/').pop() || clean;
  // Format slug e.g. "acting-drivers" -> "Acting Drivers"
  const formatted = lastPart
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return `via ${formatted}`;
}
