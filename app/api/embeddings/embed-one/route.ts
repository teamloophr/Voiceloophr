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

    const { documentId } = await request.json()
    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 })
    }

    const { data: doc, error: selErr } = await admin
      .from('hr_documents')
      .select('id, content')
      .eq('id', documentId)
      .single()
    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 404 })
    }

    const content = (doc?.content || '').slice(0, 20000)
    if (!content) {
      return NextResponse.json({ error: 'No content to embed' }, { status: 400 })
    }

    const embedding = await AIProcessor.generateEmbeddings(content)
    const { error: upErr } = await admin
      .from('hr_documents')
      .update({
        embeddings: embedding,
        embedding_model: 'text-embedding-3-small',
        embedding_version: 'v1',
        embedding_updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, documentId })
  } catch (err: any) {
    console.error('[embeddings/embed-one] error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}



