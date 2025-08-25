import { type NextRequest, NextResponse } from "next/server"
import { validateFile } from "@/lib/file-utils"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const uploadResults = []

    for (const file of files) {
      // Validate file
      const validation = validateFile(file)
      if (!validation.isValid) {
        uploadResults.push({
          filename: file.name,
          success: false,
          error: validation.error,
        })
        continue
      }

      try {
        // TODO: Upload to Vercel Blob when integration is connected
        // const blob = await put(file.name, file, { access: 'public' })

        // For now, simulate successful upload
        console.log("[v0] Simulating file upload:", file.name)

        // TODO: Save document metadata to database when Supabase is connected
        // const document = await supabase.from('documents').insert({
        //   filename: file.name,
        //   file_path: blob.url,
        //   file_size: file.size,
        //   mime_type: file.type,
        //   status: 'pending'
        // })

        uploadResults.push({
          filename: file.name,
          success: true,
          fileId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          size: file.size,
          type: file.type,
        })
      } catch (error) {
        console.error("[v0] Upload error for", file.name, error)
        uploadResults.push({
          filename: file.name,
          success: false,
          error: "Upload failed",
        })
      }
    }

    return NextResponse.json({
      success: true,
      results: uploadResults,
    })
  } catch (error) {
    console.error("[v0] Upload API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
