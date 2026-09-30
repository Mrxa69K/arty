import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Clients have no RLS read access to `galleries` (only the owner does) — this
// route is the only way a client's own dashboard can see galleries a
// photographer addressed to their email, matched via supabaseAdmin.
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
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Not authenticated. Please log in.' }, { status: 401 })
    }

    const { data: galleries, error } = await supabaseAdmin
      .from('galleries')
      .select(`
        id, title, client_name, event_date, cover_image_url, expires_at, status,
        profiles ( full_name, business_name ),
        gallery_links ( token, expires_at, password_hash )
      `)
      .ilike('client_email', user.email)
      .eq('status', 'active')
      .order('published_at', { ascending: false })

    if (error) throw error

    const now = new Date()
    const shared = (galleries || [])
      .map((gallery) => {
        const link = gallery.gallery_links?.[0]
        if (!link) return null

        const linkExpiry = link.expires_at ? new Date(link.expires_at) : null
        const galleryExpiry = gallery.expires_at ? new Date(gallery.expires_at) : null
        const expired = (linkExpiry && linkExpiry < now) || (galleryExpiry && galleryExpiry < now)

        return {
          id: gallery.id,
          title: gallery.title,
          photographerName: gallery.profiles?.business_name || gallery.profiles?.full_name || null,
          eventDate: gallery.event_date,
          coverImageUrl: gallery.cover_image_url,
          token: link.token,
          hasPassword: !!link.password_hash,
          expired,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ galleries: shared })
  } catch (error) {
    console.error('Shared galleries fetch error:', error)
    return NextResponse.json({ error: 'Failed to load galleries' }, { status: 500 })
  }
}
