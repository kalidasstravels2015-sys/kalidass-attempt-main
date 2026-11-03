import type { APIRoute } from 'astro';
import tariffConfig from '../../data/tariff_config.json';
import { getVehicleMetadata } from '../../utils/vehicleMetadata';

export const prerender = true;

export const GET: APIRoute = async () => {
  const fleet = Object.entries(tariffConfig.vehicles).map(([model, data]) => {
    const meta = getVehicleMetadata(model, data);

    return {
      model,
      category: meta.category,
      seats: meta.seatCount,
      luggage_capacity: meta.luggage,
      rate_per_km_inr: data.round_trip_rate,
      one_way_rate_per_km_inr: (data as any).one_way_rate || data.round_trip_rate + 2,
      driver_batta_per_day_inr: (data as any).driver_bata || 500,
      min_km_per_day: data.min_km_per_day || 250,
      local_hourly_packages_inr: {
        "4h_40km": (data as any).local_4hr_pkg || null,
        "5h_50km": (data as any).local_5hr_pkg || null,
        "8h_80km": (data as any).local_8hr_pkg || null,
        "10h_100km": (data as any).local_10hr_pkg || null,
        "12h_120km": (data as any).local_12hr_pkg || null,
        extra_km_rate: (data as any).extra_km_rate || null,
        extra_hr_rate: (data as any).extra_hr_rate || null
      },
      ac_type: meta.acType,
      best_for: meta.badge,
      image: meta.image
    };
  });

  return new Response(JSON.stringify({ fleet, currency: "INR", site: "https://kalidasstravels.in" }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=86400"
    }
  });
};
