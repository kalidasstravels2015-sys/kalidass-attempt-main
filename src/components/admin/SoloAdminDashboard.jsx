import React, { useState, useEffect, useMemo } from 'react';
import EnquiriesView from './solo/EnquiriesView';
import ActiveTripsView from './solo/ActiveTripsView';
import CompletedTripsView from './solo/CompletedTripsView';
import DeskChauffeurs from './solo/DeskChauffeurs';
import OperatorRateCalcWorkspace from './solo/OperatorRateCalcWorkspace';
import SettingsView from './solo/SettingsView';
import SoloDutySlipModal from './solo/SoloDutySlipModal';
import AiBookingParser from './solo/AiBookingParser';
import WebsiteRadarView from './solo/WebsiteRadarView';
import OperationsCalendarView from './solo/OperationsCalendarView';
import FastQuoteDesk from './FastQuoteDesk';
import { getActiveGoogleSheetUrl, fetchRemoteGoogleSheetUrl } from '../../config/googleSheets';
import { parseAndValidateContact, validateCustomerContact, isActionableLead, deduplicateCalculatorQuotes } from '../../utils/bookingContactValidator';

const STORAGE_KEYS = {
  BOOKINGS: 'kt_solo_real_bookings_v8',
  DELETED_BOOKINGS: 'kt_solo_deleted_bookings_v8',
  LEADS: 'kt_solo_real_leads_v8',
  DELETED_LEADS: 'kt_solo_deleted_leads_v8',
  CHAUFFEURS: 'kt_solo_real_chauffeurs_v8',
  QUOTES: 'kt_website_calculator_quotes_v1'
};

