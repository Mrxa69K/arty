'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Images, Plus, Search, MoreVertical, Trash2,
  ExternalLink, Calendar, User, Camera, ArrowUpRight,
  Loader2, Copy, Check,
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/app/providers'
import { toast } from 'sonner'

export default function GalleriesPage() {
  const [galleries, setGalleries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showMenu, setShowMenu] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const { user } = useAuth()
  const router = useRouter()

  const handleNewGallery = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type, plan_status, gallery_credits')
      .eq('id', currentUser.id)
      .single()

    const userPlan = profile?.plan_type || 'none'

    if (userPlan === 'payg') {
      const credits = profile?.gallery_credits || 0
      if (credits <= 0) {
        toast.error('No gallery credits remaining. Go to dashboard to purchase a new gallery.')
        router.push('/dashboard')
        return
      }
    } else if (userPlan !== 'studio') {
      const { count } = await supabase
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', currentUser.id)
      const limit = userPlan === 'test' ? 1 : 0
      if (count >= limit) {
        toast.error(`You've reached your plan limit. Upgrade to create more.`)
        router.push('/dashboard')
        return
      }
    }

    router.push('/dashboard/galleries/new')
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('galleries')
          .select(`
            *,
            photos:photos(count),
            gallery_links:gallery_links(token)
          `)
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Get thumbnails for each gallery
        const galleriesWithThumbnails = await Promise.all(
          (data || []).map(async (gallery) => {
            const { data: photos } = await supabase
              .from('photos')
              .select('image_url, video_url, media_type')
              .eq('gallery_id', gallery.id)
              .order('sort_order', { ascending: true })
              .limit(1)

            const thumbnail = photos?.[0]
            return {
              ...gallery,
              thumbnail: gallery.cover_image_url || thumbnail?.image_url || thumbnail?.video_url || null
            }
          })
        )

        setGalleries(galleriesWithThumbnails)
      } catch (err) {
        console.error('Error loading galleries:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  async function handleDelete(galleryId) {
    if (!confirm('Are you sure you want to delete this gallery? This action cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', galleryId)

      if (error) throw error
      setGalleries(galleries.filter(g => g.id !== galleryId))
      toast.success('Gallery deleted')
    } catch (error) {
      console.error('Error deleting gallery:', error)
      toast.error('Failed to delete gallery')
    }
  }

  const handleCopyLink = (gallery) => {
    const token = gallery.gallery_links?.[0]?.token
    if (!token) { toast.error('No share link yet — publish the gallery first'); return }
    navigator.clipboard.writeText(`${window.location.origin}/g/${token}`)
    setCopiedId(gallery.id)
    toast.success('Link copied')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusColor = (status) => {
    if (status === 'active') return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (status === 'expired') return 'bg-red-500/20 text-red-400 border-red-500/30'
    return 'bg-white/5 text-white/50 border-white/10'
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
      <div className="min-h-[60vh] flex items-center justify-center" data-testid="loading-galleries">
        <Loader2 className="w-8 h-8 animate-spin text-gold" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <div className="space-y-8" data-testid="galleries-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-white mb-2">
            Your galleries
          </h1>
          <p className="text-sm text-white/50 font-body">
            {galleries.length} {galleries.length === 1 ? 'gallery' : 'galleries'} total
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search galleries..."
              className="h-10 w-full sm:w-64 pl-10 pr-4 bg-[#121212] border border-white/10 rounded-sm text-sm text-white placeholder:text-white/30 font-body focus:outline-none focus:border-white/20 transition-colors"
              data-testid="search-input"
            />
          </div>

          <Button onClick={handleNewGallery} className="h-10 px-5 bg-gold text-black hover:bg-gold-light rounded-sm font-body text-sm font-medium gap-2" data-testid="new-gallery-btn">
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            New gallery
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {galleries.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-sm bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Images className="w-10 h-10 text-white/20" strokeWidth={1} />
          </div>
          <h3 className="font-display text-2xl text-white mb-3">
            No galleries yet
          </h3>
          <p className="text-sm text-white/50 font-body max-w-md mx-auto mb-8">
            Create your first gallery to start delivering beautiful photo collections to your clients.
          </p>
          <Button onClick={handleNewGallery} className="h-12 px-8 bg-gold text-black hover:bg-gold-light rounded-sm font-body font-semibold text-sm gap-2" data-testid="empty-create-btn">
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Create your first gallery
          </Button>
        </div>
      )}

      {/* Galleries Grid */}
      {galleries.length > 0 && (
        <div className="space-y-4">
          {filtered.length === 0 && search && (
            <p className="text-sm text-white/40 font-body">
              No galleries match "{search}"
            </p>
          )}

          <div className="grid gap-4">
            {filtered.map((gallery) => (
              <div
                key={gallery.id}
                className="group bg-[#121212] border border-white/5 rounded-sm hover:border-white/10 transition-all"
                data-testid={`gallery-item-${gallery.id}`}
              >
                <div className="p-4 sm:p-5 flex gap-4">
                  {/* Thumbnail */}
                  <Link
                    href={`/dashboard/galleries/${gallery.id}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-sm bg-[#1a1a1a] overflow-hidden flex-shrink-0 relative image-hover-zoom"
                  >
                    {gallery.thumbnail ? (
                      <img
                        src={gallery.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white/10" strokeWidth={1} />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/dashboard/galleries/${gallery.id}`}
                        className="flex-1 min-w-0"
                      >
                        <h3 className="font-display text-lg text-white truncate group-hover:text-gold transition-colors">
                          {gallery.title || 'Untitled gallery'}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/50 font-body">
                          {gallery.client_name && (
                            <span className="flex items-center gap-1.5">
                              <User className="w-3 h-3" strokeWidth={1.5} />
                              {gallery.client_name}
                            </span>
                          )}
                          {gallery.event_date && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" strokeWidth={1.5} />
                              {format(new Date(gallery.event_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </Link>

                      <div className="flex items-center gap-2">
                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-sm border font-body ${getStatusColor(gallery.status)}`}>
                          {gallery.status}
                        </span>

                        {/* Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setShowMenu(showMenu === gallery.id ? null : gallery.id)}
                            className="p-2 rounded-sm hover:bg-white/5 transition-colors"
                            data-testid={`menu-btn-${gallery.id}`}
                          >
                            <MoreVertical className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                          </button>
                          
                          {showMenu === gallery.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowMenu(null)}
                              />
                              <div className="absolute right-0 mt-1 w-44 rounded-sm border border-white/10 bg-[#1a1a1a] shadow-dark-xl py-1 z-20 animate-scaleIn origin-top-right">
                                <button
                                  onClick={() => { handleCopyLink(gallery); setShowMenu(null) }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 font-body hover:bg-white/5 hover:text-white transition-colors"
                                >
                                  {copiedId === gallery.id ? <Check className="w-3 h-3" strokeWidth={2} /> : <Copy className="w-3 h-3" strokeWidth={1.5} />}
                                  Copy link
                                </button>
                                <Link
                                  href={`/dashboard/galleries/new?id=${gallery.id}`}
                                  className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 font-body hover:bg-white/5 hover:text-white transition-colors"
                                  onClick={() => setShowMenu(null)}
                                >
                                  <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                                  Edit gallery
                                </Link>
                                {gallery.gallery_links?.[0]?.token && (
                                  <a
                                    href={`/g/${gallery.gallery_links[0].token}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 font-body hover:bg-white/5 hover:text-white transition-colors"
                                    onClick={() => setShowMenu(null)}
                                  >
                                    <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                                    Open public link
                                  </a>
                                )}
                                <div className="my-1 border-t border-white/5" />
                                <button
                                  onClick={() => {
                                    handleDelete(gallery.id)
                                    setShowMenu(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400/80 font-body hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                  data-testid={`delete-btn-${gallery.id}`}
                                >
                                  <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/40 font-body">
                      <span>
                        Created {format(new Date(gallery.created_at), 'MMM d, yyyy')}
                      </span>
                      {gallery.photos?.[0]?.count > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>{gallery.photos[0].count} photos</span>
                        </>
                      )}
                      {gallery.gallery_links?.length > 0 ? (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>{gallery.gallery_links.length} share link{gallery.gallery_links.length > 1 ? 's' : ''}</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="text-gold/60">No share link yet</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
