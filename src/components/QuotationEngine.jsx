import React from 'react';
import BookingEngine from './BookingEngine.jsx';

/**
 * Unified QuotationEngine:
 * Delegates to the clean, transparent, Savaari standard BookingEngine component.
 */
export default function QuotationEngine({
  initialTab = 'round',
  allowedTabs,
  initialPickup,
  initialDrop,
  title,
  subtitle,
  variant = 'card',
  showHeader = true,
  ...restProps
}) {
  const mappedTab = initialTab === 'airport' ? 'airport' : initialTab === 'local' ? 'local' : 'outstation';
  const mappedAllowed = allowedTabs 
    ? allowedTabs.map(t => (t === 'round' || t === 'oneway' ? 'outstation' : t))
    : ['outstation', 'local', 'airport'];

  return (
    <BookingEngine
      initialTab={mappedTab}
      allowedTabs={mappedAllowed}
      prefill={{
        pickup: initialPickup,
        destination: initialDrop
      }}
      title={title}
      subtitle={subtitle}
      variant={variant}
      showHeader={showHeader}
      {...restProps}
    />
  );
}
