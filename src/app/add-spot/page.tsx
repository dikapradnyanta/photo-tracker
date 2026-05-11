'use client'

import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { MapPin, Camera, Star, ArrowLeft, Send, Loader2, ChevronDown, ChevronUp, LocateFixed } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamic import for MiniMap to avoid SSR issues
const MiniMap = dynamic(() => import('@/components/Map/MiniMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-white/5 animate-pulse flex items-center justify-center text-muted text-xs">Loading MiniMap...</div>
})

export default function AddSpotPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tips_trik: '',
    latitude: -8.4095,
    longitude: 115.1889,
    genre: 'landscape',
    best_time: 'golden_hour',
    difficulty: 'easy'
  })
  
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
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
          longitude: position.coords.longitude
        })
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !photoFile) {
      alert('Pilih foto utama terlebih dahulu!')
      return
    }

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

      // 2. Insert Spot with PostGIS Point
      const point = `POINT(${formData.longitude} ${formData.latitude})`

      const { data: spotData, error: spotError } = await supabase.from('spots').insert({
        name: formData.name,
        description: formData.description,
        tips_trik: formData.tips_trik,
        location: point,
        genre: [formData.genre],
        best_time: formData.best_time,
        difficulty: formData.difficulty,
        added_by: user.id
      }).select().single()

      if (spotError) throw spotError

      // Insert initial photo
      await supabase.from('spot_photos').insert({
        spot_id: spotData.id,
        user_id: user.id,
        photo_url: publicUrl,
        caption: 'Hero Photo'
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
    <main className="min-h-screen bg-obsidian text-paper pb-20">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-6 pt-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-amber-primary transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali
        </Link>
        
        <div className="mb-12">
          <h1 className="text-5xl font-display font-bold mb-4">Tambah Spot</h1>
          <p className="text-muted text-lg">Bagikan lokasi presisi untuk komunitas.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Step 1: Photo Upload */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-white/10">
              <Camera className="w-5 h-5 text-amber-primary" />
              <h2 className="text-xl font-display font-bold">1. Visual Utama</h2>
            </div>
            
            <div 
              className="relative h-64 rounded-[24px] bg-white/5 border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center group hover:border-amber-primary/50 transition-all cursor-pointer"
              onClick={() => document.getElementById('photo-input')?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera className="w-12 h-12 text-muted mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-muted">Upload Foto Hero Spot</p>
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
          </section>

          {/* Step 2: Interactive Mapping */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-white/10">
              <MapPin className="w-5 h-5 text-amber-primary" />
              <h2 className="text-xl font-display font-bold">2. Penentuan Lokasi</h2>
            </div>

            <div className="space-y-4">
              <div className="h-80 rounded-[24px] overflow-hidden border border-white/10 relative">
                <MiniMap 
                  latitude={formData.latitude} 
                  longitude={formData.longitude} 
                  onLocationChange={(pos) => setFormData({...formData, latitude: pos[0], longitude: pos[1]})} 
                />
                <div className="absolute bottom-4 left-4 right-4 z-[1000]">
                  <button 
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="w-full py-4 bg-amber-primary text-paper rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <LocateFixed className="w-5 h-5" />
                    Gunakan Lokasi Saat Ini (GPS)
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted text-center italic">Geser pin atau klik pada peta untuk menyesuaikan titik presisi.</p>
            </div>

            {/* Advanced Coordinates Accordion */}
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <button 
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full p-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-all"
              >
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-muted">Koordinat Manual (Opsional)</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showAdvanced && (
                <div className="p-6 grid grid-cols-2 gap-4 border-t border-white/10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-muted uppercase">Latitude</label>
                    <input 
                      type="number" step="any"
                      className="w-full p-3 bg-obsidian border border-white/10 rounded-lg focus:border-amber-primary outline-none"
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-muted uppercase">Longitude</label>
                    <input 
                      type="number" step="any"
                      className="w-full p-3 bg-obsidian border border-white/10 rounded-lg focus:border-amber-primary outline-none"
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
          
          {/* Step 3: Spot DNA */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-white/10">
              <Star className="w-5 h-5 text-amber-primary" />
              <h2 className="text-xl font-display font-bold">3. Spot DNA</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-muted">Nama Spot</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Sunrise at Sanur Beach"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:border-amber-primary outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted">Genre</label>
                  <select 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:border-amber-primary outline-none appearance-none"
                    value={formData.genre}
                    onChange={(e) => setFormData({...formData, genre: e.target.value})}
                  >
                    <option value="landscape">Landscape</option>
                    <option value="street">Street</option>
                    <option value="portrait">Portrait</option>
                    <option value="astrophotography">Astro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted">Waktu Terbaik</label>
                  <select 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:border-amber-primary outline-none appearance-none"
                    value={formData.best_time}
                    onChange={(e) => setFormData({...formData, best_time: e.target.value})}
                  >
                    <option value="golden_hour">Golden Hour</option>
                    <option value="blue_hour">Blue Hour</option>
                    <option value="midday">Siang</option>
                    <option value="night">Malam</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted">Akses</label>
                  <select 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:border-amber-primary outline-none appearance-none"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                  >
                    <option value="easy">Mudah</option>
                    <option value="medium">Sedang</option>
                    <option value="hard">Sulit</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-muted">Deskripsi & Tips</label>
                <textarea 
                  placeholder="Ceritakan detail spot, tips cahaya, atau akses rahasia..."
                  rows={4}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:border-amber-primary outline-none transition-all"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </section>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-amber-primary text-paper rounded-[24px] font-display font-bold text-xl hover:shadow-2xl hover:shadow-amber-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Publikasikan Spot'}
            {!loading && <Send className="w-6 h-6" />}
          </button>
        </form>
      </div>
    </main>
  )
}
