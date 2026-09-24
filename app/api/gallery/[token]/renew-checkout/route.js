import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request, { params }) {
  const { token } = await params

  try {
    const { data: linkData, error: linkError } = await supabaseAdmin
      .from('gallery_links')
      .select('id, gallery_id')
      .eq('token', token)
      .single()

    if (linkError || !linkData) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    const { data: galleryData } = await supabaseAdmin
      .from('galleries')
      .select('title, client_name')
      .eq('id', linkData.gallery_id)
      .single()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_RENEWAL,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/g/${token}?renewed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/g/${token}`,
      metadata: {
        type: 'gallery_renewal',
        token,
        gallery_id: linkData.gallery_id,
        link_id: linkData.id,
      },
      payment_intent_data: {
        description: `Gallery access renewal${galleryData?.client_name ? ` — ${galleryData.client_name}` : ''}`,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Renewal checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create renewal checkout' },
      { status: 500 }
    )
  }
}
