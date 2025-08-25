"use client"

import { useState } from "react"
import { ChatInterface } from "@/components/chat/chat-interface"

export default function Page() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return <ChatInterface isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
}
