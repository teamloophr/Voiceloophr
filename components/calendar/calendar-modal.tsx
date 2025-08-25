"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CalendarView } from "@/components/calendar/calendar-view"
import { InterviewScheduler } from "@/components/calendar/interview-scheduler"

interface CalendarModalProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode?: boolean
}

export function CalendarModal({ isOpen, onClose, isDarkMode }: CalendarModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modal = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 2147483647,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 16px',
          background: isDarkMode ? '#000000' : '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          left: pos.x,
          top: pos.y,
          border: '2px solid rgba(0,0,0,0.2)',
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 2147483647,
          pointerEvents: 'auto'
        }}
        ref={containerRef}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 32px',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            cursor: 'move'
          }}
          onMouseDown={(e) => {
            setDragging(true)
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return
            dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
            const onMove = (ev: MouseEvent) => {
              if (!dragging) return
              setPos({ x: ev.clientX - dragOffset.current.x, y: ev.clientY - dragOffset.current.y })
            }
            const onUp = () => {
              setDragging(false)
              window.removeEventListener('mousemove', onMove)
              window.removeEventListener('mouseup', onUp)
            }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
          }}
        >
          <h3 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: isDarkMode ? '#e5e7eb' : '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            📅 Calendar
            <button
              onClick={() => {
                const textToRead = `Calendar view. ${document.querySelector('.calendar-content')?.textContent || 'No events scheduled.'}`
                if ('speechSynthesis' in window) {
                  const utterance = new SpeechSynthesisUtterance(textToRead)
                  utterance.rate = 1.0
                  utterance.pitch = 1.0
                  utterance.volume = 1.0
                  speechSynthesis.speak(utterance)
                }
              }}
              style={{
                padding: '8px',
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.1)',
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                cursor: 'pointer',
                fontSize: '16px',
                color: isDarkMode ? '#e5e7eb' : '#6b7280',
                transition: 'all 0.2s ease',
                width: '36px',
                height: '36px',
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
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '16px 20px',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.1)',
              background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              color: isDarkMode ? '#e5e7eb' : '#6b7280',
              transition: 'all 0.2s ease',
              minWidth: '80px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)'
            }}
            aria-label="Close"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div 
          className="calendar-content"
          style={{ 
            padding: '24px', 
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          <CalendarView isDarkMode={isDarkMode} />
          <InterviewScheduler isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modal, document.body)
  }
  return modal
}

export default CalendarModal


