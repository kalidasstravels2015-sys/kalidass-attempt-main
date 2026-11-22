import type { APIRoute } from 'astro';

export const prerender = false;

// Automatic logging of website WhatsApp quotations to Live Dispatch is intentionally disabled.
// Confirmed quotations are entered manually via Admin -> New Booking.
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: true,
      skipped: true,
      reason: 'Website lead auto-sync to Live Dispatch is disabled. Use Admin -> New Booking.'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
};
