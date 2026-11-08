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

const STATE_FILE = path.resolve(process.cwd(), 'daily_sequence_state.json');

export function getDailySequence(dateCode: string): number {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (data && typeof data[dateCode] === 'number') {
        return data[dateCode];
      }
    }
  } catch (_) {}

  // Scan Operations CSV for highest ID matching Q-dateCode-X
  try {
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Operations_Control_2026.csv');
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const regex = new RegExp(`Q-${dateCode}-(\\d+)`, 'g');
      let max = 0;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > max) max = n;
      }
      return max;
    }
  } catch (_) {}

  return 0;
}

export function saveDailySequence(dateCode: string, seq: number): void {
  try {
    let state: Record<string, number> = {};
    if (fs.existsSync(STATE_FILE)) {
      try {
        state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) || {};
      } catch (_) {}
    }
    state[dateCode] = seq;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (_) {}
}

export const GET: APIRoute = async () => {
  const dateCode = getDateCode();
  const currentMax = getDailySequence(dateCode);
  const nextSeq = currentMax + 1;
  const quoteId = `Q-${dateCode}-${nextSeq}`;

  return new Response(JSON.stringify({
    success: true,
    dateCode,
    currentSeq: currentMax,
    nextSeq,
    quoteId
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
};

export const POST: APIRoute = async ({ request }) => {
  const dateCode = getDateCode();
  const currentMax = getDailySequence(dateCode);
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
