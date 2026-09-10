import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const api = process.env.VITE_API_URL || "http://127.0.0.1:40211";
const port = Number(process.env.WEB_PORT || 41791);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port,
    strictPort: true,
    proxy: {
      "/v1": api,
      "/health": api,
    },
  },
  preview: {
    host: "127.0.0.1",
    port,
  },
});
