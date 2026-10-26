import type { APIRoute } from 'astro';
import { processQuoteAssistant } from '../../lib/quoteAssistantEngine';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (_) {
      try {
        const rawBody = await request.text();
        if (rawBody && rawBody.trim()) {
          body = JSON.parse(rawBody);
        }
      } catch (_) {}
    }

    const result = await processQuoteAssistant(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Calculation failed'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      }
    );
  }
};
