"use client"

import { useState } from "react"
import { AdvancedSearch } from "@/components/search/advanced-search"
import { SearchResults } from "@/components/search/search-results"
import type { SearchResult } from "@/lib/search-utils"

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results)
    setIsLoading(false)
  }

  const handleSearch = () => {
    setIsLoading(true)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-black">VoiceLoop</h1>
              <span className="ml-2 text-sm text-gray-500">HR Assistant</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Search & Query</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Search & Query Interface</h2>
            <p className="text-gray-600 text-lg">
              Find candidates, documents, and insights with powerful search and intelligent filtering.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Search Interface */}
            <div className="xl:col-span-1">
              <AdvancedSearch onSearchResults={handleSearchResults} />
            </div>

            {/* Search Results */}
            <div className="xl:col-span-2">
              <SearchResults results={searchResults} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
