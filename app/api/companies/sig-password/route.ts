import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

// GET /api/companies/sig-password
// מחזיר את סיסמת החתימה לCEO/Admin של החברה בלבד
// נקרא מ-app.html רק כשהמשתמש לוחץ להציג את הסיסמה
export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  // ─── רק admin ו-ceo רשאים לראות את סיסמת החתימה ───
  if (!['admin', 'ceo'].includes(session.role)) return err('Forbidden', 403)

  // ─── admin: חייב לבקש company_id ספציפי ───
  const { searchParams } = new URL(req.url)
  const companyId = session.role === 'admin'
    ? searchParams.get('company_id')
    : session.company

  if (!companyId) return err('חסר company_id', 400)

  // ─── CEO: רק החברה שלו ───
  if (session.role === 'ceo' && companyId !== session.company) {
    return err('Forbidden', 403)
  }

  const { data, error } = await supabase
    .from('companies')
    .select('sig_password')
    .eq('id', companyId)
    .single()

  if (error) return err('שגיאת שרת', 500)

  // ─── מחזיר null אם לא הוגדרה סיסמה ───
  return ok({ sig_password: data?.sig_password || null })
}
