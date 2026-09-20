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
    '/outstation': '/services/popular-destinations/',
    '/services/outstation': '/services/popular-destinations/',
  },
  integrations: [
    tailwind(),
    react(),
    sitemap({
      filter: (page) => !page.includes('/driver-cards/'),
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
    }),
  ],
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: []
  }
});
