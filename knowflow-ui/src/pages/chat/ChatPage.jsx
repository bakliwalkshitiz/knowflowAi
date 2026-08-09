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
  SUMMARY: 'Summarize the document or topic concisely in key bullet points.',
  SYSTEM_DESIGN: 'Generate a complete System Design document including LLD (Mermaid classDiagram) and HLD (Mermaid graph TD architecture diagram).',
  FLASHCARD: 'Generate 5 to 10 high quality flashcards covering the key concepts.',
  QUIZ: 'Generate 5 interactive quiz questions with correct answers and explanations.',
  INTERVIEW: 'Generate 5 mock interview questions with expert sample answers.',
  MINDMAP: 'Generate a visual Mind Map diagram (using Mermaid mindmap syntax) with central topic, main branches, and entity attributes.',
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
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].front && parsed[0].back) {
        return parsed.map((c, i) => ({
          id: c.id || i + 1,
          front: c.front || `Flashcard ${i + 1}`,
          back: c.back || 'Answer',
        }))
      }
    }
  } catch (e) { }

  const cards = []
  const frontBackRegex = /(?:Card\s*\d+:?|Front:?|\d+\.\s*Front:?)\s*([\s\S]*?)(?:Back:?|\d+\.\s*Back:?)\s*([\s\S]*?)(?=(?:Card\s*\d+:?|Front:?|\d+\.\s*Front:?|$))/gi
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
      {/* Top Banner Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 20px', borderRadius: 24, background: 'rgba(251, 146, 60, 0.15)',
          border: '1px solid rgba(251, 146, 60, 0.4)', color: '#fb923c', fontSize: 13, fontWeight: 700,
        }}>
          <BookOpen size={16} />
          <span>Study Flashcards</span>
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

/* ────────────────── QUIZ PARSER & INTERACTIVE COMPONENT ────────────────── */
function parseQuiz(text) {
  if (!text) return null
  let questions = []

  // 1. Try parsing JSON block
  try {
    const jsonMatch = text.match(/```json([\s\S]*?)```/) || text.match(/\[\s*\{[\s\S]*\}\s*\]/)
    if (jsonMatch) {
      const raw = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(raw.trim())
      if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].question || parsed[0].q)) {
        questions = parsed.map((q, i) => {
          let opts = Array.isArray(q.options) ? q.options : (Array.isArray(q.choices) ? q.choices : [])
          let correctIdx = typeof q.correctIndex === 'number' ? q.correctIndex : (typeof q.correctOption === 'number' ? q.correctOption : 0)

          // Failsafe: Ensure options exist
          if (!opts || opts.length < 2) {
            const mainAns = (q.answer || q.correctAnswer || q.explanation || 'Correct Answer').slice(0, 80)
            opts = [
              mainAns,
              'Incorrect concept statement (does not apply here)',
              'Partial concept (missing required configuration)',
              'None of the above options'
            ]
            correctIdx = 0
          }

          return {
            id: i + 1,
            question: q.question || q.q || `Question ${i + 1}`,
            options: opts,
            correctIndex: correctIdx,
            explanation: q.explanation || q.answer || 'Detailed explanation of the correct option.',
          }
        })
        return questions
      }
    }
  } catch (e) { }

  // 2. Regex fallback for text formatted questions (e.g. Question 1: ... A) ... B) ... C) ... D) ...)
  const qBlocks = text.split(/(?=(?:Q\d+:?|Question\s*\d+:?|\d+\.\s*Question:?|\d+\.\s+[A-Z]))/gi).filter(b => b.trim().length > 10)

  qBlocks.forEach((block, i) => {
    const qMatch = block.match(/(?:Q\d+:?|Question\s*\d+:?|\d+\.\s*Question:?|\d+\.)?\s*([\s\S]*?)(?=(?:A[\).\:]|Option A|\n\s*[A-D][\)\.]|Answer:?|EXPLANATION:?|$))/i)
    const qText = qMatch ? qMatch[1].trim() : ''

    if (qText) {
      const optRegex = /(?:[A-D][\)\.]|Option\s+[A-D]:?)\s*([^\n]+)/gi
      const extractedOpts = []
      let optM
      while ((optM = optRegex.exec(block)) !== null) {
        if (optM[1] && optM[1].trim()) {
          extractedOpts.push(optM[1].trim())
        }
      }

      const ansMatch = block.match(/(?:Answer:?|Correct Answer:?|EXPLANATION:?)\s*([\s\S]*?)$/i)
      const expText = ansMatch ? ansMatch[1].trim() : 'Review concept for details.'

      let opts = extractedOpts
      let correctIdx = 0

      const letterMatch = block.match(/(?:Answer|Correct Option):\s*([A-D])/i)
      if (letterMatch) {
        const letter = letterMatch[1].toUpperCase()
        correctIdx = letter.charCodeAt(0) - 65
      }

      if (!opts || opts.length < 2) {
        const mainAns = expText.split('\n')[0].replace(/```[\s\S]*?```/g, '').trim().slice(0, 90) || 'Correct concept implementation'
        opts = [
          mainAns,
          'Incorrect approach (causes runtime errors or invalid query logic)',
          'Sub-optimal approach (does not scale in production databases)',
          'None of the above'
        ]
        correctIdx = 0
      }

      questions.push({
        id: i + 1,
        question: qText.replace(/```[\s\S]*?```/g, '').trim(),
        options: opts,
        correctIndex: correctIdx >= 0 && correctIdx < opts.length ? correctIdx : 0,
        explanation: expText,
      })
    }
  })

  return questions.length > 0 ? questions : null
}

