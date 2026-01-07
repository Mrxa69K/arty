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

  // Download all
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadedCount, setDownloadedCount] = useState(0)

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
      const response = await fetch(photo.image_url)
      if (!response.ok) throw new Error('Failed to fetch image')

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = photo.file_name || `photo-${photo.id}.jpg`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      }, 100)

      if (showToast) {
        toast.success('Photo downloaded')
      }
      return true
    } catch (err) {
      console.error('Download error:', err)
      if (showToast) {
        toast.error('Failed to download photo. Please try again.')
      }
      return false
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDownloadAll = async () => {
    if (photos.length === 0) return
    setIsDownloadingAll(true)
    setDownloadProgress(0)
    setDownloadedCount(0)

    toast.info(`Starting download of ${photos.length} photos…`)

    let successCount = 0

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      const success = await handleDownload(photo, false)
      if (success) successCount++

      setDownloadedCount(i + 1)
      setDownloadProgress(Math.round(((i + 1) / photos.length) * 100))

      if (i < photos.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400))
      }
    }

    setIsDownloadingAll(false)

    if (successCount === photos.length) {
      toast.success(`All ${photos.length} photos downloaded`)
    } else {
      toast.warning(`Downloaded ${successCount} of ${photos.length} photos`)
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#F97316] flex items-center justify-center">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <Loader2 className="w-5 h-5 text-white/70 animate-spin" />
          <p className="text-xs text-white/50">Loading gallery…</p>
        </div>
      </div>
    )
  }

  // EXPIRED
  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-red-500" />
          </div>
          <h1
            className="text-2xl font-semibold mb-2"
            style={{ fontFamily: '"Josefin Sans", system-ui, sans-serif' }}
          >
            This gallery has expired
          </h1>
          <p className="text-sm text-slate-600 mb-4">
            The viewing period for this gallery is over. The photographer may have
            set an expiration date for privacy and storage reasons.
          </p>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
            If you still need access to your photos, please contact your
            photographer and request a new gallery link.
          </div>
          <p className="mt-6 text-[11px] text-slate-400">
            Powered by <span className="font-medium text-slate-700">Artydrop</span>
          </p>
        </div>
      </div>
    )
  }

  // ERROR
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-slate-500" />
          </div>
          <h1
            className="text-2xl font-semibold mb-2"
            style={{ fontFamily: '"Josefin Sans", system-ui, sans-serif' }}
          >
            Gallery not available
          </h1>
          <p className="text-sm text-slate-600 mb-4">
            {error === 'Gallery not found'
              ? "We couldn't find this gallery. The link may be incorrect or the gallery may have been removed."
              : error}
          </p>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
            Double‑check the link in your email or message. If the problem
            continues, contact your photographer for a fresh gallery link.
          </div>
          <p className="mt-6 text-[11px] text-slate-400">
            Powered by <span className="font-medium text-slate-700">Artydrop</span>
          </p>
        </div>
      </div>
    )
  }

  // PASSWORD CARD
  if (requiresPassword && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          {/* ... tu peux laisser ici ton bloc password inchangé */}
          {/* (je ne le réécris pas pour raccourcir, mais tu peux garder exactement ton code actuel) */}
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

      {/* Navbar client avec logo pilule ARTYDROP */}
     <header className="pt-6 px-4 sm:px-6 max-w-5xl mx-auto w-full flex items-center justify-between">
          {/* logo encadré comme login/signup */}
          <Link href="/" className="flex items-center">
            <div className="inline-flex items-center justify-center px-4 py-2 border border-black/80 rounded-[999px] bg-black/5 backdrop-blur-sm">
              <span className="text-xs tracking-[0.18em] uppercase">
                ARTYDROP
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/login" className="text-black/80 hover:text-black">
              Log in
            </Link>
            <Link href="/signup">
              <Button className="h-8 rounded-full px-4 bg-black text-white hover:bg-black/90 text-[11px]">
                Get started
              </Button>
            </Link>
          </div>
        </header>

      {/* Contenu principal */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 md:py-10 flex flex-col gap-6 md:flex-row">
        <div className="hidden lg:block flex-1" />

        <div className="w-full lg:max-w-3xl bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
          {/* Header de la card (reprend ton code actuel) */}
          <div className="px-4 md:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#F97316] flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ fontFamily: '"Josefin Sans", system-ui, sans-serif' }}
                  >
                    {gallery?.title || 'Client gallery'}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    {gallery?.client_name && <span>{gallery.client_name}</span>}
                    {gallery?.client_name && gallery?.event_date && (
                      <span className="text-slate-300">•</span>
                    )}
                    {gallery?.event_date && (
                      <span>{format(new Date(gallery.event_date), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {photos.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-[11px] text-slate-700">
                    <Images className="w-3 h-3" />
                    <span>{photos.length} photos</span>
                  </div>
                )}
                {allowDownload && photos.length > 0 && (
                  <Button
                    size="sm"
                    className="h-8 px-3 text-[11px] bg-gradient-to-r from-[#7C3AED] to-[#F97316] hover:from-[#7C3AED] hover:to-[#F97316]/90"
                    disabled={isDownloadingAll}
                    onClick={handleDownloadAll}
                  >
                    {isDownloadingAll ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        {downloadedCount}/{photos.length}
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3 mr-1" />
                        Download all
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {isDownloadingAll && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Preparing downloads…</span>
                  <span>{downloadProgress}%</span>
                </div>
                <Progress value={downloadProgress} className="h-1" />
              </div>
            )}
          </div>

          {/* Notice view-only */}
          {photos.length > 0 && !allowDownload && (
            <div className="px-4 md:px-6 py-3 bg-amber-50 border-b border-amber-100 text-[11px] text-amber-800 flex items-center gap-2">
              <EyeOff className="w-3 h-3" />
              This gallery is view‑only. Downloads are not enabled.
            </div>
          )}

          {/* Contenu : grille ou “No photos yet” */}
          <div className="px-4 md:px-6 py-5">
            {photos.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Images className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-800 mb-1">
                  No photos yet
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your photographer may still be preparing your gallery. Try again
                  a bit later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    className="relative group rounded-xl overflow-hidden bg-slate-100"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.file_name || `Photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[11px] text-white">
                      <span className="px-2 py-0.5 rounded-full bg-black/50">
                        {index + 1} / {photos.length}
                      </span>
                    </div>
                    {allowDownload && (
                      <div className="absolute top-2 right-2">
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
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 md:px-6 py-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Delivered via Artydrop</span>
            <span>Secure link • private gallery</span>
          </div>
        </div>

        <div className="hidden lg:block flex-1" />
      </div>

      {/* LIGHTBOX identique */}
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
            <img
              src={photos[currentPhotoIndex]?.image_url}
              alt={
                photos[currentPhotoIndex]?.file_name ||
                `Photo ${currentPhotoIndex + 1}`
              }
              className="w-full h-full object-contain rounded-xl shadow-2xl"
            />
            <div className="mt-4 flex items-center justify-between text-xs text-white/70">
              <span>
                {currentPhotoIndex + 1} / {photos.length}
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
                      Download photo
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
