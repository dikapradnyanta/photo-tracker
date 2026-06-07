'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, Mail, Lock, Loader2, ArrowLeft, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Clear status when switching
    setError(null)
    setSuccess(null)
  }, [isSignUp])

  // ── Terjemahkan error teknis Supabase ke bahasa yang ramah ──────────────
  const toFriendlyError = (rawMessage: string, mode: 'login' | 'signup'): string => {
    const msg = rawMessage.toLowerCase()

    if (msg.includes('user already registered') || msg.includes('already been registered')) {
      return '__ALREADY_REGISTERED__'
    }
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return 'Email atau password salah. Pastikan keduanya sudah benar.'
    }
    if (msg.includes('email not confirmed')) {
      return 'Akun belum dikonfirmasi. Cek kotak masuk emailmu dan klik tautan verifikasi.'
    }
    if (msg.includes('password should be at least') || msg.includes('password must be')) {
      return 'Password terlalu pendek. Gunakan minimal 6 karakter.'
    }
    if (msg.includes('unable to validate email') || msg.includes('invalid format')) {
      return 'Format email tidak valid. Contoh: nama@email.com'
    }
    if (msg.includes('signup is disabled')) {
      return 'Pendaftaran sementara tidak tersedia. Coba lagi nanti.'
    }
    if (msg.includes('too many requests') || msg.includes('rate limit')) {
      return 'Terlalu banyak percobaan. Tunggu sebentar sebelum coba lagi.'
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Gagal terhubung ke server. Periksa koneksi internetmu.'
    }
    if (msg.includes('weak password')) {
      return 'Password terlalu lemah. Gunakan kombinasi huruf dan angka.'
    }
    // Fallback generic
    return mode === 'signup'
      ? 'Gagal membuat akun. Coba lagi atau hubungi dukungan.'
      : 'Gagal masuk. Periksa email dan password-mu.'
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: email.split('@')[0],
            }
          }
        })
        if (error) {
          const friendly = toFriendlyError(error.message, 'signup')
          if (friendly === '__ALREADY_REGISTERED__') {
            // Auto-switch ke tab login dengan pesan ramah
            setIsSignUp(false)
            setSuccess('Email ini sudah terdaftar 👋 Silakan masuk dengan password-mu.')
          } else {
            setError(friendly)
          }
          return
        }
        setSuccess('Akun berhasil dibuat! Cek kotak masuk emailmu untuk konfirmasi sebelum masuk.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          setError(toFriendlyError(error.message, 'login'))
          return
        }
        
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single()

        if (profile?.onboarding_completed === true) {
          router.push('/profile')
        } else {
          router.push('/onboarding')
        }
      }
    } catch (err: any) {
      const friendly = toFriendlyError(err?.message || '', isSignUp ? 'signup' : 'login')
      if (friendly === '__ALREADY_REGISTERED__') {
        setIsSignUp(false)
        setSuccess('Email ini sudah terdaftar 👋 Silakan masuk dengan password-mu.')
      } else {
        setError(friendly)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex relative overflow-hidden">
      {/* Left Panel — Decorative */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden noise">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-primary/20 via-transparent to-forest/10" />
        <img 
          src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80" 
          alt="Photography" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
        />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2 group">
            <Camera className="w-6 h-6 text-amber-primary" />
            <span className="text-xl font-display font-bold tracking-tight">
              Photo<span className="text-amber-primary italic">Tracker</span>
            </span>
          </Link>
          
          <div>
            <blockquote className="text-4xl font-display font-bold leading-tight tracking-tight mb-6 max-w-md">
              "Setiap spot punya ceritanya sendiri."
            </blockquote>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-bold">Dika Pradnyanta</p>
                <p className="text-xs text-muted">Founder · PhotoTracker</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        {/* Mobile back */}
        <Link href="/" className="absolute top-6 left-6 lg:hidden inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-amber-primary transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali
        </Link>

        <div className="max-w-sm w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Desktop back */}
            <Link href="/" className="hidden lg:inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-amber-primary transition-colors mb-12 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Beranda
            </Link>

            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? 'signup' : 'login'}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="mb-10"
              >
                <h1 className="text-4xl font-display font-bold tracking-tight mb-2">
                  {isSignUp ? 'Buat Akun' : 'Masuk'}
                </h1>
                <p className="text-muted text-sm">
                  {isSignUp ? 'Mulai petualangan visual-mu.' : 'Siapkan kameramu, mari berburu.'}
                </p>
              </motion.div>
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted transition-colors group-focus-within:text-amber-primary" />
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com"
                    className="input-base pl-12 pr-4 py-4 rounded-2xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end px-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">Password</label>
                  {!isSignUp && (
                    <button type="button" className="text-[10px] font-bold text-amber-primary uppercase tracking-wider hover:underline">Lupa?</button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted transition-colors group-focus-within:text-amber-primary" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="input-base pl-12 pr-4 py-4 rounded-2xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 p-3.5 alert-error text-sm rounded-xl border"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="font-medium text-xs">{error}</p>
                  </motion.div>
                )}
                
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 p-3.5 alert-success text-sm rounded-xl border"
                  >
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="font-medium text-xs">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-foreground text-background rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-amber-primary hover:text-white hover:shadow-xl hover:shadow-amber-primary/20 hover:-translate-y-0.5 transition-all group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Daftar Sekarang' : 'Masuk ke Aplikasi'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="group inline-flex items-center gap-2 text-sm text-muted"
              >
                {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}
                <span className="font-bold text-amber-primary group-hover:underline">
                  {isSignUp ? 'Masuk' : 'Daftar Gratis'}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
