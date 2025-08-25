import { supabase } from './supabase'
import { AIProcessor } from './ai-processing'
import type { SearchResult } from './supabase'

export interface SearchQuery {
  query: string
  filters?: {
    fileType?: string[]
    dateRange?: {
      start?: Date
      end?: Date
    }
    sentiment?: 'positive' | 'negative' | 'neutral'
    minConfidence?: number
    skills?: string[]
    experienceLevel?: string[]
    location?: string
    department?: string
  }
  limit?: number
  similarityThreshold?: number
}

export interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  queryTime: number
  suggestions?: string[]
  facets?: {
    fileTypes: { [key: string]: number }
    skills: { [key: string]: number }
    experienceLevels: { [key: string]: number }
    locations: { [key: string]: number }
    departments: { [key: string]: number }
  }
}

export interface SearchFilters {
  fileType?: string[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  sentiment?: 'positive' | 'negative' | 'neutral'
  minConfidence?: number
  skills?: string[]
  experienceLevel?: string[]
  location?: string
  department?: string
}

export interface SavedSearch {
  id: string
  name: string
  query: string
  filters: SearchFilters
  resultCount: number
  createdAt: string
}

// Main search engine function
export async function searchEngine(query: SearchQuery): Promise<SearchResponse> {
  const startTime = Date.now()
  
  try {
    // Multi-source search: documents, candidates, and events
    const [documentResults, candidateResults, eventResults] = await Promise.all([
      searchDocuments(query),
      searchCandidates(query),
      searchEvents(query)
    ])
    
    // Combine and rank results
    const allResults = [...documentResults, ...candidateResults, ...eventResults]
    
    // Apply filters
    let filteredResults = allResults
    if (query.filters) {
      filteredResults = applyFilters(allResults, query.filters)
    }
    
    // Sort by relevance
    filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore)
    
    // Limit results
    const limitedResults = filteredResults.slice(0, query.limit || 20)
    
    // Generate facets for filtering
    const facets = generateFacets(allResults)
    
    // Generate search suggestions
    const suggestions = await generateSearchSuggestions(query.query, limitedResults)
    
    return {
      results: limitedResults,
      totalCount: filteredResults.length,
      queryTime: Date.now() - startTime,
      suggestions,
      facets
    }
    
  } catch (error) {
    console.error('Search engine error:', error)
    throw new Error('Search failed. Please try again.')
  }
}

// Search documents using vector similarity
async function searchDocuments(query: SearchQuery): Promise<SearchResult[]> {
  try {
    // Generate embeddings for the search query
    const queryEmbedding = await AIProcessor.generateEmbeddings(query.query)
    
    // Perform vector similarity search
    const { data: searchResults, error } = await supabase.rpc('search_documents', {
      query_embedding: queryEmbedding,
      similarity_threshold: query.similarityThreshold || 0.7,
      match_count: query.limit || 10
    })
    
    if (error) {
      console.error('Document search error:', error)
      return []
    }
    
    // Transform to SearchResult format
    return (searchResults || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      similarity: doc.similarity || 0,
      relevanceScore: Math.round((doc.similarity || 0) * 100),
      description: doc.summary,
      highlights: generateHighlights(doc.content, query.query),
      metadata: {
        fileType: doc.file_type,
        uploadedAt: doc.uploaded_at,
        fileSize: doc.file_size,
        sentiment: doc.sentiment,
        confidence: doc.confidence
      }
    }))
    
  } catch (error) {
    console.error('Document search error:', error)
    return []
  }
}

// Search candidates (mock implementation for now)
async function searchCandidates(query: SearchQuery): Promise<SearchResult[]> {
  // TODO: Implement candidate search from database
  const mockCandidates = [
    {
      id: 'candidate-1',
      title: 'Senior React Developer',
      content: 'Experienced React developer with 5+ years building scalable web applications',
      similarity: 0.85,
      relevanceScore: 85,
      description: 'Full-stack developer specializing in React and Node.js',
      highlights: ['React', 'Node.js', 'scalable'],
      metadata: {
        skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
        experienceLevel: 'senior',
        location: 'San Francisco, CA',
        department: 'Engineering'
      }
    },
    {
      id: 'candidate-2',
      title: 'UX Designer',
      content: 'Creative UX designer with expertise in user research and design systems',
      similarity: 0.78,
      relevanceScore: 78,
      description: 'User experience designer focused on research-driven design',
      highlights: ['UX', 'user research', 'design systems'],
      metadata: {
        skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping'],
        experienceLevel: 'mid',
        location: 'New York, NY',
        department: 'Design'
      }
    }
  ]
  
  return mockCandidates.filter(candidate => 
    candidate.title.toLowerCase().includes(query.query.toLowerCase()) ||
    candidate.content.toLowerCase().includes(query.query.toLowerCase())
  )
}

// Search events (mock implementation for now)
async function searchEvents(query: SearchQuery): Promise<SearchResult[]> {
  // TODO: Implement event search from database
  const mockEvents = [
    {
      id: 'event-1',
      title: 'Team Building Workshop',
      content: 'Monthly team building workshop to improve collaboration and communication',
      similarity: 0.72,
      relevanceScore: 72,
      description: 'Team collaboration workshop',
      highlights: ['team building', 'collaboration', 'communication'],
      metadata: {
        date: '2024-09-15',
        location: 'Conference Room A',
        department: 'HR'
      }
    }
  ]
  
  return mockEvents.filter(event => 
    event.title.toLowerCase().includes(query.query.toLowerCase()) ||
    event.content.toLowerCase().includes(query.query.toLowerCase())
  )
}

