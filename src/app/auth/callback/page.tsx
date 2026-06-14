'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, Camera } from 'lucide-react'

/**
 * /auth/callback
 * 
 * Halaman ini dipanggil setelah OAuth (Google) selesai.
 * Supabase akan menyertakan `code` di URL, lalu kita exchange
 * code tersebut menjadi session, cek status onboarding, lalu
 * redirect ke halaman yang tepat.
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase JS v2 otomatis mendeteksi code/hash dari URL
        // dan menukar code menjadi session via PKCE atau implicit flow.
        // Kita cukup tunggu session tersedia.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (!session) {
          // Mungkin perlu waktu sebentar, coba sekali lagi
          await new Promise(resolve => setTimeout(resolve, 1500))
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession()
          if (retryError || !retrySession) {
            throw new Error('Sesi tidak ditemukan setelah login. Coba lagi.')
          }
        }

        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (!currentSession) {
          throw new Error('Gagal mendapatkan sesi. Silakan coba login ulang.')
        }

        // Cek apakah user sudah pernah onboarding
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', currentSession.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 = row not found (user baru belum ada di tabel users)
          throw profileError
        }

        if (profile?.onboarding_completed === true) {
          // Sudah onboarding → langsung ke halaman utama
          router.replace('/map')
        } else {
          // Belum onboarding → ke halaman onboarding
          router.replace('/onboarding')
        }
      } catch (err: any) {
        console.error('[Auth Callback] Error:', err)
        setErrorMsg(err?.message || 'Terjadi kesalahan saat memproses login.')
        setStatus('error')
      }
    }

    handleCallback()
  }, [router])

  if (status === 'error') {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-6 p-6">
        <div className="panel glass p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-display font-bold">Login Gagal</h1>
          <p className="text-sm text-muted">{errorMsg}</p>
          <button
            onClick={() => router.replace('/login')}
            className="w-full py-3 bg-amber-primary text-white rounded-2xl font-bold text-sm hover:shadow-xl hover:shadow-amber-primary/20 transition-all"
          >
            Kembali ke Halaman Login
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-5">
        {/* Logo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-[28px] bg-amber-primary/10 border border-amber-primary/20 flex items-center justify-center">
            <Camera className="w-7 h-7 text-amber-primary" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-amber-primary rounded-lg flex items-center justify-center shadow-lg">
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <p className="font-display font-bold text-lg">Memproses Login...</p>
          <p className="text-sm text-muted">Sebentar, kami sedang menyiapkan akunmu.</p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-1.5 pt-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-amber-primary/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
