
"use client"

import { useState, useEffect } from "react"
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
      <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-black">
        {/* Simple Header */}
        <header className="relative z-20 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              VoiceLoop HR
            </h1>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg shadow-lg"
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-20 flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Welcome to VoiceLoop HR
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              AI-powered HR assistant with voice interaction
            </p>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <p className="text-gray-600 dark:text-gray-300">
                Chat interface temporarily disabled for debugging
              </p>
            </div>
          </div>
        </main>
      </div>
    </AuthProvider>
  )
}

// Prevent static generation
export const dynamic = 'force-dynamic'
