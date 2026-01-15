import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'
import { hasUsedTestPlan } from '@/lib/planValidation'

const PLAN_PRICE_MAP = {
  test: process.env.STRIPE_PRICE_TEST, // ✅ Add this to your .env
  payg: process.env.STRIPE_PRICE_PAYG,
  studio: process.env.STRIPE_PRICE_STUDIO,
}

export async function POST(request) {
  let plan = null
  
  try {
    // ✅ Get authenticated user
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated. Please log in.' 
      }, { status: 401 })
    }

    const body = await request.json()
    plan = body.plan

    console.log('Checkout plan:', plan)
    console.log('Price ID:', PLAN_PRICE_MAP[plan])

    if (!plan || !PLAN_PRICE_MAP[plan]) {
      console.error('Invalid plan:', plan)
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // ✅ Get or create Stripe customer
    let stripeCustomerId = null
    
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, used_test_plan')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      })
      stripeCustomerId = customer.id

      // Save to database
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

    // ✅ SECURITY: Check if test plan already used
    if (plan === 'test') {
      const { used, reason } = await hasUsedTestPlan(user.id, stripeCustomerId)
      
      if (used) {
        console.log('Test plan already used:', reason)
        return NextResponse.json({ 
          error: reason || 'You have already used the €1 test plan. Please choose Pay-as-you-go or Studio plan.' 
        }, { status: 403 })
      }
    }

    // Define baseUrl
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    console.log('Base URL:', baseUrl)

    // Determine mode based on plan
    const mode = plan === 'studio' ? 'subscription' : 'payment'

    // ✅ Configuration with customer ID and metadata
    const sessionConfig = {
      mode: mode,
      customer: stripeCustomerId, // ✅ Link to existing customer
      line_items: [
        {
          price: PLAN_PRICE_MAP[plan],
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?success=true&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?canceled=true`,
      metadata: {
        plan_type: plan,
        user_id: user.id,
      },
      // ✅ Allow promo codes (optional)
      allow_promotion_codes: true,
    }

    // ✅ Add subscription-specific params
    if (mode === 'subscription') {
      sessionConfig.payment_method_types = ['card']
      sessionConfig.billing_address_collection = 'auto'
    }

    console.log('Session config:', sessionConfig)

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', {
      message: err.message,
      type: err.type,
      code: err.code,
      plan: plan,
      priceId: PLAN_PRICE_MAP?.[plan],
      stack: err.stack,
    })
    return NextResponse.json(
      { error: 'Unable to create checkout session', details: err.message },
      { status: 500 },
    )
  }
}
