/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      // Cloudinary — main image storage
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Google profile pictures (OAuth)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Facebook profile pictures
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
      // Steadfast courier portal
      { protocol: 'https', hostname: 'portal.packzy.com' },
      // Shobkichu CDN & Assets
      { protocol: 'https', hostname: 'db.shobkichu.com.bd' },
      { protocol: 'https', hostname: 'shobkichu.com.bd' },
    ],
  },
  compress: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/orders',
        destination: '/my-orders',
        permanent: true,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig

