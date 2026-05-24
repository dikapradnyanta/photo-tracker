'use client'

import Navbar from "@/components/Navbar";
import { Camera, Map as MapIcon, Users, Zap, ArrowRight, Compass, Star, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
}
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-amber-primary selection:text-white overflow-hidden">
      <Navbar />
      
      {/* ─────────── HERO ─────────── */}
      <section className="relative pt-40 pb-32 px-6 md:px-12 noise">
        {/* Grid background */}
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none -z-10" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-background -z-10" />
        
        {/* Decorative accent blob */}
        <div className="absolute top-[15%] right-[5%] w-[500px] h-[500px] rounded-full bg-amber-primary/8 blur-[100px] -z-10" />

        <motion.div 
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
            <div className="w-2 h-2 rounded-full bg-amber-primary animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-muted">Komunitas Fotografi Indonesia</span>
          </motion.div>

          {/* Main heading — editorial split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0">
            <motion.div variants={fadeUp} className="lg:col-span-8">
              <h1 className="text-[clamp(3rem,8vw,7.5rem)] font-display font-bold leading-[0.92] tracking-[-0.03em]">
                Temukan
                <br />
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-primary via-[#FF8A50] to-amber-primary">
                    Spot Terbaik
                  </span>
                  {/* Underline accent */}
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none">
                    <path d="M2 8C60 3 140 2 200 5C260 8 340 10 398 4" stroke="#E8692A" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
                  </svg>
                </span>
                <span className="text-muted/30">.</span>
              </h1>
            </motion.div>

            {/* Right side — description + CTA */}
            <motion.div variants={fadeUp} className="lg:col-span-4 flex flex-col justify-end pb-4">
              <p className="text-base md:text-lg text-muted leading-relaxed mb-8 max-w-sm">
                Platform komunitas untuk menemukan dan membagikan lokasi foto tersembunyi. Dikurasi oleh sesama fotografer.
              </p>
              <div className="flex gap-3">
                <Link href="/map" className="group px-6 py-3.5 bg-amber-primary text-white rounded-full font-semibold text-sm flex items-center gap-2 hover:shadow-xl hover:shadow-amber-primary/25 hover:-translate-y-0.5 transition-all">
                  <Compass className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                  Mulai Eksplorasi
                </Link>
                <Link href="/add-spot" className="group px-6 py-3.5 bg-surface border border-black/8 dark:border-white/8 rounded-full font-semibold text-sm flex items-center gap-2 hover:border-amber-primary/40 transition-all">
                  Bagikan Spot
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted group-hover:text-amber-primary transition-colors" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Photo showcase strip */}
          <motion.div 
            variants={fadeUp}
            className="mt-20 grid grid-cols-3 md:grid-cols-5 gap-3"
          >
            {[
              { src: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80', label: 'Tegalalang' },
              { src: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&q=80', label: 'Ulun Danu' },
              { src: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&q=80', label: 'Tanah Lot' },
              { src: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=600&q=80', label: 'Kuta' },
              { src: 'https://images.unsplash.com/photo-1518609204015-8d5460f38446?w=600&q=80', label: 'Ubud' },
            ].map((photo, i) => (
              <motion.div
                key={photo.label}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`relative overflow-hidden rounded-2xl group cursor-pointer ${
                  i === 0 ? 'aspect-[3/4] row-span-2 hidden md:block' :
                  i === 4 ? 'aspect-[3/4] hidden md:block' :
                  'aspect-square'
                }`}
              >
                <img src={photo.src} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-3 left-3 text-[10px] font-mono font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  {photo.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─────────── STATS TICKER ─────────── */}
      <section className="py-10 border-y border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {[
            { num: '200+', label: 'Spot Foto' },
            { num: '3.2k', label: 'Fotografer' },
            { num: '850+', label: 'Review' },
            { num: '4.8', label: 'Rating Rata-rata' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-display font-bold tracking-tight">{stat.num}</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─────────── BENTO FEATURES ─────────── */}
      <section className="py-28 px-6 md:px-12 relative noise">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-amber-primary mb-4 block">Fitur Unggulan</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight max-w-xl">
              Semua yang kamu butuhkan untuk <em className="text-amber-primary not-italic">hunting</em> sukses.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[260px]">
            {/* Large — Map */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-4 rounded-3xl bg-surface border border-black/6 dark:border-white/6 p-8 relative overflow-hidden group"
            >
              <div className="absolute inset-0 grid-pattern opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-primary/8 rounded-full blur-[80px] group-hover:blur-[60px] transition-all" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-primary/10 border border-amber-primary/20 flex items-center justify-center">
                  <MapIcon className="w-6 h-6 text-amber-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold mb-2">Peta Interaktif</h3>
                  <p className="text-sm text-muted leading-relaxed max-w-sm">
                    Jelajahi spot foto dengan koordinat akurat. Preview foto, rute navigasi, dan detail waktu terbaik dalam satu tampilan.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Small — DNA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 rounded-3xl bg-surface border border-black/6 dark:border-white/6 p-7 flex flex-col justify-between group hover:border-amber-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-forest/10 border border-forest/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-forest" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1.5">DNA Fotografis</h3>
                <p className="text-xs text-muted leading-relaxed">Golden hour, blue hour, aksesibilitas, dan rekomendasi gear.</p>
              </div>
            </motion.div>

            {/* Small — Community */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 rounded-3xl bg-surface border border-black/6 dark:border-white/6 p-7 flex flex-col justify-between group hover:border-amber-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1.5">Komunitas Aktif</h3>
                <p className="text-xs text-muted leading-relaxed">Review jujur dan update kondisi terkini dari sesama fotografer.</p>
              </div>
            </motion.div>

            {/* Medium — Portfolio */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="md:col-span-4 rounded-3xl bg-surface border border-black/6 dark:border-white/6 p-8 relative overflow-hidden group flex items-center gap-8"
            >
              <div className="flex-1 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-obsidian text-paper dark:bg-paper dark:text-obsidian flex items-center justify-center mb-6">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">Portfolio Pribadi</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Bangun reputasimu. Pamerkan hasil jepretan di setiap spot dan jadilah kontributor top.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                {[
                  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&q=80',
                  'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=300&q=80',
                ].map((src, i) => (
                  <div key={i} className={`w-28 h-36 rounded-xl overflow-hidden border border-white/10 shadow-lg ${i === 1 ? 'translate-y-4' : ''}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─────────── CTA ─────────── */}
      <section className="py-28 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative"
        >
          <div className="rounded-[40px] bg-obsidian text-paper dark:bg-surface-alt dark:border dark:border-white/8 p-14 md:p-20 relative overflow-hidden noise">
            <div className="absolute inset-0 grid-pattern opacity-10" />
            <div className="absolute top-[-30%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] bg-amber-primary/15 rounded-full blur-[100px]" />
            <div className="relative z-10">
              <Star className="w-8 h-8 text-amber-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">Siap untuk Memotret?</h2>
              <p className="text-paper/60 dark:text-muted mb-10 max-w-md mx-auto">
                Bergabung dengan komunitas fotografer Indonesia. Temukan spot pertamamu hari ini.
              </p>
              <Link href="/login" className="inline-flex items-center gap-3 px-8 py-4 bg-amber-primary text-white rounded-full font-bold hover:scale-105 hover:shadow-xl hover:shadow-amber-primary/30 transition-all group">
                Daftar Sekarang — Gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer className="py-12 px-6 border-t border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-primary" />
            <span className="font-display font-bold text-lg tracking-tight">PhotoTracker</span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">
            © 2026 · Dibuat dengan ❤️ untuk Fotografer
          </p>
        </div>
      </footer>
    </main>
  );
}
