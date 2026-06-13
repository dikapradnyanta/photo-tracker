'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  ArrowLeft, MapPin, Clock, Zap, Star, Camera, Loader2,
  Heart, MessageSquare, Navigation, Send, ChevronLeft, ChevronRight, Check,
  Route, NotepadText
} from 'lucide-react'
import { Database } from '@/types/database'
import { useToast } from '@/context/ToastContext'

type Spot = Database['public']['Tables']['spots']['Row']
type SpotPhoto = Database['public']['Tables']['spot_photos']['Row'] & {
  users?: { username: string | null; avatar_url: string | null } | null
  likesCount: number
  hasLiked: boolean
}
type SpotReview = Database['public']['Tables']['spot_reviews']['Row'] & {
  users: { username: string | null; avatar_url: string | null } | null
}

const BEST_TIME_LABEL: Record<string, string> = {
  golden_hour: 'Golden Hour',
  blue_hour: 'Blue Hour',
  midday: 'Siang Hari',
  night: 'Malam Hari',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Mudah',
  medium: 'Sedang',
  hard: 'Sulit',
}

const DIFFICULTY_STYLE: Record<string, { bg: string, text: string, border: string }> = {
  easy: { bg: 'rgba(16, 185, 129, 0.08)', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  medium: { bg: 'rgba(245, 158, 11, 0.08)', text: 'text-amber-500', border: 'border-amber-500/20' },
  hard: { bg: 'rgba(244, 63, 94, 0.08)', text: 'text-rose-500', border: 'border-rose-500/20' },
}

const BLUR_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
}

