'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AuthProvider } from '@/contexts/auth-context'

// Dynamic import to prevent build-time issues
const EnhancedChatInterface = dynamic(() => import('@/components/chat/enhanced-chat-interface').then(mod => ({ default: mod.EnhancedChatInterface })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
})

export default function TestPDFCleaning() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <EnhancedChatInterface 
            isDarkMode={isDarkMode} 
            onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
          />
        </div>
      </div>
    </AuthProvider>
  )
}

// Prevent static generation
export const dynamic = 'force-dynamic'
