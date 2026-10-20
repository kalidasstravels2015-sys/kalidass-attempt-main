import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

const CALC_HEADER = 'Quote ID,Timestamp,Source Page,Calculator Engine,Trip Type,Pickup Location,Drop Location,Vehicle,Distance (km),Calculated Fare (INR),Status,Metadata\n';
const OPS_HEADER = 'Booking ID,Guest Name & Phone,Travel Date & Pickup Time,Pickup Address,Vehicle Category,Pilgrim Party Size,KYC Status,Darshan Ticket Status,Assigned Chauffeur & Plate,Chauffeur Manifest,Terminal Fare (Guest),Chauffeur Payout,Company Margin,Financial Closure,Review Status\n';
const AI_HEADER = 'QueryId,Timestamp,SessionId,SourcePage,UserQuery,AiResponse,DetectedIntent,CustomerContact,SourceEngine\n';

export const GET: APIRoute = async ({ request, url }) => {
  return handleReset({ request, url });
};

export const POST: APIRoute = async ({ request, url }) => {
  return handleReset({ request, url });
};

async function handleReset({ request, url }: { request: Request; url?: URL }) {
  try {
    let body: any = {};
    try {
      const cloned = request.clone();
      body = await cloned.json();
    } catch (e1) {
      try {
        const text = await request.text();
        if (text) body = JSON.parse(text);
      } catch (e2) {}
    }

    let urlObj: URL | null = null;
    try {
      urlObj = url ? new URL(url.toString()) : new URL(request.url, 'http://localhost');
    } catch (_) {}

    const pin = String(body?.pin || urlObj?.searchParams?.get('pin') || url?.searchParams?.get('pin') || '').trim();
    if (pin !== '2015') {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Invalid Admin PIN' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const cwd = process.cwd();

    // 1. Reset Kalidass_Calculations_Log_2026.csv
    const calcPath = path.resolve(cwd, 'Kalidass_Calculations_Log_2026.csv');
    fs.writeFileSync(calcPath, CALC_HEADER, 'utf8');

    // 2. Reset Kalidass_Operations_Control_2026.csv
    const opsPath = path.resolve(cwd, 'Kalidass_Operations_Control_2026.csv');
    fs.writeFileSync(opsPath, OPS_HEADER, 'utf8');

    // 3. Reset Kalidass_Ai_Chat_Queries_2026.csv
    const aiPath = path.resolve(cwd, 'Kalidass_Ai_Chat_Queries_2026.csv');
    fs.writeFileSync(aiPath, AI_HEADER, 'utf8');

    // 4. Remove / reset JSON documents if any
    const slipsPath = path.resolve(cwd, 'Kalidass_Duty_Slips_2026.json');
    if (fs.existsSync(slipsPath)) {
      try { fs.unlinkSync(slipsPath); } catch (_) {}
    }

    const settlePath = path.resolve(cwd, 'Kalidass_Driver_Settlements_2026.json');
    if (fs.existsSync(settlePath)) {
      try { fs.unlinkSync(settlePath); } catch (_) {}
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'All admin data logs and operations files have been reset to a clean slate.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
};
