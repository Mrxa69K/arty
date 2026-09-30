import { resend } from '@/lib/resend'
import { emailTemplates } from '@/lib/emailTemplates'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request) {
  console.log('📧 Email API called')

  try {
    // This was a fully open, unauthenticated email relay — anyone could POST
    // an arbitrary "to" address + template type and have a real email sent
    // from our domain. Only one legitimate caller exists (the gallery
    // publish flow, already authenticated) — require the same Bearer auth
    // here instead of trusting any caller.
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

    const { type, to, data } = await request.json()
    console.log('📧 Request:', { type, to })

    // Check env vars FIRST
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is missing!')
      return NextResponse. json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      console.error('❌ RESEND_FROM_EMAIL is missing!')
      return NextResponse.json(
        { error: 'Email sender not configured' },
        { status:  500 }
      )
    }

    console.log('📧 Using from:', process.env.RESEND_FROM_EMAIL)

    // Validate inputs
    if (!type || !to || ! data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get template
    const template = emailTemplates[type]
    if (! template) {
      return NextResponse.json(
        { error: `Invalid email type: ${type}` },
        { status: 400 }
      )
    }

    // Generate email
    const { subject, html } = template(data)
    console.log('📧 Subject:', subject)

    // Send via Resend
    console.log('📧 Calling Resend.. .')
    
    const result = await resend. emails. send({
      from: process. env.RESEND_FROM_EMAIL,
      to,
      subject,
      html
    })

    // ✅ CHECK FOR ERRORS
    if (result.error) {
      console.error('❌ Resend error:', result.error)
      return NextResponse.json(
        { error: result.error. message || 'Failed to send email' },
        { status: 400 }
      )
    }

    // ✅ CHECK FOR ID
    if (! result.data || !result.data.id) {
      console.error('❌ No ID returned from Resend:', result)
      return NextResponse. json(
        { error: 'Email sent but no confirmation received' },
        { status: 500 }
      )
    }

    console.log('✅ Email sent!  ID:', result.data.id)

    return NextResponse.json({ 
      success: true, 
      id: result.data.id 
    })
    
  } catch (error) {
    console.error('❌ Email error:', error)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error name:', error.name)
    
    return NextResponse.json(
      { 
        error: error.message,
        name: error.name,
        details: error.toString()
      },
      { status: 500 }
    )
  }
}