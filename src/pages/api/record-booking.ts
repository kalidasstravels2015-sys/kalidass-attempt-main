import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Operations_Control_2026.csv');
    let bookingId = data.bookingId;

    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.trim().split(/\r?\n/).filter(Boolean);
      const rowNum = lines.length + 1;

      if (!bookingId) {
        bookingId = `#KT-CAB-${100 + rowNum}`;
      }

      const guestNamePhone = `${data.name || 'Guest'} (+91 ${data.phone || '9840100000'})`;
      const pickupTimeAndDate = `${data.pickupDate || 'Tomorrow'} @ ${data.pickupTime || '04:30 AM'}`;
      const cleanAddress = (data.pickupAddress || 'Chennai').replace(/"/g, '""');

      // Vehicle category mapping
      const vLow = (data.vehicle || '').toLowerCase();
      let vehCat = 'Sedan';
      if (vLow.includes('tempo') || vLow.includes('traveller')) vehCat = 'Tempo';
      else if (vLow.includes('crysta')) vehCat = 'Crysta';
      else if (vLow.includes('innova')) vehCat = 'Innova';
      else if (vLow.includes('ertiga') || vLow.includes('xl6')) vehCat = 'Ertiga';

      const partySize = data.passengers || '4 Pax';
      const fareNum = parseInt(String(data.fare || '').replace(/[^0-9]/g, ''), 10) || 650;
      const payoutNum = Math.round(fareNum * 0.8);

      const newRow = `${bookingId},${guestNamePhone},${pickupTimeAndDate},"${cleanAddress}",${vehCat},${partySize},Pending,Pending,Unassigned,Pending,${fareNum},${payoutNum},=K${rowNum}-L${rowNum},Unreconciled\n`;
      fs.appendFileSync(csvPath, newRow, 'utf8');
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
