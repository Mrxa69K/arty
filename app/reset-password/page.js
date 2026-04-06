'use client'

import { useEffect, useState } from 'react'
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

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        toast.error('Reset link is invalid or expired.')
        router.push('/login')
        return
      }
      setReady(true)
    }
    checkSession()
  }, [router])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Password updated successfully.')
      router.push('/dashboard')
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0EA]">
        <span className="text-xs text-black/60">Checking reset link...</span>
      </div>
    )
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
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center px-4 py-2 border border-black/80 rounded-[999px] bg-black/5 backdrop-blur-sm">
              <span  className="text-xs tracking-[0.18em] uppercase">
                ARTYDROP
              </span>
            </div>
          </div>

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

          <div className="text-[11px] text-black/65 flex gap-4">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>

        {/* right side – new password form */}
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

            <Card className="border border-black/10 bg-[#F8F3EB]/95 shadow-2xl rounded-3xl">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-xl font-semibold text-center">
                  Choose a new password
                </CardTitle>
                <CardDescription className="text-center text-xs text-black/60">
                  Your new password will be used the next time you sign in.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleUpdate}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-xs text-black/70"
                    >
                      New password
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
                    className="w-full h-10 rounded-full bg.black text-white hover:bg-black/90 text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating password...
                      </>
                    ) : (
                      'Update password'
                    )}
                  </Button>
                  <p className="text-center text-sm text-black/60">
                    Changed your mind?{' '}
                    <Link
                      href="/login"
                      className="text-black hover:underline font-medium"
                    >
                      Back to sign in
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
