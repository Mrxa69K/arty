import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import JSZip from 'jszip'

export async function POST(request, { params }) {
  try {
    const { galleryId } = await params  // ✅ Proper param destructuring
    console.log('🟢 API: Received galleryId:', galleryId)

    let finalGalleryId = null
    let galleryTitle = 'gallery'

    // FIRST: Check if it's a direct gallery ID (dashboard access)
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('id, title, allow_download')  // ✅ Added allow_download
      .eq('id', galleryId)
      .maybeSingle()

    if (gallery) {
      console.log('✅ Found gallery by ID:', gallery.id)
      
      // ✅ CHECK PERMISSION for direct gallery access
      if (!gallery.allow_download) {
        console.log('❌ Downloads not allowed for this gallery')
        return NextResponse.json({ error: 'Downloads are disabled for this gallery' }, { status: 403 })
      }
      
      finalGalleryId = gallery.id
      galleryTitle = gallery.title
    } else {
      // SECOND: Check if it's a gallery_links token
      console.log('⚠️ Not a gallery ID, checking gallery_links...')
      const { data: link, error: linkError } = await supabaseAdmin
        .from('gallery_links')
        .select('gallery_id, allow_download, expires_at, galleries(title)')
        .eq('token', galleryId)
        .maybeSingle()

      if (!link) {
        console.log('❌ No gallery_links found either')
        return NextResponse.json({ error: 'Invalid link' }, { status: 403 })
      }

      // Check permissions
      if (!link.allow_download) {
        return NextResponse.json({ error: 'Downloads not allowed' }, { status: 403 })
      }

      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Link expired' }, { status: 403 })
      }

      finalGalleryId = link.gallery_id
      galleryTitle = link.galleries?.title || 'gallery'
    }

    console.log('📁 Fetching photos for gallery:', finalGalleryId)

    // Fetch photos
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('photos')
      .select('image_url, video_url, file_name, media_type')
      .eq('gallery_id', finalGalleryId)
      .order('sort_order', { ascending: true })

    if (photosError || !photos || photos.length === 0) {
      console.log('❌ No photos found:', photosError)
      return NextResponse.json({ error: 'No photos found' }, { status: 404 })
    }

    console.log(`✅ Found ${photos.length} photos, creating ZIP...`)

    // Create ZIP
    const zip = new JSZip()
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      const url = photo.media_type === 'video' ? photo.video_url : photo.image_url
      
      if (!url) continue
      
      try {
        const response = await fetch(url)
        if (!response.ok) continue
        
        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        
        const filename = photo.file_name || `${photo.media_type}-${String(i + 1).padStart(3, '0')}.${photo.media_type === 'video' ? 'mp4' : 'jpg'}`
        zip.file(filename, arrayBuffer)
      } catch (error) {
        console.error(`Failed to add ${photo.file_name}:`, error)
      }
    }

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    console.log(`✅ ZIP created: ${zipBuffer.length} bytes`)

    const filename = `${galleryTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('❌ ZIP generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create ZIP',
      details: error.message 
    }, { status: 500 })
  }
}
