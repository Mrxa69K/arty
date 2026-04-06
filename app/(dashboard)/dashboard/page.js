'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PlanSelectionModal } from '../_components/PlanSelectionModal'
import { useAuth } from '@/app/providers'
import Link from 'next/link'
import {
  Loader2,
  ArrowUpRight,
  Camera,
  Images,
  Plus,
  Download,
  Eye,
  Clock,
  MoreVertical,
  Trash2,
  Copy,
  Check,
  Pencil,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [galleries, setGalleries] = useState([])
  const [stats, setStats] = useState({ galleries: 0, photos: 0, views: 0, downloads: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (!user) return

    const paymentSuccess = searchParams.get('success') === 'true'

    if (paymentSuccess) {
      // Poll until webhook updates the plan (max 10s)
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const { data } = await supabase
          .from('profiles')
          .select('plan_type, plan_status, plan_expires_at, used_test_plan, full_name')
          .eq('id', user.id)
          .single()

        if (data?.plan_status === 'active' || attempts >= 10) {
          clearInterval(poll)
          setUserProfile(data)
          setShowPlanModal(false)
          setIsLoading(false)
          if (data?.plan_status === 'active') {
            toast.success('Payment confirmed! Your plan is now active.')
          }
          // Clean URL
          window.history.replaceState({}, '', '/dashboard')
        }
      }, 1000)

      fetchGalleriesWithThumbnails()
      fetchStats()
    } else {
      fetchUserProfile()
      fetchGalleriesWithThumbnails()
      fetchStats()
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_type, plan_status, plan_expires_at, used_test_plan, full_name')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setUserProfile(data)

      const hasNoPlan = !data.plan_type || data.plan_type === 'none'
      const isInactive = data.plan_status !== 'active'

      let isExpired = false
      if (data.plan_expires_at) {
        isExpired = new Date(data.plan_expires_at) < new Date()
      }

      if (hasNoPlan || isInactive || isExpired) {
        setShowPlanModal(true)
      } else {
        setShowPlanModal(false)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGalleriesWithThumbnails = async () => {
    try {
      const { data: galleriesData, error } = await supabase
        .from('galleries')
        .select('*, gallery_links(token)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error

      const galleriesWithThumbnails = await Promise.all(
        (galleriesData || []).map(async (gallery) => {
          const { data: photos } = await supabase
            .from('photos')
            .select('image_url, video_url, media_type')
            .eq('gallery_id', gallery.id)
            .order('sort_order', { ascending: true })
            .limit(1)

          const thumbnail = photos?.[0]
          return {
            ...gallery,
            thumbnail: thumbnail?.image_url || thumbnail?.video_url || null,
            token: gallery.gallery_links?.[0]?.token || null,
          }
        })
      )

      setGalleries(galleriesWithThumbnails)
    } catch (error) {
      console.error('Error fetching galleries:', error)
    }
  }

  const handleDeleteGallery = async (galleryId) => {
    if (!confirm('Delete this gallery? This cannot be undone.')) return
    try {
      const { error } = await supabase.from('galleries').delete().eq('id', galleryId)
      if (error) throw error
      setGalleries((prev) => prev.filter((g) => g.id !== galleryId))
      toast.success('Gallery deleted')
    } catch {
      toast.error('Failed to delete gallery')
    }
  }

  const handleCopyLink = (gallery) => {
    if (!gallery.token) { toast.error('No share link yet — publish the gallery first'); return }
    navigator.clipboard.writeText(`${window.location.origin}/g/${gallery.token}`)
    setCopiedId(gallery.id)
    toast.success('Link copied')
    setTimeout(() => setCopiedId(null), 2000)
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
      let viewsCount = 0
      if (galleryIds.length > 0) {
        const [{ count: photos }, { count: views }] = await Promise.all([
          supabase.from('photos').select('*', { count: 'exact', head: true }).in('gallery_id', galleryIds),
          supabase.from('gallery_views').select('*', { count: 'exact', head: true }).in('gallery_id', galleryIds),
        ])
        photosCount = photos || 0
        viewsCount = views || 0
      }

      setStats({
        galleries: galleriesCount || 0,
        photos: photosCount,
        views: viewsCount,
        downloads: 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleCreateGallery = async () => {
    if (isCreating) return
    
    setIsCreating(true)
    
    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      if (userError || !currentUser) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type, plan_status, gallery_credits')
        .eq('id', currentUser.id)
        .single()

      const userPlan = profile?.plan_type || 'none'

      // PAYG: check credits
      if (userPlan === 'payg') {
        const credits = profile?.gallery_credits || 0
        if (credits <= 0) {
          toast.error('You have no gallery credits. Purchase a new gallery to continue.')
          setShowPlanModal(true)
          setIsCreating(false)
          return
        }
      } else {
        const { count: galleryCount } = await supabase
          .from('galleries')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', currentUser.id)

        const galleryLimits = { none: 0, test: 1, studio: 999999 }
        const limit = galleryLimits[userPlan] ?? 0

        if (galleryCount >= limit) {
          toast.error(`You've reached your plan limit. Upgrade to create more.`)
          setShowPlanModal(true)
          setIsCreating(false)
          return
        }
      }

      const { data: newGallery, error } = await supabase
        .from('galleries')
        .insert({
          owner_id: currentUser.id,
          title: 'Untitled Gallery',
          status: 'draft',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // PAYG: deduct 1 credit
      if (userPlan === 'payg') {
        await supabase
          .from('profiles')
          .update({ gallery_credits: (profile.gallery_credits || 1) - 1 })
          .eq('id', currentUser.id)
      }

      toast.success('Gallery created')
      
      window.location.href = `/dashboard/galleries/new?id=${newGallery.id}`
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to create gallery')
      setIsCreating(false)
    }
  }

  const getPlanName = () => {
    if (!userProfile) return 'Free'
    const names = { test: 'Trial', payg: 'Pay as you go', studio: 'Studio', none: 'Free' }
    return names[userProfile.plan_type] || 'Free'
  }

  const getPlanLimit = () => {
    if (!userProfile) return 1
    const limits = { test: 3, payg: 999999, studio: 999999, none: 1 }
    return limits[userProfile.plan_type] || 1
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <div className="space-y-12" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-white mb-2">
            Welcome back{userProfile?.full_name ? `, ${userProfile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-white/50 font-body">
            Manage your galleries and track client engagement
          </p>
        </div>
        
        <button
          onClick={() => setShowPlanModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-sm font-body text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          data-testid="plan-badge"
        >
          <span className="w-2 h-2 rounded-full bg-gold" />
          {getPlanName()} Plan
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Galleries', value: stats.galleries, icon: Images, limit: getPlanLimit() < 999999 ? getPlanLimit() : null },
          { label: 'Total Photos', value: stats.photos, icon: Camera },
          { label: 'Total Views', value: stats.views, icon: Eye },
          { label: 'Downloads', value: stats.downloads, icon: Download },
        ].map((stat, i) => (
          <div 
            key={i}
            className="p-6 bg-[#121212] border border-white/5 rounded-sm"
            data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}
          >
            <stat.icon className="w-5 h-5 text-gold mb-4" strokeWidth={1.5} />
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl text-white">{stat.value}</span>
              {stat.limit && (
                <span className="text-sm text-white/30 font-body">/ {stat.limit}</span>
              )}
            </div>
            <p className="text-sm text-white/50 font-body mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Create Gallery Button */}
        {userProfile && (
          (userProfile.plan_type === 'none' && stats.galleries >= 1) ||
          (userProfile.plan_type === 'test' && stats.galleries >= 3)
        ) ? (
          <button
            onClick={() => setShowPlanModal(true)}
            className="group relative p-8 bg-red-500/10 border border-red-500/30 rounded-sm text-left hover:bg-red-500/15 transition-colors"
            data-testid="upgrade-cta"
          >
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-red-400" strokeWidth={1.5} />
              <span className="text-xs tracking-wider uppercase text-red-400 font-body font-medium">
                Limit Reached
              </span>
            </div>
            <h3 className="font-display text-2xl text-white mb-2">
              Upgrade to create more
            </h3>
            <p className="text-sm text-white/50 font-body mb-4">
              You've used {stats.galleries} of {getPlanLimit()} galleries on your current plan
            </p>
            <div className="flex items-center gap-2 text-gold font-body text-sm font-medium">
              View plans
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={1.5} />
            </div>
          </button>
        ) : (
          <button
            onClick={handleCreateGallery}
            disabled={isCreating}
            className="group relative p-8 bg-gold/10 border border-gold/30 rounded-sm text-left hover:bg-gold/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="create-gallery-cta"
          >
            <div className="flex items-center gap-3 mb-4">
              <Plus className="w-5 h-5 text-gold" strokeWidth={1.5} />
              <span className="text-xs tracking-wider uppercase text-gold font-body font-medium">
                Quick Action
              </span>
            </div>
            <h3 className="font-display text-2xl text-white mb-2">
              {isCreating ? 'Creating...' : 'Create new gallery'}
            </h3>
            <p className="text-sm text-white/50 font-body mb-4">
              Start uploading photos for your next client delivery
            </p>
            <div className="flex items-center gap-2 text-gold font-body text-sm font-medium">
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                  Please wait
                </>
              ) : (
                <>
                  Get started
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={1.5} />
                </>
              )}
            </div>
          </button>
        )}

        {/* View Plans */}
        <button
          onClick={() => setShowPlanModal(true)}
          className="group relative p-8 bg-[#121212] border border-white/5 rounded-sm text-left hover:border-white/10 transition-colors"
          data-testid="view-plans-cta"
        >
          <div className="flex items-center gap-3 mb-4">
            <Images className="w-5 h-5 text-white/50" strokeWidth={1.5} />
            <span className="text-xs tracking-wider uppercase text-white/40 font-body font-medium">
              Subscription
            </span>
          </div>
          <h3 className="font-display text-2xl text-white mb-2">
            Manage plan
          </h3>
          <p className="text-sm text-white/50 font-body mb-4">
            View your current plan details and upgrade options
          </p>
          <div className="flex items-center gap-2 text-white/60 font-body text-sm font-medium group-hover:text-white transition-colors">
            See options
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={1.5} />
          </div>
        </button>
      </div>

      {/* Recent Galleries */}
      {galleries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl text-white">
              Recent galleries
            </h2>
            <Link 
              href="/dashboard/galleries"
              className="text-sm text-white/50 hover:text-white transition-colors font-body flex items-center gap-1"
              data-testid="view-all-galleries"
            >
              View all
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleries.map((gallery) => (
              <div
                key={gallery.id}
                data-testid={`gallery-${gallery.id}`}
                className="group relative aspect-[4/3] bg-[#121212] border border-white/5 rounded-sm overflow-hidden hover:border-white/10 transition-all card-lift cursor-pointer"
                onClick={() => router.push(`/dashboard/galleries/${gallery.id}`)}
              >
                {/* Thumbnail */}
                {gallery.cover_image_url || gallery.thumbnail ? (
                  <img
                    src={gallery.cover_image_url || gallery.thumbnail}
                    alt={gallery.title || 'Gallery'}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-white/10" strokeWidth={1} />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-sm font-body font-medium ${
                      gallery.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/10 text-white/50'
                    }`}>
                      {gallery.status}
                    </span>
                  </div>
                  <h3 className="font-display text-lg text-white line-clamp-1">
                    {gallery.title || 'Untitled'}
                  </h3>
                  {gallery.client_name && (
                    <p className="text-xs text-white/50 font-body mt-1 truncate">
                      {gallery.client_name}
                    </p>
                  )}
                </div>

                {/* 3-dot menu */}
                <div
                  className="absolute top-3 right-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setOpenMenu(openMenu === gallery.id ? null : gallery.id)}
                    className="w-8 h-8 rounded-sm bg-black/50 backdrop-blur flex items-center justify-center text-white/50 hover:text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
                  </button>

                  {openMenu === gallery.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 mt-1 w-44 rounded-sm border border-white/10 bg-[#1a1a1a] shadow-dark-xl py-1 z-20 animate-scaleIn origin-top-right">
                        <button
                          onClick={() => { handleCopyLink(gallery); setOpenMenu(null) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 font-body hover:bg-white/5 hover:text-white transition-colors"
                        >
                          {copiedId === gallery.id ? <Check className="w-3 h-3" strokeWidth={2} /> : <Copy className="w-3 h-3" strokeWidth={1.5} />}
                          Copy link
                        </button>
                        <Link
                          href={`/dashboard/galleries/new?id=${gallery.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 font-body hover:bg-white/5 hover:text-white transition-colors"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Pencil className="w-3 h-3" strokeWidth={1.5} />
                          Edit gallery
                        </Link>
                        {gallery.token && (
                          <a
                            href={`/g/${gallery.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 font-body hover:bg-white/5 hover:text-white transition-colors"
                            onClick={() => setOpenMenu(null)}
                          >
                            <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                            Open public link
                          </a>
                        )}
                        <div className="my-1 border-t border-white/5" />
                        <button
                          onClick={() => { handleDeleteGallery(gallery.id); setOpenMenu(null) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400/80 font-body hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {galleries.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-sm bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Camera className="w-10 h-10 text-white/20" strokeWidth={1} />
          </div>
          <h3 className="font-display text-2xl text-white mb-3">
            Start creating
          </h3>
          <p className="text-sm text-white/50 font-body max-w-md mx-auto mb-8">
            You haven't created any galleries yet. Start by creating your first gallery to share your work with clients.
          </p>
          <button
            onClick={handleCreateGallery}
            disabled={isCreating}
            className="h-12 px-8 bg-gold text-black font-body font-semibold text-sm rounded-sm hover:bg-gold-light transition-all disabled:opacity-50 inline-flex items-center gap-2"
            data-testid="empty-state-create-btn"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                Create your first gallery
              </>
            )}
          </button>
        </div>
      )}

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
    </div>
  )
}
