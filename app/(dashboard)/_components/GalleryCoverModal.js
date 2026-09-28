'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function GalleryCoverModal({ open, onClose, galleryId, photos, currentCover, onCoverUpdated }) {
  const [isUploading, setIsUploading] = useState(false)

  const stillPhotos = (photos || []).filter((p) => p.media_type !== 'video' && p.image_url)

  const handleSelectFromGallery = async (photoUrl) => {
    try {
      setIsUploading(true)

      const { error } = await supabase
        .from('galleries')
        .update({ cover_image_url: photoUrl })
        .eq('id', galleryId)

      if (error) throw error

      toast.success('Cover updated!')
      onCoverUpdated(photoUrl)
      onClose()
    } catch (error) {
      console.error('Error updating cover:', error)
      toast.error('Failed to update cover')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadCustom = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setIsUploading(true)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${galleryId}/cover-${Date.now()}.${fileExt}`

      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, contentType: file.type }),
      })
      if (!presignRes.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl, publicUrl } = await presignRes.json()

      const r2Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!r2Res.ok) throw new Error('Upload to storage failed')

      const { error: updateError } = await supabase
        .from('galleries')
        .update({ cover_image_url: publicUrl })
        .eq('id', galleryId)

      if (updateError) throw updateError

      toast.success('Custom cover uploaded!')
      onCoverUpdated(publicUrl)
      onClose()
    } catch (error) {
      console.error('Error uploading cover:', error)
      toast.error('Failed to upload cover')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Choose Gallery Cover</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Custom */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">Upload Custom Cover</label>
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-sm cursor-pointer hover:border-gold/50 transition-colors bg-white/5">
              <div className="flex flex-col items-center gap-2">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-white/40" strokeWidth={1.5} />
                )}
                <span className="text-sm text-white/50">Click to upload</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadCustom}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Select from Gallery */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">Or Select from Gallery Photos</label>
            {stillPhotos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {stillPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handleSelectFromGallery(photo.image_url)}
                    disabled={isUploading}
                    className={`relative aspect-square rounded-sm overflow-hidden border-2 transition-all ${
                      currentCover === photo.image_url
                        ? 'border-gold ring-2 ring-gold/50'
                        : 'border-transparent hover:border-gold/40'
                    } disabled:opacity-50`}
                  >
                    <img
                      src={photo.image_url}
                      alt="Gallery photo"
                      className="w-full h-full object-cover"
                    />
                    {currentCover === photo.image_url && (
                      <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40 text-center py-8">
                No photos in this gallery yet. Upload photos first.
              </p>
            )}
          </div>

          {isUploading && (
            <div className="flex items-center justify-center gap-2 text-gold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Updating cover...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
