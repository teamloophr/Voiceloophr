"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, User, Calendar, Star, Download, Eye, Mail, MapPin } from "lucide-react"
import type { SearchResult } from "@/lib/search-utils"

interface SearchResultsProps {
  results: SearchResult[]
  isLoading?: boolean
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "name">("relevance")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "relevance":
        return b.relevanceScore - a.relevanceScore
      case "date":
        const dateA = new Date(a.metadata.uploadDate || 0)
        const dateB = new Date(b.metadata.uploadDate || 0)
        return dateB.getTime() - dateA.getTime()
      case "name":
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800"
    if (score >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching...</p>
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">No results found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters to find what you're looking for.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-black">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </h3>
              <p className="text-sm text-gray-600">Showing the most relevant matches</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <div className="space-y-4">
        {sortedResults.map((result) => (
          <Card key={result.id} className="border-gray-200 hover:border-blue-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {result.type === "document" && <FileText className="h-6 w-6 text-blue-600" />}
                        {result.type === "candidate" && <User className="h-6 w-6 text-green-600" />}
                        {result.type === "event" && <Calendar className="h-6 w-6 text-purple-600" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-black">{result.title}</h3>
                        {result.metadata.filename && (
                          <p className="text-sm text-gray-500">{result.metadata.filename}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRelevanceColor(result.relevanceScore)}>
                        {Math.round(result.relevanceScore)}% match
                      </Badge>
                      {result.relevanceScore >= 90 && <Star className="h-4 w-4 text-yellow-500" />}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-4">{result.description}</p>

                  {/* Highlights */}
                  {result.highlights.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-black mb-2">Relevant excerpts:</h4>
                      <div className="space-y-1">
                        {result.highlights.map((highlight, index) => (
                          <p key={index} className="text-sm text-gray-600 italic bg-yellow-50 p-2 rounded">
                            "{highlight}"
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="space-y-3">
                    {/* Skills */}
                    {result.metadata.skills && result.metadata.skills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-black mb-1">Skills:</h4>
                        <div className="flex flex-wrap gap-1">
                          {result.metadata.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience Level */}
                    {result.metadata.experienceLevel && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Experience:</span>
                        <Badge className="capitalize bg-purple-100 text-purple-800">
                          {result.metadata.experienceLevel}
                        </Badge>
                      </div>
                    )}

                    {/* Contact Info */}
                    {result.metadata.contactInfo && (
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {result.metadata.contactInfo.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{result.metadata.contactInfo.email}</span>
                          </div>
                        )}
                        {result.metadata.contactInfo.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{result.metadata.contactInfo.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload Date */}
                    {result.metadata.uploadDate && (
                      <div className="text-sm text-gray-500">Uploaded: {formatDate(result.metadata.uploadDate)}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-100">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                {result.metadata.contactInfo?.email && (
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
