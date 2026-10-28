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

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const targetUrl = url || new URL(request.url);
    const actionQuery = (request.headers.get('x-action') || targetUrl.searchParams.get('action') || '').trim().toLowerCase();
    const quoteIdQuery = (request.headers.get('x-quote-id') || targetUrl.searchParams.get('quoteId') || targetUrl.searchParams.get('id') || targetUrl.searchParams.get('ref') || '').trim();
    const customWebhook = targetUrl.searchParams.get('webhook') || process.env.GOOGLE_SHEET_WEBHOOK_URL;
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Calculations_Log_2026.csv');

    // Handle Delete / Cancel enquiry
    if (actionQuery === 'delete' || actionQuery === 'cancel') {
      if (quoteIdQuery && fs.existsSync(csvPath)) {
        const targetLower = quoteIdQuery.toLowerCase();
        const content = fs.readFileSync(csvPath, 'utf8');
        const lines = content.trim().split(/\r?\n/).filter(Boolean);
        if (lines.length > 0) {
          const header = lines[0];
          const remaining = [header];
          for (let i = 1; i < lines.length; i++) {
            const m = lines[i].match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g);
            const row0 = m ? m[0].replace(/^,/, '').replace(/^"|"$/g, '').trim().toLowerCase() : '';
            if (row0 !== targetLower) {
              remaining.push(lines[i]);
            }
          }
          fs.writeFileSync(csvPath, remaining.join('\n') + '\n', 'utf8');
        }
      }

      if (customWebhook && customWebhook.startsWith('http')) {
        try {
          await fetch(customWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              type: 'admin_lead_sync',
              action: 'delete',
              quoteId: quoteIdQuery,
              status: 'Cancelled'
            })
          });
        } catch (_) {}
      }

      return new Response(JSON.stringify({ success: true, quoteId: quoteIdQuery, action: 'deleted' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    let remoteLeads: any[] = [];
    let remoteQuotes: any[] = [];

    // 1. Fetch from Google Apps Script Webhook if configured
    if (customWebhook && customWebhook.startsWith('http')) {
      try {
        const remoteRes = await fetch(customWebhook, {
          method: 'GET',
          redirect: 'follow',
          headers: { 'Accept': 'application/json' }
        });
        if (remoteRes.ok) {
          const remoteJson = await remoteRes.json();
          if (remoteJson && remoteJson.success && Array.isArray(remoteJson.leads)) {
            remoteLeads = remoteJson.leads.filter((l: any) => l && l.status !== 'Cancelled' && l.status !== 'Deleted');
            remoteQuotes = (remoteJson.calculatorQuotes || remoteJson.leads).filter((q: any) => q && q.status !== 'Cancelled' && q.status !== 'Deleted');
          }
        }
      } catch (remoteErr: any) {
        console.warn('Google Sheet Sync fetch notice:', remoteErr.message);
      }
    }

    const actionableLeads: any[] = [...remoteLeads];
    const browsedLeads: any[] = [...remoteQuotes];

    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.trim().split(/\r?\n/).filter(Boolean);

      for (let i = lines.length - 1; i >= 1; i--) {
        const row = parseCsvLine(lines[i]);
        if (row.length > 0 && row[0]) {
          const rawMeta = row[11] || '';
          let parsedMeta: any = {};
          if (rawMeta && rawMeta !== 'None' && rawMeta.startsWith('{')) {
            try {
              parsedMeta = JSON.parse(rawMeta);
            } catch (_) {}
          }
          const item: any = {
            quoteId: row[0] || '',
            timestamp: row[1] || '',
            sourcePage: row[2] || '',
            calculatorEngine: row[3] || '',
            tripType: row[4] || '',
            pickup: row[5] || '',
            drop: row[6] || '',
            vehicle: row[7] || '',
            distanceKm: row[8] || '',
            estimatedFare: parseInt(row[9] || '0', 10) || 0,
            status: row[10] || 'Browsed',
            metadata: rawMeta,
            guestName: parsedMeta.guestName || '',
            phone: parsedMeta.phone || '',
            travelDate: parsedMeta.travelDate || '',
            followUpTime: parsedMeta.followUpTime || '',
            notes: parsedMeta.notes || ''
          };
          const isManualLead = item.quoteId.startsWith('#ENQ') || item.quoteId.startsWith('#CALL') || item.quoteId.startsWith('#WA') || Boolean(item.phone || item.guestName);
          const isAnonymousZeroClick =
            !isManualLead && (
              item.estimatedFare <= 0 ||
              item.drop.toLowerCase().includes('whatsapp chat') ||
              item.pickup.toLowerCase().includes('tariff card') ||
              item.pickup.toLowerCase().includes('best cabs & temple tours') ||
              item.pickup.toLowerCase().includes('outstation cabs from chennai') ||
              item.pickup.toLowerCase().includes('airport taxi & cab booking')
            );

          if (isAnonymousZeroClick) {
            continue;
          }

          // Avoid duplicates if already present in remote leads
          const exists = actionableLeads.some(l => l.quoteId === item.quoteId);
          if (!exists) {
            const hasPhone = /[6-9]\d{9}/.test(`${item.phone} ${item.sourcePage} ${item.pickup} ${item.drop} ${item.metadata}`);
            const statusLower = (item.status || '').toLowerCase();
            const isConfirmedContact = isManualLead || hasPhone || 
              statusLower.includes('advance') ||
              statusLower.includes('follow-up') ||
              statusLower.includes('quote sent');
            if (isConfirmedContact) {
              actionableLeads.push(item);
            } else {
              browsedLeads.push(item);
            }
          }
        }
      }
    }

    const leads = actionableLeads;
    const allCalculations = [...actionableLeads, ...browsedLeads].filter(item => 
      Number(item.estimatedFare) > 0 ||
      item.quoteId.startsWith('#KT') ||
      item.quoteId.startsWith('#CALC') || 
      item.status === 'Browsed' || 
      (item.status || '').toLowerCase().includes('rate locked') ||
      (item.status || '').toLowerCase().includes('whatsapp')
    );

    return new Response(JSON.stringify({
      success: true,
      count: leads.length,
      leads,
      calculatorQuotes: allCalculations,
      allQuotes: [...actionableLeads, ...browsedLeads],
      allCount: actionableLeads.length + browsedLeads.length,
      syncedWithRemote: remoteLeads.length > 0
    }), {
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
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Calculations_Log_2026.csv');
    if (!fs.existsSync(csvPath)) {
      return new Response(JSON.stringify({ error: 'Log file not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split(/\r?\n/).filter(Boolean);

    // Handle Delete / Cancel enquiry in POST
    if (data.action === 'delete' || data.action === 'cancel' || data.status === 'Cancelled' || data.status === 'Deleted') {
      const targetQuoteId = (data.quoteId || '').trim();
      const targetLower = targetQuoteId.toLowerCase();
      if (targetQuoteId && lines.length > 0) {
        const remainingLines = [lines[0]];
        for (let i = 1; i < lines.length; i++) {
          const m = lines[i].match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g);
          const row0 = m ? m[0].replace(/^,/, '').replace(/^"|"$/g, '').trim().toLowerCase() : '';
          if (row0 !== targetLower) {
            remainingLines.push(lines[i]);
          }
        }
        fs.writeFileSync(csvPath, remainingLines.join('\n') + '\n', 'utf8');
      }

      const customWebhook = process.env.GOOGLE_SHEET_WEBHOOK_URL;
      if (customWebhook && customWebhook.startsWith('http')) {
        try {
          await fetch(customWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              type: 'admin_lead_sync',
              action: 'delete',
              quoteId: targetQuoteId,
              status: 'Cancelled'
            })
          });
        } catch (_) {}
      }

      return new Response(JSON.stringify({ success: true, quoteId: targetQuoteId, action: 'deleted' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    let updated = false;
    const newLines = lines.map((line, idx) => {
      if (idx === 0) return line;
      const row = parseCsvLine(line);
      if (row[0] === data.quoteId) {
        updated = true;
        const updatedRow = [
          row[0], // Quote ID
          row[1], // Timestamp
          row[2], // Source Page
          row[3], // Calculator Engine
          row[4], // Trip Type
          row[5], // Pickup
          row[6], // Drop
          row[7], // Vehicle
          row[8], // Distance
          row[9], // Fare
          data.status || row[10], // New status
          data.metadata !== undefined ? data.metadata : row[11] // Updated metadata
        ];
        return updatedRow.map(escapeCsvCell).join(',');
      }
      return line;
    });

    if (updated) {
      fs.writeFileSync(csvPath, newLines.join('\n') + '\n', 'utf8');
      return new Response(JSON.stringify({ success: true, quoteId: data.quoteId, status: data.status }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    return new Response(JSON.stringify({ error: 'Quote ID not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
};
