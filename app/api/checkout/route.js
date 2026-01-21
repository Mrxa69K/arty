import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process. env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env. SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // ✅ FIX 1: Get session from cookies (server-side)
    const cookieHeader = request.headers.get('cookie')
    
    if (!cookieHeader) {
      console.error('❌ No cookies found in request')
      return NextResponse. json(
        { error: 'Not authenticated. Please log in.' },
        { status: 401 }
      )
    }

    // ✅ FIX 2: Create Supabase client with cookies
    const supabaseAuth = createClient(
      process.env. NEXT_PUBLIC_SUPABASE_URL,
      process. env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            cookie: cookieHeader
          }
        }
      }
    )

    // ✅ FIX 3: Get authenticated user
    const { data: { user }, error:  authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Not authenticated. Please log in.' },
        { status: 401 }
      )
    }

    console.log('✅ Authenticated user:', user.id, user.email)

    // Get plan from request body
    const { plan } = await request.json()

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      )
    }

    console.log('🔵 Creating checkout for plan:', plan)

    // Get user's email
    const userEmail = user.email

    // Define price IDs based on plan
    const priceIds = {
      'trial-gallery': process.env.STRIPE_PRICE_TRIAL, // €1 trial
      'payg':  process.env.STRIPE_PRICE_PAYG,           // €4. 90 per gallery
      'studio': process.env.STRIPE_PRICE_STUDIO,       // €19/month
    }

    const priceId = priceIds[plan]

    if (!priceId) {
      return NextResponse.json(
        { error: `Invalid plan: ${plan}` },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: plan === 'studio' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard? session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/? canceled=true`,
      metadata: {
        user_id: user.id,
        plan: plan,
      },
   
    })

    console.log('✅ Checkout session created:', session.id)

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('❌ Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}