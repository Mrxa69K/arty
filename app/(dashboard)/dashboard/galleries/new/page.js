'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import bcrypt from 'bcryptjs'
import { format } from 'date-fns'

import { 
  Upload, 
  Settings, 
  Eye, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  Image as ImageIcon,
  Lock,
  Clock,
  Share2,
  X,
  Mail
} from 'lucide-react'

export default function NewGalleryWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editGalleryId = searchParams?. get('id')
  
  // Core state
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const hasCreatedGallery = useRef(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Gallery state
  const [galleryId, setGalleryId] = useState(editGalleryId || null)
  const [photos, setPhotos] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [folders, setFolders] = useState([])
  
  // Details state
  const [details, setDetails] = useState({
    title:  '',
    clientName: '',
    clientEmail: '',
    eventDate: '',
    notes: ''
  })

  // Sharing state
  const [sharing, setSharing] = useState({
    hasPassword: false,
    password: '',
    expiresAt: '',
    allowDownload: true,
    message: ''
  })

  const [galleryLink, setGalleryLink] = useState(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const steps = [
    { number: 1, name: 'Upload Photos', icon: Upload },
    { number: 2, name:  'Gallery Details', icon: Settings },
    { number: 3, name:  'Settings & Publish', icon: Lock },
    { number: 4, name: 'Review', icon: Eye }
  ]

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (! galleryId) return

    const interval = setInterval(() => {
      saveDraft()
    }, 30000)

    return () => clearInterval(interval)
  }, [galleryId, details, sharing])

  useEffect(() => {
  const initGallery = async () => {
    // ✅ If editing existing gallery, fetch it
    if (editGalleryId) {
      console.log('📝 Editing existing gallery:', editGalleryId)
      await fetchExistingGallery(editGalleryId)
      return
    }

    // ✅ Otherwise, check if we should create new gallery
    if (hasCreatedGallery. current || galleryId || isCreating) {
      console.log('⏭️ Skipping gallery creation - already exists')
      return
    }
    
    hasCreatedGallery.current = true
    setIsCreating(true)
    
    try {
      const { data: { user }, error: userError } = await supabase. auth.getUser()
      
      if (userError || !user) {
        console.error('Not authenticated:', userError)
        toast.error('Please log in to create galleries')
        router.push('/login')
        return
      }

      // ✅ NEW:  Check gallery limit BEFORE creating
      console.log('🔵 Checking gallery limits...')
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type, plan_status, gallery_credits')
        .eq('id', user.id)
        .single()

      const userPlan = profile?.plan_type || 'none'

      // PAYG: check credits
      if (userPlan === 'payg') {
        const credits = profile?.gallery_credits || 0
        if (credits <= 0) {
          toast.error('No gallery credits remaining. Purchase a new gallery to continue.')
          setTimeout(() => router.push('/dashboard'), 2000)
          return
        }
      } else if (userPlan !== 'studio') {
        const { count: galleryCount } = await supabase
          .from('galleries')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)

        const galleryLimits = { none: 0, test: 1 }
        const limit = galleryLimits[userPlan] ?? 0

        if (galleryCount >= limit) {
          toast.error(`You've reached your plan limit. Upgrade to create more.`)
          setTimeout(() => router.push('/dashboard'), 2000)
          return
        }
      }

      // ✅ All checks passed - create gallery
      console.log('🆕 Creating new gallery...')

      const { data, error } = await supabase
        .from('galleries')
        .insert({
          owner_id: user. id,
          title: 'Untitled Gallery',
          status: 'draft'
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create gallery:', error)
        throw error
      }
      
      console.log('✅ Gallery created:', data.id)
      setGalleryId(data.id)

      // PAYG: deduct 1 credit
      if (userPlan === 'payg') {
        await supabase
          .from('profiles')
          .update({ gallery_credits: Math.max(0, (profile?.gallery_credits || 1) - 1) })
          .eq('id', user.id)
      }

      await createDefaultFolders(data.id)

      
    } catch (error) {
      console.error('Error creating draft:', error)
      toast.error('Failed to create gallery')
      hasCreatedGallery.current = false
      router.push('/dashboard')
    } finally {
      setIsCreating(false)
    }
  }
  
  initGallery()
}, [editGalleryId])

  const fetchExistingGallery = async (id) => {
    try {
      setIsCreating(true)
      
      const { data: gallery, error:  galleryError } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', id)
        .single()

      if (galleryError) throw galleryError

      setGalleryId(id)
      setDetails({
        title: gallery.title || '',
        clientName: gallery.client_name || '',
        clientEmail: gallery.client_email || '',
        eventDate: gallery.event_date || '',
        notes: gallery.notes || ''
      })

      const { data: photos } = await supabase
        . from('photos')
        .select('*')
        .eq('gallery_id', id)
        .order('sort_order', { ascending: true })

      setPhotos(photos || [])

      const { data: folders } = await supabase
        .from('folders')
        .select('*')
        .eq('gallery_id', id)
        .order('sort_order', { ascending: true })

      setFolders(folders || [])

      const { data: link } = await supabase
        .from('gallery_links')
        .select('*')
        .eq('gallery_id', id)
        .single()

      if (link) {
        setSharing({
          hasPassword: !!link.password_hash,
          password: '',
          expiresAt: link.expires_at ? format(new Date(link.expires_at), 'yyyy-MM-dd') : '',
          allowDownload: link.allow_download !== false,
          message: link.message || ''
        })
        setGalleryLink(link)
      }

      if (photos && photos.length > 0) {
        setCurrentStep(2)
      }
      
      console.log('✅ Loaded existing gallery')
      
    } catch (error) {
      console.error('Error fetching gallery:', error)
      toast.error('Gallery not found')
      router.push('/dashboard/galleries')
    } finally {
      setIsCreating(false)
    }
  }


