/**
 * Centralized Google Sheet Webhook Sync Manager
 * Reads configured Google Apps Script Web App URL from localStorage or environment variables.
 */

export const STORAGE_KEY_WEBHOOK_URL = 'kt_google_sheet_webhook_url';
export const DEFAULT_GOOGLE_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzpTM1pLXWLF-E80-HAXjj2ghAC_0tvFW1blTJC7rJojqUhTcKIwQz0t-NQMCScN2VA/exec';
export const DRIVER_LEADS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzjPh0a2ju-Xv9KRFQ5gCg9s5Y4P8QR9C2rkO4nh4XYBBO5QD-tbKIXWcDav2ydgaUW/exec';

function sanitizeTripsWebhookUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed.startsWith('http')) return '';
  // Guard against Driver Leads sheet URL accidentally stored as Trips webhook URL
  if (trimmed.includes('AKfycbzjPh0a2ju')) {
    return DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
  }
  return trimmed;
}

let memoryWebhookUrl = DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;

export function getActiveGoogleSheetUrl() {
  if (memoryWebhookUrl && memoryWebhookUrl.startsWith('http')) {
    return sanitizeTripsWebhookUrl(memoryWebhookUrl) || DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = sanitizeTripsWebhookUrl(window.localStorage.getItem(STORAGE_KEY_WEBHOOK_URL));
      if (stored) {
        memoryWebhookUrl = stored;
        return memoryWebhookUrl;
      }
    } catch (_) {}
  }

  // Fallback to environment variables if configured
  if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL) {
    const envUrl = sanitizeTripsWebhookUrl(import.meta.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL);
    if (envUrl) {
      memoryWebhookUrl = envUrl;
      return memoryWebhookUrl;
    }
  }

  if (typeof process !== 'undefined') {
    const envUrl = sanitizeTripsWebhookUrl(process.env?.GOOGLE_SHEET_WEBHOOK_URL || process.env?.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL);
    if (envUrl) {
      memoryWebhookUrl = envUrl;
      return memoryWebhookUrl;
    }
  }

  return DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
}

export function saveActiveGoogleSheetUrl(url) {
  const clean = (url || '').trim();
  memoryWebhookUrl = clean;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (clean) {
        window.localStorage.setItem(STORAGE_KEY_WEBHOOK_URL, clean);
      } else {
        window.localStorage.removeItem(STORAGE_KEY_WEBHOOK_URL);
      }
    } catch (_) {}
  }

  // Persist to server config endpoint asynchronously
  try {
    fetch('/api/admin/sheet-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: clean })
    }).catch(() => {});
  } catch (_) {}
}

export async function fetchRemoteGoogleSheetUrl() {
  try {
    const res = await fetch('/api/admin/sheet-config');
    if (res.ok) {
      const data = await res.json();
      if (data && data.webhookUrl && data.webhookUrl.startsWith('http')) {
        memoryWebhookUrl = data.webhookUrl.trim();
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY_WEBHOOK_URL, memoryWebhookUrl);
        }
        return memoryWebhookUrl;
      }
    }
  } catch (_) {}
  return getActiveGoogleSheetUrl();
}
