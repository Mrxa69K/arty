import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { computeApplicationFeeCents } from '@/lib/stripeConnect'

export async function POST(request, { params }) {
  const { token } = await params

  try {
    const { photoIds } = await request.json()

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one photo' }, { status: 400 })
    }

    const { data: link, error: linkError } = await supabaseAdmin
      .from('gallery_links')
      .select('id, gallery_id, expires_at')
      .eq('token', token)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This gallery link has expired' }, { status: 410 })
    }

    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('title, owner_id, sale_mode_enabled, price_per_photo_cents, expires_at')
      .eq('id', link.gallery_id)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This gallery has expired' }, { status: 410 })
    }

    if (!gallery.sale_mode_enabled || !gallery.price_per_photo_cents) {
      return NextResponse.json({ error: 'This gallery is not selling individual photos' }, { status: 400 })
    }

    const { data: photographer, error: photographerError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_payouts_enabled')
      .eq('id', gallery.owner_id)
      .single()

    if (photographerError || !photographer?.stripe_connect_payouts_enabled) {
      return NextResponse.json({ error: 'This photographer isn’t set up to sell photos yet' }, { status: 400 })
    }

    // Never trust the client's photo id list — only ids that actually belong
    // to this gallery are honored (also de-dupes accidental repeats).
    const uniqueIds = [...new Set(photoIds)]
    const { data: validPhotos, error: photosError } = await supabaseAdmin
      .from('photos')
      .select('id')
      .eq('gallery_id', link.gallery_id)
      .in('id', uniqueIds)

    if (photosError || !validPhotos || validPhotos.length === 0) {
      return NextResponse.json({ error: 'No valid photos selected' }, { status: 400 })
    }

    const validIds = validPhotos.map((p) => p.id)
    const pricePerPhotoCents = gallery.price_per_photo_cents
    const subtotalCents = validIds.length * pricePerPhotoCents
    const applicationFeeCents = computeApplicationFeeCents(subtotalCents)

    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_purchases')
      .insert({
        gallery_id: link.gallery_id,
        gallery_link_id: link.id,
        photographer_id: gallery.owner_id,
        stripe_connected_account_id: photographer.stripe_connect_account_id,
        photo_ids: validIds,
        price_per_photo_cents: pricePerPhotoCents,
        subtotal_cents: subtotalCents,
        application_fee_cents: applicationFeeCents,
      })
      .select()
      .single()

    if (pendingError || !pending) {
      console.error('Failed to create pending purchase:', pendingError)
      return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: pricePerPhotoCents,
            product_data: {
              name: `${gallery.title || 'Gallery'} (${validIds.length} photo${validIds.length > 1 ? 's' : ''})`,
            },
          },
          quantity: validIds.length,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeCents,
        transfer_data: { destination: photographer.stripe_connect_account_id },
        description: `Photo purchase: ${gallery.title || 'Gallery'}`,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/g/${token}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/g/${token}`,
      metadata: {
        type: 'photo_purchase',
        token,
        pending_purchase_id: pending.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Purchase checkout error:', error)
    return NextResponse.json({ error: error.message || 'Failed to start checkout' }, { status: 500 })
  }
}
