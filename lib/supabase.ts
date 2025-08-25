import { createClient } from '@supabase/supabase-js'
import { config } from './config'

const supabaseUrl = config.supabase.url
const supabaseAnonKey = config.supabase.anonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  metadata?: Record<string, any>
}
