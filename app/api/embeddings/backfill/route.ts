import { type NextRequest, NextResponse } from "next/server"
import { AIProcessor } from "@/lib/ai-processing"

function getAdminClient() {
  const { createClient } = require('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
}

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminClient()
    if (!admin) {
      return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 })
    }

    const { userId, limit = 50 } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const { data: docs, error } = await admin
      .from('hr_documents')
      .select('id, content')
      .eq('user_id', userId)
      .or('embeddings.is.null,embedding_updated_at.is.null')
      .limit(limit)

    if (error) {
      console.error('[embeddings/backfill] select error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const updated: string[] = []
    for (const d of (docs || [])) {
      const content = (d.content || '').slice(0, 20000)
      if (!content) continue
      const embedding = await AIProcessor.generateEmbeddings(content)
      const { error: upErr } = await admin
        .from('hr_documents')
        .update({
          embeddings: embedding,
          embedding_model: 'text-embedding-3-small',
          embedding_version: 'v1',
          embedding_updated_at: new Date().toISOString()
        })
        .eq('id', d.id)
      if (!upErr) updated.push(d.id)
    }

    return NextResponse.json({ success: true, updatedCount: updated.length, updated })
  } catch (err: any) {
    console.error('[embeddings/backfill] error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}



