import { type NextRequest, NextResponse } from "next/server"
import { searchEngine } from "@/lib/search-utils"

export async function POST(request: NextRequest) {
  try {
    const { query, filters, userId } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    console.log("[v0] Processing search request:", { query, filters })

    const results = await searchEngine.search(query, filters || {})

    // TODO: Log search query to database when Supabase is connected
    // await supabase.from('search_queries').insert({
    //   user_id: userId,
    //   query,
    //   filters: JSON.stringify(filters),
    //   result_count: results.length,
    //   created_at: new Date().toISOString()
    // })

    return NextResponse.json({
      success: true,
      results,
      totalCount: results.length,
      query,
      filters,
    })
  } catch (error) {
    console.error("[v0] Search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
