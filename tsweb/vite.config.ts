import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "serve-public-json",
      configureServer(server) {
        // Serve .json files from public/ directly, bypassing SPA fallback cache
        server.middlewares.use(function (req, res, next) {
          if (req.url && req.url.split("?")[0].endsWith(".json")) {
            var cleanUrl = req.url.split("?")[0];
            var filePath = path.join(process.cwd(), "public", cleanUrl);
            if (fs.existsSync(filePath)) {
              res.setHeader("Content-Type", "application/json");
              fs.createReadStream(filePath).pipe(res);
              return;
            } else {
              res.statusCode = 404;
              res.end("Not found");
              return;
            }
          }
          next();
        });
      },
    },
  ],
  base: process.env.BASE_PATH || "/",
  server: {
    port: 8080,
    host: "0.0.0.0",
    watch: {
      usePolling: true,
    },
  },
});
