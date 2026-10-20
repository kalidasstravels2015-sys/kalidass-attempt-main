/**
 * Centralized Google Sheet Webhook Sync Manager
 * Reads configured Google Apps Script Web App URL from localStorage or environment variables.
 */

export const STORAGE_KEY_WEBHOOK_URL = 'kt_google_sheet_webhook_url';

export function getActiveGoogleSheetUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_WEBHOOK_URL);
      if (stored && stored.trim().startsWith('http')) {
        return stored.trim();
      }
    } catch (_) {}
  }

  // Fallback to environment variable if configured
  if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL) {
    return import.meta.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL;
  }

  if (typeof process !== 'undefined' && process.env?.GOOGLE_SHEET_WEBHOOK_URL) {
    return process.env.GOOGLE_SHEET_WEBHOOK_URL;
  }

  return '';
}

export function saveActiveGoogleSheetUrl(url) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (url && url.trim()) {
        window.localStorage.setItem(STORAGE_KEY_WEBHOOK_URL, url.trim());
      } else {
        window.localStorage.removeItem(STORAGE_KEY_WEBHOOK_URL);
      }
    } catch (_) {}
  }
}
