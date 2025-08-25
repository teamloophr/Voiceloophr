import { type NextRequest, NextResponse } from "next/server"

// Mock documents data
const mockDocuments = [
  {
    id: "1",
    user_id: "mock-user",
    filename: "john_doe_resume.pdf",
    file_path: "/documents/john_doe_resume.pdf",
    file_size: 245760,
    mime_type: "application/pdf",
    ai_summary:
      "Experienced software engineer with 5 years in React and Node.js development. Strong background in full-stack web applications.",
    ai_keywords: ["React", "Node.js", "JavaScript", "Full-stack", "Software Engineer"],
    upload_date: "2024-01-15T10:30:00Z",
    processed_at: "2024-01-15T10:32:00Z",
    status: "completed",
  },
  {
    id: "2",
    user_id: "mock-user",
    filename: "jane_smith_cv.docx",
    file_path: "/documents/jane_smith_cv.docx",
    file_size: 189440,
    mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ai_summary:
      "Senior UX designer with expertise in user research and interface design. 7 years experience in design systems.",
    ai_keywords: ["UX Design", "User Research", "Figma", "Design Systems", "Senior Designer"],
    upload_date: "2024-01-14T14:20:00Z",
    processed_at: "2024-01-14T14:22:00Z",
    status: "completed",
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const userId = searchParams.get("userId") || "mock-user"

    let documents = mockDocuments.filter((doc) => doc.user_id === userId)

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      documents = documents.filter(
        (doc) =>
          doc.filename.toLowerCase().includes(searchLower) ||
          doc.ai_summary?.toLowerCase().includes(searchLower) ||
          doc.ai_keywords?.some((keyword) => keyword.toLowerCase().includes(searchLower)),
      )
    }

    return NextResponse.json({
      success: true,
      documents,
    })
  } catch (error) {
    console.error("[v0] Documents API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("id")

    if (!documentId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }

    // TODO: Delete from database and file storage when integrations are connected
    console.log("[v0] Simulating document deletion:", documentId)

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Delete document error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
