import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Vérifier le mot de passe si nécessaire
    if (link.password_hash && !session) {
      return handleCORS(NextResponse.json(
        { error: 'Password required' },
        { status: 401 }
      ))
    }

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