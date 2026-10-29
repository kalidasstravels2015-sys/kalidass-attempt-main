import React from 'react';
import BookingEngine from './BookingEngine.jsx';

/**
 * Dedicated Material 3 Quotation Engine for Tempo Traveller fleet:
 * Unified with Savaari standard BookingEngine.
 */
export default function TempoQuotationEngine({
  title = '',
  subtitle = '',
  initialDrop = '',
  initialPickup = 'Chennai, Tamil Nadu',
  initialTab = 'outstation',
  allowedTabs = ['outstation', 'local'],
  ...restProps
}) {
  const mappedTab = (initialTab === 'round' || initialTab === 'oneway') ? 'outstation' : initialTab;
  const mappedAllowed = (allowedTabs || ['outstation', 'local']).map(t => (t === 'round' || t === 'oneway') ? 'outstation' : t);

  return (
    <div id="tempo-quotation-engine" className="w-full">
      <BookingEngine
        initialTab={mappedTab}
        allowedTabs={mappedAllowed}
        initialVehicle="Tempo Traveller"
        initialDrop={initialDrop}
        initialPickup={initialPickup}
        serviceSlug="tempo-traveller-rental-chennai"
        prefill={{
          pickup: initialPickup,
          destination: initialDrop,
          vehicle: 'Tempo Traveller'
        }}
        variant="card"
        title={title || "Tempo Traveller Fare Calculator"}
        subtitle={subtitle}
        {...restProps}
      />
    </div>
  );
}
