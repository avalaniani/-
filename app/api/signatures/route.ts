import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('company_id') || session.company

  const { data, error } = await supabase.from('signatures')
    .select('*').eq('company_id', companyId)
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { worker_id, year, month, type, days, sig_password } = await req.json()

  // אמת סיסמת חתימה
  const { data: company } = await supabase.from('companies')
    .select('sig_password').eq('id', session.company).single()

  if (company?.sig_password && company.sig_password !== sig_password)
    return err('סיסמה שגויה', 401)

  const { data, error } = await supabase.from('signatures').upsert({
    worker_id, company_id: session.company, year, month, type, days,
  }, { onConflict: 'worker_id,year,month' }).select('*').single()

  if (error) return err(error.message, 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { worker_id, year, month } = await req.json()
  if (!['admin','ceo','employee'].includes(session.role)) return err('Forbidden', 403)

  const { error } = await supabase.from('signatures')
    .delete().eq('worker_id', worker_id).eq('year', year).eq('month', month)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
