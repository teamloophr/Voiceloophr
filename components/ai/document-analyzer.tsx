"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface AnalysisResult {
  summary: string
  keyPoints: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  documentType: string
  recommendation: 'store' | 'review'
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
        <CardDescription>Analyze {file.name} with AI to get a concise summary and recommendation for storage</CardDescription>
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
              Extracting text, analyzing content, and generating storage recommendation
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

            {/* Document Type and Recommendation */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-blue-900">Document Type: </span>
                <Badge variant="outline" className="ml-2">{result.documentType}</Badge>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-900">Recommendation: </span>
                <Badge 
                  className={`ml-2 ${
                    result.recommendation === 'store' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }`}
                >
                  {result.recommendation === 'store' ? 'Store' : 'Review'}
                </Badge>
              </div>
            </div>

            {/* Confidence Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-black">Confidence Score</h4>
                <span className="text-sm text-gray-600">{result.confidence}%</span>
              </div>
              <Progress value={result.confidence} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {result.confidence >= 80 ? 'High confidence in analysis' : 
                 result.confidence >= 60 ? 'Moderate confidence in analysis' : 
                 'Low confidence - manual review recommended'}
              </p>
            </div>

            {/* Summary */}
            <div>
              <h4 className="text-sm font-medium text-black mb-2">AI Summary</h4>
              <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">{result.summary}</p>
            </div>

            {/* Key Points */}
            {result.keyPoints && result.keyPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-black mb-2">Key Points</h4>
                <div className="space-y-2">
                  {result.keyPoints.map((point, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sentiment */}
            <div>
              <h4 className="text-sm font-medium text-black mb-2">Document Sentiment</h4>
              <Badge 
                className={`${
                  result.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                  result.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
