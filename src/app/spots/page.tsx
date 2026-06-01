'use client'

import { useState, useEffect, useRef } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SpotWithPhoto } from '@/types/database'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Clock,
  ChevronRight,
  Loader2,
  Camera,
  X,
  ChevronDown,
} from 'lucide-react'

const GENRE_CHIPS = ['Landscape', 'Street', 'Portrait', 'Astro', 'Wildlife', 'Architecture']

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
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchSpots = async () => {
    try {
      setLoading(true)
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

  useEffect(() => {
    fetchSpots()
  }, [])

  useEffect(() => {
    let result = spots
    if (activeGenre) {
      result = result.filter(s => s.genre?.includes(activeGenre))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
    }
    setFiltered(result)
  }, [spots, activeGenre, query])

  const hasActiveFilter = activeGenre !== null
  const clearAll = () => { setQuery(''); setActiveGenre(null) }

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 transition-colors">
      <Navbar />

      {/* ── STICKY SEARCH + FILTER BAR (Google Maps style) ── */}
      <div className="sticky top-[80px] z-[500] pt-3 pb-2 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Search Row */}
          <div className="flex items-center gap-3">
            {/* Search Input — Google Maps style */}
            <div className={`relative flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 ${
              searchFocused
                ? 'bg-background border-amber-primary shadow-lg shadow-amber-primary/10 ring-1 ring-amber-primary/30'
                : 'bg-surface-alt border-border hover:border-muted/60 shadow-sm'
            }`}>
              <Search className={`w-4 h-4 shrink-0 transition-colors duration-200 ${searchFocused ? 'text-amber-primary' : 'text-muted'}`} />
              <input
                ref={inputRef}
                type="text"
                placeholder={loading ? 'Memuat...' : `Cari dari ${spots.length} spot foto...`}
                className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted/60 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {/* Clear button */}
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => { setQuery(''); inputRef.current?.focus() }}
                    className="w-5 h-5 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Filter Toggle Button — Pinterest style */}
            <button
              onClick={() => setFilterOpen(prev => !prev)}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-2xl border font-bold text-xs transition-all duration-300 shrink-0 ${
                filterOpen || hasActiveFilter
                  ? 'bg-amber-primary text-white border-amber-primary shadow-lg shadow-amber-primary/25'
                  : 'bg-surface-alt text-muted border-border hover:border-muted/60 hover:text-foreground'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {/* Active badge */}
              {hasActiveFilter && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-amber-primary text-[9px] font-black flex items-center justify-center shadow-sm"
                >
                  1
                </motion.span>
              )}
              <motion.div
                animate={{ rotate: filterOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </button>
          </div>

          {/* Collapsible Filter Panel — Pinterest expand style */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-3 pb-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">Genre</span>
                    {hasActiveFilter && (
                      <button
                        onClick={() => setActiveGenre(null)}
                        className="text-[10px] font-bold text-amber-primary hover:underline ml-auto"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <motion.div
                    className="flex flex-wrap gap-2"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.04 } }
                    }}
                  >
                    {/* "Semua" reset pill */}
                    <motion.button
                      variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                      onClick={() => setActiveGenre(null)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 ${
                        activeGenre === null
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-surface border-border text-muted hover:border-foreground/40 hover:text-foreground'
                      }`}
                    >
                      Semua
                    </motion.button>

                    {GENRE_CHIPS.map((genre) => (
                      <motion.button
                        key={genre}
                        variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                        onClick={() => setActiveGenre(activeGenre === genre ? null : genre)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 ${
                          activeGenre === genre
                            ? 'bg-amber-primary text-white border-amber-primary shadow-md shadow-amber-primary/20'
                            : 'bg-surface border-border text-muted hover:border-amber-primary/40 hover:text-foreground'
                        }`}
                      >
                        {genre}
                      </motion.button>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filter + result count inline */}
          <AnimatePresence>
            {(hasActiveFilter || query) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 pt-2 pb-1 overflow-hidden"
              >
                <span className="text-xs text-muted">
                  <span className="font-bold text-foreground">{filtered.length}</span> spot ditemukan
                  {activeGenre && <> · genre <span className="text-amber-primary font-bold">{activeGenre}</span></>}
                  {query && <> · "<span className="text-amber-primary font-bold">{query}</span>"</>}
                </span>
                <button onClick={clearAll} className="text-xs text-muted hover:text-foreground transition-colors ml-auto shrink-0">
                  Bersihkan semua
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Page Title */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-8">
        <h1 className="text-5xl font-display font-bold tracking-tight">
          Jelajahi<br /><span className="text-amber-primary italic">Spot Foto</span>
        </h1>
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
            {(hasActiveFilter || query) && (
              <button onClick={clearAll} className="mt-4 text-sm font-bold text-amber-primary hover:underline">
                Coba hapus filter
              </button>
            )}
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
                  <div className="aspect-[4/3] bg-surface-alt overflow-hidden relative">
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
                        <span key={g} className="px-2 py-0.5 bg-background/80 backdrop-blur-sm text-white text-[9px] font-mono font-bold rounded-full uppercase">
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
