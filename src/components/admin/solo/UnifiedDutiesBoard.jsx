import React, { useState, useMemo } from 'react';
import { buildMapsBlock } from '../../../utils/whatsapp';

export default function UnifiedDutiesBoard({
  leads = [],
  bookings = [],
  chauffeurs = [],
  onAddManualLead,
  onConvertToConfirmed,
  onAssignChauffeur,
  onStatusChange,
  onReviewStatusChange,
  onOpenDutySlip,
  onRecordSettlement,
  onOpenAiParser,
  onOpenDriversModal,
  onOpenPhoneQuoteEngine,
  showToast
}) {
  // Indecab-style unified status filter tabs: 'ALL' | 'QUOTES' | 'NEED_DRIVER' | 'ON_TRIP' | 'COMPLETED'
  const [stageTab, setStageTab] = useState('ALL');
  const [showQuickBar, setShowQuickBar] = useState(false);
  const [enquirySourceFilter, setEnquirySourceFilter] = useState('ALL');

  const [quickEntry, setQuickEntry] = useState({
    guestName: '',
    phone: '',
    source: 'Phone Call',
    travelDate: '',
    pickup: '',
    drop: '',
    vehicle: 'Sedan (Dzire / Etios)',
    fare: '',
    advance: '500'
  });

  const [outsideDriverMap, setOutsideDriverMap] = useState({});
  const [showOutsideFormId, setShowOutsideFormId] = useState(null);

  const needDriverBookings = useMemo(
    () => bookings.filter(b => b.manifestStatus !== 'Completed' && b.manifestStatus !== 'Cancelled' && (!b.assignedChauffeur || b.assignedChauffeur === 'Unassigned')),
    [bookings]
  );

  const allottedLiveBookings = useMemo(
    () => bookings.filter(b => b.manifestStatus !== 'Completed' && b.manifestStatus !== 'Cancelled' && b.assignedChauffeur && b.assignedChauffeur !== 'Unassigned'),
    [bookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter(b => b.manifestStatus === 'Completed'),
    [bookings]
  );

  const validLeads = useMemo(
    () => leads.filter(l => Number(l.estimatedFare) > 0 && !(l.drop || '').toLowerCase().includes('whatsapp chat')),
    [leads]
  );

  const totalCommissionEarned = useMemo(
    () => completedBookings.reduce((sum, b) => sum + Number(b.companyMargin || (b.terminalFare - b.chauffeurPayout) || 0), 0),
    [completedBookings]
  );

  const filteredLeads = useMemo(() => {
    return validLeads.filter(l => {
      if (enquirySourceFilter === 'ALL') return true;
      const combined = `${l.sourcePage || ''} ${l.calculatorEngine || ''} ${l.metadata || ''}`.toLowerCase();
      if (enquirySourceFilter === 'GOOGLE_ADS') {
        return combined.includes('google ads') || combined.includes('call campaign');
      }
      if (enquirySourceFilter === 'OLD_CUSTOMER') {
        return combined.includes('old') || combined.includes('repeat');
      }
      if (enquirySourceFilter === 'WHATSAPP') {
        return (l.quoteId || '').startsWith('#WA') || combined.includes('whatsapp');
      }
      if (enquirySourceFilter === 'CALCULATOR') {
        return (l.quoteId || '').startsWith('#CALC') || (l.quoteId || '').startsWith('#QT') || combined.includes('calculator') || combined.includes('desk rate');
      }
      return true;
    });
  }, [validLeads, enquirySourceFilter]);

  const extractLeadPhone = (lead) => {
    const combined = `${lead.sourcePage || ''} ${lead.pickup || ''} ${lead.guestName || ''} ${lead.metadata || ''}`;
    const match = combined.match(/[6-9]\d{9}/);
    return match ? match[0] : '';
  };

  const handleSendFollowUpWA = (lead) => {
    const cleanPhone = extractLeadPhone(lead);
    const guestName = lead.guestName || 'Sir/Madam';
    const fare = Number(lead.estimatedFare) || 0;
    const msg =
      `Namaskaram ${guestName} ji! 🙏\n\n` +
      `Following up from *Kalidass Travels Chennai* regarding your trip inquiry:\n` +
      `📍 *Route:* ${lead.pickup} ➔ ${lead.drop}\n` +
      `🚗 *Vehicle:* ${lead.vehicle} (${lead.tripType || 'Outstation'})\n` +
      (fare > 0 ? `💰 *Fare Quoted:* Rs.${fare.toLocaleString('en-IN')}\n\n` : `\n`) +
      `Shall we confirm and block your cab? 🚕\n` +
      `To lock the vehicle & driver, kindly transfer *Rs.500 Advance* via UPI to *8939539211@okbizaxis* (Kalidass Travels) and share the screenshot.\n\n` +
      `For any route queries, call us anytime at +91 89395 39211. Thank you!`;
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.(`Follow-up reminder sent to ${guestName}!`, 'success');
  };

  const displayedBookings = useMemo(() => {
    if (stageTab === 'NEED_DRIVER') return needDriverBookings;
    if (stageTab === 'ON_TRIP') return allottedLiveBookings;
    if (stageTab === 'COMPLETED') return completedBookings;
    return [...needDriverBookings, ...allottedLiveBookings];
  }, [stageTab, needDriverBookings, allottedLiveBookings, completedBookings]);

  const getTripUrl = (booking) => {
    const cleanRef = (booking.bookingId || '').replace(/[^A-Za-z0-9]/g, '');
    const base =
      typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}/trip/?ref=${cleanRef}`
        : `https://kalidasstravels.in/trip/?ref=${cleanRef}`;
    try {
      const compact = {
        bookingId: booking.bookingId,
        guestNamePhone: booking.guestNamePhone,
        travelDateTime: booking.travelDateTime,
        pickupAddress: booking.pickupAddress,
        vehicleCategory: booking.vehicleCategory,
        partySize: booking.partySize,
        assignedChauffeur: booking.assignedChauffeur,
        manifestStatus: booking.manifestStatus,
        terminalFare: booking.terminalFare,
        chauffeurPayout: booking.chauffeurPayout,
        advancePaid: booking.advancePaid || 0
      };
      return `${base}&d=${encodeURIComponent(btoa(encodeURIComponent(JSON.stringify(compact))))}`;
    } catch (_) {
      return base;
    }
  };
  const handleQuickSaveQuote = (e) => {
    e.preventDefault();
    if (!quickEntry.phone.trim() && !quickEntry.guestName.trim()) {
      showToast?.('Please enter Customer Name or Mobile Number', 'error');
      return;
    }
    const cleanPhone = quickEntry.phone.replace(/[^0-9]/g, '').slice(-10);
    const fareNum = Number(quickEntry.fare) || 0;
    const newLead = {
      quoteId: `#QT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      guestName: quickEntry.guestName.trim() || (cleanPhone ? `Customer (${cleanPhone})` : 'Phone Caller'),
      sourcePage: cleanPhone ? `${quickEntry.source} (+91 ${cleanPhone})` : quickEntry.source,
      calculatorEngine: quickEntry.source,
      tripType: 'Round Trip',
      pickup: quickEntry.pickup.trim() || 'Chennai',
      drop: quickEntry.drop.trim() || 'Outstation',
      vehicle: quickEntry.vehicle,
      estimatedFare: fareNum,
      travelDate: quickEntry.travelDate,
      status: 'Quote Sent - Waiting Advance'
    };
    onAddManualLead?.(newLead);
    if (cleanPhone) {
      handleSendQuoteWA(newLead);
    }
    setQuickEntry({
      guestName: '',
      phone: '',
      source: 'Phone Call',
      travelDate: '',
      pickup: '',
      drop: '',
      vehicle: 'Sedan (Dzire / Etios)',
      fare: '',
      advance: '500'
    });
    setShowQuickBar(false);
  };

  const handleQuickConfirmBooking = () => {
    if (!quickEntry.phone.trim() && !quickEntry.guestName.trim()) {
      showToast?.('Please enter Customer Name or Mobile Number', 'error');
      return;
    }
    const cleanPhone = quickEntry.phone.replace(/[^0-9]/g, '').slice(-10);
    const fareNum = Number(quickEntry.fare) || 0;
    const advNum = Number(quickEntry.advance) || 0;
    const driverShare = Math.round(fareNum * 0.82);
    const newBooking = {
      bookingId: `#KT-${Date.now().toString().slice(-4)}`,
      guestNamePhone: `${quickEntry.guestName.trim() || 'Customer'}${cleanPhone ? ` (+91 ${cleanPhone})` : ''}`,
      travelDateTime: quickEntry.travelDate || '',
      pickupAddress: `${quickEntry.pickup.trim() || 'Chennai'} ➔ ${quickEntry.drop.trim() || 'Outstation'}`,
      vehicleCategory: quickEntry.vehicle,
      partySize: '4 Pax',
      kycStatus: 'Advance Paid',
      darshanStatus: quickEntry.source,
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Need Driver',
      terminalFare: fareNum,
      chauffeurPayout: driverShare,
      companyMargin: fareNum - driverShare,
      advancePaid: advNum,
      balanceDue: Math.max(0, fareNum - advNum),
      financialClosure: 'Unreconciled',
      reviewStatus: 'Pending'
    };
    onConvertToConfirmed?.(newBooking);
    setQuickEntry({
      guestName: '',
      phone: '',
      source: 'Phone Call',
      travelDate: '',
      pickup: '',
      drop: '',
      vehicle: 'Sedan (Dzire / Etios)',
      fare: '',
      advance: '500'
    });
    setShowQuickBar(false);
    setStageTab('NEED_DRIVER');
  };

  const handleSendQuoteWA = (lead) => {
    const phoneMatch = (lead.sourcePage || '').match(/[6-9]\d{9}/);
    const cleanPhone = phoneMatch ? phoneMatch[0] : '';
    const fare = Number(lead.estimatedFare) || 6000;
    const mapsBlock = buildMapsBlock(lead.pickup, lead.drop, lead.tripType || 'Round Trip');
    const msg =
      `*KALIDASS TRAVELS CHENNAI — TRIP QUOTATION*\n\n` +
      `Namaskaram ${lead.guestName || 'Sir/Madam'}!\n` +
      `📍 *Route:* ${lead.pickup} ➔ ${lead.drop}\n` +
      `🚗 *Vehicle:* ${lead.vehicle}\n` +
      `💰 *All-Inclusive Fare:* Rs.${fare.toLocaleString('en-IN')}\n` +
      `🔒 *To Confirm Cab:* Pay *Rs.500 Advance* via UPI to *8939539211@okbizaxis* (Kalidass Travels).` +
      mapsBlock;
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };
  const handleLockLeadWithAdvance = (lead) => {
    const phoneMatch = (lead.sourcePage || '').match(/[6-9]\d{9}/);
    const cleanPhone = phoneMatch ? phoneMatch[0] : '9840100000';
    const fare = Number(lead.estimatedFare) || 6000;
    const driverShare = Math.round(fare * 0.82);
    const guestLabel = lead.guestName || (lead.pickup.includes('+91') ? lead.pickup.split('(')[0].trim() : 'Customer');
    const routeLabel = lead.pickup.includes('+91') ? lead.drop : `${lead.pickup} ➔ ${lead.drop}`;

    const confirmed = {
      bookingId: `#KT-${Date.now().toString().slice(-4)}`,
      guestNamePhone: `${guestLabel} (+91 ${cleanPhone})`,
      travelDateTime: lead.travelDate || 'Tomorrow @ 05:00 AM',
      pickupAddress: routeLabel,
      vehicleCategory: lead.vehicle || 'Sedan (Dzire / Etios)',
      partySize: '4 Pax',
      kycStatus: 'Advance Paid',
      darshanStatus: lead.calculatorEngine || 'WhatsApp',
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Need Driver',
      terminalFare: fare,
      chauffeurPayout: driverShare,
      companyMargin: fare - driverShare,
      advancePaid: 500,
      balanceDue: Math.max(0, fare - 500),
      financialClosure: 'Unreconciled',
      reviewStatus: 'Pending'
    };
    onConvertToConfirmed?.(confirmed, lead.quoteId);
    showToast?.(`Booking ${confirmed.bookingId} confirmed with ₹500 advance! Now assign a driver.`, 'success');
  };

  const handleBroadcastToDriverGroup = (b) => {
    const fare = Number(b.terminalFare) || 0;
    const margin = Number(b.companyMargin) || Math.round(fare * 0.18);
    const driverNet = Math.max(0, fare - margin);
    const msg =
      `🚕 *DUTY AVAILABLE — KALIDASS TRAVELS*\n` +
      `Booking ID: *${b.bookingId}*\n` +
      `🗓 *Pickup:* ${b.travelDateTime}\n` +
      `📍 *Route:* ${b.pickupAddress}\n` +
      `🚗 *Vehicle:* ${b.vehicleCategory}\n` +
      `💰 *Driver Net Share:* *Rs.${driverNet.toLocaleString('en-IN')} Net* (+ Tolls/Parking paid by guest)\n` +
      `📱 *Reply with Driver Name & Car Number to take this duty!*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSendCustomerDutySlip = (b) => {
    const phoneMatch = (b.guestNamePhone || '').match(/[6-9]\d{9}/);
    const cleanPhone = phoneMatch ? phoneMatch[0] : '';
    const guestName = (b.guestNamePhone || 'Customer').split('(')[0].trim();
    const tripUrl = getTripUrl(b);
    const fare = Number(b.terminalFare) || 0;
    const adv = Number(b.advancePaid) || 0;
    const bal = Math.max(0, fare - adv);
    const msg =
      `*KALIDASS TRAVELS — CUSTOMER DUTY SLIP*\n` +
      `Booking ID: *${b.bookingId}*\n\n` +
      `👨‍✈️ *Driver & Vehicle:* ${b.assignedChauffeur}\n` +
      `🚗 *Cab:* ${b.vehicleCategory}\n` +
      `🗓 *Pickup:* ${b.travelDateTime}\n` +
      `📍 *Route:* ${b.pickupAddress}\n` +
      `💰 *Total Fare:* Rs.${fare.toLocaleString('en-IN')} | *Advance:* Rs.${adv} | *Balance:* Rs.${bal.toLocaleString('en-IN')}\n\n` +
      `📱 *Open Digital Duty Slip & Live Status:*\n${tripUrl}`;
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSendDriverDutySlip = (b) => {
    const phoneMatch = (b.assignedChauffeur || '').match(/[6-9]\d{9}/);
    const cleanPhone = phoneMatch ? phoneMatch[0] : '';
    const tripUrl = getTripUrl(b);
    const fare = Number(b.terminalFare) || 0;
    const adv = Number(b.advancePaid) || 0;
    const bal = Math.max(0, fare - adv);
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.pickupAddress || 'Chennai')}`;
    const msg =
      `🚕 *KALIDASS TRAVELS — DRIVER DUTY SLIP*\n` +
      `Trip ID: *${b.bookingId}*\n` +
      `👤 *Customer:* ${b.guestNamePhone}\n` +
      `🗓 *Pickup:* ${b.travelDateTime}\n` +
      `📍 *Route:* ${b.pickupAddress}\n` +
      `🗺️ *Maps Pin:* ${mapsLink}\n` +
      `💵 *Collect Balance from Guest at Drop:* *Rs.${bal.toLocaleString('en-IN')}*\n` +
      `📱 *Enter Start/End KM & Toll Bill Here:*\n${tripUrl}`;
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSendReviewWA = (b) => {
    const phoneMatch = (b.guestNamePhone || '').match(/[6-9]\d{9}/);
    const cleanPhone = phoneMatch ? phoneMatch[0] : '';
    const guestName = (b.guestNamePhone || 'Customer').split('(')[0].trim();
    const msg =
      `Namaskaram ${guestName} ji! 🙏 Thank you for travelling with *Kalidass Travels Chennai*.\n\n` +
      `⭐⭐⭐⭐⭐ Kindly share your 5-star Google review here:\nhttps://share.google/1IOq41QwMkhDJvrLY\n\n` +
      `Your feedback means the world to our family-run team. Thank you! 🙏`;
    onReviewStatusChange?.(b.bookingId, 'Requested');
    showToast?.(`Review request sent to ${guestName}!`, 'success');
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };
  const STAGE_TABS = [
    { id: 'ALL', label: 'All Active Duties', count: validLeads.length + needDriverBookings.length + allottedLiveBookings.length },
    { id: 'QUOTES', label: '1. Quotes / Enquiries', count: validLeads.length },
    { id: 'NEED_DRIVER', label: '2. Need Driver', count: needDriverBookings.length },
    { id: 'ON_TRIP', label: '3. Allotted / On Trip', count: allottedLiveBookings.length },
    { id: 'COMPLETED', label: '4. Completed & Review', count: completedBookings.length }
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Top 4-Stage Summary Cards (Click any card to filter immediately) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button type="button" onClick={() => setStageTab('QUOTES')} className={`text-left p-4 rounded-m3-xl border transition-all ${stageTab === 'QUOTES' ? 'bg-m3-primary-container/40 border-m3-primary shadow-m3-1' : 'bg-m3-surface-container-lowest border-m3-outline-variant/70 hover:bg-m3-surface-container-low'}`}>
          <div className="flex items-center justify-between text-m3-on-surface-variant mb-1">
            <span className="text-m3-label-s font-bold uppercase">Stage 1: Enquiries</span>
            <span className="material-symbols-outlined text-[18px] text-m3-primary">forum</span>
          </div>
          <div className="text-m3-headline-s font-bold text-m3-on-surface">{validLeads.length}</div>
          <span className="text-m3-label-s text-m3-on-surface-variant block mt-0.5">Send quote & get ₹500 advance</span>
        </button>

        <button type="button" onClick={() => setStageTab('NEED_DRIVER')} className={`text-left p-4 rounded-m3-xl border transition-all ${stageTab === 'NEED_DRIVER' ? 'bg-m3-error-container/40 border-m3-error shadow-m3-1' : 'bg-m3-surface-container-lowest border-m3-outline-variant/70 hover:bg-m3-surface-container-low'}`}>
          <div className="flex items-center justify-between text-m3-error mb-1">
            <span className="text-m3-label-s font-bold uppercase">Stage 2: Need Driver</span>
            <span className="material-symbols-outlined text-[18px] text-m3-error">person_add</span>
          </div>
          <div className="text-m3-headline-s font-bold text-m3-error">{needDriverBookings.length}</div>
          <span className="text-m3-label-s text-m3-on-surface-variant block mt-0.5">Advance paid ➔ Assign driver/cab</span>
        </button>

        <button type="button" onClick={() => setStageTab('ON_TRIP')} className={`text-left p-4 rounded-m3-xl border transition-all ${stageTab === 'ON_TRIP' ? 'bg-m3-primary-container/40 border-m3-primary shadow-m3-1' : 'bg-m3-surface-container-lowest border-m3-outline-variant/70 hover:bg-m3-surface-container-low'}`}>
          <div className="flex items-center justify-between text-m3-primary mb-1">
            <span className="text-m3-label-s font-bold uppercase">Stage 3: Allotted / Live</span>
            <span className="material-symbols-outlined text-[18px] text-m3-primary">local_taxi</span>
          </div>
          <div className="text-m3-headline-s font-bold text-m3-primary">{allottedLiveBookings.length}</div>
          <span className="text-m3-label-s text-m3-on-surface-variant block mt-0.5">Send Duty Slips & track trip</span>
        </button>

        <button type="button" onClick={() => setStageTab('COMPLETED')} className={`text-left p-4 rounded-m3-xl border transition-all ${stageTab === 'COMPLETED' ? 'bg-m3-success-container/40 border-m3-success shadow-m3-1' : 'bg-m3-surface-container-lowest border-m3-outline-variant/70 hover:bg-m3-surface-container-low'}`}>
          <div className="flex items-center justify-between text-m3-success mb-1">
            <span className="text-m3-label-s font-bold uppercase">Stage 4: Completed</span>
            <span className="material-symbols-outlined text-[18px] text-m3-success">account_balance_wallet</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-m3-headline-s font-bold text-m3-success">{completedBookings.length}</span>
            <span className="text-m3-label-s font-bold bg-m3-success-container text-m3-on-success-container px-2 py-0.5 rounded-m3-full">
              +Rs.{totalCommissionEarned.toLocaleString('en-IN')} Profit
            </span>
          </div>
          <span className="text-m3-label-s text-m3-on-surface-variant block mt-0.5">Collect commission & 5★ review</span>
        </button>
      </div>
        {/* 2. Fast Phone / WhatsApp Intake Bar Header (Zero Duplicate Tabs) */}
        <div className="bg-m3-surface-container-lowest rounded-m3-xl p-3.5 border border-m3-outline-variant/70 shadow-m3-1 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-m3-primary text-[20px]">local_taxi</span>
              <span className="text-m3-title-s font-bold text-m3-on-surface">
                {stageTab === 'ALL'
                  ? 'All Active Trips & Enquiries'
                  : stageTab === 'QUOTES'
                  ? 'Stage 1: Customer Enquiries (Waiting ₹500 Advance)'
                  : stageTab === 'NEED_DRIVER'
                  ? 'Stage 2: Advance Paid — Assign Driver & Cab'
                  : stageTab === 'ON_TRIP'
                  ? 'Stage 3: Driver Allotted — Send Duty Slips & Follow Trip'
                  : 'Stage 4: Completed Trips — Collect Commission & 5★ Review'}
              </span>
              {stageTab !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setStageTab('ALL')}
                  className="text-m3-label-s font-bold text-m3-primary hover:underline ml-2"
                >
                  Show All Stages
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenPhoneQuoteEngine && (
                <button
                  type="button"
                  onClick={onOpenPhoneQuoteEngine}
                  className="h-9 px-3.5 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-m3-full text-m3-label-m font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  title="Take Phone Call & Auto-Calculate Fare"
                >
                  <span className="material-symbols-outlined text-[18px]">calculate</span>
                  <span>+ Phone Rate Calc</span>
                </button>
              )}
              {onOpenAiParser && (
                <button
                  type="button"
                  onClick={onOpenAiParser}
                  className="h-9 px-3.5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-m3-label-m font-bold flex items-center gap-1.5 shadow-m3-1 transition-all"
                  title="Paste WhatsApp Enquiry Message"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  <span className="hidden sm:inline">AI Paste Call/WA</span>
                  <span className="sm:hidden">AI Paste</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowQuickBar(!showQuickBar)}
                className="h-9 px-3 bg-m3-surface text-m3-on-surface-variant border border-m3-outline-variant hover:bg-m3-surface-container-high rounded-m3-full text-m3-label-s font-semibold flex items-center gap-1"
                title="Open quick manual entry form"
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                <span className="hidden md:inline">Quick Form</span>
              </button>
            </div>
          </div>

        {showQuickBar && (
          <form onSubmit={handleQuickSaveQuote} className="p-3.5 rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/60 space-y-2.5 text-m3-body-s animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-m3-on-surface">New Phone / WhatsApp Enquiry or Direct Booking</span>
              <button type="button" onClick={() => setShowQuickBar(false)} className="text-m3-on-surface-variant font-bold">✕</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <input type="text" placeholder="Customer Name" value={quickEntry.guestName} onChange={(e) => setQuickEntry({ ...quickEntry, guestName: e.target.value })} className="p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest" />
              <input type="tel" placeholder="Mobile (10 digits)" value={quickEntry.phone} onChange={(e) => setQuickEntry({ ...quickEntry, phone: e.target.value })} className="p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest font-semibold" />
              <input type="text" placeholder="Pickup" value={quickEntry.pickup} onChange={(e) => setQuickEntry({ ...quickEntry, pickup: e.target.value })} className="p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest" />
              <input type="text" placeholder="Drop" value={quickEntry.drop} onChange={(e) => setQuickEntry({ ...quickEntry, drop: e.target.value })} className="p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest" />
              <input type="text" placeholder="Date & Time" value={quickEntry.travelDate} onChange={(e) => setQuickEntry({ ...quickEntry, travelDate: e.target.value })} className="p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest" />
              <select value={quickEntry.vehicle} onChange={(e) => setQuickEntry({ ...quickEntry, vehicle: e.target.value })} className="p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest font-semibold">
                <option value="Sedan (Dzire / Etios)">Sedan (Dzire)</option>
                <option value="SUV (Ertiga 6+1)">SUV (Ertiga)</option>
                <option value="Innova Crysta (7+1)">Innova Crysta</option>
                <option value="Tempo Traveller">Tempo Traveller</option>
              </select>
              <input type="number" placeholder="Fare Rs." value={quickEntry.fare} onChange={(e) => setQuickEntry({ ...quickEntry, fare: e.target.value })} className="p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest font-bold text-m3-primary" />
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button type="submit" className="h-9 px-4 bg-m3-secondary-container text-m3-on-secondary-container rounded-m3-full font-bold text-m3-label-m">
                1. Save as Quote & Send WhatsApp
              </button>
              <button type="button" onClick={handleQuickConfirmBooking} className="h-9 px-4 bg-m3-primary text-m3-on-primary rounded-m3-full font-bold text-m3-label-m">
                2. ₹500 Advance Paid (Confirm Booking Now)
              </button>
            </div>
          </form>
        )}
      </div>
      {/* 3. Stage 2, 3 & 4: Confirmed Bookings & Active Duties Table */}
      {(stageTab === 'ALL' || stageTab === 'NEED_DRIVER' || stageTab === 'ON_TRIP' || stageTab === 'COMPLETED') && (
        <div className="space-y-3">
          {displayedBookings.length === 0 ? (
            stageTab === 'NEED_DRIVER' ? (
              <div className="bg-m3-surface-container-lowest rounded-m3-xl p-8 text-center border border-m3-outline-variant/60 shadow-xs space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-m3-error-container text-m3-on-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">person_add</span>
                </div>
                <h4 className="text-m3-title-s font-bold text-m3-on-surface">No Duties Awaiting Driver Assignment</h4>
                <p className="text-m3-body-s text-m3-on-surface-variant max-w-md mx-auto">
                  When you lock any enquiry below with ₹500 advance, it appears here to allot a driver or broadcast to WhatsApp driver group.
                </p>
              </div>
            ) : stageTab === 'ON_TRIP' ? (
              <div className="bg-m3-surface-container-lowest rounded-m3-xl p-8 text-center border border-m3-outline-variant/60 shadow-xs space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">local_taxi</span>
                </div>
                <h4 className="text-m3-title-s font-bold text-m3-on-surface">No Active Trips in Transit</h4>
                <p className="text-m3-body-s text-m3-on-surface-variant max-w-md mx-auto">
                  Once a driver is assigned, the duty moves here with 1-tap WhatsApp duty slips (customer & driver) and live trip movement tracking.
                </p>
              </div>
            ) : stageTab === 'COMPLETED' ? (
              <div className="bg-m3-surface-container-lowest rounded-m3-xl p-8 text-center border border-m3-outline-variant/60 shadow-xs space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-m3-success-container text-m3-on-success-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">star</span>
                </div>
                <h4 className="text-m3-title-s font-bold text-m3-on-surface">No Completed Trips Yet</h4>
                <p className="text-m3-body-s text-m3-on-surface-variant max-w-md mx-auto">
                  Completed duties closed with start/end KM, tolls, and collected balances appear here along with 1-tap 5-star Google review requests.
                </p>
              </div>
            ) : (
              validLeads.length === 0 && (
                <div className="bg-m3-surface-container-lowest rounded-m3-xl p-8 text-center border border-m3-outline-variant/60 shadow-xs space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">local_taxi</span>
                  </div>
                  <h4 className="text-m3-title-s font-bold text-m3-on-surface">Main Booking Workflow Ready</h4>
                  <p className="text-m3-body-s text-m3-on-surface-variant max-w-md mx-auto">
                    Zero active duties right now. Real customer enquiries from WhatsApp, Google Ads, and booking engines appear below in Stage 1. Click <strong>+ New Enquiry / Booking</strong> to record a customer call.
                  </p>
                </div>
              )
            )
          ) : (
            displayedBookings.map((b) => {
            const isUnassigned = !b.assignedChauffeur || b.assignedChauffeur === 'Unassigned';
            const isCompleted = b.manifestStatus === 'Completed';
            const fare = Number(b.terminalFare) || 6000;
            const adv = Number(b.advancePaid) || 500;
            const balanceDue = Math.max(0, fare - adv);
            const driverShare = Number(b.chauffeurPayout) || Math.round(fare * 0.82);
            const profit = fare - driverShare;

            return (
              <div
                key={b.bookingId}
                className="bg-m3-surface-container-lowest rounded-m3-xl p-4 border border-m3-outline-variant/80 shadow-m3-1 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-mono-code text-m3-label-m font-bold text-m3-primary">{b.bookingId}</span>
                      <span className={`text-m3-label-s font-bold px-2 py-0.5 rounded-m3-full ${
                        isCompleted
                          ? 'bg-m3-success-container text-m3-on-success-container'
                          : isUnassigned
                          ? 'bg-m3-error-container text-m3-on-error-container'
                          : 'bg-m3-primary-container text-m3-on-primary-container'
                      }`}>
                        {isCompleted ? 'Stage 4: Completed' : isUnassigned ? 'Stage 2: Need Driver' : `Stage 3: ${b.manifestStatus || 'Allotted'}`}
                      </span>
                    </div>
                    <div className="text-m3-title-s font-bold text-m3-on-surface">{b.guestNamePhone}</div>
                    <div className="text-m3-label-m text-m3-on-surface-variant mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">schedule</span>
                      <span>{b.travelDateTime}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-m3-label-s uppercase font-bold text-m3-on-surface-variant block">Route & Vehicle</span>
                    <div className="text-m3-body-m font-bold text-m3-on-surface mt-0.5">{b.pickupAddress}</div>
                    <div className="text-m3-label-m text-m3-on-surface-variant mt-0.5">
                      {b.vehicleCategory} • {b.partySize || '4 Pax'} • Source: {b.darshanStatus || 'Direct'}
                    </div>
                  </div>
                  <div>
                    <span className="text-m3-label-s uppercase font-bold text-m3-on-surface-variant block">Driver & Cab Allotted</span>
                    {isUnassigned ? (
                      <div className="space-y-1.5 mt-1">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (!e.target.value) return;
                            onAssignChauffeur?.(b.bookingId, e.target.value);
                            showToast?.(`Driver assigned to ${b.bookingId}! Now send Duty Slips.`, 'success');
                          }}
                          className="w-full p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-low text-m3-label-m font-bold text-m3-on-surface"
                        >
                          <option value="">-- Select Saved Driver & Cab --</option>
                          {chauffeurs.map((c, idx) => (
                            <option key={idx} value={`${c.name} (${c.plate}) - ${c.phone}`}>
                              {c.name} • {c.plate} ({c.category})
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleBroadcastToDriverGroup(b)}
                            className="flex-1 h-8 px-2.5 bg-m3-secondary-container text-m3-on-secondary-container rounded-m3-full text-m3-label-s font-bold flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">campaign</span>
                            <span>WA Group Broadcast</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowOutsideFormId(showOutsideFormId === b.bookingId ? null : b.bookingId)}
                            className="h-8 px-2.5 border border-m3-outline-variant rounded-m3-full text-m3-label-s font-semibold text-m3-on-surface-variant"
                          >
                            + Outside Cab
                          </button>
                          {onOpenDriversModal && (
                            <button
                              type="button"
                              onClick={onOpenDriversModal}
                              className="h-8 px-2.5 border border-m3-outline-variant rounded-m3-full text-m3-label-s font-semibold text-m3-primary hover:bg-m3-primary-container/30"
                              title="Open Drivers Roster"
                            >
                              + Roster
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <div className="text-m3-body-s font-bold text-m3-success">{b.assignedChauffeur}</div>
                        <button
                          type="button"
                          onClick={() => onAssignChauffeur?.(b.bookingId, 'Unassigned')}
                          className="text-m3-label-s text-m3-primary hover:underline mt-0.5"
                        >
                          Change Driver
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-m3-surface-container-low p-2.5 rounded-m3-md border border-m3-outline-variant/50 text-m3-label-s space-y-1">
                    <div className="flex justify-between">
                      <span className="text-m3-on-surface-variant">Total Fare:</span>
                      <strong className="text-m3-on-surface text-m3-label-m">Rs.{fare.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-m3-on-surface-variant">Advance / Bal Due:</span>
                      <span className="font-semibold text-m3-on-surface">Rs.{adv} / <strong>Rs.{balanceDue.toLocaleString('en-IN')}</strong></span>
                    </div>
                    <div className="flex justify-between border-t border-m3-outline-variant/50 pt-1">
                      <span className="text-m3-on-surface-variant">Driver / Profit:</span>
                      <span className="font-bold text-m3-success">Rs.{driverShare} / +Rs.{profit}</span>
                    </div>
                  </div>
                </div>
                {showOutsideFormId === b.bookingId && (
                  <div className="p-3 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant flex flex-wrap items-center gap-2 text-m3-body-s">
                    <input type="text" placeholder="Outside Driver Name" value={outsideDriverMap[b.bookingId]?.name || ''} onChange={(e) => setOutsideDriverMap({ ...outsideDriverMap, [b.bookingId]: { ...(outsideDriverMap[b.bookingId] || {}), name: e.target.value } })} className="flex-1 min-w-[130px] p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest" />
                    <input type="tel" placeholder="Driver Mobile" value={outsideDriverMap[b.bookingId]?.phone || ''} onChange={(e) => setOutsideDriverMap({ ...outsideDriverMap, [b.bookingId]: { ...(outsideDriverMap[b.bookingId] || {}), phone: e.target.value } })} className="flex-1 min-w-[130px] p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest" />
                    <input type="text" placeholder="Vehicle Plate (TN 09 ...)" value={outsideDriverMap[b.bookingId]?.plate || ''} onChange={(e) => setOutsideDriverMap({ ...outsideDriverMap, [b.bookingId]: { ...(outsideDriverMap[b.bookingId] || {}), plate: e.target.value.toUpperCase() } })} className="flex-1 min-w-[130px] p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest" />
                    <button
                      type="button"
                      onClick={() => {
                        const d = outsideDriverMap[b.bookingId] || {};
                        if (!d.name || !d.plate) return;
                        onAssignChauffeur?.(b.bookingId, `${d.name} (${d.plate}) - +91 ${d.phone || ''}`);
                        setShowOutsideFormId(null);
                      }}
                      className="h-9 px-4 bg-m3-primary text-m3-on-primary rounded-m3-full font-bold text-m3-label-m"
                    >
                      Save & Allot
                    </button>
                  </div>
                )}

                {!isUnassigned && (
                  <div className="pt-2.5 border-t border-m3-outline-variant/50 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button type="button" onClick={() => handleSendCustomerDutySlip(b)} className="h-9 px-3.5 bg-m3-primary text-m3-on-primary rounded-m3-full text-m3-label-m font-semibold flex items-center gap-1.5 shadow-xs">
                        <span className="material-symbols-outlined text-[16px]">person</span>
                        <span>Duty Slip to Customer (WA)</span>
                      </button>
                      <button type="button" onClick={() => handleSendDriverDutySlip(b)} className="h-9 px-3.5 bg-m3-secondary-container text-m3-on-secondary-container rounded-m3-full text-m3-label-m font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">local_taxi</span>
                        <span>Duty Slip to Driver (WA)</span>
                      </button>
                      <button type="button" onClick={() => onOpenDutySlip?.(b)} className="h-9 px-3.5 bg-m3-surface border border-m3-outline-variant hover:bg-m3-surface-container-high text-m3-on-surface rounded-m3-full text-m3-label-m font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                        <span>Close Duty (Start/End KM & Bill)</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['Driver En Route', 'At Pickup', 'In Progress', 'Completed'].map((st) => {
                        const active = b.manifestStatus === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => onStatusChange?.(b.bookingId, st)}
                            className={`h-8 px-2.5 rounded-m3-sm text-m3-label-s font-bold border transition-all ${
                              active ? 'bg-m3-primary-container text-m3-on-primary-container border-m3-primary' : 'bg-m3-surface text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                      {isCompleted && (
                        <button type="button" onClick={() => handleSendReviewWA(b)} className="h-8 px-3 bg-m3-success text-m3-on-success rounded-m3-full text-m3-label-s font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          <span>Send 5★ Review WA</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      )}

      {/* 4. Stage 1: Active Quotes / Enquiries Waiting for ₹500 Advance */}
      {(stageTab === 'ALL' || stageTab === 'QUOTES') && (
        validLeads.length === 0 ? (
          stageTab === 'QUOTES' && (
            <div className="bg-m3-surface-container-lowest rounded-m3-xl p-8 text-center border border-m3-outline-variant/60 shadow-xs space-y-2 pt-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">forum</span>
              </div>
              <h4 className="text-m3-title-s font-bold text-m3-on-surface">No Customer Enquiries in Queue</h4>
              <p className="text-m3-body-s text-m3-on-surface-variant max-w-md mx-auto">
                Inquiries from WhatsApp, Google Ads, and booking calculators appear here automatically. Click <strong>+ Phone Rate Calc</strong> above to calculate and send a quote to a caller.
              </p>
            </div>
          )
        ) : (
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h3 className="text-m3-title-s font-bold text-m3-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-m3-primary">forum</span>
                  <span>Stage 1: Customer Enquiries ({filteredLeads.length} of {validLeads.length})</span>
                </h3>
                <span className="text-xs text-m3-on-surface-variant">Waiting ₹500 Advance to lock vehicle & driver</span>
              </div>

              {/* Source Channel Filters */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                {[
                  { id: 'ALL', label: `All (${validLeads.length})` },
                  { id: 'GOOGLE_ADS', label: 'Google Ads Calls' },
                  { id: 'OLD_CUSTOMER', label: 'Old Customers' },
                  { id: 'WHATSAPP', label: 'WhatsApp Direct' },
                  { id: 'CALCULATOR', label: 'Rate Calc' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setEnquirySourceFilter(f.id)}
                    className={`h-7 px-2.5 rounded-m3-full font-bold border transition-colors ${
                      enquirySourceFilter === f.id
                        ? 'bg-m3-primary text-white border-m3-primary shadow-xs'
                        : 'bg-m3-surface text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

          {filteredLeads.map((l, idx) => {
            const cleanPhone = extractLeadPhone(l);
            const isGoogleAds = (l.sourcePage || '').toLowerCase().includes('google ads') || (l.calculatorEngine || '').toLowerCase().includes('google ads');
            const isOldCust = (l.sourcePage || '').toLowerCase().includes('old') || (l.sourcePage || '').toLowerCase().includes('repeat');
            const isWhatsApp = (l.quoteId || '').startsWith('#WA') || (l.sourcePage || '').toLowerCase().includes('whatsapp');

            return (
              <div
                key={l.quoteId || idx}
                className="bg-m3-surface-container-lowest rounded-m3-xl p-4 border border-m3-outline-variant/70 shadow-m3-1 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-m3-label-s font-bold bg-m3-secondary-container text-m3-on-secondary-container px-2.5 py-0.5 rounded-m3-full">
                      Stage 1: Enquiry
                    </span>
                    {l.quoteId && (
                      <span className="text-m3-label-s font-extrabold bg-m3-primary text-white px-2 py-0.5 rounded-m3-full font-mono-code">
                        {l.quoteId}
                      </span>
                    )}

                    {/* Source Tag Badge */}
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-m3-full border flex items-center gap-1 ${
                      isGoogleAds
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : isOldCust
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isWhatsApp
                        ? 'bg-green-50 text-green-800 border-green-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      <span className="material-symbols-outlined text-[13px]">
                        {isGoogleAds ? 'campaign' : isOldCust ? 'verified_user' : isWhatsApp ? 'chat' : 'calculate'}
                      </span>
                      <span>
                        {isGoogleAds ? 'Google Ads Call' : isOldCust ? 'Old Customer' : isWhatsApp ? 'WhatsApp Inquiry' : 'Rate Calculator'}
                      </span>
                    </span>

                    {l.guestName && (
                      <span className="text-m3-label-s font-bold bg-white text-m3-on-surface border border-m3-outline-variant px-2 py-0.5 rounded-m3-full truncate">
                        👤 {l.guestName}
                      </span>
                    )}

                    {cleanPhone && (
                      <a
                        href={`tel:+91${cleanPhone}`}
                        className="text-m3-label-s font-mono-code font-bold text-m3-primary hover:underline bg-m3-primary-container/30 px-2 py-0.5 rounded-m3-full flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">call</span>
                        <span>+91 {cleanPhone}</span>
                      </a>
                    )}
                  </div>

                  <div className="text-m3-body-m font-bold text-m3-on-surface truncate">
                    {l.pickup} ➔ {l.drop}
                  </div>

                  <div className="text-m3-label-m text-m3-on-surface-variant flex flex-wrap items-center gap-2">
                    <span>🚗 {l.vehicle}</span>
                    <span>•</span>
                    <span>{l.tripType}</span>
                    {l.travelDate && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>{l.travelDate}</span>
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-[11px] text-m3-outline">{l.timestamp}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-m3-outline-variant/40">
                  <div className="text-left lg:text-right mr-1">
                    <span className="text-m3-title-m font-bold text-m3-on-surface block">
                      Rs.{Number(l.estimatedFare || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-m3-on-surface-variant">All-Inclusive</span>
                  </div>

                  {cleanPhone && (
                    <a
                      href={`tel:+91${cleanPhone}`}
                      className="h-9 px-3 bg-m3-surface border border-m3-outline-variant hover:bg-m3-surface-container-high text-m3-on-surface rounded-m3-full text-m3-label-s font-bold flex items-center gap-1 transition-colors"
                      title="Direct Phone Call"
                    >
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      <span className="hidden sm:inline">Call</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSendFollowUpWA(l)}
                    className="h-9 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-m3-full text-m3-label-s font-bold flex items-center gap-1 transition-colors"
                    title="Send follow-up WhatsApp reminder to confirm"
                  >
                    <span className="material-symbols-outlined text-[16px] text-amber-700">ring_volume</span>
                    <span>Follow-up WA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendQuoteWA(l)}
                    className="h-9 px-3.5 bg-m3-secondary-container hover:bg-m3-surface-container-high text-m3-on-secondary-container rounded-m3-full text-m3-label-m font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Send Quote</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLockLeadWithAdvance(l)}
                    className="h-9 px-4 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-m3-label-m font-bold flex items-center gap-1.5 shadow-m3-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>₹500 Advance Paid</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

