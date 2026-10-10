// Cloudflare Pages Function: /api/admin/bookings
const SEED_BOOKINGS = [
  {
    bookingId: '#KT-TPT-101',
    guestNamePhone: 'Senthil Nathan (+91 98401 22334)',
    travelDateTime: 'Tomorrow @ 04:30 AM',
    pickupAddress: 'T. Nagar, Chennai',
    vehicleCategory: 'Innova Crysta',
    partySize: '6 Pax',
    kycStatus: 'Verified',
    darshanStatus: 'Assigned',
    assignedChauffeur: 'Perumal Manikumar - TN09 CZ 9999',
    manifestStatus: 'Dispatched',
    terminalFare: 10000,
    chauffeurPayout: 8000,
    companyMargin: 2000,
    financialClosure: 'Unreconciled'
  },
  {
    bookingId: '#KT-TPT-102',
    guestNamePhone: 'Ravi Shankar (+91 97890 55443)',
    travelDateTime: '12-Oct-2026 @ 05:00 AM',
    pickupAddress: 'Anna Nagar West, Chennai',
    vehicleCategory: 'Sedan (Dzire / Etios)',
    partySize: '4 Pax',
    kycStatus: 'Pending',
    darshanStatus: 'Unassigned',
    assignedChauffeur: 'Unassigned',
    manifestStatus: 'Pending',
    terminalFare: 6000,
    chauffeurPayout: 4800,
    companyMargin: 1200,
    financialClosure: 'Unreconciled'
  },
  {
    bookingId: '#KT-PND-103',
    guestNamePhone: 'Anand Krishnan (+91 98410 77665)',
    travelDateTime: 'Today @ 06:00 AM',
    pickupAddress: 'Adyar, Chennai',
    vehicleCategory: 'Ertiga (6 Pax)',
    partySize: '5 Pax',
    kycStatus: 'Verified',
    darshanStatus: 'N/A',
    assignedChauffeur: 'Selvam - TN11 CY 5678',
    manifestStatus: 'In Transit',
    terminalFare: 5500,
    chauffeurPayout: 4400,
    companyMargin: 1100,
    financialClosure: 'Unreconciled'
  }
];

export async function onRequestGet() {
  return new Response(JSON.stringify({ success: true, count: SEED_BOOKINGS.length, bookings: SEED_BOOKINGS }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPost({ request }) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}

    return new Response(JSON.stringify({ success: true, booking: body }), {
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
