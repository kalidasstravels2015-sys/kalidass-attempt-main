import React from 'react';
import BookingEngine from './BookingEngine.jsx';

/**
 * Unified Tour Booking Engine:
 * Delegates to the unified Savaari standard BookingEngine component.
 * Automatically hides destination input for fixed temple tour packages.
 */
export default function TourBookingEngine({
  serviceSlug = 'tirupati-package',
  serviceTitle = '',
  customConfig = null,
  pickupPlaceholder = 'Enter doorstep pickup address / area in Chennai (e.g. T. Nagar, Airport)',
  hideDestination = undefined,
  ...restProps
}) {
  const slug = (serviceSlug || '').toLowerCase();
  const isTempleTour = hideDestination !== undefined ? hideDestination : Boolean(
    slug.includes('tirupati') ||
    slug.includes('kanchipuram') ||
    slug.includes('thiruvannamalai') ||
    slug.includes('navagraha') ||
    slug.includes('kumbakonam') ||
    slug.includes('rameswaram') ||
    slug.includes('sabarimala') ||
    slug.includes('chidambaram') ||
    slug.includes('vellore') ||
    slug.includes('tiruchendur') ||
    slug.includes('madurai')
  );

  return (
    <div id="tour-booking-engine" className="w-full">
      <BookingEngine
        initialTab="outstation"
        allowedTabs={['outstation']}
        showTabs={false}
        showPopularChips={false}
        forceEmptyLocations={false}
        lockDestination={false}
        hideDestination={isTempleTour}
        pickupPlaceholder={pickupPlaceholder}
        serviceSlug={serviceSlug}
        serviceTitle={serviceTitle}
        variant="card"
        showHeader={false}
        {...restProps}
      />
    </div>
  );
}
