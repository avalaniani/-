// app/api/notes/route.ts
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, ok, err } from '@/lib/api'

// GET /api/notes — get current user's note
export async function GET() {
  const session = requireAuth()
  if ('status' in session) return session

  const { data } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', session.userId)
    .single()

  return ok(data || { content: '' })
}

// PUT /api/notes — upsert note
export async function PUT(req: NextRequest) {
  const session = requireAuth()
  if ('status' in session) return session

  const { content } = await req.json()

  const { data, error } = await supabase
    .from('notes')
    .upsert({ user_id: session.userId, content, updated_at: new Date().toISOString() },
             { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok(data)
}
