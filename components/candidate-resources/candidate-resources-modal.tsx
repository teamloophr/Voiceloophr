"use client"

import React from "react"
import { X, ExternalLink, Users, Database, Search, Zap } from "lucide-react"

interface CandidateResourcesModalProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode: boolean
}

export default function CandidateResourcesModal({ isOpen, onClose, isDarkMode }: CandidateResourcesModalProps) {
  if (!isOpen) return null

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

  const openSourceATS = [
    {
      name: "OpenCATS",
      description: "A well-established, free, and open-source ATS. It helps manage the full recruitment cycle, including candidate details, resumes, and job orders. It's designed by the recruiting community.",
      idealFor: "Recruiters and HR professionals who want a customizable, full-featured system to manage their recruitment process.",
      features: ["Full recruitment cycle management", "Resume parsing", "Job order tracking", "Candidate database"],
      category: "ATS",
      url: "https://opencats.org"
    },
    {
      name: "Odoo Recruitment",
      description: "Part of the larger Odoo open-source ERP system, it integrates recruitment with other business applications. You can create a job board, track applications, and build a database of skills and profiles.",
      idealFor: "Businesses that want an integrated ERP and recruitment solution.",
      features: ["ERP integration", "Job board creation", "Application tracking", "Skills database"],
      category: "ERP",
      url: "https://www.odoo.com/app/recruitment"
    },
    {
      name: "CandidATS",
      description: "A free and open-source ATS focused on security, with features like field-level security and access control. It includes modules for managing candidates, job orders, and more.",
      idealFor: "Recruitment agencies and businesses that prioritize a secure ATS.",
      features: ["Field-level security", "Access control", "Candidate management", "Job order management"],
      category: "Security",
      url: "https://candidats.org"
    },
    {
      name: "EazyRecruit",
      description: "An AI-enabled open-source recruitment software designed to streamline screening and hiring. It features resume parsing, applicant tracking, and interview scheduling.",
      idealFor: "Companies of all sizes, from SMEs to large corporations, looking for an AI-powered hiring tool.",
      features: ["AI-powered screening", "Resume parsing", "Interview scheduling", "Applicant tracking"],
      category: "AI",
      url: "https://eazyrecruit.com"
    }
  ]

  const freemiumPlatforms = [
    {
      name: "Zoho Recruit",
      description: "Offers a free plan with basic candidate management, email management, and interview scheduling. It can be used to publish jobs, parse resumes, and create a careers page for your company.",
      noteworthy: "A comprehensive talent acquisition platform with both ATS and CRM functionalities.",
      features: ["Candidate management", "Email management", "Interview scheduling", "Job publishing"],
      category: "CRM",
      url: "https://www.zoho.com/recruit/"
    },
    {
      name: "SmartRecruiters",
      description: "The free \"SmartStart\" plan is available for companies with up to 250 employees and allows for up to 10 active job postings. It includes features like a branded career website and one-click job posting to over 200 job boards.",
      noteworthy: "A popular choice for startups, used by major companies like Visa and LinkedIn.",
      features: ["Branded career website", "Multi-board posting", "Up to 10 job postings", "250 employee limit"],
      category: "Enterprise",
      url: "https://www.smartrecruiters.com/"
    },
    {
      name: "Dover",
      description: "A free ATS that is designed for startups and in-house recruiting teams. It offers an all-in-one platform with sourcing, scheduling, and AI-powered applicant sorting.",
      noteworthy: "Simplifies the entire hiring process from application to offer by automating and centralizing key tasks.",
      features: ["Sourcing tools", "Interview scheduling", "AI applicant sorting", "All-in-one platform"],
      category: "Startup",
      url: "https://www.dover.com/"
    }
  ]

  const sourcingPlatforms = [
    {
      name: "Loxo",
      description: "Offers a \"Talent Intelligence Platform\" with a large database of publicly available candidate information from across the open web.",
      features: ["Talent intelligence", "Public candidate data", "Web sourcing"],
      category: "Intelligence",
      url: "https://www.loxo.co/"
    },
    {
      name: "HireEZ (formerly Hiretual)",
      description: "An AI-powered platform that sources candidates from over 45 online platforms, including LinkedIn and GitHub.",
      features: ["45+ platform sourcing", "AI-powered search", "LinkedIn integration", "GitHub integration"],
      category: "AI",
      url: "https://www.hireez.com/"
    },
    {
      name: "GitHub",
      description: "An essential platform for sourcing tech talent, allowing you to assess candidates based on their coding skills and open-source contributions.",
      features: ["Code assessment", "Open-source contributions", "Developer profiles", "Tech talent focus"],
      category: "Tech",
      url: "https://github.com/"
    },
    {
      name: "Indeed Resume",
      description: "Provides access to a massive database of over 200 million resumes.",
      features: ["200M+ resumes", "Resume search", "Candidate database", "Job board integration"],
      category: "Database",
      url: "https://www.indeed.com/hire/resume"
    }
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ATS": return <Database size={16} />
      case "ERP": return <Zap size={16} />
      case "Security": return <Users size={16} />
      case "AI": return <Search size={16} />
      case "CRM": return <Users size={16} />
      case "Enterprise": return <Database size={16} />
      case "Startup": return <Zap size={16} />
      case "Intelligence": return <Search size={16} />
      case "Tech": return <Database size={16} />
      case "Database": return <Database size={16} />
      default: return <Users size={16} />
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      "ATS": "#3b82f6",
      "ERP": "#10b981",
      "Security": "#f59e0b",
      "AI": "#8b5cf6",
      "CRM": "#06b6d4",
      "Enterprise": "#ef4444",
      "Startup": "#84cc16",
      "Intelligence": "#f97316",
      "Tech": "#6366f1",
      "Database": "#14b8a6"
    }
    return colors[category as keyof typeof colors] || "#6b7280"
  }

  const renderPlatformCard = (platform: { name: string; description: string; idealFor?: string; noteworthy?: string; features: string[]; category: string; url?: string }) => (
    <div
      key={platform.name}
      style={{
        backgroundColor: ui.cardBg,
        border: `1px solid ${ui.cardBorder}`,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ 
            color: ui.textPrimary, 
            fontSize: '18px', 
            fontWeight: '600', 
            margin: 0 
          }}>
            {platform.name}
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: getCategoryColor(platform.category) + '20',
            color: getCategoryColor(platform.category),
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {getCategoryIcon(platform.category)}
            {platform.category}
          </div>
        </div>
        {platform.url ? (
          <a
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = ui.accentBg
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            title={`Visit ${platform.name}`}
          >
            <ExternalLink size={16} color={ui.accent} />
          </a>
        ) : (
          <ExternalLink size={16} color={ui.textSecondary} />
        )}
      </div>
      
      <p style={{ 
        color: ui.textSecondary, 
        fontSize: '14px', 
        lineHeight: '1.5', 
        margin: '0 0 12px 0' 
      }}>
        {platform.description}
      </p>
      
      {platform.idealFor && (
        <div style={{ marginBottom: '12px' }}>
          <strong style={{ color: ui.textPrimary, fontSize: '13px' }}>Ideal For: </strong>
          <span style={{ color: ui.textSecondary, fontSize: '13px' }}>{platform.idealFor}</span>
        </div>
      )}
      
      {platform.noteworthy && (
        <div style={{ marginBottom: '12px' }}>
          <strong style={{ color: ui.textPrimary, fontSize: '13px' }}>Noteworthy: </strong>
          <span style={{ color: ui.textSecondary, fontSize: '13px' }}>{platform.noteworthy}</span>
        </div>
      )}
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {platform.features.map((feature: string, index: number) => (
          <span
            key={index}
            style={{
              backgroundColor: ui.accentBg,
              color: ui.accent,
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
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
            <Users size={24} color={ui.accent} />
            <h2 style={{ 
              color: ui.textPrimary, 
              fontSize: '24px', 
              fontWeight: '700', 
              margin: 0 
            }}>
              Candidate Resources Portal
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
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '0 24px 24px 24px',
          maxHeight: 'calc(90vh - 120px)',
          overflowY: 'auto'
        }}>
          {/* Introduction */}
          <div style={{
            backgroundColor: ui.accentBg,
            border: `1px solid ${ui.accent}30`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{ 
              color: ui.textPrimary, 
              fontSize: '14px', 
              lineHeight: '1.6', 
              margin: 0 
            }}>
              For your HR startup, voiceloophr.com, leveraging open-source platforms can be a strategic way to build a robust candidate and recruiter database. Here are some of the biggest open-source options available, categorized for your convenience.
            </p>
          </div>

          {/* Open-Source ATS Section */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              color: ui.textPrimary, 
              fontSize: '20px', 
              fontWeight: '600', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Database size={20} color={ui.accent} />
              Open-Source Applicant Tracking Systems (ATS)
            </h3>
            <p style={{ 
              color: ui.textSecondary, 
              fontSize: '14px', 
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              These platforms are comprehensive solutions for managing the entire recruitment lifecycle, from posting jobs to hiring candidates. They are designed to be customized and can form the backbone of your candidate database.
            </p>
            {openSourceATS.map(platform => renderPlatformCard(platform))}
          </section>

          {/* Freemium Platforms Section */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              color: ui.textPrimary, 
              fontSize: '20px', 
              fontWeight: '600', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Zap size={20} color={ui.accent} />
              Free and Freemium Recruiting Software
            </h3>
            <p style={{ 
              color: ui.textSecondary, 
              fontSize: '14px', 
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              While not entirely open-source, these platforms offer free tiers that provide significant value, especially for startups. They can be a great starting point for building your database.
            </p>
            {freemiumPlatforms.map(platform => renderPlatformCard(platform))}
          </section>

          {/* Sourcing Platforms Section */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              color: ui.textPrimary, 
              fontSize: '20px', 
              fontWeight: '600', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Search size={20} color={ui.accent} />
              Candidate Sourcing Platforms
            </h3>
            <p style={{ 
              color: ui.textSecondary, 
              fontSize: '14px', 
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              These platforms are not open-source databases themselves, but they provide access to vast pools of candidate data from various online sources. They are essential tools for populating your own database.
            </p>
            {sourcingPlatforms.map(platform => renderPlatformCard(platform))}
          </section>

          {/* Recommendation */}
          <div style={{
            backgroundColor: ui.cardBg,
            border: `1px solid ${ui.cardBorder}`,
            borderRadius: '12px',
            padding: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            <h4 style={{ 
              color: ui.textPrimary, 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💡 Recommendation for Your Startup
            </h4>
            <p style={{ 
              color: ui.textSecondary, 
              fontSize: '14px', 
              lineHeight: '1.6', 
              margin: 0 
            }}>
              For your startup, a combination of an open-source ATS like <strong>OpenCATS</strong> to manage your core database and processes, supplemented with free sourcing tools and platforms like <strong>Indeed</strong> and <strong>GitHub</strong>, could be a powerful and cost-effective strategy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
