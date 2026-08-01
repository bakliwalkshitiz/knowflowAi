import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Search, Trash2, Download,
  Pencil, X, Check, CloudUpload, AlertCircle
} from 'lucide-react'
import { documentApi } from '../../api/client'

const css = {
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 },
}

function DropZone({ onUpload, uploading }) {
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onUpload(f)
  }

  return (
    <motion.div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      animate={{ borderColor: dragging ? 'var(--accent)' : 'var(--border)', background: dragging ? 'var(--accent-bg)' : 'transparent' }}
      transition={{ duration: 0.15 }}
      style={{
        border: '2px dashed var(--border)', borderRadius: 14, padding: '36px 20px',
        textAlign: 'center', cursor: 'pointer',
      }}
    >
      <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".pdf,.txt,.doc,.docx"
        onChange={e => e.target.files[0] && onUpload(e.target.files[0])} />
      <motion.div
        animate={uploading ? { rotate: 360 } : { rotate: 0 }}
        transition={uploading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
        style={{ margin: '0 auto 12px' }}
      >
        <CloudUpload size={28} style={{ color: 'var(--accent)' }} />
      </motion.div>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', margin: '0 0 4px' }}>
        {uploading ? 'Uploading & embedding…' : 'Drop your file here or click to browse'}
      </p>
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>PDF, TXT, DOC, DOCX</p>
    </motion.div>
  )
}

