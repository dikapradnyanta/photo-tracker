import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-surface border border-border rounded-[24px] p-6 shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-display font-bold mb-2">Hapus Foto?</h3>
          <p className="text-sm text-muted mb-6">Tindakan ini tidak dapat diurungkan. Foto akan dihapus secara permanen dari portofoliomu.</p>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-surface-alt border border-border hover:bg-muted/10 rounded-xl font-bold text-sm transition-colors"
            >
              Batal
            </button>
            <button 
              disabled={isDeleting}
              onClick={handleConfirm}
              className="flex-1 py-3 bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold text-sm flex items-center justify-center transition-colors disabled:opacity-50 shadow-lg shadow-red-500/20"
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Hapus Foto'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
