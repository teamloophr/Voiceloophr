"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, Sun, Moon, Paperclip, Mic, Volume2, Settings, LogOut, Calendar as CalendarIcon, LogIn, Users } from "lucide-react"
import CalendarModal from "@/components/calendar/calendar-modal"
import AuthModal from "@/components/auth/auth-modal"
import CandidateResourcesModal from "@/components/candidate-resources/candidate-resources-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AIProcessor } from "@/lib/ai-processing"
import { FileProcessor } from "@/lib/file-utils"
import { VoiceRecorder, AudioUtils, VoiceSynthesizer } from "@/lib/voice-utils"
import { supabase } from "@/lib/supabase"
import type { DocumentAnalysis, TranscriptionResult } from "@/lib/ai-processing"
import { SettingsPanel } from "@/components/settings/settings-panel"
import { useAuth } from "@/contexts/auth-context"
import { WaveAnimation } from "@/components/wave-animation-1"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  type: "text" | "file" | "voice" | "analysis"
  metadata?: {
    fileName?: string
    fileSize?: string
    analysis?: DocumentAnalysis
    transcription?: TranscriptionResult
    file?: File
    extractedText?: any
    requiresAction?: boolean
    savedToRAG?: boolean
  }
}

interface EnhancedChatInterfaceProps {
  isDarkMode: boolean
  onToggleTheme: () => void
}

