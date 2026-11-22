// Shared Phonebook & Contact Directory Utilities for Kalidass Travels Admin
// Supports:
// 1. Native Android Chrome Contact Picker API (navigator.contacts.select)
// 2. Desktop / iOS vCard (.vcf / .vcard) & Google Contacts (.csv) import
// 3. Unified deduplicated search across Past Customers, Drivers Roster, and Imported Contacts

import { normalizePhoneNumber } from './adminBookingHelper.js';

export const IMPORTED_CONTACTS_STORAGE_KEY = 'kt_admin_imported_contacts_v1';

/**
 * Feature-detects the Web Contact Picker API (Android Chrome / Edge).
 */
export function isNativeContactPickerSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    'ContactsManager' in window &&
    typeof navigator.contacts?.select === 'function'
  );
}

/**
 * Opens the native Android phonebook picker and returns { name, phone } or null if cancelled.
 */
export async function pickNativePhonebookContact() {
  if (!isNativeContactPickerSupported()) {
    throw new Error('Native phonebook picker is not supported on this browser.');
  }
  const results = await navigator.contacts.select(['name', 'tel'], { multiple: false });
  if (!Array.isArray(results) || results.length === 0) return null;
  const chosen = results[0];
  const rawName = Array.isArray(chosen.name) ? chosen.name.find(Boolean) || '' : String(chosen.name || '');
  const rawTel = Array.isArray(chosen.tel) ? chosen.tel.find(Boolean) || '' : String(chosen.tel || '');
  return {
    name: rawName.trim(),
    phone: normalizePhoneNumber(rawTel)
  };
}

/**
 * Canonical phone key for deduplication (last 10 digits for Indian numbers, else all digits).
 */
export function getPhoneDedupeKey(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/**
 * Decodes simple quoted-printable UTF-8 strings found in some Android/Samsung .vcf exports.
 */
function decodeQuotedPrintable(str) {
  if (!str || !str.includes('=')) return str;
  try {
    const cleaned = str.replace(/=\r?\n/g, '');
    const bytes = [];
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(cleaned.slice(i + 1, i + 3))) {
        bytes.push(parseInt(cleaned.slice(i + 1, i + 3), 16));
        i += 2;
      } else {
        bytes.push(cleaned.charCodeAt(i));
      }
    }
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  } catch (_) {
    return str;
  }
}

/**
 * Parses vCard (.vcf / .vcard) text into an array of { name, phone, source: 'Phonebook' }.
 */
export function parseVCardContacts(vcfText) {
  const raw = String(vcfText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Unfold folded vCard lines (CRLF/LF followed by single space or tab)
  const unfolded = raw.replace(/\n[ \t]/g, '');
  const blocks = unfolded.split(/BEGIN:VCARD/i).slice(1);
  const contacts = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    let fn = '';
    let nFallback = '';
    const phones = [];

    for (const line of lines) {
      if (/^END:VCARD/i.test(line)) break;
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const keyPart = line.slice(0, colonIdx).trim();
      let valPart = line.slice(colonIdx + 1).trim();
      if (!valPart) continue;

      if (/QUOTED-PRINTABLE/i.test(keyPart)) {
        valPart = decodeQuotedPrintable(valPart);
      }
      const propName = keyPart.split(';')[0].replace(/^[^.]+\./, '').toUpperCase();

      if (propName === 'FN' && !fn) {
        fn = valPart.replace(/\\,/g, ',').replace(/\\;/g, ';').trim();
      } else if (propName === 'N' && !nFallback) {
        const parts = valPart.split(';').map(p => p.trim()).filter(Boolean);
        // N format: Last;First;Middle;Prefix;Suffix
        if (parts.length >= 2) {
          nFallback = `${parts[1]} ${parts[0]}`.trim();
        } else if (parts.length === 1) {
          nFallback = parts[0];
        }
      } else if (propName === 'TEL') {
        const normalized = normalizePhoneNumber(valPart.replace(/^tel:/i, ''));
        if (normalized && normalized.replace(/\D/g, '').length >= 7) {
          phones.push(normalized);
        }
      }
    }

    const name = fn || nFallback;
    if (phones.length > 0) {
      for (const phone of [...new Set(phones)]) {
        contacts.push({
          name: name || phone,
          phone,
          source: 'Phonebook'
        });
      }
    }
  }

  return deduplicateContacts(contacts);
}

/**
 * Lightweight RFC-4180 CSV line splitter supporting quoted fields.
 */
function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses Google Contacts CSV (or generic Name/Phone CSV) into { name, phone, source: 'Phonebook' }.
 */
