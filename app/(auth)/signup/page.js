'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      })

      if (error) throw error

      toast.success('Account created! Please check your email to verify.')
      router.push('/dashboard')
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: "url('/cover.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 bg-[#F5F0EA]/90" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
          backgroundSize: 'cover',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <Link href="/" className="mb-12">
          <span className="text-3xl font-serif text-black/90 tracking-tight">
            Artydrop
          </span>
        </Link>

        {/* Signup Form */}
        <div className="w-full max-w-md">
          <div className="bg-white/60 backdrop-blur-xl border border-black/10 rounded-2xl p-8 shadow-xl">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-serif text-black/90 mb-2">
                Create account
              </h1>
              <p className="text-sm text-black/60">
                Start delivering beautiful galleries
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-black/50 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/80 border border-black/10 text-black/90 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-black/50 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/80 border border-black/10 text-black/90 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-black text-white font-medium hover:scale-[1.02] transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign up'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-black/60">
                Already have an account?{' '}
                <Link href="/login" className="text-black/90 hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-black/40">
          By signing up, you agree to our terms and conditions
        </p>
      </div>
    </main>
  )
}