function DocCard({ doc, onDelete, onRename, onDownload }) {
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(doc.fileName)
  const [menuOpen, setMenuOpen] = useState(false)

  const saveRename = async () => {
    if (newName.trim() && newName !== doc.fileName) await onRename(doc.id, newName.trim())
    setRenaming(false)
  }

  const ext = doc.fileName?.split('.').pop()?.toUpperCase() || 'FILE'
  const extColors = {
    PDF: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
    TXT: { bg: 'rgba(52,211,153,0.12)',  color: '#34d399' },
    DOC: { bg: 'rgba(79,114,247,0.12)',  color: 'var(--accent)' },
    DOCX:{ bg: 'rgba(79,114,247,0.12)', color: 'var(--accent)' },
  }
  const ec = extColors[ext] || { bg: 'var(--card-hover)', color: 'var(--muted)' }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{ ...css.card, padding: 16, position: 'relative' }}
      onMouseEnter={e => e.currentTarget.querySelector('.doc-menu-btn').style.opacity = 1}
      onMouseLeave={e => { e.currentTarget.querySelector('.doc-menu-btn').style.opacity = 0; setMenuOpen(false) }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <div style={{ padding: '2px 7px', borderRadius: 6, background: ec.bg, fontSize: 10, fontWeight: 700, color: ec.color, flexShrink: 0 }}>
          {ext}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {renaming ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') { setRenaming(false); setNewName(doc.fileName) } }}
                style={{ flex: 1, fontSize: 12, background: 'var(--surface)', border: '1px solid var(--accent-bd)', borderRadius: 6, color: 'var(--text)', padding: '2px 8px', outline: 'none' }}
              />
              <button onClick={saveRename} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', padding: 2 }}><Check size={13} /></button>
              <button onClick={() => { setRenaming(false); setNewName(doc.fileName) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2 }}><X size={13} /></button>
            </div>
          ) : (
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {doc.fileName}
            </p>
          )}
        </div>

        {/* Menu */}
        <div style={{ position: 'relative' }}>
          <button className="doc-menu-btn" onClick={() => setMenuOpen(m => !m)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, opacity: 0, transition: 'opacity 0.15s', borderRadius: 6, display: 'flex' }}>
            <Pencil size={13} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  position: 'absolute', right: 0, top: 28, zIndex: 20,
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 10, overflow: 'hidden', minWidth: 140,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                {[
                  { icon: Pencil,   label: 'Rename',   onClick: () => { setRenaming(true); setMenuOpen(false) } },
                  { icon: Download, label: 'Download', onClick: () => { onDownload(doc.id, doc.fileName); setMenuOpen(false) } },
                  { icon: Trash2,   label: 'Delete',   onClick: () => { onDelete(doc.id); setMenuOpen(false) }, danger: true },
                ].map(({ icon: Icon, label, onClick, danger }) => (
                  <button key={label} onClick={onClick}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px', fontSize: 12, border: 'none', cursor: 'pointer', background: 'transparent', color: danger ? 'var(--danger)' : 'var(--text)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)' }}>
        <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
        <span>{doc.chunkCount} chunks</span>
        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
      </div>
    </motion.div>
  )
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchDocs = async () => {
    setLoading(true)
    try {
      if (search.trim()) {
        const res = await documentApi.search(search)
        setDocs(res.data || []); setTotalPages(1)
      } else {
        const res = await documentApi.list(page, 12)
        const data = res.data
        if (data?.content) { setDocs(data.content); setTotalPages(data.totalPages) }
        else setDocs(data || [])
      }
    } catch { setDocs([]) }
    setLoading(false)
  }

  useEffect(() => { fetchDocs() }, [page, search])

  const handleUpload = async (file) => {
    setUploading(true); setError(''); setSuccess('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      // ⚠️ Do NOT set Content-Type — Axios + browser handle multipart boundary automatically
      await documentApi.upload(fd)
      setSuccess(`"${file.name}" uploaded and embedded successfully!`)
      setTimeout(() => setSuccess(''), 5000)
      fetchDocs()
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Upload failed'
      setError(msg)
      setTimeout(() => setError(''), 5000)
    }
    setUploading(false)
  }

  const handleDelete = async (id) => {
    try { await documentApi.delete(id); setDocs(d => d.filter(doc => doc.id !== id)) }
    catch { setError('Failed to delete document.') }
  }

  const handleRename = async (id, newName) => {
    try {
      const res = await documentApi.rename(id, { newName })
      setDocs(d => d.map(doc => doc.id === id ? { ...doc, fileName: res.data?.fileName || newName } : doc))
    } catch { setError('Failed to rename.') }
  }

  const handleDownload = async (id, fileName) => {
    try {
      const res = await documentApi.download(id)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = fileName; a.click()
      URL.revokeObjectURL(url)
    } catch { setError('Download failed.') }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Documents</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Upload and manage your knowledge vault</p>
      </motion.div>

      {/* Alerts */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 14, padding: '12px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, fontSize: 13, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={14} /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 14, padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, fontSize: 13, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} /> {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}><X size={13} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: 20 }}>
        <DropZone onUpload={handleUpload} uploading={uploading} />
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search documents…"
          style={{
            width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
            color: 'var(--text)', fontSize: 13, padding: '10px 14px 10px 36px', outline: 'none',
            boxSizing: 'border-box', transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ height: 110, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, opacity: 0.5 }} />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <FileText size={40} style={{ color: 'var(--border)', margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--muted)', margin: '0 0 6px' }}>
            {search ? 'No documents found' : 'Your vault is empty'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--subtle)', margin: 0 }}>
            {search ? 'Try a different keyword' : 'Upload your first document above'}
          </p>
        </div>
      ) : (
        <AnimatePresence>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {docs.map(doc => (
              <DocCard key={doc.id} doc={doc} onDelete={handleDelete} onRename={handleRename} onDownload={handleDownload} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 28 }}>
          {['Previous', `${page + 1} / ${totalPages}`, 'Next'].map((label, i) => (
            i === 1 ? (
              <span key={label} style={{ fontSize: 13, color: 'var(--muted)', padding: '0 6px' }}>{label}</span>
            ) : (
              <button key={label}
                onClick={() => setPage(p => i === 0 ? Math.max(0, p - 1) : Math.min(totalPages - 1, p + 1))}
                disabled={i === 0 ? page === 0 : page >= totalPages - 1}
                style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, cursor: 'pointer', opacity: (i === 0 ? page === 0 : page >= totalPages - 1) ? 0.4 : 1 }}>
                {label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  )
}
