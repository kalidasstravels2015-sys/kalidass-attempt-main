import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';

export default function TirupatiBookingEngine({
  serviceTitle = 'Chennai to Tirupati Cab & Balaji Darshan Taxi Package',
  ...props
}) {
  return (
    <TourBookingEngine
      serviceSlug="tirupati-package"
      serviceTitle={serviceTitle}
      {...props}
    />
  );
}
