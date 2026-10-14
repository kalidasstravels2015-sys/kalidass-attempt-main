import React from 'react';
import TourBookingEngine from './TourBookingEngine.jsx';

export default function ThiruvannamalaiBookingEngine({
  serviceTitle = 'Chennai to Thiruvannamalai Girivalam Taxi & Temple Darshan Package',
  ...props
}) {
  return (
    <TourBookingEngine
      serviceSlug="thiruvannamalai-girivalam-trip"
      serviceTitle={serviceTitle}
      {...props}
    />
  );
}
