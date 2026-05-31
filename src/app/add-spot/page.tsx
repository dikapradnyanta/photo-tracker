'use client'

import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { MapPin, Camera, Star, ArrowLeft, Send, Loader2, ChevronDown, ChevronUp, LocateFixed } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'

// Dynamic import for MiniMap to avoid SSR issues
const MiniMap = dynamic(() => import('@/components/Map/MiniMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-surface-alt animate-pulse flex items-center justify-center text-muted text-xs">Memuat peta...</div>
})

const GENRES = [
  { value: 'landscape', label: '🌄 Landscape' },
  { value: 'street', label: '🏙️ Street' },
  { value: 'portrait', label: '🧍 Portrait' },
  { value: 'astrophotography', label: '🌌 Astro' },
]

export default function AddSpotPage() {
  // === Required state — visible fields ===
  const [formData, setFormData] = useState({
    name: '',
    latitude: -8.4095,
    longitude: 115.1889,
    genre: 'landscape',
  })

  // === Optional state — inside collapsed accordion ===
  const [detailData, setDetailData] = useState({
    description: '',
    tips_trik: '',
    best_time: 'golden_hour',
    difficulty: 'easy',
  })

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
    })
  }, [router])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push('/login'); return }
    if (!formData.name.trim()) {
      alert('Kasih nama spotnya dulu!'); return
    }
    if (!photoFile) {
      alert('Upload satu foto dulu!'); return
    }
    // latitude & longitude sudah otomatis terisi dari crosshair peta

    setLoading(true)
    try {
      // 1. Upload Photo to Storage
      const fileExt = photoFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `spot-heroes/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, photoFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath)

      // 2. Check if a spot with the same name exists nearby (e.g., within 2km)
      const { data: existingSpots, error: existingError } = await supabase
        .from('spots')
        .select('id, latitude, longitude')
        .ilike('name', formData.name.trim());
      
      if (existingError) throw existingError;

      let spotId = null;

      if (existingSpots && existingSpots.length > 0) {
        const R = 6371; // Earth's radius in km
        const maxDistKm = 2.0;

        for (const spot of existingSpots) {
          const dLat = (spot.latitude - formData.latitude) * Math.PI / 180;
          const dLon = (spot.longitude - formData.longitude) * Math.PI / 180;
          const lat1 = formData.latitude * Math.PI / 180;
          const lat2 = spot.latitude * Math.PI / 180;

          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
          const distance = R * c;

          if (distance <= maxDistKm) {
            spotId = spot.id;
            break; // Found a matching nearby spot
          }
        }
      }

      if (!spotId) {
        // 3a. Insert new Spot if not found nearby
        const { data: spotData, error: spotError } = await supabase.from('spots').insert({
          name: formData.name.trim(),
          latitude: formData.latitude,
          longitude: formData.longitude,
          genre: [formData.genre],
          description: detailData.description,
          tips_trik: detailData.tips_trik,
          best_time: detailData.best_time,
          difficulty: detailData.difficulty,
          added_by: user.id,
        }).select().single()

        if (spotError) throw spotError
        spotId = spotData.id;
      }

      // 3b. Insert photo for the spot (either new or existing)
      await supabase.from('spot_photos').insert({
        spot_id: spotId,
        user_id: user.id,
        photo_url: publicUrl,
        caption: 'Added Photo',
      })

      router.push('/map')
    } catch (error) {
      console.error('Error adding spot:', error)
      alert('Gagal menambahkan spot. Pastikan semua data valid.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-20 transition-colors">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-[calc(var(--nav-height)+24px)]">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-amber-primary transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-display font-bold mb-4 tracking-tight">Tambah Spot</h1>
          <p className="text-muted text-lg leading-relaxed">Pin dulu, detail belakangan.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ── 1. Map + Crosshair ─────────────────────── */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <MapPin className="w-5 h-5 text-amber-primary" />
              <h2 className="text-xl font-display font-bold">1. Titik Lokasi</h2>
            </div>

            <div className="h-80 rounded-[24px] overflow-hidden border border-border relative">
              <MiniMap
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={(pos) => setFormData({ ...formData, latitude: pos[0], longitude: pos[1] })}
              />
              {/* GPS button overlaid on map */}
              <div className="absolute bottom-4 left-4 right-4 z-[1000]">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="w-full py-3 bg-amber-primary text-paper rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                >
                  <LocateFixed className="w-4 h-4" />
                  Lokasiku (GPS)
                </button>
              </div>
            </div>
            <p className="text-xs text-center italic" style={{color:'var(--muted)'}}>Geser peta — pin selalu tepat di tengah</p>
          </motion.section>

          {/* ── 2. Nama Spot ───────────────────────────── */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Star className="w-5 h-5 text-amber-primary" />
              <h2 className="text-xl font-display font-bold">2. Nama &amp; Genre</h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted">Nama Spot <span className="text-amber-primary">*</span></label>
              <input
                type="text"
                required
                placeholder="Contoh: Sunrise at Sanur Beach"
                className="input-base rounded-xl"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Genre chip selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted">Genre <span className="text-amber-primary">*</span></label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, genre: g.value })}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                      formData.genre === g.value
                        ? 'bg-amber-primary text-paper border-amber-primary'
                        : 'bg-surface-alt text-muted border-border hover:border-amber-primary/50'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>

          {/* ── 3. Foto Utama ──────────────────────────── */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Camera className="w-5 h-5 text-amber-primary" />
              <h2 className="text-xl font-display font-bold">3. Foto Utama <span className="text-amber-primary">*</span></h2>
            </div>

            <div
              className="relative h-64 rounded-[24px] bg-surface-alt border-2 border-dashed border-border overflow-hidden flex items-center justify-center group hover:border-amber-primary/50 transition-all cursor-pointer"
              onClick={() => document.getElementById('photo-input')?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera className="w-12 h-12 text-muted mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-muted">Upload Foto Hero Spot</p>
                  <p className="text-xs text-muted/60 mt-1">Tap untuk pilih dari galeri</p>
                </div>
              )}
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          </motion.section>

          {/* ── Detail Tambahan accordion (optional) ───── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border border-border rounded-[24px] overflow-hidden bg-surface-alt"
          >
            <button
              type="button"
              onClick={() => setShowDetail(!showDetail)}
              className="w-full p-4 flex items-center justify-between bg-surface-alt hover:bg-black/[0.06] dark:hover:bg-white/10 transition-all"
            >
              <span className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-muted">Detail Tambahan</span>
                <span className="text-[10px] font-mono opacity-30">lat/lng · waktu · akses · tips</span>
              </span>
              {showDetail ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
            </button>

            <AnimatePresence>
              {showDetail && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 space-y-6 border-t border-border">
                    {/* Manual coordinates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-muted uppercase">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          className="input-base rounded-xl"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-muted uppercase">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          className="input-base rounded-xl"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>

                    {/* best_time + difficulty */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted">Waktu Terbaik</label>
                        <select
                          className="input-base rounded-xl"
                          value={detailData.best_time}
                          onChange={(e) => setDetailData({ ...detailData, best_time: e.target.value })}
                        >
                          <option value="golden_hour">Golden Hour</option>
                          <option value="blue_hour">Blue Hour</option>
                          <option value="midday">Siang</option>
                          <option value="night">Malam</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted">Tingkat Akses</label>
                        <select
                          className="input-base rounded-xl"
                          value={detailData.difficulty}
                          onChange={(e) => setDetailData({ ...detailData, difficulty: e.target.value })}
                        >
                          <option value="easy">Mudah</option>
                          <option value="medium">Sedang</option>
                          <option value="hard">Sulit</option>
                        </select>
                      </div>
                    </div>

                    {/* tips_trik */}
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-muted">Tips &amp; Trik</label>
                      <textarea
                        placeholder="Hints cahaya, parkir, akses rahasia, dll..."
                        rows={3}
                        className="input-base rounded-xl resize-none"
                        value={detailData.tips_trik}
                        onChange={(e) => setDetailData({ ...detailData, tips_trik: e.target.value })}
                      />
                    </div>

                    {/* description */}
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-muted">Deskripsi</label>
                      <textarea
                        placeholder="Ceritakan detail spot ini..."
                        rows={3}
                        className="input-base rounded-xl resize-none"
                        value={detailData.description}
                        onChange={(e) => setDetailData({ ...detailData, description: e.target.value })}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Submit ─────────────────────────────────── */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-amber-primary text-white rounded-[24px] font-display font-bold text-xl hover:shadow-2xl hover:shadow-amber-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Publikasikan Spot'}
            {!loading && <Send className="w-6 h-6" />}
          </motion.button>

        </form>
      </div>
    </main>
  )
}
