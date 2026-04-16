import React from 'react';
import { Clock, MapPin, Shield, Info } from 'lucide-react';

export default function ActingDriverTariff() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden my-8">
      <div className="bg-slate-50 p-6 border-b border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-600" />
          Acting Driver Tariff Card
        </h3>
        <p className="text-slate-500 text-sm mt-2">
          An 'acting driver' or 'call driver' calculator is a way to estimate the cost of hiring a driver based on service type and duration.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {/* Local Trip */}
        <div className="p-6">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span className="lang-en">Local Trip (City Limits)</span>
            <span className="lang-ta">உள்ளூர் பயணம் (நகர வரம்புகள்)</span>
          </h4>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2 sm:border-0 sm:pb-0">
              <span className="text-slate-600">
                <span className="lang-en">Minimum (4 Hours)</span>
                <span className="lang-ta">குறைந்தபட்சம் (4 மணிநேரம்)</span>
              </span>
              <span className="font-semibold text-slate-900">₹450 - ₹500</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-2 sm:border-0 sm:pb-0">
              <span className="text-slate-600">
                <span className="lang-en">Extra Hour</span>
                <span className="lang-ta">கூடுதல் மணிநேரம்</span>
              </span>
              <span className="font-semibold text-slate-900">₹80 - ₹100</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-2 sm:border-0 sm:pb-0">
              <span className="text-slate-600">
                <span className="lang-en">Night Charge (After 10 PM)</span>
                <span className="lang-ta">இரவு கட்டணம் (இரவு 10 மணிக்குப் பிறகு)</span>
              </span>
              <span className="font-semibold text-slate-900">+ ₹50 - ₹100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">
                <span className="lang-en">Multi-Location Pickup/Drop</span>
                <span className="lang-ta">பல இடங்கள் பிக்கப்/டிராப்</span>
              </span>
              <span className="font-semibold text-slate-900">+ ₹50 - ₹100</span>
            </div>
          </div>
        </div>

        {/* Outstation Trip */}
        <div className="p-6 bg-slate-50">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <span className="lang-en">Outstation Trip</span>
            <span className="lang-ta">வெளியூர் பயணம்</span>
          </h4>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2 sm:border-0 sm:pb-0">
              <span className="text-slate-600">
                <span className="lang-en">Per Day (12 Hours)</span>
                <span className="lang-ta">ஒரு நாளைக்கு (12 மணிநேரம்)</span>
              </span>
              <span className="font-semibold text-slate-900">₹1100 - ₹1300</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2 sm:border-0 sm:pb-0">
              <span className="text-slate-600">
                <span className="lang-en">Extra Hour</span>
                <span className="lang-ta">கூடுதல் மணிநேரம்</span>
              </span>
              <span className="font-semibold text-slate-900">₹80 - ₹100</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2 sm:border-0 sm:pb-0">
              <span className="text-slate-600">
                <span className="lang-en">One-Way Drop (Min 150km)</span>
                <span className="lang-ta">ஒரு வழி பயணம் (குறைந்தபட்சம் 150 கி.மீ)</span>
              </span>
              <span className="font-semibold text-slate-900">₹1300 - ₹1400</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">
                <span className="lang-en">Other State (Min 150km)</span>
                <span className="lang-ta">பிற மாநிலம் (குறைந்தபட்சம் 150 கி.மீ)</span>
              </span>
              <span className="font-semibold text-slate-900">₹1400 - ₹1500</span>
            </div>
            <div className="col-span-full mt-2 p-3 bg-orange-50 text-orange-800 rounded-lg text-xs">
              <strong>Note:</strong> 
              <span className="lang-en"> Food & Accommodation (₹200-300/day) to be provided by customer or paid extra.</span>
              <span className="lang-ta"> உணவு மற்றும் தங்குமிடம் (₹200-300/நாள்) வாடிக்கையாளரால் வழங்கப்பட வேண்டும் அல்லது கூடுதலாக செலுத்த வேண்டும்.</span>
            </div>
          </div>
        </div>

        {/* Other Charges */}
        <div className="p-6">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span className="lang-en">Other Services</span>
            <span className="lang-ta">பிற சேவைகள்</span>
          </h4>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2 sm:border-0 sm:pb-0">
              <span className="text-slate-600">
                <span className="lang-en">Luxury Cars</span>
                <span className="lang-ta">சொகுசு கார்கள்</span>
              </span>
              <span className="font-semibold text-slate-900">+ ₹50 - ₹100 /hr</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-2 sm:border-0 sm:pb-0">
              <span className="text-slate-600">
                <span className="lang-en">Valet Parking (4 Hrs)</span>
                <span className="lang-ta">வேலட் பார்க்கிங் (4 மணிநேரம்)</span>
              </span>
              <span className="font-semibold text-slate-900">₹599 (+ ₹99/hr)</span>
            </div>
             <div className="flex justify-between items-center border-b border-slate-50 pb-2 sm:border-0 sm:pb-0">
              <span className="text-slate-600">
                <span className="lang-en">Fixed Places (6 Hrs)</span>
                <span className="lang-ta">நிலையான இடங்கள் (6 மணிநேரம்)</span>
              </span>
              <span className="font-semibold text-slate-900">₹749 - ₹750</span>
            </div>
             <div className="flex justify-between items-center">
              <span className="text-slate-600">
                <span className="lang-en">Cancellation Fee</span>
                <span className="lang-ta">ரத்து கட்டணம்</span>
              </span>
              <span className="font-semibold text-slate-900">₹100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
