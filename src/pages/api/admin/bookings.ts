import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

function parseCsvLine(line: string): string[] {
  const matches = line.match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g);
  if (!matches) return [];
  return matches.map(m => {
    let s = m.replace(/^,/, '').trim();
    if (s.startsWith('"') && s.endsWith('"')) {
      s = s.slice(1, -1).replace(/""/g, '"');
    }
    return s;
  });
}

function escapeCsvCell(cell: any): string {
  const str = String(cell ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const GET: APIRoute = async () => {
  try {
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Operations_Control_2026.csv');
    if (!fs.existsSync(csvPath)) {
      return new Response(JSON.stringify({ success: true, count: 0, bookings: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) {
      return new Response(JSON.stringify({ success: true, count: 0, bookings: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const bookings = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      if (row.length > 0 && row[0]) {
        bookings.push({
          bookingId: row[0] || '',
          guestNamePhone: row[1] || '',
          travelDateTime: row[2] || '',
          pickupAddress: row[3] || '',
          vehicleCategory: row[4] || 'Sedan',
          partySize: row[5] || '4 Pax',
          kycStatus: row[6] || 'Pending',
          darshanStatus: row[7] || 'Unassigned',
          assignedChauffeur: row[8] || 'Unassigned',
          manifestStatus: row[9] || 'Pending',
          terminalFare: parseInt(row[10] || '0', 10) || 0,
          chauffeurPayout: parseInt(row[11] || '0', 10) || 0,
          companyMargin: parseInt(row[12] || '0', 10) || ((parseInt(row[10] || '0', 10) || 0) - (parseInt(row[11] || '0', 10) || 0)),
          financialClosure: row[13] || 'Unreconciled'
        });
      }
    }

    return new Response(JSON.stringify({ success: true, count: bookings.length, bookings }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Operations_Control_2026.csv');

    if (!fs.existsSync(csvPath)) {
      const header = 'Booking ID,Guest Name & Phone,Travel Date & Pickup Time,Pickup Address,Vehicle Category,Pilgrim Party Size,KYC Status,Darshan Ticket Status,Assigned Chauffeur & Plate,Chauffeur Manifest,Terminal Fare (Guest),Chauffeur Payout,Company Margin,Financial Closure\n';
      fs.writeFileSync(csvPath, header, 'utf8');
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split(/\r?\n/).filter(Boolean);

    // If updating an existing booking
    if (data.action === 'update' && data.bookingId) {
      let updated = false;
      const newLines = lines.map((line, idx) => {
        if (idx === 0) return line;
        const row = parseCsvLine(line);
        if (row[0] === data.bookingId) {
          updated = true;
          const updatedRow = [
            row[0], // Booking ID
            data.guestNamePhone !== undefined ? data.guestNamePhone : row[1],
            data.travelDateTime !== undefined ? data.travelDateTime : row[2],
            data.pickupAddress !== undefined ? data.pickupAddress : row[3],
            data.vehicleCategory !== undefined ? data.vehicleCategory : row[4],
            data.partySize !== undefined ? data.partySize : row[5],
            data.kycStatus !== undefined ? data.kycStatus : row[6],
            data.darshanStatus !== undefined ? data.darshanStatus : row[7],
            data.assignedChauffeur !== undefined ? data.assignedChauffeur : row[8],
            data.manifestStatus !== undefined ? data.manifestStatus : row[9],
            data.terminalFare !== undefined ? data.terminalFare : row[10],
            data.chauffeurPayout !== undefined ? data.chauffeurPayout : row[11],
            data.companyMargin !== undefined ? data.companyMargin : row[12],
            data.financialClosure !== undefined ? data.financialClosure : row[13]
          ];
          return updatedRow.map(escapeCsvCell).join(',');
        }
        return line;
      });

      if (updated) {
        fs.writeFileSync(csvPath, newLines.join('\n') + '\n', 'utf8');
        return new Response(JSON.stringify({ success: true, bookingId: data.bookingId, action: 'updated' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    }

    // Creating new booking
    const rowNum = lines.length + 1;
    const bookingId = data.bookingId || `#KT-BOOK-${100 + rowNum}`;
    const guestNamePhone = data.guestNamePhone || `${data.name || 'Guest'} (+91 ${data.phone || '9840100000'})`;
    const travelDateTime = data.travelDateTime || `${data.pickupDate || 'Today'} @ ${data.pickupTime || '04:30 AM'}`;
    const pickupAddress = data.pickupAddress || data.pickup || 'Chennai';
    const vehicleCategory = data.vehicleCategory || data.vehicle || 'Sedan';
    const partySize = data.partySize || data.passengers || '4 Pax';
    const kycStatus = data.kycStatus || 'Pending';
    const darshanStatus = data.darshanStatus || 'Unassigned';
    const assignedChauffeur = data.assignedChauffeur || 'Unassigned';
    const manifestStatus = data.manifestStatus || 'Pending';
    const terminalFare = parseInt(String(data.terminalFare || data.fare || '650').replace(/[^0-9]/g, ''), 10) || 650;
    const chauffeurPayout = parseInt(String(data.chauffeurPayout || Math.round(terminalFare * 0.8)).replace(/[^0-9]/g, ''), 10) || Math.round(terminalFare * 0.8);
    const companyMargin = terminalFare - chauffeurPayout;
    const financialClosure = data.financialClosure || 'Unreconciled';

    const newRow = [
      bookingId,
      guestNamePhone,
      travelDateTime,
      pickupAddress,
      vehicleCategory,
      partySize,
      kycStatus,
      darshanStatus,
      assignedChauffeur,
      manifestStatus,
      terminalFare,
      chauffeurPayout,
      companyMargin,
      financialClosure
    ].map(escapeCsvCell).join(',');

    fs.appendFileSync(csvPath, newRow + '\n', 'utf8');

    return new Response(JSON.stringify({ success: true, bookingId, action: 'created' }), {
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
