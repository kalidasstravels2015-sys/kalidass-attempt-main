import React, { useState, useEffect, useMemo } from 'react';
import UnifiedDutiesBoard from './solo/UnifiedDutiesBoard';
import SoloDutySlipModal from './solo/SoloDutySlipModal';
import AiBookingParser from './solo/AiBookingParser';
import DeskChauffeurs from './solo/DeskChauffeurs';
import DeskPhoneQuoteEngine from './solo/DeskPhoneQuoteEngine';

const STORAGE_KEYS = {
  BOOKINGS: 'kt_solo_real_bookings_v7',
  LEADS: 'kt_solo_real_leads_v7',
  CHAUFFEURS: 'kt_solo_real_chauffeurs_v7'
};

export default function SoloAdminDashboard() {
  const [isAiParserModalOpen, setIsAiParserModalOpen] = useState(false);
  const [isPhoneQuoteModalOpen, setIsPhoneQuoteModalOpen] = useState(false);
  const [isDriversModalOpen, setIsDriversModalOpen] = useState(false);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);

  // Security PIN Gate (Master Owner PIN: 2015)
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem('kt_admin_pin_verified') === 'true';
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

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

  // Zero mock bookings: Starts completely empty until real bookings are created
  const [bookings, setBookings] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });

  // Real customer leads from backend
  const [leads, setLeads] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = localStorage.getItem(STORAGE_KEYS.LEADS);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });

  // Zero mock drivers: Starts empty until real partner drivers are added
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

  const [toast, setToast] = useState(null);
  const [activeDutySlipBooking, setActiveDutySlipBooking] = useState(null);
  const [lastSync, setLastSync] = useState('Live');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

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

  // Sync with Backend CSV API
  const refreshData = async () => {
    try {
      const [bRes, lRes] = await Promise.allSettled([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/leads')
      ]);

      if (bRes.status === 'fulfilled' && bRes.value.ok) {
        const bData = await bRes.value.json();
        const apiBookings = bData.bookings || [];
        setBookings(apiBookings);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(apiBookings));
        }
      }

      if (lRes.status === 'fulfilled' && lRes.value.ok) {
        const lData = await lRes.value.json();
        const apiLeads = lData.leads || [];
        setLeads(apiLeads);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(apiLeads));
        }
      }

      setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast('Live bookings and enquiries synced!', 'success');
    } catch (e) {
      showToast('Loaded from device memory', 'info');
    }
  };

  useEffect(() => {
    // Actively purge all old mock keys from user's browser localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      [
        'kt_solo_real_bookings_v6', 'kt_solo_real_leads_v6', 'kt_solo_real_chauffeurs_v6',
        'kt_solo_real_bookings_v5', 'kt_solo_real_chauffeurs_v5',
        'kt_solo_real_bookings_v4', 'kt_solo_real_chauffeurs_v4',
        'kt_solo_real_bookings_v3', 'kt_solo_real_leads_v3',
        'kt_admin_bookings_v1', 'kt_admin_leads_v1', 'kt_admin_duty_slips_v1', 'kt_admin_settlements_v1'
      ].forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
      });
    }
    refreshData();
  }, []);

  // Update Chauffeur Assignment
  const handleAssignChauffeur = async (bookingId, assignedChauffeur) => {
    const updated = bookings.map(b => (b.bookingId === bookingId ? { ...b, assignedChauffeur } : b));
    setBookings(updated);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));

    try {
      await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', bookingId, assignedChauffeur })
      });
    } catch (e) {}
  };

  // Update Status
  const handleStatusChange = async (bookingId, manifestStatus) => {
    const updated = bookings.map(b => (b.bookingId === bookingId ? { ...b, manifestStatus } : b));
    setBookings(updated);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));

    try {
      await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', bookingId, manifestStatus })
      });
    } catch (e) {}
  };

  // Update Review Status
  const handleReviewStatusChange = async (bookingId, reviewStatus) => {
    const updated = bookings.map(b => (b.bookingId === bookingId ? { ...b, reviewStatus } : b));
    setBookings(updated);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));

    try {
      await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', bookingId, reviewStatus })
      });
    } catch (e) {}
  };

  // Convert Inquiry to Confirmed Booking (Advance Received)
  const handleConvertToConfirmed = async (newConfirmed, quoteIdToRemove) => {
    const nextList = [newConfirmed, ...bookings];
    setBookings(nextList);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextList));

    if (quoteIdToRemove) {
      const remainingLeads = leads.filter(l => l.quoteId !== quoteIdToRemove);
      setLeads(remainingLeads);
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(remainingLeads));
    }

    try {
      await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfirmed)
      });
    } catch (e) {}
  };

  // Duty Slip Saved (Start/End KM and Final Closure)
  const handleDutySlipSaved = (dutySlip, bookingId, finalFare) => {
    const updated = bookings.map(b => (
      b.bookingId === bookingId
        ? { ...b, manifestStatus: 'Completed', terminalFare: finalFare, financialClosure: 'Unreconciled' }
        : b
    ));
    setBookings(updated);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
    showToast(`Trip ${bookingId} completed! Ready for 5★ review & balance settlement.`, 'success');
  };

  // Record Financial Settlement
  const handleRecordSettlement = async (settlement) => {
    const updated = bookings.map(b => (
      b.bookingId === settlement.bookingId
        ? { ...b, financialClosure: 'Reconciled' }
        : b
    ));
    setBookings(updated);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  };

  // PIN Protection Gate
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-m3-surface text-m3-on-surface flex items-center justify-center p-4 font-sans">
        <div className="bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-2xl p-6 sm:p-8 max-w-sm w-full shadow-m3-3 text-center animate-fadeIn">
          <div className="w-14 h-14 mx-auto rounded-m3-lg bg-logo-red text-white font-black text-2xl flex items-center justify-center shadow-m3-2 mb-4">
            K
          </div>
          <h2 className="text-m3-title-l font-bold text-m3-on-surface">Kalidass Travels</h2>
          <p className="text-m3-body-s text-m3-on-surface-variant mt-1 mb-6">Admin Operations Console • Medavakkam</p>

          <form onSubmit={handleVerifyPin} className="space-y-4">
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
                  setPinInput(e.target.value);
                  setPinError(false);
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

  return (
    <div className="min-h-screen bg-m3-surface text-m3-on-surface font-sans flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-4 z-50 px-4 py-3 rounded-m3-md shadow-m3-3 text-m3-label-m font-semibold flex items-center gap-2.5 animate-fadeIn ${
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

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-m3-surface-container-lowest text-m3-on-surface px-4 sm:px-6 h-16 border-b border-m3-outline-variant/60 flex items-center">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-m3-md bg-logo-red text-white font-black text-base flex items-center justify-center shadow-m3-1 shrink-0">
              K
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-m3-title-s sm:text-m3-title-m font-bold text-m3-on-surface truncate">
                  Kalidass Travels
                </h1>
                <span className="inline-flex items-center gap-1 text-m3-label-s font-medium bg-m3-secondary-container text-m3-on-secondary-container px-2.5 py-0.5 rounded-m3-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-m3-success"></span>
                  <span>Sync {lastSync}</span>
                </span>
              </div>
              <p className="text-m3-body-s text-m3-on-surface-variant truncate hidden sm:block">
                Sole-Operator Booking & Dispatch Workflow • Medavakkam
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
              className={`h-9 px-3 rounded-m3-full text-m3-label-m font-medium border transition-colors flex items-center gap-1.5 ${
                showWorkflowGuide
                  ? 'bg-m3-primary-container text-m3-on-primary-container border-transparent'
                  : 'bg-m3-surface text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
              <span className="hidden md:inline">7-Step Guide</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDriversModalOpen(true)}
              className="h-9 px-3 bg-m3-secondary-container hover:bg-m3-surface-container-high text-m3-on-secondary-container rounded-m3-full text-m3-label-m font-bold flex items-center gap-1.5 transition-colors"
              title="Manage Drivers & Fleet Roster"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span className="hidden sm:inline">Drivers Roster</span>
              <span className="text-m3-label-s px-1.5 py-0.2 rounded-full bg-m3-surface-container-highest">
                {chauffeurs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsPhoneQuoteModalOpen(true)}
              className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-m3-full text-m3-label-m font-bold flex items-center gap-1.5 shadow-m3-1 transition-all"
              title="Take Phone Call & Auto-Calculate Fare"
            >
              <span className="material-symbols-outlined text-[18px]">calculate</span>
              <span className="hidden sm:inline">Phone Rate Calc</span>
              <span className="sm:hidden">Rate Calc</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAiParserModalOpen(true)}
              className="h-9 px-3.5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-m3-label-m font-bold flex items-center gap-1.5 shadow-m3-1 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="hidden sm:inline">AI Quote / Paste</span>
              <span className="sm:hidden">AI Paste</span>
            </button>

            <button
              type="button"
              onClick={refreshData}
              className="w-9 h-9 rounded-m3-full hover:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface flex items-center justify-center transition-colors"
              title="Refresh Data"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.localStorage) {
                  Object.keys(localStorage).forEach(k => {
                    if (k.startsWith('kt_')) localStorage.removeItem(k);
                  });
                }
                setBookings([]);
                setLeads([]);
                setChauffeurs([]);
                refreshData();
                showToast('Local browser storage cleared!', 'info');
              }}
              className="w-9 h-9 rounded-m3-full hover:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface flex items-center justify-center transition-colors"
              title="Purge Browser Cache & Dummy Data"
            >
              <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('kt_admin_pin_verified');
                setIsUnlocked(false);
              }}
              className="w-9 h-9 rounded-m3-full hover:bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface flex items-center justify-center transition-colors"
              title="Lock Console (PIN: 2015)"
            >
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* 7-Step Workflow Guide Banner */}
      {showWorkflowGuide && (
        <div className="bg-m3-surface-container-low border-b border-m3-outline-variant/60 px-4 py-3 animate-fadeIn">
          <div className="max-w-7xl mx-auto space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-m3-label-m font-bold text-m3-on-surface uppercase tracking-wide">
                Main Booking & Operations Workflow (7 Proven Steps)
              </span>
              <button
                type="button"
                onClick={() => setShowWorkflowGuide(false)}
                className="text-m3-on-surface-variant font-bold text-sm"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-m3-body-s">
              {[
                { step: '1. Enquiry', desc: 'Google Ads, Web Calc, WA or Call ➔ Instant Quote' },
                { step: '2. Advance', desc: 'Collect ₹500 via UPI (8939539211@okbizaxis) to lock cab' },
                { step: '3. Driver & Cab', desc: 'Pick from Roster or 1-tap WhatsApp Group Broadcast' },
                { step: '4. Duty Slips', desc: '1-tap WhatsApp Duty Slip to Customer & Driver' },
                { step: '5. Trip Follow', desc: 'Follow trip movement via live /trip/?ref=... link' },
                { step: '6. Collect Bal.', desc: 'End KM, tolls, parking ➔ Collect balance & settle driver' },
                { step: '7. 5★ Review', desc: '1-tap Google Review link sent to customer WhatsApp' }
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-m3-md bg-m3-surface-container-lowest border border-m3-outline-variant/70 text-left"
                >
                  <span className="font-bold text-m3-primary block text-m3-label-s">{item.step}</span>
                  <span className="text-m3-on-surface-variant text-[11px] block mt-0.5 leading-snug">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Single-Workflow Body (Directly Renders UnifiedDutiesBoard) */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3.5 sm:p-5 lg:p-6 min-h-0">
        <UnifiedDutiesBoard
          leads={leads}
          bookings={bookings}
          chauffeurs={chauffeurs}
          onAddManualLead={handleAddManualLead}
          onConvertToConfirmed={handleConvertToConfirmed}
          onAssignChauffeur={handleAssignChauffeur}
          onStatusChange={handleStatusChange}
          onReviewStatusChange={handleReviewStatusChange}
          onOpenDutySlip={(b) => setActiveDutySlipBooking(b)}
          onRecordSettlement={handleRecordSettlement}
          onOpenAiParser={() => setIsAiParserModalOpen(true)}
          onOpenDriversModal={() => setIsDriversModalOpen(true)}
          onOpenPhoneQuoteEngine={() => setIsPhoneQuoteModalOpen(true)}
          showToast={showToast}
        />
      </main>

      {/* Chauffeurs & Commercial Fleet Roster Modal */}
      {isDriversModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-2xl shadow-m3-4 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-m3-outline-variant flex items-center justify-between bg-m3-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary text-[22px]">badge</span>
                <div>
                  <h3 className="text-m3-title-s font-bold text-m3-on-surface">Drivers & Cabs Roster</h3>
                  <p className="text-m3-label-s text-m3-on-surface-variant">Add or manage verified partner drivers for duty assignment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDriversModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <DeskChauffeurs
                chauffeurs={chauffeurs}
                bookings={bookings}
                onAddChauffeur={handleAddChauffeur}
                onDeleteChauffeur={handleDeleteChauffeur}
                showToast={showToast}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Booking / Call Smart Parser Modal */}
      {isAiParserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <AiBookingParser
              showToast={showToast}
              onClose={() => setIsAiParserModalOpen(false)}
              onLeadCreated={(newLead) => {
                handleAddManualLead(newLead);
                setIsAiParserModalOpen(false);
                showToast(`Enquiry ${newLead.quoteId} added to Stage 1 Quotes!`, 'success');
              }}
              onBookingCreated={(newConfirmed) => {
                handleConvertToConfirmed(newConfirmed);
                setIsAiParserModalOpen(false);
                showToast(`Booking ${newConfirmed.bookingId} confirmed in Stage 2 (Need Driver)!`, 'success');
              }}
            />
          </div>
        </div>
      )}

      {/* Inbound Phone Call Rate Calculator & Booking Engine Modal */}
      {isPhoneQuoteModalOpen && (
        <DeskPhoneQuoteEngine
          isOpen={isPhoneQuoteModalOpen}
          onClose={() => setIsPhoneQuoteModalOpen(false)}
          onSaveLead={(newLead) => {
            handleAddManualLead(newLead);
            setIsPhoneQuoteModalOpen(false);
          }}
          onConfirmBooking={(newBooking) => {
            handleConvertToConfirmed(newBooking);
            setIsPhoneQuoteModalOpen(false);
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
    </div>
  );
}
