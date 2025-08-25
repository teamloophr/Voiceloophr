import { createClient } from '@supabase/supabase-js'
import { config } from './config'

const supabaseUrl = config.supabase.url
const supabaseAnonKey = config.supabase.anonKey

// Only create client if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database types for our HR documents
export interface HRDocument {
  id: string
  title: string
  content: string
  file_type: string
  file_size: number
  uploaded_at: string
  user_id: string
  summary?: string
  embeddings?: number[]
  metadata?: Record<string, any>
}

export interface SearchResult {
  id: string
  title: string
  content: string
  similarity: number
  relevanceScore: number
  description?: string
  highlights?: string[]
  metadata?: {
    fileType?: string
    uploadedAt?: string
    fileSize?: number
    sentiment?: 'positive' | 'negative' | 'neutral'
    confidence?: number
    skills?: string[]
    experienceLevel?: string
    location?: string
    department?: string
    [key: string]: any
  }
}
