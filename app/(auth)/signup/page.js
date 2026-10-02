'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Loader2, Eye, EyeOff, Camera, Images } from 'lucide-react'
import Turnstile from '@/components/Turnstile'
import { GoogleIcon } from '@/components/icons/GoogleIcon'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState('photographer')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptMarketing, setAcceptMarketing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef(null)

  const handleSignup = async (e) => {
    e.preventDefault()

    if (!acceptTerms) {
      toast.error('Please accept the terms and conditions')
      return
    }

    setIsLoading(true)

    try {
      const captchaRes = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      })
      if (!captchaRes.ok) {
        toast.error('Captcha verification failed. Please try again.')
        turnstileRef.current?.reset()
        setTurnstileToken('')
        setIsLoading(false)
        return
      }

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
        turnstileRef.current?.reset()
        setTurnstileToken('')
        setIsLoading(false)
        return
      }

      if (authData.user) {
        const refCode = new URLSearchParams(window.location.search).get('ref')
        if (refCode) {
          fetch('/api/referral/attach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: refCode, referredUserId: authData.user.id }),
          }).catch(() => {})
        }
      }

      // Without email confirmation, signUp() returns a session immediately.
      // With it enabled, session is null until the user clicks the emailed
      // link — there's no auth context yet to upsert a profile row under
      // RLS, so that's deferred to first login (see (dashboard)/layout.js).
      if (!authData.session) {
        toast.success('Check your email to confirm your account')
        setIsLoading(false)
        return
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          user_type: userType,
          marketing_emails: acceptMarketing,
        })

      if (profileError) {
        console.error('Profile upsert error:', profileError)
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
      turnstileRef.current?.reset()
      setTurnstileToken('')
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    if (!acceptTerms) {
      toast.error('Please accept the terms and conditions')
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?user_type=${userType}` },
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=80"
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="font-display text-2xl text-white/90 hover:text-white transition-colors">
            ArtyDrop
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-4xl text-white/80 leading-relaxed">
            Deliver your work
            <br />
            <span className="italic text-gold">beautifully</span>
          </h2>
          <p className="text-sm text-white/40 font-body max-w-sm">
            No subscription required. Pay only for the galleries you actually deliver.
          </p>
        </div>

        <div className="relative z-10 text-xs text-white/30 font-body flex gap-6">
          <Link href="/terms" className="hover:text-white/60 transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-white/60 transition-colors">
            Privacy
          </Link>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12">
            <Link href="/" className="font-display text-2xl text-white/90">
              ArtyDrop
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="font-display text-3xl text-white mb-3">
              Create account
            </h1>
            <p className="text-sm text-white/40 font-body">
              Already have an account?{' '}
              <Link href="/login" className="text-gold hover:text-gold-light transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            {/* User Type Selection */}
            <div className="space-y-3">
              <Label className="text-xs font-body font-medium text-white/60 uppercase tracking-wider">
                I want to
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('photographer')}
                  disabled={isLoading}
                  className={`relative p-4 rounded-sm border text-left transition-all ${
                    userType === 'photographer'
                      ? 'bg-gold/10 border-gold text-white'
                      : 'bg-transparent border-white/10 text-white/60 hover:border-white/20'
                  }`}
                  data-testid="type-photographer"
                >
                  <Camera className={`w-5 h-5 mb-2 ${userType === 'photographer' ? 'text-gold' : 'text-white/40'}`} strokeWidth={1.5} />
                  <span className="text-sm font-body font-medium block">Create galleries</span>
                  <span className="text-xs text-white/40 font-body">Deliver photos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserType('client')}
                  disabled={isLoading}
                  className={`relative p-4 rounded-sm border text-left transition-all ${
                    userType === 'client'
                      ? 'bg-gold/10 border-gold text-white'
                      : 'bg-transparent border-white/10 text-white/60 hover:border-white/20'
                  }`}
                  data-testid="type-client"
                >
                  <Images className={`w-5 h-5 mb-2 ${userType === 'client' ? 'text-gold' : 'text-white/40'}`} strokeWidth={1.5} />
                  <span className="text-sm font-body font-medium block">View galleries</span>
                  <span className="text-xs text-white/40 font-body">Access shared photos</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-body font-medium text-white/60 uppercase tracking-wider">
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
                className="h-12 bg-transparent border-white/10 rounded-sm text-white placeholder:text-white/20 focus:border-gold focus:ring-gold/20 font-body"
                data-testid="fullname-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-body font-medium text-white/60 uppercase tracking-wider">
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
                className="h-12 bg-transparent border-white/10 rounded-sm text-white placeholder:text-white/20 focus:border-gold focus:ring-gold/20 font-body"
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-body font-medium text-white/60 uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="h-12 bg-transparent border-white/10 rounded-sm text-white placeholder:text-white/20 pr-12 focus:border-gold focus:ring-gold/20 font-body"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={setAcceptTerms}
                  disabled={isLoading}
                  className="mt-0.5 border-white/20 rounded-sm data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                  data-testid="terms-checkbox"
                />
                <label htmlFor="terms" className="text-sm text-white/50 font-body leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <Link href="/terms" className="text-white/70 hover:text-white transition-colors">
                    Terms
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-white/70 hover:text-white transition-colors">
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
                  className="mt-0.5 border-white/20 rounded-sm data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                  data-testid="marketing-checkbox"
                />
                <label htmlFor="marketing" className="text-sm text-white/50 font-body leading-relaxed cursor-pointer">
                  Send me updates about new features
                </label>
              </div>
            </div>

            <Turnstile ref={turnstileRef} onVerify={setTurnstileToken} />

            <Button
              type="submit"
              className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-sm font-body font-semibold text-sm"
              disabled={isLoading || !acceptTerms || !turnstileToken}
              data-testid="signup-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30 font-body">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignup}
            disabled={!acceptTerms}
            variant="outline"
            className="w-full h-12 bg-transparent border-white/10 text-white hover:bg-white/5 rounded-sm font-body font-medium text-sm gap-3"
            data-testid="google-signup-btn"
          >
            <GoogleIcon className="w-4 h-4" />
            Continue with Google
          </Button>

          {/* Mobile footer */}
          <div className="lg:hidden mt-12 text-xs text-white/30 font-body flex gap-6">
            <Link href="/terms" className="hover:text-white/60 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white/60 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
