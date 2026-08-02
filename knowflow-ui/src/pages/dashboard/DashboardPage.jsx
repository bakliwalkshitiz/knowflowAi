import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, MessageSquare, Brain, TrendingUp,
  Upload, ArrowRight, Clock, Shield, Plus,
  BookOpen, HelpCircle, Mic, Share2, Layers,
  ChevronRight, Sparkles, Activity, HardDrive, Zap,
  CheckCircle2, AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { documentApi, chatApi } from '../../api/client'

const MODE_BADGES = {
  SUMMARY:       { label: 'Summary',       color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)', border: 'rgba(96, 165, 250, 0.3)' },
  SYSTEM_DESIGN: { label: 'System Design', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.3)' },
  FLASHCARD:     { label: 'Flashcard',     color: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.3)' },
  QUIZ:          { label: 'Quiz',          color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.3)' },
  INTERVIEW:     { label: 'Interview',     color: '#fb7185', bg: 'rgba(251, 113, 133, 0.12)', border: 'rgba(251, 113, 133, 0.3)' },
  MINDMAP:       { label: 'Mind Map',      color: '#facc15', bg: 'rgba(250, 204, 21, 0.12)', border: 'rgba(250, 204, 21, 0.3)' },
  CHAT:          { label: 'General Chat',  color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
}

export function getEffectivePromptType(item) {
  if (item?.promptType && item.promptType !== 'CHAT') {
    return item.promptType
  }
  const text = ((item?.prompt || item?.content || '') + ' ' + (item?.response || '')).toLowerCase()
  if (text.includes('mermaid') || text.includes('classdiagram') || text.includes('sequencediagram') || text.includes('erdiagram') || text.includes('system design') || text.includes('lld') || text.includes('hld')) {
    return 'SYSTEM_DESIGN'
  }
  if (text.includes('summar') || text.includes('key takeaway')) {
    return 'SUMMARY'
  }
  if (text.includes('quiz') || text.includes('mcq') || text.includes('multiple choice')) {
    return 'QUIZ'
  }
  if (text.includes('flashcard')) {
    return 'FLASHCARD'
  }
  if (text.includes('interview')) {
    return 'INTERVIEW'
  }
  if (text.includes('mind map') || text.includes('mindmap')) {
    return 'MINDMAP'
  }
  return item?.promptType || 'CHAT'
}

export function parseIsoDate(s) {
  if (!s) return new Date()
  let str = String(s).trim()
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str) && !str.endsWith('Z') && !str.includes('+') && !str.slice(10).includes('-')) {
    str += 'Z'
  }
  const d = new Date(str)
  return isNaN(d.getTime()) ? new Date() : d
}

/* ────────────────── STAT CARD COMPONENT ────────────────── */
function MetricCard({ icon: Icon, label, value, subtext, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '16px 18px', display: 'flex',
        alignItems: 'center', gap: 14, transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-bd)'; e.currentTarget.style.background = 'var(--card-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)' }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} style={{ color: color?.icon || 'var(--text)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px' }}>
          {label}
        </p>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
            {value ?? 0}
          </span>
          {subtext && (
            <span style={{ fontSize: 11, color: 'var(--subtle)' }}>
              {subtext}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ────────────────── MODE COUNTER ITEM ────────────────── */
function ModeUsageItem({ icon: Icon, label, count, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border-sub)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-bd)'; e.currentTarget.style.background = 'var(--card-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-sub)'; e.currentTarget.style.background = 'var(--surface)' }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} style={{ color: 'var(--text)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'var(--muted)', margin: '1px 0 0' }}>{count} Executions</p>
      </div>
      <ChevronRight size={14} style={{ color: 'var(--subtle)' }} />
    </div>
  )
}

