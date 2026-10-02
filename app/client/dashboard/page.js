'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import Link from 'next/link'
import { Loader2, ArrowUpRight, Image as ImageIcon, User, Settings, LogOut, Lock, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'
import { NotificationBell } from '@/app/(dashboard)/_components/NotificationBell'

export default function ClientDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [sharedGalleries, setSharedGalleries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    if (!user) return

    checkUserType()
    fetchSharedGalleries()
  }, [user])

  const checkUserType = async () => {
    let { data } = await supabase
      .from('profiles')
      .select('user_type, full_name')
      .eq('id', user.id)
      .maybeSingle()

    // Signup defers profile creation when email confirmation is pending —
    // catch up here on whichever session first has one.
    if (!data) {
      const { data: inserted } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          user_type: user.user_metadata?.user_type || 'client',
        })
        .select('user_type, full_name')
        .single()
      data = inserted
    }

    setUserProfile(data)

    if (data?.user_type === 'photographer') {
      router.push('/dashboard')
    }
  }

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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Header with Profile Menu */}
      <header className="pt-8 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Link href="/" className="group">
            <span className="font-display text-2xl text-white/90 tracking-tight group-hover:text-white transition-colors">
              Artydrop
            </span>
          </Link>

          <div className="flex items-center gap-3">
          {user?.id && <NotificationBell userId={user.id} />}
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors">
                <User className="w-5 h-5 text-white/60" strokeWidth={1.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#121212] backdrop-blur-xl border-white/10 rounded-sm p-2">
              <div className="px-3 py-2 mb-2">
                <p className="text-sm font-body font-medium text-white/90">
                  {userProfile?.full_name || 'Client'}
                </p>
                <p className="text-xs font-body text-white/40">
                  {user?.email}
                </p>
              </div>

              <DropdownMenuSeparator className="bg-white/10" />

              <DropdownMenuItem
                onClick={() => router.push('/client/profile')}
                className="rounded-sm cursor-pointer hover:bg-white/5 transition-colors"
              >
                <User className="w-4 h-4 mr-2 text-white/40" strokeWidth={1.5} />
                <span className="text-sm font-body text-white/80">Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push('/client/settings')}
                className="rounded-sm cursor-pointer hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2 text-white/40" strokeWidth={1.5} />
                <span className="text-sm font-body text-white/80">Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/10" />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="rounded-sm cursor-pointer hover:bg-red-500/10 transition-colors text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
                <span className="text-sm font-body">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 sm:py-20 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl sm:text-6xl text-white mb-4">
            Your galleries
          </h1>
          <p className="text-lg sm:text-xl text-white/50 font-body">
            View photos shared with you by photographers
          </p>
        </div>

        {/* Empty state */}
        {sharedGalleries.length === 0 && (
          <div className="text-center py-20">
            <div className="space-y-4 max-w-md mx-auto">
              <div className="w-20 h-20 rounded-sm bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-10 h-10 text-white/15" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-2xl text-white">
                No galleries yet
              </h3>
              <p className="text-sm text-white/40 font-body leading-relaxed">
                When a photographer shares a gallery with you, it will appear here.
                You'll receive an email notification with the link.
              </p>
            </div>
          </div>
        )}

        {/* Gallery grid */}
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
      </section>
    </main>
  )
}