function QuizDeck({ initialQuestions }) {
  const [questions] = useState(initialQuestions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  if (!questions || questions.length === 0) return null

  const currentQ = questions[currentIndex] || questions[0]
  const total = questions.length
  const hasOptions = Array.isArray(currentQ.options) && currentQ.options.length > 0

  const handleSelectOption = (qId, optionIdx) => {
    if (submitted) return
    setUserAnswers(prev => ({ ...prev, [qId]: optionIdx }))
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctIndex) {
        correct++
      }
    })
    return correct
  }

  const score = calculateScore()
  const percentage = Math.round((score / total) * 100)

  return (
    <div style={{ marginTop: 12, marginBottom: 12, maxWidth: 640 }}>
      {/* Top Banner Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 20px', borderRadius: 24, background: 'rgba(52, 211, 153, 0.15)',
          border: '1px solid rgba(52, 211, 153, 0.4)', color: '#34d399', fontSize: 13, fontWeight: 700,
        }}>
          <HelpCircle size={16} />
          <span>Interactive Quiz</span>
        </div>
      </div>

      {/* Submitted Score Summary Banner */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: '16px 20px', borderRadius: 16, marginBottom: 16,
            background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
            border: '1.5px solid rgba(52, 211, 153, 0.4)', display: 'flex', alignItems: 'center',
            justify: 'space-between', gap: 16,
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quiz Results
            </span>
            <h4 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '2px 0 0' }}>
              Score: {score} / {total} ({percentage}%)
            </h4>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
              {percentage >= 80 ? '🎉 Excellent performance! Mastered this topic.' : percentage >= 50 ? '👍 Good attempt! Review the explanations below.' : '📚 Keep practicing! Re-read the explanations to improve.'}
            </p>
          </div>

          <button
            onClick={() => { setSubmitted(false); setUserAnswers({}) }}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: '#34d399', color: '#000', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            Retake Quiz
          </button>
        </motion.div>
      )}

      {/* Question Card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', marginBottom: 14,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          background: 'var(--card)', padding: '10px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
            Question {currentIndex + 1} of {total}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)', padding: '2px 8px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border-sub)' }}>
            {Object.keys(userAnswers).length} / {total} Answered
          </span>
        </div>

        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 16px', lineHeight: 1.5 }}>
            {currentQ.question}
          </p>

          {/* Multiple Choice Options */}
          {hasOptions ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = userAnswers[currentQ.id] === optIdx
                const isCorrect = currentQ.correctIndex === optIdx
                const optionLetter = String.fromCharCode(65 + optIdx)

                let bg = 'var(--card)'
                let border = '1px solid var(--border)'
                let textColor = 'var(--text)'

                if (submitted) {
                  if (isCorrect) {
                    bg = 'rgba(52, 211, 153, 0.15)'
                    border = '1.5px solid #34d399'
                    textColor = '#34d399'
                  } else if (isSelected && !isCorrect) {
                    bg = 'rgba(248, 113, 113, 0.15)'
                    border = '1.5px solid #f87171'
                    textColor = '#f87171'
                  }
                } else if (isSelected) {
                  bg = 'var(--accent-bg)'
                  border = '1.5px solid var(--accent)'
                  textColor = 'var(--accent)'
                }

                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      borderRadius: 12, background: bg, border: border,
                      cursor: submitted ? 'default' : 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                      background: isSelected ? (submitted ? (isCorrect ? '#34d399' : '#f87171') : 'var(--accent)') : 'var(--surface)',
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: isSelected ? '#fff' : 'var(--muted)',
                    }}>
                      {optionLetter}
                    </div>

                    <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: textColor, flex: 1 }}>
                      {opt}
                    </span>

                    {submitted && isCorrect && <Check size={16} style={{ color: '#34d399' }} />}
                    {submitted && isSelected && !isCorrect && <X size={16} style={{ color: '#f87171' }} />}
                  </div>
                )
              })}
            </div>
          ) : null}

          {/* Explanation Banner (Shows if submitted or no options) */}
          {(submitted || !hasOptions) && currentQ.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '12px 16px', borderRadius: 12, background: 'rgba(52, 211, 153, 0.08)',
                border: '1px solid rgba(52, 211, 153, 0.3)', color: 'var(--text)', fontSize: 13, lineHeight: 1.5,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Explanation & Answer:
              </span>
              {currentQ.explanation}
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation & Submit Controls */}
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

        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px',
              borderRadius: 8, border: 'none', background: '#34d399',
              color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(52, 211, 153, 0.3)', transition: 'all 0.15s',
            }}
          >
            <Check size={14} /> Submit Quiz
          </button>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>
            Submitted ({score}/{total})
          </span>
        )}

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

