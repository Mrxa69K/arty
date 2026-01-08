'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'          
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Camera,
  Lock,
  Loader2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  Images,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle as CheckCircleIcon,
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
      setAllowDownload(data.allow_download)
    } catch (err) {
      console.error('Error fetching photos:', err)
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
        setPasswordError(data.error || 'Incorrect password')
        return
      }

      setSessionToken(data.session)
      setIsAuthenticated(true)
      fetchPhotos(data.session)
    } catch {
      setPasswordError('Failed to verify password. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

 const handleDownload = async (photo, showToast = true) => {
  setDownloadingId(photo.id)
  try {
    // ✅ Utilise video_url OU image_url
    const url = photo.media_type === 'video' ? photo.video_url : photo.image_url
    
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch file')

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
      toast.error('Failed to download. Please try again.')
    }
    return false
  } finally {
    setDownloadingId(null)
  }
}


const handleDownloadAllZip = async () => {
  console.log('🔵 Starting ZIP download')
  console.log('Token:', token)
  console.log('Photos count:', photos.length)
  
  if (photos.length === 0) {
    console.log('❌ No photos to download')
    toast.error('No photos to download')
    return
  }
  
  setIsDownloadingZip(true)
  toast.info('Preparing your ZIP file...')

  try {
    console.log('🔵 Calling API with token')
    
    const response = await fetch(`/api/gallery/${token}/download-zip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('🔵 Response status:', response.status)
    console.log('🔵 Response OK:', response.ok)

    if (!response.ok) {
      const error = await response.json()
      console.log('❌ API Error:', error)
      throw new Error(error.error || 'Failed to create ZIP')
    }

    console.log('🔵 Getting blob...')
    const blob = await response.blob()
    console.log('🔵 Blob size:', blob.size)
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const filename = gallery?.title 
      ? `${gallery.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`
      : 'gallery.zip'
    a.download = filename
    document.body.appendChild(a)
    a.click()
    
    console.log('✅ Download triggered')
    
    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }, 100)
    
    toast.success(`Gallery downloaded (${photos.length} photos)`)
  } catch (error) {
    console.error('❌ ZIP download error:', error)
    toast.error(error.message || 'Failed to download gallery')
  } finally {
    setIsDownloadingZip(false)
  }
}


  const openLightbox = (index) => {
    setCurrentPhotoIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

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

  // MAIN GALLERY avec thème cover.webp + beige
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background cover + beige + grain */}
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

      {/* Navbar avec logo pilule */}
      <header className="relative z-10 pt-6 px-4 sm:px-6 max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="inline-flex items-center justify-center px-4 py-2 border border-black/80 rounded-[999px] bg-black/5 backdrop-blur-sm">
            <span className="text-xs tracking-[0.18em] uppercase">
              ARTYDROP
            </span>
          </div>
        </Link>
        
        {/* ✅ Download All ZIP button - Desktop */}
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

      {/* Contenu principal */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Gallery Info Card */}
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

              {/* ✅ Download All ZIP button - Mobile */}
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

            {/* View-only notice */}
            {!allowDownload && photos.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <EyeOff className="w-3 h-3" />
                This gallery is view‑only. Downloads are not enabled.
              </div>
            )}
          </div>

          {/* Photos Grid */}
          {photos.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-[#FDF9F3]/95 shadow-md p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
                <Images className="w-8 h-8 text-black/30" />
              </div>
              <h3 className="text-lg font-semibold text-black/80 mb-2">No photos yet</h3>
              <p className="text-sm text-black/60 max-w-sm mx-auto">
                Your photographer may still be preparing your gallery. Check back soon!
              </p>
            </div>
          ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
  {photos.map((photo, index) => (
    <div
      key={photo.id}
      className="relative group rounded-xl overflow-hidden bg-slate-100 cursor-pointer"
      onClick={() => openLightbox(index)}
    >
      {/* ✅ Affiche toujours image_url (c'est le thumbnail pour vidéos) */}
      <img
        src={photo.image_url || '/placeholder.jpg'}
        alt={photo.file_name || `Media ${index + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      {/* ✅ Play button si c'est une vidéo */}
      {photo.media_type === 'video' && (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] flex items-center gap-1 pointer-events-none">
            <Camera className="w-3 h-3" />
            VIDEO
          </div>
        </>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[11px] text-white pointer-events-none">
        <span className="px-2 py-0.5 rounded-full bg-black/50">
          {index + 1} / {photos.length}
        </span>
      </div>
      
      {allowDownload && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 border-none"
            disabled={downloadingId === photo.id}
            onClick={(e) => {
              e.stopPropagation()
              handleDownload(photo)
            }}
          >
            {downloadingId === photo.id ? (
              <Loader2 className="w-3 h-3 animate-spin text-white" />
            ) : (
              <Download className="w-3 h-3 text-white" />
            )}
          </Button>
        </div>
      )}
    </div>
  ))}
</div>



          )}

          {/* Footer */}
          <div className="mt-8 py-4 text-center text-[11px] text-black/50">
            <p>Delivered via <span className="font-medium text-black/70">Artydrop</span> • Secure private gallery</p>
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxOpen && photos.length > 0 && (
  <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
    <button
      onClick={closeLightbox}
      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
    >
      <X className="w-5 h-5 text-white" />
    </button>

    {photos.length > 1 && (
      <>
        <button
          onClick={prevPhoto}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextPhoto}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </>
    )}

    <div className="max-w-5xl max-h-[80vh] w-full px-6">
      {/* ✅ NOUVEAU: Support vidéo dans lightbox */}
      {photos[currentPhotoIndex]?.media_type === 'video' ? (
        <video
          src={photos[currentPhotoIndex]?.video_url}
          controls
          autoPlay
          className="w-full h-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
        />
      ) : (
        <img
          src={photos[currentPhotoIndex]?.image_url}
          alt={photos[currentPhotoIndex]?.file_name || `Photo ${currentPhotoIndex + 1}`}
          className="w-full h-full object-contain rounded-xl shadow-2xl"
        />
      )}
      
      <div className="mt-4 flex items-center justify-between text-xs text-white/70">
        <span>
          {currentPhotoIndex + 1} / {photos.length}
          {photos[currentPhotoIndex]?.media_type === 'video' && ' • Video'}
        </span>
        {allowDownload && (
          <Button
            size="sm"
            className="h-8 px-4 text-[11px] bg-white text-black hover:bg-white/90"
            disabled={isDownloading}
            onClick={() => handleDownload(photos[currentPhotoIndex])}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Downloading…
              </>
            ) : (
              <>
                <Download className="w-3 h-3 mr-1" />
                Download {photos[currentPhotoIndex]?.media_type === 'video' ? 'video' : 'photo'}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  </div>
)}

    </div>
  )
}
