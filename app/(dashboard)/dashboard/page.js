'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PlanSelectionModal } from '../_components/PlanSelectionModal'
import { useAuth } from '@/app/providers'
import Link from 'next/link'
import { Loader2, ArrowUpRight } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [galleries, setGalleries] = useState([])
  const [stats, setStats] = useState({ galleries: 0, photos: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    
    fetchUserProfile()
    fetchGalleries()
    fetchStats()
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_type, plan_status, plan_expires_at, used_test_plan')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setUserProfile(data)

      // ✅ FIXED: Only show modal if no plan, inactive, or expired
      const hasNoPlan = !data.plan_type || data.plan_type === 'none'
      const isInactive = data.plan_status !== 'active'
      
      let isExpired = false
      if (data.plan_type === 'test' && data.plan_expires_at) {
        isExpired = new Date(data.plan_expires_at) < new Date()
      }

      if (hasNoPlan || isInactive || isExpired) {
        setShowPlanModal(true)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGalleries = async () => {
    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error
      setGalleries(data || [])
    } catch (error) {
      console.error('Error fetching galleries:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const { count: galleriesCount } = await supabase
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)

      const { data: galleriesData } = await supabase
        .from('galleries')
        .select('id')
        .eq('owner_id', user.id)

      const galleryIds = galleriesData?.map(g => g.id) || []

      let photosCount = 0
      if (galleryIds.length > 0) {
        const { count } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .in('gallery_id', galleryIds)
        
        photosCount = count || 0
      }

      setStats({
        galleries: galleriesCount || 0,
        photos: photosCount
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const getPlanName = () => {
    if (!userProfile) return 'Free'
    const names = { test: 'Test', payg: 'Flexible', studio: 'Studio', none: 'Free' }
    return names[userProfile.plan_type] || 'Free'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0EA]">
        <Loader2 className="w-8 h-8 animate-spin text-black/20" />
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
  {/* Background */}
<div
  className="fixed inset-0"
  style={{
    backgroundImage: "url('/cover.webp')",  // ✅ YOUR COVER.WEBP IS HERE
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
/>
<div className="fixed inset-0 bg-[#]/80" />  {/* Overlay to soften it */}
<div
  className="pointer-events-none fixed inset-0 opacity-[0.12] mix-blend-multiply"
  style={{
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
    backgroundSize: 'cover',
  }}
/>  {/* Grain texture on top */}


      <div className="relative z-10 min-h-screen">
        {/* Minimal Header - Cosmos style */}
        <header className="pt-8 px-6 sm:px-12 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/" className="group">
              <span className="text-2xl font-serif text-black/90 tracking-tight group-hover:text-black transition-colors">
                Artydrop
              </span>
            </Link>
            
            <div className="flex items-center gap-6 text-sm">
              <Link 
                href="/dashboard/galleries" 
                className="text-black/50 hover:text-black transition-colors hidden sm:block"
              >
                Galleries
              </Link>
              <div className="px-3 py-1.5 rounded-full bg-black/5 backdrop-blur-sm border border-black/10">
                <span className="text-xs text-black/60">{getPlanName()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Clean & Spacious */}
        <section className="py-12 sm:py-20 px-6 sm:px-12 max-w-7xl mx-auto">
          {/* Stats - Minimalist */}
          <div className="mb-16 sm:mb-24">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                  Galleries
                </p>
                <p className="text-5xl sm:text-6xl font-serif text-black/90">
                  {stats.galleries}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                  Photos
                </p>
                <p className="text-5xl sm:text-6xl font-serif text-black/90">
                  {stats.photos}
                </p>
              </div>
              <div className="hidden sm:block space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                  Plan
                </p>
                <p className="text-2xl font-serif text-black/70">
                  {getPlanName()}
                </p>
              </div>
              <div className="hidden sm:block" />
            </div>
          </div>

          {/* Quick Actions - No icons, just text */}
          <div className="mb-16 sm:mb-24">
            <div className="grid sm:grid-cols-2 gap-4">
              <Link href="/dashboard/galleries/new">
                <div className="group relative overflow-hidden rounded-2xl bg-black text-white p-8 sm:p-12 transition-all duration-500 hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                      Action
                    </p>
                    <h3 className="text-3xl sm:text-4xl font-serif group-hover:translate-x-2 transition-transform duration-500">
                      Create gallery
                    </h3>
                    <div className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors">
                      <span className="text-sm">Start now</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>

              <button 
                onClick={() => setShowPlanModal(true)}
                className="group relative overflow-hidden rounded-2xl bg-white/40 backdrop-blur-xl border border-black/10 p-8 sm:p-12 transition-all duration-500 hover:bg-white/60 hover:shadow-2xl text-left"
              >
                <div className="relative space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                    Upgrade
                  </p>
                  <h3 className="text-3xl sm:text-4xl font-serif text-black/90 group-hover:translate-x-2 transition-transform duration-500">
                    View plans
                  </h3>
                  <div className="flex items-center gap-2 text-black/50 group-hover:text-black transition-colors">
                    <span className="text-sm">See options</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Galleries - Grid like Cosmos */}
          {galleries.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between mb-8">
                <h2 className="text-2xl sm:text-3xl font-serif text-black/90">
                  Recent galleries
                </h2>
                <Link 
                  href="/dashboard/galleries"
                  className="text-sm text-black/50 hover:text-black transition-colors flex items-center gap-1"
                >
                  View all
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleries.map((gallery) => (
                  <Link 
                    key={gallery.id}
                    href={`/dashboard/galleries/${gallery.id}`}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-white/40 backdrop-blur-xl border border-black/10 aspect-[4/3] transition-all duration-500 hover:bg-white/60 hover:shadow-xl hover:scale-[1.02]">
                      {/* Placeholder or cover image */}
                      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/20 group-hover:scale-105 transition-transform duration-700" />
                      
                      <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <div className="space-y-2">
                          <h3 className="text-xl font-serif text-black/90 group-hover:text-black transition-colors">
                            {gallery.title || 'Untitled'}
                          </h3>
                          <p className="text-xs text-black/50 capitalize">
                            {gallery.status}
                          </p>
                        </div>
                      </div>

                      {/* Hover arrow */}
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-4 h-4 text-black/70" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {galleries.length === 0 && (
            <div className="text-center py-20">
              <div className="space-y-4 max-w-md mx-auto">
                <h3 className="text-3xl font-serif text-black/90">
                  Start creating
                </h3>
                <p className="text-sm text-black/50 leading-relaxed">
                  You haven't created any galleries yet. Start by creating your first gallery to share your work with clients.
                </p>
                <Link href="/dashboard/galleries/new">
                  <button className="mt-6 px-6 py-3 rounded-full bg-black text-white text-sm hover:scale-105 transition-transform duration-300">
                    Create your first gallery
                  </button>
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        open={showPlanModal}
        onClose={() => {
          if (userProfile?.plan_status === 'active') {
            setShowPlanModal(false)
          }
        }}
        userEmail={user?.email}
      />
    </main>
  )
}
