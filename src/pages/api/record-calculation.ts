import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

const GOOGLE_SHEET_WEBHOOK = 'https://script.google.com/macros/s/AKfycbwoEpKqa3Qg-DIvMe06pGUgGLlC_0vJQev61nzIh9ssh1-uHZ5VtYkGzpMVwhEyi7tvEQ/exec';

export const POST: APIRoute = async ({ request }) => {
  try {
    let data: any;
    try {
      data = await request.json();
    } catch (_) {
      try {
        const raw = await request.text();
        data = JSON.parse(raw);
      } catch (e) {
        data = {};
      }
    }

    const csvPath = path.resolve(process.cwd(), 'Kalidass_Calculations_Log_2026.csv');
    let quoteId = data.quoteId;

    const timestamp = data.timestamp || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const sourcePage = (data.sourcePage || '/').replace(/,/g, ' ');
    const calculatorEngine = (data.calculatorEngine || 'Fare Calculator').replace(/,/g, ' ');
    const tripType = (data.tripType || 'Standard').replace(/,/g, ' ');
    const pickup = (data.pickup || 'Chennai').replace(/,/g, ' ').replace(/"/g, '""');
    const drop = (data.drop || 'N/A').replace(/,/g, ' ').replace(/"/g, '""');
    const vehicle = (data.vehicle || 'Standard').replace(/,/g, ' ');
    const distanceKm = data.distanceKm || (data.distance ? String(data.distance) : 'N/A');
    const fareNum = parseInt(String(data.estimatedFare || data.estimate || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const status = data.status || 'Browsed';
    const metadata = (data.meta ? JSON.stringify(data.meta).replace(/,/g, ';').replace(/"/g, '') : (data.metadata || 'None'));

    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.trim().split(/\r?\n/).filter(Boolean);
      const rowNum = lines.length;

      if (!quoteId) {
        if (data.leadType === 'call' || status.includes('Call')) {
          quoteId = `#CALL-${100 + rowNum}`;
        } else if (data.leadType === 'whatsapp' || status.includes('WhatsApp')) {
          quoteId = `#WA-${100 + rowNum}`;
        } else {
          quoteId = `#CALC-${100 + rowNum}`;
        }
      }

      const cleanDist = String(distanceKm).replace(/"/g, '""');
      const cleanStatus = String(status).replace(/"/g, '""');
      const newRow = `${quoteId},"${timestamp}","${sourcePage}","${calculatorEngine}","${tripType}","${pickup}","${drop}","${vehicle}","${cleanDist}",${fareNum},"${cleanStatus}","${metadata}"\n`;
      fs.appendFileSync(csvPath, newRow, 'utf8');
    }

    // Backup Forwarding to Google Apps Script Webhook asynchronously
    try {
      fetch(GOOGLE_SHEET_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          type: 'calculator_activity',
          quoteId,
          date: timestamp,
          sourcePage,
          calculatorEngine,
          tripType,
          pickup,
          drop,
          vehicle,
          distance: distanceKm,
          estimate: fareNum,
          status,
        })
      }).catch(() => {});
    } catch (_) {}

    return new Response(JSON.stringify({ success: true, quoteId }), {
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
