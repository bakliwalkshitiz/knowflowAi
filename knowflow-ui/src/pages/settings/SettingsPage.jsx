import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Check, Loader2, LogOut, AlertCircle } from 'lucide-react'
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

function Btn({ children, onClick, variant = 'primary', disabled = false, loading = false, style: s = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '9px 16px', borderRadius: 9, border: 'none',
    fontSize: 13, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1, transition: 'all 0.15s', ...s,
  }
  const styles = {
    primary: { background: disabled ? 'var(--card-hover)' : 'var(--accent)', color: disabled ? 'var(--muted)' : '#fff' },
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

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth()
  const { theme, toggle, isDark } = useTheme()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const isChanged = name.trim() !== '' && name.trim() !== (user?.name || '')

  const saveProfile = async () => {
    if (!isChanged || saving) return
    setSaving(true)
    setError('')
    try {
      const res = await userApi.updateProfile({ name: name.trim() })
      if (res?.data) {
        const updatedName = res.data.name || name.trim()
        updateUser({ name: updatedName })
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch (err) {
      console.error('Failed to save profile:', err)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ padding: '28px 24px', maxWidth: 620, margin: '0 auto', width: '100%' }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Manage your account and preferences</p>
      </motion.div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 14, padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, fontSize: 13, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile */}
      <div style={card}>
        <h2 style={sectionTitle}>Profile</h2>
        <p style={sectionSub}>Your account information</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
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
        <Btn onClick={saveProfile} disabled={!isChanged || saving} loading={saving}>
          {saved ? <><Check size={13} /> Saved!</> : 'Save Changes'}
        </Btn>
      </div>

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
            position: 'relative', padding: 0, transition: 'background 0.25s', flexShrink: 0,
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
