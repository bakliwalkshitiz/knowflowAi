import { Component } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("AppLayout ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: 'var(--text)', textAlign: 'center', marginTop: 60 }}>
          <h2 style={{ fontSize: 20, color: 'var(--danger)', marginBottom: 8 }}>Something went wrong loading this view.</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
            style={{
              padding: '9px 18px', borderRadius: 9, background: 'var(--accent)',
              color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar />
      <motion.main
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ flex: 1, height: '100vh', overflowY: 'auto', background: 'var(--bg)', minWidth: 0 }}
      >
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </motion.main>
    </div>
  )
}
