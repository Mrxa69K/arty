import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getOrCreateReferralCode } from '@/lib/referral'

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

    const code = await getOrCreateReferralCode(user.id)

    const { data: referrals } = await supabaseAdmin
      .from('referrals')
      .select('status')
      .eq('referrer_id', user.id)

    const invited = referrals?.length || 0
    const rewarded = referrals?.filter((r) => r.status === 'rewarded').length || 0

    return NextResponse.json({
      code,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${code}`,
      invited,
      rewarded,
    })
  } catch (error) {
    console.error('Referral fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to load referral info' }, { status: 500 })
  }
}
