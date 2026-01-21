import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process. env.STRIPE_SECRET_KEY)

export async function POST(request) {
  console.log('🔵 Checkout API called')
  
  try {
    // ✅ Get Authorization header
    const authHeader = request.headers.get('authorization')
    console.log('🔵 Auth header present:', !!authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header found')
      return NextResponse. json(
        { error: 'Not authenticated. Please log in.' },
        { status: 401 }
      )
    }

    const token = authHeader. replace('Bearer ', '')
    console.log('🔵 Token extracted:', token. substring(0, 20) + '...')

    // ✅ Create Supabase client
    const supabase = createClient(
      process. env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // ✅ Verify token and get user
    const { data:  { user }, error:  authError } = await supabase.auth.getUser(token)

    if (authError) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication failed. Please log in again.' },
        { status: 401 }
      )
    }

    if (!user) {
      console.error('❌ No user found from token')
      return NextResponse. json(
        { error: 'User not found. Please log in.' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id, user.email)

    // ✅ Get plan from request
    const { plan } = await request.json()

    if (!plan) {
      return NextResponse. json(
        { error: 'Plan is required' },
        { status: 400 }
      )
    }

    console.log('🔵 Creating checkout for plan:', plan)

    // ✅ Define price IDs
    const priceIds = {
      'trial-gallery': process.env.STRIPE_PRICE_TRIAL,
      'payg':  process.env.STRIPE_PRICE_PAYG,
      'studio': process.env. STRIPE_PRICE_STUDIO,
    }

    const priceId = priceIds[plan]

    if (!priceId) {
      console.error('❌ Invalid plan:', plan)
      return NextResponse.json(
        { error: `Invalid plan: ${plan}` },
        { status: 400 }
      )
    }

    console.log('🔵 Using price ID:', priceId)

    // ✅ Determine mode (subscription vs one-time payment)
    const isSubscription = plan === 'studio'

    // ✅ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ?  'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard? session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
      metadata: {
        user_id:  user.id,
        plan: plan,
      },
      // Add subscription metadata if applicable
      ...(isSubscription && {
        subscription_data: {
          metadata: {
            user_id: user.id,
            plan: plan
          }
        }
      })
    })

    console.log('✅ Stripe session created:', session.id)

    return NextResponse.json({ 
      url: session.url,
      session_id: session.id 
    })

  } catch (error) {
    console.error('❌ Checkout error:', error)
    return NextResponse. json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}