import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

const MAX_NOTE_LENGTH = 50_000 // ~50KB

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  // ─── user_id תמיד מ-session — לא ניתן לקרוא הערות של אחר ───
  const { data } = await supabase
    .from('notes')
    .select('content')
    .eq('user_id', session.id)
    .single()

  return ok({ content: data?.content || '' })
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const body = await req.json().catch(() => null)
  if (!body) return err('בקשה לא תקינה', 400)

  const { content } = body

  // ─── ולידציה ───
  if (typeof content !== 'string') return err('תוכן לא תקין', 400)
  if (content.length > MAX_NOTE_LENGTH) return err(`הערה ארוכה מדי (מקסימום ${MAX_NOTE_LENGTH} תווים)`, 400)

  // ─── user_id תמיד מ-session ───
  const { error } = await supabase.from('notes').upsert(
    {
      user_id:    session.id,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) return err('שגיאת שרת', 500)
  return ok({ ok: true })
}
