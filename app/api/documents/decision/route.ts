import { type NextRequest, NextResponse } from "next/server"
import { auditLog } from "@/lib/audit"
import { getAuthFromRequest, resolveUserIdViaSupabaseToken } from "@/lib/auth"

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
    const { documentId, action } = body || {}
    let userId: string | undefined = body?.userId
    if (!userId) {
      const { token } = getAuthFromRequest(request)
      const resolved = await resolveUserIdViaSupabaseToken(token)
      if (resolved) userId = resolved
    }
    if (!documentId || !action) {
      return NextResponse.json({ error: "documentId and action are required" }, { status: 400 })
    }

    if (action === 'delete') {
      const { error } = await admin.from('hr_documents').delete().eq('id', documentId)
      if (error) {
        console.error('[api/documents/decision] delete error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      auditLog({ userId, action: 'document_delete', resourceType: 'hr_documents', resourceId: documentId })
      return NextResponse.json({ success: true, message: 'Document deleted' })
    }

    if (action === 'save') {
      // For now, mark as saved by updating metadata flag
      const { data, error } = await admin
        .from('hr_documents')
        .update({ metadata: { saved: true } })
        .eq('id', documentId)
        .select('id')
        .single()
      if (error) {
        console.error('[api/documents/decision] save error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      auditLog({ userId, action: 'document_save', resourceType: 'hr_documents', resourceId: documentId })
      return NextResponse.json({ success: true, document: data })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('[api/documents/decision] POST error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}


