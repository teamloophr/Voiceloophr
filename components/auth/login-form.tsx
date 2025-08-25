"use client"

import React, { useState } from "react"
import { Mail, Lock, Eye, EyeOff, Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"

interface LoginFormProps {
  onSwitchToSignUp: () => void
  isDarkMode: boolean
}

export function LoginForm({ onSwitchToSignUp, isDarkMode }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGuestLoading, setIsGuestLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signIn, signInAsGuest } = useAuth()

  // Debug: Log when component renders
  console.log('LoginForm rendering, isDarkMode:', isDarkMode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        setError(error.message || "Failed to sign in")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestSignIn = async () => {
    setIsGuestLoading(true)
    setError(null)

    try {
      await signInAsGuest()
    } catch (err) {
      setError("Failed to sign in as guest")
    } finally {
      setIsGuestLoading(false)
    }
  }

  return (
    <Card className={`p-6 w-full max-w-md ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
        <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          Sign in to your VoiceLoopHR account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <div className="relative mt-1">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="pl-10"
              disabled={isLoading}
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="pl-10 pr-10"
              disabled={isLoading}
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !email || !password}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing In...</span>
            </div>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Guest Sign In */}
      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className={`px-2 ${isDarkMode ? "bg-gray-800 text-gray-400" : "bg-white text-gray-500"}`}>
              Or continue with
            </span>
          </div>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="w-full mt-4"
          onClick={handleGuestSignIn}
          disabled={isGuestLoading}
        >
          {isGuestLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing In...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Continue as Guest</span>
            </div>
          )}
        </Button>
      </div>

      <div className="mt-6 text-center">
        <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </Card>
  )
}
