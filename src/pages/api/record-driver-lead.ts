import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

let devDriverSeq = 101;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const leadId = data.leadId || `#KT-DRV-${devDriverSeq++}`;
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Optional local CSV backup if present
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Driver_Leads_2026.csv');
    try {
      if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, 'LeadID,Timestamp,Name,Phone,Category,CarCount,Cars,LicenseType,Experience,City,Notes\n', 'utf8');
      }
      const cleanNotes = (data.notes || '').replace(/"/g, '""');
      const row = `${leadId},"${timestamp}","${data.name || ''}","${data.phone || ''}","${data.category || ''}","${data.carCount || ''}","${data.cars || ''}","${data.licenseType || ''}","${data.experience || ''}","${data.city || ''}","${cleanNotes}"\n`;
      fs.appendFileSync(csvPath, row, 'utf8');
    } catch (_) {}

    return new Response(JSON.stringify({ success: true, leadId, timestamp }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
};
