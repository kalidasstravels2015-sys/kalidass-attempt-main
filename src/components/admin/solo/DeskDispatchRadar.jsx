import React, { useState, useMemo } from 'react';
import { checkChauffeurConflict } from './ConflictDetector';

export default function DeskDispatchRadar({
  bookings,
  chauffeurs,
  onAssignChauffeur,
  onStatusChange,
  onReviewStatusChange,
  onOpenDutySlip,
  showToast
}) {
  const [subFilter, setSubFilter] = useState('tomorrow'); // 'tomorrow', 'today', 'upcoming', 'reviews', 'all'
  const [attachingBookingId, setAttachingBookingId] = useState(null);
  const [driverInput, setDriverInput] = useState({ name: '', phone: '', plate: '' });

  // Classify bookings by timeline
  const categorized = useMemo(() => {
    const unassignedList = [];
    const todayList = [];
    const tomorrowList = [];
    const upcomingList = [];
    const completedList = [];

    bookings.forEach(b => {
      if (b.manifestStatus === 'Completed') {
        completedList.push(b);
        return;
      }
      if (b.manifestStatus === 'Cancelled') return;

      if (!b.assignedChauffeur || b.assignedChauffeur === 'Unassigned') {
        unassignedList.push(b);
      }

      const lower = (b.travelDateTime || '').toLowerCase();
      if (lower.includes('today')) {
        todayList.push(b);
      } else if (lower.includes('tomorrow')) {
        tomorrowList.push(b);
      } else {
        upcomingList.push(b);
      }
    });

    return { unassignedList, todayList, tomorrowList, upcomingList, completedList };
  }, [bookings]);

  // Active view list
  const activeList = useMemo(() => {
    if (subFilter === 'unassigned') return categorized.unassignedList;
    if (subFilter === 'today') return categorized.todayList;
    if (subFilter === 'tomorrow') return categorized.tomorrowList;
    if (subFilter === 'upcoming') return categorized.upcomingList;
    if (subFilter === 'reviews') return categorized.completedList;
    return bookings.filter(b => b.manifestStatus !== 'Cancelled');
  }, [subFilter, categorized, bookings]);

  const [broadcastBooking, setBroadcastBooking] = useState(null);
  const [officeMargin, setOfficeMargin] = useState(1000);

  // Open 1-Tap "Broadcast to Driver WhatsApp Group" Drawer with Margin Chips
  const handleOpenBroadcastDrawer = (booking) => {
    const defaultMargin = Number(booking.companyMargin) > 0
      ? Number(booking.companyMargin)
      : (Number(booking.terminalFare) >= 5000 ? 1500 : 1000);
    setOfficeMargin(defaultMargin);
    setBroadcastBooking(booking);
  };

  const handleExecuteBroadcast = () => {
    if (!broadcastBooking) return;
    const terminalFare = Number(broadcastBooking.terminalFare) || 0;
    const driverPayout = Math.max(0, terminalFare - officeMargin);

    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(broadcastBooking.pickupAddress)}`;
    const message = `🚕 *DUTY BROADCAST — KALIDASS TRAVELS*\n` +
      `Trip Ref: *${broadcastBooking.bookingId}*\n\n` +
      `🗓 *Travel Time:* ${broadcastBooking.travelDateTime}\n` +
      `📍 *Route:* ${broadcastBooking.pickupAddress}\n` +
      `🗺️ *Open in Maps:* ${mapsLink}\n` +
      `🚗 *Required Vehicle:* ${broadcastBooking.vehicleCategory} (${broadcastBooking.partySize})\n` +
      `💰 *Driver Net Payout:* *₹${driverPayout.toLocaleString('en-IN')} Net*\n` +
      `_(Tolls & Parking paid by guest at actuals)_\n\n` +
      `📱 *First driver to reply with Car Plate & Phone Number gets this duty!*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    showToast?.('Duty broadcast formatted with margin and opened in WhatsApp!', 'success');
    setBroadcastBooking(null);
  };

  // 1-Tap Attach Driver from Group Reply
  const handleSaveAttachedDriver = (bookingId) => {
    if (!driverInput.name.trim() || !driverInput.plate.trim()) {
      showToast?.('Please enter Driver Name and Vehicle Plate Number', 'error');
      return;
    }

    const assignedString = `${driverInput.name.trim()} (${driverInput.plate.trim()}) - ${driverInput.phone.trim() || 'Driver'}`;
    onAssignChauffeur(bookingId, assignedString);
    setAttachingBookingId(null);
    setDriverInput({ name: '', phone: '', plate: '' });
    showToast?.(`Driver assigned to ${bookingId}! Now send details to guest.`, 'success');
  };

  const getTripUrl = (booking) => {
    const bookingId = typeof booking === 'string' ? booking : booking?.bookingId;
    const cleanRef = (bookingId || '').replace(/[^A-Za-z0-9]/g, '');
    const base =
      typeof window !== 'undefined' && window.location && window.location.origin
        ? `${window.location.origin}/trip/?ref=${cleanRef}`
        : `https://kalidasstravels.in/trip/?ref=${cleanRef}`;

    if (booking && typeof booking === 'object') {
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
        const encoded = btoa(encodeURIComponent(JSON.stringify(compact)));
        return `${base}&d=${encodeURIComponent(encoded)}`;
      } catch (_) {}
    }
    return base;
  };

  // 1-Tap "Send Duty Slip to Customer" WhatsApp message with Mobile Web Link
  const handleSendChauffeurToGuest = (booking) => {
    const guestPhoneMatch = (booking.guestNamePhone || '').match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
    const guestPhone = guestPhoneMatch ? guestPhoneMatch[0].replace(/[^0-9]/g, '') : '';
    const guestName = booking.guestNamePhone?.split('(')[0].trim() || 'Guest';
    const tripUrl = getTripUrl(booking);
    const totalFare = Number(booking.terminalFare) || 0;
    const adv = Number(booking.advancePaid) || 0;
    const balance = Math.max(0, totalFare - adv);

    const message = `🚖 *KALIDASS TRAVELS — CAB & DRIVER DETAILS*\n` +
      `Booking ID: *${booking.bookingId}*\n\n` +
      `👨‍✈️ *Driver & Cab:* ${booking.assignedChauffeur}\n` +
      `🚗 *Vehicle:* ${booking.vehicleCategory}\n` +
      `🗓 *Pickup Time:* ${booking.travelDateTime}\n` +
      `📍 *Route:* ${booking.pickupAddress}\n\n` +
      `💰 *Total Fare:* ₹${totalFare.toLocaleString('en-IN')}\n` +
      `🟢 *Advance Paid:* ₹${adv.toLocaleString('en-IN')}\n` +
      `🔴 *Balance to Pay Driver:* ₹${balance.toLocaleString('en-IN')}\n\n` +
      `📱 *Open Live Digital Duty Slip:*\n${tripUrl}\n\n` +
      `Have a safe and pleasant journey! ✨\n` +
      `📞 24/7 Helpline: +91 89395 39211`;

    const cleanPhone = guestPhone.length >= 10 ? guestPhone.slice(-10) : '';
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // 1-Tap "Send Duty Slip to Driver" WhatsApp message with Pickup Pin & Odometer Link
  const handleSendDutySlipToDriver = (booking) => {
    const driverPhoneMatch = (booking.assignedChauffeur || '').match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
    const driverPhone = driverPhoneMatch ? driverPhoneMatch[0].replace(/[^0-9]/g, '') : '';
    const driverName = booking.assignedChauffeur?.split('(')[0]?.trim() || 'Driver';
    const tripUrl = getTripUrl(booking);
    const totalFare = Number(booking.terminalFare) || 0;
    const adv = Number(booking.advancePaid) || 0;
    const balanceToCollect = Math.max(0, totalFare - adv);
    const driverShare = Number(booking.chauffeurPayout) || Math.round(totalFare * 0.82);
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickupAddress || 'Chennai')}`;

    const message = `🚕 *KALIDASS TRAVELS — DRIVER DUTY SLIP*\n` +
      `Trip ID: *${booking.bookingId}*\n\n` +
      `👤 *Passenger:* ${booking.guestNamePhone}\n` +
      `🗓 *Pickup Date & Time:* ${booking.travelDateTime}\n` +
      `📍 *Pickup & Route:* ${booking.pickupAddress}\n` +
      `🗺️ *Google Maps Pin:* ${mapsLink}\n\n` +
      `💵 *Collect Balance from Customer at Drop:* *₹${balanceToCollect.toLocaleString('en-IN')}*\n` +
      `🤝 *Your Net Driver Share:* ₹${driverShare.toLocaleString('en-IN')}\n\n` +
      `📱 *Enter Start/End KM & Close Bill Here:*\n${tripUrl}`;

    const cleanPhone = driverPhone.length >= 10 ? driverPhone.slice(-10) : '';
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // 1-Tap "Send Trip Link to Both"
  const handleSendTripLinkToBoth = (booking) => {
    const tripUrl = getTripUrl(booking);
    const text = `*KALIDASS TRAVELS — DIGITAL TRIP SHEET*\nTrip Ref: *${booking.bookingId}*\nRoute: ${booking.pickupAddress}\n\n📱 Live Trip Details: ${tripUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 1-Tap Google Review Request to Guest via WhatsApp
  const handleSendReviewToGuest = (booking) => {
    const guestPhoneMatch = (booking.guestNamePhone || '').match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
    const guestPhone = guestPhoneMatch ? guestPhoneMatch[0].replace(/[^0-9]/g, '') : '';
    const guestName = booking.guestNamePhone?.split('(')[0].trim() || 'Guest';

    const message = `*KALIDASS TRAVELS — THANK YOU FOR TRAVELING WITH US!*\n\n` +
      `Dear ${guestName} ji, we hope you had a comfortable and pleasant journey with Kalidass Travels.\n\n` +
      `Your support helps our family-run team grow. If you enjoyed our service, could you take 30 seconds to rate us on Google?\n\n` +
      `⭐ *Tap here to leave a 5-star review:* https://share.google/1IOq41QwMkhDJvrLY\n\n` +
      `Thank you for choosing Kalidass Travels! Safe travels and see you again soon. 🙏`;

    const cleanPhone = guestPhone.length >= 10 ? guestPhone.slice(-10) : '';
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onReviewStatusChange?.(booking.bookingId, 'Requested');
    showToast?.(`5-star review request sent to ${guestName}! Status updated to Requested.`, 'success');
  };

  // Toggle Review Received
  const handleToggleReviewReceived = (bookingId, currentStatus) => {
    const nextStatus = currentStatus === 'Received' ? 'Requested' : 'Received';
    onReviewStatusChange?.(bookingId, nextStatus);
    showToast?.(`Review status updated to: ${nextStatus}`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Sub-Filter Timeline Navigation Pills */}
      <div className="bg-white rounded-2xl p-2 border border-m3-outline-variant shadow-sm flex items-center justify-between gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSubFilter('unassigned')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            subFilter === 'unassigned'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">warning</span>
          <span>Needs Driver ({categorized.unassignedList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubFilter('tomorrow')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            subFilter === 'tomorrow'
              ? 'bg-m3-tertiary-container/300 text-m3-on-surface shadow-sm'
              : 'text-m3-on-surface-variant hover:bg-m3-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-sm">wb_twilight</span>
          <span>Tomorrow ({categorized.tomorrowList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubFilter('today')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            subFilter === 'today'
              ? 'bg-m3-inverse-surface text-white shadow-sm'
              : 'text-m3-on-surface-variant hover:bg-m3-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-sm">navigation</span>
          <span>Today / Live ({categorized.todayList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubFilter('upcoming')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            subFilter === 'upcoming'
              ? 'bg-m3-inverse-surface text-white shadow-sm'
              : 'text-m3-on-surface-variant hover:bg-m3-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-sm">calendar_month</span>
          <span>Next Week ({categorized.upcomingList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubFilter('reviews')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            subFilter === 'reviews'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-purple-800 bg-purple-50 hover:bg-purple-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">reviews</span>
          <span>Completed & Reviews ({categorized.completedList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubFilter('all')}
          className={`py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            subFilter === 'all'
              ? 'bg-m3-inverse-surface text-white shadow-sm'
              : 'text-m3-on-surface-variant hover:bg-m3-surface-container'
          }`}
        >
          All
        </button>
      </div>

      {/* Helper Banner for Selected Tab */}
      {subFilter === 'reviews' && (
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-700 text-base">grade</span>
            <span>
              <strong>Customer Reputation Engine:</strong> Send 1-tap Google Review requests via WhatsApp to guests who completed their trips.
            </span>
          </div>
          <span className="text-[10px] font-bold bg-purple-200/80 text-purple-900 px-2.5 py-0.5 rounded-full uppercase font-mono">
            {categorized.completedList.filter(b => b.reviewStatus === 'Received').length} / {categorized.completedList.length} Reviewed
          </span>
        </div>
      )}
      {subFilter === 'tomorrow' && (
        <div className="p-3 rounded-xl bg-m3-tertiary-container/30 border border-m3-tertiary/30 text-m3-on-tertiary-container text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-m3-tertiary text-base">campaign</span>
            <span>
              <strong>Evening Sourcing Window:</strong> Assign your own car or broadcast to your driver WhatsApp group before 8:00 PM.
            </span>
          </div>
          <span className="text-[10px] font-bold bg-m3-tertiary-container/80 px-2 py-0.5 rounded uppercase">Tonight</span>
        </div>
      )}

      {subFilter === 'upcoming' && (
        <div className="p-3 rounded-xl bg-m3-surface-container-low border border-m3-outline-variant text-m3-on-surface-variant text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-m3-outline text-base">lock_clock</span>
          <span>
            <strong>Advance Bookings:</strong> These trips are 100% locked with advance payment. Driver sourcing opens the evening before departure.
          </span>
        </div>
      )}

      {/* Cards Stream */}
      {activeList.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-m3-outline-variant shadow-sm">
          <span className="material-symbols-outlined text-4xl text-m3-inverse-on-surface/80 mb-2">event_available</span>
          <p className="text-xs font-bold text-m3-on-surface-variant">No trips scheduled in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeList.map((b) => {
            const conflict = checkChauffeurConflict(b, bookings, chauffeurs);
            const isUnassigned = !b.assignedChauffeur || b.assignedChauffeur === 'Unassigned';

            return (
              <div
                key={b.bookingId}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  conflict.hasConflict
                    ? 'border-m3-error/40 ring-2 ring-m3-error/30'
                    : isUnassigned && subFilter === 'tomorrow'
                    ? 'border-m3-tertiary/40 shadow-md'
                    : 'border-m3-outline-variant shadow-sm'
                }`}
              >
                {/* Conflict Banner */}
                {conflict.hasConflict && (
                  <div className="bg-m3-error-container/300 text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>{conflict.message}</span>
                  </div>
                )}

                <div className="p-3.5 sm:p-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono font-bold text-sm text-m3-on-surface">{b.bookingId}</span>
                        {b.manifestStatus === 'Completed' ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Completed
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-m3-success-container/70 text-m3-on-success-container border border-m3-success/40">
                            Advance Locked
                          </span>
                        )}
                        {b.manifestStatus === 'Completed' && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            b.reviewStatus === 'Received'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : b.reviewStatus === 'Requested'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {b.reviewStatus === 'Received' ? '⭐ Review Received' : b.reviewStatus === 'Requested' ? '💬 Review Requested' : '⚠️ Review Pending'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-m3-tertiary mt-0.5">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>{b.travelDateTime}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-m3-on-surface font-mono block">
                        ₹{Number(b.terminalFare || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-m3-success font-semibold font-mono">
                        Profit: ₹{b.companyMargin || (b.terminalFare - b.chauffeurPayout)}
                      </span>
                    </div>
                  </div>

                  {/* Route & Passenger */}
                  <div className="bg-m3-surface-container-low rounded-xl p-2.5 mb-3 border border-m3-outline-variant/40">
                    <div className="flex items-start gap-1.5 text-xs text-m3-on-surface font-medium mb-1.5">
                      <span className="material-symbols-outlined text-sm text-m3-tertiary shrink-0 mt-0.5">near_me</span>
                      <span className="line-clamp-2">{b.pickupAddress}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-xs text-m3-on-surface-variant gap-2 border-t border-m3-outline-variant/60 pt-1.5">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-m3-outline-variant">person</span>
                        <span className="font-semibold text-m3-on-surface-variant">{b.guestNamePhone}</span>
                      </div>
                      <div className="text-[11px] text-m3-outline">
                        {b.vehicleCategory} ({b.partySize})
                      </div>
                    </div>
                  </div>

                  {/* Chauffeur Assignment Block */}
                  <div className="mb-3">
                    {isUnassigned ? (
                      <div className="p-3 rounded-xl bg-m3-tertiary-container/30/80 border border-m3-tertiary/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-m3-on-tertiary-container flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-m3-tertiary">no_accounts</span>
                            <span>Chauffeur Not Assigned Yet</span>
                          </span>
                          <span className="text-[11px] text-m3-outline font-mono">
                            Driver Share: ₹{b.chauffeurPayout || Math.round(b.terminalFare * 0.8)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenBroadcastDrawer(b)}
                            className="flex-1 py-2 px-3 bg-m3-success hover:bg-m3-success text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">groups</span>
                            <span>Broadcast to Driver Group</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAttachingBookingId(attachingBookingId === b.bookingId ? null : b.bookingId)}
                            className="py-2 px-3 bg-white hover:bg-m3-surface-container-low text-m3-on-surface-variant border border-m3-outline-variant rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">person_add</span>
                            <span>Attach Driver</span>
                          </button>
                        </div>

                        {/* Inline Driver Attachment Form */}
                        {attachingBookingId === b.bookingId && (
                          <div className="pt-2 border-t border-m3-tertiary/30 space-y-2 animate-fadeIn">
                            {chauffeurs && chauffeurs.length > 0 && (
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                  Quick Select from Your Saved Drivers:
                                </label>
                                <select
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) return;
                                    onAssignChauffeur(b.bookingId, val);
                                    setAttachingBookingId(null);
                                    showToast?.(`Driver assigned to ${b.bookingId}! Now send Duty Slips.`, 'success');
                                  }}
                                  defaultValue=""
                                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-bold"
                                >
                                  <option value="">-- Choose Saved Driver & Cab --</option>
                                  {chauffeurs.map((c, idx) => (
                                    <option
                                      key={idx}
                                      value={`${c.name} (${c.plate}) - ${c.phone}`}
                                    >
                                      {c.name} • {c.plate} ({c.category}) • {c.phone}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div className="text-[10px] font-bold uppercase text-slate-500">
                              Or Enter Outside / Partner Driver & Cab:
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                placeholder="Driver Name"
                                value={driverInput.name}
                                onChange={(e) => setDriverInput({ ...driverInput, name: e.target.value })}
                                className="text-xs p-2 rounded-lg border border-m3-outline-variant bg-white"
                              />
                              <input
                                type="text"
                                placeholder="Phone (10 digits)"
                                value={driverInput.phone}
                                onChange={(e) => setDriverInput({ ...driverInput, phone: e.target.value })}
                                className="text-xs p-2 rounded-lg border border-m3-outline-variant bg-white"
                              />
                              <input
                                type="text"
                                placeholder="Plate (TN09 CZ 9999)"
                                value={driverInput.plate}
                                onChange={(e) => setDriverInput({ ...driverInput, plate: e.target.value })}
                                className="text-xs p-2 rounded-lg border border-m3-outline-variant bg-white"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveAttachedDriver(b.bookingId)}
                              className="w-full py-1.5 bg-m3-inverse-surface hover:bg-m3-surface-container-high text-white text-xs font-bold rounded-lg"
                            >
                              Confirm & Assign Driver
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-m3-surface-container-low border border-m3-outline-variant space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-700 block">✅ Step 3: Driver & Cab Assigned</span>
                            <span className="font-bold text-xs text-m3-on-surface">{b.assignedChauffeur}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onAssignChauffeur(b.bookingId, 'Unassigned')}
                            className="self-start sm:self-auto px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-rose-600 text-[11px] font-bold"
                          >
                            Change Driver
                          </button>
                        </div>

                        {/* Step 4: Send Duty Slip to BOTH Customer and Driver */}
                        <div className="pt-2 border-t border-slate-200/80">
                          <span className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1.5">
                            Step 4: Send Duty Slip to Customer & Driver (WhatsApp)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleSendChauffeurToGuest(b)}
                              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">person</span>
                              <span>📲 Duty Slip to Customer</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendDutySlipToDriver(b)}
                              className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">local_taxi</span>
                              <span>🚕 Duty Slip to Driver</span>
                            </button>
                          </div>
                        </div>

                        {/* Step 5: Follow Live Trip Movement */}
                        <div className="pt-2 border-t border-slate-200/80">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] uppercase font-extrabold text-slate-500">
                              Step 5: Follow Trip Movement (Tap to Update Live Status)
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              {b.manifestStatus || 'Scheduled'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {[
                              { label: '1. Driver En Route', val: 'Driver En Route' },
                              { label: '2. At Pickup', val: 'At Pickup' },
                              { label: '3. Trip Started', val: 'In Progress' },
                              { label: '4. Completed', val: 'Completed' }
                            ].map((st) => {
                              const active = (b.manifestStatus || '') === st.val;
                              return (
                                <button
                                  key={st.val}
                                  type="button"
                                  onClick={() => {
                                    onStatusChange?.(b.bookingId, st.val);
                                    showToast?.(`Trip ${b.bookingId} status: ${st.val}`, 'success');
                                  }}
                                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                                    active
                                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {st.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Ribbon */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-m3-outline-variant/40">
                    <button
                      type="button"
                      onClick={() => onOpenDutySlip(b)}
                      className="flex-1 py-2 px-3 bg-m3-tertiary-container/300 hover:bg-m3-tertiary text-m3-on-surface font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">receipt_long</span>
                      <span>Calculate Final Bill (Start/End KM & Balance)</span>
                    </button>

                    {b.manifestStatus === 'Completed' && (
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleSendReviewToGuest(b)}
                          className={`flex-1 sm:flex-none py-2 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                            b.reviewStatus === 'Received'
                              ? 'bg-emerald-600 text-white'
                              : b.reviewStatus === 'Requested'
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-[1.02]'
                          }`}
                          title="Send 5-Star Google Review Link to Guest WhatsApp"
                        >
                          <span className="material-symbols-outlined text-sm">star</span>
                          <span>
                            {b.reviewStatus === 'Received'
                              ? '5★ Received'
                              : b.reviewStatus === 'Requested'
                              ? 'Resend Review WA'
                              : 'Send 5★ Review WA'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleReviewReceived(b.bookingId, b.reviewStatus)}
                          className="py-2 px-2.5 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                          title="Toggle Review Received Status"
                        >
                          <span className="material-symbols-outlined text-sm text-emerald-600">
                            {b.reviewStatus === 'Received' ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <span className="hidden sm:inline">
                            {b.reviewStatus === 'Received' ? 'Marked' : 'Mark Received'}
                          </span>
                        </button>
                      </div>
                    )}

                    {!isUnassigned && b.manifestStatus !== 'Completed' && (
                      <button
                        type="button"
                        onClick={() => handleSendTripLinkToBoth(b)}
                        className="py-2 px-3 bg-m3-inverse-surface hover:bg-m3-surface-container-high text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                        title="Send Mobile Web Trip Sheet link to Driver and Guest"
                      >
                        <span className="material-symbols-outlined text-sm">link</span>
                        <span>Send Trip Link</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Broadcast to Driver Group Modal with Margin Chips */}
      {broadcastBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-m3-outline-variant overflow-hidden text-m3-on-surface">
            {/* Modal Header */}
            <div className="bg-m3-inverse-surface text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-success text-lg">campaign</span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide">Driver Group Duty Broadcast</h3>
                  <span className="text-[10px] text-m3-inverse-on-surface/80 font-mono">{broadcastBooking.bookingId}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastBooking(null)}
                className="text-m3-outline-variant hover:text-white p-1 rounded"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              {/* Fare & Office Margin Selector */}
              <div className="bg-m3-surface-container-low p-3 rounded-xl border border-m3-outline-variant space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-m3-outline font-semibold">Total Fare from Guest:</span>
                  <span className="font-mono font-extrabold text-m3-on-surface text-sm">
                    ₹{Number(broadcastBooking.terminalFare || 6000).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="border-t border-m3-outline-variant/80 pt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-bold text-m3-on-surface-variant uppercase">
                      Select Office Margin (Your Cut):
                    </span>
                    <span className="font-mono font-bold text-m3-success text-xs">
                      ₹{officeMargin}
                    </span>
                  </div>

                  {/* 1-Click Margin Chips */}
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[1000, 1200, 1500, 2000].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setOfficeMargin(m)}
                        className={`py-1 px-1.5 rounded-lg text-xs font-bold border transition-all ${
                          officeMargin === m
                            ? 'bg-m3-success text-white border-m3-success shadow-sm'
                            : 'bg-white text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container'
                        }`}
                      >
                        ₹{m}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-m3-outline font-semibold">Custom Margin:</span>
                    <input
                      type="number"
                      value={officeMargin}
                      onChange={(e) => setOfficeMargin(Number(e.target.value) || 0)}
                      className="flex-1 p-1.5 text-xs font-mono font-bold rounded-lg border border-m3-outline-variant bg-white"
                    />
                  </div>
                </div>

                {/* Net Driver Share Display */}
                <div className="bg-m3-success-container/40 border border-m3-success/30 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-m3-on-success-container uppercase block">
                      Driver Guaranteed Payout:
                    </span>
                    <span className="text-base font-black text-m3-success font-mono">
                      ₹{Math.max(0, (Number(broadcastBooking.terminalFare) || 6000) - officeMargin).toLocaleString('en-IN')} Net
                    </span>
                  </div>
                  <span className="text-[10px] text-m3-on-success-container text-right">
                    Tolls & Parking<br />paid by guest
                  </span>
                </div>
              </div>

              {/* Message Preview Box */}
              <div>
                <span className="text-[10px] font-bold text-m3-outline uppercase block mb-1">
                  WhatsApp Broadcast Preview:
                </span>
                <div className="bg-m3-inverse-surface text-m3-inverse-on-surface/90 p-2.5 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-line border border-m3-outline-variant/40 max-h-36 overflow-y-auto">
                  {`🚕 *DUTY BROADCAST — KALIDASS TRAVELS*\nTrip Ref: *${broadcastBooking.bookingId}*\n\n🗓 *Travel:* ${broadcastBooking.travelDateTime}\n📍 *Route:* ${broadcastBooking.pickupAddress}\n🚗 *Required:* ${broadcastBooking.vehicleCategory} (${broadcastBooking.partySize})\n💰 *Driver Payout:* *₹${Math.max(0, (Number(broadcastBooking.terminalFare) || 6000) - officeMargin).toLocaleString('en-IN')} Net*\n_(Tolls & Parking paid by guest at actuals)_\n\n📱 *First driver to reply with Car Plate & Phone gets this duty!*`}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBroadcastBooking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-m3-outline-variant font-bold text-m3-on-surface-variant hover:bg-m3-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBroadcast}
                  className="flex-[2] py-2.5 rounded-xl bg-m3-success hover:bg-m3-success text-white font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>Post to Driver Group</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
