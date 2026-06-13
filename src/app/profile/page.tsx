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
  Check,
  Trash2,
  Navigation,
  Heart,
  ChevronLeft,
  ChevronRight,
  Clock
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
  spots: { id: string; name: string; genre: string[] | null; best_time: string | null; difficulty: string | null } | null
  photo_likes?: { user_id: string }[]
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [genres, setGenres] = useState<string[]>(['Semua'])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Modal state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [editedCaption, setEditedCaption] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null)
  
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
        .select('*, spots(id, name, genre, best_time, difficulty), photo_likes(user_id)')
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

      {/* Profile Header */}
      <div className="relative pt-[var(--nav-height)] pb-12 px-6 overflow-hidden mt-16 md:mt-24">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-[36px] bg-surface-alt p-1 border border-border shadow-xl">
              <div className="w-full h-full rounded-[32px] bg-sand/20 flex items-center justify-center overflow-hidden relative">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.username || ''} fill sizes="112px" className="object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 opacity-20" />
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-amber-primary rounded-xl flex items-center justify-center border-4 border-background shadow-lg">
              <Award className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-1.5">
                <h1 className="text-3xl font-display font-bold">{profile.full_name || profile.username}</h1>
                <span className="px-2.5 py-0.5 bg-amber-primary/10 border border-amber-primary/20 text-amber-primary text-[9px] font-mono font-bold rounded-full uppercase tracking-widest">
                  {userLevel}
                </span>

                <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-alt border border-border rounded-full text-[10px] font-bold hover:border-amber-primary/40 transition-all">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={copied ? 'copied' : 'share'}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-1.5"
                    >
                      {copied ? (
                        <><Check className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-500">Disalin!</span></>
                      ) : (
                        <><Share2 className="w-3 h-3" /> Bagikan</>
                      )}
                    </motion.span>
                  </AnimatePresence>
                </button>

                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-alt border border-border rounded-full text-[10px] font-bold hover:border-amber-primary/40 transition-all">
                  <Settings className="w-3 h-3" /> Edit Profil
                </button>
              </div>
              <p className="text-xs font-mono text-muted">@{profile.username}</p>
              {profile.location && (
                <p className="text-muted flex justify-center md:justify-start items-center gap-1.5 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {profile.location}
                </p>
              )}
            </div>

            {profile.bio && (
              <p className="max-w-md text-sm text-muted/80 leading-relaxed italic mx-auto md:mx-0">
                "{profile.bio}"
              </p>
            )}

            {profile.gear && (
              <div className="flex items-center justify-center md:justify-start gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-alt rounded-xl border border-border text-xs font-medium">
                  <HardDrive className="w-3.5 h-3.5 text-amber-primary" />
                  {profile.gear}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto mt-6 md:mt-0">
            <div className="p-4 panel text-center min-w-[90px] rounded-3xl">
              <span className="block text-2xl font-display font-bold">{spots.length}</span>
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Spots</span>
            </div>
            <div className="p-4 panel text-center min-w-[90px] rounded-3xl">
              <span className="block text-2xl font-display font-bold">{photos.length}</span>
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Photos</span>
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-1/3 h-full bg-amber-primary/[0.03] blur-[100px] -z-10" />
      </div>

      {/* Portfolio Section & Actions */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 pr-4 border-r border-border">
              <Grid className="w-4 h-4 text-amber-primary" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Semua Foto</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-primary text-white shadow-lg shadow-amber-primary/20' : 'bg-surface-alt border border-border text-muted hover:border-amber-primary/40'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-amber-primary text-white shadow-lg shadow-amber-primary/20' : 'bg-surface-alt border border-border text-muted hover:border-amber-primary/40'}`}
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-border rounded-[40px]">
            <Camera className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-muted italic text-sm">Belum ada foto yang diunggah.</p>
            <Link href="/add-spot" className="inline-block mt-8 px-8 py-4 bg-foreground text-background rounded-none text-xs font-mono uppercase tracking-[0.2em] font-bold hover:bg-amber-primary hover:text-white transition-all">
              Tambah Spot Pertamamu
            </Link>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" : "flex flex-col gap-8 max-w-2xl mx-auto"}>
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedPhotoIndex(i)}
                className={`group relative overflow-hidden panel hover:border-amber-primary transition-all cursor-pointer ${viewMode === 'grid' ? 'aspect-square rounded-[24px]' : 'w-full rounded-[32px]'}`}
              >
                {viewMode === 'list' ? (
                  <div className="relative w-full" style={{ paddingBottom: '120%' }}>
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || ''}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                ) : (
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || ''}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                  <p className={`${viewMode === 'list' ? 'text-lg' : 'text-[10px]'} font-mono text-amber-primary uppercase font-bold mb-2`}>
                    {photo.spots?.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <Zap className={`${viewMode === 'list' ? 'w-4 h-4' : 'w-3 h-3'} text-amber-primary`} />
                    <span className={`${viewMode === 'list' ? 'text-xs' : 'text-[8px]'} text-white/80 uppercase tracking-wider line-clamp-1`}>
                      {photo.exif_camera || photo.spots?.genre?.[0] || 'Photo'}
                    </span>
                  </div>
                  {viewMode === 'list' && photo.caption && (
                    <p className="mt-4 text-sm text-white/90 italic font-serif leading-relaxed">
                      "{photo.caption}"
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Spots added by this user */}
        {spots.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-4 h-4 text-amber-primary" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Spot yang Ditambahkan</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {spots.slice(0, 6).map(spot => (
                <Link key={spot.id} href={`/spot/${spot.id}`} className="flex items-center gap-4 p-4 panel rounded-2xl hover:border-amber-primary transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-amber-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-amber-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm group-hover:text-amber-primary transition-colors truncate">{spot.name}</p>
                    <p className="text-[10px] font-mono text-muted">{spot.genre?.join(' · ') || '—'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

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
      {/* Photo Detail Modal (Owner) */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-background/90 backdrop-blur-xl">
            <button onClick={() => setSelectedPhotoIndex(null)} className="absolute top-6 right-6 p-2 bg-surface hover-surface rounded-full z-50">
              <X className="w-6 h-6" />
            </button>

            {/* Prev Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1)) }}
              disabled={selectedPhotoIndex === 0}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-surface hover-surface rounded-full z-50 disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(Math.min(photos.length - 1, selectedPhotoIndex + 1)) }}
              disabled={selectedPhotoIndex === photos.length - 1}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-surface hover-surface rounded-full z-50 disabled:opacity-30"
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
                  src={photos[selectedPhotoIndex].photo_url} 
                  alt={photos[selectedPhotoIndex].caption || ''} 
                  className="w-full max-h-[85vh] object-contain rounded-2xl"
                />
              </div>

              {/* Sidebar Info */}
              <div className="w-full md:w-1/3 flex flex-col gap-6 py-4 md:py-8 pr-4">
                {/* Spot Context */}
                <div className="space-y-2">
                  <Link href={`/spot/${photos[selectedPhotoIndex].spots?.id}`} className="inline-block group" onClick={() => setSelectedPhotoIndex(null)}>
                    <h3 className="text-2xl font-display font-bold group-hover:text-amber-primary transition-colors flex items-center gap-2">
                      {photos[selectedPhotoIndex].spots?.name}
                      <Navigation className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    {photos[selectedPhotoIndex].spots?.genre?.map(g => (
                      <span key={g} className="px-2 py-1 bg-surface-alt border border-border text-[10px] font-mono uppercase tracking-widest text-muted rounded-md">
                        {g}
                      </span>
                    ))}
                    {photos[selectedPhotoIndex].spots?.best_time && (
                      <span className="px-2 py-1 bg-surface-alt border border-border text-[10px] font-mono uppercase tracking-widest text-muted rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {photos[selectedPhotoIndex].spots?.best_time}
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-px w-full bg-border" />

                {/* Caption & Edit */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Caption</p>
                    <button 
                      onClick={() => {
                        setIsEditingCaption(!isEditingCaption);
                        setEditedCaption(photos[selectedPhotoIndex].caption || '');
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
                        placeholder="Tambahkan cerita tentang foto ini..."
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setIsEditingCaption(false)} className="px-3 py-1.5 text-xs font-bold text-muted hover:text-foreground">Batal</button>
                        <button 
                          disabled={saving || editedCaption === (photos[selectedPhotoIndex].caption || '')}
                          onClick={async () => {
                            setSaving(true)
                            try {
                              const p = photos[selectedPhotoIndex]
                              await supabase.from('spot_photos').update({ caption: editedCaption }).eq('id', p.id)
                              
                              const newPhotos = [...photos]
                              newPhotos[selectedPhotoIndex] = { ...p, caption: editedCaption }
                              setPhotos(newPhotos)
                              setIsEditingCaption(false)
                            } catch(e) {} finally {
                              setSaving(false)
                            }
                          }}
                          className="px-3 py-1.5 bg-amber-primary text-white text-xs font-bold rounded-lg disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                        >
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simpan'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed italic text-foreground/90">
                      {photos[selectedPhotoIndex].caption ? `"${photos[selectedPhotoIndex].caption}"` : <span className="text-muted/50">Tidak ada caption.</span>}
                    </p>
                  )}
                </div>

                <div className="h-px w-full bg-border" />

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm text-muted">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                      <span className="font-bold">{photos[selectedPhotoIndex].photo_likes?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(photos[selectedPhotoIndex].created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  
                  {/* Delete Action (Moved to metadata row to save vertical space) */}
                  <button 
                    onClick={() => setDeleteConfirmIndex(selectedPhotoIndex)}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 text-red-500/60 hover:text-red-500 text-xs font-bold transition-colors"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmIndex !== null && photos[deleteConfirmIndex] && (
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
                  onClick={() => setDeleteConfirmIndex(null)}
                  className="flex-1 py-3 bg-surface-alt border border-border hover:bg-muted/10 rounded-xl font-bold text-sm transition-colors"
                >
                  Batal
                </button>
                <button 
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true)
                    try {
                      await supabase.from('spot_photos').delete().eq('id', photos[deleteConfirmIndex].id)
                      const newPhotos = photos.filter((_, i) => i !== deleteConfirmIndex)
                      setPhotos(newPhotos)
                      setDeleteConfirmIndex(null)
                      setSelectedPhotoIndex(null)
                    } catch(e) {} finally {
                      setIsDeleting(false)
                    }
                  }}
                  className="flex-1 py-3 bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold text-sm flex items-center justify-center transition-colors disabled:opacity-50 shadow-lg shadow-red-500/20"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Hapus Foto'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
