import React from 'react';
import QuotationEngine from './QuotationEngine.jsx';

/**
 * Dedicated Material 3 Quotation Engine for Tempo Traveller fleet:
 * - 12-Seater Luxury Force Tempo
 * - 17-Seater Executive Force Tempo
 * - Force Urbania VIP Luxury
 *
 * Enforces 300 km/day outstation minimum slab, transparent itemized pricing,
 * and seamless WhatsApp dispatch with 24-hr price lock.
 */
export default function TempoQuotationEngine({
  currentLang = 'en',
  title = '',
  subtitle = '',
  initialTab = 'round',
  initialPickup = 'Chennai, Tamil Nadu',
  initialDrop = '',
  initialVehicle = '12-Seater Luxury Force Tempo',
  initialPassengers = '12',
  autoCalculate = false,
  showAirportTab = false,
  allowedTabs = ['round', 'local'],
  showHeader = true,
  ...restProps
}) {
  const isTa = currentLang === 'ta';
  const defaultTitle = title || (isTa ? 'டெம்போ டிராவலர் கட்டண கால்குலேட்டர்' : 'Tempo Traveller Fare Calculator');
  const defaultSubtitle = subtitle || (
    isTa 
      ? 'உடனடி அவுட்ஸ்டேஷன் & லோக்கல் கட்டணங்கள் • Force Tempo 12–26 இருக்கை மற்றும் அர்பானியா' 
      : 'Instant Outstation & Local Estimates • Force Tempo Travellers (12–26 Seater) & Force Urbania'
  );

  return (
    <div id="tempo-quotation-engine" className="w-full">
      <QuotationEngine
        currentLang={currentLang}
        tempoOnly={true}
        showHeader={showHeader}
        title={defaultTitle}
        subtitle={defaultSubtitle}
        initialTab={initialTab}
        initialPickup={initialPickup}
        initialDrop={initialDrop}
        initialVehicle={initialVehicle}
        initialPassengers={initialPassengers}
        autoCalculate={autoCalculate}
        showAirportTab={showAirportTab}
        allowedTabs={allowedTabs}
        {...restProps}
      />
    </div>
  );
}
