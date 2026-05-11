'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, ArrowRight, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamic import for MainMap
const MainMap = dynamic(() => import('./MainMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-white/5 animate-pulse flex items-center justify-center text-muted text-xs">Loading Map Engine...</div>
})

interface Spot {
  id: string
  name: string
  description: string
  latitude: number
  longitude: number
  genre: string[]
  best_time: string
  difficulty: string
  hero_photo_url: string
}

export default function Map() {
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)
  const [bounds, setBounds] = useState<any>(null)

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
      setSpots(data || [])
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

  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col relative overflow-hidden">
      {/* Search Bar */}
      <div className="absolute top-6 left-6 right-6 z-[1000] md:left-12 md:right-auto md:w-96">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-amber-primary" />
          <input 
            type="text"
            placeholder="Cari spot di daerah..."
            className="w-full pl-16 pr-8 py-5 bg-background/80 backdrop-blur-md border border-white/10 rounded-2xl focus:outline-none focus:border-amber-primary transition-all text-sm font-medium shadow-2xl"
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full relative">
        <MainMap 
          spots={spots} 
          onBoundsChange={setBounds} 
          onSpotClick={setSelectedSpot} 
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
            <div className="max-w-xl mx-auto glass p-6 rounded-[32px] shadow-2xl border border-white/10 relative overflow-hidden text-paper">
              <button 
                onClick={() => setSelectedSpot(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-all z-10"
              >
                <X className="w-5 h-5 text-muted" />
              </button>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-40 h-40 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-white/5">
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
                  
                  <div className="flex items-center justify-between mt-6">
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
                      className="px-6 py-3 bg-obsidian text-paper rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-primary transition-all group"
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
    </div>
  )
}
