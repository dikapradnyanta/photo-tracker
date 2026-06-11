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
      ? `Gagal membuat akun: ${rawMessage}`
      : `Gagal masuk: ${rawMessage}`
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: email.split('@')[0],
            },
            emailRedirectTo: `${window.location.origin}/onboarding`,
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

        // Supabase mengembalikan user dengan identities kosong jika email sudah terdaftar
        // (ketika Confirm Email aktif untuk mencegah email enumeration)
        if (data?.user?.identities && data.user.identities.length === 0) {
          setIsSignUp(false)
          setSuccess('Email ini sudah terdaftar 👋 Silakan masuk dengan password-mu.')
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

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Masukkan email-mu dulu sebelum reset password.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile`,
    })
    if (error) {
      setError('Gagal mengirim email reset. Periksa alamat email-mu.')
    } else {
      setSuccess('Email reset password sudah dikirim! Cek kotak masukmu.')
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      }
    })
    
    if (error) {
      setError(toFriendlyError(error.message, 'login'))
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
            <img src="/logo.svg" alt="PhotoTracker Logo" className="w-8 h-8 object-contain group-hover:scale-105 transition-transform dark:hidden" />
            <img src="/logo-light.svg" alt="PhotoTracker Logo" className="w-8 h-8 object-contain group-hover:scale-105 transition-transform hidden dark:block" />
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
                    <button type="button" onClick={handleForgotPassword} className="text-[10px] font-bold text-amber-primary uppercase tracking-wider hover:underline">Lupa?</button>
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

            <div className="mt-6 flex items-center justify-between">
              <span className="w-1/5 border-b border-muted/30"></span>
              <span className="text-xs text-muted font-bold uppercase tracking-widest">Atau</span>
              <span className="w-1/5 border-b border-muted/30"></span>
            </div>

            <div className="mt-6">
              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                type="button"
                className="w-full py-4 bg-background border-2 border-border text-foreground rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-muted/10 hover:-translate-y-0.5 transition-all group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Lanjutkan dengan Google</span>
              </button>
            </div>

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
