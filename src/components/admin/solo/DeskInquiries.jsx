import React, { useState } from 'react';
import AiBookingParser from './AiBookingParser';

export default function DeskInquiries({
  leads,
  onLeadQuoted,
  onConvertToConfirmed,
  showToast
}) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [advanceModalLead, setAdvanceModalLead] = useState(null);
  const [advanceForm, setAdvanceForm] = useState({
    advanceAmount: '500',
    travelDate: 'Tomorrow',
    pickupTime: '05:00 AM',
    pickupAddress: '',
    vehicleCategory: 'Sedan (Dzire / Etios)',
    fare: '6000'
  });

  const handleOpenAdvanceModal = (lead) => {
    setAdvanceModalLead(lead);
    setAdvanceForm({
      advanceAmount: '500',
      travelDate: lead.travelDate || 'Tomorrow',
      pickupTime: lead.pickupTime || '05:00 AM',
      pickupAddress: `${lead.pickup} ➔ ${lead.drop}`,
      vehicleCategory: lead.vehicle || 'Sedan (Dzire / Etios)',
      fare: String(lead.estimatedFare || 6000)
    });
  };

  const handleConfirmAdvanceSubmit = (e) => {
    e.preventDefault();
    if (!advanceModalLead) return;

    const advanceNum = Number(advanceForm.advanceAmount) || 500;
    const totalFare = Number(advanceForm.fare) || 6000;
    const driverPayout = Math.round(totalFare * 0.8);
    const companyMargin = totalFare - driverPayout;

    const guestPhoneMatch = (advanceModalLead.sourcePage || '').match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
    const phone = guestPhoneMatch ? guestPhoneMatch[0] : '9840100000';

    const confirmedBooking = {
      bookingId: `#KT-BOK-${Date.now().toString().slice(-4)}`,
      guestNamePhone: `${advanceModalLead.guestName || 'Guest'} (+91 ${phone.replace(/[^0-9]/g, '').slice(-10)})`,
      travelDateTime: `${advanceForm.travelDate} @ ${advanceForm.pickupTime}`,
      pickupAddress: advanceForm.pickupAddress,
      vehicleCategory: advanceForm.vehicleCategory,
      partySize: advanceModalLead.partySize || '4 Pax',
      kycStatus: 'Verified',
      darshanStatus: 'Unassigned',
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Pending',
      terminalFare: totalFare,
      chauffeurPayout: driverPayout,
      companyMargin,
      advancePaid: advanceNum,
      balanceDue: Math.max(0, totalFare - advanceNum),
      financialClosure: 'Unreconciled'
    };

    onConvertToConfirmed(confirmedBooking, advanceModalLead.quoteId);
    setAdvanceModalLead(null);
    showToast?.(`Booking ${confirmedBooking.bookingId} locked with Rs.${advanceNum} advance!`, 'success');
  };

  // 1-Tap WhatsApp Quote to Inquiring Guest
  const handleSendWhatsAppQuote = (lead) => {
    const guestPhone = (lead.sourcePage || '').replace(/[^0-9]/g, '');
    const fare = Number(lead.estimatedFare) || 6000;
    const advance = 500;

    const message = `*KALIDASS TRAVELS CHENNAI — TRIP QUOTATION*\n\n` +
      `Namaskaram! Thank you for inquiring with Kalidass Travels.\n\n` +
      `📍 *Route:* ${lead.pickup} ➔ ${lead.drop} (${lead.tripType || 'Round Trip'})\n` +
      `🚗 *Vehicle:* ${lead.vehicle}\n` +
      `💰 *Estimated All-Inclusive Fare:* Rs.${fare.toLocaleString('en-IN')}\n` +
      `_(Includes Car, Chauffeur Bata & Fuel. Tolls/Parking at actuals)_\n\n` +
      `🔒 *To Confirm Your Booking:* Kindly pay a token advance of *Rs.${advance}* via UPI to *8939539211@okbizaxis* (Kalidass Travels) to lock your vehicle.\n\n` +
      `Chauffeur & vehicle details will be sent the evening before departure. Have a wonderful trip! 🌟`;

    const cleanPhone = guestPhone.length >= 10 ? guestPhone.slice(-10) : '';
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* AI Smart Parser on Top */}
      <AiBookingParser
        showToast={showToast}
        onBookingCreated={(newConfirmed) => {
          onConvertToConfirmed(newConfirmed);
        }}
      />

      {/* Inquiries Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span className="material-symbols-outlined text-amber-500 text-base">forum</span>
            <span>Inquiries & Price Shoppers ({leads.length})</span>
          </h2>
          <span className="text-[11px] text-slate-500">
            People who asked for rates. Quote them and request a ₹500 token advance to lock the booking.
          </span>
        </div>
      </div>

      {/* Inquiries Stream */}
      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">mark_chat_read</span>
          <p className="text-xs font-bold text-slate-600">No pending inquiries right now.</p>
          <span className="text-[11px] text-slate-400 block mt-1">
            New customer queries from WhatsApp or the website calculator will appear here.
          </span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {leads.map((l, idx) => (
            <div
              key={l.quoteId || idx}
              className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{l.pickup} ➔ {l.drop}</span>
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-1.5 py-0.2 rounded">
                      {l.status || 'Active Inquiry'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">
                    {l.vehicle} • {l.tripType} • {l.timestamp}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 font-mono block">
                    Rs. {Number(l.estimatedFare || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400">Quoted Rate</span>
                </div>
              </div>

              {/* Action Ribbon */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppQuote(l)}
                  className="flex-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>1-Tap WA Quote</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAdvanceModal(l)}
                  className="flex-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span>Advance Received (Lock)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lock with Advance Modal */}
      {advanceModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">verified</span>
                <div>
                  <h3 className="text-sm font-bold">Lock Confirmed Booking</h3>
                  <span className="text-[11px] text-slate-300">Convert Inquiry to Live Dispatch</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdvanceModalLead(null)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmAdvanceSubmit} className="p-4 space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <span className="font-bold block">Token Advance Received:</span>
                <span className="text-[11px]">
                  Confirming this locks the trip on your dispatch schedule. You can broadcast to your driver group 24h before travel.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Advance Token (Rs)</label>
                  <input
                    type="number"
                    required
                    value={advanceForm.advanceAmount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, advanceAmount: e.target.value })}
                    className="w-full font-mono font-bold text-amber-700 rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Agreed Fare (Rs)</label>
                  <input
                    type="number"
                    required
                    value={advanceForm.fare}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, fare: e.target.value })}
                    className="w-full font-mono font-bold text-slate-900 rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Travel Date</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 25-Oct-2026 / Tomorrow"
                    value={advanceForm.travelDate}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, travelDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pickup Time</label>
                  <input
                    type="text"
                    required
                    placeholder="05:00 AM"
                    value={advanceForm.pickupTime}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, pickupTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Exact Pickup Address & Route</label>
                <input
                  type="text"
                  required
                  value={advanceForm.pickupAddress}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, pickupAddress: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdvanceModalLead(null)}
                  className="flex-1 py-2 text-slate-500 hover:text-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span>Confirm Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
