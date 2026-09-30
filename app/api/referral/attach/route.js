import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Called once right after signup completes. Public/unauthenticated by design —
// the new user's own session isn't fully established client-side yet at this
// point, and the payload only ever links two ids that already exist.
export async function POST(request) {
  try {
    const { code, referredUserId } = await request.json()
    if (!code || !referredUserId) {
      return NextResponse.json({ ok: false })
    }

    const { data: referrer } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('referral_code', code.toUpperCase())
      .single()

    if (!referrer || referrer.id === referredUserId) {
      return NextResponse.json({ ok: false })
    }

    await supabaseAdmin
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', referredUserId)
      .is('referred_by', null)

    await supabaseAdmin
      .from('referrals')
      .upsert(
        { referrer_id: referrer.id, referred_id: referredUserId, status: 'pending' },
        { onConflict: 'referred_id', ignoreDuplicates: true }
      )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Referral attach error:', error)
    return NextResponse.json({ ok: false })
  }
}
