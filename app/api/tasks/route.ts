import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  let q = supabase.from('tasks').select('*,subtasks(*)').order('created_at', { ascending: false })

  if (session.role === 'worker') {
    return ok([])
  } else if (session.role === 'employee' && !session.company) {
    q = q.eq('assigned_to', session.id)
  } else if (session.role !== 'admin') {
    q = q.eq('company_id', session.company)
  }

  const { data, error } = await q
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (session.role === 'worker') return err('Forbidden', 403)

  const body = await req.json()
  if (!body.title?.trim()) return err('חסרת כותרת')
  if (body.title.length > 200) return err('כותרת ארוכה מדי')

  if (body._type === 'subtask') {
    // ─── תיקון: ודא שה-task שייך לחברה ───
    if (session.role !== 'admin') {
      const { data: task } = await supabase
        .from('tasks').select('company_id').eq('id', body.task_id).single()
      if (!task) return err('משימה לא נמצאה', 404)
      if (task.company_id !== session.company) return err('Forbidden', 403)
    }

    const { data, error } = await supabase.from('subtasks')
      .insert({ task_id: body.task_id, title: body.title.trim(), done: false })
      .select('*').single()
    if (error) return err('שגיאת שרת', 500)
    return ok(data)
  }

  // ─── תיקון: company_id תמיד מ-session, לא מה-body ───
  const companyId = session.role === 'admin'
    ? (body.company_id || session.company)
    : session.company

  const { data, error } = await supabase.from('tasks').insert({
    title:          body.title.trim(),
    description:    body.description?.slice(0, 2000) || '',
    assigned_to:    body.assigned_to || session.id,
    assigned_by:    session.id,
    company_id:     companyId,
    priority:       ['high', 'medium', 'low'].includes(body.priority) ? body.priority : 'medium',
    due_date:       body.due_date || null,
    created_by_emp: body.created_by_emp || false,
  }).select('*').single()

  if (error) return err('שגיאת שרת', 500)
  return ok({ ...data, subtasks: [] })
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (session.role === 'worker') return err('Forbidden', 403)

  const body = await req.json()
  const { id, _type, ...updates } = body

  if (_type === 'subtask') {
    // ─── תיקון: ודא שה-subtask שייך לחברה ───
    if (session.role !== 'admin') {
      const { data: sub } = await supabase
        .from('subtasks').select('task_id').eq('id', id).single()
      if (!sub) return err('לא נמצא', 404)
      const { data: task } = await supabase
        .from('tasks').select('company_id').eq('id', sub.task_id).single()
      if (!task || task.company_id !== session.company) return err('Forbidden', 403)
    }

    const allowed: Record<string, unknown> = {}
    if (updates.title !== undefined) allowed.title = updates.title
    if (updates.done  !== undefined) allowed.done  = updates.done

    const { data, error } = await supabase
      .from('subtasks').update(allowed).eq('id', id).select('*').single()
    if (error) return err('שגיאת שרת', 500)
    return ok(data)
  }

  // ─── תיקון: בדיקת ownership ───
  const { data: existing } = await supabase
    .from('tasks').select('company_id').eq('id', id).single()
  if (!existing) return err('משימה לא נמצאה', 404)
  if (session.role !== 'admin' && existing.company_id !== session.company) {
    return err('Forbidden', 403)
  }

  const allowed: Record<string, unknown> = {}
  if (updates.title       !== undefined) allowed.title       = updates.title?.slice(0, 200)
  if (updates.description !== undefined) allowed.description = updates.description?.slice(0, 2000)
  if (updates.status      !== undefined) allowed.status      = updates.status
  if (updates.priority    !== undefined) {
    if (['high', 'medium', 'low'].includes(updates.priority))
      allowed.priority = updates.priority
  }
  if (updates.due_date    !== undefined) allowed.due_date    = updates.due_date
  if (updates.assigned_to !== undefined) allowed.assigned_to = updates.assigned_to

  const { data, error } = await supabase
    .from('tasks').update(allowed).eq('id', id).select('*').single()
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (session.role === 'worker') return err('Forbidden', 403)

  const body = await req.json()
  const { id, _type } = body

  if (_type === 'subtask') {
    // ─── תיקון: ודא ownership ───
    if (session.role !== 'admin') {
      const { data: sub } = await supabase
        .from('subtasks').select('task_id').eq('id', id).single()
      if (!sub) return err('לא נמצא', 404)
      const { data: task } = await supabase
        .from('tasks').select('company_id').eq('id', sub.task_id).single()
      if (!task || task.company_id !== session.company) return err('Forbidden', 403)
    }

    const { error } = await supabase.from('subtasks').delete().eq('id', id)
    if (error) return err('שגיאת שרת', 500)
    return ok({ ok: true })
  }

  // ─── תיקון: בדיקת ownership לפני מחיקה ───
  const { data: existing } = await supabase
    .from('tasks').select('company_id').eq('id', id).single()
  if (!existing) return err('משימה לא נמצאה', 404)
  if (session.role !== 'admin' && existing.company_id !== session.company) {
    return err('Forbidden', 403)
  }

  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return err('שגיאת שרת', 500)
  return ok({ ok: true })
}
