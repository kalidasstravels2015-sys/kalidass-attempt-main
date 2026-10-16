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
