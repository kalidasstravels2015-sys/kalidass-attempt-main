import React, { useState, useEffect, useMemo } from 'react';

// Chauffeurs Master Baseline
const DEFAULT_CHAUFFEURS = [
  { name: 'Murugan', phone: '+91 97890 12345', plate: 'TN09 BX 1234', category: 'Sedan (Dzire)', status: 'Available', fcExpiry: '2027-04-15', permitExpiry: '2026-11-20', rating: '4.9' },
  { name: 'Selvam', phone: '+91 98402 54321', plate: 'TN11 CY 5678', category: 'Ertiga (6 Pax)', status: 'Available', fcExpiry: '2026-12-10', permitExpiry: '2027-01-05', rating: '4.8' },
  { name: 'Perumal Manikumar', phone: '+91 89395 39211', plate: 'TN09 CZ 9999', category: 'Innova Crysta', status: 'Available', fcExpiry: '2027-08-30', permitExpiry: '2027-06-15', rating: '4.9' },
  { name: 'Hariharan', phone: '+91 97103 44556', plate: 'TN22 AZ 3421', category: 'Sedan (Etios)', status: 'Available', fcExpiry: '2026-10-28', permitExpiry: '2026-12-01', rating: '4.7' },
  { name: 'Karthik Kumar', phone: '+91 98401 99887', plate: 'TN07 DJ 4321', category: 'Tempo Traveller', status: 'Available', fcExpiry: '2027-02-14', permitExpiry: '2027-03-20', rating: '4.9' },
];

// Curated Tour Packages Master (Chennai to Tirupati, Chennai to Madurai, Chennai to Pondicherry)
const TOUR_PACKAGES = [
  {
    id: 'chennai-tirupati',
    name: 'Chennai to Tirupati',
    shortName: 'Chennai ➔ Tirupati Round Trip',
    rates: {
      'Sedan (Dzire / Etios)': '6000',
      'Sedan': '6000',
      'Ertiga (6 Pax)': '7500',
      'Ertiga': '7500',
      'Innova Crysta': '10000',
      'Tempo Traveller': '12500',
      'Tempo': '12500'
    }
  },
  {
    id: 'chennai-madurai',
    name: 'Chennai to Madurai',
    shortName: 'Chennai ➔ Madurai Round Trip',
    rates: {
      'Sedan (Dzire / Etios)': '13500',
      'Sedan': '13500',
      'Ertiga (6 Pax)': '16500',
      'Ertiga': '16500',
      'Innova Crysta': '21500',
      'Tempo Traveller': '26000',
      'Tempo': '26000'
    }
  },
  {
    id: 'chennai-pondicherry',
    name: 'Chennai to Pondicherry',
    shortName: 'Chennai ➔ Pondicherry Round Trip',
    rates: {
      'Sedan (Dzire / Etios)': '4500',
      'Sedan': '4500',
      'Ertiga (6 Pax)': '5500',
      'Ertiga': '5500',
      'Innova Crysta': '7500',
      'Tempo Traveller': '9500',
      'Tempo': '9500'
    }
  }
];

// LocalStorage Persistence Keys
const STORAGE_KEYS = {
  BOOKINGS: 'kt_admin_bookings_v1',
  LEADS: 'kt_admin_leads_v1',
  DUTY_SLIPS: 'kt_admin_duty_slips_v1',
  SETTLEMENTS: 'kt_admin_settlements_v1'
};

const safeGetStorage = (key, fallback) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (err) {
    console.warn('LocalStorage read error:', err);
  }
  return fallback;
};

const safeSetStorage = (key, data) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (err) {
    console.warn('LocalStorage write error:', err);
  }
};

const DEFAULT_SEED_BOOKINGS = [
  {
    bookingId: '#KT-TPT-101',
    guestNamePhone: 'Senthil Nathan (+91 98401 22334)',
    travelDateTime: 'Tomorrow @ 04:30 AM',
    pickupAddress: 'T. Nagar, Chennai',
    vehicleCategory: 'Innova Crysta',
    partySize: '6 Pax',
    kycStatus: 'Verified',
    darshanStatus: 'Assigned',
    assignedChauffeur: 'Perumal Manikumar - TN09 CZ 9999',
    manifestStatus: 'Dispatched',
    terminalFare: 10000,
    chauffeurPayout: 8000,
    companyMargin: 2000,
    financialClosure: 'Unreconciled'
  },
  {
    bookingId: '#KT-TPT-102',
    guestNamePhone: 'Ravi Shankar (+91 97890 55443)',
    travelDateTime: '12-Oct-2026 @ 05:00 AM',
    pickupAddress: 'Anna Nagar West, Chennai',
    vehicleCategory: 'Sedan (Dzire / Etios)',
    partySize: '4 Pax',
    kycStatus: 'Pending',
    darshanStatus: 'Unassigned',
    assignedChauffeur: 'Unassigned',
    manifestStatus: 'Pending',
    terminalFare: 6000,
    chauffeurPayout: 4800,
    companyMargin: 1200,
    financialClosure: 'Unreconciled'
  },
  {
    bookingId: '#KT-PND-103',
    guestNamePhone: 'Anand Krishnan (+91 98410 77665)',
    travelDateTime: 'Today @ 06:00 AM',
    pickupAddress: 'Adyar, Chennai',
    vehicleCategory: 'Ertiga (6 Pax)',
    partySize: '5 Pax',
    kycStatus: 'Verified',
    darshanStatus: 'N/A',
    assignedChauffeur: 'Selvam - TN11 CY 5678',
    manifestStatus: 'In Transit',
    terminalFare: 5500,
    chauffeurPayout: 4400,
    companyMargin: 1100,
    financialClosure: 'Unreconciled'
  }
];

const DEFAULT_SEED_LEADS = [
  {
    quoteId: '#WA-98803',
    timestamp: '09-Oct-2026, 11:29 am',
    sourcePage: 'WhatsApp (+91 98803 09619)',
    calculatorEngine: 'WhatsApp Direct Chat',
    tripType: 'One Day Round Trip (19-Oct)',
    pickup: 'Chennai (Oct 19th - 4 Pax)',
    drop: 'Tirupati Balaji Darshan (4 Pax)',
    vehicle: 'Sedan (Dzire / Etios)',
    distanceKm: '300',
    estimatedFare: 6000,
    status: 'Active Enquiry',
    metadata: 'WhatsApp Lead: +91 98803 09619 | 4 Pax | Travel Date: Oct 19th | Inquiry: Balaji Darshan'
  },
  {
    quoteId: '#WA-73038',
    timestamp: '09-Oct-2026, 10:49 am',
    sourcePage: 'WhatsApp (+91 73038 09755)',
    calculatorEngine: 'WhatsApp Direct Chat',
    tripType: 'One Day Round Trip',
    pickup: 'Chennai',
    drop: 'Tirumala 1-Day Trip',
    vehicle: 'Sedan (Dzire / Etios)',
    distanceKm: '320',
    estimatedFare: 6000,
    status: 'Rates Quoted',
    metadata: 'WhatsApp Lead: +91 73038 09755 | Inquiry: Chennai to Tirumala 1-Day Trip Sedan Rs.6000'
  }
];

