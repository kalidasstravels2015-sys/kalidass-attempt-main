/**
 * Booking Contact Validator
 * Enforces strict validation that Customer Name and a valid 10-digit Indian Mobile Number
 * are present before any enquiry/quote can be moved into Active Trips.
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
  // Disallow known dummy numbers used as testing placeholders
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
 * Checks if a name is a placeholder rather than a real customer name
 */
export function isPlaceholderCustomerName(name) {
  if (!name) return true;
  const clean = String(name).trim().toLowerCase();
  if (clean.length < 2) return true;
  return PLACEHOLDER_NAMES.some(placeholder => 
    clean === placeholder || clean.startsWith(placeholder) || clean.startsWith(`${placeholder} (`)
  );
}

/**
 * Validates customer contact details
 */
export function validateCustomerContact(name, phone) {
  const cleanName = String(name || '').trim();
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '').slice(-10);

  const hasValidName = cleanName.length >= 2 && !isPlaceholderCustomerName(cleanName);
  const hasValidPhone = isValidIndianMobile(cleanPhone);

  let error = '';
  if (!hasValidName && !hasValidPhone) {
    error = 'Please enter Customer Name and a valid 10-digit Mobile Number.';
  } else if (!hasValidName) {
    error = 'Please enter a valid Customer Name (e.g. Ramesh Kumar).';
  } else if (!hasValidPhone) {
    error = 'Please enter a valid 10-digit Mobile Number starting with 6, 7, 8, or 9.';
  }

  return {
    isValid: hasValidName && hasValidPhone,
    hasValidName,
    hasValidPhone,
    cleanName: hasValidName ? cleanName : '',
    cleanPhone: hasValidPhone ? cleanPhone : '',
    formattedGuestNamePhone: hasValidName && hasValidPhone ? `${cleanName} (+91 ${cleanPhone})` : '',
    error
  };
}

/**
 * Parses and validates a combined guestNamePhone string such as:
 * - "Ramesh Kumar (+91 9840123456)" -> valid
 * - "Website Caller (#KT-4001)" -> invalid (no phone, placeholder name)
 * - "Customer (+91 9840100000)" -> invalid (dummy phone, placeholder name)
 */
export function parseAndValidateContact(guestNamePhone, fallbackPhone = '') {
  const str = String(guestNamePhone || '').trim();
  const phone = extractValidMobile(`${str} ${fallbackPhone}`);
  
  // Extract name portion before (+91 or (
  let rawName = str.split('(')[0].split('+91')[0].replace(/[#\d]/g, '').trim();
  if (!rawName && str.includes('(')) {
    rawName = str.split('(')[0].trim();
  }

  return validateCustomerContact(rawName, phone);
}