/* ────────────────── INTERVIEW SCENARIO PARSER & COMPONENT ────────────────── */
function parseInterview(text) {
  if (!text) return null
  try {
    const jsonMatch = text.match(/```json([\s\S]*?)```/) || text.match(/\[\s*\{[\s\S]*\}\s*\]/)
    if (jsonMatch) {
      const raw = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(raw.trim())
      if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].question || parsed[0].q)) {
        return parsed.map((q, i) => ({
          id: i + 1,
          question: q.question || q.q || `Interview Question ${i + 1}`,
          topic: q.topic || q.category || 'Technical Interview',
          difficulty: q.difficulty || 'Medium',
          modelAnswer: q.modelAnswer || q.answer || q.response || 'Model response.',
          talkingPoints: Array.isArray(q.talkingPoints) ? q.talkingPoints : (Array.isArray(q.keyPoints) ? q.keyPoints : []),
        }))
      }
    }
  } catch (e) { }

  const questions = []
  const qRegex = /(?:Q\d+:?|Question\s*\d+:?|\d+\.\s*Question:?)\s*([\s\S]*?)(?:A\d+:?|Answer:?|Model Answer:?)\s*([\s\S]*?)(?=(?:Q\d+:?|Question\s*\d+:?|\d+\.\s*Question:?|$))/gi
  let match
  while ((match = qRegex.exec(text)) !== null) {
    if (match[1] && match[2] && match[1].trim().length > 0) {
      questions.push({
        id: questions.length + 1,
        question: match[1].trim(),
        topic: 'Technical Interview',
        difficulty: 'Medium',
        modelAnswer: match[2].trim(),
        talkingPoints: [],
      })
    }
  }
  return questions.length > 0 ? questions : null
}

