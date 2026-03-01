import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { data } = await supabase.from('notes')
    .select('content').eq('user_id', session.id).single()
  return ok({ content: data?.content || '' })
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const { content } = await req.json()
  const { error } = await supabase.from('notes').upsert(
    { user_id: session.id, content, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
  if (error) return err(error.message, 500)
  return ok({ ok: true })
}
