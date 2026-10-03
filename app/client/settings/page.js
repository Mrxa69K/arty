'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Bell, Lock, Trash2, Camera } from 'lucide-react'

export default function ClientSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isBecomingPhotographer, setIsBecomingPhotographer] = useState(false)

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

  const handleBecomePhotographer = async () => {
    setIsBecomingPhotographer(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: 'photographer' })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Welcome aboard! Taking you to your new dashboard...')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error switching account type:', error)
      toast.error('Failed to switch account type')
      setIsBecomingPhotographer(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteDialogOpen(false)
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed] pb-12">
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
            Settings
          </h1>
          <p className="text-sm text-white/50 font-body">
            Manage your account preferences and security
          </p>
        </div>

        <div className="space-y-6">
          {/* Become a photographer */}
          <div className="bg-gold/5 border border-gold/20 rounded-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Camera className="w-5 h-5 text-gold" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-lg text-white">Are you a photographer?</h2>
            </div>
            <p className="text-xs text-white/30 font-body mb-6 ml-[52px]">
              Switch to a photographer account to create and deliver your own galleries
            </p>

            <Button
              onClick={handleBecomePhotographer}
              disabled={isBecomingPhotographer}
              className="w-full h-11 rounded-sm bg-gold text-black hover:bg-gold-light text-sm font-body font-semibold"
            >
              {isBecomingPhotographer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Switching...
                </>
              ) : (
                'Switch to a photographer account'
              )}
            </Button>
          </div>

          {/* Notification Settings */}
          <div className="bg-[#121212] border border-white/5 rounded-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white/50" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-lg text-white">Notifications</h2>
            </div>
            <p className="text-xs text-white/30 font-body mb-6 ml-[52px]">
              Choose what emails you want to receive
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="gallery-notifications"
                  checked={galleryNotifications}
                  onCheckedChange={setGalleryNotifications}
                  className="mt-0.5 border-white/20 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                />
                <div className="flex-1">
                  <label
                    htmlFor="gallery-notifications"
                    className="text-sm text-white/80 font-body font-medium cursor-pointer block"
                  >
                    Gallery notifications
                  </label>
                  <p className="text-xs text-white/30 font-body mt-1">
                    Get notified when photographers share new galleries with you
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="marketing"
                  checked={marketingEmails}
                  onCheckedChange={setMarketingEmails}
                  className="mt-0.5 border-white/20 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                />
                <div className="flex-1">
                  <label
                    htmlFor="marketing"
                    className="text-sm text-white/80 font-body font-medium cursor-pointer block"
                  >
                    Marketing emails
                  </label>
                  <p className="text-xs text-white/30 font-body mt-1">
                    Receive updates about new features and special offers
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSaveNotifications}
                disabled={isSaving}
                className="w-full h-11 rounded-sm bg-gold text-black hover:bg-gold-light text-sm font-body font-semibold mt-4"
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
            </div>
          </div>

          {/* Password Settings */}
          <div className="bg-[#121212] border border-white/5 rounded-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white/50" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-lg text-white">Password</h2>
            </div>
            <p className="text-xs text-white/30 font-body mb-6 ml-[52px]">
              Change your password to keep your account secure
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="block text-xs text-white/40 font-body mb-2">
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
                  className="h-11 rounded-sm border-white/8 bg-white/[0.03] text-sm text-white placeholder:text-white/20 font-body focus-visible:ring-0 focus-visible:border-white/20"
                />
              </div>

              <div>
                <Label htmlFor="newPassword" className="block text-xs text-white/40 font-body mb-2">
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
                  className="h-11 rounded-sm border-white/8 bg-white/[0.03] text-sm text-white placeholder:text-white/20 font-body focus-visible:ring-0 focus-visible:border-white/20"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="block text-xs text-white/40 font-body mb-2">
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
                  className="h-11 rounded-sm border-white/8 bg-white/[0.03] text-sm text-white placeholder:text-white/20 font-body focus-visible:ring-0 focus-visible:border-white/20"
                />
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full h-11 rounded-sm bg-gold text-black hover:bg-gold-light text-sm font-body font-semibold mt-2"
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
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-sm bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-lg text-red-400">Delete Account</h2>
            </div>
            <p className="text-xs text-red-400/60 font-body mb-6 ml-[52px]">
              Irreversible actions that affect your account
            </p>

            <div className="space-y-3">
              <p className="text-sm text-white/50 font-body">
                Once you delete your account, all your data will be permanently removed.
              </p>
              <Button
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
                className="w-full h-11 rounded-sm bg-red-600 text-white hover:bg-red-700 text-sm font-body font-semibold"
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
              <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete your account?"
                description="This permanently removes your account and all your data. This action cannot be undone."
                confirmText="Delete account"
                isLoading={isDeleting}
                onConfirm={handleDeleteAccount}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
