import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import compress from '@playform/compress';


export default defineConfig({
  site: 'https://kalidasstravels.in',
  prefetch: true,
  integrations: [
    tailwind(),
    react(),
    sitemap({
      filter: (page) => !page.includes('/driver-cards/'),
    }),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
    compress({
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
          removeComments: true,
          collapseWhitespace: true,
        }
      }
    }),
  ],
  vite: {
    plugins: []
  }
});
