"use client"

import { useState } from "react"
import { EnhancedChatInterface } from "@/components/chat/enhanced-chat-interface"
import { WaveAnimation } from "@/components/ui/wave-animation-background"
import { AuthProvider } from "@/contexts/auth-context"

export default function TestCandidateResourcesPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <AuthProvider>
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
          <EnhancedChatInterface isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
        </div>

        {/* Test Instructions */}
        <div className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-sm">
          <h3 className="font-bold text-lg mb-2">🧪 Test Instructions</h3>
          <p className="text-sm text-gray-700 mb-2">
            Look for the <strong>👥 Users icon</strong> in the navbar (between calendar and volume controls)
          </p>
          <p className="text-sm text-gray-700 mb-2">
            Click it to open the <strong>Candidate Resources Portal</strong>
          </p>
          <p className="text-sm text-gray-700">
            The modal should display recruitment tools and platforms
          </p>
        </div>
      </div>
    </AuthProvider>
  )
}
