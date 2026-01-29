'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FolderCard } from '@/components/FolderCard'

import {
  Camera, Lock, Loader2, Download, X, 
  Calendar, AlertCircle, ChevronLeft, ChevronRight, Images, Eye, EyeOff,
  ArrowLeft, FileText, Folder
} from 'lucide-react'

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
    setLoading(true)
    try {
      const sessionParam = session || sessionToken
      const url = sessionParam
        ? `/api/gallery/${token}/photos?session=${encodeURIComponent(sessionParam)}`
        : `/api/gallery/${token}/photos`
      
      const response = await fetch(url)
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
      setLoading(false)
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
    toast.info('Preparing your archive...')

    try {
      const response = await fetch(`/api/gallery/${token}/download-zip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create archive')
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
      
      toast.success(`Gallery downloaded (${photos.length} files)`)
    } catch (error) {
      console.error('Archive download error:', error)
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
      <div className="min-h-screen relative overflow-hidden bg-[#F5F0EA]">
        <div
          className="fixed inset-0 opacity-90"
          style={{
            backgroundImage: "url('/cover.webp')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'sepia(0.15) brightness(1.05)',

          }}
        />
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-black-100 to-black-50 border border-black-200/50 flex items-center justify-center shadow-lg">
              <Camera className="w-8 h-8 text-black-800/70" />
            </div>
            <Loader2 className="w-6 h-6 text-black-800/60 animate-spin" />
            <p className="text-sm text-black-900/60 font-serif tracking-wide">Loading your gallery</p>
          </div>
        </div>
      </div>
    )
  }

  // EXPIRED
  if (expired) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#F5F0EA]">
        <div
          className="fixed inset-0 opacity-90"
          style={{
            backgroundImage: "url('/cover.webp')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'sepia(0.15) brightness(1.05)',

          }}
        />

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="max-w-lg w-full rounded-3xl border border-black-200/50 bg-white/90 backdrop-blur-sm shadow-2xl p-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-rose-50 border border-red-200/50 flex items-center justify-center mb-6 shadow-md">
              <Calendar className="w-8 h-8 text-red-700/70" />
            </div>
            <h1 className="text-3xl font-serif text-black-900 mb-3">
              Gallery Expired
            </h1>
            <p className="text-base text-black-800/80 mb-6 leading-relaxed">
              The viewing period for this collection has ended. Your photographer may have set an expiration date for privacy reasons.
            </p>
            <div className="rounded-2xl bg-black-50/50 border border-black-200/30 p-5 text-sm text-black-900/70 leading-relaxed">
              If you still need access, please reach out to your photographer for a renewed link.
            </div>
            <p className="mt-8 text-xs text-black-800/50 font-serif tracking-wider">
              ARTYDROP
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ERROR
  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#F5F0EA]">
        <div
          className="fixed inset-0 opacity-90"
          style={{
            backgroundImage: "url('/cover.webp')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'sepia(0.15) brightness(1.05)',
          }}
        />

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="max-w-lg w-full rounded-3xl border border-black-200/50 bg-white/90 backdrop-blur-sm shadow-2xl p-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-black-100 to-black-50 border border-black-200/50 flex items-center justify-center mb-6 shadow-md">
              <AlertCircle className="w-8 h-8 text-black-800/70" />
            </div>
            <h1 className="text-3xl font-serif text-black-900 mb-3">
              Gallery Unavailable
            </h1>
            <p className="text-base text-black-800/80 mb-6 leading-relaxed">
              {error === 'Gallery not found'
                ? "We couldn't locate this gallery. The link may be incorrect or the collection may have been removed."
                : error}
            </p>
            <div className="rounded-2xl bg-black-50/50 border border-black-200/30 p-5 text-sm text-black-900/70 leading-relaxed">
              Please verify the link in your email or contact your photographer for assistance.
            </div>
            <p className="mt-8 text-xs text-black-800/50 font-serif tracking-wider">
              ARTYDROP
            </p>
          </div>
        </div>
      </div>
    )
  }

  // PASSWORD CARD
  if (requiresPassword && !isAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#F5F0EA]">
        <div
          className="fixed inset-0 opacity-90"
          style={{
            backgroundImage: "url('/cover.webp')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'sepia(0.15) brightness(1.05)',

          }}
        />

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-3xl border border-black-200/50 bg-white/90 backdrop-blur-sm shadow-2xl p-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-black-100 to-black-50 border border-black-200/50 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Lock className="w-10 h-10 text-black-800/70" />
            </div>
            <h1 className="text-2xl font-serif text-black-900 mb-2 text-center">
              Protected Collection
            </h1>
            <p className="text-sm text-black-800/70 mb-8 text-center leading-relaxed">
              This gallery requires a password to view
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-black-900/80 uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="h-12 rounded-xl bg-black-50/50 border-black-200/50 text-sm pr-12 focus:border-black-300 focus:ring-black-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black-800/40 hover:text-black-800/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-700 animate-in fade-in slide-in-from-top-1 duration-300">{passwordError}</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isVerifying || !password}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-black-800 to-black-900 text-white hover:from-black-900 hover:to-black-950 text-sm font-medium shadow-lg disabled:opacity-90 transition-all duration-300"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying
                  </>
                ) : (
                  'Unlock Gallery'
                )}
              </Button>
            </form>

            <p className="mt-8 text-xs text-black-800/50 text-center font-serif tracking-wider">
              ARTYDROP
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
        className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300"
        onClick={closeLightbox}
      >
        <div 
          className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Navigation Arrows */}
          <button
            onClick={prevPhoto}
            className="absolute left-4 sm:left-8 p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all z-10 group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={nextPhoto}
            className="absolute right-4 sm:right-8 p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all z-10 group"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Photo/Video Content */}
          <div className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
            {currentPhoto?.media_type === 'video' ? (
              <video
                key={currentPhoto.id}
                src={currentPhoto.video_url}
                controls
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                autoPlay
              />
            ) : (
              <img
                key={currentPhoto?.id}
                src={currentPhoto?.image_url}
                alt={currentPhoto?.file_name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>

          {/* Download Button */}
          {allowDownload && currentPhoto && (
            <Button
              onClick={() => handleDownload(currentPhoto, true)}
              disabled={downloadingId === currentPhoto.id}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 hover:bg-white text-black-900 shadow-2xl border-0 h-12 px-6 rounded-full"
            >
              {downloadingId === currentPhoto.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Downloading
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
          <div className="absolute bottom-6 left-6 sm:left-8 text-white/90 text-sm bg-black/30 backdrop-blur-md px-4 py-2 rounded-full font-serif">
            {currentPhotoIndex + 1} of {photos.length}
          </div>
        </div>
      </div>
    )
  }

  // MAIN GALLERY
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F5F0EA]">
      <div
        className="fixed inset-0 opacity-90"
        style={{
          backgroundImage: "url('/cover.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'sepia(0.15) brightness(1.05)',

        }}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative z-10 pt-8 px-4 sm:px-8 max-w-7xl mx-auto w-full flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <Link href="/" className="group">
          <div className="inline-flex items-center justify-center px-5 py-2.5 border border-black-800/30 rounded-full bg-white/40 backdrop-blur-sm hover:bg-white/60 transition-all duration-300 shadow-sm">
            <span className="text-xs tracking-[0.2em] uppercase font-serif text-black-900">
              ARTYDROP
            </span>
          </div>
        </Link>
        
        {allowDownload && photos.length > 0 && (
          <Button
            onClick={handleDownloadAllZip}
            disabled={isDownloadingZip}
            className="hidden sm:flex h-11 px-6 rounded-full bg-gradient-to-r from-black-800 to-black-900 text-black hover:from-black-900 hover:to-black-950 text-sm items-center gap-2 shadow-lg transition-all duration-300"
          >
            {isDownloadingZip ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Preparing
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download All
              </>
            )}
          </Button>
        )}
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header Card */}
          <div className="rounded-3xl border border-black-200/50 bg-white/80 backdrop-blur-sm shadow-xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 space-y-4">
                <h1 className="text-4xl sm:text-5xl font-serif text-black-900 leading-tight">
                  {gallery?.title || 'Your Gallery'}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-black-800/70">
                  {gallery?.client_name && (
                    <span className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      {gallery.client_name}
                    </span>
                  )}
                  {gallery?.event_date && (
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(gallery.event_date), 'MMMM d, yyyy')}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <Images className="w-4 h-4" />
                    {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
              </div>

              {allowDownload && photos.length > 0 && (
                <Button
                  onClick={handleDownloadAllZip}
                  disabled={isDownloadingZip}
                  className="sm:hidden w-full sm:w-auto h-12 px-6 rounded-full bg-gradient-to-r from-black-800 to-black-900 text-black hover:from-black-900 hover:to-black-950 text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  {isDownloadingZip ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Preparing
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
              <div className="mt-6 p-4 rounded-2xl bg-black-50 border border-black-200/50 text-sm text-black-900/80 flex items-center gap-3">
                <EyeOff className="w-4 h-4 flex-shrink-0" />
                <span>This is a view-only gallery. Downloads are not available.</span>
              </div>
            )}
          </div>

          {/* Folder Browser */}
          {folders.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              {selectedFolder ? (
                <div className="space-y-6">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-medium bg-white/80 backdrop-blur-sm hover:bg-white border border-black-200/50 text-black-900 transition-all hover:shadow-lg group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Collections
                  </button>
                  
                  <div className="flex items-center gap-3 text-sm text-black-800/70 font-serif">
                    <span>Gallery</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-black-900 font-medium">
                      {folders.find(f => f.id === selectedFolder)?.name || 'Collection'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-2xl font-serif text-d-900 flex items-center gap-3">
                    <Folder className="w-6 h-6" />
                    Collections
                  </h2>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {folders.map((folder, index) => {
                      const folderPhotos = photos.filter(p => p.folder_id === folder.id)
                      const count = folderPhotos.length
                      const previewPhotos = folderPhotos.slice(0, 4)
                      
                      return (
                        <div
                          key={folder.id}
                          className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                          style={{ animationDelay: `${(index + 1) * 100}ms` }}
                        >
                          <FolderCard
                            folder={folder}
                            photoCount={count}
                            previewPhotos={previewPhotos}
                            onClick={() => setSelectedFolder(folder.id)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Photos Grid */}
          {(() => {
            const filteredPhotos = selectedFolder === null
              ? photos.filter(p => p.folder_id === null)
              : photos.filter(p => p.folder_id === selectedFolder)
            
            if (loading) {
              return (
                <div className="rounded-3xl border border-black-200/50 bg-white/80 backdrop-blur-sm shadow-xl p-16 text-center">
                  <Loader2 className="w-12 h-12 text-black-800/40 animate-spin mx-auto mb-4" />
                  <p className="text-sm text-black-900/70 font-serif">Loading your photos</p>
                </div>
              )
            }
            
            if (filteredPhotos.length === 0 && selectedFolder === null && folders.length > 0) {
              return null
            }
            
            if (filteredPhotos.length === 0) {
              return (
                <div className="rounded-3xl border border-black-200/50 bg-white/80 backdrop-blur-sm shadow-xl p-16 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-black-100 to-black-50 border border-black-200/50 flex items-center justify-center mx-auto mb-6 shadow-md">
                    <Images className="w-10 h-10 text-black-800/60" />
                  </div>
                  <h3 className="text-xl font-serif text-black-900 mb-2">
                    {selectedFolder ? 'Empty Collection' : 'No Photos Yet'}
                  </h3>
                  <p className="text-sm text-black-800/70 max-w-sm mx-auto leading-relaxed">
                    {selectedFolder ? 'This collection is currently empty' : 'Your photographer is preparing your gallery'}
                  </p>
                </div>
              )
            }
            
            return (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                {selectedFolder === null && filteredPhotos.length > 0 && folders.length > 0 && (
                  <h3 className="text-xl font-serif text-black-900">Individual Photos</h3>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {filteredPhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-black-50 to-black-100/50 border border-black-200/30 cursor-pointer aspect-square hover:shadow-2xl transition-all duration-500 animate-in fade-in zoom-in-95"
                      style={{ animationDelay: `${index * 30}ms`, animationDuration: '500ms' }}
                      onClick={() => {
                        const realIndex = photos.findIndex(p => p.id === photo.id)
                        openLightbox(realIndex)
                      }}
                    >
                      {photo.media_type === 'video' && !photo.thumbnail_url ? (
                        <video
                          src={photo.video_url}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={photo.thumbnail_url || photo.image_url}
                          alt={photo.file_name || `Photo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                        />
                      )}

                      {photo.media_type === 'video' && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-white/95 shadow-2xl flex items-center justify-center group-hover:scale-125 transition-all duration-300">
                              <svg className="w-6 h-6 text-black-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black-900/40 via-transparent opacity-0 group-hover:opacity-900 transition-opacity duration-500" />
                      
                      {allowDownload && (
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-900 transition-opacity duration-300">
                          <div className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-lg flex items-center justify-center">
                            <Download className="w-4 h-4 text-black-900" />
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-900 transition-opacity duration-300">
                        <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-serif">
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