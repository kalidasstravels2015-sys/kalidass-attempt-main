import React from 'react';
import QuotationEngine from './QuotationEngine.jsx';
import { Clock } from 'lucide-react';

/**
 * LocalRentalBookingEngine
 * Dedicated engine card for Chennai Local City Packages.
 * Matches the proven, battle-tested homepage local package booking engine from QuotationEngine.
 */
export default function LocalRentalBookingEngine({
  showHeader = true,
  title = "Chennai Local City Rental",
  subtitle = "Hourly City Packages • Fuel & Driver Bata Included • Zero Surge",
  currentLang = "en"
}) {
  return (
    <div id="local-city-rental-engine" className="w-full">
      <QuotationEngine
        currentLang={currentLang}
        initialTab="local"
        allowedTabs={['local']}
        title={title}
        subtitle={subtitle}
        headerIcon={<Clock className="w-5 h-5 text-m3-primary" />}
        variant="card"
        showAirportTab={false}
      />
    </div>
  );
}
