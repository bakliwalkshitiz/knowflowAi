import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, FileText, MessageSquare, BookOpen, HelpCircle, Mic,
  Brain, User, Bot, Plus, X, Upload, CloudUpload,
  PenSquare, Trash2, Check, Paperclip, Sparkles, AlertCircle, Layers, Loader2,
  PanelRightClose, PanelRightOpen, FolderArchive, ChevronLeft, ChevronRight, ChevronDown, Edit3
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { chatApi, documentApi, userApi } from '../../api/client'
import mermaid from 'mermaid'
import { useAuth } from '../../context/AuthContext'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
  suppressErrorRendering: true,
})



const MODES = [
  { key: 'CHAT', label: 'Chat', icon: MessageSquare },
  { key: 'SUMMARY', label: 'Summary', icon: FileText },
  { key: 'SYSTEM_DESIGN', label: 'System Design (LLD & HLD)', icon: Layers },
  { key: 'FLASHCARD', label: 'Flashcards', icon: BookOpen },
  { key: 'QUIZ', label: 'Quiz', icon: HelpCircle },
  { key: 'INTERVIEW', label: 'Interview', icon: Mic },
  { key: 'MINDMAP', label: 'Mind Map', icon: Brain },
]

const DEFAULT_PROMPTS = {
  SUMMARY: 'Summarize the uploaded document concisely in key bullet points.',
  SYSTEM_DESIGN: 'Generate a complete System Design document including LLD (Mermaid classDiagram) and HLD (Mermaid graph TD architecture diagram).',
  FLASHCARD: 'Generate 5 to 10 high quality flashcards covering the key concepts from the document.',
  QUIZ: 'Generate a 5-question multiple choice quiz with correct answers and explanations.',
  INTERVIEW: 'Generate 5 mock interview questions with expert sample answers.',
  MINDMAP: 'Create a structured mind map representation of the main topics.',
}

function createDefaultSession() {
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: 'General Chat',
    messages: [],
    createdAt: new Date().toISOString()
  }
}

function loadSessions(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)

    if (!raw) {
      return [createDefaultSession()]
    }

    const parsed = JSON.parse(raw)

    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [createDefaultSession()]
  } catch {
    return [createDefaultSession()]
  }
}

function saveSessions(storageKey, sessions) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(sessions))
    window.dispatchEvent(new Event('kf_sessions_updated'))
  } catch { }
}

function normalizeDoc(doc) {
  if (!doc) return null
  return {
    id: doc.id || doc.documentId || doc.docId || String(doc.id),
    fileName: doc.fileName || doc.filename || doc.name || 'Document',
    fileSize: doc.fileSize || doc.size || 0,
  }
}

