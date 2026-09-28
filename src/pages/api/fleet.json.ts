import type { APIRoute } from 'astro';
import tariffConfig from '../../data/tariff_config.json';

export const prerender = true;

const fleetDetails: Record<string, { category: string; seats: number; luggage_capacity: string; ac_type: string; best_for: string }> = {
  "Swift Dzire": {
    category: "Sedan",
    seats: 4,
    luggage_capacity: "2 medium suitcases + 2 handbags",
    ac_type: "Dual Zone AC",
    best_for: "Airport transfers, business transits, couple weekend trips"
  },
  "Toyota Etios": {
    category: "Sedan",
    seats: 4,
    luggage_capacity: "2 medium suitcases + 2 handbags",
    ac_type: "Standard AC",
    best_for: "City duty, outstation day packages"
  },
  "Maruti Ertiga": {
    category: "Compact MPV",
    seats: 6,
    luggage_capacity: "3 medium suitcases",
    ac_type: "Dual AC with rear vents",
    best_for: "Small families, 5-6 pax temple tours"
  },
  "Innova": {
    category: "Premium MPV",
    seats: 7,
    luggage_capacity: "4 suitcases",
    ac_type: "Dual AC with roof vents",
    best_for: "Family pilgrimages, Tirupati Balaji tours"
  },
  "Innova Crysta": {
    category: "Luxury MPV",
    seats: 7,
    luggage_capacity: "5 large suitcases",
    ac_type: "Automatic climate control",
    best_for: "VIP corporate transfers, hill station travel (Munnar/Ooty)"
  },
  "Tempo Traveller 12": {
    category: "Group Van",
    seats: 12,
    luggage_capacity: "Dedicated rear luggage boot",
    ac_type: "High-capacity dual blower AC",
    best_for: "Navagraha temple circuits, family reunions"
  },
  "Tempo Traveller 18": {
    category: "Group Coach",
    seats: 18,
    luggage_capacity: "High roof luggage racks + boot",
    ac_type: "Central climate control",
    best_for: "Corporate team outings, wedding guest transfers"
  },
  "Force Urbania": {
    category: "Executive Luxury Van",
    seats: 16,
    luggage_capacity: "Spacious individual baggage bay",
    ac_type: "Individual overhead AC vents",
    best_for: "Luxury delegations, VIP airport transfers"
  }
};

export const GET: APIRoute = async () => {
  const fleet = Object.entries(tariffConfig.vehicles).map(([model, data]) => {
    const details = fleetDetails[model] || {
      category: "Car Rental",
      seats: 4,
      luggage_capacity: "2 bags",
      ac_type: "AC",
      best_for: "Outstation travel"
    };

    return {
      model,
      category: details.category,
      seats: details.seats,
      luggage_capacity: details.luggage_capacity,
      rate_per_km_inr: data.round_trip_rate,
      one_way_rate_per_km_inr: (data as any).one_way_rate || data.round_trip_rate + 2,
      driver_batta_per_day_inr: (data as any).driver_bata || 400,
      min_km_per_day: data.min_km_per_day || 250,
      ac_type: details.ac_type,
      best_for: details.best_for
    };
  });

  return new Response(JSON.stringify({ fleet, currency: "INR", site: "https://kalidasstravels.in" }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=86400"
    }
  });
};