export function EnhancedChatInterface({ isDarkMode, onToggleTheme }: EnhancedChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
        content: "Hello. I am your AI Human Resources assistant. I can help you with\n\n- Document analysis and summarization\n- Voice transcription and queries\n- Resume search and candidate matching\n- Calendar integration\n\nHow can I assist you today?",
      role: "assistant",
      timestamp: new Date(),
      type: "text"
    },
  ])
  
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { user, signOut, getUserSettings, isGuest } = useAuth()
  const [userApiKey, setUserApiKey] = useState<string>("")
  const [userElevenLabsKey, setUserElevenLabsKey] = useState<string>("")
  const [selectedVoice, setSelectedVoice] = useState<string>("browser")
  const [availableVoices, setAvailableVoices] = useState<{ value: string; label: string }[]>([])
  const [voiceSynthesizer, setVoiceSynthesizer] = useState<VoiceSynthesizer | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isCandidateResourcesOpen, setIsCandidateResourcesOpen] = useState(false)
  const [volume, setVolume] = useState(1.0)
  // Drag state for message bubbles
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragStartRef = useRef<{ id: string; startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  // Particle color hue control
  const [hue, setHue] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const visual = window.localStorage.getItem('voiceloophr-visual')
      if (visual) {
        try { return Number(JSON.parse(visual).hue ?? 50) } catch {}
      }
      const h = window.localStorage.getItem('voiceloophr-hue')
      if (h) return Number(h)
    }
    return 50
  })
  // Removed auto hue speed (stability)
  const [hueAutoSpeed] = useState<number>(0)
  // Derived particle color (no extra state)
  const particleColor = React.useMemo(() => {
    const s = isDarkMode ? 100 : 85
    const l = isDarkMode ? 55 : 30
    return (function hslToHexWrap(h: number, s: number, l: number) {
      s /= 100; l /= 100
      const k = (n: number) => (n + h / 30) % 12
      const a = s * Math.min(l, 1 - l)
      const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
      const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0')
      return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
    })(hue, s, l)
  }, [hue, isDarkMode])
  // Composer (input area) draggable support
  const composerRef = useRef<HTMLDivElement>(null)
  const [composerDocked, setComposerDocked] = useState(true)
  const [composerPos, setComposerPos] = useState<{ x: number; y: number }>({ x: 24, y: 0 })
  const composerDragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isComposerDragging, setIsComposerDragging] = useState(false)
  // Resizable messages area
  const [viewportH, setViewportH] = useState(800)
  const [messagesHeightRatio, setMessagesHeightRatio] = useState(0.6)
  useEffect(() => {
    const update = () => setViewportH(window.innerHeight)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const messagesHeightPx = Math.max(220, Math.min(viewportH - 160, Math.round(viewportH * messagesHeightRatio)))

  // Light/Dark aware UI tokens
  // Keyboard shortcuts to open windows (Alt+C calendar, Alt+A auth)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        setIsCalendarOpen(true)
        try { window.location.hash = '#calendar' } catch {}
      }
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        setIsAuthOpen(true)
        try { window.location.hash = '#auth' } catch {}
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleOpenCalendar = () => {
    try { console.debug('[UI] Open Calendar clicked') } catch {}
    setIsCalendarOpen(true)
    try { window.location.hash = '#calendar' } catch {}
  }
  const handleOpenAuth = () => {
    try { console.debug('[UI] Open Auth clicked') } catch {}
    console.log('🔐 Setting auth modal to open, current state:', { isAuthOpen, user })
    setIsAuthOpen(true)
    try { window.location.hash = '#auth' } catch {}
    console.log('🔐 Auth modal state after set:', { isAuthOpen: true, user })
  }
  
  const handleOpenCandidateResources = () => {
    try { console.debug('[UI] Open Candidate Resources clicked') } catch {}
    setIsCandidateResourcesOpen(true)
    try { window.location.hash = '#candidate-resources' } catch {}
  }

  // Open via hash for reliability (and to debug routing)
  useEffect(() => {
    const applyHash = () => {
      const h = typeof window !== 'undefined' ? window.location.hash : ''
      if (h === '#calendar') setIsCalendarOpen(true)
      if (h === '#auth') setIsAuthOpen(true)
      if (h === '#candidate-resources') setIsCandidateResourcesOpen(true)
      if (h === '#close') { setIsCalendarOpen(false); setIsAuthOpen(false); setIsCandidateResourcesOpen(false) }
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [])
  const ui = {
    bgGlass: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
    borderGlass: isDarkMode ? 'rgba(255,255,255,0.20)' : 'rgba(15,23,42,0.12)',
    controlBg: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.06)',
    controlBorder: isDarkMode ? 'rgba(255,255,255,0.20)' : 'rgba(15,23,42,0.12)',
    textPrimary: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? 'rgba(255,255,255,0.80)' : 'rgba(15,23,42,0.70)'
  }

  // Load user's API keys when component mounts
  useEffect(() => {
    if (user) {
      console.log('User changed, loading settings...')
      loadUserSettings()
    }
  }, [user])

  // Also load settings when component mounts for guests
  useEffect(() => {
    if (isGuest) {
      console.log('Guest mode detected, loading settings...')
      // Small delay to ensure localStorage is ready
      setTimeout(() => {
        loadUserSettings()
      }, 100)
    }
  }, [isGuest])

  // Load settings when component first mounts
  useEffect(() => {
    console.log('Component mounted, loading settings...', { isGuest, user: !!user })
    loadUserSettings()
    
    // Add global debug function for guests
    if (isGuest) {
      (window as any).debugGuestSettings = () => {
        console.log('=== GUEST SETTINGS DEBUG ===')
        console.log('isGuest:', isGuest)
        console.log('user:', user)
        console.log('userApiKey:', userApiKey ? userApiKey.substring(0, 10) + '...' : 'NOT SET')
        console.log('localStorage guest settings:', localStorage.getItem('voiceloophr-guest-settings'))
        loadUserSettings()
      }
      console.log('🔧 Guest debug function available: debugGuestSettings()')
    }
  }, [])

  const loadUserSettings = async () => {
    try {
      console.log('Loading user settings...', { isGuest, user: !!user })
      
      const treatAsGuest = isGuest || !user
      if (treatAsGuest) {
        // Prefer locally saved guest settings first
        const guestRaw = localStorage.getItem('voiceloophr-guest-settings')
        const guest = guestRaw ? JSON.parse(guestRaw) : null
        const localKey = guest?.openaiApiKey || guest?.openai_api_key
        if (localKey) {
          setUserApiKey(localKey)
          console.log('✅ Loaded OpenAI key from guest settings')
        } else {
          // Env fallback (exposed public for testing). If not available, leave unset.
          const envKey = (process as any)?.env?.NEXT_PUBLIC_OPENAI_API_KEY || (process as any)?.env?.OPENAI_API_KEY
          if (envKey) {
            setUserApiKey(envKey as string)
            console.log('✅ Loaded OpenAI key from env')
          } else {
            console.warn('⚠️ No OpenAI key found in guest settings or env; user must add a key in Settings.')
          }
        }
        
        // Initialize voice synthesizer for browser TTS
        const synthesizer = new VoiceSynthesizer()
        synthesizer.setVolume(volume)
        setVoiceSynthesizer(synthesizer)
        setAvailableVoices(synthesizer.getVoiceOptions())
        return
      }
      
      const userSettings = await getUserSettings()
      console.log('User settings loaded:', userSettings)
      
      if (userSettings?.openai_api_key) {
        console.log('Setting OpenAI API key:', userSettings.openai_api_key.substring(0, 10) + '...')
        setUserApiKey(userSettings.openai_api_key)
      } else {
        // Env fallback for signed-in users
        const envKey = (process as any)?.env?.NEXT_PUBLIC_OPENAI_API_KEY || (process as any)?.env?.OPENAI_API_KEY
        setUserApiKey(envKey || "")
      }
      
      if (userSettings?.elevenlabs_api_key) {
        setUserElevenLabsKey(userSettings.elevenlabs_api_key)
        // Initialize voice synthesizer with ElevenLabs key
        const synthesizer = new VoiceSynthesizer(userSettings.elevenlabs_api_key)
        synthesizer.setVolume(volume)
        setVoiceSynthesizer(synthesizer)
        
        // Load available voices
        try {
          await synthesizer.loadElevenLabsVoices()
          const voiceOptions = synthesizer.getVoiceOptions()
          setAvailableVoices(voiceOptions)
        } catch (error) {
          console.error('Failed to load ElevenLabs voices:', error)
          // Fallback to browser TTS
          setAvailableVoices([{ value: "browser", label: "Browser Default" }])
        }
      } else {
        // Use browser TTS only
        const synthesizer = new VoiceSynthesizer()
        synthesizer.setVolume(volume)
        setVoiceSynthesizer(synthesizer)
        setAvailableVoices(synthesizer.getVoiceOptions())
      }
    } catch (error) {
      console.error('Failed to load user settings:', error)
    }
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getEffectiveApiKey = (): string | undefined => {
    if (userApiKey) return userApiKey
    try {
      const guestRaw = localStorage.getItem('voiceloophr-guest-settings')
      if (guestRaw) {
        const g = JSON.parse(guestRaw)
        if (g?.openaiApiKey) return g.openaiApiKey
        if (g?.openai_api_key) return g.openai_api_key
      }
    } catch {}
    const envKey = (process as any)?.env?.NEXT_PUBLIC_OPENAI_API_KEY || (process as any)?.env?.OPENAI_API_KEY
    if (envKey) return envKey
    // No unsafe hardcoded fallback
    return undefined
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Persist visual settings
  useEffect(() => {
    try {
      const visual = { hue, hueAutoSpeed }
      localStorage.setItem('voiceloophr-visual', JSON.stringify(visual))
    } catch {}
  }, [hue, hueAutoSpeed])

  // Auto hue animation
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let acc = 0
    const tick = (t: number) => {
      const dt = (t - last) / 1000
      last = t
      // Throttle updates to ~20fps
      acc += dt
      if (hueAutoSpeed > 0 && acc >= 0.05) {
        setHue((h) => (h + hueAutoSpeed * acc) % 360)
        acc = 0
      }
      raf = requestAnimationFrame(tick)
    }
    if (hueAutoSpeed > 0) raf = requestAnimationFrame(tick)
    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [hueAutoSpeed])

  // Listen for visual updates from settings
  useEffect(() => {
    const handler = () => {
      try {
        const visual = localStorage.getItem('voiceloophr-visual')
        if (visual) {
          const v = JSON.parse(visual)
          if (typeof v.hue === 'number') setHue(v.hue)
        }
      } catch {}
    }
    window.addEventListener('voiceloophr-visual-updated' as any, handler as any)
    return () => window.removeEventListener('voiceloophr-visual-updated' as any, handler as any)
  }, [])

  // Handle file upload and processing
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Validate event and file input
    if (!event || !event.target || !event.target.files) {
      console.error('[handleFileUpload] Invalid event object:', event)
      return
    }

    const file = event.target.files[0]
    if (!file) {
      console.log('[handleFileUpload] No file selected')
      return
    }

    console.log('[handleFileUpload] File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    })

    // Additional file validation
    if (!file.name || file.size === 0) {
      console.error('[handleFileUpload] Invalid file object:', file)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Invalid file: File appears to be empty or corrupted',
        role: "assistant",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    // Comprehensive file type validation for resumes and modern formats
    const allowedExtensions = [
      // Document formats
      '.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.odt', '.pages',
      // Spreadsheet formats
      '.csv', '.xls', '.xlsx', '.ods',
      // Presentation formats
      '.ppt', '.pptx', '.odp',
      // Audio formats (for video resumes, interviews, etc.)
      '.wav', '.mp3', '.m4a', '.aac', '.ogg', '.flac',
      // Video formats (for video resumes, presentations, etc.)
      '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.3gp',
      // Image formats (for visual resumes, portfolios, etc.)
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp',
      // Archive formats (for portfolio packages)
      '.zip', '.rar', '.7z', '.tar', '.gz'
    ]
    
    const allowedMimeTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/rtf',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.apple.pages',
      // Spreadsheets
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet',
      // Presentations
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.presentation',
      // Audio
      'audio/wav', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/ogg', 'audio/flac',
      // Video
      'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-matroska', 'video/3gpp',
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/webp',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'
    ]
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    const hasValidExtension = allowedExtensions.includes(fileExtension)
    const hasValidMimeType = allowedMimeTypes.includes(file.type)
    
    if (!hasValidExtension && !hasValidMimeType) {
      console.error('[handleFileUpload] Invalid file type:', { extension: fileExtension, mimeType: file.type })
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `Invalid file type: ${fileExtension}. We support most modern file formats including documents, audio, video, images, and archives.`,
        role: "assistant",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    console.log('[handleFileUpload] File type validation passed:', { extension: fileExtension, mimeType: file.type })

    // Smart file routing based on type
    const isAudioFile = fileExtension.match(/\.(wav|mp3|m4a|aac|ogg|flac)$/i) || 
                       file.type.startsWith('audio/')
    
    const isVideoFile = fileExtension.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|3gp)$/i) || 
                       file.type.startsWith('video/')
    
    const isImageFile = fileExtension.match(/\.(jpg|jpeg|png|gif|bmp|tiff|svg|webp)$/i) || 
                       file.type.startsWith('image/')
    
    const isArchiveFile = fileExtension.match(/\.(zip|rar|7z|tar|gz)$/i) || 
                         file.type.startsWith('application/')

         // Route audio/video files to transcription API
     if (isAudioFile || isVideoFile) {
       console.log('[handleFileUpload] Audio/Video file detected, routing to transcription API')
       await handleAudioVideoFileUpload(file, !!isVideoFile)
       return
     }

    // Route image files to OCR/analysis
    if (isImageFile) {
      console.log('[handleFileUpload] Image file detected, routing to image analysis')
      await handleImageFileUpload(file)
      return
    }

    // Route archive files to extraction
    if (isArchiveFile) {
      console.log('[handleFileUpload] Archive file detected, routing to archive extraction')
      await handleArchiveFileUpload(file)
      return
    }

    // Route document files to text extraction
    console.log('[handleFileUpload] Document file detected, routing to text extraction')
    await handleDocumentFileUpload(file)
  }

  // Handle audio file upload (for transcription)
  const handleAudioFileUpload = async (file: File) => {
    try {
      setIsProcessingFile(true)
      
      // Add file message for audio files
      const fileMessage: Message = {
        id: Date.now().toString(),
        content: `🎵 Audio Upload: ${file.name}`,
        role: "user",
        timestamp: new Date(),
        type: "file",
        metadata: {
          fileName: file.name,
          fileSize: FileProcessor.formatFileSize(file.size)
        }
      }
      
      setMessages(prev => [...prev, fileMessage])
      
      const fd = new FormData()
      fd.append('file', file)
      
      // Add API key to the request
      const apiKey = getEffectiveApiKey()
      if (apiKey) {
        fd.append('apiKey', apiKey)
        console.log('[handleAudioFileUpload] Added API key to transcription request')
      } else {
        console.error('[handleAudioFileUpload] No API key available for transcription')
        throw new Error('OpenAI API key not configured. Please add your API key in settings.')
      }
      
      const res = await fetch('/api/ai/transcribe', { method: 'POST', body: fd })
      const tr = await res.json()
      if (!res.ok) throw new Error(tr.error || 'Transcription failed')
      const transcription = { text: tr.text, language: tr.language || 'en', confidence: 0.9 }
      
      // Add transcription message
      const transcriptionMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Transcription: ${transcription.text}\n\nLanguage: ${transcription.language}\nConfidence: ${Math.round(transcription.confidence * 100)} percent`,
        role: "assistant",
        timestamp: new Date(),
        type: "voice",
        metadata: { transcription }
      }
      
      setMessages(prev => [...prev, transcriptionMessage])
      
      // Process with AI for HR insights
      const key = getEffectiveApiKey()
      if (key) {
        const aiResponse = await AIProcessor.processHRQuery(transcription.text, key)
        
        const aiMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: aiResponse,
          role: "assistant",
          timestamp: new Date(),
          type: "text"
        }
        
        setMessages(prev => [...prev, aiMessage])
      }
      
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ Failed to transcribe audio: ${transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'}`,
        role: "assistant",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessingFile(false)
    }
  }

  // Handle audio/video file upload (for transcription)
  const handleAudioVideoFileUpload = async (file: File, isVideo: boolean) => {
    try {
      setIsProcessingFile(true)
      
      // Add file message for audio/video files
      const fileMessage: Message = {
        id: Date.now().toString(),
        content: `${isVideo ? 'Video' : 'Audio'} Upload: ${file.name}`,
        role: "user",
        timestamp: new Date(),
        type: "file",
        metadata: {
          fileName: file.name,
          fileSize: FileProcessor.formatFileSize(file.size)
        }
      }
      
      setMessages(prev => [...prev, fileMessage])
      
      const fd = new FormData()
      fd.append('file', file)
      
      // Add API key to the request
      const apiKey = getEffectiveApiKey()
      if (apiKey) {
        fd.append('apiKey', apiKey)
        console.log('[handleAudioVideoFileUpload] Added API key to transcription request')
      } else {
        console.error('[handleAudioVideoFileUpload] No API key available for transcription')
        throw new Error('OpenAI API key not configured. Please add your API key in settings.')
      }
      
      const res = await fetch('/api/ai/transcribe', { method: 'POST', body: fd })
      const tr = await res.json()
      if (!res.ok) throw new Error(tr.error || 'Transcription failed')
      const transcription = { text: tr.text, language: tr.language || 'en', confidence: 0.9 }
      
      // Add transcription message
      const transcriptionMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Transcription: ${transcription.text}\n\nLanguage: ${transcription.language}\nConfidence: ${Math.round(transcription.confidence * 100)} percent`,
        role: "assistant",
        timestamp: new Date(),
        type: "voice",
        metadata: { transcription }
      }
      
      setMessages(prev => [...prev, transcriptionMessage])
      
      // Process with AI for HR insights
      const key = getEffectiveApiKey()
      if (key) {
        const aiResponse = await AIProcessor.processHRQuery(transcription.text, key)
        
        const aiMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: aiResponse,
          role: "assistant",
          timestamp: new Date(),
          type: "text"
        }
        
        setMessages(prev => [...prev, aiMessage])
      }
      
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ Failed to transcribe audio: ${transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'}`,
        role: "assistant",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessingFile(false)
    }
  }

  // Handle image file upload (for OCR)
  const handleImageFileUpload = async (file: File) => {
    try {
      setIsProcessingFile(true)
      
      // Add file message for image files
      const fileMessage: Message = {
        id: Date.now().toString(),
        content: `📸 Image Upload: ${file.name}`,
        role: "user",
        timestamp: new Date(),
        type: "file",
        metadata: {
          fileName: file.name,
          fileSize: FileProcessor.formatFileSize(file.size)
        }
      }
      
      setMessages(prev => [...prev, fileMessage])
      
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/ai/ocr', { method: 'POST', body: fd })
      const ocr = await res.json()
      if (!res.ok) throw new Error(ocr.error || 'OCR failed')
      const extractedText = { text: ocr.text, metadata: ocr.metadata }
      
      // Add OCR message
      const ocrMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `OCR Result:\n\n${extractedText.text}\n\nConfidence: ${Math.round(extractedText.metadata?.confidence || 0)} percent`,
        role: "assistant",
        timestamp: new Date(),
        type: "analysis",
        metadata: { 
                     analysis: { summary: 'Document analysis from OCR', keyPoints: [], sentiment: 'neutral', confidence: 0.8 },
          file: file,
          extractedText: extractedText,
          requiresAction: true // Flag to show save/discard options
        }
      }
      
      setMessages(prev => [...prev, ocrMessage])

      // Don't auto-store - let user choose
      // The save/discard options will be handled by the UI

    } catch (ocrError) {
      console.error('OCR error:', ocrError)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ Failed to extract text from image: ${ocrError instanceof Error ? ocrError.message : 'Unknown error'}`,
        role: "assistant",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessingFile(false)
    }
  }

  // Handle archive file upload (for extraction)
  const handleArchiveFileUpload = async (file: File) => {
    try {
      setIsProcessingFile(true)
      
      // Add file message for archive files
      const fileMessage: Message = {
        id: Date.now().toString(),
        content: `📦 Archive Upload: ${file.name}`,
        role: "user",
        timestamp: new Date(),
        type: "file",
        metadata: {
          fileName: file.name,
          fileSize: FileProcessor.formatFileSize(file.size)
        }
      }
      
      setMessages(prev => [...prev, fileMessage])
      
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/documents/extract', { method: 'POST', body: fd })
      const ex = await res.json()
      if (!res.ok) throw new Error(ex.error || 'Archive extraction failed')
      const extractedText = ex.extracted
      
      // Add extraction message
      const extractionMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Archive Content:\n\n${extractedText.text}\n\nConfidence: ${Math.round(extractedText.metadata?.confidence || 0)} percent`,
        role: "assistant",
        timestamp: new Date(),
        type: "analysis",
        metadata: { 
                     analysis: { summary: 'Document analysis from archive', keyPoints: [], sentiment: 'neutral', confidence: 0.8 },
          file: file,
          extractedText: extractedText,
          requiresAction: true // Flag to show save/discard options
        }
      }
      
      setMessages(prev => [...prev, extractionMessage])

      // Don't auto-store - let user choose
      // The save/discard options will be handled by the UI

    } catch (archiveError) {
      console.error('Archive error:', archiveError)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ Failed to extract content from archive: ${archiveError instanceof Error ? archiveError.message : 'Unknown error'}`,
        role: "assistant",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessingFile(false)
    }
  }

  // Handle document file upload (for text extraction)
  const handleDocumentFileUpload = async (file: File) => {
    try {
      setIsProcessingFile(true)
      
      // Add file message for document files
      const fileMessage: Message = {
        id: Date.now().toString(),
        content: `📄 Document Upload: ${file.name}`,
        role: "user",
        timestamp: new Date(),
        type: "file",
        metadata: {
          fileName: file.name,
          fileSize: FileProcessor.formatFileSize(file.size)
        }
      }
      
      setMessages(prev => [...prev, fileMessage])
      
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/documents/extract', { method: 'POST', body: fd })
      const ex = await res.json()
      if (!res.ok) throw new Error(ex.error || 'Document extraction failed')
      const extractedText = ex.extracted
      
      // Add extraction message
      const extractionMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Document Content:\n\n${extractedText.text}\n\nConfidence: ${Math.round(extractedText.metadata?.confidence || 0)} percent`,
        role: "assistant",
        timestamp: new Date(),
        type: "analysis",
        metadata: { 
                     analysis: { summary: 'Document analysis', keyPoints: [], sentiment: 'neutral', confidence: 0.8 },
          file: file,
          extractedText: extractedText,
          requiresAction: true // Flag to show save/discard options
        }
      }
      
      setMessages(prev => [...prev, extractionMessage])

      // Don't auto-store - let user choose
      // The save/discard options will be handled by the UI

    } catch (documentError) {
      console.error('Document error:', documentError)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Failed to extract text from document: ${documentError instanceof Error ? documentError.message : 'Unknown error'}`,
        role: "assistant",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessingFile(false)
    }
  }

  // Store document in RAG database
  const saveToRAG = async (file: File, extractedText: any, analysis: DocumentAnalysis) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.name,
          content: extractedText.text,
          file_type: file.type,
          file_size: file.size,
          summary: analysis.summary,
          metadata: {
            keyPoints: analysis.keyPoints,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence,
            wordCount: extractedText.metadata.wordCount,
            storedInRAG: true,
            storedAt: new Date().toISOString()
          },
          user_id: isGuest ? 'guest' : (user?.id || 'anonymous')
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to store document in RAG')
      console.log('Document saved to RAG successfully:', json.document)
      return true
    } catch (error) {
      if (error instanceof Error) {
        console.error('RAG storage error:', error.message)
        throw error
      } else {
        try {
          console.error('RAG storage error:', JSON.stringify(error))
          throw new Error('Failed to store document in RAG')
        } catch {
          console.error('RAG storage error (raw):', error)
          throw new Error('Failed to store document in RAG')
        }
      }
    }
  }

  // Discard document (remove from analysis)
  const discardDocument = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }

  // Handle voice recording
  const handleVoiceToggle = async () => {
    const key = getEffectiveApiKey()
    if (!key) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: isGuest 
          ? 'Please configure your OpenAI API key in settings to use voice features. As a guest, your settings are saved locally.'
          : 'Please configure your OpenAI API key in settings first.',
        role: "assistant",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    if (isRecording) {
      await stopRecording()
    } else {
      await startRecording()
    }
  }

  const startRecording = async () => {
    try {
      voiceRecorderRef.current = new VoiceRecorder()
      await voiceRecorderRef.current.start()
      setIsRecording(true)
      setRecordingDuration(0)
      
      // Start duration timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 100)
      }, 100)
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = async () => {
    if (!voiceRecorderRef.current) return
    
    try {
      const audioBlob = await voiceRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
      
      // Add voice message
      const voiceMessage: Message = {
        id: Date.now().toString(),
        content: `🎤 Voice recording (${AudioUtils.formatDuration(recordingDuration)})`,
        role: "user",
        timestamp: new Date(),
        type: "voice"
      }
      
      setMessages(prev => [...prev, voiceMessage])
      setIsTyping(true)

      // Transcribe audio
      try {
        const fd = new FormData()
        fd.append('file', new File([audioBlob], 'audio.webm', { type: 'audio/webm' }))
        
        // Add API key to the request
        const apiKey = getEffectiveApiKey()
        if (apiKey) {
          fd.append('apiKey', apiKey)
          console.log('[stopRecording] Added API key to transcription request')
        } else {
          console.error('[stopRecording] No API key available for transcription')
          throw new Error('OpenAI API key not configured. Please add your API key in settings.')
        }
        
        const res = await fetch('/api/ai/transcribe', { method: 'POST', body: fd })
        const tr = await res.json()
        if (!res.ok) throw new Error(tr.error || 'Transcription failed')
        const transcription = { text: tr.text, language: tr.language || 'en', confidence: 0.9 }
        
        // Add transcription message
        const transcriptionMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `📝 **Transcription:** ${transcription.text}\n\n**Language:** ${transcription.language}\n**Confidence:** ${Math.round(transcription.confidence * 100)}%`,
          role: "assistant",
          timestamp: new Date(),
          type: "voice",
          metadata: { transcription }
        }
        
        setMessages(prev => [...prev, transcriptionMessage])
        
        // Process with AI for HR insights
        const key = getEffectiveApiKey()
        if (key) {
          const aiResponse = await AIProcessor.processHRQuery(transcription.text, key)
          
          const aiMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: aiResponse,
            role: "assistant",
            timestamp: new Date(),
            type: "text"
          }
          
          setMessages(prev => [...prev, aiMessage])
        }
        
      } catch (transcriptionError) {
        console.error('Transcription error:', transcriptionError)
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `❌ Failed to transcribe audio: ${transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'}`,
          role: "assistant",
          timestamp: new Date(),
          type: "text"
        }
        setMessages(prev => [...prev, errorMessage])
      }
      
      setIsTyping(false)
      setRecordingDuration(0)
      
    } catch (error) {
      console.error('Failed to stop recording:', error)
      setIsRecording(false)
    }
  }

  // Handle text input and AI processing
  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const key = getEffectiveApiKey()
    if (!key) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: isGuest 
          ? 'Please configure your OpenAI API key in settings to chat with the AI. As a guest, your settings are saved locally.'
          : 'Please configure your OpenAI API key in settings first.',
        role: "assistant",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
      type: "text"
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      // Process with AI
      const aiResponse = await AIProcessor.processHRQuery(input, key)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: "assistant",
        timestamp: new Date(),
        type: "text"
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI processing error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSpeakResponse = async (text: string) => {
    if (isSpeaking) {
      if (voiceSynthesizer) {
        if (voiceSynthesizer.isCurrentlyPaused()) {
          voiceSynthesizer.resume()
          setIsSpeaking(true)
        } else {
          voiceSynthesizer.pause()
          setIsSpeaking(false)
        }
      }
    } else {
      if (voiceSynthesizer) {
        setIsSpeaking(true)
        try {
          if (selectedVoice !== "browser") {
            voiceSynthesizer.setVoice(selectedVoice)
          }
          voiceSynthesizer.setVolume(volume)
          await voiceSynthesizer.speak(text)
        } catch (error) {
          const msg = error instanceof Error ? error.message : JSON.stringify(error || {})
          
          // Filter out normal "interrupted" errors that aren't actual failures
          if (msg === 'interrupted' || msg.includes('interrupted')) {
            console.log('Text-to-speech interrupted (normal behavior)')
            return
          }
          
          console.error('Error speaking text:', msg)
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            content: `Text to speech failed: ${msg}. Please ensure your browser allows audio and try again.`,
            role: 'assistant',
            timestamp: new Date(),
            type: 'text'
          }])
        } finally {
          setIsSpeaking(false)
        }
      }
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (voiceSynthesizer) {
      voiceSynthesizer.setVolume(newVolume)
    }
  }

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user"
    const pos = dragPositions[message.id] || { x: 0, y: 0 }
    const onMouseDown = (e: React.MouseEvent) => {
      dragStartRef.current = {
        id: message.id,
        startX: e.clientX,
        startY: e.clientY,
        baseX: pos.x,
        baseY: pos.y,
      }
      const onMove = (ev: MouseEvent) => {
        if (!dragStartRef.current) return
        const dx = ev.clientX - dragStartRef.current.startX
        const dy = ev.clientY - dragStartRef.current.startY
        const dist = Math.hypot(dx, dy)
        // Activate dragging only after small threshold so text selection works
        if (!draggingId && dist > 6) {
          setDraggingId(message.id)
          try { document.body.style.userSelect = 'none' } catch {}
        }
        if (draggingId === message.id) {
          const nx = dragStartRef.current.baseX + dx
          const ny = dragStartRef.current.baseY + dy
          setDragPositions((prev) => ({ ...prev, [message.id]: { x: nx, y: ny } }))
        }
      }
      const onUp = () => {
        setDraggingId((curr) => (curr === message.id ? null : curr))
        try { document.body.style.userSelect = '' } catch {}
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        dragStartRef.current = null
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }
    
    return (
      <div key={message.id} onMouseDown={onMouseDown} style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
        cursor: draggingId === message.id ? 'grabbing' : 'grab',
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        zIndex: draggingId === message.id ? 20 : 1
      }}>
        <div style={{
          maxWidth: '80%',
          borderRadius: '16px',
          padding: '12px 16px',
          backgroundColor: isUser ? 'white' : (isDarkMode ? 'rgba(0, 0, 0, 0.2)' : '#ffffff'),
          color: isUser ? 'black' : (isDarkMode ? 'white' : 'black'),
          boxShadow: isUser ? '0 4px 12px rgba(0, 0, 0, 0.15)' : (isDarkMode ? 'none' : '0 4px 12px rgba(0,0,0,0.08)'),
          border: isUser ? 'none' : (isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(15,23,42,0.12)'),
          backdropFilter: isUser ? 'none' : (isDarkMode ? 'blur(10px)' : 'none'),
          position: 'relative',
          userSelect: draggingId === message.id ? 'none' : 'text'
        }}>
          {/* Close bubble */}
          <button
            onClick={() => setMessages((prev) => prev.filter((m) => m.id !== message.id))}
            style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, background: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)', border: 'none', color: isDarkMode ? '#fff' : '#111', cursor: 'pointer' }}
            title="Close"
          >
            ×
          </button>
          {message.type === "file" && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{
                fontSize: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: isDarkMode ? '#93c5fd' : '#1f2937',
                padding: '4px 8px',
                borderRadius: '12px',
                display: 'inline-block'
              }}>📎 File Upload</span>
              <p style={{ fontSize: '14px', fontWeight: '500', marginTop: '4px', margin: '4px 0 0 0' }}>{message.metadata?.fileName}</p>
              <p style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#475569', margin: '0' }}>{message.metadata?.fileSize}</p>
              
                             {/* File type indicator */}
               {message.metadata?.fileName && (
                 <div style={{
                   marginTop: '4px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '4px'
                 }}>
                   {message.metadata.fileName.toLowerCase().endsWith('.pdf') && (
                     <span style={{ fontSize: '10px', color: '#dc2626' }}>📄 PDF</span>
                   )}
                   {message.metadata.fileName.toLowerCase().match(/\.(csv|xls|xlsx|ods)$/i) && (
                     <span style={{ fontSize: '10px', color: '#059669' }}>📊 Spreadsheet</span>
                   )}
                   {message.metadata.fileName.toLowerCase().match(/\.(ppt|pptx|odp)$/i) && (
                     <span style={{ fontSize: '10px', color: '#7c3aed' }}>📊 Presentation</span>
                   )}
                   {message.metadata.fileName.toLowerCase().match(/\.(wav|mp3|m4a|aac|ogg|flac)$/i) && (
                     <span style={{ fontSize: '10px', color: '#7c3aed' }}>🎵 Audio</span>
                   )}
                   {message.metadata.fileName.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|3gp)$/i) && (
                     <span style={{ fontSize: '10px', color: '#dc2626' }}>🎬 Video</span>
                   )}
                   {message.metadata.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|tiff|svg|webp)$/i) && (
                     <span style={{ fontSize: '10px', color: '#059669' }}>🖼️ Image</span>
                   )}
                   {message.metadata.fileName.toLowerCase().match(/\.(doc|docx|rtf|odt|pages)$/i) && (
                     <span style={{ fontSize: '10px', color: '#2563eb' }}>📝 Document</span>
                   )}
                   {message.metadata.fileName.toLowerCase().match(/\.(txt|md)$/i) && (
                     <span style={{ fontSize: '10px', color: '#6b7280' }}>📄 Text</span>
                   )}
                   {message.metadata.fileName.toLowerCase().match(/\.(zip|rar|7z|tar|gz)$/i) && (
                     <span style={{ fontSize: '10px', color: '#f59e0b' }}>📦 Archive</span>
                   )}
                 </div>
               )}
            </div>
          )}
          
          {message.type === "voice" && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{
                fontSize: '12px',
                backgroundColor: 'rgba(147, 51, 234, 0.2)',
                color: isDarkMode ? '#c4b5fd' : '#6b21a8',
                padding: '4px 8px',
                borderRadius: '12px',
                display: 'inline-block'
              }}>🎤 Voice Message</span>
            </div>
          )}
          
          {message.type === "analysis" && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{
                fontSize: '12px',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                color: isDarkMode ? '#86efac' : '#166534',
                padding: '4px 8px',
                borderRadius: '12px',
                display: 'inline-block'
              }}>📊 AI Analysis</span>
            </div>
          )}
          
          <div style={{
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            {message.content}
          </div>

          {/* Save/Discard Actions for Analysis Messages */}
          {message.type === "analysis" && message.metadata?.requiresAction && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}>
              <p style={{
                fontSize: '12px',
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                margin: '0 0 12px 0',
                fontWeight: '500'
              }}>
                🤔 What would you like to do with this document?
              </p>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={async () => {
                    try {
                      if (message.metadata?.file && message.metadata?.extractedText && message.metadata?.analysis) {
                        await saveToRAG(message.metadata.file, message.metadata.extractedText, message.metadata.analysis)
                        // Update message to show it's saved
                        setMessages(prev => prev.map(msg => 
                          msg.id === message.id 
                            ? { ...msg, metadata: { ...msg.metadata, requiresAction: false, savedToRAG: true } }
                            : msg
                        ))
                      }
                    } catch (error) {
                      console.error('Failed to save to RAG:', error)
                      // Show error message
                      setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        content: `❌ Failed to save document to RAG: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        role: "assistant",
                        timestamp: new Date(),
                        type: "text"
                      }])
                    }
                  }}
                  style={{
                    padding: '12px',
                    backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: isDarkMode ? '#22c55e' : '#166534',
                    border: `1px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    transition: 'all 0.2s ease'
                  }}
                  title="Save document to RAG for future search and AI queries"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.2)'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17,21 17,13 7,13 7,21"/>
                    <polyline points="7,3 7,8 15,8"/>
                  </svg>
                </button>
                <button
                  onClick={() => discardDocument(message.id)}
                  style={{
                    padding: '12px',
                    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: isDarkMode ? '#ef4444' : '#dc2626',
                    border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    transition: 'all 0.2s ease'
                  }}
                  title="Discard document analysis"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Show saved status */}
          {message.type === "analysis" && message.metadata?.savedToRAG && (
            <div style={{
              marginTop: '12px',
              padding: '6px 10px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: '#166534',
              borderRadius: '6px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Saved to RAG
            </div>
          )}
        </div>
        
                 {message.role === "assistant" && (
           <button
             onClick={() => handleSpeakResponse(message.content)}
             style={{
               marginLeft: '8px',
               borderRadius: '50%',
               padding: '8px',
               backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)',
               border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.2)'}`,
               color: isDarkMode ? 'white' : '#0f172a',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               width: '36px',
               height: '36px'
             }}
             title={isSpeaking ? (voiceSynthesizer?.isCurrentlyPaused() ? "Resume" : "Pause") : "Play"}
           >
            {isSpeaking ? (
              voiceSynthesizer?.isCurrentlyPaused() ? (
                <Volume2 size={16} />
              ) : (
                <Mic size={16} />
              )
            ) : (
              <Volume2 size={16} />
            )}
          </button>
        )}
      </div>
    )
  }

  // Debug auth modal state
  console.log('🔐 Auth modal state before render:', { isAuthOpen, user, isDarkMode })

  // Function to get current AI instructions for display
  const getCurrentAIInstructions = () => {
    try {
      if (typeof window !== 'undefined') {
        const general = localStorage.getItem('voiceloophr-ai-instructions-general')
        const user = localStorage.getItem('voiceloophr-ai-instructions-user')
        
        if (general && general !== 'You are an intelligent Human Resources assistant. Help users with document analysis, resume review, interview preparation, and Human Resources related questions. Be professional, helpful, and concise.') {
          return `\n\nAI personality: ${general.split('\n')[0].replace('You are ', '').replace('.', '')}`
        }
        if (user && user.trim()) {
          return `\n\nYour preferences: ${user}`
        }
      }
    } catch (e) {
      console.log('Could not load AI instructions for display')
    }
    return ''
  }
  
  // Update welcome message when AI instructions change
  useEffect(() => {
    const updateWelcomeMessage = () => {
      const instructions = getCurrentAIInstructions()
      if (instructions) {
        setMessages(prev => {
          if (prev.length > 0 && prev[0].id === "1") {
            return [{
              ...prev[0],
              content: prev[0].content + instructions
            }, ...prev.slice(1)]
          }
          return prev
        })
      }
    }
    
    // Listen for changes to AI instructions
    const handleStorageChange = () => {
      updateWelcomeMessage()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check on mount
    updateWelcomeMessage()
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: isDarkMode ? '#000' : '#fff'
    }}>
      {/* Wave Animation Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <WaveAnimation 
          particleColor={particleColor}
          waveSpeed={3}
          waveIntensity={50}
          pointSize={2}
          gridDistance={2}
        />
      </div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {/* Simple Navbar */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: `1px solid ${ui.borderGlass}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <img
              src={isDarkMode ? "https://automationalien.s3.us-east-1.amazonaws.com/VoiceLoopLogoBlack.png" : "https://automationalien.s3.us-east-1.amazonaws.com/teamloop_logo_2.png"}
              alt="TeamLoop Logo"
              style={{ height: '72px', width: 'auto' }}
            />
            {isGuest && (
              <span style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#fde047',
                borderRadius: '20px',
                fontSize: '14px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                🎭 Guest Mode
              </span>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Calendar (navigate) */}
            <button
              onClick={handleOpenCalendar}
              aria-label="Calendar"
              title="Calendar"
              style={{
                borderRadius: '50%',
                padding: '8px',
                backgroundColor: ui.controlBg,
                border: `1px solid ${ui.controlBorder}`,
                color: ui.textPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                cursor: 'pointer'
              }}
            >
              <CalendarIcon size={16} />
            </button>
            {/* tiny live state indicator */}
            {isCalendarOpen && <span style={{ width: 6, height: 6, borderRadius: 3, background: '#22d3ee' }} />}
            
            {/* Candidate Resources (navigate) */}
            <button
              onClick={handleOpenCandidateResources}
              aria-label="Candidate Resources"
              title="Candidate Resources"
              style={{
                borderRadius: '50%',
                padding: '8px',
                backgroundColor: ui.controlBg,
                border: `1px solid ${ui.controlBorder}`,
                color: ui.textPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                cursor: 'pointer'
              }}
            >
              <Users size={16} />
            </button>
            {/* tiny live state indicator */}
            {isCandidateResourcesOpen && <span style={{ width: 6, height: 6, borderRadius: 3, background: '#22d3ee' }} />}
            
            {/* Volume Control */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: ui.controlBg,
              padding: '8px 12px',
              borderRadius: '20px',
              border: `1px solid ${ui.controlBorder}`,
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ color: ui.textPrimary, fontSize: '14px' }}>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                style={{
                  width: '64px',
                  height: '4px',
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.25)',
                  borderRadius: '4px',
                  outline: 'none'
                }}
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
            </div>
            {/* Color controls moved to Settings */}
            {/* Audio controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: ui.controlBg, padding: '6px 8px', borderRadius: 20, border: `1px solid ${ui.controlBorder}` }}>
              <button onClick={() => voiceSynthesizer?.rewindSeconds(10)} style={{ background: 'transparent', border: 'none', color: ui.textPrimary, cursor: 'pointer' }} title="Rewind 10s">⏪</button>
              <button onClick={() => voiceSynthesizer?.togglePause()} style={{ background: 'transparent', border: 'none', color: ui.textPrimary, cursor: 'pointer' }} title="Play/Pause">{isSpeaking ? '⏸' : '▶️'}</button>
              <button onClick={() => voiceSynthesizer?.fastForwardSeconds(10)} style={{ background: 'transparent', border: 'none', color: ui.textPrimary, cursor: 'pointer' }} title="Forward 10s">⏩</button>
              <button onClick={() => { const r = (voiceSynthesizer?.getRate() || 0.95) > 0.9 ? 0.75 : 1.0; voiceSynthesizer?.setRate(r); }} style={{ background: 'transparent', border: 'none', color: ui.textPrimary, cursor: 'pointer' }} title="Toggle Slow/Normal">🐢/🐇</button>
            </div>
            
            <button
              onClick={() => setIsSettingsOpen(true)}
              style={{
                borderRadius: '50%',
                padding: '8px',
                backgroundColor: ui.controlBg,
                border: `1px solid ${ui.controlBorder}`,
                color: ui.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px'
              }}
              title="Settings"
            >
              <Settings size={16} />
            </button>
            
            <button
              onClick={onToggleTheme}
              style={{
                borderRadius: '50%',
                padding: '8px',
                backgroundColor: ui.controlBg,
                border: `1px solid ${ui.controlBorder}`,
                color: ui.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px'
              }}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            
            {user && (
              <button
                onClick={signOut}
                style={{
                  borderRadius: '50%',
                  padding: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px'
                }}
                title={isGuest ? "Exit Guest Mode" : "Sign Out"}
              >
                <LogOut size={16} />
              </button>
            )}

            {/* Sign in (navigate, only when signed out) */}
            {!user && (
              <button
                onClick={handleOpenAuth}
                aria-label="Sign in"
                title="Sign in"
                style={{
                  borderRadius: '50%',
                  padding: '8px',
                  backgroundColor: ui.controlBg,
                  border: `1px solid ${ui.controlBorder}`,
                  color: ui.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer'
                }}
              >
                <LogIn size={16} />
              </button>
            )}
            {(!user && isAuthOpen) && <span style={{ width: 6, height: 6, borderRadius: 3, background: '#22d3ee' }} />}
          </div>
        </nav>

        {/* Centered Chat Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '896px'
          }}>
            {/* Messages */}
            <div className="no-scrollbar" style={{
              marginBottom: '12px',
              height: messagesHeightPx + 'px',
              overflowY: 'auto',
              color: ui.textPrimary
            }}>
              {messages.map(renderMessage)}
              
              {isTyping && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        animation: 'bounce 1.4s infinite ease-in-out'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        animation: 'bounce 1.4s infinite ease-in-out',
                        animationDelay: '0.1s'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        animation: 'bounce 1.4s infinite ease-in-out',
                        animationDelay: '0.2s'
                      }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
 
            {/* Input Area (draggable) */}
            <div
              ref={composerRef}
              onMouseDown={(e) => {
                // Alt+Drag anywhere on composer background to move
                if (!e.altKey) return
                const rect = composerRef.current?.getBoundingClientRect()
                if (!rect) return
                setComposerDocked(false)
                setIsComposerDragging(true)
                composerDragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
                setComposerPos({ x: e.clientX, y: e.clientY })
                const onMove = (ev: MouseEvent) => setComposerPos({ x: ev.clientX, y: ev.clientY })
                const onUp = () => {
                  setIsComposerDragging(false)
                  window.removeEventListener('mousemove', onMove)
                  window.removeEventListener('mouseup', onUp)
                }
                window.addEventListener('mousemove', onMove)
                window.addEventListener('mouseup', onUp)
              }}
              style={{
                backgroundColor: ui.bgGlass,
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '16px',
                position: composerDocked ? 'relative' : 'fixed',
                left: composerDocked ? undefined : composerPos.x - composerDragOffset.current.x,
                top: composerDocked ? undefined : composerPos.y - composerDragOffset.current.y,
                width: composerDocked ? 'auto' : 'min(896px, calc(100vw - 32px))',
                zIndex: composerDocked ? 100 : 200,
                boxShadow: composerDocked ? 'none' : '0 8px 24px rgba(0,0,0,0.35)'
              }}
            >
              {/* Double-click anywhere on background to dock */}
              <div onDoubleClick={() => setComposerDocked(true)} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    console.log('[FileUpload] File input onChange triggered:', e)
                    console.log('[FileUpload] Event target:', e.target)
                    console.log('[FileUpload] Files:', e.target?.files)
                    
                    // Prevent multiple processing
                    if (isProcessingFile) {
                      console.log('[FileUpload] Already processing file, ignoring change event')
                      return
                    }
                    
                    if (e.target?.files && e.target.files.length > 0) {
                      console.log('[FileUpload] Processing file selection')
                      handleFileUpload(e)
                    } else {
                      console.log('[FileUpload] No files selected in onChange')
                    }
                  }}
                  style={{ display: 'none' }}
                                     accept=".pdf,.doc,.docx,.txt,.md,.rtf,.odt,.pages,.csv,.xls,.xlsx,.ods,.ppt,.pptx,.odp,.wav,.mp3,.m4a,.aac,.ogg,.flac,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.3gp,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.svg,.webp,.zip,.rar,.7z,.tar,.gz"
                  disabled={isProcessingFile}
                />
                
                <button
                  onClick={() => {
                    console.log('[FileUpload] File input button clicked')
                    console.log('[FileUpload] fileInputRef.current:', fileInputRef.current)
                    if (fileInputRef.current) {
                      // Additional validation
                      if (fileInputRef.current.files && fileInputRef.current.files.length > 0) {
                        console.log('[FileUpload] File input already has files, clearing...')
                        fileInputRef.current.value = ''
                      }
                      fileInputRef.current.click()
                      console.log('[FileUpload] File input click triggered')
                    } else {
                      console.error('[FileUpload] File input reference is null')
                    }
                  }}
                  style={{
                    borderRadius: '50%',
                    padding: '8px',
                    backgroundColor: ui.controlBg,
                    border: `1px solid ${ui.controlBorder}`,
                    color: ui.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px'
                  }}
                  disabled={isProcessingFile}
                  title="Upload File"
                >
                  <Paperclip size={16} />
                </button>

                <button
                  onClick={handleVoiceToggle}
                  style={{
                    borderRadius: '50%',
                    padding: '8px',
                    border: '1px solid',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.3)' : ui.controlBg,
                    color: isRecording ? '#b91c1c' : ui.textPrimary,
                    borderColor: isRecording ? 'rgba(239, 68, 68, 0.5)' : ui.controlBorder
                  }}
                  disabled={isProcessingFile}
                  title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  <Mic size={16} />
                </button>

                {isRecording && (
                  <div style={{
                    fontSize: '14px',
                    color: '#fca5a5',
                    fontWeight: '500'
                  }}>
                    {AudioUtils.formatDuration(recordingDuration)}
                  </div>
                )}

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about Human Resources, upload documents, or use voice commands..."
                  style={{
                    flex: 1,
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.9)',
                    border: `1px solid ${ui.controlBorder}`,
                    color: ui.textPrimary,
                    borderRadius: '20px',
                    padding: '12px 16px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  disabled={isTyping || isProcessingFile}
                />
                
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping || isProcessingFile}
                  style={{
                    borderRadius: '20px',
                    padding: '12px 24px',
                    backgroundColor: isDarkMode ? 'white' : '#0f172a',
                    color: isDarkMode ? 'black' : 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
              
              {isProcessingFile && (
                <div style={{
                  marginTop: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{ fontWeight: '500' }}>Processing document...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel (portalized within component handles its own overlay) */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        onSettingsSaved={loadUserSettings}
      />

      {/* Calendar Window */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Auth/Login Window */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Candidate Resources Window */}
      <CandidateResourcesModal
        isOpen={isCandidateResourcesOpen}
        onClose={() => setIsCandidateResourcesOpen(false)}
        isDarkMode={isDarkMode}
      />

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}