/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://91.98.127.14:8000/api/v1/:path*',
      },
    ];
  },
};
module.exports = nextConfig;
