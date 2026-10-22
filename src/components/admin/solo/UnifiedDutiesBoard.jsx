import React, { useState, useMemo } from 'react';
import { buildMapsBlock } from '../../../utils/whatsapp';
import { getNextEnquiryId, getOrderedEnquiryId, getNextBookingId, isSequentialId } from '../../../utils/sequenceGenerator';
import { validateCustomerContact, extractValidMobile, isPlaceholderCustomerName, isActionableLead, deduplicateCalculatorQuotes } from '../../../utils/bookingContactValidator';
import { formatCleanDateTime, cleanLocationName } from '../../../utils/dateFormatter';

/**
 * Simple 3-Step Taxi Operations Register
 * Designed specifically for non-technical office staff and beginners:
 * 
 * Step 1: 🟡 New Enquiries (Google Ads calls, Phone calls, WhatsApp quotes)
 * Step 2: 🔵 Active Trips (Advance received ➔ Assign driver & send Duty Slips)
 * Step 3: 🟢 Completed Trips (Trip finished ➔ Settle balance & send Google 5★ review)
 */
export default function UnifiedDutiesBoard({
  leads = [],
  calculatorQuotes = [],
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
  // 3 Primary Register Tabs: 'ENQUIRIES' | 'ACTIVE_TRIPS' | 'COMPLETED'
  const [activeTab, setActiveTab] = useState('ENQUIRIES');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [enquiryFilter, setEnquiryFilter] = useState('ALL'); // 'ALL' | 'GOOGLE_ADS' | 'WHATSAPP' | 'PHONE'
  const [activeTripFilter, setActiveTripFilter] = useState('ALL'); // 'ALL' | 'NEED_DRIVER' | 'ON_TRIP'
  const [showWebsiteEstimates, setShowWebsiteEstimates] = useState(false);

  // Quick Customer Call / Booking Entry Drawer/Modal
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [quickEntry, setQuickEntry] = useState({
    guestName: '',
    phone: '',
    source: 'Google Ads Call',
    travelDate: '',
    pickup: 'Chennai',
    drop: '',
    vehicle: 'Sedan (Dzire / Etios)',
    fare: '',
    advance: '500'
  });

  // Outside / Market Driver input map
  const [outsideDriverMap, setOutsideDriverMap] = useState({});
  const [showOutsideFormId, setShowOutsideFormId] = useState(null);

  // Group bookings into active & completed
  const activeBookings = useMemo(
    () => bookings.filter(b => b.manifestStatus !== 'Completed' && b.manifestStatus !== 'Cancelled'),
    [bookings]
  );

  const needDriverBookings = useMemo(
    () => activeBookings.filter(b => !b.assignedChauffeur || b.assignedChauffeur === 'Unassigned'),
    [activeBookings]
  );

  const allottedLiveBookings = useMemo(
    () => activeBookings.filter(b => b.assignedChauffeur && b.assignedChauffeur !== 'Unassigned'),
    [activeBookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter(b => b.manifestStatus === 'Completed'),
    [bookings]
  );

  const validLeads = useMemo(
    () => leads.filter(isActionableLead),
    [leads]
  );

  const validCalculatorQuotes = useMemo(
    () => deduplicateCalculatorQuotes(calculatorQuotes),
    [calculatorQuotes]
  );

  const totalCommissionEarned = useMemo(
    () => completedBookings.reduce((sum, b) => sum + Number(b.companyMargin || (b.terminalFare - b.chauffeurPayout) || 0), 0),
    [completedBookings]
  );

  // Extract phone number helper
  const extractPhone = (item) => {
    const combined = `${item.phone || ''} ${item.sourcePage || ''} ${item.pickup || ''} ${item.guestName || ''} ${item.guestNamePhone || ''} ${item.metadata || ''}`;
    const match = combined.match(/[6-9]\d{9}/);
    return match ? match[0] : '';
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return validLeads.filter(l => {
      const q = searchQuery.toLowerCase().trim();
      const combined = `${l.guestName || ''} ${l.pickup || ''} ${l.drop || ''} ${l.vehicle || ''} ${l.quoteId || ''} ${l.sourcePage || ''}`.toLowerCase();
      if (q && !combined.includes(q)) return false;

      if (enquiryFilter === 'GOOGLE_ADS') {
        return combined.includes('google ads') || combined.includes('call campaign');
      }
      if (enquiryFilter === 'WHATSAPP') {
        return (l.quoteId || '').startsWith('#WA') || combined.includes('whatsapp');
      }
      if (enquiryFilter === 'PHONE') {
        return combined.includes('phone') || combined.includes('call') || combined.includes('manual');
      }
      return true;
    });
  }, [validLeads, searchQuery, enquiryFilter]);

  // Filtered Active Bookings
  const filteredActiveBookings = useMemo(() => {
    return activeBookings.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const combined = `${b.guestNamePhone || ''} ${b.pickupAddress || ''} ${b.bookingId || ''} ${b.assignedChauffeur || ''} ${b.vehicleCategory || ''}`.toLowerCase();
      if (q && !combined.includes(q)) return false;

      const isUnassigned = !b.assignedChauffeur || b.assignedChauffeur === 'Unassigned';
      if (activeTripFilter === 'NEED_DRIVER') return isUnassigned;
      if (activeTripFilter === 'ON_TRIP') return !isUnassigned;
      return true;
    });
  }, [activeBookings, searchQuery, activeTripFilter]);

  // Filtered Completed Bookings
  const filteredCompletedBookings = useMemo(() => {
    return completedBookings.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const combined = `${b.guestNamePhone || ''} ${b.pickupAddress || ''} ${b.bookingId || ''} ${b.assignedChauffeur || ''}`.toLowerCase();
      if (q && !combined.includes(q)) return false;
      return true;
    });
  }, [completedBookings, searchQuery]);

  // Generate Digital Duty Slip Link
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

  // Action: Send WhatsApp Quotation to Customer
  const handleSendQuoteWA = (lead) => {
    const cleanPhone = extractPhone(lead);
    const fare = Number(lead.estimatedFare) || 0;
    const mapsBlock = buildMapsBlock(lead.pickup, lead.drop, lead.tripType || 'Round Trip');
    const msg =
      `*KALIDASS TRAVELS CHENNAI — TRIP QUOTATION*\n\n` +
      `Namaskaram ${lead.guestName || 'Sir/Madam'}!\n` +
      `📍 *Route:* ${lead.pickup} ➔ ${lead.drop}\n` +
      `🚗 *Vehicle:* ${lead.vehicle}\n` +
      `💰 *All-Inclusive Fare:* Rs.${fare.toLocaleString('en-IN')}\n\n` +
      `🔒 *To Confirm Your Cab:*\n` +
      `Transfer *Rs.500 Advance* via UPI to *8939539211@okbizaxis* (Kalidass Travels) and send screenshot.\n` +
      `Our team will instantly block the vehicle and assign your driver.\n\n` +
      `📞 24/7 Support: +91 89395 39211` +
      mapsBlock;

    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.(`WhatsApp quote opened for ${lead.guestName || 'Customer'}!`, 'success');
  };

  // Action: Send Follow-up WhatsApp Reminder
  const handleSendFollowUpWA = (lead) => {
    const cleanPhone = extractPhone(lead);
    const guestName = lead.guestName || 'Sir/Madam';
    const fare = Number(lead.estimatedFare) || 0;
    const msg =
      `Namaskaram ${guestName} ji! 🙏\n\n` +
      `Following up from *Kalidass Travels Chennai* regarding your trip inquiry:\n` +
      `📍 *Route:* ${lead.pickup} ➔ ${lead.drop}\n` +
      `🚗 *Vehicle:* ${lead.vehicle}\n` +
      (fare > 0 ? `💰 *Fare Quoted:* Rs.${fare.toLocaleString('en-IN')}\n\n` : `\n`) +
      `Shall we confirm and block your cab? 🚕\n` +
      `Kindly transfer *Rs.500 Advance* via UPI to *8939539211@okbizaxis* (Kalidass Travels) to lock your vehicle & driver.\n\n` +
      `For any questions, call us directly at +91 89395 39211. Thank you!`;
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.(`Follow-up reminder sent to ${guestName}!`, 'success');
  };

  // Action: Advance Received ➔ Convert Enquiry to Confirmed Active Trip
  const handleLockLeadWithAdvance = (lead) => {
    const cleanPhone = extractValidMobile(lead);
    const guestLabel = lead.guestName && !isPlaceholderCustomerName(lead.guestName)
      ? lead.guestName.split('(')[0].trim()
      : (lead.pickup && lead.pickup.includes('+91') ? lead.pickup.split('(')[0].trim() : '');

    const validation = validateCustomerContact(guestLabel, cleanPhone);
    if (!validation.isValid) {
      showToast?.(validation.error || 'Customer Name and a valid 10-digit Mobile Number are required before moving to Active Trips.', 'error');
      return;
    }

    const fare = Number(lead.estimatedFare) || 6000;
    const driverShare = Math.round(fare * 0.82);
    const routeLabel = lead.pickup.includes('+91') ? lead.drop : `${lead.pickup} ➔ ${lead.drop}`;

    const confirmed = {
      bookingId: (lead.quoteId && isSequentialId(lead.quoteId)) ? lead.quoteId.replace('#ENQ-', '#KT-').replace('#QT-', '#KT-') : getNextBookingId(),
      guestNamePhone: validation.formattedGuestNamePhone,
      travelDateTime: lead.travelDate || 'Tomorrow @ 05:00 AM',
      pickupAddress: routeLabel,
      vehicleCategory: lead.vehicle || 'Sedan (Dzire / Etios)',
      partySize: '4 Pax',
      kycStatus: 'Advance Paid',
      darshanStatus: lead.sourcePage || lead.calculatorEngine || 'Direct Call',
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
    showToast?.(`✅ ₹500 Advance Received! Booking ${confirmed.bookingId} moved to Active Trips.`, 'success');
    setActiveTab('ACTIVE_TRIPS');
  };

  // Action: Broadcast Duty to Driver WhatsApp Group
  const handleBroadcastToDriverGroup = (b) => {
    const fare = Number(b.terminalFare) || 0;
    const margin = Number(b.companyMargin) || Math.round(fare * 0.18);
    const driverNet = Math.max(0, fare - margin);
    const msg =
      `🚕 *DUTY AVAILABLE — KALIDASS TRAVELS*\n` +
      `Trip ID: *${b.bookingId}*\n` +
      `🗓 *Pickup Time:* ${b.travelDateTime}\n` +
      `📍 *Route:* ${b.pickupAddress}\n` +
      `🚗 *Vehicle:* ${b.vehicleCategory}\n` +
      `💰 *Driver Net Payment:* *Rs.${driverNet.toLocaleString('en-IN')} Net* (+ Tolls/Parking paid by customer)\n` +
      `📱 *Reply with Driver Name & Car Plate to lock this duty!*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Action: Send Customer Duty Slip via WhatsApp
  const handleSendCustomerDutySlip = (b) => {
    const cleanPhone = extractPhone(b);
    const guestName = (b.guestNamePhone || 'Customer').split('(')[0].trim();
    const tripUrl = getTripUrl(b);
    const fare = Number(b.terminalFare) || 0;
    const adv = Number(b.advancePaid) || 0;
    const bal = Math.max(0, fare - adv);
    const msg =
      `*KALIDASS TRAVELS — CUSTOMER DUTY SLIP*\n` +
      `Booking ID: *${b.bookingId}*\n\n` +
      `👨‍✈️ *Driver & Cab:* ${b.assignedChauffeur}\n` +
      `🚗 *Vehicle:* ${b.vehicleCategory}\n` +
      `🗓 *Pickup Time:* ${b.travelDateTime}\n` +
      `📍 *Route:* ${b.pickupAddress}\n` +
      `💰 *Total Fare:* Rs.${fare.toLocaleString('en-IN')} | *Advance:* Rs.${adv} | *Balance to Driver:* Rs.${bal.toLocaleString('en-IN')}\n\n` +
      `📱 *Open Digital Duty Slip & Live Status:*\n${tripUrl}`;
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.(`Duty slip sent to customer ${guestName}!`, 'success');
  };

  // Action: Send Driver Duty Slip via WhatsApp
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
      `👤 *Passenger:* ${b.guestNamePhone}\n` +
      `🗓 *Pickup Time:* ${b.travelDateTime}\n` +
      `📍 *Route:* ${b.pickupAddress}\n` +
      `🗺️ *Google Maps Pin:* ${mapsLink}\n` +
      `💵 *Collect Balance from Customer at Drop:* *Rs.${bal.toLocaleString('en-IN')}*\n` +
      `📱 *Digital Duty Slip:*\n${tripUrl}`;
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.(`Duty slip sent to driver!`, 'success');
  };

  // Action: Send 5★ Google Review Request
  const handleSendReviewWA = (b) => {
    const cleanPhone = extractPhone(b);
    const guestName = (b.guestNamePhone || 'Customer').split('(')[0].trim();
    const msg =
      `Namaskaram ${guestName} ji! 🙏 Thank you for travelling with *Kalidass Travels Chennai*.\n\n` +
      `We hope you had a pleasant and safe journey with our cab and driver. ⭐\n\n` +
      `⭐⭐⭐⭐⭐ Kindly take 10 seconds to share your 5-star Google review here:\n` +
      `https://share.google/1IOq41QwMkhDJvrLY\n\n` +
      `Your support helps our family-run team grow. Thank you! 🙏`;
    onReviewStatusChange?.(b.bookingId, 'Requested');
    showToast?.(`Review request sent to ${guestName}!`, 'success');
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Fast Phone Call Saver
  const handleQuickSaveCall = (e) => {
    e.preventDefault();
    if (!quickEntry.phone.trim() && !quickEntry.guestName.trim()) {
      showToast?.('Please enter Customer Name or Mobile Number', 'error');
      return;
    }
    const cleanPhone = quickEntry.phone.replace(/[^0-9]/g, '').slice(-10);
    const fareNum = Number(quickEntry.fare) || 0;
    const newLead = {
      quoteId: getNextEnquiryId(leads),
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      guestName: quickEntry.guestName.trim() || (cleanPhone ? `Customer (${cleanPhone})` : 'Phone Caller'),
      sourcePage: cleanPhone ? `${quickEntry.source} (+91 ${cleanPhone})` : quickEntry.source,
      calculatorEngine: quickEntry.source,
      tripType: 'Round Trip',
      pickup: quickEntry.pickup.trim() || 'Chennai',
      drop: quickEntry.drop.trim() || 'Outstation',
      vehicle: quickEntry.vehicle,
      estimatedFare: fareNum,
      travelDate: quickEntry.travelDate || 'Tomorrow @ 05:00 AM',
      status: 'Quote Sent - Waiting Advance'
    };

    onAddManualLead?.(newLead);
    if (cleanPhone) {
      handleSendQuoteWA(newLead);
    }
    setQuickEntry({
      guestName: '',
      phone: '',
      source: 'Google Ads Call',
      travelDate: '',
      pickup: 'Chennai',
      drop: '',
      vehicle: 'Sedan (Dzire / Etios)',
      fare: '',
      advance: '500'
    });
    setShowNewCallModal(false);
    setActiveTab('ENQUIRIES');
    showToast?.(`New enquiry ${newLead.quoteId} recorded!`, 'success');
  };

  // Fast Direct Advance Paid & Confirm Booking (Requires Customer Name & 10-digit Mobile)
  const handleQuickConfirmBooking = () => {
    const validation = validateCustomerContact(quickEntry.guestName, quickEntry.phone);
    if (!validation.isValid) {
      showToast?.(validation.error || 'Please enter Customer Name and a valid 10-digit Mobile Number before moving to Active Trips.', 'error');
      return;
    }
    const fareNum = Number(quickEntry.fare) || 0;
    const advNum = Number(quickEntry.advance) || 500;
    const driverShare = Math.round(fareNum * 0.82);

    const newBooking = {
      bookingId: getNextBookingId(),
      guestNamePhone: validation.formattedGuestNamePhone,
      travelDateTime: quickEntry.travelDate || 'Tomorrow @ 05:00 AM',
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
      source: 'Google Ads Call',
      travelDate: '',
      pickup: 'Chennai',
      drop: '',
      vehicle: 'Sedan (Dzire / Etios)',
      fare: '',
      advance: '500'
    });
    setShowNewCallModal(false);
    setActiveTab('ACTIVE_TRIPS');
    showToast?.(`✅ Booking ${newBooking.bookingId} confirmed! Now assign driver.`, 'success');
  };

  return (
    <div className="space-y-4 font-sans animate-fadeIn">
      {/* ========================================================= */}
      {/* 1. THREE CLEAR REGISTER TABS (Zero Confusion for Beginners) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* TAB 1: NEW ENQUIRIES */}
        <button
          type="button"
          onClick={() => setActiveTab('ENQUIRIES')}
          className={`p-4 rounded-m3-xl border text-left transition-all relative ${
            activeTab === 'ENQUIRIES'
              ? 'bg-amber-50/80 border-2 border-amber-500 shadow-m3-2 ring-2 ring-amber-200'
              : 'bg-m3-surface-container-lowest border-m3-outline-variant/70 hover:bg-amber-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Step 1: New Enquiries</span>
            </span>
            <span className="material-symbols-outlined text-amber-600 text-[22px]">phone_in_talk</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-950">{validLeads.length}</span>
            <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
              Waiting ₹500 Adv
            </span>
          </div>
          <p className="text-xs text-amber-900/80 mt-1">
            Google Ads calls, phone calls & WhatsApp quotes.
          </p>
        </button>

        {/* TAB 2: ACTIVE TRIPS */}
        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE_TRIPS')}
          className={`p-4 rounded-m3-xl border text-left transition-all relative ${
            activeTab === 'ACTIVE_TRIPS'
              ? 'bg-blue-50/80 border-2 border-blue-600 shadow-m3-2 ring-2 ring-blue-200'
              : 'bg-m3-surface-container-lowest border-m3-outline-variant/70 hover:bg-blue-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Step 2: Active Trips</span>
            </span>
            <span className="material-symbols-outlined text-blue-600 text-[22px]">local_taxi</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-950">{activeBookings.length}</span>
            {needDriverBookings.length > 0 ? (
              <span className="text-xs font-black text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full animate-bounce">
                ⚠️ {needDriverBookings.length} Need Driver
              </span>
            ) : (
              <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                All Assigned
              </span>
            )}
          </div>
          <p className="text-xs text-blue-900/80 mt-1">
            Advance received! Assign driver & send Duty Slip.
          </p>
        </button>

        {/* TAB 3: COMPLETED TRIPS */}
        <button
          type="button"
          onClick={() => setActiveTab('COMPLETED')}
          className={`p-4 rounded-m3-xl border text-left transition-all relative ${
            activeTab === 'COMPLETED'
              ? 'bg-emerald-50/80 border-2 border-emerald-600 shadow-m3-2 ring-2 ring-emerald-200'
              : 'bg-m3-surface-container-lowest border-m3-outline-variant/70 hover:bg-emerald-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>Step 3: Completed</span>
            </span>
            <span className="material-symbols-outlined text-emerald-600 text-[22px]">verified</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-950">{completedBookings.length}</span>
            <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
              +Rs.{totalCommissionEarned.toLocaleString('en-IN')} Profit
            </span>
          </div>
          <p className="text-xs text-emerald-900/80 mt-1">
            Finished trips, balance collected & 5★ Google reviews.
          </p>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. UNIVERSAL TOP TOOLBAR (Fast Search + Big Action Buttons) */}
      {/* ========================================================= */}
      <div className="bg-m3-surface-container-lowest p-3 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Simple Search Box */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-m3-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, phone, route, or trip ID..."
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-m3-full border border-m3-outline-variant bg-m3-surface-container-low text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-m3-on-surface-variant hover:text-m3-on-surface text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Primary Action Buttons (Big, High Contrast & Obvious) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* BIG NEW CUSTOMER CALL BUTTON */}
          <button
            type="button"
            onClick={() => setShowNewCallModal(true)}
            className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-m3-full text-xs font-black flex items-center gap-1.5 shadow-m3-1 transition-all"
            title="Record customer phone call or Google Ads inquiry"
          >
            <span className="material-symbols-outlined text-[18px]">add_call</span>
            <span>+ New Customer Call</span>
          </button>

          {/* Rate Calculator Button */}
          {onOpenPhoneQuoteEngine && (
            <button
              type="button"
              onClick={onOpenPhoneQuoteEngine}
              className="h-10 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-m3-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Full Phone Tariff & KM Calculator"
            >
              <span className="material-symbols-outlined text-[18px]">calculate</span>
              <span className="hidden sm:inline">Rate Calc</span>
            </button>
          )}

          {/* AI WhatsApp Paste Button */}
          {onOpenAiParser && (
            <button
              type="button"
              onClick={onOpenAiParser}
              className="h-10 px-3.5 bg-m3-primary hover:bg-m3-primary/90 text-white rounded-m3-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Paste WhatsApp enquiry message"
            >
              <span className="material-symbols-outlined text-[18px]">content_paste</span>
              <span className="hidden sm:inline">Paste WhatsApp</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. QUICK CALL / ENQUIRY ENTRY MODAL (Simple, 1-Minute Entry)*/}
      {/* ========================================================= */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-2xl shadow-m3-4 w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-m3-outline-variant bg-amber-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-amber-500 text-amber-950 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_call</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950">Record Inbound Customer Call</h3>
                  <p className="text-xs text-amber-900/80">Enter customer details ➔ send WhatsApp quote or confirm</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCallModal(false)}
                className="w-8 h-8 rounded-full hover:bg-amber-200/50 flex items-center justify-center text-amber-950 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleQuickSaveCall} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={quickEntry.guestName}
                    onChange={(e) => setQuickEntry({ ...quickEntry, guestName: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Mobile Number (10 Digits)</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9840123456"
                    value={quickEntry.phone}
                    onChange={(e) => setQuickEntry({ ...quickEntry, phone: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-mono-code font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Pickup Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Medavakkam / Chennai Airport"
                    value={quickEntry.pickup}
                    onChange={(e) => setQuickEntry({ ...quickEntry, pickup: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Drop Destination</label>
                  <input
                    type="text"
                    placeholder="e.g. Tirupati / Pondicherry / Vellore"
                    value={quickEntry.drop}
                    onChange={(e) => setQuickEntry({ ...quickEntry, drop: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Travel Date & Time</label>
                  <input
                    type="text"
                    placeholder="Tomorrow @ 05:00 AM"
                    value={quickEntry.travelDate}
                    onChange={(e) => setQuickEntry({ ...quickEntry, travelDate: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Vehicle Category</label>
                  <select
                    value={quickEntry.vehicle}
                    onChange={(e) => setQuickEntry({ ...quickEntry, vehicle: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-bold text-xs"
                  >
                    <option value="Sedan (Dzire / Etios)">Sedan (Dzire / Etios 4 Pax)</option>
                    <option value="SUV (Ertiga 6+1)">SUV (Ertiga 6 Pax)</option>
                    <option value="Innova Crysta (7+1)">Innova Crysta (7 Pax)</option>
                    <option value="Tempo Traveller">Tempo Traveller (12 Pax)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Quoted Fare (Rs.)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 4500"
                    value={quickEntry.fare}
                    onChange={(e) => setQuickEntry({ ...quickEntry, fare: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-amber-400 bg-amber-50/50 font-black text-sm text-amber-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-m3-on-surface mb-1">Enquiry Source</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Google Ads Call', label: 'Google Ads Call' },
                    { id: 'Direct Phone Call', label: 'Direct Phone Call' },
                    { id: 'WhatsApp Inquiry', label: 'WhatsApp' },
                    { id: 'Old / Repeat Customer', label: 'Old Customer' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setQuickEntry({ ...quickEntry, source: s.id })}
                      className={`p-2 rounded-m3-sm border text-center font-bold text-[11px] transition-colors ${
                        quickEntry.source === s.id
                          ? 'bg-amber-500 text-amber-950 border-amber-600 shadow-xs'
                          : 'bg-m3-surface-container-low text-m3-on-surface-variant border-m3-outline-variant'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-m3-outline-variant flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="submit"
                  className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-m3-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[17px]">send</span>
                  <span>1. Save & Send WhatsApp Quote</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickConfirmBooking}
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-m3-full font-black text-xs flex items-center justify-center gap-1.5 shadow-m3-1"
                >
                  <span className="material-symbols-outlined text-[17px]">verified</span>
                  <span>2. ₹500 Advance Received (Confirm Trip)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TAB 1: NEW ENQUIRIES REGISTER VIEW                    */}
      {/* ========================================================= */}
      {activeTab === 'ENQUIRIES' && (
        <div className="space-y-3">
          {/* Sub-header Filter Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-950 uppercase">
                Step 1 Register: Customer Enquiries ({filteredLeads.length})
              </span>
              <span className="text-xs text-m3-on-surface-variant">
                • Collect ₹500 via UPI (8939539211@okbizaxis) to confirm
              </span>
            </div>

            {/* Source Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: `All (${validLeads.length})` },
                { id: 'GOOGLE_ADS', label: 'Google Ads' },
                { id: 'WHATSAPP', label: 'WhatsApp' },
                { id: 'PHONE', label: 'Direct Calls' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setEnquiryFilter(f.id)}
                  className={`h-7 px-2.5 rounded-full text-[11px] font-bold border transition-colors ${
                    enquiryFilter === f.id
                      ? 'bg-amber-500 text-amber-950 border-amber-600 shadow-xs'
                      : 'bg-m3-surface-container-low text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              {/* Toggle to view website visitor estimates */}
              {validCalculatorQuotes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowWebsiteEstimates(!showWebsiteEstimates)}
                  className={`h-7 px-2.5 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                    showWebsiteEstimates
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  <span>{showWebsiteEstimates ? 'Hide Estimates' : `+${validCalculatorQuotes.length} Website Estimates`}</span>
                </button>
              )}
            </div>
          </div>

          {/* Optional: Website Visitor Estimates Stream */}
          {showWebsiteEstimates && validCalculatorQuotes.length > 0 && (
            <div className="p-3.5 rounded-m3-xl bg-emerald-50/60 border border-emerald-300 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                  <span className="material-symbols-outlined text-emerald-700 text-[16px]">visibility</span>
                  <span>Visitors Calculating Fares Live on Website ({validCalculatorQuotes.length})</span>
                </span>
                <span className="text-[11px] text-emerald-800">Click to convert to booking</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {validCalculatorQuotes.slice(0, 6).map((q, idx) => (
                  <div key={q.quoteId || idx} className="p-2.5 rounded-m3-lg bg-white border border-emerald-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-m3-on-surface truncate">
                        {cleanLocationName(q.pickup) || 'Chennai'} ➔ {cleanLocationName(q.drop)}
                      </div>
                      <div className="text-[11px] text-m3-on-surface-variant flex items-center gap-1.5 flex-wrap">
                        <span>{q.vehicle}</span>
                        <span>•</span>
                        <strong>Rs.{Number(q.estimatedFare || 0).toLocaleString('en-IN')}</strong>
                        {q.timestamp && (
                          <>
                            <span>•</span>
                            <span className="font-mono-code">{formatCleanDateTime(q.timestamp)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLockLeadWithAdvance(q)}
                      className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1"
                    >
                      <span>+ Got Adv</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">call</span>
              </div>
              <h4 className="text-sm font-bold text-m3-on-surface">No Pending Enquiries Found</h4>
              <p className="text-xs text-m3-on-surface-variant max-w-md mx-auto">
                Customer calls from Google Ads, website quotes, and WhatsApp messages will appear here. Click below to enter a customer call.
              </p>
              <button
                type="button"
                onClick={() => setShowNewCallModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-full text-xs font-bold shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">add_call</span>
                <span>+ Record Customer Call</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLeads.map((lead, idx) => {
                const phone = extractPhone(lead);
                const isGoogleAds = (lead.sourcePage || '').toLowerCase().includes('google ads') || (lead.calculatorEngine || '').toLowerCase().includes('google ads');
                const isWhatsApp = (lead.quoteId || '').startsWith('#WA') || (lead.sourcePage || '').toLowerCase().includes('whatsapp');

                return (
                  <div
                    key={lead.quoteId || idx}
                    className="p-4 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/80 shadow-m3-1 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:border-amber-300 transition-all"
                  >
                    {/* Left: Customer & Route Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Quote ID Badge */}
                        <span className="font-mono-code text-xs font-black bg-amber-100 text-amber-950 border border-amber-300 px-2 py-0.5 rounded-full">
                          {getOrderedEnquiryId(lead, idx, leads.length)}
                        </span>

                        {/* Source Tag */}
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          isGoogleAds
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : isWhatsApp
                            ? 'bg-green-50 text-green-800 border-green-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          <span className="material-symbols-outlined text-[13px]">
                            {isGoogleAds ? 'campaign' : isWhatsApp ? 'chat' : 'call'}
                          </span>
                          <span>{isGoogleAds ? 'Google Ads Call' : isWhatsApp ? 'WhatsApp' : 'Phone Call'}</span>
                        </span>

                        {/* Customer Name */}
                        <span className="text-xs font-bold text-m3-on-surface">
                          👤 {lead.guestName || 'Customer'}
                        </span>

                        {/* Mobile Phone (Clickable) */}
                        {phone && (
                          <a
                            href={`tel:+91${phone}`}
                            className="text-xs font-mono-code font-bold text-blue-700 hover:underline bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[13px]">call</span>
                            <span>+91 {phone}</span>
                          </a>
                        )}

                        <span className="text-[11px] text-m3-outline ml-auto">
                          🕒 {lead.timestamp}
                        </span>
                      </div>

                      {/* Route Header */}
                      <div className="text-sm font-black text-m3-on-surface truncate">
                        📍 {lead.pickup} ➔ {lead.drop}
                      </div>

                      {/* Vehicle & Date */}
                      <div className="text-xs text-m3-on-surface-variant flex flex-wrap items-center gap-2 font-medium">
                        <span>🚗 {lead.vehicle}</span>
                        <span>•</span>
                        <span>{lead.tripType || 'Round Trip'}</span>
                        {lead.travelDate && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-m3-on-surface">🗓️ {lead.travelDate}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Quoted Price & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-m3-outline-variant/50">
                      <div className="text-left lg:text-right mr-1">
                        <span className="text-base font-black text-amber-950 block">
                          Rs.{Number(lead.estimatedFare || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-m3-on-surface-variant font-medium">Quoted Fare</span>
                      </div>

                      {/* 1. Send WhatsApp Quote */}
                      <button
                        type="button"
                        onClick={() => handleSendQuoteWA(lead)}
                        className="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Send quote & ₹500 advance UPI details on WhatsApp"
                      >
                        <span className="material-symbols-outlined text-[16px] text-emerald-700">chat</span>
                        <span>Send Quote (WA)</span>
                      </button>

                      {/* 2. Follow-up ping */}
                      <button
                        type="button"
                        onClick={() => handleSendFollowUpWA(lead)}
                        className="h-9 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Send follow-up reminder to confirm cab"
                      >
                        <span className="material-symbols-outlined text-[15px] text-amber-700">ring_volume</span>
                        <span className="hidden sm:inline">Follow-up</span>
                      </button>

                      {/* 3. Got ₹500 Advance (Convert to Active Trip) */}
                      <button
                        type="button"
                        onClick={() => handleLockLeadWithAdvance(lead)}
                        className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-black flex items-center gap-1.5 shadow-m3-1 transition-all"
                        title="Customer paid ₹500 advance. Move to Step 2: Active Trips to assign driver"
                      >
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>✅ Got ₹500 Adv (Confirm)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TAB 2: ACTIVE TRIPS REGISTER VIEW (Assign Driver & Cab) */}
      {/* ========================================================= */}
      {activeTab === 'ACTIVE_TRIPS' && (
        <div className="space-y-3">
          {/* Sub-header Filter Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-blue-950 uppercase">
                Step 2 Register: Confirmed Trips in Progress ({filteredActiveBookings.length})
              </span>
              <span className="text-xs text-m3-on-surface-variant">
                • Assign driver & send Duty Slips on WhatsApp
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: `All Active (${activeBookings.length})` },
                { id: 'NEED_DRIVER', label: `⚠️ Needs Driver (${needDriverBookings.length})` },
                { id: 'ON_TRIP', label: `Driver Assigned (${allottedLiveBookings.length})` }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveTripFilter(f.id)}
                  className={`h-7 px-2.5 rounded-full text-[11px] font-bold border transition-colors ${
                    activeTripFilter === f.id
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-m3-surface-container-low text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredActiveBookings.length === 0 ? (
            <div className="p-8 text-center bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">local_taxi</span>
              </div>
              <h4 className="text-sm font-bold text-m3-on-surface">No Active Trips Found</h4>
              <p className="text-xs text-m3-on-surface-variant max-w-md mx-auto">
                When a customer pays the ₹500 advance in Step 1, the trip moves here to assign a driver and send Duty Slips.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('ENQUIRIES')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-full text-xs font-bold shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>View Enquiries in Step 1</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActiveBookings.map((b) => {
                const isUnassigned = !b.assignedChauffeur || b.assignedChauffeur === 'Unassigned';
                const fare = Number(b.terminalFare) || 6000;
                const adv = Number(b.advancePaid) || 500;
                const balanceDue = Math.max(0, fare - adv);
                const driverShare = Number(b.chauffeurPayout) || Math.round(fare * 0.82);
                const profit = fare - driverShare;

                return (
                  <div
                    key={b.bookingId}
                    className="p-4 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/80 shadow-m3-1 space-y-3"
                  >
                    {/* Top Row: Trip Info & Money Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                      {/* 1. Booking ID & Passenger */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono-code text-xs font-black bg-blue-100 text-blue-950 border border-blue-300 px-2 py-0.5 rounded-full">
                            {b.bookingId}
                          </span>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                            isUnassigned
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {isUnassigned ? '⚠️ Need Driver' : `Driver Assigned`}
                          </span>
                        </div>
                        <div className="text-sm font-black text-m3-on-surface">{b.guestNamePhone}</div>
                        <div className="text-xs text-m3-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span className="font-bold text-m3-on-surface">{b.travelDateTime}</span>
                        </div>
                      </div>

                      {/* 2. Route & Vehicle */}
                      <div>
                        <span className="text-[11px] font-bold uppercase text-m3-on-surface-variant block">Route & Vehicle</span>
                        <div className="text-xs font-bold text-m3-on-surface mt-0.5">{b.pickupAddress}</div>
                        <div className="text-xs text-m3-on-surface-variant mt-0.5">
                          🚗 {b.vehicleCategory} • {b.partySize || '4 Pax'}
                        </div>
                      </div>

                      {/* 3. Assigned Driver or Dropdown */}
                      <div>
                        <span className="text-[11px] font-bold uppercase text-m3-on-surface-variant block">Driver & Cab Allotment</span>
                        {isUnassigned ? (
                          <div className="space-y-1.5 mt-1">
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (!e.target.value) return;
                                onAssignChauffeur?.(b.bookingId, e.target.value);
                                showToast?.(`Driver assigned to ${b.bookingId}! Now send Duty Slips.`, 'success');
                              }}
                              className="w-full p-2 rounded-m3-md border border-blue-300 bg-blue-50/50 text-xs font-bold text-blue-950"
                            >
                              <option value="">-- Pick Driver from Roster --</option>
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
                                className="flex-1 h-7 px-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-full text-[11px] font-bold flex items-center justify-center gap-1"
                                title="Share duty in Driver WhatsApp group"
                              >
                                <span className="material-symbols-outlined text-[13px]">campaign</span>
                                <span>WA Group Post</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setShowOutsideFormId(showOutsideFormId === b.bookingId ? null : b.bookingId)}
                                className="h-7 px-2 bg-white hover:bg-m3-surface-container-high border border-m3-outline-variant rounded-full text-[11px] font-bold text-m3-on-surface"
                              >
                                + Outside Cab
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 p-2 rounded-m3-md bg-emerald-50 border border-emerald-200">
                            <div className="text-xs font-black text-emerald-950">👨‍✈️ {b.assignedChauffeur}</div>
                            <button
                              type="button"
                              onClick={() => onAssignChauffeur?.(b.bookingId, 'Unassigned')}
                              className="text-[11px] text-blue-700 hover:underline font-bold mt-0.5 block"
                            >
                              Change Driver
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 4. Money & Balance Summary */}
                      <div className="p-2.5 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant/60 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-m3-on-surface-variant font-medium">Total Fare:</span>
                          <strong className="text-m3-on-surface font-black">Rs.{fare.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between text-emerald-900">
                          <span className="font-semibold">Advance Paid:</span>
                          <span className="font-bold">Rs.{adv}</span>
                        </div>
                        <div className="flex justify-between border-t border-m3-outline-variant/50 pt-1 font-black text-amber-950">
                          <span>Balance to Collect:</span>
                          <span className="text-sm text-red-700">Rs.{balanceDue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-m3-on-surface-variant pt-0.5">
                          <span>Driver Net: Rs.{driverShare}</span>
                          <span className="text-emerald-700 font-bold">Profit: +Rs.{profit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inline Outside Driver Input Form */}
                    {showOutsideFormId === b.bookingId && (
                      <div className="p-3 rounded-m3-md bg-amber-50/70 border border-amber-300 flex flex-wrap items-center gap-2 text-xs animate-fadeIn">
                        <span className="font-bold text-amber-950 text-xs w-full">Enter Outside Market Driver:</span>
                        <input
                          type="text"
                          placeholder="Driver Name (e.g. Mani)"
                          value={outsideDriverMap[b.bookingId]?.name || ''}
                          onChange={(e) => setOutsideDriverMap({ ...outsideDriverMap, [b.bookingId]: { ...(outsideDriverMap[b.bookingId] || {}), name: e.target.value } })}
                          className="flex-1 min-w-[120px] p-2 rounded-m3-sm border border-m3-outline-variant bg-white"
                        />
                        <input
                          type="tel"
                          placeholder="Driver Mobile (10 Digits)"
                          value={outsideDriverMap[b.bookingId]?.phone || ''}
                          onChange={(e) => setOutsideDriverMap({ ...outsideDriverMap, [b.bookingId]: { ...(outsideDriverMap[b.bookingId] || {}), phone: e.target.value } })}
                          className="flex-1 min-w-[120px] p-2 rounded-m3-sm border border-m3-outline-variant bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Car Plate (TN 09 BX 1234)"
                          value={outsideDriverMap[b.bookingId]?.plate || ''}
                          onChange={(e) => setOutsideDriverMap({ ...outsideDriverMap, [b.bookingId]: { ...(outsideDriverMap[b.bookingId] || {}), plate: e.target.value.toUpperCase() } })}
                          className="flex-1 min-w-[120px] p-2 rounded-m3-sm border border-m3-outline-variant bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const d = outsideDriverMap[b.bookingId] || {};
                            if (!d.name || !d.plate) {
                              showToast?.('Please enter Driver Name and Vehicle Plate', 'error');
                              return;
                            }
                            onAssignChauffeur?.(b.bookingId, `${d.name} (${d.plate}) - +91 ${d.phone || ''}`);
                            setShowOutsideFormId(null);
                            showToast?.(`Outside driver assigned to ${b.bookingId}!`, 'success');
                          }}
                          className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs"
                        >
                          Save & Allot Driver
                        </button>
                      </div>
                    )}

                    {/* Bottom Row: Duty Slips & Complete Trip Action */}
                    {!isUnassigned && (
                      <div className="pt-2 border-t border-m3-outline-variant/60 flex flex-wrap items-center justify-between gap-2">
                        {/* WhatsApp Duty Slips */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendCustomerDutySlip(b)}
                            className="h-8 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px] text-blue-700">person</span>
                            <span>Duty Slip ➔ Customer (WA)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendDriverDutySlip(b)}
                            className="h-8 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px] text-emerald-700">local_taxi</span>
                            <span>Duty Slip ➔ Driver (WA)</span>
                          </button>

                          {onOpenDutySlip && (
                            <button
                              type="button"
                              onClick={() => onOpenDutySlip(b)}
                              className="h-8 px-2.5 bg-white hover:bg-m3-surface-container-high border border-m3-outline-variant rounded-full text-xs font-semibold text-m3-on-surface flex items-center gap-1"
                              title="Enter Start/End KM meter readings and toll receipts"
                            >
                              <span className="material-symbols-outlined text-[15px]">speed</span>
                              <span>Meter KM & Tolls</span>
                            </button>
                          )}
                        </div>

                        {/* Trip Status & Mark Completed */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {['Driver En Route', 'At Pickup', 'In Progress'].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => onStatusChange?.(b.bookingId, st)}
                              className={`h-7 px-2 rounded-full text-[11px] font-bold border transition-colors ${
                                b.manifestStatus === st
                                  ? 'bg-blue-600 text-white border-blue-700'
                                  : 'bg-white text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
                              }`}
                            >
                              {st}
                            </button>
                          ))}

                          {/* FINISH TRIP BUTTON */}
                          <button
                            type="button"
                            onClick={() => {
                              onStatusChange?.(b.bookingId, 'Completed');
                              showToast?.(`🎉 Trip ${b.bookingId} marked Completed! Moved to Step 3.`, 'success');
                              setActiveTab('COMPLETED');
                            }}
                            className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black flex items-center gap-1 shadow-xs transition-colors"
                            title="Trip finished and balance collected from customer"
                          >
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            <span>🏁 Mark Completed</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. TAB 3: COMPLETED TRIPS & 5★ REVIEWS REGISTER VIEW       */}
      {/* ========================================================= */}
      {activeTab === 'COMPLETED' && (
        <div className="space-y-3">
          {/* Summary Strip */}
          <div className="p-3.5 rounded-m3-xl bg-emerald-50/80 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black text-emerald-950 uppercase block">
                Step 3 Register: Completed Duties ({filteredCompletedBookings.length})
              </span>
              <span className="text-xs text-emerald-800">
                Send 5-star Google review links to build your Google ranking & repeat business
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-medium text-emerald-900 block">Total Profit Earned:</span>
              <span className="text-lg font-black text-emerald-900">
                +Rs.{totalCommissionEarned.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Empty State */}
          {filteredCompletedBookings.length === 0 ? (
            <div className="p-8 text-center bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">star</span>
              </div>
              <h4 className="text-sm font-bold text-m3-on-surface">No Completed Trips in Register</h4>
              <p className="text-xs text-m3-on-surface-variant max-w-md mx-auto">
                When trips finish in Step 2, click "Mark Completed" to save them here and request 5-star Google reviews.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredCompletedBookings.map((b) => {
                const fare = Number(b.terminalFare) || 0;
                const driverShare = Number(b.chauffeurPayout) || Math.round(fare * 0.82);
                const profit = fare - driverShare;
                const isReviewSent = b.reviewStatus === 'Requested';

                return (
                  <div
                    key={b.bookingId}
                    className="p-4 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/80 shadow-m3-1 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono-code text-xs font-black bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-full">
                          {b.bookingId}
                        </span>
                        <span className="text-xs font-bold text-m3-on-surface">
                          👤 {b.guestNamePhone}
                        </span>
                        <span className="text-[11px] text-m3-on-surface-variant">
                          👨‍✈️ Driver: {b.assignedChauffeur}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-m3-on-surface">
                        📍 {b.pickupAddress} • 🗓️ {b.travelDateTime}
                      </div>

                      <div className="text-xs text-m3-on-surface-variant">
                        Fare: <strong>Rs.{fare.toLocaleString('en-IN')}</strong> • Driver: Rs.{driverShare.toLocaleString('en-IN')} • <strong className="text-emerald-700">Profit: +Rs.{profit.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    {/* Google Review 1-Tap WhatsApp Button */}
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendReviewWA(b)}
                        className={`h-9 px-4 rounded-full text-xs font-black flex items-center gap-1.5 transition-all shadow-xs ${
                          isReviewSent
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-m3-1'
                        }`}
                        title="Send 1-tap Google Review link on WhatsApp"
                      >
                        <span className="material-symbols-outlined text-[16px]">star</span>
                        <span>{isReviewSent ? 'Resend 5★ Review WA' : '⭐ Send 5★ Google Review'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
