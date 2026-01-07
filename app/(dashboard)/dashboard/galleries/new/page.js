'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Camera, FileText, Sparkles, ArrowRight } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

export default function NewGalleryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    event_date: '',
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to create a gallery')
        return
      }

      const galleryId = uuidv4()
      const { error } = await supabase
        .from('galleries')
        .insert({
          id: galleryId,
          owner_id: user.id,
          title: formData.title,
          client_name: formData.client_name || null,
          event_date: formData.event_date || null,
          notes: formData.notes || null,
          status: 'draft'
        })

      if (error) throw error

      toast.success('Gallery created! Now add your photos.')
      router.push(`/dashboard/galleries/${galleryId}`)
    } catch (error) {
      console.error('Error creating gallery:', error)
      toast.error('Failed to create gallery')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Link */}
      <Link href="/dashboard/galleries" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Galleries
      </Link>

      {/* Hero Header */}
      <div className="text-center space-y-3 py-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Create New Gallery</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Set up your gallery details first, then you'll be able to upload photos and configure sharing.
        </p>
      </div>

      {/* Main Form Card */}
      <Card className="shadow-xl border-0">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Gallery Details
          </CardTitle>
          <CardDescription>
            Fill in the basic information about this photo gallery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Gallery Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Gallery Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Sarah & John's Wedding"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={isLoading}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                This title will be displayed to your client at the top of their gallery.
              </p>
            </div>

            {/* Client Name & Event Date */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="client_name" className="text-sm font-medium">
                  Client Name
                </Label>
                <Input
                  id="client_name"
                  placeholder="e.g., Sarah Johnson"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  disabled={isLoading}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Helps you organize and find galleries.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date" className="text-sm font-medium">
                  Event Date
                </Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  disabled={isLoading}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Displayed in the gallery header.
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes (private)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any private notes about this gallery, client preferences, special requests..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                disabled={isLoading}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                These notes are only visible to you and won't be shared with clients.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isLoading || !formData.title}
                className="flex-1 h-11 text-base shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Gallery
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
              <Link href="/dashboard/galleries" className="sm:w-auto">
                <Button type="button" variant="outline" disabled={isLoading} className="w-full h-11">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* What's Next Hint */}
      <Card className="bg-slate-50 border-0">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Camera className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">What happens next?</p>
              <p className="text-sm text-muted-foreground">
                After creating the gallery, you'll be able to upload photos, set security options like password protection, and generate a share link to send to your client.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
