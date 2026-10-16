import React, { useState, useEffect, useMemo } from 'react';
import DeskInquiries from './solo/DeskInquiries';
import DeskDispatchRadar from './solo/DeskDispatchRadar';
import DeskKhataSettlement from './solo/DeskKhataSettlement';
import DeskChauffeurs from './solo/DeskChauffeurs';
import SoloDutySlipModal from './solo/SoloDutySlipModal';
import AiBookingParser from './solo/AiBookingParser';

const DEFAULT_CHAUFFEURS = [
  { name: 'Murugan', phone: '+91 97890 12345', plate: 'TN09 BX 1234', category: 'Sedan (Dzire)', status: 'Available', rating: '4.9' },
  { name: 'Selvam', phone: '+91 98402 54321', plate: 'TN11 CY 5678', category: 'Ertiga (6 Pax)', status: 'Available', rating: '4.8' },
  { name: 'Perumal Manikumar', phone: '+91 89395 39211', plate: 'TN09 CZ 9999', category: 'Innova Crysta', status: 'Available', rating: '4.9' },
  { name: 'Hariharan', phone: '+91 97103 44556', plate: 'TN22 AZ 3421', category: 'Sedan (Etios)', status: 'Available', rating: '4.7' },
  { name: 'Karthik Kumar', phone: '+91 98401 99887', plate: 'TN07 DJ 4321', category: 'Tempo Traveller', status: 'Available', rating: '4.9' }
];

const SEED_BOOKINGS = [
  {
    bookingId: '#KT-TPT-101',
    guestNamePhone: 'Senthil Nathan (+91 98401 22334)',
    travelDateTime: 'Tomorrow @ 04:30 AM',
    pickupAddress: 'T. Nagar, Chennai ➔ Tirupati Balaji Temple',
    vehicleCategory: 'Innova Crysta',
    partySize: '6 Pax',
    kycStatus: 'Verified',
    darshanStatus: 'Assigned',
    assignedChauffeur: 'Perumal Manikumar - TN09 CZ 9999',
    manifestStatus: 'Dispatched',
    terminalFare: 10000,
    chauffeurPayout: 8000,
    companyMargin: 2000,
    advancePaid: 1000,
    balanceDue: 9000,
    financialClosure: 'Unreconciled'
  },
  {
    bookingId: '#KT-PND-103',
    guestNamePhone: 'Anand Krishnan (+91 98410 77665)',
    travelDateTime: 'Today @ 06:00 AM',
    pickupAddress: 'Adyar, Chennai ➔ White Town, Pondicherry',
    vehicleCategory: 'Ertiga (6 Pax)',
    partySize: '5 Pax',
    kycStatus: 'Verified',
    darshanStatus: 'N/A',
    assignedChauffeur: 'Selvam - TN11 CY 5678',
    manifestStatus: 'In Transit',
    terminalFare: 5500,
    chauffeurPayout: 4400,
    companyMargin: 1100,
    advancePaid: 500,
    balanceDue: 5000,
    financialClosure: 'Unreconciled'
  },
  {
    bookingId: '#KT-TPT-105',
    guestNamePhone: 'Karthikeyan (+91 98803 09619)',
    travelDateTime: '25-Oct-2026 @ 05:00 AM',
    pickupAddress: 'Medavakkam, Chennai ➔ Tirupati Special Darshan',
    vehicleCategory: 'Innova Crysta',
    partySize: '6 Pax',
    kycStatus: 'Verified',
    darshanStatus: 'Assigned',
    assignedChauffeur: 'Unassigned',
    manifestStatus: 'Pending',
    terminalFare: 10000,
    chauffeurPayout: 8000,
    companyMargin: 2000,
    advancePaid: 1000,
    balanceDue: 9000,
    financialClosure: 'Unreconciled'
  }
];

const SEED_LEADS = [
  {
    quoteId: '#INQ-98803',
    timestamp: 'Just now',
    sourcePage: 'WhatsApp (+91 98803 09619)',
    tripType: 'Round Trip',
    pickup: 'Medavakkam, Chennai',
    drop: 'Tirupati Balaji Temple',
    vehicle: 'Innova Crysta',
    partySize: '6 Pax',
    estimatedFare: 10000,
    status: 'Inquiry'
  },
  {
    quoteId: '#INQ-73038',
    timestamp: '2 hours ago',
    sourcePage: 'WhatsApp (+91 73038 09755)',
    tripType: 'Round Trip',
    pickup: 'Velachery, Chennai',
    drop: 'Pondicherry (Rock Beach)',
    vehicle: 'Sedan (Dzire / Etios)',
    partySize: '3 Pax',
    estimatedFare: 4500,
    status: 'Quoted'
  }
];

