/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
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
}

module.exports = nextConfig
