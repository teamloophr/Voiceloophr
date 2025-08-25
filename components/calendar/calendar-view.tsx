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

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")

  useEffect(() => {
    loadEvents()
  }, [currentDate, viewMode])

  const loadEvents = () => {
    const startDate = getViewStartDate()
    const endDate = getViewEndDate()
    const loadedEvents = calendarManager.getEvents(startDate, endDate)
    setEvents(loadedEvents)
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

  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate)

    return (
      <div className="space-y-4">
        {dayEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No events scheduled for this day</p>
          </div>
        ) : (
          dayEvents.map((event) => (
            <Card key={event.id} className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-black">{event.title}</h3>
                      <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                      <Badge className={getEventStatusColor(event.status)}>{event.status}</Badge>
                      {event.createdViaVoice && <Badge variant="outline">Voice</Badge>}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatEventTime(event)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.attendees.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.attendees.length} attendee{event.attendees.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                    {event.description && <p className="text-sm text-gray-600 mt-2">{event.description}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = getViewStartDate()
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      return day
    })

    return (
      <div className="grid grid-cols-7 gap-4">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <div key={index} className="space-y-2">
              <div className={`text-center p-2 rounded ${isToday ? "bg-blue-100 text-blue-800" : "text-gray-600"}`}>
                <div className="text-xs font-medium">{day.toLocaleDateString([], { weekday: "short" })}</div>
                <div className="text-lg font-bold">{day.getDate()}</div>
              </div>
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <div key={event.id} className="p-2 bg-blue-50 rounded text-xs">
                    <div className="font-medium text-blue-800 truncate">{event.title}</div>
                    <div className="text-blue-600">
                      {event.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Calendar</span>
            </CardTitle>
            <CardDescription>{formatViewTitle()}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {(["day", "week", "month"] as const).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={viewMode === mode ? "default" : "ghost"}
                  onClick={() => setViewMode(mode)}
                  className="text-xs"
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "day" && renderDayView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "month" && renderWeekView()} {/* Simplified month view */}
      </CardContent>
    </Card>
  )
}
