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


import { generateVideoThumbnail } from '@/lib/videoThumbnail';

import {
  ArrowLeft, Loader2, Upload, Trash2, Copy, Check, Link as LinkIcon,
  Lock, Calendar, Download, Eye, X, Images, Camera, FileText, Share2,
  CheckCircle2, Circle, Shield, Clock, Globe, ImagePlus, Info, Pencil, User
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/app/providers'

import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { token } = await params

  try {
    // 🔍 Chercher gallerylink d'abord
    const { data: linkData } = await supabaseAdmin
      .from('gallerylinks')
      .select('gallery_id, passwordhash, expires_at, allowdownload')
      .eq('token', token)
      .single()

    if (!linkData) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // Récupérer gallery
    const { data: galleryData } = await supabaseAdmin
      .from('galleries')
      .select('title, client_name, event_date')
      .eq('id', linkData.gallery_id)
      .single()

    if (!galleryData) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    return NextResponse.json({
      gallery: {
        title: galleryData.title || 'Client Gallery',
        client_name: galleryData.client_name,
        event_date: galleryData.event_date
      },
      requires_password: !!linkData.passwordhash,
      allow_download: linkData.allowdownload !== false
    })
  } catch (error) {
    console.error('Gallery error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export default function GalleryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const galleryId = params.id
  const fileInputRef = useRef(null)
  const { user } = useAuth()

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
  const [folders, setFolders] = useState([])
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('') 
  const [selectedFolder, setSelectedFolder] = useState(null) 
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

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

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return ''
  }

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

    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('sort_order', { ascending: true })

    setPhotos(photos || [])

    // ✅ Fetch folders
    await fetchFolders()

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
// ✅ AJOUTE CETTE FONCTION ICI (avant processFiles)
const generateVideoThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Thumbnail generation timeout'))
    }, 10000)

    const cleanup = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(video.src)
    }

    video.onloadedmetadata = () => {
      const seekTime = Math.min(1, video.duration * 0.1)
      video.currentTime = seekTime
    }

    video.onseeked = () => {
      try {
        const maxWidth = 640
        const scale = Math.min(1, maxWidth / video.videoWidth)
        
        canvas.width = video.videoWidth * scale
        canvas.height = video.videoHeight * scale

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          cleanup()
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create thumbnail blob'))
          }
        }, 'image/jpeg', 0.85)
      } catch (err) {
        cleanup()
        reject(err)
      }
    }

    video.onerror = (err) => {
      cleanup()
      reject(new Error('Video loading failed'))
    }

    video.src = URL.createObjectURL(file)
  })
}


  const processFiles = async (files) => {
    if (files.length === 0) return

    const validFiles = Array.from(files).filter(file => {
      const validTypes = [
        'image/jpeg', 
        'image/png', 
        'image/webp', 
        'image/gif',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm'
      ]
      const maxSize = 100 * 1024 * 1024
      
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Use JPEG, PNG, WebP, GIF, MP4, MOV, or WebM.`)
        return false
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: File too large. Max 100MB.`)
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
      const BATCH_SIZE = 3
      
      for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
        const batch = validFiles.slice(i, i + BATCH_SIZE)
        
        const batchResults = await Promise.all(
          batch.map(async (file, batchIndex) => {
            const globalIndex = i + batchIndex
            const fileExt = file.name.split('.').pop()
            const fileName = `${uuidv4()}.${fileExt}`
            const filePath = `${user.id}/${galleryId}/${fileName}`

            try {
  const isVideo = file.type.startsWith('video/')

  // ✅ NOUVEAU: Génère thumbnail pour vidéos
  let thumbnailUrl = null
  if (isVideo) {
    try {
      const thumbnailBlob = await generateVideoThumbnail(file)
      const thumbnailPath = `${user.id}/${galleryId}/thumbnails/${uuidv4()}.jpg`
      
      const { error: thumbError } = await supabase.storage
        .from('photos')
        .upload(thumbnailPath, thumbnailBlob, {
          cacheControl: '3600',
          contentType: 'image/jpeg'
        })

      if (!thumbError) {
        const { data: { publicUrl: thumbUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(thumbnailPath)
        thumbnailUrl = thumbUrl
      }
    } catch (thumbErr) {
      console.warn('⚠️ Thumbnail generation failed:', thumbErr)
    }
  }

  // Upload vidéo/photo principale
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    toast.error(`Failed to upload ${file.name}`)
    return null
  }

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
      image_url: isVideo ? thumbnailUrl : publicUrl,  // ✅ Thumbnail pour vidéos
      video_url: isVideo ? publicUrl : null,
      storage_path: filePath,
      file_name: file.name,
      file_size: file.size,
      media_type: isVideo ? 'video' : 'image',
      sort_order: photos.length + globalIndex
    })

  if (dbError) {
    console.error('DB error:', dbError)
    toast.error(`Failed to save ${file.name} to database`)
    return null
  }

  return {
    id: photoId,
    gallery_id: galleryId,
    image_url: isVideo ? thumbnailUrl : publicUrl,  // ✅ Thumbnail pour vidéos
    video_url: isVideo ? publicUrl : null,
    storage_path: filePath,
    file_name: file.name,
    file_size: file.size,
    media_type: isVideo ? 'video' : 'image',
    sort_order: photos.length + globalIndex
  }
} catch (error) {
  console.error('Error processing file:', error)
  return null
} 
          })
        )

        const successfulUploads = batchResults.filter(photo => photo !== null)
        uploadedPhotos.push(...successfulUploads)
        
        setUploadProgress(Math.round(((i + batch.length) / totalFiles) * 100))
      }

      if (uploadedPhotos.length > 0) {
        setPhotos([...photos, ...uploadedPhotos])

        if (photos.length === 0 && uploadedPhotos.length > 0) {
          const firstImage = uploadedPhotos.find(p => p.media_type === 'image')
          if (firstImage) {
            await supabase
              .from('galleries')
              .update({ cover_photo_url: firstImage.image_url })
              .eq('id', galleryId)
          }
        }

        const imageCount = uploadedPhotos.filter(p => p.media_type === 'image').length
        const videoCount = uploadedPhotos.filter(p => p.media_type === 'video').length
        
        toast.success(`Uploaded ${imageCount} photo(s) and ${videoCount} video(s)`)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error(`Failed to upload files: ${error.message}`)
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
      if (storagePath) {
        await supabase.storage.from('photos').remove([storagePath])
      }

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

// ✅ NEW: Select All / Deselect All
const handleSelectAll = () => {
  if (selectedPhotos.size === photos.length) {
    // Deselect all
    setSelectedPhotos(new Set())
  } else {
    // Select all
    setSelectedPhotos(new Set(photos.map(p => p.id)))
  }
}



// Fetch folders
const fetchFolders = async () => {
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    setFolders(data || [])
  } catch (error) {
    console.error('Error fetching folders:', error)
  }
}

