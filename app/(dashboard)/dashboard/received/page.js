'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import Link from 'next/link'
import { Loader2, ArrowUpRight, Image as ImageIcon, Lock, Clock } from 'lucide-react'

export default function ReceivedGalleriesPage() {
  const { user } = useAuth()
  const [sharedGalleries, setSharedGalleries] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchSharedGalleries()
  }, [user])

  const fetchSharedGalleries = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/client/shared-galleries', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (res.ok) setSharedGalleries(data.galleries || [])
    } catch (error) {
      console.error('Error fetching galleries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-display text-3xl text-white mb-2">Galleries received</h1>
        <p className="text-sm text-white/40 font-body">
          Galleries other photographers have shared with your email address
        </p>
      </div>

      {sharedGalleries.length === 0 && (
        <div className="text-center py-20">
          <div className="space-y-4 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-sm bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-white/15" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-2xl text-white">No galleries yet</h3>
            <p className="text-sm text-white/40 font-body leading-relaxed">
              When a photographer shares a gallery with your email address, it will appear here.
            </p>
          </div>
        </div>
      )}

      {sharedGalleries.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sharedGalleries.map((gallery) => (
            <Link
              key={gallery.id}
              href={gallery.expired ? '#' : `/g/${gallery.token}`}
              className={`group block bg-[#121212] border border-white/5 rounded-sm overflow-hidden transition-colors ${
                gallery.expired ? 'opacity-50 pointer-events-none' : 'hover:border-white/10'
              }`}
            >
              <div className="aspect-[4/3] bg-white/[0.02] relative overflow-hidden">
                {gallery.coverImageUrl ? (
                  <img
                    src={gallery.coverImageUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-white/10" strokeWidth={1.5} />
                  </div>
                )}
                {gallery.expired && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 text-white text-[11px] font-body px-2.5 py-1 rounded-sm">
                    <Clock className="w-3 h-3" strokeWidth={1.5} />
                    Expired
                  </div>
                )}
                {!gallery.expired && gallery.hasPassword && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 text-white text-[11px] font-body px-2.5 py-1 rounded-sm">
                    <Lock className="w-3 h-3" strokeWidth={1.5} />
                    Protected
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg text-white mb-1 truncate">{gallery.title}</h3>
                {gallery.photographerName && (
                  <p className="text-xs text-white/40 font-body mb-1">by {gallery.photographerName}</p>
                )}
                {gallery.eventDate && (
                  <p className="text-xs text-white/40 font-body">
                    {new Date(gallery.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                {!gallery.expired && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-gold font-body group-hover:text-gold-light transition-colors">
                    View gallery
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
