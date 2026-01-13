import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

const PLAN_PRICE_MAP = {
  payg: process.env.STRIPE_PRICE_PAYG,
  studio: process.env.STRIPE_PRICE_STUDIO,
  'trial-gallery': process.env.STRIPE_PRICE_TRIAL_GALLERY,
}

export async function POST(request) {
  let plan = null
  
  try {
    const body = await request.json()
    plan = body.plan

    console.log('Checkout plan:', plan)
    console.log('Price ID:', PLAN_PRICE_MAP[plan])

    if (!plan || !PLAN_PRICE_MAP[plan]) {
      console.error('Invalid plan:', plan)
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Define baseUrl
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    console.log('Base URL:', baseUrl)

    // Determine mode based on plan
    const mode = plan === 'studio' ? 'subscription' : 'payment'

    // ✅ Configuration différente selon le mode
    const sessionConfig = {
      mode: mode,
      line_items: [
        {
          price: PLAN_PRICE_MAP[plan],
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?success=true&plan=${plan}`,
      cancel_url: `${baseUrl}/?canceled=true`,
    }

    // ✅ AJOUT: Si c'est une subscription, ajouter ces paramètres
    if (mode === 'subscription') {
      sessionConfig.payment_method_types = ['card']
      sessionConfig.billing_address_collection = 'auto'
      // Optionnel: ajouter customer email si user connecté
    }

    console.log('Session config:', sessionConfig) // Debug

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', {
      message: err.message,
      type: err.type,
      code: err.code,
      plan: plan,
      priceId: PLAN_PRICE_MAP?.[plan],
      stack: err.stack, // ✅ Plus de détails
    })
    return NextResponse.json(
      { error: 'Unable to create checkout session', details: err.message },
      { status: 500 },
    )
  }
}
