import React, { useState } from 'react';
import AiBookingParser from './AiBookingParser';
import DeskChatRadar from './DeskChatRadar';
import { buildMapsBlock } from '../../../utils/whatsapp';
import { getNextEnquiryId, getNextBookingId, isSequentialId } from '../../../utils/sequenceGenerator';
import { validateCustomerContact } from '../../../utils/bookingContactValidator';

export default function DeskInquiries({
  leads,
  chatQueries = [],
  onLeadQuoted,
  onAddManualLead,
  onConvertToConfirmed,
  onOpenAiParser,
  showToast
}) {
  const [subTab, setSubTab] = useState('leads'); // 'leads' | 'chat_radar'
  const [showQuickPhoneForm, setShowQuickPhoneForm] = useState(false);
  const [quickPhoneLead, setQuickPhoneLead] = useState({
    guestName: '',
    phone: '',
    sourceChannel: 'Phone Call',
    pickup: '',
    drop: '',
    tripType: 'Round Trip',
    vehicle: 'Sedan (Dzire / Etios)',
    estimatedFare: ''
  });
  const [selectedLead, setSelectedLead] = useState(null);
  const [advanceModalLead, setAdvanceModalLead] = useState(null);
  const [advanceForm, setAdvanceForm] = useState({
    advanceAmount: '500',
    travelDate: '',
    pickupTime: '',
    pickupAddress: '',
    vehicleCategory: 'Sedan (Dzire / Etios)',
    fare: ''
  });

  const handleCreateQuickPhoneLead = (e, sendWaImmediately = false) => {
    e.preventDefault();
    if (!quickPhoneLead.phone.trim() && !quickPhoneLead.guestName.trim()) {
      showToast?.('Enter Customer Name or Phone Number', 'error');
      return;
    }
    const cleanPhone = quickPhoneLead.phone.replace(/[^0-9]/g, '').slice(-10);
    const newLead = {
      quoteId: getNextEnquiryId(leads),
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      guestName: quickPhoneLead.guestName.trim() || 'Phone Caller',
      sourcePage: cleanPhone ? `${quickPhoneLead.sourceChannel} (+91 ${cleanPhone})` : quickPhoneLead.sourceChannel,
      calculatorEngine: quickPhoneLead.sourceChannel,
      tripType: quickPhoneLead.tripType,
      pickup: quickPhoneLead.pickup.trim() || 'Chennai',
      drop: quickPhoneLead.drop.trim() || 'Outstation',
      vehicle: quickPhoneLead.vehicle,
      estimatedFare: Number(quickPhoneLead.estimatedFare) || 0,
      status: 'Quote Sent - Waiting Advance'
    };
    onAddManualLead?.(newLead);
    if (sendWaImmediately) {
      handleSendWhatsAppQuote(newLead);
    }
    setQuickPhoneLead({
      guestName: '',
      phone: '',
      sourceChannel: 'Phone Call',
      pickup: '',
      drop: '',
      tripType: 'Round Trip',
      vehicle: 'Sedan (Dzire / Etios)',
      estimatedFare: ''
    });
    setShowQuickPhoneForm(false);
  };

  // 1-Tap Polite Follow-Up on WhatsApp (to boost 2/10 conversion rate)
  const handleSendFollowUpWhatsApp = (lead) => {
    const guestPhone = (lead.sourcePage || '').replace(/[^0-9]/g, '');
    const fare = Number(lead.estimatedFare) || 0;
    const message =
      `Namaskaram ${lead.guestName || 'Sir/Madam'} ji! 🙏\n\n` +
      `Following up from *Kalidass Travels Chennai* regarding your cab enquiry:\n` +
      `📍 *Route:* ${lead.pickup} ➔ ${lead.drop}\n` +
      `🚗 *Car:* ${lead.vehicle || 'AC Cab'}\n` +
      (fare > 0 ? `💰 *All-Inclusive Fare:* ₹${fare.toLocaleString('en-IN')}\n\n` : `\n`) +
      `Shall we block your vehicle? 🚕\n` +
      `Kindly transfer *₹500 Advance* via UPI to *8939539211@okbizaxis* (Kalidass Travels) to lock your cab & driver.\n\n` +
      `📞 24/7 Helpline: +91 89395 39211. Thank you!`;
    const cleanPhone = guestPhone.length >= 10 ? guestPhone.slice(-10) : '';
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleOpenAdvanceModal = (lead) => {
    setAdvanceModalLead(lead);
    setAdvanceForm({
      advanceAmount: '500',
      travelDate: lead.travelDate || '',
      pickupTime: lead.pickupTime || '',
      pickupAddress: `${lead.pickup} ➔ ${lead.drop}`,
      vehicleCategory: lead.vehicle || 'Sedan (Dzire / Etios)',
      fare: String(lead.estimatedFare || '')
    });
  };

  const handleConfirmAdvanceSubmit = (e) => {
    e.preventDefault();
    if (!advanceModalLead) return;

    const advanceNum = Number(advanceForm.advanceAmount) || 500;
    const totalFare = Number(advanceForm.fare) || 0;
    const driverPayout = Math.round(totalFare * 0.8);
    const companyMargin = totalFare - driverPayout;

    const guestPhoneMatch = (advanceModalLead.sourcePage || '').match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
    const phone = guestPhoneMatch ? guestPhoneMatch[0] : '';
    const validation = validateCustomerContact(advanceModalLead.guestName, phone);
    if (!validation.isValid) {
      showToast?.(validation.error || 'Customer Name and a valid 10-digit Mobile Number are required before moving to Active Trips.', 'error');
      return;
    }

    const confirmedBooking = {
      bookingId: (advanceModalLead.quoteId && isSequentialId(advanceModalLead.quoteId)) ? advanceModalLead.quoteId.replace('#ENQ-', '#KT-').replace('#QT-', '#KT-') : getNextBookingId(),
      guestNamePhone: validation.formattedGuestNamePhone,
      travelDateTime: `${advanceForm.travelDate} @ ${advanceForm.pickupTime}`,
      pickupAddress: advanceForm.pickupAddress,
      vehicleCategory: advanceForm.vehicleCategory,
      partySize: advanceModalLead.partySize || '4 Seats',
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
    showToast?.(`Booking ${confirmedBooking.bookingId} locked with ₹${advanceNum} advance!`, 'success');
  };

  // 1-Tap WhatsApp Quote to Inquiring Guest
  const handleSendWhatsAppQuote = (lead) => {
    const guestPhone = (lead.sourcePage || '').replace(/[^0-9]/g, '');
    const fare = Number(lead.estimatedFare) || 6000;
    const advance = 500;

    const mapsBlock = buildMapsBlock(lead.pickup, lead.drop, lead.tripType || 'Round Trip');

    const message =
      `🚕 *KALIDASS TRAVELS — TRIP QUOTE*\n\n` +
      `Namaskaram!\n` +
      `📍 *Route:* ${lead.pickup} ➔ ${lead.drop} (${lead.tripType || 'Round Trip'})\n` +
      `🚗 *Car:* ${lead.vehicle || 'AC Cab'}\n` +
      `💰 *All-Inclusive Fare:* ₹${fare.toLocaleString('en-IN')}\n` +
      `*(Includes Toll, Driver Beta & Fuel. No hidden charges)*\n\n` +
      `🔒 *To Confirm Booking:*\n` +
      `Pay *₹${advance} Advance* via UPI: *8939539211@okbizaxis* (Kalidass Travels)\n` +
      `Vehicle & driver allocated instantly upon payment.\n\n` +
      `📞 24/7 Helpline: +91 89395 39211`;

    const cleanPhone = guestPhone.length >= 10 ? guestPhone.slice(-10) : '';
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* M3 Top Header & Filter Chips */}
      <div className="bg-m3-surface-container-lowest rounded-m3-xl p-3.5 border border-m3-outline-variant/70 shadow-m3-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab('leads')}
            className={`h-9 px-3.5 rounded-m3-sm text-m3-label-l font-medium transition-all flex items-center gap-1.5 border ${
              subTab === 'leads'
                ? 'bg-m3-secondary-container text-m3-on-secondary-container border-transparent font-bold shadow-xs'
                : 'bg-m3-surface text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{subTab === 'leads' ? 'check' : 'forum'}</span>
            <span>Enquiries ({leads.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('chat_radar')}
            className={`h-9 px-3.5 rounded-m3-sm text-m3-label-l font-medium transition-all flex items-center gap-1.5 border ${
              subTab === 'chat_radar'
                ? 'bg-m3-secondary-container text-m3-on-secondary-container border-transparent font-bold shadow-xs'
                : 'bg-m3-surface text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{subTab === 'chat_radar' ? 'check' : 'smart_toy'}</span>
            <span>AI Chat Radar ({chatQueries.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQuickPhoneForm(!showQuickPhoneForm)}
            className="h-10 px-4 bg-m3-secondary-container hover:bg-m3-surface-container-high text-m3-on-secondary-container rounded-m3-full text-m3-label-l font-semibold flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_call</span>
            <span>+ Phone / WA Enquiry</span>
          </button>

          {onOpenAiParser && (
            <button
              type="button"
              onClick={onOpenAiParser}
              className="h-10 px-4 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-m3-label-l font-semibold flex items-center gap-1.5 shadow-m3-1 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span>AI Quick Quote</span>
            </button>
          )}
        </div>
      </div>

      {showQuickPhoneForm && (
        <form
          onSubmit={(e) => handleCreateQuickPhoneLead(e, false)}
          className="bg-amber-50/90 border-2 border-amber-400 rounded-2xl p-3.5 shadow-md space-y-2.5 animate-fadeIn text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900 uppercase">📞 Quick Phone / WhatsApp Enquiry (While Talking to Customer)</span>
            <button type="button" onClick={() => setShowQuickPhoneForm(false)} className="text-slate-500 font-bold">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="text" placeholder="Customer Name (e.g. Ramesh)" value={quickPhoneLead.guestName} onChange={(e) => setQuickPhoneLead({ ...quickPhoneLead, guestName: e.target.value })} className="p-2 rounded-xl border border-slate-300 bg-white font-semibold" />
            <input type="tel" placeholder="Mobile (10 digits)" value={quickPhoneLead.phone} onChange={(e) => setQuickPhoneLead({ ...quickPhoneLead, phone: e.target.value })} className="p-2 rounded-xl border border-slate-300 bg-white font-mono font-bold" />
            <select value={quickPhoneLead.sourceChannel} onChange={(e) => setQuickPhoneLead({ ...quickPhoneLead, sourceChannel: e.target.value })} className="p-2 rounded-xl border border-slate-300 bg-white font-bold">
              <option value="Phone Call">📞 Phone Call</option>
              <option value="Google Ads">🎯 Google Ads</option>
              <option value="WhatsApp Form">💬 WhatsApp Form</option>
              <option value="ChatGPT / Gemini AI">🤖 ChatGPT / Gemini AI</option>
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input type="text" placeholder="Pickup" value={quickPhoneLead.pickup} onChange={(e) => setQuickPhoneLead({ ...quickPhoneLead, pickup: e.target.value })} className="p-2 rounded-xl border border-slate-300 bg-white" />
            <input type="text" placeholder="Drop" value={quickPhoneLead.drop} onChange={(e) => setQuickPhoneLead({ ...quickPhoneLead, drop: e.target.value })} className="p-2 rounded-xl border border-slate-300 bg-white" />
            <select value={quickPhoneLead.vehicle} onChange={(e) => setQuickPhoneLead({ ...quickPhoneLead, vehicle: e.target.value })} className="p-2 rounded-xl border border-slate-300 bg-white font-semibold">
              <option value="Sedan (Dzire / Etios)">Sedan (Dzire/Etios)</option>
              <option value="SUV (Ertiga 6+1)">SUV (Ertiga 6+1)</option>
              <option value="Innova Crysta (7+1)">Innova Crysta</option>
              <option value="Tempo Traveller">Tempo Traveller</option>
              <option value="Acting Driver">Acting Driver</option>
            </select>
            <input type="number" placeholder="Quoted Fare ₹" value={quickPhoneLead.estimatedFare} onChange={(e) => setQuickPhoneLead({ ...quickPhoneLead, estimatedFare: e.target.value })} className="p-2 rounded-xl border border-slate-300 bg-white font-mono font-extrabold text-emerald-700" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-bold">Save Enquiry</button>
            <button type="button" onClick={(e) => handleCreateQuickPhoneLead(e, true)} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold">Save & Send WA Quote</button>
          </div>
        </form>
      )}

      {subTab === 'chat_radar' ? (
        <DeskChatRadar chatQueries={chatQueries} showToast={showToast} />
      ) : (
        <>
          {/* Inquiries Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-m3-on-surface tracking-tight flex items-center gap-1.5">
                <span className="material-symbols-outlined text-m3-tertiary text-base">forum</span>
                <span>Step 1: Enquiries from Google Ads, Website, WhatsApp & AI ({leads.length})</span>
              </h2>
              <span className="text-[11px] text-m3-outline">
                2 out of 10 enquiries convert to bookings. Send Quote WA ➔ Follow-Up WA ➔ Collect ₹500 Advance to Lock Booking.
              </span>
            </div>
          </div>

      {/* Inquiries Stream */}
      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-m3-outline-variant shadow-sm">
          <span className="material-symbols-outlined text-4xl text-m3-inverse-on-surface/80 mb-2">mark_chat_read</span>
          <p className="text-xs font-bold text-m3-on-surface-variant">No pending inquiries right now.</p>
          <span className="text-[11px] text-m3-outline-variant block mt-1">
            New customer queries from WhatsApp or the website calculator will appear here.
          </span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {leads.map((l, idx) => (
            <div
              key={l.quoteId || idx}
              className="bg-white rounded-xl border border-m3-outline-variant p-3.5 shadow-sm hover:border-m3-outline-variant transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-m3-on-surface">{l.pickup} ➔ {l.drop}</span>
                    <span className="text-[10px] bg-m3-tertiary-container/30 text-m3-on-tertiary-container border border-m3-tertiary/30 font-bold px-1.5 py-0.2 rounded">
                      {l.status || 'Active Inquiry'}
                    </span>
                  </div>
                  <span className="text-[11px] text-m3-outline block mt-0.5 font-mono">
                    {l.vehicle} • {l.tripType} • {l.timestamp}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-m3-on-surface font-mono block">
                    ₹{Number(l.estimatedFare || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-m3-outline-variant">Quoted Rate</span>
                </div>
              </div>

              {/* Action Ribbon (M3 Pill Buttons) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2.5 border-t border-m3-outline-variant/40">
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppQuote(l)}
                  className="h-9 px-3 bg-m3-secondary-container hover:bg-m3-surface-container-high text-m3-on-secondary-container rounded-m3-full text-m3-label-m font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>1. Send Quote WA</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendFollowUpWhatsApp(l)}
                  className="h-9 px-3 bg-m3-surface hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-m3-label-m font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                  <span>2. Follow-Up WA</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAdvanceModal(l)}
                  className="h-9 px-3 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-m3-label-m font-semibold flex items-center justify-center gap-1.5 shadow-m3-1 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span>3. Advance Paid (Book)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {/* Lock with Advance Modal */}
      {advanceModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-m3-outline-variant">
            <div className="bg-m3-inverse-surface text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-tertiary">verified</span>
                <div>
                  <h3 className="text-sm font-bold">Lock Confirmed Booking</h3>
                  <span className="text-[11px] text-m3-inverse-on-surface/80">Convert Inquiry to Live Dispatch</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdvanceModalLead(null)}
                className="text-m3-outline-variant hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmAdvanceSubmit} className="p-4 space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-m3-tertiary-container/30 border border-m3-tertiary/30 text-m3-on-tertiary-container">
                <span className="font-bold block">Advance Received:</span>
                <span className="text-[11px]">
                  Confirming this locks the trip on your dispatch schedule. You can broadcast to your driver group 24h before travel.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-1">
                  Advance Amount (Rs)
                </label>
                <div className="flex items-center gap-1.5 mb-2">
                  {['500', '1000', '2000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdvanceForm({ ...advanceForm, advanceAmount: amt })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all border ${
                        advanceForm.advanceAmount === amt
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                      }`}
                    >
                      ₹{amt} {amt === '500' ? '(Standard)' : ''}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      required
                      value={advanceForm.advanceAmount}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, advanceAmount: e.target.value })}
                      placeholder="Custom ₹"
                      className="w-full font-mono font-bold text-amber-700 rounded-lg border border-m3-outline-variant p-2 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      value={advanceForm.fare}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, fare: e.target.value })}
                      placeholder="Agreed Fare ₹"
                      className="w-full font-mono font-bold text-m3-on-surface rounded-lg border border-m3-outline-variant p-2 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-1">Travel Date</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 25-Oct-2026 / Tomorrow"
                    value={advanceForm.travelDate}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, travelDate: e.target.value })}
                    className="w-full rounded-lg border border-m3-outline-variant p-2 focus:ring-2 focus:ring-m3-tertiary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-1">Pickup Time</label>
                  <input
                    type="text"
                    required
                    placeholder="05:00 AM"
                    value={advanceForm.pickupTime}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, pickupTime: e.target.value })}
                    className="w-full rounded-lg border border-m3-outline-variant p-2 focus:ring-2 focus:ring-m3-tertiary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-1">Exact Pickup Address & Route</label>
                <input
                  type="text"
                  required
                  value={advanceForm.pickupAddress}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, pickupAddress: e.target.value })}
                  className="w-full rounded-lg border border-m3-outline-variant p-2 focus:ring-2 focus:ring-m3-tertiary"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdvanceModalLead(null)}
                  className="flex-1 py-2 text-m3-outline hover:text-m3-on-surface font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-m3-success hover:bg-m3-success text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
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
