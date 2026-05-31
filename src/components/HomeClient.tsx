'use client'

import Navbar from "@/components/Navbar";
import { Camera, Map as MapIcon, ArrowRight, Compass, Search, MapPin, Clock, Star, PlusCircle } from "lucide-react";
import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
}

const BEST_TIME_LABEL: Record<string, string> = {
  golden_hour: 'Golden Hour',
  blue_hour: 'Blue Hour',
  midday: 'Siang',
  night: 'Malam',
}

export default function HomeClient({ spots }: { spots: any[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    if (!query.trim()) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('spots')
          .select('id, name, description, genre, best_time, latitude, longitude')
          .or(`name.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`)
          .limit(5)
        setSearchResults(data || [])
      } catch (err) {
        console.error('Search error:', err)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/map?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-amber-primary selection:text-white overflow-hidden">
      <Navbar />

      {/* ─────────── HERO: CENTERED SEARCH ─────────── */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 flex flex-col items-center justify-center min-h-[85vh] text-center noise">
        
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 dark:opacity-20 pointer-events-none -z-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-[-15]" />
        
        <motion.div 
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto w-full relative z-10 flex flex-col items-center"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-surface/50 backdrop-blur-md border border-border mb-8">
            <div className="w-2 h-2 rounded-full bg-amber-primary animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">Direktori Spot Foto #1 Indonesia</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-black leading-[1.05] tracking-tight text-foreground mb-6 drop-shadow-sm">
            Temukan Sudut
            <br />
            Pandang <em className="font-serif italic font-light text-amber-primary">Baru.</em>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-base md:text-xl text-foreground/70 font-sans leading-relaxed max-w-2xl mb-12">
            Cari spot foto tersembunyi, lihat karya fotografer lain, dan bagikan lokasimu ke dalam peta komunitas.
          </motion.p>

          {/* GIANT SEARCH BAR */}
          <motion.div variants={fadeUp} className="w-full max-w-2xl relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-muted group-focus-within:text-amber-primary transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Cari lokasi, gunung, kafe, pantai..."
                className="block w-full pl-16 pr-32 py-5 sm:text-lg bg-surface/80 backdrop-blur-xl border-2 border-border rounded-full text-foreground placeholder:text-muted/60 focus:border-amber-primary/50 focus:ring-4 focus:ring-amber-primary/10 transition-all outline-none shadow-2xl"
              />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <button
                  type="submit"
                  className="px-6 py-3 bg-foreground text-background rounded-full font-bold text-sm hover:scale-105 transition-transform"
                >
                  Cari
                </button>
              </div>
            </form>

            {/* Live Search Dropdown */}
            <AnimatePresence>
              {searchOpen && (searchQuery.trim() || searchResults.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-surface backdrop-blur-3xl border border-border rounded-3xl shadow-2xl overflow-hidden z-50 text-left"
                >
                  {searchLoading && (
                    <div className="p-6 flex items-center justify-center gap-3 text-muted">
                      <div className="w-4 h-4 border-2 border-amber-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Mencari spot...</span>
                    </div>
                  )}

                  {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                    <div className="p-8 text-center">
                      <Compass className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                      <p className="text-sm text-foreground font-medium">Spot belum ditemukan.</p>
                      <p className="text-xs text-muted mt-1">Jadilah yang pertama menambahkannya!</p>
                    </div>
                  )}

                  {!searchLoading && searchResults.length > 0 && (
                    <div className="py-2">
                      {searchResults.map((result, i) => (
                        <button
                          key={result.id}
                          onClick={() => router.push(`/spot/${result.id}`)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-surface-alt transition-colors group border-b border-border/30 last:border-0"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-amber-primary/10 flex items-center justify-center shrink-0 group-hover:bg-amber-primary transition-colors">
                            <MapPin className="w-5 h-5 text-amber-primary group-hover:text-white transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold text-foreground truncate group-hover:text-amber-primary transition-colors">{result.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {result.genre?.slice(0, 1).map((g: string) => (
                                <span key={g} className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">{g}</span>
                              ))}
                              {result.best_time && (
                                <>
                                  <span className="text-muted/30">•</span>
                                  <span className="text-[10px] text-muted flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {BEST_TIME_LABEL[result.best_time] || result.best_time}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                      <div className="p-2 bg-surface-alt/50 border-t border-border">
                        <button onClick={handleSearchSubmit} className="w-full py-3 text-sm font-bold text-amber-primary hover:bg-amber-primary/10 rounded-xl transition-colors">
                          Lihat semua hasil di Peta
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick links */}
          <motion.div variants={fadeUp} className="mt-8 flex items-center gap-6 text-sm font-medium text-muted">
            <Link href="/map" className="flex items-center gap-2 hover:text-amber-primary transition-colors">
              <MapIcon className="w-4 h-4" /> Eksplorasi Peta
            </Link>
            <Link href="/add-spot" className="flex items-center gap-2 hover:text-amber-primary transition-colors">
              <PlusCircle className="w-4 h-4" /> Bagikan Spot
            </Link>
          </motion.div>

        </motion.div>
      </section>

      {/* ─────────── SECTION 2: Spot Terpopuler (Clean Grid) ─────────── */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Spot Terpopuler</h2>
            <p className="text-muted max-w-md">Kurasi lokasi fotografi terbaik berdasarkan popularitas dan rating komunitas.</p>
          </div>
          <Link href="/map" className="shrink-0 px-6 py-3 bg-surface border border-border rounded-full text-sm font-bold hover:border-amber-primary/50 transition-colors flex items-center gap-2">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {spots.map((spot, i) => (
            <Link href={`/spot/${spot.id}`} key={spot.id} className="group flex flex-col">
              <div className="w-full aspect-[4/3] rounded-[24px] overflow-hidden mb-5 relative bg-surface-alt">
                <img 
                  src={spot.spot_photos?.[0]?.photo_url || 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80'} 
                  alt={spot.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                
                {/* Rating Badge */}
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-border/50">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-bold font-mono">4.8</span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-xl mb-1 group-hover:text-amber-primary transition-colors line-clamp-1">{spot.name}</h3>
                  <p className="text-muted text-xs flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
                  </p>
                </div>
                {/* Genre Tag */}
                {spot.genre?.[0] && (
                  <span className="shrink-0 px-2.5 py-1 bg-surface-alt text-muted text-[9px] font-mono font-bold uppercase rounded-md border border-border">
                    {spot.genre[0]}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────── SECTION 3: CTA Banner (Pengganti Sorotan Komunitas) ─────────── */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto mb-24">
        <div className="relative rounded-[32px] overflow-hidden bg-amber-primary text-white p-10 md:p-16 lg:p-20 flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl shadow-amber-primary/20">
          
          {/* Deco */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-display font-black leading-tight mb-4">
              Punya Spot Rahasia?
            </h2>
            <p className="text-white/80 text-lg md:text-xl font-medium">
              Bantu fotografer lain menemukan keindahan tersembunyi. Bagikan lokasi, hasil foto terbaikmu, dan jadilah inspirasi.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <Link 
              href="/add-spot" 
              className="inline-flex items-center gap-3 px-8 py-5 bg-white text-amber-900 rounded-full font-black text-lg hover:scale-105 hover:shadow-xl transition-all"
            >
              <PlusCircle className="w-6 h-6" />
              Bagikan Spot Sekarang
            </Link>
          </div>

        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer className="bg-surface border-t border-border pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-6 h-6 text-amber-primary" />
              <span className="font-display font-bold text-2xl tracking-tight">PhotoTracker</span>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-sm">
              Platform direktori spot foto di Indonesia. Temukan lokasi terbaik, bagikan sudut pandangmu, dan berkembang bersama komunitas.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 tracking-wide text-foreground">Menu</h4>
            <ul className="space-y-3 text-sm text-muted font-medium">
              <li><Link href="/" className="hover:text-amber-primary transition-colors">Beranda</Link></li>
              <li><Link href="/map" className="hover:text-amber-primary transition-colors">Peta Interaktif</Link></li>
              <li><Link href="/add-spot" className="hover:text-amber-primary transition-colors">Tambah Spot</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            © 2026 PhotoTracker Indonesia.
          </p>
        </div>
      </footer>
    </main>
  );
}
