'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
  Zap
} from 'lucide-react'
import { useAuth } from './providers'

export default function HomePage() {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [billingCycle, setBillingCycle] = useState('monthly') // monthly or yearly
  const [openFaq, setOpenFaq] = useState(null)
  const router = useRouter()
  const { user, loading } = useAuth()

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
    },
    {
      q: "What payment methods do you accept?",
      a: "All major credit cards via Stripe. Safe, secure, and encrypted."
    },
    {
      q: "Do I need technical skills?",
      a: "Not at all. If you can use email, you can use Artydrop. Upload, share, done."
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
            <div className="inline-flex items-center justify-center px-4 py-2 border border-black/80 rounded-[999px] bg-black/5 backdrop-blur-sm">
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
                  <Button className="h-8 rounded-full px-4 bg-black text-white hover:bg-black/90 text-[11px]">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-black/80 hover:text-black">
                  Log in
                </Link>
                <Link href="/signup">
                  <Button className="h-8 rounded-full px-4 bg-black text-white hover:bg-black/90 text-[11px]">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="mt-14 sm:mt-20 mb-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Social proof badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-black/10">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-teal-500 border-2 border-white" />
                </div>
                <span className="text-[11px] text-black/70">
                  Trusted by <span className="font-semibold">500+ photographers</span>
                </span>
              </div>
            </div>

            <p className="text-[15px] font-medium text-center tracking-[0.22em] uppercase text-black/60">
              Professional Photo Delivery
            </p>

            {/* Main title with animation */}
            <h1 className="tagline-aura mt-4 text-[25px] font-semibold text-black/80 tracking-[0.22em] uppercase whitespace-nowrap text-center animate-[float_6s_ease-in-out_infinite]">
              Give your galleries a calm, premium home.
            </h1>

            <p className="mx-auto text-sm text-center sm:text-base text-black/75 max-w-2xl">
              Stop using WeTransfer and Google Drive. Artydrop gives you password-protected galleries 
              that feel as intentional as your images.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-black/60 pt-2">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-black/80" />
                12,000+ galleries delivered
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-black/80" />
                98% satisfaction
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-black/80" />
                No credit card required
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/signup">
                <Button className="h-10 rounded-full px-6 bg-black text-white text-xs font-medium hover:bg-black/90 flex items-center gap-2">
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <button
                onClick={() => handleCheckout('trial-gallery')}
                disabled={isRedirecting || loading}
                className="h-10 rounded-full px-6 bg-white/60 backdrop-blur-sm border border-black/10 text-xs font-medium hover:bg-white/80 transition disabled:opacity-60"
              >
                Try 1€ gallery first
              </button>
            </div>
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center text-2xl sm:text-3xl font-semibold text-black mb-12">
              Stop the chaos. Start delivering like a pro.
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Before */}
              <div className="rounded-2xl border-2 border-red-200 bg-red-50/80 p-6">
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
              <div className="rounded-2xl border-2 border-green-200 bg-green-50/80 p-6">
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

        {/* How It Works */}
        <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-black/60 mb-2">
                How it works
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-black">
                Three steps to perfection.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4 group hover:bg-black transition-colors">
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
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4 group hover:bg-black transition-colors">
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
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4 group hover:bg-black transition-colors">
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

        {/* Key Features */}
        <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full bg-white/20 border-y border-black/10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-black/60 mb-2">
                Features
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-black">
                Everything you need. Nothing you don't.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-black/10 bg-[#FDF9F3]/90 p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-black/60" />
                </div>
                <h3 className="text-sm font-semibold text-black/80 mb-2">Password Protected</h3>
                <p className="text-xs text-black/70">
                  Keep your work private. Only invited clients can access.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-black/10 bg-[#FDF9F3]/90 p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-black/60" />
                </div>
                <h3 className="text-sm font-semibold text-black/80 mb-2">Expiration Control</h3>
                <p className="text-xs text-black/70">
                  Set custom expiry dates. Extend anytime with one click.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-black/10 bg-[#FDF9F3]/90 p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-4">
                  <ImageIcon className="w-6 h-6 text-black/60" />
                </div>
                <h3 className="text-sm font-semibold text-black/80 mb-2">Watermark Ready</h3>
                <p className="text-xs text-black/70">
                  Auto-apply watermarks to previews. Downloads stay clean.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-2xl border border-black/10 bg-[#FDF9F3]/90 p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-black/60" />
                </div>
                <h3 className="text-sm font-semibold text-black/80 mb-2">Download Control</h3>
                <p className="text-xs text-black/70">
                  Enable or disable downloads per gallery. Track every file.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-2xl border border-black/10 bg-[#FDF9F3]/90 p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-black/60" />
                </div>
                <h3 className="text-sm font-semibold text-black/80 mb-2">Analytics</h3>
                <p className="text-xs text-black/70">
                  See exactly who viewed what and when. Export reports.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-2xl border border-black/10 bg-[#FDF9F3]/90 p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-black/60" />
                </div>
                <h3 className="text-sm font-semibold text-black/80 mb-2">Mobile Optimized</h3>
                <p className="text-xs text-black/70">
                  Perfect on any device. Your clients view on phones, tablets, desktop.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="relative py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
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
              <div className="relative rounded-3xl border border-black/10 bg-[#FDF9F3]/90 shadow-sm p-6 flex flex-col justify-between hover:shadow-xl transition-shadow">
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
                    className="w-full h-10 rounded-full bg-black text-white text-xs font-medium hover:bg-black/90 transition disabled:opacity-60"
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
              <div className="relative rounded-3xl border-2 border-black/80 bg-[#F8F3EB] shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-6 flex flex-col justify-between transform hover:scale-105 transition-transform">
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
                    className="w-full h-10 rounded-full bg-black text-white text-xs font-medium hover:bg-black/90 transition disabled:opacity-60 flex items-center justify-center gap-2"
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
              <div className="relative rounded-3xl border border-black/10 bg-[#FDF9F3]/70 p-6 flex flex-col justify-between opacity-80">
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

            {/* Feature Comparison Table */}
            <div className="rounded-2xl border border-black/10 bg-white/60 backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-black/10">
                <h3 className="text-sm font-semibold text-black/80">Feature comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="text-left p-4 font-medium text-black/60">Feature</th>
                      <th className="text-center p-4 font-medium text-black/60">Pay-as-you-go</th>
                      <th className="text-center p-4 font-medium text-black/60 bg-amber-50/50">Studio</th>
                      <th className="text-center p-4 font-medium text-black/60">Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black/10">
                      <td className="p-4 text-black/70">Active galleries</td>
                      <td className="p-4 text-center text-black/70">1 per purchase</td>
                      <td className="p-4 text-center text-black/70 bg-amber-50/50">10</td>
                      <td className="p-4 text-center text-black/70">Unlimited</td>
                    </tr>
                    <tr className="border-b border-black/10">
                      <td className="p-4 text-black/70">Storage</td>
                      <td className="p-4 text-center text-black/70">10 GB</td>
                      <td className="p-4 text-center text-black/70 bg-amber-50/50">100 GB</td>
                      <td className="p-4 text-center text-black/70">1 TB</td>
                    </tr>
                    <tr className="border-b border-black/10">
                      <td className="p-4 text-black/70">Photos per gallery</td>
                      <td className="p-4 text-center text-black/70">200</td>
                      <td className="p-4 text-center text-black/70 bg-amber-50/50">Unlimited</td>
                      <td className="p-4 text-center text-black/70">Unlimited</td>
                    </tr>
                    <tr className="border-b border-black/10">
                      <td className="p-4 text-black/70">Password protection</td>
                      <td className="p-4 text-center"><Check className="w-4 h-4 text-green-600 mx-auto" /></td>
                      <td className="p-4 text-center bg-amber-50/50"><Check className="w-4 h-4 text-green-600 mx-auto" /></td>
                      <td className="p-4 text-center"><Check className="w-4 h-4 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-black/10">
                      <td className="p-4 text-black/70">Analytics</td>
                      <td className="p-4 text-center text-black/40">–</td>
                      <td className="p-4 text-center bg-amber-50/50"><Check className="w-4 h-4 text-green-600 mx-auto" /></td>
                      <td className="p-4 text-center"><Check className="w-4 h-4 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-black/10">
                      <td className="p-4 text-black/70">Team accounts</td>
                      <td className="p-4 text-center text-black/40">–</td>
                      <td className="p-4 text-center text-black/40 bg-amber-50/50">–</td>
                      <td className="p-4 text-center"><Check className="w-4 h-4 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 text-black/70">Support</td>
                      <td className="p-4 text-center text-black/70">Email</td>
                      <td className="p-4 text-center text-black/70 bg-amber-50/50">Priority</td>
                      <td className="p-4 text-center text-black/70">Priority + SLA</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trial strip */}
            <div className="mt-10 rounded-2xl border border-black/10 bg-black/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                className="flex-shrink-0 h-9 px-5 rounded-full bg-black text-white text-xs font-medium hover:bg-black/90 disabled:opacity-60 whitespace-nowrap"
                disabled={isRedirecting || loading}
              >
                Test with 1 gallery — €1
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-black/60 mb-2">
                Testimonials
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-black">
                Loved by photographers worldwide.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Testimonial 1 */}
              <div className="rounded-2xl border border-black/10 bg-[#FDF9F3]/90 p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-black/80 mb-4">
                  "Absolute game changer for my wedding business. Clients love the clean interface, 
                  and I save hours every week."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500" />
                  <div>
                    <p className="text-xs font-semibold text-black/80">Sarah Martinez</p>
                    <p className="text-[10px] text-black/60">Wedding Photographer, Paris</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="rounded-2xl border border-black/10 bg-[#FDF9F3]/90 p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-black/80 mb-4">
                  "Finally ditched WeTransfer. The password protection and expiration control 
                  are exactly what I needed."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500" />
                  <div>
                    <p className="text-xs font-semibold text-black/80">Marc Dubois</p>
                    <p className="text-[10px] text-black/60">Portrait Photographer, Lyon</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="rounded-2xl border border-black/10 bg-[#FDF9F3]/90 p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-black/80 mb-4">
                  "My clients think I'm so professional now. The delivery experience is 
                  on par with my actual photography."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-black/80">Emma Chen</p>
                    <p className="text-[10px] text-black/60">Commercial Photographer, Berlin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
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
                  className="rounded-xl border border-black/10 bg-[#FDF9F3]/90 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-black/80 pr-4">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-black/60 flex-shrink-0 transition-transform ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4 text-sm text-black/70">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          <div className="max-w-3xl mx-auto text-center">
            <div className="rounded-3xl border-2 border-black/80 bg-[#F8F3EB] shadow-2xl p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-black mb-4">
                Ready to upgrade your client experience?
              </h2>
              <p className="text-sm text-black/70 mb-8 max-w-xl mx-auto">
                Join 500+ photographers who stopped worrying about photo delivery.
                Start with a €1 test gallery today.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <Link href="/signup">
                  <Button className="w-full sm:w-auto h-12 rounded-full px-8 bg-black text-white text-sm font-medium hover:bg-black/90 flex items-center gap-2">
                    Get started free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <button
                  onClick={() => handleCheckout('trial-gallery')}
                  disabled={isRedirecting || loading}
                  className="w-full sm:w-auto h-12 rounded-full px-8 bg-white/60 backdrop-blur-sm border border-black/10 text-sm font-medium hover:bg-white/80 transition disabled:opacity-60"
                >
                  Try €1 gallery first
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-black/60">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-black/80" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-black/80" />
                  Setup in 5 minutes
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-black/80" />
                  14-day money back
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-[11px] text-black/60 border-t border-black/10 bg-[#F5F0EA]/95">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <span>© {new Date().getFullYear()} Artydrop. All rights reserved.</span>
              <div className="flex gap-6">
                <Link href="/terms" className="hover:text-black transition-colors">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="hover:text-black transition-colors">
                  Privacy Policy
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
