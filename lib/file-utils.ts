// File processing utilities for document upload system

export const SUPPORTED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
} as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.`,
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`,
    }
  }

  // Check for empty files
  if (file.size === 0) {
    return {
      isValid: false,
      error: "File is empty.",
    }
  }

  return { isValid: true }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function getFileIcon(mimeType: string): string {
  switch (mimeType) {
    case "application/pdf":
      return "📄"
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "📝"
    case "text/plain":
      return "📃"
    default:
      return "📄"
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  // TODO: Implement actual text extraction when AI processing is added
  // For now, return placeholder text based on file type

  if (file.type === "text/plain") {
    return await file.text()
  }

  // For PDF and DOC files, we'll need to implement proper text extraction
  // This would typically use libraries like pdf-parse or mammoth
  console.log("[v0] Text extraction placeholder for:", file.name)

  return `[Text extraction placeholder for ${file.name}]`
}
