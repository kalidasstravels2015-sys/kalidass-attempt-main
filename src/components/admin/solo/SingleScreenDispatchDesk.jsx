import React, { useState, useMemo } from 'react';
import DispatchActionModal from './DispatchActionModal';
import QuickBookingModal from './QuickBookingModal';
import defaultDrivers from '../../../data/drivers_roster.json';
import { buildWhatsAppUrl, buildGoogleReviewMessage, buildAdvancePaymentRequestMessage } from '../../../utils/whatsappTemplates';
import { getNextDriverRosterId } from '../../../utils/sequenceGenerator';

export default function SingleScreenDispatchDesk({
  bookings = [],
  leads = [],
  onUpdateBooking,
  onAddBooking,
  onDeleteBooking,
  onSyncGoogleSheets,
  isSyncing = false,
  showToast
}) {
  const [activeDispatchBooking, setActiveDispatchBooking] = useState(null);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [isDriversModalOpen, setIsDriversModalOpen] = useState(false);
  const [drivers, setDrivers] = useState(defaultDrivers);
  const [newDriverForm, setNewDriverForm] = useState({ name: '', phone: '', vehicle: '', plate: '' });
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('ALL'); // 'ALL' | 'NEEDS_DRIVER' | 'SCHEDULED' | 'COMPLETED'

  // Extract clean mobile number
  const extractPhone = (b) => {
    const raw = `${b.guestNamePhone || ''} ${b.phone || ''}`;
    const m = raw.match(/[6-9]\d{9}/);
    return m ? m[0] : '';
  };

  // 1. Group bookings into 3 simple operational states
  const needsDriverBookings = useMemo(() => {
    return bookings
      .filter(b => b && b.manifestStatus !== 'Completed' && b.manifestStatus !== 'Cancelled')
      .filter(b => !b.assignedChauffeur || b.assignedChauffeur === 'Unassigned')
      .filter(b => {
        if (!search) return true;
        const q = search.toLowerCase();
        return `${b.bookingId} ${b.pickupAddress} ${b.guestNamePhone} ${b.vehicleCategory}`.toLowerCase().includes(q);
      });
  }, [bookings, search]);

  const scheduledBookings = useMemo(() => {
    return bookings
      .filter(b => b && b.manifestStatus !== 'Completed' && b.manifestStatus !== 'Cancelled')
      .filter(b => b.assignedChauffeur && b.assignedChauffeur !== 'Unassigned')
      .filter(b => {
        if (!search) return true;
        const q = search.toLowerCase();
        return `${b.bookingId} ${b.pickupAddress} ${b.guestNamePhone} ${b.assignedChauffeur} ${b.vehicleCategory}`.toLowerCase().includes(q);
      });
  }, [bookings, search]);

  const completedBookings = useMemo(() => {
    return bookings
      .filter(b => b && b.manifestStatus === 'Completed')
      .filter(b => {
        if (!search) return true;
        const q = search.toLowerCase();
        return `${b.bookingId} ${b.pickupAddress} ${b.guestNamePhone} ${b.assignedChauffeur}`.toLowerCase().includes(q);
      });
  }, [bookings, search]);

  // Handle Mark Trip Completed & Collected
  const handleMarkCompleted = (booking) => {
    if (window.confirm(`Mark trip ${booking.bookingId} as Completed & Collected?`)) {
      onUpdateBooking({
        ...booking,
        manifestStatus: 'Completed',
        financialClosure: 'Reconciled'
      });
      showToast?.(`Trip ${booking.bookingId} completed! Moved to Completed Trips.`, 'success');
    }
  };

  // Add new driver to roster
  const handleAddDriver = (e) => {
    e.preventDefault();
    if (!newDriverForm.name || !newDriverForm.phone) {
      showToast?.('Please enter Driver Name and Phone', 'error');
      return;
    }
    const newEntry = {
      id: getNextDriverRosterId(drivers, 0),
      name: newDriverForm.name.trim(),
      phone: newDriverForm.phone.replace(/[^0-9]/g, '').slice(-10),
      vehicle: newDriverForm.vehicle.trim() || 'Cab',
      plate: newDriverForm.plate.trim().toUpperCase() || 'TN Plate'
    };
    setDrivers([newEntry, ...drivers]);
    setNewDriverForm({ name: '', phone: '', vehicle: '', plate: '' });
    showToast?.(`Driver ${newEntry.name} added to roster!`, 'success');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* ========================================================= */}
      {/* TOP DESK HEADER & FAST SUMMARY CHIPS                      */}
      {/* ========================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-m3-surface-container-lowest border border-m3-outline-variant/80 shadow-m3-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-lg sm:text-xl font-extrabold text-m3-on-surface tracking-tight">
              Kalidass Travels — Dispatch Desk
            </h1>
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-0.5">
            Solo Operator Command Center • Direct WhatsApp &amp; Driver Dispatch
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQuickBookingOpen(true)}
            className="h-10 px-4 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-m3-1 transition-transform active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_call</span>
            <span>+ New Trip / Call</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDriversModalOpen(true)}
            className="h-10 px-3.5 rounded-full bg-m3-surface-container-low hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            <span>Drivers ({drivers.length})</span>
          </button>

          <button
            type="button"
            onClick={onSyncGoogleSheets}
            disabled={isSyncing}
            className="h-10 px-3.5 rounded-full bg-m3-surface-container-low hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sync live rows with Google Sheets"
          >
            <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin text-m3-primary' : ''}`}>
              sync
            </span>
            <span>{isSyncing ? 'Syncing...' : 'Sync Sheet'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3-STATE QUICK FILTER CHIPS & SEARCH BAR                   */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-1">
        {/* State Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('NEEDS_DRIVER')}
            className={`h-9 px-4 rounded-full text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'NEEDS_DRIVER'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>🔴 Needs Driver ({needsDriverBookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('SCHEDULED')}
            className={`h-9 px-4 rounded-full text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'SCHEDULED'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>🟡 Scheduled ({scheduledBookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('COMPLETED')}
            className={`h-9 px-4 rounded-full text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>🟢 Completed ({completedBookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('ALL')}
            className={`h-9 px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeSection === 'ALL'
                ? 'bg-m3-on-surface text-m3-surface font-bold'
                : 'bg-m3-surface-container-low text-m3-on-surface-variant hover:bg-m3-surface-container'
            }`}
          >
            Show All
          </button>
        </div>

        {/* Fast Search Input */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-m3-on-surface-variant text-[17px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search passenger, route, car..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-7 h-9 rounded-full border border-m3-outline-variant bg-m3-surface-container-low text-xs font-semibold outline-none focus:border-m3-primary"
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
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: 🔴 NEEDS DRIVER (CHRONOLOGICAL PRIORITY QUEUE) */}
      {/* ========================================================= */}
      {(activeSection === 'ALL' || activeSection === 'NEEDS_DRIVER') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>1. Needs Driver Assignment ({needsDriverBookings.length})</span>
            </h2>
            <span className="text-[11px] font-semibold text-m3-on-surface-variant">
              Confirm driver before customer asks!
            </span>
          </div>

          {needsDriverBookings.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-m3-surface-container-lowest border border-m3-outline-variant/60 text-m3-on-surface-variant text-xs font-semibold">
              🎉 All confirmed trips currently have a driver assigned! Zero pending dispatches.
            </div>
          ) : (
            <div className="space-y-3">
              {needsDriverBookings.map((booking, idx) => {
                const phone = extractPhone(booking);
                const guestName = (booking.guestNamePhone || 'Customer').split('(')[0].trim();
                const fareNum = parseInt(String(booking.terminalFare || '0').replace(/[^0-9]/g, ''), 10) || 0;
                const advNum = parseInt(String(booking.advancePaid || '0').replace(/[^0-9]/g, ''), 10) || 0;
                const balanceCollect = Math.max(0, fareNum - advNum);
                const advanceWaUrl = phone ? buildWhatsAppUrl(phone, buildAdvancePaymentRequestMessage({
                  bookingId: booking.bookingId,
                  guestName,
                  vehicleCategory: booking.vehicleCategory,
                  advanceAmount: 500,
                  balanceAmount: balanceCollect,
                  upiId: 'saravn.appu@okhdfcbank'
                })) : '';

                return (
                  <div
                    key={(booking.bookingId || idx) + '_needs_driver'}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-m3-surface-container-lowest border-2 border-rose-300 dark:border-rose-900/60 shadow-m3-1 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-rose-500"
                  >
                    {/* Left: Schedule, Route, Passenger */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono-code text-xs font-black bg-rose-600 text-white px-3 py-0.5 rounded-full shadow-sm">
                          {booking.bookingId}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 text-xs font-extrabold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">schedule</span>
                          <span>{booking.travelDateTime || 'Pickup Pending'}</span>
                        </span>

                        <span className="text-xs font-bold bg-m3-surface-container px-2.5 py-0.5 rounded-full text-m3-on-surface">
                          🚗 {booking.vehicleCategory || 'Sedan'}
                        </span>
                      </div>

                      <div className="text-sm sm:text-base font-extrabold text-m3-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-rose-600 text-lg shrink-0">near_me</span>
                        <span>{booking.pickupAddress}</span>
                      </div>

                      <div className="text-xs text-m3-on-surface-variant flex flex-wrap items-center gap-3 font-semibold">
                        <span>👤 {guestName}</span>
                        {phone && (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:+91${phone}`}
                              className="text-m3-primary hover:underline font-mono-code flex items-center gap-0.5 bg-m3-surface-container px-2 py-0.5 rounded-full"
                            >
                              <span className="material-symbols-outlined text-[13px]">call</span>
                              <span>+91 {phone}</span>
                            </a>
                            <a
                              href={`https://wa.me/91${phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:underline font-mono-code flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300"
                            >
                              <span className="material-symbols-outlined text-[13px]">chat</span>
                              <span>WhatsApp</span>
                            </a>
                            {advanceWaUrl && (
                              <a
                                href={advanceWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-800 hover:underline font-mono-code flex items-center gap-0.5 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300 text-[11px] font-bold"
                                title="Send ₹500 Advance UPI QR text to guest"
                              >
                                <span className="material-symbols-outlined text-[13px]">qr_code_2</span>
                                <span>₹500 Adv Link</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Cash Collection & 1-Step Dispatch Action */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-m3-outline-variant/60 shrink-0">
                      <div className="text-left md:text-right">
                        <div className="text-xs text-m3-on-surface-variant font-semibold">
                          Quoted: ₹{fareNum.toLocaleString('en-IN')} • Adv: ₹{advNum.toLocaleString('en-IN')}
                        </div>
                        <div className="text-sm sm:text-base font-black font-mono-code text-emerald-700 dark:text-emerald-400">
                          Collect ₹{balanceCollect.toLocaleString('en-IN')} + Tolls
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveDispatchBooking(booking)}
                          className="h-10 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[19px]">drive_eta</span>
                          <span>Assign Driver &amp; Dispatch</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete booking ${booking.bookingId}?`)) {
                              onDeleteBooking?.(booking.bookingId);
                            }
                          }}
                          className="w-9 h-9 rounded-full hover:bg-rose-50 text-rose-600 flex items-center justify-center transition-colors cursor-pointer border border-rose-200"
                          title="Delete trip"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: 🟡 SCHEDULED (DRIVER ASSIGNED & GUEST NOTIFIED)*/}
      {/* ========================================================= */}
      {(activeSection === 'ALL' || activeSection === 'SCHEDULED') && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">verified</span>
              <span>2. Scheduled Trips — Waiting for Pickup ({scheduledBookings.length})</span>
            </h2>
            <span className="text-[11px] font-semibold text-m3-on-surface-variant">
              Driver &amp; passenger details dispatched
            </span>
          </div>

          {scheduledBookings.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-m3-surface-container-lowest border border-m3-outline-variant/60 text-m3-on-surface-variant text-xs font-semibold">
              No active scheduled trips. Trips appear here as soon as a driver is assigned.
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledBookings.map((booking, idx) => {
                const phone = extractPhone(booking);
                const guestName = (booking.guestNamePhone || 'Customer').split('(')[0].trim();
                const fareNum = parseInt(String(booking.terminalFare || '0').replace(/[^0-9]/g, ''), 10) || 0;
                const advNum = parseInt(String(booking.advancePaid || '0').replace(/[^0-9]/g, ''), 10) || 0;
                const balanceCollect = Math.max(0, fareNum - advNum);
                const advanceWaUrl = phone ? buildWhatsAppUrl(phone, buildAdvancePaymentRequestMessage({
                  bookingId: booking.bookingId,
                  guestName,
                  vehicleCategory: booking.vehicleCategory,
                  advanceAmount: 500,
                  balanceAmount: balanceCollect,
                  upiId: 'saravn.appu@okhdfcbank'
                })) : '';

                return (
                  <div
                    key={(booking.bookingId || idx) + '_scheduled'}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-m3-surface-container-lowest border-2 border-amber-300 dark:border-amber-900/60 shadow-m3-1 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono-code text-xs font-black bg-amber-600 text-white px-3 py-0.5 rounded-full">
                          {booking.bookingId}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-xs font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">schedule</span>
                          <span>{booking.travelDateTime}</span>
                        </span>

                        <span className="text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          <span>{booking.assignedChauffeur}</span>
                        </span>
                      </div>

                      <div className="text-sm sm:text-base font-extrabold text-m3-on-surface">
                        📍 {booking.pickupAddress}
                      </div>

                      <div className="text-xs text-m3-on-surface-variant flex flex-wrap items-center gap-3 font-semibold">
                        <span>👤 Guest: {guestName}</span>
                        {phone && (
                          <a
                            href={`tel:+91${phone}`}
                            className="text-m3-primary hover:underline font-mono-code flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-[13px]">call</span>
                            <span>+91 {phone}</span>
                          </a>
                        )}
                        <span>•</span>
                        <span className="font-mono-code text-emerald-700 font-bold">
                          Collect: ₹{balanceCollect.toLocaleString('en-IN')} + Tolls
                        </span>
                      </div>
                    </div>

                    {/* Actions: Re-open dispatch, or mark completed */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveDispatchBooking(booking)}
                        className="h-9 px-3.5 rounded-full bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface font-bold text-xs flex items-center gap-1.5 border border-m3-outline-variant cursor-pointer"
                        title="Re-open dispatch modal or re-send WhatsApp"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        <span>Resend WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(booking)}
                        className="h-9 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[17px]">done_all</span>
                        <span>Mark Completed</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: 🟢 COMPLETED TRIPS & REVIEWS                   */}
      {/* ========================================================= */}
      {(activeSection === 'ALL' || activeSection === 'COMPLETED') && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">task_alt</span>
              <span>3. Completed Trips ({completedBookings.length})</span>
            </h2>
          </div>

          {completedBookings.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-m3-surface-container-lowest border border-m3-outline-variant/60 text-m3-on-surface-variant text-xs font-semibold">
              Completed trips appear here once closed.
            </div>
          ) : (
            <div className="space-y-2.5">
              {completedBookings.map((booking, idx) => {
                const phone = extractPhone(booking);
                const guestName = (booking.guestNamePhone || 'Customer').split('(')[0].trim();
                const reviewUrl = buildWhatsAppUrl(phone, buildGoogleReviewMessage(guestName));

                return (
                  <div
                    key={(booking.bookingId || idx) + '_completed'}
                    className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-m3-surface-container-lowest border border-m3-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                          {booking.bookingId}
                        </span>
                        <span className="font-bold text-m3-on-surface">{booking.pickupAddress}</span>
                        <span className="text-m3-on-surface-variant font-semibold">• {booking.travelDateTime}</span>
                      </div>
                      <div className="text-m3-on-surface-variant">
                        👤 {guestName} • Driver: {booking.assignedChauffeur} • Total: ₹{Number(booking.terminalFare || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <a
                      href={reviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-3.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold flex items-center gap-1 self-start sm:self-auto cursor-pointer shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[15px]">star</span>
                      <span>Send 5★ Review Link</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* DISPATCH ACTION MODAL (1-TAP WHATSAPP TO DRIVER & GUEST)   */}
      {/* ========================================================= */}
      <DispatchActionModal
        booking={activeDispatchBooking}
        isOpen={Boolean(activeDispatchBooking)}
        onClose={() => setActiveDispatchBooking(null)}
        onConfirmDispatch={(updated) => {
          onUpdateBooking(updated);
          showToast?.(`Trip ${updated.bookingId} dispatched! Moved to Scheduled.`, 'success');
        }}
        driversList={drivers}
      />

      {/* ========================================================= */}
      {/* QUICK NEW TRIP MODAL FOR PHONE CALLERS                    */}
      {/* ========================================================= */}
      <QuickBookingModal
        isOpen={isQuickBookingOpen}
        onClose={() => setIsQuickBookingOpen(false)}
        onAddBooking={(newBooking) => {
          onAddBooking(newBooking);
          setIsQuickBookingOpen(false);
          showToast?.(`New trip ${newBooking.bookingId} added to Needs Driver queue!`, 'success');
        }}
        existingBookings={bookings}
      />

      {/* ========================================================= */}
      {/* DRIVERS ROSTER DRAWER / MODAL                             */}
      {/* ========================================================= */}
      {isDriversModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-m3-surface rounded-2xl shadow-2xl border border-m3-outline-variant overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-m3-surface-container-high border-b border-m3-outline-variant flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-m3-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary text-base">badge</span>
                <span>Driver &amp; Vehicle Roster ({drivers.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDriversModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-m3-surface-container-highest flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto text-xs">
              {/* Add New Driver Form */}
              <form onSubmit={handleAddDriver} className="p-3 rounded-xl bg-m3-surface-container-low border border-m3-outline-variant/60 space-y-2">
                <div className="font-bold text-[11px] uppercase tracking-wider text-m3-on-surface-variant">
                  + Add Driver to Roster
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Driver Name (e.g. Moorthy)"
                    value={newDriverForm.name}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, name: e.target.value })}
                    className="p-2 rounded-lg border border-m3-outline-variant bg-m3-surface font-semibold text-xs"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Mobile (10 digits)"
                    value={newDriverForm.phone}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, phone: e.target.value })}
                    className="p-2 rounded-lg border border-m3-outline-variant bg-m3-surface font-mono-code font-bold text-xs"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Vehicle (e.g. Maruti XL6)"
                    value={newDriverForm.vehicle}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, vehicle: e.target.value })}
                    className="p-2 rounded-lg border border-m3-outline-variant bg-m3-surface font-semibold text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Plate (e.g. TN85W4093)"
                    value={newDriverForm.plate}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, plate: e.target.value })}
                    className="p-2 rounded-lg border border-m3-outline-variant bg-m3-surface font-mono-code font-bold uppercase text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-m3-primary text-m3-on-primary font-bold text-xs shadow-sm cursor-pointer"
                >
                  Save Driver to Roster
                </button>
              </form>

              {/* Driver List */}
              <div className="space-y-2">
                {drivers.map(d => (
                  <div key={d.id} className="p-2.5 rounded-xl bg-m3-surface-container-lowest border border-m3-outline-variant/60 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-m3-on-surface">
                        {d.name} <span className="text-xs text-m3-on-surface-variant font-medium">({d.vehicle} • {d.plate})</span>
                      </div>
                      <div className="font-mono-code text-xs text-m3-primary font-semibold">
                        📞 +91 {d.phone}
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/91${d.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">chat</span>
                      <span>WA</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
