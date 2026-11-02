/**
 * Central WhatsApp configuration and URL generator for Kalidass Travels.
 * Serves as the single source of truth across all Astro pages and React components.
 */

export const WHATSAPP_CONFIG = {
  /** Primary dispatch desk phone number (digits only with country code) */
  phone: '918939539211',
  /** Formatted phone number for human-readable UI display */
  formattedPhone: '+91 89395 39211',
  /** Additional contact numbers */
  additionalPhones: [
    { phone: '916381939769', formattedPhone: '+91 63819 39769', raw: '6381939769', label: 'Helpline 2' },
    { phone: '919092303060', formattedPhone: '+91 90923 03060', raw: '9092303060', label: 'Helpline 3' },
  ],
  /** Complete list of official contact numbers */
  allPhones: [
    { phone: '918939539211', formattedPhone: '+91 89395 39211', raw: '8939539211', label: 'Primary 24/7 Helpline' },
    { phone: '916381939769', formattedPhone: '+91 63819 39769', raw: '6381939769', label: 'Helpline 2' },
    { phone: '919092303060', formattedPhone: '+91 90923 03060', raw: '9092303060', label: 'Helpline 3' },
  ],
  /** Default fallback greeting message */
  defaultGreeting: 'Hi Kalidass Travels, I would like to enquire about a cab booking.',
} as const;

/**
 * Strips non-digit characters from a phone number string.
 */
