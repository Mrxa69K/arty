import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { resend } from '@/lib/resend'
import { emailTemplates } from '@/lib/emailTemplates'

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
      const buyerEmail = session.customer_details?.email || null

      const { data: insertedTip, error: tipError } = await supabaseAdmin
        .from('tips')
        .upsert(
          {
            stripe_checkout_session_id: session.id,
            gallery_id,
            gallery_link_id,
            photographer_id,
            buyer_email: buyerEmail,
            amount_cents: session.amount_total,
          },
          { onConflict: 'stripe_checkout_session_id', ignoreDuplicates: true }
        )
        .select()

      if (tipError) {
        console.error('Failed to record tip:', tipError)
        return new Response('DB error', { status: 500 })
      }

      console.log(`Tip recorded for photographer ${photographer_id}`)

      // Only notify on the actual insert, not on a webhook retry hitting the
      // unique-constraint no-op — .select() after an ignoreDuplicates upsert
      // returns no row when the conflict was silently skipped.
      if (insertedTip && insertedTip.length > 0) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('id', photographer_id)
          .single()

        const { data: gallery } = await supabaseAdmin
          .from('galleries')
          .select('title')
          .eq('id', gallery_id)
          .single()

        const amountFormatted = (session.amount_total / 100).toFixed(2)

        try {
          await supabaseAdmin.from('notifications').insert({
            user_id: photographer_id,
            type: 'tip_received',
            title: `You received a €${amountFormatted} tip`,
            body: gallery?.title ? `On "${gallery.title}"${buyerEmail ? ` from ${buyerEmail}` : ''}` : (buyerEmail || null),
            link_url: '/dashboard',
          })
        } catch (notifError) {
          console.error('Failed to create in-app notification (non-critical):', notifError)
        }

        try {
          if (profile?.email) {
            const { subject, html } = emailTemplates.tipReceived({
              photographerName: profile.full_name,
              amount: amountFormatted,
              galleryTitle: gallery?.title || null,
              buyerEmail,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            })
            await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL, to: profile.email, subject, html })
          }
        } catch (emailError) {
          console.error('Failed to send tip notification email (non-critical):', emailError)
        }
      }

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

      const { data: renewedGallery } = await supabaseAdmin
        .from('galleries')
        .update({ expires_at: newExpiresAt })
        .eq('id', gallery_id)
        .select('title, owner_id')
        .single()

      console.log(`Gallery ${gallery_id} (token ${token}) renewed until ${newExpiresAt}`)

      if (renewedGallery?.owner_id) {
        try {
          await supabaseAdmin.from('notifications').insert({
            user_id: renewedGallery.owner_id,
            type: 'gallery_renewed',
            title: `"${renewedGallery.title || 'A gallery'}" was renewed`,
            body: `Access extended for another ${days} days.`,
            link_url: `/dashboard/galleries/${gallery_id}`,
          })
        } catch (notifError) {
          console.error('Failed to create renewal notification (non-critical):', notifError)
        }
      }

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

      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: profile.id,
          type: 'subscription_cancelled',
          title: 'Your Studio plan was cancelled',
          body: 'Your subscription has ended and your plan is now inactive.',
          link_url: '/dashboard/settings',
        })
      } catch (notifError) {
        console.error('Failed to create cancellation notification (non-critical):', notifError)
      }
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object

    // Only subscription renewal failures are relevant here — this app has no
    // other invoice-based billing (one-time plans/tips/sales go through
    // Checkout Sessions directly, not invoices).
    if (invoice.subscription) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', invoice.customer)
        .single()

      if (profile) {
        try {
          await supabaseAdmin.from('notifications').insert({
            user_id: profile.id,
            type: 'payment_failed',
            title: 'Your subscription payment failed',
            body: 'Update your payment method to keep your Studio plan active.',
            link_url: '/dashboard/settings',
          })
        } catch (notifError) {
          console.error('Failed to create payment-failed notification (non-critical):', notifError)
        }
      }
    }
  }

  return new Response('ok')
}
