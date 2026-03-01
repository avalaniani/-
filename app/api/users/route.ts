import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'
import { hashPassword } from '@/lib/auth'

const SAFE_COLS = 'id,username,name,role,company_id,avatar,avatar_color,id_type,id_number,ceo_interface,field_worker'

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('company_id')

  let q = supabase.from('users').select(SAFE_COLS).order('name')

  if (session.role === 'admin') {
    if (companyId) q = q.eq('company_id', companyId)
  } else if (session.role === 'worker') {
    q = q.eq('id', session.id)
  } else {
    q = q.eq('company_id', session.company)
  }

  const { data, error } = await q
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (!['admin','ceo','employee'].includes(session.role)) return err('Forbidden', 403)

  const body = await req.json()
  if (!body.username || !body.password || !body.name) return err('חסרים שדות חובה')

  // בדוק אם שם משתמש קיים
  const { data: exists } = await supabase.from('users')
    .select('id').eq('username', body.username).single()
  if (exists) return err('שם משתמש כבר קיים')

  const hash = await hashPassword(body.password)
  const colors: Record<string,string> = { ceo:'#60a5fa', employee:'#4ade80', worker:'#fb923c' }
  const avatars: Record<string,string> = { ceo:'🏢', employee:'💼', worker:'🔧' }

  const { data, error } = await supabase.from('users').insert({
    username:     body.username,
    password_hash: hash,
    name:         body.name,
    role:         body.role || 'worker',
    company_id:   body.company_id || session.company,
    avatar:       body.avatar       || avatars[body.role] || '💼',
    avatar_color: body.avatar_color || colors[body.role]  || '#60a5fa',
    id_type:      body.id_type   || 'id',
    id_number:    body.id_number || null,
    ceo_interface: false,
    field_worker:  false,
  }).select(SAFE_COLS).single()

  if (error) return err(error.message, 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return err('Missing id')

  // הגנה: עובד/פועל יכול לעדכן רק את עצמו, ורק סיסמה
  if (session.role === 'worker' && id !== session.id) return err('Forbidden', 403)

  const allowed: Record<string,unknown> = {}
  if (updates.name          !== undefined) allowed.name          = updates.name
  if (updates.username      !== undefined) allowed.username      = updates.username
  if (updates.role          !== undefined) allowed.role          = updates.role
  if (updates.company_id    !== undefined) allowed.company_id    = updates.company_id
  if (updates.id_type       !== undefined) allowed.id_type       = updates.id_type
  if (updates.id_number     !== undefined) allowed.id_number     = updates.id_number
  if (updates.avatar        !== undefined) allowed.avatar        = updates.avatar
  if (updates.avatar_color  !== undefined) allowed.avatar_color  = updates.avatar_color
  if (updates.ceo_interface !== undefined) allowed.ceo_interface = updates.ceo_interface
  if (updates.field_worker  !== undefined) allowed.field_worker  = updates.field_worker
  if (updates.password      !== undefined) allowed.password_hash = await hashPassword(updates.password)

  const { data, error } = await supabase.from('users').update(allowed).eq('id', id).select(SAFE_COLS).single()
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (!['admin','ceo','employee'].includes(session.role)) return err('Forbidden', 403)

  const { id } = await req.json()
  // ceo יכול למחוק רק ממחברה שלו
  if (session.role !== 'admin') {
    const { data: u } = await supabase.from('users').select('company_id').eq('id', id).single()
    if (u?.company_id !== session.company) return err('Forbidden', 403)
  }

  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
