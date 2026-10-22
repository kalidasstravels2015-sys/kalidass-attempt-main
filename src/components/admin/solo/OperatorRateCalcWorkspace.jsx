import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Car,
  Plane,
  Compass,
  User,
  Phone,
  Send,
  Copy,
  Check,
  CheckCircle2,
  BookmarkPlus,
  ArrowRight,
  ShieldCheck,
  X,
  ExternalLink,
  QrCode,
  Sparkles,
  Info,
  Calendar,
  Clock,
  Layers
} from 'lucide-react';
import QuotationEngine from '../../QuotationEngine';
import AirportBookingEngine from '../../AirportBookingEngine';
import { validateCustomerContact } from '../../../utils/bookingContactValidator';
import TourBookingEngine from '../../TourBookingEngine';
import DriverFeeEstimator from '../../DriverFeeEstimator';
import { TOUR_CONFIGS } from '../../../data/tourBookingConfigs.js';
import { buildWhatsAppUrl, buildMapsBlock } from '../../../utils/whatsapp';
import { getNextQuotationId } from '../../../utils/sequenceGenerator';

const ENQUIRY_SOURCES = [
  { id: 'Google Ads Call', label: 'Google Ads Call', color: 'bg-m3-secondary-container text-m3-on-secondary-container border-m3-outline-variant/40' },
  { id: 'Old / Repeat Customer', label: 'Repeat Customer', color: 'bg-m3-secondary-container text-m3-on-secondary-container border-m3-outline-variant/40' },
  { id: 'Website Phone Call', label: 'Website Phone Call', color: 'bg-m3-secondary-container text-m3-on-secondary-container border-m3-outline-variant/40' },
  { id: 'WhatsApp Enquiry', label: 'WhatsApp Enquiry', color: 'bg-m3-secondary-container text-m3-on-secondary-container border-m3-outline-variant/40' },
  { id: 'JustDial / Sulekha', label: 'JustDial / Sulekha', color: 'bg-m3-secondary-container text-m3-on-secondary-container border-m3-outline-variant/40' }
];

const TOUR_CIRCUITS = [
  { slug: 'tirupati-package', label: 'Tirupati Balaji', icon: '🛕' },
  { slug: 'pondicherry-one-day-trip', label: 'Pondicherry & Auroville', icon: '🌊' },
  { slug: 'thiruvannamalai-girivalam-trip', label: 'Thiruvannamalai Girivalam', icon: '🕉️' },
  { slug: 'navagraha-tour', label: 'Kumbakonam Navagraha', icon: '🪐' },
  { slug: 'kanchipuram-temple-trip', label: 'Kanchipuram Silk & Temples', icon: '🏛️' },
  { slug: 'chidambaram-temple-trip', label: 'Chidambaram Nataraja', icon: '🔱' },
  { slug: 'vellore-golden-temple', label: 'Vellore Golden Temple', icon: '✨' },
  { slug: 'rameswaram-2-days', label: 'Rameswaram (2 Days)', icon: '🏖️' },
  { slug: 'sabarimala-trip', label: 'Sabarimala Pilgrimage', icon: '⛰️' }
];

