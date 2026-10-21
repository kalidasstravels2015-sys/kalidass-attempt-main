import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

let inMemoryWebhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL || '';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    success: true,
    webhookUrl: inMemoryWebhookUrl
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const clean = (data.webhookUrl || '').trim();
    inMemoryWebhookUrl = clean;

    // In local development, also persist to .env if possible
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GOOGLE_SHEET_WEBHOOK_URL=')) {
          envContent = envContent.replace(/GOOGLE_SHEET_WEBHOOK_URL=.*(\r?\n|$)/, `GOOGLE_SHEET_WEBHOOK_URL=${clean}\n`);
        } else {
          envContent += `\nGOOGLE_SHEET_WEBHOOK_URL=${clean}\n`;
        }
        if (envContent.includes('PUBLIC_GOOGLE_SHEET_WEBHOOK_URL=')) {
          envContent = envContent.replace(/PUBLIC_GOOGLE_SHEET_WEBHOOK_URL=.*(\r?\n|$)/, `PUBLIC_GOOGLE_SHEET_WEBHOOK_URL=${clean}\n`);
        } else {
          envContent += `PUBLIC_GOOGLE_SHEET_WEBHOOK_URL=${clean}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (_) {}

    return new Response(JSON.stringify({
      success: true,
      webhookUrl: inMemoryWebhookUrl
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
};
