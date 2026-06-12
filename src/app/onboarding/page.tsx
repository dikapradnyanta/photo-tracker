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
  HardDrive,
  MapPin
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
    location: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showLocSuggestions, setShowLocSuggestions] = useState(false)
  
  const [gearSuggestions, setGearSuggestions] = useState<string[]>([])
  const [showGearSuggestions, setShowGearSuggestions] = useState(false)

  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single()
          
        if (profile?.onboarding_completed) {
          router.push('/map')
          return
        }

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

  // Autocomplete for Location (Nominatim API)
  useEffect(() => {
    const fetchLocations = async () => {
      if (formData.location.length < 3) {
        setLocationSuggestions([])
        return
      }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}&countrycodes=id&limit=4`)
        const data = await res.json()
        setLocationSuggestions(data)
      } catch (e) {
        console.error(e)
      }
    }
    const timeout = setTimeout(fetchLocations, 500)
    return () => clearTimeout(timeout)
  }, [formData.location])

  // Autocomplete for Gear (Supabase users table)
  useEffect(() => {
    const fetchGear = async () => {
      if (formData.gear.length < 2) {
        setGearSuggestions([])
        return
      }
      try {
        const { data } = await supabase
          .from('users')
          .select('gear')
          .ilike('gear', `%${formData.gear}%`)
          .limit(20)
        
        if (data) {
          const uniqueGear = Array.from(new Set(data.map(d => d.gear).filter(Boolean))) as string[]
          // Don't show if the only suggestion is exactly what we typed
          if (uniqueGear.length === 1 && uniqueGear[0] === formData.gear) {
            setGearSuggestions([])
          } else {
            setGearSuggestions(uniqueGear.slice(0, 4))
          }
        }
      } catch (e) {}
    }
    const timeout = setTimeout(fetchGear, 400)
    return () => clearTimeout(timeout)
  }, [formData.gear])

  const handleNext = () => {
    if (step === 1) {
      if (formData.username.length < 3) {
        setErrorMsg('Username minimal 3 karakter.')
        return
      }
      if (!/^[a-z0-9_]+$/.test(formData.username)) {
        setErrorMsg('Username hanya boleh berisi huruf kecil, angka, dan garis bawah (_) tanpa spasi.')
        return
      }
    }
    setErrorMsg(null)
    setStep(s => s + 1)
  }
  const handleBack = () => {
    setErrorMsg(null)
    setStep(s => s - 1)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleComplete = async () => {
    if (!user) return
    setLoading(true)

    try {
      let final_avatar_url = null

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
          final_avatar_url = publicUrl
        }
      }

      // 2. Update User Profile Safely
      const payload: any = {
        username: formData.username,
        full_name: formData.full_name,
        onboarding_completed: true
      }
      
      if (formData.gear && formData.gear.trim() !== '') {
        payload.gear = formData.gear
      }
      if (formData.location && formData.location.trim() !== '') {
        payload.location = formData.location
      }
      if (final_avatar_url) {
        payload.avatar_url = final_avatar_url
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(payload)
        .eq('id', user.id)

      if (updateError) throw updateError



      router.push('/map')
    } catch (error: any) {
      console.error('Error completing onboarding:', error)
      const msg = error?.message?.toLowerCase() || ''
      if (msg.includes('unique') || msg.includes('duplicate')) {
        setErrorMsg('Username ini sudah dipakai oleh orang lain. Silakan pilih username yang berbeda.')
        setStep(1)
      } else if (msg.includes('storage') || msg.includes('upload')) {
        setErrorMsg('Gagal mengunggah foto. Periksa koneksi internetmu.')
      } else {
        setErrorMsg(`Terjadi masalah: ${error?.message || 'Gagal menyimpan profil'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { title: 'Identitas', desc: 'Siapa Anda di balik lensa?' },
    { title: 'Visual', desc: 'Tunjukkan persona fotografimu.' },
    { title: 'Gear & Base', desc: 'Senjata utama dan markas hunting-mu.' },
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
                  <label 
                    htmlFor="avatar-input"
                    className="relative w-40 h-40 mx-auto group cursor-pointer block"
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
                  </label>
                  <p className="text-xs text-muted">Opsional — biarkan kosong jika ingin diatur nanti.</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">Base Camp (Kota/Daerah)</label>
                      <div className="relative group">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-amber-primary" />
                        <input 
                          type="text" 
                          placeholder="Denpasar, Bali"
                          className="input-base pl-14 pr-5 py-4 rounded-2xl w-full"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          onFocus={() => setShowLocSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowLocSuggestions(false), 200)}
                        />
                        {showLocSuggestions && locationSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-surface-alt border border-border rounded-xl overflow-hidden z-50 shadow-xl">
                            {locationSuggestions.map((loc, i) => (
                              <div 
                                key={i}
                                className="px-4 py-3 text-sm hover:bg-amber-primary/10 hover:text-amber-primary cursor-pointer transition-colors border-b border-border/50 last:border-0"
                                onClick={() => {
                                  // Nominatim gives full address, let's take just the first 2-3 parts for brevity if it's too long
                                  const parts = loc.display_name.split(', ')
                                  const shortName = parts.length > 2 ? `${parts[0]}, ${parts[1]}` : loc.display_name
                                  setFormData({...formData, location: shortName})
                                  setShowLocSuggestions(false)
                                }}
                              >
                                <p className="font-bold">{loc.name}</p>
                                <p className="text-[10px] text-muted truncate">{loc.display_name}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">Gear Utama (Kamera/Lensa)</label>
                      <div className="relative group">
                        <HardDrive className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-amber-primary" />
                        <input 
                          type="text" 
                          placeholder="Sony A7IV + 35mm f/1.4"
                          className="input-base pl-14 pr-5 py-4 rounded-2xl w-full"
                          value={formData.gear}
                          onChange={(e) => setFormData({...formData, gear: e.target.value})}
                          onFocus={() => setShowGearSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowGearSuggestions(false), 200)}
                        />
                        {showGearSuggestions && gearSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-surface-alt border border-border rounded-xl overflow-hidden z-50 shadow-xl">
                            {gearSuggestions.map((gear, i) => (
                              <div 
                                key={i}
                                className="px-4 py-3 text-sm hover:bg-amber-primary/10 hover:text-amber-primary cursor-pointer transition-colors border-b border-border/50 last:border-0"
                                onClick={() => {
                                  setFormData({...formData, gear: gear})
                                  setShowGearSuggestions(false)
                                }}
                              >
                                {gear}
                              </div>
                            ))}
                          </div>
                        )}
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
