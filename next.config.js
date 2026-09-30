/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['yspjuakdfukoawjjiulb. supabase.co'], // Your Supabase domain
  },
  // Remove experimental. appDir - it's default now

/**
  experimental: {
    appDir: true,          
  },
*/
  serverExternalPackages: ['mongodb', 'stripe', 'sharp'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules'],
      }
    }
    return config
  },

  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self';" },
        ],
      },
    ]
  },
}

module.exports = nextConfig
