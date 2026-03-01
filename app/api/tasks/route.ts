import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  let q = supabase.from('tasks').select('*,subtasks(*)').order('created_at', { ascending: false })

  if (session.role === 'worker') {
    return ok([]) // פועלים אין משימות
  } else if (session.role === 'employee' && !session.company) {
    q = q.eq('assigned_to', session.id)
  } else if (session.role !== 'admin') {
    q = q.eq('company_id', session.company)
  }

  const { data, error } = await q
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const body = await req.json()
  if (!body.title) return err('חסרת כותרת')

  // subtask
  if (body._type === 'subtask') {
    const { data, error } = await supabase.from('subtasks')
      .insert({ task_id: body.task_id, title: body.title, done: false })
      .select('*').single()
    if (error) return err(error.message, 500)
    return ok(data)
  }

  const { data, error } = await supabase.from('tasks').insert({
    title:         body.title,
    description:   body.description || '',
    assigned_to:   body.assigned_to || session.id,
    assigned_by:   session.id,
    company_id:    body.company_id || session.company,
    priority:      body.priority   || 'medium',
    due_date:      body.due_date   || null,
    created_by_emp: body.created_by_emp || false,
  }).select('*').single()

  if (error) return err(error.message, 500)
  return ok({ ...data, subtasks: [] })
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const body = await req.json()
  const { id, _type, ...updates } = body

  // עדכון subtask
  if (_type === 'subtask') {
    const { data, error } = await supabase.from('subtasks').update(updates).eq('id', id).select('*').single()
    if (error) return err(error.message, 500)
    return ok(data)
  }

  const allowed: Record<string,unknown> = {}
  if (updates.title       !== undefined) allowed.title       = updates.title
  if (updates.description !== undefined) allowed.description = updates.description
  if (updates.status      !== undefined) allowed.status      = updates.status
  if (updates.priority    !== undefined) allowed.priority    = updates.priority
  if (updates.due_date    !== undefined) allowed.due_date    = updates.due_date
  if (updates.assigned_to !== undefined) allowed.assigned_to = updates.assigned_to

  const { data, error } = await supabase.from('tasks').update(allowed).eq('id', id).select('*').single()
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const body = await req.json()
  const { id, _type } = body

  if (_type === 'subtask') {
    const { error } = await supabase.from('subtasks').delete().eq('id', id)
    if (error) return err(error.message, 500)
    return ok({ ok: true })
  }

  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
