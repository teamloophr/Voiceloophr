'use client'

import { useState } from 'react'
import { EnhancedChatInterface } from '@/components/chat/enhanced-chat-interface'

export default function TestPDFCleaning() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4">
        <EnhancedChatInterface 
          isDarkMode={isDarkMode} 
          onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
        />
      </div>
    </div>
  )
}
