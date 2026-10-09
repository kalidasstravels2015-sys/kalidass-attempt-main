import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Calculations_Log_2026.csv');
    if (!fs.existsSync(csvPath)) {
      return new Response(JSON.stringify({ success: true, count: 0, calculations: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) {
      return new Response(JSON.stringify({ success: true, count: 0, calculations: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // Parse CSV rows into objects
    const calculations = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex CSV parse to handle quotes
      const matches = line.match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g);
      if (matches) {
        const row = matches.map(m => {
          let s = m.replace(/^,/, '').trim();
          if (s.startsWith('"') && s.endsWith('"')) {
            s = s.slice(1, -1).replace(/""/g, '"');
          }
          return s;
        });

        calculations.push({
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

    // Return in reverse chronological order (newest first)
    calculations.reverse();

    return new Response(JSON.stringify({ success: true, count: calculations.length, calculations }), {
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
