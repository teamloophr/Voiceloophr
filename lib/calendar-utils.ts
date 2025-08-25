// Calendar utilities for scheduling and event management

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  attendees: string[]
  location?: string
  type: "interview" | "meeting" | "reminder" | "other"
  createdViaVoice: boolean
  status: "scheduled" | "confirmed" | "cancelled" | "completed"
}

export interface SchedulingRequest {
  title: string
  description?: string
  duration: number // in minutes
  attendeeEmails: string[]
  preferredTimes: Date[]
  location?: string
  type: CalendarEvent["type"]
}

export class CalendarManager {
  private events: CalendarEvent[] = []

  constructor() {
    // Initialize with mock events
    this.events = this.generateMockEvents()
  }

  private generateMockEvents(): CalendarEvent[] {
    const now = new Date()
    return [
      {
        id: "1",
        title: "Interview with John Doe",
        description: "Technical interview for Senior Developer position",
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // +1 hour
        attendees: ["john.doe@example.com", "hr@company.com"],
        location: "Conference Room A",
        type: "interview",
        createdViaVoice: true,
        status: "scheduled",
      },
      {
        id: "2",
        title: "Team Standup",
        description: "Daily team synchronization meeting",
        startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // +30 minutes
        attendees: ["team@company.com"],
        type: "meeting",
        createdViaVoice: false,
        status: "scheduled",
      },
    ]
  }

  public getEvents(startDate?: Date, endDate?: Date): CalendarEvent[] {
    let filteredEvents = [...this.events]

    if (startDate) {
      filteredEvents = filteredEvents.filter((event) => event.startTime >= startDate)
    }

    if (endDate) {
      filteredEvents = filteredEvents.filter((event) => event.startTime <= endDate)
    }

    return filteredEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  public createEvent(eventData: Omit<CalendarEvent, "id">): CalendarEvent {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Date.now().toString(),
    }

    this.events.push(newEvent)
    console.log("[v0] Created calendar event:", newEvent.title)

    return newEvent
  }

  public updateEvent(eventId: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
    const eventIndex = this.events.findIndex((event) => event.id === eventId)

    if (eventIndex === -1) {
      return null
    }

    this.events[eventIndex] = { ...this.events[eventIndex], ...updates }
    console.log("[v0] Updated calendar event:", this.events[eventIndex].title)

    return this.events[eventIndex]
  }

  public deleteEvent(eventId: string): boolean {
    const eventIndex = this.events.findIndex((event) => event.id === eventId)

    if (eventIndex === -1) {
      return false
    }

    const deletedEvent = this.events.splice(eventIndex, 1)[0]
    console.log("[v0] Deleted calendar event:", deletedEvent.title)

    return true
  }

  public findAvailableSlots(
    duration: number,
    startDate: Date,
    endDate: Date,
    workingHours: { start: number; end: number } = { start: 9, end: 17 },
  ): Date[] {
    const availableSlots: Date[] = []
    const existingEvents = this.getEvents(startDate, endDate)

    // Generate potential time slots
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1)
        continue
      }

      // Check each hour within working hours
      for (let hour = workingHours.start; hour < workingHours.end; hour++) {
        const slotStart = new Date(currentDate)
        slotStart.setHours(hour, 0, 0, 0)

        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + duration)

        // Check if slot conflicts with existing events
        const hasConflict = existingEvents.some((event) => {
          return (
            (slotStart >= event.startTime && slotStart < event.endTime) ||
            (slotEnd > event.startTime && slotEnd <= event.endTime) ||
            (slotStart <= event.startTime && slotEnd >= event.endTime)
          )
        })

        if (!hasConflict && slotEnd.getHours() <= workingHours.end) {
          availableSlots.push(new Date(slotStart))
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return availableSlots.slice(0, 10) // Return first 10 available slots
  }
}

export const calendarManager = new CalendarManager()

export function parseVoiceSchedulingRequest(voiceInput: string): SchedulingRequest | null {
  const input = voiceInput.toLowerCase()

  // Extract basic information using simple pattern matching
  // In a real implementation, this would use more sophisticated NLP

  let title = "Meeting"
  let duration = 60 // default 1 hour
  let type: CalendarEvent["type"] = "meeting"

  // Detect interview
  if (input.includes("interview")) {
    title = "Interview"
    type = "interview"
  }

  // Extract duration
  const durationMatch = input.match(/(\d+)\s*(hour|minute|hr|min)/i)
  if (durationMatch) {
    const value = Number.parseInt(durationMatch[1])
    const unit = durationMatch[2].toLowerCase()
    duration = unit.startsWith("hour") || unit === "hr" ? value * 60 : value
  }

  // Extract emails (basic pattern)
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g
  const attendeeEmails = input.match(emailPattern) || []

  // Generate preferred times (mock implementation)
  const now = new Date()
  const preferredTimes = [
    new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
    new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
  ]

  return {
    title,
    duration,
    attendeeEmails,
    preferredTimes,
    type,
  }
}

export function formatEventTime(event: CalendarEvent): string {
  const start = event.startTime.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const end = event.endTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  return `${start} - ${end}`
}

export function getEventTypeColor(type: CalendarEvent["type"]): string {
  switch (type) {
    case "interview":
      return "bg-blue-100 text-blue-800"
    case "meeting":
      return "bg-green-100 text-green-800"
    case "reminder":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function getEventStatusColor(status: CalendarEvent["status"]): string {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800"
    case "scheduled":
      return "bg-blue-100 text-blue-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    case "completed":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
