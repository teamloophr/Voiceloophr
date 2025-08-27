"use client"

import React, { useEffect, useState } from "react"
import { User } from "lucide-react"

interface CandidateProfilePanelProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode: boolean
  userId?: string
}

type Candidate = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  metadata: any
}

export default function CandidateProfilePanel({ isOpen, onClose, isDarkMode, userId }: CandidateProfilePanelProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ full_name: string; email: string; phone: string }>({ full_name: '', email: '', phone: '' })
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [docsByCandidate, setDocsByCandidate] = useState<Record<string, any[]>>({})
  const [linkingFor, setLinkingFor] = useState<string | null>(null)
  const [userDocs, setUserDocs] = useState<any[]>([])

  const ui = {
    bg: isDarkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.15)',
    textPrimary: isDarkMode ? '#ffffff' : '#0f172a',
    textSecondary: isDarkMode ? '#9ca3af' : '#64748b',
    cardBg: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    cardBorder: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    accent: isDarkMode ? '#3b82f6' : '#2563eb',
    accentBg: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)'
  }

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !userId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/candidates?userId=${encodeURIComponent(userId)}`)
        const json = await res.json()
        if (res.ok) setCandidates(json.candidates || [])
      } catch (e) {
        console.error('[CandidateProfilePanel] load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isOpen, userId])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, padding: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: ui.bg,
          border: `1px solid ${ui.border}`,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 24px 0 24px',
          borderBottom: `1px solid ${ui.border}`,
          paddingBottom: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User size={24} color={ui.accent} />
            <h2 style={{ color: ui.textPrimary, fontSize: '24px', fontWeight: 700, margin: 0 }}>
              Candidate Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: ui.textSecondary,
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '0 24px 24px 24px', maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
          {loading && (
            <p style={{ color: ui.textSecondary }}>Loading...</p>
          )}

          {!loading && candidates.length === 0 && (
            <div style={{
              backgroundColor: ui.accentBg,
              border: `1px solid ${ui.accent}30`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{ color: ui.textPrimary, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                No candidates yet. Upload resumes or create candidates via API.
              </p>
            </div>
          )}

          {/* Candidate cards */}
          {!loading && candidates.map(c => (
            <div key={c.id} style={{
              backgroundColor: ui.cardBg,
              border: `1px solid ${ui.cardBorder}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  {editingId === c.id ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        placeholder="Full name"
                        style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${ui.border}`, background: 'transparent', color: ui.textPrimary }}
                      />
                      <input
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="Email"
                        style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${ui.border}`, background: 'transparent', color: ui.textPrimary }}
                      />
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="Phone"
                        style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${ui.border}`, background: 'transparent', color: ui.textPrimary }}
                      />
                    </div>
                  ) : (
                    <>
                      <div style={{ color: ui.textPrimary, fontWeight: 600, fontSize: 16 }}>
                        {c.full_name || 'Unnamed Candidate'}
                      </div>
                      <div style={{ color: ui.textSecondary, fontSize: 13 }}>{c.email}</div>
                      {c.phone && <div style={{ color: ui.textSecondary, fontSize: 13 }}>{c.phone}</div>}
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {editingId === c.id ? (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/candidates/${c.id}`, {
                              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ full_name: editForm.full_name, email: editForm.email, phone: editForm.phone })
                            })
                            if (res.ok) {
                              setCandidates(prev => prev.map(cc => cc.id === c.id ? { ...cc, full_name: editForm.full_name || null, email: editForm.email || cc.email, phone: editForm.phone || null } : cc))
                              setEditingId(null)
                            }
                          } catch (e) { console.error(e) }
                        }}
                        style={{ background: ui.accentBg, color: ui.accent, border: `1px solid ${ui.accent}30`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}
                        title="Save"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{ background: 'transparent', color: ui.textPrimary, border: `1px solid ${ui.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}
                        title="Cancel"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setEditingId(c.id); setEditForm({ full_name: c.full_name || '', email: c.email, phone: c.phone || '' }) }}
                      style={{ background: 'transparent', color: ui.textPrimary, border: `1px solid ${ui.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}
                      title="Edit Profile"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      const next = !expanded[c.id]
                      setExpanded(prev => ({ ...prev, [c.id]: next }))
                      if (next && !docsByCandidate[c.id]) {
                        try {
                          const res = await fetch(`/api/candidates/${c.id}/documents`)
                          const json = await res.json()
                          if (res.ok) setDocsByCandidate(prev => ({ ...prev, [c.id]: json.documents || [] }))
                        } catch (e) { console.error(e) }
                      }
                    }}
                    style={{ background: ui.accentBg, color: ui.accent, border: `1px solid ${ui.accent}30`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}
                    title="Toggle Documents"
                  >
                    {expanded[c.id] ? 'Hide Docs' : 'View Docs'}
                  </button>
                  <button
                    onClick={async () => {
                      setLinkingFor(c.id)
                      try {
                        const res = await fetch(`/api/documents/list?userId=${encodeURIComponent(userId || '')}`)
                        const json = await res.json()
                        if (res.ok) setUserDocs(json.documents || [])
                      } catch (e) { console.error(e) }
                    }}
                    style={{ background: 'transparent', color: ui.textPrimary, border: `1px solid ${ui.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}
                    title="Link Document"
                  >
                    Link Doc
                  </button>
                </div>
              </div>
              {expanded[c.id] && (
                <div style={{ marginTop: 12 }}>
                  {(docsByCandidate[c.id] || []).length === 0 ? (
                    <p style={{ color: ui.textSecondary, fontSize: 13 }}>No documents linked.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {(docsByCandidate[c.id] || []).map((d: any) => (
                        <div key={d.id} style={{ border: `1px solid ${ui.cardBorder}`, background: ui.cardBg, borderRadius: 8, padding: 10 }}>
                          <div style={{ color: ui.textPrimary, fontWeight: 600, fontSize: 14 }}>{d.title}</div>
                          {d.summary && <div style={{ color: ui.textSecondary, fontSize: 12, marginTop: 4 }}>{d.summary}</div>}
                          <div style={{ color: ui.textSecondary, fontSize: 12, marginTop: 6 }}>{d.file_type} • {(d.file_size || 0) / 1024 | 0} KB</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Link Document Overlay */}
          {linkingFor && (
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setLinkingFor(null)}
            >
              <div
                style={{ background: ui.bg, border: `1px solid ${ui.border}`, borderRadius: 12, width: '100%', maxWidth: 640, maxHeight: '70vh', overflow: 'auto', padding: 16 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ color: ui.textPrimary, fontWeight: 600 }}>Link a document</div>
                  <button onClick={() => setLinkingFor(null)} style={{ background: 'transparent', border: 'none', color: ui.textSecondary, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {userDocs.map(doc => (
                    <div key={doc.id} style={{ border: `1px solid ${ui.cardBorder}`, background: ui.cardBg, borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ color: ui.textPrimary, fontWeight: 600, fontSize: 14 }}>{doc.title}</div>
                        {doc.summary && <div style={{ color: ui.textSecondary, fontSize: 12, marginTop: 4 }}>{doc.summary}</div>}
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/candidates/associate', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ candidateId: linkingFor, documentId: doc.id })
                            })
                            if (res.ok) {
                              // refresh docs for candidate
                              const r = await fetch(`/api/candidates/${linkingFor}/documents`)
                              const j = await r.json()
                              if (r.ok) setDocsByCandidate(prev => ({ ...prev, [linkingFor]: j.documents || [] }))
                              setLinkingFor(null)
                            }
                          } catch (e) { console.error(e) }
                        }}
                        style={{ background: ui.accentBg, color: ui.accent, border: `1px solid ${ui.accent}30`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}
                      >
                        Link
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


