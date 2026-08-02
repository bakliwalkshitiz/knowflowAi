import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, FileText, MessageSquare, BookOpen, HelpCircle, Mic,
  Brain, User, Bot, Plus, X, Upload, CloudUpload,
  PenSquare, Trash2, Check, Paperclip, Sparkles, AlertCircle, Layers, Loader2
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { chatApi, documentApi, userApi } from '../../api/client'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
  suppressErrorRendering: true,
})

/* ─────────────────── MERMAID RENDERER ─────────────────── */
function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!chart) return
    setError(false)

    let cleanChart = chart.trim()
      .replace(/^```mermaid/i, '')
      .replace(/^```/i, '')
      .replace(/```$/i, '')
      .trim()

    const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`

    mermaid.render(id, cleanChart)
      .then(({ svg }) => {
        setSvg(svg)
        setError(false)
      })
      .catch((err) => {
        console.warn('Mermaid render warning:', err)
        setError(true)
        setTimeout(() => {
          document.querySelectorAll('[id^="dmermaid"], [id^="mermaid-"]').forEach(el => {
            if (el && el.parentNode === document.body) {
              el.remove()
            }
          })
        }, 50)
      })
  }, [chart])

  if (error) {
    return (
      <div style={{
        padding: '12px 14px', background: 'var(--surface)', borderRadius: 10,
        border: '1px solid var(--border)', margin: '10px 0', fontSize: 12,
      }}>
        <p style={{ margin: '0 0 6px', color: 'var(--muted)', fontWeight: 600 }}>Architecture / Class Diagram Code:</p>
        <pre style={{ margin: 0, padding: '8px 10px', background: '#121212', borderRadius: 8, overflowX: 'auto', fontSize: 11, color: 'var(--text)' }}>
          {chart}
        </pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', margin: '10px 0' }}>
        Rendering System Design Diagram...
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 16, background: '#181818', borderRadius: 12,
        border: '1px solid var(--border)', overflowX: 'auto',
        margin: '12px 0', display: 'flex', justifyContent: 'center'
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

/* ─────────────────── CONSTANTS ─────────────────── */
const MODES = [
  { key: 'CHAT',          label: 'Chat',          icon: MessageSquare },
  { key: 'SUMMARY',       label: 'Summary',       icon: FileText },
  { key: 'SYSTEM_DESIGN', label: 'System Design (LLD & HLD)', icon: Layers },
  { key: 'FLASHCARD',     label: 'Flashcards',    icon: BookOpen },
  { key: 'QUIZ',          label: 'Quiz',          icon: HelpCircle },
  { key: 'INTERVIEW',     label: 'Interview',     icon: Mic },
  { key: 'MINDMAP',       label: 'Mind Map',      icon: Brain },
]

const DEFAULT_PROMPTS = {
  SUMMARY: 'Summarize the selected document in detail with key takeaways and bullet points.',
  SYSTEM_DESIGN: 'Generate complete LLD (UML Class Diagram) and HLD (System Architecture) for the attached document.',
  FLASHCARD: 'Generate a set of study flashcards (Questions and Answers) from the document.',
  QUIZ: 'Generate a 5-question multiple choice quiz (MCQs) with correct answers from the document.',
  INTERVIEW: 'Generate top technical interview questions and answers based on this document.',
  MINDMAP: 'Create a structured mind map breakdown for this document.',
  CHAT: 'Provide a summary overview of the attached document.',
}

function normalizeDoc(d) {
  if (!d) return null
  const docId = d.id || d.documentId
  return {
    id: docId,
    documentId: docId,
    fileName: d.fileName || 'Document',
    fileSize: d.fileSize || d.size || 0
  }
}

const NEW_SESSION = (title = 'New Chat') => ({
  id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: title,
  messages: [],
  createdAt: new Date().toISOString(),
})

function groupSessions(sessions) {
  const now = new Date()
  const today = [], week = [], older = []
  sessions.forEach(s => {
    const d = new Date(s.createdAt)
    const diffDays = Math.floor((now - d) / 86400000)
    if (diffDays < 1)  today.push(s)
    else if (diffDays < 7) week.push(s)
    else older.push(s)
  })
  return { today, week, older }
}

/* ─────────────────── SESSION STORAGE ─────────────────── */
function loadSessions() {
  try {
    const raw = localStorage.getItem('kf_sessions')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.length > 0) return parsed
    }
  } catch {}
  const s = NEW_SESSION('General Chat')
  return [s]
}

