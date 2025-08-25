import { AIQueryInterface } from "@/components/ai/ai-query-interface"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, FileText, Zap, Shield } from "lucide-react"

export default function AIAssistantPage() {
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
              <span className="text-sm text-gray-600">AI Assistant</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">AI Assistant</h2>
            <p className="text-gray-600 text-lg">
              Get intelligent insights from your HR documents and streamline your workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* AI Query Interface */}
            <div className="lg:col-span-2">
              <AIQueryInterface />
            </div>

            {/* Features Sidebar */}
            <div className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <span>AI Capabilities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-black">Document Analysis</h4>
                      <p className="text-xs text-gray-600">Extract insights, skills, and summaries from resumes</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-black">Smart Search</h4>
                      <p className="text-xs text-gray-600">Find candidates based on skills and experience</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-black">Secure Processing</h4>
                      <p className="text-xs text-gray-600">Your data stays private with personal API keys</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Sample Queries</CardTitle>
                  <CardDescription>Try asking these questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-700">
                    "Find candidates with React experience"
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-700">
                    "What skills are most common in uploaded resumes?"
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-700">
                    "Schedule interviews for senior developers"
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-700">"Summarize the top 3 candidates"</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
