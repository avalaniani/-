import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const company = session.company

  if (session.role === 'worker' || session.role === 'employee') {
    // פועל/עובד — רק אירועים ששותפו איתו
    const { data, error } = await supabase.from('calendar_events')
      .select('*')
      .eq('company_id', company)
      .neq('visibility', 'private')
      .order('event_date')
    if (error) return err(error.message, 500)
    // סנן "selected" — רק אם המשתמש ברשימה
    const filtered = (data || []).filter(ev => {
      if (ev.visibility === 'all') return true
      if (ev.visibility === 'selected') {
        const shared = ev.shared_with || []
        return shared.includes(String(session.id))
      }
      return false
    })
    return ok(filtered)
  }

  // ceo / admin — כל האירועים של החברה
  const { data, error } = await supabase.from('calendar_events')
    .select('*')
    .eq('company_id', company)
    .order('event_date')
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const body = await req.json()
  if (!body.title?.trim() || !body.date) return err('חסרים שדות חובה')

  const { data, error } = await supabase.from('calendar_events').insert({
    company_id:  session.company,
    created_by:  session.id,
    title:       body.title.trim(),
    event_date:  body.date,
    event_time:  body.time  || null,
    type:        body.type  || 'general',
    color:       body.color || 'blue',
    status:      body.status || 'pending',
    repeat:      body.repeat || null,
    note:        body.note  || '',
    visibility:  body.visibility  || 'private',
    shared_with: body.sharedWith  || [],
    client_id:   body.id || null,   // שמור id מהקליינט לזיהוי
  }).select('*').single()

  if (error) return err(error.message, 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { id, ...updates } = await req.json()
  if (!id) return err('Missing id')

  const allowed: Record<string, unknown> = {}
  if (updates.title      !== undefined) allowed.title       = updates.title
  if (updates.date       !== undefined) allowed.event_date  = updates.date
  if (updates.time       !== undefined) allowed.event_time  = updates.time
  if (updates.type       !== undefined) allowed.type        = updates.type
  if (updates.color      !== undefined) allowed.color       = updates.color
  if (updates.status     !== undefined) allowed.status      = updates.status
  if (updates.repeat     !== undefined) allowed.repeat      = updates.repeat
  if (updates.note       !== undefined) allowed.note        = updates.note
  if (updates.visibility !== undefined) allowed.visibility  = updates.visibility
  if (updates.sharedWith !== undefined) allowed.shared_with = updates.sharedWith

  const { data, error } = await supabase.from('calendar_events')
    .update(allowed).eq('id', id).eq('company_id', session.company)
    .select('*').single()
  if (error) return err(error.message, 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { id } = await req.json()
  if (!id) return err('Missing id')

  const { error } = await supabase.from('calendar_events')
    .delete().eq('id', id).eq('company_id', session.company)
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
