"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, Save, Clock } from "lucide-react"
import { searchEngine, type SearchFilters, type SearchResult, type SavedSearch } from "@/lib/search-utils"

interface AdvancedSearchProps {
  onSearchResults?: (results: SearchResult[]) => void
  onFiltersChange?: (filters: SearchFilters) => void
}

export function AdvancedSearch({ onSearchResults, onFiltersChange }: AdvancedSearchProps) {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({})
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveSearchName, setSaveSearchName] = useState("")

  const availableSkills = [
    "React",
    "Node.js",
    "TypeScript",
    "JavaScript",
    "Python",
    "UX Design",
    "User Research",
    "Figma",
    "Design Systems",
    "Leadership",
    "Agile",
    "Git",
    "AWS",
    "Machine Learning",
  ]

  const experienceLevels = ["junior", "mid", "senior", "executive"]

  useEffect(() => {
    loadSavedSearches()
  }, [])

  useEffect(() => {
    onFiltersChange?.(filters)
  }, [filters, onFiltersChange])

  const loadSavedSearches = () => {
    const searches = searchEngine.getSavedSearches()
    setSavedSearches(searches)
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setShowSuggestions(false)

    try {
      const results = await searchEngine.search(query, filters)
      onSearchResults?.(results)
      console.log("[v0] Search completed:", results.length, "results")
    } catch (error) {
      console.error("[v0] Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleQueryChange = async (value: string) => {
    setQuery(value)

    if (value.length > 2) {
      try {
        const suggestions = await searchEngine.getSearchSuggestions(value)
        setSuggestions(suggestions)
        setShowSuggestions(true)
      } catch (error) {
        console.error("[v0] Suggestions error:", error)
      }
    } else {
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    handleSearch()
  }

  const updateFilters = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const addSkillFilter = (skill: string) => {
    const currentSkills = filters.skills || []
    if (!currentSkills.includes(skill)) {
      updateFilters("skills", [...currentSkills, skill])
    }
  }

  const removeSkillFilter = (skill: string) => {
    const currentSkills = filters.skills || []
    updateFilters(
      "skills",
      currentSkills.filter((s) => s !== skill),
    )
  }

  const addExperienceFilter = (level: string) => {
    const currentLevels = filters.experienceLevel || []
    if (!currentLevels.includes(level)) {
      updateFilters("experienceLevel", [...currentLevels, level])
    }
  }

  const removeExperienceFilter = (level: string) => {
    const currentLevels = filters.experienceLevel || []
    updateFilters(
      "experienceLevel",
      currentLevels.filter((l) => l !== level),
    )
  }

  const clearFilters = () => {
    setFilters({})
  }

  const saveCurrentSearch = async () => {
    if (!saveSearchName.trim() || !query.trim()) return

    try {
      // Perform search to get result count
      const results = await searchEngine.search(query, filters)
      const savedSearch = searchEngine.saveSearch(saveSearchName, query, filters, results.length)

      setSavedSearches((prev) => [savedSearch, ...prev])
      setShowSaveDialog(false)
      setSaveSearchName("")

      console.log("[v0] Search saved:", saveSearchName)
    } catch (error) {
      console.error("[v0] Save search error:", error)
    }
  }

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query)
    setFilters(savedSearch.filters)
    handleSearch()
  }

  const deleteSavedSearch = (searchId: string) => {
    searchEngine.deleteSavedSearch(searchId)
    setSavedSearches((prev) => prev.filter((search) => search.id !== searchId))
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span>Advanced Search</span>
          </CardTitle>
          <CardDescription>Search through documents, candidates, and HR data with intelligent filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search for candidates, skills, experience, or keywords..."
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleSearch} disabled={isSearching} className="bg-blue-600 hover:bg-blue-700">
                {isSearching ? "Searching..." : "Search"}
              </Button>
              <Button onClick={() => setShowSaveDialog(true)} variant="outline" disabled={!query.trim()}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.skills?.length || filters.experienceLevel?.length) && (
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.skills?.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center space-x-1">
                  <span>{skill}</span>
                  <button onClick={() => removeSkillFilter(skill)} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.experienceLevel?.map((level) => (
                <Badge key={level} className="flex items-center space-x-1 bg-purple-100 text-purple-800">
                  <span className="capitalize">{level}</span>
                  <button onClick={() => removeExperienceFilter(level)} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button size="sm" variant="ghost" onClick={clearFilters} className="text-xs">
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <span>Search Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skills Filter */}
          <div className="space-y-3">
            <Label>Skills</Label>
            <div className="flex flex-wrap gap-2">
              {availableSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkillFilter(skill)}
                  disabled={filters.skills?.includes(skill)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    filters.skills?.includes(skill)
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level Filter */}
          <div className="space-y-3">
            <Label>Experience Level</Label>
            <div className="flex flex-wrap gap-2">
              {experienceLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => addExperienceFilter(level)}
                  disabled={filters.experienceLevel?.includes(level)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors capitalize ${
                    filters.experienceLevel?.includes(level)
                      ? "bg-purple-100 text-purple-800 border-purple-300"
                      : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label>Upload Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-xs text-gray-500">
                  From
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  onChange={(e) =>
                    updateFilters("dateRange", {
                      ...filters.dateRange,
                      start: new Date(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs text-gray-500">
                  To
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  onChange={(e) =>
                    updateFilters("dateRange", {
                      ...filters.dateRange,
                      end: new Date(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Saved Searches</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedSearches.slice(0, 5).map((savedSearch) => (
                <div key={savedSearch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <button onClick={() => loadSavedSearch(savedSearch)} className="text-left hover:text-blue-600">
                      <div className="font-medium text-black">{savedSearch.name}</div>
                      <div className="text-sm text-gray-600">
                        "{savedSearch.query}" • {savedSearch.resultCount} results
                      </div>
                    </button>
                  </div>
                  <button
                    onClick={() => deleteSavedSearch(savedSearch.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Label htmlFor="searchName">Save this search</Label>
              <Input
                id="searchName"
                placeholder="Enter a name for this search..."
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && saveCurrentSearch()}
              />
              <div className="flex space-x-2">
                <Button onClick={saveCurrentSearch} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Save Search
                </Button>
                <Button onClick={() => setShowSaveDialog(false)} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
