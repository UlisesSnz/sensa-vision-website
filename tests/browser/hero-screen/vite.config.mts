import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import split from "../split/vite.config.mts";
import editor from "../split-editor/vite.config.mts";

export default defineConfig({
  ...split,
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: fileURLToPath(
    new URL("../../fixtures/hero-screen", import.meta.url),
  ),
  optimizeDeps: { include: ["lottie-web/build/player/lottie_light"] },
  resolve: {
    alias: {
      ...editor.resolve?.alias,
      "@": fileURLToPath(new URL("../../../", import.meta.url)),
      "next/image": fileURLToPath(new URL("./next-image.tsx", import.meta.url)),
    },
  },
  server: { host: "127.0.0.1", port: 4183, strictPort: true },
});
