import React, { useState, useEffect, useMemo } from 'react';

// Chauffeurs Master Baseline
const DEFAULT_CHAUFFEURS = [
  { name: 'Murugan', phone: '+91 97890 12345', plate: 'TN09 BX 1234', category: 'Sedan (Dzire)', status: 'Available', fcExpiry: '2027-04-15', permitExpiry: '2026-11-20', rating: '4.9' },
  { name: 'Selvam', phone: '+91 98402 54321', plate: 'TN11 CY 5678', category: 'Ertiga (6 Pax)', status: 'Available', fcExpiry: '2026-12-10', permitExpiry: '2027-01-05', rating: '4.8' },
  { name: 'Perumal Manikumar', phone: '+91 89395 39211', plate: 'TN09 CZ 9999', category: 'Innova Crysta', status: 'Available', fcExpiry: '2027-08-30', permitExpiry: '2027-06-15', rating: '4.9' },
  { name: 'Hariharan', phone: '+91 97103 44556', plate: 'TN22 AZ 3421', category: 'Sedan (Etios)', status: 'Available', fcExpiry: '2026-10-28', permitExpiry: '2026-12-01', rating: '4.7' },
  { name: 'Karthik Kumar', phone: '+91 98401 99887', plate: 'TN07 DJ 4321', category: 'Tempo Traveller', status: 'Available', fcExpiry: '2027-02-14', permitExpiry: '2027-03-20', rating: '4.9' },
];

