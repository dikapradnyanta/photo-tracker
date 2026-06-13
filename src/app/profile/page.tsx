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
import ToastNotification, { ToastType } from './components/ToastNotification'
import EditProfileModal from './components/EditProfileModal'
import PhotoDetailModal from './components/PhotoDetailModal'
import DeleteConfirmModal from './components/DeleteConfirmModal'

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
  const [profile, setProfile] = useState<Profile | null>(null)
  const [spots, setSpots] = useState<Spot[]>([])
  const [photos, setPhotos] = useState<SpotPhoto[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [genres, setGenres] = useState<string[]>(['Semua'])
  const [copied, setCopied] = useState(false)
  
  // Modal & Toast state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<ToastType>(null)

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message)
    setToastType(type)
  }
  
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

      // Fetch user's spots
      const { data: spotsData, error: spotsError } = await supabase
        .from('spots')
        .select('*, spot_photos(id)')
        .eq('added_by', session.user.id)
        .order('created_at', { ascending: false })

      if (spotsError) throw spotsError
      
      const activeSpots = (spotsData as any[] || []).filter(spot => spot.spot_photos && spot.spot_photos.length > 0)
      setSpots(activeSpots)

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
      <div className="relative pt-[var(--nav-height)] pb-12 px-4 md:px-6 overflow-hidden mt-16 md:mt-24">
        {/* Mobile View (< md) */}
        <div className="md:hidden max-w-5xl mx-auto flex flex-col gap-4 relative z-10">
          {/* Avatar and Stats Row */}
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-surface-alt p-1 border border-border shadow-md">
                <div className="w-full h-full rounded-full bg-sand/20 flex items-center justify-center overflow-hidden relative">
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt={profile.username || ''} fill sizes="80px" className="object-cover" />
                  ) : (
                    <UserIcon className="w-8 h-8 opacity-20" />
                  )}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-amber-primary rounded-full flex items-center justify-center border-2 border-background shadow-md">
                <Award className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="flex-1 flex justify-around items-center">
              <div className="flex flex-col items-center">
                <span className="text-xl font-display font-bold">{spots.length}</span>
                <span className="text-[11px] text-muted font-mono uppercase tracking-widest">Spots</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-display font-bold">{photos.length}</span>
                <span className="text-[11px] text-muted font-mono uppercase tracking-widest">Photos</span>
              </div>
            </div>
          </div>

          {/* Bio Info */}
          <div className="flex flex-col text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">{profile.full_name || profile.username}</span>
              <span className="px-2 py-0.5 bg-amber-primary/10 border border-amber-primary/20 text-amber-primary text-[9px] font-mono font-bold rounded-full uppercase tracking-widest">
                {userLevel}
              </span>
            </div>
            <p className="text-xs font-mono text-muted">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm leading-relaxed text-muted/90 italic mt-1">
                {profile.bio}
              </p>
            )}
            {profile.location && (
              <p className="text-muted flex items-center gap-1.5 text-xs mt-1">
                <MapPin className="w-3.5 h-3.5" /> {profile.location}
              </p>
            )}
            {profile.gear && (
              <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
                <HardDrive className="w-3.5 h-3.5" /> {profile.gear}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button onClick={() => setIsEditing(true)} className="flex-1 py-1.5 bg-surface-alt border border-border rounded-lg text-sm font-semibold hover:border-amber-primary/40 transition-colors">
              Edit Profil
            </button>
            <button onClick={handleShare} className="flex-1 py-1.5 bg-surface-alt border border-border rounded-lg text-sm font-semibold hover:border-amber-primary/40 transition-colors flex justify-center items-center gap-1.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={copied ? 'copied' : 'share'}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-emerald-500">Disalin!</span></>
                  ) : (
                    <><Share2 className="w-3.5 h-3.5" /> Bagikan</>
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Desktop View (>= md) */}
        <div className="hidden md:flex max-w-5xl mx-auto flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => setActiveTab(genre)}
                className={`px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === genre 
                    ? 'bg-amber-primary text-white shadow-md shadow-amber-primary/20' 
                    : 'bg-surface-alt border border-border text-muted hover:border-amber-primary/40'
                }`}
              >
                {genre === 'Semua' ? 'Semua Foto' : genre}
              </button>
            ))}
          </div>
          <div className="flex gap-2 shrink-0">
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

        {filteredPhotos.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-border rounded-[40px]">
            <Camera className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-muted italic text-sm">Belum ada foto yang diunggah.</p>
            {activeTab === 'Semua' && (
              <Link href="/add-spot" className="inline-block mt-8 px-8 py-4 bg-foreground text-background rounded-none text-xs font-mono uppercase tracking-[0.2em] font-bold hover:bg-amber-primary hover:text-white transition-all">
                Tambah Spot Pertamamu
              </Link>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" : "flex flex-col gap-8 max-w-2xl mx-auto"}>
            {filteredPhotos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedPhotoIndex(photos.findIndex(p => p.id === photo.id))}
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

      <EditProfileModal 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        profile={profile} 
        onSaveSuccess={(p) => setProfile(p)} 
        showToast={showToast} 
      />

      <PhotoDetailModal 
        photo={selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null}
        onClose={() => setSelectedPhotoIndex(null)}
        onPrev={() => setSelectedPhotoIndex(Math.max(0, (selectedPhotoIndex || 0) - 1))}
        onNext={() => setSelectedPhotoIndex(Math.min(photos.length - 1, (selectedPhotoIndex || 0) + 1))}
        hasPrev={(selectedPhotoIndex || 0) > 0}
        hasNext={(selectedPhotoIndex || 0) < photos.length - 1}
        onDeleteClick={() => setDeleteConfirmIndex(selectedPhotoIndex)}
        onUpdateCaption={(id, cap) => {
          setPhotos(photos.map(p => p.id === id ? { ...p, caption: cap } : p))
        }}
        showToast={showToast}
      />

      <DeleteConfirmModal 
        isOpen={deleteConfirmIndex !== null}
        onClose={() => setDeleteConfirmIndex(null)}
        onConfirm={async () => {
          if (deleteConfirmIndex === null) return
          await supabase.from('spot_photos').delete().eq('id', photos[deleteConfirmIndex].id)
          const newPhotos = photos.filter((_, i) => i !== deleteConfirmIndex)
          setPhotos(newPhotos)
          setSelectedPhotoIndex(null)
          showToast('Foto berhasil dihapus.', 'success')
        }}
      />

      <ToastNotification message={toastMessage} type={toastType} onClose={() => setToastType(null)} />
    </main>
  )
}
