// app/api/auth/route.ts
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPassword, setSessionCookie, clearSessionCookie, getSession } from '@/lib/auth'
import { ok, err } from '@/lib/api'

// POST /api/auth — login
export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) return err('נא להזין שם משתמש וסיסמה')

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.trim().toLowerCase())
    .single()

  if (error || !user) return err('שם משתמש או סיסמה שגויים', 401)

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return err('שם משתמש או סיסמה שגויים', 401)

  // Build session (never include password_hash)
  const session = {
    userId: user.id,
    username: user.username,
    role: user.role,
    companyId: user.company_id,
    ceoInterface: user.ceo_interface,
    fieldWorker: user.field_worker,
  }

  setSessionCookie(session)

  // Return safe user object (no password)
  const { password_hash: _, ...safeUser } = user
  return ok({ user: safeUser, session })
}

// DELETE /api/auth — logout
export async function DELETE() {
  clearSessionCookie()
  return ok({ ok: true })
}

// GET /api/auth — get current session + user
export async function GET() {
  const session = getSession()
  if (!session) return err('Not authenticated', 401)

  const { data: user } = await supabase
    .from('users')
    .select('id, username, name, role, company_id, avatar, avatar_color, id_type, id_number, ceo_interface, field_worker')
    .eq('id', session.userId)
    .single()

  if (!user) return err('User not found', 404)
  return ok({ user, session })
}
