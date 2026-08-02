import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Clock, MessageSquare, ChevronRight, Search, Plus,
  ArrowLeft, MessageCircle, User, Bot, Filter, Tag
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { chatApi } from '../../api/client'

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

export default function HistoryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const modeFilterParam = searchParams.get('mode') || searchParams.get('type')

  const [backendHistory, setBackendHistory] = useState([])
  const [searchSession, setSearchSession] = useState('')
  const [searchPrompt, setSearchPrompt] = useState('')
  const [selectedMode, setSelectedMode] = useState(modeFilterParam || 'ALL')
  const [loading, setLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState(null)

  useEffect(() => {
    chatApi.history()
      .then(res => {
        const data = res?.data
        setBackendHistory(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (modeFilterParam) {
      setSelectedMode(modeFilterParam)
    }
  }, [modeFilterParam])

  // Read local chat sessions
  const localSessions = (() => {
    try {
      const stored = localStorage.getItem('kf_sessions')
      const parsed = stored ? JSON.parse(stored) : []
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  })()

  const safeBackendHistory = Array.isArray(backendHistory) ? backendHistory : []

  // Build sessions map
  const sessionMap = new Map()

  // 1. Populate from localSessions
  localSessions.forEach(s => {
    if (s && s.id) {
      sessionMap.set(s.id, {
        id: s.id,
        title: s.name || 'Chat Session',
        messages: Array.isArray(s.messages) ? s.messages : [],
        lastAt: s.createdAt || new Date().toISOString(),
      })
    }
  })

  // 2. Merge backend history items into matching sessions and attach promptType
  safeBackendHistory.forEach(item => {
    if (!item) return
    const convId = item.conversationId || 'default'
    const itemMode = getEffectivePromptType(item)

    if (sessionMap.has(convId)) {
      const sess = sessionMap.get(convId)
      let matched = false
      sess.messages.forEach(m => {
        if (m.content === item.prompt || m.content === item.response) {
          m.promptType = itemMode
          matched = true
        }
      })
      if (!matched) {
        if (item.prompt) sess.messages.push({ role: 'user', content: item.prompt, time: item.createdAt, promptType: itemMode })
        if (item.response) sess.messages.push({ role: 'ai', content: item.response, time: item.createdAt, promptType: itemMode })
      }
      if (item.createdAt && new Date(parseIsoDate(item.createdAt)) > new Date(parseIsoDate(sess.lastAt))) {
        sess.lastAt = item.createdAt
      }
    } else {
      sessionMap.set(convId, {
        id: convId,
        title: item.prompt?.slice(0, 30) || 'Chat Session',
        messages: [
          { role: 'user', content: item.prompt, time: item.createdAt, promptType: itemMode },
          { role: 'ai', content: item.response, time: item.createdAt, promptType: itemMode },
        ],
        lastAt: item.createdAt || new Date().toISOString(),
      })
    }
  })

  // Convert to sorted list by last activity date
  const sessions = Array.from(sessionMap.values()).sort(
    (a, b) => new Date(parseIsoDate(b.lastAt)) - new Date(parseIsoDate(a.lastAt))
  )

  // Filter session list by searchSession and selectedMode using getEffectivePromptType
  const filteredSessions = sessions.filter(s => {
    const matchesSearch = !searchSession.trim() || (
      s.title.toLowerCase().includes(searchSession.toLowerCase()) ||
      (Array.isArray(s.messages) && s.messages.some(m => m.content?.toLowerCase().includes(searchSession.toLowerCase())))
    )

    const matchesMode = selectedMode === 'ALL' || (
      Array.isArray(s.messages) && s.messages.some(m => getEffectivePromptType(m) === selectedMode)
    )

    return matchesSearch && matchesMode
  })

  // Level 2: Get active selected session detail
  const activeSession = selectedSessionId ? sessionMap.get(selectedSessionId) : null

  // Pair messages into prompt-response pairs
  const getExchangePairs = (messages = []) => {
    const safeMsgs = Array.isArray(messages) ? messages : []
    const pairs = []
    for (let i = 0; i < safeMsgs.length; i++) {
      if (safeMsgs[i].role === 'user') {
        const promptMsg = safeMsgs[i]
        const aiMsg = safeMsgs[i + 1]?.role === 'ai' ? safeMsgs[i + 1] : null
        const pairMode = getEffectivePromptType(promptMsg) || getEffectivePromptType(aiMsg)
        pairs.push({
          id: i,
          prompt: promptMsg.content || '',
          response: aiMsg ? aiMsg.content : '',
          time: promptMsg.time || aiMsg?.time || '',
          promptType: pairMode,
        })
        if (aiMsg) i++
      } else if (safeMsgs[i].role === 'ai' && (i === 0 || safeMsgs[i - 1].role !== 'user')) {
        pairs.push({
          id: i,
          prompt: 'AI Response',
          response: safeMsgs[i].content || '',
          time: safeMsgs[i].time || '',
          promptType: getEffectivePromptType(safeMsgs[i]),
        })
      }
    }
    return pairs
  }

  const exchangePairs = activeSession ? getExchangePairs(activeSession.messages) : []

  // Level 2: Filter prompt pairs within selected session
  const filteredPairs = exchangePairs.filter(p => {
    const matchesSearch = !searchPrompt.trim() || (
      p.prompt.toLowerCase().includes(searchPrompt.toLowerCase()) ||
      p.response.toLowerCase().includes(searchPrompt.toLowerCase())
    )
    const matchesMode = selectedMode === 'ALL' || getEffectivePromptType(p) === selectedMode
    return matchesSearch && matchesMode
  })

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

  const openInChatWorkspace = (sessionId, promptText = '') => {
    const params = new URLSearchParams()
    params.set('session', sessionId)
    if (promptText) {
      params.set('highlight', promptText)
    }
    navigate(`/chat?${params.toString()}`)
  }

  const modesList = [
    { id: 'ALL', label: 'All Modes' },
    { id: 'SUMMARY', label: 'Summaries' },
    { id: 'SYSTEM_DESIGN', label: 'System Design' },
    { id: 'FLASHCARD', label: 'Flashcards' },
    { id: 'QUIZ', label: 'Quizzes' },
    { id: 'INTERVIEW', label: 'Interview' },
    { id: 'MINDMAP', label: 'Mind Maps' },
    { id: 'CHAT', label: 'General Chat' },
  ]

  return (
    <div style={{ padding: '28px 32px', maxWidth: 850, margin: '0 auto' }}>

      {/* ────────────────── LEVEL 1: SESSIONS LIST ────────────────── */}
      {!selectedSessionId && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                Interaction History
              </h1>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                View and filter your previous AI interactions by mode
              </p>
            </div>

            <button
              onClick={() => navigate('/chat')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10, border: 'none',
                background: 'var(--accent)', color: '#fff', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Plus size={15} /> New Chat
            </button>
          </div>

          {/* AI Mode Filter Pills */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 14 }}>
            {modesList.map(m => {
              const active = selectedMode === m.id
              const badge = MODE_BADGES[m.id]
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    background: active ? (badge ? badge.bg : 'var(--accent-bg)') : 'var(--card)',
                    color: active ? (badge ? badge.color : 'var(--accent)') : 'var(--muted)',
                    whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0,
                  }}
                >
                  {m.label}
                </button>
              )
            })}
          </div>

          <div style={{ position: 'relative', marginBottom: 22 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              value={searchSession}
              onChange={e => setSearchSession(e.target.value)}
              placeholder="Search interaction history (e.g. quiz, summary, code)..."
              style={{
                width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
                color: 'var(--text)', fontSize: 13, padding: '11px 14px 11px 40px', outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(2)].map((_, i) => (
                <div key={i} style={{ height: 84, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, opacity: 0.5 }} />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <MessageCircle size={40} style={{ color: 'var(--border)', margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--muted)', margin: '0 0 6px' }}>
                {searchSession || selectedMode !== 'ALL' ? 'No matching interaction logs found' : 'No chat history yet'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--subtle)', margin: 0 }}>
                {searchSession || selectedMode !== 'ALL' ? 'Try switching mode filters or search terms' : 'Create a new chat session to save your history'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredSessions.map((session, i) => {
                const pairs = getExchangePairs(session.messages)
                const lastMsgSnippet = pairs[pairs.length - 1]?.prompt || session.messages?.[session.messages.length - 1]?.content || 'Empty chat session'
                const pType = getEffectivePromptType(pairs[pairs.length - 1]) || 'CHAT'
                const badge = MODE_BADGES[pType] || MODE_BADGES.CHAT

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedSessionId(session.id)}
                    style={{
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-bd)'; e.currentTarget.style.background = 'var(--card-hover)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)' }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 11,
                      background: badge.bg, border: `1px solid ${badge.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <MessageSquare size={18} style={{ color: badge.color }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {session.title}
                        </p>
                        <span style={{ fontSize: 11, color: 'var(--subtle)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <Clock size={11} /> {formatDate(session.lastAt)}
                        </span>
                      </div>

                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lastMsgSnippet}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: badge.color,
                          background: badge.bg, border: `1px solid ${badge.border}`, padding: '2px 7px', borderRadius: 5,
                        }}>
                          {badge.label}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--subtle)' }}>
                          {pairs.length || session.messages?.length || 0} message{pairs.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={16} style={{ color: 'var(--subtle)', flexShrink: 0 }} />
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ────────────────── LEVEL 2: DRILL-DOWN PROMPTS LIST ────────────────── */}
      {selectedSessionId && activeSession && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button
              onClick={() => { setSelectedSessionId(null); setSearchPrompt('') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border)',
                background: 'var(--card)', color: 'var(--text)', fontSize: 12,
                fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}
            >
              <ArrowLeft size={14} /> Back to Sessions
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeSession.title}
              </h1>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
                {exchangePairs.length} conversation prompt{exchangePairs.length !== 1 ? 's' : ''} inside this chat
              </p>
            </div>
            <button
              onClick={() => openInChatWorkspace(activeSession.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 10, border: 'none',
                background: 'var(--accent)', color: '#fff', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              Open in Chat UI <ChevronRight size={14} />
            </button>
          </div>

          {/* Search bar for prompts */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              value={searchPrompt}
              onChange={e => setSearchPrompt(e.target.value)}
              placeholder={`Search conversations inside "${activeSession.title}"...`}
              style={{
                width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
                color: 'var(--text)', fontSize: 13, padding: '11px 14px 11px 40px', outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Prompts list */}
          {filteredPairs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <MessageCircle size={36} style={{ color: 'var(--border)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--muted)', margin: '0 0 4px' }}>
                {searchPrompt ? 'No matching prompts found in this session' : 'No messages in this chat session yet'}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--subtle)', margin: 0 }}>
                {searchPrompt ? 'Try searching with another keyword' : 'Open this chat in Chat UI to send a message'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredPairs.map((pair, idx) => {
                const badge = MODE_BADGES[getEffectivePromptType(pair)] || MODE_BADGES.CHAT
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => openInChatWorkspace(activeSession.id, pair.prompt)}
                    style={{
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-bd)'; e.currentTarget.style.background = 'var(--card-hover)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: pair.response ? 10 : 0 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 7, background: badge.bg,
                        border: `1px solid ${badge.border}`, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0, marginTop: 2,
                      }}>
                        <User size={13} style={{ color: badge.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, flex: 1 }}>
                            {pair.prompt}
                          </p>
                          <span style={{
                            fontSize: 9, fontWeight: 700, color: badge.color,
                            background: badge.bg, border: `1px solid ${badge.border}`, padding: '2px 6px', borderRadius: 4,
                          }}>
                            {badge.label}
                          </span>
                        </div>
                        {pair.time && (
                          <span style={{ fontSize: 10, color: 'var(--subtle)' }}>
                            {formatDate(pair.time)}
                          </span>
                        )}
                      </div>
                      <ChevronRight size={15} style={{ color: 'var(--subtle)', flexShrink: 0, marginTop: 4 }} />
                    </div>

                    {pair.response && (
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 12px', borderRadius: 10, background: 'var(--surface)',
                        border: '1px solid var(--border-sub)', marginTop: 8,
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, background: 'var(--card)',
                          border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0, marginTop: 2,
                        }}>
                          <Bot size={12} style={{ color: 'var(--muted)' }} />
                        </div>
                        <p style={{
                          fontSize: 12, color: 'var(--muted)', margin: 0,
                          lineHeight: 1.5, overflow: 'hidden',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>
                          {pair.response}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

    </div>
  )
}
