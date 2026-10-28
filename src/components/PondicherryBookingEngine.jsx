import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';

export default function PondicherryBookingEngine({
  serviceTitle = 'Chennai to Pondicherry Taxi & Sightseeing Tour',
  ...props
}) {
  return (
    <TourBookingEngine
      serviceSlug="pondicherry-one-day-trip"
      serviceTitle={serviceTitle}
      {...props}
    />
  );
}
