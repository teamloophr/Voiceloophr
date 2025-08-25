import { createClient } from "@supabase/supabase-js"

export function createSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  return createClient(supabaseUrl, supabaseAnon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}


