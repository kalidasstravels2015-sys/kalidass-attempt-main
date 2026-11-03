import type { APIRoute } from 'astro';
import { calculateQuote, type QuoteRequest } from '../../utils/bookingFareCalculator';

export const prerender = false; // Dynamic serverless endpoint

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const service = (params.get('service') || params.get('tab') || 'outstation').toLowerCase();
  const vehicle = params.get('vehicle') || params.get('car') || 'Sedan';
  const dest = params.get('dest') || params.get('destination') || 'pondicherry';
  const pickup = params.get('pickup') || params.get('from') || 'Chennai';
  const days = params.get('days') || '1';
  const type = (params.get('type') || params.get('tripType') || 'round').toLowerCase();
  const pkg = params.get('pkg') || params.get('package') || 'local_4hr_pkg';
  const needGst = params.get('gst') === 'true' || params.get('gst') === '1';
  const airportDirection = (params.get('direction') || 'to_airport') as 'to_airport' | 'from_airport';
  const driverType = params.get('driverType') as any;
  const corporatePkg = params.get('corporatePkg') || undefined;

  const quoteReq: QuoteRequest = {
    service,
    vehicle,
    dest,
    pickup,
    days,
    type,
    pkg,
    needGst,
    airportDirection,
    driverType,
    corporatePkg
  };

  const result = calculateQuote(quoteReq);

  return new Response(JSON.stringify(result, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });
};
