"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Mic } from "lucide-react"
import { calendarManager, parseVoiceSchedulingRequest, type CalendarEvent } from "@/lib/calendar-utils"

export function InterviewScheduler({ isDarkMode = false }: { isDarkMode?: boolean }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    candidateEmail: "",
    interviewerEmails: "",
    date: "",
    time: "",
    duration: "60",
    location: "",
    type: "interview" as CalendarEvent["type"],
  })
  const [availableSlots, setAvailableSlots] = useState<Date[]>([])
  const [isScheduling, setIsScheduling] = useState(false)
  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const [voiceInput, setVoiceInput] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const findAvailableSlots = () => {
    if (!formData.date || !formData.duration) return

    const startDate = new Date(formData.date)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7) // Look ahead 7 days

    const slots = calendarManager.findAvailableSlots(Number.parseInt(formData.duration), startDate, endDate)
    setAvailableSlots(slots)
  }

  const handleScheduleInterview = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      alert("Please fill in all required fields")
      return
    }

    setIsScheduling(true)

    try {
      const startTime = new Date(`${formData.date}T${formData.time}`)
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + Number.parseInt(formData.duration))

      const attendees = [
        formData.candidateEmail,
        ...formData.interviewerEmails.split(",").map((email) => email.trim()),
      ].filter(Boolean)

      const newEvent = calendarManager.createEvent({
        title: formData.title,
        description: formData.description,
        startTime,
        endTime,
        attendees,
        location: formData.location,
        type: formData.type,
        createdViaVoice: false,
        status: "scheduled",
      })

      console.log("[v0] Interview scheduled:", newEvent)

      // Reset form
      setFormData({
        title: "",
        description: "",
        candidateEmail: "",
        interviewerEmails: "",
        date: "",
        time: "",
        duration: "60",
        location: "",
        type: "interview",
      })

      alert("Interview scheduled successfully!")
    } catch (error) {
      console.error("[v0] Scheduling error:", error)
      alert("Failed to schedule interview. Please try again.")
    } finally {
      setIsScheduling(false)
    }
  }

  const handleVoiceScheduling = () => {
    if (!voiceInput.trim()) return

    const request = parseVoiceSchedulingRequest(voiceInput)
    if (request) {
      setFormData((prev) => ({
        ...prev,
        title: request.title,
        duration: request.duration.toString(),
        candidateEmail: request.attendeeEmails[0] || "",
        interviewerEmails: request.attendeeEmails.slice(1).join(", "),
        type: request.type,
      }))

      setShowVoiceInput(false)
      setVoiceInput("")
    }
  }

  const selectTimeSlot = (slot: Date) => {
    const date = slot.toISOString().split("T")[0]
    const time = slot.toTimeString().slice(0, 5)

    setFormData((prev) => ({
      ...prev,
      date,
      time,
    }))
  }

  return (
    <div style={{
      background: isDarkMode ? '#000000' : '#ffffff',
      border: '1px solid rgba(0,0,0,0.1)',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        background: isDarkMode ? '#111111' : '#f9fafb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '24px',
                color: '#2563eb'
              }}>📅</span>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}>
                Schedule Interview
              </h2>
              <button
                onClick={() => {
                  const formText = `Interview Scheduler. ${formData.title ? `Title: ${formData.title}. ` : ''}${formData.candidateEmail ? `Candidate: ${formData.candidateEmail}. ` : ''}${formData.date ? `Date: ${formData.date}. ` : ''}${formData.time ? `Time: ${formData.time}. ` : ''}${formData.duration ? `Duration: ${formData.duration} minutes. ` : ''}${formData.location ? `Location: ${formData.location}. ` : ''}${formData.description ? `Description: ${formData.description}.` : ''}`
                  if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(formText)
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
                  fontSize: '14px',
                  color: isDarkMode ? '#e5e7eb' : '#6b7280',
                  transition: 'all 0.2s ease',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
            </div>
            <p style={{
              fontSize: '14px',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              Schedule interviews with candidates and manage appointments
            </p>
          </div>
          
          {/* Voice Scheduling Button */}
          <button
            onClick={() => setShowVoiceInput(!showVoiceInput)}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.1)',
              background: isDarkMode ? '#1a1a1a' : '#f3f4f6',
              color: isDarkMode ? '#ffffff' : '#111827',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🎤 Voice
          </button>
        </div>
      </div>

      {/* Voice Input Section */}
      {showVoiceInput && (
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          background: isDarkMode ? '#0a0a0a' : '#f8fafc'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '12px',
            color: isDarkMode ? '#ffffff' : '#111827'
          }}>
            Voice Scheduling
          </h3>
          <p style={{
            fontSize: '14px',
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            marginBottom: '16px'
          }}>
            Use natural language to schedule interviews
          </p>
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <input
              type="text"
              placeholder="e.g., 'Schedule a technical interview with John for tomorrow at 2 PM'"
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid rgba(0,0,0,0.2)',
                borderRadius: '8px',
                background: isDarkMode ? '#1a1a1a' : '#ffffff',
                color: isDarkMode ? '#ffffff' : '#111827',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleVoiceScheduling}
              style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#2563eb',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Process
            </button>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div style={{ padding: '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Interview Title */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}>
                Interview Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Technical Interview - Senior Developer"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  background: isDarkMode ? '#1a1a1a' : '#ffffff',
                  color: isDarkMode ? '#ffffff' : '#111827',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Interview Type */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}>
                Interview Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  background: isDarkMode ? '#1a1a1a' : '#ffffff',
                  color: isDarkMode ? '#ffffff' : '#111827',
                  fontSize: '14px'
                }}
              >
                <option value="interview">Interview</option>
                <option value="meeting">Meeting</option>
                <option value="call">Call</option>
              </select>
            </div>

            {/* Candidate Email */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}>
                Candidate Email *
              </label>
              <input
                type="email"
                placeholder="candidate@example.com"
                value={formData.candidateEmail}
                onChange={(e) => handleInputChange("candidateEmail", e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  background: isDarkMode ? '#1a1a1a' : '#ffffff',
                  color: isDarkMode ? '#ffffff' : '#111827',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Interviewer Emails */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}>
                Interviewer Emails
              </label>
              <input
                type="text"
                placeholder="interviewer1@company.com, interviewer2@company.com"
                value={formData.interviewerEmails}
                onChange={(e) => handleInputChange("interviewerEmails", e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  background: isDarkMode ? '#1a1a1a' : '#ffffff',
                  color: isDarkMode ? '#ffffff' : '#111827',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Date and Time Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    background: isDarkMode ? '#1a1a1a' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#111827',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}>
                  Time *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    background: isDarkMode ? '#1a1a1a' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#111827',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Duration and Location Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}>
                  Duration (minutes)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    background: isDarkMode ? '#1a1a1a' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#111827',
                    fontSize: '14px'
                  }}
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}>
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Conference Room A or Zoom link"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    background: isDarkMode ? '#1a1a1a' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#111827',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}>
                Description
              </label>
              <textarea
                placeholder="Interview details, agenda, or special instructions..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  background: isDarkMode ? '#1a1a1a' : '#ffffff',
                  color: isDarkMode ? '#ffffff' : '#111827',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => {
              setFormData({
                title: "",
                description: "",
                candidateEmail: "",
                interviewerEmails: "",
                date: "",
                time: "",
                duration: "60",
                location: "",
                type: "interview",
              })
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.2)',
              background: isDarkMode ? '#1a1a1a' : '#f3f4f6',
              color: isDarkMode ? '#ffffff' : '#6b7280',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Reset Form
          </button>
          <button
            onClick={handleScheduleInterview}
            disabled={isScheduling || !formData.title || !formData.date || !formData.time}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: (isScheduling || !formData.title || !formData.date || !formData.time) ? 0.6 : 1
            }}
          >
            {isScheduling ? '⏳ Scheduling...' : '📅 Schedule Interview'}
          </button>
        </div>
      </div>
    </div>
  )
}
