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
import { Camera, Loader2, Eye, EyeOff } from 'lucide-react'

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

    console.log('✅ Login successful!')

    // ✅ IMPORTANT: Wait for session to be saved to localStorage
    await new Promise(resolve => setTimeout(resolve, 500))

    // Get redirect path
    const searchParams = new URLSearchParams(window.location.search)
    const redirect = searchParams.get('redirect') || '/dashboard'
    
    console.log('🔵 Redirecting to:', redirect)
    
    // ✅ Force a FULL page reload (not just client-side navigation)
    window.location.replace(redirect)
    
  } catch (error) {
    console.error('❌ Login failed:', error)
    setError(error.message)
    setIsLoading(false)
  }
}
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage:  "url('/cover.webp')",
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
              <Link href="/" className="text-xs tracking-[0.18em] font-semibold uppercase">
                ARTYdrop
              </Link>
            </div>
          </div>

          <div className="mb-4">
            <p className="tagline-aura text-[15px] font-semibold text-center text-black/80 tracking-[0.22em] uppercase whitespace-nowrap animate-[float_6s_ease-in-out_infinite]">
              Calm, intentional delivery for modern photographers.
            </p>
          </div>

          <div className="text-[11px] text-black/65 flex gap-4">
            <Link href="/terms" className="hover:text-black transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-black transition-colors">
              Privacy Policy
            </Link>
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
                  Log in
                </CardTitle>
                <CardDescription className="text-center text-xs text-black/60">
                  or{' '}
                  <Link
                    href="/signup"
                    className="underline underline-offset-4 text-black"
                  >
                    create an account
                  </Link>
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
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
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ?  "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-10 rounded-full border-black/10 bg-[#FDF9F3] text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/70 transition-colors"
                        disabled={isLoading}
                        aria-label={showPassword ? "Hide password" :  "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={setRememberMe}
                          disabled={isLoading}
                          className="border-black/20 data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                        <label
                          htmlFor="remember"
                          className="text-[11px] text-black/60 cursor-pointer"
                        >
                          Remember me
                        </label>
                      </div>
                      <Link
                        href="/forgot-password"
                        className="text-[11px] text-black/60 hover:text-black underline underline-offset-4 transition-colors"
                      >
                        Forgot password? 
                      </Link>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-10 rounded-full bg-black text-white hover:bg-black/90 text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Enter'
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