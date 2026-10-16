import React, { useState, useMemo } from 'react';

export default function DeskChauffeurs({ chauffeurs = [], bookings = [], showToast }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Cross-reference active bookings to determine live driver status
  const chauffeursWithDuty = useMemo(() => {
    return chauffeurs.map(chauffeur => {
      // Find any non-completed booking assigned to this chauffeur
      const activeTrip = bookings.find(b => {
        if (b.manifestStatus === 'Completed' || b.manifestStatus === 'Cancelled') return false;
        return (b.assignedChauffeur || '').toLowerCase().includes(chauffeur.name.toLowerCase());
      });

      return {
        ...chauffeur,
        currentDuty: activeTrip || null
      };
    });
  }, [chauffeurs, bookings]);

  // Filtered list
  const filtered = useMemo(() => {
    return chauffeursWithDuty.filter(c => {
      const matchCategory = filterCategory === 'ALL' || c.category.toLowerCase().includes(filterCategory.toLowerCase());
      const query = `${c.name} ${c.plate} ${c.phone} ${c.category}`.toLowerCase();
      const matchSearch = !search || query.includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [chauffeursWithDuty, filterCategory, search]);

  const handleCall = (phone) => {
    window.open(`tel:${phone.replace(/[^0-9+]/g, '')}`, '_self');
  };

  const handleWhatsApp = (phone, name) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = `Namaskaram ${name}! Checking your availability for upcoming Kalidass Travels duties.`;
    window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-4 border border-m3-outline-variant/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-m3-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-m3-primary text-lg">badge</span>
            <span>Chauffeurs & Commercial Fleet Roster ({chauffeurs.length})</span>
          </h2>
          <p className="text-xs text-m3-outline mt-0.5">
            Verified yellow-plate partner drivers with live duty availability & direct WhatsApp line.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-m3-outline text-base">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search driver or plate..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-m3-outline-variant bg-m3-surface-container-low focus:ring-2 focus:ring-m3-primary focus:outline-none"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-xl border border-m3-outline-variant bg-white font-semibold text-m3-on-surface focus:ring-2 focus:ring-m3-primary"
          >
            <option value="ALL">All Cars</option>
            <option value="Sedan">Sedan (Dzire / Etios)</option>
            <option value="Ertiga">Ertiga (6 Pax)</option>
            <option value="Innova">Innova Crysta</option>
            <option value="Tempo">Tempo Traveller</option>
          </select>
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((driver, idx) => {
          const isBusy = !!driver.currentDuty;

          return (
            <div
              key={driver.phone || idx}
              className="bg-white rounded-2xl border border-m3-outline-variant/70 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Badge & Rating */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-sm">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-m3-on-surface leading-tight">{driver.name}</h3>
                      <span className="text-[11px] font-mono font-semibold text-m3-outline block">
                        {driver.phone}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="flex items-center gap-0.5 text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      <span>{driver.rating || '4.9'}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                      isBusy ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isBusy ? 'Assigned On Duty' : 'Available'}
                    </span>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="p-2.5 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/40 mb-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-m3-outline font-semibold">Vehicle Class:</span>
                    <span className="font-bold text-m3-on-surface">{driver.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-m3-outline font-semibold">Plate Number:</span>
                    <span className="font-mono font-bold text-slate-800 bg-amber-200/60 px-1.5 py-0.2 rounded border border-amber-300">
                      {driver.plate}
                    </span>
                  </div>
                </div>

                {/* Current Active Trip if any */}
                {driver.currentDuty && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl mb-3 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-blue-800 font-bold mb-1">
                      <span>Active Booking: {driver.currentDuty.bookingId}</span>
                      <span className="uppercase text-[9px] bg-blue-200 px-1.5 py-0.2 rounded">{driver.currentDuty.manifestStatus}</span>
                    </div>
                    <p className="text-[11px] text-blue-900 truncate font-semibold">
                      {driver.currentDuty.pickupAddress}
                    </p>
                    <span className="text-[10px] text-blue-700 font-mono block mt-0.5">
                      {driver.currentDuty.travelDateTime}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-m3-outline-variant/40 mt-1">
                <button
                  type="button"
                  onClick={() => handleWhatsApp(driver.phone, driver.name)}
                  className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chat</span>
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCall(driver.phone)}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  title="Direct Phone Call"
                >
                  <span className="material-symbols-outlined text-sm">phone</span>
                  <span>Call</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
