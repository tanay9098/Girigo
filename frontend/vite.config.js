import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw.js",
      registerType: "autoUpdate",
      injectManifest: {
        swSrc: "public/sw.js",
        swDest: "dist/sw.js",
      },
      manifest: {
        name: "기리고 — Girigo",
        short_name: "Girigo",
        description: "Got a wish worth dying for?",
        theme_color: "#080000",
        background_color: "#080000",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      devOptions: { enabled: true, type: "module" },
    }),
  ],
  server: { port: 5173 },
});
