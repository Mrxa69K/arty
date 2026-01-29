'use client'

import { Images, ChevronRight } from 'lucide-react'

export function FolderCard({ folder, photoCount, previewPhotos, onClick }) {
  const folderIcons = {
    raw: '📸',
    edited: '✨',
    videos: '🎥',
    other: '📁',
    custom: '📂'
  }
  
  const folderLabels = {
    raw: 'Raw Photos',
    edited: 'Edited Photos',
    videos: 'Videos',
    other: 'Files'
  }

  const icon = folderIcons[folder.folder_type] || '📂'
  const label = folderLabels[folder.folder_type] || folder.name

  if (photoCount === 0) return null

  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm border border-black/10 hover:border-black/20 hover:shadow-2xl transition-all duration-300 p-4 text-left hover:scale-[1.02]"
    >
      {/* Preview Images */}
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
            <Images className="w-12 h-12 text-black/20" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Folder Type Badge */}
        <div className="absolute top-2 left-2 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-medium text-black/80 shadow-sm">
          {icon} {folderLabels[folder.folder_type] || 'Folder'}
        </div>
      </div>

      {/* Folder Info */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-black/90 truncate mb-0.5 group-hover:text-black transition-colors">
            {icon} {label}
          </h4>
          <p className="text-xs text-black/50 flex items-center gap-1">
            <Images className="w-3 h-3" />
            {photoCount} {photoCount === 1 ? 'file' : 'files'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-black/5 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-all ml-3">
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  )
}