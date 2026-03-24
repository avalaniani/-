import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  let q = supabase.from('work_sites').select('*').order('name')

  if (session.role === 'admin') {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('company_id')
    if (companyId) q = q.eq('company_id', companyId)
  } else {
    q = q.eq('company_id', session.company)
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
  if (!body.name?.trim()) return err('חסר שם אתר')
  if (body.name.length > 100) return err('שם ארוך מדי')

  // ─── תיקון: company_id תמיד מ-session, לא מה-body ───
  // מונע CEO מחברה A ליצור אתר תחת חברה B
  const companyId = session.role === 'admin'
    ? (body.company_id || body.companyId || session.company)
    : session.company

  // ─── תיקון: ולידציית site_price ───
  const sitePrice = parseFloat(body.site_price)
  if (!isNaN(sitePrice) && sitePrice < 0) return err('מחיר לא יכול להיות שלילי')

  const { data, error } = await supabase.from('work_sites').insert({
    company_id:  companyId,
    name:        body.name.trim(),
    contractor:  body.contractor?.slice(0, 100)  || '',
    address:     body.address?.slice(0, 200)      || '',
    phone:       body.phone?.slice(0, 20)         || '',
    price_type:  body.price_type                  || '',
    site_price:  isNaN(sitePrice) ? 0 : sitePrice,
  }).select('*').single()

  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (!['admin', 'ceo', 'employee'].includes(session.role)) return err('Forbidden', 403)

  const { id, ...updates } = await req.json()
  if (!id) return err('Missing id')

  // ─── תיקון: בדיקת ownership לפני עדכון ───
  if (session.role !== 'admin') {
    const { data: site } = await supabase
      .from('work_sites').select('company_id').eq('id', id).single()
    if (!site) return err('אתר לא נמצא', 404)
    if (site.company_id !== session.company) return err('Forbidden', 403)
  }

  const allowed: Record<string, unknown> = {}
  if (updates.name                  !== undefined) allowed.name                  = updates.name?.slice(0, 100)
  if (updates.contractor            !== undefined) allowed.contractor            = updates.contractor?.slice(0, 100)
  if (updates.address               !== undefined) allowed.address               = updates.address?.slice(0, 200)
  if (updates.phone                 !== undefined) allowed.phone                 = updates.phone?.slice(0, 20)
  if (updates.price_type            !== undefined) allowed.price_type            = updates.price_type
  if (updates.site_price            !== undefined) allowed.site_price            = parseFloat(updates.site_price) || 0
  if (updates.contractor_price_type !== undefined) allowed.contractor_price_type = updates.contractor_price_type
  if (updates.contractor_price      !== undefined) allowed.contractor_price      = parseFloat(updates.contractor_price) || 0

  // ─── תיקון: מניעת שינוי company_id דרך body ───
  // admin בלבד יכול להעביר אתר בין חברות
  if (session.role === 'admin' && updates.companyId !== undefined) {
    allowed.company_id = updates.companyId
  }

  if (Object.keys(allowed).length === 0) return err('אין שדות לעדכון', 400)

  const { data, error } = await supabase.from('work_sites')
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

  if (session.role !== 'admin') {
    const { data: site } = await supabase
      .from('work_sites').select('company_id').eq('id', id).single()
    if (!site) return err('אתר לא נמצא', 404)
    if (site.company_id !== session.company) return err('Forbidden', 403)
  }

  const { error } = await supabase.from('work_sites').delete().eq('id', id)
  if (error) return err('שגיאת שרת', 500)
  return ok({ ok: true })
}
