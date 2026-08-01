import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, Mail, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

/* ── Vault Unlock Animation ── */
function VaultAnimation({ onComplete }) {
  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          {/* Outer ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '1px solid var(--accent-bd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Inner ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              style={{
                width: 84, height: 84, borderRadius: '50%',
                border: '1px solid var(--accent-bd)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {/* Shield */}
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
              >
                <motion.div
                  animate={{ boxShadow: ['0 0 0px rgba(79,114,247,0)', '0 0 36px rgba(79,114,247,0.5)', '0 0 0px rgba(79,114,247,0)'] }}
                  transition={{ delay: 0.8, duration: 1.2 }}
                  style={{ borderRadius: '50%', padding: 12 }}
                >
                  <Shield size={36} style={{ color: 'var(--accent)' }} strokeWidth={1.5} />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Spinning dashed ring */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            transition={{ delay: 0.3, duration: 2.4, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '1px dashed var(--border)',
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ textAlign: 'center' }}
        >
          <p style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px' }}>
            Unlocking vault
          </p>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ delay: 0.9 + i * 0.2, duration: 0.8, repeat: 2 }}
                onAnimationComplete={i === 2 ? onComplete : undefined}
                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function Field({ label, icon: Icon, type = 'text', error, ...props }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--subtle)' }} />}
        <input
          type={isPass ? (show ? 'text' : 'password') : type}
          style={{
            width: '100%', background: 'var(--card)', border: `1px solid ${error ? 'rgba(248,113,113,0.6)' : 'var(--border)'}`,
            borderRadius: 10, color: 'var(--text)', fontSize: 13,
            padding: `11px ${isPass ? 38 : 14}px 11px ${Icon ? 38 : 14}px`,
            outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
            fontFamily: 'Inter, sans-serif',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = error ? 'rgba(248,113,113,0.6)' : 'var(--border)'}
          {...props}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, display: 'flex' }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: 'var(--danger)', margin: '4px 0 0' }}>{error}</p>}
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [showVault, setShowVault] = useState(false)
  const [pendingData, setPendingData] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); setApiError('') }

  const validate = () => {
    const e = {}
    if (mode === 'register' && !form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (mode !== 'forgot') {
      if (!form.password) e.password = 'Password is required'
      else if (mode === 'register' && form.password.length < 6) e.password = 'At least 6 characters'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true); setApiError('')
    try {
      if (mode === 'login') {
        const res = await authApi.login({ email: form.email, password: form.password })
        setPendingData(res.data)
        setShowVault(true)
      } else if (mode === 'register') {
        await authApi.register({ name: form.name, email: form.email, password: form.password })
        setSuccessMsg('Account created! Please sign in.')
        setMode('login')
        setForm(f => ({ ...f, password: '' }))
      } else {
        setSuccessMsg('If this email exists, a reset link will be sent.')
      }
    } catch (err) {
      setApiError(err.response?.data?.error || err.response?.data?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleVaultDone = () => {
    if (pendingData) {
      login({ name: pendingData.name, email: pendingData.email }, pendingData.token)
      setTimeout(() => navigate('/dashboard'), 200)
    }
  }

  const switchMode = (m) => { setMode(m); setErrors({}); setApiError(''); setSuccessMsg('') }

  return (
    <>
      <AnimatePresence>
        {showVault && <VaultAnimation onComplete={handleVaultDone} />}
      </AnimatePresence>

      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
        {/* Background grid */}
        <div style={{
          position: 'fixed', inset: 0, opacity: 0.025, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{ width: '100%', maxWidth: 420, position: 'relative' }}
        >
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '36px 32px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            {/* Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
              <motion.div
                animate={{ boxShadow: ['0 0 0px rgba(79,114,247,0)', '0 0 24px rgba(79,114,247,0.35)', '0 0 0px rgba(79,114,247,0)'] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  width: 54, height: 54, borderRadius: 14, background: 'var(--accent-bg)',
                  border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: 18,
                }}
              >
                <Shield size={26} style={{ color: 'var(--accent)' }} strokeWidth={1.5} />
              </motion.div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create account' : 'Reset password'}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                {mode === 'login' ? 'Sign in to your vault' : mode === 'register' ? 'Start building your knowledge vault' : 'Enter your email to reset'}
              </p>
            </div>

            {/* Alerts */}
            <AnimatePresence>
              {successMsg && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginBottom: 14, padding: '11px 14px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 9, fontSize: 13, color: 'var(--success)' }}>
                  {successMsg}
                </motion.div>
              )}
              {apiError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginBottom: 14, padding: '11px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 9, fontSize: 13, color: 'var(--danger)' }}>
                  {apiError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {mode === 'register' && (
                <Field label="Full Name" icon={User} value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} placeholder="John Doe" />
              )}
              <Field label="Email" icon={Mail} type="email" value={form.email} onChange={e => set('email', e.target.value)} error={errors.email} placeholder="you@example.com" />
              {mode !== 'forgot' && (
                <Field label="Password" icon={Lock} type="password" value={form.password} onChange={e => set('password', e.target.value)} error={errors.password}
                  placeholder={mode === 'login' ? 'Enter your password' : 'At least 6 characters'} />
              )}

              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginBottom: 16, marginTop: -6 }}>
                  <button type="button" onClick={() => switchMode('forgot')}
                    style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Forgot password?
                  </button>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 14,
                  padding: '12px', borderRadius: 11, border: 'none', cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.75 : 1, transition: 'all 0.15s', marginTop: 4,
                }}
              >
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Switch */}
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', margin: '20px 0 0' }}>
              {mode === 'login' ? (
                <>Don't have an account?{' '}
                  <button onClick={() => switchMode('register')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Sign up</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => switchMode('login')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Sign in</button>
                </>
              )}
            </p>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--subtle)', marginTop: 20 }}>
            🛡 Your knowledge, securely stored.
          </p>
        </motion.div>
      </div>
    </>
  )
}