/* ────────────────── MAIN DASHBOARD ────────────────── */
export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentDocs, setRecentDocs] = useState([])
  const [chatHistory, setChatHistory] = useState([])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    Promise.all([
      documentApi.stats().catch(() => null),
      documentApi.getAll().catch(() => null),
      chatApi.history().catch(() => null),
    ]).then(([sr, dr, hr]) => {
      if (sr?.data) setStats(sr.data)
      if (dr?.data) setRecentDocs(dr.data)
      if (hr?.data) setChatHistory(hr.data)
    })
  }, [])

  const formatDate = (s) => {
    if (!s) return 'Recently'
    const d = parseIsoDate(s)
    const now = new Date()
    const diff = now - d
    if (diff < 0 || diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  // 100% REAL COMPUTED METRICS FROM LIVE DB DATA
  const docCount = stats?.totalDocuments ?? recentDocs.length
  const chunkCount = stats?.totalChunks ?? recentDocs.reduce((acc, d) => acc + (d.chunkCount || 0), 0)
  const totalChats = chatHistory.length
  const totalMB = stats?.totalFileSize ? (stats.totalFileSize / 1024 / 1024).toFixed(2) : (recentDocs.reduce((acc, d) => acc + (d.fileSize || 0), 0) / 1024 / 1024).toFixed(2)

  // Calculate real mode execution counts using getEffectivePromptType
  const summaryCount       = chatHistory.filter(h => getEffectivePromptType(h) === 'SUMMARY').length
  const systemDesignCount  = chatHistory.filter(h => getEffectivePromptType(h) === 'SYSTEM_DESIGN').length
  const flashcardCount     = chatHistory.filter(h => getEffectivePromptType(h) === 'FLASHCARD').length
  const quizCount          = chatHistory.filter(h => getEffectivePromptType(h) === 'QUIZ').length
  const interviewCount     = chatHistory.filter(h => getEffectivePromptType(h) === 'INTERVIEW').length
  const mindmapCount       = chatHistory.filter(h => getEffectivePromptType(h) === 'MINDMAP').length
  const generalChatCount   = chatHistory.filter(h => getEffectivePromptType(h) === 'CHAT').length

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1150, margin: '0 auto' }}>

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {greeting}, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            Live performance analytics and interaction history for your Knowledge Hub.
          </p>
        </div>

        <button
          onClick={() => navigate('/documents')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 10, border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <Upload size={14} /> Upload Document
        </button>
      </motion.div>

      {/* ── CORE STATS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <MetricCard icon={FileText}       label="Documents Vault"  value={docCount}   subtext="files uploaded" delay={0} />
        <MetricCard icon={Layers}         label="Vector Chunks"    value={chunkCount} subtext="indexed in PGVector" delay={0.05} />
        <MetricCard icon={MessageSquare}  label="AI Interactions" value={totalChats} subtext="total prompts" delay={0.10} />
        <MetricCard icon={HardDrive}      label="Storage Used"     value={`${totalMB} MB`} subtext="of vault capacity" delay={0.15} />
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* LEFT COLUMN: Real Activity Timeline & Recent Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Real Activity Timeline */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Interaction History</h3>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0' }}>Real-time log of prompts and AI responses</p>
              </div>
              <button onClick={() => navigate('/history')} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                View Full History →
              </button>
            </div>

            {chatHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                <Activity size={32} style={{ color: 'var(--border)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, margin: '0 0 6px' }}>No interaction history yet</p>
                <button onClick={() => navigate('/chat')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Start a new chat →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chatHistory.slice(0, 7).map((item, i) => {
                  const pType = getEffectivePromptType(item)
                  const badge = MODE_BADGES[pType] || MODE_BADGES.CHAT

                  return (
                    <div
                      key={i}
                      onClick={() => navigate(`/chat?session=${item.conversationId}&highlight=${encodeURIComponent(item.prompt.slice(0, 20))}`)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px',
                        borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border-sub)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-bd)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-sub)'}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <Zap size={13} style={{ color: badge.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3, gap: 8 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {item.prompt}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                              color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
                            }}>
                              {badge.label}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--subtle)' }}>
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.response?.slice(0, 95)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Vault Documents */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Vault Documents</h3>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0' }}>Your uploaded study materials</p>
              </div>
              <button onClick={() => navigate('/documents')} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Manage Vault →
              </button>
            </div>

            {recentDocs.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--subtle)', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                No documents uploaded yet.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {recentDocs.slice(0, 6).map(doc => {
                  const ext = doc.fileName?.split('.').pop()?.toUpperCase() || 'FILE'
                  return (
                    <div
                      key={doc.id}
                      onClick={() => navigate('/chat')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border-sub)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-bd)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-sub)'}
                    >
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 6px', borderRadius: 4, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                        {ext}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.fileName}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--subtle)', margin: '1px 0 0' }}>
                          {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Real AI Mode Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Real AI Mode Usage Breakdown */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>AI Mode Breakdown</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 16px' }}>Computed from your actual interaction history</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ModeUsageItem icon={FileText}      label="Summaries"        count={summaryCount}     onClick={() => navigate('/history?mode=SUMMARY')} />
              <ModeUsageItem icon={Layers}        label="System Design"    count={systemDesignCount} onClick={() => navigate('/history?mode=SYSTEM_DESIGN')} />
              <ModeUsageItem icon={BookOpen}      label="Flashcards"       count={flashcardCount}   onClick={() => navigate('/history?mode=FLASHCARD')} />
              <ModeUsageItem icon={HelpCircle}    label="Quizzes"          count={quizCount}        onClick={() => navigate('/history?mode=QUIZ')} />
              <ModeUsageItem icon={Mic}           label="Interview Prep"   count={interviewCount}   onClick={() => navigate('/history?mode=INTERVIEW')} />
              <ModeUsageItem icon={Brain}         label="Mind Maps"        count={mindmapCount}     onClick={() => navigate('/history?mode=MINDMAP')} />
              <ModeUsageItem icon={MessageSquare} label="General Chat"     count={generalChatCount} onClick={() => navigate('/history?mode=CHAT')} />
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 14px' }}>Quick Start</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => navigate('/chat')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px', borderRadius: 10, border: 'none', background: 'var(--accent)',
                  color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <MessageSquare size={14} /> Open Chat Workspace
              </button>

              <button
                onClick={() => navigate('/documents')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}
              >
                <Upload size={14} /> Manage Document Vault
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
