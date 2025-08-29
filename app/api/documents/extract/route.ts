import { NextRequest, NextResponse } from 'next/server'
import { EnhancedPDFProcessor } from '@/lib/pdf-utils'

// Force Node.js runtime for PDF processing compatibility
// pdf-parse and pdfjs-dist require Node.js APIs that aren't available in Edge Runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function extractFromPDF(file: File) {
  try {
    console.log('[extractFromPDF] Starting enhanced PDF extraction for:', file.name)
    console.log('[extractFromPDF] File size:', file.size, 'bytes')
    console.log('[extractFromPDF] File type:', file.type)
    
    // Validate file object
    if (!file || file.size === 0) {
      throw new Error('Invalid file: file is empty or undefined')
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Failed to read file data: arrayBuffer is empty')
    }
    
    console.log('[extractFromPDF] ArrayBuffer created, size:', arrayBuffer.byteLength)
    
    // Strategy 1: Try PDF.js structured extraction (best for text-based PDFs)
    try {
      console.log('[extractFromPDF] Strategy 1: Attempting PDF.js structured extraction...')
      const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs')
      
      // Configure PDF.js worker (optional)
      try {
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs' as any)
        if (pdfjsWorker.default) {
          (pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker.default
        }
      } catch (workerError) {
        // Worker configuration is optional, continue without it
        console.log('[extractFromPDF] PDF.js worker not configured, using main thread processing')
      }
      
      const loadingTask = (pdfjsLib as any).getDocument({ 
        data: new Uint8Array(arrayBuffer),
        verbosity: 0 // Reduce console noise
      })
      
      const pdf = await loadingTask.promise
      console.log('[extractFromPDF] PDF loaded successfully, pages:', pdf.numPages)
      
      let extracted = ''
      let pageCount = 0
      const maxPages = Math.min(pdf.numPages, 50) // Limit to prevent memory issues
      
      for (let i = 1; i <= maxPages; i++) {
        try {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          const strings = (content.items || [])
            .map((it: any) => it.str)
            .filter(Boolean)
            .join(' ')
          
          if (strings.trim()) {
            extracted += strings + '\n'
            pageCount++
          }
          
          // Check if we have enough content
          if (extracted.length > 50000) {
            console.log(`[extractFromPDF] Sufficient content extracted from ${i} pages`)
            break
          }
        } catch (pageError) {
          console.warn(`[extractFromPDF] Error processing page ${i}:`, pageError)
          continue // Continue with next page
        }
      }
      
      const extractedText = extracted.trim()
      if (extractedText.length > 200) {
        console.log('[extractFromPDF] PDF.js extraction successful, length:', extractedText.length, 'pages:', pageCount)
        return {
          text: extractedText,
          metadata: {
            pages: pageCount,
            wordCount: extractedText.split(/\s+/).length,
            note: 'pdfjs-structured-extraction',
            confidence: 85
          }
        }
      }
    } catch (pdfjsErr) {
      console.warn('[extractFromPDF] PDF.js extraction failed, trying next strategy:', pdfjsErr)
    }

    // Strategy 2: Try pdf-parse library (better for complex PDFs)
    try {
      console.log('[extractFromPDF] Strategy 2: Attempting pdf-parse extraction...')
      const pdfParse = await import('pdf-parse')
      const buffer = Buffer.from(arrayBuffer)
      const data = await pdfParse.default(buffer)
      
      if (data.text && data.text.trim().length > 200) {
        console.log('[extractFromPDF] pdf-parse extraction successful, length:', data.text.length)
        return {
          text: data.text.trim(),
          metadata: {
            pages: data.numpages || 1,
            wordCount: data.text.split(/\s+/).length,
            note: 'pdf-parse-extraction',
            confidence: 90
          }
        }
      }
    } catch (pdfParseErr) {
      console.warn('[extractFromPDF] pdf-parse extraction failed, trying next strategy:', pdfParseErr)
    }

    // Strategy 3: Enhanced AI-powered extraction with better prompts
    try {
      console.log('[extractFromPDF] Strategy 3: Attempting AI-powered extraction...')
      const textContent = await file.text()
      if (textContent && textContent.trim().length > 0) {
        console.log('[extractFromPDF] Raw text available, length:', textContent.length)
        
        // Enhanced AI prompt for better PDF parsing
        const enhancedPrompt = `You are an expert document parser specializing in PDF content extraction. Your task is to:

1. ANALYZE the provided PDF content and extract ONLY the meaningful, human-readable text
2. REMOVE all PDF artifacts, binary data, formatting commands, and technical jargon
3. PRESERVE the logical structure and flow of the original document
4. FOCUS on extracting actual content that would be valuable for Human Resources professionals
5. RETURN clean, professional text suitable for reading aloud and analysis

CRITICAL REQUIREMENTS:
- Extract ONLY readable, meaningful content
- Remove PDF structure markers, coordinates, and technical data
- Preserve document hierarchy and organization
- Use clear, professional language
- Ensure the output is suitable for text-to-speech software
- Focus on content that would be relevant for HR document analysis

PDF Content to Process:
${textContent.substring(0, 12000)}${textContent.length > 12000 ? '\n\n[Content truncated for processing]' : ''}

Please provide a clean, structured extraction of the document content.`
        
        const openaiResponse = await fetch('/api/ai/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: enhancedPrompt,
            userId: 'system',
            documentContext: ['PDF parsing request']
          })
        })
        
        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          const aiResponse = openaiData.response || ''
          
          if (aiResponse && aiResponse.trim().length > 200) {
            console.log('[extractFromPDF] AI-powered extraction successful, response length:', aiResponse.length)
            
            // Clean and validate AI response
            const cleanResponse = aiResponse
              .replace(/```[\s\S]*?```/g, '') // Remove code blocks
              .replace(/\[.*?\]/g, '') // Remove brackets
              .replace(/\(.*?\)/g, '') // Remove parentheses
              .replace(/[^\w\s\.\,\;\:\!\?\-]/g, '') // Keep only letters, numbers, spaces, and basic punctuation
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim()
            
            if (cleanResponse.length > 100) {
              return { 
                text: cleanResponse, 
                metadata: { 
                  pages: 1,
                  wordCount: cleanResponse.split(/\s+/).length,
                  note: 'AI-powered-PDF-parsing',
                  confidence: 75
                } 
              }
            }
          }
        }
      }
    } catch (aiError) {
      console.warn('[extractFromPDF] AI-powered extraction failed, trying fallback:', aiError)
    }

    // Strategy 4: Advanced text filtering and cleaning
    try {
      console.log('[extractFromPDF] Strategy 4: Attempting advanced text filtering...')
      const textContent = await file.text()
      if (textContent && textContent.trim().length > 0) {
        
        // Advanced PDF structure filtering
        const advancedCleanText = textContent
          // Remove PDF structure markers
          .replace(/endstream|endobj|\d+\s+\d+\s+obj|<<|>>|stream|BT|ET|Td|Tj|TJ|Tm|Tc|Tw|Tz|TL|Ts|Tr|Ts|Tf|Td|Tm|Tc|Tw|Tz|TL|Ts|Tr|Ts|Tf/g, '')
          // Remove PDF commands and operators
          .replace(/\/[A-Za-z]+\s+\/[A-Za-z]+/g, '')
          .replace(/\/[A-Za-z]+\s+\d+/g, '')
          // Remove coordinate systems and positioning
          .replace(/\d+\.?\d*\s+\d+\.?\d*\s+[A-Za-z]+/g, '')
          // Remove binary and non-printable characters
          .replace(/[^\x20-\x7E\n\r\t]/g, '')
          // Clean up spacing and formatting
          .replace(/\s+/g, ' ')
          .replace(/([A-Z])\s+([A-Z])/g, '$1 $2')
          .replace(/([a-z])\s+([A-Z])/g, '$1 $2')
          // Remove excessive whitespace
          .replace(/\n\s*\n/g, '\n')
          .trim()
        
        if (advancedCleanText.length > 300) {
          console.log('[extractFromPDF] Advanced filtering successful, length:', advancedCleanText.length)
          return { 
            text: advancedCleanText, 
            metadata: { 
              pages: 1,
              wordCount: advancedCleanText.split(/\s+/).length,
              note: 'advanced-PDF-filtering',
              confidence: 60
            } 
          }
        }
      }
    } catch (filterError) {
      console.warn('[extractFromPDF] Advanced filtering failed:', filterError)
    }

    // Strategy 5: Enhanced PDF processor (new advanced method)
    try {
      console.log('[extractFromPDF] Strategy 5: Attempting enhanced PDF processing...')
      const textContent = await file.text()
      if (textContent && textContent.trim().length > 0) {
        
        const enhancedResult = await EnhancedPDFProcessor.analyzePDFContent(
          textContent,
          {
            enableOCR: true,
            maxPages: 50,
            qualityThreshold: 0.3,
            enableImageAnalysis: true
          }
        )
        
        if (enhancedResult.text && enhancedResult.text.trim().length > 100) {
          console.log('[extractFromPDF] Enhanced processing successful, confidence:', enhancedResult.confidence)
          return { 
            text: enhancedResult.text, 
            metadata: { 
              pages: enhancedResult.metadata.pages,
              wordCount: enhancedResult.metadata.wordCount,
              note: `enhanced-${enhancedResult.extractionMethod}`,
              confidence: enhancedResult.confidence
            } 
          }
        }
      }
    } catch (enhancedError) {
      console.warn('[extractFromPDF] Enhanced processing failed, trying basic fallback:', enhancedError)
    }

    // Strategy 6: Basic text extraction with minimal processing (final fallback)
    try {
      console.log('[extractFromPDF] Strategy 6: Attempting basic text extraction...')
      const textContent = await file.text()
      if (textContent && textContent.trim().length > 0) {
        
        // Basic cleaning - just remove obvious PDF artifacts
        const basicCleanText = textContent
          .replace(/endstream|endobj|stream|BT|ET/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        
        if (basicCleanText.length > 100) {
          console.log('[extractFromPDF] Basic extraction successful, length:', basicCleanText.length)
          return { 
            text: basicCleanText, 
            metadata: { 
              pages: 1,
              wordCount: basicCleanText.split(/\s+/).length,
              note: 'basic-PDF-extraction',
              confidence: 40
            } 
          }
        }
      }
    } catch (basicError) {
      console.warn('[extractFromPDF] Basic extraction failed:', basicError)
    }
    
    // All strategies failed - return meaningful error
    console.log('[extractFromPDF] All extraction strategies failed')
    return {
      text: `Unable to extract readable content from the PDF file "${file.name}". This may be due to:
      
1. The PDF being image-based or scanned (requires OCR processing)
2. The PDF being corrupted or password-protected
3. The PDF containing only non-text elements
4. The file being in an unsupported PDF format

Please try uploading a different PDF file or contact support if this issue persists.`,
      metadata: {
        pages: undefined,
        wordCount: 0,
        note: 'extraction_failed_all_strategies',
        confidence: 0
      }
    }
    
  } catch (error) {
    console.error('[extractFromPDF] Critical error during extraction:', error)
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
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

async function extractFromSpreadsheet(file: File) {
  try {
    // Try to extract text from Excel/ODS files
    const { default: xlsx } = await import('xlsx')
    const ab = await file.arrayBuffer()
    const workbook = xlsx.read(ab, { type: 'buffer' })
    
    let allText = ''
    const sheetNames = workbook.SheetNames
    
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 })
      
      allText += `Sheet: ${sheetName}\n`
      allText += jsonData.map((row: any) => (row as any[]).join('\t')).join('\n')
      allText += '\n\n'
    }
    
    return { 
      text: allText.trim(), 
      metadata: { 
        wordCount: allText.split(/\s+/).length,
        sheets: sheetNames.length,
        fileType: 'spreadsheet'
      } 
    }
  } catch (error) {
    console.error('[extractFromSpreadsheet] Error:', error)
    // Fallback to basic text extraction
    const text = await file.text()
    return { 
      text: text.trim(), 
      metadata: { 
        wordCount: text.split(/\s+/).length,
        fileType: 'spreadsheet'
      } 
    }
  }
}

