import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Use this folder as the project root, even if another package-lock.json
    // exists higher up on someone's computer (e.g. in their user folder)
    root: __dirname,
  },
};

export default nextConfig;
