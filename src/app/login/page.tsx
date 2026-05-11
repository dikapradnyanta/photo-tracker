'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, Mail, Lock, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
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
        if (error) throw error
        setSuccess('Berhasil terdaftar! Silakan cek email Anda untuk verifikasi.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/profile')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-sand/20 -skew-x-12 translate-x-1/4 -z-10" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-primary/5 rounded-full blur-3xl -z-10" />
      
      <div className="max-w-md w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-amber-primary transition-colors mb-10 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>

          <div className="glass p-8 md:p-12 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/40 backdrop-blur-2xl">
            <div className="text-center mb-10">
              <motion.div 
                layoutId="logo"
                className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-obsidian text-paper mb-6 shadow-xl shadow-obsidian/20"
              >
                <Camera className="w-10 h-10 text-amber-primary" />
              </motion.div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? 'signup' : 'login'}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-4xl font-display font-bold tracking-tight">
                    {isSignUp ? 'Buat Akun' : 'Masuk'}
                  </h1>
                  <p className="text-muted mt-3 font-medium">
                    {isSignUp ? 'Mulai petualangan visualmu.' : 'Siapkan kameramu, mari berburu.'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted/80 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-amber-primary" />
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com"
                    className="w-full pl-14 pr-5 py-5 bg-white/50 border border-border/60 rounded-3xl focus:outline-none focus:border-amber-primary focus:bg-white focus:ring-4 focus:ring-amber-primary/5 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted/80">Password</label>
                  {!isSignUp && (
                    <button type="button" className="text-[10px] font-bold text-amber-primary uppercase tracking-wider hover:underline">Lupa?</button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-amber-primary" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-14 pr-5 py-5 bg-white/50 border border-border/60 rounded-3xl focus:outline-none focus:border-amber-primary focus:bg-white focus:ring-4 focus:ring-amber-primary/5 transition-all"
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
                    className="flex items-start gap-2 p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="font-medium">{error}</p>
                  </motion.div>
                )}
                
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 p-4 bg-emerald-50 text-emerald-600 text-sm rounded-2xl border border-emerald-100"
                  >
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="font-medium">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-obsidian text-paper rounded-3xl font-display font-bold text-lg hover:bg-amber-primary hover:shadow-2xl hover:shadow-amber-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 relative overflow-hidden group"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Daftar Sekarang' : 'Masuk ke Aplikasi'}</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ArrowLeft className="w-5 h-5 rotate-180" />
                    </motion.div>
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="group inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors"
              >
                {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}
                <span className="text-amber-primary group-hover:underline">
                  {isSignUp ? 'Masuk' : 'Daftar Gratis'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
