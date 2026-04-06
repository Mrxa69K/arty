export const PLAN_LIMITS = {
  none: {
    name: 'No Plan',
    maxGalleries: 0,
    maxPhotos: 0,
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
    oneTimeOnly: true // ✅ Can only be used once per person
  },
  payg: {
    name: 'Pay as you go',
    maxGalleries: null, // unlimited galleries
    maxPhotosPerGallery: null, // unlimited photos per gallery
    durationDays: null, // no expiration
    pricePerGallery: 4.90,
    currency: 'eur'
  },
  studio: {
    name: 'Studio',
    maxGalleries: null, // unlimited
    maxPhotosPerGallery: null, // unlimited
    durationDays: 30, // monthly subscription
    price: 19,
    currency: 'eur',
    recurring: true
  }
}

// Helper function to check if user can perform action
export function canUserCreateGallery(userProfile, currentGalleriesCount) {
  const plan = PLAN_LIMITS[userProfile.plan_type || 'none']
  
  // Check if plan is active
  if (userProfile.plan_status !== 'active') {
    return { allowed: false, reason: 'No active plan' }
  }
  
  // Check if plan expired (for test plan)
  if (userProfile.plan_expires_at && new Date(userProfile.plan_expires_at) < new Date()) {
    return { allowed: false, reason: 'Plan expired' }
  }
  
  // Check gallery limit
  if (plan.maxGalleries !== null && currentGalleriesCount >= plan.maxGalleries) {
    return { allowed: false, reason: 'Gallery limit reached' }
  }
  
  return { allowed: true }
}

export function canUserUploadPhotos(userProfile, galleryId, currentPhotosInGallery) {
  const plan = PLAN_LIMITS[userProfile.plan_type || 'none']
  
  if (userProfile.plan_status !== 'active') {
    return { allowed: false, reason: 'No active plan' }
  }
  
  if (plan.maxPhotosPerGallery !== null && currentPhotosInGallery >= plan.maxPhotosPerGallery) {
    return { allowed: false, reason: `Photo limit reached (max ${plan.maxPhotosPerGallery})` }
  }
  
  return { allowed: true }
}
