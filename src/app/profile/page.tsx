'use client'

import { 
  User as UserIcon, 
  Settings, 
  Camera, 
  MapPin, 
  Grid, 
  LogOut, 
  Loader2, 
  Image as ImageIcon, 
  Award, 
  Zap, 
  HardDrive,
  X,
  Save,
  Mail,
  PenTool,
  Info,
  Share2,
  Check
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Database } from '@/types/database'
import { motion, AnimatePresence } from 'framer-motion'

const BLUR_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

type Profile = Database['public']['Tables']['users']['Row']
type Spot = Database['public']['Tables']['spots']['Row']
type SpotPhoto = Database['public']['Tables']['spot_photos']['Row'] & {
  spots: { name: string; genre: string[] | null } | null
  exif_camera?: string | null
  exif_lens?: string | null
  exif_settings?: string | null
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('Semua')
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editData, setEditData] = useState<Partial<Profile>>({})
  const [spots, setSpots] = useState<Spot[]>([])
  const [photos, setPhotos] = useState<SpotPhoto[]>([])
  const [genres, setGenres] = useState<string[]>(['Semua'])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [router])

  const handleShare = async () => {
    const url = window.location.href
    const shareData = {
      title: `${profile?.full_name || profile?.username} — PhotoTracker`,
      text: `Lihat profil fotografer ini di PhotoTracker`,
      url,
    }

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (err) {}
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData as Profile)
      setEditData(profileData as Profile)

      // Fetch user's spots
      const { data: spotsData, error: spotsError } = await supabase
        .from('spots')
        .select('*')
        .eq('added_by', session.user.id)
        .order('created_at', { ascending: false })

      if (spotsError) throw spotsError
      setSpots(spotsData || [])

      // Fetch portfolio
      const { data: photosData, error: photosError } = await supabase
        .from('spot_photos')
        .select('*, spots(name, genre)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (photosError) throw photosError
      const fetchedPhotos = (photosData as SpotPhoto[]) || []
      setPhotos(fetchedPhotos)

      // Extract unique genres
      const uniqueGenres = new Set(['Semua'])
      fetchedPhotos.forEach(p => {
        p.spots?.genre?.forEach(g => uniqueGenres.add(g))
      })
      setGenres(Array.from(uniqueGenres))

    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!profile) return

    // Validasi username
    if (!editData.username?.trim()) {
      alert('Username tidak boleh kosong.')
      return
    }
    if (editData.username.length < 3) {
      alert('Username minimal 3 karakter.')
      return
    }
    if (!/^[a-z0-9_]+$/.test(editData.username)) {
      alert('Username hanya boleh berisi huruf kecil, angka, dan garis bawah (_) tanpa spasi.')
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
      
      setProfile({ ...profile, ...editData, avatar_url } as Profile)
      setIsEditing(false)
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error: any) {
      console.error('Error updating settings:', error)
      const msg = error?.message?.toLowerCase() || ''
      if (msg.includes('unique') || msg.includes('duplicate')) {
        alert('Username ini sudah dipakai oleh orang lain. Silakan pilih username yang berbeda.')
      } else {
        alert(`Gagal menyimpan pengaturan: ${error.message || 'Error tidak diketahui'}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const filteredPhotos = activeTab === 'Semua' 
    ? photos 
    : photos.filter(p => p.spots?.genre?.includes(activeTab))

  const userLevel = spots.length >= 20 ? 'Pro' : spots.length >= 5 ? 'Enthusiast' : 'Pemula'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-primary mx-auto mb-4" />
          <p className="font-display font-bold text-xl text-foreground">Syncing DNA...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6">
        <Loader2 className="w-12 h-12 text-amber-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold mb-2">Sesi Profil Tidak Ditemukan</h2>
        <p className="text-muted mb-6 text-sm max-w-sm">Sesi masukmu sudah berakhir. Silakan masuk kembali untuk melanjutkan petualangan visualmu.</p>
        <button onClick={handleLogout} className="px-6 py-3 bg-foreground text-background rounded-xl font-bold hover:bg-amber-primary transition-all">
          Keluar & Login Ulang
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-20 transition-colors">

      {/* Header Profile - Instagram Style */}
      <div className="max-w-4xl mx-auto pt-28 md:pt-32 pb-8 px-4 md:px-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-16 items-start">
          
          {/* Avatar Area */}
          <div className="shrink-0 mx-auto md:mx-0">
            <div className="relative w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border border-border/50 p-1">
              <div className="w-full h-full rounded-full overflow-hidden bg-surface-alt relative">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.username || ''} fill sizes="160px" placeholder="blur" blurDataURL={BLUR_URL} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-12 h-12 text-muted/30" /></div>
                )}
              </div>
            </div>
          </div>

          {/* Info Area */}
          <div className="flex-1 w-full text-center md:text-left">
            {/* Row 1: Username & Buttons */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-6">
              <h1 className="text-xl md:text-2xl font-medium">
                {profile.username}
              </h1>
              <div className="flex items-center justify-center gap-2">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-1.5 bg-surface-alt hover:bg-surface border border-border rounded-lg text-sm font-bold transition-colors"
                >
                  Edit Profil
                </button>
                <button 
                  onClick={handleShare}
                  className="px-5 py-1.5 bg-surface-alt hover:bg-surface border border-border rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                  {copied ? <span className="text-emerald-500 hidden md:inline">Tersalin</span> : <span className="hidden md:inline">Bagikan</span>}
                </button>
              </div>
            </div>

            {/* Row 2: Stats */}
            <div className="flex justify-center md:justify-start gap-8 mb-6">
              <div className="text-center md:text-left">
                <span className="font-bold text-lg">{spots.length}</span> <span className="text-muted">spot</span>
              </div>
              <div className="text-center md:text-left">
                <span className="font-bold text-lg">{photos.length}</span> <span className="text-muted">foto</span>
              </div>
            </div>

            {/* Row 3: Bio & Details */}
            <div className="space-y-1">
              <h2 className="font-bold text-sm">{profile.full_name || profile.username}</h2>
              <div className="py-1">
                <span className="inline-block px-2 py-0.5 bg-amber-primary/10 text-amber-primary text-[10px] font-bold rounded uppercase tracking-wider">
                  {userLevel} Photographer
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{profile.bio || 'Belum ada bio.'}</p>
              
              {(profile.location || profile.gear) && (
                <div className="flex flex-col gap-1 mt-3 text-xs text-muted">
                  {profile.location && (
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[250px]" title={profile.location}>
                        {/* Jika teks kepanjangan dari auto-suggest, potong tampilannya */}
                        {profile.location.split(', ').slice(0, 2).join(', ')}
                      </span>
                    </div>
                  )}
                  {profile.gear && (
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>{profile.gear}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-1 md:px-8 border-t border-border mt-4">

        {/* Tabs - Instagram Style */}
        <div className="relative mb-2">
          <div 
            ref={scrollRef}
            className="flex justify-center gap-8 overflow-x-auto scrollbar-hide no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveTab(genre)}
                className={`py-4 text-xs font-bold whitespace-nowrap uppercase tracking-widest transition-all border-t-2 ${
                  activeTab === genre 
                    ? 'border-foreground text-foreground' 
                    : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                {genre === 'Semua' ? (
                  <span className="flex items-center gap-2"><Grid className="w-3 h-3" /> POSTINGAN</span>
                ) : (
                  <span>{genre}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Gallery Grid - Instagram Square Style */}
        <div className="grid grid-cols-3 gap-1 md:gap-4 mb-12">
          {filteredPhotos.length > 0 ? (
            filteredPhotos.map((photo) => {
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={photo.id} 
                  className="group relative overflow-hidden bg-surface-alt aspect-square cursor-pointer"
                >
                  <Image
                    src={photo.photo_url}
                    alt={photo.caption || ''}
                    fill
                    sizes="(max-width: 768px) 33vw, 25vw"
                    placeholder="blur"
                    blurDataURL={BLUR_URL}
                    className="object-cover group-hover:opacity-75 transition-opacity duration-300"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
                    <p className="text-white font-bold text-sm md:text-base px-2 text-center truncate w-full">{photo.spots?.name}</p>
                    <div className="flex items-center gap-1.5">
                      <Camera className="w-3 h-3 text-white" />
                      <span className="text-[10px] text-white/90 uppercase tracking-widest">{photo.exif_camera || 'Manual'}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="col-span-full py-32 text-center border-y border-border">
              <Camera className="w-12 h-12 mx-auto mb-6 text-muted/30" />
              <p className="text-muted font-serif text-2xl italic">"Mulai Hunting Pertamamu"</p>
              <Link href="/add-spot" className="inline-block mt-8 px-8 py-4 bg-foreground text-background rounded-none text-xs font-mono uppercase tracking-[0.2em] font-bold hover:bg-amber-primary hover:text-white transition-all">
                Tambah Spot Pertamamu
              </Link>
            </div>
          )}
        </div>

        {/* Logout Action */}
        <div className="mt-20 flex justify-center">
          <button 
            onClick={handleLogout}
            className="text-red-500/60 hover:text-red-500 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar dari PhotoTracker
          </button>
        </div>
      </div>

      {/* Settings / Edit Modal Overlay */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setIsEditing(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl panel shadow-2xl overflow-hidden bg-background max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-primary/10 flex items-center justify-center text-amber-primary">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold">Pengaturan Profil</h2>
                    <p className="text-xs text-muted">Sesuaikan identitas fotografimu</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-2 hover-surface rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                {/* Avatar Edit */}
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-[32px] overflow-hidden border-2 border-amber-primary/20 group-hover:border-amber-primary transition-all">
                      {avatarPreview || profile.avatar_url ? (
                        <img src={avatarPreview || profile.avatar_url || ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-sand/20 flex items-center justify-center"><UserIcon className="w-10 h-10 opacity-20" /></div>
                      )}
                    </div>
                    <button 
                      onClick={() => document.getElementById('avatar-edit-input')?.click()}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input id="avatar-edit-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <p className="text-[10px] font-mono text-muted uppercase tracking-widest">Update Photo Profil</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted ml-1">Username</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-amber-primary transition-colors" />
                      <input 
                        className="input-base pl-12 py-3 rounded-xl text-sm"
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
                        className="input-base pl-12 py-3 rounded-xl text-sm"
                        value={editData.full_name || ''}
                        onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted ml-1">Bio Singkat</label>
                  <textarea 
                    className="input-base py-3 rounded-xl text-sm min-h-[100px]"
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
                        className="input-base pl-12 py-3 rounded-xl text-sm"
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
                        className="input-base pl-12 py-3 rounded-xl text-sm"
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
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 border border-border rounded-xl font-bold text-sm hover-surface"
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
    </main>
  )
}
