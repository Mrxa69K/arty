'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase' 
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  Check, 
  Lock, 
  Download, 
  BarChart3,
  ChevronDown,
  Eye,
  Camera,
  Layers,
  Shield,
  Clock,
  Users
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
  const [demoRef, demoInView] = useInView()
  const [featuresRef, featuresInView] = useInView()
  const [pricingRef, pricingInView] = useInView()
  const [faqRef, faqInView] = useInView()

  const handleCheckout = async (plan) => {
    if (loading) return
    
    try {
      setIsRedirecting(true)
      
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        localStorage.setItem('pending_plan', plan)
        router.push('/signup')
        return
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        alert('Please log in again')
        router.push('/login')
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ plan }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        alert('Checkout failed: ' + (error?.error || 'Please try again'))
        setIsRedirecting(false)
        return
      }

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Checkout failed. Please try again.')
        setIsRedirecting(false)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Something went wrong. Please try again.')
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
      a: "Clients view optimized previews for faster loading, but downloads are always full resolution originals."
    },
    {
      q: "Can I cancel my Studio plan anytime?",
      a: "Yes, absolutely. No contracts, no questions asked. Your galleries remain accessible for 30 days after cancellation."
    },
    {
      q: "Do you offer refunds?",
      a: "Yes. If you're not satisfied within 14 days, we'll refund you in full."
    },
    {
      q: "Is there a setup fee?",
      a: "No. You can start uploading immediately after signup. No hidden costs."
    }
  ]

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed] relative overflow-hidden">
      
      {/* ============================================
          HEADER
          ============================================ */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="group" data-testid="logo-link">
            <span className="font-display text-xl tracking-tight text-white/90 group-hover:text-white transition-colors">
              ArtyDrop
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-body">
            <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }} className="text-white/50 hover:text-white transition-colors">Features</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) }} className="text-white/50 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }) }} className="text-white/50 hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-9 bg-white/5 rounded animate-pulse" />
            ) : user ? (
              <Link href="/dashboard" data-testid="dashboard-link">
                <Button className="h-10 px-6 bg-white text-black hover:bg-white/90 rounded-sm font-body text-sm font-medium">
                  Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors font-body" data-testid="login-link">
                  Log in
                </Link>
                <Link href="/signup" data-testid="signup-link">
                  <Button className="h-10 px-6 bg-white text-black hover:bg-white/90 rounded-sm font-body text-sm font-medium">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-6 lg:px-12 pt-24"
      >
        {/* Hero background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Tagline */}
          <div className={`mb-8 ${heroInView ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <span className="inline-block px-4 py-2 text-xs tracking-[0.2em] uppercase text-gold font-body font-medium border border-gold/30 rounded-sm">
              For Professional Photographers
            </span>
          </div>

          {/* Main headline */}
          <h1 className={`font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight mb-8 ${heroInView ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
            Deliver your work
            <br />
            <span className="italic text-gold">the way it deserves</span>
          </h1>

          {/* Sub-headline */}
          <p className={`font-body text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed ${heroInView ? 'animate-fadeInUp delay-200' : 'opacity-0'}`}>
            Stop sending WeTransfer links. ArtyDrop gives your galleries a premium home that matches the quality of your photography. Pay only for what you use.
          </p>

          {/* CTAs */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${heroInView ? 'animate-fadeInUp delay-300' : 'opacity-0'}`}>
            <button
              onClick={() => {
                if (user) {
                  handleCheckout('payg')
                } else {
                  router.push('/signup')
                }
              }}
              disabled={isRedirecting || loading}
              className="h-14 px-10 bg-white text-black font-body font-semibold text-sm rounded-sm hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-3 btn-press"
              data-testid="cta-payg"
            >
              Start for 4.90 / gallery
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <a 
              href="#demo"
              className="h-14 px-10 border border-white/20 text-white font-body font-medium text-sm rounded-sm hover:bg-white/5 transition-all flex items-center gap-3"
              data-testid="cta-demo"
            >
              See a live gallery
            </a>
          </div>

          {/* Trust indicators */}
          <div className={`mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-white/40 font-body ${heroInView ? 'animate-fadeInUp delay-400' : 'opacity-0'}`}>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gold" strokeWidth={1.5} />
              No subscription required
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gold" strokeWidth={1.5} />
              14-day money back
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gold" strokeWidth={1.5} />
              1,200+ galleries delivered
            </span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-float">
          <ChevronDown className="w-6 h-6 text-white/30" strokeWidth={1} />
        </div>
      </section>

      {/* ============================================
          WHAT IS ARTYDROP SECTION
          ============================================ */}
      <section className="py-32 px-6 lg:px-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-gold font-body font-medium mb-6">
                What is ArtyDrop?
              </p>
              <h2 className="font-display text-4xl md:text-5xl leading-tight mb-8">
                A premium delivery platform built for photographers
              </h2>
              <div className="space-y-6 text-white/60 font-body leading-relaxed">
                <p>
                  ArtyDrop is how professional photographers deliver their work to clients. Instead of generic file-sharing services, you get beautiful, password-protected galleries that reflect the quality of your craft.
                </p>
                <p>
                  <span className="text-white font-medium">Pay-as-you-go pricing</span> means you only pay when you deliver. No monthly fees eating into your margins during slow months. Create a gallery, upload your photos, share the link. That's it.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-[4/3] rounded-sm overflow-hidden border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80"
                  alt="Wedding photography"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-6 -left-6 bg-[#121212] border border-white/10 p-6 rounded-sm">
                <p className="text-3xl font-display text-gold mb-1">4.90</p>
                <p className="text-sm text-white/50 font-body">per gallery, no subscription</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          GALLERY DEMO SECTION
          ============================================ */}
      <section 
        ref={demoRef}
        id="demo"
        className="py-32 px-6 lg:px-12 bg-[#080808]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className={`text-xs tracking-[0.2em] uppercase text-gold font-body font-medium mb-6 ${demoInView ? 'animate-fadeInUp' : 'opacity-0'}`}>
              See it in action
            </p>
            <h2 className={`font-display text-4xl md:text-5xl leading-tight ${demoInView ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
              What your clients see
            </h2>
          </div>

          {/* Browser mockup */}
          <div className={`${demoInView ? 'animate-scaleIn delay-200' : 'opacity-0'}`}>
            <div className="relative mx-auto max-w-5xl">
              {/* Browser chrome */}
              <div className="bg-[#1a1a1a] border border-white/10 rounded-t-sm px-4 py-3 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-[#0a0a0a] rounded-sm px-4 py-2 text-xs text-white/40 font-mono text-center">
                    artydrop.com/g/sarah-wedding-2025
                  </div>
                </div>
              </div>

              {/* Gallery content */}
              <div className="bg-[#0f0f0f] border-x border-b border-white/10 rounded-b-sm p-8 md:p-12">
                {/* Gallery header */}
                <div className="text-center mb-12">
                  <h3 className="font-display text-3xl md:text-4xl text-white mb-4">
                    Sarah & James Wedding
                  </h3>
                  <div className="flex items-center justify-center gap-4 text-sm text-white/50 font-body">
                    <span className="flex items-center gap-2">
                      <Camera className="w-4 h-4" strokeWidth={1.5} />
                      247 photos
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>June 15, 2025</span>
                  </div>
                </div>

                {/* Photo grid */}
                <div className="grid grid-cols-3 gap-2 mb-8">
                  {[
                    'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
                    'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&q=80',
                    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80',
                    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80',
                    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80',
                    'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&q=80',
                  ].map((src, i) => (
                    <div 
                      key={i}
                      className="aspect-square overflow-hidden rounded-sm image-hover-zoom"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>

                {/* Download button */}
                <div className="flex justify-center">
                  <button className="h-12 px-8 bg-white text-black font-body font-medium text-sm rounded-sm flex items-center gap-3">
                    <Download className="w-4 h-4" strokeWidth={1.5} />
                    Download All Photos
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-6">
            {[
              { icon: Lock, text: 'Password protected' },
              { icon: Download, text: 'Full resolution downloads' },
              { icon: Eye, text: 'View tracking' },
            ].map((item, i) => (
              <div 
                key={i}
                className={`flex items-center gap-3 px-5 py-3 bg-[#121212] border border-white/10 rounded-sm ${demoInView ? 'animate-fadeInUp' : 'opacity-0'}`}
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <item.icon className="w-4 h-4 text-gold" strokeWidth={1.5} />
                <span className="text-sm text-white/70 font-body">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FEATURES SECTION
          ============================================ */}
      <section 
        ref={featuresRef}
        id="features"
        className="py-32 px-6 lg:px-12 border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className={`text-xs tracking-[0.2em] uppercase text-gold font-body font-medium mb-6 ${featuresInView ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Built for photographers
            </p>
            <h2 className={`font-display text-4xl md:text-5xl leading-tight max-w-3xl mx-auto ${featuresInView ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
              Everything you need to deliver professionally
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Shield,
                title: 'Secure by default',
                description: 'Every gallery can be password-protected with customizable expiration dates. Your work stays private until you decide otherwise.'
              },
              {
                icon: BarChart3,
                title: 'Know when they view',
                description: 'Real-time analytics show you exactly when clients open their gallery, which photos they favorite, and what they download.'
              },
              {
                icon: Layers,
                title: 'Curated themes',
                description: 'Choose from gallery themes designed for different shoots - weddings, portraits, concerts, architecture. Each theme changes layout, not just colors.'
              },
              {
                icon: Clock,
                title: 'Pay only when you deliver',
                description: 'No monthly fees during slow months. Create a gallery when you have photos to deliver, pay per gallery. Simple.'
              },
            ].map((feature, i) => (
              <div 
                key={i}
                className={`p-8 md:p-10 bg-[#121212] border border-white/5 rounded-sm hover:border-white/10 transition-colors ${featuresInView ? 'animate-fadeInUp' : 'opacity-0'}`}
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                <feature.icon className="w-6 h-6 text-gold mb-6" strokeWidth={1.5} />
                <h3 className="font-display text-xl mb-4 text-white">{feature.title}</h3>
                <p className="text-white/50 font-body leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          PRICING SECTION
          ============================================ */}
      <section 
        ref={pricingRef}
        id="pricing"
        className="py-32 px-6 lg:px-12 bg-[#080808]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className={`text-xs tracking-[0.2em] uppercase text-gold font-body font-medium mb-6 ${pricingInView ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Simple pricing
            </p>
            <h2 className={`font-display text-4xl md:text-5xl leading-tight mb-6 ${pricingInView ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
              Pay for what you use
            </h2>
            <p className={`text-white/50 font-body max-w-xl mx-auto ${pricingInView ? 'animate-fadeInUp delay-200' : 'opacity-0'}`}>
              No monthly commitment. Start with pay-as-you-go, upgrade when your volume grows.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Pay as you go - HIGHLIGHTED */}
            <div className={`relative lg:col-span-2 ${pricingInView ? 'animate-fadeInUp delay-300' : 'opacity-0'}`}>
              <div className="absolute -inset-px bg-gradient-to-b from-gold/30 to-transparent rounded-sm" />
              <div className="relative bg-[#0f0f0f] border border-gold/30 rounded-sm p-8 md:p-10 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 text-xs tracking-wider uppercase bg-gold/20 text-gold rounded-sm font-body font-medium">
                    Most Popular
                  </span>
                </div>
                
                <h3 className="font-display text-2xl mb-2">Pay as you go</h3>
                
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="font-display text-5xl text-gold">4.90€</span>
                  <span className="text-white/50 font-body">/ gallery</span>
                </div>
                
                <p className="text-white/50 font-body mb-8 leading-relaxed">
                  Perfect for photographers who deliver occasionally. No subscription, no extrafees. Pay only when you have photos to share.
                </p>
                
                <ul className="space-y-4 mb-10">
                  {[
                    'Up to 200 photos per gallery',
                    'Password & expiration control',
                    'Full resolution downloads',
                    '3 months storage included',
                    'Basic view analytics',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-body">
                      <Check className="w-4 h-4 text-gold flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-white/70">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <button
  onClick={() => handleCheckout('payg')}
  disabled={isRedirecting || loading}
  className="w-full h-14 bg-white text-black border border-gray-300 font-body font-semibold text-sm rounded-sm hover:bg-gray-100 transition-all disabled:opacity-50 btn-press"
  data-testid="pricing-payg-btn"
>
  Get started
</button>
              </div>
            </div>

            {/* Studio Plan */}
            <div className={`${pricingInView ? 'animate-fadeInUp delay-400' : 'opacity-0'}`}>
              <div className="bg-[#121212] border border-white/10 rounded-sm p-8 h-full flex flex-col">
                <h3 className="font-display text-2xl mb-2">Studio</h3>
                
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="font-display text-4xl">19€</span>
                  <span className="text-white/50 font-body">/ month</span>
                </div>
                
                <p className="text-white/50 font-body mb-8 leading-relaxed text-sm">
                  For busy photographers delivering 4+ galleries monthly.
                </p>
                
                <ul className="space-y-3 mb-10 flex-1">
                  {[
                    'Unlimited galleries',
                    '100 GB storage',
                    'Advanced analytics',
                    '6 months hosting',
                    'Priority support',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-body">
                      <Check className="w-4 h-4 text-white/40 flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-white/60">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleCheckout('studio')}
                  disabled={isRedirecting || loading}
                  className="w-full h-12 border border-white/20 text-white font-body font-medium text-sm rounded-sm hover:bg-white/5 transition-all disabled:opacity-50"
                  data-testid="pricing-studio-btn"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Test drive option */}
          <div className={`mt-8 ${pricingInView ? 'animate-fadeInUp delay-500' : 'opacity-0'}`}>
            <div className="bg-[#121212] border border-white/5 rounded-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-display text-lg mb-2">Not sure yet?</h4>
                <p className="text-sm text-white/50 font-body">
                  Test with one real gallery for 1€. Limited to 20 photos, expires in 7 days.
                </p>
              </div>
              <button
  onClick={() => handleCheckout('trial-gallery')}
  disabled={isRedirecting || loading}
  className="h-11 px-6 bg-white text-black border border-gray-300 font-body text-sm rounded-sm hover:bg-gray-100 transition-all whitespace-nowrap disabled:opacity-50"
  data-testid="pricing-trial-btn"
>
  Try for 1€
</button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FAQ SECTION
          ============================================ */}
      <section 
        ref={faqRef}
        id="faq"
        className="py-32 px-6 lg:px-12 border-t border-white/5"
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className={`text-xs tracking-[0.2em] uppercase text-gold font-body font-medium mb-6 ${faqInView ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Questions
            </p>
            <h2 className={`font-display text-4xl md:text-5xl leading-tight ${faqInView ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
              Frequently asked
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i}
                className={`border-b border-white/10 ${faqInView ? 'animate-fadeInUp' : 'opacity-0'}`}
                style={{ animationDelay: `${200 + i * 50}ms` }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full py-6 flex items-center justify-between text-left group"
                  data-testid={`faq-${i}`}
                >
                  <span className="font-body text-white group-hover:text-white/80 transition-colors pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    strokeWidth={1.5}
                  />
                </button>
                {openFaq === i && (
                  <div className="pb-6 text-white/50 font-body leading-relaxed animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="py-16 px-6 lg:px-12 border-t border-white/5 bg-[#080808]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="font-display text-xl text-white/80">ArtyDrop</span>
              <p className="text-sm text-white/40 font-body mt-2">
                Premium photo delivery for photographers
              </p>
            </div>
            
            <div className="flex items-center gap-8 text-sm font-body">
              <Link href="/legal/terms" className="text-white/40 hover:text-white transition-colors">
                CGU
              </Link>
              <Link href="/legal/privacy" className="text-white/40 hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="/legal/mentions-legales" className="text-white/40 hover:text-white transition-colors">
                Mentions légales
              </Link>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-white/30 font-body">
              2026 ArtyDrop. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