export default function OperatorRateCalcWorkspace({
  isOpen = true,
  isPageMode = false,
  onClose,
  onSaveLead,
  onConfirmBooking,
  showToast
}) {
  // Caller details
  const [callerPhone, setCallerPhone] = useState('');
  const [callerName, setCallerName] = useState('');
  const [source, setSource] = useState('Google Ads Call');

  // Engine selection: 'outstation' | 'airport' | 'tours' | 'drivers'
  const [activeEngineTab, setActiveEngineTab] = useState('outstation');
  const [selectedTourSlug, setSelectedTourSlug] = useState('tirupati-package');

  // Active live calculation state emitted by the website engines
  const [currentCalc, setCurrentCalc] = useState(null);
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Clean 10-digit customer phone
  const cleanPhone = useMemo(() => {
    return (callerPhone || '').replace(/[^0-9]/g, '').slice(-10);
  }, [callerPhone]);

  const isPhoneValid = cleanPhone.length === 10;

  // Listen to calculations from website engines via custom window events and direct prop callback
  useEffect(() => {
    const handleCalculationUpdate = (e) => {
      if (e?.detail) {
        setCurrentCalc(e.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('kt_calculation_updated', handleCalculationUpdate);
      if (window.__KT_CURRENT_CALCULATION) {
        setCurrentCalc(window.__KT_CURRENT_CALCULATION);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('kt_calculation_updated', handleCalculationUpdate);
      }
    };
  }, []);

  const handleEngineCalculated = (calcData) => {
    if (calcData) {
      setCurrentCalc(calcData);
    }
  };

  // Generate unique quote ref id in order, starting from 101
  const quoteId = useMemo(() => {
    if (currentCalc?.quoteRefId) return currentCalc.quoteRefId;
    return getNextQuotationId();
  }, [currentCalc?.quoteRefId]);

  // Derived financial shares
  const totalFare = Number(currentCalc?.totalFare) || 0;
  const driverShare = Math.round((totalFare * 0.82) / 50) * 50;
  const companyMargin = totalFare - driverShare;
  const advanceRequired = 500;
  const balanceDue = Math.max(0, totalFare - advanceRequired);

  // Formatted official WhatsApp Quotation text
  const quotationText = useMemo(() => {
    if (!currentCalc || !totalFare) {
      return '';
    }
    const custLabel = callerName.trim() ? callerName.trim() : (isPhoneValid ? `Customer (+91 ${cleanPhone})` : 'Sir/Madam');
    const mapsBlock = buildMapsBlock(currentCalc.pickup || 'Chennai', currentCalc.destination || '', currentCalc.activeTab || 'oneway');
    const distText = currentCalc.distanceKm ? `~${currentCalc.distanceKm} km (Highway Route)` : 'Highway Route';

    return (
      `*KALIDASS TRAVELS CHENNAI — OFFICIAL QUOTATION*\n` +
      `📌 *Quote Ref:* ${quoteId} (Rate Locked for 24 Hrs)\n\n` +
      `Namaskaram ${custLabel}! 🙏 Thank you for contacting Kalidass Travels.\n\n` +
      `📍 *Route:* ${currentCalc.pickup || 'Chennai'} ➔ ${currentCalc.destination || 'Destination'}\n` +
      `🚗 *Vehicle / Service:* ${currentCalc.vehicleName || 'AC Cab'} (${currentCalc.serviceTitle || 'Trip'})\n` +
      (currentCalc.pickupDateTime ? `🗓 *Pickup Schedule:* ${currentCalc.pickupDateTime}\n` : '') +
      (currentCalc.returnDateTime ? `🗓 *Return Schedule:* ${currentCalc.returnDateTime}\n` : '') +
      `🛣️ *Distance:* ${distText}\n\n` +
      `💰 *All-Inclusive Fare:* *₹${totalFare.toLocaleString('en-IN')}*\n` +
      `   • Includes AC Cab, Fuel & Chauffeur Allowance (Bata)\n` +
      `   • Zero Surge Pricing | Spotless Clean Vehicle | 100% On-Time Guarantee\n\n` +
      `🔒 *To Lock Your Cab & Confirm Duty:*\n` +
      `Kindly pay *₹500 Advance* via Google Pay / PhonePe to:\n` +
      `UPI ID: *8939539211@okbizaxis* (Kalidass Travels)\n` +
      `and share the payment screenshot here. Remaining balance *₹${balanceDue.toLocaleString('en-IN')}* payable to driver directly on trip completion.` +
      mapsBlock +
      `\n\n📞 *Kalidass Travels Helpline:* 089395 39211 (24/7 Dispatch Desk)`
    );
  }, [currentCalc, totalFare, quoteId, callerName, cleanPhone, isPhoneValid, balanceDue]);

  // UPI QR Code URL for ₹500 advance
  const upiQrUrl = useMemo(() => {
    const upiStr = `upi://pay?pa=8939539211@okbizaxis&pn=Kalidass%20Travels&am=500&cu=INR&tn=${encodeURIComponent(`Advance ${quoteId}`)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(upiStr)}`;
  }, [quoteId]);

  // 1. Direct WhatsApp dispatch to customer
  const handleOpenWhatsApp = () => {
    if (!totalFare) {
      showToast?.('Please calculate a fare in the engine first!', 'error');
      return;
    }
    if (isPhoneValid) {
      window.open(buildWhatsAppUrl(quotationText, cleanPhone), '_blank');
      showToast?.(`WhatsApp quotation opened for +91 ${cleanPhone}!`, 'success');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(quotationText)}`, '_blank');
      showToast?.('WhatsApp opened! Enter 10-digit customer mobile for 1-click direct dispatch.', 'info');
    }
  };

  // 2. Copy quotation to clipboard
  const handleCopyQuotation = () => {
    if (!quotationText) {
      showToast?.('Please calculate a fare in the engine first!', 'error');
      return;
    }
    navigator.clipboard.writeText(quotationText);
    setCopiedQuote(true);
    showToast?.('Official quotation copied to clipboard!', 'success');
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  // 3. Save to Step 1: Customer Enquiries
  const handleSaveToStage1Lead = () => {
    if (!totalFare) {
      showToast?.('Please calculate a fare in the engine first!', 'error');
      return;
    }

    const newLead = {
      quoteId,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      guestName: callerName.trim() || (isPhoneValid ? `Caller (+91 ${cleanPhone})` : 'Phone Caller'),
      sourcePage: isPhoneValid ? `${source} (+91 ${cleanPhone})` : source,
      calculatorEngine: currentCalc.serviceTitle || `Website Engine (${activeEngineTab})`,
      tripType: currentCalc.activeTab || activeEngineTab,
      pickup: currentCalc.pickup || 'Chennai',
      drop: currentCalc.destination || 'Destination',
      vehicle: currentCalc.vehicleName || 'AC Cab',
      distanceKm: String(currentCalc.distanceKm || '150'),
      estimatedFare: totalFare,
      travelDate: currentCalc.pickupDateTime || 'Upcoming',
      status: 'Quote Sent - Waiting Advance',
      metadata: `Source: ${source} | Fare: ₹${totalFare} | Margin: +₹${companyMargin}`
    };

    onSaveLead?.(newLead);
    showToast?.(`Enquiry ${quoteId} saved into Step 1 Enquiries!`, 'success');
    if (!isPageMode) onClose?.();
  };

  // 4. Confirm ₹500 advance paid -> Move directly into Step 2: Active Trips
  const handleConfirmAdvancePaid = () => {
    if (!totalFare) {
      showToast?.('Please calculate a fare in the engine first!', 'error');
      return;
    }

    const validation = validateCustomerContact(callerName, cleanPhone);
    if (!validation.isValid) {
      showToast?.(validation.error || 'Please enter Customer Name and a valid 10-digit Mobile Number before moving to Active Trips.', 'error');
      return;
    }

    const bookingId = quoteId.replace('#QT-', '#KT-');
    const newBooking = {
      bookingId,
      guestNamePhone: validation.formattedGuestNamePhone,
      travelDateTime: currentCalc.pickupDateTime || 'Today / Tomorrow',
      pickupAddress: `${currentCalc.pickup || 'Chennai'} ➔ ${currentCalc.destination || 'Destination'}`,
      vehicleCategory: currentCalc.vehicleName || 'Sedan (Dzire / Etios)',
      partySize: currentCalc.passengers ? `${currentCalc.passengers} Pax` : '4 Pax',
      kycStatus: 'Advance Paid',
      darshanStatus: source,
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Need Driver',
      terminalFare: totalFare,
      chauffeurPayout: driverShare,
      companyMargin: companyMargin,
      advancePaid: advanceRequired,
      balanceDue: balanceDue,
      financialClosure: 'Unreconciled',
      reviewStatus: 'Pending'
    };

    onConfirmBooking?.(newBooking);
    showToast?.(`Booking ${bookingId} confirmed for ${validation.cleanName}! Moved to Step 2: Active Trips.`, 'success');
    if (!isPageMode) onClose?.();
  };

  if (!isOpen) return null;

  const content = (
    <div className="w-full max-w-6xl mx-auto space-y-4 pb-28 sm:pb-32 font-sans animate-fadeIn">
      {/* ── TOP CALLER CONTEXT BAR ────────────────────────────────────── */}
      <div className="bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-m3-outline-variant/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-m3-md bg-m3-primary text-m3-on-primary flex items-center justify-center shadow-m3-1">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-m3-on-surface leading-tight">
                  Operator Rate Calculator & Booking Workspace
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-m3-secondary-container text-m3-on-secondary-container border border-m3-outline-variant/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-m3-primary mr-1.5 animate-pulse"></span>
                  Live Website Engines
                </span>
              </div>
              <p className="text-xs text-m3-on-surface-variant mt-0.5">
                Uses the exact production calculation algorithms from your website pages to quote callers & dispatch quotations on WhatsApp.
              </p>
            </div>
          </div>

          {!isPageMode && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high transition-colors self-end sm:self-center"
              aria-label="Close Calculator"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Caller Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-3.5">
          {/* Mobile Phone Input */}
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-semibold text-m3-on-surface uppercase tracking-wider mb-1">
              Customer Mobile (WhatsApp)
            </label>
            <div className={`relative flex items-center bg-m3-surface-container-low border rounded-m3-md px-3 py-2 transition-all ${
              isPhoneValid
                ? 'border-m3-primary ring-2 ring-m3-primary/20 bg-m3-secondary-container/20'
                : 'border-m3-outline-variant focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary'
            }`}>
              <span className="text-xs font-bold text-m3-on-surface-variant mr-2 select-none">+91</span>
              <input
                type="tel"
                placeholder="Enter 10-digit phone"
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                maxLength={14}
                className="w-full bg-transparent text-sm font-semibold text-m3-on-surface outline-none placeholder:text-m3-on-surface-variant/60 placeholder:font-normal"
              />
              {isPhoneValid && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-m3-primary shrink-0">
                  <Check className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Name */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-m3-on-surface uppercase tracking-wider mb-1">
              Caller / Guest Name (Optional)
            </label>
            <div className="flex items-center bg-m3-surface-container-low border border-m3-outline-variant rounded-m3-md px-3 py-2 focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-m3-primary transition-all">
              <User className="w-4 h-4 text-m3-on-surface-variant mr-2 shrink-0" />
              <input
                type="text"
                placeholder="e.g. Ramesh / Priya"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-m3-on-surface outline-none placeholder:text-m3-on-surface-variant/60 placeholder:font-normal"
              />
            </div>
          </div>

          {/* Lead Source */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-m3-on-surface uppercase tracking-wider mb-1">
              Enquiry Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-m3-surface-container-low border border-m3-outline-variant rounded-m3-md px-3 py-2 text-xs sm:text-sm font-semibold text-m3-on-surface outline-none focus:ring-2 focus:ring-m3-primary focus:border-m3-primary transition-all cursor-pointer"
            >
              {ENQUIRY_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 4 ENGINE NAVIGATION TABS ─────────────────────────────────── */}
      <div className="bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 p-1.5 sm:p-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveEngineTab('outstation')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeEngineTab === 'outstation'
                ? 'bg-m3-primary text-m3-on-primary shadow-m3-1'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high'
            }`}
          >
            <Car className="w-4 h-4 shrink-0" />
            <span>🚗 Outstation Cabs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEngineTab('airport')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeEngineTab === 'airport'
                ? 'bg-m3-primary text-m3-on-primary shadow-m3-1'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high'
            }`}
          >
            <Plane className="w-4 h-4 shrink-0" />
            <span>✈️ Airport Taxi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEngineTab('tours')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeEngineTab === 'tours'
                ? 'bg-m3-primary text-m3-on-primary shadow-m3-1'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>🛕 Tour Packages</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEngineTab('drivers')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeEngineTab === 'drivers'
                ? 'bg-m3-primary text-m3-on-primary shadow-m3-1'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>👨‍✈️ Acting Drivers</span>
          </button>
        </div>

        {/* Secondary Sub-Bar for Tour Packages */}
        {activeEngineTab === 'tours' && (
          <div className="mt-2.5 pt-2.5 border-t border-m3-outline-variant/50">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
              <span className="text-[11px] font-semibold text-m3-on-surface-variant uppercase tracking-wider px-1 shrink-0">
                Circuit:
              </span>
              {TOUR_CIRCUITS.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => setSelectedTourSlug(t.slug)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold shrink-0 text-xs transition-all cursor-pointer ${
                    selectedTourSlug === t.slug
                      ? 'bg-m3-primary text-m3-on-primary shadow-xs'
                      : 'bg-m3-surface-container-low text-m3-on-surface hover:bg-m3-surface-container-high'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── EMBEDDED PRODUCTION WEBSITE ENGINE ───────────────────────── */}
      <div className="bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 p-3 sm:p-5 overflow-hidden">
        {activeEngineTab === 'outstation' && (
          <QuotationEngine
            showHeader={false}
            isOperatorMode={true}
            operatorCallerPhone={cleanPhone}
            operatorCallerName={callerName}
            onQuoteCalculated={handleEngineCalculated}
          />
        )}

        {activeEngineTab === 'airport' && (
          <AirportBookingEngine
            showHeader={false}
            isOperatorMode={true}
            operatorCallerPhone={cleanPhone}
            operatorCallerName={callerName}
            onQuoteCalculated={handleEngineCalculated}
          />
        )}

        {activeEngineTab === 'tours' && (
          <TourBookingEngine
            key={selectedTourSlug}
            serviceSlug={selectedTourSlug}
            isOperatorMode={true}
            operatorCallerPhone={cleanPhone}
            operatorCallerName={callerName}
            onQuoteCalculated={handleEngineCalculated}
          />
        )}

        {activeEngineTab === 'drivers' && (
          <DriverFeeEstimator
            embedded={true}
            isOperatorMode={true}
            operatorCallerPhone={cleanPhone}
            operatorCallerName={callerName}
            onQuoteCalculated={handleEngineCalculated}
          />
        )}
      </div>

      {/* ── PERSISTENT OPERATOR ACTION DOCK (FIXED AT BOTTOM) ─────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-m3-surface-container-highest/95 backdrop-blur-md text-m3-on-surface border-t border-m3-outline-variant shadow-m3-3 p-3 sm:p-4 animate-slideUp">
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Left: Live Fare Breakdown */}
          <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
            <div className="shrink-0">
              <span className="text-[10px] font-semibold text-m3-on-surface-variant uppercase tracking-widest block">
                Official Quoted Fare
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-m3-primary tracking-tight">
                  ₹{totalFare.toLocaleString('en-IN')}
                </span>
                {totalFare > 0 && (
                  <span className="text-[11px] font-bold text-m3-primary">
                    (+₹{companyMargin} Margin)
                  </span>
                )}
              </div>
            </div>

            <div className="h-8 w-px bg-m3-outline-variant/60 hidden sm:block"></div>

            <div className="text-right sm:text-left text-xs text-m3-on-surface">
              {currentCalc ? (
                <>
                  <div className="font-bold text-m3-on-surface truncate max-w-[200px] sm:max-w-xs">
                    {currentCalc.pickup || 'Chennai'} ➔ {currentCalc.destination || 'Destination'}
                  </div>
                  <div className="text-[11px] text-m3-on-surface-variant">
                    {currentCalc.vehicleName || 'AC Cab'} • ₹500 Adv / ₹{balanceDue.toLocaleString('en-IN')} Bal
                  </div>
                </>
              ) : (
                <div className="text-m3-on-surface-variant text-[11px] font-semibold">
                  ⚠️ Calculate trip in engine above to activate quotation actions
                </div>
              )}
            </div>
          </div>

          {/* Right: The 4 High-Leverage Operator Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
            {/* 1. Direct WhatsApp Dispatch */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              disabled={!totalFare}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer ${
                totalFare
                  ? 'bg-m3-secondary-container hover:bg-m3-secondary-container/80 text-m3-on-secondary-container active:scale-95'
                  : 'bg-m3-surface-container-high text-m3-on-surface-variant/40 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPhoneValid ? `WhatsApp to +91 ${cleanPhone}` : 'Send WhatsApp Quote'}</span>
            </button>

            {/* 2. Copy Quotation Text */}
            <button
              type="button"
              onClick={handleCopyQuotation}
              disabled={!totalFare}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface font-bold text-xs sm:text-sm border border-m3-outline-variant active:scale-95 transition-all cursor-pointer"
            >
              {copiedQuote ? <Check className="w-3.5 h-3.5 text-m3-primary" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedQuote ? 'Copied!' : 'Copy Quote'}</span>
            </button>

            {/* 3. Save to Step 1 Enquiries */}
            <button
              type="button"
              onClick={handleSaveToStage1Lead}
              disabled={!totalFare}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full border border-m3-outline hover:bg-m3-primary/10 text-m3-primary font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Save Lead</span>
            </button>

            {/* 4. Confirm ₹500 Advance Paid -> Move to Step 2 */}
            <button
              type="button"
              onClick={handleConfirmAdvancePaid}
              disabled={!totalFare}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer shadow-m3-1"
            >
              <CheckCircle2 className="w-4 h-4 text-m3-on-primary" />
              <span>₹500 Paid (Confirm Trip)</span>
            </button>

            {/* UPI QR Modal Button */}
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="p-2.5 rounded-full bg-m3-surface-container-high hover:bg-m3-surface-container-highest text-m3-on-surface border border-m3-outline-variant transition-colors"
              title="Show ₹500 Advance UPI QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── UPI QR MODAL (FOR ADVANCE PAYMENT VIA PHONEPE/GPAY) ─────── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-m3-surface-container-lowest rounded-m3-2xl p-5 text-center shadow-m3-3 border border-m3-outline-variant/80">
            <div className="flex items-center justify-between pb-3 border-b border-m3-outline-variant/50">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-m3-primary" />
                <h3 className="font-bold text-m3-on-surface text-sm">₹500 Advance QR Code</h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-m3-on-surface-variant hover:text-m3-on-surface p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 p-2 bg-m3-surface-container-low border border-m3-outline-variant/60 rounded-m3-lg inline-block">
              <img
                src={upiQrUrl}
                alt="Kalidass Travels ₹500 Advance QR"
                className="w-48 h-48 mx-auto rounded-m3-md"
              />
            </div>

            <div className="text-xs text-m3-on-surface-variant space-y-1">
              <p className="font-bold text-m3-on-surface">Kalidass Travels Official UPI:</p>
              <p className="font-mono text-m3-primary font-bold bg-m3-secondary-container text-m3-on-secondary-container px-2 py-1 rounded select-all">
                8939539211@okbizaxis
              </p>
              <p className="text-[11px] text-m3-on-surface-variant mt-2">
                Ask customer to scan with Google Pay / PhonePe / Paytm & share screenshot.
              </p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="mt-4 w-full py-2 bg-m3-primary text-m3-on-primary font-bold text-xs rounded-full hover:bg-m3-primary/90 transition-colors shadow-m3-1"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // If in modal mode (opened from quick top button)
  if (!isPageMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
        <div className="w-full max-w-5xl my-auto">
          {content}
        </div>
      </div>
    );
  }

  // Full page mode (View 5 in Admin Dashboard)
  return content;
}
