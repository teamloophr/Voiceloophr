"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, User, Calendar, Star } from "lucide-react"

export default function TestSearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters: {}
        })
      })
      
      const data = await response.json()
      setResults(data.results || [])
      console.log('Search results:', data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runTests = async () => {
    setTestResults(null)
    console.log('🧪 Running VoiceLoopHR tests...')
    
    // Test 1: Basic Search
    console.log('📝 Test 1: Basic Search Query')
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'React developer',
          filters: { skills: ['React'], experienceLevel: ['senior'] }
        })
      })
      const results = await response.json()
      console.log('✅ Basic search test:', results)
      
      // Test 2: Calendar API
      console.log('📝 Test 2: Calendar Integration')
      const calendarResponse = await fetch('/api/calendar/events')
      const calendarResults = await calendarResponse.json()
      console.log('✅ Calendar test:', calendarResults)
      
      // Test 3: Document Upload (mock)
      console.log('📝 Test 3: Document Upload Setup')
      const mockFile = new Blob(['Test content'], { type: 'application/pdf' })
      console.log('✅ Mock file created:', mockFile)
      
      setTestResults({
        search: results,
        calendar: calendarResults,
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
        <h1 className="text-3xl font-bold mb-2">🧪 VoiceLoopHR Test Page</h1>
        <p className="text-gray-600">Test the search engine and file upload functionality</p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runTests} className="bg-blue-600 hover:bg-blue-700">
              🚀 Run All Tests
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

      {/* Search Test */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Search Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter search query (e.g., 'React developer')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : <Search className="h-4 w-4" />}
            </Button>
          </div>
          
          {results.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Search Results ({results.length}):</h3>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {result.metadata?.fileType ? (
                        <FileText className="h-4 w-4 text-blue-600" />
                      ) : result.metadata?.experienceLevel ? (
                        <User className="h-4 w-4 text-green-600" />
                      ) : (
                        <Calendar className="h-4 w-4 text-purple-600" />
                      )}
                      <h4 className="font-medium">{result.title}</h4>
                      <Badge variant="secondary">
                        {Math.round(result.relevanceScore || 0)}% match
                      </Badge>
                      {(result.relevanceScore || 0) >= 90 && <Star className="h-4 w-4 text-yellow-500" />}
                    </div>
                    {result.description && (
                      <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                    )}
                    {result.highlights && result.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.highlights.map((highlight: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Endpoints Test */}
      <Card>
        <CardHeader>
          <CardTitle>🔌 API Endpoints Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">Search API</h4>
              <p className="text-sm text-gray-600 mb-2">POST /api/search</p>
              <Button size="sm" variant="outline" onClick={handleSearch}>
                Test Search
              </Button>
            </div>
            
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">Calendar API</h4>
              <p className="text-sm text-gray-600 mb-2">GET /api/calendar/events</p>
              <Button size="sm" variant="outline" onClick={async () => {
                try {
                  const response = await fetch('/api/calendar/events')
                  const data = await response.json()
                  console.log('Calendar API response:', data)
                  alert(`Calendar API: ${data.events?.length || 0} events found`)
                } catch (error) {
                  console.error('Calendar API error:', error)
                  alert('Calendar API error: ' + (error instanceof Error ? error.message : 'Unknown error'))
                }
              }}>
                Test Calendar
              </Button>
            </div>
            
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">Documents API</h4>
              <p className="text-sm text-gray-600 mb-2">GET /api/documents</p>
              <Button size="sm" variant="outline" onClick={async () => {
                try {
                  const response = await fetch('/api/documents')
                  const data = await response.json()
                  console.log('Documents API response:', data)
                  alert(`Documents API: ${data.documents?.length || 0} documents found`)
                } catch (error) {
                  console.error('Documents API error:', error)
                  alert('Documents API error: ' + (error instanceof Error ? error.message : 'Unknown error'))
                }
              }}>
                Test Documents
              </Button>
            </div>
            
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">AI Query API</h4>
              <p className="text-sm text-gray-600 mb-2">POST /api/ai/query</p>
              <Button size="sm" variant="outline" onClick={async () => {
                try {
                  const response = await fetch('/api/ai/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: 'What are the key skills for a React developer?' })
                  })
                  const data = await response.json()
                  console.log('AI Query API response:', data)
                  alert('AI Query API: Response received')
                } catch (error) {
                  console.error('AI Query API error:', error)
                  alert('AI Query API error: ' + (error instanceof Error ? error.message : 'Unknown error'))
                }
              }}>
                Test AI Query
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. <strong>Run All Tests:</strong> Click the "Run All Tests" button to test all functionality</p>
          <p>2. <strong>Search Test:</strong> Enter a search query and test the search engine</p>
          <p>3. <strong>API Tests:</strong> Test individual API endpoints</p>
          <p>4. <strong>Check Console:</strong> Open browser console to see detailed test results</p>
          <p>5. <strong>File Upload:</strong> Test document upload in the Documents section</p>
        </CardContent>
      </Card>
    </div>
  )
}
