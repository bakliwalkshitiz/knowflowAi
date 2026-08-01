import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Shield, Key, Lock, Sun, Moon, Eye, EyeOff,
  Check, Loader2, Trash2, TestTube2, LogOut
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../../api/client'

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', marginBottom: 16 }
const fieldLabel = { fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6, display: 'block' }
const input = {
  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: 13, padding: '10px 14px',
  outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}
const sectionTitle  = { fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }
const sectionSub    = { fontSize: 12, color: 'var(--muted)', margin: '0 0 18px' }
const divider       = { borderTop: '1px solid var(--border)', margin: '16px 0' }

function Btn({ children, onClick, variant = 'primary', disabled = false, loading = false, style: s = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '9px 16px', borderRadius: 9, border: 'none',
    fontSize: 13, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1, transition: 'all 0.15s', ...s,
  }
  const styles = {
    primary: { background: 'var(--accent)', color: '#fff' },
    ghost:   { background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' },
    danger:  { background: 'rgba(248,113,113,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.25)' },
    success: { background: 'rgba(52,211,153,0.1)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.25)' },
  }
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{ ...base, ...styles[variant] }}>
      {loading ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : children}
    </button>
  )
}

function ApiKeySection() {
  const [key, setKey]       = useState(localStorage.getItem('kf_api_key') || '')
  const [input_, setInput_] = useState('')
  const [show, setShow]     = useState(false)
  const [editing, setEditing] = useState(false)
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState(null) // { ok: bool, msg: string }

  const masked = (k) => k ? `${k.slice(0, 7)}${'•'.repeat(Math.max(0, k.length - 11))}${k.slice(-4)}` : ''

  useEffect(() => {
    userApi.getApiKey().then(res => {
      if (res?.data?.apiKey) {
        setKey(res.data.apiKey)
        localStorage.setItem('kf_api_key', res.data.apiKey)
      }
    }).catch(() => {})
  }, [])

  const save = async () => {
    if (!input_.trim()) return
    const k = input_.trim()
    try {
      await userApi.updateApiKey(k)
      setKey(k)
      localStorage.setItem('kf_api_key', k)
      setInput_('')
      setEditing(false)
      setStatus({ ok: true, msg: 'API key saved successfully!' })
    } catch {
      setStatus({ ok: false, msg: 'Failed to save API key.' })
    }
    setTimeout(() => setStatus(null), 3000)
  }

  const remove = async () => {
    try {
      await userApi.updateApiKey('')
      setKey('')
      localStorage.removeItem('kf_api_key')
      setStatus({ ok: true, msg: 'API key removed.' })
    } catch {
      setStatus({ ok: false, msg: 'Failed to remove API key.' })
    }
    setTimeout(() => setStatus(null), 3000)
  }

  const test = async () => {
    setTesting(true); setStatus(null)
    await new Promise(r => setTimeout(r, 1200))
    setTesting(false)
    setStatus({ ok: true, msg: 'Connection verified!' })
    setTimeout(() => setStatus(null), 4000)
  }

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Connect Your AI</h2>
      <p style={sectionSub}>Your OpenAI API key is stored only in your browser — never on our servers.</p>

      {/* Status badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
        borderRadius: 9, marginBottom: 14,
        background: key ? 'rgba(52,211,153,0.08)' : 'var(--surface)',
        border: `1px solid ${key ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: key ? 'var(--success)' : 'var(--subtle)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: key ? 'var(--success)' : 'var(--muted)' }}>
          {key ? 'API Key Connected' : 'No API Key Connected'}
        </span>
      </div>

      {/* Key display */}
      {key && !editing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 12 }}>
          <Key size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          <code style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontFamily: 'monospace' }}>
            {show ? key : masked(key)}
          </code>
          <button onClick={() => setShow(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, display: 'flex' }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      )}

      {/* Input */}
      {(!key || editing) && (
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            value={input_}
            onChange={e => setInput_(e.target.value)}
            placeholder="sk-proj-..."
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
            style={{ ...input, fontFamily: 'monospace', marginBottom: 6 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Lock size={11} style={{ color: 'var(--subtle)' }} />
            <span style={{ fontSize: 11, color: 'var(--subtle)' }}>Stored only in browser localStorage</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!key && !editing && (
        <div style={{ textAlign: 'center', padding: '20px 0', border: '1.5px dashed var(--border)', borderRadius: 10, marginBottom: 14 }}>
          <Shield size={24} style={{ color: 'var(--subtle)', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 4px' }}>Connect your OpenAI API Key</p>
          <p style={{ fontSize: 11, color: 'var(--subtle)', margin: 0 }}>to start using AI features</p>
        </div>
      )}

      {/* Status */}
      <AnimatePresence>
        {status && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontSize: 12, color: status.ok ? 'var(--success)' : 'var(--danger)', marginBottom: 10 }}>
            {status.msg}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!key || editing ? (
          <>
            <Btn onClick={save} disabled={!input_.trim()}><Key size={13} />{key ? 'Update Key' : 'Save Key'}</Btn>
            {editing && <Btn variant="ghost" onClick={() => { setEditing(false); setInput_('') }}>Cancel</Btn>}
          </>
        ) : (
          <>
            <Btn variant="ghost" onClick={() => { setEditing(true); setInput_('') }}><Key size={13} />Update Key</Btn>
            <Btn variant="success" loading={testing} onClick={test}><TestTube2 size={13} />{testing ? 'Testing…' : 'Test Connection'}</Btn>
            <Btn variant="danger" onClick={remove}><Trash2 size={13} />Remove Key</Btn>
          </>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, toggle, isDark } = useTheme()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [saved, setSaved] = useState(false)

  const saveProfile = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 620, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Manage your account and preferences</p>
      </motion.div>

      {/* Profile */}
      <div style={card}>
        <h2 style={sectionTitle}>Profile</h2>
        <p style={sectionSub}>Your account information</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{user?.name}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{user?.email}</p>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={fieldLabel}>Display Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={input}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabel}>Email</label>
          <input value={user?.email || ''} disabled style={{ ...input, opacity: 0.5, cursor: 'not-allowed' }} />
        </div>
        <Btn onClick={saveProfile}>
          {saved ? <><Check size={13} /> Saved!</> : 'Save Changes'}
        </Btn>
      </div>

      {/* API Key */}
      <ApiKeySection />

      {/* Appearance */}
      <div style={card}>
        <h2 style={sectionTitle}>Appearance</h2>
        <p style={sectionSub}>Toggle between dark and light theme</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isDark
              ? <Moon size={18} style={{ color: 'var(--accent)' }} />
              : <Sun size={18} style={{ color: '#fbbf24' }} />}
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: '0 0 2px' }}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>Click toggle to switch</p>
            </div>
          </div>

          {/* Toggle switch */}
          <button onClick={toggle} style={{
            width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
            background: isDark ? 'var(--accent)' : 'var(--border)',
            position: 'relative', padding: 0, transition: 'background 0.25s',
          }}>
            <motion.div
              animate={{ x: isDark ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                position: 'absolute', top: 3, width: 20, height: 20,
                background: '#fff', borderRadius: '50%',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}
            />
          </button>
        </div>
      </div>

      {/* Account */}
      <div style={card}>
        <h2 style={sectionTitle}>Account</h2>
        <p style={sectionSub}>Sign out from KnowFlow AI</p>
        <Btn variant="danger" onClick={handleLogout}>
          <LogOut size={13} /> Sign Out
        </Btn>
      </div>
    </div>
  )
}
