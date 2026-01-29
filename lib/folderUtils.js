// Shared folder type configurations
// Used across the application for consistent folder display

import { Camera, Sparkles, Video, Files, FolderOpen } from 'lucide-react'

export const FOLDER_TYPES = {
  RAW: 'raw',
  EDITED: 'edited',
  VIDEOS: 'videos',
  OTHER: 'other',
  CUSTOM: 'custom'
}

export const FOLDER_ICONS = {
  raw: Camera,
  edited: Sparkles,
  videos: Video,
  other: Files,
  custom: FolderOpen
}

export const FOLDER_EMOJI_ICONS = {
  raw: '📸',
  edited: '✨',
  videos: '🎥',
  other: '📁',
  custom: '📂'
}

export const FOLDER_LABELS = {
  raw: 'Raw Photos',
  edited: 'Edited Photos',
  videos: 'Videos',
  other: 'Files',
  custom: 'Folder'
}

export const FOLDER_COLORS = {
  raw: {
    card: 'bg-blue-50 border-blue-200 hover:border-blue-300',
    badge: 'bg-blue-100 text-blue-800'
  },
  edited: {
    card: 'bg-purple-50 border-purple-200 hover:border-purple-300',
    badge: 'bg-purple-100 text-purple-800'
  },
  videos: {
    card: 'bg-green-50 border-green-200 hover:border-green-300',
    badge: 'bg-green-100 text-green-800'
  },
  other: {
    card: 'bg-gray-50 border-gray-200 hover:border-gray-300',
    badge: 'bg-gray-100 text-gray-800'
  },
  custom: {
    card: 'bg-orange-50 border-orange-200 hover:border-orange-300',
    badge: 'bg-orange-100 text-orange-800'
  }
}

// Helper function to get folder icon component
export function getFolderIcon(folderType) {
  const Icon = FOLDER_ICONS[folderType] || FolderOpen
  return Icon
}

// Helper function to get folder emoji icon
export function getFolderEmoji(folderType) {
  return FOLDER_EMOJI_ICONS[folderType] || '📂'
}

// Helper function to get folder label
export function getFolderLabel(folderType, customName = null) {
  if (folderType === 'custom' && customName) {
    return customName
  }
  return FOLDER_LABELS[folderType] || customName || 'Folder'
}

// Helper function to get folder colors
export function getFolderColors(folderType) {
  return FOLDER_COLORS[folderType] || FOLDER_COLORS.custom
}

// Default folders to create on gallery creation
export const DEFAULT_FOLDERS = [
  { name: '📸 Raw', folder_type: 'raw', sort_order: 1 },
  { name: '✨ Edited', folder_type: 'edited', sort_order: 2 },
  { name: '🎥 Videos', folder_type: 'videos', sort_order: 3 },
  { name: '📁 Other', folder_type: 'other', sort_order: 4 }
]
