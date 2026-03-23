/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── תיקון: Security Headers ───
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "font-src 'self' https://fonts.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
              "connect-src 'self' https://*.supabase.co",
              "img-src 'self' data: blob:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

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
