'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  User as UserIcon,
  MapPin,
  Camera,
  HardDrive,
  Award,
  Loader2,
  Zap,
  Grid,
  Share2,
  Check,
  X,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Heart,
  Clock
} from 'lucide-react'
import { Database } from '@/types/database'
import { AnimatePresence } from 'framer-motion'

type Profile = Database['public']['Tables']['users']['Row']
type Spot = Database['public']['Tables']['spots']['Row']
type SpotPhoto = Database['public']['Tables']['spot_photos']['Row'] & {
  spots: { id: string; name: string; genre: string[] | null; best_time: string | null; difficulty: string | null } | null
  photo_likes?: { user_id: string }[]
}

export default function PublicProfilePage() {
  const params = useParams()
  const username = params.username as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [spots, setSpots] = useState<Spot[]>([])
  const [photos, setPhotos] = useState<SpotPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!username) return
    fetchProfile()
  }, [username])

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

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const decodedUsername = decodeURIComponent(username)

      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', decodedUsername)
        .single()

      if (error || !profileData) {
        setNotFound(true)
        return
      }
      setProfile(profileData as Profile)

      // Fetch spots
      const { data: spotsData } = await supabase
        .from('spots')
        .select('*, spot_photos(id)')
        .eq('added_by', profileData.id)
        .order('created_at', { ascending: false })
        
      const activeSpots = (spotsData as any[] || []).filter(spot => spot.spot_photos && spot.spot_photos.length > 0)
      setSpots(activeSpots)

      // Fetch portfolio photos
      const { data: photosData } = await supabase
        .from('spot_photos')
        .select('*, spots(id, name, genre, best_time, difficulty), photo_likes(user_id)')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })
      setPhotos((photosData as SpotPhoto[]) || [])

    } catch (err) {
      console.error(err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const userLevel = spots.length >= 20 ? 'Pro' : spots.length >= 5 ? 'Enthusiast' : 'Pemula'

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-primary" />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-2xl mx-auto px-6 py-40 text-center">
          <UserIcon className="w-20 h-20 mx-auto mb-6 opacity-10" />
          <h1 className="text-4xl font-display font-bold mb-3">Profil Tidak Ditemukan</h1>
          <p className="text-muted mb-8">Username <span className="font-mono text-amber-primary">@{decodeURIComponent(username)}</span> tidak ada di PhotoTracker.</p>
          <Link href="/spots" className="btn-primary inline-flex items-center gap-2">
            Jelajahi Spot
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-20 transition-colors">

      {/* Profile Header */}
      <div className="relative pt-[var(--nav-height)] pb-12 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
          {/* Avatar */}
          <div className="relative">
            <div className="w-28 h-28 rounded-[36px] bg-surface-alt p-1 border border-border shadow-xl">
              <div className="w-full h-full rounded-[32px] bg-sand/20 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username || ''} className="w-full h-full object-cover" />
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
                        <><Check className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-500">Tautan Disalin!</span></>
                      ) : (
                        <><Share2 className="w-3 h-3" /> Bagikan</>
                      )}
                    </motion.span>
                  </AnimatePresence>
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
              <p className="max-w-md text-sm text-muted/80 leading-relaxed italic">
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
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
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

      {/* Photo Grid */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-6">
          <Grid className="w-4 h-4 text-amber-primary" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Portfolio</p>
        </div>

        {photos.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-border rounded-[40px]">
            <Camera className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-muted italic text-sm">Belum ada foto yang diunggah.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedPhotoIndex(i)}
                className="group relative aspect-square rounded-[24px] overflow-hidden panel hover:border-amber-primary transition-all cursor-pointer"
              >
                <img
                  src={photo.photo_url}
                  alt={photo.caption || ''}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <p className="text-[10px] font-mono text-amber-primary uppercase font-bold mb-1">
                    {photo.spots?.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-primary" />
                    <span className="text-[8px] text-white/60 uppercase line-clamp-1">
                      {photo.spots?.genre?.[0] || 'Photo'}
                    </span>
                  </div>
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
      </div>

      {/* Photo Detail Modal (Read-Only) */}
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

                {/* Caption */}
                <div className="space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Caption</p>
                  <p className="text-sm leading-relaxed italic text-foreground/90">
                    {photos[selectedPhotoIndex].caption ? `"${photos[selectedPhotoIndex].caption}"` : <span className="text-muted/50">Tidak ada caption.</span>}
                  </p>
                </div>

                <div className="h-px w-full bg-border" />

                {/* Metadata */}
                <div className="flex items-center gap-6 text-sm text-muted">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                    <span className="font-bold">{photos[selectedPhotoIndex].photo_likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(photos[selectedPhotoIndex].created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
