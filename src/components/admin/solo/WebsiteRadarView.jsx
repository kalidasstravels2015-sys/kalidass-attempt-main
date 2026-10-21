import React, { useState, useMemo } from 'react';
import { buildMapsBlock } from '../../../utils/whatsapp';

/**
 * WebsiteRadarView - Left Sidebar View
 * Live stream of fares calculated by website visitors.
 * Completely separate from Step 1: Customer Enquiries, because browsing visitors have not contacted us yet.
 */
export default function WebsiteRadarView({
  calculatorQuotes = [],
  onConvertToConfirmed,
  showToast
}) {
  const [engineFilter, setEngineFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const validQuotes = useMemo(
    () => (calculatorQuotes || []).filter(q => Number(q.estimatedFare || q.fare || q.estimate || 0) > 0 && !(q.drop || '').toLowerCase().includes('whatsapp chat')),
    [calculatorQuotes]
  );

  const hotQuotesCount = useMemo(
    () => validQuotes.filter(q => (q.status || '').toLowerCase().includes('whatsapp')).length,
    [validQuotes]
  );

  const filteredQuotes = useMemo(() => {
    return validQuotes.filter(q => {
      const query = search.toLowerCase().trim();
      if (query) {
        const combined = `${q.quoteId || ''} ${q.pickup || ''} ${q.drop || ''} ${q.vehicle || ''} ${q.calculatorEngine || ''} ${q.sourcePage || ''}`.toLowerCase();
        if (!combined.includes(query)) return false;
      }

      if (engineFilter === 'ALL') return true;
      if (engineFilter === 'HOT_WA') return (q.status || '').toLowerCase().includes('whatsapp');

      const engine = `${q.calculatorEngine || ''} ${q.sourcePage || ''}`.toLowerCase();
      if (engineFilter === 'AIRPORT') return engine.includes('airport');
      if (engineFilter === 'OUTSTATION') return engine.includes('outstation');
      if (engineFilter === 'TOUR') return engine.includes('tour') || engine.includes('package');
      if (engineFilter === 'DRIVER') return engine.includes('driver') || engine.includes('relocation');

      return true;
    });
  }, [validQuotes, engineFilter, search]);

  // Format outbound quote for WhatsApp if visitor contacts
  const handleSendQuoteWA = (quote) => {
    const fare = Number(quote.estimatedFare) || 0;
    const mapsBlock = buildMapsBlock(quote.pickup, quote.drop, quote.tripType || 'One Way');
    const msg =
      `*KALIDASS TRAVELS CHENNAI — WEBSITE FARE ESTIMATE*\n\n` +
      `Namaskaram!\n` +
      `📍 *Route:* ${quote.pickup} ➔ ${quote.drop}\n` +
      `🚗 *Vehicle:* ${quote.vehicle}\n` +
      `💰 *Estimated Fare:* Rs.${fare.toLocaleString('en-IN')}\n\n` +
      `🔒 *To Confirm Your Cab:*\n` +
      `Transfer *Rs.500 Advance* via UPI to *8939539211@okbizaxis* (Kalidass Travels) to lock your vehicle & driver.\n\n` +
      `📞 24/7 Operations Desk: +91 89395 39211` +
      mapsBlock;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    showToast?.('WhatsApp quote opened!', 'success');
  };

  // Convert Quote to Active Trip if customer calls to confirm
  const handleConvertToBooking = (quote) => {
    const fare = Number(quote.estimatedFare) || 0;
    const driverShare = Math.round(fare * 0.82);

    const newBooking = {
      bookingId: `#KT-${Date.now().toString().slice(-4)}`,
      guestNamePhone: `Website Caller (${quote.quoteId})`,
      travelDateTime: 'Tomorrow @ 05:00 AM',
      pickupAddress: `${quote.pickup} ➔ ${quote.drop}`,
      vehicleCategory: quote.vehicle || 'Sedan (Dzire / Etios)',
      partySize: '4 Pax',
      kycStatus: 'Advance Paid',
      darshanStatus: quote.calculatorEngine || 'Website Calculator',
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

    onConvertToConfirmed?.(newBooking);
    showToast?.(`Converted ${quote.quoteId} into confirmed booking! Check Active Trips.`, 'success');
  };

  return (
    <div className="space-y-4 font-sans animate-fadeIn">
      {/* Top Banner: Clear Separation Explanation */}
      <div className="bg-m3-surface-container-lowest p-4 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-m3-title-m font-black text-emerald-950 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-700">radar</span>
              <span>Website Fare Calculator Radar</span>
            </h2>
            <span className="text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full">
              {validQuotes.length} Live Estimates
            </span>
            {hotQuotesCount > 0 && (
              <span className="text-xs font-black bg-green-100 text-green-900 border border-green-300 px-2 py-0.5 rounded-full animate-bounce">
                🔥 {hotQuotesCount} WhatsApp Clicked
              </span>
            )}
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-1 max-w-2xl">
            Live stream of fares calculated by visitors browsing on your website booking engines (Airport Taxi, Outstation Cabs, Tour Packages, Acting Drivers).
            <span className="font-bold text-amber-900 block mt-0.5">
              ⚠️ Note: These are passive web visitors. They have not contacted you yet. Real customer inquiries who call or message appear in "1. New Enquiries".
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-xs text-m3-on-surface-variant block">Total Calculations Streamed</span>
            <span className="text-lg font-black text-emerald-900 font-mono-code">{validQuotes.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-1">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-m3-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search route, destination, vehicle, or quote ID..."
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-full border border-m3-outline-variant bg-m3-surface-container-lowest focus:ring-2 focus:ring-emerald-600 text-m3-on-surface"
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

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: `All (${validQuotes.length})` },
            { id: 'HOT_WA', label: `🔥 WhatsApp Clicked (${hotQuotesCount})` },
            { id: 'AIRPORT', label: 'Airport Taxi' },
            { id: 'OUTSTATION', label: 'Outstation' },
            { id: 'TOUR', label: 'Tours' },
            { id: 'DRIVER', label: 'Acting Drivers' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setEngineFilter(f.id)}
              className={`h-7 px-2.5 rounded-full text-[11px] font-bold border transition-colors ${
                engineFilter === f.id
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-m3-surface-container-lowest text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-high'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes Cards Feed */}
      {filteredQuotes.length === 0 ? (
        <div className="p-10 text-center bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">radar</span>
          </div>
          <h3 className="text-sm font-bold text-m3-on-surface">No Website Calculations Found</h3>
          <p className="text-xs text-m3-on-surface-variant max-w-md mx-auto">
            {validQuotes.length === 0
              ? 'When visitors calculate estimates on the Chennai Airport Taxi, Outstation Cabs, Tour Packages, or Acting Drivers pages, their calculated fares appear here in real-time.'
              : 'No calculations match the selected filter. Click "All" to view all live engine quotes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredQuotes.map((q, idx) => {
            const isWhatsAppClicked = (q.status || '').toLowerCase().includes('whatsapp');

            return (
              <div
                key={q.quoteId || idx}
                className={`p-4 rounded-m3-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs ${
                  isWhatsAppClicked
                    ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300/60'
                    : 'bg-m3-surface-container-lowest border-m3-outline-variant/80 hover:border-emerald-300'
                }`}
              >
                {/* Left: Quote Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Pill */}
                    {isWhatsAppClicked ? (
                      <span className="text-[11px] font-extrabold bg-green-100 text-green-900 border border-green-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <span className="material-symbols-outlined text-[13px] text-green-700">chat</span>
                        <span>🔥 WhatsApp Clicked (Hot Lead)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-emerald-600">visibility</span>
                        <span>Browsed on Website</span>
                      </span>
                    )}

                    {/* Engine Name */}
                    <span className="text-[11px] font-bold bg-m3-surface-container-high text-m3-on-surface px-2.5 py-0.5 rounded-full border border-m3-outline-variant">
                      {q.calculatorEngine || 'Booking Engine'}
                    </span>

                    {/* Quote ID */}
                    {q.quoteId && (
                      <span className="text-[11px] font-mono-code font-bold bg-white text-m3-on-surface-variant border border-m3-outline-variant px-2 py-0.5 rounded-full">
                        {q.quoteId}
                      </span>
                    )}

                    {/* Timestamp */}
                    <span className="text-[11px] text-m3-outline ml-auto">
                      🕒 {q.timestamp}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="text-sm font-black text-m3-on-surface truncate flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-700 text-[18px]">near_me</span>
                    <span>{q.pickup || 'Chennai'} ➔ {q.drop || 'Destination'}</span>
                  </div>

                  {/* Vehicle, Distance, Source */}
                  <div className="text-xs text-m3-on-surface-variant flex flex-wrap items-center gap-2 font-medium">
                    <span>🚗 {q.vehicle || 'Vehicle'}</span>
                    <span>•</span>
                    <span>{q.tripType || 'One Way'}</span>
                    {q.metadata && q.metadata !== 'None' && (
                      <>
                        <span>•</span>
                        <span className="bg-m3-surface-container px-2 py-0.5 rounded-full text-[11px] font-bold">
                          {q.metadata}
                        </span>
                      </>
                    )}
                    {q.sourcePage && (
                      <>
                        <span>•</span>
                        <span className="text-[11px] text-m3-outline truncate max-w-[220px]" title={q.sourcePage}>
                          📄 {q.sourcePage}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Price & Quick Action */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-m3-outline-variant/50">
                  <div className="text-left lg:text-right mr-1">
                    <span className="text-base font-black text-emerald-800 block">
                      Rs.{Number(q.estimatedFare || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-m3-on-surface-variant uppercase tracking-wider font-bold">
                      Customer Estimate
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendQuoteWA(q)}
                    className="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Send quote format on WhatsApp"
                  >
                    <span className="material-symbols-outlined text-[15px] text-emerald-700">send</span>
                    <span>WA Quote</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConvertToBooking(q)}
                    className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                    title="Customer called to book! Convert directly to Step 2: Active Trips"
                  >
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    <span>+ Convert to Booking</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
