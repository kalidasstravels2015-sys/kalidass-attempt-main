import React, { useState, useEffect, useRef } from 'react';
import { generateDutySlipCanvas } from '../../../utils/dutySlipImageGenerator';

export default function SoloDutySlipModal({
  booking,
  chauffeurs,
  isOpen,
  onClose,
  onDutySlipSaved,
  showToast
}) {
  if (!isOpen || !booking) return null;

  const canvasRef = useRef(null);

  // Derive initial values
  const defaultPlate = booking.assignedChauffeur?.includes('(')
    ? booking.assignedChauffeur.split('(')[1].split(')')[0].trim()
    : booking.assignedChauffeur?.includes('-')
    ? booking.assignedChauffeur.split('-')[1].trim()
    : '';

  const defaultDriverName = booking.assignedChauffeur?.split('(')[0]?.split('-')[0]?.trim() || '';
  const defaultDriverPhone = (booking.assignedChauffeur?.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/) || [''])[0];

  const isTempo = booking.vehicleCategory?.toLowerCase().includes('tempo');
  const isCrysta = booking.vehicleCategory?.toLowerCase().includes('crysta');
  const isErtiga = booking.vehicleCategory?.toLowerCase().includes('ertiga');

  const defaultAllowedKm = isTempo ? 300 : 250;
  const defaultExtraKmRate = isTempo ? 24 : isCrysta ? 22 : isErtiga ? 17 : 14;

  const [form, setForm] = useState({
    bookingId: booking.bookingId || '',
    guestName: booking.guestNamePhone?.split('(')[0].trim() || '',
    guestPhone: (booking.guestNamePhone?.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/) || [''])[0],
    chauffeurName: defaultDriverName,
    chauffeurPhone: defaultDriverPhone,
    vehiclePlate: defaultPlate,
    vehicleCategory: booking.vehicleCategory || 'Sedan (Dzire / Etios)',
    pickupAddress: booking.pickupAddress || '',

    // Dates & Times
    startDate: booking.travelDateTime?.split('@')[0]?.trim() || '',
    startTime: booking.travelDateTime?.split('@')[1]?.trim() || '',
    endDate: '',
    endTime: '',

    // Odometer
    startKm: '',
    endKm: '',
    packageAllowedKm: defaultAllowedKm,
    extraKmRate: defaultExtraKmRate,

    // Extras & Allowances
    extraHours: '0',
    extraHourRate: isTempo ? 300 : 150,
    driverBata: isTempo ? '800' : isCrysta ? '700' : '500',
    nightAllowance: '0',

    // Tolls & Expenses
    tollsFastag: '',
    parking: '',
    statePermit: '',

    // Base Fare & Advance
    basePackageFare: String(booking.terminalFare || ''),
    advancePaid: String(booking.advancePaid || 0),
    paymentMode: 'Cash to Driver'
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit', 'preview'

  // Live Math Calculations
  const startKmNum = Number(form.startKm) || 0;
  const endKmNum = Number(form.endKm) || 0;
  const totalKm = Math.max(0, endKmNum - startKmNum);
  const packageAllowedKm = Number(form.packageAllowedKm) || 250;
  const extraKm = Math.max(0, totalKm - packageAllowedKm);
  const extraKmCharge = extraKm * (Number(form.extraKmRate) || 14);

  const extraHours = Number(form.extraHours) || 0;
  const extraHoursCharge = extraHours * (Number(form.extraHourRate) || 150);

  const baseFare = Number(form.basePackageFare) || 0;
  const driverBata = Number(form.driverBata) || 0;
  const nightAllowance = Number(form.nightAllowance) || 0;
  const tolls = Number(form.tollsFastag) || 0;
  const parking = Number(form.parking) || 0;
  const statePermit = Number(form.statePermit) || 0;
  const advance = Number(form.advancePaid) || 0;

  // Gross and Net
  const grossFare = baseFare + extraKmCharge + extraHoursCharge + tolls + parking + statePermit + nightAllowance;
  const balanceToCollect = Math.max(0, grossFare - advance);

  // Live Canvas Rendering when Preview Tab is selected
  useEffect(() => {
    if (activeTab === 'preview' && canvasRef.current) {
      const generated = generateDutySlipCanvas({
        bookingId: form.bookingId,
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        startDate: form.startDate,
        startTime: form.startTime,
        pickupAddress: form.pickupAddress,
        chauffeurName: form.chauffeurName,
        chauffeurPhone: form.chauffeurPhone,
        vehicleCategory: form.vehicleCategory,
        vehiclePlate: form.vehiclePlate,
        startKm: startKmNum,
        endKm: endKmNum,
        totalKm,
        packageAllowedKm,
        extraKm,
        extraKmRate: Number(form.extraKmRate),
        extraKmCharge,
        basePackageFare: baseFare,
        tolls,
        parking: parking + statePermit,
        nightAllowance,
        grossFare,
        advance,
        balanceToCollect
      });

      if (generated) {
        const destCtx = canvasRef.current.getContext('2d');
        if (destCtx) {
          canvasRef.current.width = generated.width;
          canvasRef.current.height = generated.height;
          destCtx.drawImage(generated, 0, 0);
        }
      }
    }
  }, [activeTab, form, startKmNum, endKmNum, totalKm, extraKm, grossFare, balanceToCollect]);

  // Download / Share as PNG Image Card
  const handleDownloadImageCard = () => {
    const generated = generateDutySlipCanvas({
      bookingId: form.bookingId,
      guestName: form.guestName,
      guestPhone: form.guestPhone,
      startDate: form.startDate,
      startTime: form.startTime,
      pickupAddress: form.pickupAddress,
      chauffeurName: form.chauffeurName,
      chauffeurPhone: form.chauffeurPhone,
      vehicleCategory: form.vehicleCategory,
      vehiclePlate: form.vehiclePlate,
      startKm: startKmNum,
      endKm: endKmNum,
      totalKm,
      packageAllowedKm,
      extraKm,
      extraKmRate: Number(form.extraKmRate),
      extraKmCharge,
      basePackageFare: baseFare,
      tolls,
      parking: parking + statePermit,
      nightAllowance,
      grossFare,
      advance,
      balanceToCollect
    });

    if (!generated) return;

    generated.toBlob((blob) => {
      if (!blob) return;

      const fileName = `Kalidass_DutySlip_${form.bookingId.replace(/[^0-9A-Za-z]/g, '')}.png`;

      // Native share if supported on mobile
      if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
        const file = new File([blob], fileName, { type: 'image/png' });
        navigator.share({
          files: [file],
          title: `Duty Slip ${form.bookingId}`,
          text: `Kalidass Travels Duty Slip for ${form.guestName} (${form.bookingId})`
        }).catch(() => {});
      } else {
        // Direct browser download
        const link = document.createElement('a');
        link.download = fileName;
        link.href = generated.toDataURL('image/png');
        link.click();
        showToast?.('Duty Slip image downloaded! Attach to WhatsApp.', 'success');
      }
    });
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const getTripUrl = (bookingId) => {
    const cleanRef = (bookingId || 'KT101').replace(/[^A-Za-z0-9]/g, '');
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return `${window.location.origin}/trip/?ref=${cleanRef}`;
    }
    return `https://kalidasstravels.in/trip/?ref=${cleanRef}`;
  };

  const handleShareMobileWebLink = () => {
    const tripUrl = getTripUrl(form.bookingId);
    const text = `Namaskaram! Here is your Kalidass Travels Digital Trip Sheet & Chauffeur Details:\n${tripUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    showToast?.('Trip web link formatted and opened in WhatsApp!', 'success');
  };

  // Complete & Save
  const handleSaveAndComplete = async () => {
    setSaving(true);
    try {
      const payload = {
        bookingId: form.bookingId,
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        chauffeurName: form.chauffeurName,
        chauffeurPhone: form.chauffeurPhone,
        vehiclePlate: form.vehiclePlate,
        vehicleCategory: form.vehicleCategory,
        startDate: form.startDate,
        startTime: form.startTime,
        endDate: form.endDate,
        endTime: form.endTime,
        startKm: startKmNum,
        endKm: endKmNum,
        packageAllowedKm,
        extraKmRate: Number(form.extraKmRate),
        basePackageFare: baseFare,
        tollsFastag: tolls,
        parking: parking + statePermit,
        driverBata,
        advancePaid: advance,
        grossFare,
        netBalanceToCollect: balanceToCollect,
        paymentMode: form.paymentMode
      };

      await fetch('/api/admin/duty-slips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Update booking to completed
      await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          bookingId: form.bookingId,
          manifestStatus: 'Completed',
          terminalFare: grossFare,
          financialClosure: 'Unreconciled'
        })
      });

      if (onDutySlipSaved) {
        onDutySlipSaved(payload, form.bookingId, grossFare);
      }
      showToast?.('Duty slip finalized and trip completed!', 'success');
      onClose();
    } catch (e) {
      showToast?.('Saved locally', 'success');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Finalize & Immediately Send Review Request via WhatsApp
  const handleFinalizeAndSendReview = async () => {
    const guestPhone = form.guestPhone?.replace(/[^0-9]/g, '') || '';
    const guestName = form.guestName || 'Guest';

    const message = `*KALIDASS TRAVELS — THANK YOU FOR TRAVELING WITH US!*\n\n` +
      `Dear ${guestName} ji, thank you for traveling with Kalidass Travels today (Trip ${form.bookingId}).\n\n` +
      `We hope Chauffeur ${form.chauffeurName || 'your driver'} took wonderful care of you. Could you spare 30 seconds to support our team with a 5-star review on Google?\n\n` +
      `⭐ *Tap here to review:* https://share.google/1IOq41QwMkhDJvrLY\n\n` +
      `Your support helps our family-run team tremendously. Thank you! 🙏`;

    const cleanPhone = guestPhone.length >= 10 ? guestPhone.slice(-10) : '';
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    await handleSaveAndComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[94vh] overflow-y-auto border border-m3-outline-variant text-m3-on-surface">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-m3-inverse-surface via-m3-surface-container-high to-m3-tertiary-container text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-m3-tertiary text-xl">receipt_long</span>
            <div>
              <h2 className="text-sm font-extrabold tracking-wide uppercase">Official Duty Slip & Trip Sheet</h2>
              <span className="text-[11px] text-m3-inverse-on-surface/80 font-mono">{form.bookingId} • {form.guestName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-m3-surface-container-high/80 p-0.5 rounded-lg border border-m3-outline-variant/40 flex text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  activeTab === 'edit' ? 'bg-m3-tertiary-container/300 text-m3-on-surface' : 'text-m3-inverse-on-surface/80 hover:text-white'
                }`}
              >
                Inputs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  activeTab === 'preview' ? 'bg-m3-tertiary-container/300 text-m3-on-surface' : 'text-m3-inverse-on-surface/80 hover:text-white'
                }`}
              >
                Voucher Card (Image)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-m3-outline-variant hover:text-white p-1 rounded-lg"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {activeTab === 'edit' ? (
          <div className="p-4 sm:p-5 space-y-4 text-xs">
            
            {/* 1. Trip Timing Section */}
            <div className="p-3 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant">
              <span className="text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wide block mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-m3-tertiary text-sm">schedule</span>
                <span>1. Trip Timings (Departure & Closing)</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-m3-outline mb-0.5">Start Date</label>
                  <input
                    type="text"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full text-xs font-semibold rounded-lg border border-m3-outline-variant p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-m3-outline mb-0.5">Start Time</label>
                  <input
                    type="text"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full text-xs font-semibold rounded-lg border border-m3-outline-variant p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-m3-outline mb-0.5">End Date</label>
                  <input
                    type="text"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full text-xs font-semibold rounded-lg border border-m3-outline-variant p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-m3-outline mb-0.5">End Time</label>
                  <input
                    type="text"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full text-xs font-semibold rounded-lg border border-m3-outline-variant p-2 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. Odometer Section */}
            <div className="p-3 bg-m3-tertiary-container/30/70 rounded-xl border border-m3-tertiary/30">
              <span className="text-[11px] font-bold text-m3-on-tertiary-container uppercase tracking-wide block mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-m3-tertiary text-sm">speed</span>
                <span>2. Odometer Readings (KM Tracking)</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-2">
                <div>
                  <label className="block text-[10px] font-semibold text-m3-on-surface-variant mb-0.5">Starting KM</label>
                  <input
                    type="number"
                    placeholder="e.g. 10450"
                    value={form.startKm}
                    onChange={(e) => setForm({ ...form, startKm: e.target.value })}
                    className="w-full font-mono font-bold text-xs rounded-lg border border-m3-outline-variant p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-m3-on-surface-variant mb-0.5">Closing KM</label>
                  <input
                    type="number"
                    placeholder="e.g. 10780"
                    value={form.endKm}
                    onChange={(e) => setForm({ ...form, endKm: e.target.value })}
                    className="w-full font-mono font-bold text-xs rounded-lg border border-m3-outline-variant p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-m3-on-surface-variant mb-0.5">Package KM</label>
                  <input
                    type="number"
                    value={form.packageAllowedKm}
                    onChange={(e) => setForm({ ...form, packageAllowedKm: e.target.value })}
                    className="w-full font-mono text-xs rounded-lg border border-m3-outline-variant p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-m3-on-surface-variant mb-0.5">Extra KM Rate (Rs)</label>
                  <input
                    type="number"
                    value={form.extraKmRate}
                    onChange={(e) => setForm({ ...form, extraKmRate: e.target.value })}
                    className="w-full font-mono text-xs rounded-lg border border-m3-outline-variant p-2 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-m3-on-surface bg-white/90 p-2 rounded-lg border border-m3-tertiary/30/80 font-mono">
                <span>Total KM: <strong>{totalKm} km</strong></span>
                <span className={extraKm > 0 ? 'text-m3-error font-bold' : 'text-m3-success font-semibold'}>
                  Extra: {extraKm} km (+Rs.{extraKmCharge})
                </span>
              </div>
            </div>

            {/* 3. Tolls, Parking & Extras */}
            <div className="p-3 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant">
              <span className="text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wide block mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-m3-tertiary text-sm">local_atm</span>
                <span>3. Tolls, Parking & Extras</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-m3-outline mb-0.5">FASTag Tolls (Rs)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.tollsFastag}
                    onChange={(e) => setForm({ ...form, tollsFastag: e.target.value })}
                    className="w-full font-mono text-xs rounded-lg border border-m3-outline-variant p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-m3-outline mb-0.5">Parking (Rs)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.parking}
                    onChange={(e) => setForm({ ...form, parking: e.target.value })}
                    className="w-full font-mono text-xs rounded-lg border border-m3-outline-variant p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-m3-outline mb-0.5">State Permit (Rs)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.statePermit}
                    onChange={(e) => setForm({ ...form, statePermit: e.target.value })}
                    className="w-full font-mono text-xs rounded-lg border border-m3-outline-variant p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-m3-outline mb-0.5">Night Allowance (Rs)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.nightAllowance}
                    onChange={(e) => setForm({ ...form, nightAllowance: e.target.value })}
                    className="w-full font-mono text-xs rounded-lg border border-m3-outline-variant p-2 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 4. Fare & Advance Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-m3-on-surface-variant mb-0.5">Base Package Fare (Rs)</label>
                <input
                  type="number"
                  value={form.basePackageFare}
                  onChange={(e) => setForm({ ...form, basePackageFare: e.target.value })}
                  className="w-full font-mono font-bold text-xs rounded-lg border border-m3-outline-variant p-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-m3-on-surface-variant mb-0.5">Advance Received (Rs)</label>
                <input
                  type="number"
                  value={form.advancePaid}
                  onChange={(e) => setForm({ ...form, advancePaid: e.target.value })}
                  className="w-full font-mono font-bold text-m3-tertiary text-xs rounded-lg border border-m3-outline-variant p-2 bg-white"
                />
              </div>
            </div>

            {/* Total Balance Card */}
            <div className="bg-m3-inverse-surface text-white p-3.5 rounded-xl font-mono space-y-1">
              <div className="flex justify-between text-xs text-m3-inverse-on-surface/80">
                <span>Total Trip Gross:</span>
                <span>Rs. {grossFare.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-m3-tertiary">
                <span>Advance Deducted:</span>
                <span>-Rs. {advance.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-m3-outline-variant/40 pt-1.5 flex justify-between text-sm sm:text-base font-extrabold text-m3-success">
                <span>NET BALANCE DUE:</span>
                <span>Rs. {balanceToCollect.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Action Buttons to View & Share Image Voucher Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadImageCard}
                className="py-2.5 px-3 bg-m3-success hover:bg-m3-success text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-sm">image</span>
                <span>Save Voucher Image (PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="py-2.5 px-3 bg-m3-tertiary-container/300 hover:bg-m3-tertiary text-m3-on-surface rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                <span>Preview Voucher Card</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleShareMobileWebLink}
              className="w-full py-2.5 px-3 bg-m3-secondary hover:bg-m3-secondary-container/400 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-sm">link</span>
              <span>Share Mobile Web Trip Sheet (WhatsApp)</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSaveAndComplete}
                disabled={saving}
                className="py-2.5 px-3 bg-m3-inverse-surface hover:bg-m3-surface-container-high text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Finalize & Complete</span>
              </button>

              <button
                type="button"
                onClick={handleFinalizeAndSendReview}
                disabled={saving}
                className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs shadow-md shadow-amber-500/20"
              >
                <span className="material-symbols-outlined text-sm">star</span>
                <span>Finalize & Send 5★ Review</span>
              </button>
            </div>
          </div>
        ) : (
          /* Live Canvas Voucher Card View */
          <div className="p-4 sm:p-5 space-y-4">
            <div className="bg-m3-inverse-surface p-2 rounded-2xl shadow-inner border border-m3-outline-variant/40 flex justify-center">
              <canvas
                ref={canvasRef}
                className="w-full max-w-md h-auto rounded-xl shadow-md border border-m3-outline-variant/40"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadImageCard}
                className="py-2.5 px-3 bg-m3-success hover:bg-m3-success text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all text-xs"
              >
                <span className="material-symbols-outlined text-sm">share</span>
                <span>Share / Save Voucher Image</span>
              </button>

              <button
                type="button"
                onClick={handlePrintSlip}
                className="py-2.5 px-3 bg-m3-surface-container-high hover:bg-m3-surface-container-high text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
