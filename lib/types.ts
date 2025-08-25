// TypeScript types for VoiceLoop data models

export interface User {
  id: string
  email: string
  full_name?: string
  openai_api_key?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  filename: string
  file_path: string
  file_size?: number
  mime_type?: string
  ai_summary?: string
  ai_keywords?: string[]
  upload_date: string
  processed_at?: string
  status: "pending" | "processing" | "completed" | "error"
}

export interface VoiceQuery {
  id: string
  user_id: string
  query_text: string
  response_text?: string
  audio_file_path?: string
  created_at: string
  processing_time_ms?: number
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  attendee_emails?: string[]
  created_via_voice: boolean
  created_at: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}
