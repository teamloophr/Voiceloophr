import { NextRequest, NextResponse } from "next/server"
import { calendarManager } from "@/lib/calendar-utils"
import { createSupabaseServer } from "../supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    try {
      const supabase = createSupabaseServer()
      const { data: auth } = await supabase.auth.getUser()

      // If no signed-in user, fallback to in-memory events (guest mode)
      if (!auth?.user) {
        const start = startDate ? new Date(startDate) : undefined
        const end = endDate ? new Date(endDate) : undefined
        const events = calendarManager.getEvents(start, end)
        return NextResponse.json({ success: true, events })
      }

      const query = supabase
        .from("calendar_events")
        .select("id, title, description, start_time, end_time, location, attendees, status")
        .order("start_time")

      const { data, error } = await (
        startDate && endDate
          ? query.gte("start_time", startDate).lte("start_time", endDate)
          : query
      )

      if (error) throw new Error(error.message)

      const events = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || undefined,
        startTime: new Date(row.start_time),
        endTime: new Date(row.end_time),
        attendees: Array.isArray(row.attendees) ? row.attendees : [],
        location: row.location || undefined,
        type: "meeting",
        createdViaVoice: false,
        status: row.status || "scheduled",
      }))

      return NextResponse.json({ success: true, events })
    } catch (e: any) {
      console.warn("[v0] GET /calendar/events falling back to in-memory:", e?.message || e)
      const start = startDate ? new Date(startDate) : undefined
      const end = endDate ? new Date(endDate) : undefined
      const fallback = calendarManager.getEvents(start, end)
      return NextResponse.json({ success: true, events: fallback })
    }
  } catch (error) {
    console.error("[v0] Calendar events API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, startTime, endTime, attendees = [], location, status = "scheduled", description } = body || {}

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    try {
      const supabase = createSupabaseServer()
      const { data: auth } = await supabase.auth.getUser()

      // Guest: in-memory create
      if (!auth?.user) {
        const newEvent = calendarManager.createEvent({
          title,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          attendees,
          location,
          type: "meeting",
          createdViaVoice: Boolean(body?.createdViaVoice),
          status,
        })
        return NextResponse.json({ success: true, event: newEvent })
      }

      // Signed-in: persist to Supabase (RLS applies)
      const payload = {
        user_id: auth.user.id,
        title,
        description: description || null,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        attendees,
        location: location || null,
        status,
      }

      const { data, error } = await supabase
        .from("calendar_events")
        .insert(payload)
        .select("id, title, description, start_time, end_time, location, attendees, status")
        .single()

      if (error) throw new Error(error.message)

      const created = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        startTime: new Date(data.start_time),
        endTime: new Date(data.end_time),
        attendees: Array.isArray(data.attendees) ? data.attendees : [],
        location: data.location || undefined,
        type: "meeting",
        createdViaVoice: Boolean(body?.createdViaVoice),
        status: data.status || "scheduled",
      }

      return NextResponse.json({ success: true, event: created })
    } catch (e: any) {
      console.warn("[v0] POST /calendar/events falling back to in-memory:", e?.message || e)
      const fallbackCreated = calendarManager.createEvent({
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        attendees,
        location,
        type: "meeting",
        createdViaVoice: Boolean(body?.createdViaVoice),
        status,
      })
      return NextResponse.json({ success: true, event: fallbackCreated })
    }
  } catch (error) {
    console.error("[v0] Create event API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
