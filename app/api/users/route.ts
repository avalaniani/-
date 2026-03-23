import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'
import { hashPassword } from '@/lib/auth'

// ─── תיקון #1: הסרת password_plain לחלוטין ───
const SAFE_COLS = 'id,username,name,role,company_id,avatar,avatar_color,id_type,id_number,ceo_interface,field_worker,site_id'

// ─── תיקון #2: רק תפקידים מותרים ───
const ALLOWED_ROLES = ['ceo', 'employee', 'worker'] as const
type AllowedRole = typeof ALLOWED_ROLES[number]

// ─── תיקון #3: ולידציה של סיסמה בשרת ───
function validatePassword(p: string): string | null {
  if (!p || p.length < 8)       return 'סיסמה חייבת להכיל לפחות 8 תווים'
  if (p.length > 128)            return 'סיסמה ארוכה מדי'
  if (/\s/.test(p))              return 'סיסמה לא יכולה להכיל רווחים'
  return null
}

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('company_id')

  // ─── תיקון #4: הסרת password_plain מכל תגובה ───
  // כולל admin ו-ceo — סיסמאות לא נשלחות ללקוח בשום מקרה
  const useCols = SAFE_COLS

  let q = supabase.from('users').select(useCols).order('name')

  if (session.role === 'admin') {
    if (companyId) q = q.eq('company_id', companyId)
  } else if (session.role === 'worker') {
    q = q.eq('id', session.id)
  } else {
    q = q.eq('company_id', session.company)
  }

  const { data, error } = await q
  if (error) return err('שגיאת שרת', 500) // תיקון #5: לא חושפים הודעת שגיאה פנימית
  return ok(data)
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (!['admin', 'ceo', 'employee'].includes(session.role)) return err('Forbidden', 403)

  const body = await req.json()
  if (!body.username || !body.password || !body.name) return err('חסרים שדות חובה')

  // ─── תיקון #6: ולידציה בשרת ───
  const passErr = validatePassword(body.password)
  if (passErr) return err(passErr)

  if (body.username.length < 3 || body.username.length > 50) return err('שם משתמש לא תקין')
  if (/\s/.test(body.username)) return err('שם משתמש לא יכול להכיל רווחים')
  if (body.name.length > 100) return err('שם ארוך מדי')

  // ─── תיקון #7: מניעת יצירת admin ───
  // admin יכול ליצור כל role, אבל לא admin נוסף
  // ceo/employee: רק worker ו-employee
  let allowedRoles: string[]
  if (session.role === 'admin') {
    allowedRoles = ['ceo', 'employee', 'worker'] // admin לא יוצר admin נוסף
  } else if (session.role === 'ceo') {
    allowedRoles = ['employee', 'worker']
  } else {
    allowedRoles = ['worker']
  }

  const role = body.role || 'worker'
  if (!allowedRoles.includes(role)) return err('Forbidden', 403)

  // ─── תיקון #8: CEO לא יכול ליצור משתמש בחברה אחרת ───
  const companyId = session.role === 'admin' ? (body.company_id || null) : session.company
  if (session.role !== 'admin' && body.company_id && body.company_id !== session.company) {
    return err('Forbidden', 403)
  }

  // ─── תיקון #9: בדיקת username ייחודי — timing-safe ───
  const { data: exists } = await supabase.from('users')
    .select('id').eq('username', body.username.trim().toLowerCase()).single()
  if (exists) return err('שם משתמש כבר קיים')

  const hash = await hashPassword(body.password)
  const colors: Record<string, string> = { ceo: '#60a5fa', employee: '#4ade80', worker: '#fb923c' }
  const avatars: Record<string, string> = { ceo: '🏢', employee: '💼', worker: '🔧' }

  const { data, error } = await supabase.from('users').insert({
    username:      body.username.trim().toLowerCase(),
    password_hash: hash,
    // ─── תיקון #1: password_plain לא נשמר בכלל ───
    name:          body.name.trim(),
    role,
    company_id:    companyId,
    avatar:        body.avatar       || avatars[role] || '💼',
    avatar_color:  body.avatar_color || colors[role]  || '#60a5fa',
    id_type:       body.id_type   || 'id',
    id_number:     body.id_number || null,
    ceo_interface: false,
    field_worker:  false,
    site_id:       body.site_id || null,
  }).select(SAFE_COLS).single()

  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return err('Missing id')

  // ─── תיקון #10: הגנה על חשבון האדמין ───
  // אף אחד לא יכול לגעת בחשבון admin חוץ מהadmin עצמו
  const { data: targetUser } = await supabase
    .from('users').select('role, company_id').eq('id', id).single()

  if (!targetUser) return err('משתמש לא נמצא', 404)

  if (targetUser.role === 'admin' && session.role !== 'admin') {
    return err('Forbidden', 403)
  }

  // ─── תיקון #11: worker לא יכול לערוך אחרים ───
  if (session.role === 'worker' && String(id) !== String(session.id)) {
    return err('Forbidden', 403)
  }

  // ─── תיקון #12: ceo/employee לא יכולים לערוך משתמשים מחברה אחרת ───
  if (!['admin'].includes(session.role)) {
    if (targetUser.company_id !== session.company) return err('Forbidden', 403)
  }

  const allowed: Record<string, unknown> = {}

  // שדות שכל משתמש יכול לשנות בעצמו
  if (updates.avatar       !== undefined) allowed.avatar       = updates.avatar
  if (updates.avatar_color !== undefined) allowed.avatar_color = updates.avatar_color

  // שדות שרק admin/ceo/employee מורשים לשנות
  if (['admin', 'ceo', 'employee'].includes(session.role)) {
    if (updates.name     !== undefined) allowed.name     = updates.name
    if (updates.username !== undefined) {
      if (/\s/.test(updates.username)) return err('שם משתמש לא יכול להכיל רווחים')
      allowed.username = updates.username.trim().toLowerCase()
    }
    if (updates.id_type   !== undefined) allowed.id_type   = updates.id_type
    if (updates.id_number !== undefined) allowed.id_number = updates.id_number
    if (updates.site_id   !== undefined) allowed.site_id   = updates.site_id
  }

  // ─── תיקון #13: רק admin יכול לשנות role ו-company_id ───
  if (session.role === 'admin') {
    if (updates.role !== undefined) {
      // admin לא יכול להפוך מישהו ל-admin נוסף
      if (updates.role === 'admin') return err('לא ניתן ליצור admin נוסף', 403)
      allowed.role = updates.role
    }
    if (updates.company_id    !== undefined) allowed.company_id    = updates.company_id
    if (updates.ceo_interface !== undefined) allowed.ceo_interface = updates.ceo_interface
    if (updates.field_worker  !== undefined) allowed.field_worker  = updates.field_worker
  }

  // ─── תיקון #14: רק admin/ceo יכולים לשנות ceo_interface/field_worker ───
  if (session.role === 'ceo') {
    if (updates.ceo_interface !== undefined) allowed.ceo_interface = updates.ceo_interface
    if (updates.field_worker  !== undefined) allowed.field_worker  = updates.field_worker
  }

  // ─── תיקון #6: ולידציית סיסמה בשרת + הסרת password_plain ───
  if (updates.password !== undefined) {
    const passErr = validatePassword(updates.password)
    if (passErr) return err(passErr)
    allowed.password_hash = await hashPassword(updates.password)
    // password_plain לא נשמר
  }

  if (Object.keys(allowed).length === 0) return err('אין שדות לעדכון', 400)

  const { data, error } = await supabase
    .from('users').update(allowed).eq('id', id).select(SAFE_COLS).single()
  if (error) return err('שגיאת שרת', 500)
  return ok(data)
}

export async function DELETE(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session
  if (!['admin', 'ceo', 'employee'].includes(session.role)) return err('Forbidden', 403)

  const { id } = await req.json()
  if (!id) return err('Missing id')

  // ─── תיקון #10: לא ניתן למחוק חשבון admin ───
  const { data: targetUser } = await supabase
    .from('users').select('role, company_id').eq('id', id).single()

  if (!targetUser) return err('משתמש לא נמצא', 404)
  if (targetUser.role === 'admin') return err('לא ניתן למחוק חשבון מנהל מערכת', 403)

  // ─── CEO/employee: רק משתמשים מהחברה שלהם ───
  if (session.role !== 'admin') {
    if (targetUser.company_id !== session.company) return err('Forbidden', 403)
  }

  // ─── מניעת self-delete ───
  if (String(id) === String(session.id)) return err('לא ניתן למחוק את המשתמש הנוכחי', 403)

  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) return err('שגיאת שרת', 500)
  return ok({ ok: true })
}
