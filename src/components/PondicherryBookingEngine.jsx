import React from 'react';
import QuotationEngine from './QuotationEngine.jsx';

export default function PondicherryBookingEngine({
  serviceTitle = 'Chennai to Pondicherry Taxi & Sightseeing Tour',
  ...props
}) {
  return (
    <div id="pondicherry-quotation-engine" className="booking-engine w-full">
      <QuotationEngine
        title="Book Chennai to Pondicherry"
        subtitle="ECR Scenic Highway • Auroville • French White Town • ₹500 Advance to Confirm"
        initialPickup="Chennai, Tamil Nadu"
        initialDrop="French White Town / Promenade Beach, Pondicherry"
        dropPlaceholder="e.g. French White Town, Auroville, or Hotel"
        pickupPlaceholder="Enter pickup address in Chennai"
        dropLabel="Destination / Drop in Pondicherry"
        callButtonLabel="Call Dispatch"
        allowedTabs={['round']}
        initialTab="round"
        autoCalculate={true}
        collapseOnResult={false}
        showHeader={true}
        variant="card"
        {...props}
      />
    </div>
  );
}
