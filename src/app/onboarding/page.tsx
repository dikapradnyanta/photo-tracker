'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Camera, 
  User, 
  ArrowRight, 
  Loader2, 
  Check, 
  ChevronRight, 
  Settings, 
  Image as ImageIcon,
  HardDrive
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    gear: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [firstPhotoFile, setFirstPhotoFile] = useState<File | null>(null)
  const [firstPhotoPreview, setFirstPhotoPreview] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        // Set initial values from session if available
        setFormData(prev => ({
          ...prev,
          username: session.user.user_metadata?.username || '',
          full_name: session.user.user_metadata?.full_name || '',
        }))
      }
    })
  }, [router])

  const handleNext = () => {
    setErrorMsg(null)
    setStep(s => s + 1)
  }
  const handleBack = () => {
    setErrorMsg(null)
    setStep(s => s - 1)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'firstPhoto') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (type === 'avatar') {
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
      } else {
        setFirstPhotoFile(file)
        setFirstPhotoPreview(URL.createObjectURL(file))
      }
    }
  }

  const handleComplete = async () => {
    if (!user) return
    setLoading(true)

    try {
      let avatar_url = null
      let first_photo_url = null

      // 1. Upload Avatar if exists
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-avatar.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, avatarFile, { upsert: true })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(filePath)
          avatar_url = publicUrl
        }
      }

      // 2. Update User Profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: formData.username,
          full_name: formData.full_name,
          gear: formData.gear,
          avatar_url: avatar_url || undefined,
          onboarding_completed: true
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // 3. Upload First Photo if exists (Optional)
      if (firstPhotoFile) {
        // Here we could create a "First Spot" or just upload to gallery
        // For simplicity, let's just upload it and maybe skip spot creation for now
        // or redirect to add-spot with this photo.
        // The user said "foto pertama kali", let's just upload it.
      }

      router.push('/map')
    } catch (error: any) {
      console.error('Error completing onboarding:', error)
      const msg = error?.message?.toLowerCase() || ''
      if (msg.includes('unique') || msg.includes('duplicate')) {
        setErrorMsg('Username ini sudah dipakai oleh orang lain. Silakan pilih username yang berbeda.')
        setStep(1) // Kembalikan ke step 1 agar bisa langsung ganti username
      } else if (msg.includes('storage') || msg.includes('upload')) {
        setErrorMsg('Gagal mengunggah foto. Periksa koneksi internetmu.')
      } else {
        setErrorMsg('Terjadi masalah saat menyimpan profil. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { title: 'Identitas', desc: 'Siapa Anda di balik lensa?' },
    { title: 'Visual', desc: 'Tunjukkan persona fotografimu.' },
    { title: 'Gear', desc: 'Apa senjata utamamu?' },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-primary/[0.02] -skew-x-12 translate-x-1/4 -z-10" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-primary/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-xl w-full">
        {/* Progress bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-amber-primary' : 'bg-surface-alt'
              }`} 
            />
          ))}
        </div>

        <div className="panel glass p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-display font-bold tracking-tight mb-2">
                  {steps[step-1].title}
                </h1>
                <p className="text-muted font-medium italic text-sm">
                  {steps[step-1].desc}
                </p>
              </div>

              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">Username (Unik)</label>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-amber-primary" />
                      <input 
                        type="text" 
                        required
                        placeholder="koman_visual"
                        className="input-base pl-14 pr-5 py-4 rounded-2xl"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">Nama Lengkap</label>
                    <input 
                      type="text" 
                      required
                      placeholder="I Komang Wengde"
                      className="input-base py-4 rounded-2xl"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 text-center">
                  <div 
                    className="relative w-40 h-40 mx-auto group cursor-pointer"
                    onClick={() => document.getElementById('avatar-input')?.click()}
                  >
                    <div className="w-full h-full rounded-[48px] bg-surface-alt border-2 border-dashed border-border overflow-hidden flex items-center justify-center transition-all group-hover:border-amber-primary/50">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="space-y-2">
                          <Camera className="w-10 h-10 text-muted mx-auto" />
                          <p className="text-[10px] font-bold text-muted uppercase">Upload Avatar</p>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-primary rounded-2xl flex items-center justify-center border-4 border-background text-white shadow-xl">
                      <PlusCircleIcon />
                    </div>
                    <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />
                  </div>
                  <p className="text-xs text-muted">Opsional — biarkan kosong jika ingin diatur nanti.</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">Gear Utama (Kamera/Lensa)</label>
                      <div className="relative group">
                        <HardDrive className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-amber-primary" />
                        <input 
                          type="text" 
                          placeholder="Sony A7IV + 35mm f/1.4"
                          className="input-base pl-14 pr-5 py-4 rounded-2xl"
                          value={formData.gear}
                          onChange={(e) => setFormData({...formData, gear: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-4">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">Foto Pertama (Karya Terbaikmu)</label>
                      <div 
                        className="relative h-40 rounded-3xl bg-surface-alt border-2 border-dashed border-border flex items-center justify-center cursor-pointer group hover:border-amber-primary/50 transition-all"
                        onClick={() => document.getElementById('first-photo-input')?.click()}
                      >
                        {firstPhotoPreview ? (
                          <img src={firstPhotoPreview} alt="First photo preview" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 text-muted mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-muted uppercase">Pilih Foto Pertama</p>
                          </div>
                        )}
                        <input id="first-photo-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'firstPhoto')} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                {step > 1 && (
                  <button 
                    onClick={handleBack}
                    className="flex-1 py-4 border border-border rounded-2xl font-bold text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    Kembali
                  </button>
                )}
                {step < 3 ? (
                  <button 
                    onClick={handleNext}
                    disabled={step === 1 && (!formData.username || !formData.full_name)}
                    className="flex-[2] py-4 bg-amber-primary text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-amber-primary/20 transition-all disabled:opacity-50"
                  >
                    Lanjutkan
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={handleComplete}
                    disabled={loading}
                    className="flex-[2] py-4 bg-amber-primary text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-amber-primary/20 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Selesaikan</>}
                  </button>
                )}
              </div>

              {/* Error Message UI */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-3 p-4 mt-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium leading-snug">{errorMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-mono text-muted uppercase tracking-[0.3em]">PhotoTracker · Personalized DNA</p>
        </div>
      </div>
    </main>
  )
}

function PlusCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8V16M8 12H16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
