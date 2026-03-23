import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  let q = supabase.from('requests').select('*').order('created_at', { ascending: false })

  if (session.role === 'worker') {
    q = q.eq('worker_id', session.id)
  } else if (session.role !== 'admin') {
    q = q.eq('company_id', session.company)
  }

  const { data, error } = await q
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { type, text } = await req.json()
  if (!type || !text?.trim()) return err('חסרים שדות חובה')

  // ─── תיקון: ולידציית אורך ───
  if (text.trim().length > 2000) return err('הטקסט ארוך מדי')

  const { data, error } = await supabase.from('requests').insert({
    worker_id:   session.id,
    worker_name: session.name,
    company_id:  session.company,
    type,
    text:        text.trim(),
    status:      'pending',
    reply:       '',
  }).select('*').single()

  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { id, ...updates } = await req.json()
  if (!id) return err('Missing id')

  // ─── תיקון: בדיקת ownership לפני עדכון ───
  const { data: existing } = await supabase
    .from('requests').select('company_id, worker_id').eq('id', id).single()

  if (!existing) return err('פנייה לא נמצאה', 404)

  // worker: רק פניות שלו, ורק status (לא reply)
  if (session.role === 'worker') {
    if (String(existing.worker_id) !== String(session.id)) return err('Forbidden', 403)
    // פועל לא יכול לשנות reply או לסגור פנייה
    if (updates.reply !== undefined) return err('Forbidden', 403)
    if (updates.status === 'approved' || updates.status === 'rejected') return err('Forbidden', 403)
  } else if (session.role !== 'admin') {
    // ceo/employee: רק פניות של החברה שלהם
    if (existing.company_id !== session.company) return err('Forbidden', 403)
  }

  const allowed: Record<string, unknown> = {}
  if (updates.status !== undefined) allowed.status = updates.status
  if (updates.reply  !== undefined) allowed.reply  = updates.reply

  if (Object.keys(allowed).length === 0) return err('אין שדות לעדכון', 400)

  const { data, error } = await supabase.from('requests')
    .update(allowed).eq('id', id).select('*').single()
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { id } = await req.json()
  if (!id) return err('Missing id')

  const { data: existing } = await supabase
    .from('requests').select('worker_id, company_id').eq('id', id).single()
  if (!existing) return err('פנייה לא נמצאה', 404)

  if (session.role === 'worker') {
    if (String(existing.worker_id) !== String(session.id)) return err('Forbidden', 403)
  } else if (session.role !== 'admin') {
    if (existing.company_id !== session.company) return err('Forbidden', 403)
  }

  const { error } = await supabase.from('requests').delete().eq('id', id)
  if (error) return err('שגיאת שרת', 500)
  return ok({ ok: true })
}
