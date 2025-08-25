import React from "react"

export default function Loading() {
  return (
    <div style={{
      position: 'fixed', inset: 0 as any, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000', color: '#fff', zIndex: 9999
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <img
          src="https://automationalien.s3.us-east-1.amazonaws.com/VoiceLoopLogoBlack.png"
          alt="TeamLoop Logo"
          style={{ width: 160, height: 'auto', filter: 'drop-shadow(0 6px 24px rgba(255,255,255,0.15))' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#22d3ee', animation: 'splash-bounce 1.4s infinite ease-in-out' }} />
          <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#a78bfa', animation: 'splash-bounce 1.4s infinite ease-in-out', animationDelay: '0.15s' as any }} />
          <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#f472b6', animation: 'splash-bounce 1.4s infinite ease-in-out', animationDelay: '0.3s' as any }} />
        </div>
      </div>
      <style>{`
        @keyframes splash-bounce { 0%, 80%, 100% { transform: scale(0) } 40% { transform: scale(1) } }
      `}</style>
    </div>
  )
}
