import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'
import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

export function createSession(galleryToken) {
  const payload = `${galleryToken}:${Date.now()}`
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64')
}

export async function POST(request, { params }) {
  try {
    const { password } = await request.json()
    const { token } = await params

    const { data: link, error } = await supabaseAdmin
      .from('gallery_links')
      .select('password_hash, allow_download, expires_at')
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

    const isValid = await bcrypt.compare(password, link.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    return NextResponse.json({
      session: createSession(token),
      allow_download: link.allow_download !== false,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
