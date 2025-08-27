import { type NextRequest, NextResponse } from "next/server"

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

    const body = await request.json()
    const { candidateId, documentId, relation } = body || {}
    if (!candidateId || !documentId) {
      return NextResponse.json({ error: "candidateId and documentId are required" }, { status: 400 })
    }

    const { data, error } = await admin
      .from('candidate_documents')
      .upsert({ candidate_id: candidateId, document_id: documentId, relation: relation || null })
      .select('candidate_id, document_id, relation, created_at')
      .single()

    if (error) {
      console.error('[api/candidates/associate] upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, association: data })
  } catch (err: any) {
    console.error('[api/candidates/associate] POST error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}