const STORAGE_KEYS = {
  BOOKINGS: 'kt_solo_real_bookings_v3',
  LEADS: 'kt_solo_real_leads_v3'
};

export default function SoloAdminDashboard() {
  const [activeDesk, setActiveDesk] = useState('dispatch'); // 'dispatch', 'inquiries', 'chauffeurs', 'khata'
  const [isAiParserModalOpen, setIsAiParserModalOpen] = useState(false);

  const [bookings, setBookings] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return SEED_BOOKINGS;
  });

  const [leads, setLeads] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = localStorage.getItem(STORAGE_KEYS.LEADS);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return SEED_LEADS;
  });

  const [chatQueries, setChatQueries] = useState([]);
  const [chauffeurs] = useState(DEFAULT_CHAUFFEURS);
  const [toast, setToast] = useState(null);
  const [activeDutySlipBooking, setActiveDutySlipBooking] = useState(null);
  const [lastSync, setLastSync] = useState('Live');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Sync with API
  const refreshData = async () => {
    try {
      const [bRes, lRes, cRes] = await Promise.allSettled([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/leads'),
        fetch('/api/admin/chat-logs')
      ]);

      if (bRes.status === 'fulfilled' && bRes.value.ok) {
        const bData = await bRes.value.json();
        if (bData.bookings && bData.bookings.length > 0) {
          setBookings(bData.bookings);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bData.bookings));
          }
        }
      }

      if (lRes.status === 'fulfilled' && lRes.value.ok) {
        const lData = await lRes.value.json();
        if (lData.leads && lData.leads.length > 0) {
          setLeads(lData.leads.slice(0, 10));
        }
      }

      if (cRes.status === 'fulfilled' && cRes.value.ok) {
        const cData = await cRes.value.json();
        if (cData.queries && cData.queries.length > 0) {
          setChatQueries(cData.queries);
        }
      }

      setLastSync(new Date().toLocaleTimeString());
      showToast('Live bookings, inquiries & AI chat radar refreshed!', 'success');
    } catch (e) {
      showToast('Loaded from local device cache', 'success');
    }
  };

  useEffect(() => {
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

    setActiveDesk('dispatch'); // Switch user to live dispatch desk
  };

  // Duty Slip Saved
  const handleDutySlipSaved = (dutySlip, bookingId, finalFare) => {
    const updated = bookings.map(b => (
      b.bookingId === bookingId
        ? { ...b, manifestStatus: 'Completed', terminalFare: finalFare, financialClosure: 'Unreconciled' }
        : b
    ));
    setBookings(updated);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
    showToast(`Trip ${bookingId} completed! Ready for Khata settlement.`, 'success');
  };

  // Record Settlement
  const handleRecordSettlement = async (settlement) => {
    const updated = bookings.map(b => (
      b.bookingId === settlement.bookingId
        ? { ...b, financialClosure: 'Reconciled' }
        : b
    ));
    setBookings(updated);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  };

  // Counter metrics
  const activeDispatchCount = useMemo(() => {
    return bookings.filter(b => b.manifestStatus !== 'Completed' && b.manifestStatus !== 'Cancelled').length;
  }, [bookings]);

  const unassignedCount = useMemo(() => {
    return bookings.filter(b => 
      b.manifestStatus !== 'Completed' && 
      b.manifestStatus !== 'Cancelled' && 
      (!b.assignedChauffeur || b.assignedChauffeur === 'Unassigned')
    ).length;
  }, [bookings]);

  const completedCount = useMemo(() => {
    return bookings.filter(b => b.manifestStatus === 'Completed').length;
  }, [bookings]);

  const totalInquiriesCount = leads.length + chatQueries.length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fadeIn border ${
          toast.type === 'error'
            ? 'bg-rose-600 text-white border-rose-700'
            : 'bg-slate-900 text-emerald-400 border-slate-700'
        }`}>
          <span className="material-symbols-outlined text-sm">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Global Top App Bar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 lg:px-6 py-2.5 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & Sync Pill */}
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white font-black text-base flex items-center justify-center shadow-md">
              K
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold tracking-tight text-white">Kalidass Travels</h1>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Command Cockpit
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Sync: {lastSync}</span>
              </div>
            </div>
          </div>

          {/* Action Center */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAiParserModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span className="hidden sm:inline">⚡ AI Smart Parse & Quick Quote</span>
              <span className="sm:hidden">⚡ Quick Quote</span>
            </button>

            <button
              type="button"
              onClick={refreshData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
              title="Open Public Website"
            >
              <span>Site</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Responsive Body with Navigation Rail */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-4 p-3.5 sm:p-5 lg:p-6">
        {/* Navigation Rail / Sidebar */}
        <aside className="w-full md:w-60 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-sm space-y-1 sticky top-16">
            <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Operations Desks
            </div>

            {/* 1. Live Dispatch */}
            <button
              type="button"
              onClick={() => setActiveDesk('dispatch')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 text-left ${
                activeDesk === 'dispatch'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-base">directions_car</span>
                <span className="truncate">Live Dispatch</span>
              </div>
              <div className="flex items-center gap-1">
                {unassignedCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title={`${unassignedCount} trips need driver`}></span>
                )}
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                  activeDesk === 'dispatch' ? 'bg-slate-800 text-amber-300 font-bold' : 'bg-slate-100 text-slate-600'
                }`}>
                  {activeDispatchCount}
                </span>
              </div>
            </button>

            {/* 2. Leads & Quotes */}
            <button
              type="button"
              onClick={() => setActiveDesk('inquiries')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 text-left ${
                activeDesk === 'inquiries'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-base">forum</span>
                <span className="truncate">Leads & Quotes</span>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                activeDesk === 'inquiries' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-100 text-slate-600'
              }`}>
                {totalInquiriesCount}
              </span>
            </button>

            {/* 3. Chauffeurs & Fleet */}
            <button
              type="button"
              onClick={() => setActiveDesk('chauffeurs')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 text-left ${
                activeDesk === 'chauffeurs'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-base">badge</span>
                <span className="truncate">Chauffeurs & Fleet</span>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                activeDesk === 'chauffeurs' ? 'bg-blue-700 text-white font-bold' : 'bg-slate-100 text-slate-600'
              }`}>
                {chauffeurs.length}
              </span>
            </button>

            {/* 4. Money & Khata */}
            <button
              type="button"
              onClick={() => setActiveDesk('khata')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 text-left ${
                activeDesk === 'khata'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                <span className="truncate">Money & Khata</span>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                activeDesk === 'khata' ? 'bg-emerald-700 text-white font-bold' : 'bg-slate-100 text-slate-600'
              }`}>
                {completedCount}
              </span>
            </button>
          </nav>
        </aside>

        {/* Center Main Stage Area */}
        <main className="flex-1 min-w-0">
          {activeDesk === 'dispatch' && (
            <DeskDispatchRadar
              bookings={bookings}
              chauffeurs={chauffeurs}
              onAssignChauffeur={handleAssignChauffeur}
              onStatusChange={handleStatusChange}
              onOpenDutySlip={(b) => setActiveDutySlipBooking(b)}
              showToast={showToast}
            />
          )}

          {activeDesk === 'inquiries' && (
            <DeskInquiries
              leads={leads}
              chatQueries={chatQueries}
              onConvertToConfirmed={handleConvertToConfirmed}
              onOpenAiParser={() => setIsAiParserModalOpen(true)}
              showToast={showToast}
            />
          )}

          {activeDesk === 'chauffeurs' && (
            <DeskChauffeurs
              chauffeurs={chauffeurs}
              bookings={bookings}
              showToast={showToast}
            />
          )}

          {activeDesk === 'khata' && (
            <DeskKhataSettlement
              bookings={bookings}
              settlements={[]}
              onRecordSettlement={handleRecordSettlement}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Universal AI Smart Parser Modal */}
      {isAiParserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <AiBookingParser
              showToast={showToast}
              onClose={() => setIsAiParserModalOpen(false)}
              onBookingCreated={(newConfirmed) => {
                handleConvertToConfirmed(newConfirmed);
                setIsAiParserModalOpen(false);
                showToast(`Booking ${newConfirmed.bookingId} added directly to Live Dispatch!`, 'success');
              }}
            />
          </div>
        </div>
      )}

      {/* Duty Slip Modal */}
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
