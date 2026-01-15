import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request, { params }) {
  try {
    const { token } = await params
    const { photoId } = await request.json()

    // Check if it's a gallery_links token
    const { data: link, error: linkError } = await supabaseAdmin
      .from('gallery_links')
      .select('gallery_id, allow_download, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (!link) {
      // Check if it's a direct gallery ID
      const { data: gallery, error: galleryError } = await supabaseAdmin
        .from('galleries')
        .select('id, allow_download')
        .eq('id', token)
        .maybeSingle()

      if (!gallery) {
        return NextResponse.json({ error: 'Invalid link' }, { status: 403 })
      }

      if (!gallery.allow_download) {
        return NextResponse.json({ error: 'Downloads not allowed' }, { status: 403 })
      }
    } else {
      // Check permissions for gallery_links
      if (!link.allow_download) {
        return NextResponse.json({ error: 'Downloads not allowed' }, { status: 403 })
      }

      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Link expired' }, { status: 403 })
      }
    }

    // Get photo
    const { data: photo, error: photoError } = await supabaseAdmin
      .from('photos')
      .select('image_url, video_url, file_name, media_type')
      .eq('id', photoId)
      .single()

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    const url = photo.media_type === 'video' ? photo.video_url : photo.image_url
    
    // Fetch the file from storage
    const response = await fetch(url)
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
    }

    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()

    const filename = photo.file_name || `${photo.media_type}-${photoId}.${photo.media_type === 'video' ? 'mp4' : 'jpg'}`

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': photo.media_type === 'video' ? 'video/mp4' : 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('❌ Photo download error:', error)
    return NextResponse.json({ 
      error: 'Failed to download photo',
      details: error.message 
    }, { status: 500 })
  }
}
