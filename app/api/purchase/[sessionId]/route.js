import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

function maskEmail(email) {
  if (!email || !email.includes('@')) return null
  const [local, domain] = email.split('@')
  const masked = local.length <= 2 ? local[0] + '*' : local[0] + '*'.repeat(local.length - 2) + local.slice(-1)
  return `${masked}@${domain}`
}

// Deliberately does NOT hand out the download access token or photo list here.
// The Stripe checkout session_id lives in the browser URL/history indefinitely
// (no expiry on this page) and is trivial to accidentally leak — a screenshot,
// a pasted link, shared browser history. Requiring the buyer's own checkout
// email (via the separate verify-email route) as a second factor means the
// session_id alone isn't enough to unlock someone else's paid photos.
export async function GET(request, { params }) {
  const { sessionId } = await params

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid' || session.metadata?.type !== 'photo_purchase') {
      return NextResponse.json({ error: 'Invalid or unpaid session' }, { status: 400 })
    }

    const { data: purchases, error } = await supabaseAdmin
      .from('photo_purchases')
      .select('buyer_email')
      .eq('stripe_checkout_session_id', sessionId)
      .limit(1)

    if (error) {
      console.error('Failed to resolve purchase:', error)
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }

    // The webhook can genuinely lose the race against Stripe's own redirect
    // to success_url — tell the client to keep polling rather than error out.
    if (!purchases || purchases.length === 0) {
      return NextResponse.json({ pending: true }, { status: 202 })
    }

    return NextResponse.json({
      pending: false,
      requiresEmail: true,
      maskedEmail: maskEmail(purchases[0].buyer_email),
    })
  } catch (error) {
    console.error('Purchase resolve error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
