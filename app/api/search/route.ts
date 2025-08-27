import { type NextRequest, NextResponse } from "next/server"
import { AIProcessor } from "@/lib/ai-processing"
import { auditLog } from "@/lib/audit"
import { getAuthFromRequest, resolveUserIdViaSupabaseToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { query, filters, userId: bodyUserId, apiKey } = await request.json()

    // Resolve user from header token if userId not provided
    let userId = bodyUserId
    if (!userId) {
      const { token } = getAuthFromRequest(request)
      const resolved = await resolveUserIdViaSupabaseToken(token)
      if (resolved) userId = resolved
    }

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
      queryEmbedding = await AIProcessor.generateEmbeddings(query, apiKey)
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
    try {
      const rpc = await admin.rpc('search_document_chunks_hybrid_admin', {
        p_user_id: userId,
        query_text: query,
        query_embedding: queryEmbedding || null,
        alpha: 0.6,
        match_count: 30,
      })
      data = rpc.data
      error = rpc.error
      if (error) {
        console.error('[search] Hybrid RPC error:', error)
      }
    } catch (rpcErr: any) {
      console.warn('[search] Hybrid RPC call failed, attempting vector-only RPC if possible')
      // If hybrid RPC missing, try vector-only RPC as a fallback when we have an embedding
      if (queryEmbedding) {
        try {
          const vecRpc = await admin.rpc('search_documents_admin', {
            p_user_id: userId,
            query_embedding: queryEmbedding,
            similarity_threshold: 0.7,
            match_count: 20,
          })
          data = vecRpc.data
          error = vecRpc.error
          if (error) {
            console.error('[search] Vector-only RPC error:', error)
          }
        } catch (vecErr) {
          console.error('[search] Vector-only RPC call failed:', vecErr)
        }
      }
    }

    // Fallback to simple text search when hybrid RPC returned nothing
    if (!data || data.length === 0) {
      try {
        // First try full-text search on generated column when available
        let fallbacks: any[] | null = null
        try {
          const ts = await admin
            .from('hr_documents')
            .select('id, title, content, summary, metadata, uploaded_at, file_type, file_size')
            .eq('user_id', userId)
            .textSearch('search_fts', query, { type: 'websearch', config: 'english' })
            .limit(20)
          if (!ts.error) {
            fallbacks = ts.data as any[]
          }
        } catch {}

        // If FTS not available or empty, do tokenized ILIKE across title/content/summary
        if (!fallbacks || fallbacks.length === 0) {
          const tokens = query.split(/\s+/).filter(Boolean)
          const ors: string[] = []
          for (const t of tokens) {
            const p = `%${t}%`
            ors.push(`title.ilike.${p}`, `content.ilike.${p}`, `summary.ilike.${p}`)
          }
          const fb = await admin
            .from('hr_documents')
            .select('id, title, content, summary, metadata, uploaded_at, file_type, file_size')
            .eq('user_id', userId)
            .or(ors.join(','))
            .limit(20)
          if (!fb.error) fallbacks = fb.data as any[]
        }

        if (fallbacks && fallbacks.length > 0) {
          data = fallbacks.map((d: any) => ({ ...d, similarity: 0.5 }))
        }
      } catch (fbCatch) {
        console.error('[search] Fallback text search error:', fbCatch)
      }
    }

    // Fallback 2: Candidate name association search
    if ((!data || data.length === 0) && userId) {
      try {
        const pattern = `%${query}%`
        const { data: candidates, error: candErr } = await admin
          .from('candidates')
          .select('id')
          .eq('user_id', userId)
          .ilike('full_name', pattern)
          .limit(5)
        if (!candErr && candidates && candidates.length > 0) {
          const ids = candidates.map((c: any) => c.id)
          const { data: assoc, error: assocErr } = await admin
            .from('candidate_documents')
            .select('relation, created_at, hr_documents(id, title, content, summary, metadata, uploaded_at, file_type, file_size)')
            .in('candidate_id', ids)
            .limit(50)
          if (!assocErr && assoc) {
            data = assoc
              .map((row: any) => ({
                ...(row.hr_documents || {}),
                similarity: 0.6, // slight preference over plain text fallback
              }))
              .filter((d: any) => d && d.id)
          }
        }
      } catch (candCatch) {
        console.error('[search] Candidate association fallback error:', candCatch)
      }
    }

    const results = (data || []).map((row: any) => ({
      id: row.document_id || row.id,
      title: row.title,
      content: row.chunk_content || row.content || '',
      similarity: row.hybrid_score ?? row.similarity ?? 0,
      relevanceScore: Math.round(((row.hybrid_score ?? row.similarity ?? 0)) * 100),
      description: row.summary,
      highlights: row.snippet ? [row.snippet] : [],
      metadata: row.metadata || {
        uploadedAt: row.uploaded_at,
        fileType: row.file_type,
        fileSize: row.file_size,
        chunkIndex: row.chunk_index,
        chunkId: row.chunk_id,
      },
    }))

    const response = {
      success: true,
      results,
      totalCount: results.length,
      query,
      filters,
    }

    // Audit search
    auditLog({ userId, action: 'search', resourceType: 'hr_documents', metadata: { query, total: results.length } })

    return NextResponse.json(response)
  } catch (error) {
    console.error("[search] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