export default function AdminDashboard() {
  // Navigation Desks
  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch', 'leads', 'dutyslip', 'khata', 'fleet', 'pilgrimage'
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Data States
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [dutySlips, setDutySlips] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [chauffeurs, setChauffeurs] = useState(DEFAULT_CHAUFFEURS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modal States
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isDutySlipModalOpen, setIsDutySlipModalOpen] = useState(false);
  const [isQuickCallModalOpen, setIsQuickCallModalOpen] = useState(false);

  // Quick Inbound Phone Call Form State
  const [callForm, setCallForm] = useState({
    callerPhone: '',
    guestName: '',
    route: 'Chennai ➔ Tirupati Round Trip',
    vehicle: 'Sedan (Dzire / Etios)',
    quotedFare: '5500',
    status: 'Call Received - Quoted',
    notes: 'Inbound office phone enquiry'
  });

  // New Booking Form State
  const [newBooking, setNewBooking] = useState({
    guestName: '',
    guestPhone: '',
    travelDate: '',
    pickupTime: '04:30 AM',
    pickupAddress: '',
    vehicleCategory: 'Sedan',
    partySize: '4 Pax',
    fare: '650',
    kycStatus: 'Pending',
    darshanStatus: 'Unassigned',
    assignedChauffeur: 'Unassigned'
  });

  // Duty Slip Form State
  const [slipForm, setSlipForm] = useState({
    bookingId: '',
    guestName: '',
    guestPhone: '',
    chauffeurName: '',
    chauffeurPhone: '',
    vehiclePlate: '',
    startKm: 10000,
    endKm: 10320,
    packageAllowedKm: 300,
    extraKmRate: 14,
    basePackageFare: 5500,
    tollsFastag: 350,
    parking: 100,
    statePermit: 450,
    driverBata: 500,
    advancePaid: 500,
    paymentMode: 'Cash/UPI',
    notes: ''
  });

  // Driver Khata Form State
  const [khataForm, setKhataForm] = useState({
    chauffeurName: 'Murugan',
    bookingId: '#KT-TPT-101',
    guestCashCollected: 6000,
    driverAgreedPayout: 4800,
    tollsPaidByDriver: 350,
    paymentMode: 'UPI',
    upiRef: '',
    notes: ''
  });

  // Initial Fetch
  const fetchData = async () => {
    setLoading(true);
    try {
      const bRes = await fetch('/api/admin/bookings');
      if (bRes.ok) {
        const bData = await bRes.json();
        if (bData.bookings) setBookings(bData.bookings);
      }

      const lRes = await fetch('/api/admin/leads');
      if (lRes.ok) {
        const lData = await lRes.json();
        if (lData.leads) setLeads(lData.leads);
      }

      const dRes = await fetch('/api/admin/duty-slips');
      if (dRes.ok) {
        const dData = await dRes.json();
        if (dData.dutySlips) setDutySlips(dData.dutySlips);
      }

      const sRes = await fetch('/api/admin/settlements');
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.settlements) setSettlements(sData.settlements);
      }

      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to sync admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // KPIs
  const kpis = useMemo(() => {
    const totalBookings = bookings.length;
    const actionRequired = bookings.filter(b => b.manifestStatus === 'Pending' || b.kycStatus === 'Pending').length;
    const inTransit = bookings.filter(b => b.manifestStatus === 'Dispatched' || b.manifestStatus === 'In Transit').length;
    const totalMargin = bookings.reduce((sum, b) => sum + (Number(b.companyMargin) || 0), 0);
    const hotLeads = leads.filter(l => l.status !== 'Converted').length;
    return { totalBookings, actionRequired, inTransit, totalMargin, hotLeads };
  }, [bookings, leads]);

  // Handle PIN unlock
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '2026' || pinInput === '8939') {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Update Booking Status
  const updateBookingStatus = async (bookingId, patch) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', bookingId, ...patch })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, ...patch } : b));
      }
    } catch (err) {
      console.error('Error updating booking:', err);
    }
  };

  // Convert Lead to Booking
  const convertLeadToBooking = (lead) => {
    const bookingId = `#KT-LEAD-${Date.now().toString().slice(-4)}`;
    const guestPhone = '9840100000';
    const guestName = 'Website Visitor';
    const travelDate = 'Tomorrow';
    const pickupTime = '05:00 AM';

    const newRow = {
      bookingId,
      guestNamePhone: `${guestName} (+91 ${guestPhone})`,
      travelDateTime: `${travelDate} @ ${pickupTime}`,
      pickupAddress: lead.pickup || 'Chennai',
      vehicleCategory: lead.vehicle || 'Sedan',
      partySize: '4 Pax',
      kycStatus: 'Pending',
      darshanStatus: lead.tripType?.toLowerCase().includes('temple') || lead.drop?.toLowerCase().includes('tirupati') ? 'In-Process' : 'Unassigned',
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Pending',
      terminalFare: Number(lead.estimatedFare) || 2500,
      chauffeurPayout: Math.round((Number(lead.estimatedFare) || 2500) * 0.8),
      companyMargin: Math.round((Number(lead.estimatedFare) || 2500) * 0.2),
      financialClosure: 'Unreconciled'
    };

    fetch('/api/admin/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRow)
    }).then(res => {
      if (res.ok) {
        setBookings(prev => [newRow, ...prev]);
        fetch('/api/admin/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteId: lead.quoteId, status: 'Converted' })
        });
        setLeads(prev => prev.map(l => l.quoteId === lead.quoteId ? { ...l, status: 'Converted' } : l));
        setActiveTab('dispatch');
      }
    });
  };

  // Create New Booking Submit
  const handleNewBookingSubmit = async (e) => {
    e.preventDefault();
    const bookingId = `#KT-MANUAL-${Date.now().toString().slice(-4)}`;
    const fare = Number(newBooking.fare) || 650;
    const payout = Math.round(fare * 0.8);
    const margin = fare - payout;

    const payload = {
      bookingId,
      guestNamePhone: `${newBooking.guestName} (+91 ${newBooking.guestPhone})`,
      travelDateTime: `${newBooking.travelDate} @ ${newBooking.pickupTime}`,
      pickupAddress: newBooking.pickupAddress,
      vehicleCategory: newBooking.vehicleCategory,
      partySize: newBooking.partySize,
      kycStatus: newBooking.kycStatus,
      darshanStatus: newBooking.darshanStatus,
      assignedChauffeur: newBooking.assignedChauffeur,
      manifestStatus: newBooking.assignedChauffeur !== 'Unassigned' ? 'Dispatched' : 'Pending',
      terminalFare: fare,
      chauffeurPayout: payout,
      companyMargin: margin,
      financialClosure: 'Unreconciled'
    };

    const res = await fetch('/api/admin/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setBookings(prev => [payload, ...prev]);
      setIsNewBookingModalOpen(false);
      setNewBooking({
        guestName: '',
        guestPhone: '',
        travelDate: '',
        pickupTime: '04:30 AM',
        pickupAddress: '',
        vehicleCategory: 'Sedan',
        partySize: '4 Pax',
        fare: '650',
        kycStatus: 'Pending',
        darshanStatus: 'Unassigned',
        assignedChauffeur: 'Unassigned'
      });
    }
  };

  // Quick Log Phone Call Submit
  const handleQuickCallSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/record-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadType: 'call',
          status: callForm.status,
          calculatorEngine: 'Office Phone Desk Log',
          tripType: 'Inbound Phone Enquiry',
          sourcePage: '/admin (Phone Desk)',
          pickup: callForm.guestName ? `${callForm.guestName} (+91 ${callForm.callerPhone})` : `Caller +91 ${callForm.callerPhone}`,
          drop: callForm.route,
          vehicle: callForm.vehicle,
          estimatedFare: callForm.quotedFare,
          metadata: `Direct Caller: +91 ${callForm.callerPhone} | Notes: ${callForm.notes}`
        })
      });

      if (res.ok) {
        setIsQuickCallModalOpen(false);
        setCallForm({
          callerPhone: '',
          guestName: '',
          route: 'Chennai ➔ Tirupati Round Trip',
          vehicle: 'Sedan (Dzire / Etios)',
          quotedFare: '5500',
          status: 'Call Received - Quoted',
          notes: 'Inbound office phone enquiry'
        });
        await fetchData();
        setActiveTab('leads');
      }
    } catch (err) {
      console.error('Failed to log inbound call:', err);
    }
  };

  // Open Duty Slip for Booking
  const openDutySlipForBooking = (b) => {
    const fare = Number(b.terminalFare) || 5000;
    setSlipForm({
      bookingId: b.bookingId,
      guestName: b.guestNamePhone.split('(')[0].trim(),
      guestPhone: b.guestNamePhone.match(/\+91\s*([0-9\s]+)/)?.[1]?.replace(/\s/g, '') || '',
      chauffeurName: b.assignedChauffeur !== 'Unassigned' ? b.assignedChauffeur.split('(')[0].trim() : 'Murugan',
      chauffeurPhone: b.assignedChauffeur.match(/\+91\s*([0-9\s]+)/)?.[1]?.replace(/\s/g, '') || '+91 97890 12345',
      vehiclePlate: b.assignedChauffeur.split('-')[1]?.trim() || 'TN09 BX 1234',
      startKm: 14200,
      endKm: 14550,
      packageAllowedKm: 300,
      extraKmRate: 14,
      basePackageFare: fare,
      tollsFastag: 350,
      parking: 100,
      statePermit: 450,
      driverBata: 500,
      advancePaid: 500,
      paymentMode: 'Cash/UPI',
      notes: ''
    });
    setIsDutySlipModalOpen(true);
  };

  // Submit Duty Slip
  const handleDutySlipSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/duty-slips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slipForm)
    });

    if (res.ok) {
      const data = await res.json();
      setDutySlips(prev => [data.dutySlip, ...prev]);
      updateBookingStatus(slipForm.bookingId, {
        manifestStatus: 'Duty Slip Closed',
        financialClosure: 'Pending Settlement'
      });
      setIsDutySlipModalOpen(false);
      setActiveTab('dutyslip');
    }
  };

  // Submit Khata Settlement
  const handleKhataSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/settlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(khataForm)
    });

    if (res.ok) {
      const data = await res.json();
      setSettlements(prev => [data.settlement, ...prev]);
      if (khataForm.bookingId) {
        updateBookingStatus(khataForm.bookingId, {
          financialClosure: 'Settled (UPI)'
        });
      }
      alert('Driver settlement recorded successfully!');
    }
  };

  // 1-Click WhatsApp Links
  const getDriverManifestWhatsapp = (b) => {
    const text = `*KALIDASS TRAVELS — DUTY ASSIGNMENT*\n` +
      `Booking ID: ${b.bookingId}\n` +
      `Guest: ${b.guestNamePhone}\n` +
      `Travel Date/Time: ${b.travelDateTime}\n` +
      `Pickup Location: ${b.pickupAddress}\n` +
      `Vehicle: ${b.vehicleCategory} (Capacity: ${b.partySize})\n` +
      `Terminal Fare: Rs.${b.terminalFare}\n` +
      `Driver Payout: Rs.${b.chauffeurPayout}\n` +
      `Duty Status: Dispatched\n\n` +
      `Please call guest 15 mins prior to arrival. Safe journey!`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const getGuestConfirmationWhatsapp = (b) => {
    const text = `*KALIDASS TRAVELS — BOOKING CONFIRMATION*\n` +
      `Booking ID: ${b.bookingId}\n` +
      `Dear Guest, your cab has been allocated:\n\n` +
      `Chauffeur: ${b.assignedChauffeur}\n` +
      `Travel Date/Time: ${b.travelDateTime}\n` +
      `Pickup Address: ${b.pickupAddress}\n` +
      `Car Category: ${b.vehicleCategory}\n` +
      `Estimated Fare: Rs.${b.terminalFare}\n\n` +
      `24x7 Operations Desk: +91 89395 39211\n` +
      `Thank you for traveling with Kalidass Travels Chennai!`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const getLeadQuoteWhatsapp = (lead) => {
    const text = `*KALIDASS TRAVELS — EXCLUSIVE QUOTATION*\n` +
      `Hello! Thank you for inquiring about your travel with Kalidass Travels Chennai.\n\n` +
      `Route: ${lead.pickup} -> ${lead.drop}\n` +
      `Vehicle: ${lead.vehicle || 'AC Sedan'}\n` +
      `Distance: Approx ${lead.distanceKm} km\n` +
      `*All-Inclusive Estimated Fare: Rs.${lead.estimatedFare}*\n` +
      `(Includes Driver Bata & Clean AC Vehicle)\n\n` +
      `Would you like to confirm with our Rs.500 token deposit? Reply 'YES' to confirm!`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // Computations
  const computedSlip = useMemo(() => {
    const totalKm = Math.max(0, Number(slipForm.endKm) - Number(slipForm.startKm));
    const extraKm = Math.max(0, totalKm - Number(slipForm.packageAllowedKm));
    const extraKmCost = extraKm * Number(slipForm.extraKmRate);
    const gross = Number(slipForm.basePackageFare) + extraKmCost + Number(slipForm.tollsFastag) + Number(slipForm.parking) + Number(slipForm.statePermit) + Number(slipForm.driverBata);
    const balance = Math.max(0, gross - Number(slipForm.advancePaid));
    return { totalKm, extraKm, extraKmCost, gross, balance };
  }, [slipForm]);

  const computedKhataNet = useMemo(() => {
    const collected = Number(khataForm.guestCashCollected) || 0;
    const payout = Number(khataForm.driverAgreedPayout) || 0;
    const tolls = Number(khataForm.tollsPaidByDriver) || 0;
    return collected - (payout + tolls);
  }, [khataForm]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    if (!searchQuery) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter(b =>
      b.bookingId.toLowerCase().includes(q) ||
      b.guestNamePhone.toLowerCase().includes(q) ||
      b.pickupAddress.toLowerCase().includes(q) ||
      b.assignedChauffeur.toLowerCase().includes(q) ||
      b.vehicleCategory.toLowerCase().includes(q)
    );
  }, [bookings, searchQuery]);

  // Grouped Kanban Columns
  const kanban = useMemo(() => {
    return {
      unassigned: filteredBookings.filter(b => b.assignedChauffeur === 'Unassigned' || b.manifestStatus === 'Pending'),
      assigned: filteredBookings.filter(b => b.assignedChauffeur !== 'Unassigned' && b.manifestStatus === 'Dispatched'),
      inTransit: filteredBookings.filter(b => b.manifestStatus === 'In Transit' || b.manifestStatus === 'On Road'),
      slipPending: filteredBookings.filter(b => b.manifestStatus === 'Duty Slip Closed' && b.financialClosure === 'Pending Settlement'),
      settled: filteredBookings.filter(b => b.financialClosure.includes('Settled'))
    };
  }, [filteredBookings]);

  // M3 Lock Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl text-center">
          <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200/60 shadow-xs">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">KALIDASS COMMAND TOWER</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Enter security PIN to access the operations console</p>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN (Default: 2026)"
              className="w-full text-center tracking-[0.5em] text-2xl py-3 bg-[#F9FAFB] border border-slate-300 rounded-2xl text-slate-900 font-mono-code focus:border-[#1E252D] focus:ring-2 focus:ring-[#1E252D]/10 focus:outline-none transition-all"
              autoFocus
            />
            {pinError && <p className="text-xs text-rose-600 font-semibold">Invalid PIN. Try 2026 or 8939.</p>}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#1E252D] hover:bg-[#111827] text-white font-bold text-sm uppercase rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              Unlock Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col font-sans">
      
      {/* ============================================================== */}
      {/* 1. M3 TOP APP BAR & TELEMETRY STRIP                            */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand & Flight Deck Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
              <span className="text-base font-extrabold tracking-tight text-[#1E252D] uppercase">KALIDASS COMMAND TOWER</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline uppercase tracking-wider">
              DISPATCH • FLEET • CASHBOOK
            </span>
          </div>

          {/* Actions & Live Telemetry */}
          <div className="flex items-center gap-3">
            {/* Live Connected Chip */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>LIVE SYNC: {lastSyncTime}</span>
            </div>

            {/* Total Margin Pill */}
            <div className="hidden lg:flex items-center gap-1 px-3.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200/80 text-xs font-bold">
              <span className="text-slate-500 font-normal">EST. MARGIN:</span>
              <span className="text-emerald-700">₹{kpis.totalMargin.toLocaleString()}</span>
            </div>

            {/* Quick Log Call M3 Button */}
            <button
              onClick={() => setIsQuickCallModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-[#1E252D] text-xs sm:text-sm font-bold border border-slate-200/90 shadow-xs transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-600">phone_in_talk</span>
              <span>+ LOG CALL</span>
            </button>

            {/* New Booking M3 Button */}
            <button
              onClick={() => setIsNewBookingModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-[#1E252D] hover:bg-[#111827] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>NEW BOOKING</span>
            </button>

            {/* Sync Button */}
            <button
              onClick={fetchData}
              title="Force Telemetry Sync"
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
            </button>

            {/* Lock Button */}
            <button
              onClick={() => setIsUnlocked(false)}
              title="Lock Console"
              className="p-2 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200/80 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </button>
          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. M3 KPI METRIC TILES (UNIFIED CALM NEUTRAL TONAL SURFACES)   */}
      {/* ============================================================== */}
      <section className="px-4 sm:px-6 py-4 max-w-[1720px] mx-auto w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* Tile 1: Active Trips */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ACTIVE TRIPS</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[#111827] tracking-tight">{kpis.totalBookings}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-400 uppercase tracking-tight">ALL VERTICAL MANIFESTS</p>
          </div>

          {/* Tile 2: Action Needed (Subtle dot indicator only, calm neutral container) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {kpis.actionRequired > 0 && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">ACTION NEEDED</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">priority_high</span>
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[#111827] tracking-tight">{kpis.actionRequired}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-400 uppercase tracking-tight">UNASSIGNED / PENDING KYC</p>
          </div>

          {/* Tile 3: Hot Leads */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">HOT LEADS</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">calculate</span>
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[#111827] tracking-tight">{kpis.hotLeads}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-400 uppercase tracking-tight">CALCULATOR ENQUIRIES</p>
          </div>

          {/* Tile 4: In Transit */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">IN TRANSIT</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">route</span>
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[#111827] tracking-tight">{kpis.inTransit}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-400 uppercase tracking-tight">ON HIGHWAY EN ROUTE</p>
          </div>

          {/* Tile 5: Net Agency Margin */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AGENCY MARGIN</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[#111827] tracking-tight">₹{kpis.totalMargin.toLocaleString()}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-400 uppercase tracking-tight">ESTIMATED NET CONTRACT</p>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. M3 SEGMENTED FILTER PILLS & SEARCH BAR                      */}
      {/* ============================================================== */}
      <section className="px-4 sm:px-6 py-2 max-w-[1720px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Segmented Pill Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab('dispatch')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'dispatch'
                  ? 'bg-[#1E252D] text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              <span>1. DISPATCH KANBAN</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'dispatch' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'leads'
                  ? 'bg-[#1E252D] text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calculate</span>
              <span>2. LEADS FUNNEL</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'leads' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {kpis.hotLeads}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dutyslip')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'dutyslip'
                  ? 'bg-[#1E252D] text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>3. DIGITAL DUTY SLIPS</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'dutyslip' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {dutySlips.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('khata')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'khata'
                  ? 'bg-[#1E252D] text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              <span>4. DRIVER KHATA</span>
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'fleet'
                  ? 'bg-[#1E252D] text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span>5. FLEET ROSTER</span>
            </button>

            <button
              onClick={() => setActiveTab('pilgrimage')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'pilgrimage'
                  ? 'bg-[#1E252D] text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">temple_hindu</span>
              <span>6. TIRUPATI DESK</span>
            </button>
          </div>

          {/* Search Pill */}
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by ref, guest, driver..."
              className="w-full bg-white border border-slate-300 rounded-full pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E252D]/15 focus:border-[#1E252D] shadow-xs transition-all"
            />
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. MAIN WORKSPACE CONTENT                                      */}
      {/* ============================================================== */}
      <main className="flex-1 px-4 sm:px-6 py-4 max-w-[1720px] mx-auto w-full">

        {/* ============================================================== */}
        {/* DESK 1: DISPATCH KANBAN BOARD                                   */}
        {/* ============================================================== */}
        {activeTab === 'dispatch' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#111827] tracking-tight">Live Dispatch Flight Board</h2>
                <p className="text-xs text-slate-500">Track trips through their operational state machine</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">Auto-updating telemetry</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
              
              {/* Column 1: Unassigned / New Inquiries */}
              <div className="bg-[#F3F4F6] border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>1. NEW / UNASSIGNED</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-700 text-xs font-bold shadow-2xs border border-slate-200/80">
                    {kanban.unassigned.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[420px]">
                  {kanban.unassigned.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">No pending unassigned trips</div>
                  ) : (
                    kanban.unassigned.map(b => (
                      <div key={b.bookingId} className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono-code text-[11px] font-bold">
                            {b.bookingId}
                          </span>
                          <span className="text-slate-400 text-[11px] font-medium">{b.travelDateTime}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{b.guestNamePhone}</p>
                          <p className="text-xs text-slate-500 truncate mt-1 flex items-center gap-1" title={b.pickupAddress}>
                            <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                            {b.pickupAddress}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="font-medium text-slate-600">{b.vehicleCategory} ({b.partySize})</span>
                          <span className="font-bold text-slate-900">₹{b.terminalFare}</span>
                        </div>

                        {/* Assign Driver Dropdown */}
                        <div className="space-y-1 pt-1">
                          <label className="text-[11px] font-semibold text-slate-500">Quick Assign Chauffeur:</label>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                const ch = chauffeurs.find(c => c.name === e.target.value);
                                updateBookingStatus(b.bookingId, {
                                  assignedChauffeur: `${ch.name} (${ch.phone}) - ${ch.plate}`,
                                  manifestStatus: 'Dispatched'
                                });
                              }
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                          >
                            <option value="">Select Chauffeur...</option>
                            {chauffeurs.map(c => (
                              <option key={c.name} value={c.name}>{c.name} ({c.category}) - {c.status}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Driver Allocated / Dispatched */}
              <div className="bg-[#F3F4F6] border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>2. DRIVER ALLOCATED</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-700 text-xs font-bold shadow-2xs border border-slate-200/80">
                    {kanban.assigned.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[420px]">
                  {kanban.assigned.map(b => (
                    <div key={b.bookingId} className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono-code text-[11px] font-bold">
                          {b.bookingId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                          ALLOCATED
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{b.guestNamePhone}</p>
                        <p className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-slate-500">directions_car</span>
                          {b.assignedChauffeur}
                        </p>
                      </div>

                      {/* Tonal WhatsApp Dispatches */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={getDriverManifestWhatsapp(b)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold transition-colors"
                          title="Send manifest to driver via WhatsApp"
                        >
                          <span className="material-symbols-outlined text-[14px]">send</span>
                          DRIVER
                        </a>
                        <a
                          href={getGuestConfirmationWhatsapp(b)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 text-xs font-bold transition-colors"
                          title="Send cab & driver details to customer via WhatsApp"
                        >
                          <span className="material-symbols-outlined text-[14px]">chat</span>
                          GUEST
                        </a>
                      </div>

                      <button
                        onClick={() => updateBookingStatus(b.bookingId, { manifestStatus: 'In Transit' })}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-full border border-slate-200/80 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                        MARK TRIP STARTED
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: In Transit / On Road */}
              <div className="bg-[#F3F4F6] border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>3. ON HIGHWAY / ROLLING</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-700 text-xs font-bold shadow-2xs border border-slate-200/80">
                    {kanban.inTransit.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[420px]">
                  {kanban.inTransit.map(b => (
                    <div key={b.bookingId} className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono-code text-[11px] font-bold">
                          {b.bookingId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                          ON ROAD
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{b.guestNamePhone}</p>
                      <p className="text-xs text-slate-600 font-medium">{b.assignedChauffeur}</p>
                      
                      <button
                        onClick={() => openDutySlipForBooking(b)}
                        className="w-full mt-2 py-2 rounded-full bg-[#1E252D] hover:bg-[#111827] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                        GENERATE DUTY SLIP
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 4: Duty Slip Pending Settlement */}
              <div className="bg-[#F3F4F6] border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>4. DUTY SLIP PENDING</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-700 text-xs font-bold shadow-2xs border border-slate-200/80">
                    {kanban.slipPending.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[420px]">
                  {kanban.slipPending.map(b => (
                    <div key={b.bookingId} className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono-code text-[11px] font-bold">
                          {b.bookingId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                          SLIP RECORDED
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{b.guestNamePhone}</p>
                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between">
                        <span>Fare: ₹{b.terminalFare}</span>
                        <span>Payout: ₹{b.chauffeurPayout}</span>
                      </div>

                      <button
                        onClick={() => {
                          setKhataForm({
                            chauffeurName: b.assignedChauffeur.split('(')[0].trim(),
                            bookingId: b.bookingId,
                            guestCashCollected: Number(b.terminalFare) || 5000,
                            driverAgreedPayout: Number(b.chauffeurPayout) || 4000,
                            tollsPaidByDriver: 350,
                            paymentMode: 'UPI',
                            upiRef: '',
                            notes: ''
                          });
                          setActiveTab('khata');
                        }}
                        className="w-full py-2 bg-[#1E252D] hover:bg-[#111827] text-white font-bold text-xs rounded-full shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[15px]">payments</span>
                        RECONCILE IN KHATA
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 5: Settled & Closed */}
              <div className="bg-[#F3F4F6] border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>5. SETTLED & CLOSED</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-700 text-xs font-bold shadow-2xs border border-slate-200/80">
                    {kanban.settled.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[420px]">
                  {kanban.settled.map(b => (
                    <div key={b.bookingId} className="bg-white/95 rounded-xl p-3.5 border border-slate-200/80 shadow-xs space-y-2 opacity-85 hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono-code text-[11px] font-bold">
                          {b.bookingId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                          SETTLED
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">{b.guestNamePhone.split('(')[0]}</p>
                      <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                        <span>Agency Margin:</span>
                        <strong className="text-slate-900 font-bold">₹{b.companyMargin}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DESK 2: LEADS & ABANDONED QUOTES RECOVERY                       */}
        {/* ============================================================== */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#111827] tracking-tight">Website Calculator Leads Funnel</h2>
                <p className="text-xs text-slate-500">Visitors who calculated fares on your website. Call or WhatsApp within 3 mins to close.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsQuickCallModalOpen(true)}
                  className="px-4 py-2 bg-[#1E252D] hover:bg-[#111827] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">add_call</span>
                  + LOG INCOMING CALL
                </button>
                <span className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-full shadow-xs">
                  Total Leads: <strong className="text-[#1E252D]">{leads.length}</strong>
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#F8F9FA] text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Quote Ref</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Route (Pickup ➔ Drop)</th>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Est. Distance</th>
                      <th className="py-3 px-4">Quoted Fare</th>
                      <th className="py-3 px-4">Funnel Status</th>
                      <th className="py-3 px-4 text-right">Owner Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {leads.map(lead => (
                      <tr key={lead.quoteId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono-code font-bold text-[#1E252D]">{lead.quoteId}</td>
                        <td className="py-3 px-4 text-slate-500">{lead.timestamp}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{lead.pickup}</span>
                          <span className="text-slate-400 mx-2">➔</span>
                          <span className="font-bold text-amber-700">{lead.drop}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-medium text-slate-800">
                            {lead.vehicle || 'Sedan'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{lead.distanceKm} km</td>
                        <td className="py-3 px-4 text-base font-extrabold text-[#111827]">₹{lead.estimatedFare}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            lead.status === 'Converted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            lead.status?.includes('Quoted') ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                            lead.status?.includes('Call') ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            lead.status?.includes('WhatsApp') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <a
                            href={getLeadQuoteWhatsapp(lead)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs shadow-xs transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">send</span>
                            WHATSAPP QUOTE
                          </a>
                          {lead.status !== 'Converted' && (
                            <button
                              onClick={() => convertLeadToBooking(lead)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1E252D] hover:bg-[#111827] text-white font-bold text-xs shadow-xs transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">add_task</span>
                              CONVERT TO BOOKING
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DESK 3: DIGITAL DUTY SLIP (TRIP SHEET) STUDIO                   */}
        {/* ============================================================== */}
        {activeTab === 'dutyslip' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#111827] tracking-tight">Digital Duty Slip (Trip Sheet) Studio</h2>
                <p className="text-xs text-slate-500">Standardized transport duty slips capturing start/end KM, tolls, and guest invoicing.</p>
              </div>
              <button
                onClick={() => setIsDutySlipModalOpen(true)}
                className="px-5 py-2.5 bg-[#1E252D] hover:bg-[#111827] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                CREATE STANDALONE DUTY SLIP
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dutySlips.length === 0 ? (
                <div className="col-span-full p-12 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-2xl shadow-xs">
                  No duty slips generated yet. Click "GENERATE DUTY SLIP" on any active trip in the Dispatch Kanban.
                </div>
              ) : (
                dutySlips.map(slip => (
                  <div key={slip.slipId} className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 text-xs shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">DUTY SLIP REF</span>
                        <h3 className="text-slate-900 font-mono-code font-bold text-sm">{slip.slipId}</h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        FINALIZED
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-slate-900 font-bold text-sm">{slip.guestName}</p>
                      <p className="text-slate-500 text-xs">
                        Chauffeur: <strong className="text-slate-800">{slip.chauffeurName}</strong> ({slip.vehiclePlate})
                      </p>
                    </div>

                    <div className="bg-[#F9FAFB] rounded-xl p-3 space-y-1.5 text-xs text-slate-700 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Start KM ➔ End KM:</span>
                        <strong className="text-slate-900 font-mono-code">{slip.startKm} ➔ {slip.endKm}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Travelled:</span>
                        <strong>{slip.totalKm} km ({slip.extraKm} km Extra)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Base Package Fare:</span>
                        <span>₹{slip.basePackageFare}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tolls & State Permit:</span>
                        <span>₹{slip.tollsFastag + slip.statePermit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Driver Daily Bata:</span>
                        <span>₹{slip.driverBata}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                        <span>Gross Bill:</span>
                        <span>₹{slip.grossFare}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-emerald-700 text-sm">
                        <span>Balance Collected:</span>
                        <span>₹{slip.netBalanceToCollect}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(slip.whatsappSummary || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-full text-center flex items-center justify-center gap-1 shadow-xs transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">share</span>
                        WHATSAPP RECEIPT
                      </a>
                      <button
                        onClick={() => window.print()}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-full transition-colors"
                        title="Print Trip Sheet"
                      >
                        <span className="material-symbols-outlined text-[16px]">print</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DESK 4: DRIVER KHATA & EVENING SETTLEMENT                       */}
        {/* ============================================================== */}
        {activeTab === 'khata' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Settlement Calculator Form */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-sm text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-[#111827] tracking-tight">Driver Khata Reconciler</h2>
                <p className="text-xs text-slate-500">Calculate net cash driver owes office or vice versa</p>
              </div>

              <form onSubmit={handleKhataSubmit} className="space-y-3.5">
                <div>
                  <label className="font-semibold text-slate-600">Chauffeur:</label>
                  <select
                    value={khataForm.chauffeurName}
                    onChange={(e) => setKhataForm(prev => ({ ...prev, chauffeurName: e.target.value }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  >
                    {chauffeurs.map(c => (
                      <option key={c.name} value={c.name}>{c.name} ({c.plate})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Booking / Trip Reference:</label>
                  <input
                    type="text"
                    value={khataForm.bookingId}
                    onChange={(e) => setKhataForm(prev => ({ ...prev, bookingId: e.target.value }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono-code focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                    placeholder="#KT-101"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Total Cash/UPI Collected from Guest (₹):</label>
                  <input
                    type="number"
                    value={khataForm.guestCashCollected}
                    onChange={(e) => setKhataForm(prev => ({ ...prev, guestCashCollected: Number(e.target.value) }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-extrabold text-base focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600">Driver Payout (₹):</label>
                    <input
                      type="number"
                      value={khataForm.driverAgreedPayout}
                      onChange={(e) => setKhataForm(prev => ({ ...prev, driverAgreedPayout: Number(e.target.value) }))}
                      className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Tolls Paid (₹):</label>
                    <input
                      type="number"
                      value={khataForm.tollsPaidByDriver}
                      onChange={(e) => setKhataForm(prev => ({ ...prev, tollsPaidByDriver: Number(e.target.value) }))}
                      className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Net Closing Position Box */}
                <div className={`p-4 rounded-2xl border ${
                  computedKhataNet >= 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="text-[11px] font-bold uppercase tracking-wider">NET CLOSING POSITION:</div>
                  <div className="text-xl font-extrabold mt-1">
                    {computedKhataNet >= 0 ? (
                      <span>Driver Owes Agency: ₹{computedKhataNet}</span>
                    ) : (
                      <span>Agency Pays Driver: ₹{Math.abs(computedKhataNet)}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600">UPI Ref / Notes:</label>
                  <input
                    type="text"
                    value={khataForm.upiRef}
                    onChange={(e) => setKhataForm(prev => ({ ...prev, upiRef: e.target.value }))}
                    placeholder="e.g. GPay UPI/624910248"
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1E252D] hover:bg-[#111827] text-white font-bold rounded-full uppercase shadow-sm transition-all"
                >
                  Record Settlement & Close
                </button>
              </form>
            </div>

            {/* Historical Settlements Table */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-sm text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-[#111827] tracking-tight">Settlement History Ledger</h2>
                <span className="text-slate-400 text-xs font-medium">Recent Khata Closures</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-[#F8F9FA] text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Date/Time</th>
                      <th className="p-3">Chauffeur</th>
                      <th className="p-3">Booking ID</th>
                      <th className="p-3">Cash Collected</th>
                      <th className="p-3">Driver Share</th>
                      <th className="p-3">Net Office Profit</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {settlements.map(s => (
                      <tr key={s.settlementId} className="hover:bg-slate-50/70">
                        <td className="p-3 text-slate-500">{new Date(s.timestamp).toLocaleString()}</td>
                        <td className="p-3 font-bold text-slate-900">{s.chauffeurName}</td>
                        <td className="p-3 font-mono-code font-semibold text-[#1E252D]">{s.bookingId}</td>
                        <td className="p-3 font-extrabold text-slate-900">₹{s.guestCashCollected}</td>
                        <td className="p-3">₹{s.driverAgreedPayout}</td>
                        <td className="p-3 font-bold text-emerald-700">₹{s.netOfficeReceivable}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            {s.settlementStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* DESK 5: FLEET & COMPLIANCE ROSTER                              */}
        {/* ============================================================== */}
        {activeTab === 'fleet' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#111827] tracking-tight">Fleet & Chauffeur Roster</h2>
                <p className="text-xs text-slate-500">Track driver availability, vehicle category, and commercial compliance expirations.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chauffeurs.map(ch => (
                <div key={ch.name} className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 text-xs shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{ch.name}</h3>
                      <p className="text-slate-500 text-xs">{ch.phone}</p>
                    </div>
                    <select
                      value={ch.status}
                      onChange={(e) => {
                        const next = e.target.value;
                        setChauffeurs(prev => prev.map(c => c.name === ch.name ? { ...c, status: next } : c));
                      }}
                      className={`text-xs font-bold rounded-full px-3 py-1 border transition-colors ${
                        ch.status === 'Available' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        ch.status === 'On Trip' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Off Duty">Off Duty</option>
                    </select>
                  </div>

                  <div className="bg-[#F9FAFB] rounded-xl p-3 space-y-1.5 text-xs border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Vehicle:</span>
                      <strong className="text-slate-900 font-mono-code">{ch.plate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Category:</span>
                      <strong className="text-slate-800">{ch.category}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Driver Rating:</span>
                      <span className="text-amber-700 font-bold">★ {ch.rating}</span>
                    </div>
                  </div>

                  {/* Compliance Expirations */}
                  <div className="space-y-1 pt-1 border-t border-slate-100 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fitness Cert (FC):</span>
                      <span className="text-emerald-700 font-bold">{ch.fcExpiry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">All-India Permit:</span>
                      <span className="text-emerald-700 font-bold">{ch.permitExpiry}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DESK 6: TIRUPATI PILGRIMAGE LOGISTICS                          */}
        {/* ============================================================== */}
        {activeTab === 'pilgrimage' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#111827] tracking-tight">Tirupati & Pilgrimage Logistics Console</h2>
                <p className="text-xs text-slate-500">Manage TTD ₹300 SED Darshan slots, Aadhaar KYC verification, and morning departure schedules.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-[#F8F9FA] text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Booking ID</th>
                      <th className="p-3.5">Guest & Family</th>
                      <th className="p-3.5">Pickup Date/Time</th>
                      <th className="p-3.5">Party Size</th>
                      <th className="p-3.5">SED Darshan Status</th>
                      <th className="p-3.5">Aadhaar KYC</th>
                      <th className="p-3.5">Assigned Chauffeur</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {bookings.filter(b => b.darshanStatus !== 'Unassigned' || b.pickupAddress.toLowerCase().includes('tirupati') || b.bookingId.includes('TPT')).map(b => (
                      <tr key={b.bookingId} className="hover:bg-slate-50/70">
                        <td className="p-3.5 font-mono-code font-bold text-[#1E252D]">{b.bookingId}</td>
                        <td className="p-3.5 font-bold text-slate-900">{b.guestNamePhone}</td>
                        <td className="p-3.5 text-slate-500">{b.travelDateTime}</td>
                        <td className="p-3.5">{b.partySize}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            b.darshanStatus.includes('Confirmed') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {b.darshanStatus}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            b.kycStatus === 'Verified' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                            {b.kycStatus}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">{b.assignedChauffeur}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              updateBookingStatus(b.bookingId, {
                                kycStatus: b.kycStatus === 'Verified' ? 'Pending' : 'Verified',
                                darshanStatus: b.darshanStatus.includes('Confirmed') ? 'In-Process' : 'Confirmed (11:30 AM)'
                              });
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-colors"
                          >
                            TOGGLE STATUS
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* MODAL: QUICK NEW BOOKING (M3 DIALOG)                            */}
      {/* ============================================================== */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#111827] tracking-tight">Manual Booking Entry</h3>
              <button onClick={() => setIsNewBookingModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleNewBookingSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600">Guest Name:</label>
                  <input
                    type="text"
                    required
                    value={newBooking.guestName}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, guestName: e.target.value }))}
                    placeholder="Ramesh Kumar"
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Guest Phone:</label>
                  <input
                    type="text"
                    required
                    value={newBooking.guestPhone}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, guestPhone: e.target.value }))}
                    placeholder="98401 23456"
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600">Pickup Address:</label>
                <input
                  type="text"
                  required
                  value={newBooking.pickupAddress}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, pickupAddress: e.target.value }))}
                  placeholder="#12, 4th Main Road, Anna Nagar East"
                  className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600">Pickup Date:</label>
                  <input
                    type="text"
                    required
                    value={newBooking.travelDate}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, travelDate: e.target.value }))}
                    placeholder="15-Oct-2026"
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Pickup Time:</label>
                  <input
                    type="text"
                    required
                    value={newBooking.pickupTime}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, pickupTime: e.target.value }))}
                    placeholder="04:30 AM"
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600">Vehicle Category:</label>
                  <select
                    value={newBooking.vehicleCategory}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, vehicleCategory: e.target.value }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  >
                    <option value="Sedan">Sedan (Dzire / Etios)</option>
                    <option value="Ertiga">Ertiga (6 Pax)</option>
                    <option value="Innova Crysta">Innova Crysta</option>
                    <option value="Tempo">Tempo Traveller (12+ Pax)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Terminal Fare (₹):</label>
                  <input
                    type="number"
                    required
                    value={newBooking.fare}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, fare: e.target.value }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-extrabold focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600">Assign Chauffeur (Optional):</label>
                <select
                  value={newBooking.assignedChauffeur}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, assignedChauffeur: e.target.value }))}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                >
                  <option value="Unassigned">Leave Unassigned</option>
                  {chauffeurs.map(c => (
                    <option key={c.name} value={`${c.name} (${c.phone}) - ${c.plate}`}>{c.name} ({c.category}) - {c.plate}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1E252D] hover:bg-[#111827] text-white font-bold rounded-full shadow-sm"
                >
                  Save & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DIGITAL DUTY SLIP CREATOR (M3 DIALOG)                    */}
      {/* ============================================================== */}
      {isDutySlipModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#111827] tracking-tight">Generate Digital Trip Duty Slip</h3>
              <button onClick={() => setIsDutySlipModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleDutySlipSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600">Trip Reference:</label>
                  <input
                    type="text"
                    required
                    value={slipForm.bookingId}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, bookingId: e.target.value }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-[#1E252D] font-mono-code font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Guest Name:</label>
                  <input
                    type="text"
                    required
                    value={slipForm.guestName}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, guestName: e.target.value }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600">Chauffeur:</label>
                  <input
                    type="text"
                    required
                    value={slipForm.chauffeurName}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, chauffeurName: e.target.value }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Vehicle Plate:</label>
                  <input
                    type="text"
                    required
                    value={slipForm.vehiclePlate}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 bg-[#F9FAFB] p-3 rounded-2xl border border-slate-100">
                <div>
                  <label className="font-semibold text-slate-600">Start Odometer:</label>
                  <input
                    type="number"
                    required
                    value={slipForm.startKm}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, startKm: Number(e.target.value) }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900 font-mono-code"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">End Odometer:</label>
                  <input
                    type="number"
                    required
                    value={slipForm.endKm}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, endKm: Number(e.target.value) }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900 font-mono-code"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Package Allowance:</label>
                  <input
                    type="number"
                    value={slipForm.packageAllowedKm}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, packageAllowedKm: Number(e.target.value) }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900 font-mono-code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-600">FASTag Tolls (₹):</label>
                  <input
                    type="number"
                    value={slipForm.tollsFastag}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, tollsFastag: Number(e.target.value) }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">State Permit (₹):</label>
                  <input
                    type="number"
                    value={slipForm.statePermit}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, statePermit: Number(e.target.value) }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Advance Paid (₹):</label>
                  <input
                    type="number"
                    value={slipForm.advancePaid}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, advancePaid: Number(e.target.value) }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-emerald-700 font-bold"
                  />
                </div>
              </div>

              {/* Real-time Duty Slip Calculation Summary */}
              <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-4 space-y-1.5 text-xs text-emerald-950">
                <div className="flex justify-between">
                  <span className="text-emerald-800">Total Distance:</span>
                  <strong>{computedSlip.totalKm} km ({computedSlip.extraKm} km extra @ ₹{slipForm.extraKmRate})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-800">Gross Trip Bill:</span>
                  <strong className="text-emerald-950">₹{computedSlip.gross}</strong>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-2 text-sm font-extrabold text-emerald-900">
                  <span>BALANCE TO COLLECT:</span>
                  <span>₹{computedSlip.balance}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDutySlipModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1E252D] hover:bg-[#111827] text-white font-bold rounded-full shadow-sm"
                >
                  Finalize Slip & Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: 10-SECOND QUICK INCOMING CALL LOGGER (M3 DIALOG)         */}
      {/* ============================================================== */}
      {isQuickCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                  <span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#111827] tracking-tight">10-Sec Quick Call Logger</h3>
                  <p className="text-[11px] text-slate-400">Capture received phone calls instantly to prevent lead leakage</p>
                </div>
              </div>
              <button onClick={() => setIsQuickCallModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleQuickCallSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Caller Mobile Phone *</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">+91</span>
                    <input
                      type="tel"
                      required
                      value={callForm.callerPhone}
                      onChange={(e) => setCallForm(prev => ({ ...prev, callerPhone: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="98401 23456"
                      className="w-full pl-12 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-sm focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Customer / Company Name</label>
                  <input
                    type="text"
                    value={callForm.guestName}
                    onChange={(e) => setCallForm(prev => ({ ...prev, guestName: e.target.value }))}
                    placeholder="e.g. Mr. Senthil"
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Requested Route / Travel Detail</label>
                <input
                  type="text"
                  required
                  value={callForm.route}
                  onChange={(e) => setCallForm(prev => ({ ...prev, route: e.target.value }))}
                  placeholder="e.g. Chennai ➔ Tirupati One Day Round Trip"
                  className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Vehicle Type</label>
                  <select
                    value={callForm.vehicle}
                    onChange={(e) => setCallForm(prev => ({ ...prev, vehicle: e.target.value }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  >
                    <option value="Sedan (Dzire / Etios)">Sedan (Dzire / Etios)</option>
                    <option value="Ertiga (6 Pax)">Ertiga (6 Pax)</option>
                    <option value="Innova Crysta">Innova Crysta (7 Pax)</option>
                    <option value="Tempo Traveller">Tempo Traveller (12+ Pax)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Quoted Fare (₹)</label>
                  <input
                    type="number"
                    value={callForm.quotedFare}
                    onChange={(e) => setCallForm(prev => ({ ...prev, quotedFare: e.target.value }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900 font-bold focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Call Status</label>
                  <select
                    value={callForm.status}
                    onChange={(e) => setCallForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  >
                    <option value="Call Received - Quoted">Call Received - Quoted</option>
                    <option value="Needs Follow-up">Needs Follow-up (High Interest)</option>
                    <option value="Callback Requested">Callback Requested</option>
                    <option value="Lost - Rate Issue">Lost - Rate Issue</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Attendant Notes</label>
                  <input
                    type="text"
                    value={callForm.notes}
                    onChange={(e) => setCallForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g. Needs early 4:30 AM pickup"
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-[#1E252D] focus:ring-1 focus:ring-[#1E252D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsQuickCallModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1E252D] hover:bg-[#111827] text-white font-bold rounded-full shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Log to Leads Funnel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
