/** @type {import('next').NextConfig} */
const defaultRuntimeCaching = require("next-pwa/cache");

const buildRevision = Date.now().toString();
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.DISABLE_PWA === "true",
    dynamicStartUrl: false,
    fallbacks: {
      document: "/~offline",
    },
    additionalManifestEntries: [
      { url: "/home", revision: buildRevision },
      { url: "/login", revision: buildRevision },
      { url: "/asha/dashboard", revision: buildRevision },
      { url: "/records", revision: buildRevision },
      { url: "/symptoms", revision: buildRevision },
      { url: "/triage", revision: buildRevision },
    ],
  runtimeCaching: [
    // 1. Next.js 14 App Router RSC payload caching (?_rsc=...)
    {
      urlPattern: ({ url }) => url.searchParams.has("_rsc"),
      handler: "NetworkFirst",
      options: {
        cacheName: "next-rsc-cache",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        networkTimeoutSeconds: 2,
      },
    },
    // 2. HTML navigation requests
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-runtimes",
        networkTimeoutSeconds: 2,
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
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