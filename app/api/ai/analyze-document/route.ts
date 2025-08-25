import { type NextRequest, NextResponse } from "next/server"
import { analyzeDocumentWithAI, extractTextFromPDF, extractTextFromWord } from "@/lib/ai-processing"

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
    let extractedText: string

    switch (file.type) {
      case "application/pdf":
        extractedText = await extractTextFromPDF(file)
        break
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        extractedText = await extractTextFromWord(file)
        break
      case "text/plain":
        extractedText = await file.text()
        break
      default:
        return NextResponse.json({ error: "Unsupported file type for AI analysis" }, { status: 400 })
    }

    // Analyze document with AI
    const analysis = await analyzeDocumentWithAI(extractedText, file.name, {
      extractKeywords: true,
      generateSummary: true,
      analyzeSentiment: true,
      extractSkills: true,
      extractContactInfo: true,
    })

    // TODO: Save analysis results to database when Supabase is connected
    // await supabase.from('documents').update({
    //   ai_summary: analysis.summary,
    //   ai_keywords: analysis.keywords,
    //   processed_at: new Date().toISOString(),
    //   status: 'completed'
    // }).eq('id', documentId)

    console.log("[v0] AI analysis completed for:", file.name)

    return NextResponse.json({
      success: true,
      analysis: {
        summary: analysis.summary,
        keywords: analysis.keywords,
        skills: analysis.skillsExtracted,
        experienceLevel: analysis.experienceLevel,
        sentiment: analysis.sentiment,
        contactInfo: analysis.contactInfo,
      },
      extractedText: extractedText.substring(0, 500) + "...", // Return first 500 chars for preview
    })
  } catch (error) {
    console.error("[v0] Document analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze document" }, { status: 500 })
  }
}
