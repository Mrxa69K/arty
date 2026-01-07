'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Images, Plus, ArrowLeft, Calendar, Search } from 'lucide-react'
import { format } from 'date-fns'

export default function GalleriesPage() {
  const [galleries, setGalleries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  const getStatusClasses = (status) => {
    if (status === 'active') return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
    if (status === 'expired') return 'bg-red-500/10 text-red-300 border border-red-500/30'
    return 'bg-white/5 text-white/70 border border-white/10'
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-b-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[80vh]">
      {/* Header */}
      <div className="py-4 md:py-6 border-b border-white/5 mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2 text-[11px] text-white/50">
            <Link href="/dashboard" className="inline-flex items-center gap-1 hover:text-white/80">
              <ArrowLeft className="w-3 h-3" />
              Back to overview
            </Link>
          </div>
          <div className="space-y-2">
            <h1
              className="text-2xl md:text-3xl font-semibold tracking-tight"
              style={{ fontFamily: '"Josefin Sans", system-ui, sans-serif' }}
            >
              All galleries
            </h1>
            <p className="text-sm text-white/60">
              Every client delivery you’ve created in this workspace.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:items-end w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or client"
              className="w-full h-9 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 pl-9 pr-3 outline-none focus:border-[#7C3AED] transition-colors"
            />
          </div>
          <Link href="/dashboard/galleries/new">
            <Button className="h-9 px-4 text-xs flex items-center gap-2 bg-white text-black hover:bg-white/90">
              <Plus className="w-4 h-4" />
              New gallery
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {galleries.length === 0 && (
        <Card className="border border-white/10 bg-white/[0.02]">
          <CardContent className="px-6 py-10 md:px-8 md:py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-md">
              <h2
                className="text-xl md:text-2xl font-semibold tracking-tight"
                style={{ fontFamily: '"Josefin Sans", system-ui, sans-serif' }}
              >
                No galleries yet.
              </h2>
              <p className="text-sm text-white/60">
                When you create galleries, they’ll appear here with their status,
                date and link information.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/dashboard/galleries/new">
                <Button className="h-10 px-5 text-xs flex items-center gap-2">
                  <Images className="w-4 h-4" />
                  Create first gallery
                </Button>
              </Link>
              <p className="text-[11px] text-white/40">
                You can organise your deliveries by client, date or project.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {galleries.length > 0 && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-xs text-white/50 mb-2">
              No galleries match “{search}”.
            </p>
          )}

          {filtered.map((g) => (
            <Link
              key={g.id}
              href={`/dashboard/galleries/${g.id}`}
              className="block"
            >
              <div className="group rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-4 py-4 md:px-5 md:py-4 flex gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {g.cover_photo_url ? (
                    <img
                      src={g.cover_photo_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Images className="w-6 h-6 text-white/40" />
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-sm md:text-base font-medium">
                        {g.title || 'Untitled gallery'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/50">
                        {g.client_name && <span>{g.client_name}</span>}
                        {g.client_name && g.event_date && (
                          <span className="text-white/30">•</span>
                        )}
                        {g.event_date && (
                          <span>
                            {format(new Date(g.event_date), 'MMM d, yyyy')}
                          </span>
                        )}
                        {g.photos?.[0]?.count ? (
                          <>
                            <span className="text-white/30">•</span>
                            <span>{g.photos[0].count} photos</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <Badge className={getStatusClasses(g.status)}>
                      {g.status === 'active'
                        ? 'Active'
                        : g.status === 'draft'
                        ? 'Draft'
                        : g.status === 'expired'
                        ? 'Expired'
                        : 'Unknown'}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created {format(new Date(g.created_at), 'MMM d, yyyy')}
                    </span>
                    {g.gallery_links?.[0]?.count ? (
                      <span>{g.gallery_links[0].count} share link(s)</span>
                    ) : (
                      <span>No share link yet</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
