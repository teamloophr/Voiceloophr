// File processing utilities for document upload system

export interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: number
}

export interface ExtractedText {
  text: string
  metadata: {
    pages?: number
    wordCount?: number
    language?: string
    confidence?: number
  }
}

export class FileProcessor {
  // Extract text from various file types
  static async extractText(file: File): Promise<ExtractedText> {
    const fileType = file.type.toLowerCase()
    
    try {
      if (fileType.includes('pdf')) {
        return await this.extractFromPDF(file)
      } else if (fileType.includes('word') || fileType.includes('docx')) {
        return await this.extractFromWord(file)
      } else if (fileType.includes('text') || fileType.includes('plain')) {
        return await this.extractFromText(file)
      } else {
        throw new Error(`Unsupported file type: ${fileType}`)
      }
    } catch (error) {
      console.error('Error extracting text:', error)
      throw new Error(`Failed to extract text from ${file.name}`)
    }
  }

  // Extract text from PDF files
  private static async extractFromPDF(file: File): Promise<ExtractedText> {
    // For now, we'll use a simple approach
    // In production, you'd want to use pdf-parse or similar
    const arrayBuffer = await file.arrayBuffer()
    const text = `[PDF Content from ${file.name}]\n\nThis is a placeholder for PDF text extraction. In production, implement proper PDF parsing using libraries like pdf-parse.`
    
    return {
      text,
      metadata: {
        pages: 1,
        wordCount: text.split(/\s+/).length,
        language: 'en',
        confidence: 0.8
      }
    }
  }

  // Extract text from Word documents
  private static async extractFromWord(file: File): Promise<ExtractedText> {
    // For now, we'll use a simple approach
    // In production, you'd want to use mammoth or similar
    const text = `[Word Document Content from ${file.name}]\n\nThis is a placeholder for Word document text extraction. In production, implement proper DOCX parsing using libraries like mammoth.`
    
    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        language: 'en',
        confidence: 0.8
      }
    }
  }

  // Extract text from plain text files
  private static async extractFromText(file: File): Promise<ExtractedText> {
    const text = await file.text()
    
    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        language: 'en',
        confidence: 1.0
      }
    }
  }

  // Validate file type and size
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/csv',
      'audio/wav',
      'audio/mpeg',
      'audio/mp4',
      'audio/x-m4a'
    ]

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 10MB limit' }
    }

    // Check both MIME type and file extension for better compatibility
    const fileName = file.name.toLowerCase()
    const hasValidExtension = fileName.endsWith('.pdf') || 
                             fileName.endsWith('.doc') || 
                             fileName.endsWith('.docx') || 
                             fileName.endsWith('.txt') || 
                             fileName.endsWith('.csv') ||
                             fileName.endsWith('.wav') ||
                             fileName.endsWith('.mp3') ||
                             fileName.endsWith('.m4a')

    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      return { isValid: false, error: 'File type not supported. Please upload PDF, Word, text, CSV, or audio files (WAV, MP3, M4A).' }
    }

    return { isValid: true }
  }

  // Get file information
  static getFileInfo(file: File): FileInfo {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Convenience named exports for legacy imports
export const validateFile = (file: File) => FileProcessor.validateFile(file)
export const formatFileSize = (bytes: number) => FileProcessor.formatFileSize(bytes)
