/**
 * sequenceGenerator.js
 * Centralized sequential numbering engine for Kalidass Travels.
 *
 * Strict Rules:
 * - Quotations start from 101 in continuous order: #QT-101, #QT-102, #QT-103...
 * - Enquiries start from 101 in continuous order:   #ENQ-101, #ENQ-102, #ENQ-103...
 * - Website Calculations start from 101 in continuous order: #QT-101, #QT-102...
 * - Confirmed Bookings start from 101 in continuous order: #KT-BK-101, #KT-BK-102...
 * - NEVER generate random numbers.
 */

export const START_SEQ = 101;

export const STORAGE_KEYS = {
  QUOTATION: 'kt_last_quotation_seq',
  ENQUIRY: 'kt_last_enquiry_seq',
  BOOKING: 'kt_last_booking_seq',
  CALCULATION: 'kt_last_calculation_seq'
};

/**
 * Extract integer sequence number from string (e.g. #QT-101, #ENQ-101, #KT-BK-101, #KT-OUT-101, #CALC-101, CT/EST/1026/101).
 * Filters out legacy random numbers (e.g. > maxThreshold).
 */
export function extractSequenceNumber(idStr, maxThreshold = 9999) {
  if (!idStr || typeof idStr !== 'string') return null;
  const clean = idStr.trim();
  // Match prefix-based formats first
  const match = clean.match(/(?:QT|ENQ|KT|CALC|CALL|WA|BK|CAB|MAA|OUT|TPT|PDY|TMP|ACT|EST)[-_/A-Za-z0-9]*[-_](\d+)(?:[^\d]|$)/i) ||
                clean.match(/(\d{3,})(?:[^\d]|$)/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (isNaN(num)) return null;
  if (num >= START_SEQ && num <= maxThreshold) {
    return num;
  }
  return null;
}

/**
 * Checks if an ID is in valid sequential order (>= 101)
 */
export function isSequentialId(idStr, maxThreshold = 9999) {
  return extractSequenceNumber(idStr, maxThreshold) !== null;
}

/**
 * Gets the highest sequence number from a list of items
 */
function getMaxFromList(list, prefixPattern, maxThreshold) {
  if (!Array.isArray(list) || list.length === 0) return 0;
  let max = 0;
  for (const item of list) {
    const rawId = item?.quoteId || item?.quoteRefId || item?.bookingId || (typeof item === 'string' ? item : '');
    if (!rawId) continue;
    if (prefixPattern && !prefixPattern.test(rawId)) continue;
    const num = extractSequenceNumber(rawId, maxThreshold);
    if (num && num > max) {
      max = num;
    }
  }
  return max;
}

/**
 * Low-level continuous sequence getter from localStorage
 */
export function getNextContinuousSeq(storageKey = STORAGE_KEYS.QUOTATION, startSeq = START_SEQ) {
  let stored = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      stored = parseInt(localStorage.getItem(storageKey) || '0', 10);
    } catch (_) {}
  }
  const base = Math.max(startSeq - 1, stored);
  const next = base + 1;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(storageKey, String(next));
    } catch (_) {}
  }
  return next;
}

/**
 * Low-level continuous sequence peeker from localStorage
 */
export function peekContinuousSeq(storageKey = STORAGE_KEYS.QUOTATION, startSeq = START_SEQ) {
  let stored = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      stored = parseInt(localStorage.getItem(storageKey) || '0', 10);
    } catch (_) {}
  }
  const base = Math.max(startSeq - 1, stored);
  return base + 1;
}

/**
 * Generate next Quotation Number (#QT-101, #QT-102, #QT-103...)
 * Strictly continuous sequence starting from 101.
 */
export function getNextQuotationId(existingQuotes = [], prefix = '#QT-') {
  let stored = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      stored = parseInt(localStorage.getItem(STORAGE_KEYS.QUOTATION) || '0', 10);
    } catch (_) {}
  }

  // Threshold: dynamically caps acceptable sequential numbers so past random numbers are ignored
  const threshold = (START_SEQ - 1) + Math.max(existingQuotes.length + 50, 100);
  const maxFromList = getMaxFromList(existingQuotes, /#?(QT|CALC|KT)/i, threshold);

  const base = Math.max(START_SEQ - 1, stored, maxFromList);
  const nextNum = base + 1;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEYS.QUOTATION, String(nextNum));
    } catch (_) {}
  }

  return `${prefix}${nextNum}`;
}

/**
 * Preview next Quotation Number without incrementing storage
 */
