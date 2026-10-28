import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

const DEFAULT_GOOGLE_SHEET_WEBHOOK = process.env.GOOGLE_SHEET_WEBHOOK_URL || '';

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const targetUrl = url || new URL(request.url);
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

    const webhookUrl = targetUrl.searchParams.get('webhook') || (data && data.webhookUrl) || process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL || DEFAULT_GOOGLE_SHEET_WEBHOOK;
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Calculations_Log_2026.csv');
    let quoteId = data.quoteId || (data.meta && data.meta.quoteRefId);

    const timestamp = data.timestamp || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const sourcePage = (data.sourcePage || '/').replace(/,/g, ' ');
    const calculatorEngine = (data.calculatorEngine || 'Fare Calculator').replace(/,/g, ' ');
    const tripType = (data.tripType || 'Standard').replace(/,/g, ' ');
    const pickup = (data.pickup || 'Chennai').replace(/,/g, ' ').replace(/"/g, '""');
    const drop = (data.drop || 'N/A').replace(/,/g, ' ').replace(/"/g, '""');
    const vehicle = (data.vehicle || 'Standard').replace(/,/g, ' ');
    const distanceKm = data.distanceKm || (data.distance ? String(data.distance) : 'N/A');
    const fareNum = parseInt(String(data.estimatedFare || data.estimate || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const status = data.status || 'Rate Locked';
    let metaObj = data.meta || {};
    if (typeof metaObj === 'string') {
      try { metaObj = JSON.parse(metaObj); } catch (_) { metaObj = {}; }
    }
    if (data.guestName) metaObj.guestName = data.guestName;
    if (data.phone) metaObj.phone = data.phone;
    if (data.travelDate) metaObj.travelDate = data.travelDate;
    if (data.followUpTime) metaObj.followUpTime = data.followUpTime;
    if (data.notes) metaObj.notes = data.notes;

    const hasMetaKeys = Object.keys(metaObj).length > 0;
    const metadata = hasMetaKeys
      ? JSON.stringify(metaObj).replace(/"/g, '""')
      : (data.metadata || 'None');

    const CALC_HEADER = 'Quote ID,Timestamp,Source Page,Calculator Engine,Trip Type,Pickup Location,Drop Location,Vehicle,Distance (km),Calculated Fare (INR),Status,Metadata\n';
    if (!fs.existsSync(csvPath)) {
      try {
        fs.writeFileSync(csvPath, CALC_HEADER, 'utf8');
      } catch (_) {}
    }

    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.trim().split(/\r?\n/).filter(Boolean);
      const rowNum = lines.length;

      // Ensure unique sequential ID if not already unique
      const existingIds = new Set(
        lines.slice(1).map(l => (l.split(',')[0] || '').trim().toUpperCase())
      );

      if (!quoteId || existingIds.has(String(quoteId).trim().toUpperCase())) {
        let prefix = '#QT-';
        if (String(quoteId || '').toUpperCase().startsWith('#ENQ') || data.leadType === 'enquiry' || data.type === 'enquiry' || status.includes('Follow-Up') || status.includes('Quote Sent')) {
          prefix = '#ENQ-';
        } else if (data.leadType === 'call' || status.includes('Call')) {
          prefix = '#CALL-';
        } else if (data.leadType === 'whatsapp' || status.includes('WhatsApp')) {
          prefix = '#WA-';
        }
        let seq = 101;
        while (existingIds.has(`${prefix}${seq}`)) {
          seq++;
        }
        quoteId = `${prefix}${seq}`;
      }

      const cleanDist = String(distanceKm).replace(/"/g, '""');
      const cleanStatus = String(status).replace(/"/g, '""');
      const newRow = `${quoteId},"${timestamp}","${sourcePage}","${calculatorEngine}","${tripType}","${pickup}","${drop}","${vehicle}","${cleanDist}",${fareNum},"${cleanStatus}","${metadata}"\n`;
      fs.appendFileSync(csvPath, newRow, 'utf8');
    }

    // Backup Forwarding to Google Apps Script Webhook asynchronously
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'calculator_activity',
            quoteId,
            date: timestamp,
            guestName: data.guestName || data.name || '',
            phone: data.phone || data.mobile || '',
            sourcePage,
            calculatorEngine,
            tripType,
            pickup,
            drop,
            vehicle,
            distance: distanceKm,
            estimate: fareNum,
            status,
            metadata
          })
        }).catch(() => {});
      } catch (_) {}
    }

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
