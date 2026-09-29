'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, ArrowDownToLine, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-white/20 animate-spin" strokeWidth={1} />
      </div>
    }>
      <PurchaseSuccessInner />
    </Suspense>
  )
}

function PurchaseSuccessInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token
  const sessionId = searchParams.get('session_id')

  const [pending, setPending] = useState(true)
  const [error, setError] = useState(null)
  const [photos, setPhotos] = useState([])
  const [accessToken, setAccessToken] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)

  const resolve = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/purchase/${sessionId}`)
      const data = await res.json()
      if (res.status === 202 && data.pending) return // keep polling
      if (!res.ok) { setError(data.error || 'Something went wrong'); setPending(false); return }
      setPhotos(data.photos)
      setAccessToken(data.accessToken)
      setPending(false)
    } catch {
      setError('Something went wrong')
      setPending(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) { setError('Missing session'); setPending(false); return }
    resolve()
    let attempts = 0
    const interval = setInterval(() => {
      attempts += 1
      if (attempts > 8) { clearInterval(interval); return }
      resolve()
    }, 2000)
    return () => clearInterval(interval)
  }, [sessionId, resolve])

  const downloadPhoto = async (photo) => {
    setDownloadingId(photo.id)
    try {
      const res = await fetch(`/api/purchase/${sessionId}/download-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id, accessToken }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = photo.file_name || `photo-${photo.id}.jpg`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl) }, 100)
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloadingId(null)
    }
  }

  const downloadAllZip = async () => {
    setIsDownloadingZip(true)
    toast.info('Preparing your archive...')
    try {
      const res = await fetch(`/api/purchase/${sessionId}/download-zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = 'photos.zip'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl) }, 100)
      toast.success('Archive downloaded')
    } catch {
      toast.error('Failed to create archive')
    } finally {
      setIsDownloadingZip(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white">
      <header className="h-16 flex items-center px-8 md:px-16 border-b border-white/5">
        <a href="/" className="font-display text-white/50 hover:text-white text-sm tracking-wide transition-colors">
          ArtyDrop
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-8 md:px-16 py-20">
        {pending && (
          <div className="text-center py-16">
            <Loader2 className="w-5 h-5 text-white/40 mx-auto mb-6 animate-spin" strokeWidth={1.5} />
            <h1 className="font-display text-3xl text-white mb-4">Confirming your payment...</h1>
            <p className="text-sm text-white/40 font-body">This only takes a few seconds.</p>
          </div>
        )}

        {!pending && error && (
          <div className="text-center py-16">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 font-body mb-6">Something's off</p>
            <h1 className="font-display text-2xl text-white mb-4">{error}</h1>
            <a href={`/g/${token}`} className="text-sm text-white/40 hover:text-white font-body underline underline-offset-4">
              Back to the gallery
            </a>
          </div>
        )}

        {!pending && !error && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-[#7AB8CB]" strokeWidth={1.5} />
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 font-body">Payment confirmed</p>
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-white mb-8">
              {photos.length} photo{photos.length > 1 ? 's' : ''} ready to download
            </h1>

            {photos.length > 1 && (
              <button
                onClick={downloadAllZip}
                disabled={isDownloadingZip}
                className="mb-8 flex items-center gap-3 h-12 px-6 bg-white text-black text-sm font-body font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {isDownloadingZip ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <ArrowDownToLine className="w-4 h-4" strokeWidth={2} />}
                {isDownloadingZip ? 'Preparing archive...' : 'Download all as zip'}
              </button>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative overflow-hidden bg-white/5">
                  <img src={photo.preview_url} alt={photo.file_name || ''} className="w-full aspect-square object-cover" />
                  <button
                    onClick={() => downloadPhoto(photo)}
                    disabled={downloadingId === photo.id}
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center"
                  >
                    <div className="w-10 h-10 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {downloadingId === photo.id
                        ? <Loader2 className="w-4 h-4 text-black animate-spin" strokeWidth={2} />
                        : <ArrowDownToLine className="w-4 h-4 text-black" strokeWidth={2} />
                      }
                    </div>
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-white/25 font-body mt-10">
              We also emailed you this link — bookmark it if you want to come back later.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
