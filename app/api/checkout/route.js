import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { hasUsedTestPlan } from '@/lib/planValidation'
import { checkRateLimit } from '@/lib/rateLimit'

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

    const { allowed } = await checkRateLimit(`checkout:${user.id}`, { maxAttempts: 15, windowMinutes: 10 })
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

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

    const { data: profileForCheckout } = await supabase
      .from('profiles')
      .select('stripe_customer_id, referred_by, used_referral_discount')
      .eq('id', user.id)
      .single()

    if (normalizedPlan === 'test') {
      const { used, reason } = await hasUsedTestPlan(user.id, profileForCheckout?.stripe_customer_id)
      if (used) {
        return NextResponse.json({ error: reason || 'Test plan already used' }, { status: 403 })
      }
    }

    // First real paid checkout for a referred signup gets 20% off automatically —
    // no code to enter. Never for the €1 test plan, and only once per account.
    //
    // Claimed atomically right here at session-creation time (not read-only —
    // an actual conditional UPDATE), not left for the webhook to flag after
    // payment. A plain read-then-decide here let someone open two checkout
    // sessions concurrently before either completed payment and have both
    // honor the discount. The trade-off: if this exact session is abandoned
    // without ever being paid, the discount is still spent — an accepted,
    // minor cost for closing the concurrent-claim race without needing a
    // second Stripe webhook subscription (checkout.session.expired) to
    // release it back.
    let applyReferralDiscount = false
    if ((normalizedPlan === 'payg' || normalizedPlan === 'studio') && profileForCheckout?.referred_by) {
      const { data: claimed } = await supabase
        .from('profiles')
        .update({ used_referral_discount: true })
        .eq('id', user.id)
        .eq('used_referral_discount', false)
        .select()

      applyReferralDiscount = !!claimed && claimed.length > 0
    }

    // 2-week launch promo on Studio's first invoice, mutually exclusive with
    // the referral discount (never stacked — same 20% either way). The coupon
    // itself also expires in Stripe (redeem_by), this date check just keeps
    // the checkout from even trying once the campaign is over.
    const LAUNCH_PROMO_ENDS = new Date('2026-10-17T00:00:00Z')
    const applyLaunchPromo = !applyReferralDiscount && normalizedPlan === 'studio' && Date.now() < LAUNCH_PROMO_ENDS.getTime()

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
      // Lets customers type a manual promotion code (e.g. collab/influencer
      // codes) at Stripe's hosted checkout. Disabled whenever we're already
      // auto-applying a discount — Stripe forbids combining the two.
      ...(!applyReferralDiscount && !applyLaunchPromo ? { allow_promotion_codes: true } : {}),
      ...(applyReferralDiscount ? { discounts: [{ coupon: 'REFERRAL-STUDIO20' }] } : {}),
      ...(applyLaunchPromo ? { discounts: [{ coupon: 'LAUNCH20' }] } : {}),
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