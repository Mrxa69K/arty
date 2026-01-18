'use client'

import { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Camera, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState('photographer')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptMarketing, setAcceptMarketing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    
    if (!acceptTerms) {
      toast.error('Please accept the terms and conditions')
      return
    }

    setIsLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
          }
        }
      })

      if (authError) {
        toast.error(authError.message)
        return
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            user_type: userType,
            marketing_emails: acceptMarketing,
          })
          .eq('id', authData.user.id)

        if (profileError) {
          console.error('Profile update error:', profileError)
        }
      }

      toast.success('Account created successfully!')
      
      if (userType === 'photographer') {
        router.push('/dashboard')
      } else {
        router.push('/client/dashboard')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
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

      <div className="relative z-10 flex min-h-screen">
        {/* Left side */}
        <div className="hidden lg:flex lg:flex-col lg:w-1/2 justify-between px-7 py-6">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center px-4 py-2 border border-black/80 rounded-[999px] bg-black/5 backdrop-blur-sm">
              <span className="text-xs tracking-[0.18em] font-semibold uppercase">
                ARTYdrop
              </span>
            </div>
          </div>

          <div className="mb-4">
            <p className="tagline-aura text-[15px] font-semibold text-center text-black/80 tracking-[0.22em] uppercase whitespace-nowrap animate-[float_6s_ease-in-out_infinite]">
              Calm, intentional delivery for modern photographers.
            </p>
          </div>

          <div className="text-[11px] text-black/65 flex gap-4">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md mx-4 my-10 lg:my-0">
            {/* Mobile logo */}
            <div className="lg:hidden mb-10 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#F97316] flex items-center justify-center shadow-sm">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm tracking-[0.18em] uppercase">
                ARTYdrop
              </span>
            </div>

            <Card className="border border-black/10 bg-[#F8F3EB]/95 shadow-2xl rounded-3xl">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-xl font-semibold text-center">
                  Create account
                </CardTitle>
                <CardDescription className="text-center text-xs text-black/60">
                  or{' '}
                  <Link
                    href="/login"
                    className="underline underline-offset-4 text-black"
                  >
                    log in
                  </Link>
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  {/* User Type Selection - CLASSY VERSION */}
                  <div className="space-y-2">
                    <Label className="text-xs text-black/70">
                      I want to
                    </Label>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* Photographer Option */}
                      <button
                        type="button"
                        onClick={() => setUserType('photographer')}
                        disabled={isLoading}
                        className={`
                          relative px-4 py-3 rounded-xl transition-all duration-300 text-left
                          ${userType === 'photographer' 
                            ? 'bg-black text-white shadow-lg' 
                            : 'bg-white/60 border border-black/10 text-black/70 hover:bg-white/80 hover:border-black/20'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <Camera className={`w-4 h-4 flex-shrink-0 ${
                            userType === 'photographer' ? 'text-white' : 'text-black/40'
                          }`} />
                          <span className="text-sm font-medium">Create galleries</span>
                        </div>
                      </button>

                      {/* Client Option */}
                      <button
                        type="button"
                        onClick={() => setUserType('client')}
                        disabled={isLoading}
                        className={`
                          relative px-4 py-3 rounded-xl transition-all duration-300 text-left
                          ${userType === 'client' 
                            ? 'bg-black text-white shadow-lg' 
                            : 'bg-white/60 border border-black/10 text-black/70 hover:bg-white/80 hover:border-black/20'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <svg 
                            className={`w-4 h-4 flex-shrink-0 ${
                              userType === 'client' ? 'text-white' : 'text-black/40'
                            }`}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium">View galleries</span>
                        </div>
                      </button>
                    </div>
                    <p className="text-[10px] text-black/50 text-center">
                      {userType === 'photographer' 
                        ? 'Upload and deliver photos to clients' 
                        : 'Access photos shared with you'
                      }
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs text-black/70">
                      Full Name
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

                  {/* Email */}
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

                  {/* Password */}
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
                  </div>

                  {/* Terms and Conditions Checkbox */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={acceptTerms}
                        onCheckedChange={setAcceptTerms}
                        disabled={isLoading}
                        className="mt-0.5 border-black/20 data-[state=checked]:bg-black data-[state=checked]:border-black"
                      />
                      <label
                        htmlFor="terms"
                        className="text-xs text-black/70 leading-relaxed cursor-pointer"
                      >
                        I agree to the{' '}
                        <Link href="/terms" className="underline underline-offset-2 text-black hover:text-black/70">
                          Terms and Conditions
                        </Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="underline underline-offset-2 text-black hover:text-black/70">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="marketing"
                        checked={acceptMarketing}
                        onCheckedChange={setAcceptMarketing}
                        disabled={isLoading}
                        className="mt-0.5 border-black/20 data-[state=checked]:bg-black data-[state=checked]:border-black"
                      />
                      <label
                        htmlFor="marketing"
                        className="text-xs text-black/70 leading-relaxed cursor-pointer"
                      >
                        I want to receive emails about new features and special offers
                      </label>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-10 rounded-full bg-black text-white hover:bg-black/90 text-sm"
                    disabled={isLoading || !acceptTerms}
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
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
