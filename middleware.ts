import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ה-API routes מוגנים (חוץ מ-/api/auth)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const token = request.cookies.get('wfp_session')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
