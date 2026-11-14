import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { getDailySequence, saveDailySequence } from './next-quote-id';

export const prerender = false;

const DEFAULT_TRIPS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzpTM1pLXWLF-E80-HAXjj2ghAC_0tvFW1blTJC7rJojqUhTcKIwQz0t-NQMCScN2VA/exec';

function sanitizeWebhookUrl(rawUrl: string): string {
  const clean = (rawUrl || '').trim();
  if (!clean || !clean.startsWith('http') || clean.includes('AKfycbzjPh0a2ju')) {
    return DEFAULT_TRIPS_WEBHOOK_URL;
  }
  return clean;
}

function getEnvWebhook(): string {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf8');
      const match = raw.match(/(?:PUBLIC_)?GOOGLE_SHEET_WEBHOOK_URL=([^\r\n]+)/);
      if (match && match[1]) return sanitizeWebhookUrl(match[1]);
    }
  } catch (_) {}
  return sanitizeWebhookUrl(process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL || DEFAULT_TRIPS_WEBHOOK_URL);
}

export const POST: APIRoute = async ({ request, url }) => {
  try {
    let data: any = {};
    try {
      data = await request.json();
    } catch (_) {
      try {
        const raw = await request.text();
        data = JSON.parse(raw);
      } catch (_) {}
    }

    const targetUrl = url || new URL(request.url);
    const webhookUrl = sanitizeWebhookUrl(targetUrl.searchParams.get('webhook') || (data && data.webhookUrl) || getEnvWebhook());
    let bookingId = data.bookingId || data.quoteId || data.quoteRefId;
    console.log('[API_RECORD_BOOKING] Received bookingId:', bookingId, 'webhookUrl:', webhookUrl);

    const csvPath = path.resolve(process.cwd(), 'Kalidass_Operations_Control_2026.csv');

    if (!bookingId) {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      const dateCode = `${dd}${mm}${yy}`;
      const nextSeq = getDailySequence(dateCode) + 1;
      saveDailySequence(dateCode, nextSeq);
      bookingId = `Q-${dateCode}-${nextSeq}`;
    } else {
      // If bookingId matches Q-dateCode-X, ensure server daily sequence records it
      const m = String(bookingId).match(/^Q-(\d{6})-(\d+)$/i);
      if (m) {
        const dateCode = m[1];
        const num = parseInt(m[2], 10);
        if (!isNaN(num) && num > getDailySequence(dateCode)) {
          saveDailySequence(dateCode, num);
        }
      }
    }

    const guestNamePhone = data.phone
      ? `${data.name || 'Guest'} (+91 ${String(data.phone).replace(/[^0-9]/g, '').slice(-10)})`
      : `${data.name || 'Website WhatsApp Lead'} (Phone on WA)`;

    const schedule = data.travelDateTime || `${data.pickupDate || 'Tomorrow'} @ ${data.pickupTime || '06:00 AM'}`;
    const cleanAddress = (data.pickupAddress || data.route || (data.pickup ? `${data.pickup} ➔ ${data.drop || 'Outstation'}` : 'Chennai ➔ Outstation')).replace(/"/g, '""');

    // Vehicle category mapping
    const vLow = (data.vehicle || data.vehicleCategory || '').toLowerCase();
    let vehCat = 'Sedan';
    if (vLow.includes('tempo') || vLow.includes('traveller')) vehCat = 'Tempo';
    else if (vLow.includes('crysta')) vehCat = 'Crysta';
    else if (vLow.includes('innova')) vehCat = 'Innova';
    else if (vLow.includes('ertiga') || vLow.includes('xl6')) vehCat = 'Ertiga';

    const partySize = data.passengers || data.partySize || '4 Seats';
    const fareNum = parseInt(String(data.fare || data.terminalFare || data.estimate || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const advanceNum = parseInt(String(data.advance || data.advancePaid || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const payoutNum = parseInt(String(data.chauffeurPayout || Math.round(fareNum * 0.8)).replace(/[^0-9]/g, ''), 10) || 0;
    const manifestStatus = data.manifestStatus || 'Need Driver';
    const driver = data.assignedChauffeur || 'Unassigned';
    const notes = data.notes || data.metadata || 'Booked via Website WhatsApp';

    // 1. Update/Append local CSV if present
    try {
      if (!fs.existsSync(csvPath)) {
        const header = 'Booking ID,Guest Name & Phone,Travel Date & Pickup Time,Pickup Address,Vehicle Category,Pilgrim Party Size,KYC Status,Darshan Ticket Status,Assigned Chauffeur & Plate,Chauffeur Manifest,Terminal Fare (Guest),Chauffeur Payout,Company Margin,Financial Closure,Review Status\n';
        fs.writeFileSync(csvPath, header, 'utf8');
      }
      const kycVal = advanceNum > 0 ? `Advance Paid: ₹${advanceNum}` : 'Advance Pending';
      const newRow = `${bookingId},${guestNamePhone},${schedule},"${cleanAddress}",${vehCat},${partySize},${kycVal},Unassigned,${driver},${manifestStatus},${fareNum},${payoutNum},${fareNum - payoutNum},Unreconciled,Pending\n`;
      fs.appendFileSync(csvPath, newRow, 'utf8');
    } catch (_) {}

    // 2. Synchronously sync to Google Sheets Webhook (with collision protection)
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        const originalId = bookingId;
        const tripPayload = {
          id: bookingId,
          customerName: data.name || (data.phone ? `Guest (+91 ${String(data.phone).replace(/[^0-9]/g, '').slice(-10)})` : 'Website WhatsApp Lead'),
          phone: String(data.phone || '').replace(/[^0-9]/g, '').slice(-10),
          tripCategory: data.package || data.tripCategory || (cleanAddress.includes('➔') ? 'Outstation' : 'Website Booking'),
          vehicle: data.vehicle || vehCat,
          route: cleanAddress,
          pickupDate: data.pickupDate || new Date().toISOString().split('T')[0],
          pickupTime: data.pickupTime || '06:00 AM',
          pickupLocation: data.pickup || cleanAddress.split('➔')[0]?.trim() || cleanAddress,
          dropLocation: data.drop || cleanAddress.split('➔')[1]?.trim() || '',
          agreedRate: fareNum,
          advance: advanceNum,
          balance: Math.max(0, fareNum - advanceNum),
          driverName: '',
          driverPhone: '',
          vehicleNumber: '',
          manifestStatus: 'Unassigned',
          notes: notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Check existing trips in Google Sheet to prevent overwriting another visitor's quote with the same Q-DDMMYY-X ID
        let alreadySaved = false;
        try {
          const checkRes = await fetch(webhookUrl, { method: 'GET', redirect: 'follow' });
          if (checkRes.ok) {
            const sheetData = await checkRes.json();
            if (sheetData && Array.isArray(sheetData.trips)) {
              const existingRow = sheetData.trips.find((r: any) => String(r.id) === String(tripPayload.id));
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
                  const d = new Date();
                  const fallbackDateCode = `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getFullYear()).slice(-2)}`;
                  const dateCode = idMatch ? idMatch[1] : fallbackDateCode;
                  const seqRegex = new RegExp(`Q-${dateCode}-(\\d+)`, 'gi');
                  let maxSeq = idMatch ? parseInt(idMatch[2], 10) : getDailySequence(dateCode);
                  for (const r of sheetData.trips) {
                    const textToScan = `${r?.id || ''} ${r?.notes || ''}`;
                    let m;
                    seqRegex.lastIndex = 0;
                    while ((m = seqRegex.exec(textToScan)) !== null) {
                      const n = parseInt(m[1], 10);
                      if (!isNaN(n) && n > maxSeq) maxSeq = n;
                    }
                  }
                  const newSeq = maxSeq + 1;
                  saveDailySequence(dateCode, newSeq);
                  bookingId = `Q-${dateCode}-${newSeq}`;
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
              trip: tripPayload,
              // Legacy fallbacks
              type: 'booking',
              bookingId: bookingId,
              guestNamePhone: guestNamePhone,
              travelDateTime: schedule,
              pickupAddress: cleanAddress,
              vehicleCategory: vehCat,
              partySize: partySize,
              terminalFare: fareNum,
              advancePaid: advanceNum,
              chauffeurPayout: payoutNum,
              assignedChauffeur: driver,
              manifestStatus: manifestStatus,
              metadata: tripPayload.notes
            })
          });
        }
      } catch (e: any) {
        console.warn('Google Sheet webhook sync error:', e?.message);
      }
    }

    return new Response(JSON.stringify({ success: true, bookingId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
};
