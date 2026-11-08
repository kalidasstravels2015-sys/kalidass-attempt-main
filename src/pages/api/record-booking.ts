import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { getDailySequence, saveDailySequence } from './next-quote-id';

export const prerender = false;

function getEnvWebhook(): string {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf8');
      const match = raw.match(/(?:PUBLIC_)?GOOGLE_SHEET_WEBHOOK_URL=([^\r\n]+)/);
      if (match && match[1]) return match[1].trim();
    }
  } catch (_) {}
  return process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL || '';
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
    const webhookUrl = targetUrl.searchParams.get('webhook') || (data && data.webhookUrl) || getEnvWebhook();
    console.log('[API_RECORD_BOOKING] Received bookingId:', bookingId, 'webhookUrl:', webhookUrl);

    let bookingId = data.bookingId || data.quoteId || data.quoteRefId;
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

    // 2. Synchronously or fire-and-forget sync to Google Sheets Webhook
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        const tripPayload = {
          id: bookingId,
          customerName: data.name || (data.phone ? `Guest (+91 ${String(data.phone).replace(/[^0-9]/g, '').slice(-10)})` : 'Website Guest'),
          phone: String(data.phone || '').replace(/[^0-9]/g, '').slice(-10),
          tripCategory: data.package || (cleanAddress.includes('➔') ? 'Outstation' : 'Website Booking'),
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
            metadata: notes
          })
        });
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
