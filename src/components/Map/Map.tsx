'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, ArrowRight, Loader2, X, MapPin, Clock, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SpotWithPhoto } from '@/types/database'

// Dynamic import for MainMap
const MainMap = dynamic(() => import('./MainMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-white/5 animate-pulse flex items-center justify-center text-muted text-xs">Loading Map Engine...</div>
})

const BEST_TIME_LABEL: Record<string, string> = {
  golden_hour: 'Golden Hour',
  blue_hour: 'Blue Hour',
  midday: 'Siang',
  night: 'Malam',
}

export default function Map() {
  const [spots, setSpots] = useState<SpotWithPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<SpotWithPhoto | null>(null)
  const [selectedClusterSpots, setSelectedClusterSpots] = useState<SpotWithPhoto[]>([])
  const [bounds, setBounds] = useState<any>(null)
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SpotWithPhoto[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  const GENRES = ['Semua', 'Landscape', 'Street', 'Portrait', 'Astro']

  const fetchSpots = useCallback(async (currentBounds: any) => {
    if (!currentBounds) return
    
    setLoading(true)
    try {
      const sw = currentBounds.getSouthWest()
      const ne = currentBounds.getNorthEast()

      const { data, error } = await supabase.rpc('get_spots_in_bbox', {
        min_lat: sw.lat,
        min_long: sw.lng,
        max_lat: ne.lat,
        max_long: ne.lng
      })

      if (error) throw error

      const rawSpots: SpotWithPhoto[] = (data || [])

      // Ambil unique user IDs yang added_by-nya ada
      const userIds = [...new Set(rawSpots.map((s: SpotWithPhoto) => s.added_by).filter(Boolean))]

      let userMap: Record<string, { username: string | null; avatar_url: string | null }> = {}
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .in('id', userIds as string[])
        ;(usersData || []).forEach((u: any) => {
          userMap[u.id] = { username: u.username, avatar_url: u.avatar_url }
        })
      }

      const enriched = rawSpots.map((s: SpotWithPhoto) => ({
        ...s,
        added_by_username: s.added_by ? (userMap[s.added_by]?.username ?? null) : null,
        added_by_avatar: s.added_by ? (userMap[s.added_by]?.avatar_url ?? null) : null,
      }))

      setSpots(enriched)
    } catch (error) {
      console.error('Error fetching spots:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (bounds) {
      const timer = setTimeout(() => fetchSpots(bounds), 300)
      return () => clearTimeout(timer)
    }
  }, [bounds, fetchSpots])

  // Close search dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // Debounced search handler — searches within already-fetched spots
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!q.trim()) { setSearchResults([]); setSearchLoading(false); return }
    setSearchLoading(true)
    searchTimeout.current = setTimeout(() => {
      const lower = q.toLowerCase()
      const results = spots.filter(s =>
        s.name.toLowerCase().includes(lower) ||
        s.description?.toLowerCase().includes(lower)
      ).slice(0, 8)
      setSearchResults(results)
      setSearchLoading(false)
    }, 250)
  }, [spots])

  const visibleSpots = activeGenre && activeGenre !== 'Semua'
    ? spots.filter(s => s.genre?.map(g => g.toLowerCase()).includes(activeGenre.toLowerCase()))
    : spots

  return (
    <div className="h-[calc(100vh-var(--nav-height))] w-full flex flex-col relative overflow-hidden">

      {/* ── SEARCH BAR & FILTER (top-left, Google Maps style) ── */}
      <div ref={searchRef} className="absolute top-4 left-4 right-4 md:left-6 md:right-auto md:w-[440px] z-[1000]">
        
        {/* Top Row: Search Input + Filter Toggle */}
        <div className="flex items-start gap-2">
          {/* Search Input */}
          <div className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 shadow-2xl ${
            searchOpen
              ? 'bg-background/98 backdrop-blur-2xl border-amber-primary/50 shadow-amber-primary/10'
              : 'glass border-border/60 backdrop-blur-xl'
          }`}>
            {searchLoading
              ? <Loader2 className="w-4 h-4 text-amber-primary animate-spin shrink-0" />
              : <Search className={`w-4 h-4 shrink-0 transition-colors ${searchOpen ? 'text-amber-primary' : 'text-muted'}`} />}
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Cari spot di area ini..."
              className="flex-1 min-w-0 bg-transparent text-sm font-medium text-foreground placeholder:text-muted/60 focus:outline-none"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => { setSearchQuery(''); setSearchResults([]); searchInputRef.current?.focus() }}
                  className="w-5 h-5 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors shrink-0"
                >
                  <X className="w-3 h-3" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          {searchOpen && (
            <p className="text-[10px] text-muted/60 mt-1 ml-1 absolute -bottom-5 left-0">
              Pencarian hanya mencakup spot yang terlihat di peta saat ini.
            </p>
          )}

          {/* Filter Toggle Button */}
          <button
            onClick={() => {
              setFilterOpen(prev => !prev)
              setSearchOpen(false)
            }}
            className={`relative flex items-center justify-center w-12 h-12 rounded-2xl border transition-all duration-300 shadow-2xl shrink-0 ${
              filterOpen || activeGenre
                ? 'bg-amber-primary border-amber-primary text-white shadow-amber-primary/20'
                : 'glass border-border/60 backdrop-blur-xl text-muted hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {/* Active dot indicator */}
            {activeGenre && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-white border border-amber-primary shadow-sm"
              />
            )}
          </button>
        </div>

        {/* Dropdown Results */}
        <AnimatePresence>
          {searchOpen && (searchQuery.trim() || searchResults.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="mt-2 bg-background/98 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Loading */}
              {searchLoading && (
                <div className="px-4 py-3 text-xs text-muted flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-amber-primary border-t-transparent rounded-full animate-spin" />
                  Mencari...
                </div>
              )}

              {/* No result */}
              {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <Search className="w-8 h-8 text-muted/30 mx-auto mb-2" />
                  <p className="text-xs text-muted">Tidak ada spot &ldquo;<strong>{searchQuery}</strong>&rdquo;</p>
                </div>
              )}

              {/* Results */}
              {!searchLoading && searchResults.length > 0 && (
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-border/50">
                    <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
                      {searchResults.length} spot ditemukan
                    </span>
                  </div>
                  {searchResults.map((result, i) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => {
                        setSelectedSpot(result)
                        setSelectedClusterSpots([])
                        setSearchOpen(false)
                        setSearchQuery('')
                        setSearchResults([])
                      }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-alt transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-primary/10 border border-amber-primary/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-primary/20 transition-colors">
                        <MapPin className="w-3.5 h-3.5 text-amber-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground group-hover:text-amber-primary transition-colors truncate">
                          {result.name}
                        </p>
                        {result.description && (
                          <p className="text-[11px] text-muted truncate mt-0.5">{result.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {result.genre?.slice(0, 2).map(g => (
                            <span key={g} className="px-1.5 py-0.5 bg-amber-primary/10 text-amber-primary text-[9px] font-mono font-bold rounded uppercase">{g}</span>
                          ))}
                          {result.best_time && (
                            <span className="flex items-center gap-1 text-[10px] text-muted/80">
                              <Clock className="w-2.5 h-2.5" />
                              {BEST_TIME_LABEL[result.best_time] || result.best_time}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-mono text-muted/60">{result.latitude.toFixed(3)}</p>
                        <p className="text-[9px] font-mono text-muted/60 mt-0.5">{result.longitude.toFixed(3)}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── EXPANDABLE GENRE FILTER PILLS ── */}
      <div className="absolute top-[76px] left-4 right-4 md:left-6 md:right-auto md:w-[440px] z-[999]">
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="origin-top"
            >
              <div className="glass bg-surface-alt/80 border border-border/60 rounded-2xl shadow-xl p-3 flex flex-wrap gap-2">
                {GENRES.map((g) => {
                  const isActive = activeGenre === g || (activeGenre === null && g === 'Semua');
                  return (
                    <button
                      key={g}
                      onClick={() => {
                        setActiveGenre(g === 'Semua' ? null : g)
                        // Optional: setFilterOpen(false) jika ingin auto-close setelah klik
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                        isActive
                          ? 'bg-amber-primary text-white border-transparent shadow-md shadow-amber-primary/20'
                          : 'bg-background/50 text-muted border border-border/50 hover:border-amber-primary/40 hover:text-foreground'
                      }`}
                    >
                      {g}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full relative">
        <MainMap 
          spots={visibleSpots} 
          onBoundsChange={setBounds} 
          onSpotClick={(spot) => {
            setSelectedSpot(spot)
            setSelectedClusterSpots([])
          }} 
          onClusterClick={(clusterSpots) => {
            setSelectedClusterSpots(clusterSpots)
            setSelectedSpot(null)
          }}
        />

        {loading && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-background/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full shadow-2xl">
            <Loader2 className="w-4 h-4 animate-spin text-amber-primary" />
            <span className="text-xs font-bold tracking-widest uppercase">Syncing Spots...</span>
          </div>
        )}
      </div>

      {/* Quick Preview Bottom Sheet */}
      <AnimatePresence>
        {selectedSpot && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 z-[2000] p-4 md:p-8"
          >
            <div className="max-w-xl mx-auto glass p-6 rounded-[32px] shadow-2xl border border-border relative overflow-hidden text-foreground">
              <button 
                onClick={() => setSelectedSpot(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-all z-10"
              >
                <X className="w-5 h-5 text-muted" />
              </button>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-40 h-40 rounded-[24px] overflow-hidden shrink-0 border border-border bg-surface-alt">
                  {selectedSpot.hero_photo_url && (
                    <img src={selectedSpot.hero_photo_url} alt={selectedSpot.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedSpot.genre?.map(g => (
                        <span key={g} className="px-2 py-0.5 bg-forest/20 text-forest text-[10px] font-mono font-bold rounded uppercase">
                          {g}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-2">{selectedSpot.name}</h3>
                    <p className="text-sm text-muted line-clamp-2 leading-relaxed">{selectedSpot.description}</p>
                  </div>
                  
                  {/* Uploader info */}
                  {selectedSpot.added_by_username && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-6 h-6 rounded-full bg-amber-primary/20 border border-amber-primary/30 flex items-center justify-center text-[10px] font-bold text-amber-primary overflow-hidden shrink-0">
                        {selectedSpot.added_by_avatar
                          ? <img src={selectedSpot.added_by_avatar} alt="" className="w-full h-full object-cover" />
                          : selectedSpot.added_by_username[0].toUpperCase()
                        }
                      </div>
                      <span className="text-[11px] text-muted font-mono">
                        Ditambahkan oleh <span className="text-foreground font-bold">@{selectedSpot.added_by_username}</span>
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <span className="block text-[8px] font-mono text-muted uppercase">Waktu</span>
                        <span className="text-[10px] font-bold text-amber-primary uppercase">{selectedSpot.best_time?.replace('_', ' ')}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[8px] font-mono text-muted uppercase">Akses</span>
                        <span className="text-[10px] font-bold uppercase">{selectedSpot.difficulty}</span>
                      </div>
                    </div>
                    <Link 
                      href={`/spot/${selectedSpot.id}`}
                      className="px-6 py-3 bg-foreground text-background rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-primary hover:text-white transition-all group"
                    >
                      Lihat Detail
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cluster Gallery Bottom Sheet */}
      <AnimatePresence>
        {selectedClusterSpots.length > 0 && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 z-[2000] p-4 md:p-8 pointer-events-none"
          >
            <div className="max-w-4xl mx-auto glass p-6 rounded-[32px] shadow-2xl border border-border relative overflow-hidden text-foreground pointer-events-auto">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-display font-bold text-xl">
                  {selectedClusterSpots.length} Spot Ditemukan
                </h3>
                <button 
                  onClick={() => setSelectedClusterSpots([])}
                  className="p-2 hover-surface rounded-full transition-all"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {selectedClusterSpots.map((spot) => (
                  <button
                    key={spot.id}
                    onClick={() => {
                      setSelectedSpot(spot)
                      setSelectedClusterSpots([])
                    }}
                    className="w-[260px] md:w-[280px] shrink-0 snap-center flex flex-col text-left group"
                  >
                    <div className="w-full h-40 rounded-[24px] overflow-hidden mb-3 border border-border relative bg-surface-alt">
                      {spot.hero_photo_url ? (
                        <img src={spot.hero_photo_url} alt={spot.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface-alt">
                          <MapPin className="w-8 h-8 text-amber-primary/30" />
                          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Belum ada foto</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {spot.genre?.slice(0, 2).map(g => (
                          <span key={g} className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[8px] font-mono font-bold rounded uppercase">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h4 className="font-bold text-base line-clamp-1 group-hover:text-amber-primary transition-colors">{spot.name}</h4>
                    <p className="text-xs text-muted mt-1 uppercase font-bold tracking-wider">{spot.difficulty} • {spot.best_time?.replace('_', ' ')}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
