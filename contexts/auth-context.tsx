"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isGuest: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signInAsGuest: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  getUserSettings: () => Promise<any>
  saveUserSettings: (settings: any) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (!error) {
        setIsGuest(false)
      }
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (!error) {
        setIsGuest(false)
      }
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signInAsGuest = async () => {
    try {
      // Create a mock guest user
      const guestUser = {
        id: 'guest-' + Date.now(),
        email: 'guest@voiceloophr.local',
        user_metadata: { full_name: 'Guest User' },
        app_metadata: { provider: 'guest' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'guest'
      } as User

      setUser(guestUser)
      setIsGuest(true)
      setSession({ user: guestUser, access_token: 'guest-token', refresh_token: 'guest-token', expires_in: 3600, token_type: 'bearer' } as Session)
    } catch (error) {
      console.error('Error signing in as guest:', error)
    }
  }

  const signOut = async () => {
    try {
      if (isGuest) {
        // Clear guest session
        setUser(null)
        setSession(null)
        setIsGuest(false)
        // Clear guest settings from localStorage
        localStorage.removeItem('voiceloophr-guest-settings')
      } else {
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const getUserSettings = async () => {
    if (isGuest) {
      // For guests, get settings from localStorage
      const guestSettings = localStorage.getItem('voiceloophr-guest-settings')
      return guestSettings ? JSON.parse(guestSettings) : null
    }
    
    if (!user) return null
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching user settings:", error)
      return null
    }
  }

  const saveUserSettings = async (settings: any) => {
    if (isGuest) {
      // For guests, save to localStorage
      localStorage.setItem('voiceloophr-guest-settings', JSON.stringify({
        ...settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      return { error: null }
    }
    
    if (!user) return { error: "User not authenticated" }
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          openai_api_key: settings.openaiApiKey,
          supabase_url: settings.supabaseUrl,
          supabase_anon_key: settings.supabaseAnonKey,
          elevenlabs_api_key: settings.elevenLabsApiKey,
          updated_at: new Date().toISOString()
        })
      
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    session,
    loading,
    isGuest,
    signIn,
    signUp,
    signInAsGuest,
    signOut,
    resetPassword,
    getUserSettings,
    saveUserSettings,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
