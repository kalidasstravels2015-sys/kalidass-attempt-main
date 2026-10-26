import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Car,
  Calendar,
  MapPin,
  Send,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Upload,
  Mic,
  ArrowRight,
  RefreshCw,
  Phone,
  User,
  ExternalLink,
  ChevronRight,
  Layers
} from 'lucide-react';
import tariffConfig from '../../data/tariff_config.json';

const POPULAR_DESTINATIONS = [
  { name: 'Puducherry / Pondy', km: 151 },
  { name: 'Tirupati Balaji', km: 135 },
  { name: 'Bangalore / BLR', km: 346 },
  { name: 'Vellore Golden Temple', km: 137 },
  { name: 'Chidambaram / Pichavaram', km: 225 },
  { name: 'Kumbakonam Temples', km: 298 },
  { name: 'Thiruvannamalai Girivalam', km: 195 },
  { name: 'Mahabalipuram ECR', km: 56 }
];

const VEHICLES = [
  { key: 'Swift Dzire', label: 'Sedan (Dzire / Etios)', rate: 14, bata: 400, minKm: 250 },
  { key: 'Maruti Ertiga', label: 'Ertiga (6 Pax)', rate: 17, bata: 500, minKm: 250 },
  { key: 'Innova', label: 'Innova (7 Pax)', rate: 20, bata: 600, minKm: 250 },
  { key: 'Innova Crysta', label: 'Innova Crysta', rate: 22, bata: 700, minKm: 250 },
  { key: 'Tempo Traveller', label: 'Tempo 12-Seater', rate: 24, bata: 800, minKm: 300 }
];

