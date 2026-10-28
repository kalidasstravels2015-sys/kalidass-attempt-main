import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';

export default function SabarimalaBookingEngine({
  serviceTitle = 'Chennai to Sabarimala Pilgrimage Taxi Package',
  ...props
}) {
  return (
    <TourBookingEngine
      serviceSlug="sabarimala-trip"
      serviceTitle={serviceTitle}
      {...props}
    />
  );
}
