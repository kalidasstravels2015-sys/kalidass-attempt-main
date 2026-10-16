import React, { useState, useMemo } from 'react';
import { checkChauffeurConflict } from './ConflictDetector';

export default function DeskDispatchRadar({
  bookings,
  chauffeurs,
  onAssignChauffeur,
  onStatusChange,
  onOpenDutySlip,
  showToast
}) {
  const [subFilter, setSubFilter] = useState('tomorrow'); // 'tomorrow', 'today', 'upcoming', 'all'
  const [attachingBookingId, setAttachingBookingId] = useState(null);
  const [driverInput, setDriverInput] = useState({ name: '', phone: '', plate: '' });

  // Classify bookings by timeline
  const categorized = useMemo(() => {
    const unassignedList = [];
    const todayList = [];
    const tomorrowList = [];
    const upcomingList = [];

    bookings.forEach(b => {
      if (b.manifestStatus === 'Completed' || b.manifestStatus === 'Cancelled') return;

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

    return { unassignedList, todayList, tomorrowList, upcomingList };
  }, [bookings]);

  // Active view list
  const activeList = useMemo(() => {
    if (subFilter === 'unassigned') return categorized.unassignedList;
    if (subFilter === 'today') return categorized.todayList;
    if (subFilter === 'tomorrow') return categorized.tomorrowList;
    if (subFilter === 'upcoming') return categorized.upcomingList;
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
    const terminalFare = Number(broadcastBooking.terminalFare) || 6000;
    const driverPayout = Math.max(0, terminalFare - officeMargin);

    const message = `🚕 *DUTY BROADCAST — KALIDASS TRAVELS*\n` +
      `Trip Ref: *${broadcastBooking.bookingId}*\n\n` +
      `🗓 *Travel Time:* ${broadcastBooking.travelDateTime}\n` +
      `📍 *Route:* ${broadcastBooking.pickupAddress}\n` +
      `🚗 *Required Vehicle:* ${broadcastBooking.vehicleCategory} (${broadcastBooking.partySize})\n` +
      `💰 *Driver Net Payout:* *Rs. ${driverPayout.toLocaleString('en-IN')} Net*\n` +
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

  const getTripUrl = (bookingId) => {
    const cleanRef = (bookingId || 'KT101').replace(/[^A-Za-z0-9]/g, '');
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return `${window.location.origin}/trip/?ref=${cleanRef}`;
    }
    return `https://kalidasstravels.in/trip/?ref=${cleanRef}`;
  };

  // 1-Tap "Send Chauffeur to Guest" WhatsApp message with Mobile Web Link
  const handleSendChauffeurToGuest = (booking) => {
    const guestPhoneMatch = (booking.guestNamePhone || '').match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
    const guestPhone = guestPhoneMatch ? guestPhoneMatch[0].replace(/[^0-9]/g, '') : '';
    const guestName = booking.guestNamePhone?.split('(')[0].trim() || 'Guest';
    const tripUrl = getTripUrl(booking.bookingId);

    const message = `*KALIDASS TRAVELS CHENNAI — CHAUFFEUR ASSIGNMENT*\n\n` +
      `Namaskaram ${guestName} ji! Your chauffeur details for Trip *${booking.bookingId}* are ready:\n\n` +
      `👨‍✈️ *Chauffeur:* ${booking.assignedChauffeur}\n` +
      `🚗 *Vehicle:* ${booking.vehicleCategory}\n` +
      `🗓 *Pickup Time:* ${booking.travelDateTime}\n` +
      `📍 *Pickup Address:* ${booking.pickupAddress}\n\n` +
      `📱 *Live Digital Trip Sheet & Chauffeur Details:*\n${tripUrl}\n\n` +
      `Your chauffeur will reach 10-15 minutes prior to departure. For 24/7 support, call our control line at +91 89395 39211.\n` +
      `Wishing you a blessed and safe journey! 🌟`;

    const cleanPhone = guestPhone.length >= 10 ? guestPhone.slice(-10) : '';
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // 1-Tap "Send Trip Link to Both"
  const handleSendTripLinkToBoth = (booking) => {
    const tripUrl = getTripUrl(booking.bookingId);
    const text = `*KALIDASS TRAVELS — DIGITAL TRIP SHEET*\nTrip Ref: *${booking.bookingId}*\nRoute: ${booking.pickupAddress}\n\n📱 Live Trip Details: ${tripUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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
          <span>Next Week & Beyond ({categorized.upcomingList.length})</span>
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
            <strong>Advance Bookings:</strong> These trips are 100% locked with token advance. Driver sourcing opens the evening before departure.
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
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-m3-on-surface">{b.bookingId}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-m3-success-container/70 text-m3-on-success-container border border-m3-success/40">
                          Advance Locked
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-m3-tertiary mt-0.5">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>{b.travelDateTime}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-m3-on-surface font-mono block">
                        Rs. {Number(b.terminalFare || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-m3-success font-semibold font-mono">
                        Profit: Rs.{b.companyMargin || (b.terminalFare - b.chauffeurPayout)}
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
                            Driver Share: Rs.{b.chauffeurPayout || Math.round(b.terminalFare * 0.8)}
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
                              Confirm & Lock Driver
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-m3-surface-container-low border border-m3-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-m3-outline-variant block">Assigned Chauffeur</span>
                          <span className="font-bold text-xs text-m3-on-surface">{b.assignedChauffeur}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSendChauffeurToGuest(b)}
                            className="px-3 py-1.5 bg-m3-secondary-container/40 hover:bg-m3-secondary-container/70 text-m3-on-secondary-container border border-m3-secondary/30 rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">send</span>
                            <span>Send to Guest</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onAssignChauffeur(b.bookingId, 'Unassigned')}
                            className="px-2 py-1.5 text-m3-outline-variant hover:text-m3-error text-xs"
                            title="Re-open assignment"
                          >
                            Change
                          </button>
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
                      <span>Generate / Edit Duty Slip</span>
                    </button>

                    {!isUnassigned && (
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
                    Rs. {Number(broadcastBooking.terminalFare || 6000).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="border-t border-m3-outline-variant/80 pt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-bold text-m3-on-surface-variant uppercase">
                      Select Office Margin (Your Cut):
                    </span>
                    <span className="font-mono font-bold text-m3-success text-xs">
                      Rs. {officeMargin}
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
                        Rs.{m}
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
                      Rs. {Math.max(0, (Number(broadcastBooking.terminalFare) || 6000) - officeMargin).toLocaleString('en-IN')} Net
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
                  {`🚕 *DUTY BROADCAST — KALIDASS TRAVELS*\nTrip Ref: *${broadcastBooking.bookingId}*\n\n🗓 *Travel:* ${broadcastBooking.travelDateTime}\n📍 *Route:* ${broadcastBooking.pickupAddress}\n🚗 *Required:* ${broadcastBooking.vehicleCategory} (${broadcastBooking.partySize})\n💰 *Driver Payout:* *Rs. ${Math.max(0, (Number(broadcastBooking.terminalFare) || 6000) - officeMargin).toLocaleString('en-IN')} Net*\n_(Tolls & Parking paid by guest at actuals)_\n\n📱 *First driver to reply with Car Plate & Phone gets this duty!*`}
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
