'use client'

import Navbar from "@/components/Navbar";
import { Camera, Map as MapIcon, Users, Zap, ArrowRight, Compass, Star, ArrowUpRight } from "lucide-react";
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

export default function HomeClient({ spots, highlightUser, communityPhotos }: { spots: any[], highlightUser: any, communityPhotos: any[] }) {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-amber-primary selection:text-white overflow-hidden">
      <Navbar />

      {/* ─────────── HERO: SPLIT LAYOUT ─────────── */}
      <section className="relative pt-40 pb-32 px-6 md:px-12 noise min-h-[90vh] flex flex-col justify-center">
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
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 rounded-full bg-amber-primary animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-muted">Komunitas Fotografi Indonesia</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-[clamp(3.5rem,6vw,6.5rem)] font-display font-black leading-[1.05] tracking-tight text-foreground mb-8">
              TEMUKAN
              <br />
              <em className="font-serif italic font-light lowercase text-amber-primary pr-2">spot</em>
              <span className="text-foreground">TERBAIK.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-foreground/80 font-sans leading-relaxed max-w-md mb-10">
              Platform komunitas untuk menemukan dan membagikan lokasi foto tersembunyi. Dikurasi oleh sesama fotografer.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link href="/map" className="group px-8 py-4 bg-amber-primary text-white rounded-full font-bold text-sm flex items-center gap-2 hover:shadow-xl hover:shadow-amber-primary/25 hover:-translate-y-0.5 transition-all">
                <Compass className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                Mulai Eksplorasi
              </Link>
              <Link href="/add-spot" className="group px-8 py-4 bg-surface border border-border rounded-full font-bold text-sm flex items-center gap-2 hover:border-amber-primary/40 transition-all">
                Bagikan Spot
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-amber-primary transition-colors" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column (Photo Collage) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="lg:col-span-6 relative h-[600px] w-full mt-12 lg:mt-0"
          >
            {/* Collage Grid */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 gap-4">
              <div className="row-span-2 rounded-[32px] overflow-hidden shadow-2xl relative group">
                <img src={communityPhotos[0]?.photo_url || "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80"} alt="Collage 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="row-span-1 rounded-[32px] overflow-hidden shadow-xl relative group mt-12">
                <img src={communityPhotos[1]?.photo_url || "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&q=80"} alt="Collage 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="row-span-2 rounded-[32px] overflow-hidden shadow-2xl relative group">
                <img src={communityPhotos[2]?.photo_url || "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&q=80"} alt="Collage 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="row-span-1 rounded-[32px] overflow-hidden shadow-xl relative group -mt-12">
                <img src={communityPhotos[3]?.photo_url || "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=600&q=80"} alt="Collage 4" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────── SECTION 2: Spot Terpopuler ─────────── */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto border-t border-border/50">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-8">Jelajahi Spot Foto Terpopuler</h2>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {['Semua', 'Alam & Lanskap', 'Arsitektur', 'Jalanan', 'Malam Hari'].map((tag, i) => (
              <button key={tag} className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${i === 0 ? 'bg-foreground text-background' : 'bg-surface border border-border hover:border-amber-primary/40 text-muted hover:text-foreground'}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {spots.map((spot, i) => (
            <Link href={`/spot/${spot.id}`} key={spot.id} className="group cursor-pointer">
              <div className="w-full aspect-[4/5] rounded-[32px] overflow-hidden mb-5 relative">
                <img src={spot.spot_photos?.[0]?.photo_url || 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80'} alt={spot.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 right-4 w-10 h-10 bg-background/80 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-5 h-5 text-foreground" />
                </div>
              </div>
              <h3 className="font-display font-bold text-xl mb-1 group-hover:text-amber-primary transition-colors">{spot.name}</h3>
              <p className="text-muted text-sm flex items-center gap-1.5">
                <MapIcon className="w-3.5 h-3.5" />
                {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
              </p>
            </Link>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <Link href="/map" className="inline-flex items-center gap-2 text-amber-primary font-bold hover:underline">
            Lihat semua spot di peta <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─────────── SECTION 4: Sorotan Komunitas ─────────── */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Sorotan Komunitas</h2>
          <p className="text-muted max-w-xl mx-auto leading-relaxed">Karya-karya terbaik dari anggota komunitas PhotoTracker minggu ini. Tunjukkan hasil jepretanmu dan jadilah inspirasi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* Large Left Card */}
          <div className="md:col-span-5 aspect-[3/4] md:aspect-auto md:h-full rounded-[32px] overflow-hidden relative group min-h-[500px]">
            <img src={highlightUser?.avatar_url || "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80"} alt="Resort" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <span className="text-white/80 text-xs font-mono tracking-widest uppercase mb-2 block">Top Kontributor</span>
              <h3 className="text-white font-display font-bold text-3xl">{highlightUser?.full_name || 'Nyoman Sudarsana'}</h3>
            </div>
          </div>
          
          {/* Small Grid Right */}
          <div className="md:col-span-7 grid grid-cols-2 gap-4 md:gap-6">
            {communityPhotos.slice(0, 4).map((photo, i) => (
              <div key={photo.id || i} className="aspect-square rounded-[32px] overflow-hidden relative group">
                <img src={photo.photo_url} alt="Community Photo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
            ))}
          </div>
        </div>
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
            <h4 className="font-bold mb-6 tracking-wide text-foreground">Eksplorasi</h4>
            <ul className="space-y-4 text-sm text-muted font-medium">
              <li><Link href="/" className="hover:text-amber-primary transition-colors">Beranda</Link></li>
              <li><Link href="/map" className="hover:text-amber-primary transition-colors">Peta Spot Interaktif</Link></li>
              <li><Link href="/spots" className="hover:text-amber-primary transition-colors">Direktori Lokasi</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 tracking-wide text-foreground">Aktivitas</h4>
            <ul className="space-y-4 text-sm text-muted font-medium">
              <li><Link href="/profile" className="hover:text-amber-primary transition-colors">Profil Saya</Link></li>
              <li><Link href="/add-spot" className="hover:text-amber-primary transition-colors">Bagikan Spot Baru</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            © 2026 PhotoTracker Indonesia. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-muted hover:text-foreground transition-colors"><span className="sr-only">Instagram</span>IG</Link>
            <Link href="#" className="text-muted hover:text-foreground transition-colors"><span className="sr-only">Twitter</span>TW</Link>
            <Link href="#" className="text-muted hover:text-foreground transition-colors"><span className="sr-only">YouTube</span>YT</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
