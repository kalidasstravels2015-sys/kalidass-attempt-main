import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import compress from '@playform/compress';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Trigger Vite dependency re-optimization
export default defineConfig({
  site: 'https://kalidasstravels.in',
  trailingSlash: 'always',
  prefetch: true,
  redirects: {
    '/outstation': '/services/outstation-cabs/',
    '/services/outstation': '/services/outstation-cabs/',
    '/services/popular-destinations': '/services/outstation-cabs/',
    '/services/weekend-packages': '/services/tours/weekend-packages/',
    '/services/temple-tours': '/services/tours/temple-tours/',
    '/services/chennai-airport-taxi-transfers': '/services/chennai-airport-taxi/',
    '/services/airport-transfer': '/services/chennai-airport-taxi/',
    '/services/chennai-to-tirupati-one-day-package': '/services/tirupati-package/',
    '/services/chennai-to-pondicherry-taxi': '/services/pondicherry-one-day-trip/',
    '/services/chennai-to-mahabalipuram-taxi': '/services/mahabalipuram-ecr-temple-route/',
    '/smart-travel-solution': '/',
    '/driver-cards': '/drivers/',
    '/ta': '/',
  },
  integrations: [
    tailwind(),
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/driver-cards/') &&
        !page.includes('/404') &&
        !page.includes('/og/') &&
        !page.includes('/admin') &&
        !page.includes('/ops') &&
        !page.endsWith('/services/popular-destinations/') &&
        !page.endsWith('/services/temple-tours/') &&
        !page.endsWith('/services/weekend-packages/') &&
        !page.endsWith('/services/chennai-airport-taxi-transfers/') &&
        !page.endsWith('/services/chennai-to-tirupati-one-day-package/') &&
        !page.endsWith('/services/chennai-to-pondicherry-taxi/') &&
        !page.endsWith('/services/chennai-to-mahabalipuram-taxi/'),
      serialize(item) {
        const url = item.url;
        item.lastmod = new Date();
        if (url === 'https://kalidasstravels.in/') {
          item.changefreq = 'daily';
          item.priority = 1.0;
        } else if (
          url.includes('/services/chennai-airport-taxi/') ||
          url.includes('/services/outstation-cabs/') ||
          url.includes('/services/tirupati-package/') ||
          url.includes('/tariff/')
        ) {
          item.changefreq = 'daily';
          item.priority = 0.9;
        } else if (
          url.includes('/services/tours/') ||
          url.includes('/services/navagraha-tour/') ||
          url.includes('/services/thiruvannamalai-girivalam-trip/') ||
          url.includes('/services/sabarimala-trip/') ||
          url.includes('/services/rameswaram-2-days/') ||
          url.includes('/services/acting-drivers/') ||
          url.includes('/services/corporate/') ||
          url.includes('/careers/')
        ) {
          item.changefreq = 'weekly';
          item.priority = 0.85;
        } else if (
          url.includes('/services/') ||
          url.includes('/fleet/') ||
          url.includes('/calculator/') ||
          url.includes('/sitemap/')
        ) {
          item.changefreq = 'weekly';
          item.priority = 0.8;
        } else if (url.includes('/drivers/')) {
          item.changefreq = 'monthly';
          item.priority = 0.7;
        } else {
          item.changefreq = 'monthly';
          item.priority = 0.5;
        }
        return item;
      },
    }),
    {
      name: 'sitemap-sync',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          const destDir = fileURLToPath(dir);
          const sitemapIndex = path.join(destDir, 'sitemap-index.xml');
          const sitemapTarget = path.join(destDir, 'sitemap.xml');
          if (fs.existsSync(sitemapIndex)) {
            fs.copyFileSync(sitemapIndex, sitemapTarget);
          }
        },
      },
    },
    compress({
      CSS: true,
      HTML: false,
      JavaScript: false,
    }),
  ],
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react', '@astrojs/react/client.js']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
          },
        },
      },
    },
    plugins: [
      {
        name: 'utf8-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url?.split('?')[0] || '';
            if (req.method === 'POST' && url === '/api/record-booking') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body || '{}');
                  const csvPath = path.resolve(process.cwd(), 'Kalidass_Operations_Control_2026.csv');
                  let bookingId = data.bookingId;
                  if (fs.existsSync(csvPath)) {
                    const content = fs.readFileSync(csvPath, 'utf8');
                    const lines = content.trim().split(/\r?\n/).filter(Boolean);
                    const rowNum = lines.length + 1;

                    if (!bookingId) {
                      bookingId = `#KT-TPT-${100 + rowNum}`;
                    }

                    const guestNamePhone = `${data.name || 'Guest'} (+91 ${data.phone || '9840100000'})`;
                    const pickupTimeAndDate = `${data.pickupDate || 'Tomorrow'} @ ${data.pickupTime || '04:30 AM'}`;
                    const cleanAddress = (data.pickupAddress || 'Chennai').replace(/"/g, '""');

                    // Vehicle normalization
                    const vLow = (data.vehicle || '').toLowerCase();
                    let vehCat = 'Sedan';
                    if (vLow.includes('tempo') || vLow.includes('traveller')) vehCat = 'Tempo';
                    else if (vLow.includes('crysta')) vehCat = 'Crysta';
                    else if (vLow.includes('innova')) vehCat = 'Innova';
                    else if (vLow.includes('ertiga') || vLow.includes('xl6')) vehCat = 'Ertiga';

                    const partySize = data.passengers || '4 Pax';
                    const fareNum = parseInt(String(data.fare || '').replace(/[^0-9]/g, ''), 10) || 6000;
                    const payoutNum = Math.round(fareNum * 0.8);

                    const newRow = `${bookingId},${guestNamePhone},${pickupTimeAndDate},"${cleanAddress}",${vehCat},${partySize},Pending,Pending,Unassigned,Pending,${fareNum},${payoutNum},=K${rowNum}-L${rowNum},Unreconciled\n`;
                    fs.appendFileSync(csvPath, newRow, 'utf8');
                  }
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: true, bookingId }));
                } catch (err) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            if (req.method === 'POST' && url === '/api/record-calculation') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body || '{}');
                  const csvPath = path.resolve(process.cwd(), 'Kalidass_Calculations_Log_2026.csv');
                  let quoteId = data.quoteId;
                  const timestamp = data.timestamp || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                  const sourcePage = (data.sourcePage || '/').replace(/,/g, ' ');
                  const calculatorEngine = (data.calculatorEngine || 'Fare Calculator').replace(/,/g, ' ');
                  const tripType = (data.tripType || 'Standard').replace(/,/g, ' ');
                  const pickup = (data.pickup || 'Chennai').replace(/,/g, ' ').replace(/"/g, '""');
                  const drop = (data.drop || 'N/A').replace(/,/g, ' ').replace(/"/g, '""');
                  const vehicle = (data.vehicle || 'Standard').replace(/,/g, ' ');
                  const distanceKm = data.distanceKm || (data.distance ? String(data.distance) : 'N/A');
                  const fareNum = parseInt(String(data.estimatedFare || data.estimate || '0').replace(/[^0-9]/g, ''), 10) || 0;
                  const status = data.status || 'Browsed';
                  const metadata = (data.meta ? JSON.stringify(data.meta).replace(/,/g, ';').replace(/"/g, '') : 'None');

                  if (fs.existsSync(csvPath)) {
                    const content = fs.readFileSync(csvPath, 'utf8');
                    const lines = content.trim().split(/\r?\n/).filter(Boolean);
                    const rowNum = lines.length;

                    if (!quoteId) {
                      quoteId = `#CALC-${100 + rowNum}`;
                    }

                    const newRow = `${quoteId},"${timestamp}","${sourcePage}","${calculatorEngine}","${tripType}","${pickup}","${drop}","${vehicle}",${distanceKm},${fareNum},${status},"${metadata}"\n`;
                    fs.appendFileSync(csvPath, newRow, 'utf8');
                  }

                  // Backup Forward to Google Apps Script Webhook
                  try {
                    fetch('https://script.google.com/macros/s/AKfycbwoEpKqa3Qg-DIvMe06pGUgGLlC_0vJQev61nzIh9ssh1-uHZ5VtYkGzpMVwhEyi7tvEQ/exec', {
                      method: 'POST',
                      headers: { 'Content-Type': 'text/plain' },
                      body: JSON.stringify({
                        type: 'calculator_activity',
                        quoteId,
                        date: timestamp,
                        sourcePage,
                        calculatorEngine,
                        tripType,
                        pickup,
                        drop,
                        vehicle,
                        distance: distanceKm,
                        estimate: fareNum,
                        status
                      })
                    }).catch(() => {});
                  } catch (_) {}

                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: true, quoteId }));
                } catch (err) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            if (req.method === 'GET' && (url === '/api/calculations' || url === '/api/calculations.json')) {
              try {
                const csvPath = path.resolve(process.cwd(), 'Kalidass_Calculations_Log_2026.csv');
                if (!fs.existsSync(csvPath)) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: true, count: 0, calculations: [] }));
                  return;
                }
                const content = fs.readFileSync(csvPath, 'utf8');
                const lines = content.trim().split(/\r?\n/).filter(Boolean);
                const calculations = [];
                for (let i = 1; i < lines.length; i++) {
                  const line = lines[i];
                  const matches = line.match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g);
                  if (matches) {
                    const row = matches.map(m => {
                      let s = m.replace(/^,/, '').trim();
                      if (s.startsWith('"') && s.endsWith('"')) {
                        s = s.slice(1, -1).replace(/""/g, '"');
                      }
                      return s;
                    });
                    calculations.push({
                      quoteId: row[0] || '',
                      timestamp: row[1] || '',
                      sourcePage: row[2] || '',
                      calculatorEngine: row[3] || '',
                      tripType: row[4] || '',
                      pickup: row[5] || '',
                      drop: row[6] || '',
                      vehicle: row[7] || '',
                      distanceKm: row[8] || '',
                      estimatedFare: parseInt(row[9] || '0', 10) || 0,
                      status: row[10] || 'Browsed',
                      metadata: row[11] || ''
                    });
                  }
                }
                calculations.reverse();
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: true, count: calculations.length, calculations }));
              } catch (err) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }

            next();
          });
        },
      },
    ],
  },
});
