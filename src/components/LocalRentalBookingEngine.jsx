import React from 'react';
import BookingEngine from './BookingEngine.jsx';

/**
 * LocalRentalBookingEngine
 * Dedicated engine card for Chennai Local City Packages.
 * Unified with the Savaari standard BookingEngine.
 */
export default function LocalRentalBookingEngine({
  showHeader = true,
  title = "Chennai Local City Rental",
  subtitle = "Hourly City Packages • Fuel & Driver Bata Included",
  ...props
}) {
  return (
    <div id="local-city-rental-engine" className="w-full">
      <BookingEngine
        initialTab="local"
        allowedTabs={['local']}
        showHeader={showHeader}
        title={title}
        subtitle={subtitle}
        variant="card"
        {...props}
      />
    </div>
  );
}
