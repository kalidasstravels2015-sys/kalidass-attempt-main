/**
 * Booking Contact Validator
 * Validates Customer Name and 10-digit Indian Mobile Number cleanly
 * without blocking fast phone/WhatsApp bookings when a customer's name is not yet known.
 */

const PLACEHOLDER_NAMES = [
  'website caller',
  'website visitor',
  'phone caller',
  'customer',
  'guest',
  'visitor',
  'unassigned',
  'lead',
  'enquiry',
  'unknown'
];

/**
 * Validates 10-digit Indian mobile number
 * Starting with 6, 7, 8, or 9 and not a dummy fallback.
 */
export function isValidIndianMobile(phone) {
  if (!phone) return false;
  const digits = String(phone).replace(/[^0-9]/g, '').slice(-10);
  if (digits.length !== 10) return false;
  if (!/^[6-9]\d{9}$/.test(digits)) return false;
  if (digits === '9840100000' || digits === '9999999999' || digits === '9000000000') return false;
  return true;
}

/**
 * Extracts 10-digit clean mobile number from any text/object
 */
export function extractValidMobile(textOrItem) {
  if (!textOrItem) return '';
  let str = '';
  if (typeof textOrItem === 'string') {
    str = textOrItem;
  } else if (typeof textOrItem === 'object') {
    str = `${textOrItem.phone || ''} ${textOrItem.guestNamePhone || ''} ${textOrItem.sourcePage || ''} ${textOrItem.pickup || ''} ${textOrItem.guestName || ''} ${textOrItem.metadata || ''}`;
  }
  const match = str.match(/[6-9]\d{9}/);
  if (match && isValidIndianMobile(match[0])) {
    return match[0];
  }
  return '';
}

/**
 * Checks if a name is a generic placeholder rather than a specific customer name
 */
export function isPlaceholderCustomerName(name) {
  if (!name) return true;
  const clean = String(name).trim().toLowerCase();
  if (clean.length < 2) return true;
  return PLACEHOLDER_NAMES.some(placeholder =>
    clean === placeholder || clean.startsWith(`${placeholder} (`) || clean.startsWith(`${placeholder} #`)
  );
}

/**
 * Validates customer contact details.
 * If a valid 10-digit mobile number is provided, a missing/placeholder name
 * automatically defaults to "Customer" so WhatsApp/Phone orders are never blocked.
 */
export function validateCustomerContact(name, phone) {
  const rawName = String(name || '').trim();
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '').slice(-10);

  const hasValidPhone = isValidIndianMobile(cleanPhone);
  const hasRealName = rawName.length >= 2 && !isPlaceholderCustomerName(rawName);

  // If valid phone is present, allow booking even if name wasn't provided yet (common on WhatsApp)
  const effectiveName = hasRealName ? rawName : (hasValidPhone ? (rawName || 'Customer') : '');
  const isValid = hasValidPhone;

  let error = '';
  if (!hasValidPhone) {
    error = 'Please enter a valid 10-digit Mobile Number (starting with 6, 7, 8, or 9).';
  }

  return {
    isValid,
    hasValidName: Boolean(effectiveName),
    hasValidPhone,
    cleanName: effectiveName,
    cleanPhone: hasValidPhone ? cleanPhone : '',
    formattedGuestNamePhone: isValid ? `${effectiveName} (+91 ${cleanPhone})` : (effectiveName || cleanPhone),
    error
  };
}

/**
 * Parses and validates a combined guestNamePhone string such as:
 * - "Ramesh Kumar (+91 9840123456)" -> valid
 * - "Customer (+91 9944649858)" -> valid
 * - "+91 99446 49858" -> valid
 */
export function parseAndValidateContact(guestNamePhone, fallbackPhone = '') {
  const str = String(guestNamePhone || '').trim();
  const phone = extractValidMobile(`${str} ${fallbackPhone}`);

  let rawName = str.split('(')[0].split('+91')[0].replace(/[#\d]/g, '').trim();
  if (!rawName && str.includes('(')) {
    rawName = str.split('(')[0].trim();
  }

  return validateCustomerContact(rawName, phone);
}

/**
 * Checks if a lead or inquiry is actionable:
 * Shows all manual/phone/WhatsApp enquiries (even if fare is 0/TBD)
 * while filtering out anonymous website zero-click logs.
 */
export function isActionableLead(lead) {
  if (!lead) return false;
  if (lead.status === 'Cancelled' || lead.status === 'Deleted') return false;
  if ((lead.drop || '').toLowerCase().includes('whatsapp chat')) return false;

  const id = String(lead.quoteId || '').toUpperCase();
  const isManualEnquiry = id.startsWith('#ENQ') || id.startsWith('#CALL') || id.startsWith('#WA');
  const phone = extractValidMobile(lead);
  const hasRealName = lead.guestName && !isPlaceholderCustomerName(lead.guestName);

  if (isManualEnquiry || phone || hasRealName) {
    return true;
  }

  const fare = Number(lead.estimatedFare || lead.fare || 0);
  return fare > 0 && Boolean(phone || hasRealName);
}

/**
 * Deduplicates and filters website calculator quotes:
 * Removes zero-fare quotes, dummy chats, and merges repeat calculations for identical routes.
 */
export function deduplicateCalculatorQuotes(quotes = []) {
  const map = new Map();
  (quotes || []).forEach(q => {
    if (!q) return;
    const fare = Number(q.estimatedFare || q.fare || q.estimate || 0);
    if (fare <= 0) return;
    if ((q.drop || '').toLowerCase().includes('whatsapp chat')) return;
    const idKey = (q.quoteId || '').trim();
    const dedupKey = idKey || `${q.pickup}_${q.drop}_${fare}_${q.vehicle}`;
    if (!map.has(dedupKey)) {
      map.set(dedupKey, q);
    } else {
      const existing = map.get(dedupKey);
      if ((q.status || '').toLowerCase().includes('whatsapp')) {
        map.set(dedupKey, { ...existing, ...q });
      }
    }
  });
  return Array.from(map.values());
}
