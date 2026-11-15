// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

import { SITE_URL } from './site.mjs';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'file', inlineStylesheets: 'auto' },
  integrations: [svelte()],
  devToolbar: { enabled: false },
  vite: {
    worker: { format: 'es' },
    build: { assetsInlineLimit: 2048 }
  }
});
