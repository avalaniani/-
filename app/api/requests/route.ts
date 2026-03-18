import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  let q = supabase.from('requests').select('*').order('created_at', { ascending: false })

  if (session.role === 'worker') q = q.eq('worker_id', session.id)
  else if (session.role !== 'admin') q = q.eq('company_id', session.company)

  const { data, error } = await q
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const body = await req.json()
  const { data: user } = await supabase.from('users')
    .select('name').eq('id', session.id).single()

  const { data, error } = await supabase.from('requests').insert({
    worker_id:   session.id,
    worker_name: user?.name || session.name,
    company_id:  session.company,
    type:        body.type,
    text:        body.text,
    status:      'pending',
  }).select('*').single()

  if (error) return err(error.message, 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const body = await req.json()
  const { id, ...updates } = body

  const allowed: Record<string,unknown> = {}
  if (updates.status !== undefined) allowed.status = updates.status
  if (updates.reply  !== undefined) allowed.reply  = updates.reply

  const { data, error } = await supabase.from('requests').update(allowed).eq('id', id).select('*').single()
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  // fieldWorker לא יכול למחוק
  if (session.role === 'worker') return err('Forbidden', 403)

  const { id } = await req.json()
  const { error } = await supabase.from('requests').delete().eq('id', id)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
