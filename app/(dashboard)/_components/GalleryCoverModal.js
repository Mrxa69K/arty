'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function GalleryCoverModal({ open, onClose, galleryId, photos, currentCover, onCoverUpdated }) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

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

      // Upload to Cloudflare R2
      const fileExt = file.name.split('.').pop()
      const fileName = `${galleryId}/cover-${Date.now()}.${fileExt}`

      const fd = new FormData()
      fd.append('file', file)
      fd.append('fileName', fileName)
      const uploadRes = await fetch('/api/upload/presign', { method: 'POST', body: fd })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { publicUrl } = await uploadRes.json()

      // Update gallery
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
          <DialogTitle>Choose Gallery Cover</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Custom */}
          <div>
            <label className="block text-sm font-medium mb-3">Upload Custom Cover</label>
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">Click to upload</span>
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
            <label className="block text-sm font-medium mb-3">Or Select from Gallery Photos</label>
            {photos && photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handleSelectFromGallery(photo.url)}
                    disabled={isUploading}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      currentCover === photo.url
                        ? 'border-purple-500 ring-2 ring-purple-500'
                        : 'border-transparent hover:border-purple-300'
                    } disabled:opacity-50`}
                  >
                    <img
                      src={photo.url}
                      alt="Gallery photo"
                      className="w-full h-full object-cover"
                    />
                    {currentCover === photo.url && (
                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No photos in this gallery yet. Upload photos first.
              </p>
            )}
          </div>

          {isUploading && (
            <div className="flex items-center justify-center gap-2 text-purple-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Updating cover...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}