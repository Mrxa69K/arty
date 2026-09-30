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
import { useLanguage } from '@/lib/i18n/LanguageContext'

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
  const { lang, setLang, t, tList } = useLanguage()

  // Animation refs
  const [whatRef, whatInView] = useInView()
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

  const faqs = tList('home.faqs')

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-[#ededed] relative overflow-hidden">
      
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
            <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }} className="text-white/50 hover:text-white transition-colors">{t('home.navFeatures')}</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) }} className="text-white/50 hover:text-white transition-colors">{t('home.navPricing')}</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }) }} className="text-white/50 hover:text-white transition-colors">{t('home.navFaq')}</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
              className="text-[10px] tracking-[0.2em] uppercase text-white/30 hover:text-white font-body transition-colors"
              data-testid="language-toggle"
            >
              {lang === 'en' ? 'FR' : 'EN'}
            </button>
            {loading ? (
              <div className="w-20 h-9 bg-white/5 rounded animate-pulse" />
            ) : user ? (
              <Link href="/dashboard" data-testid="dashboard-link">
                <Button className="h-10 px-6 bg-white text-black hover:bg-white/90 rounded-none font-body text-sm font-medium">
                  {t('home.navDashboard')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors font-body" data-testid="login-link">
                  {t('home.navLogin')}
                </Link>
                <Link href="/signup" data-testid="signup-link">
                  <Button className="h-10 px-6 bg-white text-black hover:bg-white/90 rounded-none font-body text-sm font-medium">
                    {t('home.navGetStarted')}
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
      <section className="relative min-h-screen w-full flex items-center justify-center px-6 lg:px-12 pt-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/cover.webp"
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0C] via-[#0B0B0C]/70 to-[#0B0B0C]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <span className="inline-block mb-8 px-4 py-2 text-xs tracking-[0.2em] uppercase text-gold font-body font-medium border border-gold/30 rounded-chip">
            {t('home.heroBadge')}
          </span>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight mb-8">
            {t('home.heroTitleLine1')}
            <br />
            <span className="italic text-gold">{t('home.heroTitleLine2')}</span>
          </h1>

          <p className="font-body text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
            {t('home.heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (user) {
                  handleCheckout('payg')
                } else {
                  router.push('/signup')
                }
              }}
              disabled={isRedirecting || loading}
              className="h-14 px-10 bg-white text-black font-body font-semibold text-sm rounded-none hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-3 btn-press"
              data-testid="cta-payg"
            >
              {t('home.heroCtaPayg')}
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#demo"
              className="h-14 px-10 border border-white/20 text-white font-body font-medium text-sm rounded-none hover:bg-white/5 transition-all flex items-center gap-3"
              data-testid="cta-demo"
            >
              {t('home.heroCtaDemo')}
            </a>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-white/40 font-body">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gold" strokeWidth={1.5} />
              {t('home.heroTrustNoSub')}
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gold" strokeWidth={1.5} />
              {t('home.heroTrustMoneyBack')}
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gold" strokeWidth={1.5} />
              {t('home.heroTrustGalleries')}
            </span>
          </div>
        </div>
      </section>

      {/* ============================================
          WHAT IS ARTYDROP SECTION
          ============================================ */}
      <section ref={whatRef} className="py-32 px-6 lg:px-12 border-t border-white/5 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={whatInView ? 'animate-slideInLeft' : 'opacity-0'}>
              <p className="text-xs tracking-[0.2em] uppercase text-gold font-body font-medium mb-6">
                {t('home.whatEyebrow')}
              </p>
              <h2 className="font-display text-4xl md:text-5xl leading-tight mb-8">
                {t('home.whatTitle')}
              </h2>
              <div className="space-y-6 text-white/60 font-body leading-relaxed">
                <p>
                  {t('home.whatBody1')}
                </p>
                <p>
                  <span className="text-white font-medium">{t('home.whatBody2Bold')}</span> {t('home.whatBody2Rest')}
                </p>
              </div>
            </div>

            <div className={`relative ${whatInView ? 'animate-slideInRight delay-100' : 'opacity-0'}`}>
              {/* Ambient glow behind the frame */}
              <div
                aria-hidden
                className="absolute -inset-8 -z-10 opacity-60"
                style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(122,184,203,0.16), transparent 70%)' }}
              />

              <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/10 image-hover-zoom">
                <img
                  src="https://images.unsplash.com/photo-1758712508646-49eb3ced4e89?w=1200&q=80&auto=format&fit=crop"
                  alt="Wedding rings delivered in an ArtyDrop gallery"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating price card */}
              <div className="absolute -bottom-6 -left-6 bg-[#161618] border border-white/10 p-6 rounded-lg card-lift">
                <p className="text-3xl font-display text-gold mb-1">4.90€</p>
                <p className="text-sm text-white/50 font-body">{t('home.whatPriceCard')}</p>
              </div>

              {/* Floating trust badge */}
              <div className="absolute -top-5 -right-5 hidden sm:flex items-center gap-2 bg-[#161618] border border-white/10 px-4 py-2.5 rounded-chip card-lift">
                <Lock className="w-3.5 h-3.5 text-gold" strokeWidth={1.5} />
                <span className="text-xs text-white/70 font-body">{t('home.whatBadge')}</span>
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
        className="py-32 px-6 lg:px-12 bg-[#0B0B0C]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className={`text-xs tracking-[0.2em] uppercase text-gold font-body font-medium mb-6 ${demoInView ? 'animate-fadeInUp' : 'opacity-0'}`}>
              {t('home.demoEyebrow')}
            </p>
            <h2 className={`font-display text-4xl md:text-5xl leading-tight ${demoInView ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
              {t('home.demoTitle')}
            </h2>
          </div>

          {/* Live product recreation — same nav/hero/grid language as the real /g/[token] gallery page */}
          <div className={`${demoInView ? 'animate-scaleIn delay-200' : 'opacity-0'}`}>
            <div className="relative mx-auto max-w-5xl rounded-lg overflow-hidden border border-white/10 bg-[#0B0B0C] shadow-2xl shadow-black/40">

              {/* Mini nav */}
              <div className="h-14 flex items-center justify-between px-5 md:px-8 border-b border-white/5">
                <span className="font-display text-white/50 text-sm">Artydrop</span>
                <span className="hidden md:block text-[10px] tracking-[0.3em] uppercase text-white/25 font-body">{t('home.demoPhotographerLabel')}</span>
                <span className="flex items-center gap-1.5 text-xs text-white/40 font-body">
                  <Download className="w-3 h-3" strokeWidth={1.5} />
                  {t('home.demoDownloadAll')}
                </span>
              </div>

              {/* Mini hero */}
              <div className="px-6 md:px-10 pt-10 pb-8 text-center md:text-left">
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/30 font-body mb-4">{t('home.demoCollectionFor')}</p>
                <h3 className="font-display text-3xl sm:text-4xl md:text-5xl text-white leading-[0.95] mb-4">
                  {t('home.demoCoupleNames')}
                </h3>
                <div className="flex items-center justify-center md:justify-start gap-3 text-xs text-white/30 font-body">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {t('home.demoPhotosCount')}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{t('home.demoDate')}</span>
                </div>
              </div>

              {/* Masonry grid, matching the real gallery page exactly */}
              <div className="px-1 pb-1 columns-2 md:columns-3 gap-1">
                {[
                  '/demo-vows.jpg',
                  '/demo-family.jpg',
                  '/demo-eiffel-night.jpg',
                  '/demo-proposal.jpg',
                  '/demo-garden.jpg',
                ].map((src, i) => (
                  <div
                    key={i}
                    className="break-inside-avoid mb-1 group relative overflow-hidden"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full block transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300" />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-7 h-7 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <Download className="w-3 h-3 text-white" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Download all footer */}
              <div className="flex justify-center p-8 border-t border-white/5">
                <button className="h-12 px-8 bg-white text-black font-body font-medium text-sm rounded-none flex items-center gap-3">
                  <Download className="w-4 h-4" strokeWidth={1.5} />
                  {t('home.demoDownloadAllPhotos')}
                </button>
              </div>
            </div>
          </div>

          {/* Feature badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-6">
            {[
              { icon: Lock, text: t('home.demoBadgePassword') },
              { icon: Download, text: t('home.demoBadgeDownloads') },
              { icon: Eye, text: t('home.demoBadgeTracking') },
            ].map((item, i) => (
              <div 
                key={i}
                className={`flex items-center gap-3 px-5 py-3 bg-[#161618] border border-white/10 rounded-chip ${demoInView ? 'animate-fadeInUp' : 'opacity-0'}`}
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
              {t('home.featuresEyebrow')}
            </p>
            <h2 className={`font-display text-4xl md:text-5xl leading-tight max-w-3xl mx-auto ${featuresInView ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
              {t('home.featuresTitle')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Shield,
                title: t('home.feature1Title'),
                description: t('home.feature1Desc')
              },
              {
                icon: BarChart3,
                title: t('home.feature2Title'),
                description: t('home.feature2Desc')
              },
              {
                icon: Layers,
                title: t('home.feature3Title'),
                description: t('home.feature3Desc')
              },
              {
                icon: Clock,
                title: t('home.feature4Title'),
                description: t('home.feature4Desc')
              },
            ].map((feature, i) => (
              <div 
                key={i}
                className={`p-8 md:p-10 bg-[#161618] border border-white/5 rounded-lg hover:border-white/10 transition-colors ${featuresInView ? 'animate-fadeInUp' : 'opacity-0'}`}
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
        className="py-32 px-6 lg:px-12 bg-[#0B0B0C]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className={`text-xs tracking-[0.2em] uppercase text-gold font-body font-medium mb-6 ${pricingInView ? 'animate-fadeInUp' : 'opacity-0'}`}>
              {t('home.pricingEyebrow')}
            </p>
            <h2 className={`font-display text-4xl md:text-5xl leading-tight mb-6 ${pricingInView ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
              {t('home.pricingTitle')}
            </h2>
            <p className={`text-white/50 font-body max-w-xl mx-auto ${pricingInView ? 'animate-fadeInUp delay-200' : 'opacity-0'}`}>
              {t('home.pricingSubtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Pay as you go - HIGHLIGHTED */}
            <div className={`relative lg:col-span-2 ${pricingInView ? 'animate-fadeInUp delay-300' : 'opacity-0'}`}>
              <div className="absolute -inset-px bg-gradient-to-b from-gold/30 to-transparent rounded-lg" />
              <div className="relative bg-[#161618] border border-gold/30 rounded-lg p-8 md:p-10 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 text-xs tracking-wider uppercase bg-coral/20 text-coral rounded-chip font-body font-medium">
                    {t('home.pricingMostPopular')}
                  </span>
                </div>

                <h3 className="font-display text-2xl mb-2">{t('home.paygTitle')}</h3>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="font-display text-5xl text-gold">4.90€</span>
                  <span className="text-white/50 font-body">{t('home.paygPerGallery')}</span>
                </div>

                <p className="text-white/50 font-body mb-8 leading-relaxed">
                  {t('home.paygDesc')}
                </p>

                <ul className="space-y-4 mb-10">
                  {[
                    t('home.paygFeature1'),
                    t('home.paygFeature2'),
                    t('home.paygFeature3'),
                    t('home.paygFeature4'),
                    t('home.paygFeature5'),
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
  className="w-full h-14 bg-white text-black border border-gray-300 font-body font-semibold text-sm rounded-none hover:bg-gray-100 transition-all disabled:opacity-50 btn-press"
  data-testid="pricing-payg-btn"
>
  {t('home.getStarted')}
</button>
              </div>
            </div>

            {/* Studio Plan */}
            <div className={`${pricingInView ? 'animate-fadeInUp delay-400' : 'opacity-0'}`}>
              <div className="bg-[#161618] border border-white/10 rounded-lg p-8 h-full flex flex-col">
                <h3 className="font-display text-2xl mb-2">{t('home.studioTitle')}</h3>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="font-display text-4xl">19€</span>
                  <span className="text-white/50 font-body">{t('home.studioPerMonth')}</span>
                </div>

                <p className="text-white/50 font-body mb-8 leading-relaxed text-sm">
                  {t('home.studioDesc')}
                </p>

                <ul className="space-y-3 mb-10 flex-1">
                  {[
                    t('home.studioFeature1'),
                    t('home.studioFeature2'),
                    t('home.studioFeature3'),
                    t('home.studioFeature4'),
                    t('home.studioFeature5'),
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
                  className="w-full h-12 border border-white/20 text-white font-body font-medium text-sm rounded-none hover:bg-white/5 transition-all disabled:opacity-50"
                  data-testid="pricing-studio-btn"
                >
                  {t('home.subscribe')}
                </button>
              </div>
            </div>
          </div>

          {/* Test drive option */}
          <div className={`mt-8 ${pricingInView ? 'animate-fadeInUp delay-500' : 'opacity-0'}`}>
            <div className="bg-[#161618] border border-white/5 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-display text-lg mb-2">{t('home.notSureTitle')}</h4>
                <p className="text-sm text-white/50 font-body">
                  {t('home.notSureDesc')}
                </p>
              </div>
              <button
  onClick={() => handleCheckout('trial-gallery')}
  disabled={isRedirecting || loading}
  className="h-11 px-6 bg-white text-black border border-gray-300 font-body text-sm rounded-none hover:bg-gray-100 transition-all whitespace-nowrap disabled:opacity-50"
  data-testid="pricing-trial-btn"
>
  {t('home.tryFor1')}
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
              {t('home.faqEyebrow')}
            </p>
            <h2 className={`font-display text-4xl md:text-5xl leading-tight ${faqInView ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
              {t('home.faqTitle')}
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
      <footer className="py-16 px-6 lg:px-12 border-t border-white/5 bg-[#0B0B0C]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="font-display text-xl text-white/80">ArtyDrop</span>
              <p className="text-sm text-white/40 font-body mt-2">
                {t('home.footerTagline')}
              </p>
            </div>

            <div className="flex items-center gap-8 text-sm font-body">
              <Link href="/legal/terms" className="text-white/40 hover:text-white transition-colors">
                {t('home.footerTerms')}
              </Link>
              <Link href="/legal/privacy" className="text-white/40 hover:text-white transition-colors">
                {t('home.footerPrivacy')}
              </Link>
              <Link href="/legal/mentions-legales" className="text-white/40 hover:text-white transition-colors">
                {t('home.footerLegal')}
              </Link>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-white/30 font-body">
              {t('home.footerCopyright')}
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
