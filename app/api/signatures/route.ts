import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

// ─── helper: ודא שפועל שייך לחברת ה-session ───
async function workerBelongsToCompany(workerId: string | number, companyId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users').select('company_id').eq('id', workerId).single()
  return data?.company_id === companyId
}

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { searchParams } = new URL(req.url)
  const requestedCompanyId = searchParams.get('company_id')

  // ─── תיקון: CEO/עובד רק רואים את החברה שלהם ───
  let companyId: string
  if (session.role === 'admin') {
    companyId = requestedCompanyId || session.company!
  } else {
    // מתעלמים מה-query param — תמיד מחברת ה-session
    companyId = session.company!
  }

  if (!companyId) return err('חסר company_id', 400)

  const { data, error } = await supabase
    .from('signatures').select('*').eq('company_id', companyId)
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { worker_id, year, month, type, days, sig_password } = await req.json()

  if (!worker_id || !year || !month || !type) return err('חסרים שדות חובה')

  // ─── תיקון: ולידציית שנה/חודש ───
  const y = parseInt(year), m = parseInt(month)
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12 || y < 2000 || y > 2100) {
    return err('תאריך לא תקין', 400)
  }

  // ─── תיקון: ודא שהפועל שייך לחברת ה-session ───
  if (session.role !== 'admin') {
    const belongs = await workerBelongsToCompany(worker_id, session.company!)
    if (!belongs) return err('Forbidden', 403)
  }

  // ─── אימות סיסמת חתימה ───
  const { data: company } = await supabase
    .from('companies').select('sig_password').eq('id', session.company).single()

  if (company?.sig_password && company.sig_password !== sig_password) {
    return err('סיסמת חתימה שגויה', 401)
  }

  // ─── תיקון: company_id תמיד מ-session ───
  const { data, error } = await supabase.from('signatures').upsert({
    worker_id,
    company_id: session.company,   // לא מה-body!
    year: y,
    month: m,
    type,
    days,
  }, { onConflict: 'worker_id,year,month' }).select('*').single()

  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { worker_id, year, month, sig_password } = await req.json()

  if (!worker_id || !year || !month) return err('חסרים שדות חובה')

  // ─── תיקון: ודא שהפועל שייך לחברת ה-session ───
  if (session.role !== 'admin') {
    const belongs = await workerBelongsToCompany(worker_id, session.company!)
    if (!belongs) return err('Forbidden', 403)
  }

  // ─── פועל: חייב סיסמת חתימה ───
  if (session.role === 'worker') {
    // ─── תיקון: פועל יכול למחוק רק חתימה שלו ───
    if (String(worker_id) !== String(session.id)) return err('Forbidden', 403)

    const { data: company } = await supabase
      .from('companies').select('sig_password').eq('id', session.company).single()
    if (!sig_password || company?.sig_password !== sig_password) {
      return err('סיסמת חתימה שגויה', 401)
    }
  }

  // ─── תיקון: הוסף company_id לבדיקה כדי למנוע cross-company delete ───
  const companyId = session.role === 'admin' ? undefined : session.company!

  let q = supabase.from('signatures')
    .delete()
    .eq('worker_id', worker_id)
    .eq('year', year)
    .eq('month', month)

  if (companyId) q = q.eq('company_id', companyId)

  const { error } = await q
  if (error) return err('שגיאת שרת', 500)
  return ok({ ok: true })
}
