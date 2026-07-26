import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The opengraph-image routes read assets/Geist-Regular.ttf through
  // `process.cwd()`, which the dependency tracer cannot see. Without this the
  // font is missing from the serverless bundle and every OG card renders as
  // empty boxes in production while working fine locally.
  outputFileTracingIncludes: {
    '/**/opengraph-image': ['./assets/**'],
  },
};

export default nextConfig;
