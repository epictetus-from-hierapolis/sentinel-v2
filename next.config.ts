import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* NOTE: In Next.js 16+, allowedDevOrigins is at the top level.
    Do not place it within 'experimental'.
  */
  /* 1. WebSocket (HMR) Fix & Local Network Configuration */
  allowedDevOrigins: [
    "localhost:3000",
    // Add your local IP to test from mobile in the same network
    // "192.168.1.X:3000",
  ],
  /* 2. Images Fix (Unsplash 404) */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
    ],
  },
  /* 3. Turbopack config (Next.js 16 default) - required alongside webpack config */
  turbopack: {},
  /* 4. Fallback for Node.js modules in the browser (accidental imports or via libs) */
  webpack: (config, { isServer, nextRuntime }) => {
    if (!isServer || nextRuntime === 'edge') {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;