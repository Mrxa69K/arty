import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import JSZip from 'jszip'

export async function POST(request, { params }) {
  try {
    const { token } = await params
    console.log('🟢 ZIP API: Received token:', token)

    let galleryId = null
    let galleryTitle = 'gallery'

    // FIRST: Check if token is a direct gallery ID
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('id, title, allow_download')  // ✅ Added allow_download
      .eq('id', token)
      .maybeSingle()

    if (gallery) {
      console.log('✅ ZIP: Found gallery by ID:', gallery.id)
      
      // ✅ CHECK PERMISSION HERE!
      if (!gallery.allow_download) {
        console.log('❌ ZIP: Downloads disabled for this gallery')
        return NextResponse.json({ error: 'Downloads are not allowed for this gallery' }, { status: 403 })
      }
      
      galleryId = gallery.id
      galleryTitle = gallery.title
    } else {
      // SECOND: Check if it's a gallery_links token
      console.log('⚠️ ZIP: Not a gallery ID, checking gallery_links...')
      const { data: link, error: linkError } = await supabaseAdmin
        .from('gallery_links')
        .select('gallery_id, allow_download, expires_at, galleries(title)')
        .eq('token', token)
        .maybeSingle()

      if (!link) {
        console.log('❌ ZIP: No gallery found')
        return NextResponse.json({ error: 'Invalid link' }, { status: 403 })
      }

      if (!link.allow_download) {
        return NextResponse.json({ error: 'Downloads not allowed' }, { status: 403 })
      }

      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Link expired' }, { status: 403 })
      }

      galleryId = link.gallery_id
      galleryTitle = link.galleries?.title || 'gallery'
    }

    console.log('📁 ZIP: Fetching photos for gallery:', galleryId)

    // Fetch photos
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('photos')
      .select('image_url, video_url, file_name, media_type')
      .eq('gallery_id', galleryId)
      .order('sort_order', { ascending: true })

    if (photosError || !photos || photos.length === 0) {
      console.log('❌ ZIP: No photos found:', photosError)
      return NextResponse.json({ error: 'No photos found' }, { status: 404 })
    }

    console.log(`✅ ZIP: Found ${photos.length} photos, creating ZIP...`)

    // Create ZIP with batching
    const zip = new JSZip()
    const BATCH_SIZE = 10

    for (let i = 0; i < photos.length; i += BATCH_SIZE) {
      const batch = photos.slice(i, i + BATCH_SIZE)
      console.log(`📦 ZIP: Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(photos.length / BATCH_SIZE)}`)
      
      await Promise.all(
        batch.map(async (photo, batchIndex) => {
          const globalIndex = i + batchIndex
          const url = photo.media_type === 'video' ? photo.video_url : photo.image_url
          
          if (!url) return
          
          try {
            const response = await fetch(url)
            if (!response.ok) return
            
            const blob = await response.blob()
            const arrayBuffer = await blob.arrayBuffer()
            
            const filename = photo.file_name || `${photo.media_type}-${String(globalIndex + 1).padStart(3, '0')}.${photo.media_type === 'video' ? 'mp4' : 'jpg'}`
            zip.file(filename, arrayBuffer)
          } catch (error) {
            console.error(`❌ ZIP: Failed to add ${photo.file_name}:`, error)
          }
        })
      )
    }

    console.log('📦 ZIP: Generating ZIP file...')

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    console.log(`✅ ZIP: Created! Size: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`)

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
    console.error('❌ ZIP: Generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create ZIP',
      details: error.message 
    }, { status: 500 })
  }
}
