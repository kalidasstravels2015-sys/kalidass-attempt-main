import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import compress from '@playform/compress';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


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
  },
  integrations: [
    tailwind(),
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/driver-cards/') &&
        !page.includes('/404') &&
        !page.includes('/og/') &&
        !page.endsWith('/services/popular-destinations/') &&
        !page.endsWith('/services/temple-tours/') &&
        !page.endsWith('/services/weekend-packages/'),
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
      HTML: false,
      JavaScript: false,
    }),
  ],
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [
      {
        name: 'utf8-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url?.split('?')[0] || '';
            if (url.endsWith('.txt')) {
              res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            } else if (url.endsWith('.json')) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
            }
            next();
          });
        },
      },
    ],
  },
});
