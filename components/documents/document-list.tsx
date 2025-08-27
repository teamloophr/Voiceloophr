"use client"
import type { Document } from "@/lib/types"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Download, Trash2, Eye } from "lucide-react"

// Mock data for demonstration
const mockDocuments: Document[] = [
  {
    id: "1",
    user_id: "mock-user",
    filename: "john_doe_resume.pdf",
    file_path: "/documents/john_doe_resume.pdf",
    file_size: 245760,
    mime_type: "application/pdf",
    ai_summary:
      "Experienced software engineer with 5 years in React and Node.js development. Strong background in full-stack web applications.",
    ai_keywords: ["React", "Node.js", "JavaScript", "Full-stack", "Software Engineer"],
    upload_date: "2024-01-15T10:30:00Z",
    processed_at: "2024-01-15T10:32:00Z",
    status: "completed",
  },
  {
    id: "2",
    user_id: "mock-user",
    filename: "jane_smith_cv.docx",
    file_path: "/documents/jane_smith_cv.docx",
    file_size: 189440,
    mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ai_summary:
      "Senior UX designer with expertise in user research and interface design. 7 years experience in design systems.",
    ai_keywords: ["UX Design", "User Research", "Figma", "Design Systems", "Senior Designer"],
    upload_date: "2024-01-14T14:20:00Z",
    processed_at: "2024-01-14T14:22:00Z",
    status: "completed",
  },
]

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [searchTerm, setSearchTerm] = useState("")

  const handleDecision = useCallback(async (documentId: string, action: 'save' | 'delete') => {
    try {
      const resp = await fetch('/api/documents/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, action })
      })
      // Optimistic update on success
      if (resp.ok) {
        if (action === 'delete') {
          setDocuments(prev => prev.filter(d => d.id !== documentId))
        } else if (action === 'save') {
          setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, status: 'completed' } as any : d))
        }
      }
    } catch (e) {
      console.error('[DocumentList] decision error:', e)
    }
  }, [])

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.ai_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.ai_keywords?.some((keyword) => keyword.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Document Library</span>
          </CardTitle>
          <CardDescription>Search and manage your uploaded documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents by name, content, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 focus:border-blue-600 focus:ring-blue-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Document Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDocuments.map((document) => (
          <Card key={document.id} className="border-gray-200 hover:border-blue-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg truncate">{document.filename}</CardTitle>
                    <CardDescription className="text-sm">
                      {formatFileSize(document.file_size || 0)} • {formatDate(document.upload_date)}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(document.status)}>{document.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Summary */}
              {document.ai_summary && (
                <div>
                  <h4 className="text-sm font-medium text-black mb-1">AI Summary</h4>
                  <p className="text-sm text-gray-600 line-clamp-3">{document.ai_summary}</p>
                </div>
              )}

              {/* Keywords */}
              {document.ai_keywords && document.ai_keywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-black mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-1">
                    {document.ai_keywords.slice(0, 5).map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {document.ai_keywords.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{document.ai_keywords.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={() => handleDecision(document.id, 'save')}>
                  Save
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 bg-transparent" onClick={() => handleDecision(document.id, 'delete')}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">No documents found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try adjusting your search terms" : "Upload your first document to get started"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
