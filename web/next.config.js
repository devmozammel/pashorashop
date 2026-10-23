/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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

