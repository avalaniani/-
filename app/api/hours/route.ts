import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { searchParams } = new URL(req.url)
  const workerId = searchParams.get('worker_id')
  const year     = searchParams.get('year')
  const month    = searchParams.get('month')

  let q = supabase.from('worker_hours').select('*')

  if (workerId) {
    // ─── תיקון: cross-tenant protection ───
    // פועל: רק עצמו
    if (session.role === 'worker') {
      if (String(workerId) !== String(session.id)) return err('Forbidden', 403)
      q = q.eq('worker_id', workerId)
    } else if (session.role === 'admin') {
      // admin: כל פועל
      q = q.eq('worker_id', workerId)
    } else {
      // ceo/employee: רק פועלים מהחברה שלהם
      const { data: workerData } = await supabase
        .from('users').select('company_id').eq('id', workerId).single()
      if (!workerData) return err('פועל לא נמצא', 404)
      if (workerData.company_id !== session.company) return err('Forbidden', 403)
      q = q.eq('worker_id', workerId)
    }
  } else {
    // ─── ללא worker_id: מחזיר רק פועלים של החברה ───
    if (session.role === 'worker') {
      q = q.eq('worker_id', session.id)
    } else if (session.role !== 'admin') {
      const { data: workers } = await supabase
        .from('users').select('id').eq('company_id', session.company).eq('role', 'worker')
      const ids = (workers || []).map(w => w.id)
      if (!ids.length) return ok([])
      q = q.in('worker_id', ids)
    }
  }

  if (year && month) {
    const pad = (n: string) => n.padStart(2, '0')
    const y = parseInt(year), m = parseInt(month)
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) return err('תאריך לא תקין', 400)
    const start = `${y}-${pad(String(m))}-01`
    const end   = new Date(y, m, 0).toISOString().split('T')[0]
    q = q.gte('work_date', start).lte('work_date', end)
  }

  const { data, error } = await q
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const body = await req.json()
  const { worker_id, work_date, hours, start_time, end_time, note } = body

  // ─── תיקון: worker יכול לכתוב רק לעצמו ───
  if (session.role === 'worker' && String(worker_id) !== String(session.id)) {
    return err('Forbidden', 403)
  }

  // ─── תיקון: ceo/employee יכולים לכתוב רק לפועלים של החברה שלהם ───
  if (!['admin', 'worker'].includes(session.role)) {
    const { data: workerData } = await supabase
      .from('users').select('company_id').eq('id', worker_id).single()
    if (!workerData) return err('פועל לא נמצא', 404)
    if (workerData.company_id !== session.company) return err('Forbidden', 403)
  }

  // ─── תיקון: ולידציית שעות ───
  const parsedHours = parseFloat(hours)
  if (!isNaN(parsedHours) && (parsedHours < 0 || parsedHours > 24)) {
    return err('מספר שעות לא תקין (0–24)', 400)
  }

  // ─── תיקון: ולידציית תאריך ───
  if (!work_date || !/^\d{4}-\d{2}-\d{2}$/.test(work_date)) {
    return err('תאריך לא תקין', 400)
  }

  const { data, error } = await supabase.from('worker_hours').upsert({
    worker_id,
    work_date,
    hours:      isNaN(parsedHours) ? 0 : parsedHours,
    start_time: start_time || null,
    end_time:   end_time   || null,
    note:       note       || null,
  }, { onConflict: 'worker_id,work_date' }).select('*').single()

  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}
