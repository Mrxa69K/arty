import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateSession } from '@/lib/gallerySession'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request, { params }) {
  try {
    const { token } = await params
    const { photoId, session, liked } = await request.json()

    if (!photoId || typeof liked !== 'boolean') {
      return NextResponse.json({ error: 'Missing photoId or liked' }, { status: 400 })
    }

    const { allowed } = await checkRateLimit(`like-photo:${getClientIp(request)}`, { maxAttempts: 120, windowMinutes: 10 })
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { data: link, error: linkError } = await supabaseAdmin
      .from('gallery_links')
      .select('id, gallery_id, expires_at, password_hash')
      .eq('token', token)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 403 })
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 403 })
    }

    if (link.password_hash && (!session || !validateSession(session, token))) {
      return NextResponse.json({ error: 'Password required' }, { status: 401 })
    }

    const { data: newCount, error } = await supabaseAdmin.rpc('increment_photo_like', {
      p_photo_id: photoId,
      p_gallery_id: link.gallery_id,
      p_delta: liked ? 1 : -1,
    })

    if (error) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    return NextResponse.json({ likeCount: newCount })
  } catch {
    return NextResponse.json({ error: 'Failed to update like' }, { status: 500 })
  }
}
