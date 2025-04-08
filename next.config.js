/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'export',  // Changed from 'standalone' to 'export' for Static Web Apps
  env: {
    API_URL: process.env.API_URL || 'http://localhost:5000',
  },
  // Disable image optimization since Azure Static Web Apps doesn't support it
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes are handled correctly
  trailingSlash: true,
  // Exclude Supabase functions from the build
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /supabase\/functions\/.*/,
      use: 'ignore-loader',
    });
    return config;
  },
};

module.exports = nextConfig;
