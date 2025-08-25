import { supabase } from './supabase'
import { AIProcessor } from './ai-processing'
import type { SearchResult } from './supabase'

export interface SearchQuery {
  query: string
  filters?: {
    fileType?: string[]
    dateRange?: {
      start: Date
      end: Date
    }
    sentiment?: 'positive' | 'negative' | 'neutral'
    minConfidence?: number
  }
  limit?: number
  similarityThreshold?: number
}

export interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  queryTime: number
  suggestions?: string[]
}

// Legacy-shim types for UI imports
export type SearchFilters = SearchQuery['filters']
export type SavedSearch = never

// Provide a function-style API for legacy imports
export async function searchEngine(query: SearchQuery): Promise<SearchResponse> {
  return DocumentSearch.semanticSearch(query)
}

export class DocumentSearch {
  // Perform semantic search using RAG
  static async semanticSearch(query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now()
    
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
        console.error('Search error:', error)
        throw new Error('Failed to perform search')
      }
      
      // Apply additional filters if specified
      let filteredResults = searchResults || []
      
      if (query.filters) {
        filteredResults = this.applyFilters(filteredResults, query.filters)
      }
      
      // Generate search suggestions
      const suggestions = await this.generateSearchSuggestions(query.query, filteredResults)
      
      return {
        results: filteredResults,
        totalCount: filteredResults.length,
        queryTime: Date.now() - startTime,
        suggestions
      }
      
    } catch (error) {
      console.error('Semantic search error:', error)
      throw new Error('Search failed. Please try again.')
    }
  }

  // Apply filters to search results
  private static applyFilters(results: SearchResult[], filters: SearchQuery['filters']): SearchResult[] {
    if (!filters) return results
    
    return results.filter(result => {
      // File type filter
      if (filters.fileType && filters.fileType.length > 0) {
        const fileType = result.metadata?.fileType || 'unknown'
        if (!filters.fileType.includes(fileType)) return false
      }
      
      // Date range filter
      if (filters.dateRange) {
        const uploadDate = new Date(result.metadata?.uploadedAt || '')
        if (uploadDate < filters.dateRange.start || uploadDate > filters.dateRange.end) {
          return false
        }
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
      
      return true
    })
  }

  // Generate search suggestions based on query and results
  private static async generateSearchSuggestions(query: string, results: SearchResult[]): Promise<string[]> {
    try {
      const suggestions: string[] = []
      
      // Extract common themes from results
      const themes = this.extractThemes(results)
      
      // Generate AI-powered suggestions
      const aiSuggestions = await this.generateAISuggestions(query, themes)
      
      suggestions.push(...aiSuggestions)
      
      // Add result-based suggestions
      if (results.length > 0) {
        const topResult = results[0]
        if (topResult.metadata?.keyPoints) {
          suggestions.push(`Learn more about: ${topResult.metadata.keyPoints[0]}`)
        }
      }
      
      return suggestions.slice(0, 5) // Limit to 5 suggestions
      
    } catch (error) {
      console.error('Error generating suggestions:', error)
      return []
    }
  }

  // Extract common themes from search results
  private static extractThemes(results: SearchResult[]): string[] {
    const themes: string[] = []
    
    results.forEach(result => {
      if (result.metadata?.keyPoints) {
        themes.push(...result.metadata.keyPoints)
      }
    })
    
    // Count occurrences and return top themes
    const themeCounts = themes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(themeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme)
  }

  // Generate AI-powered search suggestions
  private static async generateAISuggestions(query: string, themes: string[]): Promise<string[]> {
    try {
      const prompt = `Based on the search query "${query}" and the identified themes ${themes.join(', ')}, suggest 3 related search queries that would be helpful for HR professionals. Return only the suggestions, one per line.`
      
      const response = await AIProcessor.processHRQuery(prompt)
      return response.split('\n').filter(line => line.trim().length > 0).slice(0, 3)
      
    } catch (error) {
      console.error('Error generating AI suggestions:', error)
      return []
    }
  }

  // Search by specific criteria (non-semantic)
  static async searchByCriteria(criteria: {
    keywords?: string[]
    fileType?: string
    dateFrom?: Date
    dateTo?: Date
    limit?: number
  }): Promise<SearchResponse> {
    const startTime = Date.now()
    
    try {
      let query = supabase
        .from('hr_documents')
        .select('*')
        .order('uploaded_at', { ascending: false })
      
      // Apply filters
      if (criteria.fileType) {
        query = query.eq('file_type', criteria.fileType)
      }
      
      if (criteria.dateFrom) {
        query = query.gte('uploaded_at', criteria.dateFrom.toISOString())
      }
      
      if (criteria.dateTo) {
        query = query.lte('uploaded_at', criteria.dateTo.toISOString())
      }
      
      if (criteria.limit) {
        query = query.limit(criteria.limit)
      }
      
      const { data: results, error } = await query
      
      if (error) {
        console.error('Criteria search error:', error)
        throw new Error('Search failed')
      }
      
      // Filter by keywords if specified
      let filteredResults = results || []
      
      if (criteria.keywords && criteria.keywords.length > 0) {
        filteredResults = this.filterByKeywords(filteredResults, criteria.keywords)
      }
      
      return {
        results: filteredResults,
        totalCount: filteredResults.length,
        queryTime: Date.now() - startTime
      }
      
    } catch (error) {
      console.error('Criteria search error:', error)
      throw new Error('Search failed. Please try again.')
    }
  }

  // Filter results by keywords
  private static filterByKeywords(results: any[], keywords: string[]): any[] {
    return results.filter(result => {
      const searchableText = `${result.title} ${result.content} ${result.summary || ''}`.toLowerCase()
      
      return keywords.some(keyword => 
        searchableText.includes(keyword.toLowerCase())
      )
    })
  }

  // Get document statistics
  static async getDocumentStats(): Promise<{
    totalDocuments: number
    totalSize: number
    fileTypeBreakdown: Record<string, number>
    recentUploads: number
  }> {
    try {
      const { data: documents, error } = await supabase
        .from('hr_documents')
        .select('file_type, file_size, uploaded_at')
      
      if (error) throw error
      
      const stats = {
        totalDocuments: documents?.length || 0,
        totalSize: 0,
        fileTypeBreakdown: {} as Record<string, number>,
        recentUploads: 0
      }
      
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      documents?.forEach(doc => {
        stats.totalSize += doc.file_size || 0
        
        const fileType = doc.file_type || 'unknown'
        stats.fileTypeBreakdown[fileType] = (stats.fileTypeBreakdown[fileType] || 0) + 1
        
        if (new Date(doc.uploaded_at) > oneWeekAgo) {
          stats.recentUploads++
        }
      })
      
      return stats
      
    } catch (error) {
      console.error('Error getting document stats:', error)
      throw new Error('Failed to retrieve document statistics')
    }
  }
}
