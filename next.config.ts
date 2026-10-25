import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

// This computer's addresses on the local network (e.g. 192.168.1.20), so
// phones and other laptops on the same Wi-Fi can open the dev server.
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((net) => net && net.family === "IPv4" && !net.internal)
  .map((net) => net!.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", ...lanAddresses],
  turbopack: {
    // Use this folder as the project root, even if another package-lock.json
    // exists higher up on someone's computer (e.g. in their user folder)
    root: __dirname,
  },
};

export default nextConfig;
