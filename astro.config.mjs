// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Production canonical host. One HTTPS host variant only; all other
// host variants (http://, www.) must 301 to this at the host/CDN level.
// See docs/url-redirect-map.csv and README "Deploy" section.
const SITE_URL = 'https://freedive.ee';

// Pages that must never appear in the sitemap (noindex pages).
const NOINDEX_PATHS = [`${SITE_URL}/thank-you/`, `${SITE_URL}/404/`];

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX_PATHS.includes(page),
    }),
  ],
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
});
