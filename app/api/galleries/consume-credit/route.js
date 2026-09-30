import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Deducting a PAYG gallery credit has to happen server-side via supabaseAdmin:
// profiles.gallery_credits is one of the columns the protect_billing_columns_profiles
// DB trigger locks down against client (authenticated-role) writes, so a direct
// client-side update to this column is silently reverted by that trigger —
// only service_role bypasses it.
//
// Uses an optimistic compare-and-swap (read gallery_credits, then update
// WHERE id=... AND gallery_credits=<the value just read>) so two concurrent
// requests can't both succeed off the same stale read — whichever loses the
// race gets zero rows affected and a 409, instead of silently double-spending
// one credit across two galleries.
export async function POST(request) {
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
      .select('plan_type, gallery_credits')
      .eq('id', user.id)
      .single()

    if (profile?.plan_type !== 'payg') {
      return NextResponse.json({ error: 'Not on a pay-as-you-go plan' }, { status: 400 })
    }

    const currentCredits = profile?.gallery_credits || 0
    if (currentCredits <= 0) {
      return NextResponse.json({ error: 'No gallery credits remaining' }, { status: 402 })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({ gallery_credits: currentCredits - 1 })
      .eq('id', user.id)
      .eq('gallery_credits', currentCredits)
      .select()

    if (error) {
      console.error('Credit consume error:', error)
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }

    if (!updated || updated.length === 0) {
      // Lost a race against a concurrent request reading the same stale count.
      return NextResponse.json({ error: 'Please try again' }, { status: 409 })
    }

    return NextResponse.json({ ok: true, remainingCredits: currentCredits - 1 })
  } catch (error) {
    console.error('Consume credit error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
