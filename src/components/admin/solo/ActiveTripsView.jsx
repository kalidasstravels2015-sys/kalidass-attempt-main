import React, { useState, useMemo } from 'react';
import { parseAndValidateContact, validateCustomerContact } from '../../../utils/bookingContactValidator';
import { buildGoogleCalendarUrl } from '../../../utils/googleCalendarHelper';

/**
 * ActiveTripsView - Step 2: Confirmed Active Trips & Driver Dispatch
 * Dedicated view for non-technical office staff:
 * Only manages confirmed bookings: assigning drivers, sending WhatsApp Duty Slips, and closing trips.
 */
export default function ActiveTripsView({
  bookings = [],
  chauffeurs = [],
  onAssignChauffeur,
  onStatusChange,
  onDeleteBooking,
  onUpdateContact,
  onOpenDutySlip,
  onOpenDriversModal,
  onOpenQuickBooking,
  showToast
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'NEED_DRIVER' | 'ON_TRIP'
  const [showOutsideFormId, setShowOutsideFormId] = useState(null);
  const [outsideDriverMap, setOutsideDriverMap] = useState({});

  // Modal State: Update passenger details for incomplete/existing trips
  const [editingContactBooking, setEditingContactBooking] = useState(null);
  const [editContactForm, setEditContactForm] = useState({ name: '', phone: '' });
  const [editContactError, setEditContactError] = useState('');

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

  const filteredBookings = useMemo(() => {
    return activeBookings.filter(b => {
      const q = search.toLowerCase().trim();
      const combined = `${b.guestNamePhone || ''} ${b.pickupAddress || ''} ${b.bookingId || ''} ${b.assignedChauffeur || ''} ${b.vehicleCategory || ''}`.toLowerCase();
      if (q && !combined.includes(q)) return false;

      const isUnassigned = !b.assignedChauffeur || b.assignedChauffeur === 'Unassigned';
      if (statusFilter === 'NEED_DRIVER') return isUnassigned;
      if (statusFilter === 'ON_TRIP') return !isUnassigned;
      return true;
    });
  }, [activeBookings, search, statusFilter]);

  const extractPhone = (item) => {
    const combined = `${item.guestNamePhone || ''} ${item.assignedChauffeur || ''}`;
    const match = combined.match(/[6-9]\d{9}/);
    return match ? match[0] : '';
  };

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

  // Broadcast to Driver Group
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
      `💰 *Driver Net Payment:* *₹${driverNet.toLocaleString('en-IN')} Net* (+ Tolls/Parking paid by customer)\n` +
      `📱 *Reply with Driver Name & Car Plate to take this duty!*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Customer Duty Slip (Step 3: Driver & Cab Details)
  const handleSendCustomerDutySlip = (b) => {
    const cleanPhone = extractPhone(b);
    const guestName = (b.guestNamePhone || 'Customer').split('(')[0].trim();
    const tripUrl = getTripUrl(b);
    const fare = Number(b.terminalFare) || 0;
    const adv = Number(b.advancePaid) || 0;
    const bal = Math.max(0, fare - adv);
    const msg =
      `🚖 *KALIDASS TRAVELS — CAB & DRIVER DETAILS*\n` +
      `Booking ID: *${b.bookingId}*\n\n` +
      `👨‍✈️ *Driver & Cab:* ${b.assignedChauffeur}\n` +
      `🚗 *Vehicle:* ${b.vehicleCategory}\n` +
      `🗓 *Pickup Time:* ${b.travelDateTime}\n` +
      `📍 *Route:* ${b.pickupAddress}\n\n` +
      `💰 *Total Fare:* ₹${fare.toLocaleString('en-IN')}\n` +
      `🟢 *Advance Paid:* ₹${adv.toLocaleString('en-IN')}\n` +
      `🔴 *Balance to Pay Driver:* ₹${bal.toLocaleString('en-IN')}\n\n` +
      `📱 *Open Live Digital Duty Slip:*\n${tripUrl}\n\n` +
      `Have a safe and pleasant journey! ✨\n` +
      `📞 24/7 Helpline: +91 89395 39211`;
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.(`Duty slip sent to customer ${guestName}!`, 'success');
  };

  // Driver Duty Slip
  const handleSendDriverDutySlip = (b) => {
    const phoneMatch = (b.assignedChauffeur || '').match(/[6-9]\d{9}/);
    const cleanPhone = phoneMatch ? phoneMatch[0] : '';
    const tripUrl = getTripUrl(b);
    const fare = Number(b.terminalFare) || 0;
    const adv = Number(b.advancePaid) || 0;
    const bal = Math.max(0, fare - adv);
    const driverShare = Number(b.chauffeurPayout) || Math.round(fare * 0.82);
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.pickupAddress || 'Chennai')}`;
    const msg =
      `🚕 *KALIDASS TRAVELS — DRIVER DUTY SLIP*\n` +
      `Trip ID: *${b.bookingId}*\n\n` +
      `👤 *Passenger:* ${b.guestNamePhone}\n` +
      `🗓 *Pickup Time:* ${b.travelDateTime}\n` +
      `📍 *Route:* ${b.pickupAddress}\n` +
      `🗺️ *Google Maps Pin:* ${mapsLink}\n\n` +
      `💵 *Collect Balance from Customer at Drop:* *₹${bal.toLocaleString('en-IN')}*\n` +
      `🤝 *Your Net Driver Share:* ₹${driverShare.toLocaleString('en-IN')}\n\n` +
      `📱 *Enter Start/End KM & Close Bill Here:*\n${tripUrl}`;
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.(`Duty slip sent to driver!`, 'success');
  };

  // 1-Click Add to Google Calendar with reminders
  const handleAddToGoogleCalendar = (b) => {
    const guestClean = (b.guestNamePhone || 'Guest').split('(')[0].trim();
    const title = `🚕 Kalidass Cab: ${guestClean} (${b.bookingId || 'Trip'})`;
    const location = b.pickupAddress || 'Chennai';

    // Parse pickup datetime (e.g., "25th october 2026 4:45 AM", "Tomorrow @ 05:00 AM", or "25 Oct 2026 @ 05:00 AM")
    let startDate = new Date();
    try {
      const rawStr = (b.travelDateTime || '').trim();
      if (/tomorrow/i.test(rawStr)) {
        startDate.setDate(startDate.getDate() + 1);
        const timeMatch = rawStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (timeMatch) {
          let hrs = parseInt(timeMatch[1], 10);
          const mins = parseInt(timeMatch[2], 10);
          const ampm = (timeMatch[3] || '').toUpperCase();
          if (ampm === 'PM' && hrs < 12) hrs += 12;
          if (ampm === 'AM' && hrs === 12) hrs = 0;
          startDate.setHours(hrs, mins, 0, 0);
        }
      } else {
        const cleanDateStr = rawStr
          .replace(/(\d+)(st|nd|rd|th)/gi, '$1')
          .replace(/@/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const parsed = new Date(cleanDateStr);
        if (!isNaN(parsed.getTime())) {
          startDate = parsed;
        }
      }
    } catch (_) {}

    const pad = (n) => String(n).padStart(2, '0');
    const toGCalString = (d) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    // Default 10 hours for day trip
    const endDate = new Date(startDate.getTime() + 10 * 60 * 60 * 1000);
    const dates = `${toGCalString(startDate)}/${toGCalString(endDate)}`;

    const fare = Number(b.terminalFare) || 0;
    const adv = Number(b.advancePaid) || 0;
    const bal = Math.max(0, fare - adv);

    const details =
      `📌 Booking ID: ${b.bookingId}\n` +
      `👤 Passenger: ${b.guestNamePhone}\n` +
      `🚗 Vehicle: ${b.vehicleCategory} (${b.partySize || '4 Seats'})\n` +
      `📍 Route: ${b.pickupAddress}\n` +
      `⏰ Pickup Time: ${b.travelDateTime}\n` +
      `👨‍✈️ Driver: ${b.assignedChauffeur || 'Unassigned'}\n\n` +
      `💰 FARE & ACCOUNTS:\n` +
      `• Total Fare: ₹${fare.toLocaleString('en-IN')}\n` +
      `• Advance Paid: ₹${adv.toLocaleString('en-IN')}\n` +
      `• Balance to Collect by Driver: ₹${bal.toLocaleString('en-IN')}\n\n` +
      `⚠️ DISPATCH CHECKLIST:\n` +
      `1. Evening prior (8:00 PM): Assign Driver & send Duty Slip on WhatsApp\n` +
      `2. 30 mins prior: Check Driver is on route\n` +
      `3. 15 mins prior: Driver arrives at Gate/Tower`;

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&ctz=Asia/Kolkata`;
    window.open(gcalUrl, '_blank');
    showToast?.(`Opening Google Calendar for ${b.bookingId}...`, 'info');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Page Header Bar */}
      <div className="bg-m3-surface-container-lowest p-4 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-m3-primary"></span>
            <h2 className="text-m3-title-m font-bold text-m3-on-surface">
              2. Active Trips & Dispatch
            </h2>
            <span className="text-xs font-semibold bg-m3-primary-container text-m3-on-primary-container px-2.5 py-0.5 rounded-full">
              {activeBookings.length} Active Trips
            </span>
            {needDriverBookings.length > 0 && (
              <span className="text-xs font-semibold bg-m3-error-container text-m3-on-error-container px-2.5 py-0.5 rounded-full">
                ⚠️ {needDriverBookings.length} Need Driver
              </span>
            )}
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-0.5">
            Confirmed bookings with advance paid. Assign driver and send Duty Slips on WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenQuickBooking && (
            <button
              type="button"
              onClick={onOpenQuickBooking}
              className="h-10 px-5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-xs font-bold flex items-center gap-1.5 shadow-m3-1 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>+ Quick Add Booking</span>
            </button>
          )}
          {onOpenDriversModal && (
            <button
              type="button"
              onClick={onOpenDriversModal}
              className="h-10 px-4 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-m3-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>Driver Roster ({chauffeurs.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-1">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2 text-m3-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search passenger, route, booking ID, or driver..."
            className="w-full pl-9 pr-8 h-9 text-xs font-medium rounded-m3-full border border-m3-outline-variant/80 bg-m3-surface-container-low focus:bg-m3-surface-container-lowest focus:border-m3-primary text-m3-on-surface transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-m3-on-surface-variant text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: `All Active (${activeBookings.length})` },
            { id: 'NEED_DRIVER', label: `⚠️ Need Driver (${needDriverBookings.length})` },
            { id: 'ON_TRIP', label: `Driver Assigned (${allottedLiveBookings.length})` }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`h-8 px-3 rounded-m3-sm text-xs font-semibold transition-colors ${
                statusFilter === f.id
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container border-0'
                  : 'bg-m3-surface-container-lowest text-m3-on-surface-variant border border-m3-outline-variant hover:bg-m3-surface-container-high'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Trips List */}
      {filteredBookings.length === 0 ? (
        <div className="p-10 text-center bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-m3-surface-container-high text-m3-on-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">local_taxi</span>
          </div>
          <h3 className="text-sm font-bold text-m3-on-surface">No Active Trips Found</h3>
          <p className="text-xs text-m3-on-surface-variant max-w-md mx-auto">
            Add a confirmed booking directly or move an enquiry from Step 1.
          </p>
          {onOpenQuickBooking && (
            <button
              type="button"
              onClick={onOpenQuickBooking}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>+ Quick Add Booking</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => {
            const isUnassigned = !b.assignedChauffeur || b.assignedChauffeur === 'Unassigned';
            const fare = Number(b.terminalFare) || 0;
            const adv = Number(b.advancePaid) || 0;
            const balanceDue = Math.max(0, fare - adv);
            const driverShare = Number(b.chauffeurPayout) || (fare > 0 ? Math.round(fare * 0.82) : 0);
            const profit = Math.max(0, fare - driverShare);

            return (
              <div
                key={b.bookingId}
                className="p-4 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/80 shadow-m3-1 space-y-3"
              >
                {/* Top Row: Trip Info & Money Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
                  {/* 1. Booking ID, Passenger & Actions */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span className="font-mono-code text-xs font-bold bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                        {b.bookingId}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                        isUnassigned
                          ? 'bg-m3-error-container text-m3-on-error-container border border-m3-error/20'
                          : 'bg-m3-secondary-container text-m3-on-secondary-container border border-m3-outline-variant/60'
                      }`}>
                        {isUnassigned ? '⚠️ Need Driver' : `Driver Assigned`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddToGoogleCalendar(b)}
                        className="text-[11px] font-bold text-m3-primary hover:bg-m3-primary/10 border border-m3-primary/30 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 shadow-xs"
                        title="Add trip & follow-up reminders to Google Calendar"
                      >
                        <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                        <span>+ Calendar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to cancel and remove booking ${b.bookingId}?`)) {
                            onDeleteBooking?.(b.bookingId);
                          }
                        }}
                        className="ml-auto text-[11px] font-bold text-m3-error hover:bg-m3-error-container/40 px-2 py-0.5 rounded transition-colors flex items-center gap-0.5"
                        title="Cancel and remove trip from Active Trips"
                      >
                        <span className="material-symbols-outlined text-[13px]">delete</span>
                        <span>Cancel</span>
                      </button>
                    </div>

                    {/* Passenger Name & Phone with Validation */}
                    {(() => {
                      const contact = parseAndValidateContact(b.guestNamePhone);
                      if (!contact.isValid) {
                        return (
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-m3-on-surface flex items-center gap-1">
                              <span>{b.guestNamePhone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold bg-m3-error-container text-m3-on-error-container border border-m3-error/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">warning</span>
                                Incomplete Contact
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingContactBooking(b);
                                  setEditContactForm({
                                    name: contact.cleanName || '',
                                    phone: contact.cleanPhone || ''
                                  });
                                  setEditContactError('');
                                }}
                                className="text-[11px] font-bold text-m3-primary hover:underline flex items-center gap-0.5"
                              >
                                <span className="material-symbols-outlined text-[13px]">edit</span>
                                <span>+ Add Name & Phone</span>
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-m3-on-surface">{b.guestNamePhone}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingContactBooking(b);
                              setEditContactForm({
                                name: contact.cleanName || '',
                                phone: contact.cleanPhone || ''
                              });
                              setEditContactError('');
                            }}
                            className="w-5 h-5 rounded hover:bg-m3-surface-container-high text-m3-on-surface-variant flex items-center justify-center transition-colors"
                            title="Edit passenger name & phone"
                          >
                            <span className="material-symbols-outlined text-[13px]">edit</span>
                          </button>
                        </div>
                      );
                    })()}

                    <div className="text-xs text-m3-on-surface-variant flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span className="font-bold text-m3-on-surface">{b.travelDateTime}</span>
                    </div>
                  </div>

                  {/* 2. Route & Vehicle */}
                  <div>
                    <span className="text-[11px] font-bold uppercase text-m3-on-surface-variant block">Route & Vehicle</span>
                    <div className="text-xs font-bold text-m3-on-surface mt-0.5">
                      {b.pickupAddress ? b.pickupAddress.replace(/^undefined\s*(?:➔|->)+\s*/i, '') : 'Route not specified'}
                    </div>
                    <div className="text-xs text-m3-on-surface-variant mt-0.5">
                      🚗 {b.vehicleCategory} • {b.partySize || '4 Seats'}
                      {b.darshanStatus && b.darshanStatus !== 'Unassigned' ? ` • ${b.darshanStatus}` : ''}
                    </div>
                    {b.notes && (
                      <div className="text-[11px] text-m3-on-surface-variant bg-m3-surface-container-low px-2 py-1 rounded border border-m3-outline-variant/50 mt-1">
                        📝 {b.notes}
                      </div>
                    )}
                  </div>

                  {/* 3. Driver Allotment */}
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
                          className="w-full p-2 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low text-xs font-bold text-m3-on-surface focus:border-m3-primary"
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
                            className="flex-1 h-7 px-2 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container border border-m3-outline-variant/60 rounded-full text-[11px] font-bold flex items-center justify-center gap-1"
                            title="Share duty in Driver WhatsApp group"
                          >
                            <span className="material-symbols-outlined text-[13px]">campaign</span>
                            <span>WA Group Post</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowOutsideFormId(showOutsideFormId === b.bookingId ? null : b.bookingId)}
                            className="h-7 px-2 bg-m3-surface-container-lowest hover:bg-m3-surface-container-high border border-m3-outline-variant rounded-full text-[11px] font-bold text-m3-on-surface"
                          >
                            + Outside Cab
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddToGoogleCalendar(b)}
                            className="h-7 px-2.5 bg-m3-surface-container-lowest hover:bg-m3-surface-container-high border border-m3-outline-variant rounded-full text-[11px] font-bold text-m3-primary flex items-center gap-1 transition-colors"
                            title="Add to Google Calendar"
                          >
                            <span className="material-symbols-outlined text-[13px]">event</span>
                            <span>Calendar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 p-2 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant">
                        <div className="text-xs font-bold text-m3-on-surface">👨‍✈️ {b.assignedChauffeur}</div>
                        <button
                          type="button"
                          onClick={() => onAssignChauffeur?.(b.bookingId, 'Unassigned')}
                          className="text-[11px] text-m3-primary hover:underline font-bold mt-0.5 block"
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
                      <strong className="text-m3-on-surface font-black">₹{fare.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex justify-between text-m3-on-surface">
                      <span className="font-semibold">Advance Paid:</span>
                      <span className="font-bold">₹{adv}</span>
                    </div>
                    <div className="flex justify-between border-t border-m3-outline-variant/50 pt-1 font-bold text-m3-on-surface">
                      <span>Balance to Collect:</span>
                      <span className="text-sm font-black font-mono-code">₹{balanceDue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-m3-on-surface-variant pt-0.5">
                      <span>Driver: ₹{driverShare}</span>
                      <span className="text-m3-primary font-bold">Profit: +₹{profit}</span>
                    </div>
                  </div>
                </div>

                {/* Inline Outside Driver Input Form */}
                {showOutsideFormId === b.bookingId && (
                  <div className="p-3 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant flex flex-wrap items-center gap-2 text-xs animate-fadeIn">
                    <span className="font-bold text-m3-on-surface text-xs w-full">Enter Outside Market Driver:</span>
                    <input
                      type="text"
                      placeholder="Driver Name (e.g. Mani)"
                      value={outsideDriverMap[b.bookingId]?.name || ''}
                      onChange={(e) => setOutsideDriverMap({ ...outsideDriverMap, [b.bookingId]: { ...(outsideDriverMap[b.bookingId] || {}), name: e.target.value } })}
                      className="flex-1 min-w-[120px] p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest"
                    />
                    <input
                      type="tel"
                      placeholder="Driver Mobile (10 Digits)"
                      value={outsideDriverMap[b.bookingId]?.phone || ''}
                      onChange={(e) => setOutsideDriverMap({ ...outsideDriverMap, [b.bookingId]: { ...(outsideDriverMap[b.bookingId] || {}), phone: e.target.value } })}
                      className="flex-1 min-w-[120px] p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest"
                    />
                    <input
                      type="text"
                      placeholder="Car Plate (TN 09 BX 1234)"
                      value={outsideDriverMap[b.bookingId]?.plate || ''}
                      onChange={(e) => setOutsideDriverMap({ ...outsideDriverMap, [b.bookingId]: { ...(outsideDriverMap[b.bookingId] || {}), plate: e.target.value.toUpperCase() } })}
                      className="flex-1 min-w-[120px] p-2 rounded-m3-sm border border-m3-outline-variant bg-m3-surface-container-lowest font-mono-code uppercase"
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
                      className="h-8 px-3.5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full font-semibold text-xs shadow-m3-1"
                    >
                      Save & Allot Driver
                    </button>
                  </div>
                )}

                {/* Bottom Row: Duty Slips & Complete Trip Action */}
                {!isUnassigned && (
                  <div className="pt-2 border-t border-m3-outline-variant/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendCustomerDutySlip(b)}
                        className="h-8 px-3 bg-m3-surface-container-low hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px] text-m3-on-surface-variant">person</span>
                        <span>Duty Slip ➔ Customer (WA)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendDriverDutySlip(b)}
                        className="h-8 px-3 bg-m3-surface-container-low hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px] text-m3-on-surface-variant">local_taxi</span>
                        <span>Duty Slip ➔ Driver (WA)</span>
                      </button>

                      {onOpenDutySlip && (
                        <button
                          type="button"
                          onClick={() => onOpenDutySlip(b)}
                          className="h-8 px-2.5 bg-m3-surface-container-lowest hover:bg-m3-surface-container-high border border-m3-outline-variant rounded-full text-xs font-semibold text-m3-on-surface flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">speed</span>
                          <span>Meter KM & Tolls</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAddToGoogleCalendar(b)}
                        className="h-8 px-3 bg-m3-surface-container-low hover:bg-m3-surface-container-high text-m3-primary border border-m3-primary/30 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Add trip to Google Calendar"
                      >
                        <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                        <span>Calendar</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {['Driver En Route', 'At Pickup', 'In Progress'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => onStatusChange?.(b.bookingId, st)}
                          className={`h-7 px-2 rounded-full text-[11px] font-semibold border transition-colors ${
                            b.manifestStatus === st
                              ? 'bg-m3-secondary-container text-m3-on-secondary-container border-0'
                              : 'bg-m3-surface-container-lowest text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
                          }`}
                        >
                          {st}
                        </button>
                      ))}

                      {/* Finish Button */}
                      <button
                        type="button"
                        onClick={() => {
                          onStatusChange?.(b.bookingId, 'Completed');
                          showToast?.(`🎉 Trip ${b.bookingId} marked Completed! Moved to Step 3.`, 'success');
                        }}
                        className="h-8 px-3.5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-full text-xs font-semibold flex items-center gap-1 shadow-m3-1 transition-colors"
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

      {/* Modal: Edit / Add Customer Contact on Active Trip */}
      {editingContactBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-2xl shadow-m3-4 w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-m3-outline-variant/70 bg-m3-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-m3-on-surface">Update Passenger Contact</h3>
                  <p className="text-xs text-m3-on-surface-variant">{editingContactBooking.bookingId} • Required for driver dispatch</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingContactBooking(null)}
                className="w-8 h-8 rounded-full hover:bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface-variant font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const validation = validateCustomerContact(editContactForm.name, editContactForm.phone);
                if (!validation.isValid) {
                  setEditContactError(validation.error);
                  showToast?.(validation.error, 'error');
                  return;
                }
                const success = await onUpdateContact?.(editingContactBooking.bookingId, validation.cleanName, validation.cleanPhone);
                if (success) {
                  setEditingContactBooking(null);
                }
              }}
              className="p-5 space-y-4"
            >
              {editContactError && (
                <div className="p-2.5 bg-m3-error-container text-m3-on-error-container border border-m3-error/20 rounded-m3-md text-xs font-bold flex items-center gap-1.5 animate-shake">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{editContactError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-m3-on-surface mb-1">
                  Customer / Passenger Name <span className="text-m3-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Ramesh Kumar"
                  value={editContactForm.name}
                  onChange={(e) => {
                    setEditContactForm({ ...editContactForm, name: e.target.value });
                    if (editContactError) setEditContactError('');
                  }}
                  className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low text-xs font-bold text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-m3-on-surface mb-1">
                  Mobile Number (10 digits) <span className="text-m3-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-m3-on-surface-variant">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98401 23456"
                    value={editContactForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setEditContactForm({ ...editContactForm, phone: val });
                      if (editContactError) setEditContactError('');
                    }}
                    className="w-full pl-12 pr-3 py-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low text-xs font-bold text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary font-mono-code"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-m3-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setEditingContactBooking(null)}
                  className="px-4 py-2 rounded-full border border-m3-outline-variant text-xs font-bold text-m3-on-surface-variant hover:bg-m3-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-m3-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs font-semibold shadow-m3-1 transition-all"
                >
                  Save Contact Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
