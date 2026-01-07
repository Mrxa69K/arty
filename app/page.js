'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useAuth } from './providers'

export default function HomePage() {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()
  const { user, loading } = useAuth()

  async function handleCheckout(plan) {
    if (loading) return // Attendre que le chargement finisse
    
    try {
      setIsRedirecting(true)
      
      // Vérifier si user est connecté (pas besoin de supabase.auth.getUser())
      if (!user) {
        // Pas connecté → sauvegarder le plan et rediriger vers signup
        localStorage.setItem('pending_plan', plan)
        router.push('/signup')
        return
      }

      // Connecté → lancer le checkout Stripe
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

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* background cover same as auth */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: "url('/cover.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* beige wash + grain */}
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
        <header className="pt-6 px-4 sm:px-6 max-w-5xl mx-auto w-full flex items-center justify-between">
          {/* logo encadré comme login/signup */}
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
                <span className="text-black/60">{user.email}</span>
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

      {/* Hero */}
<section className="mt-14 sm:mt-20 mb-12 px-4 sm:px-6 max-w-5xl mx-auto w-full">
  <div className="max-w-3xl mx-auto space-y-6">
    <p className="text-[15px] font-medium text-center tracking-[0.22em] uppercase text-black/60">
      Client delivery, done right
    </p>

    {/* Titre principal centré, propre */}
    <h1 className="tagline-aura
        mt-4
        text-[25px]
        font-semibold
        text-black/80
        tracking-[0.22em]
        uppercase
        whitespace-nowrap
        text-center
        animate-[float_6s_ease-in-out_infinite]">
      Give your galleries a calm, premium home.
    </h1>

    <p className="mx-auto text-sm text-center sm:text-base text-black/75 max-w-xl">
      Artydrop replaces messy drive links with thoughtful, password-protected galleries.
      Send a single link that feels as intentional as your images.
    </p>

    <div className="flex justify-center">
      <Link href="/signup">
        <Button className="h-9 rounded-full px-5 bg-black text-white text-xs font-medium hover:bg-black/90">
          Start now
        </Button>
      </Link>
    </div>
  </div>
</section>

        {/* Pricing */}
        <section
          id="pricing"
          className="relative py-16 sm:py-20 border-t border-black/10 bg-gradient-to-b from-[#F5F0EA]/80 to-[#F5F0EA]/95"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-black/60">
                Pricing
              </p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold text-black">
                Choose how you deliver.
              </h2>
              <p className="mt-2 text-sm text-black/70 max-w-xl mx-auto">
                Pay only when you shoot, or keep a simple monthly plan when your calendar
                starts filling up.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Pay as you go */}
              <div className="relative rounded-3xl border border-black/10 bg-[#FDF9F3]/90 shadow-sm p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/80">
                    Pay as you go
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-black">4,90€</span>
                    <span className="text-xs text-black/60">/ gallery</span>
                  </div>
                  <p className="text-sm text-black/70">
                    Perfect for freelancers and small studios who don&apos;t want a monthly bill.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-xs text-black/75">
                    <li>• Up to 200 photos per gallery</li>
                    <li>• Password, expiration, downloads</li>
                    <li>• Favourites & selection tools</li>
                    <li>• 6 months hosting included</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => handleCheckout('payg')}
                    className="w-full h-9 rounded-full bg-black text-white text-xs font-medium hover:bg-black/90 transition disabled:opacity-60"
                    disabled={isRedirecting || loading}
                  >
                    Start with pay‑as‑you‑go
                  </button>
                  <p className="mt-2 text-[11px] text-black/60">
                    Ideal if you shoot a few times a month or less.
                  </p>
                </div>
              </div>

              {/* Studio – highlighted */}
              <div className="relative rounded-3xl border border-black/80 bg-[#F8F3EB] shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-6 flex flex-col justify-between">
                <div className="absolute -top-3 left-6 inline-flex items-center rounded-full border border-black/70 bg-[#F5F0EA] px-3 py-1">
                  <span className="text-[10px] tracking-[0.18em] uppercase text-black/80">
                    Most popular
                  </span>
                </div>
                <div className="space-y-3 pt-1">
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black/80">
                    Studio
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-black">19€</span>
                    <span className="text-xs text-black/60">/ month</span>
                  </div>
                  <p className="text-sm text-black/70">
                    For busy portrait & wedding photographers who deliver regularly.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-xs text-black/75">
                    <li>• 10 active galleries</li>
                    <li>• 100 GB storage</li>
                    <li>• Unlimited downloads & favourites</li>
                    <li>• Priority email support</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => handleCheckout('studio')}
                    className="w-full h-9 rounded-full bg-black text-white text-xs font-medium hover:bg-black/90 transition disabled:opacity-60"
                    disabled={isRedirecting || loading}
                  >
                    Start Studio
                  </button>
                  <p className="mt-2 text-[11px] text-black/60">
                    Best once you deliver more than 4–5 galleries a month.
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
                    <span className="text-3xl font-semibold text-black">39€</span>
                    <span className="text-xs text-black/60">/ month</span>
                  </div>
                  <p className="text-sm text-black/70">
                    For studios and agencies with teams, more storage and more brands.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-xs text-black/75">
                    <li>• Unlimited galleries</li>
                    <li>• 1 TB storage</li>
                    <li>• Team accounts & roles</li>
                    <li>• Priority support & SLAs</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    disabled
                    className="w-full h-9 rounded-full border border-black/20 text-xs text-black/50 cursor-default"
                  >
                    Join waitlist soon
                  </button>
                </div>
              </div>
            </div>

            {/* Trial strip */}
            <div className="mt-10 rounded-2xl border border-black/10 bg-black/5 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-black/70">
                Not sure yet? Send a real client gallery for <span className="font-semibold">1€</span> once, then decide.
              </p>
              <button
                type="button"
                onClick={() => handleCheckout('trial-gallery')}
                className="h-8 px-4 rounded-full bg-black text-white text-[11px] font-medium hover:bg-black/90 disabled:opacity-60"
                disabled={isRedirecting || loading}
              >
                Try a 1€ gallery
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 text-[11px] text-black/60 border-t border-black/10 bg-[#F5F0EA]/95">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            <span>© {new Date().getFullYear()} Artydrop</span>
            <div className="flex gap-4">
              <span>Terms</span>
              <span>Privacy</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
