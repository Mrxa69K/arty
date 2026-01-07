'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Camera, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingPlan, setPendingPlan] = useState(null)

  // Vérifier s'il y a un plan en attente au chargement
  useEffect(() => {
    const plan = localStorage.getItem('pending_plan')
    if (plan) {
      setPendingPlan(plan)
      toast.info(`You'll be redirected to checkout after signup (${plan})`)
    }
  }, [])

  const handleSignup = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user && !data.session) {
        // Email confirmation requise
        toast.success('Check your email to confirm your account!')
        
        // Garder le plan en localStorage pour après confirmation
        router.push('/login')
      } else {
        // Session créée immédiatement
        toast.success('Account created successfully!')

        // Vérifier si un plan était en attente
        const plan = localStorage.getItem('pending_plan')
        
        if (plan) {
          // Supprimer le plan du localStorage
          localStorage.removeItem('pending_plan')
          
          // Lancer le checkout Stripe automatiquement
          try {
            const res = await fetch('/api/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ plan }),
            })

            if (!res.ok) {
              const error = await res.json().catch(() => ({}))
              console.error('Checkout error after signup', res.status, error)
              toast.error('Account created, but checkout failed. Redirecting to dashboard.')
              router.push('/dashboard')
              return
            }

            const checkoutData = await res.json()
            if (checkoutData.url) {
              // Rediriger vers Stripe Checkout
              window.location.href = checkoutData.url
            } else {
              router.push('/dashboard')
            }
          } catch (err) {
            console.error('Checkout error:', err)
            toast.error('Account created, but checkout failed. Redirecting to dashboard.')
            router.push('/dashboard')
          }
        } else {
          // Pas de plan en attente → dashboard normal
          router.push('/dashboard')
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* background cover */}
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

      <div className="relative z-10 flex min-h-screen">
        {/* left side – logo frame + floating tagline */}
        <div className="hidden lg:flex lg:flex-col lg:w-1/2 justify-between px-7 py-6">
          {/* logo encadré */}
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center px-4 py-2 border border-black/80 rounded-[999px] bg-black/5 backdrop-blur-sm">
              <span className="text-xs tracking-[0.18em] uppercase">
                ARTYDROP
              </span>
            </div>
          </div>

          {/* tagline */}
          <div className="mb-4">
            <p
              className="
                tagline-aura
                text-center
                text-[15px]
                font-semibold
                text-black/80
                tracking-[0.22em]
                uppercase
                whitespace-nowrap
                animate-[float_6s_ease-in-out_infinite]
              "
            >
              Calm, intentional delivery for modern photographers.
            </p>
          </div>

          {/* footer links */}
          <div className="text-[11px] text-black/65 flex gap-4">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>

        {/* right side – signup form */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md mx-4 my-10 lg:my-0">
            {/* logo mobile */}
            <div className="lg:hidden mb-10 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#F97316] flex items-center justify-center shadow-sm">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm tracking-[0.18em] uppercase">
                ARTYdrop
              </span>
            </div>

            {pendingPlan && (
              <div className="mb-4 p-3 rounded-xl bg-black/5 border border-black/10">
                <p className="text-xs text-black/70 text-center">
                  ✨ After signup, you'll be redirected to checkout
                </p>
              </div>
            )}

            <Card className="border border-black/10 bg-[#F8F3EB]/95 shadow-2xl rounded-3xl">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-xl font-semibold text-center">
                  Create an account
                </CardTitle>
                <CardDescription className="text-center text-xs text-black/60">
                  Start delivering beautiful galleries to your clients.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs text-black/70">
                      Full name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-10 rounded-full border-black/10 bg-[#FDF9F3] text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs text-black/70">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-10 rounded-full border-black/10 bg-[#FDF9F3] text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs text-black/70">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={isLoading}
                      className="h-10 rounded-full border-black/10 bg-[#FDF9F3] text-sm"
                    />
                    <p className="text-xs text-black/55">
                      Must be at least 6 characters.
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-10 rounded-full bg-black text-white hover:bg-black/90 text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                  <p className="text-center text-sm text-black/60">
                    Already have an account?{' '}
                    <Link
                      href="/login"
                      className="text-black hover:underline font-medium"
                    >
                      Sign in
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
