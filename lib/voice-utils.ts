// Voice processing utilities for speech recognition and synthesis

export interface VoiceRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  maxAlternatives?: number
}

export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

export class VoiceRecognition {
  private recognition: any | null = null
  private isSupported = false
  private isListening = false

  constructor() {
    this.isSupported = this.checkSupport()
    if (this.isSupported) {
      this.initializeRecognition()
    }
  }

  private checkSupport(): boolean {
    return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  }

  private initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()
  }

  public isVoiceSupported(): boolean {
    return this.isSupported
  }

  public isCurrentlyListening(): boolean {
    return this.isListening
  }

  public async startListening(
    options: VoiceRecognitionOptions = {},
    onResult: (result: VoiceRecognitionResult) => void,
    onError: (error: string) => void,
  ): Promise<void> {
    if (!this.isSupported || !this.recognition) {
      onError("Speech recognition is not supported in this browser")
      return
    }

    if (this.isListening) {
      onError("Already listening")
      return
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })

      // Configure recognition
      this.recognition.continuous = options.continuous ?? true
      this.recognition.interimResults = options.interimResults ?? true
      this.recognition.lang = options.language ?? "en-US"
      this.recognition.maxAlternatives = options.maxAlternatives ?? 1

      // Set up event handlers
      this.recognition.onstart = () => {
        this.isListening = true
        console.log("[v0] Voice recognition started")
      }

      this.recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1]
        const transcript = result[0].transcript
        const confidence = result[0].confidence
        const isFinal = result.isFinal

        onResult({
          transcript,
          confidence,
          isFinal,
        })
      }

      this.recognition.onerror = (event) => {
        this.isListening = false
        console.error("[v0] Voice recognition error:", event.error)
        onError(`Speech recognition error: ${event.error}`)
      }

      this.recognition.onend = () => {
        this.isListening = false
        console.log("[v0] Voice recognition ended")
      }

      // Start recognition
      this.recognition.start()
    } catch (error) {
      console.error("[v0] Microphone access error:", error)
      onError("Microphone access denied or not available")
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }
}

export class VoiceSynthesis {
  private synthesis: any | null = null
  private isSupported = false

  constructor() {
    this.isSupported = this.checkSupport()
    if (this.isSupported) {
      this.synthesis = window.speechSynthesis
    }
  }

  private checkSupport(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window
  }

  public isSpeechSupported(): boolean {
    return this.isSupported
  }

  public getAvailableVoices(): any[] {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }

  public speak(
    text: string,
    options: {
      voice?: any
      rate?: number
      pitch?: number
      volume?: number
    } = {},
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error("Speech synthesis not supported"))
        return
      }

      // Cancel any ongoing speech
      this.synthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Configure utterance
      if (options.voice) utterance.voice = options.voice
      utterance.rate = options.rate ?? 1
      utterance.pitch = options.pitch ?? 1
      utterance.volume = options.volume ?? 1

      // Set up event handlers
      utterance.onend = () => {
        console.log("[v0] Speech synthesis completed")
        resolve()
      }

      utterance.onerror = (event) => {
        console.error("[v0] Speech synthesis error:", event.error)
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }

      // Start speaking
      this.synthesis.speak(utterance)
    })
  }

  public stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  public pause(): void {
    if (this.synthesis) {
      this.synthesis.pause()
    }
  }

  public resume(): void {
    if (this.synthesis) {
      this.synthesis.resume()
    }
  }
}

// Global instances
export const voiceRecognition = new VoiceRecognition()
export const voiceSynthesis = new VoiceSynthesis()