export default function AdminDashboard() {
  // Navigation Desks
  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch', 'leads', 'dutyslip', 'khata', 'fleet', 'pilgrimage'
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Data States (initialized immediately with localStorage or rich seed defaults)
  const [bookings, setBookings] = useState(() => safeGetStorage(STORAGE_KEYS.BOOKINGS, DEFAULT_SEED_BOOKINGS));
  const [leads, setLeads] = useState(() => safeGetStorage(STORAGE_KEYS.LEADS, DEFAULT_SEED_LEADS));
  const [dutySlips, setDutySlips] = useState(() => safeGetStorage(STORAGE_KEYS.DUTY_SLIPS, []));
  const [settlements, setSettlements] = useState(() => safeGetStorage(STORAGE_KEYS.SETTLEMENTS, []));
  const [chauffeurs, setChauffeurs] = useState(DEFAULT_CHAUFFEURS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());
  const [toast, setToast] = useState(null);

  // Toast feedback helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Modal States
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isDutySlipModalOpen, setIsDutySlipModalOpen] = useState(false);
  const [isQuickCallModalOpen, setIsQuickCallModalOpen] = useState(false);

  // Quick Inbound Phone / WhatsApp Lead Form State
  const [selectedCallPackage, setSelectedCallPackage] = useState('chennai-tirupati');
  const [callForm, setCallForm] = useState({
    channel: 'whatsapp',
    callerPhone: '',
    guestName: '',
    route: 'Chennai ➔ Tirupati Round Trip',
    vehicle: 'Sedan (Dzire / Etios)',
    quotedFare: '6000',
    status: 'Active Enquiry',
    notes: 'Inbound WhatsApp lead'
  });

  // New Booking Form State
  const [newBooking, setNewBooking] = useState({
    guestName: '',
    guestPhone: '',
    travelDate: '',
    pickupTime: '04:30 AM',
    pickupAddress: '',
    vehicleCategory: 'Sedan',
    partySize: '4 Pax',
    fare: '',
    kycStatus: 'Pending',
    darshanStatus: 'Unassigned',
    assignedChauffeur: 'Unassigned'
  });

  // Duty Slip Form State
  const [slipForm, setSlipForm] = useState({
    bookingId: '',
    guestName: '',
    guestPhone: '',
    chauffeurName: '',
    chauffeurPhone: '',
    vehiclePlate: '',
    startKm: '',
    endKm: '',
    packageAllowedKm: 300,
    extraKmRate: 14,
    basePackageFare: '',
    tollsFastag: '',
    parking: '',
    statePermit: '',
    driverBata: '',
    advancePaid: '',
    paymentMode: 'Cash/UPI',
    notes: ''
  });

  // Driver Khata Form State
  const [khataForm, setKhataForm] = useState({
    chauffeurName: '',
    bookingId: '',
    guestCashCollected: '',
    driverAgreedPayout: '',
    tollsPaidByDriver: '',
    paymentMode: 'UPI',
    upiRef: '',
    notes: ''
  });

  // Background Telemetry Sync (Silent & non-blocking)
  const fetchData = async () => {
    try {
      const [bRes, lRes, dRes, sRes] = await Promise.allSettled([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/leads'),
        fetch('/api/admin/duty-slips'),
        fetch('/api/admin/settlements')
      ]);

      if (bRes.status === 'fulfilled' && bRes.value.ok) {
        try {
          const bData = await bRes.value.json();
          if (bData.bookings && bData.bookings.length > 0) {
            setBookings(bData.bookings);
            safeSetStorage(STORAGE_KEYS.BOOKINGS, bData.bookings);
          }
        } catch (_) {}
      }

      if (lRes.status === 'fulfilled' && lRes.value.ok) {
        try {
          const lData = await lRes.value.json();
          if (lData.leads && lData.leads.length > 0) {
            setLeads(lData.leads);
            safeSetStorage(STORAGE_KEYS.LEADS, lData.leads);
          }
        } catch (_) {}
      }

      if (dRes.status === 'fulfilled' && dRes.value.ok) {
        try {
          const dData = await dRes.value.json();
          if (dData.dutySlips && dData.dutySlips.length > 0) {
            setDutySlips(dData.dutySlips);
            safeSetStorage(STORAGE_KEYS.DUTY_SLIPS, dData.dutySlips);
          }
        } catch (_) {}
      }

      if (sRes.status === 'fulfilled' && sRes.value.ok) {
        try {
          const sData = await sRes.value.json();
          if (sData.settlements && sData.settlements.length > 0) {
            setSettlements(sData.settlements);
            safeSetStorage(STORAGE_KEYS.SETTLEMENTS, sData.settlements);
          }
        } catch (_) {}
      }

      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Telemetry sync error (cached data active):', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // KPIs
  const kpis = useMemo(() => {
    const totalBookings = bookings.length;
    const actionRequired = bookings.filter(b => b.manifestStatus === 'Pending' || b.kycStatus === 'Pending').length;
    const inTransit = bookings.filter(b => b.manifestStatus === 'Dispatched' || b.manifestStatus === 'In Transit').length;
    const totalMargin = bookings.reduce((sum, b) => sum + (Number(b.companyMargin) || 0), 0);
    const hotLeads = leads.filter(l => l.status !== 'Converted').length;
    return { totalBookings, actionRequired, inTransit, totalMargin, hotLeads };
  }, [bookings, leads]);

  // Handle PIN unlock
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '2026' || pinInput === '8939') {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Update Booking Status (Optimistic + Persisted)
  const updateBookingStatus = (bookingId, patch) => {
    setBookings(prev => {
      const nextBookings = prev.map(b => b.bookingId === bookingId ? { ...b, ...patch } : b);
      safeSetStorage(STORAGE_KEYS.BOOKINGS, nextBookings);
      return nextBookings;
    });

    try {
      fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', bookingId, ...patch })
      }).catch(() => {});
    } catch (_) {}
  };

  // Convert Lead to Booking (Optimistic + Persisted)
  const convertLeadToBooking = (lead) => {
    const bookingId = `#KT-LEAD-${Date.now().toString().slice(-4)}`;
    
    // Dynamically extract phone number from lead
    const combined = `${lead.pickup} ${lead.metadata || ''} ${lead.sourcePage || ''}`;
    const phoneMatch = combined.match(/(?:\+?91[\s-]?)?([6-9]\d{4}[\s-]?\d{5}|[6-9]\d{9})/);
    const guestPhone = phoneMatch ? phoneMatch[1].replace(/[\s-]/g, '') : '9840100000';

    let guestName = 'WhatsApp Guest';
    if (lead.metadata && lead.metadata.toLowerCase().includes('business')) {
      guestName = 'WhatsApp Guest (Business)';
    }

    // Dynamic travel date extraction or current date fallback
    const dateMatch = combined.match(/(\d{1,2}(?:st|nd|rd|th)?[\s-]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s-]*\d{0,4})/i);
    const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const travelDate = dateMatch ? dateMatch[1] : todayFormatted;
    const pickupTime = '04:30 AM';

    const partySize = (lead.metadata?.includes('4 ppl') || lead.pickup?.includes('4 Pax')) ? '4 Pax' : '4 Pax';
    const vehicleCat = lead.vehicle?.toLowerCase().includes('ertiga') ? 'Ertiga' : 'Sedan';
    const fare = Number(lead.estimatedFare) || 6000;
    const payout = Math.round(fare * 0.8);
    const margin = fare - payout;

    const newRow = {
      bookingId,
      guestNamePhone: `${guestName} (+91 ${guestPhone})`,
      travelDateTime: `${travelDate} @ ${pickupTime}`,
      pickupAddress: lead.pickup || 'Chennai (Doorstep Pickup)',
      vehicleCategory: vehicleCat,
      partySize: partySize,
      kycStatus: 'Pending',
      darshanStatus: (lead.drop?.toLowerCase().includes('tirupati') || lead.drop?.toLowerCase().includes('tirumala')) ? 'In-Process' : 'Unassigned',
      assignedChauffeur: 'Unassigned',
      manifestStatus: 'Pending',
      terminalFare: fare,
      chauffeurPayout: payout,
      companyMargin: margin,
      financialClosure: 'Unreconciled'
    };

    setBookings(prev => {
      const nextBookings = [newRow, ...prev];
      safeSetStorage(STORAGE_KEYS.BOOKINGS, nextBookings);
      return nextBookings;
    });

    setLeads(prev => {
      const nextLeads = prev.map(l => l.quoteId === lead.quoteId ? { ...l, status: 'Converted' } : l);
      safeSetStorage(STORAGE_KEYS.LEADS, nextLeads);
      return nextLeads;
    });

    setActiveTab('dispatch');
    showToast(`✓ Converted lead ${lead.quoteId} to Trip ${bookingId}`, 'success');

    try {
      fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow)
      }).catch(() => {});
    } catch (_) {}

    try {
      fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: lead.quoteId, status: 'Converted' })
      }).catch(() => {});
    } catch (_) {}
  };

  // Create New Booking Submit (Optimistic + Persisted)
  const handleNewBookingSubmit = (e) => {
    e.preventDefault();
    const bookingId = `#KT-MANUAL-${Date.now().toString().slice(-4)}`;
    const fare = Number(newBooking.fare) || 650;
    const payout = Math.round(fare * 0.8);
    const margin = fare - payout;

    const payload = {
      bookingId,
      guestNamePhone: `${newBooking.guestName} (+91 ${newBooking.guestPhone})`,
      travelDateTime: `${newBooking.travelDate} @ ${newBooking.pickupTime}`,
      pickupAddress: newBooking.pickupAddress,
      vehicleCategory: newBooking.vehicleCategory,
      partySize: newBooking.partySize,
      kycStatus: newBooking.kycStatus,
      darshanStatus: newBooking.darshanStatus,
      assignedChauffeur: newBooking.assignedChauffeur,
      manifestStatus: newBooking.assignedChauffeur !== 'Unassigned' ? 'Dispatched' : 'Pending',
      terminalFare: fare,
      chauffeurPayout: payout,
      companyMargin: margin,
      financialClosure: 'Unreconciled'
    };

    setBookings(prev => {
      const nextBookings = [payload, ...prev];
      safeSetStorage(STORAGE_KEYS.BOOKINGS, nextBookings);
      return nextBookings;
    });

    setIsNewBookingModalOpen(false);
    setNewBooking({
      guestName: '',
      guestPhone: '',
      travelDate: '',
      pickupTime: '04:30 AM',
      pickupAddress: '',
      vehicleCategory: 'Sedan',
      partySize: '4 Pax',
      fare: '',
      kycStatus: 'Pending',
      darshanStatus: 'Unassigned',
      assignedChauffeur: 'Unassigned'
    });
    showToast(`✓ Booking ${bookingId} created for ${newBooking.guestName}`, 'success');

    try {
      fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (_) {}
  };

  // Quick Log Lead (Phone / WhatsApp) Submit (Guaranteed Instant Response & Persistence)
  const handleQuickCallSubmit = (e) => {
    e.preventDefault();
    if (!callForm.callerPhone) return;

    const isWA = callForm.channel === 'whatsapp';
    const quoteId = `#LEAD-${Date.now().toString().slice(-4)}`;
    const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const pickup = callForm.guestName
      ? `${callForm.guestName} (+91 ${callForm.callerPhone})`
      : `+91 ${callForm.callerPhone}`;
    const quotedFareNum = parseInt(String(callForm.quotedFare || '0').replace(/[^0-9]/g, ''), 10) || 0;

    const newLead = {
      quoteId,
      timestamp,
      sourcePage: isWA ? `WhatsApp (+91 ${callForm.callerPhone})` : '/admin (Phone Desk)',
      calculatorEngine: isWA ? 'WhatsApp Direct Chat' : 'Office Phone Desk Log',
      tripType: isWA ? 'Inbound WhatsApp Lead' : 'Inbound Phone Enquiry',
      pickup,
      drop: callForm.route || 'Chennai ➔ Tirupati Round Trip',
      vehicle: callForm.vehicle || 'Innova Crysta (7 Pax)',
      distanceKm: 'N/A',
      estimatedFare: quotedFareNum,
      status: callForm.status || (isWA ? 'Active Enquiry' : 'Call Received - Quoted'),
      metadata: `${isWA ? 'WhatsApp Lead' : 'Direct Caller'}: +91 ${callForm.callerPhone} | Notes: ${callForm.notes || 'None'}`
    };

    // 1. Optimistic Local State & LocalStorage Update (Guaranteed immediate UI action)
    setLeads(prev => {
      const nextLeads = [newLead, ...prev.filter(l => l.quoteId !== quoteId)];
      safeSetStorage(STORAGE_KEYS.LEADS, nextLeads);
      return nextLeads;
    });

    // 2. Immediately close modal, switch tab to leads funnel, reset form
    setIsQuickCallModalOpen(false);
    const guestOrPhone = callForm.guestName || callForm.callerPhone;
    const destRoute = newLead.drop;
    setCallForm({
      channel: 'whatsapp',
      callerPhone: '',
      guestName: '',
      route: 'Chennai ➔ Tirupati Round Trip',
      vehicle: 'Sedan (Dzire / Etios)',
      quotedFare: '6000',
      status: 'Active Enquiry',
      notes: 'Inbound WhatsApp lead'
    });
    setSelectedCallPackage('chennai-tirupati');
    setActiveTab('leads');
    showToast(`✓ Lead logged: ${guestOrPhone} (${destRoute})`, 'success');

    // 3. Asynchronously sync to backend endpoints and Google Sheet webhook (non-blocking)
    try {
      fetch('/api/record-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          leadType: isWA ? 'whatsapp' : 'call',
          status: newLead.status,
          calculatorEngine: newLead.calculatorEngine,
          tripType: newLead.tripType,
          sourcePage: newLead.sourcePage,
          pickup: newLead.pickup,
          drop: newLead.drop,
          vehicle: newLead.vehicle,
          estimatedFare: newLead.estimatedFare,
          metadata: newLead.metadata
        })
      }).catch(() => {});
    } catch (_) {}

    try {
      fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      }).catch(() => {});
    } catch (_) {}
  };

  // Quick Call Logger: Select tour package handler
  const handleCallPackageChange = (pkgId) => {
    setSelectedCallPackage(pkgId);
    if (pkgId === 'custom') {
      return;
    }
    const pkg = TOUR_PACKAGES.find(p => p.id === pkgId);
    if (pkg) {
      const fare = pkg.rates[callForm.vehicle] || pkg.rates['Sedan (Dzire / Etios)'] || '6000';
      setCallForm(prev => ({
        ...prev,
        route: pkg.shortName,
        quotedFare: fare
      }));
    }
  };

  // Quick Call Logger: Select vehicle handler (re-calibrates fare for active package)
  const handleCallVehicleChange = (newVehicle) => {
    setCallForm(prev => {
      let fare = prev.quotedFare;
      if (selectedCallPackage && selectedCallPackage !== 'custom') {
        const pkg = TOUR_PACKAGES.find(p => p.id === selectedCallPackage);
        if (pkg && pkg.rates[newVehicle]) {
          fare = pkg.rates[newVehicle];
        }
      }
      return {
        ...prev,
        vehicle: newVehicle,
        quotedFare: fare
      };
    });
  };

  // Open Duty Slip for Booking
  const openDutySlipForBooking = (b) => {
    const fare = Number(b.terminalFare) || '';
    setSlipForm({
      bookingId: b.bookingId,
      guestName: b.guestNamePhone.split('(')[0].trim(),
      guestPhone: b.guestNamePhone.match(/\+91\s*([0-9\s]+)/)?.[1]?.replace(/\s/g, '') || '',
      chauffeurName: b.assignedChauffeur !== 'Unassigned' ? b.assignedChauffeur.split('(')[0].trim() : '',
      chauffeurPhone: b.assignedChauffeur.match(/\+91\s*([0-9\s]+)/)?.[1]?.replace(/\s/g, '') || '',
      vehiclePlate: b.assignedChauffeur.split('-')[1]?.trim() || '',
      startKm: '',
      endKm: '',
      packageAllowedKm: 300,
      extraKmRate: 14,
      basePackageFare: fare,
      tollsFastag: '',
      parking: '',
      statePermit: '',
      driverBata: '',
      advancePaid: '',
      paymentMode: 'Cash/UPI',
      notes: ''
    });
    setIsDutySlipModalOpen(true);
  };

  // Submit Duty Slip (Optimistic + Persisted)
  const handleDutySlipSubmit = (e) => {
    e.preventDefault();
    const dutySlipId = `#DS-${Date.now().toString().slice(-4)}`;
    const newSlip = {
      dutySlipId,
      ...slipForm,
      createdAt: new Date().toLocaleString()
    };

    setDutySlips(prev => {
      const nextSlips = [newSlip, ...prev];
      safeSetStorage(STORAGE_KEYS.DUTY_SLIPS, nextSlips);
      return nextSlips;
    });

    updateBookingStatus(slipForm.bookingId, {
      manifestStatus: 'Duty Slip Closed',
      financialClosure: 'Pending Settlement'
    });

    setIsDutySlipModalOpen(false);
    setSlipForm({
      bookingId: '',
      guestName: '',
      guestPhone: '',
      chauffeurName: '',
      chauffeurPhone: '',
      vehiclePlate: '',
      startKm: '',
      endKm: '',
      packageAllowedKm: 300,
      extraKmRate: 14,
      basePackageFare: '',
      tollsFastag: '',
      parking: '',
      statePermit: '',
      driverBata: '',
      advancePaid: '',
      paymentMode: 'Cash/UPI',
      notes: ''
    });
    setActiveTab('dutyslip');
    showToast(`✓ Duty Slip created for Booking ${slipForm.bookingId}`, 'success');

    try {
      fetch('/api/admin/duty-slips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slipForm)
      }).catch(() => {});
    } catch (_) {}
  };

  // Submit Khata Settlement (Optimistic + Persisted)
  const handleKhataSubmit = (e) => {
    e.preventDefault();
    const settlementId = `#SETTLE-${Date.now().toString().slice(-4)}`;
    const newSettlement = {
      settlementId,
      ...khataForm,
      settledAt: new Date().toLocaleString()
    };

    setSettlements(prev => {
      const nextSettlements = [newSettlement, ...prev];
      safeSetStorage(STORAGE_KEYS.SETTLEMENTS, nextSettlements);
      return nextSettlements;
    });

    if (khataForm.bookingId) {
      updateBookingStatus(khataForm.bookingId, {
        financialClosure: 'Settled (UPI)'
      });
    }

    setKhataForm({
      chauffeurName: '',
      bookingId: '',
      guestCashCollected: '',
      driverAgreedPayout: '',
      tollsPaidByDriver: '',
      paymentMode: 'UPI',
      upiRef: '',
      notes: ''
    });
    showToast(`✓ Driver settlement recorded for ${khataForm.chauffeurName}`, 'success');

    try {
      fetch('/api/admin/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(khataForm)
      }).catch(() => {});
    } catch (_) {}
  };

  // 1-Click WhatsApp Links
  const getDriverManifestWhatsapp = (b) => {
    const text = `*KALIDASS TRAVELS — DUTY ASSIGNMENT*\n` +
      `Booking ID: ${b.bookingId}\n` +
      `Guest: ${b.guestNamePhone}\n` +
      `Travel Date/Time: ${b.travelDateTime}\n` +
      `Pickup Location: ${b.pickupAddress}\n` +
      `Vehicle: ${b.vehicleCategory} (Capacity: ${b.partySize})\n` +
      `Terminal Fare: Rs.${b.terminalFare}\n` +
      `Driver Payout: Rs.${b.chauffeurPayout}\n` +
      `Duty Status: Dispatched\n\n` +
      `Please call guest 15 mins prior to arrival. Safe journey!`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const getGuestConfirmationWhatsapp = (b) => {
    const text = `*KALIDASS TRAVELS — BOOKING CONFIRMATION*\n` +
      `Booking ID: ${b.bookingId}\n` +
      `Dear Guest, your cab has been allocated:\n\n` +
      `Chauffeur: ${b.assignedChauffeur}\n` +
      `Travel Date/Time: ${b.travelDateTime}\n` +
      `Pickup Address: ${b.pickupAddress}\n` +
      `Car Category: ${b.vehicleCategory}\n` +
      `Estimated Fare: Rs.${b.terminalFare}\n\n` +
      `24x7 Operations Desk: +91 89395 39211\n` +
      `Thank you for traveling with Kalidass Travels Chennai!`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const getLeadQuoteWhatsapp = (lead) => {
    const combined = `${lead.pickup} ${lead.metadata || ''} ${lead.sourcePage || ''}`;
    const phoneMatch = combined.match(/(?:\+?91[\s-]?)?([6-9]\d{4}[\s-]?\d{5}|[6-9]\d{9})/);
    const targetPhone = phoneMatch ? `91${phoneMatch[1].replace(/[\s-]/g, '')}` : '';

    const text = `*KALIDASS TRAVELS — TOUR PACKAGE QUOTATION*\n` +
      `Vanakkam! Thank you for inquiring with Kalidass Travels Chennai.\n\n` +
      `📍 *Route:* ${lead.pickup} ➔ ${lead.drop}\n` +
      `🚗 *Vehicle:* ${lead.vehicle || 'AC Sedan (Dzire / Etios)'}\n` +
      `💰 *Package Fare:* ₹${lead.estimatedFare} (All-Inclusive)\n` +
      `✅ *Includes:* Clean AC Vehicle, Dedicated Chauffeur, Driver Bata & Hill Tolls.\n\n` +
      `Would you like to confirm this trip? Reply *YES* to proceed!`;
    return targetPhone ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // Computations
  const computedSlip = useMemo(() => {
    const start = Number(slipForm.startKm) || 0;
    const end = Number(slipForm.endKm) || 0;
    const totalKm = end > start ? end - start : 0;
    const extraKm = Math.max(0, totalKm - (Number(slipForm.packageAllowedKm) || 0));
    const extraKmCost = extraKm * (Number(slipForm.extraKmRate) || 0);
    const gross = (Number(slipForm.basePackageFare) || 0) + extraKmCost + (Number(slipForm.tollsFastag) || 0) + (Number(slipForm.parking) || 0) + (Number(slipForm.statePermit) || 0) + (Number(slipForm.driverBata) || 0);
    const balance = Math.max(0, gross - (Number(slipForm.advancePaid) || 0));
    return { totalKm, extraKm, extraKmCost, gross, balance };
  }, [slipForm]);

  const computedKhataNet = useMemo(() => {
    const collected = Number(khataForm.guestCashCollected) || 0;
    const payout = Number(khataForm.driverAgreedPayout) || 0;
    const tolls = Number(khataForm.tollsPaidByDriver) || 0;
    return collected - (payout + tolls);
  }, [khataForm]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    if (!searchQuery) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter(b =>
      b.bookingId.toLowerCase().includes(q) ||
      b.guestNamePhone.toLowerCase().includes(q) ||
      b.pickupAddress.toLowerCase().includes(q) ||
      b.assignedChauffeur.toLowerCase().includes(q) ||
      b.vehicleCategory.toLowerCase().includes(q)
    );
  }, [bookings, searchQuery]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(l =>
      l.quoteId.toLowerCase().includes(q) ||
      l.pickup.toLowerCase().includes(q) ||
      l.drop.toLowerCase().includes(q) ||
      l.vehicle.toLowerCase().includes(q) ||
      l.status.toLowerCase().includes(q) ||
      (l.metadata && l.metadata.toLowerCase().includes(q))
    );
  }, [leads, searchQuery]);

  // Grouped Kanban Columns
  const kanban = useMemo(() => {
    return {
      unassigned: filteredBookings.filter(b => b.assignedChauffeur === 'Unassigned' || b.manifestStatus === 'Pending'),
      assigned: filteredBookings.filter(b => b.assignedChauffeur !== 'Unassigned' && b.manifestStatus === 'Dispatched'),
      inTransit: filteredBookings.filter(b => b.manifestStatus === 'In Transit' || b.manifestStatus === 'On Road'),
      slipPending: filteredBookings.filter(b => b.manifestStatus === 'Duty Slip Closed' && b.financialClosure === 'Pending Settlement'),
      settled: filteredBookings.filter(b => b.financialClosure.includes('Settled'))
    };
  }, [filteredBookings]);

  // M3 Lock Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-m3-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-m3-outline-variant/90 rounded-3xl p-8 shadow-xl text-center">
          <div className="w-14 h-14 bg-m3-tertiary-container/30 text-m3-tertiary rounded-full flex items-center justify-center mx-auto mb-4 border border-m3-tertiary/30/60 shadow-xs">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h2 className="text-xl font-extrabold text-m3-on-surface tracking-tight">KALIDASS COMMAND TOWER</h2>
          <p className="text-sm text-m3-outline mt-1 mb-6">Enter security PIN to access the operations console</p>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN (Default: 2026)"
              className="w-full text-center tracking-[0.5em] text-2xl py-3 bg-m3-surface border border-m3-outline-variant rounded-2xl text-m3-on-surface font-mono-code focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/10 focus:outline-none transition-all"
              autoFocus
            />
            {pinError && <p className="text-xs text-m3-error font-semibold">Invalid PIN. Try 2026 or 8939.</p>}
            <button
              type="submit"
              className="w-full py-3.5 bg-m3-primary hover:bg-m3-inverse-surface text-white font-bold text-sm uppercase rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              Unlock Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-m3-surface text-m3-on-surface flex flex-col font-sans relative">
      
      {/* Toast Feedback Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 border text-xs font-bold bg-m3-primary text-white border-m3-outline-variant/40/80">
          <span className={`material-symbols-outlined text-[18px] ${toast.type === 'error' ? 'text-m3-error' : 'text-m3-success'}`}>
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-m3-outline-variant hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. M3 TOP APP BAR & TELEMETRY STRIP                            */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-m3-outline-variant/80 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand & Flight Deck Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-m3-success-container/400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
              <span className="text-base font-extrabold tracking-tight text-m3-primary uppercase">KALIDASS COMMAND TOWER</span>
            </div>
            <span className="text-m3-inverse-on-surface/80 hidden sm:inline">|</span>
            <span className="text-xs font-semibold text-m3-outline hidden sm:inline uppercase tracking-wider">
              DISPATCH • FLEET • CASHBOOK
            </span>
          </div>

          {/* Actions & Live Telemetry */}
          <div className="flex items-center gap-3">
            {/* Live Connected Chip */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-m3-success-container/40 text-m3-on-success-container border border-m3-success/30/80 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-m3-success-container/400"></span>
              <span>LIVE SYNC: {lastSyncTime}</span>
            </div>

            {/* Total Margin Pill */}
            <div className="hidden lg:flex items-center gap-1 px-3.5 py-1 rounded-full bg-m3-surface-container text-m3-on-surface border border-m3-outline-variant/80 text-xs font-bold">
              <span className="text-m3-outline font-normal">EST. MARGIN:</span>
              <span className="text-m3-success">₹{kpis.totalMargin.toLocaleString()}</span>
            </div>

            {/* Quick Log Lead M3 Button */}
            <button
              onClick={() => setIsQuickCallModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-m3-success-container/40 hover:bg-m3-success-container/70 text-m3-on-success-container text-xs sm:text-sm font-bold border border-m3-success/40 shadow-xs transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-m3-success">chat</span>
              <span>+ LOG LEAD</span>
            </button>

            {/* New Booking M3 Button */}
            <button
              onClick={() => setIsNewBookingModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-m3-primary hover:bg-m3-inverse-surface text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>NEW BOOKING</span>
            </button>

            {/* Sync Button */}
            <button
              onClick={fetchData}
              title="Force Telemetry Sync"
              className="p-2 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface-variant border border-m3-outline-variant/80 transition-colors"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
            </button>

            {/* Lock Button */}
            <button
              onClick={() => setIsUnlocked(false)}
              title="Lock Console"
              className="p-2 rounded-full bg-m3-surface-container hover:bg-m3-error-container/30 hover:text-m3-error text-m3-on-surface-variant border border-m3-outline-variant/80 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </button>
          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. M3 KPI METRIC TILES (UNIFIED CALM NEUTRAL TONAL SURFACES)   */}
      {/* ============================================================== */}
      <section className="px-4 sm:px-6 py-4 max-w-[1720px] mx-auto w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* Tile 1: Active Trips */}
          <div className="bg-white rounded-2xl border border-m3-outline-variant/80 p-4 shadow-xs hover:border-m3-outline-variant transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-m3-outline uppercase tracking-wider">ACTIVE TRIPS</span>
              <div className="w-8 h-8 rounded-xl bg-m3-surface-container text-m3-on-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-m3-on-surface tracking-tight">{kpis.totalBookings}</p>
            <p className="mt-1 text-[11px] font-medium text-m3-outline-variant uppercase tracking-tight">ALL VERTICAL MANIFESTS</p>
          </div>

          {/* Tile 2: Action Needed (Subtle dot indicator only, calm neutral container) */}
          <div className="bg-white rounded-2xl border border-m3-outline-variant/80 p-4 shadow-xs hover:border-m3-outline-variant transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {kpis.actionRequired > 0 && <span className="w-2 h-2 rounded-full bg-m3-error-container/300"></span>}
                <span className="text-xs font-semibold text-m3-on-surface-variant uppercase tracking-wider">ACTION NEEDED</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-m3-surface-container text-m3-on-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">priority_high</span>
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-m3-on-surface tracking-tight">{kpis.actionRequired}</p>
            <p className="mt-1 text-[11px] font-medium text-m3-outline-variant uppercase tracking-tight">UNASSIGNED / PENDING KYC</p>
          </div>

          {/* Tile 3: Hot Leads */}
          <div className="bg-white rounded-2xl border border-m3-outline-variant/80 p-4 shadow-xs hover:border-m3-outline-variant transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-m3-outline uppercase tracking-wider">HOT LEADS</span>
              <div className="w-8 h-8 rounded-xl bg-m3-surface-container text-m3-on-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">calculate</span>
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-m3-on-surface tracking-tight">{kpis.hotLeads}</p>
            <p className="mt-1 text-[11px] font-medium text-m3-outline-variant uppercase tracking-tight">CALCULATOR ENQUIRIES</p>
          </div>

          {/* Tile 4: In Transit */}
          <div className="bg-white rounded-2xl border border-m3-outline-variant/80 p-4 shadow-xs hover:border-m3-outline-variant transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-m3-outline uppercase tracking-wider">IN TRANSIT</span>
              <div className="w-8 h-8 rounded-xl bg-m3-surface-container text-m3-on-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">route</span>
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-m3-on-surface tracking-tight">{kpis.inTransit}</p>
            <p className="mt-1 text-[11px] font-medium text-m3-outline-variant uppercase tracking-tight">ON HIGHWAY EN ROUTE</p>
          </div>

          {/* Tile 5: Net Agency Margin */}
          <div className="bg-white rounded-2xl border border-m3-outline-variant/80 p-4 shadow-xs hover:border-m3-outline-variant transition-all col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-m3-outline uppercase tracking-wider">AGENCY MARGIN</span>
              <div className="w-8 h-8 rounded-xl bg-m3-surface-container text-m3-on-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-m3-on-surface tracking-tight">₹{kpis.totalMargin.toLocaleString()}</p>
            <p className="mt-1 text-[11px] font-medium text-m3-outline-variant uppercase tracking-tight">ESTIMATED NET CONTRACT</p>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. M3 SEGMENTED FILTER PILLS & SEARCH BAR                      */}
      {/* ============================================================== */}
      <section className="px-4 sm:px-6 py-2 max-w-[1720px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Segmented Pill Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab('dispatch')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'dispatch'
                  ? 'bg-m3-primary text-white shadow-sm'
                  : 'bg-white hover:bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant/80'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              <span>1. DISPATCH KANBAN</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'dispatch' ? 'bg-white/20 text-white' : 'bg-m3-surface-container text-m3-on-surface-variant'
              }`}>
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'leads'
                  ? 'bg-m3-primary text-white shadow-sm'
                  : 'bg-white hover:bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant/80'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calculate</span>
              <span>2. LEADS FUNNEL</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'leads' ? 'bg-white/20 text-white' : 'bg-m3-surface-container text-m3-on-surface-variant'
              }`}>
                {kpis.hotLeads}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dutyslip')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'dutyslip'
                  ? 'bg-m3-primary text-white shadow-sm'
                  : 'bg-white hover:bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant/80'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>3. DIGITAL DUTY SLIPS</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'dutyslip' ? 'bg-white/20 text-white' : 'bg-m3-surface-container text-m3-on-surface-variant'
              }`}>
                {dutySlips.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('khata')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'khata'
                  ? 'bg-m3-primary text-white shadow-sm'
                  : 'bg-white hover:bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant/80'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              <span>4. DRIVER KHATA</span>
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'fleet'
                  ? 'bg-m3-primary text-white shadow-sm'
                  : 'bg-white hover:bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant/80'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span>5. FLEET ROSTER</span>
            </button>

            <button
              onClick={() => setActiveTab('pilgrimage')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'pilgrimage'
                  ? 'bg-m3-primary text-white shadow-sm'
                  : 'bg-white hover:bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant/80'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">temple_hindu</span>
              <span>6. TIRUPATI DESK</span>
            </button>
          </div>

          {/* Search Pill */}
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-m3-outline-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by ref, guest, driver..."
              className="w-full bg-white border border-m3-outline-variant rounded-full pl-10 pr-4 py-2 text-xs font-medium text-m3-on-surface placeholder:text-m3-outline-variant focus:outline-none focus:ring-2 focus:ring-m3-primary/15 focus:border-m3-primary shadow-xs transition-all"
            />
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. MAIN WORKSPACE CONTENT                                      */}
      {/* ============================================================== */}
      <main className="flex-1 px-4 sm:px-6 py-4 max-w-[1720px] mx-auto w-full">

        {/* ============================================================== */}
        {/* DESK 1: DISPATCH KANBAN BOARD                                   */}
        {/* ============================================================== */}
        {activeTab === 'dispatch' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-m3-on-surface tracking-tight">Live Dispatch Flight Board</h2>
                <p className="text-xs text-m3-outline">Track trips through their operational state machine</p>
              </div>
              <span className="text-xs font-semibold text-m3-outline-variant">Auto-updating telemetry</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
              
              {/* Column 1: Unassigned / New Inquiries */}
              <div className="bg-m3-surface-container-low border border-m3-outline-variant/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-m3-outline-variant/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-m3-on-surface">
                    <span className="w-2 h-2 rounded-full bg-m3-outline-variant"></span>
                    <span>1. NEW / UNASSIGNED</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-m3-on-surface-variant text-xs font-bold shadow-2xs border border-m3-outline-variant/80">
                    {kanban.unassigned.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[420px]">
                  {kanban.unassigned.length === 0 ? (
                    <div className="p-8 text-center text-m3-outline-variant text-xs font-medium">No pending unassigned trips</div>
                  ) : (
                    kanban.unassigned.map(b => (
                      <div key={b.bookingId} className="bg-white rounded-xl p-4 border border-m3-outline-variant/80 shadow-xs hover:border-m3-outline-variant transition-all space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md bg-m3-surface-container text-m3-on-surface font-mono-code text-[11px] font-bold">
                            {b.bookingId}
                          </span>
                          <span className="text-m3-outline-variant text-[11px] font-medium">{b.travelDateTime}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-m3-on-surface leading-tight">{b.guestNamePhone}</p>
                          <p className="text-xs text-m3-outline truncate mt-1 flex items-center gap-1" title={b.pickupAddress}>
                            <span className="material-symbols-outlined text-[14px] text-m3-outline-variant">location_on</span>
                            {b.pickupAddress}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs bg-m3-surface-container-low p-2 rounded-lg border border-m3-outline-variant/40">
                          <span className="font-medium text-m3-on-surface-variant">{b.vehicleCategory} ({b.partySize})</span>
                          <span className="font-bold text-m3-on-surface">₹{b.terminalFare}</span>
                        </div>

                        {/* Assign Driver Dropdown */}
                        <div className="space-y-1 pt-1">
                          <label className="text-[11px] font-semibold text-m3-outline">Quick Assign Chauffeur:</label>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                const ch = chauffeurs.find(c => c.name === e.target.value);
                                updateBookingStatus(b.bookingId, {
                                  assignedChauffeur: `${ch.name} (${ch.phone}) - ${ch.plate}`,
                                  manifestStatus: 'Dispatched'
                                });
                              }
                            }}
                            className="w-full bg-white border border-m3-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-m3-on-surface font-medium focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                          >
                            <option value="">Select Chauffeur...</option>
                            {chauffeurs.map(c => (
                              <option key={c.name} value={c.name}>{c.name} ({c.category}) - {c.status}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Driver Allocated / Dispatched */}
              <div className="bg-m3-surface-container-low border border-m3-outline-variant/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-m3-outline-variant/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-m3-on-surface">
                    <span className="w-2 h-2 rounded-full bg-m3-outline-variant"></span>
                    <span>2. DRIVER ALLOCATED</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-m3-on-surface-variant text-xs font-bold shadow-2xs border border-m3-outline-variant/80">
                    {kanban.assigned.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[420px]">
                  {kanban.assigned.length === 0 ? (
                    <div className="p-8 text-center text-m3-outline-variant text-xs font-medium">No trips allocated yet</div>
                  ) : (
                    kanban.assigned.map(b => (
                    <div key={b.bookingId} className="bg-white rounded-xl p-4 border border-m3-outline-variant/80 shadow-xs hover:border-m3-outline-variant transition-all space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-m3-surface-container text-m3-on-surface font-mono-code text-[11px] font-bold">
                          {b.bookingId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant text-[10px] font-bold">
                          ALLOCATED
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-m3-on-surface leading-tight">{b.guestNamePhone}</p>
                        <p className="text-xs text-m3-on-surface-variant mt-1 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-m3-outline">directions_car</span>
                          {b.assignedChauffeur}
                        </p>
                      </div>

                      {/* Tonal WhatsApp Dispatches */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={getDriverManifestWhatsapp(b)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1 py-1.5 rounded-full bg-m3-success-container/40 hover:bg-m3-success-container/70 text-m3-on-success-container border border-m3-success/30/80 text-xs font-bold transition-colors"
                          title="Send manifest to driver via WhatsApp"
                        >
                          <span className="material-symbols-outlined text-[14px]">send</span>
                          DRIVER
                        </a>
                        <a
                          href={getGuestConfirmationWhatsapp(b)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1 py-1.5 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant/80 text-xs font-bold transition-colors"
                          title="Send cab & driver details to customer via WhatsApp"
                        >
                          <span className="material-symbols-outlined text-[14px]">chat</span>
                          GUEST
                        </a>
                      </div>

                      <button
                        onClick={() => updateBookingStatus(b.bookingId, { manifestStatus: 'In Transit' })}
                        className="w-full py-2 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface font-bold text-xs rounded-full border border-m3-outline-variant/80 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                        MARK TRIP STARTED
                      </button>
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* Column 3: In Transit / On Road */}
              <div className="bg-m3-surface-container-low border border-m3-outline-variant/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-m3-outline-variant/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-m3-on-surface">
                    <span className="w-2 h-2 rounded-full bg-m3-outline-variant"></span>
                    <span>3. ON HIGHWAY / ROLLING</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-m3-on-surface-variant text-xs font-bold shadow-2xs border border-m3-outline-variant/80">
                    {kanban.inTransit.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[420px]">
                  {kanban.inTransit.length === 0 ? (
                    <div className="p-8 text-center text-m3-outline-variant text-xs font-medium">No cabs on highway</div>
                  ) : (
                    kanban.inTransit.map(b => (
                    <div key={b.bookingId} className="bg-white rounded-xl p-4 border border-m3-outline-variant/80 shadow-xs hover:border-m3-outline-variant transition-all space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-m3-surface-container text-m3-on-surface font-mono-code text-[11px] font-bold">
                          {b.bookingId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-m3-surface-container text-m3-on-surface-variant text-[10px] font-bold border border-m3-outline-variant">
                          ON ROAD
                        </span>
                      </div>
                      <p className="text-sm font-bold text-m3-on-surface">{b.guestNamePhone}</p>
                      <p className="text-xs text-m3-on-surface-variant font-medium">{b.assignedChauffeur}</p>
                      
                      <button
                        onClick={() => openDutySlipForBooking(b)}
                        className="w-full mt-2 py-2 rounded-full bg-m3-primary hover:bg-m3-inverse-surface text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                        GENERATE DUTY SLIP
                      </button>
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* Column 4: Duty Slip Pending Settlement */}
              <div className="bg-m3-surface-container-low border border-m3-outline-variant/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-m3-outline-variant/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-m3-on-surface">
                    <span className="w-2 h-2 rounded-full bg-m3-outline-variant"></span>
                    <span>4. DUTY SLIP PENDING</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-m3-on-surface-variant text-xs font-bold shadow-2xs border border-m3-outline-variant/80">
                    {kanban.slipPending.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[420px]">
                  {kanban.slipPending.length === 0 ? (
                    <div className="p-8 text-center text-m3-outline-variant text-xs font-medium">No pending duty slips</div>
                  ) : (
                    kanban.slipPending.map(b => (
                    <div key={b.bookingId} className="bg-white rounded-xl p-4 border border-m3-outline-variant/80 shadow-xs hover:border-m3-outline-variant transition-all space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-m3-surface-container text-m3-on-surface font-mono-code text-[11px] font-bold">
                          {b.bookingId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-m3-surface-container text-m3-on-surface-variant text-[10px] font-bold border border-m3-outline-variant">
                          SLIP RECORDED
                        </span>
                      </div>
                      <p className="text-sm font-bold text-m3-on-surface">{b.guestNamePhone}</p>
                      <div className="text-xs text-m3-on-surface-variant bg-m3-surface-container-low p-2 rounded-lg border border-m3-outline-variant/40 flex justify-between">
                        <span>Fare: ₹{b.terminalFare}</span>
                        <span>Payout: ₹{b.chauffeurPayout}</span>
                      </div>

                      <button
                        onClick={() => {
                          setKhataForm({
                            chauffeurName: b.assignedChauffeur !== 'Unassigned' ? b.assignedChauffeur.split('(')[0].trim() : '',
                            bookingId: b.bookingId,
                            guestCashCollected: Number(b.terminalFare) || '',
                            driverAgreedPayout: Number(b.chauffeurPayout) || '',
                            tollsPaidByDriver: '',
                            paymentMode: 'UPI',
                            upiRef: '',
                            notes: ''
                          });
                          setActiveTab('khata');
                        }}
                        className="w-full py-2 bg-m3-primary hover:bg-m3-inverse-surface text-white font-bold text-xs rounded-full shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[15px]">payments</span>
                        RECONCILE IN KHATA
                      </button>
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* Column 5: Settled & Closed */}
              <div className="bg-m3-surface-container-low border border-m3-outline-variant/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-m3-outline-variant/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-m3-on-surface">
                    <span className="w-2 h-2 rounded-full bg-m3-outline-variant"></span>
                    <span>5. SETTLED & CLOSED</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-m3-on-surface-variant text-xs font-bold shadow-2xs border border-m3-outline-variant/80">
                    {kanban.settled.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[420px]">
                  {kanban.settled.length === 0 ? (
                    <div className="p-8 text-center text-m3-outline-variant text-xs font-medium">No settled trips yet</div>
                  ) : (
                    kanban.settled.map(b => (
                    <div key={b.bookingId} className="bg-white/95 rounded-xl p-3.5 border border-m3-outline-variant/80 shadow-xs space-y-2 opacity-85 hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-m3-surface-container text-m3-on-surface-variant font-mono-code text-[11px] font-bold">
                          {b.bookingId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-m3-surface-container text-m3-on-surface-variant text-[10px] font-bold border border-m3-outline-variant">
                          SETTLED
                        </span>
                      </div>
                      <p className="text-xs font-bold text-m3-on-surface">{b.guestNamePhone.split('(')[0]}</p>
                      <div className="flex items-center justify-between text-xs text-m3-on-surface-variant pt-1 border-t border-m3-outline-variant/40">
                        <span>Agency Margin:</span>
                        <strong className="text-m3-on-surface font-bold">₹{b.companyMargin}</strong>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DESK 2: LEADS & ABANDONED QUOTES RECOVERY                       */}
        {/* ============================================================== */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-m3-on-surface tracking-tight">Website Calculator Leads Funnel</h2>
                <p className="text-xs text-m3-outline">Visitors who calculated fares on your website. Call or WhatsApp within 3 mins to close.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsQuickCallModalOpen(true)}
                  className="px-4 py-2 bg-m3-primary hover:bg-m3-inverse-surface text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  + LOG INCOMING LEAD
                </button>
                <span className="text-xs font-semibold px-3 py-1 bg-white border border-m3-outline-variant rounded-full shadow-xs">
                  Total Leads: <strong className="text-m3-primary">{leads.length}</strong>
                </span>
              </div>
            </div>

            <div className="bg-white border border-m3-outline-variant/90 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-m3-surface text-m3-on-surface-variant font-bold uppercase text-[11px] border-b border-m3-outline-variant">
                    <tr>
                      <th className="py-3 px-4">Quote Ref</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Route (Pickup ➔ Drop)</th>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Est. Distance</th>
                      <th className="py-3 px-4">Quoted Fare</th>
                      <th className="py-3 px-4">Funnel Status</th>
                      <th className="py-3 px-4 text-right">Owner Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-m3-outline-variant/40 text-m3-on-surface-variant">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-m3-outline-variant font-medium">
                          No leads matching "{searchQuery}"
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map(lead => (
                      <tr key={lead.quoteId} className="hover:bg-m3-surface-container-low/80 transition-colors">
                        <td className="py-3 px-4 font-mono-code font-bold text-m3-primary">
                          {lead.quoteId.startsWith('#WA-') || lead.calculatorEngine?.includes('WhatsApp') || lead.sourcePage?.includes('WhatsApp') ? (
                            <span className="inline-flex items-center gap-1 text-m3-on-success-container bg-m3-success-container/40 px-2 py-0.5 rounded-md border border-m3-success/30 text-xs font-bold">
                              <span className="material-symbols-outlined text-[14px] text-m3-success">chat</span>
                              {lead.quoteId}
                            </span>
                          ) : lead.quoteId.startsWith('#CALL-') ? (
                            <span className="inline-flex items-center gap-1 text-m3-on-tertiary-container bg-m3-tertiary-container/30 px-2 py-0.5 rounded-md border border-m3-tertiary/30 text-xs font-bold">
                              <span className="material-symbols-outlined text-[14px] text-m3-tertiary">call</span>
                              {lead.quoteId}
                            </span>
                          ) : (
                            <span>{lead.quoteId}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-m3-outline">{lead.timestamp}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <div>
                              <span className="font-bold text-m3-on-surface">{lead.pickup}</span>
                              <span className="text-m3-outline-variant mx-2">➔</span>
                              <span className="font-bold text-m3-tertiary">{lead.drop}</span>
                            </div>
                            {lead.metadata && lead.metadata !== 'None' && (
                              <span className="text-[11px] text-m3-outline font-normal truncate max-w-sm mt-0.5" title={lead.metadata}>
                                {lead.metadata}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-m3-surface-container border border-m3-outline-variant font-medium text-m3-on-surface">
                            {lead.vehicle || 'Sedan'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-m3-outline">{lead.distanceKm} km</td>
                        <td className="py-3 px-4 text-base font-extrabold text-m3-on-surface">₹{lead.estimatedFare}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            lead.status === 'Converted' ? 'bg-m3-success-container/40 text-m3-on-success-container border border-m3-success/30' :
                            lead.status?.includes('Quoted') ? 'bg-m3-secondary-container/40 text-m3-on-secondary-container border border-m3-secondary/30' :
                            lead.status?.includes('Call') ? 'bg-m3-tertiary-container/30 text-m3-on-tertiary-container border border-m3-tertiary/30' :
                            lead.status?.includes('WhatsApp') || lead.calculatorEngine?.includes('WhatsApp') || lead.sourcePage?.includes('WhatsApp') || lead.status === 'Active Enquiry' ? 'bg-m3-success-container/40 text-m3-on-success-container border border-m3-success/30' :
                            'bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline-variant'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <a
                            href={getLeadQuoteWhatsapp(lead)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-m3-success hover:bg-m3-success text-white font-bold text-xs shadow-xs transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">send</span>
                            WHATSAPP QUOTE
                          </a>
                          {lead.status !== 'Converted' && (
                            <button
                              onClick={() => convertLeadToBooking(lead)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-m3-primary hover:bg-m3-inverse-surface text-white font-bold text-xs shadow-xs transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">add_task</span>
                              CONVERT TO BOOKING
                            </button>
                          )}
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DESK 3: DIGITAL DUTY SLIP (TRIP SHEET) STUDIO                   */}
        {/* ============================================================== */}
        {activeTab === 'dutyslip' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-m3-on-surface tracking-tight">Digital Duty Slip (Trip Sheet) Studio</h2>
                <p className="text-xs text-m3-outline">Standardized transport duty slips capturing start/end KM, tolls, and guest invoicing.</p>
              </div>
              <button
                onClick={() => setIsDutySlipModalOpen(true)}
                className="px-5 py-2.5 bg-m3-primary hover:bg-m3-inverse-surface text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                CREATE STANDALONE DUTY SLIP
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dutySlips.length === 0 ? (
                <div className="col-span-full p-12 text-center text-m3-outline-variant text-xs bg-white border border-m3-outline-variant rounded-2xl shadow-xs">
                  No duty slips generated yet. Click "GENERATE DUTY SLIP" on any active trip in the Dispatch Kanban.
                </div>
              ) : (
                dutySlips.map(slip => (
                  <div key={slip.slipId} className="bg-white border border-m3-outline-variant/90 rounded-2xl p-5 space-y-3 text-xs shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between pb-2 border-b border-m3-outline-variant/40">
                      <div>
                        <span className="text-[10px] font-bold text-m3-outline-variant uppercase tracking-wide">DUTY SLIP REF</span>
                        <h3 className="text-m3-on-surface font-mono-code font-bold text-sm">{slip.slipId}</h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-m3-success-container/40 text-m3-on-success-container text-[10px] font-bold border border-m3-success/30">
                        FINALIZED
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-m3-on-surface font-bold text-sm">{slip.guestName}</p>
                      <p className="text-m3-outline text-xs">
                        Chauffeur: <strong className="text-m3-on-surface">{slip.chauffeurName}</strong> ({slip.vehiclePlate})
                      </p>
                    </div>

                    <div className="bg-m3-surface rounded-xl p-3 space-y-1.5 text-xs text-m3-on-surface-variant border border-m3-outline-variant/40">
                      <div className="flex justify-between">
                        <span className="text-m3-outline">Start KM ➔ End KM:</span>
                        <strong className="text-m3-on-surface font-mono-code">{slip.startKm} ➔ {slip.endKm}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-m3-outline">Total Travelled:</span>
                        <strong>{slip.totalKm} km ({slip.extraKm} km Extra)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-m3-outline">Base Package Fare:</span>
                        <span>₹{slip.basePackageFare}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-m3-outline">Tolls & State Permit:</span>
                        <span>₹{slip.tollsFastag + slip.statePermit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-m3-outline">Driver Daily Bata:</span>
                        <span>₹{slip.driverBata}</span>
                      </div>
                      <div className="flex justify-between border-t border-m3-outline-variant pt-1.5 font-bold">
                        <span>Gross Bill:</span>
                        <span>₹{slip.grossFare}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-m3-success text-sm">
                        <span>Balance Collected:</span>
                        <span>₹{slip.netBalanceToCollect}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(slip.whatsappSummary || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 bg-m3-success hover:bg-m3-success text-white font-bold rounded-full text-center flex items-center justify-center gap-1 shadow-xs transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">share</span>
                        WHATSAPP RECEIPT
                      </a>
                      <button
                        onClick={() => window.print()}
                        className="px-3.5 py-2 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface-variant border border-m3-outline-variant rounded-full transition-colors"
                        title="Print Trip Sheet"
                      >
                        <span className="material-symbols-outlined text-[16px]">print</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DESK 4: DRIVER KHATA & EVENING SETTLEMENT                       */}
        {/* ============================================================== */}
        {activeTab === 'khata' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Settlement Calculator Form */}
            <div className="bg-white border border-m3-outline-variant/90 rounded-2xl p-6 space-y-4 shadow-sm text-xs">
              <div className="border-b border-m3-outline-variant/40 pb-3">
                <h2 className="text-base font-extrabold text-m3-on-surface tracking-tight">Driver Khata Reconciler</h2>
                <p className="text-xs text-m3-outline">Calculate net cash driver owes office or vice versa</p>
              </div>

              <form onSubmit={handleKhataSubmit} className="space-y-3.5">
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Chauffeur:</label>
                  <select
                    value={khataForm.chauffeurName}
                    onChange={(e) => setKhataForm(prev => ({ ...prev, chauffeurName: e.target.value }))}
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface font-medium focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  >
                    <option value="">-- Select Chauffeur --</option>
                    {chauffeurs.map(c => (
                      <option key={c.name} value={c.name}>{c.name} ({c.plate})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Booking / Trip Reference:</label>
                  <input
                    type="text"
                    value={khataForm.bookingId}
                    onChange={(e) => setKhataForm(prev => ({ ...prev, bookingId: e.target.value }))}
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface font-mono-code focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                    placeholder="e.g. #KT-101"
                  />
                </div>

                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Total Cash/UPI Collected from Guest (₹):</label>
                  <input
                    type="number"
                    value={khataForm.guestCashCollected}
                    onChange={(e) => setKhataForm(prev => ({ ...prev, guestCashCollected: e.target.value === '' ? '' : Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface font-extrabold text-base focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-m3-on-surface-variant">Driver Payout (₹):</label>
                    <input
                      type="number"
                      value={khataForm.driverAgreedPayout}
                      onChange={(e) => setKhataForm(prev => ({ ...prev, driverAgreedPayout: e.target.value === '' ? '' : Number(e.target.value) }))}
                      placeholder="0"
                      className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-m3-on-surface-variant">Tolls Paid (₹):</label>
                    <input
                      type="number"
                      value={khataForm.tollsPaidByDriver}
                      onChange={(e) => setKhataForm(prev => ({ ...prev, tollsPaidByDriver: e.target.value === '' ? '' : Number(e.target.value) }))}
                      placeholder="0"
                      className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Net Closing Position Box */}
                <div className={`p-4 rounded-2xl border ${
                  !khataForm.guestCashCollected && !khataForm.driverAgreedPayout && !khataForm.tollsPaidByDriver
                    ? 'bg-m3-surface-container-low border-m3-outline-variant text-m3-on-surface-variant'
                    : computedKhataNet >= 0
                      ? 'bg-m3-success-container/40 border-m3-success/30 text-m3-on-success-container'
                      : 'bg-m3-error-container/30 border-m3-error/30 text-m3-on-error-container'
                }`}>
                  <div className="text-[11px] font-bold uppercase tracking-wider">NET CLOSING POSITION:</div>
                  <div className="text-xl font-extrabold mt-1">
                    {!khataForm.guestCashCollected && !khataForm.driverAgreedPayout && !khataForm.tollsPaidByDriver ? (
                      <span>Ready for Reconciliation: ₹0</span>
                    ) : computedKhataNet >= 0 ? (
                      <span>Driver Owes Agency: ₹{computedKhataNet}</span>
                    ) : (
                      <span>Agency Pays Driver: ₹{Math.abs(computedKhataNet)}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-m3-on-surface-variant">UPI Ref / Notes:</label>
                  <input
                    type="text"
                    value={khataForm.upiRef}
                    onChange={(e) => setKhataForm(prev => ({ ...prev, upiRef: e.target.value }))}
                    placeholder="e.g. GPay UPI/624910248"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-m3-primary hover:bg-m3-inverse-surface text-white font-bold rounded-full uppercase shadow-sm transition-all"
                >
                  Record Settlement & Close
                </button>
              </form>
            </div>

            {/* Historical Settlements Table */}
            <div className="lg:col-span-2 bg-white border border-m3-outline-variant/90 rounded-2xl p-6 space-y-4 shadow-sm text-xs">
              <div className="flex items-center justify-between border-b border-m3-outline-variant/40 pb-3">
                <h2 className="text-base font-extrabold text-m3-on-surface tracking-tight">Settlement History Ledger</h2>
                <span className="text-m3-outline-variant text-xs font-medium">Recent Khata Closures</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-m3-surface text-m3-on-surface-variant uppercase text-[11px] font-bold border-b border-m3-outline-variant">
                    <tr>
                      <th className="p-3">Date/Time</th>
                      <th className="p-3">Chauffeur</th>
                      <th className="p-3">Booking ID</th>
                      <th className="p-3">Cash Collected</th>
                      <th className="p-3">Driver Share</th>
                      <th className="p-3">Net Office Profit</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-m3-outline-variant/40 text-m3-on-surface-variant">
                    {settlements.map(s => (
                      <tr key={s.settlementId} className="hover:bg-m3-surface-container-low/70">
                        <td className="p-3 text-m3-outline">{new Date(s.timestamp).toLocaleString()}</td>
                        <td className="p-3 font-bold text-m3-on-surface">{s.chauffeurName}</td>
                        <td className="p-3 font-mono-code font-semibold text-m3-primary">{s.bookingId}</td>
                        <td className="p-3 font-extrabold text-m3-on-surface">₹{s.guestCashCollected}</td>
                        <td className="p-3">₹{s.driverAgreedPayout}</td>
                        <td className="p-3 font-bold text-m3-success">₹{s.netOfficeReceivable}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-m3-success-container/40 text-m3-on-success-container text-[10px] font-bold border border-m3-success/30">
                            {s.settlementStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* DESK 5: FLEET & COMPLIANCE ROSTER                              */}
        {/* ============================================================== */}
        {activeTab === 'fleet' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-m3-on-surface tracking-tight">Fleet & Chauffeur Roster</h2>
                <p className="text-xs text-m3-outline">Track driver availability, vehicle category, and commercial compliance expirations.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chauffeurs.map(ch => (
                <div key={ch.name} className="bg-white border border-m3-outline-variant/90 rounded-2xl p-5 space-y-3 text-xs shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-m3-on-surface">{ch.name}</h3>
                      <p className="text-m3-outline text-xs">{ch.phone}</p>
                    </div>
                    <select
                      value={ch.status}
                      onChange={(e) => {
                        const next = e.target.value;
                        setChauffeurs(prev => prev.map(c => c.name === ch.name ? { ...c, status: next } : c));
                      }}
                      className={`text-xs font-bold rounded-full px-3 py-1 border transition-colors ${
                        ch.status === 'Available' ? 'bg-m3-success-container/40 text-m3-on-success-container border-m3-success/30' :
                        ch.status === 'On Trip' ? 'bg-m3-tertiary-container/30 text-m3-on-tertiary-container border-m3-tertiary/30' :
                        'bg-m3-surface-container text-m3-on-surface-variant border-m3-outline-variant'
                      }`}
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Off Duty">Off Duty</option>
                    </select>
                  </div>

                  <div className="bg-m3-surface rounded-xl p-3 space-y-1.5 text-xs border border-m3-outline-variant/40">
                    <div className="flex justify-between">
                      <span className="text-m3-outline">Assigned Vehicle:</span>
                      <strong className="text-m3-on-surface font-mono-code">{ch.plate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-m3-outline">Category:</span>
                      <strong className="text-m3-on-surface">{ch.category}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-m3-outline">Driver Rating:</span>
                      <span className="text-m3-tertiary font-bold">★ {ch.rating}</span>
                    </div>
                  </div>

                  {/* Compliance Expirations */}
                  <div className="space-y-1 pt-1 border-t border-m3-outline-variant/40 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-m3-outline">Fitness Cert (FC):</span>
                      <span className="text-m3-success font-bold">{ch.fcExpiry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-m3-outline">All-India Permit:</span>
                      <span className="text-m3-success font-bold">{ch.permitExpiry}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DESK 6: TIRUPATI PILGRIMAGE LOGISTICS                          */}
        {/* ============================================================== */}
        {activeTab === 'pilgrimage' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-m3-on-surface tracking-tight">Tirupati & Pilgrimage Logistics Console</h2>
                <p className="text-xs text-m3-outline">Manage TTD ₹300 SED Darshan slots, Aadhaar KYC verification, and morning departure schedules.</p>
              </div>
            </div>

            <div className="bg-white border border-m3-outline-variant/90 rounded-2xl shadow-sm overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-m3-surface text-m3-on-surface-variant uppercase text-[11px] font-bold border-b border-m3-outline-variant">
                    <tr>
                      <th className="p-3.5">Booking ID</th>
                      <th className="p-3.5">Guest & Family</th>
                      <th className="p-3.5">Pickup Date/Time</th>
                      <th className="p-3.5">Party Size</th>
                      <th className="p-3.5">SED Darshan Status</th>
                      <th className="p-3.5">Aadhaar KYC</th>
                      <th className="p-3.5">Assigned Chauffeur</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-m3-outline-variant/40 text-m3-on-surface-variant">
                    {bookings.filter(b => b.darshanStatus !== 'Unassigned' || b.pickupAddress.toLowerCase().includes('tirupati') || b.bookingId.includes('TPT')).map(b => (
                      <tr key={b.bookingId} className="hover:bg-m3-surface-container-low/70">
                        <td className="p-3.5 font-mono-code font-bold text-m3-primary">{b.bookingId}</td>
                        <td className="p-3.5 font-bold text-m3-on-surface">{b.guestNamePhone}</td>
                        <td className="p-3.5 text-m3-outline">{b.travelDateTime}</td>
                        <td className="p-3.5">{b.partySize}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            b.darshanStatus.includes('Confirmed') ? 'bg-m3-success-container/40 text-m3-on-success-container border border-m3-success/30' :
                            'bg-m3-tertiary-container/30 text-m3-on-tertiary-container border border-m3-tertiary/30'
                          }`}>
                            {b.darshanStatus}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            b.kycStatus === 'Verified' ? 'bg-m3-success-container/40 text-m3-on-success-container' : 'bg-m3-error-container/30 text-m3-on-error-container'
                          }`}>
                            {b.kycStatus}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-m3-on-surface">{b.assignedChauffeur}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              updateBookingStatus(b.bookingId, {
                                kycStatus: b.kycStatus === 'Verified' ? 'Pending' : 'Verified',
                                darshanStatus: b.darshanStatus.includes('Confirmed') ? 'In-Process' : 'Confirmed (11:30 AM)'
                              });
                            }}
                            className="px-3 py-1.5 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface-variant rounded-full text-xs font-bold transition-colors"
                          >
                            TOGGLE STATUS
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* MODAL: QUICK NEW BOOKING (M3 DIALOG)                            */}
      {/* ============================================================== */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-m3-inverse-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-m3-outline-variant rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-m3-outline-variant/40 pb-3">
              <h3 className="text-base font-extrabold text-m3-on-surface tracking-tight">Manual Booking Entry</h3>
              <button onClick={() => setIsNewBookingModalOpen(false)} className="text-m3-outline-variant hover:text-m3-on-surface-variant p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleNewBookingSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Guest Name:</label>
                  <input
                    type="text"
                    required
                    value={newBooking.guestName}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, guestName: e.target.value }))}
                    placeholder="Ramesh Kumar"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Guest Phone:</label>
                  <input
                    type="text"
                    required
                    value={newBooking.guestPhone}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, guestPhone: e.target.value }))}
                    placeholder="98401 23456"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-m3-on-surface-variant">Tour Package Preset (Optional):</label>
                  <span className="text-[10px] text-m3-success font-medium">Auto-fills fare & address</span>
                </div>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const pkgId = e.target.value;
                    if (pkgId && pkgId !== 'custom') {
                      const pkg = TOUR_PACKAGES.find(p => p.id === pkgId);
                      if (pkg) {
                        const fare = pkg.rates[newBooking.vehicleCategory] || pkg.rates['Sedan'] || '6000';
                        setNewBooking(prev => ({
                          ...prev,
                          fare: fare,
                          pickupAddress: prev.pickupAddress ? prev.pickupAddress : `${pkg.shortName} (Doorstep Pickup)`
                        }));
                      }
                    }
                  }}
                  className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface text-xs font-semibold focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                >
                  <option value="">-- Quick Select Package (Tirupati, Madurai, Pondicherry) --</option>
                  {TOUR_PACKAGES.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-m3-on-surface-variant">Pickup Address:</label>
                <input
                  type="text"
                  required
                  value={newBooking.pickupAddress}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, pickupAddress: e.target.value }))}
                  placeholder="#12, 4th Main Road, Anna Nagar East"
                  className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Pickup Date:</label>
                  <input
                    type="text"
                    required
                    value={newBooking.travelDate}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, travelDate: e.target.value }))}
                    placeholder="15-Oct-2026"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Pickup Time:</label>
                  <input
                    type="text"
                    required
                    value={newBooking.pickupTime}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, pickupTime: e.target.value }))}
                    placeholder="04:30 AM"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Vehicle Category:</label>
                  <select
                    value={newBooking.vehicleCategory}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, vehicleCategory: e.target.value }))}
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  >
                    <option value="Sedan">Sedan (Dzire / Etios)</option>
                    <option value="Ertiga">Ertiga (6 Pax)</option>
                    <option value="Innova Crysta">Innova Crysta</option>
                    <option value="Tempo">Tempo Traveller (12+ Pax)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Terminal Fare (₹):</label>
                  <input
                    type="number"
                    required
                    value={newBooking.fare}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, fare: e.target.value }))}
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface font-extrabold focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-m3-on-surface-variant">Assign Chauffeur (Optional):</label>
                <select
                  value={newBooking.assignedChauffeur}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, assignedChauffeur: e.target.value }))}
                  className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                >
                  <option value="Unassigned">Leave Unassigned</option>
                  {chauffeurs.map(c => (
                    <option key={c.name} value={`${c.name} (${c.phone}) - ${c.plate}`}>{c.name} ({c.category}) - {c.plate}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="px-5 py-2.5 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface-variant font-semibold rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-m3-primary hover:bg-m3-inverse-surface text-white font-bold rounded-full shadow-sm"
                >
                  Save & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DIGITAL DUTY SLIP CREATOR (M3 DIALOG)                    */}
      {/* ============================================================== */}
      {isDutySlipModalOpen && (
        <div className="fixed inset-0 z-50 bg-m3-inverse-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-m3-outline-variant rounded-3xl max-w-xl w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-m3-outline-variant/40 pb-3">
              <h3 className="text-base font-extrabold text-m3-on-surface tracking-tight">Generate Digital Trip Duty Slip</h3>
              <button onClick={() => setIsDutySlipModalOpen(false)} className="text-m3-outline-variant hover:text-m3-on-surface-variant p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleDutySlipSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Trip Reference:</label>
                  <input
                    type="text"
                    required
                    value={slipForm.bookingId}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, bookingId: e.target.value }))}
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-primary font-mono-code font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Guest Name:</label>
                  <input
                    type="text"
                    required
                    value={slipForm.guestName}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, guestName: e.target.value }))}
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Chauffeur:</label>
                  <input
                    type="text"
                    required
                    value={slipForm.chauffeurName}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, chauffeurName: e.target.value }))}
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface"
                  />
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Vehicle Plate:</label>
                  <input
                    type="text"
                    required
                    value={slipForm.vehiclePlate}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2.5 text-m3-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 bg-m3-surface p-3 rounded-2xl border border-m3-outline-variant/40">
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Start Odometer:</label>
                  <input
                    type="number"
                    required
                    value={slipForm.startKm}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, startKm: e.target.value === '' ? '' : Number(e.target.value) }))}
                    placeholder="e.g. 10000"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-on-surface font-mono-code"
                  />
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">End Odometer:</label>
                  <input
                    type="number"
                    required
                    value={slipForm.endKm}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, endKm: e.target.value === '' ? '' : Number(e.target.value) }))}
                    placeholder="e.g. 10320"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-on-surface font-mono-code"
                  />
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Package Allowance:</label>
                  <input
                    type="number"
                    value={slipForm.packageAllowedKm}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, packageAllowedKm: e.target.value === '' ? '' : Number(e.target.value) }))}
                    placeholder="300"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-on-surface font-mono-code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Base Fare (₹):</label>
                  <input
                    type="number"
                    value={slipForm.basePackageFare}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, basePackageFare: e.target.value === '' ? '' : Number(e.target.value) }))}
                    placeholder="e.g. 6000"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-on-surface"
                  />
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">FASTag Tolls (₹):</label>
                  <input
                    type="number"
                    value={slipForm.tollsFastag}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, tollsFastag: e.target.value === '' ? '' : Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-on-surface"
                  />
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">State Permit (₹):</label>
                  <input
                    type="number"
                    value={slipForm.statePermit}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, statePermit: e.target.value === '' ? '' : Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-on-surface"
                  />
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Advance Paid (₹):</label>
                  <input
                    type="number"
                    value={slipForm.advancePaid}
                    onChange={(e) => setSlipForm(prev => ({ ...prev, advancePaid: e.target.value === '' ? '' : Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-success font-bold"
                  />
                </div>
              </div>

              {/* Real-time Duty Slip Calculation Summary */}
              <div className="bg-m3-success-container/40 border border-m3-success/30/90 rounded-2xl p-4 space-y-1.5 text-xs text-m3-on-success-container">
                <div className="flex justify-between">
                  <span className="text-m3-on-success-container">Total Distance:</span>
                  <strong>{computedSlip.totalKm} km ({computedSlip.extraKm} km extra @ ₹{slipForm.extraKmRate})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-m3-on-success-container">Gross Trip Bill:</span>
                  <strong className="text-m3-on-success-container">₹{computedSlip.gross}</strong>
                </div>
                <div className="flex justify-between border-t border-m3-success/30 pt-2 text-sm font-extrabold text-m3-on-success-container">
                  <span>BALANCE TO COLLECT:</span>
                  <span>₹{computedSlip.balance}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDutySlipModalOpen(false)}
                  className="px-5 py-2.5 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface-variant font-semibold rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-m3-primary hover:bg-m3-inverse-surface text-white font-bold rounded-full shadow-sm"
                >
                  Finalize Slip & Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: 10-SECOND QUICK INCOMING LEAD LOGGER (M3 DIALOG)        */}
      {/* ============================================================== */}
      {isQuickCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-m3-inverse-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-m3-outline-variant rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-m3-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                  callForm.channel === 'whatsapp'
                    ? 'bg-m3-success-container/40 text-m3-success border-m3-success/30/60'
                    : 'bg-m3-tertiary-container/30 text-m3-tertiary border-m3-tertiary/30/60'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {callForm.channel === 'whatsapp' ? 'chat' : 'phone_in_talk'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-m3-on-surface tracking-tight">10-Sec Quick Lead Logger</h3>
                  <p className="text-[11px] text-m3-outline-variant">Capture WhatsApp enquiries & phone calls instantly</p>
                </div>
              </div>
              <button onClick={() => setIsQuickCallModalOpen(false)} className="text-m3-outline-variant hover:text-m3-on-surface-variant p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleQuickCallSubmit} className="space-y-3.5">
              {/* Channel Selector Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCallForm(prev => ({ ...prev, channel: 'whatsapp', status: 'Active Enquiry', notes: 'Inbound WhatsApp lead' }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    callForm.channel === 'whatsapp'
                      ? 'bg-m3-success-container/40 border-m3-success/50 text-m3-on-success-container shadow-xs ring-1 ring-m3-success'
                      : 'bg-white border-m3-outline-variant text-m3-on-surface-variant hover:bg-m3-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-m3-success">chat</span>
                  <span>WhatsApp Lead</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCallForm(prev => ({ ...prev, channel: 'call', status: 'Call Received - Quoted', notes: 'Inbound phone call enquiry' }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    callForm.channel === 'call'
                      ? 'bg-m3-tertiary-container/30 border-m3-tertiary/50 text-m3-on-tertiary-container shadow-xs ring-1 ring-m3-tertiary'
                      : 'bg-white border-m3-outline-variant text-m3-on-surface-variant hover:bg-m3-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-m3-tertiary">phone_in_talk</span>
                  <span>Inbound Phone Call</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">
                    {callForm.channel === 'whatsapp' ? 'WhatsApp Mobile Phone *' : 'Caller Mobile Phone *'}
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-m3-outline-variant font-bold">+91</span>
                    <input
                      type="tel"
                      required
                      value={callForm.callerPhone}
                      onChange={(e) => setCallForm(prev => ({ ...prev, callerPhone: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="98803 09619"
                      className="w-full pl-12 pr-3 py-2 bg-white border border-m3-outline-variant rounded-xl text-m3-on-surface font-bold text-sm focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Customer / Company Name</label>
                  <input
                    type="text"
                    value={callForm.guestName}
                    onChange={(e) => setCallForm(prev => ({ ...prev, guestName: e.target.value }))}
                    placeholder="e.g. Mr. Senthil"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-m3-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-m3-tertiary">travel_explore</span>
                      <span>Select Tour Package / Route *</span>
                    </label>
                    <span className="text-[10px] text-m3-success bg-m3-success-container/40 border border-m3-success/30/80 px-2 py-0.5 rounded-full font-semibold">
                      Auto-fills fare & route
                    </span>
                  </div>
                  <select
                    value={selectedCallPackage}
                    onChange={(e) => handleCallPackageChange(e.target.value)}
                    className="w-full mt-1 bg-m3-tertiary-container/30/50 border border-m3-tertiary/40/80 rounded-xl p-2.5 text-m3-on-surface font-bold text-xs focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none cursor-pointer"
                  >
                    {TOUR_PACKAGES.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    <option value="custom">✏️ Custom Route / Other Destination (Type below)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-m3-outline">
                    Requested Route / Travel Detail (Editable Note) *
                  </label>
                  <input
                    type="text"
                    required
                    value={callForm.route}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCallForm(prev => ({ ...prev, route: val }));
                      const matched = TOUR_PACKAGES.find(p => p.shortName.toLowerCase() === val.toLowerCase() || p.name.toLowerCase() === val.toLowerCase());
                      if (matched) {
                        setSelectedCallPackage(matched.id);
                      } else {
                        setSelectedCallPackage('custom');
                      }
                    }}
                    placeholder="e.g. Chennai ➔ Tirupati One Day Round Trip"
                    className="w-full mt-0.5 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-on-surface font-medium focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Vehicle Type</label>
                  <select
                    value={callForm.vehicle}
                    onChange={(e) => handleCallVehicleChange(e.target.value)}
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  >
                    <option value="Sedan (Dzire / Etios)">Sedan (Dzire / Etios)</option>
                    <option value="Ertiga (6 Pax)">Ertiga (6 Pax)</option>
                    <option value="Innova Crysta">Innova Crysta (7 Pax)</option>
                    <option value="Tempo Traveller">Tempo Traveller (12+ Pax)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Quoted Fare (₹)</label>
                  <input
                    type="number"
                    value={callForm.quotedFare}
                    onChange={(e) => setCallForm(prev => ({ ...prev, quotedFare: e.target.value }))}
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-on-surface font-bold focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Call Status</label>
                  <select
                    value={callForm.status}
                    onChange={(e) => setCallForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  >
                    <option value="Call Received - Quoted">Call Received - Quoted</option>
                    <option value="Needs Follow-up">Needs Follow-up (High Interest)</option>
                    <option value="Callback Requested">Callback Requested</option>
                    <option value="Lost - Rate Issue">Lost - Rate Issue</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-m3-on-surface-variant">Attendant Notes</label>
                  <input
                    type="text"
                    value={callForm.notes}
                    onChange={(e) => setCallForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g. Needs early 4:30 AM pickup"
                    className="w-full mt-1 bg-white border border-m3-outline-variant rounded-xl p-2 text-m3-on-surface focus:border-m3-primary focus:ring-1 focus:ring-m3-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsQuickCallModalOpen(false)}
                  className="px-5 py-2.5 bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface-variant font-semibold rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-m3-primary hover:bg-m3-inverse-surface text-white font-bold rounded-full shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Log to Leads Funnel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
