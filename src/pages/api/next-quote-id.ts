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

const DEFAULT_TRIPS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzyfKwbaG83dNG3EAWf719-UWbWxWpEoBQoRoRbJsHjD-Bx8uKUfytP5Eb2RXaJfgDz/exec';
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

const MONTH_SHORT_UPPER = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function getRefPrefixFromDateCode(dateCode: string): string {
  const dd = dateCode.slice(0, 2);
  const mmIdx = Math.max(0, Math.min(11, parseInt(dateCode.slice(2, 4), 10) - 1));
  return `KT/${dd}${MONTH_SHORT_UPPER[mmIdx] || 'NOV'}/`;
}

async function fetchSheetQuoteSequence(dateCode: string, claim = false): Promise<{ currentSeq: number; nextSeq: number; quoteId: string; claimed: boolean } | null> {
  try {
    const webhookUrl = getTripsWebhookUrl();
    const target = `${webhookUrl}?action=next_quote_id&dateCode=${dateCode}${claim ? '&claim=true' : ''}`;
    const res = await fetch(target, { method: 'GET', redirect: 'follow' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.quoteId) {
        return {
          currentSeq: Number(data.currentSeq || 0),
          nextSeq: Number(data.nextSeq || 1),
          quoteId: String(data.quoteId),
          claimed: Boolean(data.claimed ?? claim)
        };
      }
      if (data && Array.isArray(data.trips)) {
        let maxSeq = 0;
        const qRegex = new RegExp(`Q-${dateCode}-(\\d+)`, 'gi');
        const refPrefix = getRefPrefixFromDateCode(dateCode).replace(/\//g, '\\/');
        const ktRegex = new RegExp(`${refPrefix}0*(\\d+)`, 'gi');
        for (const row of data.trips) {
          const searchStr = `${row?.id || ''} ${row?.quoteRef || ''} ${row?.notes || ''}`;
          let m;
          qRegex.lastIndex = 0;
          while ((m = qRegex.exec(searchStr)) !== null) {
            const val = parseInt(m[1], 10);
            if (!isNaN(val) && val > maxSeq) maxSeq = val;
          }
          ktRegex.lastIndex = 0;
          while ((m = ktRegex.exec(searchStr)) !== null) {
            const val = parseInt(m[1], 10);
            if (!isNaN(val) && val > maxSeq) maxSeq = val;
          }
        }
        return {
          currentSeq: maxSeq,
          nextSeq: maxSeq + 1,
          quoteId: `Q-${dateCode}-${maxSeq + 1}`,
          claimed: false
        };
      }
    }
  } catch (_) {}
  return null;
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
  const claim = url.searchParams.get('claim') === 'true' || url.searchParams.get('advance') === 'true';
  const sheetRes = await fetchSheetQuoteSequence(dateCode, claim);
  const localMax = getDailySequence(dateCode);

  if (sheetRes && sheetRes.claimed) {
    saveDailySequence(dateCode, sheetRes.nextSeq);
    return new Response(JSON.stringify({
      success: true,
      dateCode,
      currentSeq: sheetRes.currentSeq,
      nextSeq: sheetRes.nextSeq,
      quoteId: sheetRes.quoteId,
      claimed: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }

  const currentMax = Math.max(localMax, sheetRes?.currentSeq || 0);
  const nextSeq = currentMax + 1;
  if (claim) {
    saveDailySequence(dateCode, nextSeq);
  }
  const quoteId = `Q-${dateCode}-${nextSeq}`;

  return new Response(JSON.stringify({
    success: true,
    dateCode,
    currentSeq: currentMax,
    nextSeq,
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
  const sheetRes = await fetchSheetQuoteSequence(dateCode, true);
  if (sheetRes && sheetRes.claimed) {
    saveDailySequence(dateCode, sheetRes.nextSeq);
    return new Response(JSON.stringify({
      success: true,
      dateCode,
      seq: sheetRes.nextSeq,
      quoteId: sheetRes.quoteId,
      nextQuoteId: `Q-${dateCode}-${sheetRes.nextSeq + 1}`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }

  const localMax = getDailySequence(dateCode);
  const currentMax = Math.max(localMax, sheetRes?.currentSeq || 0);
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
