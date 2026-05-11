'use client'

import Navbar from '@/components/Navbar'
import { User as UserIcon, Settings, Camera, MapPin, Grid, Heart, LogOut, Loader2, Image as ImageIcon, Award, Zap, HardDrive } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Database } from '@/types/database'
import { motion } from 'framer-motion'

type Profile = Database['public']['Tables']['users']['Row'] & {
  user_level?: string
  stats_spots_visited?: number
  stats_photos_uploaded?: number
}
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
  const [profile, setProfile] = useState<Profile | null>(null)
  const [spots, setSpots] = useState<Spot[]>([])
  const [photos, setPhotos] = useState<SpotPhoto[]>([])
  const [genres, setGenres] = useState<string[]>(['Semua'])
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function getProfile() {
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

        // Extract unique genres for chips
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

    getProfile()
  }, [router])

  const filteredPhotos = activeTab === 'Semua' 
    ? photos 
    : photos.filter(p => p.spots?.genre?.includes(activeTab))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-primary mx-auto mb-4" />
          <p className="font-display font-bold text-xl text-paper">Syncing DNA...</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <main className="min-h-screen bg-obsidian text-paper pb-20">
      <Navbar />

      {/* Header Profile */}
      <div className="relative pt-12 pb-12 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
          {/* Avatar Area */}
          <div className="relative">
            <div className="w-32 h-32 rounded-[40px] bg-white/5 p-1 border border-white/10 shadow-2xl">
              <div className="w-full h-full rounded-[36px] bg-sand/20 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username || ''} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-16 h-16 text-muted/40" />
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-primary rounded-2xl flex items-center justify-center border-4 border-obsidian">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Info Area */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-2">
                <h1 className="text-4xl font-display font-bold">{profile.username || 'Fotografer'}</h1>
                <span className="px-3 py-1 bg-amber-primary/10 border border-amber-primary/20 text-amber-primary text-[10px] font-mono font-bold rounded-full uppercase tracking-widest">
                  {profile.user_level || 'Pemula'}
                </span>
              </div>
              <p className="text-muted flex justify-center md:justify-start items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                {profile.location || 'Basecamp belum diatur'}
              </p>
            </div>

            <p className="max-w-lg text-sm text-muted/80 leading-relaxed italic">
              "{profile.bio || 'Mulai ceritamu di sini...'}"
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                <HardDrive className="w-3.5 h-3.5 text-amber-primary" />
                <span className="text-xs font-medium">{profile.gear || 'No Gear'}</span>
              </div>
            </div>
          </div>

          {/* Stats Area */}
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="p-4 bg-white/5 rounded-3xl border border-white/10 text-center min-w-[100px]">
              <span className="block text-2xl font-display font-bold">{spots.length}</span>
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Spots</span>
            </div>
            <div className="p-4 bg-white/5 rounded-3xl border border-white/10 text-center min-w-[100px]">
              <span className="block text-2xl font-display font-bold">{photos.length}</span>
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Photos</span>
            </div>
          </div>
        </div>
        
        {/* Background Decorative */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-amber-primary/5 blur-[100px] -z-10" />
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Horizontal Scrollable Chips */}
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
                className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  activeTab === genre 
                    ? 'bg-amber-primary border-amber-primary text-white shadow-lg shadow-amber-primary/20' 
                    : 'bg-white/5 border-white/10 text-muted hover:border-amber-primary/40'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.length > 0 ? (
            filteredPhotos.map((photo) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={photo.id} 
                className="group relative aspect-square rounded-[24px] overflow-hidden bg-white/5 border border-white/10 hover:border-amber-primary transition-all cursor-pointer"
              >
                <img
                  src={photo.photo_url}
                  alt={photo.caption || ''}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <p className="text-[10px] font-mono text-amber-primary uppercase font-bold mb-1">{photo.spots?.name}</p>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-amber-primary" />
                    <span className="text-[8px] font-medium text-paper/60 uppercase tracking-tighter line-clamp-1">
                      {photo.exif_camera || 'Manual EXIF'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center glass rounded-[40px] border-dashed">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p className="text-muted font-medium italic">"Mulai Hunting Pertamamu"</p>
              <Link href="/map" className="inline-block mt-6 px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:border-amber-primary transition-all">
                Buka Peta Eksplorasi
              </Link>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-20 flex flex-col items-center gap-8">
          <button className="px-8 py-3 bg-white/5 rounded-2xl border border-white/10 text-sm font-bold flex items-center gap-2 hover:border-amber-primary transition-all">
            <Settings className="w-4 h-4" />
            Pengaturan Akun
          </button>
          <button 
            onClick={handleLogout}
            className="text-red-500/60 hover:text-red-500 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar dari PhotoTracker
          </button>
        </div>
      </div>
    </main>
  )
}
