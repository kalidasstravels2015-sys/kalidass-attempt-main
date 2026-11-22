import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  isNativeContactPickerSupported,
  pickNativePhonebookContact,
  parseVCardContacts,
  parseGoogleContactsCsv,
  loadImportedContacts,
  saveImportedContacts,
  deduplicateContacts
} from '../../utils/contactBookHelper.js';

/**
 * Reusable Phonebook / Contacts Picker button + searchable popover.
 * - On Android Chrome: 1-tap opens the native Android Phonebook (Contact Picker API).
 * - On Desktop / iOS (and as a quick directory on mobile): Opens a searchable popover
 *   with Past Customers, Drivers Roster, and Imported .vcf / Google Contacts .csv files.
 */
export default function ContactPickerControl({
  contacts = [],
  onSelect,
  onImportedContactsChange,
  showToast,
  defaultFilter = 'All', // 'All' | 'Customer' | 'Driver' | 'Phonebook'
  buttonLabel = 'Phonebook',
  compact = false,
  className = ''
}) {
  const [nativeSupported, setNativeSupported] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filterTab, setFilterTab] = useState(defaultFilter);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setNativeSupported(isNativeContactPickerSupported());
  }, []);

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    setTimeout(() => searchInputRef.current?.focus(), 30);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = query.replace(/\D/g, '');
    return (contacts || [])
      .filter((c) => {
        if (filterTab !== 'All' && c.source !== filterTab) return false;
        if (!q) return true;
        const nameMatch = String(c.name || '').toLowerCase().includes(q);
        const phoneMatch = String(c.phone || '').toLowerCase().includes(q) || (qDigits && String(c.phone || '').replace(/\D/g, '').includes(qDigits));
        const metaMatch = String(c.meta || '').toLowerCase().includes(q);
        return nameMatch || phoneMatch || metaMatch;
      })
      .slice(0, 60);
  }, [contacts, query, filterTab]);

  const counts = useMemo(() => {
    const c = { All: contacts.length, Customer: 0, Driver: 0, Phonebook: 0 };
    for (const item of contacts || []) {
      if (item.source === 'Customer') c.Customer++;
      else if (item.source === 'Driver') c.Driver++;
      else if (item.source === 'Phonebook') c.Phonebook++;
    }
    return c;
  }, [contacts]);

  const handleNativePick = async () => {
    try {
      const picked = await pickNativePhonebookContact();
      if (picked && (picked.name || picked.phone)) {
        onSelect?.(picked);
        showToast?.(`Filled from phonebook: ${picked.name || picked.phone}`);
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      // Fallback to directory popover if permission denied or unsupported
      setIsOpen(true);
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const lowerName = file.name.toLowerCase();
      let parsed = [];
      if (lowerName.endsWith('.vcf') || lowerName.endsWith('.vcard') || /BEGIN:VCARD/i.test(text)) {
        parsed = parseVCardContacts(text);
      } else {
        parsed = parseGoogleContactsCsv(text);
      }

      if (parsed.length === 0) {
        showToast?.('No valid contacts with phone numbers found in that file.', 'error');
        return;
      }

      const existing = loadImportedContacts();
      const merged = saveImportedContacts(deduplicateContacts([...parsed, ...existing]));
      onImportedContactsChange?.(merged);
      setFilterTab('Phonebook');
      showToast?.(`Imported ${parsed.length} contacts (${merged.length} total saved in browser)!`);
    } catch (err) {
      showToast?.(`Failed to import contacts: ${err?.message || 'Invalid file'}`, 'error');
    }
  };

  const handleChooseContact = (contact) => {
    onSelect?.({ name: contact.name, phone: contact.phone });
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className={`relative inline-flex items-center gap-1 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".vcf,.vcard,.csv,text/vcard,text/csv"
        onChange={handleFileImport}
        className="hidden"
      />

      {nativeSupported ? (
        <>
          <button
            type="button"
            onClick={handleNativePick}
            title="Pick directly from your Android Phonebook"
            className={`inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition ${
              compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'
            }`}
          >
            <span className="material-symbols-outlined text-sm">contacts</span>
            <span>{buttonLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            title="Search saved customers, drivers & imported contacts"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 px-1.5 py-1 text-xs transition"
          >
            <span className="material-symbols-outlined text-sm">search</span>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          title="Search past contacts or import Phonebook (.vcf / Google Contacts .csv)"
          className={`inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition ${
            compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="material-symbols-outlined text-sm">contacts</span>
          <span>{buttonLabel}</span>
          {contacts.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
              {contacts.length}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-blue-600">contact_phone</span>
              <span>Contact Book</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition"
                title="Import .vcf from Phone or .csv from Google Contacts"
              >
                <span className="material-symbols-outlined text-xs">upload_file</span>
                <span>Import .vcf / .csv</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close contact book"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or mobile number..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
          />

          <div className="flex items-center gap-1 flex-wrap">
            {[
              { id: 'All', label: `All (${counts.All})` },
              { id: 'Customer', label: `Customers (${counts.Customer})` },
              { id: 'Driver', label: `Drivers (${counts.Driver})` },
              { id: 'Phonebook', label: `Imported (${counts.Phonebook})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                  filterTab === tab.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center space-y-1.5">
                <p className="text-xs text-slate-500 font-medium">No matching contacts</p>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Export contacts from Google Contacts (CSV) or Phone (vCard .vcf) and click{' '}
                  <strong className="text-emerald-700">Import .vcf / .csv</strong> above.
                </p>
              </div>
            ) : (
              filteredContacts.map((c, idx) => (
                <button
                  key={`${c.phone}-${idx}`}
                  type="button"
                  onClick={() => handleChooseContact(c)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50/70 transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{c.name}</div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      {c.phone}
                      {c.meta ? <span className="font-sans text-slate-400"> · {c.meta}</span> : null}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      c.source === 'Driver'
                        ? 'bg-amber-100 text-amber-800'
                        : c.source === 'Phonebook'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {c.source}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
