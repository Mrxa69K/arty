import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createPurchaseToken } from '@/lib/purchaseAccess'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request, { params }) {
  const { sessionId } = await params

  try {
    const { allowed } = await checkRateLimit(`verify-email:${sessionId}`, { maxAttempts: 10, windowMinutes: 15 })
    if (!allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data: purchases, error } = await supabaseAdmin
      .from('photo_purchases')
      .select('photo_id, buyer_email, photos(id, file_name, preview_url)')
      .eq('stripe_checkout_session_id', sessionId)

    if (error) {
      console.error('Failed to resolve purchase:', error)
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }

    if (!purchases || purchases.length === 0) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    const buyerEmail = purchases[0].buyer_email
    if (!buyerEmail || buyerEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match this purchase' }, { status: 401 })
    }

    return NextResponse.json({
      accessToken: createPurchaseToken(sessionId),
      photos: purchases.map((p) => ({
        id: p.photos.id,
        file_name: p.photos.file_name,
        preview_url: p.photos.preview_url,
      })),
    })
  } catch (error) {
    console.error('Purchase email verify error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
