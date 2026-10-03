// @ts-check
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import tailwindcss from "@tailwindcss/vite";

// Pages are static by default; job pages opt out (prerender = false) so filters work.
export default defineConfig({
  // devFeatures: false skips emulating Netlify (edge functions, images, env vars) during
  // `astro dev`. We use none of them, and the edge-functions emulator fails to start on Windows.
  adapter: netlify({ devFeatures: false }),
  redirects: { "/": "/local" },
  server: { host: "127.0.0.1" },
  // Static pages as saved.html (not saved/index.html) so Netlify serves /saved without a
  // trailing-slash redirect.
  build: { format: "file" },
  vite: { plugins: [tailwindcss()] },
});
