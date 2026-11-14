import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

// 6-digit date string DDMMYY
function getDateCode(d = new Date()): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

const DEFAULT_TRIPS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzpTM1pLXWLF-E80-HAXjj2ghAC_0tvFW1blTJC7rJojqUhTcKIwQz0t-NQMCScN2VA/exec';
const STATE_FILE = path.resolve(process.cwd(), 'daily_sequence_state.json');

function getTripsWebhookUrl(): string {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf8');
      const match = raw.match(/(?:PUBLIC_)?GOOGLE_SHEET_WEBHOOK_URL=([^\r\n]+)/);
      if (match && match[1]) {
        const clean = match[1].trim();
        if (clean.startsWith('http') && !clean.includes('AKfycbzjPh0a2ju')) return clean;
      }
    }
  } catch (_) {}
  const envUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL || '';
  if (envUrl.startsWith('http') && !envUrl.includes('AKfycbzjPh0a2ju')) return envUrl;
  return DEFAULT_TRIPS_WEBHOOK_URL;
}

async function getSheetMaxSequence(dateCode: string): Promise<number> {
  try {
    const webhookUrl = getTripsWebhookUrl();
    const res = await fetch(webhookUrl, { method: 'GET', redirect: 'follow' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.trips)) {
        let maxSeq = 0;
        const regex = new RegExp(`Q-${dateCode}-(\\d+)`, 'gi');
        for (const row of data.trips) {
          const searchStr = `${row?.id || ''} ${row?.notes || ''}`;
          let m;
          regex.lastIndex = 0;
          while ((m = regex.exec(searchStr)) !== null) {
            const val = parseInt(m[1], 10);
            if (!isNaN(val) && val > maxSeq) maxSeq = val;
          }
        }
        return maxSeq;
      }
    }
  } catch (_) {}
  return 0;
}

export function getDailySequence(dateCode: string): number {
  let max = 0;
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (data && typeof data[dateCode] === 'number') {
        max = Math.max(max, data[dateCode]);
      }
    }
  } catch (_) {}

  // Scan Operations CSV for highest ID matching Q-dateCode-X
  try {
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Operations_Control_2026.csv');
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const regex = new RegExp(`Q-${dateCode}-(\\d+)`, 'g');
      let match;
      while ((match = regex.exec(content)) !== null) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > max) max = n;
      }
    }
  } catch (_) {}

  return max;
}

export function saveDailySequence(dateCode: string, seq: number): void {
  try {
    let state: Record<string, number> = {};
    if (fs.existsSync(STATE_FILE)) {
      try {
        state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) || {};
      } catch (_) {}
    }
    state[dateCode] = Math.max(state[dateCode] || 0, seq);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (_) {}
}

export const GET: APIRoute = async ({ url }) => {
  const dateCode = getDateCode();
  const localMax = getDailySequence(dateCode);
  const sheetMax = await getSheetMaxSequence(dateCode);
  const currentMax = Math.max(localMax, sheetMax);
  const claim = url.searchParams.get('claim') === 'true' || url.searchParams.get('advance') === 'true';
  const nextSeq = currentMax + 1;
  if (claim) {
    saveDailySequence(dateCode, nextSeq);
  }
  const quoteId = `Q-${dateCode}-${nextSeq}`;

  return new Response(JSON.stringify({
    success: true,
    dateCode,
    currentSeq: currentMax,
    nextSeq: claim ? nextSeq : nextSeq,
    quoteId,
    claimed: claim
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
};

export const POST: APIRoute = async () => {
  const dateCode = getDateCode();
  const localMax = getDailySequence(dateCode);
  const sheetMax = await getSheetMaxSequence(dateCode);
  const currentMax = Math.max(localMax, sheetMax);
  const newSeq = currentMax + 1;
  saveDailySequence(dateCode, newSeq);
  const quoteId = `Q-${dateCode}-${newSeq}`;

  return new Response(JSON.stringify({
    success: true,
    dateCode,
    seq: newSeq,
    quoteId,
    nextQuoteId: `Q-${dateCode}-${newSeq + 1}`
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
};
