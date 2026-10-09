import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

/**
 * Inbound Telephony Webhook for Kalidass Travels
 * Compatible with Exotel, MyOperator, Knowlarity, MCube, Android Call Logger (Tasker/Macrodroid)
 * Automatically captures incoming customer calls so staff cannot miss or omit inquiries.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    let payload: any = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      formData.forEach((val, key) => {
        payload[key] = val;
      });
    } else {
      const text = await request.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }

    // Standardize caller information across common PBX/Android webhook formats
    const callerNumber = payload.caller || payload.CallFrom || payload.From || payload.number || payload.phone || payload.caller_id || 'Unknown Caller';
    const callStatus = payload.status || payload.CallStatus || payload.Direction || 'Incoming Call';
    const callDuration = payload.duration || payload.DialCallDuration || payload.CallDuration || '0';
    const recordingUrl = payload.recording_url || payload.RecordingUrl || '';
    const routeOrNote = payload.notes || payload.route || 'Inbound Office Phone Call';

    const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Calculations_Log_2026.csv');

    let quoteId = `#CALL-REC-${Date.now().toString().slice(-4)}`;

    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.trim().split(/\r?\n/).filter(Boolean);
      const rowNum = lines.length;
      quoteId = `#CALL-IN-${100 + rowNum}`;

      const meta = [
        `Caller: ${callerNumber}`,
        `Duration: ${callDuration}s`,
        recordingUrl ? `Rec: ${recordingUrl}` : null
      ].filter(Boolean).join('; ');

      const newRow = `${quoteId},"${timestamp}","Office Phone Desk","Inbound Telephony","Phone Call","${callerNumber}","${routeOrNote}","Sedan / SUV","N/A",0,"Call Received - Unassigned","${meta}"\n`;
      fs.appendFileSync(csvPath, newRow, 'utf8');
    }

    return new Response(JSON.stringify({
      success: true,
      quoteId,
      message: 'Inbound call logged into Kalidass Operations Tower'
    }), {
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

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    status: 'active',
    endpoint: '/api/admin/call-webhook',
    provider_support: ['Exotel', 'MyOperator', 'Knowlarity', 'MCube', 'Android Tasker Webhook', 'Generic HTTP POST'],
    expected_fields: ['caller / From', 'duration', 'status', 'notes']
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
};
