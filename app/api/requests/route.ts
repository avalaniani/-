// app/api/requests/route.ts
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, ok, err } from '@/lib/api'

// GET /api/requests
export async function GET(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (session.role === 'worker') {
    // Workers see only their own requests
    query = query.eq('worker_id', session.userId)
  } else {
    // CEO/field-worker see company requests
    query = query.eq('company_id', session.companyId)
  }

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return err(error.message, 500)
  return ok(data)
}

// POST /api/requests — worker submits a request
export async function POST(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session
  if (session.role !== 'worker') return err('רק פועלים יכולים לשלוח פניות', 403)

  const { type, text } = await req.json()
  if (!type || !text) return err('type ו-text הם שדות חובה')

  // Get worker name
  const { data: user } = await supabase
    .from('users').select('name').eq('id', session.userId).single()

  const { data, error } = await supabase
    .from('requests')
    .insert({
      worker_id: session.userId,
      worker_name: user?.name || 'פועל',
      company_id: session.companyId,
      type,
      text,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok(data, 201)
}

// PATCH /api/requests — update status or reply (CEO/field-worker)
export async function PATCH(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session
  if (session.role === 'worker') return err('Forbidden', 403)

  const { id, status, reply } = await req.json()
  if (!id) return err('Request ID required')

  const updates: Record<string, unknown> = {}
  if (status !== undefined) updates.status = status
  if (reply !== undefined) updates.reply = reply

  const { data, error } = await supabase
    .from('requests').update(updates).eq('id', id).select().single()

  if (error) return err(error.message, 500)
  return ok(data)
}

// DELETE /api/requests — CEO only (not field-workers)
export async function DELETE(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  // Field workers cannot delete
  if (session.role === 'employee' && session.fieldWorker) return err('Forbidden', 403)
  if (!['admin', 'ceo'].includes(session.role) && !session.ceoInterface) {
    return err('Forbidden', 403)
  }

  const { id } = await req.json()
  if (!id) return err('Request ID required')

  const { error } = await supabase.from('requests').delete().eq('id', id)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
