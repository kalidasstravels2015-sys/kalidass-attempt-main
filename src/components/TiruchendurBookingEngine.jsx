import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';

export default function TiruchendurBookingEngine({
  serviceTitle = 'Chennai to Tiruchendur Murugan Temple Cab Package',
  ...props
}) {
  return (
    <TourBookingEngine
      serviceSlug="tiruchendur-temple-tour"
      serviceTitle={serviceTitle}
      {...props}
    />
  );
}

