import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';

export default function ChidambaramBookingEngine({
  serviceTitle = 'Chennai to Chidambaram Natarajar Temple & Pichavaram Mangrove Taxi',
  ...props
}) {
  return (
    <TourBookingEngine
      serviceSlug="chidambaram-temple-trip"
      serviceTitle={serviceTitle}
      {...props}
    />
  );
}
