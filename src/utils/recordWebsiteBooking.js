// Centralized Website Booking Utility
// Automatic syncing of website WhatsApp quotations into the Live Dispatch Google Sheet is disabled.
// Operators paste confirmed WhatsApp quotations manually via Admin -> New Booking.

export const DEFAULT_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzyfKwbaG83dNG3EAWf719-UWbWxWpEoBQoRoRbJsHjD-Bx8uKUfytP5Eb2RXaJfgDz/exec';

export function getActiveSheetUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const custom = localStorage.getItem('kt_admin_google_sheet_webhook_v1');
    if (custom && custom.startsWith('https://script.google.com/') && !custom.includes('AKfycbzjPh0a2ju')) {
      return custom;
    }
  }
  return DEFAULT_SHEET_WEBHOOK_URL;
}

export async function logBookingToGoogleSheet() {
  // Intentionally disabled: website quotation clicks must not auto-populate Live Dispatch.
  return { skipped: true, reason: 'Manual booking entry via Admin -> New Booking is enabled.' };
}
