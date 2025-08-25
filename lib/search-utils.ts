// Search utilities for document and candidate search

export interface SearchFilters {
  documentTypes?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  skills?: string[]
  experienceLevel?: string[]
  keywords?: string[]
  minConfidence?: number
}

export interface SearchResult {
  id: string
  type: "document" | "candidate" | "event"
  title: string
  description: string
  relevanceScore: number
  highlights: string[]
  metadata: {
    filename?: string
    uploadDate?: string
    skills?: string[]
    experienceLevel?: string
    contactInfo?: any
    eventDate?: string
    location?: string
  }
}

export interface SavedSearch {
  id: string
  name: string
  query: string
  filters: SearchFilters
  createdAt: Date
  lastUsed: Date
  resultCount: number
}

export class SearchEngine {
  private documents: any[] = []
  private savedSearches: SavedSearch[] = []

  constructor() {
    this.initializeMockData()
  }

  private initializeMockData() {
    // Mock documents for search
    this.documents = [
      {
        id: "1",
        type: "document",
        filename: "john_doe_resume.pdf",
        title: "John Doe - Senior Software Engineer",
        content:
          "Experienced software engineer with 5+ years in React, Node.js, and TypeScript. Led development of scalable web applications serving 100k+ users. Strong background in agile methodologies and team leadership.",
        skills: ["React", "Node.js", "TypeScript", "JavaScript", "Leadership", "Agile"],
        experienceLevel: "senior",
        uploadDate: "2024-01-15T10:30:00Z",
        contactInfo: { email: "john.doe@example.com", location: "San Francisco, CA" },
        keywords: ["Software Engineer", "React", "Node.js", "Leadership", "Scalable Applications"],
      },
      {
        id: "2",
        type: "document",
        filename: "jane_smith_cv.docx",
        title: "Jane Smith - Senior UX Designer",
        content:
          "Senior UX designer with 7 years of experience in user research, interface design, and design systems. Expertise in Figma, user testing, and cross-functional collaboration. Led design for mobile apps with 1M+ downloads.",
        skills: ["UX Design", "User Research", "Figma", "Design Systems", "Mobile Design", "User Testing"],
        experienceLevel: "senior",
        uploadDate: "2024-01-14T14:20:00Z",
        contactInfo: { email: "jane.smith@example.com", location: "New York, NY" },
        keywords: ["UX Designer", "User Research", "Design Systems", "Mobile Apps", "Figma"],
      },
      {
        id: "3",
        type: "document",
        filename: "mike_johnson_resume.pdf",
        title: "Mike Johnson - Junior Developer",
        content:
          "Recent computer science graduate with internship experience in web development. Proficient in Python, JavaScript, and React. Built several personal projects including a task management app and e-commerce site.",
        skills: ["Python", "JavaScript", "React", "Web Development", "Git"],
        experienceLevel: "junior",
        uploadDate: "2024-01-13T09:15:00Z",
        contactInfo: { email: "mike.johnson@example.com", location: "Austin, TX" },
        keywords: ["Junior Developer", "Python", "JavaScript", "Recent Graduate", "Web Development"],
      },
    ]

    // Mock saved searches
    this.savedSearches = [
      {
        id: "1",
        name: "Senior React Developers",
        query: "React senior developer",
        filters: {
          skills: ["React"],
          experienceLevel: ["senior"],
        },
        createdAt: new Date("2024-01-10"),
        lastUsed: new Date("2024-01-15"),
        resultCount: 2,
      },
      {
        id: "2",
        name: "UX Designers",
        query: "UX designer",
        filters: {
          skills: ["UX Design", "User Research"],
        },
        createdAt: new Date("2024-01-12"),
        lastUsed: new Date("2024-01-14"),
        resultCount: 1,
      },
    ]
  }

  public async search(query: string, filters: SearchFilters = {}): Promise<SearchResult[]> {
    console.log("[v0] Searching for:", query, "with filters:", filters)

    // Simulate search processing time
    await new Promise((resolve) => setTimeout(resolve, 500))

    let results = [...this.documents]

    // Apply text search
    if (query.trim()) {
      const queryLower = query.toLowerCase()
      results = results.filter((doc) => {
        const searchableText =
          `${doc.title} ${doc.content} ${doc.skills.join(" ")} ${doc.keywords.join(" ")}`.toLowerCase()
        return searchableText.includes(queryLower)
      })
    }

    // Apply filters
    if (filters.skills && filters.skills.length > 0) {
      results = results.filter((doc) => filters.skills!.some((skill) => doc.skills.includes(skill)))
    }

    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      results = results.filter((doc) => filters.experienceLevel!.includes(doc.experienceLevel))
    }