export function cleanWhatsAppNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Builds a standardized, properly encoded WhatsApp URL.
 *
 * @param message - Custom message text to pre-fill in the WhatsApp chat.
 * @param customPhone - Optional phone number override (digits or formatted). Defaults to WHATSAPP_CONFIG.phone.
 * @returns Fully formatted WhatsApp click-to-chat URL (e.g., https://wa.me/918939539211?text=...)
 */
export function buildWhatsAppUrl(message?: string, customPhone?: string): string {
  const phone = customPhone ? cleanWhatsAppNumber(customPhone) : WHATSAPP_CONFIG.phone;
  const text = message && message.trim().length > 0 ? message.trim() : WHATSAPP_CONFIG.defaultGreeting;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Builds Google Maps deep-links for pickup pin and route directions.
 * All links are free — no API key required.
 *
 * @param pickup   - Pickup address string (plain text)
 * @param drop     - Drop address string (optional; omit for local / no-drop trips)
 * @param tripType - 'oneway' | 'round' | 'roundtrip' | 'local' | any string
 * @returns Object with pickupPin and directions URL strings (empty string if unavailable)
 */
export function buildMapsLinks(
  pickup: string,
  drop?: string,
  tripType: string = 'oneway'
): { pickupPin: string; directions: string } {
  const cleanPickup = (pickup || '').trim();
  const cleanDrop   = (drop   || '').trim();
  const base        = 'https://www.google.com/maps';
  const isRound     = /round/i.test(tripType);

  const pickupPin = cleanPickup
    ? `${base}/search/?api=1&query=${encodeURIComponent(cleanPickup)}`
    : '';

  let directions = '';
  if (cleanPickup && cleanDrop) {
    if (isRound) {
      // Round Trip: Pickup → Drop → Pickup (waypoints keeps it a round loop)
      directions =
        `${base}/dir/?api=1` +
        `&origin=${encodeURIComponent(cleanPickup)}` +
        `&destination=${encodeURIComponent(cleanPickup)}` +
        `&waypoints=${encodeURIComponent(cleanDrop)}`;
    } else {
      // One-Way: Pickup → Drop
      directions =
        `${base}/dir/?api=1` +
        `&origin=${encodeURIComponent(cleanPickup)}` +
        `&destination=${encodeURIComponent(cleanDrop)}`;
    }
  } else if (cleanPickup) {
    // Local / no drop — navigate to pickup location from current position
    directions =
      `${base}/dir/?api=1` +
      `&origin=My+Location` +
      `&destination=${encodeURIComponent(cleanPickup)}`;
  }

  return { pickupPin, directions };
}

/**
 * Builds a formatted navigation block string for embedding in WhatsApp messages.
 * Returns an empty string if no valid links can be generated.
 */
export function buildMapsBlock(
  pickup: string,
  drop?: string,
  tripType: string = 'oneway'
): string {
  const { pickupPin, directions } = buildMapsLinks(pickup, drop, tripType);
  if (!pickupPin && !directions) return '';
  return (
    `\n\n🗺️ NAVIGATION LINKS:\n` +
    (pickupPin  ? `• 📍 Pickup Pin: ${pickupPin}\n`  : '') +
    (directions ? `• 🧭 Route Map: ${directions}`    : '')
  );
}

/**
 * Resolves a context-relevant, natural WhatsApp prefilled message based on the page pathname,
 * optional page title, and explicit custom override.
 */
export function getPageWhatsAppMessage(
  pathname: string = '',
  pageTitle?: string,
  customOverride?: string
): string {
  if (customOverride && customOverride.trim().length > 0) {
    return customOverride.trim();
  }

  // Normalize path (strip query/hash and trailing slashes for consistent matching)
  const path = (pathname || '')
    .split('?')[0]
    .split('#')[0]
    .toLowerCase()
    .replace(/\/+$/, '') || '/';

  // 1. Airport Taxi
  if (path.includes('airport')) {
    return 'Hi Kalidass Travels, I need a Chennai Airport Taxi pickup / drop. Please share fare quotation and cab availability.';
  }

  // 2. Tempo Traveller / Force Urbania
  if (path.includes('tempo-traveller') || path.includes('urbania')) {
    return 'Hi Kalidass Travels, I am looking to hire a Tempo Traveller / Force Urbania. Please share seating options, tariff, and availability.';
  }

  // 3. Outstation Cabs
  if (path.includes('outstation')) {
    return 'Hi Kalidass Travels, I am looking for an outstation cab from Chennai. Please share tariff and available vehicle options.';
  }

  // 4. Corporate Travel
  if (path.includes('corporate')) {
    return 'Hi Kalidass Travels, I would like to inquire about corporate travel and employee transport services.';
  }

  // 5. Acting Drivers
  if (path.includes('acting-driver')) {
    return 'Hi Kalidass Travels, I need a professional acting driver for my car in Chennai. Please share hourly/day rates and driver availability.';
  }

  // 6. Specific Temple & Pilgrimage Tours
  if (
    path.includes('temple-tour') ||
    path.includes('tirupati') ||
    path.includes('navagraha') ||
    path.includes('girivalam') ||
    path.includes('sabarimala') ||
    path.includes('rameswaram') ||
    path.includes('kumbakonam') ||
    path.includes('kanchipuram') ||
    path.includes('vellore') ||
    path.includes('chidambaram') ||
    path.includes('tiruchendur')
  ) {
    return 'Hi Kalidass Travels, I am interested in your South India temple tour packages. Please share itineraries, vehicle options, and pricing.';
  }

  // 7. Weekend & Holiday Packages
  if (
    path.includes('weekend') ||
    path.includes('pondicherry') ||
    path.includes('mahabalipuram') ||
    path.includes('yelagiri') ||
    path.includes('yercaud') ||
    path.includes('city-tour') ||
    path.includes('bangalore')
  ) {
    return 'Hi Kalidass Travels, I am planning a weekend getaway from Chennai. Please share available tour packages and cab quotes.';
  }

  // 8. Tours directory
  if (path.startsWith('/services/tours')) {
    return 'Hi Kalidass Travels, I am interested in exploring your tour packages and outstation holiday trips. Please share details.';
  }

  // 9. General Services hub or dynamic service slug
  if (path.startsWith('/services/')) {
    const slug = path.replace('/services/', '');
    if (slug) {
      const cleanSlug = slug.replace(/-/g, ' ');
      const formattedTitle = pageTitle
        ? pageTitle.replace(/\s*\|.*$/, '').replace(/\s*-.*$/, '').trim()
        : cleanSlug;
      return `Hi Kalidass Travels, I want to book the ${formattedTitle} package. Please share vehicle availability and quotation.`;
    }
    return 'Hi Kalidass Travels, I am exploring your cab services and tour packages. Please assist me with vehicle availability and rates.';
  }

  if (path === '/services') {
    return 'Hi Kalidass Travels, I am exploring your cab services and tour packages. Please assist me with vehicle availability and rates.';
  }

  // 10. Tariff & Fare Calculator
  if (path.includes('tariff')) {
    return 'Hi Kalidass Travels, I was reviewing your tariff chart on the website and would like a customized fare estimate for my travel.';
  }

  if (path.includes('calculator')) {
    return 'Hi Kalidass Travels, I calculated my trip estimate on your website calculator and would like to confirm cab availability and booking.';
  }

  // 11. Fleet
  if (path.includes('fleet')) {
    return 'Hi Kalidass Travels, I am looking to book a vehicle from your fleet. Please share available car models (Sedan / SUV / Tempo) and rates.';
  }

  // 12. Partner & Driver Join
  if (path.includes('attach-cab')) {
    return 'Hi Kalidass Travels, I want to attach my commercial vehicle with your fleet. Please share the partner onboarding process and daily duty details.';
  }

  if (path.includes('driver-join')) {
    return 'Hi Kalidass Travels, I am an experienced chauffeur and would like to join Kalidass Travels. Please share driver registration details.';
  }

  if (path.startsWith('/drivers/')) {
    const driverSlug = path.replace('/drivers/', '');
    if (driverSlug) {
      const formattedName = pageTitle
        ? pageTitle.replace(/\s*\|.*$/, '').replace(/\s*-.*$/, '').trim()
        : driverSlug.replace(/-/g, ' ');
      return `Hi Kalidass Travels, I would like to request chauffeur ${formattedName} for my upcoming travel.`;
    }
  }

  if (path === '/drivers') {
    return 'Hi Kalidass Travels, I would like to enquire about your verified chauffeur services for my trip.';
  }

  // 13. Homepage
  if (path === '/' || path === '') {
    return 'Hi Kalidass Travels, I need cab quotation and availability details.';
  }

  // Default fallback
  return WHATSAPP_CONFIG.defaultGreeting;
}
