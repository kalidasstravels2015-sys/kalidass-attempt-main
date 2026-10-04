/**
 * Central WhatsApp configuration and URL generator for Kalidass Travels.
 * Serves as the single source of truth across all Astro pages and React components.
 */

export const WHATSAPP_CONFIG = {
  /** Primary dispatch desk phone number (digits only with country code) */
  phone: '918939539211',
  /** Formatted phone number for human-readable UI display */
  formattedPhone: '+91 89395 39211',
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
