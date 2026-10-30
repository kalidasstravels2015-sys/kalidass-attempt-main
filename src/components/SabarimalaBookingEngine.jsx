import React from 'react';
import BookingEngine from './BookingEngine.jsx';

export default function SabarimalaBookingEngine({
  serviceTitle = 'Chennai to Sabarimala Pilgrimage Taxi Package',
  ...props
}) {
  return (
    <div id="tour-booking-engine" className="w-full">
      <BookingEngine
        initialTab="outstation"
        allowedTabs={['outstation']}
        showTabs={false}
        showPopularChips={false}
        forceEmptyLocations={true}
        pickupPlaceholder="Enter doorstep pickup address / area in Chennai"
        dropPlaceholder="Enter drop location (e.g. Sabarimala / Nilakkal / Pamba)"
        serviceSlug="sabarimala-trip"
        serviceTitle={serviceTitle}
        variant="card"
        showHeader={false}
        initialDays={3}
        {...props}
      />
    </div>
  );
}
