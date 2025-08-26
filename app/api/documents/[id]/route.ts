import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { createClient } = require('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 })
    }
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

    // Fetch document row
    const { data: doc, error } = await admin
      .from('hr_documents')
      .select('id, title, summary, content, metadata, user_id, file_type, file_size, uploaded_at')
      .eq('id', id)
      .single()
    if (error || !doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Create a signed URL for original file if present
    let signedUrl: string | null = null
    const bucket = doc?.metadata?.bucket
    const path = doc?.metadata?.path
    if (bucket && path) {
      const { data: signed, error: signErr } = await admin.storage
        .from(bucket)
        .createSignedUrl(path, 600) // 10 minutes
      if (!signErr) {
        signedUrl = signed?.signedUrl || null
      }
    }

    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      summary: doc.summary,
      content: doc.content,
      metadata: doc.metadata,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      uploadedAt: doc.uploaded_at,
      signedUrl,
    })
  } catch (e) {
    console.error('[doc:get] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


