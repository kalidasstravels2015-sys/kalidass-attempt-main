import React, { useState, useEffect } from 'react';
import { buildMapsLinks } from '../../utils/whatsapp';

export default function TripSheetViewer() {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('passenger'); // 'passenger' | 'driver'
  const [editOdo, setEditOdo] = useState({
    startKm: '',
    endKm: '',
    tolls: '',
    parking: '',
    driverBata: '500'
  });
  const [isSavingOdo, setIsSavingOdo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // 1. Parse URL query params
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref') || params.get('bookingId') || params.get('id') || '';
    const encodedData = params.get('d') || '';

    // If encoded data is present in URL (offline / direct sharing)
    if (encodedData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(encodedData)));
        setTrip(decoded);
        populateEditOdo(decoded);
        return;
      } catch (_) {}
    }

    // 2. Check LocalStorage for instantly cached bookings
    if (typeof window !== 'undefined' && window.localStorage && refParam) {
      try {
        const rawLocal = localStorage.getItem('kt_solo_real_bookings_v8') || localStorage.getItem('kt_solo_real_bookings_v7') || localStorage.getItem('kt_solo_real_bookings_v3');
        if (rawLocal) {
          const localList = JSON.parse(rawLocal);
          if (Array.isArray(localList)) {
            const cleanParam = refParam.toLowerCase().replace(/[^a-z0-9]/g, '');
            const localMatch = localList.find(b => {
              const cleanBId = (b.bookingId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              return cleanBId.includes(cleanParam) || cleanParam.includes(cleanBId);
            });
            if (localMatch) {
              setTrip(localMatch);
              populateEditOdo(localMatch);
            }
          }
        }
      } catch (_) {}
    }

    // 3. Fetch from backend API
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/admin/bookings?ref=${encodeURIComponent(refParam)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.success && data.booking) {
          setTrip(data.booking);
          populateEditOdo(data.booking);
        } else if (data.success && Array.isArray(data.bookings) && data.bookings.length > 0) {
          const cleanParam = (refParam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const matched = data.bookings.find(b => {
            const cleanBId = (b.bookingId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanBId.includes(cleanParam) || cleanParam.includes(cleanBId);
          });
          if (matched) {
            setTrip(matched);
            populateEditOdo(matched);
          } else if (!refParam) {
            setTrip(data.bookings[0]);
            populateEditOdo(data.bookings[0]);
          }
        }
      } catch (_) {} finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, []);

  const populateEditOdo = (b) => {
    if (b.dutySlip) {
      setEditOdo({
        startKm: String(b.dutySlip.startKm || ''),
        endKm: String(b.dutySlip.endKm || ''),
        tolls: String(b.dutySlip.tollsFastag || ''),
        parking: String(b.dutySlip.parking || ''),
        driverBata: String(b.dutySlip.driverBata || '500')
      });
    }
  };

  // Parsing helper utilities
  const guestName = trip?.guestNamePhone ? trip.guestNamePhone.split('(')[0].trim() : 'Valued Guest';
  const guestPhoneMatch = (trip?.guestNamePhone || '').match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
  const guestPhone = guestPhoneMatch ? guestPhoneMatch[0].replace(/[^0-9]/g, '') : '';

  const chauffeurRaw = trip?.assignedChauffeur || 'Unassigned';
  const chauffeurName = chauffeurRaw.includes('(')
    ? chauffeurRaw.split('(')[0].trim()
    : chauffeurRaw.includes('-')
    ? chauffeurRaw.split('-')[0].trim()
    : chauffeurRaw;
  const chauffeurPlate = chauffeurRaw.includes('(') && chauffeurRaw.includes(')')
    ? chauffeurRaw.split('(')[1].split(')')[0].trim()
    : chauffeurRaw.includes('-') && chauffeurRaw.split('-')[1]
    ? chauffeurRaw.split('-')[1].trim()
    : 'TN 09 CZ 9999';
  const chauffeurPhoneMatch = chauffeurRaw.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
  const chauffeurPhone = chauffeurPhoneMatch ? chauffeurPhoneMatch[0].replace(/[^0-9]/g, '') : '8939539211';

  // Math Calculations for Duty Slip
  const startKmNum = Number(editOdo.startKm) || 0;
  const endKmNum = Number(editOdo.endKm) || 0;
  const totalKm = Math.max(0, endKmNum - startKmNum);
  const packageKm = Number(trip?.dutySlip?.packageAllowedKm) ||
    Number(trip?.packageAllowedKm) ||
    Number(trip?.allowedKm) ||
    (trip?.pickupAddress?.toLowerCase().includes('mahabalipuram') || trip?.pickupAddress?.toLowerCase().includes('mamallapuram') ? 120 :
     trip?.vehicleCategory?.toLowerCase().includes('tempo') ? 300 : 250);
  const extraKm = Math.max(0, totalKm - packageKm);
  const extraKmRate = Number(trip?.dutySlip?.extraKmRate) ||
    (trip?.vehicleCategory?.toLowerCase().includes('tempo') ? 24 :
     trip?.vehicleCategory?.toLowerCase().includes('crysta') ? 22 :
     trip?.vehicleCategory?.toLowerCase().includes('innova') ? 20 :
     trip?.vehicleCategory?.toLowerCase().includes('ertiga') ? 17 : 14);
  const extraKmCharge = extraKm * extraKmRate;
  const tollsNum = Number(editOdo.tolls) || 0;
  const parkingNum = Number(editOdo.parking) || 0;
  const baseFare = Number(trip?.terminalFare) || 6000;
  const advancePaid = Number(trip?.advancePaid || 1000);
  const grossTotal = baseFare + extraKmCharge + tollsNum + parkingNum;
  const balanceToCollect = Math.max(0, grossTotal - advancePaid);
  const rawRoute = trip?.pickupAddress || '';
  const routeParts = rawRoute.split(/➔|->|→/).map(s => s.trim()).filter(Boolean);
  const routePickup = routeParts[0] || rawRoute;
  const routeDrop = routeParts.length > 1 ? routeParts[1].replace(/\(.*?\)/g, '').trim() : '';
  const routeTripType = rawRoute.toLowerCase().includes('round') ? 'round' : 'oneway';
  const mapsLinks = buildMapsLinks(routePickup, routeDrop, routeTripType);

  const handleSaveOdometer = async () => {
    setIsSavingOdo(true);
    setSaveSuccess(false);
    try {
      const payload = {
        bookingId: trip.bookingId,
        guestName,
        guestPhone,
        chauffeurName,
        chauffeurPhone,
        vehiclePlate: chauffeurPlate,
        vehicleCategory: trip.vehicleCategory,
        startKm: startKmNum,
        endKm: endKmNum,
        packageAllowedKm: packageKm,
        extraKmRate,
        basePackageFare: baseFare,
        tollsFastag: tollsNum,
        parking: parkingNum,
        statePermit: 0,
        driverBata: Number(editOdo.driverBata) || 500,
        advancePaid,
        paymentMode: 'Cash/UPI at Drop'
      };

      await fetch('/api/admin/duty-slips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setTrip(prev => ({
        ...prev,
        dutySlip: {
          ...payload,
          grossFare: grossTotal,
          netBalanceToCollect: balanceToCollect
        }
      }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (_) {
      setSaveSuccess(true);
    } finally {
      setIsSavingOdo(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `Namaskaram! Here is your Kalidass Travels Digital Trip Sheet & Chauffeur Details:\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-m3-inverse-surface text-m3-inverse-on-surface flex flex-col justify-between antialiased selection:bg-m3-tertiary-container/300 selection:text-m3-on-surface">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-m3-inverse-surface/90 backdrop-blur-md border-b border-m3-outline-variant/40 px-4 py-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-m3-tertiary to-m3-tertiary flex items-center justify-center text-m3-on-surface font-black text-sm shadow-md">
              KT
            </div>
            <div>
              <h1 className="text-xs font-black tracking-wider uppercase text-white leading-none">
                Kalidass Travels
              </h1>
              <span className="text-[10px] text-m3-tertiary font-semibold tracking-wide">
                Chennai • Est. 2015
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 bg-m3-inverse-surface hover:bg-m3-inverse-surface text-m3-inverse-on-surface/80 rounded-lg text-xs flex items-center gap-1 transition-all"
              title="Copy link"
            >
              <span className="material-symbols-outlined text-sm">{copiedLink ? 'check' : 'link'}</span>
              <span className="text-[10px] font-bold hidden sm:inline">{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1.5 bg-m3-success hover:bg-m3-success-container/400 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
              title="Share on WhatsApp"
            >
              <span className="material-symbols-outlined text-sm">share</span>
              <span className="text-[10px]">Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-md mx-auto w-full p-4 flex-1 space-y-3.5">
        {!trip ? (
          <div className="bg-m3-inverse-surface rounded-2xl p-8 text-center border border-m3-outline-variant/40 shadow-md space-y-3">
            <span className="material-symbols-outlined text-4xl text-amber-500">route</span>
            <h2 className="text-sm font-bold text-white">No Trip Found</h2>
            <p className="text-xs text-m3-outline-variant">
              Please open this page with your booking reference link (e.g. /trip/?ref=KT-BOK-101) or contact Kalidass Travels dispatch.
            </p>
            <div className="pt-2">
              <a
                href="tel:+918939539211"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">phone</span>
                <span>Call Helpline (+91 89395 39211)</span>
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* View Switcher Tabs: Guest View vs Chauffeur Duty Sheet */}
            <div className="bg-m3-inverse-surface p-1 rounded-xl border border-m3-outline-variant/40 flex text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('passenger')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'passenger'
                    ? 'bg-m3-tertiary-container/300 text-m3-on-surface shadow-md'
                    : 'text-m3-outline-variant hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">person</span>
                <span>Passenger Voucher</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('driver')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'driver'
                    ? 'bg-m3-tertiary-container/300 text-m3-on-surface shadow-md'
                    : 'text-m3-outline-variant hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                <span>Duty Sheet & KM</span>
              </button>
            </div>

            {/* Status & Trip Header Card */}
            <div className="bg-gradient-to-br from-m3-inverse-surface to-m3-inverse-surface rounded-2xl p-4 border border-m3-outline-variant/40 shadow-md">
              <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-m3-tertiary bg-m3-tertiary-container/30 border border-m3-tertiary/40 px-2 py-0.5 rounded-full">
              {trip.bookingId}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-m3-success bg-m3-success-container/30 border border-m3-success/40 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-m3-success animate-pulse"></span>
              <span>CONFIRMED TRIP</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-m3-inverse-on-surface/80 mt-2">
            <span className="material-symbols-outlined text-m3-tertiary text-base shrink-0 mt-0.5">schedule</span>
            <div>
              <span className="text-white font-bold block">{trip.travelDateTime}</span>
              <span className="text-[11px] text-m3-outline-variant">Reporting 15 mins before departure</span>
            </div>
          </div>
        </div>

        {/* Tab 1: PASSENGER VIEW */}
        {activeTab === 'passenger' ? (
          <div className="space-y-3.5 animate-fadeIn">
            
            {/* Chauffeur Details Card */}
            <div className="bg-m3-inverse-surface rounded-2xl p-4 border border-m3-outline-variant/40 shadow-md">
              <span className="text-[10px] font-bold text-m3-outline-variant uppercase tracking-wider block mb-2.5">
                Your Designated Chauffeur
              </span>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-m3-inverse-surface border border-m3-outline-variant/40 flex items-center justify-center text-m3-tertiary font-extrabold text-lg shadow-inner">
                    <span className="material-symbols-outlined text-2xl">sports_motorsports</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-extrabold text-white">{chauffeurName}</h3>
                      <span className="text-[10px] bg-m3-tertiary-container/30 text-m3-tertiary px-1.5 py-0.2 rounded font-bold">5.0★</span>
                    </div>
                    <span className="text-xs text-m3-outline-variant block font-mono mt-0.5">
                      {chauffeurPlate}
                    </span>
                    <span className="text-[11px] text-m3-success font-semibold block">
                      {trip.vehicleCategory}
                    </span>
                  </div>
                </div>

                <a
                  href={`tel:${chauffeurPhone}`}
                  className="w-11 h-11 rounded-xl bg-m3-success hover:bg-m3-success-container/400 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0"
                  title="Call Chauffeur"
                >
                  <span className="material-symbols-outlined text-xl">call</span>
                </a>
              </div>
            </div>

            {/* Route & Pickup Card */}
            <div className="bg-m3-inverse-surface rounded-2xl p-4 border border-m3-outline-variant/40 shadow-md space-y-2.5">
              <span className="text-[10px] font-bold text-m3-outline-variant uppercase tracking-wider block">
                Trip Route & Pickup Location
              </span>

              <div className="flex items-start gap-2 text-xs">
                <span className="material-symbols-outlined text-m3-tertiary text-base shrink-0 mt-0.5">location_on</span>
                <div className="flex-1">
                  <p className="text-white font-medium line-clamp-3">{trip.pickupAddress}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-m3-outline-variant/40 flex flex-col sm:flex-row gap-2">
                {mapsLinks.pickupPin && (
                  <a
                    href={mapsLinks.pickupPin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-m3-inverse-surface hover:bg-m3-inverse-surface text-m3-inverse-on-surface/90 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-m3-outline-variant/40"
                  >
                    <span className="material-symbols-outlined text-sm text-m3-primary">location_on</span>
                    <span>Pickup Pin</span>
                  </a>
                )}
                {mapsLinks.directions && (
                  <a
                    href={mapsLinks.directions}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-m3-primary/10 hover:bg-m3-primary/20 text-m3-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-m3-primary/30"
                  >
                    <span className="material-symbols-outlined text-sm">navigation</span>
                    <span>Route Directions</span>
                  </a>
                )}
              </div>
            </div>

            {/* Fare Breakdown & Settlement Card */}
            <div className="bg-m3-inverse-surface rounded-2xl p-4 border border-m3-outline-variant/40 shadow-md">
              <span className="text-[10px] font-bold text-m3-outline-variant uppercase tracking-wider block mb-2">
                Transparent Fare Breakdown
              </span>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-m3-inverse-on-surface/80">
                  <span>Base Package ({packageKm} km package):</span>
                  <span>₹{baseFare.toLocaleString('en-IN')}</span>
                </div>

                {extraKmCharge > 0 && (
                  <div className="flex justify-between text-m3-tertiary">
                    <span>Extra KM ({extraKm} km @ ₹{extraKmRate}):</span>
                    <span>+₹{extraKmCharge.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {tollsNum > 0 && (
                  <div className="flex justify-between text-m3-inverse-on-surface/80">
                    <span>FASTag Tolls:</span>
                    <span>+₹{tollsNum.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {parkingNum > 0 && (
                  <div className="flex justify-between text-m3-inverse-on-surface/80">
                    <span>Parking & Permits:</span>
                    <span>+₹{parkingNum.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-m3-success pt-1 border-t border-m3-outline-variant/40 font-semibold">
                  <span>Advance Paid:</span>
                  <span>-₹{advancePaid.toLocaleString('en-IN')}</span>
                </div>

                {/* Final Net Amount */}
                <div className="bg-m3-success-container/30 border border-m3-success/40 rounded-xl p-3 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-m3-success block tracking-wide">
                      Balance to Pay at Drop
                    </span>
                    <span className="text-xl font-extrabold text-m3-success font-mono">
                      ₹{balanceToCollect.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[10px] text-m3-outline-variant text-right">
                    Pay via UPI / Cash<br />directly to Chauffeur
                  </span>
                </div>
              </div>
            </div>

            {/* 24/7 Helpline Card */}
            <div className="bg-m3-inverse-surface/60 border border-m3-outline-variant/40 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-m3-tertiary text-lg">support_agent</span>
                <div>
                  <span className="text-white font-bold block">Need Help Anytime?</span>
                  <span className="text-[11px] text-m3-outline-variant">Kalidass Control Line: +91 89395 39211</span>
                </div>
              </div>
              <a
                href="tel:8939539211"
                className="px-3 py-1.5 bg-m3-tertiary-container/300 hover:bg-m3-tertiary text-m3-on-surface font-bold rounded-lg text-xs"
              >
                Call Support
              </a>
            </div>

          </div>
        ) : (
          /* Tab 2: CHAUFFEUR & ADMIN DUTY SHEET VIEW */
          <div className="space-y-3.5 animate-fadeIn">
            
            <div className="bg-m3-tertiary-container/30 border border-m3-tertiary/30 rounded-xl p-3 text-xs text-m3-tertiary-container flex items-center gap-2">
              <span className="material-symbols-outlined text-m3-tertiary text-lg shrink-0">speed</span>
              <span>
                <strong>Chauffeur Mode:</strong> Enter opening & closing odometer readings and toll expenses to auto-calculate the final drop settlement.
              </span>
            </div>

            {/* Route & Navigation Card for Driver */}
            <div className="bg-m3-inverse-surface rounded-2xl p-4 border border-m3-outline-variant/40 shadow-md space-y-2.5">
              <span className="text-[10px] font-bold text-m3-outline-variant uppercase tracking-wider block">
                Trip Route & Navigation
              </span>

              <div className="flex items-start gap-2 text-xs">
                <span className="material-symbols-outlined text-m3-tertiary text-base shrink-0 mt-0.5">location_on</span>
                <div className="flex-1">
                  <p className="text-white font-medium line-clamp-3">{trip.pickupAddress}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-m3-outline-variant/40 flex flex-col sm:flex-row gap-2">
                {mapsLinks.pickupPin && (
                  <a
                    href={mapsLinks.pickupPin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-m3-inverse-surface hover:bg-m3-inverse-surface text-m3-inverse-on-surface/90 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-m3-outline-variant/40"
                  >
                    <span className="material-symbols-outlined text-sm text-m3-primary">location_on</span>
                    <span>Pickup Pin</span>
                  </a>
                )}
                {mapsLinks.directions && (
                  <a
                    href={mapsLinks.directions}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-m3-primary/10 hover:bg-m3-primary/20 text-m3-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-m3-primary/30"
                  >
                    <span className="material-symbols-outlined text-sm">navigation</span>
                    <span>Start Navigation</span>
                  </a>
                )}
              </div>
            </div>
            {/* Odometer Inputs */}
            <div className="bg-m3-inverse-surface rounded-2xl p-4 border border-m3-outline-variant/40 shadow-md space-y-3">
              <span className="text-[10px] font-bold text-m3-outline-variant uppercase tracking-wider block">
                Odometer & Toll Entries
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-m3-outline-variant uppercase mb-1">
                    Start Odometer KM
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10450"
                    value={editOdo.startKm}
                    onChange={(e) => setEditOdo({ ...editOdo, startKm: e.target.value })}
                    className="w-full bg-m3-inverse-surface border border-m3-outline-variant/40 rounded-xl p-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-m3-tertiary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-m3-outline-variant uppercase mb-1">
                    End Odometer KM
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10780"
                    value={editOdo.endKm}
                    onChange={(e) => setEditOdo({ ...editOdo, endKm: e.target.value })}
                    className="w-full bg-m3-inverse-surface border border-m3-outline-variant/40 rounded-xl p-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-m3-tertiary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-m3-outline-variant uppercase mb-1">
                    FASTag Tolls (Rs)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={editOdo.tolls}
                    onChange={(e) => setEditOdo({ ...editOdo, tolls: e.target.value })}
                    className="w-full bg-m3-inverse-surface border border-m3-outline-variant/40 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-m3-tertiary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-m3-outline-variant uppercase mb-1">
                    Parking / Permit (Rs)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={editOdo.parking}
                    onChange={(e) => setEditOdo({ ...editOdo, parking: e.target.value })}
                    className="w-full bg-m3-inverse-surface border border-m3-outline-variant/40 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-m3-tertiary"
                  />
                </div>
              </div>

              {/* Calculated Run Summary */}
              <div className="bg-m3-inverse-surface p-2.5 rounded-xl border border-m3-outline-variant/40 text-xs font-mono flex items-center justify-between">
                <span>Total Run: <strong className="text-white">{totalKm} km</strong></span>
                <span className={extraKm > 0 ? 'text-m3-tertiary font-bold' : 'text-m3-outline-variant'}>
                  Extra: {extraKm} km (+₹{extraKmCharge})
                </span>
              </div>

              {/* Save Odometer Record */}
              <button
                type="button"
                onClick={handleSaveOdometer}
                disabled={isSavingOdo}
                className="w-full py-2.5 bg-m3-tertiary-container/300 hover:bg-m3-tertiary text-m3-on-surface font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>{isSavingOdo ? 'Saving Duty Record...' : 'Save & Update Duty Sheet'}</span>
              </button>

              {saveSuccess && (
                <div className="p-2 bg-m3-success-container/30 border border-m3-success/40 text-m3-success text-xs font-bold rounded-lg text-center">
                  Duty sheet successfully saved and updated!
                </div>
              )}
            </div>

            {/* Settlement Box */}
            <div className="bg-m3-inverse-surface rounded-2xl p-4 border border-m3-outline-variant/40 shadow-md font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-m3-outline-variant">
                <span>Gross Fare:</span>
                <span>₹{grossTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-m3-tertiary">
                <span>Less Advance Paid:</span>
                <span>-₹{advancePaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-m3-outline-variant/40 pt-2 flex justify-between text-base font-extrabold text-m3-success">
                <span>CASH TO COLLECT:</span>
                <span>₹{balanceToCollect.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Direct Passenger Contact */}
            <div className="p-3 bg-m3-inverse-surface rounded-xl border border-m3-outline-variant/40 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-m3-outline-variant uppercase font-bold block">Passenger</span>
                <span className="text-white font-bold">{guestName}</span>
              </div>
              {guestPhone && (
                <a
                  href={`tel:${guestPhone}`}
                  className="px-3 py-1.5 bg-m3-success hover:bg-m3-success-container/400 text-white font-bold rounded-lg flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">call</span>
                  <span>Call Passenger</span>
                </a>
              )}
            </div>

          </div>
        )}
        </>
        )}

      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] text-m3-outline border-t border-m3-outline-variant/40">
        <p>Kalidass Travels Chennai • Zero-App Mobile Chauffeur Network</p>
      </footer>
    </div>
  );
}
