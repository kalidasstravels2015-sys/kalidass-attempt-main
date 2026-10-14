import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';

export default function KanchipuramBookingEngine({
  serviceTitle = 'Chennai to Kanchipuram Temple & Silk Tour Cab Package',
  ...props
}) {
  return (
    <TourBookingEngine
      serviceSlug="kanchipuram-temple-trip"
      serviceTitle={serviceTitle}
      {...props}
    />
  );
}
