import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';

export default function VelloreBookingEngine({
  serviceTitle = 'Chennai to Vellore Golden Temple & CMC Hospital Taxi',
  ...props
}) {
  return (
    <TourBookingEngine
      serviceSlug="vellore-golden-temple"
      serviceTitle={serviceTitle}
      {...props}
    />
  );
}
