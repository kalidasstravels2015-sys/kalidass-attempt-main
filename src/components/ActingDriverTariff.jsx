import React from 'react';
import { Clock, MapPin, Shield, Info, Car, Moon, CheckCircle2 } from 'lucide-react';

export default function ActingDriverTariff() {
  return (
    <div className="bg-m3-surface rounded-m3-lg shadow-m3-1 border border-m3-outline-variant overflow-hidden my-8 font-sans">
      <div className="bg-m3-surface-container-low p-6 border-b border-m3-outline-variant">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-m3-sm bg-m3-primary-container text-m3-on-primary-container text-xs font-bold uppercase tracking-wider mb-2">
          <span>Official Tariff Card</span>
        </div>
        <h3 className="text-xl font-bold text-m3-on-surface flex items-center gap-2 font-heading">
          <Info className="w-5 h-5 text-m3-primary" />
          <span>Acting Driver Tariff & Standard Rates</span>
        </h3>
        <p className="text-m3-on-surface-variant text-xs sm:text-sm mt-1">
          Transparent, time-based pricing for your personal car with zero peak-hour surge charges.
        </p>
      </div>

      <div className="divide-y divide-m3-outline-variant/60">
        {/* Local Trip (Within Chennai Metro) */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h4 className="font-bold text-m3-on-surface text-base flex items-center gap-2 font-heading">
              <Clock className="w-4 h-4 text-m3-primary" />
              <span>Within Chennai Metro (Time-Based, Zero KM Limit)</span>
            </h4>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-m3-full bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant">
              Most Popular
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center p-3 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant/50">
              <span className="text-m3-on-surface-variant">4 Hours Short Duty (Errands / Shopping)</span>
              <span className="font-bold text-m3-on-surface text-base">₹600</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant/50">
              <span className="text-m3-on-surface-variant">8 Hours Full Day Duty</span>
              <span className="font-bold text-m3-on-surface text-base">₹900</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant/50">
              <span className="text-m3-on-surface-variant">Extra Hour Rate</span>
              <span className="font-bold text-m3-on-surface text-base">₹150 / hr</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant/50">
              <span className="text-m3-on-surface-variant">Night Duty Allowance (10 PM – 5 AM)</span>
              <span className="font-bold text-m3-on-surface text-base">+₹200 flat</span>
            </div>
          </div>
        </div>

        {/* Outstation Trip (Daily Driver Bata) */}
        <div className="p-6 bg-m3-surface-container-lowest">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h4 className="font-bold text-m3-on-surface text-base flex items-center gap-2 font-heading">
              <MapPin className="w-4 h-4 text-m3-primary" />
              <span>Outstation Round Trip (Daily Driver Bata)</span>
            </h4>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-m3-full bg-m3-surface-container-high text-m3-on-surface">
              Up to 14 hrs/day
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center p-3 rounded-m3-md bg-m3-surface border border-m3-outline-variant/50">
              <span className="text-m3-on-surface-variant">Hatchback & Sedan (Dzire, City, Verna)</span>
              <span className="font-bold text-m3-on-surface text-base">₹600 / day</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-m3-md bg-m3-surface border border-m3-outline-variant/50">
              <span className="text-m3-on-surface-variant">Compact SUV / MPV (Ertiga, Creta, Carens)</span>
              <span className="font-bold text-m3-on-surface text-base">₹700 / day</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-m3-md bg-m3-surface border border-m3-outline-variant/50">
              <span className="text-m3-on-surface-variant">Premium SUV / MPV (Innova Crysta, Fortuner)</span>
              <span className="font-bold text-m3-on-surface text-base">₹800 / day</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-m3-md bg-m3-surface border border-m3-outline-variant/50">
              <span className="text-m3-on-surface-variant">Luxury European (BMW, Audi, Benz)</span>
              <span className="font-bold text-m3-on-surface text-base">₹1,000 / day</span>
            </div>
            
            <div className="col-span-full p-3 bg-m3-surface-container-low text-m3-on-surface rounded-m3-md border border-m3-outline-variant text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-m3-primary shrink-0 mt-0.5" />
              <span><strong>Food & Lodging Note:</strong> Driver meal allowance is ₹150/meal (if not sharing family meals). Overnight room allowance is ₹300/night only if hotel does not provide driver dormitory.</span>
            </div>
          </div>
        </div>

        {/* Specialized Driving Duties */}
        <div className="p-6">
          <h4 className="font-bold text-m3-on-surface text-base mb-4 flex items-center gap-2 font-heading">
            <Shield className="w-4 h-4 text-m3-primary" />
            <span>Specialized Chauffeur Retainers & Relocation</span>
          </h4>
          <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center p-3 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant/50">
              <span className="text-m3-on-surface-variant">Senior Citizen & Medical Standby (4h / 8h)</span>
              <span className="font-bold text-m3-on-surface text-base">₹700 / ₹1,000</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant/50">
              <span className="text-m3-on-surface-variant">Night Duty Safe Return (Up to 3 hrs)</span>
              <span className="font-bold text-m3-on-surface text-base">₹800</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant/50">
              <span className="text-m3-on-surface-variant">One-Way Car Relocation (Base 150 km)</span>
              <span className="font-bold text-m3-on-surface text-base">₹1,800 + ₹10/km</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-m3-md bg-m3-surface-container-low border border-m3-outline-variant/50">
              <span className="text-m3-on-surface-variant">Monthly Office Commute (26 Days)</span>
              <span className="font-bold text-m3-on-surface text-base">₹12k – ₹15k / mo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
