'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Images, Plus, ArrowLeft, Calendar, Search, User, MoreVertical, Trash2, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/app/providers'

export default function GalleriesPage() {
  const [galleries, setGalleries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showMenu, setShowMenu] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('galleries')
          .select(
            `
            *,
            photos:photos(count),
            gallery_links:gallery_links(count)
          `,
          )
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setGalleries(data || [])
      } catch (err) {
        console.error('Error loading galleries:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  async function handleDelete(galleryId) {
    if (!confirm('Are you sure you want to delete this gallery?')) return
    
    try {
      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', galleryId)

      if (error) throw error
      setGalleries(galleries.filter(g => g.id !== galleryId))
    } catch (error) {
      console.error('Error deleting gallery:', error)
      alert('Failed to delete gallery')
    }
  }

  const getStatusClasses = (status) => {
    if (status === 'active') return 'bg-emerald-600/20 text-emerald-800 border border-emerald-600/30'
    if (status === 'expired') return 'bg-red-600/20 text-red-800 border border-red-600/30'
    return 'bg-black/5 text-black/70 border border-black/10'
  }

  const filtered = galleries.filter((g) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (g.title || '').toLowerCase().includes(q) ||
      (g.client_name || '').toLowerCase().includes(q)
    )
  })

  if (isLoading) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        {/* Background */}
        <div
          className="fixed inset-0"
          style={{
            backgroundImage: "url('/cover.webp')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="fixed inset-0 bg-[#F5F0EA]/70 mix-blend-soft-light" />
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.14] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
            backgroundSize: 'cover',
          }}
        />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-black/20 border-b-black/80 animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background cover - same as home page */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: "url('/cover.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Beige wash + grain */}
      <div className="fixed inset-0 bg-[#F5F0EA]/70 mix-blend-soft-light" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.14] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
            backgroundSize: 'cover',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-6 px-4 sm:px-6 max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className="inline-flex items-center justify-center px-4 py-2 border border-black/80 rounded-[999px] bg-black/5 backdrop-blur-sm">
              <span className="text-xs tracking-[0.18em] uppercase">
                ARTYDROP
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-4 text-xs">
            <Link href="/dashboard" className="text-black/80 hover:text-black">
              Dashboard
            </Link>
            <span className="hidden sm:inline text-black/60">{user?.email}</span>
          </div>
        </header>

        {/* Main Content */}
        <section className="flex-1 py-8 sm:py-12 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <Link href="/dashboard" className="inline-flex items-center gap-1 text-[11px] text-black/60 hover:text-black/80">
                <ArrowLeft className="w-3 h-3" />
                Back to dashboard
              </Link>
              <div>
                <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-black/60">
                  Your Galleries
                </p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-black/80">
                  All client deliveries
                </h1>
                <p className="mt-2 text-sm text-black/70 max-w-xl">
                  Every gallery you've created in this workspace, organized by date.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or client"
                  className="w-full h-9 rounded-full bg-white/60 backdrop-blur-sm border border-black/10 text-xs text-black placeholder-black/40 pl-9 pr-3 outline-none focus:border-black/30 transition-colors"
                />
              </div>
              <Link href="/dashboard/galleries/new">
                <Button className="h-9 px-4 text-xs flex items-center gap-2 bg-black text-white hover:bg-black/90 rounded-full">
                  <Plus className="w-4 h-4" />
                  New gallery
                </Button>
              </Link>
            </div>
          </div>

          {/* Empty state */}
          {galleries.length === 0 && (
            <div className="rounded-3xl border border-black/10 bg-[#FDF9F3]/90 shadow-sm p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto">
                  <Images className="w-8 h-8 text-black/40" />
                </div>
                <h2 className="text-xl font-semibold text-black/80">
                  No galleries yet
                </h2>
                <p className="text-sm text-black/70">
                  Create your first gallery to start delivering beautiful photo collections to your clients.
                </p>
                <div className="pt-2">
                  <Link href="/dashboard/galleries/new">
                    <Button className="h-9 rounded-full px-5 bg-black text-white hover:bg-black/90 text-xs font-medium flex items-center gap-2 mx-auto">
                      <Plus className="w-4 h-4" />
                      Create Your First Gallery
                    </Button>
                  </Link>
                </div>
                <p className="text-[11px] text-black/60">
                  Organize your deliveries by client, date or project.
                </p>
              </div>
            </div>
          )}

          {/* Gallery Grid */}
          {galleries.length > 0 && (
            <div className="space-y-4">
              {filtered.length === 0 && (
                <p className="text-xs text-black/50 mb-2">
                  No galleries match "{search}".
                </p>
              )}

              {filtered.map((g) => (
                <div
                  key={g.id}
                  className="group rounded-2xl border border-black/10 bg-[#FDF9F3]/90 hover:bg-[#FDF9F3] shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-4 sm:p-5 flex gap-4">
                    {/* Cover Image */}
                    <Link
                      href={`/dashboard/galleries/${g.id}`}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-black/5 overflow-hidden flex-shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity"
                    >
                      {g.cover_photo_url ? (
                        <img
                          src={g.cover_photo_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Images className="w-8 h-8 text-black/30" />
                      )}
                    </Link>

                    {/* Gallery Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/dashboard/galleries/${g.id}`}
                          className="flex-1 min-w-0"
                        >
                          <h3 className="text-sm sm:text-base font-semibold text-black/80 truncate hover:text-black transition-colors">
                            {g.title || 'Untitled gallery'}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-black/60">
                            {g.client_name && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {g.client_name}
                              </span>
                            )}
                            {g.client_name && g.event_date && (
                              <span className="text-black/30">•</span>
                            )}
                            {g.event_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(g.event_date), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </Link>

                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] px-2 py-0.5 ${getStatusClasses(g.status)}`}>
                            {g.status === 'active'
                              ? 'Active'
                              : g.status === 'draft'
                              ? 'Draft'
                              : g.status === 'expired'
                              ? 'Expired'
                              : 'Unknown'}
                          </Badge>

                          {/* Menu */}
                          <div className="relative">
                            <button
                              onClick={() => setShowMenu(showMenu === g.id ? null : g.id)}
                              className="p-1.5 rounded-full hover:bg-black/5 transition"
                            >
                              <MoreVertical className="w-4 h-4 text-black/60" />
                            </button>
                            
                            {showMenu === g.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setShowMenu(null)}
                                />
                                <div className="absolute right-0 mt-1 w-40 rounded-lg border border-black/10 bg-white shadow-lg py-1 z-20">
                                  <Link
                                    href={`/dashboard/galleries/${g.id}`}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-black/80 hover:bg-black/5"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Open
                                  </Link>
                                  <button
                                    onClick={() => {
                                      handleDelete(g.id)
                                      setShowMenu(null)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-black/50">
                        <span>
                          Created {format(new Date(g.created_at), 'MMM d, yyyy')}
                        </span>
                        {g.photos?.[0]?.count ? (
                          <>
                            <span className="text-black/30">•</span>
                            <span>{g.photos[0].count} photos</span>
                          </>
                        ) : null}
                        {g.gallery_links?.[0]?.count ? (
                          <>
                            <span className="text-black/30">•</span>
                            <span>{g.gallery_links[0].count} share link(s)</span>
                          </>
                        ) : (
                          <>
                            <span className="text-black/30">•</span>
                            <span>No share link yet</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="py-6 text-[11px] text-black/60 border-t border-black/10 bg-[#F5F0EA]/95 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            <span>© {new Date().getFullYear()} Artydrop</span>
            <div className="flex gap-4">
              <span>Terms</span>
              <span>Privacy</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
