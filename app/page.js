'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { 
  ArrowRight, 
  Check, 
  Lock, 
  Clock, 
  Image as ImageIcon,
  Download, 
  BarChart3, 
  Smartphone,
  Upload,
  Settings,
  Share2,
  X,
  ChevronDown,
  Star,
  Zap,
  Eye,
  Heart
} from 'lucide-react'
import { useAuth } from './providers'

// Intersection Observer hook for scroll animations
function useInView(options = {}) {
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        // Unobserve after first trigger (animate once)
        if (options.once !== false) {
          observer.unobserve(entry.target)
        }
      }
    }, {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '0px'
    })

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin, options.once])

  return [ref, isInView]
}

export default function HomePage() {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [openFaq, setOpenFaq] = useState(null)
  const router = useRouter()
  const { user, loading } = useAuth()

  // Animation refs
  const [heroRef, heroInView] = useInView()
  const [problemRef, problemInView] = useInView()
  const [howItWorksRef, howItWorksInView] = useInView()
  const [featuresRef, featuresInView] = useInView()
  const [exampleRef, exampleInView] = useInView()
  const [pricingRef, pricingInView] = useInView()
  const [testimonialsRef, testimonialsInView] = useInView()

  async function handleCheckout(plan) {
    if (loading) return
    
    try {
      setIsRedirecting(true)
      
      if (!user) {
        localStorage.setItem('pending_plan', plan)
        router.push('/signup')
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        console.error('Checkout error', res.status, error)
        alert('Checkout error: ' + (error?.error || res.status))
        setIsRedirecting(false)
        return
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setIsRedirecting(false)
      }
    } catch (err) {
      console.error(err)
      setIsRedirecting(false)
    }
  }

  const faqs = [
    {
      q: "How long are my photos stored?",
      a: "Free trial: 7 days. Pay-as-you-go: 6 months. Studio: 12 months. All plans can be extended anytime."
    },
    {
      q: "What quality do my clients receive?",
      a: "Clients view optimized previews (faster loading), but downloads are always full resolution originals."
    },
    {
      q: "Can I cancel my Studio plan anytime?",
      a: "Yes, absolutely. No contracts, no questions asked. Your galleries remain accessible for 30 days after cancellation."
    },
    {
      q: "Do you offer refunds?",
      a: "Yes! If you're not satisfied within 14 days, we'll refund you in full."
    },
    {
      q: "Is there a setup fee?",
      a: "No. You can start uploading immediately after signup. No hidden costs."
    },
    {
      q: "Can I add watermarks to my photos?",
      a: "Yes! Upload your logo and we'll automatically apply it to all preview images. Downloads remain unwatermarked (if you allow downloads)."
    }
  ]

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

      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="pt-6 px-4 sm:px-6 max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className="inline-flex items-center justify-center px-4 py-2 border border-black/80 rounded-[999px] bg-black/5 backdrop-blur-sm hover:bg-black/10 transition-colors">
              <span className="text-xs tracking-[0.18em] uppercase">
                ARTYDROP
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs">
            {loading ? (
              <span className="text-black/60">...</span>
            ) : user ? (
              <>
                <span className="hidden sm:inline text-black/60">{user.email}</span>
                <Link href="/dashboard">
                  <Button className="h-8 rounded-full px-4 bg-black text-white hover:bg-black/90 text-[11px] button-press">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-black/80 hover:text-black transition-colors">
                  Log in
                </Link>
                <Link href="/signup">
                  <Button className="h-8 rounded-full px-4 bg-black text-white hover:bg-black/90 text-[11px] button-press">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Hero Section - Animated */}
        <section 
          ref={heroRef}
          className="mt-14 sm:mt-20 mb-16 px-4 sm:px-6 max-w-6xl mx-auto w-full"
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Social proof badge */}
            <div className={`flex justify-center ${heroInView ? 'animate-fadeInUp' : 'opacity-0-animate'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-black/10">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-teal-500 border-2 border-white" />
                </div>
                <span className="text-[11px] text-black/70">
                  Trusted by <span className="font-semibold">200+ photographers</span>
                </span>
              </div>
            </div>

            <p className={`text-[15px] font-medium text-center tracking-[0.22em] uppercase text-black/60 ${heroInView ? 'animate-fadeInUp animation-delay-100' : 'opacity-0-animate'}`}>
              Professional Photo Delivery
            </p>

            {/* Main title */}
            <h1 className={`mt-4 text-[25px] sm:text-[32px] font-semibold text-black/80 tracking-[0.22em] uppercase text-center ${heroInView ? 'animate-fadeInUp animation-delay-200' : 'opacity-0-animate'}`}>
              Give your galleries a calm, premium home.
            </h1>

            <p className={`mx-auto text-sm text-center sm:text-base text-black/75 max-w-2xl ${heroInView ? 'animate-fadeInUp animation-delay-300' : 'opacity-0-animate'}`}>
              Stop using WeTransfer and Google Drive. Artydrop gives you password-protected galleries 
              that feel as intentional as your images.
            </p>

            {/* Stats */}
            <div className={`flex flex-wrap items-center justify-center gap-6 text-xs text-black/60 pt-2 ${heroInView ? 'animate-fadeInUp animation-delay-400' : 'opacity-0-animate'}`}>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-black/80" />
                1,000+ galleries delivered
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-black/80" />
                99% satisfaction
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-black/80" />
                Try with just 1€
              </span>
            </div>

            {/* CTAs */}
            <div className={`flex flex-wrap justify-center gap-3 pt-2 ${heroInView ? 'animate-fadeInUp animation-delay-500' : 'opacity-0-animate'}`}>
              <Link href="/signup">
                <Button className="h-10 rounded-full px-6 bg-black text-white text-xs font-medium hover:bg-black/90 flex items-center gap-2 button-press">
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <button
                onClick={() => handleCheckout('trial-gallery')}
                disabled={isRedirecting || loading}
                className="h-10 rounded-full px-6 bg-white/60 backdrop-blur-sm border border-black/10 text-xs font-medium hover:bg-white/80 transition disabled:opacity-60 button-press"
              >
                Try 1€ gallery first
              </button>
            </div>
          </div>
        </section>

        {/* Gallery Preview Example - NEW VISUAL SECTION */}
        <section 
          ref={exampleRef}
          className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full"
        >
          <div className="max-w-5xl mx-auto">
            <div className={`text-center mb-10 ${exampleInView ? 'animate-fadeInUp' : 'opacity-0-animate'}`}>
              <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-black/60 mb-2">
                See it in action
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-black">
                Beautiful galleries your clients will love
              </h2>
            </div>

            {/* Mockup container */}
            <div className={`relative ${exampleInView ? 'animate-scaleIn animation-delay-200' : 'opacity-0-animate'}`}>
              {/* Browser window mockup */}
              <div className="rounded-2xl border border-black/20 bg-white/80 backdrop-blur-sm shadow-2xl overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-black/5 border-b border-black/10 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white/60 rounded-full px-3 py-1.5 text-[10px] text-black/50 text-center">
                      artydrop.com/g/your-gallery
                    </div>
                  </div>
                </div>

                {/* Gallery content placeholder */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 sm:p-10">
                  {/* Gallery header */}
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-black/80 mb-2">
                      Sarah & Mike's Wedding
                    </h3>
                    <p className="text-sm text-black/60">
                      June 15, 2025 • 247 photos
                    </p>
                  </div>

                  {/* Photo grid placeholder */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div 
                        key={i}
                        className="aspect-square rounded-lg skeleton image-hover-zoom relative group cursor-pointer"
                      >
                        {/* Placeholder for actual images */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-black/20" />
                        </div>
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                            <Eye className="w-4 h-4 text-black" />
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                            <Heart className="w-4 h-4 text-black" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap justify-center gap-3">
                    <button className="h-9 px-5 rounded-full bg-black text-white text-xs font-medium flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" />
                      Download All
                    </button>
                    <button className="h-9 px-5 rounded-full bg-white/60 border border-black/10 text-xs font-medium flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5" />
                      Favorites (12)
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating labels */}
              <div className="absolute -left-4 top-20 hidden lg:block float-gentle">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-black/10">
                  <div className="flex items-center gap-2 text-xs">
                    <Lock className="w-3.5 h-3.5 text-green-600" />
                    <span className="font-medium text-black/80">Password protected</span>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 bottom-20 hidden lg:block float-gentle" style={{ animationDelay: '1.5s' }}>
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-black/10">
                  <div className="flex items-center gap-2 text-xs">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-medium text-black/80">Real-time analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem/Solution Section - Animated */}
        <section 
          ref={problemRef}
          className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full"
        >
          <div className="max-w-5xl mx-auto">
            <h2 className={`text-center text-2xl sm:text-3xl font-semibold text-black mb-12 ${problemInView ? 'animate-fadeInUp' : 'opacity-0-animate'}`}>
              Stop the chaos. Start delivering like a pro.
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Before */}
              <div className={`rounded-2xl border-2 border-red-200 bg-red-50/80 p-6 card-lift ${problemInView ? 'animate-fadeInLeft animation-delay-200' : 'opacity-0-animate'}`}>
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-black/80 mb-3">Without Artydrop</h3>
                <ul className="space-y-2 text-sm text-black/70">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    WeTransfer links expire in 7 days
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    Google Drive folders = zero branding
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    No idea if clients viewed photos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    Clients download wrong files
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    Support emails = "link expired?"
                  </li>
                </ul>
              </div>

              {/* After */}
              <div className={`rounded-2xl border-2 border-green-200 bg-green-50/80 p-6 card-lift ${problemInView ? 'animate-fadeInRight animation-delay-200' : 'opacity-0-animate'}`}>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-black/80 mb-3">With Artydrop</h3>
                <ul className="space-y-2 text-sm text-black/70">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    Control exactly when galleries expire
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    Beautiful branded delivery experience
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    Track views, downloads, favorites
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    Password protection included
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    One link. Zero hassle.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Animated */}
        <section 
          ref={howItWorksRef}
          className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full"
        >
          <div className="max-w-5xl mx-auto">
            <div className={`text-center mb-12 ${howItWorksInView ? 'animate-fadeInUp' : 'opacity-0-animate'}`}>
              <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-black/60 mb-2">
                How it works
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-black">
                Three steps to perfection.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className={`text-center ${howItWorksInView ? 'animate-fadeInUp animation-delay-200' : 'opacity-0-animate'}`}>
                <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4 group hover:bg-black transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-black/60 group-hover:text-white transition-colors" />
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs font-bold mb-3">
                  1
                </div>
                <h3 className="text-lg font-semibold text-black/80 mb-2">Upload</h3>
                <p className="text-sm text-black/70">
                  Drag & drop your shoot. We handle compression and optimization automatically.
                </p>
              </div>

              {/* Step 2 */}
              <div className={`text-center ${howItWorksInView ? 'animate-fadeInUp animation-delay-300' : 'opacity-0-animate'}`}>
                <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4 group hover:bg-black transition-colors cursor-pointer">
                  <Settings className="w-8 h-8 text-black/60 group-hover:text-white transition-colors" />
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs font-bold mb-3">
                  2
                </div>
                <h3 className="text-lg font-semibold text-black/80 mb-2">Customize</h3>
                <p className="text-sm text-black/70">
                  Add password, set expiration, enable downloads. Takes 30 seconds.
                </p>
              </div>

              {/* Step 3 */}
              <div className={`text-center ${howItWorksInView ? 'animate-fadeInUp animation-delay-400' : 'opacity-0-animate'}`}>
                <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4 group hover:bg-black transition-colors cursor-pointer">
                  <Share2 className="w-8 h-8 text-black/60 group-hover:text-white transition-colors" />
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs font-bold mb-3">
                  3
                </div>
                <h3 className="text-lg font-semibold text-black/80 mb-2">Share</h3>
                <p className="text-sm text-black/70">
                  Send one beautiful link. Clients view, favorite, and download. Done.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features - Animated */}
        <section 
          ref={featuresRef}
          className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full bg-white/20 border-y border-black/10"
        >
          <div className="max-w-5xl mx-auto">
            <div className={`text-center mb-12 ${featuresInView ? 'animate-fadeInUp' : 'opacity-0-animate'}`}>
              <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-black/60 mb-2">
                Features
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-black">
                Everything you need. Nothing you don't.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Lock, title: "Password Protected", desc: "Keep your work private. Only invited clients can access.", delay: 100 },
                { icon: Clock, title: "Expiration Control", desc: "Set custom expiry dates. Extend anytime with one click.", delay: 200 },
                { icon: ImageIcon, title: "Watermark Ready", desc: "Auto-apply watermarks to previews. Downloads stay clean.", delay: 300 },
                { icon: Download, title: "Download Control", desc: "Enable or disable downloads per gallery. Track every file.", delay: 400 },
                { icon: BarChart3, title: "Analytics", desc: "See exactly who viewed what and when. Export reports.", delay: 500 },
                { icon: Smartphone, title: "Mobile Optimized", desc: "Perfect on any device. Your clients view on phones, tablets, desktop.", delay: 600 }
              ].map((feature, idx) => (
                <div 
                  key={idx}
                  className={`rounded-2xl border border-black/10 bg-[#FDF9F3]/90 p-6 card-lift ${featuresInView ? `animate-fadeInUp animation-delay-${feature.delay}` : 'opacity-0-animate'}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-black/60" />
                  </div>
                  <h3 className="text-sm font-semibold text-black/80 mb-2">{feature.title}</h3>
                  <p className="text-xs text-black/70">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section - Animated */}
        <section 
          ref={pricingRef}
          id="pricing" 
          className="relative py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full"
        >
          <div className="max-w-5xl mx-auto">
            <div className={`text-center mb-10 ${pricingInView ? 'animate-fadeInUp' : 'opacity-0-animate'}`}>
              <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-black/60 mb-2">
                Pricing
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-black mb-3">
                Choose how you deliver.
              </h2>
              <p className="text-sm text-black/70 max-w-xl mx-auto mb-6">
                Pay per gallery when starting out, or go monthly when busy season hits.
              </p>

              {/* Billing toggle */}
              <div className="inline-flex items-center gap-3 p-1 rounded-full bg-white/60 backdrop-blur-sm border border-black/10">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-black text-white'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    billingCycle === 'yearly'
                      ? 'bg-black text-white'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  Yearly
                  <span className="ml-1 text-[10px] text-amber-600 font-semibold">-20%</span>
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 mb-12">
              {/* Pay as you go */}
              <div className={`relative rounded-3xl border border-black/10 bg-[#FDF9F3]/90 shadow-sm p-6 flex flex-col justify-between card-lift ${pricingInView ? 'animate-fadeInUp animation-delay-200' : 'opacity-0-animate'}`}>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/80">
                    Pay as you go
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-black">€4.90</span>
                    <span className="text-xs text-black/60">/ gallery</span>
                  </div>
                  <p className="text-sm text-black/70">
                    No monthly commitment. Perfect for occasional shoots.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-black/75">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      Up to 200 photos per gallery
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      Password & expiration control
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      Download management
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      6 months hosting included
                    </li>
                  </ul>
                </div>
                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleCheckout('payg')}
                    className="w-full h-10 rounded-full bg-black text-white text-xs font-medium hover:bg-black/90 transition disabled:opacity-60 button-press"
                    disabled={isRedirecting || loading}
                  >
                    Get started — Pay per gallery
                  </button>
                  <p className="text-[10px] text-center text-black/60">
                    ✓ Cancel anytime • No subscription
                  </p>
                </div>
              </div>

              {/* Studio – Most Popular */}
              <div className={`relative rounded-3xl border-2 border-black/80 bg-[#F8F3EB] shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-6 flex flex-col justify-between transform hover:scale-105 transition-transform ${pricingInView ? 'animate-scaleIn animation-delay-300' : 'opacity-0-animate'}`}>
                {/* Most popular badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 shadow-lg">
                    <Star className="w-3 h-3 text-white fill-white" />
                    <span className="text-[10px] tracking-[0.18em] uppercase text-white font-bold">
                      Most Popular
                    </span>
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/80">
                    Studio
                  </p>
                  <div className="flex items-baseline gap-1">
                    {billingCycle === 'yearly' ? (
                      <>
                        <span className="text-3xl font-semibold text-black">€15</span>
                        <span className="text-xs text-black/60">/ month</span>
                        <span className="ml-2 text-[10px] line-through text-black/40">€19</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-semibold text-black">€19</span>
                        <span className="text-xs text-black/60">/ month</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-black/70">
                    For busy photographers who deliver 4-5+ galleries monthly.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-black/75">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      10 active galleries
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      100 GB storage
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      Unlimited downloads & favorites
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      Analytics & tracking
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      Priority email support
                    </li>
                  </ul>
                </div>
                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleCheckout('studio')}
                    className="w-full h-10 rounded-full bg-black text-white text-xs font-medium hover:bg-black/90 transition disabled:opacity-60 flex items-center justify-center gap-2 button-press"
                    disabled={isRedirecting || loading}
                  >
                    <Zap className="w-4 h-4" />
                    Start Studio plan
                  </button>
                  <p className="text-[10px] text-center text-black/60">
                    ✓ Cancel anytime • 14-day money back
                  </p>
                </div>
              </div>

              {/* Pro (coming soon) */}
              <div className={`relative rounded-3xl border border-black/10 bg-[#FDF9F3]/70 p-6 flex flex-col justify-between opacity-80 ${pricingInView ? 'animate-fadeInUp animation-delay-400' : 'opacity-0-animate'}`}>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/60">
                    Pro (coming soon)
                  </p>
                  <div className="flex items-baseline gap-1">
                    {billingCycle === 'yearly' ? (
                      <>
                        <span className="text-3xl font-semibold text-black">€31</span>
                        <span className="text-xs text-black/60">/ month</span>
                        <span className="ml-2 text-[10px] line-through text-black/40">€39</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-semibold text-black">€39</span>
                        <span className="text-xs text-black/60">/ month</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-black/70">
                    For studios with teams, white-label needs, and high volume.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-black/75">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      Unlimited galleries
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      1 TB storage
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      Team accounts & roles
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      White-label branding
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black/60 mt-0.5 flex-shrink-0" />
                      API access & SLAs
                    </li>
                  </ul>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    disabled
                    className="w-full h-10 rounded-full border border-black/20 text-xs text-black/50 cursor-default"
                  >
                    Join waitlist soon
                  </button>
                </div>
              </div>
            </div>

            {/* Trial strip */}
            <div className={`mt-10 rounded-2xl border border-black/10 bg-black/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 ${pricingInView ? 'animate-fadeInUp animation-delay-500' : 'opacity-0-animate'}`}>
              <div>
                <p className="text-sm font-medium text-black/80 mb-1">
                  Not sure yet? Try with a real client first.
                </p>
                <p className="text-xs text-black/60">
                  Send one actual gallery for <span className="font-semibold">€1</span>, then decide if Artydrop is for you.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCheckout('trial-gallery')}
                className="flex-shrink-0 h-9 px-5 rounded-full bg-black text-white text-xs font-medium hover:bg-black/90 disabled:opacity-60 whitespace-nowrap button-press"
                disabled={isRedirecting || loading}
              >
                Test with 1 gallery — €1
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials - Animated */}
        <section 
          ref={testimonialsRef}
          className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full"
        >
          <div className="max-w-5xl mx-auto">
            <div className={`text-center mb-12 ${testimonialsInView ? 'animate-fadeInUp' : 'opacity-0-animate'}`}>
              <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-black/60 mb-2">
                Testimonials
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-black">
                Loved by photographers worldwide.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  text: "Absolute game changer for my wedding business. Clients love the clean interface, and I save hours every week.",
                  name: "Sarah Martinez",
                  role: "Wedding Photographer, Paris",
                  gradient: "from-purple-400 to-pink-500",
                  delay: 200
                },
                {
                  text: "Finally ditched WeTransfer. The password protection and expiration control are exactly what I needed.",
                  name: "Marc Dubois",
                  role: "Portrait Photographer, Lyon",
                  gradient: "from-blue-400 to-cyan-500",
                  delay: 300
                },
                {
                  text: "My clients think I'm so professional now. The delivery experience is on par with my actual photography.",
                  name: "Emma Laurent",
                  role: "Commercial Photographer, Nice",
                  gradient: "from-green-400 to-emerald-500",
                  delay: 400
                }
              ].map((testimonial, idx) => (
                <div 
                  key={idx}
                  className={`rounded-2xl border border-black/10 bg-[#FDF9F3]/90 p-6 card-lift ${testimonialsInView ? `animate-fadeInUp animation-delay-${testimonial.delay}` : 'opacity-0-animate'}`}
                >
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm text-black/80 mb-4">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient}`} />
                    <div>
                      <p className="text-xs font-semibold text-black/80">{testimonial.name}</p>
                      <p className="text-[10px] text-black/60">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full border-t border-black/10">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-black/60 mb-2">
                FAQ
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-black">
                Questions? Answered.
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-black/10 bg-white/60 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-black/5 transition-colors"
                  >
                    <span className="text-sm font-medium text-black/80 pr-4">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-black/40 flex-shrink-0 transition-transform ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4 text-sm text-black/70 leading-relaxed animate-fadeInUp">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full border-t border-black/10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-semibold text-black/90">
              Ready to deliver like a pro?
            </h2>
            <p className="text-lg text-black/70">
              Join 200+ photographers who've already upgraded their client experience.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button className="h-12 px-8 rounded-full bg-black text-white text-sm font-medium hover:bg-black/90 flex items-center gap-2 button-press">
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <button
                onClick={() => handleCheckout('trial-gallery')}
                disabled={isRedirecting || loading}
                className="h-12 px-8 rounded-full bg-white/60 backdrop-blur-sm border border-black/10 text-sm font-medium hover:bg-white/80 transition disabled:opacity-60 button-press"
              >
                Try with €1 gallery
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 border-t border-black/10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-black/60">
              <div className="flex items-center gap-6">
                <span className="tracking-[0.18em] uppercase">ARTYDROP</span>
                <span>© 2026 All rights reserved</span>
              </div>
              <div className="flex items-center gap-6">
                <Link href="/terms" className="hover:text-black transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-black transition-colors">
                  Privacy
                </Link>
                <Link href="/contact" className="hover:text-black transition-colors">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
