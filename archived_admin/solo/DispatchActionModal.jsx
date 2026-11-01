import React, { useState, useEffect } from 'react';
import defaultDrivers from '../../../data/drivers_roster.json';
import {
  buildWhatsAppUrl,
  buildDriverDutySlipMessage,
  buildCustomerCabDetailsMessage,
  buildAdvancePaymentRequestMessage
} from '../../../utils/whatsappTemplates';

export default function DispatchActionModal({
  booking,
  isOpen,
  onClose,
  onConfirmDispatch,
  driversList = defaultDrivers
}) {
  if (!isOpen || !booking) return null;

  const fareNum = parseInt(String(booking.terminalFare || booking.fare || '0').replace(/[^0-9]/g, ''), 10) || 0;
  const initAdv = parseInt(String(booking.advancePaid || booking.advance || '500').replace(/[^0-9]/g, ''), 10) || 0;

  const [advancePaid, setAdvancePaid] = useState(initAdv);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleName, setVehicleName] = useState(booking.vehicleCategory || 'Sedan');
  const [vehiclePlate, setVehiclePlate] = useState('');

  // Extract clean guest phone
  const rawGuestStr = `${booking.guestNamePhone || ''} ${booking.phone || ''}`;
  const phoneMatch = rawGuestStr.match(/[6-9]\d{9}/);
  const guestPhone = phoneMatch ? phoneMatch[0] : '';
  const guestName = (booking.guestNamePhone || booking.guestName || 'Customer').split('(')[0].trim();

  // If booking already had assigned chauffeur, initialize
  useEffect(() => {
    if (booking.assignedChauffeur && booking.assignedChauffeur !== 'Unassigned') {
      const matchRoster = driversList.find(d => d.name.toLowerCase() === booking.assignedChauffeur.toLowerCase() || booking.assignedChauffeur.toLowerCase().includes(d.name.toLowerCase()));
      if (matchRoster) {
        setSelectedDriverId(matchRoster.id);
        setDriverName(matchRoster.name);
        setDriverPhone(matchRoster.phone);
        setVehicleName(matchRoster.vehicle);
        setVehiclePlate(matchRoster.plate);
      } else {
        setDriverName(booking.assignedChauffeur);
      }
    } else if (driversList.length > 0) {
      // Default to first driver for fast 1-click
      const first = driversList[0];
      setSelectedDriverId(first.id);
      setDriverName(first.name);
      setDriverPhone(first.phone);
      setVehicleName(first.vehicle);
      setVehiclePlate(first.plate);
    }
  }, [booking, driversList]);

  const handleSelectDriver = (e) => {
    const id = e.target.value;
    setSelectedDriverId(id);
    const found = driversList.find(d => d.id === id);
    if (found) {
      setDriverName(found.name);
      setDriverPhone(found.phone);
      setVehicleName(found.vehicle);
      setVehiclePlate(found.plate);
    } else {
      setSelectedDriverId('custom');
      setDriverName('');
      setDriverPhone('');
      setVehiclePlate('');
    }
  };

  const collectionAmount = Math.max(0, fareNum - advancePaid);

  // Generate WhatsApp messages
  const dutySlipText = buildDriverDutySlipMessage({
    bookingId: booking.bookingId,
    travelDateTime: booking.travelDateTime || 'Tomorrow Morning',
    pickupAddress: booking.pickupAddress || 'Chennai',
    guestName,
    guestPhone,
    driverName: driverName || 'Moorthy',
    vehicleName: vehicleName || 'Cab',
    vehiclePlate: vehiclePlate || '',
    collectionAmount
  });

  const guestCabText = buildCustomerCabDetailsMessage({
    bookingId: booking.bookingId,
    driverName: driverName || 'Moorthy',
    driverPhone: driverPhone || '8939539211',
    vehicleName: vehicleName || 'Cab',
    vehiclePlate: vehiclePlate || '',
    collectionAmount
  });

  const driverWhatsAppUrl = buildWhatsAppUrl(driverPhone, dutySlipText);
  const guestWhatsAppUrl = buildWhatsAppUrl(guestPhone, guestCabText);

  const advancePaymentText = buildAdvancePaymentRequestMessage({
    bookingId: booking.bookingId,
    guestName,
    vehicleCategory: vehicleName,
    advanceAmount: advancePaid || 500,
    balanceAmount: collectionAmount,
    upiId: 'saravn.appu@okhdfcbank'
  });
  const advanceWhatsAppUrl = buildWhatsAppUrl(guestPhone, advancePaymentText);

  const handleSave = () => {
    const chauffeurLabel = vehiclePlate ? `${driverName} (${vehiclePlate})` : (driverName || 'Assigned Driver');
    onConfirmDispatch({
      ...booking,
      assignedChauffeur: chauffeurLabel,
      driverName,
      driverPhone,
      vehiclePlate,
      advancePaid,
      balanceDue: collectionAmount,
      manifestStatus: 'Scheduled'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-m3-surface rounded-2xl shadow-2xl border border-m3-outline-variant overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-m3-primary text-m3-on-primary flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-m3-primary-container">
              Trip Dispatch Controller
            </div>
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <span>🚖 Assign Driver &amp; Send WhatsApp</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono-code font-bold">
                {booking.bookingId}
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white text-base font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs sm:text-sm text-m3-on-surface">
          {/* Trip Summary Card */}
          <div className="p-3 rounded-xl bg-m3-surface-container-low border border-m3-outline-variant/60 space-y-1">
            <div className="font-extrabold text-sm text-m3-on-surface">
              📍 {booking.pickupAddress || 'Chennai'}
            </div>
            <div className="text-xs text-m3-on-surface-variant flex flex-wrap gap-2 font-medium">
              <span>🗓️ {booking.travelDateTime}</span>
              <span>•</span>
              <span>👤 {guestName} {guestPhone ? `(+91 ${guestPhone})` : ''}</span>
            </div>
          </div>

          {/* Financials & Cash Collection Calculation */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">Total Quoted Fare:</span>
              <span className="font-mono-code font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                ₹{fareNum.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label htmlFor="advPaidInput" className="font-semibold text-emerald-900 dark:text-emerald-200">Advance Paid by Guest:</label>
              <div className="flex items-center gap-1">
                <span className="font-bold text-emerald-800">₹</span>
                <input
                  id="advPaidInput"
                  type="number"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                  className="w-24 px-2 py-1 bg-white dark:bg-emerald-900/60 border border-emerald-400 rounded-md font-mono-code font-bold text-emerald-900 dark:text-emerald-100 text-right outline-none"
                />
              </div>
            </div>

            {guestPhone && (
              <div className="pt-1 flex items-center justify-end">
                <a
                  href={advanceWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[13px]">qr_code_2</span>
                  <span>📲 Send ₹{advancePaid || 500} UPI Advance Request to Guest</span>
                </a>
              </div>
            )}

            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between font-extrabold text-sm">
              <span className="text-emerald-950 dark:text-emerald-100">💵 Driver Must Collect from Guest:</span>
              <span className="font-mono-code text-base text-emerald-700 dark:text-emerald-300">
                ₹{collectionAmount.toLocaleString('en-IN')} + Tolls/Parking
              </span>
            </div>
          </div>

          {/* Driver & Vehicle Selection */}
          <div className="space-y-2.5">
            <label htmlFor="driverSelectDropdown" className="block text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
              Select Chauffeur &amp; Vehicle
            </label>
            <select
              id="driverSelectDropdown"
              value={selectedDriverId}
              onChange={handleSelectDriver}
              className="w-full p-2.5 rounded-xl border border-m3-outline-variant bg-m3-surface font-semibold text-m3-on-surface text-xs sm:text-sm outline-none focus:border-m3-primary"
            >
              {driversList.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.vehicle} ({d.plate}) — 📞 {d.phone}
                </option>
              ))}
              <option value="custom">+ Type Outside / New Chauffeur</option>
            </select>

            {/* Editable Fields for Driver Details */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label htmlFor="modalDriverNameInput" className="block text-[11px] font-bold text-m3-on-surface-variant mb-0.5">Driver Name</label>
                <input
                  id="modalDriverNameInput"
                  type="text"
                  placeholder="e.g. Moorthy"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-m3-outline-variant bg-m3-surface text-xs font-semibold outline-none"
                />
              </div>
              <div>
                <label htmlFor="modalDriverPhoneInput" className="block text-[11px] font-bold text-m3-on-surface-variant mb-0.5">Driver Phone (10 digits)</label>
                <input
                  id="modalDriverPhoneInput"
                  type="tel"
                  placeholder="e.g. 7305282977"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full p-2 rounded-lg border border-m3-outline-variant bg-m3-surface text-xs font-mono-code font-bold outline-none"
                />
              </div>
              <div>
                <label htmlFor="modalVehicleNameInput" className="block text-[11px] font-bold text-m3-on-surface-variant mb-0.5">Vehicle Model</label>
                <input
                  id="modalVehicleNameInput"
                  type="text"
                  placeholder="e.g. Maruti XL6"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-m3-outline-variant bg-m3-surface text-xs font-semibold outline-none"
                />
              </div>
              <div>
                <label htmlFor="modalVehiclePlateInput" className="block text-[11px] font-bold text-m3-on-surface-variant mb-0.5">Vehicle Number Plate</label>
                <input
                  id="modalVehiclePlateInput"
                  type="text"
                  placeholder="e.g. TN85W4093"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-m3-outline-variant bg-m3-surface text-xs font-mono-code font-bold uppercase outline-none"
                />
              </div>
            </div>
          </div>

          {/* DUAL 1-TAP WHATSAPP ACTIONS */}
          <div className="pt-2 space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
              1-Tap WhatsApp Dispatch Actions
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={driverWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#075E54] hover:bg-[#054c44] text-white flex items-center justify-center gap-2 font-bold text-xs shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>1. Send Duty Slip to Driver</span>
              </a>

              <a
                href={guestWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#128C7E] hover:bg-[#0e7065] text-white flex items-center justify-center gap-2 font-bold text-xs shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">send_to_mobile</span>
                <span>2. Send Cab Details to Guest</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer: Confirm Button */}
        <div className="p-3 bg-m3-surface-container-low border-t border-m3-outline-variant flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-m3-outline-variant text-m3-on-surface text-xs font-semibold hover:bg-m3-surface-container transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Confirm &amp; Move to Scheduled</span>
          </button>
        </div>
      </div>
    </div>
  );
}
