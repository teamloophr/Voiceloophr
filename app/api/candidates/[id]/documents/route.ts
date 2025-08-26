import { type NextRequest, NextResponse } from "next/server"

function getAdminClient() {
  const { createClient } = require('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getAdminClient()
    if (!admin) {
      return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 })
    }

    const { id: candidateId } = await params
    if (!candidateId) {
      return NextResponse.json({ error: "candidate id is required" }, { status: 400 })
    }

    const { data, error } = await admin
      .from('candidate_documents')
      .select('document_id, relation, created_at, hr_documents(id, title, summary, metadata, file_type, file_size, uploaded_at)')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[api/candidates/:id/documents] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const documents = (data || []).map((row: any) => ({
      id: row.hr_documents?.id,
      title: row.hr_documents?.title,
      summary: row.hr_documents?.summary,
      metadata: row.hr_documents?.metadata,
      file_type: row.hr_documents?.file_type,
      file_size: row.hr_documents?.file_size,
      uploaded_at: row.hr_documents?.uploaded_at,
      relation: row.relation,
    })).filter((d: any) => d.id)

    return NextResponse.json({ success: true, documents })
  } catch (err: any) {
    console.error('[api/candidates/:id/documents] GET error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}


