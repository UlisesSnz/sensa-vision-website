/** @type {import('next').NextConfig} */

import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  cacheComponents: false,
  outputFileTracingRoot: projectRoot,
  reactCompiler: false,
  turbopack: {
    root: projectRoot,
  },
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
