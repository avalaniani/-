import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// דומיינים ראשיים שלא שייכים לחברה ספציפית
const ROOT_DOMAINS = [
  'workflowpro.vercel.app',
  'workflowproo.vercel.app',
  'localhost',
]

function getCompanySlug(req: NextRequest): string | null {
  const hostname = req.headers.get('host') || ''
  const cleanHost = hostname.split(':')[0] // הסר port

  // subdomain: techcorp.workflowpro.vercel.app
  for (const root of ROOT_DOMAINS) {
    if (cleanHost.endsWith('.' + root)) {
      return cleanHost.slice(0, cleanHost.length - root.length - 1)
    }
  }

  // pathname: workflowpro.vercel.app/techcorp/api/...
  const parts = req.nextUrl.pathname.split('/').filter(Boolean)
  if (parts[0] && parts[0] !== 'api' && parts[1] === 'api') {
    return parts[0]
  }

  return null // דומיין ראשי
}

function isMainDomain(req: NextRequest): boolean {
  return getCompanySlug(req) === null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/api/')) return NextResponse.next()

  // /api/auth — פתוח תמיד (לוגין)
  if (pathname.startsWith('/api/auth')) return NextResponse.next()

  // כל שאר ה-API — דורש JWT תקין
  const auth = request.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload: p } = await jwtVerify(token, secret)
    payload = p as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role    = payload.role as string
  const company = payload.company as string | null
  const slugFromUrl = getCompanySlug(request)

  // מנהל מערכת — מותר רק מהדומיין הראשי
  if (role === 'admin' && !isMainDomain(request)) {
    return NextResponse.json(
      { error: 'מנהל מערכת חייב לפעול מהדומיין הראשי' },
      { status: 403 }
    )
  }

  // משתמש רגיל — חייב לפעול מדומיין חברה
  if (role !== 'admin' && isMainDomain(request)) {
    return NextResponse.json(
      { error: 'יש לגשת למערכת דרך כתובת החברה שלך' },
      { status: 403 }
    )
  }

  // משתמש רגיל — חברה ב-token חייבת להתאים ל-slug ב-URL
  if (role !== 'admin' && slugFromUrl && company !== slugFromUrl) {
    return NextResponse.json(
      { error: 'אין גישה לחברה זו' },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
