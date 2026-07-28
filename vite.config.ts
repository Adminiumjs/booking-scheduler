import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// `base` defaults to "/" (root deploy on Vercel / DigitalOcean). The
// `build:demo` script overrides it with --base=/demo/booking-scheduler/ so the
// app can be served from the Adminium demo sub-path.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        /*
         * Two vendor chunks. The 2026-07-28 revision took the app from 16
         * screens to 50 and pushed the single bundle past Rollup's 500 kB
         * warning; React barely changes between releases and the icon set is
         * the biggest dependency, so splitting them keeps the app chunk under
         * the threshold and lets a browser reuse both across deploys.
         */
        manualChunks: {
          react: ["react", "react-dom", "react-dom/client"],
          icons: ["lucide-react"],
        },
      },
    },
  },
});
