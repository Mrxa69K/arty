import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { applyDiagonalWatermark } from '@/lib/watermark'

export async function POST(request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { photoId } = await request.json()
  if (!photoId) {
    return NextResponse.json({ error: 'Missing photoId' }, { status: 400 })
  }

  const { data: photo, error: photoError } = await supabaseAdmin
    .from('photos')
    .select('id, gallery_id, image_url, storage_path, media_type, galleries(owner_id)')
    .eq('id', photoId)
    .single()

  if (photoError || !photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }

  if (photo.galleries?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (photo.media_type === 'video' || !photo.image_url) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const watermarkText = profile?.full_name || 'ArtyDrop'

    const sourceRes = await fetch(photo.image_url)
    if (!sourceRes.ok) throw new Error('Failed to fetch source image')
    const sourceBuffer = Buffer.from(await sourceRes.arrayBuffer())

    const watermarkedBuffer = await applyDiagonalWatermark(sourceBuffer, watermarkText)

    const basePath = (photo.storage_path || `${photo.gallery_id}/${photoId}`).replace(/\.[^/.]+$/, '')
    const previewKey = `${basePath}-preview.jpg`

    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: previewKey,
      Body: watermarkedBuffer,
      ContentType: 'image/jpeg',
    }))

    const previewUrl = `${R2_PUBLIC_URL}/${previewKey}`

    await supabaseAdmin
      .from('photos')
      .update({ preview_url: previewUrl })
      .eq('id', photoId)

    return NextResponse.json({ ok: true, previewUrl })
  } catch (error) {
    console.error('Watermark generation error:', error)
    return NextResponse.json({ error: 'Failed to generate watermark', debug: error.message, stack: error.stack }, { status: 500 })
  }
}
