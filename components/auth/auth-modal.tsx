"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/auth/login-form"
import { SignUpForm } from "@/components/auth/signup-form"

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
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
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
          maxWidth: '400px',
          margin: '0 16px',
          background: isDarkMode ? '#1f2937' : '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          left: pos.x,
          top: pos.y,
          border: '2px solid rgba(0,0,0,0.2)',
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
            padding: '16px',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
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
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: isDarkMode ? '#e5e7eb' : '#111827'
          }}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
            <button
              onClick={() => {
                const authText = `${mode === 'signin' ? 'Sign in' : 'Create account'} form. ${mode === 'signin' ? 'Enter your email and password to sign in to VoiceLoopHR.' : 'Enter your details to create a new VoiceLoopHR account.'}`
                if ('speechSynthesis' in window) {
                  const utterance = new SpeechSynthesisUtterance(authText)
                  utterance.rate = 1.0
                  utterance.pitch = 1.0
                  utterance.volume = 1.0
                  speechSynthesis.speak(utterance)
                }
              }}
              style={{
                padding: '6px',
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.1)',
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                cursor: 'pointer',
                fontSize: '12px',
                color: isDarkMode ? '#e5e7eb' : '#6b7280',
                transition: 'all 0.2s ease',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)'
              }}
              title="Read form aloud"
              aria-label="Read form aloud"
            >
              🔊
            </button>
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'rgba(0,0,0,0.04)',
              cursor: 'pointer',
              fontSize: '14px',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <img 
              src={isDarkMode ? 
                "https://automationalien.s3.us-east-1.amazonaws.com/VoiceLoopLogoBlack.png" : 
                "https://automationalien.s3.us-east-1.amazonaws.com/teamloop_logo_2.png"
              } 
              alt="VoiceLoopHR" 
              style={{ height: '48px' }}
            />
          </div>

          {/* Guest Sign-in Option - Prominent for Development */}
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            background: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
            border: `2px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`,
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <h4 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              color: isDarkMode ? '#22c55e' : '#16a34a'
            }}>
              🎭 Development Mode
            </h4>
            <p style={{
              fontSize: '14px',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              marginBottom: '16px'
            }}>
              Skip authentication and test the app immediately
            </p>
            <button 
              onClick={signInAsGuest}
              style={{
                padding: '14px 24px',
                background: isDarkMode ? '#22c55e' : '#16a34a',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDarkMode ? '#16a34a' : '#15803d'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDarkMode ? '#22c55e' : '#16a34a'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              🚀 Sign in as Guest
            </button>
          </div>

          {/* Regular Authentication Forms */}
          <div style={{ 
            textAlign: 'center',
            padding: '16px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: '8px',
            background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '500',
              marginBottom: '12px',
              color: isDarkMode ? '#e5e7eb' : '#111827'
            }}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="email" 
                placeholder="Email" 
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  background: isDarkMode ? '#374151' : '#ffffff',
                  color: isDarkMode ? '#e5e7eb' : '#111827',
                  fontSize: '14px'
                }}
              />
              <input 
                type="password" 
                placeholder="Password" 
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  background: isDarkMode ? '#374151' : '#ffffff',
                  color: isDarkMode ? '#e5e7eb' : '#111827',
                  fontSize: '14px'
                }}
              />
              <button style={{
                width: '100%',
                padding: '12px',
                background: '#2563eb',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                {mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                style={{
                  color: '#2563eb',
                  fontSize: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
              </button>
            </div>
          </div>

          {/* Original Forms - Commented out for testing */}
          {/*
          {mode === 'signin' ? (
            <LoginForm 
              isDarkMode={isDarkMode} 
              onSwitchToSignUp={() => setMode('signup')} 
            />
          ) : (
            <SignUpForm 
              isDarkMode={isDarkMode} 
              onSwitchToLogin={() => setMode('signin')} 
            />
          )}
          */}
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modal, document.body)
  }
  return modal
}

export default AuthModal


