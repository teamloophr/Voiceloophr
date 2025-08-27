import { NextRequest } from 'next/server'

export interface AuthResult {
  userId: string | null
  token: string | null
}

// Extract Supabase access token from Authorization or custom header
export function getAuthFromRequest(req: NextRequest): AuthResult {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    const altHeader = req.headers.get('x-supabase-auth')
    const bearer = authHeader && authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : null
    const token = bearer || (altHeader ? altHeader.trim() : null)
    // Optionally, callers may pass userId in header (validated downstream)
    const userIdHeader = req.headers.get('x-user-id')
    return { userId: userIdHeader || null, token }
  } catch {
    return { userId: null, token: null }
  }
}

// Resolve user id using Supabase with the provided token (anon client with header)
export async function resolveUserIdViaSupabaseToken(token: string | null): Promise<string | null> {
  try {
    if (!token) return null
    const { createClient } = require('@supabase/supabase-js')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    if (!url || !anon) return null
    const client = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data, error } = await client.auth.getUser()
    if (error) return null
    return data?.user?.id || null
  } catch {
    return null
  }
}



