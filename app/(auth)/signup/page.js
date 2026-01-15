'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function PlanSelectionModal({ open, onClose, userEmail }) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [currentWord, setCurrentWord] = useState(0)
  
  const words = ['clients', 'galleries', 'moments', 'stories', 'memories']

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-0 bg-transparent shadow-none p-0">
        {/* Background */}
        <div className="relative rounded-3xl overflow-hidden">
          {/* Your golden cover.webp */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/cover.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-[#F5F0EA]/95 mix-blend-soft-light" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-multiply"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
              backgroundSize: 'cover',
            }}
          />

          <div className="relative px-6 sm:px-12 py-10 sm:py-12">
            {/* Header - More compact */}
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-5xl font-serif text-black/90 mb-4 leading-tight tracking-tight">
                One place to deliver
              </h1>
              
              {/* Animated word cycling - smaller */}
              <div className="h-12 sm:h-16 flex items-center justify-center overflow-hidden">
                <div className="relative">
                  {words.map((word, index) => (
                    <div
                      key={word}
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
                        index === currentWord
                          ? 'opacity-100 translate-y-0'
                          : index === (currentWord - 1 + words.length) % words.length
                          ? 'opacity-0 -translate-y-full'
                          : 'opacity-0 translate-y-full'
                      }`}
                    >
                      <span className="text-4xl sm:text-6xl font-serif text-black/20 tracking-tight">
                        {word}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plans - Compact cards */}
            <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4 mb-8">
              {/* Test Plan */}
              <button
                onClick={() => handleSelectPlan('test')}
                disabled={isLoading}
                className="group relative text-left"
              >
                <div className="relative bg-white/40 backdrop-blur-md border border-black/10 rounded-xl p-6 transition-all duration-500 hover:bg-white/60 hover:shadow-xl hover:-translate-y-0.5">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 mb-2">
                        Test
                      </p>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-3xl font-serif text-black/90">€1</span>
                        <span className="text-xs text-black/50">one-time</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-black/60 border-t border-black/10 pt-4">
                      <p>1 gallery</p>
                      <p>10 photos</p>
                      <p>3 days</p>
                    </div>
                  </div>

                  {isLoading && selectedPlan === 'test' && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-black/40" />
                    </div>
                  )}
                </div>
                
                <p className="text-[9px] text-center text-black/40 mt-2 tracking-wide">
                  One-time only
                </p>
              </button>

              {/* Pay as you go */}
              <button
                onClick={() => handleSelectPlan('payg')}
                disabled={isLoading}
                className="group relative text-left"
              >
                <div className="relative bg-black text-white rounded-xl p-6 transition-all duration-500 hover:shadow-xl hover:-translate-y-0.5">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">
                        Flexible
                      </p>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-3xl font-serif">€4.90</span>
                        <span className="text-xs text-white/60">per gallery</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-white/70 border-t border-white/20 pt-4">
                      <p>Unlimited galleries</p>
                      <p>Unlimited photos</p>
                      <p>No expiration</p>
                    </div>
                  </div>

                  {isLoading && selectedPlan === 'payg' && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-white/60" />
                    </div>
                  )}
                </div>
              </button>

              {/* Studio */}
              <button
                onClick={() => handleSelectPlan('studio')}
                disabled={isLoading}
                className="group relative text-left"
              >
                <div className="relative bg-white/40 backdrop-blur-md border border-black/10 rounded-xl p-6 transition-all duration-500 hover:bg-white/60 hover:shadow-xl hover:-translate-y-0.5">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 mb-2">
                        Professional
                      </p>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-3xl font-serif text-black/90">€19</span>
                        <span className="text-xs text-black/50">/month</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-black/60 border-t border-black/10 pt-4">
                      <p>Unlimited galleries</p>
                      <p>Unlimited photos</p>
                      <p>Priority support</p>
                    </div>
                  </div>

                  {isLoading && selectedPlan === 'studio' && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-black/40" />
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-black/50">
                Fair pricing to help photographers 💙
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
