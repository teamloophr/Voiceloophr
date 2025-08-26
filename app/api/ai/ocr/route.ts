import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for image processing compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    console.log('[OCR] Request received, content-type:', req.headers.get('content-type'))
    
    const form = await req.formData()
    console.log('[OCR] FormData parsed successfully')
    
    const file = form.get('file') as File | null

    if (!file) {
      console.error('[OCR] No file found in form data')
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    // Validate file object
    console.log('[OCR] File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    })

    if (!file.name || file.size === 0) {
      console.error('[OCR] Invalid file: missing name or empty file')
      return NextResponse.json({ error: 'Invalid file: missing name or empty file' }, { status: 400 })
    }

    // Check if it's an image file
    const isImage = file.type.startsWith('image/') || 
                   file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|tiff|svg|webp)$/i)
    
    if (!isImage) {
      console.error('[OCR] File is not an image:', file.type)
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // For now, return a placeholder since OCR requires additional libraries
    // In production, you would integrate with services like:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // - Tesseract.js for client-side OCR
    
    const placeholderText = `Image file: ${file.name}
Type: ${file.type}
Size: ${(file.size / 1024 / 1024).toFixed(2)} MB

Note: OCR functionality is currently being implemented. This image file will be processed for text extraction once the OCR service is fully integrated.

For now, please upload text-based documents (PDF, DOC, TXT, MD) for immediate text extraction and analysis.`
    
    console.log('[OCR] Returning placeholder response')
    return NextResponse.json({ 
      success: true, 
      text: placeholderText,
      metadata: {
        confidence: 0.0,
        fileType: 'image',
        fileName: file.name,
        fileSize: file.size
      }
    })

  } catch (err: any) {
    console.error('[OCR] error:', err)
    let message = err?.message || 'OCR failed'
    
    // Scrub any absolute paths from error messages
    message = message.replace(/[A-Za-z]:\\[^\s']+/g, '[path]')
                     .replace(/\/{1,2}[^\s']+/g, '[path]')
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