export function parseGoogleContactsCsv(csvText) {
  const raw = String(csvText || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = raw.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase().trim());

  const nameIdx = headers.findIndex(h => h === 'name' || h === 'full name' || h === 'display name');
  const firstIdx = headers.findIndex(h => h === 'first name' || h === 'given name');
  const middleIdx = headers.findIndex(h => h === 'middle name' || h === 'additional name');
  const lastIdx = headers.findIndex(h => h === 'last name' || h === 'family name');
  const orgIdx = headers.findIndex(h => h === 'organization name' || h === 'organization 1 - name' || h === 'company');

  const phoneIndices = headers
    .map((h, i) => ({ h, i }))
    .filter(({ h }) =>
      /phone\s*\d*\s*-\s*value/i.test(h) ||
      h === 'phone' ||
      h === 'mobile' ||
      h === 'mobile phone' ||
      h === 'whatsapp' ||
      h === 'telephone'
    )
    .map(({ i }) => i);

  if (phoneIndices.length === 0) return [];

  const contacts = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = splitCsvLine(lines[r]);
    let name = nameIdx >= 0 ? (cols[nameIdx] || '') : '';
    if (!name) {
      name = [
        firstIdx >= 0 ? cols[firstIdx] : '',
        middleIdx >= 0 ? cols[middleIdx] : '',
        lastIdx >= 0 ? cols[lastIdx] : ''
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
    }
    if (!name && orgIdx >= 0) {
      name = cols[orgIdx] || '';
    }

    for (const pIdx of phoneIndices) {
      const cell = cols[pIdx] || '';
      if (!cell) continue;
      // Google Contacts sometimes separates multiple numbers in one cell with " ::: "
      const parts = cell.split(/\s*:::\s*/);
      for (const part of parts) {
        const normalized = normalizePhoneNumber(part);
        if (normalized && normalized.replace(/\D/g, '').length >= 7) {
          contacts.push({
            name: name || normalized,
            phone: normalized,
            source: 'Phonebook'
          });
        }
      }
    }
  }

  return deduplicateContacts(contacts);
}

/**
 * Deduplicates contacts by canonical phone key, preferring entries with real names.
 */
export function deduplicateContacts(list) {
  const byKey = new Map();
  for (const item of list || []) {
    if (!item || !item.phone) continue;
    const key = getPhoneDedupeKey(item.phone);
    if (!key) continue;
    const existing = byKey.get(key);
    const name = String(item.name || '').trim();
    const isGenericName = !name || name === item.phone || /^customer\b|^guest\b|^website/i.test(name);
    if (!existing) {
      byKey.set(key, {
        name: name || item.phone,
        phone: normalizePhoneNumber(item.phone),
        source: item.source || 'Phonebook',
        meta: item.meta || ''
      });
    } else {
      const existingGeneric = !existing.name || existing.name === existing.phone || /^customer\b|^guest\b|^website/i.test(existing.name);
      if (existingGeneric && !isGenericName) {
        byKey.set(key, {
          ...existing,
          name,
          meta: item.meta || existing.meta
        });
      }
    }
  }
  return Array.from(byKey.values());
}

export function loadImportedContacts() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(IMPORTED_CONTACTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

export function saveImportedContacts(contacts) {
  const deduped = deduplicateContacts(contacts);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(IMPORTED_CONTACTS_STORAGE_KEY, JSON.stringify(deduped));
    } catch (_) {}
  }
  return deduped;
}

/**
 * Merges Past Customers (from trips), Drivers Roster, and Imported Phonebook contacts
 * into a single searchable, deduplicated directory.
 */
export function buildUnifiedContactsList(trips = [], drivers = [], imported = []) {
  const combined = [];

  // 1. Imported phonebook contacts
  for (const c of imported || []) {
    if (c?.phone) {
      combined.push({
        name: c.name || c.phone,
        phone: normalizePhoneNumber(c.phone),
        source: 'Phonebook',
        meta: c.meta || ''
      });
    }
  }

  // 2. Past customers & guests from trips
  for (const t of trips || []) {
    if (t?.phone) {
      combined.push({
        name: String(t.customerName || '').trim() || t.phone,
        phone: normalizePhoneNumber(t.phone),
        source: 'Customer',
        meta: t.vehicle || ''
      });
    }
    if (t?.guestPhone) {
      combined.push({
        name: String(t.guestName || t.customerName || '').trim() || t.guestPhone,
        phone: normalizePhoneNumber(t.guestPhone),
        source: 'Customer',
        meta: 'Guest'
      });
    }
  }

  // 3. Drivers roster
  for (const d of drivers || []) {
    if (d?.phone) {
      combined.push({
        name: String(d.name || '').trim() || d.phone,
        phone: normalizePhoneNumber(d.phone),
        source: 'Driver',
        meta: [d.vehicle, d.plate].filter(Boolean).join(' • ')
      });
    }
  }

  return deduplicateContacts(combined).sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
  );
}
