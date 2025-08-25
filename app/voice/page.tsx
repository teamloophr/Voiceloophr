import { VoiceQueryInterface } from "@/components/voice/voice-query-interface"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Volume2, Zap, Shield } from "lucide-react"

export default function VoicePage() {
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
              <span className="text-sm text-gray-600">Voice Interface</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Voice Interface</h2>
            <p className="text-gray-600 text-lg">
              Interact with your HR assistant using natural voice commands and get spoken responses.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Voice Interface */}
            <div className="lg:col-span-2">
              <VoiceQueryInterface />
            </div>

            {/* Features Sidebar */}
            <div className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mic className="h-5 w-5 text-blue-600" />
                    <span>Voice Features</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mic className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-black">Speech Recognition</h4>
                      <p className="text-xs text-gray-600">Convert your speech to text with high accuracy</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Volume2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-black">Text-to-Speech</h4>
                      <p className="text-xs text-gray-600">Hear AI responses spoken naturally</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-black">Real-time Processing</h4>
                      <p className="text-xs text-gray-600">Instant voice recognition and response</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-black">Privacy First</h4>
                      <p className="text-xs text-gray-600">Voice processing happens in your browser</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Voice Commands</CardTitle>
                  <CardDescription>Try these voice queries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-700">
                    "Find me candidates with JavaScript experience"
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-700">
                    "Schedule an interview for tomorrow at 2 PM"
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-700">
                    "What are the top skills in uploaded resumes?"
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-700">
                    "Tell me about the most recent candidate"
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Browser Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>✅ Chrome (recommended)</p>
                    <p>✅ Firefox</p>
                    <p>✅ Safari</p>
                    <p>✅ Edge</p>
                    <p className="text-gray-500 mt-2">
                      Voice features require microphone access and modern browser support.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
