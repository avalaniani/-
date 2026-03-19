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
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (!['admin', 'ceo', 'employee'].includes(session.role)) return err('Forbidden', 403)

  const body = await req.json()
  if (!body.name?.trim()) return err('חסר שם אתר')

  const { data, error } = await supabase.from('work_sites').insert({
    company_id:  body.company_id || body.companyId || session.company,
    name:        body.name.trim(),
    contractor:  body.contractor  || '',
    address:     body.address     || '',
    phone:       body.phone       || '',
    price_type:  body.price_type  || '',
    site_price:  body.site_price  || 0,
  }).select('*').single()

  if (error) return err(error.message, 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (!['admin', 'ceo', 'employee'].includes(session.role)) return err('Forbidden', 403)

  const { id, ...updates } = await req.json()
  if (!id) return err('Missing id')

  const allowed: Record<string, unknown> = {}
  if (updates.name                 !== undefined) allowed.name                 = updates.name
  if (updates.contractor           !== undefined) allowed.contractor           = updates.contractor
  if (updates.address              !== undefined) allowed.address              = updates.address
  if (updates.phone                !== undefined) allowed.phone                = updates.phone
  if (updates.price_type           !== undefined) allowed.price_type           = updates.price_type
  if (updates.site_price           !== undefined) allowed.site_price           = updates.site_price
  if (updates.contractor_price_type !== undefined) allowed.contractor_price_type = updates.contractor_price_type
  if (updates.contractor_price     !== undefined) allowed.contractor_price     = updates.contractor_price
  if (updates.companyId            !== undefined) allowed.company_id           = updates.companyId

  const { data, error } = await supabase.from('work_sites')
    .update(allowed).eq('id', id).select('*').single()
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (!['admin', 'ceo', 'employee'].includes(session.role)) return err('Forbidden', 403)

  const { id } = await req.json()
  if (!id) return err('Missing id')

  // ודא שהאתר שייך לחברה של המשתמש (אלא אם admin)
  if (session.role !== 'admin') {
    const { data: site } = await supabase.from('work_sites')
      .select('company_id').eq('id', id).single()
    if (site?.company_id !== session.company) return err('Forbidden', 403)
  }

  const { error } = await supabase.from('work_sites').delete().eq('id', id)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
