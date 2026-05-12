'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SpotWithPhoto } from '@/types/database'
import { motion } from 'framer-motion'
import {
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  ChevronRight,
  Loader2,
  Camera
} from 'lucide-react'

const GENRE_CHIPS = ['Semua', 'Landscape', 'Street', 'Portrait', 'Astro', 'Wildlife', 'Architecture']

const DIFFICULTY_STYLE: Record<string, string> = {
  easy: 'text-green-500 bg-green-500/10 border-green-500/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  hard: 'text-red-400 bg-red-400/10 border-red-400/20',
}
const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Mudah', medium: 'Sedang', hard: 'Sulit'
}

export default function SpotsPage() {
  const [spots, setSpots] = useState<SpotWithPhoto[]>([])
  const [filtered, setFiltered] = useState<SpotWithPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('Semua')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    fetchSpots()
  }, [])

  useEffect(() => {
    let result = spots
    if (activeGenre !== 'Semua') {
      result = result.filter(s => s.genre?.includes(activeGenre))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
    }
    setFiltered(result)
  }, [spots, activeGenre, query])

  const fetchSpots = async () => {
    try {
      setLoading(true)
      // Use the bbox RPC with world bounds to get all spots
      const { data, error } = await supabase.rpc('get_spots_in_bbox', {
        min_lat: -90, max_lat: 90,
        min_long: -180, max_long: 180
      })
      if (error) throw error
      setSpots((data as SpotWithPhoto[]) || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 transition-colors">
      <Navbar />

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-amber-primary mb-2">
              {filtered.length} Spot Ditemukan
            </p>
            <h1 className="text-5xl font-display font-bold tracking-tight">
              Jelajahi<br /><span className="text-amber-primary italic">Spot Foto</span>
            </h1>
          </div>

          {/* Search bar */}
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-amber-primary transition-colors" />
            <input
              type="text"
              placeholder="Cari nama atau lokasi..."
              className="input-base pl-12 py-3 rounded-2xl w-full text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Genre Chips */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {GENRE_CHIPS.map(genre => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                activeGenre === genre
                  ? 'bg-amber-primary border-amber-primary text-white shadow-lg shadow-amber-primary/20'
                  : 'bg-black/[0.03] dark:bg-white/5 border-black/10 dark:border-white/10 text-muted hover:border-amber-primary/40'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6">
        {loading ? (
          <div className="flex justify-center py-40">
            <Loader2 className="w-8 h-8 animate-spin text-amber-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-40 text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-muted italic font-medium">Belum ada spot yang cocok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((spot, i) => (
              <motion.div
                key={spot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <Link href={`/spot/${spot.id}`} className="group block rounded-[28px] overflow-hidden panel hover:border-amber-primary/40 transition-all hover:shadow-xl hover:shadow-amber-primary/5">
                  {/* Thumbnail */}
                  <div className="aspect-[4/3] bg-black/[0.05] dark:bg-white/5 overflow-hidden relative">
                    {spot.hero_photo_url ? (
                      <img
                        src={spot.hero_photo_url}
                        alt={spot.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-12 h-12 opacity-10" />
                      </div>
                    )}
                    {/* Genre badges */}
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      {spot.genre?.slice(0, 2).map(g => (
                        <span key={g} className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-mono font-bold rounded-full uppercase">
                          {g}
                        </span>
                      ))}
                    </div>
                    {/* Difficulty */}
                    {spot.difficulty && (
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full uppercase border ${DIFFICULTY_STYLE[spot.difficulty] || ''}`}>
                          {DIFFICULTY_LABEL[spot.difficulty] || spot.difficulty}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <h2 className="font-display font-bold text-lg leading-tight mb-1 group-hover:text-amber-primary transition-colors">
                      {spot.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-muted text-xs mb-3">
                      <MapPin className="w-3 h-3" />
                      <span className="font-mono">{spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</span>
                    </div>
                    {spot.description && (
                      <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-4">
                        {spot.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[10px] font-mono text-muted uppercase">
                        {spot.best_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {spot.best_time.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted group-hover:text-amber-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAB — Floating Action Button */}
      <Link
        href="/add-spot"
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 bg-amber-primary text-white rounded-2xl shadow-2xl shadow-amber-primary/30 hover:shadow-amber-primary/50 hover:scale-105 transition-all group font-bold text-sm"
      >
        <Plus className="w-5 h-5" />
        <span>Tambah Spot</span>
      </Link>
    </main>
  )
}