export default function SpotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { showToast } = useToast()

  const [spot, setSpot] = useState<Spot | null>(null)
  const [photos, setPhotos] = useState<SpotPhoto[]>([])
  const [reviews, setReviews] = useState<SpotReview[]>([])
  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [topSpots, setTopSpots] = useState<any[]>([])

  // Active photo index (0 = best photo)
  const [activeIndex, setActiveIndex] = useState(0)

  // Add Photo State
  const [isAddingPhoto, setIsAddingPhoto] = useState(false)
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filmstrip auto-scroll
  const filmstripRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!filmstripRef.current) return
    const thumbs = filmstripRef.current.querySelectorAll('button')
    thumbs[activeIndex]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    })
  }, [activeIndex])

  // Review form
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Carousel State
  const [carouselIdx, setCarouselIdx] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    async function fetchSpot() {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user ?? null
        setCurrentUser(user)

        const { data: spotData, error: spotError } = await supabase
          .from('spots').select('*').eq('id', id).single()
        if (spotError) throw spotError
        setSpot(spotData)

        const { data: photosData } = await supabase
          .from('spot_photos')
          .select('*, users!spot_photos_user_id_fkey(username, avatar_url), photo_likes(user_id)')
          .eq('spot_id', id)
          .order('created_at', { ascending: true })

        const formatted = (photosData || []).map((p: any) => ({
          ...p,
          likesCount: p.photo_likes?.length || 0,
          hasLiked: p.photo_likes?.some((l: any) => l.user_id === user?.id) || false
        }))
        formatted.sort((a, b) => b.likesCount - a.likesCount)
        setPhotos(formatted)

        const { data: reviewsData } = await supabase
          .from('spot_reviews')
          .select('*, users(username, avatar_url)')
          .eq('spot_id', id)
          .order('created_at', { ascending: false })
          .limit(10)
        
        const fetchedReviews = (reviewsData as SpotReview[]) || []
        setReviews(fetchedReviews)
        if (fetchedReviews.length > 0) {
          const sum = fetchedReviews.reduce((acc, r) => acc + (r.rating || 0), 0)
          setAvgRating(Math.round((sum / fetchedReviews.length) * 10) / 10)
        }

        if (user) {
          setHasReviewed(fetchedReviews.some(r => r.user_id === user.id))
        }

        // Fetch other top spots
        const { data: allSpotsData } = await supabase
          .from('spots')
          .select('*, spot_photos(photo_url), spot_reviews(rating)')

        if (allSpotsData) {
          const mappedSpots = allSpotsData.map((s: any) => {
            const sum = s.spot_reviews.reduce((a: number, r: any) => a + (r.rating || 0), 0)
            const avg = s.spot_reviews.length > 0 ? sum / s.spot_reviews.length : 0
            return {
              ...s,
              avgRating: avg,
              hero_photo_url: s.spot_photos?.[0]?.photo_url || null
            }
          })
          mappedSpots.sort((a, b) => b.avgRating - a.avgRating)
          setTopSpots(mappedSpots.filter(s => s.id !== id).slice(0, 5))
        }

      } catch (err) {
        console.error('Error fetching spot:', err)
        router.push('/map')
      } finally {
        setLoading(false)
      }
    }
    fetchSpot()
  }, [id, router])

  const handleToggleLike = async (photoId: string, currentlyLiked: boolean) => {
    if (!currentUser) { showToast('Silakan login untuk memberikan like!', 'error'); return router.push('/login') }
    setPhotos(prev => {
      const updated = prev.map(p =>
        p.id === photoId ? { ...p, hasLiked: !currentlyLiked, likesCount: currentlyLiked ? p.likesCount - 1 : p.likesCount + 1 } : p
      )
      return updated
    })
    try {
      if (currentlyLiked) {
        await supabase.from('photo_likes').delete().eq('photo_id', photoId).eq('user_id', currentUser.id)
      } else {
        await supabase.from('photo_likes').insert({ photo_id: photoId, user_id: currentUser.id })
      }
    } catch (err) { console.error('Error toggling like:', err) }
  }

  const handleSubmitReview = async () => {
    if (!currentUser || !spot || reviewRating === 0) return
    setSubmittingReview(true)
    try {
      const { data, error } = await supabase
        .from('spot_reviews')
        .insert({ spot_id: spot.id, user_id: currentUser.id, rating: reviewRating, comment: reviewComment.trim() || null, visited_at: new Date().toISOString().split('T')[0] })
        .select('*, users(username, avatar_url)').single()
      if (error) throw error
      setReviews(prev => [data as SpotReview, ...prev])
      const newAvg = [...reviews, data as SpotReview].reduce((a, r) => a + (r.rating || 0), 0) / (reviews.length + 1)
      setAvgRating(Math.round(newAvg * 10) / 10)
      setReviewRating(0)
      setReviewComment('')
    } catch (err: any) {
      showToast(`Gagal submit review: ${err.message}`, 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewPhotoFile(file)
      setNewPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleUploadPhoto = async () => {
    if (!newPhotoFile || !currentUser || !spot) return
    setIsUploadingPhoto(true)
    try {
      const ext = newPhotoFile.name.split('.').pop()
      const filename = `${currentUser.id}_${Date.now()}.${ext}`
      const filePath = `${spot.id}/${filename}`

      const { error: uploadError } = await supabase.storage
        .from('spots')
        .upload(filePath, newPhotoFile)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('spots')
        .getPublicUrl(filePath)

      const photoUrl = publicUrlData.publicUrl

      const { error: dbError } = await supabase
        .from('spot_photos')
        .insert({
          spot_id: spot.id,
          user_id: currentUser.id,
          photo_url: photoUrl,
          is_featured: false
        })

      if (dbError) throw dbError

      showToast('Foto berhasil ditambahkan!', 'success')
      setIsAddingPhoto(false)
      setNewPhotoFile(null)
      setNewPhotoPreview(null)
      
      // Refresh photos
      const { data: photosData } = await supabase
        .from('spot_photos')
        .select('*, users!spot_photos_user_id_fkey(username, avatar_url), photo_likes(user_id)')
        .eq('spot_id', spot.id)
        .order('created_at', { ascending: true })
        
      if (photosData) {
        const formatted = photosData.map((p: any) => ({
          ...p,
          likesCount: p.photo_likes?.length || 0,
          hasLiked: p.photo_likes?.some((l: any) => l.user_id === currentUser?.id) || false
        }))
        formatted.sort((a, b) => b.likesCount - a.likesCount)
        setPhotos(formatted)
      }
    } catch (err: any) {
      showToast(`Gagal upload foto: ${err.message}`, 'error')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft
      const cardWidth = 300 + 16 // card width + gap
      const newIdx = Math.round(scrollLeft / cardWidth)
      setCarouselIdx(newIdx)
    }
  }

  const scrollToIdx = (n: number) => {
    if (carouselRef.current) {
      const cardWidth = 300 + 16
      carouselRef.current.scrollTo({ left: n * cardWidth, behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400 mx-auto mb-4" />
          <p className="text-white font-bold text-lg">Memuat Spot...</p>
        </div>
      </div>
    )
  }
  if (!spot) return null

  const activePhotoObj = photos[activeIndex]
  const diffStyle = DIFFICULTY_STYLE[spot.difficulty || 'easy'] || DIFFICULTY_STYLE.easy

  return (
    <main className="min-h-screen w-full bg-background text-foreground pb-32">
      
      {/* ───── FLOATING NAVBAR ───── */}
      <div className="fixed top-0 left-0 w-full z-[4000] pointer-events-none">
        <div className="pointer-events-auto">
        </div>
      </div>

      {/* ───── HERO: IMMERSIVE FULL SCREEN ───── */}
      <section className="relative w-full h-screen min-h-[600px] bg-black overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePhotoObj?.id || 'empty'}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-0"
          >
            {activePhotoObj?.photo_url ? (
              <Image src={activePhotoObj.photo_url} alt={spot.name} fill priority className="object-cover" sizes="100vw" />
            ) : (
              <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                <Camera className="w-24 h-24 text-white/10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent hidden md:block" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-16 pb-24 md:pb-32">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-4xl">
            <motion.div variants={fadeUp} className="mb-6">
              <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-4">
              {spot.genre?.map(g => (
                <span key={g} className="px-3 py-1 bg-amber-500 text-white text-[10px] font-mono font-black rounded uppercase tracking-wider shadow-lg">
                  {g}
                </span>
              ))}
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[84px] font-display font-black leading-[0.9] tracking-tighter text-white mb-6 drop-shadow-2xl">
              {spot.name}
            </motion.h1>

            <motion.div variants={fadeUp} className="flex items-center flex-wrap gap-4">
              <div className="flex items-center gap-1.5 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full shadow-xl">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span className="text-white/90 text-sm font-medium">{spot.latitude?.toFixed(4) ?? '–'}, {spot.longitude?.toFixed(4) ?? '–'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full shadow-xl">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-white font-bold text-sm">{avgRating > 0 ? avgRating : 'Baru'}</span>
                <span className="text-white/60 text-xs">({reviews.length} ulasan)</span>
              </div>
              {activePhotoObj && (
                <>
                  <button
                    onClick={() => handleToggleLike(activePhotoObj.id, activePhotoObj.hasLiked)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all shadow-xl ${activePhotoObj.hasLiked ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20'}`}
                  >
                    <Heart className={`w-4 h-4 ${activePhotoObj.hasLiked ? 'fill-white' : ''}`} />
                    <span>{activePhotoObj.likesCount}</span>
                  </button>
                  
                  {/* Contributor Badge */}
                  <Link href={`/profile/${activePhotoObj.users?.username || ''}`} className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full shadow-xl hover:bg-black/60 transition-colors group">
                    {activePhotoObj.users?.avatar_url ? (
                      <Image src={activePhotoObj.users.avatar_url} alt="Avatar" width={20} height={20} placeholder="blur" blurDataURL={BLUR_URL} className="rounded-full object-cover border border-white/20" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                        <Camera className="w-3 h-3 text-white/70" />
                      </div>
                    )}
                    <span className="text-white/70 text-xs">Foto oleh</span>
                    <span className="text-white font-bold text-sm group-hover:text-amber-400 transition-colors">
                      {activePhotoObj.users?.username || 'Anonim'}
                    </span>
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ───── GALLERY TOOLBAR ───── */}
      <div className="relative z-30 max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-4 flex items-center justify-between">
        <h3 className="text-2xl font-display font-bold">Galeri Spot</h3>
        {currentUser && (
          <button onClick={() => setIsAddingPhoto(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-primary text-white text-sm font-bold rounded-full hover:bg-amber-primary/90 transition-colors shadow-lg">
            <Camera className="w-4 h-4" /> Tambah Foto
          </button>
        )}
      </div>

      {/* ───── FILMSTRIP GALLERY ───── */}
      {photos.length > 1 && (
        <div className="relative z-30 max-w-7xl mx-auto px-6 md:px-12 pb-4">
          <div
            ref={filmstripRef}
            className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory py-2 px-1"
          >
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => setActiveIndex(i)}
                className={`relative shrink-0 w-32 h-24 md:w-48 md:h-32 rounded-xl overflow-hidden snap-center outline-none transition-all duration-200 ${
                  i === activeIndex 
                    ? 'ring-2 ring-amber-primary ring-offset-2 ring-offset-background opacity-100' 
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={photo.photo_url} alt={`Thumbnail ${i + 1}`} fill sizes="(max-width: 768px) 128px, 192px" placeholder="blur" blurDataURL={BLUR_URL} className="object-cover" />
                
                {/* Number Overlay */}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-mono font-bold text-white">
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* Like Badge */}
                {photo.likesCount > 0 && (
                  <div className="absolute bottom-1.5 right-1.5 px-1 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded">
                    <Heart className="w-2.5 h-2.5 fill-white text-white" />
                    <span className="text-[9px] font-bold text-white">{photo.likesCount}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ───── SECTIONS BELOW HERO ───── */}
      <section className="relative z-30 max-w-7xl mx-auto px-6 md:px-12 pt-12 md:pt-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Left Column — Info & Gallery */}
        <div className="lg:col-span-8 space-y-16">
          
          {/* Info Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Waktu Terbaik */}
            <div className="group p-6 rounded-[24px] border border-border bg-surface hover:border-foreground/20 transition-all duration-300 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center gap-2.5 mb-6">
                <Clock className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
                <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted font-bold">Waktu Terbaik</h4>
              </div>
              <p className="text-3xl font-display font-medium text-foreground tracking-tight">
                {BEST_TIME_LABEL[spot.best_time || ''] || spot.best_time || '-'}
              </p>
            </div>
            
            {/* Aksesibilitas */}
            <div className="group p-6 rounded-[24px] border border-border bg-surface hover:border-foreground/20 transition-all duration-300 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center gap-2.5 mb-6">
                <Route className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
                <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted font-bold">Aksesibilitas</h4>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-display font-medium text-foreground tracking-tight">
                  {DIFFICULTY_LABEL[spot.difficulty || 'easy']}
                </p>
                <div className={`w-2 h-2 rounded-full bg-current ${diffStyle.text} mb-2.5`} />
              </div>
            </div>
          </div>

          <article className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed">
            <p className="text-xl text-foreground/80 font-medium">
              {spot.description || "Belum ada deskripsi untuk spot ini."}
            </p>
          </article>

          {spot.tips_trik && (
            <div className="group p-8 rounded-[24px] border border-border bg-surface hover:border-foreground/20 transition-all duration-300">
              <div className="flex items-center gap-2.5 mb-5">
                <NotepadText className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
                <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted font-bold">Tips & Trik</h3>
              </div>
              <p className="text-foreground/90 leading-relaxed text-lg">{spot.tips_trik}</p>
            </div>
          )}

          {/* Carousel Spot Terpopuler */}
          {topSpots.length > 0 && (
            <div className="pt-12 border-t border-border">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-display font-bold">Spot Terpopuler</h3>
                
                {/* Carousel Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollToIdx(Math.max(0, carouselIdx - 1))}
                    disabled={carouselIdx === 0}
                    className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center hover:bg-muted/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollToIdx(Math.min(topSpots.length - 1, carouselIdx + 1))}
                    disabled={carouselIdx >= topSpots.length - 1}
                    className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center hover:bg-muted/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div 
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {topSpots.map((ts) => (
                  <Link
                    key={ts.id}
                    href={`/spot/${ts.id}`}
                    className="w-[300px] shrink-0 snap-center group block rounded-[24px] overflow-hidden bg-surface border border-border hover:border-amber-primary/40 transition-all shadow-md"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-surface-alt">
                      <Image src={ts.hero_photo_url || 'https://via.placeholder.com/400'} alt="" fill sizes="300px" placeholder="blur" blurDataURL={BLUR_URL} className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Genre Chip */}
                      {ts.genre?.[0] && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                          {ts.genre[0]}
                        </div>
                      )}
                      
                      {/* Rating Badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-xs">{ts.avgRating > 0 ? ts.avgRating.toFixed(1) : 'Baru'}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-lg leading-tight mb-1 group-hover:text-amber-primary transition-colors line-clamp-1">{ts.name}</h4>
                      <p className="text-[11px] text-muted font-mono uppercase">
                        {DIFFICULTY_LABEL[ts.difficulty || 'easy']} • {BEST_TIME_LABEL[ts.best_time || '']}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Dots Indicator */}
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {topSpots.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === carouselIdx ? 'w-6 bg-amber-primary' : 'w-1.5 bg-border'}`} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Reviews Panel */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-2xl font-display font-bold flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-amber-primary" /> Review
              </h3>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-surface-alt rounded-full">{reviews.length} Ulasan</span>
            </div>

            {currentUser ? (
              hasReviewed ? (
                <div className="p-6 rounded-[24px] bg-surface-alt border border-border text-center">
                  <Check className="w-8 h-8 text-amber-primary mx-auto mb-3" />
                  <p className="font-bold text-sm">Kamu sudah pernah memberikan ulasan untuk spot ini.</p>
                </div>
              ) : (
                <div className="p-6 rounded-[24px] bg-surface border border-border shadow-lg">
                  <p className="text-sm font-bold mb-4">Bagaimana pengalamanmu?</p>
                  {/* Touch-target wrappers for stars */}
                  <div className="flex gap-2 mb-6">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n}
                        onClick={() => setReviewRating(n)}
                        onMouseEnter={() => setReviewHover(n)}
                        onMouseLeave={() => setReviewHover(0)}
                        className="p-1 -m-1 focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-10 h-10 md:w-8 md:h-8 transition-colors ${
                            n <= (reviewHover || reviewRating)
                              ? 'fill-amber-primary text-amber-primary drop-shadow-[0_0_8px_rgba(232,105,42,0.4)]'
                              : 'text-muted/20'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full bg-background border border-border py-3 px-4 rounded-xl text-sm min-h-[100px] mb-4 resize-none focus:border-amber-primary/50 focus:ring-1 focus:ring-amber-primary/50 outline-none transition-all"
                    placeholder="Ceritakan detail akses, cuaca, atau angle terbaikmu..."
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                  />
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewRating === 0 || submittingReview}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-foreground text-background rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                    Kirim Ulasan
                  </button>
                </div>
              )
            ) : (
              <div className="p-8 text-center rounded-[24px] bg-amber-primary/5 border border-amber-primary/20">
                <Star className="w-8 h-8 text-amber-primary mx-auto mb-4" />
                <p className="text-sm text-foreground/80 mb-6">Login untuk memberikan ulasan pada spot ini.</p>
                <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 bg-amber-primary text-white font-bold rounded-full hover:shadow-lg w-full">
                  Login sekarang
                </Link>
              </div>
            )}

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="py-16 text-center rounded-[24px] border border-dashed border-border flex flex-col items-center justify-center">
                  <Camera className="w-12 h-12 text-muted opacity-20 mb-3" />
                  <p className="text-sm font-bold text-foreground/70">Jadilah yang pertama</p>
                  <p className="text-xs text-muted mt-1">berbagi pengalaman di spot ini.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {reviews.map((review, i) => (
                    <motion.div 
                      key={review.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 rounded-[20px] bg-surface border border-border group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/profile/${review.users?.username}`} className="w-8 h-8 rounded-full bg-amber-primary/10 border border-amber-primary/20 flex items-center justify-center text-[10px] font-bold text-amber-primary hover:bg-amber-primary hover:text-white transition-colors">
                            {review.users?.username?.[0]?.toUpperCase() || '?'}
                          </Link>
                          <div>
                            <Link href={`/profile/${review.users?.username}`} className="text-sm font-bold hover:text-amber-primary transition-colors block leading-none mb-1">
                              {review.users?.username || 'Anonim'}
                            </Link>
                            <span className="text-[9px] text-muted font-mono">{new Date(review.created_at).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} className={`w-3 h-3 ${idx < (review.rating || 0) ? 'fill-amber-primary text-amber-primary' : 'text-muted/20'}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-foreground/80 leading-relaxed pl-11">{review.comment}</p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───── ADD PHOTO MODAL ───── */}
      <AnimatePresence>
        {isAddingPhoto && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isUploadingPhoto && setIsAddingPhoto(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-background rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              <h3 className="text-2xl font-display font-bold mb-4">Tambah Foto</h3>
              <p className="text-sm text-foreground/70 mb-6">Bagikan angle terbaikmu untuk spot ini!</p>
              
              <div 
                onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
                className={`relative w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-colors mb-6
                  ${newPhotoPreview ? 'border-transparent bg-black' : 'border-border bg-surface hover:bg-surface-alt'}
                `}
              >
                {newPhotoPreview ? (
                  <img src={newPhotoPreview} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-muted mb-3" />
                    <span className="text-sm font-bold text-foreground">Pilih Foto</span>
                    <span className="text-xs text-muted mt-1">PNG, JPG up to 10MB</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handlePhotoFileChange} 
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAddingPhoto(false)}
                  disabled={isUploadingPhoto}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-surface-alt hover:bg-surface-alt/80 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  onClick={handleUploadPhoto}
                  disabled={!newPhotoFile || isUploadingPhoto}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-amber-primary text-white hover:bg-amber-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
