import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Car,
  Compass,
  Plane,
  Save,
  RotateCcw,
  Download,
  ExternalLink,
  Info,
  Layers,
  Bus,
  UserCheck
} from 'lucide-react';
import baseTariffConfig from '../../../data/tariff_config.json';
import {
  getMasterTariff,
  saveMasterTariffOverride,
  clearMasterTariffOverride,
  getStatePermitForRoute
} from '../../../utils/masterTariff';

const PERMIT_CLASSES = [
  { key: 'sedan', label: 'Sedan (4+1)', sub: 'Dzire / Etios' },
  { key: 'suv', label: 'SUV (6+1)', sub: 'Maruti Ertiga' },
  { key: 'muv', label: 'MUV (7+1)', sub: 'Innova / Crysta' },
  { key: 'tempo', label: 'Tempo (12–14S)', sub: '12S / 14S Traveller' },
  { key: 'coach', label: 'Large Coach (17–26S)', sub: '17S / 20S / 26S / Urbania' }
];

const TOUR_VEHICLES = [
  { key: 'dzire', label: 'Sedan (4+1)' },
  { key: 'ertiga', label: 'Ertiga (6+1)' },
  { key: 'innova', label: 'Innova (7+1)' },
  { key: 'crysta', label: 'Crysta (7+1)' },
  { key: 'tempo12', label: 'Tempo (12S)' }
];

