import React, { useState, useMemo } from 'react';
import { buildMapsBlock } from '../../../utils/whatsapp';
import { validateCustomerContact } from '../../../utils/bookingContactValidator';

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

  const [showGuide, setShowGuide] = useState(false);
  const [viewTab, setViewTab] = useState('FEED'); // 'FEED' | 'INTELLIGENCE'

  // Modal State: Convert Enquiry to Active Trip requires Name & Phone
  const [convertingQuote, setConvertingQuote] = useState(null);
  const [convertForm, setConvertForm] = useState({
    guestName: '',
    phone: '',
    travelDateTime: 'Tomorrow @ 05:00 AM',
    advancePaid: '500'
  });
  const [formError, setFormError] = useState('');

  const validQuotes = useMemo(() => {
    const map = new Map();
    (calculatorQuotes || []).forEach(q => {
      if (!q) return;
      const fare = Number(q.estimatedFare || q.fare || q.estimate || 0);
      if (fare <= 0) return;
      if ((q.drop || '').toLowerCase().includes('whatsapp chat')) return;
      const idKey = (q.quoteId || '').trim();
      const dedupKey = idKey || `${q.pickup}_${q.drop}_${fare}_${q.vehicle}`;
      if (!map.has(dedupKey)) {
        map.set(dedupKey, q);
      } else {
        const existing = map.get(dedupKey);
        if ((q.status || '').toLowerCase().includes('whatsapp')) {
          map.set(dedupKey, { ...existing, ...q });
        }
      }
    });
    return Array.from(map.values());
  }, [calculatorQuotes]);

  // Aggregate Market Intelligence & Top In-Demand Routes
  const routeStats = useMemo(() => {
    const routesMap = {};
    (validQuotes || []).forEach(q => {
      const from = (q.pickup || 'Chennai').trim();
      const to = (q.drop || 'Outstation').trim();
      const routeKey = `${from} ➔ ${to}`;
      if (!routesMap[routeKey]) {
        routesMap[routeKey] = {
          routeKey,
          from,
          to,
          count: 0,
          totalFare: 0,
          vehicles: {},
          hotCount: 0,
          latestTimestamp: q.timestamp
        };
      }
      const stat = routesMap[routeKey];
      stat.count += 1;
      stat.totalFare += Number(q.estimatedFare || 0);
      const v = q.vehicle || 'Sedan';
      stat.vehicles[v] = (stat.vehicles[v] || 0) + 1;
      if ((q.status || '').toLowerCase().includes('whatsapp')) {
        stat.hotCount += 1;
      }
    });

    return Object.values(routesMap)
      .map(stat => {
        const topVeh = Object.entries(stat.vehicles).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Swift Dzire';
        const cleanFrom = stat.from.replace(/\s*\(MAA\)/i, '').replace(/International Airport/i, 'Airport').trim();
        const cleanTo = stat.to.trim();
        return {
          ...stat,
          avgFare: Math.round(stat.totalFare / (stat.count || 1)),
          topVehicle: topVeh,
          conversionRate: Math.round((stat.hotCount / (stat.count || 1)) * 100),
          keywords: [
            `"${cleanFrom} to ${cleanTo} taxi"`,
            `"${cleanFrom} to ${cleanTo} cab fare"`,
            `"[${cleanFrom} to ${cleanTo} outstation cab]"`,
            `"${cleanTo} taxi tariff"`
          ]
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [validQuotes]);

  const avgMarketFare = useMemo(() => {
    if (!validQuotes.length) return 0;
    const total = validQuotes.reduce((acc, q) => acc + Number(q.estimatedFare || 0), 0);
    return Math.round(total / validQuotes.length);
  }, [validQuotes]);

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

  // Format metadata into human-readable chips instead of raw JSON
  const getMetadataBadges = (metadata) => {
    if (!metadata || metadata === 'None') return [];
    let parsed = null;
    if (typeof metadata === 'object') {
      parsed = metadata;
    } else if (typeof metadata === 'string') {
      const trimmed = metadata.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          parsed = JSON.parse(trimmed);
        } catch (_) {}
      }
    }

    if (parsed && typeof parsed === 'object') {
      const badges = [];
      if (parsed.chargeableKm) badges.push(`📏 ${parsed.chargeableKm} km`);
      if (parsed.ratePerKm) badges.push(`🏷️ ₹${parsed.ratePerKm}/km`);
      if (parsed.driverBeta || parsed.driverBata) badges.push(`☕ Driver Batta ₹${parsed.driverBeta || parsed.driverBata}`);
      if (parsed.direction === 'pickup') badges.push(`🛬 Airport Arrival`);
      if (parsed.direction === 'drop') badges.push(`🛫 Airport Departure`);
      if (parsed.isOutstation) badges.push(`🛣️ Outstation`);
      if (parsed.flightDetails) badges.push(`✈️ ${parsed.flightDetails}`);
      if (badges.length > 0) return badges;
    }

    if (typeof metadata === 'string') {
      const cleaned = metadata.replace(/[{}"\\]/g, '').trim();
      if (cleaned && cleaned !== 'None') return [cleaned];
    }
    return [];
  };

  // Copy Google Ads keywords to clipboard
  const handleCopyKeywords = (keywords, label) => {
    const text = keywords.join('\n');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      showToast?.(`Copied ${keywords.length} Google Ads keywords for ${label}!`, 'success');
    }
  };

  // Copy all recommended keywords
  const handleCopyAllKeywords = () => {
    const all = routeStats.flatMap(r => r.keywords).join('\n');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(all);
      showToast?.(`Copied ${routeStats.length * 4} Google Ads keywords to clipboard!`, 'success');
    }
  };

  // Export calculation searches as CSV
  const handleExportCSV = () => {
    if (!validQuotes.length) return;
    const headers = ['Quote ID', 'Timestamp', 'Pickup', 'Drop', 'Vehicle', 'Trip Type', 'Fare (INR)', 'Status', 'Engine / Source'];
    const rows = validQuotes.map(q => [
      `"${q.quoteId || ''}"`,
      `"${q.timestamp || ''}"`,
      `"${q.pickup || ''}"`,
      `"${q.drop || ''}"`,
      `"${q.vehicle || ''}"`,
      `"${q.tripType || ''}"`,
      `"${q.estimatedFare || 0}"`,
      `"${q.status || ''}"`,
      `"${q.sourcePage || q.calculatorEngine || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kalidass_Route_Searches_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Exported calculation log CSV!', 'success');
  };

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

  // Open Modal: Convert Quote to Active Trip (Requires Customer Name & Mobile)
  const handleOpenConvertModal = (quote) => {
    setConvertingQuote(quote);
    setConvertForm({
      guestName: '',
      phone: '',
      travelDateTime: quote.travelDate || 'Tomorrow @ 05:00 AM',
      advancePaid: '500'
    });
    setFormError('');
  };

  // Confirm and move to Active Trips only when Name & Phone are valid
  const handleConfirmConvert = (e) => {
    e?.preventDefault?.();
    if (!convertingQuote) return;

    const validation = validateCustomerContact(convertForm.guestName, convertForm.phone);
    if (!validation.isValid) {
      setFormError(validation.error);
      showToast?.(validation.error, 'error');
      return;
    }

    const fare = Number(convertingQuote.estimatedFare) || 0;
    const driverShare = Math.round(fare * 0.82);
    const adv = Number(convertForm.advancePaid) || 500;

    const newBooking = {
      bookingId: `#KT-${Date.now().toString().slice(-4)}`,
      guestNamePhone: validation.formattedGuestNamePhone,
      travelDateTime: convertForm.travelDateTime.trim() || 'Tomorrow @ 05:00 AM',
      pickupAddress: `${convertingQuote.pickup} ➔ ${convertingQuote.drop}`,
      vehicleCategory: convertingQuote.vehicle || 'Sedan (Dzire / Etios)',
      partySize: '4 Pax',
      kycStatus: 'Advance Paid',
      darshanStatus: convertingQuote.calculatorEngine || 'Website Calculator',
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

    onConvertToConfirmed?.(newBooking);
    showToast?.(`✅ Booking ${newBooking.bookingId} confirmed for ${validation.cleanName}! Check Active Trips.`, 'success');
    setConvertingQuote(null);
  };

  return (
    <div className="space-y-4 font-sans animate-fadeIn">
      {/* Top Banner: Clear Separation Explanation */}
      <div className="bg-m3-surface-container-lowest p-4 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-m3-primary"></span>
            <h2 className="text-m3-title-m font-bold text-m3-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-m3-primary">radar</span>
              <span>Website Fare Calculator Radar</span>
            </h2>
            <span className="text-xs font-semibold bg-m3-primary-container text-m3-on-primary-container px-2.5 py-0.5 rounded-full">
              {validQuotes.length} Live Estimates
            </span>
            {hotQuotesCount > 0 && (
              <span className="text-xs font-semibold bg-m3-success-container text-m3-on-success-container px-2.5 py-0.5 rounded-full">
                🔥 {hotQuotesCount} WhatsApp Clicked
              </span>
            )}
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-1 max-w-2xl">
            Live stream of fares calculated by visitors browsing on your website booking engines (Airport Taxi, Outstation Cabs, Tour Packages, Acting Drivers).
            <span className="font-semibold text-m3-on-surface block mt-0.5">
              💡 Passive web visitors checking prices. Real customer inquiries who call or message appear in "1. New Enquiries".
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowGuide(prev => !prev)}
            className="px-3.5 py-1.5 rounded-m3-full text-xs font-semibold bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">help</span>
            <span>{showGuide ? 'Hide Guide' : 'How this works?'}</span>
          </button>
          <div className="text-right pl-3 border-l border-m3-outline-variant">
            <span className="text-xs text-m3-on-surface-variant block">Total Calculations</span>
            <span className="text-lg font-bold text-m3-on-surface font-mono-code">{validQuotes.length}</span>
          </div>
        </div>
      </div>

      {/* Explainer Drawer (When User clicks "How this works?") */}
      {showGuide && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-m3-xl shadow-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span>Why am I seeing these calculations & How does this work?</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
            <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-xs space-y-1">
              <div className="font-bold text-emerald-800 flex items-center gap-1">
                <span>1. What is this?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                These are <strong>real-time price searches</strong> made by people browsing your website. When a visitor checks fares for Airport Taxi or Outstation Cabs, it streams here instantly.
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-xs space-y-1">
              <div className="font-bold text-emerald-800 flex items-center gap-1">
                <span>2. How do we get it?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                As soon as a visitor clicks <em>"Calculate Fare"</em>, your website logs the route, car, and tariff to your Google Sheet and sends a live signal to this screen.
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-xs space-y-1">
              <div className="font-bold text-emerald-800 flex items-center gap-1">
                <span>3. How to use it?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                If the visitor clicks WhatsApp or calls saying <em>"I checked a quote on your website"</em>, you already have their exact fare breakdown ready and can click <strong>+ Convert to Booking</strong>!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View Switcher: Live Calculations Feed vs. Route Demand & Google Ads Intelligence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-m3-outline-variant/60 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewTab('FEED')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewTab === 'FEED'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">stream</span>
            <span>Live Feed ({validQuotes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('INTELLIGENCE')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewTab === 'INTELLIGENCE'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">insights</span>
            <span>📊 Route Demand & Google Ads</span>
            {routeStats.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 text-emerald-900 font-mono-code font-black">
                {routeStats.length} routes
              </span>
            )}
          </button>
        </div>

        {/* Quick Action: Export CSV & Copy All Keywords */}
        <div className="flex items-center gap-2">
          {viewTab === 'INTELLIGENCE' && routeStats.length > 0 && (
            <button
              type="button"
              onClick={handleCopyAllKeywords}
              className="h-8 px-3 rounded-full text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1 shadow-xs transition-colors"
              title="Copy all recommended keywords for Google Ads"
            >
              <span className="material-symbols-outlined text-[15px] text-blue-700">content_copy</span>
              <span>Copy All Ad Keywords</span>
            </button>
          )}

          {validQuotes.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-8 px-3 rounded-full text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center gap-1 shadow-xs transition-colors"
              title="Download calculation searches as CSV"
            >
              <span className="material-symbols-outlined text-[15px] text-slate-500">download</span>
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: ROUTE DEMAND & GOOGLE ADS INTELLIGENCE */}
      {viewTab === 'INTELLIGENCE' ? (
        <div className="space-y-4 animate-fadeIn">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white p-3.5 rounded-m3-lg border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Price Searches</span>
              <span className="text-xl font-black text-slate-900">{validQuotes.length}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Website visitors</span>
            </div>

            <div className="bg-white p-3.5 rounded-m3-lg border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Unique Routes</span>
              <span className="text-xl font-black text-emerald-700">{routeStats.length}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Destinations compared</span>
            </div>

            <div className="bg-white p-3.5 rounded-m3-lg border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Average Quoted Rate</span>
              <span className="text-xl font-black text-blue-700">₹{avgMarketFare.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Across all engines</span>
            </div>

            <div className="bg-white p-3.5 rounded-m3-lg border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">WhatsApp Lead Rate</span>
              <span className="text-xl font-black text-amber-700">
                {validQuotes.length ? Math.round((hotQuotesCount / validQuotes.length) * 100) : 0}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{hotQuotesCount} clicked WA</span>
            </div>
          </div>

          {/* Google Ads Strategy Guide Callout */}
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-m3-xl text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <span className="material-symbols-outlined text-[18px] text-blue-700">campaign</span>
              <span>How to Run Google Ads on Top Demanded Routes</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Below are your website visitors' most-searched routes. Instead of bidding on generic keywords, click <strong>"Copy Ad Keywords"</strong> for any route and paste them into your <strong>Google Ads Search Campaign</strong> targeting Chennai & Tamil Nadu with a landing page link to your fare calculator!
            </p>
          </div>

          {/* Routes Demand & Keyword Table */}
          {routeStats.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-m3-xl border border-slate-200 text-xs text-slate-500">
              No routes logged yet. As soon as visitors calculate fares, they will be analyzed here.
            </div>
          ) : (
            <div className="space-y-3">
              {routeStats.map((stat, idx) => (
                <div
                  key={stat.routeKey}
                  className="bg-white p-4 rounded-m3-xl border border-slate-200/90 shadow-xs space-y-3 hover:border-emerald-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-mono-code font-black text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-1">
                          <span>{stat.from}</span>
                          <span className="text-emerald-600">➔</span>
                          <span>{stat.to}</span>
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {stat.count} {stat.count === 1 ? 'visitor price check' : 'visitor price checks'} • Top vehicle: <strong>{stat.topVehicle}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="text-right mr-1">
                        <span className="text-sm font-black text-emerald-800 block">₹{stat.avgFare.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-slate-400">Avg Quoted Rate</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyKeywords(stat.keywords, `${stat.from} to ${stat.to}`)}
                        className="h-8 px-3 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-xs transition-colors"
                        title="Copy keywords for Google Ads"
                      >
                        <span className="material-symbols-outlined text-[15px]">content_copy</span>
                        <span>Copy Ad Keywords</span>
                      </button>
                    </div>
                  </div>

                  {/* Recommended Google Ads Keywords List */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Ready-to-use Google Ads Target Keywords (Exact & Phrase Match):
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {stat.keywords.map((kw, kIdx) => (
                        <span
                          key={kIdx}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-mono-code px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                          onClick={() => handleCopyKeywords([kw], kw)}
                          title="Click to copy single keyword"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: LIVE CALCULATIONS FEED */
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-1">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-2 text-m3-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search route, destination, vehicle, or quote ID..."
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
                  className={`h-8 px-3 rounded-m3-sm text-xs font-semibold transition-colors ${
                    engineFilter === f.id
                      ? 'bg-m3-secondary-container text-m3-on-secondary-container border-0'
                      : 'bg-m3-surface-container-lowest text-m3-on-surface-variant border border-m3-outline-variant hover:bg-m3-surface-container-high'
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
                const badges = getMetadataBadges(q.metadata);

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

                      {/* Vehicle, Distance, Badges */}
                      <div className="text-xs text-m3-on-surface-variant flex flex-wrap items-center gap-1.5 font-medium">
                        <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-full">
                          🚗 {q.vehicle || 'Vehicle'}
                        </span>
                        <span>•</span>
                        <span className="bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                          {q.tripType || 'One Way'}
                        </span>

                        {/* Human-readable metadata chips */}
                        {badges.map((badge, bIdx) => (
                          <span
                            key={bIdx}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          >
                            {badge}
                          </span>
                        ))}

                        {q.sourcePage && (
                          <span className="text-[11px] text-slate-400 font-mono-code ml-auto">
                            via {q.sourcePage.replace(/\/$/, '').split('/').pop() || q.sourcePage}
                          </span>
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
                        onClick={() => handleOpenConvertModal(q)}
                        className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                        title="Customer called to book! Enter customer name & phone to move to Step 2: Active Trips"
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
        </>
      )}

      {/* Modal: Convert Enquiry to Active Trip (Requires Customer Name & Mobile) */}
      {convertingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-2xl shadow-m3-4 w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-m3-outline-variant bg-emerald-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-950">Convert Enquiry to Active Trip</h3>
                  <p className="text-xs text-emerald-900/80">Customer name & 10-digit mobile are required for driver dispatch</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConvertingQuote(null)}
                className="w-8 h-8 rounded-full hover:bg-emerald-200/50 flex items-center justify-center text-emerald-950 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmConvert} className="p-5 overflow-y-auto space-y-4">
              {/* Route & Quoted Fare Summary Card */}
              <div className="p-3 bg-m3-surface-container-low rounded-m3-lg border border-m3-outline-variant/70 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-m3-on-surface">
                    {convertingQuote.pickup} ➔ {convertingQuote.drop}
                  </div>
                  <div className="text-[11px] text-m3-on-surface-variant mt-0.5">
                    🚗 {convertingQuote.vehicle} • {convertingQuote.tripType || 'One Way'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-700">
                    ₹{Number(convertingQuote.estimatedFare || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-m3-on-surface-variant font-semibold">Total Fare</span>
                </div>
              </div>

              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-m3-md text-xs font-bold text-red-800 flex items-center gap-1.5 animate-shake">
                  <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Required: Passenger Name */}
              <div>
                <label className="block text-xs font-bold text-m3-on-surface mb-1 flex items-center justify-between">
                  <span>Customer / Passenger Name <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-m3-on-surface-variant font-normal">Cannot be blank or generic</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Ramesh Kumar"
                  value={convertForm.guestName}
                  onChange={(e) => {
                    setConvertForm({ ...convertForm, guestName: e.target.value });
                    if (formError) setFormError('');
                  }}
                  className="w-full p-2.5 rounded-m3-md border border-m3-outline-variant bg-white text-xs font-bold text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Required: 10-Digit Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-m3-on-surface mb-1 flex items-center justify-between">
                  <span>Passenger Mobile Number <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-m3-on-surface-variant font-normal">10 digits starting with 6-9</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-black text-m3-on-surface-variant">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98401 23456"
                    value={convertForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setConvertForm({ ...convertForm, phone: val });
                      if (formError) setFormError('');
                    }}
                    className="w-full pl-12 pr-3 py-2.5 rounded-m3-md border border-m3-outline-variant bg-white text-xs font-bold text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono-code"
                  />
                </div>
              </div>

              {/* Schedule and Advance Received */}
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

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-m3-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setConvertingQuote(null)}
                  className="px-4 py-2 rounded-full border border-m3-outline-variant text-xs font-bold text-m3-on-surface-variant hover:bg-m3-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-m3-1 flex items-center gap-1.5 transition-all"
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
