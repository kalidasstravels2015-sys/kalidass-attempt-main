import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

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

    let bookingId = data.bookingId || data.quoteId || data.quoteRefId;
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Operations_Control_2026.csv');

    if (!bookingId) {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      const rowCount = fs.existsSync(csvPath) ? fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/).length : 1;
      bookingId = `Q-${dd}${mm}${yy}-${100 + rowCount}`;
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
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
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
