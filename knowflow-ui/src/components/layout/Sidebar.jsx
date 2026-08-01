import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, MessageSquare, FileText,
  History, Settings, LogOut, ChevronRight, Shield, Key
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { userApi } from '../../api/client'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MessageSquare,   label: 'Chat',      path: '/chat' },
  { icon: FileText,        label: 'Documents',  path: '/documents' },
  { icon: History,         label: 'History',    path: '/history' },
  { icon: Settings,        label: 'Settings',   path: '/settings' },
]

const S = {
  sidebar: {
    width: 240,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 12px',
    borderRight: '1px solid var(--border)',
    background: 'var(--surface)',
    flexShrink: 0,
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '4px 10px', marginBottom: 28,
  },
  navBtn: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '9px 12px',
    borderRadius: 10, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, textAlign: 'left',
    background:   active ? 'var(--accent-bg)' : 'transparent',
    color:        active ? 'var(--accent)'    : 'var(--muted)',
    borderLeft:   active ? '2px solid var(--accent)' : '2px solid transparent',
    transition:   'all 0.15s',
  }),
  userBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', borderRadius: 10, marginBottom: 4,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--accent)', fontSize: 13, fontWeight: 600,
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '9px 12px', borderRadius: 10,
    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    background: 'transparent', color: 'var(--muted)', transition: 'all 0.15s',
  },
}

export default function Sidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout } = useAuth()
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false)

  useEffect(() => {
    userApi.getApiKey().then(res => {
      if (res?.data) setApiKeyConfigured(res.data.isConfigured)
    }).catch(() => {})
  }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside style={S.sidebar}>
      {/* Brand */}
      <div style={S.brand}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={16} style={{ color: 'var(--accent)' }} strokeWidth={1.5} />
        </div>
        <div>
          <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15 }}>KnowFlow</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 15 }}> AI</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname.startsWith(path)
          return (
            <motion.button
              key={path}
              whileHover={{ x: active ? 0 : 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(path)}
              style={S.navBtn(active)}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.5} />
              <span>{label}</span>
              {active && <ChevronRight size={13} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
            </motion.button>
          )
        })}
      </nav>

      {/* User & API Key Status */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          onClick={() => navigate('/settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
            borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-bd)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: apiKeyConfigured ? 'var(--success)' : '#fbbf24', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', flex: 1 }}>
            {apiKeyConfigured ? 'API Key Active' : 'Set OpenAI Key'}
          </span>
          <Key size={12} style={{ color: 'var(--muted)' }} />
        </div>

        <div style={S.userBox}>
          <div style={S.avatar}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</p>
          </div>
        </div>
        <motion.button
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          style={S.logoutBtn}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={16} strokeWidth={1.5} />
          <span>Sign Out</span>
        </motion.button>
      </div>
    </aside>
  )
}
