'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PlanSelectionModal } from '../_components/PlanSelectionModal'
import { useAuth } from '@/app/providers'
import Link from 'next/link'
import { Loader2, ArrowUpRight, Camera, Image, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { user } = useAuth()
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [galleries, setGalleries] = useState([])
  const [stats, setStats] = useState({ galleries: 0, photos: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (! user) return
    
    fetchUserProfile()
    fetchGalleriesWithThumbnails()
    fetchStats()
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_type, plan_status, plan_expires_at, used_test_plan, full_name')
        .eq('id', user. id)
        .single()

      if (error) throw error

      setUserProfile(data)

      const hasNoPlan = ! data.plan_type || data. plan_type === 'none'
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

  const fetchGalleriesWithThumbnails = async () => {
    try {
      const { data:  galleriesData, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error

      const galleriesWithThumbnails = await Promise. all(
        (galleriesData || []).map(async (gallery) => {
          // Use cover_photo_url if available, otherwise fall back to first photo
          let thumbnail = gallery.cover_photo_url
          
          if (!thumbnail) {
            const { data:  photos } = await supabase
              . from('photos')
              .select('image_url, video_url, media_type')
              .eq('gallery_id', gallery.id)
              .order('sort_order', { ascending: true })
              .limit(1)

            const firstPhoto = photos?.[0]
            thumbnail = firstPhoto?.image_url || firstPhoto?.video_url || null
          }
          
          return {
            ...gallery,
            thumbnail
          }
        })
      )

      setGalleries(galleriesWithThumbnails)
    } catch (error) {
      console.error('Error fetching galleries:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const { count: galleriesCount } = await supabase
        . from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)

      const { data: galleriesData } = await supabase
        . from('galleries')
        .select('id')
        .eq('owner_id', user.id)

      const galleryIds = galleriesData?. map(g => g.id) || []

      let photosCount = 0
      if (galleryIds.length > 0) {
        const { count } = await supabase
          . from('photos')
          .select('*', { count: 'exact', head: true })
          .in('gallery_id', galleryIds)
        
        photosCount = count || 0
      }

      setStats({
        galleries: galleriesCount || 0,
        photos:  photosCount
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleCreateGallery = async () => {
    // Prevent duplicate calls
    if (isCreating) {
      console.log('⚠️ Gallery creation already in progress')
      return
    }
    
    setIsCreating(true)
    
    try {
      const { data:  { user: currentUser }, error:  userError } = await supabase. auth.getUser()
      if (userError || !currentUser) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        . from('profiles')
        .select('plan_type, plan_status')
        .eq('id', currentUser.id)
        .single()

      const userPlan = profile?. plan_type || 'none'
      console.log('🔵 User plan:', userPlan)

      const { count: galleryCount } = await supabase
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', currentUser.id)

      console.log('🔵 Current galleries:', galleryCount)

      const galleryLimits = {
        none: 1,
        test: 3,
        payg: 999999,
        studio: 999999
      }

      const limit = galleryLimits[userPlan] || 1
      console.log('🔵 Limit:', limit)

      if (galleryCount >= limit) {
        console.log('❌ BLOCKED: Gallery limit reached!')
        toast.error(`You've reached your plan limit (${limit} ${limit === 1 ? 'gallery' : 'galleries'}). Upgrade to create more.`)
        setShowPlanModal(true)
        setIsCreating(false)
        return
      }

      console.log('✅ Checks passed, creating gallery...')
      const { data: newGallery, error } = await supabase
        . from('galleries')
        .insert({
          owner_id: currentUser.id,
          title: 'Untitled Gallery',
          status: 'draft',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ Gallery created:', newGallery.id)
      toast.success('Gallery created!')
      
      // Don't reset isCreating since we're navigating away
      window.location.href = `/dashboard/galleries/new?id=${newGallery.id}`
      
    } catch (error) {
      console.error('❌ Error:', error)
      toast.error('Failed to create gallery')
      setIsCreating(false)
    }
  }

  const getPlanName = () => {
    if (! userProfile) return 'Free'
    const names = { test: 'Test', payg:  'Pay as you go', studio: 'Studio', none: 'Free' }
    return names[userProfile.plan_type] || 'Free'
  }

  const getPlanColor = () => {
    if (!userProfile) return 'from-gray-50 to-gray-100'
    const colors = {
      test: 'from-blue-50 to-blue-100',
      payg: 'from-purple-50 to-purple-100',
      studio: 'from-amber-50 to-amber-100',
      none: 'from-gray-50 to-gray-100'
    }
    return colors[userProfile.plan_type] || 'from-gray-50 to-gray-100'
  }

  // Animation Variants
  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren:  0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const headerVariants = {
    hidden:  { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const welcomeVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const galleryVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition:  {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0EA]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-black/20" />
        </motion.div>
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/cover.webp')",
          backgroundSize:  'cover',
          backgroundPosition:  'center',
        }}
      />
      <div className="fixed inset-0 z-[1] bg-white/10 backdrop-blur-[1px]" />
      <div className="fixed inset-0 z-[2] bg-gradient-to-b from-[#F5F0EA]/10 via-transparent to-[#F5F0EA]/40" />
      <div
        className="pointer-events-none fixed inset-0 z-[3] opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: 
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
          backgroundSize: 'cover',
        }}
      />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.header
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="pt-6 sm:pt-8 px-4 sm:px-12 max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between">
            <Link href="/" className="group">
              <span className="text-xl sm:text-2xl font-serif text-black/90 tracking-tight group-hover:text-black transition-colors">
                Artydrop
              </span>
            </Link>
            
            <div className="flex items-center gap-3 sm:gap-6 text-sm">
              <Link 
                href="/dashboard/galleries" 
                className="text-black/50 hover:text-black transition-colors text-xs sm:text-sm"
              >
                Galleries
              </Link>
              <button
                onClick={() => setShowPlanModal(true)}
                className={`px-3 sm:px-4 py-1. 5 sm:py-2 rounded-full bg-gradient-to-r ${getPlanColor()} border border-black/10 hover:border-black/20 transition-all`}
              >
                <span className="text-[10px] sm:text-xs font-medium text-black/70">{getPlanName()}</span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <section className="pt-8 sm: pt-12 px-4 sm:px-12 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <motion.div
            variants={welcomeVariants}
            initial="hidden"
            animate="visible"
            className="mb-8 sm:mb-12"
          >
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif text-black/90 mb-2 sm:mb-3">
              Welcome back{userProfile?.full_name ? `, ${userProfile.full_name. split(' ')[0]}` : ''}
            </h1>
            <p className="text-xs sm:text-sm text-black/50 tracking-wide">
              Manage your galleries and share your work beautifully
            </p>
          </motion.div>

          {/* Plan Limits Display */}
          {userProfile && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="rounded-2xl sm:rounded-3xl bg-white/60 backdrop-blur-xl border border-black/10 p-6 sm:p-8 shadow-lg mb-8 sm:mb-12"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm: text-xl font-serif text-black/90">Your Plan Limits</h3>
                <button
                  onClick={() => setShowPlanModal(true)}
                  className="text-xs text-black/60 hover:text-black underline"
                >
                  Upgrade
                </button>
              </div>

              <div className="space-y-3">
                {/* Gallery Limit */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-black/70">Galleries</span>
                    <span className="font-medium text-black">
                      {stats.galleries} / {
                        userProfile.plan_type === 'none' ? '1' : 
                        userProfile.plan_type === 'test' ? '3' : 
                        '∞'
                      }
                    </span>
                  </div>
                  <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        stats.galleries >= (
                          userProfile.plan_type === 'none' ? 1 :
                          userProfile.plan_type === 'test' ? 3 :  999999
                        ) ?  'bg-red-500' : 'bg-black'
                      }`}
                      style={{
                        width: `${Math.min(
                          (stats.galleries / (
                            userProfile.plan_type === 'none' ? 1 :  
                            userProfile.plan_type === 'test' ?  3 : 999999
                          )) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>

                {/* Photo Limit */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-black/70">Photos per Gallery</span>
                    <span className="font-medium text-black">
                      {
                        userProfile.plan_type === 'none' ? '50' :
                        userProfile. plan_type === 'test' ? '10' :
                        '∞'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion. div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12"
          >
            {/* Create Gallery Button */}
            <motion.div variants={itemVariants}>
              {userProfile && (
                (userProfile.plan_type === 'none' && stats.galleries >= 1) ||
                (userProfile.plan_type === 'test' && stats. galleries >= 3)
              ) ? (
                <motion.button
                  onClick={() => setShowPlanModal(true)}
                  whileHover={{ scale: 1.01, y: -3 }}
                  transition={{ duration: 0.3 }}
                  className="w-full text-left group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-red-600 text-white p-6 sm:p-10 md:p-12 shadow-lg hover:shadow-2xl cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative space-y-3 sm:space-y-4">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-white/70 font-medium">
                      Limit Reached
                    </p>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif group-hover:translate-x-2 transition-transform duration-500">
                      Upgrade to create more
                    </h3>
                    <div className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                      <span className="text-xs sm:text-sm">View plans</span>
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                    <div className="mt-4 px-4 py-2 bg-white/20 rounded-lg text-xs">
                      You've used {stats.galleries} of {userProfile.plan_type === 'none' ? '1' : '3'} {stats.galleries === 1 ? 'gallery' : 'galleries'}
                    </div>
                  </div>
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleCreateGallery}
                  disabled={isCreating}
                  whileHover={{ scale: 1.01, y: -3 }}
                  transition={{ duration: 0.3 }}
                  className="w-full text-left group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-black text-white p-6 sm: p-10 md:p-12 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative space-y-3 sm:space-y-4">
                    <p className="text-[9px] sm: text-[10px] uppercase tracking-[0.25em] text-white/50 font-medium">
                      Action
                    </p>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif group-hover:translate-x-2 transition-transform duration-500">
                      {isCreating ? 'Creating.. .' : 'Create gallery'}
                    </h3>
                    <div className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors">
                      {isCreating ? (
                        <>
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                          <span className="text-xs sm:text-sm">Please wait</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs sm:text-sm">Start now</span>
                          <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </div>
                </motion. button>
              )}
            </motion.div>

            {/* View Plans Button */}
            <motion. div variants={itemVariants}>
              <motion.button
                whileHover={{ scale: 1.01, y: -3 }}
                transition={{ duration: 0.3 }}
                onClick={() => setShowPlanModal(true)}
                className="w-full group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/40 backdrop-blur-xl border border-black/10 p-6 sm:p-10 md:p-12 shadow-lg hover:bg-white/60 hover:shadow-2xl text-left"
              >
                <div className="relative space-y-3 sm:space-y-4">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-black/40 font-medium">
                    Upgrade
                  </p>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif text-black/90 group-hover:translate-x-2 transition-transform duration-500">
                    View plans
                  </h3>
                  <div className="flex items-center gap-2 text-black/50 group-hover:text-black transition-colors">
                    <span className="text-xs sm:text-sm">See options</span>
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </div>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Recent Galleries with Thumbnails */}
          {galleries.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="flex items-baseline justify-between mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-serif text-black/90">
                  Recent galleries
                </h2>
                <Link 
                  href="/dashboard/galleries"
                  className="text-xs sm:text-sm text-black/50 hover:text-black transition-colors flex items-center gap-1"
                >
                  View all
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              >
                {galleries.map((gallery, index) => (
                  <motion.div
                    key={gallery.id}
                    variants={galleryVariants}
                    custom={index}
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link href={`/dashboard/galleries/new? id=${gallery.id}`}>
                      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/60 backdrop-blur-xl border border-black/10 aspect-[4/3] shadow-lg hover:shadow-2xl group">
                        {gallery.thumbnail ?  (
                          <motion.img
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            src={gallery.thumbnail}
                            alt={gallery.title || 'Gallery'}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-black/10 to-black/20 flex items-center justify-center">
                            <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-black/20" />
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                        
                        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end">
                          <div className="space-y-1 sm:space-y-2">
                            <h3 className="text-base sm:text-lg md:text-xl font-serif text-white line-clamp-2">
                              {gallery.title || 'Untitled'}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/70">
                              <span className="capitalize">{gallery.status}</span>
                              {gallery.client_name && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{gallery.client_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ opacity: 1, scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center"
                        >
                          <ArrowUpRight className="w-4 h-4 text-black/70" />
                        </motion.div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Empty State */}
          {galleries. length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity:  1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-center py-16 sm:py-20"
            >
              <div className="space-y-4 sm:space-y-6 max-w-md mx-auto px-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale:  1 }}
                  transition={{ delay: 1, duration:  0.5, type: "spring" }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/5 flex items-center justify-center mx-auto"
                >
                  <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-black/30" />
                </motion.div>
                <h3 className="text-2xl sm:text-3xl font-serif text-black/90">
                  Start creating
                </h3>
                <p className="text-xs sm:text-sm text-black/50 leading-relaxed">
                  You haven't created any galleries yet. Start by creating your first gallery to share your work with clients.
                </p>
                <motion.button
                  onClick={handleCreateGallery}
                  disabled={isCreating}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 sm:mt-6 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-black text-white text-xs sm:text-sm font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled: cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create your first gallery'
                  )}
                </motion.button>
              </div>
            </motion. div>
          )}
        </section>
      </div>

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        open={showPlanModal}
        onClose={() => {
          if (userProfile?. plan_status === 'active') {
            setShowPlanModal(false)
          }
        }}
        userEmail={user?. email}
      />
    </main>
  )
}