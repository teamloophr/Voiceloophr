"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Square, Volume2 } from "lucide-react"
import { voiceRecognition, voiceSynthesis, type VoiceRecognitionResult } from "@/lib/voice-utils"

interface VoiceRecorderProps {
  onTranscriptComplete?: (transcript: string) => void
  onError?: (error: string) => void
}

export function VoiceRecorder({ onTranscriptComplete, onError }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)

  useEffect(() => {
    setIsSupported(voiceRecognition.isVoiceSupported())
  }, [])

  const handleStartListening = async () => {
    if (!isSupported) {
      const errorMsg = "Speech recognition is not supported in this browser"
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setError(null)
    setTranscript("")
    setInterimTranscript("")
    setConfidence(null)

    try {
      await voiceRecognition.startListening(
        {
          continuous: true,
          interimResults: true,
          language: "en-US",
        },
        (result: VoiceRecognitionResult) => {
          if (result.isFinal) {
            setTranscript((prev) => prev + result.transcript + " ")
            setInterimTranscript("")
            setConfidence(result.confidence)
          } else {
            setInterimTranscript(result.transcript)
          }
        },
        (error: string) => {
          setError(error)
          setIsListening(false)
          onError?.(error)
        },
      )
      setIsListening(true)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to start voice recognition"
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }

  const handleStopListening = () => {
    voiceRecognition.stopListening()
    setIsListening(false)
    setInterimTranscript("")

    if (transcript.trim()) {
      onTranscriptComplete?.(transcript.trim())
    }
  }

  const handleClear = () => {
    setTranscript("")
    setInterimTranscript("")
    setConfidence(null)
    setError(null)
  }

  const handlePlayback = async () => {
    if (!transcript.trim()) return

    try {
      await voiceSynthesis.speak(transcript, {
        rate: 0.9,
        pitch: 1,
        volume: 0.8,
      })
    } catch (err) {
      console.error("[v0] Playback error:", err)
    }
  }

  if (!isSupported) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MicOff className="h-5 w-5 text-gray-400" />
            <span>Voice Recording</span>
          </CardTitle>
          <CardDescription>Voice recognition is not supported in this browser</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MicOff className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">
              Please use a modern browser like Chrome, Firefox, or Safari for voice features.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mic className="h-5 w-5 text-blue-600" />
          <span>Voice Recording</span>
        </CardTitle>
        <CardDescription>Record your voice to convert speech to text</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!isListening ? (
            <Button onClick={handleStartListening} className="bg-blue-600 hover:bg-blue-700" size="lg">
              <Mic className="h-5 w-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button onClick={handleStopListening} variant="destructive" size="lg">
              <Square className="h-5 w-5 mr-2" />
              Stop Recording
            </Button>
          )}

          {transcript && (
            <>
              <Button onClick={handlePlayback} variant="outline" size="lg">
                <Volume2 className="h-5 w-5 mr-2" />
                Play
              </Button>
              <Button onClick={handleClear} variant="outline" size="lg">
                Clear
              </Button>
            </>
          )}
        </div>

        {/* Status Indicator */}
        {isListening && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Listening...</span>
          </div>
        )}

        {/* Transcript Display */}
        {(transcript || interimTranscript) && (
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg min-h-[100px]">
              <div className="text-sm text-gray-900">
                {transcript}
                {interimTranscript && <span className="text-gray-500 italic">{interimTranscript}</span>}
              </div>
            </div>

            {/* Confidence Score */}
            {confidence !== null && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Confidence:</span>
                <Badge variant={confidence > 0.8 ? "default" : confidence > 0.6 ? "secondary" : "destructive"}>
                  {Math.round(confidence * 100)}%
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center">
          <p>Click "Start Recording" and speak clearly. Your speech will be converted to text in real-time.</p>
        </div>
      </CardContent>
    </Card>
  )
}
