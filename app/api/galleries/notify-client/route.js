import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Best-effort, fire-and-forget: if the gallery's client_email matches an
// existing client account, drop a notification in their bell. Silently a
// no-op if there's no matching account yet (they haven't signed up) —
// clients can still always find the gallery via app/client/shared-galleries
// once they do sign up, this is purely a nice-to-have nudge.
export async function POST(request) {
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

    const { galleryId } = await request.json()
    if (!galleryId) {
      return NextResponse.json({ error: 'Missing galleryId' }, { status: 400 })
    }

    const { data: gallery } = await supabaseAdmin
      .from('galleries')
      .select('title, client_email, owner_id')
      .eq('id', galleryId)
      .single()

    if (!gallery || gallery.owner_id !== user.id || !gallery.client_email) {
      return NextResponse.json({ ok: true }) // nothing to do, not an error
    }

    const { data: clientProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('email', gallery.client_email)
      .eq('user_type', 'client')
      .maybeSingle()

    if (clientProfile) {
      await supabaseAdmin.from('notifications').insert({
        user_id: clientProfile.id,
        type: 'gallery_shared',
        title: 'A new gallery is ready for you',
        body: gallery.title || 'Your photographer just shared a new collection.',
        link_url: '/client/dashboard',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Notify client error:', error)
    return NextResponse.json({ ok: false })
  }
}
