import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Clipboard,
  Car,
  User,
  Phone,
  Calendar,
  MapPin,
  Users,
  RefreshCw,
  Clock,
  ArrowRight,
  Wand2,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Edit3
} from 'lucide-react';
import tariffConfig from '../../data/tariff_config.json';
import { getStatePermitForRoute } from '../../utils/masterTariff';

const POPULAR_DESTINATIONS = [
  { name: 'Puducherry / Pondy', km: 151, short: 'Pondy' },
  { name: 'Tirupati Balaji', km: 135, short: 'Tirupati' },
  { name: 'Bangalore / BLR', km: 346, short: 'Bangalore' },
  { name: 'Vellore Golden Temple', km: 137, short: 'Vellore' },
  { name: 'Chidambaram / Pichavaram', km: 225, short: 'Pichavaram' },
  { name: 'Kumbakonam Temples', km: 298, short: 'Kumbakonam' },
  { name: 'Thiruvannamalai Girivalam', km: 195, short: 'Tiruvannamalai' },
  { name: 'Mahabalipuram ECR', km: 56, short: 'Mahabalipuram' }
];

const QUICK_ADJUSTMENTS = [
  { label: '⚡ ₹300 Off', prompt: 'Give ₹300 special owner discount on the total estimate' },
  { label: '⚡ ₹500 Off', prompt: 'Give ₹500 special owner discount on the total estimate' },
  { label: '⛰️ Include FASTag Tolls (+₹400)', prompt: 'Include highway FASTag tolls (₹400) directly inside the package total' },
  { label: '🌙 Night Stay (+₹350)', prompt: 'Add ₹350 driver night accommodation allowance under extra charges' },
  { label: '⏰ Pickup: 4:30 AM', prompt: 'Add morning 4:30 AM sharp pickup reporting time in trip details' },
  { label: '✂️ Shorter & Punchier', prompt: 'Condense this quote to be shorter, punchier, and faster to read on mobile WhatsApp' },
  { label: '🇮🇳 Tamil Greeting', prompt: 'Add polite Tamil & English opening: "வணக்கம் / Hello Sir/Madam, greetings from Kalidass Travels!"' }
];

