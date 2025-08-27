import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Try to get API key from request body first, then headers, then environment
    let apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    
    // Check if API key is in request body (for FormData)
    try {
      const form = await req.formData()
      const bodyApiKey = form.get('apiKey') as string
      if (bodyApiKey) {
        apiKey = bodyApiKey
        console.log('[transcribe] Using API key from request body')
      }
    } catch (e) {
      // If FormData parsing fails, try to get from headers
      const headerApiKey = req.headers.get('x-openai-api-key')
      if (headerApiKey) {
        apiKey = headerApiKey
        console.log('[transcribe] Using API key from headers')
      }
    }
    
    if (!apiKey) {
      console.error('[transcribe] No OpenAI API key found')
      return NextResponse.json({ error: 'OPENAI_API_KEY missing. Please configure your API key in settings.' }, { status: 401 })
    }
    
    console.log('[transcribe] API key found, length:', apiKey.length)
    
    const openai = new OpenAI({ apiKey })

    // Re-parse form data for the file
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })

    console.log('[transcribe] Processing file:', file.name, 'size:', file.size, 'type:', file.type)

    // If file is large (> 20MB), split into chunks client-side is ideal; here we do a naive server chunking by slicing bytes
    const maxChunkBytes = 20 * 1024 * 1024 // 20MB target per chunk
    const arrayBuffer = await file.arrayBuffer()
    const raw = new Uint8Array(arrayBuffer)

    const chunks: { start: number; end: number }[] = []
    if (raw.byteLength <= maxChunkBytes) {
      chunks.push({ start: 0, end: raw.byteLength })
    } else {
      for (let offset = 0; offset < raw.byteLength; offset += maxChunkBytes) {
        chunks.push({ start: offset, end: Math.min(offset + maxChunkBytes, raw.byteLength) })
      }
    }

    console.log(`[transcribe] Total size=${raw.byteLength}, chunks=${chunks.length}`)

    const parts: string[] = []
    for (let i = 0; i < chunks.length; i++) {
      const { start, end } = chunks[i]
      const slice = raw.slice(start, end)
      const blob = new Blob([slice], { type: file.type || 'application/octet-stream' })
      console.log(`[transcribe] Whisper chunk ${i + 1}/${chunks.length}, bytes=${slice.byteLength}`)
      const resp = await openai.audio.transcriptions.create({
        file: new File([blob], `${file.name || 'audio'}.part${i + 1}.wav`, { type: blob.type }),
        model: 'whisper-1',
        response_format: 'verbose_json'
      })
      parts.push(resp.text || '')
    }

    const fullText = parts.join('\n').trim()

    console.log('[transcribe] Transcription successful, text length:', fullText.length)
    return NextResponse.json({
      text: fullText,
      language: 'en',
      duration: undefined
    })
  } catch (err: any) {
    console.error('[api/ai/transcribe] error:', err)
    
    // Provide more helpful error messages
    let errorMessage = err?.message || 'Transcription failed'
    if (errorMessage.includes('401')) {
      errorMessage = 'Invalid OpenAI API key. Please check your API key in settings.'
    } else if (errorMessage.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please try again later.'
    } else if (errorMessage.includes('413')) {
      errorMessage = 'File too large. Please use a smaller audio/video file.'
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
