import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

// ─── helper: בודק שפועל שייך לחברה ───
async function workerBelongsToCompany(workerId: string | number, companyId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users').select('company_id').eq('id', workerId).single()
  return data?.company_id === companyId
}

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { searchParams } = new URL(req.url)
  const workerId = searchParams.get('worker_id')

  let q = supabase.from('worker_site_history')
    .select('*').order('from_date', { ascending: true })

  if (workerId) {
    // ─── תיקון: cross-tenant — ודא שהפועל שייך לחברה ───
    if (session.role !== 'admin') {
      const belongs = await workerBelongsToCompany(workerId, session.company!)
      if (!belongs) return err('Forbidden', 403)
    }
    q = q.eq('worker_id', workerId)
  } else if (session.role !== 'admin') {
    const { data: workers } = await supabase
      .from('users').select('id').eq('company_id', session.company)
    const ids = (workers || []).map(w => w.id)
    if (!ids.length) return ok([])
    q = q.in('worker_id', ids)
  }

  const { data, error } = await q
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (!['admin', 'ceo', 'employee'].includes(session.role)) return err('Forbidden', 403)

  const body = await req.json()
  const { worker_id, site_id, site_name, contractor, from_date, to_date } = body

  if (!worker_id || !site_id || !from_date) return err('חסרים שדות חובה')

  // ─── תיקון: ודא שהפועל שייך לחברה ───
  if (session.role !== 'admin') {
    const belongs = await workerBelongsToCompany(worker_id, session.company!)
    if (!belongs) return err('Forbidden', 403)
  }

  // ─── תיקון: ולידציית תאריך ───
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from_date)) return err('תאריך לא תקין', 400)

  const yesterday = (() => {
    const d = new Date(from_date)
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  })()

  await supabase.from('worker_site_history')
    .update({ to_date: yesterday })
    .eq('worker_id', worker_id)
    .is('to_date', null)

  const { data, error } = await supabase.from('worker_site_history').insert({
    worker_id,
    site_id,
    site_name:   site_name  || '',
    contractor:  contractor || '',
    from_date,
    to_date:     to_date || null,
  }).select('*').single()

  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { id, from_date, to_date } = await req.json()
  if (!id) return err('Missing id')

  // ─── תיקון: בדיקת ownership — ודא שהרשומה שייכת לחברה ───
  if (session.role !== 'admin') {
    const { data: record } = await supabase
      .from('worker_site_history').select('worker_id').eq('id', id).single()
    if (!record) return err('רשומה לא נמצאה', 404)
    const belongs = await workerBelongsToCompany(record.worker_id, session.company!)
    if (!belongs) return err('Forbidden', 403)
  }

  const allowed: Record<string, unknown> = {}
  if (from_date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from_date)) return err('תאריך לא תקין', 400)
    allowed.from_date = from_date
  }
  if (to_date !== undefined) {
    if (to_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(to_date)) return err('תאריך לא תקין', 400)
    allowed.to_date = to_date
  }

  if (Object.keys(allowed).length === 0) return err('אין שדות לעדכון', 400)

  const { data, error } = await supabase.from('worker_site_history')
    .update(allowed).eq('id', id).select('*').single()
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (!['admin', 'ceo', 'employee'].includes(session.role)) return err('Forbidden', 403)

  const { id } = await req.json()
  if (!id) return err('Missing id')

  // ─── תיקון: בדיקת ownership לפני מחיקה ───
  if (session.role !== 'admin') {
    const { data: record } = await supabase
      .from('worker_site_history').select('worker_id').eq('id', id).single()
    if (!record) return err('רשומה לא נמצאה', 404)
    const belongs = await workerBelongsToCompany(record.worker_id, session.company!)
    if (!belongs) return err('Forbidden', 403)
  }

  const { error } = await supabase.from('worker_site_history').delete().eq('id', id)
  if (error) return err('שגיאת שרת', 500)
  return ok({ ok: true })
}
