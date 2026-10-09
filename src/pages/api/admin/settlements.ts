import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const settlePath = path.resolve(process.cwd(), 'Kalidass_Driver_Settlements_2026.json');
    if (!fs.existsSync(settlePath)) {
      return new Response(JSON.stringify({ success: true, count: 0, settlements: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const content = fs.readFileSync(settlePath, 'utf8');
    const settlements = JSON.parse(content || '[]');

    return new Response(JSON.stringify({ success: true, count: settlements.length, settlements }), {
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

    const guestCashCollected = Number(data.guestCashCollected) || 0;
    const driverAgreedPayout = Number(data.driverAgreedPayout) || 0;
    const tollsPaidByDriver = Number(data.tollsPaidByDriver) || 0;

    // Formula: What driver collected minus what driver is owed
    // Positive: Driver collected more than their share, driver must pay office
    // Negative: Driver collected less than their share, office must pay driver
    const netOfficeReceivable = guestCashCollected - (driverAgreedPayout + tollsPaidByDriver);

    const record = {
      settlementId: `SETTLE-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      bookingId: data.bookingId || '',
      chauffeurName: data.chauffeurName || 'Unassigned',
      guestCashCollected,
      driverAgreedPayout,
      tollsPaidByDriver,
      netOfficeReceivable,
      settlementStatus: data.settlementStatus || 'Settled (UPI)',
      paymentMode: data.paymentMode || 'UPI',
      upiRef: data.upiRef || '',
      notes: data.notes || ''
    };

    const settlePath = path.resolve(process.cwd(), 'Kalidass_Driver_Settlements_2026.json');
    let settlements: any[] = [];
    if (fs.existsSync(settlePath)) {
      try {
        settlements = JSON.parse(fs.readFileSync(settlePath, 'utf8') || '[]');
      } catch (e) {
        settlements = [];
      }
    }

    settlements.unshift(record);
    fs.writeFileSync(settlePath, JSON.stringify(settlements, null, 2), 'utf8');

    return new Response(JSON.stringify({ success: true, settlement: record }), {
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
