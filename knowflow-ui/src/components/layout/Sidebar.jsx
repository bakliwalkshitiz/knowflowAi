import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, MessageSquare, FileText,
  History, Settings, LogOut, ChevronRight, Shield,
  ChevronsLeft, ChevronsRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MessageSquare,   label: 'Chat',      path: '/chat' },
  { icon: FileText,        label: 'Documents',  path: '/documents' },
  { icon: History,         label: 'History',    path: '/history' },
  { icon: Settings,        label: 'Settings',   path: '/settings' },
]

export default function Sidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('kf_sidebar_collapsed') === 'true')

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('kf_sidebar_collapsed', String(next))
      return next
    })
  }

  const handleLogout = () => { logout(); navigate('/login') }

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
        padding: '4px 6px', marginBottom: 24, gap: 8,
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
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname.startsWith(path)
          return (
            <motion.button
              key={path}
              title={collapsed ? label : ''}
              whileHover={{ x: active ? 0 : 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(path)}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
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
