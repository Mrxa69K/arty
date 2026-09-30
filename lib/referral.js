import { supabaseAdmin } from '@/lib/supabase-admin'
import { stripe } from '@/lib/stripe'

const STUDIO_REWARD_COUPON_ID = 'REFERRAL-STUDIO20'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I — avoids misread codes
const CODE_LENGTH = 6

function randomCode() {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

// Every photographer gets one on first request rather than at signup — keeps
// signup untouched and means existing accounts pick one up lazily too.
export async function getOrCreateReferralCode(userId) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .single()

  if (profile?.referral_code) return profile.referral_code

  // Collisions are astronomically unlikely at this alphabet/length, but retry
  // a few times against the unique constraint rather than trusting that.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ referral_code: code })
      .eq('id', userId)

    if (!error) return code
    if (error.code !== '23505') throw error // not a uniqueness conflict — real failure
  }

  throw new Error('Failed to generate a unique referral code')
}

// Called from the Stripe webhook right after a *real* paid checkout (payg/studio,
// never the €1 test plan) completes. Rewards the referrer, if any, exactly once —
// the atomic pending→rewarded claim below is what makes this safe against
// Stripe's at-least-once webhook delivery.
export async function rewardReferrerIfApplicable(referredUserId) {
  const { data: referredProfile } = await supabaseAdmin
    .from('profiles')
    .select('referred_by')
    .eq('id', referredUserId)
    .single()

  if (!referredProfile?.referred_by) return

  const { data: claimed } = await supabaseAdmin
    .from('referrals')
    .update({ status: 'rewarded', rewarded_at: new Date().toISOString() })
    .eq('referred_id', referredUserId)
    .eq('status', 'pending')
    .select()

  if (!claimed || claimed.length === 0) return // already rewarded, or no referral row at all

  const referrerId = referredProfile.referred_by

  const { data: referrer } = await supabaseAdmin
    .from('profiles')
    .select('plan_type, plan_status, stripe_customer_id, gallery_credits')
    .eq('id', referrerId)
    .single()

  if (!referrer) return

  let rewardType = 'free_gallery_credit'
  let rewardMessage = 'You got 1 free gallery credit.'

  const isActiveStudio = referrer.plan_type === 'studio' && referrer.plan_status === 'active' && referrer.stripe_customer_id
  const discountApplied = isActiveStudio && (await applyStudioDiscount(referrer.stripe_customer_id))

  if (discountApplied) {
    rewardType = 'discount_20_percent'
    rewardMessage = 'You got 20% off your next payment.'
  } else {
    await grantGalleryCredit(referrerId, referrer)
  }

  await supabaseAdmin.from('referrals').update({ reward_type: rewardType }).eq('referred_id', referredUserId)

  await supabaseAdmin.from('notifications').insert({
    user_id: referrerId,
    type: 'referral_rewarded',
    title: 'Your referral just became a customer!',
    body: rewardMessage,
    link_url: '/dashboard/settings',
  })
}

async function grantGalleryCredit(referrerId, referrer) {
  const updates = { gallery_credits: (referrer.gallery_credits || 0) + 1 }
  if (referrer.plan_status !== 'active') {
    updates.plan_type = 'payg'
    updates.plan_status = 'active'
  }
  await supabaseAdmin.from('profiles').update(updates).eq('id', referrerId)
}

async function applyStudioDiscount(stripeCustomerId) {
  const subscriptions = await stripe.subscriptions.list({ customer: stripeCustomerId, status: 'active', limit: 1 })
  const subscription = subscriptions.data[0]
  if (!subscription) return false

  await stripe.subscriptions.update(subscription.id, {
    discounts: [{ coupon: STUDIO_REWARD_COUPON_ID }],
  })
  return true
}
