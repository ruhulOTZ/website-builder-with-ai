import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@repo/ai',
    '@repo/components-library',
    '@repo/database',
    '@repo/design-system',
    '@repo/shared-types',
  ],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
