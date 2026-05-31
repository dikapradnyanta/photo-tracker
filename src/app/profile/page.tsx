'use client'

import Navbar from '@/components/Navbar'
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
  Info
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Database } from '@/types/database'
import { motion, AnimatePresence } from 'framer-motion'

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
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [router])

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
      alert(`Gagal menyimpan pengaturan: ${error.message || 'Error tidak diketahui'}`)
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
        <p className="text-muted mb-6 text-sm max-w-sm">Tampaknya ada masalah dengan sesi Anda (mungkin database baru saja direset). Silakan masuk kembali.</p>
        <button onClick={handleLogout} className="px-6 py-3 bg-foreground text-background rounded-xl font-bold hover:bg-amber-primary transition-all">
          Keluar & Login Ulang
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-20 transition-colors">
      <Navbar />

      {/* Header Profile */}
      <div className="relative pt-[var(--nav-height)] pb-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10 items-end">
          
          {/* Info Area (Left, Large Typography) */}
          <div className="md:col-span-8 flex flex-col justify-end space-y-6">
            <div>
              <span className="px-3 py-1 bg-amber-primary text-white text-[10px] font-mono font-bold rounded-sm uppercase tracking-widest mb-4 inline-block">
                {userLevel} Photographer
              </span>
              <h1 className="text-5xl md:text-7xl font-display font-black leading-[0.9] tracking-tighter">
                {profile.full_name || profile.username || 'Fotografer'}
              </h1>
            </div>

            <p className="max-w-xl text-lg md:text-2xl font-serif text-muted leading-relaxed italic opacity-90 border-l-2 border-amber-primary pl-6">
              "{profile.bio || 'Mulai ceritamu di sini...'}"
            </p>

            <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-muted uppercase tracking-widest pt-4">
              <span className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-amber-primary" /> @{profile.username}</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-primary" /> {profile.location || 'Basecamp belum diatur'}</span>
              <span className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-amber-primary" /> {profile.gear || 'No Gear'}</span>
            </div>
          </div>

          {/* Avatar & Stats Area (Right) */}
          <div className="md:col-span-4 flex flex-col items-end gap-8">
            <div className="relative w-40 h-48 md:w-56 md:h-72 bg-surface border border-border shadow-2xl p-2 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="w-full h-full bg-sand/20 overflow-hidden relative">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username || ''} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-16 h-16 opacity-30" /></div>
                )}
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-amber-primary rounded-full flex items-center justify-center border-4 border-background shadow-xl">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="flex gap-6 text-right">
              <div>
                <span className="block text-3xl font-display font-bold">{spots.length}</span>
                <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Spots</span>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <span className="block text-3xl font-display font-bold">{photos.length}</span>
                <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Photos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Gallery Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2">
            <button className="p-2 bg-amber-primary text-white rounded-lg shadow-lg"><Grid className="w-4 h-4" /></button>
            <button className="p-2 bg-surface-alt border border-border rounded-lg text-muted"><ImageIcon className="w-4 h-4" /></button>
          </div>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-surface-alt border border-border rounded-xl text-xs font-bold flex items-center gap-2 hover:border-amber-primary transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            Edit Profil
          </button>
        </div>

        {/* Chips */}
        <div className="relative mb-8">
          <div 
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveTab(genre)}
                className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  activeTab === genre 
                    ? 'bg-amber-primary border-amber-primary text-white shadow-lg shadow-amber-primary/20' 
                    : 'bg-surface-alt border-border text-muted hover:border-amber-primary/40'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-12">
          {filteredPhotos.length > 0 ? (
            filteredPhotos.map((photo, i) => {
              // Creating a masonry effect using pseudo-random but deterministic classes based on index
              const isLarge = i % 5 === 0;
              const isTall = i % 5 === 3;
              
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={photo.id} 
                  className={`group relative overflow-hidden bg-surface-alt shadow-lg shadow-black/10 dark:shadow-black/40 cursor-pointer ${
                    isLarge ? 'col-span-2 row-span-2 aspect-square md:aspect-auto md:h-full' :
                    isTall ? 'col-span-1 row-span-2 aspect-[3/4] md:aspect-auto md:h-full' :
                    'col-span-1 row-span-1 aspect-square'
                  }`}
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-6 flex flex-col justify-end">
                    <p className="text-xs font-mono text-white uppercase tracking-[0.2em] font-bold mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{photo.spots?.name}</p>
                    <div className="flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                      <Zap className="w-3 h-3 text-amber-primary" />
                      <span className="text-[10px] font-medium text-white/80 uppercase tracking-widest line-clamp-1">
                        {photo.exif_camera || 'Manual EXIF'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="col-span-full py-32 text-center border-y border-border">
              <Camera className="w-12 h-12 mx-auto mb-6 text-muted/30" />
              <p className="text-muted font-serif text-2xl italic">"Mulai Hunting Pertamamu"</p>
              <Link href="/map" className="inline-block mt-8 px-8 py-4 bg-foreground text-background rounded-none text-xs font-mono uppercase tracking-[0.2em] font-bold hover:bg-amber-primary hover:text-white transition-all">
                Buka Peta Eksplorasi
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
