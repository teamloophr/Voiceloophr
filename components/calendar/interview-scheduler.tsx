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

export function InterviewScheduler() {
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
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Schedule Interview</span>
          </CardTitle>
          <CardDescription>Schedule interviews with candidates and manage appointments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Input Toggle */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-blue-900">Voice Scheduling</h4>
              <p className="text-xs text-blue-700">Use natural language to schedule interviews</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowVoiceInput(!showVoiceInput)}
              className="border-blue-600 text-blue-600"
            >
              <Mic className="h-4 w-4 mr-1" />
              Voice
            </Button>
          </div>

          {/* Voice Input */}
          {showVoiceInput && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="voiceInput">Voice Command</Label>
              <Textarea
                id="voiceInput"
                placeholder="Say something like: 'Schedule an interview with john@example.com tomorrow at 2 PM for 1 hour'"
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex space-x-2">
                <Button onClick={handleVoiceScheduling} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Parse Voice Command
                </Button>
                <Button onClick={() => setShowVoiceInput(false)} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Interview Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Technical Interview - Senior Developer"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Interview Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="candidateEmail">Candidate Email *</Label>
              <Input
                id="candidateEmail"
                type="email"
                placeholder="candidate@example.com"
                value={formData.candidateEmail}
                onChange={(e) => handleInputChange("candidateEmail", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewerEmails">Interviewer Emails</Label>
              <Input
                id="interviewerEmails"
                placeholder="interviewer1@company.com, interviewer2@company.com"
                value={formData.interviewerEmails}
                onChange={(e) => handleInputChange("interviewerEmails", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Conference Room A or Zoom link"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Interview details, agenda, or special instructions..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          {/* Available Slots */}
          {formData.date && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Available Time Slots</Label>
                <Button size="sm" variant="outline" onClick={findAvailableSlots}>
                  <Clock className="h-4 w-4 mr-1" />
                  Find Slots
                </Button>
              </div>
              {availableSlots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {availableSlots.slice(0, 6).map((slot, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => selectTimeSlot(slot)}
                      className="text-xs"
                    >
                      {slot.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}{" "}
                      {slot.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button onClick={handleScheduleInterview} disabled={isScheduling} className="bg-blue-600 hover:bg-blue-700">
              {isScheduling ? "Scheduling..." : "Schedule Interview"}
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reset Form
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
