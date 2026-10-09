import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

interface DutySlipInput {
  bookingId: string;
  guestName: string;
  guestPhone?: string;
  chauffeurName: string;
  chauffeurPhone?: string;
  vehiclePlate: string;
  vehicleCategory?: string;
  startKm: number;
  endKm: number;
  startTime?: string;
  endTime?: string;
  packageAllowedKm: number;
  extraKmRate: number;
  basePackageFare: number;
  tollsFastag: number;
  parking: number;
  statePermit: number;
  driverBata: number;
  advancePaid: number;
  paymentMode?: string;
  notes?: string;
}

export const GET: APIRoute = async () => {
  try {
    const slipsPath = path.resolve(process.cwd(), 'Kalidass_Duty_Slips_2026.json');
    if (!fs.existsSync(slipsPath)) {
      return new Response(JSON.stringify({ success: true, count: 0, dutySlips: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const content = fs.readFileSync(slipsPath, 'utf8');
    const dutySlips = JSON.parse(content || '[]');

    return new Response(JSON.stringify({ success: true, count: dutySlips.length, dutySlips }), {
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
    const data: DutySlipInput = await request.json();

    const startKm = Number(data.startKm) || 0;
    const endKm = Number(data.endKm) || 0;
    const totalKm = Math.max(0, endKm - startKm);
    const packageAllowedKm = Number(data.packageAllowedKm) || 300;
    const extraKm = Math.max(0, totalKm - packageAllowedKm);
    const extraKmRate = Number(data.extraKmRate) || 14;
    const extraKmCharge = extraKm * extraKmRate;

    const basePackageFare = Number(data.basePackageFare) || 0;
    const tollsFastag = Number(data.tollsFastag) || 0;
    const parking = Number(data.parking) || 0;
    const statePermit = Number(data.statePermit) || 0;
    const driverBata = Number(data.driverBata) || 0;
    const advancePaid = Number(data.advancePaid) || 0;

    const grossFare = basePackageFare + extraKmCharge + tollsFastag + parking + statePermit + driverBata;
    const netBalanceToCollect = Math.max(0, grossFare - advancePaid);

    const slipRecord = {
      slipId: `DS-${data.bookingId.replace(/[^A-Za-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      bookingId: data.bookingId,
      guestName: data.guestName,
      guestPhone: data.guestPhone || '',
      chauffeurName: data.chauffeurName,
      chauffeurPhone: data.chauffeurPhone || '',
      vehiclePlate: data.vehiclePlate,
      vehicleCategory: data.vehicleCategory || 'Sedan',
      startKm,
      endKm,
      totalKm,
      packageAllowedKm,
      extraKm,
      extraKmRate,
      extraKmCharge,
      basePackageFare,
      tollsFastag,
      parking,
      statePermit,
      driverBata,
      advancePaid,
      grossFare,
      netBalanceToCollect,
      paymentMode: data.paymentMode || 'Cash/UPI',
      notes: data.notes || '',
      whatsappSummary: `*KALIDASS TRAVELS — TRIP DUTY SLIP*\nRef: ${data.bookingId}\nGuest: ${data.guestName}\nVehicle: ${data.vehiclePlate} (${data.chauffeurName})\n\nStart KM: ${startKm} | End KM: ${endKm}\nTotal KM: ${totalKm} km (Package: ${packageAllowedKm} km)\nExtra KM: ${extraKm} km @ Rs.${extraKmRate} = Rs.${extraKmCharge}\nBase Package: Rs.${basePackageFare}\nTolls (FASTag): Rs.${tollsFastag}\nPermit/Parking: Rs.${parking + statePermit}\nDriver Bata: Rs.${driverBata}\n---------------------------\n*Total Bill: Rs.${grossFare}*\nAdvance Received: -Rs.${advancePaid}\n*BALANCE TO PAY: Rs.${netBalanceToCollect}*\n\nThank you for choosing Kalidass Travels Chennai!`
    };

    // Save to Kalidass_Duty_Slips_2026.json
    const slipsPath = path.resolve(process.cwd(), 'Kalidass_Duty_Slips_2026.json');
    let existingSlips: any[] = [];
    if (fs.existsSync(slipsPath)) {
      try {
        existingSlips = JSON.parse(fs.readFileSync(slipsPath, 'utf8') || '[]');
      } catch (e) {
        existingSlips = [];
      }
    }

    existingSlips.unshift(slipRecord);
    fs.writeFileSync(slipsPath, JSON.stringify(existingSlips, null, 2), 'utf8');

    return new Response(JSON.stringify({ success: true, dutySlip: slipRecord }), {
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
