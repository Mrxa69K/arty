'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Header */}
      <header className="pt-8 px-6 sm:px-12 max-w-4xl mx-auto">
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-2 text-sm font-body text-white/50 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Back to dashboard
        </Link>
      </header>

      {/* Main Content */}
      <section className="py-6 px-6 sm:px-12 max-w-2xl mx-auto">
        <div className="mb-10">
          <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
            Profile
          </h1>
          <p className="text-sm text-white/50 font-body">
            Manage your personal information
          </p>
        </div>

        <div className="bg-[#121212] border border-white/5 rounded-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center">
              <User className="w-5 h-5 text-white/50" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-lg text-white">Personal Information</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName" className="block text-xs text-white/40 font-body mb-2">
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
                className="h-11 rounded-sm border-white/8 bg-white/[0.03] text-sm text-white placeholder:text-white/20 font-body focus-visible:ring-0 focus-visible:border-white/20"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="block text-xs text-white/40 font-body mb-2">
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
                className="h-11 rounded-sm border-white/8 bg-white/[0.03] text-sm text-white placeholder:text-white/20 font-body focus-visible:ring-0 focus-visible:border-white/20"
              />
              <p className="text-[11px] text-white/25 font-body mt-1.5">
                Changing your email will require verification
              </p>
            </div>

            {/* Account Type */}
            <div>
              <Label className="block text-xs text-white/40 font-body mb-2">
                Account Type
              </Label>
              <div className="h-11 flex items-center px-4 rounded-sm border border-white/8 bg-white/[0.02] text-sm text-white/60 font-body">
                Client
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-11 rounded-sm bg-gold text-black hover:bg-gold-light text-sm font-body font-semibold"
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
          </form>
        </div>
      </section>
    </main>
  )
}
