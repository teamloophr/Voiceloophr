import { type NextRequest, NextResponse } from "next/server"
import { AIProcessor } from "@/lib/ai-processing"

export async function POST(request: NextRequest) {
  try {
    const { query, filters, userId } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    console.log("[search] Processing search request:", { query, filters })

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Generate query embedding (optional). If it fails, we will fall back to text search.
    let queryEmbedding: number[] | null = null
    try {
      queryEmbedding = await AIProcessor.generateEmbeddings(query)
    } catch (embedErr) {
      console.error('[search] Embedding generation failed, falling back to text search:', embedErr)
    }

    // Admin client to call RPC with explicit user_id
    const { createClient } = require('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 })
    }
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

    let data: any[] | null = null
    let error: any = null
    if (queryEmbedding) {
      const rpc = await admin.rpc('search_documents_admin', {
        p_user_id: userId,
        query_embedding: queryEmbedding,
        similarity_threshold: 0.7,
        match_count: 20,
      })
      data = rpc.data
      error = rpc.error
      if (error) {
        console.error('[search] RPC error:', error)
      }
    }

    // Fallback to simple text search when no vector results or RPC failed
    if (!data || data.length === 0) {
      try {
        const pattern = `%${query}%`
        const { data: fallbacks, error: fbErr } = await admin
          .from('hr_documents')
          .select('id, title, content, summary, metadata, uploaded_at, file_type, file_size')
          .eq('user_id', userId)
          .or(`title.ilike.${pattern},content.ilike.${pattern},summary.ilike.${pattern}`)
          .limit(20)
        if (!fbErr && fallbacks) {
          data = fallbacks.map((d: any) => ({
            ...d,
            similarity: 0.5, // naive score for fallback
          }))
        }
      } catch (fbCatch) {
        console.error('[search] Fallback text search error:', fbCatch)
      }
    }

    const results = (data || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content || '',
      similarity: doc.similarity || 0,
      relevanceScore: Math.round(((doc.similarity || 0)) * 100),
      description: doc.summary,
      highlights: [],
      metadata: doc.metadata || {
        uploadedAt: doc.uploaded_at,
        fileType: doc.file_type,
        fileSize: doc.file_size,
      },
    }))

    return NextResponse.json({
      success: true,
      results,
      totalCount: results.length,
      query,
      filters,
    })
  } catch (error) {
    console.error("[search] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
