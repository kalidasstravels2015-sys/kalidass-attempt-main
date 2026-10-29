import React from 'react';
import BookingEngine from './BookingEngine.jsx';

/**
 * Unified Tour Booking Engine:
 * Delegates to the unified Savaari standard BookingEngine component.
 */
export default function TourBookingEngine({
  serviceSlug = 'tirupati-package',
  serviceTitle = '',
  customConfig = null,
  ...restProps
}) {
  return (
    <div id="tour-booking-engine" className="w-full">
      <BookingEngine
        initialTab="outstation"
        allowedTabs={['outstation']}
        serviceSlug={serviceSlug}
        serviceTitle={serviceTitle}
        variant="card"
        showHeader={false}
        {...restProps}
      />
    </div>
  );
}
