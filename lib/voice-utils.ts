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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
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

      this.recognition.onresult = (event: any) => {
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

      this.recognition.onerror = (event: any) => {
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

export interface AudioRecorder {
  start(): Promise<void>
  stop(): Promise<Blob>
  pause(): void
  resume(): void
  isRecording(): boolean
  getDuration(): number
}

export interface AudioSettings {
  sampleRate: number
  channelCount: number
  bitDepth: number
}

export class VoiceRecorder implements AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private startTime: number = 0
  private isPaused: boolean = false
  private pausedTime: number = 0

  constructor(private settings: AudioSettings = {
    sampleRate: 44100,
    channelCount: 1,
    bitDepth: 16
  }) {}

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.settings.sampleRate,
          channelCount: this.settings.channelCount,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      this.audioChunks = []
      this.startTime = Date.now()
      this.isPaused = false
      this.pausedTime = 0

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start(100) // Collect data every 100ms
    } catch (error) {
      console.error('Error starting recording:', error)
      throw new Error('Failed to start audio recording. Please check microphone permissions.')
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        this.cleanup()
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
    })
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
      this.isPaused = true
      this.pausedTime = Date.now()
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
      this.isPaused = false
      this.pausedTime = 0
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording' || this.mediaRecorder?.state === 'paused'
  }

  getDuration(): number {
    if (!this.startTime) return 0
    
    const currentTime = Date.now()
    const totalDuration = currentTime - this.startTime
    
    if (this.isPaused) {
      return totalDuration - (currentTime - this.pausedTime)
    }
    
    return totalDuration
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    
    this.mediaRecorder = null
    this.audioChunks = []
    this.startTime = 0
    this.isPaused = false
    this.pausedTime = 0
  }

  // Get current recording state
  getState(): 'inactive' | 'recording' | 'paused' {
    return this.mediaRecorder?.state || 'inactive'
  }

  // Get audio levels for visualization
  async getAudioLevels(): Promise<number[]> {
    if (!this.stream) return []
    
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(this.stream)
    const analyser = audioContext.createAnalyser()
    
    source.connect(analyser)
    analyser.fftSize = 256
    
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    return new Promise((resolve) => {
      const getLevels = () => {
        analyser.getByteFrequencyData(dataArray)
        const levels = Array.from(dataArray).map(value => value / 255)
        resolve(levels)
      }
      
      setTimeout(getLevels, 100)
    })
  }
}

// Utility functions for audio processing
export class AudioUtils {
  // Convert blob to base64 for API calls
  static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Format duration for display
  static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Validate audio file
  static validateAudioFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 25 * 1024 * 1024 // 25MB
    const allowedTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/wav',
      'audio/mpeg',
      'audio/ogg'
    ]

    if (file.size > maxSize) {
      return { isValid: false, error: 'Audio file size exceeds 25MB limit' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Audio file type not supported' }
    }

    return { isValid: true }
  }
}

