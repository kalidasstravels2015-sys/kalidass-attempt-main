import type { APIRoute } from 'astro';
import serviceDetails from '../../data/serviceDetails.json';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

export const prerender = true;

function extractStartingPrice(service: any): string {
  const headers = service.tariff?.headers || [];
  const row = service.tariff?.rows?.[0] || [];
  
  const totalCostIdx = headers.findIndex((h: string) => /total cost|package cost|flat cost|fare/i.test(h));
  if (totalCostIdx !== -1 && row[totalCostIdx] && typeof row[totalCostIdx] === 'string' && row[totalCostIdx].includes('₹')) {
    return row[totalCostIdx];
  }
  
  const rateIdx = headers.findIndex((h: string) => /cost|rate|charges|fare/i.test(h));
  if (rateIdx !== -1 && row[rateIdx] && typeof row[rateIdx] === 'string' && row[rateIdx].includes('₹')) {
    return row[rateIdx];
  }
  
  const match = row.find((c: any) => typeof c === 'string' && /₹\s*[\d,]+/i.test(c));
  if (match) return match;
  
  return '₹14/km';
}

export const GET: APIRoute = async () => {
  const routes = serviceDetails.map((s) => ({
    slug: s.slug,
    title: s.title,
    category: s.category,
    origin: (s as any).origin || "Chennai",
    destination: (s as any).destination || "",
    overview: s.overview,
    starting_price_inr: extractStartingPrice(s),
    canonical_url: `https://kalidasstravels.in/services/${s.slug}/`,
    booking_whatsapp: buildWhatsAppUrl(s.whatsappMsg || `Hi Kalidass Travels, I would like to book ${s.title}.`)
  }));

  return new Response(JSON.stringify({ routes, currency: "INR", site: "https://kalidasstravels.in" }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=86400"
    }
  });
};
