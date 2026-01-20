import { resend } from '@/lib/resend'
import { emailTemplates } from '@/lib/emailTemplates'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { type, to, data } = await request.json()

    // Validate
    if (!type || !to || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get template
    const template = emailTemplates[type]
    if (!template) {
      return NextResponse.json(
        { error: `Invalid email type: ${type}` },
        { status: 400 }
      )
    }

    // Generate email
    const { subject, html } = template(data)

    // Send via Resend
    const result = await resend.emails.send({
      from: process.env. RESEND_FROM_EMAIL,
      to,
      subject,
      html
    })

    console.log('✅ Email sent successfully:', { type, to, id:  result.id })

    return NextResponse.json({ success: true, id: result.id })
    
  } catch (error) {
    console.error('❌ Email error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}