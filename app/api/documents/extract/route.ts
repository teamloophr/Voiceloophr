import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for PDF processing compatibility
// pdf-parse and pdfjs-dist require Node.js APIs that aren't available in Edge Runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function extractFromPDF(file: File) {
  try {
    console.log('[extractFromPDF] Starting PDF extraction for:', file.name)
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
    
    // Try structured extraction via pdfjs-dist first
    try {
      console.log('[extractFromPDF] Attempting PDFJS text extraction...')
      const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs')
      const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(arrayBuffer) })
      const pdf = await loadingTask.promise
      let extracted = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const strings = (content.items || []).map((it: any) => it.str).filter(Boolean)
        extracted += strings.join(' ') + '\n'
        if (extracted.length > 80000) break
      }
      const extractedText = (extracted || '').trim()
      if (extractedText.length > 100) {
        console.log('[extractFromPDF] PDFJS extraction successful, length:', extractedText.length)
        return {
          text: extractedText,
          metadata: {
            pages: pdf.numPages,
            wordCount: extractedText.split(/\s+/).length,
            note: 'pdfjs-extraction'
          }
        }
      }
    } catch (pdfjsErr) {
      console.warn('[extractFromPDF] PDFJS extraction failed, falling back:', pdfjsErr)
    }

    // Fallback: attempt raw file text + AI cleanup
    try {
      console.log('[extractFromPDF] Attempting raw text + AI cleanup...')
      const textContent = await file.text()
      if (textContent && textContent.trim().length > 0) {
        console.log('[extractFromPDF] Raw text available, length:', textContent.length)
        
        // Use OpenAI to intelligently parse and summarize the PDF content
        const openaiResponse = await fetch('/api/ai/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You are a Human Resources document specialist and professional document parser. Your job is to:

1. Extract ONLY the relevant, readable text content from PDF data
2. Remove all PDF structure commands, binary data, formatting artifacts, and technical jargon
3. Convert the content into clean, plain English that can be read aloud naturally
4. Focus on Human Resources related content (resumes, job descriptions, policies, etc.)
5. Provide a clear, professional summary of the document's key information
6. Use simple, clear language without any special characters or symbols
7. Structure the response as a natural, flowing summary that sounds professional when spoken

CRITICAL REQUIREMENTS FOR TEXT-TO-SPEECH:
- Write in plain English suitable for text-to-speech
- NO emojis, NO markdown, NO asterisks (*), NO backticks, NO square brackets [], NO parentheses (), NO special symbols
- NO hashtags, NO at symbols, NO percent signs, NO ampersands, NO plus signs, NO equals signs
- Use "Human Resources" instead of "HR" for clarity when reading aloud
- Focus on the actual content, not technical details
- Make it sound natural and professional when read aloud
- Use only letters, numbers, spaces, periods, commas, semicolons, colons, exclamation marks, and question marks
- Avoid any characters that would sound awkward when read aloud by text-to-speech software`
              },
              {
                role: 'user',
                content: `Please analyze this PDF document and provide a clean, plain English summary that can be read aloud. Focus on extracting the actual content and presenting it in a clear, professional manner suitable for Human Resources professionals.

IMPORTANT: Your response must be completely clean text with NO special characters, NO markdown, NO emojis, NO asterisks, NO backticks, NO brackets, NO parentheses, and NO symbols. Use only letters, numbers, spaces, and basic punctuation (periods, commas, semicolons, colons, exclamation marks, question marks, hyphens).

The content to analyze:
${textContent.substring(0, 8000)}${textContent.length > 8000 ? '\n\n[Content truncated for processing]' : ''}`
              }
            ],
            model: 'gpt-3.5-turbo',
            max_tokens: 4000,
            temperature: 0.1
          })
        })
        
        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          const aiResponse = openaiData.choices?.[0]?.message?.content || ''
          
          if (aiResponse && aiResponse.trim().length > 100) {
            console.log('[extractFromPDF] OpenAI parsing successful, response length:', aiResponse.length)
            
            // Clean up the AI response to ensure it's plain text suitable for reading aloud
            const cleanResponse = aiResponse
              .replace(/```[\s\S]*?```/g, '') // Remove any code blocks
              .replace(/\[.*?\]/g, '') // Remove square brackets
              .replace(/\(.*?\)/g, '') // Remove parentheses
              .replace(/[^\w\s\.\,\;\:\!\?\-]/g, '') // Keep only letters, numbers, spaces, and basic punctuation
              .replace(/\s+/g, ' ') // Normalize whitespace
              .replace(/\*/g, '') // Remove any remaining asterisks
              .replace(/`/g, '') // Remove any remaining backticks
              .replace(/[#@%&+=]/g, '') // Remove hashtags, at symbols, percent, ampersand, plus, equals
              .replace(/\s+/g, ' ') // Normalize whitespace again
              .trim()
            
            if (cleanResponse.length > 50) {
              // Final validation: ensure no special characters remain
              const finalCleanResponse = cleanResponse
                .replace(/[^\w\s\.\,\;\:\!\?\-]/g, '') // Final cleanup of any remaining special characters
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim()
              
              if (finalCleanResponse.length > 50) {
                return { 
                  text: finalCleanResponse, 
                  metadata: { 
                    pages: 1, // Assume single page for now
                    wordCount: finalCleanResponse.split(/\s+/).length,
                    note: 'Smart PDF parsing with OpenAI - completely clean text suitable for text-to-speech'
                  } 
                }
              }
            }
          } else {
            console.log('[extractFromPDF] OpenAI parsing returned insufficient content')
          }
        } else {
          console.log('[extractFromPDF] OpenAI API call failed, status:', openaiResponse.status)
        }
      }
      
      // Fallback: smart text extraction with better filtering
      console.log('[extractFromPDF] OpenAI parsing failed, using smart fallback...')
      if (textContent && textContent.trim().length > 0) {
        // Advanced filtering to extract readable content
        const smartCleanText = textContent
          .replace(/endstream|endobj|\d+\s+\d+\s+obj|<<|>>|stream|BT|ET|Td|Tj|TJ|Tm|Tc|Tw|Tz|TL|Ts|Tr|Ts|Tf|Td|Tm|Tc|Tw|Tz|TL|Ts|Tr|Ts|Tf/g, '') // Remove PDF structure
          .replace(/\/[A-Za-z]+\s+\/[A-Za-z]+/g, '') // Remove PDF commands
          .replace(/[^\x20-\x7E\n\r\t]/g, '') // Keep only printable ASCII
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/([A-Z])\s+([A-Z])/g, '$1 $2') // Fix spacing between capital letters
          .replace(/([a-z])\s+([A-Z])/g, '$1 $2') // Fix spacing between lowercase and uppercase
          .trim()
        
        if (smartCleanText.length > 100) {
          console.log('[extractFromPDF] Smart fallback successful, length:', smartCleanText.length)
          return { 
            text: smartCleanText, 
            metadata: { 
              pages: 1,
              wordCount: smartCleanText.split(/\s+/).length,
              note: 'Smart fallback extraction - advanced PDF structure filtering'
            } 
          }
        }
      }
      
      // Final fallback: signal extraction failure without injecting generic text
      console.log('[extractFromPDF] All extraction methods failed')
      return {
        text: '',
        metadata: {
          pages: undefined,
          wordCount: 0,
          note: 'extraction_failed'
        }
      }
    } catch (extractionError) {
      console.error('[extractFromPDF] All extraction methods failed:', extractionError)
      // Signal failure instead of fabricating content
      return {
        text: '',
        metadata: {
          pages: undefined,
          wordCount: 0,
          note: 'extraction_failed'
        }
      }
    }
  } catch (error) {
    console.error('[extractFromPDF] Error details:', error)
    console.error('[extractFromPDF] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
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
