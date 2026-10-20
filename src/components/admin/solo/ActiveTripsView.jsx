import React, { useState, useMemo } from 'react';

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
  onOpenDutySlip,
  onOpenDriversModal,
  showToast
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'NEED_DRIVER' | 'ON_TRIP'
  const [showOutsideFormId, setShowOutsideFormId] = useState(null);
  const [outsideDriverMap, setOutsideDriverMap] = useState({});

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
      `💰 *Driver Net Payment:* *Rs.${driverNet.toLocaleString('en-IN')} Net* (+ Tolls/Parking paid by customer)\n` +
      `📱 *Reply with Driver Name & Car Plate to take this duty!*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Customer Duty Slip
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

  // Driver Duty Slip
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

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Page Header Bar */}
      <div className="bg-m3-surface-container-lowest p-4 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            <h2 className="text-m3-title-m font-black text-blue-950">
              2. Active Trips & Dispatch
            </h2>
            <span className="text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 rounded-full">
              {activeBookings.length} Active Trips
            </span>
            {needDriverBookings.length > 0 && (
              <span className="text-xs font-black bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full animate-bounce">
                ⚠️ {needDriverBookings.length} Need Driver
              </span>
            )}
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-0.5">
            Confirmed bookings with advance paid. Assign driver and send Duty Slips on WhatsApp.
          </p>
        </div>

        {onOpenDriversModal && (
          <button
            type="button"
            onClick={onOpenDriversModal}
            className="h-10 px-4 bg-m3-secondary-container hover:bg-m3-surface-container-high text-m3-on-secondary-container rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            <span>Manage Driver Roster ({chauffeurs.length})</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-1">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-m3-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search passenger, route, booking ID, or driver..."
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-full border border-m3-outline-variant bg-m3-surface-container-lowest focus:ring-2 focus:ring-m3-primary text-m3-on-surface"
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
              className={`h-7 px-2.5 rounded-full text-[11px] font-bold border transition-colors ${
                statusFilter === f.id
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-m3-surface-container-lowest text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Trips List */}
      {filteredBookings.length === 0 ? (
        <div className="p-10 text-center bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">local_taxi</span>
          </div>
          <h3 className="text-sm font-bold text-m3-on-surface">No Active Trips Found</h3>
          <p className="text-xs text-m3-on-surface-variant max-w-md mx-auto">
            When an enquiry receives ₹500 advance in Step 1, it appears here to allot a driver and send Duty Slips.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => {
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
                      <span>Driver: Rs.{driverShare}</span>
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
                        >
                          <span className="material-symbols-outlined text-[15px]">speed</span>
                          <span>Meter KM & Tolls</span>
                        </button>
                      )}
                    </div>

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

                      {/* Finish Button */}
                      <button
                        type="button"
                        onClick={() => {
                          onStatusChange?.(b.bookingId, 'Completed');
                          showToast?.(`🎉 Trip ${b.bookingId} marked Completed! Moved to Step 3.`, 'success');
                        }}
                        className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black flex items-center gap-1 shadow-xs transition-colors"
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
  );
}
