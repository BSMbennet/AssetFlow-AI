/** @type {import(‘next’).NextConfig} */
Const nextConfig = {
  Output: ‘standalone’,
  Experimental: {
    typedRoutes: true,
    serverActions: true,
  },
  Images: {
    Domains: [‘assetflow.ai’],
    Formats: [‘image/avif’, ‘image/webp’],
  },
  Compiler: {
    removeConsole: process.env.NODE_ENV === ‘production’,
  },
  Webpack: (config) => {
    Config.resolve.alias = {
      ...config.resolve.alias,
      ‘@’: require(‘path’).resolve(__dirname, ‘src’),
    };
    Return config;
  },
};

Module.exports = nextConfig;
