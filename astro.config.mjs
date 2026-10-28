import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Địa chỉ trang web. Khi đưa lên GitHub, hệ thống tự điền các giá trị này.
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
