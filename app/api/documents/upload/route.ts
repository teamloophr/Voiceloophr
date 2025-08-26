import { type NextRequest, NextResponse } from "next/server"
import { validateFile } from "@/lib/file-utils"
import { AIProcessor } from "@/lib/ai-processing"

// Lazy import to avoid issues in edge runtimes
function getAdminClient() {
  const { createClient } = require('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const userId = (formData.get("userId") as string) || ""

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const admin = getAdminClient()
    if (!admin) {
      return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 })
    }

    const uploadResults: any[] = []

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
        // Upload original to Supabase Storage
        const storageBucket = 'documents'
        const storagePath = `${userId}/${Date.now()}-${title}`
        try {
          const { error: uploadErr } = await admin.storage
            .from(storageBucket)
            .upload(storagePath, file, {
              contentType: fileType,
              upsert: false,
            })
          if (uploadErr) {
            console.warn('[upload] Storage upload failed, continuing without file:', uploadErr)
          }
        } catch (e) {
          console.warn('[upload] Storage upload threw, continuing without file:', e)
        }

        // Extract text content or transcribe audio
        const mime = file.type || "application/octet-stream"
        let extractedText = ""
        if (mime.startsWith("audio/")) {
          const transcription = await AIProcessor.transcribeAudio(file)
          extractedText = transcription.text || ""
        } else if (mime === 'application/pdf') {
          try {
            const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs')
            // pdfjs in Node supports data buffers directly
            const ab = await file.arrayBuffer()
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(ab) })
            const pdf = await loadingTask.promise
            let text = ''
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i)
              const content = await page.getTextContent()
              const strings = content.items?.map((it: any) => it.str).filter(Boolean) || []
              text += strings.join(' ') + '\n'
              if (text.length > 50000) break
            }
            extractedText = text.trim()
          } catch (e) {
            // Fallback: try naive text
            try { extractedText = await file.text() } catch {}
          }
        } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          try {
            const mammoth = await import('mammoth') as any
            const ab = await file.arrayBuffer()
            const result = await mammoth.extractRawText({ arrayBuffer: ab })
            extractedText = (result?.value || '').trim()
          } catch (e) {
            try { extractedText = await file.text() } catch {}
          }
        } else {
          // Basic extraction for text-like files
          try {
            extractedText = await file.text()
          } catch (e) {
            extractedText = ""
          }
        }

        const content = (extractedText || "").slice(0, 20000)
        const title = file.name
        const fileType = mime
        const fileSize = file.size

        // Generate embeddings from extracted text (if any)
        const embeddings = content ? await AIProcessor.generateEmbeddings(content) : []

        // Optional: create a short summary
        let summary: string | undefined
        try {
          if (content) {
            const analysis = await AIProcessor.summarizeDocument(content)
            summary = analysis.summary
          }
        } catch {}

        const payload: any = {
          title,
          content: content || "",
          file_type: fileType,
          file_size: fileSize,
          user_id: userId,
          metadata: {
            bucket: storageBucket,
            path: storagePath,
            mimeType: fileType,
            originalName: title,
          },
        }
        if (summary) payload.summary = summary
        if (embeddings && embeddings.length > 0) payload.embeddings = embeddings

        const { data, error } = await admin
          .from('hr_documents')
          .insert(payload)
          .select('id, title')
          .single()
        
        if (error) {
          console.error("[upload] DB insert error", error)
          throw error
        }

        uploadResults.push({
          filename: file.name,
          success: true,
          documentId: data?.id,
          size: file.size,
          type: file.type,
        })
      } catch (error) {
        console.error("[upload] Error for", file.name, error)
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
    console.error("[upload] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
