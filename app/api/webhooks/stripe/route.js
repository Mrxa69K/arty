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

  // Requires "Listen to events on connected accounts" enabled on this webhook
  // endpoint in the Stripe Dashboard — same endpoint/secret, no separate one needed.
  if (event.type === 'account.updated') {
    const account = event.data.object

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, stripe_connect_onboarded_at')
      .eq('stripe_connect_account_id', account.id)
      .single()

    if (profile) {
      const updates = {
        stripe_connect_charges_enabled: account.charges_enabled,
        stripe_connect_payouts_enabled: account.payouts_enabled,
      }
      if (account.charges_enabled && account.payouts_enabled && !profile.stripe_connect_onboarded_at) {
        updates.stripe_connect_onboarded_at = new Date().toISOString()
      }
      await supabaseAdmin.from('profiles').update(updates).eq('id', profile.id)
    }

    return new Response('ok')
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    if (session.metadata?.type === 'tip') {
      const { gallery_id, gallery_link_id, photographer_id } = session.metadata

      const { error: tipError } = await supabaseAdmin
        .from('tips')
        .upsert(
          {
            stripe_checkout_session_id: session.id,
            gallery_id,
            gallery_link_id,
            photographer_id,
            buyer_email: session.customer_details?.email || null,
            amount_cents: session.amount_total,
          },
          { onConflict: 'stripe_checkout_session_id', ignoreDuplicates: true }
        )

      if (tipError) {
        console.error('Failed to record tip:', tipError)
        return new Response('DB error', { status: 500 })
      }

      console.log(`Tip recorded for photographer ${photographer_id}`)
      return new Response('ok')
    }

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
