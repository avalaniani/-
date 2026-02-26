// app/api/hours/route.ts
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, ok, err } from '@/lib/api'

// GET /api/hours?worker_id=&year=&month=
export async function GET(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { searchParams } = new URL(req.url)
  const workerId = searchParams.get('worker_id')
  const year = searchParams.get('year')
  const month = searchParams.get('month') // 0-indexed

  // Workers can only see their own hours
  const targetWorkerId = session.role === 'worker' ? session.userId : workerId

  let query = supabase
    .from('worker_hours')
    .select('*')
    .order('work_date')

  if (targetWorkerId) query = query.eq('worker_id', targetWorkerId)

  // Filter by month if provided
  if (year && month !== null) {
    const monthNum = parseInt(month) + 1 // convert 0-indexed to 1-indexed
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`
    const endDate = new Date(parseInt(year), monthNum, 0)
      .toISOString().split('T')[0]
    query = query.gte('work_date', startDate).lte('work_date', endDate)
  }

  const { data, error } = await query
  if (error) return err(error.message, 500)

  // Also fetch signatures for the period
  let signatures: unknown[] = []
  if (targetWorkerId && year && month !== null) {
    const { data: sigs } = await supabase
      .from('signatures')
      .select('*')
      .eq('worker_id', targetWorkerId)
      .eq('year', year)
      .eq('month', month)
    signatures = sigs || []
  }

  return ok({ hours: data, signatures })
}

// POST /api/hours — upsert a day's hours
export async function POST(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { worker_id, work_date, hours, note, start_time, end_time } = await req.json()
  if (!work_date) return err('work_date required')

  // Workers can only update their own hours
  const targetWorkerId = session.role === 'worker' ? session.userId : worker_id
  if (!targetWorkerId) return err('worker_id required')

  // Block future dates for workers
  if (session.role === 'worker') {
    const today = new Date().toISOString().split('T')[0]
    if (work_date > today) return err('לא ניתן להזין שעות לתאריך עתידי', 403)
  }

  const { data, error } = await supabase
    .from('worker_hours')
    .upsert({ worker_id: targetWorkerId, work_date, hours, note, start_time, end_time },
             { onConflict: 'worker_id,work_date' })
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok(data)
}

// DELETE /api/hours — clear a day
export async function DELETE(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { worker_id, work_date } = await req.json()
  const targetWorkerId = session.role === 'worker' ? session.userId : worker_id

  const { error } = await supabase
    .from('worker_hours')
    .delete()
    .eq('worker_id', targetWorkerId)
    .eq('work_date', work_date)

  if (error) return err(error.message, 500)
  return ok({ ok: true })
}

// POST /api/hours/sign — sign a month
export async function PUT(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session
  if (!['ceo', 'admin'].includes(session.role)) {
    // Allow ceoInterface employees
    if (!(session.role === 'employee' && session.ceoInterface)) {
      return err('Forbidden', 403)
    }
  }

  const { worker_id, year, month, type, days, sig_password } = await req.json()

  // Verify sig_password against company
  if (sig_password !== undefined) {
    const { data: company } = await supabase
      .from('companies')
      .select('sig_password')
      .eq('id', session.companyId)
      .single()
    if (company?.sig_password && company.sig_password !== sig_password) {
      return err('סיסמת חתימה שגויה', 401)
    }
  }

  const { data, error } = await supabase
    .from('signatures')
    .upsert({ worker_id, year, month, type, days, company_id: session.companyId },
             { onConflict: 'worker_id,year,month' })
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok(data)
}
