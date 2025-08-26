"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { validateFile, formatFileSize } from "@/lib/file-utils"
import { useAuth } from "@/contexts/auth-context"

interface UploadFile {
  id: string
  file: File
  progress: number
  status: "pending" | "uploading" | "completed" | "error"
  error?: string
}

export function DocumentUpload() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const { user } = useAuth()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }, [])

  const handleFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => {
      const validation = validateFile(file)
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: validation.isValid ? "pending" : "error",
        error: validation.error,
      }
    })

    setFiles((prev) => [...prev, ...uploadFiles])

    // Start upload for valid files
    uploadFiles
      .filter((f) => f.status === "pending")
      .forEach((uploadFile) => {
        uploadToServer(uploadFile.id)
      })
  }

  const uploadToServer = async (fileId: string) => {
    const uploadFile = files.find((f) => f.id === fileId)
    if (!uploadFile) return
    if (!user?.id) {
      setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "error", error: "Please sign in to upload" } : f)))
      return
    }

    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "uploading" } : f)))

    try {
      // Create FormData
      const formData = new FormData()
      formData.append("files", uploadFile.file)
      formData.append("userId", user.id)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === fileId && f.progress < 90) {
              return { ...f, progress: f.progress + 10 }
            }
            return f
          }),
        )
      }, 200)

      // Make API call
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] Upload successful:", result)

        setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "completed", progress: 100 } : f)))
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "error", error: "Upload failed" } : f)))
    }
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <span>Upload Documents</span>
          </CardTitle>
          <CardDescription>
            Upload resumes, CVs, and other HR documents. Supported formats: PDF, DOC, DOCX, TXT, CSV, WAV, MP3, M4A (max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-black">Drag and drop files here, or click to select</p>
              <p className="text-sm text-gray-500">PDF, DOC, DOCX, TXT, CSV, WAV, MP3, M4A files up to 10MB</p>
            </div>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.wav,.mp3,.m4a"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button
              type="button"
              variant="outline"
              className="mt-4 border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Select Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-black truncate">{uploadFile.file.name}</p>
                      <div className="flex items-center space-x-2">
                        {uploadFile.status === "completed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {uploadFile.status === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
                        <button onClick={() => removeFile(uploadFile.id)} className="text-gray-400 hover:text-gray-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{formatFileSize(uploadFile.file.size)}</span>
                      <span className="capitalize">{uploadFile.status}</span>
                    </div>
                    {uploadFile.status === "uploading" && <Progress value={uploadFile.progress} className="h-2" />}
                    {uploadFile.status === "error" && uploadFile.error && (
                      <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
