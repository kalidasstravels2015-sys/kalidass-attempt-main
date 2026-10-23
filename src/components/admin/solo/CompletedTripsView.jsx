import React, { useState, useMemo } from 'react';

/**
 * CompletedTripsView - Step 3: Completed Trips & 5★ Google Reviews
 * Dedicated view for non-technical office staff:
 * Only manages finished trips, reviewing company profit, and sending Google 5★ reviews.
 */
export default function CompletedTripsView({
  bookings = [],
  onReviewStatusChange,
  showToast
}) {
  const [search, setSearch] = useState('');

  const completedBookings = useMemo(
    () => bookings.filter(b => b.manifestStatus === 'Completed'),
    [bookings]
  );

  const totalProfitEarned = useMemo(
    () => completedBookings.reduce((sum, b) => sum + Number(b.companyMargin || (b.terminalFare - b.chauffeurPayout) || 0), 0),
    [completedBookings]
  );

  const totalFareCollected = useMemo(
    () => completedBookings.reduce((sum, b) => sum + Number(b.terminalFare || 0), 0),
    [completedBookings]
  );

  const filteredBookings = useMemo(() => {
    return completedBookings.filter(b => {
      const q = search.toLowerCase().trim();
      const combined = `${b.guestNamePhone || ''} ${b.pickupAddress || ''} ${b.bookingId || ''} ${b.assignedChauffeur || ''}`.toLowerCase();
      if (q && !combined.includes(q)) return false;
      return true;
    });
  }, [completedBookings, search]);

  const extractPhone = (item) => {
    const combined = `${item.guestNamePhone || ''}`;
    const match = combined.match(/[6-9]\d{9}/);
    return match ? match[0] : '';
  };

  const handleSendReviewWA = (b) => {
    const cleanPhone = extractPhone(b);
    const guestName = (b.guestNamePhone || 'Customer').split('(')[0].trim();
    const dest = (b.pickupAddress || '').split(/➔|->|→/)[1]?.trim() || 'your destination';
    const msg =
      `Namaskaram ${guestName} ji! 🙏 Thank you for choosing *Kalidass Travels Chennai* for your journey to ${dest}.\n\n` +
      `We hope your driver took great care of you and your journey was comfortable and safe! ⭐\n\n` +
      `⭐⭐⭐⭐⭐ Kindly take 10 seconds to share your 5-star Google review here:\n` +
      `https://share.google/1IOq41QwMkhDJvrLY\n\n` +
      `Your kind review means the world to our family-run team. Looking forward to serving you again! 🙏`;
    onReviewStatusChange?.(b.bookingId, 'Requested');
    showToast?.(`Review request sent to ${guestName}!`, 'success');
    window.open(cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Page Header Bar */}
      <div className="bg-m3-surface-container-lowest p-4 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-m3-primary"></span>
            <h2 className="text-m3-title-m font-bold text-m3-on-surface">
              3. Completed Trips & Reviews
            </h2>
            <span className="text-xs font-bold bg-m3-secondary-container text-m3-on-secondary-container px-2.5 py-0.5 rounded-full">
              {completedBookings.length} Trips Closed
            </span>
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-0.5">
            Finished trips register. Send 1-tap 5-star Google review links to build your Google ranking.
          </p>
        </div>

        {/* Profit Metric Card */}
        <div className="flex items-center gap-4 bg-m3-surface-container-low border border-m3-outline-variant/70 p-2.5 px-4 rounded-m3-lg">
          <div>
            <span className="text-[11px] font-semibold text-m3-on-surface-variant uppercase tracking-wider block">Total Fares</span>
            <span className="text-sm font-bold text-m3-on-surface">₹{totalFareCollected.toLocaleString('en-IN')}</span>
          </div>
          <div className="h-8 w-px bg-m3-outline-variant/60"></div>
          <div>
            <span className="text-[11px] font-semibold text-m3-on-surface-variant uppercase tracking-wider block">Company Profit</span>
            <span className="text-base font-bold text-m3-primary">+₹{totalProfitEarned.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md px-1">
        <span className="material-symbols-outlined absolute left-4 top-2.5 text-m3-on-surface-variant text-[18px]">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by passenger, route, or driver..."
          className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-full border border-m3-outline-variant bg-m3-surface-container-lowest focus:ring-2 focus:ring-m3-primary text-m3-on-surface"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-2 text-m3-on-surface-variant text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Completed Trips List */}
      {filteredBookings.length === 0 ? (
        <div className="p-10 text-center bg-m3-surface-container-lowest rounded-m3-xl border border-m3-outline-variant/70 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">star</span>
          </div>
          <h3 className="text-sm font-bold text-m3-on-surface">No Completed Trips in Register</h3>
          <p className="text-xs text-m3-on-surface-variant max-w-md mx-auto">
            When trips are marked completed in Step 2, they will appear here with profit tracking and 1-tap Google Review requests.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredBookings.map((b) => {
            const fare = Number(b.terminalFare) || 0;
            const driverShare = Number(b.chauffeurPayout) || Math.round(fare * 0.82);
            const profit = fare - driverShare;
            const isReviewSent = b.reviewStatus === 'Requested';

            return (
              <div
                key={b.bookingId}
                className="p-4 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/80 shadow-m3-1 flex flex-col xl:flex-row xl:items-center justify-between gap-3 hover:border-m3-outline transition-all"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-code text-xs font-bold bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      {b.bookingId}
                    </span>
                    <span className="text-xs font-bold text-m3-on-surface whitespace-nowrap">
                      👤 {b.guestNamePhone}
                    </span>
                    <span className="text-[11px] text-m3-on-surface-variant whitespace-nowrap">
                      👨‍✈️ Driver: {b.assignedChauffeur}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-m3-on-surface break-words">
                    📍 {b.pickupAddress} • 🗓️ {b.travelDateTime}
                  </div>

                  <div className="text-xs text-m3-on-surface-variant font-normal">
                    Total Fare: <strong className="text-m3-on-surface">₹{fare.toLocaleString('en-IN')}</strong> • Driver Net: ₹{driverShare.toLocaleString('en-IN')} • <strong className="text-m3-primary font-bold">Profit: +₹{profit.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Google Review Button */}
                <div className="shrink-0 flex items-center gap-2 pt-2 xl:pt-0 border-t xl:border-t-0 border-m3-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => handleSendReviewWA(b)}
                    className={`h-9 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs whitespace-nowrap ${
                      isReviewSent
                        ? 'bg-m3-surface-container-high text-m3-on-surface-variant border border-m3-outline-variant hover:bg-m3-surface-container-highest'
                        : 'bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary shadow-m3-1'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">star</span>
                    <span>{isReviewSent ? 'Resend 5★ Review WA' : '⭐ Send 5★ Google Review'}</span>
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
