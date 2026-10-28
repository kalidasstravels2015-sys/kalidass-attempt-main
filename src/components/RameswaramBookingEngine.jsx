import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';

export default function RameswaramBookingEngine({
  serviceTitle = 'Chennai to Rameswaram & Dhanushkodi Taxi Package',
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
