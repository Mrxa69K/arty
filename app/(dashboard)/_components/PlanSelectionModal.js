'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2, Sparkles, Crown } from 'lucide-react'
import { toast } from 'sonner'

export function PlanSelectionModal({ open, onClose, userEmail }) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [currentWord, setCurrentWord] = useState(0)
  const [hoveredPlan, setHoveredPlan] = useState(null)
  
  const words = ['clients', 'galleries', 'moments', 'stories', 'memories', 'art']

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleSelectPlan = async (planType) => {
    setIsLoading(true)
    setSelectedPlan(planType)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planType })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Checkout failed')
      }

      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Plan selection error:', error)
      toast.error(error.message || 'Failed to process payment.')
      setIsLoading(false)
      setSelectedPlan(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border-0 bg-transparent shadow-none p-0">
        {/* Hidden but accessible title for screen readers */}
        <DialogHeader className="sr-only">
          <DialogTitle>Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select a subscription plan that works best for your photography business
          </DialogDescription>
        </DialogHeader>

        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#F5F0EA] via-[#FDF9F3] to-[#F5E6D3]" />
          
          {/* Your golden cover.webp */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: "url('/cover.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          
          {/* Floating orbs - smaller on mobile */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-5 sm:left-10 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 right-5 sm:right-10 w-40 sm:w-56 h-40 sm:h-56 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl animate-float-delayed" />
            <div className="absolute top-1/2 left-1/2 w-36 sm:w-52 h-36 sm:h-52 bg-gradient-to-br from-orange-200/20 to-yellow-200/20 rounded-full blur-3xl animate-pulse-slow" />
          </div>

          {/* Grain texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-multiply"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
              backgroundSize: 'cover',
            }}
          />

          <div className="relative px-4 sm:px-8 py-8 sm:py-10">
            {/* Mobile-friendly Header */}
            <div className="text-center mb-8 sm:mb-10">
              <div className="inline-block mb-3 sm:mb-4 animate-fade-in-down">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 backdrop-blur-sm border border-black/10">
                  <Sparkles className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-black/40 animate-spin-slow" />
                  <span className="text-[8px] sm:text-[9px] tracking-[0.3em] uppercase text-black/50">
                    Choose Your Plan
                  </span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif text-black/90 mb-3 sm:mb-4 leading-tight tracking-tight animate-fade-in">
                Deliver beautiful
              </h2>
              
              {/* Animated word cycling - responsive */}
              <div className="h-10 sm:h-12 md:h-14 flex items-center justify-center overflow-hidden">
                <div className="relative">
                  {words.map((word, index) => (
                    <div
                      key={word}
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
                        index === currentWord
                          ? 'opacity-100 translate-y-0 scale-100'
                          : index === (currentWord - 1 + words.length) % words.length
                          ? 'opacity-0 -translate-y-full scale-95'
                          : 'opacity-0 translate-y-full scale-95'
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl md:text-6xl font-serif bg-gradient-to-r from-black/20 via-black/30 to-black/20 bg-clip-text text-transparent tracking-tight">
                        {word}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile-optimized pricing cards */}
            <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Test Plan */}
              <button
                onClick={() => handleSelectPlan('test')}
                disabled={isLoading}
                onMouseEnter={() => setHoveredPlan('test')}
                onMouseLeave={() => setHoveredPlan(null)}
                className="group relative text-left"
              >
                <div className={`relative bg-white/60 backdrop-blur-xl border border-black/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-500 ${
                  hoveredPlan === 'test' 
                    ? 'shadow-2xl sm:-translate-y-2 sm:scale-105 bg-white/80 border-black/20' 
                    : 'shadow-lg hover:shadow-xl'
                }`}>
                  {/* Shimmer effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full transition-transform duration-1000 rounded-xl sm:rounded-2xl ${
                    hoveredPlan === 'test' ? 'translate-x-full' : ''
                  }`} />

                  <div className="relative space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-black/40 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                        Curious
                      </p>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-3xl sm:text-4xl font-serif text-black/90 transition-all duration-300 group-hover:scale-110 inline-block">€1</span>
                        <span className="text-xs text-black/50">once</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 text-xs text-black/70 border-t border-black/10 pt-3">
                      <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                        <div className="w-1 h-1 rounded-full bg-black/30 flex-shrink-0" />
                        <p>1 gallery</p>
                      </div>
                      <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform delay-75">
                        <div className="w-1 h-1 rounded-full bg-black/30 flex-shrink-0" />
                        <p>10 photos</p>
                      </div>
                      <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform delay-100">
                        <div className="w-1 h-1 rounded-full bg-black/30 flex-shrink-0" />
                        <p>3 days</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="px-3 py-2 rounded-lg bg-black/5 group-hover:bg-black group-hover:text-white text-black/70 text-center text-xs font-medium transition-all duration-300">
                        Try it out
                      </div>
                    </div>
                  </div>

                  {isLoading && selectedPlan === 'test' && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-black/40" />
                    </div>
                  )}
                </div>
                
                <p className="text-[8px] sm:text-[9px] text-center text-black/40 mt-2 tracking-wide">
                  First time only
                </p>
              </button>

              {/* Pay as you go - FEATURED */}
              <button
                onClick={() => handleSelectPlan('payg')}
                disabled={isLoading}
                onMouseEnter={() => setHoveredPlan('payg')}
                onMouseLeave={() => setHoveredPlan(null)}
                className="group relative text-left"
              >
                {/* Glow effect - reduced on mobile */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-20 blur-lg transition-all duration-700 ${
                  hoveredPlan === 'payg' ? 'opacity-30 sm:scale-105' : ''
                }`} />

                <div className={`relative bg-gradient-to-br from-black via-gray-900 to-black text-white rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-500 ${
                  hoveredPlan === 'payg' 
                    ? 'shadow-2xl sm:-translate-y-2 sm:scale-105' 
                    : 'shadow-xl'
                }`}>
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-orange-500/10 rounded-xl sm:rounded-2xl animate-gradient-slow" />

                  <div className="relative space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-white/50 mb-2">
                        Flexible
                      </p>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-3xl sm:text-4xl font-serif transition-all duration-300 group-hover:scale-110 inline-block">€4.90</span>
                        <span className="text-xs text-white/60">each</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 text-xs text-white/80 border-t border-white/20 pt-3">
                      <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                        <div className="w-1 h-1 rounded-full bg-white/50 flex-shrink-0" />
                        <p>Unlimited galleries</p>
                      </div>
                      <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform delay-75">
                        <div className="w-1 h-1 rounded-full bg-white/50 flex-shrink-0" />
                        <p>Unlimited photos</p>
                      </div>
                      <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform delay-100">
                        <div className="w-1 h-1 rounded-full bg-white/50 flex-shrink-0" />
                        <p>No expiration</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="px-3 py-2 rounded-lg bg-white text-black text-center text-xs font-medium group-hover:scale-105 transition-transform duration-300 shadow-lg">
                        Get Started
                      </div>
                    </div>
                  </div>

                  {isLoading && selectedPlan === 'payg' && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-white/60" />
                    </div>
                  )}
                </div>
              </button>

              {/* Studio - Premium */}
              <button
                onClick={() => handleSelectPlan('studio')}
                disabled={isLoading}
                onMouseEnter={() => setHoveredPlan('studio')}
                onMouseLeave={() => setHoveredPlan(null)}
                className="group relative text-left"
              >
                <div className={`relative bg-white/60 backdrop-blur-xl border border-black/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-500 ${
                  hoveredPlan === 'studio' 
                    ? 'shadow-2xl sm:-translate-y-2 sm:scale-105 bg-white/80 border-purple-500/20' 
                    : 'shadow-lg hover:shadow-xl'
                }`}>
                  {/* Purple shimmer effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/40 to-transparent -translate-x-full transition-transform duration-1000 rounded-xl sm:rounded-2xl ${
                    hoveredPlan === 'studio' ? 'translate-x-full' : ''
                  }`} />

                  <div className="relative space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-black/40 mb-2 flex items-center gap-1.5">
                        <Crown className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-purple-600/60" />
                        Pro
                      </p>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-3xl sm:text-4xl font-serif text-black/90 transition-all duration-300 group-hover:scale-110 inline-block">€19</span>
                        <span className="text-xs text-black/50">/mo</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 text-xs text-black/70 border-t border-black/10 pt-3">
                      <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                        <div className="w-1 h-1 rounded-full bg-purple-500/40 flex-shrink-0" />
                        <p>Unlimited galleries</p>
                      </div>
                      <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform delay-75">
                        <div className="w-1 h-1 rounded-full bg-purple-500/40 flex-shrink-0" />
                        <p>Unlimited photos</p>
                      </div>
                      <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform delay-100">
                        <div className="w-1 h-1 rounded-full bg-purple-500/40 flex-shrink-0" />
                        <p>Priority support</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-center text-xs font-medium group-hover:shadow-lg transition-all duration-300">
                        Go Premium
                      </div>
                    </div>
                  </div>

                  {isLoading && selectedPlan === 'studio' && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-black/40" />
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Mobile-friendly Footer */}
            <div className="text-center animate-fade-in-up">
              <p className="text-[9px] sm:text-[10px] text-black/40 tracking-wide px-4">
                Fair pricing • Cancel anytime • No hidden fees
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(15px, -15px); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-15px, 15px); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.4; }
          }
          @keyframes gradient-slow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
          .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
          .animate-gradient-slow { 
            background-size: 200% 200%;
            animation: gradient-slow 3s ease infinite;
          }
          .animate-spin-slow { animation: spin-slow 3s linear infinite; }
          .animate-fade-in { animation: fade-in 0.6s ease-out; }
          .animate-fade-in-down { animation: fade-in-down 0.6s ease-out; }
          .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
