import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // ✅ Get Authorization header (from Bearer token)
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header found')
      return NextResponse.json(
        { error: 'Not authenticated. Please log in.' },
        { status: 401 }
      )
    }

    // ✅ Create Supabase client with the Authorization header
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // ✅ Get authenticated user from token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

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

    // ✅ Define price IDs - Accept BOTH 'test' AND 'trial-gallery' 
    const priceIds = {
      'test': process.env.STRIPE_PRICE_TRIAL,          // From PlanSelectionModal
      'trial-gallery': process.env.STRIPE_PRICE_TRIAL, // From homepage
      'payg': process.env.STRIPE_PRICE_PAYG,           // €4.90 per gallery
      'studio': process.env.STRIPE_PRICE_STUDIO,       // €19/month
    }

    const priceId = priceIds[plan]

    if (!priceId) {
      return NextResponse.json(
        { error: `Invalid plan: ${plan}. Available plans: test, trial-gallery, payg, studio` },
        { status: 400 }
      )
    }

    // Normalize plan name for metadata (use 'test' consistently)
    const normalizedPlan = plan === 'trial-gallery' ? 'test' : plan

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
      mode: normalizedPlan === 'studio' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
      metadata: {
        user_id: user.id,
        plan: normalizedPlan, // Store normalized plan name
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