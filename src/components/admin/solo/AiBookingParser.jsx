import React, { useState } from 'react';

const SAMPLE_CHIPS = [
  'Need Innova tomorrow 5 AM from Medavakkam to Tirupati 6 people',
  'Sedan round trip to Pondicherry from Velachery this Saturday 3 pax',
  'Dzire airport drop tomorrow morning 4:30 AM from Adyar Rajesh 9840122334',
  'Ertiga 6 pax Chennai to Thiruvannamalai round trip Sunday 6am'
];

export default function AiBookingParser({ onBookingCreated, showToast, onClose }) {
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleParse = async (textToParse) => {
    const text = textToParse || inputText;
    if (!text.trim()) {
      showToast?.('Please enter or paste a message to parse', 'error');
      return;
    }

    setParsing(true);
    setCopied(false);
    try {
      const res = await fetch('/api/admin/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setParsedData(data.parsed);
        showToast?.('AI successfully extracted trip details!', 'success');
      } else {
        showToast?.(data.error || 'Failed to parse text', 'error');
      }
    } catch (err) {
      showToast?.('Network error during AI parse', 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleCopyQuote = () => {
    if (!parsedData?.whatsAppQuote) return;
    navigator.clipboard.writeText(parsedData.whatsAppQuote);
    setCopied(true);
    showToast?.('Quotation copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    if (!parsedData) return;
    const cleanPhone = (parsedData.phone || '').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(parsedData.whatsAppQuote);
    const url = cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone.slice(-10)}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleSaveAsBooking = async () => {
    if (!parsedData) return;
    try {
      const payload = {
        name: parsedData.guestName,
        phone: parsedData.phone || '9840100000',
        pickupDate: parsedData.travelDate,
        pickupTime: parsedData.pickupTime,
        pickupAddress: `${parsedData.pickup} ➔ ${parsedData.drop} (${parsedData.tripType})`,
        vehicleCategory: parsedData.vehicleCategory,
        partySize: parsedData.partySize,
        terminalFare: parsedData.estimatedFare,
        chauffeurPayout: parsedData.chauffeurPayout,
        manifestStatus: 'Pending',
        financialClosure: 'Unreconciled'
      };

      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast?.(`Booking ${resData.bookingId} created successfully!`, 'success');
        if (onBookingCreated) {
          onBookingCreated({
            bookingId: resData.bookingId,
            guestNamePhone: `${payload.name} (${payload.phone})`,
            travelDateTime: `${payload.pickupDate} @ ${payload.pickupTime}`,
            pickupAddress: payload.pickupAddress,
            vehicleCategory: payload.vehicleCategory,
            partySize: payload.partySize,
            kycStatus: 'Pending',
            darshanStatus: 'Unassigned',
            assignedChauffeur: 'Unassigned',
            manifestStatus: 'Pending',
            terminalFare: payload.terminalFare,
            chauffeurPayout: payload.chauffeurPayout,
            companyMargin: payload.terminalFare - payload.chauffeurPayout,
            financialClosure: 'Unreconciled'
          });
        }
        setParsedData(null);
        setInputText('');
      } else {
        showToast?.(resData.error || 'Failed to save booking', 'error');
      }
    } catch (e) {
      showToast?.('Error saving booking', 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-m3-outline-variant overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-m3-tertiary to-m3-tertiary px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl">psychology</span>
          <h2 className="text-sm font-bold tracking-wide uppercase">AI Smart Booking Parser & 1-Tap Quoter</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">Solo Operator Copilot</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors"
              title="Close Parser"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <label htmlFor="ai-inquiry-input" className="block text-xs font-semibold text-m3-on-surface-variant mb-1.5">
          Paste Raw Customer WhatsApp Message or Voice Transcript:
        </label>
        <div className="relative">
          <textarea
            id="ai-inquiry-input"
            rows={2}
            className="w-full text-sm rounded-xl border border-m3-outline-variant p-3 pr-24 focus:outline-none focus:ring-2 focus:ring-m3-tertiary focus:border-transparent resize-none bg-m3-surface-container-low placeholder-slate-400 font-sans"
            placeholder="e.g. 'Tomorrow 5 AM Innova to Tirupati from Velachery 6 people how much?'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            type="button"
            onClick={() => handleParse()}
            disabled={parsing || !inputText.trim()}
            className="absolute right-2 bottom-3 px-3 py-1.5 bg-m3-tertiary-container/300 hover:bg-m3-tertiary disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
          >
            {parsing ? (
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
            )}
            <span>{parsing ? 'Parsing...' : 'AI Extract'}</span>
          </button>
        </div>

        {/* Quick Sample Chips */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-m3-outline-variant">Quick Test:</span>
          {SAMPLE_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(chip);
                handleParse(chip);
              }}
              className="text-[11px] bg-m3-surface-container hover:bg-m3-tertiary-container/30 text-m3-on-surface-variant hover:text-m3-tertiary px-2.5 py-1 rounded-md border border-m3-outline-variant transition-colors truncate max-w-[200px] sm:max-w-none text-left"
            >
              {chip.slice(0, 32)}...
            </button>
          ))}
        </div>

        {/* Extracted Result Card */}
        {parsedData && (
          <div className="mt-4 p-4 rounded-xl bg-m3-tertiary-container/30/70 border border-m3-tertiary/30 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-m3-tertiary/30/80 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-tertiary">verified</span>
                <span className="text-xs font-bold text-m3-on-tertiary-container uppercase tracking-wide">Extracted Trip Details</span>
              </div>
              <span className="text-xs bg-m3-success-container/70 text-m3-on-success-container font-bold px-2 py-0.5 rounded-full">
                Estimated: Rs. {parsedData.estimatedFare.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
              <div>
                <span className="text-m3-outline-variant block text-[10px] uppercase font-semibold">Guest</span>
                <span className="font-bold text-m3-on-surface">{parsedData.guestName}</span>
                {parsedData.phone && <span className="block text-m3-outline text-[11px] font-mono">{parsedData.phone}</span>}
              </div>
              <div>
                <span className="text-m3-outline-variant block text-[10px] uppercase font-semibold">Route & Type</span>
                <span className="font-bold text-m3-on-surface truncate block">{parsedData.pickup} ➔ {parsedData.drop}</span>
                <span className="text-m3-outline text-[11px]">{parsedData.tripType} (~{parsedData.distanceKm} km)</span>
              </div>
              <div>
                <span className="text-m3-outline-variant block text-[10px] uppercase font-semibold">Date & Time</span>
                <span className="font-bold text-m3-on-surface">{parsedData.travelDate}</span>
                <span className="text-m3-outline text-[11px] block">{parsedData.pickupTime}</span>
              </div>
              <div>
                <span className="text-m3-outline-variant block text-[10px] uppercase font-semibold">Vehicle & Pax</span>
                <span className="font-bold text-m3-on-surface">{parsedData.vehicleCategory}</span>
                <span className="text-m3-outline text-[11px] block">{parsedData.partySize}</span>
              </div>
            </div>

            {/* Financial breakdown pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-white/80 border border-m3-tertiary/30 text-xs text-m3-on-surface-variant mb-3">
              <span>Driver Payout: <strong className="text-m3-on-surface font-mono">Rs.{parsedData.chauffeurPayout}</strong></span>
              <span>Your Margin: <strong className="text-m3-success font-mono">Rs.{parsedData.companyMargin}</strong></span>
              <span>Token Deposit: <strong className="text-m3-tertiary font-mono">Rs.{parsedData.advanceSuggested}</strong></span>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 sm:flex-none px-4 py-2 bg-m3-success hover:bg-m3-success text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Send via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyQuote}
                className="px-3 py-2 bg-white hover:bg-m3-surface-container-low text-m3-on-surface-variant border border-m3-outline-variant rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'done' : 'content_copy'}</span>
                <span>{copied ? 'Copied!' : 'Copy Quote'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAsBooking}
                className="flex-1 sm:flex-none px-4 py-2 bg-m3-inverse-surface hover:bg-m3-surface-container-high text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-sm">bookmark_add</span>
                <span>Save to Bookings</span>
              </button>

              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="px-2.5 py-2 text-m3-outline-variant hover:text-m3-on-surface-variant text-xs"
                title="Discard"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
