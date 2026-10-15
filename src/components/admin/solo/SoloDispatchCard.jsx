import React, { useState } from 'react';
import { checkChauffeurConflict } from './ConflictDetector';

export default function SoloDispatchCard({
  booking,
  allBookings,
  chauffeurs,
  onAssignChauffeur,
  onStatusChange,
  onOpenDutySlip,
  showToast
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check double-booking conflict
  const conflict = checkChauffeurConflict(booking, allBookings, chauffeurs);

  // Parse phone from guestNamePhone
  const guestPhoneMatch = (booking.guestNamePhone || '').match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
  const cleanGuestPhone = guestPhoneMatch ? guestPhoneMatch[0].replace(/[^0-9]/g, '') : '';
  const guestName = booking.guestNamePhone ? booking.guestNamePhone.split('(')[0].trim() : 'Guest';

  // Chauffeur matching
  const assignedChauffeurObj = chauffeurs.find(c =>
    booking.assignedChauffeur && booking.assignedChauffeur.toLowerCase().includes(c.name.toLowerCase())
  );

  const getTripUrl = (bookingId) => {
    const cleanRef = (bookingId || 'KT101').replace(/[^A-Za-z0-9]/g, '');
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return `${window.location.origin}/trip/?ref=${cleanRef}`;
    }
    return `https://kalidasstravels.in/trip/?ref=${cleanRef}`;
  };

  const tripUrl = getTripUrl(booking.bookingId);

  const handleCopyTripUrl = () => {
    navigator.clipboard.writeText(tripUrl);
    showToast?.('Trip sheet link copied to clipboard!', 'success');
  };

  // 1-Tap WhatsApp to Driver (Dispatch Manifest)
  const handleWhatsAppDriver = () => {
    if (!assignedChauffeurObj && booking.assignedChauffeur === 'Unassigned') {
      showToast?.('Please assign a chauffeur first!', 'error');
      return;
    }

    const driverPhone = assignedChauffeurObj?.phone?.replace(/[^0-9]/g, '') || '8939539211';
    const message = `*KALIDASS TRAVELS — TRIP DISPATCH MANIFEST*\n` +
      `Trip Ref: *${booking.bookingId}*\n\n` +
      `👤 *Guest:* ${booking.guestNamePhone}\n` +
      `🗓 *Travel Time:* ${booking.travelDateTime}\n` +
      `📍 *Pickup / Route:* ${booking.pickupAddress}\n` +
      `🚗 *Assigned Vehicle:* ${booking.vehicleCategory} (${booking.partySize})\n` +
      `💰 *Total Billable to Guest:* Rs.${booking.terminalFare}\n` +
      `💵 *Your Trip Share:* Rs.${booking.chauffeurPayout}\n\n` +
      `📱 *Digital Trip Sheet & Odometer:* ${tripUrl}\n\n` +
      `_Instructions: Please call the guest 15 mins before arrival. Take starting odometer photo. Keep car clean and AC on. Safe driving!_`;

    window.open(`https://wa.me/${driverPhone.startsWith('91') ? driverPhone : '91' + driverPhone.slice(-10)}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // 1-Tap WhatsApp to Guest (Chauffeur Details)
  const handleWhatsAppGuest = () => {
    if (!assignedChauffeurObj && booking.assignedChauffeur === 'Unassigned') {
      showToast?.('Please assign a chauffeur before notifying guest!', 'error');
      return;
    }

    const driverName = assignedChauffeurObj?.name || booking.assignedChauffeur.split('-')[0].trim();
    const driverPhone = assignedChauffeurObj?.phone || '+91 89395 39211';
    const vehiclePlate = assignedChauffeurObj?.plate || booking.assignedChauffeur.split('-')[1]?.trim() || 'Commercial Plate';

    const message = `*KALIDASS TRAVELS CHENNAI — CHAUFFEUR ASSIGNMENT*\n\n` +
      `Namaskaram ${guestName} ji! Your chauffeur details for Trip *${booking.bookingId}* are:\n\n` +
      `👨‍✈️ *Chauffeur:* ${driverName}\n` +
      `📞 *Contact Number:* ${driverPhone}\n` +
      `🚗 *Vehicle:* ${booking.vehicleCategory} (${vehiclePlate})\n` +
      `🗓 *Pickup Time:* ${booking.travelDateTime}\n` +
      `📍 *Pickup Address:* ${booking.pickupAddress}\n\n` +
      `📱 *Live Digital Trip Sheet & Chauffeur Details:*\n${tripUrl}\n\n` +
      `Your chauffeur will reach 10-15 minutes prior to departure. For 24/7 help, call our control room at +91 89395 39211.\n` +
      `Wishing you a blessed and comfortable journey! ✨`;

    const destPhone = cleanGuestPhone.length >= 10 ? cleanGuestPhone : '';
    const url = destPhone
      ? `https://wa.me/${destPhone.startsWith('91') ? destPhone : '91' + destPhone.slice(-10)}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // 1-Tap Google Review Request to Guest
  const handleWhatsAppReview = () => {
    const message = `*KALIDASS TRAVELS — THANK YOU FOR TRAVELING WITH US!*\n\n` +
      `Dear ${guestName} ji, we hope you had a pleasant and smooth trip with Kalidass Travels.\n\n` +
      `Your feedback means the world to our family-run team. If you enjoyed our service, could you take 30 seconds to give us a 5-star review on Google?\n\n` +
      `⭐ *Tap here to review:* https://g.page/r/kalidasstravels/review\n\n` +
      `Thank you for your patronage! We look forward to serving you again. 🙏`;

    const destPhone = cleanGuestPhone.length >= 10 ? cleanGuestPhone : '';
    const url = destPhone
      ? `https://wa.me/${destPhone.startsWith('91') ? destPhone : '91' + destPhone.slice(-10)}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Badge styles
  const getStatusColor = (status) => {
    switch (status) {
      case 'In Transit': return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Dispatched': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Completed': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
      conflict.hasConflict ? 'border-rose-400 ring-2 ring-rose-200/50' : 'border-slate-200 hover:border-slate-300 shadow-sm'
    }`}>
      {/* Conflict Warning Bar */}
      {conflict.hasConflict && (
        <div className="bg-rose-500 text-white px-3.5 py-1.5 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>{conflict.message}</span>
          </div>
          <span className="text-[10px] bg-rose-700/60 uppercase px-1.5 py-0.5 rounded">Action Needed</span>
        </div>
      )}

      {/* Card Header */}
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm text-slate-900">{booking.bookingId}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(booking.manifestStatus)}`}>
                {booking.manifestStatus}
              </span>
              <button
                type="button"
                onClick={handleCopyTripUrl}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded transition-colors"
                title="Copy Mobile Web Trip Sheet link"
              >
                <span className="material-symbols-outlined text-sm">link</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold mt-0.5">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>{booking.travelDateTime}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-base font-extrabold text-slate-900 font-mono block">
              Rs. {Number(booking.terminalFare || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold font-mono">
              Margin: Rs.{booking.companyMargin || (booking.terminalFare - booking.chauffeurPayout)}
            </span>
          </div>
        </div>

        {/* Route & Passenger */}
        <div className="bg-slate-50 rounded-xl p-2.5 mb-3 border border-slate-100">
          <div className="flex items-start gap-1.5 text-xs text-slate-800 font-medium mb-1.5">
            <span className="material-symbols-outlined text-sm text-amber-500 shrink-0 mt-0.5">near_me</span>
            <span className="line-clamp-2">{booking.pickupAddress}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 border-t border-slate-200/60 pt-1.5">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-slate-400">person</span>
              <span className="font-semibold text-slate-700">{booking.guestNamePhone}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <span className="material-symbols-outlined text-sm text-slate-400">directions_car</span>
              <span>{booking.vehicleCategory} ({booking.partySize})</span>
            </div>
          </div>
        </div>

        {/* Chauffeur Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Assigned Chauffeur
            </label>
            <select
              value={booking.assignedChauffeur || 'Unassigned'}
              onChange={(e) => onAssignChauffeur(booking.bookingId, e.target.value)}
              className={`w-full text-xs font-semibold rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                booking.assignedChauffeur === 'Unassigned'
                  ? 'border-amber-300 bg-amber-50/50 text-amber-900'
                  : 'border-slate-300 bg-white text-slate-800'
              }`}
            >
              <option value="Unassigned">⚠️ Unassigned (Select Chauffeur)</option>
              {chauffeurs.map((c) => (
                <option key={c.name} value={`${c.name} - ${c.plate}`}>
                  {c.name} ({c.plate}) — {c.category} ⭐{c.rating}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:w-36">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Trip Status
            </label>
            <select
              value={booking.manifestStatus}
              onChange={(e) => onStatusChange(booking.bookingId, e.target.value)}
              className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Pending">Pending</option>
              <option value="Dispatched">Dispatched</option>
              <option value="In Transit">In Transit</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* 1-Tap Action Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
          <button
            type="button"
            onClick={handleWhatsAppDriver}
            className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            title="Dispatch manifest to driver WhatsApp"
          >
            <span className="material-symbols-outlined text-sm">send_to_mobile</span>
            <span>Driver WA</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppGuest}
            className="px-2.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            title="Send chauffeur details to guest WhatsApp"
          >
            <span className="material-symbols-outlined text-sm">chat</span>
            <span>Guest WA</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDutySlip(booking)}
            className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            title="Record KM & close duty slip"
          >
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            <span>Duty Slip</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppReview}
            className="px-2.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            title="Ask for 5-star Google review"
          >
            <span className="material-symbols-outlined text-sm">star</span>
            <span>5★ Review</span>
          </button>
        </div>
      </div>
    </div>
  );
}
