import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';

export default function NavagrahaBookingEngine({
  serviceTitle = 'Kumbakonam Navagraha 9 Temples Tour Package',
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
