'use client'

import Link from 'next/link'
import { Camera, Map as MapIcon, User, PlusCircle, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from './ThemeToggle'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/10 bg-background/80 backdrop-blur-md px-6 md:px-12 h-20 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-display font-bold tracking-tight">
            Photo<span className="text-amber-primary italic group-hover:not-italic transition-all">Tracker</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link 
            href="/map" 
            className={`transition-colors hover:text-amber-primary ${pathname === '/map' ? 'text-amber-primary' : 'text-muted'}`}
          >
            Peta
          </Link>
          <Link 
            href="/spots" 
            className={`transition-colors hover:text-amber-primary ${pathname === '/spots' ? 'text-amber-primary' : 'text-muted'}`}
          >
            Spot
          </Link>
          <Link 
            href={user ? "/profile" : "/login"} 
            className={`transition-colors hover:text-amber-primary ${pathname === '/profile' || pathname === '/login' ? 'text-amber-primary' : 'text-muted'}`}
          >
            Profil
          </Link>
        </div>
        
        <div className="h-6 w-[1px] bg-border/20 mx-2 hidden md:block" />
        
        <ThemeToggle />
      </div>
    </nav>
  )
}
