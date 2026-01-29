-- Migration to add folders table with folder_type support
-- Run this in Supabase Dashboard → SQL Editor if folders table doesn't exist yet
-- NOTE: According to the problem statement, the folders table should already exist in the database

-- Create folders table if it doesn't exist
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  gallery_id TEXT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  folder_type TEXT DEFAULT 'custom' CHECK (folder_type IN ('raw', 'edited', 'videos', 'other', 'custom')),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Create policies for folders (drop existing if any)
DROP POLICY IF EXISTS "Users can manage folders of own galleries" ON folders;
CREATE POLICY "Users can manage folders of own galleries" ON folders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM galleries 
    WHERE galleries.id = folders.gallery_id 
    AND galleries.owner_id = auth.uid()
  ));

-- Add folder_id to photos table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE photos ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add media_type to photos table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE photos ADD COLUMN media_type TEXT DEFAULT 'photo' CHECK (media_type IN ('photo', 'video'));
  END IF;
END $$;

-- Add video_url to photos table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE photos ADD COLUMN video_url TEXT;
  END IF;
END $$;

-- Add thumbnail_url to photos table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE photos ADD COLUMN thumbnail_url TEXT;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_gallery ON folders(gallery_id);
CREATE INDEX IF NOT EXISTS idx_folders_sort ON folders(gallery_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_photos_folder ON photos(folder_id);

-- Create trigger for updated_at on folders
DROP TRIGGER IF EXISTS update_folders_timestamp ON folders;
CREATE TRIGGER update_folders_timestamp 
  BEFORE UPDATE ON folders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Folders table migration completed successfully!';
END $$;
