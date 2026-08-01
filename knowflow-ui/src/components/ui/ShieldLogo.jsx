import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

export default function ShieldLogo({ size = 32, animated = false }) {
  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <motion.div
          animate={{ boxShadow: ['0 0 0px rgba(59,130,246,0)', '0 0 24px rgba(59,130,246,0.4)', '0 0 0px rgba(59,130,246,0)'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full"
        />
        <Shield size={size} className="text-blue-500" strokeWidth={1.5} />
      </motion.div>
    )
  }
  return <Shield size={size} className="text-blue-500" strokeWidth={1.5} />
}
