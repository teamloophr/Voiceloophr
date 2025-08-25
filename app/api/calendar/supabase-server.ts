import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/auth-helpers-nextjs"

export function createSupabaseServer() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 })
      },
    },
  })
}


