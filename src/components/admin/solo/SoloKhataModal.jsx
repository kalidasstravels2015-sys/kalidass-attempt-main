import React, { useState } from 'react';

export default function SoloKhataModal({
  isOpen,
  onClose,
  chauffeurs,
  bookings,
  onSettlementSaved,
  showToast
}) {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    chauffeurName: chauffeurs[0]?.name || '',
    bookingId: bookings[0]?.bookingId || '',
    guestCashCollected: '',
    driverAgreedPayout: '',
    tollsPaidByDriver: '0',
    paymentMode: 'UPI',
    upiRef: '',
    notes: ''
  });

  const [saving, setSaving] = useState(false);

  const cashCollected = Number(form.guestCashCollected) || 0;
  const driverPayout = Number(form.driverAgreedPayout) || 0;
  const driverTolls = Number(form.tollsPaidByDriver) || 0;

  // Positive: Driver owes Office. Negative: Office owes Driver.
  const netBalance = cashCollected - (driverPayout + driverTolls);

  const handleSaveSettlement = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast?.('Driver settlement recorded successfully!', 'success');
        if (onSettlementSaved) {
          onSettlementSaved(data.settlement);
        }
        onClose();
      } else {
        showToast?.(data.error || 'Failed to save settlement', 'error');
      }
    } catch (e) {
      showToast?.('Error saving settlement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleShareKhataWhatsApp = () => {
    const selectedDriver = chauffeurs.find(c => c.name === form.chauffeurName);
    const driverPhone = selectedDriver?.phone?.replace(/[^0-9]/g, '') || '8939539211';

    const text = `*KALIDASS TRAVELS — DAILY DRIVER SETTLEMENT (KHATA)*\n` +
      `Date: ${new Date().toLocaleDateString('en-GB')}\n` +
      `Chauffeur: *${form.chauffeurName}*\n` +
      `Trip Ref: *${form.bookingId}*\n\n` +
      `💵 Cash Collected from Guest: Rs.${cashCollected}\n` +
      `🚗 Your Agreed Trip Share: Rs.${driverPayout}\n` +
      (driverTolls > 0 ? `⛽ Tolls/Expenses Paid by You: Rs.${driverTolls}\n` : '') +
      `--------------------------------\n` +
      (netBalance >= 0
        ? `*NET OFFICE BALANCE TO RETURN: Rs.${netBalance}*\n_Kindly UPI to 8939539211@okbizaxis (Kalidass Travels)_`
        : `*NET OFFICE OWES YOU: Rs.${Math.abs(netBalance)}*\n_Will be credited to your UPI tonight._`) +
      `\n\nThank you for your dedicated service! 🌟`;

    window.open(`https://wa.me/${driverPhone.startsWith('91') ? driverPhone : '91' + driverPhone.slice(-10)}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto border border-m3-outline-variant">
        {/* Header */}
        <div className="bg-gradient-to-r from-m3-success to-m3-success text-white p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-m3-tertiary">account_balance_wallet</span>
            <div>
              <h2 className="text-sm font-bold">Daily Driver Khata & Settlement</h2>
              <span className="text-[11px] text-m3-on-success/90">Reconcile Driver Cash vs Office Share</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-m3-outline-variant hover:text-white p-1 rounded-lg"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Driver & Trip Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-1">Select Chauffeur</label>
              <select
                value={form.chauffeurName}
                onChange={(e) => setForm({ ...form, chauffeurName: e.target.value })}
                className="w-full text-xs font-semibold rounded-lg border border-m3-outline-variant p-2 focus:ring-2 focus:ring-m3-success bg-white"
              >
                {chauffeurs.map(c => (
                  <option key={c.name} value={c.name}>{c.name} ({c.plate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-1">Trip Reference</label>
              <input
                type="text"
                placeholder="#KT-TPT-101"
                value={form.bookingId}
                onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
                className="w-full font-mono rounded-lg border border-m3-outline-variant p-2 focus:ring-2 focus:ring-m3-success"
              />
            </div>
          </div>

          {/* Settlement Numbers */}
          <div className="space-y-3 p-3 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant">
            <div>
              <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-1">
                Cash / Payment Collected by Driver from Guest (Rs)
              </label>
              <input
                type="number"
                value={form.guestCashCollected}
                onChange={(e) => setForm({ ...form, guestCashCollected: e.target.value })}
                className="w-full font-mono font-bold text-m3-on-surface rounded-lg border border-m3-outline-variant p-2 focus:ring-2 focus:ring-m3-success bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-1">
                Agreed Driver Trip Payout / Share (Rs)
              </label>
              <input
                type="number"
                value={form.driverAgreedPayout}
                onChange={(e) => setForm({ ...form, driverAgreedPayout: e.target.value })}
                className="w-full font-mono font-bold text-m3-on-surface rounded-lg border border-m3-outline-variant p-2 focus:ring-2 focus:ring-m3-success bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-m3-on-surface-variant mb-1">
                Tolls / Parking Paid Out of Pocket by Driver (Rs)
              </label>
              <input
                type="number"
                value={form.tollsPaidByDriver}
                onChange={(e) => setForm({ ...form, tollsPaidByDriver: e.target.value })}
                className="w-full font-mono rounded-lg border border-m3-outline-variant p-2 focus:ring-2 focus:ring-m3-success bg-white"
              />
            </div>
          </div>

          {/* Net Calculation Box */}
          <div className={`p-4 rounded-xl text-white font-mono ${
            netBalance >= 0 ? 'bg-m3-success-container/30' : 'bg-m3-error-container/30'
          }`}>
            <span className="text-[10px] uppercase font-bold tracking-wider text-m3-success block mb-1">
              Settlement Status
            </span>
            <div className="text-base sm:text-lg font-black">
              {netBalance >= 0 ? (
                <span>Driver Owes Office: <span className="text-m3-success">Rs. {netBalance.toLocaleString('en-IN')}</span></span>
              ) : (
                <span>Office Owes Driver: <span className="text-m3-error">Rs. {Math.abs(netBalance).toLocaleString('en-IN')}</span></span>
              )}
            </div>
            <span className="text-[11px] text-m3-inverse-on-surface/80 mt-1 block">
              {netBalance >= 0
                ? 'Driver collected full fare from guest and must transfer company margin via UPI.'
                : 'Customer paid office directly; office must release driver payout via UPI.'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleShareKhataWhatsApp}
              className="flex-1 px-3 py-2.5 bg-m3-success-container/40 hover:bg-m3-success-container/70 text-m3-on-success-container border border-m3-success/30 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              <span>Send to Driver WA</span>
            </button>

            <button
              type="button"
              onClick={handleSaveSettlement}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-m3-success hover:bg-m3-success text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              {saving ? (
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-sm">check_circle</span>
              )}
              <span>Record Settlement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
