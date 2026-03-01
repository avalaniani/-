import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPassword, setSessionCookie, clearSessionCookie, getSession } from '@/lib/auth'
import { ok, err } from '@/lib/api'

// GET — בדוק session קיים
export async function GET() {
  const session = getSession()
  if (!session) return err('Not authenticated', 401)
  return ok({ user: session })
}

// POST — התחברות
export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) return err('חסרים פרטים')

  const { data: user, error } = await supabase
    .from('users')
    .select('id,username,password_hash,name,role,company_id,avatar,avatar_color,ceo_interface,field_worker')
    .eq('username', username.trim().toLowerCase())
    .single()

  if (error || !user) return err('שם משתמש או סיסמה שגויים', 401)

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return err('שם משתמש או סיסמה שגויים', 401)

  setSessionCookie({
    id:      user.id,
    username: user.username,
    name:    user.name,
    role:    user.role,
    company: user.company_id,
  })

  return ok({
    id:           user.id,
    username:     user.username,
    name:         user.name,
    role:         user.role,
    company:      user.company_id,
    avatar:       user.avatar,
    avatarColor:  user.avatar_color,
    ceoInterface: user.ceo_interface,
    fieldWorker:  user.field_worker,
  })
}

// DELETE — התנתקות
export async function DELETE() {
  clearSessionCookie()
  return ok({ ok: true })
}
