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

  if (workerId) q = q.eq('worker_id', workerId)
  if (year && month) {
    const pad = (n: string) => n.padStart(2,'0')
    const start = `${year}-${pad(month)}-01`
    const end   = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
    q = q.gte('work_date', start).lte('work_date', end)
  }

  const { data, error } = await q
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const body = await req.json()
  const { worker_id, work_date, hours, start_time, end_time, note } = body

  // פועל יכול לכתוב רק לעצמו
  if (session.role === 'worker' && worker_id !== session.id) return err('Forbidden', 403)

  const { data, error } = await supabase.from('worker_hours').upsert({
    worker_id, work_date,
    hours:      parseFloat(hours) || 0,
    start_time: start_time || null,
    end_time:   end_time   || null,
    note:       note       || null,
  }, { onConflict: 'worker_id,work_date' }).select('*').single()

  if (error) return err(error.message, 500)
  return ok(data)
}
