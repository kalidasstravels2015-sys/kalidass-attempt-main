import type { APIRoute } from 'astro';
import serviceDetails from '../../data/serviceDetails.json';
import tariffConfig from '../../data/tariff_config.json';
import { getVehicleMetadata } from '../../utils/vehicleMetadata';
import { getAllDrivers } from '../../data/driversData';

export const prerender = true;

export interface SearchIndexItem {
  id: string;
  type: 'package' | 'fleet' | 'driver' | 'tool';
  title: string;
  subtitle: string;
  category: string;
  badge?: string;
  url: string;
  keywords: string;
}

function extractStartingPrice(service: any): string {
  const headers = service.tariff?.headers || [];
  const row = service.tariff?.rows?.[0] || [];

  const totalCostIdx = headers.findIndex((h: string) => /total cost|package cost|flat cost|fare/i.test(h));
  if (totalCostIdx !== -1 && typeof row[totalCostIdx] === 'string' && row[totalCostIdx].includes('₹')) {
    return row[totalCostIdx];
  }

  const rateIdx = headers.findIndex((h: string) => /cost|rate|charges|fare/i.test(h));
  if (rateIdx !== -1 && typeof row[rateIdx] === 'string' && row[rateIdx].includes('₹')) {
    return row[rateIdx];
  }

  const match = row.find((c: any) => typeof c === 'string' && /₹\s*[\d,]+/i.test(c));
  if (match) return match;

  return '';
}

