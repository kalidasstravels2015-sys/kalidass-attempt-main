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
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Calculations_Log_2026.csv');
    if (!fs.existsSync(csvPath)) {
      return new Response(JSON.stringify({ success: true, count: 0, leads: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) {
      return new Response(JSON.stringify({ success: true, count: 0, leads: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const leads = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      if (row.length > 0 && row[0]) {
        leads.push({
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
          metadata: row[11] || ''
        });
      }
    }

    // Newest first
    leads.reverse();

    return new Response(JSON.stringify({ success: true, count: leads.length, leads }), {
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
