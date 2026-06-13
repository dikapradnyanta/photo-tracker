import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Navigation, Clock, PenTool, Heart, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { ToastType } from '@/components/ui/ToastNotification'

type SpotPhoto = Database['public']['Tables']['spot_photos']['Row'] & {
  spots: { id: string; name: string; genre: string[] | null; best_time: string | null; difficulty: string | null } | null
  photo_likes?: { user_id: string }[]
}

interface PhotoDetailModalProps {
  photo: SpotPhoto | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  onDeleteClick: () => void
  onUpdateCaption: (photoId: string, newCaption: string) => void
  showToast: (message: string, type: ToastType) => void
}

export default function PhotoDetailModal({ 
  photo, onClose, onPrev, onNext, hasPrev, hasNext, onDeleteClick, onUpdateCaption, showToast 
}: PhotoDetailModalProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [editedCaption, setEditedCaption] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset state when photo changes
  useEffect(() => {
    setIsEditingCaption(false)
    setEditedCaption(photo?.caption || '')
  }, [photo])

  if (!photo) return null

  const handleSaveCaption = async () => {
    setSaving(true)
    try {
      await supabase.from('spot_photos').update({ caption: editedCaption }).eq('id', photo.id)
      onUpdateCaption(photo.id, editedCaption)
      setIsEditingCaption(false)
      showToast('Deskripsi berhasil diperbarui!', 'success')
    } catch(e) {
      console.error(e)
      showToast('Gagal memperbarui deskripsi. Coba lagi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-background/90 backdrop-blur-xl">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-surface hover-surface rounded-full z-50 transition-colors">
          <X className="w-6 h-6" />
        </button>

        {/* Prev Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          disabled={!hasPrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-surface hover-surface rounded-full z-50 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Next Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onNext() }}
          disabled={!hasNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-surface hover-surface rounded-full z-50 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row gap-6 md:gap-10 overflow-y-auto no-scrollbar items-center md:items-start"
        >
          {/* Photo */}
          <div className="w-full md:w-2/3 shrink-0 flex items-center justify-center relative">
            <img 
              src={photo.photo_url} 
              alt={photo.caption || ''} 
              className="w-full max-h-[85vh] object-contain rounded-2xl"
            />
          </div>

          {/* Sidebar Info */}
          <div className="w-full md:w-1/3 flex flex-col gap-6 py-4 md:py-8 pr-4">
            {/* Spot Context */}
            <div className="space-y-2">
              <Link href={`/spot/${photo.spots?.id}`} className="inline-block group" onClick={onClose}>
                <h3 className="text-2xl font-display font-bold group-hover:text-amber-primary transition-colors flex items-center gap-2">
                  {photo.spots?.name}
                  <Navigation className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              </Link>
              <div className="flex flex-wrap gap-2">
                {photo.spots?.genre?.map(g => (
                  <span key={g} className="px-2 py-1 bg-surface-alt border border-border text-[10px] font-mono uppercase tracking-widest text-muted rounded-md">
                    {g}
                  </span>
                ))}
                {photo.spots?.best_time && (
                  <span className="px-2 py-1 bg-surface-alt border border-border text-[10px] font-mono uppercase tracking-widest text-muted rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {photo.spots?.best_time}
                  </span>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-border" />

            {/* Deskripsi & Edit */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Deskripsi</p>
                <button 
                  onClick={() => {
                    setIsEditingCaption(!isEditingCaption)
                    if (!isEditingCaption) setEditedCaption(photo.caption || '')
                  }}
                  className="p-1.5 hover:bg-surface-alt rounded-lg text-muted hover:text-amber-primary transition-colors"
                >
                  <PenTool className="w-3.5 h-3.5" />
                </button>
              </div>

              {isEditingCaption ? (
                <div className="space-y-3">
                  <textarea 
                    className="w-full bg-surface-alt border border-border rounded-xl p-3 text-sm min-h-[100px] focus:border-amber-primary outline-none transition-colors"
                    value={editedCaption}
                    onChange={(e) => setEditedCaption(e.target.value)}
                    maxLength={280}
                    placeholder="Tambahkan deskripsi tentang foto ini..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setIsEditingCaption(false)} className="px-3 py-1.5 text-xs font-bold text-muted hover:text-foreground">Batal</button>
                    <button 
                      disabled={saving || editedCaption === (photo.caption || '')}
                      onClick={handleSaveCaption}
                      className="px-3 py-1.5 bg-amber-primary text-white text-xs font-bold rounded-lg disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simpan'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed italic text-foreground/90">
                  {photo.caption ? `"${photo.caption}"` : <span className="text-muted/50">Tidak ada deskripsi.</span>}
                </p>
              )}
            </div>

            <div className="h-px w-full bg-border" />

            {/* Metadata */}
            <div className="flex items-center justify-between text-sm text-muted">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                  <span className="font-bold">{photo.photo_likes?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(photo.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              
              {/* Delete Action */}
              <button 
                onClick={onDeleteClick}
                className="flex items-center gap-1.5 text-red-500/60 hover:text-red-500 text-xs font-bold transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
