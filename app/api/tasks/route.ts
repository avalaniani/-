// app/api/tasks/route.ts
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, ok, err } from '@/lib/api'

// GET /api/tasks?company_id=&assigned_to=
export async function GET(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('company_id') || session.companyId
  const assignedTo = searchParams.get('assigned_to')

  let query = supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .order('created_at', { ascending: false })

  if (session.role === 'worker') {
    // Workers have no tasks page — but return empty just in case
    return ok([])
  }

  if (companyId) query = query.eq('company_id', companyId)
  if (assignedTo) query = query.eq('assigned_to', assignedTo)
  // Employees only see their own tasks
  if (session.role === 'employee' && !session.ceoInterface) {
    query = query.eq('assigned_to', session.userId)
  }

  const { data, error } = await query
  if (error) return err(error.message, 500)
  return ok(data)
}

// POST /api/tasks — create task
export async function POST(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session
  if (session.role === 'worker') return err('Forbidden', 403)

  const { title, description, assigned_to, priority, due_date, company_id } = await req.json()
  if (!title) return err('כותרת היא שדה חובה')

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      assigned_to: assigned_to || session.userId,
      assigned_by: session.userId,
      company_id: company_id || session.companyId,
      priority: priority || 'medium',
      due_date,
      created_by_emp: session.role === 'employee',
    })
    .select('*, subtasks(*)')
    .single()

  if (error) return err(error.message, 500)
  return ok(data, 201)
}

// PATCH /api/tasks — update task or subtask
export async function PATCH(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { id, subtask_id, ...updates } = await req.json()

  // Subtask toggle/update
  if (subtask_id) {
    const { data, error } = await supabase
      .from('subtasks').update(updates).eq('id', subtask_id).select().single()
    if (error) return err(error.message, 500)
    return ok(data)
  }

  if (!id) return err('Task ID required')

  const { data, error } = await supabase
    .from('tasks').update(updates).eq('id', id).select('*, subtasks(*)').single()
  if (error) return err(error.message, 500)
  return ok(data)
}

// DELETE /api/tasks
export async function DELETE(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { id, subtask_id } = await req.json()

  if (subtask_id) {
    const { error } = await supabase.from('subtasks').delete().eq('id', subtask_id)
    if (error) return err(error.message, 500)
    return ok({ ok: true })
  }

  if (!id) return err('Task ID required')
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}

// POST /api/tasks/subtask — add subtask (separate endpoint for clarity)
// Alternatively handled via POST with parent_task_id
