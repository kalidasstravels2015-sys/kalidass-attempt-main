// Centralized Website Booking Dispatcher
// Automatically logs all website quotations and bookings into the connected Google Sheet

export const DEFAULT_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzpTM1pLXWLF-E80-HAXjj2ghAC_0tvFW1blTJC7rJojqUhTcKIwQz0t-NQMCScN2VA/exec';

export function getActiveSheetUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const custom = localStorage.getItem('kt_admin_google_sheet_webhook_v1');
    if (custom && custom.startsWith('https://script.google.com/')) return custom;
  }
  return DEFAULT_SHEET_WEBHOOK_URL;
}

export function logBookingToGoogleSheet(bookingData) {
  try {
    const sheetUrl = getActiveSheetUrl();
    if (!sheetUrl) return;

    const agreed = parseInt(String(bookingData.fare || bookingData.terminalFare || 0).replace(/[^0-9]/g, ''), 10) || 0;
    const adv = parseInt(String(bookingData.advance || bookingData.advancePaid || 0).replace(/[^0-9]/g, ''), 10) || 0;
    const cleanPhone = String(bookingData.phone || '').replace(/[^0-9]/g, '').slice(-10);

    const trip = {
      id: bookingData.bookingId || `KT-${Date.now()}`,
      customerName: bookingData.name || (cleanPhone ? `Guest (+91 ${cleanPhone})` : 'Website WhatsApp Lead'),
      phone: cleanPhone,
      tripCategory: bookingData.package || bookingData.tripCategory || (bookingData.route?.includes('➔') ? 'Outstation' : 'Website Lead'),
      vehicle: bookingData.vehicle || bookingData.vehicleCategory || 'Sedan',
      route: bookingData.route || bookingData.pickupAddress || `${bookingData.pickup || 'Chennai'} ➔ ${bookingData.drop || 'Outstation'}`,
      pickupDate: bookingData.pickupDate || bookingData.travelDateTime || new Date().toISOString().split('T')[0],
      pickupTime: bookingData.pickupTime || '06:00 AM',
      pickupLocation: bookingData.pickup || bookingData.pickupAddress || 'Chennai',
      dropLocation: bookingData.drop || '',
      agreedRate: agreed,
      advance: adv,
      balance: Math.max(0, agreed - adv),
      driverName: '',
      driverPhone: '',
      vehicleNumber: '',
      manifestStatus: 'Unassigned',
      notes: bookingData.notes || 'Booked via Website WhatsApp Engine',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const payload = JSON.stringify({
      action: 'SAVE_TRIP',
      trip: trip
    });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
      navigator.sendBeacon(sheetUrl, blob);
    } else if (typeof fetch !== 'undefined') {
      fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  } catch (_) {}
}

