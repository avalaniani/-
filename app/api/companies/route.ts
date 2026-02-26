// app/api/companies/route.ts
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, ok, err } from '@/lib/api'

// GET /api/companies
export async function GET() {
  const session = requireAuth()
  if ('status' in session) return session

  let query = supabase.from('companies').select('*').order('name')

  // Non-admins see only their own company
  if (session.role !== 'admin') {
    if (!session.companyId) return ok([])
    query = query.eq('id', session.companyId)
  }

  const { data, error } = await query
  if (error) return err(error.message, 500)
  return ok(data)
}

// POST /api/companies — admin only
export async function POST(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session
  if (session.role !== 'admin') return err('Forbidden', 403)

  const body = await req.json()
  const { name, field, emoji, color } = body
  if (!name) return err('שם חברה הוא שדה חובה')

  const id = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  const { data, error } = await supabase
    .from('companies')
    .insert({ id, name, field, emoji: emoji || '🏢', color: color || '#6c63ff' })
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok(data, 201)
}

// PATCH /api/companies — update
export async function PATCH(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session
  if (session.role !== 'admin') return err('Forbidden', 403)

  const { id, ...updates } = await req.json()
  if (!id) return err('Company ID required')

  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok(data)
}

// DELETE /api/companies
export async function DELETE(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session
  if (session.role !== 'admin') return err('Forbidden', 403)

  const { id } = await req.json()
  if (!id) return err('Company ID required')

  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
