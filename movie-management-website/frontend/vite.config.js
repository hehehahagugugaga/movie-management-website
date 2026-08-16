import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // so the frontend can just call "/api/..." during development
      // and it gets forwarded to the backend on port 5000
      "/api": "http://localhost:5000",
    },
  },
});