export function peekNextQuotationId(existingQuotes = [], prefix = '#QT-') {
  let stored = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      stored = parseInt(localStorage.getItem(STORAGE_KEYS.QUOTATION) || '0', 10);
    } catch (_) {}
  }
  const threshold = (START_SEQ - 1) + Math.max(existingQuotes.length + 50, 100);
  const maxFromList = getMaxFromList(existingQuotes, /#?(QT|CALC|KT)/i, threshold);
  const base = Math.max(START_SEQ - 1, stored, maxFromList);
  return `${prefix}${base + 1}`;
}

/**
 * Generate next Enquiry Number (#ENQ-101, #ENQ-102, #ENQ-103...)
 * Strictly continuous sequence starting from 101.
 */
export function getNextEnquiryId(existingLeads = [], prefix = '#ENQ-') {
  let stored = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      stored = parseInt(localStorage.getItem(STORAGE_KEYS.ENQUIRY) || '0', 10);
    } catch (_) {}
  }

  const threshold = (START_SEQ - 1) + Math.max(existingLeads.length + 50, 100);
  const maxFromList = getMaxFromList(existingLeads, /#?(ENQ|KT|CALL|WA)/i, threshold);

  const base = Math.max(START_SEQ - 1, stored, maxFromList);
  const nextNum = base + 1;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEYS.ENQUIRY, String(nextNum));
    } catch (_) {}
  }

  return `${prefix}${nextNum}`;
}

/**
 * Preview next Enquiry Number without incrementing storage
 */
export function peekNextEnquiryId(existingLeads = [], prefix = '#ENQ-') {
  let stored = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      stored = parseInt(localStorage.getItem(STORAGE_KEYS.ENQUIRY) || '0', 10);
    } catch (_) {}
  }
  const threshold = (START_SEQ - 1) + Math.max(existingLeads.length + 50, 100);
  const maxFromList = getMaxFromList(existingLeads, /#?(ENQ|KT|CALL|WA)/i, threshold);
  const base = Math.max(START_SEQ - 1, stored, maxFromList);
  return `${prefix}${base + 1}`;
}

/**
 * Generate next Confirmed Booking ID (#KT-BK-101, #KT-BK-102...)
 * Strictly continuous sequence starting from 101.
 */
export function getNextBookingId(existingBookings = [], prefix = '#KT-BK-') {
  let stored = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      stored = parseInt(localStorage.getItem(STORAGE_KEYS.BOOKING) || '0', 10);
    } catch (_) {}
  }

  const threshold = (START_SEQ - 1) + Math.max(existingBookings.length + 50, 100);
  const maxFromList = getMaxFromList(existingBookings, /#?(KT|BK|CAB)/i, threshold);

  const base = Math.max(START_SEQ - 1, stored, maxFromList);
  const nextNum = base + 1;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKING, String(nextNum));
    } catch (_) {}
  }

  return `${prefix}${nextNum}`;
}

/**
 * Preview next Booking ID without incrementing storage
 */
export function peekNextBookingId(existingBookings = [], prefix = '#KT-BK-') {
  let stored = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      stored = parseInt(localStorage.getItem(STORAGE_KEYS.BOOKING) || '0', 10);
    } catch (_) {}
  }
  const threshold = (START_SEQ - 1) + Math.max(existingBookings.length + 50, 100);
  const maxFromList = getMaxFromList(existingBookings, /#?(KT|BK|CAB)/i, threshold);
  const base = Math.max(START_SEQ - 1, stored, maxFromList);
  return `${prefix}${base + 1}`;
}

/**
 * Resolves a clean continuous sequential display ID for an enquiry item.
 * If lead has a valid sequential ID (>= 101 and <= reasonable threshold), uses it.
 * Otherwise falls back to in-order calculation starting from 101.
 */
export function getOrderedEnquiryId(lead, idx = 0, totalCount = 0) {
  if (lead && lead.quoteId) {
    const threshold = (START_SEQ - 1) + Math.max(totalCount + 50, 100);
    const seq = extractSequenceNumber(lead.quoteId, threshold);
    if (seq !== null && seq >= START_SEQ) {
      return lead.quoteId.startsWith('#') ? lead.quoteId : `#${lead.quoteId}`;
    }
  }

  // Fallback: calculate strictly in order starting from 101
  if (totalCount > 0) {
    const orderNum = START_SEQ + (totalCount - 1 - idx);
    return `#ENQ-${orderNum}`;
  }

  return `#ENQ-${START_SEQ + idx}`;
}
