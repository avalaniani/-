import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { searchParams } = new URL(req.url)
  const workerId = searchParams.get('worker_id')

  let q = supabase.from('worker_site_history')
    .select('*').order('from_date', { ascending: true })

  if (workerId) {
    q = q.eq('worker_id', workerId)
  } else if (session.role !== 'admin') {
    // החזר כל ההיסטוריה של החברה דרך join על users
    const { data: workers } = await supabase.from('users')
      .select('id').eq('company_id', session.company)
    const ids = (workers || []).map(w => w.id)
    if (!ids.length) return ok([])
    q = q.in('worker_id', ids)
  }

  const { data, error } = await q
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const body = await req.json()
  const { worker_id, site_id, site_name, contractor, from_date, to_date } = body

  if (!worker_id || !site_id || !from_date) return err('חסרים שדות חובה')

  // סגור רשומות פתוחות קודמות
  const yesterday = (() => {
    const d = new Date(from_date); d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  })()
  await supabase.from('worker_site_history')
    .update({ to_date: yesterday })
    .eq('worker_id', worker_id)
    .is('to_date', null)

  const { data, error } = await supabase.from('worker_site_history').insert({
    worker_id, site_id, site_name, contractor: contractor || '',
    from_date, to_date: to_date || null,
  }).select('*').single()

  if (error) return err(error.message, 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { id, from_date, to_date } = await req.json()
  if (!id) return err('Missing id')

  const allowed: Record<string, unknown> = {}
  if (from_date !== undefined) allowed.from_date = from_date
  if (to_date   !== undefined) allowed.to_date   = to_date

  const { data, error } = await supabase.from('worker_site_history')
    .update(allowed).eq('id', id).select('*').single()
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { id } = await req.json()
  if (!id) return err('Missing id')

  const { error } = await supabase.from('worker_site_history').delete().eq('id', id)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
