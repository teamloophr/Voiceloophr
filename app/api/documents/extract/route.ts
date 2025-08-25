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

async function extractFromCSV(file: File) {
  const text = await file.text()
  const lines = text.split('\n')
  const headers = lines[0]?.split(',').map(h => h.trim()) || []
  const rows = lines.slice(1).filter(line => line.trim()).map(line => 
    line.split(',').map(cell => cell.trim())
  )
  
  // Create a structured summary
  const summary = `CSV with ${headers.length} columns and ${rows.length} rows.\n\nHeaders: ${headers.join(', ')}\n\nFirst few rows:\n${rows.slice(0, 3).map(row => row.join(', ')).join('\n')}`
  
  return { 
    text: summary, 
    metadata: { 
      wordCount: summary.split(/\s+/).length,
      columns: headers.length,
      rows: rows.length,
      fileType: 'csv'
    } 
  }
}

async function extractFromAudio(file: File) {
  // For audio files, we'll return a placeholder since transcription requires additional processing
  const audioInfo = `Audio file: ${file.name}\nType: ${file.type}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\n\nNote: Audio transcription requires separate processing. Please use the voice transcription feature for detailed analysis.`
  
  return { 
    text: audioInfo, 
    metadata: { 
      wordCount: audioInfo.split(/\s+/).length,
      fileType: 'audio',
      duration: 'Unknown',
      sampleRate: 'Unknown'
    } 
  }
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
    const fileName = file.name.toLowerCase()
    let extracted
    
    if (type.includes('pdf') || fileName.endsWith('.pdf')) {
      extracted = await extractFromPDF(file)
    } else if (type.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      extracted = await extractFromDocx(file)
    } else if (type.includes('csv') || fileName.endsWith('.csv')) {
      extracted = await extractFromCSV(file)
    } else if (type.includes('audio') || fileName.endsWith('.wav') || fileName.endsWith('.mp3') || fileName.endsWith('.m4a')) {
      extracted = await extractFromAudio(file)
    } else {
      extracted = await extractFromText(file)
    }

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
