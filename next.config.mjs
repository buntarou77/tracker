import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();
/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },

  ...(isProd && {
    output: 'standalone',
  }),

  reactStrictMode: false,

  images: {
    domains: ['localhost'],
    unoptimized: true,
  },

  compiler: {
    removeConsole: isProd,
  },

  generateBuildId: async () => {
    return 'finance-tracker-build';
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig)