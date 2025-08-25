"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Calendar, User, Download, Eye, Star, Mail, MapPin } from "lucide-react"
import type { SearchResult } from "@/lib/supabase"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SearchResultsProps {
  results: SearchResult[]
  isLoading?: boolean
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "title">("relevance")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const sortResults = (results: SearchResult[]) => {
    switch (sortBy) {
      case "relevance":
        return [...results].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      case "date":
        return [...results].sort((a, b) => {
          const dateA = new Date(a.metadata?.uploadedAt || 0)
          const dateB = new Date(b.metadata?.uploadedAt || 0)
          return dateB.getTime() - dateA.getTime()
        })
      case "title":
        return [...results].sort((a, b) => a.title.localeCompare(b.title))
      default:
        return results
    }
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return "bg-green-500"
    if (score >= 70) return "bg-blue-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-gray-400"
  }

  const getResultIcon = (result: SearchResult) => {
    if (result.metadata?.fileType) return <FileText className="h-6 w-6 text-blue-600" />
    if (result.metadata?.experienceLevel) return <User className="h-6 w-6 text-green-600" />
    if (result.metadata?.date) return <Calendar className="h-6 w-6 text-purple-600" />
    return <FileText className="h-6 w-6 text-gray-600" />
  }

  const getResultType = (result: SearchResult) => {
    if (result.metadata?.fileType) return "Document"
    if (result.metadata?.experienceLevel) return "Candidate"
    if (result.metadata?.date) return "Event"
    return "Result"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Searching...</span>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-500">Try adjusting your search terms or filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Search Results ({results.length})
          </h2>
          <p className="text-sm text-gray-500">
            Found {results.length} results for your search
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Sort */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View mode */}
          <div className="flex items-center space-x-1 border rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <div className="w-4 h-4 border-2 border-current rounded"></div>
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                <div className="border border-current rounded-sm"></div>
                <div className="border border-current rounded-sm"></div>
                <div className="border border-current rounded-sm"></div>
                <div className="border border-current rounded-sm"></div>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {sortResults(results).map((result) => (
          <Card key={result.id} className="border-gray-200 hover:border-blue-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getResultIcon(result)}
                </div>

                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Relevance: {Math.round((result.relevanceScore || 0))}%
                      </span>
                      <div
                        className={`w-16 h-2 rounded-full ${getRelevanceColor(result.relevanceScore || 0)}`}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{getResultType(result)}</Badge>
                      {(result.relevanceScore || 0) >= 90 && <Star className="h-4 w-4 text-yellow-500" />}
                    </div>
                  </div>

                  {/* Title and type */}
                  <div className="mb-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{result.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        {getResultType(result)}
                      </span>
                      {result.metadata?.uploadedAt && (
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(result.metadata.uploadedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {result.description && (
                    <p className="text-gray-700 mb-3">{result.description}</p>
                  )}

                  {/* Highlights */}
                  {result.highlights && result.highlights.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-500 mr-2">Highlights:</span>
                      <div className="flex flex-wrap gap-1">
                        {result.highlights.map((highlight, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 text-sm">
                    {result.metadata?.skills && result.metadata.skills.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">Skills:</span>
                        {result.metadata.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {result.metadata.skills.length > 3 && (
                          <span className="text-gray-400">+{result.metadata.skills.length - 3} more</span>
                        )}
                      </div>
                    )}

                    {result.metadata?.experienceLevel && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">Level:</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {result.metadata.experienceLevel}
                        </Badge>
                      </div>
                    )}

                    {result.metadata?.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{result.metadata.location}</span>
                      </div>
                    )}

                    {result.metadata?.department && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">Dept:</span>
                        <span className="text-gray-600">{result.metadata.department}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    {result.metadata?.experienceLevel && (
                      <Button size="sm" variant="outline">
                        <Mail className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
