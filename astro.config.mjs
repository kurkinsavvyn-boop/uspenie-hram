// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// base/site задаются при сборке под GitHub Pages (в подпапке /uspenie-hram/),
// локально по умолчанию — кастомный домен и корень.
const base = process.env.BASE_PATH || '/';
const site = process.env.SITE_URL || 'https://uspenie-hram.org';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [sitemap()],
});
