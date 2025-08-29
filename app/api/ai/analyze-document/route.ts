import { type NextRequest, NextResponse } from "next/server"
import { AIProcessor } from "@/lib/ai-processing"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Starting AI analysis for:", file.name)

    // Extract text based on file type
    const extractedText = await file.text()

    // Analyze document with AI
    const analysis = await AIProcessor.summarizeDocument(extractedText)

    // TODO: Save analysis results to database when Supabase is connected
    // await supabase.from('documents').update({
    //   ai_summary: analysis.summary,
    //   ai_keywords: analysis.keyPoints,
    //   processed_at: new Date().toISOString(),
    //   status: 'completed'
    // }).eq('id', documentId)

    console.log("[v0] AI analysis completed for:", file.name)

    return NextResponse.json({
      success: true,
      analysis: {
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        documentType: analysis.documentType,
        recommendation: analysis.recommendation
      },
      preview: {
        shouldStore: analysis.recommendation === 'store',
        documentType: analysis.documentType,
        confidence: analysis.confidence,
        extractedTextLength: extractedText.length,
        previewText: extractedText.substring(0, 300) + (extractedText.length > 300 ? "..." : "")
      }
    })
  } catch (error) {
    console.error("[v0] Document analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze document" }, { status: 500 })
  }
}
