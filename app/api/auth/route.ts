import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPassword, signToken, verifyToken } from '@/lib/auth'
import { ok, err } from '@/lib/api'

// GET — בדוק token מה-header
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return err('Not authenticated', 401)
  const token = auth.slice(7)
  const session = verifyToken(token)
  if (!session) return err('Invalid token', 401)
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

  const payload = {
    id:      user.id,
    username: user.username,
    name:    user.name,
    role:    user.role,
    company: user.company_id,
  }

  const token = signToken(payload)

  return ok({
    token,
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
  return ok({ ok: true })
}
