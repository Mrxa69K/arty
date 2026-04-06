'use client'

import { Images, ChevronRight, Folder } from 'lucide-react'

export function FolderCard({ folder, photoCount, previewPhotos, onClick }) {
  const folderTypeLabels = {
    raw: 'Raw Photos',
    edited: 'Edited Photos',
    videos: 'Videos',
    other: 'Files'
  }

  const label = folderTypeLabels[folder.folder_type] || folder.name

  if (photoCount === 0) return null

  return (
    <button
      onClick={onClick}
      className="group relative rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm border border-black-200/50 hover:border-black-300 hover:shadow-2xl transition-all duration-500 p-5 text-left hover:scale-[1.02]"
    >
      {/* Preview Images */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-black-50 to-black-100/50 mb-4 shadow-md">
        {previewPhotos.length === 1 ? (
          <img
            src={previewPhotos[0].thumbnail_url || previewPhotos[0].image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : previewPhotos.length === 2 ? (
          <div className="grid grid-cols-2 gap-1 h-full">
            {previewPhotos.map((photo, idx) => (
              <img
                key={idx}
                src={photo.thumbnail_url || photo.image_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ))}
          </div>
        ) : previewPhotos.length >= 3 ? (
          <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">
            <img
              src={previewPhotos[0].thumbnail_url || previewPhotos[0].image_url}
              alt=""
              className="col-span-2 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            {previewPhotos.slice(1, 3).map((photo, idx) => (
              <img
                key={idx}
                src={photo.thumbnail_url || photo.image_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Images className="w-12 h-12 text-black-800/30" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black-900/30 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Folder Type Badge */}
        <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-medium text-black-900 shadow-md border border-black-200/30">
          {folderTypeLabels[folder.folder_type] || 'Collection'}
        </div>
      </div>

      {/* Folder Info */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-serif text-lg text-black-900 truncate mb-1 group-hover:text-black-950 transition-colors">
            {label}
          </h4>
          <p className="text-xs text-black-800/60 flex items-center gap-1.5">
            <Images className="w-3.5 h-3.5" />
            {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-black-100 to-black-50 border border-black-200/50 group-hover:from-black-800 group-hover:to-black-900 group-hover:text-black flex items-center justify-center transition-all duration-300 shadow-sm">
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </button>
  )
}