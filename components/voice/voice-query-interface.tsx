"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Mic, Volume2, User, Bot, Loader2, Pause } from "lucide-react"
import { VoiceRecorder } from "./voice-recorder"
import { voiceSynthesis } from "@/lib/voice-utils"

interface VoiceMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  audioPlayed?: boolean
}

export function VoiceQueryInterface() {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: "welcome",
      type: "ai",
      content:
        "Hello! I'm your voice-enabled HR assistant. You can speak to me naturally, and I'll respond with both text and voice. Try asking about candidates, scheduling, or document analysis.",
      timestamp: new Date(),
    },
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [showRecorder, setShowRecorder] = useState(false)

  const handleVoiceTranscript = async (transcript: string) => {
    if (!transcript.trim()) return

    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      type: "user",
      content: transcript,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setShowRecorder(false)
    setIsProcessing(true)

    try {
      // Send query to AI
      const response = await fetch("/api/ai/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: transcript,
          userId: "mock-user",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()

      const aiMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      // Auto-play AI response
      setTimeout(() => {
        playMessage(aiMessage.id, aiMessage.content)
      }, 500)
    } catch (error) {
      console.error("[v0] Voice query error:", error)
      const errorMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "I'm sorry, I encountered an error processing your voice request. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const playMessage = async (messageId: string, content: string) => {
    if (currentlyPlaying === messageId) {
      voiceSynthesis.stop()
      setCurrentlyPlaying(null)
      return
    }

    try {
      setCurrentlyPlaying(messageId)
      await voiceSynthesis.speak(content, {
        rate: 0.9,
        pitch: 1,
        volume: 0.8,
      })
      setCurrentlyPlaying(null)

      // Mark as played
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, audioPlayed: true } : msg)))
    } catch (error) {
      console.error("[v0] Speech synthesis error:", error)
      setCurrentlyPlaying(null)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6">
      {/* Voice Query Interface */}
      <Card className="border-gray-200 h-[500px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="h-5 w-5 text-blue-600" />
            <span>Voice Query Interface</span>
          </CardTitle>
          <CardDescription>Speak naturally to interact with your HR assistant</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "ai" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="flex items-start justify-between space-x-2">
                      <p className="text-sm flex-1">{message.content}</p>
                      {message.type === "ai" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                          onClick={() => playMessage(message.id, message.content)}
                        >
                          {currentlyPlaying === message.id ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${message.type === "user" ? "text-blue-100" : "text-gray-500"}`}>
                        {formatTime(message.timestamp)}
                      </p>
                      {message.type === "ai" && message.audioPlayed && (
                        <Badge variant="secondary" className="text-xs">
                          Played
                        </Badge>
                      )}
                    </div>
                  </div>
                  {message.type === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                      <span className="text-sm text-gray-600">Processing your voice query...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Voice Input Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowRecorder(!showRecorder)}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
              disabled={isProcessing}
            >
              <Mic className="h-5 w-5 mr-2" />
              {showRecorder ? "Hide Voice Recorder" : "Start Voice Query"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Recorder */}
      {showRecorder && (
        <VoiceRecorder
          onTranscriptComplete={handleVoiceTranscript}
          onError={(error) => {
            console.error("[v0] Voice recorder error:", error)
          }}
        />
      )}
    </div>
  )
}
