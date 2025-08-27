import { type NextRequest, NextResponse } from "next/server"

function getAdminClient() {
  const { createClient } = require('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
}

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminClient()
    if (!admin) {
      return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const { data, error } = await admin
      .from('candidates')
      .select('id, full_name, email, phone, metadata, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[api/candidates] list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, candidates: data || [] })
  } catch (err: any) {
    console.error('[api/candidates] GET error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminClient()
    if (!admin) {
      return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 })
    }

    const body = await request.json()
    const { userId, full_name, email, phone, metadata } = body || {}
    if (!userId || !email) {
      return NextResponse.json({ error: "userId and email are required" }, { status: 400 })
    }

    const payload = [{ user_id: userId, full_name, email, phone, metadata: metadata || {} }]

    // Upsert by (user_id, email)
    const { data, error } = await admin
      .from('candidates')
      .upsert(payload, { onConflict: 'user_id,email' })
      .select('id, user_id, full_name, email, phone, metadata, created_at, updated_at')
      .single()

    if (error) {
      console.error('[api/candidates] upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, candidate: data })
  } catch (err: any) {
    console.error('[api/candidates] POST error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}



