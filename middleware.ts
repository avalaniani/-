// middleware.ts
// Runs on every request — protects routes and injects ENV vars into app.html

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes
  if (pathname.startsWith('/api/') || pathname === '/login') {
    return NextResponse.next()
  }

  // Auth check for app.html and dashboard
  const token = request.cookies.get('wfp_session')?.value
  const session = token ? verifyToken(token) : null

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // For app.html — inject Supabase ENV vars as a script tag
  if (pathname === '/app.html') {
    const response = NextResponse.next()
    // We can't inject HTML via middleware easily.
    // Instead, app.html reads them from meta tags injected by the response.
    // The cleaner way: app.html fetches /api/config to get public env vars.
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app.html', '/dashboard/:path*', '/api/(?!auth).*'],
}
