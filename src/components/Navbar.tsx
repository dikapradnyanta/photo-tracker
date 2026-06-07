'use client'

import Link from 'next/link'
import { PlusCircle, Menu, X, Home, Map as MapIcon, User, Users, Camera } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from './ThemeToggle'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

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

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Peta Spot', path: '/map', icon: MapIcon },
    { name: 'Komunitas', path: '/community', icon: Users },
    { name: 'Profil', path: '/profile', icon: User },
  ]

  const hiddenRoutes = ['/login', '/onboarding']
  if (hiddenRoutes.includes(pathname)) return null

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

          {/* Spacer */}
          <div className="flex-1" />

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
