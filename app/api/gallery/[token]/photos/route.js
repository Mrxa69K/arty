import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateSession } from '@/lib/gallerySession'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}

export async function GET(request, { params }) {
  const { token } = await params
  const { searchParams } = new URL(request.url)
  const session = searchParams.get('session')

  try {
    // Récupérer le lien de galerie
    const { data: link, error: linkError } = await supabaseAdmin
      .from('gallery_links')
      .select('*')
      .eq('token', token)
      .single()

    if (linkError || !link) {
      return handleCORS(NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      ))
    }

    // Vérifier l'expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return handleCORS(NextResponse.json(
        { error: 'Gallery expired', expired: true },
        { status: 403 }
      ))
    }

    // Validate session for password-protected galleries
    if (link.password_hash) {
      if (!session || !validateSession(session, token)) {
        return handleCORS(NextResponse.json(
          { error: 'Password required' },
          { status: 401 }
        ))
      }
    }

    // Incrémenter view_count
    await supabaseAdmin
      .from('gallery_links')
      .update({
        view_count: (link.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('token', token)

    // Récupérer les photos
    const { data: photosData, error: photosError } = await supabaseAdmin
      .from('photos')
      .select('*')
      .eq('gallery_id', link.gallery_id)
      .order('sort_order', { ascending: true })

    if (photosError) {
      console.error('Error fetching photos:', photosError)
      return handleCORS(NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      ))
    }

    // When downloads aren't allowed (sale-mode galleries, or any gallery the
    // photographer simply hasn't opened up yet), never send the clean
    // full-resolution original in this public listing — only the watermarked
    // preview. Downloads are still allowed to include it: that flag means
    // "this content is free to take" by definition, so there's nothing to
    // protect there. Without this, the raw image_url/video_url sat in every
    // response regardless of allow_download, fully bypassing the per-photo
    // paywall for anyone reading the network response.
    const photos = link.allow_download === false
      ? (photosData || []).map(({ image_url, video_url, ...rest }) => rest)
      : (photosData || [])

    // 🆕 Récupérer les folders
    const { data: folders, error: foldersError } = await supabaseAdmin
      .from('folders')
      .select('*')
      .eq('gallery_id', link.gallery_id)
      .order('sort_order', { ascending: true })

    if (foldersError) {
      console.error('Error fetching folders:', foldersError)
    }

    return handleCORS(NextResponse.json({
      photos,
      folders: folders || [],
      allow_download: link.allow_download !== false
    }))

  } catch (error) {
    console.error('Gallery photos API error:', error)
    return handleCORS(NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    ))
  }
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}