function saveSessions(sessions) {
  try {
    localStorage.setItem('kf_sessions', JSON.stringify(sessions))
  } catch {}
}

/* ─────────────────── SUB COMPONENTS ─────────────────── */
function SessionItem({ session, active, onClick, onRename, onDelete }) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(session.name)

  const save = () => {
    onRename(session.id, name.trim() || 'Chat')
    setRenaming(false)
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
        background: active ? 'var(--accent-bg)' : 'transparent',
        border: `1px solid ${active ? 'var(--accent-bd)' : 'transparent'}`,
        transition: 'all 0.15s', marginBottom: 3, position: 'relative',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--card-hover)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <MessageSquare size={13} style={{ color: active ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }} />

      {renaming ? (
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setRenaming(false) }}
          onBlur={save}
          autoFocus
          style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--accent)',
            borderRadius: 4, padding: '2px 6px', color: 'var(--text)', fontSize: 12,
          }}
        />
      ) : (
        <span style={{
          flex: 1, fontSize: 12, fontWeight: active ? 600 : 400,
          color: active ? 'var(--text)' : 'var(--muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {session.name}
        </span>
      )}

      {!renaming && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setRenaming(true) }}
            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--subtle)' }}
          >
            <PenSquare size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(session.id) }}
            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--subtle)' }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

function ModeTab({ mode, active, onClick }) {
  const M = MODES.find(m => m.key === mode)
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.15s',
      background: active ? 'var(--accent)' : 'var(--card)',
      color: active ? '#fff' : 'var(--muted)',
    }}>
      <M.icon size={13} />
      {M.label}
    </button>
  )
}

function MessageContent({ text }) {
  if (!text) return null

  const sanitized = text
    .replace(/\\\( (.*?) \\\)/g, '$1')
    .replace(/\\\((.*?)\\\)/g, '$1')
    .replace(/\\\[ (.*?) \\\]/g, '$1')
    .replace(/\\\[(.*?)\\\]/g, '$1')
    .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '$1/$2')

  const mermaidRegex = /```mermaid([\s\S]*?)```/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = mermaidRegex.exec(sanitized)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: sanitized.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'mermaid', content: match[1].trim() })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < sanitized.length) {
    parts.push({ type: 'text', content: sanitized.slice(lastIndex) })
  }

  return (
    <>
      {parts.map((part, idx) => {
        if (part.type === 'mermaid') {
          return <MermaidDiagram key={idx} chart={part.content} />
        }
        return (
          <pre key={idx} style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', wordBreak: 'break-word' }}>
            {part.content}
          </pre>
        )
      })}
    </>
  )
}

