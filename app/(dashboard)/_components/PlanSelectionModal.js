'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'  
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'

export function PlanSelectionModal({ open, onClose, userEmail }) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [hoveredPlan, setHoveredPlan] = useState(null)

  const handleSelectPlan = async (planType) => {
    setIsLoading(true)
    setSelectedPlan(planType)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('No valid session:', sessionError)
        toast.error('Please log in again')
        setIsLoading(false)
        setSelectedPlan(null)
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
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
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto border-white/10 bg-[#0a0a0a] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select a subscription plan that works best for your photography business
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-gold font-body font-medium border border-gold/30 rounded-sm mb-6">
              Choose a Plan
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-white mb-4">
              Start delivering
            </h2>
            <p className="text-sm text-white/50 font-body max-w-md mx-auto">
              Pick a plan that fits your workflow. No hidden fees, cancel anytime.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* Test Plan - Small */}
            <button
              onClick={() => handleSelectPlan('test')}
              disabled={isLoading}
              onMouseEnter={() => setHoveredPlan('test')}
              onMouseLeave={() => setHoveredPlan(null)}
              className="group relative text-left"
              data-testid="plan-test"
            >
              <div className={`relative bg-[#121212] border rounded-sm p-6 transition-all duration-300 h-full ${
                hoveredPlan === 'test' 
                  ? 'border-white/20 bg-[#161616]' 
                  : 'border-white/5'
              }`}>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-body mb-3">
                      Test Drive
                    </p>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="font-display text-3xl text-white">1</span>
                      <span className="text-xs text-white/40 font-body">once</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-white/50 font-body border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-white/30" strokeWidth={1.5} />
                      <p>1 gallery, 20 photos</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-white/30" strokeWidth={1.5} />
                      <p>7 days expiration</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-white/30" strokeWidth={1.5} />
                      <p>Basic features</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="h-10 flex items-center justify-center rounded-sm bg-white/5 text-white/60 text-sm font-body font-medium group-hover:bg-white/10 transition-colors">
                      Try it
                    </div>
                  </div>
                </div>

                {isLoading && selectedPlan === 'test' && (
                  <div className="absolute inset-0 bg-[#121212]/95 rounded-sm flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-white/40" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              
              <p className="text-[10px] text-center text-white/30 font-body mt-2">
                First time only
              </p>
            </button>

            {/* Pay as you go - FEATURED */}
            <button
              onClick={() => handleSelectPlan('payg')}
              disabled={isLoading}
              onMouseEnter={() => setHoveredPlan('payg')}
              onMouseLeave={() => setHoveredPlan(null)}
              className="group relative text-left md:-mt-4 md:mb-4"
              data-testid="plan-payg"
            >
              {/* Gold glow */}
              <div className={`absolute -inset-px bg-gradient-to-b from-gold/40 to-transparent rounded-sm transition-opacity ${
                hoveredPlan === 'payg' ? 'opacity-100' : 'opacity-60'
              }`} />

              <div className={`relative bg-[#0f0f0f] border border-gold/30 rounded-sm p-6 transition-all duration-300 h-full ${
                hoveredPlan === 'payg' ? 'border-gold/50' : ''
              }`}>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 text-[9px] tracking-wider uppercase bg-gold/20 text-gold rounded-sm font-body font-medium">
                        Popular
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70 font-body mb-3">
                      Pay as you go
                    </p>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="font-display text-4xl text-gold">4.90</span>
                      <span className="text-xs text-white/50 font-body">/ gallery</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-white/60 font-body border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-gold" strokeWidth={1.5} />
                      <p>Up to 200 photos</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-gold" strokeWidth={1.5} />
                      <p>6 months storage</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-gold" strokeWidth={1.5} />
                      <p>All features included</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="h-11 flex items-center justify-center rounded-sm bg-gold text-black text-sm font-body font-semibold group-hover:bg-gold-light transition-colors">
                      Get started
                    </div>
                  </div>
                </div>

                {isLoading && selectedPlan === 'payg' && (
                  <div className="absolute inset-0 bg-[#0f0f0f]/95 rounded-sm flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gold" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            </button>

            {/* Studio Plan */}
            <button
              onClick={() => handleSelectPlan('studio')}
              disabled={isLoading}
              onMouseEnter={() => setHoveredPlan('studio')}
              onMouseLeave={() => setHoveredPlan(null)}
              className="group relative text-left"
              data-testid="plan-studio"
            >
              <div className={`relative bg-[#121212] border rounded-sm p-6 transition-all duration-300 h-full ${
                hoveredPlan === 'studio' 
                  ? 'border-white/20 bg-[#161616]' 
                  : 'border-white/5'
              }`}>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-body mb-3">
                      Studio
                    </p>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="font-display text-3xl text-white">19</span>
                      <span className="text-xs text-white/40 font-body">/ month</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-white/50 font-body border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-white/30" strokeWidth={1.5} />
                      <p>Unlimited galleries</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-white/30" strokeWidth={1.5} />
                      <p>100 GB storage</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-white/30" strokeWidth={1.5} />
                      <p>Priority support</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="h-10 flex items-center justify-center rounded-sm border border-white/20 text-white text-sm font-body font-medium group-hover:bg-white/5 transition-colors">
                      Subscribe
                    </div>
                  </div>
                </div>

                {isLoading && selectedPlan === 'studio' && (
                  <div className="absolute inset-0 bg-[#121212]/95 rounded-sm flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-white/40" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-[11px] text-white/30 font-body tracking-wide">
              Secure payment via Stripe
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
