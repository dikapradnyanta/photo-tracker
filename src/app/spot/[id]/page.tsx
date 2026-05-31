'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, MapPin, Clock, Zap, Star, Camera, Loader2,
  Heart, MessageSquare, Navigation, Send, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Database } from '@/types/database'

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

export default function SpotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [spot, setSpot] = useState<Spot | null>(null)
  const [photos, setPhotos] = useState<SpotPhoto[]>([])
  const [reviews, setReviews] = useState<SpotReview[]>([])
  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Active photo index — 0 = best photo (most liked), others are cards
  const [activeIndex, setActiveIndex] = useState(0)

  // Review form
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Info panel toggle for mobile
  const [showInfo, setShowInfo] = useState(false)

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
          .select('*, users(username, avatar_url), photo_likes(user_id)')
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
        const fetched = (reviewsData as SpotReview[]) || []
        setReviews(fetched)
        if (fetched.length > 0) {
          const sum = fetched.reduce((acc, r) => acc + (r.rating || 0), 0)
          setAvgRating(Math.round((sum / fetched.length) * 10) / 10)
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
    if (!currentUser) { alert('Silakan login untuk memberikan like!'); return router.push('/login') }
    setPhotos(prev => {
      const updated = prev.map(p =>
        p.id === photoId ? { ...p, hasLiked: !currentlyLiked, likesCount: currentlyLiked ? p.likesCount - 1 : p.likesCount + 1 } : p
      )
      // After liking, re-sort but keep activeIndex pointing to same photo
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
      alert(`Gagal submit review: ${err.message}`)
    } finally {
      setSubmittingReview(false)
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

  const activePhoto = photos[activeIndex]
  const cardPhotos = photos.filter((_, i) => i !== activeIndex)

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black text-white">

      {/* ───── FLOATING NAVBAR ───── */}
      <div className="absolute top-0 left-0 w-full z-[4000] pointer-events-none">
        <div className="pointer-events-auto">
          <Navbar />
        </div>
      </div>

      {/* ───── HERO BACKGROUND IMAGE ───── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePhoto?.id || 'empty'}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-0"
        >
          {activePhoto?.photo_url ? (
            <Image
              src={activePhoto.photo_url}
              alt={spot.name}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
              <Camera className="w-24 h-24 text-white/10" />
            </div>
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent hidden md:block" />
        </motion.div>
      </AnimatePresence>

      {/* ───── MAIN UI LAYER ───── */}
      <div className="absolute inset-0 z-20 flex flex-col">

        {/* ── DESKTOP LAYOUT ─────────────────────────────────────────── */}
        <div className="hidden md:flex flex-1 overflow-hidden">

          {/* LEFT: Title & Info */}
          <div className="flex flex-col justify-end p-10 lg:p-16 pb-32 w-[55%] lg:w-[60%]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              className="max-w-xl"
            >
              {/* Back */}
              <button
                onClick={() => router.back()}
                className="mb-6 flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Kembali
              </button>

              {/* Genre Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {spot.genre?.map(g => (
                  <span key={g} className="px-3 py-1 bg-amber-500 text-white text-[10px] font-mono font-black rounded uppercase tracking-wider">
                    {g}
                  </span>
                ))}
              </div>

              {/* Spot Name */}
              <h1 className="text-6xl lg:text-8xl font-display font-black leading-none tracking-tighter text-white mb-4 drop-shadow-2xl">
                {spot.name}
              </h1>

              {/* Description (short) */}
              {spot.description && (
                <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-sm line-clamp-3">
                  {spot.description}
                </p>
              )}

              {/* Meta Row */}
              <div className="flex items-center flex-wrap gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-sm">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-white/80 text-xs">{spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-white/80 text-xs font-bold">{avgRating > 0 ? avgRating : 'Baru'}</span>
                  <span className="text-white/40 text-xs">({reviews.length})</span>
                </div>
                {activePhoto && (
                  <button
                    onClick={() => handleToggleLike(activePhoto.id, activePhoto.hasLiked)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${activePhoto.hasLiked ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20'}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${activePhoto.hasLiked ? 'fill-white' : ''}`} />
                    <span className="text-xs font-bold">{activePhoto.likesCount}</span>
                  </button>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black rounded-full text-xs font-bold hover:bg-amber-400 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Navigasi
                </a>
              </div>

              {/* Photographer */}
              {activePhoto?.users?.username && (
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                    {activePhoto.users.avatar_url ? (
                      <img src={activePhoto.users.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
                        {activePhoto.users.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-white/60 text-xs">
                    Foto oleh{' '}
                    <Link href={`/profile/${activePhoto.users.username}`} className="text-white font-bold hover:text-amber-400 transition-colors">
                      @{activePhoto.users.username}
                    </Link>
                  </span>
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT: Photo Cards Stack + Info Panel */}
          <div className="flex flex-col justify-end pb-10 pr-10 gap-6 w-[45%] lg:w-[40%]">

            {/* Photo Index Counter */}
            {photos.length > 0 && (
              <div className="self-end text-right">
                <span className="text-6xl font-display font-black text-white/10 leading-none">
                  {String(activeIndex + 1).padStart(2, '0')}
                </span>
                <span className="text-sm text-white/30 block">/{String(photos.length).padStart(2, '0')}</span>
              </div>
            )}

            {/* Photo Cards Horizontal Scroll */}
            {photos.length > 1 && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">Foto Lainnya</p>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {photos.map((photo, i) => {
                    if (i === activeIndex) return null
                    return (
                      <button
                        key={photo.id}
                        onClick={() => setActiveIndex(i)}
                        className="shrink-0 snap-center relative w-[160px] h-[110px] rounded-2xl overflow-hidden border-2 border-white/10 hover:border-amber-400 transition-all group"
                      >
                        {photo.photo_url ? (
                          <Image src={photo.photo_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="160px" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-white/20" />
                          </div>
                        )}
                        {/* Card overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <div className="flex items-center gap-1 text-white/80">
                            <Heart className={`w-3 h-3 ${photo.hasLiked ? 'fill-amber-400 text-amber-400' : ''}`} />
                            <span className="text-[9px] font-bold">{photo.likesCount}</span>
                          </div>
                        </div>
                        {/* Photographer */}
                        {photo.users?.username && (
                          <div className="absolute top-2 left-2">
                            <div className="w-5 h-5 rounded-full overflow-hidden border border-white/30">
                              {photo.users.avatar_url ? (
                                <img src={photo.users.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-amber-500 flex items-center justify-center text-white text-[7px] font-bold">
                                  {photo.users.username[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <div className="flex items-center gap-2 self-end">
                <button
                  onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
                  disabled={activeIndex === 0}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveIndex(i => Math.min(photos.length - 1, i + 1))}
                  disabled={activeIndex === photos.length - 1}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ── MOBILE LAYOUT ─────────────────────────────────────────────── */}
        <div className="flex md:hidden flex-col h-full">

          {/* TOP AREA: back button (space for navbar) */}
          <div className="pt-[80px] px-5">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
          </div>

          {/* SPACER */}
          <div className="flex-1" />

          {/* BOTTOM INFO SECTION */}
          <div className="px-5 pb-4">

            {/* Genre + Title */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {spot.genre?.map(g => (
                <span key={g} className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-mono font-black rounded uppercase tracking-wider">{g}</span>
              ))}
            </div>
            <h1 className="text-4xl font-display font-black leading-none tracking-tighter text-white mb-3">
              {spot.name}
            </h1>

            {/* Meta */}
            <div className="flex items-center flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-white/80 text-xs font-bold">{avgRating > 0 ? avgRating : 'Baru'}</span>
              </div>
              {activePhoto && (
                <button
                  onClick={() => handleToggleLike(activePhoto.id, activePhoto.hasLiked)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all ${activePhoto.hasLiked ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white/10 backdrop-blur-md border-white/10 text-white'}`}
                >
                  <Heart className={`w-3 h-3 ${activePhoto.hasLiked ? 'fill-white' : ''}`} />
                  <span className="font-bold">{activePhoto.likesCount}</span>
                </button>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1 bg-white text-black rounded-full text-xs font-bold"
              >
                <Navigation className="w-3 h-3" /> Navigasi
              </a>
            </div>

            {/* Photographer on mobile */}
            {activePhoto?.users?.username && (
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                  {activePhoto.users.avatar_url ? (
                    <img src={activePhoto.users.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-amber-500 flex items-center justify-center text-white font-bold text-[8px]">
                      {activePhoto.users.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-white/50 text-xs">
                  oleh <Link href={`/profile/${activePhoto.users.username}`} className="text-white font-bold">@{activePhoto.users.username}</Link>
                </span>
              </div>
            )}

            {/* Thumbnail Cards - horizontal scroll, mobile */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-3 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => setActiveIndex(i)}
                    className={`shrink-0 snap-center relative w-[90px] h-[65px] rounded-xl overflow-hidden border-2 transition-all ${i === activeIndex ? 'border-amber-400 scale-105' : 'border-white/10 hover:border-white/40'}`}
                  >
                    {photo.photo_url ? (
                      <Image src={photo.photo_url} alt="" fill className="object-cover" sizes="90px" />
                    ) : (
                      <div className="w-full h-full bg-white/5" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {i === activeIndex && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Info Panel Toggle */}
            <button
              onClick={() => setShowInfo(v => !v)}
              className="w-full mt-1 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-xs font-bold text-white/80 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {showInfo ? 'Tutup Info' : 'Lihat Info & Ulasan'}
            </button>

            {/* Mobile Info Panel (collapsible) */}
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-4">
                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <Clock className="w-4 h-4 text-amber-400 mb-1" />
                        <p className="text-[9px] text-white/50 uppercase tracking-wider font-mono">Waktu Terbaik</p>
                        <p className="text-sm font-bold text-white">{BEST_TIME_LABEL[spot.best_time || ''] || spot.best_time || '-'}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <Zap className="w-4 h-4 text-white/50 mb-1" />
                        <p className="text-[9px] text-white/50 uppercase tracking-wider font-mono">Akses</p>
                        <p className="text-sm font-bold text-white">{DIFFICULTY_LABEL[spot.difficulty || 'easy']}</p>
                      </div>
                    </div>

                    {spot.description && (
                      <p className="text-white/70 text-xs leading-relaxed">{spot.description}</p>
                    )}

                    {/* Reviews */}
                    <div className="border-t border-white/10 pt-3">
                      <h3 className="text-xs font-bold mb-2">Ulasan ({reviews.length})</h3>
                      {currentUser ? (
                        <div className="mb-3">
                          <div className="flex gap-1 mb-2">
                            {[1,2,3,4,5].map(n => (
                              <button key={n} onClick={() => setReviewRating(n)} onMouseEnter={() => setReviewHover(n)} onMouseLeave={() => setReviewHover(0)}>
                                <Star className={`w-4 h-4 ${n <= (reviewHover || reviewRating) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            className="w-full bg-white/5 border border-white/10 text-white text-xs p-2 rounded-lg min-h-[50px] resize-none focus:outline-none focus:border-amber-400/50"
                            placeholder="Tulis ulasan..."
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                          />
                          <button
                            onClick={handleSubmitReview}
                            disabled={reviewRating === 0 || submittingReview}
                            className="mt-1 w-full py-1.5 bg-white text-black rounded-lg text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {submittingReview ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Kirim
                          </button>
                        </div>
                      ) : (
                        <Link href="/login" className="block text-center py-2 bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white/80 mb-2">Login untuk ulasan</Link>
                      )}
                      <div className="space-y-2 max-h-[150px] overflow-y-auto">
                        {reviews.slice(0, 5).map(r => (
                          <div key={r.id} className="p-2 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold">{r.users?.username || 'Anonim'}</span>
                              <div className="flex gap-0.5">
                                {Array.from({length:5}).map((_,i) => <Star key={i} className={`w-2.5 h-2.5 ${i < (r.rating||0) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`}/>)}
                              </div>
                            </div>
                            {r.comment && <p className="text-[10px] text-white/60">{r.comment}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </main>
  )
}
