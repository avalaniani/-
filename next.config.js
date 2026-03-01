/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/app.html',
        permanent: false,
      },
      {
        source: '/app',
        destination: '/app.html',
        permanent: false,
      },
    ]
  },
}
module.exports = nextConfig
