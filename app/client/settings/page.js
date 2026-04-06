'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Settings, Bell, Lock, Trash2 } from 'lucide-react'

export default function ClientSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Settings
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [galleryNotifications, setGalleryNotifications] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!user) return
    fetchSettings()
  }, [user])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('marketing_emails, user_type')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Redirect photographers
      if (data?.user_type === 'photographer') {
        router.push('/dashboard')
        return
      }

      setMarketingEmails(data?.marketing_emails || false)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          marketing_emails: marketingEmails 
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Notification settings updated!')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
  e.preventDefault()
  
  if (newPassword !== confirmPassword) {
    toast.error('Passwords do not match')
    return
  }

  if (newPassword.length < 6) {
    toast.error('Password must be at least 6 characters')
    return
  }

  // ✅ NEW: Verify current password first
  setIsSaving(true)
  try {
    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })

    if (verifyError) {
      toast.error('Current password is incorrect')
      setIsSaving(false)
      return
    }

    // If verification passed, update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    toast.success('Password updated successfully!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  } catch (error) {
    console.error('Error changing password:', error)
    toast.error(error.message || 'Failed to change password')
  } finally {
    setIsSaving(false)
  }
}


  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
      return
    }

    setIsDeleting(true)
    try {
      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) throw profileError

      // Sign out
      await supabase.auth.signOut()
      
      toast.success('Account deleted successfully')
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
      setIsDeleting(false)
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

      <div className="relative z-10 min-h-screen pb-12">
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
              Settings
            </h1>
            <p className="text-sm text-black/60">
              Manage your account preferences and security
            </p>
          </div>

          <div className="space-y-6">
            {/* Notification Settings */}
            <Card className="border border-black/10 bg-[#F8F3EB]/95 shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-black/60" />
                  </div>
                  Notifications
                </CardTitle>
                <CardDescription className="text-xs text-black/60">
                  Choose what emails you want to receive
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="gallery-notifications"
                    checked={galleryNotifications}
                    onCheckedChange={setGalleryNotifications}
                    className="mt-0.5 border-black/20 data-[state=checked]:bg-black data-[state=checked]:border-black"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="gallery-notifications"
                      className="text-sm text-black/90 font-medium cursor-pointer block"
                    >
                      Gallery notifications
                    </label>
                    <p className="text-xs text-black/60 mt-1">
                      Get notified when photographers share new galleries with you
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="marketing"
                    checked={marketingEmails}
                    onCheckedChange={setMarketingEmails}
                    className="mt-0.5 border-black/20 data-[state=checked]:bg-black data-[state=checked]:border-black"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="marketing"
                      className="text-sm text-black/90 font-medium cursor-pointer block"
                    >
                      Marketing emails
                    </label>
                    <p className="text-xs text-black/60 mt-1">
                      Receive updates about new features and special offers
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                  className="w-full h-10 rounded-full bg-black text-white hover:bg-black/90 text-sm mt-4"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save preferences'
                  )}
                </Button>
              </CardContent>
            </Card>
{/* Password Settings */}
<Card className="border border-black/10 bg-[#F8F3EB]/95 shadow-xl rounded-3xl">
  <CardHeader>
    <CardTitle className="text-lg font-semibold flex items-center gap-2">
      <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
        <Lock className="w-5 h-5 text-black/60" />
      </div>
      Password
    </CardTitle>
    <CardDescription className="text-xs text-black/60">
      Change your password to keep your account secure
    </CardDescription>
  </CardHeader>

  <form onSubmit={handleChangePassword}>
    <CardContent className="space-y-4">
      {/* ✅ NEW: Current Password Field */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword" className="text-xs text-black/70">
          Current Password
        </Label>
        <Input
          id="currentPassword"
          type="password"
          placeholder="••••••••"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          disabled={isSaving}
          className="h-10 rounded-full border-black/10 bg-[#FDF9F3] text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-xs text-black/70">
          New Password
        </Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          disabled={isSaving}
          className="h-10 rounded-full border-black/10 bg-[#FDF9F3] text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-xs text-black/70">
          Confirm New Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          disabled={isSaving}
          className="h-10 rounded-full border-black/10 bg-[#FDF9F3] text-sm"
        />
      </div>

      <Button
        type="submit"
        disabled={isSaving}
        className="w-full h-10 rounded-full bg-black text-white hover:bg-black/90 text-sm mt-2"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          'Update password'
        )}
      </Button>
    </CardContent>
  </form>
</Card>


            {/* Danger Zone */}
            <Card className="border border-red-200 bg-red-50/50 backdrop-blur-xl shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-900">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  Delete Account
                </CardTitle>
                <CardDescription className="text-xs text-red-800">
                  Irreversible actions that affect your account
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-red-900">
                    Once you delete your account, All your data will be permanently removed.
                  </p>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    variant="destructive"
                    className="w-full h-10 rounded-full bg-red-600 text-white hover:bg-red-700 text-sm"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting account...
                      </>
                    ) : (
                      'Delete account'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}
