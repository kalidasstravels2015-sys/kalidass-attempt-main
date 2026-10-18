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
