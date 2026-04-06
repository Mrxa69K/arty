'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderCard } from '@/components/FolderCard'
import {
  Lock, Loader2, Download, X,
  ChevronLeft, ChevronRight, Eye, EyeOff,
  ArrowLeft, ArrowDownToLine
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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [downloadingId, setDownloadingId] = useState(null)
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [photographerName, setPhotographerName] = useState(null)
  const [photographerProfile, setPhotographerProfile] = useState(null)
  const [galleryMessage, setGalleryMessage] = useState(null)

  const heroRef = useRef(null)
  const filmStripRef = useRef(null)
  const touchStartX = useRef(null)

  useEffect(() => {
    if (token) fetchGalleryInfo()
  }, [token])

  useEffect(() => {
    if (isAuthenticated || (!requiresPassword && gallery)) {
      fetchPhotos(sessionToken)
    }
  }, [isAuthenticated, requiresPassword, gallery, sessionToken])

  // Sticky header on scroll
  useEffect(() => {
    const onScroll = () => setHeaderVisible(window.scrollY > window.innerHeight * 0.7)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll film strip to current photo in lightbox
  useEffect(() => {
    if (lightboxOpen && filmStripRef.current) {
      const thumb = filmStripRef.current.children[currentPhotoIndex]
      if (thumb) thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [currentPhotoIndex, lightboxOpen])

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
      setPhotographerName(data.photographer_name || null)
      setPhotographerProfile(data.photographer || null)
      setGalleryMessage(data.message || null)
      if (!data.requires_password) setIsAuthenticated(true)
      // Track view (fire and forget)
      fetch(`/api/gallery/${token}/view`, { method: 'POST' }).catch(() => {})
    } catch (err) {
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
        if (data.expired) { setExpired(true); return }
        setPasswordError(data.error || 'Invalid password')
        return
      }
      setSessionToken(data.session)
      setIsAuthenticated(true)
      setAllowDownload(data.allow_download)
    } catch (err) {
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
        body: JSON.stringify({ photoId: photo.id }),
      })
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = photo.file_name || `photo-${photo.id}.jpg`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl) }, 100)
      if (showToast) toast.success('Downloaded')
      return true
    } catch (err) {
      if (showToast) toast.error('Download failed')
      return false
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDownloadAllZip = async () => {
    if (photos.length === 0) return
    setIsDownloadingZip(true)
    toast.info('Preparing your archive...')
    try {
      // Generate zip in the browser — each photo fetched via API (avoids CORS and server timeout)
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      const BATCH = 4
      for (let i = 0; i < photos.length; i += BATCH) {
        await Promise.all(
          photos.slice(i, i + BATCH).map(async (photo) => {
            try {
              const res = await fetch(`/api/gallery/${token}/download-photo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoId: photo.id }),
              })
              if (!res.ok) return
              const blob = await res.blob()
              zip.file(photo.file_name || `photo-${photo.id}.jpg`, blob)
            } catch { /* skip failed photo */ }
          })
        )
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 3 },
      })

      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = gallery?.title ? `${gallery.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip` : 'gallery.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Archive downloaded')
    } catch {
      toast.error('Download failed')
    } finally {
      setIsDownloadingZip(false)
    }
  }

  const openLightbox = useCallback((index) => {
    setCurrentPhotoIndex(index)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  const nextPhoto = useCallback(() =>
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length), [photos.length])

  const prevPhoto = useCallback(() =>
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length), [photos.length])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextPhoto()
      if (e.key === 'ArrowLeft') prevPhoto()
    }
    document.addEventListener('keydown', handleKeyDown)
    if (lightboxOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [lightboxOpen, closeLightbox, nextPhoto, prevPhoto])

  const coverPhoto = gallery?.cover_image_url || null
  const heroBg = coverPhoto || photos[0]?.image_url || null
  const isExplicitCover = !!gallery?.cover_image_url
  const currentPhoto = photos[currentPhotoIndex]
  const filteredPhotos = selectedFolder === null
    ? (folders.length > 0 ? photos.filter(p => p.folder_id === null) : photos)
    : photos.filter(p => p.folder_id === selectedFolder)

  const daysUntilExpiry = gallery?.expires_at
    ? Math.ceil((new Date(gallery.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ── IRIS LOADER ── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="iris"
            className="fixed inset-0 z-[200] bg-[#0a0a0a] flex items-center justify-center"
            initial={{ clipPath: 'circle(120% at 50% 50%)' }}
            animate={{ clipPath: 'circle(120% at 50% 50%)' }}
            exit={{ clipPath: 'circle(0% at 50% 50%)' }}
            transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
          >
            <motion.svg
              width="52" height="52" viewBox="0 0 52 52"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {/* Static outer ring */}
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              {/* Animated drawing ring */}
              <motion.circle
                cx="26" cy="26" r="22"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="0.75"
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1, 0] }}
                transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity, times: [0, 0.55, 1] }}
              />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EXPIRED ── */}
      {expired && (
        <div className="min-h-screen flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-sm w-full text-center"
          >
            <div className="w-px h-12 bg-white/10 mx-auto mb-10" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 font-body mb-6">Access Expired</p>
            <h1 className="font-display text-3xl text-white mb-4">This collection<br />is no longer available</h1>
            <p className="text-sm text-white/40 font-body leading-relaxed">
              The viewing period has ended. Contact your photographer to request a renewed link.
            </p>
            <div className="w-px h-12 bg-white/10 mx-auto mt-10" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/15 font-body mt-4">ArtyDrop</p>
          </motion.div>
        </div>
      )}

      {/* ── ERROR ── */}
      {!expired && error && (
        <div className="min-h-screen flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-sm w-full text-center"
          >
            <div className="w-px h-12 bg-white/10 mx-auto mb-10" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 font-body mb-6">Not Found</p>
            <h1 className="font-display text-3xl text-white mb-4">Gallery<br />Unavailable</h1>
            <p className="text-sm text-white/40 font-body leading-relaxed">
              This link may be incorrect or the collection has been removed.
            </p>
            <div className="w-px h-12 bg-white/10 mx-auto mt-10" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/15 font-body mt-4">ArtyDrop</p>
          </motion.div>
        </div>
      )}

      {/* ── PASSWORD GATE ── */}
      {!expired && !error && requiresPassword && !isAuthenticated && (
        <div className="min-h-screen flex items-center justify-center px-6" data-testid="password-gate">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <div className="mb-12 text-center">
              <div className="w-px h-10 bg-white/10 mx-auto mb-8" />
              <Lock className="w-5 h-5 text-white/30 mx-auto mb-6" strokeWidth={1} />
              <h1 className="font-display text-3xl text-white mb-2">Private Collection</h1>
              <p className="text-sm text-white/40 font-body">Enter your access code to continue</p>
              {photographerName && (
                <p className="text-[10px] tracking-[0.3em] uppercase text-white/20 font-body mt-3">by {photographerName}</p>
              )}
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Access code"
                  data-testid="password-input"
                  className="w-full h-14 bg-transparent border-b border-white/10 text-white placeholder:text-white/20 text-sm font-body focus:outline-none focus:border-white/30 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                </button>
              </div>
              {passwordError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400/80 font-body">
                  {passwordError}
                </motion.p>
              )}
              <button
                type="submit"
                disabled={isVerifying || !password}
                data-testid="unlock-btn"
                className="w-full h-12 bg-white text-black text-sm font-body font-semibold hover:bg-white/90 transition-colors disabled:opacity-30 mt-2"
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mx-auto" strokeWidth={1.5} /> : 'Enter Gallery'}
              </button>
            </form>
            <p className="text-center text-[10px] tracking-[0.3em] uppercase text-white/15 font-body mt-12">ArtyDrop</p>
          </motion.div>
        </div>
      )}

      {/* ── GALLERY ── */}
      {!expired && !error && (!requiresPassword || isAuthenticated) && (
      <div data-testid="gallery-view">

      {/* ── NAVBAR ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-12 h-14 flex items-center justify-between transition-all duration-500 ${
          headerVisible
            ? 'bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        {/* Logo */}
        <a href="/" className="font-display text-white/50 hover:text-white text-sm tracking-wide transition-colors">
          ArtyDrop
        </a>

        {/* Center: photographer name */}
        {photographerName && (
          <span className="absolute left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase text-white/25 font-body hidden md:block">
            {photographerName}
          </span>
        )}

        {/* Right: actions */}
        <div className="flex items-center gap-5">
          {allowDownload && !loading && photos.length > 0 && (
            <button
              onClick={handleDownloadAllZip}
              disabled={isDownloadingZip}
              className="hidden sm:flex items-center gap-1.5 text-xs text-white/40 hover:text-white font-body transition-colors"
            >
              {isDownloadingZip
                ? <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                : <ArrowDownToLine className="w-3 h-3" strokeWidth={1.5} />
              }
              {isDownloadingZip ? 'Preparing...' : 'Download all'}
            </button>
          )}
          <a
            href="/login"
            className="text-[10px] tracking-[0.2em] uppercase text-white/30 hover:text-white font-body transition-colors"
          >
            Sign in
          </a>
        </div>
      </header>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxOpen && currentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
            data-testid="lightbox"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
              <span className="text-white/30 text-xs font-body tracking-widest">
                {String(currentPhotoIndex + 1).padStart(2, '0')} — {String(photos.length).padStart(2, '0')}
              </span>
              <div className="flex items-center gap-4">
                {allowDownload && (
                  <button
                    onClick={() => handleDownload(currentPhoto, true)}
                    disabled={downloadingId === currentPhoto.id}
                    data-testid="lightbox-download"
                    className="flex items-center gap-2 text-xs text-white/40 hover:text-white font-body transition-colors"
                  >
                    {downloadingId === currentPhoto.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                      : <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                    }
                    Save
                  </button>
                )}
                <button
                  onClick={closeLightbox}
                  data-testid="lightbox-close"
                  className="text-white/30 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={1} />
                </button>
              </div>
            </div>

            {/* Photo area */}
            <div
              className="flex-1 relative flex items-center justify-center px-12 md:px-24 min-h-0"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return
                const diff = touchStartX.current - e.changedTouches[0].clientX
                if (Math.abs(diff) > 50) { diff > 0 ? nextPhoto() : prevPhoto() }
                touchStartX.current = null
              }}
            >
              <button
                onClick={prevPhoto}
                data-testid="lightbox-prev"
                className="hidden md:block absolute left-8 z-10 p-2 text-white/20 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-8 h-8" strokeWidth={1} />
              </button>
              <button
                onClick={nextPhoto}
                data-testid="lightbox-next"
                className="hidden md:block absolute right-8 z-10 p-2 text-white/20 hover:text-white transition-colors"
              >
                <ChevronRight className="w-8 h-8" strokeWidth={1} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhoto.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {currentPhoto.media_type === 'video' ? (
                    <video
                      src={currentPhoto.video_url}
                      controls
                      autoPlay
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <img
                      src={currentPhoto.image_url}
                      alt={currentPhoto.file_name}
                      className="max-w-full max-h-full object-contain select-none"
                      draggable={false}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Film strip */}
            <div className="flex-shrink-0 py-3 px-4 overflow-x-auto scrollbar-none">
              <div ref={filmStripRef} className="flex gap-1 w-max mx-auto">
                {photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => setCurrentPhotoIndex(i)}
                    className={`flex-shrink-0 w-12 h-12 overflow-hidden transition-all duration-200 ${
                      i === currentPhotoIndex
                        ? 'opacity-100 ring-1 ring-gold ring-offset-1 ring-offset-black'
                        : 'opacity-30 hover:opacity-60'
                    }`}
                  >
                    <img
                      src={photo.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative h-[65vh] min-h-[420px] flex flex-col justify-end overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        {heroBg && (
          <>
            <div
              className="absolute inset-0 scale-110"
              style={{
                backgroundImage: `url(${heroBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: isExplicitCover ? 'blur(3px)' : 'blur(32px)',
                opacity: isExplicitCover ? 1 : 0.35,
              }}
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${
              isExplicitCover
                ? 'from-[#0a0a0a] via-[#0a0a0a]/55 to-[#0a0a0a]/15'
                : 'from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-[#0a0a0a]/40'
            }`} />
          </>
        )}

        {/* Grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px',
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 px-8 md:px-16 pb-10 md:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/30 font-body mb-5">
              {gallery?.client_name ? 'A collection for' : 'Your Collection'}
            </p>
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl text-white leading-[0.9] mb-5 max-w-3xl">
              {gallery?.client_name || gallery?.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/30 font-body">
              {gallery?.event_date && (
                <span>{format(new Date(gallery.event_date), 'MMMM d, yyyy')}</span>
              )}
              {!loading && photos.length > 0 && (
                <span>{photos.length} frames</span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── EXPIRATION NOTICE ── */}
      {(daysUntilExpiry !== null || gallery) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="px-6 md:px-16 py-6 max-w-7xl mx-auto w-full"
        >
          <div className={`px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border ${
            daysUntilExpiry !== null && daysUntilExpiry <= 3
              ? 'border-red-900/50 bg-red-950/20'
              : daysUntilExpiry !== null && daysUntilExpiry <= 7
              ? 'border-amber-900/40 bg-amber-950/10'
              : 'border-white/[0.06] bg-white/[0.02]'
          }`}>
            <div className="space-y-1.5">
              <p className={`text-sm font-body leading-relaxed ${
                daysUntilExpiry !== null && daysUntilExpiry <= 3
                  ? 'text-red-300/90'
                  : daysUntilExpiry !== null && daysUntilExpiry <= 7
                  ? 'text-amber-300/80'
                  : 'text-white/55'
              }`}>
                {daysUntilExpiry === null
                  ? 'This gallery is available for a limited time — download your photos to keep them.'
                  : daysUntilExpiry <= 0
                  ? `This gallery has expired. Contact your photographer to recover your photos.`
                  : daysUntilExpiry === 1
                  ? `Your gallery expires tomorrow (${format(new Date(gallery.expires_at), 'MMMM d, yyyy')}) — download everything before it's gone.`
                  : `Your gallery expires in ${daysUntilExpiry} days, on ${format(new Date(gallery.expires_at), 'MMMM d, yyyy')} — make sure to download everything before then.`
                }
              </p>
              <p className="text-[11px] text-white/20 font-body">
                After expiration, recovering your photos requires a renewal fee.
              </p>
            </div>
            {allowDownload && !loading && photos.length > 0 && daysUntilExpiry !== 0 && (
              <button
                onClick={handleDownloadAllZip}
                disabled={isDownloadingZip}
                className="flex-shrink-0 flex items-center gap-2 text-xs font-body px-4 py-2.5 border border-white/15 text-white/50 hover:bg-white hover:text-black transition-all"
              >
                {isDownloadingZip ? <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} /> : <ArrowDownToLine className="w-3 h-3" strokeWidth={1.5} />}
                {isDownloadingZip ? 'Preparing...' : 'Download everything'}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── PERSONAL MESSAGE ── */}
      {galleryMessage && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="px-8 md:px-16 pt-12 pb-4 max-w-2xl mx-auto text-center"
        >
          <div className="w-px h-8 bg-white/10 mx-auto mb-8" />
          <p className="font-display text-xl md:text-2xl text-white/70 leading-relaxed italic">
            &ldquo;{galleryMessage}&rdquo;
          </p>
          {photographerName && (
            <p className="mt-6 text-[10px] tracking-[0.3em] uppercase text-white/25 font-body">— {photographerName}</p>
          )}
          <div className="w-px h-8 bg-white/10 mx-auto mt-8" />
        </motion.section>
      )}

      {/* ── GALLERY CONTENT ── */}
      <div className="px-4 md:px-8 pt-8 pb-4">

        {/* Folder navigation */}
        {folders.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16 max-w-6xl mx-auto"
          >
            {selectedFolder ? (
              <div className="mb-8">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white font-body transition-colors"
                  data-testid="back-to-folders"
                >
                  <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
                  All collections
                </button>
                <h2 className="font-display text-2xl text-white mt-4">
                  {folders.find(f => f.id === selectedFolder)?.name}
                </h2>
              </div>
            ) : (
              <div className="space-y-8">
                <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 font-body">Collections</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {folders.map((folder, i) => {
                    const folderPhotos = photos.filter(p => p.folder_id === folder.id)
                    return (
                      <motion.div
                        key={folder.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <FolderCard
                          folder={folder}
                          photoCount={folderPhotos.length}
                          previewPhotos={folderPhotos.slice(0, 4)}
                          onClick={() => setSelectedFolder(folder.id)}
                        />
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Photos loading */}
        {loading && (
          <div className="py-32 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white/20 animate-spin" strokeWidth={1} />
          </div>
        )}

        {/* Masonry grid */}
        {!loading && filteredPhotos.length > 0 && (
          <div className="max-w-7xl mx-auto columns-2 md:columns-3 xl:columns-4 gap-1">
            {filteredPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4) }}
                className="break-inside-avoid mb-1 group relative overflow-hidden cursor-pointer"
                onClick={() => {
                  const realIndex = photos.findIndex(p => p.id === photo.id)
                  openLightbox(realIndex)
                }}
                data-testid={`photo-${photo.id}`}
              >
                {photo.media_type === 'video' ? (
                  <div className="relative">
                    <video
                      src={photo.video_url}
                      className="w-full block"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={photo.image_url}
                    alt={photo.file_name || `Frame ${index + 1}`}
                    className="w-full block"
                    loading="lazy"
                  />
                )}

                {/* Hover layer */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300" />
                {allowDownload && (
                  <div
                    className="absolute top-3 right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200"
                    onClick={(e) => { e.stopPropagation(); handleDownload(photo, true) }}
                  >
                    <div className="w-8 h-8 bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors">
                      {downloadingId === photo.id
                        ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" strokeWidth={1.5} />
                        : <Download className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
                      }
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredPhotos.length === 0 && photos.length > 0 && (
          <div className="py-24 text-center">
            <p className="text-white/20 text-sm font-body">No photos in this collection</p>
          </div>
        )}
      </div>

      {/* ── DOWNLOAD SECTION ── */}
      {allowDownload && photos.length > 0 && !loading && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 mb-8 px-8 md:px-16"
        >
          <div className="max-w-7xl mx-auto border-t border-white/5 pt-16 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/20 font-body mb-4">Your collection</p>
              <h2 className="font-display text-3xl md:text-4xl text-white leading-tight">
                {photos.length} frames,<br />ready to keep.
              </h2>
            </div>
            <button
              onClick={handleDownloadAllZip}
              disabled={isDownloadingZip}
              className="group flex items-center gap-4 text-white/70 hover:text-white transition-colors"
            >
              <span className="font-body text-sm">
                {isDownloadingZip ? 'Preparing archive...' : 'Download everything'}
              </span>
              <div className="w-12 h-12 border border-white/10 group-hover:border-white/30 flex items-center justify-center transition-colors">
                {isDownloadingZip
                  ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1} />
                  : <ArrowDownToLine className="w-4 h-4" strokeWidth={1} />
                }
              </div>
            </button>
          </div>
        </motion.section>
      )}

      {/* ── FOOTER ── */}
      <footer className="py-16 px-8 md:px-16">
        <div className="max-w-7xl mx-auto border-t border-white/5 pt-12">
          <div className="flex flex-col items-center gap-5 text-center">
            {photographerName && (
              <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 font-body">{photographerName}</p>
            )}
            {photographerProfile?.bio && (
              <p className="text-sm text-white/30 font-body max-w-xs leading-relaxed">{photographerProfile.bio}</p>
            )}

            {/* Social links */}
            {(photographerProfile?.instagram_url || photographerProfile?.tiktok_url || photographerProfile?.facebook_url || photographerProfile?.website_url) && (
              <div className="flex items-center gap-5 mt-1">
                {photographerProfile.instagram_url && (
                  <a
                    href={photographerProfile.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/20 hover:text-white/60 transition-colors"
                    aria-label="Instagram"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                  </a>
                )}
                {photographerProfile.tiktok_url && (
                  <a
                    href={photographerProfile.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/20 hover:text-white/60 transition-colors"
                    aria-label="TikTok"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/>
                    </svg>
                  </a>
                )}
                {photographerProfile.facebook_url && (
                  <a
                    href={photographerProfile.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/20 hover:text-white/60 transition-colors"
                    aria-label="Facebook"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                    </svg>
                  </a>
                )}
                {photographerProfile.website_url && (
                  <a
                    href={photographerProfile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/20 hover:text-white/60 transition-colors"
                    aria-label="Website"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Booking CTA */}
            {(photographerProfile?.website_url || photographerProfile?.contact_email) && (
              <a
                href={photographerProfile.website_url || `mailto:${photographerProfile.contact_email}`}
                target={photographerProfile.website_url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-white/20 hover:text-white/50 font-body border border-white/8 hover:border-white/20 px-5 py-2.5 transition-all"
              >
                Book a session
              </a>
            )}

            <p className="text-[9px] tracking-[0.3em] uppercase text-white/10 font-body mt-4">Delivered via ArtyDrop</p>
          </div>
        </div>
      </footer>
      </div>
      )}

    </div>
  )
}
