import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, MessageSquare, FileText,
  History, Settings, LogOut, ChevronRight, Shield,
  ChevronsLeft, ChevronsRight, Plus, Trash2, PenSquare, Check, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

import { chatApi } from '../../api/client'
import { getEffectivePromptType } from '../../pages/history/HistoryPage'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: History, label: 'History', path: '/history' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

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

    if (raw) {
      const parsed = JSON.parse(raw)

      if (parsed && parsed.length > 0) {
        return parsed
      }
    }
  } catch { }

  return [createDefaultSession()]
}

function mergeSessions(localSessions, dbSessions) {
  const map = new Map()

  // 1. Preserve local sessions first (newly created chats or active unsaved streams)
  if (Array.isArray(localSessions)) {
    localSessions.forEach(s => {
      if (s && s.id) map.set(String(s.id).trim(), s)
    })
  }

  // 2. Merge DB sessions
  if (Array.isArray(dbSessions)) {
    dbSessions.forEach(dbS => {
      if (!dbS || !dbS.id) return
      const key = String(dbS.id).trim()
      if (!map.has(key)) {
        map.set(key, dbS)
      } else {
        const localS = map.get(key)
        const localMsgs = localS.messages || []
        const dbMsgs = dbS.messages || []
        map.set(key, {
          ...dbS,
          name: (localS.name && localS.name !== 'General Chat') ? localS.name : dbS.name,
          messages: localMsgs.length >= dbMsgs.length ? localMsgs : dbMsgs,
          createdAt: dbS.createdAt || localS.createdAt,
        })
      }
    })
  }

  return Array.from(map.values())
}

function saveSessions(storageKey, sessions) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(sessions))
    window.dispatchEvent(new Event('kf_sessions_updated'))
  } catch { }
}