function MermaidDiagram({ chart }) {
  const ref = useRef(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`

    mermaid.render(id, chart)
      .then(res => {
        if (isMounted) {
          setSvg(res.svg)
          setError(null)
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Mermaid render error:', err)
          setError('Failed to render diagram. Raw Mermaid syntax is shown below.')
        }
      })

    return () => { isMounted = false }
  }, [chart])

  if (error) {
    return (
      <div style={{ margin: '12px 0', padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, color: '#ef4444', margin: '0 0 6px' }}>{error}</p>
        <pre style={{ fontSize: 11, color: 'var(--muted)', margin: 0, overflowX: 'auto' }}>{chart}</pre>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      style={{
        margin: '14px 0', padding: '16px', borderRadius: 12,
        background: 'var(--surface)', border: '1px solid var(--border-sub)',
        overflowX: 'auto', textAlign: 'center',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

function SessionItem({ session, active, onClick, onRename, onDelete }) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(session.name)

  const handleRenameSubmit = () => {
    if (name.trim() && name !== session.name) onRename(session.id, name.trim())
    setRenaming(false)
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
        borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
        background: active ? 'var(--accent-bg)' : 'transparent',
        border: `1px solid ${active ? 'var(--accent-bd)' : 'transparent'}`,
      }}
    >
      <MessageSquare size={13} style={{ color: active ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }} />

      {renaming ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
          autoFocus
          style={{
            flex: 1, background: 'var(--card)', border: '1px solid var(--accent)',
            borderRadius: 4, color: 'var(--text)', fontSize: 12, padding: '2px 6px', outline: 'none',
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

/* ────────────────── FLASHCARD DECK PARSER & COMPONENT ────────────────── */
function parseFlashcards(text) {
  if (!text) return null
  try {
    const jsonMatch = text.match(/```json([\s\S]*?)```/) || text.match(/\[\s*\{[\s\S]*\}\s*\]/)
    if (jsonMatch) {
      const raw = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(raw.trim())
      if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].front || parsed[0].question)) {
        return parsed.map((c, i) => ({
          id: c.id || i + 1,
          front: c.front || c.question || `Question ${i + 1}`,
          back: c.back || c.answer || c.explanation || 'Answer',
        }))
      }
    }
  } catch (e) { }

  const cards = []
  const frontBackRegex = /(?:Card\s*\d+:?|Q\d+:?|Front:?|\d+\.\s*Front:?)\s*([\s\S]*?)(?:Back:?|A\d+:?|Answer:?|\d+\.\s*Back:?)\s*([\s\S]*?)(?=(?:Card\s*\d+:?|Q\d+:?|Front:?|\d+\.\s*Front:?|$))/gi
  let match
  while ((match = frontBackRegex.exec(text)) !== null) {
    if (match[1] && match[2] && match[1].trim().length > 0) {
      cards.push({
        id: cards.length + 1,
        front: match[1].trim(),
        back: match[2].trim(),
      })
    }
  }
  return cards.length > 0 ? cards : null
}

function FlashcardDeck({ initialCards }) {
  const [cards, setCards] = useState(initialCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')

  if (!cards || cards.length === 0) return null

  const currentCard = cards[currentIndex] || cards[0]
  const total = cards.length

  const handleEditOpen = () => {
    setEditFront(currentCard.front)
    setEditBack(currentCard.back)
    setIsEditing(true)
  }

  const handleEditSave = () => {
    setCards(prev => prev.map((c, idx) => idx === currentIndex ? { ...c, front: editFront, back: editBack } : c))
    setIsEditing(false)
  }

  return (
    <div style={{ marginTop: 12, marginBottom: 12, maxWidth: 640 }}>
      {/* Top Banner Button matching User Screenshot */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 24px', borderRadius: 24, background: '#3b82f6',
          color: '#ffffff', fontSize: 14, fontWeight: 700,
          boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
        }}>
          <span>Generate Flashcards</span>
          <ChevronDown size={18} style={{ strokeWidth: 3 }} />
        </div>
      </div>

      {/* Flashcards Side-by-Side Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 14 }}>

        {/* Flashcard Front */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)', transition: 'all 0.2s',
        }}>
          <div style={{
            background: 'var(--card)', padding: '8px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Flashcard Front</span>
          </div>

          <div style={{
            padding: 16, minHeight: 180, background: 'rgba(96, 165, 250, 0.08)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                {currentIndex + 1}/{total}
              </span>
              <button
                onClick={handleEditOpen}
                title="Edit Flashcard"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2 }}
              >
                <Edit3 size={15} />
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={editFront}
                onChange={e => setEditFront(e.target.value)}
                style={{
                  width: '100%', height: 100, background: 'var(--card)', color: 'var(--text)',
                  border: '1px solid var(--accent)', borderRadius: 8, padding: 8, fontSize: 13, outline: 'none',
                }}
              />
            ) : (
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textAlign: 'center', margin: 'auto 0', lineHeight: 1.5 }}>
                {currentCard.front}
              </p>
            )}
          </div>
        </div>

        {/* Flashcard Back */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)', transition: 'all 0.2s',
        }}>
          <div style={{
            background: 'var(--card)', padding: '8px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Flashcard Back</span>
          </div>

          <div style={{
            padding: 16, minHeight: 180, background: 'rgba(52, 211, 153, 0.08)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                {currentIndex + 1}/{total}
              </span>
              <button
                onClick={handleEditOpen}
                title="Edit Flashcard"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2 }}
              >
                <Edit3 size={15} />
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={editBack}
                onChange={e => setEditBack(e.target.value)}
                style={{
                  width: '100%', height: 100, background: 'var(--card)', color: 'var(--text)',
                  border: '1px solid var(--accent)', borderRadius: 8, padding: 8, fontSize: 13, outline: 'none',
                }}
              />
            ) : (
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textAlign: 'center', margin: 'auto 0', lineHeight: 1.5 }}>
                {currentCard.back}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Save Edit Controls */}
      {isEditing && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 10 }}>
          <button
            onClick={() => setIsEditing(false)}
            style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleEditSave}
            style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Bottom Carousel Navigation Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 12, background: 'var(--surface)',
        border: '1px solid var(--border-sub)',
      }}>
        <button
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
            borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)',
            color: currentIndex === 0 ? 'var(--subtle)' : 'var(--text)', fontSize: 12,
            fontWeight: 600, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: currentIndex === 0 ? 0.5 : 1, transition: 'all 0.15s',
          }}
        >
          <ChevronLeft size={14} /> Previous
        </button>

        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
          Card {currentIndex + 1} of {total}
        </span>

        <button
          onClick={() => setCurrentIndex(prev => Math.min(total - 1, prev + 1))}
          disabled={currentIndex === total - 1}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
            borderRadius: 8, border: 'none', background: 'var(--accent)',
            color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: currentIndex === total - 1 ? 'not-allowed' : 'pointer',
            opacity: currentIndex === total - 1 ? 0.5 : 1, transition: 'all 0.15s',
          }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function MessageContent({ text }) {
  if (!text) return null

  const flashcards = parseFlashcards(text)
  if (flashcards) {
    return <FlashcardDeck initialCards={flashcards} />
  }

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
  const { user } = useAuth()

  const SESSIONS_STORAGE_KEY =
    `kf_sessions_${user?.email || 'guest'}`
  const [searchParams] = useSearchParams()
  const sessionUrlParam = searchParams.get('session')
  const highlightParam = searchParams.get('highlight')
  const attachDocParam = searchParams.get('attachDoc')
  const attachDocNameParam = searchParams.get('attachDocName')

  const [sessions, setSessions] = useState(() =>
    loadSessions(SESSIONS_STORAGE_KEY)
  )
  const [activeId, setActiveId] =
    useState(() =>
      sessionUrlParam ||
      loadSessions(SESSIONS_STORAGE_KEY)[0]?.id
    )
  const [mode, setMode] = useState('CHAT')
  const [input, setInput] = useState('')
  const [contextDocs, setContextDocs] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDocPicker, setShowDocPicker] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('kf_sidebar_collapsed') === 'true'
  })
  const [vaultCollapsed, setVaultCollapsed] = useState(() => {
    return localStorage.getItem('kf_vault_collapsed') === 'true'
  })

  const bottomRef = useRef(null)

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('kf_sidebar_collapsed', String(next))
      return next
    })
  }

  const toggleVaultCollapse = () => {
    setVaultCollapsed(prev => {
      const next = !prev
      localStorage.setItem('kf_vault_collapsed', String(next))
      return next
    })
  }

  useEffect(() => {
    const sync = () =>
      setSessions(loadSessions(SESSIONS_STORAGE_KEY))
    window.addEventListener('storage', sync)
    window.addEventListener('kf_sessions_updated', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('kf_sessions_updated', sync)
    }
  }, [SESSIONS_STORAGE_KEY])

  const activeSession = sessions.find(s => s.id === activeId) || {
    id: activeId || `conv-${Date.now()}`,
    name: 'General Chat',
    messages: [],
    createdAt: new Date().toISOString(),
  }

  useEffect(() => {
    documentApi.getAll().then(res => {
      const list = (res?.data || []).map(normalizeDoc).filter(Boolean)
      setDocuments(list)
    }).catch(() => { })
  }, [])

  useEffect(() => {
    if (sessionUrlParam) {
      const current = loadSessions(SESSIONS_STORAGE_KEY)
      setSessions(current)
      setActiveId(sessionUrlParam)
    }
  }, [sessionUrlParam])

  // Auto-attach document when navigating from Documents page via 'Open in Chat'
  useEffect(() => {
    if (attachDocParam && attachDocNameParam) {
      const doc = { id: attachDocParam, fileName: decodeURIComponent(attachDocNameParam) }
      setContextDocs(prev => {
        const alreadyAttached = prev.some(d => d.id === doc.id)
        return alreadyAttached ? prev : [...prev, doc]
      })
      // Expand the vault panel so user can see attached docs
      setVaultCollapsed(false)
    }
  }, [attachDocParam, attachDocNameParam])

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
            saveSessions(SESSIONS_STORAGE_KEY, updated)
            return updated
          })
        }
      }).catch(() => { })
    }
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages, loading])

  const createNewChat = () => {
    const newId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newSess = { id: newId, name: 'General Chat', messages: [], createdAt: new Date().toISOString() }
    const updated = [newSess, ...sessions]
    setSessions(updated)
    saveSessions(SESSIONS_STORAGE_KEY, updated)
    setActiveId(newId)
  }

  const deleteSession = (id) => {
    const updated = sessions.filter(s => s.id !== id)
    const next = updated.length > 0 ? updated : [createDefaultSession()]
    setSessions(next)
    saveSessions(SESSIONS_STORAGE_KEY, next)
    if (activeId === id) setActiveId(next[0].id)
  }

  const renameSession = (id, newName) => {
    const updated = sessions.map(s => s.id === id ? { ...s, name: newName } : s)
    setSessions(updated)
    saveSessions(SESSIONS_STORAGE_KEY, updated)
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
      promptType: mode,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const updatedMsgs = [...(activeSession.messages || []), userMsg]

    let title = activeSession.name
    if (activeSession.messages.length === 0 && title === 'General Chat') {
      title = promptToUse.slice(0, 28)
    }

    const updatedSessions = sessions.map(s =>
      s.id === activeId ? { ...s, name: title, messages: updatedMsgs } : s
    )
    setSessions(updatedSessions)
    saveSessions(SESSIONS_STORAGE_KEY, updatedSessions)

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
        promptType: mode,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      const finalMsgs = [...updatedMsgs, botMsg]
      const finalSessions = sessions.map(s =>
        s.id === activeId ? { ...s, name: title, messages: finalMsgs } : s
      )
      setSessions(finalSessions)
      saveSessions(SESSIONS_STORAGE_KEY, finalSessions)
    } catch (err) {
      console.error('Chat API error:', err?.response?.data || err?.message || err)
      const backendMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Unknown error'
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ Failed to fetch response: ${backendMsg}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      const finalMsgs = [...updatedMsgs, errorMsg]
      const finalSessions = sessions.map(s =>
        s.id === activeId ? { ...s, name: title, messages: finalMsgs } : s
      )
      setSessions(finalSessions)
      saveSessions(SESSIONS_STORAGE_KEY, finalSessions)
    } finally {
      setLoading(false)
    }
  }

  const activeModeObj = MODES.find(m => m.key === mode) || MODES[0]
  const displayTitle = mode === 'CHAT' ? (activeSession?.name || 'General Chat') : activeModeObj.label

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── CENTER WORKSPACE: CHAT CONTENT & INPUT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>

        {/* Top Header & Mode Tabs */}
        <div style={{
          padding: '10px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto', flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', minWidth: 100, display: 'flex', alignItems: 'center', gap: 6 }}>
            {mode !== 'CHAT' && <Sparkles size={14} style={{ color: 'var(--accent)' }} />}
            {displayTitle}
          </h2>

          <div style={{ height: 16, width: 1, background: 'var(--border)', flexShrink: 0 }} />

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {MODES.map(m => (
              <ModeTab
                key={m.key}
                mode={m.key}
                active={mode === m.key}
                onClick={() => setMode(m.key)}
              />
            ))}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {(!activeSession?.messages || activeSession.messages.length === 0) ? (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', textCenter: 'center',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Sparkles size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
                How can KnowFlow AI assist you?
              </h3>
              <p style={{ fontSize: 13, color: 'var(--subtle)', maxWidth: 420, margin: '0 0 16px', textAlign: 'center' }}>
                Select a mode above or attach documents from your Vault to generate summaries, system design diagrams, flashcards, or quizzes.
              </p>
            </div>
          ) : (
            <>
              {activeSession.messages.map((m, idx) => (
                <MessageBubble
                  key={idx}
                  msg={m}
                  index={idx}
                  isHighlighted={highlightParam && m.content?.toLowerCase().includes(decodeURIComponent(highlightParam).toLowerCase())}
                />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Bottom Input Form */}
        <div style={{ padding: '12px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>

          {/* Active Mode Pill Badge */}
          {mode !== 'CHAT' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 6, background: 'var(--accent-bg)',
              border: '1px solid var(--accent-bd)', color: 'var(--accent)',
              fontSize: 11, fontWeight: 600, marginBottom: 8,
            }}>
              <Sparkles size={12} />
              <span>Active Mode: {activeModeObj.label}</span>
            </div>
          )}

          {/* Attached Context Docs Pills */}
          {contextDocs.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {contextDocs.map(doc => (
                <div key={doc.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '3px 8px', borderRadius: 6, background: 'var(--card)',
                  border: '1px solid var(--accent-bd)', fontSize: 11, color: 'var(--accent)', fontWeight: 500,
                }}>
                  <FileText size={12} />
                  <span>{doc.fileName}</span>
                  <button
                    onClick={() => toggleDocContext(doc)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={sendMessage} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowDocPicker(prev => !prev)}
              title="Attach documents from Vault"
              style={{
                position: 'absolute', left: 12, background: 'none', border: 'none',
                cursor: 'pointer', color: contextDocs.length > 0 ? 'var(--accent)' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, zIndex: 2,
              }}
            >
              <Paperclip size={16} />
            </button>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={mode !== 'CHAT' ? `Type prompt or press Enter to generate ${MODES.find(m => m.key === mode)?.label}...` : 'Type your message... (Enter to send, Shift+Enter for newline)'}
              rows={1}
              style={{
                width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
                color: 'var(--text)', fontSize: 13, padding: '12px 44px 12px 40px', outline: 'none',
                resize: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />

            <button
              type="submit"
              disabled={loading || (!input.trim() && mode === 'CHAT')}
              style={{
                position: 'absolute', right: 10, width: 32, height: 32, borderRadius: 8,
                border: 'none', background: (input.trim() || mode !== 'CHAT') ? 'var(--accent)' : 'var(--surface)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (input.trim() || mode !== 'CHAT') ? 'pointer' : 'not-allowed',
                opacity: (input.trim() || mode !== 'CHAT') ? 1 : 0.5, transition: 'all 0.15s', zIndex: 2,
              }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>

          <p style={{ fontSize: 10, color: 'var(--subtle)', textAlign: 'center', margin: '6px 0 0' }}>
            AI can make mistakes • KnowFlow AI Knowledge Vault
          </p>

        </div>

      </div>

      {/* ── RIGHT VAULT DOCUMENTS PANEL ── */}
      <div style={{
        width: vaultCollapsed ? 48 : 280, transition: 'width 0.2s ease', flexShrink: 0,
        background: 'var(--surface)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '12px 10px', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: vaultCollapsed ? 'center' : 'space-between', marginBottom: 12 }}>
          {!vaultCollapsed && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FolderArchive size={14} style={{ color: 'var(--accent)' }} /> Vault Documents
            </span>
          )}

          <button
            onClick={toggleVaultCollapse}
            title={vaultCollapsed ? 'Expand Vault Panel' : 'Collapse Vault Panel'}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: 6,
              cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {vaultCollapsed ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
          </button>
        </div>

        {!vaultCollapsed && (
          <p style={{ fontSize: 11, color: 'var(--subtle)', margin: '0 0 10px' }}>
            Attach study materials directly to your active chat context.
          </p>
        )}

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {documents.length === 0 ? (
            !vaultCollapsed && (
              <p style={{ fontSize: 11, color: 'var(--subtle)', textAlign: 'center', margin: '20px 0' }}>
                No documents uploaded in Vault.
              </p>
            )
          ) : (
            documents.map(doc => {
              const selected = contextDocs.some(d => d.id === doc.id)
              return vaultCollapsed ? (
                <button
                  key={doc.id}
                  onClick={() => toggleDocContext(doc)}
                  title={doc.fileName}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                    background: selected ? 'var(--accent-bg)' : 'transparent',
                    color: selected ? 'var(--accent)' : 'var(--muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: '0 auto',
                  }}
                >
                  <FileText size={14} />
                </button>
              ) : (
                <div
                  key={doc.id}
                  onClick={() => toggleDocContext(doc)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    borderRadius: 8, background: selected ? 'var(--accent-bg)' : 'var(--card)',
                    border: `1px solid ${selected ? 'var(--accent-bd)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <FileText size={13} style={{ color: selected ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }} />
                  <span style={{
                    flex: 1, fontSize: 11, fontWeight: selected ? 600 : 400,
                    color: selected ? 'var(--text)' : 'var(--muted)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {doc.fileName}
                  </span>
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
