"use client"

import React, { useState, useEffect } from "react"
import { X, Save, Eye, EyeOff, Key, Database, Bot, Globe, Shield, User, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode: boolean
  onSettingsSaved?: () => void
}

interface APISettings {
  openaiApiKey: string
  supabaseUrl: string
  supabaseAnonKey: string
  elevenLabsApiKey: string
}

export function SettingsPanel({ isOpen, onClose, isDarkMode, onSettingsSaved }: SettingsPanelProps) {
  const { user, getUserSettings, saveUserSettings, isGuest } = useAuth()
  const [settings, setSettings] = useState<APISettings>({
    openaiApiKey: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
    elevenLabsApiKey: ""
  })
  
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [showSupabaseKey, setShowSupabaseKey] = useState(false)
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  // Modern UI tokens (true black/white, thin lines)
  const ui = {
    bg: isDarkMode ? "#000000" : "#ffffff",
    text: isDarkMode ? "#e5e7eb" : "#000000",
    subText: isDarkMode ? "rgba(229,231,235,0.7)" : "rgba(15,23,42,0.7)",
    glassBg: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
    glassBorder: isDarkMode ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.12)",
    inputBg: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.03)",
    line: isDarkMode ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.12)",
    accent: isDarkMode ? "#22d3ee" : "#0ea5e9"
  }

  // Load settings from database or local storage when panel opens
  useEffect(() => {
    if (isOpen) {
      loadUserSettings()
    }
  }, [isOpen, user, isGuest])

  const loadUserSettings = async () => {
    setIsLoading(true)
    try {
      const userSettings = await getUserSettings()
      if (userSettings) {
        setSettings({
          openaiApiKey: userSettings.openai_api_key || "",
          supabaseUrl: userSettings.supabase_url || "",
          supabaseAnonKey: userSettings.supabase_anon_key || "",
          elevenLabsApiKey: userSettings.elevenlabs_api_key || ""
        })
      }
    } catch (error) {
      console.error("Failed to load user settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    const effectiveGuest = isGuest || !user

    setIsSaving(true)
    setSaveStatus("idle")

    try {
      // For guests, allow saving just the OpenAI key
      if (effectiveGuest) {
        if (!settings.openaiApiKey) {
          throw new Error("OpenAI API key is required")
        }
      } else {
        // For authenticated users, require all fields
        if (!settings.openaiApiKey || !settings.supabaseUrl || !settings.supabaseAnonKey) {
          throw new Error("All required fields must be filled")
        }
      }

      // Save to database/localStorage
      let error: any = null
      if (effectiveGuest) {
        // Always allow local save when no user signed in
        localStorage.setItem('voiceloophr-guest-settings', JSON.stringify({
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      } else {
        const result = await saveUserSettings(settings)
        error = result.error
      }
      
      if (error) {
        throw new Error(error)
      }

      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
      
      // Notify parent component that settings were saved
      if (onSettingsSaved) {
        onSettingsSaved()
      }
      
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof APISettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const validateOpenAIKey = (key: string) => {
    return key.startsWith("sk-") && key.length > 20
  }

  const validateSupabaseUrl = (url: string) => {
    return url.includes("supabase.co") && url.startsWith("https://")
  }

  const validateSupabaseKey = (key: string) => {
    return key.length > 50 && key.includes(".")
  }

  const validateElevenLabsKey = (key: string) => {
    // ElevenLabs API keys are typically 32+ characters and may contain letters, numbers, and hyphens
    return key.length >= 32 && /^[a-zA-Z0-9-]+$/.test(key)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0 as any,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(6px)'
    }}>
      <div className={`${isDarkMode ? "dark" : ""} no-scrollbar`} style={{
        position: 'relative',
        width: '100%',
        maxWidth: 960,
        margin: '0 16px',
        maxHeight: '90vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRadius: 16,
        boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
        background: ui.bg,
        color: ui.text,
        border: `1px solid ${ui.line}`
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 20,
          borderBottom: `1px solid ${ui.line}`
        }}>
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6" style={{ color: ui.accent }} />
            <h2 className="text-xl font-semibold" style={{ letterSpacing: -0.3 }}>Settings</h2>
            {user && (
              <Badge variant="outline" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                {isGuest ? "Guest User" : user.email}
              </Badge>
            )}
            {isGuest && (
              <Badge variant="secondary" className="text-xs bg-yellow-600">
                🎭 Guest Mode
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full p-2"
            style={{ border: `1px solid ${ui.line}`, background: ui.glassBg }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="no-scrollbar" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowX: 'hidden' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading settings...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Guest Notice */}
              {isGuest && (
                <div className="p-4 rounded-lg" style={{ background: ui.glassBg, border: `1px solid ${ui.glassBorder}`, padding: 16 }}>
                  <div className="flex items-start space-x-2">
                    <div className="text-lg" style={{ color: ui.accent }}>ℹ️</div>
                    <div>
                      <h4 className="font-medium" style={{ color: ui.text }}>Guest Mode</h4>
                      <p className="text-sm mt-1" style={{ color: ui.subText }}>
                        You're using VoiceLoopHR as a guest. You can save your OpenAI API key to start using AI features immediately. 
                        Your settings are stored locally in your browser and will be cleared when you exit guest mode.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Start Guide for Guests */}
              {isGuest && (
                <div className="p-4 rounded-lg" style={{ background: ui.glassBg, border: `1px solid ${ui.glassBorder}`, padding: 16 }}>
                  <div className="flex items-start space-x-2">
                    <div className="text-lg" style={{ color: ui.accent }}>🚀</div>
                    <div>
                      <h4 className="font-medium">Quick Start for Guests</h4>
                      <p className="text-sm mt-1" style={{ color: ui.subText }}>
                        <strong>Step 1:</strong> Add your OpenAI API key below to enable AI chat and document analysis<br/>
                        <strong>Step 2:</strong> (Optional) Add Supabase credentials for document storage and search<br/>
                        <strong>Step 3:</strong> Start chatting with your AI HR assistant!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* OpenAI Configuration */}
              <div className="p-4 rounded-lg" style={{ background: ui.glassBg, border: `1px solid ${ui.glassBorder}`, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div className="flex items-center" style={{ gap: 10 }}>
                    <Bot className="h-5 w-5" style={{ color: ui.accent }} />
                    <h3 className="text-lg font-medium" style={{ margin: 0 }}>OpenAI Configuration</h3>
                  </div>
                  <span className="text-xs" style={{ color: ui.subText, whiteSpace: 'nowrap' }}>Required</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <Label htmlFor="openai-key" className="text-sm font-medium" style={{ display: 'block', marginBottom: 6 }}>
                      API Key
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="openai-key"
                        type={showOpenAIKey ? "text" : "password"}
                        value={settings.openaiApiKey}
                        onChange={(e) => handleInputChange("openaiApiKey", e.target.value)}
                        placeholder="sk-..."
                        className={`pr-10 ${
                          settings.openaiApiKey && !validateOpenAIKey(settings.openaiApiKey)
                            ? "border-red-500"
                            : settings.openaiApiKey && validateOpenAIKey(settings.openaiApiKey)
                            ? "border-green-500"
                            : ""
                        }`}
                        style={{ background: ui.inputBg, borderColor: ui.line, color: ui.text, width: '100%', height: 44, padding: '10px 14px', paddingRight: 46, borderRadius: 10 }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute"
                        onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                        style={{ color: ui.text, right: 8, top: '50%', transform: 'translateY(-50%)', height: 28, width: 28, borderRadius: 14, background: ui.glassBg, border: `1px solid ${ui.line}` }}
                      >
                        {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {settings.openaiApiKey && !validateOpenAIKey(settings.openaiApiKey) && (
                      <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
                        Invalid OpenAI API key format. Should start with "sk-" and be at least 20 characters.
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: ui.subText }}>
                      Get your API key from{" "}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: ui.accent }}
                      >
                        OpenAI Platform
                      </a>
                      {isGuest && " - This is all you need to get started!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ElevenLabs Configuration */}
              <div className="p-4 rounded-lg" style={{ background: ui.glassBg, border: `1px solid ${ui.glassBorder}`, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div className="flex items-center" style={{ gap: 10 }}>
                    <Volume2 className="h-5 w-5" style={{ color: ui.accent }} />
                    <h3 className="text-lg font-medium" style={{ margin: 0 }}>ElevenLabs Voice Configuration</h3>
                  </div>
                  <span className="text-xs" style={{ color: ui.subText, whiteSpace: 'nowrap' }}>Optional</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <Label htmlFor="elevenlabs-key" className="text-sm font-medium" style={{ display: 'block', marginBottom: 6 }}>
                      API Key
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="elevenlabs-key"
                        type={showElevenLabsKey ? "text" : "password"}
                        value={settings.elevenLabsApiKey}
                        onChange={(e) => handleInputChange("elevenLabsApiKey", e.target.value)}
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className={`pr-10 ${
                          settings.elevenLabsApiKey && !validateElevenLabsKey(settings.elevenLabsApiKey)
                            ? "border-red-500"
                            : settings.elevenLabsApiKey && validateElevenLabsKey(settings.elevenLabsApiKey)
                            ? "border-green-500"
                            : ""
                        }`}
                        style={{ background: ui.inputBg, borderColor: ui.line, color: ui.text, width: '100%', height: 44, padding: '10px 14px', paddingRight: 46, borderRadius: 10 }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute"
                        onClick={() => setShowElevenLabsKey(!showElevenLabsKey)}
                        style={{ color: ui.text, right: 8, top: '50%', transform: 'translateY(-50%)', height: 28, width: 28, borderRadius: 14, background: ui.glassBg, border: `1px solid ${ui.line}` }}
                      >
                        {showElevenLabsKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {settings.elevenLabsApiKey && !validateElevenLabsKey(settings.elevenLabsApiKey) && (
                      <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
                        Invalid ElevenLabs API key format. Should be at least 32 characters and contain only letters, numbers, and hyphens.
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: ui.subText }}>
                      Get your API key from{" "}
                      <a
                        href="https://elevenlabs.io/app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: ui.accent }}
                      >
                        ElevenLabs Platform
                      </a>
                      . This enables custom voice options for text-to-speech.
                    </p>
                  </div>
                </div>
              </div>

              {/* Supabase Configuration — removed in UI. Credentials are read from environment variables. */}

              {/* Visual Settings */}
              <div className="p-4 rounded-lg" style={{ background: ui.glassBg, border: `1px solid ${ui.glassBorder}`, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div className="flex items-center" style={{ gap: 10 }}>
                    <span className="h-5 w-5 rounded-full" style={{ background: 'conic-gradient(red, orange, yellow, green, cyan, blue, violet, red)', display: 'inline-block' }} />
                    <h3 className="text-lg font-medium" style={{ margin: 0 }}>Visual Settings</h3>
                  </div>
                  <span className="text-xs" style={{ color: ui.subText, whiteSpace: 'nowrap' }}>Wave color</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <Label className="text-sm font-medium" style={{ display: 'block', marginBottom: 6 }}>Dot Color (Hue)</Label>
                    <input
                      id="viz-hue"
                      type="range"
                      min={0}
                      max={360}
                      step={1}
                      defaultValue={(() => { try { return JSON.parse(localStorage.getItem('voiceloophr-visual') || '{}').hue ?? 50 } catch { return 50 } })()}
                      onChange={(e) => {
                        try {
                          const visual = JSON.parse(localStorage.getItem('voiceloophr-visual') || '{}')
                          visual.hue = Number(e.target.value)
                          localStorage.setItem('voiceloophr-visual', JSON.stringify(visual))
                          window.dispatchEvent(new Event('voiceloophr-visual-updated'))
                        } catch {}
                      }}
                      style={{ width: '100%', height: 6, background: 'linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet, red)', borderRadius: 12, outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="p-4 rounded-lg" style={{ background: ui.glassBg, border: `1px solid ${ui.glassBorder}`, padding: 16 }}>
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: ui.accent }} />
                  <div>
                    <h4 className="font-medium">Security Notice</h4>
                    <p className="text-sm mt-1" style={{ color: ui.subText }}>
                      {isGuest 
                        ? "As a guest, your API keys are stored locally in your browser and will be cleared when you exit. Keep them secure and don't share them with others."
                        : "Your API keys are stored securely in your account and are encrypted. Keep them secure and don't share them with others."
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Status */}
              {saveStatus !== "idle" && (
                <div className="p-3 rounded-md" style={{
                  background: saveStatus === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: saveStatus === 'success' ? '#22c55e' : '#ef4444',
                  border: `1px solid ${saveStatus === 'success' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`
                }}>
                  {saveStatus === 'success' ? '✅ Settings saved successfully!' : '❌ Failed to save settings. Please check your API keys and try again.'}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-center space-x-4 p-5`} style={{ borderTop: `1px solid ${ui.line}`, paddingTop: 16, paddingBottom: 28, paddingLeft: 20, paddingRight: 20 }}>
          <Button variant="outline" onClick={onClose} style={{ background: ui.glassBg, borderColor: ui.line, color: ui.text, borderRadius: 9999, paddingLeft: 20, paddingRight: 20 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={
              isSaving || 
              isLoading || 
              !settings.openaiApiKey
            }
            className="min-w-[120px]"
            style={{ background: ui.accent, color: '#000', border: 'none', borderRadius: 9999, paddingLeft: 28, paddingRight: 28 }}
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>{isGuest ? "Save OpenAI Key" : "Save Settings"}</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