function MessageBubble({ msg, index, isHighlighted }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      id={`msg-bubble-${index}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex', gap: 10, flexDirection: isUser ? 'row-reverse' : 'row', marginBottom: 16,
        padding: isHighlighted ? '10px 14px' : '0px',
        borderRadius: isHighlighted ? 16 : 0,
        background: isHighlighted ? 'rgba(79, 114, 247, 0.12)' : 'transparent',
        border: `1.5px solid ${isHighlighted ? 'var(--accent)' : 'transparent'}`,
        boxShadow: isHighlighted ? '0 0 24px rgba(79, 114, 247, 0.35)' : 'none',
        transition: 'all 0.4s ease',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isUser ? 'var(--accent-bg)' : 'var(--card)',
        border: `1px solid ${isUser ? 'var(--accent-bd)' : 'var(--border)'}`,
      }}>
        {isUser ? <User size={13} style={{ color: 'var(--accent)' }} /> : <Bot size={13} style={{ color: 'var(--muted)' }} />}
      </div>
      <div style={{
        maxWidth: '82%', padding: '10px 14px', borderRadius: 12,
        borderTopRightRadius: isUser ? 3 : 12,
        borderTopLeftRadius: isUser ? 12 : 3,
        background: isUser ? 'var(--accent-bg)' : 'var(--card)',
        border: `1px solid ${isUser ? 'var(--accent-bd)' : 'var(--border)'}`,
        fontSize: 13, lineHeight: 1.6, color: 'var(--text)',
      }}>
        {msg.attachedDocs && msg.attachedDocs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {msg.attachedDocs.map((doc, idx) => (
              <div key={idx} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 9px', borderRadius: 6, background: 'var(--surface)',
                border: '1px solid var(--accent-bd)', fontSize: 11, fontWeight: 500, color: 'var(--text)'
              }}>
                <FileText size={12} style={{ color: 'var(--accent)' }} />
                <span>{doc.fileName}</span>
              </div>
            ))}
          </div>
        )}
        <MessageContent text={msg.content} />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--subtle)' }}>{msg.time}</p>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bot size={13} style={{ color: 'var(--muted)' }} />
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, borderTopLeftRadius: 3, padding: '10px 16px' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{ delay: i * 0.15, duration: 0.6, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── MAIN PAGE ─────────────────── */
export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const sessionUrlParam = searchParams.get('session')
  const highlightParam = searchParams.get('highlight')

  const [sessions, setSessions] = useState(loadSessions)
  const [activeId, setActiveId]  = useState(() => sessionUrlParam || loadSessions()[0]?.id)
  const [mode, setMode]          = useState('CHAT')
  const [input, setInput]        = useState('')
  const [loading, setLoading]    = useState(false)
  const [documents, setDocuments] = useState([])
  const [contextDocs, setContextDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0]

  useEffect(() => {
    documentApi.getAll().then(res => {
      const list = (res?.data || []).map(normalizeDoc).filter(Boolean)
      setDocuments(list)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (sessionUrlParam && sessionUrlParam !== activeId) {
      setActiveId(sessionUrlParam)
    }
  }, [sessionUrlParam])

  useEffect(() => {
    if (highlightParam && activeSession?.messages?.length > 0) {
      setTimeout(() => {
        const decoded = decodeURIComponent(highlightParam).toLowerCase()
        const foundIdx = activeSession.messages.findIndex(m => m.content?.toLowerCase().includes(decoded))
        if (foundIdx !== -1) {
          const el = document.getElementById(`msg-bubble-${foundIdx}`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    }
  }, [highlightParam, activeSession])

  useEffect(() => {
    if (activeId && activeSession?.messages?.length === 0) {
      chatApi.conversationHistory(activeId).then(res => {
        if (res?.data && res.data.length > 0) {
          const loadedMsgs = []
          res.data.forEach(h => {
            loadedMsgs.push({
              role: 'user',
              content: h.prompt,
              time: h.createdAt ? new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'
            })
            loadedMsgs.push({
              role: 'assistant',
              content: h.response,
              time: h.createdAt ? new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'
            })
          })
          setSessions(prev => {
            const updated = prev.map(s => s.id === activeId ? { ...s, messages: loadedMsgs } : s)
            saveSessions(updated)
            return updated
          })
        }
      }).catch(() => {})
    }
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages, loading])

  const newChat = () => {
    const s = NEW_SESSION('General Chat')
    const updated = [s, ...sessions]
    setSessions(updated)
    setActiveId(s.id)
    setContextDocs([])
    saveSessions(updated)
  }

  const renameSession = (id, newName) => {
    const updated = sessions.map(s => s.id === id ? { ...s, name: newName } : s)
    setSessions(updated)
    saveSessions(updated)
  }

  const deleteSession = (id) => {
    const updated = sessions.filter(s => s.id !== id)
    const next = updated.length > 0 ? updated : [NEW_SESSION()]
    setSessions(next)
    setActiveId(next[0].id)
    saveSessions(next)
  }

  const handleInlineFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await documentApi.upload(fd)
      if (res?.data) {
        const norm = normalizeDoc(res.data)
        if (norm && norm.id) {
          setContextDocs(prev => prev.some(d => d.id === norm.id) ? prev : [...prev, norm])
          setDocuments(prev => prev.some(d => d.id === norm.id) ? prev : [...prev, norm])
        }
      }
    } catch (err) {
      console.error('File upload failed:', err)
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'File upload failed'
      alert(`⚠️ ${msg}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const toggleDocContext = (doc) => {
    const norm = normalizeDoc(doc)
    if (!norm || !norm.id) return
    setContextDocs(prev =>
      prev.some(d => d.id === norm.id) ? prev.filter(d => d.id !== norm.id) : [...prev, norm]
    )
  }

  const sendMessage = async (e) => {
    if (e) e.preventDefault()
    const text = input.trim()
    const promptToUse = text || (mode !== 'CHAT' ? DEFAULT_PROMPTS[mode] : '')
    if (!promptToUse || loading) return

    const currentAttachedDocs = [...contextDocs]
    const userMsg = {
      role: 'user',
      content: promptToUse,
      attachedDocs: currentAttachedDocs,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const updatedMsgs = [...(activeSession.messages || []), userMsg]

    let title = activeSession.name
    if (activeSession.messages.length === 0 && title === 'New Chat') {
      title = promptToUse.slice(0, 28)
    }

    const updatedSessions = sessions.map(s =>
      s.id === activeId ? { ...s, name: title, messages: updatedMsgs } : s
    )
    setSessions(updatedSessions)
    saveSessions(updatedSessions)

    setInput('')
    setContextDocs([])
    setLoading(true)

    try {
      const docIds = contextDocs.map(d => d.id).filter(Boolean)
      const res = await chatApi.send({
        type: mode,
        conversationId: activeId,
        message: promptToUse,
        documentIds: docIds
      })

      const botMsg = {
        role: 'assistant',
        content: res.data?.response || 'No response received.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      const finalMsgs = [...updatedMsgs, botMsg]
      const finalSessions = sessions.map(s =>
        s.id === activeId ? { ...s, name: title, messages: finalMsgs } : s
      )
      setSessions(finalSessions)
      saveSessions(finalSessions)
    } catch (err) {
      console.error('Chat API error:', err?.response?.data || err?.message || err)
      const backendMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Unknown error'
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ Failed to fetch response: ${backendMsg}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      const finalSessions = sessions.map(s =>
        s.id === activeId ? { ...s, messages: [...updatedMsgs, errorMsg] } : s
      )
      setSessions(finalSessions)
      saveSessions(finalSessions)
    } finally {
      setLoading(false)
    }
  }

  const { today, week, older } = groupSessions(sessions)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flex: 1 }}>

      {/* ── MAIN CHAT AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>

        {/* ── TOP HEADER / MODE BAR ── */}
        <div style={{
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          background: 'var(--surface)', flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeSession?.name || 'Chat Workspace'}
          </h2>

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {MODES.map(m => (
              <ModeTab key={m.key} mode={m.key} active={mode === m.key} onClick={() => setMode(m.key)} />
            ))}
          </div>
        </div>

        {/* ── MESSAGES LIST ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>
          {activeSession?.messages?.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justify: 'center', textAlign: 'center', color: 'var(--muted)', gap: 12, padding: '40px 0',
            }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>
                  KnowFlow AI Knowledge Vault
                </h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, maxWidth: 420 }}>
                  Upload documents via the 📎 paperclip button or select from your Vault to start generating LLD/HLD System Designs, Summaries, Quizzes, Flashcards, and technical analysis!
                </p>
              </div>
            </div>
          ) : (
            activeSession.messages.map((msg, i) => {
              const decodedHighlight = highlightParam ? decodeURIComponent(highlightParam).toLowerCase() : ''
              const isHighlighted = !!decodedHighlight && (msg.content?.toLowerCase().includes(decodedHighlight))
              return <MessageBubble key={i} index={i} msg={msg} isHighlighted={isHighlighted} />
            })
          )}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* ── INPUT BOX WITH INLINE PAPERCLIP & MODE PILLS ── */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <form onSubmit={sendMessage} style={{
            background: 'var(--card)', border: '1.5px solid var(--border)',
            borderRadius: 14, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8,
            transition: 'border-color 0.2s',
          }}>

            {/* Badges Bar inside Input Container */}
            {(mode !== 'CHAT' || contextDocs.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>

                {/* Mode Pill */}
                {mode !== 'CHAT' && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--accent)',
                    background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)',
                    padding: '3px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <Sparkles size={11} /> {MODES.find(m => m.key === mode)?.label} Applied
                    <X size={11} style={{ cursor: 'pointer', marginLeft: 2 }} onClick={() => setMode('CHAT')} />
                  </span>
                )}

                {/* Attached Document Badges */}
                {contextDocs.map(doc => (
                  <span key={doc.id} style={{
                    fontSize: 11, fontWeight: 500, color: 'var(--text)',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    padding: '3px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    📄 {doc.fileName}
                    <X size={11} style={{ cursor: 'pointer', marginLeft: 2, color: 'var(--muted)' }} onClick={() => toggleDocContext(doc)} />
                  </span>
                ))}
              </div>
            )}

            {/* Text Input Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleInlineFileUpload}
                style={{ display: 'none' }}
                accept=".pdf,.txt,.doc,.docx"
              />

              {/* Paperclip Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title={uploading ? 'Uploading document...' : 'Attach Document'}
                style={{
                  background: 'none', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer',
                  color: uploading ? 'var(--accent)' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4,
                }}
              >
                {uploading ? (
                  <Loader2 size={18} style={{ animation: 'spin 0.9s linear infinite' }} />
                ) : (
                  <Paperclip size={18} />
                )}
              </button>

              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  mode !== 'CHAT' && !input
                    ? `Press Enter to generate ${MODES.find(m => m.key === mode)?.label}... or type custom prompt`
                    : 'Type your message... (Enter to send, Shift+Enter for newline)'
                }
                disabled={loading}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: 'var(--text)', fontSize: 13, outline: 'none',
                }}
              />

              <button
                type="submit"
                disabled={loading || (!input.trim() && mode === 'CHAT' && contextDocs.length === 0)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: (input.trim() || mode !== 'CHAT' || contextDocs.length > 0) && !loading ? 'var(--accent)' : 'var(--surface)',
                  color: (input.trim() || mode !== 'CHAT' || contextDocs.length > 0) && !loading ? '#fff' : 'var(--subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Send size={14} />
              </button>
            </div>

          </form>
          <p style={{ fontSize: 10, color: 'var(--subtle)', textAlign: 'center', margin: '6px 0 0' }}>
            AI can make mistakes · KnowFlow AI Knowledge Vault
          </p>
        </div>

      </div>

      {/* ── RIGHT VAULT SIDEBAR ── */}
      <div style={{
        width: 220, flexShrink: 0, background: 'var(--surface)',
        borderLeft: '1px solid var(--border)', padding: 12, display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          Vault Documents
        </h3>

        <div style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
          maxHeight: 'calc(100vh - 80px)', paddingRight: 4,
        }}>
          {documents.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--subtle)', textAlign: 'center', padding: '20px 0', margin: 0 }}>
              No documents in vault.<br />Click 📎 in the chat box to upload!
            </p>
          ) : (
            documents.map(doc => {
              const selected = contextDocs.some(d => d.id === doc.id)
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDocContext(doc)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                    background: selected ? 'var(--accent-bg)' : 'var(--card)',
                    border: `1px solid ${selected ? 'var(--accent-bd)' : 'var(--border)'}`,
                  }}
                >
                  <FileText size={13} style={{ color: selected ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.fileName}
                    </p>
                    <p style={{ fontSize: 9, color: 'var(--subtle)', margin: '1px 0 0' }}>
                      {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  {selected && <Check size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}
