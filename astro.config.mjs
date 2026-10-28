import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Địa chỉ chính thức của trang web (đổi ở đây khi có tên miền riêng)
export default defineConfig({
  site: process.env.SITE_URL || 'https://tramtruyennho.pages.dev',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
