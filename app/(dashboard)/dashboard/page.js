'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Images,
  Eye,
  Link2,
  GalleryHorizontal,
  MoreVertical,
  Copy,
  Edit2,
  Trash2,
  Share2
} from 'lucide-react'

export default function DashboardPage() {
  const [galleries, setGalleries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setGalleries([])
          return
        }

        const { data, error } = await supabase
          .from('galleries')
          .select(`
            *,
            photos:photos(count),
            gallery_links:gallery_links(count)
          `)
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setGalleries(data || [])
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusClasses = (status) => {
    if (status === 'active') {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/30'
    }
    if (status === 'expired') {
      return 'bg-red-500/10 text-red-400 border border-red-400/30'
    }
    return 'bg-black/10 text-black/60 border border-black/20'
  }

  const duplicateGallery = async (gallery) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: newGallery } = await supabase
      .from('galleries')
      .insert({
        owner_id: user.id,
        title: `${gallery.title || 'Untitled gallery'} (Copy)`,
        client_name: gallery.client_name,
        event_date: gallery.event_date,
        status: 'draft',
        cover_photo_url: gallery.cover_photo_url
      })
      .select()
      .single()
    
    setGalleries([newGallery, ...galleries])
    setMenuOpen(null)
  }

  const deleteGallery = async (galleryId) => {
    await supabase.from('galleries').delete().eq('id', galleryId)
    setGalleries(galleries.filter(g => g.id !== galleryId))
    setMenuOpen(null)
  }

  const copyShareLink = (gallery) => {
    const url = `${window.location.origin}/galleries/${gallery.id}`
    navigator.clipboard.writeText(url)
    setMenuOpen(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-black border-b-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background cover EXACT sign-in */}
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

      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Empty state */}
          {galleries.length === 0 && (
            <Card className="border border-black/10 bg-[#F8F3EB]/95 shadow-2xl rounded-3xl">
              <CardContent className="px-8 py-12 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED]/10 to-[#F97316]/10 border border-[#7C3AED]/20 flex items-center justify-center">
                  <GalleryHorizontal className="w-10 h-10 text-[#7C3AED]" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold" style={{ fontFamily: '"Josefin Sans", system-ui, sans-serif' }}>
                    Start your first delivery
                  </h2>
                  <p className="text-sm text-black/60 max-w-md leading-relaxed">
                    Create a gallery, upload photos, and share a beautiful client link. 
                    Everything appears here automatically.
                  </p>
                </div>
                <Link href="/dashboard/galleries/new">
                  <Button className="h-12 px-8 rounded-full bg-black text-white hover:bg-black/90 text-sm shadow-xl">
                    <Images className="w-4 h-4 mr-2" />
                    Create first gallery
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Galleries list avec MENU 3 POINTS */}
          {galleries.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-black/70 tracking-[0.18em] uppercase">
                  Recent galleries
                </p>
                <p className="text-[12px] text-black/50">
                  {galleries.length} total
                </p>
              </div>

              <div className="grid gap-4">
                {galleries.map((g) => (
                  <div key={g.id} className="relative group">
                    <Link
                      href={`/dashboard/galleries/${g.id}`}
                      className="block"
                    >
                      <Card className="border border-black/10 bg-white/80 hover:bg-white shadow-xl hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            {/* Thumbnail */}
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                              {g.cover_photo_url ? (
                                <img
                                  src={g.cover_photo_url}
                                  alt=""
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <Images className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="space-y-1">
                                  <p className="text-lg font-semibold text-black truncate">
                                    {g.title || 'Untitled gallery'}
                                  </p>
                                  <div className="flex items-center gap-2 text-[13px] text-black/60 flex-wrap">
                                    {g.client_name && <span>{g.client_name}</span>}
                                    {g.client_name && g.event_date && <span>•</span>}
                                    {g.event_date && (
                                      <span>{format(new Date(g.event_date), 'MMM d, yyyy')}</span>
                                    )}
                                    {g.photos?.[0]?.count && (
                                      <>
                                        <span>•</span>
                                        <span>{g.photos[0].count} photos</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Badge className={`${getStatusClasses(g.status)} text-xs`}>
                                  {g.status === 'active' ? 'Active' :
                                   g.status === 'draft' ? 'Draft' :
                                   g.status === 'expired' ? 'Expired' : 'Unknown'}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 text-[12px] text-black/50">
                                <span className="flex items-center gap-1 hover:text-black transition-colors cursor-pointer">
                                  <Eye className="w-3 h-3" />
                                  Open gallery
                                </span>
                                <span>Created {format(new Date(g.created_at), 'MMM d')}</span>
                                {g.gallery_links?.[0]?.count ? (
                                  <span className="flex items-center gap-1">
                                    <Link2 className="w-3 h-3" />
                                    {g.gallery_links[0].count} links
                                  </span>
                                ) : (
                                  <span>No share link</span>
                                )}
                              </div>
                            </div>

                            {/* BOUTON 3 POINTS */}
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setMenuOpen(menuOpen === g.id ? null : g.id)
                              }}
                              className="p-2 rounded-xl bg-white/50 hover:bg-white/80 transition-colors flex items-center justify-center -mr-2 opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical className="w-4 h-4 text-black/50" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    {/* MENU DROPPING */}
                    {menuOpen === g.id && (
                      <div className="absolute top-2 right-2 bg-white/95 border border-black/10 shadow-2xl rounded-2xl py-2 w-56 z-20">
                        <button
                          onClick={() => copyShareLink(g)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-black/80 hover:bg-black/5 rounded-t-xl transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          Copy share link
                        </button>
                        <button
                          onClick={() => duplicateGallery(g)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-black/80 hover:bg-black/5 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <Link href={`/dashboard/galleries/${g.id}/edit`} className="block">
                          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-black/80 hover:bg-black/5 transition-colors">
                            <Edit2 className="w-4 h-4" />
                            Edit gallery
                          </button>
                        </Link>
                        <button
                          onClick={() => deleteGallery(g.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-b-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
