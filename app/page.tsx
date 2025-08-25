"use client"

import { useState } from "react"
import { ChatInterface } from "@/components/chat/chat-interface"
import { WaveAnimation } from "@/components/ui/wave-animation-background"

export default function Page() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <WaveAnimation
          waveSpeed={2}
          waveIntensity={30}
          particleColor={isDarkMode ? "#ffffff" : "#000000"}
          pointSize={8.0}
          gridDistance={3}
          className="w-full h-full"
        />
      </div>

      <div className={`absolute inset-0 z-10 ${isDarkMode ? "bg-black/10" : "bg-white/10"} backdrop-blur-[0.5px]`} />

      <div className="relative z-20 w-full h-full">
        <ChatInterface isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
      </div>
    </div>
  )
}
