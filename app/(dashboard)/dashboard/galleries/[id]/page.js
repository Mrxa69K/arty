'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import { toast } from 'sonner'
import { format, subDays, startOfDay } from 'date-fns'
import {
  ArrowLeft, Eye, Camera, Monitor, Smartphone, Tablet,
  Copy, Check, ExternalLink, Pencil, Loader2, Clock, CalendarDays
} from 'lucide-react'

export default function GalleryDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [gallery, setGallery] = useState(null)
  const [galleryLink, setGalleryLink] = useState(null)
  const [photoCount, setPhotoCount] = useState(0)
  const [views, setViews] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user && id) fetchAll()
  }, [user, id])

  const fetchAll = async () => {
    try {
      const [
        { data: galleryData },
        { data: linkData },
        { count: photos },
        { data: viewsData },
      ] = await Promise.all([
        supabase.from('galleries').select('*').eq('id', id).eq('owner_id', user.id).single(),
        supabase.from('gallery_links').select('token, expires_at, allow_download, password_hash').eq('gallery_id', id).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('photos').select('*', { count: 'exact', head: true }).eq('gallery_id', id),
        supabase.from('gallery_views').select('viewed_at, device').eq('gallery_id', id).order('viewed_at', { ascending: false }),
      ])

      if (!galleryData) { router.push('/dashboard/galleries'); return }

      setGallery(galleryData)
      setGalleryLink(linkData)
      setPhotoCount(photos || 0)
      setViews(viewsData || [])
    } catch (err) {
      toast.error('Failed to load gallery')
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = () => {
    if (!galleryLink?.token) return
    navigator.clipboard.writeText(`${window.location.origin}/g/${galleryLink.token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Analytics helpers ──
  const totalViews = views.length
  const deviceCounts = views.reduce((acc, v) => {
    acc[v.device || 'desktop'] = (acc[v.device || 'desktop'] || 0) + 1
    return acc
  }, {})

  // Last 7 days chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i)
    const label = format(day, 'EEE')
    const dayStr = format(day, 'yyyy-MM-dd')
    const count = views.filter(v => v.viewed_at?.startsWith(dayStr)).length
    return { label, count }
  })
  const maxViews = Math.max(...last7.map(d => d.count), 1)

  const deviceList = [
    { key: 'mobile', label: 'Mobile', Icon: Smartphone },
    { key: 'desktop', label: 'Desktop', Icon: Monitor },
    { key: 'tablet', label: 'Tablet', Icon: Tablet },
  ]

  const galleryUrl = galleryLink?.token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/g/${galleryLink.token}` : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 text-white/20 animate-spin" strokeWidth={1} />
      </div>
    )
  }

  if (!gallery) return null

  const isExpired = gallery.expires_at && new Date(gallery.expires_at) < new Date()

  return (
    <div className="space-y-10 max-w-4xl">

      {/* ── Back + title ── */}
      <div>
        <Link
          href="/dashboard/galleries"
          className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white font-body transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          All galleries
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-body font-medium rounded-sm ${
                gallery.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-white/8 text-white/40'
              }`}>
                {gallery.status}
              </span>
              {isExpired && (
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-body font-medium rounded-sm bg-red-500/15 text-red-400">
                  Expired
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl text-white">{gallery.title || 'Untitled'}</h1>
            {gallery.client_name && (
              <p className="text-sm text-white/40 font-body mt-1">for {gallery.client_name}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {galleryLink?.token && (
              <a
                href={`/g/${galleryLink.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-4 flex items-center gap-2 text-xs font-body text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-all rounded-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                Preview
              </a>
            )}
            <Link
              href={`/dashboard/galleries/new?id=${id}`}
              className="h-9 px-4 flex items-center gap-2 text-xs font-body bg-gold text-black font-semibold hover:bg-gold-light transition-colors rounded-sm"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* ── Key stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon={Eye} label="Total views" value={totalViews} />
        <StatCard icon={Camera} label="Photos" value={photoCount} />
        <StatCard
          icon={Clock}
          label="Expires"
          value={gallery.expires_at ? format(new Date(gallery.expires_at), 'MMM d, yyyy') : '—'}
          small
        />
      </div>

      {/* ── Views over time ── */}
      <section className="bg-[#121212] border border-white/5 rounded-sm p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 font-body mb-1">Views over time</p>
            <p className="font-display text-2xl text-white">{totalViews} total</p>
          </div>
          <CalendarDays className="w-4 h-4 text-white/15" strokeWidth={1.5} />
        </div>

        {totalViews === 0 ? (
          <div className="h-28 flex items-center justify-center">
            <p className="text-xs text-white/20 font-body">No views yet — share your gallery link to start tracking</p>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-28">
            {last7.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                  <div
                    className="w-full bg-gold/30 hover:bg-gold/50 transition-colors rounded-sm relative group"
                    style={{ height: `${Math.max((day.count / maxViews) * 80, day.count > 0 ? 4 : 0)}px` }}
                  >
                    {day.count > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gold font-body opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.count}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-white/20 font-body">{day.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Device breakdown ── */}
      {totalViews > 0 && (
        <section className="bg-[#121212] border border-white/5 rounded-sm p-6">
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 font-body mb-6">Device breakdown</p>
          <div className="space-y-4">
            {deviceList.map(({ key, label, Icon }) => {
              const count = deviceCounts[key] || 0
              const pct = totalViews > 0 ? Math.round((count / totalViews) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-white/30" strokeWidth={1.5} />
                      <span className="text-xs text-white/50 font-body">{label}</span>
                    </div>
                    <span className="text-xs text-white/40 font-body">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold/40 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Gallery link ── */}
      {galleryLink?.token && (
        <section className="bg-[#121212] border border-white/5 rounded-sm p-6">
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 font-body mb-4">Client link</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 px-4 py-2.5 bg-white/[0.03] border border-white/8 rounded-sm">
              <p className="text-sm text-white/40 font-body truncate">
                {typeof window !== 'undefined' ? window.location.origin : 'https://artydrop.netlify.app'}/g/{galleryLink.token}
              </p>
            </div>
            <button
              onClick={copyLink}
              className="h-10 px-4 flex items-center gap-2 text-xs font-body border border-white/10 text-white/50 hover:bg-white hover:text-black hover:border-white transition-all rounded-sm flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex gap-4 mt-3">
            {galleryLink.expires_at && (
              <p className="text-[11px] text-white/20 font-body">
                Expires {format(new Date(galleryLink.expires_at), 'MMM d, yyyy')}
              </p>
            )}
            {galleryLink.password_hash && (
              <p className="text-[11px] text-white/20 font-body">Password protected</p>
            )}
            {galleryLink.allow_download !== false && (
              <p className="text-[11px] text-white/20 font-body">Downloads enabled</p>
            )}
          </div>
        </section>
      )}

    </div>
  )
}

function StatCard({ icon: Icon, label, value, small }) {
  return (
    <div className="p-5 bg-[#121212] border border-white/5 rounded-sm">
      <Icon className="w-4 h-4 text-gold mb-3" strokeWidth={1.5} />
      <p className={`font-display text-white mb-0.5 ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      <p className="text-xs text-white/40 font-body">{label}</p>
    </div>
  )
}
