'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  ArrowLeft, MapPin, Clock, Zap, Star, Camera, Loader2,
  ChevronLeft, ChevronRight, MessageSquare, Navigation, Send
} from 'lucide-react'
import { Database } from '@/types/database'

type Spot = Database['public']['Tables']['spots']['Row']
type SpotPhoto = Database['public']['Tables']['spot_photos']['Row'] & {
  users?: { username: string | null; avatar_url: string | null } | null
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

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  hard: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Mudah',
  medium: 'Sedang',
  hard: 'Sulit',
}

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

  const [spot, setSpot] = useState<Spot | null>(null)
  const [photos, setPhotos] = useState<SpotPhoto[]>([])
  const [reviews, setReviews] = useState<SpotReview[]>([])
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [topSpots, setTopSpots] = useState<any[]>([])
  
  // Review form state
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null)
    })

    async function fetchSpot() {
      try {
        setLoading(true)

        const { data: spotData, error: spotError } = await supabase
          .from('spots')
          .select('*')
          .eq('id', id)
          .single()

        if (spotError) throw spotError
        setSpot(spotData)

        const { data: photosData } = await supabase
          .from('spot_photos')
          .select('*, users(username, avatar_url)')
          .eq('spot_id', id)
          .order('created_at', { ascending: true })

        setPhotos(photosData || [])

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

        // Ambil spot lain untuk "Top Rated"
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
          setTopSpots(mappedSpots.filter(s => s.id !== id).slice(0, 4))
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

  const handleSubmitReview = async () => {
    if (!currentUser || !spot || reviewRating === 0) return
    setSubmittingReview(true)
    try {
      const { data, error } = await supabase
        .from('spot_reviews')
        .insert({
          spot_id: spot.id,
          user_id: currentUser.id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
          visited_at: new Date().toISOString().split('T')[0]
        })
        .select('*, users(username, avatar_url)')
        .single()

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
      <div className="min-h-screen bg-background flex items-center justify-center noise relative">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="text-center relative z-10">
          <Loader2 className="w-10 h-10 animate-spin text-amber-primary mx-auto mb-4" />
          <p className="font-display font-bold text-xl text-foreground tracking-tight">Memuat Spot...</p>
        </div>
      </div>
    )
  }

  if (!spot) return null

  const difficultyClass = DIFFICULTY_COLOR[spot.difficulty || 'easy'] || DIFFICULTY_COLOR.easy

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 selection:bg-amber-primary selection:text-white">
      <Navbar />

      {/* ── 1. Hero Section ── */}
      <section className="relative h-[80vh] min-h-[600px] w-full bg-black">
        {photos.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activePhoto}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={photos[activePhoto]?.photo_url}
                alt={spot.name}
                className="w-full h-full object-cover"
              />
              
              {/* Photographer Info Overlay */}
              {photos[activePhoto]?.users?.username && (
                <div className="absolute top-32 right-6 md:right-12 z-20 flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-xl">
                  <div className="w-6 h-6 rounded-full bg-amber-primary flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                    {photos[activePhoto].users.avatar_url ? (
                      <img src={photos[activePhoto].users.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      photos[activePhoto].users.username[0].toUpperCase()
                    )}
                  </div>
                  <span className="text-xs font-mono text-white/90">
                    Foto oleh <Link href={`/profile/${photos[activePhoto].users.username}`} className="font-bold text-white hover:text-amber-primary transition-colors">@{photos[activePhoto].users.username}</Link>
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-alt">
            <Camera className="w-16 h-16 text-muted/20" />
          </div>
        )}

        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent opacity-80" />

        {/* Hero Content Container */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-20">
          <motion.div 
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-8"
          >
            <div className="max-w-3xl">
              {/* Back Button -> Moved inside hero content to prevent navbar overlap */}
              <motion.div variants={fadeUp} className="mb-8">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-alt/20 backdrop-blur-md border border-white/10 rounded-full text-sm font-bold text-white hover:bg-surface-alt/40 transition-all group shadow-xl"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Kembali
                </button>
              </motion.div>

              {/* Badges */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-6">
                {spot.genre?.map(g => (
                  <span
                    key={g}
                    className="px-3 py-1 bg-amber-primary text-white text-[10px] font-mono font-bold rounded-md uppercase tracking-wider shadow-lg shadow-amber-primary/20"
                  >
                    {g}
                  </span>
                ))}
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[84px] font-display font-bold leading-[0.9] tracking-tighter text-white mb-6 drop-shadow-2xl">
                {spot.name}
              </motion.h1>

              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-border text-white shadow-xl">
                  <Star className="w-4 h-4 fill-amber-primary text-amber-primary drop-shadow-[0_0_8px_rgba(232,105,42,0.8)]" />
                  <span className="font-bold text-sm">{avgRating > 0 ? avgRating : 'Baru'}</span>
                  <span className="text-xs text-white/70">({reviews.length} review)</span>
                </div>
                
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-transform shadow-xl"
                >
                  <Navigation className="w-4 h-4" />
                  Navigasi Rute
                </a>
              </motion.div>
            </div>

            {/* Photo Navigation (if multiple) */}
            {photos.length > 1 && (
              <motion.div variants={fadeUp} className="flex items-center gap-3 bg-surface/80 backdrop-blur-xl border border-border p-2 rounded-2xl shadow-2xl">
                <button
                  onClick={() => setActivePhoto(p => Math.max(0, p - 1))}
                  className="p-3 bg-surface-alt rounded-xl hover:bg-muted/20 text-foreground transition-all disabled:opacity-30"
                  disabled={activePhoto === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-4 text-center">
                  <span className="block text-sm font-bold text-foreground">{activePhoto + 1}</span>
                  <span className="block text-[10px] font-mono text-muted uppercase">of {photos.length}</span>
                </div>
                <button
                  onClick={() => setActivePhoto(p => Math.min(photos.length - 1, p + 1))}
                  className="p-3 bg-surface-alt rounded-xl hover:bg-muted/20 text-foreground transition-all disabled:opacity-30"
                  disabled={activePhoto === photos.length - 1}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── 2. Details Layout ── */}
      <section className="relative z-30 max-w-7xl mx-auto px-6 md:px-12 pt-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column — Info & Gallery */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Overview Bento - Premium Redesign */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Best Time Card */}
            <div className="relative p-6 rounded-[24px] overflow-hidden group shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-primary/20 to-surface-alt dark:from-amber-primary/10 dark:to-black/40 -z-10" />
              <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
                <Clock className="w-32 h-32 text-amber-primary" />
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-primary/20 flex items-center justify-center border border-amber-primary/30">
                  <Clock className="w-5 h-5 text-amber-primary" />
                </div>
                <h4 className="text-xs font-mono uppercase tracking-widest text-muted font-bold">Waktu Terbaik</h4>
              </div>
              <p className="text-2xl font-display font-bold text-foreground tracking-tight drop-shadow-sm">
                {BEST_TIME_LABEL[spot.best_time || ''] || spot.best_time}
              </p>
              <p className="text-sm text-muted mt-2">Cahaya optimal untuk pemotretan.</p>
            </div>
            
            {/* Accessibility Card */}
            <div className="relative p-6 rounded-[24px] overflow-hidden group shadow-lg">
              <div className={`absolute inset-0 bg-gradient-to-br opacity-20 dark:opacity-10 -z-10 ${difficultyClass.split(' ')[1] || 'bg-surface-alt'}`} />
              <div className="absolute inset-0 bg-surface/40 backdrop-blur-[2px] -z-10" />
              
              <div className={`absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500`}>
                <Zap className="w-32 h-32" />
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${difficultyClass}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-mono uppercase tracking-widest text-muted font-bold">Aksesibilitas</h4>
              </div>
              <p className="text-2xl font-display font-bold text-foreground tracking-tight drop-shadow-sm">
                {DIFFICULTY_LABEL[spot.difficulty || 'easy']}
              </p>
              <p className="text-sm text-muted mt-2">Tingkat kesulitan mencapai lokasi.</p>
            </div>
          </motion.div>

          {/* Description Article */}
          <motion.article 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="prose prose-lg max-w-none prose-p:text-foreground/80 prose-headings:text-foreground prose-strong:text-foreground"
          >
            <p className="text-xl leading-relaxed text-foreground/80 font-medium">
              {spot.description || "Belum ada deskripsi untuk spot ini."}
            </p>
          </motion.article>

          {/* Tips Section (If exists) */}
          {(spot as any).tips_trik && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-[32px] bg-amber-primary/5 border border-amber-primary/20 relative overflow-hidden noise"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-primary/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-primary" />
                </div>
                <h3 className="text-xl font-display font-bold">Tips dari Fotografer</h3>
              </div>
              <p className="text-foreground/80 leading-relaxed italic border-l-2 border-amber-primary/30 pl-4">
                "{(spot as any).tips_trik}"
              </p>
            </motion.div>
          )}

          {/* Miniature Gallery */}
          {photos.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Camera className="w-5 h-5 text-amber-primary" />
                <h3 className="text-2xl font-display font-bold">Semua Sudut</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      setActivePhoto(i)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="relative aspect-square rounded-[24px] overflow-hidden group border border-border"
                  >
                    <img src={photo.photo_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className={`absolute inset-0 transition-colors duration-300 ${i === activePhoto ? 'border-4 border-amber-primary bg-amber-primary/10' : 'bg-black/20 group-hover:bg-transparent'}`} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Top Rated Spots Carousel (Spot Teratas) */}
          {topSpots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="pt-8 border-t border-border mt-12"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-display font-bold">Spot Terpopuler</h3>
                  <p className="text-sm text-muted">Jelajahi lokasi dengan rating tertinggi.</p>
                </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {topSpots.map((topSpot) => (
                  <Link
                    key={topSpot.id}
                    href={`/spot/${topSpot.id}`}
                    className="w-[280px] shrink-0 snap-center group block rounded-[24px] overflow-hidden bg-surface border border-border hover:border-amber-primary/40 transition-all shadow-lg"
                  >
                    <div className="h-40 relative overflow-hidden bg-surface-alt">
                      <img 
                        src={topSpot.hero_photo_url || 'https://via.placeholder.com/400'} 
                        alt={topSpot.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                      
                      <div className="absolute top-3 left-3 flex gap-1">
                        {topSpot.genre?.slice(0,1).map((g: string) => (
                          <span key={g} className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-mono font-bold rounded-full uppercase">
                            {g}
                          </span>
                        ))}
                      </div>
                      
                      <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-white">
                        <Star className="w-3.5 h-3.5 fill-amber-primary text-amber-primary" />
                        <span className="font-bold text-sm">{topSpot.avgRating > 0 ? topSpot.avgRating.toFixed(1) : 'Baru'}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-display font-bold text-lg leading-tight mb-1 group-hover:text-amber-primary transition-colors line-clamp-1">
                        {topSpot.name}
                      </h4>
                      <p className="text-xs text-muted font-mono uppercase">
                        {DIFFICULTY_LABEL[topSpot.difficulty || 'easy']} • {BEST_TIME_LABEL[topSpot.best_time || '']}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column — Reviews Panel */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 space-y-8">
            
            {/* Reviews Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-2xl font-display font-bold flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-amber-primary" />
                Review
              </h3>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-surface-alt rounded-full">{reviews.length} Ulasan</span>
            </div>

            {/* Write Review Card */}
            {currentUser ? (
              <div className="p-6 rounded-[24px] bg-surface border border-border noise shadow-xl">
                <p className="text-sm font-bold mb-4">Bagaimana pengalamanmu?</p>
                <div className="flex gap-2 mb-6">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setReviewRating(n)}
                      onMouseEnter={() => setReviewHover(n)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          n <= (reviewHover || reviewRating)
                            ? 'fill-amber-primary text-amber-primary drop-shadow-[0_0_8px_rgba(232,105,42,0.4)]'
                            : 'text-muted/20'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  className="input-base bg-background w-full py-4 px-5 rounded-2xl text-sm min-h-[100px] mb-4 resize-none"
                  placeholder="Ceritakan detail akses, cuaca, atau angle terbaikmu..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0 || submittingReview}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-foreground text-background rounded-2xl font-bold hover:scale-[1.02] transition-all disabled:opacity-40"
                >
                  {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Kirim Ulasan
                </button>
              </div>
            ) : (
              <div className="p-8 text-center rounded-[24px] bg-amber-primary/5 border border-amber-primary/20 noise">
                <Star className="w-8 h-8 text-amber-primary mx-auto mb-4" />
                <p className="text-sm text-foreground/80 mb-6">Jadilah bagian dari komunitas untuk memberikan ulasan pada spot ini.</p>
                <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 bg-amber-primary text-white font-bold rounded-full hover:shadow-lg hover:shadow-amber-primary/30 transition-all w-full">
                  Login untuk Review
                </Link>
              </div>
            )}

            {/* Review List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="py-12 text-center text-muted text-sm italic border border-dashed border-border rounded-[24px]">
                  Belum ada ulasan.
                </div>
              ) : (
                <AnimatePresence>
                  {reviews.map((review, i) => (
                    <motion.div 
                      key={review.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 rounded-[20px] bg-surface border border-border/50 group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/profile/${review.users?.username}`} className="w-9 h-9 rounded-full bg-amber-primary/10 border border-amber-primary/20 flex items-center justify-center text-xs font-bold text-amber-primary hover:bg-amber-primary hover:text-white transition-colors">
                            {review.users?.username?.[0]?.toUpperCase() || '?'}
                          </Link>
                          <div>
                            <Link href={`/profile/${review.users?.username}`} className="text-sm font-bold hover:text-amber-primary transition-colors block leading-none mb-1">
                              {review.users?.username || 'Anonim'}
                            </Link>
                            <span className="text-[10px] text-muted font-mono">{new Date(review.created_at).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3.5 h-3.5 ${idx < (review.rating || 0) ? 'fill-amber-primary text-amber-primary' : 'text-muted/20'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-foreground/80 leading-relaxed pl-12">{review.comment}</p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}
