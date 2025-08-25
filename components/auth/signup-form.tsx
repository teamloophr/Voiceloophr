"use client"

import React, { useState } from "react"
import { Mail, Lock, Eye, EyeOff, Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"

interface SignUpFormProps {
  onSwitchToLogin: () => void
  isDarkMode: boolean
}

export function SignUpForm({ onSwitchToLogin, isDarkMode }: SignUpFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGuestLoading, setIsGuestLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const { signUp, signInAsGuest } = useAuth()

  // Debug: Log when component renders
  console.log('SignUpForm rendering, isDarkMode:', isDarkMode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await signUp(email, password)
      
      if (error) {
        setError(error.message || "Failed to create account")
      } else {
        setSuccess("Account created successfully! Please check your email to verify your account.")
        // Clear form
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setFullName("")
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
        <h2 className="text-2xl font-bold mb-2">Create Account</h2>
        <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          Join VoiceLoopHR to streamline your HR processes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}

        <div>
          <Label htmlFor="fullName" className="text-sm font-medium">
            Full Name
          </Label>
          <div className="relative mt-1">
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="pl-10"
              disabled={isLoading}
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

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
              placeholder="Create a password"
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
          <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password
          </Label>
          <div className="relative mt-1">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
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
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !email || !password || !confirmPassword || !fullName}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating Account...</span>
            </div>
          ) : (
            "Create Account"
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
              Or try without account
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
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </Card>
  )
}