export class VoiceSynthesizer {
  private apiKey?: string
  private currentVoice: string = "browser"
  private isPaused: boolean = false
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private volume: number = 1.0
  private rate: number = 0.95
  private sentences: string[] = []
  private currentIndex: number = 0
  private onProgress?: (info: { index: number; total: number; paused: boolean }) => void
  private currentAudio: HTMLAudioElement | null = null
  private availableElevenLabsVoices: { value: string; label: string }[] = []

  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }

  setVoice(voiceId: string) {
    this.currentVoice = voiceId
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume)) // Clamp between 0 and 1
  }

  getVolume(): number {
    return this.volume
  }

  setRate(rate: number) {
    this.rate = Math.max(0.5, Math.min(1.5, rate))
  }

  getRate(): number {
    return this.rate
  }

  onPlaybackProgress(callback: (info: { index: number; total: number; paused: boolean }) => void) {
    this.onProgress = callback
  }

  private splitTextIntoSentences(text: string): string[] {
    const chunks = text
      .replace(/\n+/g, " ")
      .match(/[^.!?]+[.!?]?/g)
    return (chunks || [text]).map(s => s.trim()).filter(Boolean)
  }

  private notifyProgress() {
    if (this.onProgress) {
      this.onProgress({ index: this.currentIndex, total: this.sentences.length, paused: this.isPaused })
    }
  }

  pause() {
    if (this.currentVoice === "browser" && window.speechSynthesis) {
      window.speechSynthesis.pause()
      this.isPaused = true
      this.notifyProgress()
    }
    if (this.currentVoice !== "browser" && this.currentAudio) {
      this.currentAudio.pause()
      this.isPaused = true
      this.notifyProgress()
    }
  }

  resume() {
    if (this.currentVoice === "browser" && window.speechSynthesis) {
      window.speechSynthesis.resume()
      this.isPaused = false
      this.notifyProgress()
    }
    if (this.currentVoice !== "browser" && this.currentAudio) {
      this.currentAudio.play()
      this.isPaused = false
      this.notifyProgress()
    }
  }

  togglePause() {
    if (this.isPaused) {
      this.resume()
    } else {
      this.pause()
    }
    return this.isPaused
  }

  isCurrentlyPaused(): boolean {
    return this.isPaused
  }

  async speak(text: string): Promise<void> {
    // No-op on empty text
    if (!text || !text.trim()) {
      return Promise.resolve()
    }
    this.sentences = this.splitTextIntoSentences(text)
    this.currentIndex = 0
    this.notifyProgress()
    if (this.currentVoice === "browser") {
      return this.speakWithBrowserSentences()
    } else {
      // For ElevenLabs, fall back to one-shot audio for now
      return this.speakWithElevenLabs(text)
    }
  }

  private async speakWithBrowserSentences(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      // Stop any current speech
      window.speechSynthesis.cancel()

      const speakCurrent = () => {
        if (this.currentIndex >= this.sentences.length) {
          this.isPaused = false
          this.currentUtterance = null
          this.notifyProgress()
          resolve()
          return
        }

        const text = this.sentences[this.currentIndex]
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.volume = this.volume
        utterance.rate = this.rate
        utterance.pitch = 1.0

        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          const englishVoice = voices.find(voice => 
            voice.lang.startsWith('en') && voice.name.includes('Google')
          ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0]
          if (englishVoice) utterance.voice = englishVoice
        }

        utterance.onend = () => {
          this.currentIndex += 1
          this.notifyProgress()
          speakCurrent()
        }
        utterance.onerror = (evt: any) => {
          this.isPaused = false
          const message = (evt && evt.error) ? String(evt.error) : 'Unknown speech synthesis error'
          reject(new Error(message))
        }

        this.currentUtterance = utterance
        this.isPaused = false
        this.notifyProgress()
        try {
          window.speechSynthesis.speak(utterance)
        } catch (e: any) {
          reject(new Error(e?.message || 'Failed to invoke speech synthesis'))
        }
      }

      speakCurrent()
    })
  }

  private async speakWithElevenLabs(text: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key required')
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.currentVoice}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `ElevenLabs API error: ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.detail?.message) {
            errorMessage += ` - ${errorData.detail.message}`
          }
        } catch {}
        throw new Error(errorMessage)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.volume = this.volume
      this.currentAudio = audio

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          this.currentAudio = null
          resolve()
        }
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl)
          this.currentAudio = null
          reject(new Error(`Audio playback error: ${error}`))
        }
        audio.play().catch(error => {
          URL.revokeObjectURL(audioUrl)
          this.currentAudio = null
          reject(new Error(`Failed to play audio: ${error}`))
        })
      })
    } catch (error) {
      console.error('ElevenLabs TTS error:', error)
      throw error
    }
  }

  stop() {
    if (this.currentVoice === "browser" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      this.isPaused = false
    }
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    this.currentUtterance = null
    this.sentences = []
    this.currentIndex = 0
    this.notifyProgress()
  }

  nextSentence() {
    if (this.currentVoice === "browser") {
      if (window.speechSynthesis.speaking) window.speechSynthesis.cancel()
      this.currentIndex = Math.min(this.currentIndex + 1, this.sentences.length - 1)
      if (this.sentences.length > 0) {
        // restart from current index
        this.speak(this.sentences.slice(this.currentIndex).join(' '))
      }
    } else if (this.currentAudio) {
      this.currentAudio.currentTime = Math.min(this.currentAudio.duration, this.currentAudio.currentTime + 10)
    }
    this.notifyProgress()
  }

  prevSentence() {
    if (this.currentVoice === "browser") {
      if (window.speechSynthesis.speaking) window.speechSynthesis.cancel()
      this.currentIndex = Math.max(this.currentIndex - 1, 0)
      if (this.sentences.length > 0) {
        this.speak(this.sentences.slice(this.currentIndex).join(' '))
      }
    } else if (this.currentAudio) {
      this.currentAudio.currentTime = Math.max(0, this.currentAudio.currentTime - 10)
    }
    this.notifyProgress()
  }

  seekToRatio(ratio: number) {
    const clamped = Math.max(0, Math.min(1, ratio))
    if (this.currentVoice === "browser") {
      const targetIndex = Math.floor(clamped * (this.sentences.length - 1))
      if (window.speechSynthesis.speaking) window.speechSynthesis.cancel()
      this.currentIndex = targetIndex
      if (this.sentences.length > 0) {
        this.speak(this.sentences.slice(this.currentIndex).join(' '))
      }
    } else if (this.currentAudio && this.currentAudio.duration) {
      this.currentAudio.currentTime = clamped * this.currentAudio.duration
    }
    this.notifyProgress()
  }

  getProgress(): number {
    if (this.currentVoice === "browser") {
      if (this.sentences.length === 0) return 0
      return this.currentIndex / this.sentences.length
    }
    if (this.currentAudio && this.currentAudio.duration) {
      return this.currentAudio.currentTime / this.currentAudio.duration
    }
    return 0
  }

  async getAvailableVoices(): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key required')
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`)
      }

      const data = await response.json()
      return data.voices || []
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error)
      throw error
    }
  }

  async loadElevenLabsVoices(): Promise<void> {
    if (!this.apiKey) return
    
    try {
      const voices = await this.getAvailableVoices()
      this.availableElevenLabsVoices = voices.map((voice: any) => ({
        value: voice.voice_id,
        label: voice.name
      }))
    } catch (error) {
      console.error('Failed to load ElevenLabs voices:', error)
      this.availableElevenLabsVoices = []
    }
  }

  getVoiceOptions(): { value: string; label: string }[] {
    const options = [
      { value: "browser", label: "Browser Default" }
    ]

    if (this.apiKey && this.availableElevenLabsVoices.length > 0) {
      options.push(...this.availableElevenLabsVoices)
    }

    return options
  }

  rewindSeconds(seconds: number) {
    if (this.currentVoice !== 'browser' && this.currentAudio) {
      this.currentAudio.currentTime = Math.max(0, this.currentAudio.currentTime - Math.abs(seconds))
    } else {
      this.prevSentence()
    }
  }

  fastForwardSeconds(seconds: number) {
    if (this.currentVoice !== 'browser' && this.currentAudio) {
      const dur = this.currentAudio.duration || 0
      this.currentAudio.currentTime = Math.min(dur, this.currentAudio.currentTime + Math.abs(seconds))
    } else {
      this.nextSentence()
    }
  }
}

// Global instances
export const voiceRecognition = new VoiceRecognition()
export const voiceSynthesis = new VoiceSynthesis()
