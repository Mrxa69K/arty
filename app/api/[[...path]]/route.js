import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Service role client for public gallery access (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, ctx) {
  // Dans Next 16, ctx.params est une Promise
  const { path = [] } = (await ctx.params) || {}
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Root endpoint
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Artydrop API' }))
    }

    // Public Gallery Verify Password - POST /api/gallery/[token]/verify
    if (path.length === 3 && path[0] === 'gallery' && path[2] === 'verify' && method === 'POST') {
      const token = path[1]
      const body = await request.json()
      return handlePasswordVerification(token, body.password)
    }

    // Public Gallery Photos - GET /api/gallery/[token]/photos
    if (path.length === 3 && path[0] === 'gallery' && path[2] === 'photos' && method === 'GET') {
      const token = path[1]
      const url = new URL(request.url)
      const sessionToken = url.searchParams.get('session')
      return handleGetGalleryPhotos(token, sessionToken)
    }

    // Public Gallery Access - GET /api/gallery/[token]
    if (path.length === 2 && path[0] === 'gallery' && method === 'GET') {
      const token = path[1]
      return handlePublicGalleryAccess(token)
    }

    // Route not found
    return handleCORS(
      NextResponse.json({ error: `Route ${route} not found` }, { status: 404 })
    )
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}



// Handle public gallery access
async function handlePublicGalleryAccess(token) {
  try {
    // Get gallery link by token
    const { data: link, error: linkError } = await supabaseAdmin
      .from('gallery_links')
      .select('*')
      .eq('token', token)
      .single()

    if (linkError || !link) {
      console.log('Gallery link not found for token:', token)
      return handleCORS(NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      ))
    }

    // Check if expired - compare with end of day
    if (link.expires_at) {
      const expirationDate = new Date(link.expires_at)
      // Set to end of day for the expiration date
      expirationDate.setHours(23, 59, 59, 999)
      if (expirationDate < new Date()) {
        return handleCORS(NextResponse.json(
          { error: 'Gallery has expired', expired: true },
          { status: 403 }
        ))
      }
    }

    // Get gallery details
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('id, title, client_name, event_date')
      .eq('id', link.gallery_id)
      .single()

    if (galleryError || !gallery) {
      console.log('Gallery not found for id:', link.gallery_id)
      return handleCORS(NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      ))
    }

    // Update view count
    await supabaseAdmin
      .from('gallery_links')
      .update({
        view_count: (link.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', link.id)

    return handleCORS(NextResponse.json({
      gallery: {
        title: gallery.title,
        client_name: gallery.client_name,
        event_date: gallery.event_date
      },
      requires_password: !!link.password_hash,
      allow_download: link.allow_download,
      expires_at: link.expires_at
    }))

  } catch (error) {
    console.error('Error accessing gallery:', error)
    return handleCORS(NextResponse.json(
      { error: 'Failed to access gallery' },
      { status: 500 }
    ))
  }
}

// Handle password verification
async function handlePasswordVerification(token, password) {
  try {
    const { data: link, error } = await supabaseAdmin
      .from('gallery_links')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !link) {
      return handleCORS(NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      ))
    }

    if (!link.password_hash) {
      // No password required, generate session token
      const sessionToken = Buffer.from(`${token}:${Date.now()}`).toString('base64')
      return handleCORS(NextResponse.json({ success: true, session: sessionToken }))
    }

    // Verify password
    const isValid = await bcrypt.compare(password, link.password_hash)

    if (!isValid) {
      return handleCORS(NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      ))
    }

    // Generate session token
    const sessionToken = Buffer.from(`${token}:${Date.now()}`).toString('base64')
    return handleCORS(NextResponse.json({ success: true, session: sessionToken }))

  } catch (error) {
    console.error('Error verifying password:', error)
    return handleCORS(NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    ))
  }
}

// Handle getting gallery photos
async function handleGetGalleryPhotos(token, sessionToken) {
  try {
    console.log('Fetching photos for token:', token, 'session:', sessionToken ? 'provided' : 'none')
    
    // Get gallery link
    const { data: link, error: linkError } = await supabaseAdmin
      .from('gallery_links')
      .select('*')
      .eq('token', token)
      .single()

    if (linkError || !link) {
      console.log('Link not found for photos request')
      return handleCORS(NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      ))
    }

    // Check if expired - compare with end of day
    if (link.expires_at) {
      const expirationDate = new Date(link.expires_at)
      // Set to end of day for the expiration date
      expirationDate.setHours(23, 59, 59, 999)
      if (expirationDate < new Date()) {
        return handleCORS(NextResponse.json(
          { error: 'Gallery has expired', expired: true },
          { status: 403 }
        ))
      }
    }

    // If password protected, verify session
    if (link.password_hash) {
      if (!sessionToken) {
        console.log('Password required but no session provided')
        return handleCORS(NextResponse.json(
          { error: 'Password required' },
          { status: 401 }
        ))
      }

      // Decode and validate session token
      try {
        const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8')
        const [tokenPart] = decoded.split(':')
        if (tokenPart !== token) {
          console.log('Session token mismatch')
          return handleCORS(NextResponse.json(
            { error: 'Invalid session' },
            { status: 401 }
          ))
        }
      } catch (e) {
        console.log('Failed to decode session token:', e)
        return handleCORS(NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        ))
      }
    }

    // Get photos
    console.log('Fetching photos for gallery_id:', link.gallery_id)
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('photos')
      .select('id, image_url, file_name')
      .eq('gallery_id', link.gallery_id)
      .order('sort_order', { ascending: true })

    if (photosError) {
      console.error('Error fetching photos:', photosError)
      throw photosError
    }

    console.log('Found photos:', photos?.length || 0)

    return handleCORS(NextResponse.json({
      photos: photos || [],
      allow_download: link.allow_download
    }))

  } catch (error) {
    console.error('Error getting photos:', error)
    return handleCORS(NextResponse.json(
      { error: 'Failed to get photos' },
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
