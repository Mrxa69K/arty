import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { headers } from 'next/headers'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    return new Response(`Webhook signature verification failed.`, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const plan = session.metadata?.plan
    
    await supabase.from('user_plans').upsert({
      user_id: user.id,
      plan,
      max_galleries: plan === 'studio' ? 100 : 5,
      storage_gb: plan === 'studio' ? 50 : 5,
      active: true,
      stripe_session_id: session.id
    })
  }

  return new Response('ok')
}
