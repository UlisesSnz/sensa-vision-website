import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { imageConfigDefault } from "next/dist/shared/lib/image-config.js";

const root = fileURLToPath(new URL("../../../", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: false,
  envDir: false,
  resolve: {
    alias: {
      "@": root,
      "next/image": fileURLToPath(
        new URL("../split/next-image.tsx", import.meta.url),
      ),
    },
  },
  css: { postcss: root },
  define: {
    "process.env.NEXT_PUBLIC_SANITY_PROJECT_ID": JSON.stringify("localqa"),
    "process.env.NEXT_PUBLIC_SANITY_DATASET": JSON.stringify("local"),
    "process.env.NEXT_PUBLIC_SANITY_API_VERSION": JSON.stringify("2024-10-31"),
    "process.env.__NEXT_IMAGE_OPTS": JSON.stringify({
      ...imageConfigDefault,
      qualities: [75, 100],
      remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
    }),
  },
  server: { host: "127.0.0.1", port: 4177, strictPort: true },
});
