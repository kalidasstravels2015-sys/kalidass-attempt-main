import type { APIRoute } from 'astro';
import serviceDetails from '../../data/serviceDetails.json';

export const prerender = true;

export const GET: APIRoute = async () => {
  const routes = serviceDetails.map((s) => ({
    slug: s.slug,
    title: s.title,
    category: s.category,
    origin: (s as any).origin || "Chennai",
    destination: (s as any).destination || "",
    overview: s.overview,
    starting_price_inr: (s as any).tariff?.rows?.[0]?.[1] || "₹14/km",
    canonical_url: `https://kalidasstravels.in/services/${s.slug}/`,
    booking_whatsapp: `https://wa.me/918939539211?text=${encodeURIComponent(s.whatsappMsg || `Hi Kalidass Travels, I would like to book ${s.title}.`)}`
  }));

  return new Response(JSON.stringify({ routes, currency: "INR", site: "https://kalidasstravels.in" }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=86400"
    }
  });
};