export default function SoloAdminDashboard() {
  // Dedicated Page/View Navigation:
  // 'ENQUIRIES' | 'ACTIVE_TRIPS' | 'COMPLETED' | 'DRIVERS' | 'CALCULATOR' | 'SETTINGS'
  const [currentView, setCurrentView] = useState('ENQUIRIES');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals for focused tasks
  const [isAiParserModalOpen, setIsAiParserModalOpen] = useState(false);
  const [isPhoneQuoteModalOpen, setIsPhoneQuoteModalOpen] = useState(false);
  const [activeDutySlipBooking, setActiveDutySlipBooking] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Connection & sync state
  const [isSheetConnected, setIsSheetConnected] = useState(false);
  const [lastSync, setLastSync] = useState('Live');
  const [toast, setToast] = useState(null);

  // Security PIN Gate (Master Owner PIN: 2015)
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem('kt_admin_pin_verified') === 'true';
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (sessionStorage.getItem('kt_admin_pin_verified') === 'true') {
        setIsUnlocked(true);
      }
    }
  }, []);

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === '2015') {
      setIsUnlocked(true);
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('kt_admin_pin_verified', 'true');
      }
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // State: Deleted Bookings Tombstones (prevents resurrection across page refreshes)
  const [deletedBookingIds, setDeletedBookingIds] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.DELETED_BOOKINGS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return new Set(parsed.map(id => String(id).trim().toLowerCase()));
        }
      } catch (_) {}
    }
    return new Set();
  });

  // State: Bookings (strictly excludes deleted and cancelled bookings)
  const [bookings, setBookings] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        let deletedSet = new Set();
        const rawDel = localStorage.getItem(STORAGE_KEYS.DELETED_BOOKINGS);
        if (rawDel) {
          const parsedDel = JSON.parse(rawDel);
          if (Array.isArray(parsedDel)) {
            parsedDel.forEach(id => deletedSet.add(String(id).trim().toLowerCase()));
          }
        }
        const cached = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            return parsed.filter(b => b && b.bookingId && !deletedSet.has(String(b.bookingId).trim().toLowerCase()) && b.manifestStatus !== 'Cancelled');
          }
        }
      } catch (_) {}
    }
    return [];
  });

  // State: Deleted Leads Tombstones (prevents resurrection across page refreshes)
  const [deletedLeadIds, setDeletedLeadIds] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.DELETED_LEADS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return new Set(parsed.map(id => String(id).trim().toLowerCase()));
        }
      } catch (_) {}
    }
    return new Set();
  });

  // State: Leads / Enquiries (strictly excludes deleted tombstones and cancelled leads)
  const [leads, setLeads] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        let deletedSet = new Set();
        const rawDel = localStorage.getItem(STORAGE_KEYS.DELETED_LEADS);
        if (rawDel) {
          const parsedDel = JSON.parse(rawDel);
          if (Array.isArray(parsedDel)) {
            parsedDel.forEach(id => deletedSet.add(String(id).trim().toLowerCase()));
          }
        }
        const cached = localStorage.getItem(STORAGE_KEYS.LEADS);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            return parsed.filter(l => l && l.quoteId && !deletedSet.has(String(l.quoteId).trim().toLowerCase()) && l.status !== 'Cancelled' && l.status !== 'Deleted');
          }
        }
      } catch (_) {}
    }
    return [];
  });

  // State: Chauffeurs / Drivers
  const [chauffeurs, setChauffeurs] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = localStorage.getItem(STORAGE_KEYS.CHAUFFEURS);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });

  const [calculatorQuotes, setCalculatorQuotes] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = localStorage.getItem(STORAGE_KEYS.QUOTES);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Counts for sidebar badges
  const validLeads = useMemo(
    () => leads.filter(isActionableLead),
    [leads]
  );

  const activeBookings = useMemo(
    () => bookings.filter(b => b.manifestStatus !== 'Completed' && b.manifestStatus !== 'Cancelled'),
    [bookings]
  );

  const needDriverCount = useMemo(
    () => activeBookings.filter(b => !b.assignedChauffeur || b.assignedChauffeur === 'Unassigned').length,
    [activeBookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter(b => b.manifestStatus === 'Completed'),
    [bookings]
  );

  const validCalculatorQuotes = useMemo(
    () => deduplicateCalculatorQuotes(calculatorQuotes),
    [calculatorQuotes]
  );

  // Add manual or phone lead
  const handleAddManualLead = async (newLead) => {
    const updated = [newLead, ...leads];
    setLeads(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updated));
    }
    try {
      await fetch('/api/record-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });
    } catch (_) {}
    showToast(`Enquiry ${newLead.quoteId} added!`, 'success');
  };

  // Add / Delete Chauffeurs
  const handleAddChauffeur = (newDriver) => {
    const updated = [newDriver, ...chauffeurs];
    setChauffeurs(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CHAUFFEURS, JSON.stringify(updated));
    }
    showToast(`Driver ${newDriver.name} added to roster!`, 'success');
  };

  const handleDeleteChauffeur = (index) => {
    const updated = chauffeurs.filter((_, i) => i !== index);
    setChauffeurs(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CHAUFFEURS, JSON.stringify(updated));
    }
    showToast('Driver removed from roster.', 'info');
  };

  // Sync with Backend API & Google Sheets
  const refreshData = async () => {
    try {
      const sheetUrl = getActiveGoogleSheetUrl();
      setIsSheetConnected(Boolean(sheetUrl));
      const webhookParam = sheetUrl ? `?webhook=${encodeURIComponent(sheetUrl)}` : '';

      const bookUrl = sheetUrl ? `/api/admin/bookings/?webhook=${encodeURIComponent(sheetUrl)}` : '/api/admin/bookings/';
      const leadUrl = sheetUrl ? `/api/admin/leads/?webhook=${encodeURIComponent(sheetUrl)}` : '/api/admin/leads/';
      const [bRes, lRes, cRes] = await Promise.allSettled([
        fetch(bookUrl),
        fetch(leadUrl),
        fetch('/api/calculations.json')
      ]);

      let apiBookings = [];
      let apiLeads = [];
      let apiQuotes = [];
      let csvCalculations = [];

      if (bRes.status === 'fulfilled' && bRes.value.ok) {
        const bData = await bRes.value.json();
        apiBookings = (bData.bookings || []).filter(b => b && b.manifestStatus !== 'Cancelled');
      }

      if (lRes.status === 'fulfilled' && lRes.value.ok) {
        const lData = await lRes.value.json();
        apiLeads = lData.leads || [];
        apiQuotes = lData.calculatorQuotes || [];
      }

      if (cRes.status === 'fulfilled' && cRes.value.ok) {
        const cData = await cRes.value.json();
        csvCalculations = cData.calculations || [];
      }

      // Fallback: direct Google Sheet fetch if backend returned 0 leads or 0 bookings
      if ((apiLeads.length === 0 || apiBookings.length === 0) && sheetUrl && sheetUrl.startsWith('http')) {
        try {
          const directRes = await fetch(sheetUrl, { redirect: 'follow' });
          if (directRes.ok) {
            const directJson = await directRes.json();
            if (directJson && directJson.success) {
              if (Array.isArray(directJson.leads) && apiLeads.length === 0) apiLeads = directJson.leads;
              if (Array.isArray(directJson.calculatorQuotes) && apiQuotes.length === 0) apiQuotes = directJson.calculatorQuotes;
              if (Array.isArray(directJson.bookings) && apiBookings.length === 0) {
                apiBookings = directJson.bookings.filter(b => b && b.manifestStatus !== 'Cancelled');
              }
            }
          }
        } catch (_) {}
      }

      // Merge remote leads with local manual leads, strictly honoring deleted tombstones
      setLeads(prevLeads => {
        let deletedSet = new Set(deletedLeadIds);
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const rawDel = localStorage.getItem(STORAGE_KEYS.DELETED_LEADS);
            if (rawDel) {
              const parsedDel = JSON.parse(rawDel);
              if (Array.isArray(parsedDel)) {
                parsedDel.forEach(id => deletedSet.add(String(id).trim().toLowerCase()));
              }
            }
          } catch (_) {}
        }

        const map = new Map();
        (prevLeads || []).filter(isActionableLead).forEach(l => {
          if (l && l.quoteId) {
            const key = String(l.quoteId).trim().toLowerCase();
            if (!deletedSet.has(key) && l.status !== 'Cancelled' && l.status !== 'Deleted') {
              map.set(key, l);
            }
          }
        });
        (apiLeads || []).filter(isActionableLead).forEach(l => {
          if (l && l.quoteId) {
            const key = String(l.quoteId).trim().toLowerCase();
            if (!deletedSet.has(key) && l.status !== 'Cancelled' && l.status !== 'Deleted') {
              map.set(key, l);
            }
          }
        });
        const merged = Array.from(map.values());
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(merged));
        }
        return merged;
      });

      // Merge quotes from API, CSV calculations log, Google Sheet, and localStorage
      setCalculatorQuotes(prevQuotes => {
        let deletedSet = new Set(deletedLeadIds);
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const rawDel = localStorage.getItem(STORAGE_KEYS.DELETED_LEADS);
            if (rawDel) {
              const parsedDel = JSON.parse(rawDel);
              if (Array.isArray(parsedDel)) {
                parsedDel.forEach(id => deletedSet.add(String(id).trim().toLowerCase()));
              }
            }
          } catch (_) {}
        }

        let storedQuotes = [];
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.QUOTES);
            if (raw) storedQuotes = JSON.parse(raw);
          } catch (_) {}
        }

        const map = new Map();
        const isValidQuote = (q) => q && q.quoteId && !deletedSet.has(String(q.quoteId).trim().toLowerCase()) && q.status !== 'Cancelled' && q.status !== 'Deleted';

        (storedQuotes || []).forEach(q => { if (isValidQuote(q)) map.set(q.quoteId, q); });
        (prevQuotes || []).forEach(q => { if (isValidQuote(q)) map.set(q.quoteId, q); });
        (csvCalculations || []).forEach(q => { if (isValidQuote(q)) map.set(q.quoteId, q); });
        (apiQuotes || []).forEach(q => { if (isValidQuote(q)) map.set(q.quoteId, q); });

        const rawList = Array.from(map.values());
        const merged = deduplicateCalculatorQuotes(rawList);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(merged.slice(0, 100)));
        }
        return merged;
      });

      // Merge remote bookings with local device bookings, strictly honoring deleted tombstones
      setBookings(prevBookings => {
        let deletedSet = new Set(deletedBookingIds);
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const rawDel = localStorage.getItem(STORAGE_KEYS.DELETED_BOOKINGS);
            if (rawDel) {
              const parsedDel = JSON.parse(rawDel);
              if (Array.isArray(parsedDel)) {
                parsedDel.forEach(id => deletedSet.add(String(id).trim().toLowerCase()));
              }
            }
          } catch (_) {}
        }

        const map = new Map();
        (prevBookings || []).forEach(b => {
          if (b && b.bookingId) {
            const key = String(b.bookingId).trim().toLowerCase();
            if (!deletedSet.has(key) && b.manifestStatus !== 'Cancelled') {
              map.set(key, b);
            }
          }
        });

        (apiBookings || []).forEach(b => {
          if (b && b.bookingId) {
            const key = String(b.bookingId).trim().toLowerCase();
            if (!deletedSet.has(key) && b.manifestStatus !== 'Cancelled') {
              map.set(key, b);
            }
          }
        });

        const merged = Array.from(map.values());
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(merged));
        }

        // Auto-reconcile: If local bookings exist that aren't yet recorded in Google Sheet, sync them up
        // IMPORTANT: Never auto-reconcile deleted or cancelled bookings!
        if (sheetUrl && sheetUrl.startsWith('http')) {
          const remoteIds = new Set((apiBookings || []).map(b => String(b.bookingId).trim().toLowerCase()));
          (prevBookings || []).forEach(localB => {
            if (localB && localB.bookingId) {
              const localKey = String(localB.bookingId).trim().toLowerCase();
              if (!deletedSet.has(localKey) && localB.manifestStatus !== 'Cancelled' && !remoteIds.has(localKey)) {
                syncBookingToRemote(localB).catch(() => {});
              }
            }
          });
        }

        return merged;
      });

      setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast('Live bookings and enquiries synced!', 'success');
    } catch (e) {
      showToast('Loaded from device memory', 'info');
    }
  };

  useEffect(() => {
    fetchRemoteGoogleSheetUrl().then((url) => {
      setIsSheetConnected(Boolean(url));
      refreshData();
    }).catch(() => {
      setIsSheetConnected(Boolean(getActiveGoogleSheetUrl()));
      refreshData();
    });

    // Real-Time Cross-Tab & Calculator Event Listeners
    const handleNewCalculation = (e) => {
      const newCalc = e.detail;
      if (newCalc && newCalc.quoteId) {
        setCalculatorQuotes(prev => {
          const map = new Map();
          map.set(newCalc.quoteId, newCalc);
          (prev || []).forEach(q => { if (q && q.quoteId) map.set(q.quoteId, q); });
          const merged = Array.from(map.values()).slice(0, 100);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(merged));
          }
          return merged;
        });
        const fareVal = Number(newCalc.estimatedFare || newCalc.fare || 0);
        if (fareVal > 0) {
          showToast(`⚡ Live calculation: ${newCalc.pickup || 'Chennai'} ➔ ${newCalc.drop || 'Trip'} (₹${fareVal.toLocaleString('en-IN')})`, 'info');
        }
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.QUOTES && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            setCalculatorQuotes(updated);
          }
        } catch (_) {}
      }
    };

    window.addEventListener('kt_new_calculation', handleNewCalculation);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('kt_new_calculation', handleNewCalculation);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Full reset handler
  const handleExecuteFullReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset-data/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '2015' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset server data');
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
        localStorage.removeItem(STORAGE_KEYS.DELETED_BOOKINGS);
        localStorage.removeItem(STORAGE_KEYS.LEADS);
        localStorage.removeItem(STORAGE_KEYS.CHAUFFEURS);
        localStorage.removeItem(STORAGE_KEYS.QUOTES);
      }
      setBookings([]);
      setDeletedBookingIds(new Set());
      setLeads([]);
      setChauffeurs([]);
      setCalculatorQuotes([]);
      setIsResetConfirmOpen(false);
      showToast('All admin data has been reset to zero.', 'success');
      setCurrentView('ENQUIRIES');
    } catch (err) {
      showToast(err.message || 'Reset failed', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Helper: Synchronize booking changes with server endpoint and Google Sheets
  const syncBookingToRemote = async (payload) => {
    const sheetUrl = getActiveGoogleSheetUrl();
    const queryParams = new URLSearchParams();
    if (sheetUrl) queryParams.set('webhook', sheetUrl);
    if (payload.action) queryParams.set('action', payload.action);
    if (payload.bookingId) queryParams.set('bookingId', payload.bookingId);
    if (payload.manifestStatus) queryParams.set('manifestStatus', payload.manifestStatus);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    // 1. Post to API endpoint with trailing slash and query params (GET for delete, POST for update/create)
    try {
      const isDelete = payload.action === 'delete' || payload.action === 'cancel';
      await fetch(`/api/admin/bookings/${queryString}`, {
        method: isDelete ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: isDelete ? undefined : JSON.stringify(payload)
      });
    } catch (_) {}

    // 2. Direct fallback to Google Apps Script Web App URL
    if (sheetUrl && sheetUrl.startsWith('https://script.google.com/macros/s/')) {
      try {
        await fetch(sheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'admin_booking_sync',
            date: new Date().toLocaleString('en-IN'),
            ...payload
          })
        });
      } catch (_) {}
    }
  };

  // Convert Inquiry to Confirmed Booking (Advance Received)
  const handleConvertToConfirmed = async (newConfirmed, quoteIdToRemove) => {
    // Strict Guard: Without valid customer name and 10-digit mobile number, enquiries cannot move to Active Trips
    const validation = parseAndValidateContact(newConfirmed?.guestNamePhone);
    if (!validation.isValid) {
      showToast(validation.error || 'Cannot move to Active Trips: Customer Name and a valid 10-digit Mobile Number are strictly required.', 'error');
      return false;
    }

    const nextList = [newConfirmed, ...bookings];
    setBookings(nextList);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextList));

    if (quoteIdToRemove) {
      const remainingLeads = leads.filter(l => l.quoteId !== quoteIdToRemove);
      setLeads(remainingLeads);
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(remainingLeads));
    }

    await syncBookingToRemote(newConfirmed);

    // Switch view automatically to Active Trips so user can allot driver
    setCurrentView('ACTIVE_TRIPS');
    return true;
  };

  // Delete / Cancel Booking from Active Trips
  const handleDeleteBooking = async (bookingId) => {
    if (!bookingId) return;
    const cleanId = String(bookingId).trim();
    const lowerId = cleanId.toLowerCase();

    // 1. Permanently record tombstone in state and localStorage
    setDeletedBookingIds(prev => {
      const next = new Set(prev);
      next.add(lowerId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.DELETED_BOOKINGS, JSON.stringify(Array.from(next)));
      }
      return next;
    });

    // 2. Immediately remove from local bookings state and localStorage
    const nextList = bookings.filter(b => String(b.bookingId || '').trim().toLowerCase() !== lowerId);
    setBookings(nextList);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextList));
    }

    // 3. Sync deletion to server and Google Sheets with manifestStatus: 'Cancelled'
    await syncBookingToRemote({
      action: 'delete',
      bookingId: cleanId,
      manifestStatus: 'Cancelled'
    });

    showToast(`Trip ${cleanId} has been removed.`, 'info');
  };

  // Helper: Synchronize lead deletion with server endpoint and Google Sheets
  const syncLeadDeletionToRemote = async (quoteId) => {
    const sheetUrl = getActiveGoogleSheetUrl();
    const queryParams = new URLSearchParams();
    if (sheetUrl) queryParams.set('webhook', sheetUrl);
    queryParams.set('action', 'delete');
    queryParams.set('quoteId', quoteId);
    queryParams.set('status', 'Cancelled');

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    // 1. API endpoint call (GET/POST)
    try {
      await fetch(`/api/admin/leads/${queryString}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (_) {}

    // 2. Direct fallback to Google Apps Script Web App URL
    if (sheetUrl && sheetUrl.startsWith('https://script.google.com/macros/s/')) {
      try {
        await fetch(sheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'admin_lead_sync',
            action: 'delete',
            quoteId,
            status: 'Cancelled',
            date: new Date().toLocaleString('en-IN')
          })
        });
      } catch (_) {}
    }
  };

  // Delete / Dismiss Enquiry / Quote
  const handleDeleteLead = async (quoteId) => {
    if (!quoteId) return;
    const cleanId = String(quoteId).trim();
    const lowerId = cleanId.toLowerCase();

    // 1. Permanently record tombstone in state and localStorage
    setDeletedLeadIds(prev => {
      const next = new Set(prev);
      next.add(lowerId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.DELETED_LEADS, JSON.stringify(Array.from(next)));
      }
      return next;
    });

    // 2. Immediately remove from local leads state and localStorage
    const nextLeads = leads.filter(l => String(l.quoteId || '').trim().toLowerCase() !== lowerId);
    setLeads(nextLeads);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(nextLeads));
    }

    // Also remove from calculatorQuotes state and localStorage
    setCalculatorQuotes(prev => {
      const nextQ = prev.filter(q => String(q.quoteId || '').trim().toLowerCase() !== lowerId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(nextQ.slice(0, 100)));
      }
      return nextQ;
    });

    // 3. Sync lead deletion to server and Google Sheets
    await syncLeadDeletionToRemote(cleanId);

    showToast(`Enquiry ${cleanId} has been removed.`, 'info');
  };

  // Update Enquiry (e.g. reschedule follow-up or edit notes)
  const handleUpdateLead = (updatedLead) => {
    if (!updatedLead || !updatedLead.quoteId) return;
    const targetId = String(updatedLead.quoteId).trim().toLowerCase();
    const nextLeads = leads.map(l => (String(l.quoteId || '').trim().toLowerCase() === targetId ? { ...l, ...updatedLead } : l));
    setLeads(nextLeads);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(nextLeads));
    }
    showToast(`Enquiry ${updatedLead.quoteId} updated!`, 'success');
  };

  // Update Customer Contact on an Active Trip
  const handleUpdateBookingContact = async (bookingId, guestName, phone) => {
    const validation = validateCustomerContact(guestName, phone);
    if (!validation.isValid) {
      showToast(validation.error || 'Please enter Customer Name and a valid 10-digit Mobile Number.', 'error');
      return false;
    }

    const updated = bookings.map(b => (
      b.bookingId === bookingId
        ? { ...b, guestNamePhone: validation.formattedGuestNamePhone }
        : b
    ));
    setBookings(updated);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));

    await syncBookingToRemote({ action: 'update', bookingId, guestNamePhone: validation.formattedGuestNamePhone });
    showToast(`Customer contact updated for trip ${bookingId}!`, 'success');
    return true;
  };

  // Assign Driver
  const handleAssignChauffeur = async (bookingId, assignedChauffeur) => {
    const updated = bookings.map(b => (
      b.bookingId === bookingId
        ? {
            ...b,
            assignedChauffeur,
            manifestStatus: assignedChauffeur === 'Unassigned' ? 'Need Driver' : 'Allotted'
          }
        : b
    ));
    setBookings(updated);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));

    await syncBookingToRemote({ action: 'update', bookingId, assignedChauffeur });
  };

  // Change Trip Status
  const handleStatusChange = async (bookingId, manifestStatus) => {
    const updated = bookings.map(b => (b.bookingId === bookingId ? { ...b, manifestStatus } : b));
    setBookings(updated);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));

    await syncBookingToRemote({ action: 'update', bookingId, manifestStatus });

    if (manifestStatus === 'Completed') {
      setCurrentView('COMPLETED');
    }
  };

  // Update Review Status
  const handleReviewStatusChange = async (bookingId, reviewStatus) => {
    const updated = bookings.map(b => (b.bookingId === bookingId ? { ...b, reviewStatus } : b));
    setBookings(updated);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));

    await syncBookingToRemote({ action: 'update', bookingId, reviewStatus });
  };

  // Duty Slip Saved
  const handleDutySlipSaved = async (dutySlip, bookingId, finalFare) => {
    const updated = bookings.map(b => (
      b.bookingId === bookingId
        ? { ...b, manifestStatus: 'Completed', terminalFare: finalFare, financialClosure: 'Unreconciled' }
        : b
    ));
    setBookings(updated);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));

    await syncBookingToRemote({ action: 'update', bookingId, manifestStatus: 'Completed', terminalFare: finalFare });
    showToast(`Trip ${bookingId} completed! Moved to Step 3.`, 'success');
    setCurrentView('COMPLETED');
  };

  // PIN Protection Gate
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-m3-surface text-m3-on-surface flex items-center justify-center p-4 font-sans">
        <div className="bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-2xl p-6 sm:p-8 max-w-sm w-full shadow-m3-3 text-center animate-fadeIn">
          <div className="w-14 h-14 mx-auto rounded-m3-lg bg-m3-primary text-m3-on-primary font-black text-2xl flex items-center justify-center shadow-m3-2 mb-4">
            K
          </div>
          <h2 className="text-m3-title-l font-bold text-m3-on-surface">Kalidass Travels</h2>
          <p className="text-m3-body-s text-m3-on-surface-variant mt-1 mb-6">Admin Operations Console • Medavakkam</p>

          <form onSubmit={handleVerifyPin} action="javascript:void(0);" className="space-y-4">
            <div>
              <label className="block text-m3-label-m font-semibold text-m3-on-surface-variant uppercase tracking-wider mb-2">
                Enter 4-Digit Owner PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setPinInput(val);
                  setPinError(false);
                  if (val.trim() === '2015') {
                    setIsUnlocked(true);
                    if (typeof window !== 'undefined' && window.sessionStorage) {
                      sessionStorage.setItem('kt_admin_pin_verified', 'true');
                    }
                  }
                }}
                placeholder="• • • •"
                className={`w-full text-center text-2xl tracking-[0.5em] font-mono-code font-bold py-3 px-4 rounded-m3-md bg-m3-surface-container-low border ${
                  pinError ? 'border-m3-error text-m3-error' : 'border-m3-outline-variant text-m3-on-surface'
                } focus:outline-none focus:ring-2 focus:ring-m3-primary`}
              />
              {pinError && (
                <p className="text-m3-body-s text-m3-error font-semibold mt-2">Incorrect PIN (Use 2015).</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary font-bold rounded-m3-full text-m3-label-l shadow-m3-1 transition-all"
            >
              Unlock Console
            </button>
          </form>

          <p className="text-m3-label-s text-m3-outline mt-6">
            24/7 Operations Desk • +91 89395 39211
          </p>
        </div>
      </div>
    );
  }

  // Navigation Items
  const navItems = [
    {
      id: 'ENQUIRIES',
      label: '1. New Enquiries',
      icon: 'phone_in_talk',
      badge: validLeads.length > 0 ? validLeads.length : null,
      badgeColor: 'bg-m3-primary-container text-m3-on-primary-container',
      description: 'Calls, WhatsApp & quotes'
    },
    {
      id: 'ACTIVE_TRIPS',
      label: '2. Active Trips',
      icon: 'local_taxi',
      badge: activeBookings.length > 0 ? (needDriverCount > 0 ? `⚠️ ${activeBookings.length}` : activeBookings.length) : null,
      badgeColor: needDriverCount > 0 ? 'bg-m3-error-container text-m3-on-error-container' : 'bg-m3-secondary-container text-m3-on-secondary-container',
      description: 'Driver allotment & Duty Slips'
    },
    {
      id: 'CALENDAR',
      label: 'Dispatch Calendar',
      icon: 'calendar_month',
      badge: needDriverCount > 0 ? `⚠️ ${needDriverCount}` : null,
      badgeColor: 'bg-m3-error-container text-m3-on-error-container',
      description: 'Month & day dispatch schedule'
    },
    {
      id: 'COMPLETED',
      label: '3. Completed Trips',
      icon: 'verified',
      badge: completedBookings.length > 0 ? completedBookings.length : null,
      badgeColor: 'bg-m3-secondary-container text-m3-on-secondary-container',
      description: 'Closed duties & 5★ reviews'
    },
    {
      id: 'DRIVERS',
      label: '4. Driver Roster',
      icon: 'badge',
      badge: chauffeurs.length > 0 ? chauffeurs.length : null,
      badgeColor: 'bg-m3-surface-container-high text-m3-on-surface',
      description: 'Partner drivers & cars'
    },
    {
      id: 'CALCULATOR',
      label: '5. Rate Calculator',
      icon: 'calculate',
      description: 'Inbound phone tariff engine'
    },
    {
      id: 'FAST_QUOTE',
      label: '⚡ Fast Quote Desk',
      icon: 'bolt',
      badge: 'New',
      badgeColor: 'bg-emerald-600 text-white',
      description: 'Zero-loss WhatsApp quote generator'
    },
    {
      id: 'WEB_RADAR',
      label: '6. Website Calc Radar',
      icon: 'radar',
      badge: validCalculatorQuotes.length > 0 ? validCalculatorQuotes.length : null,
      badgeColor: 'bg-m3-primary-container text-m3-on-primary-container',
      description: 'Live visitor fare calculations'
    },
    {
      id: 'SETTINGS',
      label: '7. Google Sheet Sync',
      icon: 'table_chart',
      badge: isSheetConnected ? 'Synced' : 'Offline',
      badgeColor: isSheetConnected ? 'bg-m3-secondary-container text-m3-on-secondary-container' : 'bg-m3-error-container text-m3-on-error-container',
      description: '2-way Google Sheets sync'
    }
  ];

  return (
    <div className="min-h-screen bg-m3-surface text-m3-on-surface font-sans flex flex-col md:flex-row overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-20 md:bottom-6 right-4 z-50 px-4 py-3 rounded-m3-md shadow-m3-3 text-m3-label-m font-semibold flex items-center gap-2.5 animate-fadeIn ${
          toast.type === 'error'
            ? 'bg-m3-error text-m3-on-error'
            : 'bg-m3-inverse-surface text-m3-inverse-on-surface'
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* LEFT SIDEBAR (Clean, Dedicated Navigation for Each Step)  */}
      {/* ========================================================= */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-m3-surface-container-lowest border-r border-m3-outline-variant/70 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="p-4 border-b border-m3-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-m3-md bg-m3-primary text-m3-on-primary font-black text-lg flex items-center justify-center shadow-m3-1 shrink-0">
              K
            </div>
            <div>
              <h1 className="text-sm font-black text-m3-on-surface leading-tight">Kalidass Travels</h1>
              <p className="text-[11px] text-m3-on-surface-variant">Medavakkam, Chennai</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden w-8 h-8 rounded-full hover:bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface-variant"
          >
            ✕
          </button>
        </div>

        {/* Navigation Menu Links */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCurrentView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-m3-full text-left transition-colors flex items-center justify-between gap-2.5 ${
                  isActive
                    ? 'bg-m3-secondary-container text-m3-on-secondary-container font-bold shadow-none'
                    : 'text-m3-on-surface-variant hover:bg-m3-surface-container-high hover:text-m3-on-surface font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-m3-primary font-variation-fill' : 'text-m3-on-surface-variant'}`}>
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs truncate block">{item.label}</span>
                    <span className="text-[10px] text-m3-on-surface-variant/80 truncate block">{item.description}</span>
                  </div>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Sync Status & Controls */}
        <div className="p-3 border-t border-m3-outline-variant/60 bg-m3-surface-container-low/50 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-m3-on-surface">
              <span className={`w-2 h-2 rounded-full ${isSheetConnected ? 'bg-m3-primary' : 'bg-m3-outline'}`}></span>
              <span>{isSheetConnected ? 'Sheet Connected' : 'Sheet Offline'}</span>
            </span>
            <span className="text-m3-on-surface-variant">{lastSync}</span>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={refreshData}
              className="flex-1 h-8 bg-m3-surface-container-lowest hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-full text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
              title="Refresh data from server & Google Sheets"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('kt_admin_pin_verified');
                setIsUnlocked(false);
              }}
              className="h-8 px-2.5 bg-m3-surface-container-lowest hover:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface border border-m3-outline-variant rounded-full text-[11px] font-bold flex items-center justify-center"
              title="Lock Console (PIN: 2015)"
            >
              <span className="material-symbols-outlined text-[15px]">lock</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      {/* ========================================================= */}
      {/* MAIN VIEW CONTENT AREA (Renders ONLY the Selected Page)   */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-m3-surface-container-lowest border-b border-m3-outline-variant/60 px-3 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-full hover:bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface shrink-0"
              title="Open Navigation Menu"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-black uppercase text-m3-primary tracking-wider truncate">
                {currentView === 'ENQUIRIES' && 'Step 1: Enquiries'}
                {currentView === 'ACTIVE_TRIPS' && 'Step 2: Active Trips'}
                {currentView === 'CALENDAR' && 'Operations & Trip Calendar'}
                {currentView === 'COMPLETED' && 'Step 3: Completed Trips'}
                {currentView === 'DRIVERS' && 'Driver Roster'}
                {currentView === 'CALCULATOR' && 'Rate Calculator'}
                {currentView === 'WEB_RADAR' && 'Website Calc Radar'}
                {currentView === 'SETTINGS' && 'System Settings'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPhoneQuoteModalOpen(true)}
              className="h-9 px-2.5 sm:px-3.5 bg-m3-surface-container-low hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-none"
              title="Quick Rate Calculator"
            >
              <span className="material-symbols-outlined text-[17px] text-m3-on-surface-variant">calculate</span>
              <span className="hidden sm:inline">Rate Calc</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAiParserModalOpen(true)}
              className="h-9 px-2.5 sm:px-3.5 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-m3-full text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-none"
              title="Paste incoming WhatsApp quote"
            >
              <span className="material-symbols-outlined text-[17px]">content_paste</span>
              <span className="hidden sm:inline">Paste WA</span>
            </button>
          </div>
        </header>

        {/* View Switcher: Dedicated Clean Views with Bottom Padding for Mobile Nav */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto pb-20 md:pb-6">
          {/* VIEW 1: ENQUIRIES */}
          {currentView === 'ENQUIRIES' && (
            <EnquiriesView
              leads={leads}
              calculatorQuotes={calculatorQuotes}
              onNavigateToRadar={() => setCurrentView('WEB_RADAR')}
              onAddManualLead={handleAddManualLead}
              onConvertToConfirmed={handleConvertToConfirmed}
              onDeleteLead={handleDeleteLead}
              onUpdateLead={handleUpdateLead}
              onOpenPhoneQuoteEngine={() => setIsPhoneQuoteModalOpen(true)}
              onOpenAiParser={() => setIsAiParserModalOpen(true)}
              showToast={showToast}
            />
          )}

          {/* VIEW 2: ACTIVE TRIPS */}
          {currentView === 'ACTIVE_TRIPS' && (
            <ActiveTripsView
              bookings={bookings}
              chauffeurs={chauffeurs}
              onAssignChauffeur={handleAssignChauffeur}
              onStatusChange={handleStatusChange}
              onDeleteBooking={handleDeleteBooking}
              onUpdateContact={handleUpdateBookingContact}
              onOpenDutySlip={(b) => setActiveDutySlipBooking(b)}
              onOpenDriversModal={() => setCurrentView('DRIVERS')}
              showToast={showToast}
            />
          )}

          {/* VIEW 2.5: OPERATIONS CALENDAR */}
          {currentView === 'CALENDAR' && (
            <OperationsCalendarView
              bookings={bookings}
              leads={leads}
              chauffeurs={chauffeurs}
              onAssignChauffeur={handleAssignChauffeur}
              onStatusChange={handleStatusChange}
              onConvertToConfirmed={handleConvertToConfirmed}
              onOpenDutySlip={(b) => setActiveDutySlipBooking(b)}
              showToast={showToast}
            />
          )}

          {/* VIEW 3: COMPLETED TRIPS */}
          {currentView === 'COMPLETED' && (
            <CompletedTripsView
              bookings={bookings}
              onReviewStatusChange={handleReviewStatusChange}
              showToast={showToast}
            />
          )}

          {/* VIEW 4: DRIVERS ROSTER */}
          {currentView === 'DRIVERS' && (
            <div className="space-y-4">
              <div className="bg-m3-surface-container-lowest p-4 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex items-center justify-between">
                <div>
                  <h2 className="text-m3-title-m font-black text-m3-on-surface">
                    4. Drivers & Commercial Fleet Roster
                  </h2>
                  <p className="text-xs text-m3-on-surface-variant mt-0.5">
                    Manage verified partner drivers and vehicle models for instant duty assignment.
                  </p>
                </div>
              </div>
              <DeskChauffeurs
                chauffeurs={chauffeurs}
                bookings={bookings}
                onAddChauffeur={handleAddChauffeur}
                onDeleteChauffeur={handleDeleteChauffeur}
                showToast={showToast}
              />
            </div>
          )}

          {/* VIEW 5: PHONE RATE CALCULATOR */}
          {currentView === 'CALCULATOR' && (
            <OperatorRateCalcWorkspace
              isOpen={true}
              isPageMode={true}
              onClose={() => setCurrentView('ENQUIRIES')}
              onSaveLead={(newLead) => {
                handleAddManualLead(newLead);
                setCurrentView('ENQUIRIES');
              }}
              onConfirmBooking={(newBooking) => {
                handleConvertToConfirmed(newBooking);
                setCurrentView('ACTIVE_TRIPS');
              }}
              showToast={showToast}
            />
          )}

          {/* VIEW 5.5: FAST QUOTE DESK */}
          {currentView === 'FAST_QUOTE' && (
            <div className="p-2 sm:p-4">
              <FastQuoteDesk />
            </div>
          )}

          {/* VIEW 6: WEBSITE VISITOR CALC RADAR */}
          {currentView === 'WEB_RADAR' && (
            <WebsiteRadarView
              calculatorQuotes={calculatorQuotes}
              onConvertToConfirmed={(b) => {
                handleConvertToConfirmed(b);
                setCurrentView('ACTIVE_TRIPS');
              }}
              showToast={showToast}
            />
          )}

          {/* VIEW 7: GOOGLE SHEET SYNC & SETTINGS */}
          {currentView === 'SETTINGS' && (
            <SettingsView
              calculatorQuotes={calculatorQuotes}
              onSyncSuccess={() => {
                setIsSheetConnected(true);
                refreshData();
              }}
              onOpenResetModal={() => setIsResetConfirmOpen(true)}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Google Material Design 3)   */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-m3-surface-container-lowest/95 backdrop-blur-md border-t border-m3-outline-variant/60 flex items-center justify-around px-1 shadow-m3-2">
        {[
          { id: 'ENQUIRIES', label: 'Enquiries', icon: 'phone_in_talk', badge: validLeads.length > 0 ? validLeads.length : null },
          { id: 'CALENDAR', label: 'Calendar', icon: 'calendar_month', badge: needDriverCount > 0 ? '!' : null },
          { id: 'ACTIVE_TRIPS', label: 'Active', icon: 'local_taxi', badge: activeBookings.length > 0 ? (needDriverCount > 0 ? '!' : activeBookings.length) : null },
          { id: 'COMPLETED', label: 'Done', icon: 'verified', badge: null },
          { id: 'MENU', label: 'More', icon: 'menu', badge: null }
        ].map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'MENU') {
                  setMobileMenuOpen(true);
                } else {
                  setCurrentView(tab.id);
                  setMobileMenuOpen(false);
                }
              }}
              className="flex-1 flex flex-col items-center justify-center py-1 relative touch-manipulation"
            >
              <div className={`relative px-4 py-0.5 rounded-full transition-colors flex items-center justify-center ${
                isActive
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}>
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-m3-primary font-variation-fill' : ''}`}>
                  {tab.icon}
                </span>
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-m3-primary text-m3-on-primary text-[10px] font-mono-code font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 transition-colors ${
                isActive ? 'font-bold text-m3-primary' : 'font-medium text-m3-on-surface-variant'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================= */}
      {/* FOCUSED TASK MODALS (Only When User Explicitly Clicks)     */}
      {/* ========================================================= */}

      {/* AI Booking Parser Modal */}
      {isAiParserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <AiBookingParser
              showToast={showToast}
              onClose={() => setIsAiParserModalOpen(false)}
              onLeadCreated={(newLead) => {
                handleAddManualLead(newLead);
                setIsAiParserModalOpen(false);
                setCurrentView('ENQUIRIES');
              }}
              onBookingCreated={(newConfirmed) => {
                handleConvertToConfirmed(newConfirmed);
                setIsAiParserModalOpen(false);
                setCurrentView('ACTIVE_TRIPS');
              }}
            />
          </div>
        </div>
      )}

      {/* Rate Calculator Modal (when opened from top button) */}
      {isPhoneQuoteModalOpen && (
        <OperatorRateCalcWorkspace
          isOpen={isPhoneQuoteModalOpen}
          isPageMode={false}
          onClose={() => setIsPhoneQuoteModalOpen(false)}
          onSaveLead={(newLead) => {
            handleAddManualLead(newLead);
            setIsPhoneQuoteModalOpen(false);
            setCurrentView('ENQUIRIES');
          }}
          onConfirmBooking={(newBooking) => {
            handleConvertToConfirmed(newBooking);
            setIsPhoneQuoteModalOpen(false);
            setCurrentView('ACTIVE_TRIPS');
          }}
          showToast={showToast}
        />
      )}

      {/* Duty Slip Modal (Start/End KM, Tolls, Settlement) */}
      {activeDutySlipBooking && (
        <SoloDutySlipModal
          isOpen={!!activeDutySlipBooking}
          booking={activeDutySlipBooking}
          chauffeurs={chauffeurs}
          onClose={() => setActiveDutySlipBooking(null)}
          onDutySlipSaved={handleDutySlipSaved}
          showToast={showToast}
        />
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-m3-surface-container-high border border-m3-outline-variant/30 rounded-2xl p-6 shadow-2xl relative text-m3-on-surface">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-m3-on-surface">Reset All Admin Data?</h3>
                <p className="text-xs text-m3-on-surface-variant">Clean slate for operations</p>
              </div>
            </div>

            <div className="text-xs text-m3-on-surface-variant space-y-2 mb-6 bg-m3-surface-container/60 p-3.5 rounded-xl border border-m3-outline-variant/15">
              <p className="font-semibold text-m3-on-surface">This action will reset:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>All calculation quotes & customer leads</li>
                <li>All active duties & fleet booking records</li>
                <li>Local browser cache & rosters</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-m3-on-surface-variant hover:bg-m3-surface-container transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleExecuteFullReset}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Resetting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                    Yes, Reset All to Zero
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
