import React, { useState, useMemo } from 'react';
import { buildMapsBlock } from '../../../utils/whatsapp';
import { validateCustomerContact, extractValidMobile, isPlaceholderCustomerName } from '../../../utils/bookingContactValidator';
import { getNextEnquiryId, getOrderedEnquiryId, getNextBookingId, isSequentialId } from '../../../utils/sequenceGenerator';

/**
 * EnquiriesView - Step 1: Inbound Customer Calls & Quotes
 * Dedicated view for non-technical office staff:
 * Only manages new inquiries, sending quotes on WhatsApp, and collecting ₹500 advance.
 */
export default function EnquiriesView({
  leads = [],
  onAddManualLead,
  onConvertToConfirmed,
  onOpenPhoneQuoteEngine,
  onOpenAiParser,
  showToast
}) {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [showNewCallModal, setShowNewCallModal] = useState(false);

  // Modal State: Convert Enquiry to Active Trip when Name/Phone missing
  const [convertModalLead, setConvertModalLead] = useState(null);
  const [convertForm, setConvertForm] = useState({
    guestName: '',
    phone: '',
    travelDateTime: 'Tomorrow @ 05:00 AM',
    advancePaid: '500'
  });
  const [convertError, setConvertError] = useState('');

  const [newCall, setNewCall] = useState({
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

  const extractPhone = (item) => {
    const combined = `${item.phone || ''} ${item.sourcePage || ''} ${item.pickup || ''} ${item.guestName || ''} ${item.metadata || ''}`;
    const match = combined.match(/[6-9]\d{9}/);
    return match ? match[0] : '';
  };

  const validLeads = useMemo(
    () => leads.filter(l => {
      const fare = Number(l.estimatedFare) > 0;
      const notChat = !(l.drop || '').toLowerCase().includes('whatsapp chat');
      const phone = extractPhone(l);
      const isActionable = Boolean(phone || (l.guestName && !l.guestName.toLowerCase().includes('visitor')));
      return fare && notChat && isActionable;
    }),
    [leads]
  );

  const filteredLeads = useMemo(() => {
    return validLeads.filter(l => {
      const q = search.toLowerCase().trim();
      const combined = `${l.guestName || ''} ${l.pickup || ''} ${l.drop || ''} ${l.vehicle || ''} ${l.quoteId || ''} ${l.sourcePage || ''}`.toLowerCase();
      if (q && !combined.includes(q)) return false;

      if (sourceFilter === 'GOOGLE_ADS') {
        return combined.includes('google ads') || combined.includes('call campaign');
      }
      if (sourceFilter === 'WHATSAPP') {
        return (l.quoteId || '').startsWith('#WA') || combined.includes('whatsapp');
      }
      if (sourceFilter === 'PHONE') {
        return combined.includes('phone') || combined.includes('call') || combined.includes('direct');
      }
      return true;
    });
  }, [validLeads, search, sourceFilter]);

  // Send WhatsApp Quote
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
      `Our team will instantly block the vehicle and allot your driver.\n\n` +
      `📞 24/7 Support: +91 89395 39211` +
      mapsBlock;

    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.(`WhatsApp quote opened for ${lead.guestName || 'Customer'}!`, 'success');
  };

  // Follow-up ping
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

  // Advance Received ➔ Move to Active Trips (Requires Valid Name & 10-digit Phone)
  const handleLockLeadWithAdvance = (lead) => {
    const cleanPhone = extractValidMobile(lead);
    const guestLabel = lead.guestName && !isPlaceholderCustomerName(lead.guestName)
      ? lead.guestName.split('(')[0].trim()
      : (lead.pickup && lead.pickup.includes('+91') ? lead.pickup.split('(')[0].trim() : '');

    const validation = validateCustomerContact(guestLabel, cleanPhone);

    // If either name or phone is missing/invalid, open modal so operator can enter them
    if (!validation.isValid) {
      setConvertModalLead(lead);
      setConvertForm({
        guestName: validation.cleanName || '',
        phone: validation.cleanPhone || '',
        travelDateTime: lead.travelDate || 'Tomorrow @ 05:00 AM',
        advancePaid: '500'
      });
      setConvertError(validation.error);
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
  };

  // Submit modal when entering missing customer name & phone for an enquiry
  const handleConfirmLeadConvert = (e) => {
    e?.preventDefault?.();
    if (!convertModalLead) return;

    const validation = validateCustomerContact(convertForm.guestName, convertForm.phone);
    if (!validation.isValid) {
      setConvertError(validation.error);
      showToast?.(validation.error, 'error');
      return;
    }

    const fare = Number(convertModalLead.estimatedFare) || 6000;
    const driverShare = Math.round(fare * 0.82);
    const adv = Number(convertForm.advancePaid) || 500;
    const routeLabel = convertModalLead.pickup.includes('+91') ? convertModalLead.drop : `${convertModalLead.pickup} ➔ ${convertModalLead.drop}`;

    const confirmed = {
      bookingId: (convertModalLead.quoteId && isSequentialId(convertModalLead.quoteId)) ? convertModalLead.quoteId.replace('#ENQ-', '#KT-').replace('#QT-', '#KT-') : getNextBookingId(),
      guestNamePhone: validation.formattedGuestNamePhone,
      travelDateTime: convertForm.travelDateTime.trim() || 'Tomorrow @ 05:00 AM',
      pickupAddress: routeLabel,
      vehicleCategory: convertModalLead.vehicle || 'Sedan (Dzire / Etios)',
      partySize: '4 Pax',
      kycStatus: 'Advance Paid',
      darshanStatus: convertModalLead.sourcePage || convertModalLead.calculatorEngine || 'Direct Call',
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Need Driver',
      terminalFare: fare,
      chauffeurPayout: driverShare,
      companyMargin: fare - driverShare,
      advancePaid: adv,
      balanceDue: Math.max(0, fare - adv),
      financialClosure: 'Unreconciled',
      reviewStatus: 'Pending'
    };

    onConvertToConfirmed?.(confirmed, convertModalLead.quoteId);
    showToast?.(`✅ ₹${adv} Advance Received! Booking ${confirmed.bookingId} confirmed for ${validation.cleanName}.`, 'success');
    setConvertModalLead(null);
  };

  // Fast Phone Call Saver
  const handleQuickSaveCall = (e) => {
    e.preventDefault();
    if (!newCall.phone.trim() && !newCall.guestName.trim()) {
      showToast?.('Please enter Customer Name or Mobile Number', 'error');
      return;
    }
    const cleanPhone = newCall.phone.replace(/[^0-9]/g, '').slice(-10);
    const fareNum = Number(newCall.fare) || 0;
    const newLead = {
      quoteId: getNextEnquiryId(leads),
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      guestName: newCall.guestName.trim() || (cleanPhone ? `Customer (${cleanPhone})` : 'Phone Caller'),
      sourcePage: cleanPhone ? `${newCall.source} (+91 ${cleanPhone})` : newCall.source,
      calculatorEngine: newCall.source,
      tripType: 'Round Trip',
      pickup: newCall.pickup.trim() || 'Chennai',
      drop: newCall.drop.trim() || 'Outstation',
      vehicle: newCall.vehicle,
      estimatedFare: fareNum,
      travelDate: newCall.travelDate || 'Tomorrow @ 05:00 AM',
      status: 'Quote Sent - Waiting Advance'
    };

    onAddManualLead?.(newLead);
    if (cleanPhone) {
      handleSendQuoteWA(newLead);
    }
    setNewCall({
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
    showToast?.(`New enquiry ${newLead.quoteId} recorded!`, 'success');
  };

  // Direct Advance Received & Confirm (Strict: Requires BOTH Customer Name & valid 10-digit Phone)
  const handleQuickConfirmBooking = () => {
    const validation = validateCustomerContact(newCall.guestName, newCall.phone);
    if (!validation.isValid) {
      showToast?.(validation.error || 'Please enter Customer Name and a valid 10-digit Mobile Number before moving to Active Trips.', 'error');
      return;
    }
    const fareNum = Number(newCall.fare) || 0;
    const advNum = Number(newCall.advance) || 500;
    const driverShare = Math.round(fareNum * 0.82);

    const newBooking = {
      bookingId: getNextBookingId(),
      guestNamePhone: validation.formattedGuestNamePhone,
      travelDateTime: newCall.travelDate || 'Tomorrow @ 05:00 AM',
      pickupAddress: `${newCall.pickup.trim() || 'Chennai'} ➔ ${newCall.drop.trim() || 'Outstation'}`,
      vehicleCategory: newCall.vehicle,
      partySize: '4 Pax',
      kycStatus: 'Advance Paid',
      darshanStatus: newCall.source,
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
    setNewCall({
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
    showToast?.(`✅ Booking ${newBooking.bookingId} confirmed! Check Active Trips.`, 'success');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Page Header Bar */}
      <div className="bg-m3-surface-container-lowest p-4 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-m3-primary"></span>
            <h2 className="text-m3-title-m font-bold text-m3-on-surface">
              1. Customer Enquiries & Quotes
            </h2>
            <span className="text-xs font-semibold bg-m3-primary-container text-m3-on-primary-container px-2.5 py-0.5 rounded-full">
              {validLeads.length} Inquiries
            </span>
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-0.5">
            Incoming calls from Google Ads, phone calls & WhatsApp. Send quotes and collect ₹500 advance.
          </p>
        </div>

        {/* Primary Action Button (Rate Calc & Paste WA are in the top app bar) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewCallModal(true)}
            className="h-10 px-5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-xs font-semibold flex items-center gap-2 shadow-m3-1 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_call</span>
            <span>+ New Customer Call</span>
          </button>
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
            placeholder="Search by customer name, phone, or route..."
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
            { id: 'ALL', label: `All (${validLeads.length})` },
            { id: 'GOOGLE_ADS', label: 'Google Ads' },
            { id: 'WHATSAPP', label: 'WhatsApp' },
            { id: 'PHONE', label: 'Direct Calls' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSourceFilter(f.id)}
              className={`h-8 px-3 rounded-m3-sm text-xs font-semibold transition-colors ${
                sourceFilter === f.id
                  ? 'bg-m3-secondary-container text-m3-on-secondary-container border-0'
                  : 'bg-m3-surface-container-lowest text-m3-on-surface-variant border border-m3-outline-variant hover:bg-m3-surface-container-high'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries List */}
      {filteredLeads.length === 0 ? (
        <div className="p-10 text-center bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-m3-surface-container-high text-m3-on-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">phone_in_talk</span>
          </div>
          <h3 className="text-sm font-bold text-m3-on-surface">No Pending Enquiries</h3>
          <p className="text-xs text-m3-on-surface-variant max-w-md mx-auto">
            When a customer calls or inquires from Google Ads or your website, record them here to send an instant quote and follow up for ₹500 advance.
          </p>
          <button
            type="button"
            onClick={() => setShowNewCallModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-m3-full text-xs font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add_call</span>
            <span>Record Customer Call</span>
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
                className="p-4 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/80 shadow-m3-1 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:border-m3-outline transition-all"
              >
                {/* Left: Lead Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-code text-xs font-bold bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant/70 px-2.5 py-0.5 rounded-full">
                      {getOrderedEnquiryId(lead, idx, filteredLeads.length)}
                    </span>

                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-m3-secondary-container text-m3-on-secondary-container">
                      <span className="material-symbols-outlined text-[13px]">
                        {isGoogleAds ? 'campaign' : isWhatsApp ? 'chat' : 'call'}
                      </span>
                      <span>{isGoogleAds ? 'Google Ads Call' : isWhatsApp ? 'WhatsApp' : 'Phone Call'}</span>
                    </span>

                    <span className="text-xs font-bold text-m3-on-surface">
                      👤 {lead.guestName || 'Customer'}
                    </span>

                    {phone && (
                      <a
                        href={`tel:+91${phone}`}
                        className="text-xs font-mono-code font-bold text-m3-primary hover:underline bg-m3-secondary-container/60 px-2 py-0.5 rounded-full flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">call</span>
                        <span>+91 {phone}</span>
                      </a>
                    )}

                    <span className="text-[11px] text-m3-outline ml-auto">
                      🕒 {lead.timestamp}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-m3-on-surface truncate">
                    📍 {lead.pickup} ➔ {lead.drop}
                  </div>

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

                {/* Right: Price & 3 Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-m3-outline-variant/50">
                  <div className="text-left lg:text-right mr-1">
                    <span className="text-base font-bold text-m3-on-surface block">
                      Rs.{Number(lead.estimatedFare || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-m3-on-surface-variant font-medium">Quoted Fare</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendQuoteWA(lead)}
                    className="h-9 px-3.5 bg-m3-surface-container-low hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    <span>Send Quote (WA)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendFollowUpWA(lead)}
                    className="h-9 px-3 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-m3-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Send follow-up reminder to confirm cab"
                  >
                    <span className="material-symbols-outlined text-[15px]">ring_volume</span>
                    <span className="hidden sm:inline">Follow-up</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLockLeadWithAdvance(lead)}
                    className="h-9 px-4 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-xs font-semibold flex items-center gap-1.5 shadow-m3-1 transition-all"
                    title="Customer paid ₹500 advance. Move to Step 2: Active Trips"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Got ₹500 Adv (Confirm)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Phone Call Modal */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-2xl shadow-m3-4 w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-m3-outline-variant/70 bg-m3-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_call</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-m3-on-surface">Record Inbound Customer Call</h3>
                  <p className="text-xs text-m3-on-surface-variant">Enter customer details ➔ send WhatsApp quote or confirm</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCallModal(false)}
                className="w-8 h-8 rounded-full hover:bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface-variant font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickSaveCall} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newCall.guestName}
                    onChange={(e) => setNewCall({ ...newCall, guestName: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Mobile Number (10 Digits)</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9840123456"
                    value={newCall.phone}
                    onChange={(e) => setNewCall({ ...newCall, phone: e.target.value })}
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
                    value={newCall.pickup}
                    onChange={(e) => setNewCall({ ...newCall, pickup: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Drop Destination</label>
                  <input
                    type="text"
                    placeholder="e.g. Tirupati / Pondicherry / Vellore"
                    value={newCall.drop}
                    onChange={(e) => setNewCall({ ...newCall, drop: e.target.value })}
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
                    value={newCall.travelDate}
                    onChange={(e) => setNewCall({ ...newCall, travelDate: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-m3-on-surface mb-1">Vehicle Category</label>
                  <select
                    value={newCall.vehicle}
                    onChange={(e) => setNewCall({ ...newCall, vehicle: e.target.value })}
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
                    value={newCall.fare}
                    onChange={(e) => setNewCall({ ...newCall, fare: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low font-bold text-xs text-m3-on-surface focus:border-m3-primary focus:bg-m3-surface-container-lowest font-mono-code"
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
                      onClick={() => setNewCall({ ...newCall, source: s.id })}
                      className={`p-2 rounded-m3-sm border text-center font-semibold text-[11px] transition-colors ${
                        newCall.source === s.id
                          ? 'bg-m3-secondary-container text-m3-on-secondary-container border-0'
                          : 'bg-m3-surface-container-low text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-m3-outline-variant/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="submit"
                  className="h-10 px-4 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-m3-full font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px]">send</span>
                  <span>1. Save & Send WhatsApp Quote</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickConfirmBooking}
                  className="h-10 px-4 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full font-semibold text-xs flex items-center justify-center gap-1.5 shadow-m3-1 transition-all"
                >
                  <span className="material-symbols-outlined text-[17px]">verified</span>
                  <span>2. ₹500 Advance Received (Confirm Trip)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Customer Contact Required to Move Enquiry to Active Trips */}
      {convertModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-2xl shadow-m3-4 w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-m3-outline-variant/70 bg-m3-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">person_check</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-m3-on-surface">Customer Contact Details Required</h3>
                  <p className="text-xs text-m3-on-surface-variant">Name and 10-digit mobile number are required before moving to Active Trips</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalLead(null)}
                className="w-8 h-8 rounded-full hover:bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface-variant font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmLeadConvert} className="p-5 overflow-y-auto space-y-4">
              {/* Lead Summary */}
              <div className="p-3 bg-m3-surface-container-low rounded-m3-lg border border-m3-outline-variant/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono-code font-bold bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant px-2 py-0.5 rounded-full">
                    {convertModalLead.quoteId}
                  </span>
                  <div className="text-xs font-bold text-m3-on-surface mt-1">
                    {convertModalLead.pickup} ➔ {convertModalLead.drop}
                  </div>
                  <div className="text-[11px] text-m3-on-surface-variant">
                    🚗 {convertModalLead.vehicle}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-m3-on-surface font-mono-code">
                    ₹{Number(convertModalLead.estimatedFare || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-m3-on-surface-variant font-semibold">Total Fare</span>
                </div>
              </div>

              {convertError && (
                <div className="p-2.5 bg-m3-error-container text-m3-on-error-container border border-m3-error/20 rounded-m3-md text-xs font-bold flex items-center gap-1.5 animate-shake">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{convertError}</span>
                </div>
              )}

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-m3-on-surface mb-1 flex items-center justify-between">
                  <span>Customer Name <span className="text-m3-error">*</span></span>
                  <span className="text-[10px] text-m3-on-surface-variant font-normal">Real passenger name</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Ramesh Kumar"
                  value={convertForm.guestName}
                  onChange={(e) => {
                    setConvertForm({ ...convertForm, guestName: e.target.value });
                    if (convertError) setConvertError('');
                  }}
                  className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low text-xs font-bold text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                />
              </div>

              {/* 10-digit Phone */}
              <div>
                <label className="block text-xs font-bold text-m3-on-surface mb-1 flex items-center justify-between">
                  <span>Mobile Number <span className="text-m3-error">*</span></span>
                  <span className="text-[10px] text-m3-on-surface-variant font-normal">10 digits starting with 6-9</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-m3-on-surface-variant">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98401 23456"
                    value={convertForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setConvertForm({ ...convertForm, phone: val });
                      if (convertError) setConvertError('');
                    }}
                    className="w-full pl-12 pr-3 py-2.5 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low text-xs font-bold text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary font-mono-code"
                  />
                </div>
              </div>

              {/* Schedule & Advance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-m3-on-surface mb-1">
                    Pickup Schedule
                  </label>
                  <input
                    type="text"
                    value={convertForm.travelDateTime}
                    onChange={(e) => setConvertForm({ ...convertForm, travelDateTime: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-white text-xs font-medium text-m3-on-surface"
                    placeholder="e.g. Tomorrow @ 05:00 AM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-m3-on-surface mb-1">
                    Advance Paid (₹)
                  </label>
                  <input
                    type="number"
                    value={convertForm.advancePaid}
                    onChange={(e) => setConvertForm({ ...convertForm, advancePaid: e.target.value })}
                    className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-white text-xs font-bold text-m3-on-surface font-mono-code"
                    placeholder="500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-m3-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setConvertModalLead(null)}
                  className="px-4 py-2 rounded-full border border-m3-outline-variant text-xs font-bold text-m3-on-surface-variant hover:bg-m3-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-m3-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs font-semibold shadow-m3-1 flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Confirm & Move to Active Trips (Step 2)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
