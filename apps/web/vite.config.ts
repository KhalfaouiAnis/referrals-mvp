import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@referrals/shared": resolve(__dirname, "../../packages/shared/src"),
    },
    dedupe: ["react", "react-dom", "react-router-dom"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  optimizeDeps: {
    include: ["@referrals/shared"],
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
