
"use client"

import { useState, useEffect } from "react"
import { EnhancedChatInterface } from "@/components/chat/enhanced-chat-interface"
import { WaveAnimation } from "@/components/ui/wave-animation-background"
import { AuthProvider } from "@/contexts/auth-context"

export default function Page() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Set theme data attribute for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <AuthProvider>
      <div className="relative w-full h-screen overflow-hidden">
        {/* Background Wave Animation */}
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

        {/* Glass Overlay */}
        <div className={`absolute inset-0 z-10 ${isDarkMode ? "bg-black/10" : "bg-white/10"} backdrop-blur-[0.5px]`} />

        {/* Main Content */}
        <div className="relative z-20 w-full h-full">
          <EnhancedChatInterface isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
        </div>
      </div>
    </AuthProvider>
  )
}

// Prevent static generation
export const dynamic = 'force-dynamic'
