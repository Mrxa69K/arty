import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

// ✅ Utilise le service role pour bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request, { params }) {
  try {
    const { token } = await params
    console.log('🟢 API: Received token:', token)

    // ✅ Utilise supabaseAdmin au lieu de supabase
    const { data: link, error: linkError } = await supabaseAdmin
      .from('gallery_links')
      .select('*')
      .eq('token', token)
      .single()

    console.log('🟢 API: Link found:', !!link)

    if (linkError || !link) {
      console.error('❌ API: Link not found', linkError)
      return NextResponse.json({ error: 'Invalid link' }, { status: 403 })
    }

    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('*')
      .eq('id', link.gallery_id)
      .single()

    console.log('🟢 API: Gallery:', gallery?.title)

    if (!link.allow_download) {
      console.error('❌ API: Downloads not allowed')
      return NextResponse.json({ error: 'Downloads not allowed' }, { status: 403 })
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      console.error('❌ API: Link expired')
      return NextResponse.json({ error: 'Link expired' }, { status: 403 })
    }

    const galleryId = link.gallery_id
    console.log('🟢 API: Gallery ID:', galleryId)

    // ✅ Utilise supabaseAdmin pour les photos
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('photos')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('sort_order', { ascending: true })

    console.log('🟢 API: Photos error:', photosError)
    console.log('🟢 API: Photos count:', photos?.length)

    if (photosError || !photos || photos.length === 0) {
      console.error('❌ API: No photos found', photosError)
      return NextResponse.json({ error: 'No photos found' }, { status: 404 })
    }

    console.log('🟢 API: Found', photos.length, 'photos - Starting ZIP creation...')

// Create ZIP file
const zip = new JSZip()

// ✅ OPTIMISATION: Télécharge en parallèle (par batch de 10)
const BATCH_SIZE = 10

for (let i = 0; i < photos.length; i += BATCH_SIZE) {
  const batch = photos.slice(i, i + BATCH_SIZE)
  console.log(`🟢 API: Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(photos.length / BATCH_SIZE)}`)
  
  await Promise.all(
    batch.map(async (photo, batchIndex) => {
      const globalIndex = i + batchIndex
      
      try {
        const response = await fetch(photo.image_url)
        if (!response.ok) {
          console.error(`❌ API: Failed to fetch photo ${photo.id}`)
          return
        }
        
        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        
        const ext = photo.file_name.split('.').pop() || 'jpg'
        const filename = `${String(globalIndex + 1).padStart(3, '0')}_${photo.file_name}`
        
        zip.file(filename, arrayBuffer)
      } catch (error) {
        console.error(`❌ API: Failed to add photo ${photo.id}:`, error)
      }
    })
  )
}



    console.log('🟢 API: All photos added, generating ZIP...')

    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    console.log('🟢 API: ZIP generated successfully! Size:', zipBuffer.length, 'bytes')

    const galleryTitle = gallery?.title || 'gallery'
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
    console.error('❌ API: ZIP generation error:', error)
    return NextResponse.json({ error: 'Failed to create ZIP', details: error.message }, { status: 500 })
  }
}
