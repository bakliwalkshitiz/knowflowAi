import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Clock, MessageSquare, ChevronRight, Search, Plus,
  ArrowLeft, MessageCircle, User, Bot
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { chatApi } from '../../api/client'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [backendHistory, setBackendHistory] = useState([])
  const [searchSession, setSearchSession] = useState('')
  const [searchPrompt, setSearchPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState(null)

  useEffect(() => {
    chatApi.history()
      .then(res => {
        setBackendHistory(res.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Read local chat sessions
  const localSessions = (() => {
    try {
      return JSON.parse(localStorage.getItem('kf_sessions') || '[]')
    } catch { return [] }
  })()

  // Build sessions map
  const sessionMap = new Map()

  // 1. Populate from localSessions
  localSessions.forEach(s => {
    sessionMap.set(s.id, {
      id: s.id,
      title: s.name || 'Chat Session',
      messages: s.messages || [],
      lastAt: s.createdAt || new Date().toISOString(),
    })
  })

  // 2. Merge backend history items into matching sessions
  backendHistory.forEach(item => {
    const convId = item.conversationId
    if (convId && sessionMap.has(convId)) {
      const sess = sessionMap.get(convId)
      if (!sess.messages.some(m => m.content === item.prompt || m.content === item.response)) {
        if (item.prompt) sess.messages.push({ role: 'user', content: item.prompt, time: item.createdAt })
        if (item.response) sess.messages.push({ role: 'ai', content: item.response, time: item.createdAt })
      }
      if (item.createdAt && new Date(item.createdAt) > new Date(sess.lastAt)) {
        sess.lastAt = item.createdAt
      }
    }
  })

  // 3. Fallback: if localSessions is empty, group backend history by conversationId
  if (localSessions.length === 0 && backendHistory.length > 0) {
    backendHistory.forEach(item => {
      const convId = item.conversationId || 'default'
      if (!sessionMap.has(convId)) {
        sessionMap.set(convId, {
          id: convId,
          title: item.prompt?.slice(0, 30) || 'Chat Session',
          messages: [
            { role: 'user', content: item.prompt, time: item.createdAt },
            { role: 'ai', content: item.response, time: item.createdAt },
          ],
          lastAt: item.createdAt || new Date().toISOString(),
        })
      } else {
        const sess = sessionMap.get(convId)
        sess.messages.push({ role: 'user', content: item.prompt, time: item.createdAt })
        sess.messages.push({ role: 'ai', content: item.response, time: item.createdAt })
      }
    })
  }

  // Convert to sorted list by last activity date
  const sessions = Array.from(sessionMap.values()).sort(
    (a, b) => new Date(b.lastAt) - new Date(a.lastAt)
  )

  // Level 1: Filter session list by searchSession
  const filteredSessions = sessions.filter(s => {
    if (!searchSession.trim()) return true
    const q = searchSession.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.messages.some(m => m.content?.toLowerCase().includes(q))
    )
  })

  // Level 2: Get active selected session detail
  const activeSession = selectedSessionId ? sessionMap.get(selectedSessionId) : null

  // Pair messages into prompt-response pairs
  const getExchangePairs = (messages = []) => {
    const pairs = []
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'user') {
        const promptMsg = messages[i]
        const aiMsg = messages[i + 1]?.role === 'ai' ? messages[i + 1] : null
        pairs.push({
          id: i,
          prompt: promptMsg.content,
          response: aiMsg ? aiMsg.content : '',
          time: promptMsg.time || aiMsg?.time || '',
        })
        if (aiMsg) i++
      } else if (messages[i].role === 'ai' && (i === 0 || messages[i - 1].role !== 'user')) {
        pairs.push({
          id: i,
          prompt: 'AI Response',
          response: messages[i].content,
          time: messages[i].time || '',
        })
      }
    }
    return pairs
  }

  const exchangePairs = activeSession ? getExchangePairs(activeSession.messages) : []

  // Level 2: Filter prompt pairs within selected session
  const filteredPairs = exchangePairs.filter(p => {
    if (!searchPrompt.trim()) return true
    const q = searchPrompt.toLowerCase()
    return (
      p.prompt.toLowerCase().includes(q) ||
      p.response.toLowerCase().includes(q)
    )
  })

  const formatDate = (s) => {
    if (!s) return 'Recently'
    const d = new Date(s), now = new Date(), diff = now - d
    if (isNaN(d.getTime())) return 'Recently'
    if (diff < 60000)    return 'Just now'
    if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  // Navigate to Chat UI with target prompt highlighted and scrolled into view!
  const openInChatWorkspace = (sessionId, promptText = '') => {
    const params = new URLSearchParams()
    params.set('session', sessionId)
    if (promptText) {
      params.set('highlight', promptText)
    }
    navigate(`/chat?${params.toString()}`)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 850, margin: '0 auto' }}>

      {/* ────────────────── LEVEL 1: SESSIONS LIST ────────────────── */}
      {!selectedSessionId && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                Chat History
              </h1>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Select a chat session to view its conversation history
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

          <div style={{ position: 'relative', marginBottom: 22 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              value={searchSession}
              onChange={e => setSearchSession(e.target.value)}
              placeholder="Search chat sessions (e.g. study, coding, algorithms)..."
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
                {searchSession ? 'No matching chat sessions found' : 'No chat history yet'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--subtle)', margin: 0 }}>
                {searchSession ? 'Try searching with another keyword' : 'Create a new chat session to save your history'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredSessions.map((session, i) => {
                const pairs = getExchangePairs(session.messages)
                const lastMsgSnippet = pairs[pairs.length - 1]?.prompt || session.messages[session.messages.length - 1]?.content || 'Empty chat session'
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
                      background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <MessageSquare size={18} style={{ color: 'var(--accent)' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
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
                          fontSize: 10, fontWeight: 600, color: 'var(--accent)',
                          background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: 6,
                        }}>
                          {pairs.length || session.messages.length} conversation{pairs.length !== 1 ? 's' : ''}
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
              {filteredPairs.map((pair, idx) => (
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
                      width: 26, height: 26, borderRadius: 7, background: 'var(--accent-bg)',
                      border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, marginTop: 2,
                    }}>
                      <User size={13} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>
                        {pair.prompt}
                      </p>
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
              ))}
            </div>
          )}
        </motion.div>
      )}

    </div>
  )
}
