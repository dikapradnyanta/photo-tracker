'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ChevronRight, Search, Users, X, Loader2 } from 'lucide-react'
import { useEffect, useState, useCallback, useRef } from 'react'

type Contributor = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  spot_count: number
  photo_count: number
}

function getLevel(spotCount: number) {
  if (spotCount >= 20) return 'Pro'
  if (spotCount >= 5) return 'Enthusiast'
  return 'Pemula'
}

export default function CommunityPage() {
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [filtered, setFiltered] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Fetch contributors — try RPC first, fallback to direct query ────────────
  useEffect(() => {
    async function fetchContributors() {
      setLoading(true)

      // 1. Try the RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_top_contributors', { limit_count: 50 })

      if (!rpcError && rpcData && rpcData.length > 0) {
        setContributors(rpcData as Contributor[])
        setFiltered(rpcData as Contributor[])
        setLoading(false)
        return
      }

      // 2. Fallback: build leaderboard manually from raw tables
      const { data: users } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .not('username', 'is', null)
        .order('created_at', { ascending: true })

      if (!users || users.length === 0) {
        setLoading(false)
        return
      }

      const { data: spots } = await supabase
        .from('spots')
        .select('id, added_by')

      const { data: photos } = await supabase
        .from('spot_photos')
        .select('id, user_id')

      const spotsByUser: Record<string, number> = {}
      const photosByUser: Record<string, number> = {}

      spots?.forEach(s => {
        if (s.added_by) spotsByUser[s.added_by] = (spotsByUser[s.added_by] || 0) + 1
      })
      photos?.forEach(p => {
        if (p.user_id) photosByUser[p.user_id] = (photosByUser[p.user_id] || 0) + 1
      })

      const result: Contributor[] = users.map(u => ({
        id: u.id,
        username: u.username!,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        spot_count: spotsByUser[u.id] || 0,
        photo_count: photosByUser[u.id] || 0,
      }))

      result.sort((a, b) => b.spot_count - a.spot_count || b.photo_count - a.photo_count)

      setContributors(result)
      setFiltered(result)
      setLoading(false)
    }

    fetchContributors()
  }, [])

  // ── Client-side search filter ────────────────────────────────────────────────
  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)
      if (!value.trim()) {
        setFiltered(contributors)
        return
      }
      const q = value.toLowerCase().replace(/^@/, '')
      setFiltered(
        contributors.filter(
          c =>
            c.username?.toLowerCase().includes(q) ||
            c.full_name?.toLowerCase().includes(q)
        )
      )
    },
    [contributors]
  )

  const clearSearch = () => {
    setQuery('')
    setFiltered(contributors)
    inputRef.current?.focus()
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />

      <div className="pt-[var(--nav-height)] pb-12 px-6">
        <div className="max-w-3xl mx-auto mt-12">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="mb-10">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-amber-primary mb-3 block">
              Top Kontributor
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight mb-4">
              Komunitas
            </h1>
            <p className="text-muted italic font-serif text-lg border-l-2 border-amber-primary pl-4">
              "Fotografer paling aktif di PhotoTracker"
            </p>
          </div>

          {/* ── Search Bar ───────────────────────────────────────────────── */}
          <div className="mb-8">
            <div
              className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 ${
                focused
                  ? 'border-amber-primary bg-surface shadow-lg shadow-amber-primary/10'
                  : 'border-border bg-surface-alt hover:border-amber-primary/40'
              }`}
            >
              <Search
                className={`w-5 h-5 shrink-0 transition-colors duration-300 ${
                  focused ? 'text-amber-primary' : 'text-muted'
                }`}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Cari username atau nama fotografer..."
                className="flex-1 bg-transparent text-sm font-medium placeholder:text-muted/50 outline-none"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="p-1 rounded-full hover:bg-surface text-muted hover:text-foreground transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-2 mt-3 ml-1">
              <Users className="w-3.5 h-3.5 text-muted" />
              <span className="text-[11px] font-mono text-muted tracking-widest">
                {loading
                  ? 'Memuat data...'
                  : query
                  ? `${filtered.length} hasil untuk "${query}"`
                  : `${contributors.length} fotografer terdaftar`}
              </span>
            </div>
          </div>

          {/* ── List ─────────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-amber-primary" />
              <p className="text-sm font-mono text-muted tracking-widest uppercase">Memuat komunitas...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(contributor => {
                const rank = contributors.findIndex(c => c.id === contributor.id) + 1
                const isTop3 = rank <= 3
                const level = getLevel(contributor.spot_count)

                let rankStyle = 'text-muted text-base'
                if (rank === 1) rankStyle = 'text-amber-primary text-2xl'
                else if (rank === 2) rankStyle = 'text-slate-400 text-xl'
                else if (rank === 3) rankStyle = 'text-amber-700 text-xl'

                return (
                  <Link
                    key={contributor.id}
                    href={`/profile/${contributor.username}`}
                    className={`group flex items-center p-4 rounded-2xl transition-all ${
                      isTop3
                        ? 'bg-surface border border-border shadow-sm hover:border-amber-primary/40'
                        : 'bg-transparent hover:bg-surface-alt border border-transparent'
                    } ${rank === 1 ? 'ring-1 ring-amber-primary/10' : ''}`}
                  >
                    <div className={`w-12 text-center font-display font-bold ${rankStyle}`}>
                      #{rank}
                    </div>

                    <div className="w-12 h-12 rounded-[16px] overflow-hidden bg-amber-primary/10 flex items-center justify-center shrink-0 border border-border">
                      {contributor.avatar_url ? (
                        <img
                          src={contributor.avatar_url}
                          alt={contributor.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-amber-primary text-lg uppercase">
                          {contributor.full_name?.charAt(0) || contributor.username?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>

                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold truncate text-base">
                          {contributor.full_name || contributor.username}
                        </p>
                        <span className="px-2 py-0.5 bg-surface-alt border border-border text-[9px] font-mono font-bold rounded-full uppercase tracking-widest text-muted">
                          {level}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted truncate">@{contributor.username}</p>
                    </div>

                    {/* Desktop stats */}
                    <div className="text-right mr-4 hidden md:block">
                      <p className="text-xs font-mono text-muted tracking-widest uppercase">
                        <span className="font-bold text-foreground">{contributor.spot_count}</span> spot ·{' '}
                        <span className="font-bold text-foreground">{contributor.photo_count}</span> foto
                      </p>
                    </div>

                    {/* Mobile stats */}
                    <div className="md:hidden text-right mr-2 flex flex-col items-end">
                      <span className="text-[10px] font-mono text-foreground font-bold">
                        {contributor.spot_count} <span className="text-muted font-normal">S</span>
                      </span>
                      <span className="text-[10px] font-mono text-foreground font-bold">
                        {contributor.photo_count} <span className="text-muted font-normal">F</span>
                      </span>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted opacity-0 group-hover:opacity-100 group-hover:text-amber-primary transition-all transform group-hover:translate-x-1" />
                  </Link>
                )
              })}

              {/* Empty state */}
              {filtered.length === 0 && !loading && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-surface-alt border border-border flex items-center justify-center mx-auto mb-6">
                    <Search className="w-7 h-7 text-muted/40" />
                  </div>
                  <p className="font-bold text-lg mb-2">Tidak ada hasil</p>
                  <p className="text-muted text-sm mb-6">
                    Tidak ada fotografer dengan username atau nama &quot;{query}&quot;
                  </p>
                  <button
                    onClick={clearSearch}
                    className="px-6 py-2.5 border border-border rounded-xl text-xs font-bold hover:border-amber-primary transition-all"
                  >
                    Reset Pencarian
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
