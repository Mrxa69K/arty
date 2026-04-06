import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { allowed: false, reason: 'Not authenticated' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Create Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )
    
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { allowed: false, reason: 'Authentication failed' },
        { status: 401 }
      )
    }

    const { action, galleryId, currentPhotoCount, filesToUpload } = await request.json()

    // Get user's profile with plan info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan_type, plan_status, gallery_credits')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
    }

    const userPlan = profile?.plan_type || 'none'

    // Check permissions based on action
    if (action === 'create_gallery') {
      if (userPlan === 'studio') {
        return NextResponse.json({ allowed: true })
      }

      if (userPlan === 'payg') {
        const credits = profile?.gallery_credits || 0
        if (credits <= 0) {
          return NextResponse.json({
            allowed: false,
            reason: 'No gallery credits remaining. Purchase a new gallery to continue.'
          })
        }
        return NextResponse.json({ allowed: true })
      }

      // test: 1 gallery max, none: 0
      const galleryLimits = { test: 1, none: 0 }
      const limit = galleryLimits[userPlan] ?? 0

      const { count } = await supabase
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)

      if (count >= limit) {
        return NextResponse.json({
          allowed: false,
          reason: `You've reached your plan limit. Upgrade to create more.`
        })
      }

      return NextResponse.json({ allowed: true })
    }

    if (action === 'upload_photos') {
      const totalPhotos = (currentPhotoCount || 0) + (filesToUpload || 0)

      if (totalPhotos > limits.maxPhotosPerGallery) {
        return NextResponse.json({
          allowed: false,
          reason: `This would exceed the ${limits.maxPhotosPerGallery} photos limit for the ${userPlan} plan.`
        })
      }

      return NextResponse.json({ allowed: true })
    }

    return NextResponse.json({ allowed: true })

  } catch (error) {
    console.error('Permission check error:', error)
    return NextResponse.json(
      { allowed: false, reason: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
