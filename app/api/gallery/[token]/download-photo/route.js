import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request, { params }) {
  try {
    const { token } = await params
    const { photoId } = await request.json()

    if (!photoId) {
      return NextResponse.json({ error: 'Missing photoId' }, { status: 400 })
    }

    const { data: link, error: linkError } = await supabaseAdmin
      .from('gallery_links')
      .select('gallery_id, allow_download, expires_at')
      .eq('token', token)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 403 })
    }

    if (!link.allow_download) {
      return NextResponse.json({ error: 'Downloads not allowed' }, { status: 403 })
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 403 })
    }

    // Scope photo to this gallery — prevents cross-gallery photo theft
    const { data: photo, error: photoError } = await supabaseAdmin
      .from('photos')
      .select('image_url, video_url, file_name, media_type')
      .eq('id', photoId)
      .eq('gallery_id', link.gallery_id)
      .single()

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    const url = photo.media_type === 'video' ? photo.video_url : photo.image_url
    const response = await fetch(url)
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
    }

    const arrayBuffer = await response.arrayBuffer()
    const filename = photo.file_name || `photo-${photoId}.jpg`

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': photo.media_type === 'video' ? 'video/mp4' : 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to download photo' }, { status: 500 })
  }
}
