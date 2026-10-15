import React, { useState, useEffect, useMemo } from 'react';
import DeskInquiries from './solo/DeskInquiries';
import DeskDispatchRadar from './solo/DeskDispatchRadar';
import DeskKhataSettlement from './solo/DeskKhataSettlement';
import SoloDutySlipModal from './solo/SoloDutySlipModal';

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
  const [activeDesk, setActiveDesk] = useState('dispatch'); // 'inquiries', 'dispatch', 'khata'
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

  const [chauffeurs] = useState(DEFAULT_CHAUFFEURS);
  const [toast, setToast] = useState(null);
  const [activeDutySlipBooking, setActiveDutySlipBooking] = useState(null);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Sync with API
  const refreshData = async () => {
    try {
      const [bRes, lRes] = await Promise.allSettled([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/leads')
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

      setLastSync(new Date().toLocaleTimeString());
      showToast('Live bookings & inquiries refreshed!', 'success');
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
    showToast(`Trip ${bookingId} completed! Now ready for Khata settlement.`, 'success');
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

  const completedCount = useMemo(() => {
    return bookings.filter(b => b.manifestStatus === 'Completed').length;
  }, [bookings]);

  return (
    <div className="min-h-screen bg-m3-surface-container text-m3-on-surface pb-20 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-fadeIn ${
          toast.type === 'error' ? 'bg-m3-error text-white' : 'bg-m3-inverse-surface text-m3-success border border-m3-outline-variant/40'
        }`}>
          <span className="material-symbols-outlined text-sm">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-m3-inverse-surface text-white px-4 py-3 shadow-md border-b border-m3-outline-variant/40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-m3-tertiary-container/300 text-m3-on-surface font-black text-sm flex items-center justify-center shadow-inner">
              K
            </span>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                <span>Kalidass Travels</span>
                <span className="text-[10px] font-bold bg-m3-tertiary-container/300/20 text-m3-tertiary px-1.5 py-0.2 rounded border border-m3-tertiary/30">
                  Solo Cockpit
                </span>
              </h1>
              <span className="text-[10px] text-m3-outline-variant font-mono">Sync: {lastSync}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshData}
            className="p-2 rounded-lg bg-m3-surface-container-high hover:bg-m3-surface-container-high text-m3-inverse-on-surface/80 hover:text-white transition-colors"
            title="Refresh Data"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
          </button>
        </div>
      </header>

      {/* Main 3-Desk Navigation Bar */}
      <div className="bg-white border-b border-m3-outline-variant sticky top-14 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveDesk('inquiries')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              activeDesk === 'inquiries'
                ? 'bg-m3-tertiary-container/300 text-m3-on-surface shadow-sm'
                : 'text-m3-on-surface-variant hover:bg-m3-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-sm">forum</span>
            <span>1. Inquiries & Quotes ({leads.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDesk('dispatch')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              activeDesk === 'dispatch'
                ? 'bg-m3-inverse-surface text-white shadow-sm'
                : 'text-m3-on-surface-variant hover:bg-m3-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-sm">directions_car</span>
            <span>2. Confirmed Dispatch ({activeDispatchCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDesk('khata')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              activeDesk === 'khata'
                ? 'bg-m3-success text-white shadow-sm'
                : 'text-m3-on-surface-variant hover:bg-m3-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
            <span>3. Money & Khata ({completedCount})</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto p-3.5 sm:p-5">
        {activeDesk === 'inquiries' && (
          <DeskInquiries
            leads={leads}
            onConvertToConfirmed={handleConvertToConfirmed}
            showToast={showToast}
          />
        )}

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

        {activeDesk === 'khata' && (
          <DeskKhataSettlement
            bookings={bookings}
            settlements={[]}
            onRecordSettlement={handleRecordSettlement}
            showToast={showToast}
          />
        )}
      </main>

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