async function extractFromPresentation(file: File) {
  try {
    // Try to extract text from PowerPoint files
    const { default: xlsx } = await import('xlsx')
    const ab = await file.arrayBuffer()
    const workbook = xlsx.read(ab, { type: 'buffer' })
    
    let allText = ''
    const sheetNames = workbook.SheetNames
    
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 })
      
      allText += `Slide: ${sheetName}\n`
      allText += jsonData.map((row: any) => (row as any[]).join('\t')).join('\n')
      allText += '\n\n'
    }
    
    return { 
      text: allText.trim(), 
      metadata: { 
        wordCount: allText.split(/\s+/).length,
        slides: sheetNames.length,
        fileType: 'presentation'
      } 
    }
  } catch (error) {
    console.error('[extractFromPresentation] Error:', error)
    // Fallback to basic text extraction
    const text = await file.text()
    return { 
      text: text.trim(), 
      metadata: { 
        wordCount: text.split(/\s+/).length,
        fileType: 'presentation'
      } 
    }
  }
}

async function extractFromArchive(file: File) {
  try {
    // For now, return a placeholder since archive extraction requires additional libraries
    // In production, you would integrate with services like:
    // - node-unzipper for ZIP files
    // - tar for TAR files
    // - 7zip for 7Z files
    
    const archiveInfo = `Archive file: ${file.name}
Type: ${file.type}
Size: ${(file.size / 1024 / 1024).toFixed(2)} MB

Note: Archive extraction functionality is currently being implemented. This archive file will be processed for content extraction once the archive service is fully integrated.

For now, please upload individual documents (PDF, DOC, TXT, MD) for immediate text extraction and analysis.`
    
    return { 
      text: archiveInfo, 
      metadata: { 
        wordCount: archiveInfo.split(/\s+/).length,
        fileType: 'archive',
        fileName: file.name
      } 
    }
  } catch (error) {
    console.error('[extractFromArchive] Error:', error)
    throw new Error(`Archive extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function extractFromAudio(file: File) {
  // For audio files, we'll return a placeholder since transcription requires additional processing
  const audioInfo = `Audio file: ${file.name}\nType: ${file.type}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\n\nNote: This audio file was processed through the document extraction API. For better results, please use the file upload feature in the chat interface, which will automatically route audio files to the transcription API for proper audio-to-text conversion.`
  
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
    console.log('[POST] Request received, content-type:', req.headers.get('content-type'))
    
    const form = await req.formData()
    console.log('[POST] FormData parsed successfully')
    
    const file = form.get('file') as File | null
    const systemPrompt = (form.get('systemPrompt') as string) || ''
    const userPrompt = (form.get('userPrompt') as string) || ''

    if (!file) {
      console.error('[POST] No file found in form data')
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    // Validate file object
    console.log('[POST] File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    })

    if (!file.name || file.size === 0) {
      console.error('[POST] Invalid file: missing name or empty file')
      return NextResponse.json({ error: 'Invalid file: missing name or empty file' }, { status: 400 })
    }

    // Additional file validation
    try {
      // Test if we can access the file data
      const testBuffer = await file.arrayBuffer()
      if (testBuffer.byteLength === 0) {
        console.error('[POST] File appears to be empty or corrupted')
        return NextResponse.json({ error: 'File appears to be empty or corrupted' }, { status: 400 })
      }
      console.log('[POST] File buffer test passed, size:', testBuffer.byteLength)
    } catch (bufferError) {
      console.error('[POST] File buffer test failed:', bufferError)
      return NextResponse.json({ error: 'Failed to read file data' }, { status: 400 })
    }

    // Sanitize filename (strip any path hints)
    const safeName = (file.name || 'upload').split(/[\\/]/).pop() || 'upload'

    const type = (file.type || '').toLowerCase()
    const fileName = file.name.toLowerCase()
    let extracted
    
    console.log('[POST] Processing file:', { type, fileName, safeName })
    
    if (type.includes('pdf') || fileName.endsWith('.pdf')) {
      console.log('[POST] Processing as PDF file')
      extracted = await extractFromPDF(file)
    } else if (type.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc') || fileName.endsWith('.rtf') || fileName.endsWith('.odt') || fileName.endsWith('.pages')) {
      console.log('[POST] Processing as Word document')
      extracted = await extractFromDocx(file)
    } else if (type.includes('csv') || fileName.endsWith('.csv') || type.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx') || fileName.endsWith('.ods')) {
      console.log('[POST] Processing as spreadsheet file')
      extracted = await extractFromSpreadsheet(file)
    } else if (type.includes('powerpoint') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx') || fileName.endsWith('.odp')) {
      console.log('[POST] Processing as presentation file')
      extracted = await extractFromPresentation(file)
    } else if (type.includes('audio') || fileName.endsWith('.wav') || fileName.endsWith('.mp3') || fileName.endsWith('.m4a') || fileName.endsWith('.aac') || fileName.endsWith('.ogg') || fileName.endsWith('.flac')) {
      console.log('[POST] Processing as audio file')
      extracted = await extractFromAudio(file)
    } else if (type.includes('video') || fileName.endsWith('.mp4') || fileName.endsWith('.avi') || fileName.endsWith('.mov') || fileName.endsWith('.wmv') || fileName.endsWith('.flv') || fileName.endsWith('.webm') || fileName.endsWith('.mkv') || fileName.endsWith('.3gp')) {
      console.log('[POST] Processing as video file')
      extracted = await extractFromAudio(file) // Use audio extraction for video files
    } else if (type.includes('image') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.gif') || fileName.endsWith('.bmp') || fileName.endsWith('.tiff') || fileName.endsWith('.svg') || fileName.endsWith('.webp')) {
      console.log('[POST] Processing as image file')
      extracted = await extractFromAudio(file) // Placeholder for image processing
    } else if (type.includes('zip') || fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z') || fileName.endsWith('.tar') || fileName.endsWith('.gz')) {
      console.log('[POST] Processing as archive file')
      extracted = await extractFromArchive(file)
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      console.log('[POST] Processing as text file')
      extracted = await extractFromText(file)
    } else {
      console.log('[POST] Processing as generic text file')
      extracted = await extractFromText(file)
    }

    console.log('[POST] Extraction completed successfully')
    return NextResponse.json({ success: true, extracted, systemPrompt, userPrompt, filename: safeName })
  } catch (err: any) {
    console.error('[api/documents/extract] error:', err)
    let message = err?.message || 'Extraction failed'
    
    // Check for specific error types
    if (message.includes('ENOENT')) {
      message = 'File not found or inaccessible. This may be a file system error.'
    } else if (message.includes('EACCES')) {
      message = 'Permission denied accessing file. This may be a file system error.'
    } else if (message.includes('ENOMEM')) {
      message = 'Insufficient memory to process file. Try with a smaller file.'
    } else if (message.includes('Cannot read properties of null')) {
      message = 'File object is null or undefined. This may be a file upload issue.'
    } else if (message.includes('file.arrayBuffer is not a function')) {
      message = 'File object is corrupted or invalid. Please try uploading the file again.'
    }
    
    // Scrub any absolute paths from error messages
    message = message.replace(/[A-Za-z]:\\[^\s']+/g, '[path]')
                     .replace(/\/{1,2}[^\s']+/g, '[path]')
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
