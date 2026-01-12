import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { token } = await params

  try {
    // Check gallery exists
    const { data: galleryData, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('id')
      .eq('id', token)
      .single()

    if (galleryError) {
      console.error('Gallery query error:', galleryError)
      return NextResponse.json({ 
        error: 'Gallery query failed', 
        details: galleryError.message 
      }, { status: 500 })
    }

    if (!galleryData) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    console.log('Gallery found:', galleryData.id)

    // Fetch photos - NOW INCLUDING thumbnail_url
    const { data: photosData, error: photosError } = await supabaseAdmin
      .from('photos')
      .select('id, media_type, video_url, image_url, file_name, thumbnail_url, folder_id')
      .eq('gallery_id', galleryData.id)
      .order('sort_order', { ascending: true })
//this is very important
    if (photosError) {
      console.error('Photos query error:', photosError)
      return NextResponse.json({ 
        error: 'Photos query failed', 
        details: photosError.message 
      }, { status: 500 })
    }

    console.log(`Found ${photosData?.length || 0} photos for gallery ${galleryData.id}`)
    

    const photosWithThumbs = (photosData || []).map(photo => ({
      id: photo.id,
      media_type: photo.media_type || 'photo',
      video_url: photo.video_url,
      image_url: photo.image_url,
      thumbnail_url: photo.thumbnail_url || photo.image_url,
      file_name: photo.file_name || 'media.jpg',
       folder_id: photo.folder_id
    }))

    const { data: foldersData } = await supabaseAdmin
      .from('folders')
      .select('id, name, sort_order')
      .eq('gallery_id', galleryData.id)
      .order('sort_order', { ascending: true })


    return NextResponse.json({
      photos: photosWithThumbs,
      folders: foldersData || [],   
      allow_download: true
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message 
    }, { status: 500 })
  }
}
