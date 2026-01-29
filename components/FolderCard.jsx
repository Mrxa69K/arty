'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Folder } from 'lucide-react'
import { 
  FOLDER_ICONS, 
  FOLDER_LABELS, 
  FOLDER_COLORS, 
  getFolderIcon, 
  getFolderLabel, 
  getFolderColors 
} from '@/lib/folderUtils'

export function FolderCard({ folder, photoCount = 0, previewPhotos = [], onClick }) {
  const Icon = getFolderIcon(folder?.folder_type)
  const label = getFolderLabel(folder?.folder_type, folder?.name)
  const colors = getFolderColors(folder?.folder_type)

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 ${colors.card}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${colors.badge}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{label}</h3>
                <p className="text-sm text-muted-foreground">
                  {photoCount} {photoCount === 1 ? 'file' : 'files'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={colors.badge}>
              {folder?.folder_type || 'custom'}
            </Badge>
          </div>

          {/* Preview Grid */}
          {previewPhotos.length > 0 && (
            <div className="w-full">
              {previewPhotos.length === 1 && (
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={previewPhotos[0].thumbnail_url || previewPhotos[0].image_url} 
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {previewPhotos.length === 2 && (
                <div className="grid grid-cols-2 gap-2">
                  {previewPhotos.map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={photo.thumbnail_url || photo.image_url} 
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {previewPhotos.length >= 3 && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 col-span-2">
                    <img 
                      src={previewPhotos[0].thumbnail_url || previewPhotos[0].image_url} 
                      alt="Preview 1"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {previewPhotos.slice(1, 3).map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={photo.thumbnail_url || photo.image_url} 
                        alt={`Preview ${idx + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {previewPhotos.length === 0 && (
            <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-400">
                <Folder className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">No files yet</p>
              </div>
            </div>
          )}

          {/* Description */}
          {folder?.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {folder.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
