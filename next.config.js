/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  webpack: (config, { dev }) => {
    // OneDrive can race with Next.js filesystem cache writes in .next/dev/cache.
    // Use in-memory cache during local dev to avoid missing pack file errors.
    if (dev) {
      config.cache = {
        type: "memory",
      };
    }

    return config;
  },
};

module.exports = nextConfig;
