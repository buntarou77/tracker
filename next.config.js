/** @type {import('next').NextConfig} */
const nextConfig = {
  // Включаем экспериментальные функции для оптимизации
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  
  // Настройки для статической генерации
  output: 'standalone',
  
  // Настройки изображений
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  
  // Настройки компиляции
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Настройки для статических страниц
  generateBuildId: async () => {
    return 'finance-tracker-build'
  },
  
  // Настройки заголовков безопасности
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig