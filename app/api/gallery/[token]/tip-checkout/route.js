import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MIN_TIP_CENTS = 100 // €1

export async function POST(request, { params }) {
  const { token } = await params

  try {
    const { amountCents } = await request.json()

    if (!Number.isInteger(amountCents) || amountCents < MIN_TIP_CENTS) {
      return NextResponse.json({ error: 'Invalid tip amount' }, { status: 400 })
    }

    const { data: link, error: linkError } = await supabaseAdmin
      .from('gallery_links')
      .select('id, gallery_id, allow_download')
      .eq('token', token)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (link.allow_download === false) {
      return NextResponse.json({ error: 'Tips are only available on open galleries' }, { status: 400 })
    }

    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('title, owner_id')
      .eq('id', link.gallery_id)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    const { data: photographer, error: photographerError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, stripe_connect_account_id, stripe_connect_payouts_enabled')
      .eq('id', gallery.owner_id)
      .single()

    if (photographerError || !photographer?.stripe_connect_payouts_enabled) {
      return NextResponse.json({ error: 'This photographer isn’t set up to receive tips yet' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: amountCents,
            product_data: {
              name: `Tip for ${photographer.full_name || 'the photographer'}`,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        transfer_data: { destination: photographer.stripe_connect_account_id },
        description: `Tip for ${gallery.title}`,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/g/${token}?tipped=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/g/${token}`,
      metadata: {
        type: 'tip',
        token,
        gallery_id: link.gallery_id,
        gallery_link_id: link.id,
        photographer_id: gallery.owner_id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Tip checkout error:', error)
    return NextResponse.json({ error: error.message || 'Failed to start tip checkout' }, { status: 500 })
  }
}
