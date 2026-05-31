'use client'

import Link from 'next/link'
import { PlusCircle, Menu, X, Home, Map as MapIcon, User, Search, MapPin, Clock } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from './ThemeToggle'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

type SearchResult = {
  id: string
  name: string
  description: string | null
  genre: string[] | null
  best_time: string | null
  difficulty: string | null
  latitude: number
  longitude: number
}

const BEST_TIME_LABEL: Record<string, string> = {
  golden_hour: 'Golden Hour',
  blue_hour: 'Blue Hour',
  midday: 'Siang Hari',
  night: 'Malam Hari',
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMenuOpen(false); setSearchOpen(false) }, [pathname])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close search on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
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
          .select('id, name, description, genre, best_time, difficulty, latitude, longitude')
          .or(`name.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`)
          .limit(8)
        setSearchResults(data || [])
      } catch (err) {
        console.error('Search error:', err)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
  }, [])

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Peta Spot', path: '/map', icon: MapIcon },
    { name: 'Profil', path: '/profile', icon: User },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 right-0 z-[3000] transition-all duration-300 pointer-events-none ${
          isScrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className={`max-w-7xl mx-auto px-4 md:px-6 flex items-center gap-3 transition-all duration-300 pointer-events-auto ${
          isScrolled
            ? 'bg-background/80 backdrop-blur-xl border border-border shadow-lg shadow-black/5 dark:shadow-black/20 rounded-full h-14 px-4'
            : 'bg-transparent border-transparent h-14'
        }`}>

          {/* Burger Button — LEFT, mobile only */}
          <button
            id="burger-menu-btn"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-alt transition-colors shrink-0"
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="w-5 h-5" />
                </motion.span>
              ) : (
                <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0 mr-2">
            <span className="text-xl md:text-2xl font-display font-bold tracking-tight">
              Photo<span className="text-amber-primary italic group-hover:not-italic transition-all">Tracker</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-5 ml-2">
            {navItems.map((item) => {
              const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
              return (
                <Link
                  key={item.name}
                  href={item.path === '/profile' && !user ? '/login' : item.path}
                  className={`relative py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-foreground font-bold' : 'text-muted hover:text-foreground'
                  }`}
                >
                  <span className="relative z-10 uppercase tracking-widest text-[11px] font-mono">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute bottom-0 left-0 right-0 h-px bg-amber-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* SEARCH BAR — center / flex-1 */}
          <div ref={searchRef} className="flex-1 relative max-w-sm mx-auto md:mx-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300 ${
              searchOpen
                ? 'bg-background/90 backdrop-blur-xl border-amber-primary/40 shadow-lg shadow-amber-primary/10'
                : 'bg-black/20 md:bg-surface-alt/60 border-border/30 backdrop-blur-md hover:border-border'
            }`}>
              <Search className="w-3.5 h-3.5 text-muted shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Cari spot foto..."
                className="w-full bg-transparent text-xs md:text-sm text-foreground placeholder:text-muted/70 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); searchInputRef.current?.focus() }}
                  className="text-muted hover:text-foreground transition-colors shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Search Dropdown */}
            <AnimatePresence>
              {searchOpen && (searchQuery.trim() || searchResults.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/20 overflow-hidden z-50"
                >
                  {/* Loading */}
                  {searchLoading && (
                    <div className="px-4 py-3 text-xs text-muted flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-amber-primary border-t-transparent rounded-full animate-spin" />
                      Mencari...
                    </div>
                  )}

                  {/* No Results */}
                  {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                    <div className="px-4 py-6 text-center">
                      <Search className="w-8 h-8 text-muted/30 mx-auto mb-2" />
                      <p className="text-xs text-muted">Tidak ada spot yang cocok dengan <strong>"{searchQuery}"</strong></p>
                    </div>
                  )}

                  {/* Results List */}
                  {!searchLoading && searchResults.length > 0 && (
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-border/50">
                        <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
                          {searchResults.length} Spot Ditemukan
                        </span>
                      </div>
                      {searchResults.map((result, i) => (
                        <motion.button
                          key={result.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => {
                            router.push(`/spot/${result.id}`)
                            setSearchOpen(false)
                            setSearchQuery('')
                            setSearchResults([])
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-alt transition-colors text-left group"
                        >
                          {/* Map pin icon */}
                          <div className="w-8 h-8 rounded-xl bg-amber-primary/10 border border-amber-primary/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-primary/20 transition-colors">
                            <MapPin className="w-3.5 h-3.5 text-amber-primary" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground group-hover:text-amber-primary transition-colors truncate">
                              {result.name}
                            </p>
                            {result.description && (
                              <p className="text-[11px] text-muted truncate mt-0.5 leading-relaxed">
                                {result.description}
                              </p>
                            )}
                            <div className="flex items-center flex-wrap gap-2 mt-1.5">
                              {result.genre?.slice(0, 2).map(g => (
                                <span key={g} className="px-1.5 py-0.5 bg-amber-primary/10 text-amber-primary text-[9px] font-mono font-bold rounded uppercase tracking-wider">
                                  {g}
                                </span>
                              ))}
                              {result.best_time && (
                                <span className="flex items-center gap-1 text-[10px] text-muted/80">
                                  <Clock className="w-2.5 h-2.5" />
                                  {BEST_TIME_LABEL[result.best_time] || result.best_time}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Coordinates */}
                          <div className="text-right shrink-0">
                            <p className="text-[9px] font-mono text-muted/60 leading-none">{result.latitude.toFixed(3)}</p>
                            <p className="text-[9px] font-mono text-muted/60 mt-0.5">{result.longitude.toFixed(3)}</p>
                          </div>
                        </motion.button>
                      ))}

                      {/* View All on Map */}
                      <div className="border-t border-border/50 p-2">
                        <button
                          onClick={() => {
                            router.push(`/map?q=${encodeURIComponent(searchQuery)}`)
                            setSearchOpen(false)
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-amber-primary hover:bg-amber-primary/5 rounded-xl transition-colors"
                        >
                          <MapIcon className="w-3.5 h-3.5" />
                          Lihat semua di Peta
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            {!user && (
              <Link href="/login" className="hidden md:flex items-center px-4 py-2 bg-foreground text-background rounded-full text-sm font-bold hover:scale-105 transition-transform">
                Masuk
              </Link>
            )}
            {user && (
              <Link href="/add-spot" className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-primary text-white rounded-full text-sm font-bold hover:shadow-lg hover:shadow-amber-primary/30 hover:scale-105 transition-all">
                <PlusCircle className="w-4 h-4" /> Tambah Spot
              </Link>
            )}
          </div>
        </div>
      </motion.nav>

      {/* ── MOBILE DRAWER — slides from LEFT ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[2900] bg-black/50 backdrop-blur-sm md:hidden"
            />

            {/* Drawer — LEFT side */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="fixed top-0 left-0 bottom-0 z-[3100] w-[75vw] max-w-[300px] md:hidden flex flex-col"
              style={{
                background: 'var(--bg)',
                borderRight: '1px solid var(--border)',
              }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border">
                <span className="text-lg font-display font-bold">
                  Photo<span className="text-amber-primary italic">Tracker</span>
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-alt transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav Links */}
              <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                {navItems.map((item, i) => {
                  const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                    >
                      <Link
                        href={item.path === '/profile' && !user ? '/login' : item.path}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium transition-all ${
                          isActive
                            ? 'bg-amber-primary/10 text-amber-primary border border-amber-primary/20'
                            : 'text-foreground hover:bg-surface-alt'
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="font-mono text-xs uppercase tracking-widest">{item.name}</span>
                        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-primary" />}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              {/* Drawer Footer */}
              <div className="px-4 pb-8 pt-4 border-t border-border space-y-3">
                {!user ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <Link
                      href="/login"
                      className="flex items-center justify-center w-full px-5 py-3.5 bg-foreground text-background rounded-2xl text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                      Masuk ke Akun
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <Link
                      href="/add-spot"
                      className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-amber-primary text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-amber-primary/30 transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Tambah Spot
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
