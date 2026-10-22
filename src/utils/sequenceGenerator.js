/**
 * sequenceGenerator.js
 * Centralized sequential numbering engine for Kalidass Travels.
 *
 * Rules:
 * - Quotation Numbers start from 101 in order: #QT-101, #QT-102, #QT-103...
 * - Enquiry Numbers start from 101 in order:   #ENQ-101, #ENQ-102, #ENQ-103...
 */

const START_SEQ = 101;
const STORAGE_KEYS = {
  QUOTATION: 'kt_last_quotation_seq',
  ENQUIRY: 'kt_last_enquiry_seq'
};

/**
 * Extract integer sequence number if string matches #QT-101, #ENQ-101, #KT-101, etc.
 * Ignores random 4-digit timestamps (e.g. > 9999 or random numbers when total is small).
 */
export function extractSequenceNumber(idStr, maxThreshold = 9999) {
  if (!idStr || typeof idStr !== 'string') return null;
  const match = idStr.match(/(?:QT|ENQ|KT|CALL|WA)-?(\d+)/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (isNaN(num)) return null;
  if (num >= START_SEQ && num <= maxThreshold) {
    return num;
  }
  return null;
}

/**
 * Checks if an ID is already in sequential order starting from 101
 */
export function isSequentialId(idStr) {
  return extractSequenceNumber(idStr) !== null;
}

/**
 * Gets the highest sequence number from a list of objects containing quoteId or bookingId
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
 * Generate next Quotation Number (#QT-101, #QT-102, #QT-103...)
 */
export function getNextQuotationId(existingQuotes = []) {
  let stored = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    stored = parseInt(localStorage.getItem(STORAGE_KEYS.QUOTATION) || '0', 10);
  }

  // Threshold: only accept numbers that could reasonably be part of the current sequence
  const threshold = Math.max(500, existingQuotes.length + 200);
  const maxFromList = getMaxFromList(existingQuotes, /#?QT/i, threshold);

  const base = Math.max(START_SEQ - 1, stored, maxFromList);
  const nextNum = base + 1;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEYS.QUOTATION, String(nextNum));
    } catch (_) {}
  }

  return `#QT-${nextNum}`;
}

/**
 * Preview next Quotation Number without incrementing storage
 */
export function peekNextQuotationId(existingQuotes = []) {
  let stored = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    stored = parseInt(localStorage.getItem(STORAGE_KEYS.QUOTATION) || '0', 10);
  }
  const threshold = Math.max(500, existingQuotes.length + 200);
  const maxFromList = getMaxFromList(existingQuotes, /#?QT/i, threshold);
  const base = Math.max(START_SEQ - 1, stored, maxFromList);
  return `#QT-${base + 1}`;
}

/**
 * Generate next Enquiry Number (#ENQ-101, #ENQ-102, #ENQ-103...)
 */
export function getNextEnquiryId(existingLeads = []) {
  let stored = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    stored = parseInt(localStorage.getItem(STORAGE_KEYS.ENQUIRY) || '0', 10);
  }

  const threshold = Math.max(500, existingLeads.length + 200);
  const maxFromList = getMaxFromList(existingLeads, /#?(ENQ|QT|KT)/i, threshold);

  const base = Math.max(START_SEQ - 1, stored, maxFromList);
  const nextNum = base + 1;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEYS.ENQUIRY, String(nextNum));
    } catch (_) {}
  }

  return `#ENQ-${nextNum}`;
}

/**
 * Preview next Enquiry Number without incrementing storage
 */
export function peekNextEnquiryId(existingLeads = []) {
  let stored = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    stored = parseInt(localStorage.getItem(STORAGE_KEYS.ENQUIRY) || '0', 10);
  }
  const threshold = Math.max(500, existingLeads.length + 200);
  const maxFromList = getMaxFromList(existingLeads, /#?(ENQ|QT|KT)/i, threshold);
  const base = Math.max(START_SEQ - 1, stored, maxFromList);
  return `#ENQ-${base + 1}`;
}

/**
 * Resolves a clean sequential display ID for an enquiry item.
 * If lead has a valid sequential ID (>= 101), uses it.
 * Otherwise falls back to in-order calculation starting from 101.
 */
export function getOrderedEnquiryId(lead, idx = 0, totalCount = 0) {
  if (lead && lead.quoteId) {
    const seq = extractSequenceNumber(lead.quoteId, 5000);
    if (seq !== null && seq >= START_SEQ) {
      // Return preserved sequential ID
      return lead.quoteId.startsWith('#') ? lead.quoteId : `#${lead.quoteId}`;
    }
  }

  // Fallback: calculate in order starting from 101
  // If list is newest-first (idx 0 is newest), the oldest item is 101
  if (totalCount > 0) {
    const orderNum = START_SEQ + (totalCount - 1 - idx);
    return `#ENQ-${orderNum}`;
  }

  return `#ENQ-${START_SEQ + idx}`;
}
