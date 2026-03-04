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
  async rewrites() {
    return [
      // כל slug של חברה → app.html (Next.js מגיש את הקובץ הסטטי)
      {
        source: '/:company',
        destination: '/app.html',
      },
    ]
  },
}
module.exports = nextConfig
