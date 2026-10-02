// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  redirects: { '/': '/remote' },
  vite: { plugins: [tailwindcss()] },
});