const createDefaultFolders = async (galleryId) => {
  const defaultFolders = [
    { name: '📸 Raw', folder_type: 'RAW', sort_order: 1 },
    { name: '✨ Edited', folder_type: 'EDITED', sort_order: 2 },
    { name: '🎥 Videos', folder_type: 'VIDEOS', sort_order: 3 },
    { name: '📁 Other', folder_type: 'OTHER', sort_order: 4 }
  ]

  try {
    for (const folder of defaultFolders) {
      await supabase.from('folders').insert({
        id: crypto.randomUUID(),
        gallery_id: galleryId,
        ...folder
      })
    }
    console.log('✅ Default folders created')
  } catch (error) {
    console.error('Error creating default folders:', error)
  }
}
  const saveDraft = async () => {
    if (!galleryId || isSaving) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('galleries')
        .update({
          title: details.title || 'Untitled Gallery',
          client_name: details.clientName,
          client_email: details. clientEmail || null,
          event_date: details.eventDate || null,
          notes: details.notes
        })
        .eq('id', galleryId)

      if (error) throw error
    } catch (error) {
      console.error('Save draft error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (! files.length) return

    setIsUploading(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error('Please log in')
        setIsUploading(false)
        return
      }

      for (const file of files) {
        const fileExt = file. name.split('.').pop()
        const fileName = `${user.id}/${galleryId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

        const isVideo = file.type.startsWith('video/')
        
        const fd = new FormData()
        fd.append('file', file)
        fd.append('fileName', fileName)

        const uploadRes = await fetch('/api/upload/presign', { method: 'POST', body: fd })
        if (!uploadRes.ok) throw new Error('Upload failed')
        const { publicUrl } = await uploadRes.json()

        const { data: photoData, error: dbError } = await supabase
          .from('photos')
          .insert({
            gallery_id: galleryId,
            storage_path: fileName,
            image_url: isVideo ? null : publicUrl,
            video_url: isVideo ? publicUrl : null,
            media_type: isVideo ? 'video' : 'image',
            file_name: file.name,
            file_size: file.size
          })
          .select()
          .single()

        if (dbError) throw dbError

        setPhotos(prev => [...prev, photoData])
      }

      toast.success(`${files.length} file(s) uploaded`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }

  const deletePhoto = async (photoId) => {
    try {
      const photoToDelete = photos.find(p => p.id === photoId)
      if (!photoToDelete) return

      if (photoToDelete.storage_path) {
        await fetch('/api/upload/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePath: photoToDelete.storage_path }),
        })
      }
      
      await supabase.from('photos').delete().eq('id', photoId)
      
      setPhotos(photos.filter(p => p.id !== photoId))
      toast.success('Photo deleted')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete photo')
    }
  }

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Generate share link
  const handleGenerateLink = async () => {
    setIsGeneratingLink(true)
    
    try {
      let passwordHash = null
      if (sharing.hasPassword && sharing.password) {
        passwordHash = await bcrypt.hash(sharing.password, 10)
      }

      const { data:  existingLink } = await supabase
        . from('gallery_links')
        .select('*')
        .eq('gallery_id', galleryId)
        .single()

      if (existingLink) {
        const { error } = await supabase
          .from('gallery_links')
          .update({
            password_hash: passwordHash,
            expires_at: sharing.expiresAt || null,
            allow_download: sharing.allowDownload,
            message: sharing.message || null
          })
          .eq('gallery_id', galleryId)

        if (error) throw error

        setGalleryLink(existingLink)
        toast.success('Settings updated!')

      } else {
        const { data: newLink, error } = await supabase
          .from('gallery_links')
          .insert({
            id: crypto.randomUUID(),
            gallery_id: galleryId,
            token: galleryId,
            password_hash: passwordHash,
            expires_at: sharing.expiresAt || null,
            allow_download: sharing.allowDownload,
            message: sharing.message || null
          })
          .select()
          .single()

        if (error) throw error

        setGalleryLink(newLink)
        toast.success('Share link generated!')
      }
      
    } catch (error) {
      console.error('Error generating link:', error)
      toast.error('Failed to generate link')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  // Copy link to clipboard
  const copyShareLink = () => {
    if (galleryLink && typeof window !== 'undefined') {
      const baseUrl = window.location.origin
      const shareUrl = `${baseUrl}/g/${galleryLink. token}`
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Link copied!')
    }
  }

  // Navigation
  const goToNextStep = async () => {
    if (currentStep === 1 && photos.length === 0) {
      toast.error('Please upload at least one photo')
      return
    }

    if (currentStep === 2) {
      if (!details.title. trim()) {
        toast.error('Gallery title is required')
        return
      }

      if (details.clientEmail && !isValidEmail(details. clientEmail)) {
        toast.error('Please enter a valid client email')
        return
      }

      await saveDraft()
    }

    if (currentStep === 3 && !galleryLink) {
      toast.error('Please generate a share link first')
      return
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Publish gallery
const handlePublish = async () => {
  if (!details.title) {
    toast.error('Please add a gallery title')
    return
  }
  if (photos.length === 0) {
    toast.error('Please upload at least one photo')
    return
  }
  if (!galleryLink) {
    toast.error('Please generate a share link first')
    return
  }

  setIsPublishing(true)

  try {
    // Get plan to set expiration
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', currentUser.id)
      .single()

    const now = new Date()
    let expiresAt = null
    if (profile?.plan_type === 'payg') {
      expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString() // 6 months
    } else if (profile?.plan_type === 'test') {
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    }

    // 1. Update gallery
    const { error: galleryError } = await supabase
      .from('galleries')
      .update({
        status: 'active',
        title: details.title,
        client_name: details.clientName,
        client_email: details.clientEmail,
        event_date: details.eventDate || null,
        notes: details.notes,
        published_at: now.toISOString(),
        expires_at: expiresAt,
      })
      .eq('id', galleryId)

    if (galleryError) {
      console.error('❌ Gallery update error:', galleryError)
      throw new Error(`Gallery update failed: ${galleryError.message}`)
    }

    console.log('✅ Gallery updated')

    // 2. Update gallery link settings
    console.log('🔵 Updating gallery link.. .')
    let passwordHash = null
    if (sharing.hasPassword && sharing.password) {
      passwordHash = await bcrypt.hash(sharing.password, 10)
    }

    const { error: linkError } = await supabase
      .from('gallery_links')
      .update({
        password_hash: passwordHash,
        expires_at: sharing.expiresAt || null,
        allow_download: sharing.allowDownload,
        message: sharing.message || null
      })
      .eq('gallery_id', galleryId)

    if (linkError) {
      console.error('❌ Link update error:', linkError)
      throw new Error(`Link update failed: ${linkError.message}`)
    }

    console.log('✅ Link updated')

    // 3. Send email if provided
    if (details.clientEmail) {
      console.log('🔵 Sending email to:', details.clientEmail)
      try {
        const galleryUrl = `${window.location.origin}/g/${galleryLink.token}`
        
        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'galleryShared',
            to: details.clientEmail,
            data: {
              clientName: details.clientName || '',
              galleryTitle: details.title,
              galleryUrl,
              password: sharing.hasPassword ? sharing.password : null
            }
          })
        })

        if (emailResponse.ok) {
          console.log('✅ Email sent successfully')
        } else {
          console.warn('⚠️ Email failed but continuing...')
        }
      } catch (emailError) {
        console.error('⚠️ Email error (non-critical):', emailError)
      }
    }

    // ✅ Success!  Show modal
    console.log('✅ Publish complete!')
    setShowSuccessModal(true)
    
    // ✅ Auto-redirect after 5 seconds
    setTimeout(() => {
      router.push('/dashboard')
    }, 5000)

  } catch (error) {
    console.error('❌ Publish error:', error)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error details:', JSON.stringify(error, null, 2))
    toast.error(`Failed to publish:  ${error.message || 'Unknown error'}`)
  } finally {
    setIsPublishing(false)
  }
}

  if (! galleryId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0" style={{ backgroundImage: "url('/cover.webp')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="fixed inset-0 bg-[#F5F0EA]/10 mix-blend-soft-light" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.14] mix-blend-multiply" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1. 2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")", backgroundSize: 'cover' }} />

      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Progress Bar */}
          <Card className="border border-black/10 bg-white/90 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  const isActive = currentStep === step.number
                  const isCompleted = currentStep > step.number

                  return (
                    <div key={step.number} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center transition-all
                          ${isCompleted ?  'bg-green-500 text-white' : 
                            isActive ? 'bg-black text-white' : 
                            'bg-black/10 text-black/40'}
                        `}>
                          {isCompleted ?  (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <p className={`text-xs mt-2 font-medium hidden sm:block ${isActive ? 'text-black' :  'text-black/50'}`}>
                          {step.name}
                        </p>
                      </div>

                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-3 ${currentStep > step.number ? 'bg-green-500' : 'bg-black/10'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card className="border border-black/10 bg-white/90 shadow-xl rounded-2xl">
            <CardContent className="p-8">
              
              {/* STEP 1: Upload Photos */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-black mb-2">Upload Photos</h2>
                    <p className="text-sm text-black/60">Add photos to your gallery.  You can upload multiple files at once.</p>
                  </div>

                  <label className="block">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <div className="border-2 border-dashed border-black/20 rounded-2xl p-12 text-center hover:border-black/40 transition-colors cursor-pointer bg-black/5">
                      {isUploading ? (
                        <Loader2 className="w-12 h-12 mx-auto text-black/40 animate-spin mb-4" />
                      ) : (
                        <Upload className="w-12 h-12 mx-auto text-black/40 mb-4" />
                      )}
                      <p className="text-sm font-medium text-black/80 mb-1">
                        {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-black/50">
                        JPG, PNG, or MP4 (max 50MB per file)
                      </p>
                    </div>
                  </label>

                  {photos.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-black/70 mb-3">{photos.length} photo(s) uploaded</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {photos.map(photo => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.image_url || photo.video_url}
                              alt=""
                              className="w-full h-32 object-cover rounded-xl"
                            />
                            <button
                              onClick={() => deletePhoto(photo.id)}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Gallery Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-black mb-2">Gallery Details</h2>
                    <p className="text-sm text-black/60">Add information about this gallery. </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black/80 mb-2">
                        Gallery Title *
                      </label>
                      <input
                        type="text"
                        value={details.title}
                        onChange={(e) => setDetails({ ...details, title: e.target.value })}
                        placeholder="e.g., Sarah's Wedding"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black/80 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Client Name
                      </label>
                      <input
                        type="text"
                        value={details.clientName}
                        onChange={(e) => setDetails({ ...details, clientName: e.target.value })}
                        placeholder="e.g., Sarah Martinez"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white focus: outline-none focus:ring-2 focus:ring-black/20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black/80 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Client Email
                      </label>
                      <input
                        type="email"
                        value={details.clientEmail}
                        onChange={(e) => setDetails({ ...details, clientEmail: e.target.value })}
                        placeholder="client@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                      />
                      <p className="text-xs text-black/50 mt-1">
                        Client will receive an email with access to this gallery when published
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black/80 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={details.eventDate}
                        onChange={(e) => setDetails({ ...details, eventDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black/80 mb-2">
                        Notes (optional)
                      </label>
                      <textarea
                        value={details.notes}
                        onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                        placeholder="Add any notes or instructions..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Sharing Settings */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-black mb-2">Sharing Settings</h2>
                    <p className="text-sm text-black/60">Configure how clients access this gallery.</p>
                  </div>

                  {/* Show Generated Link */}
                  {galleryLink && (
                    <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-900 mb-2">
                            Share link ready! 
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 rounded-lg bg-white border border-green-200 text-xs text-green-800 truncate font-mono">
                              {typeof window !== 'undefined' && `${window.location.origin}/g/${galleryLink. token}`}
                            </code>
                            <button
                              onClick={copyShareLink}
                              className="px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-2 flex-shrink-0"
                            >
                              {copied ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-3 h-3" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Password Protection */}
                    <div className="border border-black/10 rounded-xl p-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-black/60" />
                          <div>
                            <p className="font-medium text-black/80">Password Protection</p>
                            <p className="text-xs text-black/50">Require a password to view</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={sharing.hasPassword}
                          onChange={(e) => setSharing({ ...sharing, hasPassword: e.target.checked })}
                          className="w-5 h-5 rounded"
                        />
                      </label>

                      {sharing.hasPassword && (
                        <div className="relative mt-3">
                          <input
                            type={showPassword ? 'text' :  'password'}
                            value={sharing.password}
                            onChange={(e) => setSharing({ ...sharing, password: e. target.value })}
                            placeholder="Enter password"
                            className="w-full px-4 py-2 pr-10 rounded-lg border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/60"
                          >
                            {showPassword ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expiration Date */}
                    <div className="border border-black/10 rounded-xl p-4">
                      <label className="block">
                        <div className="flex items-center gap-3 mb-3">
                          <Clock className="w-5 h-5 text-black/60" />
                          <div>
                            <p className="font-medium text-black/80">Expiration Date</p>
                            <p className="text-xs text-black/50">Gallery will expire after this date</p>
                          </div>
                        </div>
                        <input
                          type="date"
                          value={sharing.expiresAt}
                          onChange={(e) => setSharing({ ...sharing, expiresAt: e. target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                      </label>
                    </div>

                    {/* Allow Downloads */}
                    <div className="border border-black/10 rounded-xl p-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="w-5 h-5 text-black/60" />
                          <div>
                            <p className="font-medium text-black/80">Allow Downloads</p>
                            <p className="text-xs text-black/50">Let clients download photos</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={sharing.allowDownload}
                          onChange={(e) => setSharing({ ...sharing, allowDownload: e.target.checked })}
                          className="w-5 h-5 rounded"
                        />
                      </label>
                    </div>

                    {/* Personal message */}
                    <div className="border border-black/10 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Mail className="w-5 h-5 text-black/60" />
                        <div>
                          <p className="font-medium text-black/80">Personal Message</p>
                          <p className="text-xs text-black/50">Optional note shown to your client on the gallery page</p>
                        </div>
                      </div>
                      <textarea
                        value={sharing.message}
                        onChange={(e) => setSharing({ ...sharing, message: e.target.value })}
                        placeholder="e.g. It was a pleasure capturing your day — enjoy every frame."
                        rows={3}
                        maxLength={300}
                        className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20 resize-none text-sm"
                      />
                      <p className="text-xs text-black/30 text-right mt-1">{sharing.message.length}/300</p>
                    </div>
                  </div>

                  {/* Generate/Update Link Button */}
                  <button
                    onClick={handleGenerateLink}
                    disabled={isGeneratingLink}
                    className="w-full h-12 rounded-full bg-black text-white font-medium hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGeneratingLink ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {galleryLink ?  'Updating...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        {galleryLink ? 'Update Link Settings' : 'Generate Share Link'}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STEP 4: Review & Publish */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-black mb-2">Review</h2>
                    <p className="text-sm text-black/60">Review your gallery before publishing.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-black/10 rounded-xl p-6 bg-black/5">
                      <h3 className="font-semibold text-black/80 mb-4">Gallery Summary</h3>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-black/60">Title:</span>
                          <span className="font-medium text-black">{details.title || 'Untitled'}</span>
                        </div>
                        
                        {details.clientName && (
                          <div className="flex justify-between">
                            <span className="text-black/60">Client: </span>
                            <span className="font-medium text-black">{details.clientName}</span>
                          </div>
                        )}

                        {details.clientEmail && (
                          <div className="flex justify-between">
                            <span className="text-black/60">Client Email:</span>
                            <span className="font-medium text-black">{details.clientEmail}</span>
                          </div>
                        )}
                        
                        {details. eventDate && (
                          <div className="flex justify-between">
                            <span className="text-black/60">Event Date: </span>
                            <span className="font-medium text-black">{details.eventDate}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-black/60">Photos:</span>
                          <span className="font-medium text-black">{photos.length} uploaded</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-black/60">Password:</span>
                          <span className="font-medium text-black">{sharing.hasPassword ? 'Yes' : 'No'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-black/60">Downloads:</span>
                          <span className="font-medium text-black">{sharing.allowDownload ?  'Allowed' : 'Disabled'}</span>
                        </div>

                        {sharing.expiresAt && (
                          <div className="flex justify-between">
                            <span className="text-black/60">Expires:</span>
                            <span className="font-medium text-black">{sharing.expiresAt}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {details.clientEmail && (
                      <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              Email notification will be sent
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              {details.clientEmail} will receive a link to view this gallery
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-black/80 mb-3">Photos Preview</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {photos.slice(0, 8).map(photo => (
                          <img
                            key={photo.id}
                            src={photo. image_url || photo.video_url}
                            alt=""
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ))}
                        {photos.length > 8 && (
                          <div className="w-full h-24 bg-black/10 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-black/60">+{photos.length - 8} more</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              onClick={goToPreviousStep}
              disabled={currentStep === 1}
              variant="outline"
              className="rounded-full px-6 text-black"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {isSaving && (
              <span className="text-xs text-black/50 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving draft...
              </span>
            )}

            {currentStep < 4 ?  (
              <Button
                onClick={goToNextStep}
                className="rounded-full px-6 bg-black text-white hover:bg-black/90"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/dashboard')}

                
                disabled={isPublishing}
                className="rounded-full px-8 bg-black text-white hover:bg-black/90"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Going back to dashboard
                  </>
                ) : (
                  <>
                    
                    Back to Dashboard
                  </>
                )}
              </Button>

              
            )}
          </div>

        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-md w-full mx-4 bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            {/* Success Icon */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
            </div>

            <div className="pt-16 text-center space-y-4">
              <h2 className="text-3xl font-serif text-black">
                Gallery Published!  🎉
              </h2>
              <p className="text-sm text-black/60">
                Your gallery "{details.title}" is now live and ready to share
              </p>

              {/* Share Link */}
              <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <p className="text-xs font-medium text-emerald-900 mb-2">
                  Share Link
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg bg-white border border-emerald-200 text-xs text-emerald-800 truncate font-mono">
                    {`${window.location.origin}/g/${galleryId}`}
                  </code>
                  <button
                    onClick={copyShareLink}
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Email confirmation */}
              {details.clientEmail && (
                <div className="flex items-center justify-center gap-2 text-xs text-black/60">
                  <Mail className="w-3 h-3" />
                  <span>Email sent to {details.clientEmail}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={() => router.push('/dashboard/galleries')}
                  className="w-full h-11 rounded-full bg-black text-white font-medium hover:bg-black/90 transition-colors"
                >
                  View All Galleries
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full h-11 rounded-full border border-black/10 text-black/70 font-medium hover:bg-black/5 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>

              <p className="text-xs text-black/40 mt-4">
                Redirecting in 5 seconds...
              </p>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}