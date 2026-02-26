// app/api/users/route.ts
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'
import { requireAuth, ok, err } from '@/lib/api'

const SAFE_FIELDS = 'id, username, name, role, company_id, avatar, avatar_color, id_type, id_number, ceo_interface, field_worker, created_at'

// GET /api/users — filtered by role/company
export async function GET(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const companyId = searchParams.get('company_id')

  let query = supabase.from('users').select(SAFE_FIELDS).order('name')

  // Non-admins can only see users in their company
  if (session.role !== 'admin') {
    query = query.eq('company_id', session.companyId)
  } else if (companyId) {
    query = query.eq('company_id', companyId)
  }

  if (role) query = query.eq('role', role)

  const { data, error } = await query
  if (error) return err(error.message, 500)
  return ok(data)
}

// POST /api/users — create user (admin or ceo)
export async function POST(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session
  if (!['admin', 'ceo'].includes(session.role)) return err('Forbidden', 403)

  const body = await req.json()
  const { username, password, name, role, company_id, avatar, avatar_color, id_type, id_number } = body

  if (!username || !password || !name || !role) return err('שדות חובה חסרים')

  // Ceo can only create employees/workers in their own company
  if (session.role === 'ceo') {
    if (!['employee', 'worker'].includes(role)) return err('Forbidden', 403)
    if (company_id !== session.companyId) return err('Forbidden', 403)
  }

  // Check username uniqueness
  const { data: existing } = await supabase
    .from('users').select('id').eq('username', username).single()
  if (existing) return err('שם משתמש כבר קיים במערכת')

  const password_hash = await hashPassword(password)

  const { data, error } = await supabase
    .from('users')
    .insert({ username, password_hash, name, role, company_id, avatar, avatar_color, id_type, id_number })
    .select(SAFE_FIELDS)
    .single()

  if (error) return err(error.message, 500)
  return ok(data, 201)
}

// PATCH /api/users — update user
export async function PATCH(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { id, password, ...updates } = await req.json()
  if (!id) return err('User ID required')

  // Only admin can change role/company
  if (session.role !== 'admin') {
    delete updates.role
    // Ceo can update their company's employees/workers only
    if (session.role === 'ceo') {
      const { data: target } = await supabase.from('users').select('company_id').eq('id', id).single()
      if (target?.company_id !== session.companyId) return err('Forbidden', 403)
    } else {
      // Regular user can only update themselves
      if (id !== session.userId) return err('Forbidden', 403)
    }
  }

  // Hash new password if provided
  if (password) {
    updates.password_hash = await hashPassword(password)
  }

  const { data, error } = await supabase
    .from('users').update(updates).eq('id', id).select(SAFE_FIELDS).single()

  if (error) return err(error.message, 500)
  return ok(data)
}

// DELETE /api/users
export async function DELETE(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { id } = await req.json()
  if (!id) return err('User ID required')

  // Only admin or ceo (for their company)
  if (session.role === 'ceo') {
    const { data: target } = await supabase.from('users').select('company_id').eq('id', id).single()
    if (target?.company_id !== session.companyId) return err('Forbidden', 403)
  } else if (session.role !== 'admin') {
    return err('Forbidden', 403)
  }

  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
