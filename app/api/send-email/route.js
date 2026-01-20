import { resend } from '@/lib/resend'
import { emailTemplates } from '@/lib/emailTemplates'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { type, to, data } = await request.json()

    const template = emailTemplates[type]
    if (!template) {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    const { subject, html } = template(data)

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject,
      html
    })

    return NextResponse. json({ success: true, id: result.id })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}