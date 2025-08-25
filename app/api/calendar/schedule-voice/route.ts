import { type NextRequest, NextResponse } from "next/server"
import { parseVoiceSchedulingRequest, calendarManager } from "@/lib/calendar-utils"

export async function POST(request: NextRequest) {
  try {
    const { voiceInput, userId } = await request.json()

    if (!voiceInput) {
      return NextResponse.json({ error: "Voice input is required" }, { status: 400 })
    }

    console.log("[v0] Processing voice scheduling request:", voiceInput)

    // Parse the voice input
    const schedulingRequest = parseVoiceSchedulingRequest(voiceInput)

    if (!schedulingRequest) {
      return NextResponse.json(
        {
          error: "Could not understand the scheduling request. Please try rephrasing.",
          suggestion:
            "Try saying something like: 'Schedule an interview with john@example.com tomorrow at 2 PM for 1 hour'",
        },
        { status: 400 },
      )
    }

    // Find available time slots
    const now = new Date()
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 2 weeks ahead

    const availableSlots = calendarManager.findAvailableSlots(schedulingRequest.duration, now, endDate)

    if (availableSlots.length === 0) {
      return NextResponse.json(
        {
          error: "No available time slots found for the requested duration",
          suggestion: "Try a different time or shorter duration",
        },
        { status: 400 },
      )
    }

    // Use the first available slot or a preferred time if specified
    const selectedTime =
      schedulingRequest.preferredTimes.find((time) =>
        availableSlots.some((slot) => Math.abs(slot.getTime() - time.getTime()) < 60 * 60 * 1000),
      ) || availableSlots[0]

    const endTime = new Date(selectedTime)
    endTime.setMinutes(endTime.getMinutes() + schedulingRequest.duration)

    // Create the event
    const newEvent = calendarManager.createEvent({
      title: schedulingRequest.title,
      description: schedulingRequest.description,
      startTime: selectedTime,
      endTime,
      attendees: schedulingRequest.attendeeEmails,
      location: schedulingRequest.location,
      type: schedulingRequest.type,
      createdViaVoice: true,
      status: "scheduled",
    })

    return NextResponse.json({
      success: true,
      event: newEvent,
      message: `Successfully scheduled ${schedulingRequest.title} for ${selectedTime.toLocaleString()}`,
      availableSlots: availableSlots.slice(0, 5).map((slot) => ({
        time: slot.toISOString(),
        formatted: slot.toLocaleString(),
      })),
    })
  } catch (error) {
    console.error("[v0] Voice scheduling API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
