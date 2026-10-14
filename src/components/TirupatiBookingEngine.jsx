import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';
import { TOUR_CONFIGS } from '../data/tourBookingConfigs.js';

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
