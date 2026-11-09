import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

let devDriverSeq = 101;

const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzjPh0a2ju-Xv9KRFQ5gCg9s5Y4P8QR9C2rkO4nh4XYBBO5QD-tbKIXWcDav2ydgaUW/exec';

function getEnvWebhook(): string {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf8');
      const match = raw.match(/(?:PUBLIC_)?GOOGLE_SHEET_WEBHOOK_URL=([^\r\n]+)/);
      if (match && match[1]) return match[1].trim();
    }
  } catch (_) {}
  return process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    let data: any = {};
    try {
      data = await request.json();
    } catch (_) {
      try {
        const raw = await request.text();
        data = raw;
      } catch (_) {}
    }
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (_) {}
    }
    const leadId = data.leadId || `#KT-DRV-${devDriverSeq++}`;
    const cleanLeadId = leadId.replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // 1. Save uploaded documents locally in public/uploads/driver-docs/
    const uploadDir = path.resolve(process.cwd(), 'public', 'uploads', 'driver-docs');
    let dlLocalUrl = '';
    let rcLocalUrl = '';

    try {
      if (data.dlFile?.base64 || data.rcFile?.base64) {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
      }

      if (data.dlFile?.base64) {
        const cleanBase64 = data.dlFile.base64.replace(/^data:image\/[a-z]+;base64,/, '');
        const dlFileName = `${cleanLeadId}-DL.jpg`;
        const dlFilePath = path.join(uploadDir, dlFileName);
        fs.writeFileSync(dlFilePath, Buffer.from(cleanBase64, 'base64'));
        dlLocalUrl = `/uploads/driver-docs/${dlFileName}`;
      }

      if (data.rcFile?.base64) {
        const cleanBase64 = data.rcFile.base64.replace(/^data:image\/[a-z]+;base64,/, '');
        const rcFileName = `${cleanLeadId}-RC.jpg`;
        const rcFilePath = path.join(uploadDir, rcFileName);
        fs.writeFileSync(rcFilePath, Buffer.from(cleanBase64, 'base64'));
        rcLocalUrl = `/uploads/driver-docs/${rcFileName}`;
      }
    } catch (saveErr) {
      console.warn('Local document save error:', saveErr);
    }

    // 2. Forward to Google Apps Script (Auto-save in dedicated applicant folder in Google Drive + Google Sheet)
    const webhookUrl = (data && data.webhookUrl) || getEnvWebhook();
    let driveFolderUrl = '';

    if (webhookUrl && webhookUrl.startsWith('https://script.google.com/macros/s/')) {
      try {
        const gRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'driver_lead',
            leadId: leadId,
            timestamp: timestamp,
            name: data.name,
            phone: data.phone,
            category: data.category,
            carCount: data.carCount,
            cars: data.cars,
            plateType: data.plateType,
            licenseType: data.licenseType,
            experience: data.experience,
            preferredDuty: data.preferredDuty,
            city: data.city,
            notes: data.notes,
            dlFile: data.dlFile,
            rcFile: data.rcFile,
            carFile: data.carFile
          })
        });

        if (gRes.ok) {
          const gData = await gRes.json().catch(() => null);
          if (gData && gData.success) {
            driveFolderUrl = gData.driveFolderUrl || '';
          }
        }
      } catch (gErr: any) {
        console.warn('Google Drive/Sheet sync warning:', gErr?.message);
      }
    }

    // 3. Local CSV backup with document links
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Driver_Leads_2026.csv');
    try {
      if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, 'LeadID,Timestamp,Name,Phone,Category,CarCount,Cars,LicenseType,Experience,City,DL_Local,RC_Local,GoogleDrive_Folder,Notes\n', 'utf8');
      }
      const cleanNotes = (data.notes || '').replace(/"/g, '""');
      const row = `${leadId},"${timestamp}","${data.name || ''}","${data.phone || ''}","${data.category || ''}","${data.carCount || ''}","${data.cars || ''}","${data.licenseType || ''}","${data.experience || ''}","${data.city || ''}","${dlLocalUrl}","${rcLocalUrl}","${driveFolderUrl}","${cleanNotes}"\n`;
      fs.appendFileSync(csvPath, row, 'utf8');
    } catch (_) {}

    return new Response(JSON.stringify({
      success: true,
      leadId,
      timestamp,
      dlLocalUrl,
      rcLocalUrl,
      driveFolderUrl
    }), {
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
