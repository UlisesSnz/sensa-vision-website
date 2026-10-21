import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL("../../../", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: false,
  envDir: false,
  resolve: { alias: { "@": root } },
  css: { postcss: root },
  // GridRow imports the image helpers; this fixture never connects to Sanity.
  define: {
    "process.env.NEXT_PUBLIC_SANITY_PROJECT_ID": JSON.stringify("localqa"),
    "process.env.NEXT_PUBLIC_SANITY_DATASET": JSON.stringify("local"),
    "process.env.NEXT_PUBLIC_SANITY_API_VERSION": JSON.stringify("2024-10-31"),
  },
  server: { host: "127.0.0.1", port: 4174, strictPort: true },
});
