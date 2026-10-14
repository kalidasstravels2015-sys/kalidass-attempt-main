import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';

export default function NavagrahaBookingEngine({
  serviceTitle = 'Chennai to Kumbakonam Navagraha 9 Temples Cab Package',
  ...props
}) {
  return (
    <TourBookingEngine
      serviceSlug="navagraha-tour"
      serviceTitle={serviceTitle}
      {...props}
    />
  );
}