export const GET: APIRoute = async () => {
  const items: SearchIndexItem[] = [];

  // 1. Key Pages & Interactive Tools
  const staticPages: SearchIndexItem[] = [
    {
      id: 'tool-calculator',
      type: 'tool',
      title: 'Outstation & Trip Fare Calculator',
      subtitle: 'Instant distance, toll & cab fare estimate across South India',
      category: 'Tools & Rates',
      badge: 'Instant Quote',
      url: '/calculator/',
      keywords: 'fare calculator estimate price cost distance toll quote km per km',
    },
    {
      id: 'tool-tariff',
      type: 'tool',
      title: 'Cab Tariff & Rate Card (2026)',
      subtitle: 'Sedan ₹14/km, Ertiga ₹18/km, Innova Crysta ₹22/km, Tempo Traveller',
      category: 'Tools & Rates',
      badge: 'From ₹14/km',
      url: '/tariff/',
      keywords: 'tariff rate card price list per km bata minimum km local hourly',
    },
    {
      id: 'tool-fleet',
      type: 'tool',
      title: 'Our Fleet & Vehicle Models',
      subtitle: 'Dzire, Etios, Ertiga, Innova Crysta, 12/17-Seater Tempo Traveller, Urbania',
      category: 'Fleet & Vehicles',
      badge: 'AC Fleet',
      url: '/fleet/',
      keywords: 'fleet cars vehicles cab taxi suv sedan tempo traveller urbania seating luggage',
    },
    {
      id: 'tool-drivers',
      type: 'tool',
      title: 'Verified Chauffeurs & Drivers',
      subtitle: 'Police-verified, highway-experienced drivers with ratings & languages',
      category: 'Drivers',
      badge: 'Verified',
      url: '/drivers/',
      keywords: 'drivers chauffeurs verified experienced tamil english telugu hindi',
    },
    {
      id: 'tool-services',
      type: 'tool',
      title: 'All Cab Services & Tour Packages',
      subtitle: 'Browse all 37+ temple tours, weekend getaways, airport & corporate cabs',
      category: 'Services',
      badge: '37+ Routes',
      url: '/services/',
      keywords: 'all services packages tours browse directory',
    },
    {
      id: 'tool-airport',
      type: 'tool',
      title: 'Chennai Airport Taxi (MAA)',
      subtitle: '24/7 pickup & drop at Domestic/International terminals • 5-min dispatch',
      category: 'Airport Transfers',
      badge: 'From ₹650',
      url: '/services/chennai-airport-taxi/',
      keywords: 'airport taxi maa meenambakkam flight pickup drop terminal',
    },
    {
      id: 'tool-outstation',
      type: 'tool',
      title: 'Outstation Cabs from Chennai',
      subtitle: 'One-way drops & round-trip taxis across Tamil Nadu, AP, Karnataka & Kerala',
      category: 'Outstation Cabs',
      badge: 'From ₹14/km',
      url: '/services/outstation-cabs/',
      keywords: 'outstation cabs one way drop round trip highway intercity',
    },
    {
      id: 'tool-acting-drivers',
      type: 'tool',
      title: 'Acting Drivers (Hire Driver for Your Car)',
      subtitle: 'Hourly, daily & outstation drivers for your personal car in Chennai',
      category: 'Acting Driver Services',
      badge: 'From ₹600',
      url: '/services/acting-drivers/',
      keywords: 'acting driver call driver hire driver own car valet',
    },
    {
      id: 'tool-local-hourly',
      type: 'tool',
      title: 'Local Hourly Cab Rentals (4hr / 8hr / 12hr)',
      subtitle: 'Chennai city shopping, hospital visits, weddings & business meetings',
      category: 'Local Rentals',
      badge: '4h / 8h / 12h',
      url: '/services/local-hourly-cabs/',
      keywords: 'local hourly package rental city cab 4hr 8hr 12hr 40km 80km',
    },
    {
      id: 'tool-tempo',
      type: 'tool',
      title: 'Tempo Traveller Rental Chennai (12, 14, 17, 20 Seater)',
      subtitle: 'Pushback AC coaches for family pilgrimages, weddings & corporate outings',
      category: 'Group Travel',
      badge: '12–20 Seats',
      url: '/services/tempo-traveller-rental-chennai/',
      keywords: 'tempo traveller tt coach minibus group family tour 12 seater 14 seater 17 seater',
    },
    {
      id: 'tool-temple-hub',
      type: 'tool',
      title: 'South India Temple Tour Packages',
      subtitle: 'Tirupati, Navagraha, Sabarimala, Thiruvannamalai, Rameswaram, Kanchipuram',
      category: 'Temple Tours',
      badge: 'Pilgrimage',
      url: '/services/tours/temple-tours/',
      keywords: 'temple tours pilgrimage darshan yatra spiritual',
    },
    {
      id: 'tool-corporate',
      type: 'tool',
      title: 'Corporate Travel & Monthly Fleet',
      subtitle: 'GST invoicing, employee commute, executive airport & client pickups',
      category: 'Corporate Travel',
      badge: 'GST Billing',
      url: '/services/corporate/',
      keywords: 'corporate company monthly cab gst invoice business travel',
    },
  ];
  items.push(...staticPages);

  // 2. All Service & Tour Packages from serviceDetails.json
  for (const s of serviceDetails as any[]) {
    const price = extractStartingPrice(s);
    const routeStops = Array.isArray(s.routePlan)
      ? s.routePlan.map((r: any) => r.stop).join(' ')
      : '';
    items.push({
      id: `pkg-${s.slug}`,
      type: 'package',
      title: s.title,
      subtitle: s.duration || s.overview?.slice(0, 95) || s.category,
      category: s.category || 'Tour Package',
      badge: price || undefined,
      url: `/services/${s.slug}/`,
      keywords: `${s.slug.replace(/-/g, ' ')} ${s.category || ''} ${s.duration || ''} ${routeStops} ${s.overview || ''}`.slice(0, 400),
    });
  }

  // 3. Fleet Vehicles from tariff_config.json
  for (const [model, data] of Object.entries(tariffConfig.vehicles as Record<string, any>)) {
    const meta = getVehicleMetadata(model, data);
    items.push({
      id: `fleet-${model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      type: 'fleet',
      title: model,
      subtitle: `${meta.seatCount} • ${meta.luggage} • ${meta.badge}`,
      category: meta.category || 'Fleet',
      badge: `₹${data.round_trip_rate}/km`,
      url: `/fleet/`,
      keywords: `${model} ${meta.category} ${meta.seatCount} ${meta.badge} ${meta.acType} cab taxi car rental`,
    });
  }

  // 4. Verified Drivers
  for (const d of getAllDrivers()) {
    items.push({
      id: `driver-${d.slug}`,
      type: 'driver',
      title: `${d.name} (${d.experience})`,
      subtitle: `${d.specialty} • ${d.languages} • ★ ${d.rating}`,
      category: 'Verified Driver',
      badge: `${d.trips} trips`,
      url: `/drivers/${d.slug}/`,
      keywords: `${d.name} ${d.specialty} ${d.languages} ${d.tag} driver chauffeur`,
    });
  }

  return new Response(JSON.stringify({ items, generatedAt: new Date().toISOString() }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
