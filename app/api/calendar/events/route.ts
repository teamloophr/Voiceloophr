import { type NextRequest, NextResponse } from "next/server"
import { calendarManager } from "@/lib/calendar-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    const events = calendarManager.getEvents(start, end)

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error("[v0] Calendar events API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json()

    // Validate required fields
    if (!eventData.title || !eventData.startTime || !eventData.endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Convert date strings to Date objects
    const newEvent = calendarManager.createEvent({
      ...eventData,
      startTime: new Date(eventData.startTime),
      endTime: new Date(eventData.endTime),
      attendees: eventData.attendees || [],
      createdViaVoice: eventData.createdViaVoice || false,
      status: eventData.status || "scheduled",
    })

    return NextResponse.json({
      success: true,
      event: newEvent,
    })
  } catch (error) {
    console.error("[v0] Create event API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
