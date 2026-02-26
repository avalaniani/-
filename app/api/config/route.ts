// app/api/config/route.ts
// Exposes PUBLIC env vars to the browser (anon key only — never service_role)

import { ok } from '@/lib/api'

export async function GET() {
  return ok({
    supabaseUrl:  process.env.SUPABASE_URL     || '',
    supabaseAnon: process.env.SUPABASE_ANON_KEY || '',
  })
}
