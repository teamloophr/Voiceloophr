import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function extractFromPDF(file: File) {
  const { default: pdfParse } = await import('pdf-parse')
  const ab = await file.arrayBuffer()
  const buf = Buffer.from(ab)
  const out = await (pdfParse as any)(buf)
  const text = (out.text || '').trim()
  return { text, metadata: { pages: out.numpages || undefined, wordCount: text.split(/\s+/).length } }
}

async function extractFromDocx(file: File) {
  const { default: mammoth } = await import('mammoth')
  const ab = await file.arrayBuffer()
  const buf = Buffer.from(ab)
  const res = await mammoth.extractRawText({ buffer: buf })
  const text = (res.value || '').trim()
  return { text, metadata: { wordCount: text.split(/\s+/).length } }
}

async function extractFromText(file: File) {
  const text = (await file.text()).trim()
  return { text, metadata: { wordCount: text.split(/\s+/).length } }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const systemPrompt = (form.get('systemPrompt') as string) || ''
    const userPrompt = (form.get('userPrompt') as string) || ''

    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })

    // Sanitize filename (strip any path hints)
    const safeName = (file.name || 'upload').split(/[\\/]/).pop() || 'upload'

    const type = (file.type || '').toLowerCase()
    let extracted
    if (type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) extracted = await extractFromPDF(file)
    else if (type.includes('word') || file.name.toLowerCase().endsWith('.docx')) extracted = await extractFromDocx(file)
    else extracted = await extractFromText(file)

    return NextResponse.json({ success: true, extracted, systemPrompt, userPrompt, filename: safeName })
  } catch (err: any) {
    console.error('[api/documents/extract] error:', err)
    let message = err?.message || 'Extraction failed'
    // Scrub any absolute paths from error messages
    message = message.replace(/[A-Za-z]:\\[^\s']+/g, '[path]')
                     .replace(/\/{1,2}[^\s']+/g, '[path]')
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
