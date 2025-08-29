"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Sun, Moon, Paperclip, Mic, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WaveAnimation } from "@/components/ui/wave-animation-1"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface ChatInterfaceProps {
  isDarkMode: boolean
  onToggleTheme: () => void
}

export function ChatInterface({ isDarkMode, onToggleTheme }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI HR assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log("[v0] File selected:", file.name)
      const userMessage: Message = {
        id: Date.now().toString(),
        content: `Uploaded file: ${file.name}`,
        role: "user",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])
    }
  }

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false)
      console.log("[v0] Stopped recording")
    } else {
      setIsRecording(true)
      console.log("[v0] Started recording")
    }
  }

  const handleSpeakResponse = (text: string) => {
    if (isSpeaking) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      speechSynthesis.speak(utterance)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I understand your request. As an HR assistant, I can help you with document analysis, candidate screening, interview scheduling, and more. What specific task would you like assistance with?",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={`relative min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <div className="fixed inset-0 z-0">
        <WaveAnimation
          particleColor={isDarkMode ? "#ffffff" : "#3b82f6"}
          pointSize={1.2}
          waveSpeed={1.5}
          waveIntensity={6.0}
          className="opacity-20"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header
          className={`flex items-center justify-between p-4 border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}
        >
          <div className="flex items-center">
            <h1 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              VoiceLoop HR
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleTheme} className="rounded-full">
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? isDarkMode
                          ? "bg-white text-black"
                          : "bg-black text-white"
                        : isDarkMode
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-black"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  {message.role === "assistant" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSpeakResponse(message.content)}
                      className={`rounded-full p-2 ${isSpeaking ? "bg-blue-100 dark:bg-blue-900" : ""}`}
                    >
                      <Volume2 className={`h-4 w-4 ${isSpeaking ? "text-blue-600" : ""}`} />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className={`rounded-2xl px-4 py-3 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className={`p-4 border-t ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full p-2"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                className={`rounded-full p-2 ${isRecording ? "bg-red-100 dark:bg-red-900" : ""}`}
              >
                <Mic className={`h-4 w-4 ${isRecording ? "text-red-600" : ""}`} />
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className={`flex-1 rounded-full border-2 ${
                  isDarkMode
                    ? "bg-black border-gray-700 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-black placeholder-gray-500"
                }`}
                disabled={isTyping}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="sm"
                className={`rounded-full ${
                  isDarkMode ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