// Create folder
const handleCreateFolder = async () => {
  if (!newFolderName.trim()) {
    toast.error('Please enter a folder name')
    return
  }

  setIsCreatingFolder(true)
  try {
    const { data, error } = await supabase
      .from('folders')
      .insert({
        id: uuidv4(),
        gallery_id: galleryId,
        name: newFolderName.trim(),
        sort_order: folders.length
      })
      .select()
      .single()

    if (error) throw error

    setFolders([...folders, data])
    setNewFolderName('')
    setShowCreateFolder(false)
    toast.success('Folder created!')
  } catch (error) {
    console.error('Error creating folder:', error)
    toast.error('Failed to create folder')
  } finally {
    setIsCreatingFolder(false)
  }
}

// Move selected photos to folder
const handleMoveToFolder = async (folderId) => {
  if (selectedPhotos.size === 0) {
    toast.error('No photos selected')
    return
  }

  try {
    const { error } = await supabase
      .from('photos')
      .update({ folder_id: folderId })
      .in('id', Array.from(selectedPhotos))

    if (error) throw error

    // Update local state
    setPhotos(photos.map(p => 
      selectedPhotos.has(p.id) ? { ...p, folder_id: folderId } : p
    ))
    setSelectedPhotos(new Set())
    
    const folderName = folderId 
      ? folders.find(f => f.id === folderId)?.name 
      : 'All Photos'
    toast.success(`Moved ${selectedPhotos.size} photos to ${folderName}`)
  } catch (error) {
    console.error('Error moving photos:', error)
    toast.error('Failed to move photos')
  }
}

// Delete folder
const handleDeleteFolder = async (folderId) => {
  if (!confirm('Delete this folder? Photos will be moved to "All Photos".')) return

  try {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)

    if (error) throw error

    setFolders(folders.filter(f => f.id !== folderId))
    if (selectedFolder === folderId) setSelectedFolder(null)
    toast.success('Folder deleted')
  } catch (error) {
    console.error('Error deleting folder:', error)
    toast.error('Failed to delete folder')
  }
}

  

