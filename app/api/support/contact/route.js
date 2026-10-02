import { NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { emailTemplates } from '@/lib/emailTemplates'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { verifyTurnstileToken } from '@/lib/turnstile'

const VALID_CATEGORIES = ['bug', 'billing', 'account', 'gallery', 'other']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request) {
  try {
    const ip = getClientIp(request)
    const { allowed } = await checkRateLimit(`support-contact:${ip}`, { maxAttempts: 5, windowMinutes: 60 })
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const { name, email, category, context, message, turnstileToken } = await request.json()

    const captchaOk = await verifyTurnstileToken(turnstileToken, ip)
    if (!captchaOk) {
      return NextResponse.json({ error: 'Captcha verification failed. Please try again.' }, { status: 400 })
    }

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message is too long' }, { status: 400 })
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const { subject, html } = emailTemplates.supportRequest({
      fromName: typeof name === 'string' ? name.slice(0, 200) : '',
      fromEmail: email,
      category,
      context: typeof context === 'string' ? context.slice(0, 100) : '',
      message: message.trim(),
    })

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: 'support@artydrop.studio',
      reply_to: email,
      subject,
      html,
    })

    if (result.error) {
      console.error('Resend error:', result.error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Support contact error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
