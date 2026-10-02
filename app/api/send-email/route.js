import { resend } from '@/lib/resend'
import { emailTemplates } from '@/lib/emailTemplates'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request) {
  try {
    // Prior fix added auth + rate limiting, but any signed-in account could
    // still pick an arbitrary "to" — this endpoint is a relay from our
    // verified domain to whatever address the caller supplies. The only
    // legitimate use is "notify the client of MY OWN gallery", so the
    // recipient is always derived server-side from a gallery the caller
    // owns, never taken from the request body.
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

    const { allowed } = await checkRateLimit(`send-email:${user.id}`, { maxAttempts: 20, windowMinutes: 60 })
    if (!allowed) {
      return NextResponse.json({ error: 'Too many emails sent. Please try again later.' }, { status: 429 })
    }

    const { type, galleryId, data } = await request.json()

    if (type !== 'galleryShared' || !galleryId || !data) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
    }

    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('owner_id, client_email')
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery || gallery.owner_id !== user.id) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (!gallery.client_email) {
      return NextResponse.json({ error: 'This gallery has no client email set' }, { status: 400 })
    }

    const to = gallery.client_email

    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      console.error('Email service misconfigured: missing RESEND_API_KEY or RESEND_FROM_EMAIL')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const template = emailTemplates[type]
    const { subject, html } = template(data)

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
      reply_to: 'support@artydrop.studio'
    })

    if (result.error) {
      console.error('Resend error:', result.error)
      return NextResponse.json(
        { error: result.error.message || 'Failed to send email' },
        { status: 400 }
      )
    }

    if (!result.data || !result.data.id) {
      console.error('No ID returned from Resend:', result)
      return NextResponse.json(
        { error: 'Email sent but no confirmation received' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      id: result.data.id
    })

  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}