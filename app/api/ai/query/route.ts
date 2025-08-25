import { type NextRequest, NextResponse } from "next/server"
import { generateAIResponse } from "@/lib/ai-processing"

export async function POST(request: NextRequest) {
  try {
    const { query, userId, documentContext } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    console.log("[v0] Processing AI query:", query)

    // TODO: Fetch relevant documents from database when Supabase is connected
    // const documents = await supabase
    //   .from('documents')
    //   .select('ai_summary, ai_keywords, filename')
    //   .eq('user_id', userId)
    //   .eq('status', 'completed')

    // For now, use mock context
    const context = documentContext || [
      "John Doe - Software Engineer with 5 years React experience",
      "Jane Smith - Senior UX Designer with 7 years experience in design systems",
    ]

    const response = await generateAIResponse(query, context)

    // TODO: Save query to database for tracking
    // await supabase.from('voice_queries').insert({
    //   user_id: userId,
    //   query_text: query,
    //   response_text: response,
    //   created_at: new Date().toISOString()
    // })

    return NextResponse.json({
      success: true,
      response,
      context: context.length,
    })
  } catch (error) {
    console.error("[v0] AI query error:", error)
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 })
  }
}
