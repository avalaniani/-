import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPassword, signToken, verifyToken } from '@/lib/auth'
import { ok, err } from '@/lib/api'

const COOKIE_NAME = 'wfp_session'
const COOKIE_OPTS = {
  httpOnly: true,                                          // ─── לא נגיש ל-JS ───
  secure: process.env.NODE_ENV === 'production',           // ─── HTTPS בלבד ב-prod ───
  sameSite: 'lax' as const,                               // ─── CSRF protection ───
  maxAge: 60 * 60 * 24 * 7,                               // 7 ימים
  path: '/',
}

// ─── helper: הוצא token מ-cookie או Authorization header ───
function extractToken(req: NextRequest): string | null {
  // 1. נסה cookie (עדיף - httpOnly)
  const cookie = req.cookies.get(COOKIE_NAME)?.value
  if (cookie) return cookie

  // 2. fallback ל-Authorization header (לתאימות לאחור בזמן המעבר)
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)

  return null
}

// GET — בדוק session
export async function GET(req: NextRequest) {
  const token = extractToken(req)
  if (!token) return err('Not authenticated', 401)

  const session = verifyToken(token)
  if (!session) return err('Invalid token', 401)

  return ok({ user: session })
}

// POST — התחברות
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return err('בקשה לא תקינה', 400)

  const { username, password } = body
  if (!username || !password) return err('חסרים פרטים')

  // ─── שליפת משתמש ───
  const { data: user, error } = await supabase
    .from('users')
    .select('id,username,password_hash,name,role,company_id,avatar,avatar_color,ceo_interface,field_worker')
    .eq('username', username.trim().toLowerCase())
    .single()

  // ─── תיקון timing attack: תמיד מריץ verifyPassword ───
  const valid = await verifyPassword(password, user?.password_hash ?? null)

  if (error || !user || !valid) {
    return err('שם משתמש או סיסמה שגויים', 401)
  }

  // ─── slug של חברה לצורך בדיקת URL ───
  let companySlug: string | null = null
  if (user.company_id) {
    const { data: company } = await supabase
      .from('companies').select('id').eq('id', user.company_id).single()
    companySlug = company?.id || null
  }

  const payload = {
    id:       user.id,
    username: user.username,
    name:     user.name,
    role:     user.role,
    company:  user.company_id,
  }

  const token = signToken(payload)

  // ─── תיקון: שלח token כ-httpOnly cookie ───
  const response = NextResponse.json({
    // token גם בתגובה לתאימות לאחור עם localStorage (יוסר בגרסה הבאה)
    token,
    id:           user.id,
    username:     user.username,
    name:         user.name,
    role:         user.role,
    company:      user.company_id,
    companySlug,
    avatar:       user.avatar,
    avatarColor:  user.avatar_color,
    ceoInterface: user.ceo_interface,
    fieldWorker:  user.field_worker,
  })

  response.cookies.set(COOKIE_NAME, token, COOKIE_OPTS)
  return response
}

// DELETE — התנתקות
export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ ok: true })

  // ─── תיקון: מחק את ה-cookie בשרת ───
  response.cookies.set(COOKIE_NAME, '', {
    ...COOKIE_OPTS,
    maxAge: 0,    // מחיקה מיידית
  })

  return response
}