function InterviewDeck({ initialQuestions }) {
  const [questions] = useState(initialQuestions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [userPracticeText, setUserPracticeText] = useState({})

  if (!questions || questions.length === 0) return null

  const currentQ = questions[currentIndex] || questions[0]
  const total = questions.length

  return (
    <div style={{ marginTop: 12, marginBottom: 12, maxWidth: 640 }}>
      {/* Top Banner Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 20px', borderRadius: 24, background: 'rgba(251, 113, 133, 0.15)',
          border: '1px solid rgba(251, 113, 133, 0.4)', color: '#fb7185', fontSize: 13, fontWeight: 700,
        }}>
          <Mic size={16} />
          <span>Mock Technical Interview</span>
        </div>
      </div>

      {/* Scenario Card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', marginBottom: 14,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}>
        {/* Header Tags */}
        <div style={{
          background: 'var(--card)', padding: '10px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
            Question {currentIndex + 1} of {total}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(251, 113, 133, 0.12)', border: '1px solid rgba(251, 113, 133, 0.3)', color: '#fb7185' }}>
              {currentQ.topic}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              {currentQ.difficulty}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 16px', lineHeight: 1.5 }}>
            {currentQ.question}
          </p>

          {/* Candidate Practice Textarea */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Practice Answer:
            </label>
            <textarea
              value={userPracticeText[currentQ.id] || ''}
              onChange={e => setUserPracticeText(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
              placeholder="Type your talking points or answer here before revealing the expert model answer..."
              rows={3}
              style={{
                width: '100%', background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 10, color: 'var(--text)', fontSize: 13,
                outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Reveal Model Answer Button */}
          <button
            onClick={() => setShowAnswer(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, border: '1px solid rgba(251, 113, 133, 0.4)',
              background: 'rgba(251, 113, 133, 0.12)', color: '#fb7185',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Sparkles size={14} />
            {showAnswer ? 'Hide Model Answer' : 'Reveal Model Answer & Key Concepts'}
          </button>

          {/* Model Answer Details */}
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{
                padding: '14px 16px', borderRadius: 12, background: 'rgba(96, 165, 250, 0.08)',
                border: '1px solid rgba(96, 165, 250, 0.3)', color: 'var(--text)', fontSize: 13, lineHeight: 1.6,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Expert Model Answer:
                </span>
                {currentQ.modelAnswer}
              </div>

              {currentQ.talkingPoints && currentQ.talkingPoints.length > 0 && (
                <div style={{
                  padding: '14px 16px', borderRadius: 12, background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Must-Mention Talking Points:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                    {currentQ.talkingPoints.map((pt, pIdx) => (
                      <li key={pIdx} style={{ marginBottom: 4 }}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 12, background: 'var(--surface)',
        border: '1px solid var(--border-sub)',
      }}>
        <button
          onClick={() => { setCurrentIndex(prev => Math.max(0, prev - 1)); setShowAnswer(false) }}
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
          {currentIndex + 1} / {total}
        </span>

        <button
          onClick={() => { setCurrentIndex(prev => Math.min(total - 1, prev + 1)); setShowAnswer(false) }}
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

function MessageContent({ text, promptType }) {
  if (!text) return null

  // If message was generated in FLASHCARD mode or matches flashcard format
  if (promptType === 'FLASHCARD') {
    const flashcards = parseFlashcards(text)
    if (flashcards) return <FlashcardDeck initialCards={flashcards} />
  }

  // If message was generated in QUIZ mode or matches quiz format
  if (promptType === 'QUIZ') {
    const quiz = parseQuiz(text)
    if (quiz) return <QuizDeck initialQuestions={quiz} />
  }

  // If message was generated in INTERVIEW mode
  if (promptType === 'INTERVIEW') {
    const interview = parseInterview(text)
    if (interview) return <InterviewDeck initialQuestions={interview} />
  }

  // Fallback checks for un-tagged messages
  if (!promptType || promptType === 'CHAT') {
    const flashcards = parseFlashcards(text)
    if (flashcards) return <FlashcardDeck initialCards={flashcards} />

    const quiz = parseQuiz(text)
    if (quiz) return <QuizDeck initialQuestions={quiz} />

    const interview = parseInterview(text)
    if (interview) return <InterviewDeck initialQuestions={interview} />
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
        {isUser ? (
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</p>
        ) : (
          <MessageContent text={msg.content} promptType={msg.promptType} />
        )}
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
  const fileInputRef = useRef(null)

  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docUploadError, setDocUploadError] = useState('')
  const [docUploadSuccess, setDocUploadSuccess] = useState('')

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingDoc(true)
    setDocUploadError('')
    setDocUploadSuccess('')

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await documentApi.upload(fd)

      const newDocId = res.data?.id || res.data?.documentId
      const newDocName = res.data?.fileName || file.name

      // Refresh documents list
      const docsRes = await documentApi.getAll().catch(() => null)
      if (docsRes?.data) {
        const list = docsRes.data.map(normalizeDoc).filter(Boolean)
        setDocuments(list)
      }

      // Auto attach to current context
      if (newDocId) {
        const newDocObj = { id: newDocId, fileName: newDocName }
        setContextDocs(prev => {
          const exists = prev.some(d => d.id === newDocObj.id)
          return exists ? prev : [...prev, newDocObj]
        })
      }

      setDocUploadSuccess(`"${file.name}" uploaded and attached to chat!`)
      setTimeout(() => setDocUploadSuccess(''), 5000)
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to upload document.'
      setDocUploadError(msg)
      setTimeout(() => setDocUploadError(''), 7000)
    } finally {
      setUploadingDoc(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
    setMode('CHAT')
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

          {/* Upload Status Banners */}
          {uploadingDoc && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 6, background: 'rgba(96, 165, 250, 0.12)',
              border: '1px solid rgba(96, 165, 250, 0.3)', color: '#60a5fa',
              fontSize: 11, fontWeight: 500, marginBottom: 8,
            }}>
              <Loader2 size={12} className="animate-spin" />
              <span>Uploading & embedding document...</span>
            </div>
          )}

          {docUploadSuccess && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 6, background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.3)', color: 'var(--success)',
              fontSize: 11, fontWeight: 500, marginBottom: 8,
            }}>
              <Check size={12} />
              <span>{docUploadSuccess}</span>
            </div>
          )}

          {docUploadError && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 6, background: 'rgba(248, 113, 113, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.3)', color: 'var(--danger)',
              fontSize: 11, fontWeight: 500, marginBottom: 8,
            }}>
              <AlertCircle size={12} />
              <span>{docUploadError}</span>
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

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
          />

          <form onSubmit={sendMessage} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingDoc}
              title="Upload document from computer & attach to chat context"
              style={{
                position: 'absolute', left: 12, background: 'none', border: 'none',
                cursor: uploadingDoc ? 'not-allowed' : 'pointer',
                color: contextDocs.length > 0 ? 'var(--accent)' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, zIndex: 2,
              }}
            >
              {uploadingDoc ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
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
