import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import baseTariffConfig from '../../../data/tariff_config.json';

export const prerender = false;

const tariffFilePath = path.resolve(process.cwd(), 'src/data/tariff_config.json');

export const GET: APIRoute = async () => {
  try {
    if (fs.existsSync(tariffFilePath)) {
      const raw = fs.readFileSync(tariffFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return new Response(JSON.stringify({ ok: true, tariff: parsed }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ ok: true, tariff: baseTariffConfig }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || 'Failed to read Master Tariff config' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const updatedTariff = body?.tariff || body;

    if (!updatedTariff || typeof updatedTariff !== 'object' || !updatedTariff.vehicles || !updatedTariff.state_permits) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid Master Tariff payload: missing vehicles or state_permits' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const finalPayload = {
      ...updatedTariff,
      meta: {
        ...(updatedTariff.meta || {}),
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    };

    try {
      fs.writeFileSync(tariffFilePath, JSON.stringify(finalPayload, null, 2) + '\n', 'utf-8');
      return new Response(
        JSON.stringify({
          ok: true,
          persistedToDisk: true,
          message: 'Master Tariff saved to src/data/tariff_config.json',
          tariff: finalPayload
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (writeErr: any) {
      // Serverless / read-only filesystem fallback — client still persists to localStorage override
      return new Response(
        JSON.stringify({
          ok: true,
          persistedToDisk: false,
          message: 'Saved in active browser session (read-only server environment)',
          tariff: finalPayload
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || 'Failed to save Master Tariff' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
