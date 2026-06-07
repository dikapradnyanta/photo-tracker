'use client'

import Link from 'next/link'
import { Camera } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  const hiddenRoutes = ['/login', '/onboarding', '/map']
  if (hiddenRoutes.includes(pathname)) return null

  return (
    <footer className="bg-surface-alt border-t border-border pt-24 pb-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="w-6 h-6 text-amber-primary" />
            <span className="font-display font-bold text-2xl tracking-tight">PhotoTracker</span>
          </div>
          <p className="text-sm text-muted leading-relaxed max-w-sm">
            Platform direktori spot foto di Indonesia. Temukan lokasi terbaik, bagikan sudut pandangmu, dan berkembang bersama komunitas.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold mb-6 tracking-wide text-foreground">Menu</h4>
          <ul className="space-y-4 text-sm text-muted font-medium">
            <li><Link href="/" className="hover:text-amber-primary transition-colors">Beranda</Link></li>
            <li><Link href="/map" className="hover:text-amber-primary transition-colors">Peta Interaktif</Link></li>
            <li><Link href="/add-spot" className="hover:text-amber-primary transition-colors">Tambah Spot</Link></li>
            <li><Link href="/community" className="hover:text-amber-primary transition-colors">Komunitas</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} PhotoTracker Indonesia.
        </p>
      </div>
    </footer>
  )
}