const handleGenerateLink = async () => {
  try {
    let passwordHash = null
    if (linkSettings.hasPassword && linkSettings.password) {
      passwordHash = await bcrypt.hash(linkSettings.password, 10)
    }

    const { error } = await supabase
      .from('galleries')
      .update({
        passwordhash: passwordHash,
        allow_download: linkSettings.allowdownload  
      })
      .eq('id', galleryId)

    if (error) throw error

    setGallery({ ...gallery, allow_download: linkSettings.allowdownload })
    toast.success(galleryLink ? 'Settings updated!' : 'Share link generated!')
    setGalleryLink({ token: galleryId })
  } catch (error) {
    console.error('Error updating gallery:', error)
    toast.error('Failed to update settings')
  }
}



  const copyShareLink = () => {
    if (galleryLink && typeof window !== 'undefined') {
      const baseUrl = window.location.origin
      navigator.clipboard.writeText(`${baseUrl}/g/${gallery.id}`
)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Link copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <div
          className="fixed inset-0"
          style={{
            backgroundImage: "url('/cover.webp')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="fixed inset-0 bg-[#F5F0EA]/70 mix-blend-soft-light" />
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.14] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
            backgroundSize: 'cover',
          }}
        />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-black/20 border-b-black/80 animate-spin" />
        </div>
      </main>
    )
  }

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
      case 'active': return 'bg-emerald-600/20 text-emerald-800 border border-emerald-600/30'
      case 'draft': return 'bg-amber-600/20 text-amber-800 border border-amber-600/30'
      case 'expired': return 'bg-red-600/20 text-red-800 border border-red-600/30'
      default: return 'bg-black/5 text-black/70 border border-black/10'
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: "url('/cover.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 bg-[#F5F0EA]/70 mix-blend-soft-light" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.14] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
          backgroundSize: 'cover',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="pt-6 px-4 sm:px-6 max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className="inline-flex items-center justify-center px-4 py-2 border border-black/80 rounded-[999px] bg-black/5 backdrop-blur-sm">
              <span className="text-xs tracking-[0.18em] uppercase">
                ARTYDROP
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-4 text-xs">
            <Link href="/dashboard/galleries" className="text-black/80 hover:text-black">
              Galleries
            </Link>
            <span className="hidden sm:inline text-black/60">{user?.email}</span>
          </div>
        </header>

        <section className="flex-1 py-8 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-6">
          <Link href="/dashboard/galleries" className="inline-flex items-center text-xs text-black/60 hover:text-black/80">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Back to Galleries
          </Link>

          <div className="rounded-3xl border border-black/10 bg-[#FDF9F3]/95 shadow-lg backdrop-blur-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-semibold text-black/80">
                    {formData.title || 'Untitled Gallery'}
                  </h1>
                  <Badge className={`${getStatusColor(formData.status)} text-[10px] px-2 py-0.5`}>
                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-black/60">
                  {formData.client_name && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {formData.client_name}
                    </span>
                  )}
                  {formData.event_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(formData.event_date), 'MMM d, yyyy')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Images className="w-3 h-3" />
                    {photos.length} photos
                  </span>
                  {gallery?.updated_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated {formatDistanceToNow(new Date(gallery.updated_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {shareUrl && (
                  <Button 
                    onClick={copyShareLink}
                    className="h-9 px-4 rounded-full bg-white/60 backdrop-blur-sm border border-black/10 text-black hover:bg-white/80 text-xs flex items-center gap-2"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    Copy Link
                  </Button>
                )}
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="h-9 px-4 rounded-full bg-black text-white hover:bg-black/90 text-xs flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md border border-black/10">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                const isCompleted = tab.completed && !isActive
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all text-xs
                      ${isActive 
                        ? 'bg-black text-white shadow-md' 
                        : 'text-black/60 hover:text-black/80 hover:bg-black/5'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-[#FDF9F3]/95 shadow-md p-6">
            {activeTab === 'photos' && (
              <div className="space-y-6">
    
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 className="text-lg font-semibold text-black/80">Photos & Videos</h2>
        <p className="text-xs text-black/60 mt-1">Upload and manage your gallery content</p>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
  <Button
    onClick={() => setShowCreateFolder(true)}
    className="h-9 px-4 rounded-full text-xs flex items-center gap-2 bg-white/60 border border-black/10 text-black hover:bg-white/80"
  >
    <FileText className="w-3 h-3" />
    New Folder
  </Button>
  
  {photos.length > 0 && (

          <Button
            onClick={() => {
              if (selectedPhotos.size === photos.length) {
                setSelectedPhotos(new Set())
              } else {
                setSelectedPhotos(new Set(photos.map(p => p.id)))
              }
            }}
            className="h-9 px-4 rounded-full text-xs flex items-center gap-2 bg-white/60 border border-black/10 text-black hover:bg-white/80"
          >
            {selectedPhotos.size === photos.length ? (
              <>
                <X className="w-3 h-3" />
                Deselect All
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Select All
              </>
            )}
          </Button>
        )}
        
        {selectedPhotos.size > 0 && (
          <Button
            onClick={handleDeleteSelected}
            className="h-9 px-4 rounded-full text-xs flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
          >
            <Trash2 className="w-3 h-3" />
            Delete ({selectedPhotos.size})
          </Button>
        )}
      </div>
    </div>



                {selectedPhotos.size > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 border border-black/10">
                    <p className="text-xs text-black/70">
                      <span className="font-semibold">{selectedPhotos.size}</span> of{' '}
                      <span className="font-semibold">{photos.length}</span> selected
                    </p>
                    <button
                      onClick={() => setSelectedPhotos(new Set())}
                      className="text-xs text-black/60 hover:text-black/80 underline"
                    >
                      Clear selection
                    </button>
                  </div>
                )}

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all
                    ${isDragging 
                      ? 'border-black/40 bg-black/5' 
                      : 'border-black/20 bg-white/40 hover:border-black/30 hover:bg-white/60'
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/mp4,video/quicktime,video/webm"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6 text-black/40" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black/80">
                        {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-black/60 mt-1">
                        Photos: JPEG, PNG, WebP, GIF (max 10MB) • Videos: MP4, MOV, WebM (max 100MB)
                      </p>
                    </div>
                  </div>
                  
                  {isUploading && (
                    <div className="mt-4">
                      <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-black/60 mt-2">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}
                

                
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateFolder(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-black/80 mb-4">Create New Folder</h3>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g., Ceremony, Reception..."
              className="h-10 rounded-lg mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowCreateFolder(false)
                  setNewFolderName('')
                }}
                variant="outline"
                className="flex-1 h-9 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
                className="flex-1 h-9 rounded-full bg-black text-white"
              >
                {isCreatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Folder Filters */}
      {folders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedFolder(null)}
            className={`px-3 py-1.5 rounded-full text-xs transition-all ${
              selectedFolder === null
                ? 'bg-black text-white'
                : 'bg-white/60 text-black/60 hover:bg-white/80'
            }`}
          >
            All Photos ({photos.length})
          </button>
          {folders.map(folder => {
            const count = photos.filter(p => p.folder_id === folder.id).length
            return (
              <div key={folder.id} className="relative group">
                <button
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                    selectedFolder === folder.id
                      ? 'bg-black text-white'
                      : 'bg-white/60 text-black/60 hover:bg-white/80'
                  }`}
                >
                  📁 {folder.name} ({count})
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Move to Folder */}
      {selectedPhotos.size > 0 && folders.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">{selectedPhotos.size}</span> selected
          </p>
          <select
            onChange={(e) => handleMoveToFolder(e.target.value || null)}
            className="h-8 px-3 rounded-lg text-xs border border-black/10 bg-white"
            defaultValue=""
          >
            <option value="">Move to...</option>
            <option value="">📁 All Photos</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                📁 {folder.name}
              </option>
            ))}
          </select>
        </div>
      )}

         {photos.filter(p => selectedFolder === null || p.folder_id === selectedFolder).length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos
            .filter(p => selectedFolder === null || p.folder_id === selectedFolder)
            .map((photo) => (

                      <div
                        key={photo.id}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-black/5 cursor-pointer"
                        onClick={() => togglePhotoSelection(photo.id)}
                      >
                        {photo.media_type === 'video' ? (
                          <video
                            src={photo.video_url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={photo.image_url}
                            alt={photo.file_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}

                        {photo.media_type === 'video' && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            VIDEO
                          </div>
                        )}
                        
                        <div className={`
                          absolute inset-0 transition-all
                          ${selectedPhotos.has(photo.id)
                            ? 'bg-black/40 ring-2 ring-black'
                            : 'bg-black/0 group-hover:bg-black/20'
                          }
                        `}>
                          <div className="absolute top-2 right-2">
                            {selectedPhotos.has(photo.id) ? (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            ) : (
                              <Circle className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePhoto(photo.id, photo.storage_path)
                            }}
                            className="absolute bottom-2 right-2 p-1.5 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 rounded-xl bg-white/40 border border-black/10">
                    <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
                      <ImagePlus className="w-8 h-8 text-black/30" />
                    </div>
                    <h3 className="text-sm font-semibold text-black/80 mb-1">No photos yet</h3>
                    <p className="text-xs text-black/60">
                      Upload photos or videos to start building your gallery
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-black/80">Gallery Details</h2>
                  <p className="text-xs text-black/60 mt-1">Basic information about this delivery</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-black/80">Gallery Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Sarah & John's Wedding"
                      className="h-10 rounded-lg bg-white/60 border-black/10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-black/80">Client Name</Label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="e.g., Sarah Johnson"
                      className="h-10 rounded-lg bg-white/60 border-black/10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-black/80">Event Date</Label>
                    <Input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="h-10 rounded-lg bg-white/60 border-black/10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-black/80">Internal Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Private notes (only visible to you)"
                      className="min-h-24 rounded-lg bg-white/60 border-black/10 text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sharing' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-black/80">Share Gallery</h2>
                  <p className="text-xs text-black/60 mt-1">Generate a link to share with your client</p>
                </div>

                {shareUrl ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/60 border border-black/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-black/60 uppercase tracking-wider mb-1">Share Link</p>
                          <p className="text-xs text-black/80 truncate font-mono">{shareUrl}</p>
                        </div>
                        <Button
                          onClick={copyShareLink}
                          className="h-8 px-3 rounded-full bg-black text-white hover:bg-black/90 text-xs flex items-center gap-2 flex-shrink-0"
                        >
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/40">
                        <div className="flex items-center gap-3">
                          <Lock className="w-4 h-4 text-black/60" />
                          <div>
                            <p className="text-xs font-medium text-black/80">Password Protection</p>
                            <p className="text-[10px] text-black/60">Require a password to view</p>
                          </div>
                        </div>
                        <Switch
                          checked={linkSettings.hasPassword}
                          onCheckedChange={(checked) => setLinkSettings({ ...linkSettings, hasPassword: checked })}
                        />
                      </div>

                      {linkSettings.hasPassword && (
                        <div className="pl-11">
                          <Input
                            type="password"
                            value={linkSettings.password}
                            onChange={(e) => setLinkSettings({ ...linkSettings, password: e.target.value })}
                            placeholder="Enter password"
                            className="h-9 rounded-lg bg-white/60 border-black/10 text-xs"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/40">
                        <div className="flex items-center gap-3">
                          <Download className="w-4 h-4 text-black/60" />
                          <div>
                            <p className="text-xs font-medium text-black/80">Allow Downloads</p>
                            <p className="text-[10px] text-black/60">Let clients download photos</p>
                          </div>
                        </div>
                        <Switch
                          checked={linkSettings.allow_download}
                          onCheckedChange={(checked) => setLinkSettings({ ...linkSettings, allow_download: checked })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-black/80 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          Expiration Date (Optional)
                        </Label>
                        <Input
                          type="date"
                          value={linkSettings.expires_at}
                          onChange={(e) => setLinkSettings({ ...linkSettings, expires_at: e.target.value })}
                          className="h-9 rounded-lg bg-white/60 border-black/10 text-xs"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerateLink}
                      className="w-full h-10 rounded-full bg-black text-white hover:bg-black/90 text-xs"
                    >
                      Update Share Link
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
                      <Share2 className="w-6 h-6 text-black/40" />
                    </div>
                    <h3 className="text-sm font-semibold text-black/80 mb-2">No share link yet</h3>
                    <p className="text-xs text-black/60 mb-6 max-w-sm mx-auto">
                      Generate a secure link to share this gallery with your client. You can add password protection and set an expiration date.
                    </p>
                    <Button
                      onClick={handleGenerateLink}
                      className="h-10 px-6 rounded-full bg-black text-white hover:bg-black/90 text-xs flex items-center gap-2 mx-auto"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Generate Share Link
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <footer className="py-6 text-[11px] text-black/60 border-t border-black/10 bg-[#F5F0EA]/95 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            <span>© {new Date().getFullYear()} Artydrop</span>
            <div className="flex gap-4">
              <span>Terms</span>
              <span>Privacy</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
