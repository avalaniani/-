import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function GET() {
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
  const id = body.name.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'')
  const { data, error } = await supabase.from('companies')
    .insert({ id, name: body.name, field: body.field||'כללי', emoji: body.emoji||'🏢', color: body.color||'#6c63ff' })
    .select('*').single()
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return err('Missing id')

  // מנכ"ל יכול לעדכן רק את החברה שלו
  if (session.role !== 'admin' && id !== session.company) return err('Forbidden', 403)

  const allowed: Record<string,unknown> = {}
  if (updates.name)         allowed.name         = updates.name
  if (updates.field)        allowed.field        = updates.field
  if (updates.emoji)        allowed.emoji        = updates.emoji
  if (updates.color)        allowed.color        = updates.color
  if (updates.sig_password) allowed.sig_password = updates.sig_password

  const { data, error } = await supabase.from('companies').update(allowed).eq('id', id).select('*').single()
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (session.role !== 'admin') return err('Forbidden', 403)

  const { id } = await req.json()
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
