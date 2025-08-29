"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, CheckCircle, AlertCircle } from "lucide-react"

interface AnalysisResult {
  summary: string
  keyPoints: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  documentType: string
  recommendation: 'store' | 'review'
}

export default function TestPDFSummarizationPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }

  const startAnalysis = async () => {
    if (!file) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "test-user")

      const response = await fetch("/api/ai/analyze-document", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const data = await response.json()
      setResult(data.analysis)
      console.log("Analysis completed:", data)
    } catch (err) {
      console.error("Analysis error:", err)
      setError("Failed to analyze document. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
            <CardDescription>
              Select a PDF file to test the improved summarization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  {file ? file.name : "Click to select PDF file"}
                </p>
                <p className="text-xs text-gray-500">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF files only"}
                </p>
              </label>
            </div>

            {file && (
              <Button 
                onClick={startAnalysis} 
                disabled={isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isAnalyzing ? "Analyzing..." : "Start Analysis"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Human-readable summary and storage recommendation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAnalyzing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Analyzing document...</p>
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
                {result.keyPoints.length > 0 && (
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
      </div>
    </div>
  )
}
