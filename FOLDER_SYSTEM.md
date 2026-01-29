# Folder System - Implementation Guide

## 🎯 Overview

This document describes the folder system implementation for Arty, a photography gallery application. The system allows photographers to organize photos into folders (Raw, Edited, Videos, Other, Custom) and provides an elegant interface for both photographers and clients.

## 📋 Features

### For Photographers
- ✅ **Auto-created default folders** when creating a new gallery:
  - 📸 Raw - For unedited photos
  - ✨ Edited - For retouched/final photos
  - 🎥 Videos - For video files
  - 📁 Other - For miscellaneous files
- ✅ **Custom folder creation** - Create additional folders as needed
- ✅ **Visual organization** - Icons and colors for each folder type
- ✅ **File counts** - See how many files are in each folder
- ✅ **Drag & drop** - Move photos between folders easily
- ✅ **Folder filtering** - View photos from specific folders

### For Clients
- ✅ **Professional folder cards** - Beautiful cards with previews
- ✅ **Type-based icons** - Visual indicators for folder types
- ✅ **Breadcrumb navigation** - Easy navigation within folders
- ✅ **Preview grids** - See 1-4 photo previews per folder
- ✅ **Responsive design** - Works on mobile, tablet, and desktop

## 🗂️ Database Schema

### Folders Table
```sql
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  gallery_id TEXT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  folder_type TEXT DEFAULT 'custom' CHECK (folder_type IN ('raw', 'edited', 'videos', 'other', 'custom')),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Photos Table (Updated)
```sql
ALTER TABLE photos ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE photos ADD COLUMN media_type TEXT DEFAULT 'photo';
ALTER TABLE photos ADD COLUMN video_url TEXT;
ALTER TABLE photos ADD COLUMN thumbnail_url TEXT;
```

## 📂 Folder Types

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| `raw` | 📸 Camera | Blue | Unedited/original photos |
| `edited` | ✨ Sparkles | Purple | Retouched/final photos |
| `videos` | 🎥 Video | Green | Video files |
| `other` | 📁 Files | Gray | Miscellaneous files |
| `custom` | 📂 FolderOpen | Orange | Custom user-created folders |

## 🔄 Workflow

### Creating a Gallery
1. Photographer creates a new gallery
2. System automatically creates 4 default folders
3. Photographer can create additional custom folders if needed

### Organizing Photos
1. Photographer uploads photos to the gallery
2. Photos can be assigned to folders via "Move to..." dropdown
3. File counts update automatically
4. Folders can be filtered to show only specific photos

### Client View
1. Client receives gallery link
2. Sees beautiful folder cards with previews
3. Clicks a folder to view its contents
4. Uses breadcrumb to navigate back

## 🎨 UI Components

### FolderCard Component
```jsx
<FolderCard 
  folder={folderObject}
  photoCount={24}
  previewPhotos={[...]}
  onClick={() => handleFolderClick()}
/>
```

**Props:**
- `folder` - Folder object with id, name, folder_type
- `photoCount` - Number of files in the folder
- `previewPhotos` - Array of photo objects for preview
- `onClick` - Function to call when card is clicked

## 🚀 API Endpoints

### GET `/api/gallery/[token]/photos`
Returns photos and folders for a gallery.

**Response:**
```json
{
  "photos": [
    {
      "id": "...",
      "image_url": "...",
      "thumbnail_url": "...",
      "folder_id": "...",
      "media_type": "photo"
    }
  ],
  "folders": [
    {
      "id": "...",
      "name": "📸 Raw",
      "folder_type": "raw",
      "sort_order": 1
    }
  ],
  "allow_download": true
}
```

## 🔒 Security

### Row Level Security (RLS)
- Photographers can only manage folders in their own galleries
- Clients can view folders through public links (handled by API)

### Policies
```sql
CREATE POLICY "Users can manage folders of own galleries" ON folders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM galleries 
    WHERE galleries.id = folders.gallery_id 
    AND galleries.owner_id = auth.uid()
  ));
```

## 📝 Code Files

### Modified Files
1. `app/(dashboard)/dashboard/galleries/new/page.js` - Auto-create default folders
2. `app/(dashboard)/dashboard/galleries/[id]/page.js` - Photographer folder management
3. `app/g/[token]/page.js` - Client folder display
4. `app/api/gallery/[token]/photos/route.js` - API with folder support

### New Files
1. `components/FolderCard.jsx` - Reusable folder card component
2. `FOLDERS_MIGRATION.sql` - Database migration script

## 🧪 Testing

### Manual Testing Checklist
- [ ] Create new gallery → Verify 4 default folders appear
- [ ] Upload photos → Assign to different folders
- [ ] View photographer dashboard → Check icons and counts
- [ ] Move photos between folders → Verify dropdown shows counts
- [ ] Create custom folder → Check it appears with correct icon
- [ ] Delete folder → Verify photos are preserved
- [ ] View as client → Check folder cards display correctly
- [ ] Click folder → Verify only folder photos shown
- [ ] Use breadcrumb → Verify navigation works
- [ ] Test on mobile → Verify responsive design

## 🐛 Troubleshooting

### Folders Not Creating Automatically
- Check if `FOLDERS_MIGRATION.sql` was run in Supabase
- Verify Supabase connection is working
- Check console for error messages

### Icons Not Showing
- Verify lucide-react is installed: `npm install lucide-react`
- Check imports in component files

### Photos Not Moving to Folders
- Check RLS policies are set correctly
- Verify user is authenticated
- Check browser console for errors

## 🔮 Future Enhancements

Potential improvements for the future:
- Folder renaming
- Folder reordering (drag & drop)
- Bulk photo operations
- Folder descriptions
- Folder sharing (share specific folder only)
- Smart auto-assignment (videos → Videos folder)
- Folder templates
- Nested folders/subfolders

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Lucide Icons](https://lucide.dev)
- [Tailwind CSS](https://tailwindcss.com)

## 👥 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the implementation code
3. Check Supabase logs
4. Contact the development team

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-29  
**Status:** ✅ Implemented
