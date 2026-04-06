import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'

export const PLAN_LIMITS = {
  none: {
    name: 'No Plan',
    maxGalleries: 0,
    maxPhotosPerGallery: 0,
    durationDays: null,
    price: 0
  },
  test: {
    name: '€1 Test',
    maxGalleries: 1,
    maxPhotosPerGallery: 10,
    durationDays: 3,
    price: 1,
    currency: 'eur',
    oneTimeOnly: true
  },
  payg: {
    name: 'Pay as you go',
    maxGalleries: null, // unlimited
    maxPhotosPerGallery: null, // unlimited
    durationDays: null,
    pricePerGallery: 4.90,
    currency: 'eur'
  },
  studio: {
    name: 'Studio',
    maxGalleries: null, // unlimited
    maxPhotosPerGallery: null, // unlimited
    durationDays: 30,
    price: 19,
    currency: 'eur',
    recurring: true
  }
}

// Check if user can create a new gallery
export async function canUserCreateGallery(userId) {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('plan_type, plan_status, plan_expires_at')
      .eq('id', userId)
      .single()

    if (profileError) {
      return { allowed: false, reason: 'Failed to fetch user profile' }
    }

    // Check if plan is active
    if (!profile.plan_type || profile.plan_type === 'none' || profile.plan_status !== 'active') {
      return { allowed: false, reason: 'No active plan. Please choose a plan to continue.' }
    }

    const plan = PLAN_LIMITS[profile.plan_type]

    // Check if plan expired
    if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) {
      return { allowed: false, reason: 'Your plan has expired. Please upgrade to continue.' }
    }

    // If unlimited galleries (payg, studio), allow
    if (plan.maxGalleries === null) {
      return { allowed: true }
    }

    // Count user's galleries
    const { count, error: countError } = await supabaseAdmin
      .from('galleries')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)

    if (countError) {
      return { allowed: false, reason: 'Failed to check gallery count' }
    }

    // Check if limit reached
    if (count >= plan.maxGalleries) {
      return { 
        allowed: false, 
        reason: `Gallery limit reached (${plan.maxGalleries} max). Upgrade to create more galleries.` 
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking gallery permission:', error)
    return { allowed: false, reason: 'An error occurred' }
  }
}

// Check if user can upload photos to a gallery
export async function canUserUploadPhotos(userId, galleryId) {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('plan_type, plan_status, plan_expires_at')
      .eq('id', userId)
      .single()

    if (profileError) {
      return { allowed: false, reason: 'Failed to fetch user profile' }
    }

    // Check if plan is active
    if (!profile.plan_type || profile.plan_type === 'none' || profile.plan_status !== 'active') {
      return { allowed: false, reason: 'No active plan' }
    }

    const plan = PLAN_LIMITS[profile.plan_type]

    // Check if plan expired
    if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) {
      return { allowed: false, reason: 'Plan expired' }
    }

    // If unlimited photos (payg, studio), allow
    if (plan.maxPhotosPerGallery === null) {
      return { allowed: true }
    }

    // Count photos in gallery
    const { count, error: countError } = await supabaseAdmin
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', galleryId)

    if (countError) {
      return { allowed: false, reason: 'Failed to check photo count' }
    }

    // Check if limit reached
    if (count >= plan.maxPhotosPerGallery) {
      return { 
        allowed: false, 
        reason: `Photo limit reached (${plan.maxPhotosPerGallery} max). Upgrade to upload more photos.` 
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking photo upload permission:', error)
    return { allowed: false, reason: 'An error occurred' }
  }
}

// Check if user has already used test plan
export async function hasUsedTestPlan(userId, stripeCustomerId) {
  try {
    // Check by user ID
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('used_test_plan')
      .eq('id', userId)
      .single()

    if (profileError) {
      return { used: false, error: 'Failed to check test plan usage' }
    }

    if (profileData.used_test_plan) {
      return { used: true, reason: 'You have already used the €1 test plan' }
    }

    // Check by Stripe customer ID (prevents card reuse)
    if (stripeCustomerId) {
      const { data: customerData, error: customerError } = await supabaseAdmin
        .from('profiles')
        .select('id, used_test_plan')
        .eq('stripe_customer_id', stripeCustomerId)
        .eq('used_test_plan', true)
        .maybeSingle()

      if (customerData) {
        return { used: true, reason: 'This payment method has already been used for the test plan' }
      }
    }

    return { used: false }
  } catch (error) {
    console.error('Error checking test plan usage:', error)
    return { used: false, error: 'An error occurred' }
  }
}
