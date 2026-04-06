import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import JSZip from 'jszip'

export async function POST(request, { params }) {
  try {
    const { token } = await params

    const { data: link, error: linkError } = await supabaseAdmin
      .from('gallery_links')
      .select('gallery_id, allow_download, expires_at, galleries(title)')
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

    const { data: photos, error: photosError } = await supabaseAdmin
      .from('photos')
      .select('image_url, video_url, file_name, media_type')
      .eq('gallery_id', link.gallery_id)
      .order('sort_order', { ascending: true })

    if (photosError || !photos || photos.length === 0) {
      return NextResponse.json({ error: 'No photos found' }, { status: 404 })
    }

    const zip = new JSZip()
    const BATCH_SIZE = 10

    for (let i = 0; i < photos.length; i += BATCH_SIZE) {
      await Promise.all(
        photos.slice(i, i + BATCH_SIZE).map(async (photo, j) => {
          const url = photo.media_type === 'video' ? photo.video_url : photo.image_url
          if (!url) return
          try {
            const res = await fetch(url)
            if (!res.ok) return
            const buf = await res.arrayBuffer()
            const filename = photo.file_name || `photo-${String(i + j + 1).padStart(3, '0')}.${photo.media_type === 'video' ? 'mp4' : 'jpg'}`
            zip.file(filename, buf)
          } catch { /* skip failed file */ }
        })
      )
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    const galleryTitle = link.galleries?.title || 'gallery'
    const filename = `${galleryTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create archive' }, { status: 500 })
  }
}
