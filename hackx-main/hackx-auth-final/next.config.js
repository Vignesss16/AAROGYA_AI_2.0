/** @type {import('next').NextConfig} */
const defaultRuntimeCaching = require("next-pwa/cache");

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // 1. Next.js 14 App Router RSC payload caching (?_rsc=...)
    {
      urlPattern: ({ url }) => url.searchParams.has("_rsc"),
      handler: "NetworkFirst",
      options: {
        cacheName: "next-rsc-cache",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 4,
      },
    },
    // 2. HTML navigation requests
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
        networkTimeoutSeconds: 4,
      },
    },
    // 3. Fallback to standard next-pwa cache rules for assets/fonts/images
    ...defaultRuntimeCaching,
  ],
});

const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
    outputFileTracingIncludes: {
      '/api/**/*': ['./data/**/*'],
    }
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=*, microphone=*, geolocation=*",
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);