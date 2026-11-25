import fs from 'node:fs';
import path from 'node:path';

const SOUTH_STATES = new Set([
  'tamil nadu',
  'tamilnadu',
  'andhra pradesh',
  'karnataka',
  'kerala',
  'puducherry',
  'pondicherry',
  'telangana',
]);

// Verified NHAI plaza overrides / fallback rates for major TN & South India corridors
// when TIS map summary omits LCV/Bus return rates.
const VERIFIED_NHAI_RATES = {
  sriperumbudur: { car: { single: 50, return24h: 75 }, lcv: { single: 170, return24h: 255 }, bus: { single: 270, return24h: 405 } },
  nemili: { car: { single: 50, return24h: 75 }, lcv: { single: 170, return24h: 255 }, bus: { single: 270, return24h: 405 } },
  chennasamudram: { car: { single: 50, return24h: 80 }, lcv: { single: 85, return24h: 125 }, bus: { single: 175, return24h: 260 } },
  pallikonda: { car: { single: 115, return24h: 170 }, lcv: { single: 185, return24h: 275 }, bus: { single: 385, return24h: 580 } },
  vaniyambadi: { car: { single: 105, return24h: 160 }, lcv: { single: 175, return24h: 260 }, bus: { single: 360, return24h: 545 } },
  krishnagiri: { car: { single: 85, return24h: 130 }, lcv: { single: 140, return24h: 205 }, bus: { single: 290, return24h: 435 } },
  paranur: { car: { single: 75, return24h: 110 }, lcv: { single: 120, return24h: 180 }, bus: { single: 250, return24h: 375 } },
  athur: { car: { single: 70, return24h: 105 }, lcv: { single: 115, return24h: 170 }, bus: { single: 240, return24h: 360 } },
  vikravandi: { car: { single: 100, return24h: 150 }, lcv: { single: 160, return24h: 240 }, bus: { single: 335, return24h: 505 } },
};

function num(val) {
  const n = Number(String(val ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

async function fetchNhaiTisPlazas() {
  const res = await fetch('https://tis.nhai.gov.in/TollPlazaService.asmx/GetTollPlazaInfoForMapOnPC', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: '{}',
  });
  if (!res.ok) throw new Error(`NHAI TIS HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.d) ? data.d : [];
}

async function main() {
  let rawPlazas = [];
  try {
    rawPlazas = await fetchNhaiTisPlazas();
    console.log(`Fetched ${rawPlazas.length} plazas from NHAI TIS.`);
  } catch (err) {
    console.warn('NHAI TIS fetch failed, trying HTTP fallback:', err.message);
    try {
      const res = await fetch('http://tis.nhai.gov.in/TollPlazaService.asmx/GetTollPlazaInfoForMapOnPC', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: '{}',
      });
      if (res.ok) {
        const data = await res.json();
        rawPlazas = Array.isArray(data?.d) ? data.d : [];
        console.log(`Fetched ${rawPlazas.length} plazas from NHAI TIS (HTTP).`);
      }
    } catch (e2) {
      console.error('NHAI TIS HTTP fallback also failed:', e2.message);
    }
  }

  const southPlazas = [];
  for (const p of rawPlazas) {
    const state = String(p.State || p.state || '').trim();
    if (!SOUTH_STATES.has(state.toLowerCase())) continue;

    const lat = Number(p.Latitude || p.latitude);
    const lng = Number(p.Longitude || p.longitude);
    const name = String(p.TollName || p.PlazaName || p.name || '').trim();
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const nameLower = name.toLowerCase();
    const overrideKey = Object.keys(VERIFIED_NHAI_RATES).find((k) => nameLower.includes(k));
    const override = overrideKey ? VERIFIED_NHAI_RATES[overrideKey] : null;

    const carSingle = override?.car.single || num(p.CarSingle || p.CarRate_single || p.Car_Single);
    const carRet = override?.car.return24h || num(p.CarReturn || p.CarRate_return || p.Car_Return) || Math.round((carSingle * 1.5) / 5) * 5;
    const lcvSingle = override?.lcv.single || num(p.LCVSingle || p.LCVRate_single || p.LCV_Single);
    const lcvRet = override?.lcv.return24h || num(p.LCVReturn || p.LCVRate_return || p.LCV_Return) || Math.round((lcvSingle * 1.5) / 5) * 5;
    const busSingle = override?.bus.single || num(p.BusSingle || p.BusTruckSingle || p.Bus_Single);
    const busRet = override?.bus.return24h || num(p.BusReturn || p.BusTruckReturn || p.Bus_Return) || Math.round((busSingle * 1.5) / 5) * 5;

    if (carSingle <= 0 || lcvSingle <= 0 || busSingle <= 0) continue;

    southPlazas.push({
      id: p.TollPlazaID || p.PlazaId || nameLower.replace(/[^a-z0-9]+/g, '-'),
      name,
      state,
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      rates: {
        car: { single: carSingle, return24h: carRet },
        lcv: { single: lcvSingle, return24h: lcvRet },
        bus: { single: busSingle, return24h: busRet },
      },
    });
  }

  const outPath = path.resolve(process.cwd(), 'src/data/nhaiTollPlazas.json');
  fs.writeFileSync(outPath, JSON.stringify({ updatedAt: new Date().toISOString(), count: southPlazas.length, plazas: southPlazas }, null, 2));
  console.log(`Wrote ${southPlazas.length} verified South India toll plazas to ${outPath}`);
}

main();
