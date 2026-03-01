import { createClient } from '@supabase/supabase-js'

// רץ בשרת בלבד — service_role key לא נחשף לדפדפן
const supabaseUrl  = process.env.SUPABASE_URL!
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})
