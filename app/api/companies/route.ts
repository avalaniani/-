import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

// ─── תיקון: עמודות בטוחות — ללא sig_password וgemini_key ───
const PUBLIC_COLS  = 'id,name,field,emoji,color'
const PRIVATE_COLS = 'id,name,field,emoji,color,sig_password,gemini_key'

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  // ─── תיקון: sig_password וgemini_key רק לadmin ───
  // ceo רואה רק את החברה שלו, ורק שדות ציבוריים
  const cols = session.role === 'admin' ? PRIVATE_COLS : PUBLIC_COLS

  let q = supabase.from('companies').select(cols).order('name')
  if (session.role !== 'admin' && session.company)
    q = q.eq('id', session.company)

  const { data, error } = await q
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

// ─── endpoint נפרד לsig_password — רק לceo של החברה ───
// GET /api/companies/sig-password
export async function getSigPassword(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (!['admin', 'ceo'].includes(session.role)) return err('Forbidden', 403)

  const { data, error } = await supabase
    .from('companies')
    .select('sig_password')
    .eq('id', session.company!)
    .single()

  if (error) return err('שגיאת שרת', 500)
  return ok({ sig_password: data?.sig_password || null })
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (session.role !== 'admin') return err('Forbidden', 403)

  const body = await req.json()
  if (!body.name?.trim()) return err('חסר שם חברה')
  if (body.name.length > 100) return err('שם ארוך מדי')

  let id = body.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  if (!id) {
    id = 'co_' + Date.now().toString(36)
  }

  const { data: existing } = await supabase.from('companies').select('id').eq('id', id).single()
  if (existing) id = id + '_' + Math.random().toString(36).slice(2, 6)

  const { data, error } = await supabase.from('companies')
    .insert({
      id,
      name:  body.name.trim(),
      field: body.field || 'כללי',
      emoji: body.emoji || '🏢',
      color: body.color || '#6c63ff',
    })
    .select(PUBLIC_COLS).single()

  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON body', 400)
  }

  const { id, ...updates } = body
  if (!id) return err('Missing id')

  // מנכ"ל יכול לעדכן רק את החברה שלו
  if (session.role !== 'admin' && id !== session.company) return err('Forbidden', 403)

  const allowed: Record<string, unknown> = {}

  // שדות ציבוריים — כל ceo יכול לשנות
  if (updates.name  !== undefined) allowed.name  = updates.name
  if (updates.field !== undefined) allowed.field = updates.field
  if (updates.emoji !== undefined) allowed.emoji = updates.emoji
  if (updates.color !== undefined) allowed.color = updates.color

  // ─── תיקון: sig_password וgemini_key — רק admin ו-ceo של החברה ───
  if (['admin', 'ceo'].includes(session.role)) {
    if (updates.sig_password !== undefined) allowed.sig_password = updates.sig_password
    // ─── gemini_key: רק admin ───
    if (session.role === 'admin' && updates.gemini_key !== undefined) {
      allowed.gemini_key = updates.gemini_key
    }
  }

  if (Object.keys(allowed).length === 0) return err('No fields to update', 400)

  // ─── תגובה ללא sig_password וgemini_key ───
  const { data, error } = await supabase
    .from('companies').update(allowed).eq('id', id).select(PUBLIC_COLS).single()
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (session.role !== 'admin') return err('Forbidden', 403)

  const { id } = await req.json()
  if (!id) return err('Missing id')

  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) return err('שגיאת שרת', 500)
  return ok({ ok: true })
}
