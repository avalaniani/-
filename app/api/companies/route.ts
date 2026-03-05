import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  let q = supabase.from('companies').select('*').order('name')
  if (session.role !== 'admin' && session.company)
    q = q.eq('id', session.company)

  const { data, error } = await q
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (session.role !== 'admin') return err('Forbidden', 403)

  const body = await req.json()
  if (!body.name?.trim()) return err('חסר שם חברה')

  // תמיכה בשמות עבריים — אם אין אותיות לטיניות, משתמשים ב-timestamp
  let id = body.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  if (!id) {
    // שם עברי — צור id ייחודי מ-timestamp
    id = 'co_' + Date.now().toString(36)
  }

  // ודא ייחודיות — אם ה-id כבר קיים הוסף suffix
  const { data: existing } = await supabase.from('companies').select('id').eq('id', id).single()
  if (existing) id = id + '_' + Math.random().toString(36).slice(2, 6)

  const { data, error } = await supabase.from('companies')
    .insert({
      id,
      name:  body.name.trim(),
      field: body.field || 'כללי',
      emoji: body.emoji || '🏢',
      color: body.color || '#6c63ff',
    })
    .select('*').single()

  if (error) return err(error.message, 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON body', 400)
  }

  const { id, ...updates } = body
  if (!id) return err('Missing id')

  // מנכ"ל יכול לעדכן רק את החברה שלו
  if (session.role !== 'admin' && id !== session.company) return err('Forbidden', 403)

  const allowed: Record<string, unknown> = {}
  if (updates.name         !== undefined) allowed.name         = updates.name
  if (updates.field        !== undefined) allowed.field        = updates.field
  if (updates.emoji        !== undefined) allowed.emoji        = updates.emoji
  if (updates.color        !== undefined) allowed.color        = updates.color
  if (updates.sig_password !== undefined) allowed.sig_password = updates.sig_password

  if (Object.keys(allowed).length === 0) return err('No fields to update', 400)

  const { data, error } = await supabase.from('companies').update(allowed).eq('id', id).select('*').single()
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (session.role !== 'admin') return err('Forbidden', 403)

  const { id } = await req.json()
  if (!id) return err('Missing id')

  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
