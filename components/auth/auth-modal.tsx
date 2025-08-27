"use client"

import React, { useState, useRef, useEffect } from "react"
import { X, Mail, Lock, Eye, EyeOff, User, LogIn, UserPlus, UserCheck } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode: boolean
}

export function AuthModal({ isOpen, onClose, isDarkMode }: AuthModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const { signIn, signUp, signInAsGuest } = useAuth()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Debug logging
  console.log('AuthModal rendering:', { isOpen, mode, isDarkMode })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Debug: Add a simple test to see if modal renders
  console.log('AuthModal should render now, isOpen:', isOpen)

  const modal = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDarkMode ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 2147483647,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 20px',
          background: isDarkMode ? '#000000' : '#ffffff',
          borderRadius: '20px',
          boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)' : '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          left: pos.x,
          top: pos.y,
          border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(15,23,42,0.08)',
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 2147483647,
          pointerEvents: 'auto'
        }}
        ref={containerRef}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 32px 20px 32px',
            borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.06)',
            cursor: 'move'
          }}
          onMouseDown={(e) => {
            setDragging(true)
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return
            dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
            const onMove = (ev: MouseEvent) => {
              if (!dragging) return
              setPos({ x: ev.clientX - dragOffset.current.x, y: ev.clientY - dragOffset.current.y })
            }
            const onUp = () => {
              setDragging(false)
              window.removeEventListener('mousemove', onMove)
              window.removeEventListener('mouseup', onUp)
            }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
          }}
        >
          {/* Logo and Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <img
              src={isDarkMode ? "https://automationalien.s3.us-east-1.amazonaws.com/VoiceLoopLogoBlack.png" : "https://automationalien.s3.us-east-1.amazonaws.com/teamloop_logo_2.png"}
              alt="VoiceLoop Logo"
              style={{ 
                height: '40px',
                width: 'auto',
                filter: isDarkMode ? 'invert(1)' : 'none'
              }}
            />
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: isDarkMode ? '#ffffff' : '#0f172a',
                margin: 0,
                letterSpacing: '-0.025em'
              }}>
                VoiceLoop
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.6)',
                margin: 0,
                fontWeight: 400
              }}>
                HR Assistant
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
              color: isDarkMode ? '#ffffff' : '#0f172a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {/* Mode Toggle */}
          <div style={{
            display: 'flex',
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => setMode("signin")}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: mode === "signin" ? (isDarkMode ? '#60a5fa' : '#3b82f6') : 'transparent',
                color: mode === "signin" ? '#ffffff' : (isDarkMode ? '#ffffff' : '#0f172a'),
                cursor: 'pointer',
                fontSize: '0.9375rem',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LogIn size={16} />
                Sign In
              </div>
            </button>
            <button
              onClick={() => setMode("signup")}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: mode === "signup" ? (isDarkMode ? '#60a5fa' : '#3b82f6') : 'transparent',
                color: mode === "signup" ? '#ffffff' : (isDarkMode ? '#ffffff' : '#0f172a'),
                cursor: 'pointer',
                fontSize: '0.9375rem',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <UserPlus size={16} />
                Sign Up
              </div>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={async (e) => {
            e.preventDefault()
            setIsLoading(true)
            setError(null)
            setSuccess(null)

            try {
              if (mode === "signin") {
                await signIn(email, password)
                setSuccess("Successfully signed in!")
                setTimeout(() => onClose(), 1000)
              } else {
                await signUp(email, password)
                setSuccess("Account created successfully!")
                setTimeout(() => onClose(), 1000)
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
              setIsLoading(false)
            }
          }}>
            {/* Email Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: isDarkMode ? '#ffffff' : '#0f172a',
                marginBottom: '8px'
              }}>
                Email
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Mail size={18} style={{
                  position: 'absolute',
                  left: '16px',
                  color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)'
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 48px',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)'}`,
                    borderRadius: '12px',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)',
                    color: isDarkMode ? '#ffffff' : '#0f172a',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: isDarkMode ? '#ffffff' : '#0f172a',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '16px',
                  color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)'
                }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 48px',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)'}`,
                    borderRadius: '12px',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)',
                    color: isDarkMode ? '#ffffff' : '#0f172a',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    background: 'transparent',
                    border: 'none',
                    color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '0.875rem',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                color: '#059669',
                fontSize: '0.875rem',
                marginBottom: '20px'
              }}>
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: isDarkMode ? '#60a5fa' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                transition: 'all 0.2s ease',
                marginBottom: '20px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = isDarkMode ? '#3b82f6' : '#2563eb'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = isDarkMode ? '#60a5fa' : '#3b82f6'
                }
              }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  {mode === "signin" ? "Signing In..." : "Creating Account..."}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {mode === "signin" ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {mode === "signin" ? "Sign In" : "Create Account"}
                </div>
              )}
            </button>

            {/* Guest Sign In */}
            <div style={{
              textAlign: 'center',
              padding: '20px 0',
              borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}`
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.6)',
                margin: '0 0 16px 0'
              }}>
                Or continue as a guest
              </p>
              <button
                type="button"
                onClick={async () => {
                  setIsLoading(true)
                  try {
                    await signInAsGuest()
                    setSuccess("Signed in as guest!")
                    setTimeout(() => onClose(), 1000)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to sign in as guest')
                  } finally {
                    setIsLoading(false)
                  }
                }}
                disabled={isLoading}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: isDarkMode ? '#60a5fa' : '#3b82f6',
                  border: `1px solid ${isDarkMode ? '#60a5fa' : '#3b82f6'}`,
                  borderRadius: '12px',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <UserCheck size={16} />
                Continue as Guest
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  return modal
}


