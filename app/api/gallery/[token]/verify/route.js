import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/gallerySession'

const MAX_ATTEMPTS = 10
const LOCKOUT_MINUTES = 15

export async function POST(request, { params }) {
  try {
    const { password } = await request.json()
    const { token } = await params

    const { data: link, error } = await supabaseAdmin
      .from('gallery_links')
      .select('id, password_hash, allow_download, expires_at, failed_attempts, locked_until')
      .eq('token', token)
      .single()

    if (error || !link) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Gallery has expired', expired: true }, { status: 410 })
    }

    if (!link.password_hash) {
      return NextResponse.json({
        session: createSession(token),
        allow_download: link.allow_download !== false,
      })
    }

    if (link.locked_until && new Date(link.locked_until) > new Date()) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const isValid = await bcrypt.compare(password, link.password_hash)

    if (!isValid) {
      const attempts = (link.failed_attempts || 0) + 1
      const updates = { failed_attempts: attempts }
      if (attempts >= MAX_ATTEMPTS) {
        updates.locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
      }
      await supabaseAdmin.from('gallery_links').update(updates).eq('id', link.id)

      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    if (link.failed_attempts > 0 || link.locked_until) {
      await supabaseAdmin
        .from('gallery_links')
        .update({ failed_attempts: 0, locked_until: null })
        .eq('id', link.id)
    }

    return NextResponse.json({
      session: createSession(token),
      allow_download: link.allow_download !== false,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
