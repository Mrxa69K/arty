'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  X
} from 'lucide-react'
import { toast } from 'sonner'
import bcrypt from 'bcryptjs'

export default function NewGalleryWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [galleryId, setGalleryId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const hasCreatedGallery = useRef(false)


  

  // Step 1: Photos
  const [photos, setPhotos] = useState([])
  const [isUploading, setIsUploading] = useState(false)

  // Step 2: Details
  const [details, setDetails] = useState({
    title: '',
    clientName: '',
    eventDate: '',
    notes: ''
  })

  // Step 3: Sharing
  const [sharing, setSharing] = useState({
    hasPassword: false,
    password: '',
    expiresAt: '',
    allowDownload: true
  })

  const steps = [
    { number: 1, name: 'Upload Photos', icon: Upload },
    { number: 2, name: 'Gallery Details', icon: Settings },
    { number: 3, name: 'Sharing Settings', icon: Lock },
    { number: 4, name: 'Review & Publish', icon: Eye }
  ]

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!galleryId) return

    const interval = setInterval(() => {
      saveDraft()
    }, 30000)

    return () => clearInterval(interval)
  }, [galleryId, details, sharing])

// Create gallery on mount
// Create gallery on mount
useEffect(() => {
  const initGallery = async () => {
    if (hasCreatedGallery.current || galleryId) return
    
    hasCreatedGallery.current = true
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // ✅ CHECK PLAN PERMISSION BEFORE CREATING
      const permissionCheck = await fetch('/api/galleries/check-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_gallery' })
      })

      const permissionResult = await permissionCheck.json()

      if (!permissionResult.allowed) {
        toast.error(permissionResult.reason || 'Cannot create gallery')
        router.push('/dashboard')
        return
      }

      const { data, error } = await supabase
        .from('galleries')
        .insert({
          owner_id: user.id,
          title: 'Untitled Gallery',
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error
      
      setGalleryId(data.id)
    } catch (error) {
      console.error('Error creating draft:', error)
      toast.error('Failed to create gallery')
      router.push('/dashboard')
    }
  }
  
  initGallery()
}, [galleryId])


  const saveDraft = async () => {
    if (!galleryId || isSaving) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('galleries')
        .update({
          title: details.title || 'Untitled Gallery',
          client_name: details.clientName,
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
  if (!files.length) return

  setIsUploading(true)

  try {
    const { data: { user } } = await supabase.auth.getUser()

    // ✅ Count current photos in gallery FIRST
    const { count: currentPhotoCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', galleryId)

    // ✅ Check if adding these files would exceed limit
    const totalAfterUpload = currentPhotoCount + files.length

    // ✅ CHECK PERMISSION BEFORE UPLOADING
    const permissionCheck = await fetch('/api/galleries/check-permission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'upload_photos',
        galleryId: galleryId,
        currentPhotoCount: currentPhotoCount,
        filesToUpload: files.length
      })
    })

    const permissionResult = await permissionCheck.json()

    if (!permissionResult.allowed) {
      toast.error(permissionResult.reason || 'Cannot upload photos')
      setIsUploading(false)
      return
    }

    // Continue with upload...
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${galleryId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      const isVideo = file.type.startsWith('video/')
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)

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

    // Delete from storage using storage_path
    if (photoToDelete.storage_path) {
      await supabase.storage.from('photos').remove([photoToDelete.storage_path])
    }
    
    // Delete from database
    await supabase.from('photos').delete().eq('id', photoId)
    
    setPhotos(photos.filter(p => p.id !== photoId))
    toast.success('Photo deleted')
  } catch (error) {
    console.error('Delete error:', error)
    toast.error('Failed to delete photo')
  }
}



  // Navigation
  const goToNextStep = async () => {
    if (currentStep === 1 && photos.length === 0) {
      toast.error('Please upload at least one photo')
      return
    }

    if (currentStep === 2) {
      if (!details.title.trim()) {
        toast.error('Gallery title is required')
        return
      }
      await saveDraft()
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
      console.log('Previous clicked! Current step:', currentStep)

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Step 4: Publish
  const handlePublish = async () => {
    setIsPublishing(true)

    try {
      let passwordHash = null
      if (sharing.hasPassword && sharing.password) {
        passwordHash = await bcrypt.hash(sharing.password, 10)
      }

      const { error: updateError } = await supabase
        .from('galleries')
        .update({
          title: details.title,
          client_name: details.clientName,
          event_date: details.eventDate || null,
          notes: details.notes,
          status: 'active',
          passwordhash: passwordHash,
          allow_download: sharing.allowDownload
        })
        .eq('id', galleryId)

      if (updateError) throw updateError

      toast.success('Gallery published!')
      router.push(`/dashboard/galleries/${galleryId}`)
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Failed to publish gallery')
    } finally {
      setIsPublishing(false)
    }
  }

  if (!galleryId) {
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
      <div className="fixed inset-0 bg-[#F5F0EA]/70 mix-blend-soft-light" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.14] mix-blend-multiply" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")", backgroundSize: 'cover' }} />

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
                          ${isCompleted ? 'bg-green-500 text-white' : 
                            isActive ? 'bg-black text-white' : 
                            'bg-black/10 text-black/40'}
                        `}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <p className={`text-xs mt-2 font-medium hidden sm:block ${isActive ? 'text-black' : 'text-black/50'}`}>
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
                    <p className="text-sm text-black/60">Add photos to your gallery. You can upload multiple files at once.</p>
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
                                src={photo.image_url || photo.video_url}  // ✅ image_url ou video_url
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
                    <p className="text-sm text-black/60">Add information about this gallery.</p>
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
                        className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                      />
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

                  <div className="space-y-4">
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
                        <input
                          type="text"
                          value={sharing.password}
                          onChange={(e) => setSharing({ ...sharing, password: e.target.value })}
                          placeholder="Enter password"
                          className="w-full mt-3 px-4 py-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                      )}
                    </div>

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
                          onChange={(e) => setSharing({ ...sharing, expiresAt: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                      </label>
                    </div>

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
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Publish */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-black mb-2">Review & Publish</h2>
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
                            <span className="text-black/60">Client:</span>
                            <span className="font-medium text-black">{details.clientName}</span>
                          </div>
                        )}
                        
                        {details.eventDate && (
                          <div className="flex justify-between">
                            <span className="text-black/60">Event Date:</span>
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
                          <span className="font-medium text-black">{sharing.allowDownload ? 'Allowed' : 'Disabled'}</span>
                        </div>

                        {sharing.expiresAt && (
                          <div className="flex justify-between">
                            <span className="text-black/60">Expires:</span>
                            <span className="font-medium text-black">{sharing.expiresAt}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-black/80 mb-3">Photos Preview</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {photos.slice(0, 8).map(photo => (
                          <img
                            key={photo.id}
                             src={photo.image_url || photo.video_url}
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

            {currentStep < 4 ? (
              <Button
                onClick={goToNextStep}
                className="rounded-full px-6 bg-black text-white hover:bg-black/90"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                className="rounded-full px-8 bg-black text-white hover:bg-black/90"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Publish Gallery
                  </>
                )}
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
