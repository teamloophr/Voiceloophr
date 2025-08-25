import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })
    const openai = new OpenAI({ apiKey })

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })

    // Streams are not supported directly by openai sdk in edge; use file
    const arrayBuffer = await file.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' })

    const resp = await openai.audio.transcriptions.create({
      file: new File([blob], file.name || 'audio.wav', { type: blob.type }),
      model: 'whisper-1',
      response_format: 'verbose_json'
    })

    return NextResponse.json({
      text: resp.text,
      language: resp.language || 'en',
      duration: (resp as any).duration || undefined
    })
  } catch (err: any) {
    console.error('[api/ai/transcribe] error:', err)
    return NextResponse.json({ error: err?.message || 'Transcription failed' }, { status: 500 })
  }
}
