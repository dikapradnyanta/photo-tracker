import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | null

interface ToastNotificationProps {
  message: string
  type: ToastType
  onClose: () => void
}

export default function ToastNotification({ message, type, onClose }: ToastNotificationProps) {
  useEffect(() => {
    if (type) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [type, onClose])

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-surface border border-border min-w-[300px] max-w-[90vw]"
        >
          {type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
          {type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
          {type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
          
          <p className="text-sm font-medium flex-1 text-foreground">
            {message}
          </p>
          
          <button 
            onClick={onClose}
            className="p-1 hover:bg-surface-alt rounded-lg transition-colors text-muted hover:text-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
