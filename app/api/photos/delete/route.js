import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET } from '@/lib/r2'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { photoId, galleryId } = await request.json()

  // Verify the gallery belongs to this user
  const { data: gallery } = await supabaseAdmin
    .from('galleries')
    .select('owner_id')
    .eq('id', galleryId)
    .single()

  if (!gallery || gallery.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if gallery is locked (any client has viewed it)
  const { data: links } = await supabaseAdmin
    .from('gallery_links')
    .select('view_count')
    .eq('gallery_id', galleryId)

  const isLocked = links?.some(link => (link.view_count || 0) >= 1)

  if (isLocked) {
    return NextResponse.json({
      error: 'locked',
      message: 'This gallery has been viewed by your client and is now locked. You cannot delete photos from a delivered gallery.'
    }, { status: 403 })
  }

  // Get photo to delete from R2
  const { data: photo } = await supabaseAdmin
    .from('photos')
    .select('storage_path')
    .eq('id', photoId)
    .single()

  // Delete from R2
  if (photo?.storage_path) {
    try {
      await r2Client.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: photo.storage_path,
      }))
    } catch (err) {
      console.error('R2 delete error:', err)
    }
  }

  // Delete from DB
  await supabaseAdmin.from('photos').delete().eq('id', photoId)

  return NextResponse.json({ success: true })
}
