import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = false, onClick, padding = 'p-6' }) {
  const base = `
    rounded-2xl border border-slate-800/60 bg-slate-900/60
    backdrop-blur-sm transition-all duration-200
    ${padding} ${className}
  `
  if (hover || onClick) {
    return (
      <motion.div
        whileHover={{ y: -2, borderColor: 'rgba(59,130,246,0.3)' }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className={`${base} ${onClick ? 'cursor-pointer' : ''}`}
      >
        {children}
      </motion.div>
    )
  }
  return <div className={base}>{children}</div>
}
