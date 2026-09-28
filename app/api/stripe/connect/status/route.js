import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated. Please log in.' }, { status: 401 })
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated. Please log in.' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_onboarded_at')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_connect_account_id) {
      return NextResponse.json({ connected: false, chargesEnabled: false, payoutsEnabled: false })
    }

    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id)

    const updates = {
      stripe_connect_charges_enabled: account.charges_enabled,
      stripe_connect_payouts_enabled: account.payouts_enabled,
    }
    if (account.charges_enabled && account.payouts_enabled && !profile.stripe_connect_onboarded_at) {
      updates.stripe_connect_onboarded_at = new Date().toISOString()
    }

    await supabaseAdmin.from('profiles').update(updates).eq('id', user.id)

    return NextResponse.json({
      connected: true,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    })
  } catch (error) {
    console.error('Connect status error:', error)
    return NextResponse.json({ error: error.message || 'Failed to check Stripe status' }, { status: 500 })
  }
}