    if (filters.dateRange) {
      results = results.filter((doc) => {
        const docDate = new Date(doc.uploadDate)
        return docDate >= filters.dateRange!.start && docDate <= filters.dateRange!.end
      })
    }

    // Convert to SearchResult format with relevance scoring
    const searchResults: SearchResult[] = results.map((doc) => {
      const relevanceScore = this.calculateRelevanceScore(doc, query, filters)
      const highlights = this.generateHighlights(doc, query)

      return {
        id: doc.id,
        type: "document",
        title: doc.title,
        description: doc.content.substring(0, 200) + "...",
        relevanceScore,
        highlights,
        metadata: {
          filename: doc.filename,
          uploadDate: doc.uploadDate,
          skills: doc.skills,
          experienceLevel: doc.experienceLevel,
          contactInfo: doc.contactInfo,
        },
      }
    })

    // Sort by relevance score
    searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return searchResults
  }

  private calculateRelevanceScore(doc: any, query: string, filters: SearchFilters): number {
    let score = 0

    // Base score for text match
    const queryLower = query.toLowerCase()
    const titleMatch = doc.title.toLowerCase().includes(queryLower)
    const contentMatch = doc.content.toLowerCase().includes(queryLower)
    const skillMatch = doc.skills.some((skill: string) => skill.toLowerCase().includes(queryLower))

    if (titleMatch) score += 10
    if (contentMatch) score += 5
    if (skillMatch) score += 8

    // Bonus for filter matches
    if (filters.skills) {
      const matchingSkills = filters.skills.filter((skill) => doc.skills.includes(skill))
      score += matchingSkills.length * 3
    }

    if (filters.experienceLevel && filters.experienceLevel.includes(doc.experienceLevel)) {
      score += 5
    }

    // Recency bonus
    const docDate = new Date(doc.uploadDate)
    const daysSinceUpload = (Date.now() - docDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpload < 7) score += 2
    if (daysSinceUpload < 30) score += 1

    return Math.min(score, 100) // Cap at 100
  }

  private generateHighlights(doc: any, query: string): string[] {
    const highlights: string[] = []
    const queryLower = query.toLowerCase()

    // Find matching sentences in content
    const sentences = doc.content.split(". ")
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(queryLower)) {
        highlights.push(sentence.trim())
        if (highlights.length >= 2) break
      }
    }

    // Add matching skills
    const matchingSkills = doc.skills.filter((skill: string) => skill.toLowerCase().includes(queryLower))
    if (matchingSkills.length > 0) {
      highlights.push(`Skills: ${matchingSkills.join(", ")}`)
    }

    return highlights
  }

  public getSavedSearches(): SavedSearch[] {
    return [...this.savedSearches].sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
  }

  public saveSearch(name: string, query: string, filters: SearchFilters, resultCount: number): SavedSearch {
    const savedSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      query,
      filters,
      createdAt: new Date(),
      lastUsed: new Date(),
      resultCount,
    }

    this.savedSearches.push(savedSearch)
    console.log("[v0] Saved search:", name)

    return savedSearch
  }

  public deleteSavedSearch(searchId: string): boolean {
    const index = this.savedSearches.findIndex((search) => search.id === searchId)
    if (index !== -1) {
      this.savedSearches.splice(index, 1)
      return true
    }
    return false
  }

  public async getSearchSuggestions(query: string): Promise<string[]> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 200))

    const suggestions = [
      "React developer with 5+ years experience",
      "Senior UX designer with Figma skills",
      "JavaScript developer in San Francisco",
      "Python developer with machine learning",
      "Full-stack developer with Node.js",
      "Mobile developer with React Native",
      "DevOps engineer with AWS experience",
      "Data scientist with Python and R",
    ]

    const queryLower = query.toLowerCase()
    return suggestions.filter((suggestion) => suggestion.toLowerCase().includes(queryLower)).slice(0, 5)
  }
}

export const searchEngine = new SearchEngine()
