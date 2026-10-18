import React, { useState, useMemo } from 'react';

export default function DeskChauffeurs({ chauffeurs = [], bookings = [], onAddChauffeur, onDeleteChauffeur, showToast }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    plate: '',
    category: 'Sedan (Dzire / Etios)',
    rating: '4.9'
  });

  // Cross-reference active bookings to determine live driver status
  const chauffeursWithDuty = useMemo(() => {
    return chauffeurs.map((chauffeur, originalIdx) => {
      // Find any non-completed booking assigned to this chauffeur
      const activeTrip = bookings.find(b => {
        if (b.manifestStatus === 'Completed' || b.manifestStatus === 'Cancelled') return false;
        return (b.assignedChauffeur || '').toLowerCase().includes((chauffeur.name || '').toLowerCase());
      });

      return {
        ...chauffeur,
        originalIdx,
        currentDuty: activeTrip || null
      };
    });
  }, [chauffeurs, bookings]);

  // Filtered list
  const filtered = useMemo(() => {
    return chauffeursWithDuty.filter(c => {
      const matchCategory = filterCategory === 'ALL' || (c.category || '').toLowerCase().includes(filterCategory.toLowerCase());
      const query = `${c.name || ''} ${c.plate || ''} ${c.phone || ''} ${c.category || ''}`.toLowerCase();
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

  const handleSaveNewDriver = (e) => {
    e.preventDefault();
    if (!newDriver.name.trim() || !newDriver.phone.trim() || !newDriver.plate.trim()) {
      showToast?.('Please fill Driver Name, Phone Number, and Plate Number.', 'error');
      return;
    }

    const formatted = {
      name: newDriver.name.trim(),
      phone: newDriver.phone.trim().startsWith('+91') ? newDriver.phone.trim() : `+91 ${newDriver.phone.trim()}`,
      plate: newDriver.plate.trim().toUpperCase(),
      category: newDriver.category,
      status: 'Available',
      rating: newDriver.rating || '4.9'
    };

    onAddChauffeur?.(formatted);
    setNewDriver({
      name: '',
      phone: '',
      plate: '',
      category: 'Sedan (Dzire / Etios)',
      rating: '4.9'
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-4 border border-m3-outline-variant/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-m3-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-lg">badge</span>
            <span>Chauffeurs & Commercial Fleet Roster ({chauffeurs.length})</span>
          </h2>
          <p className="text-xs text-m3-outline mt-0.5">
            Verified partner drivers with live duty availability & direct WhatsApp line.
          </p>
        </div>

        {/* Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-m3-outline text-base">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search driver or plate..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-m3-outline-variant bg-m3-surface-container-low focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-xl border border-m3-outline-variant bg-white font-semibold text-m3-on-surface focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Cars</option>
            <option value="Sedan">Sedan (Dzire / Etios)</option>
            <option value="Ertiga">Ertiga (6 Pax)</option>
            <option value="Innova">Innova Crysta</option>
            <option value="Tempo">Tempo Traveller</option>
          </select>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Add Chauffeur</span>
          </button>
        </div>
      </div>

      {/* Roster Cards Grid / Empty State */}
      {chauffeurs.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-m3-outline-variant shadow-sm space-y-3">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">badge</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No Drivers Added to Roster Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add your verified partner drivers with their real phone numbers and plate numbers to easily assign duties and broadcast trips.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Add Real Driver</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-m3-outline-variant shadow-sm">
          <p className="text-xs font-bold text-slate-600">No chauffeurs match your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((driver) => {
            const isBusy = !!driver.currentDuty;

            return (
              <div
                key={driver.phone || driver.originalIdx}
                className="bg-white rounded-2xl border border-m3-outline-variant/70 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge & Rating */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-sm">
                        {(driver.name || 'D').charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-m3-on-surface leading-tight">{driver.name}</h3>
                        <span className="text-[11px] font-mono font-semibold text-m3-outline block">
                          {driver.phone}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-0.5 text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          <span>{driver.rating || '4.9'}</span>
                        </span>
                        {onDeleteChauffeur && (
                          <button
                            type="button"
                            onClick={() => onDeleteChauffeur(driver.originalIdx)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                            title="Remove Driver"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
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
      )}

      {/* Add Real Chauffeur Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">person_add</span>
                <h3 className="text-sm font-bold">Add Real Partner Chauffeur</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNewDriver} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Chauffeur Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">WhatsApp / Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 98401 23456"
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Vehicle Class</label>
                  <select
                    value={newDriver.category}
                    onChange={(e) => setNewDriver({ ...newDriver, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-semibold"
                  >
                    <option value="Sedan (Dzire / Etios)">Sedan (Dzire / Etios)</option>
                    <option value="Ertiga (6 Pax)">Ertiga (6 Pax)</option>
                    <option value="Innova Crysta">Innova Crysta</option>
                    <option value="Tempo Traveller">Tempo Traveller</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Car Plate Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TN 09 CZ 1234"
                    value={newDriver.plate}
                    onChange={(e) => setNewDriver({ ...newDriver, plate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Save Chauffeur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
