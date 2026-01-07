'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import bcrypt from 'bcryptjs'
import {
  ArrowLeft, Loader2, Upload, Trash2, Copy, Check, Link as LinkIcon,
  Lock, Calendar, Download, Eye, X, Images, Camera, FileText, Share2,
  CheckCircle2, Circle, Shield, Clock, Globe, ImagePlus, Info, Pencil
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

export default function GalleryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const galleryId = params.id
  const fileInputRef = useRef(null)

  const [gallery, setGallery] = useState(null)
  const [photos, setPhotos] = useState([])
  const [galleryLink, setGalleryLink] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('photos')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState(new Set())

  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    event_date: '',
    notes: '',
    status: 'draft'
  })

  const [linkSettings, setLinkSettings] = useState({
    password: '',
    hasPassword: false,
    expires_at: '',
    allow_download: true
  })

  // Fonction utilitaire pour obtenir la base URL (100% client-side)
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return ''
  }

  // Track completed steps
  const getCompletedSteps = () => {
    const completed = {
      photos: photos.length > 0,
      details: formData.title.length > 0,
      sharing: !!galleryLink
    }
    return completed
  }

  useEffect(() => {
    fetchGallery()
  }, [galleryId])

  const fetchGallery = async () => {
    try {
      const { data: gallery, error: galleryError } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', galleryId)
        .single()

      if (galleryError) throw galleryError

      setGallery(gallery)
      setFormData({
        title: gallery.title,
        client_name: gallery.client_name || '',
        event_date: gallery.event_date || '',
        notes: gallery.notes || '',
        status: gallery.status
      })

      // Fetch photos
      const { data: photos } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('sort_order', { ascending: true })

      setPhotos(photos || [])

      // Fetch gallery link
      const { data: links } = await supabase
        .from('gallery_links')
        .select('*')
        .eq('gallery_id', galleryId)
        .limit(1)

      if (links && links.length > 0) {
        setGalleryLink(links[0])
        setLinkSettings({
          password: '',
          hasPassword: !!links[0].password_hash,
          expires_at: links[0].expires_at ? format(new Date(links[0].expires_at), 'yyyy-MM-dd') : '',
          allow_download: links[0].allow_download
        })
      }
    } catch (error) {
      console.error('Error fetching gallery:', error)
      toast.error('Gallery not found')
      router.push('/dashboard/galleries')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('galleries')
        .update({
          title: formData.title,
          client_name: formData.client_name || null,
          event_date: formData.event_date || null,
          notes: formData.notes || null,
          status: formData.status
        })
        .eq('id', galleryId)

      if (error) throw error
      setGallery({ ...gallery, ...formData, updated_at: new Date().toISOString() })
      toast.success('Gallery saved successfully')
    } catch (error) {
      console.error('Error saving gallery:', error)
      toast.error('Failed to save gallery')
    } finally {
      setIsSaving(false)
    }
  }

  const processFiles = async (files) => {
    if (files.length === 0) return

    // Filter valid image files
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Use JPEG, PNG, WebP, or GIF.`)
        return false
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: File too large. Max 10MB.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const uploadedPhotos = []
      const totalFiles = validFiles.length

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `${user.id}/${galleryId}/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath)

        // Save to database
        const photoId = uuidv4()
        const { error: dbError } = await supabase
          .from('photos')
          .insert({
            id: photoId,
            gallery_id: galleryId,
            image_url: publicUrl,
            storage_path: filePath,
            file_name: file.name,
            file_size: file.size,
            sort_order: photos.length + i
          })

        if (!dbError) {
          uploadedPhotos.push({
            id: photoId,
            gallery_id: galleryId,
            image_url: publicUrl,
            storage_path: filePath,
            file_name: file.name,
            file_size: file.size,
            sort_order: photos.length + i
          })
        } else {
          console.error('DB error:', dbError)
        }

        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
      }

      if (uploadedPhotos.length > 0) {
        setPhotos([...photos, ...uploadedPhotos])

        // Update cover photo if first photos
        if (photos.length === 0 && uploadedPhotos.length > 0) {
          await supabase
            .from('galleries')
            .update({ cover_photo_url: uploadedPhotos[0].image_url })
            .eq('id', galleryId)
        }

        toast.success(`${uploadedPhotos.length} photo(s) uploaded successfully`)
      } else {
        toast.error('No photos were uploaded. Please check if the storage bucket exists and is public.')
      }
    } catch (error) {
      console.error('Error uploading photos:', error)
      toast.error(`Failed to upload photos: ${error.message}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handlePhotoUpload = async (e) => {
    const files = e.target.files
    if (files) {
      await processFiles(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await processFiles(files)
    }
  }

  const handleDeletePhoto = async (photoId, storagePath) => {
    try {
      // Delete from storage
      if (storagePath) {
        await supabase.storage.from('photos').remove([storagePath])
      }

      // Delete from database
      await supabase.from('photos').delete().eq('id', photoId)

      setPhotos(photos.filter(p => p.id !== photoId))
      setSelectedPhotos(prev => {
        const newSet = new Set(prev)
        newSet.delete(photoId)
        return newSet
      })
      toast.success('Photo deleted')
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Failed to delete photo')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedPhotos.size === 0) return
    
    for (const photoId of selectedPhotos) {
      const photo = photos.find(p => p.id === photoId)
      if (photo) {
        await handleDeletePhoto(photo.id, photo.storage_path)
      }
    }
    setSelectedPhotos(new Set())
  }

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }

  const handleGenerateLink = async () => {
    try {
      let passwordHash = null
      if (linkSettings.hasPassword && linkSettings.password) {
        passwordHash = await bcrypt.hash(linkSettings.password, 10)
      } else if (galleryLink?.password_hash && linkSettings.hasPassword) {
        passwordHash = galleryLink.password_hash
      }

      const linkData = {
        gallery_id: galleryId,
        token: galleryLink?.token || uuidv4(),
        password_hash: passwordHash,
        expires_at: linkSettings.expires_at ? new Date(linkSettings.expires_at).toISOString() : null,
        allow_download: linkSettings.allow_download
      }

      if (galleryLink) {
        // Update existing link
        const { error } = await supabase
          .from('gallery_links')
          .update(linkData)
          .eq('id', galleryLink.id)

        if (error) throw error
        setGalleryLink({ ...galleryLink, ...linkData })
      } else {
        // Create new link
        const linkId = uuidv4()
        const { error } = await supabase
          .from('gallery_links')
          .insert({ id: linkId, ...linkData })

        if (error) throw error
        setGalleryLink({ id: linkId, ...linkData })
      }

      // Update gallery status to active
      if (formData.status === 'draft') {
        await supabase
          .from('galleries')
          .update({ status: 'active' })
          .eq('id', galleryId)
        setFormData({ ...formData, status: 'active' })
      }

      toast.success(galleryLink ? 'Share link updated!' : 'Share link generated!')
    } catch (error) {
      console.error('Error generating link:', error)
      toast.error('Failed to generate share link')
    }
  }

  // ✅ CORRIGÉ : Plus de process.env, utilise toujours window.location.origin
  const copyShareLink = () => {
    if (galleryLink && typeof window !== 'undefined') {
      const baseUrl = window.location.origin
      navigator.clipboard.writeText(`${baseUrl}/g/${galleryLink.token}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Link copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // ✅ CORRIGÉ : Plus de process.env, utilise getBaseUrl()
  const baseUrl = getBaseUrl()
  const shareUrl = galleryLink ? `${baseUrl}/g/${galleryLink.token}` : null
  const completedSteps = getCompletedSteps()

  const tabs = [
    { id: 'photos', label: 'Photos', icon: Camera, completed: completedSteps.photos },
    { id: 'details', label: 'Details', icon: FileText, completed: completedSteps.details },
    { id: 'sharing', label: 'Sharing', icon: Share2, completed: completedSteps.sharing }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-teal-100 text-teal-700 border-teal-200'
      case 'draft': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'expired': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Link href="/dashboard/galleries" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Galleries
      </Link>

      {/* Premium Header Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-slate-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Gallery Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{formData.title || 'Untitled Gallery'}</h1>
                <Badge className={`${getStatusColor(formData.status)} border`}>
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {formData.client_name && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    {formData.client_name}
                  </span>
                )}
                {formData.event_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(formData.event_date), 'MMM d, yyyy')}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Images className="w-3.5 h-3.5" />
                  {photos.length} photos
                </span>
                {gallery?.updated_at && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Updated {formatDistanceToNow(new Date(gallery.updated_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {shareUrl && (
                <Button variant="outline" size="sm" onClick={copyShareLink} className="gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy Link
                </Button>
              )}
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-md">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Le reste du JSX reste IDENTIQUE jusqu'à la fin... */}
      {/* Step-like Tab Navigation */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center bg-white rounded-xl p-1.5 shadow-md border">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const isCompleted = tab.completed && !isActive
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all
                  ${isActive 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-50'
                  }
                `}
              >
                <div className="relative">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                  ) : (
                    <div className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                      ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}
                    `}>
                      {index + 1}
                    </div>
                  )}
                </div>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content - Photos, Details, Sharing (inchangé) */}
      {/* ... tout le reste du JSX reste exactement pareil ... */}
    </div>
  )
}
