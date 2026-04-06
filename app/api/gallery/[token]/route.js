import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { token } = await params

  try {
    const { data: linkData, error: linkError } = await supabaseAdmin
      .from('gallery_links')
      .select('gallery_id, password_hash, expires_at, allow_download, message')
      .eq('token', token)
      .single()

    if (linkError || !linkData) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This gallery link has expired', expired: true }, { status: 410 })
    }

    const { data: galleryData, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('title, client_name, event_date, expires_at, cover_image_url, owner_id')
      .eq('id', linkData.gallery_id)
      .single()

    if (galleryError || !galleryData) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (galleryData.expires_at && new Date(galleryData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This gallery has expired', expired: true }, { status: 410 })
    }

    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('full_name, bio, website_url, instagram_url, tiktok_url, facebook_url, contact_email')
      .eq('id', galleryData.owner_id)
      .single()

    // Use the earlier of the two expiration dates (photographer's choice vs plan limit)
    const dates = [linkData.expires_at, galleryData.expires_at].filter(Boolean)
    const effectiveExpiry = dates.length
      ? dates.reduce((earliest, d) => new Date(d) < new Date(earliest) ? d : earliest)
      : null

    return NextResponse.json({
      gallery: {
        title: galleryData.title || 'Client Gallery',
        client_name: galleryData.client_name,
        event_date: galleryData.event_date,
        cover_image_url: galleryData.cover_image_url || null,
        expires_at: effectiveExpiry,
      },
      photographer_name: profileData?.full_name || null,
      photographer: {
        bio: profileData?.bio || null,
        website_url: profileData?.website_url || null,
        instagram_url: profileData?.instagram_url || null,
        tiktok_url: profileData?.tiktok_url || null,
        facebook_url: profileData?.facebook_url || null,
        contact_email: profileData?.contact_email || null,
      },
      message: linkData.message || null,
      requires_password: !!linkData.password_hash,
      allow_download: linkData.allow_download !== false
    })
  } catch (error) {
    console.error('Gallery API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
