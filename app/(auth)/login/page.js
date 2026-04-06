'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      await new Promise(resolve => setTimeout(resolve, 500))

      const searchParams = new URLSearchParams(window.location.search)
      const redirect = searchParams.get('redirect') || '/dashboard'
      
      window.location.replace(redirect)
      
    } catch (error) {
      console.error('Login failed:', error)
      setError(error.message)
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
            src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80"
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
          <blockquote className="font-display text-3xl text-white/80 leading-relaxed">
            "The simplest way to deliver photos to my clients. Period."
          </blockquote>
          <p className="text-sm text-white/40 font-body">
            — Professional Photographer
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
              Welcome back
            </h1>
            <p className="text-sm text-white/40 font-body">
              Don't have an account?{' '}
              <Link href="/signup" className="text-gold hover:text-gold-light transition-colors">
                Sign up
              </Link>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-sm text-sm text-red-400 font-body animate-fadeIn">
                {error}
              </div>
            )}

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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  disabled={isLoading}
                  className="border-white/20 rounded-sm data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                />
                <label htmlFor="remember" className="text-sm text-white/50 font-body cursor-pointer">
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-white/50 hover:text-white font-body transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-sm font-body font-semibold text-sm"
              disabled={isLoading}
              data-testid="login-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
                  Signing in...
                </>
              ) : (
                'Sign in'
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
