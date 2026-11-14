import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

let devDriverSeq = 1;

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

function getLeadsJsonPath(): string {
  return path.resolve(process.cwd(), 'public', 'uploads', 'driver-leads.json');
}

function readLeadsJson(): any[] {
  try {
    const p = getLeadsJsonPath();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

function writeLeadsJson(leads: any[]) {
  try {
    const p = getLeadsJsonPath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(p, JSON.stringify(leads, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not write driver-leads.json:', err);
  }
}

export const GET: APIRoute = async () => {
  const leads = readLeadsJson();
  return new Response(JSON.stringify({ success: true, leads }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { leadId, status } = body;
    if (!leadId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing leadId' }), { status: 400 });
    }
    const leads = readLeadsJson();
    const updated = leads.map((item) =>
      item.leadId === leadId ? { ...item, status: status || 'Approved', updatedAt: new Date().toISOString() } : item
    );
    writeLeadsJson(updated);
    return new Response(JSON.stringify({ success: true, leads: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    let data: any = {};
    try {
      data = await request.json();
    } catch (_) {
      try {
        const raw = await request.text();
        data = JSON.parse(raw);
      } catch (_) {}
    }

    const existingLeads = readLeadsJson();
    let maxExisting = 0;
    for (const item of existingLeads) {
      const m = String(item?.leadId || '').match(/KT-DRV-(\d+)/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n >= 1 && n <= 9999 && n > maxExisting) {
          maxExisting = n;
        }
      }
    }
    const nextNum = Math.max(devDriverSeq, maxExisting + 1, existingLeads.length + 1);
    devDriverSeq = nextNum + 1;
    const leadId = `#KT-DRV-${nextNum}`;
    const cleanLeadId = leadId.replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const uploadDir = path.resolve(process.cwd(), 'public', 'uploads', 'driver-docs');
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (_) {}
    }

    let dlLocalUrl = '';
    if (data.dlFile?.base64) {
      try {
        const cleanBase64 = data.dlFile.base64.replace(/^data:image\/[a-z]+;base64,/, '');
        const dlFileName = `${cleanLeadId}-DL.jpg`;
        fs.writeFileSync(path.join(uploadDir, dlFileName), Buffer.from(cleanBase64, 'base64'));
        dlLocalUrl = `/uploads/driver-docs/${dlFileName}`;
      } catch (_) {}
    }

    // Process each vehicle in vehicles[] array (or fallback single vehicle)
    const rawVehicles: any[] = Array.isArray(data.vehicles) && data.vehicles.length > 0
      ? data.vehicles
      : data.category === 'Attach Car'
      ? [{
          category: data.vehicleCategory || 'Sedan',
          model: data.cars || 'Swift Dzire',
          plate: data.plate || 'Plate TBD',
          boardType: data.plateType || 'Yellow Board',
          carrier: data.carrier || 'With Carrier',
          rcFile: data.rcFile,
          carFile: data.carFile
        }]
      : [];

    const savedVehicles = rawVehicles.map((v, idx) => {
      const vTag = `V${idx + 1}`;
      let rcUrl = '';
      let carUrl = '';

      if (v.rcFile?.base64) {
        try {
          const cleanB64 = v.rcFile.base64.replace(/^data:image\/[a-z]+;base64,/, '');
          const fName = `${cleanLeadId}-${vTag}-RC.jpg`;
          fs.writeFileSync(path.join(uploadDir, fName), Buffer.from(cleanB64, 'base64'));
          rcUrl = `/uploads/driver-docs/${fName}`;
        } catch (_) {}
      }
      if (v.carFile?.base64) {
        try {
          const cleanB64 = v.carFile.base64.replace(/^data:image\/[a-z]+;base64,/, '');
          const fName = `${cleanLeadId}-${vTag}-CAR.jpg`;
          fs.writeFileSync(path.join(uploadDir, fName), Buffer.from(cleanB64, 'base64'));
          carUrl = `/uploads/driver-docs/${fName}`;
        } catch (_) {}
      }

      return {
        category: v.category || 'Sedan',
        model: v.model || 'Swift Dzire',
        plate: v.plate || 'Plate TBD',
        boardType: v.boardType || 'Yellow Board',
        carrier: v.carrier || 'With Carrier',
        rcUrl,
        carUrl
      };
    });

    const firstRcUrl = savedVehicles[0]?.rcUrl || '';
    const firstCarUrl = savedVehicles[0]?.carUrl || '';

    // Forward to Google Apps Script
    const webhookUrl = (data && data.webhookUrl) || getEnvWebhook();
    let driveFolderUrl = '';

    if (webhookUrl && webhookUrl.startsWith('https://script.google.com/macros/s/')) {
      try {
        const gRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'driver_lead',
            leadId,
            timestamp,
            name: data.name,
            phone: data.phone,
            category: data.category,
            partnerType: data.partnerType || (savedVehicles.length > 1 ? 'Fleet Partner' : data.category === 'Attach Car' ? 'Owner-Driver' : 'Acting Driver'),
            carCount: savedVehicles.length > 0 ? `${savedVehicles.length} Vehicle(s)` : 'Driver Only',
            cars: savedVehicles.map(v => `${v.model} (${v.plate})`).join(', ') || data.cars || '',
            plateType: savedVehicles.map(v => v.boardType).join(', ') || data.plateType || '',
            licenseType: data.licenseType,
            experience: data.experience,
            preferredDuty: data.preferredDuty,
            zone: data.zone || '',
            area: data.area || data.city || '',
            city: data.city || `${data.area || ''} (${data.zone || ''})`,
            notes: data.notes,
            dlFile: data.dlFile,
            rcFile: rawVehicles[0]?.rcFile || data.rcFile,
            carFile: rawVehicles[0]?.carFile || data.carFile
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

    // Save structured record to public/uploads/driver-leads.json for Admin Roster 1-click approval
    const leadRecord = {
      leadId,
      timestamp,
      status: 'Pending',
      name: data.name || '',
      phone: data.phone || '',
      category: data.category || 'Attach Car',
      partnerType: data.partnerType || (savedVehicles.length > 1 ? 'Fleet Partner' : data.category === 'Attach Car' ? 'Owner-Driver' : 'Acting Driver'),
      zone: data.zone || 'South & OMR',
      area: data.area || data.city || 'Medavakkam',
      city: data.city || '',
      licenseType: data.licenseType || 'Commercial Badge',
      experience: data.experience || '3 to 5 Years',
      preferredDuty: data.preferredDuty || 'Outstation Trips',
      dlLocalUrl,
      driveFolderUrl,
      vehicles: savedVehicles,
      notes: data.notes || ''
    };
    writeLeadsJson([leadRecord, ...existingLeads]);

    // Local CSV backup
    const csvPath = path.resolve(process.cwd(), 'Kalidass_Driver_Leads_2026.csv');
    try {
      if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, 'LeadID,Timestamp,Name,Phone,PartnerType,Zone,Area,Vehicles,LicenseType,Experience,DL_Local,RC_Local,Car_Local,GoogleDrive_Folder,Notes\n', 'utf8');
      }
      const vehiclesSummary = savedVehicles.map(v => `${v.model} [${v.plate} | ${v.boardType} | ${v.carrier}]`).join(' ; ');
      const cleanNotes = (data.notes || '').replace(/"/g, '""');
      const row = `${leadId},"${timestamp}","${data.name || ''}","${data.phone || ''}","${leadRecord.partnerType}","${leadRecord.zone}","${leadRecord.area}","${vehiclesSummary}","${data.licenseType || ''}","${data.experience || ''}","${dlLocalUrl}","${firstRcUrl}","${firstCarUrl}","${driveFolderUrl}","${cleanNotes}"\n`;
      fs.appendFileSync(csvPath, row, 'utf8');
    } catch (_) {}

    return new Response(JSON.stringify({
      success: true,
      leadId,
      timestamp,
      dlLocalUrl,
      rcLocalUrl: firstRcUrl,
      carLocalUrl: firstCarUrl,
      driveFolderUrl,
      lead: leadRecord
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
