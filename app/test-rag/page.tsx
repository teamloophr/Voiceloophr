"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Upload, Database, Trash2, CheckCircle } from "lucide-react"

export default function TestRAGPage() {
  const [testResults, setTestResults] = useState<any>(null)

  const testRAGFunctionality = async () => {
    setTestResults(null)
    console.log('🧪 Testing RAG Save/Discard functionality...')
    
    try {
      // Test 1: Document API
      console.log('📝 Test 1: Document API')
      const docResponse = await fetch('/api/documents')
      const docResults = await docResponse.json()
      console.log('✅ Document API:', docResults)
      
      // Test 2: Search API
      console.log('📝 Test 2: Search API')
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'test document',
          filters: {}
        })
      })
      const searchResults = await searchResponse.json()
      console.log('✅ Search API:', searchResults)
      
      // Test 3: File Upload Simulation
      console.log('📝 Test 3: File Upload Simulation')
      const mockFile = new Blob(['Test content for RAG'], { type: 'text/plain' })
      console.log('✅ Mock file created:', mockFile)
      
      setTestResults({
        documents: docResults,
        search: searchResults,
        upload: { success: true, mockFile }
      })
      
    } catch (error) {
      console.error('❌ Test failed:', error)
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🧪 VoiceLoopHR RAG Test Page</h1>
        <p className="text-gray-600">Test the RAG (Retrieval-Augmented Generation) save/discard functionality</p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 RAG Functionality Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testRAGFunctionality} className="bg-blue-600 hover:bg-blue-700">
              🚀 Test RAG System
            </Button>
            <Button onClick={() => setTestResults(null)} variant="outline">
              Clear Results
            </Button>
          </div>
          
          {testResults && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RAG Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>💾 RAG Features Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">File Upload</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Support for multiple file types:</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">PDF</Badge>
                <Badge variant="outline">DOC/DOCX</Badge>
                <Badge variant="outline">TXT</Badge>
                <Badge variant="outline">CSV</Badge>
                <Badge variant="outline">WAV</Badge>
                <Badge variant="outline">MP3</Badge>
                <Badge variant="outline">M4A</Badge>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-green-600" />
                <h4 className="font-medium">RAG Storage</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Save documents for:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Future search queries</li>
                <li>• AI-powered analysis</li>
                <li>• Knowledge base building</li>
                <li>• Document retrieval</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-medium">Save to RAG</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Benefits:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Document becomes searchable</li>
                <li>• Available for AI queries</li>
                <li>• Persistent storage</li>
                <li>• Metadata preservation</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                <h4 className="font-medium">Discard Option</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">When to discard:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Test documents</li>
                <li>• Temporary files</li>
                <li>• Sensitive information</li>
                <li>• Unwanted uploads</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Test */}
      <Card>
        <CardHeader>
          <CardTitle>📋 How to Test RAG Functionality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">1. Upload a Document</h4>
            <p className="text-sm text-gray-600">
              Go to the main app and upload any supported file type (PDF, CSV, WAV, etc.)
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">2. Review Analysis</h4>
            <p className="text-sm text-gray-600">
              The AI will analyze the document and show you a summary with key points
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">3. Choose Action</h4>
            <p className="text-sm text-gray-600">
              You'll see two options:
              <br />• <strong>💾 Save to RAG</strong> - Store document for future use
              <br />• <strong>🗑️ Discard</strong> - Remove from analysis
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">4. Test Search</h4>
            <p className="text-sm text-gray-600">
              If saved to RAG, the document becomes searchable and available for AI queries
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File Type Support */}
      <Card>
        <CardHeader>
          <CardTitle>📁 Supported File Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">📄 Documents</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PDF (.pdf)</li>
                <li>• Word (.doc, .docx)</li>
                <li>• Text (.txt)</li>
                <li>• CSV (.csv)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🎵 Audio</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• WAV (.wav)</li>
                <li>• MP3 (.mp3)</li>
                <li>• M4A (.m4a)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🔍 Processing</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Text extraction</li>
                <li>• AI analysis</li>
                <li>• RAG storage</li>
                <li>• Search indexing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
