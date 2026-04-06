'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, User } from 'lucide-react'

export default function ClientProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!user) return
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, user_type')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Redirect photographers to their dashboard
      if (data?.user_type === 'photographer') {
        router.push('/dashboard')
        return
      }

      setFullName(data?.full_name || '')
      setEmail(user.email || '')
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        })

        if (emailError) throw emailError
        toast.success('Profile updated! Please verify your new email.')
      } else {
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0EA]">
        <Loader2 className="w-8 h-8 animate-spin text-black/20" />
      </div>
    )
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
      <div className="fixed inset-0 bg-[#F5F0EA]/80" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
          backgroundSize: 'cover',
        }}
      />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="pt-8 px-6 sm:px-12 max-w-4xl mx-auto">
          <Link 
            href="/client/dashboard"
            className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </header>

        {/* Main Content */}
        <section className="py-6 px-6 sm:px-12 max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-serif text-black/90 mb-2">
              Profile
            </h1>
            <p className="text-sm text-black/60">
              Manage your personal information
            </p>
          </div>

          <Card className="border border-black/10 bg-[#F8F3EB]/95 shadow-xl rounded-3xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-black/60" />
                </div>
                Personal Information
              </CardTitle>
            </CardHeader>

            <form onSubmit={handleSave}>
              <CardContent className="space-y-5">
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
                    disabled={isSaving}
                    className="h-10 rounded-full border-black/10 bg-[#FDF9F3] text-sm"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs text-black/70">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSaving}
                    className="h-10 rounded-full border-black/10 bg-[#FDF9F3] text-sm"
                  />
                  <p className="text-[10px] text-black/50">
                    Changing your email will require verification
                  </p>
                </div>

                {/* Account Type */}
                <div className="space-y-2">
                  <Label className="text-xs text-black/70">
                    Account Type
                  </Label>
                  <div className="px-4 py-2.5 rounded-full border border-black/10 bg-white/60 text-sm text-black/70">
                    Client
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-10 rounded-full bg-black text-white hover:bg-black/90 text-sm"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving changes...
                      </>
                    ) : (
                      'Save changes'
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </section>
      </div>
    </main>
  )
}
