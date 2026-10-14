import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';

export default function RameswaramBookingEngine({
  serviceTitle = 'Chennai to Rameswaram & Dhanushkodi 2 Days Cab Package',
  ...props
}) {
  return (
    <TourBookingEngine
      serviceSlug="rameswaram-2-days"
      serviceTitle={serviceTitle}
      {...props}
    />
  );
}
