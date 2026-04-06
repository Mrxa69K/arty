-- ARTYDROP DATABASE SETUP
-- Run this in Supabase Dashboard → SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS gallery_links CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS galleries CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  business_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Galleries table
CREATE TABLE galleries (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_name TEXT,
  event_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired')),
  cover_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  gallery_id TEXT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery Links table (for public access tokens)
CREATE TABLE gallery_links (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  gallery_id TEXT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT uuid_generate_v4()::text,
  password_hash TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  allow_download BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_links ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Galleries policies
CREATE POLICY "Users can view own galleries" ON galleries FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own galleries" ON galleries FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own galleries" ON galleries FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own galleries" ON galleries FOR DELETE USING (auth.uid() = owner_id);

-- Photos policies
CREATE POLICY "Users can view photos of own galleries" ON photos FOR SELECT 
  USING (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = photos.gallery_id AND galleries.owner_id = auth.uid()));
CREATE POLICY "Users can insert photos to own galleries" ON photos FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = photos.gallery_id AND galleries.owner_id = auth.uid()));
CREATE POLICY "Users can update photos of own galleries" ON photos FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = photos.gallery_id AND galleries.owner_id = auth.uid()));
CREATE POLICY "Users can delete photos of own galleries" ON photos FOR DELETE 
  USING (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = photos.gallery_id AND galleries.owner_id = auth.uid()));

-- Gallery links policies (owner access)
CREATE POLICY "Users can view links of own galleries" ON gallery_links FOR SELECT 
  USING (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = gallery_links.gallery_id AND galleries.owner_id = auth.uid()));
CREATE POLICY "Users can insert links to own galleries" ON gallery_links FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = gallery_links.gallery_id AND galleries.owner_id = auth.uid()));
CREATE POLICY "Users can update links of own galleries" ON gallery_links FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = gallery_links.gallery_id AND galleries.owner_id = auth.uid()));
CREATE POLICY "Users can delete links of own galleries" ON gallery_links FOR DELETE 
  USING (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = gallery_links.gallery_id AND galleries.owner_id = auth.uid()));

-- Public access policy for gallery_links (to check token validity - using service role in API)
-- This is handled by service role key in API routes

-- Indexes for performance
CREATE INDEX idx_galleries_owner ON galleries(owner_id);
CREATE INDEX idx_galleries_status ON galleries(status);
CREATE INDEX idx_photos_gallery ON photos(gallery_id);
CREATE INDEX idx_photos_sort ON photos(gallery_id, sort_order);
CREATE INDEX idx_gallery_links_token ON gallery_links(token);
CREATE INDEX idx_gallery_links_gallery ON gallery_links(gallery_id);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_timestamp ON profiles;
CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_galleries_timestamp ON galleries;
CREATE TRIGGER update_galleries_timestamp BEFORE UPDATE ON galleries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create storage bucket for photos (run separately in Storage section or via API)
-- Go to Storage → Create bucket named "photos" with public access
