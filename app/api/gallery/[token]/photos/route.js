import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

function validateSession(session, galleryToken) {
  try {
    const decoded = Buffer.from(session, 'base64').toString()
    const sigIndex = decoded.lastIndexOf(':')
    if (sigIndex === -1) return false
    const sig = decoded.slice(sigIndex + 1)
    const payload = decoded.slice(0, sigIndex)
    const tokenEnd = payload.indexOf(':')
    if (tokenEnd === -1) return false
    if (payload.slice(0, tokenEnd) !== galleryToken) return false
    const expectedSig = createHmac('sha256', SECRET).update(payload).digest('hex')
    const a = Buffer.from(sig), b = Buffer.from(expectedSig)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

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
      photos: photosData || [],
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