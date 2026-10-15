import React, { useState } from 'react';

const SAMPLE_CHIPS = [
  'Need Innova tomorrow 5 AM from Medavakkam to Tirupati 6 people',
  'Sedan round trip to Pondicherry from Velachery this Saturday 3 pax',
  'Dzire airport drop tomorrow morning 4:30 AM from Adyar Rajesh 9840122334',
  'Ertiga 6 pax Chennai to Thiruvannamalai round trip Sunday 6am'
];

export default function AiBookingParser({ onBookingCreated, showToast }) {
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl">psychology</span>
          <h2 className="text-sm font-bold tracking-wide uppercase">AI Smart Booking Parser & 1-Tap Quoter</h2>
        </div>
        <span className="text-xs bg-amber-700/60 px-2 py-0.5 rounded-full font-medium">Solo Operator Copilot</span>
      </div>

      <div className="p-4 sm:p-5">
        <label htmlFor="ai-inquiry-input" className="block text-xs font-semibold text-slate-600 mb-1.5">
          Paste Raw Customer WhatsApp Message or Voice Transcript:
        </label>
        <div className="relative">
          <textarea
            id="ai-inquiry-input"
            rows={2}
            className="w-full text-sm rounded-xl border border-slate-300 p-3 pr-24 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none bg-slate-50 placeholder-slate-400 font-sans"
            placeholder="e.g. 'Tomorrow 5 AM Innova to Tirupati from Velachery 6 people how much?'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            type="button"
            onClick={() => handleParse()}
            disabled={parsing || !inputText.trim()}
            className="absolute right-2 bottom-3 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
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
          <span className="text-[11px] font-semibold text-slate-400">Quick Test:</span>
          {SAMPLE_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(chip);
                handleParse(chip);
              }}
              className="text-[11px] bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 px-2.5 py-1 rounded-md border border-slate-200 transition-colors truncate max-w-[200px] sm:max-w-none text-left"
            >
              {chip.slice(0, 32)}...
            </button>
          ))}
        </div>

        {/* Extracted Result Card */}
        {parsedData && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">verified</span>
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">Extracted Trip Details</span>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Estimated: Rs. {parsedData.estimatedFare.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Guest</span>
                <span className="font-bold text-slate-800">{parsedData.guestName}</span>
                {parsedData.phone && <span className="block text-slate-500 text-[11px] font-mono">{parsedData.phone}</span>}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Route & Type</span>
                <span className="font-bold text-slate-800 truncate block">{parsedData.pickup} ➔ {parsedData.drop}</span>
                <span className="text-slate-500 text-[11px]">{parsedData.tripType} (~{parsedData.distanceKm} km)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date & Time</span>
                <span className="font-bold text-slate-800">{parsedData.travelDate}</span>
                <span className="text-slate-500 text-[11px] block">{parsedData.pickupTime}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vehicle & Pax</span>
                <span className="font-bold text-slate-800">{parsedData.vehicleCategory}</span>
                <span className="text-slate-500 text-[11px] block">{parsedData.partySize}</span>
              </div>
            </div>

            {/* Financial breakdown pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-white/80 border border-amber-200 text-xs text-slate-700 mb-3">
              <span>Driver Payout: <strong className="text-slate-900 font-mono">Rs.{parsedData.chauffeurPayout}</strong></span>
              <span>Your Margin: <strong className="text-emerald-700 font-mono">Rs.{parsedData.companyMargin}</strong></span>
              <span>Token Deposit: <strong className="text-amber-700 font-mono">Rs.{parsedData.advanceSuggested}</strong></span>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Send via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyQuote}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'done' : 'content_copy'}</span>
                <span>{copied ? 'Copied!' : 'Copy Quote'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAsBooking}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-sm">bookmark_add</span>
                <span>Save to Bookings</span>
              </button>

              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="px-2.5 py-2 text-slate-400 hover:text-slate-600 text-xs"
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
