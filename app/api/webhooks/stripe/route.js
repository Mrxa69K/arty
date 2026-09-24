import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    if (session.metadata?.type === 'gallery_renewal') {
      const { link_id, gallery_id, token } = session.metadata

      if (!link_id || !gallery_id) {
        console.error('Missing link_id or gallery_id in renewal session metadata')
        return new Response('Missing metadata', { status: 400 })
      }

      const days = parseInt(process.env.GALLERY_RENEWAL_DAYS || '30', 10)
      const newExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

      await supabaseAdmin
        .from('gallery_links')
        .update({ expires_at: newExpiresAt })
        .eq('id', link_id)

      await supabaseAdmin
        .from('galleries')
        .update({ expires_at: newExpiresAt })
        .eq('id', gallery_id)

      console.log(`Gallery ${gallery_id} (token ${token}) renewed until ${newExpiresAt}`)
      return new Response('ok')
    }

    const userId = session.metadata?.user_id || session.client_reference_id
    const plan = session.metadata?.plan

    if (!userId || !plan) {
      console.error('Missing user_id or plan in session metadata')
      return new Response('Missing metadata', { status: 400 })
    }

    let planExpiresAt = null
    if (plan === 'test') {
      planExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    } else if (plan === 'payg') {
      planExpiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
    }

    if (plan === 'payg') {
      // PAYG: increment gallery credits by 1 per payment
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('gallery_credits, plan_type')
        .eq('id', userId)
        .single()

      const currentCredits = profile?.gallery_credits || 0

      await supabaseAdmin
        .from('profiles')
        .update({
          plan_type: 'payg',
          plan_status: 'active',
          gallery_credits: currentCredits + 1,
          stripe_customer_id: session.customer || null,
        })
        .eq('id', userId)
    } else {
      const updates = {
        plan_type: plan,
        plan_status: 'active',
        plan_expires_at: planExpiresAt,
        stripe_customer_id: session.customer || null,
      }

      if (plan === 'test') {
        updates.used_test_plan = true
      }

      await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
    }


    console.log(`Plan "${plan}" activated for user ${userId}`)
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    const customerId = subscription.customer

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (profile) {
      await supabaseAdmin
        .from('profiles')
        .update({ plan_status: 'inactive', plan_type: 'none', plan_expires_at: null })
        .eq('id', profile.id)

      console.log(`Studio plan cancelled for user ${profile.id}`)
    }
  }

  return new Response('ok')
}
