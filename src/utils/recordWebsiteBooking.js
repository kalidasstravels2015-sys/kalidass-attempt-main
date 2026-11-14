// Centralized Website Booking Dispatcher
// Automatically logs all website quotations and bookings into the connected Google Sheet

export const DEFAULT_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzpTM1pLXWLF-E80-HAXjj2ghAC_0tvFW1blTJC7rJojqUhTcKIwQz0t-NQMCScN2VA/exec';

export function getActiveSheetUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const custom = localStorage.getItem('kt_admin_google_sheet_webhook_v1');
    if (custom && custom.startsWith('https://script.google.com/') && !custom.includes('AKfycbzjPh0a2ju')) {
      return custom;
    }
  }
  return DEFAULT_SHEET_WEBHOOK_URL;
}

function getTodayDateCode() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

export async function logBookingToGoogleSheet(bookingData) {
  try {
    const sheetUrl = getActiveSheetUrl();
    if (!sheetUrl) return;

    const agreed = parseInt(String(bookingData.fare || bookingData.terminalFare || 0).replace(/[^0-9]/g, ''), 10) || 0;
    const adv = parseInt(String(bookingData.advance || bookingData.advancePaid || 0).replace(/[^0-9]/g, ''), 10) || 0;
    const cleanPhone = String(bookingData.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const originalId = bookingData.bookingId || bookingData.quoteId || `Q-${getTodayDateCode()}-1`;

    const trip = {
      id: originalId,
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

    // Guard against overwriting an existing quote in the Google Sheet if two visitors received the same Q-DDMMYY-X ID
    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch(sheetUrl, { method: 'GET', redirect: 'follow' });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.trips)) {
            const existingRow = data.trips.find(r => String(r.id) === String(trip.id));
            if (existingRow) {
              const rowCreatedMs = existingRow.createdAt ? new Date(existingRow.createdAt).getTime() : 0;
              const isRecentSameTrip =
                rowCreatedMs > 0 &&
                Math.abs(Date.now() - rowCreatedMs) < 60000 &&
                String(existingRow.route || '') === String(trip.route || '') &&
                Number(existingRow.agreedRate || 0) === Number(trip.agreedRate || 0) &&
                String(existingRow.vehicle || '') === String(trip.vehicle || '');

              if (isRecentSameTrip) {
                // Already recorded by companion /api/record-booking call within the last 60s
                return;
              }

              // Collision with a different customer's quote: allocate next available Q-DDMMYY-X sequence
              const idMatch = String(originalId).match(/^Q-(\d{6})-(\d+)$/i);
              const dateCode = idMatch ? idMatch[1] : getTodayDateCode();
              const seqRegex = new RegExp(`Q-${dateCode}-(\\d+)`, 'gi');
              let maxSeq = idMatch ? parseInt(idMatch[2], 10) : 0;
              for (const r of data.trips) {
                const textToScan = `${r?.id || ''} ${r?.notes || ''}`;
                let m;
                seqRegex.lastIndex = 0;
                while ((m = seqRegex.exec(textToScan)) !== null) {
                  const n = parseInt(m[1], 10);
                  if (!isNaN(n) && n > maxSeq) maxSeq = n;
                }
              }
              trip.id = `Q-${dateCode}-${maxSeq + 1}`;
              if (!trip.notes.includes(`WA Ref: ${originalId}`)) {
                trip.notes = `${trip.notes} [WA Ref: ${originalId}]`;
              }
            }
          }
        }
      } catch (_) {}
    }

    const payload = JSON.stringify({
      action: 'SAVE_TRIP',
      trip: trip
    });

    if (typeof fetch !== 'undefined') {
      await fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
      navigator.sendBeacon(sheetUrl, blob);
    }
  } catch (_) {}
}

