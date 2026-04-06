import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import JSZip from 'jszip'

export async function POST(request, { params }) {
  try {
    const { galleryId } = await params

    // Authenticate the requesting user
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the gallery belongs to this user
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('id, title')
      .eq('id', galleryId)
      .eq('owner_id', user.id)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    const { data: photos, error: photosError } = await supabaseAdmin
      .from('photos')
      .select('image_url, video_url, file_name, media_type')
      .eq('gallery_id', gallery.id)
      .order('sort_order', { ascending: true })

    if (photosError || !photos || photos.length === 0) {
      return NextResponse.json({ error: 'No photos found' }, { status: 404 })
    }

    const zip = new JSZip()
    const galleryFolder = zip.folder(gallery.title || 'Gallery')
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
            galleryFolder.file(filename, buf)
          } catch { /* skip failed file */ }
        })
      )
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    const filename = `${(gallery.title || 'gallery').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`

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
