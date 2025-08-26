"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Save, X } from "lucide-react"
import { type SearchFilters, type SavedSearch } from "@/lib/search-utils"
import { useAuth } from "@/contexts/auth-context"
import type { SearchResult } from "@/lib/supabase"

interface AdvancedSearchProps {
  onSearchResults?: (results: SearchResult[]) => void
  onFiltersChange?: (filters: SearchFilters) => void
}

export function AdvancedSearch({ onSearchResults, onFiltersChange }: AdvancedSearchProps) {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({
    skills: [],
    experienceLevel: []
  })
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveSearchName, setSaveSearchName] = useState("")
  const { user } = useAuth()

  const skills = ["JavaScript", "React", "Node.js", "Python", "Java", "SQL", "AWS", "Docker"]
  const experienceLevels = ["junior", "mid", "senior", "executive"]

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setShowSuggestions(false)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters, userId: user?.id })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Search failed')
      onSearchResults?.(data.results)
      console.log("[search] completed:", data.totalCount, "results")
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
        // Simple local suggestions
        setSuggestions([`${value} skills`, `${value} experience`, `${value} requirements`])
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
    setFilters((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), skill],
    }))
  }

  const removeSkillFilter = (skill: string) => {
    setFilters((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s !== skill),
    }))
  }

  const addExperienceFilter = (level: string) => {
    setFilters((prev) => ({
      ...prev,
      experienceLevel: [...(prev.experienceLevel || []), level],
    }))
  }

  const removeExperienceFilter = (level: string) => {
    setFilters((prev) => ({
      ...prev,
      experienceLevel: (prev.experienceLevel || []).filter((l) => l !== level),
    }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  const saveCurrentSearch = async () => {
    if (!saveSearchName.trim() || !query.trim()) return

    try {
      // Optimistically save in UI (persisting not implemented yet)
      const savedSearch = {
        id: Date.now().toString(),
        name: saveSearchName,
        query,
        filters,
        resultCount: 0,
        createdAt: new Date().toISOString()
      } as SavedSearch
      setSavedSearches((prev) => [savedSearch, ...prev])
      setShowSaveDialog(false)
      setSaveSearchName("")
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
    setSavedSearches((prev) => prev.filter((search) => search.id !== searchId))
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="border-gray-200">
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
            <span key={skill} className="flex items-center space-x-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full px-2 py-0.5 text-xs">
              <span>{skill}</span>
              <button onClick={() => removeSkillFilter(skill)} className="hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {filters.experienceLevel?.map((level) => (
            <span key={level} className="flex items-center space-x-1 bg-purple-100 text-purple-800 border border-purple-300 rounded-full px-2 py-0.5 text-xs">
              <span className="capitalize">{level}</span>
              <button onClick={() => removeExperienceFilter(level)} className="hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <Button size="sm" variant="ghost" onClick={clearFilters} className="text-xs">
            Clear all
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="border-gray-200">
        <div className="space-y-6">
          {/* Skills Filter */}
          <div className="space-y-3">
            <Label>Skills</Label>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
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
            <Label>Date Range</Label>
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
        </div>
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="border-gray-200">
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
        </div>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="border-blue-200 bg-blue-50">
          <div className="p-4">
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
          </div>
        </div>
      )}
    </div>
  )
}
