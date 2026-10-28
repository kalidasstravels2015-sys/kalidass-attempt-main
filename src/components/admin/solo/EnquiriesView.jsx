import React, { useState, useMemo } from 'react';
import { validateCustomerContact, extractValidMobile, isPlaceholderCustomerName, isActionableLead, deduplicateCalculatorQuotes } from '../../../utils/bookingContactValidator';
import { getOrderedEnquiryId, getNextBookingId, isSequentialId } from '../../../utils/sequenceGenerator';
import { formatCleanDateTime, formatFriendlyTravelDateTime, cleanLocationName } from '../../../utils/dateFormatter';
import QuickBookingModal from './QuickBookingModal';

/**
 * EnquiriesView - Step 1: Inbound Customer Calls & Quotes
 * Clean, fast, zero-clutter interface for managing new inquiries,
 * sending WhatsApp quotes, and confirming bookings into Active Trips.
 */
export default function EnquiriesView({
  leads = [],
  bookings = [],
  calculatorQuotes = [],
  onNavigateToRadar,
  onAddManualLead,
  onConvertToConfirmed,
  onDeleteLead,
  onUpdateLead,
  onOpenQuickBooking,
  showToast
}) {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [showNewCallModal, setShowNewCallModal] = useState(false);

  // Modal State: Convert Enquiry to Active Trip when Phone is missing
  const [convertModalLead, setConvertModalLead] = useState(null);
  const [convertForm, setConvertForm] = useState({
    guestName: '',
    phone: '',
    travelDateTime: '',
    advancePaid: '500'
  });
  const [convertError, setConvertError] = useState('');

  // Modal State: Quick Edit Enquiry
  const [editModalLead, setEditModalLead] = useState(null);
  const [editForm, setEditForm] = useState({
    guestName: '',
    phone: '',
    pickup: '',
    drop: '',
    vehicle: '',
    travelDate: '',
    tripType: '',
    estimatedFare: '',
    notes: ''
  });

  const extractPhone = (item) => {
    const combined = `${item.phone || ''} ${item.sourcePage || ''} ${item.pickup || ''} ${item.guestName || ''} ${item.metadata || ''}`;
    const match = combined.match(/[6-9]\d{9}/);
    return match ? match[0] : '';
  };

  const validLeads = useMemo(
    () => leads.filter(isActionableLead),
    [leads]
  );

  const validVisitorQuotes = useMemo(
    () => deduplicateCalculatorQuotes(calculatorQuotes),
    [calculatorQuotes]
  );

  const baseList = useMemo(() => {
    if (sourceFilter === 'VISITORS') {
      return validVisitorQuotes;
    }
    return validLeads;
  }, [sourceFilter, validVisitorQuotes, validLeads]);

  const filteredLeads = useMemo(() => {
    return baseList.filter(l => {
      const q = search.toLowerCase().trim();
      const combined = `${l.guestName || ''} ${l.phone || ''} ${l.pickup || ''} ${l.drop || ''} ${l.vehicle || ''} ${l.quoteId || ''} ${l.sourcePage || ''} ${l.tripType || ''} ${l.notes || ''}`.toLowerCase();
      if (q && !combined.includes(q)) return false;

      if (sourceFilter === 'WHATSAPP') {
        return (l.quoteId || '').startsWith('#WA') || combined.includes('whatsapp');
      }
      if (sourceFilter === 'PHONE') {
        return combined.includes('phone') || combined.includes('call') || combined.includes('direct');
      }
      return true;
    });
  }, [baseList, search, sourceFilter]);

  // Send WhatsApp Quote (English)
  const handleSendQuoteWA = (lead) => {
    const cleanPhone = extractPhone(lead);
    const fare = Number(lead.estimatedFare) || 0;
    const pkg = lead.tripType || 'Cab Booking';
    const pickup = cleanLocationName(lead.pickup) || 'Chennai';
    const drop = cleanLocationName(lead.drop) || 'Destination';
    const guestName = lead.guestName && !isPlaceholderCustomerName(lead.guestName) ? lead.guestName.split('(')[0].trim() : 'Sir/Madam';
    const vehicle = lead.vehicle || 'AC Cab';
    const travelDate = lead.travelDate && lead.travelDate !== 'Departure date pending' ? lead.travelDate : 'As per schedule';

    const msg =
      `🚕 *KALIDASS TRAVELS — TRIP QUOTE*\n\n` +
      `• Customer: ${guestName}\n` +
      `• Trip: ${pkg}\n` +
      `• Route: ${pickup} ➔ ${drop}\n` +
      `• Vehicle: ${vehicle}\n` +
      (fare > 0 ? `• Estimated Fare: ₹${fare.toLocaleString('en-IN')}\n` : '') +
      `• Date: ${travelDate}\n` +
      (lead.notes ? `• Details: ${lead.notes}\n` : '') +
      `\n🔒 *To Confirm Booking:*\n` +
      `• Pay Advance via UPI: *8939539211@okbizaxis* (Kalidass Travels)\n` +
      `📞 24/7 Helpline: +91 89395 39211`;

    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.(`WhatsApp quote opened for ${guestName}!`, 'success');
  };

  // Send WhatsApp Quote (Tamil)
  const handleSendQuoteTamilWA = (lead) => {
    const cleanPhone = extractPhone(lead);
    const fare = Number(lead.estimatedFare) || 0;
    const pkg = lead.tripType || 'பயணம்';
    const pickup = cleanLocationName(lead.pickup) || 'சென்னை';
    const drop = cleanLocationName(lead.drop) || 'இடம்';
    const guestName = lead.guestName && !isPlaceholderCustomerName(lead.guestName) ? lead.guestName.split('(')[0].trim() : 'வணக்கம்';
    const vehicle = lead.vehicle || 'AC கார்';
    const travelDate = lead.travelDate && lead.travelDate !== 'Departure date pending' ? lead.travelDate : 'திட்டமிட்டபடி';

    const msg =
      `வணக்கம் ${guestName}! 🙏\n` +
      `*காளிதாஸ் டிராவல்ஸ் (சென்னை) — பயண விபரம்*\n\n` +
      `• *பயணம்:* ${pkg}\n` +
      `• *பாதை:* ${pickup} ➔ ${drop}\n` +
      `• *வாகனம்:* ${vehicle}\n` +
      (fare > 0 ? `• *கட்டணம்:* ₹${fare.toLocaleString('en-IN')}\n` : '') +
      `• *பயண நாள்:* ${travelDate}\n\n` +
      `🔒 *முன்பதிவை உறுதி செய்ய:*\n` +
      `• UPI ID: *8939539211@okbizaxis* (Kalidass Travels)\n` +
      `📞 24/7 உதவி எண்: +91 89395 39211. நன்றி!`;

    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.(`தமிழ் மேற்கோள் வாட்ஸ்அப்பில் திறக்கப்பட்டது!`, 'success');
  };

  // Confirm Enquiry ➔ Move to Active Trips
  const handleLockLeadWithAdvance = (lead) => {
    const cleanPhone = extractValidMobile(lead);
    const guestLabel = lead.guestName && !isPlaceholderCustomerName(lead.guestName)
      ? lead.guestName.split('(')[0].trim()
      : 'Customer';

    const validation = validateCustomerContact(guestLabel, cleanPhone);

    // If 10-digit phone is missing, open small modal to enter phone & advance
    if (!validation.isValid) {
      setConvertModalLead(lead);
      setConvertForm({
        guestName: guestLabel !== 'Customer' ? guestLabel : '',
        phone: cleanPhone || '',
        travelDateTime: formatFriendlyTravelDateTime(lead.travelDate),
        advancePaid: '500'
      });
      setConvertError(validation.error);
      return;
    }

    const fare = Number(lead.estimatedFare) || 0;
    const adv = 500;
    const driverShare = Math.round(fare * 0.82);
    const cleanFrom = cleanLocationName(lead.pickup) || 'Chennai';
    const cleanTo = cleanLocationName(lead.drop) || 'Outstation';
    const routeLabel = lead.pickup && lead.pickup.includes('+91') ? cleanTo : `${cleanFrom} ➔ ${cleanTo}`;

    const confirmed = {
      bookingId: (lead.quoteId && isSequentialId(lead.quoteId)) ? lead.quoteId.replace('#ENQ-', '#KT-BK-').replace('#QT-', '#KT-BK-') : getNextBookingId(bookings),
      guestNamePhone: validation.formattedGuestNamePhone,
      travelDateTime: formatFriendlyTravelDateTime(lead.travelDate),
      pickupAddress: routeLabel,
      vehicleCategory: lead.vehicle || 'Sedan (Dzire / Etios)',
      partySize: '4 Seats',
      kycStatus: `Advance Paid: ₹${adv}`,
      darshanStatus: lead.tripType || 'Round Trip',
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Need Driver',
      terminalFare: fare,
      chauffeurPayout: driverShare,
      companyMargin: Math.max(0, fare - driverShare),
      advancePaid: adv,
      balanceDue: Math.max(0, fare - adv),
      financialClosure: 'Unreconciled',
      reviewStatus: 'Pending',
      notes: lead.notes || ''
    };

    onConvertToConfirmed?.(confirmed, lead.quoteId);
    showToast?.(`✅ Booking ${confirmed.bookingId} moved to Active Trips!`, 'success');
  };

  // Submit modal when entering missing customer phone/advance for an enquiry
  const handleConfirmLeadConvert = (e) => {
    e?.preventDefault?.();
    if (!convertModalLead) return;

    const validation = validateCustomerContact(convertForm.guestName || 'Customer', convertForm.phone);
    if (!validation.isValid) {
      setConvertError(validation.error);
      showToast?.(validation.error, 'error');
      return;
    }

    const fare = Number(convertModalLead.estimatedFare) || 0;
    const adv = Number(convertForm.advancePaid) || 0;
    const driverShare = Math.round(fare * 0.82);
    const cleanFrom = cleanLocationName(convertModalLead.pickup) || 'Chennai';
    const cleanTo = cleanLocationName(convertModalLead.drop) || 'Outstation';
    const routeLabel = convertModalLead.pickup && convertModalLead.pickup.includes('+91') ? cleanTo : `${cleanFrom} ➔ ${cleanTo}`;

    const confirmed = {
      bookingId: (convertModalLead.quoteId && isSequentialId(convertModalLead.quoteId)) ? convertModalLead.quoteId.replace('#ENQ-', '#KT-BK-').replace('#QT-', '#KT-BK-') : getNextBookingId(bookings),
      guestNamePhone: validation.formattedGuestNamePhone,
      travelDateTime: convertForm.travelDateTime.trim() || 'Tomorrow @ 06:00 AM',
      pickupAddress: routeLabel,
      vehicleCategory: convertModalLead.vehicle || 'Sedan (Dzire / Etios)',
      partySize: '4 Seats',
      kycStatus: adv > 0 ? `Advance Paid: ₹${adv}` : 'Confirmed',
      darshanStatus: convertModalLead.tripType || 'Round Trip',
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Need Driver',
      terminalFare: fare,
      chauffeurPayout: driverShare,
      companyMargin: Math.max(0, fare - driverShare),
      advancePaid: adv,
      balanceDue: Math.max(0, fare - adv),
      financialClosure: 'Unreconciled',
      reviewStatus: 'Pending',
      notes: convertModalLead.notes || ''
    };

    onConvertToConfirmed?.(confirmed, convertModalLead.quoteId);
    showToast?.(`✅ Booking ${confirmed.bookingId} confirmed for ${validation.cleanName}!`, 'success');
    setConvertModalLead(null);
  };

  const handleOpenEditModal = (lead) => {
    setEditModalLead(lead);
    setEditForm({
      guestName: lead.guestName || '',
      phone: extractPhone(lead) || '',
      pickup: cleanLocationName(lead.pickup) || 'Chennai',
      drop: cleanLocationName(lead.drop) || '',
      vehicle: lead.vehicle || 'Sedan (Dzire / Etios)',
      travelDate: lead.travelDate || '',
      tripType: lead.tripType || 'Round Trip',
      estimatedFare: lead.estimatedFare || '',
      notes: lead.notes || ''
    });
  };

  const handleSaveEditLead = (e) => {
    e?.preventDefault?.();
    if (!editModalLead) return;
    const cleanPhone = editForm.phone.replace(/[^0-9]/g, '').slice(-10);
    const updated = {
      ...editModalLead,
      guestName: editForm.guestName.trim() || 'Customer',
      phone: cleanPhone,
      sourcePage: cleanPhone ? `Direct Call (+91 ${cleanPhone})` : editModalLead.sourcePage,
      pickup: editForm.pickup.trim() || 'Chennai',
      drop: editForm.drop.trim() || 'Outstation',
      vehicle: editForm.vehicle,
      travelDate: editForm.travelDate,
      tripType: editForm.tripType,
      estimatedFare: Number(editForm.estimatedFare) || 0,
      notes: editForm.notes
    };
    onUpdateLead?.(updated);
    setEditModalLead(null);
  };

  return (
    <>
      <div className="space-y-4 animate-fadeIn">
        {/* Page Header Bar */}
        <div className="bg-m3-surface-container-lowest p-4 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-m3-primary"></span>
              <h2 className="text-m3-title-m font-bold text-m3-on-surface">
                1. Enquiries & Quick Booking Desk
              </h2>
              <span className="text-xs font-semibold bg-m3-primary-container text-m3-on-primary-container px-2.5 py-0.5 rounded-full">
                {validLeads.length} Enquiries
              </span>
            </div>
            <p className="text-xs text-m3-on-surface-variant mt-0.5">
              Add a customer call or WhatsApp order in 1 minute, send quote, or move directly to Active Trips.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenQuickBooking) {
                  onOpenQuickBooking();
                } else {
                  setShowNewCallModal(true);
                }
              }}
              className="h-10 px-5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-xs font-bold flex items-center gap-2 shadow-m3-1 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_call</span>
              <span>+ Quick Add Booking / Enquiry</span>
            </button>
          </div>
        </div>

        {/* Search & Simple Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-1">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2 text-m3-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, mobile number, or destination..."
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
              { id: 'ALL', label: `All Enquiries (${validLeads.length})` },
              { id: 'VISITORS', label: `🌐 Website Calculations (${validVisitorQuotes.length})` }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSourceFilter(f.id)}
                className={`h-8 px-3 rounded-m3-sm text-xs font-semibold transition-colors cursor-pointer ${
                  sourceFilter === f.id
                    ? 'bg-m3-secondary-container text-m3-on-secondary-container border-0 font-bold'
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
              Click below to quickly add a phone or WhatsApp booking/enquiry in under 1 minute.
            </p>
            <button
              type="button"
              onClick={() => {
                if (onOpenQuickBooking) {
                  onOpenQuickBooking();
                } else {
                  setShowNewCallModal(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add_call</span>
              <span>+ Quick Add Booking / Enquiry</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLeads.map((lead, idx) => {
              const phone = extractPhone(lead);
              const targetId = lead.quoteId || getOrderedEnquiryId(lead, idx, filteredLeads.length);

              return (
                <div
                  key={targetId + '_' + idx}
                  className="p-4 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/80 shadow-m3-1 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 hover:border-m3-outline transition-all"
                >
                  {/* Left: Customer & Route Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-code text-xs font-bold bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant/70 px-2.5 py-0.5 rounded-full">
                        {getOrderedEnquiryId(lead, idx, filteredLeads.length)}
                      </span>

                      <span className="text-sm font-bold text-m3-on-surface">
                        👤 {lead.guestName || 'Customer'}
                      </span>

                      {phone && (
                        <a
                          href={`tel:+91${phone}`}
                          className="text-xs font-mono-code font-bold text-m3-primary hover:underline bg-m3-secondary-container/60 px-2.5 py-0.5 rounded-full flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">call</span>
                          <span>+91 {phone}</span>
                        </a>
                      )}

                      {lead.timestamp && (
                        <span className="text-[11px] text-m3-outline font-mono-code">
                          • {formatCleanDateTime(lead.timestamp)}
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-bold text-m3-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-m3-primary text-[17px] shrink-0">near_me</span>
                      <span>{cleanLocationName(lead.pickup)} ➔ {cleanLocationName(lead.drop)}</span>
                    </div>

                    <div className="text-xs text-m3-on-surface-variant flex flex-wrap items-center gap-2 font-medium">
                      <span>🚗 {lead.vehicle || 'Sedan'}</span>
                      <span>•</span>
                      <span className="font-semibold text-m3-on-surface">
                        {lead.tripType || 'Round Trip'}
                      </span>
                      {lead.travelDate && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-m3-primary">
                            🗓️ {formatFriendlyTravelDateTime(lead.travelDate)}
                          </span>
                        </>
                      )}
                    </div>

                    {lead.notes && (
                      <div className="text-xs text-m3-on-surface-variant bg-m3-surface-container-low px-2.5 py-1 rounded-m3-md border border-m3-outline-variant/40">
                        📝 {lead.notes}
                      </div>
                    )}
                  </div>

                  {/* Right: Fare & Clean Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-m3-outline-variant/50">
                    <div className="text-left lg:text-right mr-2">
                      <span className="text-base font-black font-mono-code text-m3-on-surface block leading-tight">
                        {Number(lead.estimatedFare || 0) > 0
                          ? `₹${Number(lead.estimatedFare).toLocaleString('en-IN')}`
                          : 'Rate TBD'}
                      </span>
                      <span className="text-[11px] text-m3-on-surface-variant font-medium">Quoted Fare</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {phone && (
                        <a
                          href={`tel:+91${phone}`}
                          className="h-9 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-m3-full text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">call</span>
                          <span>Call</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSendQuoteWA(lead)}
                        className="h-9 px-3 bg-m3-surface-container-low hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">chat</span>
                        <span>WA Quote</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendQuoteTamilWA(lead)}
                        className="h-9 px-2.5 bg-m3-surface-container-low hover:bg-m3-surface-container-high text-emerald-800 border border-emerald-500/40 rounded-m3-full text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>தமிழ்</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(lead)}
                        className="h-9 px-2.5 bg-m3-surface-container-low hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant rounded-m3-full text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Edit enquiry"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLockLeadWithAdvance(lead)}
                        className="h-9 px-4 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-m3-full text-xs font-bold flex items-center gap-1.5 shadow-m3-1 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Confirm Booking</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete enquiry ${targetId}?`)) {
                            onDeleteLead?.(targetId);
                          }
                        }}
                        className="h-9 px-2.5 text-m3-error hover:bg-m3-error-container/30 border border-m3-error/30 rounded-m3-full text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete enquiry"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Booking / Enquiry Modal */}
      <QuickBookingModal
        isOpen={showNewCallModal}
        onClose={() => setShowNewCallModal(false)}
        existingLeads={leads}
        existingBookings={bookings}
        onSaveLead={(newLead) => {
          onAddManualLead?.(newLead);
          setShowNewCallModal(false);
        }}
        onConfirmBooking={(newBooking) => {
          onConvertToConfirmed?.(newBooking);
          setShowNewCallModal(false);
        }}
        showToast={showToast}
      />

      {/* Modal: Enter Phone & Advance when converting an enquiry that had no phone */}
      {convertModalLead && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">verified</span>
                <h3 className="text-sm font-bold">Confirm Booking ➔ Active Trips</h3>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalLead(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmLeadConvert} className="p-4 space-y-3 text-xs">
              {convertError && (
                <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-bold">
                  {convertError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Mobile Number (10 Digits) <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  autoFocus
                  maxLength={10}
                  placeholder="99446 49858"
                  value={convertForm.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                    setConvertForm({ ...convertForm, phone: val });
                    if (convertError) setConvertError('');
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono-code font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Customer"
                  value={convertForm.guestName}
                  onChange={(e) => setConvertForm({ ...convertForm, guestName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Travel Date & Time</label>
                  <input
                    type="text"
                    value={convertForm.travelDateTime}
                    onChange={(e) => setConvertForm({ ...convertForm, travelDateTime: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Advance Paid (₹)</label>
                  <input
                    type="number"
                    value={convertForm.advancePaid}
                    onChange={(e) => setConvertForm({ ...convertForm, advancePaid: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono-code font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setConvertModalLead(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Confirm & Move to Active Trips
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Edit Enquiry */}
      {editModalLead && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Edit Enquiry ({editModalLead.quoteId})</h3>
              <button
                type="button"
                onClick={() => setEditModalLead(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditLead} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editForm.guestName}
                    onChange={(e) => setEditForm({ ...editForm, guestName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono-code font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pickup (From)</label>
                  <input
                    type="text"
                    value={editForm.pickup}
                    onChange={(e) => setEditForm({ ...editForm, pickup: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drop (To)</label>
                  <input
                    type="text"
                    value={editForm.drop}
                    onChange={(e) => setEditForm({ ...editForm, drop: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Travel Date</label>
                  <input
                    type="text"
                    value={editForm.travelDate}
                    onChange={(e) => setEditForm({ ...editForm, travelDate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle</label>
                  <input
                    type="text"
                    value={editForm.vehicle}
                    onChange={(e) => setEditForm({ ...editForm, vehicle: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quoted Fare (₹)</label>
                  <input
                    type="number"
                    value={editForm.estimatedFare}
                    onChange={(e) => setEditForm({ ...editForm, estimatedFare: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono-code font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModalLead(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
