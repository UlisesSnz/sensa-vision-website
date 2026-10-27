import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { defineConfig } from "vite";

// Studio and the app use different major versions of @sanity/ui. Mount each
// version's own providers, just as the embedded Studio does in production.
const studioRequire = createRequire(import.meta.resolve("sanity"));
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  envDir: false,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../../../", import.meta.url)),
      "test-studio-ui": studioRequire.resolve("@sanity/ui"),
      "test-studio-style": studioRequire.resolve("@sanity/ui/styles.css"),
    },
  },
  server: { host: "127.0.0.1", port: 4177, strictPort: true },
});
