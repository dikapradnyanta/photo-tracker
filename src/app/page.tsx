import Navbar from "@/components/Navbar";
import { Camera, Map as MapIcon, Users, Zap, PlusCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />
      
      {/* Hero Section - Matching Brief Typography */}
      <section className="relative pt-32 pb-40 px-6 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative z-10">
            <div className="inline-block px-3 py-1 rounded-md bg-amber-primary/10 border border-amber-primary/20 text-amber-primary text-[10px] font-mono font-bold tracking-[0.2em] mb-8">
              SPOT_ID: BALI_001
            </div>
            <h1 className="text-6xl md:text-[84px] font-display font-bold leading-[0.9] tracking-tighter mb-8">
              Find your<br />
              <span className="text-amber-primary italic">perfect spot.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-lg mb-12 leading-relaxed">
              Temukan lokasi foto terbaik di sekitarmu — dikurasi oleh sesama fotografer yang sudah pernah ke sana.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/add-spot" className="btn-primary flex items-center justify-center gap-2 group">
                <PlusCircle className="w-4 h-4" />
                Tambah Spot
              </Link>
              <Link href="/map" className="btn-primary bg-transparent text-foreground border-muted/30 hover:border-amber-primary flex items-center justify-center gap-2 transition-all">
                <MapIcon className="w-4 h-4" />
                Lihat Peta
              </Link>
              <Link href="/map" className="flex items-center justify-center gap-2 text-sm font-bold hover:text-amber-primary transition-all group">
                Lihat semua
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          
          <div className="relative h-[600px] card-radius bg-sand/20 overflow-hidden group">
            {/* Spot Card Preview from Brief */}
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent z-10" />
            <div className="absolute inset-0 flex items-center justify-center -z-10 bg-forest/10">
              <Camera className="w-32 h-32 text-muted/20 rotate-12 group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="absolute bottom-10 left-10 right-10 z-20">
              <h3 className="text-3xl font-display font-bold text-white mb-2">Bukit Campuhan</h3>
              <p className="text-white/60 text-sm flex items-center gap-2 mb-6">
                <MapPin className="w-3 h-3" /> Ubud, Bali · 2.3 km
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-amber-primary text-white text-[10px] font-mono font-bold rounded-full">LANDSCAPE</span>
                <span className="px-3 py-1 bg-forest text-white text-[10px] font-mono font-bold rounded-full">SUNRISE</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 -right-64 w-[600px] h-[600px] bg-amber-primary/5 rounded-full blur-[120px] -z-10" />
      </section>

      {/* Badges Preview Section */}
      <section className="py-20 px-6 md:px-12 border-y border-border/5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-4">
          {['Landscape', 'Golden Hour', 'Mudah', 'Street', 'Blue Hour', 'Sunrise'].map((badge) => (
            <span key={badge} className="px-4 py-2 bg-muted/5 border border-muted/10 text-muted text-xs font-bold rounded-full hover:border-amber-primary hover:text-amber-primary cursor-default transition-all">
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* Features - Matching UI Components Section */}
      <section className="py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <FeatureItem 
            icon={<MapIcon className="w-6 h-6" />}
            title="Spot Map"
            description="Peta interaktif dengan pin spot foto yang dikurasi komunitas lengkap dengan koordinat presisi."
          />
          <FeatureItem 
            icon={<Zap className="w-6 h-6" />}
            title="DNA Fotografis"
            description="Tahu kapan waktu terbaik berkunjung, tingkat kesulitan akses, dan gear yang disarankan."
          />
          <FeatureItem 
            icon={<Users className="w-6 h-6" />}
            title="Komunitas"
            description="Saling berbagi review jujur dan update kondisi spot secara real-time dari sesama fotografer."
          />
        </div>
      </section>

      <footer className="py-20 px-6 md:px-12 border-t border-border/5 text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted">
          © 2026 PhotoTracker · Minimal & Timeless
        </p>
      </footer>
    </main>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="space-y-6 group">
      <div className="w-12 h-12 rounded-xl bg-muted/5 border border-muted/10 flex items-center justify-center group-hover:border-amber-primary group-hover:text-amber-primary transition-all">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold tracking-tight">{title}</h3>
      <p className="text-muted leading-relaxed text-sm">{description}</p>
    </div>
  );
}

function MapPin({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