export default function Sidebar() {

  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const activeSessionIdFromUrl = searchParams.get('session')

  const { user, logout } = useAuth()

  const STORAGE_KEY = `kf_sessions_${user?.email || 'guest'}`

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('kf_sidebar_collapsed') === 'true'
  )

  const [sessions, setSessions] = useState(() =>
    loadSessions(STORAGE_KEY)
  )

  const [renamingId, setRenamingId] = useState(null)
  const [renameInput, setRenameInput] = useState('')

  useEffect(() => {
    if (!user) return
    chatApi.history().then(res => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const sessionMap = new Map()
        res.data.forEach(item => {
          if (!item) return
          const convId = item.conversationId || 'unknown'
          const itemMode = getEffectivePromptType(item)
          const formattedTime = item.createdAt
            ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '00:00'

          const userMsg = item.prompt ? { role: 'user', content: item.prompt, time: formattedTime, promptType: itemMode } : null
          const botMsg = item.response ? { role: 'assistant', content: item.response, time: formattedTime, promptType: itemMode } : null

          if (sessionMap.has(convId)) {
            const sess = sessionMap.get(convId)
            if (userMsg) sess.messages.push(userMsg)
            if (botMsg) sess.messages.push(botMsg)
          } else {
            sessionMap.set(convId, {
              id: convId,
              name: item.prompt ? item.prompt.slice(0, 28) : 'General Chat',
              messages: [
                ...(userMsg ? [userMsg] : []),
                ...(botMsg ? [botMsg] : []),
              ],
              createdAt: item.createdAt || new Date().toISOString(),
            })
          }
        })
        const fetched = Array.from(sessionMap.values())
        if (fetched.length > 0) {
          setSessions(prev => {
            const merged = mergeSessions(prev, fetched)
            saveSessions(STORAGE_KEY, merged)
            return merged
          })
        }
      }
    }).catch(() => {})
  }, [user, STORAGE_KEY])

  useEffect(() => {
    const sync = () => {
      setSessions(loadSessions(STORAGE_KEY))
    }

    window.addEventListener('storage', sync)
    window.addEventListener('kf_sessions_updated', sync)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('kf_sessions_updated', sync)
    }
  }, [STORAGE_KEY])

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('kf_sidebar_collapsed', String(next))
      return next
    })
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const createNewChat = () => {
    const newId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newSess = { id: newId, name: 'General Chat', messages: [], createdAt: new Date().toISOString() }
    const updated = [newSess, ...sessions]
    setSessions(updated)
    saveSessions(STORAGE_KEY, updated)
    navigate(`/chat?session=${newId}`)
  }

  const handleSelectSession = (id) => {
    navigate(`/chat?session=${id}`)
  }

  const handleSaveRename = (id) => {
    if (renameInput.trim()) {
      const updated = sessions.map(s => s.id === id ? { ...s, name: renameInput.trim() } : s)
      setSessions(updated)
      saveSessions(STORAGE_KEY, updated)
    }
    setRenamingId(null)
  }

  const handleDeleteSession = (e, id) => {
    e.stopPropagation()
    const updated = sessions.filter(s => s.id !== id)
    const next = updated.length > 0 ? updated : [createDefaultSession()]
    setSessions(next)
    saveSessions(STORAGE_KEY, next)
    if (activeSessionIdFromUrl === id || location.pathname.startsWith('/chat')) {
      navigate(`/chat?session=${next[0].id}`)
    }
  }

  const isChatRoute = location.pathname.startsWith('/chat')

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 10px',
        borderRight: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Brand & Collapse Toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
        padding: '4px 6px', marginBottom: 20, gap: 8,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={16} style={{ color: 'var(--accent)' }} strokeWidth={1.5} />
            </div>
            <div style={{ whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15 }}>KnowFlow</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 15 }}> AI</span>
            </div>
          </div>
        )}

        <button
          onClick={toggleCollapse}
          title={collapsed ? 'Expand Navbar' : 'Collapse Navbar'}
          style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--muted)', flexShrink: 0, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--accent-bd)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname.startsWith(path)
          const isChat = path === '/chat'

          return (
            <div key={path} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <motion.button
                title={collapsed ? label : ''}
                whileHover={{ x: active ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (isChat && sessions.length > 0) {
                    navigate(`/chat?session=${activeSessionIdFromUrl || sessions[0].id}`)
                  } else {
                    navigate(path)
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center',
                  justify: collapsed ? 'center' : 'flex-start',
                  gap: 10, width: '100%', padding: '9px 12px',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, textAlign: 'left',
                  background: active ? 'var(--accent-bg)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.5} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
                {!collapsed && active && <ChevronRight size={13} style={{ marginLeft: 'auto', color: 'var(--accent)', flexShrink: 0 }} />}
              </motion.button>

              {/* Nested Chat Section when on Chat Route */}
              {isChat && isChatRoute && !collapsed && (
                <div style={{
                  marginLeft: 12, paddingLeft: 10, borderLeft: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: 6, margin: '4px 0 8px',
                }}>
                  {/* New Chat Button */}
                  <button
                    onClick={createNewChat}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '7px 10px', borderRadius: 8,
                      border: '1px dashed var(--accent-bd)', background: 'var(--accent-bg)',
                      color: 'var(--accent)', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                  >
                    <Plus size={14} />
                    <span>New Chat</span>
                  </button>

                  {/* Recent Chats Header */}
                  <p style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--subtle)',
                    textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 2px 4px',
                  }}>
                    Recent Chats
                  </p>

                  {/* Scrollable Chat Sessions List */}
                  <div style={{
                    maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2,
                    paddingRight: 2,
                  }}>
                    {sessions.map(s => {
                      const isActiveSession = (activeSessionIdFromUrl === s.id) || (!activeSessionIdFromUrl && s.id === sessions[0]?.id)
                      const isRenamingThis = renamingId === s.id

                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSelectSession(s.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                            fontSize: 12, fontWeight: isActiveSession ? 600 : 400,
                            background: isActiveSession ? 'var(--card)' : 'transparent',
                            color: isActiveSession ? 'var(--text)' : 'var(--muted)',
                            border: `1px solid ${isActiveSession ? 'var(--border)' : 'transparent'}`,
                            transition: 'all 0.12s', position: 'relative',
                          }}
                          onMouseEnter={e => {
                            if (!isActiveSession) e.currentTarget.style.background = 'var(--card-hover)';
                            const actions = e.currentTarget.querySelector('.chat-actions');
                            if (actions) actions.style.opacity = '1';
                          }}
                          onMouseLeave={e => {
                            if (!isActiveSession) e.currentTarget.style.background = 'transparent';
                            const actions = e.currentTarget.querySelector('.chat-actions');
                            if (actions) actions.style.opacity = '0';
                          }}
                        >
                          <MessageSquare size={13} style={{ color: isActiveSession ? 'var(--accent)' : 'var(--subtle)', flexShrink: 0 }} />

                          {isRenamingThis ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
                              <input
                                value={renameInput}
                                onChange={e => setRenameInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(s.id); if (e.key === 'Escape') setRenamingId(null) }}
                                autoFocus
                                onClick={e => e.stopPropagation()}
                                style={{
                                  width: '100%', fontSize: 11, background: 'var(--surface)', border: '1px solid var(--accent)',
                                  borderRadius: 4, color: 'var(--text)', padding: '2px 4px', outline: 'none',
                                }}
                              />
                              <button onClick={(e) => { e.stopPropagation(); handleSaveRename(s.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', padding: 1 }}><Check size={12} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setRenamingId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 1 }}><X size={12} /></button>
                            </div>
                          ) : (
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.name}
                            </span>
                          )}

                          {!isRenamingThis && (
                            <div className="chat-actions" style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); setRenamingId(s.id); setRenameInput(s.name) }}
                                title="Rename Chat"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--subtle)', padding: 1 }}
                              >
                                <PenSquare size={11} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteSession(e, s.id)}
                                title="Delete Chat"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--subtle)', padding: 1 }}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 10,
          padding: '8px 10px', borderRadius: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', fontSize: 13, fontWeight: 600,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</p>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : ''}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 10,
            width: '100%', padding: '9px 12px', borderRadius: 10,
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: 'transparent', color: 'var(--muted)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sign Out</span>}
        </motion.button>
      </div>
    </motion.aside>
  )
}
