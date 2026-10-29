import React from 'react';
import BookingEngine from './BookingEngine.jsx';

/**
 * Unified Airport Booking Engine:
 * Delegates to the unified Savaari standard BookingEngine component.
 */
export default function AirportBookingEngine({
  showHeader = true,
  ...restProps
}) {
  return (
    <div id="airport-booking-engine" className="w-full">
      <BookingEngine
        initialTab="airport"
        allowedTabs={['airport']}
        variant="card"
        showHeader={showHeader}
        {...restProps}
      />
    </div>
  );
}
