import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validatePurchaseToken } from '@/lib/purchaseAccess'
import { fetchMedia } from '@/lib/safeMediaFetch'
import { sanitizeFilename } from '@/lib/sanitizeFilename'

export async function POST(request, { params }) {
  const { sessionId } = await params

  try {
    const { photoId, accessToken } = await request.json()

    if (!photoId || !accessToken || !validatePurchaseToken(accessToken, sessionId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only a photo id actually recorded as paid-for in THIS session is ever
    // honored — never trust a client-supplied id directly (IDOR guard).
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('photo_purchases')
      .select('photo_id, photos(image_url, file_name)')
      .eq('stripe_checkout_session_id', sessionId)
      .eq('photo_id', photoId)
      .single()

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Photo not found in this purchase' }, { status: 404 })
    }

    const url = purchase.photos.image_url
    if (!url) {
      return NextResponse.json({ error: 'File unavailable' }, { status: 404 })
    }

    const response = await fetchMedia(url)
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
    }

    const arrayBuffer = await response.arrayBuffer()
    const filename = sanitizeFilename(purchase.photos.file_name || `photo-${photoId}.jpg`)

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Purchase download error:', error)
    return NextResponse.json({ error: 'Failed to download photo' }, { status: 500 })
  }
}
