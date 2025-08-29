import OpenAI from 'openai'

export interface PDFAnalysisResult {
  text: string
  confidence: number
  extractionMethod: string
  metadata: {
    pages: number
    wordCount: number
    hasImages: boolean
    isScanned: boolean
    quality: 'high' | 'medium' | 'low'
    notes: string[]
  }
}

export interface PDFProcessingOptions {
  enableOCR?: boolean
  maxPages?: number
  qualityThreshold?: number
  enableImageAnalysis?: boolean
}

export class EnhancedPDFProcessor {
  private static openai: OpenAI | null = null

  private static getOpenAIClient(apiKey?: string): OpenAI {
    if (this.openai) return this.openai
    
    const key = apiKey || process.env.OPENAI_API_KEY
    if (!key) {
      throw new Error('OpenAI API key is required for enhanced PDF processing')
    }
    
    this.openai = new OpenAI({ 
      apiKey: key,
      dangerouslyAllowBrowser: true
    })
    
    return this.openai
  }

  /**
   * Enhanced PDF content analysis with multiple extraction strategies
   */
  static async analyzePDFContent(
    rawContent: string, 
    options: PDFProcessingOptions = {},
    apiKey?: string
  ): Promise<PDFAnalysisResult> {
    const {
      enableOCR = false,
      maxPages = 50,
      qualityThreshold = 0.3,
      enableImageAnalysis = false
    } = options

    try {
      console.log('[EnhancedPDFProcessor] Starting enhanced PDF analysis')
      
      // Step 1: Content quality assessment
      const qualityScore = this.assessContentQuality(rawContent)
      console.log('[EnhancedPDFProcessor] Content quality score:', qualityScore)
      
      // Step 2: Determine extraction strategy based on content quality
      let extractionMethod = 'standard'
      let confidence = 0
      let processedText = rawContent
      
      if (qualityScore.isScanned || qualityScore.hasLowTextQuality) {
        extractionMethod = 'ai_enhanced'
        if (enableOCR) {
          extractionMethod = 'ocr_enhanced'
        }
      } else if (qualityScore.hasGoodTextQuality) {
        extractionMethod = 'structured'
      }
      
      // Step 3: Apply appropriate extraction strategy
      switch (extractionMethod) {
        case 'structured':
          processedText = this.extractStructuredContent(rawContent)
          confidence = Math.min(95, qualityScore.textQuality + 20)
          break
          
        case 'ai_enhanced':
          processedText = await this.enhanceWithAI(rawContent, apiKey)
          confidence = Math.min(85, qualityScore.textQuality + 30)
          break
          
        case 'ocr_enhanced':
          processedText = await this.processWithOCR(rawContent, apiKey)
          confidence = Math.min(75, qualityScore.textQuality + 40)
          break
          
        default:
          processedText = this.cleanBasicContent(rawContent)
          confidence = Math.max(20, qualityScore.textQuality)
      }
      
      // Step 4: Final quality check and confidence adjustment
      const finalQuality = this.assessContentQuality(processedText)
      if (finalQuality.textQuality > qualityScore.textQuality) {
        confidence += 10
      }
      
      confidence = Math.min(100, Math.max(0, confidence))
      
      return {
        text: processedText,
        confidence,
        extractionMethod,
        metadata: {
          pages: this.estimatePageCount(rawContent),
          wordCount: processedText.split(/\s+/).length,
          hasImages: qualityScore.hasImages,
          isScanned: qualityScore.isScanned,
          quality: this.getQualityLevel(confidence),
          notes: this.generateProcessingNotes(extractionMethod, qualityScore)
        }
      }
      
    } catch (error) {
      console.error('[EnhancedPDFProcessor] Analysis failed:', error)
      return {
        text: rawContent,
        confidence: 0,
        extractionMethod: 'failed',
        metadata: {
          pages: 1,
          wordCount: rawContent.split(/\s+/).length,
          hasImages: false,
          isScanned: false,
          quality: 'low',
          notes: [`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }
      }
    }
  }

  /**
   * Assess the quality and characteristics of PDF content
   */
  private static assessContentQuality(content: string) {
    const pdfArtifacts = (content.match(/endstream|endobj|stream|BT|ET|Td|Tj|TJ|Tm|Tc|Tw|Tz|TL|Ts|Tr|Ts|Tf/g) || []).length
    const binaryContent = (content.match(/[^\x20-\x7E\n\r\t]/g) || []).length
    const contentLength = content.length
    const wordCount = content.split(/\s+/).length
    
    // Calculate text quality score (0-100)
    let textQuality = 100
    
    // Penalize for PDF artifacts
    if (pdfArtifacts > 0) {
      textQuality -= Math.min(40, pdfArtifacts * 2)
    }
    
    // Penalize for binary content
    if (binaryContent > 0) {
      textQuality -= Math.min(30, binaryContent * 0.6)
    }
    
    // Penalize for very short content
    if (contentLength < 100) {
      textQuality -= 20
    }
    
    // Penalize for very few words
    if (wordCount < 20) {
      textQuality -= 15
    }
    
    // Check for meaningful content indicators
    const hasSentences = /[.!?]/.test(content)
    const hasCapitalization = /[A-Z]/.test(content)
    const hasCommonWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/i.test(content)
    
    if (hasSentences) textQuality += 10
    if (hasCapitalization) textQuality += 5
    if (hasCommonWords) textQuality += 5
    
    // Ensure quality is within bounds
    textQuality = Math.max(0, Math.min(100, textQuality))
    
    return {
      textQuality,
      isScanned: textQuality < 30 || pdfArtifacts > 20,
      hasLowTextQuality: textQuality < 50,
      hasGoodTextQuality: textQuality > 70,
      hasImages: /image|img|picture|photo/i.test(content),
      pdfArtifacts,
      binaryContent,
      contentLength,
      wordCount
    }
  }

  /**
   * Extract structured content from well-formatted PDFs
   */
  private static extractStructuredContent(content: string): string {
    return content
      .replace(/endstream|endobj|\d+\s+\d+\s+obj|<<|>>|stream|BT|ET|Td|Tj|TJ|Tm|Tc|Tw|Tz|TL|Ts|Tr|Ts|Tf/g, '')
      .replace(/\/[A-Za-z]+\s+\/[A-Za-z]+/g, '')
      .replace(/\/[A-Za-z]+\s+\d+/g, '')
      .replace(/\d+\.?\d*\s+\d+\.?\d*\s+[A-Za-z]+/g, '')
      .replace(/[^\x20-\x7E\n\r\t]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/([A-Z])\s+([A-Z])/g, '$1 $2')
      .replace(/([a-z])\s+([A-Z])/g, '$1 $2')
      .replace(/\n\s*\n/g, '\n')
      .trim()
  }

  /**
   * Enhance content using AI for better understanding
   */
  private static async enhanceWithAI(content: string, apiKey?: string): Promise<string> {
    try {
      const openai = this.getOpenAIClient(apiKey)
      
      const prompt = `You are an expert document parser. Analyze this PDF content and extract ONLY the meaningful, human-readable text.

REQUIREMENTS:
1. Remove all PDF artifacts, binary data, and technical jargon
2. Preserve the logical structure and flow
3. Focus on content valuable for Human Resources professionals
4. Return clean, professional text suitable for reading aloud
5. Maintain document hierarchy and organization

PDF Content to Process:
${content.substring(0, 8000)}${content.length > 8000 ? '\n\n[Content truncated for processing]' : ''}

Please provide a clean, structured extraction of the document content.`

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional document parser. Extract clean, readable content from PDF data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })

      const result = response.choices[0]?.message?.content || ''
      
      // Clean the AI response
      return result
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/[^\w\s\.\,\;\:\!\?\-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        
    } catch (error) {
      console.warn('[EnhancedPDFProcessor] AI enhancement failed, falling back to basic cleaning:', error)
      return this.cleanBasicContent(content)
    }
  }

  /**
   * Process content with OCR-like capabilities using AI
   */
  private static async processWithOCR(content: string, apiKey?: string): Promise<string> {
    try {
      const openai = this.getOpenAIClient(apiKey)
      
      const prompt = `This appears to be scanned or image-based PDF content. Please:

1. Extract and reconstruct the readable text content
2. Remove all PDF artifacts, coordinates, and technical data
3. Reconstruct sentences and paragraphs logically
4. Focus on Human Resources relevant content
5. Return clean, professional text

Scanned PDF Content:
${content.substring(0, 6000)}${content.length > 6000 ? '\n\n[Content truncated]' : ''}

Please reconstruct the readable content from this scanned document.`

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an OCR specialist. Reconstruct readable text from scanned PDF content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000
      })

      const result = response.choices[0]?.message?.content || ''
      
      return result
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/[^\w\s\.\,\;\:\!\?\-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        
    } catch (error) {
      console.warn('[EnhancedPDFProcessor] OCR processing failed, falling back to basic cleaning:', error)
      return this.cleanBasicContent(content)
    }
  }

  /**
   * Basic content cleaning for fallback scenarios
   */
  private static cleanBasicContent(content: string): string {
    return content
      .replace(/endstream|endobj|stream|BT|ET/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Estimate page count based on content characteristics
   */
  private static estimatePageCount(content: string): number {
    // Rough estimation based on content length and structure
    const contentLength = content.length
    const wordCount = content.split(/\s+/).length
    
    if (contentLength < 1000) return 1
    if (contentLength < 5000) return 2
    if (contentLength < 15000) return 3
    if (contentLength < 30000) return 5
    if (contentLength < 60000) return 10
    if (contentLength < 120000) return 20
    return Math.ceil(contentLength / 6000) // Rough estimate
  }

  /**
   * Get quality level based on confidence score
   */
  private static getQualityLevel(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= 80) return 'high'
    if (confidence >= 50) return 'medium'
    return 'low'
  }

  /**
   * Generate processing notes for transparency
   */
  private static generateProcessingNotes(method: string, quality: any): string[] {
    const notes = []
    
    notes.push(`Extraction method: ${method}`)
    notes.push(`Content quality score: ${quality.textQuality}/100`)
    
    if (quality.isScanned) {
      notes.push('Document appears to be scanned or image-based')
    }
    
    if (quality.pdfArtifacts > 0) {
      notes.push(`Removed ${quality.pdfArtifacts} PDF structure artifacts`)
    }
    
    if (quality.binaryContent > 0) {
      notes.push(`Filtered ${quality.binaryContent} binary characters`)
    }
    
    if (quality.contentLength < 200) {
      notes.push('Content appears to be very short or incomplete')
    }
    
    return notes
  }
}
