"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface AnalysisResult {
  summary: string
  keywords: string[]
  skills: string[]
  experienceLevel?: string
  sentiment?: string
  contactInfo?: {
    email?: string
    phone?: string
    location?: string
  }
}

interface DocumentAnalyzerProps {
  file: File
  onAnalysisComplete?: (result: AnalysisResult) => void
}

export function DocumentAnalyzer({ file, onAnalysisComplete }: DocumentAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startAnalysis = async () => {
    setIsAnalyzing(true)
    setProgress(0)
    setError(null)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 300)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "mock-user")

      const response = await fetch("/api/ai/analyze-document", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const data = await response.json()
      setResult(data.analysis)
      onAnalysisComplete?.(data.analysis)

      console.log("[v0] Document analysis completed:", data)
    } catch (err) {
      console.error("[v0] Analysis error:", err)
      setError("Failed to analyze document. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <span>AI Document Analysis</span>
        </CardTitle>
        <CardDescription>Analyze {file.name} with AI to extract insights, keywords, and summaries</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && !isAnalyzing && (
          <Button onClick={startAnalysis} className="w-full bg-blue-600 hover:bg-blue-700">
            <Brain className="h-4 w-4 mr-2" />
            Start AI Analysis
          </Button>
        )}

        {isAnalyzing && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Analyzing document...</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500">
              Extracting text, generating summary, and identifying key information
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Analysis completed successfully</span>
            </div>

            {/* Summary */}
            <div>
              <h4 className="text-sm font-medium text-black mb-2">AI Summary</h4>
              <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">{result.summary}</p>
            </div>

            {/* Keywords */}
            {result.keywords.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-black mb-2">Keywords</h4>
                <div className="flex flex-wrap gap-1">
                  {result.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {result.skills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-black mb-2">Extracted Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {result.skills.map((skill, index) => (
                    <Badge key={index} className="text-xs bg-blue-100 text-blue-800">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Level */}
            {result.experienceLevel && (
              <div>
                <h4 className="text-sm font-medium text-black mb-2">Experience Level</h4>
                <Badge className="capitalize bg-purple-100 text-purple-800">{result.experienceLevel}</Badge>
              </div>
            )}

            {/* Contact Info */}
            {result.contactInfo && (
              <div>
                <h4 className="text-sm font-medium text-black mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  {result.contactInfo.email && <p>Email: {result.contactInfo.email}</p>}
                  {result.contactInfo.phone && <p>Phone: {result.contactInfo.phone}</p>}
                  {result.contactInfo.location && <p>Location: {result.contactInfo.location}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
