'use client'

import Navbar from "@/components/Navbar";
import { Camera, Map as MapIcon, ArrowRight, Compass, Star, MapPin, Clock, Zap } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

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

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Mudah',
  medium: 'Sedang',
  hard: 'Sulit',
}

export default function HomeClient({ spots, highlightUser, communityPhotos }: { spots: any[], highlightUser: any, communityPhotos: any[] }) {
  
  // Safe photo fetching
  const c1 = communityPhotos[0]?.photo_url || "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80"
  const c2 = communityPhotos[1]?.photo_url || "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&q=80"
  const c3 = communityPhotos[2]?.photo_url || "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&q=80"
  const c4 = communityPhotos[3]?.photo_url || "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=600&q=80"
  const c5 = communityPhotos[4]?.photo_url || "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&q=80"

  const topSpots = spots.slice(0, 6)
  
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-amber-primary selection:text-white overflow-hidden">
      <Navbar />

      {/* ─────────── HERO: SPLIT WITH STACKED CARDS ─────────── */}
      <section className="relative pt-[calc(var(--nav-height)+48px)] pb-32 px-6 md:px-12 noise min-h-[90vh] flex flex-col justify-center border-b border-border">
        {/* Background blobs */}
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column (Content) */}
          <motion.div 
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 flex flex-col items-start relative z-10"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8 px-4 py-2 bg-surface-alt border border-border rounded-full shadow-sm">
              <div className="w-2 h-2 rounded-full bg-amber-primary animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold">Komunitas Fotografi Indonesia</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-black leading-[1.05] tracking-tight text-foreground mb-8">
              TEMUKAN
              <br />
              <em className="font-serif italic font-light lowercase text-amber-primary pr-2">spot</em>
              <span className="text-foreground">TERBAIK.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-foreground/80 font-sans leading-relaxed max-w-md mb-10">
              Platform komunitas untuk menemukan dan membagikan lokasi foto tersembunyi. Dikurasi oleh sesama fotografer.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mb-12">
              <Link href="/map" className="group px-8 py-4 bg-amber-primary text-white rounded-full font-bold text-sm flex items-center gap-2 hover:shadow-xl hover:shadow-amber-primary/25 hover:-translate-y-0.5 transition-all">
                <Compass className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                Mulai Eksplorasi
              </Link>
              <Link href="/add-spot" className="group px-8 py-4 bg-surface border border-border rounded-full font-bold text-sm flex items-center gap-2 hover:border-amber-primary/40 transition-all">
                Bagikan Spot
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-amber-primary transition-colors" />
              </Link>
            </motion.div>

            {/* Stats Strip */}
            <motion.div variants={fadeUp} className="w-full max-w-md pt-8 border-t border-border flex items-center justify-between text-sm font-mono font-bold">
              <div className="text-foreground"><span className="text-amber-primary text-xl block mb-1">{spots.length}+</span> Spot</div>
              <div className="text-foreground"><span className="text-amber-primary text-xl block mb-1">{communityPhotos.length}+</span> Foto</div>
              <div className="text-foreground"><span className="text-amber-primary text-xl block mb-1">100%</span> Gratis</div>
            </motion.div>

          </motion.div>

          {/* Right Column (Stacked Cards) */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 100 }}
            className="lg:col-span-6 relative h-[500px] w-full mt-12 lg:mt-0"
          >
            {/* Medium Card (Left Bottom, -1deg) */}
            <div className="absolute left-0 bottom-4 w-64 h-80 rounded-[32px] overflow-hidden shadow-2xl -rotate-3 z-10 border-4 border-background group">
              <img src={c2} alt="Hero 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            
            {/* Small Accent Card (Right Bottom, Amber Border) */}
            <div className="absolute right-4 bottom-0 w-48 h-48 rounded-[24px] overflow-hidden shadow-2xl rotate-6 z-30 border-4 border-amber-primary group">
              <img src={c3} alt="Hero 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>

            {/* Large Card (Right Top, 2deg) */}
            <div className="absolute right-8 top-0 w-80 h-[400px] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] rotate-2 z-20 border-4 border-background group">
              <img src={c1} alt="Hero 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────── SECTION 2: Spot Terpopuler (Editorial Grid 12-Col) ─────────── */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Spot Terpopuler</h2>
            <div className="inline-flex px-4 py-1.5 bg-surface-alt border border-border rounded-full text-xs font-mono font-bold">
              6 dari {spots.length} spot terbaik
            </div>
          </div>
          <Link href="/map" className="shrink-0 group flex items-center gap-2 text-sm font-bold hover:text-amber-primary transition-colors">
            Lihat Peta Lengkap <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Top Row: 1 Large (7 cols) + 2 Medium (5 cols) */}
          {topSpots[0] && (
            <Link href={`/spot/${topSpots[0].id}`} className="col-span-12 md:col-span-7 group relative rounded-[32px] overflow-hidden aspect-[16/10] bg-surface-alt shadow-lg">
              <img src={topSpots[0].spot_photos?.[0]?.photo_url || c1} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 w-full text-white">
                <div className="flex gap-2 mb-3">
                  {topSpots[0].best_time && <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-mono font-bold uppercase">{BEST_TIME_LABEL[topSpots[0].best_time] || topSpots[0].best_time}</span>}
                  {topSpots[0].difficulty && <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-mono font-bold uppercase">{DIFFICULTY_LABEL[topSpots[0].difficulty] || topSpots[0].difficulty}</span>}
                </div>
                <h3 className="text-3xl md:text-4xl font-display font-bold mb-2 group-hover:text-amber-400 transition-colors line-clamp-1">{topSpots[0].name}</h3>
                {topSpots[0].description && <p className="text-white/70 text-sm line-clamp-2 max-w-lg">{topSpots[0].description}</p>}
              </div>
            </Link>
          )}

          <div className="col-span-12 md:col-span-5 grid grid-rows-2 gap-6">
            {topSpots[1] && (
              <Link href={`/spot/${topSpots[1].id}`} className="row-span-1 group relative rounded-[32px] overflow-hidden bg-surface-alt shadow-lg">
                <img src={topSpots[1].spot_photos?.[0]?.photo_url || c2} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 w-full text-white">
                  <h3 className="text-2xl font-display font-bold mb-1 group-hover:text-amber-400 transition-colors line-clamp-1">{topSpots[1].name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-white/70">
                    <MapPin className="w-3.5 h-3.5" /> {topSpots[1].latitude?.toFixed(3) ?? '–'}, {topSpots[1].longitude?.toFixed(3) ?? '–'}
                  </div>
                </div>
              </Link>
            )}
            {topSpots[2] && (
              <Link href={`/spot/${topSpots[2].id}`} className="row-span-1 group relative rounded-[32px] overflow-hidden bg-surface-alt shadow-lg">
                <img src={topSpots[2].spot_photos?.[0]?.photo_url || c3} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 w-full text-white">
                  <h3 className="text-2xl font-display font-bold mb-1 group-hover:text-amber-400 transition-colors line-clamp-1">{topSpots[2].name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-white/70">
                    <MapPin className="w-3.5 h-3.5" /> {topSpots[2].latitude?.toFixed(3) ?? '–'}, {topSpots[2].longitude?.toFixed(3) ?? '–'}
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Bottom Row: 3 Small Cards (4 cols each) */}
          {topSpots.slice(3, 6).map((spot, i) => (
            <Link href={`/spot/${spot.id}`} key={spot.id} className="col-span-12 sm:col-span-6 md:col-span-4 group relative flex flex-col">
              <div className="w-full aspect-[4/3] rounded-[24px] overflow-hidden mb-4 relative bg-surface-alt shadow-md">
                <img src={spot.spot_photos?.[0]?.photo_url || [c4,c5,c1][i]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                {/* Badges on top of small cards */}
                <div className="absolute top-3 left-3 flex gap-1">
                  {spot.best_time && <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-mono font-bold rounded uppercase">{BEST_TIME_LABEL[spot.best_time] || spot.best_time}</span>}
                  {spot.difficulty && <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-mono font-bold rounded uppercase">{DIFFICULTY_LABEL[spot.difficulty] || spot.difficulty}</span>}
                </div>
              </div>
              <h3 className="font-display font-bold text-lg mb-1 group-hover:text-amber-primary transition-colors line-clamp-1">{spot.name}</h3>
              <p className="text-muted text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {spot.latitude?.toFixed(4) ?? '–'}, {spot.longitude?.toFixed(4) ?? '–'}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────── SECTION 3: Bento Grid Komunitas ─────────── */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto border-t border-border/50">
        {/* Editorial Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Karya komunitas</h2>
            <p className="text-sm text-muted italic mt-1">Foto terbaru dari fotografer PhotoTracker</p>
          </div>
          <Link href="/spots" className="group flex items-center gap-1.5 text-sm font-bold text-muted hover:text-amber-primary transition-colors shrink-0">
            Lihat semua
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="w-full h-px bg-border mb-8" />

        {/* ── MOBILE BENTO (< md): 3 sel, maks 360px ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid md:hidden grid-cols-2 gap-3 h-[360px] overflow-hidden"
        >
          <div className="col-span-2 rounded-[20px] overflow-hidden relative group bg-surface-alt">
            {communityPhotos[0] && (
              <>
                <img src={communityPhotos[0].photo_url} alt="" className="w-full aspect-video object-cover transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] [filter:grayscale(20%)] group-hover:[filter:grayscale(0)]" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
              </>
            )}
          </div>
          <div className="col-span-1 aspect-square rounded-[20px] overflow-hidden relative group bg-surface-alt">
            {communityPhotos[1] && (
              <>
                <img src={communityPhotos[1].photo_url} alt="" className="w-full h-full object-cover transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] [filter:grayscale(20%)] group-hover:[filter:grayscale(0)]" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
              </>
            )}
          </div>
          <div className="col-span-1 aspect-square rounded-[20px] overflow-hidden relative group bg-surface-alt">
            {communityPhotos[2] && (
              <>
                <img src={communityPhotos[2].photo_url} alt="" className="w-full h-full object-cover transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] [filter:grayscale(20%)] group-hover:[filter:grayscale(0)]" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
              </>
            )}
          </div>
        </motion.div>

        {/* ── DESKTOP BENTO (>= md): 8-col, 3-row, max 560px ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hidden md:grid grid-cols-8 grid-rows-3 gap-3 h-[560px]"
        >
          {/* A: col-span-4 row-span-2 */}
          <div className="col-span-4 row-span-2 rounded-[20px] overflow-hidden relative group bg-surface-alt">
            {communityPhotos[0] && (
              <>
                <img src={communityPhotos[0].photo_url} alt="" className="w-full h-full object-cover transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] [filter:grayscale(20%)] group-hover:[filter:grayscale(0)]" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
                  <span className="font-mono text-[10px] uppercase text-white/80 tracking-widest">Foto komunitas</span>
                </div>
              </>
            )}
          </div>

          {/* B: col-span-2 row-span-1 */}
          <div className="col-span-2 row-span-1 rounded-[20px] overflow-hidden relative group bg-surface-alt">
            {communityPhotos[1] && (
              <>
                <img src={communityPhotos[1].photo_url} alt="" className="w-full h-full object-cover transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] [filter:grayscale(20%)] group-hover:[filter:grayscale(0)]" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                  <span className="font-mono text-[10px] uppercase text-white/80 tracking-widest">Foto komunitas</span>
                </div>
              </>
            )}
          </div>

          {/* C: col-span-2 row-span-1 */}
          <div className="col-span-2 row-span-1 rounded-[20px] overflow-hidden relative group bg-surface-alt">
            {communityPhotos[2] && (
              <>
                <img src={communityPhotos[2].photo_url} alt="" className="w-full h-full object-cover transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] [filter:grayscale(20%)] group-hover:[filter:grayscale(0)]" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                  <span className="font-mono text-[10px] uppercase text-white/80 tracking-widest">Foto komunitas</span>
                </div>
              </>
            )}
          </div>

          {/* D: col-span-4 row-span-1 (wide) */}
          <div className="col-span-4 row-span-1 rounded-[20px] overflow-hidden relative group bg-surface-alt">
            {communityPhotos[3] && (
              <>
                <img src={communityPhotos[3].photo_url} alt="" className="w-full h-full object-cover transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] [filter:grayscale(20%)] group-hover:[filter:grayscale(0)]" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                  <span className="font-mono text-[10px] uppercase text-white/80 tracking-widest">Foto komunitas</span>
                </div>
              </>
            )}
          </div>

          {/* E: col-span-2 row-span-1 — reuse photo[0] at reduced opacity */}
          <div className="col-span-2 row-span-1 rounded-[20px] overflow-hidden relative group bg-surface-alt">
            {communityPhotos[0] && (
              <>
                <img src={communityPhotos[0].photo_url} alt="" className="w-full h-full object-cover opacity-60 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] group-hover:opacity-100 [filter:grayscale(20%)] group-hover:[filter:grayscale(0)]" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
              </>
            )}
          </div>

          {/* F: col-span-3 row-span-1 */}
          <div className="col-span-3 row-span-1 rounded-[20px] overflow-hidden relative group bg-surface-alt">
            {communityPhotos[1] && (
              <>
                <img src={communityPhotos[1].photo_url} alt="" className="w-full h-full object-cover opacity-60 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] group-hover:opacity-100 [filter:grayscale(20%)] group-hover:[filter:grayscale(0)]" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
              </>
            )}
          </div>

          {/* G: col-span-3 row-span-1 */}
          <div className="col-span-3 row-span-1 rounded-[20px] overflow-hidden relative group bg-surface-alt">
            {communityPhotos[2] && (
              <>
                <img src={communityPhotos[2].photo_url} alt="" className="w-full h-full object-cover opacity-60 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] group-hover:opacity-100 [filter:grayscale(20%)] group-hover:[filter:grayscale(0)]" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer className="bg-surface-alt border-t border-border pt-24 pb-12 px-6">
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
            © 2026 PhotoTracker Indonesia.
          </p>
        </div>
      </footer>
    </main>
  );
}