export default function FastQuoteDesk() {
  // Input states
  const [rawText, setRawText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Core trip parameters (Clean, simple, few)
  const [customerName, setCustomerName] = useState('Guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickup, setPickup] = useState('Chennai');
  const [destination, setDestination] = useState('Puducherry');
  const [distanceKmOneWay, setDistanceKmOneWay] = useState(151);
  const [days, setDays] = useState(2);
  const [paxCount, setPaxCount] = useState(7);
  const [vehicleKey, setVehicleKey] = useState('Innova');
  const [travelDates, setTravelDates] = useState('21 Nov to 22 Nov');
  const [tripType, setTripType] = useState('Round Trip');
  const [quoteStyle, setQuoteStyle] = useState('multi'); // 'multi' (default) | 'single'

  // Editable bill text & Custom Modification tracking
  const [editableBill, setEditableBill] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedLead, setSavedLead] = useState(false);
  const [isCustomEdited, setIsCustomEdited] = useState(false);

  // Interactive AI Instruction & History State
  const [aiInstruction, setAiInstruction] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustMessage, setAdjustMessage] = useState(null);
  const [quoteHistory, setQuoteHistory] = useState([]);

  // Instant Smart Client-Side Parser
  const parsePastedText = (text) => {
    if (!text || typeof text !== 'string') return;
    const lower = text.toLowerCase();

    // 1. Seat Count
    const paxMatch = lower.match(/(\d+)\s*(?:members?|people|pax|persons?|seats?)/) ||
                     lower.match(/people\s*[:\-\.]?\s*(\d+)/) ||
                     lower.match(/members\s*[:\-\.]?\s*(\d+)/);
    if (paxMatch) {
      const num = parseInt(paxMatch[1], 10);
      if (num > 0) {
        setPaxCount(num);
        if (num >= 7) setVehicleKey('Innova');
        else if (num >= 5) setVehicleKey('Maruti Ertiga');
        else setVehicleKey('Swift Dzire');
      }
    }

    // 2. Days Count
    const daysMatch = lower.match(/(\d+)\s*(?:days?|day)/) ||
                      lower.match(/days\s*[:\-\.]?\s*(\d+)/);
    if (daysMatch) {
      const d = parseInt(daysMatch[1], 10);
      if (d > 0) setDays(d);
    }

    // 3. Destination
    if (lower.includes('pondi') || lower.includes('puducherry') || lower.includes('pondicherry')) {
      setDestination('Puducherry');
      setDistanceKmOneWay(151);
    } else if (lower.includes('tirupati')) {
      setDestination('Tirupati Balaji');
      setDistanceKmOneWay(135);
    } else if (lower.includes('bangalore') || lower.includes('bengaluru')) {
      setDestination('Bangalore / BLR');
      setDistanceKmOneWay(346);
    } else if (lower.includes('vellore')) {
      setDestination('Vellore Golden Temple');
      setDistanceKmOneWay(137);
    } else if (lower.includes('kumbakonam')) {
      setDestination('Kumbakonam Temples');
      setDistanceKmOneWay(298);
    } else if (lower.includes('thiruvannamalai') || lower.includes('tiruvannamalai')) {
      setDestination('Thiruvannamalai Girivalam');
      setDistanceKmOneWay(195);
    }

    // 4. Phone Number
    const phoneMatch = text.match(/(?:\+91[\s-]?)?([6-9]\d{9})/);
    if (phoneMatch) {
      setCustomerPhone(phoneMatch[1]);
    }

    // 5. Dates
    const dateMatch = text.match(/(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:\s+to\s+\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+)?)/i);
    if (dateMatch) {
      setTravelDates(dateMatch[1]);
    }
  };

  // 1-Tap Paste from Clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(text);
        parsePastedText(text);
        triggerAiAnalysis(text);
      }
    } catch (_) {}
  };

  // AI Extraction via API
  const triggerAiAnalysis = async (textToAnalyze) => {
    const text = textToAnalyze || rawText;
    if (!text.trim()) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/quote-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'ai',
          text
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
          if (ex.paxCount) setPaxCount(Number(ex.paxCount) || 4);
          if (ex.vehicleKey) setVehicleKey(ex.vehicleKey);
          if (ex.tripType) setTripType(ex.tripType);
          if (ex.estimatedKmOneWay) setDistanceKmOneWay(Number(ex.estimatedKmOneWay) || 150);
          setIsCustomEdited(false);
        }
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper for computing vehicle fare
  const getVehicleCalc = (vKey) => {
    const vConfig = tariffConfig.vehicles[vKey] || tariffConfig.vehicles['Swift Dzire'];
    const minKm = days * (vConfig.min_km_per_day || 250);
    const rate = tripType === 'One Way Drop' ? vConfig.one_way_rate : vConfig.round_trip_rate;
    const dailyBata = vConfig.driver_bata || 500;

    const baseDistance = tripType === 'Round Trip' ? distanceKmOneWay * 2 : distanceKmOneWay;
    const localRunBuffer = tripType === 'Round Trip' && days > 1 ? (days - 1) * 40 : 20;
    const actualEstimatedRun = baseDistance + localRunBuffer;

    const billableKm = Math.max(minKm, actualEstimatedRun);
    const carHire = billableKm * rate;
    const driverBataTotal = days * dailyBata;
    const statePermitInfo = getStatePermitForRoute({
      destinationText: `${pickup} ${destination}`,
      vehicleIdOrName: vKey
    });
    const statePermitEst = statePermitInfo.amount || 0;
    const totalFare = carHire + driverBataTotal + statePermitEst;

    const mileage = vKey.includes('Tempo') ? 7.5 : vKey.includes('Innova') ? 11.5 : 16.5;
    const realFuelCost = Math.round((actualEstimatedRun / mileage) * 93.5);
    const hardCost = realFuelCost + driverBataTotal + statePermitEst;
    const netProfit = totalFare - hardCost;

    return {
      billableKm,
      rate,
      carHire,
      dailyBata,
      driverBataTotal,
      statePermitEst,
      statePermitInfo,
      totalFare,
      realFuelCost,
      netProfit
    };
  };

  // Primary calculation
  const primaryCalc = useMemo(() => {
    return getVehicleCalc(vehicleKey);
  }, [vehicleKey, days, tripType, distanceKmOneWay, pickup, destination]);

  // Synchronize Live WhatsApp Quotation (auto-formula)
  useEffect(() => {
    // If the operator has made custom edits or AI adjustments, don't overwrite automatically
    if (isCustomEdited) return;

    const greeting = customerName && customerName !== 'Guest' ? `${customerName} sir` : 'sir/madam';
    let tollsEstimate = 'approx ₹600 - ₹700 via Fastag actuals';
    const destLower = destination.toLowerCase();
    if (destLower.includes('tirupati')) tollsEstimate = 'approx ₹400 Fastag actuals';
    else if (destLower.includes('bangalore')) tollsEstimate = 'approx ₹450 Fastag actuals';

    if (quoteStyle === 'multi') {
      let optionKeys = ['Swift Dzire', 'Maruti Ertiga', 'Innova'];
      if (paxCount >= 7) {
        optionKeys = ['Innova', 'Innova Crysta', 'Tempo Traveller'];
      } else if (paxCount >= 5) {
        optionKeys = ['Maruti Ertiga', 'Innova', 'Innova Crysta'];
      }

      const multiLines = optionKeys.map((key, idx) => {
        const c = getVehicleCalc(key);
        let tag = '';
        let label = key;
        if (key === 'Swift Dzire') label = 'SWIFT DZIRE (Sedan AC)';
        else if (key === 'Maruti Ertiga') label = 'MARUTI ERTIGA (6+1 Seater AC)';
        else if (key === 'Innova') {
          label = 'TOYOTA INNOVA (7+1 Seater AC)';
          tag = paxCount >= 7 ? '\n*(Best budget option for 7 members with soft luggage)*' : '';
        } else if (key === 'Innova Crysta') {
          label = 'INNOVA CRYSTA (7+1 Seater AC)';
          tag = '\n*(Superior comfort & smooth highway ride)*';
        } else if (key === 'Tempo Traveller') {
          label = 'TEMPO TRAVELLER (12-Seater AC)';
          tag = '\n*(Pushback bucket seats, high roof, extra space for 7+ seats & large bags)*';
        }
        const numEmoji = idx === 0 ? '1️⃣' : idx === 1 ? '2️⃣' : '3️⃣';
        const permitLine = c.statePermitEst > 0 ? `\n• State Entry Permit (${c.statePermitInfo.stateName}) : ₹${c.statePermitEst.toLocaleString('en-IN')}` : '';
        return `${numEmoji} ${label}\n• ${c.billableKm.toLocaleString('en-IN')} km @ ₹${c.rate}/km : ₹${c.carHire.toLocaleString('en-IN')}\n• Driver Bata (${days} Days @ ₹${c.dailyBata}) : ₹${c.driverBataTotal.toLocaleString('en-IN')}${permitLine}\n👉 TOTAL ESTIMATE : ₹${c.totalFare.toLocaleString('en-IN')}${tag}`;
      }).join('\n\n');

      const bill = `Hello ${greeting}, greetings from Kalidass Travels! 🙏

Here is the customized fare quotation for your ${days}-Day ${destination} trip:

📋 TRIP DETAILS:
• Pickup: ${pickup}
• Destination: ${destination} (${tripType})
• Dates: ${travelDates} (${days} ${days === 1 ? 'Day' : 'Days'})
• Passengers: ${paxCount} Members
• Package Allowance: ${primaryCalc.billableKm.toLocaleString('en-IN')} km included (Covers round trip + local sightseeing)

------------------------------------------
VEHICLE FARE OPTIONS (${days} ${days === 1 ? 'DAY' : 'DAYS'})
------------------------------------------

${multiLines}

------------------------------------------
WHAT IS INCLUDED:
------------------------------------------
✅ Dedicated AC vehicle for all ${days} ${days === 1 ? 'day' : 'days'} (Doorstep pickup to drop)
✅ Fuel charges up to package km (${primaryCalc.billableKm.toLocaleString('en-IN')} km run)
✅ Driver allowance for all ${days} ${days === 1 ? 'day' : 'days'}${primaryCalc.statePermitEst > 0 ? `\n✅ Official State Entry Permit (${primaryCalc.statePermitInfo.stateName} Checkpost Tax Included)` : ''}
✅ Local sightseeing along the route

EXTRA CHARGES (Actuals):
• Highway Tolls & Parking (${tollsEstimate})
• Driver night stay: ₹350 (only if accommodation is not provided by your hotel)
• Extra km beyond package (billed at standard per km rate)

------------------------------------------
PAYMENT TERMS:
------------------------------------------
1. Booking Advance: ₹500 to confirm & lock your vehicle and chauffeur
   (UPI: 8939539211@okbizaxis - Kalidass Travels)
2. At Trip Start: 50% upon boarding
3. At Trip End: Remaining balance settled at final drop

Please let us know your preferred vehicle choice to confirm your booking! 🚖`;

      setEditableBill(bill);
    } else {
      const bill = `KALIDASS TRAVELS - TRIP QUOTATION

Customer: ${customerName}
Trip: ${pickup} to ${destination}
Car: ${vehicleKey} AC
Dates: ${travelDates} (${days} ${days === 1 ? 'Day' : 'Days'})
Passengers: ${paxCount} Members

------------------------------------------
BILL BREAKUP
------------------------------------------
1. Car and Fuel (${primaryCalc.billableKm.toLocaleString('en-IN')} km @ ₹${primaryCalc.rate}/km) : ₹${primaryCalc.carHire.toLocaleString('en-IN')}
2. Driver Allowance (${days} ${days === 1 ? 'Day' : 'Days'} @ ₹${primaryCalc.dailyBata}/day) : ₹${primaryCalc.driverBataTotal.toLocaleString('en-IN')}${primaryCalc.statePermitEst > 0 ? `\n3. State Entry Permit (${primaryCalc.statePermitInfo.stateName}) : ₹${primaryCalc.statePermitEst.toLocaleString('en-IN')}` : ''}
------------------------------------------
TOTAL ESTIMATE : ₹${primaryCalc.totalFare.toLocaleString('en-IN')}
------------------------------------------

What is included:
- AC ${vehicleKey} for all ${days} ${days === 1 ? 'day' : 'days'}
- Fuel charges for ${primaryCalc.billableKm.toLocaleString('en-IN')} km run
- Driver allowance for all ${days} ${days === 1 ? 'day' : 'days'}${primaryCalc.statePermitEst > 0 ? `\n- Official State Entry Permit (${primaryCalc.statePermitInfo.stateName}): ₹${primaryCalc.statePermitEst.toLocaleString('en-IN')}` : ''}

Extra charges (pay on actuals):
- Highway tolls and parking (${tollsEstimate})
- Driver night stay (₹350 per night, only if hotel has no driver room)
- Extra run above ${primaryCalc.billableKm.toLocaleString('en-IN')} km (₹${primaryCalc.rate} per km)

Payment Terms:
1. Booking Advance: ₹500 to lock vehicle and chauffeur (UPI: 8939539211@okbizaxis)
2. At Trip Start: 50% upon boarding
3. At Trip End: Remaining balance settled at final drop

To book: Please confirm your vehicle choice with Kalidass Travels!`;

      setEditableBill(bill);
    }
  }, [customerName, pickup, destination, vehicleKey, travelDates, days, paxCount, quoteStyle, primaryCalc, isCustomEdited]);

  // AI Adjustment & Natural-Language Correction Engine
  const handleApplyAiAdjustment = async (customPrompt) => {
    const promptToRun = typeof customPrompt === 'string' ? customPrompt : aiInstruction;
    if (!promptToRun.trim() || !editableBill.trim()) return;

    setIsAdjusting(true);
    setAdjustMessage(null);

    // Save to history for 1-click Undo
    setQuoteHistory((prev) => [editableBill, ...prev.slice(0, 4)]);

    try {
      const res = await fetch('/api/quote-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'adjust',
          currentQuote: editableBill,
          instruction: promptToRun,
          tripContext: {
            customerName,
            customerPhone,
            pickup,
            destination,
            days,
            paxCount,
            vehicleKey
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.updatedQuote) {
          setEditableBill(data.updatedQuote);
          setIsCustomEdited(true);
          setAdjustMessage({ type: 'success', text: `✨ Applied: "${promptToRun}"` });
          setAiInstruction('');
          setTimeout(() => setAdjustMessage(null), 4000);
        } else {
          setAdjustMessage({ type: 'error', text: data.error || 'Failed to apply adjustment' });
        }
      } else {
        setAdjustMessage({ type: 'error', text: 'Server error while adjusting quote' });
      }
    } catch (err) {
      console.error('AI Adjustment error:', err);
      setAdjustMessage({ type: 'error', text: 'Network connection issue' });
    } finally {
      setIsAdjusting(false);
    }
  };

  // 1-Click Undo last change
  const handleUndo = () => {
    if (quoteHistory.length > 0) {
      const [previous, ...rest] = quoteHistory;
      setEditableBill(previous);
      setQuoteHistory(rest);
      setAdjustMessage({ type: 'info', text: '↩️ Reverted to previous version' });
      setTimeout(() => setAdjustMessage(null), 3000);
    }
  };

  // Reset to formula auto-sync
  const handleResetToFormula = () => {
    setIsCustomEdited(false);
    setAdjustMessage({ type: 'info', text: '🔄 Re-synced with Quick Tweaks formula' });
    setTimeout(() => setAdjustMessage(null), 3000);
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

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(editableBill);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 pb-16">
      {/* Top Banner: Dead-Simple Quick Quoter */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-base sm:text-lg font-bold">Fast Quote Desk</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Paste WhatsApp message ➔ Instant quote with 3-stage payment policy ➔ 1-Tap send
          </p>
        </div>

        {/* 1-Tap Paste Button (Huge & Prominent) */}
        <button
          type="button"
          onClick={handlePasteClipboard}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Clipboard className="w-4 h-4" />
          <span>📋 1-Tap Paste WhatsApp Text</span>
        </button>
      </div>

      {/* 2-Column Responsive Layout: Inputs on Left, Quote on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Fast Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Box 1: Textarea with Generate Button */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Customer Inquiry Text
              </label>
              {isAnalyzing && (
                <span className="text-[11px] text-blue-600 font-semibold animate-pulse flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Reading...
                </span>
              )}
            </div>

            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                parsePastedText(e.target.value);
              }}
              placeholder="Paste WhatsApp message here... (e.g. '7 members, Chennai to Pondi 2 days 21st Nov 8AM to 22nd Nov 8PM')"
              className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-blue-500 text-slate-900 leading-relaxed"
            />

            <button
              type="button"
              onClick={() => triggerAiAnalysis(rawText)}
              disabled={isAnalyzing || !rawText.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>⚡ Generate / Refresh Quote</span>
            </button>
          </div>

          {/* Box 2: 1-Tap Quick Tweak Pills (Always visible, instant reaction) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quick Tweaks (Tap to change)
            </h2>

            {/* 1. Passenger Count */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> Passengers (Seats)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { pax: 4, label: '1 - 4 Seats (Sedan)', v: 'Swift Dzire' },
                  { pax: 6, label: '5 - 6 Seats (Ertiga)', v: 'Maruti Ertiga' },
                  { pax: 7, label: '7 Seats (Innova)', v: 'Innova' },
                  { pax: 12, label: '8 - 12 Seats (Tempo)', v: 'Tempo Traveller' }
                ].map((item) => (
                  <button
                    key={item.pax}
                    type="button"
                    onClick={() => {
                      setPaxCount(item.pax);
                      setVehicleKey(item.v);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      paxCount === item.pax
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Days */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Trip Duration
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      days === d
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {d} {d === 1 ? 'Day' : 'Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Destination */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Destination
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_DESTINATIONS.map((r) => (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => {
                      setDestination(r.name);
                      setDistanceKmOneWay(r.km);
                    }}
                    className={`py-1 px-2.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      destination.toLowerCase().includes(r.short.toLowerCase())
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r.short} (~{r.km}km)
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Phone & Name Input (Compact) */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Hari"
                  className="w-full text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">WhatsApp Phone</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="8428012695"
                  className="w-full text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive AI Assistant & Live Editable Quote (7 Cols - Big & Clear) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Card 1: Interactive AI Assistant / Conversational Refiner */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-indigo-500/30 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Ask AI to Adjust Quote</span>
                    <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live AI
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Type changes, corrections, discounts, or special notes in plain English:
                  </p>
                </div>
              </div>

              {quoteHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-white/10"
                  title="Undo last change"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-300" />
                  <span>Undo ({quoteHistory.length})</span>
                </button>
              )}
            </div>

            {/* AI Instruction Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApplyAiAdjustment();
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder='e.g. "Reduce ₹300", "Add morning 4:30 AM pickup", "Include AP permit", "Only Dzire & Innova"...'
                  className="w-full text-xs py-2.5 pl-3 pr-8 rounded-xl bg-slate-800/95 border border-indigo-400/30 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
                {aiInstruction && (
                  <button
                    type="button"
                    onClick={() => setAiInstruction('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isAdjusting || !aiInstruction.trim()}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-40 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
              >
                {isAdjusting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Adjusting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    <span>⚡ Adjust with AI</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Tap Action Chips */}
            <div>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-slate-400 font-semibold mr-0.5">1-Tap Shortcuts:</span>
                {QUICK_ADJUSTMENTS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleApplyAiAdjustment(chip.prompt)}
                    disabled={isAdjusting}
                    className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] text-slate-200 hover:text-white transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-40"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status message */}
            {adjustMessage && (
              <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                adjustMessage.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-600/50'
                  : adjustMessage.type === 'info'
                  ? 'bg-blue-950/90 text-blue-300 border border-blue-600/50'
                  : 'bg-rose-950/90 text-rose-300 border border-rose-600/50'
              }`}>
                {adjustMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                {adjustMessage.type === 'info' && <RefreshCw className="w-4 h-4 shrink-0 text-blue-400" />}
                {adjustMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                <span>{adjustMessage.text}</span>
              </div>
            )}
          </div>

          {/* Card 2: Generated WhatsApp Quote & Direct Live Editor */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
            {/* Header with Style Switcher & Margin Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Generated WhatsApp Quote</span>
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Est. Profit: +₹{primaryCalc.netProfit.toLocaleString('en-IN')} (Safe)
                  </span>
                </div>
              </div>

              {/* Multi vs Single Toggle */}
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setQuoteStyle('multi')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                    quoteStyle === 'multi'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3-Option Comparison
                </button>
                <button
                  type="button"
                  onClick={() => setQuoteStyle('single')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                    quoteStyle === 'single'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Single Car
                </button>
              </div>
            </div>

            {/* Direct Edit Guidance Banner */}
            <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200/80 rounded-xl px-3 py-2 text-xs text-blue-900">
              <span className="flex items-center gap-1.5 font-medium">
                <Edit3 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span><strong>Live Editor:</strong> Click anywhere in the box below to edit prices, times, or wording directly.</span>
              </span>
              {isCustomEdited && (
                <button
                  type="button"
                  onClick={handleResetToFormula}
                  className="ml-2 text-[11px] font-bold text-blue-700 hover:text-blue-900 underline shrink-0 cursor-pointer"
                  title="Reset to default calculated template"
                >
                  🔄 Reset to formula
                </button>
              )}
            </div>

            {/* Editable Quote Textarea */}
            <div className="relative">
              <textarea
                rows={16}
                value={editableBill}
                onChange={(e) => {
                  setEditableBill(e.target.value);
                  setIsCustomEdited(true);
                }}
                className="w-full text-xs font-mono p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 leading-relaxed shadow-inner"
              />
              {isCustomEdited && (
                <div className="absolute top-2.5 right-3.5 pointer-events-none">
                  <span className="text-[10px] font-bold bg-amber-100/90 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md shadow-2xs">
                    ✏️ Custom Edited
                  </span>
                </div>
              )}
            </div>

            {/* Big Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>🟢 Send on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
