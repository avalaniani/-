import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// ─── תיקון: Rate limiting פשוט בזיכרון (לייצור מומלץ Upstash Redis) ───
// מגביל ניסיונות login ל-10 בדקה לכל IP
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 })
    return true // מותר
  }

  if (entry.count >= 10) return false // חסום

  entry.count++
  return true
}

// ─── ניקוי זיכרון כל 5 דקות ───
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of loginAttempts.entries()) {
      if (now > entry.resetAt) loginAttempts.delete(ip)
    }
  }, 5 * 60_000)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ─── תיקון: Rate limiting על login ───
  if (pathname === '/api/auth' && request.method === 'POST') {
    const ip = request.ip
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד דקה.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '10',
          },
        }
      )
    }
  }

  // ─── JWT ולידציה על כל ה-API חוץ מ-auth ───
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const auth = request.headers.get('authorization')
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
      const { payload } = await jwtVerify(token, secret)

      // ─── תיקון: הגנת IP על חשבון האדמין ───
      // אם ADMIN_IPS מוגדר בסביבה, רק מה-IPs האלה מורשים לגשת כ-admin
      const adminIPs = process.env.ADMIN_IPS
      if (payload.role === 'admin' && adminIPs) {
        const ip = request.ip
          || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || ''
        const allowed = adminIPs.split(',').map(s => s.trim())
        if (!allowed.includes(ip)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }

    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
