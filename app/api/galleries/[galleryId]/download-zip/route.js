import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import JSZip from 'jszip'

export async function POST(request, { params }) {
  try {
    const { token } = params

    // Get gallery link and gallery info via token
    const { data: link, error: linkError } = await supabase
      .from('gallery_links')
      .select('*, galleries(*)')
      .eq('token', token)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 403 })
    }

    if (!link.allow_download) {
      return NextResponse.json({ error: 'Downloads not allowed' }, { status: 403 })
    }

    // Check if link is expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 403 })
    }

    const galleryId = link.gallery_id

    // Fetch all photos for this gallery
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('sort_order', { ascending: true })

    if (photosError || !photos || photos.length === 0) {
      return NextResponse.json({ error: 'No photos found' }, { status: 404 })
    }

    // Create ZIP file
    const zip = new JSZip()
    
    // Download all photos and add to ZIP
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      
      try {
        // Fetch the image
        const response = await fetch(photo.image_url)
        if (!response.ok) continue
        
        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        
        // Generate filename (preserve extension)
        const ext = photo.file_name.split('.').pop() || 'jpg'
        const filename = `${String(i + 1).padStart(3, '0')}_${photo.file_name}`
        
        zip.file(filename, arrayBuffer)
      } catch (error) {
        console.error(`Failed to add photo ${photo.id}:`, error)
        // Continue with other photos
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    // Return ZIP file
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
  } catch (error) {
    console.error('ZIP generation error:', error)
    return NextResponse.json({ error: 'Failed to create ZIP' }, { status: 500 })
  }
}
