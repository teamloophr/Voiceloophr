import OpenAI from 'openai'

export interface DocumentAnalysis {
  summary: string
  keyPoints: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
}

export interface TranscriptionResult {
  text: string
  language: string
  confidence: number
}

export class AIProcessor {
  private static getOpenAIClient(apiKey?: string) {
    const envKey = (typeof process !== 'undefined'
      ? (process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.DEV_OPENAI_API_KEY)
      : undefined) as string | undefined
    const key = apiKey || envKey
    if (!key) {
      throw new Error('OpenAI API key missing. Provide a key in settings or set OPENAI_API_KEY (or DEV_OPENAI_API_KEY for local testing).')
    }
    return new OpenAI({ 
      apiKey: key,
      dangerouslyAllowBrowser: true // Allow browser usage
    })
  }

  static async summarizeDocument(content: string, apiKey?: string): Promise<DocumentAnalysis> {
    try {
      const openai = this.getOpenAIClient(apiKey)
      const text = (content || '').trim()
      if (!text) {
        return {
          summary: 'No extractable text found in the document.',
          keyPoints: [],
          sentiment: 'neutral',
          confidence: 0
        }
      }
      
      // Get custom AI instructions for document analysis
      let systemInstructions = 'You are an HR expert. Analyze the user content and return ONLY a strict JSON object with keys: summary (string, 2-3 sentences), keyPoints (string[] of 3-6 concise points), sentiment (one of \'positive\'|\'negative\'|\'neutral\'), confidence (0-100 number). No markdown, no prose, only JSON.'
      
      try {
        if (typeof window !== 'undefined') {
          const storedGeneral = localStorage.getItem('voiceloophr-ai-instructions-general')
          if (storedGeneral) {
            systemInstructions = storedGeneral + '\n\nAnalyze the following document content and return ONLY a strict JSON object with keys: summary (string, 2-3 sentences), keyPoints (string[] of 3-6 concise points), sentiment (one of \'positive\'|\'negative\'|\'neutral\'), confidence (0-100 number). No markdown, no prose, only JSON.'
          }
        }
      } catch {
        console.log('Could not load custom AI instructions for document analysis, using defaults')
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemInstructions
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500
      })

      const result = response.choices[0]?.message?.content
      if (!result) {
        throw new Error('No response from OpenAI')
      }

      try {
        const parsed = JSON.parse(result)
        return {
          summary: parsed.summary || 'Summary not available',
          keyPoints: parsed.keyPoints || [],
          sentiment: parsed.sentiment || 'neutral',
          confidence: parsed.confidence || 0
        }
      } catch {
        // Try to extract JSON from text (e.g., wrapped in fences)
        try {
          const match = result.match(/\{[\s\S]*\}/)
          if (match) {
            const parsed2 = JSON.parse(match[0])
            return {
              summary: parsed2.summary || 'Summary not available',
              keyPoints: parsed2.keyPoints || [],
              sentiment: parsed2.sentiment || 'neutral',
              confidence: parsed2.confidence || 0
            }
          }
        } catch {}
        // Last resort fallback
        return {
          summary: result.substring(0, 200) + '...',
          keyPoints: [],
          sentiment: 'neutral',
          confidence: 0
        }
      }
    } catch (error) {
      console.error('Error summarizing document:', error)
      throw new Error(`Failed to summarize document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async transcribeAudio(audioBlob: Blob, apiKey?: string): Promise<TranscriptionResult> {
    try {
      const openai = this.getOpenAIClient(apiKey)
      await audioBlob.arrayBuffer() // allocate once; do not store base64 to avoid unused var
      const response = await openai.audio.transcriptions.create({
        file: new File([audioBlob], 'audio.webm', { type: 'audio/webm' }),
        model: "whisper-1",
        response_format: "verbose_json"
      })

      return {
        text: response.text,
        language: response.language || 'en',
        confidence: 0.9 // Whisper doesn't provide confidence, using default
      }
    } catch (error) {
      console.error('Error transcribing audio:', error)
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async generateEmbeddings(text: string, apiKey?: string): Promise<number[]> {
    try {
      const openai = this.getOpenAIClient(apiKey)
      
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        dimensions: 1536
      })

      return response.data[0]?.embedding || []
    } catch (error) {
      console.error('Error generating embeddings:', error)
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async embedChunks(chunks: Array<{ index: number; content: string }>, apiKey?: string): Promise<number[][]> {
    if (!chunks.length) return []
    const texts = chunks.map(c => c.content)
    const openai = this.getOpenAIClient(apiKey)
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      dimensions: 1536
    })
    return response.data.map(d => d.embedding)
  }

  static async processHRQuery(query: string, apiKey?: string, context?: string): Promise<string> {
    try {
      const openai = this.getOpenAIClient(apiKey)
      
      // Get custom AI instructions from localStorage
      let generalInstructions = 'You are an AI-powered Human Resources assistant. Provide helpful, professional, and accurate responses to Human Resources related questions.'
      let userInstructions = ''
      
      try {
        if (typeof window !== 'undefined') {
          const storedGeneral = localStorage.getItem('voiceloophr-ai-instructions-general')
          const storedUser = localStorage.getItem('voiceloophr-ai-instructions-user')
          
          if (storedGeneral) {
            generalInstructions = storedGeneral
          }
          if (storedUser) {
            userInstructions = storedUser
          }
        }
      } catch {
        console.log('Could not load custom AI instructions, using defaults')
      }
      
      // Combine instructions
      let systemPrompt = generalInstructions
      if (userInstructions.trim()) {
        systemPrompt += `\n\nAdditional user preferences: ${userInstructions}`
      }
      
      // Add context handling instruction and text-to-speech requirements
      systemPrompt += `\n\nIf context is provided, use it to give more relevant answers. Always be helpful, clear, and professional.

IMPORTANT FOR TEXT-TO-SPEECH: Your response must be completely clean text with NO special characters, NO markdown, NO emojis, NO asterisks (*), NO backticks, NO brackets [], NO parentheses (), and NO symbols. Use only letters, numbers, spaces, and basic punctuation (periods, commas, semicolons, colons, exclamation marks, question marks, hyphens). Avoid any characters that would sound awkward when read aloud by text-to-speech software.`
      
      const messages: Array<{ role: "system" | "user"; content: string }> = [
        { role: "system", content: systemPrompt },
        { role: "user", content: context ? `Context: ${context}\n\nQuestion: ${query}` : query }
      ]

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 500
      })

      const aiResponse = response.choices[0]?.message?.content || 'I apologize, but I was unable to process your request.'
      
      // Clean the response for text-to-speech
      const cleanResponse = aiResponse
        .replace(/```[\s\S]*?```/g, '') // Remove any code blocks
        .replace(/\[.*?\]/g, '') // Remove square brackets
        .replace(/\(.*?\)/g, '') // Remove parentheses
        .replace(/\*/g, '') // Remove asterisks
        .replace(/`/g, '') // Remove backticks
        .replace(/[#@%&+=]/g, '') // Remove hashtags, at symbols, percent, ampersand, plus, equals
        .replace(/[^\w\s\.\,\;\:\!\?\-]/g, '') // Keep only letters, numbers, spaces, and basic punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
      
      return cleanResponse || 'I apologize, but I was unable to process your request.'
    } catch (error) {
      console.error('Error processing HR query:', error)
      throw new Error(`Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