// Apply filters to search results
function applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
  return results.filter(result => {
    // File type filter
    if (filters.fileType && filters.fileType.length > 0) {
      const fileType = result.metadata?.fileType || 'unknown'
      if (!filters.fileType.includes(fileType)) return false
    }
    
    // Date range filter
    if (filters.dateRange) {
      const uploadDate = new Date(result.metadata?.uploadedAt || '')
      if (filters.dateRange.start && uploadDate < filters.dateRange.start) return false
      if (filters.dateRange.end && uploadDate > filters.dateRange.end) return false
    }
    
    // Sentiment filter
    if (filters.sentiment) {
      const sentiment = result.metadata?.sentiment || 'neutral'
      if (sentiment !== filters.sentiment) return false
    }
    
    // Confidence filter
    if (filters.minConfidence) {
      const confidence = result.metadata?.confidence || 0
      if (confidence < filters.minConfidence) return false
    }
    
    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      const resultSkills = result.metadata?.skills || []
      if (!filters.skills.some(skill => resultSkills.includes(skill))) return false
    }
    
    // Experience level filter
    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      const resultLevel = result.metadata?.experienceLevel || ''
      if (!filters.experienceLevel.includes(resultLevel)) return false
    }
    
    // Location filter
    if (filters.location) {
      const resultLocation = result.metadata?.location || ''
      if (!resultLocation.toLowerCase().includes(filters.location.toLowerCase())) return false
    }
    
    // Department filter
    if (filters.department) {
      const resultDepartment = result.metadata?.department || ''
      if (!resultDepartment.toLowerCase().includes(filters.department.toLowerCase())) return false
    }
    
    return true
  })
}

// Generate search result highlights
function generateHighlights(content: string, query: string): string[] {
  const highlights: string[] = []
  const queryWords = query.toLowerCase().split(' ')
  
  queryWords.forEach(word => {
    if (word.length > 2) {
      const regex = new RegExp(`\\b${word}\\w*`, 'gi')
      const matches = content.match(regex)
      if (matches) {
        highlights.push(...matches.slice(0, 3))
      }
    }
  })
  
  return [...new Set(highlights)].slice(0, 5)
}

// Generate search suggestions
async function generateSearchSuggestions(query: string, results: SearchResult[]): Promise<string[]> {
  const suggestions: string[] = []
  
  // Add query-based suggestions
  suggestions.push(`${query} skills`, `${query} experience`, `${query} requirements`)
  
  // Add result-based suggestions
  results.forEach(result => {
    if (result.metadata?.skills) {
      result.metadata.skills.forEach(skill => {
        suggestions.push(`${query} ${skill}`)
      })
    }
    if (result.metadata?.experienceLevel) {
      suggestions.push(`${query} ${result.metadata.experienceLevel}`)
    }
  })
  
  return [...new Set(suggestions)].slice(0, 8)
}

// Generate facets for filtering
function generateFacets(results: SearchResult[]) {
  const facets = {
    fileTypes: {} as { [key: string]: number },
    skills: {} as { [key: string]: number },
    experienceLevels: {} as { [key: string]: number },
    locations: {} as { [key: string]: number },
    departments: {} as { [key: string]: number }
  }
  
  results.forEach(result => {
    // File types
    if (result.metadata?.fileType) {
      facets.fileTypes[result.metadata.fileType] = (facets.fileTypes[result.metadata.fileType] || 0) + 1
    }
    
    // Skills
    if (result.metadata?.skills) {
      result.metadata.skills.forEach(skill => {
        facets.skills[skill] = (facets.skills[skill] || 0) + 1
      })
    }
    
    // Experience levels
    if (result.metadata?.experienceLevel) {
      facets.experienceLevels[result.metadata.experienceLevel] = (facets.experienceLevels[result.metadata.experienceLevel] || 0) + 1
    }
    
    // Locations
    if (result.metadata?.location) {
      facets.locations[result.metadata.location] = (facets.locations[result.metadata.location] || 0) + 1
    }
    
    // Departments
    if (result.metadata?.department) {
      facets.departments[result.metadata.department] = (facets.departments[result.metadata.department] || 0) + 1
    }
  })
  
  return facets
}

// Search engine API with additional methods
export const searchEngineAPI = {
  search: searchEngine,
  
  async getSearchSuggestions(query: string): Promise<string[]> {
    return generateSearchSuggestions(query, [])
  },
  
  getSavedSearches(): SavedSearch[] {
    // TODO: Implement persistent saved searches
    return []
  },
  
  saveSearch(name: string, query: string, filters: SearchFilters, resultCount: number): SavedSearch {
    const savedSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      query,
      filters,
      resultCount,
      createdAt: new Date().toISOString()
    }
    
    // TODO: Persist to database
    return savedSearch
  },
  
  deleteSavedSearch(id: string): boolean {
    // TODO: Implement delete from database
    return true
  }
}
