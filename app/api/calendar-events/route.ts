import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

// ─── ולידציה של תאריך YYYY-MM-DD ───
function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s))
}

// ─── ערכים מותרים ───
const VALID_TYPES       = ['general', 'meeting', 'task', 'reminder', 'holiday', 'other']
const VALID_COLORS      = ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'pink', 'gray']
const VALID_STATUSES    = ['pending', 'done', 'cancelled']
const VALID_VISIBILITY  = ['private', 'all', 'selected']
const VALID_REPEATS     = ['daily', 'weekly', 'monthly', null, undefined]

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  // ─── תיקון: admin ללא חברה → אין אירועים ───
  const company = session.company
  if (!company) return ok([])

  if (session.role === 'worker') return ok([])

  if (session.role === 'employee') {
    const { data, error } = await supabase.from('calendar_events')
      .select('*')
      .eq('company_id', company)
      .neq('visibility', 'private')
      .order('event_date')
    if (error) return err('שגיאת שרת', 500)
    const filtered = (data || []).filter(ev => {
      if (ev.visibility === 'all') return true
      if (ev.visibility === 'selected') {
        return (ev.shared_with || []).includes(String(session.id))
      }
      return false
    })
    return ok(filtered)
  }

  const { data, error } = await supabase.from('calendar_events')
    .select('*')
    .eq('company_id', company)
    .order('event_date')
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (session.role === 'worker') return err('Forbidden', 403)

  // ─── תיקון: אין חברה → אין אירוע ───
  if (!session.company) return err('אין חברה משויכת', 400)

  const body = await req.json()

  // ─── ולידציה ───
  if (!body.title?.trim()) return err('חסרת כותרת')
  if (body.title.length > 200) return err('כותרת ארוכה מדי')
  if (!body.date || !isValidDate(body.date)) return err('תאריך לא תקין')
  if (body.note && body.note.length > 1000) return err('הערה ארוכה מדי')

  const type   = VALID_TYPES.includes(body.type)   ? body.type   : 'general'
  const color  = VALID_COLORS.includes(body.color)  ? body.color  : 'blue'
  const status = VALID_STATUSES.includes(body.status) ? body.status : 'pending'
  const repeat = VALID_REPEATS.includes(body.repeat)  ? body.repeat : null
  const visibility = VALID_VISIBILITY.includes(body.visibility) ? body.visibility : 'private'

  // ─── תיקון: shared_with חייב להיות array של IDs שייכים לחברה ───
  let sharedWith: string[] = []
  if (visibility === 'selected' && Array.isArray(body.sharedWith)) {
    // ולידציה שכל ה-IDs שייכים לחברה
    const { data: companyUsers } = await supabase
      .from('users').select('id').eq('company_id', session.company)
    const validIds = new Set((companyUsers || []).map(u => String(u.id)))
    sharedWith = body.sharedWith
      .map(String)
      .filter((id: string) => validIds.has(id))
  }

  const { data, error } = await supabase.from('calendar_events').insert({
    company_id:  session.company,  // ─── תמיד מ-session ───
    created_by:  session.id,
    title:       body.title.trim(),
    event_date:  body.date,
    event_time:  body.time || null,
    type, color, status, repeat,
    note:        (body.note || '').slice(0, 1000),
    visibility,
    shared_with: sharedWith,
    client_id:   body.id || null,
  }).select('*').single()

  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (session.role === 'worker') return err('Forbidden', 403)
  if (!session.company) return err('אין חברה משויכת', 400)

  const { id, ...updates } = await req.json()
  if (!id) return err('Missing id')

  const allowed: Record<string, unknown> = {}

  if (updates.title !== undefined) {
    if (!updates.title?.trim()) return err('כותרת לא יכולה להיות ריקה')
    allowed.title = updates.title.trim().slice(0, 200)
  }
  if (updates.date !== undefined) {
    if (!isValidDate(updates.date)) return err('תאריך לא תקין')
    allowed.event_date = updates.date
  }
  if (updates.time       !== undefined) allowed.event_time  = updates.time || null
  if (updates.type       !== undefined) allowed.type        = VALID_TYPES.includes(updates.type) ? updates.type : 'general'
  if (updates.color      !== undefined) allowed.color       = VALID_COLORS.includes(updates.color) ? updates.color : 'blue'
  if (updates.status     !== undefined) allowed.status      = VALID_STATUSES.includes(updates.status) ? updates.status : 'pending'
  if (updates.repeat     !== undefined) allowed.repeat      = VALID_REPEATS.includes(updates.repeat) ? updates.repeat : null
  if (updates.note       !== undefined) allowed.note        = String(updates.note || '').slice(0, 1000)
  if (updates.visibility !== undefined) allowed.visibility  = VALID_VISIBILITY.includes(updates.visibility) ? updates.visibility : 'private'
  if (updates.sharedWith !== undefined) allowed.shared_with = Array.isArray(updates.sharedWith) ? updates.sharedWith.map(String) : []

  if (Object.keys(allowed).length === 0) return err('אין שדות לעדכון', 400)

  // ─── .eq('company_id') מבטיח שלא ניתן לערוך אירועים מחברה אחרת ───
  const { data, error } = await supabase.from('calendar_events')
    .update(allowed)
    .eq('id', id)
    .eq('company_id', session.company)
    .select('*').single()
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (session.role === 'worker') return err('Forbidden', 403)
  if (!session.company) return err('אין חברה משויכת', 400)

  const { id } = await req.json()
  if (!id) return err('Missing id')

  // ─── .eq('company_id') מבטיח cross-company protection ───
  const { error } = await supabase.from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('company_id', session.company)
  if (error) return err('שגיאת שרת', 500)
  return ok({ ok: true })
}
