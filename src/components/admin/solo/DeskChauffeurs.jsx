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
    <div className="space-y-4 animate-fadeIn">
      {/* Header & Controls */}
      <div className="bg-m3-surface-container-lowest rounded-m3-xl p-4 border border-m3-outline-variant/70 shadow-m3-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-m3-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-m3-primary text-lg">badge</span>
            <span>Chauffeurs & Commercial Fleet Roster ({chauffeurs.length})</span>
          </h2>
          <p className="text-xs text-m3-on-surface-variant mt-0.5">
            Verified partner drivers with live duty availability & direct WhatsApp line.
          </p>
        </div>

        {/* Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-m3-on-surface-variant text-base">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search driver or plate..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-m3-outline-variant bg-m3-surface-container-low focus:ring-2 focus:ring-m3-primary text-m3-on-surface focus:outline-none"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-full border border-m3-outline-variant bg-m3-surface-container-lowest font-medium text-m3-on-surface focus:ring-2 focus:ring-m3-primary"
          >
            <option value="ALL">All Cars</option>
            <option value="Sedan">Sedan (Dzire / Etios)</option>
            <option value="Ertiga">Ertiga (6 Seats)</option>
            <option value="Innova">Innova Crysta</option>
            <option value="Tempo">Tempo Traveller</option>
          </select>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="py-1.5 px-4 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-full text-xs font-bold flex items-center gap-1.5 shadow-m3-1 transition-all whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Add Chauffeur</span>
          </button>
        </div>
      </div>

      {/* Roster Cards Grid / Empty State */}
      {chauffeurs.length === 0 ? (
        <div className="bg-m3-surface-container-lowest rounded-m3-xl p-10 text-center border border-m3-outline-variant/70 shadow-m3-1 space-y-3">
          <div className="w-14 h-14 bg-m3-secondary-container text-m3-on-secondary-container rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">badge</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-m3-on-surface">No Drivers Added to Roster Yet</h3>
            <p className="text-xs text-m3-on-surface-variant max-w-sm mx-auto mt-1">
              Add your verified partner drivers with their real phone numbers and plate numbers to easily assign duties and broadcast trips.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-full text-xs font-bold shadow-m3-1 transition-all"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Add Real Driver</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-m3-surface-container-lowest rounded-m3-xl p-8 text-center border border-m3-outline-variant/70 shadow-m3-1">
          <p className="text-xs font-medium text-m3-on-surface-variant">No chauffeurs match your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((driver) => {
            const isBusy = !!driver.currentDuty;

            return (
              <div
                key={driver.phone || driver.originalIdx}
                className="bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 p-4 shadow-m3-1 hover:border-m3-outline transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge & Rating */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-m3-surface-container-high border border-m3-outline-variant flex items-center justify-center font-bold text-m3-on-surface text-sm">
                        {(driver.name || 'D').charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-m3-on-surface leading-tight">{driver.name}</h3>
                        <span className="text-[11px] font-mono text-m3-on-surface-variant block">
                          {driver.phone}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-0.5 text-xs font-bold text-m3-on-secondary-container bg-m3-secondary-container px-2 py-0.5 rounded-full border border-m3-outline-variant/40">
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          <span>{driver.rating || '4.9'}</span>
                        </span>
                        {onDeleteChauffeur && (
                          <button
                            type="button"
                            onClick={() => onDeleteChauffeur(driver.originalIdx)}
                            className="text-m3-on-surface-variant hover:text-m3-error transition-colors p-0.5"
                            title="Remove Driver"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        isBusy ? 'bg-m3-surface-container-high text-m3-on-surface-variant' : 'bg-m3-secondary-container text-m3-on-secondary-container'
                      }`}>
                        {isBusy ? 'Assigned On Duty' : 'Available'}
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div className="p-2.5 bg-m3-surface-container-low rounded-m3-lg border border-m3-outline-variant/40 mb-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-m3-on-surface-variant font-medium">Vehicle Class:</span>
                      <span className="font-bold text-m3-on-surface">{driver.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-m3-on-surface-variant font-medium">Plate Number:</span>
                      <span className="font-mono text-xs font-bold text-m3-on-surface bg-m3-surface-container-high px-1.5 py-0.5 rounded border border-m3-outline-variant">
                        {driver.plate}
                      </span>
                    </div>
                  </div>

                  {/* Current Active Trip if any */}
                  {driver.currentDuty && (
                    <div className="p-2.5 bg-m3-surface-container-low border border-m3-outline-variant/80 rounded-m3-lg mb-3 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-m3-primary font-bold mb-1">
                        <span>Active Booking: {driver.currentDuty.bookingId}</span>
                        <span className="uppercase text-[9px] bg-m3-secondary-container text-m3-on-secondary-container px-1.5 py-0.5 rounded font-bold">{driver.currentDuty.manifestStatus}</span>
                      </div>
                      <p className="text-[11px] text-m3-on-surface truncate font-medium">
                        {driver.currentDuty.pickupAddress}
                      </p>
                      <span className="text-[10px] text-m3-on-surface-variant font-mono block mt-0.5">
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
                    className="flex-1 py-1.5 px-2 bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container rounded-full text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">chat</span>
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCall(driver.phone)}
                    className="py-1.5 px-3 bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface rounded-full text-xs font-bold flex items-center justify-center gap-1 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-m3-surface-container-lowest rounded-m3-2xl shadow-m3-3 w-full max-w-md overflow-hidden border border-m3-outline-variant/80">
            <div className="bg-m3-surface-container-low text-m3-on-surface p-4 flex items-center justify-between border-b border-m3-outline-variant/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-primary">person_add</span>
                <h3 className="text-sm font-bold">Add Real Partner Chauffeur</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-m3-on-surface-variant hover:text-m3-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNewDriver} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-m3-on-surface mb-1">Chauffeur Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  className="w-full rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest p-2 text-xs text-m3-on-surface focus:ring-2 focus:ring-m3-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-m3-on-surface mb-1">WhatsApp / Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 98401 23456"
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                  className="w-full rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest p-2 text-xs text-m3-on-surface focus:ring-2 focus:ring-m3-primary focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-m3-on-surface mb-1">Vehicle Class</label>
                  <select
                    value={newDriver.category}
                    onChange={(e) => setNewDriver({ ...newDriver, category: e.target.value })}
                    className="w-full rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest p-2 text-xs text-m3-on-surface focus:ring-2 focus:ring-m3-primary focus:outline-none font-semibold"
                  >
                    <option value="Sedan (Dzire / Etios)">Sedan (Dzire / Etios)</option>
                    <option value="Ertiga (6 Seats)">Ertiga (6 Seats)</option>
                    <option value="Innova Crysta">Innova Crysta</option>
                    <option value="Tempo Traveller">Tempo Traveller</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-m3-on-surface mb-1">Car Plate Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TN 09 CZ 1234"
                    value={newDriver.plate}
                    onChange={(e) => setNewDriver({ ...newDriver, plate: e.target.value })}
                    className="w-full rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest p-2 text-xs text-m3-on-surface focus:ring-2 focus:ring-m3-primary focus:outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-m3-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-m3-on-surface-variant hover:bg-m3-surface-container-high rounded-full font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary rounded-full font-bold shadow-m3-1"
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
