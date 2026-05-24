'use client'

import Link from 'next/link'
import { Camera, Map as MapIcon, User, PlusCircle, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from './ThemeToggle'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    { name: 'Home', path: '/' },
    { name: 'Peta Spot', path: '/map' },
    { name: 'Profil', path: '/profile' }
  ]

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'py-4' 
          : 'py-6'
      }`}
    >
      <div className={`max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 rounded-full h-16' 
          : 'bg-transparent border-transparent h-14'
      }`}>
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group relative">
            <span className="text-2xl font-display font-bold tracking-tight z-10">
              Photo<span className="text-amber-primary italic group-hover:not-italic transition-all">Tracker</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/5 dark:border-white/10">
            {navItems.map((item) => {
              const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
              return (
                <Link 
                  key={item.name}
                  href={item.path === '/profile' && !user ? '/login' : item.path} 
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-muted hover:text-foreground'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-amber-primary rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.name}</span>
                </Link>
              )
            })}
          </div>
          
          <div className="h-6 w-[1px] bg-border/20 mx-1 hidden md:block" />
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!user && (
              <Link href="/login" className="hidden md:flex items-center px-5 py-2 bg-obsidian text-paper dark:bg-white dark:text-black rounded-full text-sm font-bold hover:scale-105 transition-transform">
                Masuk
              </Link>
            )}
            {user && (
              <Link href="/add-spot" className="hidden md:flex items-center gap-2 px-5 py-2 bg-amber-primary text-white rounded-full text-sm font-bold hover:shadow-lg hover:shadow-amber-primary/30 hover:scale-105 transition-all">
                <PlusCircle className="w-4 h-4" /> Tambah Spot
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
