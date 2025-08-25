"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react"
import {
  calendarManager,
  type CalendarEvent,
  formatEventTime,
  getEventTypeColor,
  getEventStatusColor,
} from "@/lib/calendar-utils"

export function CalendarView({ isDarkMode = false }: { isDarkMode?: boolean }) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [isCreating, setIsCreating] = useState(false)
  const [creatingTitle, setCreatingTitle] = useState("")
  const [creatingStart, setCreatingStart] = useState<string>("")
  const [creatingEnd, setCreatingEnd] = useState<string>("")
  const [creatingLocation, setCreatingLocation] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [currentDate, viewMode])

  const loadEvents = async () => {
    const startDate = getViewStartDate()
    const endDate = getViewEndDate()
    try {
      const params = new URLSearchParams()
      params.set("startDate", startDate.toISOString())
      params.set("endDate", endDate.toISOString())
      const res = await fetch(`/api/calendar/events?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load events')
      const json = await res.json()
      if (json?.events) {
        const normalized: CalendarEvent[] = (json.events as any[]).map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          startTime: new Date(e.startTime || e.start_time),
          endTime: new Date(e.endTime || e.end_time),
          attendees: Array.isArray(e.attendees) ? e.attendees : [],
          location: e.location,
          type: (e.type as any) || 'meeting',
          createdViaVoice: Boolean(e.createdViaVoice),
          status: (e.status as any) || 'scheduled'
        }))
        setEvents(normalized)
      } else {
        setEvents(calendarManager.getEvents(startDate, endDate))
      }
    } catch {
      // Fallback to in-memory
      setEvents(calendarManager.getEvents(startDate, endDate))
    }
  }

  const handleCreateEvent = async () => {
    if (!creatingTitle || !creatingStart || !creatingEnd) return
    setSaving(true)
    try {
      const payload = {
        title: creatingTitle,
        startTime: creatingStart,
        endTime: creatingEnd,
        location: creatingLocation || undefined,
      }
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to create event')
      // Optimistic: append
      if (json?.event) setEvents((prev) => [...prev, json.event])
      setIsCreating(false)
      setCreatingTitle("")
      setCreatingStart("")
      setCreatingEnd("")
      setCreatingLocation("")
    } catch {
      // Fallback to in-memory create
      const created = calendarManager.createEvent({
        title: creatingTitle,
        startTime: new Date(creatingStart),
        endTime: new Date(creatingEnd),
        attendees: [],
        location: creatingLocation || undefined,
        type: 'meeting',
        createdViaVoice: false,
        status: 'scheduled'
      })
      setEvents((prev) => [...prev, created])
      setIsCreating(false)
      setCreatingTitle("")
      setCreatingStart("")
      setCreatingEnd("")
      setCreatingLocation("")
    } finally {
      setSaving(false)
    }
  }

  const getViewStartDate = (): Date => {
    const date = new Date(currentDate)
    switch (viewMode) {
      case "day":
        date.setHours(0, 0, 0, 0)
        return date
      case "week":
        const dayOfWeek = date.getDay()
        date.setDate(date.getDate() - dayOfWeek)
        date.setHours(0, 0, 0, 0)
        return date
      case "month":
        date.setDate(1)
        date.setHours(0, 0, 0, 0)
        return date
    }
  }

  const getViewEndDate = (): Date => {
    const date = new Date(currentDate)
    switch (viewMode) {
      case "day":
        date.setHours(23, 59, 59, 999)
        return date
      case "week":
        const dayOfWeek = date.getDay()
        date.setDate(date.getDate() - dayOfWeek + 6)
        date.setHours(23, 59, 59, 999)
        return date
      case "month":
        date.setMonth(date.getMonth() + 1, 0)
        date.setHours(23, 59, 59, 999)
        return date
    }
  }

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    switch (viewMode) {
      case "day":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
        break
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
        break
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
        break
    }
    setCurrentDate(newDate)
  }

  const formatViewTitle = (): string => {
    switch (viewMode) {
      case "day":
        return currentDate.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })
      case "week":
        const startOfWeek = getViewStartDate()
        const endOfWeek = getViewEndDate()
        return `${startOfWeek.toLocaleDateString([], { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`
      case "month":
        return currentDate.toLocaleDateString([], { year: "numeric", month: "long" })
    }
  }

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const renderDayView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {events.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: isDarkMode ? '#9ca3af' : '#6b7280'
        }}>
          <p style={{ fontSize: '16px' }}>No events scheduled for today</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Click "New Event" to get started</p>
        </div>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            style={{
              background: isDarkMode ? '#111111' : '#f8fafc',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: isDarkMode ? '#e5e7eb' : '#111827'
                  }}>
                    {event.title}
                  </h3>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: getEventTypeColor(event.type).includes('bg-') ? '#2563eb' : 'transparent',
                    color: 'white',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}>
                    {event.type}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: getEventStatusColor(event.status).includes('bg-') ? '#059669' : 'transparent',
                    color: 'white',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}>
                    {event.status}
                  </span>
                  {event.createdViaVoice && (
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: 'transparent',
                      color: isDarkMode ? '#e5e7eb' : '#6b7280',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}>
                      🎤 Voice
                    </span>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '14px',
                  color: isDarkMode ? '#9ca3af' : '#6b7280'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🕐</span>
                    <span>{formatEventTime(event)}</span>
                  </div>
                  {event.location && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>📍</span>
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.attendees.length > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>👥</span>
                      <span>
                        {event.attendees.length} attendee{event.attendees.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
                {event.description && (
                  <p style={{
                    fontSize: '14px',
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    marginTop: '8px'
                  }}>
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderWeekView = () => {
    const startOfWeek = getViewStartDate()
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      return day
    })

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '16px'
      }}>
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <div key={index} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Day Header */}
              <div style={{
                textAlign: 'center',
                padding: '12px 8px',
                borderRadius: '8px',
                background: isToday ? '#2563eb' : (isDarkMode ? '#111111' : '#f3f4f6'),
                color: isToday ? 'white' : (isDarkMode ? '#e5e7eb' : '#6b7280'),
                border: isToday ? 'none' : '1px solid rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {day.toLocaleDateString([], { weekday: "short" })}
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  marginTop: '2px'
                }}>
                  {day.getDate()}
                </div>
              </div>
              
              {/* Events for this day */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minHeight: '100px'
              }}>
                {dayEvents.length === 0 ? (
                  <div style={{
                    padding: '8px',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: isDarkMode ? '#6b7280' : '#9ca3af',
                    fontStyle: 'italic'
                  }}>
                    No events
                  </div>
                ) : (
                  dayEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        padding: '8px',
                        background: isDarkMode ? '#111111' : '#eff6ff',
                        borderRadius: '6px',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        fontSize: '11px'
                      }}
                    >
                      <div style={{
                        fontWeight: '600',
                        color: isDarkMode ? '#e5e7eb' : '#1e40af',
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {event.title}
                      </div>
                      <div style={{
                        color: isDarkMode ? '#9ca3af' : '#3b82f6',
                        fontSize: '10px'
                      }}>
                        {event.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
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
              gap: '8px',
              marginBottom: '4px'
            }}>
              <span style={{
                fontSize: '20px',
                color: '#2563eb'
              }}>📅</span>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}>
                Calendar
              </h2>
              <button
                onClick={() => {
                  const calendarText = `Calendar view. ${viewMode} view. ${events.length > 0 ? `${events.length} events scheduled.` : 'No events scheduled.'}`
                  if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(calendarText)
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
                title="Read calendar aloud"
                aria-label="Read calendar aloud"
              >
                🔊
              </button>
            </div>
            <p style={{
              fontSize: '14px',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              {formatViewTitle()}
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '4px',
              borderRadius: '8px',
              background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
            }}>
              {(["day", "week", "month"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === mode ? '#2563eb' : 'transparent',
                    color: viewMode === mode ? 'white' : (isDarkMode ? '#e5e7eb' : '#6b7280'),
                    transition: 'all 0.2s ease'
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Navigation Buttons */}
            <button
              onClick={() => navigateDate("prev")}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(0,0,0,0.1)',
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                cursor: 'pointer',
                color: isDarkMode ? '#e5e7eb' : '#6b7280'
              }}
            >
              ←
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(0,0,0,0.1)',
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                cursor: 'pointer',
                color: isDarkMode ? '#e5e7eb' : '#6b7280'
              }}
            >
              Today
            </button>
            <button
              onClick={() => navigateDate("next")}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(0,0,0,0.1)',
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                cursor: 'pointer',
                color: isDarkMode ? '#e5e7eb' : '#6b7280'
              }}
            >
              →
            </button>
            
            {/* New Event Button */}
            <button
              onClick={() => setIsCreating(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#2563eb',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              + New Event
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ padding: '24px' }}>
        {viewMode === "day" && renderDayView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "month" && renderWeekView()} {/* Simplified month view */}
      </div>

      {isCreating && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2147483647,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => !saving && setIsCreating(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{
              width: '100%',
              maxWidth: '500px',
              margin: '0 16px',
              borderRadius: '16px',
              border: '2px solid rgba(0,0,0,0.2)',
              padding: '24px',
              background: isDarkMode ? '#374151' : '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '20px',
              color: isDarkMode ? '#e5e7eb' : '#111827'
            }}>
              ✨ Create New Event
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  background: isDarkMode ? '#4b5563' : '#ffffff',
                  color: isDarkMode ? '#e5e7eb' : '#111827',
                  fontSize: '14px'
                }}
                placeholder="Event Title" 
                value={creatingTitle} 
                onChange={(e) => setCreatingTitle(e.target.value)} 
              />
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <input 
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    background: isDarkMode ? '#4b5563' : '#ffffff',
                    color: isDarkMode ? '#e5e7eb' : '#111827',
                    fontSize: '14px'
                  }}
                  type="datetime-local" 
                  value={creatingStart} 
                  onChange={(e) => setCreatingStart(e.target.value)} 
                />
                <input 
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    background: isDarkMode ? '#4b5563' : '#ffffff',
                    color: isDarkMode ? '#e5e7eb' : '#111827',
                    fontSize: '14px'
                  }}
                  type="datetime-local" 
                  value={creatingEnd} 
                  onChange={(e) => setCreatingEnd(e.target.value)} 
                />
              </div>
              
              <input 
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  background: isDarkMode ? '#4b5563' : '#ffffff',
                  color: isDarkMode ? '#e5e7eb' : '#111827',
                  fontSize: '14px'
                }}
                placeholder="Location (optional)" 
                value={creatingLocation} 
                onChange={(e) => setCreatingLocation(e.target.value)} 
              />
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '8px'
              }}>
                <button
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.2)',
                    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                    color: isDarkMode ? '#e5e7eb' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onClick={() => setIsCreating(false)} 
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: (saving || !creatingTitle || !creatingStart || !creatingEnd) ? 0.6 : 1
                  }}
                  onClick={handleCreateEvent} 
                  disabled={saving || !creatingTitle || !creatingStart || !creatingEnd}
                >
                  {saving ? '⏳ Saving...' : '💾 Save Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
