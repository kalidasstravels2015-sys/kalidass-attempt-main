// Cloudflare Pages Function: /api/record-booking
// Records website WhatsApp quotes and bookings to the Operations Google Sheet without overwriting earlier quotes.

const DEFAULT_TRIPS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzpTM1pLXWLF-E80-HAXjj2ghAC_0tvFW1blTJC7rJojqUhTcKIwQz0t-NQMCScN2VA/exec';

let edgeBookingSeq = 1;

function sanitizeWebhookUrl(rawUrl) {
  const clean = (rawUrl || '').trim();
  if (!clean || !clean.startsWith('http') || clean.includes('AKfycbzjPh0a2ju')) {
    return DEFAULT_TRIPS_WEBHOOK_URL;
  }
  return clean;
}

function getKolkataDateCode() {
  const d = new Date();
  const options = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(d);
  const dd = parts.find(p => p.type === 'day')?.value || '14';
  const mm = parts.find(p => p.type === 'month')?.value || '11';
  const yy = parts.find(p => p.type === 'year')?.value || '26';
  return `${dd}${mm}${yy}`;
}

export async function onRequestPost({ request, env }) {
  try {
    let data = {};
    try {
      data = await request.json();
    } catch (_) {
      try {
        const text = await request.text();
        data = JSON.parse(text);
      } catch (e) {}
    }

    const dateCode = getKolkataDateCode();
    let bookingId = data.bookingId || data.quoteId || data.quoteRefId || `Q-${dateCode}-${edgeBookingSeq++}`;
    const originalId = bookingId;

    const rawWebhookUrl =
      data.webhookUrl ||
      (env && (env.GOOGLE_SHEET_WEBHOOK_URL || env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL)) ||
      DEFAULT_TRIPS_WEBHOOK_URL;
    const webhookUrl = sanitizeWebhookUrl(rawWebhookUrl);

    const fareNum = parseInt(String(data.fare || data.terminalFare || data.estimate || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const advanceNum = parseInt(String(data.advance || data.advancePaid || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const cleanPhone = String(data.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const cleanAddress = data.pickupAddress || data.route || (data.pickup ? `${data.pickup} ➔ ${data.drop || 'Outstation'}` : 'Chennai ➔ Outstation');

    const tripPayload = {
      id: bookingId,
      customerName: data.name || (cleanPhone ? `Guest (+91 ${cleanPhone})` : 'Website WhatsApp Lead'),
      phone: cleanPhone,
      tripCategory: data.package || data.tripCategory || (cleanAddress.includes('➔') ? 'Outstation' : 'Website Lead'),
      vehicle: data.vehicle || data.vehicleCategory || 'Sedan',
      route: cleanAddress,
      pickupDate: data.pickupDate || data.travelDateTime || new Date().toISOString().split('T')[0],
      pickupTime: data.pickupTime || '06:00 AM',
      pickupLocation: data.pickup || cleanAddress.split('➔')[0]?.trim() || 'Chennai',
      dropLocation: data.drop || cleanAddress.split('➔')[1]?.trim() || '',
      agreedRate: fareNum,
      advance: advanceNum,
      balance: Math.max(0, fareNum - advanceNum),
      driverName: '',
      driverPhone: '',
      vehicleNumber: '',
      manifestStatus: 'Unassigned',
      notes: data.notes || data.metadata || 'Booked via Website WhatsApp Engine',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        let alreadySaved = false;
        try {
          const checkRes = await fetch(webhookUrl, {
            method: 'GET',
            redirect: 'follow',
            cf: { cacheTtl: 0 }
          });
          if (checkRes.ok) {
            const sheetData = await checkRes.json();
            if (sheetData && Array.isArray(sheetData.trips)) {
              const existingRow = sheetData.trips.find(r => String(r.id) === String(tripPayload.id));
              if (existingRow) {
                const rowCreatedMs = existingRow.createdAt ? new Date(existingRow.createdAt).getTime() : 0;
                const isRecentSameTrip =
                  rowCreatedMs > 0 &&
                  Math.abs(Date.now() - rowCreatedMs) < 60000 &&
                  String(existingRow.route || '') === String(tripPayload.route || '') &&
                  Number(existingRow.agreedRate || 0) === Number(tripPayload.agreedRate || 0) &&
                  String(existingRow.vehicle || '') === String(tripPayload.vehicle || '');

                if (isRecentSameTrip) {
                  alreadySaved = true;
                } else {
                  const idMatch = String(originalId).match(/^Q-(\d{6})-(\d+)$/i);
                  const targetDateCode = idMatch ? idMatch[1] : dateCode;
                  const seqRegex = new RegExp(`Q-${targetDateCode}-(\\d+)`, 'gi');
                  let maxSeq = idMatch ? parseInt(idMatch[2], 10) : 0;
                  for (const r of sheetData.trips) {
                    const textToScan = `${r?.id || ''} ${r?.notes || ''}`;
                    let m;
                    seqRegex.lastIndex = 0;
                    while ((m = seqRegex.exec(textToScan)) !== null) {
                      const n = parseInt(m[1], 10);
                      if (!isNaN(n) && n > maxSeq) maxSeq = n;
                    }
                  }
                  bookingId = `Q-${targetDateCode}-${maxSeq + 1}`;
                  tripPayload.id = bookingId;
                  if (!tripPayload.notes.includes(`WA Ref: ${originalId}`)) {
                    tripPayload.notes = `${tripPayload.notes} [WA Ref: ${originalId}]`;
                  }
                }
              }
            }
          }
        } catch (_) {}

        if (!alreadySaved) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'SAVE_TRIP',
              trip: tripPayload
            })
          });
        }
      } catch (_) {}
    }

    return new Response(JSON.stringify({ success: true, bookingId }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