export default function FastQuoteDesk() {
  // Security PIN state (Default PIN 2015)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('kt_admin_pin_verified');
      if (saved === 'true') setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pinInput.trim() === '2015') {
      setIsUnlocked(true);
      sessionStorage.setItem('kt_admin_pin_verified', 'true');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // Mode: 'quick' (1-Tap Buttons) or 'ai' (Paste Text / Upload Audio)
  const [mode, setMode] = useState('ai');

  // Input states
  const [rawText, setRawText] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('Guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickup, setPickup] = useState('Chennai Airport');
  const [destination, setDestination] = useState('Puducherry & Pichavaram');
  const [days, setDays] = useState(4);
  const [vehicleKey, setVehicleKey] = useState('Swift Dzire');
  const [tripType, setTripType] = useState('Round Trip');
  const [distanceKmOneWay, setDistanceKmOneWay] = useState(151);
  const [travelDates, setTravelDates] = useState('26 Nov to 29 Nov');
  const [notes, setNotes] = useState('');

  // Editable bill text
  const [editableBill, setEditableBill] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedLead, setSavedLead] = useState(false);

  // Synchronize calculation
  const calculation = useMemo(() => {
    const vConfig = tariffConfig.vehicles[vehicleKey] || tariffConfig.vehicles['Swift Dzire'];
    const minKm = days * (vConfig.min_km_per_day || 250);
    const rate = tripType === 'One Way Drop' ? vConfig.one_way_rate : vConfig.round_trip_rate;
    const dailyBata = vConfig.driver_bata || 400;

    const baseDistance = tripType === 'Round Trip' ? distanceKmOneWay * 2 : distanceKmOneWay;
    const localRunBuffer = tripType === 'Round Trip' && days > 1 ? (days - 1) * 40 : 20;
    const actualEstimatedRun = baseDistance + localRunBuffer;

    const billableKm = Math.max(minKm, actualEstimatedRun);
    const carHire = billableKm * rate;
    const driverBataTotal = days * dailyBata;
    const totalFare = carHire + driverBataTotal;

    // Real out-of-pocket costs (for zero-loss protection)
    const mileage = vehicleKey.includes('Tempo') ? 7.5 : vehicleKey.includes('Innova') ? 11.5 : 16.5;
    const realFuelCost = Math.round((actualEstimatedRun / mileage) * 93.5);
    const hardCost = realFuelCost + driverBataTotal;
    const netProfit = totalFare - hardCost;
    const isSafe = netProfit >= (days * 1000);

    let tollsEstimate = 'approx Rs 700 total';
    const destLower = destination.toLowerCase();
    if (destLower.includes('tirupati')) tollsEstimate = 'approx Rs 400 + Rs 500 AP Permit';
    else if (destLower.includes('bangalore')) tollsEstimate = 'approx Rs 450 + Rs 700 KA Permit';

    return {
      billableKm,
      rate,
      carHire,
      dailyBata,
      driverBataTotal,
      totalFare,
      realFuelCost,
      hardCost,
      netProfit,
      isSafe,
      tollsEstimate
    };
  }, [vehicleKey, days, tripType, distanceKmOneWay, destination]);

  // Update bill text whenever parameters change
  useEffect(() => {
    const bill = `KALIDASS TRAVELS - TRIP QUOTATION

Customer: ${customerName}
Trip: ${pickup} to ${destination}
Car: ${vehicleKey} AC
Dates: ${travelDates} (${days} ${days === 1 ? 'Day' : 'Days'})

------------------------------------------
BILL BREAKUP
------------------------------------------
1. Car and Fuel (${calculation.billableKm.toLocaleString('en-IN')} km @ Rs ${calculation.rate}/km) : Rs ${calculation.carHire.toLocaleString('en-IN')}
2. Driver Allowance (${days} ${days === 1 ? 'Day' : 'Days'} @ Rs ${calculation.dailyBata}/day) : Rs ${calculation.driverBataTotal.toLocaleString('en-IN')}
------------------------------------------
TOTAL ESTIMATE : Rs ${calculation.totalFare.toLocaleString('en-IN')}
------------------------------------------

What is included:
- AC ${vehicleKey} for all ${days} ${days === 1 ? 'day' : 'days'}
- Complete fuel for ${calculation.billableKm.toLocaleString('en-IN')} km run
- Driver allowance for all ${days} ${days === 1 ? 'day' : 'days'}

Extra charges (pay on actual bill):
- Highway tolls and parking (${calculation.tollsEstimate})
- Driver night stay (approx Rs 350 per night, only if your hotel has no free driver stay)
- Extra run above ${calculation.billableKm.toLocaleString('en-IN')} km (Rs ${calculation.rate} per km)

GST Bill:
- If you need a GST tax invoice, 5% GST bill can be provided.

To book:
- Advance payment is Rs 500. Balance you can pay to the driver during the trip.`;

    setEditableBill(bill);
  }, [customerName, pickup, destination, vehicleKey, travelDates, days, calculation]);

  // AI Extraction via API
  const handleRunAiAnalysis = async () => {
    if (!rawText.trim() && !audioFile) return;
    setIsAnalyzing(true);

    try {
      let audioBase64 = null;
      let audioMimeType = 'audio/mp3';

      if (audioFile) {
        audioMimeType = audioFile.type || 'audio/mp3';
        const reader = new FileReader();
        audioBase64 = await new Promise((resolve) => {
          reader.onload = () => {
            const res = String(reader.result || '');
            const base64 = res.split(',')[1] || '';
            resolve(base64);
          };
          reader.readAsDataURL(audioFile);
        });
      }

      const res = await fetch('/api/quote-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'ai',
          text: rawText,
          audioBase64,
          audioMimeType
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.extracted) {
          const ex = data.extracted;
          if (ex.customerName && ex.customerName !== 'Guest') setCustomerName(ex.customerName);
          if (ex.customerPhone) setCustomerPhone(ex.customerPhone);
          if (ex.pickup) setPickup(ex.pickup);
          if (ex.destination) setDestination(ex.destination);
          if (ex.travelDates) setTravelDates(ex.travelDates);
          if (ex.days) setDays(Number(ex.days) || 1);
          if (ex.vehicleKey) setVehicleKey(ex.vehicleKey);
          if (ex.tripType) setTripType(ex.tripType);
          if (ex.estimatedKmOneWay) setDistanceKmOneWay(Number(ex.estimatedKmOneWay) || 150);
          if (ex.notes) setNotes(ex.notes);
        }
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(editableBill);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open WhatsApp with message pre-filled
  const handleOpenWhatsApp = () => {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '').slice(-10);
    const encoded = encodeURIComponent(editableBill);
    if (cleanPhone.length === 10) {
      window.open(`https://wa.me/91${cleanPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  // Save as Lead to admin console
  const handleSaveToAdminLeads = () => {
    try {
      const cleanPhone = customerPhone.replace(/[^0-9]/g, '').slice(-10);
      const newLead = {
        bookingId: `#QUO-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
        guestName: customerName,
        phone: cleanPhone ? `+91 ${cleanPhone}` : '+91 99901 81165',
        pickup,
        drop: destination,
        date: travelDates,
        vehicle: vehicleKey,
        fare: calculation.totalFare,
        status: 'QUOTED_PENDING_ADVANCE',
        notes: notes || 'Quoted via Fast Quote Desk'
      };

      const existing = JSON.parse(localStorage.getItem('kt_solo_real_bookings_v8') || '[]');
      existing.unshift(newLead);
      localStorage.setItem('kt_solo_real_bookings_v8', JSON.stringify(existing));
      setSavedLead(true);
      setTimeout(() => setSavedLead(false), 2500);
    } catch (_) {}
  };

  // Security Gate
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 text-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-700 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-1">Fast Quote Desk</h1>
          <p className="text-xs text-slate-400 mb-6">Owner Operations Security Gate</p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="Enter PIN (2015)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center text-2xl font-mono tracking-widest py-3 px-4 rounded-2xl bg-slate-900 border border-slate-600 focus:outline-none focus:border-blue-500 text-white"
              autoFocus
            />
            {pinError && <p className="text-xs text-rose-400 font-medium">Incorrect PIN. Try 2015</p>}
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 font-bold text-sm text-white transition shadow-lg cursor-pointer"
            >
              Unlock Quote Desk
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-28">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 border-b border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
            KT
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Fast Quote Desk</h1>
            <p className="text-[10px] text-slate-400">Mobile Quotation &amp; Zero-Loss Guard</p>
          </div>
        </div>
        <a
          href="/admin/"
          className="text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1"
        >
          <span>Admin Console</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto p-3 sm:p-4 space-y-4">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200 rounded-2xl border border-slate-300">
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'ai' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI Auto-Read</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'quick' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>1-Tap Buttons</span>
          </button>
        </div>

        {/* MODE A: AI ASSISTANT (Paste Text or Upload Audio) */}
        {mode === 'ai' && (
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Paste Customer Message or Audio
              </span>
              {isAnalyzing && (
                <span className="text-[11px] text-blue-600 font-semibold animate-pulse flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing with Gemini...
                </span>
              )}
            </div>

            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste WhatsApp text here... (Example: '26th Nov pickup Chennai airport sedan, 26 to 28 Puducherry, 29th Pichavaram & return airport')"
              className="w-full text-xs sm:text-sm p-3 rounded-2xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />

            <div className="flex items-center gap-2 pt-1">
              <label className="flex-1 py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-2 text-xs font-medium text-slate-700">
                <Mic className="w-4 h-4 text-slate-500" />
                <span className="truncate">{audioFile ? audioFile.name : 'Upload Call Audio / Voice Note'}</span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                />
              </label>

              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzing || (!rawText.trim() && !audioFile)}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <span>AI Calculate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* MODE B: 1-TAP QUICK SELECTOR & DETAILS */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Trip Configuration</h2>

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tarun Mathur"
                className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">WhatsApp Phone</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="9990181165"
                className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Vehicle Selection Chips */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Select Vehicle</label>
            <div className="flex flex-wrap gap-1.5">
              {VEHICLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setVehicleKey(v.key)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    vehicleKey === v.key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {v.label} (₹{v.rate}/km)
                </button>
              ))}
            </div>
          </div>

          {/* Days Selection Chips */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Duration (Days)</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`min-w-[42px] py-1.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                    days === d
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {d} {d === 1 ? 'Day' : 'Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Route Chips */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Popular Routes</label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_DESTINATIONS.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => {
                    setDestination(r.name);
                    setDistanceKmOneWay(r.km);
                  }}
                  className={`py-1 px-2.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                    destination === r.name
                      ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {r.name} (~{r.km} km)
                </button>
              ))}
            </div>
          </div>

          {/* Destination & Date Row */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Destination Name</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Travel Dates Label</label>
              <input
                type="text"
                value={travelDates}
                onChange={(e) => setTravelDates(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* INTERNAL ZERO-LOSS GUARD (OWNER EYES ONLY) */}
        <div className={`rounded-3xl p-4 sm:p-5 border shadow-xs ${
          calculation.isSafe
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            : 'bg-amber-50/80 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Internal Zero-Loss Guard (Owner Eyes Only)
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              calculation.isSafe ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              {calculation.isSafe ? 'Safe • 0% Loss' : '⚠️ Low Margin'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 pb-1 border-t border-emerald-200/60">
            <div>
              <div className="text-[10px] text-slate-600 font-medium">Real Fuel Cost</div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">₹{calculation.realFuelCost.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-600 font-medium">Driver Bata</div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">₹{calculation.driverBataTotal.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-800 font-bold">Your Net Profit</div>
              <div className="text-xs sm:text-sm font-extrabold text-emerald-700 mt-0.5">+₹{calculation.netProfit.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 text-center">
            Formula: {days} days × {vehicleKey.includes('Tempo') ? 300 : 250} km min ({calculation.billableKm} km) @ ₹{calculation.rate}/km + ₹{calculation.driverBataTotal} bata.
          </p>
        </div>

        {/* RESTAURANT BILL CUSTOMER QUOTATION */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Customer Restaurant-Bill Quote
            </span>
            <span className="text-[11px] text-slate-500 font-medium">4th Grade English • No Icons</span>
          </div>

          <textarea
            rows={14}
            value={editableBill}
            onChange={(e) => setEditableBill(e.target.value)}
            className="w-full text-xs font-mono p-3 rounded-2xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-blue-500 text-slate-800 leading-relaxed"
          />

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>You can edit any line directly in the box above before sending.</span>
          </div>
        </div>
      </main>

      {/* STICKY BOTTOM ACTION BAR (MOBILE THUMB ACCESSIBLE) */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 z-40 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          {/* WhatsApp Button */}
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Save Lead Button */}
          <button
            type="button"
            onClick={handleSaveToAdminLeads}
            title="Save as Active Lead in Admin Console"
            className="py-3 px-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition cursor-pointer"
          >
            {savedLead ? <Check className="w-4 h-4 text-emerald-600" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
