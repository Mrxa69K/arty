'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Loader2, Eye, EyeOff, Camera, Images } from 'lucide-react'

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
        setIsLoading(false)
        return
      }

      if (authData.user) {
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
      setIsLoading(false)
    }
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
            Join thousands of photographers who trust ArtyDrop to deliver their work professionally.
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

            <Button
              type="submit"
              className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-sm font-body font-semibold text-sm"
              disabled={isLoading || !acceptTerms}
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