export default function MasterTariffView({ showToast }) {
  const [tariff, setTariff] = useState(() => getMasterTariff());
  const [activeSection, setActiveSection] = useState('ALL'); // 'ALL' | 'PERMITS' | 'VEHICLES' | 'TOURS' | 'AIRPORT'
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedText, setLastSavedText] = useState(tariff?.meta?.lastUpdated || '2026-10-28');

  useEffect(() => {
    fetch('/api/admin/master-tariff')
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data?.tariff) {
          setTariff(getMasterTariff());
        }
      })
      .catch(() => {});
  }, []);

  const handlePermitRateChange = (stateCode, vehicleClass, value) => {
    const num = Math.max(0, Number(value) || 0);
    setTariff((prev) => ({
      ...prev,
      state_permits: {
        ...prev.state_permits,
        [stateCode]: {
          ...prev.state_permits[stateCode],
          rates: {
            ...prev.state_permits[stateCode].rates,
            [vehicleClass]: num
          }
        }
      }
    }));
  };

  const handleVehicleFieldChange = (vName, field, value) => {
    const num = Math.max(0, Number(value) || 0);
    setTariff((prev) => ({
      ...prev,
      vehicles: {
        ...prev.vehicles,
        [vName]: {
          ...prev.vehicles[vName],
          [field]: num
        }
      }
    }));
  };

  const handleTempoFleetChange = (modelKey, field, value) => {
    const num = Math.max(0, Number(value) || 0);
    setTariff((prev) => ({
      ...prev,
      tempo_fleet: {
        ...(prev.tempo_fleet || {}),
        [modelKey]: {
          ...(prev.tempo_fleet?.[modelKey] || {}),
          [field]: num
        }
      }
    }));
  };

  const handleTourRateChange = (tourSlug, dayKey, vehicleKey, value) => {
    const num = Math.max(0, Number(value) || 0);
    setTariff((prev) => {
      const tour = prev.tour_packages?.[tourSlug] || {};
      const vEntry = tour.vehicles?.[vehicleKey] || { rates: {}, vehicleHire: {}, driverBata: {} };
      const bata = vEntry.driverBata?.[dayKey] || 1000;
      const nextHire = Math.max(0, num - bata);
      return {
        ...prev,
        tour_packages: {
          ...prev.tour_packages,
          [tourSlug]: {
            ...tour,
            vehicles: {
              ...(tour.vehicles || {}),
              [vehicleKey]: {
                ...vEntry,
                rates: { ...(vEntry.rates || {}), [dayKey]: num },
                vehicleHire: { ...(vEntry.vehicleHire || {}), [dayKey]: nextHire }
              }
            }
          }
        }
      };
    });
  };

  const handleAirportZoneChange = (zoneKey, value) => {
    const num = Math.max(0, Number(value) || 0);
    setTariff((prev) => ({
      ...prev,
      airport_tariffs: {
        ...prev.airport_tariffs,
        city_zones: {
          ...(prev.airport_tariffs?.city_zones || {}),
          [zoneKey]: {
            ...(prev.airport_tariffs?.city_zones?.[zoneKey] || {}),
            sedan_base: num
          }
        }
      }
    }));
  };

  const handleActingDriverChange = (idx, value) => {
    const num = Math.max(0, Number(value) || 0);
    setTariff((prev) => {
      const nextV = [...(prev.acting_drivers?.vehicles || [])];
      nextV[idx] = { ...nextV[idx], bata: num };
      return {
        ...prev,
        acting_drivers: {
          ...prev.acting_drivers,
          vehicles: nextV
        }
      };
    });
  };

  const handleSaveMasterTariff = async () => {
    setIsSaving(true);
    try {
      saveMasterTariffOverride(tariff);
      const res = await fetch('/api/admin/master-tariff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariff })
      });
      const data = await res.json();
      const today = new Date().toISOString().split('T')[0];
      setLastSavedText(today);
      if (data?.ok) {
        showToast?.('Master Tariff saved and synced across all calculators!', 'success');
      } else {
        showToast?.('Saved to browser session override.', 'info');
      }
    } catch (err) {
      saveMasterTariffOverride(tariff);
      showToast?.('Master Tariff saved to active browser override.', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    clearMasterTariffOverride();
    setTariff(baseTariffConfig);
    try {
      await fetch('/api/admin/master-tariff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariff: baseTariffConfig })
      });
    } catch (_) {}
    showToast?.('Master Tariff restored to verified baseline defaults.', 'info');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(tariff, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalidass_master_tariff_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stateOrder = ['PY', 'AP', 'KA', 'KL', 'TN'];

  return (
    <div className="space-y-6">
      {/* Top Control Header */}
      <div className="bg-m3-surface-container-lowest p-4 sm:p-5 rounded-m3-xl border border-m3-outline-variant/80 shadow-m3-1 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#1A1C1E] text-white">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#1A1C1E] tracking-tight">
                Single Master Tariff & Official State Entry Permit Matrix
              </h2>
              <p className="text-xs text-m3-on-surface-variant">
                One source of truth (`src/data/tariff_config.json`) powering Outstation, Tours, Airport, Tempo Fleet & Admin Quote Desks • Last Updated: <span className="font-mono-code font-bold text-[#1A1C1E]">{lastSavedText}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="h-9 px-3.5 rounded-full border border-m3-outline-variant bg-white hover:bg-m3-surface-container-low text-xs font-bold text-[#1A1C1E] inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="h-9 px-3.5 rounded-full border border-m3-outline-variant bg-white hover:bg-m3-surface-container-low text-xs font-bold text-m3-on-surface-variant inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveMasterTariff}
            disabled={isSaving}
            className="h-9 px-4 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Master Tariff'}</span>
          </button>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'All 4 Tables (At-a-Glance)', icon: Layers },
          { id: 'PERMITS', label: '1. State Entry Permits (Parivahan)', icon: ShieldCheck },
          { id: 'VEHICLES', label: '2. Outstation & Local Fleet', icon: Car },
          { id: 'TOURS', label: '3. Fixed Tour Packages (1D/2D/3D)', icon: Compass },
          { id: 'AIRPORT', label: '4. Airport & Acting Drivers', icon: Plane }
        ].map((tab) => {
          const IconComponent = tab.icon;
          const active = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`h-9 px-3.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border transition-colors ${
                active
                  ? 'bg-[#1A1C1E] text-white border-[#1A1C1E]'
                  : 'bg-white text-m3-on-surface-variant border-m3-outline-variant hover:bg-m3-surface-container-low'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TABLE 1: OFFICIAL STATE ENTRY PERMITS MATRIX (PARIVAHAN CHECKPOST)    */}
      {/* ===================================================================== */}
      {(activeSection === 'ALL' || activeSection === 'PERMITS') && (
        <section className="bg-white rounded-m3-xl border border-m3-outline-variant/80 shadow-m3-1 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-m3-outline-variant/60 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm sm:text-base font-black text-[#1A1C1E]">
                  1. Official State Entry Permit Matrix (Parivahan Checkpost Tax)
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  Included in Total Fare
                </span>
              </div>
              <p className="text-xs text-m3-on-surface-variant mt-1">
                Statutory 7-Day Short-Term Entry Tax + Checkpost Service Fee/Cess for TN commercial tourist vehicles (`TN-01` to `TN-99`).
              </p>
            </div>

            <a
              href="https://checkpost.parivahan.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 rounded-full border border-m3-outline-variant bg-white hover:bg-slate-100 text-[11px] font-bold text-[#1A1C1E] inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <span>Parivahan Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Billing Rule Banner */}
          <div className="px-4 py-2.5 bg-amber-50/90 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>System-Wide Billing Rule:</strong> <strong>1-Day Fixed Tour Packages (≤24 hrs)</strong> bundle State Entry Permits & Tolls at <code className="font-mono-code font-bold">₹0 Extra</code>. All <strong>Outstation (Per-Km)</strong>, <strong>Multi-Day Tours (&gt;24 hrs)</strong>, <strong>Airport Interstate Drops</strong>, and <strong>Admin Quotes</strong> automatically add this exact State Entry Permit to <code className="font-mono-code font-bold">Total Fare</code>.
              </span>
            </div>
            <span className="text-[11px] font-mono-code font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
              Hosur = TN (₹0 Permit)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-m3-outline-variant/60 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <th className="py-3 px-4">State / UT</th>
                  <th className="py-3 px-3">Statutory Tax Basis & Checkpost</th>
                  {PERMIT_CLASSES.map((c) => (
                    <th key={c.key} className="py-3 px-3 text-right">
                      <div>{c.label}</div>
                      <div className="text-[10px] font-normal text-slate-500 normal-case">{c.sub}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {stateOrder.map((code) => {
                  const st = tariff.state_permits?.[code];
                  if (!st) return null;
                  return (
                    <tr key={code} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-[#1A1C1E] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-6 rounded bg-slate-900 text-white font-mono-code text-[11px] font-black">
                            {code}
                          </span>
                          <div>
                            <div>{st.stateName}</div>
                            <div className="text-[10px] font-normal text-slate-500">{st.authority}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs">
                        {st.statutoryBasis}
                      </td>
                      {PERMIT_CLASSES.map((c) => {
                        const val = st.rates?.[c.key] ?? 0;
                        return (
                          <td key={c.key} className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center justify-end bg-slate-50 border border-slate-300 rounded-md px-2 py-1 focus-within:ring-2 focus-within:ring-slate-900">
                              <span className="text-slate-500 font-mono-code mr-1">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="50"
                                value={val}
                                onChange={(e) => handlePermitRateChange(code, c.key, e.target.value)}
                                className="w-16 text-right font-mono-code font-bold text-[#1A1C1E] bg-transparent focus:outline-none"
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TABLE 2: OUTSTATION PER-KM & LOCAL FLEET (CARS + TEMPO/COACH FLEET)   */}
      {/* ===================================================================== */}
      {(activeSection === 'ALL' || activeSection === 'VEHICLES') && (
        <section className="bg-white rounded-m3-xl border border-m3-outline-variant/80 shadow-m3-1 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-m3-outline-variant/60 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-slate-900" />
                <h3 className="text-sm sm:text-base font-black text-[#1A1C1E]">
                  2A. Standard Outstation & Local Vehicles (4+1 to 16+1 Seater)
                </h3>
              </div>
              <p className="text-xs text-m3-on-surface-variant mt-0.5">
                Standard 250 km/day minimum for Outstation Cars (300 km/day for Tempo/Urbania) • City Local Hourly Packages (5Hr, 8Hr, 10Hr, 12Hr).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-m3-outline-variant/60 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <th className="py-3 px-4">Vehicle Model</th>
                  <th className="py-3 px-2.5 text-right">One-Way /km</th>
                  <th className="py-3 px-2.5 text-right">Round Trip /km</th>
                  <th className="py-3 px-2.5 text-right">Driver Bata</th>
                  <th className="py-3 px-2.5 text-right">Min Km/Day</th>
                  <th className="py-3 px-2.5 text-right">5Hr / 50km</th>
                  <th className="py-3 px-2.5 text-right">8Hr / 80km</th>
                  <th className="py-3 px-2.5 text-right">10Hr / 100km</th>
                  <th className="py-3 px-2.5 text-right">12Hr / 120km</th>
                  <th className="py-3 px-2.5 text-right">Extra /Hr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {Object.entries(tariff.vehicles || {}).map(([vName, vData]) => (
                  <tr key={vName} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-bold text-[#1A1C1E] whitespace-nowrap">
                      <div>{vName}</div>
                      <div className="text-[10px] font-normal text-slate-500">
                        {vData.seats || ''} • Permit class: <span className="font-mono-code uppercase">{vData.category || 'sedan'}</span>
                      </div>
                    </td>
                    {[
                      { field: 'one_way_rate', step: 1, width: 'w-12' },
                      { field: 'round_trip_rate', step: 1, width: 'w-12' },
                      { field: 'driver_bata', step: 50, width: 'w-14' },
                      { field: 'min_km_per_day', step: 10, width: 'w-14', isKm: true },
                      { field: 'local_5hr_pkg', step: 100, width: 'w-16' },
                      { field: 'local_8hr_pkg', step: 100, width: 'w-16' },
                      { field: 'local_10hr_pkg', step: 100, width: 'w-16' },
                      { field: 'local_12hr_pkg', step: 100, width: 'w-16' },
                      { field: 'extra_hr_rate', step: 50, width: 'w-12' }
                    ].map((col) => (
                      <td key={col.field} className="py-2 px-2.5 text-right">
                        <div className="inline-flex items-center justify-end bg-slate-50 border border-slate-300 rounded px-1.5 py-1">
                          {!col.isKm && <span className="text-slate-500 font-mono-code mr-0.5">₹</span>}
                          <input
                            type="number"
                            step={col.step}
                            value={vData[col.field] ?? 0}
                            onChange={(e) => handleVehicleFieldChange(vName, col.field, e.target.value)}
                            className={`${col.width} text-right font-mono-code font-bold text-[#1A1C1E] bg-transparent focus:outline-none`}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2B. Tempo Traveller & Luxury Coach Fleet */}
          <div className="p-4 sm:p-5 border-t border-b border-m3-outline-variant/60 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-slate-900" />
              <div>
                <h4 className="text-sm font-black text-[#1A1C1E]">
                  2B. Group Van, Tempo Traveller & Force Urbania Fleet (12S to 26S Mini Bus)
                </h4>
                <p className="text-xs text-m3-on-surface-variant">
                  Unified Tempo & Coach tiers formerly hardcoded inside `QuotationEngine.jsx`.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-m3-outline-variant/60 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <th className="py-3 px-4">Coach / Van Model</th>
                  <th className="py-3 px-3">Permit Tier</th>
                  <th className="py-3 px-3 text-right">Round Trip /km</th>
                  <th className="py-3 px-3 text-right">One-Way /km</th>
                  <th className="py-3 px-3 text-right">Driver Bata /Day</th>
                  <th className="py-3 px-3 text-right">Min Km/Day</th>
                  <th className="py-3 px-3 text-right">Local 8Hr/80km</th>
                  <th className="py-3 px-3 text-right">Extra /Hr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {Object.entries(tariff.tempo_fleet || {}).map(([modelKey, tv]) => (
                  <tr key={modelKey} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-bold text-[#1A1C1E]">
                      <div>{tv.name || modelKey}</div>
                      <div className="text-[10px] font-normal text-slate-500">{tv.seats} Seats • {tv.shortName}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono-code text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {tv.category}
                      </span>
                    </td>
                    {[
                      { field: 'round_trip_rate', step: 1, isKm: false },
                      { field: 'one_way_rate', step: 1, isKm: false },
                      { field: 'driver_bata', step: 50, isKm: false },
                      { field: 'min_km_per_day', step: 50, isKm: true },
                      { field: 'local_8hr_pkg', step: 100, isKm: false },
                      { field: 'extra_hr_rate', step: 50, isKm: false }
                    ].map((col) => (
                      <td key={col.field} className="py-2 px-3 text-right">
                        <div className="inline-flex items-center justify-end bg-slate-50 border border-slate-300 rounded px-2 py-1">
                          {!col.isKm && <span className="text-slate-500 font-mono-code mr-0.5">₹</span>}
                          <input
                            type="number"
                            step={col.step}
                            value={tv[col.field] ?? 0}
                            onChange={(e) => handleTempoFleetChange(modelKey, col.field, e.target.value)}
                            className="w-16 text-right font-mono-code font-bold text-[#1A1C1E] bg-transparent focus:outline-none"
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TABLE 3: CURATED TOUR PACKAGES (1D / 2D / 3D)                         */}
      {/* ===================================================================== */}
      {(activeSection === 'ALL' || activeSection === 'TOURS') && (
        <section className="bg-white rounded-m3-xl border border-m3-outline-variant/80 shadow-m3-1 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-m3-outline-variant/60 bg-slate-50">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-slate-900" />
              <h3 className="text-sm sm:text-base font-black text-[#1A1C1E]">
                3. Fixed Tour Packages Matrix (1-Day All-Inclusive vs Multi-Day + State Permit)
              </h3>
            </div>
            <p className="text-xs text-m3-on-surface-variant mt-0.5">
              Base package rates below cover Vehicle Hire + Fuel + Driver Bata. On <strong>1-Day Packages</strong>, Tolls & State Entry Permits are bundled (`₹0 Extra`). On <strong>2-Day / 3-Day Interstate Packages</strong> (Tirupati AP, Pondicherry PY, Sabarimala KL), the vehicle-specific State Entry Permit from Table 1 is automatically added to Total Fare.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-m3-outline-variant/60 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <th className="py-3 px-4">Tour Package & State</th>
                  <th className="py-3 px-3">Duration Tier</th>
                  {TOUR_VEHICLES.map((tv) => (
                    <th key={tv.key} className="py-3 px-3 text-right">{tv.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {Object.entries(tariff.tour_packages || {}).map(([slug, pkg]) => {
                  const minDays = pkg.minDays || 1;
                  const dayKeys = minDays === 3 ? ['3'] : minDays === 2 ? ['2', '3'] : ['1', '2', '3'];
                  return dayKeys.map((dayKey, tIdx) => {
                    const isMultiDay = dayKey !== '1';
                    const tierLabel =
                      dayKey === '1' ? '1-Day (≤24h)' : dayKey === '2' ? '2-Day Pack' : '3-Day Pack';
                    return (
                      <tr key={`${slug}-${dayKey}`} className="hover:bg-slate-50/80">
                        {tIdx === 0 && (
                          <td rowSpan={dayKeys.length} className="py-3 px-4 font-bold text-[#1A1C1E] align-top border-r border-slate-200/70">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono-code text-[10px] font-black">
                                {pkg.stateCode}
                              </span>
                              <span>{pkg.name}</span>
                            </div>
                            <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                              Round Trip: ~{pkg.roundTripKm} km
                            </div>
                          </td>
                        )}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            isMultiDay ? 'bg-slate-100 text-[#1A1C1E]' : 'bg-emerald-50 text-emerald-900'
                          }`}>
                            {tierLabel}
                          </span>
                        </td>
                        {TOUR_VEHICLES.map((tv) => {
                          const baseTotal = pkg.vehicles?.[tv.key]?.rates?.[dayKey] ?? 0;
                          const permitObj = getStatePermitForRoute({
                            stateCode: pkg.stateCode,
                            vehicleIdOrName: tv.key,
                            is1DayFixedTourPackage: !isMultiDay,
                            tariff
                          });
                          const permitAmt = permitObj.amount || 0;
                          return (
                            <td key={tv.key} className="py-2 px-3 text-right">
                              <div className="inline-flex items-center justify-end bg-slate-50 border border-slate-300 rounded px-2 py-1">
                                <span className="text-slate-500 font-mono-code mr-0.5">₹</span>
                                <input
                                  type="number"
                                  step="100"
                                  value={baseTotal}
                                  onChange={(e) => handleTourRateChange(slug, dayKey, tv.key, e.target.value)}
                                  className="w-16 text-right font-mono-code font-bold text-[#1A1C1E] bg-transparent focus:outline-none"
                                />
                              </div>
                              {isMultiDay && permitAmt > 0 && (
                                <div className="text-[10px] font-mono-code font-semibold text-emerald-800 mt-0.5">
                                  +₹{permitAmt.toLocaleString('en-IN')} {pkg.stateCode} Permit = ₹{(baseTotal + permitAmt).toLocaleString('en-IN')}
                                </div>
                              )}
                              {!isMultiDay && pkg.stateCode !== 'TN' && (
                                <div className="text-[10px] font-mono-code text-slate-500 mt-0.5">
                                  Permit Bundled (₹0)
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TABLE 4: CHENNAI AIRPORT ZONES, INTERSTATE DROPS & ACTING DRIVERS     */}
      {/* ===================================================================== */}
      {(activeSection === 'ALL' || activeSection === 'AIRPORT') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 4A. Chennai Airport City Zones */}
          <section className="bg-white rounded-m3-xl border border-m3-outline-variant/80 shadow-m3-1 overflow-hidden">
            <div className="p-4 border-b border-m3-outline-variant/60 bg-slate-50">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-slate-900" />
                <h3 className="text-sm font-black text-[#1A1C1E]">
                  4A. Chennai Airport (MAA) City Zone Slabs
                </h3>
              </div>
              <p className="text-xs text-m3-on-surface-variant mt-0.5">
                Flat city pickup/drop base fares for Sedan (Ertiga 1.5×, Innova 1.8×, Crysta 2.0×, Tempo 2.8×).
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-m3-outline-variant/60 text-[11px] font-black uppercase text-slate-700">
                    <th className="py-2.5 px-4">Chennai Locality Zone</th>
                    <th className="py-2.5 px-3 text-right">Sedan Base</th>
                    <th className="py-2.5 px-3 text-right">Ertiga (1.5×)</th>
                    <th className="py-2.5 px-3 text-right">Crysta (2.0×)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {Object.entries(tariff.airport_tariffs?.city_zones || {}).map(([zoneKey, z]) => (
                    <tr key={zoneKey} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-bold text-[#1A1C1E]">
                        <div>{z.label}</div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="inline-flex items-center justify-end bg-slate-50 border border-slate-300 rounded px-2 py-1">
                          <span className="text-slate-500 font-mono-code mr-0.5">₹</span>
                          <input
                            type="number"
                            step="50"
                            value={z.sedan_base ?? 0}
                            onChange={(e) => handleAirportZoneChange(zoneKey, e.target.value)}
                            className="w-14 text-right font-mono-code font-bold text-[#1A1C1E] bg-transparent focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono-code font-semibold text-[#1A1C1E]">
                        ₹{(Math.round(((z.sedan_base || 0) * 1.5) / 50) * 50).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono-code font-semibold text-[#1A1C1E]">
                        ₹{(Math.round(((z.sedan_base || 0) * 2.0) / 50) * 50).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4B. Acting Driver Service Tariff */}
          <section className="bg-white rounded-m3-xl border border-m3-outline-variant/80 shadow-m3-1 overflow-hidden">
            <div className="p-4 border-b border-m3-outline-variant/60 bg-slate-50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-slate-900" />
                <h3 className="text-sm font-black text-[#1A1C1E]">
                  4B. Acting Driver Tariff (For Customer-Owned Cars)
                </h3>
              </div>
              <p className="text-xs text-m3-on-surface-variant mt-0.5">
                Outstation Daily Chauffeur Bata • Food Allowance: ₹{tariff.acting_drivers?.food_per_day ?? 300}/day • Stay: ₹{tariff.acting_drivers?.stay_per_night ?? 300}/night.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-m3-outline-variant/60 text-[11px] font-black uppercase text-slate-700">
                    <th className="py-2.5 px-4">Car Category & Models</th>
                    <th className="py-2.5 px-3 text-right">Daily Bata (Outstation)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {(tariff.acting_drivers?.vehicles || []).map((av, idx) => (
                    <tr key={av.key || idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-bold text-[#1A1C1E]">
                        <div>{av.label}</div>
                        <div className="text-[10px] font-normal text-slate-500">{av.models}</div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="inline-flex items-center justify-end bg-slate-50 border border-slate-300 rounded px-2 py-1">
                          <span className="text-slate-500 font-mono-code mr-0.5">₹</span>
                          <input
                            type="number"
                            step="50"
                            value={av.bata ?? 0}
                            onChange={(e) => handleActingDriverChange(idx, e.target.value)}
                            className="w-16 text-right font-mono-code font-bold text-[#1A1C1E] bg-transparent focus:outline-none"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
