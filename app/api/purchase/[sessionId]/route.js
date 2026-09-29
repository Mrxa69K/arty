import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createPurchaseToken } from '@/lib/purchaseAccess'

export async function GET(request, { params }) {
  const { sessionId } = await params

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid' || session.metadata?.type !== 'photo_purchase') {
      return NextResponse.json({ error: 'Invalid or unpaid session' }, { status: 400 })
    }

    const { data: purchases, error } = await supabaseAdmin
      .from('photo_purchases')
      .select('photo_id, photos(id, file_name, preview_url, image_url)')
      .eq('stripe_checkout_session_id', sessionId)

    if (error) {
      console.error('Failed to resolve purchase:', error)
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }

    // The webhook can genuinely lose the race against Stripe's own redirect
    // to success_url — tell the client to keep polling rather than error out.
    if (!purchases || purchases.length === 0) {
      return NextResponse.json({ pending: true }, { status: 202 })
    }

    return NextResponse.json({
      pending: false,
      accessToken: createPurchaseToken(sessionId),
      photos: purchases.map((p) => ({
        id: p.photos.id,
        file_name: p.photos.file_name,
        // Preview only here — the clean original is only ever streamed
        // through the download route itself, never exposed as a direct URL.
        preview_url: p.photos.preview_url || p.photos.image_url,
      })),
    })
  } catch (error) {
    console.error('Purchase resolve error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
