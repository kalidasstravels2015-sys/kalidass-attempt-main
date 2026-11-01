import React, { useState, useMemo } from 'react';

export default function DeskChatRadar({ chatQueries = [], showToast, onConvertToLead }) {
  const [filterIntent, setFilterIntent] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Intent color and icon helper
  const getIntentBadge = (intent) => {
    switch (intent) {
      case 'Tirupati Package':
        return { label: '🕉️ Tirupati Package', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Airport Transfer':
        return { label: '✈️ Airport Taxi', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'Pondicherry Tour':
        return { label: '🏖️ Pondicherry', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'Local Rental':
        return { label: '⏱️ Local Hourly', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'Outstation Tariff':
        return { label: '🛣️ Outstation Rate', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'Temple Tour':
        return { label: '🛕 Temple Tour', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'Acting Driver':
        return { label: '👮 Acting Driver', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: '💬 General Inquiry', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Filtered queries
  const filteredQueries = useMemo(() => {
    return chatQueries.filter((q) => {
      const matchIntent =
        filterIntent === 'ALL' ||
        (filterIntent === 'WITH_PHONE' && q.customerContact && q.customerContact !== 'None') ||
        q.detectedIntent === filterIntent;

      const qText = `${q.userQuery} ${q.aiResponse} ${q.sourcePage} ${q.detectedIntent} ${q.customerContact}`.toLowerCase();
      const matchSearch = !searchQuery || qText.includes(searchQuery.toLowerCase());

      return matchIntent && matchSearch;
    });
  }, [chatQueries, filterIntent, searchQuery]);

  // Telemetry counts
  const phoneCount = useMemo(() => {
    return chatQueries.filter((q) => q.customerContact && q.customerContact !== 'None').length;
  }, [chatQueries]);

  const tirupatiCount = useMemo(() => {
    return chatQueries.filter((q) => q.detectedIntent === 'Tirupati Package').length;
  }, [chatQueries]);

  const handleCopy = (text) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast?.('Copied to clipboard!', 'success');
    }
  };

  const handleWhatsAppContact = (contact, userQuery) => {
    const cleanPhone = String(contact).replace(/[^0-9]/g, '').slice(-10);
    const msg = `Namaskaram! This is Kalidass Travels Chennai regarding your website inquiry: "${userQuery}". How can we assist you with your cab booking today?`;
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Top Telemetry Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-m3-outline-variant/60 shadow-sm">
          <div className="text-[10px] font-bold text-m3-outline uppercase tracking-wider">Total Questions Asked</div>
          <div className="text-xl font-extrabold text-m3-on-surface mt-0.5">{chatQueries.length}</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-m3-outline-variant/60 shadow-sm">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <span>Tirupati Inquiries</span>
          </div>
          <div className="text-xl font-extrabold text-amber-900 mt-0.5">{tirupatiCount}</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-m3-outline-variant/60 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Phone Numbers Captured</div>
          <div className="text-xl font-extrabold text-emerald-900 mt-0.5">{phoneCount}</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-m3-outline-variant/60 shadow-sm">
          <div className="text-[10px] font-bold text-m3-outline uppercase tracking-wider">Logging Status</div>
          <div className="text-xs font-bold text-m3-success flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-m3-success animate-pulse"></span>
            <span>Live CSV & Webhook Active</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="bg-white p-3 rounded-2xl border border-m3-outline-variant/60 shadow-sm space-y-2.5">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-m3-outline text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search visitor questions (e.g. Tirupati, Innova, Airport, Tamil)..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-m3-outline-variant focus:outline-none focus:border-m3-tertiary bg-m3-surface-container-low"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setFilterIntent('ALL')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap ${
              filterIntent === 'ALL'
                ? 'bg-m3-inverse-surface text-white border-m3-inverse-surface'
                : 'bg-white text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container'
            }`}
          >
            All Queries ({chatQueries.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterIntent('Tirupati Package')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap ${
              filterIntent === 'Tirupati Package'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
            }`}
          >
            🕉️ Tirupati
          </button>

          <button
            type="button"
            onClick={() => setFilterIntent('Outstation Tariff')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap ${
              filterIntent === 'Outstation Tariff'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            🛣️ Outstation
          </button>

          <button
            type="button"
            onClick={() => setFilterIntent('Local Rental')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap ${
              filterIntent === 'Local Rental'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50'
            }`}
          >
            ⏱️ Local Hourly
          </button>

          <button
            type="button"
            onClick={() => setFilterIntent('Airport Transfer')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap ${
              filterIntent === 'Airport Transfer'
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
            }`}
          >
            ✈️ Airport
          </button>

          {phoneCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterIntent('WITH_PHONE')}
              className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap ${
                filterIntent === 'WITH_PHONE'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-extrabold'
              }`}
            >
              📞 Has Phone Number ({phoneCount})
            </button>
          )}
        </div>
      </div>

      {/* Query List */}
      <div className="space-y-3">
        {filteredQueries.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-m3-outline-variant/60 text-center space-y-2">
            <span className="material-symbols-outlined text-3xl text-m3-outline">chat_bubble_outline</span>
            <p className="text-xs font-semibold text-m3-outline">No AI chat queries match the selected filter.</p>
          </div>
        ) : (
          filteredQueries.map((item, idx) => {
            const badge = getIntentBadge(item.detectedIntent);
            const isExpanded = expandedId === item.queryId || (idx === 0 && !expandedId);
            const hasPhone = item.customerContact && item.customerContact !== 'None';

            return (
              <div
                key={item.queryId || idx}
                className="bg-white rounded-2xl border border-m3-outline-variant/60 shadow-sm p-4 hover:shadow-md transition-shadow space-y-3"
              >
                {/* Header metadata row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-m3-outline-variant/30 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono text-m3-tertiary bg-m3-tertiary-container/30 px-2 py-0.5 rounded-lg border border-m3-tertiary/20">
                      {item.queryId || `#CHAT-${100 + idx}`}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    {hasPhone && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">phone_enabled</span>
                        <span>+91 {item.customerContact}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-m3-outline font-medium">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span>{item.timestamp}</span>
                    </span>
                    <span>•</span>
                    <span className="font-mono bg-m3-surface-container px-1.5 py-0.5 rounded">
                      {item.sourcePage || '/'}
                    </span>
                  </div>
                </div>

                {/* User's Question (Prominently Styled) */}
                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-m3-outline flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-m3-tertiary">person</span>
                    <span>Visitor Asked:</span>
                  </div>
                  <div className="bg-m3-surface-container-low p-3 rounded-xl border border-m3-outline-variant/40 text-xs font-bold text-m3-on-surface leading-relaxed">
                    "{item.userQuery}"
                  </div>
                </div>

                {/* AI Reply (Collapsible) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-m3-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-emerald-600">smart_toy</span>
                      <span>AI Answer ({item.sourceEngine || 'Engine'}):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? '__collapsed' : item.queryId)}
                      className="text-[10px] font-bold text-m3-tertiary hover:underline flex items-center gap-0.5"
                    >
                      <span>{isExpanded ? 'Collapse' : 'View Full Reply'}</span>
                      <span className="material-symbols-outlined text-xs">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100 text-xs text-slate-800 leading-relaxed whitespace-pre-line animate-fadeIn">
                      {item.aiResponse}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-m3-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => handleCopy(`User Query: ${item.userQuery}\nAI Reply: ${item.aiResponse}`)}
                    className="px-2.5 py-1.5 rounded-lg border border-m3-outline-variant bg-white hover:bg-m3-surface-container text-m3-on-surface-variant text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">content_copy</span>
                    <span>Copy Q&A</span>
                  </button>

                  {hasPhone && (
                    <button
                      type="button"
                      onClick={() => handleWhatsAppContact(item.customerContact, item.userQuery)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-xs">chat</span>
                      <span>WhatsApp Visitor (+91 {item.customerContact})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
