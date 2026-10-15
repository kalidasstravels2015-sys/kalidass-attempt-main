import React, { useState } from 'react';

export default function DeskKhataSettlement({
  bookings,
  settlements,
  onRecordSettlement,
  showToast
}) {
  const [collectionModes, setCollectionModes] = useState({}); // bookingId -> 'cash_driver' or 'upi_office'

  // Filter completed / closed trips
  const completedTrips = bookings.filter(b => b.manifestStatus === 'Completed' || b.financialClosure === 'Reconciled');

  const getCollectionMode = (bookingId) => collectionModes[bookingId] || 'cash_driver';

  const setMode = (bookingId, mode) => {
    setCollectionModes(prev => ({ ...prev, [bookingId]: mode }));
  };

  // 1-Tap WhatsApp Payment Reminder to Driver
  const handleDriverPaymentReminder = (b, amountDue) => {
    const driverPhoneMatch = (b.assignedChauffeur || '').match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
    const driverPhone = driverPhoneMatch ? driverPhoneMatch[0].replace(/[^0-9]/g, '') : '8939539211';
    const driverName = b.assignedChauffeur?.split('(')[0]?.trim() || 'Chauffeur';

    const text = `*KALIDASS TRAVELS — TRIP SETTLEMENT REMINDER*\n\n` +
      `Namaskaram ${driverName}!\n` +
      `For Trip *${b.bookingId}* (${b.pickupAddress}):\n\n` +
      `💵 Balance Cash Collected from Guest: Rs.${Number(b.terminalFare - (b.advancePaid || 500))}\n` +
      `🚗 Your Agreed Net Share: Rs.${b.chauffeurPayout}\n` +
      `--------------------------------\n` +
      `*BALANCE DUE TO OFFICE: Rs.${amountDue}*\n\n` +
      `Kindly GPay / PhonePe to *8939539211@okbizaxis* (Kalidass Travels) to close today's duty. Thank you!`;

    window.open(`https://wa.me/91${driverPhone.slice(-10)}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleMarkSettled = (b) => {
    onRecordSettlement({
      bookingId: b.bookingId,
      chauffeurName: b.assignedChauffeur,
      terminalFare: b.terminalFare,
      chauffeurPayout: b.chauffeurPayout,
      companyMargin: b.companyMargin,
      status: 'Settled'
    });
    showToast?.(`Trip ${b.bookingId} marked as settled!`, 'success');
  };

  // Metrics
  const totalProfit = completedTrips.reduce((acc, b) => acc + Number(b.companyMargin || (b.terminalFare - b.chauffeurPayout) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Daily Profit Summary Ribbon */}
      <div className="bg-gradient-to-r from-m3-success to-m3-success rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-m3-on-success/90 block">
            Today's Net Profit (In Your Pocket)
          </span>
          <span className="text-2xl font-black font-mono">
            Rs. {totalProfit.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-m3-on-success block">{completedTrips.length} Completed Trips</span>
          <span className="text-[10px] text-m3-on-success/80 font-mono">Zero Bad Debts</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-m3-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-m3-success text-base">account_balance_wallet</span>
          <span>Daily Driver Khata & Cash Reconciliation</span>
        </h2>
        <span className="text-[11px] text-m3-outline">Track Cash-in-Hand vs UPI</span>
      </div>

      {completedTrips.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-m3-outline-variant shadow-sm">
          <span className="material-symbols-outlined text-4xl text-m3-inverse-on-surface/80 mb-2">payments</span>
          <p className="text-xs font-bold text-m3-on-surface-variant">No completed trips to settle today yet.</p>
          <span className="text-[11px] text-m3-outline-variant block mt-1">
            When a driver completes a trip and closes the duty slip, it will appear here for cash settlement.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {completedTrips.map((b) => {
            const mode = getCollectionMode(b.bookingId);
            const totalFare = Number(b.terminalFare || 6000);
            const advancePaid = Number(b.advancePaid || 500);
            const driverPayout = Number(b.chauffeurPayout || Math.round(totalFare * 0.8));
            const companyMargin = totalFare - driverPayout;

            // Scenario 1: Guest paid cash to driver
            // Driver collected (totalFare - advancePaid)
            // Driver is owed driverPayout
            // Driver must return: (totalFare - advancePaid) - driverPayout
            const driverCashCollected = Math.max(0, totalFare - advancePaid);
            const driverOwesOffice = driverCashCollected - driverPayout;

            // Scenario 2: Guest paid full/balance via UPI to Kalidass Travels
            // Office owes driver his full payout
            const officeOwesDriver = driverPayout;

            return (
              <div
                key={b.bookingId}
                className="bg-white rounded-2xl border border-m3-outline-variant p-4 shadow-sm hover:border-m3-outline-variant transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-m3-outline-variant/40">
                  <div>
                    <span className="font-mono font-bold text-xs text-m3-on-surface">{b.bookingId}</span>
                    <span className="text-xs font-semibold text-m3-on-surface-variant block mt-0.5">{b.pickupAddress}</span>
                    <span className="text-[11px] text-m3-outline block">
                      Driver: <strong>{b.assignedChauffeur}</strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-m3-on-surface font-mono block">
                      Rs. {totalFare.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-m3-success font-bold block">
                      Your Margin: Rs.{companyMargin}
                    </span>
                  </div>
                </div>

                {/* Question: Who collected balance? */}
                <div className="mb-3">
                  <label className="block text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wide mb-1.5">
                    How was the remaining balance paid by the guest?
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setMode(b.bookingId, 'cash_driver')}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                        mode === 'cash_driver'
                          ? 'bg-m3-tertiary-container/30 border-m3-tertiary/50 text-m3-on-tertiary-container ring-2 ring-m3-tertiary/40'
                          : 'bg-m3-surface-container-low border-m3-outline-variant text-m3-on-surface-variant hover:bg-m3-surface-container'
                      }`}
                    >
                      <span className="block text-xs">💵 Cash to Driver</span>
                      <span className="text-[10px] font-normal text-m3-outline">Guest handed cash to chauffeur</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode(b.bookingId, 'upi_office')}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                        mode === 'upi_office'
                          ? 'bg-m3-secondary-container/40 border-m3-secondary/40 text-m3-on-secondary-container ring-2 ring-m3-secondary/30'
                          : 'bg-m3-surface-container-low border-m3-outline-variant text-m3-on-surface-variant hover:bg-m3-surface-container'
                      }`}
                    >
                      <span className="block text-xs">📱 UPI to Office</span>
                      <span className="text-[10px] font-normal text-m3-outline">Guest GPayed Kalidass Travels</span>
                    </button>
                  </div>
                </div>

                {/* Outcome Calculation */}
                {mode === 'cash_driver' ? (
                  <div className="p-3 rounded-xl bg-m3-tertiary-container/30/70 border border-m3-tertiary/30 text-xs mb-3">
                    <div className="flex items-center justify-between font-mono mb-1">
                      <span>Cash with Driver:</span>
                      <strong>Rs. {driverCashCollected}</strong>
                    </div>
                    <div className="flex items-center justify-between font-mono mb-1.5">
                      <span>Driver's Net Share:</span>
                      <strong>-Rs. {driverPayout}</strong>
                    </div>
                    <div className="border-t border-m3-tertiary/30 pt-1.5 flex items-center justify-between text-m3-on-tertiary-container font-bold">
                      <span>
                        {driverOwesOffice >= 0 ? 'Driver Owes Office:' : 'Office Owes Driver:'}
                      </span>
                      <span className="text-sm font-mono font-extrabold text-m3-on-tertiary-container">
                        Rs. {Math.abs(driverOwesOffice)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-m3-secondary-container/40/70 border border-m3-secondary/30 text-xs mb-3">
                    <div className="flex items-center justify-between font-mono mb-1">
                      <span>Office Holds Full Fare:</span>
                      <strong>Rs. {totalFare}</strong>
                    </div>
                    <div className="border-t border-m3-secondary/30 pt-1.5 flex items-center justify-between text-m3-on-secondary-container font-bold">
                      <span>Office Must Transfer to Driver:</span>
                      <span className="text-sm font-mono font-extrabold text-m3-on-secondary-container">
                        Rs. {officeOwesDriver}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {mode === 'cash_driver' && driverOwesOffice > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDriverPaymentReminder(b, driverOwesOffice)}
                      className="flex-1 py-2 bg-m3-success-container/40 hover:bg-m3-success-container/70 text-m3-on-success-container border border-m3-success/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">send</span>
                      <span>1-Tap WhatsApp Reminder</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleMarkSettled(b)}
                    className="flex-1 py-2 bg-m3-inverse-surface hover:bg-m3-surface-container-high text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>Mark Reconciled & Closed</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
