"use client"

import type React from "react"
import type { User, AuthState } from "@/lib/types"

import { createContext, useContext, useReducer, useEffect } from "react"

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_ERROR"; payload: string | null }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_USER":
      return { ...state, user: action.payload, loading: false, error: null }
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }
    default:
      return state
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // TODO: Check for existing session when Supabase is connected
    console.log("[v0] Checking for existing auth session")
    dispatch({ type: "SET_LOADING", payload: false })
  }, [])

  const signIn = async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      // TODO: Implement Supabase sign in
      console.log("[v0] Sign in:", { email })

      // Mock user for now
      const mockUser: User = {
        id: "mock-user-id",
        email,
        full_name: "Mock User",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      dispatch({ type: "SET_USER", payload: mockUser })
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to sign in" })
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      // TODO: Implement Supabase sign up
      console.log("[v0] Sign up:", { email, fullName })

      // Mock user for now
      const mockUser: User = {
        id: "mock-user-id",
        email,
        full_name: fullName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      dispatch({ type: "SET_USER", payload: mockUser })
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to create account" })
    }
  }

  const signOut = async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      // TODO: Implement Supabase sign out
      console.log("[v0] Sign out")
      dispatch({ type: "SET_USER", payload: null })
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to sign out" })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
