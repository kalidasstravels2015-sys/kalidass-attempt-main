import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import compress from '@playform/compress';


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
