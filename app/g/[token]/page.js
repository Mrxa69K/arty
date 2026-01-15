'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'


import {
  Camera, Lock, Loader2, Download, X, 
  Calendar, AlertCircle,ChevronLeft, ChevronRight, Images, Eye, EyeOff, Sparkles, CheckCircle as CheckCircleIcon,
  ArrowLeft, FileText
} from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function PublicGalleryPage() {
  const params = useParams()
  const token = params.token

  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [gallery, setGallery] = useState(null)
  const [photos, setPhotos] = useState([])
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [allowDownload, setAllowDownload] = useState(true)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [sessionToken, setSessionToken] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState(null)
  const [expired, setExpired] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [folders, setFolders] = useState([])           
  const [selectedFolder, setSelectedFolder] = useState(null)  


  

  const [loading, setLoading] = useState(true)

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  // Download ZIP
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)

  useEffect(() => {
    if (token) {
      fetchGalleryInfo()
    }
  }, [token])

  useEffect(() => {
    if (isAuthenticated || (!requiresPassword && gallery)) {
      fetchPhotos(sessionToken)
    }
  }, [isAuthenticated, requiresPassword, gallery, sessionToken])

  const fetchGalleryInfo = async () => {
    try {
      const response = await fetch(`/api/gallery/${token}`)
      const data = await response.json()

      if (!response.ok) {
        if (data.expired) setExpired(true)
        else setError(data.error || 'Gallery not found')
        return
      }

      setGallery(data.gallery)
      setRequiresPassword(data.requires_password)
      setAllowDownload(data.allow_download)

      if (!data.requires_password) setIsAuthenticated(true)
    } catch (err) {
      console.error('Error fetching gallery:', err)
      setError('Failed to load gallery')
    } finally {
      setIsLoading(false)
    }
  }

