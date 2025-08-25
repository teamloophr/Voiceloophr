"use client"

import React, { useState } from "react"
import { LoginForm } from "./login-form"
import { SignUpForm } from "./signup-form"
import { useAuth } from "@/contexts/auth-context"

interface AuthContainerProps {
  isDarkMode: boolean
}

export function AuthContainer({ isDarkMode }: AuthContainerProps) {
  const [isLogin, setIsLogin] = useState(true)
  const { user, loading } = useAuth()

  // If user is authenticated, don't show auth forms
  if (user) {
    return null
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className={`p-8 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4">
        {isLogin ? (
          <LoginForm 
            onSwitchToSignUp={() => setIsLogin(false)} 
            isDarkMode={isDarkMode} 
          />
        ) : (
          <SignUpForm 
            onSwitchToLogin={() => setIsLogin(true)} 
            isDarkMode={isDarkMode} 
          />
        )}
      </div>
    </div>
  )
}
