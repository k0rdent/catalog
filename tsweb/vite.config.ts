import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "serve-public-json-and-spa-fallback",
      configureServer(server) {
        // Run AFTER Vite's built-in middleware but BEFORE the default 404
        return function () {
          server.middlewares.use(function (req, res, next) {
            var cleanUrl = (req.url || "/").split("?")[0];

            // Serve .json files from public/ directly
            if (cleanUrl.endsWith(".json")) {
              var jsonPath = path.join(process.cwd(), "public", cleanUrl);
              if (fs.existsSync(jsonPath)) {
                res.setHeader("Content-Type", "application/json");
                fs.createReadStream(jsonPath).pipe(res);
                return;
              } else {
                res.statusCode = 404;
                res.end("Not found");
                return;
              }
            }

            // SPA fallback: rewrite /apps/<name>/, /contribute/, /solutions/, /configurator/ to /
            if (cleanUrl.match(/^\/apps\/[^/]+\/?$/) || cleanUrl.match(/^\/(contribute|solutions|configurator)\/?$/)) {
              req.url = "/" + (req.url!.split("?")[1] ? "?" + req.url!.split("?")[1] : "");
              next();
              return;
            }

            next();
          });
        };
      },
    },
  ],
  base: process.env.BASE_PATH || "/",
  server: {
    port: 9080,
    host: "0.0.0.0",
    watch: {
      usePolling: true,
    },
  },
});
