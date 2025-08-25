import { DocumentUpload } from "@/components/documents/document-upload"
import { DocumentList } from "@/components/documents/document-list"

export default function DocumentsPage() {
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
              <span className="text-sm text-gray-600">Documents</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Document Management</h2>
            <p className="text-gray-600 text-lg">
              Upload, organize, and analyze HR documents with AI-powered insights.
            </p>
          </div>

          <DocumentUpload />
          <DocumentList />
        </div>
      </main>
    </div>
  )
}
