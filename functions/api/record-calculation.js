// Cloudflare Pages Function: /api/record-calculation
// Handles POST requests on production and forwards to Google Apps Script Webhook

import { addQuoteToBuffer } from './_quotesBuffer.js';

export async function onRequestPost({ request, env }) {
  try {
    let data = {};
    try {
      data = await request.json();
    } catch (_) {
      try {
        const text = await request.text();
        data = JSON.parse(text);
      } catch (e) {}
    }

    const isEnquiry = data.type === 'enquiry' || data.leadType === 'enquiry';
    const quoteId = data.quoteId || (data.meta && data.meta.quoteRefId) || (isEnquiry ? '#ENQ-101' : '#QT-101');
    const url = new URL(request.url);
    const webhookUrl = url.searchParams.get('webhook') || data.webhookUrl || (env && (env.GOOGLE_SHEET_WEBHOOK_URL || env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL));

    // Store in edge worker memory buffer
    addQuoteToBuffer({
      quoteId,
      timestamp: data.timestamp || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      sourcePage: data.sourcePage || '/services/outstation-cabs/',
      calculatorEngine: data.calculatorEngine || 'Booking Engine',
      tripType: data.tripType || 'Round Trip',
      pickup: data.pickup || 'Chennai',
      drop: data.drop || 'Outstation',
      vehicle: data.vehicle || 'Swift Dzire',
      distanceKm: data.distanceKm || data.distance || 'N/A',
      estimatedFare: Number(data.estimatedFare || data.fare || data.estimate || 0),
      status: data.status || 'Rate Locked',
      metadata: typeof data.meta === 'object' ? JSON.stringify(data.meta) : (data.metadata || '')
    });

    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'calculator_activity',
            quoteId: quoteId,
            date: data.timestamp || new Date().toLocaleString('en-IN'),
            guestName: data.guestName || data.name || '',
            phone: data.phone || data.mobile || '',
            sourcePage: data.sourcePage || '/services/outstation-cabs/',
            calculatorEngine: data.calculatorEngine || 'Booking Engine',
            tripType: data.tripType || 'Round Trip',
            pickup: data.pickup || 'Chennai',
            drop: data.drop || 'Outstation',
            vehicle: data.vehicle || 'Swift Dzire',
            distanceKm: data.distanceKm || data.distance || 'N/A',
            estimatedFare: data.estimatedFare || data.fare || data.estimate || 0,
            status: data.status || 'Rate Locked',
            metadata: typeof data.meta === 'object' ? JSON.stringify(data.meta) : (data.metadata || '')
          })
        });
      } catch (_) {}
    }

    return new Response(JSON.stringify({ success: true, quoteId }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
