import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    publicDir: "static",
    server: {
      host: "127.0.0.1",
      proxy: {
        "/api": {
          target: environment.API_PROXY_TARGET || "http://127.0.0.1:8080",
          changeOrigin: true,
        },
      },
    },
    build: { chunkSizeWarningLimit: 400 },
  };
});