const fetchPhotos = async (session) => {
  setLoading(true)  // ✅ START LOADING
  try {
    const sessionParam = session || sessionToken
    const url = sessionParam
      ? `/api/gallery/${token}/photos?session=${encodeURIComponent(sessionParam)}`
      : `/api/gallery/${token}/photos`
    
    const response = await fetch(url)  // ✅ UNE SEULE FOIS
    const data = await response.json()

    if (!response.ok) {
      if (data.expired) setExpired(true)
      console.error('Error fetching photos:', data.error)
      return
    }

    setPhotos(data.photos || [])
    setFolders(data.folders || [])
    setAllowDownload(data.allow_download)
  } catch (err) {
    console.error('Error fetching photos:', err)
  } finally {
    setLoading(false)  // ✅ STOP LOADING
  }
}


  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setIsVerifying(true)
    setPasswordError('')

    try {
      const response = await fetch(`/api/gallery/${token}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.expired) {
          setExpired(true)
          return
        }
        setPasswordError(data.error || 'Invalid password')
        return
      }

      setSessionToken(data.session)
      setIsAuthenticated(true)
      setAllowDownload(data.allow_download)
    } catch (err) {
      console.error('Password verification error:', err)
      setPasswordError('An error occurred. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }
const handleDownload = async (photo, showToast = true) => {
  setDownloadingId(photo.id)
  try {
    // ✅ Use API route instead of direct URL
    const response = await fetch(`/api/gallery/${token}/download-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId: photo.id })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Download failed')
    }

    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = photo.file_name || `${photo.media_type}-${photo.id}.${photo.media_type === 'video' ? 'mp4' : 'jpg'}`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    }, 100)

    if (showToast) {
      toast.success(`${photo.media_type === 'video' ? 'Video' : 'Photo'} downloaded`)
    }
    return true
  } catch (err) {
    console.error('Download error:', err)
    if (showToast) {
      toast.error(err.message || 'Failed to download. Please try again.')
    }
    return false
  } finally {
    setDownloadingId(null)
  }
}


  const handleDownloadAllZip = async () => {
    if (photos.length === 0) {
      toast.error('No photos to download')
      return
    }
    
    setIsDownloadingZip(true)
    toast.info('Preparing your ZIP file...')

    try {
      const response = await fetch(`/api/gallery/${token}/download-zip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ZIP')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filename = gallery?.title 
        ? `${gallery.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`
        : 'gallery.zip'
      a.download = filename
      document.body.appendChild(a)
      a.click()
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      
      toast.success(`Gallery downloaded (${photos.length} photos)`)
    } catch (error) {
      console.error('ZIP download error:', error)
      toast.error(error.message || 'Failed to download gallery')
    } finally {
      setIsDownloadingZip(false)
    }
  }

  const openLightbox = useCallback((index) => {
    setCurrentPhotoIndex(index)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
    setDownloadingId(null)
  }, [])

  const nextPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }, [photos.length])

  const prevPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }, [photos.length])

  const handleKeyDown = useCallback((e) => {
    if (!lightboxOpen) return
    
    switch(e.key) {
      case 'Escape':
        closeLightbox()
        break
      case 'ArrowLeft':
        prevPhoto()
        break
      case 'ArrowRight':
        nextPhoto()
        break
    }
  }, [lightboxOpen, closeLightbox, prevPhoto, nextPhoto])

  useEffect(() => {
    if (lightboxOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [lightboxOpen, handleKeyDown])

  // LOADING
  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
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
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center">
              <Camera className="w-6 h-6 text-black/40" />
            </div>
            <Loader2 className="w-5 h-5 text-black/60 animate-spin" />
            <p className="text-xs text-black/50">Loading gallery…</p>
          </div>
        </div>
      </div>
    )
  }

  // EXPIRED
  if (expired) {
    return (
      <div className="min-h-screen relative overflow-hidden">
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

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-3xl border border-black/10 bg-[#FDF9F3]/95 shadow-lg p-8">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold text-black/80 mb-2">
              This gallery has expired
            </h1>
            <p className="text-sm text-black/70 mb-4">
              The viewing period for this gallery is over. The photographer may have
              set an expiration date for privacy and storage reasons.
            </p>
            <div className="rounded-xl bg-white/60 border border-black/10 p-4 text-xs text-black/70">
              If you still need access to your photos, please contact your
              photographer and request a new gallery link.
            </div>
            <p className="mt-6 text-[11px] text-black/50">
              Powered by <span className="font-medium text-black/70">Artydrop</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ERROR
  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden">
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

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-3xl border border-black/10 bg-[#FDF9F3]/95 shadow-lg p-8">
            <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-black/40" />
            </div>
            <h1 className="text-2xl font-semibold text-black/80 mb-2">
              Gallery not available
            </h1>
            <p className="text-sm text-black/70 mb-4">
              {error === 'Gallery not found'
                ? "We couldn't find this gallery. The link may be incorrect or the gallery may have been removed."
                : error}
            </p>
            <div className="rounded-xl bg-white/60 border border-black/10 p-4 text-xs text-black/70">
              Double‑check the link in your email or message. If the problem
              continues, contact your photographer for a fresh gallery link.
            </div>
            <p className="mt-6 text-[11px] text-black/50">
              Powered by <span className="font-medium text-black/70">Artydrop</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // PASSWORD CARD
  if (requiresPassword && !isAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden">
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

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-3xl border border-black/10 bg-[#FDF9F3]/95 shadow-lg p-8">
            <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-black/40" />
            </div>
            <h1 className="text-xl font-semibold text-black/80 mb-2 text-center">
              Protected Gallery
            </h1>
            <p className="text-sm text-black/60 mb-6 text-center">
              This gallery is password protected. Enter the password to view.
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-black/80">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="h-10 rounded-lg bg-white/60 border-black/10 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/60"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-600">{passwordError}</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isVerifying || !password}
                className="w-full h-10 rounded-full bg-black text-white hover:bg-black/90 text-xs"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Unlock Gallery'
                )}
              </Button>
            </form>

            <p className="mt-6 text-[11px] text-black/50 text-center">
              Powered by <span className="font-medium text-black/70">Artydrop</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // LIGHTBOX
  if (lightboxOpen) {
    const currentPhoto = photos[currentPhotoIndex]
    return (
      <div 
        className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4"
        onClick={closeLightbox}
      >
        <div 
          className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Navigation Arrows */}
          <button
            onClick={prevPhoto}
            className="absolute left-4 sm:left-8 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextPhoto}
            className="absolute right-4 sm:right-8 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Photo/Video Content */}
          <div className="w-full h-full flex items-center justify-center">
            {currentPhoto?.media_type === 'video' ? (
              <video
                src={currentPhoto.video_url}
                controls
                className="max-w-full max-h-full object-contain rounded-lg"
                autoPlay
              />
            ) : (
              <img
                src={currentPhoto?.image_url}
                alt={currentPhoto?.file_name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>

          {/* Download Button */}
          {allowDownload && currentPhoto && (
            <Button
              onClick={() => handleDownload(currentPhoto, true)}
              disabled={downloadingId === currentPhoto.id}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 hover:bg-white text-black shadow-xl border-0"
            >
              {downloadingId === currentPhoto.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </>
              )}
            </Button>
          )}

          {/* Photo Counter */}
          <div className="absolute bottom-6 left-6 sm:left-8 text-white/90 text-sm bg-black/30 px-3 py-1 rounded-full">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        </div>
      </div>
    )
  }

  // MAIN GALLERY
  return (
    <div className="min-h-screen relative overflow-hidden">
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

      <header className="relative z-10 pt-6 px-4 sm:px-6 max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="inline-flex items-center justify-center px-4 py-2 border border-black/80 rounded-[999px] bg-black/5 backdrop-blur-sm">
            <span className="text-xs tracking-[0.18em] uppercase">
              ARTYDROP
            </span>
          </div>
        </Link>
        
        {allowDownload && photos.length > 0 && (
          <Button
            onClick={handleDownloadAllZip}
            disabled={isDownloadingZip}
            className="hidden sm:flex h-9 px-4 rounded-full bg-black text-white hover:bg-black/90 text-xs items-center gap-2"
          >
            {isDownloadingZip ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="w-3 h-3" />
                Download All
              </>
            )}
          </Button>
        )}
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 rounded-2xl border border-black/10 bg-[#FDF9F3]/95 shadow-md p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-semibold text-black/80 mb-2">
                  {gallery?.title || 'Client gallery'}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-black/60">
                  {gallery?.client_name && (
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {gallery.client_name}
                    </span>
                  )}
                  {gallery?.event_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(gallery.event_date), 'MMM d, yyyy')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Images className="w-3 h-3" />
                    {photos.length} photos
                  </span>
                </div>
              </div>

              {allowDownload && photos.length > 0 && (
                <Button
                  onClick={handleDownloadAllZip}
                  disabled={isDownloadingZip}
                  className="sm:hidden w-full sm:w-auto h-10 px-4 rounded-full bg-black text-white hover:bg-black/90 text-xs flex items-center justify-center gap-2"
                >
                  {isDownloadingZip ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Preparing ZIP...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download All ({photos.length})
                    </>
                  )}
                </Button>
              )}
            </div>

            {!allowDownload && photos.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <EyeOff className="w-3 h-3" />
                This gallery is view‑only. Downloads are not enabled.
              </div>
            )}
          </div>

          {/* Folder Browser */}
{/* Folder Browser */}
{folders.length > 0 && (
  <div className="mb-8">
    {selectedFolder ? (
      // Back button
      <button
        onClick={() => setSelectedFolder(null)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/80 backdrop-blur-sm hover:bg-white border border-black/10 text-black transition-all hover:shadow-lg group mb-6"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Files
      </button>
    ) : (
      // Folder grid
      <div>
        <h3 className="text-lg font-semibold text-black/90 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Your Folders
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map(folder => {
            const folderPhotos = photos.filter(p => p.folder_id === folder.id)
            const count = folderPhotos.length
            if (count === 0) return null
            
            // Get first 4 photos as preview
            const previewPhotos = folderPhotos.slice(0, 4)
            
            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className="group relative rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm border border-black/10 hover:border-black/20 hover:shadow-2xl transition-all duration-300 p-4 text-left hover:scale-[1.02]"
              >
                {/* Preview Grid */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-3">
                  {previewPhotos.length === 1 ? (
                    <img
                      src={previewPhotos[0].thumbnail_url || previewPhotos[0].image_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : previewPhotos.length === 2 ? (
                    <div className="grid grid-cols-2 gap-1 h-full">
                      {previewPhotos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo.thumbnail_url || photo.image_url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ))}
                    </div>
                  ) : previewPhotos.length >= 3 ? (
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">
                      <img
                        src={previewPhotos[0].thumbnail_url || previewPhotos[0].image_url}
                        alt=""
                        className="col-span-2 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {previewPhotos.slice(1, 3).map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo.thumbnail_url || photo.image_url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-12 h-12 text-black/20" />
                    </div>
                  )}
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Folder info */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-black/90 truncate mb-0.5 group-hover:text-black transition-colors">
                      {folder.name}
                    </h4>
                    <p className="text-xs text-black/50 flex items-center gap-1">
                      <Images className="w-3 h-3" />
                      {count} {count === 1 ? 'file' : 'files'}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-black/5 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-all ml-3">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )}
  </div>
)}

{/* Photos Grid */}
{(() => {
  // Filter logic
 
  const filteredPhotos = selectedFolder === null
    ? photos.filter(p => p.folder_id === null)
    : photos.filter(p => p.folder_id === selectedFolder)
  
  // ✅ SHOW LOADER WHILE LOADING
  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-[#FDF9F3]/95 shadow-md p-12 text-center">
        <Loader2 className="w-12 h-12 text-black/20 animate-spin mx-auto mb-4" />
        <p className="text-sm text-black/60">Loading your photos...</p>
      </div>
    )
  }
  
  if (filteredPhotos.length === 0 && selectedFolder === null && folders.length > 0) {
    return null
  }
  
  if (filteredPhotos.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 bg-[#FDF9F3]/95 shadow-md p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
          <Images className="w-8 h-8 text-black/30" />
        </div>
        <h3 className="text-lg font-semibold text-black/80 mb-2">
          {selectedFolder ? 'No files in this folder' : 'No photos yet'}
        </h3>
        <p className="text-sm text-black/60 max-w-sm mx-auto">
          {selectedFolder ? 'This folder is empty' : 'Your photographer is preparing your gallery'}
        </p>
      </div>
    )
  }
  

  
  return (
    <div>
      {selectedFolder === null && filteredPhotos.length > 0 && (
        <h3 className="text-sm font-medium text-black/80 mb-3 mt-6">📄 Files</h3>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
        {filteredPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative rounded-xl overflow-hidden bg-slate-100 cursor-pointer aspect-square hover:shadow-xl transition-all duration-300"
            onClick={() => {
           const realIndex = photos.findIndex(p => p.id === photo.id)
            openLightbox(realIndex)
}}
          >
            {photo.media_type === 'video' && !photo.thumbnail_url ? (
              <video
                src={photo.video_url}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={photo.thumbnail_url || photo.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjZGN0ZGIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='}
                alt={photo.file_name || `Photo ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjZGN0ZGIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
                  e.target.className += ' opacity-75 border-2 border-dashed border-slate-300'
                }}
              />
            )}

            {photo.media_type === 'video' && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/95 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-all">
                    <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-red-500/95 text-white text-xs font-bold rounded-full shadow-lg">
                  VIDEO
                </div>
              </>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-xs text-white">
              {allowDownload && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 px-2 py-1 rounded-full">
                  <Download className="w-3 h-3" />
                </div>
              )}
              <div className="bg-black/70 px-2 py-1 rounded-full">
                {index + 1}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})()}

        </div>
      </div>
    </div>
  )
}
