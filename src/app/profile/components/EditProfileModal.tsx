import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, PenTool, MapPin, HardDrive, Info, Save, Loader2, User as UserIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { Database } from '@/types/database'
import { ToastType } from './ToastNotification'

type Profile = Database['public']['Tables']['users']['Row']

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile | null
  onSaveSuccess: (updatedProfile: Profile) => void
  showToast: (message: string, type: ToastType) => void
}

export default function EditProfileModal({ isOpen, onClose, profile, onSaveSuccess, showToast }: EditProfileModalProps) {
  const [editData, setEditData] = useState<Partial<Profile>>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile && isOpen) {
      setEditData(profile)
      setAvatarFile(null)
      setAvatarPreview(null)
    }
  }, [profile, isOpen])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveSettings = async () => {
    if (!profile) return

    // Validasi
    if (!editData.username?.trim()) {
      showToast('Username tidak boleh kosong.', 'error')
      return
    }
    if (editData.username.length < 3) {
      showToast('Username minimal 3 karakter.', 'error')
      return
    }
    if (!/^[a-z0-9_]+$/.test(editData.username)) {
      showToast('Username hanya boleh berisi huruf kecil, angka, dan garis bawah (_) tanpa spasi.', 'error')
      return
    }

    setSaving(true)
    try {
      let avatar_url = profile.avatar_url

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${profile.id}-${Math.random()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, avatarFile)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(filePath)
          avatar_url = publicUrl
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: editData.username,
          full_name: editData.full_name,
          bio: editData.bio,
          location: editData.location,
          gear: editData.gear,
          avatar_url
        })
        .eq('id', profile.id)

      if (updateError) throw updateError
      
      const updatedProfile = { ...profile, ...editData, avatar_url } as Profile
      onSaveSuccess(updatedProfile)
      showToast('Profil berhasil diperbarui!', 'success')
      onClose()
    } catch (error: any) {
      console.error('Error updating settings:', error)
      const msg = error?.message?.toLowerCase() || ''
      if (msg.includes('unique') || msg.includes('duplicate')) {
        showToast('Username ini sudah dipakai oleh pengguna lain.', 'error')
      } else {
        showToast('Gagal menyimpan pengaturan. Silakan coba lagi.', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-background border border-border rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
              <h2 className="text-xl font-display font-bold">Edit Profil</h2>
              <button onClick={onClose} className="p-2 hover:bg-surface-alt rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto no-scrollbar space-y-8 flex-1">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-alt border-4 border-background shadow-xl">
                    {avatarPreview || editData.avatar_url ? (
                      <Image 
                        src={avatarPreview || editData.avatar_url || ''} 
                        alt="Avatar" 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-10 h-10 text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted font-bold">Ganti Foto Profil</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted ml-1">Username</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted group-focus-within:text-amber-primary transition-colors">@</span>
                    <input 
                      className="input-base pl-12 py-3 rounded-xl text-sm w-full"
                      value={editData.username || ''}
                      onChange={(e) => setEditData({...editData, username: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted ml-1">Nama Lengkap</label>
                  <div className="relative group">
                    <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-amber-primary transition-colors" />
                    <input 
                      className="input-base pl-12 py-3 rounded-xl text-sm w-full"
                      value={editData.full_name || ''}
                      onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted ml-1">Bio Singkat</label>
                <textarea 
                  className="input-base py-3 px-4 rounded-xl text-sm min-h-[100px] w-full"
                  placeholder="Ceritakan tentang gaya fotografimu..."
                  value={editData.bio || ''}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted ml-1">Lokasi / Basecamp</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-amber-primary transition-colors" />
                    <input 
                      className="input-base pl-12 py-3 rounded-xl text-sm w-full"
                      placeholder="Jakarta, Indonesia"
                      value={editData.location || ''}
                      onChange={(e) => setEditData({...editData, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted ml-1">Gear Utama</label>
                  <div className="relative group">
                    <HardDrive className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-amber-primary transition-colors" />
                    <input 
                      className="input-base pl-12 py-3 rounded-xl text-sm w-full"
                      placeholder="Nikon Z9 + 24-70mm"
                      value={editData.gear || ''}
                      onChange={(e) => setEditData({...editData, gear: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-surface-alt rounded-2xl flex gap-3 items-start">
                <Info className="w-5 h-5 text-amber-primary shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-muted font-medium">
                  Email terverifikasi terhubung dengan akun Supabase Auth dan tidak dapat diubah di sini. 
                  Username bersifat publik dan harus unik dalam jaringan PhotoTracker.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3 sticky bottom-0 bg-background z-10">
              <button 
                onClick={onClose}
                className="flex-1 py-3 border border-border rounded-xl font-bold text-sm hover-surface transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex-[2] py-3 bg-amber-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-amber-primary/20 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
