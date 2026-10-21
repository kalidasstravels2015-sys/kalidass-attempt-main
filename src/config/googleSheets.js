/**
 * Centralized Google Sheet Webhook Sync Manager
 * Reads configured Google Apps Script Web App URL from localStorage or environment variables.
 */

export const STORAGE_KEY_WEBHOOK_URL = 'kt_google_sheet_webhook_url';

let memoryWebhookUrl = '';

export function getActiveGoogleSheetUrl() {
  if (memoryWebhookUrl && memoryWebhookUrl.startsWith('http')) {
    return memoryWebhookUrl;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_WEBHOOK_URL);
      if (stored && stored.trim().startsWith('http')) {
        memoryWebhookUrl = stored.trim();
        return memoryWebhookUrl;
      }
    } catch (_) {}
  }

  // Fallback to environment variables if configured
  if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL) {
    memoryWebhookUrl = import.meta.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL;
    return memoryWebhookUrl;
  }

  if (typeof process !== 'undefined') {
    const envUrl = process.env?.GOOGLE_SHEET_WEBHOOK_URL || process.env?.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL;
    if (envUrl && envUrl.startsWith('http')) {
      memoryWebhookUrl = envUrl;
      return memoryWebhookUrl;
    }
  }

  return '';
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
