import React, { useState, useMemo } from 'react';
import {
  parseTravelDateToDate,
  formatDateKey,
  buildGoogleCalendarUrl,
  exportMonthlyManifestToCsv
} from '../../../utils/googleCalendarHelper';
import { checkChauffeurConflict } from './ConflictDetector';
import { buildMapsBlock } from '../../../utils/whatsapp';
import { isActionableLead } from '../../../utils/bookingContactValidator';
import QuickBookingModal from './QuickBookingModal';

export default function OperationsCalendarView({
  bookings = [],
  leads = [],
  chauffeurs = [],
  onAssignChauffeur,
  onStatusChange,
  onConvertToConfirmed,
  onAddManualLead,
  onOpenDutySlip,
  showToast
}) {
  const today = useMemo(() => new Date(), []);

  // Calendar Navigation State
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth()); // 0-based
  const [selectedDate, setSelectedDate] = useState(() => today);
  const [viewMode, setViewMode] = useState('MONTH'); // 'MONTH' | 'DAY_AGENDA'

  // Radar Filter: 'ALL' | 'NEED_DRIVER' | 'ADVANCE_PENDING' | 'READY' | 'COMPLETED'
  const [radarFilter, setRadarFilter] = useState('ALL');

  // Quick Schedule / Follow-Up Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDateStr, setScheduleDateStr] = useState('');
  const [newEntry, setNewEntry] = useState({
    guestName: '',
    phone: '',
    pickup: 'Chennai',
    drop: '',
    vehicle: 'Sedan (Dzire / Etios)',
    time: '06:00 AM',
    fare: '3500',
    advance: '500',
    type: 'booking' // 'booking' | 'enquiry'
  });

  // Month metadata
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Handle Month Stepping
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now);
  };

  // 1. Group Bookings by Date Key (YYYY-MM-DD)
  const bookingsByDate = useMemo(() => {
    const map = new Map();
    bookings.forEach(b => {
      const d = parseTravelDateToDate(b.travelDateTime || b.travelDate);
      const key = formatDateKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ ...b, _parsedDate: d });
    });
    return map;
  }, [bookings]);

  // 2. Group Actionable Enquiries (Pending Advance) by Date Key
  const pendingAdvanceByDate = useMemo(() => {
    const map = new Map();
    leads.filter(isActionableLead).forEach(l => {
      const d = parseTravelDateToDate(l.travelDateTime || l.travelDate || l.pickupDate);
      const key = formatDateKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ ...l, _parsedDate: d });
    });
    return map;
  }, [leads]);

  // Calendar Grid Cells Computation
  const calendarCells = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Prev month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, daysInPrevMonth - i);
      cells.push({
        date,
        isCurrentMonth: false,
        dateKey: formatDateKey(date),
        dayNum: date.getDate()
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      cells.push({
        date,
        isCurrentMonth: true,
        dateKey: formatDateKey(date),
        dayNum: day
      });
    }

    // Next month padding to fill complete grid rows (multiples of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let j = 1; j <= remaining; j++) {
      const date = new Date(currentYear, currentMonth + 1, j);
      cells.push({
        date,
        isCurrentMonth: false,
        dateKey: formatDateKey(date),
        dayNum: j
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Selected Date Trips & Items
  const selectedDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);

  const selectedDateTrips = useMemo(() => {
    const list = bookingsByDate.get(selectedDateKey) || [];
    // Sort chronologically by departure time
    return [...list].sort((a, b) => a._parsedDate.getTime() - b._parsedDate.getTime());
  }, [bookingsByDate, selectedDateKey]);

  const selectedDateLeads = useMemo(() => {
    return pendingAdvanceByDate.get(selectedDateKey) || [];
  }, [pendingAdvanceByDate, selectedDateKey]);

  // Stats for the month
  const monthStats = useMemo(() => {
    let totalDuties = 0;
    let needDriver = 0;
    let advancePending = 0;
    let revenue = 0;

    bookings.forEach(b => {
      const d = parseTravelDateToDate(b.travelDateTime || b.travelDate);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        totalDuties++;
        revenue += Number(b.terminalFare || 0);
        if (!b.assignedChauffeur || b.assignedChauffeur === 'Unassigned') {
          needDriver++;
        }
      }
    });

    leads.filter(isActionableLead).forEach(l => {
      const d = parseTravelDateToDate(l.travelDateTime || l.travelDate || l.pickupDate);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        advancePending++;
      }
    });

    return { totalDuties, needDriver, advancePending, revenue };
  }, [bookings, leads, currentYear, currentMonth]);

  // Quick WhatsApp Duty Slip Generator
  const handleSendDutySlip = (b) => {
    const fare = Number(b.terminalFare) || 0;
    const margin = Number(b.companyMargin) || Math.round(fare * 0.18);
    const driverNet = Math.max(0, fare - margin);

    const msg =
      `🚕 *DUTY ALLOTMENT — KALIDASS TRAVELS*\n` +
      `Trip ID: *${b.bookingId}*\n` +
      `🗓 *Pickup Time:* ${b.travelDateTime}\n` +
      `📍 *Route:* ${b.pickupAddress}\n` +
      `🚗 *Vehicle:* ${b.vehicleCategory}\n` +
      `👥 *Passengers:* ${b.partySize || '4 Seats'}\n` +
      `💰 *Total Customer Fare:* ₹${fare.toLocaleString('en-IN')}\n` +
      `💵 *Driver Net Payout:* ₹${driverNet.toLocaleString('en-IN')} (Tolls & Parking Actuals)\n` +
      `--------------------------------\n` +
      `👤 *Passenger Contact:* ${b.guestNamePhone}\n` +
      `🏢 *Headquarters:* Medavakkam, Chennai\n` +
      `📞 *Office Helpline:* +91 89395 39211\n\n` +
      `*Rules:* Zero smoking, courteous driving, report 15 mins prior to pickup.`;

    const cleanRef = (b.bookingId || '').replace(/[^A-Za-z0-9]/g, '');
    const tripUrl = `https://kalidasstravels.in/trip/?ref=${cleanRef}`;
    const fullMsg = `${msg}\n🔗 *Live Duty Slip Link:* ${tripUrl}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(fullMsg)}`, '_blank');
    if (showToast) showToast('Duty slip opened in WhatsApp!', 'success');
  };

  // WhatsApp Follow-up for Pending Advance
  const handleSendAdvanceReminder = (lead) => {
    const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const fare = Number(lead.estimatedFare || lead.fare || 0);
    const pickup = lead.pickup || 'Chennai';
    const drop = lead.drop || 'Outstation';
    const vehicle = lead.vehicle || 'Sedan';
    const dateStr = lead.travelDateTime || lead.travelDate || 'your upcoming date';

    const msg =
      `Vanakkam ${lead.guestName || 'Sir/Madam'} 🙏\n\n` +
      `This is Kalidass Travels (Medavakkam, Chennai) regarding your cab requirement for *${pickup} ➔ ${drop}* on *${dateStr}*.\n\n` +
      `🚗 *Vehicle:* ${vehicle}\n` +
      `💰 *All-Inclusive Fare:* ₹${fare.toLocaleString('en-IN')}\n\n` +
      `To lock in your cab and assign your verified chauffeur, please confirm with a token advance of *₹500* (UPI: 8939539211@okbizaxis).\n\n` +
      `Can we reserve the vehicle for you? 🚕\n` +
      `📞 +91 89395 39211 | kalidasstravels2015@gmail.com`;

    if (cleanPhone) {
      window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
    if (showToast) showToast('Advance reminder opened in WhatsApp!', 'success');
  };

  // Quick Modal Submit
  const handleCreateScheduledDuty = (e) => {
    e.preventDefault();
    if (!newEntry.guestName.trim() || !newEntry.phone.trim()) {
      if (showToast) showToast('Please enter customer name and phone', 'error');
      return;
    }

    const cleanPhone = newEntry.phone.replace(/[^0-9]/g, '').slice(-10);
    const formattedSchedule = `${scheduleDateStr} @ ${newEntry.time}`;

    if (newEntry.type === 'booking') {
      const nextId = `#KT-BK-${100 + bookings.length + 1}`;
      const newBooking = {
        bookingId: nextId,
        guestNamePhone: `${newEntry.guestName.trim()} (+91 ${cleanPhone})`,
        travelDateTime: formattedSchedule,
        pickupAddress: `${newEntry.pickup} ➔ ${newEntry.drop || 'Outstation'}`,
        vehicleCategory: newEntry.vehicle,
        partySize: '4 Seats',
        terminalFare: Number(newEntry.fare) || 3500,
        advancePaid: Number(newEntry.advance) || 500,
        chauffeurPayout: Math.round((Number(newEntry.fare) || 3500) * 0.8),
        companyMargin: Math.round((Number(newEntry.fare) || 3500) * 0.2),
        assignedChauffeur: 'Unassigned',
        manifestStatus: 'Need Driver',
        metadata: 'Scheduled via Operations Calendar'
      };

      if (onConvertToConfirmed) onConvertToConfirmed(newBooking);
      if (showToast) showToast(`Duty ${nextId} scheduled on ${scheduleDateStr}!`, 'success');
    } else {
      // Enquiry
      const nextQuoteId = `#ENQ-${100 + leads.length + 1}`;
      const newLead = {
        quoteId: nextQuoteId,
        guestName: newEntry.guestName.trim(),
        phone: cleanPhone,
        pickup: newEntry.pickup,
        drop: newEntry.drop || 'Outstation',
        vehicle: newEntry.vehicle,
        travelDate: formattedSchedule,
        estimatedFare: Number(newEntry.fare) || 3500,
        status: 'Follow-Up Pending',
        sourcePage: 'Operations Calendar Schedule'
      };
      if (showToast) showToast(`Enquiry ${nextQuoteId} logged for follow-up!`, 'success');
    }

    setIsScheduleModalOpen(false);
    setNewEntry({
      guestName: '',
      phone: '',
      pickup: 'Chennai',
      drop: '',
      vehicle: 'Sedan (Dzire / Etios)',
      time: '06:00 AM',
      fare: '3500',
      advance: '500',
      type: 'booking'
    });
  };

  const openScheduleModalForDate = (date) => {
    setSelectedDate(date);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setScheduleDateStr(`${y}-${m}-${d}`);
    setIsScheduleModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* HEADER & CONTROLS BAR                                     */}
      {/* ========================================================= */}
      <div className="bg-m3-surface-container-lowest p-4 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-m3-primary text-2xl font-variation-fill">
              calendar_month
            </span>
            <h2 className="text-m3-title-m font-black text-m3-on-surface">
              Operations & Trip Monitoring Calendar
            </h2>
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-0.5">
            Real-time schedule of active duties, driver conflict warnings, and 4-stage follow-up radar.
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month vs Day Toggle */}
          <div className="flex items-center bg-m3-surface-container rounded-m3-full p-0.5 border border-m3-outline-variant/40">
            <button
              type="button"
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1 rounded-m3-full text-xs font-semibold transition-all ${
                viewMode === 'MONTH'
                  ? 'bg-m3-primary text-m3-on-primary shadow-sm'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('DAY_AGENDA')}
              className={`px-3 py-1 rounded-m3-full text-xs font-semibold transition-all ${
                viewMode === 'DAY_AGENDA'
                  ? 'bg-m3-primary text-m3-on-primary shadow-sm'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              Day Agenda
            </button>
          </div>

          {/* Quick Schedule Button */}
          <button
            type="button"
            onClick={() => openScheduleModalForDate(selectedDate)}
            className="h-9 px-3 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-m3-1"
          >
            <span className="material-symbols-outlined text-[17px]">add_circle</span>
            <span>Schedule Duty</span>
          </button>

          {/* Export Monthly Manifest */}
          <button
            type="button"
            onClick={() => {
              const ok = exportMonthlyManifestToCsv(bookings, currentYear, currentMonth);
              if (ok && showToast) {
                showToast(`Manifest for ${monthNames[currentMonth]} ${currentYear} exported!`, 'success');
              }
            }}
            className="h-9 px-3 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download Excel / CSV Manifest"
          >
            <span className="material-symbols-outlined text-[17px] text-m3-on-surface-variant">download</span>
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4-STAGE FOLLOW-UP RADAR STRIP                             */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Stage 1: Advance Pending */}
        <button
          type="button"
          onClick={() => setRadarFilter(radarFilter === 'ADVANCE_PENDING' ? 'ALL' : 'ADVANCE_PENDING')}
          className={`p-3 rounded-m3-lg border transition-all text-left flex items-start justify-between ${
            radarFilter === 'ADVANCE_PENDING'
              ? 'bg-amber-500/10 border-amber-500/80 ring-2 ring-amber-500/30'
              : 'bg-m3-surface-container-lowest border-m3-outline-variant/60 hover:bg-m3-surface-container-low'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>1. ₹500 Advance</span>
            </div>
            <p className="text-lg font-black text-m3-on-surface mt-1">
              {monthStats.advancePending}
            </p>
            <p className="text-[11px] text-m3-on-surface-variant">Pending confirmation</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1"></span>
        </button>

        {/* Stage 2: Need Driver (T-24h warning) */}
        <button
          type="button"
          onClick={() => setRadarFilter(radarFilter === 'NEED_DRIVER' ? 'ALL' : 'NEED_DRIVER')}
          className={`p-3 rounded-m3-lg border transition-all text-left flex items-start justify-between ${
            radarFilter === 'NEED_DRIVER'
              ? 'bg-red-500/10 border-red-500/80 ring-2 ring-red-500/30'
              : 'bg-m3-surface-container-lowest border-m3-outline-variant/60 hover:bg-m3-surface-container-low'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm font-variation-fill">warning</span>
              <span>2. Need Driver</span>
            </div>
            <p className="text-lg font-black text-m3-on-surface mt-1">
              {monthStats.needDriver}
            </p>
            <p className="text-[11px] text-m3-on-surface-variant">Unassigned duties</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse mt-1"></span>
        </button>

        {/* Stage 3: Ready / Live Trips */}
        <button
          type="button"
          onClick={() => setRadarFilter(radarFilter === 'READY' ? 'ALL' : 'READY')}
          className={`p-3 rounded-m3-lg border transition-all text-left flex items-start justify-between ${
            radarFilter === 'READY'
              ? 'bg-blue-500/10 border-blue-500/80 ring-2 ring-blue-500/30'
              : 'bg-m3-surface-container-lowest border-m3-outline-variant/60 hover:bg-m3-surface-container-low'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-blue-500 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">local_taxi</span>
              <span>3. Ready & Live</span>
            </div>
            <p className="text-lg font-black text-m3-on-surface mt-1">
              {monthStats.totalDuties - monthStats.needDriver}
            </p>
            <p className="text-[11px] text-m3-on-surface-variant">Driver assigned / on trip</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1"></span>
        </button>

        {/* Stage 4: Monthly Revenue & Closed */}
        <div className="p-3 rounded-m3-lg border border-m3-outline-variant/60 bg-m3-surface-container-lowest flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm font-variation-fill">verified</span>
              <span>4. Month Revenue</span>
            </div>
            <p className="text-lg font-black text-emerald-500 mt-1 font-mono-code">
              ₹{monthStats.revenue.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-m3-on-surface-variant">
              {monthStats.totalDuties} total duties scheduled
            </p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1"></span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MONTH NAVIGATION BAR                                      */}
      {/* ========================================================= */}
      <div className="bg-m3-surface-container-lowest px-4 py-3 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface flex items-center justify-center transition-colors"
            title="Previous Month"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <h3 className="text-base sm:text-lg font-black text-m3-on-surface min-w-[170px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface flex items-center justify-center transition-colors"
            title="Next Month"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-3 py-1 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-primary border border-m3-outline-variant/50 rounded-m3-full text-xs font-bold transition-colors"
          >
            Jump to Today
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW MODE 1: MONTH GRID VIEW                              */}
      {/* ========================================================= */}
      {viewMode === 'MONTH' && (
        <div className="space-y-4">
          <div className="bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 overflow-hidden">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-m3-outline-variant/50 bg-m3-surface-container-low/70 text-center py-2.5">
              {daysOfWeek.map((day, idx) => (
                <span
                  key={day}
                  className={`text-xs font-bold ${
                    idx === 0 || idx === 6 ? 'text-amber-500' : 'text-m3-on-surface-variant'
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-m3-outline-variant/30">
              {calendarCells.map((cell) => {
                const isSelected = cell.dateKey === selectedDateKey;
                const isTodayCell = cell.dateKey === formatDateKey(today);
                const cellTrips = bookingsByDate.get(cell.dateKey) || [];
                const cellLeads = pendingAdvanceByDate.get(cell.dateKey) || [];

                const unassignedCount = cellTrips.filter(
                  t => !t.assignedChauffeur || t.assignedChauffeur === 'Unassigned'
                ).length;
                const assignedCount = cellTrips.length - unassignedCount;

                return (
                  <div
                    key={cell.dateKey}
                    onClick={() => setSelectedDate(cell.date)}
                    onDoubleClick={() => openScheduleModalForDate(cell.date)}
                    className={`min-h-[75px] sm:min-h-[105px] p-1.5 sm:p-2 cursor-pointer transition-all flex flex-col justify-between select-none relative group ${
                      !cell.isCurrentMonth
                        ? 'bg-m3-surface-container-lowest/40 opacity-40 hover:opacity-75'
                        : isSelected
                        ? 'bg-m3-secondary-container/25 ring-2 ring-inset ring-m3-primary'
                        : 'hover:bg-m3-surface-container-low/50'
                    }`}
                  >
                    {/* Top Row: Date Number & Badges */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center transition-colors ${
                          isTodayCell
                            ? 'bg-m3-primary text-m3-on-primary font-black shadow-sm'
                            : isSelected
                            ? 'bg-m3-secondary-container text-m3-on-secondary-container font-black'
                            : 'text-m3-on-surface'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Total Duty Pill if > 0 */}
                      {cellTrips.length > 0 && (
                        <span className="text-[10px] font-mono-code font-bold px-1.5 py-0.2 rounded-full bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant/40">
                          {cellTrips.length} {cellTrips.length === 1 ? 'trip' : 'trips'}
                        </span>
                      )}
                    </div>

                    {/* Middle: Status Dots & Alerts */}
                    <div className="space-y-1 my-1">
                      {/* Emergency Warning: Unassigned Driver */}
                      {unassignedCount > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-1 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                          <span className="truncate">{unassignedCount} need driver</span>
                        </div>
                      )}

                      {/* Assigned Driver duties */}
                      {assignedCount > 0 && (
                        <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                          <span className="truncate">{assignedCount} ready</span>
                        </div>
                      )}

                      {/* Pending Advance Inquiries */}
                      {cellLeads.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                          <span className="truncate">{cellLeads.length} advance pending</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Quick Add Shortcut button on hover */}
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openScheduleModalForDate(cell.date);
                        }}
                        className="text-[10px] text-m3-primary font-bold hover:underline flex items-center gap-0.5"
                        title="Schedule duty on this date"
                      >
                        <span className="material-symbols-outlined text-[13px]">add</span>
                        <span>Duty</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Duties Panel (Below Grid) */}
          <div className="bg-m3-surface-container-lowest p-4 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-m3-outline-variant/40 gap-2">
              <div>
                <h4 className="text-base font-bold text-m3-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-m3-primary text-xl">event_available</span>
                  <span>
                    Schedule for {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </h4>
                <p className="text-xs text-m3-on-surface-variant">
                  {selectedDateTrips.length} active duties &bull; {selectedDateLeads.length} pending enquiries
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openScheduleModalForDate(selectedDate)}
                  className="px-3 py-1.5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Add Trip to This Date</span>
                </button>
              </div>
            </div>

            {/* List of trips for selected date */}
            {selectedDateTrips.length === 0 && selectedDateLeads.length === 0 ? (
              <div className="text-center py-8 text-m3-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-m3-outline-variant mb-1">
                  free_cancellation
                </span>
                <p className="text-sm font-semibold">No duties scheduled for this date.</p>
                <p className="text-xs text-m3-on-surface-variant mt-0.5">
                  Click below to dispatch an outstation or airport duty.
                </p>
                <button
                  type="button"
                  onClick={() => openScheduleModalForDate(selectedDate)}
                  className="mt-3 px-4 py-1.5 rounded-m3-full bg-m3-surface-container text-xs font-bold text-m3-primary hover:bg-m3-surface-container-high transition-colors"
                >
                  + Schedule Trip
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 1. Confirmed Duties */}
                {selectedDateTrips.map((b) => {
                  const conflict = checkChauffeurConflict(b, bookings, chauffeurs);
                  const isUnassigned = !b.assignedChauffeur || b.assignedChauffeur === 'Unassigned';
                  const gCalUrl = buildGoogleCalendarUrl(b);

                  return (
                    <div
                      key={b.bookingId}
                      className={`p-3.5 rounded-m3-lg border transition-all ${
                        isUnassigned
                          ? 'bg-red-500/5 border-red-500/50'
                          : conflict.hasConflict
                          ? 'bg-amber-500/5 border-amber-500/60'
                          : 'bg-m3-surface-container-low border-m3-outline-variant/60'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Trip Overview */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono-code font-bold text-xs px-2 py-0.5 rounded bg-m3-primary/10 text-m3-primary">
                              {b.bookingId}
                            </span>
                            <span className="font-bold text-sm text-m3-on-surface">
                              {b.travelDateTime}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-m3-surface-container-high text-m3-on-surface font-semibold">
                              {b.vehicleCategory}
                            </span>
                            {isUnassigned ? (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">warning</span>
                                Need Driver
                              </span>
                            ) : (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">badge</span>
                                {b.assignedChauffeur}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-m3-on-surface">
                            📍 {b.pickupAddress}
                          </p>
                          <p className="text-xs text-m3-on-surface-variant">
                            👤 {b.guestNamePhone} &bull; Total: ₹{Number(b.terminalFare || 0).toLocaleString('en-IN')} (Advance: ₹{Number(b.advancePaid || 0)})
                          </p>

                          {/* Driver Conflict Warning */}
                          {conflict.hasConflict && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md mt-1">
                              <span className="material-symbols-outlined text-sm font-variation-fill">error</span>
                              <span>{conflict.message}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          {/* Send WhatsApp Duty Slip */}
                          <button
                            type="button"
                            onClick={() => handleSendDutySlip(b)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-m3-full text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                            title="Send Duty Slip to Driver on WhatsApp"
                          >
                            <span className="material-symbols-outlined text-[15px]">send</span>
                            <span>WhatsApp Slip</span>
                          </button>

                          {/* Add to Google Calendar */}
                          <a
                            href={gCalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Add Duty to Google Calendar"
                          >
                            <span className="material-symbols-outlined text-[15px] text-m3-primary">event</span>
                            <span className="hidden sm:inline">Google Cal</span>
                          </a>

                          {/* Assign Driver / Duty Slip */}
                          {onOpenDutySlip && (
                            <button
                              type="button"
                              onClick={() => onOpenDutySlip(b)}
                              className="px-2.5 py-1 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-m3-full text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit_note</span>
                              <span>Manage Duty</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 2. Pending Advance Enquiries for this date */}
                {selectedDateLeads.map((l) => (
                  <div
                    key={l.quoteId}
                    className="p-3.5 rounded-m3-lg border border-amber-500/40 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code font-bold text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">
                          {l.quoteId}
                        </span>
                        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                          🟡 ₹500 Advance Pending
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-m3-on-surface mt-1">
                        📍 {l.pickup} ➔ {l.drop} ({l.vehicle})
                      </p>
                      <p className="text-xs text-m3-on-surface-variant">
                        👤 {l.guestName} (+91 {l.phone}) &bull; Quoted Fare: ₹{Number(l.estimatedFare || 0).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendAdvanceReminder(l)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black rounded-m3-full text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">chat</span>
                        <span>Remind Advance</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW MODE 2: DAY AGENDA / HOURLY TIMELINE                 */}
      {/* ========================================================= */}
      {viewMode === 'DAY_AGENDA' && (
        <div className="bg-m3-surface-container-lowest p-5 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 space-y-6">
          {/* Day Navigation */}
          <div className="flex items-center justify-between pb-4 border-b border-m3-outline-variant/40">
            <button
              type="button"
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 1);
                setSelectedDate(prev);
                setCurrentMonth(prev.getMonth());
                setCurrentYear(prev.getFullYear());
              }}
              className="px-3 py-1.5 rounded-m3-full bg-m3-surface-container hover:bg-m3-surface-container-high text-xs font-bold text-m3-on-surface flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Previous Day</span>
            </button>

            <div className="text-center">
              <h3 className="text-base sm:text-lg font-black text-m3-on-surface">
                {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-xs text-m3-on-surface-variant">
                {selectedDateTrips.length} Total Departures
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 1);
                setSelectedDate(next);
                setCurrentMonth(next.getMonth());
                setCurrentYear(next.getFullYear());
              }}
              className="px-3 py-1.5 rounded-m3-full bg-m3-surface-container hover:bg-m3-surface-container-high text-xs font-bold text-m3-on-surface flex items-center gap-1"
            >
              <span>Next Day</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Time Bands */}
          <div className="space-y-6">
            {/* Morning (00:00 - 11:59) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-amber-500 text-lg">wb_sunny</span>
                <h4 className="text-xs font-bold text-m3-on-surface uppercase tracking-wider">
                  Morning Departures (00:00 - 12:00 PM)
                </h4>
              </div>
              <div className="space-y-2.5">
                {selectedDateTrips
                  .filter(t => t._parsedDate.getHours() < 12)
                  .map(t => (
                    <div
                      key={t.bookingId}
                      className="p-3 bg-m3-surface-container-low rounded-m3-lg border border-m3-outline-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code font-bold text-xs text-m3-primary">
                            {t._parsedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="font-bold text-xs text-m3-on-surface">{t.bookingId}</span>
                          <span className="text-xs text-m3-on-surface-variant font-medium">({t.vehicleCategory})</span>
                        </div>
                        <p className="text-xs font-semibold text-m3-on-surface mt-0.5">{t.pickupAddress}</p>
                        <p className="text-[11px] text-m3-on-surface-variant">Driver: {t.assignedChauffeur} &bull; Guest: {t.guestNamePhone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendDutySlip(t)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-m3-full text-xs font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">send</span>
                          Duty Slip
                        </button>
                      </div>
                    </div>
                  ))}
                {selectedDateTrips.filter(t => t._parsedDate.getHours() < 12).length === 0 && (
                  <p className="text-xs text-m3-on-surface-variant/60 italic pl-6">No morning departures.</p>
                )}
              </div>
            </div>

            {/* Afternoon & Evening (12:00 - 23:59) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-blue-500 text-lg">nights_stay</span>
                <h4 className="text-xs font-bold text-m3-on-surface uppercase tracking-wider">
                  Afternoon & Night Departures (12:00 PM - 11:59 PM)
                </h4>
              </div>
              <div className="space-y-2.5">
                {selectedDateTrips
                  .filter(t => t._parsedDate.getHours() >= 12)
                  .map(t => (
                    <div
                      key={t.bookingId}
                      className="p-3 bg-m3-surface-container-low rounded-m3-lg border border-m3-outline-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code font-bold text-xs text-m3-primary">
                            {t._parsedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="font-bold text-xs text-m3-on-surface">{t.bookingId}</span>
                          <span className="text-xs text-m3-on-surface-variant font-medium">({t.vehicleCategory})</span>
                        </div>
                        <p className="text-xs font-semibold text-m3-on-surface mt-0.5">{t.pickupAddress}</p>
                        <p className="text-[11px] text-m3-on-surface-variant">Driver: {t.assignedChauffeur} &bull; Guest: {t.guestNamePhone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendDutySlip(t)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-m3-full text-xs font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">send</span>
                          Duty Slip
                        </button>
                      </div>
                    </div>
                  ))}
                {selectedDateTrips.filter(t => t._parsedDate.getHours() >= 12).length === 0 && (
                  <p className="text-xs text-m3-on-surface-variant/60 italic pl-6">No afternoon or night departures.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1-MINUTE QUICK BOOKING / SCHEDULE MODAL                   */}
      {/* ========================================================= */}
      <QuickBookingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        initialDate={scheduleDateStr}
        existingLeads={leads}
        existingBookings={bookings}
        onSaveLead={(newLead) => {
          onAddManualLead?.(newLead);
          setIsScheduleModalOpen(false);
        }}
        onConfirmBooking={(newBooking) => {
          onConvertToConfirmed?.(newBooking);
          setIsScheduleModalOpen(false);
        }}
        showToast={showToast}
      />
    </div>
  );
}
