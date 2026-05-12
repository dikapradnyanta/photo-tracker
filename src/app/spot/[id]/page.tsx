'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Clock, Zap, Star, Camera, Loader2,
  ChevronLeft, ChevronRight, MessageSquare, Navigation, Send, Link as LinkIcon
} from 'lucide-react'
import { Database } from '@/types/database'

type Spot = Database['public']['Tables']['spots']['Row']
type SpotPhoto = Database['public']['Tables']['spot_photos']['Row']
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
  easy: 'text-green-400 bg-green-400/10 border-green-400/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  hard: 'text-red-400 bg-red-400/10 border-red-400/20',
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
  const [activePhoto, setActivePhoto] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
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

        // Fetch spot data
        const { data: spotData, error: spotError } = await supabase
          .from('spots')
          .select('*')
          .eq('id', id)
          .single()

        if (spotError) throw spotError
        setSpot(spotData)

        // Fetch photos
        const { data: photosData } = await supabase
          .from('spot_photos')
          .select('*')
          .eq('spot_id', id)
          .order('created_at', { ascending: true })

        setPhotos(photosData || [])

        // Fetch reviews with user data
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
      // Recalc avg
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-primary mx-auto mb-4" />
          <p className="font-display font-bold text-xl text-foreground">Loading Spot...</p>
        </div>
      </div>
    )
  }

  if (!spot) return null

  const heroPhoto = photos[0]?.photo_url || null
  const difficultyClass = DIFFICULTY_COLOR[spot.difficulty || 'easy'] || DIFFICULTY_COLOR.easy

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 transition-colors">
      <Navbar />

      {/* Hero Image Gallery */}
      <div className="relative h-[55vh] w-full overflow-hidden bg-white/5">
        {photos.length > 0 ? (
          <>
            <motion.img
              key={activePhoto}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              src={photos[activePhoto]?.photo_url}
              alt={spot.name}
              className="w-full h-full object-cover"
            />
            {/* Photo counter & nav */}
            {photos.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
                <button
                  onClick={() => setActivePhoto(p => Math.max(0, p - 1))}
                  className="p-2 bg-black/50 backdrop-blur rounded-full hover:bg-black/70 transition-all disabled:opacity-30"
                  disabled={activePhoto === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono bg-black/50 backdrop-blur px-3 py-1 rounded-full">
                  {activePhoto + 1} / {photos.length}
                </span>
                <button
                  onClick={() => setActivePhoto(p => Math.min(photos.length - 1, p + 1))}
                  className="p-2 bg-black/50 backdrop-blur rounded-full hover:bg-black/70 transition-all disabled:opacity-30"
                  disabled={activePhoto === photos.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-16 h-16 text-muted/20" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent" />

        {/* Back button */}
        <Link
          href="/map"
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-sm font-bold hover:bg-black/70 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Peta
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 -mt-16 relative z-10">

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-black/[0.04] dark:bg-white/5 border border-black/[0.08] dark:border-white/10 rounded-[32px] p-8 mb-8 backdrop-blur-sm"
        >
          {/* Genre chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {spot.genre?.map(g => (
              <span
                key={g}
                className="px-3 py-1 bg-forest/20 text-forest text-[10px] font-mono font-bold rounded-full uppercase border border-forest/20"
              >
                {g}
              </span>
            ))}
          </div>

          <h1 className="text-4xl font-display font-bold mb-3 leading-tight">{spot.name}</h1>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="flex items-center gap-1.5 text-xs font-mono text-amber-primary">
              <Clock className="w-3.5 h-3.5" />
              {BEST_TIME_LABEL[spot.best_time || ''] || spot.best_time}
            </span>
            <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${difficultyClass}`}>
              <Zap className="w-3 h-3" />
              Akses {DIFFICULTY_LABEL[spot.difficulty || 'easy']}
            </span>
            {avgRating > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-amber-primary">
                <Star className="w-3.5 h-3.5 fill-amber-primary" />
                {avgRating} ({reviews.length} review)
              </span>
            )}
          </div>

          {/* Description */}
          {spot.description && (
            <div className="mb-6">
              <p className="text-sm text-foreground/70 leading-relaxed">{spot.description}</p>
            </div>
          )}

          {/* Tips & Trik */}
          {(spot as any).tips_trik && (
            <div className="bg-amber-primary/5 border border-amber-primary/15 rounded-2xl p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-amber-primary mb-2">💡 Tips & Trik</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{(spot as any).tips_trik}</p>
            </div>
          )}
        </motion.div>

        {/* Koordinat & Navigasi */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-black/[0.04] dark:bg-white/5 border border-black/[0.08] dark:border-white/10 rounded-[24px] p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1">Koordinat</p>
              <p className="font-mono text-sm text-foreground/80">
                {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-amber-primary text-paper rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-amber-primary/20 hover:scale-[1.02] transition-all"
            >
              <Navigation className="w-4 h-4" />
              Navigasi
            </a>
          </div>
        </motion.div>

        {/* Photo Grid */}
        {photos.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-4">Galeri Foto</p>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    setActivePhoto(i)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                    i === activePhoto ? 'border-amber-primary scale-95' : 'border-white/10 hover:border-amber-primary/40'
                  }`}
                >
                  <img src={photo.photo_url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-4 h-4 text-amber-primary" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
                Review ({reviews.length})
              </p>
            </div>

            {/* Submit Review Form */}
            {currentUser ? (
              <div className="bg-black/[0.04] dark:bg-white/5 border border-black/[0.08] dark:border-white/10 rounded-[24px] p-6 mb-6">
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-muted mb-4">Tulis Review</p>
                {/* Star picker */}
                <div className="flex gap-1.5 mb-4">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setReviewRating(n)}
                      onMouseEnter={() => setReviewHover(n)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          n <= (reviewHover || reviewRating)
                            ? 'fill-amber-primary text-amber-primary'
                            : 'text-muted/30'
                        }`}
                      />
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <span className="ml-2 text-sm text-muted self-center">
                      {['', 'Jelek', 'Kurang', 'Cukup', 'Bagus', 'Luar Biasa'][reviewRating]}
                    </span>
                  )}
                </div>
                <textarea
                  className="input-base py-3 rounded-xl text-sm min-h-[80px] mb-4"
                  placeholder="Ceritakan pengalamanmu di spot ini... (opsional)"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0 || submittingReview}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-amber-primary/20 transition-all disabled:opacity-40"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Kirim Review
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-3 p-4 bg-black/[0.04] dark:bg-white/5 border border-black/[0.08] dark:border-white/10 rounded-2xl mb-6 hover:border-amber-primary transition-all group"
              >
                <Star className="w-5 h-5 text-muted group-hover:text-amber-primary transition-colors" />
                <p className="text-sm text-muted group-hover:text-foreground transition-colors">
                  <span className="font-bold text-amber-primary">Login</span> untuk menulis review
                </p>
              </Link>
            )}

            {reviews.length === 0 ? (
              <div className="py-16 text-center bg-black/[0.04] dark:bg-white/5 border border-black/[0.08] dark:border-white/10 rounded-[24px]">
                <Star className="w-10 h-10 mx-auto mb-3 text-muted/20" />
                <p className="text-muted text-sm italic">Belum ada review. Jadilah yang pertama!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="bg-black/[0.04] dark:bg-white/5 border border-black/[0.08] dark:border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${review.users?.username}`} className="w-8 h-8 rounded-xl bg-amber-primary/20 flex items-center justify-center text-xs font-bold text-amber-primary hover:bg-amber-primary hover:text-white transition-colors">
                          {review.users?.username?.[0]?.toUpperCase() || '?'}
                        </Link>
                        <Link href={`/profile/${review.users?.username}`} className="text-sm font-bold hover:text-amber-primary transition-colors">
                          {review.users?.username || 'Anonim'}
                        </Link>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < (review.rating || 0) ? 'fill-amber-primary text-amber-primary' : 'text-muted/30'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-foreground/70 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
    </main>
  )
}
