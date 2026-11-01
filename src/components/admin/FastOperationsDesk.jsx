import React, { useState, useEffect, useMemo } from 'react';
import tariffConfig from '../../data/tariff_config.json' with { type: 'json' };
import siteContent from '../../data/siteContent.json' with { type: 'json' };
import { getNextQuotationId } from '../../utils/sequenceGenerator.js';

const STORAGE_KEY = 'kt_solo_real_bookings_v8';
const PIN_KEY = 'kt_admin_pin_verified';
const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJ8_e8xR1kUjoRh2-wL0T6j9M'; // Kalidass Travels review link

export default function FastOperationsDesk() {
  // Security PIN state (Owner PIN: 2015)
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(PIN_KEY) === 'true';
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Core Bookings State
  const [bookings, setBookings] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed.filter(b => b && b.manifestStatus !== 'Cancelled');
        }
      } catch (_) {}
    }
    return [];
  });

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [intakeMode, setIntakeMode] = useState('notepad'); // 'notepad' | 'form'
  const [notepadText, setNotepadText] = useState('');
  const [syncStatus, setSyncStatus] = useState('Live');
  const [toast, setToast] = useState(null);

  // Form State
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTripCategory, setFormTripCategory] = useState('local'); // 'local' | 'tour' | 'outstation'
  const [formVehicle, setFormVehicle] = useState('Swift Dzire');
  const [formPackage, setFormPackage] = useState('4hr_40km');
  const [formDays, setFormDays] = useState(1);
  const [formTourPackageKey, setFormTourPackageKey] = useState('tirupati-package');
  const [formPickupTime, setFormPickupTime] = useState('08:00 AM');
  const [formPickupDate, setFormPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formPickupLocation, setFormPickupLocation] = useState('');
  const [formAgreedRate, setFormAgreedRate] = useState(1600);
  const [formAdvance, setFormAdvance] = useState(0);

  // Modal States
  const [assigningBooking, setAssigningBooking] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [customDriverName, setCustomDriverName] = useState('');
  const [customDriverPhone, setCustomDriverPhone] = useState('');
  const [customVehicleNo, setCustomVehicleNo] = useState('');

  // Settlement Modal State
  const [settlingBooking, setSettlingBooking] = useState(null);
  const [closingKm, setClosingKm] = useState('');
  const [extraKmCharge, setExtraKmCharge] = useState(0);
  const [extraHoursCharge, setExtraHoursCharge] = useState(0);
  const [finalCollected, setFinalCollected] = useState(0);

  // Active Printable Duty Slip Modal
  const [printDutySlip, setPrintDutySlip] = useState(null);

  const driversRoster = useMemo(() => {
    return (siteContent?.drivers || []).map(d => ({
      name: d.name,
      phone: d.phone || '9840629716',
      specialty: d.specialty || 'Commercial Chauffeur'
    }));
  }, []);

  const vehiclesList = useMemo(() => {
    return Object.keys(tariffConfig?.vehicles || { 'Swift Dzire': {}, 'Toyota Etios': {}, 'Maruti Ertiga': {}, 'Innova': {}, 'Innova Crysta': {}, 'Tempo Traveller': {} });
  }, []);

  const tourPackagesList = useMemo(() => {
    return Object.entries(tariffConfig?.tour_packages || {}).map(([key, item]) => ({
      key,
      name: item.name || key,
      stateCode: item.stateCode || 'TN'
    }));
  }, []);

  // Save to LocalStorage & Server
  const saveBookingsState = (newBookings) => {
    setBookings(newBookings);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookings));
      } catch (_) {}
    }
  };

  const showNotification = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync with Backend
  const syncWithServer = async () => {
    setSyncStatus('Syncing...');
    try {
      const res = await fetch('/api/admin/bookings/');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.bookings) && data.bookings.length > 0) {
          // Merge remote bookings with local
          const localMap = new Map(bookings.map(b => [String(b.bookingId).toLowerCase(), b]));
          data.bookings.forEach((rb) => {
            const key = String(rb.bookingId).toLowerCase();
            if (!localMap.has(key)) {
              localMap.set(key, rb);
            }
          });
          const merged = Array.from(localMap.values());
          saveBookingsState(merged);
        }
      }
      setSyncStatus('Live');
    } catch (_) {
      setSyncStatus('Local');
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      syncWithServer();
    }
  }, [isUnlocked]);

  // PIN Verification
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim() === '2015') {
      setIsUnlocked(true);
      setPinError(false);
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(PIN_KEY, 'true');
      }
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(PIN_KEY);
    }
    setIsUnlocked(false);
  };

  // Auto calculate tariff rate when inputs change in Form mode
  useEffect(() => {
    if (formTripCategory === 'local') {
      const vData = tariffConfig.vehicles?.[formVehicle];
      if (vData) {
        if (formPackage === '4hr_40km') setFormAgreedRate(vData.local_4hr_pkg || 1600);
        else if (formPackage === '5hr_50km') setFormAgreedRate(vData.local_5hr_pkg || 1800);
        else if (formPackage === '8hr_80km') setFormAgreedRate(vData.local_8hr_pkg || 2600);
        else if (formPackage === '10hr_100km') setFormAgreedRate(vData.local_10hr_pkg || 3100);
        else if (formPackage === '12hr_120km') setFormAgreedRate(vData.local_12hr_pkg || 3700);
      }
    } else if (formTripCategory === 'tour') {
      const tour = tariffConfig.tour_packages?.[formTourPackageKey];
      if (tour) {
        const vKey = formVehicle.toLowerCase().includes('innova') ? 'innova' :
                     formVehicle.toLowerCase().includes('crysta') ? 'crysta' :
                     formVehicle.toLowerCase().includes('tempo') ? 'tempo12' :
                     formVehicle.toLowerCase().includes('ertiga') ? 'ertiga' : 'dzire';
        const daysKey = String(Math.min(formDays, 3));
        const rate = tour.vehicles?.[vKey]?.rates?.[daysKey] || tour.vehicles?.[vKey]?.rates?.['1'] || 6000;
        setFormAgreedRate(rate);
      }
    } else if (formTripCategory === 'outstation') {
      const vData = tariffConfig.vehicles?.[formVehicle];
      if (vData) {
        const minKmPerDay = vData.min_km_per_day || 250;
        const totalKm = formDays * minKmPerDay;
        const baseFare = totalKm * (vData.round_trip_rate || 14);
        const bataTotal = formDays * (vData.driver_bata || 500);
        setFormAgreedRate(baseFare + bataTotal);
      }
    }
  }, [formTripCategory, formVehicle, formPackage, formDays, formTourPackageKey]);

  // Fast Notepad / WhatsApp Parser
  const parseNotepadSnippet = (text) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed = {
      customerName: '',
      phone: '',
      tripType: 'Local Package',
      vehicle: 'Swift Dzire',
      packageDesc: 'Local 4hr/40km',
      rate: 2000,
      advance: 0,
      pickupLocation: '',
      pickupTime: '08:00 AM'
    };

    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('contact name') || lower.includes('name :')) {
        parsed.customerName = line.split(/:(.+)/)[1]?.trim() || '';
      } else if (lower.includes('contact number') || lower.includes('contat number') || lower.includes('phone') || lower.includes('mobile')) {
        const numMatch = line.match(/(\d{10})/);
        if (numMatch) parsed.phone = numMatch[1];
        else parsed.phone = line.split(/:(.+)/)[1]?.trim() || '';
      } else if (lower.includes('trip type')) {
        const t = line.split(/:(.+)/)[1]?.trim() || '';
        if (t.toLowerCase().includes('local')) parsed.tripType = 'Local Package';
        else if (t.toLowerCase().includes('outstation')) parsed.tripType = 'Outstation Round Trip';
        else parsed.tripType = t;
      } else if (lower.includes('vehicle')) {
        const v = line.split(/:(.+)/)[1]?.trim() || '';
        if (v.toLowerCase().includes('dzire')) parsed.vehicle = 'Swift Dzire';
        else if (v.toLowerCase().includes('etios')) parsed.vehicle = 'Toyota Etios';
        else if (v.toLowerCase().includes('ertiga')) parsed.vehicle = 'Maruti Ertiga';
        else if (v.toLowerCase().includes('crysta')) parsed.vehicle = 'Innova Crysta';
        else if (v.toLowerCase().includes('innova')) parsed.vehicle = 'Innova';
        else if (v.toLowerCase().includes('tempo')) parsed.vehicle = 'Tempo Traveller';
        else parsed.vehicle = v;
      } else if (lower.includes('package') || lower.includes('pakage') || lower.includes('hr/')) {
        parsed.packageDesc = line.replace(/^(local\s*package|pakage)\s*[:\s]*/i, '').trim() || line;
      } else if (lower.includes('rate') || lower.includes('fare')) {
        const match = line.match(/(\d+)/);
        if (match) parsed.rate = parseInt(match[1], 10);
      } else if (lower.includes('advance')) {
        const match = line.match(/(\d+)/);
        if (match) parsed.advance = parseInt(match[1], 10);
      } else if (lower.includes('pick up location') || lower.includes('pickup location') || lower.includes('location')) {
        parsed.pickupLocation = line.split(/:(.+)/)[1]?.trim() || '';
      } else if (lower.includes('pickup time') || lower.includes('time :')) {
        parsed.pickupTime = line.split(/:(.+)/)[1]?.trim() || '';
      }
    });

    return parsed;
  };

  const handleCreateFromNotepad = () => {
    if (!notepadText.trim()) {
      showNotification('Please paste your Notepad or WhatsApp notes first.', 'error');
      return;
    }

    const parsed = parseNotepadSnippet(notepadText);
    if (!parsed.customerName && !parsed.phone) {
      showNotification('Could not detect customer name or phone. Please verify.', 'error');
      return;
    }

    const bId = getNextQuotationId(bookings);
    const newBooking = {
      bookingId: bId,
      guestNamePhone: `${parsed.customerName || 'Customer'} (${parsed.phone || 'N/A'})`,
      customerName: parsed.customerName || 'Customer',
      phone: parsed.phone || '',
      travelDateTime: `${formPickupDate} ${parsed.pickupTime || '08:00 AM'}`,
      pickupTime: parsed.pickupTime || '08:00 AM',
      pickupDate: formPickupDate,
      pickupAddress: parsed.pickupLocation || 'Location as per Google Maps link',
      vehicleCategory: parsed.vehicle,
      darshanStatus: parsed.packageDesc || parsed.tripType,
      tripType: parsed.tripType,
      manifestStatus: 'Unassigned',
      assignedChauffeur: 'Unassigned',
      assignedVehicleNo: '',
      terminalFare: Number(parsed.rate) || 2000,
      advancePaid: Number(parsed.advance) || 0,
      balanceDue: (Number(parsed.rate) || 2000) - (Number(parsed.advance) || 0),
      financialClosure: 'Pending',
      reviewStatus: 'Pending',
      notes: `Pasted from Notepad. Package: ${parsed.packageDesc}`,
      createdAt: new Date().toISOString()
    };

    const updated = [newBooking, ...bookings];
    saveBookingsState(updated);
    setNotepadText('');
    showNotification(`Booking ${bId} created successfully for ${parsed.customerName}!`);

    // Sync to backend
    fetch('/api/admin/bookings/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking)
    }).catch(() => {});
  };

  const handleCreateFromForm = (e) => {
    e.preventDefault();
    if (!formCustomerName.trim()) {
      showNotification('Please enter customer name.', 'error');
      return;
    }

    const bId = getNextQuotationId(bookings);
    let pkgLabel = formTripCategory === 'local' ? `Local ${formPackage.replace('_', '/')}` :
                   formTripCategory === 'tour' ? `Tour: ${tourPackagesList.find(t => t.key === formTourPackageKey)?.name} (${formDays} Day)` :
                   `Outstation (${formDays} Days)`;

    const newBooking = {
      bookingId: bId,
      guestNamePhone: `${formCustomerName.trim()} (${formPhone.trim() || 'N/A'})`,
      customerName: formCustomerName.trim(),
      phone: formPhone.trim(),
      travelDateTime: `${formPickupDate} ${formPickupTime}`,
      pickupTime: formPickupTime,
      pickupDate: formPickupDate,
      pickupAddress: formPickupLocation.trim() || 'Pickup Location / Maps Link',
      vehicleCategory: formVehicle,
      darshanStatus: pkgLabel,
      tripType: formTripCategory,
      manifestStatus: 'Unassigned',
      assignedChauffeur: 'Unassigned',
      assignedVehicleNo: '',
      terminalFare: Number(formAgreedRate) || 0,
      advancePaid: Number(formAdvance) || 0,
      balanceDue: Math.max(0, (Number(formAgreedRate) || 0) - (Number(formAdvance) || 0)),
      financialClosure: 'Pending',
      reviewStatus: 'Pending',
      notes: `Created via Fast Form. ${pkgLabel}`,
      createdAt: new Date().toISOString()
    };

    const updated = [newBooking, ...bookings];
    saveBookingsState(updated);
    setFormCustomerName('');
    setFormPhone('');
    setFormPickupLocation('');
    showNotification(`Booking ${bId} created successfully!`);

    // Sync to backend
    fetch('/api/admin/bookings/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking)
    }).catch(() => {});
  };

  // Assign Driver & Cab Modal Handler
  const openAssignModal = (booking) => {
    setAssigningBooking(booking);
    setSelectedDriver(driversRoster[0]?.name || '');
    setCustomDriverName('');
    setCustomDriverPhone(driversRoster[0]?.phone || '9840629716');
    setCustomVehicleNo('TN 01 AB 1234');
  };

  const handleConfirmAssignment = () => {
    if (!assigningBooking) return;
    const finalDriverName = customDriverName.trim() || selectedDriver;
    const finalDriverPhone = customDriverPhone.trim() || '9840629716';
    const finalVehicleNo = customVehicleNo.trim() || 'TN 01 AB 1234';

    const updated = bookings.map(b => {
      if (b.bookingId === assigningBooking.bookingId) {
        return {
          ...b,
          manifestStatus: 'In Progress',
          assignedChauffeur: `${finalDriverName} (${finalDriverPhone})`,
          driverName: finalDriverName,
          driverPhone: finalDriverPhone,
          assignedVehicleNo: finalVehicleNo
        };
      }
      return b;
    });

    saveBookingsState(updated);
    showNotification(`Driver ${finalDriverName} assigned to ${assigningBooking.customerName || 'customer'}!`);

    // Sync to backend
    fetch('/api/admin/bookings/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        bookingId: assigningBooking.bookingId,
        manifestStatus: 'In Progress',
        assignedChauffeur: `${finalDriverName} (${finalDriverPhone})`,
        assignedVehicleNo: finalVehicleNo
      })
    }).catch(() => {});

    setAssigningBooking(null);
  };

  // WhatsApp Message Generators
  const sendCustomerWhatsApp = (booking) => {
    const custPhone = booking.phone?.replace(/[^0-9]/g, '') || '';
    const driver = booking.driverName || booking.assignedChauffeur || 'Our Chauffeur';
    const driverPhone = booking.driverPhone || '9840629716';
    const vehNo = booking.assignedVehicleNo || 'Assigned Cab';
    const custName = booking.customerName || booking.guestNamePhone?.split('(')[0]?.trim() || 'Valued Guest';

    const message = 
`*KALIDASS TRAVELS — TRIP CONFIRMATION*
━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *${custName}*, your trip is confirmed!

🚗 *Vehicle:* ${booking.vehicleCategory} (${vehNo})
👨‍✈️ *Chauffeur:* ${driver}
📞 *Driver Phone:* tel:${driverPhone}
⏰ *Pickup Time:* ${booking.pickupTime || booking.travelDateTime}
📍 *Pickup Location:* ${booking.pickupAddress}
📋 *Package / Trip:* ${booking.darshanStatus}
💰 *Total Fare:* ₹${booking.terminalFare}
💳 *Advance Paid:* ₹${booking.advancePaid || 0}
💵 *Balance to Pay:* ₹${booking.balanceDue || booking.terminalFare}

Have a wonderful and safe journey!
━━━━━━━━━━━━━━━━━━━━━━━━━
*Kalidass Travels* | 24/7 Helpline: 99406 29716`;

    const encoded = encodeURIComponent(message);
    const targetUrl = custPhone ? `https://wa.me/91${custPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(targetUrl, '_blank');
  };

  const sendDriverWhatsApp = (booking) => {
    const driverPhone = booking.driverPhone?.replace(/[^0-9]/g, '') || '';
    const custName = booking.customerName || booking.guestNamePhone?.split('(')[0]?.trim() || 'Customer';
    const custPhone = booking.phone || 'Contact Office';
    const vehNo = booking.assignedVehicleNo || 'Assigned Cab';

    const message = 
`*KALIDASS TRAVELS — DUTY SLIP*
━━━━━━━━━━━━━━━━━━━━━━━━━
Duty assigned to you:

👤 *Customer:* ${custName}
📞 *Customer Phone:* tel:${custPhone}
⏰ *Reporting Time:* ${booking.pickupTime || booking.travelDateTime}
📍 *Pickup Location:* ${booking.pickupAddress}
🚗 *Vehicle Assigned:* ${booking.vehicleCategory} (${vehNo})
📋 *Duty Details:* ${booking.darshanStatus}
💵 *Balance to Collect:* ₹${booking.balanceDue || booking.terminalFare}

⚠️ *Driver Rules:*
1. Reach pickup location 15 mins prior.
2. Maintain clean car and safe speed.
━━━━━━━━━━━━━━━━━━━━━━━━━
Office: 99406 29716`;

    const encoded = encodeURIComponent(message);
    const targetUrl = driverPhone ? `https://wa.me/91${driverPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(targetUrl, '_blank');
  };

  const sendGoogleReviewWhatsApp = (booking) => {
    const custPhone = booking.phone?.replace(/[^0-9]/g, '') || '';
    const custName = booking.customerName || booking.guestNamePhone?.split('(')[0]?.trim() || 'Guest';

    const message = 
`*KALIDASS TRAVELS — THANK YOU!*
━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *${custName}*,

Thank you for traveling with Kalidass Travels today! We hope you had a pleasant, safe, and comfortable journey with our chauffeur.

⭐ *Could you please take 10 seconds to share your 5-star review on Google?*
Your feedback motivates our drivers and helps our family business grow:
👉 ${GOOGLE_REVIEW_URL}

We look forward to serving you again on your next trip!
Warm regards,
*Team Kalidass Travels* (Chennai)
━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const encoded = encodeURIComponent(message);
    const targetUrl = custPhone ? `https://wa.me/91${custPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(targetUrl, '_blank');
  };

  // Settlement Handlers
  const openSettlementModal = (booking) => {
    setSettlingBooking(booking);
    setClosingKm('');
    setExtraKmCharge(0);
    setExtraHoursCharge(0);
    setFinalCollected(booking.balanceDue || booking.terminalFare);
  };

  const handleCompleteSettlement = () => {
    if (!settlingBooking) return;
    const finalFare = (settlingBooking.terminalFare || 0) + Number(extraKmCharge || 0) + Number(extraHoursCharge || 0);
    const finalBal = Math.max(0, finalFare - (settlingBooking.advancePaid || 0));

    const updated = bookings.map(b => {
      if (b.bookingId === settlingBooking.bookingId) {
        return {
          ...b,
          manifestStatus: 'Completed',
          financialClosure: 'Paid',
          terminalFare: finalFare,
          balanceDue: 0,
          closingKm: closingKm || 'Recorded',
          notes: `${b.notes || ''} | Settled: ₹${finalCollected || finalBal} received.`
        };
      }
      return b;
    });

    saveBookingsState(updated);
    showNotification(`Trip ${settlingBooking.bookingId} completed and marked Paid!`);

    fetch('/api/admin/bookings/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        bookingId: settlingBooking.bookingId,
        manifestStatus: 'Completed',
        financialClosure: 'Paid',
        terminalFare: finalFare,
        balanceDue: 0
      })
    }).catch(() => {});

    setSettlingBooking(null);
  };

  // Filtered Bookings for Pipeline
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter(b => 
      (b.bookingId || '').toLowerCase().includes(q) ||
      (b.guestNamePhone || '').toLowerCase().includes(q) ||
      (b.customerName || '').toLowerCase().includes(q) ||
      (b.phone || '').includes(q) ||
      (b.vehicleCategory || '').toLowerCase().includes(q) ||
      (b.assignedVehicleNo || '').toLowerCase().includes(q) ||
      (b.assignedChauffeur || '').toLowerCase().includes(q)
    );
  }, [bookings, searchQuery]);

  const unassignedBookings = useMemo(() => {
    return filteredBookings.filter(b => b.manifestStatus === 'Unassigned' || !b.assignedChauffeur || b.assignedChauffeur === 'Unassigned');
  }, [filteredBookings]);

  const activeBookings = useMemo(() => {
    return filteredBookings.filter(b => b.manifestStatus === 'In Progress' && b.assignedChauffeur && b.assignedChauffeur !== 'Unassigned');
  }, [filteredBookings]);

  const completedBookings = useMemo(() => {
    return filteredBookings.filter(b => b.manifestStatus === 'Completed');
  }, [filteredBookings]);

  // If locked, render PIN screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 max-w-md w-full rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="material-symbols-outlined text-white text-3xl">local_taxi</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">KALIDASS TRAVELS</h2>
          <p className="text-slate-400 text-sm mt-1 mb-6">Operations & Dispatch Desk</p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">Master Owner PIN</label>
              <input 
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter 4-digit PIN (2015)"
                autoFocus
                className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            {pinError && (
              <p className="text-rose-400 text-xs font-medium">Incorrect PIN. Please re-enter the owner PIN.</p>
            )}
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">lock_open</span>
              Unlock Dispatch Desk
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl font-medium text-sm flex items-center gap-2 animate-fadeIn ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white border border-slate-700'
        }`}>
          <span className="material-symbols-outlined text-base">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black shadow-md">
              <span className="material-symbols-outlined text-xl">speed</span>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                KALIDASS TRAVELS
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                  Fast Dispatch Desk
                </span>
              </h1>
              <p className="text-xs text-slate-400">Single-Screen Operational Center</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              {unassignedBookings.length} Unassigned
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {activeBookings.length} On Duty
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
              {completedBookings.length} Completed
            </span>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button 
              onClick={syncWithServer} 
              title="Refresh / Sync" 
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-xs cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-base">sync</span>
              <span className="hidden sm:inline">{syncStatus}</span>
            </button>
            <button 
              onClick={handleLogout} 
              title="Lock Admin Desk" 
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-base">lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 flex-1 flex flex-col gap-5">
        
        {/* ========================================================== */}
        {/* SECTION 1: DUAL-MODE QUICK INTAKE DESK (Top of Screen)      */}
        {/* ========================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Intake Header with Toggle */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-xl">bolt</span>
              <span className="font-bold text-sm text-slate-900">Instant Booking Intake</span>
              <span className="text-xs text-slate-500">Takes 15 seconds to create a trip</span>
            </div>

            {/* Toggle Modes */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setIntakeMode('notepad')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer transition-all ${
                  intakeMode === 'notepad' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">content_paste</span>
                Paste Notepad / WhatsApp
              </button>
              <button
                onClick={() => setIntakeMode('form')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer transition-all ${
                  intakeMode === 'form' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                Quick Fields
              </button>
            </div>
          </div>

          {/* Mode 1: Notepad Paste Area (The User's Exact Workflow) */}
          {intakeMode === 'notepad' && (
            <div className="p-4 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Paste your raw customer notes here:</span>
                    <button 
                      onClick={() => setNotepadText(
`contact name : dhanalakshmi madhangopal\ncontact number : 9940629716\ntrip type : local pakage\nVehicle : sedan dzire\nlocal package 4 hr/40Km\nRate : 2000\nadvance : 0\npick up location : Anna Nagar East (Map Link)\npickup time 8 : 00 AM`
                      )}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      Fill Dhanalakshmi Sample
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={notepadText}
                    onChange={(e) => setNotepadText(e.target.value)}
                    placeholder="contact name : ...&#10;contact number : ...&#10;trip type : local / outstation&#10;Vehicle : dzire / innova / tempo&#10;Rate : ...&#10;pickup time : 8:00 AM&#10;location : ..."
                    className="w-full text-xs font-mono p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-blue-600 text-sm">magic_button</span>
                      Auto-Detection Rules
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Automatically detects <strong>Name, Phone, Vehicle, Package/Rate, Advance, Time & Location</strong> from WhatsApp or Notepad text.
                    </p>
                    <div className="text-[11px] bg-blue-50 text-blue-800 p-2 rounded-lg border border-blue-100 font-medium">
                      Date assigned: <strong>Today ({formPickupDate})</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateFromNotepad}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Create Booking from Notes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Quick Fields Form (Connected Directly to Website Master Tariff) */}
          {intakeMode === 'form' && (
            <form onSubmit={handleCreateFromForm} className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Customer Name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="e.g. Dhanalakshmi"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 2. Phone */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 9940629716"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* 3. Trip Category */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Trip Type</label>
                  <select
                    value={formTripCategory}
                    onChange={(e) => setFormTripCategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="local">Local Hourly Package</option>
                    <option value="tour">Tour Package (Tirupati/Pondi)</option>
                    <option value="outstation">Outstation Multi-Day</option>
                  </select>
                </div>

                {/* 4. Vehicle */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Vehicle</label>
                  <select
                    value={formVehicle}
                    onChange={(e) => setFormVehicle(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {vehiclesList.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Package / Tour / Days depending on Category */}
                {formTripCategory === 'local' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Local Package</label>
                    <select
                      value={formPackage}
                      onChange={(e) => setFormPackage(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="4hr_40km">4 Hrs / 40 Kms</option>
                      <option value="5hr_50km">5 Hrs / 50 Kms</option>
                      <option value="8hr_80km">8 Hrs / 80 Kms</option>
                      <option value="10hr_100km">10 Hrs / 100 Kms</option>
                      <option value="12hr_120km">12 Hrs / 120 Kms</option>
                    </select>
                  </div>
                )}

                {formTripCategory === 'tour' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Select Tour</label>
                    <select
                      value={formTourPackageKey}
                      onChange={(e) => setFormTourPackageKey(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                    >
                      {tourPackagesList.map(t => (
                        <option key={t.key} value={t.key}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(formTripCategory === 'outstation' || formTripCategory === 'tour') && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">No. of Days</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={formDays}
                      onChange={(e) => setFormDays(parseInt(e.target.value, 10) || 1)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                )}

                {/* 6. Pickup Time */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Pickup Time</label>
                  <input
                    type="text"
                    value={formPickupTime}
                    onChange={(e) => setFormPickupTime(e.target.value)}
                    placeholder="e.g. 06:30 AM"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row 2: Location, Pricing & Submit */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Pickup Address / Google Maps Link</label>
                  <input
                    type="text"
                    value={formPickupLocation}
                    onChange={(e) => setFormPickupLocation(e.target.value)}
                    placeholder="Enter street, landmark, or paste Google Maps link"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Total Rate (₹)</label>
                    <input
                      type="number"
                      value={formAgreedRate}
                      onChange={(e) => setFormAgreedRate(Number(e.target.value))}
                      className="w-full text-xs font-bold text-blue-700 p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Advance (₹)</label>
                    <input
                      type="number"
                      value={formAdvance}
                      onChange={(e) => setFormAdvance(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-1 shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    Confirm Booking
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* ========================================================== */}
        {/* SEARCH & FILTER BAR                                        */}
        {/* ========================================================== */}
        <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, car number, or booking ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-xs font-medium text-slate-500 hidden sm:block">
            Showing {filteredBookings.length} total operational trips
          </div>
        </div>

        {/* ========================================================== */}
        {/* SECTION 2: THE 3-STAGE OPERATIONS PIPELINE (Columns)        */}
        {/* ========================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          
          {/* COLUMN 1: 🟡 UNASSIGNED (Need Driver) */}
          <div className="bg-slate-50 rounded-2xl border border-amber-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-amber-500/10 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 className="font-bold text-sm text-amber-900">1. UNASSIGNED</h3>
                <span className="text-xs text-amber-700 font-semibold bg-amber-200/60 px-2 py-0.5 rounded-full">
                  {unassignedBookings.length}
                </span>
              </div>
              <span className="text-[11px] text-amber-700 font-medium">Needs Driver & Cab</span>
            </div>

            <div className="p-3 space-y-3 min-h-[300px] max-h-[700px] overflow-y-auto">
              {unassignedBookings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">task_alt</span>
                  <p>All caught up! No unassigned bookings.</p>
                </div>
              ) : (
                unassignedBookings.map(b => (
                  <div key={b.bookingId} className="bg-white rounded-xl p-3.5 border border-amber-200/70 shadow-sm space-y-2.5 hover:border-amber-400 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          {b.customerName || b.guestNamePhone?.split('(')[0] || 'Customer'}
                          <span className="text-[10px] font-mono text-slate-400">#{b.bookingId}</span>
                        </div>
                        <a href={`tel:${b.phone}`} className="text-xs text-blue-600 font-mono hover:underline flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[13px]">phone</span>
                          {b.phone || 'No phone'}
                        </a>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">₹{b.terminalFare}</span>
                        <div className="text-[10px] text-slate-500">Adv: ₹{b.advancePaid || 0}</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg text-xs space-y-1 border border-slate-100">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-semibold text-blue-800">{b.vehicleCategory}</span>
                        <span className="font-medium text-slate-600">{b.darshanStatus}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-slate-400">schedule</span>
                        {b.pickupTime || b.travelDateTime} ({b.pickupDate || 'Today'})
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-slate-400">location_on</span>
                        {b.pickupAddress}
                      </div>
                    </div>

                    <button
                      onClick={() => openAssignModal(b)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Assign Driver & Vehicle
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: 🟢 ACTIVE / ON TRIP (Today & Multi-Day) */}
          <div className="bg-slate-50 rounded-2xl border border-emerald-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-emerald-500/10 border-b border-emerald-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-bold text-sm text-emerald-900">2. ACTIVE / ON TRIP</h3>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-200/60 px-2 py-0.5 rounded-full">
                  {activeBookings.length}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Dispatched & Running</span>
            </div>

            <div className="p-3 space-y-3 min-h-[300px] max-h-[700px] overflow-y-auto">
              {activeBookings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">directions_car</span>
                  <p>No active trips on the road right now.</p>
                </div>
              ) : (
                activeBookings.map(b => (
                  <div key={b.bookingId} className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-sm space-y-2.5 hover:border-emerald-400 transition-all">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-slate-900">
                          {b.customerName || b.guestNamePhone?.split('(')[0] || 'Customer'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {b.darshanStatus}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">Bal: ₹{b.balanceDue || b.terminalFare}</span>
                        <div className="text-[10px] text-emerald-600 font-semibold">Running</div>
                      </div>
                    </div>

                    {/* Assigned Driver Box */}
                    <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-emerald-950">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-emerald-600">badge</span>
                          {b.driverName || b.assignedChauffeur?.split('(')[0] || 'Assigned Driver'}
                        </span>
                        <span className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                          {b.assignedVehicleNo || 'TN 01 AB 1234'}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-800 flex items-center justify-between">
                        <span>Pickup: {b.pickupTime || b.travelDateTime}</span>
                        <a href={`tel:${b.driverPhone}`} className="text-emerald-700 hover:underline font-mono">
                          {b.driverPhone || '9840629716'}
                        </a>
                      </div>
                    </div>

                    {/* WhatsApp Action Buttons Strip */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => sendCustomerWhatsApp(b)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2 rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Send Trip Confirmation WhatsApp to Customer"
                      >
                        <span className="material-symbols-outlined text-sm">chat</span>
                        WhatsApp Guest
                      </button>

                      <button
                        onClick={() => sendDriverWhatsApp(b)}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1.5 px-2 rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Send Duty Sheet WhatsApp to Driver"
                      >
                        <span className="material-symbols-outlined text-sm">send_to_mobile</span>
                        WhatsApp Driver
                      </button>
                    </div>

                    {/* Duty Slip PDF & Complete Trip */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                      <button
                        onClick={() => setPrintDutySlip(b)}
                        className="text-slate-600 hover:text-blue-600 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">print</span>
                        Print Duty Slip
                      </button>

                      <button
                        onClick={() => openSettlementModal(b)}
                        className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        Complete Trip & Settle
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: 🏁 COMPLETED & SETTLEMENT */}
          <div className="bg-slate-50 rounded-2xl border border-blue-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-blue-500/10 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-base">check_circle</span>
                <h3 className="font-bold text-sm text-blue-900">3. SETTLEMENT & REVIEW</h3>
                <span className="text-xs text-blue-700 font-semibold bg-blue-200/60 px-2 py-0.5 rounded-full">
                  {completedBookings.length}
                </span>
              </div>
              <span className="text-[11px] text-blue-700 font-medium">Payment & 5-Star Reviews</span>
            </div>

            <div className="p-3 space-y-3 min-h-[300px] max-h-[700px] overflow-y-auto">
              {completedBookings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">receipt_long</span>
                  <p>Completed trips will appear here for review collection.</p>
                </div>
              ) : (
                completedBookings.map(b => (
                  <div key={b.bookingId} className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm space-y-2 hover:border-blue-300 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-slate-900">
                          {b.customerName || b.guestNamePhone?.split('(')[0] || 'Customer'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {b.darshanStatus} • {b.vehicleCategory}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Paid ₹{b.terminalFare}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between">
                      <span>Chauffeur: <strong>{b.driverName || b.assignedChauffeur?.split('(')[0]}</strong></span>
                      <span className="text-slate-400 font-mono">#{b.bookingId}</span>
                    </div>

                    {/* Google Review 1-Click Trigger */}
                    <button
                      onClick={() => sendGoogleReviewWhatsApp(b)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                    >
                      <span className="material-symbols-outlined text-amber-300 text-sm">star</span>
                      Send 5-Star Google Review WhatsApp
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>

      {/* ========================================================== */}
      {/* MODAL 1: ASSIGN DRIVER & VEHICLE                           */}
      {/* ========================================================== */}
      {assigningBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Assign Driver & Vehicle</h3>
                <p className="text-xs text-slate-500">
                  {assigningBooking.customerName || assigningBooking.guestNamePhone} • {assigningBooking.vehicleCategory}
                </p>
              </div>
              <button 
                onClick={() => setAssigningBooking(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pick from Registered Roster</label>
                <select
                  value={selectedDriver}
                  onChange={(e) => {
                    setSelectedDriver(e.target.value);
                    const found = driversRoster.find(d => d.name === e.target.value);
                    if (found) setCustomDriverPhone(found.phone);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                >
                  {driversRoster.map(d => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Or Quick Custom Chauffeur</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Driver Name</label>
                    <input
                      type="text"
                      value={customDriverName}
                      onChange={(e) => setCustomDriverName(e.target.value)}
                      placeholder="e.g. Murugan"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Driver Mobile</label>
                    <input
                      type="tel"
                      value={customDriverPhone}
                      onChange={(e) => setCustomDriverPhone(e.target.value)}
                      placeholder="e.g. 9840629716"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vehicle Registration Number</label>
                <input
                  type="text"
                  value={customVehicleNo}
                  onChange={(e) => setCustomVehicleNo(e.target.value)}
                  placeholder="e.g. TN 01 AB 1234"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono uppercase font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAssigningBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                Dispatch Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 2: SETTLEMENT & CLOSING TRIP                         */}
      {/* ========================================================== */}
      {settlingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Trip Settlement</h3>
                <p className="text-xs text-slate-500">
                  #{settlingBooking.bookingId} • {settlingBooking.customerName || settlingBooking.guestNamePhone}
                </p>
              </div>
              <button 
                onClick={() => setSettlingBooking(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Base Agreed Fare:</span>
                  <span className="font-bold text-slate-900">₹{settlingBooking.terminalFare}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Advance Paid:</span>
                  <span className="font-bold text-slate-900">₹{settlingBooking.advancePaid || 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Closing Odometer (KM)</label>
                  <input
                    type="number"
                    value={closingKm}
                    onChange={(e) => setClosingKm(e.target.value)}
                    placeholder="e.g. 45210"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Extra KM Charges (₹)</label>
                  <input
                    type="number"
                    value={extraKmCharge}
                    onChange={(e) => setExtraKmCharge(Number(e.target.value))}
                    placeholder="0"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Final Amount Collected from Customer (₹)</label>
                <input
                  type="number"
                  value={finalCollected}
                  onChange={(e) => setFinalCollected(Number(e.target.value))}
                  className="w-full p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 font-extrabold text-sm rounded-lg focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSettlingBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSettlement}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                Mark Paid & Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 3: PRINTABLE BRANDED DUTY SLIP                        */}
      {/* ========================================================== */}
      {printDutySlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-300 space-y-4 print:p-0 print:border-none print:shadow-none">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">KALIDASS TRAVELS</h2>
                <p className="text-[11px] text-slate-500">Government Approved Tourist Taxi & Coach Operators</p>
                <p className="text-[10px] text-slate-400">Chennai, Tamil Nadu • 24/7 Helpline: 99406 29716</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded border">
                  #{printDutySlip.bookingId}
                </span>
                <div className="text-[10px] text-slate-500 mt-1">Date: {printDutySlip.pickupDate || new Date().toISOString().split('T')[0]}</div>
              </div>
            </div>

            {/* Slip Details Table */}
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 text-slate-500 font-medium w-1/3">Guest Name:</td>
                  <td className="py-2 font-bold text-slate-900">{printDutySlip.customerName || printDutySlip.guestNamePhone}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-slate-500 font-medium">Guest Mobile:</td>
                  <td className="py-2 font-mono text-slate-900">{printDutySlip.phone}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-slate-500 font-medium">Vehicle / Category:</td>
                  <td className="py-2 font-bold text-blue-900">{printDutySlip.vehicleCategory} ({printDutySlip.assignedVehicleNo || 'Assigned Cab'})</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-slate-500 font-medium">Assigned Chauffeur:</td>
                  <td className="py-2 font-bold text-slate-900">{printDutySlip.driverName || printDutySlip.assignedChauffeur} ({printDutySlip.driverPhone || '9840629716'})</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-slate-500 font-medium">Reporting Time:</td>
                  <td className="py-2 font-bold text-slate-900">{printDutySlip.pickupTime || printDutySlip.travelDateTime}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-slate-500 font-medium">Pickup Location:</td>
                  <td className="py-2 text-slate-800">{printDutySlip.pickupAddress}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-slate-500 font-medium">Package / Tariff:</td>
                  <td className="py-2 text-slate-800">{printDutySlip.darshanStatus}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-slate-500 font-medium">Fare & Advance:</td>
                  <td className="py-2 font-bold text-slate-900">Total: ₹{printDutySlip.terminalFare} | Advance: ₹{printDutySlip.advancePaid || 0} | Balance: ₹{printDutySlip.balanceDue}</td>
                </tr>
              </tbody>
            </table>

            {/* Terms */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10px] text-slate-500 space-y-0.5">
              <p>• Parking, Tolls and Inter-state permits to be paid as per agreed package terms.</p>
              <p>• Odometer and time calculated garage to garage as per standard commercial vehicle norms.</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t print:hidden">
              <button
                onClick={() => setPrintDutySlip(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
