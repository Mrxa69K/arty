import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

const PLAN_PRICE_MAP = {
  payg: process.env.STRIPE_PRICE_PAYG,
  studio: process.env.STRIPE_PRICE_STUDIO,
  'trial-gallery': process.env.STRIPE_PRICE_TRIAL_GALLERY,
}

export async function POST(request) {
  let plan = null  // ← déclaré ici pour être accessible dans catch
  
  try {
    const body = await request.json()
    plan = body.plan

    console.log('Checkout plan:', plan)
    console.log('Price ID:', PLAN_PRICE_MAP[plan])

    if (!plan || !PLAN_PRICE_MAP[plan]) {
      console.error('Invalid plan:', plan)
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',  // ou 'subscription' si Studio
      line_items: [
        {
          price: PLAN_PRICE_MAP[plan],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', {
      message: err.message,
      type: err.type,
      code: err.code,
      plan: plan,  // ← maintenant accessible
      priceId: PLAN_PRICE_MAP?.[plan],
    })
    return NextResponse.json(
      { error: 'Unable to create checkout session', details: err.message },
      { status: 500 },
    )
  }
}
