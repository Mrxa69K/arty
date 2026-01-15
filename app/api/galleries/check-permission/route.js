import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLAN_LIMITS = {
  test: { maxGalleries: 1, maxPhotosPerGallery: 10 },
  payg: { maxGalleries: null, maxPhotosPerGallery: null },
  studio: { maxGalleries: null, maxPhotosPerGallery: null }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    // Get user from session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ 
        allowed: false, 
        reason: 'Not authenticated' 
      }, { status: 401 })
    }

    const { action, galleryId, currentPhotoCount, filesToUpload } = await request.json()

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('plan_type, plan_status, plan_expires_at')
      .eq('id', user.id)
      .single()

    if (!profile || profile.plan_status !== 'active') {
      return NextResponse.json({ 
        allowed: false, 
        reason: 'No active plan' 
      })
    }

    // Check if expired
    if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) {
      return NextResponse.json({ 
        allowed: false, 
        reason: 'Your plan has expired' 
      })
    }

    const limits = PLAN_LIMITS[profile.plan_type]

    if (action === 'create_gallery') {
      if (limits.maxGalleries === null) return NextResponse.json({ allowed: true })

      const { count } = await supabaseAdmin
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)

      if (count >= limits.maxGalleries) {
        return NextResponse.json({ 
          allowed: false, 
          reason: `Gallery limit reached (${limits.maxGalleries} max). Upgrade to create more.` 
        })
      }

      return NextResponse.json({ allowed: true })
    }

    if (action === 'upload_photos' && galleryId) {
      if (limits.maxPhotosPerGallery === null) return NextResponse.json({ allowed: true })

      // ✅ Check if total would exceed limit
      const totalAfterUpload = (currentPhotoCount || 0) + (filesToUpload || 1)

      if (totalAfterUpload > limits.maxPhotosPerGallery) {
        return NextResponse.json({ 
          allowed: false, 
          reason: `Photo limit reached. Your plan allows ${limits.maxPhotosPerGallery} photos maximum.` 
        })
      }

      return NextResponse.json({ allowed: true })
    }

    return NextResponse.json({ 
      allowed: false, 
      reason: 'Invalid action' 
    }, { status: 400 })

  } catch (error) {
    console.error('Permission check error:', error)
    return NextResponse.json({ 
      allowed: false, 
      reason: 'An error occurred' 
    }, { status: 500 })
  }
}
